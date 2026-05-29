# Logic Flow: Tracker & Kalender Imunisasi (F-07)

Dokumen ini menjelaskan alur logika, pergerakan state, mutasi schema LocalStorage, penanganan edge cases, serta dependensi antarmuka untuk fitur Tracker & Kalender Imunisasi (F-07) pada aplikasi Hayya.

---

## 1. User Action Flow

Berikut adalah langkah-langkah pengalaman Bunda saat menggunakan fitur Tracker & Kalender Imunisasi, dari proses inisialisasi hingga pencatatan realisasi dan penerimaan notifikasi.

### 1.1 Inisialisasi Kalender Imunisasi (Pertama Kali)
- **Pemicu A (Pendaftaran Anak Baru):** Bunda berhasil mendaftarkan profil anak baru melalui formulir profil anak.
- **Pemicu B (Muat Ulang Halaman Imunisasi):** Bunda membuka halaman Imunisasi untuk profil anak yang baru dibuat tetapi record-nya belum diinisialisasi secara lokal.
- **Validasi Awal:** Sistem mendeteksi `dateOfBirth` anak dan mengambil daftar master `vaccines` (12 vaksin utama) dari seed data.
- **Proses Logika:**
  - Sistem mengulangi setiap vaksin dalam daftar seed `vaccines`.
  - Berdasarkan `recommendedAgeMonths` masing-masing vaksin, sistem menghitung tanggal target imunisasi (`scheduledDate`) dengan menjumlahkan usia anjuran (dalam bulan) ke `dateOfBirth` anak.
  - Untuk setiap vaksin, sistem menggenerasikan ID baru dengan `crypto.randomUUID()`.
- **Feedback UI:** Kalender imunisasi anak langsung terbentuk di layar dengan daftar vaksin yang diurutkan secara kronologis berdasarkan `scheduledDate`.

### 1.2 Navigasi & Filter Halaman Imunisasi
- **Masuk Menu:** Bunda menekan ikon **Imunisasi** di BottomNav.
- **Deteksi Anak Aktif:** Sistem mendeteksi profil anak aktif yang sedang dipilih (jika ada lebih dari 1 anak). Jika belum ada anak aktif, sistem meminta Bunda memilih profil anak terlebih dahulu di layar pop-up/pilihan anak.
- **Filter Tampilan:** Halaman menyediakan tab filter ramah jempol (minimal 44x44px):
  - **Semua**: Menampilkan seluruh 12 imunisasi.
  - **Belum Imunisasi**: Menampilkan imunisasi dengan status `scheduled` atau `late` (terlambat).
  - **Sudah Imunisasi**: Menampilkan imunisasi dengan status `done` (selesai).
- **Indikator Visual:** 
  - Vaksin yang terlambat diberi tanda seru merah/pink tua (`#C2185B`) dengan tulisan "Terlambat".
  - Vaksin yang terdekat berikutnya ditandai dengan badge "Akan Datang".
  - Vaksin yang sudah selesai ditandai dengan centang hijau (`#00897B`) "Selesai".

### 1.3 Mencatat Realisasi Imunisasi (Mark as Completed)
- **Buka Form Detail:** Bunda mengklik kartu salah satu vaksin yang belum diimunisasi (misal: "BCG").
- **Tampilan Drawer/Modal:** Drawer bawah meluncur naik secara halus, menampilkan informasi lengkap vaksin:
    - Nama Vaksin (contoh: *Bacillus Calmette-Guérin*)
    - Dosis ke-berapa
    - Deskripsi & kegunaan vaksin
    - Informasi Efek Samping (KIPI) yang umum
- **Mengisi Data Pemberian:** Bunda melengkapi formulir dengan input berikut:
  - **Tanggal Pemberian (`actualDate`):** Kolom tanggal terisi otomatis dengan hari ini sebagai default, tetapi bisa diubah oleh Bunda.
  - **Lokasi Pemberian (`location`):** Tempat imunisasi diberikan (misal: "Puskesmas Melati").
  - **Tenaga Kesehatan (`healthcareWorker`):** Nama bidan atau dokter yang menyuntik (misal: "Bidan Yuni").
  - **Catatan Efek Samping (`sideEffectsNoted` / KIPI):** Gejala pasca-vaksinasi jika ada (misal: "Demam hangat di malam hari").
