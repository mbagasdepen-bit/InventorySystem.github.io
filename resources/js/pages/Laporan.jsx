import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import Sidebar from '../Components/Sidebar';
import NoticeBanner from '../Components/NoticeBanner.jsx';
import Pagination from '../Components/Pagination';
import { 
    FileSpreadsheet, 
    FileBarChart,
    Printer, 
    Filter, 
    ArrowDownLeft, 
    ArrowUpRight, 
    Layers, 
    AlertTriangle, 
    Search,
    Calendar,
    Boxes,
    Building2,
    ShieldCheck
} from 'lucide-react';

export default function Laporan({ 
    dataStok = [], 
    dataInbound = [], 
    dataOutbound = [], 
    metrics = {}, 
    filters = {} 
}) {
    const [activeTab, setActiveTab] = useState(filters.tab || 'stok');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [selectedDivisi, setSelectedDivisi] = useState(filters.divisi || 'Semua');
    const [searchTable, setSearchTable] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const handleApplyFilter = () => {
        router.get('/laporan', {
            start_date: startDate,
            end_date: endDate,
            divisi: selectedDivisi,
            tab: activeTab
        }, {
            preserveState: true,
            preserveScroll: true
        });
        setCurrentPage(1);
    };

    const handleTabChange = (tabName) => {
        setActiveTab(tabName);
        setCurrentPage(1);
        setSearchTable('');
        router.get('/laporan', {
            start_date: startDate,
            end_date: endDate,
            divisi: selectedDivisi,
            tab: tabName
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handlePrint = () => {
        window.print();
    };

    // FILTER DATA AKTIF BERDASARKAN SEARCH
    const activeData = activeTab === 'stok' ? dataStok : (activeTab === 'inbound' ? dataInbound : dataOutbound);

    const filteredData = activeData.filter((item) => {
        const q = searchTable.toLowerCase().trim();
        if (!q) return true;

        if (activeTab === 'stok') {
            return (item.kode_barang || '').toLowerCase().includes(q) ||
                   (item.nama_barang || '').toLowerCase().includes(q) ||
                   (item.remarks || '').toLowerCase().includes(q) ||
                   (item.status || '').toLowerCase().includes(q);
        } else if (activeTab === 'inbound') {
            return (item.kode_barang || '').toLowerCase().includes(q) ||
                   (item.nama_barang || '').toLowerCase().includes(q) ||
                   (item.diserahkan_oleh || '').toLowerCase().includes(q) ||
                   (item.diterima_oleh || '').toLowerCase().includes(q) ||
                   (item.keterangan || '').toLowerCase().includes(q);
        } else {
            return (item.kode_barang || '').toLowerCase().includes(q) ||
                   (item.nama_barang || '').toLowerCase().includes(q) ||
                   (item.penerima || '').toLowerCase().includes(q) ||
                   (item.lokasi_proyek || '').toLowerCase().includes(q) ||
                   (item.keterangan || '').toLowerCase().includes(q);
        }
    });

    const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // EKSPOR EXCEL REKAP LAPORAN (MEMBACA DATASTOK DENGAN TEMA HIJAU ELEGAN)
    const handleExportExcel = () => {
        try {
            // 1. Ambil data dari props/state LaporanController secara akurat
            const tabAktif = typeof activeTab !== 'undefined' ? activeTab : 'stok';
            
            let dataList = [];
            if (tabAktif === 'inbound') {
                dataList = (typeof dataInbound !== 'undefined' && dataInbound) ? dataInbound : (props?.dataInbound || []);
            } else if (tabAktif === 'outbound') {
                dataList = (typeof dataOutbound !== 'undefined' && dataOutbound) ? dataOutbound : (props?.dataOutbound || []);
            } else {
                // Default: Rekap Saldo Fisik Stok
                dataList = (typeof dataStok !== 'undefined' && dataStok) ? dataStok : (props?.dataStok || []);
            }

            // Fallback jika dibungkus paginasi Laravel
            if (dataList && dataList.data && Array.isArray(dataList.data)) {
                dataList = dataList.data;
            }

            if (!dataList || dataList.length === 0) {
                alert('Tidak ada data pada tabel untuk diekspor.');
                return;
            }

            const tglHariIni = new Date().toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            // 2. Susun baris tabel dengan style rapi & lebar lega
            let tableRowsHtml = '';
            let totalFisik = 0;

            dataList.forEach((item, idx) => {
                const stok = Number(item.stok ?? 0);
                const minStok = Number(item.min_stok ?? 5);
                const isKritis = item.status === 'Kritis' || item.status === 'Habis' || stok <= minStok;
                totalFisik += stok;

                const bgZebra = idx % 2 === 1 ? '#f8fafc' : '#ffffff';
                const statusBg = isKritis ? '#fee2e2' : '#dcfce7';
                const statusColor = isKritis ? '#b91c1c' : '#15803d';
                const statusText = item.status || (isKritis ? 'Kritis' : 'Aman');

                tableRowsHtml += `
                    <tr style="background-color: ${bgZebra};">
                        <td style="border: 0.5pt solid #cbd5e1; text-align: center; vertical-align: middle; padding: 10px 6px; font-size: 9.5pt; color: #475569;">${idx + 1}</td>
                        <td style="border: 0.5pt solid #cbd5e1; text-align: center; vertical-align: middle; padding: 10px 8px; font-weight: bold; font-size: 9.5pt; font-family: ui-monospace, Consolas, monospace; mso-number-format:'\\@';">${item.kode_barang || '-'}</td>
                        <td style="border: 0.5pt solid #cbd5e1; text-align: left; vertical-align: middle; padding: 10px 12px; font-weight: 600; font-size: 9.5pt; color: #0f172a;">${item.nama_barang || '-'}</td>
                        <td style="border: 0.5pt solid #cbd5e1; text-align: center; vertical-align: middle; padding: 10px 8px; font-size: 9pt; color: ${item.divisi === 'Listrik' ? '#0369a1' : '#a16207'}; font-weight: bold;">${item.divisi || '-'}</td>
                        <td style="border: 0.5pt solid #cbd5e1; text-align: left; vertical-align: middle; padding: 10px 10px; font-size: 9.5pt; color: #334155;">${item.remarks || '-'}</td>
                        <td style="border: 0.5pt solid #cbd5e1; text-align: left; vertical-align: middle; padding: 10px 10px; font-size: 9.5pt; color: #334155;">${item.distrik || '-'}</td>
                        <td style="border: 0.5pt solid #cbd5e1; text-align: center; vertical-align: middle; padding: 10px 8px; font-size: 9.5pt; color: #64748b;">${minStok}</td>
                        <td style="border: 0.5pt solid #cbd5e1; text-align: center; vertical-align: middle; padding: 10px 8px; font-weight: bold; font-size: 10.5pt; color: ${isKritis ? '#dc2626' : '#047857'}; background-color: ${isKritis ? '#fff5f5' : '#f0fdf4'};">${stok}</td>
                        <td style="border: 0.5pt solid #cbd5e1; text-align: center; vertical-align: middle; padding: 10px 8px; font-size: 9pt; color: #475569;">${item.unit || 'Unit'}</td>
                        <td style="border: 0.5pt solid #cbd5e1; text-align: center; vertical-align: middle; padding: 10px 8px; background-color: ${statusBg}; color: ${statusColor}; font-weight: bold; font-size: 9pt;">${statusText}</td>
                    </tr>
                `;
            });

            // 3. Template HTML Excel dengan Kolom Lega
            const excelTemplate = `
                <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
                <head>
                    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
                    <!--[if gte mso 9]>
                    <xml>
                        <x:ExcelWorkbook>
                            <x:ExcelWorksheets>
                                <x:ExcelWorksheet>
                                    <x:Name>Rekap Stok</x:Name>
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
                            <col width="150" style="width: 112pt;" />
                            <col width="280" style="width: 210pt;" />
                            <col width="100" style="width: 75pt;" />
                            <col width="180" style="width: 135pt;" />
                            <col width="190" style="width: 142pt;" />
                            <col width="90" style="width: 68pt;" />
                            <col width="110" style="width: 82pt;" />
                            <col width="90" style="width: 68pt;" />
                            <col width="110" style="width: 82pt;" />
                        </colgroup>
                        <tr>
                            <td colspan="10" style="font-size: 14pt; font-weight: bold; color: #064e3b; padding: 6px 0;">
                                WMS INVENTORY ENTERPRISE
                            </td>
                        </tr>
                        <tr>
                            <td colspan="10" style="font-size: 11pt; font-weight: bold; color: #047857; padding: 2px 0;">
                                REKAPITULASI SALDO FISIK STOK RAK GUDANG
                            </td>
                        </tr>
                        <tr>
                            <td colspan="10" style="font-size: 9pt; color: #64748b; padding-bottom: 14px; font-style: italic;">
                                Waktu Ekspor: ${tglHariIni} | Total Material: ${dataList.length} SKU Terdata
                            </td>
                        </tr>
                        <tr style="height: 12px;"><td colspan="10"></td></tr>
                        <thead>
                            <tr style="background-color: #047857; color: #ffffff; height: 40px;">
                                <th style="border: 0.5pt solid #065f46; text-align: center; vertical-align: middle; font-size: 9.5pt;">No</th>
                                <th style="border: 0.5pt solid #065f46; text-align: center; vertical-align: middle; font-size: 9.5pt;">Part Number / SKU</th>
                                <th style="border: 0.5pt solid #065f46; text-align: left; vertical-align: middle; padding-left: 10px; font-size: 9.5pt;">Nama Material</th>
                                <th style="border: 0.5pt solid #065f46; text-align: center; vertical-align: middle; font-size: 9.5pt;">Divisi</th>
                                <th style="border: 0.5pt solid #065f46; text-align: left; vertical-align: middle; padding-left: 10px; font-size: 9.5pt;">Titik Rak Simpan</th>
                                <th style="border: 0.5pt solid #065f46; text-align: left; vertical-align: middle; padding-left: 10px; font-size: 9.5pt;">Distrik</th>
                                <th style="border: 0.5pt solid #065f46; text-align: center; vertical-align: middle; font-size: 9.5pt;">Batas Min</th>
                                <th style="border: 0.5pt solid #065f46; text-align: center; vertical-align: middle; font-size: 9.5pt;">Saldo Fisik</th>
                                <th style="border: 0.5pt solid #065f46; text-align: center; vertical-align: middle; font-size: 9.5pt;">Satuan</th>
                                <th style="border: 0.5pt solid #065f46; text-align: center; vertical-align: middle; font-size: 9.5pt;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRowsHtml}
                        </tbody>
                        <tfoot>
                            <tr style="background-color: #ecfdf5; font-weight: bold; height: 36px;">
                                <td colspan="7" style="border: 0.5pt solid #059669; text-align: right; vertical-align: middle; padding: 8px 14px; font-size: 9.5pt; color: #064e3b;">
                                    TOTAL AKUMULASI FISIK GUDANG:
                                </td>
                                <td style="border: 0.5pt solid #059669; text-align: center; vertical-align: middle; padding: 8px; font-size: 10.5pt; color: #047857; background-color: #d1fae5;">
                                    ${totalFisik}
                                </td>
                                <td colspan="2" style="border: 0.5pt solid #059669; text-align: left; vertical-align: middle; padding: 8px 10px; font-size: 9pt; color: #047857;">
                                    Total: ${dataList.length} Item Material
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </body>
                </html>
            `;

            // Unduh file langsung via Blob di browser
            const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Laporan_Rekap_Stok_${new Date().toISOString().slice(0, 10)}.xls`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error saat ekspor Excel:', err);
            alert('Terjadi kesalahan saat memproses ekspor Excel: ' + err.message);
        }
    };

    const thStyle = {
        backgroundColor: '#f8fafc',
        color: '#475569',
        fontSize: '0.70rem',
        fontWeight: '800',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        padding: '12px 14px',
        borderBottom: '1.5px solid #e2e8f0',
        whiteSpace: 'nowrap'
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            
            {/* CSS CETAK FORMAT RESMI */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #area-laporan, #area-laporan * {
                        visibility: visible;
                    }
                    #area-laporan {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 10px;
                        background: #ffffff !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            <div className="no-print">
                <Sidebar active="reports" />
            </div>

            <main style={{ flex: 1, padding: '28px 36px', overflowY: 'auto' }}>
                
                {/* Header Menu */}
                <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h4 style={{ fontWeight: '800', color: '#0f172a', margin: 0, fontSize: '1.28rem', letterSpacing: '-0.3px' }}>
                            Reports & Audit Center
                        </h4>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                            Rekapitulasi berkala stok fisik gudang, arus masuk-keluar material, dan laporan stock opname
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button 
                            type="button"
                            onClick={handleExportExcel}
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
                <div className="no-print">
                    <NoticeBanner 
                        title="Panduan Rekapitulasi & Rekonsiliasi Audit"
                        description="Laporan ini digunakan untuk mencocokkan data sistem dengan keberadaan fisik material di gudang:"
                        icon={FileBarChart}
                        items={[
                            {
                                title: 'Stock Opname Fisik',
                                desc: 'Gunakan tab Rekap Stok untuk memeriksa apakah saldo aktual rak sesuai dengan fisik.',
                                icon: Boxes
                            },
                            {
                                title: 'Verifikasi Penerimaan Supplier',
                                desc: 'Tab Inbound merangkum seluruh bon tanda terima barang masuk dalam rentang tanggal audit.',
                                icon: ArrowDownLeft
                            },
                            {
                                title: 'Evaluasi Pemakaian Proyek',
                                desc: 'Tab Outbound menyajikan volume alokasi per sektor pekerjaan untuk pengendalian biaya material.',
                                icon: ArrowUpRight
                            }
                        ]}
                    />
                </div>

                <div id="area-laporan">
                    
                    {/* FILTER TANGGAL & DIVISI */}
                    <div className="no-print" style={{ 
                        background: '#ffffff', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '12px', 
                        padding: '14px 18px', 
                        marginBottom: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Calendar size={14} color="#64748b" />
                                <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#475569' }}>Dari:</span>
                                <input 
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    style={{ fontSize: '0.76rem', borderRadius: '7px', borderColor: '#cbd5e1', padding: '5px 8px' }}
                                />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#475569' }}>Sampai:</span>
                                <input 
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                    style={{ fontSize: '0.76rem', borderRadius: '7px', borderColor: '#cbd5e1', padding: '5px 8px' }}
                                />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Building2 size={14} color="#64748b" />
                                <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#475569' }}>Gudang:</span>
                                <select 
                                    className="form-select form-select-sm"
                                    value={selectedDivisi}
                                    onChange={e => setSelectedDivisi(e.target.value)}
                                    style={{ fontSize: '0.76rem', fontWeight: '700', borderRadius: '7px', borderColor: '#cbd5e1', width: '140px' }}
                                >
                                    <option value="Semua">Semua Gudang</option>
                                    <option value="Sipil">Gudang Sipil</option>
                                    <option value="Listrik">Gudang Listrik</option>
                                </select>
                            </div>

                            <button
                                type="button"
                                onClick={handleApplyFilter}
                                className="btn btn-sm btn-dark"
                                style={{
                                    borderRadius: '8px',
                                    fontSize: '0.76rem',
                                    fontWeight: '700',
                                    padding: '6px 14px',
                                    background: '#0f172a',
                                    border: 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Filter size={13} /> Terapkan Filter
                            </button>
                        </div>

                        {/* Search Bar Spesifik */}
                        <div style={{ position: 'relative' }}>
                            <input 
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Cari di hasil laporan..."
                                value={searchTable}
                                onChange={e => { setSearchTable(e.target.value); setCurrentPage(1); }}
                                style={{ paddingLeft: '30px', fontSize: '0.75rem', borderRadius: '7px', borderColor: '#cbd5e1', width: '220px' }}
                            />
                            <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '8.5px' }} />
                        </div>
                    </div>

                    {/* HEADER FORMAL CETAK */}
                    <div style={{ display: 'none' }} className="d-print-block">
                        <div style={{ borderBottom: '2.5px solid #0f172a', paddingBottom: '12px', marginBottom: '16px' }}>
                            <h4 style={{ margin: 0, fontWeight: '900', color: '#047857' }}>WMS INVENTORY ENTERPRISE - LAPORAN RESMI AUDIT</h4>
                            <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
                                Kategori Laporan: {activeTab === 'stok' ? 'Rekapitulasi Saldo Fisik Gudang' : (activeTab === 'inbound' ? 'Rekapitulasi Penerimaan Masuk' : 'Rekapitulasi Pengeluaran Proyek')}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                                Periode: {startDate} s/d {endDate} | Wilayah: Gudang {selectedDivisi}
                            </div>
                        </div>
                    </div>

                    {/* 4 KARTU METRIK EKSEKUTIF */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '18px' }}>
                        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 16px' }}>
                            <div style={{ fontSize: '0.64rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Total Master SKU</div>
                            <div style={{ fontSize: '1.20rem', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                                {metrics.totalSku || 0} <span style={{ fontSize: '0.70rem', color: '#64748b' }}>Item</span>
                            </div>
                        </div>

                        <div style={{ background: '#ffffff', border: metrics.stokKritis > 0 ? '1px solid #fecdd3' : '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 16px' }}>
                            <div style={{ fontSize: '0.64rem', fontWeight: '800', color: metrics.stokKritis > 0 ? '#dc2626' : '#64748b', textTransform: 'uppercase' }}>Stok Kritis / Habis</div>
                            <div style={{ fontSize: '1.20rem', fontWeight: '800', color: metrics.stokKritis > 0 ? '#dc2626' : '#0f172a', marginTop: '2px' }}>
                                {metrics.stokKritis || 0} <span style={{ fontSize: '0.70rem', color: '#64748b' }}>Material</span>
                            </div>
                        </div>

                        <div style={{ background: '#ffffff', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px 16px' }}>
                            <div style={{ fontSize: '0.64rem', fontWeight: '800', color: '#047857', textTransform: 'uppercase' }}>Akumulasi Masuk (Periode)</div>
                            <div style={{ fontSize: '1.20rem', fontWeight: '800', color: '#059669', marginTop: '2px' }}>
                                +{metrics.totalVolMasuk || 0} <span style={{ fontSize: '0.70rem', color: '#64748b' }}>Unit</span>
                            </div>
                        </div>

                        <div style={{ background: '#ffffff', border: '1px solid #fecdd3', borderRadius: '10px', padding: '14px 16px' }}>
                            <div style={{ fontSize: '0.64rem', fontWeight: '800', color: '#e11d48', textTransform: 'uppercase' }}>Akumulasi Keluar (Periode)</div>
                            <div style={{ fontSize: '1.20rem', fontWeight: '800', color: '#dc2626', marginTop: '2px' }}>
                                -{metrics.totalVolKeluar || 0} <span style={{ fontSize: '0.70rem', color: '#64748b' }}>Unit</span>
                            </div>
                        </div>
                    </div>

                    {/* TAB NAVIGASI LAPORAN */}
                    <div className="no-print" style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                        <button
                            type="button"
                            onClick={() => handleTabChange('stok')}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                fontSize: '0.78rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                background: activeTab === 'stok' ? '#047857' : '#ffffff',
                                color: activeTab === 'stok' ? '#ffffff' : '#64748b',
                                boxShadow: activeTab === 'stok' ? '0 2px 8px rgba(4, 120, 87, 0.25)' : 'none'
                            }}
                        >
                            Rekap Saldo Fisik Stok
                        </button>

                        <button
                            type="button"
                            onClick={() => handleTabChange('inbound')}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                fontSize: '0.78rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                background: activeTab === 'inbound' ? '#047857' : '#ffffff',
                                color: activeTab === 'inbound' ? '#ffffff' : '#64748b',
                                boxShadow: activeTab === 'inbound' ? '0 2px 8px rgba(4, 120, 87, 0.25)' : 'none'
                            }}
                        >
                            Rekap Mutasi Inbound ({dataInbound.length})
                        </button>

                        <button
                            type="button"
                            onClick={() => handleTabChange('outbound')}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                fontSize: '0.78rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                background: activeTab === 'outbound' ? '#047857' : '#ffffff',
                                color: activeTab === 'outbound' ? '#ffffff' : '#64748b',
                                boxShadow: activeTab === 'outbound' ? '0 2px 8px rgba(4, 120, 87, 0.25)' : 'none'
                            }}
                        >
                            Rekap Mutasi Outbound ({dataOutbound.length})
                        </button>
                    </div>

                    {/* TABEL DATA LAPORAN */}
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                        <div className="table-responsive">
                            <table className="table align-middle mb-0" style={{ fontSize: '0.78rem' }}>
                                <thead>
                                    {activeTab === 'stok' && (
                                        <tr>
                                            <th style={{ ...thStyle, width: '140px' }}>PART NUMBER / SKU</th>
                                            <th style={thStyle}>NAMA MATERIAL</th>
                                            <th style={{ ...thStyle, width: '120px' }}>GUDANG</th>
                                            <th style={thStyle}>TITIK RAK SIMPAN</th>
                                            <th style={{ ...thStyle, textAlign: 'center', width: '90px' }}>MIN STOK</th>
                                            <th style={{ ...thStyle, textAlign: 'right', width: '120px' }}>SALDO FISIK</th>
                                            <th style={{ ...thStyle, textAlign: 'center', width: '100px' }}>STATUS</th>
                                        </tr>
                                    )}

                                    {activeTab === 'inbound' && (
                                        <tr>
                                            <th style={{ ...thStyle, width: '120px' }}>TANGGAL</th>
                                            <th style={{ ...thStyle, width: '140px' }}>PART NUMBER / SKU</th>
                                            <th style={thStyle}>MATERIAL DITERIMA</th>
                                            <th style={{ ...thStyle, textAlign: 'center', width: '110px' }}>VOLUME MASUK</th>
                                            <th style={thStyle}>CHECKER GUDANG</th>
                                            <th style={thStyle}>PENGIRIM / EKSPEDISI</th>
                                            <th style={thStyle}>DOKUMEN REF</th>
                                        </tr>
                                    )}

                                    {activeTab === 'outbound' && (
                                        <tr>
                                            <th style={{ ...thStyle, width: '120px' }}>TANGGAL</th>
                                            <th style={{ ...thStyle, width: '140px' }}>PART NUMBER / SKU</th>
                                            <th style={thStyle}>MATERIAL DISERAHKAN</th>
                                            <th style={{ ...thStyle, textAlign: 'center', width: '110px' }}>VOLUME KELUAR</th>
                                            <th style={thStyle}>MANDOR PENERIMA</th>
                                            <th style={thStyle}>SEKTOR PROYEK</th>
                                            <th style={thStyle}>KETERANGAN</th>
                                        </tr>
                                    )}
                                </thead>
                                <tbody>
                                    {paginatedData.length > 0 ? (
                                        paginatedData.map((row, idx) => {
                                            if (activeTab === 'stok') {
                                                const isHabis = row.status === 'Habis';
                                                const isKritis = row.status === 'Kritis';
                                                return (
                                                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                        <td style={{ padding: '12px 14px', fontWeight: '800', color: '#0f172a' }}>{row.kode_barang}</td>
                                                        <td><div style={{ fontWeight: '700', color: '#0f172a' }}>{row.nama_barang}</div></td>
                                                        <td><span style={{ fontSize: '0.68rem', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', background: row.divisi === 'Listrik' ? '#e0f2fe' : '#fef3c7', color: row.divisi === 'Listrik' ? '#0284c7' : '#b45309' }}>Gudang {row.divisi}</span></td>
                                                        <td style={{ color: '#475569', fontWeight: '600' }}>{row.remarks} ({row.distrik})</td>
                                                        <td style={{ textAlign: 'center', color: '#64748b' }}>{row.min_stok} {row.unit}</td>
                                                        <td style={{ textAlign: 'right', fontWeight: '800', color: isHabis ? '#dc2626' : '#0f172a' }}>{row.stok} {row.unit}</td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <span style={{ 
                                                                fontSize: '0.66rem', 
                                                                fontWeight: '800', 
                                                                padding: '2px 8px', 
                                                                borderRadius: '5px',
                                                                background: isHabis ? '#fee2e2' : (isKritis ? '#fef3c7' : '#ecfdf5'),
                                                                color: isHabis ? '#dc2626' : (isKritis ? '#b45309' : '#059669'),
                                                                border: isHabis ? '1px solid #fecdd3' : (isKritis ? '1px solid #fde68a' : '1px solid #a7f3d0')
                                                            }}>
                                                                {row.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            } else if (activeTab === 'inbound') {
                                                return (
                                                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                        <td style={{ padding: '12px 14px', fontWeight: '700', color: '#0f172a' }}>{row.tanggal}</td>
                                                        <td style={{ fontWeight: '800', color: '#0f172a' }}>{row.kode_barang}</td>
                                                        <td>
                                                            <div style={{ fontWeight: '700', color: '#0f172a' }}>{row.nama_barang}</div>
                                                            <div style={{ fontSize: '0.66rem', color: '#64748b' }}>Gudang {row.divisi}</div>
                                                        </td>
                                                        <td style={{ textAlign: 'center', fontWeight: '800', color: '#059669' }}>+{row.qty} {row.unit}</td>
                                                        <td style={{ color: '#0f172a', fontWeight: '600' }}>{row.diterima_oleh}</td>
                                                        <td style={{ color: '#475569' }}>{row.diserahkan_oleh}</td>
                                                        <td style={{ color: '#64748b' }}>{row.keterangan}</td>
                                                    </tr>
                                                );
                                            } else {
                                                return (
                                                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                        <td style={{ padding: '12px 14px', fontWeight: '700', color: '#0f172a' }}>{row.tanggal}</td>
                                                        <td style={{ fontWeight: '800', color: '#0f172a' }}>{row.kode_barang}</td>
                                                        <td>
                                                            <div style={{ fontWeight: '700', color: '#0f172a' }}>{row.nama_barang}</div>
                                                            <div style={{ fontSize: '0.66rem', color: '#64748b' }}>Gudang {row.divisi}</div>
                                                        </td>
                                                        <td style={{ textAlign: 'center', fontWeight: '800', color: '#dc2626' }}>-{row.qty} {row.unit}</td>
                                                        <td style={{ color: '#0f172a', fontWeight: '700' }}>{row.penerima}</td>
                                                        <td style={{ color: '#334155', fontWeight: '600' }}>{row.lokasi_proyek}</td>
                                                        <td style={{ color: '#64748b' }}>{row.keterangan}</td>
                                                    </tr>
                                                );
                                            }
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                                                Tidak ada data laporan yang cocok dengan kriteria filter saat ini.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="no-print">
                            <Pagination 
                                currentPage={currentPage}
                                totalItems={filteredData.length}
                                itemsPerPage={itemsPerPage}
                                onPageChange={page => setCurrentPage(page)}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}