const express = require('express');
const router = express.Router();

module.exports = (db) => {
  // Yeni rezervasyon oluştur
  router.post('/', async (req, res) => {
    try {
      const {
        customerInfo,
        tickets,
        cost,
        userData
      } = req.body;

      // userData'dan company_id'yi kontrol edelim
      if (!userData || !userData.companyId) {
        throw new Error('Şirket bilgisi bulunamadı');
      }

      const ticketCount = tickets.length;
      const fullPhoneNumber = `${customerInfo.phoneCode}${customerInfo.phone}`;

      // Tüm biletlerin toplam maliyetini hesapla
     

      const [reservationResult] = await db.promise().query(
        `INSERT INTO reservations 
        (customer_name, phone, room_number, hotel_name, ticket_count, 
         guide_name, commission_rate, status, company_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          customerInfo.name,
          fullPhoneNumber,
          customerInfo.roomNumber,
          customerInfo.hotelName,
          ticketCount,
          `${userData.name} ${userData.surname}`,
          userData.entitlement || 0,
          1,
          userData.companyId
        ]
      );

      const reservationId = reservationResult.insertId;

      // Ödeme yöntemlerini kaydet
      for (const payment of customerInfo.paymentMethods) {
        await db.promise().query(
          `INSERT INTO reservation_payments 
          (reservation_id, payment_type, amount, currency, rest_amount) 
          VALUES (?, ?, ?, ?, ?)`,
          [
            reservationId,
            payment.type,
            payment.amount,
            payment.currency,
            payment.rest || null
          ]
        );
      }

      // Biletleri kaydet
      for (const ticket of tickets) {
        // Debug için ticket objesini detaylı logla
        console.log('Saving ticket details:', {
          tourName: ticket.tourName,
          originalLength: ticket.tourName?.length,
          tourNameType: typeof ticket.tourName,
          fullTicket: JSON.stringify(ticket, null, 2)
        });

        // Rest tutarlarını hesapla
        let totalRestAmount = null;
        let restPayments = [];
        
        // En erken tarih ve saati olan bilet için rest tutarlarını ekle
        if (tickets.every(otherTicket => {
          const ticketDate = new Date(ticket.date.split('.').reverse().join('-') + 'T' + ticket.time);
          const otherDate = new Date(otherTicket.date.split('.').reverse().join('-') + 'T' + otherTicket.time);
          
          return (
            ticketDate < otherDate || 
            (ticketDate.getTime() === otherDate.getTime() && 
             (parseInt(ticket.ticket_no) < parseInt(otherTicket.ticket_no) || ticket === otherTicket))
          );
        }) && customerInfo.paymentMethods.length > 0) {
          restPayments = customerInfo.paymentMethods
            .filter(payment => payment.rest && payment.rest !== '0')
            .map(payment => ({
              type: payment.type,
              amount: payment.rest,
              currency: payment.currency
            }));
          
          if (restPayments.length > 0) {
            totalRestAmount = restPayments
              .map(payment => `${payment.amount} ${payment.currency}`)
              .join(',');
          }
        }

        // Tarihi MySQL formatına çevir
        const formatDate = (dateStr) => {
          const [day, month, year] = dateStr.split('.');
          return `${year}-${month}-${day}`;
        };

        // Veritabanı alanının maksimum uzunluğunu kontrol et
        const [tableInfo] = await db.promise().query(
          "SHOW COLUMNS FROM reservation_tickets WHERE Field = 'tour_name'"
        );
        console.log('Database tour_name field info:', tableInfo[0]);

        // Her bilet için toplam maliyeti hesapla
        

        const query = `
          INSERT INTO reservation_tickets 
          (reservation_id, tour_name, tour_group_name, adult_count, child_count, free_count, 
           adult_price, half_price, guide_adult_price, guide_child_price, currency, date, guide_ref, guide_name, provider_name, 
           provider_ref, comment, time, regions, status, cancellation_reason,
           ticket_number) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const [ticketResult] = await db.promise().query(
          query,
          [
            reservationId,
            ticket.tourName,
            ticket.tourGroup,
            ticket.counts.adult,
            ticket.counts.half,
            ticket.counts.free,
            Number(ticket.adultPrice) || null,
            Number(ticket.halfPrice) || null,
            Number(ticket.guideAdultPrice) || null,
            Number(ticket.guideChildPrice) || null,
            ticket.currency,
            formatDate(ticket.date),
            userData.code,
            `${userData.name} ${userData.surname}`,
            ticket.operator || null,
            ticket.operatorId || null,
            ticket.note,
            ticket.time,
            ticket.regions ? ticket.regions.join(',') : null,
            1, // default status
            null, // default cancellation_reason
            ticket.ticket_no
          ]
        );

        // Kaydedilen veriyi kontrol et
        const [savedTicket] = await db.promise().query(
          'SELECT tour_name FROM reservation_tickets WHERE id = ?',
          [ticketResult.insertId]
        );
        console.log('Saved tour_name:', savedTicket[0].tour_name);

        // Bilet opsiyonlarını kaydet
        if (ticket.options && ticket.options.length > 0) {
          for (const option of ticket.options) {
            await db.promise().query(
              `INSERT INTO ticket_options 
              (ticket_id, option_name, price) 
              VALUES (?, ?, ?)`,
              [ticketResult.insertId, option.name, option.price]
            );
          }
        }

        // Bilet rest tutarlarını yeni tabloya kaydet
        if (restPayments.length > 0) {
          for (const restPayment of restPayments) {
            await db.promise().query(
              `INSERT INTO ticket_rest_amount 
              (ticket_id, amount, currency) 
              VALUES (?, ?, ?)`,
              [
                ticketResult.insertId,
                restPayment.amount,
                restPayment.currency
              ]
            );
          }
        }

        await db.promise().query(
          `INSERT INTO reservation_approve 
          (reservation_id, adult_count, child_count, free_count, hotel_name, room_number, 
           date, time, ticket_no, customer_name, phone, description, 
           currency, guide_name, guide_ref, ticket_options, guide_phone, tour_name, provider_ref,
           rest_amount, tour_group_name) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            reservationId,
            ticket.counts.adult || 0,
            ticket.counts.half || 0,
            ticket.counts.free || 0,
            customerInfo.hotelName,
            customerInfo.roomNumber,
            formatDate(ticket.date),
            ticket.time,
            ticket.ticket_no,
            customerInfo.name,
            fullPhoneNumber,
            ticket.note,
            ticket.currency,
            userData.name,
            userData.code,
            ticket.options && ticket.options.length > 0 ? 
              ticket.options.map(option => option.name).join(',') : null,
            userData.phone || null,
            ticket.tourName || null,
            ticket.operatorId || null,
            totalRestAmount,
            ticket.tourGroup || null
          ]
        );
      }


      res.status(201).json({
        success: true,
        message: 'Rezervasyon başarıyla kaydedildi',
        reservationId: reservationResult.insertId
      });

    } catch (error) {
      console.error('Rezervasyon kayıt hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Rezervasyon kaydedilirken bir hata oluştu',
        error: error.message
      });
    }
  });

  router.get('/', async (req, res) => {
    try {
      const [rows] = await db.query(`
        SELECT 
          *,
          cost,
          description,
          main_comment,
          CASE  
            WHEN status = 0 THEN 'Beklemede'
            WHEN status = 1 THEN 'Onaylandı'
            WHEN status = 2 THEN 'İptal Edildi'
            ELSE 'Bilinmiyor'
          END as status_text 
        FROM reservations 
        ORDER BY id DESC
      `);
      
      res.json({
        success: true,
        data: rows
      });
    } catch (error) {
      console.error('Error fetching reservations:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching reservations',
        error: error.message
      });
    }
  });

  // Update reservation status
  router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
      // Start a transaction
      await db.promise().beginTransaction();

      // If status is 0, delete all related tickets first
      if (status === 0) {
        // Delete from ticket_options
        await db.promise().query(
          'DELETE to FROM ticket_options to ' +
          'INNER JOIN reservation_tickets rt ON to.ticket_id = rt.id ' +
          'WHERE rt.reservation_id = ?',
          [id]
        );

        // Delete from ticket_rest_amount
        await db.promise().query(
          'DELETE tra FROM ticket_rest_amount tra ' +
          'INNER JOIN reservation_tickets rt ON tra.ticket_id = rt.id ' +
          'WHERE rt.reservation_id = ?',
          [id]
        );

        // Delete from reservation_approve
        await db.promise().query(
          'DELETE FROM reservation_approve WHERE reservation_id = ?',
          [id]
        );

        // Delete from reservation_tickets
        await db.promise().query(
          'DELETE FROM reservation_tickets WHERE reservation_id = ?',
          [id]
        );
      }

      // Update reservation status
      await db.promise().query(
        'UPDATE reservations SET status = ? WHERE id = ?',
        [status, id]
      );

      // Commit the transaction
      await db.promise().commit();

      res.json({
        success: true,
        message: 'Rezervasyon durumu başarıyla güncellendi'
      });
    } catch (error) {
      // Rollback in case of error
      await db.promise().rollback();
      
      console.error('Rezervasyon güncelleme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Rezervasyon güncellenirken bir hata oluştu',
        error: error.message
      });
    }
  });

  // Get reservation approvals
  router.get('/approvals', async (req, res) => {
    try {
      const [rows] = await db.promise().query(`
        SELECT * FROM reservation_approve 
        ORDER BY created_at DESC
      `);
      
      res.json({
        success: true,
        data: rows
      });
    } catch (error) {
      console.error('Error fetching reservation approvals:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching reservation approvals',
        error: error.message
      });
    }
  });

  // Get approval details for a specific reservation
  router.get('/:id/approvals', async (req, res) => {
    const { id } = req.params;
    
    try {
      const [rows] = await db.promise().query(
        `SELECT * FROM reservation_approve WHERE reservation_id = ?`,
        [id]
      );
      
      res.json({
        success: true,
        data: rows
      });
    } catch (error) {
      console.error('Error fetching reservation approval details:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching reservation approval details',
        error: error.message
      });
    }
  });

  // Bilet numarasına göre onay detaylarını getir
  router.get('/approvals/ticket/:ticketNo', async (req, res) => {
    const { ticketNo } = req.params;
    
    try {
      const [rows] = await db.promise().query(
        `SELECT * FROM reservation_approve WHERE ticket_no = ?`,
        [ticketNo]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Bu bilet numarasına ait onay kaydı bulunamadı'
        });
      }
      
      res.json({
        success: true,
        data: rows[0]
      });
    } catch (error) {
      console.error('Error fetching ticket approval details:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching ticket approval details',
        error: error.message
      });
    }
  });

  return router;
};