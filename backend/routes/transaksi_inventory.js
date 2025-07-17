const express = require('express');
const router = express.Router();
const db = require('../db');
const { body, validationResult } = require('express-validator');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get all transaksi inventory
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM Transaksi_Inventory');
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single transaksi inventory by id
router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM Transaksi_Inventory WHERE transaksi_id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Transaksi Inventory not found' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new transaksi inventory (Admin or Operator)
router.post('/', [
    authenticateToken,
    authorizeRoles(['ADMIN', 'OPERATOR']),
    body('inventory_id').notEmpty().withMessage('Inventory ID is required.'),
    body('koperasi_id').notEmpty().withMessage('Koperasi ID is required.'),
    body('tipe_transaksi').isIn(['MASUK', 'KELUAR', 'PROSES', 'JUAL']).withMessage('Invalid Tipe Transaksi.'),
    body('jenis_operasi').isIn(['PEMBELIAN', 'PANEN', 'DISTRIBUSI', 'PENJUALAN', 'TRANSFORMASI']).withMessage('Invalid Jenis Operasi.'),
    body('tanggal').isISO8601().toDate().withMessage('Invalid Tanggal.'),
    body('jumlah').isFloat({ gt: 0 }).withMessage('Jumlah must be a positive number.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { inventory_id, koperasi_id, tipe_transaksi, jenis_operasi, tanggal, jumlah, petani_id, lahan_id, buyer, harga_total, keterangan, referensi_pasarmikro } = req.body;

    try {
        const result = await db.query(
            'INSERT INTO Transaksi_Inventory (inventory_id, koperasi_id, tipe_transaksi, jenis_operasi, tanggal, jumlah, petani_id, lahan_id, buyer, harga_total, keterangan, referensi_pasarmikro) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
            [inventory_id, koperasi_id, tipe_transaksi, jenis_operasi, tanggal, jumlah, petani_id, lahan_id, buyer, harga_total, keterangan, referensi_pasarmikro]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a transaksi inventory (Admin or Operator)
router.put('/:id', [
    authenticateToken,
    authorizeRoles(['ADMIN', 'OPERATOR']),
    body('inventory_id').notEmpty().withMessage('Inventory ID is required.'),
    body('koperasi_id').notEmpty().withMessage('Koperasi ID is required.'),
    body('tipe_transaksi').isIn(['MASUK', 'KELUAR', 'PROSES', 'JUAL']).withMessage('Invalid Tipe Transaksi.'),
    body('jenis_operasi').isIn(['PEMBELIAN', 'PANEN', 'DISTRIBUSI', 'PENJUALAN', 'TRANSFORMASI']).withMessage('Invalid Jenis Operasi.'),
    body('tanggal').isISO8601().toDate().withMessage('Invalid Tanggal.'),
    body('jumlah').isFloat({ gt: 0 }).withMessage('Jumlah must be a positive number.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { inventory_id, koperasi_id, tipe_transaksi, jenis_operasi, tanggal, jumlah, petani_id, lahan_id, buyer, harga_total, keterangan, referensi_pasarmikro } = req.body;

    try {
        const result = await db.query(
            'UPDATE Transaksi_Inventory SET inventory_id = $1, koperasi_id = $2, tipe_transaksi = $3, jenis_operasi = $4, tanggal = $5, jumlah = $6, petani_id = $7, lahan_id = $8, buyer = $9, harga_total = $10, keterangan = $11, referensi_pasarmikro = $12 WHERE transaksi_id = $13 RETURNING *',
            [inventory_id, koperasi_id, tipe_transaksi, jenis_operasi, tanggal, jumlah, petani_id, lahan_id, buyer, harga_total, keterangan, referensi_pasarmikro, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Transaksi Inventory not found' });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a transaksi inventory (Admin or Operator)
router.delete('/:id', authenticateToken, authorizeRoles(['ADMIN', 'OPERATOR']), async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query('DELETE FROM Transaksi_Inventory WHERE transaksi_id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Transaksi Inventory not found' });
        }

        res.status(200).json({ message: 'Transaksi Inventory deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
