package structs

import (
	"testing"
)

func TestStructs(t *testing.T) {
	result := Structs("works")
	if result != "Structs works" {
		t.Error("Expected Structs to append 'works'")
	}
}
