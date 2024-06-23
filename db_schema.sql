
-- This makes sure that foreign_key constraints are observed and that errors will be thrown for violations
PRAGMA foreign_keys=ON;

BEGIN TRANSACTION;

-- Create your tables with SQL commands here (watch out for slight syntactical differences with SQLite vs MySQL)

CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT NOT NULL,
    email_address TEXT NOT NULL,
    password TEXT NOT NULL
);

-- Insert default data (if necessary here)

-- Set up three users

INSERT INTO users ('user_name','email_address','password') VALUES ('Simon Star','simon@gmail.com','test');
INSERT INTO users ('user_name','email_address','password') VALUES ('Dianne Dean','dianne@yahoo.co.uk','test');
INSERT INTO users ('user_name','email_address','password') VALUES ('Harry Hilbert','HH@yahoo.co.uk','test');


-- New table for blog posts
CREATE TABLE IF NOT EXISTS blog_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT NOT NULL,
    author2 TEXT,
    status TEXT NOT NULL CHECK(status IN ('published', 'draft')),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS post_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  -- Add other columns as needed (e.g., user_id for tracking unique views)
  FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE
);

-- New table for comments
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  blog_post_id INTEGER,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (blog_post_id) REFERENCES blog_posts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS post_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER,
  user_id INTEGER,  
  FOREIGN KEY (post_id) REFERENCES blog_posts(id)
);






COMMIT;

