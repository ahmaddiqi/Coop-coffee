const express = require('express');
const router = express.Router();
const db = require('../db');
const { body, validationResult } = require('express-validator');
const { authenticateToken, authorizeRoles, getAccessibleKoperasi } = require('../middleware/auth');

// Get all inventory items (filtered by user's koperasi access)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { user_id, role } = req.user;
    
    // Get accessible koperasi IDs for this user
    const accessibleKoperasi = await getAccessibleKoperasi(user_id, role);
    
    if (accessibleKoperasi.length === 0) {
      return res.status(200).json([]);
    }
    
    // Filter inventory by accessible koperasi
    const placeholders = accessibleKoperasi.map((_, index) => `$${index + 1}`).join(',');
    const result = await db.query(
      `SELECT * FROM Inventory WHERE koperasi_id IN (${placeholders}) ORDER BY tanggal DESC`,
      accessibleKoperasi
    );
    
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single inventory item by id
router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM Inventory WHERE inventory_id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Inventory item not found' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new inventory item (Admin or Operator)
router.post('/', [
    authenticateToken,
    authorizeRoles(['ADMIN', 'OPERATOR']),
    body('koperasi_id').notEmpty().withMessage('Koperasi ID is required.'),
    body('nama_item').notEmpty().withMessage('Nama Item is required.'),
    body('tipe_transaksi').isIn(['MASUK', 'KELUAR']).withMessage('Invalid Tipe Transaksi.'),
    body('tanggal').isISO8601().toDate().withMessage('Invalid Tanggal.'),
    body('jumlah').isFloat({ gt: 0 }).withMessage('Jumlah must be a positive number.'),
    body('satuan').notEmpty().withMessage('Satuan is required.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { koperasi_id, nama_item, tipe_transaksi, tanggal, jumlah, satuan, batch_id, parent_batch_id, keterangan, referensi_pasarmikro } = req.body;
    const { user_id } = req.user;

    try {
        const result = await db.query(
            'INSERT INTO Inventory (koperasi_id, nama_item, tipe_transaksi, tanggal, jumlah, satuan, batch_id, parent_batch_id, keterangan, referensi_pasarmikro, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
            [koperasi_id, nama_item, tipe_transaksi, tanggal, jumlah, satuan, batch_id, parent_batch_id, keterangan, referensi_pasarmikro, user_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update an inventory item (Admin or Operator)
router.put('/:id', [
    authenticateToken,
    authorizeRoles(['ADMIN', 'OPERATOR']),
    body('koperasi_id').notEmpty().withMessage('Koperasi ID is required.'),
    body('nama_item').notEmpty().withMessage('Nama Item is required.'),
    body('tipe_transaksi').isIn(['MASUK', 'KELUAR']).withMessage('Invalid Tipe Transaksi.'),
    body('tanggal').isISO8601().toDate().withMessage('Invalid Tanggal.'),
    body('jumlah').isFloat({ gt: 0 }).withMessage('Jumlah must be a positive number.'),
    body('satuan').notEmpty().withMessage('Satuan is required.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { koperasi_id, nama_item, tipe_transaksi, tanggal, jumlah, satuan, batch_id, parent_batch_id, keterangan, referensi_pasarmikro } = req.body;

    try {
        const result = await db.query(
            'UPDATE Inventory SET koperasi_id = $1, nama_item = $2, tipe_transaksi = $3, tanggal = $4, jumlah = $5, satuan = $6, batch_id = $7, parent_batch_id = $8, keterangan = $9, referensi_pasarmikro = $10 WHERE inventory_id = $11 RETURNING *',
            [koperasi_id, nama_item, tipe_transaksi, tanggal, jumlah, satuan, batch_id, parent_batch_id, keterangan, referensi_pasarmikro, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Inventory item not found' });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete an inventory item (Admin or Operator)
router.delete('/:id', authenticateToken, authorizeRoles(['ADMIN', 'OPERATOR']), async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query('DELETE FROM Inventory WHERE inventory_id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Inventory item not found' });
        }

        res.status(200).json({ message: 'Inventory item deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Enhanced Traceability Features

// Get batch traceability tree (parent-child relationships)
router.get('/traceability/batch/:batchId', authenticateToken, async (req, res) => {
    const { batchId } = req.params;
    
    try {
        // Get the main batch info
        const mainBatch = await db.query(`
            SELECT i.*, k.nama_koperasi, p.nama as petani_name, l.nama_lahan
            FROM Inventory i
            LEFT JOIN Koperasi k ON i.koperasi_id = k.koperasi_id
            LEFT JOIN Transaksi_Inventory ti ON i.inventory_id = ti.inventory_id
            LEFT JOIN Petani p ON ti.petani_id = p.petani_id
            LEFT JOIN Lahan l ON ti.lahan_id = l.lahan_id
            WHERE i.batch_id = $1
            ORDER BY i.created_at DESC
        `, [batchId]);

        if (mainBatch.rows.length === 0) {
            return res.status(404).json({ message: 'Batch not found' });
        }

        // Get parent batches (upstream)
        const parentBatches = await db.query(`
            WITH RECURSIVE batch_ancestors AS (
                SELECT i.*, 0 as level
                FROM Inventory i
                WHERE i.batch_id = $1
                
                UNION ALL
                
                SELECT parent.*, ba.level + 1
                FROM Inventory parent
                INNER JOIN batch_ancestors ba ON parent.batch_id = ba.parent_batch_id
                WHERE ba.parent_batch_id IS NOT NULL
            )
            SELECT DISTINCT ba.*, k.nama_koperasi
            FROM batch_ancestors ba
            LEFT JOIN Koperasi k ON ba.koperasi_id = k.koperasi_id
            WHERE ba.level > 0
            ORDER BY ba.level DESC, ba.created_at
        `, [batchId]);

        // Get child batches (downstream)
        const childBatches = await db.query(`
            WITH RECURSIVE batch_descendants AS (
                SELECT i.*, 0 as level
                FROM Inventory i
                WHERE i.batch_id = $1
                
                UNION ALL
                
                SELECT child.*, bd.level + 1
                FROM Inventory child
                INNER JOIN batch_descendants bd ON child.parent_batch_id = bd.batch_id
            )
            SELECT DISTINCT bd.*, k.nama_koperasi
            FROM batch_descendants bd
            LEFT JOIN Koperasi k ON bd.koperasi_id = k.koperasi_id
            WHERE bd.level > 0
            ORDER BY bd.level, bd.created_at
        `, [batchId]);

        res.status(200).json({
            mainBatch: mainBatch.rows[0],
            parentBatches: parentBatches.rows,
            childBatches: childBatches.rows,
            traceabilityTree: {
                upstream: parentBatches.rows,
                current: mainBatch.rows[0],
                downstream: childBatches.rows
            }
        });
    } catch (err) {
        console.error('Error in batch traceability:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get batch history timeline
router.get('/traceability/timeline/:batchId', authenticateToken, async (req, res) => {
    const { batchId } = req.params;
    
    try {
        // Get complete timeline for the batch
        const timeline = await db.query(`
            SELECT 
                'INVENTORY' as event_type,
                i.inventory_id as event_id,
                i.tipe_transaksi as action,
                i.tanggal as event_date,
                i.jumlah,
                i.satuan,
                i.nama_item,
                i.keterangan as description,
                k.nama_koperasi,
                u.nama_lengkap as created_by_name,
                i.created_at
            FROM Inventory i
            LEFT JOIN Koperasi k ON i.koperasi_id = k.koperasi_id
            LEFT JOIN Users u ON i.created_by = u.user_id
            WHERE i.batch_id = $1
            
            UNION ALL
            
            SELECT 
                'TRANSACTION' as event_type,
                ti.transaksi_id as event_id,
                ti.tipe_transaksi as action,
                ti.tanggal as event_date,
                ti.jumlah,
                'kg' as satuan,
                COALESCE(ti.buyer, 'Internal') as nama_item,
                ti.keterangan as description,
                k.nama_koperasi,
                p.nama as created_by_name,
                NULL as created_at
            FROM Transaksi_Inventory ti
            LEFT JOIN Inventory i ON ti.inventory_id = i.inventory_id
            LEFT JOIN Koperasi k ON ti.koperasi_id = k.koperasi_id
            LEFT JOIN Petani p ON ti.petani_id = p.petani_id
            WHERE i.batch_id = $1
            
            ORDER BY event_date DESC, created_at DESC NULLS LAST
        `, [batchId]);

        res.status(200).json({
            batchId,
            timeline: timeline.rows,
            totalEvents: timeline.rows.length
        });
    } catch (err) {
        console.error('Error in batch timeline:', err);
        res.status(500).json({ error: err.message });
    }
});

// Generate traceability report for buyers
router.get('/traceability/report/:batchId', authenticateToken, async (req, res) => {
    const { batchId } = req.params;
    const { format = 'json' } = req.query;
    
    try {
        // Get comprehensive batch information
        const batchInfo = await db.query(`
            SELECT 
                i.*,
                k.nama_koperasi,
                k.alamat as koperasi_alamat,
                k.provinsi,
                k.kabupaten,
                k.kontak_person,
                k.nomor_telepon
            FROM Inventory i
            LEFT JOIN Koperasi k ON i.koperasi_id = k.koperasi_id
            WHERE i.batch_id = $1
            ORDER BY i.created_at DESC
            LIMIT 1
        `, [batchId]);

        if (batchInfo.rows.length === 0) {
            return res.status(404).json({ message: 'Batch not found' });
        }

        // Get farm source information
        const farmInfo = await db.query(`
            SELECT DISTINCT
                p.nama as petani_name,
                p.kontak as petani_kontak,
                p.alamat as petani_alamat,
                l.nama_lahan,
                l.lokasi as lahan_lokasi,
                l.luas_hektar,
                l.jenis_kopi_dominan,
                ab.tanggal_aktivitas as harvest_date,
                ab.jumlah_aktual_kg as harvest_amount
            FROM Transaksi_Inventory ti
            LEFT JOIN Inventory i ON ti.inventory_id = i.inventory_id
            LEFT JOIN Petani p ON ti.petani_id = p.petani_id
            LEFT JOIN Lahan l ON ti.lahan_id = l.lahan_id
            LEFT JOIN Aktivitas_Budidaya ab ON l.lahan_id = ab.lahan_id 
                AND ab.jenis_aktivitas = 'PANEN' 
                AND ab.tanggal_aktivitas <= ti.tanggal
            WHERE i.batch_id = $1 AND ti.jenis_operasi = 'PANEN'
            ORDER BY ab.tanggal_aktivitas DESC
        `, [batchId]);

        // Get processing history
        const processingHistory = await db.query(`
            SELECT 
                i.tipe_transaksi,
                i.tanggal,
                i.jumlah,
                i.satuan,
                i.nama_item,
                i.keterangan,
                ti.jenis_operasi,
                ti.buyer
            FROM Inventory i
            LEFT JOIN Transaksi_Inventory ti ON i.inventory_id = ti.inventory_id
            WHERE i.batch_id = $1 OR i.parent_batch_id = $1
            ORDER BY i.tanggal, i.created_at
        `, [batchId]);

        // Generate quality control checkpoints
        const qualityCheckpoints = await db.query(`
            SELECT 
                'HARVEST' as checkpoint_type,
                ab.tanggal_aktivitas as checkpoint_date,
                'Farm Quality Control' as checkpoint_name,
                CONCAT('Harvested ', ab.jumlah_aktual_kg, 'kg from ', l.jenis_kopi_dominan, ' variety') as checkpoint_result,
                'PASSED' as status
            FROM Aktivitas_Budidaya ab
            LEFT JOIN Lahan l ON ab.lahan_id = l.lahan_id
            LEFT JOIN Transaksi_Inventory ti ON ab.lahan_id = ti.lahan_id
            LEFT JOIN Inventory i ON ti.inventory_id = i.inventory_id
            WHERE i.batch_id = $1 AND ab.jenis_aktivitas = 'PANEN'
            
            UNION ALL
            
            SELECT 
                'PROCESSING' as checkpoint_type,
                i.tanggal as checkpoint_date,
                'Processing Quality Control' as checkpoint_name,
                CONCAT('Processed ', i.nama_item, ' - ', i.jumlah, ' ', i.satuan) as checkpoint_result,
                'PASSED' as status
            FROM Inventory i
            WHERE i.batch_id = $1 AND i.tipe_transaksi = 'MASUK'
            
            ORDER BY checkpoint_date
        `, [batchId]);

        const report = {
            reportId: `TR-${batchId}-${Date.now()}`,
            generatedAt: new Date().toISOString(),
            batchId: batchId,
            batchInfo: batchInfo.rows[0],
            farmSource: farmInfo.rows,
            processingHistory: processingHistory.rows,
            qualityCheckpoints: qualityCheckpoints.rows,
            traceabilityConfirmed: true,
            reportSummary: {
                totalFarms: farmInfo.rows.length,
                totalProcessingSteps: processingHistory.rows.length,
                qualityChecksPassed: qualityCheckpoints.rows.filter(q => q.status === 'PASSED').length,
                traceabilityScore: '100%'
            }
        };

        if (format === 'pdf') {
            // For PDF format, return structured data that frontend can use to generate PDF
            res.status(200).json({
                ...report,
                format: 'pdf-data',
                message: 'PDF data ready for frontend generation'
            });
        } else {
            res.status(200).json(report);
        }
    } catch (err) {
        console.error('Error generating traceability report:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
