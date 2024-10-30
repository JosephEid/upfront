package models

import "fmt"

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
	CompanyName     string   `json:"companyName" dynamodbav:"companyName"`
	CompanyWebsite  string   `json:"companyWebsite" dynamodbav:"companyWebsite"`
	Currency        Currency `json:"currency" dynamodbav:"currency"`
	Description     string   `json:"description" dynamodbav:"description"`
	HowToApply      string   `json:"howToApply" dynamodbav:"howToApply"`
	Location        string   `json:"location" dynamodbav:"location"`
	MaxSalary       int      `json:"maxSalary" dynamodbav:"maxSalary"`
	MinSalary       int      `json:"minSalary" dynamodbav:"minSalary"`
	MinYOE          int      `json:"minYOE" dynamodbav:"minYOE"`
	Title           string   `json:"title" dynamodbav:"title"`
	VisaSponsorship bool     `json:"visaSponsorship" dynamodbav:"visaSponsorship"`
	LoginEmail      string   `json:"loginEmail" dynamodbav:"loginEmail"`
	PlanDuration    int      `json:"planDuration" dynamodbav:"planDuration"`
	PlanType        PlanType `json:"planType" dynamodbav:"planType"`
	SuccessURL      string   `json:"successURL" dynamodbav:"successURL"`
	CancelURL       string   `json:"cancelURL" dynamodbav:"cancelURL"`
}

type JobPostItem struct {
	JobPostFormProps
	PK                string `dynamodbav:"PK" json:"PK"`
	SK                string `dynamodbav:"SK" json:"SK"`
	AllJobs           string `dynamodbav:"allJobs" json:"allJobs"`
	JobID             string `dynamodbav:"jobID" json:"jobID"`
	SessionID         string `dynamodbav:"sessionID" json:"sessionID"`
	CreatedAt         string `dynamodbav:"createdAt" json:"createdAt"`
	UpdatedAt         string `dynamodbav:"updatedAt" json:"updatedAt"`
	ClickedApplyCount int    `dynamodbav:"clickedApplyCount" json:"clickedApplyCount"`
	Status            Status `dynamodbav:"status" json:"status"`
}

func FormatPK(id string) string {
	return fmt.Sprintf("job/%s", id)
}

func FormatSK(email string) string {
	return fmt.Sprintf("email/%s", email)
}
