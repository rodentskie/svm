package structs

import "library/go/models"

type LowStockResponse struct {
	models.Product
	StockStatus string `json:"stock_status"`
}
