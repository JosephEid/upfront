package envvars

import (
	"fmt"
	"os"
)

const (
	StripeSecretKey = "STRIPE_SECRET_KEY"
)

// GetMandatoryEnvironmentVariableOrPanic retrieves an environment variable. If the variable isn't
// set then this function will throw a panic.
func GetMandatoryEnvironmentVariableOrPanic(key string) string {
	envvar, err := GetMandatoryEnvironmentVariable(key)
	if err != nil {
		panic(err)
	}
	return envvar
}

// GetMandatoryEnvironmentVariable retrieves an environment variable. If the variable isn't set then
// an error will be returned.
func GetMandatoryEnvironmentVariable(key string) (string, error) {
	envvar := os.Getenv(key)
	if envvar == "" {
		return "", fmt.Errorf("mandatory environment variable %q not set", key)
	}
	return envvar, nil
}
