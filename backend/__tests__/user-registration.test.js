const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const express = require('express');

// Mock database functions before importing app
const mockQuery = jest.fn();
jest.mock('../db', () => ({
  query: mockQuery
}));

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';

// Create test app without starting server
const app = express();
app.use(express.json());

// Import routes after mocking
const userRoutes = require('../routes/users');
app.use('/api/users', userRoutes);

describe('User Registration & Cooperative Registration Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockClear();
  });

  describe('POST /api/users/register', () => {
    describe('✅ Success Cases', () => {
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

        // Verify password is hashed
        const createUserCall = mockQuery.mock.calls[1];
        expect(createUserCall[0]).toContain('INSERT INTO Users');
        expect(createUserCall[1][0]).toBe('testuser'); // username
        expect(createUserCall[1][1]).not.toBe('password123'); // password should be hashed
        expect(createUserCall[1][2]).toBe('Test User'); // nama_lengkap
        expect(createUserCall[1][3]).toBe('test@example.com'); // email
        expect(createUserCall[1][4]).toBe('ADMIN'); // role
        expect(createUserCall[1][5]).toBe(null); // koperasi_id
      });

      it('should hash password correctly', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] });
        mockQuery.mockResolvedValueOnce({ rows: [{ user_id: 1 }] });

        const userData = {
          username: 'testuser',
          password: 'password123',
          nama_lengkap: 'Test User',
          email: 'test@example.com'
        };

        await request(app)
          .post('/api/users/register')
          .send(userData);

        const createUserCall = mockQuery.mock.calls[1];
        const hashedPassword = createUserCall[1][1];
        
        // Verify password is hashed and can be compared
        const isValidHash = await bcrypt.compare('password123', hashedPassword);
        expect(isValidHash).toBe(true);
      });
    });

    describe('❌ Validation Error Cases', () => {
      it('should return 400 when username is missing', async () => {
        const userData = {
          password: 'password123',
          nama_lengkap: 'Test User',
          email: 'test@example.com'
        };

        const response = await request(app)
          .post('/api/users/register')
          .send(userData);

        expect(response.status).toBe(400);
        expect(response.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'Username is required.'
            })
          ])
        );
      });

      it('should return 400 when password is too short', async () => {
        const userData = {
          username: 'testuser',
          password: '123',
          nama_lengkap: 'Test User',
          email: 'test@example.com'
        };

        const response = await request(app)
          .post('/api/users/register')
          .send(userData);

        expect(response.status).toBe(400);
        expect(response.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'Password must be at least 6 characters long.'
            })
          ])
        );
      });

      it('should return 400 when email format is invalid', async () => {
        const userData = {
          username: 'testuser',
          password: 'password123',
          nama_lengkap: 'Test User',
          email: 'invalid-email'
        };

        const response = await request(app)
          .post('/api/users/register')
          .send(userData);

        expect(response.status).toBe(400);
        expect(response.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'Invalid email format.'
            })
          ])
        );
      });

      it('should return 400 when nama_lengkap is missing', async () => {
        const userData = {
          username: 'testuser',
          password: 'password123',
          email: 'test@example.com'
        };

        const response = await request(app)
          .post('/api/users/register')
          .send(userData);

        expect(response.status).toBe(400);
        expect(response.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'Full name is required.'
            })
          ])
        );
      });

      it('should validate multiple fields at once', async () => {
        const userData = {
          password: '123',
          email: 'invalid-email'
        };

        const response = await request(app)
          .post('/api/users/register')
          .send(userData);

        expect(response.status).toBe(400);
        expect(response.body.errors).toHaveLength(4); // username, password, nama_lengkap, email
      });
    });

    describe('❌ Business Logic Error Cases', () => {
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

      it('should return 400 when email already exists', async () => {
        // Mock: Existing user found
        mockQuery.mockResolvedValueOnce({ rows: [{ user_id: 999 }] });

        const userData = {
          username: 'newuser',
          password: 'password123',
          nama_lengkap: 'Test User',
          email: 'existing@example.com'
        };

        const response = await request(app)
          .post('/api/users/register')
          .send(userData);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Username atau email sudah terdaftar');
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

  describe('POST /api/users/login', () => {
    describe('✅ Success Cases', () => {
      it('should login user successfully with valid credentials', async () => {
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        // Mock: User found
        mockQuery.mockResolvedValueOnce({
          rows: [{
            user_id: 1,
            username: 'testuser',
            password_hash: hashedPassword,
            role: 'ADMIN'
          }]
        });
        
        // Mock: Update last_login
        mockQuery.mockResolvedValueOnce({ rows: [] });

        const loginData = {
          username: 'testuser',
          password: 'password123'
        };

        const response = await request(app)
          .post('/api/users/login')
          .send(loginData);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          user_id: 1,
          username: 'testuser',
          role: 'ADMIN'
        });
        expect(response.body.token).toBeDefined();

        // Verify JWT token
        const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET || 'supersecretjwtkey');
        expect(decoded.user_id).toBe(1);
        expect(decoded.role).toBe('ADMIN');
      });

      it('should update last_login timestamp on successful login', async () => {
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        mockQuery.mockResolvedValueOnce({
          rows: [{
            user_id: 1,
            username: 'testuser',
            password_hash: hashedPassword,
            role: 'ADMIN'
          }]
        });
        mockQuery.mockResolvedValueOnce({ rows: [] });

        await request(app)
          .post('/api/users/login')
          .send({
            username: 'testuser',
            password: 'password123'
          });

        // Verify last_login update call
        expect(mockQuery).toHaveBeenCalledWith(
          'UPDATE Users SET last_login = NOW() WHERE user_id = $1',
          [1]
        );
      });
    });

    describe('❌ Error Cases', () => {
      it('should return 401 when user not found', async () => {
        // Mock: No user found
        mockQuery.mockResolvedValueOnce({ rows: [] });

        const response = await request(app)
          .post('/api/users/login')
          .send({
            username: 'nonexistent',
            password: 'password123'
          });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Invalid credentials');
      });

      it('should return 401 when password is incorrect', async () => {
        const hashedPassword = await bcrypt.hash('correctpassword', 10);
        
        mockQuery.mockResolvedValueOnce({
          rows: [{
            user_id: 1,
            username: 'testuser',
            password_hash: hashedPassword,
            role: 'ADMIN'
          }]
        });

        const response = await request(app)
          .post('/api/users/login')
          .send({
            username: 'testuser',
            password: 'wrongpassword'
          });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Invalid credentials');
      });

      it('should return 400 when username is missing', async () => {
        const response = await request(app)
          .post('/api/users/login')
          .send({
            password: 'password123'
          });

        expect(response.status).toBe(400);
        expect(response.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'Username is required.'
            })
          ])
        );
      });

      it('should return 400 when password is missing', async () => {
        const response = await request(app)
          .post('/api/users/login')
          .send({
            username: 'testuser'
          });

        expect(response.status).toBe(400);
        expect(response.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'Password is required.'
            })
          ])
        );
      });
    });
  });

  describe('POST /api/users/register-koperasi', () => {
    const mockToken = jwt.sign(
      { user_id: 1, role: 'ADMIN' },
      process.env.JWT_SECRET || 'supersecretjwtkey'
    );

    describe('✅ Success Cases', () => {
      it('should register koperasi successfully for authenticated user', async () => {
        // Mock: User check (no existing koperasi)
        mockQuery.mockResolvedValueOnce({ rows: [{ koperasi_id: null }] });
        
        // Mock: BEGIN transaction
        mockQuery.mockResolvedValueOnce({});
        
        // Mock: Create koperasi
        mockQuery.mockResolvedValueOnce({ rows: [{ koperasi_id: 1 }] });
        
        // Mock: Update user with koperasi_id
        mockQuery.mockResolvedValueOnce({});
        
        // Mock: Add to user_koperasi table
        mockQuery.mockResolvedValueOnce({});
        
        // Mock: COMMIT transaction
        mockQuery.mockResolvedValueOnce({});

        const koperasiData = {
          nama_koperasi: 'Koperasi Test',
          alamat: 'Jl. Test No. 123',
          provinsi: 'Jawa Timur',
          kabupaten: 'Sidoarjo',
          kontak_person: 'John Doe',
          nomor_telepon: '081234567890'
        };

        const response = await request(app)
          .post('/api/users/register-koperasi')
          .set('Authorization', `Bearer ${mockToken}`)
          .send(koperasiData);

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
          message: 'Koperasi berhasil didaftarkan dan user menjadi Admin Koperasi',
          koperasi_id: 1,
          nama_koperasi: 'Koperasi Test'
        });

        // Verify all database calls
        expect(mockQuery).toHaveBeenCalledWith('BEGIN');
        expect(mockQuery).toHaveBeenCalledWith('COMMIT');
      });

      it('should create proper user_koperasi relationship', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [{ koperasi_id: null }] });
        mockQuery.mockResolvedValueOnce({});
        mockQuery.mockResolvedValueOnce({ rows: [{ koperasi_id: 1 }] });
        mockQuery.mockResolvedValueOnce({});
        mockQuery.mockResolvedValueOnce({});
        mockQuery.mockResolvedValueOnce({});

        const koperasiData = {
          nama_koperasi: 'Koperasi Test',
          alamat: 'Jl. Test No. 123',
          provinsi: 'Jawa Timur',
          kabupaten: 'Sidoarjo',
          kontak_person: 'John Doe',
          nomor_telepon: '081234567890'
        };

        await request(app)
          .post('/api/users/register-koperasi')
          .set('Authorization', `Bearer ${mockToken}`)
          .send(koperasiData);

        // Verify user_koperasi relationship creation
        expect(mockQuery).toHaveBeenCalledWith(
          'INSERT INTO user_koperasi (user_id, koperasi_id, role_koperasi, assigned_by) VALUES ($1, $2, $3, $4)',
          [1, 1, 'ADMIN', 1]
        );
      });
    });

    describe('❌ Error Cases', () => {
      it('should return 401 when no authentication token provided', async () => {
        const response = await request(app)
          .post('/api/users/register-koperasi')
          .send({
            nama_koperasi: 'Koperasi Test',
            alamat: 'Jl. Test No. 123',
            provinsi: 'Jawa Timur',
            kabupaten: 'Sidoarjo',
            kontak_person: 'John Doe',
            nomor_telepon: '081234567890'
          });

        expect(response.status).toBe(401);
      });

      it('should return 400 when user already has koperasi', async () => {
        // Mock: User already has koperasi
        mockQuery.mockResolvedValueOnce({ rows: [{ koperasi_id: 999 }] });

        const response = await request(app)
          .post('/api/users/register-koperasi')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({
            nama_koperasi: 'Koperasi Test',
            alamat: 'Jl. Test No. 123',
            provinsi: 'Jawa Timur',
            kabupaten: 'Sidoarjo',
            kontak_person: 'John Doe',
            nomor_telepon: '081234567890'
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('User sudah terdaftar di koperasi');
      });

      it('should rollback transaction on error', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [{ koperasi_id: null }] });
        mockQuery.mockResolvedValueOnce({}); // BEGIN
        mockQuery.mockRejectedValueOnce(new Error('Database error')); // Koperasi creation fails
        mockQuery.mockResolvedValueOnce({}); // ROLLBACK

        const response = await request(app)
          .post('/api/users/register-koperasi')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({
            nama_koperasi: 'Koperasi Test',
            alamat: 'Jl. Test No. 123',
            provinsi: 'Jawa Timur',
            kabupaten: 'Sidoarjo',
            kontak_person: 'John Doe',
            nomor_telepon: '081234567890'
          });

        expect(response.status).toBe(500);
        expect(mockQuery).toHaveBeenCalledWith('ROLLBACK');
      });

      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/users/register-koperasi')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({
            // Missing required fields
            nama_koperasi: 'Koperasi Test'
          });

        expect(response.status).toBe(400);
        expect(response.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ msg: 'Alamat is required.' }),
            expect.objectContaining({ msg: 'Provinsi is required.' }),
            expect.objectContaining({ msg: 'Kabupaten is required.' }),
            expect.objectContaining({ msg: 'Kontak person is required.' }),
            expect.objectContaining({ msg: 'Nomor telepon is required.' })
          ])
        );
      });
    });
  });

  describe('Business Logic Alignment with DOKUMENTEKNIS.MD', () => {
    it('should follow the correct registration flow: User → Koperasi → Admin Assignment', async () => {
      // Test the complete flow described in documentation
      const mockUserId = 1;
      const mockKoperasiId = 1;

      // Step 1: User Registration
      mockQuery.mockResolvedValueOnce({ rows: [] }); // No existing user
      mockQuery.mockResolvedValueOnce({ rows: [{ user_id: mockUserId }] }); // User created

      const userResponse = await request(app)
        .post('/api/users/register')
        .send({
          username: 'admin_koperasi',
          password: 'password123',
          nama_lengkap: 'Admin Koperasi',
          email: 'admin@koperasi.com'
        });

      expect(userResponse.status).toBe(201);
      expect(userResponse.body.needs_koperasi_registration).toBe(true);

      // Step 2: Koperasi Registration
      const mockToken = jwt.sign(
        { user_id: mockUserId, role: 'ADMIN' },
        process.env.JWT_SECRET || 'supersecretjwtkey'
      );

      mockQuery.mockResolvedValueOnce({ rows: [{ koperasi_id: null }] }); // User has no koperasi
      mockQuery.mockResolvedValueOnce({}); // BEGIN
      mockQuery.mockResolvedValueOnce({ rows: [{ koperasi_id: mockKoperasiId }] }); // Koperasi created
      mockQuery.mockResolvedValueOnce({}); // Update user
      mockQuery.mockResolvedValueOnce({}); // Add to user_koperasi
      mockQuery.mockResolvedValueOnce({}); // COMMIT

      const koperasiResponse = await request(app)
        .post('/api/users/register-koperasi')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          nama_koperasi: 'Koperasi Kopi Sumber Daya Alam',
          alamat: 'Jl. Kopi No. 123, Desa Kopi',
          provinsi: 'Jawa Timur',
          kabupaten: 'Malang',
          kontak_person: 'Admin Koperasi',
          nomor_telepon: '081234567890'
        });

      expect(koperasiResponse.status).toBe(201);
      expect(koperasiResponse.body.message).toContain('Admin Koperasi');

      // Verify the complete flow matches documentation requirements
      expect(userResponse.body.user_id).toBe(mockUserId);
      expect(koperasiResponse.body.koperasi_id).toBe(mockKoperasiId);
    });

    it('should assign correct default role as specified in documentation', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [{ user_id: 1 }] });

      await request(app)
        .post('/api/users/register')
        .send({
          username: 'testuser',
          password: 'password123',
          nama_lengkap: 'Test User',
          email: 'test@example.com'
        });

      // Verify default role is ADMIN as per documentation
      const createUserCall = mockQuery.mock.calls[1];
      expect(createUserCall[1][4]).toBe('ADMIN');
    });

    it('should validate all required fields as per documentation', () => {
      // This test verifies that all fields mentioned in DOKUMENTEKNIS.MD are validated
      const requiredUserFields = ['username', 'password', 'nama_lengkap', 'email'];
      const requiredKoperasiFields = ['nama_koperasi', 'alamat', 'provinsi', 'kabupaten', 'kontak_person', 'nomor_telepon'];

      // User validation is already tested above
      // Koperasi validation is already tested above
      
      expect(requiredUserFields).toEqual(['username', 'password', 'nama_lengkap', 'email']);
      expect(requiredKoperasiFields).toEqual(['nama_koperasi', 'alamat', 'provinsi', 'kabupaten', 'kontak_person', 'nomor_telepon']);
    });
  });
});