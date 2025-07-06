const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const multer = require('multer');
require('dotenv').config();

const DB_USER = 'sahin';
const DB_PASSWORD = 'root';
const DB_NAME = 'tour_program';

// Multer konfigürasyonu
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    cb(null, backupDir);
  },
  filename: function (req, file, cb) {
    const date = new Date().toISOString().replace(/[:.]/g, '-');
    cb(null, `restore_${date}_${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

// Her şirket için otomatik yedekleme durumunu tutacak Map
const autoBackupStatus = new Map();
const autoBackupJobs = new Map();

module.exports = (db) => {
  // Normal yedekleme endpoint'i
  router.post('/backup/:companyId', async (req, res) => {
    const { companyId } = req.params;
    const { companyName } = req.body;
    
    try {
      const backupDir = path.join(__dirname, '../backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const date = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `backup_${companyName || 'default'}_${date}.sql`;
      const filePath = path.join(backupDir, fileName);

      const command = `mysqldump -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} > "${filePath}"`;

      exec(command, (error, stderr) => {
        if (error) {
          console.error('Backup error:', error);
          res.status(500).json({ error: 'Veritabanı yedekleme hatası', details: error.message });
          return;
        }

        res.json({
          success: true,
          message: 'Veritabanı yedeği alındı',
          fileName: fileName
        });
      });
    } catch (err) {
      console.error('Backup error:', err);
      res.status(500).json({ error: 'Yedekleme hatası', details: err.message });
    }
  });

  // Geri yükleme endpoint'i
  router.post('/restore', upload.single('backupFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Dosya yüklenmedi' });
      }

      const filePath = req.file.path;
      
      // Dosya içeriğini kontrol et
      const fileContent = fs.readFileSync(filePath, 'utf8');
      if (!fileContent.includes('CREATE TABLE') && !fileContent.includes('INSERT INTO')) {
        fs.unlinkSync(filePath); // Geçersiz dosyayı sil
        return res.status(400).json({ error: 'Geçersiz SQL yedek dosyası' });
      }

      const command = `mysql -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} < "${filePath}"`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('Restore error:', error);
          res.status(500).json({ error: 'Veritabanı geri yükleme hatası', details: error.message });
          return;
        }

        // Başarılı geri yükleme sonrası dosyayı sil
        fs.unlinkSync(filePath);

        res.json({
          success: true,
          message: 'Veritabanı başarıyla geri yüklendi',
          fileName: req.file.originalname
        });
      });
    } catch (err) {
      console.error('Restore error:', err);
      // Hata durumunda dosyayı silmeyi dene
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkErr) {
          console.error('File deletion error:', unlinkErr);
        }
      }
      res.status(500).json({ error: 'Geri yükleme hatası', details: err.message });
    }
  });

  // Otomatik yedekleme durumunu kontrol etme endpoint'i
  router.get('/auto-backup/:companyId/status', (req, res) => {
    const { companyId } = req.params;
    res.json({
      success: true,
      enabled: autoBackupStatus.get(companyId) || false
    });
  });

  // Otomatik yedeklemeyi açma/kapama endpoint'i
  router.post('/auto-backup/:companyId', (req, res) => {
    const { companyId } = req.params;
    const { enabled } = req.body;

    try {
      if (enabled) {
        // Eğer varolan bir job varsa önce onu durdur
        if (autoBackupJobs.has(companyId)) {
          autoBackupJobs.get(companyId).stop();
        }

        // Her gece 00:00'da çalışacak cron job oluştur
        const job = cron.schedule('0 0 * * *', async () => {
          try {
            const backupDir = path.join(__dirname, '../backups');
            if (!fs.existsSync(backupDir)) {
              fs.mkdirSync(backupDir, { recursive: true });
            }

            const date = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `auto_backup_${companyId}_${date}.sql`;
            const filePath = path.join(backupDir, fileName);

            const command = `mysqldump -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} > "${filePath}"`;
            
            exec(command, (error) => {
              if (error) {
                console.error('Otomatik yedekleme hatası:', error);
              } else {
                console.log('Otomatik yedekleme başarılı:', fileName);
              }
            });
          } catch (error) {
            console.error('Otomatik yedekleme hatası:', error);
          }
        });

        autoBackupJobs.set(companyId, job);
        autoBackupStatus.set(companyId, true);
      } else {
        // Otomatik yedeklemeyi kapat
        if (autoBackupJobs.has(companyId)) {
          autoBackupJobs.get(companyId).stop();
          autoBackupJobs.delete(companyId);
        }
        autoBackupStatus.set(companyId, false);
      }

      res.json({
        success: true,
        message: enabled ? 'Otomatik yedekleme aktifleştirildi' : 'Otomatik yedekleme devre dışı bırakıldı'
      });
    } catch (error) {
      console.error('Auto backup error:', error);
      res.status(500).json({
        success: false,
        error: 'Otomatik yedekleme ayarlanırken bir hata oluştu',
        details: error.message
      });
    }
  });

  return router;
}; 