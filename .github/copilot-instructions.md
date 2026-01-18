# SVM - Go Monorepo AI Instructions

## Project Description
This is a `Smart Vending Machine`. It is built using Go in a monorepo structure managed by Nx. The backend consists of an API server and a migrations CLI, with reusable libraries for database access, authentication, models, and more.

## Architecture Overview

This is a **Go monorepo managed by Nx** (`@obiente-lab/nx-go` plugin) using **Go workspaces** (`go.work`). The project structure separates concerns into:
- `app/`: Executable applications (api server, migrations CLI)
- `library/go/`: Reusable Go packages (database, auth, models, etc.)

All Go modules are independent with their own `go.mod`, linked via `go.work` for local development. Each component has a `project.json` defining Nx targets (build, serve, test, lint, tidy).

## Critical Commands (Use Nx, NOT go directly)

```bash
# Run migrations (uses golang-migrate from file://transactions)
nx serve migrations up|down|drop

# Serve API application
nx serve api

# Test/lint/tidy specific project
nx test <project-name>
nx lint <project-name>
nx tidy <project-name>

# Run targets across multiple projects
nx run-many -t test --parallel=5
```

**Important**: 
- Always use `nx` commands instead of `go` commands directly. The monorepo structure requires Nx executors.
- Look at always `library/go/models` for data models, do not create fields that don't exist.

## Database & Migrations

- **Database**: PostgreSQL (docker-compose.yml), default connection: `postgres://svm:superpw64@localhost:5432/svm`
- **ORM**: GORM for app code, golang-migrate for schema migrations
- **Migrations location**: `app/migrations/transactions/*.sql`
- **Pattern**: Migrations use SQL with trigger functions (e.g., `update_updated_at_column()` in `000001_create_functions.up.sql`)
- **DATABASE_URL**: Environment variable (defaults provided if not set)

Start database: `docker-compose up -d`

## Go Package Import Patterns

Internal packages are imported using **workspace-relative paths**:
```go
import (
    "library/go/database"
    "library/go/models"
    "library/go/jwt"
    "library/go/logger"
)
```

This is configured via `go.work` which links all modules. When creating new libraries or apps, ensure they're added to `go.work`.

## Code Conventions

### Models (library/go/models/)
- Use GORM struct tags with JSON tags
- Sensitive fields use `json:"-"` (e.g., `PasswordHash`, `JwtToken`)
- Timestamps use GORM conventions: `CreatedAt`, `UpdatedAt`, `DeletedAt`
- Custom methods on models (e.g., `User.IsAdmin()`)
- Example: [library/go/models/users.go](library/go/models/users.go)

### Request/Response DTOs (library/go/structs/)
- Separate structs for API requests/responses (e.g., `LoginRequest`, `LoginResponse`)
- Use `binding:"required"` tags for validation (Gin-compatible)
- Import `library/go/models` for embedded model types

### API Responses (library/go/responses/)
- Standardized response helpers: `SuccessResponse()`, `ErrorResponse()`, `CreatedResponse()`
- Always use these instead of manual JSON encoding
- Example: [library/go/responses/responses.go](library/go/responses/responses.go)

### Logging (library/go/logger/)
- Uses Zap logger with structured logging
- Pattern: `logger.NewLogger("component-name")` with `defer logger.Sync()`
- Example in [app/migrations/main.go](app/migrations/main.go#L18-L19)

### Authentication (library/go/jwt/)
- JWT tokens with custom Claims struct (UserID, Username, Role)
- JWT_SECRET from environment (default provided for dev)
- Token expiration: 24 hours (hardcoded)

### Database Access (library/go/database/)
- **Singleton pattern** with `sync.Once` - use `GetDB()` to get connection
- Do NOT create multiple GORM instances
- Example: [library/go/database/database.go](library/go/database/database.go)

### Environment Variables (library/go/env/)
- Helper: `env.GetEnv(key, defaultValue)` - always provide sensible defaults
- Uses `godotenv` but gracefully handles missing `.env` files

## Creating New Components

**New library**:
```bash
NAME=mylib && nx g @obiente-lab/nx-go:library $NAME --directory library/go/$NAME
```

**New application**:
```bash
NAME=myapp && nx g @obiente-lab/nx-go:application $NAME --directory app/$NAME
```

After generation, add the new module path to `go.work` manually.

## Testing

- Test files: `*_test.go` alongside source files
- Run with: `nx test <project-name>`
- Libraries have test targets but no build/serve targets (see `project.json`)

## Common Pitfalls

1. **Don't use `go run`, `go build`, or `go test` directly** - always use Nx commands
2. **Imports must use workspace paths** (`library/go/xyz`) not relative paths
3. **Database singleton** - never call `gorm.Open()` directly, use `database.GetDB()`
4. **Migrations run from app/migrations directory** - the `file://transactions` path is relative to execution context
5. **go.work must include all modules** - forgotten entries cause import failures
