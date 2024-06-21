// routes/blog.js
const express = require('express');
const router = express.Router();

//const AUTHOR_PASSWORD = 'test'; // Or retrieve from environment variable


module.exports = function (db) {


  // GET /blog - Redirect to login if not authenticated, otherwise render blog page
  router.get('/', async (req, res) => {
    if (!req.session.isAuthenticated) {
      res.redirect('/blog/login'); // Redirect to login if not authenticated
      return;
    }

    try {
      const blogPosts = await new Promise((resolve, reject) => {
        db.all("SELECT * FROM blog_posts", (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      res.render('blog', { title: 'Blog', blogPosts, req });
    } catch (err) {
      console.error('Error fetching blog posts:', err);
      res.status(500).render('error', { message: 'Internal Server Error' });
    }
  });
  
 

  // GET /authors - This will be our authors page
  router.get("/authors", (req, res) => {
    res.render("authors", { title: "Authors" });
  });

  // POST /blog/create - Create a new blog post (handle form submission)
  router.post("/create", (req, res) => {
    const status = req.body.publish ? "published" : "draft";
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).render("error", {
        message: "Title and content are required",
        title: 'Error'
      });
    }

    const query =
      "INSERT INTO blog_posts (title, content, status) VALUES (?, ?, ?);";
    const queryParameters = [title, content, status];

    db.run(query, queryParameters, function (err) {
      if (err) {
        console.error("Database error:", err);
        res.status(500).render("error", {
          message: "Database error",
          title: 'Error'
        });
      } else {
        res.redirect("/blog"); // Redirect to the blog homepage (or another page)
      }
    });
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
router.get('/:id/update', async (req, res) => {
  const postId = req.params.id;

  try {
      const post = await new Promise((resolve, reject) => {
          db.get("SELECT * FROM blog_posts WHERE id = ?", [postId], (err, row) => {
              if (err) reject(err);
              else resolve(row);
          });
      });

      if (!post) {
          return res.status(404).render('error', { message: 'Post not found', title: 'Error' });
      }

      res.render('update', { title: 'Update Blog Post', post }); // Pass post data to the template
  } catch (err) {
      console.error('Error fetching blog post:', err);
      res.status(500).render('error', { message: 'Internal Server Error', title: 'Error' });
  }
});
// PUT /blog/:id/update - Update an existing blog post
// PUT /blog/:id/update - Update an existing blog post
router.post("/:id/update", (req, res) => {  // Changed from router.post to router.put
  const postId = req.params.id;
  const { title, content, status } = req.body;

  db.run(
      "UPDATE blog_posts SET title = ?, content = ?, status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
      [title, content, status, postId],
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
router.get('/login', (req, res) => {
  const title = req.session.title || 'Login';
  res.render('login', { 
    message: req.flash('error'),
    title: title
  });
});    


// POST /blog/login - Handle login form submission
router.post('/login', async (req, res) => {
  const password = req.body.password;
  if (password === process.env.AUTHOR_PASSWORD) {
      req.session.isAuthenticated = true;
      const blogPosts = await new Promise((resolve, reject) => {
          db.all("SELECT * FROM blog_posts", (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        });
      res.render('blog', { title: 'Blog', blogPosts, req });
  } else {
      req.flash('error', 'Incorrect password.');
      res.redirect('/blog/login');
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
