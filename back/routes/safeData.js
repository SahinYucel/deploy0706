const express = require('express');
const router = express.Router();

module.exports = (db) => {
  // Promise wrapper for database queries
  const query = (sql, values) => {
    return new Promise((resolve, reject) => {
      db.query(sql, values, (error, results) => {
        if (error) {
          console.error('Database query error:', error);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  };

  // Kasaları getir
  router.get('/:companyId', async (req, res) => {
    const { companyId } = req.params;

    try {
      const sql = `
        SELECT * FROM safe 
        WHERE company_id = ?
        ORDER BY created_at DESC
      `;
      
      const safes = await query(sql, [companyId]);
      res.json(safes);

    } catch (error) {
      console.error('Kasa getirme hatası:', error);
      res.status(500).json({ 
        error: 'Kasalar getirilemedi',
        details: error.message 
      });
    }
  });

  // Kasa kaydet/güncelle
  router.post('/save', async (req, res) => {
    const { companyId, safe } = req.body;

    // Type değerini doğrula
    if (!['cash', 'card'].includes(safe.type)) {
      return res.status(400).json({
        error: 'Geçersiz kasa tipi',
        details: 'Kasa tipi "cash" veya "card" olmalıdır'
      });
    }

    try {
      if (safe.id) {
        // Güncelleme
        const updateSql = `
          UPDATE safe 
          SET name = ?, 
              type = ?,
              pos_commission_rate = ?,
              balance = ?,
              negativebalance = ?
          WHERE id = ? AND company_id = ?
        `;

        await query(updateSql, [
          safe.name,
          safe.type,
          safe.type === 'card' ? safe.pos_commission_rate : null,
          safe.balance,
          safe.negativebalance || 0,
          safe.id,
          companyId
        ]);

      } else {
        // Yeni kayıt
        const insertSql = `
          INSERT INTO safe (
            company_id, name, type, pos_commission_rate, balance, negativebalance
          ) VALUES (?, ?, ?, ?, ?, ?)
        `;

        await query(insertSql, [
          companyId,
          safe.name,
          safe.type,
          safe.type === 'card' ? safe.pos_commission_rate : null,
          safe.balance,
          safe.negativebalance || 0
        ]);
      }

      res.json({ 
        success: true, 
        message: 'Kasa başarıyla kaydedildi' 
      });

    } catch (error) {
      console.error('Kasa kaydetme hatası:', error);
      res.status(500).json({ 
        error: 'Kasa kaydedilemedi',
        details: error.message 
      });
    }
  });

  // Kasa sil
  router.delete('/:safeId', async (req, res) => {
    const { safeId } = req.params;

    try {
      await query('DELETE FROM safe WHERE id = ?', [safeId]);
      res.json({ 
        success: true, 
        message: 'Kasa başarıyla silindi' 
      });

    } catch (error) {
      console.error('Kasa silme hatası:', error);
      res.status(500).json({ 
        error: 'Kasa silinemedi',
        details: error.message 
      });
    }
  });

  // Safe records'ı getir
  router.get('/records/:companyId', async (req, res) => {
    const { companyId } = req.params;
    const { startDate, endDate } = req.query;

    try {
      let whereClause = `WHERE sr.transaction_no IS NOT NULL`;
      const queryParams = [];

      // Tarih filtresi ekle
      if (startDate && endDate) {
        whereClause += ` AND DATE(sr.created_at) BETWEEN ? AND ?`;
        queryParams.push(startDate, endDate);
      } else if (startDate) {
        whereClause += ` AND DATE(sr.created_at) >= ?`;
        queryParams.push(startDate);
      } else if (endDate) {
        whereClause += ` AND DATE(sr.created_at) <= ?`;
        queryParams.push(endDate);
      }

      const sql = `
        WITH currency_totals AS (
          SELECT 
            pc.transaction_code,
            pc.currency,
            SUM(pc.total_amount) as total_amount
          FROM provider_collection pc
          WHERE pc.transaction_code IS NOT NULL
          GROUP BY pc.transaction_code, pc.currency
        )
        SELECT DISTINCT
          MIN(sr.id) as id,
          sr.transaction_no,
          sr.account_name,
          MAX(sr.created_at) as created_at,
          sr.description,
          sr.payment_type,
          sr.payment_method,
          CASE 
            WHEN sr.payment_type = 'gelir' THEN CONCAT(sr.currency, ':', sr.amount)
            WHEN sr.payment_type = 'gider' THEN CONCAT(sr.currency, ':', sr.amount)
            ELSE GROUP_CONCAT(
              DISTINCT CONCAT(ct.currency, ':', ct.total_amount)
              ORDER BY ct.currency
              SEPARATOR ';'
            )
          END as amounts
        FROM safe_records sr
        LEFT JOIN currency_totals ct ON sr.transaction_no COLLATE utf8mb4_unicode_ci = ct.transaction_code COLLATE utf8mb4_unicode_ci
        ${whereClause}
        GROUP BY sr.transaction_no, sr.account_name, sr.description, sr.payment_type, sr.payment_method, sr.currency, sr.amount
        ORDER BY created_at DESC
      `;
      
      const records = await query(sql, queryParams);
      res.json(records);

    } catch (error) {
      console.error('Safe records getirme hatası:', error);
      res.status(500).json({ 
        error: 'Safe records getirilemedi',
        details: error.message 
      });
    }
  });

  // Safe toplamlarını getir (balance ve negativebalance'dan)
  router.get('/totals/:companyId', async (req, res) => {
    const { companyId } = req.params;

    try {
      const sql = `
        SELECT 
          name as currency,
          type as payment_method,
          balance,
          negativebalance
        FROM safe 
        WHERE company_id = ?
        ORDER BY name, type
      `;
      
      const safes = await query(sql, [companyId]);
      
      // Gelir ve gider toplamlarını hesapla
      const totals = {
        gelir: {
          cash: {},
          card: {}
        },
        gider: {
          cash: {},
          card: {}
        }
      };

      safes.forEach(safe => {
        const paymentMethod = safe.payment_method === 'card' ? 'card' : 'cash';
        
        // Gelir (balance)
        if (safe.balance > 0) {
          totals.gelir[paymentMethod][safe.currency] = (totals.gelir[paymentMethod][safe.currency] || 0) + safe.balance;
        }
        
        // Gider (negativebalance)
        if (safe.negativebalance > 0) {
          totals.gider[paymentMethod][safe.currency] = (totals.gider[paymentMethod][safe.currency] || 0) + safe.negativebalance;
        }
      });

      res.json(totals);

    } catch (error) {
      console.error('Safe toplamları getirme hatası:', error);
      res.status(500).json({ 
        error: 'Safe toplamları getirilemedi',
        details: error.message 
      });
    }
  });

  // Manuel gelir-gider kaydı oluştur
  router.post('/manual-record', async (req, res) => {
    const { companyId, record } = req.body;

    if (!record.transaction_no || !record.account_name || !record.amount || !record.currency || !record.payment_type) {
      return res.status(400).json({
        error: 'Eksik bilgi',
        details: 'İşlem no, hesap adı, tutar, para birimi ve gelir/gider tipi zorunludur'
      });
    }

    try {
      // Transaction başlat
      await query('START TRANSACTION');

      try {
        // Safe records'a kayıt ekle
        const insertSafeRecord = `
          INSERT INTO safe_records (
            transaction_no,
            account_name,
            created_at,
            description,
            payment_type,
            payment_method,
            currency,
            amount
          ) VALUES (?, ?, NOW(), ?, ?, ?, ?, ?)
        `;

        await query(insertSafeRecord, [
          record.transaction_no,
          record.account_name,
          record.description || '',
          record.payment_type,
          record.payment_method || 'cash',
          record.currency,
          record.amount
        ]);

        // Safe balance'ı güncelle
        const updateSafeQuery = `
          UPDATE safe 
          SET ${record.payment_type === 'gelir' ? 'balance' : 'negativebalance'} = ${record.payment_type === 'gelir' ? 'balance' : 'negativebalance'} + ?,
              updated_at = NOW()
          WHERE company_id = ? AND name = ? AND type = ?
        `;

        const result = await query(updateSafeQuery, [
          record.amount,
          companyId,
          record.currency,
          record.payment_method || 'cash'
        ]);

        // Eğer safe kaydı yoksa yeni kayıt oluştur
        if (result.affectedRows === 0) {
          const insertSafeQuery = `
            INSERT INTO safe (
              company_id, 
              name, 
              type, 
              ${record.payment_type === 'gelir' ? 'balance' : 'negativebalance'},
              created_at
            ) VALUES (?, ?, ?, ?, NOW())
          `;

          await query(insertSafeQuery, [
            companyId,
            record.currency,
            record.payment_method || 'cash',
            record.amount
          ]);
        }

        // Transaction'ı commit et
        await query('COMMIT');

        res.json({
          success: true,
          message: 'Manuel kayıt başarıyla oluşturuldu'
        });

      } catch (error) {
        // Hata durumunda rollback yap
        await query('ROLLBACK');
        throw error;
      }

    } catch (error) {
      console.error('Manuel kayıt oluşturma hatası:', error);
      res.status(500).json({ 
        error: 'Manuel kayıt oluşturulamadı',
        details: error.message 
      });
    }
  });

  return router;
}; 