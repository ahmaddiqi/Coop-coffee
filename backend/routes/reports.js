const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get aggregated data for national reports (Admin Only)
router.get('/national', authenticateToken, authorizeRoles(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    // Example: Total harvested coffee (actual_kg) per province
    const totalHarvestPerProvince = await db.query(
      `SELECT
        k.provinsi,
        SUM(ab.jumlah_aktual_kg) AS total_panen_kg
      FROM Aktivitas_Budidaya ab
      JOIN Lahan l ON ab.lahan_id = l.lahan_id
      JOIN Koperasi k ON l.koperasi_id = k.koperasi_id
      WHERE ab.jenis_aktivitas = 'PANEN'
      GROUP BY k.provinsi
      ORDER BY k.provinsi;
      `
    );

    // Example: Number of active farmers per province
    const activeFarmersPerProvince = await db.query(
      `SELECT
        k.provinsi,
        COUNT(DISTINCT p.petani_id) AS jumlah_petani
      FROM Petani p
      JOIN Koperasi k ON p.koperasi_id = k.koperasi_id
      GROUP BY k.provinsi
      ORDER BY k.provinsi;
      `
    );

    // Example: Total land area (luas_hektar) per province
    const totalLandAreaPerProvince = await db.query(
      `SELECT
        k.provinsi,
        SUM(l.luas_hektar) AS total_luas_hektar
      FROM Lahan l
      JOIN Koperasi k ON l.koperasi_id = k.koperasi_id
      GROUP BY k.provinsi
      ORDER BY k.provinsi;
      `
    );

    res.status(200).json({
      totalHarvestPerProvince: totalHarvestPerProvince.rows,
      activeFarmersPerProvince: activeFarmersPerProvince.rows,
      totalLandAreaPerProvince: totalLandAreaPerProvince.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get national supply projection (SUPER_ADMIN only)
router.get('/national/supply-projection', authenticateToken, authorizeRoles(['SUPER_ADMIN']), async (req, res) => {
  try {
    const supplyProjection = await db.query(
      `SELECT
        k.provinsi,
        SUM(ab.jumlah_estimasi_kg) AS total_estimasi_panen_kg,
        TO_CHAR(ab.tanggal_estimasi, 'YYYY-MM') AS bulan_estimasi
      FROM Aktivitas_Budidaya ab
      JOIN Lahan l ON ab.lahan_id = l.lahan_id
      JOIN Koperasi k ON l.koperasi_id = k.koperasi_id
      WHERE ab.jenis_aktivitas = 'ESTIMASI_PANEN'
      GROUP BY k.provinsi, bulan_estimasi
      ORDER BY k.provinsi, bulan_estimasi;
      `
    );

    res.status(200).json({
      supplyProjection: supplyProjection.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get list of all cooperatives (SUPER_ADMIN only)
router.get('/national/koperasi-list', authenticateToken, authorizeRoles(['SUPER_ADMIN']), async (req, res) => {
  try {
    const koperasiList = await db.query(
      `SELECT
        koperasi_id,
        nama_koperasi,
        provinsi,
        kabupaten
      FROM Koperasi
      ORDER BY nama_koperasi;
      `
    );

    res.status(200).json({
      koperasiList: koperasiList.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get specific cooperative performance metrics (SUPER_ADMIN only)
router.get('/national/koperasi-performance/:koperasi_id', authenticateToken, authorizeRoles(['SUPER_ADMIN']), async (req, res) => {
  try {
    const { koperasi_id } = req.params;

    // Validate koperasi_id
    if (!koperasi_id) {
      return res.status(400).json({ error: 'Koperasi ID is required.' });
    }

    // Total harvested coffee (actual_kg) for a specific cooperative
    const totalHarvest = await db.query(
      `SELECT
        SUM(ab.jumlah_aktual_kg) AS total_panen_kg
      FROM Aktivitas_Budidaya ab
      JOIN Lahan l ON ab.lahan_id = l.lahan_id
      WHERE l.koperasi_id = $1
      AND ab.jenis_aktivitas = 'PANEN';
      `,
      [koperasi_id]
    );

    // Number of active farmers for a specific cooperative
    const activeFarmers = await db.query(
      `SELECT
        COUNT(DISTINCT petani_id) AS jumlah_petani
      FROM Petani
      WHERE koperasi_id = $1;
      `,
      [koperasi_id]
    );

    // Total land area (luas_hektar) for a specific cooperative
    const totalLandArea = await db.query(
      `SELECT
        SUM(luas_hektar) AS total_luas_hektar
      FROM Lahan
      WHERE koperasi_id = $1;
      `,
      [koperasi_id]
    );

    res.status(200).json({
      koperasi_id: koperasi_id,
      totalHarvest: totalHarvest.rows[0].total_panen_kg || 0,
      activeFarmers: activeFarmers.rows[0].jumlah_petani || 0,
      totalLandArea: totalLandArea.rows[0].total_luas_hektar || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get dashboard statistics for a specific cooperative (ADMIN role)
router.get('/dashboard/:koperasi_id', authenticateToken, authorizeRoles(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { koperasi_id } = req.params;

    // Get next harvest estimation
    const nextHarvest = await db.query(
      `SELECT 
        l.nama_lahan,
        ab.tanggal_estimasi,
        ab.jumlah_estimasi_kg
      FROM Aktivitas_Budidaya ab
      JOIN Lahan l ON ab.lahan_id = l.lahan_id
      WHERE l.koperasi_id = $1 
      AND ab.jenis_aktivitas = 'ESTIMASI_PANEN'
      AND ab.tanggal_estimasi >= CURRENT_DATE
      ORDER BY ab.tanggal_estimasi ASC
      LIMIT 1`,
      [koperasi_id]
    );

    // Get current inventory totals
    const inventoryTotals = await db.query(
      `SELECT 
        SUM(CASE WHEN tipe_produk = 'cherry' THEN kuantitas_kg ELSE 0 END) as total_cherry,
        SUM(CASE WHEN tipe_produk = 'green_bean' THEN kuantitas_kg ELSE 0 END) as total_green_bean,
        SUM(kuantitas_kg) as total_stok
      FROM Inventory 
      WHERE koperasi_id = $1`,
      [koperasi_id]
    );

    // Get recent inventory transactions (last 3)
    const recentTransactions = await db.query(
      `SELECT 
        ti.tanggal_transaksi,
        i.nama_produk,
        ti.jenis_transaksi,
        ti.kuantitas_kg
      FROM Transaksi_Inventory ti
      JOIN Inventory i ON ti.inventory_id = i.inventory_id
      WHERE i.koperasi_id = $1
      ORDER BY ti.tanggal_transaksi DESC
      LIMIT 3`,
      [koperasi_id]
    );

    const stats = inventoryTotals.rows[0] || { total_cherry: 0, total_green_bean: 0, total_stok: 0 };
    
    res.status(200).json({
      nextHarvest: nextHarvest.rows[0] || null,
      inventoryStats: {
        totalCherry: parseFloat(stats.total_cherry) || 0,
        totalGreenBean: parseFloat(stats.total_green_bean) || 0,
        totalStock: parseFloat(stats.total_stok) || 0
      },
      recentTransactions: recentTransactions.rows
    });
  } catch (err) {
    console.error('Dashboard API error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get koperasi performance/productivity report (ADMIN role)
router.get('/productivity/:koperasi_id', authenticateToken, authorizeRoles(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { koperasi_id } = req.params;

    const productivity = await db.query(
      `SELECT 
        l.nama_lahan,
        p.nama_lengkap as nama_petani,
        l.luas_hektar,
        COALESCE(SUM(ab.jumlah_aktual_kg), 0) as total_panen_kg,
        CASE 
          WHEN l.luas_hektar > 0 THEN COALESCE(SUM(ab.jumlah_aktual_kg), 0) / l.luas_hektar
          ELSE 0 
        END as produktivitas_kg_per_ha
      FROM Lahan l
      LEFT JOIN Petani p ON l.petani_id = p.petani_id
      LEFT JOIN Aktivitas_Budidaya ab ON l.lahan_id = ab.lahan_id 
        AND ab.jenis_aktivitas = 'PANEN'
        AND ab.tanggal_aktivitas >= CURRENT_DATE - INTERVAL '1 year'
      WHERE l.koperasi_id = $1
      GROUP BY l.lahan_id, l.nama_lahan, p.nama_lengkap, l.luas_hektar
      ORDER BY produktivitas_kg_per_ha DESC`,
      [koperasi_id]
    );

    res.status(200).json({
      productivity: productivity.rows
    });
  } catch (err) {
    console.error('Productivity API error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get traceability data for a specific batch ID (ADMIN, OPERATOR role)
router.get('/traceability/:batch_id', authenticateToken, authorizeRoles(['ADMIN', 'OPERATOR', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { batch_id } = req.params;

    // Get batch/inventory details
    const batchInfo = await db.query(
      `SELECT 
        i.inventory_id,
        i.batch_id,
        i.nama_produk,
        i.tipe_produk,
        i.kuantitas_kg,
        i.tanggal_produksi,
        i.status_inventaris,
        k.nama_koperasi,
        k.provinsi,
        k.kabupaten
      FROM Inventory i
      JOIN Koperasi k ON i.koperasi_id = k.koperasi_id
      WHERE i.batch_id = $1`,
      [batch_id]
    );

    if (batchInfo.rows.length === 0) {
      return res.status(404).json({ message: 'Batch ID tidak ditemukan' });
    }

    const batch = batchInfo.rows[0];

    // Get farm/lahan origin data from activities
    const originData = await db.query(
      `SELECT DISTINCT
        l.nama_lahan,
        l.luas_hektar,
        l.jenis_kopi,
        p.nama_lengkap as nama_petani,
        p.nomor_telepon as telepon_petani,
        ab.tanggal_aktivitas as tanggal_panen,
        ab.jumlah_aktual_kg as hasil_panen_kg,
        ab.catatan
      FROM Aktivitas_Budidaya ab
      JOIN Lahan l ON ab.lahan_id = l.lahan_id
      JOIN Petani p ON l.petani_id = p.petani_id
      WHERE ab.jenis_aktivitas = 'PANEN'
      AND ab.tanggal_aktivitas <= $1
      ORDER BY ab.tanggal_aktivitas DESC
      LIMIT 1`,
      [batch.tanggal_produksi]
    );

    // Get processing/transaction history
    const processingHistory = await db.query(
      `SELECT 
        ti.tanggal_transaksi,
        ti.jenis_transaksi,
        ti.kuantitas_kg,
        ti.catatan,
        ti.pic_transaksi
      FROM Transaksi_Inventory ti
      WHERE ti.inventory_id = $1
      ORDER BY ti.tanggal_transaksi ASC`,
      [batch.inventory_id]
    );

    // Get quality checkpoints if available
    const qualityData = await db.query(
      `SELECT 
        qc.tanggal_kontrol,
        qc.checkpoint_type,
        qc.hasil_kontrol,
        qc.catatan_kualitas,
        qc.dioperasi_oleh
      FROM Quality_Control qc
      WHERE qc.inventory_id = $1
      ORDER BY qc.tanggal_kontrol ASC`,
      [batch.inventory_id]
    );

    const traceabilityData = {
      batchInfo: batch,
      origin: originData.rows[0] || null,
      processingHistory: processingHistory.rows,
      qualityCheckpoints: qualityData.rows,
      traceabilityStages: [
        {
          stage: 'origin',
          title: 'Asal-Usul',
          timestamp: originData.rows[0]?.tanggal_panen || batch.tanggal_produksi,
          details: originData.rows[0] ? {
            lokasi: originData.rows[0].nama_lahan,
            petani: originData.rows[0].nama_petani,
            jenis: originData.rows[0].jenis_kopi,
            luas: `${originData.rows[0].luas_hektar} ha`,
            hasil: `${originData.rows[0].hasil_panen_kg} kg`
          } : null
        },
        {
          stage: 'harvest',
          title: 'Panen',
          timestamp: batch.tanggal_produksi,
          details: {
            tanggal: batch.tanggal_produksi,
            kuantitas: `${batch.kuantitas_kg} kg`,
            tipe: batch.tipe_produk,
            status: batch.status_inventaris
          }
        },
        {
          stage: 'processing',
          title: 'Pemrosesan',
          timestamp: processingHistory.rows[0]?.tanggal_transaksi || batch.tanggal_produksi,
          details: {
            prosesTotal: processingHistory.rows.length,
            lastProcess: processingHistory.rows[processingHistory.rows.length - 1]?.jenis_transaksi || 'Belum ada transaksi'
          }
        }
      ]
    };

    res.status(200).json(traceabilityData);
  } catch (err) {
    console.error('Traceability API error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;