- **Proses Simpan:** Bunda menekan tombol pill berwarna Rose Pink (`#C2185B`) berlabel **"Simpan Catatan Imunisasi"**.
- **Validasi Input:** 
  - Sistem memeriksa apakah `actualDate` yang diinput tidak di masa depan (tidak boleh > hari ini).
  - Sistem memeriksa apakah `actualDate` tidak sebelum tanggal lahir anak (`actualDate` < `dateOfBirth`).
- **Feedback & Rerender:** 
  - Jika valid, record diperbarui di LocalStorage dan status berubah dari `scheduled` menjadi `done`.
  - Timbul alert kesuksesan yang ramah: *"Yeay! Imunisasi BCG untuk si Kecil berhasil dicatat. Semoga sehat selalu ya, Bunda! 🧡"*.
  - Modal/Drawer tertutup otomatis, persentase cakupan imunisasi anak di UI ter-update (misal: naik dari 8% menjadi 16%).

### 1.4 Penerimaan Notifikasi Pengingat
- **Pemicu Scan:** Setiap kali aplikasi dibuka atau saat inisialisasi, sistem memindai `immunizationRecords` untuk anak aktif yang berstatus `"scheduled"`.
- **Pemeriksaan Jadwal:**
  - Jika ada vaksin dengan `scheduledDate` berjarak $\le$ 7 hari dari tanggal saat ini (atau jika sudah terlewat namun belum dicatat `"done"`), sistem memeriksa apakah sudah ada objek pengingat di array `notifications` untuk record tersebut.
  - Jika belum ada, sistem membuat objek pengingat baru di `notifications` dengan isi pesan persuasif dan status `isRead: false`.
- **Tampilan di UI:** Saat Bunda membuka halaman Dashboard/Beranda, sistem memunculkan banner pengingat berwarna Soft Pink (`#F06292`): *"Bunda, jadwal imunisasi BCG untuk Al Fatih mendekati tanggal target (10 Mei 2026). Yuk persiapkan kunjungan ke Posyandu atau Klinik!"*.

---

## 2. Data State Flow

Proses perpindahan data dan pembaruan UI (UI Rerender) diatur sepenuhnya melalui custom hook `useImmunization` dan disalurkan ke state lokal komponen halaman.

### 2.1 State Variables yang Digunakan
1. `activeChild` (Object | null): Menyimpan informasi anak yang aktif (diperoleh dari `useChild`).
2. `immunizationRecords` (Array of Objects): Daftar riwayat vaksinasi untuk `activeChild` yang ditarik dari LocalStorage.
3. `filterTab` (String): Mengontrol penyaringan tampilan (`"all"`, `"pending"`, `"completed"`).
4. `selectedRecord` (Object | null): Record imunisasi spesifik yang sedang dibuka di modal/drawer pengisian detail.
5. `formData` (Object): Menyimpan state input dari modal form:
   - `actualDate` (String YYYY-MM-DD)
   - `location` (String)
   - `healthcareWorker` (String)
   - `sideEffectsNoted` (String)
6. `formError` (String | null): Menyimpan pesan kesalahan jika validasi input form gagal.
7. `isSubmitting` (Boolean): Status loading ketika memperbarui LocalStorage.

### 2.2 Hubungan Aliran Data (State Transitions)

#### A. Inisialisasi & Pemuatan Kalender
```
[Halaman Dimuat / Pilihan Anak Aktif] 
  ↓
[Baca key "hayya_app_data" dari LocalStorage]
  ↓
[Filter "immunizationRecords" berdasarkan childId]
  ↓
[Cek Apakah Data Kosong?]
  ├─► (Ya)  → [Loop 12 Master Vaccines] → [Generate scheduledDate & UUID] → [Simpan ke LocalStorage] → [Set state "immunizationRecords"]
  └─► (Tidak) → [Set state "immunizationRecords"]
  ↓
[Gabungkan tiap record dengan Master "vaccines" via vaccineId]
  ↓
[Rerender UI: Tampilkan Daftar Kalender Kronologis]
```

