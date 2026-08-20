---
version: 3.0.0
name: Design System & Spesifikasi UI/UX Micro-Portal Desa Cantik BPS Kabupaten Subang
description: >
  Design System resmi Template Micro-Portal Web 1-Halaman (Single Page Application)
  Desa Cantik (Desa Cinta Statistik) BPS Kabupaten Subang.
  Mengintegrasikan Identitas Visual BPS (Navy Blue, Amber Orange, Emerald Green),
  Golden Ratio (Phi = 1.618) untuk tipografi, spacing, layout split (61.8% : 38.2%),
  serta Aturan Keseimbangan Warna 60-30-10 untuk antarmuka publikasi data statistik desa yang presisi,
  estetis, dan responsif.

# ─────────────────────────────────────────────────────────────────

# CHANGELOG

# ─────────────────────────────────────────────────────────────────

changelog:

- version: "3.0.0"
    date: "2026-08-20"
    author: "BPS Kabupaten Subang x Design System Team"
    changes:
  - "Pembaruan total spesifikasi sistem desain sesuai karakteristik Micro-Portal Web Desa Cantik (Single Page Application)."
  - "Penerapan Prinsip Golden Ratio (φ = 1.618) pada Skala Tipografi, Spacing Grid Fibonacci, dan Layout Split (61.8% : 38.2%)."
  - "Penerapan Aturan Keseimbangan Warna Golden Ratio 60-30-10 (60% Surface Netral, 30% BPS Navy Structure, 10% Amber Accent)."
  - "Spesifikasi Komponen Baru: Glassmorphic Header, Hero Banner, Stat Cards Makro, Modul Statistik Tematik (4 Tab: Demografi, Sosial, Ekonomi, Pertanian), Galeri Potensi Wilayah (Filter & Pagination), Chart.js Donut Chart, dan Pusat Dokumen Publikasi."
  - "Integrasi Arsitektur Data Google Sheets 9-Tab (Google Apps Script Web App 100% Gratis & Unlimited)."

- version: "2.0.0"
    date: "2026-08-20"
    author: "Design System Team"
    changes:
  - "Inisialisasi dasar sistem token warna BPS dan tipografi."

# ─────────────────────────────────────────────────────────────────

# 1. COLOR SYSTEM — Golden Ratio 60-30-10 Rule

# ─────────────────────────────────────────────────────────────────

# Aturan 60-30-10

# - 60% Dominant Surface (White / Light Slate #F8FAFC) -> Latar Belakang & Kartu

# - 30% Secondary Structure (BPS Navy Blue #005BAA / #0F2B48) -> Header, Title & Teks Utama

# - 10% Accent Focus (BPS Amber Orange #F59E0B / #E8601C) -> Badge, Highlight & Button CTA

# ─────────────────────────────────────────────────────────────────

colors:

# ── Brand Utama BPS (Badan Pusat Statistik) ───────────────────

  bps-navy:       "#005BAA"   # Warna Utama BPS (Biru Statistik & Kepercayaan)
  bps-dark:       "#0A192F"   # Navy Gelap untuk Hero Background & Glass Header
  bps-blue-light: "#F0F6FF"   # Soft Blue untuk Surface Highlight
  bps-amber:      "#F59E0B"   # Warna Aksesibilitas (Aksi & Showcase)
  bps-emerald:    "#10B981"   # Warna Pertanian & Status Positif

# ── Proportion Breakdown (60-30-10) ───────────────────────────

  dominant-60:
    bg-page:      "#F8FAFC"   # 60% Dominan: Latar Belakang Halaman
    bg-card:      "#FFFFFF"   # Surface Kartu & Panel Utama
    bg-glass:     "rgba(255, 255, 255, 0.96)" # Glassmorphic Header Surface

  secondary-30:
    text-primary: "#0F1923"   # Teks Heading & Judul Utama
    text-body:    "#334155"   # Teks Paragraf & Isi Dokumen
    text-muted:   "#64748B"   # Teks Sekunder, Keterangan & Label
    brand-header: "#005BAA"   # Brand Anchor Navigasi & Border Utama

  accent-10:
    cta-button:   "#F59E0B"   # 10% Fokus: Aksesibilitas Tombol Utama / Badge Showcase
    cta-hover:    "#D97706"   # Hover State Tombol Utama
    highlight-badge: "#FEF3C7"# Background Badge Highlight (Amber 100)

