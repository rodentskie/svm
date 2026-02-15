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

	mux.Handle(
		fmt.Sprintf("GET /%s/users/me", prefix),
		middleware.AuthMiddleware(db)(http.HandlerFunc(handlers.GetProfile)),
	)

	mux.Handle(
		fmt.Sprintf("GET /%s/users", prefix),
		middleware.AuthMiddleware(db)(http.HandlerFunc(handlers.GetAllUsers)),
	)

	mux.Handle(
		fmt.Sprintf("GET /%s/users/{userId}", prefix),
		middleware.AuthMiddleware(db)(http.HandlerFunc(handlers.GetSingleUser)),
	)

	// products
	mux.Handle(
		fmt.Sprintf("GET /%s/products", prefix),
		http.HandlerFunc(handlers.GetAllProducts),
	)

	mux.Handle(
		fmt.Sprintf("GET /%s/products/categories", prefix),
		http.HandlerFunc(handlers.GetAllProductCategories),
	)

	mux.Handle(
		fmt.Sprintf("GET /%s/products/{productId}", prefix),
		http.HandlerFunc(handlers.GetSingleProduct),
	)

	mux.Handle(
		fmt.Sprintf("PATCH /%s/products/{productId}", prefix),
		middleware.AuthMiddleware(db)(http.HandlerFunc(handlers.PatchSingleProduct)),
	)

	mux.Handle(
		fmt.Sprintf("DELETE /%s/products/{productId}", prefix),
		middleware.AuthMiddleware(db)(http.HandlerFunc(handlers.DeleteSingleProduct)),
	)

	mux.Handle(
		fmt.Sprintf("POST /%s/products", prefix),
		middleware.AuthMiddleware(db)(http.HandlerFunc(handlers.CreateProduct)),
	)

	// transactions
	mux.Handle(
		fmt.Sprintf("POST /%s/transactions", prefix),
		http.HandlerFunc(handlers.CreateTransaction),
	)

	mux.Handle(
		fmt.Sprintf("POST /%s/transactions/adjustments/{productId}", prefix),
		middleware.AuthMiddleware(db)(http.HandlerFunc(handlers.CreateTransactionAdjustment)),
	)

	// TO IMPLEMENT LATER: transaction details routes

	// students
	mux.Handle(
		fmt.Sprintf("GET /%s/students", prefix),
		middleware.AuthMiddleware(db)(http.HandlerFunc(handlers.GetAllStudents)),
	)

	mux.Handle(
		fmt.Sprintf("GET /%s/students/{studentId}", prefix),
		middleware.AuthMiddleware(db)(http.HandlerFunc(handlers.GetSingleStudent)),
	)

	mux.Handle(
		fmt.Sprintf("POST /%s/students", prefix),
		middleware.AuthMiddleware(db)(http.HandlerFunc(handlers.CreateStudent)),
	)

	mux.Handle(
		fmt.Sprintf("PATCH /%s/students/{studentId}", prefix),
		middleware.AuthMiddleware(db)(http.HandlerFunc(handlers.UpdateStudent)),
	)

	mux.Handle(
		fmt.Sprintf("POST /%s/students/{studentId}/load", prefix),
		middleware.AuthMiddleware(db)(http.HandlerFunc(handlers.UpdateStudentLoad)),
	)

	mux.Handle(
		fmt.Sprintf("DELETE /%s/students/{studentId}", prefix),
		middleware.AuthMiddleware(db)(http.HandlerFunc(handlers.DeleteStudent)),
	)

	mux.Handle(
		fmt.Sprintf("GET /%s/students/rfid", prefix),
		http.HandlerFunc(handlers.GetStudentByRFID),
	)

	// payment methods
	mux.Handle(
		fmt.Sprintf("GET /%s/payment_methods", prefix),
		http.HandlerFunc(handlers.GetAllPaymentMethods),
	)

	// paymongo integration
	mux.Handle(
		fmt.Sprintf("POST /%s/payment_methods", prefix),
		http.HandlerFunc(handlers.PayMongoCreatePaymentMethod),
	)

	mux.Handle(
		fmt.Sprintf("POST /%s/payment_intents", prefix),
		http.HandlerFunc(handlers.PayMongoCreatePaymentIntent),
	)

	mux.Handle(
		fmt.Sprintf("POST /%s/payment_intents/attach", prefix),
		http.HandlerFunc(handlers.PayMongoAttachPaymentIntent),
	)

	mux.Handle(
		fmt.Sprintf("GET /%s/payment_intents/{paymentIntentId}", prefix),
		http.HandlerFunc(handlers.PayMongoGetPaymentIntent),
	)

}
