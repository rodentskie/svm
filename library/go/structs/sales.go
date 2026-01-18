package structs

type SalesReportResponse struct {
	Date              string  `json:"date"`
	TotalTransactions int     `json:"total_transactions"`
	ItemsSold         int     `json:"items_sold"`
	Revenue           float64 `json:"revenue"`
}

type ProductSalesResponse struct {
	ProductID     uint    `json:"product_id"`
	ProductName   string  `json:"product_name"`
	ProductCode   string  `json:"product_code"`
	TimesSold     int     `json:"times_sold"`
	TotalQuantity int     `json:"total_quantity"`
	TotalRevenue  float64 `json:"total_revenue"`
}
