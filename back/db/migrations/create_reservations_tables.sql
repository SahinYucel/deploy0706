-- Rezervasyonlar ana tablosu
CREATE TABLE IF NOT EXISTS reservations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_name VARCHAR(255) NOT NULL,
    phone_code VARCHAR(10) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    room_number VARCHAR(50) NOT NULL,
    hotel_name VARCHAR(255),
    total_amount VARCHAR(255) NOT NULL,
    date DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rezervasyon ödemeleri tablosu
CREATE TABLE IF NOT EXISTS reservation_payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reservation_id INT NOT NULL,
    payment_type ENUM('cash', 'pos') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    rest_amount DECIMAL(10,2),
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
);

-- Rezervasyon biletleri tablosu
CREATE TABLE IF NOT EXISTS reservation_tickets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reservation_id INT NOT NULL,
    tour_name VARCHAR(255) NOT NULL,
    adult_count INT NOT NULL DEFAULT 0,
    child_count INT NOT NULL DEFAULT 0,
    free_count INT NOT NULL DEFAULT 0,
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
);

-- Bilet opsiyonları tablosu
CREATE TABLE IF NOT EXISTS ticket_options (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_id INT NOT NULL,
    option_name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (ticket_id) REFERENCES reservation_tickets(id) ON DELETE CASCADE
); 