// routes/posts.js
const express = require('express');
const router = express.Router();
const xss = require('xss'); // Make sure 'xss' is installed and required


module.exports = (db) => {

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
            return res.status(404).render('error', { message: 'Post not found', title: 'Error' });
          }
      
          // 2. Fetch co-authors and create array of author names
          const coAuthors = await new Promise((resolve, reject) => {
            db.all("SELECT author, updated_at FROM co_authors WHERE post_id = ?", [postId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows); // Pass the whole row objects
            });
          });    
      
          // 3. Fetch view count
          // Check if the user has already viewed this post in this session (optional)
          if (!req.session.viewedPosts || !req.session.viewedPosts.includes(postId)) {
          // Increment view count only if it's a new view for this user
            await db.run('INSERT INTO post_views (post_id) VALUES (?)', [postId]);
      
            // Mark the post as viewed in the session
            if (!req.session.viewedPosts) {
              req.session.viewedPosts = [];
            }
            req.session.viewedPosts.push(postId);
          }    
          const viewCount = await new Promise((resolve, reject) => {
            db.get(
              "SELECT COUNT(*) AS views FROM post_views WHERE post_id = ?",
              [postId],
              (err, row) => {
                if (err) reject(err);
                else resolve(row.views);
              }
            );
          });
      
          // 4. Fetch likes for the post
          const likesCount = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) AS likes FROM post_likes WHERE post_id = ?', [postId], (err, row) => {
              if (err) reject(err);
              else resolve(row.likes);
            });
          });
      
          // 5. Fetch associated comments
          const comments = await new Promise((resolve, reject) => {
            db.all("SELECT * FROM comments WHERE post_id = ?", [postId], (err, rows) => {
              if (err) reject(err);
              else resolve(rows);
            });
          });
      
          // 6. Render the post template with post data, co-authors, comments, likes, and views
          res.render('post', {
            title: post.title, // Pass the title for the layout
            post,
            coAuthors, 
            comments,
            likes: likesCount,
            views: viewCount
          });
      
        } catch (err) {
          console.error('Database error:', err);
          res.status(500).render('error', { message: 'Database error', title: 'Error' });
        }
      });



router.post('/post/:id/like', async (req, res) => {
        try {
            const postId = req.params.id;
      
            // Prevent duplicate likes (implement proper logic for your application)
            // For example, you could check if the user has already liked the post
      
            await db.run('INSERT INTO post_likes (post_id) VALUES (?)', [postId]);
      
            res.redirect(`/post/${postId}`); // Redirect back to the post page
        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Error liking post' });
    }});

// Comment Submission Route (updated)
router.post('/post/:id/comments', async (req, res) => {
    try {
        console.log('Comment route reached'); 
        console.log('Request Body:', req.body); 
        
      const { author, content } = req.body;
      const blogPostId = req.params.id;
    
      // Input validation and sanitization (add more robust validation in a real app)
      if (!author || !content) {
        return res.status(400).render('error', { message: 'Author and content are required' });
      }
    
      // Basic sanitization to prevent XSS (you'll want a more robust solution in a real application)
      //const sanitizedContent = content.replace(/<[^>]+>/g, ''); 
      const sanitizedAuthor = xss(author);
      const sanitizedContent = xss(content);
    
      await db.run('INSERT INTO comments (post_id, author, content) VALUES (?, ?, ?)', [blogPostId, sanitizedAuthor, sanitizedContent]);
    
      res.redirect(`/post/${blogPostId}`); // Redirect back to the post page
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Error submitting comment', title: 'Error' });
    }
  });        
      


    return router;    
};