#### B. Pengisian & Pembaruan Catatan Imunisasi
```
[Bunda Mengklik Vaksin] → [Set selectedRecord = record] → [Tampilkan Modal & Set formData default]
  ↓
[Bunda Mengisi Form & Klik Simpan]
  ↓
[Validasi Form]:
  ├─► (actualDate > Hari Ini ATAU < Lahir) → [Set formError = "Pesan Error"] → [Tampilkan Error di UI]
  └─► (Valid) → [Set isSubmitting = true] → [Clear formError]
  ↓
[Pembaruan LocalStorage]:
  - Ubah status "scheduled" menjadi "done"
  - Sisipkan actualDate, location, healthcareWorker, sideEffectsNoted
  - Set updatedAt = ISO 8601 String
  ↓
[Tulis Objek Baru ke "hayya_app_data" root key]
  ↓
[Perbarui state "immunizationRecords" secara lokal] → [Set selectedRecord = null] → [Set isSubmitting = false]
  ↓
[Rerender UI: Tampilkan Status Centang Hijau & Update Persentase Progress]
```

#### C. Penjadwalan & Trigger Notifikasi
```
[App Mount / Login] → [Dapatkan tanggal hari ini (currentDate)]
  ↓
[Filter "immunizationRecords" status "scheduled" & targetDate <= currentDate + 7 hari]
  ↓
[Cek di array "notifications" apakah ada referenceId === record.id?]
  ├─► (Sudah Ada) → [Lewati]
  └─► (Belum Ada) → [Generate notification baru: crypto.randomUUID()]
  ↓
[Tulis Notifikasi Baru ke "notifications" array di LocalStorage]
  ↓
[Dashboard memuat unread notifications] → [Tampilkan Banner Notifikasi kepada Bunda]
```

---

## 3. LocalStorage Schema Mutation

Berikut adalah struktur JSON `"hayya_app_data"` sebelum dan sesudah Bunda mencatat realisasi vaksinasi BCG dan memicu pengingat notifikasi untuk dosis berikutnya.

### 3.1 Sebelum Aksi (Keadaan Awal)
*Anak "Al Fatih" berusia 1 bulan 19 hari (Lahir 10 April 2026). Vaksin Hepatitis B 1 sudah selesai dicatat pada saat lahir, sedangkan vaksin BCG (target 10 Mei 2026) statusnya masih `"scheduled"` (terlambat per 29 Mei 2026).*

```json
{
  "users": [
    {
      "id": "a1a8c3d7-21a4-4a29-b001-f09b552d58a1",
      "phone": "081234567890",
      "pinHash": "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",
      "fullName": "Bunda Sari",
      "profilePhoto": "avatar_default.png",
      "isActive": true,
      "lastLoginAt": "2026-05-29T20:30:00.000Z",
      "createdAt": "2026-05-29T20:00:00.000Z",
      "updatedAt": "2026-05-29T20:30:00.000Z"
    }
  ],
  "children": [
    {
      "id": "c5c7d81a-4c28-4b71-bf3d-271d1889ab8a",
      "userId": "a1a8c3d7-21a4-4a29-b001-f09b552d58a1",
      "name": "Al Fatih",
      "dateOfBirth": "2026-04-10",
      "gender": "L",
      "birthWeightKg": 3.2,
      "birthHeightCm": 50,
      "isActive": true,
      "createdAt": "2026-05-29T20:10:00.000Z"
    }
  ],
  "vaccines": [
    {
      "id": "v-hep-b-1",
      "name": "Hepatitis B Dosis 1",
      "shortName": "Hep B 1",
      "description": "Mencegah infeksi virus Hepatitis B yang menyerang organ hati.",
      "recommendedAgeMonths": 0,
      "doseNumber": 1,
      "sideEffectsInfo": "Nyeri atau kemerahan di bekas suntikan, demam ringan."
    },
    {
      "id": "v-bcg",
      "name": "Bacillus Calmette-Guérin",
      "shortName": "BCG",
      "description": "Mencegah tuberkulosis (TBC) berat seperti meningitis TBC.",
      "recommendedAgeMonths": 1,
      "doseNumber": 1,
      "sideEffectsInfo": "Muncul bisul kecil di bekas suntikan setelah 2-6 minggu."
    },
    {
      "id": "v-dpt-1",
      "name": "DPT-HB-Hib Dosis 1",
      "shortName": "DPT-HB-Hib 1",
      "description": "Mencegah Difteri, Pertusis, Tetanus, Hepatitis B, serta Meningitis & Pneumonia akibat Hib.",
      "recommendedAgeMonths": 2,
      "doseNumber": 1,
      "sideEffectsInfo": "Demam tinggi, rewel, kemerahan di area suntikan."
    }
  ],
  "immunizationRecords": [
    {
      "id": "rec-hep-b-1-uuid",
      "childId": "c5c7d81a-4c28-4b71-bf3d-271d1889ab8a",
      "vaccineId": "v-hep-b-1",
      "status": "done",
      "scheduledDate": "2026-04-10",
      "actualDate": "2026-04-10",
      "location": "RSIA Kasih Ibu",
      "healthcareWorker": "dr. Dian, Sp.A",
      "sideEffectsNoted": "Tidak ada efek samping",
      "updatedAt": "2026-04-10T09:00:00.000Z"
    },
    {
      "id": "rec-bcg-uuid",
      "childId": "c5c7d81a-4c28-4b71-bf3d-271d1889ab8a",
      "vaccineId": "v-bcg",
      "status": "scheduled",
      "scheduledDate": "2026-05-10",
      "updatedAt": "2026-05-29T20:10:00.000Z"
    },
    {
      "id": "rec-dpt-1-uuid",
      "childId": "c5c7d81a-4c28-4b71-bf3d-271d1889ab8a",
      "vaccineId": "v-dpt-1",
      "status": "scheduled",
      "scheduledDate": "2026-06-10",
      "updatedAt": "2026-05-29T20:10:00.000Z"
    }
  ],
  "notifications": []
}
```

