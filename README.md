# Sistem Digitalisasi & Traceability Koperasi Kopi

## Pendahuluan

Sistem ini adalah platform digital terpusat yang dirancang untuk mendigitalisasi dan melacak seluruh siklus produksi kopi, mulai dari lahan hingga ke pembeli. Tujuannya adalah untuk menciptakan ekosistem kopi yang transparan dan efisien, memberdayakan koperasi dengan data yang akurat, meningkatkan produktivitas petani, dan membuka akses pasar yang lebih luas.

## Fitur Utama

*   **Manajemen Pengguna & Koperasi:** Mendukung multi-user dengan akses berbasis peran (Admin, Operator) dan manajemen koperasi.
*   **Manajemen Lahan & Petani:** Pencatatan detail petani dan lahan kopi, termasuk estimasi panen.
*   **Manajemen Aktivitas Budidaya (FMS):** Pencatatan aktivitas penting seperti tanam dan panen.
*   **Manajemen Inventaris (IMS):** Pelacakan sederhana barang masuk dan keluar, termasuk input pertanian dan produk kopi.
*   **Traceability Kopi:** Pelacakan batch kopi dari cherry hingga green bean, memungkinkan penelusuran asal-usul.
*   **Integrasi PasarMikro:** Sinkronisasi data inventaris dan transaksi penjualan secara real-time dengan platform PasarMikro.
*   **Pelaporan & Monitoring:** Dashboard untuk koperasi dan kementerian untuk analisis data dan prediksi pasokan.

## Tumpukan Teknologi

*   **Backend:** Node.js (Express.js)
*   **Frontend:** React (Vite) dengan `shadcn/ui` dan Tailwind CSS
*   **Database:** PostgreSQL
*   **Autentikasi:** JSON Web Tokens (JWT)

## Memulai (Getting Started)

Ada dua cara untuk menjalankan aplikasi ini:

### 1. Menggunakan DevPod (Direkomendasikan)

Jika Anda bekerja di lingkungan DevPod, PostgreSQL sudah terinstal dan berjalan secara lokal. Gunakan skrip berikut untuk menyiapkan dan menjalankan aplikasi:

1.  **Pastikan Anda berada di direktori root proyek.**
2.  **Jadikan skrip dapat dieksekusi:**
    ```bash
    chmod +x start_devpod.sh
    ```
3.  **Jalankan skrip:**
    ```bash
    ./start_devpod.sh
    ```
    Skrip ini akan menginisialisasi database, memulai server backend, dan memulai server pengembangan frontend. Tekan `Ctrl+C` untuk menghentikan kedua server.

### 2. Menggunakan Docker Compose (Lokal)

Jika Anda menjalankan proyek secara lokal tanpa DevPod, Anda dapat menggunakan Docker Compose untuk mengelola database PostgreSQL.

1.  **Pastikan Docker sudah terinstal dan berjalan di sistem Anda.**
2.  **Dari direktori root proyek:**
    *   **Mulai database PostgreSQL:**
        ```bash
        docker-compose up -d
        ```
    *   **Inisialisasi skema database:**
        ```bash
        npm run setup-db
        ```
        (Ini akan menjalankan skrip yang memastikan database diinisialisasi dengan benar).
    *   **Mulai server backend:**
        ```bash
        npm start
        ```
3.  **Dari direktori `frontend`:**
    *   **Mulai server pengembangan frontend:**
        ```bash
        npm run dev
        ```

Setelah langkah-langkah ini, buka browser Anda ke alamat yang disediakan oleh server pengembangan frontend (biasanya `http://localhost:5173`).

## Dokumentasi API

Untuk detail lengkap mengenai endpoint API backend, struktur permintaan, dan respons, silakan lihat:

*   [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

## Visi Desain

Untuk memahami gaya visual, palet warna, tipografi, dan prinsip UI/UX aplikasi, silakan lihat:

*   [GEMINI.md](GEMINI.md)

## Struktur Proyek

```
coop-coffee/
├───.devcontainer.json
├───.gitignore
├───docker-compose.yml
├───GEMINI.md
├───index.js
├───package-lock.json
├───package.json
├───PRD-Coffee-Cooperative-System.md
├───setup_db.sh
├───start_devpod.sh
├───__tests__/
├───db/
│   ├───index.js
│   └───init.sql
├───frontend/
│   ├───...
│   └───src/
│       ├───App.tsx
│       ├───index.css
│       ├───main.tsx
│       ├───components/
│       │   ├───user-registration-form.tsx
│       │   ├───user-login-form.tsx
│       │   └───ui/
│       └───lib/
│           └───axios.ts
├───middleware/
│   └───auth.js
└───routes/
    ├───aktivitas.js
    ├───inventory.js
    ├───koperasi.js
    ├───lahan.js
    ├───petani.js
    └───users.js
```
