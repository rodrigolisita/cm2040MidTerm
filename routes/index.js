// routes/index.js
const express = require('express');
const router = express.Router();

module.exports = (db) => {
    router.get('/', async (req, res) => {
        try {
          const sortOption = req.query.sort || 'createdAt'; // Get sorting option from query string, default to createdAt
          let orderByClause;
      
          switch (sortOption) {
            case 'createdAt':
              orderByClause = 'createdAt DESC'; // Sort by creation date (newest first)
              break;
            case 'updatedAt':
              orderByClause = 'updatedAt DESC'; // Sort by update date (newest first)
              break;
            case 'title':
              orderByClause = 'title ASC';     // Sort by title (ascending)
              break;
            default:
              orderByClause = 'createdAt DESC'; // Default to creation date if invalid option
          }
      
          const rows = await new Promise((resolve, reject) => {
            db.all(`SELECT * FROM blog_posts WHERE status = 'published' ORDER BY ${orderByClause}`, (err, rows) => {
              if (err) reject(err);
              else resolve(rows);
            });
          });
      
          res.render('home', { title: "Home Page", blogPosts: rows, sortOption }); // Pass sortOption to the template
        } catch (err) {
          console.error('Database error:', err);
          res.status(500).render('error', { message: 'Database error' });
        }
      });
    
    
          // About Route
      router.get('/about', (req, res) => {
        res.render('about', {
          // layout: './layouts/sidebar',
          title: "About"
        });
      });

      router.get('/post/:id', async (req, res) => {
        try {
          const postId = req.params.id;
      
          // 1. Fetch the blog post
          const post = await new Promise((resolve, reject) => {
            db.get("SELECT * FROM blog_posts WHERE id = ?", [postId], (err, row) => {
              if (err) reject(err);
              else resolve(row);
            });
          });
      
          // Check if the post exists
          if (!post) {
            return res.status(404).render('error', { message: 'Post not found' });
          }
      
          // 2. Fetch associated comments
          const comments = await new Promise((resolve, reject) => {
            db.all("SELECT * FROM comments WHERE blog_post_id = ?", [postId], (err, rows) => {
              if (err) reject(err);
              else resolve(rows);
            });
          });
      
          // 3. Render the post template with post data and comments
          res.render('post', {
            title: post.title, // Pass the title for the layout
            post,
            comments
          });
      
        } catch (err) {
          console.error('Database error:', err);
          res.status(500).render('error', { message: 'Database error', title: 'Error' });
        }
      });   

      // Comment Submission Route (updated)
  router.post('/post/:id/comments', async (req, res) => {
    try {
      const { author, content } = req.body;
      const blogPostId = req.params.id;

      // Input validation and sanitization (add more robust validation in a real app)
      if (!author || !content) {
        return res.status(400).render('error', { message: 'Author and content are required' });
      }

      // Basic sanitization to prevent XSS (you'll want a more robust solution in a real application)
      const sanitizedContent = content.replace(/<[^>]+>/g, ''); 

      await db.run('INSERT INTO comments (blog_post_id, author, content) VALUES (?, ?, ?)', [blogPostId, author, sanitizedContent]);

      res.redirect(`/post/${blogPostId}`); // Redirect back to the post page
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Error submitting comment', title: 'Error' });
    }
  });

  return router;  // Return the router
};
