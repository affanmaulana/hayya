# Alur Logika: Autentikasi & Profil (F-01 & F-02)

Dokumen ini menjelaskan alur logika tekstual untuk fitur Autentikasi dan Profil Bunda serta Manajemen Profil Anak pada Aplikasi Hayya. Seluruh penyimpanan data bersifat offline menggunakan LocalStorage dengan kunci root `"hayya_app_data"`.

---

## 1. User Action Flow

### 1.1 Registrasi Profil Bunda (Ibu)
1. **Mengakses Halaman Registrasi**: Bunda membuka aplikasi pertama kali atau menekan tautan "Daftar Baru" pada halaman login.
2. **Pengisian Form**: Bunda mengisi formulir registrasi yang terdiri dari:
   - Nomor HP (minimal 10 digit, hanya karakter angka).
   - Nama Lengkap (untuk sapaan ramah pada aplikasi).
   - PIN 4 Digit (angka rahasia untuk keamanan).
   - Konfirmasi PIN 4 Digit (wajib sama dengan PIN pertama).
3. **Validasi Input**:
   - Sistem secara real-time memastikan tidak ada kolom yang kosong.
   - Sistem memvalidasi kesamaan PIN pertama dengan PIN konfirmasi.
   - Sistem memvalidasi format nomor HP.
4. **Pengiriman Form (Submit)**: Bunda menekan tombol "Daftar Sekarang" (berukuran minimal 52px, berbentuk pill-shape yang mudah ditekan).
5. **Pengecekan Ketersediaan**: Sistem memeriksa apakah nomor HP tersebut sudah terdaftar di LocalStorage.
6. **Proses Keamanan (Hashing)**: Jika nomor HP belum terdaftar, sistem secara asinkron melakukan hash PIN menggunakan Web Crypto API (SHA-256) untuk menghasilkan `pinHash`.
7. **Penyimpanan**: Data profil Bunda disimpan di LocalStorage dengan format yang terenkripsi (untuk PIN) dan sistem menghasilkan ID unik berbasis UUID.
8. **Umpan Balik (Feedback)**: Layar menampilkan notifikasi pop-up (toast) sukses: "Pendaftaran berhasil, Bunda! Selamat datang di Hayya 🧡" dan mengarahkan Bunda langsung ke halaman Dashboard Utama dalam keadaan terautentikasi (auto-login).

### 1.2 Login Bunda
1. **Mengakses Halaman Login**: Bunda membuka aplikasi dan diarahkan ke layar Login.
2. **Pengisian Kredensial**: Bunda memasukkan Nomor HP dan PIN 4 digit yang telah didaftarkan sebelumnya.
3. **Pemicu Login**: Bunda menekan tombol "Masuk" (berukuran thumb-friendly).
4. **Validasi & Hash**:
   - Sistem memverifikasi panjang PIN harus tepat 4 digit.
   - PIN yang diinput dikonversi menjadi hash SHA-256.
5. **Verifikasi Data**:
   - Sistem membaca array `users` dari LocalStorage `"hayya_app_data"`.
   - Sistem mencari kecocokan `phone` dan membandingkan `pinHash` hasil kalkulasi dengan `pinHash` yang disimpan di LocalStorage.
6. **Pencatatan & Sesi**:
   - Jika cocok, sistem memperbarui properti `lastLoginAt` pada entitas user di LocalStorage.
   - Sesi pengguna (user ID) disimpan ke dalam state global/context aplikasi sebagai penanda aktif.
7. **Umpan Balik**: Sistem menampilkan animasi transisi sukses dan Bunda diarahkan masuk ke Dashboard Utama.
8. **Penanganan Salah**: Jika tidak cocok, sistem menampilkan pesan merah muda: "Nomor HP atau PIN salah, Bunda. Silakan periksa kembali. 🧡".

### 1.3 Mengedit Profil Bunda
1. **Mengakses Halaman Edit Profil**: Bunda pergi ke menu "Profil" melalui navigasi bawah (Bottom Navigation) lalu menekan tombol "Edit Profil".
2. **Melihat Data Sekarang**: Halaman memuat informasi Bunda saat ini: Nama Lengkap, Nomor HP (terkunci/read-only), serta domisili (Provinsi, Kabupaten/Kota, Kecamatan) dan Foto Profil jika sudah ada.
3. **Melakukan Perubahan**: Bunda dapat mengganti Nama Lengkap, mengubah Kecamatan/Kabupaten/Provinsi domisili, atau mengunggah Foto Profil baru (menggunakan picker gambar yang dikompresi menjadi teks Base64 berukuran kecil).
4. **Menyimpan Perubahan**: Bunda menekan tombol "Simpan Perubahan".
5. **Validasi & Penyimpanan**:
   - Sistem memastikan Nama Lengkap tidak kosong.
   - Sistem melakukan pembaruan (update) terhadap entitas user yang cocok di dalam array `users` pada LocalStorage, serta mengisi kolom `updatedAt` dengan waktu terkini.
