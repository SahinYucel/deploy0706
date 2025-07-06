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

  // Güvenli JSON parse fonksiyonu
  const safeJSONParse = (str, defaultValue = []) => {
    if (!str) return defaultValue;
    try {
      return JSON.parse(str);
    } catch (error) {
      console.error('JSON parse error:', error);
      return defaultValue;
    }
  };

  // Rehberleri kaydet
  router.post('/save', async (req, res) => {
    const { companyId, guides } = req.body;

    console.log('Gelen rehber verileri:', JSON.stringify(guides, null, 2));

    try {
      await query('START TRANSACTION');

      try {
        // Sadece rehber ve bölge tablolarını temizle
        await query('DELETE FROM guide_regions WHERE guide_id IN (SELECT id FROM agencyguide WHERE company_id = ?)', [companyId]);
        await query('DELETE FROM agencyguide WHERE company_id = ?', [companyId]);

        // Her rehberi tek tek ekle
        for (const guide of guides) {
          console.log('İşlenen rehber:', guide.name, guide.surname);

          // Rehberi ekle
          const insertGuideSql = `
            INSERT INTO agencyguide (
              name, surname, is_active, guide_group,
              nickname, languages, other_languages, phone, code, sifre,
              company_id, is_login, entitlement
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          const guideResult = await query(insertGuideSql, [
            guide.name,
            guide.surname, 
            guide.isActive ? 1 : 0,
            guide.guideGroup,
            guide.nickname,
            typeof guide.languages === 'object' ? JSON.stringify(guide.languages) : '{}',
            guide.otherLanguages,
            guide.phone,
            guide.code,
            guide.guide_password,
            companyId,
            1,  // is_login varsayılan olarak 1
            parseFloat(guide.entitlement) || 0
          ]);

          const guideId = guideResult.insertId;

          // Insert guide regions
          if (Array.isArray(guide.region) && guide.region.length > 0) {
            const insertRegionsSql = `
              INSERT INTO guide_regions (guide_id, company_id, region_name)
              VALUES ?
            `;
            const regionValues = guide.region.map(region => [guideId, companyId, region]);
            await query(insertRegionsSql, [regionValues]);
          }
        }

        await query('COMMIT');
        res.json({ success: true, message: 'Rehberler başarıyla kaydedildi' });

      } catch (error) {
        await query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Rehber kaydetme hatası:', error);
      res.status(500).json({ 
        error: 'Rehberler kaydedilemedi',
        details: error.message 
      });
    }
  });

  // Rehberleri getir
  router.get('/:companyId', async (req, res) => {
    const { companyId } = req.params;

    try {
      // Ana rehber sorgusu
      const guideSql = `
        SELECT 
          ag.id,
          ag.name,
          ag.surname,
          ag.is_active,
          ag.guide_group,
          ag.nickname,
          ag.languages,
          ag.other_languages,
          ag.phone,
          ag.code,
          ag.sifre as guide_password,
          ag.entitlement,
          GROUP_CONCAT(DISTINCT gr.region_name) as regions
        FROM agencyguide ag 
        LEFT JOIN guide_regions gr ON ag.id = gr.guide_id
        WHERE ag.company_id = ?
        GROUP BY ag.id
        LIMIT 1
      `;
      
      const guides = await query(guideSql, [companyId]);
      
      if (!guides || !Array.isArray(guides)) {
        return res.json([]);
      }

      // Rehber verilerini formatla
      const formattedGuides = guides.map(guide => {
        // Dil bilgilerini güvenli bir şekilde parse et
        let languages = {};
        try {
          if (guide.languages && typeof guide.languages === 'string') {
            languages = JSON.parse(guide.languages);
          } else if (typeof guide.languages === 'object') {
            languages = guide.languages;
          }
        } catch (error) {
          console.error('Languages parse error:', error);
          languages = {};
        }

        // Seçili dilleri formatla
        const selectedLanguages = Object.entries(languages)
          .filter(([_, isSelected]) => isSelected)
          .map(([lang]) => lang.charAt(0).toUpperCase() + lang.slice(1));
        
        if (guide.other_languages) {
          selectedLanguages.push(guide.other_languages);
        }

        return {
          id: guide.id,
          name: guide.name,
          surname: guide.surname,
          isActive: guide.is_active === 1,
          region: guide.regions ? guide.regions.split(',') : [],
          guideGroup: guide.guide_group,
          nickname: guide.nickname,
          languages: languages,
          languagesDisplay: selectedLanguages.join(', '),
          otherLanguages: guide.other_languages,
          phone: guide.phone,
          code: guide.code,
          guide_password: guide.guide_password,
          entitlement: parseFloat(guide.entitlement) || 0
        };
      });

      res.json(formattedGuides);

    } catch (error) {
      console.error('Rehber getirme hatası:', error);
      res.status(500).json({ 
        error: 'Rehberler getirilemedi',
        details: error.message
      });
    }
  });

  // Rehber sil
  router.delete('/:guideId', async (req, res) => {
    const { guideId } = req.params;

    try {
      await db.beginTransaction();

      // Cascade olduğu için sadece rehberi silmek yeterli
      await db.query('DELETE FROM agencyguide WHERE id = ?', [guideId]);

      await db.commit();
      res.json({ success: true, message: 'Rehber başarıyla silindi' });

    } catch (error) {
      await db.rollback();
      console.error('Rehber silme hatası:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Guide login endpoint'i
  router.post('/guide-login', async (req, res) => {
    const { code, password } = req.body;

    try {
      // Rehberi ve şirket bilgisini getir
      const sql = `
        SELECT g.*, c.company_name 
        FROM agencyguide g
        JOIN companyusers c ON g.company_id = c.id
        WHERE g.code = ?
      `;
      
      const guides = await query(sql, [code]);

      if (guides.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
      }

      const guide = guides[0];

      // Şifre kontrolü
      if (guide.sifre !== password) {
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

      // Token oluştur
      const token = 'dummy-token-' + Math.random().toString(36).substring(7);

      // Response objesi
      const response = {
        success: true,
        data: {
          id: guide.id,
          name: guide.name,
          surname: guide.surname,
          code: guide.code,
          nickname: guide.nickname,
          companyId: guide.company_id,
          companyName: guide.company_name,
          region: JSON.parse(guide.region || '[]'),
          entitlement: parseFloat(guide.entitlement) || 0,
          isLogin: 1,
          phone: guide.phone || ''
        },
        token
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


  return router;
}; 
