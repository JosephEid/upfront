package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"log/slog"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/kms"
)

// Challenge payload structure
type ChallengePayload struct {
	Email      string `json:"email"`
	Expiration string `json:"expiration"`
}

type Handler struct {
	kmsc     *kms.Client
	kmsKeyID string
	logger   *slog.Logger
}

func (h Handler) Handle(event events.CognitoEventUserPoolsVerifyAuthChallenge) (events.CognitoEventUserPoolsVerifyAuthChallenge, error) {
	email := event.Request.UserAttributes["email"]
	expected := event.Request.PrivateChallengeParameters["challenge"]

	if event.Request.ChallengeAnswer != expected {
		h.logger.Error("answer doesn't match current challenge token")
		event.Response.AnswerCorrect = false
		return event, errors.New("answer doesn't match current challenge token")
	}

	decodedInput, err := base64.StdEncoding.DecodeString(event.Request.ChallengeAnswer.(string))
	if err != nil {
		h.logger.Error("error decoding base64", "error", err)
		return event, err
	}

	// Decrypt the challenge answer
	decryptedJSON, err := h.decrypt(decodedInput)
	if err != nil {
		h.logger.Error("failed to decrypt challenge answer: %v", "error", err)
		event.Response.AnswerCorrect = false
		return event, err
	}

	// Parse the decrypted JSON
	var payload ChallengePayload
	if err := json.Unmarshal(decryptedJSON, &payload); err != nil {
		h.logger.Error("failed to parse challenge payload: %v", "error", err)
		event.Response.AnswerCorrect = false
		return event, err
	}

	// Check if token is expired
	currentTime := time.Now().UTC().Format(time.RFC3339)

	isExpired := currentTime > payload.Expiration
	h.logger.Info("checked if token has expired", "isExpired", isExpired, "currentTime", currentTime, "tokenTime", payload.Expiration)

	if payload.Email == email && !isExpired {
		event.Response.AnswerCorrect = true
	} else {
		h.logger.Info("email doesn't match or token is expired")
		event.Response.AnswerCorrect = false
	}

	return event, nil
}

func main() {

	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	region := "eu-west-2"

	ctx := context.Background()
	config, err := config.LoadDefaultConfig(ctx, config.WithRegion(region))
	if err != nil {
		logger.Info(err.Error())
		os.Exit(1)
	}

	kmsc := kms.NewFromConfig(config)
	kmsKeyID := os.Getenv("KMS_KEY_ID")

	if kmsKeyID == "" {
		logger.Error("environment variable KMS_KEY_ID is not set", "error", err)
		os.Exit(1)
	}

	handler := Handler{
		kmsc:     kmsc,
		kmsKeyID: kmsKeyID,
		logger:   logger,
	}

	lambda.Start(handler.Handle)
}

func (h Handler) decrypt(input []byte) ([]byte, error) {

	h.logger.Info("incoming input", "input", input)
	out, err := h.kmsc.Decrypt(context.Background(), &kms.DecryptInput{
		CiphertextBlob: input,
		KeyId:          &h.kmsKeyID,
	})

	if err != nil {
		h.logger.Error("error decrypting challenge answer", "error", err)
		return []byte{}, err
	}

	return out.Plaintext, nil
}
