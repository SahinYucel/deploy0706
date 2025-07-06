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

  // Guide login endpoint'i
  router.post('/', async (req, res) => {
    const { name, password } = req.body;

    console.log('Login attempt:', { name, password });

    try {
      const sql = `
        SELECT 
          g.*,
          c.company_name,
          GROUP_CONCAT(gr.region_name) as regions,
          g.guide_group,
          g.nickname,
          g.entitlement,
          g.phone
        FROM agencyguide g
        JOIN companyusers c ON g.company_id = c.id
        LEFT JOIN guide_regions gr ON g.id = gr.guide_id
        WHERE LOWER(g.name) = LOWER(?)
        GROUP BY g.id
      `;

      const guides = await query(sql, [name]);

      if (guides.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
      }

      const guide = guides[0];

      // Şifre kontrolü
      if (!guide.sifre || guide.sifre !== password) {
        return res.status(401).json({
          success: false,
          message: 'Şifre hatalı'
        });
      }

      // Rehber aktif mi kontrolü
      if (!guide.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Hesabınız aktif değil'
        });
      }

      // Update is_login status to 1
      const updateLoginStatusSql = `
        UPDATE agencyguide 
        SET is_login = 1 
        WHERE id = ?
      `;
      await query(updateLoginStatusSql, [guide.id]);

      // Bölgeleri array'e dönüştür
      const regions = guide.regions ? guide.regions.split(',') : [];

      // Response objesi
      const response = {
        success: true,
        data: {
          id: guide.id,
          name: guide.name,
          surname: guide.surname,
          code: guide.code,
          companyId: guide.company_id,
          companyName: guide.company_name,
          region: regions,
          guideGroup: guide.guide_group || '',
          nickname: guide.nickname || 'Guide',
          entitlement: parseFloat(guide.entitlement) || 0,
          phone: guide.phone || ''
        }
      };

      res.json(response);

    } catch (error) {
      console.error('Guide login error:', error);
      res.status(500).json({
        success: false,
        message: 'Giriş işlemi sırasında bir hata oluştu',
        error: error.message
      });
    }
  });

  // Add logout endpoint
  router.post('/logout', async (req, res) => {
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
        message: 'Logout successful'
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