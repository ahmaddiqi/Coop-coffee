-- Tabel untuk menyimpan data pengguna sistem
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nama_lengkap VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'SUPER_ADMIN')),
    koperasi_id INT REFERENCES Koperasi(koperasi_id), -- Link to primary koperasi
    is_active BOOLEAN DEFAULT true,
    created_by INT REFERENCES Users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Tabel untuk menyimpan data koperasi
CREATE TABLE Koperasi (
    koperasi_id SERIAL PRIMARY KEY,
    nama_koperasi VARCHAR(255) NOT NULL,
    alamat TEXT,
    provinsi VARCHAR(255),
    kabupaten VARCHAR(255),
    kontak_person VARCHAR(255),
    nomor_telepon VARCHAR(50),
    created_by INT REFERENCES Users(user_id)
);

-- Tabel untuk relasi antara pengguna dan koperasi
CREATE TABLE User_Koperasi (
    user_koperasi_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Users(user_id),
    koperasi_id INT REFERENCES Koperasi(koperasi_id),
    role_koperasi VARCHAR(50) NOT NULL CHECK (role_koperasi IN ('ADMIN', 'OPERATOR')),
    assigned_by INT REFERENCES Users(user_id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel untuk menyimpan undangan koperasi
CREATE TABLE invitations (
    invitation_id SERIAL PRIMARY KEY,
    invite_token VARCHAR(255) UNIQUE NOT NULL,
    koperasi_id INT REFERENCES Koperasi(koperasi_id) ON DELETE CASCADE,
    created_by INT REFERENCES Users(user_id) ON DELETE SET NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_by INT REFERENCES Users(user_id) ON DELETE SET NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel untuk menyimpan data petani
CREATE TABLE Petani (
    petani_id SERIAL PRIMARY KEY,
    koperasi_id INT REFERENCES Koperasi(koperasi_id),
    nama VARCHAR(255) NOT NULL,
    kontak VARCHAR(50),
    alamat TEXT
);

-- Tabel untuk menyimpan data lahan
CREATE TABLE Lahan (
    lahan_id SERIAL PRIMARY KEY,
    koperasi_id INT REFERENCES Koperasi(koperasi_id),
    petani_id INT REFERENCES Petani(petani_id),
    nama_lahan VARCHAR(255),
    lokasi TEXT,
    luas_hektar NUMERIC,
    estimasi_jumlah_pohon INT,
    jenis_kopi_dominan VARCHAR(255),
    status_lahan VARCHAR(50) CHECK (status_lahan IN ('Baru Ditanam', 'Produktif', 'Tidak Aktif')),
    estimasi_panen_pertama DATE
);

-- Tabel untuk aktivitas budidaya
CREATE TABLE Aktivitas_Budidaya (
    aktivitas_id SERIAL PRIMARY KEY,
    lahan_id INT REFERENCES Lahan(lahan_id),
    jenis_aktivitas VARCHAR(50) CHECK (jenis_aktivitas IN ('TANAM', 'PANEN', 'ESTIMASI_PANEN')),
    tanggal_aktivitas DATE,
    tanggal_estimasi DATE,
    jumlah_estimasi_kg NUMERIC,
    jumlah_aktual_kg NUMERIC,
    jenis_bibit VARCHAR(255),
    status VARCHAR(50) CHECK (status IN ('TERJADWAL', 'SELESAI', 'PENDING')),
    keterangan TEXT,
    created_from VARCHAR(50) CHECK (created_from IN ('MANUAL', 'AUTO_FROM_REGISTRATION')),
    created_by INT REFERENCES Users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel untuk inventory (Simple IN/OUT Tracking)
CREATE TABLE Inventory (
    inventory_id SERIAL PRIMARY KEY,
    koperasi_id INT REFERENCES Koperasi(koperasi_id),
    nama_item VARCHAR(255) NOT NULL,
    tipe_transaksi VARCHAR(50) CHECK (tipe_transaksi IN ('MASUK', 'KELUAR')),
    tanggal DATE,
    jumlah NUMERIC,
    satuan VARCHAR(50),
    batch_id VARCHAR(255),
    parent_batch_id VARCHAR(255),
    keterangan TEXT,
    referensi_pasarmikro VARCHAR(255),
    created_by INT REFERENCES Users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel untuk transaksi inventory (Unified)
CREATE TABLE Transaksi_Inventory (
    transaksi_id SERIAL PRIMARY KEY,
    inventory_id INT REFERENCES Inventory(inventory_id),
    koperasi_id INT REFERENCES Koperasi(koperasi_id),
    tipe_transaksi VARCHAR(50) CHECK (tipe_transaksi IN ('MASUK', 'KELUAR', 'PROSES', 'JUAL')),
    jenis_operasi VARCHAR(50) CHECK (jenis_operasi IN ('PEMBELIAN', 'PANEN', 'DISTRIBUSI', 'PENJUALAN', 'TRANSFORMASI')),
    tanggal DATE,
    jumlah NUMERIC,
    petani_id INT REFERENCES Petani(petani_id),
    lahan_id INT REFERENCES Lahan(lahan_id),
    buyer VARCHAR(255),
    harga_total NUMERIC,
    keterangan TEXT,
    referensi_pasarmikro VARCHAR(255)
);

-- Tabel untuk audit log
CREATE TABLE Audit_Log (
    log_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Users(user_id),
    table_name VARCHAR(255),
    record_id INT,
    action VARCHAR(50) CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(50)
);


ALTER TABLE User_Koperasi
ADD CONSTRAINT fk_user
FOREIGN KEY (user_id)
REFERENCES Users(user_id)
ON DELETE CASCADE;

ALTER TABLE User_Koperasi
ADD CONSTRAINT fk_koperasi
FOREIGN KEY (koperasi_id)
REFERENCES Koperasi(koperasi_id)
ON DELETE CASCADE;

ALTER TABLE Petani
ADD CONSTRAINT fk_koperasi
FOREIGN KEY (koperasi_id)
REFERENCES Koperasi(koperasi_id)
ON DELETE CASCADE;

ALTER TABLE Lahan
ADD CONSTRAINT fk_koperasi
FOREIGN KEY (koperasi_id)
REFERENCES Koperasi(koperasi_id)
ON DELETE CASCADE;

ALTER TABLE Lahan
ADD CONSTRAINT fk_petani
FOREIGN KEY (petani_id)
REFERENCES Petani(petani_id)
ON DELETE SET NULL;

ALTER TABLE Aktivitas_Budidaya
ADD CONSTRAINT fk_lahan
FOREIGN KEY (lahan_id)
REFERENCES Lahan(lahan_id)
ON DELETE CASCADE;

ALTER TABLE Inventory
ADD CONSTRAINT fk_koperasi
FOREIGN KEY (koperasi_id)
REFERENCES Koperasi(koperasi_id)
ON DELETE CASCADE;

ALTER TABLE Transaksi_Inventory
ADD CONSTRAINT fk_inventory
FOREIGN KEY (inventory_id)
REFERENCES Inventory(inventory_id)
ON DELETE SET NULL;

ALTER TABLE Transaksi_Inventory
ADD CONSTRAINT fk_koperasi
FOREIGN KEY (koperasi_id)
REFERENCES Koperasi(koperasi_id)
ON DELETE CASCADE;

ALTER TABLE Transaksi_Inventory
ADD CONSTRAINT fk_petani
FOREIGN KEY (petani_id)
REFERENCES Petani(petani_id)
ON DELETE SET NULL;

ALTER TABLE Transaksi_Inventory
ADD CONSTRAINT fk_lahan
FOREIGN KEY (lahan_id)
REFERENCES Lahan(lahan_id)
ON DELETE SET NULL;

ALTER TABLE Audit_Log
ADD CONSTRAINT fk_user
FOREIGN KEY (user_id)
REFERENCES Users(user_id)
ON DELETE SET NULL;

-- Foreign key constraints untuk invitations table
ALTER TABLE invitations
ADD CONSTRAINT fk_invitation_koperasi
FOREIGN KEY (koperasi_id)
REFERENCES Koperasi(koperasi_id)
ON DELETE CASCADE;

ALTER TABLE invitations
ADD CONSTRAINT fk_invitation_created_by
FOREIGN KEY (created_by)
REFERENCES Users(user_id)
ON DELETE SET NULL;

ALTER TABLE invitations
ADD CONSTRAINT fk_invitation_used_by
FOREIGN KEY (used_by)
REFERENCES Users(user_id)
ON DELETE SET NULL;

-- PasarMikro Integration Tables

-- Tabel untuk log sinkronisasi ke PasarMikro
CREATE TABLE pasarmikro_sync_log (
    sync_id SERIAL PRIMARY KEY,
    koperasi_id INT REFERENCES Koperasi(koperasi_id) ON DELETE CASCADE,
    user_id INT REFERENCES Users(user_id) ON DELETE SET NULL,
    total_items_requested INT NOT NULL,
    total_items_synced INT NOT NULL,
    sync_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    sync_status VARCHAR(50) CHECK (sync_status IN ('IN_PROGRESS', 'COMPLETED', 'FAILED')) DEFAULT 'IN_PROGRESS',
    sync_data JSONB,
    pasarmikro_response JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Tabel untuk log webhook dari PasarMikro
CREATE TABLE pasarmikro_webhook_log (
    webhook_id SERIAL PRIMARY KEY,
    cooperative_id INT REFERENCES Koperasi(koperasi_id) ON DELETE CASCADE,
    event_type VARCHAR(50) CHECK (event_type IN ('ORDER_CREATED', 'ORDER_UPDATED', 'ORDER_CANCELLED', 'PRODUCT_SOLD', 'INVENTORY_UPDATE')) NOT NULL,
    event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    webhook_data JSONB NOT NULL,
    processing_status VARCHAR(50) CHECK (processing_status IN ('PROCESSING', 'COMPLETED', 'FAILED')) DEFAULT 'PROCESSING',
    error_message TEXT,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Tabel untuk order dari PasarMikro
CREATE TABLE pasarmikro_orders (
    order_id SERIAL PRIMARY KEY,
    cooperative_id INT REFERENCES Koperasi(koperasi_id) ON DELETE CASCADE,
    pasarmikro_order_id VARCHAR(255) UNIQUE NOT NULL,
    batch_id VARCHAR(255),
    quantity_kg NUMERIC NOT NULL,
    price_per_kg NUMERIC NOT NULL,
    total_value NUMERIC GENERATED ALWAYS AS (quantity_kg * price_per_kg) STORED,
    buyer_info JSONB,
    order_status VARCHAR(50) CHECK (order_status IN ('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED')) DEFAULT 'PENDING',
    order_date TIMESTAMP WITH TIME ZONE NOT NULL,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Update Inventory table to include additional fields for PasarMikro integration
ALTER TABLE Inventory ADD COLUMN IF NOT EXISTS nama_produk VARCHAR(255);
ALTER TABLE Inventory ADD COLUMN IF NOT EXISTS tipe_produk VARCHAR(100);
ALTER TABLE Inventory ADD COLUMN IF NOT EXISTS kuantitas_kg NUMERIC;
ALTER TABLE Inventory ADD COLUMN IF NOT EXISTS tanggal_produksi DATE;
ALTER TABLE Inventory ADD COLUMN IF NOT EXISTS status_inventaris VARCHAR(50) CHECK (status_inventaris IN ('TERSEDIA', 'RESERVED', 'TERJUAL', 'DITRANSFER', 'HABIS')) DEFAULT 'TERSEDIA';

-- Update Transaksi_Inventory table for PasarMikro integration
ALTER TABLE Transaksi_Inventory ADD COLUMN IF NOT EXISTS harga_per_kg NUMERIC;
ALTER TABLE Transaksi_Inventory ADD COLUMN IF NOT EXISTS total_nilai NUMERIC;

-- Indexes for better performance
CREATE INDEX idx_pasarmikro_sync_koperasi ON pasarmikro_sync_log(koperasi_id);
CREATE INDEX idx_pasarmikro_sync_timestamp ON pasarmikro_sync_log(sync_timestamp);
CREATE INDEX idx_pasarmikro_webhook_cooperative ON pasarmikro_webhook_log(cooperative_id);
CREATE INDEX idx_pasarmikro_webhook_timestamp ON pasarmikro_webhook_log(event_timestamp);
CREATE INDEX idx_pasarmikro_orders_cooperative ON pasarmikro_orders(cooperative_id);
CREATE INDEX idx_pasarmikro_orders_batch ON pasarmikro_orders(batch_id);
CREATE INDEX idx_inventory_batch_id ON Inventory(batch_id);
CREATE INDEX idx_inventory_koperasi_status ON Inventory(koperasi_id, status_inventaris);
