# Skema Penyimpanan Data Lokal (LocalStorage) – Referensi Tunggal

Dokumen ini adalah **referensi tunggal** untuk arsitektur dan skema data JSON yang disimpan di dalam LocalStorage pada perangkat pengguna (klien) untuk **Aplikasi Hayya**. 

Semua operasi baca/tulis hooks (`src/hooks/`) dan context providers (`src/context/`) wajib merujuk secara patuh pada skema ini untuk menjaga integritas relasional data offline-first.

---

## 🧱 1. Arsitektur Penyimpanan Utama

- **Root Key LocalStorage:** `"hayya_app_data"`
- **Format:** Serialisasi JSON (Object)
- **ID Generator:** RFC 4122 v4 UUID melalui fungsi peramban bawaan `crypto.randomUUID()` (menghasilkan string unik 36-karakter).
- **Format Penanda Waktu (Timestamps):** ISO 8601 String UTC (contoh: `"2026-05-29T13:45:00.000Z"`).
- **Keamanan Kredensial:** PIN 4-digit wajib di-hash menggunakan SHA-256 (via Web Crypto API) menghasilkan string heksadesimal 64-karakter sebelum didorong ke penyimpanan. Plaintext PIN dilarang keras disimpan di LocalStorage.
- **Kunci Sesi Aktif (Session Keys di LocalStorage):**
  - `"hayya_active_user_id"`: String ID dari akun Bunda yang sedang aktif masuk (Digunakan secara konsisten sebagai referensi silang data oleh `AuthContext.jsx` dan `ChildContext.jsx`).
  - `"hayya_active_child_id"`: String ID dari profil anak yang sedang aktif dipilih (Digunakan secara konsisten oleh `ChildContext.jsx`).
- **Mekanisme Kebersihan Data (Notification Purge):**
  - Untuk mencegah penimbunan memori LocalStorage yang tak terbatas (*infinite growth array*), koleksi `notifications` secara proaktif menyapu notifikasi lama yang berumur **lebih dari 30 hari** setiap kali ada pencatatan riwayat pertumbuhan baru (`useGrowth`) atau penyelesaian imunisasi (`useImmunization`).

---

## 🗃️ 2. Skema Struktur Root JSON (`hayya_app_data`)

Berikut adalah struktur objek JSON raksasa default beserta contoh tipe data lengkap dari masing-masing koleksi di dalam root key `"hayya_app_data"`:

