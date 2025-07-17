const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Register new user (step 1 - user only, no koperasi yet)
router.post('/register', [
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
        const existingUser = await db.query(
            'SELECT user_id FROM Users WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'Username atau email sudah terdaftar' });
        }

        // Create user without koperasi (koperasi_id = null)
        const role = 'ADMIN'; // Default role for new Users
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const result = await db.query(
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

// Create a new user (Admin Only)
router.post('/', [
    authenticateToken,
    authorizeRoles(['ADMIN', 'SUPER_ADMIN']),
    body('username').notEmpty().withMessage('Username is required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
    body('nama_lengkap').notEmpty().withMessage('Full name is required.'),
    body('email').isEmail().withMessage('Invalid email format.'),
    body('role').isIn(['ADMIN', 'OPERATOR', 'SUPER_ADMIN']).withMessage('Invalid role specified.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, nama_lengkap, email, role } = req.body;

    try {
        // Check if username already exists
        const existingUser = await db.query('SELECT * FROM Users WHERE username = $1', [username]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const result = await db.query(
            'INSERT INTO Users (username, password_hash, nama_lengkap, email, role) VALUES ($1, $2, $3, $4, $5) RETURNING user_id',
            [username, password_hash, nama_lengkap, email, role.toUpperCase()]
        );
        res.status(201).json({ message: 'User created successfully', user_id: result.rows[0].user_id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// User login
router.post('/login', [
    body('username').notEmpty().withMessage('Username is required.'),
    body('password').notEmpty().withMessage('Password is required.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
        const result = await db.query('SELECT * FROM Users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Update last_login
        await db.query('UPDATE Users SET last_login = NOW() WHERE user_id = $1', [user.user_id]);

        // Generate JWT
        const token = jwt.sign(
            { user_id: user.user_id, role: user.role },
            process.env.JWT_SECRET || 'supersecretjwtkey',
            { expiresIn: '1h' }
        );

        res.json({ token, user_id: user.user_id, username: user.username, role: user.role });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all Users (Admin Only - placeholder for middleware)
router.get('/', authenticateToken, authorizeRoles(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const result = await db.query('SELECT user_id, username, nama_lengkap, email, role, is_active FROM Users');
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset password (Admin Only - placeholder for middleware)
router.put('/:user_id/reset-password', authenticateToken, authorizeRoles(['ADMIN']), async (req, res) => {
  const { user_id } = req.params;
  const { new_password } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(new_password, salt);

    await db.query('UPDATE Users SET password_hash = $1 WHERE user_id = $2', [password_hash, user_id]);
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Deactivate user (Admin Only - placeholder for middleware)
router.put('/:user_id/deactivate', authenticateToken, authorizeRoles(['ADMIN']), async (req, res) => {
  const { user_id } = req.params;

  try {
    await db.query('UPDATE Users SET is_active = FALSE WHERE user_id = $1', [user_id]);
    res.status(200).json({ message: 'User deactivated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Activate user (Admin Only)
router.put('/:user_id/activate', authenticateToken, authorizeRoles(['ADMIN']), async (req, res) => {
  const { user_id } = req.params;

  try {
    await db.query('UPDATE Users SET is_active = TRUE WHERE user_id = $1', [user_id]);
    res.status(200).json({ message: 'User activated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change user role (Admin Only)
router.put('/:user_id/role', authenticateToken, authorizeRoles(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  const { user_id } = req.params;
  const { role } = req.body;

  const validRoles = ['ADMIN', 'OPERATOR'];
  if (!role || !validRoles.includes(role.toUpperCase())) {
    return res.status(400).json({ message: 'Invalid role provided.' });
  }

  try {
    await db.query('UPDATE Users SET role = $1 WHERE user_id = $2', [role.toUpperCase(), user_id]);
    res.status(200).json({ message: 'User role updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    const result = await db.query(
      `SELECT 
        user_id, 
        username, 
        nama_lengkap, 
        email, 
        role, 
        koperasi_id, 
        is_active 
      FROM Users 
      WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Register koperasi for logged-in user (step 2 after user registration)
router.post('/register-koperasi', [
    authenticateToken,
    body('nama_koperasi').notEmpty().withMessage('Nama koperasi is required.'),
    body('alamat').notEmpty().withMessage('Alamat is required.'),
    body('provinsi').notEmpty().withMessage('Provinsi is required.'),
    body('kabupaten').notEmpty().withMessage('Kabupaten is required.'),
    body('kontak_person').notEmpty().withMessage('Kontak person is required.'),
    body('nomor_telepon').notEmpty().withMessage('Nomor telepon is required.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { nama_koperasi, alamat, provinsi, kabupaten, kontak_person, nomor_telepon } = req.body;
    const userId = req.user.user_id;

    try {
        // Check if user already has koperasi
        const userCheck = await db.query(
            'SELECT koperasi_id FROM Users WHERE user_id = $1',
            [userId]
        );

        if (userCheck.rows[0].koperasi_id) {
            return res.status(400).json({ message: 'User sudah terdaftar di koperasi' });
        }

        // Start transaction
        await db.query('BEGIN');

        // Create koperasi
        const koperasiResult = await db.query(
            'INSERT INTO Koperasi (nama_koperasi, alamat, provinsi, kabupaten, kontak_person, nomor_telepon, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING koperasi_id',
            [nama_koperasi, alamat, provinsi, kabupaten, kontak_person, nomor_telepon, userId]
        );

        const koperasiId = koperasiResult.rows[0].koperasi_id;

        // Update user with koperasi_id
        await db.query(
            'UPDATE Users SET koperasi_id = $1 WHERE user_id = $2',
            [koperasiId, userId]
        );

        // Add user to user_koperasi table as ADMIN
        await db.query(
            'INSERT INTO user_koperasi (user_id, koperasi_id, role_koperasi, assigned_by) VALUES ($1, $2, $3, $4)',
            [userId, koperasiId, 'ADMIN', userId]
        );

        // Commit transaction
        await db.query('COMMIT');

        res.status(201).json({
            message: 'Koperasi berhasil didaftarkan dan user menjadi Admin Koperasi',
            koperasi_id: koperasiId,
            nama_koperasi: nama_koperasi
        });
    } catch (err) {
        // Rollback transaction on error
        await db.query('ROLLBACK');
        console.error("Koperasi Registration Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Create user directly for admin's koperasi (Direct Registration)
router.post('/create-for-koperasi', [
    authenticateToken,
    authorizeRoles(['ADMIN']),
    body('username').notEmpty().withMessage('Username is required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
    body('nama_lengkap').notEmpty().withMessage('Full name is required.'),
    body('email').isEmail().withMessage('Invalid email format.'),
    body('role').isIn(['ADMIN', 'OPERATOR']).withMessage('Invalid role specified.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, nama_lengkap, email, role } = req.body;
    const adminUserId = req.user.user_id;

    try {
        // Get admin's koperasi_id
        const adminResult = await db.query(
            'SELECT koperasi_id FROM Users WHERE user_id = $1',
            [adminUserId]
        );

        if (!adminResult.rows[0].koperasi_id) {
            return res.status(400).json({ message: 'Admin belum terdaftar di koperasi' });
        }

        const koperasiId = adminResult.rows[0].koperasi_id;

        // Check if username already exists
        const existingUser = await db.query('SELECT * FROM Users WHERE username = $1', [username]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'Username sudah digunakan' });
        }

        // Check if email already exists
        const existingEmail = await db.query('SELECT * FROM Users WHERE email = $1', [email]);
        if (existingEmail.rows.length > 0) {
            return res.status(400).json({ message: 'Email sudah digunakan' });
        }

        // Start transaction
        await db.query('BEGIN');

        // Create user with koperasi_id
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const userResult = await db.query(
            'INSERT INTO Users (username, password_hash, nama_lengkap, email, role, koperasi_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id',
            [username, password_hash, nama_lengkap, email, role.toUpperCase(), koperasiId]
        );

        const newUserId = userResult.rows[0].user_id;

        // Add to user_koperasi table
        await db.query(
            'INSERT INTO user_koperasi (user_id, koperasi_id, role_koperasi, assigned_by) VALUES ($1, $2, $3, $4)',
            [newUserId, koperasiId, role.toUpperCase(), adminUserId]
        );

        // Commit transaction
        await db.query('COMMIT');

        res.status(201).json({ 
            message: 'User berhasil dibuat dan ditambahkan ke koperasi',
            user_id: newUserId,
            username: username,
            nama_lengkap: nama_lengkap,
            role: role.toUpperCase(),
            koperasi_id: koperasiId
        });
    } catch (err) {
        // Rollback transaction on error
        await db.query('ROLLBACK');
        console.error('Create user for koperasi error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Generate invite link for koperasi
router.post('/generate-invite', [
    authenticateToken,
    authorizeRoles(['ADMIN'])
], async (req, res) => {
    try {
        const adminUserId = req.user.user_id;
        
        // Get admin's koperasi_id
        const adminResult = await db.query(
            'SELECT koperasi_id FROM Users WHERE user_id = $1',
            [adminUserId]
        );

        if (!adminResult.rows[0].koperasi_id) {
            return res.status(400).json({ message: 'Admin belum terdaftar di koperasi' });
        }

        const koperasiId = adminResult.rows[0].koperasi_id;
        
        // Generate unique invite token (expires in 7 days)
        const crypto = require('crypto');
        const inviteToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Store invite token in database (you might need to create invitations table)
        await db.query(
            `INSERT INTO invitations (invite_token, koperasi_id, created_by, expires_at, is_used) 
             VALUES ($1, $2, $3, $4, $5)`,
            [inviteToken, koperasiId, adminUserId, expiresAt, false]
        );

        const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invite/${inviteToken}`;

        res.status(201).json({
            message: 'Invite link berhasil dibuat',
            invite_link: inviteLink,
            expires_at: expiresAt
        });
    } catch (err) {
        console.error('Generate invite error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Register user via invite link
router.post('/register-via-invite/:token', [
    body('username').notEmpty().withMessage('Username is required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
    body('nama_lengkap').notEmpty().withMessage('Full name is required.'),
    body('email').isEmail().withMessage('Invalid email format.'),
    body('role').isIn(['ADMIN', 'OPERATOR']).withMessage('Invalid role specified.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { token } = req.params;
    const { username, password, nama_lengkap, email, role } = req.body;

    try {
        // Check if invite token is valid and not expired
        const inviteResult = await db.query(
            `SELECT * FROM invitations 
             WHERE invite_token = $1 AND expires_at > NOW() AND is_used = FALSE`,
            [token]
        );

        if (inviteResult.rows.length === 0) {
            return res.status(400).json({ message: 'Link undangan tidak valid atau sudah kedaluwarsa' });
        }

        const invitation = inviteResult.rows[0];
        const koperasiId = invitation.koperasi_id;

        // Check if username/email already exists
        const existingUser = await db.query(
            'SELECT user_id FROM Users WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'Username atau email sudah terdaftar' });
        }

        // Start transaction
        await db.query('BEGIN');

        // Create user with koperasi_id
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const userResult = await db.query(
            'INSERT INTO Users (username, password_hash, nama_lengkap, email, role, koperasi_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id',
            [username, password_hash, nama_lengkap, email, role.toUpperCase(), koperasiId]
        );

        const newUserId = userResult.rows[0].user_id;

        // Add to user_koperasi table
        await db.query(
            'INSERT INTO user_koperasi (user_id, koperasi_id, role_koperasi, assigned_by) VALUES ($1, $2, $3, $4)',
            [newUserId, koperasiId, role.toUpperCase(), invitation.created_by]
        );

        // Mark invitation as used
        await db.query(
            'UPDATE invitations SET is_used = TRUE, used_by = $1, used_at = NOW() WHERE invite_token = $2',
            [newUserId, token]
        );

        // Commit transaction
        await db.query('COMMIT');

        res.status(201).json({
            message: 'User berhasil didaftarkan melalui undangan',
            user_id: newUserId,
            username: username,
            nama_lengkap: nama_lengkap,
            role: role.toUpperCase(),
            koperasi_id: koperasiId
        });
    } catch (err) {
        // Rollback transaction on error
        await db.query('ROLLBACK');
        console.error('Register via invite error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Validate invite token
router.get('/validate-invite/:token', async (req, res) => {
    const { token } = req.params;

    try {
        const inviteResult = await db.query(
            `SELECT i.*, k.nama_koperasi 
             FROM invitations i 
             JOIN Koperasi k ON i.koperasi_id = k.koperasi_id
             WHERE i.invite_token = $1 AND i.expires_at > NOW() AND i.is_used = FALSE`,
            [token]
        );

        if (inviteResult.rows.length === 0) {
            return res.status(404).json({ message: 'Link undangan tidak valid atau sudah kedaluwarsa' });
        }

        const invitation = inviteResult.rows[0];
        res.status(200).json({
            valid: true,
            koperasi_name: invitation.nama_koperasi,
            expires_at: invitation.expires_at
        });
    } catch (err) {
        console.error('Validate invite error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
