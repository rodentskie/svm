# SVM - Go Monorepo AI Instructions

## Project Description
This is a **Smart Vending Machine** system. It is built using Go in a monorepo structure managed by Nx. The backend consists of an API server and a migrations CLI, with reusable libraries for database access, authentication, models, and more. The frontend is a Next.js 16 app using React 19 and Chakra UI.

## Architecture Overview

This is a **Go monorepo managed by Nx** (`@nx-go/nx-go` plugin) using **Go workspaces** (`go.work`). The project structure separates concerns into:
- `app/`: Executable applications (API server, migrations CLI, Next.js frontends)
  - `api/`: Go HTTP API server with authentication and business logic
  - `migrations/`: CLI for database schema management (golang-migrate)
  - `app/`: Next.js 16 admin/management frontend (port 3000)
  - `kiosk/`: Next.js 16 kiosk interface for student/customer use
- `library/go/`: Reusable Go packages (database, auth, models, jwt, logger, responses, etc.)
- `library/next/components/`: Shared React components library (Chakra UI v3) used by both frontends

All Go modules are independent with their own `go.mod`, linked via `go.work` for local development. Each component has a `project.json` defining Nx targets (build, serve, test, lint, tidy).

## Critical Commands (Use Nx, NOT go directly)

```bash
# Start PostgreSQL database
docker-compose up -d

# Run migrations (uses golang-migrate from file://transactions)
nx serve migrations up|down|drop

# Serve API application (uses gow for hot-reload)
nx serve api

# Serve Next.js admin frontend
nx dev app

# Serve Next.js kiosk frontend
nx dev kiosk

# Test/lint/tidy specific project
nx test <project-name>
nx lint <project-name>
nx tidy <project-name>

# Run targets across multiple projects
nx run-many -t test --parallel=5
nx run-many -t lint --parallel=5
nx run-many -t tidy --parallel=5
```

**Important**: 
- Always use `nx` commands instead of `go` commands directly. The monorepo structure requires Nx executors.
- Always look at `library/go/models` for data models, do not create fields that don't exist.
- API uses `gow` for hot-reload during development (defined in `project.json`).

## Database & Migrations

- **Database**: PostgreSQL (docker-compose.yml), default connection: `postgres://svm:superpw64@localhost:5432/svm`
- **ORM**: GORM for app code, golang-migrate for schema migrations
- **Migrations location**: `app/migrations/transactions/*.sql`
- **Pattern**: Migrations use SQL with trigger functions (e.g., `update_updated_at_column()` in `000001_create_functions.up.sql`)
- **Naming convention**: `{number}_{description}.{up|down}.sql` (e.g., `000002_create_user_table.up.sql`)
- **DATABASE_URL**: Environment variable (defaults provided if not set)
- **Trigger pattern**: All tables auto-update `updated_at` via `BEFORE UPDATE` triggers calling `update_updated_at_column()`

Start database: `docker-compose up -d`

### Migration Workflow
1. Create `.up.sql` and `.down.sql` files in `app/migrations/transactions/`
2. Include trigger setup for auto-updating timestamps: `CREATE TRIGGER update_<table>_updated_at BEFORE UPDATE ON <table> FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`
3. Run with: `nx serve migrations up` (from project root)
4. Rollback with: `nx serve migrations down` (rolls back last migration)
5. Drop all: `nx serve migrations drop` (wipes entire schema)

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
- Use `gorm:"<-:false"` for read-only timestamp fields
- Custom methods on models (e.g., `User.IsAdmin()`, `Product.IsLowStock()`)
- Relationships defined with `gorm:"foreignKey:FieldName"` and omitted from JSON with `omitempty`
- Example: [library/go/models/users.go](library/go/models/users.go), [library/go/models/products.go](library/go/models/products.go)

### Request/Response DTOs (library/go/structs/)
- Separate structs for API requests/responses (e.g., `LoginRequest`, `LoginResponse` in `auth.go`)
- Use `binding:"required"` tags for validation (Gin-compatible, though project uses stdlib)
- Import `library/go/models` for embedded model types
- Example: [library/go/structs/auth.go](library/go/structs/auth.go)

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

## API Architecture (app/api/)

### HTTP Router (stdlib http.ServeMux)
- Uses Go 1.22+ enhanced routing: `http.ServeMux` with method prefixes
- Route pattern: `"POST /v1/login"` or `"GET /v1/users/{userId}"`
- Path parameters extracted via `r.PathValue("userId")`
- Routes organized in `app/api/routes/v1/main.go` using prefix pattern
- Example: [app/api/routes/v1/main.go](app/api/routes/v1/main.go)

### Handlers (app/api/handlers/)
- Standard `http.HandlerFunc` signature: `func(w http.ResponseWriter, r *http.Request)`
- Always use `responses.SuccessResponse()`, `ErrorResponse()`, etc. - never manual JSON encoding
- Get path params with `r.PathValue("paramName")`
- Parse request body with `json.NewDecoder(r.Body).Decode(&struct)`
- Example: [app/api/handlers/login.go](app/api/handlers/login.go)

### Middleware (app/api/middlewares/)
- Middleware pattern: `func(db *gorm.DB) func(http.Handler) http.Handler`
- AuthMiddleware validates JWT from `Authorization: Bearer <token>` header
- Adds user context via `r.Context()` with key `"user"` (type `*models.User`)
- Protected routes wrapped: `middleware.AuthMiddleware(db)(http.HandlerFunc(handler))`
- Example: [app/api/middlewares/auth.go](app/api/middlewares/auth.go)

### CORS Configuration
- Uses `github.com/rs/cors` package
- Default: allows `http://localhost:3000` (Next.js frontend)
- Configured in [app/api/main.go](app/api/main.go) with `AllowCredentials: true`

## Domain-Specific Patterns

### Student Management (RFID-based)
- Students identified by unique 10-char RFID
- Each student has a "load" (wallet balance) tracked in database
- Load updates via `POST /v1/students/{studentId}/load`
- Transaction details link purchases to RFID for tracking
- Models: [Student](library/go/models/students.go), [StudentsTransactionHistory](library/go/models/students_transaction_history.go)

### Transaction & Inventory System
- Transactions record product purchases with automatic stock updates via DB triggers
- TransactionDetails table links transactions to student RFID
- InventoryAdjustments table tracks manual stock changes (restocks, waste, etc.)
- Triggers automatically update `products.stock` when transactions or adjustments occur
- Example: [transactions.go](library/go/models/transactions.go), [transaction_details.go](library/go/models/transaction_details.go)

## Frontend (app/app/ & app/kiosk/)

- **Framework**: Next.js 16 with App Router
- **React**: Version 19
- **UI Library**: Chakra UI v3.31.0
- **Theming**: next-themes for dark/light mode
- **Icons**: react-icons
- **Dev servers**: 
  - Admin app: `nx dev app` (default port 3000)
  - Kiosk app: `nx dev kiosk` (separate instance)
- **Build**: `nx build app` or `nx build kiosk` for production builds
- **Shared components**: Located in `library/next/components/src/` with ~57 pre-built Chakra UI components
  - Components imported as: `import { Provider } from '@svm/components/provider'`
  - All components use Chakra UI v3 primitives
  - Provider wraps apps for theming support

## Creating New Components

**New library**:
```bash
NAME=mylib && nx g @nx-go/nx-go:library $NAME --directory library/go/$NAME
```

**New application**:
```bash
NAME=myapp && nx g @nx-go/nx-go:application $NAME --directory app/$NAME
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
