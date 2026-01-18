package handlers

import (
	"library/go/responses"
	"library/go/structs"
	"net/http"
)

func IndexRequestHandler(w http.ResponseWriter, r *http.Request) {
	bodyBytes := structs.Response{
		Message: "Welcome to Smart Vending Machine API.",
	}
	responses.SuccessResponse(w, bodyBytes)
}
