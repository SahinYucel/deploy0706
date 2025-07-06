const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { generateTicketsPDF } = require('../services/pdfService');

module.exports = (db) => {
  // Provider login
  router.post('/login', async (req, res) => {
    try {
      const { companyRef, password } = req.body;

      const findQuery = `
        SELECT *, TIME_FORMAT(entry_time, '%H:%i') as entry_time
        FROM agencyprovider 
        WHERE companyRef = ? AND password = ? AND status = 1
      `;

      db.query(findQuery, [companyRef, password], (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (results.length === 0) {
          return res.status(401).json({ error: 'Hesabınız aktif değil veya bilgileriniz hatalı' });
        }

        const provider = results[0];
        const entryTime = provider.entry_time; // "HH:mm" formatında

        // Şu anki saat ve dakikayı al
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // entry_time'ı parçala
        const [entryHour, entryMinute] = entryTime.split(':').map(Number);

        // Tüm zamanları dakika cinsinden hesapla
        const currentTimeInMinutes = currentHour * 60 + currentMinute;
        const entryTimeInMinutes = entryHour * 60 + entryMinute;

        // Giriş saatinden sonra giriş yapılabilir
        const canLogin = currentTimeInMinutes >= entryTimeInMinutes;

        if (!canLogin) {
          return res.status(403).json({ 
            error: `Giriş saatinden önce rezervasyonlar hazır değil. Giriş saati: ${entryTime}` 
          });
        }

        // Login başarılı
        res.json({ 
          success: true, 
          providerRef: provider.companyRef 
        });
      });
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Provider'a ait rezervasyonları getir
  router.get('/reservations/:providerRef', async (req, res) => {
    try {
      const { providerRef } = req.params;
      
      // Yarının tarihini hesapla (YYYY-MM-DD formatında)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDate = tomorrow.toISOString().split('T')[0];
      
      const query = `
        SELECT 
          r.id as reservation_id,
          r.provider_status,
          r.guide_status,
          r.customer_name,
          r.phone,
          r.tour_name,
          r.date,
          r.time,
          r.adult_count,
          r.child_count,
          r.free_count,
          r.hotel_name,
          r.room_number,
          r.guide_name,
          r.guide_phone,
          r.ticket_no,
          r.rest_amount,
          r.description,
          r.ticket_options
        FROM reservation_approve r
        WHERE r.provider_ref = ? 
        AND r.show_status = 1
        AND DATE(r.date) = ?
        ORDER BY r.time ASC
      `;

      db.query(query, [providerRef, tomorrowDate], (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error: ' + err.message });
        }

        const formattedResults = results.map(row => ({
          _id: row.reservation_id,
          customerName: row.customer_name,
          phone: row.phone,
          tourName: row.tour_name,
          date: row.date,
          time: row.time,
          pax: {
            adult: row.adult_count || 0,
            child: row.child_count || 0,
            free: row.free_count || 0,
            total: (row.adult_count || 0) + (row.child_count || 0) + (row.free_count || 0)
          },
          hotel: row.hotel_name,
          roomNumber: row.room_number,
          guide: {
            name: row.guide_name,
            phone: row.guide_phone
          },
          ticketNumber: row.ticket_no,
          restaurant: row.rest_amount,
          notes: row.description,
          ticket_options: row.ticket_options,
          providerStatus: parseInt(row.provider_status || 0),
          guideStatus: parseInt(row.guide_status || 0)
        }));

        res.json(formattedResults);
      });
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
  });

  // Provider veya guide status'unu güncelle
  router.patch('/:reservationId/:type/status', async (req, res) => {
    try {
      const { reservationId, type } = req.params;
      const { status } = req.body;

      // status 0 veya 1 olmalı
      if (![0, 1].includes(parseInt(status))) {
        return res.status(400).json({ error: 'Invalid status value' });
      }

      // type provider veya guide olmalı
      if (!['provider', 'guide'].includes(type)) {
        return res.status(400).json({ error: 'Invalid type' });
      }

      const columnName = type === 'provider' ? 'provider_status' : 'guide_status';

      // Debug için sorguyu logla
      console.log('Updating status:', {
        reservationId,
        type,
        status,
        columnName
      });

      const query = `
        UPDATE reservation_approve 
        SET ${columnName} = ?
        WHERE id = ?
      `;

      db.query(query, [parseInt(status), parseInt(reservationId)], (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ 
            error: 'Database error',
            details: err.message 
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ 
            error: 'Reservation not found',
            details: `No reservation found with ID: ${reservationId}` 
          });
        }

        console.log('Update result:', result);
        res.json({ 
          message: 'Status updated successfully',
          type,
          newStatus: status
        });
      });
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        details: error.message 
      });
    }
  });

  // Saat güncelleme endpoint'i
  router.patch('/update-time/:ticketNo', async (req, res) => {
    const { ticketNo } = req.params;
    const { time } = req.body;

    if (!time) {
      return res.status(400).json({
        success: false,
        message: 'Saat bilgisi gereklidir'
      });
    }

    try {
      // Hem saati hem de onay durumlarını güncelle
      const updateApproveQuery = `
        UPDATE reservation_approve 
        SET time = ?,
            provider_status = 0,
            guide_status = 0
        WHERE ticket_no = ?
      `;
      await db.promise().query(updateApproveQuery, [time, ticketNo]);

      // reservation_tickets tablosunu güncelle
      const updateTicketsQuery = `
        UPDATE reservation_tickets 
        SET time = ?
        WHERE ticket_number = ?
      `;
      await db.promise().query(updateTicketsQuery, [time, ticketNo]);

      res.json({
        success: true,
        message: 'Saat ve onay durumları başarıyla güncellendi'
      });

    } catch (error) {
      console.error('Güncelleme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Güncelleme sırasında bir hata oluştu',
        error: error.message
      });
    }
  });

  // PDF oluşturma ve indirme endpoint'i
  router.get('/download-pdf/:providerRef', async (req, res) => {
    try {
      const { providerRef } = req.params;
      const { tour } = req.query; // Tour parametresini al
      
      // Yarının tarihini hesapla
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDate = tomorrow.toISOString().split('T')[0];
      
      // Rezervasyonları getir
      let query = `
        SELECT 
          r.*,
          r.ticket_no as ticket_number,
          r.customer_name as customerName,
          r.hotel_name as hotelName,
          r.room_number as roomNumber,
          r.tour_name as tourName,
          DATE_FORMAT(r.date, '%d.%m.%Y') as formattedDate,
          r.adult_count as adultCount,
          r.child_count as childCount,
          r.free_count as freeCount,
          r.guide_name as guideName,
          r.guide_phone as guidePhone,
          r.description as notes,
          r.provider_status as status,
          r.rest_amount as restAmount,
          r.ticket_options,
          r.description
        FROM reservation_approve r
        WHERE r.provider_ref = ? 
        AND r.show_status = 1
        AND DATE(r.date) = ?
      `;

      const queryParams = [providerRef, tomorrowDate];

      // Eğer tour parametresi varsa ve 'all' değilse, filtreleme ekle
      if (tour && tour !== 'all') {
        query += ` AND r.tour_name = ?`;
        queryParams.push(tour);
      }

      query += ` ORDER BY r.tour_name, r.time ASC`;

      const [tickets] = await db.promise().query(query, queryParams);

      if (tickets.length === 0) {
        return res.status(404).json({ 
          error: 'Bu tarih için rezervasyon bulunamadı'
        });
      }

      // Turları grupla
      const tourGroups = tickets.reduce((groups, ticket) => {
        const tourName = ticket.tourName;
        if (!groups[tourName]) {
          groups[tourName] = [];
        }
        groups[tourName].push({
          ...ticket,
          date: ticket.formattedDate,
          pax: {
            adult: ticket.adultCount || 0,
            child: ticket.childCount || 0,
            free: ticket.freeCount || 0,
            total: (ticket.adultCount || 0) + (ticket.childCount || 0) + (ticket.freeCount || 0)
          },
          guide: {
            name: ticket.guideName,
            phone: ticket.guidePhone
          }
        });
        return groups;
      }, {});

      // Temp klasörü oluştur
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Font yollarını tanımla
      const FONT_PATH = path.join(__dirname, '../fonts/Roboto-Regular.ttf');
      const FONT_BOLD_PATH = path.join(__dirname, '../fonts/Roboto-Bold.ttf');

      // PDF dosyası oluştur
      const pdfDoc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        font: FONT_PATH // Varsayılan font olarak Roboto kullan
      });

      // Fontları register et
      pdfDoc.registerFont('Roboto', FONT_PATH);
      pdfDoc.registerFont('Roboto-Bold', FONT_BOLD_PATH);

      const pdfFileName = `reservations_${tomorrow.toLocaleDateString('tr-TR').replace(/\./g, '-')}.pdf`;
      const pdfPath = path.join(tempDir, pdfFileName);
      const pdfStream = fs.createWriteStream(pdfPath);

      pdfDoc.pipe(pdfStream);

      // Her tur grubu için ayrı sayfa oluştur
      let firstPage = true;
      for (const [tourName, tourTickets] of Object.entries(tourGroups)) {
        if (!firstPage) {
          pdfDoc.addPage();
        }
        firstPage = false;

        // Tur başlığı ve tarih - Bold font kullan
        pdfDoc
          .fontSize(16)
          .font('Roboto-Bold')
          .text(`${tourName} - ${tourTickets[0].date}`, { align: 'center' })
          .moveDown();

        // Tablo başlıkları direkt başlasın
        const tableTop = pdfDoc.y;
        const colWidths = {
          time: 35,      // 40'tan 35'e düşürdük
          name: 60,      // 70'ten 60'a düşürdük
          hotel: 60,     // 70'ten 60'a düşürdük
          room: 30,      // 35'ten 30'a düşürdük
          adult: 20,     // 25'ten 20'ye düşürdük
          child: 20,     // 25'ten 20'ye düşürdük
          free: 20,      // 25'ten 20'ye düşürdük
          guide: 50,     // 55'ten 50'ye düşürdük
          ticket: 50,    // 55'ten 50'ye düşürdük
          options: 55,   // 65'ten 55'e düşürdük
          rest: 40,      // 45'ten 40'a düşürdük
          notes: 75      // 85'ten 75'e düşürdük
        };

        // Tablonun toplam genişliği
        const tableWidth = Object.values(colWidths).reduce((sum, width) => sum + width, 0);
        const tableStart = 40;  // Sol kenar boşluğu
        const tableEnd = tableStart + tableWidth;

        // Başlıklar sıralaması
        let currentX = tableStart;
        pdfDoc
          .fontSize(10)
          .font('Roboto-Bold');

        // Başlıkları yaz
        pdfDoc.text('Saat', currentX, tableTop, { width: colWidths.time, align: 'center' });
        currentX += colWidths.time;
        pdfDoc.text('Müşteri', currentX, tableTop, { width: colWidths.name, align: 'center' });
        currentX += colWidths.name;
        pdfDoc.text('Otel', currentX, tableTop, { width: colWidths.hotel, align: 'center' });
        currentX += colWidths.hotel;
        pdfDoc.text('Oda', currentX, tableTop, { width: colWidths.room, align: 'center' });
        currentX += colWidths.room;
        pdfDoc.text('A', currentX, tableTop, { width: colWidths.adult, align: 'center' });
        currentX += colWidths.adult;
        pdfDoc.text('C', currentX, tableTop, { width: colWidths.child, align: 'center' });
        currentX += colWidths.child;
        pdfDoc.text('F', currentX, tableTop, { width: colWidths.free, align: 'center' });
        currentX += colWidths.free;
        pdfDoc.text('Rehber', currentX, tableTop, { width: colWidths.guide, align: 'center' });
        currentX += colWidths.guide;
        pdfDoc.text('Bilet No', currentX, tableTop, { width: colWidths.ticket, align: 'center' });
        currentX += colWidths.ticket;
        pdfDoc.text('Opsiyon', currentX, tableTop, { width: colWidths.options, align: 'center' });
        currentX += colWidths.options;
        pdfDoc.text('Rest', currentX, tableTop, { width: colWidths.rest, align: 'center' });
        currentX += colWidths.rest;
        pdfDoc.text('Not', currentX, tableTop, { width: colWidths.notes, align: 'center' });

        // Rezervasyonları listele
        let yPosition = tableTop + 20;
        pdfDoc.fontSize(9).font('Roboto');

        // Tüm biletler için tek üst çizgi
        pdfDoc
          .moveTo(tableStart, yPosition - 2)
          .lineTo(tableEnd, yPosition - 2)
          .strokeColor('#000000')
          .lineWidth(0.5)
          .stroke();

        for (const ticket of tourTickets) {
          if (yPosition > 700) {
            pdfDoc.addPage();
            yPosition = 50;
            
            // Yeni sayfada üst çizgi
            pdfDoc
              .moveTo(tableStart, yPosition - 2)
              .lineTo(tableEnd, yPosition - 2)
              .strokeColor('#000000')
              .lineWidth(0.5)
              .stroke();
          }

          currentX = tableStart;  // Her satır için x'i sıfırla
          
          // İçerikleri yaz
          pdfDoc.text(ticket.time || '', currentX, yPosition, { 
            width: colWidths.time, 
            align: 'center' 
          });
          currentX += colWidths.time;

          pdfDoc.text(ticket.customerName || '', currentX, yPosition, { 
            width: colWidths.name, 
            align: 'center' 
          });
          currentX += colWidths.name;

          // Otel sütunu
          const hotelHeight = pdfDoc.heightOfString(ticket.hotelName || '', {
            width: colWidths.hotel - 5,
            align: 'center'
          });
          pdfDoc.text(ticket.hotelName || '', currentX, yPosition, {
            width: colWidths.hotel - 5,
            align: 'center'
          });
          currentX += colWidths.hotel;

          // Oda sütunu
          const roomHeight = pdfDoc.heightOfString(ticket.roomNumber || '', {
            width: colWidths.room - 5,
            align: 'center'
          });
          pdfDoc.text(ticket.roomNumber || '', currentX, yPosition, {
            width: colWidths.room - 5,
            align: 'center'
          });
          currentX += colWidths.room;

          // Yetişkin sütunu
          pdfDoc.text(ticket.pax.adult.toString() || '0', currentX, yPosition, {
            width: colWidths.adult - 5,
            align: 'center'
          });
          currentX += colWidths.adult;

          // Çocuk sütunu
          pdfDoc.text(ticket.pax.child.toString() || '0', currentX, yPosition, {
            width: colWidths.child - 5,
            align: 'center'
          });
          currentX += colWidths.child;

          // Ücretsiz sütunu
          pdfDoc.text(ticket.pax.free.toString() || '0', currentX, yPosition, {
            width: colWidths.free - 5,
            align: 'center'
          });
          currentX += colWidths.free;

          // Rehber sütunu
          pdfDoc.text(ticket.guide.name || '', currentX, yPosition, {
            width: colWidths.guide - 5,
            align: 'center'
          });
          currentX += colWidths.guide;

          // Bilet No sütunu
          const ticketHeight = pdfDoc.heightOfString(ticket.ticket_number || '', {
            width: colWidths.ticket - 5,
            align: 'center'
          });
          pdfDoc.text(ticket.ticket_number || '', currentX, yPosition, {
            width: colWidths.ticket - 5,
            align: 'center'
          });
          currentX += colWidths.ticket;

          // Opsiyon sütunu
          const optionsHeight = pdfDoc.heightOfString(ticket.ticket_options || '', {
            width: colWidths.options - 5,
            align: 'center'
          });
          pdfDoc.text(ticket.ticket_options || '', currentX, yPosition, {
            width: colWidths.options - 5,
            align: 'center'
          });
          currentX += colWidths.options;

          // Rest sütunu
          const restHeight = pdfDoc.heightOfString(ticket.restAmount || '', {
            width: colWidths.rest - 5,
            align: 'center'
          });
          pdfDoc.text(ticket.restAmount || '', currentX, yPosition, {
            width: colWidths.rest - 5,
            align: 'center'
          });
          currentX += colWidths.rest;

          // Not sütunu
          const notesHeight = pdfDoc.heightOfString(ticket.notes || '', {
            width: colWidths.notes - 5,
            align: 'center'
          });
          pdfDoc.text(ticket.notes || '', currentX, yPosition, {
            width: colWidths.notes - 5,
            align: 'center'
          });

          // En yüksek sütun yüksekliğini bul
          let maxHeight = Math.max(
            pdfDoc.heightOfString(ticket.time || '', {
              width: colWidths.time - 5,
              align: 'center'
            }),
            pdfDoc.heightOfString(ticket.customerName || '', {
              width: colWidths.name - 5,
              align: 'center'
            }),
            hotelHeight,
            roomHeight,
            pdfDoc.heightOfString(ticket.pax.adult.toString() || '0', {
              width: colWidths.adult - 5,
              align: 'center'
            }),
            pdfDoc.heightOfString(ticket.pax.child.toString() || '0', {
              width: colWidths.child - 5,
              align: 'center'
            }),
            pdfDoc.heightOfString(ticket.pax.free.toString() || '0', {
              width: colWidths.free - 5,
              align: 'center'
            }),
            pdfDoc.heightOfString(ticket.guide.name || '', {
              width: colWidths.guide - 5,
              align: 'center'
            }),
            ticketHeight,
            optionsHeight,
            restHeight,
            notesHeight
          );

          // Bir sonraki satır için y pozisyonunu güncelle
          yPosition += maxHeight + 5;
        }

        // Tüm biletler için tek alt çizgi
        pdfDoc
          .moveTo(tableStart, yPosition - 2)
          .lineTo(tableEnd, yPosition - 2)
          .strokeColor('#000000')
          .lineWidth(0.5)
          .stroke();
      }

      pdfDoc.end();

      // PDF oluşturulunca gönder
      pdfStream.on('finish', () => {
        res.download(pdfPath, pdfFileName, (err) => {
          if (err) {
            console.error('PDF gönderme hatası:', err);
          }
          // Dosyayı sil
          fs.unlink(pdfPath, (unlinkErr) => {
            if (unlinkErr) console.error('PDF silme hatası:', unlinkErr);
          });
        });
      });

    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      res.status(500).json({ 
        error: 'PDF oluşturulurken bir hata oluştu',
        details: error.message 
      });
    }
  });

  // Provider data endpoint
  router.get('/provider-data/:providerRef', async (req, res) => {
    try {
      const { providerRef } = req.params;

      const query = `
        SELECT TIME_FORMAT(exit_time, '%H:%i') as exit_time
        FROM agencyprovider 
        WHERE companyRef = ?
      `;

      db.query(query, [providerRef], (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (results.length === 0) {
          return res.status(404).json({ error: 'Provider not found' });
        }

        res.json({ 
          exitTime: results[0].exit_time
        });
      });
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Exit time kontrol endpoint'i
  router.get('/check-exit-time/:providerRef', async (req, res) => {
    try {
      const { providerRef } = req.params;

      const query = `
        SELECT TIME_FORMAT(exit_time, '%H:%i') as exit_time
        FROM agencyprovider 
        WHERE companyRef = ?
      `;

      db.query(query, [providerRef], (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (results.length === 0) {
          return res.status(404).json({ error: 'Provider not found' });
        }

        const exitTime = results[0].exit_time;
        const [exitHour, exitMinute] = exitTime.split(':').map(Number);
        
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        const currentTimeInMinutes = currentHour * 60 + currentMinute;
        const exitTimeInMinutes = exitHour * 60 + exitMinute;
        
        res.json({ 
          canSave: currentTimeInMinutes <= exitTimeInMinutes,
          exitTime: exitTime
        });
      });
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  

  return router;
}; 