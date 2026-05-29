# Alur Logika Checklist Perkembangan Anak (Milestone Tracker - F-04 & F-05)

Dokumen ini menjelaskan alur logika, manajemen state, perubahan skema LocalStorage, penanganan error, dan dependensi antarfitur untuk modul Checklist Perkembangan Anak (Milestone Tracker) pada aplikasi Hayya.

## 1. User Action Flow

Berikut adalah tahapan pengalaman pengguna (Bunda) saat berinteraksi dengan fitur Milestone Tracker:

### A. Membuka Halaman Perkembangan & Deteksi Anak Aktif
1. Bunda menekan ikon menu **Perkembangan** di navigasi bawah (Bottom Navigation).
2. Sistem memeriksa apakah terdapat data anak aktif melalui fungsi `useChild`.
   - **Jika tidak ada profil anak**: Tampilan antarmuka dialihkan ke kondisi kosong (Empty State) dengan ajakan: *"Bunda belum mendaftarkan si Kecil. Yuk, tambah profil si Kecil terlebih dahulu untuk memantau perkembangannya! 🧡"*, disertai tombol yang mengarah ke Formulir Tambah Anak.
   - **Jika ada profil anak**: Halaman dimuat dengan sapaan hangat dan ringkasan usia anak saat ini, misalnya: *"Perkembangan si Kecil [Nama Anak] (3 bulan 14 hari)"*.

### B. Memfilter Kelompok Usia & Kategori Milestone
1. Sistem menghitung usia anak dalam bulan secara real-time dan secara otomatis menentukan kelompok usia awal yang sesuai sebagai pilihan default (misal: usia 3 bulan 14 hari akan membuka kelompok usia "3–6 bulan").
2. Bunda dapat mengganti filter kelompok usia melalui tab geser atau pemilih dropdown. Pilihan yang tersedia meliputi:
   - 0–3 Bulan
   - 3–6 Bulan
   - 6–9 Bulan
   - 9–12 Bulan
   - 12–18 Bulan
   - 18–24 Bulan
   - 2–3 Tahun
   - 3–4 Tahun
   - 4–5 Tahun
3. Bunda juga dapat memfilter perkembangan berdasarkan kategori aspek dengan mengetuk tab kategori:
   - Semua Kategori (Default)
   - Motorik Kasar (Contoh: mengangkat kepala, merangkak)
   - Motorik Halus (Contoh: menggenggam mainan, menjumput benda)
   - Bahasa (Contoh: menoleh ke arah suara, mengoceh/babbling)
   - Sosial-Emosional (Contoh: tersenyum sosial, menatap mata)
   - Kognitif (Contoh: mencari benda tersembunyi, mengikuti benda bergerak)

### C. Melihat Daftar Milestone & Status Pencapaian (Fetch & Join)
1. Bunda melihat daftar kartu milestone yang disaring berdasarkan kelompok usia dan kategori terpilih.
2. Setiap kartu menampilkan:
   - Deskripsi singkat pencapaian perkembangan (contoh: *"Bisa menegakkan kepala 90 derajat saat ditengkurapkan"*).
   - Label penanda aspek perkembangan (misalnya: "Motorik Kasar").
   - Lencana khusus berwarna merah muda jika pencapaian tersebut termasuk kategori kritis/tanda bahaya (**Red Flag** / `isCritical`).
   - Indikator status pencapaian saat ini dengan tiga pilihan aksi interaktif:
     - **Sudah Bisa** (status: `achieved`)
     - **Pantau** (status: `monitoring`)
     - **Belum** (status: `not_yet` / status default jika belum ada catatan)

