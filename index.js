/**
* index.js
* This is your main app entry point
*/

// Set up express, bodyparser and EJS
require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const helmet = require('helmet'); // For security
const app = express();
const setupMiddleware = require('./middleware');
const errorHandler = require('./errorHandler');


// Static Files
app.use(express.static(__dirname + '/public'));

// Templating Engine
app.use(expressLayouts);
app.set('layout','./layouts/full-width')
app.set('view engine', 'ejs'); 
app.set("views", __dirname + "/views");

//Middleware setup
app.use(helmet());
app.use(express.json()); // Parse JSON bodies

try {
  setupMiddleware(app); 
} catch (err) {
  console.error("Error setting up middleware:", err);
  errorHandler(err, req, res, null); 
}

// Set up SQLite
const db = require('./db');

// Navigation
//require("./routes/main")(app, db);

// Users Routes
const usersRoutes = require('./routes/users'); 
app.use('/users', usersRoutes(db));

//Blog Routes
const blogRoutes = require('./routes/blog');
app.use('/blog', blogRoutes(db)); 

// Routes (using the combined routes/index.js file)
const routes = require('./routes/index')(db);
app.use('/', routes);

// Error Handler Middleware (404 and others)
app.use(errorHandler);

// Start Server
//app.listen(config.port, () => {
//    console.log(`Example app listening on port ${config.port}`);
//  });
app.listen(process.env.PORT || 3000, () => {
    console.log(`Example app listening on port ${process.env.PORT || 3000}`);
  });

