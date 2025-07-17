const express = require('express');
const router = express.Router();
const db = require('../db');
const { body, validationResult } = require('express-validator');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get all quality checkpoints for a batch
router.get('/checkpoints/batch/:batchId', authenticateToken, async (req, res) => {
    const { batchId } = req.params;
    
    try {
        const checkpoints = await db.query(`
            SELECT 
                qc.*,
                i.nama_item,
                i.batch_id,
                k.nama_koperasi,
                u.nama_lengkap as inspector_name
            FROM quality_checkpoints qc
            LEFT JOIN inventory i ON qc.inventory_id = i.inventory_id
            LEFT JOIN koperasi k ON i.koperasi_id = k.koperasi_id
            LEFT JOIN users u ON qc.inspector_id = u.user_id
            WHERE i.batch_id = $1
            ORDER BY qc.checkpoint_date DESC
        `, [batchId]);

        res.status(200).json({
            batchId,
            checkpoints: checkpoints.rows,
            totalCheckpoints: checkpoints.rows.length
        });
    } catch (err) {
        console.error('Error fetching quality checkpoints:', err);
        res.status(500).json({ error: err.message });
    }
});

// Create a new quality checkpoint
router.post('/checkpoints', [
    authenticateToken,
    authorizeRoles(['ADMIN', 'OPERATOR']),
    body('inventory_id').isInt().withMessage('Valid inventory ID is required'),
    body('checkpoint_type').isIn(['HARVEST', 'PROCESSING', 'STORAGE', 'TRANSPORT', 'DELIVERY']).withMessage('Invalid checkpoint type'),
    body('checkpoint_name').notEmpty().withMessage('Checkpoint name is required'),
    body('checkpoint_date').isISO8601().toDate().withMessage('Valid checkpoint date is required'),
    body('quality_score').isFloat({ min: 0, max: 100 }).withMessage('Quality score must be between 0 and 100'),
    body('status').isIn(['PASSED', 'FAILED', 'PENDING']).withMessage('Invalid status')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {
        inventory_id,
        checkpoint_type,
        checkpoint_name,
        checkpoint_date,
        quality_score,
        status,
        test_results,
        defects_found,
        recommendations,
        notes
    } = req.body;
    const { user_id } = req.user;

    try {
        const result = await db.query(`
            INSERT INTO quality_checkpoints (
                inventory_id, checkpoint_type, checkpoint_name, checkpoint_date,
                quality_score, status, test_results, defects_found, 
                recommendations, notes, inspector_id, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
            RETURNING *
        `, [
            inventory_id, checkpoint_type, checkpoint_name, checkpoint_date,
            quality_score, status, test_results || null, defects_found || null,
            recommendations || null, notes || null, user_id
        ]);

        res.status(201).json({
            message: 'Quality checkpoint created successfully',
            checkpoint: result.rows[0]
        });
    } catch (err) {
        console.error('Error creating quality checkpoint:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update a quality checkpoint
router.put('/checkpoints/:id', [
    authenticateToken,
    authorizeRoles(['ADMIN', 'OPERATOR']),
    body('checkpoint_type').optional().isIn(['HARVEST', 'PROCESSING', 'STORAGE', 'TRANSPORT', 'DELIVERY']),
    body('quality_score').optional().isFloat({ min: 0, max: 100 }),
    body('status').optional().isIn(['PASSED', 'FAILED', 'PENDING'])
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const {
        checkpoint_type,
        checkpoint_name,
        checkpoint_date,
        quality_score,
        status,
        test_results,
        defects_found,
        recommendations,
        notes
    } = req.body;

    try {
        const result = await db.query(`
            UPDATE quality_checkpoints 
            SET checkpoint_type = COALESCE($1, checkpoint_type),
                checkpoint_name = COALESCE($2, checkpoint_name),
                checkpoint_date = COALESCE($3, checkpoint_date),
                quality_score = COALESCE($4, quality_score),
                status = COALESCE($5, status),
                test_results = COALESCE($6, test_results),
                defects_found = COALESCE($7, defects_found),
                recommendations = COALESCE($8, recommendations),
                notes = COALESCE($9, notes),
                updated_at = CURRENT_TIMESTAMP
            WHERE checkpoint_id = $10
            RETURNING *
        `, [
            checkpoint_type, checkpoint_name, checkpoint_date, quality_score, status,
            test_results, defects_found, recommendations, notes, id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Quality checkpoint not found' });
        }

        res.status(200).json({
            message: 'Quality checkpoint updated successfully',
            checkpoint: result.rows[0]
        });
    } catch (err) {
        console.error('Error updating quality checkpoint:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get quality summary for a koperasi
router.get('/summary/koperasi/:koperasiId', authenticateToken, async (req, res) => {
    const { koperasiId } = req.params;
    const { startDate, endDate } = req.query;
    
    try {
        let dateFilter = '';
        let queryParams = [koperasiId];
        
        if (startDate && endDate) {
            dateFilter = 'AND qc.checkpoint_date BETWEEN $2 AND $3';
            queryParams.push(startDate, endDate);
        }
        
        const summary = await db.query(`
            SELECT 
                COUNT(*) as total_checkpoints,
                COUNT(CASE WHEN qc.status = 'PASSED' THEN 1 END) as passed_checkpoints,
                COUNT(CASE WHEN qc.status = 'FAILED' THEN 1 END) as failed_checkpoints,
                COUNT(CASE WHEN qc.status = 'PENDING' THEN 1 END) as pending_checkpoints,
                AVG(qc.quality_score) as average_quality_score,
                qc.checkpoint_type,
                COUNT(*) as type_count
            FROM quality_checkpoints qc
            LEFT JOIN inventory i ON qc.inventory_id = i.inventory_id
            WHERE i.koperasi_id = $1 ${dateFilter}
            GROUP BY qc.checkpoint_type
            ORDER BY type_count DESC
        `, queryParams);

        const overallSummary = await db.query(`
            SELECT 
                COUNT(*) as total_checkpoints,
                COUNT(CASE WHEN qc.status = 'PASSED' THEN 1 END) as passed_checkpoints,
                COUNT(CASE WHEN qc.status = 'FAILED' THEN 1 END) as failed_checkpoints,
                AVG(qc.quality_score) as average_quality_score
            FROM quality_checkpoints qc
            LEFT JOIN inventory i ON qc.inventory_id = i.inventory_id
            WHERE i.koperasi_id = $1 ${dateFilter}
        `, queryParams);

        res.status(200).json({
            koperasiId,
            period: { startDate, endDate },
            overallSummary: overallSummary.rows[0],
            byType: summary.rows,
            qualityTrend: 'stable' // Could be calculated based on historical data
        });
    } catch (err) {
        console.error('Error fetching quality summary:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get quality trends for national dashboard (SUPER_ADMIN only)
router.get('/trends/national', [
    authenticateToken,
    authorizeRoles(['SUPER_ADMIN'])
], async (req, res) => {
    const { period = '30' } = req.query; // days
    
    try {
        const trends = await db.query(`
            SELECT 
                DATE(qc.checkpoint_date) as date,
                COUNT(*) as total_checkpoints,
                AVG(qc.quality_score) as average_score,
                COUNT(CASE WHEN qc.status = 'PASSED' THEN 1 END) as passed_count,
                k.provinsi
            FROM quality_checkpoints qc
            LEFT JOIN inventory i ON qc.inventory_id = i.inventory_id
            LEFT JOIN koperasi k ON i.koperasi_id = k.koperasi_id
            WHERE qc.checkpoint_date >= CURRENT_DATE - INTERVAL '${parseInt(period)} days'
            GROUP BY DATE(qc.checkpoint_date), k.provinsi
            ORDER BY date DESC, k.provinsi
        `);

        const summaryByProvince = await db.query(`
            SELECT 
                k.provinsi,
                COUNT(*) as total_checkpoints,
                AVG(qc.quality_score) as average_score,
                COUNT(CASE WHEN qc.status = 'PASSED' THEN 1 END) as passed_count,
                COUNT(CASE WHEN qc.status = 'FAILED' THEN 1 END) as failed_count
            FROM quality_checkpoints qc
            LEFT JOIN inventory i ON qc.inventory_id = i.inventory_id
            LEFT JOIN koperasi k ON i.koperasi_id = k.koperasi_id
            WHERE qc.checkpoint_date >= CURRENT_DATE - INTERVAL '${parseInt(period)} days'
            GROUP BY k.provinsi
            ORDER BY average_score DESC
        `);

        res.status(200).json({
            period: `${period} days`,
            dailyTrends: trends.rows,
            provincesSummary: summaryByProvince.rows,
            nationalAverage: summaryByProvince.rows.reduce((sum, p) => sum + parseFloat(p.average_score || 0), 0) / summaryByProvince.rows.length
        });
    } catch (err) {
        console.error('Error fetching national quality trends:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;