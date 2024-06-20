const express = require("express");
const router = express.Router();


// Export a function that takes the db connection as an argument
module.exports = function (db) { // Receive db from index.js

  /**
   * @desc Displays a page with a form for creating a user record
   */
  router.get("/add-user", (req, res) => {
    res.render("add-user.ejs", {
      title: "Add user",
      layout: './layouts/full-width',
    });
  });

  /**
   * @desc Display all the users
   */
  router.get("/list-users", (req, res) => {
    db.all("SELECT * FROM users", (err, rows) => { // Now using the passed-in db object
      if (err) {
        console.error('Database error:', err);
        res.status(500).send('Internal Server Error');
      } else {
        res.render("list-users.ejs", {
          layout: './layouts/full-width',
          title: "List users",
          users: rows 
        });
      }
    });
  });

  /**
   * @desc Add a new user to the database based on data from the submitted form
   */
  router.post("/add-user", (req, res) => {
    // ... (input validation would go here) ...
    
    query = "INSERT INTO users (user_name) VALUES( ? );";
    query_parameters = [req.body.user_name];

    db.run(query, query_parameters, function (err) { // Using the passed-in db object
      if (err) {
        console.error('Database error:', err);
        res.status(500).send('Internal Server Error');
      } else {
        res.redirect('/users/list-users'); 
      }
    });
  });

  return router; // Return the router after setting up routes
};
