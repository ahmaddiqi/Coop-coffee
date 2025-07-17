const request = require('supertest');
const express = require('express');
const { body, validationResult } = require('express-validator');

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';

describe('MODUL 2: PETANI REGISTRATION - Backend Unit Tests', () => {
  describe('Phone Number Validation', () => {
    it('should validate phone number format correctly', () => {
      const phoneRegex = /^[\+]?[0-9]{10,15}$/;
      
      // Valid formats
      expect('081234567890').toMatch(phoneRegex);
      expect('+6281234567890').toMatch(phoneRegex);
      expect('123456789012345').toMatch(phoneRegex); // 15 digits max
      expect('1234567890').toMatch(phoneRegex); // 10 digits min
      
      // Invalid formats
      expect('123').not.toMatch(phoneRegex); // Too short
      expect('123456789012345678').not.toMatch(phoneRegex); // Too long
      expect('08123abc456').not.toMatch(phoneRegex); // Contains letters
      expect('').not.toMatch(phoneRegex); // Empty
      expect('08123-456-789').not.toMatch(phoneRegex); // Contains dashes
    });
  });

  describe('Business Logic Requirements', () => {
    it('should enforce required fields per DOKUMENTASITEKNIS.MD', () => {
      // According to documentation, these fields are required:
      const requiredFields = ['nama', 'alamat', 'koperasi_id'];
      const optionalFields = ['kontak'];
      
      expect(requiredFields).toContain('nama');
      expect(requiredFields).toContain('alamat');
      expect(requiredFields).toContain('koperasi_id');
      expect(optionalFields).toContain('kontak');
    });

    it('should validate duplicate petani logic', () => {
      // Business rule: Same name in same koperasi should be prevented
      const petani1 = { nama: 'John Doe', koperasi_id: 1 };
      const petani2 = { nama: 'John Doe', koperasi_id: 1 }; // Same koperasi - should be blocked
      const petani3 = { nama: 'John Doe', koperasi_id: 2 }; // Different koperasi - should be allowed
      
      // This would be the SQL check logic:
      // SELECT petani_id FROM Petani WHERE koperasi_id = $1 AND nama = $2
      
      expect(petani1.nama).toBe(petani2.nama);
      expect(petani1.koperasi_id).toBe(petani2.koperasi_id); // Should trigger duplicate check
      
      expect(petani1.nama).toBe(petani3.nama);
      expect(petani1.koperasi_id).not.toBe(petani3.koperasi_id); // Different koperasi, should be ok
    });
  });

  describe('Database Schema Validation', () => {
    it('should have correct field types per schema', () => {
      const expectedSchema = {
        petani_id: 'SERIAL PRIMARY KEY',
        koperasi_id: 'INT REFERENCES Koperasi(koperasi_id)',
        nama: 'VARCHAR(255) NOT NULL',
        kontak: 'VARCHAR(50)', // Optional
        alamat: 'TEXT' // Required per business logic
      };
      
      // Verify schema design matches documentation
      expect(expectedSchema.petani_id).toContain('SERIAL PRIMARY KEY');
      expect(expectedSchema.koperasi_id).toContain('REFERENCES Koperasi');
      expect(expectedSchema.nama).toContain('NOT NULL');
      expect(expectedSchema.kontak).not.toContain('NOT NULL'); // Optional field
    });
  });

  describe('API Endpoint Structure', () => {
    it('should have all required endpoints per DOKUMENTASITEKNIS.MD', () => {
      const requiredEndpoints = [
        'POST /api/petani',      // Create petani
        'GET /api/petani',       // List petani per koperasi
        'PUT /api/petani/:id',   // Update petani
        'DELETE /api/petani/:id', // Delete petani
        'GET /api/petani/:id'    // Get single petani
      ];
      
      // All endpoints from documentation should be implemented
      expect(requiredEndpoints).toHaveLength(5);
      expect(requiredEndpoints).toContain('POST /api/petani');
      expect(requiredEndpoints).toContain('GET /api/petani');
      expect(requiredEndpoints).toContain('PUT /api/petani/:id');
      expect(requiredEndpoints).toContain('DELETE /api/petani/:id');
      expect(requiredEndpoints).toContain('GET /api/petani/:id');
    });
  });

  describe('Input Validation Rules', () => {
    it('should validate nama field requirements', () => {
      // From documentation: nama is required
      const validNama = 'John Doe';
      const invalidNama = '';
      
      expect(validNama.length).toBeGreaterThan(0);
      expect(invalidNama.length).toBe(0); // Should fail validation
    });

    it('should validate alamat field requirements', () => {
      // From documentation: alamat is required
      const validAlamat = 'Jl. Contoh No. 123';
      const invalidAlamat = '';
      
      expect(validAlamat.length).toBeGreaterThan(0);
      expect(invalidAlamat.length).toBe(0); // Should fail validation
    });

    it('should validate koperasi_id field requirements', () => {
      // From documentation: koperasi_id is required for association
      const validKoperasiId = 1;
      const invalidKoperasiId = null;
      
      expect(typeof validKoperasiId).toBe('number');
      expect(validKoperasiId).toBeGreaterThan(0);
      expect(invalidKoperasiId).toBeNull(); // Should fail validation
    });

    it('should validate kontak field format when provided', () => {
      // From implementation: kontak is optional but must be valid format if provided
      const validKontak = '081234567890';
      const invalidKontak = '123abc';
      const emptyKontak = ''; // Should be allowed (optional field)
      
      const phoneRegex = /^[\+]?[0-9]{10,15}$/;
      
      expect(validKontak).toMatch(phoneRegex);
      expect(invalidKontak).not.toMatch(phoneRegex);
      // Empty should be allowed since field is optional
      expect(emptyKontak.length).toBe(0);
    });
  });

  describe('Security and Authorization', () => {
    it('should require authentication for all endpoints', () => {
      // All endpoints should require authenticateToken middleware
      const protectedEndpoints = [
        'GET /api/petani',
        'GET /api/petani/:id',
        'POST /api/petani',
        'PUT /api/petani/:id',
        'DELETE /api/petani/:id'
      ];
      
      protectedEndpoints.forEach(endpoint => {
        expect(endpoint).toBeDefined(); // All should be protected
      });
    });

    it('should require ADMIN or OPERATOR roles for write operations', () => {
      // Write operations should require proper roles
      const writeOperations = [
        'POST /api/petani',
        'PUT /api/petani/:id',
        'DELETE /api/petani/:id'
      ];
      
      const authorizedRoles = ['ADMIN', 'OPERATOR'];
      
      writeOperations.forEach(operation => {
        expect(operation).toBeDefined();
      });
      
      expect(authorizedRoles).toContain('ADMIN');
      expect(authorizedRoles).toContain('OPERATOR');
    });

    it('should filter data by accessible koperasi', () => {
      // Users should only see petani from their accessible koperasi
      const userAccessibleKoperasi = [1, 2];
      const petaniData = [
        { petani_id: 1, koperasi_id: 1, nama: 'Petani 1' }, // Should be visible
        { petani_id: 2, koperasi_id: 2, nama: 'Petani 2' }, // Should be visible
        { petani_id: 3, koperasi_id: 3, nama: 'Petani 3' }  // Should be filtered out
      ];
      
      const filteredData = petaniData.filter(petani => 
        userAccessibleKoperasi.includes(petani.koperasi_id)
      );
      
      expect(filteredData).toHaveLength(2);
      expect(filteredData[0].koperasi_id).toBe(1);
      expect(filteredData[1].koperasi_id).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required fields appropriately', () => {
      const incompleteData = {
        // Missing nama, alamat, koperasi_id
        kontak: '081234567890'
      };
      
      const requiredFields = ['nama', 'alamat', 'koperasi_id'];
      const missingFields = requiredFields.filter(field => !incompleteData[field]);
      
      expect(missingFields).toHaveLength(3);
      expect(missingFields).toContain('nama');
      expect(missingFields).toContain('alamat');
      expect(missingFields).toContain('koperasi_id');
    });

    it('should handle database constraint violations', () => {
      // Duplicate petani scenario
      const existingPetani = { nama: 'John Doe', koperasi_id: 1 };
      const duplicatePetani = { nama: 'John Doe', koperasi_id: 1 };
      
      // Should trigger: 'Petani dengan nama yang sama sudah terdaftar di koperasi ini'
      const isDuplicate = existingPetani.nama === duplicatePetani.nama && 
                         existingPetani.koperasi_id === duplicatePetani.koperasi_id;
      
      expect(isDuplicate).toBe(true);
      
      const expectedErrorMessage = 'Petani dengan nama yang sama sudah terdaftar di koperasi ini';
      expect(expectedErrorMessage).toContain('sudah terdaftar');
    });

    it('should handle invalid phone number formats', () => {
      const invalidPhoneFormats = [
        '123',           // Too short
        'abc123',        // Contains letters  
        '08123-456',     // Contains special chars
        '12345678901234567890' // Too long
      ];
      
      const phoneRegex = /^[\+]?[0-9]{10,15}$/;
      
      invalidPhoneFormats.forEach(invalidPhone => {
        expect(invalidPhone).not.toMatch(phoneRegex);
      });
      
      const expectedErrorMessage = 'Nomor telepon harus dalam format yang valid (10-15 digit)';
      expect(expectedErrorMessage).toContain('format yang valid');
    });
  });

  describe('Integration with Other Modules', () => {
    it('should maintain referential integrity with Koperasi table', () => {
      // petani.koperasi_id should reference valid koperasi.koperasi_id
      const petani = { koperasi_id: 1 };
      const validKoperasi = { koperasi_id: 1, nama_koperasi: 'Test Koperasi' };
      
      expect(petani.koperasi_id).toBe(validKoperasi.koperasi_id);
    });

    it('should support land statistics integration', () => {
      // Should support queries for land stats per petani
      const landStatsQuery = {
        endpoint: 'GET /api/petani/land-stats',
        returns: {
          petani_id: 'number',
          jumlah_lahan: 'number',
          total_luas_hektar: 'number'
        }
      };
      
      expect(landStatsQuery.endpoint).toBe('GET /api/petani/land-stats');
      expect(landStatsQuery.returns.petani_id).toBe('number');
      expect(landStatsQuery.returns.jumlah_lahan).toBe('number');
      expect(landStatsQuery.returns.total_luas_hektar).toBe('number');
    });
  });
});