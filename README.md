# Budgeting App

A full-stack personal finance application built with React, Vite, Express, and PostgreSQL.

## Project Structure
- `/client` - Frontend React application (Vite, TailwindCSS)
- `/server` - Backend Express application (Prisma, PostgreSQL)

## PWA & Service Worker
Aplikasi ini sudah diatur sebagai **Progressive Web App (PWA)**, yang berarti dapat di-"Add to Home Screen" dan memiliki fitur *caching* *offline* dasar.

### Cara Menjalankan Mode PWA
Mode PWA (dan *Service Worker*) biasanya tidak aktif saat menjalankan server pengembangan biasa (`npm run dev`). Untuk menguji PWA:
1. Jalankan *build* production: `npm run build` di dalam folder `client`.
2. Jalankan *preview* server: `npm run preview`.
3. Buka URL yang diberikan di Chrome, lalu cek *Chrome DevTools* > *Application* > *Manifest* & *Service Workers* untuk melihat status instalasi.
4. Atau, akses lewat HP (Android/iOS) ke alamat IP lokal komputer Anda dan uji coba menekan "Add to Home Screen" atau menggunakan *prompt* instalasi bawaan.

### Limitasi Saat Ini
1. **Push Notifications**: Belum diimplementasikan. Push notification untuk web apps, terutama di iOS (membutuhkan versi iOS 16.4+ dan aplikasi harus sudah terinstal ke *Home Screen*), cukup kompleks dan akan ditambahkan di fase masa depan.
2. **Offline Data Mode**: Aplikasi ini secara *offline* akan menampilkan UI (HTML/CSS/JS) karena sudah di-cache oleh *Service Worker*. Namun, fitur-fitur transaksi finansial yang mengambil data dari database atau merubah data akan gagal secara *offline* karena strategi untuk *path* `/api/*` diatur ke *Network Only* demi mencegah *user* melihat saldo yang belum tersinkron.

## Deployment Guide

Aplikasi ini menggunakan arsitektur berikut untuk *production*:
- **Frontend**: Vercel (React + Vite)
- **Backend**: Vercel (Node.js Serverless)
- **Database**: Neon (PostgreSQL Serverless)

> [!WARNING]
> Urutan deployment: **Neon -> Seeding -> Backend (Vercel) -> Frontend (Vercel)**.

### 1. Setup Database (Neon)
1. Buat akun dan *project* baru di [Neon.tech](https://neon.tech).
2. Setelah database dibuat, pergi ke *dashboard* utama *project* Anda.
3. Anda akan melihat bagian **Connection Details**.
4. Ambil 2 jenis *connection string*:
   - **Pooled**: Aktifkan opsi "Pooled connection" jika ada (`DATABASE_URL`).
   - **Direct**: Nonaktifkan "Pooled connection" untuk mendapatkan ini (`DIRECT_URL`).

### 2. Seeding Database (Lokal)
Karena Vercel tidak memiliki terminal untuk menjalankan skrip manual, kita harus melakukan *seeding* akun dari komputer Anda, diarahkan langsung ke Neon:
1. Buka file `.env` di folder `server/`.
2. Ubah `DATABASE_URL` sementara menjadi link **Pooled Connection** Neon Anda.
3. Buka terminal di folder `server/`, lalu jalankan:
   ```bash
   npx prisma db push
   npm run seed
   ```
4. Terminal akan menampilkan **Temporary Password** untuk kedua akun. Catat password ini.
5. (Opsional) Kembalikan isi file `.env` Anda ke database lokal jika masih ingin *development*.

### 3. Setup Backend (Vercel)
1. Buat akun di [Vercel.com](https://vercel.com) dan klik **Add New > Project**.
2. Hubungkan *repository* GitHub Anda.
3. **PENTING**: Di bagian **Root Directory**, pilih folder `server`.
4. Di bagian **Framework Preset**, pilih **Other**.
5. Buka bagian **Environment Variables** dan tambahkan:
   - `DATABASE_URL`: Isi dengan *Pooled Connection* dari Neon.
   - `DIRECT_URL`: Isi dengan *Direct Connection* dari Neon.
   - `JWT_SECRET`: Buat string acak (misalnya bisa *generate* lewat password manager).
   - `CRON_SECRET`: Buat string acak untuk mengamankan *cron job* Vercel.
   - `NODE_ENV`: `production`
   - `DISABLE_REGISTER`: `true`
   - `CLIENT_URL`: *(Biarkan kosong atau isi dengan `https://localhost` sementara)*
6. Klik **Deploy**. Tunggu sampai deploy selesai. Migrasi database (`prisma migrate deploy`) akan otomatis berjalan saat proses _build_.

### 4. Setup Frontend (Vercel)
1. Kembali ke *dashboard* Vercel, klik **Add New > Project**.
2. Pilih *repository* GitHub yang sama.
3. **PENTING**: Di bagian **Framework Preset**, pastikan terdeteksi sebagai "Vite". Di bagian **Root Directory**, pilih folder `client`.
4. Buka bagian **Environment Variables** dan tambahkan:
   - `VITE_API_URL`: Isi dengan URL domain Vercel backend Anda (contoh: `https://budgeting-backend.vercel.app/api`). **Jangan lupa tambahkan `/api` di ujungnya.**
5. Klik **Deploy**.

### 5. Langkah Terakhir (Konfigurasi CORS)
Setelah Frontend selesai di-deploy:
1. *Copy* domain Frontend Anda (contoh: `https://budgeting-frontend.vercel.app`).
2. Kembali ke *Project* **Backend** di Vercel > menu **Settings** > **Environment Variables**.
3. Perbarui variabel `CLIENT_URL` dengan domain Frontend tersebut (tanpa garis miring di belakang).
4. Vercel akan otomatis me-*redeploy* atau cukup klik **Redeploy** pada deployment terbaru agar CORS diperbarui.

**Selesai!** Aplikasi Anda kini *live* dan 100% gratis di *production*.