```json
{
  "users": [
    {
      "id": "18f972b2-cc31-419b-a01a-82881bb454e9",
      "phone": "081234567890",
      "pinHash": "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4",
      "fullName": "Bunda Sari Putri",
      "profilePhoto": "data:image/png;base64,iVBORw0KGgoAAAANS...",
      "district": "Batu",
      "regency": "Batu",
      "province": "Jawa Timur",
      "lastActiveChildId": "4c6e93d1-f8ba-4d0d-b452-9b22e1ddbf85",
      "isActive": true,
      "lastLoginAt": "2026-05-29T13:45:00.000Z",
      "createdAt": "2026-05-29T13:40:00.000Z",
      "updatedAt": "2026-05-29T13:45:00.000Z"
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
      "birthHeightCm": 49.0,
      "bloodType": "O",
      "photoUrl": "data:image/png;base64,iVBORw0KGgoAAAANS...",
      "isActive": true,
      "createdAt": "2026-05-29T13:45:00.000Z",
      "updatedAt": "2026-05-29T13:45:00.000Z"
    }
  ],
  "growthRecords": [
    {
      "id": "g5f6e7d8-c9b0-4a1b-2c3d-4e5f6a7b8c9d",
      "childId": "4c6e93d1-f8ba-4d0d-b452-9b22e1ddbf85",
      "measuredAt": "2026-05-15",
      "weightKg": 6.8,
      "heightCm": 64.5,
      "headCircCm": 41.5,
      "notes": "Si kecil minum ASI lahap sekali bulan ini.",
      "createdAt": "2026-05-15T09:00:00.000Z",
      "updatedAt": "2026-05-15T09:00:00.000Z"
    }
  ],
  "milestones": [
    {
      "id": "m1",
      "ageMinMonths": 0,
      "ageMaxMonths": 3,
      "category": "motorik_kasar",
      "description": "Bisa mengangkat kepala setinggi 45 derajat saat tengkurap",
      "stimulationTips": "Latih Tummy Time sesering mungkin (3-5 kali sehari selama 1-3 menit) sejak lahir.",
      "illustrationUrl": "/assets/milestones/motorik-kasar-1.png",
      "isCritical": true
    }
  ],
  "milestoneRecords": [
    {
      "id": "r1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "childId": "4c6e93d1-f8ba-4d0d-b452-9b22e1ddbf85",
      "milestoneId": "m1",
      "status": "achieved",
      "achievedAt": "2026-03-20",
      "notes": "Sudah stabil mengangkat kepala saat tummy time sore hari.",
      "createdAt": "2026-03-20T10:00:00.000Z",
      "updatedAt": "2026-03-20T10:00:00.000Z"
    }
  ],
  "vaccines": [
    {
      "id": "v2",
      "name": "BCG",
      "shortName": "BCG",
      "description": "Mencegah penyakit tuberkulosis (TBC) paru berat dan TBC selaput otak.",
      "recommendedAgeMonths": 1,
      "maxAgeMonths": 3,
      "doseNumber": 1,
      "parentVaccineId": null,
      "sideEffectsInfo": "Muncul bisul bernanah kecil di lengan setelah 2-6 minggu yang meninggalkan parut."
    }
  ],
  "immunizationRecords": [
    {
      "id": "i9f8e7d6-c5b4-4a3b-2c1d-0e9f8a7b6c5d",
      "childId": "4c6e93d1-f8ba-4d0d-b452-9b22e1ddbf85",
      "vaccineId": "v2",
      "status": "done",
      "scheduledDate": "2026-02-15",
      "actualDate": "2026-02-18",
      "location": "Puskesmas Batu",
      "healthcareWorker": "Bidan Susi",
      "sideEffectsNoted": "Agak rewel malam harinya, tidak demam tinggi.",
      "createdAt": "2026-02-18T04:30:00.000Z",
      "updatedAt": "2026-02-18T04:30:00.000Z"
    }
  ],
  "mpasiPlans": [
    {
      "id": "p1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
      "childId": "4c6e93d1-f8ba-4d0d-b452-9b22e1ddbf85",
      "weekStartDate": "2026-06-01",
      "childAgeMonths": 6,
      "dailyBudgetIdr": 20000,
      "allergies": ["seafood"],
      "planData": {
        "senin": { "breakfast": "r1", "lunch": "r2", "dinner": "r2", "snack": "r3" },
        "selasa": { "breakfast": "r1", "lunch": "r2", "dinner": "r2", "snack": "r3" },
        "rabu": { "breakfast": "r11", "lunch": "r2", "dinner": "r2", "snack": "r3" },
        "kamis": { "breakfast": "r1", "lunch": "r2", "dinner": "r2", "snack": "r3" },
        "jumat": { "breakfast": "r1", "lunch": "r2", "dinner": "r2", "snack": "r3" },
        "sabtu": { "breakfast": "r1", "lunch": "r2", "dinner": "r2", "snack": "r3" },
        "minggu": { "breakfast": "r1", "lunch": "r2", "dinner": "r2", "snack": "r3" }
      },
      "createdAt": "2026-05-29T13:45:00.000Z",
      "updatedAt": "2026-05-29T13:45:00.000Z"
    }
  ],
  "mpasiRecipes": [
    {
      "id": "r2",
      "name": "Bubur Saring Hati Ayam & Wortel",
      "ageMinMonths": 6,
      "ageMaxMonths": 8,
      "textureStage": "puree",
      "estimatedCostIdr": 12000,
      "ingredients": [
        { "name": "Beras Putih", "amount": 2.0, "unit": "sdm" },
        { "name": "Hati Ayam Segar", "amount": 1.0, "unit": "potong" },
        { "name": "Wortel Parut", "amount": 1.0, "unit": "sdm" }
      ],
      "steps": [
        "Rebus beras giling dengan air hingga lembek.",
        "Masukkan hati ayam cincang halus dan parutan wortel.",
        "Saring bubur selagi hangat menggunakan saringan kawat."
      ],
      "nutritionInfo": { "energi": "115 kkal", "protein": "6.2 gr" },
      "allergens": [],
      "mealType": "lunch",
      "photoUrl": "/assets/recipes/bubur-hati-ayam.png"
    }
  ],
  "symptomChecks": [
    {
      "id": "s8f9e0d1-c2b3-4a4b-5c6d-7e8f9a0b1c2d",
      "childId": "4c6e93d1-f8ba-4d0d-b452-9b22e1ddbf85",
      "symptomsSelected": ["demam", "rewel"],
      "answers": {
        "berapa_hari_demam": "3",
        "suhu_tubuh": "38.5"
      },
      "results": {
        "diseaseMatchedId": "d1",
        "diseaseName": "Demam Biasa",
        "urgencyLevel": "doctor",
        "recommendations": "Beri kompres hangat, pakaikan baju tipis, beri banyak ASI/cairan.",
        "warningSigns": ["Kejang", "Suhu > 39°C", "Lemas tidak menyusu"]
      },
      "urgencyLevel": "doctor",
      "checkedAt": "2026-05-29T13:45:00.000Z"
    }
  ],
  "diseases": [
    {
      "id": "d1",
      "name": "Demam Biasa",
      "medicalName": "Febris Akut",
      "description": "Kenaikan suhu tubuh anak di atas batas normal (> 37.5 derajat Celcius).",
      "commonSymptoms": ["Suhu tubuh > 37.5°C", "Anak rewel", "Badan hangat"],
      "causes": "Respon pertahanan tubuh melawan infeksi virus musiman ringan.",
      "homeRemedies": "Kompres hangat, beri banyak ASI, pakaikan baju tipis.",
      "recommendedMeds": ["Paracetamol sirup anak"],
      "warningSigns": ["Kejang", "Suhu > 39°C", "Lemas"],
      "urgencyDefault": "doctor"
    }
  ],
  "articles": [
    {
      "id": "a1",
      "title": "Panduan Sukses Menyusui Bayi Baru Lahir (Newborn)",
      "contentType": "article",
      "contentBody": "Menyusui bayi baru lahir (newborn) membutuhkan pelekatan (latch-on) yang tepat...",
      "mediaUrl": "/assets/articles/menyusui-newborn.png",
      "category": "menyusui",
      "targetAgeMin": 0,
      "targetAgeMax": 6,
      "isPublished": true
    }
  ],
  "savedArticles": [
    {
      "id": "b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e",
      "userId": "18f972b2-cc31-419b-a01a-82881bb454e9",
      "articleId": "a1",
      "savedAt": "2026-05-29T13:45:00.000Z"
    }
  ],
  "notifications": [
    {
      "id": "n1f2e3d4-c5b6-7a8b-9c0d-1e2f3a4b5c6d",
      "userId": "18f972b2-cc31-419b-a01a-82881bb454e9",
      "type": "immunization",
      "title": "Pengingat Imunisasi Dek Rayyan 💉",
      "body": "Jadwal Imunisasi BCG Dek Rayyan adalah 3 hari lagi (15 Februari 2026). Jangan lupa ya, Bunda! 🧡",
      "isRead": false,
      "scheduledAt": "2026-02-12T07:00:00.000Z",
      "referenceId": "i9f8e7d6-c5b4-4a3b-2c1d-0e9f8a7b6c5d",
      "createdAt": "2026-02-08T07:00:00.000Z"
    }
  ]
}
```

