# Alur Logika: Grafik & Tracker Pertumbuhan Anak (F-06)

Dokumen ini mendeskripsikan secara mendalam alur logika, pengelolaan state, mutasi penyimpanan data, dan penanganan kasus khusus untuk fitur **Grafik & Tracker Pertumbuhan Anak (F-06)** pada aplikasi Hayya.

---

## 1. User Action Flow

### 1.1 Navigasi & Membuka Fitur
1. Bunda menekan tombol pintas **Perkembangan** atau ikon **Grafik/Tracker Pertumbuhan** di Dashboard Utama (F-03).
2. Aplikasi mendeteksi anak aktif yang terpilih dari profil (`selectedChildId`).
   - Jika **tidak ada profil anak yang terdaftar**, aplikasi menampilkan halaman *fallback* interaktif berupa ilustrasi lucu dengan pesan: *"Wah, Bunda belum menambahkan profil si Kecil nih. Yuk, buat profil si Kecil dulu agar pertumbuhan dan perkembangannya bisa dipantau!"* dan menyediakan tombol besar "Tambah Profil Anak" (mengarahkan Bunda ke `/dashboard/profil`).
   - Jika **ada profil anak yang terdaftar**, aplikasi memuat halaman Grafik Pertumbuhan secara langsung.

### 1.2 Tampilan Utama Grafik Pertumbuhan
1. Aplikasi menampilkan informasi ringkas anak (Nama panggilan, jenis kelamin, dan usia terhitung dalam bulan dan hari secara *real-time*).
2. Terdapat bilah tab/navigasi visual untuk memilih jenis grafik yang ingin dipantau:
   - **Berat Badan (BB/U)** – Berat Badan menurut Umur
   - **Tinggi/Panjang Badan (TB/U)** – Tinggi/Panjang Badan menurut Umur
   - **Berat vs Tinggi (BB/TB)** – Berat Badan menurut Tinggi/Panjang Badan
   - **Lingkar Kepala (LK/U)** – Lingkar Kepala menurut Umur (Opsional)
3. Di bawah tab, aplikasi me-render grafik kurva pertumbuhan standar WHO berdasarkan jenis kelamin anak:
   - Grafik menampilkan 5 garis kurva standar pertumbuhan: **-3 SD** (Merah), **-2 SD** (Kuning), **0 SD/Median** (Hijau), **+2 SD** (Kuning/Hijau), dan **+3 SD** (Merah).
   - Di atas kurva standar tersebut, aplikasi meng-overlay titik-titik data riwayat pengukuran pertumbuhan nyata anak yang dihubungkan dengan garis berwarna *Rose Pink* (`#C2185B`).
4. Di bagian bawah grafik, terdapat daftar tabel/kartu **"Riwayat Pengukuran"** yang diurutkan dari tanggal terbaru ke terlama. Setiap baris riwayat menampilkan:
   - Tanggal pengukuran (`measuredAt`).
   - Angka hasil pengukuran (`weightKg`, `heightCm`, `headCircCm` jika ada).
   - Klasifikasi Z-score secara tekstual (misalnya: "Gizi Baik", "Normal", "Pendek").
   - Catatan tambahan dari Bunda (`notes`).
   - Tombol "Edit" (ikon pensil) dan "Hapus" (ikon tempat sampah).
5. Terdapat tombol utama ramah jempol berbentuk pil berwarna *Rose Pink* (`#C2185B`) dengan tinggi 52px berlabel **"Tambah Catatan Pertumbuhan"** di bagian bawah layar.

### 1.3 Alur Pengisian Formulir Pertumbuhan
1. Bunda menekan tombol **"Tambah Catatan Pertumbuhan"**.
2. Aplikasi menampilkan lembar formulir (*Modal Bottom Sheet*) berisi input berikut:
   - **Tanggal Pengukuran (`measuredAt`)**: Kolom tanggal (`input type="date"`), secara bawaan berisi tanggal hari ini (format `YYYY-MM-DD`).
   - **Berat Badan (`weightKg`)**: Kolom angka (`input type="number"` dengan langkah `0.1` dan satuan `kg`).
   - **Tinggi / Panjang Badan (`heightCm`)**: Kolom angka (`input type="number"` dengan langkah `0.1` dan satuan `cm`).
   - **Lingkar Kepala (`headCircCm`)**: Kolom angka opsional (`input type="number"` dengan langkah `0.1` dan satuan `cm`).
   - **Catatan (`notes`)**: Kolom teks opsional (`textarea` untuk menuliskan momen penting seperti *"Kimi sudah bisa merangkak, Bun!"* atau kondisi kesehatan saat diukur).
