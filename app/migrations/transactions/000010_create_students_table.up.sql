CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    rfid VARCHAR(10) NOT NULL,
    load DECIMAL(10, 2) NOT NULL CHECK (load >= 0),
    pin_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE UNIQUE INDEX idx_students_rfid ON students(rfid) WHERE deleted_at IS NULL;
CREATE INDEX idx_students_deleted_at ON students(deleted_at);

CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
