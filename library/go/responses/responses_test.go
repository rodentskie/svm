package responses

import (
	"testing"
)

func TestResponses(t *testing.T) {
	result := Responses("works")
	if result != "Responses works" {
		t.Error("Expected Responses to append 'works'")
	}
}