### D. Mengubah Status Milestone
1. Bunda mengetuk salah satu tombol status pada kartu perkembangan:
   - **Mengubah ke "Sudah Bisa"**:
     - Sistem menampilkan dialog/modal sembulan (pop-up modal).
     - Bunda dapat memilih tanggal pencapaian (default adalah tanggal hari ini).
     - Bunda dapat menambahkan catatan pribadi opsional (misal: *"Hebat, si Kecil mengangkat kepala tegak sekali pas tummy time pagi ini!"*).
     - Bunda mengetuk tombol **"Simpan Pencapaian"**.
     - Modal ditutup, data diperbarui, dan UI menampilkan tanggal pencapaian beserta lencana sukses berwarna hijau.
   - **Mengubah ke "Pantau"**:
     - Sistem memperbarui status menjadi `monitoring` secara instan tanpa memunculkan modal input.
     - Lencana status berubah menjadi kuning jingga untuk memberikan atensi visual.
   - **Mengubah ke "Belum"**:
     - Sistem mereset atau menyimpan status menjadi `not_yet`.
     - Lencana status berubah menjadi abu-abu netral.
2. Setiap perubahan status memberikan feedback taktil instan (visual ter-update tanpa memuat ulang halaman).

### E. Membaca Detail Stimulasi & Tanda Bahaya (Red Flags)
1. Bunda mengetuk kartu perkembangan untuk mempelajari informasi lebih mendalam.
2. Sistem menampilkan modal detail yang berisi:
   - Informasi deskripsi perkembangan lengkap.
   - **Tips Stimulasi**: Langkah-langkah praktis dan ramah yang dapat Bunda praktikkan di rumah untuk merangsang aspek perkembangan tersebut.
   - **Peringatan Red Flag (Tanda Bahaya)**: Penjelasan medis ringan mengenai kapan Bunda harus waspada dan segera membawa si Kecil ke posyandu atau dokter spesialis anak jika kemampuan tersebut belum dikuasai pada batas usia tertentu.

### F. Melihat Laporan Perkembangan & Ekspor (F-05)
1. Bunda mengetuk tombol **"Laporan Perkembangan"** di bagian atas layar.
2. Sistem menyusun laporan berbentuk garis waktu (Timeline) visual yang memuat semua milestone yang telah ditandai **"Sudah Bisa"** (`achieved`), diurutkan dari tanggal paling baru ke yang paling lama.
3. Bunda dapat menekan tombol **"Cetak Laporan"**. Tampilan halaman diubah ke format ramah cetak (print-friendly style), dan sistem memicu dialog pencetakan bawaan peramban (print dialog browser) sehingga Bunda dapat langsung mencetak kertas fisik atau menyimpannya sebagai file PDF di ponsel cerdasnya.


## 2. Data State Flow

### A. State yang Digunakan dalam Komponen

1. `activeChild` (Object | null): Menyimpan data objek profil anak yang sedang aktif digunakan.
2. `selectedAgeRange` (Object): Menyimpan objek penyaring usia batas bawah dan batas atas dalam satuan bulan, contoh: `{ min: 3, max: 6 }`.
3. `selectedCategory` (String): Menyimpan filter kategori aktif (contoh: `"all"`, `"motorik_kasar"`, `"motorik_halus"`, `"bahasa"`, `"sosial"`, `"kognitif"`).
4. `milestonesList` (Array): Kumpulan data hasil penggabungan (join) antara master data `milestones` dan catatan riwayat pencapaian anak `milestoneRecords`.
5. `modalState` (Object): Mengontrol tampilan dialog masukan/detail dengan struktur `{ isOpen: boolean, type: 'status' | 'detail', milestone: Object | null }`.
6. `achievedDateInput` (String): State form untuk menampung tanggal pencapaian yang diinput Bunda (`YYYY-MM-DD`).
7. `notesInput` (String): State form untuk menampung catatan kustom Bunda saat menandai milestone berhasil dicapai.
8. `errorMessage` (String | null): Menyimpan pesan kesalahan validasi input untuk diumpankan ke UI.

### B. Representasi Alur Transisi State

