package main

import (
	"context"
	"log/slog"
	"os"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/aws/aws-sdk-go-v2/service/ses"
	"github.com/awslabs/aws-lambda-go-api-proxy/httpadapter"
	"github.com/josepheid/upfront/api/handlers/startchallenge"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	region := "eu-west-2"

	ctx := context.Background()
	config, err := config.LoadDefaultConfig(ctx, config.WithRegion(region))
	if err != nil {
		logger.Error(err.Error())
		os.Exit(1)
	}

	ses := ses.NewFromConfig(config)

	ddbc := dynamodb.NewFromConfig(config)

	kmsc := kms.NewFromConfig(config)

	cipc := cognitoidentityprovider.NewFromConfig(config)

	upfrontTableName := os.Getenv("UPFRONT_TABLE_NAME")

	// If the environment variable is not set
	if upfrontTableName == "" {
		logger.Error("environment variable UPFRONT_TABLE_NAME is not set", "error", err)
		os.Exit(1)
	}

	kmsKeyID := os.Getenv("KMS_KEY_ID")

	if kmsKeyID == "" {
		logger.Error("environment variable KMS_KEY_ID is not set", "error", err)
		os.Exit(1)
	}

	userPoolId := os.Getenv("USER_POOL_ID")

	// If the environment variable is not set
	if userPoolId == "" {
		logger.Error("environment variable USER_POOL_ID is not set", "error", err)
		os.Exit(1)
	}

	h, err := startchallenge.NewHandler(logger, ses, ddbc, kmsc, cipc, upfrontTableName, kmsKeyID, userPoolId)
	if err != nil {
		logger.Error("could not create handler", slog.Any("error", err))
		os.Exit(1)
	}
	function := httpadapter.New(h).ProxyWithContext
	lambda.Start(function)
}
