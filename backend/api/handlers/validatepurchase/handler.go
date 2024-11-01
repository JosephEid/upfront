package validatepurchase

import (
	"context"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/a-h/pathvars"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/expression"
	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider"
	cognitotypes "github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider/types"
	"golang.org/x/exp/rand"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/josepheid/upfront/api/models"
	"github.com/josepheid/upfront/internal/respond"
	"github.com/stripe/stripe-go/v80"
	"github.com/stripe/stripe-go/v80/checkout/session"
)

type Handler struct {
	logger     *slog.Logger
	stripeKey  string
	tableName  string
	ddbc       *dynamodb.Client
	cipc       *cognitoidentityprovider.Client
	userPoolId string
}

type ValidatePurchaseResponse struct {
	URL string `json:"url"`
}

var matcher = pathvars.NewExtractor("*/upfront/validate-purchase/{id}")

func NewHandler(logger *slog.Logger, stripeKey string, tableName string, ddbc *dynamodb.Client, cipc *cognitoidentityprovider.Client, userPoolId string) (Handler, error) {
	return Handler{
		logger:     logger,
		stripeKey:  stripeKey,
		tableName:  tableName,
		ddbc:       ddbc,
		cipc:       cipc,
		userPoolId: userPoolId,
	}, nil
}

func (h Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	pathValues, ok := matcher.Extract(r.URL)
	if !ok {
		h.logger.Error("missing parameters in path")
		respond.WithError(w, "missing parameters in path", http.StatusBadRequest)
		return
	}

	id, ok := pathValues["id"]
	if !ok || id == "" {
		h.logger.Error("missing id parameter in path")
		respond.WithError(w, "missing id parameter in path", http.StatusBadRequest)
		return
	}
	h.logger = h.logger.With("id", id)
	h.logger.Info("id extracted")
	stripe.Key = h.stripeKey

	pk, err := attributevalue.Marshal(models.FormatPK(id))
	if err != nil {
		h.logger.Error("error marshalling PK", "error", err)
		respond.WithError(w, "error marshalling PK", http.StatusInternalServerError)
		return
	}

	data, err := h.ddbc.Query(context.TODO(), &dynamodb.QueryInput{
		TableName:              aws.String(h.tableName),
		KeyConditionExpression: aws.String("PK = :pk"), // Only require the partition key
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":pk": pk, // Use the partition key
		},
	})

	if err != nil {
		h.logger.Error("error getting job", "error", err)
		respond.WithError(w, "error getting job", http.StatusInternalServerError)
		return
	}

	if data.Items[0] == nil {
		h.logger.Error("job not found", "error", err)
		respond.WithError(w, "job not found", http.StatusNotFound)
		return
	}

	item := models.JobPostItem{}

	err = attributevalue.UnmarshalMap(data.Items[0], &item)
	if err != nil {
		h.logger.Error("error unmarshalling item", "error", err)
		respond.WithError(w, "error unmarshalling item", http.StatusInternalServerError)
		return
	}

	params := &stripe.CheckoutSessionParams{}
	result, err := session.Get(
		item.SessionID,
		params,
	)

	if err != nil {
		h.logger.Error("error retrieving session", "error", err)
		respond.WithError(w, "error retrieving session", http.StatusInternalServerError)
		return
	}

	if result.PaymentStatus != stripe.CheckoutSessionPaymentStatusPaid {
		h.logger.Error("checkout session not paid")
		respond.WithError(w, "checkout session not paid", http.StatusPaymentRequired)
		return
	}

	now := time.Now()
	updatedAt, expiresAt := now, now.AddDate(0, 0, 90)

	upd := expression.
		Set(expression.Name("status"), expression.Value(models.Active)).
		Set(expression.Name("updatedAt"), expression.Value(updatedAt.Format(time.RFC3339))).
		Set(expression.Name("expiresAt"), expression.Value(expiresAt.Format(time.RFC3339)))

	expr, err := expression.NewBuilder().WithUpdate(upd).Build()

	if err != nil {
		h.logger.Error("error creating expression", "error", err)
		respond.WithError(w, "error creating expression", http.StatusInternalServerError)
		return
	}

	sk, err := attributevalue.Marshal(item.CreatedAt)
	if err != nil {
		h.logger.Error("error marshalling SK", "error", err)
		respond.WithError(w, "error marshalling SK", http.StatusInternalServerError)
		return
	}

	out, err := h.ddbc.UpdateItem(context.TODO(), &dynamodb.UpdateItemInput{
		Key:                       map[string]types.AttributeValue{"PK": pk, "SK": sk},
		TableName:                 aws.String(h.tableName),
		ExpressionAttributeNames:  expr.Names(),
		ExpressionAttributeValues: expr.Values(),
		UpdateExpression:          expr.Update(),
		ReturnValues:              types.ReturnValueAllNew,
	})
	if err != nil {
		h.logger.Error("error updating item", "error", err)
		respond.WithError(w, "error updating item", http.StatusInternalServerError)
		return
	}

	itemOut := models.JobPostItem{}

	err = attributevalue.UnmarshalMap(out.Attributes, &itemOut)

	if err != nil {
		h.logger.Error("error unmarshalling update item output", "error", err)
		respond.WithError(w, "error unmarshalling update item output", http.StatusInternalServerError)
		return
	}

	// Create user in cognito user pool as it has been confirmed they have paid for a job post, only if they don't already exist!
	_, err = h.cipc.AdminGetUser(context.Background(), &cognitoidentityprovider.AdminGetUserInput{
		UserPoolId: aws.String(h.userPoolId),
		Username:   aws.String(strings.ToLower(item.LoginEmail)),
	})

	if err == nil {
		h.logger.Info("user already exists!", "email", strings.ToLower(item.LoginEmail))
		respond.WithJSON(w, itemOut, http.StatusOK)
		return
	}

	_, err = h.cipc.AdminCreateUser(context.Background(), &cognitoidentityprovider.AdminCreateUserInput{
		UserPoolId:             aws.String(h.userPoolId),
		Username:               aws.String(strings.ToLower(item.LoginEmail)),
		MessageAction:          cognitotypes.MessageActionTypeSuppress, // Suppress the temporary password email
		DesiredDeliveryMediums: []cognitotypes.DeliveryMediumType{},    // Don't send any messages
		UserAttributes: []cognitotypes.AttributeType{
			{
				Name:  aws.String("email"),
				Value: aws.String(strings.ToLower(item.LoginEmail)),
			},
			{
				Name:  aws.String("email_verified"),
				Value: aws.String("true"),
			},
		},
	})

	if err != nil {
		h.logger.Error("error creating user in userpool", "error", err)
		respond.WithError(w, "error creating user in userpool", http.StatusInternalServerError)
		return
	}

	_, err = h.cipc.AdminSetUserPassword(context.Background(), &cognitoidentityprovider.AdminSetUserPasswordInput{
		UserPoolId: aws.String(h.userPoolId),
		Username:   aws.String(strings.ToLower(item.LoginEmail)),
		Password:   aws.String(generateSecureRandomPassword()), // Generate a secure random password
		Permanent:  true,                                       // This prevents FORCE_CHANGE_PASSWORD status
	})

	if err != nil {
		h.logger.Error("error confirming user in userpool", "error", err)
		respond.WithError(w, "error confirming user in userpool", http.StatusInternalServerError)
		return
	}

	respond.WithJSON(w, itemOut, http.StatusOK)
}

func generateSecureRandomPassword() string {
	const length = 32
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|"

	b := make([]byte, length)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}
