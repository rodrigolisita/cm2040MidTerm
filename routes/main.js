module.exports = function(app, db){

  app.get('/', async (req, res) => {
    try {
      const rows = await new Promise((resolve, reject) => {
        db.all("SELECT * FROM blog_posts WHERE status = 'published'", (err, rows) => {
          if (err) {
            reject(err); 
          } else {
            resolve(rows); 
          }
        });
      });
  
      res.render('home', { title: "Home Page", blogPosts: rows });
    } catch (err) {
      console.error('Database error:', err);
      res.status(500).render('error', { message: 'Database error' });
    }
  });


app.get('/about', (req, res) => {
     res.render('about', {
        // layout: './layouts/sidebar',
        title: "About"

     });    
 });

 }