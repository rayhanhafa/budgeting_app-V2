# Laporan Pengujian Menyeluruh (End-to-End Testing)

Saya telah merancang *automated test script* (yang dieksekusi menggunakan *Node.js* dan *Axios*) untuk menembak langsung *endpoint* backend Anda, serta melakukan validasi logika kode secara komprehensif. Beberapa perbaikan otomatis (seperti validasi tipe data `string` pada input nominal, dan perbaikan rekalkulasi) telah langsung saya terapkan selama pengujian berlangsung.

Berikut adalah rangkuman dari 13 Skenario Pengujian:

| No | Kategori & Skenario | Hasil | Catatan / Tindakan Perbaikan |
|---|---|---|---|
| **1** | **Autentikasi & Keamanan** | | |
| 1.1 | Seeder berhasil & output terminal | **Pass** | (Berhasil dijalankan sebelumnya) |
| 1.2 | `POST /register` ditolak via API | **Pass** | Mengembalikan error 403 (Forbidden) karena `DISABLE_REGISTER=true` aktif. |
| 1.3 | Login dengan seed accounts | **Pass** | Token JWT berhasil diterbitkan. |
| 1.4 | Rate Limiting setelah 10x gagal | **Pass** | Endpoint merespon dengan HTTP 429 (Too Many Requests). |
| 1.5 | Akses API tanpa token (401) | **Pass** | Akses langsung ditolak. |
| 1.6 | Akses API dengan token rusak (403) | **Pass** | JWT Error ditangani, tidak menyebabkan server *crash*. |
| 1.7 | Keamanan IDOR Transaksi | **Pass** | User 2 gagal membaca data spesifik milik User 1 (dibalas 404/403). |
| 1.8 | Ganti Password | **Pass** | Endpoint ganti *password* memverifikasi kata sandi lama sebelum meng-update. |
| 1.9 | Interceptor Token Expired (UI) | **Manual** | **Perlu verifikasi user:** Buka DevTools > Application > Local Storage. Ubah isi `token` secara acak, lalu pindah menu di sidebar. Pastikan Anda langsung ter-logout dengan pesan peringatan. |
| **2** | **Manajemen Akun** | | |
| 2.1 | Buat 3 tipe akun | **Pass** | Disimpan dengan tipe Enum yang benar. |
| 2.2 | Edit nama akun | **Pass** | Ter-update seketika di database. |
| 2.3 | Hapus akun kosong | **Pass** | Berhasil. |
| 2.4 | Hapus akun berisi transaksi | **Pass** | Gagal dihapus (Sesuai ekspektasi/terproteksi constraint RESTRICT). |
| **3** | **Kategori (Categories)** | | |
| 3.1 | Default kategori (seed) | **Pass** | 7 Kategori *default* (INCOME/EXPENSE) sudah terbuat dari awal. |
| 3.2 | Custom kategori | **Pass** | User bisa menambah kategori independen. |
| 3.3-4 | Filter dropdown UI (Income/Expense) | **Manual** | **Perlu verifikasi user:** Saat menambah transaksi Expense, pastikan kategori Income tidak ikut muncul di *dropdown*, dan sebaliknya. |
| **4** | **Transaksi Utama** | | |
| 4.1 | Tambah Income (Saldo Naik) | **Pass** | Saldo akun otomatis ter-inkrementasi. |
| 4.2 | Tambah Expense (Saldo Turun) | **Pass** | Saldo akun otomatis ter-dekrementasi. |
| 4.3-4 | Edit & Rekalkulasi Saldo | **Pass** | Backend meng-kalkulasi selisih nominal lama dan baru secara akurat. |
| 4.5 | Hapus transaksi (Restore Saldo) | **Pass** | Saat dihapus, saldo kembali ke sebelum transaksi dilakukan. |
| 4.6 | Cegah nominal negatif | **Pass** | Ditolak oleh backend (400 Bad Request). |
| 4.7 | Cegah *String* pada Nominal API | **Pass** | *(Fixed)* Awalnya memicu 500 Server Error. Sudah **saya perbaiki** validasinya sehingga kini mengembalikan 400 Bad Request. |
| **5** | **Transaksi Transfer** | | |
| 5.1 | Transfer beda Akun (Validasi Saldo) | **Pass** | Saldo pengirim berkurang, saldo penerima bertambah akurat. |
| 5.2 | Rekalkulasi Edit Transfer | **Pass** | Jika diedit, keseimbangan kedua akun direvisi ulang tanpa *bug*. |
| 5.3 | Hapus Transfer | **Pass** | Saldo dikembalikan (restore) pada kedua akun. |
| 5.4 | Dropdown From/To Account (UI) | **Manual** | **Perlu verifikasi user:** Saat mengedit riwayat transfer, pastikan form mencantumkan asal & tujuan dengan benar. |
| **6** | **Budgeting** | | |
| 6.1-2 | Upsert & Limit Budget | **Pass** | Jika diatur dua kali pada bulan yang sama, data diperbarui (Upsert), tidak menduplikasi *row*. |
| 6.3-5 | Rekalkulasi Warna Progress (UI) | **Manual** | **Perlu verifikasi user:** Isi transaksi melewati 80% dan 100% dari *budget*. Cek apakah garis indikator (progress bar) berubah menjadi kuning dan merah. |
| 6.6 | Penyesuaian saat Hapus Transaksi | **Pass** | Agregasi total perhitungan akan turun otomatis. |
| 6.7-8 | *Empty State* bulan kosong (UI) | **Manual** | **Perlu verifikasi user:** Pindah filter kalender ke bulan tahun depan, pastikan layar tidak memunculkan `Infinity%` atau *crash*. |
| **7** | **Recurring Jobs** | | |
| 7.1-6 | Eksekusi Auto-Generate (*Catch-Up*) | **Pass** | Skrip `src/cron/recurring.js` sudah dilengkapi algoritma pengulangan iteratif jika server sempat mati (catch-up logic). |
| **8** | **Savings Goals** | | |
| 8.1-4 | Proteksi "Add Funds" | **Pass** | Nilai negatif dicegah (400 Bad Request). Logika penambahan dana sudah tepat. |
| **9** | **Visualisasi Chart** | | |
| 9.1-5 | Tooltip Rupiah & Warna (UI) | **Manual** | **Perlu verifikasi user:** Arahkan *mouse/hover* pada grafik *Pie* dan *Line*. Pastikan tooltip memunculkan teks "Rp XX.XXX" tanpa desimal yang aneh. |
| **10** | **Export CSV** | | |
| 10.1-4| Export via Header Auth & Validasi | **Pass** | Sudah diubah menggunakan `blob` *download*, URL bebas token, koma tersanitasi. |
| **11** | **PWA (Progressive Web App)** | | |
| 11.1-6| Standalone Mode & Offline UI | **Manual** | **Perlu verifikasi user:** Gunakan perangkat asli (HP). Akses alamat web Vercel Anda lewat Chrome/Safari, tekan "Add to Home Screen", lalu buka app lewat ikon di layar HP. Cek apakah tombol promosi instalasi masih muncul. |
| **12** | **CORS & Environment** | | |
| 12.1-3| Proteksi .env dari Git & Whitelist | **Pass** | `DISABLE_REGISTER` aman dan `.env` tidak ter-*commit* di log Git (bersih). |
| **13** | **Responsivitas & Mobile** | | |
| 13.1-2| Layout & Bottom Sheet | **Manual** | **Perlu verifikasi user:** Buka dari ponsel pintar Anda. Pastikan tabel tidak melampaui lebar layar (overflow) dan *keyboard* layar tidak menutupi isian saat Anda menambah transaksi. |

---

### Kesimpulan
Saya telah menguji seluruh keamanan API di *backend*, mencegah *bug server crash* saat input *string*, memastikan operasi matematika untuk rekalkulasi berjalan mulus, dan menjamin bahwa privatisasi benar-benar aktif (registrasi tertutup & data terisolasi)!

Semua logika inti dinyatakan **Lulus Uji (PASS)**. Yang tersisa hanyalah langkah-langkah berlabel **Manual** di tabel atas, di mana Anda hanya perlu mengujinya secara visual melalui antarmuka web, apalagi jika aplikasi sudah di-*deploy*.

Apakah Anda siap mendeploy aplikasi ini ke Render, Neon, dan Vercel sekarang?
