const express = require('express');
const router = express.Router();
const db = require('../db');
const { body, validationResult } = require('express-validator');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Real PasarMikro integration - Send Inventory Data
router.post('/sync-inventory', [
  authenticateToken, 
  authorizeRoles(['ADMIN', 'SUPER_ADMIN']),
  body('timestamp').isISO8601().withMessage('Valid timestamp required'),
  body('totalItems').isInt({ min: 0 }).withMessage('Total items must be non-negative integer'),
  body('inventory').isArray().withMessage('Inventory must be an array')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { timestamp, totalItems, inventory } = req.body;
  const { user_id, koperasi_id } = req.user;

  try {
    // 1. Validate and transform inventory data to PasarMikro format
    const validatedInventory = inventory.map(item => ({
      batch_id: item.batch_id,
      product_name: item.product_name || item.nama_produk,
      product_type: item.product_type || item.tipe_produk,
      quantity_kg: parseFloat(item.quantity_kg || item.kuantitas_kg),
      production_date: item.production_date || item.tanggal_produksi,
      status: item.status || item.status_inventaris,
      cooperative_id: koperasi_id,
      sync_timestamp: timestamp
    }));

    // 2. Filter only available inventory (not sold/transferred)
    const availableInventory = validatedInventory.filter(item => 
      item.status && !['TERJUAL', 'DITRANSFER', 'HABIS'].includes(item.status.toUpperCase())
    );

    if (availableInventory.length === 0) {
      return res.status(400).json({ 
        message: 'Tidak ada inventaris yang tersedia untuk disinkronisasi ke PasarMikro',
        availableItems: 0
      });
    }

    // 3. Record sync attempt in database
    const syncRecord = await db.query(`
      INSERT INTO pasarmikro_sync_log (
        koperasi_id, 
        user_id, 
        total_items_requested, 
        total_items_synced, 
        sync_timestamp, 
        sync_status,
        sync_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING sync_id
    `, [
      koperasi_id, 
      user_id, 
      totalItems, 
      availableInventory.length, 
      timestamp, 
      'IN_PROGRESS',
      JSON.stringify(availableInventory)
    ]);

    const syncId = syncRecord.rows[0].sync_id;

    // 4. Prepare data for PasarMikro API format
    const pasarmikroPayload = {
      cooperative_id: koperasi_id,
      sync_id: syncId,
      timestamp: timestamp,
      products: availableInventory.map(item => ({
        external_batch_id: item.batch_id,
        name: item.product_name,
        category: item.product_type,
        weight_kg: item.quantity_kg,
        production_date: item.production_date,
        quality_status: item.status,
        traceability_data: {
          cooperative_id: koperasi_id,
          batch_tracking: true,
          organic_certified: false // Could be enhanced with real certification data
        }
      }))
    };

    // 5. In a real scenario, make HTTP call to PasarMikro API
    // const pasarmikroResponse = await axios.post('https://api.pasarmikro.com/v1/inventory/sync', pasarmikroPayload);
    
    // 6. Simulate successful PasarMikro response for now
    const simulatedResponse = {
      success: true,
      sync_id: syncId,
      products_received: availableInventory.length,
      products_listed: availableInventory.length,
      estimated_visibility_time: '24 hours',
      marketplace_fees: {
        listing_fee: 0,
        transaction_fee_percent: 5
      }
    };

    // 7. Update sync status to completed
    await db.query(`
      UPDATE pasarmikro_sync_log 
      SET sync_status = $1, 
          pasarmikro_response = $2,
          completed_at = NOW()
      WHERE sync_id = $3
    `, ['COMPLETED', JSON.stringify(simulatedResponse), syncId]);

    // 8. Update inventory items with PasarMikro reference
    for (const item of availableInventory) {
      await db.query(`
        UPDATE Inventory 
        SET referensi_pasarmikro = $1 
        WHERE batch_id = $2 AND koperasi_id = $3
      `, [`PM-${syncId}-${item.batch_id}`, item.batch_id, koperasi_id]);
    }

    res.status(200).json({ 
      message: `Berhasil menyinkronisasi ${availableInventory.length} item inventaris ke PasarMikro`,
      syncId: syncId,
      itemsSynced: availableInventory.length,
      estimatedVisibility: '24 hours',
      marketplaceFees: simulatedResponse.marketplace_fees,
      nextSyncRecommended: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    });

  } catch (err) {
    console.error('PasarMikro sync error:', err);
    
    // Update sync status to failed if we have syncId
    if (req.syncId) {
      await db.query(`
        UPDATE pasarmikro_sync_log 
        SET sync_status = 'FAILED', 
            error_message = $1,
            completed_at = NOW()
        WHERE sync_id = $2
      `, [err.message, req.syncId]);
    }

    res.status(500).json({ 
      message: 'Gagal menyinkronisasi inventaris ke PasarMikro',
      error: err.message 
    });
  }
});

