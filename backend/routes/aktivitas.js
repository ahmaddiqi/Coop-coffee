const express = require('express');
const router = express.Router();
const db = require('../db');
const { body, validationResult } = require('express-validator');
const { authenticateToken, authorizeRoles, getAccessibleKoperasi } = require('../middleware/auth');

// Get all aktivitas (filtered by user's koperasi access)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { user_id, role } = req.user;
    
    // Get accessible koperasi IDs for this user
    const accessibleKoperasi = await getAccessibleKoperasi(user_id, role);
    
    if (accessibleKoperasi.length === 0) {
      return res.status(200).json([]);
    }
    
    // Filter aktivitas by accessible koperasi through lahan
    const placeholders = accessibleKoperasi.map((_, index) => `$${index + 1}`).join(',');
    const result = await db.query(
      `SELECT ab.*, l.nama_lahan, l.koperasi_id, p.nama as petani_name
       FROM Aktivitas_Budidaya ab
       LEFT JOIN Lahan l ON ab.lahan_id = l.lahan_id
       LEFT JOIN Petani p ON l.petani_id = p.petani_id
       WHERE l.koperasi_id IN (${placeholders})
       ORDER BY ab.tanggal_aktivitas DESC`,
      accessibleKoperasi
    );
    
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get upcoming harvest estimations for dashboard
router.get('/estimasi-panen-upcoming', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.user;
    
    // Get user's koperasi_id
    const userResult = await db.query('SELECT koperasi_id FROM users WHERE user_id = $1', [user_id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const koperasiId = userResult.rows[0].koperasi_id;
    
    // Get upcoming harvest estimations for next 3 months
    const result = await db.query(`
      SELECT 
        ab.aktivitas_id,
        ab.lahan_id,
        ab.tanggal_estimasi,
        ab.jumlah_estimasi_kg,
        ab.keterangan,
        l.nama_lahan,
        l.jenis_kopi_dominan,
        p.nama as petani_name,
        p.kontak as petani_kontak
      FROM Aktivitas_Budidaya ab
      LEFT JOIN Lahan l ON ab.lahan_id = l.lahan_id
      LEFT JOIN Petani p ON l.petani_id = p.petani_id
      WHERE ab.jenis_aktivitas = 'ESTIMASI_PANEN' 
        AND ab.status = 'TERJADWAL'
        AND ab.tanggal_estimasi >= NOW()
        AND ab.tanggal_estimasi <= NOW() + INTERVAL '3 months'
        AND l.koperasi_id = $1
      ORDER BY ab.tanggal_estimasi ASC
    `, [koperasiId]);
    
    res.status(200).json({
      upcoming_harvests: result.rows,
      total_estimated_kg: result.rows.reduce((sum, row) => sum + parseFloat(row.jumlah_estimasi_kg || 0), 0),
      count: result.rows.length
    });
  } catch (err) {
    console.error('Error getting upcoming harvest estimations:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get a single aktivitas by id
router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM Aktivitas_Budidaya WHERE aktivitas_id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Aktivitas not found' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new aktivitas (Admin or Operator)
router.post('/', [
    authenticateToken,
    authorizeRoles(['ADMIN', 'OPERATOR']),
    body('lahan_id').notEmpty().withMessage('Lahan ID is required.'),
    body('jenis_aktivitas').isIn(['TANAM', 'PANEN', 'ESTIMASI_PANEN']).withMessage('Invalid Jenis Aktivitas.'),
    body('tanggal_aktivitas').isISO8601().toDate().withMessage('Invalid Tanggal Aktivitas.'),
    body('status').isIn(['TERJADWAL', 'SELESAI', 'PENDING']).withMessage('Invalid Status.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { lahan_id, jenis_aktivitas, tanggal_aktivitas, tanggal_estimasi, jumlah_estimasi_kg, jumlah_aktual_kg, jenis_bibit, status, keterangan, created_from } = req.body;
    const { user_id } = req.user;

    try {
        // Start transaction for harvest integration
        await db.query('BEGIN');
        
        // Create aktivitas record
        const aktivitasResult = await db.query(
            'INSERT INTO Aktivitas_Budidaya (lahan_id, jenis_aktivitas, tanggal_aktivitas, tanggal_estimasi, jumlah_estimasi_kg, jumlah_aktual_kg, jenis_bibit, status, keterangan, created_from, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
            [lahan_id, jenis_aktivitas, tanggal_aktivitas, tanggal_estimasi, jumlah_estimasi_kg, jumlah_aktual_kg, jenis_bibit, status, keterangan, created_from, user_id]
        );
        
        const aktivitas = aktivitasResult.rows[0];
        
        // HARVEST-TO-INVENTORY INTEGRATION: If this is a completed harvest, automatically create inventory entry
        if (jenis_aktivitas === 'PANEN' && status === 'SELESAI' && jumlah_aktual_kg && jumlah_aktual_kg > 0) {
            // Get lahan and petani info for traceability
            const lahanInfo = await db.query(`
                SELECT l.nama_lahan, l.koperasi_id, p.nama as petani_name
                FROM Lahan l
                LEFT JOIN Petani p ON l.petani_id = p.petani_id
                WHERE l.lahan_id = $1
            `, [lahan_id]);
            
            if (lahanInfo.rows.length > 0) {
                const lahan = lahanInfo.rows[0];
                
                // Generate unique batch ID for traceability
                const batchId = `BATCH-${Date.now()}-${lahan_id}`;
                
                // Create inventory entry for harvested cherries
                await db.query(`
                    INSERT INTO Inventory (
                        koperasi_id, 
                        nama_item, 
                        tipe_transaksi, 
                        tanggal, 
                        jumlah, 
                        satuan, 
                        batch_id, 
                        keterangan, 
                        created_by
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                `, [
                    lahan.koperasi_id,
                    `Cherry from ${lahan.nama_lahan}`,
                    'MASUK',
                    tanggal_aktivitas,
                    jumlah_aktual_kg,
                    'kg',
                    batchId,
                    `Harvest from ${lahan.nama_lahan} - ${lahan.petani_name} - Activity ID: ${aktivitas.aktivitas_id}`,
                    user_id
                ]);
                
                console.log(`Harvest-to-Inventory Integration: Created inventory entry for ${jumlah_aktual_kg}kg cherries from ${lahan.nama_lahan} with batch ID: ${batchId}`);
                
                // ESTIMATION SYSTEM INTEGRATION: Create next harvest estimation based on current harvest
                const nextHarvestDate = new Date(tanggal_aktivitas);
                nextHarvestDate.setMonth(nextHarvestDate.getMonth() + 6); // Next harvest in 6 months
                
                // Calculate estimation based on current harvest performance
                const estimasiKgBerikutnya = Math.round(jumlah_aktual_kg * 1.05); // 5% increase estimation
                
                await db.query(`
                    INSERT INTO Aktivitas_Budidaya (
                        lahan_id, 
                        jenis_aktivitas, 
                        tanggal_aktivitas, 
                        tanggal_estimasi, 
                        jumlah_estimasi_kg, 
                        status, 
                        keterangan, 
                        created_from,
                        created_by
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                `, [
                    lahan_id,
                    'ESTIMASI_PANEN',
                    nextHarvestDate,
                    nextHarvestDate,
                    estimasiKgBerikutnya,
                    'TERJADWAL',
                    `Auto-generated next harvest estimation based on previous harvest of ${jumlah_aktual_kg}kg`,
                    'SYSTEM',
                    user_id
                ]);
                
                console.log(`Estimation System Integration: Created next harvest estimation for ${lahan.nama_lahan} - ${estimasiKgBerikutnya}kg on ${nextHarvestDate}`);
            }
        }
        
        // Commit transaction
        await db.query('COMMIT');
        
        res.status(201).json(aktivitas);
    } catch (err) {
        // Rollback transaction on error
        await db.query('ROLLBACK');
        console.error('Error creating aktivitas with harvest integration:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update a aktivitas (Admin or Operator)
router.put('/:id', [
    authenticateToken,
    authorizeRoles(['ADMIN', 'OPERATOR']),
    body('lahan_id').notEmpty().withMessage('Lahan ID is required.'),
    body('jenis_aktivitas').isIn(['TANAM', 'PANEN', 'ESTIMASI_PANEN']).withMessage('Invalid Jenis Aktivitas.'),
    body('tanggal_aktivitas').isISO8601().toDate().withMessage('Invalid Tanggal Aktivitas.'),
    body('status').isIn(['TERJADWAL', 'SELESAI', 'PENDING']).withMessage('Invalid Status.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { lahan_id, jenis_aktivitas, tanggal_aktivitas, tanggal_estimasi, jumlah_estimasi_kg, jumlah_aktual_kg, jenis_bibit, status, keterangan, created_from } = req.body;
    const { user_id } = req.user;

    try {
        // Start transaction for harvest integration
        await db.query('BEGIN');
        
        // Get current aktivitas status to check if we're changing from non-SELESAI to SELESAI
        const currentAktivitas = await db.query(
            'SELECT * FROM Aktivitas_Budidaya WHERE aktivitas_id = $1',
            [id]
        );
        
        if (currentAktivitas.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ message: 'Aktivitas not found' });
        }
        
        const oldStatus = currentAktivitas.rows[0].status;
        
        // Update aktivitas record
        const result = await db.query(
            'UPDATE Aktivitas_Budidaya SET lahan_id = $1, jenis_aktivitas = $2, tanggal_aktivitas = $3, tanggal_estimasi = $4, jumlah_estimasi_kg = $5, jumlah_aktual_kg = $6, jenis_bibit = $7, status = $8, keterangan = $9, created_from = $10 WHERE aktivitas_id = $11 RETURNING *',
            [lahan_id, jenis_aktivitas, tanggal_aktivitas, tanggal_estimasi, jumlah_estimasi_kg, jumlah_aktual_kg, jenis_bibit, status, keterangan, created_from, id]
        );

        const aktivitas = result.rows[0];
        
        // HARVEST-TO-INVENTORY INTEGRATION: If status changed to SELESAI for PANEN, create inventory entry
        if (jenis_aktivitas === 'PANEN' && status === 'SELESAI' && oldStatus !== 'SELESAI' && jumlah_aktual_kg && jumlah_aktual_kg > 0) {
            // Check if inventory entry already exists for this activity
            const existingInventory = await db.query(`
                SELECT * FROM Inventory 
                WHERE keterangan LIKE '%Activity ID: ${id}%' AND tipe_transaksi = 'MASUK'
            `);
            
            if (existingInventory.rows.length === 0) {
                // Get lahan and petani info for traceability
                const lahanInfo = await db.query(`
                    SELECT l.nama_lahan, l.koperasi_id, p.nama as petani_name
                    FROM Lahan l
                    LEFT JOIN Petani p ON l.petani_id = p.petani_id
                    WHERE l.lahan_id = $1
                `, [lahan_id]);
                
                if (lahanInfo.rows.length > 0) {
                    const lahan = lahanInfo.rows[0];
                    
                    // Generate unique batch ID for traceability
                    const batchId = `BATCH-${Date.now()}-${lahan_id}`;
                    
                    // Create inventory entry for harvested cherries
                    await db.query(`
                        INSERT INTO Inventory (
                            koperasi_id, 
                            nama_item, 
                            tipe_transaksi, 
                            tanggal, 
                            jumlah, 
                            satuan, 
                            batch_id, 
                            keterangan, 
                            created_by
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    `, [
                        lahan.koperasi_id,
                        `Cherry from ${lahan.nama_lahan}`,
                        'MASUK',
                        tanggal_aktivitas,
                        jumlah_aktual_kg,
                        'kg',
                        batchId,
                        `Harvest from ${lahan.nama_lahan} - ${lahan.petani_name} - Activity ID: ${aktivitas.aktivitas_id}`,
                        user_id
                    ]);
                    
                    console.log(`Harvest-to-Inventory Integration (UPDATE): Created inventory entry for ${jumlah_aktual_kg}kg cherries from ${lahan.nama_lahan} with batch ID: ${batchId}`);
                    
                    // ESTIMATION SYSTEM INTEGRATION: Create next harvest estimation based on current harvest
                    const nextHarvestDate = new Date(tanggal_aktivitas);
                    nextHarvestDate.setMonth(nextHarvestDate.getMonth() + 6); // Next harvest in 6 months
                    
                    // Calculate estimation based on current harvest performance
                    const estimasiKgBerikutnya = Math.round(jumlah_aktual_kg * 1.05); // 5% increase estimation
                    
                    await db.query(`
                        INSERT INTO Aktivitas_Budidaya (
                            lahan_id, 
                            jenis_aktivitas, 
                            tanggal_aktivitas, 
                            tanggal_estimasi, 
                            jumlah_estimasi_kg, 
                            status, 
                            keterangan, 
                            created_from,
                            created_by
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    `, [
                        lahan_id,
                        'ESTIMASI_PANEN',
                        nextHarvestDate,
                        nextHarvestDate,
                        estimasiKgBerikutnya,
                        'TERJADWAL',
                        `Auto-generated next harvest estimation based on previous harvest of ${jumlah_aktual_kg}kg`,
                        'SYSTEM',
                        user_id
                    ]);
                    
                    console.log(`Estimation System Integration (UPDATE): Created next harvest estimation for ${lahan.nama_lahan} - ${estimasiKgBerikutnya}kg on ${nextHarvestDate}`);
                }
            }
        }
        
        // Commit transaction
        await db.query('COMMIT');
        
        res.status(200).json(aktivitas);
    } catch (err) {
        // Rollback transaction on error
        await db.query('ROLLBACK');
        console.error('Error updating aktivitas with harvest integration:', err);
        res.status(500).json({ error: err.message });
    }
});

// Delete a aktivitas (Admin or Operator)
router.delete('/:id', authenticateToken, authorizeRoles(['ADMIN', 'OPERATOR']), async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query('DELETE FROM Aktivitas_Budidaya WHERE aktivitas_id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Aktivitas not found' });
        }

        res.status(200).json({ message: 'Aktivitas deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
