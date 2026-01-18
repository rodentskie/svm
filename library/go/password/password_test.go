package password

import (
	"testing"
)

func TestPassword(t *testing.T) {
	result := Password("works")
	if result != "Password works" {
		t.Error("Expected Password to append 'works'")
	}
}
