const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { generateTicketsPDF } = require('../services/pdfService');
const axios = require('axios');
const FormData = require('form-data');

// Font dosyasının yolu
const FONT_PATH = path.join(__dirname, '../fonts/Roboto-Regular.ttf');

const RESERVATION_LIMIT = 100; // Son 100 rezervasyonu göster

module.exports = (db) => {
    // payment_type sütununu güncelle
    const alterTableQuery = `
        ALTER TABLE reservation_payments 
        MODIFY COLUMN payment_type VARCHAR(20)
    `;

    db.query(alterTableQuery, (error) => {
        if (error) {
            console.error('payment_type sütunu güncellenirken hata:', error);
        }
    });

    // Tüm rezervasyonları ve ticket'ları getir
    router.get('/', async (req, res) => {
        const query = `
            WITH RecentReservations AS (
                SELECT * FROM reservations 
                ORDER BY id DESC 
                LIMIT ${RESERVATION_LIMIT}
            ),
            PaymentTotals AS (
                SELECT 
                    reservation_id,
                    GROUP_CONCAT(
                        CASE 
                            WHEN currency = 'TRY' THEN CONCAT(amount, ' TRY')
                            WHEN currency = 'USD' THEN CONCAT(amount, ' USD')
                            WHEN currency = 'EUR' THEN CONCAT(amount, ' EUR')
                            WHEN currency = 'GBP' THEN CONCAT(amount, ' GBP')
                            ELSE CONCAT(amount, ' ', currency)
                        END
                        SEPARATOR ', '
                    ) as total_amount
                FROM reservation_payments
                GROUP BY reservation_id
            ),
            TicketRestAmounts AS (
                SELECT 
                    ticket_id,
                    GROUP_CONCAT(
                        CONCAT(amount, ' ', currency)
                        SEPARATOR ', '
                    ) as total_rest_amount
                FROM ticket_rest_amount
                GROUP BY ticket_id
            ),
            TicketOptions AS (
                SELECT 
                    ticket_id,
                    GROUP_CONCAT(
                        CONCAT(option_name, ': ', price)
                        SEPARATOR ', '
                    ) as ticket_options
                FROM ticket_options
                GROUP BY ticket_id
            )
            SELECT DISTINCT
                r.id as reservation_id,
                r.customer_name,
                r.phone,
                r.hotel_name,
                r.room_number,
                r.ticket_count,
                r.guide_name,
                r.commission_rate,
                r.main_comment,
                r.created_at,
                r.currency_rates,
                r.status,
                r.is_cost_guide,
                rt.id as ticket_id,
                rt.ticket_number,
                rt.tour_name,
                rt.tour_group_name,
                rt.adult_count,
                rt.child_count,
                rt.free_count,
                rt.currency,
                DATE_FORMAT(rt.date, '%Y-%m-%d') as date,
                rt.regions,
                rt.guide_ref,
                rt.guide_name as ticket_guide_name,
                rt.provider_name,
                rt.provider_ref,
                rt.time,
                rt.adult_price,
                rt.half_price,
                tra.total_rest_amount,
                rt.comment,
                rt.cancellation_reason,
                rt.status as ticket_status,
                pt.total_amount,
                t_opt.ticket_options
            FROM RecentReservations r
            LEFT JOIN reservation_tickets rt ON r.id = rt.reservation_id
            LEFT JOIN PaymentTotals pt ON r.id = pt.reservation_id
            LEFT JOIN TicketRestAmounts tra ON rt.id = tra.ticket_id
            LEFT JOIN TicketOptions t_opt ON rt.id = t_opt.ticket_id
            LEFT JOIN reservation_approve ra ON rt.ticket_number = ra.ticket_no
            ORDER BY r.id DESC
        `;

        db.query(query, (error, results) => {
            if (error) {
                console.error('Rezervasyon bilgileri alınırken hata:', error);
                return res.status(500).json({
                    error: 'Rezervasyon bilgileri alınamadı'
                });
            }

            // Rezervasyonları ve ticket'ları grupla
            const formattedResults = results.reduce((acc, curr) => {
                if (!acc[curr.reservation_id]) {
                    acc[curr.reservation_id] = {
                        id: curr.reservation_id,
                        customer_name: curr.customer_name,
                        phone: curr.phone,
                        hotel_name: curr.hotel_name,
                        room_number: curr.room_number,
                        ticket_count: curr.ticket_count,
                        guide_name: curr.guide_name,
                        commission_rate: curr.commission_rate,
                        main_comment: curr.main_comment,
                        created_at: curr.created_at,
                        total_amount: curr.total_amount,
                        currency_rates: curr.currency_rates,
                        status: curr.status === 1,
                        is_cost_guide: curr.is_cost_guide === 1,
                        tickets: []
                    };
                }

                if (curr.ticket_id) {
                    acc[curr.reservation_id].tickets.push({
                        id: curr.ticket_id,
                        ticket_number: curr.ticket_number,
                        tour_name: curr.tour_name,
                        tour_group_name: curr.tour_group_name,
                        adult_count: curr.adult_count,
                        child_count: curr.child_count,
                        free_count: curr.free_count,
                        currency: curr.currency,
                        date: curr.date,
                        regions: curr.regions,
                        guide_ref: curr.guide_ref,
                        guide_name: curr.ticket_guide_name,
                        provider_name: curr.provider_name,
                        provider_ref: curr.provider_ref,
                        time: curr.time,
                        adult_price: curr.adult_price,
                        half_price: curr.half_price,
                        total_rest_amount: curr.total_rest_amount,
                        comment: curr.comment,
                        cancellation_reason: curr.cancellation_reason,
                        status: curr.ticket_status,
                        ticket_options: curr.ticket_options
                    });
                }

                return acc;
            }, {});

            const sortedResults = Object.values(formattedResults).sort((a, b) => b.id - a.id);
            res.json(sortedResults);
        });
    });

    // Belirli bir şirkete ait rezervasyonları getir
    router.get('/company/:companyId', (req, res) => {
        const companyId = req.params.companyId;
        const query = `
            SELECT 
                id as reservation_id,
                customer_name,
                phone as customer_phone,
                room_number,
                hotel_name,
                total_amount,
                ticket_count,
                guide_name,
                commission_rate,
                status,
                currency_rates,
                company_id
            FROM reservations
            WHERE company_id = ?
            ORDER BY id DESC
        `;

        db.query(query, [companyId], (error, results) => {
            if (error) {
                console.error('Şirket rezervasyonları alınırken hata:', error);
                return res.status(500).json({
                    error: 'Şirket rezervasyonları alınamadı'
                });
            }
            res.json(results);
        });
    });

    // Rezervasyon güncelleme endpoint'i
    router.put('/:id', async (req, res) => {
        const reservationId = req.params.id;
        const updateFields = [
            'customer_name',
            'phone',
            'hotel_name',
            'room_number',
            'guide_name',
            'commission_rate',
            'main_comment',
            'status',
            'currency_rates'
        ];

        try {
            // Önce rezervasyonun is_cost_guide durumunu kontrol et
            const [reservation] = await db.promise().query(
                'SELECT is_cost_guide FROM reservations WHERE id = ?',
                [reservationId]
            );

            if (!reservation[0]) {
                return res.status(404).json({
                    error: 'Rezervasyon bulunamadı'
                });
            }

            if (reservation[0].is_cost_guide === 1) {
                return res.status(400).json({
                    error: 'Rezervasyon güncellenemez',
                    details: 'Bu rezervasyon için rehber tahsilatı yapılmış. Değişiklik yapabilmek için önce rehber tahsilatını iptal etmeniz gerekmektedir.',
                    code: 'GUIDE_PAYMENT_EXISTS'
                });
            }

            // Sadece gönderilen alanları güncelle
            const updates = [];
            const values = [];
            
            updateFields.forEach(field => {
                if (field in req.body) {
                    updates.push(`${field} = ?`);
                    values.push(field === 'status' ? (req.body[field] ? 1 : 0) : req.body[field]);
                }
            });

            // Eğer güncellenecek alan yoksa erken dön
            if (updates.length === 0) {
                return res.status(400).json({
                    error: 'Güncellenecek alan bulunamadı'
                });
            }

            // Transaction başlat
            await db.promise().beginTransaction();

            // Rezervasyonu güncelle
            const updateReservationQuery = `
                UPDATE reservations 
                SET ${updates.join(', ')}
                WHERE id = ?
            `;
            values.push(reservationId);

            const [updateResult] = await db.promise().query(updateReservationQuery, values);

            // Eğer status değiştiyse, reservation_tickets ve reservation_approve tablolarını güncelle
            if ('status' in req.body) {
                const newStatus = req.body.status ? 1 : 0;
                
                // reservation_tickets tablosunu güncelle
                await db.promise().query(
                    'UPDATE reservation_tickets SET status = ? WHERE reservation_id = ?',
                    [newStatus, reservationId]
                );

                // Ticket numaralarını al
                const [tickets] = await db.promise().query(
                    'SELECT ticket_number FROM reservation_tickets WHERE reservation_id = ?',
                    [reservationId]
                );

                // Her ticket için reservation_approve tablosunu güncelle
                if (tickets.length > 0) {
                    const ticketNumbers = tickets.map(t => t.ticket_number);
                    await db.promise().query(
                        'UPDATE reservation_approve SET show_status = ? WHERE ticket_no IN (?)',
                        [newStatus, ticketNumbers]
                    );
                }
            }

            // Eğer customer_name, phone, hotel_name, room_number veya guide_name güncellendiyse ve status 1 ise, reservation_approve tablosunu güncelle
            if (('customer_name' in req.body || 'phone' in req.body || 'hotel_name' in req.body || 'room_number' in req.body || 'guide_name' in req.body) && (!('status' in req.body) || req.body.status === true)) {
                const updateFields = [];
                const approveValues = [];

                if ('customer_name' in req.body) {
                    updateFields.push('customer_name = ?');
                    approveValues.push(req.body.customer_name);
                }
                if ('phone' in req.body) {
                    updateFields.push('phone = ?');
                    approveValues.push(req.body.phone);
                }
                if ('hotel_name' in req.body) {
                    updateFields.push('hotel_name = ?');
                    approveValues.push(req.body.hotel_name);
                }
                if ('room_number' in req.body) {
                    updateFields.push('room_number = ?');
                    approveValues.push(req.body.room_number);
                }
                if ('guide_name' in req.body) {
                    updateFields.push('guide_name = ?');
                    approveValues.push(req.body.guide_name);
                }

                const updateApproveQuery = `
                    UPDATE reservation_approve 
                    SET ${updateFields.join(', ')}
                    WHERE reservation_id = ?
                `;
                approveValues.push(reservationId);

                await db.promise().query(updateApproveQuery, approveValues);
            }

            // Eğer guide_name güncellendiyse, ilgili ticket'ları ve rehber telefonunu güncelle
            if ('guide_name' in req.body) {
                // Önce rehberin bilgilerini al
                const getGuideQuery = `
                    SELECT code, phone
                    FROM agencyguide 
                    WHERE CONCAT(name, ' ', surname) = ?
                `;
                const [guideResult] = await db.promise().query(getGuideQuery, [req.body.guide_name]);
                
                const guideRef = guideResult[0]?.code || null;
                const guidePhone = guideResult[0]?.phone || null;

                // Hem guide_name hem de guide_ref'i ticket'larda güncelle
                const updateTicketsQuery = `
                    UPDATE reservation_tickets 
                    SET guide_name = ?,
                        guide_ref = ?
                    WHERE reservation_id = ?
                `;
                await db.promise().query(updateTicketsQuery, [
                    req.body.guide_name,
                    guideRef,
                    reservationId
                ]);

                // Reservation_approve tablosunda guide_phone ve guide_ref'i güncelle
                const updateGuidePhoneQuery = `
                    UPDATE reservation_approve 
                    SET guide_phone = ?,
                        guide_ref = ?
                    WHERE reservation_id = ?
                `;
                await db.promise().query(updateGuidePhoneQuery, [guidePhone, guideRef, reservationId]);
            }

            // Transaction'ı tamamla
            await db.promise().commit();

            res.json({
                message: 'Rezervasyon ve ilgili kayıtlar başarıyla güncellendi',
                affectedRows: updateResult.affectedRows
            });

        } catch (error) {
            // Hata durumunda transaction'ı geri al
            await db.promise().rollback();
            console.error('Rezervasyon güncelleme hatası:', error);
            res.status(500).json({
                error: 'Rezervasyon güncellenirken bir hata oluştu'
            });
        }
    });

    // Bilet güncelleme endpoint'i
    router.put('/ticket/:id', async (req, res) => {
        const ticketId = req.params.id;
        
        try {
            // Önce biletin bağlı olduğu rezervasyonun is_cost_guide durumunu kontrol et
            const [reservation] = await db.promise().query(
                `SELECT r.is_cost_guide 
                FROM reservations r 
                INNER JOIN reservation_tickets rt ON r.id = rt.reservation_id 
                WHERE rt.id = ?`,
                [ticketId]
            );

            if (!reservation[0]) {
                return res.status(404).json({
                    error: 'Bilet bulunamadı'
                });
            }

            if (reservation[0].is_cost_guide === 1) {
                return res.status(400).json({
                    error: 'Bilet güncellenemez',
                    details: 'Bu bilet için rehber tahsilatı yapılmış. Değişiklik yapabilmek için önce rehber tahsilatını iptal etmeniz gerekmektedir.',
                    code: 'GUIDE_PAYMENT_EXISTS'
                });
            }

            // Debug için detaylı log ekleyelim
            console.log('Gelen bilet güncelleme verisi:', {
                ticketId,
                requestBody: req.body,
                adult_price: req.body.adult_price,
                half_price: req.body.half_price,
                status: req.body.status
            });

            const updateFields = {
                ticket_number: String,
                tour_name: String,
                tour_group_name: String,
                adult_count: Number,
                child_count: Number,
                free_count: Number,
                currency: String,
                date: value => value ? value.split('.').reverse().join('-') : null,
                regions: String,
                time: String,
                adult_price: value => parseFloat(value) || 0,
                half_price: value => parseFloat(value) || 0,
                guide_adult_price: value => parseFloat(value) || 0,
                guide_child_price: value => parseFloat(value) || 0,
                comment: String,
                cancellation_reason: String,
                status: value => value === true || value === 1 ? 1 : 0
            };

            await db.promise().beginTransaction();

            const updates = [];
            const values = [];
            
            Object.entries(updateFields).forEach(([field, type]) => {
                if (field in req.body && req.body[field] !== undefined) {
                    updates.push(`${field} = ?`);
                    const value = typeof type === 'function' ? 
                        type(req.body[field]) : 
                        type === Number ? parseFloat(req.body[field]) || 0 :
                        req.body[field];
                    values.push(value);
                }
            });

            // Values oluşturulduktan sonra detaylı kontrol için log
            console.log('Güncellenecek değerler:', {
                updates,
                values,
                priceFields: {
                    adult_price: values[updates.indexOf('adult_price = ?')],
                    half_price: values[updates.indexOf('half_price = ?')]
                }
            });

            // Eğer güncellenecek alan yoksa erken dön
            if (updates.length === 0) {
                return res.status(400).json({
                    error: 'Güncellenecek alan bulunamadı'
                });
            }

            // Önce ticket'ı güncelle
            const query = `
                UPDATE reservation_tickets 
                SET ${updates.join(', ')}
                WHERE id = ?
            `;
            values.push(ticketId);

            const [ticketResult] = await db.promise().query(query, values);

            // Reservation_approve tablosunu güncelle
            // Önce ticket'ın reservation_id'sini al
            const [ticketData] = await db.promise().query(
                'SELECT reservation_id FROM reservation_tickets WHERE id = ?',
                [ticketId]
            );

            if (ticketData[0]) {
                const reservationId = ticketData[0].reservation_id;
                const approveUpdates = [];
                const approveValues = [];

                // Güncellenen alanlara göre reservation_approve tablosunu güncelle
                if ('tour_name' in req.body) {
                    approveUpdates.push('tour_name = ?');
                    approveValues.push(req.body.tour_name);
                }
                if ('date' in req.body) {
                    approveUpdates.push('date = ?');
                    approveValues.push(req.body.date.split('.').reverse().join('-'));
                }
                if ('time' in req.body) {
                    approveUpdates.push('time = ?');
                    approveValues.push(req.body.time);
                }
                if ('adult_count' in req.body) {
                    approveUpdates.push('adult_count = ?');
                    approveValues.push(req.body.adult_count);
                }
                if ('child_count' in req.body) {
                    approveUpdates.push('child_count = ?');
                    approveValues.push(req.body.child_count);
                }
                if ('free_count' in req.body) {
                    approveUpdates.push('free_count = ?');
                    approveValues.push(req.body.free_count);
                }
                if ('ticket_number' in req.body) {
                    approveUpdates.push('ticket_no = ?');
                    approveValues.push(req.body.ticket_number);
                }
                if ('comment' in req.body) {
                    approveUpdates.push('description = ?');
                    approveValues.push(req.body.comment);
                }

                if (approveUpdates.length > 0) {
                    // Önce ticket_no'yu alalım
                    const [ticketNumberData] = await db.promise().query(
                        'SELECT ticket_number FROM reservation_tickets WHERE id = ?',
                        [ticketId]
                    );

                    if (ticketNumberData[0]?.ticket_number) {
                        const updateApproveQuery = `
                            UPDATE reservation_approve 
                            SET ${approveUpdates.join(', ')}
                            WHERE ticket_no = ?
                        `;
                        approveValues.push(ticketNumberData[0].ticket_number);

                        await db.promise().query(updateApproveQuery, approveValues);
                    }
                }
            }

            // Rest tutarlarını güncelle
            if ('total_rest_amount' in req.body) {
                // Önce mevcut rest tutarlarını sil
                await db.promise().query(
                    'DELETE FROM ticket_rest_amount WHERE ticket_id = ?',
                    [ticketId]
                );

                if (req.body.total_rest_amount) {
                    // Rest tutarlarını parse et ve ekle
                    const restAmounts = req.body.total_rest_amount.split(',').map(item => {
                        const [amount, currency] = item.trim().split(' ');
                        return [ticketId, parseFloat(amount), currency];
                    }).filter(([_, amount, currency]) => amount && currency); // Geçersiz değerleri filtrele

                    if (restAmounts.length > 0) {
                        // Rest tutarlarını ticket_rest_amount tablosuna ekle
                        await db.promise().query(
                            `INSERT INTO ticket_rest_amount 
                            (ticket_id, amount, currency) 
                            VALUES ?`,
                            [restAmounts]
                        );

                        // Ticket number'ı al ve reservation_approve tablosunu güncelle
                        const [ticketData] = await db.promise().query(
                            'SELECT ticket_number FROM reservation_tickets WHERE id = ?',
                            [ticketId]
                        );

                        if (ticketData[0]?.ticket_number) {
                            await db.promise().query(
                                `UPDATE reservation_approve 
                                SET rest_amount = ?
                                WHERE ticket_no = ?`,
                                [req.body.total_rest_amount, ticketData[0].ticket_number]
                            );
                        }
                    }
                } else {
                    // Rest tutarı silinmişse, reservation_approve tablosunda da sıfırla
                    const [ticketData] = await db.promise().query(
                        'SELECT ticket_number FROM reservation_tickets WHERE id = ?',
                        [ticketId]
                    );

                    if (ticketData[0]?.ticket_number) {
                        await db.promise().query(
                            `UPDATE reservation_approve 
                            SET rest_amount = NULL
                            WHERE ticket_no = ?`,
                            [ticketData[0].ticket_number]
                        );
                    }
                }
            }

            // Eğer status değiştiyse, reservation_approve tablosunu da güncelle
            if ('status' in req.body) {
                // Önce ticket_number'ı al
                const [ticketData] = await db.promise().query(
                    'SELECT ticket_number FROM reservation_tickets WHERE id = ?',
                    [ticketId]
                );

                if (ticketData[0]?.ticket_number) {
                    // reservation_approve tablosunda show_status'u güncelle
                    await db.promise().query(
                        'UPDATE reservation_approve SET show_status = ? WHERE ticket_no = ?',
                        [req.body.status, ticketData[0].ticket_number]
                    );
                }
            }

            // Transaction'ı tamamla
            await db.promise().commit();

            res.json({
                message: 'Bilet ve ilgili kayıtlar başarıyla güncellendi',
                affectedRows: ticketResult.affectedRows
            });

        } catch (error) {
            // Hata durumunda transaction'ı geri al
            await db.promise().rollback();
            console.error('Bilet güncelleme hatası:', error);
            res.status(500).json({
                error: 'Bilet güncellenirken bir hata oluştu',
                details: error.message
            });
        }
    });

    // Turları getirme endpoint'i
    router.get('/tours', (req, res) => {
        const query = `
            SELECT 
                t.id,
                t.tour_name as name,
                t.description,
                t.adult_price as price,
                t.currency
            FROM tours t
            ORDER BY t.tour_name ASC
        `;

        db.query(query, (error, results) => {
            if (error) {
                console.error('Turlar alınırken hata:', error);
                return res.status(500).json({
                    error: 'Turlar alınamadı'
                });
            }

            res.json(results);
        });
    });

    // Tur gruplarını getirme endpoint'i
    router.get('/tour-groups', (req, res) => {
        const query = `
            SELECT 
                mt.id,
                mt.tour_name as group_name,
                COUNT(t.id) as tour_count
            FROM main_tours mt
            LEFT JOIN tours t ON t.main_tour_id = mt.id
            GROUP BY mt.id, mt.tour_name
            ORDER BY mt.tour_name ASC
        `;

        db.query(query, (error, results) => {
            if (error) {
                console.error('Tur grupları alınırken hata:', error);
                return res.status(500).json({
                    error: 'Tur grupları alınamadı'
                });
            }

            res.json(results);
        });
    });

    // Seçilen gruba ait turları getirme endpoint'i
    router.get('/tours/:groupId', (req, res) => {
        const groupId = req.params.groupId;
        const query = `
            SELECT 
                t.id,
                t.tour_name as name,
                t.description,
                t.adult_price as price,
                t.currency
            FROM tours t
            WHERE t.main_tour_id = ?
            ORDER BY t.tour_name ASC
        `;

        db.query(query, [groupId], (error, results) => {
            if (error) {
                console.error('Grup turları alınırken hata:', error);
                return res.status(500).json({
                    error: 'Grup turları alınamadı'
                });
            }

            res.json(results);
        });
    });

    // Bölgeleri getirme endpoint'i
    router.get('/regions', (req, res) => {
        const query = `
            SELECT DISTINCT
                tr.region_name as name
            FROM tour_regions tr
            ORDER BY tr.region_name ASC
        `;

        db.query(query, (error, results) => {
            if (error) {
                console.error('Bölgeler alınırken hata:', error);
                return res.status(500).json({
                    error: 'Bölgeler alınamadı'
                });
            }

            res.json(results);
        });
    });

    // Seçilen bölgeye ait turları getirme endpoint'i
    router.get('/tours/by-region/:regionName', (req, res) => {
        const regionName = req.params.regionName;
        const query = `
            SELECT DISTINCT
                t.id,
                t.tour_name as name,
                t.description,
                t.adult_price as price,
                t.child_price,
                t.currency,
                t.operator as provider_name,
                t.operator_id as provider_ref,
                mt.id as main_tour_id,
                mt.tour_name as group_name
            FROM tours t
            INNER JOIN tour_regions tr ON tr.tour_id = t.id
            LEFT JOIN main_tours mt ON mt.id = t.main_tour_id
            WHERE tr.region_name = ?
            ORDER BY t.tour_name ASC
        `;

        db.query(query, [regionName], (error, results) => {
            if (error) {
                console.error('Bölge turları alınırken hata:', error);
                return res.status(500).json({
                    error: 'Bölge turları alınamadı'
                });
            }

            res.json(results);
        });
    });
    
    // Operatörleri getirme endpoint'i
    router.get('/operators', (req, res) => {
        const query = `
            SELECT 
                id,
                companyRef,
                company_name,
                phone_number,
                status,
                company_id
            FROM agencyprovider
            WHERE status = 1 AND phone_number IS NOT NULL AND phone_number != ''
            ORDER BY company_name ASC
        `;

        db.query(query, (error, results) => {
            if (error) {
                console.error('Operatörler alınırken hata:', error);
                return res.status(500).json({
                    error: 'Operatörler alınamadı'
                });
            }

            // Telefon numaralarını formatla (WhatsApp için)
            const formattedResults = results.map(operator => ({
                ...operator,
                phone_number: formatPhoneForWhatsApp(operator.phone_number)
            }));

            res.json(formattedResults);
        });
    });

    // Telefon numarasını WhatsApp formatına çeviren yardımcı fonksiyon
    function formatPhoneForWhatsApp(phone) {
        if (!phone) return '';
        
        // Tüm boşlukları ve özel karakterleri kaldır
        let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
        
        // Başındaki 0'ı kaldır
        if (cleaned.startsWith('0')) {
            cleaned = cleaned.substring(1);
        }
        
        // Başında + veya 90 yoksa 90 ekle
        if (!cleaned.startsWith('+90') && !cleaned.startsWith('90')) {
            cleaned = '90' + cleaned;
        }
        
        return cleaned;
    }

    // Operatör bilgilerini güncelleme endpoint'i
    router.put('/ticket/:ticketId/operator', async (req, res) => {
        const { ticketId } = req.params;
        const { provider_name, provider_ref } = req.body;

        try {
            // Transaction başlat
            await db.promise().beginTransaction();

            // Önce reservation_tickets tablosunu güncelle
            const updateTicketQuery = `
                UPDATE reservation_tickets 
                SET 
                    provider_name = ?,
                    provider_ref = ?
                WHERE id = ?
            `;

            await db.promise().query(updateTicketQuery, [provider_name, provider_ref, ticketId]);

            // Ticket number'ı al
            const [ticketData] = await db.promise().query(
                'SELECT ticket_number FROM reservation_tickets WHERE id = ?',
                [ticketId]
            );

            if (ticketData[0]?.ticket_number) {
                // reservation_approve tablosunu güncelle
                const updateApproveQuery = `
                    UPDATE reservation_approve 
                    SET provider_ref = ?
                    WHERE ticket_no = ?
                `;
                await db.promise().query(updateApproveQuery, [
                    provider_ref,
                    ticketData[0].ticket_number
                ]);
            }

            // Transaction'ı tamamla
            await db.promise().commit();

            res.json({
                message: 'Operatör bilgileri başarıyla güncellendi',
                success: true
            });

        } catch (error) {
            // Hata durumunda transaction'ı geri al
            await db.promise().rollback();
            console.error('Operatör bilgileri güncellenirken hata:', error);
            res.status(500).json({
                error: 'Operatör bilgileri güncellenemedi',
                details: error.message
            });
        }
    });

    // Rehberleri getirme endpoint'i rezervasyonlar için
    router.get('/reservation-guides', (req, res) => {
        const query = `
            SELECT 
                id,
                name,
                surname,
                is_active,
                nickname,
                entitlement
            FROM agencyguide
            WHERE is_active = 1
            ORDER BY name ASC
        `;

        db.query(query, (error, results) => {
            if (error) {
                console.error('Rehberler alınırken hata:', error);
                return res.status(500).json({
                    error: 'Rehberler alınamadı'
                });
            }

            const formattedResults = results.map(guide => ({
                id: guide.id,
                name: `${guide.name} ${guide.surname} `,
                commission_rate: guide.entitlement || 40
            }));

            res.json(formattedResults);
        });
    });

    // Belirli bir rezervasyonun ödemelerini getirme endpoint'i
    router.get('/:reservationId/payments', (req, res) => {
        const { reservationId } = req.params;
        const query = `
            SELECT 
                id,
                reservation_id,
                payment_type,
                amount,
                rest_amount,
                currency
            FROM reservation_payments
            WHERE reservation_id = ?
            ORDER BY id DESC
        `;

        db.query(query, [reservationId], (error, results) => {
            if (error) {
                console.error('Ödeme bilgileri alınırken hata:', error);
                return res.status(500).json({
                    error: 'Ödeme bilgileri alınamadı'
                });
            }

            res.json(results);
        });
    });

    // Yeni ödeme ekleme endpoint'i
    router.post('/:reservationId/payments', (req, res) => {
        const { reservationId } = req.params;
        const { payment_type, amount, rest_amount, currency } = req.body;

        const query = `
            INSERT INTO reservation_payments (
                reservation_id,
                payment_type,
                amount,
                rest_amount,
                currency
            ) VALUES (?, ?, ?, ?, ?)
        `;

        db.query(
            query,
            [reservationId, payment_type, amount, rest_amount, currency],
            (error, results) => {
                if (error) {
                    console.error('Ödeme kaydedilirken hata:', error);
                    return res.status(500).json({
                        error: 'Ödeme kaydedilemedi'
                    });
                }

                res.json({
                    message: 'Ödeme başarıyla kaydedildi',
                    paymentId: results.insertId
                });
            }
        );
    });

    // Ödeme güncelleme endpoint'i
    router.put('/:reservationId/payments/:paymentId', async (req, res) => {
        const { reservationId, paymentId } = req.params;
        const { amount, currency, payment_type } = req.body;

        try {
            // Önce rezervasyonun is_cost_guide durumunu kontrol et
            const [reservation] = await db.promise().query(
                'SELECT is_cost_guide FROM reservations WHERE id = ?',
                [reservationId]
            );

            if (!reservation[0]) {
                return res.status(404).json({
                    error: 'Rezervasyon bulunamadı'
                });
            }

            if (reservation[0].is_cost_guide === 1) {
                return res.status(400).json({
                    error: 'Ödeme güncellenemez',
                    details: 'Bu rezervasyon için rehber tahsilatı yapılmış. Değişiklik yapabilmek için önce rehber tahsilatını iptal etmeniz gerekmektedir.',
                    code: 'GUIDE_PAYMENT_EXISTS'
                });
            }

            const query = `
                UPDATE reservation_payments 
                SET amount = ?, currency = ?, payment_type = ?
                WHERE id = ? AND reservation_id = ?
            `;

            const [result] = await db.promise().query(
                query,
                [amount, currency, payment_type, paymentId, reservationId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    error: 'Ödeme bulunamadı veya güncellenemedi'
                });
            }

            res.json({
                message: 'Ödeme başarıyla güncellendi',
                affectedRows: result.affectedRows
            });

        } catch (error) {
            console.error('Ödeme güncellenirken hata:', error);
            res.status(500).json({
                error: 'Ödeme güncellenemedi',
                details: error.message
            });
        }
    });

    // Ödeme silme endpoint'i
    router.delete('/:reservationId/payments/:paymentId', async (req, res) => {
        const { reservationId, paymentId } = req.params;
        
        try {
            // Önce rezervasyonun is_cost_guide durumunu kontrol et
            const [reservation] = await db.promise().query(
                'SELECT is_cost_guide FROM reservations WHERE id = ?',
                [reservationId]
            );

            if (!reservation[0]) {
                return res.status(404).json({
                    error: 'Rezervasyon bulunamadı'
                });
            }

            if (reservation[0].is_cost_guide === 1) {
                return res.status(400).json({
                    error: 'Ödeme silinemez',
                    details: 'Bu rezervasyon için rehber tahsilatı yapılmış. Değişiklik yapabilmek için önce rehber tahsilatını iptal etmeniz gerekmektedir.',
                    code: 'GUIDE_PAYMENT_EXISTS'
                });
            }

            const query = `
                DELETE FROM reservation_payments 
                WHERE id = ? AND reservation_id = ?
            `;

            const [result] = await db.promise().query(query, [paymentId, reservationId]);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    error: 'Ödeme bulunamadı veya silinemedi'
                });
            }

            res.json({
                message: 'Ödeme başarıyla silindi',
                affectedRows: result.affectedRows
            });

        } catch (error) {
            console.error('Ödeme silinirken hata:', error);
            res.status(500).json({
                error: 'Ödeme silinirken bir hata oluştu',
                details: error.message
            });
        }
    });
        //ticketlara göre opsiyonları getirme endpointi
    router.get('/ticket/:ticketId/options', (req, res) => {
        const { ticketId } = req.params;
        console.log('Fetching options for ticket:', ticketId);

        const query = `
            SELECT 
                id,
                ticket_id,
                option_name,
                price
            FROM ticket_options
            WHERE ticket_id = ?
            ORDER BY id DESC
        `;

        db.query(query, [ticketId], (error, results) => {
            if (error) {
                console.error('Bilet opsiyonları alınırken hata:', error);
                return res.status(500).json({
                    error: 'Bilet opsiyonları alınamadı'
                });
            }

            console.log('Found options:', results);
            res.json(results);
        });
    });

    // Opsiyon ekleme endpoint'i
    router.post('/ticket/:ticketId/options', async (req, res) => {
        const { ticketId } = req.params;
        const { option_name, price } = req.body;

        try {
            // Önce biletin bağlı olduğu rezervasyonun is_cost_guide durumunu kontrol et
            const [reservation] = await db.promise().query(
                `SELECT r.is_cost_guide 
                FROM reservations r 
                INNER JOIN reservation_tickets rt ON r.id = rt.reservation_id 
                WHERE rt.id = ?`,
                [ticketId]
            );

            if (!reservation[0]) {
                return res.status(404).json({
                    error: 'Bilet bulunamadı'
                });
            }

            if (reservation[0].is_cost_guide === 1) {
                return res.status(400).json({
                    error: 'Opsiyon eklenemez',
                    details: 'Bu bilet için rehber tahsilatı yapılmış. Değişiklik yapabilmek için önce rehber tahsilatını iptal etmeniz gerekmektedir.',
                    code: 'GUIDE_PAYMENT_EXISTS'
                });
            }

            // Transaction başlat
            await db.promise().beginTransaction();

            // Önce ticket_options tablosuna ekle
            const insertOptionQuery = `
                INSERT INTO ticket_options (
                    ticket_id,
                    option_name,
                    price
                ) VALUES (?, ?, ?)
            `;

            const [optionResult] = await db.promise().query(
                insertOptionQuery,
                [ticketId, option_name, price]
            );

            // Ticket numarasını al
            const [ticketData] = await db.promise().query(
                'SELECT ticket_number FROM reservation_tickets WHERE id = ?',
                [ticketId]
            );

            if (ticketData[0]?.ticket_number) {
                // Mevcut options'ları al
                const [currentOptions] = await db.promise().query(
                    'SELECT option_name, price FROM ticket_options WHERE ticket_id = ?',
                    [ticketId]
                );

                // Options'ları string formatına çevir
                const optionsString = currentOptions
                    .map(opt => `${opt.option_name}: ${opt.price}`)
                    .join(', ');

                // Reservation_approve tablosunu güncelle
                const updateApproveQuery = `
                    UPDATE reservation_approve 
                    SET ticket_options = ?
                    WHERE ticket_no = ?
                `;

                await db.promise().query(updateApproveQuery, [
                    optionsString,
                    ticketData[0].ticket_number
                ]);
            }

            // Transaction'ı tamamla
            await db.promise().commit();

            res.json({
                message: 'Opsiyon başarıyla eklendi',
                optionId: optionResult.insertId
            });

        } catch (error) {
            // Hata durumunda transaction'ı geri al
            await db.promise().rollback();
            console.error('Opsiyon ekleme hatası:', error);
            res.status(500).json({
                error: 'Opsiyon eklenemedi'
            });
        }
    });

    // Opsiyon silme endpoint'i
    router.delete('/ticket/:ticketId/options/:optionId', async (req, res) => {
        const { ticketId, optionId } = req.params;

        try {
            // Önce biletin bağlı olduğu rezervasyonun is_cost_guide durumunu kontrol et
            const [reservation] = await db.promise().query(
                `SELECT r.is_cost_guide 
                FROM reservations r 
                INNER JOIN reservation_tickets rt ON r.id = rt.reservation_id 
                WHERE rt.id = ?`,
                [ticketId]
            );

            if (!reservation[0]) {
                return res.status(404).json({
                    error: 'Bilet bulunamadı'
                });
            }

            if (reservation[0].is_cost_guide === 1) {
                return res.status(400).json({
                    error: 'Opsiyon silinemez',
                    details: 'Bu bilet için rehber tahsilatı yapılmış. Değişiklik yapabilmek için önce rehber tahsilatını iptal etmeniz gerekmektedir.',
                    code: 'GUIDE_PAYMENT_EXISTS'
                });
            }

            // Transaction başlat
            await db.promise().beginTransaction();

            // Önce opsiyonu sil
            await db.promise().query(
                'DELETE FROM ticket_options WHERE id = ? AND ticket_id = ?',
                [optionId, ticketId]
            );

            // Ticket numarasını al
            const [ticketData] = await db.promise().query(
                'SELECT ticket_number FROM reservation_tickets WHERE id = ?',
                [ticketId]
            );

            if (ticketData[0]?.ticket_number) {
                // Kalan options'ları al
                const [remainingOptions] = await db.promise().query(
                    'SELECT option_name, price FROM ticket_options WHERE ticket_id = ?',
                    [ticketId]
                );

                // Options'ları string formatına çevir
                const optionsString = remainingOptions.length > 0 
                    ? remainingOptions
                        .map(opt => `${opt.option_name}: ${opt.price}`)
                        .join(', ')
                    : null;

                // Reservation_approve tablosunu güncelle
                const updateApproveQuery = `
                    UPDATE reservation_approve 
                    SET ticket_options = ?
                    WHERE ticket_no = ?
                `;

                await db.promise().query(updateApproveQuery, [
                    optionsString,
                    ticketData[0].ticket_number
                ]);
            }

            // Transaction'ı tamamla
            await db.promise().commit();

            res.json({
                message: 'Opsiyon başarıyla silindi'
            });

        } catch (error) {
            // Hata durumunda transaction'ı geri al
            await db.promise().rollback();
            console.error('Opsiyon silme hatası:', error);
            res.status(500).json({
                error: 'Opsiyon silinemedi'
            });
        }
    });

    // Filtreleme endpoint'i
    router.post('/filter', (req, res) => {
        const {
            customer_name,
            phone,
            hotel_name,
            room_number,
            guide_name,
            ticket_number,
            date,
            date_next,
            ticket_date,
            status
        } = req.body;

        let conditions = [];
        let params = [];

        // Şirket ID kontrolü - session'dan veya request'ten al
        const companyId = req.session?.companyId || req.user?.companyId;
        
        // Eğer companyId yoksa, tüm rezervasyonları getir (geliştirme amaçlı)
        // Gerçek ortamda bu kısım kaldırılabilir ve yetkilendirme hatası döndürülebilir
        if (companyId) {
            conditions.push('r.company_id = ?');
            params.push(companyId);
        } else {
            console.warn('Filtreleme yapılırken şirket ID bulunamadı. Tüm rezervasyonlar getirilecek.');
        }

        if (customer_name) {
            conditions.push('r.customer_name LIKE ?');
            params.push(`%${customer_name}%`);
        }

        if (phone) {
            conditions.push('r.phone LIKE ?');
            params.push(`%${phone}%`);
        }

        if (hotel_name) {
            conditions.push('r.hotel_name LIKE ?');
            params.push(`%${hotel_name}%`);
        }

        if (room_number) {
            conditions.push('r.room_number LIKE ?');
            params.push(`%${room_number}%`);
        }

        if (guide_name) {
            conditions.push('r.guide_name LIKE ?');
            params.push(`%${guide_name}%`);
        }

        if (date) {
            // Eğer date_next varsa, tarih aralığı olarak filtrele
            if (date_next) {
                conditions.push('(DATE(r.created_at) >= ? AND DATE(r.created_at) <= ?)');
                params.push(date, date_next);
            } else {
                // Sadece belirli bir tarih için filtrele
                conditions.push('DATE(r.created_at) = ?');
                params.push(date);
            }
        }

        if (status !== undefined) {
            conditions.push('r.status = ?');
            params.push(status ? 1 : 0);
        }

        if (ticket_number) {
            conditions.push('EXISTS (SELECT 1 FROM reservation_tickets rt WHERE rt.reservation_id = r.id AND rt.ticket_number LIKE ?)');
            params.push(`%${ticket_number}%`);
        }

        // Bilet tarihi için filtreleme
        if (ticket_date) {
            conditions.push('EXISTS (SELECT 1 FROM reservation_tickets rt WHERE rt.reservation_id = r.id AND DATE(rt.date) = ?)');
            params.push(ticket_date);
        }

        const whereClause = conditions.length > 0 
            ? `WHERE ${conditions.join(' AND ')}` 
            : '';

        const query = `
            WITH PaymentTotals AS (
                SELECT 
                    reservation_id,
                    GROUP_CONCAT(
                        CASE 
                            WHEN currency = 'TRY' THEN CONCAT(amount, ' TRY')
                            WHEN currency = 'USD' THEN CONCAT(amount, ' USD')
                            WHEN currency = 'EUR' THEN CONCAT(amount, ' EUR')
                            WHEN currency = 'GBP' THEN CONCAT(amount, ' GBP')
                            ELSE CONCAT(amount, ' ', currency)
                        END
                        SEPARATOR ', '
                    ) as total_amount
                FROM reservation_payments
                GROUP BY reservation_id
            ),
            TicketRestAmounts AS (
                SELECT 
                    ticket_id,
                    GROUP_CONCAT(
                        CONCAT(amount, ' ', currency)
                        SEPARATOR ', '
                    ) as total_rest_amount
                FROM ticket_rest_amount
                GROUP BY ticket_id
            ),
            TicketOptions AS (
                SELECT 
                    ticket_id,
                    GROUP_CONCAT(
                        CONCAT(option_name, ': ', price)
                        SEPARATOR ', '
                    ) as ticket_options
                FROM ticket_options
                GROUP BY ticket_id
            )
            SELECT DISTINCT
                r.id as reservation_id,
                r.customer_name,
                r.phone,
                r.hotel_name,
                r.room_number,
                r.ticket_count,
                r.guide_name,
                r.commission_rate,
                r.main_comment,
                r.created_at,
                r.currency_rates,
                r.status,
                r.is_cost_guide,
                rt.id as ticket_id,
                rt.ticket_number,
                rt.tour_name,
                rt.tour_group_name,
                rt.adult_count,
                rt.child_count,
                rt.free_count,
                rt.currency,
                DATE_FORMAT(rt.date, '%Y-%m-%d') as date,
                rt.regions,
                rt.guide_ref,
                rt.guide_name as ticket_guide_name,
                rt.provider_name,
                rt.provider_ref,
                rt.time,
                rt.adult_price,
                rt.half_price,
                tra.total_rest_amount,
                rt.comment,
                rt.cancellation_reason,
                rt.status as ticket_status,
                pt.total_amount,
                t_opt.ticket_options
            FROM reservations r
            LEFT JOIN reservation_tickets rt ON r.id = rt.reservation_id
            LEFT JOIN PaymentTotals pt ON r.id = pt.reservation_id
            LEFT JOIN TicketRestAmounts tra ON rt.id = tra.ticket_id
            LEFT JOIN TicketOptions t_opt ON rt.id = t_opt.ticket_id
            LEFT JOIN reservation_approve ra ON rt.ticket_number = ra.ticket_no
            ${whereClause}
            ORDER BY r.id DESC
            LIMIT ${RESERVATION_LIMIT}
        `;

        db.query(query, params, (error, results) => {
            if (error) {
                console.error('Rezervasyon filtreleme hatası:', error);
                return res.status(500).json({
                    error: 'Rezervasyonlar filtrelenirken bir hata oluştu'
                });
            }

            // Rezervasyonları ve ticket'ları grupla
            const formattedResults = results.reduce((acc, curr) => {
                if (!acc[curr.reservation_id]) {
                    acc[curr.reservation_id] = {
                        id: curr.reservation_id,
                        customer_name: curr.customer_name,
                        phone: curr.phone,
                        hotel_name: curr.hotel_name,
                        room_number: curr.room_number,
                        ticket_count: curr.ticket_count,
                        guide_name: curr.guide_name,
                        commission_rate: curr.commission_rate,
                        main_comment: curr.main_comment,
                        created_at: curr.created_at,
                        total_amount: curr.total_amount,
                        currency_rates: curr.currency_rates,
                        status: curr.status === 1,
                        is_cost_guide: curr.is_cost_guide === 1,
                        tickets: []
                    };
                }

                if (curr.ticket_id) {
                    acc[curr.reservation_id].tickets.push({
                        id: curr.ticket_id,
                        ticket_number: curr.ticket_number,
                        tour_name: curr.tour_name,
                        tour_group_name: curr.tour_group_name,
                        adult_count: curr.adult_count,
                        child_count: curr.child_count,
                        free_count: curr.free_count,
                        currency: curr.currency,
                        date: curr.date,
                        regions: curr.regions,
                        guide_ref: curr.guide_ref,
                        guide_name: curr.ticket_guide_name,
                        provider_name: curr.provider_name,
                        provider_ref: curr.provider_ref,
                        time: curr.time,
                        adult_price: curr.adult_price,
                        half_price: curr.half_price,
                        total_rest_amount: curr.total_rest_amount,
                        comment: curr.comment,
                        cancellation_reason: curr.cancellation_reason,
                        status: curr.ticket_status,
                        ticket_options: curr.ticket_options
                    });
                }

                return acc;
            }, {});

            // Object.values'u sıralayarak döndür
            const sortedResults = Object.values(formattedResults).sort((a, b) => b.id - a.id);
            res.json(sortedResults);
        });
    });

    router.get('/tickets', async (req, res) => {
        try {
            const { date } = req.query;
            
            let query = `
                SELECT 
                    rt.id,
                    rt.ticket_number,
                    r.customer_name as customerName,
                    r.phone,
                    r.hotel_name,
                    r.room_number,
                    rt.tour_name as tourName,
                    DATE_FORMAT(rt.date, '%Y-%m-%d') as date,
                    rt.adult_count,
                    rt.child_count,
                    rt.free_count,
                    rt.time,
                    rt.regions,
                    rt.guide_name,
                    rt.comment,
                    rt.status,
                    GROUP_CONCAT(DISTINCT t_opt.option_name) as ticket_options,
                    (
                        SELECT GROUP_CONCAT(
                            CONCAT(tra.amount, ' ', tra.currency)
                            SEPARATOR ', '
                        )
                        FROM ticket_rest_amount tra
                        WHERE tra.ticket_id = rt.id
                    ) as ticket_rest_amount
                FROM reservation_tickets rt
                LEFT JOIN reservations r ON r.id = rt.reservation_id
                LEFT JOIN ticket_options t_opt ON t_opt.ticket_id = rt.id
                LEFT JOIN ticket_rest_amount tra ON tra.ticket_id = rt.id
                WHERE rt.status = 1
            `;

            if (date) {
                query += ` AND DATE(rt.date) = ? `;
            }

            query += ` GROUP BY rt.id ORDER BY rt.id DESC`;

            const [tickets] = await db.promise().query(query, date ? [date] : []);
            res.json(tickets);

        } catch (error) {
            console.error('Biletler alınırken hata:', error);
            res.status(500).json({ error: 'Biletler alınamadı' });
        }
    });

    router.post('/tickets/generate-pdf', async (req, res) => {
        try {
            const { ticketIds } = req.body;
            
            if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
                return res.status(400).json({ error: 'Geçerli bilet ID\'leri gerekli' });
            }

            // Get tickets from database
            const query = `
                SELECT 
                    rt.id,
                    rt.ticket_number,
                    r.customer_name as customerName,
                    r.phone,
                    r.hotel_name,
                    r.room_number,
                    rt.tour_name as tourName,
                    DATE_FORMAT(rt.date, '%d.%m.%Y') as date,
                    rt.adult_count,
                    rt.child_count,
                    rt.free_count,
                    rt.time,
                    rt.regions,
                    rt.guide_name,
                    rt.comment,
                    rt.status,
                    GROUP_CONCAT(DISTINCT t_opt.option_name) as ticket_options,
                    (
                        SELECT GROUP_CONCAT(
                            CONCAT(tra.amount, ' ', tra.currency)
                            SEPARATOR ', '
                        )
                        FROM ticket_rest_amount tra
                        WHERE tra.ticket_id = rt.id
                    ) as ticket_rest_amount
                FROM reservation_tickets rt
                LEFT JOIN reservations r ON r.id = rt.reservation_id
                LEFT JOIN ticket_options t_opt ON t_opt.ticket_id = rt.id
                LEFT JOIN ticket_rest_amount tra ON tra.ticket_id = rt.id
                WHERE rt.id IN (?)
                GROUP BY rt.id
            `;

            const [tickets] = await db.promise().query(query, [ticketIds]);

            // Temp klasörü oluştur
            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir);
            }

            // Ana klasörü oluştur (tarih bazlı)
            const currentDate = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
            const mainDirName = `tours_${currentDate}`;
            const mainDirPath = path.join(tempDir, mainDirName);
            
            // Ana klasörü oluştur
            if (!fs.existsSync(mainDirPath)) {
                fs.mkdirSync(mainDirPath, { recursive: true });
            }

            // Turları grupla
            const tourGroups = tickets.reduce((groups, ticket) => {
                const tourName = ticket.tourName;
                if (!groups[tourName]) {
                    groups[tourName] = [];
                }
                groups[tourName].push(ticket);
                return groups;
            }, {});

            // Her tur grubu için klasör oluştur ve PDF'leri yerleştir
            const generatedPdfs = [];
            
            for (const [tourName, tourTickets] of Object.entries(tourGroups)) {
                const folderName = tourName
                    .replace(/[^a-zA-Z0-9]/g, '_')
                    .replace(/_+/g, '_')
                    .replace(/^_|_$/g, '');
                
                const tourDirPath = path.join(mainDirPath, folderName);
                if (!fs.existsSync(tourDirPath)) {
                    fs.mkdirSync(tourDirPath);
                }
                
                const fileName = `${folderName}_${tourTickets[0].date}.pdf`;
                const filePath = path.join(tourDirPath, fileName);
                
                // generateAndSavePDFs yerine generateTicketsPDF kullan
                await generateTicketsPDF(tourTickets, fileName, filePath);
                
                generatedPdfs.push({
                    tourName,
                    fileName,
                    filePath: filePath
                });
            }

            // ZIP dosyası oluştur
            const zipFileName = `tours_${currentDate}.zip`;
            const zipFilePath = path.join(tempDir, zipFileName);
            
            const output = fs.createWriteStream(zipFilePath);
            const archive = require('archiver')('zip', { zlib: { level: 9 } });
            
            archive.on('error', (err) => {
                throw err;
            });
            
            archive.pipe(output);
            
            // Tur klasörlerini ZIP dosyasına ekle (klasör yapısını koruyarak)
            for (const [tourName, tourTickets] of Object.entries(tourGroups)) {
                const folderName = tourName
                    .replace(/[^a-zA-Z0-9]/g, '_')
                    .replace(/_+/g, '_')
                    .replace(/^_|_$/g, '');
                
                const tourDirPath = path.join(mainDirPath, folderName);
                
                // Klasör içindeki PDF dosyalarını al
                if (fs.existsSync(tourDirPath)) {
                const pdfFiles = fs.readdirSync(tourDirPath);
                
                // Her PDF'i ilgili tur klasörüne ekle
                for (const pdfFile of pdfFiles) {
                    const pdfPath = path.join(tourDirPath, pdfFile);
                        if (fs.existsSync(pdfPath)) {
                    archive.file(pdfPath, { name: `${folderName}/${pdfFile}` });
                        }
                    }
                }
            }
            
            await archive.finalize();

            // Temizleme işlemi için timeout süresi
            const CLEANUP_TIMEOUT = 5000; // 5 saniye

            // ZIP dosyasını gönder ve temizle
            output.on('close', () => {
                res.set({
                    'Content-Type': 'application/zip',
                    'Content-Disposition': `attachment; filename="${zipFileName}"`,
                    'Content-Length': fs.statSync(zipFilePath).size
                });
                
                fs.createReadStream(zipFilePath).pipe(res);
                
                // Geçici dosyaları temizle
                setTimeout(() => {
                    // ZIP dosyasını sil
                    fs.unlink(zipFilePath, (err) => {
                        if (err) console.error('Zip dosyası silinemedi:', err);
                    });

                    // Temp klasörünü temizle
                    const deleteFolderRecursive = function(path) {
                        if (fs.existsSync(path)) {
                            fs.readdirSync(path).forEach((file) => {
                                const curPath = path + "/" + file;
                                if (fs.statSync(curPath).isDirectory()) {
                                    deleteFolderRecursive(curPath);
                                } else {
                                    fs.unlinkSync(curPath);
                                }
                            });
                            fs.rmdirSync(path);
                        }
                    };

                    deleteFolderRecursive(mainDirPath);
                }, CLEANUP_TIMEOUT);
            });

        } catch (error) {
            console.error('PDF oluşturma hatası:', error);
            res.status(500).json({ error: 'PDF oluşturulurken bir hata oluştu' });
        }
    });
    // New endpoint to send PDFs to WhatsApp
    router.post('/tickets/send-whatsapp', async (req, res) => {
        try {
            const { ticketIds, phoneNumber } = req.body;
            
            if (!ticketIds || !ticketIds.length || !phoneNumber) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Missing required parameters: ticketIds or phoneNumber' 
                });
            }

            // Fetch all tickets first with correct table references
            const query = `
                SELECT 
                    rt.id,
                    rt.ticket_number,
                    r.customer_name as customerName,
                    r.phone,
                    r.hotel_name,           /* Moved from rt to r */
                    r.room_number,          /* Moved from rt to r */
                    rt.tour_name as tourName,
                    DATE_FORMAT(rt.date, '%d.%m.%Y') as date,
                    rt.adult_count,
                    rt.child_count,
                    rt.free_count,
                    rt.time,
                    rt.regions,
                    rt.guide_name,
                    rt.comment,
                    rt.status,
                    (
                        SELECT GROUP_CONCAT(option_name SEPARATOR ', ')
                        FROM ticket_options
                        WHERE ticket_id = rt.id
                    ) as ticket_options,
                    (
                        SELECT GROUP_CONCAT(
                            CONCAT(amount, ' ', currency)
                            SEPARATOR ', '
                        )
                        FROM ticket_rest_amount
                        WHERE ticket_id = rt.id
                    ) as ticket_rest_amount
                FROM reservation_tickets rt
                LEFT JOIN reservations r ON r.id = rt.reservation_id
                WHERE rt.id IN (?)
            `;

            const [tickets] = await db.promise().query(query, [ticketIds]);

            // Group tickets by tour_name
            const ticketsByTour = tickets.reduce((groups, ticket) => {
                const tourName = ticket.tourName;
                if (!groups[tourName]) {
                    groups[tourName] = [];
                }
                groups[tourName].push(ticket);
                return groups;
            }, {});

            const results = [];
            
            // Generate and send PDF for each tour group
            for (const [tourName, tourTickets] of Object.entries(ticketsByTour)) {
                try {
                    // Create a unique filename for this tour's PDF
                    const pdfFileName = `tickets_${tourName.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`;
                    const pdfFilePath = path.join(__dirname, '../temp', pdfFileName);

                    // Ensure temp directory exists
                    const tempDir = path.join(__dirname, '../temp');
                    if (!fs.existsSync(tempDir)) {
                        fs.mkdirSync(tempDir);
                    }

                    // Generate PDF for this tour group
                    await generateTicketsPDF(tourTickets, pdfFileName, pdfFilePath);

                    // Upload PDF to WhatsApp
                    const uploadResult = await uploadDocument(pdfFilePath);

                    // Send PDF via WhatsApp
                    const sendResult = await sendMedia(uploadResult.id, phoneNumber);

                    // Clean up the temporary file
                    fs.unlinkSync(pdfFilePath);

                    results.push({
                        tourName,
                        success: true,
                        ticketCount: tourTickets.length,
                        message: `Successfully sent ${tourTickets.length} tickets for ${tourName}`
                    });

                    // Add a small delay between sends to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 1000));

                } catch (error) {
                    console.error(`Error processing tour ${tourName}:`, error);
                    results.push({
                        tourName,
                        success: false,
                        error: error.message
                    });
                }
            }

            res.json({
                success: true,
                message: 'WhatsApp sending process completed',
                results
            });

        } catch (error) {
            console.error('WhatsApp sending error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send WhatsApp messages',
                error: error.message
            });
        }
    });

    // Upload document to WhatsApp API
    async function uploadDocument(pdfPath) {
        try {
            const data = new FormData();
            data.append('messaging_product', 'whatsapp');
            data.append('file', fs.createReadStream(pdfPath), { 
                filename: `tickets_${Date.now()}.pdf`,
                contentType: 'application/pdf' 
            });
            data.append('type', 'document');

            const response = await axios({
                url: 'https://graph.facebook.com/v17.0/625653127293431/media',
                method: 'post',
                headers: {
                    'Authorization': `Bearer EAAQ92ylsCz0BOZBXDMTGfCLiRwt1gRceyRu0Xhx0qapPDGvhV8lAQ0WkJhG5yrvAJTAn5RU32zQPZAtjZBBjqUHBGyVqpuFdveJTZCyJ0hFwsdFpZCFrA2gdjvw6b3ZAXuG87MRaaPK5UT8zBHlkx31Y8P2UZALxpwqbslUbI7kMvFyPqEaIPfmSBBR7RY0kbuSgdwgPbcnsruf2E6Qtb2ZCTAdg`,
                    ...data.getHeaders()
                },
                data: data
            });
            
            console.log('PDF successfully uploaded:', response.data);
            return response.data;
        } catch (error) {
            console.error('PDF upload error:', error.response?.data || error.message);
            throw error;
        }
    }
    
    // Send media to WhatsApp
    async function sendMedia(mediaId, phoneNumber) {
        try {
            const response = await axios({
                url: 'https://graph.facebook.com/v17.0/625653127293431/messages',
                method: 'post',
                headers: {
                    'Authorization': `Bearer EAAQ92ylsCz0BOZBXDMTGfCLiRwt1gRceyRu0Xhx0qapPDGvhV8lAQ0WkJhG5yrvAJTAn5RU32zQPZAtjZBBjqUHBGyVqpuFdveJTZCyJ0hFwsdFpZCFrA2gdjvw6b3ZAXuG87MRaaPK5UT8zBHlkx31Y8P2UZALxpwqbslUbI7kMvFyPqEaIPfmSBBR7RY0kbuSgdwgPbcnsruf2E6Qtb2ZCTAdg`,
                    'Content-Type': 'application/json',
                },
                data: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: phoneNumber,
                    type: 'document',
                    document: {
                        id: mediaId,
                        caption: 'Bilet Rezervasyon Bilgileri',
                        filename: `tickets_${Date.now()}.pdf`
                    }
                })
            });
            
            console.log('PDF successfully sent:', response.data);
            return response.data;
        } catch (error) {
            console.error('WhatsApp send error:', error.response?.data || error.message);
            throw error;
        }
    }


