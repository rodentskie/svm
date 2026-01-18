-- Function to calculate total amount for purchase transactions
CREATE OR REPLACE FUNCTION calculate_transaction_total()
RETURNS TRIGGER AS $$
BEGIN
    -- Only calculate for purchase transactions
    IF NEW.transaction_type = 'purchase' THEN
        -- Get the product price and multiply by quantity
        SELECT price * NEW.quantity INTO NEW.total_amount
        FROM products
        WHERE id = NEW.product_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update product quantity after transaction
CREATE OR REPLACE FUNCTION update_product_quantity_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Subtract quantity from products for purchase transactions
    IF NEW.transaction_type = 'purchase' THEN
        UPDATE products
        SET quantity = quantity - NEW.quantity
        WHERE id = NEW.product_id;
    -- Add quantity to products for restock transactions
    ELSIF NEW.transaction_type = 'restock' THEN
        UPDATE products
        SET quantity = quantity + NEW.quantity
        WHERE id = NEW.product_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate total amount before insert
CREATE TRIGGER calculate_transaction_total_trigger
    BEFORE INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION calculate_transaction_total();

-- Trigger to update product quantity after insert
CREATE TRIGGER update_product_quantity_trigger
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_product_quantity_on_transaction();
