# Dokumen Alur Logika: Meal Plan & Resep MPASI (F-08 & F-09)

Dokumen ini menjelaskan alur logika, state data, mutasi skema LocalStorage, penanganan error, serta dependensi antarfitiur untuk modul **Meal Planner & Resep MPASI** pada Aplikasi Hayya.

---

## 1. User Action Flow (Alur Aktivitas Pengguna)

### A. Membuat Rencana Menu MPASI Mingguan Baru
1. **Membuka Halaman MPASI**: Bunda membuka tab **MPASI** melalui Bottom Navigation Bar.
2. **Pengecekan Anak Aktif**:
   - Jika belum ada anak aktif yang dipilih di aplikasi, sistem menampilkan layar pilihan anak. Bunda harus memilih salah satu profil anak.
   - Jika sudah ada anak aktif, sistem akan langsung menampilkan ringkasan rencana minggu ini (jika ada) atau tombol utama **"Buat Rencana Menu Mingguan"**.
3. **Mengisi Formulir Konfigurasi**: Bunda mengklik tombol "Buat Rencana Menu Mingguan" untuk membuka formulir. Bunda melengkapi parameter berikut:
   - **Pilih Tanggal Mulai**: Tanggal hari Senin di minggu rencana yang diinginkan (sistem menyediakan *date picker* yang otomatis mengunci atau membulatkan pilihan ke hari Senin terdekat).
   - **Usia Anak (Bulan)**: Otomatis terhitung dari tanggal lahir anak aktif saat ini, namun Bunda tetap dapat menyesuaikan angka ini (misal: jika ingin menyusun rencana untuk bulan depan).
   - **Batas Anggaran Harian (IDR)**: Bunda memasukkan batas pengeluaran harian untuk masakan MPASI (misal: `30000` untuk Rp 30.000).
   - **Pantangan / Alergen Makanan**: Bunda memberikan ceklis pada daftar bahan makanan pemicu alergi yang ingin dihindari (seafood, kacang, telur, susu sapi, gandum).
4. **Memicu Pembuatan Rencana**: Bunda menekan tombol **"Generate Rencana Menu"** (ukuran tombol minimal 44x44px ramah jempol).
5. **Validasi & Pemrosesan Lokal**:
   - Sistem memvalidasi input: Tanggal mulai harus bertepatan dengan hari Senin, batas anggaran harian berupa angka positif, dan usia anak berada pada rentang MPASI yang valid (6 hingga 59 bulan).
   - Sistem melakukan pencarian dan penyaringan di memori lokal terhadap array `mpasiRecipes` (statis/seed data).
6. **Melihat Draf Rekomendasi**:
   - Bunda diarahkan ke halaman **Detail Draf Rencana MPASI** yang menampilkan rancangan menu 7 hari (Senin sampai Minggu).
   - Setiap hari terbagi menjadi 4 slot makan: **Pagi (Breakfast)**, **Siang (Lunch)**, **Malam (Dinner)**, dan **Selingan (Snack)**.
   - Sistem menampilkan perkiraan biaya harian serta rincian resep yang terpilih di setiap slot.
7. **Melakukan Ganti Menu (Shuffle/Swap)**:
   - Apabila Bunda kurang sreg dengan resep pada salah satu slot (misal: Makan Siang hari Selasa adalah "Pure Labu Kuning" dan Bunda ingin menggantinya), Bunda dapat mengklik tombol **"Ganti Menu"** pada kartu makanan tersebut.
   - Sistem menyaring resep alternatif dari bank resep terfilter (memenuhi kriteria usia, budget sisa hari tersebut, dan bebas alergen) lalu menggantinya secara acak di slot tersebut.
8. **Menyimpan Rencana Mingguan**:
   - Bunda menekan tombol **"Simpan Rencana"** di bagian bawah halaman.
   - Sistem memproses data, menghasilkan UUID baru untuk rencana ini, lalu menyimpannya secara persisten ke dalam array `mpasiPlans` di LocalStorage.
   - Tampilan sukses (toast / dialog) muncul dengan sapaan hangat: *"Rencana MPASI mingguan berhasil disimpan, Bunda! Siap memberikan nutrisi terbaik untuk Si Kecil 🧡"*. Bunda diarahkan kembali ke Dashboard MPASI.

