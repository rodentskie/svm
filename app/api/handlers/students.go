package handlers

import (
	"encoding/json"
	"library/go/database"
	"library/go/logger"
	"library/go/models"
	"library/go/password"
	"library/go/responses"
	"library/go/structs"
	"library/go/validate"
	"net/http"
	"strconv"

	"go.uber.org/zap"
	"gorm.io/gorm"
)

var studentLog = logger.NewLogger("students-handler")

// CreateStudent creates a new student
func CreateStudent(w http.ResponseWriter, r *http.Request) {
	defer studentLog.Sync()

	// Parse request body
	var req structs.CreateStudentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		studentLog.Error("failed to decode request body", zap.Error(err))
		responses.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate required fields
	if req.Name == "" || req.RFID == "" || req.Pin == "" {
		responses.ErrorResponse(w, http.StatusBadRequest, "Name, RFID, and PIN are required")
		return
	}

	// Get database connection
	db, err := database.GetDB()
	if err != nil {
		studentLog.Error("failed to get database connection", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Database connection error")
		return
	}

	// Check if RFID already exists
	var existingStudent models.Student
	if err := db.Where("rfid = ?", req.RFID).First(&existingStudent).Error; err == nil {
		responses.ErrorResponse(w, http.StatusConflict, "Student with this RFID already exists")
		return
	}

	// Check if name already exists (case-insensitive)
	if err := db.Where("LOWER(name) = LOWER(?)", req.Name).First(&existingStudent).Error; err == nil {
		responses.ErrorResponse(w, http.StatusConflict, "Student with this name already exists")
		return
	}

	// pin only needs to be 4 digits, so we can enforce that here
	if !validate.IsValidPIN(req.Pin) {
		responses.ErrorResponse(w, http.StatusBadRequest, "PIN must be exactly 4 numeric digits")
		return
	}

	// Hash pin
	hashedPin, err := password.HashPassword(req.Pin)
	if err != nil {
		studentLog.Error("failed to hash pin", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to create student")
		return
	}

	// Create student
	newStudent := models.Student{
		Name:    req.Name,
		RFID:    req.RFID,
		PinHash: hashedPin,
	}

	if err := db.Create(&newStudent).Error; err != nil {
		studentLog.Error("failed to create student", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to create student")
		return
	}

	studentLog.Info("student created successfully", zap.String("name", newStudent.Name), zap.Uint("student_id", newStudent.ID))

	// Build response
	studentResponse := structs.StudentResponse{
		ID:   newStudent.ID,
		Name: newStudent.Name,
		RFID: newStudent.RFID,
		Load: newStudent.Load,
	}

	responses.CreatedResponse(w, studentResponse)
}

// GetAllStudents retrieves all students
func GetAllStudents(w http.ResponseWriter, r *http.Request) {
	defer studentLog.Sync()

	// Get database connection
	db, err := database.GetDB()
	if err != nil {
		studentLog.Error("failed to get database connection", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Database connection error")
		return
	}

	// Fetch all students
	var students []models.Student
	if err := db.Find(&students).Error; err != nil {
		studentLog.Error("failed to fetch students", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch students")
		return
	}

	// Build response
	var studentResponses []structs.StudentResponse
	for _, student := range students {
		studentResponses = append(studentResponses, structs.StudentResponse{
			ID:        student.ID,
			Name:      student.Name,
			RFID:      student.RFID,
			Load:      student.Load,
			CreatedAt: student.CreatedAt.Format("2006-01-02 15:04:05"),
			UpdatedAt: student.UpdatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	responses.SuccessResponse(w, studentResponses)
}

// GetSingleStudent retrieves a single student by ID
func GetSingleStudent(w http.ResponseWriter, r *http.Request) {
	defer studentLog.Sync()

	// Get student ID from URL path
	studentIDStr := r.PathValue("studentId")
	studentID, err := strconv.ParseUint(studentIDStr, 10, 64)
	if err != nil {
		responses.ErrorResponse(w, http.StatusBadRequest, "Invalid student ID")
		return
	}

	// Get database connection
	db, err := database.GetDB()
	if err != nil {
		studentLog.Error("failed to get database connection", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Database connection error")
		return
	}

	// Fetch student
	var student models.Student
	if err := db.First(&student, studentID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			responses.ErrorResponse(w, http.StatusNotFound, "Student not found")
			return
		}
		studentLog.Error("failed to fetch student", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch student")
		return
	}

	// Build response
	studentResponse := structs.StudentResponse{
		ID:   student.ID,
		Name: student.Name,
		RFID: student.RFID,
		Load: student.Load,
	}

	responses.SuccessResponse(w, studentResponse)
}

// UpdateStudent updates an existing student
func UpdateStudent(w http.ResponseWriter, r *http.Request) {
	defer studentLog.Sync()

	// Get student ID from URL path
	studentIDStr := r.PathValue("studentId")
	studentID, err := strconv.ParseUint(studentIDStr, 10, 64)
	if err != nil {
		responses.ErrorResponse(w, http.StatusBadRequest, "Invalid student ID")
		return
	}

	// Parse request body
	var req structs.UpdateStudentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		studentLog.Error("failed to decode request body", zap.Error(err))
		responses.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Get database connection
	db, err := database.GetDB()
	if err != nil {
		studentLog.Error("failed to get database connection", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Database connection error")
		return
	}

	// Check if student exists
	var student models.Student
	if err := db.First(&student, studentID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			responses.ErrorResponse(w, http.StatusNotFound, "Student not found")
			return
		}
		studentLog.Error("failed to fetch student", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch student")
		return
	}

	// Check if name already exists (excluding current student, case-insensitive)
	if req.Name != "" && req.Name != student.Name {
		var existingStudent models.Student
		if err := db.Where("LOWER(name) = LOWER(?) AND id != ?", req.Name, studentID).First(&existingStudent).Error; err == nil {
			responses.ErrorResponse(w, http.StatusConflict, "Student with this name already exists")
			return
		}
	}

	// Check if RFID already exists (excluding current student)
	if req.RFID != "" && req.RFID != student.RFID {
		var existingStudent models.Student
		if err := db.Where("rfid = ? AND id != ?", req.RFID, studentID).First(&existingStudent).Error; err == nil {
			responses.ErrorResponse(w, http.StatusConflict, "Student with this RFID already exists")
			return
		}
	}

	// pin only needs to be 4 digits, so we can enforce that here
	if req.Pin != "" && !validate.IsValidPIN(req.Pin) {
		responses.ErrorResponse(w, http.StatusBadRequest, "PIN must be exactly 4 numeric digits")
		return
	}

	// Update fields
	updates := make(map[string]any)
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.RFID != "" {
		updates["rfid"] = req.RFID
	}
	if req.Pin != "" {
		hashedPin, err := password.HashPassword(req.Pin)
		if err != nil {
			studentLog.Error("failed to hash pin", zap.Error(err))
			responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to update student")
			return
		}
		updates["pin_hash"] = hashedPin
	}

	// Update student
	if err := db.Model(&student).Updates(updates).Error; err != nil {
		studentLog.Error("failed to update student", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to update student")
		return
	}

	// Fetch updated student
	if err := db.First(&student, studentID).Error; err != nil {
		studentLog.Error("failed to fetch updated student", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch updated student")
		return
	}

	studentLog.Info("student updated successfully", zap.String("name", student.Name), zap.Uint("student_id", student.ID))

	// Build response
	studentResponse := structs.StudentResponse{
		ID:   student.ID,
		Name: student.Name,
		RFID: student.RFID,
		Load: student.Load,
	}

	responses.SuccessResponse(w, studentResponse)
}

// DeleteStudent deletes a student by ID
func DeleteStudent(w http.ResponseWriter, r *http.Request) {
	defer studentLog.Sync()

	// Get student ID from URL path
	studentIDStr := r.PathValue("studentId")
	studentID, err := strconv.ParseUint(studentIDStr, 10, 64)
	if err != nil {
		responses.ErrorResponse(w, http.StatusBadRequest, "Invalid student ID")
		return
	}

	// Get database connection
	db, err := database.GetDB()
	if err != nil {
		studentLog.Error("failed to get database connection", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Database connection error")
		return
	}

	// Check if student exists
	var student models.Student
	if err := db.First(&student, studentID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			responses.ErrorResponse(w, http.StatusNotFound, "Student not found")
			return
		}
		studentLog.Error("failed to fetch student", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch student")
		return
	}

	// Delete student (soft delete with GORM)
	if err := db.Delete(&student).Error; err != nil {
		studentLog.Error("failed to delete student", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to delete student")
		return
	}

	studentLog.Info("student deleted successfully", zap.Uint("student_id", uint(studentID)))

	responses.NoContentResponse(w)
}

// UpdateStudentLoad updates a student's load (add or refund)
func UpdateStudentLoad(w http.ResponseWriter, r *http.Request) {
	defer studentLog.Sync()

	// Get student ID from URL path
	studentIDStr := r.PathValue("studentId")
	studentID, err := strconv.ParseUint(studentIDStr, 10, 64)
	if err != nil {
		responses.ErrorResponse(w, http.StatusBadRequest, "Invalid student ID")
		return
	}

	// Parse request body
	var req structs.StudentLoadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		studentLog.Error("failed to decode request body", zap.Error(err))
		responses.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate load amount
	if req.Load == 0 {
		responses.ErrorResponse(w, http.StatusBadRequest, "Load amount is required and cannot be zero")
		return
	}

	// Set default reason if not provided
	if req.Reason == "" {
		req.Reason = "payment"
	}

	// Validate reason
	if req.Reason != "payment" && req.Reason != "refund" {
		responses.ErrorResponse(w, http.StatusBadRequest, "Reason must be either 'payment' or 'refund'")
		return
	}

	// Get database connection
	db, err := database.GetDB()
	if err != nil {
		studentLog.Error("failed to get database connection", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Database connection error")
		return
	}

	// Check if student exists
	var student models.Student
	if err := db.First(&student, studentID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			responses.ErrorResponse(w, http.StatusNotFound, "Student not found")
			return
		}
		studentLog.Error("failed to fetch student", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch student")
		return
	}

	// Calculate new load
	newLoad := student.Load
	switch req.Reason {
	case "payment":
		newLoad -= req.Load
		// Prevent negative balance
		if newLoad < 0 {
			responses.ErrorResponse(w, http.StatusBadRequest, "Payment is over the balance.")
			return
		}
	case "refund":
		newLoad += req.Load
	}

	// Update student load
	if err := db.Model(&student).Update("load", newLoad).Error; err != nil {
		studentLog.Error("failed to update student load", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to update student load")
		return
	}

	// Fetch updated student
	if err := db.First(&student, studentID).Error; err != nil {
		studentLog.Error("failed to fetch updated student", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch updated student")
		return
	}

	studentLog.Info("student load updated successfully",
		zap.String("name", student.Name),
		zap.Uint("student_id", student.ID),
		zap.String("reason", req.Reason),
		zap.Float64("amount", req.Load),
		zap.Float64("new_load", student.Load))

	// Build response
	studentResponse := structs.StudentResponse{
		ID:   student.ID,
		Name: student.Name,
		RFID: student.RFID,
		Load: student.Load,
	}

	responses.SuccessResponse(w, studentResponse)
}

// GetStudentByRFID retrieves a student by RFID query parameter
func GetStudentByRFID(w http.ResponseWriter, r *http.Request) {
	defer studentLog.Sync()

	// Get RFID from query parameter
	rfid := r.URL.Query().Get("rfid")
	if rfid == "" {
		responses.ErrorResponse(w, http.StatusBadRequest, "RFID query parameter is required")
		return
	}

	// Get database connection
	db, err := database.GetDB()
	if err != nil {
		studentLog.Error("failed to get database connection", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Database connection error")
		return
	}

	// Fetch student by RFID
	var student models.Student
	if err := db.Where("rfid = ?", rfid).First(&student).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			responses.ErrorResponse(w, http.StatusNotFound, "Student not found")
			return
		}
		studentLog.Error("failed to fetch student", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch student")
		return
	}

	// Build response
	res := map[string]any{
		"load": student.Load,
	}

	responses.SuccessResponse(w, res)
}

func ValidateStudentPin(w http.ResponseWriter, r *http.Request) {
	defer studentLog.Sync()

	// Get RFID from query parameter
	rfid := r.URL.Query().Get("rfid")
	if rfid == "" {
		responses.ErrorResponse(w, http.StatusBadRequest, "RFID query parameter is required")
		return
	}

	// Get PIN from query parameter
	pin := r.URL.Query().Get("pin")
	if pin == "" {
		responses.ErrorResponse(w, http.StatusBadRequest, "PIN query parameter is required")
		return
	}

	if !validate.IsValidPIN(pin) {
		responses.ErrorResponse(w, http.StatusBadRequest, "PIN must be exactly 4 numeric digits")
		return
	}

	// Get database connection
	db, err := database.GetDB()
	if err != nil {
		studentLog.Error("failed to get database connection", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Database connection error")
		return
	}

	// Fetch student by PIN
	var student models.Student
	if err := db.Where("rfid = ?", rfid).First(&student).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			responses.ErrorResponse(w, http.StatusNotFound, "Student not found")
			return
		}
		studentLog.Error("failed to fetch student", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch student")
		return
	}

	// Validate PIN
	pinHash := student.PinHash
	if err := password.ValidatePassword(pinHash, pin); err != nil {
		responses.ErrorResponse(w, http.StatusUnauthorized, "Invalid PIN")
		return
	}

	// Build response
	res := map[string]any{
		"valid": true,
	}

	responses.SuccessResponse(w, res)
}
