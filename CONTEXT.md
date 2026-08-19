# CONTEXT & SPECIFICATION: MICRO-PORTAL DESA CANTIK BPS SUBANG

## 1. Project Overview

Proyek ini bertujuan membangun **Template Micro-Portal Web 1-Halaman (Single Page Application)** untuk publikasi data statistik, dokumen resmi, serta pameran potensi/keunggulan desa di Kabupaten Subang. Web ini berfungsi sebagai sarana *Desa Cantik* (Desa Cinta Statistik) yang diinisiasi oleh BPS Kabupaten Subang.

## 2. Core Problem & Target User

- **Masalah Utama:** Pengelolaan website di tingkat desa sering kali terbengkalai karena CMS yang rumit, biaya maintenance server tinggi, serta ketiadaan admin berkemampuan IT khusus.
- **Target Operator:** Perangkat desa / operator non-IT (pengelolaan data cukup melalui Google Sheets / Excel).
- **Target Pembaca:** Masyarakat umum, peneliti, dan BPS yang membutuhkan akses data statistik, dokumen resmi, serta gambaran potensi unggulan desa.

## 3. Technical Constraints & Principles

- **Principle:** KISS (Keep It Stupid Simple), Zero-Maintenance, Light-Weight.
- **No Heavy Frameworks:** Murni HTML5, Tailwind CSS (via CDN), FontAwesome (via CDN), Chart.js (via CDN), dan Vanilla JavaScript. Tanpa proses build (`npm`, `webpack`, dsb.).
- **No Paid Backend/Database:** Memanfaatkan Google Sheets (via Google Apps Script Web App 100% Gratis / SheetDB / JSON lokal) sebagai database terdistribusi.
- **Zero Hosting Cost:** Didesain untuk di-host secara gratis via GitHub Pages atau Vercel.
- **Mobile First & Fast Loading:** Tampilan responsif dan cepat diakses di daerah dengan sinyal internet terbatas.

## 4. UI/UX Structure & Components (Urutan Modul)

Tampilan halaman tunggal harus mencakup modul-modul berikut secara berurutan:

1. **Header / Hero Section**
   - Logo Kabupaten Subang & Logo BPS Subang.
   - Badge 'Desa Cantik' & Judul Desa beserta Subjudul Indikator Statistik.
2. **Stat Cards (Ringkasan Data Makro)**
   - 4 Card Utama: Total Penduduk, Luas Wilayah (km²), Kepadatan Penduduk (jiwa/km²), dan Jumlah RT/RW.
   - Indikator visual bersih dengan ikon dan efek hover Tailwind.
3. **Galeri Potensi & Keunggulan Desa (Fitur Visual Foto)**
   - Grid Card responsif untuk menampilkan foto-foto produk UMKM, destinasi wisata, komoditas unggulan pertanian, atau infrastruktur desa.
   - Komponen Kartu: Foto Sampul, Badge Kategori (UMKM / Wisata / Pertanian / Seni), Judul Potensi, dan Deskripsi Singkat.
   - Efek hover micro-interaction (zoom foto/shadow) saat disentuh atau diarahkan kursor.
4. **Chart & Visualisasi Data**
   - Grafik Interaktif (Chart.js via CDN) untuk memvisualisasikan data mata pencaharian utama penduduk.
5. **Tabel Publikasi & Dokumen Resmi**
   - Tabel sederhana berisi dokumen KCDA (Kecamatan Dalam Angka), Monografi Desa, Perdes, dan Laporan Keuangan.
   - Direct link ke Google Drive penyimpanan BPS/Desa.
6. **Footer**
   - Informasi Kontak, Alamat Balai Desa, Lisensi & Kredit: BPS Kabupaten Subang x Pemdes.

## 5. Data Flow Architecture & Google Sheets Schema

Data diambil secara asynchronous via Vanilla JavaScript `fetch()`. Struktur Google Sheets dibagi menjadi 5 Tab/Sheet:

- **Tab 1 (`identitas`):** namaDesa, kecamatan, kabupaten, provinsi, kodeDesa, deskripsi, alamatKantor, email, telepon.
- **Tab 2 (`statistikMakro`):** totalPenduduk, luasWilayah, kepadatanPenduduk, jumlahRt, jumlahRw, jumlahKk.
- **Tab 3 (`potensiDesa`):** id, judulPotensi, kategori, deskripsi, urlFoto.
- **Tab 4 (`mataPencaharian`):** kategori, jumlah, persentase.
- **Tab 5 (`dokumenPublikasi`):** id, judul, kategori, tahun, ukuran, deskripsi, urlDrive.

## 6. Duplication & Scalability Goal

Kodingan didesain modular. Untuk mereplikasi portal ke desa lain di Subang, operator hanya perlu mengganti variabel `CONFIG.DATA_URL` di `app.js` yang mengarah ke link Google Sheets desanya masing-masing.
