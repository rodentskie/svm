package models

import (
	"time"

	"gorm.io/gorm"
)

type PaymentMethod struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	Name      string         `gorm:"size:100;not null;unique" json:"name"`
	CreatedAt time.Time      `gorm:"<-:false" json:"created_at"`
	UpdatedAt time.Time      `gorm:"<-:false" json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (PaymentMethod) TableName() string {
	return "payment_methods"
}
