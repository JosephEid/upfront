package createcheckoutsession

import (
	"encoding/json"
	"log/slog"
	"net/http"

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

type CheckoutSessionResponse struct {
	URL string `json:"url"`
}

func NewHandler(logger *slog.Logger, stripeKey string) (Handler, error) {
	return Handler{
		logger:    logger,
		stripeKey: stripeKey,
	}, nil
}

func (h Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	var request CheckoutSessionRequest
	err := json.NewDecoder(r.Body).Decode(&request)

	h.logger.Info("Incoming request", "requestBody", request)
	if err != nil {
		h.logger.Error("error decoding request body", "error", err)
		respond.WithError(w, "error decoding request body", http.StatusBadRequest)
		return
	}

	stripe.Key = h.stripeKey

	priceParams := &stripe.PriceParams{
		Currency:    stripe.String(string(stripe.CurrencyGBP)),
		UnitAmount:  stripe.Int64(request.Amount),
		ProductData: &stripe.PriceProductDataParams{Name: stripe.String(request.ProductName)},
	}
	priceResult, err := price.New(priceParams)
	if err != nil {
		h.logger.Error("Error creating price", "error", err)
		respond.WithError(w, "error creating price", http.StatusInternalServerError)
		return
	}

	checkoutSessionParams := &stripe.CheckoutSessionParams{
		SuccessURL: stripe.String(request.SuccessURL),
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
