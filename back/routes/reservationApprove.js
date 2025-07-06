const express = require('express');
const router = express.Router();

module.exports = function(db) {
  // Get all pending reservations
  router.get('/', async (req, res) => {
    try {
      const { startDate, endDate, showStatus } = req.query;
      
      let query = `
        SELECT * FROM reservation_approve
        WHERE 1=1
      `;
      
      const params = [];
      
      if (startDate && endDate) {
        query += ` AND date BETWEEN ? AND ?`;
        params.push(startDate, endDate);
      }
      
      if (showStatus !== undefined) {
        query += ` AND show_status = ?`;
        params.push(parseInt(showStatus));
      } else {
        query += ` AND show_status = 1`;
        params.push(1);
      }
      
      query += ` ORDER BY created_at DESC`;
      
      db.query(query, params, (err, results) => {
        if (err) {
          console.error('Error fetching reservation approvals:', err);
          return res.status(500).json({ error: 'Database error', details: err.message });
        }
        
        res.json(results);
      });
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  });

  // Get a specific reservation by ID
  router.get('/:id', (req, res) => {
    const { id } = req.params;
    
    db.query('SELECT * FROM reservation_approve WHERE id = ?', [id], (err, results) => {
      if (err) {
        console.error('Error fetching reservation approval:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ error: 'Reservation not found' });
      }
      
      res.json(results[0]);
    });
  });

  // Update reservation status (guide/provider approval)
  router.patch('/:id/status', (req, res) => {
    const { id } = req.params;
    const { type, status } = req.body;
    
    let updateField = '';
    if (type === 'guide') {
      updateField = 'guide_status';
    } else if (type === 'provider') {
      updateField = 'provider_status';
    } else {
      return res.status(400).json({ error: 'Invalid approval type' });
    }
    
    // status değerini 0 veya 1 olarak ayarla
    const statusValue = status === 'approved' ? 1 : 0;
    
    const query = `
      UPDATE reservation_approve 
      SET ${updateField} = ?
      WHERE id = ?
    `;
    
    db.query(query, [statusValue, id], (err, result) => {
      if (err) {
        console.error('Error updating reservation status:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Reservation not found' });
      }
      
      res.json({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} status updated successfully` });
    });
  });

  // Delete completed reservations
  router.delete('/completed', (req, res) => {
    try {
      // Bugünün tarihini al
      const today = new Date().toISOString().split('T')[0];
      
      const query = `
        DELETE FROM reservation_approve 
        WHERE date < ?
      `;
      
      db.query(query, [today], (err, result) => {
        if (err) {
          console.error('Error deleting completed reservations:', err);
          return res.status(500).json({ 
            error: 'Database error', 
            details: err.message 
          });
        }
        
        res.json({ 
          message: `${result.affectedRows} completed reservations deleted successfully` 
        });
      });
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ 
        error: 'Server error', 
        details: error.message 
      });
    }
  });

  // Update reservation details
  router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { 
      customer_name, phone, hotel_name, room_number, guide_name, guide_phone,
      adult_count, child_count, free_count, rest_amount, time, ticket_no, date,
      description
    } = req.body;
    
    const query = `
      UPDATE reservation_approve 
      SET 
        customer_name = ?,
        phone = ?,
        hotel_name = ?,
        room_number = ?,
        guide_name = ?,
        guide_phone = ?,
        adult_count = ?,
        child_count = ?,
        free_count = ?,
        rest_amount = ?,
        time = ?,
        ticket_no = ?,
        date = ?,
        description = ?
      WHERE id = ?
    `;
    
    const params = [
      customer_name, phone, hotel_name, room_number, guide_name, guide_phone,
      adult_count, child_count, free_count, rest_amount, time, ticket_no, date,
      description,
      id
    ];
    
    db.query(query, params, (err, result) => {
      if (err) {
        console.error('Error updating reservation details:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Reservation not found' });
      }
      
      res.json({ message: 'Reservation updated successfully' });
    });
  });

  return router;
}; 