6. **Umpan Balik**: Tampil toast notifikasi: "Profil Bunda berhasil diperbarui! 🧡" dan visual UI langsung mererender perubahan nama/foto Bunda.

### 1.4 Manajemen Profil Anak (Menambahkan Anak)
1. **Memicu Tambah Anak**: Dari menu Profil atau Dashboard, Bunda menekan tombol "+ Tambah Profil Anak".
2. **Mengisi Data Anak**: Bunda melengkapi formulir informasi si kecil:
   - Nama Panggilan (wajib diisi).
   - Tanggal Lahir (wajib diisi, menggunakan tanggal saat ini atau tanggal lampau).
   - Jenis Kelamin (Laki-laki atau Perempuan).
   - Berat Badan Lahir dalam Kilogram (opsional, desimal diperbolehkan).
   - Tinggi Badan Lahir dalam Sentimeter (opsional, desimal diperbolehkan).
   - Golongan Darah (opsional: A, B, AB, O, atau kosong).
   - Foto Anak (opsional, diunggah via file picker dan dikonversi ke Base64).
3. **Validasi Tanggal**: Sistem memverifikasi bahwa Tanggal Lahir tidak boleh di masa depan (lebih dari hari ini).
4. **Pemicu Simpan**: Bunda menekan tombol "Simpan Data Anak".
5. **Generasi Identitas & Status**:
   - Sistem men-generate UUID unik baru menggunakan `crypto.randomUUID()`.
   - Menambahkan field `isActive: true` sebagai penanda record aktif.
   - Menambahkan field `userId` yang merujuk pada ID Bunda yang sedang aktif login.
   - Menambahkan field `createdAt` dengan ISO 8601 string tanggal hari ini.
6. **Penyimpanan**: Entitas anak baru didorong (push) ke array `children` di dalam root LocalStorage `"hayya_app_data"`.
7. **Umpan Balik**: Menampilkan toast: "Data si kecil berhasil ditambahkan, Bunda! 🧡" dan mengarahkan kembali ke daftar anak atau dashboard dengan profil anak baru tersebut otomatis terpilih sebagai anak aktif.

### 1.5 Manajemen Profil Anak (Memperbarui Detail Anak)
1. **Memilih Anak**: Bunda memilih anak dari daftar anak di menu Profil, lalu menekan ikon pensil / tombol "Ubah Profil".
2. **Perubahan Data**: Bunda menyesuaikan informasi anak yang ingin diubah (misalnya berat lahir yang salah input atau memperbarui golongan darah).
3. **Menyimpan**: Bunda menekan "Simpan Perubahan".
4. **Validasi & Penyimpanan**:
   - Sistem memvalidasi keabsahan data anak.
   - Sistem memperbarui objek anak yang sesuai di dalam array `children` LocalStorage.
5. **Umpan Balik**: Sistem memperbarui tampilan profil anak di layar dan memunculkan toast sukses: "Data si kecil berhasil diperbarui, Bunda! 🧡".

### 1.6 Manajemen Profil Anak (Menghapus Anak / Soft Delete)
1. **Memicu Hapus**: Di halaman Edit Profil Anak, Bunda menekan tombol merah/pink: "Hapus Profil Anak".
2. **Konfirmasi Tindakan**: Aplikasi memunculkan modal dialog konfirmasi: "Apakah Bunda yakin ingin menghapus data si kecil? Seluruh data riwayat kembang dan imunisasinya akan diarsipkan dan tidak ditampilkan lagi."
3. **Konfirmasi Sukses**: Bunda menekan opsi "Ya, Hapus".
4. **Proses Soft Delete**:
   - Sistem mengubah properti `isActive` pada entitas anak tersebut menjadi `false`.
   - Data anak **TIDAK** dihapus secara fisik dari array `children` di LocalStorage guna menjaga keutuhan riwayat relasional (seperti `growthRecords` atau `milestoneRecords` lama) bila di masa mendatang ada fitur pemulihan (restore).
5. **Umpan Balik**: Aplikasi mengalihkan rute kembali ke halaman Profil utama atau Dashboard, memperbarui state anak yang aktif ke anak lain (jika ada), dan memunculkan toast: "Profil anak berhasil dihapus. 🧡".

---

## 2. Data State Flow

Operasi autentikasi dan profil di dalam React diatur menggunakan kombinasi React State (`useState`), React Context (untuk status login global), serta side-effect (`useEffect`) untuk menyinkronkan data dengan LocalStorage.

### 2.1 State Registrasi Bunda
- **State yang Digunakan**:
  - `formData`: Menyimpan input form registrasi `{ phone, fullName, pin, confirmPin }`.
  - `validationErrors`: Menyimpan pesan kesalahan per field `{ phone, fullName, pin, confirmPin }`.
  - `isSubmitting`: Boolean untuk mengontrol status loading tombol (mencegah klik ganda).
