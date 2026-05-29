# Alur Logika Fitur Edukasi & Artikel Parenting (F-11 & F-12)

Dokumen ini menjelaskan alur logika, transisi state data, skema mutasi penyimpanan LocalStorage, penanganan *edge cases*, serta ketergantungan antar-fitur untuk modul Edukasi & Artikel Parenting (F-11 dan F-12) pada aplikasi Hayya. Seluruh sistem beroperasi dalam arsitektur **Offline-First** menggunakan penyimpanan lokal browser.

---

## 1. User Action Flow

### 1.1 Menampilkan, Memfilter, dan Mencari Artikel
1. **Trigger Aksi**: Bunda mengetuk ikon tab "Edukasi" pada komponen navigasi bawah (`BottomNav.jsx`) atau kartu artikel di dashboard utama.
2. **Inisialisasi Halaman**: Aplikasi memuat seluruh master data artikel dari LocalStorage root key `"hayya_app_data"` (melalui filter array `articles` yang di-*seed* di awal).
3. **Menampilkan Kategori**: Di bagian atas halaman, aplikasi menyajikan tab filter kategori horizontal: "Semua", "Newborn" (0-12 bulan), "Toddler" (1-5 tahun), "Gizi", dan "Menyusui".
4. **Memilih Kategori**:
   - Bunda mengetuk salah satu kategori (misalnya: "Gizi").
   - UI memberikan umpan balik visual instan (tab terpilih berubah warna menjadi Rose Pink `#C2185B` dengan bentuk pill).
   - Daftar artikel menyusut secara langsung, hanya menampilkan artikel yang memiliki `category: "gizi"`.
5. **Melakukan Pencarian**:
   - Bunda mengetuk kolom input pencarian dengan teks panduan (*placeholder*) *"Cari tips parenting di sini, Bunda..."* dan mengetikkan kata kunci (misalnya: "bubur").
   - Filter dilakukan secara *real-time* saat mengetik (*onchange*).
   - Aplikasi mencocokkan kata kunci terhadap judul artikel (`title`) atau isi artikel (`contentBody`) secara tidak sensitif terhadap huruf besar/kecil (*case-insensitive*).
6. **Umpan Balik Akhir**: Daftar artikel diperbarui secara instan. Jika cocok, artikel ditampilkan dalam bentuk kartu vertikal yang mencakup visual mini (thumbnail), judul, estimasi waktu baca, dan kategori.

### 1.2 Menampilkan Rekomendasi Berdasarkan Usia Anak Aktif
1. **Trigger Aksi**: Halaman Edukasi dimuat, atau terjadi pergantian profil anak aktif dari pemilih profil anak (*child switcher*) di bagian atas aplikasi.
2. **Kalkulasi Usia**: Sistem mengambil tanggal lahir anak aktif (`dateOfBirth` dari profil anak terpilih). Aplikasi menghitung usia anak dalam satuan bulan secara presisi dengan membandingkannya terhadap tanggal hari ini.
3. **Penyaringan Relevansi**:
   - Aplikasi menyaring data master `articles` untuk mencari artikel yang memiliki rentang kesesuaian umur (`targetAgeMin` dan `targetAgeMax`) yang mencakup usia anak aktif tersebut dalam bulan.
   - Contoh: Jika usia si kecil 7 bulan, sistem akan memprioritaskan artikel dengan `targetAgeMin <= 7` dan `targetAgeMax >= 7` (misalnya: artikel tentang MPASI perdana).
4. **Umpan Balik Visual**: Aplikasi menampilkan bagian khusus di atas daftar umum berjudul *"Rekomendasi Spesial untuk [Nama Panggilan Anak]"* berupa korsel (*carousel*) horizontal berisi kartu-kartu artikel yang sangat relevan dengan usia si kecil saat ini.

