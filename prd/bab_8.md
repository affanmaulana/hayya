# 8. Roadmap Pengembangan

Roadmap pengembangan Hayya disusun secara bertahap, berfokus pada pendekatan **Local-First (Offline by Default)** menggunakan `localStorage` sejak hari pertama, tanpa ketergantungan pada backend eksternal sesuai dengan batasan teknis sistem.

## 8.1 Fase Rilis & Cakupan Fitur (Scope)

### 📌 Fase 1: MVP (Minimum Viable Product) - v1.0
**Timeline:** Bulan 1–2  
**Fokus:** Fondasi aplikasi, pengelolaan data lokal, dan pemantauan esensial.
- **Setup & Arsitektur:** Inisialisasi React + Vite, React Router, Tailwind CSS, dan pembuatan skema `hayya_app_data` di `localStorage`.
- **Seed Data Awal:** Menjalankan script `seedData.js` untuk memuat milestone (0-5 tahun), jadwal vaksin IDAI, resep MPASI, dan penyakit umum.
- **Autentikasi Lokal & Profil:** Registrasi/Login dengan nomor HP dan PIN (di-hash SHA-256 via `crypto.subtle`), serta manajemen profil Anak (menggunakan `crypto.randomUUID()`).
- **Dashboard Utama:** Halaman beranda "Bunda" dengan ringkasan status anak dan navigasi bawah (BottomNav).
- **Pemantauan Inti:**
  - **Checklist Perkembangan (Milestone):** Pengecekan tumbuh kembang anak sesuai usia.
  - **Grafik Pertumbuhan Dasar:** Input berat/tinggi badan.
  - **Tracker Imunisasi:** Pencatatan jadwal dan realisasi vaksin.
- **Indikator Offline:** Banner statis yang menegaskan aplikasi berjalan secara luring.

### 📌 Fase 2: Peningkatan Fungsionalitas - v1.5
**Timeline:** Bulan 3–4  
**Fokus:** Gizi anak dan pengalaman visual.
- **Modul MPASI:** Katalog resep lokal dengan filter berdasarkan usia dan budget.
- **Generator Meal Plan Sederhana:** Menyusun jadwal makan harian/mingguan yang disimpan di `localStorage`.
- **Kalender Imunisasi Visual:** Tampilan kalender interaktif untuk jadwal vaksin.
- **Reminder & Notifikasi Lokal:** Menggunakan Web Storage / API browser standar untuk memberikan notifikasi tenggat waktu imunisasi atau milestone (bukan push notification server).

### 📌 Fase 3: Edukasi & Penanganan Pertama - v2.0
**Timeline:** Bulan 5–6  
**Fokus:** Literasi parenting mandiri.
- **Symptom Checker (Cek Gejala):** Pengecekan gejala penyakit dasar menggunakan aturan statis dari data seed.
- **Pusat Edukasi & Artikel:** Membaca artikel parenting (data embedded/lokal).
- **Simpan Artikel (Bookmark):** Menyimpan referensi ke `savedArticles`.
- **Kartu Imunisasi Digital:** Tampilan rangkuman imunisasi yang siap ditunjukkan ke fasilitas kesehatan.

### 📌 Fase 4: Ekspansi & Utilitas Tambahan - v2.5
**Timeline:** Bulan 7–8  
**Fokus:** Personalisasi dan pelaporan eksternal.
- **Export PDF Laporan:** Mengunduh laporan pertumbuhan, milestone, dan imunisasi menggunakan library client-side (seperti jsPDF).
- **Kuis Edukasi Lokal:** Gamifikasi interaktif dengan skor yang disimpan secara lokal.
- **Direktori Komunitas (Tautan Eksternal):** Menampilkan daftar link/tautan ke grup Telegram atau WhatsApp komunitas ibu (sebagai pengganti forum/Tanya Dokter yang butuh backend).
- **Multi-bahasa:** Lokalisasi antarmuka ke bahasa daerah (Jawa, Sunda) menggunakan file JSON terjemahan di klien.

---

> **Catatan Penting:** Seluruh fitur dirancang untuk berjalan **tanpa internet** setelah aplikasi dimuat (PWA/Offline First), memastikan privasi data karena tidak ada pengiriman informasi ke server eksternal.

## 8.2 KPI Keberhasilan Produk (Local-First Context)

Karena Hayya berjalan sepenuhnya di sisi klien, pengukuran Analytics memerlukan penyesuaian (misal: persetujuan pengiriman log anonim saat online, atau pengumpulan data kualitatif via survei).

| Metrik | Target 3 Bulan (MVP) | Target 6 Bulan (v2.0) |
|---|---|---|
| Pemasangan Aktif (Active Installations) | 1.000 | 5.000 |
| Retensi Pengguna (D-30) | 40% | 55% |
| Imunisasi dilengkapi via app | 60% pengguna aktif | 75% |
| Checklist milestone diisi rutin | 50% pengguna aktif | 65% |
| Rating Store (Jika di-wrap jadi APK) | >= 4.2 | >= 4.5 |
| Feedback Kualitatif | 80% merasa terbantu | 90% merasa terbantu |
