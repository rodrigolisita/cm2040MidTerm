const express = require("express");
const router = express.Router();
const bcrypt = require('bcrypt'); // Import bcrypt
const xss = require('xss'); // Install and require 'xss' if not already installed
const { setupMiddleware, authenticate } = require('../middleware'); // Import both functions

async function getAuthors(db) {
  return new Promise((resolve, reject) => {
    db.all("SELECT user_id, user_name FROM users", (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}



// Export a function that takes the db connection as an argument
function usersRoutes(db){

  /**
   * @desc Displays a page with a form for creating a user record
   */
  router.get("/add-user", (req, res) => {
    res.render("add-user.ejs", {
      title: "Add user",
      layout: './layouts/full-width',
      loggedUser: req.session.userName
   });
  });

/**
 * @desc Display all the users for edition
 */
router.get("/edit-users", (req, res) => {
  const userName = req.session.userName;
  const userId = req.session.userId;

  db.all("SELECT * FROM users", (err, users) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Internal Server Error');
    }
    console.log(userName + " " + userId);
    res.render("edit-users.ejs", {
      layout: './layouts/full-width',
      title: "List users",
      users: users,
      loggedUser: userName
    });
  });
});

//Edit user form  
  router.get("/edit-user/:id", (req, res) => {
    const userId = req.params.id; //User to edit
    const loggedUserId = req.session.userId;

    console.log("Request to edit user: "+ userId + " by user " + loggedUserId);
    
    db.get("SELECT * FROM users WHERE user_id = ?", [userId], (err, user) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).send("Internal Server Error");
      } else if (!user) {
        return res.status(404).send("User not found");
      }
      res.render("edit-user.ejs", { //The page to edit the user
        layout: "./layouts/full-width",
        title: "Edit user",
        user: user,
        loggedUser: req.session.userName,
        loggedUserId: loggedUserId
      });
    });
  });

  router.post("/edit-user/:id", async (req, res) => {
    const userId = req.params.id;
    const loggedUserId = req.body.loggedUserId;

    console.log("Will edit user " + userId + " by user " + loggedUserId);

    let { user_name, email_address, oldpassword, newpassword } = req.body;
    
  
    // Input validation
    if (!user_name || !email_address || !oldpassword || !newpassword) {
      return res.status(400).send("User name, email address, old and new passwords are required.");
    }
    try {
      // 1. Fetch the current user's data
      
      const currentUser = await new Promise((resolve, reject) => {
        db.get("SELECT * FROM users WHERE user_id = ?", [userId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      if (!currentUser) {
        return res.status(404).send("User not found");
      }
      // 2. Verify the old password
      const passwordMatch = await bcrypt.compare(oldpassword, currentUser.password);
//      if(currentUser.user_name == "Simon Star" ||
//         currentUser.user_name == "Dianne Dean" ||
//         currentUser.user_name == "Harry Hilbert")
//         {
//          user_name = currentUser.user_name; //Do not change these names
//          if(oldpassword !== currentUser.password && !passwordMatch){
//            return res.status(401).send("Incorrect old password");
//          }
//      }else{
//        if(!passwordMatch){return res.status(401).send("Incorrect old password");}
//      }

     
      // 3. Hash the new password
      const hashedNewPassword = await bcrypt.hash(newpassword, 10); 

      // 4. Sanitize input before inserting into the database
      const sanitizedUserName = xss(user_name);
      const sanitizedEmail = xss(email_address);

      // 5. Update the user's information
      
      //console.log("Will edit user " + userId + " by user " + loggedUserId);
      if(loggedUserId == userId){req.session.userName = user_name;} //Update the user name for the session.} 
      
      const updateQuery = "UPDATE users SET user_name = ?, email_address = ?, password = ? WHERE user_id = ?";

      db.run(
        updateQuery,
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
 * @desc Display all the authors
 */

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
    if (!user_name || !email_address || !password) {
      return res.status(400).send("User name, email address, and password are required.");
    }
  
    // Sanitize input before inserting into the database
    const sanitizedUserName = xss(user_name);
    const sanitizedEmail = xss(email_address);
  
    // Check if username already exists
    db.get("SELECT * FROM users WHERE user_name = ?", [sanitizedUserName], async function(err, existingUser) {
      if (err) {
        console.error("Error checking for existing user:", err.message);
        return res.status(500).send("Internal Server Error");
      }
  
      if (existingUser) {
        //return res.status(400).send("Username already exists.");
        req.flash('username', sanitizedUserName); 
        return res.redirect('/users/user-exists');
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const query = "INSERT INTO users (user_name, email_address, password) VALUES (?, ?, ?);";
      db.run(query, [sanitizedUserName, sanitizedEmail, hashedPassword], function (err) {
        if (err) {
          console.error("Database error:", err.message);
          return res.status(500).send("Internal Server Error");
        }
        res.redirect("/users/edit-users");
      });
    });
  });

  router.get('/user-exists', (req, res) => {
    const username = req.flash('username');
    res.render('user-exists.ejs', { 
      title: "Username Already Exists", 
      layout: './layouts/full-width',
      name: username 
    });
  });

  router.get('/father-users', (req, res) => {
    const username = req.query.username;
    res.render('father-users.ejs', { 
      title: "User cannot be deleted", 
      layout: './layouts/full-width',
      username: username
    });
  });  
  router.get('/wrong-password', (req, res) => {
    const username = req.query.username;
    res.render('wrong-password.ejs', { 
      title: "Wrong Password", 
      layout: './layouts/full-width',
      username: username
    });
  });  

  router.get("/delete-user/:id", (req, res) => {
    const userId = req.params.id;
    const loggedUser = req.session.userId;
    
    console.log("Delete user " + userId + " by user " + loggedUser);
    
    db.get("SELECT * FROM users WHERE user_id = ?", [userId], (err, user) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).send("Internal Server Error");
      } else if (!user) {
        return res.status(404).send("User not found");
      }

      res.render("delete-user.ejs", {
        layout: "./layouts/full-width",
        title: "Edit user",
        user: user,
        loggedUser: req.session.user_id
      });
    });
  });

  
  router.post("/delete-user/:id", async (req, res) => {
    const userId = req.params.id;
    const loggedInUserId = req.session.userId; // Get the logged-in user's ID
    const {oldpassword } = req.body; // Only need the old password
    
    console.log("Delete request received for user ID:", userId + " by logged user: " +  loggedInUserId);

    // 1. Input validation (for password check)
    if (!oldpassword) {
      return res.status(400).send("Old password is required for deletion.");
    }
    
    const userToDelete = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM users WHERE user_id = ?", [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!userToDelete) {
      return res.status(404).send("User not found");
    }

    //2. Protect Default Users
    const protectedUsers = [1, 2, 3]; // Store IDs as numbers
    if (protectedUsers.includes(userToDelete.user_id)) {
      return res.redirect(`/users/father-users?username=${encodeURIComponent(userToDelete.user_name)}`); // Encode for URL safety
    }

    // 2. Verify the password
    const passwordMatch = await bcrypt.compare(oldpassword, userToDelete.password); 
    
    // 3. Delete the user (only if password is correct)
    if (!passwordMatch) {
      req.flash('username', userToDelete.user_name); 
      return res.redirect(`/users/wrong-password?username=${encodeURIComponent(userToDelete.user_name)}`);
    }

    if (loggedInUserId == parseInt(userId)) {
      req.session.isAuthenticated = false; // Log out the user
      req.flash("error", "You cannot delete yourself. You have been logged out.");
      res.redirect('/blog/login'); // Redirect to login page      
      
    } else {
      db.run("DELETE FROM users WHERE user_id = ?", [userId], function (err) {
        if (err) {
          console.error("Error deleting user:", err.message); 
          return res.status(500).send("Internal Server Error");
        }
        res.redirect("/users/edit-users");
      })
    };
     

  });

  return router;

};

module.exports = { usersRoutes, getAuthors}; // Export BOTH functions


