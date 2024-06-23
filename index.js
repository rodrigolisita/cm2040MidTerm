// index.js
require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const helmet = require('helmet');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');


const app = express();
const { setupMiddleware, authenticate } = require('./middleware');
const errorHandler = require('./errorHandler');
const db = require('./db');
//const usersRoutes = require('./routes/users'); 

const { usersRoutes, getAuthors } = require('./routes/users');

const blogRoutes = require('./routes/blog');

// Templating Engine
app.use(expressLayouts);
app.set("layout", "./layouts/full-width");
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");


// Custom Middleware
setupMiddleware(app, db); 

// Serve Static Files (after other routes to avoid conflicts)
app.use(express.static(path.join(__dirname, "public")));

// Routes
const routes = require('./routes/index')(db);
app.use('/', routes); // Mount the routes in the index file

// Users Routes
app.use("/users", usersRoutes(db));

// Blog Routes (Apply Authentication Middleware to /blog)
  app.use('/blog', blogRoutes(db)); 
//  app.use('/blog/', authenticate, blogRoutes(db)); // Apply authenticate before the blog routes

// Error Handler Middleware (should be the last middleware)
app.use(errorHandler);

// Start Server
const port = process.env.PORT || 3000;
app.listen(port, () => {
 console.log(`Example app listening on port ${port}`);
});