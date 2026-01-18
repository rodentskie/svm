package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID           uint           `gorm:"primarykey" json:"id"`
	Username     string         `gorm:"uniqueIndex;size:50;not null" json:"username"`
	PasswordHash string         `gorm:"size:255;not null" json:"-"` // Don't expose in JSON
	JwtToken     string         `gorm:"type:text" json:"-"`         // Don't expose in JSON
	Name         string         `gorm:"size:255" json:"name"`
	Email        string         `gorm:"uniqueIndex;size:255" json:"email"`
	Phone        string         `gorm:"size:50" json:"phone"`
	Role         string         `gorm:"size:10;not null" json:"role"`
	IsActive     bool           `gorm:"default:true" json:"is_active"`
	CreatedAt    time.Time      `gorm:"<-:false" json:"created_at"`
	UpdatedAt    time.Time      `gorm:"<-:false" json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"deleted_at"`
}

func (User) TableName() string {
	return "users"
}

func (u *User) IsAdmin() bool {
	return u.Role == "admin"
}
