package database

import (
	"testing"
)

func TestDatabase(t *testing.T) {
	result := Database("works")
	if result != "Database works" {
		t.Error("Expected Database to append 'works'")
	}
}