- **Alur Perubahan State (Data State Flow)**:
  `[Form Input: Bunda mengetik Nomor HP, Nama, PIN] ──> [State Update: formData terisi] ──> [Validation: Cek format HP, panjang PIN, & kecocokan PIN] ──> [State Update: validationErrors terisi jika tidak valid / tombol disabled] ──> [Submit Klik: isSubmitting di-set true] ──> [Proses Asinkron: Memanggil utilitas hashPin(pin)] ──> [Penyimpanan LocalStorage: Push data user baru] ──> [State Update: reset form & isSubmitting = false] ──> [Rerender UI: Pengalihan rute ke dashboard/dashboard-login]`

### 2.2 State Login Bunda
- **State yang Digunakan**:
  - `phone`: String nomor HP input.
  - `pin`: String PIN 4 digit input.
  - `error`: String pesan kesalahan global untuk UI.
  - `isLoading`: Boolean untuk indikator proses login.
- **Alur Perubahan State (Data State Flow)**:
  `[Form Input: Nomor HP & PIN] ──> [State Update: phone & pin] ──> [Validasi Panjang: Minimal karakter terpenuhi] ──> [Submit Klik: isLoading di-set true] ──> [Proses Asinkron: Memanggil hashPin(pin)] ──> [Pencarian LocalStorage: Filter users berdasarkan phone] ──> [Verifikasi Hash: Bandingkan pinHash input dengan pinHash di database lokal] ──> [State Update: Sesi user aktif disimpan di AuthContext & isLoading = false] ──> [Rerender UI: Navigasi otomatis ke /dashboard]`

### 2.3 State Edit Profil Bunda
- **State yang Digunakan**:
  - `profileForm`: Menyimpan objek profil Bunda `{ fullName, district, regency, province, profilePhoto }`.
  - `isSaving`: Boolean penanda proses simpan ke LocalStorage sedang berlangsung.
  - `errorMessage`: String penampung pesan kesalahan validasi/sistem.
- **Alur Perubahan State (Data State Flow)**:
  `[Form Input: Perubahan Nama, Domisili, atau Base64 Foto] ──> [State Update: profileForm] ──> [Validasi Input: Memastikan Nama diisi] ──> [Submit Klik: isSaving di-set true] ──> [Pembaruan LocalStorage: Cari user berdasarkan ID, ganti datanya, simpan kembali] ──> [State Update: Update AuthContext dengan data baru & isSaving = false] ──> [Rerender UI: Menampilkan informasi profil terbaru secara instan di layar]`

### 2.4 State Manajemen Profil Anak (Tambah/Ubah/Hapus)
- **State yang Digunakan**:
  - `childForm`: Objek data anak `{ name, dateOfBirth, gender, birthWeightKg, birthHeightCm, bloodType, photoUrl }`.
  - `error`: String penampung pesan error validasi input.
  - `isSaving`: Boolean loader tombol simpan.
- **Alur Perubahan State (Tambah Anak)**:
  `[Form Input: Data bayi/anak baru] ──> [State Update: childForm] ──> [Validasi Tanggal: Memastikan birthdate <= hari ini] ──> [Submit Klik: isSaving di-set true] ──> [Generasi UUID: crypto.randomUUID()] ──> [Penyimpanan LocalStorage: Push data ke array children] ──> [State Update: Reset form, isSaving = false, update activeChildId] ──> [Rerender UI: Navigasi ke dashboard & update sapaan anak]`
- **Alur Perubahan State (Hapus/Soft Delete Anak)**:
  `[Klik Hapus Anak] ──> [Tampil Dialog Konfirmasi] ──> [Bunda Klik Konfirmasi Hapus] ──> [Pembaruan LocalStorage: Set isActive: false untuk ID anak terkait] ──> [State Update: Filter ulang daftar anak aktif di UI (hanya yang isActive === true)] ──> [Rerender UI: Tampilan daftar anak berkurang 1, alihkan activeChildId ke anak pertama yang tersedia]`

---

## 3. LocalStorage Schema Mutation

### 3.1 Penjelasan Teknis Generator & Keamanan
- **Pembuatan ID (UUID)**:
  Sesuai standar aplikasi Hayya, pembuatan primary key unik di sisi klien memanfaatkan API bawaan peramban (browser) modern:
  `const newId = crypto.randomUUID();`
  Fungsi ini menghasilkan format RFC 4122 v4 UUID sepanjang 36 karakter (misalnya: `8e9f563d-4cba-4ef3-b418-80df2cdcf842`), yang sangat kecil kemungkinannya untuk bertabrakan (collision-free) secara lokal.
