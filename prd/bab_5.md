# 5. Panduan Desain UI/UX (Expanded for MVP)

## 5.1 Prinsip Desain & Constraint MVP
Mengingat aplikasi MVP ini berjalan **100% secara offline** menggunakan LocalStorage tanpa dukungan backend, desain UI/UX harus disesuaikan agar pengguna merasa aman dan nyaman.
- **Clarity First**: Setiap elemen harus dapat dipahami dalam 3 detik oleh pengguna baru. Mengurangi kompleksitas karena semua data disimpan di perangkat.
- **Warm & Approachable**: Hindari desain korporat dingin; gunakan warna hangat dan ilustrasi ramah agar aplikasi terasa seperti "teman" bagi ibu muda.
- **Low Cognitive Load**: Maksimal 1 aksi utama per layar, hindari teks panjang.
- **Thumb-Friendly**: Semua tombol interaktif minimal 44x44px (direkomendasikan 52px untuk tombol utama), navigasi utama berada di bawah agar mudah dijangkau dengan satu tangan (biasanya ibu memegang HP dengan satu tangan).
- **Local-First & Data Security Reassurance**: Karena data disimpan di `localStorage` (tanpa backend/cloud), UI harus secara implisit meyakinkan "Bunda" bahwa datanya aman di HP-nya. Sediakan fitur sederhana untuk mengekspor data (jika diperlukan ke depannya) atau sekadar teks penjelasan bahwa *"Data si kecil aman tersimpan di HP Bunda"*.

## 5.2 Identitas Visual (Tailwind CSS Ready)

| Peran | Warna | Kode Hex | Penggunaan / Psikologi |
|---|---|---|---|
| Primary | Rose Pink | `#C2185B` | Tombol aksi utama, tab aktif, ikon penting. Hangat, feminin, penuh percaya diri. |
| Secondary | Soft Pink | `#F06292` | Badge, highlight, background komponen sekunder, state pressed. |
| Accent | Teal | `#00897B` | Progress bar, indikator keberhasilan (sukses), grafik, checkmark. |
| Background | Off-White | `#FFF8F9` | Latar belakang aplikasi keseluruhan. Bersih, tidak melelahkan mata untuk pembacaan jangka panjang. |
| Text Utama | Charcoal | `#212121` | Teks utama, judul, dan isi konten. Kontras tinggi, sangat mudah dibaca. |
| Text Sekunder | Gray | `#616161` | Subtitle, placeholder, keterangan tambahan, dan waktu. |

**Aturan Tipografi:**
- **Heading/Judul**: Poppins atau Nunito (Semi-bold). Memberikan kesan ramah, membulat, dan modern. Ukuran 20–24sp.
- **Body/Isi Teks**: Inter atau Nunito (Reguler). Minimal 16sp untuk mobile standard agar nyaman dibaca.
- **Bentuk (Shape)**:
  - Kartu & Modals: Border radius 12–16dp.
  - Tombol Utama: Border radius `rounded-full` (pill shape, 24dp), tinggi minimal 52dp.

## 5.3 Komponen UI Utama (MVP)

**1. Bottom Navigation Bar**
- 5 menu: **Beranda | Perkembangan | MPASI | Imunisasi | Profil/Lainnya**
- Desain: Ikon outlined (24dp) dengan teks label kecil di bawahnya. Tab aktif menggunakan ikon filled berwarna primary (`#C2185B`), sisanya warna teks sekunder.
- Mengingat MVP, transisi antar tab dilakukan via React Router DOM dengan cepat karena tidak ada loading network.

**2. Kartu Dashboard (Dashboard Cards)**
- Desain: Sudut membulat (radius 16dp), bayangan (shadow) sangat tipis (`shadow-sm` di Tailwind), latar belakang putih murni di atas background off-white.
- Konten: Ikon warna-warni (misal botol susu untuk MPASI, stetoskop untuk imunisasi), judul bold, informasi singkat, dan tombol "Ubah" atau "Tambah".
- Status State: Kartu imunisasi bisa diberi latar belakang soft pink (`#F06292` transparan) atau badge merah jika ada jadwal terdekat.

**3. Tombol Aksi Utama (Call to Action)**
- Desain: Lebar penuh (full-width) pada container mobile (max-w-md), tinggi 52dp, rounded-full.
- Warna: Gradient dari pink ke rose (`bg-gradient-to-r from-pink-400 to-rose-700` atau setara `#F06292` → `#C2185B`).
- Teks: Putih, bold, ukuran 16sp.

**4. Form Input & Validasi (Offline)**
- Karena tidak ada backend, semua validasi terjadi secara instan (real-time) di sisi klien.
- Desain: Garis bawah dengan label mengambang (floating label) atau border membulat tipis.
- Error Handling: Pesan error berwarna merah muncul langsung di bawah field dengan bahasa ramah. Contoh: *"Nomor HP masih kurang tepat nih, Bunda."*
- Bantuan Input: Memanfaatkan atribut HTML5 (tipe `tel` untuk nomor, `date` untuk tanggal lahir) agar memicu keyboard yang tepat.

**5. Notifikasi & Indikator Offline (Toast & Banner)**
- Toast Notification: Muncul dari bawah atau atas, durasi 3 detik. Warna hijau (Teal) untuk sukses, kuning/merah untuk peringatan.
- Banner Penyimpanan Lokal: Banner statis atau sesekali muncul di atas Bottom Nav berbunyi: *"Data tersimpan aman di HP Bunda 📱"*. Karena aplikasi murni localStorage, ini menenangkan pengguna jika mereka kehilangan koneksi internet.

## 5.4 Tone of Voice (Gaya Bahasa)
- **Sapaan**: Selalu gunakan kata **"Bunda"**, jangan "Ibu", "Anda", atau "User". (Contoh: "Halo Bunda, selamat pagi!")
- **Pendek & Positif**: Gunakan kalimat aktif yang memotivasi. 
  - *Do*: "Yuk, cek perkembangan si kecil hari ini!"
  - *Don't*: "Anda harus mengisi log perkembangan anak Anda."
- **Bahasa Medis Awam**: Terjemahkan atau beri tooltip ringkas pada istilah medis (misal: "Stunting / Tinggi badan kurang").
- **Penggunaan Emoji**: Gunakan emoji dengan bijak (🧡, 🌟, 👶) untuk menambah kehangatan tanpa membuatnya terlihat kekanak-kanakan.
- **Validasi Emosional**: Berikan pujian saat Bunda mencatat pencapaian atau imunisasi. "Hebat! Si kecil makin pintar 🌟".

## 5.5 Struktur Layar Responsif
Aplikasi dikembangkan dengan pendekatan **Mobile-First**. Pada desktop atau layar lebar, aplikasi akan dipusatkan (centered) di tengah dengan lebar maksimal (misal `max-w-md` atau `max-w-[428px]`), menyerupai tampilan mobile untuk mempertahankan integritas desain MVP.