### 3.2 Sesudah Aksi (Keadaan Terkini)
*Bunda Sari melengkapi catatan BCG pada 29 Mei 2026. Di saat yang sama, karena vaksin DPT-HB-Hib 1 (target 10 Juni 2026) berjarak 12 hari (mendekati target H-7 jika dipercepat pengingatnya atau karena proses evaluasi berkala), sebuah notifikasi peringatan baru dijadwalkan secara otomatis ke dalam array `notifications`.*

```json
{
  "users": [
    {
      "id": "a1a8c3d7-21a4-4a29-b001-f09b552d58a1",
      "phone": "081234567890",
      "pinHash": "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",
      "fullName": "Bunda Sari",
      "profilePhoto": "avatar_default.png",
      "isActive": true,
      "lastLoginAt": "2026-05-29T20:30:00.000Z",
      "createdAt": "2026-05-29T20:00:00.000Z",
      "updatedAt": "2026-05-29T20:30:00.000Z"
    }
  ],
  "children": [
    {
      "id": "c5c7d81a-4c28-4b71-bf3d-271d1889ab8a",
      "userId": "a1a8c3d7-21a4-4a29-b001-f09b552d58a1",
      "name": "Al Fatih",
      "dateOfBirth": "2026-04-10",
      "gender": "L",
      "birthWeightKg": 3.2,
      "birthHeightCm": 50,
      "isActive": true,
      "createdAt": "2026-05-29T20:10:00.000Z"
    }
  ],
  "vaccines": [
    {
      "id": "v-hep-b-1",
      "name": "Hepatitis B Dosis 1",
      "shortName": "Hep B 1",
      "description": "Mencegah infeksi virus Hepatitis B yang menyerang organ hati.",
      "recommendedAgeMonths": 0,
      "doseNumber": 1,
      "sideEffectsInfo": "Nyeri atau kemerahan di bekas suntikan, demam ringan."
    },
    {
      "id": "v-bcg",
      "name": "Bacillus Calmette-Guérin",
      "shortName": "BCG",
      "description": "Mencegah tuberkulosis (TBC) berat seperti meningitis TBC.",
      "recommendedAgeMonths": 1,
      "doseNumber": 1,
      "sideEffectsInfo": "Muncul bisul kecil di bekas suntikan setelah 2-6 minggu."
    },
    {
      "id": "v-dpt-1",
      "name": "DPT-HB-Hib Dosis 1",
      "shortName": "DPT-HB-Hib 1",
      "description": "Mencegah Difteri, Pertusis, Tetanus, Hepatitis B, serta Meningitis & Pneumonia akibat Hib.",
      "recommendedAgeMonths": 2,
      "doseNumber": 1,
      "sideEffectsInfo": "Demam tinggi, rewel, kemerahan di area suntikan."
    }
  ],
  "immunizationRecords": [
    {
      "id": "rec-hep-b-1-uuid",
      "childId": "c5c7d81a-4c28-4b71-bf3d-271d1889ab8a",
      "vaccineId": "v-hep-b-1",
      "status": "done",
      "scheduledDate": "2026-04-10",
      "actualDate": "2026-04-10",
      "location": "RSIA Kasih Ibu",
      "healthcareWorker": "dr. Dian, Sp.A",
      "sideEffectsNoted": "Tidak ada efek samping",
      "updatedAt": "2026-04-10T09:00:00.000Z"
    },
    {
      "id": "rec-bcg-uuid",
      "childId": "c5c7d81a-4c28-4b71-bf3d-271d1889ab8a",
      "vaccineId": "v-bcg",
      "status": "done",
      "scheduledDate": "2026-05-10",
      "actualDate": "2026-05-29",
      "location": "Puskesmas Melati",
      "healthcareWorker": "Bidan Yuni",
      "sideEffectsNoted": "Demam ringan pada malam hari",
      "updatedAt": "2026-05-29T20:35:41.000Z"
    },
    {
      "id": "rec-dpt-1-uuid",
      "childId": "c5c7d81a-4c28-4b71-bf3d-271d1889ab8a",
      "vaccineId": "v-dpt-1",
      "status": "scheduled",
      "scheduledDate": "2026-06-10",
      "updatedAt": "2026-05-29T20:10:00.000Z"
    }
  ],
  "notifications": [
    {
      "id": "notif-dpt-1-uuid",
      "userId": "a1a8c3d7-21a4-4a29-b001-f09b552d58a1",
      "type": "immunization",
      "title": "Jadwal Imunisasi Mendekati Target 🧡",
      "body": "Bunda Sari, jadwal imunisasi DPT-HB-Hib Dosis 1 untuk Al Fatih mendekati tanggal target (10 Juni 2026). Yuk persiapkan kunjungan ke posyandu atau puskesmas!",
      "isRead": false,
      "scheduledAt": "2026-05-29T20:35:41.000Z",
      "referenceId": "rec-dpt-1-uuid",
      "createdAt": "2026-05-29T20:35:41.000Z"
    }
  ]
}
```