- **Proses Hashing PIN (SHA-256)**:
  Aplikasi ini dilarang keras menyimpan PIN dalam bentuk teks polos (*plain text*). Proses hashing dilakukan melalui modul `cryptoUtils.js` yang memanfaatkan algoritma SHA-256 bawaan Web Crypto API browser. 
  
  **Alur Tekstual Hashing PIN**:
  1. Input PIN dimasukkan oleh Bunda (misalnya: `"1234"`).
  2. Input string tersebut dikonversi menjadi representasi byte array (Uint8Array) menggunakan peranti `TextEncoder`.
     `"1234"` menjadi representasi byte: `[49, 50, 51, 52]` (representasi ASCII dari karakter '1', '2', '3', '4').
  3. Byte array tersebut diumpankan ke fungsi standard browser:
     `crypto.subtle.digest('SHA-256', data)`
  4. Web Crypto API menghasilkan digest berupa ArrayBuffer 32-byte (256 bit).
  5. Sistem mengubah ArrayBuffer tersebut menjadi deretan string heksadesimal 64-karakter dengan memetakan setiap byte ke format heksadesimal dua digit:
     `"03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4"`.
  6. String hash 64-karakter ini yang kemudian dicatat persisten pada properti `pinHash` di LocalStorage.

---

### 3.2 Mutasi Registrasi Bunda (F-01)

#### Keadaan Awal (Sebelum Registrasi)
Saat pertama kali aplikasi dipasang dan dibuka, Master Data (Seed Data) akan diinjeksi ke LocalStorage. Namun, data pengguna (`users`) dan anak (`children`) masih dalam keadaan kosong.

```json
{
  "users": [],
  "children": [],
  "growthRecords": [],
  "milestones": [
    {
      "id": "e2a1b9c8-d7e6-4f5a-8b9c-0d1e2f3a4b5c",
      "ageMinMonths": 0,
      "ageMaxMonths": 3,
      "category": "motorik_kasar",
      "description": "Bisa mengangkat kepala setinggi 45 derajat saat tengkurap",
      "stimulationTips": "Sering lakukan tummy time sebentar-sebentar namun sering.",
      "illustrationUrl": "/assets/milestones/motorik-kasar-1.png",
      "isCritical": true
    }
  ],
  "milestoneRecords": [],
  "vaccines": [
    {
      "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "name": "Hepatitis B 1",
      "shortName": "HepB 1",
      "description": "Mencegah infeksi virus Hepatitis B yang dapat merusak hati.",
      "recommendedAgeMonths": 0,
      "maxAgeMonths": 1,
      "doseNumber": 1,
      "parentVaccineId": null,
      "sideEffectsInfo": "Nyeri ringan di area suntikan."
    }
  ],
  "immunizationRecords": [],
  "mpasiPlans": [],
  "mpasiRecipes": [
    {
      "id": "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
      "name": "Bubur Hati Ayam Wortel",
      "ageMinMonths": 6,
      "ageMaxMonths": 8,
      "textureStage": "puree",
      "estimatedCostIdr": 15000,
      "ingredients": [
        { "name": "Beras Putih", "amount": 2, "unit": "sdm" },
        { "name": "Hati Ayam", "amount": 1, "unit": "potong" },
        { "name": "Wortel Parut", "amount": 1, "unit": "sdm" }
      ],
      "steps": [
        "Rebus beras menjadi bubur lembut.",
        "Kukus hati ayam dan wortel hingga matang.",
        "Saring semua bahan dan campurkan, atur kekentalan dengan ASI/air."
      ],
      "nutritionInfo": { "kalori": "120 kkal", "protein": "6 gr" },
      "allergens": [],
      "mealType": "breakfast",
      "photoUrl": "/assets/recipes/bubur-hati-ayam.png"
    }
  ],
  "symptomChecks": [],
  "diseases": [
    {
      "id": "d1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6g",
      "name": "Demam",
      "medicalName": "Febris",
      "description": "Kenaikan suhu tubuh anak di atas 37.5 derajat Celcius.",
      "commonSymptoms": ["Suhu badan panas", "Anak rewel", "Keringat dingin"],
      "causes": "Respon imun terhadap infeksi virus atau bakteri.",
      "homeRemedies": "Kompres air hangat di dahi dan lipatan ketiak, beri banyak cairan (ASI/air hangat).",
      "recommendedMeds": ["Paracetamol sirup"],
      "warningSigns": ["Kejang", "Suhu di atas 39 derajat Celcius", "Lemas tidak mau menyusu"],
      "urgencyDefault": "doctor"
    }
  ],
  "articles": [
    {
      "id": "f1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
      "title": "Cara Nyaman Menyusui Bayi Baru Lahir",
      "contentType": "article",
      "contentBody": "Menyusui bayi baru lahir (newborn) membutuhkan posisi pelekat yang tepat agar mulut bayi menempel sempurna...",
      "mediaUrl": "/assets/articles/menyusui-newborn.png",
      "category": "menyusui",
      "targetAgeMin": 0,
      "targetAgeMax": 1,
      "isPublished": true
    }
  ],
  "savedArticles": [],
  "notifications": []
}
```

