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
- **No Paid Backend/Database:** Memanfaatkan Google Sheets (via Google Apps Script Web App 100% Gratis & Unlimited / SheetDB / JSON lokal) sebagai database terdistribusi.
- **Zero Hosting Cost:** Didesain untuk di-host secara gratis via GitHub Pages atau Vercel.
- **Mobile First & Fast Loading:** Tampilan responsif dan cepat diakses di daerah dengan sinyal internet terbatas.

## 4. UI/UX Structure & Components (Urutan Modul)

Tampilan halaman tunggal mencakup modul-modul berikut secara berurutan:

1. **Header / Hero Section**
   - Logo Kabupaten Subang & Logo BPS Subang.
   - Badge 'Desa Cantik' & Judul Desa beserta Subjudul Indikator Statistik.
2. **Stat Cards (Ringkasan Data Makro)**
   - 4 Card Utama: Total Penduduk, Luas Wilayah (km²), Kepadatan Penduduk (jiwa/km²), dan Jumlah RT/RW.
   - Indikator visual bersih dengan ikon dan efek hover Tailwind.
3. **Modul Statistik Tematik Wilayah (Tabbed Interactive Dashboard)**
   - Tab 1: **Demografi & Gender** (Populasi Laki-laki, Perempuan, Sex Ratio)
   - Tab 2: **Sosial & Kesejahteraan** (Penduduk Miskin, Penerima Bansos, Pendidikan, Kesehatan, Disabilitas)
   - Tab 3: **Ekonomi & Monografi** (Jumlah UMKM, Jenis Usaha, Sarana Perdagangan, Rata-rata Pendapatan, Harga Komoditas Utama)
   - Tab 4: **Pertanian & Peternakan** (Luas Lahan, Luas Panen, Produksi Padi/Jagung/Bawang/Sayur/Buah, Jumlah Ternak, Kelompok Tani)
4. **Galeri Potensi & Keunggulan Desa (Fitur Visual Foto)**
   - Grid Card responsif untuk menampilkan foto-foto produk UMKM, destinasi wisata, komoditas unggulan pertanian, atau infrastruktur desa.
   - Komponen Kartu: Foto Sampul, Badge Kategori (UMKM / Wisata / Pertanian / Seni), Judul Potensi, Deskripsi, dan Pagination Interaktif.
5. **Chart & Visualisasi Data (Mata Pencaharian)**
   - Grafik Interaktif (Chart.js via CDN) untuk memvisualisasikan data mata pencaharian utama penduduk.
6. **Pusat Dokumen Publikasi & Banner Pintas**
   - Halaman khusus & banner pintas unduh publikasi KCDA (Kecamatan Dalam Angka), Monografi Desa, Peraturan Desa (Perdes), dan Laporan Keuangan via Google Drive.
7. **Footer**
   - Informasi Kontak, Alamat Balai Desa, Lisensi & Kredit: BPS Kabupaten Subang x Pemdes.

## 5. Data Flow Architecture & Google Sheets Schema

Data diambil secara asynchronous via Vanilla JavaScript `fetch()`. Struktur Google Sheets dibagi menjadi 9 Tab/Sheet:

- **Tab 1 (`identitas`):** namaDesa, kecamatan, kabupaten, provinsi, kodeDesa, deskripsi, alamatKantor, email, telepon.
- **Tab 2 (`statistikMakro`):** totalPenduduk, luasWilayah, kepadatanPenduduk, jumlahRt, jumlahRw, jumlahKk.
- **Tab 3 (`potensiDesa`):** id, judulPotensi, kategori, deskripsi, lokasi, nilaiEkonomi, pengelola, urlFoto.
- **Tab 4 (`mataPencaharian`):** kategori, jumlah, persentase.
- **Tab 5 (`dokumenPublikasi`):** id, judul, kategori, tahun, ukuran, deskripsi, urlDrive.
- **Tab 6 (`statusPenduduk`):** totalPenduduk, lakiLaki, perempuan, rasioJenisKelamin.
- **Tab 7 (`statistikSosial`):** pendudukMiskin, penerimaBansos, pendidikanDominan, fasilitasPendidikan, fasilitasKesehatan, penyandangDisabilitas.
- **Tab 8 (`statistikEkonomi`):** jumlahUmkm, jenisUsahaDominan, saranaPerdagangan, pendapatanRataRata, hargaKomoditasUtama, angkatanKerja.
- **Tab 9 (`pertanianPeternakan`):** luasLahanPertanian, luasPanen, produksiPadi, produksiJagung, produksiBawangMerah, produksiSayuran, produksiBuah, jumlahTernak, produksiTelurDaging, jumlahKelompokTani.

### Template Google Apps Script (100% Gratis Unlimited)

```javascript
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (e && e.parameter && e.parameter.sheet) {
    var sheetName = e.parameter.sheet;
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      return createJsonResponse({ status: "error", message: "Sheet '" + sheetName + "' tidak ditemukan." });
    }
    return createJsonResponse(readSheetData(sheet));
  }
  
  // Mengambil 9 Tab Data Sekaligus dalam 1 HTTP Request
  var result = {
    identitas: readSheetData(ss.getSheetByName("identitas")),
    statistikMakro: readSheetData(ss.getSheetByName("statistikMakro")),
    potensiDesa: readSheetData(ss.getSheetByName("potensiDesa")),
    mataPencaharian: readSheetData(ss.getSheetByName("mataPencaharian")),
    dokumenPublikasi: readSheetData(ss.getSheetByName("dokumenPublikasi")),
    statusPenduduk: readSheetData(ss.getSheetByName("statusPenduduk")),
    statistikSosial: readSheetData(ss.getSheetByName("statistikSosial")),
    statistikEkonomi: readSheetData(ss.getSheetByName("statistikEkonomi")),
    pertanianPeternakan: readSheetData(ss.getSheetByName("pertanianPeternakan"))
  };
  
  return createJsonResponse(result);
}

function readSheetData(sheet) {
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  var headers = data[0];
  var rows = data.slice(1);
  
  return rows.map(function(row) {
    var obj = {};
    headers.forEach(function(header, index) {
      if (header) {
        obj[header] = row[index];
      }
    });
    return obj;
  });
}

function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 6. Duplication & Scalability Goal

Kodingan didesain modular. Untuk mereplikasi portal ke desa lain di Kabupaten Subang, operator cukup mengganti variabel `CONFIG.DATA_URL` di `app.js` yang mengarah ke URL Google Apps Script Web App atau link data Google Sheets desanya masing-masing.
