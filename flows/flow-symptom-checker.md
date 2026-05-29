# Alur Logika: Symptom Checker Anak (Rule-Based Lokal) - F-10

Dokumen alur logika ini menjelaskan mekanisme kerja fitur **Symptom Checker** pada aplikasi Hayya. Fitur ini dirancang sepenuhnya berjalan secara lokal (offline-first) dengan mencocokkan gejala-gejala yang diinput oleh Bunda terhadap master data penyakit (`diseases`) yang disimpan di dalam `localStorage`.

---

## 1. User Action Flow

Berikut adalah langkah-langkah berurutan yang dialami oleh Bunda saat menggunakan fitur pencari gejala sakit anak:

*   **Tahap 1: Membuka Fitur Symptom Checker**
    *   Bunda mengetuk kartu pintas "Cek Gejala" di Dashboard utama, atau menavigasi ke menu "Gejala" melalui bilah navigasi bawah.
    *   Aplikasi menampilkan halaman utama Symptom Checker dengan sapaan hangat: *"Halo Bunda, ada keluhan apa dengan si kecil hari ini? Yuk, kita cek gejalanya."*
    *   Di bagian atas layar, terdapat kotak informasi (alert) berwarna kuning lembut berisi **Medical Disclaimer**:
        > ⚠️ **Perhatian Bunda:** Fitur ini hanya memberikan panduan awal berdasarkan gejala luar dan bukan pengganti diagnosis dokter. Jika si kecil menunjukkan kondisi darurat, mohon segera bawa ke Instalasi Gawat Darurat (IGD) atau rumah sakit terdekat.

*   **Tahap 2: Memilih Profil Anak**
    *   Bunda memilih profil anak yang ingin diperiksa dari daftar dropdown atau carousel anak (data diambil dari array `children` yang terdaftar pada profil Bunda).
    *   Sistem secara otomatis menampilkan nama dan menghitung usia anak saat ini untuk memperjelas konteks pemeriksaan (misalnya: *"Memeriksa: Arka - 1 tahun 2 bulan"*).

*   **Tahap 3: Pemilihan Gejala Utama**
    *   Bunda disuguhkan daftar checkbox gejala utama dengan ukuran area ketuk yang ramah jempol (minimal 44x44px):
        *   [ ] Demam
        *   [ ] Diare
        *   [ ] Batuk
        *   [ ] Muntah
        *   [ ] Ruam
    *   Bunda dapat mencentang satu atau lebih gejala yang dialami anak.
    *   Tombol **"Lanjut ke Detail Gejala"** hanya akan aktif setelah Bunda memilih minimal satu gejala utama. Jika tidak ada gejala yang dipilih, tombol tetap nonaktif (`disabled`).

*   **Tahap 4: Kuesioner Skrining Lanjutan (Wizard Dinamis)**
    *   Setelah mengetuk tombol lanjut, aplikasi menampilkan halaman kuesioner tambahan yang menyesuaikan secara dinamis dengan gejala utama yang dipilih:
        *   **Jika Gejala Demam dipilih:**
            *   Bunda ditanya durasi demam: *"Berapa lama demam si kecil sudah berlangsung?"* (Pilihan: `Kurang dari 3 hari` atau `3 hari atau lebih`).
            *   Bunda ditanya suhu tubuh anak: *"Berapa suhu tubuh si kecil saat ini?"* (Kolom input angka desimal dalam °C, misalnya `38.5`).
        *   **Jika Gejala Diare dipilih:**
            *   Bunda ditanya frekuensi: *"Berapa kali si kecil buang air besar cair dalam 24 jam terakhir?"* (Pilihan: `Kurang dari 4 kali` atau `4 kali atau lebih`).
            *   Bunda ditanya konsistensi: *"Apakah ada bercak darah atau lendir pada tinja si kecil?"* (Pilihan: `Tidak ada` atau `Ada darah atau lendir`).
        *   **Jika Gejala Batuk dipilih:**
            *   Bunda ditanya intensitas/bunyi: *"Apakah batuk si kecil terdengar sesak atau disertai bunyi 'ngik' (mengi)?"* (Pilihan: `Tidak` atau `Ya`).
        *   **Jika Gejala Muntah dipilih:**
            *   Bunda ditanya keparahan: *"Apakah si kecil muntah terus-menerus setiap kali diberikan makan atau minum?"* (Pilihan: `Tidak` atau `Ya, selalu muntah`).
        *   **Jika Gejala Ruam dipilih:**
            *   Bunda ditanya penyebaran: *"Apakah ruam merah muncul merata di seluruh tubuh setelah demamnya mulai turun?"* (Pilihan: `Tidak` atau `Ya`).

