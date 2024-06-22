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

  router.get("/edit-user/:id", (req, res) => {
    const userId = req.params.id;

    db.get("SELECT * FROM users WHERE user_id = ?", [userId], (err, user) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).send("Internal Server Error");
      } else if (!user) {
        return res.status(404).send("User not found");
      }
      res.render("edit-user.ejs", {
        layout: "./layouts/full-width",
        title: "Edit user",
        user: user,
      });
    });
  });

  router.post("/edit-user/:id", (req, res) => {
    const userId = req.params.id;
    const { user_name, email_address } = req.body;

    // Input validation (add more as needed)
    if (!user_name || !email_address) {
      return res.status(400).send("User name and email address are required.");
    }

    db.run(
      "UPDATE users SET user_name = ?, email_address = ? WHERE user_id = ?",
      [user_name, email_address, userId],
      function (err) {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).send("Internal Server Error");
        }
        res.redirect("/users/edit-users");
      }
    );
  });

  /**
   * @desc Display all the users
   */
  router.get("/edit-users", (req, res) => {
    db.all("SELECT * FROM users", (err, users) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send('Internal Server Error');
      }
      res.render("edit-users.ejs", {
        layout: './layouts/full-width',
        title: "List users",
        users: users 
      });
    });
  });

  router.get("/list-authors", (req, res) => {
    db.all("SELECT * FROM users", (err, users) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send('Internal Server Error');
      }
      res.render("list-authors.ejs", {
        layout: './layouts/full-width',
        title: "List users",
        users: users 
      });
    });
  });

  /**
   * @desc Add a new user to the database based on data from the submitted form
   */
  router.post("/add-user", (req, res) => {
    const { user_name, email_address } = req.body; 

    // Input validation
    if (!user_name || !email_address) {
      return res.status(400).send("User name and email address are required.");
    }

    const query = "INSERT INTO users (user_name, email_address) VALUES (?, ?);";
    db.run(query, [user_name, email_address], function (err) {
      if (err) {
        console.error('Database error:', err.message); 
        return res.status(500).send("Internal Server Error");
      } 
      res.redirect('/users/edit-users'); 
    });
  });

  router.post("/delete-user/:id", (req, res) => {
    const userId = req.params.id;

    console.log("Delete request received for user ID:", userId); 

    db.run("DELETE FROM users WHERE user_id = ?", [userId], function (err) {
      if (err) {
        console.error("Error deleting user:", err.message); 
        return res.status(500).send("Internal Server Error");
      }
      res.redirect("/users/edit-users");
    });
  });

  return router; 
};
