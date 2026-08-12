/**
 * ==============================================================================
 * MICRO-PORTAL DESA CANTIK BPS KABUPATEN SUBANG
 * File Javascript Utama (Vanilla JS - Zero Framework Dependencies)
 * ==============================================================================
 * 
 * PETUNJUK KUSTOMISASI UNTUK OPERATOR DESA / BPS:
 * 1. Objek CONFIG di bawah ini adalah kontrol utama portal.
 * 2. CARA MENGHUBUNGKAN KE GOOGLE SHEETS (TANPA BACKEND):
 *    - Masukkan URL API SheetDB Anda ke variabel `DATA_URL` di bawah ini.
 *      Contoh: DATA_URL: "https://sheetdb.io/api/v1/1s3selzgb4f1i"
 * 3. Jika menggunakan data lokal:
 *    - Biarkan CONFIG.DATA_URL bernilai "./data.json".
 * ==============================================================================
 */

const CONFIG = {
    // Sumber Data (Dapat berupa path file JSON lokal atau URL API Google Sheets via SheetDB)
    DATA_URL: "https://sheetdb.io/api/v1/1s3selzgb4f1i",
    
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
let cachedDokumen = []; // Cache dokumen untuk fitur pencarian
let cachedPotensi = []; // Cache potensi desa untuk filter
let activePotensiCategory = "Semua";
let activeDocCategory = "Semua";

/**
 * Inisialisasi Aplikasi saat DOM selesai dimuat
 */
document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 Initializing Micro-Portal Desa Cantik BPS Subang...");
    loadData();
    setupSearchListener();

    // Check URL Hash for initial view switching
    if (window.location.hash === "#dokumen") {
        switchView("dokumen");
    }
});

/**
 * SPA View Switcher: Membedakan Tema & Konten Banner Antara Beranda Utama & Halaman Dokumen
 */
