package database

import (
	"library/go/env"
	"library/go/logger"
	"sync"

	"go.uber.org/zap"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var (
	instance *gorm.DB
	once     sync.Once
)

// GetDB returns a singleton database connection
func GetDB() (*gorm.DB, error) {
	var err error

	once.Do(func() {
		log := logger.NewLogger("database")
		defer log.Sync()

		dbURL := env.GetEnv("DATABASE_URL", "postgres://svm:superpw64@localhost:5432/svm?sslmode=disable")

		instance, err = gorm.Open(postgres.Open(dbURL), &gorm.Config{})
		if err != nil {
			log.Error("failed to connect to database", zap.Error(err))
			return
		}

		log.Info("database connection established", zap.String("url", dbURL))
	})

	return instance, err
}
