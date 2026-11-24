import React, { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import Sidebar from '../Components/Sidebar';
import Pagination from '../Components/Pagination';
import NoticeBanner from '../Components/NoticeBanner.jsx';
import {
    Package,
    ArrowDownLeft,
    ArrowUpRight,
    FileSpreadsheet,
    ChevronDown,
    Search,
    X,
    ClipboardList,
    ShieldCheck,
    Calendar,
    UserCheck
} from 'lucide-react';

export default function KartuStok({
    barangList = [],
    selectedBarang = null,
    metrics = {},
    ledger = [],
    filters = {}
}) {
    const rawLedger = Array.isArray(ledger) ? ledger : (ledger?.data || []);
    const [skuDropdownOpen, setSkuDropdownOpen] = useState(false);
    const [skuSearchInput, setSkuSearchInput] = useState('');
    const [tableSearch, setTableSearch] = useState(filters?.q || '');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredOptions = useMemo(() => {
        const q = (skuSearchInput || '').toLowerCase();
        return barangList.filter(b =>
            (b.kode_barang && b.kode_barang.toLowerCase().includes(q)) ||
            (b.nama_barang && b.nama_barang.toLowerCase().includes(q)) ||
            (b.divisi && b.divisi.toLowerCase().includes(q))
        );
    }, [barangList, skuSearchInput]);

    // Ganti SKU Terpilih
    const handleSelectBarang = (id) => {
        router.get('/kartu-stok', { id_barang: id }, { preserveState: true, preserveScroll: true });
        setSkuDropdownOpen(false);
        setSkuSearchInput('');
        setCurrentPage(1);
    };

    // EKSPOR EXCEL HTML LEGA, RAPI & BEBAS DEMPET
    const handleExportExcelLedger = () => {
        if (!selectedBarang) {
            alert('Silakan pilih material SKU terlebih dahulu!');
            return;
        }

        const tglHariIni = new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        const rowsToExport = [...rawLedger].reverse();

        let tableRowsHtml = '';
        rowsToExport.forEach((row, idx) => {
            const isInbound = row.tipe === 'inbound';
            const bgZebra = idx % 2 === 1 ? '#f8fafc' : '#ffffff';
            const badgeBg = isInbound ? '#dcfce7' : '#fee2e2';
            const badgeColor = isInbound ? '#15803d' : '#b91c1c';
            const qtyColor = isInbound ? '#047857' : '#dc2626';

            tableRowsHtml += `
                <tr style="background-color: ${bgZebra};">
                    <td style="border: 0.5pt solid #cbd5e1; text-align: center; vertical-align: middle; padding: 10px 6px; font-size: 9.5pt; color: #475569;">${idx + 1}</td>
                    <td style="border: 0.5pt solid #cbd5e1; text-align: center; vertical-align: middle; padding: 10px 8px; font-size: 9.5pt; mso-number-format:'\\@'; white-space: nowrap;">${row.tanggal || '-'}</td>
                    <td style="border: 0.5pt solid #cbd5e1; text-align: center; vertical-align: middle; padding: 10px 8px; font-size: 9pt; mso-number-format:'\\@'; white-space: nowrap; color: #64748b;">${row.jam || '-'}</td>
                    <td style="border: 0.5pt solid #cbd5e1; text-align: center; vertical-align: middle; padding: 10px 8px; background-color: ${badgeBg}; color: ${badgeColor}; font-weight: bold; font-size: 9pt;">
                        ${isInbound ? 'INBOUND' : 'OUTBOUND'}
                    </td>
                    <td style="border: 0.5pt solid #cbd5e1; text-align: left; vertical-align: middle; padding: 10px 12px; font-size: 9.5pt; line-height: 1.4; mso-number-format:'\\@';">${row.no_dokumen || '-'}</td>
                    <td style="border: 0.5pt solid #cbd5e1; text-align: left; vertical-align: middle; padding: 10px 12px; font-size: 9.5pt; line-height: 1.4; mso-number-format:'\\@';">${row.petugas || '-'}</td>
                    <td style="border: 0.5pt solid #cbd5e1; text-align: left; vertical-align: middle; padding: 10px 12px; font-size: 9.5pt; line-height: 1.4; mso-number-format:'\\@';">${row.pihak_kedua || '-'}</td>
                    <td style="border: 0.5pt solid #cbd5e1; text-align: left; vertical-align: middle; padding: 10px 12px; font-size: 9.5pt; line-height: 1.4; mso-number-format:'\\@';">${row.lokasi || '-'}</td>
                    <td style="border: 0.5pt solid #cbd5e1; text-align: center; vertical-align: middle; padding: 10px 6px; font-size: 10pt; font-weight: ${isInbound ? 'bold' : 'normal'}; color: ${isInbound ? qtyColor : '#94a3b8'};">
                        ${row.masuk > 0 ? `+${row.masuk}` : '0'}
                    </td>
                    <td style="border: 0.5pt solid #cbd5e1; text-align: center; vertical-align: middle; padding: 10px 6px; font-size: 10pt; font-weight: ${!isInbound ? 'bold' : 'normal'}; color: ${!isInbound ? qtyColor : '#94a3b8'};">
                        ${row.keluar > 0 ? `-${row.keluar}` : '0'}
                    </td>
                    <td style="border: 0.5pt solid #cbd5e1; text-align: center; vertical-align: middle; padding: 10px 6px; font-weight: bold; font-size: 10pt; color: #064e3b; background-color: ${isInbound ? '#f0fdf4' : '#fff5f5'};">
                        ${row.saldo_berjalan ?? 0}
                    </td>
                    <td style="border: 0.5pt solid #cbd5e1; text-align: left; vertical-align: middle; padding: 10px 12px; font-size: 9.5pt; line-height: 1.4; mso-number-format:'\\@';">${row.catatan || '-'}</td>
                </tr>
            `;
        });

        const excelTemplate = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
                <!--[if gte mso 9]>
                <xml>
                    <x:ExcelWorkbook>
                        <x:ExcelWorksheets>
                            <x:ExcelWorksheet>
                                <x:Name>Kartu Stok</x:Name>
                                <x:WorksheetOptions>
                                    <x:DisplayGridlines/>
                                </x:WorksheetOptions>
                            </x:ExcelWorksheet>
                        </x:ExcelWorksheets>
                    </x:ExcelWorkbook>
                </xml>
                <![endif]-->
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; }
                    table { border-collapse: collapse; }
                </style>
            </head>
            <body>
                <table style="border-collapse: collapse; width: 100%;">
                    <colgroup>
                        <col width="50" style="width: 38pt;" />
                        <col width="115" style="width: 86pt;" />
                        <col width="90" style="width: 68pt;" />
                        <col width="115" style="width: 86pt;" />
                        <col width="230" style="width: 172pt;" />
                        <col width="190" style="width: 142pt;" />
                        <col width="200" style="width: 150pt;" />
                        <col width="190" style="width: 142pt;" />
                        <col width="110" style="width: 82pt;" />
                        <col width="110" style="width: 82pt;" />
                        <col width="130" style="width: 98pt;" />
                        <col width="260" style="width: 195pt;" />
                    </colgroup>

                    <tr>
                        <td colspan="12" style="font-size: 14pt; font-weight: bold; color: #064e3b; padding: 6px 0;">
                            BUKU BESAR KARTU STOK SKU FISIK &amp; MUTASI MATERIAL
                        </td>
                    </tr>
                    <tr>
                        <td colspan="12" style="font-size: 11pt; font-weight: bold; color: #047857; padding: 3px 0;">
                            [${selectedBarang.kode_barang}] ${selectedBarang.nama_barang}
                        </td>
                    </tr>
                    <tr>
                        <td colspan="12" style="font-size: 9pt; color: #64748b; padding-bottom: 14px; font-style: italic;">
                            Divisi: ${selectedBarang.divisi || '-'} | Rak: ${selectedBarang.remarks || '-'} | Distrik: ${selectedBarang.distrik || '-'} | Vendor: ${selectedBarang.asal_material || '-'} | Tanggal Ekspor: ${tglHariIni}
                        </td>
                    </tr>
                    <tr style="height: 12px;"><td colspan="12"></td></tr>
                    <thead>
                        <tr style="background-color: #047857; color: #ffffff; height: 42px;">
                            <th style="border: 0.5pt solid #065f46; text-align: center; vertical-align: middle; padding: 8px; font-size: 9.5pt;">No</th>
                            <th style="border: 0.5pt solid #065f46; text-align: center; vertical-align: middle; padding: 8px; font-size: 9.5pt;">Tanggal</th>
                            <th style="border: 0.5pt solid #065f46; text-align: center; vertical-align: middle; padding: 8px; font-size: 9.5pt;">Jam WIB</th>
                            <th style="border: 0.5pt solid #065f46; text-align: center; vertical-align: middle; padding: 8px; font-size: 9.5pt;">Jenis Mutasi</th>
                            <th style="border: 0.5pt solid #065f46; text-align: center; vertical-align: middle; padding: 8px; font-size: 9.5pt;">No. Dokumen / Referensi</th>
                            <th style="border: 0.5pt solid #065f46; text-align: center; vertical-align: middle; padding: 8px; font-size: 9.5pt;">Petugas Operasional</th>
                            <th style="border: 0.5pt solid #065f46; text-align: center; vertical-align: middle; padding: 8px; font-size: 9.5pt;">Pihak Terkait (Vendor/Mandor)</th>
                            <th style="border: 0.5pt solid #065f46; text-align: center; vertical-align: middle; padding: 8px; font-size: 9.5pt;">Lokasi / Sektor Proyek</th>
                            <th style="border: 0.5pt solid #065f46; text-align: center; vertical-align: middle; padding: 8px; font-size: 9.5pt;">Mutasi Masuk (+)</th>
                            <th style="border: 0.5pt solid #065f46; text-align: center; vertical-align: middle; padding: 8px; font-size: 9.5pt;">Mutasi Keluar (-)</th>
                            <th style="border: 0.5pt solid #065f46; text-align: center; vertical-align: middle; padding: 8px; font-size: 9.5pt;">Saldo Berjalan (${selectedBarang.unit || 'Unit'})</th>
                            <th style="border: 0.5pt solid #065f46; text-align: center; vertical-align: middle; padding: 8px; font-size: 9.5pt;">Keterangan</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRowsHtml}
                    </tbody>
                    <tfoot>
                        <tr style="background-color: #ecfdf5; font-weight: bold; height: 38px;">
                            <td colspan="8" style="border: 0.5pt solid #059669; text-align: right; vertical-align: middle; padding: 8px 14px; font-size: 9.5pt; color: #064e3b;">
                                TOTAL AKUMULASI FISIK:
                            </td>
                            <td style="border: 0.5pt solid #059669; text-align: center; vertical-align: middle; padding: 8px; font-size: 10.5pt; color: #047857;">
                                +${metrics.total_masuk || 0}
                            </td>
                            <td style="border: 0.5pt solid #059669; text-align: center; vertical-align: middle; padding: 8px; font-size: 10.5pt; color: #dc2626;">
                                -${metrics.total_keluar || 0}
                            </td>
                            <td style="border: 0.5pt solid #059669; text-align: center; vertical-align: middle; padding: 8px; font-size: 10.5pt; color: #064e3b; background-color: #d1fae5;">
                                ${metrics.saldo_akhir ?? 0} ${selectedBarang.unit || 'Unit'}
                            </td>
                            <td style="border: 0.5pt solid #059669; text-align: left; vertical-align: middle; padding: 8px 12px; font-size: 9pt; color: #047857;">
                                Saldo Fisik Terkini
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </body>
            </html>
        `;

        const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Kartu_Stok_${selectedBarang.kode_barang}_${new Date().toISOString().slice(0, 10)}.xls`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Filter Pencarian di Tabel
    const filteredLedger = useMemo(() => {
        const q = (tableSearch || '').toLowerCase().trim();
        if (!q) return rawLedger;
        return rawLedger.filter(item =>
            (item.tanggal || '').toLowerCase().includes(q) ||
            (item.no_dokumen || '').toLowerCase().includes(q) ||
            (item.petugas || '').toLowerCase().includes(q) ||
            (item.pihak_kedua || '').toLowerCase().includes(q) ||
            (item.lokasi || '').toLowerCase().includes(q) ||
            (item.catatan || '').toLowerCase().includes(q)
        );
    }, [rawLedger, tableSearch]);

    const paginatedItems = filteredLedger.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const thStyle = {
        backgroundColor: '#f8fafc',
        color: '#475569',
        fontSize: '0.68rem',
        fontWeight: '800',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        padding: '12px 16px',
        borderBottom: '1px solid #e2e8f0',
        whiteSpace: 'nowrap'
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <Sidebar active="kartu-stok" />

            <main style={{ flex: 1, padding: '28px 36px', overflowY: 'auto' }}>

                {/* Header Menu Atas */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h4 style={{ fontWeight: '800', color: '#0f172a', margin: 0, fontSize: '1.28rem', letterSpacing: '-0.3px' }}>
                            Buku Besar Kartu Stok Material
                        </h4>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                            Pencatatan kronologis mutasi material, penanggung jawab serah terima, dan saldo fisik berjalan
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                            type="button"
                            onClick={handleExportExcelLedger}
                            className="btn btn-sm"
                            style={{
                                background: '#059669',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.76rem',
                                fontWeight: '700',
                                padding: '8px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
                                cursor: 'pointer'
                            }}
                        >
                            <FileSpreadsheet size={15} color="#ffffff" />
                            <span>Export Excel (.xls)</span>
                        </button>
                    </div>
                </div>

                {/* Banner Panduan */}
                <NoticeBanner
                    title="Petunjuk Operasional Buku Besar Kartu Stok"
                    description="Seluruh pergerakan barang diverifikasi berdasarkan dokumen fisik dan saldo aktual:"
                    icon={ClipboardList}
                    items={[
                        {
                            title: 'Daur Hidup SKU',
                            desc: 'Mengetahui waktu dan tanggal pertama kali material ini didaftarkan ke sistem inventaris gudang.',
                            icon: Calendar
                        },
                        {
                            title: 'Akuntabilitas Petugas',
                            desc: 'Mencatat nama Checker penerima vendor, Picker gudang, dan Mandor proyek pengambil material.',
                            icon: UserCheck
                        },
                        {
                            title: 'Saldo Berjalan Akurat',
                            desc: 'Mencegah selisih barang saat stock opname dengan rekapitulasi mutasi debit/kredit bertingkat.',
                            icon: ShieldCheck
                        }
                    ]}
                />

                {/* PANEL PEMILIH MATERIAL SKU */}
                <div style={{
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
                    border: '1.5px solid #86efac',
                    borderLeft: '5px solid #059669',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    marginBottom: '20px',
                    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                        <div
                            onClick={() => setSkuDropdownOpen(true)}
                            style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', padding: '2px', borderRadius: '8px' }}
                            title="Klik untuk memilih material lain"
                        >
                            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#059669', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 6px rgba(5, 150, 105, 0.28)' }}>
                                <Package size={22} strokeWidth={2.4} />
                            </div>

                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '0.66rem', fontWeight: '800', color: '#065f46', background: '#d1fae5', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        Material Sedang Diinspeksi
                                    </span>
                                    <span style={{ fontSize: '0.74rem', fontWeight: '800', color: '#064e3b', background: '#ffffff', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '5px' }}>
                                        {selectedBarang?.kode_barang || 'PILIH SKU'}
                                    </span>
                                </div>
                                <div style={{ fontSize: '1.08rem', fontWeight: '800', color: '#0f172a', marginTop: '3px' }}>
                                    {selectedBarang?.nama_barang || 'Silakan Pilih Material SKU'}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontWeight: '600' }}>
                                    <span>Divisi: <strong style={{ color: '#0f172a' }}>{selectedBarang?.divisi || '-'}</strong></span>
                                    <span>•</span>
                                    <span>Sisa Fisik: <strong style={{ color: '#059669', fontWeight: '800' }}>{selectedBarang?.stok} {selectedBarang?.unit}</strong></span>
                                    <span>•</span>
                                    <span>Rak: <strong style={{ color: '#0f172a' }}>{selectedBarang?.remarks || '-'}</strong></span>
                                </div>
                            </div>
                        </div>

                        {/* Tombol Dropdown SKU */}
                        <div style={{ position: 'relative' }}>
                            <button
                                type="button"
                                onClick={() => setSkuDropdownOpen(!skuDropdownOpen)}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    background: '#059669',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '9px',
                                    padding: '10px 18px',
                                    cursor: 'pointer',
                                    fontWeight: '700',
                                    fontSize: '0.78rem',
                                    boxShadow: '0 3px 10px rgba(5, 150, 105, 0.25)',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                <Search size={14} color="#ffffff" strokeWidth={2.5} />
                                <span>Cari & Ganti SKU</span>
                                <ChevronDown size={15} color="#ffffff" style={{ transform: skuDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                            </button>

                            {skuDropdownOpen && (
                                <>
                                    <div onClick={() => setSkuDropdownOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 60 }} />
                                    <div style={{
                                        position: 'absolute',
                                        top: 'calc(100% + 8px)',
                                        right: 0,
                                        background: '#ffffff',
                                        border: '1.5px solid #a7f3d0',
                                        borderRadius: '12px',
                                        padding: '10px',
                                        width: '420px',
                                        maxHeight: '320px',
                                        overflowY: 'auto',
                                        boxShadow: '0 16px 36px rgba(15, 23, 42, 0.15)',
                                        zIndex: 70
                                    }}>
                                        <div style={{ padding: '2px', marginBottom: '8px' }}>
                                            <input
                                                type="text"
                                                value={skuSearchInput}
                                                onChange={e => setSkuSearchInput(e.target.value)}
                                                placeholder="Ketik kode part number atau nama barang..."
                                                className="form-control form-control-sm"
                                                style={{ fontSize: '0.77rem', borderRadius: '7px', borderColor: '#cbd5e1' }}
                                                autoFocus
                                            />
                                        </div>

                                        <div style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', padding: '4px 6px', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Daftar Material Gudang:</span>
                                            <span>{filteredOptions.length} Item</span>
                                        </div>

                                        {filteredOptions.length > 0 ? (
                                            filteredOptions.map((b) => {
                                                const isSelected = String(b.id_barang) === String(selectedBarang?.id_barang);
                                                return (
                                                    <div
                                                        key={b.id_barang}
                                                        onClick={() => handleSelectBarang(b.id_barang)}
                                                        style={{
                                                            padding: '9px 12px',
                                                            borderRadius: '7px',
                                                            cursor: 'pointer',
                                                            background: isSelected ? '#ecfdf5' : 'transparent',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            marginBottom: '2px'
                                                        }}
                                                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                                                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                                                    >
                                                        <div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#0f172a' }}>
                                                                    [{b.kode_barang}]
                                                                </span>
                                                                <span style={{ fontSize: '0.77rem', fontWeight: isSelected ? '800' : '600', color: '#334155' }}>
                                                                    {b.nama_barang}
                                                                </span>
                                                            </div>
                                                            <div style={{ fontSize: '0.67rem', color: '#64748b', marginTop: '2px' }}>
                                                                Divisi {b.divisi}
                                                            </div>
                                                        </div>

                                                        <div style={{ textAlign: 'right' }}>
                                                            <span style={{ fontSize: '0.74rem', fontWeight: '800', color: '#059669' }}>
                                                                {b.stok} {b.unit}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div style={{ padding: '16px', fontSize: '0.74rem', color: '#94a3b8', textAlign: 'center' }}>
                                                Tidak ditemukan material "{skuSearchInput}".
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Empat Kartu Metrik Ringkas */}
                {selectedBarang ? (
                    <div className="row g-3 mb-4">
                        <div className="col-md-3">
                            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 16px' }}>
                                <div style={{ fontSize: '0.66rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Waktu Registrasi</div>
                                <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#0f172a', margin: '4px 0 2px' }}>{metrics.tgl_dibuat || 'Terdata di Awal'}</div>
                                <div style={{ fontSize: '0.66rem', color: '#64748b' }}>Master SKU Aktif</div>
                            </div>
                        </div>

                        <div className="col-md-3">
                            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 16px' }}>
                                <div style={{ fontSize: '0.66rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Total Mutasi Masuk</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#047857', margin: '4px 0 2px' }}>
                                    +{metrics.total_masuk || 0} <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{selectedBarang.unit}</span>
                                </div>
                                <div style={{ fontSize: '0.66rem', color: '#64748b' }}>Penerimaan gudang</div>
                            </div>
                        </div>

                        <div className="col-md-3">
                            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 16px' }}>
                                <div style={{ fontSize: '0.66rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Total Mutasi Keluar</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#991b1b', margin: '4px 0 2px' }}>
                                    -{metrics.total_keluar || 0} <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{selectedBarang.unit}</span>
                                </div>
                                <div style={{ fontSize: '0.66rem', color: '#64748b' }}>Pengeluaran lapangan</div>
                            </div>
                        </div>

                        <div className="col-md-3">
                            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 16px' }}>
                                <div style={{ fontSize: '0.66rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Saldo Fisik Saat Ini</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: '4px 0 2px' }}>
                                    {metrics.saldo_akhir ?? 0} <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{selectedBarang.unit}</span>
                                </div>
                                <div style={{ fontSize: '0.66rem', color: '#64748b' }}>
                                    Batas Min: {selectedBarang.min_stok || 5} {selectedBarang.unit}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* TABEL BUKU BESAR MUTASI */}
                <div style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderTop: '3.5px solid #059669',
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    overflow: 'hidden'
                }}>

                    {/* Header Bilah Tabel */}
                    <div style={{ padding: '14px 20px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <div style={{ fontSize: '0.90rem', fontWeight: '800', color: '#0f172a' }}>
                                Riwayat Mutasi: {selectedBarang?.nama_barang || 'Material'}
                            </div>
                            <div style={{ fontSize: '0.70rem', color: '#64748b', marginTop: '2px' }}>
                                Rak: {selectedBarang?.remarks || '-'} ({selectedBarang?.distrik || '-'}) • Vendor: {selectedBarang?.asal_material || '-'}
                            </div>
                        </div>

                        {/* Search Bar Tabel */}
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                value={tableSearch}
                                onChange={e => { setTableSearch(e.target.value); setCurrentPage(1); }}
                                placeholder="Cari dokumen, tanggal, petugas..."
                                className="form-control form-control-sm"
                                style={{ paddingLeft: '30px', paddingRight: tableSearch ? '26px' : '10px', fontSize: '0.75rem', borderRadius: '6px', width: '260px', borderColor: '#cbd5e1' }}
                            />
                            <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '8.5px' }} />
                            {tableSearch && (
                                <button
                                    type="button"
                                    onClick={() => { setTableSearch(''); setCurrentPage(1); }}
                                    style={{ position: 'absolute', right: '6px', top: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}
                                    title="Bersihkan"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="table align-middle mb-0" style={{ fontSize: '0.78rem' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...thStyle, width: '130px' }}>WAKTU TRANSAKSI</th>
                                    <th style={{ ...thStyle, width: '110px' }}>JENIS MUTASI</th>
                                    <th style={{ ...thStyle, maxWidth: '250px' }}>NO. DOKUMEN / KEPERLUAN</th>
                                    <th style={{ ...thStyle, minWidth: '180px' }}>PETUGAS OPERASIONAL</th>
                                    <th style={{ ...thStyle, maxWidth: '200px' }}>LOKASI / SEKTOR</th>
                                    <th style={{ ...thStyle, textAlign: 'center', width: '110px' }}>ARUS FISIK</th>
                                    <th style={{ ...thStyle, textAlign: 'center', width: '115px' }}>SALDO BERJALAN</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedItems.length > 0 ? (
                                    paginatedItems.map((row, idx) => {
                                        const isInbound = row.tipe === 'inbound';
                                        return (
                                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                {/* 1. WAKTU TRANSAKSI */}
                                                <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                                    <div style={{ fontWeight: '700', color: '#0f172a' }}>{row.tanggal}</div>
                                                    <div style={{ fontSize: '0.67rem', color: '#64748b', marginTop: '1px' }}>{row.jam}</div>
                                                </td>

                                                {/* 2. JENIS MUTASI */}
                                                <td style={{ whiteSpace: 'nowrap' }}>
                                                    <span style={{
                                                        fontSize: '0.71rem',
                                                        fontWeight: '700',
                                                        color: isInbound ? '#047857' : '#991b1b',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}>
                                                        {isInbound ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
                                                        <span>{isInbound ? 'Inbound' : 'Outbound'}</span>
                                                    </span>
                                                </td>

                                                {/* 3. NO. DOKUMEN / KEPERLUAN (DIPAKSA PATAH BERTINGKAT KE BAWAH) */}
                                                <td style={{ maxWidth: '250px', wordBreak: 'break-all', overflowWrap: 'anywhere', padding: '12px 14px' }}>
                                                    <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.78rem', wordBreak: 'break-all' }}>
                                                        {row.no_dokumen || '-'}
                                                    </div>
                                                    {row.catatan && row.catatan !== '-' && (
                                                        <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px', wordBreak: 'break-all' }}>
                                                            {row.catatan}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* 4. PETUGAS OPERASIONAL */}
                                                <td style={{ padding: '12px 14px', minWidth: '180px' }}>
                                                    <div style={{ fontSize: '0.75rem', color: '#0f172a' }}>
                                                        <span style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: '600' }}>{isInbound ? 'Checker: ' : 'Picker: '}</span>
                                                        <span style={{ fontWeight: '700' }}>{row.petugas}</span>
                                                    </div>
                                                    {row.pihak_kedua && row.pihak_kedua !== '-' && (
                                                        <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: '2px' }}>
                                                            <span style={{ color: '#64748b' }}>{isInbound ? 'Vendor: ' : 'Penerima: '}</span>
                                                            <span style={{ fontWeight: '600' }}>{row.pihak_kedua}</span>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* 5. LOKASI / SEKTOR */}
                                                <td style={{ maxWidth: '200px', wordBreak: 'break-all', overflowWrap: 'anywhere', padding: '12px 14px' }}>
                                                    <div style={{ color: '#334155', fontWeight: '600', fontSize: '0.74rem', wordBreak: 'break-all' }}>
                                                        {row.lokasi || '-'}
                                                    </div>
                                                </td>

                                                {/* 6. ARUS FISIK */}
                                                <td style={{ textAlign: 'center', whiteSpace: 'nowrap', padding: '12px 14px' }}>
                                                    <span style={{
                                                        fontWeight: '800',
                                                        fontSize: '0.79rem',
                                                        color: isInbound ? '#047857' : '#991b1b'
                                                    }}>
                                                        {isInbound ? `+${row.masuk}` : `-${row.keluar}`} <span style={{ fontSize: '0.70rem', color: '#64748b', fontWeight: '600' }}>{selectedBarang?.unit}</span>
                                                    </span>
                                                </td>

                                                {/* 7. SALDO BERJALAN */}
                                                <td style={{ textAlign: 'center', whiteSpace: 'nowrap', padding: '12px 14px' }}>
                                                    <span style={{
                                                        fontWeight: '800',
                                                        color: '#0f172a',
                                                        fontSize: '0.80rem'
                                                    }}>
                                                        {row.saldo_berjalan} <span style={{ fontSize: '0.70rem', color: '#64748b', fontWeight: '600' }}>{selectedBarang?.unit}</span>
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                                            {tableSearch
                                                ? `Tidak ditemukan mutasi dengan kata kunci "${tableSearch}".`
                                                : 'Belum ada riwayat pergerakan barang masuk atau keluar untuk SKU ini.'
                                            }
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        currentPage={currentPage}
                        totalItems={filteredLedger.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={(page) => setCurrentPage(page)}
                    />
                </div>
            </main>
        </div>
    );
}