### 1.3 Melihat Detail Konten Artikel
1. **Trigger Aksi**: Bunda mengetuk salah satu kartu artikel dari hasil pencarian, daftar kategori, atau baris rekomendasi usia.
2. **Navigasi Rute**: Aplikasi mengarahkan Bunda ke rute detail `/dashboard/edukasi/:articleId`.
3. **Pemuatan Konten**: Aplikasi mengekstrak `:articleId` dari parameter URL, lalu mencari objek artikel yang cocok di dalam array `articles` lokal.
4. **Rendering Detail**: Halaman menampilkan konten penuh yang ramah bacaan:
   - Header atas dengan tombol kembali ("Kembali ke Edukasi"), kategori, dan judul besar.
   - Media utama (foto thumbnail berukuran penuh atau video mockup edukasi jika tersedia).
   - Isi konten (`contentBody`) yang diformat dengan baik (didukung render teks tebal, poin-poin, dan paragraf berjarak longgar).
   - Tombol cepat untuk mem-bookmark artikel di bagian bawah atau di sudut kanan atas header.

### 1.4 Mem-bookmark (Menyimpan) dan Menghapus Bookmark Artikel
1. **Trigger Aksi**: Bunda mengetuk ikon hati / bookmark (misalnya outline berwarna Rose Pink) yang ada di sudut kanan bawah kartu artikel atau di halaman detail artikel.
2. **Validasi Aksi**: Aplikasi memeriksa apakah ID artikel tersebut sudah tercatat di dalam array `savedArticles` milik user aktif saat ini di LocalStorage.
3. **Kasus A: Artikel Belum Disimpan (Menambahkan Bookmark)**:
   - Aplikasi memicu fungsi simpan.
   - Sistem membuat objek penyimpanan baru dengan parameter unik.
   - Data baru didorong (*push*) ke dalam array `savedArticles`.
   - Ikon bookmark bertransisi instan menjadi ikon hati penuh (*filled*) berwarna Rose Pink `#C2185B` dengan animasi ketukan kecil.
   - Menampilkan notifikasi melayang singkat (*Toast notification*) di bagian bawah layar: *"Artikel berhasil disimpan ke Bookmark, Bunda! 🧡"*.
4. **Kasus B: Artikel Sudah Disimpan (Menghapus Bookmark)**:
   - Aplikasi memicu fungsi hapus.
   - Sistem mencari entri di `savedArticles` yang memiliki kecocokan kombinasi `userId` aktif dan `articleId` target, lalu menghapusnya dari array.
   - Ikon bookmark bertransisi instan kembali menjadi outline kosong.
   - Menampilkan *Toast notification* singkat: *"Artikel dihapus dari Bookmark."*.

---

## 2. Data State Flow

Semua transaksi data edukasi dikelola menggunakan *custom hook* dan *state local*. Alur perubahan state diilustrasikan di bawah ini:

### 2.1 State yang Digunakan
- `articles`: Menyimpan array seluruh data master artikel yang dimuat dari LocalStorage saat inisialisasi.
- `savedArticles`: Menyimpan array seluruh data artikel yang disimpan oleh pengguna saat ini dari LocalStorage.
- `searchQuery`: Menyimpan string kata kunci pencarian yang dimasukkan pengguna secara *real-time*.
- `selectedCategory`: Menyimpan string kategori yang sedang aktif ("semua", "newborn", "toddler", "gizi", "menyusui").
- `activeChild`: Objek data profil anak aktif yang didapatkan dari modul profil/anak global (`useChild`).

### 2.2 Alur Transisi State

#### A. Pencarian & Filter Kategori
```
[Input Karakter di Kolom Pencarian] / [Bunda Klik Kategori]
                   ↓
   [Fungsi Validasi & Sanitasi String Input (Trim & Lowercase)]
                   ↓
   [State Update: `searchQuery` / `selectedCategory` Diperbarui]
                   ↓
   [Fungsi Komputasi `filteredArticles` Berjalan Ulang]
       - Filter 1: Cek kecocokan kategori (kecuali jika "semua")
       - Filter 2: Cek apakah judul / body memuat substring `searchQuery`
                   ↓
   [Rerender UI: Tampilan Daftar Kartu Artikel Diperbarui Seketika]
```