3. Selama Bunda mengetik angka, sistem di latar belakang secara *real-time* menghitung Z-score sementara untuk memberikan indikator visual instan (misalnya teks hijau berbunyi *"Status BB/U: Gizi Baik (Normal)"*).
4. Bunda menekan tombol **"Simpan Catatan"**.
5. Sistem melakukan **validasi input** secara ketat di sisi klien:
   - Mengecek apakah tanggal berada di masa depan atau sebelum tanggal lahir anak.
   - Mengecek apakah nilai BB dan TB bernilai positif dan logis secara medis (misal: BB > 0 dan di bawah 40 kg untuk anak balita).
   - Jika validasi gagal, aplikasi menampilkan pesan kesalahan berwarna merah di bawah input yang tidak valid dan membatalkan proses penyimpanan.
6. Jika validasi sukses, sistem:
   - Mengambil data lahir anak (`dateOfBirth`) dan menghitung umur presisi anak dalam bulan pada tanggal pengukuran tersebut.
   - Memanggil fungsi lookup WHO dari `growthCalculations.js` untuk menghitung nilai Z-Score dan menentukan klasifikasi status tumbuh kembang anak.
   - Menyimpan data catatan baru ke dalam array `growthRecords` pada LocalStorage root `"hayya_app_data"`.
   - Menambahkan notifikasi baru ke array `notifications` sebagai log aktivitas dan feedback hasil tumbuh kembang.
   - Menampilkan notifikasi melayang (*Toast Success*) berbunyi: *"Catatan pertumbuhan si Kecil berhasil disimpan, Bunda!"*.
   - Menutup modal input.
   - Memperbarui state komponen untuk me-render ulang grafik dan daftar riwayat dengan data terbaru.

---

## 2. Data State Flow

### 2.1 Deklarasi State React (dalam komponen / hooks)

- **`selectedChildId` (String / State global)**
  Menyimpan ID anak aktif yang sedang dipilih untuk dipantau pertumbuhannya.
- **`activeTab` (String)**
  Menentukan grafik yang aktif ditampilkan di layar.
  *Nilai:* `"BBU"` | `"TBU"` | `"BBTB"` | `"LKU"`. *Default:* `"BBU"`.
- **`growthRecords` (Array of Objects)**
  Menyimpan riwayat pertumbuhan anak aktif.
  *Format:* Array objek yang difilter dari LocalStorage berdasarkan `childId` anak aktif dan diurutkan secara menaik (ascending) berdasarkan `measuredAt`.
- **`showFormModal` (Boolean)**
  Mengontrol visibilitas modal formulir tambah/edit catatan pertumbuhan.
  *Default:* `false`.
- **`editingRecordId` (String | null)**
  Menyimpan ID catatan pertumbuhan yang sedang diedit. Bernilai `null` jika Bunda sedang menambah catatan baru.
- **`formData` (Object)**
  Menyimpan nilai input formulir yang sedang diisi oleh Bunda.
  *Struktur:*
  ```js
  {
    measuredAt: "YYYY-MM-DD", // default: tanggal hari ini
    weightKg: "",
    heightCm: "",
    headCircCm: "",
    notes: ""
  }
  ```
- **`formErrors` (Object)**
  Menyimpan pesan kesalahan validasi per bidang input.
  *Struktur:* `{ measuredAt?: string, weightKg?: string, heightCm?: string }`
- **`calculatedPreview` (Object | null)**
  Menyimpan hasil perhitungan Z-Score dan klasifikasi secara real-time saat Bunda mengetik di form untuk preview visual.

### 2.2 Alur Perubahan State (Data State Transitions)

Berikut adalah representasi alur perpindahan state untuk skenario-skenario utama:

#### A. Inisialisasi Layar & Membaca Data
`[Komponen Mount / selectedChildId berubah]` 
  `→ [useEffect memanggil useGrowth.getRecordsByChild(childId)]` 
  `→ [Mengambil data mentah dari LocalStorage]`
  `→ [Melakukan pengurutan data berdasarkan tanggal ascending]`
  `→ [State Update: setGrowthRecords(sortedRecords)]` 
  `→ [Rerender UI: Grafik & Riwayat Pengukuran dimuat]`

