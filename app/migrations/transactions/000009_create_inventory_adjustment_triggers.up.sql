-- Function to create transaction from inventory adjustment
CREATE OR REPLACE FUNCTION create_transaction_from_inventory_adjustment()
RETURNS TRIGGER AS $$
DECLARE
    v_transaction_type transaction_type;
    v_quantity INT;
    v_product_price DECIMAL(10,2);
BEGIN
    -- Determine transaction type and quantity based on quantity_change
    IF NEW.quantity_change > 0 THEN
        -- Positive change: restock or refund
        v_quantity := NEW.quantity_change;
        
        IF NEW.reason = 'refund' THEN
            v_transaction_type := 'refund';
        ELSE
            v_transaction_type := 'restock';
        END IF;
    ELSIF NEW.quantity_change < 0 THEN
        -- Negative change: adjustment
        v_quantity := ABS(NEW.quantity_change);
        v_transaction_type := 'adjustment';
    ELSE
        -- No change, don't create transaction
        RETURN NEW;
    END IF;
    
    -- Insert transaction record
    INSERT INTO transactions (
        product_id,
        quantity,
        transaction_type,
        payment_method,
        total_amount,
        status,
        created_at,
        updated_at
    ) VALUES (
        NEW.product_id,
        v_quantity,
        v_transaction_type,
        null,
        0.00,
        'completed', -- system transactions are automatically completed
        NOW(),
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create transaction after inventory adjustment insert
CREATE TRIGGER create_transaction_from_inventory_adjustment_trigger
    AFTER INSERT ON inventory_adjustments
    FOR EACH ROW
    EXECUTE FUNCTION create_transaction_from_inventory_adjustment();