### B. Melihat Detail Resep & Menandai Bookmark
1. **Memilih Resep**: Bunda mengklik salah satu kartu resep MPASI baik dari halaman Rencana Mingguan, halaman Pencarian Resep, maupun dari daftar Koleksi Tersimpan.
2. **Membuka Halaman Detail Resep**: Sistem menampilkan modal atau halaman detail resep yang memuat informasi lengkap:
   - Nama masakan & Foto ilustrasi lokal.
   - Tag kategori tekstur (Puree, Porridge, Soft Chunk, Family) dan rentang usia aman (misal: "6-8 bulan").
   - Estimasi biaya bahan masakan (IDR).
   - Informasi kandungan nilai gizi ringkas (Energi, Protein, Lemak, Karbohidrat).
   - Daftar bahan-bahan masakan beserta takaran spesifiknya.
   - Langkah-langkah pembuatan interaktif yang runtut.
   - Label peringatan alergen jika masakan tersebut mengandung bahan alergen tertentu.
3. **Menyimpan Resep (Bookmarking)**:
   - Di bagian kanan atas halaman resep, Bunda dapat mengklik ikon **Bookmark** berbentuk hati/bintang.
   - Jika resep belum pernah disimpan: Ikon berubah menjadi merah muda solid (`#C2185B`), data resep baru ditambahkan ke array `savedRecipes` di LocalStorage, dan muncul pesan sukses: *"Resep berhasil disimpan ke koleksi Bunda! 🧡"*.
   - Jika resep sudah pernah disimpan: Ikon berubah kembali menjadi outline, data resep tersebut dihapus dari array `savedRecipes`, dan muncul pesan: *"Resep dihapus dari koleksi Bunda."*.

---

## 2. Data State Flow (Aliran State Data React)

Bagian ini memaparkan state internal React (`useState`), efek samping (`useEffect`), serta alur pemutaran state yang digunakan selama proses eksekusi fitur MPASI.

### A. Variabel State yang Digunakan
1. `activeChild` (Object | null): Menyimpan informasi anak yang sedang aktif dipilih saat ini.
2. `config` (Object): Menyimpan data masukan formulir rencana MPASI.
   - Struktur: `{ weekStartDate: String, childAgeMonths: Number, dailyBudgetIdr: Number, allergies: Array }`
3. `errors` (Object | null): Menyimpan daftar pesan error validasi input formulir.
4. `isGenerating` (Boolean): State loading saat sistem lokal melakukan pengacakan dan filter resep untuk draf menu.
5. `draftPlan` (Object | null): Menyimpan data rencana 7 hari yang bersifat sementara sebelum Bunda secara sadar menekan tombol simpan.
6. `savedRecipesList` (Array): Menyimpan daftar ID resep yang sedang di-bookmark oleh pengguna saat ini untuk memvalidasi status keaktifan ikon bookmark di UI.

### B. Arrow State Mutation Flow

#### 1. Alur Validasi & Input Konfigurasi Planner
```
[Bunda Input Form: Tanggal, Usia, Budget, Alergen]
       ↓
[Pengecekan On-Change pada Input Field]
       ↓
[State Update: setConfig({ ...config, [field]: value })]
       ↓
[Validasi Form: checkInputs(config)]
       ↓
   ─── Jika Tidak Valid ──→ [State Update: setErrors(validationErrors)] ──→ [Rerender UI: Tampilkan Teks Peringatan]
   ─── Jika Valid ────────→ [State Update: setErrors(null)] ──────────────→ [Rerender UI: Aktifkan Tombol 'Generate']
```

