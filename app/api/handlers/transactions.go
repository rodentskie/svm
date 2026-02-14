package handlers

import (
	"encoding/json"
	"library/go/database"
	"library/go/logger"
	"library/go/models"
	"library/go/responses"
	"library/go/structs"
	"net/http"
	"strconv"

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
		Status:          "completed",
	}

	if err := db.Create(&transaction).Error; err != nil {
		transactionLog.Error("failed to create transaction", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to create transaction")
		return
	}

	// Create transaction details
	transactionDetail := models.TransactionDetails{
		TransactionId:   transaction.ID,
		RFID:            req.RFID,
		PaymentIntentId: req.PaymentIntentId,
	}

	if err := db.Create(&transactionDetail).Error; err != nil {
		transactionLog.Error("failed to create transaction details", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to create transaction details")
		return
	}

	responses.NoContentResponse(w)
}

func CreateTransactionAdjustment(w http.ResponseWriter, r *http.Request) {
	defer transactionLog.Sync()

	// Extract product ID from URL path
	productIDStr := r.PathValue("productId")
	if productIDStr == "" {
		responses.ErrorResponse(w, http.StatusBadRequest, "Product ID is required")
		return
	}

	productID, err := strconv.ParseUint(productIDStr, 10, 32)
	if err != nil {
		responses.ErrorResponse(w, http.StatusBadRequest, "Invalid product ID")
		return
	}

	// Parse request body
	var req structs.CreateTransactionAdjustmentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		transactionLog.Error("failed to decode request body", zap.Error(err))
		responses.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Quantity == 0 || req.Reason == "" {
		responses.ErrorResponse(w, http.StatusBadRequest, "Quantity and reason are required")
		return
	}

	// Get database connection
	db, err := database.GetDB()
	if err != nil {
		transactionLog.Error("failed to get database connection", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Database connection error")
		return
	}

	// check product existence
	var product models.Product
	if err := db.First(&product, productID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			responses.ErrorResponse(w, http.StatusNotFound, "Product not found")
			return
		}
		transactionLog.Error("failed to fetch product", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch product")
		return
	}

	// userId from token
	// Get user ID from context (set by AuthMiddleware)
	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		responses.ErrorResponse(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Create inventory adjustment
	inventoryAdjustment := models.InventoryAdjustment{
		ProductID:      uint(productID),
		QuantityChange: int(req.Quantity),
		Reason:         req.Reason,
		Notes:          req.Notes,
		AdjustedBy:     userID,
	}

	if err := db.Create(&inventoryAdjustment).Error; err != nil {
		transactionLog.Error("failed to create inventory adjustment", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to create inventory adjustment")
		return
	}

	responses.NoContentResponse(w)
}
