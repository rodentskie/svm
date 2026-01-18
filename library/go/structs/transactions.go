package structs

type CreateTransactionRequest struct {
	Location      string `json:"location" validate:"required"`
	Type          string `json:"type" validate:"required"`
	Quantity      uint16 `json:"quantity" validate:"required,min=1"`
	PaymentMethod string `json:"payment_method" validate:"required,oneof=rfid e-wallet"`
}

type CreateTransactionAdjustmentRequest struct {
	Quantity int16  `json:"quantity" validate:"required,min=1"`
	Reason   string `json:"reason" validate:"required"`
	Notes    string `json:"notes"`
}