#### Keadaan Akhir (Setelah Registrasi Bunda Sukses)
Bunda mendaftar dengan Nama: **"Bunda Sari Putri"**, Nomor HP: **"081234567890"**, PIN: **"1234"**, Domisili: **Kecamatan Batu, Kota Batu, Jawa Timur**. Sistem menghasilkan `id` baru menggunakan `crypto.randomUUID()` dan mem-push objek ke array `users`.

```json
{
  "users": [
    {
      "id": "18f972b2-cc31-419b-a01a-82881bb454e9",
      "phone": "081234567890",
      "pinHash": "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4",
      "fullName": "Bunda Sari Putri",
      "profilePhoto": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      "district": "Batu",
      "regency": "Batu",
      "province": "Jawa Timur",
      "isActive": true,
      "lastLoginAt": "2026-05-29T20:45:00.000Z",
      "createdAt": "2026-05-29T20:45:00.000Z",
      "updatedAt": "2026-05-29T20:45:00.000Z"
    }
  ],
  "children": [],
  "growthRecords": [],
  "milestones": [
    {
      "id": "e2a1b9c8-d7e6-4f5a-8b9c-0d1e2f3a4b5c",
      "ageMinMonths": 0,
      "ageMaxMonths": 3,
      "category": "motorik_kasar",
      "description": "Bisa mengangkat kepala setinggi 45 derajat saat tengkurap",
      "stimulationTips": "Sering lakukan tummy time sebentar-sebentar namun sering.",
      "illustrationUrl": "/assets/milestones/motorik-kasar-1.png",
      "isCritical": true
    }
  ],
  "milestoneRecords": [],
  "vaccines": [
    {
      "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "name": "Hepatitis B 1",
      "shortName": "HepB 1",
      "description": "Mencegah infeksi virus Hepatitis B yang dapat merusak hati.",
      "recommendedAgeMonths": 0,
      "maxAgeMonths": 1,
      "doseNumber": 1,
      "parentVaccineId": null,
      "sideEffectsInfo": "Nyeri ringan di area suntikan."
    }
  ],
  "immunizationRecords": [],
  "mpasiPlans": [],
  "mpasiRecipes": [
    {
      "id": "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
      "name": "Bubur Hati Ayam Wortel",
      "ageMinMonths": 6,
      "ageMaxMonths": 8,
      "textureStage": "puree",
      "estimatedCostIdr": 15000,
      "ingredients": [
        { "name": "Beras Putih", "amount": 2, "unit": "sdm" },
        { "name": "Hati Ayam", "amount": 1, "unit": "potong" },
        { "name": "Wortel Parut", "amount": 1, "unit": "sdm" }
      ],
      "steps": [
        "Rebus beras menjadi bubur lembut.",
        "Kukus hati ayam dan wortel hingga matang.",
        "Saring semua bahan dan campurkan, atur kekentalan dengan ASI/air."
      ],
      "nutritionInfo": { "kalori": "120 kkal", "protein": "6 gr" },
      "allergens": [],
      "mealType": "breakfast",
      "photoUrl": "/assets/recipes/bubur-hati-ayam.png"
    }
  ],
  "symptomChecks": [],
  "diseases": [
    {
      "id": "d1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6g",
      "name": "Demam",
      "medicalName": "Febris",
      "description": "Kenaikan suhu tubuh anak di atas 37.5 derajat Celcius.",
      "commonSymptoms": ["Suhu badan panas", "Anak rewel", "Keringat dingin"],
      "causes": "Respon imun terhadap infeksi virus atau bakteri.",
      "homeRemedies": "Kompres air hangat di dahi dan lipatan ketiak, beri banyak cairan (ASI/air hangat).",
      "recommendedMeds": ["Paracetamol sirup"],
      "warningSigns": ["Kejang", "Suhu di atas 39 derajat Celcius", "Lemas tidak mau menyusu"],
      "urgencyDefault": "doctor"
    }
  ],
  "articles": [
    {
      "id": "f1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
      "title": "Cara Nyaman Menyusui Bayi Baru Lahir",
      "contentType": "article",
      "contentBody": "Menyusui bayi baru lahir (newborn) membutuhkan posisi pelekat yang tepat agar mulut bayi menempel sempurna...",
      "mediaUrl": "/assets/articles/menyusui-newborn.png",
      "category": "menyusui",
      "targetAgeMin": 0,
      "targetAgeMax": 1,
      "isPublished": true
    }
  ],
  "savedArticles": [],
  "notifications": []
}
```

---

### 3.3 Mutasi Menambahkan Profil Anak (F-02)

#### Keadaan Awal (Sebelum Tambah Anak)
Array `children` masih bernilai kosong (`[]`). User aktif saat ini memiliki ID `"18f972b2-cc31-419b-a01a-82881bb454e9"`.

