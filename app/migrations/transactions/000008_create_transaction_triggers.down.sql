-- Drop triggers
DROP TRIGGER IF EXISTS update_product_quantity_trigger ON transactions;
DROP TRIGGER IF EXISTS calculate_transaction_total_trigger ON transactions;

-- Drop functions
DROP FUNCTION IF EXISTS update_product_quantity_on_transaction();
DROP FUNCTION IF EXISTS calculate_transaction_total();
