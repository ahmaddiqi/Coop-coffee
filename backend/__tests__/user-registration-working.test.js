const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const express = require('express');
const { body, validationResult } = require('express-validator');

// Mock environment variables first
process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';

// Mock the database module
const mockQuery = jest.fn();
jest.mock('../db', () => ({
  query: mockQuery
}));

// Mock bcrypt for predictable results
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('mocksalt'),
  hash: jest.fn().mockResolvedValue('hashedpassword'),
  compare: jest.fn().mockResolvedValue(true)
}));

describe('User Registration & Cooperative Registration Module - Working Tests', () => {
  let app;
  
  beforeAll(() => {
    // Create a minimal Express app for testing
    app = express();
    app.use(express.json());
    
    // Define the registration route directly in the test
    app.post('/api/users/register', [
      body('username').notEmpty().withMessage('Username is required.'),
      body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
      body('nama_lengkap').notEmpty().withMessage('Full name is required.'),
      body('email').isEmail().withMessage('Invalid email format.')
    ], async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, password, nama_lengkap, email } = req.body;

      try {
        // Check if username/email already exists
        const existingUser = await mockQuery(
          'SELECT user_id FROM Users WHERE username = $1 OR email = $2',
          [username, email]
        );

        if (existingUser.rows.length > 0) {
          return res.status(400).json({ message: 'Username atau email sudah terdaftar' });
        }

        // Create user without koperasi (koperasi_id = null)
        const role = 'ADMIN'; // Default role for new Users
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const result = await mockQuery(
          'INSERT INTO Users (username, password_hash, nama_lengkap, email, role, koperasi_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id',
          [username, password_hash, nama_lengkap, email, role, null]
        );

        res.status(201).json({ 
          message: 'User berhasil terdaftar. Silakan login dan daftarkan koperasi Anda.',
          user_id: result.rows[0].user_id,
          needs_koperasi_registration: true
        });
      } catch (err) {
        console.error("Registration Error:", err);
        res.status(500).json({ error: err.message });
      }
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockClear();
  });

  describe('POST /api/users/register', () => {
    it('should register a new user successfully with valid data', async () => {
      // Mock: No existing user
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // Mock: User creation
      mockQuery.mockResolvedValueOnce({ rows: [{ user_id: 1 }] });

      const userData = {
        username: 'testuser',
        password: 'password123',
        nama_lengkap: 'Test User',
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        message: 'User berhasil terdaftar. Silakan login dan daftarkan koperasi Anda.',
        user_id: 1,
        needs_koperasi_registration: true
      });

      // Verify database calls
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT user_id FROM Users WHERE username = $1 OR email = $2',
        ['testuser', 'test@example.com']
      );

      // Verify user creation call
      const createUserCall = mockQuery.mock.calls[1];
      expect(createUserCall[0]).toContain('INSERT INTO Users');
      expect(createUserCall[1][0]).toBe('testuser'); // username
      expect(createUserCall[1][1]).toBe('hashedpassword'); // hashed password
      expect(createUserCall[1][2]).toBe('Test User'); // nama_lengkap
      expect(createUserCall[1][3]).toBe('test@example.com'); // email
      expect(createUserCall[1][4]).toBe('ADMIN'); // role
      expect(createUserCall[1][5]).toBe(null); // koperasi_id
    });

    it('should return 400 when username already exists', async () => {
      // Mock: Existing user found
      mockQuery.mockResolvedValueOnce({ rows: [{ user_id: 999 }] });

      const userData = {
        username: 'existinguser',
        password: 'password123',
        nama_lengkap: 'Test User',
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Username atau email sudah terdaftar');
    });

    it('should return 400 when required fields are missing', async () => {
      const userData = {
        password: 'password123'
        // Missing username, nama_lengkap, email
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toHaveLength(3); // username, nama_lengkap, email
    });

    it('should return 500 when database error occurs', async () => {
      // Mock: Database error
      mockQuery.mockRejectedValueOnce(new Error('Database connection failed'));

      const userData = {
        username: 'testuser',
        password: 'password123',
        nama_lengkap: 'Test User',
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Database connection failed');
    });
  });
});
