const request = require('supertest');
const app = require('./index');
const db = require('./db');

let cachedAdminToken = null;

// Function to get the admin token (logs in if not already logged in)
const getAdminToken = async () => {
  if (cachedAdminToken) {
    return cachedAdminToken;
  }

  // Login the initial admin user to get the token
  const loginRes = await request(app)
    .post('/api/users/login')
    .send({
      username: 'initialadmin',
      password: 'adminpassword',
    });

  cachedAdminToken = loginRes.body.token;
  return cachedAdminToken;
};

// Function to clear database for individual test files (run before each test)
const clearDatabase = async () => {
  // Clear in proper order to respect foreign key constraints
  await db.query('DELETE FROM Aktivitas_Budidaya');
  await db.query('DELETE FROM Transaksi_Inventory');
  await db.query('DELETE FROM Inventory');
  await db.query('DELETE FROM Lahan');
  await db.query('DELETE FROM Petani');
  await db.query('DELETE FROM User_Koperasi WHERE user_id != (SELECT user_id FROM Users WHERE username = $1)', ['initialadmin']);
  await db.query('DELETE FROM Koperasi');
  // Do NOT delete the initialadmin user here, it's handled by global-setup
  await db.query('DELETE FROM Users WHERE username != $1', ['initialadmin']);
};

module.exports = { getAdminToken, clearDatabase };