package routesv1

import (
	handlers "app/api/handlers"
	middleware "app/api/middlewares"
	"fmt"
	"library/go/database"
	"library/go/logger"
	"net/http"

	"go.uber.org/zap"
)

func MainRoutes(prefix string, mux *http.ServeMux) {
	log := logger.NewLogger("v1-routes")
	defer log.Sync()

	db, err := database.GetDB()
	if err != nil {
		log.Error("failed to get database connection",
			zap.Error(err),
		)
	}

	mux.HandleFunc(fmt.Sprintf("/%s/", prefix), handlers.IndexRequestHandler)
	mux.HandleFunc(fmt.Sprintf("POST /%s/login", prefix), handlers.LoginRequestHandler)

	// users
	mux.Handle(
		fmt.Sprintf("POST /%s/users", prefix),
		middleware.AuthMiddleware(db)(http.HandlerFunc(handlers.CreateUser)),
	)
	mux.Handle(
		fmt.Sprintf("PATCH /%s/users/{userId}", prefix),
		middleware.AuthMiddleware(db)(http.HandlerFunc(handlers.UpdateProfile)),
	)

	mux.Handle(
		fmt.Sprintf("DELETE /%s/users/{userId}", prefix),
		middleware.AuthMiddleware(db)(http.HandlerFunc(handlers.DeleteUserByID)),
	)
}