```json
{
  "users": [
    {
      "id": "18f972b2-cc31-419b-a01a-82881bb454e9",
      "phone": "081234567890",
      "pinHash": "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4",
      "fullName": "Bunda Sari Putri",
      "profilePhoto": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      "district": "Batu",
      "regency": "Batu",
      "province": "Jawa Timur",
      "isActive": true,
      "lastLoginAt": "2026-05-29T20:45:00.000Z",
      "createdAt": "2026-05-29T20:45:00.000Z",
      "updatedAt": "2026-05-29T20:45:00.000Z"
    }
  ],
  "children": [],
  "growthRecords": [],
  "milestones": [
    {
      "id": "e2a1b9c8-d7e6-4f5a-8b9c-0d1e2f3a4b5c",
      "ageMinMonths": 0,
      "ageMaxMonths": 3,
      "category": "motorik_kasar",
      "description": "Bisa mengangkat kepala setinggi 45 derajat saat tengkurap",
      "stimulationTips": "Sering lakukan tummy time sebentar-sebentar namun sering.",
      "illustrationUrl": "/assets/milestones/motorik-kasar-1.png",
      "isCritical": true
    }
  ],
  "milestoneRecords": [],
  "vaccines": [
    {
      "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "name": "Hepatitis B 1",
      "shortName": "HepB 1",
      "description": "Mencegah infeksi virus Hepatitis B yang dapat merusak hati.",
      "recommendedAgeMonths": 0,
      "maxAgeMonths": 1,
      "doseNumber": 1,
      "parentVaccineId": null,
      "sideEffectsInfo": "Nyeri ringan di area suntikan."
    }
  ],
  "immunizationRecords": [],
  "mpasiPlans": [],
  "mpasiRecipes": [
    {
      "id": "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
      "name": "Bubur Hati Ayam Wortel",
      "ageMinMonths": 6,
      "ageMaxMonths": 8,
      "textureStage": "puree",
      "estimatedCostIdr": 15000,
      "ingredients": [
        { "name": "Beras Putih", "amount": 2, "unit": "sdm" },
        { "name": "Hati Ayam", "amount": 1, "unit": "potong" },
        { "name": "Wortel Parut", "amount": 1, "unit": "sdm" }
      ],
      "steps": [
        "Rebus beras menjadi bubur lembut.",
        "Kukus hati ayam dan wortel hingga matang.",
        "Saring semua bahan dan campurkan, atur kekentalan dengan ASI/air."
      ],
      "nutritionInfo": { "kalori": "120 kkal", "protein": "6 gr" },
      "allergens": [],
      "mealType": "breakfast",
      "photoUrl": "/assets/recipes/bubur-hati-ayam.png"
    }
  ],
  "symptomChecks": [],
  "diseases": [
    {
      "id": "d1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6g",
      "name": "Demam",
      "medicalName": "Febris",
      "description": "Kenaikan suhu tubuh anak di atas 37.5 derajat Celcius.",
      "commonSymptoms": ["Suhu badan panas", "Anak rewel", "Keringat dingin"],
      "causes": "Respon imun terhadap infeksi virus atau bakteri.",
      "homeRemedies": "Kompres air hangat di dahi dan lipatan ketiak, beri banyak cairan (ASI/air hangat).",
      "recommendedMeds": ["Paracetamol sirup"],
      "warningSigns": ["Kejang", "Suhu di atas 39 derajat Celcius", "Lemas tidak mau menyusu"],
      "urgencyDefault": "doctor"
    }
  ],
  "articles": [
    {
      "id": "f1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
      "title": "Cara Nyaman Menyusui Bayi Baru Lahir",
      "contentType": "article",
      "contentBody": "Menyusui bayi baru lahir (newborn) membutuhkan posisi pelekat yang tepat agar mulut bayi menempel sempurna...",
      "mediaUrl": "/assets/articles/menyusui-newborn.png",
      "category": "menyusui",
      "targetAgeMin": 0,
      "targetAgeMax": 1,
      "isPublished": true
    }
  ],
  "savedArticles": [],
  "notifications": []
}
```

#### Keadaan Akhir (Setelah Tambah Anak Sukses)
Bunda mendaftarkan anak bernama **"Rayyan"**, Tanggal Lahir: **"2026-01-15"** (berusia sekitar 4 bulan pada tanggal saat ini 29 Mei 2026), Jenis Kelamin: **"L"** (Laki-laki), Berat Lahir: **3.2 kg**, Tinggi Lahir: **49 cm**, Golongan Darah: **"O"**, Foto: base64 kecil.
Sistem menambahkan relasi anak ke user id Bunda via `userId: "18f972b2-cc31-419b-a01a-82881bb454e9"` dan men-generate ID anak: `"4c6e93d1-f8ba-4d0d-b452-9b22e1ddbf85"`.

