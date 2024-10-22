package startchallenge

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/expression"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/ses"
	"github.com/aws/aws-sdk-go-v2/service/ses/types"
	"github.com/josepheid/upfront/api/models"
	"github.com/josepheid/upfront/internal/respond"
)

type Handler struct {
	logger    *slog.Logger
	ses       *ses.Client
	ddbc      *dynamodb.Client
	tableName string
}

type StartChallengeRequest struct {
	Email         string `json:"email"`
	RequestOrigin string `json:"requestOrigin"`
}

type StartChallengeResponse struct {
	ChallengeStarted bool `json:"challengeStarted"`
	JobsFound        bool `json:"jobsFound"`
}

func NewHandler(logger *slog.Logger, ses *ses.Client, ddbc *dynamodb.Client, tableName string) (Handler, error) {
	return Handler{
		logger:    logger,
		ses:       ses,
		ddbc:      ddbc,
		tableName: tableName,
	}, nil
}

var priceFactors = map[models.PlanType]int{
	models.Standard: 35,
	models.Premium:  90,
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
		IndexName:                 aws.String("allJobsIndex"),
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

	magicLink := request.RequestOrigin
	emailBody := aws.String(fmt.Sprintf(`<h1>Please use the link below to log in:</h1><br/><br/>
	<a href='%s'>Log In</a>`, magicLink))

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
