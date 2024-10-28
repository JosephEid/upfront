package getrecruiterjobposts

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/expression"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/josepheid/upfront/api/models"
	"github.com/josepheid/upfront/internal/respond"
)

type Handler struct {
	logger    *slog.Logger
	tableName string
	ddbc      *dynamodb.Client
}

type RecruiterJobPostsRequest struct {
	Email string `json:"email"`
}

func NewHandler(logger *slog.Logger, tableName string, ddbc *dynamodb.Client) (Handler, error) {
	return Handler{
		logger:    logger,
		tableName: tableName,
		ddbc:      ddbc,
	}, nil
}

func (h Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	var request RecruiterJobPostsRequest
	err := json.NewDecoder(r.Body).Decode(&request)

	if err != nil {
		h.logger.Error("error decoding request body", "error", err)
		respond.WithError(w, "error decoding request body", http.StatusBadRequest)
		return
	}
	jobPosts := []models.JobPostItem{}

	email := r.URL.Query().Get("email")

	if email == "" {
		h.logger.Error("no email provided")
		respond.WithError(w, "no email provided", http.StatusBadRequest)
		return
	}

	keyCondition := expression.KeyEqual(expression.Key("loginEmail"), expression.Value(email))

	// Build the expression using key condition and filter
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
		FilterExpression:          expr.Filter(),
	})
	if err != nil {
		h.logger.Error("error querying email gsi", "error", err)
		respond.WithError(w, "error querying email gsi", http.StatusInternalServerError)
		return
	}
	err = attributevalue.UnmarshalListOfMaps(data.Items, &jobPosts)
	if err != nil {
		h.logger.Error("error unmarshalling list of maps", "error", err)
		respond.WithError(w, "error unmarshalling list of maps", http.StatusInternalServerError)
		return
	}

	respond.WithJSON(w, jobPosts, http.StatusOK)
}
