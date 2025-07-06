const mysql = require('mysql2/promise');
require('dotenv').config();

async function createToursTable() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'sahin',
      password: 'root',
      database: 'tour_program'
    });

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS tours (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_ref VARCHAR(255) NOT NULL,
        tour_name VARCHAR(255) NOT NULL,
        operator VARCHAR(255) NOT NULL,
        operator_id VARCHAR(255) NOT NULL,
        adult_price DECIMAL(10,2),
        child_price DECIMAL(10,2),
        selected_days JSON,
        pickup_times JSON,
        bolge_id JSON,
        options JSON,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_company_ref (company_ref)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createTableSQL);
    console.log('Tours tablosu başarıyla oluşturuldu');
    await connection.end();
  } catch (error) {
    console.error('Tablo oluşturma hatası:', error);
    process.exit(1);
  }
}

createToursTable(); 