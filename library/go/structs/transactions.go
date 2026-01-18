package structs

import "time"

// CreateTransactionRequest represents the request body for creating a transaction
type CreateTransactionRequest struct {
	ProductID        uint    `json:"product_id" validate:"required"`
	Quantity         int     `json:"quantity" validate:"required,min=1"`
	PaymentMethod    string  `json:"payment_method" validate:"required,oneof=rfid e-wallet"`
	IdempotencyKey   string  `json:"idempotency_key" validate:"required,min=16,max=255"`
	PaymentReference *string `json:"payment_reference,omitempty" validate:"omitempty,max=255"`
	Metadata         *string `json:"metadata,omitempty"`
}

// UpdateTransactionRequest represents the request body for updating a transaction
type UpdateTransactionRequest struct {
	Status           *string `json:"status,omitempty" validate:"omitempty,oneof=pending completed failed cancelled"`
	PaymentReference *string `json:"payment_reference,omitempty" validate:"omitempty,max=255"`
	Metadata         *string `json:"metadata,omitempty"`
}

// TransactionResponse represents the response body for a transaction
type TransactionResponse struct {
	ID               uint      `json:"id"`
	ProductID        uint      `json:"product_id"`
	ProductName      string    `json:"product_name,omitempty"`
	Quantity         int       `json:"quantity"`
	TransactionType  string    `json:"transaction_type"`
	PaymentMethod    string    `json:"payment_method"`
	TotalAmount      float64   `json:"total_amount"`
	Status           string    `json:"status"`
	IdempotencyKey   string    `json:"idempotency_key"`
	PaymentReference *string   `json:"payment_reference,omitempty"`
	Metadata         *string   `json:"metadata,omitempty"`
	TransactionDate  time.Time `json:"transaction_date"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// TransactionListResponse represents paginated transaction list
type TransactionListResponse struct {
	Data       []TransactionResponse `json:"data"`
	Total      int64                 `json:"total"`
	Page       int                   `json:"page"`
	PerPage    int                   `json:"per_page"`
	TotalPages int                   `json:"total_pages"`
}
