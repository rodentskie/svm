package handlers

import (
	"encoding/json"
	"library/go/database"
	"library/go/logger"
	"library/go/models"
	"library/go/responses"
	"library/go/structs"
	"net/http"

	"go.uber.org/zap"
	"gorm.io/gorm"
)

var transactionLog = logger.NewLogger("transactions-handler")

func CreateTransaction(w http.ResponseWriter, r *http.Request) {
	defer transactionLog.Sync()

	// Parse request body
	var req structs.CreateTransactionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		transactionLog.Error("failed to decode request body", zap.Error(err))
		responses.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate required fields
	if req.Location == "" || req.Type == "" || req.Quantity == 0 {
		responses.ErrorResponse(w, http.StatusBadRequest, "Location, Payment Method, quantity, and type are required")
		return
	}

	// Get database connection
	db, err := database.GetDB()
	if err != nil {
		transactionLog.Error("failed to get database connection", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Database connection error")
		return
	}

	// check location
	var product models.Product
	if err := db.Where("location = ?", req.Location).First(&product).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			responses.ErrorResponse(w, http.StatusNotFound, "Product not found")
			return
		}
		transactionLog.Error("failed to fetch product", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch product")
		return
	}

	if !product.CanSell(int(req.Quantity)) {
		transactionLog.Error("insufficient product quantity", zap.String("location", req.Location), zap.Int("requested", int(req.Quantity)), zap.Int("available", product.Quantity))
		responses.ErrorResponse(w, http.StatusBadRequest, "Insufficient product quantity")
		return
	}

	// Create transaction
	transaction := models.Transaction{
		ProductID:       product.ID,
		TransactionType: req.Type,
		Quantity:        int(req.Quantity),
		PaymentMethod:   req.PaymentMethod,
	}

	if err := db.Create(&transaction).Error; err != nil {
		transactionLog.Error("failed to create transaction", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to create transaction")
		return
	}

	responses.NoContentResponse(w)
}
