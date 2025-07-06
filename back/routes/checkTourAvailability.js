const express = require('express');
const router = express.Router();

module.exports = (db) => {
  router.post('/', async (req, res) => {
    try {
      const { tickets } = req.body;
      
      if (!tickets || !Array.isArray(tickets)) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz istek formatı. Tickets array bekleniyor.'
        });
      }

      const checkPromises = tickets.map(ticket => {
        return new Promise((resolve, reject) => {
          if (!ticket.tourName || !ticket.time) {
            resolve({
              tourName: ticket.tourName,
              available: false,
              message: 'Geçersiz bilet bilgisi'
            });
            return;
          }

          const query = `
            SELECT 
              t.id,
              t.is_active,
              t.tour_name,
              t.start_date,
              t.end_date,
              tpt.start_pickup_date,
              tpt.end_pickup_date,
              tpt.hour,
              tpt.minute,
              tpt.period_active
            FROM tours t
            LEFT JOIN tour_pickup_times tpt ON t.id = tpt.tour_id
            WHERE t.tour_name = ? 
            AND CONCAT(tpt.hour, ':', tpt.minute) = ?
          `;
          
          db.query(query, [ticket.tourName, ticket.time], (err, results) => {
            if (err) {
              console.error('Database error:', err);
              reject(err);
              return;
            }

            if (!results || results.length === 0) {
              resolve({
                tourName: ticket.tourName,
                available: false,
                message: 'Tur bulunamadı veya seçilen saatte alınış yok (Tur sor sat ise uyarıyı dikkate almayınız ...)'
              });
              return;
            }

            const tour = results[0];
            
            // Turda veya pickup'ta durdurma var mı kontrol ediyoruz
            const hasTourDates = tour.start_date !== null && tour.end_date !== null;
            const hasPickupDates = tour.start_pickup_date !== null && tour.end_pickup_date !== null;
            const isPeriodActive = tour.period_active === 1;
            const isAvailable = tour.is_active === 1 && !hasTourDates && !hasPickupDates && isPeriodActive;
            
            let message;
            if (!isAvailable) {
              if (tour.is_active !== 1) {
                message = 'Tur aktif değil';
              } else if (!isPeriodActive) {
                message = 'Seçilen saat aktif değil';
              } else if (hasTourDates) {
                message = 'Turda durdurma var';
              } else if (hasPickupDates) {
                message = `${ticket.time} saatli alınış için durdurma var`;
                
                // Pickup tarihlerini yan yana ekleyelim
                let dateInfo = '';
                if (tour.start_pickup_date) {
                  dateInfo += `Başlangıç: ${new Date(tour.start_pickup_date).toLocaleDateString('tr-TR')}`;
                }
                if (tour.end_pickup_date) {
                  dateInfo += dateInfo ? ', ' : '';
                  dateInfo += `Bitiş: ${new Date(tour.end_pickup_date).toLocaleDateString('tr-TR')}`;
                }
                
                if (dateInfo) {
                  message += `${dateInfo}`;
                }
              }
            } else {
              message = 'Tur müsait';
            }
            
            resolve({
              tourName: ticket.tourName,
              available: isAvailable,
              message: message,
              startDate: tour.start_date,
              endDate: tour.end_date,
              startPickupDate: tour.start_pickup_date,
              endPickupDate: tour.end_pickup_date
            });
          });
        });
      });

      const results = await Promise.all(checkPromises);
      res.json({
        success: true,
        results
      });

    } catch (error) {
      console.error('Tur kontrolü sırasında hata:', error);
      res.status(500).json({
        success: false,
        message: 'Tur kontrolü sırasında bir hata oluştu',
        error: error.message
      });
    }
  });

  return router;
}; 