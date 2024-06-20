const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Database connection error:', err);
    process.exit(1); 
  } else {
    console.log("Database connected");
    db.run("PRAGMA foreign_keys=ON"); 
  }
});

module.exports = db; 