```json
{
  "users": [
    {
      "id": "18f972b2-cc31-419b-a01a-82881bb454e9",
      "phone": "081234567890",
      "pinHash": "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4",
      "fullName": "Bunda Sari Putri",
      "profilePhoto": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      "district": "Batu",
      "regency": "Batu",
      "province": "Jawa Timur",
      "isActive": true,
      "lastLoginAt": "2026-05-29T20:45:00.000Z",
      "createdAt": "2026-05-29T20:45:00.000Z",
      "updatedAt": "2026-05-29T20:45:00.000Z"
    }
  ],
  "children": [
    {
      "id": "4c6e93d1-f8ba-4d0d-b452-9b22e1ddbf85",
      "userId": "18f972b2-cc31-419b-a01a-82881bb454e9",
      "name": "Rayyan",
      "dateOfBirth": "2026-01-15",
      "gender": "L",
      "birthWeightKg": 3.2,
      "birthHeightCm": 49,
      "bloodType": "O",
      "photoUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      "isActive": true,
      "createdAt": "2026-05-29T20:50:00.000Z"
    }
  ],
  "growthRecords": [],
  "milestones": [
    {
      "id": "e2a1b9c8-d7e6-4f5a-8b9c-0d1e2f3a4b5c",
      "ageMinMonths": 0,
      "ageMaxMonths": 3,
      "category": "motorik_kasar",
      "description": "Bisa mengangkat kepala setinggi 45 derajat saat tengkurap",
      "stimulationTips": "Sering lakukan tummy time sebentar-sebentar namun sering.",
      "illustrationUrl": "/assets/milestones/motorik-kasar-1.png",
      "isCritical": true
    }
  ],
  "milestoneRecords": [],
  "vaccines": [
    {
      "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "name": "Hepatitis B 1",
      "shortName": "HepB 1",
      "description": "Mencegah infeksi virus Hepatitis B yang dapat merusak hati.",
      "recommendedAgeMonths": 0,
      "maxAgeMonths": 1,
      "doseNumber": 1,
      "parentVaccineId": null,
      "sideEffectsInfo": "Nyeri ringan di area suntikan."
    }
  ],
  "immunizationRecords": [],
  "mpasiPlans": [],
  "mpasiRecipes": [
    {
      "id": "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
      "name": "Bubur Hati Ayam Wortel",
      "ageMinMonths": 6,
      "ageMaxMonths": 8,
      "textureStage": "puree",
      "estimatedCostIdr": 15000,
      "ingredients": [
        { "name": "Beras Putih", "amount": 2, "unit": "sdm" },
        { "name": "Hati Ayam", "amount": 1, "unit": "potong" },
        { "name": "Wortel Parut", "amount": 1, "unit": "sdm" }
      ],
      "steps": [
        "Rebus beras menjadi bubur lembut.",
        "Kukus hati ayam dan wortel hingga matang.",
        "Saring semua bahan dan campurkan, atur kekentalan dengan ASI/air."
      ],
      "nutritionInfo": { "kalori": "120 kkal", "protein": "6 gr" },
      "allergens": [],
      "mealType": "breakfast",
      "photoUrl": "/assets/recipes/bubur-hati-ayam.png"
    }
  ],
  "symptomChecks": [],
  "diseases": [
    {
      "id": "d1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6g",
      "name": "Demam",
      "medicalName": "Febris",
      "description": "Kenaikan suhu tubuh anak di atas 37.5 derajat Celcius.",
      "commonSymptoms": ["Suhu badan panas", "Anak rewel", "Keringat dingin"],
      "causes": "Respon imun terhadap infeksi virus atau bakteri.",
      "homeRemedies": "Kompres air hangat di dahi dan lipatan ketiak, beri banyak cairan (ASI/air hangat).",
      "recommendedMeds": ["Paracetamol sirup"],
      "warningSigns": ["Kejang", "Suhu di atas 39 derajat Celcius", "Lemas tidak mau menyusu"],
      "urgencyDefault": "doctor"
    }
  ],
  "articles": [
    {
      "id": "f1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
      "title": "Cara Nyaman Menyusui Bayi Baru Lahir",
      "contentType": "article",
      "contentBody": "Menyusui bayi baru lahir (newborn) membutuhkan posisi pelekat yang tepat agar mulut bayi menempel sempurna...",
      "mediaUrl": "/assets/articles/menyusui-newborn.png",
      "category": "menyusui",
      "targetAgeMin": 0,
      "targetAgeMax": 1,
      "isPublished": true
    }
  ],
  "savedArticles": [],
  "notifications": []
}
```

---

## 4. Edge Cases & Error Handling