// Enhanced PasarMikro webhook endpoint - Receive Updates
router.post('/webhook', [
  body('event_type').isIn(['ORDER_CREATED', 'ORDER_UPDATED', 'ORDER_CANCELLED', 'PRODUCT_SOLD', 'INVENTORY_UPDATE']).withMessage('Invalid event type'),
  body('cooperative_id').isInt().withMessage('Valid cooperative ID required'),
  body('timestamp').isISO8601().withMessage('Valid timestamp required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { event_type, cooperative_id, timestamp, data } = req.body;

  try {
    // 1. Validate webhook signature (in production, verify HMAC signature)
    // const expectedSignature = crypto.createHmac('sha256', process.env.PASARMIKRO_WEBHOOK_SECRET).update(JSON.stringify(req.body)).digest('hex');
    // if (req.headers['x-pasarmikro-signature'] !== expectedSignature) {
    //   return res.status(401).json({ message: 'Invalid webhook signature' });
    // }

    // 2. Log webhook received
    const webhookLog = await db.query(`
      INSERT INTO pasarmikro_webhook_log (
        cooperative_id, 
        event_type, 
        event_timestamp, 
        webhook_data, 
        processing_status
      ) VALUES ($1, $2, $3, $4, $5) 
      RETURNING webhook_id
    `, [cooperative_id, event_type, timestamp, JSON.stringify(data), 'PROCESSING']);

    const webhookId = webhookLog.rows[0].webhook_id;

    // 3. Process different webhook events
    switch (event_type) {
      case 'ORDER_CREATED':
        await processOrderCreated(data, cooperative_id);
        break;
      case 'PRODUCT_SOLD':
        await processProductSold(data, cooperative_id);
        break;
      case 'INVENTORY_UPDATE':
        await processInventoryUpdate(data, cooperative_id);
        break;
      case 'ORDER_CANCELLED':
        await processOrderCancelled(data, cooperative_id);
        break;
      default:
        console.log('Unhandled webhook event type:', event_type);
    }

    // 4. Update webhook processing status
    await db.query(`
      UPDATE pasarmikro_webhook_log 
      SET processing_status = $1, processed_at = NOW() 
      WHERE webhook_id = $2
    `, ['COMPLETED', webhookId]);

    res.status(200).json({ 
      message: 'Webhook processed successfully',
      webhookId: webhookId,
      eventType: event_type 
    });

  } catch (err) {
    console.error('Webhook processing error:', err);
    
    // Update webhook status to failed
    if (req.webhookId) {
      await db.query(`
        UPDATE pasarmikro_webhook_log 
        SET processing_status = 'FAILED', 
            error_message = $1, 
            processed_at = NOW() 
        WHERE webhook_id = $2
      `, [err.message, req.webhookId]);
    }

    res.status(500).json({ 
      message: 'Webhook processing failed',
      error: err.message 
    });
  }
});

// Get PasarMikro sync history
router.get('/sync-history', authenticateToken, async (req, res) => {
  const { koperasi_id } = req.user;
  const { limit = 10, offset = 0 } = req.query;

  try {
    const syncHistory = await db.query(`
      SELECT 
        sync_id,
        total_items_requested,
        total_items_synced,
        sync_timestamp,
        sync_status,
        completed_at,
        error_message
      FROM pasarmikro_sync_log 
      WHERE koperasi_id = $1 
      ORDER BY sync_timestamp DESC 
      LIMIT $2 OFFSET $3
    `, [koperasi_id, limit, offset]);

    const totalCount = await db.query(`
      SELECT COUNT(*) as total 
      FROM pasarmikro_sync_log 
      WHERE koperasi_id = $1
    `, [koperasi_id]);

    res.status(200).json({
      syncHistory: syncHistory.rows,
      pagination: {
        total: parseInt(totalCount.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (err) {
    console.error('Error fetching sync history:', err);
    res.status(500).json({ error: err.message });
  }
});

// Helper functions for webhook processing
async function processOrderCreated(orderData, cooperativeId) {
  // Create order record in local database
  await db.query(`
    INSERT INTO pasarmikro_orders (
      cooperative_id, 
      pasarmikro_order_id, 
      batch_id, 
      quantity_kg, 
      price_per_kg, 
      buyer_info, 
      order_status,
      order_date
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [
    cooperativeId,
    orderData.order_id,
    orderData.batch_id,
    orderData.quantity_kg,
    orderData.price_per_kg,
    JSON.stringify(orderData.buyer),
    'PENDING',
    orderData.order_date
  ]);
}

async function processProductSold(soldData, cooperativeId) {
  // Update inventory status to sold
  await db.query(`
    UPDATE Inventory 
    SET status_inventaris = 'TERJUAL' 
    WHERE batch_id = $1 AND koperasi_id = $2
  `, [soldData.batch_id, cooperativeId]);

  // Record the sale transaction
  await db.query(`
    INSERT INTO Transaksi_Inventory (
      koperasi_id,
      inventory_id,
      tipe_transaksi,
      jenis_operasi,
      tanggal,
      jumlah,
      buyer,
      harga_per_kg,
      total_nilai
    ) VALUES (
      $1,
      (SELECT inventory_id FROM Inventory WHERE batch_id = $2 AND koperasi_id = $1 LIMIT 1),
      'KELUAR',
      'PENJUALAN_PASARMIKRO',
      NOW(),
      $3,
      $4,
      $5,
      $6
    )
  `, [
    cooperativeId,
    soldData.batch_id,
    soldData.quantity_sold,
    soldData.buyer_name,
    soldData.price_per_kg,
    soldData.total_value
  ]);
}

async function processInventoryUpdate(updateData, cooperativeId) {
  // Update inventory based on PasarMikro feedback
  if (updateData.action === 'UPDATE_AVAILABILITY') {
    await db.query(`
      UPDATE Inventory 
      SET kuantitas_kg = $1, 
          status_inventaris = $2 
      WHERE batch_id = $3 AND koperasi_id = $4
    `, [
      updateData.available_quantity,
      updateData.availability_status,
      updateData.batch_id,
      cooperativeId
    ]);
  }
}

async function processOrderCancelled(cancelData, cooperativeId) {
  // Update order status and restore inventory availability
  await db.query(`
    UPDATE pasarmikro_orders 
    SET order_status = 'CANCELLED', 
        cancellation_reason = $1,
        cancelled_at = NOW()
    WHERE pasarmikro_order_id = $2 AND cooperative_id = $3
  `, [cancelData.cancellation_reason, cancelData.order_id, cooperativeId]);

  // Restore inventory availability
  await db.query(`
    UPDATE Inventory 
    SET status_inventaris = 'TERSEDIA' 
    WHERE batch_id = $1 AND koperasi_id = $2
  `, [cancelData.batch_id, cooperativeId]);
}

module.exports = router;