#### 2. Alur Penyusunan Rekomendasi Menu MPASI (Local Generation)
```
[Bunda Klik 'Generate Rencana Menu']
       ↓
[State Update: setIsGenerating(true)]
       ↓
[Proses Filtering: Filter mpasiRecipes berdasarkan usia, budget harian, & alergen]
       ↓
[Proses Slotting: Distribusikan resep ke slot Breakfast, Lunch, Dinner, Snack untuk 7 Hari]
       ↓
[State Update: setDraftPlan(generatedObject)]
       ↓
[State Update: setIsGenerating(false)]
       ↓
[Rerender UI: Tampilkan Struktur Menu 7 Hari dengan Biaya Harian & Opsi Ganti Menu]
```

#### 3. Alur Pengacakan Ulang Menu di Satu Slot (Single Slot Shuffle)
```
[Bunda Klik 'Ganti Menu' pada Hari H, Slot S]
       ↓
[Pencarian Alternatif: Filter mpasiRecipes dengan kriteria yang sama, kecuali ID resep yang saat ini terpasang]
       ↓
[Pemeriksaan Sisa Anggaran: Pastikan total biaya hari H setelah ditukar tidak melampaui config.dailyBudgetIdr]
       ↓
[Pengacakan Acak: Pilih satu resep baru dari daftar alternatif secara random]
       ↓
[State Update: setDraftPlan(updatedDraftPlanObject)]
       ↓
[Rerender UI: Kartu masakan pada Hari H, Slot S berubah menampilkan resep baru beserta biayanya]
```

#### 4. Alur Penyimpanan Draf ke LocalStorage
```
[Bunda Klik 'Simpan Rencana']
       ↓
[Validasi Draft: Memastikan semua slot terisi ID resep valid]
       ↓
[Konstruksi Data: Buat objek rencana baru lengkap dengan UUID dan Timestamp]
       ↓
[Proses Persistensi: Panggil useMpasi.savePlan() untuk push data ke LocalStorage 'hayya_app_data']
       ↓
[Navigasi: Arahkan pengguna ke halaman Dashboard MPASI & Tampilkan Banner Sukses]
```

#### 5. Alur Aktivasi & Deaktivasi Bookmark Resep
```
[Bunda Klik Ikon Bookmark pada Detail Resep R]
       ↓
[Pengecekan Awal: Apakah ID resep R ada di dalam array savedRecipes?]
       ↓
   ─── Jika Belum Ada ──→ [Tambahkan objek baru ke savedRecipes] ──→ [State Update: setSavedRecipesList(updatedList)]
   ─── Jika Sudah Ada ──→ [Hapus objek resep R dari savedRecipes] ──→ [State Update: setSavedRecipesList(updatedList)]
       ↓
[Sinkronisasi Storage: Simpan perubahan ke LocalStorage root key 'hayya_app_data']
       ↓
[Rerender UI: Ubah Ikon Hati/Bintang & Munculkan Toast Feedback]
```

---

## 3. LocalStorage Schema Mutation (Mutasi Skema LocalStorage)

Seluruh data persisten disimpan dalam satu root key `"hayya_app_data"`. Di bawah ini diperlihatkan kondisi JSON persis sebelum dan sesudah tindakan pembuatan rencana menu mingguan baru serta bookmark resep dilakukan.

### A. Skenario 1: Membuat Rencana Menu MPASI Mingguan Baru

#### Kondisi JSON Sebelum Tindakan (Before)
Sistem memiliki data master resep (`mpasiRecipes`) hasil *seeding* awal, satu data profil anak (`children`), namun array `mpasiPlans` masih kosong.