---

## 4. Edge Cases & Error Handling

Berikut adalah skenario kegagalan atau kondisi batas (edge cases) beserta bagaimana aplikasi Hayya menanganinya demi menjaga konsistensi data dan kemudahan bagi Bunda.

### 4.1 Input Tanggal Pemberian (`actualDate`) di Masa Depan
- **Skenario:** Bunda secara tidak sengaja memasukkan tanggal esok hari atau beberapa hari ke depan saat mencatat imunisasi.
- **Penanganan:** Sistem menolak pengiriman form. Muncul pesan peringatan berwarna merah di bawah kolom input: *"Tanggal imunisasi tidak boleh di masa depan ya, Bunda."*. Input ditandai dengan outline merah tipis, tombol simpan tetap dinonaktifkan (`disabled`) hingga input diperbaiki.

### 4.2 Input Tanggal Pemberian Sebelum Hari Lahir Anak
- **Skenario:** Anak lahir pada 10 April 2026, tetapi Bunda secara tidak sengaja memilih tanggal pemberian 5 April 2026.
- **Penanganan:** Sistem melakukan validasi tanggal: `new Date(actualDate) < new Date(child.dateOfBirth)`. Jika benar, sistem mencegah penyimpanan dan memunculkan error: *"Tanggal imunisasi tidak boleh mendahului tanggal lahir si Kecil (10 April 2026) ya, Bunda."*.

### 4.3 Pembuatan Kalender Ganda (Double Initialization)
- **Skenario:** Bunda memuat halaman Imunisasi berkali-kali untuk profil anak yang sama secara cepat, atau pemicu pendaftaran anak ter-fire dua kali.
- **Penanganan:** Sebelum menggenerasikan record baru, utilitas inisialisasi selalu melakukan pencarian filter di `immunizationRecords` untuk memastikan apakah data `childId` terkait sudah memiliki record imunisasi. Jika array hasil pencarian memiliki panjang $> 0$, sistem akan membatalkan pembuatan baru dan langsung me-load data yang sudah ada di LocalStorage.

