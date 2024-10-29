package getrecruiterjobposts

import (
	"context"
	"log/slog"
	"net/http"

	"github.com/a-h/pathvars"
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

var matcher = pathvars.NewExtractor("*/upfront/recruiter-posts/{email}")

func (h Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	jobPosts := []models.JobPostItem{}

	pathValues, ok := matcher.Extract(r.URL)
	if !ok {
		h.logger.Error("missing parameters in path")
		respond.WithError(w, "missing parameters in path", http.StatusBadRequest)
		return
	}

	email, ok := pathValues["email"]
	if !ok || email == "" {
		h.logger.Error("missing email parameter in path")
		respond.WithError(w, "missing email parameter in path", http.StatusBadRequest)
		return
	}

	h.logger.Info("email extracted", "email", email)

	// Build the expression using key condition and filter
	keyEx := expression.Key("loginEmail").Equal(expression.Value(email))

	expr, err := expression.NewBuilder().WithKeyCondition(keyEx).Build()

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