1. **Inisialisasi & Pengambilan Data (Mounting Halaman)**:
   `[Halaman Dimuat / Deteksi Active Child]` → `[Hitung Selisih Bulan Tanggal Lahir Anak]` → `[Set selectedAgeRange Default (misal: { min: 3, max: 6 })]` → `[Trigger useEffect Penggabungan Data]` → `[Saring Master Data 'milestones' berdasarkan selectedAgeRange & selectedCategory]` → `[Gabungkan dengan array 'milestoneRecords' berdasarkan milestoneId & activeChild.id]` → `[Simpan ke State milestonesList]` → `[Rerender UI: Tampilkan Daftar Kartu Perkembangan]`

2. **Mengganti Penyaring (Filter Usia / Kategori)**:
   `[Bunda Mengetuk Tab Kategori / Pilihan Usia Baru]` → `[State selectedCategory / selectedAgeRange Diperbarui]` → `[Trigger useEffect Penggabungan Data]` → `[Saring & Gabungkan Data Ulang]` → `[State milestonesList Diperbarui]` → `[Rerender UI: Tampilkan Daftar Kartu Baru]`

3. **Mengubah Status Pencapaian ke "Sudah Bisa" (Achieved)**:
   `[Bunda Mengetuk Tombol 'Sudah Bisa']` → `[Set State modalState = { isOpen: true, type: 'status', milestone: selectedObj }]` → `[Set achievedDateInput = Tanggal Hari Ini (Default)]` → `[Bunda Memasukkan Data & Menekan 'Simpan']` → `[Validasi Form: Tanggal Tidak Kosong, Tanggal >= Tanggal Lahir Anak, Tanggal <= Hari Ini]` → `[Panggil Hook useMilestones.saveRecord()]` → `[Penyimpanan di LocalStorage hayya_app_data.milestoneRecords]` → `[State milestoneRecords Berhasil Diperbarui]` → `[Trigger Rerender Data list (useEffect)]` → `[Tutup Modal & Bersihkan State Form]` → `[Rerender UI: Lencana 'Sudah Bisa' Tampil Beserta Tanggal]`

4. **Mengubah Status ke "Pantau" (Monitoring) atau "Belum" (Not Yet)**:
   `[Bunda Mengetuk Tombol 'Pantau' / 'Belum']` → `[Panggil Hook useMilestones.saveRecord() Secara Instan]` → `[Update LocalStorage hayya_app_data.milestoneRecords (Ubah status atau hapus data pencapaian)]` → `[State Ter-update]` → `[Trigger Rerender Data list]` → `[Rerender UI: Tampilan Lencana Kartu Berubah Instan]`


## 3. LocalStorage Schema Mutation

Semua data tersimpan secara offline di bawah satu kunci utama yaitu `"hayya_app_data"`.

### A. Kondisi Data Sebelum Menandai Milestone "Sudah Bisa"

Pada kondisi awal, master data `milestones` telah terisi melalui skema seeding. Namun, untuk anak aktif (misal dengan ID `"child-uuid-5678"`), belum ada pencatatan pencapaian untuk milestone ID `"milestone-uuid-002"`.

