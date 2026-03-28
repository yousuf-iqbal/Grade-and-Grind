// middleware/verifyTokens.js
// verifies firebase id token on every protected route
// sets req.user = { id, email, role } for use in controllers

const { admin } = require('../config/firebase');
const { sql, poolPromise } = require('../config/db');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token      = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'access denied. please log in.' });
    }

    // verify firebase token
    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(token);
    } catch {
      return res.status(403).json({ error: 'invalid or expired token. please log in again.' });
    }

    // get user role and id from our database
    const pool   = await poolPromise;
    const result = await pool.request()
      .input('email', sql.NVarChar, decoded.email)
      .query(`select UserID, Role, IsBanned from Users where Email = @email`);

    const user = result.recordset[0];

    if (!user) {
      return res.status(404).json({ error: 'profile not found. please complete registration.' });
    }
    if (user.IsBanned) {
      return res.status(403).json({ error: 'your account has been suspended.' });
    }

    // attach to request — available in all controllers as req.user
    req.user = {
      id:    user.UserID,
      email: decoded.email,
      role:  user.Role,
    };

    next();
  } catch (err) {
    console.error('verifyToken error:', err.message);
    res.status(500).json({ error: 'something went wrong.' });
  }
};

module.exports = { verifyToken };