//Turları transfer etmek için endpointler

    // Tüm tur isimlerini getir
    router.get('/all-tour-names', async (req, res) => {
        try {
            const query = `
                SELECT DISTINCT tour_name
                FROM tours
                ORDER BY tour_name ASC
            `;

            const [tours] = await db.promise().query(query);
            console.log('Bulunan turlar:', tours); // Debug için log ekleyelim

            if (!tours || tours.length === 0) {
                console.log('Hiç tur bulunamadı'); // Debug için log ekleyelim
                return res.json([]);
            }

            const tourNames = tours.map(tour => tour.tour_name).filter(name => name); // null/undefined değerleri filtrele
            console.log('İşlenmiş tur isimleri:', tourNames); // Debug için log ekleyelim
            
            res.json(tourNames);
        } catch (error) {
            console.error('Tur isimleri alınırken detaylı hata:', {
                message: error.message,
                sql: error.sql,
                sqlMessage: error.sqlMessage,
                stack: error.stack
            });
            res.status(500).json({
                error: 'Tur isimleri alınamadı',
                details: error.message
            });
        }
    });

    // Bilet tur adını güncelleme endpoint'i
    router.post('/update-ticket-name', async (req, res) => {
        const { ticketId, targetTourName } = req.body;

        if (!ticketId || !targetTourName) {
            return res.status(400).json({
                error: 'Bilet ID ve hedef tur adı gerekli'
            });
        }

        try {
            await db.promise().beginTransaction();

            // Önce hedef turun bilgilerini ve bölgelerini al
            const [targetTourData] = await db.promise().query(
                `SELECT 
                    t.tour_name,
                    t.operator as provider_name,
                    t.operator_id as provider_ref,
                    t.adult_price,
                    t.child_price as half_price,
                    t.guide_adult_price,
                    t.guide_child_price,
                    t.currency,
                    mt.tour_name as tour_group_name,
                    GROUP_CONCAT(tr.region_name) as regions
                FROM tours t
                LEFT JOIN main_tours mt ON mt.id = t.main_tour_id
                LEFT JOIN tour_regions tr ON tr.tour_id = t.id
                WHERE t.tour_name = ?
                GROUP BY t.id`,
                [targetTourName]
            );

            if (!targetTourData[0]) {
                throw new Error('Hedef tur bulunamadı');
            }

            // Reservation_tickets tablosunu güncelle
            const updateTicketQuery = `
                UPDATE reservation_tickets 
                SET 
                    tour_name = ?,
                    tour_group_name = ?,
                    provider_name = ?,
                    provider_ref = ?,
                    adult_price = ?,
                    half_price = ?,
                    guide_adult_price = ?,
                    guide_child_price = ?,
                    currency = ?,
                    regions = ?
                WHERE id = ?
            `;
            await db.promise().query(updateTicketQuery, [
                targetTourData[0].tour_name,
                targetTourData[0].tour_group_name,
                targetTourData[0].provider_name,
                targetTourData[0].provider_ref,
                targetTourData[0].adult_price,
                targetTourData[0].half_price,
                targetTourData[0].guide_adult_price,
                targetTourData[0].guide_child_price,
                targetTourData[0].currency,
                targetTourData[0].regions || '',
                ticketId
            ]);

            // Ticket number'ı al
            const [ticketData] = await db.promise().query(
                'SELECT ticket_number FROM reservation_tickets WHERE id = ?',
                [ticketId]
            );

            if (ticketData[0]?.ticket_number) {
                // Reservation_approve tablosunu güncelle
                const updateApproveQuery = `
                    UPDATE reservation_approve 
                    SET 
                        tour_name = ?,
                        currency = ?,
                        provider_ref = ?
                    WHERE ticket_no = ?
                `;
                await db.promise().query(updateApproveQuery, [
                    targetTourData[0].tour_name,
                    targetTourData[0].currency,
                    targetTourData[0].provider_ref,
                    ticketData[0].ticket_number
                ]);
            }

            // Transaction'ı tamamla
            await db.promise().commit();

            res.json({
                success: true,
                message: 'Bilet bilgileri başarıyla güncellendi'
            });

        } catch (error) {
            // Hata durumunda transaction'ı geri al
            await db.promise().rollback();
            console.error('Bilet güncelleme hatası:', error);
            res.status(500).json({
                error: 'Bilet güncellenirken bir hata oluştu',
                details: error.message
            });
        }
    });

    return router;
};