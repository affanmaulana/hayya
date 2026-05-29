# 2. Fitur-Fitur Aplikasi (Expanded untuk MVP LocalStorage)

Berikut adalah rincian fitur-fitur aplikasi Hayya yang telah disesuaikan agar realistis, logis, dan dapat diimplementasikan sepenuhnya sebagai Minimum Viable Product (MVP) dengan arsitektur **Offline-First (LocalStorage only)**, tanpa menggunakan backend atau database eksternal.

## 2.1 Autentikasi & Profil Ibu

### F-01: Registrasi & Login (Offline)
- **Registrasi**: Menggunakan nomor HP. Karena ini MVP offline, proses OTP disimulasikan (misal: bebas menggunakan OTP "1234" untuk semua pendaftaran) atau langsung melangkah ke pembuatan PIN 4 digit.
- **Login**: Menggunakan nomor HP + PIN 4 digit.
- **Lupa PIN**: Simulasi reset lokal atau verifikasi OTP statis.
- **Technical Note**: Data kredensial pengguna disimpan dalam JSON di `localStorage` (key: `"hayya_app_data"` array `users`). PIN di-hash menggunakan fungsi bawaan browser (`crypto.subtle.digest` SHA-256), dilarang menyimpan PIN dalam *plain text*.
- *Catatan*: Opsi login biometrik dilewati untuk MVP agar tidak menambah kompleksitas API eksternal.

### F-02: Profil Ibu
- **Data Profil**: Menyimpan nama ibu (untuk sapaan "Bunda [Nama]") dan foto profil (menggunakan base64 ukuran kecil atau avatar *default* bawaan aplikasi).
- **Data Anak**: Menyimpan nama, tanggal lahir, jenis kelamin, berat, dan tinggi lahir. Data ini disimpan dalam array `children` di `localStorage`.
- **Dukungan Multi-Anak**: Dapat menambahkan lebih dari 1 anak. Setiap data anak digenerate dengan ID unik menggunakan `crypto.randomUUID()`.

## 2.2 Dashboard Utama

### F-03: Beranda Personalisasi
- **Sapaan Dinamis**: Berdasarkan waktu perangkat (misal: "Selamat pagi, Bunda Sari!").
- **Ringkasan Anak**: Menampilkan usia anak yang dihitung secara *real-time* dari tanggal lahir ("Bayi kamu sudah 4 bulan 12 hari").
- **Kartu Pintas**: Tombol besar yang ramah jempol (ukuran minimal 44x44px) untuk menuju menu Perkembangan, MPASI, Imunisasi, dan Gejala.
- **In-App Notification**: Karena ketiadaan *push notification* backend, pengingat imunisasi yang jatuh tempo ditampilkan sebagai *banner* atau notifikasi lokal saat aplikasi dibuka, membaca data dari array `notifications`.
- **Artikel Harian**: Menampilkan tips parenting singkat harian (data *seed* statis).

## 2.3 Checklist Perkembangan Anak (0–5 Tahun)

### F-04: Milestone Tracker
- **Data Master**: Menyediakan setidaknya 10 *milestone* awal (kategori Motorik Kasar, Halus, Bahasa, Sosial-Emosional, Kognitif) yang di-*seed* di memori klien.
- **Interaksi**: Bunda dapat memilih status "Sudah Bisa", "Belum", atau "Tandai untuk Pantau".
- **Feedback Langsung**: Jika ditandai "Belum", aplikasi langsung menampilkan teks saran stimulasi sederhana tanpa mengambil data dari server.
- **Technical Note**: Riwayat *checklist* disimpan pada array `milestoneRecords`. Seluruh operasi diakses melalui *custom hook* `useMilestones`.

### F-05: Riwayat & Laporan Perkembangan
- **Timeline Visual**: Menampilkan garis waktu sederhana perkembangan anak.
- **Export Laporan**: Laporan disediakan dalam bentuk tampilan *print-friendly* di *browser* (pengganti PDF kompleks agar lebih ringan dan efisien di MVP lokal).

## 2.4 Grafik Pertumbuhan