---

## 🔑 3. Referensi Hubungan Relasi Data (Foreign Keys)

1. **`children.userId`** ➔ Merujuk ke **`users.id`** (Satu Bunda bisa memiliki banyak anak).
2. **`growthRecords.childId`** ➔ Merujuk ke **`children.id`** (Satu anak bisa memiliki banyak riwayat timbangan).
3. **`milestoneRecords.childId`** ➔ Merujuk ke **`children.id`** dan **`milestoneRecords.milestoneId`** ➔ Merujuk ke **`milestones.id`** (Pencatatan pencapaian milestone anak).
4. **`immunizationRecords.childId`** ➔ Merujuk ke **`children.id`** dan **`immunizationRecords.vaccineId`** ➔ Merujuk ke **`vaccines.id`** (Catatan imunisasi per anak).
5. **`mpasiPlans.childId`** ➔ Merujuk ke **`children.id`** (Rencana menu harian terikat ke profil tumbuh kembang anak tertentu).
6. **`symptomChecks.childId`** ➔ Merujuk ke **`children.id`** (Riwayat screening penyakit si kecil).
7. **`savedArticles.userId`** ➔ Merujuk ke **`users.id`** dan **`savedArticles.articleId`** ➔ Merujuk ke **`articles.id`** (Menampung bookmark artikel Bunda, sekaligus bookmark resep MPASI lewat `recipeId` yang disimpan di field `articleId`).
8. **`notifications.userId`** ➔ Merujuk ke **`users.id`** (Mengirimkan notifikasi in-app khusus untuk Bunda yang sedang aktif login).
