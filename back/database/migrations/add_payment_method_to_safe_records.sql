ALTER TABLE safe_records
ADD COLUMN payment_method ENUM('cash', 'card') DEFAULT NULL AFTER payment_type; 