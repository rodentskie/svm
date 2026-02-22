package structs

import "library/go/models"

type CreateStudentRequest struct {
	Name string `json:"name" binding:"required"`
	RFID string `json:"rfid" binding:"required"`
	Pin  string `json:"pin" binding:"required"`
}

type UpdateStudentRequest struct {
	Name string `json:"name"`
	RFID string `json:"rfid"`
	Pin  string `json:"pin"`
}

type StudentLoadRequest struct {
	Load   float64 `json:"load" binding:"required"`
	Reason string  `json:"reason"`
}

type StudentResponse struct {
	ID        uint    `json:"id"`
	Name      string  `json:"name"`
	RFID      string  `json:"rfid"`
	Load      float64 `json:"load"`
	CreatedAt string  `json:"created_at"`
	UpdatedAt string  `json:"updated_at"`
}

type StudentLoginRequest struct {
	RFID string `json:"rfid" binding:"required"`
	Pin  string `json:"pin" binding:"required"`
}

type StudentLoginResponse struct {
	Token   string         `json:"token"`
	Student models.Student `json:"student"`
}
