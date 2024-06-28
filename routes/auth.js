// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const { getAuthors } = require('./users'); // Import getAuthors

module.exports = (db) => {

  // GET /blog/login
  router.get('/login', async (req, res) => {
    const title = req.session.title || 'Login';
    const authors = await getAuthors(db); // Fetch authors
    res.render('login', { 
      message: req.flash('error'),
      title: title,
      authors: authors
    });
  });

  router.post('/login', async (req, res) => {
    const { author, password } = req.body;
    
    try {
        // 1. Fetch user from the database
        const user = await new Promise((resolve, reject) => {
            db.get("SELECT * FROM users WHERE user_name = ?", [author], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        const hashedPassword = await bcrypt.hash(password, 10);
        const trimmedPassword = password.trim();
        const trimmedHashedPassword = hashedPassword.trim();
        const match = await bcrypt.compare(trimmedPassword, trimmedHashedPassword);
       
        console.log("brcypt Password comparison result at login:", match); // Output: true or false
      
    
        // 2. Check if user exists and verify password
        if (user && (match || password == user.password)) {
   
            req.session.isAuthenticated = true;
            req.session.userName = user.user_name;
            req.session.userId = user.user_id;
            req.session.siteTitle = "Authors Page";
            res.redirect('/blog'); // Redirect to the blog after successful login
        
        } else {
            req.flash('error', 'Invalid credentials.');
            res.redirect('/blog/login');
        }
    } catch (err) {
        // Handle potential errors
        console.error('Error during login:', err);
        res.status(500).render('error', { message: 'Error during login', error: err }); // Pass error to the view
    }
  });  

  // GET /blog/logout
  router.get('/logout', (req, res) => {
    req.session.isAuthenticated = false;
    req.flash('success', 'Logged out successfully!');
    res.redirect('/blog/login'); 
  });

  return router;
};