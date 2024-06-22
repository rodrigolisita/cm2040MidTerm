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
// Security Middleware
app.use(helmet()); // Apply Helmet for security headers
app.use(express.json()); // Parse JSON bodies

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

  app.use(bodyParser.urlencoded({ extended: true }));
  // ...other middleware...
  app.use(setCSP);
  //app.use((req, res, next) => {
  //  res.setHeader('Content-Security-Policy', `script-src 'nonce-${res.locals.nonce}' 'self';`);
  //  next();
  //});

} catch (err) {
  console.error("Error setting up middleware:", err);
  //errorHandler(err, req, res, null);
  throw err; 
}

};

function setCSP(req, res, next) {
  res.setHeader(
      'Content-Security-Policy', 
      `script-src 'nonce-${res.locals.nonce}' 'self';`
  );
  next();
}

async function authenticate(req, res, next) {
  if (req.session.isAuthenticated) {
      return next();
  }
  res.redirect('/blog/login');
}

//module.exports = setupMiddleware; // Export the function
module.exports = { setupMiddleware, authenticate, setCSP }; // Export BOTH functions

