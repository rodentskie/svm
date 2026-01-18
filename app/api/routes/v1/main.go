package routesv1

import (
	handlers "app/api/handlers"
	"fmt"
	"net/http"
)

func MainRoutes(prefix string, mux *http.ServeMux) {
	mux.HandleFunc(fmt.Sprintf("/%s/", prefix), handlers.IndexRequestHandler)
}
