package startchallenge

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/expression"
	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider"
	cognitotypes "github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider/types"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/aws/aws-sdk-go-v2/service/ses"
	"github.com/aws/aws-sdk-go-v2/service/ses/types"
	"github.com/josepheid/upfront/api/models"
	"github.com/josepheid/upfront/internal/respond"
)

type Handler struct {
	logger     *slog.Logger
	ses        *ses.Client
	ddbc       *dynamodb.Client
	kmsc       *kms.Client
	cipc       *cognitoidentityprovider.Client
	tableName  string
	kmsKeyID   string
	userPoolId string
}

type StartChallengeRequest struct {
	Email         string `json:"email"`
	RequestOrigin string `json:"requestOrigin"`
}

type StartChallengeResponse struct {
	ChallengeStarted bool `json:"challengeStarted"`
	JobsFound        bool `json:"jobsFound"`
}

type TokenPayload struct {
	Email      string `json:"email"`
	Expiration string `json:"expiration"`
}

func NewHandler(logger *slog.Logger, ses *ses.Client, ddbc *dynamodb.Client, kmsc *kms.Client, cipc *cognitoidentityprovider.Client, tableName, kmsKeyID, userPoolId string) (Handler, error) {
	return Handler{
		logger:     logger,
		ses:        ses,
		ddbc:       ddbc,
		kmsc:       kmsc,
		cipc:       cipc,
		tableName:  tableName,
		kmsKeyID:   kmsKeyID,
		userPoolId: userPoolId,
	}, nil
}

func (h Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	var request StartChallengeRequest
	err := json.NewDecoder(r.Body).Decode(&request)
	keyCondition := expression.KeyEqual(expression.Key("loginEmail"), expression.Value(request.Email))

	h.logger.Info("Incoming request", "requestBody", request)
	if err != nil {
		h.logger.Error("error decoding request body", "error", err)
		respond.WithError(w, "error decoding request body", http.StatusBadRequest)
		return
	}

	builder := expression.NewBuilder().WithKeyCondition(keyCondition)

	expr, err := builder.Build()

	if err != nil {
		h.logger.Error("error building expression", "error", err)
		respond.WithError(w, "error building expression", http.StatusInternalServerError)
		return
	}

	data, err := h.ddbc.Query(context.TODO(), &dynamodb.QueryInput{
		TableName:                 aws.String(h.tableName),
		IndexName:                 aws.String("emailIndex"),
		ExpressionAttributeNames:  expr.Names(),
		ExpressionAttributeValues: expr.Values(),
		KeyConditionExpression:    expr.KeyCondition(),
	})
	if err != nil {
		h.logger.Error("error querying all jobs gsi", "error", err)
		respond.WithError(w, "error querying all jobs gsi", http.StatusInternalServerError)
		return
	}

	jobPosts := []models.JobPostItem{}

	err = attributevalue.UnmarshalListOfMaps(data.Items, &jobPosts)
	if err != nil {
		h.logger.Error("error unmarshalling list of maps", "error", err)
		respond.WithError(w, "error unmarshalling list of maps", http.StatusInternalServerError)
		return
	}

	if len(jobPosts) == 0 {
		h.logger.Warn("No job posts found, not starting challenge")
		respond.WithJSON(w, StartChallengeResponse{ChallengeStarted: false, JobsFound: false}, http.StatusNotFound)
		return
	}

	h.logger.Info("Job posts found", "jobPostCount", len(jobPosts))

	now := time.Now()
	expires := now.Add(time.Minute * 10).Format(time.RFC3339)
	payload := TokenPayload{
		Email:      request.Email,
		Expiration: expires,
	}
	rawPayload, err := json.Marshal(payload)
	if err != nil {
		h.logger.Error("error marshalling token payload", "error", err)
		respond.WithError(w, "error marshalling token payload", http.StatusInternalServerError)
		return
	}

	tokenRaw, err := h.encrypt(rawPayload)
	if err != nil {
		h.logger.Error("error encrypting token", "error", err)
		respond.WithError(w, "error encrypting token", http.StatusInternalServerError)
		return
	}

	tokenB64 := base64.StdEncoding.EncodeToString(tokenRaw)
	token := url.QueryEscape(tokenB64)

	magicLink := fmt.Sprintf("%s/magic-link?email=%s&token=%s", request.RequestOrigin, request.Email, token)
	emailBody := aws.String(fmt.Sprintf(`<h1>You are nearly there! Please use the link below to log in:</h1><br/><br/>
	<a href='%s'>Log In</a>`, magicLink))

	_, err = h.cipc.AdminUpdateUserAttributes(context.Background(), &cognitoidentityprovider.AdminUpdateUserAttributesInput{
		UserPoolId: aws.String(h.userPoolId),
		Username:   aws.String(request.Email),
		UserAttributes: []cognitotypes.AttributeType{
			{
				Name:  aws.String("custom:authChallenge"),
				Value: aws.String(tokenB64)},
		},
	})

	if err != nil {
		h.logger.Error("error updating user atts", "error", err)
		respond.WithError(w, "error updating user atts", http.StatusInternalServerError)
		return
	}

	_, err = h.ses.SendEmail(context.Background(), &ses.SendEmailInput{
		Destination: &types.Destination{
			ToAddresses: []string{strings.ToLower(request.Email)},
		},
		Message: &types.Message{
			Subject: &types.Content{Data: aws.String("Your Upfront Login Link")},
			Body:    &types.Body{Html: &types.Content{Data: emailBody}},
		},
		Source: aws.String("josephceid@gmail.com"),
	})

	if err != nil {
		h.logger.Error("error sending email via ses", "error", err)
		respond.WithJSON(w, StartChallengeResponse{ChallengeStarted: false, JobsFound: true}, http.StatusInternalServerError)
		return
	}

	respond.WithJSON(w, StartChallengeResponse{ChallengeStarted: true, JobsFound: true}, http.StatusCreated)
}

func (h Handler) encrypt(input []byte) ([]byte, error) {
	resp, err := h.kmsc.Encrypt(context.Background(), &kms.EncryptInput{
		KeyId:     &h.kmsKeyID,
		Plaintext: input,
	})

	if err != nil {
		return []byte{}, err
	}

	return resp.CiphertextBlob, nil
}
