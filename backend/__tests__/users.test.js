const request = require('supertest');
const app = require('../index');
const db = require('../db');
const { getAdminToken } = require('../setup');

describe('Users API', () => {
  let adminToken;

  beforeEach(async () => {
    // Clear only non-admin users for a clean test environment
    await db.query('DELETE FROM Users WHERE username != $1', ['initialadmin']);
    adminToken = await getAdminToken(); // Get a fresh admin token
  });

  it('should prevent further registrations after the first user', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        username: 'seconduser',
        password: 'password123',
        nama_lengkap: 'Second User',
        email: 'second@example.com',
      });
    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toEqual('Registration is closed. A user already exists.');
  });

  it('should login the admin user and return a token', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({
        username: 'initialadmin',
        password: 'adminpassword',
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.role).toEqual('ADMIN');
  });

  it('should allow ADMIN to create a new OPERATOR user', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: 'newoperator',
        password: 'operatorpassword',
        nama_lengkap: 'New Operator',
        email: 'newoperator@example.com',
        role: 'OPERATOR',
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('user_id');
    expect(res.body.message).toEqual('User created successfully');
  });

  it('should get all users (ADMIN only)', async () => {
    // Create a new operator user first to ensure there's more than one user
    await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: 'anotheroperator',
        password: 'operatorpassword',
        nama_lengkap: 'Another Operator',
        email: 'anotheroperator@example.com',
        role: 'OPERATOR',
      });

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBeGreaterThan(1); // Initial admin + another operator
  });

  it('should update user role (ADMIN only)', async () => {
    // Create a user to update
    const createUserRes = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: 'userforrolechange',
        password: 'password123',
        nama_lengkap: 'User For Role Change',
        email: 'rolechange@example.com',
        role: 'OPERATOR',
      });
    const userId = createUserRes.body.user_id;

    const res = await request(app)
      .put(`/api/users/${userId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'ADMIN' });
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual('User role updated successfully');
  });

  it('should deactivate user (ADMIN only)', async () => {
    // Create a user to deactivate
    const createUserRes = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: 'userfordeactivate',
        password: 'password123',
        nama_lengkap: 'User For Deactivate',
        email: 'deactivate@example.com',
        role: 'OPERATOR',
      });
    const userId = createUserRes.body.user_id;

    const res = await request(app)
      .put(`/api/users/${userId}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual('User deactivated successfully');
  });

  it('should activate user (ADMIN only)', async () => {
    // Create and deactivate a user to activate
    const createUserRes = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: 'userforactivate',
        password: 'password123',
        nama_lengkap: 'User For Activate',
        email: 'activate@example.com',
        role: 'OPERATOR',
      });
    const userId = createUserRes.body.user_id;
    await request(app)
      .put(`/api/users/${userId}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`);

    const res = await request(app)
      .put(`/api/users/${userId}/activate`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual('User activated successfully');
  });

  it('should reset user password (ADMIN only)', async () => {
    // Create a user to reset password
    const createUserRes = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: 'userforreset',
        password: 'password123',
        nama_lengkap: 'User For Reset',
        email: 'reset@example.com',
        role: 'OPERATOR',
      });
    const userId = createUserRes.body.user_id;

    const res = await request(app)
      .put(`/api/users/${userId}/reset-password`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ new_password: 'newpassword123' });
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual('Password reset successfully');
  });
});
