package createcheckoutsession

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/google/uuid"
	"github.com/josepheid/upfront/internal/respond"
	"github.com/stripe/stripe-go/v80"
	"github.com/stripe/stripe-go/v80/checkout/session"
	"github.com/stripe/stripe-go/v80/price"
)

type Handler struct {
	logger    *slog.Logger
	stripeKey string
	tableName string
}

type CheckoutSessionRequest struct {
	Amount      int64  `json:"amount"`
	SuccessURL  string `json:"successUrl"`
	ProductName string `json:"productName"`
}

type Currency string

const (
	GBP Currency = "GBP"
	USD Currency = "USD"
	EUR Currency = "EUR"
	AUD Currency = "AUD"
	CAD Currency = "CAD"
	SGD Currency = "SGD"
	CHF Currency = "CHF"
	INR Currency = "INR"
	JPY Currency = "JPY"
)

type PlanType string

const (
	Standard PlanType = "Standard"
	Premium  PlanType = "Premium"
)

type Status string

const (
	Active         Status = "Active"
	Expired        Status = "Expired"
	PendingPayment Status = "PendingPayment"
)

type JobPostFormProps struct {
	CompanyLogoURL  *string  `json:"companyLogoURL,omitempty" dynamodbav:"companyLogoURL"`
	CompanyName     string   `json:"companyName" dynamodbav:"companyLogoURL"`
	CompanyWebsite  string   `json:"companyWebsite" dynamodbav:"companyLogoURL"`
	Currency        Currency `json:"currency" dynamodbav:"companyLogoURL"`
	Description     string   `json:"description" dynamodbav:"companyLogoURL"`
	HowToApply      string   `json:"howToApply" dynamodbav:"companyLogoURL"`
	Location        string   `json:"location" dynamodbav:"companyLogoURL"`
	MaxSalary       int      `json:"maxSalary" dynamodbav:"companyLogoURL"`
	MinSalary       int      `json:"minSalary" dynamodbav:"companyLogoURL"`
	Title           string   `json:"title" dynamodbav:"companyLogoURL"`
	VisaSponsorship bool     `json:"visaSponsorship" dynamodbav:"companyLogoURL"`
	LoginEmail      string   `json:"loginEmail" dynamodbav:"companyLogoURL"`
	PlanDuration    int      `json:"planDuration" dynamodbav:"companyLogoURL"`
	PlanType        PlanType `json:"planType" dynamodbav:"companyLogoURL"`
	SuccessURL      string   `json:"successURL" dynamodbav:"companyLogoURL"`
	CancelURL       string   `json:"cancelURL" dynamodbav:"companyLogoURL"`
}

type JobPostItem struct {
	JobPostFormProps
	PK        string `dynamodbav:"PK" json:"PK"`
	SK        string `dynamodbav:"SK" json:"SK"`
	JobID     string `dynamodbav:"jobID" json:"jobID"`
	SessionID string `dynamodbav:"sessionID" json:"sessionID"`
	CreatedAt string `dynamodbav:"createdAt" json:"createdAt"`
	UpdatedAt string `dynamodbav:"updatedAt" json:"updatedAt"`
	Status    Status `dynamodbav:"status" json:"status"`
}

type CheckoutSessionResponse struct {
	URL string `json:"url"`
}

func NewHandler(logger *slog.Logger, stripeKey string, tableName string) (Handler, error) {
	return Handler{
		logger:    logger,
		stripeKey: stripeKey,
		tableName: tableName,
	}, nil
}

var priceFactors = map[PlanType]int{
	Standard: 35,
	Premium:  90,
}

func (h Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	var request JobPostFormProps
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
		SuccessURL:        stripe.String(request.SuccessURL),
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

	jobPostItem := JobPostItem{
		JobPostFormProps: request,
		PK:               formatPK(jobID.String()),
		SK:               formatSK(request.LoginEmail),
		JobID:            jobID.String(),
		SessionID:        checkoutSessionResult.ID,
		CreatedAt:        createdAt.Format(time.RFC3339),
		UpdatedAt:        updatedAt.Format(time.RFC3339),
		Status:           PendingPayment,
	}

	cfg, err := config.LoadDefaultConfig(context.TODO(), func(opts *config.LoadOptions) error {
		opts.Region = "eu-west-2"
		return nil
	})

	if err != nil {
		h.logger.Error("error loading default config", "error", err)
		respond.WithError(w, "error loading default config", http.StatusInternalServerError)
		return
	}

	svc := dynamodb.NewFromConfig(cfg)

	data, err := attributevalue.MarshalMap(jobPostItem)

	if err != nil {
		h.logger.Error("error marshalling job item", "error", err)
		respond.WithError(w, "error marshalling job item", http.StatusInternalServerError)
		return
	}

	_, err = svc.PutItem(context.TODO(), &dynamodb.PutItemInput{
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

func formatPK(id string) string {
	return fmt.Sprintf("job/%s", id)
}

func formatSK(email string) string {
	return fmt.Sprintf("email/%s", email)
}
