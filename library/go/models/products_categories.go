package models

import (
	"time"

	"gorm.io/gorm"
)

type ProductCategories struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	Name      string         `gorm:"size:100;not null" json:"name"`
	CreatedAt time.Time      `gorm:"<-:false" json:"created_at"`
	UpdatedAt time.Time      `gorm:"<-:false" json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (ProductCategories) TableName() string {
	return "product_categories"
}