#### B. Pengisian Formulir & Preview Real-Time
`[Bunda mengetik di Input Berat/Tinggi]` 
  `→ [onChange memicu setFormData(prev => ({ ...prev, weightKg: value }))]` 
  `→ [useEffect mendeteksi perubahan formData]`
  `→ [Memvalidasi apakah input angka dasar valid]`
  `→ [Jika valid: memanggil growthCalculations.js untuk menghitung Z-score instan]`
  `→ [State Update: setCalculatedPreview(scores)]` 
  `→ [Rerender UI: Menampilkan teks indikator status gizi di bawah form]`

#### C. Proses Penyimpanan Data Baru (Submit Form)
`[Bunda menekan tombol Simpan]` 
  `→ [Fungsi onSubmit memicu pengecekan validasi menyeluruh]`
  `→ [Jika validasi Gagal: State Update setFormErrors(errors) → Rerender UI menampilkan pesan error di tiap input]`
  `→ [Jika validasi Sukses: Memanggil useGrowth.addRecord(childId, newRecord)]`
  `→ [Membaca data root "hayya_app_data" dari LocalStorage]`
  `→ [Generate UUID untuk id baru via crypto.randomUUID() & buat timestamp createdAt]`
  `→ [Dorong (push) record baru ke array growthRecords]`
  `→ [Menghitung hasil akhir status gizi untuk pesan feedback]`
  `→ [Dorong (push) notifikasi hasil tumbuh kembang ke array notifications]`
  `→ [Menyimpan kembali objek root JSON ke LocalStorage]`
  `→ [State Update: setGrowthRecords(updatedRecords), setOpenModal(false), resetFormData()]`
  `→ [Rerender UI: Grafik ter-update otomatis, modal tertutup, muncul Toast Sukses]`

---

## 3. LocalStorage Schema Mutation

Semua data tersimpan secara terpusat pada satu kunci LocalStorage bernama `"hayya_app_data"`.

### 3.1 Keadaan Sebelum Penambahan Catatan Pertumbuhan Baru

Pada keadaan awal, aplikasi telah memuat data akun Bunda (Bunda Sari) dan satu profil anak bernama **Kimi** (lahir tanggal 29 November 2025). Terdapat satu data pertumbuhan lahir (usia 0 bulan) yang sudah ada di sistem.

