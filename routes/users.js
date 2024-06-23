const express = require("express");
const router = express.Router();
const bcrypt = require('bcrypt'); // Import bcrypt
const xss = require('xss'); // Install and require 'xss' if not already installed


async function getAuthors(db) {
  return new Promise((resolve, reject) => {
    db.all("SELECT user_id, user_name FROM users", (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}



// Export a function that takes the db connection as an argument
//module.exports = function (db) { // Receive db from index.js
function usersRoutes(db){


  /**
   * @desc Displays a page with a form for creating a user record
   */
  router.get("/add-user", (req, res) => {
    //const userName = req.session.userName;
    res.render("add-user.ejs", {
      title: "Add user",
      layout: './layouts/full-width',
      loggedUser: req.session.userName
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

  router.post("/edit-user/:id", async (req, res) => {
    const userId = req.params.id;
    const { user_name, email_address, oldpassword, newpassword } = req.body;
    req.session.userName = user_name;
  
    // Input validation (add more as needed)
    if (!user_name || !email_address || !oldpassword || !newpassword) {
      return res.status(400).send("User name, email address, old and new passwords are required.");
    }
    try {
      // 1. Fetch the current user's data
      
      const currentUser = await new Promise((resolve, reject) => { // <-- Now we can use await
        db.get("SELECT * FROM users WHERE user_id = ?", [userId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      if (!currentUser) {
        return res.status(404).send("User not found");
      }
      // 2. Verify the old password
      const passwordMatch = await bcrypt.compare(oldpassword, currentUser.password); // <-- await here too
      if(currentUser.user_name == "root" ||
        currentUser.user_name == "Simon Star" ||
        currentUser.user_name == "Dianne Dean" ||
        currentUser.user_name == "Harry Hilbert")
        {if(oldpassword !== currentUser.password && !passwordMatch){
          return res.status(401).send("Incorrect old password");
        }
      }else{
        if(!passwordMatch){return res.status(401).send("Incorrect old password");}
      }

      // 3. Hash the new password
      const hashedNewPassword = await bcrypt.hash(newpassword, 10); // <-- and await here

      // 4. Sanitize input before inserting into the database
      const sanitizedUserName = xss(user_name);
      const sanitizedEmail = xss(email_address);

      // 5. Update the user's information
      const updateQuery = "UPDATE users SET user_name = ?, email_address = ?, password = ? WHERE user_id = ?";

      db.run(
        updateQuery,
        //[sanitizedUserName, sanitizedEmail, newpassword, userId],
        [sanitizedUserName, sanitizedEmail, hashedNewPassword, userId],
        function (err) {
          if (err) {
            console.error("Database error:", err);
            return res.status(500).send("Internal Server Error");
          }
          res.redirect("/users/edit-users");
        }
      );
  } catch (err) {
    console.error("Error editing user:", err);
    res.status(500).send("Internal Server Error");
  }
  });

  /**
   * @desc Display all the users
   */
  router.get("/edit-users", (req, res) => {
    let userName = req.session.userName;
    db.all("SELECT * FROM users", (err, users) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send('Internal Server Error');
      }
      res.render("edit-users.ejs", {
        layout: './layouts/full-width',
        title: "List users",
        users: users,
        loggedUser: userName
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
    
    const { user_name, email_address, password } = req.body;

    // Input validation
    if (!user_name || !email_address || !password) { // Check if ANY field is missing
      return res.status(400).send("User name, email address, and password are required.");
    }

    // Sanitize input before inserting into the database
    const sanitizedUserName = xss(user_name);
    const sanitizedEmail = xss(email_address);
    const hashedPassword = bcrypt.hashSync(password, 10);    
  
    const query = "INSERT INTO users (user_name, email_address, password) VALUES (?, ?, ?);";

    //db.run(query, [user_name, email_address, hashedPassword], function (err) { 
    //Use the above for hashed passwords.
    db.run(query,[sanitizedUserName, sanitizedEmail, hashedPassword],function (err) {
    //db.run(query,[sanitizedUserName, sanitizedEmail, password],function (err) {
    //db.run(query, [user_name, email_address, password], function (err) {
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
//  return { router, getAuthors }; // Expose both router and getAuthors


};

module.exports = { usersRoutes, getAuthors}; // Export BOTH functions


