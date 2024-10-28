package getjobposts

import (
	"context"
	"log/slog"
	"net/http"
	"strconv"

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
	var filter expression.ConditionBuilder
	hasFilter := false
	keyCondition := expression.KeyEqual(expression.Key("allJobs"), expression.Value("ALL_JOBS"))
	// Extract salary from the query params and build the filter expression
	salary := r.URL.Query().Get("salary")

	if salary != "" {
		h.logger.Info("incoming salary " + salary)
		intSalary, err := strconv.Atoi(salary)
		if err != nil {
			h.logger.Error("salary provided but could not convert to int", "error", err)
			respond.WithError(w, "salary provided but could not convert to int", http.StatusBadRequest)
			return
		}
		// Initialize filter with the first condition (maxSalary)
		filter = expression.Name("maxSalary").GreaterThanEqual(expression.Value(intSalary))
		hasFilter = true
	}

	// Extract location from the query params and build the filter expression
	location := r.URL.Query().Get("location")
	if location != "" {
		h.logger.Info("incoming location " + location)
		if hasFilter {
			// Add location filter if a previous filter exists
			filter = filter.And(expression.Name("location").Contains(location))
		} else {
			// Initialize filter with the location condition if no other filter exists
			filter = expression.Name("location").Contains(location)
			hasFilter = true
		}
	}

	// Extract title from the query params and build the filter expression
	title := r.URL.Query().Get("title")
	if title != "" {
		h.logger.Info("incoming title " + title)
		if hasFilter {
			// Add title filter if a previous filter exists
			filter = filter.And(expression.Name("title").Contains(title))
		} else {
			// Initialize filter with the title condition if no other filter exists
			filter = expression.Name("title").Contains(title)
			hasFilter = true
		}
	}

	// Build the expression using key condition and filter
	builder := expression.NewBuilder().WithKeyCondition(keyCondition)
	if hasFilter {
		builder = builder.WithFilter(filter) // Only add the filter if conditions exist
	}

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
		FilterExpression:          expr.Filter(),
	})
	if err != nil {
		h.logger.Error("error querying all jobs gsi", "error", err)
		respond.WithError(w, "error querying all jobs gsi", http.StatusInternalServerError)
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
