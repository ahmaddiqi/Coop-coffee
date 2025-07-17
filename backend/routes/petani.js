const express = require('express');
const router = express.Router();
const db = require('../db');
const { body, validationResult } = require('express-validator');
const { authenticateToken, authorizeRoles, getAccessibleKoperasi } = require('../middleware/auth');

// Get all petani (filtered by user's koperasi access)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { user_id, role } = req.user;
    
    // Get accessible koperasi IDs for this user
    const accessibleKoperasi = await getAccessibleKoperasi(user_id, role);
    
    if (accessibleKoperasi.length === 0) {
      return res.status(200).json([]);
    }
    
    // Filter petani by accessible koperasi
    const placeholders = accessibleKoperasi.map((_, index) => `$${index + 1}`).join(',');
    const result = await db.query(
      `SELECT * FROM Petani WHERE koperasi_id IN (${placeholders}) ORDER BY nama`,
      accessibleKoperasi
    );
    
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single petani by id (with koperasi access check)
router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { user_id, role } = req.user;
    
    try {
        // Get accessible koperasi IDs for this user
        const accessibleKoperasi = await getAccessibleKoperasi(user_id, role);
        
        if (accessibleKoperasi.length === 0) {
            return res.status(403).json({ message: 'No access to any koperasi' });
        }
        
        // Check if petani exists and user has access to its koperasi
        const placeholders = accessibleKoperasi.map((_, index) => `$${index + 2}`).join(',');
        const result = await db.query(
            `SELECT * FROM Petani WHERE petani_id = $1 AND koperasi_id IN (${placeholders})`,
            [id, ...accessibleKoperasi]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Petani not found or access denied' });
        }
        
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new petani (Admin or Operator)
router.post('/', [
    authenticateToken,
    authorizeRoles(['ADMIN', 'OPERATOR']),
    body('koperasi_id').notEmpty().withMessage('Koperasi ID is required.'),
    body('nama').notEmpty().withMessage('Nama is required.'),
    body('kontak').optional().matches(/^[\+]?[0-9]{10,15}$/).withMessage('Nomor telepon harus dalam format yang valid (10-15 digit)'),
    body('alamat').notEmpty().withMessage('Alamat is required.'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { koperasi_id, nama, kontak, alamat } = req.body;

    try {
        // Check for duplicate petani in the same koperasi (business logic from dokumentasi)
        const existingPetani = await db.query(
            'SELECT petani_id FROM Petani WHERE koperasi_id = $1 AND nama = $2',
            [koperasi_id, nama]
        );

        if (existingPetani.rows.length > 0) {
            return res.status(400).json({ message: 'Petani dengan nama yang sama sudah terdaftar di koperasi ini' });
        }

        const result = await db.query(
            'INSERT INTO Petani (koperasi_id, nama, kontak, alamat) VALUES ($1, $2, $3, $4) RETURNING *',
            [koperasi_id, nama, kontak, alamat]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a petani (Admin or Operator)
router.put('/:id', [
    authenticateToken,
    authorizeRoles(['ADMIN', 'OPERATOR']),
    body('koperasi_id').notEmpty().withMessage('Koperasi ID is required.'),
    body('nama').notEmpty().withMessage('Nama is required.'),
    body('kontak').optional().matches(/^[\+]?[0-9]{10,15}$/).withMessage('Nomor telepon harus dalam format yang valid (10-15 digit)'),
    body('alamat').notEmpty().withMessage('Alamat is required.'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { koperasi_id, nama, kontak, alamat } = req.body;

    try {
        const result = await db.query(
            'UPDATE Petani SET koperasi_id = $1, nama = $2, kontak = $3, alamat = $4 WHERE petani_id = $5 RETURNING *',
            [koperasi_id, nama, kontak, alamat, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Petani not found' });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a petani (Admin or Operator)
router.delete('/:id', authenticateToken, authorizeRoles(['ADMIN', 'OPERATOR']), async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query('DELETE FROM Petani WHERE petani_id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Petani not found' });
        }

        res.status(200).json({ message: 'Petani deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get land statistics for all farmers (for PetaniManagement table)
router.get('/land-stats', authenticateToken, authorizeRoles(['ADMIN', 'OPERATOR']), async (req, res) => {
  try {
    const landStats = await db.query(
      `SELECT 
        p.petani_id,
        COUNT(l.lahan_id) as jumlah_lahan,
        COALESCE(SUM(l.luas_hektar), 0) as total_luas_hektar
      FROM Petani p
      LEFT JOIN Lahan l ON p.petani_id = l.petani_id
      GROUP BY p.petani_id
      ORDER BY p.petani_id`
    );

    // Convert to object for easy lookup
    const statsLookup = {};
    landStats.rows.forEach(stat => {
      statsLookup[stat.petani_id] = {
        jumlah_lahan: parseInt(stat.jumlah_lahan),
        total_luas_hektar: parseFloat(stat.total_luas_hektar)
      };
    });

    res.status(200).json(statsLookup);
  } catch (err) {
    console.error('Land stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
