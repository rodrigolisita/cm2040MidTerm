// routes/blog.js
const express = require('express');
const router = express.Router();
const { setupMiddleware, authenticate } = require('../middleware'); // Import both functions
const db = require('../db'); 
//const AUTHOR_PASSWORD = 'test'; // Or retrieve from environment variable
const bcrypt = require('bcrypt'); // Import bcrypt

module.exports = function (db) {


// Function to fetch authors from database (this will be used in multiple places)
async function getAuthors(db) {
  return new Promise((resolve, reject) => {
    db.all("SELECT user_id, user_name FROM users", (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

//async function getBlogPosts(db) {
//  return new Promise((resolve, reject) => {
//    db.all(
//      `SELECT blog_posts.*, users.user_name AS author_name 
//       FROM blog_posts 
//       LEFT JOIN users ON blog_posts.author = users.user_id`,
//      (err, rows) => {
//        if (err) reject(err);
//        else resolve(rows);
//      });
//    });
//}

async function getBlogPosts(db) {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM blog_posts", (err, rows) => {
    if (err) reject(err);
    else resolve(rows);
    });
    });
}

// GET /blog - Display all blog posts with author names
//router.get("/", async (req, res) => {
//  if (!req.session.isAuthenticated) {
    //res.redirect('/blog/login');
    //return;
  //}
  router.get("/", authenticate, async (req, res) => {

  try {
    const authors = await getAuthors(db); // Fetch authors
    const blogPosts = await getBlogPosts(db);
    const userName = req.session.userName;
      
   res.render('blog', { title: 'Blog', blogPosts, req, authors: authors, user: userName }); // Pass the 'authors' data to the view.
   
  } catch (err) {
    console.error('Error fetching blog posts or authors:', err.message); // Add err.message
    res.status(500).render('error', { message: err.message, title: 'Error' }); 
  }
});

// GET /blog/create - Display the create post form with author options
//router.get("/create", async (req, res) => {
router.get("/create", authenticate, async (req, res) => {

  try {
    const authors = await getAuthors(db); // Fetch authors
    res.render("create-post.ejs", {
      title: "Create New Blog Post",
      authors: authors 
    });
  } catch (err) {
    console.error("Error fetching authors:", err.message); 
    res.status(500).render("error", { 
      message: "Error fetching authors.", 
      title: 'Error' 
  });
  }
});


      // POST /blog/create - Create a new blog post with author information
      router.post("/create", (req, res) => {
        const status = req.body.publish ? "published" : "draft";
        const { title, content, author } = req.body;
    
        if (!title || !content || !author) {
          return res.status(400).render("error", {
            message: "Title, content, and author are required",
            title: 'Error'
          });
        }
    
        const query =
          "INSERT INTO blog_posts (title, content, author, status) VALUES (?, ?, ?, ?);";
        const queryParameters = [title, content, author, status];
    
        db.run(query, queryParameters, function (err) {
          if (err) {
            console.error("Database error:", err);
            res.status(500).render("error", {
              message: "Database error",
              title: 'Error'
            });
          } else {
            res.redirect("/blog"); 
          }
        });
      });


  // GET /blog - Display all blog posts (before author integration)
  
  // POST /blog/:id/publish - Publish a draft blog post
  router.post("/:id/publish", (req, res) => {
    const postId = req.params.id;

    db.run(
      "UPDATE blog_posts SET status = 'published', updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
      [postId],
      function (err) {
        if (err) {
          console.error("Error publishing blog post:", err);
          res.status(500).render("error", {
            message: "Database error",
            title: 'Error'
          });
        } else {
          res.redirect("/blog");
        }
      }
    );
  });

  // POST /blog/:id/delete - Delete a blog post
  router.post("/:id/delete", (req, res) => {
    const postId = req.params.id;

    db.run(
      "DELETE FROM blog_posts WHERE id = ?",
      [postId],
      function (err) {
        if (err) {
          console.error("Error deleting blog post:", err);
          res.status(500).render("error", {
            message: "Database error",
            title: 'Error'
          });
        } else {
          res.redirect("/blog");
        }
      }
    );
  });

  // POST /blog/:id/move-to-draft - Move a published blog post to draft
  router.post("/:id/move-to-draft", (req, res) => {
    const postId = req.params.id;

    db.run(
      "UPDATE blog_posts SET status = 'draft', updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
      [postId],
      function (err) {
        if (err) {
          console.error("Error moving blog post to draft:", err);
          res.status(500).render("error", {
            message: "Database error",
            title: 'Error'
          });
        } else {
          res.redirect("/blog");
        }
      }
    );
  });

// ------------------
// Edit and Update
router.get('/:id/update',authenticate, async (req, res) => {
  const postId = req.params.id;

  try {
      // 1. Fetch the post and authors
      const [post, authors] = await Promise.all([
          new Promise((resolve, reject) => {
              db.get("SELECT * FROM blog_posts WHERE id = ?", [postId], (err, row) => {
                  if (err) reject(err);
                  else resolve(row);
              });
          }),
          getAuthors(db)
      ]);

      if (!post) {
          return res.status(404).render('error', { message: 'Post not found', title: 'Error' });
      }
      
      // 2. Find the author's name for this post 
      const currentAuthor = authors.find(a => a.user_id == post.author);

      res.render('update', { 
          title: 'Update Blog Post', 
          post, 
          authors,
      }); 
  } catch (err) {
      console.error('Error fetching blog post or authors:', err);
      res.status(500).render('error', { message: 'Internal Server Error', title: 'Error' });
  }
});

// PUT /blog/:id/update - Update an existing blog post
// PUT /blog/:id/update - Update an existing blog post
router.post("/:id/update", (req, res) => {  // Changed from router.post to router.put
  const postId = req.params.id;
  const { title, content, author, status } = req.body;
  

  db.run(
      "UPDATE blog_posts SET title = ?, content = ?, author = ?, status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
      [title, content, author, status, postId],
      function (err) {
          if (err) {
              console.error("Error updating blog post:", err);
              res.status(500).render("error", { message: "Database error", title: 'Error' });
          } else {
              res.redirect("/blog");
          }
      }
  );
});


// -----

// GET /blog/login - Display the login page (unchanged)
router.get('/login', async (req, res) => {
  const title = req.session.title || 'Login';
  const authors = await getAuthors(db); // Fetch authors
  res.render('login', { 
    message: req.flash('error'),
    title: title,
    authors: authors
  });
});    


router.post('/login', async (req, res) => {
  const { author, password } = req.body;

  try {
      // 1. Fetch user from the database (within the try...catch block)
      const user = await new Promise((resolve, reject) => {
          db.get("SELECT * FROM users WHERE user_name = ?", [author], (err, row) => {
              if (err) reject(err);
              else resolve(row);
          });
      });
      console.log('Comparing passwords:', password, user.password); 

      const trimmedPassword = password.trim();
      const trimmedHashedPassword = user.password.trim();
      const match = await bcrypt.compare(trimmedPassword, trimmedHashedPassword);
     
      console.log("brcypt Password comparison result:", match); // Output: true or false
    

      // 2. Check if user exists and verify password (still within the try...catch)
      //if (user && await bcrypt.compare(password, user.password)) {
      //if (user && await bcrypt.compare(password.trim(), user.password.trim())) { // Await the comparison result
      //if (user && match) {
      if (user && password == user.password) {  // Using bcrypt.compare is recommended for security

          req.session.isAuthenticated = true;
          req.session.userName = user.user_name;
          
          // 3. Fetch posts and authors after successful authentication
          const authors = await getAuthors(db); 
          const blogPosts = await getBlogPosts(db);

          res.render('blog', { title: 'Blog', blogPosts, req, authors, user: req.body.author }); 

      } else {
          req.flash('error', 'Invalid credentials.');
          res.redirect('/blog/login');
      }
  } catch (err) {
      // Handle potential errors from fetching the user or from the database
      console.error('Error during login:', err);
      res.status(500).render('error', { message: 'Error during login', error: err }); // Pass error to the view
  }
});


// GET /blog/logout - Log out the user
router.get('/logout', (req, res) => {
  req.session.isAuthenticated = false; // Clear the authentication flag
  req.flash('success', 'Logged out successfully!'); // Optional success message
  res.redirect('/blog/login'); 
});



  return router;
};
