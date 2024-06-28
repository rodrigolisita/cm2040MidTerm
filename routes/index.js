// routes/index.js
const express = require('express');
const router = express.Router();
const xss = require('xss');
const postRoutes = require('./posts');


module.exports = (db) => {

  async function getBlogPosts(db, sortOption = 'createdAt') {
    let orderByClause;

    switch (sortOption) {
        case 'createdAt':
            orderByClause = 'createdAt DESC';
            break;
        case 'updatedAt':
            orderByClause = 'updatedAt DESC';
            break;
        case 'title':
            orderByClause = 'title ASC';
            break;
        case 'author':
            orderByClause = 'author ASC';
            break;
        case 'comments':
            orderByClause = '(SELECT COUNT(*) FROM comments c WHERE c.post_id = bp.id) DESC';
            break;
        case 'likes':
            orderByClause = 'likes DESC';
            break;
        default:
            orderByClause = 'createdAt DESC';
    }

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

    const coAuthorPromises = rows.map(post => {
        return new Promise((resolve, reject) => {
            db.all("SELECT author, updated_at FROM co_authors WHERE post_id = ?", [post.id], (err, coAuthors) => {
                if (err) reject(err);
                else resolve(coAuthors);
            });
        });
    });
    const allCoAuthors = await Promise.all(coAuthorPromises);

    rows.forEach((post, index) => {
        post.coAuthors = allCoAuthors[index];
    });

    return rows;
}

// Root (Homepage) Route
router.get('/', async (req, res) => {

  try {
            const sortOption = req.query.sort || 'createdAt';
            const blogPosts = await getBlogPosts(db, sortOption);

            res.render('home', {
                title: req.app.locals.siteTitle,
                blogPosts: blogPosts,
                sortOption
            });

    } catch (err) {
        console.error('Database error:', err);
        res.status(500).render('error', { message: 'Database error' });
    }
    });    
    

  router.use('/', postRoutes(db)); // Use the posts router
  
  return router;  // Return the router
};