```json
{
  "users": [
    {
      "id": "u18d-4a11-827c-9b88f3c711a1",
      "phone": "081234567890",
      "pinHash": "8d969ee51d93617637027b0c23ac5d07c043eb759c8690f0a85d95e94b29cf32",
      "fullName": "Bunda Clarissa",
      "isActive": true,
      "lastLoginAt": "2026-05-29T20:00:00+07:00",
      "createdAt": "2026-05-29T19:30:00+07:00"
    }
  ],
  "children": [
    {
      "id": "c5fb-41a9-b68e-28d701dfcde3",
      "userId": "u18d-4a11-827c-9b88f3c711a1",
      "name": "Kael",
      "dateOfBirth": "2025-10-15",
      "gender": "L",
      "birthWeightKg": 3.2,
      "birthHeightCm": 49,
      "isActive": true,
      "createdAt": "2026-05-29T19:35:00+07:00"
    }
  ],
  "mpasiRecipes": [
    {
      "id": "r-puree-labu",
      "name": "Pure Labu Kuning Manis",
      "ageMinMonths": 6,
      "ageMaxMonths": 8,
      "textureStage": "puree",
      "estimatedCostIdr": 5000,
      "ingredients": [
        { "name": "Labu Kuning", "amount": 100, "unit": "gram" },
        { "name": "ASI / Susu Formula", "amount": 50, "unit": "ml" }
      ],
      "steps": [
        "Kukus labu kuning hingga empuk selama 15 menit.",
        "Saring labu kuning selagi hangat menggunakan saringan kawat.",
        "Campurkan dengan ASI hingga mencapai kekentalan yang diinginkan."
      ],
      "nutritionInfo": { "calories": 80, "protein": 1.5, "fat": 0.5, "carbs": 18 },
      "allergens": [],
      "mealType": "snack"
    },
    {
      "id": "r-bubur-hati",
      "name": "Bubur Saring Hati Ayam Wortel",
      "ageMinMonths": 6,
      "ageMaxMonths": 8,
      "textureStage": "puree",
      "estimatedCostIdr": 8000,
      "ingredients": [
        { "name": "Beras Putih", "amount": 2, "unit": "sdm" },
        { "name": "Hati Ayam", "amount": 1, "unit": "buah" },
        { "name": "Wortel Parut", "amount": 1, "unit": "sdm" }
      ],
      "steps": [
        "Rebus beras, hati ayam, dan wortel dalam air secukupnya hingga menjadi bubur lembek.",
        "Blender atau saring bubur agar mendapatkan tekstur halus.",
        "Sajikan hangat kepada Si Kecil."
      ],
      "nutritionInfo": { "calories": 120, "protein": 5.2, "fat": 2.8, "carbs": 15 },
      "allergens": [],
      "mealType": "breakfast"
    },
    {
      "id": "r-bubur-salmon",
      "name": "Bubur Salmon Gurih",
      "ageMinMonths": 6,
      "ageMaxMonths": 8,
      "textureStage": "puree",
      "estimatedCostIdr": 15000,
      "ingredients": [
        { "name": "Beras Putih", "amount": 2, "unit": "sdm" },
        { "name": "Daging Salmon Fillet", "amount": 20, "unit": "gram" },
        { "name": "Brokoli Cincang", "amount": 1, "unit": "sdm" }
      ],
      "steps": [
        "Masak beras putih bersama kaldu dan salmon hingga matang.",
        "Masukkan brokoli cincang menjelang bubur matang, aduk hingga layu.",
        "Haluskan bubur dengan saringan kawat sebelum disajikan."
      ],
      "nutritionInfo": { "calories": 140, "protein": 7.5, "fat": 4.2, "carbs": 14 },
      "allergens": ["seafood"],
      "mealType": "lunch"
    },
    {
      "id": "r-bubur-sapi",
      "name": "Bubur Daging Sapi Bayam",
      "ageMinMonths": 6,
      "ageMaxMonths": 8,
      "textureStage": "puree",
      "estimatedCostIdr": 10000,
      "ingredients": [
        { "name": "Beras Putih", "amount": 2, "unit": "sdm" },
        { "name": "Daging Sapi Giling", "amount": 20, "unit": "gram" },
        { "name": "Daun Bayam", "amount": 5, "unit": "lembar" }
      ],
      "steps": [
        "Rebus beras dan daging sapi giling hingga melunak sempurna.",
        "Masukkan daun bayam, masak selama 2 menit.",
        "Haluskan adonan menggunakan blender atau saringan kawat."
      ],
      "nutritionInfo": { "calories": 130, "protein": 6.8, "fat": 3.5, "carbs": 16 },
      "allergens": [],
      "mealType": "dinner"
    }
  ],
  "mpasiPlans": [],
  "savedRecipes": []
}
```

