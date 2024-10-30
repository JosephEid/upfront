package main

import (
	"net/http"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsapigateway"
	"github.com/aws/aws-cdk-go/awscdk/v2/awskms"

	"github.com/aws/aws-cdk-go/awscdk/v2/awscognito"
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

	//KMS Key
	key := awskms.NewKey(stack, &id, &awskms.KeyProps{
		Enabled:           jsii.Bool(true),
		EnableKeyRotation: jsii.Bool(true),
		MultiRegion:       jsii.Bool(false),
		PendingWindow:     awscdk.Duration_Days(jsii.Number(7)),

		Policy: awsiam.NewPolicyDocument(&awsiam.PolicyDocumentProps{
			Statements: &[]awsiam.PolicyStatement{
				// Enable IAM User Permissions
				awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
					Sid:    jsii.String("EnableIAMUserPermissions"),
					Effect: awsiam.Effect_ALLOW,
					Principals: &[]awsiam.IPrincipal{
						awsiam.NewAccountRootPrincipal(),
					},
					Actions: jsii.Strings("kms:*"),

					Resources: jsii.Strings("*"),
				}),

				// Allow access for Key Administrators
				awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
					Sid:    jsii.String("AllowAccessForKeyAdministrators"),
					Effect: awsiam.Effect_ALLOW,
					Principals: &[]awsiam.IPrincipal{
						awsiam.NewServicePrincipal(jsii.String("iam.amazonaws.com"), &awsiam.ServicePrincipalOpts{}),
						awsiam.NewAccountPrincipal(*stack.Account()),
					},
					Actions: &[]*string{
						jsii.String("kms:Create*"),
						jsii.String("kms:Describe*"),
						jsii.String("kms:Enable*"),
						jsii.String("kms:List*"),
						jsii.String("kms:Put*"),
						jsii.String("kms:Update*"),
						jsii.String("kms:Revoke*"),
						jsii.String("kms:Disable*"),
						jsii.String("kms:Get*"),
						jsii.String("kms:Delete*"),
						jsii.String("kms:TagResource"),
						jsii.String("kms:UntagResource"),
						jsii.String("kms:ScheduleKeyDeletion"),
						jsii.String("kms:CancelKeyDeletion"),
					},
					Resources: jsii.Strings("*"),
				}),
			},
		}),
	})

	createAuthChallenge := golambda.NewGoFunction(stack, jsii.String("createAuthChallenge"), &golambda.GoFunctionProps{
		Entry:       jsii.String("../backend/auth/handlers/createauthchallenge"),
		Description: jsii.String("lambda responsible for creating auth challenges"),
	})

	defineAuthChallenge := golambda.NewGoFunction(stack, jsii.String("defineAuthChallenge"), &golambda.GoFunctionProps{
		Entry:       jsii.String("../backend/auth/handlers/defineauthchallenge"),
		Description: jsii.String("lambda responsible for defining auth challenges"),
	})

	verifyAuthChallengeResponse := golambda.NewGoFunction(stack, jsii.String("verifyAuthChallengeResponse"), &golambda.GoFunctionProps{
		Entry:       jsii.String("../backend/auth/handlers/verifyauthchallengeresponse"),
		Description: jsii.String("lambda responsible for verifying auth challenge responses"),
		InitialPolicy: &[]awsiam.PolicyStatement{
			awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
				Actions:   jsii.Strings("kms:Decrypt"),
				Resources: jsii.Strings(*key.KeyArn()),
			}),
		},
		Environment: &map[string]*string{
			"KMS_KEY_ID": key.KeyId(),
		},
	})

	// passwordlessMagicLinkUserPool
	passwordlessMagicLinkUserPool := awscognito.NewUserPool(stack, jsii.String("passwordlessMagicLinksUserPool"), &awscognito.UserPoolProps{
		SignInAliases: &awscognito.SignInAliases{
			Email: jsii.Bool(true),
		},
		SignInCaseSensitive: jsii.Bool(false),

		PasswordPolicy: &awscognito.PasswordPolicy{
			MinLength:        jsii.Number(16),
			RequireDigits:    jsii.Bool(true),
			RequireLowercase: jsii.Bool(true),
			RequireSymbols:   jsii.Bool(true),
			RequireUppercase: jsii.Bool(true),
		},
		// Custom attributes schema
		CustomAttributes: &map[string]awscognito.ICustomAttribute{
			"authChallenge": awscognito.NewStringAttribute(&awscognito.StringAttributeProps{
				Mutable: jsii.Bool(true),
				MinLen:  jsii.Number(8),
			}),
		},

		// Standard attributes configuration
		StandardAttributes: &awscognito.StandardAttributes{
			Email: &awscognito.StandardAttribute{
				Required: jsii.Bool(true),
				Mutable:  jsii.Bool(false),
			},
		},
		LambdaTriggers: &awscognito.UserPoolTriggers{
			DefineAuthChallenge:         defineAuthChallenge,
			CreateAuthChallenge:         createAuthChallenge,
			VerifyAuthChallengeResponse: verifyAuthChallengeResponse,
		},
	})

	passwordlessMagicLinkUserPool.AddClient(jsii.String("webUserPoolClient"), &awscognito.UserPoolClientOptions{
		AuthFlows: &awscognito.AuthFlow{
			Custom: jsii.Bool(true),
		},
		RefreshTokenValidity:       awscdk.Duration_Days(jsii.Number(1)),
		PreventUserExistenceErrors: jsii.Bool(true),
	})

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
		IndexName: jsii.String("emailIndex"),
		PartitionKey: &awsdynamodb.Attribute{
			Name: jsii.String("loginEmail"),
			Type: awsdynamodb.AttributeType_STRING,
		},
		SortKey: &awsdynamodb.Attribute{
			Name: jsii.String("PK"),
			Type: awsdynamodb.AttributeType_STRING,
		},
		ProjectionType: awsdynamodb.ProjectionType_INCLUDE,
		NonKeyAttributes: jsii.Strings(
			"createdAt",
			"clickedApplyCount",
			"title",
			"companyLogoURL",
			"status",
			"updatedAt",
			"planDuration",
			"planType",
		),
	})

	upfrontTable.AddGlobalSecondaryIndex(&awsdynamodb.GlobalSecondaryIndexPropsV2{
		IndexName: jsii.String("allJobsIndex"),
		PartitionKey: &awsdynamodb.Attribute{
			Name: jsii.String("allJobs"), // A constant string, e.g., "ALL_JOBS"
			Type: awsdynamodb.AttributeType_STRING,
		},
		SortKey: &awsdynamodb.Attribute{
			Name: jsii.String("createdAt"), // Sort by createdAt datetime
			Type: awsdynamodb.AttributeType_STRING,
		},
		ProjectionType: awsdynamodb.ProjectionType_ALL, // Or specify keys you need with INCLUDE
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
				Actions:   jsii.Strings("secretsmanager:GetSecretValue", "cognito-idp:AdminCreateUser", "cognito-idp:AdminSetUserPassword", "cognito-idp:AdminGetUser"),
				Resources: jsii.Strings("*"),
			}),
		},
		Environment: &map[string]*string{
			"UPFRONT_TABLE_NAME": upfrontTable.TableName(),
			"USER_POOL_ID":       passwordlessMagicLinkUserPool.UserPoolId(),
		},
	})

	getJobsPosts := golambda.NewGoFunction(stack, jsii.String("getJobPosts"), &golambda.GoFunctionProps{
		Entry:       jsii.String("../backend/api/handlers/getjobposts/get"),
		Description: jsii.String("lambda responsible for getting jobs"),
		Environment: &map[string]*string{
			"UPFRONT_TABLE_NAME": upfrontTable.TableName(),
		},
	})

	getRecruiterJobsPosts := golambda.NewGoFunction(stack, jsii.String("getRecruiterJobPosts"), &golambda.GoFunctionProps{
		Entry:       jsii.String("../backend/api/handlers/getrecruiterjobposts/get"),
		Description: jsii.String("lambda responsible for getting recruiters jobs"),
		Environment: &map[string]*string{
			"UPFRONT_TABLE_NAME": upfrontTable.TableName(),
		},
	})

	startChallenge := golambda.NewGoFunction(stack, jsii.String("startChallenge"), &golambda.GoFunctionProps{
		Entry:       jsii.String("../backend/api/handlers/startchallenge/post"),
		Description: jsii.String("lambda responsible for starting magic link auth challenges"),
		InitialPolicy: &[]awsiam.PolicyStatement{
			awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
				Actions: jsii.Strings("ses:SendEmail",
					"ses:SendRawEmail"),
				Resources: jsii.Strings("*"),
			}),
			awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
				Actions:   jsii.Strings("kms:Encrypt"),
				Resources: jsii.Strings(*key.KeyArn()),
			}),
			awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
				Actions:   jsii.Strings("cognito-idp:AdminUpdateUserAttributes"),
				Resources: jsii.Strings(*passwordlessMagicLinkUserPool.UserPoolArn()),
			}),
		},
		Environment: &map[string]*string{
			"UPFRONT_TABLE_NAME": upfrontTable.TableName(),
			"KMS_KEY_ID":         key.KeyId(),
			"USER_POOL_ID":       passwordlessMagicLinkUserPool.UserPoolId(),
		},
	})

	upfrontTable.GrantFullAccess(createCheckoutSession)
	upfrontTable.GrantFullAccess(validatePurchase)
	upfrontTable.GrantFullAccess(getJobsPosts)
	upfrontTable.GrantFullAccess(startChallenge)
	upfrontTable.GrantReadData(getRecruiterJobsPosts)

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
	checkoutSession.AddMethod(jsii.String(http.MethodPost), createCheckoutSessionPostIntegration, &awsapigateway.MethodOptions{ApiKeyRequired: jsii.Bool(true)})

	validatePurchaseId := upfront.AddResource(jsii.String("validate-purchase"), apiResourceOpts)
	validatePurchaseWithId := validatePurchaseId.AddResource(jsii.String("{id}"), apiResourceOpts)
	validatePurchaseGetIntegration := awsapigateway.NewLambdaIntegration(validatePurchase, apiLambdaOpts)
	validatePurchaseWithId.AddMethod(jsii.String(http.MethodGet), validatePurchaseGetIntegration, &awsapigateway.MethodOptions{ApiKeyRequired: jsii.Bool(true)})

	jobPosts := upfront.AddResource(jsii.String("job-posts"), apiResourceOpts)
	jobPostsGetIntegration := awsapigateway.NewLambdaIntegration(getJobsPosts, apiLambdaOpts)
	jobPosts.AddMethod(jsii.String(http.MethodGet), jobPostsGetIntegration, &awsapigateway.MethodOptions{ApiKeyRequired: jsii.Bool(true)})

	recruiterJobPosts := upfront.AddResource(jsii.String("recruiter-posts"), apiResourceOpts)
	recruiterJobPostsWithEmail := recruiterJobPosts.AddResource(jsii.String("{email}"), apiResourceOpts)
	recruiterJobPostsGetIntegration := awsapigateway.NewLambdaIntegration(getRecruiterJobsPosts, apiLambdaOpts)
	recruiterJobPostsWithEmail.AddMethod(jsii.String(http.MethodGet), recruiterJobPostsGetIntegration, &awsapigateway.MethodOptions{ApiKeyRequired: jsii.Bool(true)})

	startChallengeResource := upfront.AddResource(jsii.String("start-challenge"), apiResourceOpts)
	startChallengePostIntegration := awsapigateway.NewLambdaIntegration(startChallenge, apiLambdaOpts)
	startChallengeResource.AddMethod(jsii.String(http.MethodPost), startChallengePostIntegration, &awsapigateway.MethodOptions{ApiKeyRequired: jsii.Bool(true)})

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
	// 	Account: jsii.String(os.Getenv("CDK_DEFAULT_ACCOUNT")),
	// 	Region:  jsii.String(os.Getenv("CDK_DEFAULT_REGION")),
	// }
}