| Deskripsi Masalah (Edge Case) | Validasi & Deteksi Logika | Penanganan Aplikasi (UI & State) |
| :--- | :--- | :--- |
| **Nomor HP Sudah Terdaftar saat Registrasi** | Sistem mencocokkan `phone` input dengan properti `phone` di array `users` LocalStorage. | Pendaftaran dihentikan. Layar registrasi menampilkan pesan error yang ramah: "Nomor HP sudah terdaftar, Bunda. Silakan langsung masuk atau gunakan nomor lain. 🧡". Input tidak dihapus, Bunda dapat mengeditnya. |
| **Konfirmasi PIN Tidak Cocok** | `pin !== confirmPin` pada saat penekanan tombol submit. | Sistem memblokir eksekusi registrasi sebelum mengirim data. Menampilkan pesan di bawah kolom konfirmasi PIN: "Konfirmasi PIN tidak cocok, Bunda. Harap cek kembali. 🔑". |
| **Kredensial Login Tidak Cocok** | Nomor HP tidak ditemukan di LocalStorage ATAU hasil hash PIN input tidak sesuai dengan `pinHash` yang disimpan. | Tombol login di-reset kembali dari status loading. Sistem menampilkan pesan peringatan mencolok: "Nomor HP atau PIN salah, Bunda. Silakan coba lagi. 🧡". Kolom PIN otomatis dikosongkan. |
| **Pengisian Tanggal Lahir Anak di Masa Depan** | `new Date(dateOfBirth) > new Date()` | Form diblokir. Tanggal setelah hari ini pada kalender (date-picker) dinonaktifkan (disabled). Jika di-bypass manual, sistem menolak penyimpanan dan menampilkan error: "Tanggal lahir si kecil tidak boleh melewati hari ini, ya Bunda." |
| **Foto Terlalu Besar (Batas LocalStorage 5MB)** | Terjadi `QuotaExceededError` saat memanggil `localStorage.setItem` karena file Base64 berukuran terlalu besar. | Sistem membungkus penyimpanan dalam blok `try-catch`. Jika kuota penuh, proses simpan foto dibatalkan dan sistem mengompresi gambar lebih kecil atau memberikan pesan: "Ukuran foto terlalu besar, Bunda. Profil tetap disimpan menggunakan avatar bawaan. 📸". |
| **Pengecekan dalam Mode Offline** | Peramban kehilangan sambungan internet (`navigator.onLine === false`). | Aplikasi mendeteksi status melalui hook `useOnlineStatus`. Karena sistem bersifat offline-first dengan LocalStorage, seluruh fungsionalitas registrasi, login, dan tambah anak tetap berjalan 100% normal. Banner notifikasi kecil berwarna pastel di atas BottomNav muncul: "Mode offline aktif - Seluruh data tersimpan aman di perangkat Bunda". |

---

## 5. Dependencies dengan Fitur Lain

Fitur Autentikasi dan Profil memiliki hubungan ketergantungan yang erat (relasional) dengan modul fitur lainnya di dalam aplikasi Hayya:

1. **Dashboard Utama (F-03)**:
   - Dashboard memerlukan data anak yang aktif (diambil dari array `children` yang memiliki status `isActive: true` dan terelasi dengan `userId` Bunda saat ini).
   - Profil Bunda (`fullName`) digunakan secara dinamis untuk memicu sapaan ramah berdasarkan waktu ("Selamat pagi, Bunda Sari! 🧡").
   - Jika belum ada profil anak yang terdaftar, Dashboard secara otomatis akan mererender tampilan kosong (*empty state*) yang secara intuitif mengajak Bunda mengisi profil anak terlebih dahulu.

2. **Checklist Perkembangan / Milestone Tracker (F-04)**:
   - Membutuhkan parameter `childId` untuk menyaring dan mendaftarkan pencapaian perkembangan di `milestoneRecords`.
   - Menggunakan tanggal lahir (`dateOfBirth`) anak untuk menentukan milestone mana saja yang harus direkomendasikan dan ditampilkan sesuai kelompok umur saat ini (misalnya 0-3 bulan, 3-6 bulan).

3. **Grafik Pertumbuhan (F-06)**:
   - Membutuhkan parameter `childId` sebagai foreign key pada setiap entitas di `growthRecords` (catatan BB, TB, LK).
   - Membutuhkan `gender` anak ("L" atau "P") dan `dateOfBirth` guna melakukan perhitungan statistik kurva pertumbuhan (Z-Score) secara real-time terhadap standar WHO.

4. **Tracker & Kalender Imunisasi (F-07)**:
   - Menggunakan `dateOfBirth` dari anak terdaftar untuk menghitung jadwal jatuh tempo (due date) dari 12 vaksin IDAI secara otomatis (misal: vaksin BCG dijadwalkan pada `dateOfBirth` + 1 bulan).
   - Jika anak dihapus secara soft-delete (`isActive: false`), jadwal imunisasinya otomatis disembunyikan dari kalender pengingat global.

5. **Meal Plan MPASI (F-08)**:
   - Menghitung usia anak (dalam satuan bulan) berdasarkan `dateOfBirth` guna menentukan kesiapan makan dan fase tekstur yang direkomendasikan (`textureStage` seperti puree, bubur saring, cincang halus, dll) pada rencana mingguan MPASI.
