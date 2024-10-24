package main

import (
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

func handler(event events.CognitoEventUserPoolsDefineAuthChallenge) (events.CognitoEventUserPoolsDefineAuthChallenge, error) {
	if event.Request.UserNotFound {
		event.Response.IssueTokens = false
		event.Response.FailAuthentication = true
		return event, nil
	}

	if len(event.Request.Session) == 0 {
		// Issue new challenge
		event.Response.IssueTokens = false
		event.Response.FailAuthentication = false
		event.Response.ChallengeName = "CUSTOM_CHALLENGE"
	} else {
		// Get last attempt (equivalent to _.last)
		lastAttempt := event.Request.Session[len(event.Request.Session)-1]

		if lastAttempt.ChallengeResult {
			// User gave right answer
			event.Response.IssueTokens = true
			event.Response.FailAuthentication = false
		} else {
			// User gave wrong answer
			event.Response.IssueTokens = false
			event.Response.FailAuthentication = true
		}
	}

	return event, nil
}

func main() {
	lambda.Start(handler)
}