# ── Semantic & Status Colors ──────────────────────────────────

  status:
    success:      "#10B981"   # Emerald Green: Data Terupdate, Status Mandiri
    warning:      "#F59E0B"   # Amber: Peringatan, Indikator Perhatian
    error:        "#EF4444"   # Rose Red: Error Fetching Data / Validasi Gagal
    info:         "#0284C7"   # Sky Blue: Informasi Tambahan

# ── Neutral Scale (Slate Palette) ─────────────────────────────

  neutral-900:    "#0F172A"   # Heading Gelap
  neutral-800:    "#1E293B"   # Subheading & Icon Text
  neutral-700:    "#334155"   # Body Text
  neutral-500:    "#64748B"   # Secondary Text
  neutral-300:    "#CBD5E1"   # Border Normal
  neutral-200:    "#E2E8F0"   # Divider & Border Tipis
  neutral-100:    "#F1F5F9"   # Light Section Background
  neutral-50:     "#F8FAFC"   # Page Main Canvas Background
  white:          "#FFFFFF"

# ─────────────────────────────────────────────────────────────────

# 2. TYPOGRAPHY — Golden Ratio Scale (Multiplier φ = 1.618)

# ─────────────────────────────────────────────────────────────────

# Skala Tipografi Emas berbasis Golden Ratio (1.618)

# Base: 16px (1rem)

# 10px (0.618rem) -> 12.5px (0.786rem) -> 16px (1rem) -> 20.3px (1.272rem) -> 26px (1.618rem) -> 42px (2.618rem) -> 68px (4.236rem)

# ─────────────────────────────────────────────────────────────────

typography:
  fontFamily:
    display:  "Plus Jakarta Sans"   # Display & Headings (Modern, Ramah, Tegas)
    body:     "Plus Jakarta Sans"   # Body Text
    mono:     "JetBrains Mono"      # Angka Statistik, Kode Desa, Indikator Angka

  goldenScale:
    xs:    "0.618rem"   # ~10px — Overline, Caption Sangat Kecil, Tag Kode
    sm:    "0.786rem"   # ~12.5px — Caption, Label Form, Micro Badge
    base:  "1.000rem"   # 16px — Body Text Standar
    md:    "1.272rem"   # ~20.3px — Subheading, Card Title, Lead Text
    lg:    "1.618rem"   # ~26px — Section Title, H3 (Golden Ratio Level 1)
    xl:    "2.618rem"   # ~42px — Page Heading, H2 (Golden Ratio Level 2)
    2xl:   "4.236rem"   # ~68px — Hero Headline, Stat Cards Value (Golden Ratio Level 3)

  weights:
    regular:  400
    medium:   500
    semibold: 600
    bold:     700
    extrabold: 800

  lineHeight:
    tight:    1.2     # Heading Besar & Stat Cards
    snug:     1.4     # Heading Kecil & Subjudul
    normal:   1.618   # Golden Ratio Line-Height untuk Body Text (Meningkatkan Keterbacaan)
    relaxed:  1.75    # Paragraf Deskripsi Panjang

  letterSpacing:
    tight:    "-0.025em"  # Heading Utama
    normal:   "0em"
    wide:     "0.05em"    # Badge & Overline Uppercase

# ─────────────────────────────────────────────────────────────────

# 3. SPACING — Golden Ratio & Fibonacci Grid (Base 4px)

# ─────────────────────────────────────────────────────────────────

# Urutan Fibonacci (Golden Ratio Approximation)

# 4px -> 8px -> 13px -> 21px -> 34px -> 55px -> 89px -> 144px

# ─────────────────────────────────────────────────────────────────

spacing:
  0:   "0px"
  1:   "4px"     # Gap Mikro (Ikon ke Teks)
  2:   "8px"     # Padding Button Kecil & Badge Inline
  3:   "13px"    # Padding Input & Button Standar (Fibonacci Level 3)
  4:   "21px"    # Card Inner Padding & Grid Gap (Fibonacci Level 4)
  5:   "34px"    # Section Internal Gap & Margin Komponen (Fibonacci Level 5)
  6:   "55px"    # Section Outer Padding / Vertical Spacing (Fibonacci Level 6)
  7:   "89px"    # Large Section Container Distance (Fibonacci Level 7)
  8:   "144px"   # Hero Banner Maximum Vertical Spacing (Fibonacci Level 8)

# ─────────────────────────────────────────────────────────────────

# 4. BORDER RADIUS & ELEVATION

# ─────────────────────────────────────────────────────────────────

radius:
  none:  "0px"
  sm:    "8px"     # Badge & Small Tags
  md:    "12px"    # Buttons, Inputs, Small Cards
  lg:    "16px"    # Medium Cards & Dropdowns
  xl:    "24px"    # Large Section Container & Stat Cards
  2xl:   "32px"    # Hero Banner & Main Section Cards
  full:  "9999px"  # Pill Badge & Round Avatars

