const express = require('express');
const router = express.Router();

module.exports = (db) => {
  router.post('/save', async (req, res) => {
    const connection = await db.promise();
    
    try {
      await connection.beginTransaction();

      // Veri kontrolü
      if (!Array.isArray(req.body) || req.body.length === 0) {
        throw new Error('Geçerli tur verisi bulunamadı');
      }

      const companyRef = req.body[0]?.mainTour?.company_ref;
      if (!companyRef) {
        throw new Error('Company reference is required');
      }

      // İlişkili tabloları temizle (sıralama önemli - foreign key constraints için)
      await connection.query('DELETE FROM tour_options WHERE tour_id IN (SELECT id FROM tours WHERE company_ref = ?)', [companyRef]);
      await connection.query('DELETE FROM tour_pickup_times WHERE tour_id IN (SELECT id FROM tours WHERE company_ref = ?)', [companyRef]);
      await connection.query('DELETE FROM tour_days WHERE tour_id IN (SELECT id FROM tours WHERE company_ref = ?)', [companyRef]);
      await connection.query('DELETE FROM tour_regions WHERE tour_id IN (SELECT id FROM tours WHERE company_ref = ?)', [companyRef]);
      
      // Ana tabloyu temizle
      await connection.query('DELETE FROM tours WHERE company_ref = ?', [companyRef]);

      // Ana turları topla
      const anaTurlar = new Set();
      const anaTurIds = new Map(); // tour_name -> id eşleştirmesi için

      // Önce ana turları topla
      for (const tourData of req.body) {
        const { mainTour } = tourData;
        if (mainTour.main_tour_name) {
          anaTurlar.add(mainTour.main_tour_name);
        }
      }

      // Mevcut ana turları getir
      const [existingMainTours] = await connection.query(
        'SELECT id, tour_name FROM main_tours WHERE company_ref = ?',
        [companyRef]
      );

      // Mevcut ana turları map'e ekle
      existingMainTours.forEach(tour => {
        anaTurIds.set(tour.tour_name, tour.id);
      });

      // Yeni ana turları kaydet
      for (const anaTurAdi of anaTurlar) {
        if (!anaTurIds.has(anaTurAdi)) {
          const [result] = await connection.query(
            'INSERT INTO main_tours (company_ref, tour_name) VALUES (?, ?)',
            [companyRef, anaTurAdi]
          );
          anaTurIds.set(anaTurAdi, result.insertId);
        }
      }

      // Turları kaydet
      for (const tourData of req.body) {
        const { mainTour, days, pickupTimes, options } = tourData;

        // Ana tur ID'sini bul
        const mainTourId = mainTour.main_tour_name ? anaTurIds.get(mainTour.main_tour_name) : null;

        const formatDate = (dateString) => {
          if (!dateString) return null;
          try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return null;

            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            return `${year}-${month}-${day}`;
          } catch (error) {
            return null;
          }
        };

        const insertQuery = `INSERT INTO tours (
          company_ref, tour_name, main_tour_id,
          operator, operator_id, 
          adult_price, child_price, guide_adult_price, guide_child_price, 
          is_active, priority, description, currency,
          start_date, end_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        // start_date ve end_date'i doğru şekilde formatla
        const tourStartDate = formatDate(mainTour.start_date);
        const tourEndDate = formatDate(mainTour.end_date);

        const insertValues = [
          mainTour.company_ref,
          mainTour.tour_name,
          mainTourId,
          mainTour.operator,
          mainTour.operator_id,
          parseFloat(mainTour.adult_price) || 0,
          parseFloat(mainTour.child_price) || 0,
          parseFloat(mainTour.guide_adult_price) || 0,
          parseFloat(mainTour.guide_child_price) || 0,
          mainTour.is_active === false ? 0 : 1,
          parseInt(mainTour.priority) || 0,
          mainTour.description || '',
          mainTour.currency || 'EUR',
          tourStartDate,
          tourEndDate
        ];

        const [tourResult] = await connection.query(insertQuery, insertValues);
        const tourId = tourResult.insertId;

        // Bölgeleri kaydet
        if (Array.isArray(mainTour.bolgeler) && mainTour.bolgeler.length > 0) {
          const validRegions = mainTour.bolgeler.filter(region => region.trim() !== '');
          const uniqueRegions = [...new Set(validRegions)];
          const regionValues = uniqueRegions.map(region => [tourId, mainTour.company_ref, region]);
          
          if (regionValues.length > 0) {
            await connection.query(
              'INSERT INTO tour_regions (tour_id, company_id, region_name) VALUES ?',
              [regionValues]
            );
          }
        }

        // Günleri kaydet
        if (Array.isArray(days)) {
          await connection.query(
            'DELETE FROM tour_days WHERE tour_id = ?',
            [tourId]
          );

          const validDays = days.filter(day => day >= 0 && day <= 7);
          const fullWeekDays = Array(7).fill(0).map((_, index) => {
            const dayNumber = index + 1;
            return validDays.includes(dayNumber) ? dayNumber : 0;
          });

          const dayValues = fullWeekDays.map(day => [tourId, day]);
          
          await connection.query(
            'INSERT INTO tour_days (tour_id, day_number) VALUES ?',
            [dayValues]
          );
        }

        // Kalkış zamanlarını kaydet
        if (Array.isArray(pickupTimes) && pickupTimes.length > 0) {
          const timeValues = pickupTimes.map(time => {
            const periodActive = time.isActive === false ? 0 : 1;
            const startPickupDate = formatDate(time.start_pickup_date);
            const endPickupDate = formatDate(time.end_pickup_date);

            return [
              tourId, 
              parseInt(time.company_id) || parseInt(companyRef),
              time.hour || '00',
              time.minute || '00',
              time.region || '',
              time.area || '',
              time.period || '1',
              periodActive,
              startPickupDate,
              endPickupDate
            ];
          });

          if (timeValues.length > 0) {
            try {
              await connection.query(
                `INSERT INTO tour_pickup_times 
                (tour_id, company_id, hour, minute, region, area, period, period_active, 
                 start_pickup_date, end_pickup_date) 
                VALUES ?`,
                [timeValues]
              );
            } catch (error) {
              console.error('Pickup zamanları kaydedilirken hata:', error);
              throw error;
            }
          }
        }

        // Seçenekleri kaydet
        if (Array.isArray(options) && options.length > 0) {
          const optionValues = options
            .filter(opt => opt.name || opt.option_name || opt.price)
            .map(opt => [
              tourId, 
              opt.option_name || opt.name || '',
              parseFloat(opt.price) || 0
            ]);

          if (optionValues.length > 0) {
            await connection.query(
              'INSERT INTO tour_options (tour_id, option_name, price) VALUES ?',
              [optionValues]
            );
          }
        }
      }

      await connection.commit();
      res.json({ 
        success: true, 
        message: 'Turlar başarıyla kaydedildi',
        savedCount: req.body.length
      });

    } catch (error) {
      await connection.rollback();
      res.status(500).json({
        success: false,
        message: 'Turlar kaydedilirken bir hata oluştu',
        error: error.message
      });
    }
  });

  // Turları getirme endpoint'i
  router.get('/:companyRef', async (req, res) => {
    const connection = await db.promise();
    try {
      const { companyRef } = req.params;

      const [tours] = await connection.query(
        `SELECT t.*, mt.tour_name as main_tour_name
         FROM tours t
         LEFT JOIN main_tours mt ON t.main_tour_id = mt.id
         WHERE t.company_ref = ?`,
        [companyRef]
      );

      const fullTours = await Promise.all(tours.map(async (tour) => {
        const [days] = await connection.query(
          'SELECT day_number FROM tour_days WHERE tour_id = ?',
          [tour.id]
        );

        const [pickupTimes] = await connection.query(
          'SELECT *, company_id, period_active as isActive, start_pickup_date, end_pickup_date FROM tour_pickup_times WHERE tour_id = ?',
          [tour.id]
        );

        const [options] = await connection.query(
          'SELECT * FROM tour_options WHERE tour_id = ?',
          [tour.id]
        );

        const [regions] = await connection.query(
          'SELECT region_name FROM tour_regions WHERE tour_id = ?',
          [tour.id]
        );

        return {
          mainTour: {
            id: tour.id,
            company_ref: tour.company_ref,
            tour_name: tour.tour_name,
            main_tour_name: tour.main_tour_name,
            operator: tour.operator,
            operator_id: tour.operator_id,
            adult_price: tour.adult_price,
            child_price: tour.child_price,
            guide_adult_price: tour.guide_adult_price,
            guide_child_price: tour.guide_child_price,
            is_active: tour.is_active === 1,
            priority: parseInt(tour.priority) || 0,
            bolgeler: regions.map(r => r.region_name),
            description: tour.description || '',
            currency: tour.currency || 'EUR',
            start_date: tour.start_date,
            end_date: tour.end_date
          },
          days: days.map(d => d.day_number),
          pickupTimes: pickupTimes.map(time => ({
            ...time,
            isActive: time.period_active === 1,
            stopSelling: time.start_pickup_date !== null || time.end_pickup_date !== null,
            stopSaleStartDate: time.start_pickup_date,
            stopSaleEndDate: time.end_pickup_date
          })),
          options
        };
      }));

      res.json({
        success: true,
        data: fullTours
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Turlar getirilirken bir hata oluştu',
        error: error.message
      });
    }
  });

  // Tur silme endpoint'i
  router.delete('/:tourId', async (req, res) => {
    const connection = await db.promise();
    try {
      const { tourId } = req.params;

      await connection.beginTransaction();

      const [tourInfo] = await connection.query(
        'SELECT main_tour_id FROM tours WHERE id = ?',
        [tourId]
      );

      const mainTourId = tourInfo[0]?.main_tour_id;

      await connection.query('DELETE FROM tour_regions WHERE tour_id = ?', [tourId]);
      await connection.query('DELETE FROM tour_days WHERE tour_id = ?', [tourId]);
      await connection.query('DELETE FROM tour_pickup_times WHERE tour_id = ?', [tourId]);
      await connection.query('DELETE FROM tour_options WHERE tour_id = ?', [tourId]);
      
      await connection.query('DELETE FROM tours WHERE id = ?', [tourId]);

      if (mainTourId) {
        const [remainingTours] = await connection.query(
          'SELECT COUNT(*) as count FROM tours WHERE main_tour_id = ?',
          [mainTourId]
        );

        if (remainingTours[0].count === 0) {
          await connection.query(
            'DELETE FROM main_tours WHERE id = ?',
            [mainTourId]
          );
        }
      }

      await connection.commit();

      res.json({
        success: true,
        message: 'Tur başarıyla silindi'
      });

    } catch (error) {
      await connection.rollback();
      res.status(500).json({
        success: false,
        message: 'Tur silinirken bir hata oluştu',
        error: error.message
      });
    }
  });

  // Rehber fiyatlarını reservation_tickets tablosunda güncelleme endpoint'i
  router.post('/update-guide-prices', async (req, res) => {
    const connection = await db.promise();
    try {
      const { companyRef } = req.body;

      if (!companyRef) {
        return res.status(400).json({
          success: false,
          message: 'Company reference is required'
        });
      }

      await connection.beginTransaction();

      // Önce mevcut turları ve rehber fiyatlarını al
      const [tours] = await connection.query(
        `SELECT tour_name, guide_adult_price, guide_child_price 
         FROM tours 
         WHERE company_ref = ?`,
        [companyRef]
      );

      let updatedCount = 0;
      let errorCount = 0;

      // Her tur için reservation_tickets tablosundaki ilgili kayıtları güncelle
      for (const tour of tours) {
        try {
          const [updateResult] = await connection.query(
            `UPDATE reservation_tickets 
             SET guide_adult_price = ?, guide_child_price = ?
             WHERE tour_name = ? AND 
                   (guide_adult_price != ? OR guide_child_price != ? OR 
                    guide_adult_price IS NULL OR guide_child_price IS NULL)`,
            [
              tour.guide_adult_price,
              tour.guide_child_price,
              tour.tour_name,
              tour.guide_adult_price,
              tour.guide_child_price
            ]
          );

          if (updateResult.affectedRows > 0) {
            updatedCount += updateResult.affectedRows;
            console.log(`Updated ${updateResult.affectedRows} tickets for tour: ${tour.tour_name}`);
          }
        } catch (error) {
          console.error(`Error updating tickets for tour ${tour.tour_name}:`, error);
          errorCount++;
        }
      }

      await connection.commit();

      res.json({
        success: true,
        message: `Rehber fiyatları başarıyla güncellendi`,
        updatedTickets: updatedCount,
        errorCount: errorCount,
        totalTours: tours.length
      });

    } catch (error) {
      await connection.rollback();
      console.error('Error updating guide prices:', error);
      res.status(500).json({
        success: false,
        message: 'Rehber fiyatları güncellenirken bir hata oluştu',
        error: error.message
      });
    }
  });

  return router;
}; 