*   **Tahap 5: Skrining Tanda Bahaya Darurat (Red Flags)**
    *   Bunda diarahkan ke halaman penting berisi daftar kondisi kritis (Red Flags) dengan latar belakang merah muda lembut untuk memastikan keselamatan anak:
        *   [ ] Anak sangat lemas, sulit dibangunkan, atau mengalami penurunan kesadaran.
        *   [ ] Napas anak sangat cepat atau tampak sesak napas (terdapat tarikan kulit yang dalam pada dinding dada saat bernapas).
        *   [ ] Anak mengalami kejang-kejang.
        *   [ ] Ujung tangan dan kaki teraba sangat dingin, basah, dan tampak pucat atau kebiruan.
        *   [ ] Anak tidak buang air kecil (pipis) sama sekali dalam 6 jam terakhir.
        *   [ ] Terjadi pendarahan spontan seperti mimisan, gusi berdarah, atau bintik-bintik merah gelap yang tidak pudar saat ditekan.
        *   [ ] **Tidak ada tanda bahaya di atas (Kondisi Stabil)**.
    *   Bunda wajib mencentang salah satu dari tanda bahaya atau mencentang opsi "Tidak ada tanda bahaya di atas" sebelum tombol **"Lihat Hasil Pemeriksaan"** aktif.

*   **Tahap 6: Evaluasi Logika & Tampilan Hasil**
    *   Sistem memproses seluruh jawaban Bunda secara instan di sisi klien (100% offline, tanpa loading server).
    *   Aplikasi menampilkan halaman hasil pemeriksaan yang terdiri dari:
        *   **Indikator Status Urgensi**:
            *   🔴 **EMERGENCY (Gawat Darurat)**: Latar belakang merah mencolok. Teks: *"SEGERA BAWA KE IGD / DOKTER!"*
            *   🟡 **DOCTOR (Perlu Diperiksa Dokter)**: Latar belakang kuning/oranye. Teks: *"Jadwalkan Pemeriksaan ke Dokter"*
            *   🟢 **HOME (Perawatan Mandiri)**: Latar belakang teal/hijau lembut. Teks: *"Perawatan Mandiri & Pemantauan di Rumah"*
        *   **Hasil Pencocokan Penyakit**: Nama penyakit terdekat dari database master beserta deskripsinya (misalnya: *"Kemungkinan: Batuk Pilek (Common Cold)"*).
        *   **Tanda Bahaya Spesifik**: Gejala bahaya yang harus diwaspadai khusus untuk penyakit tersebut.
        *   **Panduan Pertolongan Pertama (Home Remedies)**: Langkah-langkah praktis dan aman yang bisa langsung Bunda lakukan (misalnya kompres hangat, asupan cairan oralit, dosis parasetamol dasar).
    *   Di bagian bawah hasil, sistem menampilkan tombol **"Simpan Catatan & Kembali ke Beranda"** serta opsi **"Cetak/Bagikan Hasil"** untuk ditunjukkan ke tenaga medis saat berkonsultasi.

---

## 2. Data State Flow

Proses pengelolaan data selama kuesioner berlangsung memanfaatkan React state dan hooks untuk melacak transisi nilai dari input formulir hingga penentuan hasil akhir.

### 2.1 State yang Digunakan

*   `selectedChildId` (string | null): Menyimpan ID anak yang sedang diperiksa.
*   `step` (number): Menyimpan langkah aktif kuesioner (1: Pilih Anak & Gejala Utama, 2: Kuesioner Detail, 3: Skrining Red Flags, 4: Halaman Hasil).
*   `selectedSymptoms` (array of strings): Daftar gejala utama yang dipilih (misalnya: `["demam", "batuk"]`).
*   `answers` (object): Kumpulan data input detail gejala (misalnya: `{"suhu": 38.5, "durasi_demam": "< 3 hari", "batuk_sesak": false}`).
*   `selectedRedFlags` (array of strings): Daftar kunci tanda bahaya darurat yang dicentang Bunda.
*   `hasNoRedFlags` (boolean): Menyimpan status pilihan eksklusif "Tidak ada tanda bahaya di atas".
*   `assessmentResult` (object | null): Menyimpan hasil akhir evaluasi berupa tingkat urgensi, penyakit tercocok, dan panduan pertolongan pertama.

