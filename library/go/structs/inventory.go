package structs

import "library/go/models"

type AdjustInventoryRequest struct {
	ProductID      uint   `json:"product_id" binding:"required"`
	QuantityChange int    `json:"quantity_change" binding:"required"`
	Reason         string `json:"reason" binding:"required"`
	Notes          string `json:"notes,omitempty"`
}

type InventoryReportResponse struct {
	TotalProducts    int                `json:"total_products"`
	LowStockProducts int                `json:"low_stock_products"`
	TotalValue       float64            `json:"total_value"`
	Products         []models.Product   `json:"products"`
	LowStockItems    []LowStockResponse `json:"low_stock_items"`
}
