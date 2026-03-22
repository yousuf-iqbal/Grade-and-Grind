// middleware/verifyToken.js
// verifies firebase token and attaches user from DB to req.user

const { admin }         = require('../config/firebase');
const { findUserByEmail } = require('../features/auth/authModel');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token      = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'authentication required.' });
    }

    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(token);
    } catch {
      return res.status(401).json({ error: 'invalid or expired token. please log in again.' });
    }

    const user = await findUserByEmail(decoded.email);
    if (!user) {
      return res.status(404).json({ error: 'account not found. please register.' });
    }
    if (user.IsBanned) {
      return res.status(403).json({ error: 'your account has been suspended.' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('verifyToken error:', err.message);
    res.status(500).json({ error: 'authentication failed. please try again.' });
  }
};

module.exports = { verifyToken };