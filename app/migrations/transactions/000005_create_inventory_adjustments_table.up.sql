CREATE TABLE inventory_adjustments (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    quantity_change INT NOT NULL,
    reason VARCHAR(50) NOT NULL,
    adjusted_by INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_inventory_adjustments_updated_at
    BEFORE UPDATE ON inventory_adjustments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
