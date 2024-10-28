package createcheckoutsession

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/google/uuid"
	"github.com/josepheid/upfront/api/models"
	"github.com/josepheid/upfront/internal/respond"
	"github.com/stripe/stripe-go/v80"
	"github.com/stripe/stripe-go/v80/checkout/session"
	"github.com/stripe/stripe-go/v80/price"
)

type Handler struct {
	logger    *slog.Logger
	stripeKey string
	ddbc      *dynamodb.Client
	tableName string
}

type CheckoutSessionRequest struct {
	Amount      int64  `json:"amount"`
	SuccessURL  string `json:"successUrl"`
	ProductName string `json:"productName"`
}

type CheckoutSessionResponse struct {
	URL string `json:"url"`
}

func NewHandler(logger *slog.Logger, stripeKey string, ddbc *dynamodb.Client, tableName string) (Handler, error) {
	return Handler{
		logger:    logger,
		stripeKey: stripeKey,
		ddbc:      ddbc,
		tableName: tableName,
	}, nil
}

var priceFactors = map[models.PlanType]int{
	models.Standard: 35,
	models.Premium:  90,
}

func (h Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	var request models.JobPostFormProps
	err := json.NewDecoder(r.Body).Decode(&request)

	h.logger.Info("Incoming request", "requestBody", request)
	if err != nil {
		h.logger.Error("error decoding request body", "error", err)
		respond.WithError(w, "error decoding request body", http.StatusBadRequest)
		return
	}

	stripe.Key = h.stripeKey

	totalAmount := ((request.PlanDuration * priceFactors[request.PlanType]) / 30) * 100

	priceParams := &stripe.PriceParams{
		Currency:    stripe.String(string(stripe.CurrencyGBP)),
		UnitAmount:  stripe.Int64(int64(totalAmount)),
		ProductData: &stripe.PriceProductDataParams{Name: stripe.String(fmt.Sprintf("%s plan for %d days.", request.PlanType, request.PlanDuration))},
	}
	priceResult, err := price.New(priceParams)
	if err != nil {
		h.logger.Error("Error creating price", "error", err)
		respond.WithError(w, "error creating price", http.StatusInternalServerError)
		return
	}

	jobID := uuid.New()

	checkoutSessionParams := &stripe.CheckoutSessionParams{
		ClientReferenceID: stripe.String(jobID.String()),
		SuccessURL:        stripe.String(fmt.Sprintf("%s?id=%s", request.SuccessURL, jobID.String())),
		CancelURL:         stripe.String(request.CancelURL),
		CustomerEmail:     stripe.String(request.LoginEmail),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(priceResult.ID),
				Quantity: stripe.Int64(1),
			},
		},
		Mode: stripe.String(string(stripe.CheckoutSessionModePayment)),
	}
	checkoutSessionResult, err := session.New(checkoutSessionParams)
	if err != nil {
		h.logger.Error("error creating checkout session", "error", err)
		respond.WithError(w, "error creating checkout session", http.StatusInternalServerError)
		return
	}

	now := time.Now()
	createdAt, updatedAt := now, now

	jobPostItem := models.JobPostItem{
		JobPostFormProps:  request,
		PK:                models.FormatPK(jobID.String()),
		SK:                createdAt.Format(time.RFC3339),
		JobID:             jobID.String(),
		SessionID:         checkoutSessionResult.ID,
		CreatedAt:         createdAt.Format(time.RFC3339),
		UpdatedAt:         updatedAt.Format(time.RFC3339),
		Status:            models.PendingPayment,
		ClickedApplyCount: 0,
		AllJobs:           "ALL_JOBS",
	}

	data, err := attributevalue.MarshalMap(jobPostItem)

	if err != nil {
		h.logger.Error("error marshalling job item", "error", err)
		respond.WithError(w, "error marshalling job item", http.StatusInternalServerError)
		return
	}

	_, err = h.ddbc.PutItem(context.TODO(), &dynamodb.PutItemInput{
		TableName: aws.String(h.tableName),
		Item:      data,
	})

	if err != nil {
		h.logger.Error("error putting item", "error", err)
		respond.WithError(w, "error putting item", http.StatusInternalServerError)
		return
	}

	respond.WithJSON(w, CheckoutSessionResponse{URL: checkoutSessionResult.URL}, http.StatusCreated)
}
