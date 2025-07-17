-- Drop all tables first
DROP TABLE IF EXISTS pasarmikro_orders CASCADE;
DROP TABLE IF EXISTS pasarmikro_webhook_log CASCADE;
DROP TABLE IF EXISTS pasarmikro_sync_log CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS Audit_Log CASCADE;
DROP TABLE IF EXISTS Transaksi_Inventory CASCADE;
DROP TABLE IF EXISTS Inventory CASCADE;
DROP TABLE IF EXISTS Aktivitas_Budidaya CASCADE;
DROP TABLE IF EXISTS Lahan CASCADE;
DROP TABLE IF EXISTS Petani CASCADE;
DROP TABLE IF EXISTS User_Koperasi CASCADE;
DROP TABLE IF EXISTS Koperasi CASCADE;
DROP TABLE IF EXISTS Users CASCADE;

-- Create tables in correct order (parent tables first)

-- Tabel untuk menyimpan data pengguna sistem
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nama_lengkap VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'SUPER_ADMIN', 'OPERATOR')),
    koperasi_id INT, -- Will add FK later
    is_active BOOLEAN DEFAULT true,
    created_by INT, -- Will add FK later
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
    created_by INT -- Will add FK later
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
    created_from VARCHAR(50) CHECK (created_from IN ('MANUAL', 'AUTO_FROM_REGISTRATION', 'SYSTEM')),
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
    nama_produk VARCHAR(255),
    tipe_produk VARCHAR(100),
    kuantitas_kg NUMERIC,
    tanggal_produksi DATE,
    status_inventaris VARCHAR(50) CHECK (status_inventaris IN ('TERSEDIA', 'RESERVED', 'TERJUAL', 'DITRANSFER', 'HABIS')) DEFAULT 'TERSEDIA',
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
    harga_per_kg NUMERIC,
    total_nilai NUMERIC,
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

-- Add missing foreign key constraints to Users and Koperasi
ALTER TABLE Users ADD CONSTRAINT fk_users_koperasi FOREIGN KEY (koperasi_id) REFERENCES Koperasi(koperasi_id);
ALTER TABLE Users ADD CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES Users(user_id);
ALTER TABLE Koperasi ADD CONSTRAINT fk_koperasi_created_by FOREIGN KEY (created_by) REFERENCES Users(user_id);

-- Create indexes for better performance
CREATE INDEX idx_users_username ON Users(username);
CREATE INDEX idx_users_email ON Users(email);
CREATE INDEX idx_users_koperasi ON Users(koperasi_id);
CREATE INDEX idx_koperasi_nama ON Koperasi(nama_koperasi);
CREATE INDEX idx_invitations_token ON invitations(invite_token);
CREATE INDEX idx_invitations_expires ON invitations(expires_at);
CREATE INDEX idx_inventory_batch_id ON Inventory(batch_id);
CREATE INDEX idx_inventory_koperasi_status ON Inventory(koperasi_id, status_inventaris);