#### B. Rekomendasi Usia Anak Aktif
```
[Pemuatan Profil Anak Aktif / Pergantian Anak Terpilih di Dashboard]
                   ↓
   [Fungsi `useEffect` Menghitung Selisih Bulan Tanggal Lahir Terhadap Tanggal Hari Ini]
                   ↓
   [State Update: Menentukan `childAgeMonths` dalam Satuan Angka]
                   ↓
   [Fungsi Komputasi Rekomendasi Berjalan Ulang]
       - Memfilter Master `articles` yang memiliki:
         `targetAgeMin` <= `childAgeMonths` DAN `targetAgeMax` >= `childAgeMonths`
                   ↓
   [State Update: Menyimpan Array Relevan ke `recommendedArticles`]
                   ↓
   [Rerender UI: Bagian "Rekomendasi Spesial" Ditampilkan di Atas Daftar Umum]
```

#### C. Detail Artikel
```
[Bunda Klik Kartu Artikel]
                   ↓
   [React Router Memicu Navigasi Ke `/dashboard/edukasi/:articleId`]
                   ↓
   [Ekstraksi Parameter `articleId` Dari URL Melalui `useParams`]
                   ↓
   [Pencarian Instan ke Array State `articles` Lokal]
                   ↓
   [State Update: `currentArticle` Menyimpan Objek Artikel yang Ditemukan]
                   ↓
   [Rerender UI: Halaman Detail Artikel Menampilkan Gambar Utama & Teks Body Lengkap]
```

#### D. Menyimpan / Menghapus Bookmark
```
[Bunda Mengetuk Tombol Ikon Bookmark / Hati]
                   ↓
   [Pengecekan State `savedArticles` yang Terhubung Ke LocalStorage]
                   ↓
   [Percabangan Kondisi Logika]:
       ├─► KONDISI 1: Belum Di-bookmark
       │     - Membuat ID unik dengan `crypto.randomUUID()`
       │     - Menyusun objek baru: { id, userId, articleId, savedAt }
       │     - Melakukan push objek baru ke array `savedArticles` di LocalStorage
       │     - State Update: Tambah record baru ke state `savedArticles` lokal
       │     - Rerender UI: Ikon Bookmark berubah menjadi berwarna penuh & Toast sukses menyala
       │
       └─► KONDISI 2: Sudah Di-bookmark
             - Mencari index data lama berdasarkan `userId` & `articleId`
             - Melakukan splice / filter array untuk menghapus data tersebut dari LocalStorage
             - State Update: Update state `savedArticles` lokal dengan array baru yang telah difilter
             - Rerender UI: Ikon Bookmark berubah menjadi outline & Toast info menyala
```

---

## 3. LocalStorage Schema Mutation

Semua data tersimpan secara terpusat pada satu root key di LocalStorage browser bernama `"hayya_app_data"`. Di bawah ini adalah struktur skema data persisten sebelum dan sesudah Bunda melakukan tindakan bookmarking pada artikel.

### 3.1 Skema JSON SEBELUM Aksi Bookmark Artikel
Bunda Sari (`id: "usr-4444"`) memiliki profil anak aktif (`id: "chd-7777"`) berusia 8 bulan. Bunda menyukai artikel tentang *"Panduan MPASI Pertama Si Kecil"* (`id: "art-001"`) namun belum menyimpannya. Array `savedArticles` masih kosong atau hanya berisi bookmark dari pengguna lain.

```json
{
  "users": [
    {
      "id": "usr-4444",
      "phone": "081234567890",
      "pinHash": "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",
      "fullName": "Bunda Sari",
      "profilePhoto": "avatar_default.png",
      "district": "Mampang Prapatan",
      "regency": "Jakarta Selatan",
      "province": "DKI Jakarta",
      "isActive": true,
      "lastLoginAt": "2026-05-29T20:10:00.000Z",
      "createdAt": "2026-05-01T10:00:00.000Z",
      "updatedAt": "2026-05-29T20:10:00.000Z"
    }
  ],
  "children": [
    {
      "id": "chd-7777",
      "userId": "usr-4444",
      "name": "Kimi",
      "dateOfBirth": "2025-09-20",
      "gender": "L",
      "birthWeightKg": 3.2,
      "birthHeightCm": 49,
      "bloodType": "O",
      "photoUrl": "",
      "isActive": true,
      "createdAt": "2025-09-21T02:00:00.000Z"
    }
  ],
  "articles": [
    {
      "id": "art-001",
      "title": "Panduan MPASI Pertama Si Kecil",
      "contentType": "article",
      "contentBody": "Pada usia 6 bulan ke atas, si kecil siap memulai petualangan rasa barunya dengan MPASI. Berikan makanan dengan tekstur bubur saring lembut...",
      "mediaUrl": "/assets/images/article-mpasi-1.png",
      "category": "gizi",
      "targetAgeMin": 6,
      "targetAgeMax": 8,
      "isPublished": true
    },
    {
      "id": "art-002",
      "title": "Menyusui Nyaman Tanpa Nyeri Lecet",
      "contentType": "article",
      "contentBody": "Masalah puting lecet umum dialami ibu baru. Pastikan pelekatan mulut bayi sudah benar dengan areola ibu masuk sepenuhnya...",
      "mediaUrl": "/assets/images/article-menyusui.png",
      "category": "menyusui",
      "targetAgeMin": 0,
      "targetAgeMax": 12,
      "isPublished": true
    }
  ],
  "savedArticles": [],
  "notifications": []
}
```

