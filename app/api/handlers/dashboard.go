package handlers

import (
	"library/go/database"
	"library/go/logger"
	"library/go/models"
	"library/go/responses"
	"net/http"
	"strconv"
	"time"

	"go.uber.org/zap"
)

var dashboardLog = logger.NewLogger("dashboard-handler")

type transactionTrendRow struct {
	Date             time.Time `json:"date"`
	TransactionCount int64     `json:"transaction_count"`
	TotalAmount      float64   `json:"total_amount"`
	TotalQuantity    int64     `json:"total_quantity"`
}

type historyTrendRow struct {
	Date           time.Time `json:"date"`
	LoadCount      int64     `json:"load_count"`
	PurchaseCount  int64     `json:"purchase_count"`
	RefundCount    int64     `json:"refund_count"`
	PaymentCount   int64     `json:"payment_count"`
	LoadAmount     float64   `json:"load_amount"`
	PurchaseAmount float64   `json:"purchase_amount"`
	RefundAmount   float64   `json:"refund_amount"`
	PaymentAmount  float64   `json:"payment_amount"`
}

type topBuyerRow struct {
	StudentID     *uint      `gorm:"column:student_id" json:"student_id"`
	StudentName   *string    `gorm:"column:student_name" json:"student_name"`
	RFID          string     `gorm:"column:rfid" json:"rfid"`
	PurchaseCount int64      `gorm:"column:purchase_count" json:"purchase_count"`
	TotalSpent    float64    `gorm:"column:total_spent" json:"total_spent"`
	TotalQuantity int64      `gorm:"column:total_quantity" json:"total_quantity"`
	LastPurchase  *time.Time `gorm:"column:last_purchase" json:"last_purchase"`
}

type overviewRow struct {
	TotalTransactions int64   `json:"total_transactions"`
	TotalRevenue      float64 `json:"total_revenue"`
}

