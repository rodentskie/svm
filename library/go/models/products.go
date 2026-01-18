package models

import (
	"time"

	"gorm.io/gorm"
)

type Product struct {
	ID           uint           `gorm:"primarykey" json:"id"`
	Name         string         `gorm:"size:100;not null" json:"name"`
	Code         string         `gorm:"uniqueIndex;size:10;not null" json:"code"`
	Price        float64        `gorm:"type:decimal(10,2);not null" json:"price"`
	Quantity     int            `gorm:"not null;default:0" json:"quantity"`
	MinThreshold int            `gorm:"default:5" json:"min_threshold"`
	Location     string         `gorm:"size:50" json:"location"`
	CreatedAt    time.Time      `gorm:"<-:false" json:"created_at"`
	UpdatedAt    time.Time      `gorm:"<-:false" json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Transactions         []Transaction         `gorm:"foreignKey:ProductID" json:"transactions,omitempty"`
	InventoryAdjustments []InventoryAdjustment `gorm:"foreignKey:ProductID" json:"inventory_adjustments,omitempty"`
}

func (Product) TableName() string {
	return "products"
}

func (p *Product) IsLowStock() bool {
	return p.Quantity <= p.MinThreshold
}

func (p *Product) CanSell(quantity int) bool {
	return p.Quantity >= quantity
}

func (p *Product) CalculateTotal(quantity int) float64 {
	return p.Price * float64(quantity)
}
