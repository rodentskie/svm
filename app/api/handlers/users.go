package handlers

import (
	"encoding/json"
	"library/go/database"
	"library/go/logger"
	"library/go/models"
	"library/go/password"
	"library/go/responses"
	"library/go/structs"
	"library/go/validate"
	"net/http"
	"strconv"

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

	// check if valid email
	if err := validate.ValidateEmail(req.Email); err != nil {
		responses.ErrorResponse(w, http.StatusBadRequest, "Invalid email format")
		return
	}

	// check if valid phone number
	if err := validate.PhPhoneValidate(req.Phone); err != nil {
		responses.ErrorResponse(w, http.StatusBadRequest, "Invalid phone number format")
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

	// check if valid email
	if err := validate.ValidateEmail(req.Email); err != nil {
		responses.ErrorResponse(w, http.StatusBadRequest, "Invalid email format")
		return
	}

	// check if valid phone number
	if err := validate.PhPhoneValidate(req.Phone); err != nil {
		responses.ErrorResponse(w, http.StatusBadRequest, "Invalid phone number format")
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

func DeleteUserByID(w http.ResponseWriter, r *http.Request) {
	defer userLog.Sync()

	// Extract user ID from URL path
	userIDStr := r.PathValue("userId")
	if userIDStr == "" {
		responses.ErrorResponse(w, http.StatusBadRequest, "User ID is required")
		return
	}

	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		responses.ErrorResponse(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Get database connection
	db, err := database.GetDB()
	if err != nil {
		userLog.Error("failed to get database connection", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Database connection error")
		return
	}

	// Fetch user
	var user models.User
	if err := db.First(&user, uint(userID)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			responses.ErrorResponse(w, http.StatusNotFound, "User not found")
			return
		}
		userLog.Error("failed to fetch user", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to delete user")
		return
	}

	// Soft delete using GORM
	if err := db.Delete(&user).Error; err != nil {
		userLog.Error("failed to delete user", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to delete user")
		return
	}

	responses.NoContentResponse(w)
}

func GetProfile(w http.ResponseWriter, r *http.Request) {
	defer userLog.Sync()

	// Get user ID from context (set by AuthMiddleware)
	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		responses.ErrorResponse(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Get database connection
	db, err := database.GetDB()
	if err != nil {
		userLog.Error("failed to get database connection", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Database connection error")
		return
	}

	// Fetch user from database
	var user models.User
	if err := db.First(&user, userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			responses.ErrorResponse(w, http.StatusNotFound, "User not found")
			return
		}
		userLog.Error("failed to fetch user profile", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch profile")
		return
	}

	// Build response
	profileResponse := structs.UserProfileResponse{
		ID:       user.ID,
		Username: user.Username,
		Name:     user.Name,
		Email:    user.Email,
		Phone:    user.Phone,
		Role:     user.Role,
	}

	responses.SuccessResponse(w, profileResponse)
}

func GetAllUsers(w http.ResponseWriter, r *http.Request) {
	defer userLog.Sync()

	// Get database connection
	db, err := database.GetDB()
	if err != nil {
		userLog.Error("failed to get database connection", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Database connection error")
		return
	}

	// Fetch all users
	var users []models.User
	if err := db.Find(&users).Error; err != nil {
		userLog.Error("failed to fetch users", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch users")
		return
	}

	// Build response
	var usersResponse []structs.GetUsersResponse
	for _, user := range users {
		usersResponse = append(usersResponse, structs.GetUsersResponse{
			ID:        user.ID,
			Username:  user.Username,
			Name:      user.Name,
			Email:     user.Email,
			Phone:     user.Phone,
			Role:      user.Role,
			CreatedAt: user.CreatedAt.Format("2006-01-02 15:04:05"),
			UpdatedAt: user.UpdatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	responses.SuccessResponse(w, usersResponse)
}

func GetSingleUser(w http.ResponseWriter, r *http.Request) {
	defer userLog.Sync()

	// Extract user ID from URL path
	userIDStr := r.PathValue("userId")
	if userIDStr == "" {
		responses.ErrorResponse(w, http.StatusBadRequest, "User ID is required")
		return
	}

	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		responses.ErrorResponse(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Get database connection
	db, err := database.GetDB()
	if err != nil {
		userLog.Error("failed to get database connection", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Database connection error")
		return
	}

	// Fetch user from database
	var user models.User
	if err := db.First(&user, userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			responses.ErrorResponse(w, http.StatusNotFound, "User not found")
			return
		}
		userLog.Error("failed to fetch user profile", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch profile")
		return
	}

	// Build response
	profileResponse := structs.UserProfileResponse{
		ID:       user.ID,
		Username: user.Username,
		Name:     user.Name,
		Email:    user.Email,
		Phone:    user.Phone,
		Role:     user.Role,
	}

	responses.SuccessResponse(w, profileResponse)
}
