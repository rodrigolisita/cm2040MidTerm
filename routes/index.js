// routes/index.js
const express = require('express');
const router = express.Router();

module.exports = (db) => {

  router.get('/', async (req, res) => {
    try {
        const sortOption = req.query.sort || 'createdAt'; 
        let orderByClause;

        switch (sortOption) {
            case 'createdAt': orderByClause = 'createdAt DESC'; break;
            case 'updatedAt': orderByClause = 'updatedAt DESC'; break;
            case 'title': orderByClause = 'title ASC'; break;
            default: orderByClause = 'createdAt DESC'; 
        }

        // Correct query to fetch like counts along with posts
        const rows = await new Promise((resolve, reject) => {
            const query = `
                SELECT bp.*, COUNT(pl.id) AS likes
                FROM blog_posts AS bp
                LEFT JOIN post_likes AS pl ON bp.id = pl.post_id
                WHERE status = 'published'
                GROUP BY bp.id
                ORDER BY ${orderByClause}
            `;
            db.all(query, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        res.render('home', { title: "Home Page", blogPosts: rows, sortOption }); 
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

            // 1. Check if the user has already viewed this post in this session (optional)
            if (!req.session.viewedPosts || !req.session.viewedPosts.includes(postId)) {
              // Increment view count only if it's a new view for this user
              await db.run('INSERT INTO post_views (post_id) VALUES (?)', [postId]);

              // Mark the post as viewed in the session
              if (!req.session.viewedPosts) {
                req.session.viewedPosts = [];
              }
              req.session.viewedPosts.push(postId);
            }

            // 2. Fetch the view count
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
            

            
            // 3. Fetch the blog post
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

            // 4. Fetch associated comments
            const comments = await new Promise((resolve, reject) => {
                db.all("SELECT * FROM comments WHERE blog_post_id = ?", [postId], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
            
            // 5. Fetch likes for the post
            const likesCount = await new Promise((resolve, reject) => {
                db.get('SELECT COUNT(*) AS likes FROM post_likes WHERE post_id = ?', [postId], (err, row) => {
                    if (err) reject(err);
                    else resolve(row.likes);
                });
            });
            
            // 6. Render the post template with post data, comments, likes, and views
            res.render('post', {
                title: post.title, // Pass the title for the layout
                post,
                comments,
                likes: likesCount,
                views: viewCount
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
    }
});

  return router;  // Return the router
};