### 4.4 Perubahan Tanggal Lahir Anak pada Profil
- **Skenario:** Bunda menyadari ada kesalahan ketik tanggal lahir pada profil anak (misal: seharusnya tanggal 12, tertulis tanggal 10). Bunda memperbaruinya di halaman pengaturan profil anak.
- **Penanganan:** 
  - Pada saat profil anak di-update, sistem mendeteksi apakah `dateOfBirth` berubah.
  - Jika berubah, sistem memicu pembaruan jadwal imunisasi otomatis: Untuk seluruh `immunizationRecords` milik `childId` tersebut yang statusnya **masih `"scheduled"` atau `"late"`**, sistem menghitung ulang `scheduledDate` berdasarkan tanggal lahir yang baru.
  - Imunisasi yang sudah diselesaikan (status `"done"`) **tetap dipertahankan** dengan tanggal `actualDate` asli yang diinput Bunda sebelumnya, menghindari perusakan riwayat medis yang valid.

### 4.5 Batas Kapasitas Penyimpanan LocalStorage Terlampaui
- **Skenario:** Penyimpanan browser lokal hampir penuh (limit ~5MB) karena banyaknya record perkembangan atau artikel yang disimpan.
- **Penanganan:** Ketika operasi penyimpanan `localStorage.setItem` memicu error `QuotaExceededError`, sistem menangkapnya melalui blok `try-catch` di utilitas penyimpanan. Aplikasi memunculkan dialog peringatan kepada Bunda: *"Penyimpanan HP Bunda hampir penuh. Coba bersihkan artikel tersimpan atau riwayat cek gejala lama untuk mencatat imunisasi baru ya, Bunda."*. Hal ini mencegah hilangnya data secara tiba-tiba atau crash pada aplikasi.

### 4.6 Mode Offline Aktif
- **Skenario:** Bunda berada di daerah terpencil yang tidak ada sinyal seluler saat membawa anak ke Puskesmas dan ingin langsung mencatat imunisasi.
- **Penanganan:** Karena Hayya dirancang dengan arsitektur **Offline-First**, semua penyimpanan dilakukan langsung ke LocalStorage perangkat. UI tidak akan menampilkan loading spinner tak berujung atau pesan error kegagalan server. Melalui hook `useOnlineStatus`, banner kecil berlatar Rose Pink tipis muncul di atas BottomNav dengan teks hangat: *"Mode offline aktif - Data imunisasi dicatat dengan aman di HP Bunda 🧡"*.

---

## 5. Dependencies dengan Fitur Lain

Fitur Tracker & Kalender Imunisasi (F-07) sangat bergantung dan saling terhubung dengan modul-modul lain di aplikasi Hayya:

### 5.1 F-02: Profil Ibu & Anak
- **Ketergantungan Data:** 
  - Membutuhkan ID anak aktif (`childId`) untuk memfilter riwayat imunisasi anak yang sedang dilihat.
  - Membutuhkan `dateOfBirth` anak untuk menghitung tanggal target pemberian (`scheduledDate`) saat inisialisasi kalender.
- **Dampak Perubahan:** Pembaruan profil anak (khususnya tanggal lahir) memicu penyesuaian ulang massal pada seluruh agenda vaksin yang belum terealisasi.

### 5.2 F-03: Beranda/Dashboard Personalisasi
- **Ketergantungan Tampilan:** Dashboard membaca data `immunizationRecords` terdekat yang akan datang (Upcoming) dari anak aktif dan menampilkan kartu ringkasan cepat berisi: nama vaksin terdekat dan hitung mundur hari target.
- **Pemicu Notifikasi:** Logika evaluasi jadwal imunisasi terdekat dijalankan saat Dashboard di-mount, menulis pengingat ke array `notifications`.

### 5.3 F-14: In-App Notifications (Lokal)
- **Sinergi Aksi:** Saat jadwal imunisasi mendekati H-7, sistem menginjeksi baris baru ke array `notifications`.
- **Interaksi Pengguna:** Ketika Bunda membuka atau mengklik notifikasi pengingat imunisasi di panel notifikasi, sistem langsung merutekan (redirect) navigasi aktif ke tab "Belum Imunisasi" pada halaman Kalender Imunisasi anak terkait, sekaligus langsung membuka drawer pengisian data vaksin tersebut.
