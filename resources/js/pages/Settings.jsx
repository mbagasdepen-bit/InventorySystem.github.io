import React, { useState, useMemo } from 'react';
import Sidebar from '../Components/Sidebar';
import Pagination from '../Components/Pagination';
import NoticeBanner from '../Components/NoticeBanner.jsx';
import { 
    ShieldCheck, 
    Search, 
    Filter, 
    ChevronDown, 
    Clock, 
    FileText, 
    CheckCircle2, 
    X,
    KeyRound,
    ArrowLeftRight,
    Maximize2,
    Copy,
    Check,
    LogIn,
    PackagePlus,
    PackageMinus
} from 'lucide-react';

export default function Settings({ logs = [], metrics = {}, currentUser = {} }) {
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    const [selectedLog, setSelectedLog] = useState(null);
    const [isCopied, setIsCopied] = useState(false);

    const safeLogs = Array.isArray(logs) ? logs : (Array.isArray(logs?.data) ? logs.data : []);

    const allowedCategories = ['Login', 'Inbound', 'Outbound'];

    const filteredLogs = useMemo(() => {
        const q = search.toLowerCase().trim();
        return safeLogs.filter((log) => {
            const cat = (log.kategori || '').trim();
            const isMainCategory = allowedCategories.some(c => cat.toLowerCase().includes(c.toLowerCase()));
            if (!isMainCategory) return false;

            const matchesCat = !categoryFilter || cat.toLowerCase().includes(categoryFilter.toLowerCase());
            const matchesSearch = 
                !q ||
                (log.user && log.user.toLowerCase().includes(q)) ||
                (log.role && log.role.toLowerCase().includes(q)) ||
                (log.aksi && log.aksi.toLowerCase().includes(q)) ||
                (log.detail && log.detail.toLowerCase().includes(q)) ||
                (log.ref_doc && log.ref_doc.toLowerCase().includes(q)) ||
                (log.waktu && log.waktu.toLowerCase().includes(q));

            return matchesCat && matchesSearch;
        });
    }, [safeLogs, categoryFilter, search]);

    const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const totalLogin = safeLogs.filter(l => (l.kategori || '').toLowerCase().includes('login') || (l.kategori || '').toLowerCase().includes('sesi')).length;
    const totalInbound = safeLogs.filter(l => (l.kategori || '').toLowerCase().includes('inbound')).length;
    const totalOutbound = safeLogs.filter(l => (l.kategori || '').toLowerCase().includes('outbound')).length;

    const handleCopyDetail = (text) => {
        navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    // Helper untuk membersihkan nama dari tanda kurung agar tidak dobel
    const getCleanName = (name) => {
        if (!name) return 'Administrator';
        return name.replace(/\s*\(.*?\)\s*/g, '').trim();
    };

    // Helper untuk merapikan teks role menjadi judul profesional
    const getCleanRole = (role) => {
        const r = (role || '').toLowerCase();
        if (r.includes('admin') || r.includes('super') || r === 'admin') return 'Super Administrator';
        if (r.includes('manager') || r.includes('operations') || r === 'manager') return 'Operations Manager';
        if (r.includes('gudang') || r.includes('staff') || r.includes('operator') || r === 'gudang') return 'Staff Logistik & Gudang';
        return role || 'Staff Logistik & Gudang';
    };

    const thStyle = {
        backgroundColor: '#f8fafc',
        color: '#64748b',
        fontSize: '0.71rem',
        fontWeight: '700',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        padding: '13px 18px',
        borderBottom: '1.5px solid #e2e8f0',
        whiteSpace: 'nowrap'
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', color: '#1e293b', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            
            <style>{`
                .audit-log-row {
                    cursor: pointer;
                    transition: background-color 0.12s ease;
                }
                .audit-log-row:hover td {
                    background-color: #f1f5f9 !important;
                }
                .audit-log-row:hover .btn-expand-log {
                    color: #0f172a !important;
                    border-color: #cbd5e1 !important;
                    background-color: #ffffff !important;
                }
            `}</style>

            <Sidebar active="settings" />

            <main style={{ flex: 1, padding: '28px 36px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <h4 style={{ fontWeight: '800', color: '#0f172a', margin: 0, fontSize: '1.3rem', letterSpacing: '-0.3px' }}>
                            Security & Activity Logs
                        </h4>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                            Audit trail sistem: pemantauan sesi login, penerimaan barang masuk, dan pengeluaran barang keluar
                        </div>
                    </div>
                </div>

                {/* Banner Panduan */}
                <NoticeBanner 
                    title="Pemberitahuan & Panduan Keamanan Sistem (Security & Activity Log)"
                    description="Sistem audit trail terfokus untuk merekam aktivitas otentikasi login, mutasi masuk, dan mutasi keluar gudang:"
                    icon={ShieldCheck}
                    items={[
                        {
                            title: 'Sesi Login Pengguna',
                            desc: 'Memantau waktu masuk dan aktivitas otentikasi akun untuk menjaga keamanan akses portal.',
                            icon: KeyRound
                        },
                        {
                            title: 'Mutasi Barang Masuk (Inbound)',
                            desc: 'Merekam riwayat penerimaan material dari vendor secara kronologis dan presisi.',
                            icon: PackagePlus
                        },
                        {
                            title: 'Mutasi Barang Keluar (Outbound)',
                            desc: 'Mencatat penyerahan material fisik ke sektor proyek beserta validasi penanggung jawab.',
                            icon: PackageMinus
                        }
                    ]}
                />

                {/* 3 Kartu Metrik Ringkasan Utama */}
                <div className="row g-3 mb-4">
                    <div className="col-md-4">
                        <div style={{ background: '#ffffff', border: '1px solid #eef2f6', borderRadius: '12px', padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Sesi Login</span>
                                <div style={{ background: '#eff6ff', color: '#0284c7', padding: '6px', borderRadius: '8px' }}>
                                    <LogIn size={16} />
                                </div>
                            </div>
                            <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', margin: '6px 0 2px' }}>
                                {totalLogin} <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Aktivitas</span>
                            </div>
                            <div style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: '600' }}>
                                Otentikasi & masuk sistem
                            </div>
                        </div>
                    </div>

                    <div className="col-md-4">
                        <div style={{ background: '#ffffff', border: '1px solid #eef2f6', borderRadius: '12px', padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Barang Masuk (Inbound)</span>
                                <div style={{ background: '#ecfdf5', color: '#059669', padding: '6px', borderRadius: '8px' }}>
                                    <PackagePlus size={16} />
                                </div>
                            </div>
                            <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#059669', margin: '6px 0 2px' }}>
                                {totalInbound} <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Transaksi</span>
                            </div>
                            <div style={{ fontSize: '0.68rem', color: '#059669', fontWeight: '600' }}>
                                Penerimaan material gudang
                            </div>
                        </div>
                    </div>

                    <div className="col-md-4">
                        <div style={{ background: '#ffffff', border: '1px solid #eef2f6', borderRadius: '12px', padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Barang Keluar (Outbound)</span>
                                <div style={{ background: '#fff1f2', color: '#e11d48', padding: '6px', borderRadius: '8px' }}>
                                    <PackageMinus size={16} />
                                </div>
                            </div>
                            <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#e11d48', margin: '6px 0 2px' }}>
                                {totalOutbound} <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Transaksi</span>
                            </div>
                            <div style={{ fontSize: '0.68rem', color: '#e11d48', fontWeight: '600' }}>
                                Pengeluaran proyek lapangan
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabel Audit Activity Logs */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#f1f5f9', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FileText size={17} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0f172a', lineHeight: 1.1 }}>
                                    Log Aktivitas & Audit Trail
                                </div>
                                <div style={{ fontSize: '0.69rem', color: '#64748b', marginTop: '2px' }}>
                                    Menampilkan {filteredLogs.length} aktivitas tervalidasi (Login, Inbound, Outbound)
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {/* Dropdown Filter Kategori */}
                            <div style={{ position: 'relative' }}>
                                <button
                                    type="button"
                                    onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: categoryFilter ? '#334155' : '#ffffff', color: categoryFilter ? '#ffffff' : '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 12px', fontSize: '0.76rem', fontWeight: '700', cursor: 'pointer' }}
                                >
                                    <Filter size={12} color={categoryFilter ? '#ffffff' : '#64748b'} />
                                    <span>{categoryFilter || 'Semua Kategori'}</span>
                                    <ChevronDown size={13} style={{ transform: filterDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                                </button>

                                {filterDropdownOpen && (
                                    <>
                                        <div onClick={() => setFilterDropdownOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                                        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4px', minWidth: '160px', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', zIndex: 50, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <button type="button" onClick={() => { setCategoryFilter(''); setFilterDropdownOpen(false); setCurrentPage(1); }} style={{ padding: '7px 10px', border: 'none', background: !categoryFilter ? '#f1f5f9' : 'transparent', color: !categoryFilter ? '#0f172a' : '#334155', fontWeight: !categoryFilter ? '700' : '500', fontSize: '0.74rem', textAlign: 'left', borderRadius: '6px', cursor: 'pointer' }}>Semua Kategori</button>
                                            {allowedCategories.map((cat, idx) => (
                                                <button key={idx} type="button" onClick={() => { setCategoryFilter(cat); setFilterDropdownOpen(false); setCurrentPage(1); }} style={{ padding: '7px 10px', border: 'none', background: categoryFilter === cat ? '#f1f5f9' : 'transparent', color: categoryFilter === cat ? '#0f172a' : '#334155', fontWeight: categoryFilter === cat ? '700' : '500', fontSize: '0.74rem', textAlign: 'left', borderRadius: '6px', cursor: 'pointer' }}>{cat}</button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div style={{ position: 'relative' }}>
                                <input 
                                    type="text" 
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                                    placeholder="Cari user, aksi, dokumen..." 
                                    className="form-control form-control-sm"
                                    style={{ paddingLeft: '28px', paddingRight: search ? '26px' : '10px', fontSize: '0.76rem', borderRadius: '8px', width: '240px', borderColor: '#cbd5e1' }}
                                />
                                <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: '9px', top: '8px' }} />
                                {search && (
                                    <button type="button" onClick={() => { setSearch(''); setCurrentPage(1); }} style={{ position: 'absolute', right: '6px', top: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}><X size={12} /></button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="table align-middle mb-0" style={{ fontSize: '0.78rem' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...thStyle, width: '135px' }}>Waktu Aktivitas</th>
                                    <th style={{ ...thStyle, width: '175px' }}>Pengguna / Pelaksana</th>
                                    <th style={{ ...thStyle, width: '95px' }}>Kategori</th>
                                    <th style={{ ...thStyle, width: '145px' }}>Ref Document</th>
                                    <th style={{ ...thStyle, width: '155px' }}>Tindakan / Aksi</th>
                                    <th style={{ ...thStyle, minWidth: '320px' }}>Uraian Detail Aktivitas</th>
                                    <th style={{ ...thStyle, textAlign: 'center', width: '130px', paddingRight: '24px' }}>Integritas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedLogs.length > 0 ? (
                                    paginatedLogs.map((log, idx) => {
                                        const defaultBg = idx % 2 === 1 ? '#fafbfc' : '#ffffff';

                                        const parts = (log.waktu || '').split(' - ');
                                        const datePart = parts[0] || log.waktu;
                                        const timePart = parts[1] || '';

                                        const cleanName = getCleanName(log.user);
                                        const cleanRole = getCleanRole(log.role);

                                        return (
                                            <tr 
                                                key={idx} 
                                                onClick={() => setSelectedLog(log)}
                                                className="audit-log-row"
                                                style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: defaultBg }}
                                                title="Klik untuk melihat rincian detail log aktivitas ini secara menyeluruh"
                                            >
                                                <td style={{ padding: '12px 18px', whiteSpace: 'nowrap' }}>
                                                    <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.78rem' }}>
                                                        {datePart}
                                                    </div>
                                                    {timePart && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
                                                            <Clock size={11} color="#64748b" />
                                                            <span>{timePart}</span>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* PENGGUNA: Bersih tanpa dobel teks/kurung */}
                                                <td>
                                                    <div style={{ fontWeight: '700', color: '#0f172a' }}>{cleanName}</div>
                                                    <div style={{ fontSize: '0.67rem', color: '#64748b', marginTop: '1px' }}>{cleanRole}</div>
                                                </td>

                                                <td>
                                                    <span style={{ 
                                                        fontSize: '0.68rem', 
                                                        fontWeight: '700', 
                                                        padding: '3px 8px', 
                                                        borderRadius: '6px', 
                                                        background: '#f1f5f9', 
                                                        color: '#334155',
                                                        border: '1px solid #e2e8f0'
                                                    }}>
                                                        {log.kategori}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span style={{ 
                                                        fontFamily: 'ui-monospace, monospace', 
                                                        fontWeight: '700', 
                                                        color: '#0f172a',
                                                        fontSize: '0.76rem' 
                                                    }}>
                                                        {log.ref_doc || '-'}
                                                    </span>
                                                </td>

                                                <td style={{ fontWeight: '600', color: '#334155' }}>
                                                    {log.aksi}
                                                </td>

                                                <td style={{ padding: '12px 18px' }}>
                                                    <div style={{ 
                                                        color: '#334155', 
                                                        lineHeight: 1.5, 
                                                        fontSize: '0.76rem',
                                                        wordBreak: 'break-word'
                                                    }}>
                                                        {log.detail}
                                                    </div>
                                                    
                                                    <div style={{ marginTop: '5px' }}>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}
                                                            className="btn-expand-log"
                                                            style={{
                                                                background: '#f8fafc',
                                                                border: '1px solid #e2e8f0',
                                                                borderRadius: '4px',
                                                                padding: '2px 8px',
                                                                fontSize: '0.65rem',
                                                                fontWeight: '700',
                                                                color: '#64748b',
                                                                cursor: 'pointer',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                transition: 'all 0.15s ease'
                                                            }}
                                                        >
                                                            <Maximize2 size={10} />
                                                            <span>Lihat Rincian Utuh</span>
                                                        </button>
                                                    </div>
                                                </td>

                                                <td style={{ textAlign: 'center', whiteSpace: 'nowrap', paddingRight: '24px' }}>
                                                    <span style={{ 
                                                        fontSize: '0.68rem', 
                                                        fontWeight: '700', 
                                                        color: '#059669', 
                                                        background: '#ecfdf5', 
                                                        padding: '4px 10px', 
                                                        borderRadius: '6px', 
                                                        border: '1px solid #a7f3d0', 
                                                        display: 'inline-flex', 
                                                        alignItems: 'center', 
                                                        gap: '4px' 
                                                    }}>
                                                        <CheckCircle2 size={11} /> Tervalidasi
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                                            Tidak ada rekaman aktivitas Login, Inbound, atau Outbound yang sesuai.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination currentPage={currentPage} totalItems={filteredLogs.length} itemsPerPage={itemsPerPage} onPageChange={(page) => setCurrentPage(page)} />
                </div>

                {/* Pop-up Modal Inspeksi Rincian Lengkap */}
                {selectedLog && (
                    <div style={{ 
                        position: 'fixed', 
                        inset: 0, 
                        background: 'rgba(15, 23, 42, 0.45)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        zIndex: 1050, 
                        backdropFilter: 'blur(4px)' 
                    }}>
                        <div style={{ 
                            background: '#ffffff', 
                            borderRadius: '16px', 
                            width: '100%', 
                            maxWidth: '560px', 
                            padding: '24px 26px', 
                            boxShadow: '0 20px 45px rgba(15, 23, 42, 0.16)',
                            border: '1px solid #e2e8f0'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ 
                                            fontSize: '0.68rem', 
                                            fontWeight: '800', 
                                            background: '#f1f5f9', 
                                            border: '1px solid #cbd5e1',
                                            color: '#334155', 
                                            padding: '2px 8px', 
                                            borderRadius: '5px' 
                                        }}>
                                            {selectedLog.kategori}
                                        </span>

                                        <span style={{ 
                                            fontSize: '0.68rem', 
                                            fontWeight: '700', 
                                            color: '#059669', 
                                            background: '#ecfdf5', 
                                            border: '1px solid #a7f3d0',
                                            padding: '2px 8px', 
                                            borderRadius: '5px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            <CheckCircle2 size={11} /> Integritas Tervalidasi
                                        </span>
                                    </div>

                                    <h5 style={{ fontWeight: '800', color: '#0f172a', margin: '6px 0 0', fontSize: '1.15rem' }}>
                                        Rincian Jejak Aktivitas Sistem
                                    </h5>
                                </div>

                                <button 
                                    type="button"
                                    onClick={() => setSelectedLog(null)} 
                                    style={{ 
                                        background: '#f8fafc', 
                                        border: '1px solid #e2e8f0', 
                                        borderRadius: '8px', 
                                        cursor: 'pointer', 
                                        color: '#64748b',
                                        padding: '5px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <X size={15} />
                                </button>
                            </div>

                            <div style={{ 
                                background: '#f8fafc', 
                                border: '1px solid #e2e8f0', 
                                borderRadius: '12px', 
                                padding: '14px 16px',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '12px',
                                marginBottom: '14px'
                            }}>
                                <div>
                                    <div style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                                        Waktu Eksekusi
                                    </div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0f172a', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <Clock size={12} color="#059669" />
                                        <span>{selectedLog.waktu}</span>
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                                        Pelaksana / Petugas
                                    </div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
                                        {getCleanName(selectedLog.user)} ({getCleanRole(selectedLog.role)})
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                                        Dokumen Referensi / SKU
                                    </div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#0f172a', marginTop: '2px', fontFamily: 'ui-monospace, monospace' }}>
                                        {selectedLog.ref_doc || '-'}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                                        Jenis Tindakan
                                    </div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
                                        {selectedLog.aksi}
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '0.68rem', color: '#475569', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        Uraian Lengkap Aktivitas:
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleCopyDetail(selectedLog.detail)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '0.68rem',
                                            color: isCopied ? '#059669' : '#64748b',
                                            fontWeight: '700',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        {isCopied ? <Check size={12} /> : <Copy size={12} />}
                                        <span>{isCopied ? 'Tersalin!' : 'Salin Teks'}</span>
                                    </button>
                                </div>

                                <div style={{ 
                                    background: '#ffffff', 
                                    border: '1.5px solid #cbd5e1', 
                                    borderRadius: '10px', 
                                    padding: '12px 14px',
                                    fontSize: '0.8rem',
                                    color: '#0f172a',
                                    lineHeight: 1.6,
                                    maxHeight: '180px',
                                    overflowY: 'auto',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word'
                                }}>
                                    {selectedLog.detail}
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                                <button 
                                    type="button"
                                    onClick={() => setSelectedLog(null)} 
                                    className="btn btn-sm btn-light border px-4"
                                    style={{ borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700', color: '#334155' }}
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}