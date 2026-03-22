// middleware/roleGaurd.js  (keep existing filename for compatibility)
// restricts route access by role

const roleGuard = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'authentication required.' });
  }
  if (!allowedRoles.includes(req.user.Role)) {
    return res.status(403).json({ error: `access denied. this route is for ${allowedRoles.join(' or ')} accounts only.` });
  }
  next();
};

module.exports = { roleGuard };