### 3.2 Skema JSON SESUDAH Aksi Bookmark Artikel
Bunda Sari mengetuk ikon hati pada artikel *"Panduan MPASI Pertama Si Kecil"*. Aplikasi melakukan mutasi skema data pada key `"hayya_app_data"` dengan menambahkan satu objek baru di dalam array `"savedArticles"`.

```json
{
  "users": [
    {
      "id": "usr-4444",
      "phone": "081234567890",
      "pinHash": "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",
      "fullName": "Bunda Sari",
      "profilePhoto": "avatar_default.png",
      "district": "Mampang Prapatan",
      "regency": "Jakarta Selatan",
      "province": "DKI Jakarta",
      "isActive": true,
      "lastLoginAt": "2026-05-29T20:10:00.000Z",
      "createdAt": "2026-05-01T10:00:00.000Z",
      "updatedAt": "2026-05-29T20:10:00.000Z"
    }
  ],
  "children": [
    {
      "id": "chd-7777",
      "userId": "usr-4444",
      "name": "Kimi",
      "dateOfBirth": "2025-09-20",
      "gender": "L",
      "birthWeightKg": 3.2,
      "birthHeightCm": 49,
      "bloodType": "O",
      "photoUrl": "",
      "isActive": true,
      "createdAt": "2025-09-21T02:00:00.000Z"
    }
  ],
  "articles": [
    {
      "id": "art-001",
      "title": "Panduan MPASI Pertama Si Kecil",
      "contentType": "article",
      "contentBody": "Pada usia 6 bulan ke atas, si kecil siap memulai petualangan rasa barunya dengan MPASI. Berikan makanan dengan tekstur bubur saring lembut...",
      "mediaUrl": "/assets/images/article-mpasi-1.png",
      "category": "gizi",
      "targetAgeMin": 6,
      "targetAgeMax": 8,
      "isPublished": true
    },
    {
      "id": "art-002",
      "title": "Menyusui Nyaman Tanpa Nyeri Lecet",
      "contentType": "article",
      "contentBody": "Masalah puting lecet umum dialami ibu baru. Pastikan pelekatan mulut bayi sudah benar dengan areola ibu masuk sepenuhnya...",
      "mediaUrl": "/assets/images/article-menyusui.png",
      "category": "menyusui",
      "targetAgeMin": 0,
      "targetAgeMax": 12,
      "isPublished": true
    }
  ],
  "savedArticles": [
    {
      "id": "7fbc6d3e-90ab-4c28-98e3-5ad6012c8b74",
      "userId": "usr-4444",
      "articleId": "art-001",
      "savedAt": "2026-05-29T20:35:41.000Z"
    }
  ],
  "notifications": []
}
```

### 3.3 Detail Analisis Operasi Mutasi Data
1. **Pembangkitan Kunci Utama (`id`)**: Nilai `"7fbc6d3e-90ab-4c28-98e3-5ad6012c8b74"` di-generate di sisi browser menggunakan fungsi bawaan standard `crypto.randomUUID()`. Ini mencegah bentrokan kunci antar catatan bookmark lokal lainnya.
2. **Keterkaitan Referensi Silang (`userId` & `articleId`)**:
   - `userId` merujuk ke data Bunda yang sedang login saat ini (`"usr-4444"`). Ini memastikan fitur bookmark mendukung integritas relasional multi-user lokal apabila kelak aplikasi digunakan bergantian oleh ibu lain pada perangkat yang sama.
   - `articleId` merujuk secara akurat ke ID unik data master artikel (`"art-001"`).
