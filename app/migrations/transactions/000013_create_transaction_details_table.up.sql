-- Create transaction_details table
CREATE TABLE IF NOT EXISTS transaction_details (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER NOT NULL,
    rfid VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_transaction_details_transaction
        FOREIGN KEY (transaction_id)
        REFERENCES transactions(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- Create trigger to automatically update updated_at column
CREATE TRIGGER update_transaction_details_updated_at
    BEFORE UPDATE ON transaction_details
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
