package structs

type CreateStudentRequest struct {
	Name string  `json:"name" binding:"required"`
	RFID string  `json:"rfid" binding:"required"`
	Load float64 `json:"load"`
}

type UpdateStudentRequest struct {
	Name string `json:"name"`
	RFID string `json:"rfid"`
}

type StudentLoadRequest struct {
	Load   float64 `json:"load" binding:"required"`
	Reason string  `json:"reason"`
}

type StudentResponse struct {
	ID   uint    `json:"id"`
	Name string  `json:"name"`
	RFID string  `json:"rfid"`
	Load float64 `json:"load"`
}
