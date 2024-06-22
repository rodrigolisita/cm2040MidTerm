// index.js
require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const helmet = require('helmet');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');


const app = express();
//const setupMiddleware = require('./middleware');
const { setupMiddleware, authenticate } = require('./middleware');
const errorHandler = require('./errorHandler');
const db = require('./db');
const usersRoutes = require('./routes/users'); 
const blogRoutes = require('./routes/blog');

// Templating Engine
app.use(expressLayouts);
app.set("layout", "./layouts/full-width");
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

// Security Middleware
//app.use(helmet()); // Apply Helmet for security headers
//app.use(express.json()); // Parse JSON bodies

// Session Middleware (after helmet and body parser)
//app.use(session({
//  secret: process.env.SECRET_KEY,
//  resave: false,
//  saveUninitialized: false,
//  cookie: { 
    // Update this line for development (or use a proper HTTPS setup)
//    secure: process.env.NODE_ENV === "production",  // Secure cookie only in production
//    sameSite: 'strict',
//    httpOnly: true
//  }
//}));

//app.use(flash()); 

// Your Custom Middleware
//try {
  setupMiddleware(app, db); 

// Set the Content Security Policy header
//app.use((req, res, next) => {
//  res.setHeader('Content-Security-Policy', `script-src 'nonce-${res.locals.nonce}' 'self';`);
//  next();
//});


//} catch (err) {
//  console.error("Error setting up middleware:", err);
//  errorHandler(err, req, res, null); 
//}

// Routes
const routes = require('./routes/index')(db);
app.use('/', routes); // Mount the routes in the index file

// Users Routes
app.use("/users", usersRoutes(db));

// Serve Static Files (after other routes to avoid conflicts)
app.use(express.static(path.join(__dirname, "public")));


// index.js (within the checkAuthentication middleware)











// Blog Routes (Apply Authentication Middleware to /blog)
  //app.use('/blog/login', blogRoutes(db)); // Login route
  //app.use('/blog/logout', blogRoutes(db)); // Logout route
  //app.use('/blog', checkAuthentication, blogRoutes(db)); 
  app.use('/blog', blogRoutes(db)); 
//  app.use('/blog/', authenticate, blogRoutes(db)); // Apply authenticate before the blog routes


//  app.use('/blog', checkAuthentication, blogRoutes(db)); // Only authenticated users can access /blog



// Error Handler Middleware (should be the last middleware)
app.use(errorHandler);

// Start Server
const port = process.env.PORT || 3000;
app.listen(port, () => {
 console.log(`Example app listening on port ${port}`);
});