const request = require('supertest');
const app = require('../index');
const db = require('../db');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Mock database functions
jest.mock('../db');

describe('Invite System Module', () => {
  let mockDb;
  const mockAdminToken = jwt.sign(
    { user_id: 1, role: 'ADMIN' },
    process.env.JWT_SECRET || 'supersecretjwtkey'
  );

  beforeEach(() => {
    mockDb = db;
    jest.clearAllMocks();
  });

  describe('POST /api/users/generate-invite', () => {
    describe('✅ Success Cases', () => {
      it('should generate invite link successfully for admin with koperasi', async () => {
        // Mock: Admin has koperasi
        mockDb.query.mockResolvedValueOnce({ rows: [{ koperasi_id: 1 }] });
        
        // Mock: Insert invitation
        mockDb.query.mockResolvedValueOnce({ rows: [] });

        const response = await request(app)
          .post('/api/users/generate-invite')
          .set('Authorization', `Bearer ${mockAdminToken}`);

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
          message: 'Invite link berhasil dibuat'
        });
        expect(response.body.invite_link).toMatch(/\/invite\/[a-f0-9]{64}$/);
        expect(response.body.expires_at).toBeDefined();

        // Verify database calls
        expect(mockDb.query).toHaveBeenCalledWith(
          'SELECT koperasi_id FROM Users WHERE user_id = $1',
          [1]
        );

        // Verify invitation insertion
        const insertCall = mockDb.query.mock.calls[1];
        expect(insertCall[0]).toContain('INSERT INTO invitations');
        expect(insertCall[1]).toHaveLength(5); // invite_token, koperasi_id, created_by, expires_at, is_used
        expect(insertCall[1][1]).toBe(1); // koperasi_id
        expect(insertCall[1][2]).toBe(1); // created_by
        expect(insertCall[1][4]).toBe(false); // is_used
      });

      it('should generate unique invite tokens', async () => {
        mockDb.query.mockResolvedValue({ rows: [{ koperasi_id: 1 }] });
        mockDb.query.mockResolvedValue({ rows: [] });

        // Generate multiple invites
        const response1 = await request(app)
          .post('/api/users/generate-invite')
          .set('Authorization', `Bearer ${mockAdminToken}`);

        const response2 = await request(app)
          .post('/api/users/generate-invite')
          .set('Authorization', `Bearer ${mockAdminToken}`);

        expect(response1.status).toBe(201);
        expect(response2.status).toBe(201);
        expect(response1.body.invite_link).not.toBe(response2.body.invite_link);
      });

      it('should set correct expiration time (7 days)', async () => {
        mockDb.query.mockResolvedValueOnce({ rows: [{ koperasi_id: 1 }] });
        mockDb.query.mockResolvedValueOnce({ rows: [] });

        const beforeTime = new Date();
        
        const response = await request(app)
          .post('/api/users/generate-invite')
          .set('Authorization', `Bearer ${mockAdminToken}`);

        const afterTime = new Date();
        const expiresAt = new Date(response.body.expires_at);
        
        // Should expire in approximately 7 days
        const expectedMinExpiration = new Date(beforeTime.getTime() + 7 * 24 * 60 * 60 * 1000);
        const expectedMaxExpiration = new Date(afterTime.getTime() + 7 * 24 * 60 * 60 * 1000);

        expect(expiresAt >= expectedMinExpiration).toBe(true);
        expect(expiresAt <= expectedMaxExpiration).toBe(true);
      });
    });

    describe('❌ Error Cases', () => {
      it('should return 401 when no authentication token provided', async () => {
        const response = await request(app)
          .post('/api/users/generate-invite');

        expect(response.status).toBe(401);
      });

      it('should return 400 when admin has no koperasi', async () => {
        // Mock: Admin has no koperasi
        mockDb.query.mockResolvedValueOnce({ rows: [{ koperasi_id: null }] });

        const response = await request(app)
          .post('/api/users/generate-invite')
          .set('Authorization', `Bearer ${mockAdminToken}`);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Admin belum terdaftar di koperasi');
      });

      it('should return 500 when database error occurs', async () => {
        mockDb.query.mockRejectedValueOnce(new Error('Database error'));

        const response = await request(app)
          .post('/api/users/generate-invite')
          .set('Authorization', `Bearer ${mockAdminToken}`);

        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Database error');
      });

      it('should require ADMIN role', async () => {
        const operatorToken = jwt.sign(
          { user_id: 2, role: 'OPERATOR' },
          process.env.JWT_SECRET || 'supersecretjwtkey'
        );

        const response = await request(app)
          .post('/api/users/generate-invite')
          .set('Authorization', `Bearer ${operatorToken}`);

        expect(response.status).toBe(403);
      });
    });
  });

  describe('GET /api/users/validate-invite/:token', () => {
    describe('✅ Success Cases', () => {
      it('should validate valid invite token successfully', async () => {
        const mockToken = 'valid-token-123';
        const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow

        // Mock: Valid invitation found
        mockDb.query.mockResolvedValueOnce({
          rows: [{
            invite_token: mockToken,
            koperasi_id: 1,
            expires_at: futureDate,
            is_used: false,
            nama_koperasi: 'Koperasi Test'
          }]
        });

        const response = await request(app)
          .get(`/api/users/validate-invite/${mockToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          valid: true,
          koperasi_name: 'Koperasi Test',
          expires_at: futureDate.toISOString()
        });

        // Verify database query
        expect(mockDb.query).toHaveBeenCalledWith(
          expect.stringContaining('SELECT i.*, k.nama_koperasi'),
          [mockToken]
        );
      });
    });

    describe('❌ Error Cases', () => {
      it('should return 404 for non-existent token', async () => {
        // Mock: No invitation found
        mockDb.query.mockResolvedValueOnce({ rows: [] });

        const response = await request(app)
          .get('/api/users/validate-invite/nonexistent-token');

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Link undangan tidak valid atau sudah kedaluwarsa');
      });

      it('should return 404 for expired token', async () => {
        const mockToken = 'expired-token-123';
        const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday

        // This would be filtered out by the SQL query (expires_at > NOW())
        mockDb.query.mockResolvedValueOnce({ rows: [] });

        const response = await request(app)
          .get(`/api/users/validate-invite/${mockToken}`);

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Link undangan tidak valid atau sudah kedaluwarsa');
      });

      it('should return 404 for already used token', async () => {
        const mockToken = 'used-token-123';

        // This would be filtered out by the SQL query (is_used = FALSE)
        mockDb.query.mockResolvedValueOnce({ rows: [] });

        const response = await request(app)
          .get(`/api/users/validate-invite/${mockToken}`);

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Link undangan tidak valid atau sudah kedaluwarsa');
      });

      it('should return 500 when database error occurs', async () => {
        mockDb.query.mockRejectedValueOnce(new Error('Database error'));

        const response = await request(app)
          .get('/api/users/validate-invite/some-token');

        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Database error');
      });
    });
  });

  describe('POST /api/users/register-via-invite/:token', () => {
    const validToken = 'valid-invite-token';
    const mockInvitation = {
      invite_token: validToken,
      koperasi_id: 1,
      created_by: 1,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      is_used: false
    };

    describe('✅ Success Cases', () => {
      it('should register user via invite successfully', async () => {
        // Mock: Valid invitation found
        mockDb.query.mockResolvedValueOnce({ rows: [mockInvitation] });
        
        // Mock: No existing user
        mockDb.query.mockResolvedValueOnce({ rows: [] });
        
        // Mock: BEGIN transaction
        mockDb.query.mockResolvedValueOnce({});
        
        // Mock: User creation
        mockDb.query.mockResolvedValueOnce({ rows: [{ user_id: 2 }] });
        
        // Mock: Add to user_koperasi
        mockDb.query.mockResolvedValueOnce({});
        
        // Mock: Mark invitation as used
        mockDb.query.mockResolvedValueOnce({});
        
        // Mock: COMMIT transaction
        mockDb.query.mockResolvedValueOnce({});

        const userData = {
          username: 'inviteduser',
          password: 'password123',
          nama_lengkap: 'Invited User',
          email: 'invited@example.com',
          role: 'OPERATOR'
        };

        const response = await request(app)
          .post(`/api/users/register-via-invite/${validToken}`)
          .send(userData);

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
          message: 'User berhasil didaftarkan melalui undangan',
          user_id: 2,
          username: 'inviteduser',
          nama_lengkap: 'Invited User',
          role: 'OPERATOR',
          koperasi_id: 1
        });

        // Verify transaction calls
        expect(mockDb.query).toHaveBeenCalledWith('BEGIN');
        expect(mockDb.query).toHaveBeenCalledWith('COMMIT');
        
        // Verify invitation marked as used
        expect(mockDb.query).toHaveBeenCalledWith(
          'UPDATE invitations SET is_used = TRUE, used_by = $1, used_at = NOW() WHERE invite_token = $2',
          [2, validToken]
        );
      });

      it('should create user with correct koperasi assignment', async () => {
        mockDb.query.mockResolvedValueOnce({ rows: [mockInvitation] });
        mockDb.query.mockResolvedValueOnce({ rows: [] });
        mockDb.query.mockResolvedValueOnce({}); // BEGIN
        mockDb.query.mockResolvedValueOnce({ rows: [{ user_id: 2 }] });
        mockDb.query.mockResolvedValueOnce({});
        mockDb.query.mockResolvedValueOnce({});
        mockDb.query.mockResolvedValueOnce({}); // COMMIT

        const userData = {
          username: 'inviteduser',
          password: 'password123',
          nama_lengkap: 'Invited User',
          email: 'invited@example.com',
          role: 'ADMIN'
        };

        await request(app)
          .post(`/api/users/register-via-invite/${validToken}`)
          .send(userData);

        // Verify user created with correct koperasi_id
        const createUserCall = mockDb.query.mock.calls[3];
        expect(createUserCall[1][5]).toBe(1); // koperasi_id

        // Verify user_koperasi relationship
        expect(mockDb.query).toHaveBeenCalledWith(
          'INSERT INTO user_koperasi (user_id, koperasi_id, role_koperasi, assigned_by) VALUES ($1, $2, $3, $4)',
          [2, 1, 'ADMIN', 1]
        );
      });
    });

    describe('❌ Validation Error Cases', () => {
      it('should validate all required fields', async () => {
        const response = await request(app)
          .post(`/api/users/register-via-invite/${validToken}`)
          .send({
            // Missing required fields
            username: 'testuser'
          });

        expect(response.status).toBe(400);
        expect(response.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ msg: 'Password must be at least 6 characters long.' }),
            expect.objectContaining({ msg: 'Full name is required.' }),
            expect.objectContaining({ msg: 'Invalid email format.' }),
            expect.objectContaining({ msg: 'Invalid role specified.' })
          ])
        );
      });

      it('should validate role field correctly', async () => {
        const response = await request(app)
          .post(`/api/users/register-via-invite/${validToken}`)
          .send({
            username: 'testuser',
            password: 'password123',
            nama_lengkap: 'Test User',
            email: 'test@example.com',
            role: 'INVALID_ROLE'
          });

        expect(response.status).toBe(400);
        expect(response.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ msg: 'Invalid role specified.' })
          ])
        );
      });
    });

    describe('❌ Business Logic Error Cases', () => {
      it('should return 400 for invalid/expired invite token', async () => {
        // Mock: No valid invitation found
        mockDb.query.mockResolvedValueOnce({ rows: [] });

        const userData = {
          username: 'testuser',
          password: 'password123',
          nama_lengkap: 'Test User',
          email: 'test@example.com',
          role: 'OPERATOR'
        };

        const response = await request(app)
          .post('/api/users/register-via-invite/invalid-token')
          .send(userData);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Link undangan tidak valid atau sudah kedaluwarsa');
      });

      it('should return 400 when username already exists', async () => {
        mockDb.query.mockResolvedValueOnce({ rows: [mockInvitation] });
        // Mock: Existing user found
        mockDb.query.mockResolvedValueOnce({ rows: [{ user_id: 999 }] });

        const userData = {
          username: 'existinguser',
          password: 'password123',
          nama_lengkap: 'Test User',
          email: 'test@example.com',
          role: 'OPERATOR'
        };

        const response = await request(app)
          .post(`/api/users/register-via-invite/${validToken}`)
          .send(userData);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Username atau email sudah terdaftar');
      });

      it('should return 400 when email already exists', async () => {
        mockDb.query.mockResolvedValueOnce({ rows: [mockInvitation] });
        // Mock: Existing user found
        mockDb.query.mockResolvedValueOnce({ rows: [{ user_id: 999 }] });

        const userData = {
          username: 'newuser',
          password: 'password123',
          nama_lengkap: 'Test User',
          email: 'existing@example.com',
          role: 'OPERATOR'
        };

        const response = await request(app)
          .post(`/api/users/register-via-invite/${validToken}`)
          .send(userData);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Username atau email sudah terdaftar');
      });

      it('should rollback transaction on error', async () => {
        mockDb.query.mockResolvedValueOnce({ rows: [mockInvitation] });
        mockDb.query.mockResolvedValueOnce({ rows: [] });
        mockDb.query.mockResolvedValueOnce({}); // BEGIN
        mockDb.query.mockRejectedValueOnce(new Error('Database error')); // User creation fails
        mockDb.query.mockResolvedValueOnce({}); // ROLLBACK

        const userData = {
          username: 'testuser',
          password: 'password123',
          nama_lengkap: 'Test User',
          email: 'test@example.com',
          role: 'OPERATOR'
        };

        const response = await request(app)
          .post(`/api/users/register-via-invite/${validToken}`)
          .send(userData);

        expect(response.status).toBe(500);
        expect(mockDb.query).toHaveBeenCalledWith('ROLLBACK');
      });
    });
  });

  describe('Business Logic Alignment with DOKUMENTEKNIS.MD', () => {
    it('should follow invite workflow: Generate → Validate → Register → Assign', async () => {
      // Step 1: Generate Invite
      mockDb.query.mockResolvedValueOnce({ rows: [{ koperasi_id: 1 }] });
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const generateResponse = await request(app)
        .post('/api/users/generate-invite')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(generateResponse.status).toBe(201);
      const inviteLink = generateResponse.body.invite_link;
      const token = inviteLink.split('/').pop();

      // Step 2: Validate Invite
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          invite_token: token,
          koperasi_id: 1,
          expires_at: futureDate,
          is_used: false,
          nama_koperasi: 'Koperasi Test'
        }]
      });

      const validateResponse = await request(app)
        .get(`/api/users/validate-invite/${token}`);

      expect(validateResponse.status).toBe(200);
      expect(validateResponse.body.valid).toBe(true);

      // Step 3: Register via Invite
      const mockInvitation = {
        invite_token: token,
        koperasi_id: 1,
        created_by: 1,
        expires_at: futureDate,
        is_used: false
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockInvitation] });
      mockDb.query.mockResolvedValueOnce({ rows: [] }); // No existing user
      mockDb.query.mockResolvedValueOnce({}); // BEGIN
      mockDb.query.mockResolvedValueOnce({ rows: [{ user_id: 2 }] }); // User created
      mockDb.query.mockResolvedValueOnce({}); // user_koperasi
      mockDb.query.mockResolvedValueOnce({}); // Mark used
      mockDb.query.mockResolvedValueOnce({}); // COMMIT

      const registerResponse = await request(app)
        .post(`/api/users/register-via-invite/${token}`)
        .send({
          username: 'inviteduser',
          password: 'password123',
          nama_lengkap: 'Invited User',
          email: 'invited@example.com',
          role: 'OPERATOR'
        });

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.koperasi_id).toBe(1);
      expect(registerResponse.body.role).toBe('OPERATOR');

      // Verify complete workflow
      expect(generateResponse.body.invite_link).toBeDefined();
      expect(validateResponse.body.koperasi_name).toBe('Koperasi Test');
      expect(registerResponse.body.message).toContain('undangan');
    });

    it('should properly handle role assignments as per documentation', async () => {
      const mockInvitation = {
        invite_token: 'test-token',
        koperasi_id: 1,
        created_by: 1,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        is_used: false
      };

      // Test ADMIN role assignment
      mockDb.query.mockResolvedValueOnce({ rows: [mockInvitation] });
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      mockDb.query.mockResolvedValueOnce({});
      mockDb.query.mockResolvedValueOnce({ rows: [{ user_id: 2 }] });
      mockDb.query.mockResolvedValueOnce({});
      mockDb.query.mockResolvedValueOnce({});
      mockDb.query.mockResolvedValueOnce({});

      await request(app)
        .post('/api/users/register-via-invite/test-token')
        .send({
          username: 'adminuser',
          password: 'password123',
          nama_lengkap: 'Admin User',
          email: 'admin@example.com',
          role: 'ADMIN'
        });

      // Verify ADMIN role is properly assigned
      const userCreationCall = mockDb.query.mock.calls[3];
      expect(userCreationCall[1][4]).toBe('ADMIN'); // role in Users table

      const userKoperasiCall = mockDb.query.mock.calls[4];
      expect(userKoperasiCall[1][2]).toBe('ADMIN'); // role_koperasi in user_koperasi table
    });

    it('should enforce 7-day expiration policy', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [{ koperasi_id: 1 }] });
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/users/generate-invite')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      const expiresAt = new Date(response.body.expires_at);
      const now = new Date();
      const diffDays = (expiresAt - now) / (1000 * 60 * 60 * 24);

      // Should be approximately 7 days (allowing for small time differences)
      expect(diffDays).toBeGreaterThan(6.9);
      expect(diffDays).toBeLessThan(7.1);
    });
  });
});