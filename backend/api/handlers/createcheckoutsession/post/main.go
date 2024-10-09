package main

import (
	"context"
	"encoding/json"
	"log/slog"
	"os"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/awslabs/aws-lambda-go-api-proxy/httpadapter"
	"github.com/josepheid/upfront/api/handlers/createcheckoutsession"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	secretName := "STRIPE_SECRET_KEY"
	region := "eu-west-2"

	ctx := context.Background()
	config, err := config.LoadDefaultConfig(ctx, config.WithRegion(region))
	if err != nil {
		logger.Error(err.Error())
		os.Exit(1)
	}

	// Create Secrets Manager client
	svc := secretsmanager.NewFromConfig(config)

	input := &secretsmanager.GetSecretValueInput{
		SecretId:     aws.String(secretName),
		VersionStage: aws.String("AWSCURRENT"), // VersionStage defaults to AWSCURRENT if unspecified
	}

	result, err := svc.GetSecretValue(ctx, input)
	if err != nil {
		logger.Error(err.Error())
		os.Exit(1)
	}

	var secretKeyValuePair map[string]string
	if err = json.Unmarshal([]byte(*result.SecretString), &secretKeyValuePair); err != nil {
		logger.Error(err.Error())
		os.Exit(1)
	}
	secret := secretKeyValuePair["STRIPE_SECRET_KEY"]

	h, err := createcheckoutsession.NewHandler(logger, secret)
	if err != nil {
		logger.Error("could not create handler", slog.Any("error", err))
		os.Exit(1)
	}
	function := httpadapter.New(h).ProxyWithContext
	lambda.Start(function)
}
