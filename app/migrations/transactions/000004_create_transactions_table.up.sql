CREATE TYPE transaction_type AS ENUM ('purchase', 'refund', 'restock', 'adjustment');
CREATE TYPE payment_method AS ENUM ('rfid', 'e-wallet');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    quantity INT NOT NULL,
    transaction_type transaction_type NOT NULL DEFAULT 'purchase',
    payment_method payment_method NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status transaction_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
