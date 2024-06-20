// errorHandler.js
module.exports = function(err, req, res, next) {
    console.error(err.stack); // Log the error for debugging
    res.status(err.status || 500).render('error', { 
      title: "Error page",
      message: err.message, 
      error: err 
    }); 
  };