elevation:
  none: shadow-none
  xs:   "0 1px 2px rgba(0, 0, 0, 0.04)"
  glass: "0 8px 32px 0 rgba(0, 91, 170, 0.08)" # Subtle Glassmorphism Shadow
  card:  "0 4px 20px -2px rgba(15, 23, 42, 0.06)"
  hover: "0 12px 28px -4px rgba(15, 23, 42, 0.12)"

# ─────────────────────────────────────────────────────────────────

# 5. LAYOUT & GOLDEN RATIO SPLIT (61.8% : 38.2%)

# ─────────────────────────────────────────────────────────────────

# Distribusi Tata Letak Dua Kolom mengikuti Proporsi Emas (Golden Ratio)

# Main Content Area : 61.8% (~ 7 s/d 8 Kolom Grid)

# Sidebar / Widget  : 38.2% (~ 4 s/d 5 Kolom Grid)

# ─────────────────────────────────────────────────────────────────

layout:
  grid:       12
  goldenSplit:
    mainArea:    "61.8%"  # ~8 dari 12 Kolom
    sidebarArea: "38.2%"  # ~4 dari 12 Kolom
    ratio:       1.618

  maxWidth:   "1280px"    # Max Container Width (max-w-7xl)

  breakpoints:
    mobile:   "375px"     # Smartphone
    sm:       "640px"     # Small Tablet / Large Mobile
    md:       "768px"     # Tablet Medium
    lg:       "1024px"    # Laptop / Desktop
    xl:       "1280px"    # Desktop Wide

# ─────────────────────────────────────────────────────────────────

# 6. SPESIFIKASI KOMPONEN UTAMA PORTAL

# ─────────────────────────────────────────────────────────────────

components:

# ── Glassmorphic Top Navbar ──────────────────────────────────

  navbar:
    height:        "64px"
    background:    "rgba(255, 255, 255, 0.96)"
    backdropBlur:  "16px"
    borderBottom:  "1px solid rgba(226, 232, 240, 0.8)"
    branding:
      subangLogo:  "Lambang Kabupaten Subang (Height 28px)"
      bpsLogo:     "Lambang BPS Indonesia (Height 24px)"
      title:       "DESA CANTIK SUBANG (Plus Jakarta Sans 800 Uppercase)"

# ── Hero Section (BPS Dark Navy Theme) ───────────────────────

  hero:
    background:    "linear-gradient(to bottom right, #0A192F, #005BAA, #0F172A)"
    textColor:     "#FFFFFF"
    padding:       "55px 21px" # Mengikuti Spacing Fibonacci 55px
    badge:
      text:        "Desa Cinta Statistik (Desa Cantik)"
      bg:          "rgba(245, 158, 11, 0.15)"
      color:       "#F59E0B"
      border:      "1px solid rgba(245, 158, 11, 0.3)"

# ── Stat Cards Makro (4 Card Layout) ──────────────────────────

  statCard:
    bg:            "#FFFFFF"
    borderRadius:  "24px"
    padding:       "21px"
    border:        "1px solid rgba(226, 232, 240, 0.8)"
    boxShadow:     "0 4px 20px -2px rgba(15, 23, 42, 0.06)"
    valueFont:     "JetBrains Mono, 800 Extrabold"
    categories:
      - title: "Total Penduduk"
        unit:  "Jiwa"
        icon:  "fa-users"
        theme: "Blue (Primary)"
      - title: "Luas Wilayah"
        unit:  "km²"
        icon:  "fa-map-location-dot"
        theme: "Emerald (Green)"
      - title: "Kepadatan Penduduk"
        unit:  "jiwa/km²"
        icon:  "fa-people-arrows"
        theme: "Amber (Orange)"
      - title: "Wilayah RT/RW"
        unit:  "RT / RW"
        icon:  "fa-building-flag"
        theme: "Indigo (Purple)"

# ── Modul Statistik Tematik (4 Tabbed Dashboard) ─────────────

  statTematik:
    containerBg:   "#FFFFFF"
    borderRadius:  "32px"
    padding:       "34px"
    tabs:
      - id: "demografi"
        label: "Demografi & Gender"
        icon: "fa-users-between-lines"
      - id: "sosial"
        label: "Sosial & Kesejahteraan"
        icon: "fa-hand-holding-heart"
      - id: "ekonomi"
        label: "Ekonomi & Monografi"
        icon: "fa-store"
      - id: "pertanian"
        label: "Pertanian & Peternakan"
        icon: "fa-wheat-awn"