#### Kondisi JSON Sesudah Tindakan (After)
Setelah Bunda membuat Rencana Menu Mingguan untuk Kael (usia 7 bulan) per hari Senin tanggal `2026-06-01` dengan budget harian Rp 30.000 dan pantangan alergen `["seafood"]` (sehingga resep `r-bubur-salmon` diabaikan, dan resep `r-bubur-sapi` dipasang sebagai pengganti lunch/dinner). Satu objek rencana baru disisipkan ke dalam array `mpasiPlans`.

```json
{
  "users": [
    {
      "id": "u18d-4a11-827c-9b88f3c711a1",
      "phone": "081234567890",
      "pinHash": "8d969ee51d93617637027b0c23ac5d07c043eb759c8690f0a85d95e94b29cf32",
      "fullName": "Bunda Clarissa",
      "isActive": true,
      "lastLoginAt": "2026-05-29T20:00:00+07:00",
      "createdAt": "2026-05-29T19:30:00+07:00"
    }
  ],
  "children": [
    {
      "id": "c5fb-41a9-b68e-28d701dfcde3",
      "userId": "u18d-4a11-827c-9b88f3c711a1",
      "name": "Kael",
      "dateOfBirth": "2025-10-15",
      "gender": "L",
      "birthWeightKg": 3.2,
      "birthHeightCm": 49,
      "isActive": true,
      "createdAt": "2026-05-29T19:35:00+07:00"
    }
  ],
  "mpasiRecipes": [
    {
      "id": "r-puree-labu",
      "name": "Pure Labu Kuning Manis",
      "ageMinMonths": 6,
      "ageMaxMonths": 8,
      "textureStage": "puree",
      "estimatedCostIdr": 5000,
      "ingredients": [
        { "name": "Labu Kuning", "amount": 100, "unit": "gram" },
        { "name": "ASI / Susu Formula", "amount": 50, "unit": "ml" }
      ],
      "steps": [
        "Kukus labu kuning hingga empuk selama 15 menit.",
        "Saring labu kuning selagi hangat menggunakan saringan kawat.",
        "Campurkan dengan ASI hingga mencapai kekentalan yang diinginkan."
      ],
      "nutritionInfo": { "calories": 80, "protein": 1.5, "fat": 0.5, "carbs": 18 },
      "allergens": [],
      "mealType": "snack"
    },
    {
      "id": "r-bubur-hati",
      "name": "Bubur Saring Hati Ayam Wortel",
      "ageMinMonths": 6,
      "ageMaxMonths": 8,
      "textureStage": "puree",
      "estimatedCostIdr": 8000,
      "ingredients": [
        { "name": "Beras Putih", "amount": 2, "unit": "sdm" },
        { "name": "Hati Ayam", "amount": 1, "unit": "buah" },
        { "name": "Wortel Parut", "amount": 1, "unit": "sdm" }
      ],
      "steps": [
        "Rebus beras, hati ayam, dan wortel dalam air secukupnya hingga menjadi bubur lembek.",
        "Blender atau saring bubur agar mendapatkan tekstur halus.",
        "Sajikan hangat kepada Si Kecil."
      ],
      "nutritionInfo": { "calories": 120, "protein": 5.2, "fat": 2.8, "carbs": 15 },
      "allergens": [],
      "mealType": "breakfast"
    },
    {
      "id": "r-bubur-salmon",
      "name": "Bubur Salmon Gurih",
      "ageMinMonths": 6,
      "ageMaxMonths": 8,
      "textureStage": "puree",
      "estimatedCostIdr": 15000,
      "ingredients": [
        { "name": "Beras Putih", "amount": 2, "unit": "sdm" },
        { "name": "Daging Salmon Fillet", "amount": 20, "unit": "gram" },
        { "name": "Brokoli Cincang", "amount": 1, "unit": "sdm" }
      ],
      "steps": [
        "Masak beras putih bersama kaldu dan salmon hingga matang.",
        "Masukkan brokoli cincang menjelang bubur matang, aduk hingga layu.",
        "Haluskan bubur dengan saringan kawat sebelum disajikan."
      ],
      "nutritionInfo": { "calories": 140, "protein": 7.5, "fat": 4.2, "carbs": 14 },
      "allergens": ["seafood"],
      "mealType": "lunch"
    },
    {
      "id": "r-bubur-sapi",
      "name": "Bubur Daging Sapi Bayam",
      "ageMinMonths": 6,
      "ageMaxMonths": 8,
      "textureStage": "puree",
      "estimatedCostIdr": 10000,
      "ingredients": [
        { "name": "Beras Putih", "amount": 2, "unit": "sdm" },
        { "name": "Daging Sapi Giling", "amount": 20, "unit": "gram" },
        { "name": "Daun Bayam", "amount": 5, "unit": "lembar" }
      ],
      "steps": [
        "Rebus beras dan daging sapi giling hingga melunak sempurna.",
        "Masukkan daun bayam, masak selama 2 menit.",
        "Haluskan adonan menggunakan blender atau saringan kawat."
      ],
      "nutritionInfo": { "calories": 130, "protein": 6.8, "fat": 3.5, "carbs": 16 },
      "allergens": [],
      "mealType": "dinner"
    }
  ],
  "mpasiPlans": [
    {
      "id": "p6c2-4ee1-b75f-d227318fda77",
      "childId": "c5fb-41a9-b68e-28d701dfcde3",
      "weekStartDate": "2026-06-01",
      "childAgeMonths": 7,
      "dailyBudgetIdr": 30000,
      "allergies": ["seafood"],
      "planData": {
        "monday": { "breakfast": "r-bubur-hati", "lunch": "r-bubur-sapi", "dinner": "r-bubur-sapi", "snack": "r-puree-labu" },
        "tuesday": { "breakfast": "r-bubur-hati", "lunch": "r-bubur-sapi", "dinner": "r-bubur-sapi", "snack": "r-puree-labu" },
        "wednesday": { "breakfast": "r-bubur-hati", "lunch": "r-bubur-sapi", "dinner": "r-bubur-sapi", "snack": "r-puree-labu" },
        "thursday": { "breakfast": "r-bubur-hati", "lunch": "r-bubur-sapi", "dinner": "r-bubur-sapi", "snack": "r-puree-labu" },
        "friday": { "breakfast": "r-bubur-hati", "lunch": "r-bubur-sapi", "dinner": "r-bubur-sapi", "snack": "r-puree-labu" },
        "saturday": { "breakfast": "r-bubur-hati", "lunch": "r-bubur-sapi", "dinner": "r-bubur-sapi", "snack": "r-puree-labu" },
        "sunday": { "breakfast": "r-bubur-hati", "lunch": "r-bubur-sapi", "dinner": "r-bubur-sapi", "snack": "r-puree-labu" }
      },
      "createdAt": "2026-05-29T20:35:00+07:00"
    }
  ],
  "savedRecipes": []
}
```