### 2.2 Alur Transisi State (State Transitions)

*   **Peta Alur Transisi:**
    `[Dropdown Pilihan Anak] → [State selectedChildId diperbarui] → [Rerender Dropdown]`
    `[Checkbox Gejala Utama] → [State selectedSymptoms diperbarui] → [Validasi selectedSymptoms.length > 0] → [Tombol Lanjut Aktif]`
    `[Input Detail Kuesioner] → [State answers diperbarui] → [Validasi format angka & kelengkapan] → [Tombol Lanjut Aktif]`
    `[Checkbox Red Flags] → [State selectedRedFlags / hasNoRedFlags diperbarui] → [Tombol Lihat Hasil Aktif]`
    `[Klik Lihat Hasil] → [Kalkulasi Decision Tree & Pencocokan Penyakit] → [State assessmentResult diisi] → [Simpan ke LocalStorage] → [State step diubah ke 4]`

### 2.3 Logika Pencocokan Penyakit (Disease Matching Logic)

Sistem akan mencari kecocokan terbaik menggunakan algoritma pembobotan sederhana berbasis gejala yang dipilih:
1.  Aplikasi mengambil array data penyakit (`diseases`) dari database master lokal.
2.  Untuk setiap penyakit, sistem menghitung jumlah irisan (*intersection*) antara gejala utama yang dipilih Bunda (`selectedSymptoms`) dengan daftar gejala umum penyakit tersebut (`disease.commonSymptoms`):
    `skor_kecocokan = jumlah_gejala_terpilih_yang_cocok`
3.  Sistem menyaring dan mengurutkan penyakit berdasarkan `skor_kecocokan` dari yang tertinggi ke terendah.
4.  Penyakit dengan skor tertinggi dipilih sebagai **Penyakit Tercocok** (`matchedDisease`).
5.  *Kasus Khusus:* Jika tidak ada satu pun gejala yang cocok (skor = 0), aplikasi menggunakan objek penyakit umum bawaan *"Gejala Tidak Spesifik / Umum"* sebagai fallback.

### 2.4 Logika Penentuan Tingkat Urgensi (Urgency Evaluation Decision Tree)

Setelah penyakit tercocok didapatkan, sistem mengevaluasi kriteria klinis untuk menentukan tingkat urgensi (`urgencyLevel`):

1.  **Evaluasi Status EMERGENCY (Gawat Darurat - Merah):**
    *   JIKA `selectedRedFlags.length > 0` (Bunda mencentang salah satu tanda bahaya kritis).
    *   ATAU JIKA `answers.suhu >= 39.5` (Suhu tubuh anak sangat tinggi).
    *   ATAU JIKA `answers.diare_darah === true` (Diare disertai darah/lendir, mengarah ke disentri).
    *   ATAU JIKA `answers.muntah_terus === true` (Muntah hebat berisiko dehidrasi ekstrem).
    *   ATAU JIKA `answers.batuk_sesak === true` (Batuk disertai bunyi mengi/sesak napas nyata).
    *   *Tindakan:* Set `urgencyLevel` = `"emergency"`.

2.  **Evaluasi Status DOCTOR (Periksa Dokter - Kuning):**
    *   JIKA tidak masuk kriteria EMERGENCY, namun memenuhi kondisi berikut:
        *   `answers.durasi_demam === ">= 3 hari"` (Demam sudah berlangsung lama).
        *   ATAU `answers.diare_frekuensi === ">= 4 kali"` (Diare cukup intens).
        *   ATAU `matchedDisease.urgencyDefault === "doctor"` (Misalnya, penyakit campak atau kecurigaan DBD awal).
    *   *Tindakan:* Set `urgencyLevel` = `"doctor"`.

3.  **Evaluasi Status HOME (Perawatan Mandiri - Hijau):**
    *   JIKA tidak memenuhi semua kriteria EMERGENCY maupun DOCTOR di atas.
    *   *Tindakan:* Set `urgencyLevel` = `"home"`.

---

## 3. LocalStorage Schema Mutation

Semua hasil pemeriksaan gejala disimpan langsung ke dalam root key `"hayya_app_data"` pada array `symptomChecks`.

### 3.1 Skema JSON Sebelum Aksi (Before)
Berikut adalah kondisi `localStorage` sebelum Bunda melakukan pengecekan gejala baru untuk si kecil "Arka":

