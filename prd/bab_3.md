# 3. Alur Pengguna (User Flow) - MVP Version

Alur pengguna di bawah ini telah disesuaikan untuk versi MVP (Minimum Viable Product) dengan pendekatan **Offline-First (LocalStorage only)** tanpa menggunakan backend, API pihak ketiga, atau sistem AI eksternal, sesuai dengan batasan sistem dan skema `hayya_app_data`.

## 3.1 Alur Onboarding (Registrasi & Setup Awal)
1. **Buka Aplikasi:** Pengguna membuka aplikasi Hayya untuk pertama kali.
2. **Splash Screen:** Tampil layar intro singkat (3 slide: "Apa itu Hayya", "Fitur Utama", "Mulai Sekarang").
3. **Pilih Opsi:** Pengguna memilih "Daftar Sekarang" atau "Masuk".
4. **Input Nomor HP (Simulasi Verifikasi):** Karena MVP berjalan 100% di sisi klien (frontend), fitur OTP lewat SMS asli ditiadakan. Pengguna memasukkan nomor HP dan sistem akan langsung mensimulasikan verifikasi berhasil (tanpa backend/API).
5. **Buat PIN:** Bunda membuat PIN 4 digit. Sistem melakukan *hashing* menggunakan fungsi kriptografi bawaan browser (`crypto.subtle`) dan hanya menyimpan string hash `pinHash` ke dalam `localStorage`. (Plain text dilarang keras).
6. **Profil Ibu:** Mengisi nama panggilan (contoh: "Bunda Rini") dan domisili.
7. **Profil Anak:** Mengisi data anak pertama (nama, tanggal lahir, jenis kelamin, berat lahir).
8. **Inisialisasi Data (Seeding):**
   - Sistem mem-parsing data anak dan menyimpannya di array `users` dan `children` di `localStorage` (root key: `hayya_app_data`).
   - Sistem otomatis melakukan *seed* data master statis jika belum ada (10 milestone dasar, 12 jadwal vaksin IDAI, 15 resep MPASI, 5 penyakit umum).
9. **Masuk Dashboard:** Pengguna diarahkan ke halaman Dashboard Utama.

## 3.2 Alur Dashboard → Cek Perkembangan (Milestone Tracker)
1. **Akses Fitur:** Dari Dashboard atau Bottom Nav, tap menu "Perkembangan".
2. **Kalkulasi Usia Otomatis:** Sistem menghitung usia anak secara matematis berdasarkan tanggal lahir anak yang aktif pada `localStorage`.
3. **Tampil Checklist:** Layar menampilkan daftar checklist milestone (motorik, sensorik, dsb) yang ditarik dari data seed, dikelompokkan secara akurat untuk rentang usia anak saat ini.
4. **Interaksi Check:** Bunda mencentang (checkbox) milestone yang sudah berhasil dikuasai anak.
5. **Simpan Otomatis (State):** Setiap perubahan checklist langsung di-update ke array `milestoneRecords` pada `localStorage` (auto-save menggunakan custom hook `useMilestones`).
6. **Ringkasan & Tips:** Di bagian atas layar, tampil progress bar atau ringkasan pencapaian (misal: "Hebat Bunda, 4 dari 5 tercapai!"). Jika ada item yang belum dicentang, sistem memunculkan kartu tips stimulasi sederhana dari data statis lokal.

## 3.3 Alur Generate Menu MPASI (Rule-Based)
1. **Akses Fitur:** Tap menu "MPASI" dari Bottom Nav.
2. **Validasi Usia:** Sistem mengecek usia anak. Jika usianya di bawah 6 bulan, munculkan kartu peringatan informatif: "Si Kecil belum waktunya MPASI, Bunda! Teruskan ASI Eksklusif ya 🧡".
3. **Input Preferensi:** Bunda memasukkan preferensi kisaran anggaran masakan (Rendah / Sedang). (Tidak ada kompleksitas filter lain untuk MVP).
4. **Generate Menu Lokal:** Saat tap "Buat Menu Minggu Ini", tidak ada pemanggilan API AI eksternal. Sistem akan memfilter 15 resep statis dari data seed berdasarkan label budget, lalu mengambil kombinasi secara terstruktur untuk menyusun menu 7 hari.
5. **Review Menu:** Menampilkan kalender menu seminggu. Bunda bisa tap salah satu hari untuk melihat bahan baku, takaran, dan cara pembuatan (modal/halaman detail).
6. **Simpan Meal Plan:** Susunan yang digenerate disimpan secara persisten di array `mpasiPlans` di `localStorage` agar tidak berubah saat Bunda membuka ulang aplikasi.

## 3.4 Alur Cek Gejala (Symptom Checker Statis)
1. **Akses Fitur:** Tap menu "Gejala" dari Bottom Nav.
2. **Disclaimer Medis:** Muncul *banner* wajib: *"Perhatian: Hayya bukan pengganti diagnosis dokter medis."*
3. **Pilih Gejala Utama:** Bunda memilih gejala utama dari grid visual (ikon + label) yang memetakan langsung ke 5 penyakit umum di seed data (misal: Demam, Diare, Batuk-Pilek, Ruam, Muntah).
4. **Pertanyaan Lanjutan (Kondisional Sederhana):** Sistem menampilkan 2 pertanyaan tambahan (checkbox/radio). Contoh, jika pilih "Demam", tampil: "Suhu > 39°C?" atau "Berlangsung lebih dari 3 hari?".
5. **Hasil Analisis (Rule-based):** Tap "Cek Sekarang". Sistem mencocokkan jawaban dengan kriteria statis di array `symptomChecks`.
6. **Saran Penanganan:** Tampil saran perawatan pertama di rumah. Jika ada pertanyaan berisiko tinggi yang dijawab "Ya" (misal demam berhari-hari), sistem men-trigger label bahaya dan menampilkan tombol darurat warna merah: **"Segera Bawa ke Dokter/Faskes Terdekat!"**.

## 3.5 Alur Imunisasi (Tracker Digital)
1. **Akses Fitur:** Tap menu "Imunisasi" di Bottom Nav.
2. **Tampil Kalender IDAI:** Sistem meload 12 data vaksin dasar dari `localStorage` dan merender *timeline* diurutkan berdasarkan bulan kelahiran (0 bln, 1 bln, 2 bln, dst).
3. **Update Vaksinasi:** Bunda memilih jenis vaksin yang statusnya "Belum".
4. **Input Detail:** Muncul *bottom sheet* (modal). Bunda memasukkan tanggal realisasi, lokasi faskes (opsional), dan catatan efek samping (opsional).
5. **Simpan & Ubah UI:** Saat disimpan, fungsi update dari `useImmunization` menulis ke `localStorage`. Kartu vaksin berubah warna (menjadi *Rose Pink*) dan status terganti menjadi centang hijau.
6. **Notifikasi In-App:** Pengingat jadwal imunisasi yang akan datang tidak menggunakan server *Push Notification*. Melainkan, muncul peringatan otomatis di area atas *Dashboard* (sebagai notifikasi lokal/in-app) saat aplikasi dibuka dan tanggal estimasi sudah dekat (misal H-3).
