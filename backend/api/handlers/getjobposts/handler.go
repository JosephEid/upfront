package getjobposts

import (
	"context"
	"log/slog"
	"net/http"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/josepheid/upfront/api/models"
	"github.com/josepheid/upfront/internal/respond"
)

type Handler struct {
	logger    *slog.Logger
	tableName string
	ddbc      *dynamodb.Client
}

type ValidatePurchaseResponse struct {
	URL string `json:"url"`
}

func NewHandler(logger *slog.Logger, tableName string, ddbc *dynamodb.Client) (Handler, error) {
	return Handler{
		logger:    logger,
		tableName: tableName,
		ddbc:      ddbc,
	}, nil
}

func (h Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	jobPosts := []models.JobPostItem{}

	data, err := h.ddbc.Scan(context.TODO(), &dynamodb.ScanInput{
		TableName: aws.String(h.tableName),
		// FilterExpression: ,
	})
	if err != nil {
		h.logger.Error("error getting all job posts", "error", err)
		respond.WithError(w, "error getting all job posts", http.StatusInternalServerError)
		return
	}

	err = attributevalue.UnmarshalListOfMaps(data.Items, &jobPosts)
	if err != nil {
		h.logger.Error("error unmarshalling job posts", "error", err)
		respond.WithError(w, "error unmarshalling job posts", http.StatusInternalServerError)
		return
	}

	respond.WithJSON(w, jobPosts, http.StatusOK)
}