```json
{
  "users": [
    {
      "id": "user-uuid-1111",
      "phone": "081234567890",
      "pinHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "fullName": "Bunda Sari",
      "isActive": true,
      "createdAt": "2026-05-29T10:00:00.000Z"
    }
  ],
  "children": [
    {
      "id": "child-uuid-5678",
      "userId": "user-uuid-1111",
      "name": "Arka",
      "dateOfBirth": "2026-02-15",
      "gender": "L",
      "birthWeightKg": 3.2,
      "birthHeightCm": 49,
      "isActive": true,
      "createdAt": "2026-02-15T08:00:00.000Z"
    }
  ],
  "milestones": [
    {
      "id": "milestone-uuid-001",
      "ageMinMonths": 0,
      "ageMaxMonths": 3,
      "category": "motorik_kasar",
      "description": "Bisa mengangkat kepala sebentar saat ditengkurapkan",
      "stimulationTips": "Latih bayi tengkurap (tummy time) di atas kasur datar beberapa menit.",
      "illustrationUrl": "/assets/illustrations/tummy-time-0.png",
      "isCritical": false
    },
    {
      "id": "milestone-uuid-002",
      "ageMinMonths": 3,
      "ageMaxMonths": 6,
      "category": "motorik_kasar",
      "description": "Bisa berguling dari telentang ke tengkurap",
      "stimulationTips": "Goyangkan mainan berbunyi di samping bayi agar dia tertarik memiringkan badannya dan berguling.",
      "illustrationUrl": "/assets/illustrations/berguling.png",
      "isCritical": true
    }
  ],
  "milestoneRecords": [
    {
      "id": "record-uuid-0001",
      "childId": "child-uuid-5678",
      "milestoneId": "milestone-uuid-001",
      "status": "achieved",
      "achievedAt": "2026-05-10",
      "notes": "Arka sudah kuat angkat kepalanya 🧡",
      "updatedAt": "2026-05-10T12:00:00.000Z"
    }
  ],
  "notifications": []
}
```

### B. Kondisi Data Setelah Menandai Milestone "Sudah Bisa" (`achieved`)

Ketika Bunda menandai milestone berguling (`"milestone-uuid-002"`) sebagai **"Sudah Bisa"** pada tanggal **29 Mei 2026** dengan catatan tambahan *"Arka hari ini bisa berguling sendiri tanpa dibantu! 😍"*, sistem akan mengonversi tindakan tersebut menjadi penulisan data baru di dalam array `"milestoneRecords"`.

Detail Mutasi:
1. **ID Generasi**: Menggunakan fungsi browser built-in `crypto.randomUUID()` untuk menghasilkan string UUID unik baru, contohnya: `"record-uuid-0002"`.
2. **Menambahkan Record**: Objek record baru dimasukkan ke dalam array `milestoneRecords`.
3. **Penyimpanan**: Seluruh objek `"hayya_app_data"` di-serialize kembali menjadi string JSON dan ditulis ke LocalStorage.

```json
{
  "users": [
    {
      "id": "user-uuid-1111",
      "phone": "081234567890",
      "pinHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "fullName": "Bunda Sari",
      "isActive": true,
      "createdAt": "2026-05-29T10:00:00.000Z"
    }
  ],
  "children": [
    {
      "id": "child-uuid-5678",
      "userId": "user-uuid-1111",
      "name": "Arka",
      "dateOfBirth": "2026-02-15",
      "gender": "L",
      "birthWeightKg": 3.2,
      "birthHeightCm": 49,
      "isActive": true,
      "createdAt": "2026-02-15T08:00:00.000Z"
    }
  ],
  "milestones": [
    {
      "id": "milestone-uuid-001",
      "ageMinMonths": 0,
      "ageMaxMonths": 3,
      "category": "motorik_kasar",
      "description": "Bisa mengangkat kepala sebentar saat ditengkurapkan",
      "stimulationTips": "Latih bayi tengkurap (tummy time) di atas kasur datar beberapa menit.",
      "illustrationUrl": "/assets/illustrations/tummy-time-0.png",
      "isCritical": false
    },
    {
      "id": "milestone-uuid-002",
      "ageMinMonths": 3,
      "ageMaxMonths": 6,
      "category": "motorik_kasar",
      "description": "Bisa berguling dari telentang ke tengkurap",
      "stimulationTips": "Goyangkan mainan berbunyi di samping bayi agar dia tertarik memiringkan badannya dan berguling.",
      "illustrationUrl": "/assets/illustrations/berguling.png",
      "isCritical": true
    }
  ],
  "milestoneRecords": [
    {
      "id": "record-uuid-0001",
      "childId": "child-uuid-5678",
      "milestoneId": "milestone-uuid-001",
      "status": "achieved",
      "achievedAt": "2026-05-10",
      "notes": "Arka sudah kuat angkat kepalanya 🧡",
      "updatedAt": "2026-05-10T12:00:00.000Z"
    },
    {
      "id": "record-uuid-0002",
      "childId": "child-uuid-5678",
      "milestoneId": "milestone-uuid-002",
      "status": "achieved",
      "achievedAt": "2026-05-29",
      "notes": "Arka hari ini bisa berguling sendiri tanpa dibantu! 😍",
      "updatedAt": "2026-05-29T20:35:41.000Z"
    }
  ],
  "notifications": []
}
```


