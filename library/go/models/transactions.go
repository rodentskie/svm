package models

import (
	"time"
)

// Transaction types
const (
	TransactionTypePurchase   = "purchase"
	TransactionTypeRefund     = "refund"
	TransactionTypeRestock    = "restock"
	TransactionTypeAdjustment = "adjustment"
)

// Payment methods
const (
	PaymentMethodRFID    = "rfid"
	PaymentMethodEWallet = "e-wallet"
)

// Transaction statuses
const (
	TransactionStatusPending   = "pending"
	TransactionStatusCompleted = "completed"
	TransactionStatusFailed    = "failed"
	TransactionStatusCancelled = "cancelled"
)

type Transaction struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	ProductID       uint      `gorm:"not null;index" json:"product_id"`
	Quantity        int       `gorm:"not null" json:"quantity"`
	TransactionType string    `gorm:"type:transaction_type;not null;default:purchase" json:"transaction_type"`
	PaymentMethod   string    `gorm:"type:payment_method;not null" json:"payment_method"`
	TotalAmount     float64   `gorm:"type:decimal(10,2);not null" json:"total_amount"`
	Status          string    `gorm:"type:transaction_status;not null;default:pending;index" json:"status"`
	CreatedAt       time.Time `gorm:"<-:false" json:"created_at"`
	UpdatedAt       time.Time `gorm:"<-:false" json:"updated_at"`

	// Relationships
	Product Product `gorm:"foreignKey:ProductID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"product,omitempty"`
}

func (Transaction) TableName() string {
	return "transactions"
}
