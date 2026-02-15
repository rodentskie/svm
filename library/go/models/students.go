package models

import (
	"time"

	"gorm.io/gorm"
)

type Student struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	Name      string         `gorm:"size:100;not null" json:"name"`
	RFID      string         `gorm:"column:rfid;uniqueIndex;size:10;not null" json:"rfid"`
	Load      float64        `gorm:"type:decimal(10,2);not null;default:0.00" json:"load"`
	PinHash   string         `gorm:"column:pin_hash;size:255;not null" json:"-"`
	CreatedAt time.Time      `gorm:"<-:false" json:"created_at"`
	UpdatedAt time.Time      `gorm:"<-:false" json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (Student) TableName() string {
	return "students"
}
