# 💈 SalonCukurKilat — Manajemen Barbershop & Booking Home Service (PWA + Google Apps Script)

Aplikasi web *mobile-first* bergaya **"SNIP & SHAVE"** (Dark Teal `#062320` & Golden Mustard `#e5a93c`) untuk manajemen operasional barbershop modern, sistem booking anti-bentrok (Studio & Home Service), kartu stempel loyalitas member 15x potong, perhitungan komisi barber otomatis, serta integrasi real-time ke **Google Sheets & Google Drive** melalui **Google Apps Script**.

---

## 🔗 Link Akses & Integrasi

- **GitHub Repository**: `https://github.com/mandalaprojek/SalonCukurKilat`
- **GitHub Pages (Live PWA)**: `https://mandalaprojek.github.io/SalonCukurKilat/`
- **Google Apps Script Web App API**: `https://script.google.com/macros/s/AKfycbwRaYx4eaGcI_4e4pDj_lYxQQJmwTNL82ia7xyrq-xxfDTnnqe_dLWNBr6aY7WI5-DXRg/exec`

---

## ✨ Fitur Utama

1. **📲 Instalasi PWA (Progressive Web App — Hanya 1 MB)**
   - Dilengkapi **Floating Bottom Pill (`"📲 Pasang Aplikasi (Hanya 1 MB)"`)** di area jempol layar ponsel.
   - Mendukung *1-Click Native Install* di Android Chrome (melalui `manifest.json` & Service Worker `sw.js`) serta panduan visual pintar untuk pengguna iPhone (Safari iOS).
2. **📅 Sistem Booking Anti-Bentrok (Studio & Home Service)**
   - Pelanggan memilih kapster, tanggal, dan slot jam secara real-time.
   - Dilengkapi proteksi `LockService.getScriptLock()` di Google Apps Script agar tidak terjadi *double-booking*.
3. **⭐ Kartu Loyalitas Member (15x Potong = Gratis 1x)**
   - Stempel digital otomatis bertambah setiap pembayaran lunas.
   - Validasi ekstra: Reward terbuka saat mencapai 15 kunjungan dan konsisten memberi ulasan bintang 5.
4. **💰 Kasir & Komisi Barber Otomatis (40% – 45%)**
   - Admin mencatat pembayaran (`QRIS`, `Cash`, `Transfer`), sistem otomatis membagi komisi kapster dan membuat tombol kirim struk WhatsApp (`wa.me`).
5. **📦 Manajemen Stok Produk & Rekrutmen Kapster Baru**
   - Pemantauan stok pomade/tonic/shampoo dengan indikator stok menipis.
   - Formulir lamaran kerja barber lengkap dengan unggah foto KTP & KK ke Google Drive.

---

## 🔑 Akun Demo (Uji Coba Cepat)

| Peran | Kredensial Masuk | Hak Akses |
| :--- | :--- | :--- |
| **👤 Pelanggan / Member** | Nomor WA: `081398765432` (Andi — 14/15 Potong) atau `081355556666` (Dimas — 15/15 Reward Siap Klaim) | Booking cukur, cek kartu stempel member, lihat riwayat gaya rambut & beri rating |
| **✂️ Kapster / Barber** | Pilih Barber (`Rizky` / `Bagas` / `Budi`) · PIN: `1234` | Lihat antrean hari ini, catatan bentuk kepala pelanggan, unggah foto hasil cukur, cek komisi |
| **🛡️ Owner / Superadmin** | Kode Akses: `admin123` | Dashboard omset lengkap, kasir & struk WA, rekap komisi semua barber, stok produk, seleksi pelamar |

---

## 📁 Struktur Proyek

```text
SalonCukurKilat/
├── .github/workflows/deploy.yml   # Otomatisasi CI/CD Build & Deploy ke GitHub Pages
├── gas/
│   ├── Code.gs                    # Backend Google Apps Script (8 Sheet Database + REST API JSON)
│   └── Index.html                 # Versi Single-File HTML Mandiri untuk dijalankan di dalam GAS
├── public/
│   ├── manifest.json              # Web App Manifest untuk instalasi PWA
│   └── sw.js                      # Service Worker untuk dukungan aplikasi mandiri
├── src/
│   ├── components/
│   │   ├── common/PwaInstallBar.tsx
│   │   ├── layout/MobileHeader.tsx & MobileTabBar.tsx
│   │   └── views/                 # LoginView, HomeView, BookingView, HistoryMemberView, ManagementView
│   ├── context/AppContext.tsx     # State Management + Sinkronisasi Real-Time ke Google Sheets
│   ├── data/mockData.ts           # Data awal barbershop
│   └── App.tsx
└── PRD.md                         # Dokumen Spesifikasi Produk Lengkap
```

---

## 🚀 Cara Menjalankan di Lokal

```bash
npm install
npm run dev
```

Untuk mem-build versi produksi:

```bash
npm run build
```