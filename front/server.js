// Frontend'in CORS ayarları
app.use(cors({
  origin: [
    'http://13.216.32.130',        // Frontend production
    'http://34.227.45.47:5000',    // Backend
    'exp://*',                     // Expo için
    'http://localhost:19006',      // React Native için
    'null',
    undefined
  ],
  credentials: true
})); 