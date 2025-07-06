ALTER TABLE reservations
ADD COLUMN cost DECIMAL(10,2) DEFAULT 0.00 AFTER total_amount; 