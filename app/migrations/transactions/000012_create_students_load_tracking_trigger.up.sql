-- Function to create student transaction history entry from RFID transactions
CREATE OR REPLACE FUNCTION create_students_history_from_rfid_transaction()
RETURNS TRIGGER AS $$
DECLARE
	v_student_id INTEGER;
BEGIN
	-- Only process RFID transactions
	IF NEW.payment_method = 'rfid' THEN
		SELECT s.id
		INTO v_student_id
		FROM students s
		INNER JOIN transaction_details td ON td.rfid = s.rfid
		WHERE td.transaction_id = NEW.id
		  AND s.deleted_at IS NULL
		ORDER BY td.id DESC
		LIMIT 1;

		IF v_student_id IS NOT NULL THEN
			INSERT INTO students_transaction_history (
				student_id,
				load,
				type,
				created_at,
				updated_at
			) VALUES (
				v_student_id,
				NEW.total_amount,
				'purchase',
				NOW(),
				NOW()
			);
		END IF;
	END IF;

	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
			OLD.load - NEW.load,
			'load',
			NOW(),
			NOW()
		);
	END IF;

	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create student history on RFID transaction insert
CREATE TRIGGER create_students_history_from_rfid_transaction_trigger
	AFTER INSERT ON transactions
	FOR EACH ROW
	EXECUTE FUNCTION create_students_history_from_rfid_transaction();

-- Trigger to track student load changes
CREATE TRIGGER track_students_load_change_trigger
	BEFORE UPDATE ON students
	FOR EACH ROW
	EXECUTE FUNCTION track_students_load_change();
