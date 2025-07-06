const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

module.exports = (db) => {
  // Register endpoint
  router.post('/register', async (req, res) => {
    const { username, email, password, verificationCode } = req.body;
    
    const correctVerificationCode = "max19181700";
    
    if (verificationCode !== correctVerificationCode) {
      res.status(400).json({ error: "Invalid verification code" });
      return;
    }
    
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
      db.query(sql, [username, email, hashedPassword], (err, result) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.status(201).json({ message: "User registered successfully" });
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Login endpoint
  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    const sql = "SELECT * FROM users WHERE email = ?";
    db.query(sql, [email], async (err, results) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (results.length === 0) {
        res.status(401).json({ error: "User not found" });
        return;
      }
      
      const user = results[0];
      const validPassword = await bcrypt.compare(password, user.password);
      
      if (!validPassword) {
        res.status(401).json({ error: "Invalid password" });
        return;
      }
      
      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email 
        } 
      });
    });
  });

  return router;
}; 