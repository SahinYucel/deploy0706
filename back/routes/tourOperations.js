const express = require('express');
const router = express.Router();

module.exports = (db) => {
    // Get all reservations with their details
    router.get('/reservations', async (req, res) => {
        try {
            console.log('Fetching reservations...');
            
            const query = `
                SELECT 
                    t.id,
                    t.reservation_id,
                    t.tour_name,
                    t.tour_group_name,
                    t.adult_count,
                    t.child_count,
                    t.free_count,
                    t.currency,
                    t.date,
                    t.comment,
                    t.regions,
                    t.guide_ref,
                    t.guide_name,
                    t.provider_name,
                    t.provider_ref,
                    t.time,
                    t.adult_price,
                    t.half_price,
                    t.cancellation_reason,
                    t.status,
                    t.ticket_number,
                    t.total_cost,
                    t.guide_adult_price,
                    t.guide_child_price,
                    r.customer_name,
                    r.phone,
                    r.room_number,
                    r.hotel_name,
                    r.created_at,
                    r.ticket_count,
                    r.main_comment,
                    r.commission_rate,
                    r.is_cost_guide,
                    r.currency_rates,
                    r.company_id,
                    r.reservation_guide_color,
                    GROUP_CONCAT(
                        CONCAT(
                            tra.amount, '|',
                            tra.currency, '|',
                            tra.created_at
                        )
                        ORDER BY tra.created_at DESC
                        SEPARATOR ';'
                    ) as rest_amounts
                FROM reservation_tickets t
                LEFT JOIN reservations r ON t.reservation_id = r.id
                LEFT JOIN ticket_rest_amount tra ON t.id = tra.ticket_id
                GROUP BY 
                    t.id, t.reservation_id, t.tour_name, t.tour_group_name, 
                    t.adult_count, t.child_count, t.free_count, t.currency, 
                    t.date, t.comment, t.regions, t.guide_ref, t.guide_name, 
                    t.provider_name, t.provider_ref, t.time, t.adult_price, 
                    t.half_price, t.cancellation_reason, t.status, t.ticket_number,
                    t.total_cost, t.guide_adult_price, t.guide_child_price,
                    r.customer_name, r.phone, r.room_number, r.hotel_name,
                    r.created_at, r.ticket_count, r.main_comment, r.commission_rate,
                    r.is_cost_guide, r.currency_rates,
                    r.company_id, r.reservation_guide_color
                ORDER BY t.date DESC, t.id DESC
            `;

            db.query(query, (error, results) => {
                if (error) {
                    console.error('Database error:', error);
                    return res.status(500).json({ 
                        error: 'Internal server error',
                        details: error.message 
                    });
                }

                console.log(`Found ${results.length} results`);

                // Group tickets by reservation
                const reservations = results.reduce((acc, row) => {
                    const reservation = acc.find(r => r.id === row.reservation_id);
                    
                    if (!reservation) {
                        // Create new reservation object
                        const newReservation = {
                            id: row.reservation_id,
                            customer_name: row.customer_name,
                            phone: row.phone,
                            room_number: row.room_number,
                            hotel_name: row.hotel_name,
                            created_at: row.created_at,
                            ticket_count: row.ticket_count,
                            main_comment: row.main_comment,
                            commission_rate: row.commission_rate,
                            is_cost_guide: row.is_cost_guide,
                            currency_rates: row.currency_rates,
                            company_id: row.company_id,
                            reservation_guide_color: row.reservation_guide_color,
                            tickets: []
                        };

                        // Add ticket if exists
                        if (row.id) {
                            // Parse rest amounts
                            const restAmounts = row.rest_amounts ? row.rest_amounts.split(';').map(rest => {
                                const [amount, currency, created_at] = rest.split('|');
                                return {
                                    amount: parseFloat(amount),
                                    currency,
                                    created_at
                                };
                            }) : [];

                            newReservation.tickets.push({
                                id: row.id,
                                reservation_id: row.reservation_id,
                                tour_name: row.tour_name,
                                tour_group_name: row.tour_group_name,
                                adult_count: row.adult_count,
                                child_count: row.child_count,
                                free_count: row.free_count,
                                currency: row.currency,
                                date: row.date,
                                comment: row.comment,
                                regions: row.regions,
                                guide_ref: row.guide_ref,
                                guide_name: row.guide_name,
                                provider_name: row.provider_name,
                                provider_ref: row.provider_ref,
                                time: row.time,
                                adult_price: row.adult_price,
                                half_price: row.half_price,
                                cancellation_reason: row.cancellation_reason,
                                status: row.status,
                                ticket_number: row.ticket_number,
                                total_cost: row.total_cost,
                                guide_adult_price: row.guide_adult_price,
                                guide_child_price: row.guide_child_price,
                                rest_amounts: restAmounts
                            });
                        }

                        acc.push(newReservation);
                    } else if (row.id) {
                        // Parse rest amounts
                        const restAmounts = row.rest_amounts ? row.rest_amounts.split(';').map(rest => {
                            const [amount, currency, created_at] = rest.split('|');
                            return {
                                amount: parseFloat(amount),
                                currency,
                                created_at
                            };
                        }) : [];

                        // Add ticket to existing reservation
                        reservation.tickets.push({
                            id: row.id,
                            reservation_id: row.reservation_id,
                            tour_name: row.tour_name,
                            tour_group_name: row.tour_group_name,
                            adult_count: row.adult_count,
                            child_count: row.child_count,
                            free_count: row.free_count,
                            currency: row.currency,
                            date: row.date,
                            comment: row.comment,
                            regions: row.regions,
                            guide_ref: row.guide_ref,
                            guide_name: row.guide_name,
                            provider_name: row.provider_name,
                            provider_ref: row.provider_ref,
                            time: row.time,
                            adult_price: row.adult_price,
                            half_price: row.half_price,
                            cancellation_reason: row.cancellation_reason,
                            status: row.status,
                            ticket_number: row.ticket_number,
                            total_cost: row.total_cost,
                            guide_adult_price: row.guide_adult_price,
                            guide_child_price: row.guide_child_price,
                            rest_amounts: restAmounts
                        });
                    }

                    return acc;
                }, []);

                console.log(`Processed ${reservations.length} reservations`);
                res.json(reservations);
            });
        } catch (error) {
            console.error('Error in reservations route:', error);
            res.status(500).json({ 
                error: 'Internal server error',
                details: error.message 
            });
        }
    });

    // Get all tour groups
    router.get('/tour-groups', async (req, res) => {
        try {
            console.log('Fetching tour groups...');
            
            const query = `
                SELECT DISTINCT tour_group_name 
                FROM reservation_tickets 
                WHERE tour_group_name IS NOT NULL 
                ORDER BY tour_group_name
            `;

            db.query(query, (error, results) => {
                if (error) {
                    console.error('Database error:', error);
                    return res.status(500).json({ 
                        error: 'Internal server error',
                        details: error.message 
                    });
                }

                const tourGroups = results.map(row => row.tour_group_name);
                console.log(`Found ${tourGroups.length} tour groups`);
                res.json(tourGroups);
            });
        } catch (error) {
            console.error('Error in tour groups route:', error);
            res.status(500).json({ 
                error: 'Internal server error',
                details: error.message 
            });
        }
    });

    // Get reservations by tour group
    router.get('/reservations/:tourGroup', async (req, res) => {
        try {
            const { tourGroup } = req.params;
            console.log(`Fetching reservations for tour group: ${tourGroup}`);
            
            const query = `
                SELECT 
                    t.id,
                    t.reservation_id,
                    t.tour_name,
                    t.tour_group_name,
                    t.adult_count,
                    t.child_count,
                    t.free_count,
                    t.currency,
                    t.date,
                    t.comment,
                    t.regions,
                    t.guide_ref,
                    t.guide_name,
                    t.provider_name,
                    t.provider_ref,
                    t.time,
                    t.adult_price,
                    t.half_price,
                    t.cancellation_reason,
                    t.status,
                    t.ticket_number,
                    t.total_cost,
                    t.guide_adult_price,
                    t.guide_child_price,
                    r.customer_name,
                    r.phone,
                    r.room_number,
                    r.hotel_name,
                    r.created_at,
                    r.ticket_count,
                    r.main_comment,
                    r.commission_rate,
                    r.is_cost_guide,
                    r.currency_rates,
                    r.company_id,
                    r.reservation_guide_color,
                    GROUP_CONCAT(
                        CONCAT(
                            tra.amount, '|',
                            tra.currency, '|',
                            tra.created_at
                        )
                        ORDER BY tra.created_at DESC
                        SEPARATOR ';'
                    ) as rest_amounts
                FROM reservation_tickets t
                LEFT JOIN reservations r ON t.reservation_id = r.id
                LEFT JOIN ticket_rest_amount tra ON t.id = tra.ticket_id
                WHERE t.tour_group_name = ? AND t.is_cost_provider = 0 AND t.status = 1
                GROUP BY 
                    t.id, t.reservation_id, t.tour_name, t.tour_group_name, 
                    t.adult_count, t.child_count, t.free_count, t.currency, 
                    t.date, t.comment, t.regions, t.guide_ref, t.guide_name, 
                    t.provider_name, t.provider_ref, t.time, t.adult_price, 
                    t.half_price, t.cancellation_reason, t.status, t.ticket_number,
                    t.total_cost, t.guide_adult_price, t.guide_child_price,
                    r.customer_name, r.phone, r.room_number, r.hotel_name,
                    r.created_at, r.ticket_count, r.main_comment, r.commission_rate,
                    r.is_cost_guide, r.currency_rates,
                    r.company_id, r.reservation_guide_color
                ORDER BY t.date DESC, t.id DESC
            `;

            db.query(query, [tourGroup], (error, results) => {
                if (error) {
                    console.error('Database error:', error);
                    return res.status(500).json({ 
                        error: 'Internal server error',
                        details: error.message 
                    });
                }

                console.log(`Found ${results.length} results for tour group ${tourGroup}`);

                // Group tickets by reservation
                const reservations = results.reduce((acc, row) => {
                    const reservation = acc.find(r => r.id === row.reservation_id);
                    
                    if (!reservation) {
                        // Create new reservation object
                        const newReservation = {
                            id: row.reservation_id,
                            customer_name: row.customer_name,
                            phone: row.phone,
                            room_number: row.room_number,
                            hotel_name: row.hotel_name,
                            created_at: row.created_at,
                            ticket_count: row.ticket_count,
                            main_comment: row.main_comment,
                            commission_rate: row.commission_rate,
                            is_cost_guide: row.is_cost_guide,
                            currency_rates: row.currency_rates,
                            company_id: row.company_id,
                            reservation_guide_color: row.reservation_guide_color,
                            tickets: []
                        };

                        // Add ticket if exists
                        if (row.id) {
                            // Parse rest amounts
                            const restAmounts = row.rest_amounts ? row.rest_amounts.split(';').map(rest => {
                                const [amount, currency, created_at] = rest.split('|');
                                return {
                                    amount: parseFloat(amount),
                                    currency,
                                    created_at
                                };
                            }) : [];

                            newReservation.tickets.push({
                                id: row.id,
                                reservation_id: row.reservation_id,
                                tour_name: row.tour_name,
                                tour_group_name: row.tour_group_name,
                                adult_count: row.adult_count,
                                child_count: row.child_count,
                                free_count: row.free_count,
                                currency: row.currency,
                                date: row.date,
                                comment: row.comment,
                                regions: row.regions,
                                guide_ref: row.guide_ref,
                                guide_name: row.guide_name,
                                provider_name: row.provider_name,
                                provider_ref: row.provider_ref,
                                time: row.time,
                                adult_price: row.adult_price,
                                half_price: row.half_price,
                                cancellation_reason: row.cancellation_reason,
                                status: row.status,
                                ticket_number: row.ticket_number,
                                total_cost: row.total_cost,
                                guide_adult_price: row.guide_adult_price,
                                guide_child_price: row.guide_child_price,
                                rest_amounts: restAmounts
                            });
                        }

                        acc.push(newReservation);
                    } else if (row.id) {
                        // Parse rest amounts
                        const restAmounts = row.rest_amounts ? row.rest_amounts.split(';').map(rest => {
                            const [amount, currency, created_at] = rest.split('|');
                            return {
                                amount: parseFloat(amount),
                                currency,
                                created_at
                            };
                        }) : [];

                        // Add ticket to existing reservation
                        reservation.tickets.push({
                            id: row.id,
                            reservation_id: row.reservation_id,
                            tour_name: row.tour_name,
                            tour_group_name: row.tour_group_name,
                            adult_count: row.adult_count,
                            child_count: row.child_count,
                            free_count: row.free_count,
                            currency: row.currency,
                            date: row.date,
                            comment: row.comment,
                            regions: row.regions,
                            guide_ref: row.guide_ref,
                            guide_name: row.guide_name,
                            provider_name: row.provider_name,
                            provider_ref: row.provider_ref,
                            time: row.time,
                            adult_price: row.adult_price,
                            half_price: row.half_price,
                            cancellation_reason: row.cancellation_reason,
                            status: row.status,
                            ticket_number: row.ticket_number,
                            total_cost: row.total_cost,
                            guide_adult_price: row.guide_adult_price,
                            guide_child_price: row.guide_child_price,
                            rest_amounts: restAmounts
                        });
                    }

                    return acc;
                }, []);

                console.log(`Processed ${reservations.length} reservations for tour group ${tourGroup}`);
                res.json(reservations);
            });
        } catch (error) {
            console.error('Error in reservations route:', error);
            res.status(500).json({ 
                error: 'Internal server error',
                details: error.message 
            });
        }
    });

    // Create provider collection
    router.post('/provider-collection', async (req, res) => {
        try {
            const {
                ticket_id,
                amount,
                currency,
                collection_date,
                provider_name,
                provider_ref,
                tour_name,
                tour_group_name,
                customer_name,
                hotel_name,
                room_number,
                guide_name,
                adult_count,
                child_count,
                free_count,
                adult_price,
                half_price,
                total_amount,
                comment,
                transaction_code,
                ticket_number
            } = req.body;

            // Start a transaction
            db.beginTransaction(err => {
                if (err) {
                    console.error('Transaction error:', err);
                    return res.status(500).json({ 
                        error: 'Internal server error',
                        details: err.message 
                    });
                }

                // First, get rest amounts for this ticket
                const getRestAmountsQuery = `
                    SELECT amount, currency, created_at
                    FROM ticket_rest_amount
                    WHERE ticket_id = ?
                    ORDER BY created_at DESC
                `;

                db.query(getRestAmountsQuery, [ticket_id], (error, restResults) => {
                    if (error) {
                        return db.rollback(() => {
                            console.error('Get rest amounts error:', error);
                            res.status(500).json({ 
                                error: 'Internal server error',
                                details: error.message 
                            });
                        });
                    }

                    // Format rest amounts as string
                    const restAmountsString = restResults.length > 0 ? 
                        restResults.map(rest => 
                            `${rest.amount} ${rest.currency}`
                        ).join(', ') : null;

                    // First, check if a safe record already exists for this transaction code
                    const checkSafeRecordQuery = `
                        SELECT id FROM safe_records 
                        WHERE transaction_no = ?
                    `;

                    db.query(checkSafeRecordQuery, [transaction_code], (error, results) => {
                        if (error) {
                            return db.rollback(() => {
                                console.error('Check safe record error:', error);
                                res.status(500).json({ 
                                    error: 'Internal server error',
                                    details: error.message 
                                });
                            });
                        }

                        // If safe record exists, update it
                        if (results.length > 0) {
                            const updateSafeRecordQuery = `
                                UPDATE safe_records 
                                SET account_name = ?,
                                    description = ?,
                                    currency = ?,
                                    amount = ?,
                                    payment_type = 'gider'
                                WHERE transaction_no = ?
                            `;

                            const safeRecordValues = [
                                provider_name,
                                comment || '',
                                currency,
                                total_amount,
                                transaction_code
                            ];

                            db.query(updateSafeRecordQuery, safeRecordValues, (error, results) => {
                                if (error) {
                                    return db.rollback(() => {
                                        console.error('Update safe record error:', error);
                                        res.status(500).json({ 
                                            error: 'Internal server error',
                                            details: error.message 
                                        });
                                    });
                                }
                            });
                        } else {
                            // If no safe record exists, create one
                            const insertSafeRecordQuery = `
                                INSERT INTO safe_records (
                                    transaction_no,
                                    account_name,
                                    created_at,
                                    description,
                                    payment_type,
                                    payment_method,
                                    currency,
                                    amount
                                ) VALUES (?, ?, NOW(), ?, 'gider', 'cash', ?, ?)
                            `;

                            const safeRecordValues = [
                                transaction_code,
                                provider_name,
                                comment || '',
                                currency,
                                total_amount
                            ];

                            db.query(insertSafeRecordQuery, safeRecordValues, (error, results) => {
                                if (error) {
                                    return db.rollback(() => {
                                        console.error('Insert safe record error:', error);
                                        res.status(500).json({ 
                                            error: 'Internal server error',
                                            details: error.message 
                                        });
                                    });
                                }
                            });
                        }

                        // Insert collection record with rest_amount
                        const insertQuery = `
                            INSERT INTO provider_collection (
                                ticket_id,
                                amount,
                                currency,
                                collection_date,
                                provider_name,
                                provider_ref,
                                tour_name,
                                tour_group_name,
                                customer_name,
                                hotel_name,
                                room_number,
                                guide_name,
                                adult_count,
                                child_count,
                                free_count,
                                adult_price,
                                half_price,
                                total_amount,
                                comment,
                                transaction_code,
                                ticket_number,
                                rest_amount,
                                created_at
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                        `;

                        const values = [
                            ticket_id,
                            amount,
                            currency,
                            collection_date,
                            provider_name,
                            provider_ref,
                            tour_name,
                            tour_group_name,
                            customer_name,
                            hotel_name,
                            room_number,
                            guide_name,
                            adult_count,
                            child_count,
                            free_count,
                            adult_price,
                            half_price,
                            total_amount,
                            comment,
                            transaction_code,
                            ticket_number,
                            restAmountsString
                        ];

                        db.query(insertQuery, values, (error, results) => {
                            if (error) {
                                return db.rollback(() => {
                                    console.error('Insert error:', error);
                                    res.status(500).json({ 
                                        error: 'Internal server error',
                                        details: error.message 
                                    });
                                });
                            }

                            // Update safe balance
                            const updateSafeQuery = `
                                UPDATE safe 
                                SET negativebalance = negativebalance + ?
                                WHERE name = ? AND type = 'cash'
                            `;

                            db.query(updateSafeQuery, [total_amount, currency], (error, results) => {
                                if (error) {
                                    return db.rollback(() => {
                                        console.error('Update safe error:', error);
                                        res.status(500).json({ 
                                            error: 'Internal server error',
                                            details: error.message 
                                        });
                                    });
                                }

                                // If no rows were affected in safe update, insert new record
                                if (results.affectedRows === 0) {
                                    const insertSafeQuery = `
                                        INSERT INTO safe (name, balance, negativebalance, type) 
                                        VALUES (?, 0, ?, 'cash')
                                    `;

                                    db.query(insertSafeQuery, [currency, total_amount], (error, results) => {
                                        if (error) {
                                            return db.rollback(() => {
                                                console.error('Insert safe error:', error);
                                                res.status(500).json({ 
                                                    error: 'Internal server error',
                                                    details: error.message 
                                                });
                                            });
                                        }

                                        db.commit(err => {
                                            if (err) {
                                                return db.rollback(() => {
                                                    console.error('Commit error:', err);
                                                    res.status(500).json({ 
                                                        error: 'Internal server error',
                                                        details: err.message 
                                                    });
                                                });
                                            }

                                            res.json({
                                                message: 'Provider collection created and safe balance updated successfully',
                                                collection_id: results.insertId
                                            });
                                        });
                                    });
                                } else {
                                    db.commit(err => {
                                        if (err) {
                                            return db.rollback(() => {
                                                console.error('Commit error:', err);
                                                res.status(500).json({ 
                                                    error: 'Internal server error',
                                                    details: err.message 
                                                });
                                            });
                                        }

                                        res.json({
                                            message: 'Provider collection created and safe balance updated successfully',
                                            collection_id: results.insertId
                                        });
                                    });
                                }
                            });
                        });
                    });
                });
            });
        } catch (error) {
            console.error('Error in provider collection route:', error);
            res.status(500).json({ 
                error: 'Internal server error',
                details: error.message 
            });
        }
    });

    // Get provider collections
    router.get('/provider-collections', async (req, res) => {
        try {
            console.log('Fetching provider collections...');
            
            const { transaction_code } = req.query;
            let query = `
                SELECT 
                    pc.*,
                    t.ticket_number,
                    t.comment as ticket_comment
                FROM provider_collection pc
                LEFT JOIN reservation_tickets t ON pc.ticket_id = t.id
            `;

            const queryParams = [];
            if (transaction_code) {
                query += ` WHERE pc.transaction_code = ?`;
                queryParams.push(transaction_code);
            }

            query += ` ORDER BY pc.created_at DESC`;

            db.query(query, queryParams, (error, results) => {
                if (error) {
                    console.error('Database error:', error);
                    return res.status(500).json({ 
                        error: 'Internal server error',
                        details: error.message 
                    });
                }

                console.log(`Found ${results.length} provider collections`);
                res.json(results);
            });
        } catch (error) {
            console.error('Error in provider collections route:', error);
            res.status(500).json({ 
                error: 'Internal server error',
                details: error.message 
            });
        }
    });

    // Delete provider collection and reset provider cost status
    router.delete('/provider-collection/:id', async (req, res) => {
        try {
            const { id } = req.params;
            console.log(`Deleting provider collection with ID: ${id}`);

            // First get the collection details
            const getCollectionQuery = `
                SELECT pc.*, t.tour_name, r.customer_name 
                FROM provider_collection pc
                LEFT JOIN reservation_tickets t ON pc.ticket_id = t.id
                LEFT JOIN reservations r ON t.reservation_id = r.id
                WHERE pc.id = ?
            `;

            db.query(getCollectionQuery, [id], (error, results) => {
                if (error) {
                    console.error('Database error:', error);
                    return res.status(500).json({ 
                        error: 'Internal server error',
                        details: error.message 
                    });
                }

                if (results.length === 0) {
                    return res.status(404).json({
                        error: 'Provider collection not found'
                    });
                }

                const { ticket_id, amount, currency, transaction_code, tour_name, customer_name } = results[0];

                // Start a transaction
                db.beginTransaction(err => {
                    if (err) {
                        console.error('Transaction error:', err);
                        return res.status(500).json({ 
                            error: 'Internal server error',
                            details: err.message 
                        });
                    }

                    // Delete the collection
                    const deleteQuery = `
                        DELETE FROM provider_collection
                        WHERE id = ?
                    `;

                    db.query(deleteQuery, [id], (error, results) => {
                        if (error) {
                            return db.rollback(() => {
                                console.error('Delete error:', error);
                                res.status(500).json({ 
                                    error: 'Internal server error',
                                    details: error.message 
                                });
                            });
                        }

                        // Update safe balance
                        const updateSafeQuery = `
                            UPDATE safe 
                            SET negativebalance = negativebalance - ?
                            WHERE name = ? AND type = 'cash'
                        `;

                        db.query(updateSafeQuery, [amount, currency], (error, results) => {
                            if (error) {
                                return db.rollback(() => {
                                    console.error('Update safe error:', error);
                                    res.status(500).json({ 
                                        error: 'Internal server error',
                                        details: error.message 
                                    });
                                });
                            }

                            // Delete safe record with matching transaction code
                            const deleteSafeRecordQuery = `
                                DELETE FROM safe_records
                                WHERE transaction_no = ?
                            `;

                            db.query(deleteSafeRecordQuery, [transaction_code], (error, results) => {
                                if (error) {
                                    return db.rollback(() => {
                                        console.error('Delete safe record error:', error);
                                        res.status(500).json({ 
                                            error: 'Internal server error',
                                            details: error.message 
                                        });
                                    });
                                }

                                // Reset provider cost status
                                const updateQuery = `
                                    UPDATE reservation_tickets
                                    SET is_cost_provider = 0
                                    WHERE id = ?
                                `;

                                db.query(updateQuery, [ticket_id], (error, results) => {
                                    if (error) {
                                        return db.rollback(() => {
                                            console.error('Update error:', error);
                                            res.status(500).json({ 
                                                error: 'Internal server error',
                                                details: error.message 
                                            });
                                        });
                                    }

                                    // Commit the transaction
                                    db.commit(err => {
                                        if (err) {
                                            return db.rollback(() => {
                                                console.error('Commit error:', err);
                                                res.status(500).json({ 
                                                    error: 'Internal server error',
                                                    details: err.message 
                                                });
                                            });
                                        }

                                        res.json({
                                            message: 'Provider collection deleted, cost status reset, and safe balance updated successfully'
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        } catch (error) {
            console.error('Error in delete provider collection route:', error);
            res.status(500).json({ 
                error: 'Internal server error',
                details: error.message 
            });
        }
    });

    // Update provider cost status
    router.put('/update-provider-cost-status', async (req, res) => {
        try {
            const { ticketIds } = req.body;

            if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
                return res.status(400).json({
                    error: 'Invalid ticket IDs provided'
                });
            }

            const query = `
                UPDATE reservation_tickets
                SET is_cost_provider = 1
                WHERE id IN (?)
            `;

            db.query(query, [ticketIds], (error, results) => {
                if (error) {
                    console.error('Database error:', error);
                    return res.status(500).json({ 
                        error: 'Internal server error',
                        details: error.message 
                    });
                }

                res.json({
                    message: 'Provider cost status updated successfully',
                    affectedRows: results.affectedRows
                });
            });
        } catch (error) {
            console.error('Error in update provider cost status route:', error);
            res.status(500).json({ 
                error: 'Internal server error',
                details: error.message 
            });
        }
    });

    // Get currency rates
    router.get('/currency-rates', async (req, res) => {
        try {
            const query = `
                SELECT currency_code as currency, buying_rate as rate 
                FROM currency_rates 
                ORDER BY currency_name
            `;

            db.query(query, (error, results) => {
                if (error) {
                    console.error('Database error:', error);
                    return res.status(500).json({ 
                        error: 'Internal server error',
                        details: error.message 
                    });
                }

                const rates = results.reduce((acc, row) => {
                    acc[row.currency] = parseFloat(row.rate);
                    return acc;
                }, {});

                res.json({ rates });
            });
        } catch (error) {
            console.error('Error in currency rates route:', error);
            res.status(500).json({ 
                error: 'Internal server error',
                details: error.message 
            });
        }
    });

    // Update currency rates
    router.put('/currency-rates', async (req, res) => {
        try {
            const { rates } = req.body;

            if (!rates || typeof rates !== 'object') {
                return res.status(400).json({
                    error: 'Invalid rates data'
                });
            }

            // Start a transaction
            db.beginTransaction(err => {
                if (err) {
                    console.error('Transaction error:', err);
                    return res.status(500).json({ 
                        error: 'Internal server error',
                        details: err.message 
                    });
                }

                // Update rates
                const updatePromises = Object.entries(rates).map(([currency_code, buying_rate]) => {
                    return new Promise((resolve, reject) => {
                        const updateQuery = `
                            UPDATE currency_rates 
                            SET buying_rate = ? 
                            WHERE currency_code = ?
                        `;
                        
                        db.query(updateQuery, [buying_rate, currency_code], (error) => {
                            if (error) {
                                reject(error);
                            } else {
                                resolve();
                            }
                        });
                    });
                });

                Promise.all(updatePromises)
                    .then(() => {
                        db.commit(err => {
                            if (err) {
                                return db.rollback(() => {
                                    console.error('Commit error:', err);
                                    res.status(500).json({ 
                                        error: 'Internal server error',
                                        details: err.message 
                                    });
                                });
                            }

                            res.json({ 
                                message: 'Currency rates updated successfully',
                                rates 
                            });
                        });
                    })
                    .catch(error => {
                        db.rollback(() => {
                            console.error('Update error:', error);
                            res.status(500).json({ 
                                error: 'Internal server error',
                                details: error.message 
                            });
                        });
                    });
            });
        } catch (error) {
            console.error('Error in update currency rates route:', error);
            res.status(500).json({ 
                error: 'Internal server error',
                details: error.message 
            });
        }
    });

    return router;
};