function switchView(viewName) {
    const viewHome = document.getElementById("view-home");
    const viewDokumen = document.getElementById("view-dokumen");
    const tabHome = document.getElementById("nav-tab-home");
    const tabDokumen = document.getElementById("nav-tab-dokumen");

    const heroBadgeTag = document.getElementById("hero-badge-tag");
    const heroBadgeSub = document.getElementById("hero-badge-sub");
    const heroTitle = document.getElementById("hero-title");
    const heroDesc = document.getElementById("hero-description");

    const mobileBtnHome = document.getElementById("mobile-btn-home");
    const mobileBtnDokumen = document.getElementById("mobile-btn-dokumen");
    const menuBadge = document.getElementById("menu-view-badge");

    const currentVillage = document.getElementById("hero-village-name")?.textContent || "Desa Sadawarna";

    if (!viewHome || !viewDokumen) return;

    if (viewName === "dokumen") {
        viewHome.classList.add("hidden");
        viewDokumen.classList.remove("hidden");

        // Desktop Nav Styling
        if (tabHome) {
            tabHome.className = "px-3.5 py-1.5 rounded-xl text-slate-600 hover:text-bps-blue hover:bg-slate-100 transition-all flex items-center gap-1.5";
        }
        if (tabDokumen) {
            tabDokumen.className = "px-3.5 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 font-bold border border-indigo-200 transition-all flex items-center gap-1.5 shadow-xs";
        }

        // Mobile Drawer Button Styling (Clean Light System)
        if (mobileBtnHome) {
            mobileBtnHome.className = "w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60 font-medium transition-all text-left";
            const iconContainer = document.getElementById("mobile-btn-home-icon");
            const title = document.getElementById("mobile-btn-home-title");
            const sub = document.getElementById("mobile-btn-home-sub");
            if (iconContainer) iconContainer.className = "w-9 h-9 rounded-xl bg-slate-200/70 text-slate-600 flex items-center justify-center flex-shrink-0";
            if (title) title.className = "text-xs font-bold text-slate-800";
            if (sub) sub.className = "text-[10px] text-slate-500 font-normal";
        }
        if (mobileBtnDokumen) {
            mobileBtnDokumen.className = "w-full flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/90 text-indigo-700 border border-indigo-200/80 font-bold transition-all text-left shadow-2xs";
            const iconContainer = document.getElementById("mobile-btn-dokumen-icon");
            const title = document.getElementById("mobile-btn-dokumen-title");
            const sub = document.getElementById("mobile-btn-dokumen-sub");
            if (iconContainer) iconContainer.className = "w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-2xs";
            if (title) title.className = "text-xs font-extrabold text-indigo-900";
            if (sub) sub.className = "text-[10px] text-indigo-600 font-medium";
        }
        if (menuBadge) {
            menuBadge.textContent = "Mode Dokumen";
            menuBadge.className = "px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-[10px] font-extrabold";
        }

        // Banner Dynamic Update khusus Halaman Dokumen
        if (heroBadgeTag) {
            heroBadgeTag.textContent = "REPOSITORI DOKUMEN";
            heroBadgeTag.className = "px-2 py-0.5 rounded-full bg-indigo-500 text-white font-extrabold text-[10px]";
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

    } else {
        viewDokumen.classList.add("hidden");
        viewHome.classList.remove("hidden");

        // Desktop Nav Styling
        if (tabHome) {
            tabHome.className = "px-3.5 py-1.5 rounded-xl text-bps-blue bg-blue-50 font-bold border border-blue-200 transition-all flex items-center gap-1.5 shadow-xs";
        }
        if (tabDokumen) {
            tabDokumen.className = "px-3.5 py-1.5 rounded-xl text-slate-600 hover:text-bps-blue hover:bg-slate-100 transition-all flex items-center gap-1.5";
        }

        // Mobile Drawer Button Styling (Clean Light System)
        if (mobileBtnHome) {
            mobileBtnHome.className = "w-full flex items-center justify-between p-2.5 rounded-xl bg-blue-50/90 text-bps-blue border border-blue-200/80 font-bold transition-all text-left shadow-2xs";
            const iconContainer = document.getElementById("mobile-btn-home-icon");
            const title = document.getElementById("mobile-btn-home-title");
            const sub = document.getElementById("mobile-btn-home-sub");
            if (iconContainer) iconContainer.className = "w-9 h-9 rounded-xl bg-bps-blue text-white flex items-center justify-center flex-shrink-0 shadow-2xs";
            if (title) title.className = "text-xs font-extrabold text-bps-navy";
            if (sub) sub.className = "text-[10px] text-blue-600 font-medium";
        }
        if (mobileBtnDokumen) {
            mobileBtnDokumen.className = "w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60 font-medium transition-all text-left";
            const iconContainer = document.getElementById("mobile-btn-dokumen-icon");
            const title = document.getElementById("mobile-btn-dokumen-title");
            const sub = document.getElementById("mobile-btn-dokumen-sub");
            if (iconContainer) iconContainer.className = "w-9 h-9 rounded-xl bg-slate-200/70 text-slate-600 flex items-center justify-center flex-shrink-0";
            if (title) title.className = "text-xs font-bold text-slate-800";
            if (sub) sub.className = "text-[10px] text-slate-500 font-normal";
        }
        if (menuBadge) {
            menuBadge.textContent = "Beranda Utama";
            menuBadge.className = "px-2.5 py-0.5 rounded-full bg-blue-50 text-bps-blue border border-blue-200/80 text-[10px] font-extrabold";
        }

        // Banner Dynamic Update khusus Beranda Utama
        if (heroBadgeTag) {
            heroBadgeTag.textContent = "MICRO-PORTAL";
            heroBadgeTag.className = "px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-extrabold text-[10px]";
        }
        if (heroBadgeSub) heroBadgeSub.textContent = "Desa Cinta Statistik BPS Subang";
        if (heroTitle) {
            heroTitle.innerHTML = `Publikasi Data & Potensi <br class="hidden sm:block"><span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-teal-200 to-emerald-300">${currentVillage}</span>`;
        }
        if (heroDesc) {
            heroDesc.textContent = "Pusat publikasi terpadu data statistik makro, indikator demografi, galeri potensi keunggulan wilayah, dan dokumen resmi desa.";
        }

        window.location.hash = "home";
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
 * Memuat Data secara Asynchronous
 */
async function loadData() {
    try {
        let data = {};

        if (CONFIG.DATA_URL.includes("sheetdb.io")) {
            console.log("📡 Mengambil data dinamis dari Google Sheets via SheetDB API...");
            
            const [resIdentitas, resMakro, resPotensi, resJobs, resDocs] = await Promise.all([
                fetch(`${CONFIG.DATA_URL}`),
                fetch(`${CONFIG.DATA_URL}?sheet=statistikMakro`),
                fetch(`${CONFIG.DATA_URL}?sheet=potensiDesa`),
                fetch(`${CONFIG.DATA_URL}?sheet=mataPencaharian`),
                fetch(`${CONFIG.DATA_URL}?sheet=dokumenPublikasi`)
            ]);

            if (!resIdentitas.ok || !resMakro.ok || !resJobs.ok || !resDocs.ok) {
                throw new Error("Gagal mengambil satu atau lebih tab data dari Google Sheets API.");
            }

            const identitasArr = await resIdentitas.json();
            const makroArr = await resMakro.json();
            const potensiArr = resPotensi.ok ? await resPotensi.json() : [];
            const jobsArr = await resJobs.json();
            const docsArr = await resDocs.json();

            data.identitas = identitasArr[0] || {};
            data.statistikMakro = makroArr[0] || {};
            
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
                urlFoto: item.urlFoto || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"
            })) : [];

            data.mataPencaharian = jobsArr.map(item => ({
                kategori: item.kategori,
                jumlah: parseAngkaIndo(item.jumlah) || 0,
                persentase: parseAngkaIndo(item.persentase)
            }));

            data.dokumenPublikasi = docsArr.map(item => ({
                id: parseAngkaIndo(item.id) || 0,
                judul: item.judul || "-",
                kategori: item.kategori || "-",
                tahun: parseAngkaIndo(item.tahun) || 0,
                ukuran: item.ukuran || "-",
                deskripsi: item.deskripsi || "-",
                urlDrive: item.urlDrive || "#"
            }));

        } else {
            console.log("📂 Mengambil data dari file JSON lokal...");
            const response = await fetch(CONFIG.DATA_URL);
            if (!response.ok) {
                throw new Error(`Gagal memuat file JSON lokal. Status HTTP: ${response.status}`);
            }
            data = await response.json();
        }

        console.log("✅ Data Berhasil Diproses:", data);

        if (data.identitas) renderIdentitas(data.identitas);
        if (data.statistikMakro) renderStatCards(data.statistikMakro);
        
        if (data.potensiDesa) {
            cachedPotensi = data.potensiDesa;
            renderPotensiFilterBar(cachedPotensi);
            renderPotensiDesa(cachedPotensi);
        }

        if (data.mataPencaharian) renderJobChart(data.mataPencaharian);
        
        if (data.dokumenPublikasi) {
            cachedDokumen = data.dokumenPublikasi;
            renderDokumenPublikasi(cachedDokumen);
        }

    } catch (error) {
        console.error("❌ Terjadi Kesalahan saat Memuat Data:", error);
        tampilkanErrorUI(error.message);
    }
}

