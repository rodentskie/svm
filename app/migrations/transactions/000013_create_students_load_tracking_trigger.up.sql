-- Function to track student load changes
CREATE OR REPLACE FUNCTION track_students_load_change()
RETURNS TRIGGER AS $$
BEGIN
	-- Only log when load is changed
	IF NEW.load IS DISTINCT FROM OLD.load THEN
		INSERT INTO students_transaction_history (
			student_id,
			load,
			type,
			created_at,
			updated_at
		) VALUES (
			NEW.id,
			NEW.load - OLD.load,
			CASE
				WHEN NEW.load > OLD.load THEN 'purchase'
				WHEN NEW.load < OLD.load THEN 'payment'
				ELSE 'purchase'
			END,
			NOW(),
			NOW()
		);
	END IF;

	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to track student load changes
CREATE TRIGGER track_students_load_change_trigger
	BEFORE UPDATE ON students
	FOR EACH ROW
	EXECUTE FUNCTION track_students_load_change();
