const express = require('express');
const router = express.Router();

module.exports = (db) => {
    // guide_collections tablosuna rest_amount sütunu ekle
    const alterTableQuery = `
        ALTER TABLE guide_collections 
        ADD COLUMN rest_amount TEXT
    `;

    db.query(alterTableQuery, (error) => {
        if (error && error.code !== 'ER_DUP_FIELDNAME') {
            console.error('guide_collections tablosuna rest_amount sütunu eklenirken hata:', error);
        } else if (error && error.code === 'ER_DUP_FIELDNAME') {
            console.log('rest_amount sütunu zaten mevcut');
        } else {
            console.log('rest_amount sütunu başarıyla eklendi');
        }
    });

    // Tüm rezervasyonları ve biletleri getir
    router.get('/reservations-with-tickets/:companyId', async (req, res) => {
        try {
            const { guideName, startDate } = req.query;
            
            console.log('Received params:', { guideName, startDate });

            // Debug için rest miktarlarını kontrol edelim
            const checkRestQuery = `
                SELECT 
                    rt.id as ticket_id, 
                    rt.tour_name,
                    rt.date,
                    tra.amount,
                    tra.created_at,
                    COALESCE(
                        (SELECT tra2.amount 
                        FROM ticket_rest_amount tra2 
                        WHERE tra2.ticket_id = rt.id
                        ORDER BY tra2.created_at DESC
                        LIMIT 1),
                        0
                    ) as latest_rest_amount
                FROM reservation_tickets rt
                LEFT JOIN ticket_rest_amount tra ON tra.ticket_id = rt.id
                ${startDate ? 'WHERE rt.date = ?' : ''}
                ORDER BY rt.id, tra.created_at DESC
            `;
            
            db.query(checkRestQuery, startDate ? [startDate] : [], (checkErr, checkResults) => {
                if (checkErr) {
                    console.error('Rest amount check error:', checkErr);
                } else {
                    console.log('Rest amounts detailed check:', {
                        totalRecords: checkResults.length,
                        sampleRecords: checkResults.slice(0, 5),
                        ticketsWithRest: checkResults.filter(r => r.amount !== null).length,
                        uniqueTickets: new Set(checkResults.map(r => r.ticket_id)).size
                    });
                }
            });

            let query = `
                SELECT 
                    r.*,
                    rt.id as ticket_id,
                    rt.tour_name,
                    rt.tour_group_name,
                    rt.adult_count,
                    rt.child_count,
                    rt.free_count,
                    rt.currency,
                    rt.date,
                    rt.time,
                    rt.guide_name,
                    rt.provider_name,
                    rt.adult_price,
                    rt.half_price,
                    rt.guide_adult_price,
                    rt.guide_child_price,
                    rt.comment as ticket_comment,
                    r.commission_rate,
                    rt.status as ticket_status,
                    rt.ticket_number,
                    rt.total_cost,
                    r.reservation_guide_color,
                    (rt.adult_price * rt.adult_count) as base_price,
                    (
                        SELECT GROUP_CONCAT(
                            CONCAT(
                                opt.option_name,
                                ' (', opt.price, ' ', rt.currency, ')'
                            ) SEPARATOR ', '
                        )
                        FROM ticket_options opt
                        WHERE opt.ticket_id = rt.id
                    ) as ticket_options,
                    (
                        SELECT COALESCE(SUM(price), 0)
                        FROM ticket_options
                        WHERE ticket_id = rt.id
                    ) as options_total_price,
                    (
                        SELECT GROUP_CONCAT(
                            CONCAT(
                                rp2.amount, ' ', 
                                rp2.currency,
                                ' (',
                                CASE 
                                    WHEN rp2.payment_type = 'card' THEN 
                                        CONCAT('card - %', COALESCE((
                                            SELECT pos_commission_rate 
                                            FROM safe s 
                                            WHERE s.company_id = r.company_id 
                                            AND s.name COLLATE utf8mb4_0900_ai_ci = rp2.currency COLLATE utf8mb4_0900_ai_ci
                                            AND s.pos_commission_rate IS NOT NULL
                                            ORDER BY s.id DESC
                                            LIMIT 1
                                        ), 0))
                                    WHEN rp2.payment_type = 'cash' THEN 'cash'
                                    ELSE rp2.payment_type
                                END,
                                ')'
                            ) SEPARATOR ', '
                        )
                        FROM reservation_payments rp2 
                        WHERE rp2.reservation_id = r.id
                        AND rp2.amount > 0
                    ) as payments,
                    (
                        SELECT COALESCE(SUM(
                            CASE 
                                WHEN rp2.currency = 'TRY' THEN 
                                    CASE 
                                        WHEN rp2.payment_type = 'card' THEN 
                                            rp2.amount - (rp2.amount * COALESCE((
                                                SELECT pos_commission_rate/100 
                                                FROM safe s 
                                                WHERE s.company_id = r.company_id 
                                                AND s.name COLLATE utf8mb4_0900_ai_ci = 'TRY' COLLATE utf8mb4_0900_ai_ci
                                                AND s.pos_commission_rate IS NOT NULL
                                                ORDER BY s.id DESC
                                                LIMIT 1
                                            ), 0))
                                        ELSE rp2.amount
                                    END
                                ELSE 
                                    CASE 
                                        WHEN rp2.payment_type = 'card' THEN 
                                            (rp2.amount * COALESCE((
                                                SELECT buying_rate 
                                                FROM currency_rates cr 
                                                WHERE cr.currency_code = rp2.currency
                                                LIMIT 1
                                            ), 1)) - ((rp2.amount * COALESCE((
                                                SELECT buying_rate 
                                                FROM currency_rates cr 
                                                WHERE cr.currency_code = rp2.currency
                                                LIMIT 1
                                            ), 1)) * COALESCE((
                                                SELECT pos_commission_rate/100 
                                                FROM safe s 
                                                WHERE s.company_id = r.company_id 
                                                AND s.name COLLATE utf8mb4_0900_ai_ci = rp2.currency COLLATE utf8mb4_0900_ai_ci
                                                AND s.pos_commission_rate IS NOT NULL
                                                ORDER BY s.id DESC
                                                LIMIT 1
                                            ), 0))
                                        ELSE 
                                            rp2.amount * COALESCE((
                                                SELECT buying_rate 
                                                FROM currency_rates cr 
                                                WHERE cr.currency_code = rp2.currency
                                                LIMIT 1
                                            ), 1)
                                    END
                            END
                        ), 0)
                        FROM reservation_payments rp2 
                        WHERE rp2.reservation_id = r.id
                    ) as total_payments_try,
                    COALESCE((
                        SELECT buying_rate 
                        FROM currency_rates cr 
                        WHERE cr.currency_code = rt.currency
                        LIMIT 1
                    ), 1) as exchange_rate,
                    (
                        SELECT COALESCE(SUM(
                            CASE 
                                WHEN rp2.currency = 'TRY' THEN rp2.amount
                                ELSE rp2.amount * COALESCE((
                                    SELECT buying_rate 
                                    FROM currency_rates cr 
                                    WHERE cr.currency_code = rp2.currency
                                    LIMIT 1
                                ), 1)
                            END
                        ), 0)
                        FROM reservation_payments rp2 
                        WHERE rp2.reservation_id = r.id
                    ) as total_cost_try,
                    SUM(
                        (rt.adult_count * rt.adult_price * 0.3) + 
                        (rt.child_count * rt.half_price * 0.3)
                    ) as guide_payment,
                    SUM(
                        (rt.adult_count * rt.adult_price * 0.7) + 
                        (rt.child_count * rt.half_price * 0.7)
                    ) as agency_payment,
                    COALESCE(
                        (SELECT amount 
                        FROM ticket_rest_amount tra 
                        WHERE tra.ticket_id = rt.id
                        ORDER BY tra.created_at DESC
                        LIMIT 1),
                        0
                    ) as rest_amount,
                    (
                        SELECT GROUP_CONCAT(
                            CONCAT(
                                tra.amount, ' ', 
                                COALESCE(tra.currency, rt.currency)
                            ) ORDER BY tra.created_at DESC SEPARATOR ', '
                        )
                        FROM ticket_rest_amount tra 
                        WHERE tra.ticket_id = rt.id
                    ) as rest_history
                FROM 
                    reservations r
                    INNER JOIN reservation_tickets rt ON r.id = rt.reservation_id
                WHERE r.status = 1 AND rt.status != 0 AND r.is_cost_guide != 1
            `;

            const queryParams = [];

            // Rehber filtresi
            if (guideName && guideName.trim() !== '') {
                query += ` AND TRIM(rt.guide_name) = TRIM(?)`;
                queryParams.push(guideName);
            }

            // Tarih filtresi
            if (startDate) {
                query += ` AND DATE(r.created_at) = ?`;
                queryParams.push(startDate);
            }

            // Gruplandırma ekle
            query += ` GROUP BY r.id, rt.id`;

            // Sıralama - son eklenen kayıtlar önce
            query += ` ORDER BY r.created_at DESC, rt.date ASC, rt.time ASC`;

            console.log('Final query:', query);
            console.log('Query params:', queryParams);

            db.query(query, queryParams, (err, results) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ 
                        error: 'Database error', 
                        details: err.message,
                        sql: err.sql 
                    });
                }
                
                // Debug için ilk sonuçları kontrol edelim
                console.log('Query results sample:', {
                    count: results.length,
                    firstResult: results[0],
                    restAmountSample: results.slice(0, 3).map(r => ({
                        ticket_id: r.ticket_id,
                        rest_amount: r.rest_amount,
                        tour_name: r.tour_name,
                        date: r.date,
                        fullTicket: r
                    }))
                });

                res.json(results);
            });

        } catch (error) {
            console.error('Server error:', error);
            res.status(500).json({ error: 'Server error', details: error.message });
        }
    });

    // Rezervasyon durumunu güncelle
    router.put('/reservation-status/:reservationId/:ticketId', (req, res) => {
        const { reservationId, ticketId } = req.params;
        const { status, notes } = req.body;

        const updateReservation = `
            UPDATE reservations 
            SET status = ?, notes = ?, updated_at = NOW()
            WHERE id = ?
        `;

        const updateTicket = `
            UPDATE reservation_tickets 
            SET status = ?, updated_at = NOW()
            WHERE id = ?
        `;

        db.beginTransaction(err => {
            if (err) {
                return res.status(500).json({ error: 'Transaction error' });
            }

            db.query(updateReservation, [status, notes, reservationId], (err) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ error: 'Reservation update error' });
                    });
                }

                db.query(updateTicket, [status, ticketId], (err) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ error: 'Ticket update error' });
                        });
                    }

                    db.commit(err => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({ error: 'Commit error' });
                            });
                        }
                        res.json({ message: 'Status updated successfully' });
                    });
                });
            });
        });
    });

    // Rehberin rezervasyon istatistiklerini getir
    router.get('/reservation-stats/:guideId', (req, res) => {
        const { guideId } = req.params;
        const { startDate, endDate } = req.query;

        const query = `
            SELECT 
                COUNT(*) as total_reservations,
                SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) as completed_tours,
                SUM(CASE WHEN r.status = 'pending' THEN 1 ELSE 0 END) as pending_tours,
                SUM(CASE WHEN r.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_tours,
                SUM(rt.adult_count) as total_adults,
                SUM(rt.child_count) as total_children
            FROM 
                reservations r
                LEFT JOIN reservation_tickets rt ON r.id = rt.reservation_id
            WHERE 
                r.guide_id = ?
                AND r.reservation_date BETWEEN ? AND ?
        `;

        db.query(query, [guideId, startDate, endDate], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(results[0]);
        });
    });

    // Günlük rezervasyonları getir
    router.get('/daily-reservations/:guideId', (req, res) => {
        const { guideId } = req.params;
        const { date } = req.query;

        const query = `
            SELECT 
                r.*,
                rt.*,
                t.tour_name,
                t.tour_time,
                c.company_name
            FROM 
                reservations r
                LEFT JOIN reservation_tickets rt ON r.id = rt.reservation_id
                LEFT JOIN tours t ON rt.tour_id = t.id
                LEFT JOIN companies c ON r.company_id = c.id
            WHERE 
                r.guide_id = ?
                AND DATE(r.reservation_date) = ?
            ORDER BY 
                t.tour_time ASC
        `;

        db.query(query, [guideId, date], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(results);
        });
    });

    // Rehber listesini getir
    router.get('/guide-list', async (req, res) => {
        try {
            const query = `
                SELECT DISTINCT LOWER(TRIM(guide_name)) as guide_name 
                FROM reservation_tickets 
                WHERE guide_name IS NOT NULL AND guide_name != ''
                ORDER BY LOWER(TRIM(guide_name)) ASC
            `;

            db.query(query, (err, results) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ 
                        error: 'Database error', 
                        details: err.message 
                    });
                }
                res.json(results);
            });
        } catch (error) {
            console.error('Server error:', error);
            res.status(500).json({ error: 'Server error', details: error.message });
        }
    });

    // Döviz kurlarını getir
    router.get('/currency-rates', async (req, res) => {
        try {
            const query = `
                SELECT 
                    currency_code,
                    currency_name,
                    buying_rate
                FROM currency_rates
            `;

            db.query(query, (err, results) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ 
                        error: 'Database error', 
                        details: err.message 
                    });
                }

                const rates = results.reduce((acc, curr) => {
                    acc[curr.currency_code] = curr.buying_rate;
                    return acc;
                }, {});

                res.json(rates);
            });
        } catch (error) {
            console.error('Server error:', error);
            res.status(500).json({ 
                error: 'Server error', 
                details: error.message 
            });
        }
    });

    // Döviz kurlarını güncelle
    router.post('/update-currency-rates', async (req, res) => {
        try {
            const { rates } = req.body;

            console.log('Received update request:', { rates });

            if (!rates) {
                return res.status(400).json({ 
                    error: 'Missing required fields', 
                    details: 'rates are required' 
                });
            }

            // Her bir kur için güncelleme yap
            const updatePromises = Object.entries(rates).map(([currency_code, rate]) => {
                return new Promise((resolve, reject) => {
                    const query = `
                        UPDATE currency_rates 
                        SET buying_rate = ?
                        WHERE currency_code = ?
                    `;
                    
                    console.log('Executing query:', query, [rate, currency_code]);

                    db.query(query, [rate, currency_code], (err, result) => {
                        if (err) {
                            console.error('Update error for currency:', currency_code, err);
                            reject(err);
                        } else {
                            console.log('Update result for currency:', currency_code, result);
                            resolve(result);
                        }
                    });
                });
            });

            try {
                await Promise.all(updatePromises);
            } catch (updateError) {
                console.error('Update promises error:', updateError);
                return res.status(500).json({ 
                    error: 'Update error', 
                    details: updateError.message 
                });
            }

            // Güncellenmiş kurları getir
            const getUpdatedRates = `
                SELECT 
                    currency_code,
                    buying_rate
                FROM currency_rates
            `;

            db.query(getUpdatedRates, (err, results) => {
                if (err) {
                    console.error('Error fetching updated rates:', err);
                    return res.status(500).json({ 
                        error: 'Database error', 
                        details: err.message 
                    });
                }

                console.log('Updated rates results:', results);

                const updatedRates = results.reduce((acc, curr) => {
                    acc[curr.currency_code] = curr.buying_rate;
                    return acc;
                }, {});

                res.json({
                    message: 'Currency rates updated successfully',
                    rates: updatedRates
                });
            });

        } catch (error) {
            console.error('Server error:', error);
            res.status(500).json({ 
                error: 'Server error', 
                details: error.message,
                stack: error.stack
            });
        }
    });

    // Rehber tahsilatlarını kaydet
    router.post('/save-guide-collections', (req, res) => {
        const { reservationIds, guideName, description = '', totalGuideEarning } = req.body;

        if (!Array.isArray(reservationIds) || reservationIds.length === 0) {
            return res.status(400).json({ error: 'Geçerli rezervasyon listesi gerekli' });
        }

        if (!guideName) {
            return res.status(400).json({ error: 'Rehber adı gerekli' });
        }

        try {
            // 6 haneli alfanumerik kod oluştur
            const generateTransactionNo = () => {
                const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                let result = '';
                for (let i = 0; i < 6; i++) {
                    result += chars[Math.floor(Math.random() * chars.length)];
                }
                return result;
            };

            // Benzersiz transaction_no oluştur
            const checkTransactionNo = `
                SELECT id FROM guide_collections WHERE transaction_no = ? LIMIT 1
            `;

            const generateUniqueTransactionNo = () => {
                return new Promise((resolve, reject) => {
                    const tryGenerate = () => {
                        const transactionNo = generateTransactionNo();
                        db.query(checkTransactionNo, [transactionNo], (err, results) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            if (results.length === 0) {
                                resolve(transactionNo);
                            } else {
                                tryGenerate();
                            }
                        });
                    };
                    tryGenerate();
                });
            };

            generateUniqueTransactionNo().then(async (transactionNo) => {
                try {
                    // Döviz kurlarını al
                    const currencyRates = await new Promise((resolve, reject) => {
                        const getCurrencyRates = `
                            SELECT 
                                GROUP_CONCAT(
                                    CONCAT(currency_code, ':', buying_rate)
                                    SEPARATOR ','
                                ) as rates
                            FROM currency_rates
                            WHERE currency_code IN ('EUR', 'USD', 'GBP')
                        `;
                        
                        db.query(getCurrencyRates, (err, results) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            resolve(results[0]?.rates || '');
                        });
                    });

                    // Rest miktarlarını al
                    const restResults = await new Promise((resolve, reject) => {
                        const getRestAmounts = `
                            SELECT 
                                r.id as reservation_id,
                                GROUP_CONCAT(
                                    CONCAT(
                                        tra.amount, ' ', 
                                        COALESCE(tra.currency, rt.currency)
                                    ) ORDER BY tra.created_at DESC SEPARATOR ', '
                                ) as rest_amounts
                            FROM reservations r
                            LEFT JOIN reservation_tickets rt ON r.id = rt.reservation_id
                            LEFT JOIN ticket_rest_amount tra ON rt.id = tra.ticket_id
                            WHERE r.id IN (?)
                            GROUP BY r.id
                        `;
                        
                        db.query(getRestAmounts, [reservationIds], (err, results) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            resolve(results);
                        });
                    });

                    // Rest miktarlarını reservation_id'ye göre map'le
                    const restAmountMap = restResults.reduce((acc, row) => {
                        acc[row.reservation_id] = row.rest_amounts || null;
                        return acc;
                    }, {});

                    // Her rezervasyon için ayrı kayıt oluştur
                    const insertCollection = `
                        INSERT INTO guide_collections 
                        (guide_name, collection_date, reservation_id, description, transaction_no, guide_earning, currency_rates, rest_amount)
                        VALUES ?
                    `;

                    // Toplam hak edişi rezervasyon sayısına bölerek her rezervasyona eşit dağıt
                    const guideEarningPerReservation = totalGuideEarning / reservationIds.length;

                    const values = reservationIds.map(reservationId => [
                        guideName,
                        new Date(),
                        reservationId,
                        description,
                        transactionNo,
                        guideEarningPerReservation,
                        currencyRates,
                        restAmountMap[reservationId] || null
                    ]);

                    // Transaction başlat
                    await new Promise((resolve, reject) => {
                        db.beginTransaction((transErr) => {
                            if (transErr) {
                                reject(transErr);
                                return;
                            }
                            resolve();
                        });
                    });

                    try {
                        // Guide collections kayıtlarını ekle
                        await new Promise((resolve, reject) => {
                            db.query(insertCollection, [values], (err, result) => {
                                if (err) {
                                    return reject(err);
                                }
                                resolve(result);
                            });
                        });

                        // Rezervasyonların ödeme bilgilerini al
                        const paymentDetails = await new Promise((resolve, reject) => {
                            const getPaymentDetails = `
                                SELECT 
                                    rp.currency,
                                    rp.payment_type,
                                    SUM(rp.amount) as total_amount
                                FROM reservation_payments rp
                                WHERE rp.reservation_id IN (?)
                                GROUP BY rp.currency, rp.payment_type
                            `;
                            
                            db.query(getPaymentDetails, [reservationIds], (err, results) => {
                                if (err) {
                                    return reject(err);
                                }
                                resolve(results);
                            });
                        });

                        // Her ödeme tipi ve para birimi için safe kaydı oluştur
                        for (const payment of paymentDetails) {
                            // Safe records'a kayıt ekle
                            await new Promise((resolve, reject) => {
                                const insertSafeRecord = `
                                    INSERT INTO safe_records (
                                        transaction_no,
                                        account_name,
                                        created_at,
                                        description,
                                        payment_type,
                                        payment_method,
                                        currency,
                                        amount
                                    ) VALUES (?, ?, NOW(), ?, 'gelir', ?, ?, ?)
                                `;
                                
                                // Ödeme tipine göre payment_method belirle
                                const paymentMethod = payment.payment_type === 'card' ? 'card' : 'cash';
                                
                                db.query(insertSafeRecord, [
                                    transactionNo,
                                    guideName,
                                    description,
                                    paymentMethod,
                                    payment.currency,
                                    payment.total_amount
                                ], (err, result) => {
                                    if (err) {
                                        return reject(err);
                                    }
                                    resolve(result);
                                });
                            });

                            // Safe balance'ı güncelle - pozitif değer olarak ekle
                            await new Promise((resolve, reject) => {
                                const updateSafeBalance = `
                                    UPDATE safe 
                                    SET balance = balance + ?,
                                        updated_at = NOW()
                                    WHERE type = ? AND name = ?
                                `;
                                
                                db.query(updateSafeBalance, [
                                    payment.total_amount,
                                    payment.payment_type,  // type sütunu (card veya cash)
                                    payment.currency       // name sütunu (para birimi)
                                ], (err, result) => {
                                    if (err) {
                                        return reject(err);
                                    }
                                    resolve(result);
                                });
                            });
                        }

                        // Rezervasyonları güncelle
                        await new Promise((resolve, reject) => {
                            const updateReservations = `
                                UPDATE reservations 
                                SET is_cost_guide = 1, reservation_guide_color = 0
                                WHERE id IN (?)
                            `;
                            
                            db.query(updateReservations, [reservationIds], (err, result) => {
                                if (err) {
                                    return reject(err);
                                }
                                resolve(result);
                            });
                        });

                        // Transaction'ı commit et
                        await new Promise((resolve, reject) => {
                            db.commit((commitErr) => {
                                if (commitErr) {
                                    reject(commitErr);
                                    return;
                                }
                                resolve();
                            });
                        });

                        res.json({ 
                            message: 'Tahsilat başarıyla kaydedildi',
                            insertedCount: values.length,
                            reservationCount: reservationIds.length,
                            transactionNo,
                            totalGuideEarning,
                            paymentDetails
                        });

                    } catch (error) {
                        // Hata durumunda rollback yap
                        await new Promise((resolve) => {
                            db.rollback(() => resolve());
                        });
                        throw error;
                    }

                } catch (error) {
                    console.error('Error during transaction:', error);
                    res.status(500).json({ 
                        error: 'İşlem sırasında hata oluştu', 
                        details: error.message 
                    });
                }
            }).catch(error => {
                console.error('Server error:', error);
                res.status(500).json({ error: 'Sunucu hatası', details: error.message });
            });

        } catch (error) {
            console.error('Server error:', error);
            res.status(500).json({ error: 'Sunucu hatası', details: error.message });
        }
    });

    // Promise tabanlı sorgu fonksiyonu
    const executeQuery = (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.query(sql, params, (err, results) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(results);
            });
        });
    };

    // Rehber tahsilatlarını listele
    router.get('/guide-collections', async (req, res) => {
        try {
            const { guideName, searchMode } = req.query;
            
            let sql = `
                SELECT 
                    gc.transaction_no,
                    MIN(gc.collection_date) as collection_date,
                    gc.guide_name,
                    gc.description,
                    COUNT(DISTINCT gc.reservation_id) as reservation_count,
                    SUM(
                        CASE 
                            WHEN rt.id = (
                                SELECT MIN(rt2.id)
                                FROM reservation_tickets rt2
                                WHERE rt2.reservation_id = r.id AND rt2.status != 0
                            ) THEN gc.guide_earning
                            ELSE 0
                        END
                    ) as guide_earning,
                    gc.currency_rates,
                    GROUP_CONCAT(
                        DISTINCT CONCAT(
                            r.id, '|',
                            r.customer_name, '|',
                            r.hotel_name, '|',
                            rt.tour_name, '|',
                            rt.date, '|',
                            COALESCE(rt.adult_count, 0), '|',
                            COALESCE(rt.child_count, 0), '|',
                            COALESCE(
                                (rt.adult_count * rt.adult_price) + 
                                (rt.child_count * rt.half_price) +
                                COALESCE((
                                    SELECT SUM(price)
                                    FROM ticket_options
                                    WHERE ticket_id = rt.id
                                ), 0)
                            , 0), '|',
                            rt.currency, '|',
                            COALESCE(rt.ticket_number, '-'), '|',
                            CASE 
                                WHEN rt.id = (
                                    SELECT MIN(rt2.id)
                                    FROM reservation_tickets rt2
                                    WHERE rt2.reservation_id = r.id AND rt2.status != 0
                                ) THEN COALESCE(gc.guide_earning, 0)
                                ELSE 0
                            END, '|',
                            COALESCE(rt.adult_price, 0), '|',
                            COALESCE(rt.half_price, 0), '|',
                            COALESCE(rt.guide_adult_price, 0), '|',
                            COALESCE(rt.guide_child_price, 0), '|',
                            COALESCE(rt.status, 1), '|',
                            COALESCE((
                                SELECT GROUP_CONCAT(
                                    CONCAT(option_name, ' (', price, ' ', rt.currency, ')')
                                    SEPARATOR ', '
                                )
                                FROM ticket_options
                                WHERE ticket_id = rt.id
                            ), ''), '|',
                            COALESCE((
                                SELECT GROUP_CONCAT(
                                    CONCAT(
                                        rp2.amount, ' ', 
                                        rp2.currency,
                                        ' (',
                                        CASE 
                                            WHEN rp2.payment_type = 'card' THEN 
                                                CONCAT('card - %', COALESCE((
                                                    SELECT pos_commission_rate 
                                                    FROM safe s 
                                                    WHERE s.company_id = r.company_id 
                                                    AND s.name COLLATE utf8mb4_0900_ai_ci = rp2.currency COLLATE utf8mb4_0900_ai_ci
                                                    AND s.pos_commission_rate IS NOT NULL
                                                    ORDER BY s.id DESC
                                                    LIMIT 1
                                                ), 0))
                                            WHEN rp2.payment_type = 'cash' THEN 'cash'
                                            ELSE rp2.payment_type
                                        END,
                                        ')'
                                    ) SEPARATOR ', '
                                )
                                FROM reservation_payments rp2 
                                WHERE rp2.reservation_id = r.id
                                AND rp2.amount > 0
                            ), 'Ödeme bilgisi yok'), '|',
                            COALESCE((
                                SELECT GROUP_CONCAT(
                                    CONCAT(
                                        tra.amount, ' ', 
                                        COALESCE(tra.currency, rt.currency)
                                    ) ORDER BY tra.created_at DESC SEPARATOR ', '
                                )
                                FROM ticket_rest_amount tra 
                                WHERE tra.ticket_id = rt.id
                            ), 'Rest bilgisi yok')
                        ) ORDER BY rt.date
                        SEPARATOR ';;'
                    ) as reservation_details
                FROM guide_collections gc
                LEFT JOIN reservations r ON gc.reservation_id = r.id
                LEFT JOIN reservation_tickets rt ON r.id = rt.reservation_id AND rt.status != 0
            `;

            const queryParams = [];
            
            // Rehber filtresi ekle
            if (guideName && guideName.trim() !== '') {
                sql += ` WHERE TRIM(gc.guide_name) = TRIM(?)`;
                queryParams.push(guideName);
            }

            sql += ` GROUP BY gc.transaction_no, gc.guide_name, gc.description, gc.currency_rates
                    ORDER BY MIN(gc.collection_date) DESC, gc.transaction_no DESC`;

            // Eğer arama modu değilse son 50 kayıt getir
            if (!searchMode || searchMode === 'false') {
                sql += ` LIMIT 50`;
            }

            const results = await executeQuery(sql, queryParams);

            // Detayları parse et ve her işlem için toplam rest miktarlarını hesapla
            const formattedResults = results.map(row => {
                const details = row.reservation_details.split(';;').map(detail => {
                    const [
                        reservation_id,
                        customer_name,
                        hotel_name,
                        tour_name,
                        tour_date,
                        adult_count,
                        child_count,
                        total_cost,
                        currency,
                        ticket_number,
                        guide_earning,
                        adult_price,
                        half_price,
                        guide_adult_price,
                        guide_child_price,
                        ticket_status,
                        option_details,
                        payments,
                        rest_amount
                    ] = detail.split('|');

                    // Döviz kurlarını parse et
                    const rates = row.currency_rates ? row.currency_rates.split(',').reduce((acc, rate) => {
                        const [code, value] = rate.split(':');
                        acc[code] = parseFloat(value);
                        return acc;
                    }, {}) : {};

                    return {
                        reservation_id: parseInt(reservation_id),
                        customer_name,
                        hotel_name,
                        tour_name,
                        tour_date,
                        adult_count: parseInt(adult_count),
                        child_count: parseInt(child_count),
                        total_cost: parseFloat(total_cost),
                        currency,
                        ticket_number,
                        guide_earning: parseFloat(guide_earning),
                        adult_price: parseFloat(adult_price),
                        half_price: parseFloat(half_price),
                        guide_adult_price: parseFloat(guide_adult_price),
                        guide_child_price: parseFloat(guide_child_price),
                        ticket_status: parseInt(ticket_status),
                        ticket_options: option_details ? option_details : null,
                        payments: payments ? payments : null,
                        rest_amount: rest_amount && rest_amount !== 'Rest bilgisi yok' ? rest_amount : null,
                        currency_rates: rates
                    };
                });

                // Müşteri bazında grupla
                const groupedDetails = details.reduce((acc, detail) => {
                    const key = `${detail.customer_name}|${detail.hotel_name}`;
                    if (!acc[key]) {
                        acc[key] = {
                            reservation_id: detail.reservation_id,
                            customer_name: detail.customer_name,
                            hotel_name: detail.hotel_name,
                            tickets: []
                        };
                    }
                    acc[key].tickets.push({
                        tour_name: detail.tour_name,
                        tour_date: detail.tour_date,
                        adult_count: detail.adult_count,
                        child_count: detail.child_count,
                        total_cost: detail.total_cost,
                        currency: detail.currency,
                        ticket_number: detail.ticket_number,
                        guide_earning: detail.guide_earning,
                        adult_price: detail.adult_price,
                        half_price: detail.half_price,
                        guide_adult_price: detail.guide_adult_price,
                        guide_child_price: detail.guide_child_price,
                        ticket_status: detail.ticket_status,
                        ticket_options: detail.ticket_options,
                        payments: detail.payments,
                        rest_amount: detail.rest_amount,
                        currency_rates: detail.currency_rates
                    });
                    return acc;
                }, {});

                // Her işlem için toplam rest miktarlarını hesapla
                const totalRestAmounts = {};
                
                // Rezervasyon bazında grupla ve her rezervasyon için sadece bir kez rest hesapla
                const reservationRests = {};
                details.forEach(detail => {
                    const reservationId = detail.reservation_id;
                    if (!reservationRests[reservationId]) {
                        reservationRests[reservationId] = detail.rest_amount;
                    }
                });
                
                // Her rezervasyon için rest hesapla
                Object.values(reservationRests).forEach(restAmount => {
                    if (restAmount && restAmount !== 'Rest bilgisi yok') {
                        const restParts = restAmount.split(', ');
                        restParts.forEach(rest => {
                            const restMatch = rest.match(/(\d+\.?\d*)\s+([A-Z]+)/);
                            if (restMatch) {
                                const amount = parseFloat(restMatch[1]);
                                const currency = restMatch[2];
                                
                                if (!totalRestAmounts[currency]) {
                                    totalRestAmounts[currency] = 0;
                                }
                                totalRestAmounts[currency] += amount;
                            }
                        });
                    }
                });

                // Toplam rest miktarlarını formatla
                const formattedTotalRest = Object.entries(totalRestAmounts).map(([currency, amount]) => ({
                    currency,
                    amount: parseFloat(amount.toFixed(2)),
                    formatted: `${amount.toFixed(2)} ${currency}`
                }));

                // Her işlem için toplam tahsilat miktarlarını hesapla (para birimi ve ödeme şekline göre)
                const totalPaymentAmounts = {};
                
                // Rezervasyon bazında grupla ve her rezervasyon için sadece bir kez ödeme hesapla
                const reservationPayments = {};
                details.forEach(detail => {
                    const reservationId = detail.reservation_id;
                    if (!reservationPayments[reservationId]) {
                        reservationPayments[reservationId] = detail.payments;
                    }
                });
                
                // Her rezervasyon için ödeme hesapla
                Object.values(reservationPayments).forEach(payments => {
                    if (payments && payments !== 'Ödeme bilgisi yok') {
                        const paymentParts = payments.split(', ');
                        paymentParts.forEach(payment => {
                            // Ödeme formatı: "100 EUR (card - %3)" veya "50 USD (cash)"
                            const paymentMatch = payment.match(/(\d+\.?\d*)\s+([A-Z]+)\s+\(([^)]+)\)/);
                            if (paymentMatch) {
                                const amount = parseFloat(paymentMatch[1]);
                                const currency = paymentMatch[2];
                                const paymentType = paymentMatch[3];
                                
                                const key = `${currency}_${paymentType}`;
                                if (!totalPaymentAmounts[key]) {
                                    totalPaymentAmounts[key] = {
                                        currency,
                                        paymentType,
                                        amount: 0
                                    };
                                }
                                totalPaymentAmounts[key].amount += amount;
                            }
                        });
                    }
                });

                // Toplam tahsilat miktarlarını formatla
                const formattedTotalPayments = Object.values(totalPaymentAmounts).map(payment => ({
                    currency: payment.currency,
                    paymentType: payment.paymentType,
                    amount: parseFloat(payment.amount.toFixed(2)),
                    formatted: `${payment.amount.toFixed(2)} ${payment.currency} (${payment.paymentType})`
                }));

                return {
                    ...row,
                    total_rest_amounts: formattedTotalRest,
                    total_payment_amounts: formattedTotalPayments,
                    reservation_details: Object.values(groupedDetails)
                };
            });

            res.json(formattedResults);

        } catch (error) {
            console.error('Server error:', error);
            res.status(500).json({ error: 'Sunucu hatası', details: error.message });
        }
    });

    // Tekil tahsilat kaydını sil
    router.delete('/guide-collections/reservation/:reservationId', async (req, res) => {
        const { reservationId } = req.params;

        // reservationId kontrolü
        if (!reservationId || isNaN(reservationId)) {
            return res.status(400).json({ 
                error: 'Geçersiz rezervasyon ID',
                details: 'Rezervasyon ID sayısal bir değer olmalıdır'
            });
        }

        try {
            // Transaction başlat
            await new Promise((resolve, reject) => {
                db.beginTransaction(err => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            try {
                // Önce rezervasyonun varlığını kontrol et
                const checkReservation = `
                    SELECT id 
                    FROM reservations 
                    WHERE id = ?
                `;
                const reservationExists = await executeQuery(checkReservation, [reservationId]);
                
                if (!reservationExists.length) {
                    throw new Error('Rezervasyon bulunamadı');
                }

                // Rezervasyonların ödeme bilgilerini al
                const paymentDetails = await new Promise((resolve, reject) => {
                    const getPaymentDetails = `
                        SELECT 
                            rp.currency,
                            rp.payment_type,
                            SUM(rp.amount) as total_amount
                        FROM reservation_payments rp
                        WHERE rp.reservation_id = ?
                        GROUP BY rp.currency, rp.payment_type
                    `;
                    
                    db.query(getPaymentDetails, [reservationId], (err, results) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve(results);
                    });
                });

                // Safe balance'ı güncelle - pozitif değer olarak çıkar
                for (const payment of paymentDetails) {
                    await new Promise((resolve, reject) => {
                        const updateSafeBalance = `
                            UPDATE safe 
                            SET balance = balance - ?,
                                updated_at = NOW()
                            WHERE type = ? AND name = ?
                        `;
                        
                        db.query(updateSafeBalance, [
                            payment.total_amount,
                            payment.payment_type,  // type sütunu (card veya cash)
                            payment.currency       // name sütunu (para birimi)
                        ], (err, result) => {
                            if (err) {
                                return reject(err);
                            }
                            resolve(result);
                        });
                    });
                }

                // Rezervasyonları güncelle (is_cost_guide = 0)
                const updateReservations = `
                    UPDATE reservations 
                    SET is_cost_guide = 0, reservation_guide_color = 1
                    WHERE id IN (?)
                `;
                await executeQuery(updateReservations, [reservationId]);

                // Guide collections kayıtlarını sil
                const deleteCollection = `
                    DELETE FROM guide_collections 
                    WHERE reservation_id = ?
                `;
                await executeQuery(deleteCollection, [reservationId]);

                // Transaction'ı commit et
                await new Promise((resolve, reject) => {
                    db.commit(err => {
                        if (err) reject(err);
                        else resolve();
                    });
                });

                res.json({ 
                    message: 'Tahsilat kaydı başarıyla silindi',
                    deletedReservationId: reservationId
                });

            } catch (error) {
                // Hata durumunda rollback yap
                await new Promise(resolve => db.rollback(() => resolve()));
                throw error;
            }

        } catch (error) {
            console.error('Server error:', error);
            res.status(error.message === 'Rezervasyon bulunamadı' ? 404 : 500).json({ 
                error: 'Sunucu hatası', 
                details: error.message 
            });
        }
    });

    // Tahsilat kaydını sil
    router.delete('/guide-collections/:transactionNo', async (req, res) => {
        const { transactionNo } = req.params;

        try {
            // Transaction başlat
            await new Promise((resolve, reject) => {
                db.beginTransaction(err => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            try {
                // Önce ilgili reservation_id'leri al
                const getReservationIds = `
                    SELECT reservation_id 
                    FROM guide_collections 
                    WHERE transaction_no = ?
                `;
                const results = await executeQuery(getReservationIds, [transactionNo]);
                const reservationIds = results.map(r => r.reservation_id);

                // Rezervasyonların ödeme bilgilerini al
                const paymentDetails = await new Promise((resolve, reject) => {
                    const getPaymentDetails = `
                        SELECT 
                            rp.currency,
                            rp.payment_type,
                            SUM(rp.amount) as total_amount
                        FROM reservation_payments rp
                        WHERE rp.reservation_id IN (?)
                        GROUP BY rp.currency, rp.payment_type
                    `;
                    
                    db.query(getPaymentDetails, [reservationIds], (err, results) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve(results);
                    });
                });

                // Safe balance'ı güncelle - pozitif değer olarak çıkar
                for (const payment of paymentDetails) {
                    await new Promise((resolve, reject) => {
                        const updateSafeBalance = `
                            UPDATE safe 
                            SET balance = balance - ?,
                                updated_at = NOW()
                            WHERE type = ? AND name = ?
                        `;
                        
                        db.query(updateSafeBalance, [
                            payment.total_amount,
                            payment.payment_type,  // type sütunu (card veya cash)
                            payment.currency       // name sütunu (para birimi)
                        ], (err, result) => {
                            if (err) {
                                return reject(err);
                            }
                            resolve(result);
                        });
                    });
                }

                // Rezervasyonları güncelle (is_cost_guide = 0)
                if (reservationIds.length > 0) {
                    const updateReservations = `
                        UPDATE reservations 
                        SET is_cost_guide = 0, reservation_guide_color = 1
                        WHERE id IN (?)
                    `;
                    await executeQuery(updateReservations, [reservationIds]);
                }

                // Guide collections kayıtlarını sil
                const deleteCollections = `
                    DELETE FROM guide_collections 
                    WHERE transaction_no = ?
                `;
                await executeQuery(deleteCollections, [transactionNo]);

                // Safe records kayıtlarını sil
                const deleteSafeRecords = `
                    DELETE FROM safe_records 
                    WHERE transaction_no = ?
                `;
                await executeQuery(deleteSafeRecords, [transactionNo]);

                // Transaction'ı commit et
                await new Promise((resolve, reject) => {
                    db.commit(err => {
                        if (err) reject(err);
                        else resolve();
                    });
                });

                res.json({ 
                    message: 'Tahsilat kaydı başarıyla silindi',
                    deletedTransactionNo: transactionNo,
                    affectedReservations: reservationIds.length
                });

            } catch (error) {
                // Hata durumunda rollback yap
                await new Promise(resolve => db.rollback(() => resolve()));
                throw error;
            }

        } catch (error) {
            console.error('Server error:', error);
            res.status(500).json({ error: 'Sunucu hatası', details: error.message });
        }
    });

    // Rezervasyon rehber rengini güncelle
    router.put('/update-reservation-guide-color/:reservationId', async (req, res) => {
        const { reservationId } = req.params;
        const { color } = req.body;

        try {
            const updateQuery = `
                UPDATE reservations 
                SET reservation_guide_color = ?
                WHERE id = ?
            `;

            await executeQuery(updateQuery, [color, reservationId]);

            res.json({ 
                message: 'Rezervasyon rehber rengi başarıyla güncellendi',
                reservationId,
                color
            });

        } catch (error) {
            console.error('Server error:', error);
            res.status(500).json({ error: 'Sunucu hatası', details: error.message });
        }
    });

    return router;
};