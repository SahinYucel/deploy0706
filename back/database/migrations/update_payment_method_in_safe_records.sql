UPDATE safe_records
SET payment_method = 'cash'
WHERE payment_method IS NULL; 