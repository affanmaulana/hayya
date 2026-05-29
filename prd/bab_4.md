# 4. Daftar Halaman Aplikasi

Aplikasi Hayya dirancang khusus sebagai aplikasi mobile-first (responsif) tanpa backend. Sesuai dengan spesifikasi MVP (Minimum Viable Product), seluruh data pengguna seperti profil, data anak, rekam medis, dan preferensi akan disimpan dan diakses secara eksklusif menggunakan **LocalStorage** di peramban (browser) gawai pengguna.

Berikut adalah daftar halaman aplikasi yang akan dikembangkan dalam fase MVP, dikategorikan berdasarkan alur pengguna yang logis dan realistis:

## 4.1. Onboarding & Autentikasi

| No. | Nama Halaman | Deskripsi & Logika (LocalStorage) |
| :--- | :--- | :--- |
| 1 | **Splash Screen** | Layar awal (logo Hayya, tagline, animasi). Secara sistem mengecek status sesi aktif pengguna. Jika ada sesi, diarahkan ke Dashboard/Setup Anak. Jika belum, ke Onboarding. |
| 2 | **Onboarding** | 3 slide introduksi fitur utama (Tumbuh Kembang, MPASI, Imunisasi). Hanya muncul jika kunci `hasSeenOnboarding` belum ada. |
| 3 | **Registrasi** | Form input Nama Lengkap, Nomor HP, dan pembuatan PIN (6-digit). Data disimpan di `users` array. PIN di-hash menggunakan Web Crypto API, bukan plain text. |
| 4 | **Login** | Form input Nomor HP dan PIN. Mencocokkan hash PIN dengan data tersimpan untuk memvalidasi akses (menyimpan UUID user ke session aktif). |
| 5 | **Setup Data Anak** | Halaman wajib pasca-registrasi. Input Nama Panggilan, Tanggal Lahir, Jenis Kelamin, dan Berat/Panjang Lahir. Menyimpan profil ke tabel `children` dan meng-generate UUID anak. |

## 4.2. Navigasi Utama (Bottom Navigation)

| No. | Nama Halaman | Deskripsi & Logika (LocalStorage) |
| :--- | :--- | :--- |
| 6 | **Dashboard (Beranda)** | Tampilan utama yang dipersonalisasi. Menampilkan sapaan ("Halo, Bunda!"), ringkasan usia presisi anak, dan kartu notifikasi/pengingat. Menarik data secara real-time dari array `children`. |
| 7 | **Perkembangan (Milestone)** | Checklist tahapan perkembangan (Motorik Kasar, Halus, Bahasa, Sosial) berdasarkan kategori umur. Status pencapaian/centang disimpan pada array `milestoneRecords`. |
| 8 | **MPASI (Rencana & Resep)** | Halaman perencana makan bayi. Memiliki filter usia dan budget. Pengguna dapat memilih dan menyimpan menu ke jadwal mingguan (tersimpan di `mpasiPlans`). |
| 9 | **Imunisasi** | Jadwal vaksinasi IDAI. Menampilkan indikator (Belum, Sudah, Terlewat). Menyimpan tanggal aktual vaksinasi dan catatan KIPI (efek samping) ke `immunizationRecords`. |
| 10 | **Lainnya / Profil Saya** | Pusat pengaturan akun. Menampilkan profil Bunda, opsi tambah anak, pengaturan bahasa, dan tombol Logout. Terdapat juga opsi "Hapus Semua Data" yang akan mengeksekusi `localStorage.clear()` (dengan peringatan ketat). |

## 4.3. Fitur Spesifik & Pendukung

| No. | Nama Halaman | Deskripsi & Logika (LocalStorage) |
| :--- | :--- | :--- |
| 11 | **Input & Grafik Pertumbuhan** | Form input pengukuran (Berat Badan, Tinggi Badan, Lingkar Kepala). Data di-push ke `growthRecords` lalu divisualisasikan dalam grafik (Line Chart) untuk melihat tren pertumbuhan. |
| 12 | **Cek Gejala (Symptom Checker)** | Alur interaktif identifikasi penyakit umum. Menampilkan grid gejala awal, diikuti pertanyaan spesifik. Menggunakan logic tree statis dari data *seed*, lalu menyimpan riwayat ke `symptomChecks`. |
| 13 | **Edukasi (Artikel & Tips)** | Daftar artikel/infografis terkurasi untuk Bunda. Konten diambil dari *seed data* internal aplikasi. Status bookmark (Simpan Artikel) disimpan pada array `savedArticles`. |

## Catatan Teknis & Batasan UI untuk MVP

1. **Thumb-friendly & Warm UI:** Semua desain merujuk ke skema warna Rose Pink (`#C2185B`) yang ramah, dengan tombol berukuran minimal 44x44px. Kosakata yang digunakan adalah nada suara positif, contohnya menggunakan kata sapaan **"Bunda"**.
2. **Kapasitas Penyimpanan:** Karena aplikasi beroperasi 100% menggunakan LocalStorage (limit ~5MB), fitur seperti "Unggah Foto Anak/Profil" akan dibatasi (misalnya menggunakan avatar statis bawaan, atau meresize Base64 secara agresif) untuk mencegah kuota browser penuh.
3. **Indikator Offline:** Terdapat komponen *Banner* kecil permanen atau dinamis di atas *Bottom Nav* yang memberitahukan: *"Mode offline - data disimpan aman di HP Bunda"*, menegaskan bahwa aplikasi tidak mengirimkan data pengguna ke server luar.