func GetDashboardAnalytics(w http.ResponseWriter, r *http.Request) {
	defer dashboardLog.Sync()

	days := 30
	if rawDays := r.URL.Query().Get("days"); rawDays != "" {
		parsedDays, err := strconv.Atoi(rawDays)
		if err != nil || parsedDays <= 0 {
			responses.ErrorResponse(w, http.StatusBadRequest, "days must be a positive integer")
			return
		}

		if parsedDays > 365 {
			parsedDays = 365
		}

		days = parsedDays
	}

	topLimit := 10
	if rawTop := r.URL.Query().Get("top"); rawTop != "" {
		parsedTop, err := strconv.Atoi(rawTop)
		if err != nil || parsedTop <= 0 {
			responses.ErrorResponse(w, http.StatusBadRequest, "top must be a positive integer")
			return
		}

		if parsedTop > 50 {
			parsedTop = 50
		}

		topLimit = parsedTop
	}

	startDate := time.Now().AddDate(0, 0, -(days - 1)).Truncate(24 * time.Hour)
	endDate := startDate.AddDate(0, 0, days-1)

	db, err := database.GetDB()
	if err != nil {
		dashboardLog.Error("failed to get database connection", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Database connection error")
		return
	}

	var overview overviewRow
	if err := db.Model(&models.Transaction{}).
		Select("COUNT(*) as total_transactions, COALESCE(SUM(total_amount), 0) as total_revenue").
		Where("status = ? AND created_at >= ?", models.TransactionStatusCompleted, startDate).
		Scan(&overview).Error; err != nil {
		dashboardLog.Error("failed to fetch dashboard overview", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch dashboard analytics")
		return
	}

	var totalStudents int64
	if err := db.Model(&models.Student{}).
		Where("deleted_at IS NULL").
		Count(&totalStudents).Error; err != nil {
		dashboardLog.Error("failed to fetch student count", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch dashboard analytics")
		return
	}

	var rfidBuyerCount int64
	if err := db.Raw(`
		SELECT COUNT(DISTINCT NULLIF(regexp_replace(COALESCE(td.rfid, ''), '[^[:alnum:]]', '', 'g'), ''))
		FROM transaction_details td
		JOIN transactions t ON t.id = td.transaction_id
		WHERE NULLIF(regexp_replace(COALESCE(td.rfid, ''), '[^[:alnum:]]', '', 'g'), '') IS NOT NULL
		  AND t.transaction_type = ?
		  AND t.status = ?
		  AND t.created_at >= ?
	`, models.TransactionTypePurchase, models.TransactionStatusCompleted, startDate).Scan(&rfidBuyerCount).Error; err != nil {
		dashboardLog.Error("failed to fetch rfid buyer count", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch dashboard analytics")
		return
	}

	var transactionRows []transactionTrendRow
	if err := db.Raw(`
		SELECT
			DATE(t.created_at) AS date,
			COUNT(*) AS transaction_count,
			COALESCE(SUM(t.total_amount), 0) AS total_amount,
			COALESCE(SUM(t.quantity), 0) AS total_quantity
		FROM transactions t
		WHERE t.created_at >= ?
		  AND t.status = ?
		GROUP BY DATE(t.created_at)
		ORDER BY DATE(t.created_at) ASC
	`, startDate, models.TransactionStatusCompleted).Scan(&transactionRows).Error; err != nil {
		dashboardLog.Error("failed to fetch transaction trend", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch dashboard analytics")
		return
	}

	var historyRows []historyTrendRow
	if err := db.Raw(`
		SELECT
			DATE(sth.created_at) AS date,
			SUM(CASE WHEN sth.type = 'load' THEN 1 ELSE 0 END) AS load_count,
			SUM(CASE WHEN sth.type = 'purchase' THEN 1 ELSE 0 END) AS purchase_count,
			SUM(CASE WHEN sth.type = 'refund' THEN 1 ELSE 0 END) AS refund_count,
			SUM(CASE WHEN sth.type = 'payment' THEN 1 ELSE 0 END) AS payment_count,
			COALESCE(SUM(CASE WHEN sth.type = 'load' THEN sth.load ELSE 0 END), 0) AS load_amount,
			COALESCE(SUM(CASE WHEN sth.type = 'purchase' THEN sth.load ELSE 0 END), 0) AS purchase_amount,
			COALESCE(SUM(CASE WHEN sth.type = 'refund' THEN sth.load ELSE 0 END), 0) AS refund_amount,
			COALESCE(SUM(CASE WHEN sth.type = 'payment' THEN sth.load ELSE 0 END), 0) AS payment_amount
		FROM students_transaction_history sth
		WHERE sth.created_at >= ?
		GROUP BY DATE(sth.created_at)
		ORDER BY DATE(sth.created_at) ASC
	`, startDate).Scan(&historyRows).Error; err != nil {
		dashboardLog.Error("failed to fetch student transaction history trend", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch dashboard analytics")
		return
	}

	if len(historyRows) == 0 {
		if err := db.Raw(`
			SELECT
				DATE(t.created_at) AS date,
				0 AS load_count,
				SUM(CASE WHEN t.transaction_type = 'purchase' THEN 1 ELSE 0 END) AS purchase_count,
				SUM(CASE WHEN t.transaction_type = 'refund' THEN 1 ELSE 0 END) AS refund_count,
				0 AS payment_count,
				0 AS load_amount,
				COALESCE(SUM(CASE WHEN t.transaction_type = 'purchase' THEN t.total_amount ELSE 0 END), 0) AS purchase_amount,
				COALESCE(SUM(CASE WHEN t.transaction_type = 'refund' THEN t.total_amount ELSE 0 END), 0) AS refund_amount,
				0 AS payment_amount
			FROM transactions t
			JOIN transaction_details td ON td.transaction_id = t.id
			WHERE NULLIF(regexp_replace(COALESCE(td.rfid, ''), '[^[:alnum:]]', '', 'g'), '') IS NOT NULL
			  AND t.status = ?
			  AND t.created_at >= ?
			GROUP BY DATE(t.created_at)
			ORDER BY DATE(t.created_at) ASC
		`, models.TransactionStatusCompleted, startDate).Scan(&historyRows).Error; err != nil {
			dashboardLog.Error("failed to fetch fallback rfid transaction history trend", zap.Error(err))
			responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch dashboard analytics")
			return
		}
	}

	var topBuyers []topBuyerRow
	if err := db.Raw(`
		SELECT
			s.id AS student_id,
			s.name AS student_name,
			COALESCE(
				NULLIF(regexp_replace(COALESCE(s.rfid, ''), '[^[:alnum:]]', '', 'g'), ''),
				NULLIF(regexp_replace(COALESCE(td.rfid, ''), '[^[:alnum:]]', '', 'g'), '')
			) AS rfid,
			COUNT(t.id) AS purchase_count,
			COALESCE(SUM(t.total_amount), 0) AS total_spent,
			COALESCE(SUM(t.quantity), 0) AS total_quantity,
			MAX(t.created_at) AS last_purchase
		FROM transaction_details td
		JOIN transactions t ON t.id = td.transaction_id
		LEFT JOIN students s ON NULLIF(regexp_replace(COALESCE(s.rfid, ''), '[^[:alnum:]]', '', 'g'), '') = NULLIF(regexp_replace(COALESCE(td.rfid, ''), '[^[:alnum:]]', '', 'g'), '') AND s.deleted_at IS NULL
		WHERE NULLIF(regexp_replace(COALESCE(td.rfid, ''), '[^[:alnum:]]', '', 'g'), '') IS NOT NULL
		  AND t.transaction_type = ?
		  AND t.status = ?
		  AND t.created_at >= ?
		GROUP BY
			s.id,
			s.name,
			COALESCE(
				NULLIF(regexp_replace(COALESCE(s.rfid, ''), '[^[:alnum:]]', '', 'g'), ''),
				NULLIF(regexp_replace(COALESCE(td.rfid, ''), '[^[:alnum:]]', '', 'g'), '')
			)
		ORDER BY purchase_count DESC, total_spent DESC
		LIMIT ?
	`, models.TransactionTypePurchase, models.TransactionStatusCompleted, startDate, topLimit).Scan(&topBuyers).Error; err != nil {
		dashboardLog.Error("failed to fetch top rfid buyers", zap.Error(err))
		responses.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch dashboard analytics")
		return
	}

	transactionSeries := buildTransactionSeries(startDate, days, transactionRows)
	historySeries := buildHistorySeries(startDate, days, historyRows)

	responses.SuccessResponse(w, map[string]any{
		"period": map[string]any{
			"days":  days,
			"start": startDate.Format("2006-01-02"),
			"end":   endDate.Format("2006-01-02"),
		},
		"overview": map[string]any{
			"total_transactions": overview.TotalTransactions,
			"total_revenue":      overview.TotalRevenue,
			"total_students":     totalStudents,
			"rfid_buyer_count":   rfidBuyerCount,
		},
		"transactions":        transactionSeries,
		"transaction_history": historySeries,
		"top_rfid_buyers":     topBuyers,
	})
}

func buildTransactionSeries(startDate time.Time, days int, rows []transactionTrendRow) []transactionTrendRow {
	rowsByDate := make(map[string]transactionTrendRow, len(rows))
	for _, row := range rows {
		dateKey := row.Date.Format("2006-01-02")
		rowsByDate[dateKey] = row
	}

	result := make([]transactionTrendRow, 0, days)
	for i := 0; i < days; i++ {
		currentDate := startDate.AddDate(0, 0, i)
		dateKey := currentDate.Format("2006-01-02")
		if row, ok := rowsByDate[dateKey]; ok {
			row.Date = currentDate
			result = append(result, row)
			continue
		}

		result = append(result, transactionTrendRow{Date: currentDate})
	}

	return result
}

func buildHistorySeries(startDate time.Time, days int, rows []historyTrendRow) []historyTrendRow {
	rowsByDate := make(map[string]historyTrendRow, len(rows))
	for _, row := range rows {
		dateKey := row.Date.Format("2006-01-02")
		rowsByDate[dateKey] = row
	}

	result := make([]historyTrendRow, 0, days)
	for i := 0; i < days; i++ {
		currentDate := startDate.AddDate(0, 0, i)
		dateKey := currentDate.Format("2006-01-02")
		if row, ok := rowsByDate[dateKey]; ok {
			row.Date = currentDate
			result = append(result, row)
			continue
		}

		result = append(result, historyTrendRow{Date: currentDate})
	}

	return result
}
