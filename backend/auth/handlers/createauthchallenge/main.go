package main

import (
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

func handler(event events.CognitoEventUserPoolsCreateAuthChallenge) (events.CognitoEventUserPoolsCreateAuthChallenge, error) {

	// Set the challenge parameters
	event.Response.PublicChallengeParameters = map[string]string{
		"email": event.Request.UserAttributes["email"],
	}
	event.Response.PrivateChallengeParameters = map[string]string{
		"challenge": event.Request.UserAttributes["custom:authChallenge"],
	}

	return event, nil
}

func main() {
	lambda.Start(handler)
}
