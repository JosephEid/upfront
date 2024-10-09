package createcheckoutsession

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/josepheid/upfront/internal/respond"
	"github.com/stripe/stripe-go/v80"
	"github.com/stripe/stripe-go/v80/checkout/session"
)

type Handler struct {
	logger    *slog.Logger
	stripeKey string
}

type CheckoutSessionRequest struct {
	Price      string `json:"price"`
	SuccessURL string `json:"successUrl"`
	Quantity   int64  `json:"quantity"`
}

type CheckoutSessionResponse struct {
	URL string `json:"url"`
}

func NewHandler(logger *slog.Logger, stripeKey *string) (Handler, error) {

	return Handler{
		logger:    logger,
		stripeKey: *stripeKey,
	}, nil
}

func (h Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	var request CheckoutSessionRequest
	err := json.NewDecoder(r.Body).Decode(&request)

	if err != nil {
		h.logger.Error("error decoding request body", "error", err)
		respond.WithError(w, "error decoding request body", http.StatusBadRequest)
		return
	}

	stripe.Key = h.stripeKey
	params := &stripe.CheckoutSessionParams{
		SuccessURL: stripe.String(request.SuccessURL),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(request.Price),
				Quantity: stripe.Int64(request.Quantity),
			},
		},
		Mode: stripe.String(string(stripe.CheckoutSessionModePayment)),
	}
	result, err := session.New(params)
	if err != nil {
		h.logger.Error("Error creating checkout session %v", "error", err)
		respond.WithError(w, "error creating checkout session", http.StatusInternalServerError)
	}

	respond.WithJSON(w, CheckoutSessionResponse{URL: result.URL}, http.StatusCreated)
}
