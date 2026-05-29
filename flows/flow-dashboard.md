# Flow Logika Fitur: Dashboard Utama (F-03)

Dokumen ini menjelaskan alur logika, transisi state, dan mutasi LocalStorage untuk fitur **Dashboard Utama (F-03)** pada aplikasi Hayya. Desain dan pesan UI disesuaikan secara khusus dengan sapaan hangat untuk **Bunda**.

---

## 1. User Action Flow

### 1.1 Membuka Aplikasi & Inisialisasi Sesi
1. **Pemicu**: Bunda membuka aplikasi Hayya pada perangkatnya. Sesi login Bunda dideteksi melalui token/kredensial aktif di aplikasi.
2. **Pengecekan Status Koneksi**:
   - Hook `useOnlineStatus` mendeteksi apakah perangkat terhubung ke internet atau offline.
   - Jika offline, Banner Status Offline akan muncul di bagian atas Bottom Navigation dengan teks: *"Mode offline - data disimpan di HP Bunda 🧡"*.
3. **Memuat Data Profil**:
   - Sistem mengambil informasi user yang sedang aktif dari LocalStorage (nama lengkap Bunda).
   - Sistem memuat daftar anak dari array `children` yang terasosiasi dengan `userId` Bunda.
   - Sistem menentukan anak yang aktif (`activeChildId`). Jika ada preferensi tersemat di profil user, anak tersebut yang dipilih. Jika tidak ada, sistem memilih anak pertama dari daftar anak sebagai *default*.

### 1.2 Menampilkan Widget Dashboard & Informasi Anak
1. **Sapaan Dinamis & Usia**:
   - Dashboard menampilkan sapaan berdasarkan jam aktif perangkat (misal: pukul 08.00 pagi → *"Selamat pagi, Bunda Sari! 🧡"*).
   - Usia anak yang aktif dihitung secara real-time dari tanggal lahir (`dateOfBirth`) hingga tanggal hari ini ke dalam bentuk satuan Bulan dan Hari (misal: *"Bayi kamu sudah 4 bulan 12 hari"*).
2. **Widget Ringkasan Pertumbuhan Terakhir**:
   - Menampilkan catatan berat badan (BB) dan tinggi/panjang badan (TB) paling baru yang tercatat di `growthRecords` anak terpilih (misal: *"Berat: 6.8 kg, Tinggi: 63.5 cm (Pengukuran terakhir: 15 Mei 2026)"*).
3. **Widget Target Imunisasi Terdekat**:
   - Menampilkan jenis vaksin terdekat yang dijadwalkan untuk anak berdasarkan tanggal lahir dan anjuran IDAI yang berstatus `"scheduled"` (misal: *"Imunisasi berikutnya: DPT-HB-Hib 2 (Jadwal: 15 Juni 2026)"*).
4. **Widget Milestone Terdekat**:
   - Menampilkan pengingat checklist perkembangan terdekat berdasarkan kelompok usia anak saat ini yang belum ditandai *"achieved"* (misal: *"Sudahkah si Kecil bisa merangkak tanpa bantuan?"*).
5. **Artikel Harian**:
   - Menampilkan satu kutipan tips parenting singkat harian dari data master artikel yang sudah di-*seed* di memori lokal.

### 1.3 Mengubah Anak yang Aktif
1. **Pemicu**: Bunda mengetuk dropdown/selektor anak yang terletak di bagian atas halaman Dashboard.
2. **Interaksi Dropdown**:
   - Sistem menampilkan daftar nama anak milik Bunda yang terdaftar.
   - Bunda memilih anak lain dari daftar tersebut (misal: mengetuk nama *"Kiran"*).
3. **Pembaruan State**:
   - State global `activeChildId` diperbarui secara instan.
   - Preferensi anak terakhir disimpan ke dalam data akun Bunda di array `users` (kolom `lastActiveChildId`).
