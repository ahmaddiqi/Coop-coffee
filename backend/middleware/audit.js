const db = require('../db');

const auditLogger = async (req, res, next) => {
  const { method, originalUrl, user, body, params } = req;
  const ip_address = req.ip; // Get IP address

  let table_name = null;
  let record_id = null;
  let action = null;

  // Determine table_name and record_id based on URL and method
  const urlParts = originalUrl.split('/').filter(Boolean);
  if (urlParts[0] === 'api') {
    table_name = urlParts[1]; // e.g., 'users', 'koperasi'
    if (params.id) {
      record_id = parseInt(params.id, 10);
    } else if (body.user_id) { // For user creation, if user_id is in body
        record_id = body.user_id;
    }
  }

  switch (method) {
    case 'POST':
      action = 'CREATE';
      break;
    case 'PUT':
      action = 'UPDATE';
      break;
    case 'DELETE':
      action = 'DELETE';
      break;
  }

  if (user && user.user_id && table_name && action) {
    try {
      await db.query(
        'INSERT INTO Audit_Log (user_id, table_name, record_id, action, ip_address) VALUES ($1, $2, $3, $4, $5)',
        [user.user_id, table_name, record_id, action, ip_address]
      );
    } catch (err) {
      console.error('Error logging audit event:', err);
    }
  }

  next();
};

module.exports = auditLogger;
