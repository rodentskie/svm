package handlers

import (
	"encoding/json"
	"library/go/database"
	"library/go/jwt"
	"library/go/logger"
	"library/go/models"
	"library/go/password"
	"library/go/responses"
	"library/go/structs"

	"net/http"

	"go.uber.org/zap"
)

func LoginRequestHandler(w http.ResponseWriter, r *http.Request) {
	log := logger.NewLogger("login-handler")
	defer log.Sync()

	// Parse request body
	var loginReq structs.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&loginReq); err != nil {
		log.Error("failed to decode request body", zap.Error(err))
		responses.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate required fields
	if loginReq.Username == "" || loginReq.Password == "" {
		responses.ErrorResponse(w, http.StatusBadRequest, "Username and password are required")
		return
	}

	// Get database connection
	db, err := database.GetDB()
	if err != nil {
		log.Error("failed to get database connection", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Database connection error")
		return
	}

	// Find user by username
	var user models.User
	if err := db.Where("username = ? AND is_active = ?", loginReq.Username, true).First(&user).Error; err != nil {
		log.Error("user not found or inactive", zap.String("username", loginReq.Username), zap.Error(err))
		responses.ErrorResponse(w, http.StatusUnauthorized, "Invalid username or password")
		return
	}

	// Validate password
	if err := password.ValidatePassword(user.PasswordHash, loginReq.Password); err != nil {
		log.Error("invalid password", zap.String("username", loginReq.Username), zap.Error(err))
		responses.ErrorResponse(w, http.StatusUnauthorized, "Invalid username or password")
		return
	}

	// Generate JWT token
	token, err := jwt.GenerateToken(user.ID, user.Username, user.Role)
	if err != nil {
		log.Error("failed to generate JWT token", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to generate authentication token")
		return
	}

	// Store JWT token in database
	user.JwtToken = token
	if err := db.Save(&user).Error; err != nil {
		log.Error("failed to save JWT token", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to save authentication token")
		return
	}

	// Success - return user data with JWT token
	log.Info("user logged in successfully", zap.String("username", user.Username), zap.Uint("user_id", user.ID))

	loginResp := structs.LoginResponse{
		Token: token,
		User:  user,
	}

	responses.SuccessResponse(w, loginResp)
}
