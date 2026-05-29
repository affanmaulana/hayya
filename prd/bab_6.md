# 6. Struktur Data & Storage (MVP)

## 6.1 Gambaran Arsitektur Penyimpanan

Sesuai dengan spesifikasi MVP (Minimum Viable Product) Aplikasi Hayya, aplikasi ini **TIDAK MENGGUNAKAN** database eksternal seperti PostgreSQL, MySQL, Firebase, atau Supabase.

Seluruh data pengguna, catatan perkembangan anak, dan master data (seed data) disimpan secara lokal di perangkat pengguna menggunakan **LocalStorage** browser. Hal ini memastikan aplikasi tetap berfungsi dalam mode offline (Offline First) serta mempercepat proses pengembangan MVP.

- **Root Key LocalStorage:** `"hayya_app_data"`
- **Format:** JSON (JavaScript Object Notation)
- **ID Generator:** Menggunakan fungsi bawaan browser `crypto.randomUUID()`
- **Keamanan:** Data sensitif seperti PIN di-hash menggunakan SHA-256 (via Web Crypto API). Data lain disimpan dalam format plaintext JSON.

Di bawah ini adalah rincian skema objek JSON yang disimpan dalam root key `"hayya_app_data"`.

---

## 6.2 Skema Root JSON (`hayya_app_data`)

```json
{
  "users": [],
  "children": [],
  "growthRecords": [],
  "milestones": [],
  "milestoneRecords": [],
  "vaccines": [],
  "immunizationRecords": [],
  "mpasiPlans": [],
  "mpasiRecipes": [],
  "symptomChecks": [],
  "diseases": [],
  "articles": [],
  "savedArticles": [],
  "notifications": []
}
```

---

## 6.3 Detail Struktur Entitas JSON

Setiap array di atas berisi objek JSON dengan struktur sebagai berikut:

### 1. `users` (Data Akun Ibu)
Menyimpan informasi profil Bunda. Tidak ada password, hanya menggunakan PIN 4 digit yang di-hash.
- `id` (String/UUID): Primary key.
- `phone` (String): Nomor HP unik, digunakan sebagai identifier login.
- `pinHash` (String): SHA-256 hash dari PIN 4 digit (tidak boleh disimpan sebagai plain text).
- `fullName` (String): Nama lengkap ibu.
- `profilePhoto` (String/Base64/URL): Data atau URL foto profil.
- `district` (String, opsional): Kecamatan domisili.
- `regency` (String, opsional): Kabupaten/kota domisili.
- `province` (String, opsional): Provinsi domisili.
- `isActive` (Boolean): Status akun.
- `lastLoginAt` (ISO 8601 String): Waktu terakhir login.
- `createdAt` (ISO 8601 String): Waktu registrasi.
- `updatedAt` (ISO 8601 String): Waktu pembaruan profil terakhir.

### 2. `children` (Data Anak)
Satu user (Bunda) dapat memiliki lebih dari satu anak.
- `id` (String/UUID): Primary key.
- `userId` (String/UUID): Referensi ke `users.id`.
- `name` (String): Nama panggilan anak.
- `dateOfBirth` (YYYY-MM-DD String): Tanggal lahir anak.
- `gender` (String): "L" (Laki-laki) atau "P" (Perempuan).
- `birthWeightKg` (Number, opsional): Berat badan lahir (kg).
- `birthHeightCm` (Number, opsional): Panjang badan lahir (cm).
- `bloodType` (String, opsional): Golongan darah anak ("A", "B", "AB", "O", atau "").
- `photoUrl` (String/Base64/URL, opsional): Foto profil anak.
- `isActive` (Boolean): Status aktif (false jika data diarsipkan/dihapus secara soft).
- `createdAt` (ISO 8601 String): Waktu data anak ditambahkan.

### 3. `growthRecords` (Catatan Pertumbuhan)
Menyimpan riwayat berat dan tinggi badan anak per tanggal pengukuran.
- `id` (String/UUID): Primary key.
- `childId` (String/UUID): Referensi ke `children.id`.
- `measuredAt` (YYYY-MM-DD String): Tanggal pengukuran dilakukan.
- `weightKg` (Number, opsional): Berat badan dalam kilogram.
- `heightCm` (Number, opsional): Tinggi/panjang badan dalam sentimeter.
- `headCircCm` (Number, opsional): Lingkar kepala dalam sentimeter.
- `notes` (String, opsional): Catatan tambahan dari Bunda.
- `createdAt` (ISO 8601 String): Waktu pencatatan.
> *Catatan: Kalkulasi Z-Score (BB/U, TB/U, BB/TB) dilakukan secara real-time di sisi frontend melalui utils (`growthCalculations.js`), sehingga tidak perlu disimpan persisten di storage.*

