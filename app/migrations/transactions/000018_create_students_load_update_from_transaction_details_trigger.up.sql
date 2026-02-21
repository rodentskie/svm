-- Function to update student load from transaction_details RFID transactions
CREATE OR REPLACE FUNCTION update_students_load_from_transaction_details()
RETURNS TRIGGER AS $$
DECLARE
    v_student_id INTEGER;
    v_student_load DECIMAL(10, 2);
    v_total_amount DECIMAL(10, 2);
BEGIN
    IF NEW.rfid IS NULL OR btrim(NEW.rfid) = '' THEN
        RETURN NEW;
    END IF;

    SELECT id, load
    INTO v_student_id, v_student_load
    FROM students
    WHERE rfid = NEW.rfid
      AND deleted_at IS NULL
    LIMIT 1;

    IF v_student_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT total_amount
    INTO v_total_amount
    FROM transactions
    WHERE id = NEW.transaction_id
    LIMIT 1;

    IF v_total_amount IS NULL THEN
        RETURN NEW;
    END IF;

    UPDATE students
    SET load = v_student_load + v_total_amount
    WHERE id = v_student_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_students_load_from_transaction_details_trigger
    AFTER INSERT ON transaction_details
    FOR EACH ROW
    EXECUTE FUNCTION update_students_load_from_transaction_details();
