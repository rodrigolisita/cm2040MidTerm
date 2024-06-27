// index.js
// Core Modules
require('dotenv').config();
const path = require('path');

// Third-Party Libraries
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const helmet = require('helmet');
const session = require('express-session');
const flash = require('connect-flash');

// My Modules
const { setupMiddleware, authenticate } = require('./middleware');
const errorHandler = require('./errorHandler');
const db = require('./db');
const { usersRoutes, getAuthors } = require('./routes/users');

const app = express();

// Templating Engine
app.use(expressLayouts);
app.set("layout", "./layouts/full-width");
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.locals.siteTitle = "My Awesome Blog HomePage"; // Set in app.locals

// Custom Middleware
setupMiddleware(app, db); 

// Serve Static Files
app.use(express.static(path.join(__dirname, "public")));

// Routes
const indexRoutes = require('./routes/index');
const blogRoutes = require('./routes/blog');
app.use('/', indexRoutes(db, app));  
app.use("/users", usersRoutes(db));
app.use('/blog', blogRoutes(db, app));

// Error Handler Middleware
app.use(errorHandler);

// Start Server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
