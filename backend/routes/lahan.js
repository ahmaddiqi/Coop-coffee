const express = require('express');
const router = express.Router();
const db = require('../db');
const { body, validationResult } = require('express-validator');
const { authenticateToken, authorizeRoles, getAccessibleKoperasi } = require('../middleware/auth');

// Get all lahan (filtered by user's koperasi access)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { user_id, role } = req.user;
    
    // Get accessible koperasi IDs for this user
    const accessibleKoperasi = await getAccessibleKoperasi(user_id, role);
    
    if (accessibleKoperasi.length === 0) {
      return res.status(200).json([]);
    }
    
    // Filter lahan by accessible koperasi with petani info
    const placeholders = accessibleKoperasi.map((_, index) => `$${index + 1}`).join(',');
    const result = await db.query(
      `SELECT l.*, p.nama as petani_name, p.kontak as petani_kontak
       FROM Lahan l
       LEFT JOIN Petani p ON l.petani_id = p.petani_id
       WHERE l.koperasi_id IN (${placeholders})
       ORDER BY l.nama_lahan`,
      accessibleKoperasi
    );
    
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single lahan by id (with koperasi access check)
router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { user_id, role } = req.user;
    
    try {
        // Get accessible koperasi IDs for this user
        const accessibleKoperasi = await getAccessibleKoperasi(user_id, role);
        
        if (accessibleKoperasi.length === 0) {
            return res.status(403).json({ message: 'No access to any koperasi' });
        }
        
        // Check if lahan exists and user has access to its koperasi
        const placeholders = accessibleKoperasi.map((_, index) => `$${index + 2}`).join(',');
        const result = await db.query(
            `SELECT l.*, p.nama as petani_name, p.kontak as petani_kontak
             FROM Lahan l
             LEFT JOIN Petani p ON l.petani_id = p.petani_id
             WHERE l.lahan_id = $1 AND l.koperasi_id IN (${placeholders})`,
            [id, ...accessibleKoperasi]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Lahan not found or access denied' });
        }
        
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new lahan (Admin or Operator)
router.post('/', [
    authenticateToken,
    authorizeRoles(['ADMIN', 'OPERATOR']),
    body('koperasi_id').notEmpty().withMessage('Koperasi ID is required.'),
    body('petani_id').notEmpty().withMessage('Petani ID is required.'),
    body('nama_lahan').notEmpty().withMessage('Nama Lahan is required.'),
    body('lokasi').notEmpty().withMessage('Lokasi is required.'),
    body('luas_hektar').isFloat({ gt: 0 }).withMessage('Luas Hektar must be a positive number.'),
    body('estimasi_jumlah_pohon').isInt({ gt: 0 }).withMessage('Estimasi Jumlah Pohon must be a positive integer.'),
    body('jenis_kopi_dominan').notEmpty().withMessage('Jenis Kopi Dominan is required.'),
    body('status_lahan').isIn(['Baru Ditanam', 'Produktif', 'Tidak Aktif']).withMessage('Invalid Status Lahan.'),
    body('estimasi_panen_pertama').optional({ checkFalsy: true }).isISO8601().toDate().withMessage('Invalid Estimasi Panen Pertama date.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { koperasi_id, petani_id, nama_lahan, lokasi, luas_hektar, estimasi_jumlah_pohon, jenis_kopi_dominan, status_lahan, estimasi_panen_pertama } = req.body;

    try {
        const { user_id } = req.user;
        
        // Start transaction for estimation system integration
        await db.query('BEGIN');
        
        // Create lahan record
        const lahanResult = await db.query(
            'INSERT INTO Lahan (koperasi_id, petani_id, nama_lahan, lokasi, luas_hektar, estimasi_jumlah_pohon, jenis_kopi_dominan, status_lahan, estimasi_panen_pertama) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
            [koperasi_id, petani_id, nama_lahan, lokasi, luas_hektar, estimasi_jumlah_pohon, jenis_kopi_dominan, status_lahan, estimasi_panen_pertama]
        );
        
        const lahan = lahanResult.rows[0];
        
        // Simple lahan creation as per documentation - no extra calculations
        
        // Commit transaction
        await db.query('COMMIT');
        
        res.status(201).json(lahan);
    } catch (err) {
        // Rollback transaction on error
        await db.query('ROLLBACK');
        console.error('Error creating lahan with estimation integration:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update a lahan (Admin or Operator)
router.put('/:id', [
    authenticateToken,
    authorizeRoles(['ADMIN', 'OPERATOR']),
    body('koperasi_id').notEmpty().withMessage('Koperasi ID is required.'),
    body('petani_id').notEmpty().withMessage('Petani ID is required.'),
    body('nama_lahan').notEmpty().withMessage('Nama Lahan is required.'),
    body('lokasi').notEmpty().withMessage('Lokasi is required.'),
    body('luas_hektar').isFloat({ gt: 0 }).withMessage('Luas Hektar must be a positive number.'),
    body('estimasi_jumlah_pohon').isInt({ gt: 0 }).withMessage('Estimasi Jumlah Pohon must be a positive integer.'),
    body('jenis_kopi_dominan').notEmpty().withMessage('Jenis Kopi Dominan is required.'),
    body('status_lahan').isIn(['Baru Ditanam', 'Produktif', 'Tidak Aktif']).withMessage('Invalid Status Lahan.'),
    body('estimasi_panen_pertama').optional({ checkFalsy: true }).isISO8601().toDate().withMessage('Invalid Estimasi Panen Pertama date.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { koperasi_id, petani_id, nama_lahan, lokasi, luas_hektar, estimasi_jumlah_pohon, jenis_kopi_dominan, status_lahan, estimasi_panen_pertama } = req.body;

    try {
        const result = await db.query(
            'UPDATE Lahan SET koperasi_id = $1, petani_id = $2, nama_lahan = $3, lokasi = $4, luas_hektar = $5, estimasi_jumlah_pohon = $6, jenis_kopi_dominan = $7, status_lahan = $8, estimasi_panen_pertama = $9 WHERE lahan_id = $10 RETURNING *',
            [koperasi_id, petani_id, nama_lahan, lokasi, luas_hektar, estimasi_jumlah_pohon, jenis_kopi_dominan, status_lahan, estimasi_panen_pertama, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Lahan not found' });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a lahan (Admin or Operator)
router.delete('/:id', authenticateToken, authorizeRoles(['ADMIN', 'OPERATOR']), async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query('DELETE FROM Lahan WHERE lahan_id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Lahan not found' });
        }

        res.status(200).json({ message: 'Lahan deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get lahan status with related activities (as required by documentation)
router.get('/:id/status', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { user_id, role } = req.user;
    
    try {
        // Get accessible koperasi IDs for this user
        const accessibleKoperasi = await getAccessibleKoperasi(user_id, role);
        
        if (accessibleKoperasi.length === 0) {
            return res.status(403).json({ message: 'No access to any koperasi' });
        }
        
        // Get lahan with status and latest activities
        const placeholders = accessibleKoperasi.map((_, index) => `$${index + 2}`).join(',');
        const lahanResult = await db.query(
            `SELECT l.*, p.nama as petani_name
             FROM Lahan l
             LEFT JOIN Petani p ON l.petani_id = p.petani_id
             WHERE l.lahan_id = $1 AND l.koperasi_id IN (${placeholders})`,
            [id, ...accessibleKoperasi]
        );
        
        if (lahanResult.rows.length === 0) {
            return res.status(404).json({ message: 'Lahan not found or access denied' });
        }
        
        const lahan = lahanResult.rows[0];
        
        // Get latest activities for this lahan
        const activitiesResult = await db.query(
            `SELECT jenis_aktivitas, tanggal_aktivitas, tanggal_estimasi, jumlah_estimasi_kg, jumlah_aktual_kg, status
             FROM Aktivitas_Budidaya 
             WHERE lahan_id = $1 
             ORDER BY tanggal_aktivitas DESC 
             LIMIT 5`,
            [id]
        );
        
        res.status(200).json({
            lahan_id: lahan.lahan_id,
            nama_lahan: lahan.nama_lahan,
            petani_name: lahan.petani_name,
            status_lahan: lahan.status_lahan,
            luas_hektar: lahan.luas_hektar,
            estimasi_jumlah_pohon: lahan.estimasi_jumlah_pohon,
            jenis_kopi_dominan: lahan.jenis_kopi_dominan,
            estimasi_panen_pertama: lahan.estimasi_panen_pertama,
            recent_activities: activitiesResult.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
