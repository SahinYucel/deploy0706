const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

module.exports = (db) => {
  // Register agency role member endpoint
  router.post('/register', async (req, res) => {
    const { username, position, password, companyId, verification } = req.body;
    
    try {
      // Önce şirketin verification kodunu kontrol et
      const checkVerificationSql = "SELECT verification FROM companyusers WHERE id = ?";
      db.query(checkVerificationSql, [companyId], async (verifyErr, verifyResults) => {
        if (verifyErr) {
          console.error('Verification sorgusunda hata:', verifyErr);
          res.status(500).json({ error: verifyErr.message });
          return;
        }

        if (verifyResults.length === 0) {
          res.status(404).json({ error: "Şirket bulunamadı" });
          return;
        }

        const dbVerification = verifyResults[0].verification;
        
        // Verification kodu kontrolü
        if (!verification || !dbVerification || verification.trim() !== dbVerification.trim()) {
          console.error('Verification kodu eşleşmiyor:', {
            gelen: verification,
            beklenen: dbVerification
          });
          res.status(400).json({ error: "Verification kodu hatalı" });
          return;
        }

        // Aynı kullanıcı adı ve pozisyonda başka kullanıcı var mı kontrolü
        const checkUserSql = "SELECT id FROM agencyrolemembers WHERE username = ? AND position = ? AND company_id = ?";
        db.query(checkUserSql, [username, position, companyId], async (userErr, userResults) => {
          if (userErr) {
            console.error('Kullanıcı kontrolünde hata:', userErr);
            res.status(500).json({ error: userErr.message });
            return;
          }

          if (userResults.length > 0) {
            res.status(400).json({ error: "Bu kullanıcı adı ve pozisyon zaten kullanımda" });
            return;
          }

          // Verification doğruysa ve kullanıcı benzersizse kaydet
          const hashedPassword = await bcrypt.hash(password, 10);
          const insertSql = "INSERT INTO agencyrolemembers (username, position, password, company_id) VALUES (?, ?, ?, ?)";
          
          db.query(insertSql, [username, position, hashedPassword, companyId], (err, result) => {
            if (err) {
              console.error('Kullanıcı kaydında hata:', err);
              res.status(500).json({ error: err.message });
              return;
            }
            console.log('Kullanıcı başarıyla kaydedildi');
            res.status(201).json({ message: "Agency role member registered successfully" });
          });
        });
      });
    } catch (error) {
      console.error('Genel bir hata oluştu:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Login agency role member endpoint
  router.post('/login', async (req, res) => {
    const { username, position, password, companyId } = req.body;
    
    const sql = "SELECT * FROM agencyrolemembers WHERE username = ? AND position = ? AND company_id = ?";
    db.query(sql, [username, position, companyId], async (err, results) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (results.length === 0) {
        res.status(401).json({ error: "Kullanıcı bilgileri hatalı" });
        return;
      }
      
      const user = results[0];
      
      try {
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
          res.status(401).json({ error: "Kullanıcı bilgileri hatalı" });
          return;
        }

        // Kullanıcının rol izinlerini getir
        const permissionsSql = "SELECT role_name, page_id, has_permission FROM role_permissions WHERE company_id = ? AND role_name = ?";
        db.query(permissionsSql, [companyId, position], (permErr, permResults) => {
          if (permErr) {
            res.status(500).json({ error: permErr.message });
            return;
          }

          // İzinleri formatla
          const permissions = permResults.reduce((acc, curr) => {
            if (!acc[curr.role_name]) {
              acc[curr.role_name] = {};
            }
            acc[curr.role_name][curr.page_id] = curr.has_permission === 1;
            return acc;
          }, {});

          res.json({ 
            user: {
              id: user.id,
              username: user.username,
              position: user.position,
              companyId: user.company_id
            },
            permissions: permissions[position] || {}
          });
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  });

  // Get all agency role members for a company
  router.get('/members/:companyId', (req, res) => {
    const { companyId } = req.params;
    
    const sql = "SELECT id, username, position, created_at FROM agencyrolemembers WHERE company_id = ?";
    db.query(sql, [companyId], (err, results) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      res.json(results);
    });
  });

  // Delete agency member
  router.delete('/members/:id', (req, res) => {
    const memberId = req.params.id;

    // Önce kullanıcının rolünü ve şirket ID'sini kontrol et
    const checkRoleSql = "SELECT position, company_id FROM agencyrolemembers WHERE id = ?";
    db.query(checkRoleSql, [memberId], (checkErr, checkResults) => {
      if (checkErr) {
        console.error('Rol kontrolü hatası:', checkErr);
        res.status(500).json({ error: checkErr.message });
        return;
      }

      if (checkResults.length === 0) {
        res.status(404).json({ error: "Kullanıcı bulunamadı" });
        return;
      }

      const { position, company_id } = checkResults[0];

      // Eğer kullanıcı admin ise, başka admin olup olmadığını kontrol et
      if (position === 'admin') {
        const checkAdminCountSql = "SELECT COUNT(*) as adminCount FROM agencyrolemembers WHERE company_id = ? AND position = 'admin'";
        db.query(checkAdminCountSql, [company_id], (countErr, countResults) => {
          if (countErr) {
            console.error('Admin sayısı kontrolü hatası:', countErr);
            res.status(500).json({ error: countErr.message });
            return;
          }

          if (countResults[0].adminCount <= 1) {
            res.status(403).json({ error: "Son admin kullanıcısı silinemez" });
            return;
          }

          // Birden fazla admin varsa, kullanıcıyı sil
          deleteUser(memberId, res);
        });
      } else {
        // Admin değilse direkt sil
        deleteUser(memberId, res);
      }
    });
  });

  // Kullanıcı silme yardımcı fonksiyonu
  function deleteUser(memberId, res) {
    const deleteSql = "DELETE FROM agencyrolemembers WHERE id = ?";
    db.query(deleteSql, [memberId], (deleteErr, deleteResult) => {
      if (deleteErr) {
        console.error('Kullanıcı silme hatası:', deleteErr);
        res.status(500).json({ error: deleteErr.message });
        return;
      }

      if (deleteResult.affectedRows === 0) {
        res.status(404).json({ error: "Kullanıcı silinemedi" });
        return;
      }

      res.json({ 
        message: "Kullanıcı başarıyla silindi",
        success: true 
      });
    });
  }

  // Update agency member role
  router.put('/members/:id/role', (req, res) => {
    const memberId = req.params.id;
    const { newRole } = req.body;

    // Önce kullanıcının mevcut rolünü ve şirket ID'sini kontrol et
    const checkRoleSql = "SELECT position, company_id FROM agencyrolemembers WHERE id = ?";
    db.query(checkRoleSql, [memberId], (checkErr, checkResults) => {
      if (checkErr) {
        res.status(500).json({ error: checkErr.message });
        return;
      }

      if (checkResults.length === 0) {
        res.status(404).json({ error: "Kullanıcı bulunamadı" });
        return;
      }

      const { position, company_id } = checkResults[0];

      // Eğer kullanıcı admin ise ve rolü değiştiriliyorsa, başka admin olup olmadığını kontrol et
      if (position === 'admin' && newRole !== 'admin') {
        const checkAdminCountSql = "SELECT COUNT(*) as adminCount FROM agencyrolemembers WHERE company_id = ? AND position = 'admin'";
        db.query(checkAdminCountSql, [company_id], (countErr, countResults) => {
          if (countErr) {
            res.status(500).json({ error: countErr.message });
            return;
          }

          if (countResults[0].adminCount <= 1) {
            res.status(403).json({ error: "Son admin kullanıcısının rolü değiştirilemez" });
            return;
          }

          // Birden fazla admin varsa, rolü güncelle
          updateRole(memberId, newRole, res);
        });
      } else {
        // Admin değilse veya admin rolüne geçiş yapılıyorsa direkt güncelle
        updateRole(memberId, newRole, res);
      }
    });
  });

  // Rol güncelleme yardımcı fonksiyonu
  function updateRole(memberId, newRole, res) {
    const updateSql = "UPDATE agencyrolemembers SET position = ? WHERE id = ?";
    db.query(updateSql, [newRole, memberId], (updateErr, updateResult) => {
      if (updateErr) {
        res.status(500).json({ error: updateErr.message });
        return;
      }

      res.json({ message: "Kullanıcı rolü başarıyla güncellendi" });
    });
  }

  // Update agency member username
  router.put('/members/:id/username', (req, res) => {
    const memberId = req.params.id;
    const { newUsername } = req.body;

    // Önce kullanıcının mevcut rolünü ve şirket ID'sini kontrol et
    const checkRoleSql = "SELECT position, company_id FROM agencyrolemembers WHERE id = ?";
    db.query(checkRoleSql, [memberId], (checkErr, checkResults) => {
      if (checkErr) {
        res.status(500).json({ error: checkErr.message });
        return;
      }

      if (checkResults.length === 0) {
        res.status(404).json({ error: "Kullanıcı bulunamadı" });
        return;
      }

      const { position, company_id } = checkResults[0];

      // Eğer kullanıcı admin ise, başka admin olup olmadığını kontrol et
      if (position === 'admin') {
        const checkAdminCountSql = "SELECT COUNT(*) as adminCount FROM agencyrolemembers WHERE company_id = ? AND position = 'admin'";
        db.query(checkAdminCountSql, [company_id], (countErr, countResults) => {
          if (countErr) {
            res.status(500).json({ error: countErr.message });
            return;
          }

          if (countResults[0].adminCount <= 1) {
            res.status(403).json({ error: "Son admin kullanıcısının bilgileri değiştirilemez" });
            return;
          }

          // Birden fazla admin varsa, kullanıcı adını güncelle
          updateUsername(memberId, newUsername, res);
        });
      } else {
        // Admin değilse direkt güncelle
        updateUsername(memberId, newUsername, res);
      }
    });
  });

  // Kullanıcı adı güncelleme yardımcı fonksiyonu
  function updateUsername(memberId, newUsername, res) {
    const updateSql = "UPDATE agencyrolemembers SET username = ? WHERE id = ?";
    db.query(updateSql, [newUsername, memberId], (updateErr, updateResult) => {
      if (updateErr) {
        res.status(500).json({ error: updateErr.message });
        return;
      }

      res.json({ message: "Kullanıcı adı başarıyla güncellendi" });
    });
  }

  // Get role permissions for a company
  router.get('/role-permissions/:companyId', (req, res) => {
    const { companyId } = req.params;
    
    const sql = "SELECT role_name, page_id, has_permission FROM role_permissions WHERE company_id = ?";
    db.query(sql, [companyId], (err, results) => {
      if (err) {
        console.error('Rol izinleri getirme hatası:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Sonuçları role_name'e göre grupla ve boolean'a dönüştür
      const permissions = results.reduce((acc, curr) => {
        if (!acc[curr.role_name]) {
          acc[curr.role_name] = {};
        }
        // Veritabanından gelen 1/0 değerlerini boolean'a dönüştür
        acc[curr.role_name][curr.page_id] = curr.has_permission === 1;
        return acc;
      }, {});
      
      res.json(permissions);
    });
  });

  // Update role permissions
  router.put('/role-permissions/:companyId', (req, res) => {
    const { companyId } = req.params;
    const { permissions } = req.body;
    
    // Transaction başlat
    db.beginTransaction(err => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // Önce mevcut izinleri sil
      const deleteSql = "DELETE FROM role_permissions WHERE company_id = ?";
      db.query(deleteSql, [companyId], (deleteErr) => {
        if (deleteErr) {
          return db.rollback(() => {
            res.status(500).json({ error: deleteErr.message });
          });
        }
        
        // Yeni izinleri ekle
        const insertSql = "INSERT INTO role_permissions (company_id, role_name, page_id, has_permission) VALUES ?";
        const values = [];
        
        Object.entries(permissions).forEach(([role, pages]) => {
          Object.entries(pages).forEach(([pageId, hasPermission]) => {
            values.push([companyId, role, pageId, hasPermission ? 1 : 0]);
          });
        });
        
        if (values.length === 0) {
          return db.rollback(() => {
            res.status(400).json({ error: "No permissions provided" });
          });
        }
        
        db.query(insertSql, [values], (insertErr) => {
          if (insertErr) {
            return db.rollback(() => {
              res.status(500).json({ error: insertErr.message });
            });
          }
          
          // Transaction'ı commit et
          db.commit(commitErr => {
            if (commitErr) {
              return db.rollback(() => {
                res.status(500).json({ error: commitErr.message });
              });
            }
            res.json({ 
              message: "İzinler başarıyla güncellendi",
              success: true 
            });
          });
        });
      });
    });
  });

  

  return router;
}; 