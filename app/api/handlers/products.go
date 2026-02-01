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

var productLog = logger.NewLogger("products-handler")

func GetAllProducts(w http.ResponseWriter, r *http.Request) {
	defer productLog.Sync()

	// Get database connection
	db, err := database.GetDB()
	if err != nil {
		productLog.Error("failed to get database connection", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Database connection error")
		return
	}

	// Fetch all products
	var products []models.Product
	if err := db.Find(&products).Error; err != nil {
		productLog.Error("failed to fetch products", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch products")
		return
	}

	// Build response
	var productsResponse []map[string]interface{}
	for _, product := range products {
		productsResponse = append(productsResponse, map[string]interface{}{
			"id":            product.ID,
			"name":          product.Name,
			"code":          product.Code,
			"price":         product.Price,
			"quantity":      product.Quantity,
			"min_threshold": product.MinThreshold,
			"location":      product.Location,
			"is_low_stock":  product.IsLowStock(),
			"created_at":    product.CreatedAt.Format("2006-01-02 15:04:05"),
			"updated_at":    product.UpdatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	productLog.Info("fetched products successfully", zap.Int("count", len(products)))
	responses.SuccessResponse(w, productsResponse)
}

func GetSingleProduct(w http.ResponseWriter, r *http.Request) {
	defer productLog.Sync()

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

	// Get database connection
	db, err := database.GetDB()
	if err != nil {
		productLog.Error("failed to get database connection", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Database connection error")
		return
	}

	var product models.Product
	if err := db.First(&product, productID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			responses.ErrorResponse(w, http.StatusNotFound, "Product not found")
			return
		}
		productLog.Error("failed to fetch product", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch product")
		return
	}

	responses.SuccessResponse(w, product)
}

func PatchSingleProduct(w http.ResponseWriter, r *http.Request) {
	defer productLog.Sync()

	productId := r.PathValue("productId")

	// Parse request body
	var req structs.UpdateProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		productLog.Error("failed to decode request body", zap.Error(err))
		responses.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate required fields
	if req.Name == "" || req.Code == "" || req.Price == 0 || req.Quantity == 0 || req.MinThreshold == 0 || req.Location == "" {
		responses.ErrorResponse(w, http.StatusBadRequest, "Name, code, price, quantity, min_threshold, and location are required")
		return
	}

	// Get database connection
	db, err := database.GetDB()
	if err != nil {
		productLog.Error("failed to get database connection", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Database connection error")
		return
	}

	// Fetch current product
	var product models.Product
	if err := db.First(&product, productId).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			responses.ErrorResponse(w, http.StatusNotFound, "Product not found")
			return
		}
		productLog.Error("failed to fetch product", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to update product")
		return
	}

	var existingProduct models.Product
	if err := db.Where("name = ? AND id != ?", req.Name, productId).First(&existingProduct).Error; err == nil {
		responses.ErrorResponse(w, http.StatusConflict, "Product name already exists")
		return
	}

	if err := db.Where("code = ? AND id != ?", req.Code, productId).First(&existingProduct).Error; err == nil {
		responses.ErrorResponse(w, http.StatusConflict, "Product code already exists")
		return
	}

	if err := db.Where("location = ? AND id != ?", req.Location, productId).First(&existingProduct).Error; err == nil {
		responses.ErrorResponse(w, http.StatusConflict, "Product location already occupied")
		return
	}

	// Update product
	if err := db.Model(&product).Updates(req).Error; err != nil {
		productLog.Error("failed to update product", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to update product")
		return
	}

	// Fetch updated product
	if err := db.First(&product, productId).Error; err != nil {
		productLog.Error("failed to fetch updated product", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Product updated but failed to fetch")
		return
	}

	responses.NoContentResponse(w)
}

func DeleteSingleProduct(w http.ResponseWriter, r *http.Request) {
	defer productLog.Sync()

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

	// Get database connection
	db, err := database.GetDB()
	if err != nil {
		productLog.Error("failed to get database connection", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Database connection error")
		return
	}

	// Fetch product
	var product models.Product
	if err := db.First(&product, uint(productID)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			responses.ErrorResponse(w, http.StatusNotFound, "Product not found")
			return
		}
		productLog.Error("failed to fetch product", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to delete product")
		return
	}

	// Soft delete using GORM
	if err := db.Delete(&product).Error; err != nil {
		productLog.Error("failed to delete product", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to delete product")
		return
	}

	responses.NoContentResponse(w)
}

func CreateProduct(w http.ResponseWriter, r *http.Request) {
	defer productLog.Sync()

	// Parse request body
	var req structs.CreateProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		productLog.Error("failed to decode request body", zap.Error(err))
		responses.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate required fields
	if req.Name == "" || req.Code == "" || req.Price == 0 || req.Quantity == 0 || req.MinThreshold == 0 || req.Location == "" {
		responses.ErrorResponse(w, http.StatusBadRequest, "Name, code, price, quantity, min_threshold, and location are required")
		return
	}

	// Get database connection
	db, err := database.GetDB()
	if err != nil {
		productLog.Error("failed to get database connection", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Database connection error")
		return
	}

	// Check if product code already exists
	var existingProduct models.Product
	if err := db.Where("code = ?", req.Code).First(&existingProduct).Error; err == nil {
		responses.ErrorResponse(w, http.StatusConflict, "Product code already exists")
		return
	}

	// Check if product name already exists
	if err := db.Where("name = ?", req.Name).First(&existingProduct).Error; err == nil {
		responses.ErrorResponse(w, http.StatusConflict, "Product name already exists")
		return
	}

	// Check if product location already exists
	if err := db.Where("location = ?", req.Location).First(&existingProduct).Error; err == nil {
		responses.ErrorResponse(w, http.StatusConflict, "Product location already occupied")
		return
	}

	// Create product
	product := models.Product{
		Name:         req.Name,
		Code:         req.Code,
		Location:     req.Location,
		Price:        req.Price,
		Quantity:     req.Quantity,
		MinThreshold: req.MinThreshold,
	}

	if err := db.Create(&product).Error; err != nil {
		productLog.Error("failed to create product", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to create product")
		return
	}

	productLog.Info("product created successfully", zap.String("name", product.Name), zap.Uint("product_id", product.ID))

	// Build response
	productResponse := models.Product{
		ID:           product.ID,
		Name:         product.Name,
		Code:         product.Code,
		Location:     product.Location,
		Price:        product.Price,
		Quantity:     product.Quantity,
		MinThreshold: product.MinThreshold,
	}

	responses.CreatedResponse(w, productResponse)
}

func GetAllProductCategories(w http.ResponseWriter, r *http.Request) {
	defer productLog.Sync()

	// Get database connection
	db, err := database.GetDB()
	if err != nil {
		productLog.Error("failed to get database connection", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Database connection error")
		return
	}

	// Fetch all products
	var categories []models.ProductCategories
	if err := db.Find(&categories).Error; err != nil {
		productLog.Error("failed to fetch products", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch products")
		return
	}

	// Build response
	var res []map[string]interface{}
	for _, c := range categories {
		res = append(res, map[string]interface{}{
			"id":         c.ID,
			"name":       c.Name,
			"created_at": c.CreatedAt.Format("2006-01-02 15:04:05"),
			"updated_at": c.UpdatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	productLog.Info("fetched products successfully", zap.Int("count", len(res)))
	responses.SuccessResponse(w, res)
}
