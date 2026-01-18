-- Drop trigger
DROP TRIGGER IF EXISTS create_transaction_from_inventory_adjustment_trigger ON inventory_adjustments;

-- Drop function
DROP FUNCTION IF EXISTS create_transaction_from_inventory_adjustment();
