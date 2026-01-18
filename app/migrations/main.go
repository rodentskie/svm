package main

import (
	"database/sql"
	"fmt"
	"library/go/env"
	"library/go/logger"
	"os"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
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

	// Get database connection string from environment
	dbURL := env.GetEnv("DATABASE_URL", "")
	if dbURL == "" {
		dbURL = "postgres://svm:superpw64@localhost:5432/svm?sslmode=disable"
		logger.Info("using default database url",
			zap.String("DATABASE_URL", dbURL),
		)
	}

	// Open database connection
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		logger.Error("Failed to connect to database",
			zap.Error(err),
		)
	}
	defer db.Close()

	// Create postgres driver instance
	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		logger.Error("Failed to create driver",
			zap.Error(err),
		)
	}

	// Create migrate instance
	m, err := migrate.NewWithDatabaseInstance(
		"file://transactions",
		"postgres",
		driver,
	)
	if err != nil {
		logger.Error("Failed to create migrate instance",
			zap.Error(err),
		)
	}

	// Get command from arguments
	if len(os.Args) < 2 {
		printUsage()
		os.Exit(1)
	}

	command := os.Args[1]

	switch command {
	case "up":
		if err := m.Up(); err != nil && err != migrate.ErrNoChange {
			logger.Error("Migration up failed",
				zap.Error(err),
			)
			os.Exit(1)
		}
		logger.Info("✓ Migrations applied successfully")

	case "down":
		if err := m.Down(); err != nil && err != migrate.ErrNoChange {
			logger.Error("Migration down failed",
				zap.Error(err),
			)
			os.Exit(1)
		}
		logger.Info("✓ Last migration rolled back")

	case "drop":
		if err := m.Drop(); err != nil {
			logger.Error("Drop failed",
				zap.Error(err),
			)
			os.Exit(1)
		}
		logger.Info("✓ All migrations dropped")

	case "version":
		version, dirty, err := m.Version()
		if err != nil {
			logger.Error("Failed to get version",
				zap.Error(err),
			)
			os.Exit(1)
		}
		fmt.Printf("Current version: %d (dirty: %v)\n", version, dirty)

	case "force":
		if len(os.Args) < 3 {
			logger.Error("Usage: migrate force <version>")
			os.Exit(1)
		}
		var version int
		fmt.Sscanf(os.Args[2], "%d", &version)
		if err := m.Force(version); err != nil {
			logger.Error("Force failed",
				zap.Error(err),
			)
			os.Exit(1)
		}
		logger.Info(fmt.Sprintf("✓ Forced version to %d", version))

	case "steps":
		if len(os.Args) < 3 {
			logger.Error("Usage: migrate steps <n>")
			os.Exit(1)
		}
		var steps int
		fmt.Sscanf(os.Args[2], "%d", &steps)
		if err := m.Steps(steps); err != nil && err != migrate.ErrNoChange {
			logger.Error("Migration steps failed",
				zap.Error(err),
			)
			os.Exit(1)
		}
		logger.Info(fmt.Sprintf("✓ Migrated %d steps", steps))

	default:
		printUsage()
		os.Exit(1)
	}
}

func printUsage() {
	usage := `
Vending Machine Database Migrator

Usage:
  migrate <command>

Commands:
  up         Apply all pending migrations
  down       Rollback the last migration
  drop       Drop everything (use with caution!)
  version    Show current migration version
  force <v>  Force set migration version (use when migrations are dirty)
  steps <n>  Apply next n migrations (negative to rollback)

Environment Variables:
  DATABASE_URL   PostgreSQL connection string
                 Default: postgres://postgres:postgres@localhost:5432/vending_machine?sslmode=disable

Examples:
  migrate up
  migrate down
  migrate version
  migrate steps 2
  migrate steps -1
  migrate force 3
`
	fmt.Println(usage)
}
