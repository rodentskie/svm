DROP TRIGGER IF EXISTS track_students_load_change_trigger ON students;
DROP TRIGGER IF EXISTS create_students_history_from_rfid_transaction_trigger ON transactions;

DROP FUNCTION IF EXISTS track_students_load_change();
DROP FUNCTION IF EXISTS create_students_history_from_rfid_transaction();
