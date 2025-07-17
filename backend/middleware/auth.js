const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401); // No token

  jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey', (err, user) => {
    if (err) return res.sendStatus(403); // Invalid token
    req.user = user; // Contains user_id and role
    next();
  });
};

const authorizeRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: You do not have the necessary permissions.' });
    }
    next();
  };
};

// Middleware to check if user has access to specific cooperative
const authorizeKoperasiAccess = (allowSuperAdmin = true) => {
  return async (req, res, next) => {
    try {
      // SUPER_ADMIN has access to all cooperatives
      if (allowSuperAdmin && req.user.role === 'SUPER_ADMIN') {
        return next();
      }

      // For ADMIN and OPERATOR, check User_Koperasi association
      const { koperasi_id } = req.params || req.body;
      
      if (!koperasi_id) {
        return res.status(400).json({ message: 'Koperasi ID is required' });
      }

      const db = require('../db');
      const accessCheck = await db.query(
        'SELECT * FROM User_Koperasi WHERE user_id = $1 AND koperasi_id = $2',
        [req.user.user_id, koperasi_id]
      );

      if (accessCheck.rows.length === 0) {
        return res.status(403).json({ message: 'Access denied: No permission for this cooperative' });
      }

      req.userKoperasiRole = accessCheck.rows[0].role_koperasi;
      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
};

// Middleware to filter data based on user cooperative access
const getAccessibleKoperasi = async (userId, userRole) => {
  const db = require('../db');
  
  // SUPER_ADMIN sees all cooperatives
  if (userRole === 'SUPER_ADMIN') {
    const result = await db.query('SELECT koperasi_id FROM Koperasi');
    return result.rows.map(row => row.koperasi_id);
  }

  // ADMIN and OPERATOR see only their assigned cooperatives
  const result = await db.query(
    'SELECT koperasi_id FROM User_Koperasi WHERE user_id = $1',
    [userId]
  );
  return result.rows.map(row => row.koperasi_id);
};

module.exports = { authenticateToken, authorizeRoles, authorizeKoperasiAccess, getAccessibleKoperasi };