```json
{
  "users": [
    {
      "id": "e8a7d3b0-9f12-4211-85e6-bd9a5a3a2f7c",
      "phone": "081234567890",
      "pinHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "fullName": "Bunda Sari",
      "profilePhoto": "avatar_default",
      "isActive": true,
      "lastLoginAt": "2026-05-29T10:00:00.000Z",
      "createdAt": "2026-05-29T08:00:00.000Z",
      "updatedAt": "2026-05-29T10:00:00.000Z"
    }
  ],
  "children": [
    {
      "id": "c7b8d4e9-1234-5678-abcd-1234567890ab",
      "userId": "e8a7d3b0-9f12-4211-85e6-bd9a5a3a2f7c",
      "name": "Arka",
      "dateOfBirth": "2025-03-15",
      "gender": "L",
      "birthWeightKg": 3.2,
      "birthHeightCm": 50,
      "isActive": true,
      "createdAt": "2026-05-29T08:05:00.000Z"
    }
  ],
  "growthRecords": [],
  "milestones": [],
  "milestoneRecords": [],
  "vaccines": [],
  "immunizationRecords": [],
  "mpasiPlans": [],
  "mpasiRecipes": [],
  "symptomChecks": [],
  "diseases": [
    {
      "id": "d1",
      "name": "Batuk Pilek",
      "medicalName": "Common Cold",
      "description": "Infeksi virus ringan pada saluran pernapasan bagian atas.",
      "commonSymptoms": ["batuk", "demam"],
      "causes": "Rhinovirus atau virus flu ringan lainnya.",
      "homeRemedies": "Berikan banyak cairan (ASI/air putih hangat), lakukan kompres hangat di dahi jika demam ringan, gunakan balsem bayi khusus pada dada anak.",
      "warningSigns": ["Napas cepat atau sesak", "Demam tinggi melebihi 39 derajat Celcius", "Anak lemas dan menolak minum"],
      "urgencyDefault": "home"
    },
    {
      "id": "d2",
      "name": "Gastroenteritis",
      "medicalName": "Diare Akut",
      "description": "Peradangan pada lambung dan usus yang menyebabkan muntah dan diare.",
      "commonSymptoms": ["diare", "muntah", "demam"],
      "causes": "Infeksi rotavirus, bakteri, atau keracunan makanan ringan.",
      "homeRemedies": "Berikan cairan oralit setiap kali anak buang air besar, lanjutkan pemberian ASI sesering mungkin, berikan makanan lunak porsi kecil.",
      "warningSigns": ["Ubun-ubun cekung", "Mata cekung dan tidak ada air mata saat menangis", "Tidak buang air kecil lebih dari 6 jam", "Ada darah pada feses"],
      "urgencyDefault": "home"
    }
  ],
  "articles": [],
  "savedArticles": [],
  "notifications": []
}
```

### 3.2 Skema JSON Sesudah Aksi (After)
Setelah kuesioner selesai dan disimpan, riwayat pengecekan gejala berhasil ditambahkan ke array `symptomChecks` menggunakan `crypto.randomUUID()` sebagai generator ID:

