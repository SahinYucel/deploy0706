const express = require('express');
const router = express.Router();

module.exports = (db) => {
  // Provider data kaydetme endpoint'i
  router.post('/:providerId', async (req, res) => {
    const { providerId } = req.params;
    const { earnings, revenue, currency, pax } = req.body;

    try {
      // Önce mevcut kaydı kontrol et
      const checkSql = "SELECT id FROM agency_provider_settings WHERE provider_id = ?";
      db.query(checkSql, [providerId], (checkErr, checkResults) => {
        if (checkErr) {
          console.error('Provider data kontrol hatası:', checkErr);
          return res.status(500).json({ error: checkErr.message });
        }

        if (checkResults.length > 0) {
          // Güncelleme yap
          const updateSql = `
            UPDATE agency_provider_settings 
            SET earnings = ?, 
                revenue = ?, 
                currency = ?,
                pax_adult = ?,
                pax_child = ?,
                pax_free = ?
            WHERE provider_id = ?
          `;

          const values = [
            earnings || 0,
            revenue || 0,
            currency || 'EUR',
            pax?.adult || 0,
            pax?.child || 0,
            pax?.free || 0,
            providerId
          ];

          db.query(updateSql, values, (updateErr) => {
            if (updateErr) {
              console.error('Provider data güncelleme hatası:', updateErr);
              return res.status(500).json({ error: updateErr.message });
            }
            res.json({ success: true, message: 'Provider data güncellendi' });
          });
        } else {
          // Yeni kayıt oluştur
          const insertSql = `
            INSERT INTO agency_provider_settings 
            (provider_id, earnings, revenue, currency, pax_adult, pax_child, pax_free)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `;

          const values = [
            providerId,
            earnings || 0,
            revenue || 0,
            currency || 'EUR',
            pax?.adult || 0,
            pax?.child || 0,
            pax?.free || 0
          ];

          db.query(insertSql, values, (insertErr) => {
            if (insertErr) {
              console.error('Provider data kayıt hatası:', insertErr);
              return res.status(500).json({ error: insertErr.message });
            }
            res.json({ success: true, message: 'Provider data kaydedildi' });
          });
        }
      });
    } catch (error) {
      console.error('Provider data işlem hatası:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Provider data getirme endpoint'i
  router.get('/:providerId', (req, res) => {
    const { providerId } = req.params;

    const sql = `
      SELECT earnings, revenue, currency, 
             pax_adult, pax_child, pax_free
      FROM agency_provider_settings 
      WHERE provider_id = ?
    `;

    db.query(sql, [providerId], (err, results) => {
      if (err) {
        console.error('Provider data getirme hatası:', err);
        return res.status(500).json({ error: err.message });
      }

      if (results.length === 0) {
        return res.json({
          earnings: 0,
          revenue: 0,
          currency: 'EUR',
          pax: {
            adult: 0,
            child: 0,
            free: 0
          }
        });
      }

      const data = results[0];
      res.json({
        earnings: data.earnings,
        revenue: data.revenue,
        currency: data.currency,
        pax: {
          adult: data.pax_adult,
          child: data.pax_child,
          free: data.pax_free
        }
      });
    });
  });

  return router;
};