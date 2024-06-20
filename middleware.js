// middleware.js
const bodyParser = require("body-parser");

function setupMiddleware(app) { // Define the function
  app.use(bodyParser.urlencoded({ extended: true }));
  // ...other middleware...
};

module.exports = setupMiddleware; // Export the function
