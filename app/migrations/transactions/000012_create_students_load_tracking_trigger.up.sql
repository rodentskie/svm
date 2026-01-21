CREATE OR REPLACE FUNCTION track_student_load_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- On INSERT: if load > 0, record it
    IF (TG_OP = 'INSERT' AND NEW.load > 0) THEN
        INSERT INTO students_transaction_history (student_id, load, type)
        VALUES (NEW.id, NEW.load, 'load');
    END IF;

    -- On UPDATE: if load changed and new load > 0, record the difference
    IF (TG_OP = 'UPDATE' AND NEW.load != OLD.load AND NEW.load > OLD.load) THEN
        INSERT INTO students_transaction_history (student_id, load, type)
        VALUES (NEW.id, NEW.load - OLD.load, 'load');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_students_load_trigger
    AFTER INSERT OR UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION track_student_load_changes();
