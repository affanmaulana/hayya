# 9. Catatan & Disclaimer

Bab ini memuat berbagai disclaimer, batasan teknis, kebijakan keamanan, serta catatan penting terkait ruang lingkup dan operasional Aplikasi Hayya pada fase Minimum Viable Product (MVP).

## 9.1 Disclaimer Medis
1. **Bukan Pengganti Dokter:** Aplikasi Hayya dirancang murni sebagai alat bantu pemantauan (tracker) dan edukasi mandiri, **BUKAN** sebagai pengganti konsultasi, diagnosis, atau perawatan medis profesional dari dokter anak.
2. **Batasan Fitur Cek Gejala (Symptom Checker):** Fitur Cek Gejala hanya mencocokkan input pengguna dengan basis data statis (seed data) tentang gejala umum pada anak. Fitur ini tidak menggunakan kecerdasan buatan (AI) kompleks untuk mendiagnosis penyakit. Setiap hasil akan **selalu** berujung pada rekomendasi untuk segera berkonsultasi dengan fasilitas kesehatan, dokter, atau bidan terdekat.
3. **Keputusan Medis:** Segala keputusan terkait kesehatan anak, pemberian obat, atau tindakan medis harus dikonsultasikan dengan tenaga medis bersertifikat.

## 9.2 Keamanan, Privasi & Batasan Data (Local-First Architecture)
Mengingat fase MVP dibangun menggunakan arsitektur *Local-First* tanpa dukungan server *backend* maupun *database* eksternal, terdapat catatan khusus mengenai data pengguna:
1. **Penyimpanan Lokal (LocalStorage):** Seluruh data (profil anak, catatan pertumbuhan, jadwal imunisasi, dll.) disimpan sepenuhnya secara lokal di dalam peramban (browser) perangkat pengguna menggunakan `localStorage`. Tidak ada data yang dikirim, diproses, atau disimpan di *server cloud* Hayya.
2. **Risiko Kehilangan Data:** Karena data disimpan di perangkat pengguna, **data akan hilang secara permanen** jika pengguna menghapus *cache/data browser*, melakukan *factory reset* pada perangkat, atau mengakses aplikasi dari perangkat / peramban yang berbeda. Pada MVP ini, **belum tersedia fitur Cloud Backup / Sync**.
3. **Perlindungan PIN:** Akses masuk ke aplikasi dilindungi oleh PIN. Untuk keamanan dasar di level perangkat, PIN tidak disimpan dalam bentuk teks biasa (plain text), melainkan di-hash menggunakan algoritma SHA-256 (melalui `crypto.subtle`) sebelum disimpan di `localStorage`.
4. **Tidak Ada Praktik Penjualan Data:** Karena Hayya tidak memiliki akses ke data di perangkat Bunda, kami menjamin 100% bahwa data kesehatan anak tidak akan pernah dijual atau dibagikan kepada pihak ketiga.

## 9.3 Batasan Teknis Aplikasi MVP
1. **Mode Offline (Offline-First):** Karena tidak ada pemanggilan API ke luar (*fetch* eksternal dilarang), aplikasi dapat berjalan secara *offline*. 
2. **Notifikasi:** Tidak ada *Push Notification* berbasis server. Semua pengingat (jika ada) hanya mengandalkan mekanisme peringatan lokal di dalam aplikasi ketika aplikasi sedang dibuka.
3. **Data Master Terbatas (Seed Data):** Seluruh referensi data seperti milestone (0-5 tahun), jadwal vaksinasi IDAI, resep MPASI, dan artikel edukasi telah diikutsertakan (di-seed) secara statis ke dalam aplikasi. Pembaruan konten hanya bisa terjadi melalui pembaruan versi aplikasi, bukan *real-time* dari server.

## 9.4 Konten Edukasi
Seluruh data referensi dan konten edukasi awal (seed data) yang ada dalam aplikasi Hayya dikurasi dan merujuk pada standar yang diakui:
1. **Kurasi Medis:** Berpedoman pada panduan terbaru dari WHO, Kemenkes RI, dan IDAI (Ikatan Dokter Anak Indonesia).
2. **Sifat Konten:** Semua artikel, resep MPASI, dan panduan stimulasi bersifat umum dan tidak disesuaikan dengan kondisi medis spesifik tiap anak. 

---

*Dibuat oleh Tim Produk Hayya • Mei 2026*
*Dokumen ini bersifat internal dan rahasia serta tunduk pada batasan teknis arsitektur aplikasi (tanpa backend/API pihak ketiga).*
