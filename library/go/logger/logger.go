package logger

import (
	"library/go/env"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

func loggerConfig() zap.Config {
	GOENV := env.GetEnv("ENV", "dev")

	config := zap.NewProductionConfig()

	if GOENV == "test" {
		// disable logs during test environment
		config.Level = zap.NewAtomicLevelAt(zapcore.FatalLevel)
	}

	return config
}

func NewLogger(service string) *zap.Logger {
	config := loggerConfig()
	logger, err := config.Build()
	if err != nil {
		// Fallback to a basic logger if config fails
		logger, _ = zap.NewProduction()
	}
	// Add service name to logger context
	return logger.Named(service)
}
