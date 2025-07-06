const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

module.exports = (db) => {
  // Save company user endpoint
  router.post('/', async (req, res) => {
    const { companyName, position, refcode, companyUser, companyPass, durationuse, verification } = req.body;
    
    try {
      const hashedPassword = await bcrypt.hash(companyPass, 10);
      
      const sql = "INSERT INTO companyusers (company_name, position, ref_code, company_user, company_pass, duration_use, verification) VALUES (?, ?, ?, ?, ?, ?, ?)";
      
      db.query(sql, [companyName, position, refcode, companyUser, hashedPassword, durationuse, verification], (err, result) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.status(201).json({ message: "Company user saved successfully", id: result.insertId });
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Company login endpoint
  router.post('/login', async (req, res) => {
    const { companyUser, companyPass, position } = req.body;
    
    const sql = "SELECT * FROM companyusers WHERE company_user = ? AND position = ?";
    db.query(sql, [companyUser, position], async (err, results) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (results.length === 0) {
        res.status(401).json({ error: "Kullanıcı bilgileri hatalı" });
        return;
      }
      
      const company = results[0];
      
      try {
        const validPassword = await bcrypt.compare(companyPass, company.company_pass);
        
        if (!validPassword) {
          res.status(401).json({ error: "Kullanıcı bilgileri hatalı" });
          return;
        }
        
        // Kullanım süresi kontrolü
        const createdAt = new Date(company.created_at);
        const durationInYears = parseInt(company.duration_use);
        const expiryDate = new Date(createdAt.setFullYear(createdAt.getFullYear() + durationInYears));
        const now = new Date();

        if (now > expiryDate) {
          res.status(403).json({ 
            error: "Kullanım süreniz dolmuştur. Lütfen yönetici ile iletişime geçin.",
            expiredAt: expiryDate
          });
          return;
        }

        // Kalan süre hesaplama
        const remainingTime = expiryDate - now;
        const remainingDays = Math.ceil(remainingTime / (1000 * 60 * 60 * 24));

        res.json({ 
          company: {
            ...company,
            company_pass: undefined
          },
          subscription: {
            expiryDate,
            remainingDays
          }
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  });

  // Get all companies endpoint
  router.get('/', (req, res) => {
    const sql = "SELECT * FROM companyusers";
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(results);
    });
  });

  // Update company endpoint
  router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { companyName, position, companyUser, durationuse } = req.body;
    
    const sql = `UPDATE companyusers 
                 SET company_name = ?, 
                     position = ?, 
                     company_user = ?, 
                     duration_use = ? 
                 WHERE id = ?`;
    
    db.query(sql, [companyName, position, companyUser, durationuse, id], (err, result) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (result.affectedRows === 0) {
        res.status(404).json({ error: "Company not found" });
        return;
      }
      res.json({ message: "Company updated successfully" });
    });
  });

  // Delete company endpoint
  router.delete('/:id', (req, res) => {
    const { id } = req.params;
    
    // İlk olarak role_permissions tablosundan ilgili kayıtları sil
    const deleteRolePermissionsSql = "DELETE FROM role_permissions WHERE company_id = ?";
    db.query(deleteRolePermissionsSql, [id], (rolePermErr) => {
      if (rolePermErr) {
        res.status(500).json({ error: rolePermErr.message });
        return;
      }

      // Sonra agencyrolemembers tablosundan ilgili kayıtları sil
      const deleteAgencyMembersSql = "DELETE FROM agencyrolemembers WHERE company_id = ?";
      db.query(deleteAgencyMembersSql, [id], (agencyErr) => {
        if (agencyErr) {
          res.status(500).json({ error: agencyErr.message });
          return;
        }

        // En son şirketi sil
        const deleteCompanySql = "DELETE FROM companyusers WHERE id = ?";
        db.query(deleteCompanySql, [id], (err, result) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          if (result.affectedRows === 0) {
            res.status(404).json({ error: "Company not found" });
            return;
          }
          res.json({ message: "Company and all related data deleted successfully" });
        });
      });
    });
  });

  // Database backup endpoint
  router.post('/backup/:companyId', async (req, res) => {
    const { companyId } = req.params;
    
    try {
      // Yedekleme klasörünü oluştur
      const backupDir = path.join(__dirname, '../backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Tarih formatını ayarla
      const date = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `backup_${companyId}_${date}.sql`;
      const filePath = path.join(backupDir, fileName);

      // MySQL yedekleme komutu
      const command = `mysqldump -u sahin -proot tour_program > "${filePath}"`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('Yedekleme hatası:', error);
          res.status(500).json({ error: 'Veritabanı yedekleme sırasında bir hata oluştu' });
          return;
        }

        // Yedekleme başarılı
        res.json({
          success: true,
          message: 'Veritabanı yedeği başarıyla alındı',
          fileName: fileName,
          backupPath: filePath
        });
      });
    } catch (err) {
      console.error('Yedekleme hatası:', err);
      res.status(500).json({ error: 'Veritabanı yedekleme sırasında bir hata oluştu' });
    }
  });

  return router;
}; 