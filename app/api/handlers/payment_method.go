package handlers

import (
	"library/go/database"
	"library/go/logger"
	"library/go/models"
	"library/go/responses"
	"net/http"

	"go.uber.org/zap"
)

var paymentMethodLog = logger.NewLogger("payment-methods-handler")

func GetAllPaymentMethods(w http.ResponseWriter, r *http.Request) {
	defer paymentMethodLog.Sync()

	// Get database connection
	db, err := database.GetDB()
	if err != nil {
		paymentMethodLog.Error("failed to get database connection", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Database connection error")
		return
	}

	// Fetch payment methods from database
	var paymentMethods []models.PaymentMethod
	if err := db.Find(&paymentMethods).Error; err != nil {
		paymentMethodLog.Error("failed to fetch payment methods", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch payment methods")
		return
	}

	// Build response
	var paymentMethodsResponse []map[string]interface{} = make([]map[string]interface{}, 0)
	for _, paymentMethod := range paymentMethods {
		paymentMethodsResponse = append(paymentMethodsResponse, map[string]interface{}{
			"id":   paymentMethod.ID,
			"name": paymentMethod.Name,
		})
	}

	paymentMethodLog.Info("fetched payment methods successfully", zap.Int("count", len(paymentMethods)))
	responses.SuccessResponse(w, paymentMethodsResponse)
}
