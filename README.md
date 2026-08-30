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
- **Backend**: Render (Node.js + Express)
- **Database**: Neon (PostgreSQL Serverless)

> [!WARNING]
> Sangat penting untuk mengikuti urutan *deploy* berikut: **Neon -> Render -> Vercel**. Tiap tahap membutuhkan informasi (URL/kredensial) dari tahap sebelumnya.

### 1. Setup Database (Neon)
1. Buat akun dan *project* baru di [Neon.tech](https://neon.tech).
2. Setelah database dibuat, pergi ke *dashboard* utama *project* Anda.
3. Anda akan melihat bagian **Connection Details**.
4. Ambil 2 jenis *connection string*:
   - **Pooled**: Digunakan untuk aplikasi utama (`DATABASE_URL`). Aktifkan opsi "Pooled connection" jika ada.
   - **Direct**: Digunakan khusus untuk migrasi Prisma (`DIRECT_URL`). Nonaktifkan "Pooled connection" untuk mendapatkan ini.
   Keduanya berformat mirip: `postgresql://user:password@endpoint...`

### 2. Setup Backend (Render)
1. Buat akun di [Render.com](https://render.com) dan pilih **New > Web Service**.
2. Hubungkan *repository* GitHub Anda.
3. **PENTING**: Di bagian **Root Directory**, ketik `server` (tanpa garis miring).
4. Atur *build & start commands*:
   - **Build Command**: `npm install && npm run build` (ini akan menjalankan `prisma generate`).
   - **Start Command**: `npm start`
5. Gulir ke bawah ke **Environment Variables** dan masukkan data berikut:
   - `DATABASE_URL`: Isi dengan *Pooled Connection* dari Neon.
   - `DIRECT_URL`: Isi dengan *Direct Connection* dari Neon.
   - `JWT_SECRET`: Buat string acak (misalnya bisa *generate* lewat password manager).
   - `NODE_ENV`: `production`
   - `DISABLE_REGISTER`: `true` (Ini sangat penting agar tidak ada orang luar yang bisa mendaftar ke aplikasi Anda).
   - `CLIENT_URL`: *(Biarkan kosong atau isi sementara dengan `https://localhost` karena kita belum mendeploy Vercel. Anda akan meng-update ini nanti!)*
6. Klik **Create Web Service**. Tunggu sampai deploy selesai.
7. **Jalankan Migrasi Database & Seeding User**:
   - Setelah *deploy* sukses, pergi ke tab **Shell** di dashboard Render Anda.
   - Ketikkan: `npm run migrate:deploy` (Ini akan membuat semua tabel di dalam database Neon Anda).
   - Setelah selesai, ketikkan: `npm run seed`
   - Terminal Render akan menampilkan **Temporary Password** untuk kedua akun Anda. Salin/catat *password* tersebut untuk login pertama kali, lalu segera ganti *password* Anda di menu **Settings**.

> [!NOTE]
> Pada versi gratis (Free Tier) Render, *server backend* akan masuk ke mode "tidur" (Sleep) setelah 15 menit tidak ada *request*. Karena itu, *request* pertama setelah aplikasi lama ditinggalkan bisa memakan waktu hingga 1 menit untuk *"spin-up"* (membangunkan) server kembali. 

### 3. Setup Frontend (Vercel)
1. Buat akun di [Vercel.com](https://vercel.com) dan klik **Add New > Project**.
2. Pilih *repository* GitHub yang sama.
3. **PENTING**: Di bagian **Framework Preset**, pastikan terdeteksi sebagai "Vite". Di bagian **Root Directory**, pilih folder `client`.
4. Buka bagian **Environment Variables** dan tambahkan:
   - `VITE_API_URL`: Isi dengan URL web service Render Anda (contoh: `https://budgeting-app-api.onrender.com/api`). **Jangan lupa tambahkan `/api` di ujungnya.**
5. Klik **Deploy**.

### 4. Langkah Terakhir (Tautkan Keduanya)
Setelah Vercel selesai men-deploy frontend Anda, Vercel akan memberi Anda domain publik (contoh: `https://budgeting-frontend.vercel.app`).
1. *Copy* domain Vercel tersebut.
2. Kembali ke *dashboard* **Render** > Web Service Anda > tab **Environment**.
3. Perbarui (atau tambahkan) variabel `CLIENT_URL` dengan domain Vercel tersebut (tanpa garis miring di belakang, contoh: `https://budgeting-frontend.vercel.app`).
4. Render akan otomatis men-*deploy* ulang agar CORS mengizinkan Vercel.

**Selesai!** Aplikasi Anda kini *live* di *production*.

### Catatan Tambahan: Migrasi Prisma di Masa Depan
Jika di kemudian hari Anda menambahkan fitur yang merubah *schema* database (file `schema.prisma`), Anda harus:
1. *Commit* dan *push* perubahan kode Anda ke GitHub.
2. Biarkan Render men-deploy kode baru.
3. Buka tab **Shell** di Render, lalu jalankan: `npm run migrate:deploy`. (Atau Anda bisa mengubah *Build command* di Render menjadi `npm install && npm run build && npm run migrate:deploy` agar otomatis berjalan tiap kali *deploy*).
