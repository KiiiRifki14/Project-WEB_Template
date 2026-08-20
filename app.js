/**
 * ==============================================================================
 * MICRO-PORTAL DESA CANTIK BPS KABUPATEN SUBANG
 * File Javascript Utama (Vanilla JS - Zero Framework Dependencies)
 * ==============================================================================
 * 
 * PETUNJUK KUSTOMISASI UNTUK OPERATOR DESA / BPS:
 * 1. Objek CONFIG di bawah ini adalah kontrol utama portal.
 * 2. CARA MENGHUBUNGKAN KE GOOGLE SHEETS (TANPA BACKEND):
 *    - Opsi A (Rekomendasi - 100% Gratis Unlimited): Masukkan URL Web App Google Apps Script Anda.
 *      Contoh: DATA_URL: "https://script.google.com/macros/s/AKfycbx.../exec"
 *    - Opsi B (SheetDB): Masukkan URL API SheetDB Anda.
 *      Contoh: DATA_URL: "https://sheetdb.io/api/v1/1s3selzgb4f1i"
 * 3. Jika menggunakan data lokal:
 *    - Biarkan CONFIG.DATA_URL bernilai "./data.json".
 * ==============================================================================
 */

const CONFIG = {
    // Sumber Data (Dapat berupa Google Apps Script Web App URL, SheetDB API, atau "./data.json")
    DATA_URL: "https://script.google.com/macros/s/AKfycbyjrdgz5LDHTcfP3jIRxFHeIbnff3gfQbcPJX2mKg_J1cLE3O1parB92lxWRgeP5mfH/exec",

    // Konfigurasi Fallback Identitas (jika data dari Sheets kosong)
    NAMA_DESA: "Sadawarna",
    KECAMATAN: "Kecamatan Cibogo",
    KABUPATEN: "Kabupaten Subang",

    // Palet Warna Khas BPS untuk Grafik (Donut Chart & Progress Bars)
    CHART_COLORS: [
        '#005baa', // BPS Navy Blue (Utama)
        '#0284c7', // Sky Blue
        '#06b6d4', // Cyan
        '#f59e0b', // Amber / Orange
        '#10b981', // Emerald Green
        '#64748b'  // Slate Gray
    ]
};

// Global State Variables
let jobChartInstance = null;
let cachedIdentitas = {}; // Cache identitas desa dari Google Sheets
let cachedDokumen = []; // Cache dokumen untuk fitur pencarian & pagination
let cachedPotensi = []; // Cache potensi desa untuk filter & pagination
let currentFilteredPotensiHome = [];
let currentFilteredPotensiView = [];
let currentFilteredDocs = [];

let activePotensiCategoryHome = "Semua";
let activePotensiCategoryView = "Semua";
let activeDocCategory = "Semua";

// Current Pagination Pages
let currentPotensiPageHome = 1;
let currentPotensiPageView = 1;
let currentDocPage = 1;

/**
 * Helper Responsif: Menghitung Jumlah Item Per Halaman sesuai Lebar Layar (PC vs Mobile)
 */
function getPotensiItemsPerPage() {
    if (window.innerWidth >= 1024) {
        return 5; // PC Desktop: 1 kartu featured (2 kolom) + 1 kartu = Baris 1 (3 kolom); 3 kartu = Baris 2 (3 kolom). Total 5 kartu (Grid 100% Penuh tanpa lubang!)
    } else if (window.innerWidth >= 640) {
        return 4; // Tablet: 2 kolom x 2 baris = 4 kartu
    } else {
        return 3; // Mobile HP: 3 kartu per halaman (singkat & tanpa scroll panjang)
    }
}

function getDocItemsPerPage() {
    if (window.innerWidth >= 1024) {
        return 6; // PC Desktop Table: 6 baris per halaman
    } else {
        return 3; // Mobile HP Cards: 3 kartu per halaman
    }
}

/**
 * Inisialisasi Aplikasi saat DOM selesai dimuat
 */
document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 Initializing Micro-Portal Desa Cantik BPS Subang...");
    loadData();
    setupSearchListeners();

    // Check URL Hash for initial view switching
    if (window.location.hash === "#dokumen") {
        switchView("dokumen");
    } else if (window.location.hash === "#potensi") {
        switchView("potensi");
    } else if (window.location.hash === "#potensi-detail") {
        switchView("potensi");
    }

    // Auto-recalculate pagination items on screen resize with debounce
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (cachedPotensi.length > 0) {
                renderPotensiDesaHome(currentFilteredPotensiHome, currentPotensiPageHome);
                renderPotensiDesaView(currentFilteredPotensiView, currentPotensiPageView);
            }
            if (cachedDokumen.length > 0) {
                renderDokumenPublikasi(currentFilteredDocs, currentDocPage);
            }
        }, 200);
    });
});

/**
 * SPA View Switcher: Membedakan Tema & Konten Banner Antara 3 View (Beranda, Potensi, Dokumen)
 */
