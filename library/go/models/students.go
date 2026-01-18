package models

import (
	"time"

	"gorm.io/gorm"
)

type Student struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	Name      string         `gorm:"size:100;not null" json:"name"`
	RFID      string         `gorm:"uniqueIndex;size:10;not null" json:"rfid"`
	CreatedAt time.Time      `gorm:"<-:false" json:"created_at"`
	UpdatedAt time.Time      `gorm:"<-:false" json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (Student) TableName() string {
	return "students"
}