## 4. Edge Cases & Error Handling

Berikut adalah daftar skenario kegagalan dan penanganan logis yang disematkan langsung pada sisi aplikasi klien (offline):

### A. Validasi Tanggal Pencapaian Mendahului Tanggal Lahir
- **Skenario**: Bunda memilih tanggal pencapaian perkembangan (`achievedAt`) yang secara logis mustahil terjadi karena mendahului tanggal lahir anak (`child.dateOfBirth`).
- **Respon Aplikasi**: Sebelum menyimpan, sistem mencocokkan nilai timestamp. Jika input tanggal < tanggal lahir anak:
  - Proses penyimpanan dibatalkan (dihambat).
  - State `errorMessage` diisi dengan pesan: *"Tanggal pencapaian tidak boleh sebelum tanggal lahir si Kecil ya, Bunda! 🧡"*
  - UI menampilkan kotak peringatan (alert box) berwarna Soft Pink (#F06292) di dalam dialog input.

### B. Validasi Tanggal Pencapaian Melebihi Hari Ini
- **Skenario**: Bunda salah memilih tanggal pencapaian di masa mendatang (tanggal di atas hari ini berdasarkan waktu sistem lokal).
- **Respon Aplikasi**: Sistem memvalidasi input tanggal dengan tanggal hari ini (`today`). Jika input tanggal > hari ini:
  - Proses penyimpanan dibatalkan.
  - State `errorMessage` diisi dengan pesan: *"Tanggal pencapaian tidak boleh melebihi tanggal hari ini, Bunda."*
  - Tombol simpan dinonaktifkan atau menampilkan pesan error di atas form.

### C. Master Data Milestones Tidak Terbaca (Kosong)
- **Skenario**: Memori LocalStorage pada peramban terhapus atau kosong saat pertama kali aplikasi dijalankan.
- **Respon Aplikasi**: Saat aplikasi di-mount, fungsi `seedData.js` memeriksa eksistensi data dalam array `milestones`. Jika bernilai kosong atau undefined, fungsi tersebut secara otomatis menginjeksi (seed) 10 master data milestone standar perkembangan anak yang dikelompokkan berdasarkan usia dan kategori perkembangan, lalu menyimpannya ke kunci utama `"hayya_app_data"`.

### D. Tidak Ada Anak Aktif yang Dipilih
- **Skenario**: Bunda membuka halaman perkembangan tetapi belum pernah menambahkan data anak sama sekali.
- **Respon Aplikasi**:
  - Halaman tracker mendeteksi `activeChild === null`.
  - Sistem menyembunyikan daftar checklist perkembangan dan menampilkan antarmuka khusus (Empty State) yang berisikan ilustrasi ramah serta ajakan: *"Bunda belum mendaftarkan si Kecil. Yuk, tambah profil si Kecil terlebih dahulu untuk mulai mencatat dan memantau tumbuh kembangnya! 👶✨"*
  - Disediakan tombol aksi utama berbentuk pill (rounded-full) dengan warna Rose Pink (#C2185B) berlabel **"Tambah Profil Anak"** yang secara instan membuka modul pembuatan profil anak.

### E. Penyimpanan LocalStorage Penuh (Quota Exceeded)
- **Skenario**: Kapasitas penyimpanan LocalStorage browser milik Bunda telah mencapai batas maksimal (biasanya sekitar 5MB).
- **Respon Aplikasi**:
  - Operasi `localStorage.setItem` dibungkus dengan blok pengaman `try ... catch`.
  - Jika tertangkap galat berkode `QuotaExceededError`, aplikasi tidak akan macet (crash) melainkan menangkap galat tersebut.
  - Sistem menampilkan banner pemberitahuan darurat kepada Bunda: *"Aduh maaf Bunda, memori penyimpanan di browser HP Bunda sudah penuh. Mohon bersihkan berkas sampah browser Bunda agar data perkembangan si Kecil tetap tersimpan dengan aman."*


## 5. Dependencies dengan Fitur Lain

Fitur Checklist Perkembangan Anak (F-04 & F-05) memiliki keterkaitan erat dengan beberapa modul lain di dalam aplikasi Hayya:

### A. Ketergantungan dengan Fitur Profil Ibu & Data Anak (F-02)
- **Data Kunci**: `childId` dan `dateOfBirth` dari profil anak yang sedang aktif.
- **Hubungan Kerja**: Halaman perkembangan mutlak membutuhkan data profil anak aktif dari `useChild`. Usia anak dalam bulan dihitung secara dinamis dari `dateOfBirth` anak untuk menyajikan filter rentang usia milestone yang paling relevan secara default saat Bunda pertama kali membuka layar perkembangan.

### B. Memicu Notifikasi Lokal / In-App Notification (F-03)
- **Aksi Pemicu**: Ketika Bunda mengubah status pencapaian milestone.
- **Hubungan Kerja**: 
  - Jika Bunda menandai sebuah milestone kritis (`isCritical: true` alias Red Flag) sebagai **"Sudah Bisa"** (`achieved`), sistem dapat menambahkan pesan selamat di daftar notifikasi in-app: *"Hebat sekali Bunda! Si Kecil [Nama Anak] sudah berhasil melewati fase perkembangan penting: [Deskripsi Milestone]. Terus berikan stimulasi terbaik ya! 🎉"*
  - Jika anak telah melewati batas usia kelompok milestone tertentu namun terdapat milestone bertanda Red Flag yang masih berstatus **"Belum"** atau **"Pantau"**, sistem secara cerdas akan menyisipkan notifikasi lokal baru dalam array `notifications`: *"Peringatan Red Flag: Si Kecil [Nama Anak] sudah berusia [X] bulan tetapi belum mencapai milestone: [Deskripsi]. Yuk Bunda, coba lakukan stimulasi harian atau konsultasikan ke tenaga medis terdekat. 🩺"*

### C. Keterkaitan dengan Laporan & Garis Waktu Perkembangan (F-05)
- **Data Kunci**: Data array `milestoneRecords` hasil input Bunda.
- **Hubungan Kerja**: Tampilan Timeline Perkembangan anak pada Laporan Perkembangan dirakit dengan memfilter array `milestoneRecords` untuk `childId` aktif, mengurutkannya berdasarkan kolom tanggal `achievedAt`, lalu menggabungkannya dengan deskripsi dari entitas `milestones` untuk menghasilkan laporan kronologis lengkap yang siap cetak (print-friendly).

### D. Rekomendasi Edukasi & Artikel Stimulasi (F-11)
- **Hubungan Kerja**: Jika status suatu milestone adalah **"Belum"** (`not_yet`) or **"Pantau"** (`monitoring`), pada modal detail stimulasi, sistem dapat menampilkan rekomendasi berupa tautan langsung ke artikel edukasi parenting (dari entitas `articles`) yang memiliki kecocokan kategori (misal: kategori artikel *"toddler"* atau *"newborn"* yang relevan dengan aspek motorik atau bahasa) agar Bunda memperoleh panduan praktis yang lebih kaya.
