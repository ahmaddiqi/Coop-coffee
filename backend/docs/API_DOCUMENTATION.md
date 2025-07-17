# Coffee Cooperative Management System - API Documentation

## Overview
This is the comprehensive API documentation for the Coffee Cooperative Management System. The system provides complete traceability from farm to buyer with role-based access control.

## Table of Contents
1. [Authentication & Authorization](#authentication--authorization)
2. [User Management API](#user-management-api)
3. [Cooperative Management API](#cooperative-management-api)
4. [Farmer Management API](#farmer-management-api)
5. [Land Management API](#land-management-api)
6. [Farm Activities API](#farm-activities-api)
7. [Inventory Management API](#inventory-management-api)
8. [Inventory Transactions API](#inventory-transactions-api)
9. [Quality Control API](#quality-control-api)
10. [PasarMikro Integration API](#pasarmikro-integration-api)
11. [Reporting API](#reporting-api)
12. [Common Error Responses](#common-error-responses)
13. [Security Considerations](#security-considerations)

---

## Authentication & Authorization

### Authentication
All protected endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### Authorization Roles
- **SUPER_ADMIN**: Full system access across all cooperatives
- **ADMIN**: Full access within their cooperative
- **OPERATOR**: Limited access within their cooperative

### Base URL
```
http://localhost:3000/api
```

---

## User Management API

### 1. User Registration
**POST** `/api/users/register`

Registers a new user (step 1 - user only, no cooperative yet).

#### Request Body
```json
{
  "username": "string",
  "password": "string",
  "nama_lengkap": "string",
  "email": "string"
}
```

#### Response
```json
{
  "message": "User berhasil terdaftar. Silakan login dan daftarkan koperasi Anda.",
  "user_id": 1,
  "needs_koperasi_registration": true
}
```

### 2. User Login
**POST** `/api/users/login`

#### Request Body
```json
{
  "username": "string",
  "password": "string"
}
```

#### Response
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_id": 1,
  "username": "testuser",
  "role": "ADMIN"
}
```

### 3. Get Current User Profile
**GET** `/api/users/me`

**Auth**: Required

#### Response
```json
{
  "user_id": 1,
  "username": "testuser",
  "nama_lengkap": "Test User",
  "email": "test@example.com",
  "role": "ADMIN",
  "koperasi_id": 1,
  "is_active": true
}
```

### 4. Register Cooperative for User
**POST** `/api/users/register-koperasi`

**Auth**: Required

#### Request Body
```json
{
  "nama_koperasi": "string",
  "alamat": "string",
  "provinsi": "string",
  "kabupaten": "string",
  "kontak_person": "string",
  "nomor_telepon": "string"
}
```

### 5. Create User (Admin Only)
**POST** `/api/users/`

**Auth**: Required (ADMIN, SUPER_ADMIN)

### 6. Get All Users
**GET** `/api/users/`

**Auth**: Required (ADMIN, SUPER_ADMIN)

### 7. Generate Invite Link
**POST** `/api/users/generate-invite`

**Auth**: Required (ADMIN)

### 8. Register via Invite Link
**POST** `/api/users/register-via-invite/:token`

### 9. User Management Operations
- **PUT** `/api/users/:user_id/reset-password` - Reset password (ADMIN)
- **PUT** `/api/users/:user_id/deactivate` - Deactivate user (ADMIN)
- **PUT** `/api/users/:user_id/activate` - Activate user (ADMIN)
- **PUT** `/api/users/:user_id/role` - Change user role (ADMIN, SUPER_ADMIN)

---

## Cooperative Management API

### 1. Get All Cooperatives
**GET** `/api/koperasi/`

**Auth**: Required

#### Response
```json
[
  {
    "koperasi_id": 1,
    "nama_koperasi": "Koperasi Kopi Sejahtera",
    "alamat": "Jl. Kopi No. 123",
    "provinsi": "Jawa Barat",
    "kabupaten": "Bandung",
    "kontak_person": "Budi Santoso",
    "nomor_telepon": "081234567890",
    "created_by": 1,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### 2. Get Single Cooperative
**GET** `/api/koperasi/:id`

**Auth**: Required

### 3. Create Cooperative
**POST** `/api/koperasi/`

**Auth**: Required (ADMIN, SUPER_ADMIN)

#### Request Body
```json
{
  "nama_koperasi": "string",
  "alamat": "string",
  "provinsi": "string",
  "kabupaten": "string",
  "kontak_person": "string",
  "nomor_telepon": "string"
}
```

### 4. Update Cooperative
**PUT** `/api/koperasi/:id`

**Auth**: Required (ADMIN, SUPER_ADMIN)

### 5. Delete Cooperative
**DELETE** `/api/koperasi/:id`

**Auth**: Required (ADMIN)

---

## Farmer Management API

### 1. Get All Farmers
**GET** `/api/petani/`

**Auth**: Required

#### Response
```json
[
  {
    "petani_id": 1,
    "koperasi_id": 1,
    "nama": "Pak Budi",
    "kontak": "081234567890",
    "alamat": "Desa Kopi, Kec. Sejahtera",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### 2. Get Single Farmer
**GET** `/api/petani/:id`

**Auth**: Required

### 3. Create Farmer
**POST** `/api/petani/`

**Auth**: Required (ADMIN, OPERATOR)

#### Request Body
```json
{
  "koperasi_id": 1,
  "nama": "string",
  "kontak": "string",
  "alamat": "string"
}
```

### 4. Update Farmer
**PUT** `/api/petani/:id`

**Auth**: Required (ADMIN, OPERATOR)

### 5. Delete Farmer
**DELETE** `/api/petani/:id`

**Auth**: Required (ADMIN, OPERATOR)

### 6. Get Land Statistics
**GET** `/api/petani/land-stats`

**Auth**: Required (ADMIN, OPERATOR)

#### Response
```json
{
  "1": {
    "jumlah_lahan": 2,
    "total_luas_hektar": 3.5
  },
  "2": {
    "jumlah_lahan": 1,
    "total_luas_hektar": 2.0
  }
}
```

---

## Land Management API

### 1. Get All Land
**GET** `/api/lahan/`

**Auth**: Required

#### Response
```json
[
  {
    "lahan_id": 1,
    "koperasi_id": 1,
    "petani_id": 1,
    "nama_lahan": "Kebun Arabika 1",
    "lokasi": "Desa Kopi, Kec. Sejahtera",
    "luas_hektar": 2.5,
    "estimasi_jumlah_pohon": 500,
    "jenis_kopi_dominan": "Arabika",
    "status_lahan": "Produktif",
    "estimasi_panen_pertama": "2024-06-01T00:00:00.000Z",
    "petani_name": "Pak Budi",
    "petani_kontak": "081234567890"
  }
]
```

### 2. Get Single Land
**GET** `/api/lahan/:id`

**Auth**: Required

### 3. Create Land
**POST** `/api/lahan/`

**Auth**: Required (ADMIN, OPERATOR)

#### Request Body
```json
{
  "koperasi_id": 1,
  "petani_id": 1,
  "nama_lahan": "string",
  "lokasi": "string",
  "luas_hektar": 2.5,
  "estimasi_jumlah_pohon": 500,
  "jenis_kopi_dominan": "string",
  "status_lahan": "Baru Ditanam|Produktif|Tidak Aktif",
  "estimasi_panen_pertama": "2024-06-01T00:00:00.000Z"
}
```

#### Business Logic - Estimation System Integration
- **Automatic Harvest Estimation**: Creates initial harvest estimation activity
- **Estimation Trigger**: If `status_lahan` is 'Produktif' OR `estimasi_panen_pertama` is provided
- **Estimation Calculation**: Estimates 0.5kg per tree

### 4. Update Land
**PUT** `/api/lahan/:id`

**Auth**: Required (ADMIN, OPERATOR)

### 5. Delete Land
**DELETE** `/api/lahan/:id`

**Auth**: Required (ADMIN, OPERATOR)

---

## Farm Activities API

### 1. Get All Activities
**GET** `/api/aktivitas/`

**Auth**: Required

#### Response
```json
[
  {
    "aktivitas_id": 1,
    "lahan_id": 1,
    "jenis_aktivitas": "PANEN",
    "tanggal_aktivitas": "2024-01-01T00:00:00.000Z",
    "tanggal_estimasi": "2024-01-01T00:00:00.000Z",
    "jumlah_estimasi_kg": 100,
    "jumlah_aktual_kg": 95,
    "status": "SELESAI",
    "keterangan": "Panen raya periode 1",
    "created_from": "USER",
    "nama_lahan": "Kebun Arabika 1",
    "petani_name": "Pak Budi"
  }
]
```

### 2. Get Upcoming Harvest Estimations
**GET** `/api/aktivitas/estimasi-panen-upcoming`

**Auth**: Required

#### Response
```json
{
  "upcoming_harvests": [
    {
      "aktivitas_id": 5,
      "lahan_id": 1,
      "tanggal_estimasi": "2024-06-01T00:00:00.000Z",
      "jumlah_estimasi_kg": 120,
      "nama_lahan": "Kebun Arabika 1",
      "petani_name": "Pak Budi"
    }
  ],
  "total_estimated_kg": 120,
  "count": 1
}
```

### 3. Get Single Activity
**GET** `/api/aktivitas/:id`

**Auth**: Required

### 4. Create Activity
**POST** `/api/aktivitas/`

**Auth**: Required (ADMIN, OPERATOR)

#### Request Body
```json
{
  "lahan_id": 1,
  "jenis_aktivitas": "PANEN|TANAM|ESTIMASI_PANEN",
  "tanggal_aktivitas": "2024-01-01T00:00:00.000Z",
  "tanggal_estimasi": "2024-01-01T00:00:00.000Z",
  "jumlah_estimasi_kg": 100,
  "jumlah_aktual_kg": 95,
  "status": "TERJADWAL|SELESAI|PENDING",
  "keterangan": "string"
}
```

#### Business Logic - Harvest-to-Inventory Integration
- **Automatic Inventory Creation**: Completed harvests create inventory entries
- **Batch ID Generation**: Unique batch IDs for traceability
- **Next Harvest Estimation**: Generates next harvest estimation (6 months + 5% increase)

### 5. Update Activity
**PUT** `/api/aktivitas/:id`

**Auth**: Required (ADMIN, OPERATOR)

### 6. Delete Activity
**DELETE** `/api/aktivitas/:id`

**Auth**: Required (ADMIN, OPERATOR)

---

## Inventory Management API

### 1. Get All Inventory Items
**GET** `/api/inventory/`

**Auth**: Required

#### Response
```json
[
  {
    "inventory_id": 1,
    "koperasi_id": 1,
    "nama_item": "Cherry from Kebun Arabika 1",
    "tipe_transaksi": "MASUK",
    "tanggal": "2024-01-01T00:00:00.000Z",
    "jumlah": 95,
    "satuan": "kg",
    "batch_id": "BATCH-1704067200000-1",
    "parent_batch_id": null,
    "keterangan": "Harvest from Kebun Arabika 1 - Pak Budi - Activity ID: 1",
    "created_by": 1
  }
]
```

### 2. Get Single Inventory Item
**GET** `/api/inventory/:id`

**Auth**: Required

### 3. Create Inventory Item
**POST** `/api/inventory/`

**Auth**: Required (ADMIN, OPERATOR)

#### Request Body
```json
{
  "koperasi_id": 1,
  "nama_item": "string",
  "tipe_transaksi": "MASUK|KELUAR",
  "tanggal": "2024-01-01T00:00:00.000Z",
  "jumlah": 100,
  "satuan": "kg",
  "batch_id": "string",
  "parent_batch_id": "string",
  "keterangan": "string"
}
```

### 4. Update Inventory Item
**PUT** `/api/inventory/:id`

**Auth**: Required (ADMIN, OPERATOR)

### 5. Delete Inventory Item
**DELETE** `/api/inventory/:id`

**Auth**: Required (ADMIN, OPERATOR)

### 6. Get Batch Traceability Tree
**GET** `/api/inventory/traceability/batch/:batchId`

**Auth**: Required

#### Response
```json
{
  "mainBatch": {
    "inventory_id": 1,
    "batch_id": "BATCH-1704067200000-1",
    "nama_item": "Cherry from Kebun Arabika 1",
    "jumlah": 95,
    "nama_koperasi": "Koperasi Kopi Sejahtera",
    "petani_name": "Pak Budi"
  },
  "parentBatches": [],
  "childBatches": [],
  "traceabilityTree": {
    "upstream": [],
    "current": {},
    "downstream": []
  }
}
```

### 7. Get Batch History Timeline
**GET** `/api/inventory/traceability/timeline/:batchId`

**Auth**: Required

### 8. Generate Traceability Report
**GET** `/api/inventory/traceability/report/:batchId`

**Auth**: Required

#### Query Parameters
- `format`: Response format ('json' or 'pdf')

#### Response
```json
{
  "reportId": "TR-BATCH-1704067200000-1-1704153600000",
  "generatedAt": "2024-01-02T00:00:00.000Z",
  "batchId": "BATCH-1704067200000-1",
  "batchInfo": {
    "nama_item": "Cherry from Kebun Arabika 1",
    "jumlah": 95,
    "nama_koperasi": "Koperasi Kopi Sejahtera"
  },
  "farmSource": [
    {
      "petani_name": "Pak Budi",
      "nama_lahan": "Kebun Arabika 1",
      "luas_hektar": 2.5,
      "jenis_kopi_dominan": "Arabika",
      "harvest_date": "2024-01-01T00:00:00.000Z"
    }
  ],
  "processingHistory": [],
  "qualityCheckpoints": [],
  "traceabilityConfirmed": true,
  "reportSummary": {
    "totalFarms": 1,
    "totalProcessingSteps": 1,
    "qualityChecksPassed": 1,
    "traceabilityScore": "100%"
  }
}
```

---

## Inventory Transactions API

### 1. Get All Inventory Transactions
**GET** `/api/transaksi-inventory/`

**Auth**: Required

#### Response
```json
[
  {
    "transaksi_id": 1,
    "inventory_id": 1,
    "koperasi_id": 1,
    "tipe_transaksi": "KELUAR",
    "jenis_operasi": "PENJUALAN",
    "tanggal": "2024-01-02T00:00:00.000Z",
    "jumlah": 50,
    "petani_id": 1,
    "lahan_id": 1,
    "buyer": "PT Kopi Nusantara",
    "harga_total": 500000,
    "keterangan": "Penjualan green bean ke eksportir"
  }
]
```

### 2. Get Single Inventory Transaction
**GET** `/api/transaksi-inventory/:id`

**Auth**: Required

### 3. Create Inventory Transaction
**POST** `/api/transaksi-inventory/`

**Auth**: Required (ADMIN, OPERATOR)

#### Request Body
```json
{
  "inventory_id": 1,
  "koperasi_id": 1,
  "tipe_transaksi": "MASUK|KELUAR|PROSES|JUAL",
  "jenis_operasi": "PEMBELIAN|PANEN|DISTRIBUSI|PENJUALAN|TRANSFORMASI",
  "tanggal": "2024-01-02T00:00:00.000Z",
  "jumlah": 50,
  "petani_id": 1,
  "lahan_id": 1,
  "buyer": "PT Kopi Nusantara",
  "harga_total": 500000,
  "keterangan": "string"
}
```

### 4. Update Inventory Transaction
**PUT** `/api/transaksi-inventory/:id`

**Auth**: Required (ADMIN, OPERATOR)

### 5. Delete Inventory Transaction
**DELETE** `/api/transaksi-inventory/:id`

**Auth**: Required (ADMIN, OPERATOR)

---

## Quality Control API

### 1. Get Quality Checkpoints for Batch
**GET** `/api/quality/checkpoints/batch/:batchId`

**Auth**: Required

#### Response
```json
{
  "batchId": "BATCH-1704067200000-1",
  "checkpoints": [
    {
      "checkpoint_id": 1,
      "checkpoint_type": "HARVEST",
      "checkpoint_name": "Farm Quality Control",
      "checkpoint_date": "2024-01-01T00:00:00.000Z",
      "quality_score": 85.5,
      "status": "PASSED",
      "test_results": {
        "moisture_content": 12.5,
        "defect_rate": 2.1,
        "bean_size": "AA"
      },
      "recommendations": "Maintain current drying process",
      "inspector_name": "Quality Inspector"
    }
  ],
  "totalCheckpoints": 1
}
```

### 2. Create Quality Checkpoint
**POST** `/api/quality/checkpoints`

**Auth**: Required (ADMIN, OPERATOR)

#### Request Body
```json
{
  "inventory_id": 1,
  "checkpoint_type": "HARVEST|PROCESSING|STORAGE|TRANSPORT|DELIVERY",
  "checkpoint_name": "string",
  "checkpoint_date": "2024-01-01T00:00:00.000Z",
  "quality_score": 85.5,
  "status": "PASSED|FAILED|PENDING",
  "test_results": {
    "moisture_content": 12.5,
    "defect_rate": 2.1,
    "bean_size": "AA"
  },
  "defects_found": "string",
  "recommendations": "string",
  "notes": "string"
}
```

### 3. Update Quality Checkpoint
**PUT** `/api/quality/checkpoints/:id`

**Auth**: Required (ADMIN, OPERATOR)

### 4. Get Quality Summary for Cooperative
**GET** `/api/quality/summary/koperasi/:koperasiId`

**Auth**: Required

#### Query Parameters
- `startDate`: Start date filter (ISO8601)
- `endDate`: End date filter (ISO8601)

### 5. Get National Quality Trends
**GET** `/api/quality/trends/national`

**Auth**: Required (SUPER_ADMIN only)

#### Query Parameters
- `period`: Period in days (default: 30)

---

## PasarMikro Integration API

### 1. Sync Inventory to PasarMikro
**POST** `/api/pasarmikro/sync-inventory`

**Auth**: Required (ADMIN, SUPER_ADMIN)

#### Request Body
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "totalItems": 10,
  "inventory": [
    {
      "batch_id": "BATCH-1704067200000-1",
      "product_name": "Premium Arabica Green Bean",
      "product_type": "green_bean",
      "quantity_kg": 50,
      "production_date": "2024-01-01T00:00:00.000Z",
      "status": "TERSEDIA"
    }
  ]
}
```

#### Response
```json
{
  "message": "Berhasil menyinkronisasi 8 item inventaris ke PasarMikro",
  "syncId": 123,
  "itemsSynced": 8,
  "estimatedVisibility": "24 hours",
  "marketplaceFees": {
    "listing_fee": 0,
    "transaction_fee_percent": 5
  },
  "nextSyncRecommended": "2024-01-08T00:00:00.000Z"
}
```

### 2. PasarMikro Webhook Handler
**POST** `/api/pasarmikro/webhook`

**Auth**: Public webhook endpoint

#### Request Body
```json
{
  "event_type": "ORDER_CREATED|ORDER_UPDATED|ORDER_CANCELLED|PRODUCT_SOLD|INVENTORY_UPDATE",
  "cooperative_id": 1,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "data": {
    "order_id": "PM-ORDER-12345",
    "batch_id": "BATCH-1704067200000-1",
    "quantity_kg": 25,
    "price_per_kg": 45000,
    "buyer": {
      "name": "PT Coffee Roasters",
      "contact": "buyer@coffeeroasters.com"
    }
  }
}
```

### 3. Get Sync History
**GET** `/api/pasarmikro/sync-history`

**Auth**: Required

#### Query Parameters
- `limit`: Number of records (default: 10)
- `offset`: Records to skip (default: 0)

---

## Reporting API

### 1. Get National Reports
**GET** `/api/reports/national`

**Auth**: Required (ADMIN, SUPER_ADMIN)

#### Response
```json
{
  "totalHarvestPerProvince": [
    {
      "provinsi": "Jawa Barat",
      "total_panen_kg": 1500
    }
  ],
  "activeFarmersPerProvince": [
    {
      "provinsi": "Jawa Barat",
      "jumlah_petani": 25
    }
  ],
  "totalLandAreaPerProvince": [
    {
      "provinsi": "Jawa Barat",
      "total_luas_hektar": 62.5
    }
  ]
}
```

### 2. Get National Supply Projection
**GET** `/api/reports/national/supply-projection`

**Auth**: Required (SUPER_ADMIN only)

### 3. Get Cooperative List
**GET** `/api/reports/national/koperasi-list`

**Auth**: Required (SUPER_ADMIN only)

### 4. Get Cooperative Performance
**GET** `/api/reports/national/koperasi-performance/:koperasi_id`

**Auth**: Required (SUPER_ADMIN only)

### 5. Get Dashboard Statistics
**GET** `/api/reports/dashboard/:koperasi_id`

**Auth**: Required (ADMIN, SUPER_ADMIN)

#### Response
```json
{
  "nextHarvest": {
    "nama_lahan": "Kebun Arabika 1",
    "tanggal_estimasi": "2024-06-01T00:00:00.000Z",
    "jumlah_estimasi_kg": 120
  },
  "inventoryStats": {
    "totalCherry": 150,
    "totalGreenBean": 120,
    "totalStock": 270
  },
  "recentTransactions": [
    {
      "tanggal_transaksi": "2024-01-02T00:00:00.000Z",
      "nama_produk": "Green Bean Premium",
      "jenis_transaksi": "KELUAR",
      "kuantitas_kg": 50
    }
  ]
}
```

### 6. Get Productivity Report
**GET** `/api/reports/productivity/:koperasi_id`

**Auth**: Required (ADMIN, SUPER_ADMIN)

### 7. Get Traceability Data
**GET** `/api/reports/traceability/:batch_id`

**Auth**: Required (ADMIN, OPERATOR, SUPER_ADMIN)

---

## Common Error Responses

### Standard Error Response Format
```json
{
  "error": "Error message",
  "errors": [
    {
      "field": "fieldname",
      "message": "Specific field error message"
    }
  ]
}
```

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

---

## Security Considerations

### Authentication
- JWT tokens with 1-hour expiration
- Secure password hashing with bcrypt
- Role-based access control

### Input Validation
- express-validator for all inputs
- SQL injection prevention with parameterized queries
- XSS protection

### Authorization
- Role-based permissions (SUPER_ADMIN, ADMIN, OPERATOR)
- Cooperative-scoped data access
- Audit trail logging

### Data Protection
- Sensitive information encryption
- CORS configuration
- Rate limiting (recommended for production)

---

## Database Schema Overview

### Core Tables
- `users`: User accounts and authentication
- `Koperasi`: Cooperative information
- `Petani`: Farmer records
- `Lahan`: Land/farm plots
- `Aktivitas_Budidaya`: Farm activities
- `Inventory`: Inventory tracking
- `Transaksi_Inventory`: Inventory transactions
- `quality_checkpoints`: Quality control data
- `pasarmikro_*`: PasarMikro integration tables

### Relationships
- Users belong to cooperatives
- Farmers belong to cooperatives
- Land belongs to farmers and cooperatives
- Activities are performed on land
- Inventory is generated from activities
- Transactions move inventory
- Quality checkpoints track inventory quality

---

## System Integration Features

### Harvest-to-Inventory Integration
- Completed harvest activities automatically create inventory entries
- Unique batch IDs for complete traceability
- Automatic next harvest estimation generation

### Quality Control Integration
- Quality checkpoints linked to inventory batches
- Comprehensive quality reporting
- Certification-ready documentation

### PasarMikro Marketplace Integration
- Real-time inventory synchronization
- Webhook-based order processing
- Automatic transaction recording

### Estimation System
- Automatic harvest estimation based on land productivity
- Learning from actual harvest data
- Dashboard integration for planning

---

## Sample Usage Examples

### Complete User Registration Flow
```bash
# 1. Register user
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"farmer1","password":"password123","nama_lengkap":"Pak Budi","email":"budi@example.com"}'

# 2. Login
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"farmer1","password":"password123"}'

# 3. Register cooperative
curl -X POST http://localhost:3000/api/users/register-koperasi \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nama_koperasi":"Koperasi Sejahtera","alamat":"Jl. Kopi 123","provinsi":"Jawa Barat","kabupaten":"Bandung","kontak_person":"Pak Budi","nomor_telepon":"081234567890"}'
```

### Complete Farm-to-Sale Flow
```bash
# 1. Create farmer
curl -X POST http://localhost:3000/api/petani \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"koperasi_id":1,"nama":"Pak Joko","kontak":"081234567890","alamat":"Desa Kopi"}'

# 2. Create land
curl -X POST http://localhost:3000/api/lahan \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"koperasi_id":1,"petani_id":1,"nama_lahan":"Kebun Arabika 1","lokasi":"Desa Kopi","luas_hektar":2.5,"estimasi_jumlah_pohon":500,"jenis_kopi_dominan":"Arabika","status_lahan":"Produktif"}'

# 3. Record harvest
curl -X POST http://localhost:3000/api/aktivitas \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"lahan_id":1,"jenis_aktivitas":"PANEN","tanggal_aktivitas":"2024-01-01T00:00:00.000Z","jumlah_aktual_kg":95,"status":"SELESAI","keterangan":"Panen raya"}'

# 4. Create transaction
curl -X POST http://localhost:3000/api/transaksi-inventory \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"inventory_id":1,"koperasi_id":1,"tipe_transaksi":"KELUAR","jenis_operasi":"PENJUALAN","tanggal":"2024-01-02T00:00:00.000Z","jumlah":50,"buyer":"PT Kopi Nusantara","harga_total":500000}'

# 5. Generate traceability report
curl -X GET http://localhost:3000/api/inventory/traceability/report/BATCH-1704067200000-1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

**Last Updated**: 2024-01-14  
**Version**: 1.0  
**System**: Coffee Cooperative Management System MVP Phase 1
