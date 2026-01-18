package handlers

import (
	"encoding/json"
	"library/go/database"
	"library/go/logger"
	"library/go/models"
	"library/go/password"
	"library/go/responses"
	"library/go/structs"
	"net/http"

	"go.uber.org/zap"
	"gorm.io/gorm"
)

var userLog = logger.NewLogger("users-handler")

func CreateUser(w http.ResponseWriter, r *http.Request) {
	defer userLog.Sync()

	// Parse request body
	var req structs.CreateUpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		userLog.Error("failed to decode request body", zap.Error(err))
		responses.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate required fields
	if req.Username == "" || req.Password == "" || req.ReEnterPassword == "" || req.Role == "" || req.Name == "" || req.Email == "" || req.Phone == "" {
		responses.ErrorResponse(w, http.StatusBadRequest, "Username, password, re_enter_password, role, name, email, and phone are required")
		return
	}

	// Validate passwords match
	if req.Password != req.ReEnterPassword {
		responses.ErrorResponse(w, http.StatusBadRequest, "Passwords do not match")
		return
	}

	// Validate role
	validRoles := map[string]bool{"admin": true, "operator": true}
	if !validRoles[req.Role] {
		responses.ErrorResponse(w, http.StatusBadRequest, "Invalid role. Must be one of: admin, operator")
		return
	}

	// Get database connection
	db, err := database.GetDB()
	if err != nil {
		userLog.Error("failed to get database connection", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Database connection error")
		return
	}

	// Check if username already exists
	var existingUser models.User
	if err := db.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
		responses.ErrorResponse(w, http.StatusConflict, "Username already exists")
		return
	}

	// Hash password
	hashedPassword, err := password.HashPassword(req.Password)
	if err != nil {
		userLog.Error("failed to hash password", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to create user")
		return
	}

	// Create user
	newUser := models.User{
		Username:     req.Username,
		PasswordHash: hashedPassword,
		Role:         req.Role,
		Name:         req.Name,
		Email:        req.Email,
		Phone:        req.Phone,
		IsActive:     true,
	}

	if err := db.Create(&newUser).Error; err != nil {
		userLog.Error("failed to create user", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to create user")
		return
	}

	userLog.Info("user created successfully", zap.String("username", newUser.Username), zap.Uint("user_id", newUser.ID))

	// Build response
	userResponse := structs.UserProfileResponse{
		ID:       newUser.ID,
		Username: newUser.Username,
		Name:     newUser.Name,
		Email:    newUser.Email,
		Phone:    newUser.Phone,
		Role:     newUser.Role,
	}

	responses.CreatedResponse(w, userResponse)
}

func UpdateProfile(w http.ResponseWriter, r *http.Request) {
	defer userLog.Sync()

	userId := r.PathValue("userId")

	// Parse request body
	var req structs.CreateUpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		userLog.Error("failed to decode request body", zap.Error(err))
		responses.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate required fields
	if req.Username == "" || req.Password == "" || req.ReEnterPassword == "" || req.Role == "" || req.Name == "" || req.Email == "" || req.Phone == "" {
		responses.ErrorResponse(w, http.StatusBadRequest, "Username, password, re_enter_password, role, name, email, and phone are required")
		return
	}

	// Validate passwords match
	if req.Password != req.ReEnterPassword {
		responses.ErrorResponse(w, http.StatusBadRequest, "Passwords do not match")
		return
	}

	// Validate role
	validRoles := map[string]bool{"admin": true, "operator": true}
	if !validRoles[req.Role] {
		responses.ErrorResponse(w, http.StatusBadRequest, "Invalid role. Must be one of: admin, operator")
		return
	}

	// Get database connection
	db, err := database.GetDB()
	if err != nil {
		userLog.Error("failed to get database connection", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Database connection error")
		return
	}

	// Fetch current user
	var user models.User
	if err := db.First(&user, userId).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			responses.ErrorResponse(w, http.StatusNotFound, "User not found")
			return
		}
		userLog.Error("failed to fetch user", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to update profile")
		return
	}

	// Update user
	if err := db.Model(&user).Updates(req).Error; err != nil {
		userLog.Error("failed to update user profile", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to update profile")
		return
	}

	// Fetch updated user
	if err := db.First(&user, userId).Error; err != nil {
		userLog.Error("failed to fetch updated user", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Profile updated but failed to fetch")
		return
	}

	responses.NoContentResponse(w)
}
