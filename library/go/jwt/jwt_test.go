package jwt

import (
	"testing"
)

func TestJwt(t *testing.T) {
	result := Jwt("works")
	if result != "Jwt works" {
		t.Error("Expected Jwt to append 'works'")
	}
}