/**
 * 1. Render Identitas Desa
 */
function renderIdentitas(identitas) {
    const namaDesa = identitas.namaDesa || CONFIG.NAMA_DESA;
    const kecamatan = identitas.kecamatan || CONFIG.KECAMATAN;
    const kabupaten = identitas.kabupaten || CONFIG.KABUPATEN;
    
    const alamat = identitas.alamatKantor || identitas.alamatKanttor || "-";
    const email = identitas.email || "-";

    const tagVillage = document.getElementById("header-village-tag");
    const heroVillage = document.getElementById("hero-village-name");
    const heroDesc = document.getElementById("hero-description");
    const heroDistrict = document.getElementById("hero-district");
    const heroCode = document.getElementById("hero-code");

    if (tagVillage) tagVillage.textContent = `Desa ${namaDesa}`;
    if (heroVillage) heroVillage.textContent = `Desa ${namaDesa}`;
    if (heroDesc && identitas.deskripsi && window.location.hash !== "#dokumen") {
        heroDesc.textContent = identitas.deskripsi;
    }
    if (heroDistrict) heroDistrict.textContent = `${kecamatan}, ${kabupaten}`;
    if (heroCode) heroCode.textContent = identitas.kodeDesa || "-";

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
 * 3A. Filter Potensi Desa
 */
function renderPotensiFilterBar(listPotensi) {
    const filterContainer = document.getElementById("potensi-filter-bar");
    if (!filterContainer) return;

    const categories = ["Semua", ...new Set(listPotensi.map(item => item.kategori).filter(Boolean))];

    filterContainer.innerHTML = categories.map(cat => {
        const isActive = cat === activePotensiCategory;
        const btnClass = isActive
            ? "bg-bps-blue text-white shadow-xs border-bps-blue font-bold"
            : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200/80 font-medium";

        return `
            <button onclick="filterPotensi('${cat}')" 
                    class="px-3 py-1 rounded-xl text-xs border transition-all duration-200 flex-shrink-0 ${btnClass}">
                ${cat}
            </button>
        `;
    }).join('');
}

window.filterPotensi = function(category) {
    activePotensiCategory = category;
    renderPotensiFilterBar(cachedPotensi);

    if (category === "Semua") {
        renderPotensiDesa(cachedPotensi);
    } else {
        const filtered = cachedPotensi.filter(item => item.kategori === category);
        renderPotensiDesa(filtered);
    }
};

/**
 * 3B. Render Potensi Cards
 */
function renderPotensiDesa(listPotensi) {
    const container = document.getElementById("potensi-grid");
    if (!container) return;

    if (!listPotensi || listPotensi.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-10 text-center text-slate-400 w-full">
                <i class="fa-solid fa-gem text-2xl mb-1 text-slate-300"></i>
                <p class="text-xs">Belum ada potensi desa dalam kategori ini.</p>
            </div>
        `;
        return;
    }

    const placeholderImg = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80";

    container.innerHTML = listPotensi.map((item, index) => {
        const fotoUrl = item.urlFoto && item.urlFoto.trim() !== "" ? item.urlFoto : placeholderImg;
        const isFeatured = (activePotensiCategory === "Semua" && index === 0);

        if (isFeatured) {
            return `
                <div onclick="openPotensiModal(${item.id})" 
                     class="group cursor-pointer relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-card-hover border border-slate-200/90 min-h-[250px] sm:h-96 md:h-[380px] flex flex-col justify-end p-5 sm:p-8 bg-slate-950 text-white lg:col-span-2 transition-all duration-300 w-full">
                    <img src="${fotoUrl}" 
                         alt="${item.judulPotensi}" 
                         class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-75"
                         onerror="this.src='${placeholderImg}'">
                    
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>

                    <div class="relative z-10 space-y-2 sm:space-y-3">
                        <div class="flex items-center gap-2">
                            <span class="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-extrabold bg-amber-400 text-slate-950 shadow-xs">
                                ⭐ POTENSI UNGGULAN
                            </span>
                            <span class="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/20">
                                ${item.kategori}
                            </span>
                        </div>
                        <h4 class="text-base sm:text-2xl font-extrabold text-white leading-tight group-hover:text-amber-300 transition-colors">
                            ${item.judulPotensi}
                        </h4>
                        <p class="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
                            ${item.deskripsi || '-'}
                        </p>
                        <div class="pt-2 flex items-center gap-1.5 text-xs font-bold text-amber-300">
                            <span>Lihat Penjelasan Lengkap</span>
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

                    <span class="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold bg-white/90 backdrop-blur-md text-slate-900 shadow-xs">
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
}

/**
 * 3C. Function Open & Close Modal Detail Potensi
 */
function openPotensiModal(id) {
    const item = cachedPotensi.find(p => p.id === id);
    if (!item) return;

    const modal = document.getElementById("potensi-modal");
    const modalContent = document.getElementById("potensi-modal-content");
    if (!modal || !modalContent) return;

    const placeholderImg = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80";
    const fotoUrl = item.urlFoto && item.urlFoto.trim() !== "" ? item.urlFoto : placeholderImg;

    modalContent.innerHTML = `
        <div class="relative">
            <img src="${fotoUrl}" alt="${item.judulPotensi}" class="w-full h-48 sm:h-64 object-cover">
            <button onclick="closePotensiModal()" 
                    class="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-950/70 text-white flex items-center justify-center hover:bg-slate-950 transition-colors">
                <i class="fa-solid fa-xmark text-sm"></i>
            </button>
            <span class="absolute bottom-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-bps-blue text-white shadow-md">
                ${item.kategori}
            </span>
        </div>
        <div class="p-5 sm:p-6 space-y-3">
            <h3 class="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
                ${item.judulPotensi}
            </h3>
            <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
                ${item.deskripsi || 'Belum ada penjelasan detail untuk potensi ini.'}
            </p>
            <div class="pt-3 border-t border-slate-100 flex justify-end">
                <button onclick="closePotensiModal()" 
                        class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
                    Tutup Penjelasan
                </button>
            </div>
        </div>
    `;

    modal.classList.remove("hidden");
    modal.classList.add("flex");
    setTimeout(() => {
        modalContent.classList.remove("scale-95", "opacity-0");
        modalContent.classList.add("scale-100", "opacity-100");
    }, 10);
}

function closePotensiModal() {
    const modal = document.getElementById("potensi-modal");
    const modalContent = document.getElementById("potensi-modal-content");
    if (!modal || !modalContent) return;

    modalContent.classList.remove("scale-100", "opacity-100");
    modalContent.classList.add("scale-95", "opacity-0");
    setTimeout(() => {
        modal.classList.remove("flex");
        modal.classList.add("hidden");
    }, 200);
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
        beforeDraw: function(chart) {
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
                        label: function(context) {
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
 * 5. Render Dokumen Publikasi Desa & Filter Kategori
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

    if (category === "Semua") {
        renderDokumenPublikasi(cachedDokumen);
    } else {
        const filtered = cachedDokumen.filter(doc => {
            const kat = (doc.kategori || "").toLowerCase();
            if (category === "Publikasi BPS") return kat.includes("bps");
            if (category === "Profil Wilayah") return kat.includes("profil") || kat.includes("monografi");
            if (category === "Perdes") return kat.includes("peraturan") || kat.includes("perdes");
            return kat.includes(category.toLowerCase());
        });
        renderDokumenPublikasi(filtered);
    }
}

function renderDokumenPublikasi(listDokumen) {
    const tbody = document.getElementById("document-table-body");
    const mobileContainer = document.getElementById("document-mobile-cards");

    if (!listDokumen || listDokumen.length === 0) {
        const emptyStateHTML = `
            <div class="py-10 text-center text-slate-400 col-span-full w-full">
                <i class="fa-solid fa-folder-open text-3xl mb-2 text-slate-300"></i>
                <p class="text-xs">Tidak ada dokumen publikasi yang cocok dengan kriteria.</p>
            </div>
        `;
        if (tbody) tbody.innerHTML = `<tr><td colspan="5">${emptyStateHTML}</td></tr>`;
        if (mobileContainer) mobileContainer.innerHTML = emptyStateHTML;
        return;
    }

    if (tbody) {
        tbody.innerHTML = listDokumen.map((doc) => {
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
        mobileContainer.innerHTML = listDokumen.map((doc) => {
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
}

/**
 * Setup Listener Pencarian Dokumen secara Realtime
 */
function setupSearchListener() {
    const searchInput = document.getElementById("document-search");
    if (!searchInput) return;

    searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (!query) {
            renderDokumenPublikasi(cachedDokumen);
            return;
        }

        const filtered = cachedDokumen.filter(doc => 
            doc.judul.toLowerCase().includes(query) ||
            doc.kategori.toLowerCase().includes(query) ||
            (doc.deskripsi && doc.deskripsi.toLowerCase().includes(query)) ||
            doc.tahun.toString().includes(query)
        );

        renderDokumenPublikasi(filtered);
    });
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
