package handlers

import (
	"library/go/logger"
	"library/go/responses"
	"net/http"
)

var transactionLog = logger.NewLogger("transactions-handler")

func CreateTransaction(w http.ResponseWriter, r *http.Request) {
	defer transactionLog.Sync()

	/*
		1. A transaction is created when a product is sold
		2.
	*/
	responses.NoContentResponse(w)
}