### F-06: Pantau Grafik Pertumbuhan
- **Input Rutin**: Input BB (Berat Badan), TB (Tinggi Badan), dan LK (Lingkar Kepala).
- **Visualisasi Grafik**: Menggunakan *library chart* sisi klien (misal Recharts/Chart.js) untuk me-render grafik berdasarkan data dari `growthRecords`.
- **Indikator Warna Sederhana**: Hijau (normal), Kuning (perhatian), Merah (periksa dokter) menggunakan logika rentang Z-score sederhana yang disematkan (hardcoded) di fungsi `growthCalculations.js`.
- **Technical Note**: Semua perhitungan pertumbuhan bersifat statis di aplikasi klien.

## 2.5 Tracker & Kalender Imunisasi

### F-07: Jadwal Imunisasi
- **Jadwal Otomatis**: Mengkalkulasi tanggal imunisasi (12 jenis vaksin utama berdasarkan IDAI) relatif terhadap tanggal lahir anak. 
- **Status Vaksin**: "Belum", "Sudah", atau "Tertunda". Tersimpan di `immunizationRecords`.
- **Notifikasi Lokal**: Mengingatkan jadwal imunisasi menggunakan *badge* UI merah muda (#C2185B) pada kartu/beranda.

## 2.6 Meal Plan MPASI

### F-08: Generator Menu MPASI
- **Katalog Resep (Seed)**: Terdapat 15 resep MPASI dengan rentang budget dan usia yang dimasukkan sebagai data *seed* di `localStorage`.
- **Generator Lokal**: Sistem secara lokal (tanpa API) menyusun rekomendasi resep 7 hari berdasarkan pencocokan logika usia anak dan budget.
- **Ganti Menu**: Fitur mengacak resep baru dari bank resep lokal yang relevan.
- **Technical Note**: Rekomendasi disimpan di `mpasiPlans`. Logika di-*handle* sepenuhnya melalui `useMpasi`.

### F-09: Panduan Tekstur & Porsi
- **Halaman Statis Edukasi**: Menyediakan infografis lokal dan teks mengenai panduan porsi serta panduan anti-GTM tanpa koneksi internet.

## 2.7 Cari Penyakit Berdasarkan Gejala

### F-10: Symptom Checker Anak (Rule-Based Lokal)
- **Logika Pohon Keputusan**: Menggunakan logika *If-Else* statis di frontend (5 penyakit umum seperti demam, diare, ruam) tanpa NLP/AI atau panggilan API medis.
- **Antarmuka Bertahap**: Formulir (wizard) ramah ibu dengan ilustrasi gejala.
- **Hasil Instan**: Mengeluarkan hasil prediksi ringan beserta peringatan (disclaimer besar berwarna mencolok).
- **Riwayat Pengecekan**: Riwayat gejala disimpan di array `symptomChecks`.

> **Catatan UX/UI:** Setiap hasil wajid dilengkapi Disclaimer Medis bahwa fitur ini bersifat panduan dan bukan pengganti fasilitas kesehatan.

## 2.8 Edukasi Parenting

### F-11: Artikel & Insights (Offline-Ready)
- **Artikel Terpaket**: Sejumlah artikel dasar sudah di-*bundle* langsung atau di-generate pada *seed data*. 
- **Simpan ke Koleksi**: Fitur *bookmark* akan memasukkan ID artikel ke dalam array `savedArticles` di LocalStorage.

### F-12: Komunitas & Tanya Dokter (MVP Mockup)
- **Penyesuaian MVP**: Mengingat sistem ini *fully offline*, fitur obrolan atau *Tanya Dokter* disederhanakan menjadi **halaman FAQ interaktif**, atau simulasi formulir "Kirim Pertanyaan" yang akan menyimpan keluhan sebagai *draft* lokal dengan notifikasi statis "Pertanyaan telah disimpan". Moderasi komunitas sungguhan dihilangkan dari lingkup MVP.

---
**Rangkuman Kesesuaian Sistem:**
Semua fitur di atas akan beroperasi secara 100% lokal. Manipulasi data dilakukan via *custom hooks* (mis: `useChild`, `useGrowth`, `useAuth`) dengan arsitektur perutean *React Router* yang terisolasi. Pewarnaan UI wajib mematuhi panduan di PRD (contoh: *Rose Pink* #C2185B sebagai *Primary*) dan tidak menyertakan konfigurasi server atau integrasi *third-party REST API*.