```json
{
  "users": [
    {
      "id": "a9a8f4c1-4b1d-44a6-89de-d93d56ef3724",
      "phone": "081234567890",
      "pinHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "fullName": "Bunda Sari",
      "profilePhoto": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP...",
      "district": "Cicendo",
      "regency": "Bandung",
      "province": "Jawa Barat",
      "isActive": true,
      "lastLoginAt": "2026-05-29T19:00:00.000Z",
      "createdAt": "2026-05-01T08:00:00.000Z",
      "updatedAt": "2026-05-29T19:00:00.000Z"
    }
  ],
  "children": [
    {
      "id": "c1f71d53-bc2a-4db5-b3e1-d2424cf3b55c",
      "userId": "a9a8f4c1-4b1d-44a6-89de-d93d56ef3724",
      "name": "Kimi",
      "dateOfBirth": "2025-11-29",
      "gender": "L",
      "birthWeightKg": 3.2,
      "birthHeightCm": 49.0,
      "bloodType": "O",
      "photoUrl": "",
      "isActive": true,
      "createdAt": "2025-11-29T10:00:00.000Z"
    }
  ],
  "growthRecords": [
    {
      "id": "4e1837c7-5c2f-48d8-9dbd-0cf9ffb8b2e1",
      "childId": "c1f71d53-bc2a-4db5-b3e1-d2424cf3b55c",
      "measuredAt": "2025-11-29",
      "weightKg": 3.2,
      "heightCm": 49.0,
      "headCircCm": 34.0,
      "notes": "Berat dan tinggi lahir si Kecil Kimi",
      "createdAt": "2025-11-29T10:00:00.000Z"
    }
  ],
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

### 3.2 Keadaan Setelah Penambahan Catatan Pertumbuhan Baru (Tanggal Pengukuran: 29 Mei 2026 / Usia 6 Bulan)

Bunda menambahkan data pengukuran baru untuk Kimi pada tanggal 29 Mei 2026 (Kimi berumur tepat 6 bulan) dengan detail:
- Berat badan: **7.8 kg**
- Tinggi badan: **67.6 cm**
- Lingkar kepala: **43.5 cm**
- Catatan: *"Kimi sudah bisa duduk sendiri sebentar, Bun!"*

Sistem melakukan mutasi data dengan:
1. Membuat `id` unik acak untuk data pertumbuhan: `8b51d3ae-6622-4911-aa95-46fd63bde7e6` menggunakan `crypto.randomUUID()`.
2. Menyimpan data pertumbuhan tersebut ke array `growthRecords` dengan referensi `childId: "c1f71d53-bc2a-4db5-b3e1-d2424cf3b55c"`.
3. Menghitung klasifikasi status pertumbuhan berdasarkan data WHO L, M, S untuk bayi laki-laki usia 6 bulan di `growthCalculations.js` secara *on-the-fly*.
4. Menambahkan notifikasi baru ke array `notifications` terkait perkembangan Kimi dengan tipe `"growth"`.

```json
{
  "users": [
    {
      "id": "a9a8f4c1-4b1d-44a6-89de-d93d56ef3724",
      "phone": "081234567890",
      "pinHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "fullName": "Bunda Sari",
      "profilePhoto": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP...",
      "district": "Cicendo",
      "regency": "Bandung",
      "province": "Jawa Barat",
      "isActive": true,
      "lastLoginAt": "2026-05-29T19:00:00.000Z",
      "createdAt": "2026-05-01T08:00:00.000Z",
      "updatedAt": "2026-05-29T19:00:00.000Z"
    }
  ],
  "children": [
    {
      "id": "c1f71d53-bc2a-4db5-b3e1-d2424cf3b55c",
      "userId": "a9a8f4c1-4b1d-44a6-89de-d93d56ef3724",
      "name": "Kimi",
      "dateOfBirth": "2025-11-29",
      "gender": "L",
      "birthWeightKg": 3.2,
      "birthHeightCm": 49.0,
      "bloodType": "O",
      "photoUrl": "",
      "isActive": true,
      "createdAt": "2025-11-29T10:00:00.000Z"
    }
  ],
  "growthRecords": [
    {
      "id": "4e1837c7-5c2f-48d8-9dbd-0cf9ffb8b2e1",
      "childId": "c1f71d53-bc2a-4db5-b3e1-d2424cf3b55c",
      "measuredAt": "2025-11-29",
      "weightKg": 3.2,
      "heightCm": 49.0,
      "headCircCm": 34.0,
      "notes": "Berat dan tinggi lahir si Kecil Kimi",
      "createdAt": "2025-11-29T10:00:00.000Z"
    },
    {
      "id": "8b51d3ae-6622-4911-aa95-46fd63bde7e6",
      "childId": "c1f71d53-bc2a-4db5-b3e1-d2424cf3b55c",
      "measuredAt": "2026-05-29",
      "weightKg": 7.8,
      "heightCm": 67.6,
      "headCircCm": 43.5,
      "notes": "Kimi sudah bisa duduk sendiri sebentar, Bun!",
      "createdAt": "2026-05-29T20:35:41.000Z"
    }
  ],
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
  "notifications": [
    {
      "id": "f5b8a07c-3f44-486d-bfce-4c129e92b8d0",
      "userId": "a9a8f4c1-4b1d-44a6-89de-d93d56ef3724",
      "type": "growth",
      "title": "Pertumbuhan Kimi",
      "body": "Catatan pertumbuhan Kimi tanggal 29 Mei 2026 berhasil disimpan dengan status Gizi Baik (Normal). Kerja bagus, Bunda!",
      "isRead": false,
      "scheduledAt": "2026-05-29T20:35:41.000Z",
      "referenceId": "8b51d3ae-6622-4911-aa95-46fd63bde7e6",
      "createdAt": "2026-05-29T20:35:41.000Z"
    }
  ]
}
```

---

## 4. Edge Cases & Error Handling

Bagian ini mendeskripsikan skenario kegagalan pengisian data atau anomali kondisi aplikasi beserta bentuk penanganannya secara visual dan logis agar tidak merusak pengalaman pengguna Bunda.

### 4.1 Input Kosong pada Field Wajib
*   **Kasus:** Bunda mengosongkan nilai Berat Badan (`weightKg`), Tinggi Badan (`heightCm`), atau Tanggal Pengukuran (`measuredAt`) saat mencoba menekan tombol "Simpan Catatan".
*   **Penanganan UI:** Form diblokir untuk submit. Di bawah masing-masing elemen formulir yang kosong akan muncul teks panduan berwarna merah:
    *   *“Tanggal pengukuran wajib diisi ya, Bunda.”*
    *   *“Berat badan si Kecil tidak boleh kosong, Bunda.”*
    *   *“Tinggi badan si Kecil tidak boleh kosong, Bunda.”*
*   **Penanganan State:** State `formErrors` akan diperbarui dengan properti bidang terkait yang kosong, memicu fokus *keyboard* otomatis ke bidang kosong pertama.

### 4.2 Nilai Angka Tidak Logis (Anomali Nilai Medis Balita)
*   **Kasus:** Bunda salah mengetik angka yang secara klinis tidak wajar untuk rentang usia anak balita (0-5 tahun). Contoh: Berat badan diisi `78 kg` (seharusnya `7.8 kg`), atau berat badan diisi `0 kg` atau nilai negatif.
*   **Penanganan Validasi:** Sistem menerapkan batasan angka yang logis untuk perlindungan kesalahan ketik (*Typo Protection*):
    *   **Berat Badan (`weightKg`):** Wajib berada di rentang **1.0 kg** sampai dengan **40.0 kg**.
    *   **Tinggi/Panjang Badan (`heightCm`):** Wajib berada di rentang **30.0 cm** sampai dengan **130.0 cm**.
    *   **Lingkar Kepala (`headCircCm`):** Jika diisi, wajib berada di rentang **25.0 cm** sampai dengan **60.0 cm**.
*   **Penanganan UI:** Memunculkan *Inline Error Notification*: *"Waduh, berat/tinggi badan si Kecil sepertinya tidak sesuai dengan rentang wajar anak usia 0-5 tahun. Tolong cek kembali ya, Bun!"*.

### 4.3 Tanggal Pengukuran di Masa Depan
*   **Kasus:** Bunda memilih tanggal pengukuran pada hari esok atau tanggal lain di masa depan.
*   **Penanganan Validasi:** Membandingkan nilai `measuredAt` dengan tanggal lokal hari ini menggunakan perbandingan string `YYYY-MM-DD` atau milidetik objek `Date`.
*   **Penanganan UI:** Kolom tanggal menampilkan warna merah terang dengan pesan error: *"Ups, Bunda tidak bisa mencatat pertumbuhan untuk tanggal di masa depan."*.

### 4.4 Tanggal Pengukuran Mendahului Tanggal Lahir Anak
*   **Kasus:** Kimi lahir pada `2025-11-29`, namun Bunda mencatat pengukuran pada tanggal `2025-11-10`.
*   **Penanganan Validasi:** Mengecek apakah string `measuredAt` secara leksikografis lebih kecil daripada `children.dateOfBirth`.
*   **Penanganan UI:** Menolak input dan memberikan notifikasi: *"Tanggal pengukuran tidak boleh mendahului tanggal lahir si Kecil ({dateOfBirth}), Bunda. Tolong disesuaikan kembali ya!"*.

### 4.5 Duplikasi Data Pengukuran pada Tanggal yang Sama
*   **Kasus:** Bunda sudah pernah mencatat pertumbuhan anak untuk tanggal `2026-05-29`, lalu secara tidak sengaja mencoba menambahkan catatan pertumbuhan baru lagi pada tanggal yang sama.
*   **Penanganan Validasi:** Sebelum menambahkan catatan baru, *custom hook* `useGrowth` memindai array `growthRecords` dengan kondisi `childId === activeChildId && measuredAt === inputMeasuredAt`.
*   **Penanganan UI:** Sistem mendeteksi adanya duplikasi data dan memunculkan kotak dialog konfirmasi khusus: *"Bunda sudah pernah mencatat pertumbuhan si Kecil pada tanggal ini. Apakah Bunda ingin memperbarui (overwrite) catatan yang sudah ada dengan data baru ini?"*.
    *   Jika Bunda memilih **"Ya, Perbarui"**, sistem akan memperbarui isi objek catatan lama yang cocok dan mempertahankan `id` lama (Update operasi).
    *   Jika Bunda memilih **"Batal"**, sistem akan mengembalikan fokus ke form dan membiarkan Bunda mengubah tanggal pengukuran.

### 4.6 Batas Maksimal Penyimpanan LocalStorage Terlampaui
*   **Kasus:** Penyimpanan LocalStorage perangkat Bunda sudah penuh (kuota ~5MB terlampaui karena aplikasi lain atau data cache browser yang menumpuk).
*   **Penanganan Logika:** Blok `try-catch` membungkus setiap operasi penulisan `localStorage.setItem`.
*   **Penanganan UI:** Jika terjadi error `DOMException` berupa `"QuotaExceededError"`, aplikasi akan menangkapnya secara aman, mengagalkan penyimpanan sementara, dan menampilkan modal peringatan ramah: *"Aduh, memori penyimpanan browser di HP Bunda sedang penuh nih. Yuk coba bersihkan cache browser Bunda terlebih dahulu agar data pertumbuhan si Kecil bisa tersimpan dengan aman!"*.

---

## 5. Dependencies dengan fitur lain (jika ada)

Meskipun beroperasi secara 100% lokal, fitur Grafik & Tracker Pertumbuhan (F-06) memiliki ketergantungan yang erat dan saling memengaruhi beberapa fitur lain dalam aplikasi Hayya:

### 5.1 Ketergantungan Masuk (Incoming Dependencies)
*   **Profil Anak (F-02):**
    *   Grafik pertumbuhan mutlak memerlukan data profil anak aktif, terutama field **`gender`** ("L"/"P") dan **`dateOfBirth`** ("YYYY-MM-DD").
    *   Jenis kelamin menentukan pustaka data WHO mana yang akan dibaca oleh `growthCalculations.js` (Kurva anak laki-laki dan perempuan memiliki nilai standar deviasi yang berbeda).
    *   Tanggal lahir digunakan sebagai dasar pembagi untuk menghitung usia anak dalam bulan secara dinamis saat melakukan kalkulasi Z-score.
*   **Master Data / Seed Data (F-00):**
    *   `growthCalculations.js` bergantung pada ketersediaan data tabel referensi standar WHO (Median, +2SD, -2SD, dll) yang dimuat di memori klien sebagai konstanta statis atau di-*seed* di awal.

### 5.2 Ketergantungan Keluar (Outgoing Dependencies / Side-Effects)
*   **In-App Notification (F-03):**
    *   Setiap kali catatan pertumbuhan disimpan, sistem secara otomatis menambahkan log ke dalam array `notifications` di LocalStorage.
    *   Jika status gizi anak terdeteksi mengalami anomali serius (misal: "Sangat Kurang" pada BB/U atau "Gizi Buruk" pada BB/TB), sistem akan melontarkan notifikasi lokal bertipe `"growth"` dengan pesan edukatif penting: *"Bunda, grafik pertumbuhan si Kecil menunjukkan indikator merah (Gizi Kurang/Buruk). Yuk, pastikan asupan gizinya cukup dan segera jadwalkan konsultasi dengan bidan atau dokter anak terdekat ya!"*.
*   **Symptom Checker / Cek Gejala Anak (F-10):**
    *   Fitur Symptom Checker (F-10) membutuhkan data **berat badan terakhir** anak dari `growthRecords` untuk memberikan kalkulasi otomatis mengenai dosis obat bebas dasar anak yang aman (misalnya: dosis sirup parasetamol penurun demam yang dihitung secara akurat dalam satuan ml berdasarkan rentang berat badan anak). Bunda tidak perlu menginput berat badan anak secara manual lagi di fitur Gejala jika data di Grafik Pertumbuhan sudah ter-update.
*   **Meal Plan & Resep MPASI (F-08):**
    *   Jika status Z-score BB/U anak menunjukkan hasil "Kurang" atau "Sangat Kurang" selama 2 bulan berturut-turut, fitur Generator MPASI (F-08) akan secara proaktif menyesuaikan algoritma generator lokalnya untuk memprioritaskan rekomendasi resep MPASI kategori "Tinggi Kalori & Protein" (BB Booster) dari bank resep `mpasiRecipes` guna mendukung pemulihan berat badan si Kecil secara optimal.
