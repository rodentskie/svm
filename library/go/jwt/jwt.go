package jwt

import (
	"errors"
	"library/go/env"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Claims represents the JWT claims structure
type Claims struct {
	UserID   uint   `json:"user_id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

var (
	ErrInvalidToken     = errors.New("invalid token")
	ErrExpiredToken     = errors.New("token has expired")
	ErrInvalidSignature = errors.New("invalid token signature")
)

// getSecretKey returns the JWT secret key from environment
func getSecretKey() []byte {
	secret := env.GetEnv("JWT_SECRET", "your-secret-key-change-this-in-production")
	return []byte(secret)
}

// GenerateToken creates a new JWT token for a user
func GenerateToken(userID uint, username, role string) (string, error) {
	// Get expiration time from env (default 24 hours)
	expirationHours := 24

	// Create claims
	claims := Claims{
		UserID:   userID,
		Username: username,
		Role:     role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour * time.Duration(expirationHours))),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "svm-api",
		},
	}

	// Create token with claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign token with secret key
	tokenString, err := token.SignedString(getSecretKey())
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// ValidateToken validates a JWT token and returns the claims
func ValidateToken(tokenString string) (*Claims, error) {
	// Parse token
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		// Verify signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidSignature
		}
		return getSecretKey(), nil
	})

	if err != nil {
		// Check if token is expired
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrExpiredToken
		}
		return nil, ErrInvalidToken
	}

	// Extract claims
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

// RefreshToken generates a new token with extended expiration
func RefreshToken(oldToken string) (string, error) {
	// Validate old token
	claims, err := ValidateToken(oldToken)
	if err != nil && !errors.Is(err, ErrExpiredToken) {
		return "", err
	}

	// Generate new token with same claims
	return GenerateToken(claims.UserID, claims.Username, claims.Role)
}
