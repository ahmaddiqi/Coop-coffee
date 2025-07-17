const express = require('express');
const router = express.Router();
const db = require('../db');
const { body, validationResult } = require('express-validator');
const { authenticateToken, authorizeRoles, getAccessibleKoperasi } = require('../middleware/auth');

// Get all koperasi (filtered by access permissions)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const accessibleKoperasiIds = await getAccessibleKoperasi(req.user.user_id, req.user.role);
    
    if (req.user.role === 'SUPER_ADMIN') {
      // SUPER_ADMIN sees all cooperatives
      const result = await db.query('SELECT * FROM Koperasi ORDER BY nama_koperasi');
      res.status(200).json(result.rows);
    } else if (accessibleKoperasiIds.length > 0) {
      // ADMIN and OPERATOR see only their assigned cooperatives
      const placeholders = accessibleKoperasiIds.map((_, index) => `$${index + 1}`).join(',');
      const result = await db.query(
        `SELECT * FROM Koperasi WHERE koperasi_id IN (${placeholders}) ORDER BY nama_koperasi`,
        accessibleKoperasiIds
      );
      res.status(200).json(result.rows);
    } else {
      // User has no assigned cooperatives
      res.status(200).json([]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single koperasi by id
router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM Koperasi WHERE koperasi_id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Koperasi not found' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new koperasi (Admin Only)
router.post('/', [
    authenticateToken,
    authorizeRoles(['ADMIN', 'SUPER_ADMIN']),
    body('nama_koperasi').notEmpty().withMessage('Nama Koperasi is required.'),
    body('alamat').notEmpty().withMessage('Alamat is required.'),
    body('provinsi').notEmpty().withMessage('Provinsi is required.'),
    body('kabupaten').notEmpty().withMessage('Kabupaten is required.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { nama_koperasi, alamat, provinsi, kabupaten, kontak_person, nomor_telepon } = req.body;
    const { user_id } = req.user; // Get created_by from authenticated user

    try {
        const result = await db.query(
            'INSERT INTO Koperasi (nama_koperasi, alamat, provinsi, kabupaten, kontak_person, nomor_telepon, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [nama_koperasi, alamat, provinsi, kabupaten, kontak_person, nomor_telepon, user_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a koperasi (Admin Only)
router.put('/:id', [
    authenticateToken,
    authorizeRoles(['ADMIN', 'SUPER_ADMIN']),
    body('nama_koperasi').notEmpty().withMessage('Nama Koperasi is required.'),
    body('alamat').notEmpty().withMessage('Alamat is required.'),
    body('provinsi').notEmpty().withMessage('Provinsi is required.'),
    body('kabupaten').notEmpty().withMessage('Kabupaten is required.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { nama_koperasi, alamat, provinsi, kabupaten, kontak_person, nomor_telepon } = req.body;

    try {
        const result = await db.query(
            'UPDATE Koperasi SET nama_koperasi = $1, alamat = $2, provinsi = $3, kabupaten = $4, kontak_person = $5, nomor_telepon = $6 WHERE koperasi_id = $7 RETURNING *',
            [nama_koperasi, alamat, provinsi, kabupaten, kontak_person, nomor_telepon, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Koperasi not found' });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a koperasi (Admin Only)
router.delete('/:id', authenticateToken, authorizeRoles(['ADMIN']), async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query('DELETE FROM Koperasi WHERE koperasi_id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Koperasi not found' });
        }

        res.status(200).json({ message: 'Koperasi deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
