package middleware

import (
	"context"
	"errors"
	"library/go/jwt"
	"library/go/logger"
	"library/go/models"
	"library/go/responses"
	"net/http"
	"strings"

	"go.uber.org/zap"
	"gorm.io/gorm"
)

var log = logger.NewLogger("auth-middleware")

// AuthMiddleware validates authentication and adds user context
func AuthMiddleware(db *gorm.DB) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get Authorization header
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				responses.ErrorResponse(w, http.StatusUnauthorized, "Authorization header required")
				return
			}

			// Extract token from "Bearer <token>" format
			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				responses.ErrorResponse(w, http.StatusUnauthorized, "Invalid authorization header format")
				return
			}

			token := parts[1]

			// Validate JWT token
			claims, err := jwt.ValidateToken(token)
			if err != nil {
				if errors.Is(err, jwt.ErrExpiredToken) {
					responses.ErrorResponse(w, http.StatusUnauthorized, "Token has expired")
					return
				}
				log.Error("invalid token", zap.Error(err))
				responses.ErrorResponse(w, http.StatusUnauthorized, "Invalid or expired token")
				return
			}

			// Verify user exists and is active
			var user models.User
			if err := db.Where("id = ? AND is_active = ?", claims.UserID, true).First(&user).Error; err != nil {
				if err == gorm.ErrRecordNotFound {
					responses.ErrorResponse(w, http.StatusUnauthorized, "User not found or inactive")
					return
				}
				log.Error("database error during authentication", zap.Error(err))
				responses.ErrorResponse(w, http.StatusInternalServerError, "Authentication failed")
				return
			}

			// Verify token matches the one stored in database
			if user.JwtToken != token {
				log.Warn("token mismatch - possible token reuse or session hijacking",
					zap.Uint("user_id", user.ID),
					zap.String("username", user.Username))
				responses.ErrorResponse(w, http.StatusForbidden, "Invalid token")
				return
			}

			// Add user ID and user object to request context
			ctx := context.WithValue(r.Context(), "user_id", user.ID)
			ctx = context.WithValue(ctx, "user", user)

			// Call next handler with updated context
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
