package structs

type CreateProductRequest struct {
	Name         string  `json:"name" binding:"required"`
	Code         string  `json:"code" binding:"required"`
	Location     string  `json:"location" binding:"required"`
	Price        float64 `json:"price" binding:"required,gt=0"`
	Quantity     int     `json:"quantity" binding:"gte=0"`
	MinThreshold int     `json:"min_threshold" binding:"gte=0"`
}

type UpdateProductRequest struct {
	Name         *string  `json:"name,omitempty"`
	Code         *string  `json:"code,omitempty"`
	Location     *string  `json:"location,omitempty"`
	Price        *float64 `json:"price,omitempty"`
	Quantity     *int     `json:"quantity,omitempty"`
	MinThreshold *int     `json:"min_threshold,omitempty"`
}
