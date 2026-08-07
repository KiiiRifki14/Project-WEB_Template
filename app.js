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

/**
 * Inisialisasi Aplikasi saat DOM selesai dimuat
 */
document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 Initializing Micro-Portal Desa Cantik BPS Subang...");
    loadData();
    setupSearchListener();
});

/**
 * Memuat Data secara Asynchronous (Mendukung File Lokal & API SheetDB Multi-Tab)
 */
async function loadData() {
    try {
        let data = {};

        // Cek apakah menggunakan API SheetDB (mengandung domain sheetdb.io)
        if (CONFIG.DATA_URL.includes("sheetdb.io")) {
            console.log("📡 Mengambil data dinamis dari Google Sheets via SheetDB API...");
            
            // Melakukan fetch paralel untuk 4 sheet/tab berbeda di Google Sheets
            const [resIdentitas, resMakro, resJobs, resDocs] = await Promise.all([
                fetch(`${CONFIG.DATA_URL}`), // default tab (identitas)
                fetch(`${CONFIG.DATA_URL}?sheet=statistikMakro`),
                fetch(`${CONFIG.DATA_URL}?sheet=mataPencaharian`),
                fetch(`${CONFIG.DATA_URL}?sheet=dokumenPublikasi`)
            ]);

            // Cek status HTTP respon
            if (!resIdentitas.ok || !resMakro.ok || !resJobs.ok || !resDocs.ok) {
                throw new Error("Gagal mengambil satu atau lebih tab data dari Google Sheets API.");
            }

            const identitasArr = await resIdentitas.json();
            const makroArr = await resMakro.json();
            const jobsArr = await resJobs.json();
            const docsArr = await resDocs.json();

            // Transformasi array respons SheetDB ke format terstruktur
            data.identitas = identitasArr[0] || {};
            data.statistikMakro = makroArr[0] || {};
            
            // Konversi tipe data string dari API SheetDB menjadi Number
            if (data.statistikMakro) {
                data.statistikMakro.totalPenduduk = Number(data.statistikMakro.totalPenduduk) || null;
                data.statistikMakro.luasWilayah = Number(data.statistikMakro.luasWilayah) || null;
                data.statistikMakro.kepadatanPenduduk = Number(data.statistikMakro.kepadatanPenduduk) || null;
                data.statistikMakro.jumlahRt = Number(data.statistikMakro.jumlahRt) || null;
                data.statistikMakro.jumlahRw = Number(data.statistikMakro.jumlahRw) || null;
                data.statistikMakro.jumlahKk = Number(data.statistikMakro.jumlahKk) || null;
            }

            data.mataPencaharian = jobsArr.map(item => ({
                kategori: item.kategori,
                jumlah: Number(item.jumlah) || 0,
                persentase: Number(item.persentase) || null
            }));

            data.dokumenPublikasi = docsArr.map(item => ({
                id: Number(item.id) || 0,
                judul: item.judul || "-",
                kategori: item.kategori || "-",
                tahun: Number(item.tahun) || 0,
                ukuran: item.ukuran || "-",
                deskripsi: item.deskripsi || "-",
                urlDrive: item.urlDrive || "#"
            }));

        } else {
            // Fetch dari data.json lokal biasa
            console.log("📂 Mengambil data dari file JSON lokal...");
            const response = await fetch(CONFIG.DATA_URL);
            if (!response.ok) {
                throw new Error(`Gagal memuat file JSON lokal. Status HTTP: ${response.status}`);
            }
            data = await response.json();
        }

        console.log("✅ Data Berhasil Diproses:", data);

        // Render seluruh komponen
        if (data.identitas) renderIdentitas(data.identitas);
        if (data.statistikMakro) renderStatCards(data.statistikMakro);
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
 * 1. Render Identitas Desa pada Header, Hero, dan Footer
 */
function renderIdentitas(identitas) {
    // Penanganan fallback nilai jika string kosong ("") dari Google Sheets
    const namaDesa = identitas.namaDesa || CONFIG.NAMA_DESA;
    const kecamatan = identitas.kecamatan || CONFIG.KECAMATAN;
    const kabupaten = identitas.kabupaten || CONFIG.KABUPATEN;
    
    // Penanganan fallback typo kolom yang sering diinput operator
    const alamat = identitas.alamatKantor || identitas.alamatKanttor || "-";
    const email = identitas.email || "-";
    const telepon = identitas.telepon || identitas.telpon || "-";

    const tagVillage = document.getElementById("header-village-tag");
    const heroVillage = document.getElementById("hero-village-name");
    const heroDesc = document.getElementById("hero-description");
    const heroDistrict = document.getElementById("hero-district");
    const heroCode = document.getElementById("hero-code");

    if (tagVillage) tagVillage.textContent = `Desa ${namaDesa}`;
    if (heroVillage) heroVillage.textContent = `Desa ${namaDesa}`;
    if (heroDesc && identitas.deskripsi) heroDesc.textContent = identitas.deskripsi;
    if (heroDistrict) heroDistrict.textContent = `${kecamatan}, ${kabupaten}`;
    if (heroCode) heroCode.textContent = identitas.kodeDesa || "-";

    // Footer Info
    const footerDesc = document.getElementById("footer-village-desc");
    const footerAddress = document.getElementById("footer-address");
    const footerEmail = document.getElementById("footer-email");
    const footerPhone = document.getElementById("footer-phone");

    if (footerDesc) footerDesc.textContent = `Portal data statistik terpadu Desa ${namaDesa}, ${kecamatan}. Program Desa Cinta Statistik BPS Kabupaten Subang.`;
    if (footerAddress) footerAddress.textContent = alamat;
    if (footerEmail) footerEmail.textContent = email;
    if (footerPhone) footerPhone.textContent = telepon;
}

/**
 * 2. Render Angka pada 4 Stat Cards Utama (Data Makro)
 */
function renderStatCards(makro) {
    const elPenduduk = document.getElementById("stat-penduduk");
    const elLuas = document.getElementById("stat-luas");
    const elKepadatan = document.getElementById("stat-kepadatan");
    const elRtRw = document.getElementById("stat-rtrw");
    const elKkText = document.getElementById("stat-kk-text");

    if (elPenduduk) elPenduduk.textContent = formatRibuan(makro.totalPenduduk);
    if (elLuas) elLuas.textContent = formatDesimal(makro.luasWilayah);
    if (elKepadatan) elKepadatan.textContent = formatRibuan(makro.kepadatanPenduduk);
    if (elRtRw) {
        const rt = makro.jumlahRt !== null ? makro.jumlahRt : "-";
        const rw = makro.jumlahRw !== null ? makro.jumlahRw : "-";
        elRtRw.textContent = `${rt} / ${rw}`;
    }
    if (elKkText) {
        elKkText.textContent = makro.jumlahKk ? `${formatRibuan(makro.jumlahKk)} Kepala Keluarga` : "Data KK Belum Terisi";
    }
}

/**
 * 3. Render Visualisasi Grafik Chart.js & Progress Bar Breakdown
 */
function renderJobChart(listPekerjaan) {
    const ctx = document.getElementById("jobChart");
    const legendContainer = document.getElementById("job-legend-list");

    if (!ctx || !listPekerjaan || listPekerjaan.length === 0) return;

    // Hitung Total Penduduk Bekerja
    const totalPekerja = listPekerjaan.reduce((acc, curr) => acc + (curr.jumlah || 0), 0);

    const labels = listPekerjaan.map(item => item.kategori);
    const dataValues = listPekerjaan.map(item => item.jumlah);
    const backgroundColors = CONFIG.CHART_COLORS.slice(0, listPekerjaan.length);

    // Destroy instance lama jika reload
    if (jobChartInstance) {
        jobChartInstance.destroy();
    }

    // Custom Plugin Center Text di Donut Chart
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
            const textY = height / 2 - 8;
            ctx.fillText(text, textX, textY);

            ctx.font = `500 ${fontSize * 0.45}em "Plus Jakarta Sans", sans-serif`;
            ctx.fillStyle = "#64748b";
            const subText = "Tenaga Kerja";
            const subTextX = Math.round((width - ctx.measureText(subText).width) / 2);
            const subTextY = height / 2 + 12;
            ctx.fillText(subText, subTextX, subTextY);

            ctx.save();
        }
    };

    // Inisialisasi Chart.js
    jobChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: backgroundColors,
                borderWidth: 3,
                borderColor: '#ffffff',
                hoverOffset: 6
            }]
        },
        plugins: [centerTextPlugin],
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
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

    // Render Breakdown Legend dengan Progress Bar Modern
    if (legendContainer) {
        legendContainer.innerHTML = listPekerjaan.map((item, index) => {
            const color = backgroundColors[index % backgroundColors.length];
            const pct = item.persentase !== null && item.persentase !== undefined
                ? item.persentase 
                : (totalPekerja > 0 ? ((item.jumlah / totalPekerja) * 100).toFixed(1) : 0);

            return `
                <div class="p-3 sm:p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:bg-white hover:shadow-sm transition-all duration-200">
                    <div class="flex items-center justify-between gap-2 mb-1.5">
                        <div class="flex items-center gap-2">
                            <span class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: ${color}"></span>
                            <span class="text-xs font-bold text-slate-800">${item.kategori}</span>
                        </div>
                        <div class="text-right">
                            <span class="text-xs font-extrabold text-slate-900">${formatRibuan(item.jumlah)} <span class="text-[10px] font-normal text-slate-500">jiwa</span></span>
                            <span class="ml-1 text-[11px] font-semibold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">${pct}%</span>
                        </div>
                    </div>

                    <!-- Visual Progress Bar -->
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
 * 4. Render Dokumen Publikasi Desa (Dual Mobile Card & Desktop Table)
 */
function renderDokumenPublikasi(listDokumen) {
    const tbody = document.getElementById("document-table-body");
    const mobileContainer = document.getElementById("document-mobile-cards");

    if (!listDokumen || listDokumen.length === 0) {
        const emptyStateHTML = `
            <div class="py-10 text-center text-slate-400 col-span-full w-full">
                <i class="fa-solid fa-folder-open text-3xl mb-2 text-slate-300"></i>
                <p class="text-xs">Tidak ada dokumen publikasi yang cocok dengan pencarian.</p>
            </div>
        `;
        if (tbody) tbody.innerHTML = `<tr><td colspan="5">${emptyStateHTML}</td></tr>`;
        if (mobileContainer) mobileContainer.innerHTML = emptyStateHTML;
        return;
    }

    // A. Render Desktop Table View (>= sm breakpoint)
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
                            <span>Buka</span>
                            <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                        </a>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // B. Render Mobile Card View (< sm breakpoint)
    if (mobileContainer) {
        mobileContainer.innerHTML = listDokumen.map((doc) => {
            const badgeStyle = getCategoryBadgeStyle(doc.kategori);

            return `
                <div class="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
                    <div class="flex items-start justify-between gap-3">
                        <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                                <i class="fa-solid fa-file-pdf text-sm"></i>
                            </div>
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${badgeStyle}">
                                ${doc.kategori}
                            </span>
                        </div>
                        <span class="text-[10px] text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded">
                            ${doc.tahun}
                        </span>
                    </div>

                    <div>
                        <h4 class="text-xs font-bold text-slate-900 leading-snug">${doc.judul}</h4>
                        <p class="text-[11px] text-slate-500 mt-1 leading-relaxed">${doc.deskripsi || '-'}</p>
                    </div>

                    <div class="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span class="text-[10px] text-slate-400 font-mono">
                            <i class="fa-solid fa-hard-drive mr-1"></i>${doc.ukuran || '-'}
                        </span>
                        <a href="${doc.urlDrive || '#'}" 
                           target="_blank" 
                           rel="noopener noreferrer" 
                           class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-bps-blue bg-blue-50 hover:bg-bps-blue hover:text-white border border-blue-200 transition-all">
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
 * Helper Warna Badge Kategori
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
 * Utility Helper: Format Ribuan (misal 5420 -> 5.420)
 */
function formatRibuan(num) {
    if (num === null || num === undefined || isNaN(num)) return "-";
    return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Utility Helper: Format Desimal (misal 14.85 -> 14,85)
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
                <span class="block text-[11px] text-rose-500 mt-1">Pastikan spreadsheet publik (Anyone with link can view) dan nama tab (identitas, statistikMakro, mataPencaharian, dokumenPublikasi) sudah benar.</span>
            </div>
        `;
        container.prepend(errorDiv);
    }
}
