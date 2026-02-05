package handlers

import (
	"encoding/base64"
	"encoding/json"
	"io"
	"library/go/env"
	"library/go/logger"
	"library/go/responses"
	"library/go/structs"
	"net/http"
	"slices"
	"strings"

	"go.uber.org/zap"
)

var payMongoLog = logger.NewLogger("paymongo-handler")

func PayMongoCreatePaymentMethod(w http.ResponseWriter, r *http.Request) {
	defer payMongoLog.Sync()

	// Parse request body
	var reqBody structs.CreatePaymentMethod
	if err := json.NewDecoder(r.Body).Decode(&reqBody); err != nil {
		payMongoLog.Error("failed to decode request body", zap.Error(err))
		responses.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	validMethods := []string{"gcash", "paymaya"}
	methodValid := slices.Contains(validMethods, reqBody.Method)

	if !methodValid {
		responses.ErrorResponse(w, http.StatusBadRequest, "Invalid payment method. Valid methods are: gcash, paymaya")
		return
	}

	pk := env.GetEnv("PAYMONGO_PUBLIC_KEY", "pk_test_zzxxx")
	encodedPK := base64.StdEncoding.EncodeToString([]byte(pk))

	url := "https://api.paymongo.com/v1/payment_methods"
	method := "POST"

	payload := strings.NewReader(`{
    "data": {
        "attributes": {
            "type": "` + reqBody.Method + `"
        }
    }
}`)

	client := &http.Client{}
	req, err := http.NewRequest(method, url, payload)

	if err != nil {
		payMongoLog.Error("failed to create new request", zap.Error(err))
		return
	}
	req.Header.Add("Accept", "application/json")
	req.Header.Add("Content-Type", "application/json")
	req.Header.Add("Authorization", "Basic "+encodedPK)

	res, err := client.Do(req)
	if err != nil {
		payMongoLog.Error("failed to execute request", zap.Error(err))
		return
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		payMongoLog.Error("failed to read response body", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to read response")
		return
	}

	// Parse PayMongo response
	var paymongoResponse struct {
		Data struct {
			ID string `json:"id"`
		} `json:"data"`
	}

	if err := json.Unmarshal(body, &paymongoResponse); err != nil {
		payMongoLog.Error("failed to parse paymongo response", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to parse payment provider response")
		return
	}

	// Return the payment method ID
	responses.SuccessResponse(w, map[string]string{
		"payment_method_id": paymongoResponse.Data.ID,
	})

}
