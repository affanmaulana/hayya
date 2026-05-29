# 7. Teknologi & Keamanan

Bab ini menjelaskan arsitektur teknologi dan standar keamanan untuk MVP Aplikasi Hayya. Pendekatan MVP ini dirancang untuk dapat berjalan sepenuhnya secara lokal di browser/perangkat pengguna tanpa memerlukan infrastruktur server eksternal, guna memastikan privasi data maksimal dan mempercepat waktu rilis.

## 7.1 Stack Teknologi (MVP Local-First)

Untuk mencapai MVP yang cepat, offline-capable, dan menghargai privasi secara absolut (data tidak keluar dari perangkat pengguna), stack teknologi berikut digunakan secara ketat:

| Area | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Frontend Framework** | React + Vite | Cepat, modern, dan dioptimalkan untuk performa tinggi. Dapat diakses via web browser mobile. |
| **Routing** | React Router DOM v6 | Mengatur navigasi antar halaman (Dashboard, Perkembangan, MPASI, dll). |
| **Styling** | Tailwind CSS | Utility-first CSS untuk membangun UI yang responsif, *mobile-first*, dan konsisten dengan desain sistem Rose Pink. |
| **State Management** | React Hooks | Menggunakan `useState` dan `useEffect` beserta *custom hooks* (seperti `useAuth`, `useChild`) untuk abstraksi logika. |
| **Data Persistence** | LocalStorage | **Satu-satunya sumber penyimpan data.** Semua entitas (user, anak, catatan) disimpan dalam localStorage. Tidak ada integrasi backend atau database eksternal. |
| **Konektivitas Eksternal**| Tidak Ada | Tidak ada pemanggilan API ke pihak ketiga (fetch/axios dilarang). Master data (vaksin, milestone) disimpan sebagai *seed data* internal. |

> **Peringatan Batasan Sistem:** Penggunaan backend (Node.js, Express), database relasional/NoSQL (PostgreSQL, Firebase, Supabase), Cloud Storage (AWS S3), dan layanan Push Notification pihak ketiga **dilarang/ditiadakan** pada arsitektur MVP ini.

## 7.2 Struktur Data & Manajemen Skema

Seluruh data persisten disimpan di dalam satu objek JSON di `localStorage` menggunakan kunci tunggal `"hayya_app_data"`.

**Skema JSON Utama (Root):**
```json
{
  "users": [],
  "children": [],
  "growthRecords": [],
  "milestoneRecords": [],
  "immunizationRecords": [],
  "mpasiPlans": [],
  "symptomChecks": [],
  "savedArticles": [],
  "notifications": []
}
```

* **ID Unik (UUID):** Semua ID entri (seperti user ID, child ID) dibuat menggunakan Web Crypto API bawaan browser: `crypto.randomUUID()`.
* **Akses Data Terpusat:** Aplikasi berinteraksi dengan `localStorage` hanya melalui fungsi *utility* dan *custom hooks* khusus. Komponen UI tidak boleh mengakses `localStorage` secara langsung.
* **Migrasi dan Perubahan Skema:** Perubahan struktur JSON yang sudah ada harus dikelola dengan hati-hati melalui skrip migrasi internal agar data milik pengguna (Bunda) tidak hilang saat aplikasi diperbarui.

## 7.3 Keamanan Data & Privasi

Walaupun aplikasi berjalan sepenuhnya offline di sisi klien, prinsip keamanan tetap diutamakan:

* **Privasi Maksimal (Zero-Data Collection):** Data identitas Bunda dan kesehatan anak (pertumbuhan, gejala penyakit, MPASI) murni tersimpan di HP Bunda. Data tidak ditransmisikan, tidak dikumpulkan di server pusat, dan tidak akan pernah dibagikan/dijual ke pihak ketiga.
* **Hashing Kredensial Lokal:** Sistem autentikasi MVP menggunakan PIN. PIN ini tidak pernah disimpan dalam *plain-text*. PIN di-hash menggunakan algoritma SHA-256 (melalui `crypto.subtle.digest`) sebelum disimpan sebagai `pinHash` di dalam JSON.
* **Ketahanan terhadap Serangan Jaringan:** Karena tidak ada komunikasi *client-server* untuk pengambilan atau penyimpanan data pengguna, aplikasi kebal terhadap penyadapan jaringan (Man-in-the-Middle) atau serangan injeksi database eksternal.
* **Kendali Data Penuh (Penghapusan Mandiri):** Mematuhi prinsip perlindungan data, pengguna memiliki opsi di pengaturan Profil untuk "Hapus Akun & Data". Aksi ini akan secara permanen menghapus objek `hayya_app_data` dari `localStorage`, menghilangkan seluruh jejak pengguna dari perangkat.
