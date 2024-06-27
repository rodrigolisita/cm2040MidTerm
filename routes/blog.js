// routes/blog.js
const express = require('express');
const router = express.Router();
const { setupMiddleware, authenticate } = require('../middleware'); // Import both functions
const db = require('../db'); 
const authRoutes = require('./auth')(db); // Require and execute authRoutes with db
const { getAuthors } = require('./users'); // Import getAuthors
const xss = require('xss'); // Make sure 'xss' is installed and required
const bcrypt = require('bcrypt'); // Import bcrypt

async function getBlogPosts(db) {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM blog_posts", (err, rows) => {
    if (err) reject(err);
    else resolve(rows);
    });
    });
}

router.get("/", authenticate, async (req, res) => {

  try {
    const authors = await getAuthors(db); // Fetch authors
    const blogPosts = await getBlogPosts(db);
    let userName = req.session.userName;

    res.render('blog', 
      { title: 'Authors Page', 
        blogPosts, 
        req, 
        authors: authors, 
        user: userName
      }); // Pass the 'authors' data to the view.
   
  } catch (err) {
    console.error('Error fetching blog posts or authors:', err.message); // Add err.message
    res.status(500).render('error', { message: err.message, title: 'Error' }); 
  }
});

// GET /blog/create - Display the create post form with author options
router.get("/create", authenticate, async (req, res) => {

  try {
    const authors = await getAuthors(db); // Fetch authors
    res.render("create-post.ejs", {
      title: "Create New Blog Post",
      authors: userName
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
  const author = req.session.userName;
  const password = req.body.password;

  // Sanitize input before using it 
    const title = xss(req.body.title);
    const content = xss(req.body.content);

  if (!title || !content || !author || !password) { // Check if all fields are present
    return res.status(400).render("error", {
      message: "Title, content, author, and password are required",
      title: "Error"
    });
  }

  // 1. Hash the password using bcrypt
  bcrypt.hash(password, 10, function(err, hashedPassword) {
    if (err) {
      // Handle bcrypt error
      res.status(500).render("error", {message: "Error hashing password", title: "Error"});
    } else {
    // 2. Insert the new blog post into the database, including the hashed password
      const query = "INSERT INTO blog_posts (title, content, author, status, password_hash) VALUES (?, ?, ?, ?, ?);";
      const queryParameters = [title, content, author, status, hashedPassword];
      
      db.run(query, queryParameters, function (err) {
        if (err) {
          console.error("Database error:", err);
          res.status(500).render("error", {
            message: "Database error",
            title: "Error"
          });
        } else {
          res.redirect("/blog"); 
        }
      });
    }
  });
});

// POST /blog/Change - Change title
router.post("/change", (req, res) => {
  const newTitle = req.body.title;
  console.log("Change name " + req.app.locals.siteTitle + " for " +  newTitle);
  req.app.locals.siteTitle = newTitle;
  res.redirect("/blog");
});

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
  const enteredPassword = req.body.password;

  db.get("SELECT password_hash FROM blog_posts WHERE id = ?", [postId], function(err, row) {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).send("Internal Server Error"); 
    }

    if (!row || !row.password_hash) {
      return res.status(404).send("Post not found or password not set"); 
    }

    bcrypt.compare(enteredPassword, row.password_hash, (err, result) => {
      if (result) { // Passwords match
        // Delete the blog post (associated data will be deleted automatically due to ON DELETE CASCADE)
        db.run("DELETE FROM blog_posts WHERE id = ?", [postId], function(err) {
          if (err) {
            console.error("Error deleting blog post:", err);
            return res.status(500).send("Internal Server Error"); 
          } else {
            res.redirect("/blog"); 
          }
        });
      } else {
        req.flash("error", "Incorrect password");
      }
    });
  });
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
router.get('/:id/update', authenticate, (req, res) => {

  const postId = req.params.id;
  const userId = req.session.userId; // Get current user's ID


  db.get("SELECT * FROM blog_posts WHERE id = ?", [postId], (err, post) => {  
      if (err) {
          console.error('Error fetching blog post:', err);
          return res.status(500).render('error', { message: 'Database error', title: 'Error' });
      }
      
      if (!post) {
          return res.status(404).render('error', { message: 'Post not found', title: 'Error' });
      }

      db.all("SELECT author, updated_at FROM co_authors WHERE post_id = ?", [postId], (err, coAuthors) => {
        if (err) {
            console.error('Error fetching co-authors:', err);
            return res.status(500).render('error', { message: 'Database error', title: 'Error' });
        }
        
        // Default to empty array if no co-authors
        coAuthors = coAuthors || [];

      //const coAuthorNames = coAuthors.map(coAuthor => coAuthor.author);
      
          res.render('update', {
              title: 'Update Blog Post',
              post,  // Pass the entire post object
              coAuthors, //: coAuthorNames,
              userName: req.session.userName
          });
      });
  });
});


// PUT /blog/:id/update - Update an existing blog post
router.post("/:id/update", authenticate, async (req, res) => {
    const postId = req.params.id;
    const userId = req.session.userId;
    const currentUserName = req.session.userName;  

    // Sanitize input before using it 
    const sanitizedTitle = xss(req.body.title);
    const sanitizedContent = xss(req.body.content);
    const author = req.body.author; // Don't sanitize author, as it's not directly rendered in HTML
    const status = req.body.status;

    try {
        // 1. Fetch the post
        const post = await db.get("SELECT * FROM blog_posts WHERE id = ?", [postId]);

        if (!post) {
            return res.status(404).render('error', { message: 'Post not found', title: 'Error' });
        }

        // 2. Update blog post details
        await db.run(
            "UPDATE blog_posts SET title = ?, content = ?, status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
            [sanitizedTitle, sanitizedContent, status, postId]
        );

        // 3. Add the current user as a co-author (always)
        await db.run(
          "INSERT INTO co_authors (post_id, author) VALUES (?, ?)",
          [postId, currentUserName]
          );


      res.redirect("/blog");
  } catch (err) {
      console.error("Error updating blog post or co-authors:", err);
      res.status(500).render("error", { message: "Database error", title: 'Error' });
  }
});


// -----
// Mount the authentication routes under /blog/login and /blog/logout
router.use('/', authRoutes); // Use '/' as the base path, because the routes will have it

module.exports = (db) => {
  const authRoutes = require('./auth')(db);
  router.use('/', authRoutes);
  return router;
};