### 4. `milestones` (Master Data Perkembangan)
Data statis (Seed Data) berupa acuan tahap perkembangan anak berdasarkan usia.
- `id` (String/UUID): Primary key.
- `ageMinMonths` (Number): Batas bawah usia (bulan).
- `ageMaxMonths` (Number): Batas atas usia (bulan).
- `category` (String): "motorik_kasar", "motorik_halus", "bahasa", "sosial", "kognitif".
- `description` (String): Penjelasan milestone (contoh: "Bisa merangkak tanpa bantuan").
- `stimulationTips` (String, opsional): Tips stimulasi jika anak belum mencapai tahap ini.
- `illustrationUrl` (String, opsional): Referensi gambar/ilustrasi lokal.
- `isCritical` (Boolean): True jika keterlambatan milestone ini dianggap "red flag".

### 5. `milestoneRecords` (Pencapaian Perkembangan Anak)
Menyimpan status apakah anak sudah mencapai suatu milestone.
- `id` (String/UUID): Primary key.
- `childId` (String/UUID): Referensi ke `children.id`.
- `milestoneId` (String/UUID): Referensi ke `milestones.id`.
- `status` (String): "achieved" (tercapai), "not_yet" (belum tercapai), atau "monitoring" (dalam pantauan).
- `achievedAt` (YYYY-MM-DD String, opsional): Tanggal kapan milestone tercapai.
- `notes` (String, opsional): Catatan spesifik dari Bunda.
- `updatedAt` (ISO 8601 String): Waktu pencatatan.

### 6. `vaccines` (Master Data Imunisasi)
Data statis jadwal vaksinasi sesuai IDAI.
- `id` (String/UUID): Primary key.
- `name` (String): Nama lengkap vaksin (contoh: "BCG", "DPT-HB-Hib").
- `shortName` (String): Singkatan vaksin.
- `description` (String): Penjelasan fungsi vaksin.
- `recommendedAgeMonths` (Number): Usia anjuran pemberian (bulan).
- `maxAgeMonths` (Number, opsional): Batas usia keterlambatan maksimal (bulan).
- `doseNumber` (Number): Dosis ke-berapa (1, 2, 3, dst).
- `parentVaccineId` (String/UUID, opsional): Untuk menghubungkan seri dosis vaksin (DPT 1, DPT 2).
- `sideEffectsInfo` (String, opsional): Efek samping umum paska imunisasi (KIPI).

### 7. `immunizationRecords` (Catatan Imunisasi Anak)
Data riwayat pelaksanaan imunisasi tiap anak.
- `id` (String/UUID): Primary key.
- `childId` (String/UUID): Referensi ke `children.id`.
- `vaccineId` (String/UUID): Referensi ke `vaccines.id`.
- `status` (String): "scheduled" (terjadwal), "done" (selesai), "late" (terlambat), "skipped" (dilewati).
- `scheduledDate` (YYYY-MM-DD String): Tanggal target imunisasi berdasarkan tanggal lahir + recommendedAgeMonths.
- `actualDate` (YYYY-MM-DD String, opsional): Tanggal realisasi imunisasi.
- `location` (String, opsional): Tempat (Klinik, Posyandu, Puskesmas).
- `healthcareWorker` (String, opsional): Nama bidan / dokter.
- `sideEffectsNoted` (String, opsional): Efek samping yang dialami anak.
- `updatedAt` (ISO 8601 String): Waktu data diperbarui.

### 8. `mpasiPlans` (Rencana Menu MPASI Mingguan)
Catatan rencana menu harian anak yang dibuat ibu.
- `id` (String/UUID): Primary key.
- `childId` (String/UUID): Referensi ke `children.id`.
- `weekStartDate` (YYYY-MM-DD String): Tanggal Senin di minggu tersebut.
- `childAgeMonths` (Number): Usia anak saat rencana dibuat.
- `dailyBudgetIdr` (Number): Batas budget harian MPASI yang dipilih ibu.
- `allergies` (Array of Strings): Pantangan makan khusus untuk plan ini.
- `planData` (Array/Object JSON): Objek terstruktur yang berisi ID `mpasiRecipes` untuk jadwal Senin-Minggu, Pagi-Siang-Malam.
- `createdAt` (ISO 8601 String): Waktu pembuatan rencana.

### 9. `mpasiRecipes` (Master Data Resep)
Data statis yang berisi koleksi resep MPASI.
- `id` (String/UUID): Primary key.
- `name` (String): Judul masakan (contoh: "Bubur Hati Ayam").
- `ageMinMonths` (Number): Cocok mulai bulan ke-berapa (misal: 6).
- `ageMaxMonths` (Number): Batas atas bulan (misal: 8).
- `textureStage` (String): "puree", "porridge", "soft_chunk", atau "family".
- `estimatedCostIdr` (Number): Estimasi biaya bahan masakan.
- `ingredients` (Array of Objects): Daftar bahan (nama, jumlah, satuan).
- `steps` (Array of Strings): Langkah-langkah pembuatan.
- `nutritionInfo` (Object, opsional): Info gizi singkat.
- `allergens` (Array of Strings): Label alergen (seafood, kacang, susu sapi, dsb).
- `mealType` (String): "breakfast", "lunch", "dinner", atau "snack".
- `photoUrl` (String, opsional): Referensi aset gambar lokal.

