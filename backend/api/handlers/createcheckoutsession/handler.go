package createcheckoutsession

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/google/uuid"
	"github.com/josepheid/upfront/internal/respond"
	"github.com/stripe/stripe-go/v80"
	"github.com/stripe/stripe-go/v80/checkout/session"
	"github.com/stripe/stripe-go/v80/price"
)

type Handler struct {
	logger    *slog.Logger
	stripeKey string
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

type JobPostFormProps struct {
	CompanyLogoURL  *string  `json:"companyLogoURL,omitempty"`
	CompanyName     string   `json:"companyName"`
	CompanyWebsite  string   `json:"companyWebsite"`
	Currency        Currency `json:"currency"`
	Description     string   `json:"description"`
	HowToApply      string   `json:"howToApply"`
	Location        string   `json:"location"`
	MaxSalary       int      `json:"maxSalary"`
	MinSalary       int      `json:"minSalary"`
	Title           string   `json:"title"`
	VisaSponsorship bool     `json:"visaSponsorship"`
	LoginEmail      string   `json:"loginEmail"`
	PlanDuration    int      `json:"planDuration"`
	PlanType        PlanType `json:"planType"`
	SuccessURL      string   `json:"successURL"`
	CancelURL       string   `json:"cancelURL"`
}

type CheckoutSessionResponse struct {
	URL string `json:"url"`
}

func NewHandler(logger *slog.Logger, stripeKey string) (Handler, error) {
	return Handler{
		logger:    logger,
		stripeKey: stripeKey,
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
		h.logger.Error("Error creating checkout session", "error", err)
		respond.WithError(w, "error creating checkout session", http.StatusInternalServerError)
		return
	}

	respond.WithJSON(w, CheckoutSessionResponse{URL: checkoutSessionResult.URL}, http.StatusCreated)
}
