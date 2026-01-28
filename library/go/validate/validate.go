package validate

import (
	"errors"
	"regexp"
	"strings"
)

func ValidateEmail(email string) error {
	regex := `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
	match, _ := regexp.MatchString(regex, email)
	if !match {
		return errors.New("invalid email")
	}
	return nil
}

func PhPhoneValidate(phoneNumber string) error {
	sixThreeFormat := strings.TrimPrefix(phoneNumber, "+63")
	zeroNineFormat := strings.TrimPrefix(phoneNumber, "0")

	if len(sixThreeFormat) == 10 || len(zeroNineFormat) == 10 {
		return nil

	}

	return errors.New("invalid phone number")
}
