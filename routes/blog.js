// routes/blog.js

const express = require("express");


// Export a function that takes the db connection as an argument
module.exports = function (db) {
  const router = express.Router();

    /**
     * @desc Displays a page with a form for creating a user record
     */
    // GET / - This will be our main blog page (eventually listing posts)
    router.get('/', async (req, res) => {
      try {
        const blogPosts = await new Promise((resolve, reject) => {
          db.all("SELECT * FROM blog_posts", (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        });
  
        res.render('blog', { title: 'Blog', blogPosts }); 
      } catch (err) {
        console.error('Error fetching blog posts:', err);
        res.status(500).render('error', { message: 'Internal Server Error' });
      }
    });
    
    // GET /authors - This will be our authors page
    router.get('/authors', (req, res) => { // Removed '/blog'
        res.render('authors', { title: 'Authors' });
    });

    // POST /blog/create - Create a new blog post (handle form submission)
    router.post('/create', (req, res) => {
      // Determine the status based on which button was clicked
      const status = req.body.publish ? 'published' : 'draft';
    
      // Extract title and content from the request body
      const { title, content } = req.body;
    
      // Simple input validation (still important!)
      if (!title || !content) {
        return res.status(400).render('error', { message: 'Title and content are required' });
      }
    
      const query = "INSERT INTO blog_posts (title, content, status) VALUES (?, ?, ?);";
      const queryParameters = [title, content, status]; 
    
      db.run(query, queryParameters, function (err) {
        if (err) {
          console.error('Database error:', err);
          res.status(500).render('error', { message: 'Database error' });
        } else {
          res.redirect('/blog'); // Redirect to the blog homepage (or another page)
        }
      });
    });

// POST /blog/:id/publish - Publish a draft blog post
router.post('/:id/publish', (req, res) => {
  const postId = req.params.id;

  db.run("UPDATE blog_posts SET status = 'published', updatedAt = CURRENT_TIMESTAMP WHERE id = ?", [postId], function(err) {
      if (err) {
          console.error('Error publishing blog post:', err);
          res.status(500).render('error', { message: 'Database error' });
      } else {
          res.redirect('/blog'); 
      }
  });
});

// POST /blog/:id/delete - Delete a blog post
router.post('/:id/delete', (req, res) => {
  const postId = req.params.id;

  db.run("DELETE FROM blog_posts WHERE id = ?", [postId], function(err) {
      if (err) {
          console.error('Error deleting blog post:', err);
          res.status(500).render('error', { message: 'Database error' });
      } else {
          res.redirect('/blog'); 
      }
  });
});

// POST /blog/:id/move-to-draft - Move a published blog post to draft
router.post('/:id/move-to-draft', (req, res) => {
  const postId = req.params.id;

  db.run("UPDATE blog_posts SET status = 'draft', updatedAt = CURRENT_TIMESTAMP WHERE id = ?", [postId], function(err) {
    if (err) {
      console.error('Error moving blog post to draft:', err);
      res.status(500).render('error', { message: 'Database error' });
    } else {
      res.redirect('/blog'); 
    }
  });
});

    return router;
};