# ── Galeri Potensi Wilayah ────────────────────────────────────

  potensiGallery:
    gridColumns:   "3 Kolom (Desktop), 1 Kolom (Mobile)"
    cardStyle:
      bg:          "#FFFFFF"
      borderRadius: "24px"
      overflow:    "hidden"
      hoverEffect: "Transform translateY(-4px) + Shadow Hover"
    detailView:    "Full Page Detail Screen (#view-potensi-detail) dengan Golden Ratio (61.8% Narasi Deskripsi : 38.2% Spesifikasi Pengelola & Nilai Ekonomi)"
    filterBar:
      activeTabBg: "#005BAA"
      activeColor: "#FFFFFF"
      inactiveBg:  "#F1F5F9"
      inactiveColor: "#475569"

# ── Chart Visualisasi (Distribusi Pekerjaan) ─────────────────

  jobChart:
    chartType:     "Doughnut / Pie Chart (Chart.js)"
    colors:        ["#005BAA", "#0284C7", "#06B6D4", "#F59E0B", "#10B981", "#64748B"]
    legendStyle:   "Progress Bar Horizontal dengan Nilai & Persentase"

# ─────────────────────────────────────────────────────────────────

# 7. ARSITEKTUR DATA & GOOGLE SHEETS 9-TAB SCHEMA

# ─────────────────────────────────────────────────────────────────

# Mendukung Google Apps Script Web App (100% Gratis Unlimited), SheetDB, dan JSON Lokal

# ─────────────────────────────────────────────────────────────────

dataArchitecture:
  endpointType: "Google Apps Script Web App (JSON Multi-Sheet Response)"
  sheetsSchema:
    1: "identitas (namaDesa, kecamatan, kabupaten, provinsi, kodeDesa, deskripsi, alamatKantor, email, telepon)"
    2: "statistikMakro (totalPenduduk, luasWilayah, kepadatanPenduduk, jumlahRt, jumlahRw, jumlahKk)"
    3: "potensiDesa (id, judulPotensi, kategori, deskripsi, lokasi, nilaiEkonomi, pengelola, urlFoto)"
    4: "mataPencaharian (kategori, jumlah, persentase)"
    5: "dokumenPublikasi (id, judul, kategori, tahun, ukuran, deskripsi, urlDrive)"
    6: "statusPenduduk (totalPenduduk, lakiLaki, perempuan, rasioJenisKelamin)"
    7: "statistikSosial (pendudukMiskin, penerimaBansos, pendidikanDominan, fasilitasPendidikan, fasilitasKesehatan, penyandangDisabilitas)"
    8: "statistikEkonomi (jumlahUmkm, jenisUsahaDominan, saranaPerdagangan, pendapatanRataRata, hargaKomoditasUtama, angkatanKerja)"
    9: "pertanianPeternakan (luasLahanPertanian, luasPanen, produksiPadi, produksiJagung, produksiBawangMerah, produksiSayuran, produksiBuah, jumlahTernak, produksiTelurDaging, jumlahKelompokTani)"

# ─────────────────────────────────────────────────────────────────

# 8. PEDOMAN GOLDEN RATIO & ATURAN PENGEMBANGAN (DO'S & DON'TS)

# ─────────────────────────────────────────────────────────────────

guidelines:
  dos:
    - "Gunakan proporsi Golden Ratio (60-30-10) untuk pemilihan warna antarmuka."
    - "Selalu gunakan font Plus Jakarta Sans untuk teks umum dan JetBrains Mono khusus angka data statistik."
    - "Pastikan spacing antar elemen menggunakan skala Fibonacci (4px, 8px, 13px, 21px, 34px, 55px)."
    - "Pastikan modul statistik tematik menggunakan struktur 4 tab yang rapi tanpa membuat halaman terlalu panjang."
    - "Gunakan kelas Tailwind CSS resmi tanpa menambah CSS kustom yang berlebihan."
    - "Pastikan seluruh section terbungkus dengan tag penutup HTML </section> yang valid."

  donts:
    - "Dilarang menggunakan warna acak di luar palet brand BPS (Navy Blue, Amber, Emerald, Slate)."
    - "Jangan hard-code nilai piksel sembarangan (seperti 17px atau 23px) yang merusak grid Fibonacci."
    - "Dilarang menumpuk section di dalam container grid 4-kolom yang menyebabkan layout terhimpit horizontal."
    - "Jangan menggunakan framework berat (seperti React/Vue/Angular) karena prinsip portal ini adalah Zero-Maintenance Vanilla JS."
