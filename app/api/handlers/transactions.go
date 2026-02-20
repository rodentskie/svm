package handlers

import (
	"encoding/json"
	"library/go/database"
	"library/go/env"
	"library/go/logger"
	"library/go/models"
	"library/go/responses"
	"library/go/structs"
	"library/go/wss"
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

	// broadcast to websocket clients
	wsHost := env.GetEnv("WS_HOST", "ws://localhost:8081/ws")
	wsClient, err := wss.Connect(wsHost)
	if err != nil {
		transactionLog.Error("failed to connect to websocket server", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to connect to websocket server")
		return
	}
	defer wsClient.Close()

	broadcast := structs.TransactionBroadcast{
		IsPurchase: req.Type == "purchase",
		Location:   req.Location,
	}
	wsClient.SendJSON(broadcast)

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

func GetAllTransactions(w http.ResponseWriter, r *http.Request) {
	defer transactionLog.Sync()

	// Get query parameters for pagination
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	// Set default values
	limit := 10
	offset := 0

	// Parse limit
	if limitStr != "" {
		parsedLimit, err := strconv.Atoi(limitStr)
		if err != nil || parsedLimit <= 0 {
			responses.ErrorResponse(w, http.StatusBadRequest, "Invalid limit parameter")
			return
		}
		limit = parsedLimit
	}

	// Parse offset
	if offsetStr != "" {
		parsedOffset, err := strconv.Atoi(offsetStr)
		if err != nil || parsedOffset < 0 {
			responses.ErrorResponse(w, http.StatusBadRequest, "Invalid offset parameter")
			return
		}
		offset = parsedOffset
	}

	// Get database connection
	db, err := database.GetDB()
	if err != nil {
		transactionLog.Error("failed to get database connection", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Database connection error")
		return
	}

	// Fetch transactions with product and transaction_details relationships
	var transactions []models.Transaction
	if err := db.
		Preload("Product").
		Preload("TransactionDetails").
		Limit(limit).
		Offset(offset).
		Order("created_at DESC").
		Find(&transactions).Error; err != nil {
		transactionLog.Error("failed to fetch transactions", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch transactions")
		return
	}

	// Get total count for pagination metadata
	var total int64
	if err := db.Model(&models.Transaction{}).Count(&total).Error; err != nil {
		transactionLog.Error("failed to count transactions", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to count transactions")
		return
	}

	// Create response with pagination metadata
	response := map[string]interface{}{
		"data": transactions,
		"pagination": map[string]interface{}{
			"limit":  limit,
			"offset": offset,
			"total":  total,
		},
	}

	responses.SuccessResponse(w, response)
}