*Penjelasan Mutasi*:
Sistem menghasilkan UUID baru `p6c2-4ee1-b75f-d227318fda77` menggunakan fungsi `crypto.randomUUID()`. Objek plans ini dikonstruksi secara dinamis dengan mengalokasikan resep non-alergen yang total biaya per harinya adalah Rp 28.000 (`8000 + 10000 + 10000 + 5000`), sehingga lolos verifikasi budget harian (maksimal Rp 30.000). Data kemudian di-*push* ke key `"mpasiPlans"`.

---

### B. Skenario 2: Menandai Bookmark Resep

#### Kondisi JSON Sebelum Tindakan (Before)
Sistem memiliki skema default, namun array `savedRecipes` kosong.

```json
{
  "users": [
    {
      "id": "u18d-4a11-827c-9b88f3c711a1",
      "phone": "081234567890",
      "pinHash": "8d969ee51d93617637027b0c23ac5d07c043eb759c8690f0a85d95e94b29cf32",
      "fullName": "Bunda Clarissa",
      "isActive": true,
      "lastLoginAt": "2026-05-29T20:00:00+07:00",
      "createdAt": "2026-05-29T19:30:00+07:00"
    }
  ],
  "mpasiRecipes": [
    {
      "id": "r-bubur-hati",
      "name": "Bubur Saring Hati Ayam Wortel",
      "estimatedCostIdr": 8000
    }
  ],
  "savedRecipes": []
}
```

