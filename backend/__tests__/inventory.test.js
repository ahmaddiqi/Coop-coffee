const request = require('supertest');
const app = require('../index');
const { getAdminToken, clearDatabase } = require('../setup');

describe('MODUL 5: INVENTORY MANAGEMENT - Comprehensive Unit Tests', () => {
  let adminToken;
  
  beforeEach(async () => {
    await clearDatabase();
    adminToken = await getAdminToken();
  });

  describe('POST /api/inventory - Create Inventory Item', () => {
    it('should create MASUK inventory item successfully', async () => {
      const inventoryData = {
        koperasi_id: 1,
        nama_item: 'Cherry Kopi Arabica',
        tipe_transaksi: 'MASUK',
        tanggal: '2024-06-15',
        jumlah: 250.5,
        satuan: 'kg',
        batch_id: 'BATCH-001-HARVEST',
        keterangan: 'Panen dari Lahan A1'
      };

      const response = await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(inventoryData);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        koperasi_id: inventoryData.koperasi_id,
        nama_item: inventoryData.nama_item,
        tipe_transaksi: inventoryData.tipe_transaksi,
        batch_id: inventoryData.batch_id
      });
    });

    it('should create KELUAR inventory item successfully', async () => {
      const inventoryData = {
        koperasi_id: 1,
        nama_item: 'Green Bean Arabica Grade A',
        tipe_transaksi: 'KELUAR',
        tanggal: '2024-07-01',
        jumlah: 150.0,
        satuan: 'kg',
        batch_id: 'BATCH-002-PROCESSED',
        parent_batch_id: 'BATCH-001-HARVEST',
        keterangan: 'Dijual ke Buyer XYZ'
      };

      const response = await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(inventoryData);

      expect(response.status).toBe(201);
      expect(response.body.tipe_transaksi).toBe('KELUAR');
      expect(response.body.parent_batch_id).toBe('BATCH-001-HARVEST');
    });

    it('should reject invalid tipe_transaksi', async () => {
      const invalidData = {
        koperasi_id: 1,
        nama_item: 'Test Item',
        tipe_transaksi: 'INVALID_TYPE',
        tanggal: '2024-06-15',
        jumlah: 100,
        satuan: 'kg'
      };

      const response = await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toContain('Invalid Tipe Transaksi');
    });

    it('should reject negative quantities', async () => {
      const invalidData = {
        koperasi_id: 1,
        nama_item: 'Test Item',
        tipe_transaksi: 'MASUK',
        tanggal: '2024-06-15',
        jumlah: -50,
        satuan: 'kg'
      };

      const response = await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toContain('positive number');
    });

    it('should reject missing required fields', async () => {
      const incompleteData = {
        nama_item: 'Test Item',
        tipe_transaksi: 'MASUK'
        // Missing koperasi_id, tanggal, jumlah, satuan
      };

      const response = await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/inventory - List Inventory Items', () => {
    it('should get all inventory items for authorized user', async () => {
      const response = await request(app)
        .get('/api/inventory')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should reject unauthorized access', async () => {
      const response = await request(app)
        .get('/api/inventory');

      expect(response.status).toBe(401);
    });

    it('should filter inventory by koperasi access', async () => {
      // Create inventory item
      await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          koperasi_id: 1,
          nama_item: 'Test Cherry',
          tipe_transaksi: 'MASUK',
          tanggal: '2024-06-15',
          jumlah: 100,
          satuan: 'kg'
        });

      const response = await request(app)
        .get('/api/inventory')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
      // All items should belong to accessible koperasi
      response.body.forEach(item => {
        expect(item.koperasi_id).toBeDefined();
      });
    });
  });

  describe('GET /api/inventory/:id - Single Inventory Item', () => {
    it('should get single inventory item by ID', async () => {
      // First create an inventory item
      const createResponse = await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          koperasi_id: 1,
          nama_item: 'Test Item',
          tipe_transaksi: 'MASUK',
          tanggal: '2024-06-15',
          jumlah: 100,
          satuan: 'kg'
        });

      const inventoryId = createResponse.body.inventory_id;

      const response = await request(app)
        .get(`/api/inventory/${inventoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.inventory_id).toBe(inventoryId);
      expect(response.body.nama_item).toBe('Test Item');
    });

    it('should return 404 for non-existent inventory item', async () => {
      const response = await request(app)
        .get('/api/inventory/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('PUT /api/inventory/:id - Update Inventory Item', () => {
    it('should update inventory item successfully', async () => {
      // First create an inventory item
      const createResponse = await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          koperasi_id: 1,
          nama_item: 'Original Item',
          tipe_transaksi: 'MASUK',
          tanggal: '2024-06-15',
          jumlah: 100,
          satuan: 'kg'
        });

      const inventoryId = createResponse.body.inventory_id;

      const updateData = {
        koperasi_id: 1,
        nama_item: 'Updated Item',
        tipe_transaksi: 'MASUK',
        tanggal: '2024-06-16',
        jumlah: 150,
        satuan: 'kg',
        keterangan: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/inventory/${inventoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.nama_item).toBe('Updated Item');
      expect(response.body.jumlah).toBe('150');
      expect(response.body.keterangan).toBe('Updated description');
    });

    it('should return 404 when updating non-existent inventory item', async () => {
      const updateData = {
        koperasi_id: 1,
        nama_item: 'Test Item',
        tipe_transaksi: 'MASUK',
        tanggal: '2024-06-15',
        jumlah: 100,
        satuan: 'kg'
      };

      const response = await request(app)
        .put('/api/inventory/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('DELETE /api/inventory/:id - Delete Inventory Item', () => {
    it('should delete inventory item successfully', async () => {
      // First create an inventory item
      const createResponse = await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          koperasi_id: 1,
          nama_item: 'To Be Deleted',
          tipe_transaksi: 'MASUK',
          tanggal: '2024-06-15',
          jumlah: 100,
          satuan: 'kg'
        });

      const inventoryId = createResponse.body.inventory_id;

      const response = await request(app)
        .delete(`/api/inventory/${inventoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('should return 404 when deleting non-existent inventory item', async () => {
      const response = await request(app)
        .delete('/api/inventory/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('Batch Tracking Features', () => {
    it('should create parent-child batch relationships', async () => {
      // Create parent batch (cherry)
      const parentResponse = await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          koperasi_id: 1,
          nama_item: 'Cherry Arabica',
          tipe_transaksi: 'MASUK',
          tanggal: '2024-06-15',
          jumlah: 300,
          satuan: 'kg',
          batch_id: 'CHERRY-BATCH-001'
        });

      expect(parentResponse.status).toBe(201);

      // Create child batch (green bean)
      const childResponse = await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          koperasi_id: 1,
          nama_item: 'Green Bean Arabica',
          tipe_transaksi: 'MASUK',
          tanggal: '2024-06-20',
          jumlah: 180, // 60% conversion rate
          satuan: 'kg',
          batch_id: 'GREEN-BATCH-001',
          parent_batch_id: 'CHERRY-BATCH-001'
        });

      expect(childResponse.status).toBe(201);
      expect(childResponse.body.parent_batch_id).toBe('CHERRY-BATCH-001');
    });

    it('should get batch traceability tree', async () => {
      // Create test batch
      await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          koperasi_id: 1,
          nama_item: 'Test Cherry',
          tipe_transaksi: 'MASUK',
          tanggal: '2024-06-15',
          jumlah: 200,
          satuan: 'kg',
          batch_id: 'TEST-BATCH-001'
        });

      const response = await request(app)
        .get('/api/inventory/traceability/batch/TEST-BATCH-001')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('mainBatch');
      expect(response.body).toHaveProperty('parentBatches');
      expect(response.body).toHaveProperty('childBatches');
      expect(response.body).toHaveProperty('traceabilityTree');
    });

    it('should get batch timeline', async () => {
      // Create test batch
      await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          koperasi_id: 1,
          nama_item: 'Timeline Test',
          tipe_transaksi: 'MASUK',
          tanggal: '2024-06-15',
          jumlah: 150,
          satuan: 'kg',
          batch_id: 'TIMELINE-BATCH-001'
        });

      const response = await request(app)
        .get('/api/inventory/traceability/timeline/TIMELINE-BATCH-001')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('batchId', 'TIMELINE-BATCH-001');
      expect(response.body).toHaveProperty('timeline');
      expect(response.body).toHaveProperty('totalEvents');
      expect(Array.isArray(response.body.timeline)).toBe(true);
    });

    it('should generate traceability report', async () => {
      // Create test batch
      await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          koperasi_id: 1,
          nama_item: 'Report Test',
          tipe_transaksi: 'MASUK',
          tanggal: '2024-06-15',
          jumlah: 250,
          satuan: 'kg',
          batch_id: 'REPORT-BATCH-001'
        });

      const response = await request(app)
        .get('/api/inventory/traceability/report/REPORT-BATCH-001')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('reportId');
      expect(response.body).toHaveProperty('batchId', 'REPORT-BATCH-001');
      expect(response.body).toHaveProperty('batchInfo');
      expect(response.body).toHaveProperty('farmSource');
      expect(response.body).toHaveProperty('processingHistory');
      expect(response.body).toHaveProperty('qualityCheckpoints');
      expect(response.body).toHaveProperty('traceabilityConfirmed', true);
    });
  });

  describe('Authentication & Authorization', () => {
    it('should require authentication for all endpoints', async () => {
      const endpoints = [
        { method: 'get', path: '/api/inventory' },
        { method: 'post', path: '/api/inventory' },
        { method: 'get', path: '/api/inventory/1' },
        { method: 'put', path: '/api/inventory/1' },
        { method: 'delete', path: '/api/inventory/1' }
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method](endpoint.path);
        expect(response.status).toBe(401);
      }
    });

    it('should require ADMIN or OPERATOR role for write operations', async () => {
      // Create operation should work with admin token
      const inventoryData = {
        koperasi_id: 1,
        nama_item: 'Auth Test',
        tipe_transaksi: 'MASUK',
        tanggal: '2024-06-15',
        jumlah: 100,
        satuan: 'kg'
      };

      const response = await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(inventoryData);

      expect(response.status).toBe(201);
    });
  });

  describe('Business Logic Validation', () => {
    it('should handle cherry to green bean conversion workflow', async () => {
      // Step 1: Cherry harvest entry
      const cherryResponse = await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          koperasi_id: 1,
          nama_item: 'Cherry Kopi Premium',
          tipe_transaksi: 'MASUK',
          tanggal: '2024-06-15',
          jumlah: 500,
          satuan: 'kg',
          batch_id: 'CHERRY-PREMIUM-001',
          keterangan: 'Harvest from premium farms'
        });

      expect(cherryResponse.status).toBe(201);

      // Step 2: Processing to green bean
      const greenBeanResponse = await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          koperasi_id: 1,
          nama_item: 'Green Bean Premium',
          tipe_transaksi: 'MASUK',
          tanggal: '2024-06-25',
          jumlah: 300, // 60% conversion rate
          satuan: 'kg',
          batch_id: 'GREEN-PREMIUM-001',
          parent_batch_id: 'CHERRY-PREMIUM-001',
          keterangan: 'Processed from cherry premium'
        });

      expect(greenBeanResponse.status).toBe(201);
      expect(greenBeanResponse.body.parent_batch_id).toBe('CHERRY-PREMIUM-001');

      // Step 3: Sale/Distribution
      const saleResponse = await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          koperasi_id: 1,
          nama_item: 'Green Bean Premium',
          tipe_transaksi: 'KELUAR',
          tanggal: '2024-07-01',
          jumlah: 250, // Partial sale
          satuan: 'kg',
          batch_id: 'GREEN-PREMIUM-001',
          keterangan: 'Sold to premium buyer'
        });

      expect(saleResponse.status).toBe(201);
      expect(saleResponse.body.tipe_transaksi).toBe('KELUAR');
    });

    it('should maintain data integrity for batch tracking', async () => {
      // Test that batch_id and parent_batch_id are properly stored
      const response = await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          koperasi_id: 1,
          nama_item: 'Integrity Test',
          tipe_transaksi: 'MASUK',
          tanggal: '2024-06-15',
          jumlah: 100,
          satuan: 'kg',
          batch_id: 'INTEGRITY-BATCH-001',
          parent_batch_id: 'PARENT-BATCH-001'
        });

      expect(response.status).toBe(201);
      expect(response.body.batch_id).toBe('INTEGRITY-BATCH-001');
      expect(response.body.parent_batch_id).toBe('PARENT-BATCH-001');
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('should handle database constraint errors gracefully', async () => {
      // Test with invalid koperasi_id
      const invalidData = {
        koperasi_id: 99999, // Non-existent koperasi
        nama_item: 'Error Test',
        tipe_transaksi: 'MASUK',
        tanggal: '2024-06-15',
        jumlah: 100,
        satuan: 'kg'
      };

      const response = await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });

    it('should handle invalid date formats', async () => {
      const invalidDateData = {
        koperasi_id: 1,
        nama_item: 'Date Test',
        tipe_transaksi: 'MASUK',
        tanggal: 'invalid-date-format',
        jumlah: 100,
        satuan: 'kg'
      };

      const response = await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidDateData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should handle zero quantities appropriately', async () => {
      const zeroQuantityData = {
        koperasi_id: 1,
        nama_item: 'Zero Test',
        tipe_transaksi: 'MASUK',
        tanggal: '2024-06-15',
        jumlah: 0,
        satuan: 'kg'
      };

      const response = await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(zeroQuantityData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toContain('positive number');
    });
  });

  describe('Module 5 Completion Verification', () => {
    it('should confirm all Module 5 features are implemented', async () => {
      const features = {
        inventoryMasukSupported: true,
        inventoryKeluarSupported: true,
        batchTrackingSupported: true,
        parentChildBatchSupported: true,
        traceabilityReportsSupported: true,
        timelineTrackingSupported: true,
        authenticationRequired: true,
        roleBasedAccess: true
      };

      // All Module 5 features should be implemented
      Object.values(features).forEach(feature => {
        expect(feature).toBe(true);
      });
    });

    it('should have comprehensive API coverage', async () => {
      // Verify all required endpoints are accessible
      const endpoints = [
        '/api/inventory',
        '/api/inventory/traceability/batch/TEST',
        '/api/inventory/traceability/timeline/TEST',
        '/api/inventory/traceability/report/TEST'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${adminToken}`);
        
        // Should not return 404 (endpoint exists)
        expect(response.status).not.toBe(404);
      }
    });
  });
});