```json
{
  "users": [
    {
      "id": "e8a7d3b0-9f12-4211-85e6-bd9a5a3a2f7c",
      "phone": "081234567890",
      "pinHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "fullName": "Bunda Sari",
      "profilePhoto": "avatar_default",
      "isActive": true,
      "lastLoginAt": "2026-05-29T10:00:00.000Z",
      "createdAt": "2026-05-29T08:00:00.000Z",
      "updatedAt": "2026-05-29T10:00:00.000Z"
    }
  ],
  "children": [
    {
      "id": "c7b8d4e9-1234-5678-abcd-1234567890ab",
      "userId": "e8a7d3b0-9f12-4211-85e6-bd9a5a3a2f7c",
      "name": "Arka",
      "dateOfBirth": "2025-03-15",
      "gender": "L",
      "birthWeightKg": 3.2,
      "birthHeightCm": 50,
      "isActive": true,
      "createdAt": "2026-05-29T08:05:00.000Z"
    }
  ],
  "growthRecords": [],
  "milestones": [],
  "milestoneRecords": [],
  "vaccines": [],
  "immunizationRecords": [],
  "mpasiPlans": [],
  "mpasiRecipes": [],
  "symptomChecks": [
    {
      "id": "f5b8c2e9-4321-8765-fedc-9876543210ab",
      "childId": "c7b8d4e9-1234-5678-abcd-1234567890ab",
      "symptomsSelected": ["demam", "batuk"],
      "answers": {
        "suhu": 38.5,
        "durasi_demam": "< 3 hari",
        "batuk_sesak": false
      },
      "results": {
        "diseaseId": "d1",
        "diseaseName": "Batuk Pilek",
        "medicalName": "Common Cold",
        "description": "Infeksi virus ringan pada saluran pernapasan bagian atas.",
        "homeRemedies": "Berikan banyak cairan (ASI/air putih hangat), lakukan kompres hangat di dahi jika demam ringan, gunakan balsem bayi khusus pada dada anak.",
        "warningSigns": [
          "Napas cepat atau sesak",
          "Demam tinggi melebihi 39 derajat Celcius",
          "Anak lemas dan menolak minum"
        ]
      },
      "urgencyLevel": "home",
      "checkedAt": "2026-05-29T20:45:00.000Z"
    }
  ],
  "diseases": [
    {
      "id": "d1",
      "name": "Batuk Pilek",
      "medicalName": "Common Cold",
      "description": "Infeksi virus ringan pada saluran pernapasan bagian atas.",
      "commonSymptoms": ["batuk", "demam"],
      "causes": "Rhinovirus atau virus flu ringan lainnya.",
      "homeRemedies": "Berikan banyak cairan (ASI/air putih hangat), lakukan kompres hangat di dahi jika demam ringan, gunakan balsem bayi khusus pada dada anak.",
      "warningSigns": ["Napas cepat atau sesak", "Demam tinggi melebihi 39 derajat Celcius", "Anak lemas dan menolak minum"],
      "urgencyDefault": "home"
    },
    {
      "id": "d2",
      "name": "Gastroenteritis",
      "medicalName": "Diare Akut",
      "description": "Peradangan pada lambung dan usus yang menyebabkan muntah dan diare.",
      "commonSymptoms": ["diare", "muntah", "demam"],
      "causes": "Infeksi rotavirus, bakteri, atau keracunan makanan ringan.",
      "homeRemedies": "Berikan cairan oralit setiap kali anak buang air besar, lanjutkan pemberian ASI sesering mungkin, berikan makanan lunak porsi kecil.",
      "warningSigns": ["Ubun-ubun cekung", "Mata cekung dan tidak ada air mata saat menangis", "Tidak buang air kecil lebih dari 6 jam", "Ada darah pada feses"],
      "urgencyDefault": "home"
    }
  ],
  "articles": [],
  "savedArticles": [],
  "notifications": []
}
```

### 3.3 Detail Perubahan Skema
*   **Data Ditambahkan**:
    *   Satu objek rekam medis baru diinjeksikan ke dalam array `symptomChecks`.
    *   Kunci `results` diduplikasi langsung dari data master penyakit saat pemeriksaan berlangsung. Langkah ini diambil sebagai strategi **snapshot** sehingga catatan historis pertolongan pertama atau tanda bahaya tetap akurat bagi pengguna meskipun di masa depan data master penyakit di-update.
    *   Waktu pemeriksaan dicatat menggunakan format waktu standar ISO 8601 dengan presisi tinggi (`checkedAt`).
*   **Data Diubah / Dihapus**:
    *   Tidak ada data profil anak, data ibu, atau master data penyakit yang diubah atau dihapus, menjaga integritas riwayat aplikasi tetap bersih.

---

## 4. Edge Cases & Error Handling

Untuk memastikan aplikasi berjalan dengan andal tanpa server pendukung, skenario kegagalan diantisipasi secara lokal di sisi klien:

*   **Skenario 1: Tidak Ada Gejala Utama Yang Dipilih**
    *   *Masalah*: Bunda mencoba menekan tombol "Lanjut" pada Langkah 3 tanpa mencentang satu pun gejala utama.
    *   *Penanganan*: Tombol "Lanjut" di-render dalam status `disabled` (tidak dapat diklik) apabila `selectedSymptoms.length === 0`.
    *   *Pesan UI*: Komponen form menampilkan label peringatan halus di bawah daftar gejala: *"Bunda, pilih minimal satu gejala utama si kecil yang dirasakan saat ini ya."*

*   **Skenario 2: Input Suhu Tubuh Tidak Valid atau Tidak Logis**
    *   *Masalah*: Bunda mengosongkan kolom suhu tubuh, atau mengetikkan nilai yang tidak masuk akal secara klinis (misalnya `3.8` °C atau `410` °C).
    *   *Penanganan*: Sistem melakukan validasi rentang nilai angka (float validation) pada event `onChange`. Jika input di luar rentang klinis manusia (`34.0` °C s.d. `43.0` °C), input dibatasi atau ditolak.
    *   *Pesan UI*: Teks peringatan berwarna merah muda tua muncul di bawah input suhu: *"Bunda, mohon masukkan nilai suhu tubuh yang valid di antara 34.0°C hingga 43.0°C."*

