const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigrations() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'sahin',
    password: 'root',
    database: 'tour_program',
    multipleStatements: true // Birden fazla SQL komutunu aynı anda çalıştırmak için
  });

  try {
    const sql = fs.readFileSync(
      path.join(__dirname, 'migrations', 'create_reservations_tables.sql'),
      'utf8'
    );

    await connection.query(sql);
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
  } finally {
    await connection.end();
  }
}

runMigrations(); 