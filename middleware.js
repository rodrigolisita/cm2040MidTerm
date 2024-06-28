// middleware.js
const bodyParser = require("body-parser");
const crypto = require('crypto'); // Import crypto module
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const helmet = require('helmet');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const errorHandler = require('./errorHandler');

function setupMiddleware(app, db) { // Define the function
  try {

  // Generate nonce for Content Security Policy
  app.use((req, res, next) => {
    res.locals.nonce = crypto.randomBytes(16).toString('hex');
    next();
  });    
    
  // Security Middleware
  app.use(helmet.hsts({
    maxAge: 15552000, // 180 days in seconds
    preload: true 
  }));
  app.use(express.json()); // Parse JSON bodies

  app.use(bodyParser.urlencoded({ extended: true }));

  // Session Middleware (after helmet and body parser)
  app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: { 
      // Update this line for development (or use a proper HTTPS setup)
      secure: process.env.NODE_ENV === "production",  // Secure cookie only in production
      sameSite: 'strict',
      httpOnly: true
    }
  }));

  app.use(flash()); 


  // Custom Middleware for Content Security Policy (CSP)
  app.use(setCSP);


  } catch (err) {
    console.error("Error setting up middleware:", err);
    //errorHandler(err, req, res, null);
    throw err; 
  }

};

function setCSP(req, res, next) {
  const nonce = res.locals.nonce;
  res.setHeader('Content-Security-Policy', `script-src 'nonce-${nonce}' 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; font-src 'self';`); // Add other directives
  res.setHeader('X-Content-Type-Options', 'nosniff'); // Add this line
  next();
}

async function authenticate(req, res, next) {
  if (req.session.isAuthenticated) {
      return next();
  }
  res.redirect('/blog/login');
}

module.exports = { setupMiddleware, authenticate, setCSP }; // Export BOTH functions