3. **Pencatatan Waktu (`savedAt`)**: Waktu penyimpanan dicatat dalam format ISO 8601 UTC string (`"2026-05-29T20:35:41.000Z"`) agar sistem dapat mengurutkan artikel tersimpan dari yang paling baru di halaman koleksi Bunda.
4. **PIN Hashing Context**: Dalam skema di atas, data pengguna `pinHash` disimpan dalam bentuk string terenkripsi SHA-256 (`8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918`), mematuhi aturan keamanan MVP untuk tidak menyimpan PIN 4 digit dalam format teks polos (*plain text*).

---

## 4. Edge Cases & Error Handling

Sebagai aplikasi yang murni beroperasi di sisi klien (klien-independen), aplikasi harus menangani kondisi anomali secara anggun dengan interaksi yang membesarkan hati Bunda.

### 4.1 Tidak Ada Anak Aktif yang Dipilih atau Terdaftar
- **Skenario**: Pengguna baru mendaftar dan masuk langsung ke halaman Edukasi, namun belum menambahkan data profil anak di bagian profil anak, atau tidak ada anak yang aktif terpilih.
- **Dampak**: Aplikasi tidak dapat menghitung rentang usia bulan untuk mencocokkan target artikel rekomendasi.
- **Penanganan Aplikasi**:
  - Bagian "Rekomendasi Spesial" tidak akan memicu pesan *crash* putih (*blank white screen*).
  - Sebagai gantinya, korsel rekomendasi menampilkan kartu placeholder ramah berwarna Soft Pink dengan teks: *"Belum ada anak aktif yang dipilih nih, Bunda. Yuk tambahkan atau pilih profil si kecil dulu untuk mendapatkan rekomendasi artikel perkembangan yang sesuai dengan usianya! 🧡"* beserta tombol pemicu navigasi bertuliskan *"Pilih/Tambah Anak"*.

### 4.2 Hasil Pencarian Artikel Kosong (Tidak Ditemukan)
- **Skenario**: Bunda mengetik kata kunci pencarian yang sangat spesifik atau tidak lazim, misalnya *"kura-kura"* atau *"helikopter"*, sehingga tidak ada artikel master yang lolos penyaringan.
- **Dampak**: Daftar artikel kosong.
- **Penanganan Aplikasi**:
  - UI menampilkan ilustrasi ramah dengan ikon pencari kosong.
  - Menampilkan teks fallback yang bersahabat: *"Aduh, artikel tentang '[Kata Kunci]' belum tersedia, Bunda. Coba gunakan kata kunci lainnya seperti 'MPASI', 'demam', atau 'gizi' ya. 🔍"*
  - Menyediakan tombol pintas *"Lihat Semua Artikel"* untuk menyetel ulang state `searchQuery` menjadi string kosong `""`.

### 4.3 Mode Offline Penuh (Ketiadaan Sinyal Internet)
- **Skenario**: Perangkat Bunda kehilangan koneksi internet (mode pesawat atau di pelosok daerah terpencil).
- **Dampak**: Tidak bisa memanggil API eksternal.
- **Penanganan Aplikasi**:
  - Karena Hayya menggunakan arsitektur **Offline-First**, data master artikel telah terpaket langsung sejak instalasi awal/seeding (`seedData.js`).
  - Aplikasi mendeteksi status melalui custom hook `useOnlineStatus`.
  - Banner informatif kecil berwarna abu-abu/pink soft menyala di atas BottomNav dengan teks yang menenangkan: *"Bunda sedang membaca dalam Mode Offline. Semua artikel tersimpan dan ilmu parenting tetap dapat diakses tanpa internet! 🍃"*.
  - Aksi menyaring, mencari, membaca detail, dan bookmarking tetap berfungsi normal 100% karena semua manipulasi data terjadi di LocalStorage.

