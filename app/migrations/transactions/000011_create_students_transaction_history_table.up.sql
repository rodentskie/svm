CREATE TABLE students_transaction_history (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    load DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    type VARCHAR(20) NOT NULL CHECK (type IN ('load', 'purchase', 'refund')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX idx_students_transaction_history_student_id ON students_transaction_history(student_id);

CREATE TRIGGER update_students_transaction_history_updated_at
    BEFORE UPDATE ON students_transaction_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