#### Kondisi JSON Sesudah Tindakan (After)
Setelah Bunda menyukai dan mengklik tombol bookmark pada resep `"r-bubur-hati"`.

```json
{
  "users": [
    {
      "id": "u18d-4a11-827c-9b88f3c711a1",
      "phone": "081234567890",
      "pinHash": "8d969ee51d93617637027b0c23ac5d07c043eb759c8690f0a85d95e94b29cf32",
      "fullName": "Bunda Clarissa",
      "isActive": true,
      "lastLoginAt": "2026-05-29T20:00:00+07:00",
      "createdAt": "2026-05-29T19:30:00+07:00"
    }
  ],
  "mpasiRecipes": [
    {
      "id": "r-bubur-hati",
      "name": "Bubur Saring Hati Ayam Wortel",
      "estimatedCostIdr": 8000
    }
  ],
  "savedRecipes": [
    {
      "id": "b7d2-430c-ba71-6fe47d0d1e2e",
      "userId": "u18d-4a11-827c-9b88f3c711a1",
      "recipeId": "r-bubur-hati",
      "savedAt": "2026-05-29T20:36:12+07:00"
    }
  ]
}
```

*Penjelasan Mutasi*:
Objek baru ditambahkan ke array `"savedRecipes"` yang mencatat relasi bookmark antara pengguna aktif `userId` (`u18d-4a11-827c-9b88f3c711a1`) dengan ID resep `recipeId` (`r-bubur-hati`). Primary key `id` dihasilkan secara acak melalui `crypto.randomUUID()`.

---

## 4. Edge Cases & Error Handling (Kasus Khusus & Penanganan Masalah)

### 1. Batas Anggaran Terlalu Rendah / Alergi Terlalu Banyak (Zero Matching Recipes)
* **Kasus**: Bunda memasukkan batas budget harian Rp 10.000 atau mencentang seluruh alergen (seafood, kacang, telur, susu), sehingga tidak ada satu pun kombinasi menu masakan harian yang lolos filter di bank resep lokal.
* **Penanganan Aplikasi**:
  - Sistem tidak melakukan crash atau me-render tampilan blank.
  - Sistem mendeteksi panjang hasil penyaringan adalah `0` pada tahap awal kalkulasi.
  - Tampilkan modal peringatan interaktif di layar:
    > **Waduh Bunda, resep tidak ditemukan! 🧡**
    > Kriteria menu MPASI yang Bunda masukkan terlalu ketat (misalnya budget terlalu rendah atau daftar alergen terlalu banyak). Yuk coba naikkan batas anggaran harian Bunda atau kurangi beberapa pantangan makanan jika memungkinkan agar rekomendasi menu bisa disusun.
  - Sediakan tombol **"Ubah Kriteria"** untuk mereset dan kembali ke formulir pengisian.

### 2. Tanggal Mulai Bukan Hari Senin (Non-Monday Start Date)
* **Kasus**: Bunda memilih tanggal mulai di tengah minggu melalui interaksi penanggalan secara manual.
* **Penanganan Aplikasi**:
  - Di sisi UI: Form mengintegrasikan logika penanggalan yang secara otomatis membidik hari Senin dari minggu yang sedang aktif dipilih.
  - Di sisi Logika: Jika lolos dari validasi visual, kode pengolah tanggal (`dateHelpers.js`) akan menghitung mundur dan menggeser tanggal secara otomatis ke hari Senin terdekat di minggu tersebut. Informasikan kepada Bunda dengan spanduk info kecil: *"Tanggal otomatis disesuaikan ke hari Senin terdekat (DD-MM-YYYY) demi kelancaran penyusunan jadwal 1 minggu penuh ya, Bunda."*