4. **Pembaruan Tampilan**:
   - Dashboard memuat ulang seluruh komponen widget secara instan tanpa memuat ulang seluruh halaman (*zero-reload page state transitions*).
   - Sapaan usia, ringkasan pertumbuhan, target imunisasi, dan milestone disesuaikan dengan data profil anak yang baru dipilih.

### 1.4 Membaca Notifikasi In-App
1. **Pemicu**: Bunda melihat ikon lonceng notifikasi pada pojok kanan atas Dashboard yang memiliki lencana merah muda (#C2185B) berisi jumlah notifikasi aktif (belum dibaca).
2. **Membuka Panel Notifikasi**: Bunda mengetuk ikon lonceng untuk menampilkan daftar notifikasi lokal.
3. **Interaksi Notifikasi**:
   - Bunda melihat daftar pengingat, seperti imunisasi yang akan datang atau tips penting lainnya.
   - Bunda mengetuk salah satu notifikasi spesifik.
4. **Umpan Balik & Navigasi**:
   - Sistem mengubah status notifikasi tersebut menjadi telah dibaca (`isRead: true`) di dalam LocalStorage.
   - Jumlah lencana merah muda pada ikon lonceng berkurang.
   - Aplikasi secara otomatis mengarahkan Bunda ke halaman fitur terkait (misalnya halaman detail Imunisasi).

---

## 2. Data State Flow

### 2.1 State dan Variabel yang Digunakan
- `currentUser` (`Object`): Data lengkap akun Bunda yang diperoleh melalui custom hook `useAuth`.
- `isOnline` (`Boolean`): Status konektivitas internet perangkat dari `useOnlineStatus`.
- `childrenList` (`Array`): Kumpulan objek anak milik user yang sedang aktif, diperoleh dari `useChild`.
- `activeChildId` (`String/UUID`): ID anak yang sedang terpilih untuk dipantau perkembangannya.
- `activeChild` (`Object`): Objek anak yang aktif, dicari dari pencocokan `childrenList` dengan `activeChildId`.
- `childAge` (`Object`): Hasil perhitungan usia anak saat ini yang memuat `{ months: number, days: number }`.
- `latestGrowth` (`Object`): Data pengukuran berat dan tinggi badan paling baru dari `useGrowth`.
- `nextImmunization` (`Object`): Record imunisasi mendatang berstatus `"scheduled"` dari `useImmunization`.
- `nextMilestone` (`Object`): Target milestone terdekat dari kelompok usia anak yang belum tercapai dari `useMilestones`.
- `notifications` (`Array`): Daftar pemberitahuan lokal untuk user saat ini dari `useNotification` yang difilter dengan kondisi `isRead === false`.

### 2.2 Transisi State (State Transitions)

1. **Memuat Data Awal & Menentukan Anak Aktif**:
   `[Halaman Dashboard Mount] → [useAuth mengambil currentUser] → [useChild mengambil childrenList berdasarkan currentUser.id] → [Deteksi user.lastActiveChildId atau fallback ke childrenList[0].id] → [Set activeChildId] → [Tampilkan Data di UI]`

2. **Kalkulasi Usia Anak**:
   `[Membaca activeChild.dateOfBirth] → [Panggil hitungUsia(dateOfBirth) di dateHelpers.js] → [Update childAge State] → [Render Teks "Bayi kamu sudah X bulan Y hari" di UI]`

3. **Mengubah Pilihan Anak Aktif**:
   `[Bunda Memilih Nama Anak Lain di Dropdown] → [Trigger setActiveChildId(newChildId)] → [Update user.lastActiveChildId di LocalStorage via useChild] → [Re-filter & Re-calculate childAge, latestGrowth, nextImmunization, nextMilestone] → [Rerender Seluruh Widget Dashboard]`

4. **Menandai Notifikasi Dibaca**:
   `[Bunda Mengetuk Item Notifikasi] → [Trigger markAsRead(notificationId) via useNotification] → [Mutasi isRead menjadi true di LocalStorage] → [Filter Ulang notifications State] → [Rerender Lencana Lonceng UI (Jumlah Notifikasi Berkurang)] → [Navigasi Route]`

5. **Deteksi Status Koneksi**:
   `[Perangkat Terputus dari Internet] → [Event Listener 'offline' aktif di browser] → [Update isOnline menjadi false] → [Rerender UI: Banner Status Offline Ditampilkan]`

---

## 3. LocalStorage Schema Mutation

Semua data tersimpan secara terpusat pada satu root key `"hayya_app_data"`.

### 3.1 Skema SEBELUM Aksi Dijalankan
Kondisi di bawah menunjukkan dua data anak terdaftar ("Arka" dan "Kiran"), di mana Arka adalah anak yang sedang aktif (`lastActiveChildId` bernilai ID Arka). Terdapat juga satu notifikasi imunisasi berstatus belum dibaca (`isRead: false`).

```json
{
  "users": [
    {
      "id": "e3b8a349-f9c3-4d4b-9721-eb3782bf6ef4",
      "phone": "081234567890",
      "pinHash": "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",
      "fullName": "Bunda Sari",
      "profilePhoto": "data:image/png;base64,iVBORw0KGgoAAAANS...",
      "district": "Kebayoran Baru",
      "regency": "Jakarta Selatan",
      "province": "DKI Jakarta",
      "isActive": true,
      "lastLoginAt": "2026-05-29T20:30:00Z",
      "createdAt": "2026-05-29T10:00:00Z",
      "updatedAt": "2026-05-29T20:30:00Z",
      "lastActiveChildId": "c62bf6a9-8d76-47b2-bd7e-52f074d08123"
    }
  ],
  "children": [
    {
      "id": "c62bf6a9-8d76-47b2-bd7e-52f074d08123",
      "userId": "e3b8a349-f9c3-4d4b-9721-eb3782bf6ef4",
      "name": "Arka",
      "dateOfBirth": "2026-01-15",
      "gender": "L",
      "birthWeightKg": 3.2,
      "birthHeightCm": 49,
      "bloodType": "O",
      "photoUrl": "",
      "isActive": true,
      "createdAt": "2026-01-15T08:00:00Z"
    },
    {
      "id": "a91823bc-749e-432d-9831-90a1f9a20456",
      "userId": "e3b8a349-f9c3-4d4b-9721-eb3782bf6ef4",
      "name": "Kiran",
      "dateOfBirth": "2024-05-20",
      "gender": "P",
      "birthWeightKg": 3.0,
      "birthHeightCm": 48,
      "bloodType": "A",
      "photoUrl": "",
      "isActive": true,
      "createdAt": "2024-05-20T09:00:00Z"
    }
  ],
  "growthRecords": [
    {
      "id": "f512da5c-3f41-4770-b1d5-8f6424e756c8",
      "childId": "c62bf6a9-8d76-47b2-bd7e-52f074d08123",
      "measuredAt": "2026-05-15",
      "weightKg": 6.8,
      "heightCm": 63.5,
      "headCircCm": 41.5,
      "notes": "Arka tumbuh sehat",
      "createdAt": "2026-05-15T10:00:00Z"
    }
  ],
  "milestones": [
    {
      "id": "m1",
      "ageMinMonths": 4,
      "ageMaxMonths": 6,
      "category": "motorik_kasar",
      "description": "Bisa tengkurap sendiri",
      "stimulationTips": "Latih tummy time lebih sering",
      "illustrationUrl": "",
      "isCritical": true
    }
  ],
  "milestoneRecords": [],
  "vaccines": [
    {
      "id": "v1",
      "name": "DPT-HB-Hib 2",
      "shortName": "DPT 2",
      "description": "Vaksin lanjutan untuk difteri, pertusis, tetanus, hepatitis B, dan Hib",
      "recommendedAgeMonths": 3,
      "maxAgeMonths": 4,
      "doseNumber": 2,
      "parentVaccineId": "",
      "sideEffectsInfo": "Demam ringan umum terjadi"
    }
  ],
  "immunizationRecords": [
    {
      "id": "ir1",
      "childId": "c62bf6a9-8d76-47b2-bd7e-52f074d08123",
      "vaccineId": "v1",
      "status": "scheduled",
      "scheduledDate": "2026-04-15",
      "actualDate": null,
      "location": "",
      "healthcareWorker": "",
      "sideEffectsNoted": "",
      "updatedAt": "2026-01-15T08:00:00Z"
    }
  ],
  "mpasiPlans": [],
  "mpasiRecipes": [],
  "symptomChecks": [],
  "diseases": [],
  "articles": [],
  "savedArticles": [],
  "notifications": [
    {
      "id": "n1",
      "userId": "e3b8a349-f9c3-4d4b-9721-eb3782bf6ef4",
      "type": "immunization",
      "title": "Jadwal Imunisasi Arka",
      "body": "Bunda, jadwal imunisasi DPT-HB-Hib 2 untuk Arka sudah dekat nih. Yuk cek jadwalnya!",
      "isRead": false,
      "scheduledAt": "2026-05-28T08:00:00Z",
      "referenceId": "ir1",
      "createdAt": "2026-05-28T08:00:00Z"
    }
  ]
}
```

### 3.2 Skema SETELAH Aksi Dijalankan
Kondisi setelah Bunda mengubah pilihan anak aktif menjadi **Kiran** (ID: `a91823bc-749e-432d-9831-90a1f9a20456`) dan menandai notifikasi dengan ID `n1` sebagai telah dibaca (`isRead: true`).

```json
{
  "users": [
    {
      "id": "e3b8a349-f9c3-4d4b-9721-eb3782bf6ef4",
      "phone": "081234567890",
      "pinHash": "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",
      "fullName": "Bunda Sari",
      "profilePhoto": "data:image/png;base64,iVBORw0KGgoAAAANS...",
      "district": "Kebayoran Baru",
      "regency": "Jakarta Selatan",
      "province": "DKI Jakarta",
      "isActive": true,
      "lastLoginAt": "2026-05-29T20:30:00Z",
      "createdAt": "2026-05-29T10:00:00Z",
      "updatedAt": "2026-05-29T20:35:45Z",
      "lastActiveChildId": "a91823bc-749e-432d-9831-90a1f9a20456"
    }
  ],
  "children": [
    {
      "id": "c62bf6a9-8d76-47b2-bd7e-52f074d08123",
      "userId": "e3b8a349-f9c3-4d4b-9721-eb3782bf6ef4",
      "name": "Arka",
      "dateOfBirth": "2026-01-15",
      "gender": "L",
      "birthWeightKg": 3.2,
      "birthHeightCm": 49,
      "bloodType": "O",
      "photoUrl": "",
      "isActive": true,
      "createdAt": "2026-01-15T08:00:00Z"
    },
    {
      "id": "a91823bc-749e-432d-9831-90a1f9a20456",
      "userId": "e3b8a349-f9c3-4d4b-9721-eb3782bf6ef4",
      "name": "Kiran",
      "dateOfBirth": "2024-05-20",
      "gender": "P",
      "birthWeightKg": 3.0,
      "birthHeightCm": 48,
      "bloodType": "A",
      "photoUrl": "",
      "isActive": true,
      "createdAt": "2024-05-20T09:00:00Z"
    }
  ],
  "growthRecords": [
    {
      "id": "f512da5c-3f41-4770-b1d5-8f6424e756c8",
      "childId": "c62bf6a9-8d76-47b2-bd7e-52f074d08123",
      "measuredAt": "2026-05-15",
      "weightKg": 6.8,
      "heightCm": 63.5,
      "headCircCm": 41.5,
      "notes": "Arka tumbuh sehat",
      "createdAt": "2026-05-15T10:00:00Z"
    }
  ],
  "milestones": [
    {
      "id": "m1",
      "ageMinMonths": 4,
      "ageMaxMonths": 6,
      "category": "motorik_kasar",
      "description": "Bisa tengkurap sendiri",
      "stimulationTips": "Latih tummy time lebih sering",
      "illustrationUrl": "",
      "isCritical": true
    }
  ],
  "milestoneRecords": [],
  "vaccines": [
    {
      "id": "v1",
      "name": "DPT-HB-Hib 2",
      "shortName": "DPT 2",
      "description": "Vaksin lanjutan untuk difteri, pertusis, tetanus, hepatitis B, dan Hib",
      "recommendedAgeMonths": 3,
      "maxAgeMonths": 4,
      "doseNumber": 2,
      "parentVaccineId": "",
      "sideEffectsInfo": "Demam ringan umum terjadi"
    }
  ],
  "immunizationRecords": [
    {
      "id": "ir1",
      "childId": "c62bf6a9-8d76-47b2-bd7e-52f074d08123",
      "vaccineId": "v1",
      "status": "scheduled",
      "scheduledDate": "2026-04-15",
      "actualDate": null,
      "location": "",
      "healthcareWorker": "",
      "sideEffectsNoted": "",
      "updatedAt": "2026-01-15T08:00:00Z"
    }
  ],
  "mpasiPlans": [],
  "mpasiRecipes": [],
  "symptomChecks": [],
  "diseases": [],
  "articles": [],
  "savedArticles": [],
  "notifications": [
    {
      "id": "n1",
      "userId": "e3b8a349-f9c3-4d4b-9721-eb3782bf6ef4",
      "type": "immunization",
      "title": "Jadwal Imunisasi Arka",
      "body": "Bunda, jadwal imunisasi DPT-HB-Hib 2 untuk Arka sudah dekat nih. Yuk cek jadwalnya!",
      "isRead": true,
      "scheduledAt": "2026-05-28T08:00:00Z",
      "referenceId": "ir1",
      "createdAt": "2026-05-28T08:00:00Z"
    }
  ]
}
```

### 3.3 Penjelasan Mutasi
1. **Mutasi `users`**:
   - Field `lastActiveChildId` pada objek user dengan ID `e3b8a349-f9c3-4d4b-9721-eb3782bf6ef4` diperbarui dari `"c62bf6a9-8d76-47b2-bd7e-52f074d08123"` (Arka) menjadi `"a91823bc-749e-432d-9831-90a1f9a20456"` (Kiran).
   - Field `updatedAt` diperbarui menjadi `"2026-05-29T20:35:45Z"` untuk menandakan waktu aktivitas pembaruan terakhir pada profil pengguna.
2. **Mutasi `notifications`**:
   - Notifikasi dengan ID `n1` yang ditujukan untuk user ini dimutasi pada bagian field `isRead` dari `false` menjadi `true` karena Bunda telah mengetuk notifikasi tersebut dari Dashboard.

---

## 4. Edge Cases & Error Handling

### 4.1 Belum Ada Data Anak Terdaftar
- **Skenario**: Akun Bunda berhasil dibuat tetapi Bunda belum mendaftarkan profil anak sama sekali (array `children` kosong).
- **Penanganan**: Dashboard menampilkan *State Kosong* (Empty State) yang didesain secara hangat: *"Selamat datang Bunda Sari! 🧡 Yuk, daftarkan profil si Kecil pertama Bunda untuk mulai memantau tumbuh kembangnya!"* serta menampilkan tombol pill merah muda `#C2185B` berukuran besar (52px, ramah jempol) bertuliskan *"Tambah Profil si Kecil"*. Widget pertumbuhan, imunisasi, dan milestone lainnya akan disembunyikan sampai data anak ditambahkan.

### 4.2 Perbedaan Tanggal Lahir Tidak Valid (Masa Depan)
- **Skenario**: Bunda salah memasukkan tanggal lahir anak sehingga posisinya ada di masa depan (lebih dari tanggal perangkat saat ini).
- **Penanganan**: Sistem mendeteksi kalkulasi selisih waktu menghasilkan nilai negatif. Sistem secara otomatis menerapkan nilai fallback (usia dianggap `0 bulan 0 hari`), menampilkan teks *"Tanggal lahir tidak valid"* di UI, dan memunculkan notifikasi kecil berupa peringatan ramah: *"Bunda, tanggal lahir si Kecil sepertinya keliru. Yuk, sesuaikan kembali di profil si Kecil! 🧡"*.

### 4.3 Data Pertumbuhan Awal Masih Kosong
- **Skenario**: Profil anak baru saja dibuat dan belum memiliki catatan berat/tinggi badan di `growthRecords`.
- **Penanganan**: Widget Pertumbuhan Terakhir menampilkan teks pengganti hangat: *"Belum ada catatan pertumbuhan si Kecil bulan ini. Yuk, catat pertumbuhan pertamanya sekarang! 🧡"* lengkap dengan tombol shortcut bertuliskan *"Catat Pertumbuhan"*.

### 4.4 Jadwal Imunisasi Melampaui Batas Usia Anak
- **Skenario**: Usia anak saat ini sudah melampaui kelompok usia imunisasi dasar yang tercatat pada master data (misal usia anak sudah di atas 5 tahun).
- **Penanganan**: Widget Imunisasi Terdekat menampilkan ucapan selamat: *"Hebat! Si Kecil sudah menyelesaikan seluruh jadwal imunisasi dasarnya 🧡"* dan menyarankan konsultasi lanjutan untuk vaksinasi tambahan.

### 4.5 Masalah Kapasitas Memori LocalStorage (QuotaExceededError)
- **Skenario**: Penyimpanan internal browser penuh sehingga proses update data active child atau pembacaan notifikasi gagal disimpan di perangkat.
- **Penanganan**: Logika penyimpanan dibungkus dengan blok `try-catch`. Jika terperangkap error penyimpanan, sistem menangkapnya dan menampilkan notifikasi ramah: *"Memori penyimpanan browser Bunda hampir penuh, namun data saat ini tetap aman di perangkat Bunda 🧡"*.

### 4.6 Perangkat Mengalami Kehilangan Sinyal Mendadak
- **Skenario**: Pengguna sedang membuka Dashboard lalu koneksi internet terputus secara mendadak.
- **Penanganan**: Dashboard tidak akan mengalami gangguan sama sekali karena beroperasi penuh secara lokal (Offline-First). `useOnlineStatus` akan langsung mendeteksi perubahan state koneksi dan memunculkan banner status offline yang ramah di atas bar navigasi utama.

---

## 5. Dependencies dengan Fitur Lain

1. **Fitur Registrasi & Profil (F-01, F-02)**:
   - Dashboard membutuhkan data user yang aktif (`users`) untuk menampilkan sapaan dinamis personalisasi nama Bunda.
   - Dashboard memerlukan data dari `children` untuk menyediakan pilihan dropdown anak yang berasosiasi dengan ID user saat ini.
2. **Checklist Perkembangan Anak (F-04, F-05)**:
   - Menghubungkan widget target checklist milestone pada beranda dengan daftar `milestones` master data dan catatan status pencapaian anak pada `milestoneRecords`.
3. **Grafik & Catatan Pertumbuhan (F-06)**:
   - Mengambil data pengukuran paling akhir dari `growthRecords` berdasarkan ID anak yang aktif untuk ditampilkan pada widget ringkasan berat dan tinggi badan.
4. **Tracker & Kalender Imunisasi (F-07)**:
   - Dashboard mengambil record imunisasi pertama yang berstatus `"scheduled"` dari `immunizationRecords` untuk menyajikan informasi jadwal vaksin terdekat di beranda.
5. **Modul Notifikasi Lokal**:
   - Membaca tabel `notifications` lokal guna menampilkan gelembung angka merah muda (#C2185B) pada tombol lonceng di Dashboard. Menandai notifikasi telah dibaca akan memutasi status notifikasi tersebut pada array `notifications`.
