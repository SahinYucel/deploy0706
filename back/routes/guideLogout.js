const express = require('express');
const router = express.Router();

module.exports = (db) => {
  // Promise wrapper for database queries
  const query = (sql, values) => {
    return new Promise((resolve, reject) => {
      db.query(sql, values, (error, results) => {
        if (error) reject(error);
        else resolve(results);
      });
    });
  };

  router.post('/', async (req, res) => {
    const { guideId } = req.body;

    try {
      const sql = `
        UPDATE agencyguide 
        SET is_login = 0 
        WHERE id = ?
      `;

      await query(sql, [guideId]);
      
      res.json({
        success: true,
        message: 'Logout status updated successfully'
      });
    } catch (error) {
      console.error('Guide logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Çıkış işlemi sırasında bir hata oluştu'
      });
    }
  });

  return router;
}; 