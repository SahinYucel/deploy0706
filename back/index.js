const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();


const app = express();

// Replace body-parser with Express's built-in middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS ayarları - Production için
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      //'http://localhost:3000',
      //'http://localhost:3001',
      //'http://10.0.2.2:5000',  // Android Emulator için
      //'http://localhost:5000',  // iOS Simulator için
     'http://13.216.32.130',
     'http://13.216.32.130:3000',
     'http://13.216.32.130:5000'
    ];
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // Önbellek süresi (saniye)
}));

// MySQL bağlantısı
const db = mysql.createConnection({
  host: 'localhost',
  user: 'sahin',
  password: 'root',
  database: 'tour_program2',
  // Bağlantı kopma sorunları için ek ayarlar
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 10000, // 10 saniye
});

// Veritabanı bağlantısını kontrol et ve yeniden bağlanma mantığı ekle
function handleDisconnect(connection) {
  connection.on('error', function(err) {
    console.log('DB ERROR', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST' || 
       err.code === 'ECONNRESET' || 
       err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
      console.log('DB Connection lost, reconnecting...');
      handleDisconnect(mysql.createConnection(connection.config));
    } else {
      throw err;
    }
  });
}

handleDisconnect(db);

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    setTimeout(handleDisconnect, 2000); // 2 saniye sonra tekrar bağlanmayı dene
  } else {
    console.log('Connected to database');
  }
});

// Veritabanı bağlantısını Express app'e ekleyelim
app.set('db', db);

// Routes
const authRoutes = require('./routes/auth')(db);
const companyRoutes = require('./routes/company')(db);
const agencyRoutes = require('./routes/agency')(db);
const agencyAddCompanies = require('./routes/agencyAddCompanies')(db);
const backupRoutes = require('./routes/backup')(db);
const tourlist = require('./routes/tourlist')(db);
const alltoursave = require('./routes/alltoursave')(db);
const currencyRouter = require('./routes/currency');
const providerDataRoutes = require('./routes/providerData')(db);
const guideDataRoutes = require('./routes/guideData')(db);
const safeDataRouter = require('./routes/safeData')(db);
const guideLoginRouter = require('./routes/guideLogin')(db);
const guideGetToursRouter = require('./routes/guidegetTours')(db);
const guideLogoutRouter = require('./routes/guideLogout')(db);
const checkTourAvailabilityRouter = require('./routes/checkTourAvailability')(db);//turları yazdırırken durumlarını kontrol ettiğimiz api
const reservationsRouter = require('./routes/reservations')(db); // rezervasyonları terminalde yazdırdığımız api
const getReservationRouter = require('./routes/getReservation')(db);
const reservationApproveRouter = require('./routes/reservationApprove')(db);
const providerApproveRouter = require('./routes/providerApprove')(db);
const guideProcessRouter = require('./routes/guideProcess')(db);
const tourOperationsRouter = require('./routes/tourOperations')(db);
const providerApproveMobileRouter = require('./routes/providerApproveMobile')(db);

// Route middlewares
app.use('/auth', authRoutes);
app.use('/company', companyRoutes);
app.use('/agency', agencyRoutes);
app.use('/agencyAddCompanies', agencyAddCompanies);
app.use('/tourlist', tourlist);
app.use('/backup', backupRoutes);
app.use('/alltoursave', alltoursave);
app.use('/currency', currencyRouter);
app.use('/provider-data', providerDataRoutes);
app.use('/guide-data', guideDataRoutes);
app.use('/safe-data', safeDataRouter);
app.use('/guide-login', guideLoginRouter);
app.use('/guidegetTours', guideGetToursRouter);
app.use('/guide-logout', guideLogoutRouter);
app.use('/check-tour-availability', checkTourAvailabilityRouter);
app.use('/reservations', reservationsRouter);
app.use('/get-reservation', getReservationRouter);
app.use('/reservation-approve', reservationApproveRouter);
app.use('/provider-approve', providerApproveRouter);
app.use('/provider-approve-mobile', providerApproveMobileRouter);
app.use('/guide', guideProcessRouter);
app.use('/guide-process', guideProcessRouter);
app.use('/tour-operations', tourOperationsRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 
