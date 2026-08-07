# CONTEXT & SPECIFICATION: MICRO-PORTAL DESA CANTIK BPS SUBANG

## 1. Project Overview

Proyek ini bertujuan membangun **Template Micro-Portal Web 1-Halaman (Single Page Application)** untuk publikasi data statistik dan potensi desa di Kabupaten Subang. Web ini berfungsi sebagai sarana *Desa Cantik* (Desa Cinta Statistik) yang diinisiasi oleh BPS Kabupaten Subang.

## 2. Core Problem & Target User

- **Masalah Utama:** Pengelolaan website di tingkat desa sering kali terbengkalai karena rumitnya CMS, biaya maintenance server/hosting tinggi, serta keterbatasan kapasitas teknis operator desa.
- **Target Operator:** Perangkat desa / operator non-IT (orang awam). Pengisian data harus sangat simpel, setara mengedit Google Sheets / Excel biasa.
- **Target Pembaca:** Masyarakat umum, peneliti, dan pihak BPS yang membutuhkan akses cepat ke data makro dan dokumen resmi desa.

## 3. Technical Constraints & Principles

- **Principle:** KISS (Keep It Stupid Simple), Zero-Maintenance, Light-Weight.
- **No Heavy Frameworks:** Murni HTML5, Tailwind CSS (via CDN), dan Vanilla JavaScript. Tanpa proses build kompleks (`npm`, `webpack`, dsb.).
- **No Paid Backend/Database:** Memanfaatkan Google Sheets (via SheetDB / Google Visualization API / JSON lokal) sebagai database terdistribusi.
- **Zero Hosting Cost:** Didesain untuk di-host secara gratis via GitHub Pages atau Vercel.
- **Mobile First & Fast Loading:** Aman diakses menggunakan smartphone di area dengan sinyal internet terbatas.

## 4. UI/UX Structure & Components

Tampilan halaman tunggal harus mencakup modul-modul berikut secara berurutan:

1. **Header / Hero Section**
   - Logo Kabupaten Subang & Logo BPS Subang.
   - Judul Desa & Subjudul Indikator Statistik Terpadu.
2. **Stat Cards (Ringkasan Data Makro)**
   - 4 Card Utama: Total Penduduk, Luas Wilayah ($km^2$), Kepadatan Penduduk ($jiwa/km^2$), dan Jumlah RT/RW.
   - Indikator visual bersih dengan efek hover Tailwind.
3. **Chart & Visualisasi Data**
   - 1-2 Grafik Interaktif (Chart.js via CDN) untuk memvisualisasikan data mata pencaharian utama atau kelompok umur.
4. **Tabel Publikasi & Dokumen Resmi**
   - Tabel sederhana berisi dokumen KCDA (Kecamatan Dalam Angka), Monografi Desa, dan Perdes.
   - Direct link ke Google Drive penyimpanan BPS/Desa.
5. **Footer**
   - Informasi Lisensi & Kredit: BPS Kabupaten Subang x Tim PKL / Pemdes.

## 5. Data Flow Architecture

1. Data statistik desa disimpan pada sebuah **Google Spreadsheet** terpusat/per desa.
2. JavaScript di sisi client mengambil (*fetch*) data dalam bentuk JSON secara asynchronous saat halaman dimuat.
3. DOM diperbarui secara dinamis tanpa perlu melakukan reload halaman (*re-render card, chart, dan tabel*).

## 6. Duplication & Scalability Goal

Satu folder struktur kodingan ini harus bisa **di-duplikasi secara massal** untuk desa-desa lain di Kabupaten Subang hanya dengan mengganti:

- Variabel `CONFIG` (Nama Desa, URL Google Sheets API, Link Drive).
- File aset gambar (Logo Desa / Foto Balai Desa).
