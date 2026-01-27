package main

import (
	routesv1 "app/api/routes/v1"
	"fmt"
	"library/go/env"
	"library/go/logger"
	"net/http"

	"github.com/joho/godotenv"
	"github.com/rs/cors"
	"go.uber.org/zap"
)

func main() {
	logger := logger.NewLogger("api")
	defer logger.Sync()

	if err := godotenv.Load(); err != nil {
		logger.Error("error load .env file",
			zap.Error(err),
		)
	}

	logger.Info("running at api...")

	portString := fmt.Sprintf(":%d", 8000)

	host := env.GetEnv("HOST", "localhost")
	port := env.GetEnv("PORT", portString)
	environment := env.GetEnv("ENV", "dev")

	mux := http.NewServeMux()
	routesv1.MainRoutes("v1", mux)

	// cors
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization", "Accept"},
		AllowCredentials: true,
	})

	sandboxLink := fmt.Sprintf("http://%s%s", host, port)
	logger.Info("running at 🚀⚙️",
		zap.String("link", sandboxLink),
		zap.String("environment", environment),
	)

	if err := http.ListenAndServe(port, c.Handler(mux)); err != nil && err != http.ErrServerClosed {
		logger.Fatal("error serve api",
			zap.String("port", port),
			zap.Error(err),
		)
	}
}
