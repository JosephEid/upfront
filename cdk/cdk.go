package main

import (
	"net/http"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsapigateway"

	"github.com/aws/aws-cdk-go/awscdk/v2/awsdynamodb"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	golambda "github.com/aws/aws-cdk-go/awscdklambdagoalpha/v2"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type CdkStackProps struct {
	awscdk.StackProps
}

func NewCdkStack(scope constructs.Construct, id string, props *CdkStackProps) awscdk.Stack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}
	stack := awscdk.NewStack(scope, &id, &sprops)

	// Upfront Table
	upfrontTable := awsdynamodb.NewTableV2(stack, jsii.String("Table"), &awsdynamodb.TablePropsV2{
		PartitionKey: &awsdynamodb.Attribute{
			Name: jsii.String("PK"),
			Type: awsdynamodb.AttributeType_STRING,
		},
		SortKey: &awsdynamodb.Attribute{
			Name: jsii.String("SK"),
			Type: awsdynamodb.AttributeType_STRING,
		},
	})

	upfrontTable.AddGlobalSecondaryIndex(&awsdynamodb.GlobalSecondaryIndexPropsV2{
		IndexName: jsii.String("gsi1"),
		PartitionKey: &awsdynamodb.Attribute{
			Name: jsii.String("SK"),
			Type: awsdynamodb.AttributeType_STRING,
		},
		SortKey: &awsdynamodb.Attribute{
			Name: jsii.String("PK"),
			Type: awsdynamodb.AttributeType_STRING,
		},
	})

	createCheckoutSession := golambda.NewGoFunction(stack, jsii.String("createCheckoutSession"), &golambda.GoFunctionProps{
		Entry:       jsii.String("../backend/api/handlers/createcheckoutsession/post"),
		Description: jsii.String("lambda responsible for creating checkout sessions"),
		InitialPolicy: &[]awsiam.PolicyStatement{
			awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
				Actions:   jsii.Strings("secretsmanager:GetSecretValue"),
				Resources: jsii.Strings("*"),
			}),
		},
		Environment: &map[string]*string{
			"UPFRONT_TABLE_NAME": upfrontTable.TableName(),
		},
	})

	validatePurchase := golambda.NewGoFunction(stack, jsii.String("validatePurchase"), &golambda.GoFunctionProps{
		Entry:       jsii.String("../backend/api/handlers/validatepurchase/get"),
		Description: jsii.String("lambda responsible for validate that the customer has paid"),
		InitialPolicy: &[]awsiam.PolicyStatement{
			awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
				Actions:   jsii.Strings("secretsmanager:GetSecretValue"),
				Resources: jsii.Strings("*"),
			}),
		},
		Environment: &map[string]*string{
			"UPFRONT_TABLE_NAME": upfrontTable.TableName(),
		},
	})

	upfrontTable.GrantFullAccess(createCheckoutSession)
	upfrontTable.GrantFullAccess(validatePurchase)

	notFound := golambda.NewGoFunction(stack, jsii.String("notFound"), &golambda.GoFunctionProps{
		Description: jsii.String("Returns a not found response."),
		Entry:       jsii.String("../backend/api/handlers/notfound"),
		MemorySize:  jsii.Number(128),
	})

	apiResourceOpts := &awsapigateway.ResourceOptions{}
	apiLambdaOpts := &awsapigateway.LambdaIntegrationOptions{}
	api := awsapigateway.NewLambdaRestApi(stack, jsii.String("upfront-api"), &awsapigateway.LambdaRestApiProps{
		CloudWatchRole: jsii.Bool(false),
		Handler:        notFound,
		Proxy:          jsii.Bool(false),
	})
	upfront := api.Root().AddResource(jsii.String("upfront"), apiResourceOpts)
	checkoutSession := upfront.AddResource(jsii.String("checkout-session"), apiResourceOpts)
	createCheckoutSessionPostIntegration := awsapigateway.NewLambdaIntegration(createCheckoutSession, apiLambdaOpts)
	checkoutSession.AddMethod(jsii.String(http.MethodPost), createCheckoutSessionPostIntegration, &awsapigateway.MethodOptions{})

	validatePurchaseId := upfront.AddResource(jsii.String("validate-purchase"), apiResourceOpts)
	validatePurchaseWithId := validatePurchaseId.AddResource(jsii.String("{id}"), apiResourceOpts)
	validatePurchaseGetIntegration := awsapigateway.NewLambdaIntegration(validatePurchase, apiLambdaOpts)
	validatePurchaseWithId.AddMethod(jsii.String(http.MethodGet), validatePurchaseGetIntegration, &awsapigateway.MethodOptions{})

	// Next.js
	// Session table
	sessionTable := awsdynamodb.NewTableV2(stack, jsii.String("sessionTable"), &awsdynamodb.TablePropsV2{
		TableName: jsii.String("lucia-sessions"),
		PartitionKey: &awsdynamodb.Attribute{
			Name: jsii.String("id"),
			Type: awsdynamodb.AttributeType_STRING,
		},
		Billing: awsdynamodb.Billing_Provisioned(&awsdynamodb.ThroughputProps{
			ReadCapacity:  awsdynamodb.Capacity_Fixed(jsii.Number(1)),
			WriteCapacity: awsdynamodb.Capacity_Autoscaled(&awsdynamodb.AutoscaledCapacityOptions{MaxCapacity: jsii.Number(1)}),
		}),
		TimeToLiveAttribute: jsii.String("ttl"),
	})

	sessionTable.AddGlobalSecondaryIndex(&awsdynamodb.GlobalSecondaryIndexPropsV2{
		IndexName: jsii.String("lucia-sessions-user-index"),
		PartitionKey: &awsdynamodb.Attribute{
			Name: jsii.String("userId"),
			Type: awsdynamodb.AttributeType_STRING,
		},
		ReadCapacity:  awsdynamodb.Capacity_Fixed(jsii.Number(1)),
		WriteCapacity: awsdynamodb.Capacity_Autoscaled(&awsdynamodb.AutoscaledCapacityOptions{MaxCapacity: jsii.Number(1)}),
	})

	return stack
}

func main() {
	defer jsii.Close()

	app := awscdk.NewApp(nil)

	NewCdkStack(app, "UpfrontStack", &CdkStackProps{
		awscdk.StackProps{
			Env: env(),
		},
	})

	app.Synth(nil)
}

// env determines the AWS environment (account+region) in which our stack is to
// be deployed. For more information see: https://docs.aws.amazon.com/cdk/latest/guide/environments.html
func env() *awscdk.Environment {
	// If unspecified, this stack will be "environment-agnostic".
	// Account/Region-dependent features and context lookups will not work, but a
	// single synthesized template can be deployed anywhere.
	//---------------------------------------------------------------------------
	return nil

	// Uncomment if you know exactly what account and region you want to deploy
	// the stack to. This is the recommendation for production stacks.
	//---------------------------------------------------------------------------
	// return &awscdk.Environment{
	//  Account: jsii.String("123456789012"),
	//  Region:  jsii.String("us-east-1"),
	// }

	// Uncomment to specialize this stack for the AWS Account and Region that are
	// implied by the current CLI configuration. This is recommended for dev
	// stacks.
	//---------------------------------------------------------------------------
	// return &awscdk.Environment{
	//  Account: jsii.String(os.Getenv("CDK_DEFAULT_ACCOUNT")),
	//  Region:  jsii.String(os.Getenv("CDK_DEFAULT_REGION")),
	// }
}
