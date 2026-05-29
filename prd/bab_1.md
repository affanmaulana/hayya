# 1. Ringkasan Produk

## 1.1 Latar Belakang
Indonesia masih menghadapi tantangan besar dalam angka pernikahan dini dan kehamilan remaja. Data BPS 2024 menunjukkan bahwa lebih dari 10% perempuan menikah sebelum usia 20 tahun, dengan konsentrasi tertinggi di daerah pedesaan dan kabupaten-kabupaten kecil. Ibu-ibu muda ini sering kali menghadapi kehamilan dan pengasuhan anak tanpa bekal pengetahuan yang memadai, akses ke fasilitas kesehatan yang terbatas, serta sering kali terhambat oleh masalah konektivitas internet dan literasi digital.

Hayya hadir sebagai solusi digital yang dirancang khusus untuk membantu ibu-ibu muda usia 18–25 tahun di wilayah perdesaan Indonesia. Hayya bertujuan agar mereka mendapatkan akses informasi parenting yang akurat, mudah dipahami, relevan dengan kondisi lokal, dan yang terpenting: dapat berfungsi dengan baik pada perangkat spesifikasi rendah dan tanpa memakan kuota internet berkat pendekatan *offline-first*.

## 1.2 Visi & Misi

**Visi:**
> Menjadi pendamping digital terpercaya bagi setiap ibu muda Indonesia, agar setiap anak mendapat pengasuhan yang sehat, penuh kasih, dan berbasis ilmu pengetahuan, tanpa memandang batasan infrastruktur atau literasi teknologi.

**Misi:**
- Menyederhanakan informasi parenting medis dan psikologis agar mudah diakses dan dipahami oleh ibu tanpa latar pendidikan tinggi (menggunakan sapaan ramah "Bunda", dan kalimat tidak bertele-tele).
- Membantu ibu memantau pertumbuhan (berat/tinggi badan) dan perkembangan (milestone) anak secara mandiri dengan indikator visual yang intuitif.
- Memberikan panduan nutrisi dan resep MPASI yang terjangkau, berbasis anggaran (low budget), dan sesuai bahan lokal pedesaan.
- Mendorong kepatuhan jadwal imunisasi anak melalui pengingat dan kalender terstruktur.
- Menjadi media edukasi parenting yang benar-benar ramah pengguna pedesaan dengan performa aplikasi yang ringan (berbasis web/React) dan desain visual yang menenangkan.

## 1.3 Target Pengguna

| Atribut | Detail |
|---|---|
| Usia | 18–25 tahun |
| Status | Ibu dengan anak usia 0–5 tahun |
| Lokasi | Pedesaan & kabupaten kecil di Indonesia |
| Pendidikan | SMP–SMA (sebagian besar) |
| Perangkat | Smartphone Android entry-level hingga mid-low, RAM 2–3 GB |
| Koneksi | 3G/4G intermiten, kuota internet sangat terbatas |
| Literasi Digital | Familiar media sosial (WhatsApp, TikTok), baru belajar aplikasi fungsional |
| Kondisi Psikis | Sering merasa cemas/takut salah mengasuh anak, butuh dukungan afirmatif |

## 1.4 Nilai Jual Utama (USP)
- **Berjalan Sepenuhnya Offline (LocalStorage Only):** Tidak memerlukan backend, database eksternal (seperti Firebase/Supabase), atau koneksi internet aktif. Seluruh data pengguna disimpan dengan aman secara lokal di perangkat (`localStorage`).
- **Bahasa Indonesia Sederhana & Positif:** Menggunakan teks UI yang ringkas, aktif, dan afirmatif (tone of voice yang mendukung).
- **Desain UI/UX yang Hangat & Thumb-Friendly:** Palet warna *Rose Pink* yang bersahabat, tipografi besar, dan tombol-tombol yang mudah ditekan (minimal 44x44px). Maksimal satu aksi utama per layar untuk menghindari kebingungan.
- **Panduan MPASI Praktis:** Berfokus pada bahan lokal dan anggaran terbatas.
- **Keamanan Privasi Sederhana:** Menggunakan sistem perlindungan PIN (di-hash dengan SHA-256) untuk menjaga privasi data di perangkat pengguna tanpa kerumitan sistem login online.

## 1.5 Pendekatan MVP (Minimum Viable Product)
Untuk versi rilis awal (MVP), aplikasi Hayya dikembangkan sebagai React SPA (Single Page Application) yang berjalan di peramban pengguna. Sesuai dengan spesifikasi teknis, MVP ini difokuskan pada:
- **Tanpa Backend:** Segala penyimpanan state (profil anak, catatan imunisasi, data pertumbuhan, rencana MPASI, dll.) dipersistensi hanya menggunakan format JSON di `localStorage`.
- **Data Master Tertanam (Seeding):** Data referensi seperti daftar milestone, jadwal vaksinasi standar IDAI, resep MPASI dasar, dan artikel edukasi awal ditanam langsung di kode sumber (seed data) yang diinisialisasi pada peluncuran pertama.
- **Performa Ringan:** Dibuat dengan stack modern yang teroptimasi (React, Vite, Tailwind CSS, React Router DOM), memastikan *load time* yang sangat cepat sehingga cocok dengan jaringan internet intermiten.
