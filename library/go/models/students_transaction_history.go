package models

import (
	"time"
)

type StudentTransactionHistory struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	StudentId uint      `gorm:"not null" json:"student_id"`
	Load      float64   `gorm:"type:decimal(10,2);not null;default:0.00" json:"load"`
	Type      string    `json:"type" validate:"required,oneof=load purchase refund"`
	CreatedAt time.Time `gorm:"<-:false" json:"created_at"`
	UpdatedAt time.Time `gorm:"<-:false" json:"updated_at"`

	// Relationship
	Student Student `gorm:"foreignKey:StudentId;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
}

func (StudentTransactionHistory) TableName() string {
	return "students_transaction_history"
}
