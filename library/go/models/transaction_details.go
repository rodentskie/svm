package models

import (
	"time"
)

type TransactionDetails struct {
	ID            uint      `gorm:"primarykey" json:"id"`
	TransactionId uint      `gorm:"not null" json:"transaction_id"`
	RFID          string    `gorm:"column:rfid;size:10" json:"rfid"`
	CreatedAt     time.Time `gorm:"<-:false" json:"created_at"`
	UpdatedAt     time.Time `gorm:"<-:false" json:"updated_at"`

	// Relationship
	Transaction Transaction `gorm:"foreignKey:TransactionId;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
}

func (TransactionDetails) TableName() string {
	return "transaction_details"
}