*   **Skenario 3: Pilihan Tanda Bahaya (Red Flags) yang Kontradiktif**
    *   *Masalah*: Bunda mencentang tanda bahaya darurat (misalnya "Kejang-kejang") tetapi secara bersamaan mencentang opsi "Tidak ada tanda bahaya di atas".
    *   *Penanganan*: Menggunakan logika eksklusif pada state handler checkbox. Jika Bunda mencentang "Tidak ada tanda bahaya", maka array `selectedRedFlags` otomatis dikosongkan. Sebaliknya, jika Bunda mencentang salah satu gejala darurat, tanda centang pada opsi "Tidak ada tanda bahaya" otomatis dihapus secara instan.

*   **Skenario 4: Bunda Belum Mendaftarkan Profil Anak**
    *   *Masalah*: Pengguna baru membuka fitur ini pertama kali namun belum mengisi profil anak sama sekali di menu Profil.
    *   *Penanganan*: Aplikasi mendeteksi jika panjang array `children` di LocalStorage adalah nol (`children.length === 0`). Layar kuesioner akan diblokir oleh halaman peringatan (Empty State).
    *   *Pesan UI*: *"Bunda belum mendaftarkan profil si kecil. Yuk, isi profil si kecil terlebih dahulu agar fitur pemantauan kesehatan dapat memberikan panduan yang sesuai dan tepat!"* berserta tombol aksi yang langsung mengarahkan Bunda ke halaman Tambah Profil Anak (`/dashboard/profil`).

*   **Skenario 5: LocalStorage Penuh (QuotaExceededError)**
    *   *Masalah*: Browser mengalami keterbatasan memori penyimpanan lokal sehingga gagal menyimpan catatan baru.
    *   *Penanganan*: Operasi penulisan dibungkus dalam blok `try { ... } catch (error) { ... }`. Jika kegagalan memori tertangkap, aplikasi akan menjalankan algoritma FIFO (First In First Out) dengan menghapus 3 rekam gejala terlama pada array `symptomChecks` untuk memberikan ruang bagi rekam gejala baru.
    *   *Pesan UI*: Pemberitahuan toast kecil muncul di bagian bawah: *"Penyimpanan HP Bunda disesuaikan secara otomatis agar riwayat terbaru si kecil tetap tersimpan."*

---

## 5. Dependencies dengan fitur lain (jika ada)

Meskipun berjalan terisolasi di sisi klien, fitur Symptom Checker terhubung erat secara logika dengan modul-modul lain di aplikasi Hayya:

*   **Ketergantungan Data Masuk (Inputs):**
    *   **Fitur Profil Anak (F-02)**: Membutuhkan data identitas anak (`childId`) serta tanggal lahir anak (`dateOfBirth`) dari array `children` untuk menentukan usia anak saat ini, guna memetakan kesesuaian tindakan pertolongan pertama.
    *   **Data Master Penyakit (F-10 / Seed Data)**: Bergantung pada inisialisasi awal master data `diseases` pada file `seedData.js` saat aplikasi pertama kali dibuka (`App.jsx` mount).

*   **Dampak / Efek Samping Aksi (Outputs):**
    *   **Fitur Notifikasi Lokal di Dashboard (F-03)**: Jika hasil pemeriksaan menunjukkan tingkat bahaya `emergency` or `doctor`, sistem akan memicu pembuatan entitas pemberitahuan baru di array `notifications` dengan tipe `"general"`.
    *   *Contoh isi Notifikasi:* Beranda utama Bunda akan memunculkan spanduk (banner) pengingat interaktif: *"Pantau terus kondisi Arka setelah gejala demam kemarin ya, Bunda. Segera bawa ke dokter jika tanda bahaya muncul!"*
    *   **Fitur Edukasi Parenting (F-11)**: Halaman hasil kuesioner menyaring dan menampilkan 2 referensi artikel parenting terkait dari array `articles` berdasarkan tipe penyakit yang terdeteksi (contoh: jika terdeteksi penyakit *Gastroenteritis*, sistem secara otomatis merekomendasikan artikel bertema *"Pentingnya Oralit untuk Mengatasi Diare Anak"*).
