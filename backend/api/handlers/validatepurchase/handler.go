package validatepurchase

import (
	"context"
	"log/slog"
	"net/http"

	"github.com/a-h/pathvars"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/expression"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/josepheid/upfront/api/models"
	"github.com/josepheid/upfront/internal/respond"
	"github.com/stripe/stripe-go/v80"
	"github.com/stripe/stripe-go/v80/checkout/session"
)

type Handler struct {
	logger    *slog.Logger
	stripeKey string
	tableName string
	ddbc      *dynamodb.Client
}

type ValidatePurchaseResponse struct {
	URL string `json:"url"`
}

var matcher = pathvars.NewExtractor("*/upfront/validate-purchase/{id}")

func NewHandler(logger *slog.Logger, stripeKey string, tableName string, ddbc *dynamodb.Client) (Handler, error) {
	return Handler{
		logger:    logger,
		stripeKey: stripeKey,
		tableName: tableName,
		ddbc:      ddbc,
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

	upd := expression.
		Set(expression.Name("status"), expression.Value(models.Active))

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
		h.logger.Error("error creating expression", "error", err)
		respond.WithError(w, "error creating expression", http.StatusInternalServerError)
		return
	}

	respond.WithJSON(w, itemOut, http.StatusOK)
}
