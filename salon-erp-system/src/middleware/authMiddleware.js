const jwt = require('jsonwebtoken');
const tokenBlacklist = new Set();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) return res.sendStatus(401);
  if (tokenBlacklist.has(token)) return res.sendStatus(403);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const blacklistToken = (token) => {
  tokenBlacklist.add(token);
};

module.exports = { authenticateToken, blacklistToken };
