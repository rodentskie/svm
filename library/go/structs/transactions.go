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

type CreatePaymentMethod struct {
	Method string `json:"method" validate:"required,oneof=gcash paymaya"`
}

type CreatePaymentIntent struct {
	Amount                float64  `json:"amount" validate:"required,gt=0"`
	PaymentMethodsAllowed []string `json:"payment_methods_allowed" validate:"required,dive,oneof=gcash paymaya"`
}
