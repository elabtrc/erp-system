// backend/middleware/roleMiddleware.js
const checkAdmin = (req, res, next) => {
    if (req.user.role_name !== 'Admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  };
  
  module.exports = { checkAdmin };