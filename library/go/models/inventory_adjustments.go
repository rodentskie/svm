package models

import (
	"time"

	"gorm.io/gorm"
)

type InventoryAdjustment struct {
	ID             uint           `gorm:"primarykey" json:"id"`
	ProductID      uint           `gorm:"not null;index" json:"product_id"`
	QuantityChange int            `gorm:"not null" json:"quantity_change"` // positive = restock, negative = removal
	Reason         string         `gorm:"size:50;not null" json:"reason"`  // restock, expired, damaged, sale, etc.
	AdjustedBy     uint           `gorm:"not null" json:"adjusted_by"`
	Notes          string         `gorm:"type:text" json:"notes,omitempty"`
	CreatedAt      time.Time      `gorm:"<-:false" json:"created_at"`
	UpdatedAt      time.Time      `gorm:"<-:false" json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"deleted_at"`

	// Relationships
	Product        Product `gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"product,omitempty"`
	AdjustedByUser User    `gorm:"foreignKey:AdjustedBy;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"adjusted_by_user,omitempty"`
}

func (InventoryAdjustment) TableName() string {
	return "inventory_adjustments"
}

func (ia *InventoryAdjustment) IsRestock() bool {
	return ia.QuantityChange > 0
}

func (ia *InventoryAdjustment) IsRemoval() bool {
	return ia.QuantityChange < 0
}
