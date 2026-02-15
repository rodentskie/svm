package responses

import (
	"encoding/json"
	"net/http"
)

// JSONResponse sends a JSON response with the given status code and data
func JSONResponse(w http.ResponseWriter, statusCode int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	if err := json.NewEncoder(w).Encode(data); err != nil {
		// If encoding fails, send a simple error response
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error":"failed to encode response"}`))
	}
}

// SuccessResponse sends a successful JSON response (200 OK)
func SuccessResponse(w http.ResponseWriter, data any) {
	JSONResponse(w, http.StatusOK, data)
}

// ErrorResponse sends an error JSON response with a message
func ErrorResponse(w http.ResponseWriter, statusCode int, message string) {
	errorData := map[string]string{"error": message}
	JSONResponse(w, statusCode, errorData)
}

func ErrorResponseJSON(w http.ResponseWriter, statusCode int, res any) {
	JSONResponse(w, statusCode, res)
}

// MessageResponse sends a simple message response (200 OK)
func MessageResponse(w http.ResponseWriter, message string) {
	messageData := map[string]string{"message": message}
	SuccessResponse(w, messageData)
}

// CreatedResponse sends a 201 Created response
func CreatedResponse(w http.ResponseWriter, data any) {
	JSONResponse(w, http.StatusCreated, data)
}

// NoContentResponse sends a 204 No Content response
func NoContentResponse(w http.ResponseWriter) {
	w.WriteHeader(http.StatusNoContent)
}

// BadRequestResponse sends a 400 Bad Request response
func BadRequestResponse(w http.ResponseWriter, message string) {
	ErrorResponse(w, http.StatusBadRequest, message)
}

// NotFoundResponse sends a 404 Not Found response
func NotFoundResponse(w http.ResponseWriter, message string) {
	ErrorResponse(w, http.StatusNotFound, message)
}

// InternalServerErrorResponse sends a 500 Internal Server Error response
func InternalServerErrorResponse(w http.ResponseWriter, message string) {
	ErrorResponse(w, http.StatusInternalServerError, message)
}
