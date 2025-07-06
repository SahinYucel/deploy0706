const express = require('express');
const router = express.Router();

module.exports = function(db) {
  // Get all provider approvals with pagination and filters
  router.get('/', async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        startDate, 
        endDate, 
        status,
        search,
        guide_ref 
      } = req.query;

      if (!guide_ref) {
        return res.status(400).json({ 
          success: false, 
          message: 'Rehber kodu (guide_ref) zorunludur' 
        });
      }

      const offset = (page - 1) * limit;
      
      let query = `
        SELECT 
          ra.*
        FROM reservation_approve ra
        WHERE 1=1
        AND ra.show_status = 1
        AND ra.guide_ref = ?
      `;
      
      const params = [guide_ref];
      
      if (startDate && endDate) {
        query += ` AND ra.created_at BETWEEN ? AND ?`;
        params.push(startDate, endDate);
      }
      
      if (status !== undefined) {
        query += ` AND ra.status = ?`;
        params.push(parseInt(status));
      }

      if (search) {
        query += ` AND (
          ra.customer_name LIKE ? OR
          ra.phone LIKE ? OR
          ra.tour_name LIKE ?
        )`;
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam);
      }
      
      // Get total count for pagination - separate query without tour_group_name
      let countQuery = `
        SELECT COUNT(*) as total
        FROM reservation_approve ra
        WHERE 1=1
        AND ra.show_status = 1
        AND ra.guide_ref = ?
      `;
      
      // Add the same conditions to count query
      if (startDate && endDate) {
        countQuery += ` AND ra.created_at BETWEEN ? AND ?`;
      }
      if (status !== undefined) {
        countQuery += ` AND ra.status = ?`;
      }
      if (search) {
        countQuery += ` AND (
          ra.customer_name LIKE ? OR
          ra.phone LIKE ? OR
          ra.tour_name LIKE ?
        )`;
      }

      db.query(countQuery, params, (err, countResult) => {
        if (err) {
          console.error('Error getting total count:', err);
          return res.status(500).json({ error: 'Database error', details: err.message });
        }

        const total = countResult[0].total;
        
        // Add pagination to main query
        query += ` ORDER BY ra.created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), offset);
        
        db.query(query, params, (err, results) => {
          if (err) {
            console.error('Error fetching provider approvals:', err);
            return res.status(500).json({ error: 'Database error', details: err.message });
          }
          
          console.log('Query results:', JSON.stringify(results, null, 2));
          
          res.json({
            success: true,
            data: results,
            pagination: {
              total,
              page: parseInt(page),
              limit: parseInt(limit),
              totalPages: Math.ceil(total / limit)
            }
          });
        });
      });
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  });

  // Get a specific provider approval by ID
  router.get('/:id', (req, res) => {
    const { id } = req.params;
    
    const query = `
      SELECT 
        ra.*
      FROM reservation_approve ra
      WHERE ra.id = ?
      AND ra.show_status = 1
    `;
    
    db.query(query, [id], (err, results) => {
      if (err) {
        console.error('Error fetching provider approval:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ error: 'Provider approval not found' });
      }
      
      res.json({
        success: true,
        data: results[0]
      });
    });
  });

  // Update provider approval status
  router.patch('/:id/status', (req, res) => {
    const { id } = req.params;
    const { guide_status } = req.body;
    
    const query = `
      UPDATE reservation_approve 
      SET guide_status = ?
      WHERE id = ?
    `;
    
    db.query(query, [guide_status, id], (err, result) => {
      if (err) {
        console.error('Error updating provider approval status:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Provider approval not found' });
      }
      
      res.json({ 
        success: true,
        message: 'Provider approval status updated successfully' 
      });
    });
  });

  // Update provider approval details
  router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { 
      customer_name,
      phone,
      hotel_name,
      room_number,
      adult_count,
      child_count,
      free_count,
      total_amount,
      notes
    } = req.body;
    
    const query = `
      UPDATE reservation_approve 
      SET 
        customer_name = ?,
        phone = ?,
        hotel_name = ?,
        room_number = ?,
        adult_count = ?,
        child_count = ?,
        free_count = ?,
        total_amount = ?,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const params = [
      customer_name,
      phone,
      hotel_name,
      room_number,
      adult_count,
      child_count,
      free_count,
      total_amount,
      notes,
      id
    ];
    
    db.query(query, params, (err, result) => {
      if (err) {
        console.error('Error updating provider approval details:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Provider approval not found' });
      }
      
      res.json({ 
        success: true,
        message: 'Provider approval updated successfully' 
      });
    });
  });

  // Delete provider approval
  router.delete('/:id', (req, res) => {
    const { id } = req.params;
    
    db.query('DELETE FROM reservation_approve WHERE id = ?', [id], (err, result) => {
      if (err) {
        console.error('Error deleting provider approval:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Provider approval not found' });
      }
      
      res.json({ 
        success: true,
        message: 'Provider approval deleted successfully' 
      });
    });
  });

  return router;
};