### 4.4 Inkonsistensi Relasional (Artikel Terhapus dari Master Data)
- **Skenario**: Terjadi pembaruan seed data aplikasi di mana suatu artikel dihapus dari array `articles`, namun ID artikel tersebut sudah telanjur tersimpan di array `savedArticles` milik Bunda.
- **Dampak**: Saat membuka halaman bookmark, aplikasi akan memanggil ID yang tidak ada dan berpotensi memicu kegagalan sistem (*null pointer error*) saat mencoba membaca judul artikel.
- **Penanganan Aplikasi**:
  - Pada fungsi pengambilan data bookmark, aplikasi akan melakukan penyaringan defensif (*defensive filtering*).
  - Kode logika pemetaan bookmark akan mengabaikan entri bookmark yang tidak memiliki pasangan ID yang valid di dalam array `articles`.
  - Secara otomatis di latar belakang, data bookmark yatim-piatu (*orphan record*) tersebut dibersihkan dari LocalStorage agar menghemat kapasitas memori.

### 4.5 Limit Kapasitas Penyimpanan LocalStorage
- **Skenario**: Ruang penyimpanan lokal browser milik user mendekati batas aman 5MB karena terlalu banyak data di aplikasi lain, atau ukuran file internal menumpuk.
- **Dampak**: Operasi penyimpanan `localStorage.setItem` akan memicu eksepsi error `QuotaExceededError`.
- **Penanganan Aplikasi**:
  - Blok operasi penulisan data bookmark dibungkus dengan blok pengaman `try-catch`.
  - Jika eksepsi `QuotaExceededError` tertangkap, sistem tidak membiarkan aplikasi terhenti paksa.
  - Tampilkan dialog peringatan ramah: *"Penyimpanan browser Bunda penuh. Silakan bersihkan beberapa riwayat aplikasi untuk tetap bisa menyimpan bookmark baru ya, Bunda."*.
  - Pastikan seluruh aset gambar artikel yang dimuat menggunakan tautan aset lokal statis `/assets/images/...` bukan konversi Base64 berukuran besar di database JSON, untuk menjaga agar total ukuran database tetap di bawah 200KB.

---

## 5. Dependencies dengan Fitur Lain

Modul Edukasi & Artikel Parenting beroperasi secara harmonis dengan berkolaborasi bersama modul-modul Hayya berikut ini:

### 5.1 Ketergantungan ke Modul Autentikasi & Akun Ibu (`useAuth`)
- **Tujuan**: Untuk mengambil identitas pengguna aktif (`userId` dari `users` aktif).
- **Mekanisme**: Saat Bunda mengetuk tombol bookmark, sistem membutuhkan properti `userId` untuk diisi ke dalam objek `savedArticles`. Tanpa adanya sesi pengguna aktif, fitur bookmark akan dialihkan untuk meminta Bunda melakukan pendaftaran/login terlebih dahulu.

### 5.2 Ketergantungan ke Modul Profil Anak (`useChild`)
- **Tujuan**: Untuk mendapatkan informasi detail tanggal lahir anak (`dateOfBirth` dari `children`).
- **Mekanisme**: Halaman rekomendasi artikel membutuhkan kalkulasi usia anak saat ini dalam bulan. Modul ini berlangganan (*subscribe*) pada state anak yang sedang dipilih pada modul anak global. Setiap kali Bunda mengganti profil anak di dashboard utama, daftar artikel rekomendasi pada tab Edukasi akan langsung otomatis menyesuaikan diri ke usia anak yang baru dipilih.

### 5.3 Hubungan dengan Fitur Notifikasi Lokal (`notifications`)
- **Tujuan**: Meningkatkan keterlibatan aktif (*user engagement*) Bunda untuk membaca artikel baru.
- **Mekanisme**:
  - Ketika modul tracker perkembagan mendeteksi keterlambatan pencapaian milestone anak (anak ditandai "Belum" pada suatu aspek perkembangan), modul perkembangan dapat memicu notifikasi lokal baru ke array `notifications`.
  - Isi notifikasi tersebut akan menyertakan tautan rekomendasi artikel edukasi, misalnya: *"Si kecil belum aktif mengoceh, Bunda? Yuk baca artikel tips stimulasi bahasa ini."* dengan menyertakan referensi `referenceId` yang merujuk langsung ke ID artikel terkait.