### 3. Usia Anak Belum Memasuki Fase MPASI (Usia < 6 Bulan)
* **Kasus**: Usia terhitung anak saat ditarik dari profil adalah 4 bulan, namun Bunda mencoba membuka modul Meal Planner.
* **Penanganan Aplikasi**:
  - Di halaman awal MPASI, tampilkan blok edukasi menonjol:
    > **Si Kecil Masih Berusia [X] Bulan, Bunda! 🧡**
    > Berdasarkan anjuran medis dan IDAI, bayi di bawah usia 6 bulan direkomendasikan untuk mendapatkan ASI Eksklusif saja. Pembuatan rencana menu MPASI belum diaktifkan demi kesehatan pencernaan buah hati Bunda.
  - Tombol **"Buat Rencana"** di-nonaktifkan secara visual (*disabled state*) dan tidak dapat diklik.

### 4. Penyimpanan LocalStorage Penuh (QuotaExceededError)
* **Kasus**: Penyimpanan LocalStorage di peramban browser perangkat Bunda telah menyentuh batas kuota 5MB sehingga tidak bisa menyimpan objek menu baru.
* **Penanganan Aplikasi**:
  - Setiap operasi penulisan (`localStorage.setItem`) dibungkus dalam blok kontrol `try-catch`.
  - Jika blok `catch` mendeteksi error bertipe `QuotaExceededError`, sistem membatalkan mutasi data dan memunculkan *dialog box* berisi permohonan maaf dan solusi:
    > **Memori HP Bunda Penuh! ⚠️**
    > Aplikasi tidak dapat menyimpan rencana menu baru karena kapasitas memori browser HP Bunda sudah penuh. Bunda dapat menghapus rencana menu MPASI lama yang sudah lewat atau membersihkan riwayat pemeriksaan gejala yang tidak terpakai lagi.
  - Menyediakan tombol pintas untuk menghapus instan data-data riwayat lama yang bersifat usang.

### 5. Kehilangan Koneksi Internet (Offline Status)
* **Kasus**: Bunda sedang berada di daerah tanpa sinyal atau mengaktifkan mode pesawat.
* **Penanganan Aplikasi**:
  - Karena Hayya dirancang dengan arsitektur **Offline-First (LocalStorage Only)**, fitur Meal Planner, rekomendasi resep, kalkulasi budget, dan bookmark resep **100% tetap berfungsi penuh secara lokal** tanpa ketergantungan koneksi jaringan.
  - Hook `useOnlineStatus` akan me-render spanduk notifikasi halus berwarna abu-abu/soft pink di bawah layar: *"Bunda dalam mode offline – Semua perubahan disimpan dengan aman langsung di HP Bunda"* untuk memberikan ketenangan pikiran.

---

## 5. Dependensi dengan Fitur Lain (Hubungan Antarfitur)

1. **Fitur Profil & Anak (F-02)**:
   - Modul MPASI sangat bergantung pada data `children` aktif saat ini.
   - Usia anak dalam bulan (`childAgeMonths`) dikalkulasi secara dinamis saat formulir dimuat dengan membandingkan `children.dateOfBirth` dengan tanggal sistem saat ini.
   - Nama panggilan anak ditarik dari profil untuk ditampilkan secara personal di kartu menu harian (contoh: *"Menu MPASI Hari Ini untuk Dek Kael"*).

2. **Master Data Seeding (`App.jsx` & `seedData.js`)**:
   - Generator ini tidak dapat berfungsi apabila bank resep master `mpasiRecipes` kosong di LocalStorage.
   - `useMpasi` berasumsi bahwa proses *seeding* 15 resep MPASI dasar telah sukses dijalankan secara otomatis saat inisialisasi awal aplikasi pertama kali dibuka oleh pengguna.

3. **Fitur Notifikasi Lokal (F-03)**:
   - Menyimpan rencana mingguan baru ke `mpasiPlans` akan memicu penambahan antrean notifikasi lokal ke dalam array `notifications` secara otomatis.
   - Notifikasi terjadwal ini akan dipicu setiap pukul 07:00 pagi setiap harinya selama minggu rencana aktif berlangsung, guna mengingatkan Bunda melihat resep makanan hari tersebut:
     - Judul: *"Waktunya Masak MPASI, Bunda! 🧡"*
     - Isi: *"Hari ini jadwal Dek [Nama] adalah [Nama Resep Pagi] untuk sarapan. Yuk intip resep lengkapnya di sini!"*
