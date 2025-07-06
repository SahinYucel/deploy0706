const express = require('express');
const router = express.Router();

module.exports = (db) => {
  const query = (sql, values) => {
    return new Promise((resolve, reject) => {
      db.query(sql, values, (error, results) => {
        if (error) reject(error);
        else resolve(results);
      });
    });
  };

  router.get('/', async (req, res) => {
    try {
      const { regions, tourGroup } = req.query;
      
      // Convert regions string array to array if it's a string
      const regionArray = Array.isArray(regions) ? regions : [regions];
      
      console.log('Fetching tours for regions:', regionArray);

      // Eğer tourGroup parametresi yoksa, sadece tour gruplarını getir
      if (!tourGroup) {
        const groupSql = `
          SELECT DISTINCT 
            mt.id,
            mt.tour_name,
            GROUP_CONCAT(DISTINCT r.region_name) as regions
          FROM main_tours mt
          JOIN tours t ON t.main_tour_id = mt.id
          JOIN tour_regions r ON t.id = r.tour_id
          WHERE r.region_name IN (?)
          AND t.is_active = 1
          GROUP BY mt.id, mt.tour_name
          ORDER BY mt.tour_name
        `;

        const groups = await query(groupSql, [regionArray]);
        return res.json({
          success: true,
          data: groups.map(group => ({
            id: group.id,
            name: group.tour_name,
            regions: group.regions.split(',')
          }))
        });
      }

      // Eğer tourGroup varsa, o gruba ait turları getir
      console.log('Filtering by tour group:', tourGroup);
      let sql = `
        SELECT 
          t.id,
          t.tour_name,
          t.company_ref,
          t.operator,
          t.operator_id,
          t.adult_price,
          t.child_price,
          t.is_active,
          t.created_at,
          t.updated_at,
          t.guide_adult_price,
          t.guide_child_price,
          t.description,
          t.priority,
          t.start_date,
          t.end_date,
          t.currency,
          CASE 
            WHEN t.start_date IS NULL THEN NULL 
            ELSE DATE_FORMAT(t.start_date, '%Y-%m-%d')
          END as formatted_start_date,
          CASE 
            WHEN t.end_date IS NULL THEN NULL 
            ELSE DATE_FORMAT(t.end_date, '%Y-%m-%d')
          END as formatted_end_date,
          GROUP_CONCAT(DISTINCT r.region_name) as regions,
          mt.tour_name as tour_group_name,
          mt.id as main_tour_id,
          GROUP_CONCAT(DISTINCT td.day_number) as active_days,
          GROUP_CONCAT(DISTINCT CONCAT(tpt.region, '|', tpt.area, '|', tpt.hour, '|', tpt.minute, '|', tpt.period_active, '|',
            COALESCE(DATE_FORMAT(tpt.start_pickup_date, '%Y-%m-%d'), ''), '|',
            COALESCE(DATE_FORMAT(tpt.end_pickup_date, '%Y-%m-%d'), '')
          )) as pickup_times,
          GROUP_CONCAT(DISTINCT CONCAT(opt.option_name, '|', opt.price)) as tour_options
        FROM tours t
        JOIN tour_regions r ON t.id = r.tour_id
        LEFT JOIN main_tours mt ON t.main_tour_id = mt.id
        LEFT JOIN tour_days td ON t.id = td.tour_id
        LEFT JOIN tour_pickup_times tpt ON t.id = tpt.tour_id
        LEFT JOIN tour_options opt ON t.id = opt.tour_id
        WHERE r.region_name IN (?)
        AND t.is_active = 1
        AND mt.tour_name = ?
        GROUP BY t.id, t.tour_name, t.company_ref, t.operator, t.operator_id, 
                 t.adult_price, t.child_price, t.is_active, t.created_at, t.updated_at,
                 t.guide_adult_price, t.guide_child_price, t.description, t.priority,
                 t.start_date, t.end_date,
                 mt.id, mt.tour_name
        ORDER BY 
          CASE 
            WHEN t.priority BETWEEN 1 AND 5 THEN t.priority
            ELSE 999
          END,
          t.tour_name
      `;

      const tours = await query(sql, [regionArray, tourGroup]);
      
      // Debug: İlk turun tarih verilerini kontrol et
      if (tours.length > 0) {
        console.log('First tour raw data:', {
          id: tours[0].id,
          tour_name: tours[0].tour_name,
          start_date: tours[0].start_date,
          end_date: tours[0].end_date,
          formatted_start_date: tours[0].formatted_start_date,
          formatted_end_date: tours[0].formatted_end_date
        });
      }

      const mappedTours = tours.map(tour => {
        // Parse pickup times
        const pickupTimes = tour.pickup_times ? 
          tour.pickup_times.split(',').map(pt => {
            const [region, area, hour, minute, period_active, start_pickup_date, end_pickup_date] = pt.split('|');
            return { 
              region, 
              area, 
              hour: parseInt(hour), 
              minute: parseInt(minute),
              period_active: parseInt(period_active) || 0,
              start_date: start_pickup_date || null,  // Eski alan için
              stop_date: end_pickup_date || null,     // Eski alan için
              start_pickup_date: start_pickup_date || null,  // Yeni alan
              end_pickup_date: end_pickup_date || null      // Yeni alan
            };
          }) : [];

        // Parse tour options
        const options = tour.tour_options ? 
          tour.tour_options.split(',').map(opt => {
            const [name, price] = opt.split('|');
            return {
              name,
              price: parseFloat(price) || 0
            };
          }) : [];

        const mappedTour = {
          id: tour.id,
          name: tour.priority === 1 ? `${tour.tour_name} (öncelikli)` : tour.tour_name,
          region: tour.regions ? tour.regions.split(',')[0] : '', // Get the first region for backward compatibility
          regions: tour.regions ? tour.regions.split(',') : [], // All regions
          date: tour.created_at,
          status: tour.is_active ? 'active' : 'inactive',
          adultPrice: tour.adult_price,
          childPrice: tour.child_price,
          guideAdultPrice: tour.guide_adult_price,
          guideChildPrice: tour.guide_child_price,
          operator: tour.operator || null,
          operatorId: tour.operator_id || null,
          tourGroup: tour.tour_group_name || null,
          mainTourId: tour.main_tour_id || null,
          activeDays: tour.active_days ? tour.active_days.split(',').map(Number) : [],
          pickupTimes: pickupTimes,
          priority: tour.priority || 999,
          description: tour.description || null,
          options: options,
          start_date: tour.formatted_start_date || null,
          end_date: tour.formatted_end_date || null,
          currency: tour.currency || 'EUR'
        };

        // Debug: Her turun tarih verilerini kontrol et
        console.log(`Tour ${tour.id} dates:`, {
          start_date: mappedTour.start_date,
          end_date: mappedTour.end_date
        });

        // Debug için kontrol edelim
        console.log('Mapped Tour:', mappedTour);

        return mappedTour;
      });

      res.json({
        success: true,
        data: mappedTours
      });

    } catch (error) {
      console.error('Error fetching guide tours:', error);
      res.status(500).json({
        success: false,
        message: 'Turlar getirilirken bir hata oluştu'
      });
    }
  });

  return router;
};