function switchView(viewName, customTitle = "") {
    const viewHome = document.getElementById("view-home");
    const viewPotensi = document.getElementById("view-potensi");
    const viewDokumen = document.getElementById("view-dokumen");
    const viewPotensiDetail = document.getElementById("view-potensi-detail");

    const tabHome = document.getElementById("nav-tab-home");
    const tabPotensi = document.getElementById("nav-tab-potensi");
    const tabDokumen = document.getElementById("nav-tab-dokumen");

    const heroBadgeTag = document.getElementById("hero-badge-tag");
    const heroBadgeSub = document.getElementById("hero-badge-sub");
    const heroTitle = document.getElementById("hero-title");
    const heroDesc = document.getElementById("hero-description");

    const mobileBtnHome = document.getElementById("mobile-btn-home");
    const mobileBtnPotensi = document.getElementById("mobile-btn-potensi");
    const mobileBtnDokumen = document.getElementById("mobile-btn-dokumen");
    const menuBadge = document.getElementById("menu-view-badge");

    const currentVillage = document.getElementById("hero-village-name")?.textContent || "Desa Sadawarna";

    if (!viewHome || !viewPotensi || !viewDokumen) return;

    if (viewName === "potensi-detail") {
        viewHome.classList.add("hidden");
        viewPotensi.classList.add("hidden");
        viewDokumen.classList.add("hidden");
        if (viewPotensiDetail) {
            viewPotensiDetail.classList.remove("hidden");
            triggerViewAnimation(viewPotensiDetail);
            if (!viewPotensiDetail.innerHTML.trim() || viewPotensiDetail.innerHTML.includes("Rendered dynamically")) {
                if (cachedPotensi && cachedPotensi.length > 0) {
                    bukaDetailPotensi(cachedPotensi[0].id);
                }
            }
        }
        triggerHeroAnimation();

        // Desktop Nav Styling
        if (tabHome) tabHome.className = "px-3.5 py-1.5 rounded-xl text-slate-600 hover:text-bps-blue hover:bg-slate-100 transition-all flex items-center gap-1.5";
        if (tabPotensi) tabPotensi.className = "px-3.5 py-1.5 rounded-xl text-amber-700 bg-amber-50 font-bold border border-amber-200 transition-all flex items-center gap-1.5 shadow-xs";
        if (tabDokumen) tabDokumen.className = "px-3.5 py-1.5 rounded-xl text-slate-600 hover:text-bps-blue hover:bg-slate-100 transition-all flex items-center gap-1.5";

        // Mobile Drawer Button Styling
        setMobileButtonState(mobileBtnHome, "home", false);
        setMobileButtonState(mobileBtnPotensi, "potensi", true);
        setMobileButtonState(mobileBtnDokumen, "dokumen", false);

        if (menuBadge) {
            menuBadge.textContent = "Detail Potensi";
            menuBadge.className = "px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 text-[10px] font-extrabold";
        }

        // Banner Update
        if (heroBadgeTag) {
            heroBadgeTag.textContent = "RINCIAN POTENSI";
            heroBadgeTag.className = "inline-flex items-center whitespace-nowrap px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[10px] sm:text-xs leading-none flex-shrink-0 shadow-xs";
        }
        if (heroBadgeSub) heroBadgeSub.textContent = "Informasi Rinci Komoditas & Wilayah";
        if (heroTitle) {
            heroTitle.innerHTML = `Rincian Potensi & Keunggulan Wilayah <br class="hidden sm:block"><span class="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-200 to-yellow-300">${currentVillage}</span>`;
        }
        if (heroDesc) {
            heroDesc.textContent = "Halaman rincian informasi komprehensif potensi unggulan wilayah, pengelola, nilai ekonomi, serta daya tarik utama desa.";
        }

        window.location.hash = "potensi-detail";
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } else if (viewName === "dokumen") {
        if (viewPotensiDetail) viewPotensiDetail.classList.add("hidden");
        viewHome.classList.add("hidden");
        viewPotensi.classList.add("hidden");
        viewDokumen.classList.remove("hidden");
        triggerViewAnimation(viewDokumen);
        triggerHeroAnimation();

        // Desktop Nav Styling
        if (tabHome) tabHome.className = "px-3.5 py-1.5 rounded-xl text-slate-600 hover:text-bps-blue hover:bg-slate-100 transition-all flex items-center gap-1.5";
        if (tabPotensi) tabPotensi.className = "px-3.5 py-1.5 rounded-xl text-slate-600 hover:text-bps-blue hover:bg-slate-100 transition-all flex items-center gap-1.5";
        if (tabDokumen) tabDokumen.className = "px-3.5 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 font-bold border border-indigo-200 transition-all flex items-center gap-1.5 shadow-xs";

        // Mobile Drawer Button Styling
        setMobileButtonState(mobileBtnHome, "home", false);
        setMobileButtonState(mobileBtnPotensi, "potensi", false);
        setMobileButtonState(mobileBtnDokumen, "dokumen", true);

        if (menuBadge) {
            menuBadge.textContent = "Mode Dokumen";
            menuBadge.className = "px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-[10px] font-extrabold";
        }

        // Banner Update
        if (heroBadgeTag) {
            heroBadgeTag.textContent = "REPOSITORI DOKUMEN";
            heroBadgeTag.className = "inline-flex items-center whitespace-nowrap px-3 py-1 rounded-full bg-indigo-500 text-white font-extrabold text-[10px] sm:text-xs leading-none flex-shrink-0 shadow-xs";
        }
        if (heroBadgeSub) heroBadgeSub.textContent = "Publikasi BPS, Monografi & Perdes";
        if (heroTitle) {
            heroTitle.innerHTML = `Pusat Dokumen & Publikasi <br class="hidden sm:block"><span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-indigo-200 to-blue-300">${currentVillage}</span>`;
        }
        if (heroDesc) {
            heroDesc.textContent = "Repositori digital resmi untuk mengunduh publikasi Kecamatan Dalam Angka (KCDA), Monografi Desa, Peraturan Desa (Perdes), dan laporan statistik.";
        }

        window.location.hash = "dokumen";
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } else if (viewName === "potensi") {
        if (viewPotensiDetail) viewPotensiDetail.classList.add("hidden");
        viewHome.classList.add("hidden");
        viewDokumen.classList.add("hidden");
        viewPotensi.classList.remove("hidden");
        triggerViewAnimation(viewPotensi);
        triggerHeroAnimation();

        // Desktop Nav Styling
        if (tabHome) tabHome.className = "px-3.5 py-1.5 rounded-xl text-slate-600 hover:text-bps-blue hover:bg-slate-100 transition-all flex items-center gap-1.5";
        if (tabPotensi) tabPotensi.className = "px-3.5 py-1.5 rounded-xl text-amber-700 bg-amber-50 font-bold border border-amber-200 transition-all flex items-center gap-1.5 shadow-xs";
        if (tabDokumen) tabDokumen.className = "px-3.5 py-1.5 rounded-xl text-slate-600 hover:text-bps-blue hover:bg-slate-100 transition-all flex items-center gap-1.5";

        // Mobile Drawer Button Styling
        setMobileButtonState(mobileBtnHome, "home", false);
        setMobileButtonState(mobileBtnPotensi, "potensi", true);
        setMobileButtonState(mobileBtnDokumen, "dokumen", false);

        if (menuBadge) {
            menuBadge.textContent = "Galeri Potensi";
            menuBadge.className = "px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 text-[10px] font-extrabold";
        }

        // Banner Update
        if (heroBadgeTag) {
            heroBadgeTag.textContent = "DIREKTORI POTENSI";
            heroBadgeTag.className = "inline-flex items-center whitespace-nowrap px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[10px] sm:text-xs leading-none flex-shrink-0 shadow-xs";
        }
        if (heroBadgeSub) heroBadgeSub.textContent = "Komoditas & Wisata Unggulan";
        if (heroTitle) {
            heroTitle.innerHTML = `Potensi & Keunggulan Wilayah <br class="hidden sm:block"><span class="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-200 to-yellow-300">${currentVillage}</span>`;
        }
        if (heroDesc) {
            heroDesc.textContent = "Katalog rinci keunggulan wilayah Desa Sadawarna: destinasi wisata air Bendungan Sadawarna, sentra pertanian nanas simadu super, produk UMKM kerajinan bambu, dan potensi perikanan.";
        }

        window.location.hash = "potensi";
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } else {
        if (viewPotensiDetail) viewPotensiDetail.classList.add("hidden");
        viewDokumen.classList.add("hidden");
        viewPotensi.classList.add("hidden");
        viewHome.classList.remove("hidden");
        triggerViewAnimation(viewHome);
        triggerHeroAnimation();

        // Desktop Nav Styling
        if (tabHome) tabHome.className = "px-3.5 py-1.5 rounded-xl text-bps-blue bg-blue-50 font-bold border border-blue-200 transition-all flex items-center gap-1.5 shadow-xs";
        if (tabPotensi) tabPotensi.className = "px-3.5 py-1.5 rounded-xl text-slate-600 hover:text-bps-blue hover:bg-slate-100 transition-all flex items-center gap-1.5";
        if (tabDokumen) tabDokumen.className = "px-3.5 py-1.5 rounded-xl text-slate-600 hover:text-bps-blue hover:bg-slate-100 transition-all flex items-center gap-1.5";

        // Mobile Drawer Button Styling
        setMobileButtonState(mobileBtnHome, "home", true);
        setMobileButtonState(mobileBtnPotensi, "potensi", false);
        setMobileButtonState(mobileBtnDokumen, "dokumen", false);

        if (menuBadge) {
            menuBadge.textContent = "Beranda Utama";
            menuBadge.className = "px-2.5 py-0.5 rounded-full bg-blue-50 text-bps-blue border border-blue-200/80 text-[10px] font-extrabold";
        }

        // Banner Update
        if (heroBadgeTag) {
            heroBadgeTag.textContent = "MICRO-PORTAL";
            heroBadgeTag.className = "inline-flex items-center whitespace-nowrap px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-extrabold text-[10px] sm:text-xs leading-none flex-shrink-0 shadow-xs";
        }
        if (heroBadgeSub) heroBadgeSub.textContent = "Desa Cinta Statistik BPS Subang";
        if (heroTitle) {
            heroTitle.innerHTML = `Publikasi Data & Potensi <br class="hidden sm:block"><span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-teal-200 to-emerald-300">${currentVillage}</span>`;
        }
        if (heroDesc) {
            heroDesc.textContent = cachedIdentitas.deskripsi || "Kecamatan Subang merupakan pusat pemerintahan dan ibukota Kabupaten Subang yang terletak pada ketinggian 88 mdpl dengan jarak 0 km dari pusat pemerintahan kabupaten. Memiliki luas wilayah 60.22 km² atau 2.78% dari total luas Kabupaten Subang. Secara administratif terdiri dari 8 kelurahan, 163 RW, dan 599 RT dengan total penduduk sebanyak 147.424 jiwa pada tahun 2025.";
        }

        window.location.hash = "home";
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

/**
 * Helper Animasi Smooth Fade In saat Perpindahan View
 */
function triggerViewAnimation(targetEl) {
    if (!targetEl) return;
    targetEl.classList.remove("animate-fade-in");
    void targetEl.offsetWidth;
    targetEl.classList.add("animate-fade-in");
}

function triggerHeroAnimation() {
    const heroContent = document.querySelector("#hero-banner-section .max-w-3xl");
    if (!heroContent) return;
    heroContent.classList.remove("animate-hero-fade");
    void heroContent.offsetWidth;
    heroContent.classList.add("animate-hero-fade");
}

/**
 * Helper Toggle Styling Mobile Hamburger Drawer Button
 */
function setMobileButtonState(btn, type, isActive) {
    if (!btn) return;

    const icon = document.getElementById(`mobile-btn-${type}-icon`);
    const title = document.getElementById(`mobile-btn-${type}-title`);
    const sub = document.getElementById(`mobile-btn-${type}-sub`);

    if (isActive) {
        if (type === "home") {
            btn.className = "w-full flex items-center justify-between p-2.5 rounded-xl bg-blue-50/90 text-bps-blue border border-blue-200/80 font-bold transition-all text-left shadow-2xs";
            if (icon) icon.className = "w-9 h-9 rounded-xl bg-bps-blue text-white flex items-center justify-center flex-shrink-0 shadow-2xs";
            if (title) title.className = "text-xs font-extrabold text-bps-navy";
            if (sub) sub.className = "text-[10px] text-blue-600 font-medium";
        } else if (type === "potensi") {
            btn.className = "w-full flex items-center justify-between p-2.5 rounded-xl bg-amber-50/90 text-amber-800 border border-amber-200/80 font-bold transition-all text-left shadow-2xs";
            if (icon) icon.className = "w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-2xs";
            if (title) title.className = "text-xs font-extrabold text-amber-900";
            if (sub) sub.className = "text-[10px] text-amber-700 font-medium";
        } else if (type === "dokumen") {
            btn.className = "w-full flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/90 text-indigo-700 border border-indigo-200/80 font-bold transition-all text-left shadow-2xs";
            if (icon) icon.className = "w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-2xs";
            if (title) title.className = "text-xs font-extrabold text-indigo-900";
            if (sub) sub.className = "text-[10px] text-indigo-600 font-medium";
        }
    } else {
        btn.className = "w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60 font-medium transition-all text-left";
        if (icon) icon.className = "w-9 h-9 rounded-xl bg-slate-200/70 text-slate-600 flex items-center justify-center flex-shrink-0";
        if (title) title.className = "text-xs font-bold text-slate-800";
        if (sub) sub.className = "text-[10px] text-slate-500 font-normal";
    }
}

/**
 * Toggle Mobile Hamburger Menu dengan Animasi
 */
function toggleMobileMenu() {
    const menu = document.getElementById("mobile-menu");
    const icon = document.getElementById("menu-icon");
    if (!menu) return;

    if (menu.classList.contains("hidden")) {
        menu.classList.remove("hidden");
        if (icon) {
            icon.classList.remove("fa-bars");
            icon.classList.add("fa-xmark");
        }
    } else {
        menu.classList.add("hidden");
        if (icon) {
            icon.classList.remove("fa-xmark");
            icon.classList.add("fa-bars");
        }
    }
}

/**
 * Memuat Data secara Asynchronous dengan Robust Automatic Fallback
 */
async function loadData() {
    let data = {};
    let isLoaded = false;

    // 1. Coba ambil dari Remote API jika CONFIG.DATA_URL diset ke URL eksternal
    if (CONFIG.DATA_URL && CONFIG.DATA_URL !== "./data.json") {
        try {
            console.log("⚡ Mengambil data dinamis dari Remote API / Google Sheets...");
            const response = await fetch(CONFIG.DATA_URL);
            if (response.ok) {
                const rawData = await response.json();
                if (rawData && (rawData.identitas || rawData.statistikMakro || rawData.potensiDesa)) {
                    const identitasObj = Array.isArray(rawData.identitas) ? rawData.identitas[0] : (rawData.identitas || {});
                    const makroObj = Array.isArray(rawData.statistikMakro) ? rawData.statistikMakro[0] : (rawData.statistikMakro || {});
                    const potensiArr = rawData.potensiDesa || [];
                    const jobsArr = rawData.mataPencaharian || [];
                    const docsArr = rawData.dokumenPublikasi || [];

                    data.identitas = identitasObj;
                    data.statistikMakro = makroObj;
                    data.statusPenduduk = Array.isArray(rawData.statusPenduduk) ? rawData.statusPenduduk[0] : (rawData.statusPenduduk || {});
                    data.statistikSosial = Array.isArray(rawData.statistikSosial) ? rawData.statistikSosial[0] : (rawData.statistikSosial || {});
                    data.statistikEkonomi = Array.isArray(rawData.statistikEkonomi) ? rawData.statistikEkonomi[0] : (rawData.statistikEkonomi || {});
                    data.pertanianPeternakan = Array.isArray(rawData.pertanianPeternakan) ? rawData.pertanianPeternakan[0] : (rawData.pertanianPeternakan || {});

                    if (data.statistikMakro) {
                        data.statistikMakro.totalPenduduk = parseAngkaIndo(data.statistikMakro.totalPenduduk);
                        data.statistikMakro.luasWilayah = parseAngkaIndo(data.statistikMakro.luasWilayah);
                        data.statistikMakro.kepadatanPenduduk = parseAngkaIndo(data.statistikMakro.kepadatanPenduduk);
                        data.statistikMakro.jumlahRt = parseAngkaIndo(data.statistikMakro.jumlahRt);
                        data.statistikMakro.jumlahRw = parseAngkaIndo(data.statistikMakro.jumlahRw);
                        data.statistikMakro.jumlahKk = parseAngkaIndo(data.statistikMakro.jumlahKk);
                    }

                    data.potensiDesa = Array.isArray(potensiArr) ? potensiArr.map((item, index) => ({
                        id: parseAngkaIndo(item.id) || (index + 1),
                        judulPotensi: item.judulPotensi || "-",
                        kategori: item.kategori || "Potensi",
                        deskripsi: item.deskripsi || "-",
                        deskripsiLengkap: item.deskripsiLengkap || item.deskripsi || "-",
                        keunggulanUtama: item.keunggulanUtama || "-",
                        lokasi: item.lokasi || "Desa Sadawarna, Subang",
                        nilaiEkonomi: item.nilaiEkonomi || "Potensi Lokal",
                        pengelola: item.pengelola || "Warga & Pemdes",
                        kontakPengelola: item.kontakPengelola || "-",
                        urlFoto: item.urlFoto || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"
                    })) : [];

                    data.mataPencaharian = Array.isArray(jobsArr) ? jobsArr.map(item => ({
                        kategori: item.kategori,
                        jumlah: parseAngkaIndo(item.jumlah) || 0,
                        persentase: parseAngkaIndo(item.persentase)
                    })) : [];

                    data.dokumenPublikasi = Array.isArray(docsArr) ? docsArr.map(item => ({
                        id: parseAngkaIndo(item.id) || 0,
                        judul: item.judul || "-",
                        kategori: item.kategori || "-",
                        tahun: parseAngkaIndo(item.tahun) || 0,
                        ukuran: item.ukuran || "-",
                        deskripsi: item.deskripsi || "-",
                        urlDrive: item.urlDrive || "#"
                    })) : [];

                    isLoaded = true;
                }
            }
        } catch (remoteErr) {
            console.warn("⚠️ Gagal mengambil dari Remote API, mengalihkan ke ./data.json lokal:", remoteErr);
        }
    }

    // 2. Fallback otomatis ke data.json lokal jika data belum terisi
    if (!isLoaded) {
        try {
            console.log("📂 Memuat data dari file JSON lokal (./data.json)...");
            const response = await fetch("./data.json");
            if (!response.ok) {
                throw new Error(`Gagal memuat file JSON lokal. Status HTTP: ${response.status}`);
            }
            data = await response.json();
            isLoaded = true;
        } catch (localErr) {
            console.error("❌ Terjadi Kesalahan saat Memuat Data Lokal:", localErr);
            tampilkanErrorUI(localErr.message);
            return;
        }
    }

    console.log("✅ Data Berhasil Diproses:", data);

    if (data.identitas) renderIdentitas(data.identitas);
    if (data.statistikMakro) renderStatCards(data.statistikMakro);

    // Render 4 Modul Statistik Tematik
    renderStatusPenduduk(data.statusPenduduk, data.statistikMakro);
    renderStatistikSosial(data.statistikSosial);
    renderStatistikEkonomi(data.statistikEkonomi);
    renderPertanianPeternakan(data.pertanianPeternakan);

    if (data.potensiDesa && Array.isArray(data.potensiDesa)) {
        cachedPotensi = data.potensiDesa;
        currentFilteredPotensiHome = cachedPotensi;
        currentFilteredPotensiView = cachedPotensi;

        renderPotensiFilterBarHome(cachedPotensi);
        renderPotensiFilterBarView(cachedPotensi);

        renderPotensiDesaHome(currentFilteredPotensiHome, 1);
        renderPotensiDesaView(currentFilteredPotensiView, 1);

        if (window.location.hash === "#potensi-detail") {
            bukaDetailPotensi(cachedPotensi[0]?.id || 1);
        }
    }

    if (data.mataPencaharian) renderJobChart(data.mataPencaharian);

    if (data.dokumenPublikasi && Array.isArray(data.dokumenPublikasi)) {
        cachedDokumen = data.dokumenPublikasi;
        currentFilteredDocs = cachedDokumen;
        renderDokumenPublikasi(currentFilteredDocs, 1);
    }
}

/**
 * 1. Render Identitas Desa
 */
function renderIdentitas(identitas) {
    cachedIdentitas = identitas || {};
    const namaDesa = identitas.namaDesa || CONFIG.NAMA_DESA;
    const kecamatan = identitas.kecamatan || CONFIG.KECAMATAN;
    const kabupaten = identitas.kabupaten || CONFIG.KABUPATEN;

    const alamat = identitas.alamatKantor || identitas.alamatKanttor || "-";
    const email = identitas.email || "-";

    const tagVillage = document.getElementById("header-village-tag");
    const heroVillage = document.getElementById("hero-village-name");
    const heroDistrict = document.getElementById("hero-district");
    const heroCode = document.getElementById("hero-code");
    const heroDesc = document.getElementById("hero-description");

    if (tagVillage) tagVillage.textContent = `Desa ${namaDesa}`;
    if (heroVillage) heroVillage.textContent = `Desa ${namaDesa}`;
    if (heroDistrict) heroDistrict.textContent = `${kecamatan}, ${kabupaten}`;
    if (heroCode) heroCode.textContent = identitas.kodeDesa || "-";
    if (heroDesc && identitas.deskripsi && identitas.deskripsi.trim() !== "") {
        heroDesc.textContent = identitas.deskripsi;
    }

    const footerDesc = document.getElementById("footer-village-desc");
    const footerAddress = document.getElementById("footer-address");
    const footerEmail = document.getElementById("footer-email");

    if (footerDesc) footerDesc.textContent = `Portal data statistik terpadu Desa ${namaDesa}, ${kecamatan}. Program Desa Cinta Statistik BPS Kabupaten Subang.`;
    if (footerAddress) footerAddress.textContent = alamat;
    if (footerEmail) footerEmail.textContent = email;
}

/**
 * 2. Render Stat Cards Utama
 */
function renderStatCards(makro) {
    const elPenduduk = document.getElementById("stat-penduduk");
    const elLuas = document.getElementById("stat-luas");
    const elKepadatan = document.getElementById("stat-kepadatan");
    const elRtRw = document.getElementById("stat-rtrw");

    if (elPenduduk) elPenduduk.textContent = formatRibuan(makro.totalPenduduk);
    if (elLuas) elLuas.textContent = formatDesimal(makro.luasWilayah);
    if (elKepadatan) elKepadatan.textContent = formatRibuan(makro.kepadatanPenduduk);
    if (elRtRw) {
        const rt = makro.jumlahRt !== null ? makro.jumlahRt : "-";
        const rw = makro.jumlahRw !== null ? makro.jumlahRw : "-";
        elRtRw.textContent = `${rt}/${rw}`;
    }
}

/**
 * 3A. Filter & Render Potensi Home
 */
function renderPotensiFilterBarHome(listPotensi) {
    const filterContainer = document.getElementById("potensi-filter-bar");
    if (!filterContainer) return;

    const categories = ["Semua", ...new Set(listPotensi.map(item => item.kategori).filter(Boolean))];

    filterContainer.innerHTML = categories.map(cat => {
        const isActive = cat === activePotensiCategoryHome;
        const btnClass = isActive
            ? "bg-bps-blue text-white shadow-xs border-bps-blue font-bold"
            : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200/80 font-medium";

        return `
            <button onclick="filterPotensiHome('${cat}')" 
                    class="px-3 py-1 rounded-xl text-xs border transition-all duration-200 flex-shrink-0 ${btnClass}">
                ${cat}
            </button>
        `;
    }).join('');
}

window.filterPotensiHome = function (category) {
    activePotensiCategoryHome = category;
    renderPotensiFilterBarHome(cachedPotensi);
    currentPotensiPageHome = 1;

    if (category === "Semua") {
        currentFilteredPotensiHome = cachedPotensi;
    } else {
        currentFilteredPotensiHome = cachedPotensi.filter(item => item.kategori === category);
    }
    renderPotensiDesaHome(currentFilteredPotensiHome, 1);
};

function renderPotensiDesaHome(listPotensi, page = 1) {
    const container = document.getElementById("potensi-grid");
    if (!container) return;

    currentPotensiPageHome = page;

    if (!listPotensi || listPotensi.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-10 text-center text-slate-400 w-full">
                <i class="fa-solid fa-gem text-2xl mb-1 text-slate-300"></i>
                <p class="text-xs">Belum ada potensi desa dalam kategori ini.</p>
            </div>
        `;
        renderPotensiPaginationHome(0, 1);
        return;
    }

    const placeholderImg = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80";

    const itemsPerPage = getPotensiItemsPerPage();
    const startIndex = (page - 1) * itemsPerPage;
    const pageItems = listPotensi.slice(startIndex, startIndex + itemsPerPage);

    container.innerHTML = pageItems.map((item, index) => {
        const fotoUrl = item.urlFoto && item.urlFoto.trim() !== "" ? item.urlFoto : placeholderImg;
        const isFeatured = (page === 1 && activePotensiCategoryHome === "Semua" && index === 0);

        if (isFeatured) {
            return `
                <div onclick="openPotensiModal(${item.id})" 
                     class="group cursor-pointer relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-card-hover border border-slate-200/90 min-h-[260px] sm:h-96 md:h-[380px] flex flex-col justify-end p-5 sm:p-8 bg-slate-950 text-white lg:col-span-2 transition-all duration-300 w-full">
                    <img src="${fotoUrl}" 
                         alt="${item.judulPotensi}" 
                         class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-75"
                         onerror="this.src='${placeholderImg}'">
                    
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>

                    <div class="relative z-10 space-y-2.5 sm:space-y-3">
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="inline-flex items-center whitespace-nowrap px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-extrabold bg-amber-400 text-slate-950 shadow-xs leading-none flex-shrink-0 border border-amber-300">
                                ⭐ POTENSI UNGGULAN
                            </span>
                            <span class="inline-flex items-center whitespace-nowrap px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/25 leading-none flex-shrink-0">
                                ${item.kategori}
                            </span>
                        </div>
                        <h4 class="text-base sm:text-2xl font-extrabold text-white leading-tight group-hover:text-amber-300 transition-colors">
                            ${item.judulPotensi}
                        </h4>
                        <p class="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
                            ${item.deskripsi || '-'}
                        </p>
                        <div class="pt-1 flex items-center gap-1.5 text-xs font-bold text-amber-300">
                            <span>Lihat Rincian Lengkap</span>
                            <i class="fa-solid fa-circle-arrow-right text-xs"></i>
                        </div>
                    </div>
                </div>
            `;
        } else {
            return `
                <div onclick="openPotensiModal(${item.id})" 
                     class="group cursor-pointer relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xs hover:shadow-card-hover border border-slate-200/90 min-h-[220px] sm:h-80 flex flex-col justify-end p-4 sm:p-5 bg-slate-950 text-white transition-all duration-300 w-full">
                    <img src="${fotoUrl}" 
                         alt="${item.judulPotensi}" 
                         class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80"
                         onerror="this.src='${placeholderImg}'">
                    
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent"></div>

                    <span class="absolute top-3 left-3 inline-flex items-center whitespace-nowrap px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-extrabold bg-white/90 backdrop-blur-md text-slate-900 shadow-xs leading-none border border-white/50">
                        ${item.kategori}
                    </span>

                    <div class="relative z-10 space-y-1 sm:space-y-2">
                        <h4 class="text-xs sm:text-base font-extrabold text-white group-hover:text-blue-300 transition-colors line-clamp-1">
                            ${item.judulPotensi}
                        </h4>
                        <p class="text-[11px] sm:text-xs text-slate-300 line-clamp-2 leading-relaxed">
                            ${item.deskripsi || '-'}
                        </p>
                        <div class="pt-1.5 flex items-center justify-between text-xs font-semibold text-blue-300 border-t border-white/10">
                            <span>Baca Detail</span>
                            <i class="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition-transform"></i>
                        </div>
                    </div>
                </div>
            `;
        }
    }).join('');

    renderPotensiPaginationHome(listPotensi.length, page);
}

function renderPotensiPaginationHome(totalItems, currentPage) {
    const container = document.getElementById("potensi-pagination-container");
    if (!container) return;

    if (totalItems === 0) {
        container.innerHTML = "";
        return;
    }

    const itemsPerPage = getPotensiItemsPerPage();
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = ((currentPage - 1) * itemsPerPage) + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    let pageButtonsHTML = '';
    for (let p = 1; p <= totalPages; p++) {
        const isCurrent = p === currentPage;
        const btnClass = isCurrent
            ? "bg-bps-blue text-white font-bold shadow-xs border-bps-blue"
            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80";
        pageButtonsHTML += `
            <button onclick="goToPotensiPageHome(${p})" class="w-8 h-8 rounded-xl text-xs border transition-all ${btnClass}">
                ${p}
            </button>
        `;
    }

    const prevDisabled = currentPage === 1;
    const nextDisabled = currentPage === totalPages;

    container.innerHTML = `
        <div class="text-slate-500 font-medium text-[11px]">
            Menampilkan <strong class="text-slate-800">${startItem}-${endItem}</strong> dari <strong class="text-slate-800">${totalItems}</strong> potensi
        </div>
        <div class="flex items-center gap-1.5">
            <button onclick="goToPotensiPageHome(${currentPage - 1})" 
                    ${prevDisabled ? 'disabled' : ''} 
                    class="px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${prevDisabled ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'}">
                <i class="fa-solid fa-chevron-left text-[10px] mr-1"></i> Prev
            </button>
            <div class="flex items-center gap-1">
                ${pageButtonsHTML}
            </div>
            <button onclick="goToPotensiPageHome(${currentPage + 1})" 
                    ${nextDisabled ? 'disabled' : ''} 
                    class="px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${nextDisabled ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'}">
                Next <i class="fa-solid fa-chevron-right text-[10px] ml-1"></i>
            </button>
        </div>
    `;
}

window.goToPotensiPageHome = function (page) {
    const itemsPerPage = getPotensiItemsPerPage();
    const totalPages = Math.ceil(currentFilteredPotensiHome.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    currentPotensiPageHome = page;
    renderPotensiDesaHome(currentFilteredPotensiHome, page);
    document.getElementById("potensi-section")?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/**
 * 3B. Filter & Render Potensi View (Halaman Khusus Potensi)
 */
function renderPotensiFilterBarView(listPotensi) {
    const filterContainer = document.getElementById("potensi-view-filter-bar");
    if (!filterContainer) return;

    const categories = ["Semua", ...new Set(listPotensi.map(item => item.kategori).filter(Boolean))];

    filterContainer.innerHTML = categories.map(cat => {
        const isActive = cat === activePotensiCategoryView;
        const btnClass = isActive
            ? "bg-amber-500 text-slate-950 font-extrabold shadow-xs border-amber-500"
            : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200/80 font-medium";

        return `
            <button onclick="filterPotensiView('${cat}')" 
                    class="px-3 py-1.5 rounded-xl text-xs border transition-all duration-200 flex-shrink-0 ${btnClass}">
                ${cat}
            </button>
        `;
    }).join('');
}

window.filterPotensiView = function (category) {
    activePotensiCategoryView = category;
    renderPotensiFilterBarView(cachedPotensi);
    currentPotensiPageView = 1;

    if (category === "Semua") {
        currentFilteredPotensiView = cachedPotensi;
    } else {
        currentFilteredPotensiView = cachedPotensi.filter(item => item.kategori === category);
    }
    renderPotensiDesaView(currentFilteredPotensiView, 1);
};

function renderPotensiDesaView(listPotensi, page = 1) {
    const container = document.getElementById("potensi-view-grid");
    if (!container) return;

    currentPotensiPageView = page;

    if (!listPotensi || listPotensi.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-12 text-center text-slate-400 w-full">
                <i class="fa-solid fa-gem text-3xl mb-2 text-slate-300"></i>
                <p class="text-xs font-semibold">Tidak ada potensi wilayah yang cocok dengan kriteria.</p>
            </div>
        `;
        renderPotensiPaginationView(0, 1);
        return;
    }

    const placeholderImg = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80";

    const itemsPerPage = getPotensiItemsPerPage();
    const startIndex = (page - 1) * itemsPerPage;
    const pageItems = listPotensi.slice(startIndex, startIndex + itemsPerPage);

    container.innerHTML = pageItems.map((item) => {
        const fotoUrl = item.urlFoto && item.urlFoto.trim() !== "" ? item.urlFoto : placeholderImg;

        return `
            <div onclick="openPotensiModal(${item.id})" 
                 class="group cursor-pointer bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-card-hover overflow-hidden flex flex-col justify-between transition-all duration-300 w-full box-border">
                <div class="relative h-48 sm:h-52 overflow-hidden bg-slate-950">
                    <img src="${fotoUrl}" 
                         alt="${item.judulPotensi}" 
                         class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                         onerror="this.src='${placeholderImg}'">
                    
                    <span class="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-white/90 backdrop-blur-md text-slate-900 shadow-xs border border-white/60">
                        ${item.kategori}
                    </span>

                    <span class="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 shadow-xs">
                        <i class="fa-solid fa-coins text-[9px] mr-1"></i>${item.nilaiEkonomi || 'Unggulan'}
                    </span>
                </div>

                <div class="p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div class="space-y-1.5">
                        <h4 class="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-bps-blue transition-colors leading-snug">
                            ${item.judulPotensi}
                        </h4>
                        <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            ${item.deskripsi || '-'}
                        </p>
                    </div>

                    <div class="pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
                        <div class="flex items-center gap-1.5 truncate">
                            <i class="fa-solid fa-location-dot text-rose-500 text-xs"></i>
                            <span class="truncate font-medium">${item.lokasi || 'Desa Sadawarna'}</span>
                        </div>
                        <div class="flex items-center gap-1.5 truncate">
                            <i class="fa-solid fa-user-gear text-indigo-500 text-xs"></i>
                            <span class="truncate font-medium">${item.pengelola || 'Pemdes Sadawarna'}</span>
                        </div>
                        <div class="pt-1 flex items-center justify-between text-xs font-bold text-bps-blue">
                            <span>Lihat Rincian Lengkap</span>
                            <i class="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition-transform"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    renderPotensiPaginationView(listPotensi.length, page);
}

function renderPotensiPaginationView(totalItems, currentPage) {
    const container = document.getElementById("potensi-view-pagination-container");
    if (!container) return;

    if (totalItems === 0) {
        container.innerHTML = "";
        return;
    }

    const itemsPerPage = getPotensiItemsPerPage();
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = ((currentPage - 1) * itemsPerPage) + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    let pageButtonsHTML = '';
    for (let p = 1; p <= totalPages; p++) {
        const isCurrent = p === currentPage;
        const btnClass = isCurrent
            ? "bg-amber-500 text-slate-950 font-extrabold shadow-xs border-amber-500"
            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80";
        pageButtonsHTML += `
            <button onclick="goToPotensiPageView(${p})" class="w-8 h-8 rounded-xl text-xs border transition-all ${btnClass}">
                ${p}
            </button>
        `;
    }

    const prevDisabled = currentPage === 1;
    const nextDisabled = currentPage === totalPages;

    container.innerHTML = `
        <div class="text-slate-500 font-medium text-[11px]">
            Menampilkan <strong class="text-slate-800">${startItem}-${endItem}</strong> dari <strong class="text-slate-800">${totalItems}</strong> potensi wilayah
        </div>
        <div class="flex items-center gap-1.5">
            <button onclick="goToPotensiPageView(${currentPage - 1})" 
                    ${prevDisabled ? 'disabled' : ''} 
                    class="px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${prevDisabled ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'}">
                <i class="fa-solid fa-chevron-left text-[10px] mr-1"></i> Prev
            </button>
            <div class="flex items-center gap-1">
                ${pageButtonsHTML}
            </div>
            <button onclick="goToPotensiPageView(${currentPage + 1})" 
                    ${nextDisabled ? 'disabled' : ''} 
                    class="px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${nextDisabled ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'}">
                Next <i class="fa-solid fa-chevron-right text-[10px] ml-1"></i>
            </button>
        </div>
    `;
}

window.goToPotensiPageView = function (page) {
    const itemsPerPage = getPotensiItemsPerPage();
    const totalPages = Math.ceil(currentFilteredPotensiView.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    currentPotensiPageView = page;
    renderPotensiDesaView(currentFilteredPotensiView, page);
    document.getElementById("view-potensi")?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/**
 * 3C. Halaman Detail Khusus Potensi Wilayah (Full Page Detail View Super Rinci)
 */
function bukaDetailPotensi(id) {
    const item = cachedPotensi.find(p => p.id === id) || cachedPotensi[0];
    if (!item) return;

    const placeholderImg = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80";
    const fotoUrl = item.urlFoto && item.urlFoto.trim() !== "" ? item.urlFoto : placeholderImg;

    const container = document.getElementById("view-potensi-detail");
    if (!container) return;

    // Generate rich narratives & fallbacks
    const deskripsiUtama = item.deskripsiLengkap || item.deskripsi || `Potensi unggulan ${item.judulPotensi} merupakan salah satu aset strategis komoditas desa yang dikembangkan secara berkelanjutan oleh masyarakat Desa Sadawarna bersama BPS Kabupaten Subang.`;
    const keunggulan = item.keunggulanUtama || "Produk & komoditas bermutu tinggi, ramah lingkungan, dikelola secara terpadu oleh gabungan kelompok warga desa.";
    const pengelola = item.pengelola || "Pemdes Sadawarna & Kelompok Warga";
    const nilaiEkonomi = item.nilaiEkonomi || "Potensi Unggulan Lokal";
    const lokasi = item.lokasi || "Desa Sadawarna, Kec. Cibogo, Kabupaten Subang";
    const kontak = item.kontakPengelola || "+62 812-3456-7890 (Sekretariat Desa Sadawarna)";

    // Extra curated gallery photos
    const extraPhotos = [
        fotoUrl,
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80"
    ];

    container.innerHTML = `
        <!-- Control Bar & Breadcrumbs -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs w-full box-border">
            <div class="flex items-center gap-2 text-xs font-semibold text-slate-500 overflow-x-auto no-scrollbar">
                <button onclick="switchView('home')" class="hover:text-bps-blue flex items-center gap-1 flex-shrink-0">
                    <i class="fa-solid fa-house text-[11px]"></i> Beranda
                </button>
                <span>/</span>
                <button onclick="switchView('potensi')" class="hover:text-bps-blue flex-shrink-0">Galeri Potensi Wilayah</button>
                <span>/</span>
                <span class="text-slate-900 font-bold truncate max-w-[200px] sm:max-w-[350px]">${item.judulPotensi}</span>
            </div>

            <div class="flex items-center gap-2">
                <button onclick="switchView('potensi')" class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all">
                    <i class="fa-solid fa-arrow-left"></i>
                    <span>Kembali ke Galeri</span>
                </button>
                <button onclick="copyCurrentUrl()" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-bps-blue bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all">
                    <i class="fa-solid fa-share-nodes"></i>
                    <span class="hidden sm:inline">Bagikan</span>
                </button>
            </div>
        </div>

        <!-- 4 Key Indicator Cards (Highlight Bar) -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full box-border">
            <div class="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 text-base font-bold">
                    <i class="fa-solid fa-coins"></i>
                </div>
                <div class="min-w-0">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nilai Ekonomi / Panen</span>
                    <span class="font-extrabold text-slate-900 text-xs sm:text-sm truncate block mt-0.5">${nilaiEkonomi}</span>
                </div>
            </div>

            <div class="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-blue-100 text-bps-blue flex items-center justify-center flex-shrink-0 text-base font-bold">
                    <i class="fa-solid fa-users-gear"></i>
                </div>
                <div class="min-w-0">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mitra Pengelola</span>
                    <span class="font-bold text-slate-900 text-xs sm:text-sm truncate block mt-0.5">${pengelola}</span>
                </div>
            </div>

            <div class="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 text-base font-bold">
                    <i class="fa-solid fa-location-dot"></i>
                </div>
                <div class="min-w-0">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lokasi Presisi</span>
                    <span class="font-bold text-slate-900 text-xs sm:text-sm truncate block mt-0.5">${lokasi}</span>
                </div>
            </div>

            <div class="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0 text-base font-bold">
                    <i class="fa-solid fa-shield-halved"></i>
                </div>
                <div class="min-w-0">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status Pembinaan</span>
                    <span class="font-bold text-slate-900 text-xs sm:text-sm truncate block mt-0.5">Desa Cantik BPS 2026</span>
                </div>
            </div>
        </div>

        <!-- Main Banner & Content Container -->
        <div class="bg-white rounded-3xl p-4 sm:p-8 shadow-sm border border-slate-200/90 space-y-6 sm:space-y-8 w-full box-border">
            
            <!-- Large Cover Photo Header (Fixed height h-64 sm:h-80 lg:h-96) -->
            <div class="relative rounded-2xl overflow-hidden h-64 sm:h-80 lg:h-96 w-full bg-slate-950">
                <img src="${fotoUrl}" alt="${item.judulPotensi}" class="absolute inset-0 w-full h-full object-cover opacity-85">
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent"></div>
                
                <div class="absolute bottom-0 inset-x-0 p-4 sm:p-8 text-white space-y-2.5">
                    <div class="flex flex-wrap items-center gap-2">
                        <span class="px-3 py-1 rounded-lg text-xs font-extrabold bg-amber-400 text-slate-950 shadow-xs uppercase tracking-wider">
                            ${item.kategori}
                        </span>
                        <span class="px-3 py-1 rounded-lg text-xs font-semibold bg-white/20 backdrop-blur-md text-white border border-white/30">
                            ⭐ Potensi Unggulan Wilayah
                        </span>
                        <span class="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-500/80 backdrop-blur-md text-white border border-emerald-300/40">
                            📍 Terverifikasi BPS Subang
                        </span>
                    </div>
                    <h1 class="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                        ${item.judulPotensi}
                    </h1>
                    <p class="text-xs sm:text-sm text-slate-200 flex items-center gap-2 font-medium">
                        <i class="fa-solid fa-location-dot text-amber-400"></i>
                        <span>${lokasi}</span>
                        <span class="text-slate-400">|</span>
                        <span class="text-slate-300">Kode Wilayah: 3213110001</span>
                    </p>
                </div>
            </div>

            <!-- Golden Ratio Content Layout (61.8% Main Narrative : 38.2% Sidebar) -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
                
                <!-- Left Main Content Column (7 / 12 Cols ~ 61.8%) -->
                <div class="lg:col-span-7 space-y-6">
                    
                    <!-- Section 1: Gambaran & Deskripsi Lengkap -->
                    <div class="space-y-3">
                        <h3 class="text-base sm:text-xl font-extrabold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                            <i class="fa-solid fa-book-open text-bps-blue"></i>
                            <span>Gambaran Umum & Profil Rinci</span>
                        </h3>
                        <p class="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line font-normal">
                            ${deskripsiUtama}
                        </p>
                    </div>

                    <!-- Section 2: Keunggulan Utama & Fitur Differentiator (4 Cards) -->
                    <div class="space-y-3">
                        <h3 class="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                            <i class="fa-solid fa-star text-amber-500"></i>
                            <span>Daya Tarik & Keunggulan Utama</span>
                        </h3>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div class="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-1">
                                <div class="flex items-center gap-2 font-bold text-amber-900 text-xs">
                                    <i class="fa-solid fa-circle-check text-amber-500"></i>
                                    <span>Mutu & Kualitas Super</span>
                                </div>
                                <p class="text-[11px] text-slate-600 leading-normal">
                                    ${keunggulan}
                                </p>
                            </div>

                            <div class="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200/80 space-y-1">
                                <div class="flex items-center gap-2 font-bold text-blue-900 text-xs">
                                    <i class="fa-solid fa-seedling text-bps-blue"></i>
                                    <span>Ramah Lingkungan</span>
                                </div>
                                <p class="text-[11px] text-slate-600 leading-normal">
                                    Pengembangan potensi dengan memperhatikan prinsip keberlanjutan dan kelestarian ekosistem lokal.
                                </p>
                            </div>

                            <div class="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-1">
                                <div class="flex items-center gap-2 font-bold text-emerald-900 text-xs">
                                    <i class="fa-solid fa-users text-emerald-600"></i>
                                    <span>Pemberdayaan Warga</span>
                                </div>
                                <p class="text-[11px] text-slate-600 leading-normal">
                                    Membuka lapangan kerja lokal dan melibatkan puluhan keluarga dalam kelompok usaha bersama desa.
                                </p>
                            </div>

                            <div class="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200/80 space-y-1">
                                <div class="flex items-center gap-2 font-bold text-purple-900 text-xs">
                                    <i class="fa-solid fa-chart-line text-purple-600"></i>
                                    <span>Dampak Ekonomi Nyata</span>
                                </div>
                                <p class="text-[11px] text-slate-600 leading-normal">
                                    Menjadi salah satu pilar penopang pendapatan desa dan mendukung kemandirian ekonomi Sadawarna.
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Section 3: Dokumentasi Lapangan (Mini Photo Grid) -->
                    <div class="space-y-3">
                        <h3 class="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                            <i class="fa-solid fa-images text-indigo-600"></i>
                            <span>Galeri Dokumentasi Lapangan</span>
                        </h3>
                        <div class="grid grid-cols-3 gap-2.5">
                            <img src="${extraPhotos[0]}" alt="Foto 1" class="w-full h-24 sm:h-32 object-cover rounded-xl border border-slate-200 shadow-2xs">
                            <img src="${extraPhotos[1]}" alt="Foto 2" class="w-full h-24 sm:h-32 object-cover rounded-xl border border-slate-200 shadow-2xs">
                            <img src="${extraPhotos[2]}" alt="Foto 3" class="w-full h-24 sm:h-32 object-cover rounded-xl border border-slate-200 shadow-2xs">
                        </div>
                    </div>

                    <!-- Section 4: Tabel Spesifikasi Data Teknis -->
                    <div class="space-y-3">
                        <h3 class="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                            <i class="fa-solid fa-table-list text-slate-700"></i>
                            <span>Rincian Spesifikasi Data Teknis</span>
                        </h3>
                        <div class="overflow-x-auto rounded-2xl border border-slate-200/90 text-xs">
                            <table class="w-full text-left border-collapse">
                                <tbody>
                                    <tr class="border-b border-slate-100 bg-slate-50/60">
                                        <td class="p-3 font-semibold text-slate-500 w-1/3">Kategori Potensi</td>
                                        <td class="p-3 font-bold text-slate-900">${item.kategori}</td>
                                    </tr>
                                    <tr class="border-b border-slate-100">
                                        <td class="p-3 font-semibold text-slate-500">Estimasi Kapasitas / Nilai</td>
                                        <td class="p-3 font-bold text-amber-700">${nilaiEkonomi}</td>
                                    </tr>
                                    <tr class="border-b border-slate-100 bg-slate-50/60">
                                        <td class="p-3 font-semibold text-slate-500">Lembaga Pengelola</td>
                                        <td class="p-3 font-bold text-slate-900">${pengelola}</td>
                                    </tr>
                                    <tr class="border-b border-slate-100">
                                        <td class="p-3 font-semibold text-slate-500">Lokasi / Alamat Wilayah</td>
                                        <td class="p-3 font-bold text-slate-900">${lokasi}</td>
                                    </tr>
                                    <tr class="bg-slate-50/60">
                                        <td class="p-3 font-semibold text-slate-500">Status Pembinaan</td>
                                        <td class="p-3 font-bold text-emerald-700">Terdaftar dalam Program Desa Cantik BPS Subang 2026</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Right Sidebar Column (5 / 12 Cols ~ 38.2%) -->
                <div class="lg:col-span-5 space-y-5">
                    
                    <!-- Card 1: Profil Pengelola & Kontak Direct -->
                    <div class="bg-slate-50/90 rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
                        <h3 class="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-200">
                            <i class="fa-solid fa-address-card text-bps-blue"></i>
                            <span>Pengelola & Penanggung Jawab</span>
                        </h3>

                        <div class="space-y-3.5 text-xs">
                            <div class="flex items-start gap-3">
                                <div class="w-9 h-9 rounded-xl bg-blue-100 text-bps-blue flex items-center justify-center text-sm flex-shrink-0 font-bold">
                                    <i class="fa-solid fa-user-gear"></i>
                                </div>
                                <div>
                                    <span class="text-[10px] text-slate-500 font-bold uppercase block">Mitra Pengelola</span>
                                    <span class="font-extrabold text-slate-900 text-sm block mt-0.5">${pengelola}</span>
                                </div>
                            </div>

                            <div class="flex items-start gap-3">
                                <div class="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-sm flex-shrink-0 font-bold">
                                    <i class="fa-solid fa-phone"></i>
                                </div>
                                <div>
                                    <span class="text-[10px] text-slate-500 font-bold uppercase block">Kontak Layanan</span>
                                    <span class="font-bold text-slate-800 block mt-0.5">${kontak}</span>
                                </div>
                            </div>

                            <div class="flex items-start gap-3">
                                <div class="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-sm flex-shrink-0 font-bold">
                                    <i class="fa-solid fa-location-dot"></i>
                                </div>
                                <div>
                                    <span class="text-[10px] text-slate-500 font-bold uppercase block">Alamat Sekretariat</span>
                                    <span class="font-semibold text-slate-700 block mt-0.5">${lokasi}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Direct WhatsApp Action Button -->
                        <div class="pt-2 border-t border-slate-200 space-y-2">
                            <a href="https://wa.me/6281234567890?text=Halo%20Pengelola%20${encodeURIComponent(item.judulPotensi)},%20saya%20ingin%20bertanya%20informasi%20lebih%20lanjut." 
                               target="_blank" 
                               rel="noopener noreferrer" 
                               class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2">
                                <i class="fa-brands fa-whatsapp text-sm"></i>
                                <span>Hubungi Pengelola via WhatsApp</span>
                            </a>

                            <button onclick="switchView('potensi')" class="w-full py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-2">
                                <i class="fa-solid fa-arrow-left"></i>
                                <span>Kembali ke Galeri Potensi</span>
                            </button>
                        </div>
                    </div>

                    <!-- Card 2: Stamp Verifikasi BPS Subang -->
                    <div class="bg-gradient-to-br from-blue-900 via-bps-navy to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-blue-800 space-y-3">
                        <div class="flex items-center gap-2">
                            <span class="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[10px]">BPS SUBANG</span>
                            <span class="text-xs font-bold text-blue-200">Desa Cinta Statistik</span>
                        </div>
                        <h4 class="text-sm font-extrabold leading-snug">Terdaftar dalam Portal Resmi Desa Cantik</h4>
                        <p class="text-[11px] text-blue-100/90 leading-relaxed">
                            Potensi ini telah didata, diverifikasi, dan dibina secara sistematis sebagai bagian dari penguatan basis data statistik desa di Kabupaten Subang.
                        </p>
                    </div>

                </div>

            </div>
        </div>
    `;

    // Switch view to potensi-detail page
    switchView("potensi-detail", item.judulPotensi);
}

// Global helper copy link
window.copyCurrentUrl = function () {
    navigator.clipboard.writeText(window.location.href);
    alert("🔗 Tautan detail potensi berhasil disalin!");
};

// Alias untuk kompatibilitas
function openPotensiModal(id) {
    bukaDetailPotensi(id);
}

function closePotensiModal() {
    switchView("potensi");
}

/**
 * 4. Render Chart Demografi Pekerjaan
 */
function renderJobChart(listPekerjaan) {
    const ctx = document.getElementById("jobChart");
    const legendContainer = document.getElementById("job-legend-list");

    if (!ctx || !listPekerjaan || listPekerjaan.length === 0) return;

    const totalPekerja = listPekerjaan.reduce((acc, curr) => acc + (curr.jumlah || 0), 0);

    const labels = listPekerjaan.map(item => item.kategori);
    const dataValues = listPekerjaan.map(item => item.jumlah);
    const backgroundColors = CONFIG.CHART_COLORS.slice(0, listPekerjaan.length);

    if (jobChartInstance) {
        jobChartInstance.destroy();
    }

    const centerTextPlugin = {
        id: 'centerText',
        beforeDraw: function (chart) {
            const width = chart.width;
            const height = chart.height;
            const ctx = chart.ctx;
            ctx.restore();

            const fontSize = (height / 160).toFixed(2);
            ctx.font = `bold ${fontSize}em "Plus Jakarta Sans", sans-serif`;
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#0f172a";

            const text = formatRibuan(totalPekerja);
            const textX = Math.round((width - ctx.measureText(text).width) / 2);
            const textY = height / 2 - 6;
            ctx.fillText(text, textX, textY);

            ctx.font = `500 ${fontSize * 0.45}em "Plus Jakarta Sans", sans-serif`;
            ctx.fillStyle = "#64748b";
            const subText = "Tenaga Kerja";
            const subTextX = Math.round((width - ctx.measureText(subText).width) / 2);
            const subTextY = height / 2 + 10;
            ctx.fillText(subText, subTextX, subTextY);

            ctx.save();
        }
    };

    jobChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: backgroundColors,
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverOffset: 4
            }]
        },
        plugins: [centerTextPlugin],
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const value = context.raw || 0;
                            const percentage = totalPekerja > 0 ? ((value / totalPekerja) * 100).toFixed(1) : 0;
                            return ` ${context.label}: ${formatRibuan(value)} jiwa (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '72%'
        }
    });

    if (legendContainer) {
        legendContainer.innerHTML = listPekerjaan.map((item, index) => {
            const color = backgroundColors[index % backgroundColors.length];
            const pct = item.persentase !== null && item.persentase !== undefined
                ? item.persentase
                : (totalPekerja > 0 ? ((item.jumlah / totalPekerja) * 100).toFixed(1) : 0);

            return `
                <div class="p-3 sm:p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:bg-white hover:shadow-xs transition-all w-full box-border">
                    <div class="flex items-center justify-between gap-2 mb-1.5">
                        <div class="flex items-center gap-2 min-w-0">
                            <span class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: ${color}"></span>
                            <span class="text-xs font-bold text-slate-800 truncate">${item.kategori}</span>
                        </div>
                        <div class="text-right flex-shrink-0">
                            <span class="text-xs font-extrabold text-slate-900">${formatRibuan(item.jumlah)} <span class="text-[10px] font-normal text-slate-500">jiwa</span></span>
                            <span class="ml-1 text-[11px] font-semibold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">${pct}%</span>
                        </div>
                    </div>

                    <div class="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden">
                        <div class="h-full rounded-full transition-all duration-500" 
                             style="width: ${pct}%; background-color: ${color}"></div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

/**
 * 5A. Filter Dokumen Publikasi Desa
 */
function filterDokumenKategori(category) {
    activeDocCategory = category;

    const filterBtns = document.querySelectorAll(".doc-filter-btn");
    filterBtns.forEach(btn => {
        if (btn.textContent.trim() === category || (category === "Semua" && btn.textContent.trim().includes("Semua"))) {
            btn.className = "doc-filter-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-bps-blue text-white shadow-xs";
        } else {
            btn.className = "doc-filter-btn px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200";
        }
    });

    currentDocPage = 1;

    if (category === "Semua") {
        currentFilteredDocs = cachedDokumen;
    } else {
        currentFilteredDocs = cachedDokumen.filter(doc => {
            const kat = (doc.kategori || "").toLowerCase();
            if (category === "Publikasi BPS") return kat.includes("bps");
            if (category === "Profil Wilayah") return kat.includes("profil") || kat.includes("monografi");
            if (category === "Perdes") return kat.includes("peraturan") || kat.includes("perdes");
            return kat.includes(category.toLowerCase());
        });
    }
    renderDokumenPublikasi(currentFilteredDocs, 1);
}

/**
 * 5B. Render Dokumen Publikasi Desa dengan Pagination
 */
function renderDokumenPublikasi(listDokumen, page = 1) {
    const tbody = document.getElementById("document-table-body");
    const mobileContainer = document.getElementById("document-mobile-cards");

    currentDocPage = page;

    if (!listDokumen || listDokumen.length === 0) {
        const emptyStateHTML = `
            <div class="py-10 text-center text-slate-400 col-span-full w-full">
                <i class="fa-solid fa-folder-open text-3xl mb-2 text-slate-300"></i>
                <p class="text-xs">Tidak ada dokumen publikasi yang cocok dengan kriteria.</p>
            </div>
        `;
        if (tbody) tbody.innerHTML = `<tr><td colspan="5">${emptyStateHTML}</td></tr>`;
        if (mobileContainer) mobileContainer.innerHTML = emptyStateHTML;
        renderDokumenPagination(0, 1);
        return;
    }

    const itemsPerPage = getDocItemsPerPage();
    const startIndex = (page - 1) * itemsPerPage;
    const pageItems = listDokumen.slice(startIndex, startIndex + itemsPerPage);

    if (tbody) {
        tbody.innerHTML = pageItems.map((doc) => {
            const badgeStyle = getCategoryBadgeStyle(doc.kategori);

            return `
                <tr class="hover:bg-slate-50/80 transition-colors group">
                    <td class="py-4 px-6">
                        <div class="flex items-start gap-3">
                            <div class="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                                <i class="fa-solid fa-file-pdf text-base"></i>
                            </div>
                            <div>
                                <h4 class="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-bps-blue transition-colors">
                                    ${doc.judul}
                                </h4>
                                <p class="text-xs text-slate-500 mt-0.5 line-clamp-1">${doc.deskripsi || '-'}</p>
                            </div>
                        </div>
                    </td>
                    <td class="py-4 px-4">
                        <span class="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${badgeStyle}">
                            ${doc.kategori}
                        </span>
                    </td>
                    <td class="py-4 px-4 text-center font-medium text-slate-600 text-xs">
                        ${doc.tahun}
                    </td>
                    <td class="py-4 px-4 text-center text-xs text-slate-400 font-mono">
                        ${doc.ukuran || '-'}
                    </td>
                    <td class="py-4 px-6 text-right">
                        <a href="${doc.urlDrive || '#'}" 
                           target="_blank" 
                           rel="noopener noreferrer" 
                           class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-bps-blue bg-blue-50 hover:bg-bps-blue hover:text-white border border-blue-200/80 transition-all duration-200 shadow-2xs">
                            <span>Buka Dokumen</span>
                            <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                        </a>
                    </td>
                </tr>
            `;
        }).join('');
    }

    if (mobileContainer) {
        mobileContainer.innerHTML = pageItems.map((doc) => {
            const badgeStyle = getCategoryBadgeStyle(doc.kategori);

            return `
                <div class="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2.5 w-full box-border">
                    <div class="flex items-start justify-between gap-3">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                                <i class="fa-solid fa-file-pdf text-sm"></i>
                            </div>
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${badgeStyle}">
                                ${doc.kategori}
                            </span>
                        </div>
                        <span class="text-[10px] text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded">
                            Tahun ${doc.tahun}
                        </span>
                    </div>

                    <div>
                        <h4 class="text-xs font-bold text-slate-900 leading-snug">${doc.judul}</h4>
                        <p class="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">${doc.deskripsi || '-'}</p>
                    </div>

                    <div class="pt-2 border-t border-slate-100">
                        <a href="${doc.urlDrive || '#'}" 
                           target="_blank" 
                           rel="noopener noreferrer" 
                           class="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-bps-blue bg-blue-50 hover:bg-bps-blue hover:text-white border border-blue-200 transition-all">
                            <span>Buka Dokumen</span>
                            <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                        </a>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderDokumenPagination(listDokumen.length, page);
}

/**
 * 5C. Render Control Bar Pagination Dokumen Publikasi
 */
function renderDokumenPagination(totalItems, currentPage) {
    const container = document.getElementById("document-pagination-container");
    if (!container) return;

    if (totalItems === 0) {
        container.innerHTML = "";
        return;
    }

    const itemsPerPage = getDocItemsPerPage();
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = ((currentPage - 1) * itemsPerPage) + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    let pageButtonsHTML = '';
    for (let p = 1; p <= totalPages; p++) {
        const isCurrent = p === currentPage;
        const btnClass = isCurrent
            ? "bg-bps-blue text-white font-bold shadow-xs border-bps-blue"
            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80";
        pageButtonsHTML += `
            <button onclick="goToDocPage(${p})" class="w-8 h-8 rounded-xl text-xs border transition-all ${btnClass}">
                ${p}
            </button>
        `;
    }

    const prevDisabled = currentPage === 1;
    const nextDisabled = currentPage === totalPages;

    container.innerHTML = `
        <div class="text-slate-500 font-medium text-[11px]">
            Menampilkan <strong class="text-slate-800">${startItem}-${endItem}</strong> dari <strong class="text-slate-800">${totalItems}</strong> dokumen
        </div>
        <div class="flex items-center gap-1.5">
            <button onclick="goToDocPage(${currentPage - 1})" 
                    ${prevDisabled ? 'disabled' : ''} 
                    class="px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${prevDisabled ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'}">
                <i class="fa-solid fa-chevron-left text-[10px] mr-1"></i> Prev
            </button>
            <div class="flex items-center gap-1">
                ${pageButtonsHTML}
            </div>
            <button onclick="goToDocPage(${currentPage + 1})" 
                    ${nextDisabled ? 'disabled' : ''} 
                    class="px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${nextDisabled ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'}">
                Next <i class="fa-solid fa-chevron-right text-[10px] ml-1"></i>
            </button>
        </div>
    `;
}

window.goToDocPage = function (page) {
    const itemsPerPage = getDocItemsPerPage();
    const totalPages = Math.ceil(currentFilteredDocs.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    currentDocPage = page;
    renderDokumenPublikasi(currentFilteredDocs, page);
    document.getElementById("view-dokumen")?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/**
 * Setup Listener Pencarian (Dokumen & Potensi View)
 */
function setupSearchListeners() {
    const searchDoc = document.getElementById("document-search");
    if (searchDoc) {
        searchDoc.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase().trim();
            currentDocPage = 1;

            if (!query) {
                currentFilteredDocs = cachedDokumen;
            } else {
                currentFilteredDocs = cachedDokumen.filter(doc =>
                    doc.judul.toLowerCase().includes(query) ||
                    doc.kategori.toLowerCase().includes(query) ||
                    (doc.deskripsi && doc.deskripsi.toLowerCase().includes(query)) ||
                    doc.tahun.toString().includes(query)
                );
            }
            renderDokumenPublikasi(currentFilteredDocs, 1);
        });
    }

    const searchPotensi = document.getElementById("potensi-search");
    if (searchPotensi) {
        searchPotensi.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase().trim();
            currentPotensiPageView = 1;

            if (!query) {
                currentFilteredPotensiView = cachedPotensi;
            } else {
                currentFilteredPotensiView = cachedPotensi.filter(item =>
                    item.judulPotensi.toLowerCase().includes(query) ||
                    item.kategori.toLowerCase().includes(query) ||
                    (item.deskripsi && item.deskripsi.toLowerCase().includes(query)) ||
                    (item.lokasi && item.lokasi.toLowerCase().includes(query))
                );
            }
            renderPotensiDesaView(currentFilteredPotensiView, 1);
        });
    }
}

/**
 * Smart Parser Angka Format Indonesia
 */
function parseAngkaIndo(val) {
    if (val === null || val === undefined) return null;
    if (typeof val === 'number') return val;

    let str = String(val).trim();
    if (!str) return null;

    if (str.includes(',')) {
        str = str.replace(/\./g, '').replace(',', '.');
    } else if (str.includes('.')) {
        const parts = str.split('.');
        if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
            str = str.replace(/\./g, '');
        }
    }

    const num = parseFloat(str);
    return isNaN(num) ? null : num;
}

/**
 * Helper Warna Badge Kategori Dokumen
 */
function getCategoryBadgeStyle(kategori) {
    if (!kategori) return "bg-slate-50 text-slate-700 border-slate-200";
    const kat = kategori.toLowerCase();
    if (kat.includes("bps")) return "bg-blue-50 text-bps-blue border-blue-200";
    if (kat.includes("peraturan") || kat.includes("perdes")) return "bg-amber-50 text-amber-700 border-amber-200";
    if (kat.includes("profil") || kat.includes("monografi")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
}

/**
 * Utility Helper: Format Ribuan
 */
function formatRibuan(num) {
    if (num === null || num === undefined || isNaN(num)) return "-";
    return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Utility Helper: Format Desimal
 */
function formatDesimal(num) {
    if (num === null || num === undefined || isNaN(num)) return "-";
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(num);
}

/**
 * Tampilan UI Error jika Data Gagal Dimuat
 */
function tampilkanErrorUI(message) {
    const container = document.getElementById("stat-cards-section");
    if (container) {
        const errorDiv = document.createElement("div");
        errorDiv.className = "col-span-full bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-700 text-xs flex items-center gap-3";
        errorDiv.innerHTML = `
            <i class="fa-solid fa-circle-exclamation text-lg text-rose-500"></i>
            <div>
                <strong>Gagal Memuat Data dari Google Sheets:</strong> ${message}. 
                <span class="block text-[11px] text-rose-500 mt-1">Pastikan spreadsheet publik (Anyone with link can view) dan nama tab (identitas, statistikMakro, potensiDesa, mataPencaharian, dokumenPublikasi) sudah benar.</span>
            </div>
        `;
        container.prepend(errorDiv);
    }
}

/**
 * ==============================================================================
 * MODUL RENDERER: STATISTIK TEMATIK DESA (DEMOGRAFI, SOSIAL, EKONOMI, PERTANIAN)
 * ==============================================================================
 */

/**
 * Switch Active Tab pada Modul Statistik Tematik
 */
function switchStatTab(tabName) {
    const tabs = ['demografi', 'sosial', 'ekonomi', 'pertanian'];
    
    tabs.forEach(tab => {
        const btn = document.getElementById(`stat-tab-btn-${tab}`);
        const content = document.getElementById(`stat-tab-content-${tab}`);
        
        if (tab === tabName) {
            if (btn) {
                btn.className = "stat-tab-btn active-stat-tab px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap bg-bps-blue text-white shadow-xs";
            }
            if (content) {
                content.classList.remove('hidden');
                content.classList.add('block');
            }
        } else {
            if (btn) {
                btn.className = "stat-tab-btn px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-bps-blue hover:bg-slate-100 transition-all flex items-center gap-1.5 whitespace-nowrap";
            }
            if (content) {
                content.classList.remove('block');
                content.classList.add('hidden');
            }
        }
    });
}

/**
 * Render Status Penduduk (Demografi & Gender)
 */
function renderStatusPenduduk(data, makroData) {
    const container = document.getElementById("container-stat-demografi");
    if (!container) return;
    
    const total = parseAngkaIndo(data?.totalPenduduk) || parseAngkaIndo(makroData?.totalPenduduk) || 5420;
    const laki = parseAngkaIndo(data?.lakiLaki) || 2740;
    const perempuan = parseAngkaIndo(data?.perempuan) || 2680;
    const rasio = data?.rasioJenisKelamin || (total > 0 ? ((laki / perempuan) * 100).toFixed(2) : 102.24);

    const pctLaki = ((laki / total) * 100).toFixed(1);
    const pctPerempuan = ((perempuan / total) * 100).toFixed(1);

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <!-- Card 1: Penduduk Laki-laki -->
            <div class="bg-gradient-to-br from-blue-50/80 to-slate-50 rounded-2xl p-4 sm:p-5 border border-blue-100/80 shadow-2xs">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-xs font-bold text-blue-700 uppercase tracking-wider">Laki-Laki</span>
                    <div class="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm shadow-xs">
                        <i class="fa-solid fa-mars"></i>
                    </div>
                </div>
                <div class="flex items-baseline gap-2">
                    <span class="text-2xl sm:text-3xl font-extrabold text-slate-900">${formatRibuan(laki)}</span>
                    <span class="text-xs font-semibold text-slate-500">Jiwa (${pctLaki}%)</span>
                </div>
                <div class="w-full bg-blue-200/60 h-2 rounded-full mt-3 overflow-hidden">
                    <div class="bg-blue-600 h-full rounded-full transition-all duration-500" style="width: ${pctLaki}%"></div>
                </div>
                <p class="text-[11px] text-slate-500 mt-2 font-medium">Populasi pria Desa Sadawarna</p>
            </div>

            <!-- Card 2: Penduduk Perempuan -->
            <div class="bg-gradient-to-br from-rose-50/80 to-slate-50 rounded-2xl p-4 sm:p-5 border border-rose-100/80 shadow-2xs">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-xs font-bold text-rose-700 uppercase tracking-wider">Perempuan</span>
                    <div class="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center text-sm shadow-xs">
                        <i class="fa-solid fa-venus"></i>
                    </div>
                </div>
                <div class="flex items-baseline gap-2">
                    <span class="text-2xl sm:text-3xl font-extrabold text-slate-900">${formatRibuan(perempuan)}</span>
                    <span class="text-xs font-semibold text-slate-500">Jiwa (${pctPerempuan}%)</span>
                </div>
                <div class="w-full bg-rose-200/60 h-2 rounded-full mt-3 overflow-hidden">
                    <div class="bg-rose-500 h-full rounded-full transition-all duration-500" style="width: ${pctPerempuan}%"></div>
                </div>
                <p class="text-[11px] text-slate-500 mt-2 font-medium">Populasi wanita Desa Sadawarna</p>
            </div>

            <!-- Card 3: Rasio Jenis Kelamin (Sex Ratio) -->
            <div class="bg-gradient-to-br from-indigo-50/80 to-slate-50 rounded-2xl p-4 sm:p-5 border border-indigo-100/80 shadow-2xs">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-xs font-bold text-indigo-700 uppercase tracking-wider">Rasio Jenis Kelamin</span>
                    <div class="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm shadow-xs">
                        <i class="fa-solid fa-scale-balanced"></i>
                    </div>
                </div>
                <div class="flex items-baseline gap-2">
                    <span class="text-2xl sm:text-3xl font-extrabold text-slate-900">${rasio}</span>
                    <span class="text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md">Sex Ratio</span>
                </div>
                <div class="text-[11px] text-slate-600 mt-3 pt-2 border-t border-indigo-100 flex items-center gap-1.5">
                    <i class="fa-solid fa-circle-info text-indigo-500"></i>
                    <span>Terdapat <b>${Math.round(rasio)}</b> laki-laki per 100 perempuan.</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render Statistik Sosial
 */
function renderStatistikSosial(data) {
    const container = document.getElementById("container-stat-sosial");
    if (!container) return;

    const miskin = parseAngkaIndo(data?.pendudukMiskin) || 312;
    const bansos = parseAngkaIndo(data?.penerimaBansos) || 285;
    const pendidikan = data?.pendidikanDominan || "SMA / Sederajat";
    const fasPendidikan = data?.fasilitasPendidikan || "3 SD, 1 SMP, 1 SMA, 2 PAUD";
    const fasKesehatan = data?.fasilitasKesehatan || "1 Poskesdes, 4 Posyandu, 1 Bidan Desa";
    const disabilitas = parseAngkaIndo(data?.penyandangDisabilitas) || 18;

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Card 1: Penduduk Miskin & Bansos -->
            <div class="bg-slate-50/90 rounded-2xl p-4 border border-slate-200/80 hover:border-pink-300 transition-all">
                <div class="flex items-center gap-2 mb-2 text-pink-600 font-bold text-xs">
                    <i class="fa-solid fa-hand-holding-heart text-sm"></i>
                    <span>Kesejahteraan Sosial</span>
                </div>
                <div class="text-xl font-extrabold text-slate-900">${formatRibuan(miskin)} <span class="text-xs font-normal text-slate-500">Jiwa Miskin</span></div>
                <div class="mt-2 text-xs text-slate-600">
                    <span class="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">${formatRibuan(bansos)} KPM</span>
                    <span class="text-[11px] block mt-1 text-slate-500">Penerima Bantuan Sosial (PKH/BPNT)</span>
                </div>
            </div>

            <!-- Card 2: Pendidikan -->
            <div class="bg-slate-50/90 rounded-2xl p-4 border border-slate-200/80 hover:border-blue-300 transition-all">
                <div class="flex items-center gap-2 mb-2 text-blue-600 font-bold text-xs">
                    <i class="fa-solid fa-graduation-cap text-sm"></i>
                    <span>Pendidikan</span>
                </div>
                <div class="text-base font-extrabold text-slate-900">${pendidikan}</div>
                <div class="mt-2 text-xs text-slate-600">
                    <span class="font-medium text-slate-700">${fasPendidikan}</span>
                    <span class="text-[11px] block mt-1 text-slate-500">Fasilitas Pendidikan Desa</span>
                </div>
            </div>

            <!-- Card 3: Kesehatan -->
            <div class="bg-slate-50/90 rounded-2xl p-4 border border-slate-200/80 hover:border-emerald-300 transition-all">
                <div class="flex items-center gap-2 mb-2 text-emerald-600 font-bold text-xs">
                    <i class="fa-solid fa-notes-medical text-sm"></i>
                    <span>Layanan Kesehatan</span>
                </div>
                <div class="text-sm font-bold text-slate-900 line-clamp-1">${fasKesehatan}</div>
                <div class="mt-2 text-xs text-slate-600">
                    <span class="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">Poskesdes Active</span>
                    <span class="text-[11px] block mt-1 text-slate-500">Posyandu & Layanan Kesehatan Ibu-Anak</span>
                </div>
            </div>

            <!-- Card 4: Disabilitas -->
            <div class="bg-slate-50/90 rounded-2xl p-4 border border-slate-200/80 hover:border-purple-300 transition-all">
                <div class="flex items-center gap-2 mb-2 text-purple-600 font-bold text-xs">
                    <i class="fa-solid fa-wheelchair text-sm"></i>
                    <span>Penyandang Disabilitas</span>
                </div>
                <div class="text-xl font-extrabold text-slate-900">${formatRibuan(disabilitas)} <span class="text-xs font-normal text-slate-500">Jiwa</span></div>
                <div class="mt-2 text-xs text-slate-600">
                    <span class="text-[11px] text-slate-500">Pendataan inklusif untuk bantuan pemberdayaan & alat bantu.</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render Statistik Ekonomi
 */
function renderStatistikEkonomi(data) {
    const container = document.getElementById("container-stat-ekonomi");
    if (!container) return;

    const umkm = parseAngkaIndo(data?.jumlahUmkm) || 142;
    const jenisUsaha = data?.jenisUsahaDominan || "Perdagangan & Pengolahan Pangan";
    const saranaPerdagangan = data?.saranaPerdagangan || "1 Pasar Desa, 28 Toko/Warung, 3 Minimarket";
    const pendapatan = data?.pendapatanRataRata || "Rp 2.850.000 / bulan";
    const hargaKomoditas = data?.hargaKomoditasUtama || "Padi: Rp 7.200/kg | Nanas: Rp 8.000/biji | Daging Ayam: Rp 35.000/kg";
    const tenagaKerja = parseAngkaIndo(data?.angkatanKerja) || 3480;

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <!-- Card 1: UMKM & Jenis Usaha -->
            <div class="bg-amber-50/70 rounded-2xl p-4 border border-amber-200/70">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-bold text-amber-800 uppercase tracking-wider">Usaha & UMKM</span>
                    <span class="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs"><i class="fa-solid fa-store"></i></span>
                </div>
                <div class="text-2xl font-extrabold text-slate-900">${formatRibuan(umkm)} <span class="text-xs font-normal text-slate-600">Unit UMKM</span></div>
                <p class="text-xs font-semibold text-amber-900 mt-2">${jenisUsaha}</p>
                <p class="text-[11px] text-slate-500 mt-1">${saranaPerdagangan}</p>
            </div>

            <!-- Card 2: Pendapatan & Angkatan Kerja -->
            <div class="bg-blue-50/70 rounded-2xl p-4 border border-blue-200/70">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-bold text-blue-800 uppercase tracking-wider">Pendapatan & Kerja</span>
                    <span class="w-8 h-8 rounded-lg bg-bps-blue text-white flex items-center justify-center text-xs"><i class="fa-solid fa-wallet"></i></span>
                </div>
                <div class="text-lg font-extrabold text-slate-900">${pendapatan}</div>
                <p class="text-xs font-semibold text-slate-700 mt-2"><i class="fa-solid fa-user-check text-blue-600"></i> ${formatRibuan(tenagaKerja)} Angkatan Kerja</p>
                <p class="text-[11px] text-slate-500 mt-1">Estimasi rata-rata pendapatan keluarga desa per bulan</p>
            </div>

            <!-- Card 3: Harga Komoditas Pasar Desa -->
            <div class="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200/70 md:col-span-1">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-bold text-emerald-800 uppercase tracking-wider">Harga Komoditas Utama</span>
                    <span class="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs"><i class="fa-solid fa-tags"></i></span>
                </div>
                <div class="text-xs text-slate-700 font-medium space-y-1.5 mt-2">
                    ${hargaKomoditas.split('|').map(item => `
                        <div class="flex items-center justify-between bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-100 text-[11px]">
                            <span>${item.trim()}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

/**
 * Render Pertanian & Peternakan
 */
function renderPertanianPeternakan(data) {
    const container = document.getElementById("container-stat-pertanian");
    if (!container) return;

    const lahan = parseAngkaIndo(data?.luasLahanPertanian) || 680;
    const panen = parseAngkaIndo(data?.luasPanen) || 620;
    const padi = parseAngkaIndo(data?.produksiPadi) || 450;
    const jagung = parseAngkaIndo(data?.produksiJagung) || 120;
    const bawang = parseAngkaIndo(data?.produksiBawangMerah) || 35;
    const sayur = parseAngkaIndo(data?.produksiSayuran) || 85;
    const buah = parseAngkaIndo(data?.produksiBuah) || 320;
    const ternak = parseAngkaIndo(data?.jumlahTernak) || 1450;
    const hasilTernak = data?.produksiTelurDaging || "45 Ton Daging & 12 Ton Telur / Tahun";
    const poktan = parseAngkaIndo(data?.jumlahKelompokTani) || 12;

    container.innerHTML = `
        <div class="space-y-4">
            <!-- Header Summary Cards -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div class="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200/80">
                    <span class="text-[10px] font-bold text-emerald-800 uppercase">Luas Lahan</span>
                    <div class="text-lg font-extrabold text-slate-900">${formatRibuan(lahan)} <span class="text-xs font-normal">Ha</span></div>
                    <span class="text-[10px] text-slate-500">Lahan Pertanian</span>
                </div>

                <div class="bg-teal-50/80 p-3.5 rounded-xl border border-teal-200/80">
                    <span class="text-[10px] font-bold text-teal-800 uppercase">Luas Panen</span>
                    <div class="text-lg font-extrabold text-slate-900">${formatRibuan(panen)} <span class="text-xs font-normal">Ha</span></div>
                    <span class="text-[10px] text-slate-500">Estimasi Panen</span>
                </div>

                <div class="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200/80">
                    <span class="text-[10px] font-bold text-amber-800 uppercase">Populasi Ternak</span>
                    <div class="text-lg font-extrabold text-slate-900">${formatRibuan(ternak)} <span class="text-xs font-normal">Ekor</span></div>
                    <span class="text-[10px] text-slate-500">Sapi, Kambing & Ayam</span>
                </div>

                <div class="bg-lime-50/80 p-3.5 rounded-xl border border-lime-200/80">
                    <span class="text-[10px] font-bold text-lime-800 uppercase">Kelompok Tani</span>
                    <div class="text-lg font-extrabold text-slate-900">${formatRibuan(poktan)} <span class="text-xs font-normal">Poktan</span></div>
                    <span class="text-[10px] text-slate-500">Gabungan Poktan Desa</span>
                </div>
            </div>

            <!-- Produksi Komoditas Grid -->
            <div class="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80">
                <h4 class="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <i class="fa-solid fa-wheat-awn text-emerald-600"></i> Produksi Komoditas Pangan Utama (Ton/Tahun)
                </h4>
                
                <div class="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    <div class="bg-white p-3 rounded-xl border border-slate-200 text-center">
                        <span class="text-[10px] text-slate-500 font-bold block mb-1">🌾 Padi</span>
                        <span class="text-base font-extrabold text-emerald-600">${formatRibuan(padi)}</span>
                        <span class="text-[10px] text-slate-400 block">Ton</span>
                    </div>

                    <div class="bg-white p-3 rounded-xl border border-slate-200 text-center">
                        <span class="text-[10px] text-slate-500 font-bold block mb-1">🌽 Jagung</span>
                        <span class="text-base font-extrabold text-amber-600">${formatRibuan(jagung)}</span>
                        <span class="text-[10px] text-slate-400 block">Ton</span>
                    </div>

                    <div class="bg-white p-3 rounded-xl border border-slate-200 text-center">
                        <span class="text-[10px] text-slate-500 font-bold block mb-1">🧅 Bawang Merah</span>
                        <span class="text-base font-extrabold text-rose-600">${formatRibuan(bawang)}</span>
                        <span class="text-[10px] text-slate-400 block">Ton</span>
                    </div>

                    <div class="bg-white p-3 rounded-xl border border-slate-200 text-center">
                        <span class="text-[10px] text-slate-500 font-bold block mb-1">🥬 Sayuran</span>
                        <span class="text-base font-extrabold text-teal-600">${formatRibuan(sayur)}</span>
                        <span class="text-[10px] text-slate-400 block">Ton</span>
                    </div>

                    <div class="bg-white p-3 rounded-xl border border-slate-200 text-center col-span-2 sm:col-span-1">
                        <span class="text-[10px] text-slate-500 font-bold block mb-1">🍍 Buah-buahan</span>
                        <span class="text-base font-extrabold text-yellow-600">${formatRibuan(buah)}</span>
                        <span class="text-[10px] text-slate-400 block">Ton (Nanas, dll)</span>
                    </div>
                </div>

                <div class="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                    <span class="font-medium"><i class="fa-solid fa-drumstick-bite text-amber-600"></i> Hasil Peternakan: <b>${hasilTernak}</b></span>
                </div>
            </div>
        </div>
    `;
}