### 10. `symptomChecks` (Riwayat Cek Gejala Sakit)
Penyimpanan hasil screening gejala anak dari fitur Symptom Checker.
- `id` (String/UUID): Primary key.
- `childId` (String/UUID): Referensi ke `children.id`.
- `symptomsSelected` (Array of Strings): Gejala yang diceklis ibu (misal: ["demam", "batuk", "lesu"]).
- `answers` (Object): Map jawaban dari pertanyaan lanjutan (misal: `{"berapa_hari_demam": "3"}`).
- `results` (Object): Hasil akhir kemungkinan penyakit beserta rekomendasi (disimpan langsung agar tidak berubah).
- `urgencyLevel` (String): Tingkat bahaya ("home", "doctor", "emergency").
- `checkedAt` (ISO 8601 String): Waktu cek dilakukan.

### 11. `diseases` (Master Data Penyakit & Gejala Dasar)
Data statis untuk knowledge-base sistem Symptom Checker MVP.
- `id` (String/UUID): Primary key.
- `name` (String): Nama awam (contoh: "Diare").
- `medicalName` (String, opsional): Nama medis (Gastroenteritis).
- `description` (String): Penjelasan penyakit.
- `commonSymptoms` (Array of Strings): Ciri-ciri umum.
- `causes` (String): Penyebab.
- `homeRemedies` (String): Panduan pertolongan pertama di rumah.
- `recommendedMeds` (Array/Object, opsional): Obat bebas yang diizinkan tanpa resep.
- `warningSigns` (Array of Strings): Tanda bahaya/Red Flags.
- `urgencyDefault` (String): Default tindakan awal ("home", "doctor", "emergency").

### 12. `articles` (Master Data Artikel & Edukasi)
Data statis konten edukasi parenting lokal.
- `id` (String/UUID): Primary key.
- `title` (String): Judul konten.
- `contentType` (String): "article", "video", atau "infographic".
- `contentBody` (String, opsional): Teks body (bisa Markdown / HTML).
- `mediaUrl` (String, opsional): URL untuk thumbnail / link video / infografis.
- `category` (String): Kategori bahasan ("newborn", "toddler", "gizi", "menyusui").
- `targetAgeMin` (Number, opsional): Usia anak minimal untuk relevansi artikel.
- `targetAgeMax` (Number, opsional): Usia anak maksimal.
- `isPublished` (Boolean): Status rilis konten.

### 13. `savedArticles` (Artikel Tersimpan)
Fitur bookmark / artikel yang disimpan Bunda.
- `id` (String/UUID): Primary key.
- `userId` (String/UUID): Referensi ke `users.id`.
- `articleId` (String/UUID): Referensi ke `articles.id`.
- `savedAt` (ISO 8601 String): Waktu bookmark ditambahkan.

### 14. `notifications` (Notifikasi Lokal)
Log / Riwayat pemberitahuan dalam aplikasi (Karena tidak ada FCM, ini adalah in-app notification).
- `id` (String/UUID): Primary key.
- `userId` (String/UUID): Referensi ke `users.id`.
- `type` (String): "immunization", "milestone", "growth", "article", "general".
- `title` (String): Judul pemberitahuan.
- `body` (String): Isi pemberitahuan.
- `isRead` (Boolean): Default `false`.
- `scheduledAt` (ISO 8601 String): Waktu notifikasi harus ditampilkan/dipicu di UI.
- `referenceId` (String/UUID, opsional): Link ID spesifik (misal ke `immunizationRecords.id`).
- `createdAt` (ISO 8601 String): Waktu data ditambahkan ke queue.

---

## 6.4 Catatan Mekanisme Operasional Storage

1. **Inisialisasi Master Data (Seeding)**
   Saat pertama kali aplikasi dibuka (`App.jsx` memanggil utilitas `seedData.js`), sistem akan mengecek isi LocalStorage. Jika array master data (seperti `milestones`, `vaccines`, `mpasiRecipes`, `diseases`, `articles`) masih kosong, aplikasi akan menginjeksi (seed) data dasar.
2. **Kapasitas Penyimpanan**
   Mengingat MVP ini murni teks dan metadata JSON (tidak menyimpan blob/file besar langsung di localStorage), ukuran data dibatasi sekitar 5MB (Limit standar LocalStorage browser), yang sangat cukup untuk kebutuhan profil dan text-based tracking harian. (Bila user mengunggah foto, disarankan menggunakan kompresi canvas base64 yang sangat diperkecil, atau tidak menyertakan fitur upload gambar lokal di versi MVP).
3. **Mekanisme Migrasi (Ke Depan)**
   Bila terjadi perubahan skema pada struktur di atas selama fase pengembangan, sistem (melalui hook khusus) wajib meminta persetujuan pengguna, lalu melakukan iterasi dan penyesuaian pada objek JSON tanpa menghapus data logikal secara permanen, sesuai dengan protokol constraint (poin 2.5 di `system-prompt.md`).
