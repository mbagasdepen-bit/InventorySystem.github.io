import React, { useState, useMemo } from 'react';
import { useForm, usePage, router } from '@inertiajs/react';
import Sidebar from '../Components/Sidebar';
import Pagination from '../Components/Pagination';
import NoticeBanner from '../Components/NoticeBanner.jsx';
import { 
    ArrowDownLeft, 
    Search, 
    Plus, 
    X, 
    Package, 
    PackagePlus,
    MapPin, 
    UserCheck, 
    FileText, 
    ChevronDown,  
    Boxes, 
    Filter,
    Trash2
} from 'lucide-react';

// HELPER: Mendeteksi divisi secara akurat (Fallback ke prefix CVL / ELK jika divisi kosong)
export const resolveDivisi = (item) => {
    if (!item) return 'Sipil';
    const rawDivisi = (item.divisi || item.barang?.divisi || '').toLowerCase();
    if (rawDivisi.includes('listrik') || rawDivisi.includes('elek')) return 'Listrik';
    if (rawDivisi.includes('sipil') || rawDivisi.includes('civil')) return 'Sipil';

    // Deteksi cerdas dari kode SKU (ELK = Listrik, CVL = Sipil)
    const kode = (item.kode_barang || item.part_number || item.barang?.kode_barang || '').toUpperCase();
    if (kode.startsWith('ELK') || kode.includes('LISTRIK')) return 'Listrik';
    if (kode.startsWith('CVL') || kode.includes('SIPIL')) return 'Sipil';

    // Deteksi dari nama barang
    const nama = (item.nama_barang || item.barang?.nama_barang || '').toLowerCase();
    if (nama.includes('kabel') || nama.includes('lampu') || nama.includes('saklar') || nama.includes('mcb') || nama.includes('listrik')) {
        return 'Listrik';
    }
    return 'Sipil';
};

// KOMPONEN DROPDOWN GUDANG 
function DropdownGudang({ value, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    
    const options = [
        { key: 'Semua', label: 'Semua Gudang' },
        { key: 'Sipil', label: 'Gudang Sipil' },
        { key: 'Listrik', label: 'Gudang Listrik' }
    ];

    const currentLabel = options.find(o => o.key === value)?.label || 'Semua Gudang';

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#ffffff',
                    color: '#0f172a',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    fontFamily: "'Plus Jakarta Sans', sans-serif"
                }}
            >
                <Filter size={14} color="#64748b" />
                <span>{currentLabel}</span>
                <ChevronDown 
                    size={14} 
                    color="#64748b" 
                    style={{ 
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
                        transition: 'transform 0.2s ease' 
                    }} 
                />
            </button>

            {isOpen && (
                <>
                    <div 
                        onClick={() => setIsOpen(false)} 
                        style={{ position: 'fixed', inset: 0, zIndex: 1060 }} 
                    />
                    <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        boxShadow: '0 12px 28px rgba(15, 23, 42, 0.12)',
                        minWidth: '160px',
                        zIndex: 1070,
                        padding: '6px',
                        fontFamily: "'Plus Jakarta Sans', sans-serif"
                    }}>
                        {options.map((opt) => {
                            const isSelected = opt.key === value;
                            return (
                                <div
                                    key={opt.key}
                                    onClick={() => {
                                        onChange(opt.key);
                                        setIsOpen(false);
                                    }}
                                    style={{
                                        padding: '8px 12px',
                                        fontSize: '0.78rem',
                                        fontWeight: isSelected ? '800' : '600',
                                        color: isSelected ? '#0f172a' : '#475569',
                                        cursor: 'pointer',
                                        borderRadius: '6px',
                                        background: isSelected ? '#f1f5f9' : 'transparent',
                                        transition: 'background 0.15s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isSelected) e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    {opt.label}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}

// SEARCHABLE SKU SELECT
function SearchableSkuSelect({ value, onChange, options = [], error }) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [filterGudangModal, setFilterGudangModal] = useState('Semua');

    const selectedItem = useMemo(() => {
        return options.find(opt => String(opt.id_barang) === String(value)) || null;
    }, [options, value]);

    const filteredOptions = useMemo(() => {
        const q = query.toLowerCase().trim();
        return options.filter(item => {
            const itemDivisi = resolveDivisi(item);
            const matchDivisi = filterGudangModal === 'Semua' || itemDivisi.toLowerCase() === filterGudangModal.toLowerCase();
            
            const matchSearch = !q || 
                (item.kode_barang || '').toLowerCase().includes(q) ||
                (item.nama_barang || '').toLowerCase().includes(q);
            return matchDivisi && matchSearch;
        });
    }, [options, query, filterGudangModal]);

    return (
        <div style={{ position: 'relative' }}>
            <div style={{ position: 'relative' }}>
                <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Pilih atau cari material SKU..."
                    value={isOpen ? query : (selectedItem ? `[Gudang ${resolveDivisi(selectedItem)}] ${selectedItem.kode_barang} - ${selectedItem.nama_barang}` : '')}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (!isOpen) setIsOpen(true);
                    }}
                    onFocus={() => {
                        setQuery('');
                        setIsOpen(true);
                    }}
                    style={{
                        paddingRight: '32px',
                        fontSize: '0.78rem',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        borderRadius: '8px',
                        borderColor: error ? '#ef4444' : (isOpen ? '#059669' : '#cbd5e1'),
                        boxShadow: isOpen ? '0 0 0 3px rgba(5, 150, 105, 0.12)' : 'none',
                        background: '#ffffff',
                        cursor: 'text'
                    }}
                />
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 0
                    }}
                >
                    <ChevronDown 
                        size={15} 
                        style={{ 
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
                            transition: 'transform 0.2s ease' 
                        }} 
                    />
                </button>
            </div>

            {isOpen && (
                <>
                    <div 
                        onClick={() => setIsOpen(false)} 
                        style={{ position: 'fixed', inset: 0, zIndex: 1060 }} 
                    />
                    <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        boxShadow: '0 12px 28px rgba(15, 23, 42, 0.12)',
                        maxHeight: '260px',
                        overflowY: 'auto',
                        zIndex: 1070,
                        padding: '8px'
                    }}>
                        {/* Header Dropdown Filter Gudang */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                                Filter Gudang:
                            </span>
                            <DropdownGudang 
                                value={filterGudangModal} 
                                onChange={setFilterGudangModal} 
                            />
                        </div>

                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((item) => {
                                const isSelected = String(item.id_barang) === String(value);
                                const divName = resolveDivisi(item);
                                const isListrik = divName === 'Listrik';
                                return (
                                    <div
                                        key={item.id_barang}
                                        onClick={() => {
                                            onChange(item.id_barang);
                                            setIsOpen(false);
                                        }}
                                        style={{
                                            padding: '8px 10px',
                                            fontSize: '0.77rem',
                                            cursor: 'pointer',
                                            borderRadius: '6px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            background: isSelected ? '#ecfdf5' : 'transparent',
                                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                                            marginBottom: '2px'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSelected) e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ 
                                                    fontSize: '0.64rem', 
                                                    fontWeight: '700', 
                                                    padding: '2px 6px', 
                                                    borderRadius: '4px',
                                                    whiteSpace: 'nowrap',
                                                    background: isListrik ? '#e0f2fe' : '#fef3c7',
                                                    color: isListrik ? '#0284c7' : '#b45309',
                                                    border: isListrik ? '1px solid #bae6fd' : '1px solid #fde68a'
                                                }}>
                                                    Gudang {divName}
                                                </span>
                                                <span style={{ fontWeight: '800', color: '#0f172a' }}>
                                                    {item.kode_barang}
                                                </span>
                                            </div>
                                            <div style={{ color: '#334155', fontWeight: '600', marginTop: '2px' }}>
                                                {item.nama_barang}
                                            </div>
                                        </div>
                                        <div style={{ color: '#059669', fontWeight: '800', fontSize: '0.74rem', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                                            Stok: {item.stok} {item.unit || 'Unit'}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{ padding: '14px 10px', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
                                Tidak ada material yang cocok
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default function InboundStock({ 
    listMasuk = [], 
    barangOptions = [], 
    filters = {}, 
    flash = {} 
}) {
    const { auth } = usePage().props;
    const userRole = (auth?.user?.role || '').toLowerCase();
    const isManager = userRole === 'manager' || userRole.includes('manage');
    const defaultChecker = auth?.user?.name || 'Administrator';

    const [search, setSearch] = useState(filters?.q || '');
    const [selectedDivisi, setSelectedDivisi] = useState('Semua');
    const [showModal, setShowModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const { data, setData, post, processing, reset, errors } = useForm({
        id_barang: '',
        tanggal: new Date().toISOString().slice(0, 10),
        qty: 1,
        diterima_oleh: defaultChecker,
        diserahkan_oleh: '',
        keterangan: '',
        foto: null
    });

    const selectedBarang = useMemo(() => {
        return barangOptions.find(b => String(b.id_barang) === String(data.id_barang)) || null;
    }, [barangOptions, data.id_barang]);

    const stokAwal = Number(selectedBarang?.stok || 0);
    const qtyMasuk = Number(data.qty || 1);
    const estimasiStokBaru = stokAwal + qtyMasuk;

    // Filter Berdasarkan Pencarian & Dropdown Divisi
    const filteredList = useMemo(() => {
        const q = search.toLowerCase().trim();
        return listMasuk.filter((item) => {
            const itemDivisi = resolveDivisi(item);
            const matchDivisi = selectedDivisi === 'Semua' || itemDivisi.toLowerCase() === selectedDivisi.toLowerCase();

            const kode = (item.kode_barang || item.part_number || item.barang?.kode_barang || '').toLowerCase();
            const nama = (item.nama_barang || item.barang?.nama_barang || '').toLowerCase();
            const checker = (item.diterima_oleh || item.checker || '').toLowerCase();
            const vendor = (item.diserahkan_oleh || item.kurir || '').toLowerCase();
            const ket = (item.keterangan || '').toLowerCase();
            const tgl = (item.tanggal || '').toLowerCase();

            const matchSearch = !q || 
                kode.includes(q) || 
                nama.includes(q) || 
                checker.includes(q) || 
                vendor.includes(q) || 
                ket.includes(q) || 
                tgl.includes(q);

            return matchDivisi && matchSearch;
        });
    }, [listMasuk, search, selectedDivisi]);

    const paginatedList = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleSubmitInbound = (e) => {
        e.preventDefault();
        post('/barang-masuk', {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setShowModal(false);
            }
        });
    };

    // FUNGSI HAPUS MUTASI MASUK (INBOUND)
    const handleDeleteInbound = (id, sku, qty, unit) => {
        if (!id || id === 'undefined') {
            alert('Gagal: ID transaksi tidak terbaca dari database!');
            return;
        }

        if (confirm(`Yakin ingin menghapus mutasi masuk material [${sku}] sebanyak ${qty} ${unit}?\n\nSaldo stok material akan langsung dikurangi dari rak penyimpanan.`)) {
            const endpoint = window.location.pathname.includes('inbound') 
                ? `/inbound/${id}` 
                : `/barang-masuk/${id}`;

            router.delete(endpoint, {
                preserveScroll: true,
                onError: (err) => {
                    alert(err.general || 'Gagal menghapus catatan transaksi.');
                }
            });
        }
    };

    const thStyle = {
        backgroundColor: '#f8fafc',
        color: '#64748b',
        fontSize: '0.70rem',
        fontWeight: '800',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        padding: '12px 16px',
        borderBottom: '1.5px solid #e2e8f0',
        whiteSpace: 'nowrap',
        fontFamily: "'Plus Jakarta Sans', sans-serif"
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <Sidebar active="inbound" />

            <main style={{ flex: 1, padding: '28px 36px', overflowY: 'auto' }}>
                
                {/* Header Menu */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h4 style={{ fontWeight: '800', color: '#0f172a', margin: 0, fontSize: '1.30rem', letterSpacing: '-0.3px' }}>
                            Mutasi Barang Masuk (Inbound)
                        </h4>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                            Penerimaan stok material dari supplier, pencocokan surat jalan, dan verifikasi fisik rak
                        </div>
                    </div>

                    {/* Tombol Input HANYA MUNCUL jika BUKAN MANAGER */}
                    {!isManager && (
                        <button 
                            onClick={() => setShowModal(true)}
                            className="btn btn-sm"
                            style={{ 
                                background: '#059669', 
                                color: '#ffffff', 
                                borderRadius: '8px', 
                                fontSize: '0.76rem', 
                                fontWeight: '700', 
                                padding: '8px 16px', 
                                border: 'none', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px', 
                                boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)' 
                            }}
                        >
                            <Plus size={15} /> Input Barang Masuk
                        </button>
                    )}
                </div>

                {flash?.pesan && (
                    <div className="alert alert-success border-0 py-2 px-3 mb-3" style={{ borderRadius: '8px', fontSize: '0.8rem', background: '#ecfdf5', color: '#065f46' }}>
                        {flash.pesan}
                    </div>
                )}

                {/* Banner Panduan */}
                <NoticeBanner 
                    title="Petunjuk Verifikasi Penerimaan Barang Masuk"
                    description="Seluruh barang masuk harus diperiksa kesesuaian fisik dan nomor dokumen pengirimannya:"
                    icon={PackagePlus}
                    items={[
                        {
                            title: 'Pemeriksaan Fisik SKU',
                            desc: 'Periksa keutuhan kemasan material sebelum dimasukkan ke dalam rak penyimpanan.',
                            icon: Boxes
                        },
                        {
                            title: 'Verifikasi Kurir & Vendor',
                            desc: 'Pastikan identitas pengemudi dan nama vendor penyedia tercatat dengan akurat.',
                            icon: UserCheck
                        },
                        {
                            title: 'Nomor PO & Surat Jalan',
                            desc: 'Cantumkan nomor PO atau surat jalan resmi dari pabrik untuk rekonsiliasi audit faktur.',
                            icon: FileText
                        }
                    ]}
                />

                {/* Tabel Riwayat Inbound */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderTop: '3.5px solid #059669', borderRadius: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
                    
                    {/* Toolbar Pencarian & Dropdown Gudang */}
                    <div style={{ padding: '16px 20px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ArrowDownLeft size={18} strokeWidth={2.4} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.94rem', fontWeight: '800', color: '#0f172a' }}>
                                    Riwayat Mutasi Masuk
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                    Total {filteredList.length} transaksi penerimaan material terdata
                                </div>
                            </div>
                        </div>

                        {/* Dropdown Filter Gudang & Search Bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <DropdownGudang 
                                value={selectedDivisi} 
                                onChange={(val) => { setSelectedDivisi(val); setCurrentPage(1); }} 
                            />

                            <div style={{ position: 'relative' }}>
                                <input 
                                    type="text" 
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                                    placeholder="Cari SKU, nama, kurir, catatan..." 
                                    className="form-control form-control-sm"
                                    style={{ paddingLeft: '30px', paddingRight: search ? '26px' : '10px', fontSize: '0.76rem', borderRadius: '8px', width: '240px', borderColor: '#cbd5e1' }}
                                />
                                <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '8px' }} />
                                {search && (
                                    <button type="button" onClick={() => { setSearch(''); setCurrentPage(1); }} style={{ position: 'absolute', right: '6px', top: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}>
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="table align-middle mb-0" style={{ fontSize: '0.79rem' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...thStyle, width: '130px' }}>TANGGAL MASUK</th>
                                    <th style={{ ...thStyle, width: '160px' }}>PART NUMBER / SKU</th>
                                    <th style={{ ...thStyle, maxWidth: '240px' }}>MATERIAL DITERIMA</th>
                                    <th style={{ ...thStyle, textAlign: 'left', width: '120px' }}>VOLUME MASUK</th>
                                    <th style={thStyle}>CHECKER GUDANG</th>
                                    <th style={{ ...thStyle, maxWidth: '250px' }}>KURIR & DOKUMEN PO</th>
                                    {/* Kolom Aksi hanya muncul jika BUKAN MANAGER */}
                                    {!isManager && <th style={{ ...thStyle, textAlign: 'center', width: '90px' }}>AKSI</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedList.length > 0 ? (
                                    paginatedList.map((row, idx) => {
                                        const recordId = row.id_masuk || row.id || row.id_bm;
                                        const rawVendor = (row.diserahkan_oleh || '').trim();
                                        const rawKet = (row.keterangan || '').trim();
                                        const cleanVendor = (rawVendor && rawVendor !== '-') ? rawVendor : 'Kurir / Vendor Ekspedisi';
                                        const cleanKet = (rawKet && rawKet !== '-') ? rawKet : '';
                                        const divisi = resolveDivisi(row);
                                        const isListrik = divisi === 'Listrik';
                                        const sku = row.kode_barang || 'SKU-NONE';
                                        const qty = row.qty || 0;
                                        const unit = row.unit || 'Unit';

                                        return (
                                            <tr key={recordId || idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 1 ? '#fafbfc' : '#ffffff' }}>
                                                {/* 1. TANGGAL MASUK */}
                                                <td style={{ padding: '12px 16px', color: '#475569', whiteSpace: 'nowrap' }}>
                                                    <div style={{ fontWeight: '700', color: '#0f172a' }}>{row.tanggal}</div>
                                                </td>

                                                {/* 2. PART NUMBER / SKU */}
                                                <td>
                                                    <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.80rem' }}>
                                                        {sku}
                                                    </span>
                                                </td>

                                                {/* 3. MATERIAL DITERIMA */}
                                                <td style={{ padding: '12px 16px', maxWidth: '240px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                                    <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.81rem', marginBottom: '3px' }}>
                                                        {row.nama_barang}
                                                    </div>
                                                    <div>
                                                        <span style={{ 
                                                            fontSize: '0.66rem', 
                                                            fontWeight: '700', 
                                                            padding: '2px 7px', 
                                                            borderRadius: '4px',
                                                            whiteSpace: 'nowrap',
                                                            display: 'inline-block',
                                                            background: isListrik ? '#e0f2fe' : '#fef3c7',
                                                            color: isListrik ? '#0284c7' : '#b45309',
                                                            border: isListrik ? '1px solid #bae6fd' : '1px solid #fde68a'
                                                        }}>
                                                            Gudang {divisi}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* 4. VOLUME MASUK */}
                                                <td style={{ whiteSpace: 'nowrap' }}>
                                                    <span style={{ color: '#059669', fontWeight: '800', fontSize: '0.84rem' }}>
                                                        +{qty} <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{unit}</span>
                                                    </span>
                                                </td>

                                                {/* 5. CHECKER GUDANG */}
                                                <td>
                                                    <div style={{ fontWeight: '700', color: '#0f172a' }}>
                                                        {row.diterima_oleh && row.diterima_oleh !== '-' ? row.diterima_oleh : defaultChecker}
                                                    </div>
                                                </td>

                                                {/* 6. KURIR & DOKUMEN PO */}
                                                <td style={{ maxWidth: '250px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                                    <div style={{ color: '#0f172a', fontWeight: '700', fontSize: '0.78rem' }}>
                                                        {cleanVendor}
                                                    </div>
                                                    {cleanKet ? (
                                                        <div style={{ fontSize: '0.70rem', color: '#64748b', marginTop: '2px', fontWeight: '500' }}>
                                                            Ref: {cleanKet}
                                                        </div>
                                                    ) : (
                                                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '1px' }}>
                                                            Tanpa catatan dokumen
                                                        </div>
                                                    )}
                                                </td>

                                                {/* 7. AKSI: TOMBOL HAPUS HANYA JIKA BUKAN MANAGER */}
                                                {!isManager && (
                                                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap', padding: '12px 14px' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteInbound(recordId, sku, qty, unit)}
                                                            title="Hapus catatan barang masuk ini dan kurangi stok fisik rak"
                                                            className="btn btn-sm"
                                                            style={{
                                                                border: '1px solid #fee2e2',
                                                                background: '#fef2f2',
                                                                color: '#dc2626',
                                                                borderRadius: '6px',
                                                                padding: '4px 10px',
                                                                cursor: 'pointer',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                fontSize: '0.72rem',
                                                                fontWeight: '700',
                                                                transition: 'all 0.15s ease'
                                                            }}
                                                        >
                                                            <Trash2 size={12} />
                                                            <span>Hapus</span>
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={!isManager ? "7" : "6"} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                                            Tidak ada catatan barang masuk untuk {selectedDivisi === 'Semua' ? 'semua gudang' : `Gudang ${selectedDivisi}`}.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination 
                        currentPage={currentPage} 
                        totalItems={filteredList.length} 
                        itemsPerPage={itemsPerPage} 
                        onPageChange={(page) => setCurrentPage(page)} 
                    />
                </div>

                {/* MODAL INPUT BARANG MASUK HANYA JIKA BUKAN MANAGER */}
                {!isManager && showModal && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(15, 23, 42, 0.45)',
                        backdropFilter: 'blur(5px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1050,
                        padding: '20px'
                    }}>
                        <div style={{
                            background: '#ffffff',
                            borderRadius: '16px',
                            width: '100%',
                            maxWidth: '580px',
                            maxHeight: '90vh',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.18)',
                            border: '1px solid #e2e8f0',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                padding: '18px 24px',
                                borderBottom: '1px solid #f1f5f9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: '#ffffff'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '38px',
                                        height: '38px',
                                        borderRadius: '10px',
                                        background: '#ecfdf5',
                                        border: '1px solid #a7f3d0',
                                        color: '#059669',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <ArrowDownLeft size={20} strokeWidth={2.4} />
                                    </div>
                                    <div>
                                        <h6 style={{ fontWeight: '800', color: '#0f172a', margin: 0, fontSize: '1.05rem', letterSpacing: '-0.2px' }}>
                                            Input Barang Masuk & Verifikasi Checker
                                        </h6>
                                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                                            Penerimaan material fisik gudang dan penambahan saldo rak
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    style={{
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        padding: '6px',
                                        color: '#64748b',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <X size={15} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmitInbound} style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px' }}>
                                    <div style={{ fontSize: '0.66rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Package size={13} color="#059669" />
                                        <span>1. Spesifikasi Material & Kuantitas Masuk</span>
                                    </div>

                                    <div style={{ marginBottom: '10px' }}>
                                        <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '5px', display: 'block' }}>
                                            Pilih Material SKU <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <SearchableSkuSelect
                                            value={data.id_barang}
                                            onChange={(val) => setData('id_barang', val)}
                                            options={barangOptions}
                                            error={errors.id_barang}
                                        />
                                        {errors.id_barang && (
                                            <div style={{ fontSize: '0.68rem', color: '#ef4444', marginTop: '3px' }}>
                                                {errors.id_barang}
                                            </div>
                                        )}
                                    </div>

                                    {selectedBarang && (
                                        <div style={{
                                            background: '#ffffff',
                                            border: '1px solid #bbf7d0',
                                            borderRadius: '9px',
                                            padding: '10px 12px',
                                            marginBottom: '10px',
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(3, 1fr)',
                                            gap: '8px'
                                        }}>
                                            <div>
                                                <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Gudang & Saldo Awal</div>
                                                <div style={{ fontSize: '0.90rem', fontWeight: '800', color: '#0f172a' }}>
                                                    {stokAwal} <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{selectedBarang.unit}</span> (Gudang {resolveDivisi(selectedBarang)})
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Wilayah Distrik</div>
                                                <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#059669', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                                                    <MapPin size={11} /> {selectedBarang.distrik || 'Distrik Utama'}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.62rem', color: '#047857', fontWeight: '800', textTransform: 'uppercase' }}>Estimasi Saldo Baru</div>
                                                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#059669' }}>
                                                    {estimasiStokBaru} <span style={{ fontSize: '0.68rem', color: '#059669' }}>{selectedBarang.unit}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                                        <div>
                                            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '5px', display: 'block' }}>
                                                Tanggal Masuk <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <input
                                                type="date"
                                                className="form-control form-control-sm"
                                                value={data.tanggal}
                                                onChange={(e) => setData('tanggal', e.target.value)}
                                                required
                                                style={{ borderRadius: '8px', fontSize: '0.78rem', borderColor: '#cbd5e1', padding: '6px 10px', backgroundColor: '#ffffff' }}
                                            />
                                        </div>

                                        <div>
                                            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '5px', display: 'block' }}>
                                                Jumlah Diterima {selectedBarang ? `(${selectedBarang.unit})` : ''} <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                className="form-control form-control-sm"
                                                value={data.qty}
                                                onChange={(e) => setData('qty', e.target.value)}
                                                required
                                                style={{ borderRadius: '8px', fontSize: '0.78rem', borderColor: errors.qty ? '#ef4444' : '#cbd5e1', padding: '6px 10px', fontWeight: '700', backgroundColor: '#ffffff' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px' }}>
                                    <div style={{ fontSize: '0.66rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <UserCheck size={13} color="#0284c7" />
                                        <span>2. Verifikasi Checker & Kurir Pengirim</span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                                        <div>
                                            <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: '700', color: '#334155', marginBottom: '5px', display: 'block' }}>
                                                Diterima Oleh (Checker) <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Nama petugas checker gudang"
                                                value={data.diterima_oleh}
                                                onChange={(e) => setData('diterima_oleh', e.target.value)}
                                                required
                                                style={{ borderRadius: '8px', fontSize: '0.78rem', background: '#ffffff', borderColor: '#cbd5e1', fontWeight: '600', color: '#0f172a' }}
                                            />
                                        </div>

                                        <div>
                                            <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: '700', color: '#334155', marginBottom: '5px', display: 'block' }}>
                                                Diserahkan Oleh <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Nama Driver / Vendor Ekspedisi"
                                                value={data.diserahkan_oleh}
                                                onChange={(e) => setData('diserahkan_oleh', e.target.value)}
                                                required
                                                style={{ borderRadius: '8px', fontSize: '0.78rem', borderColor: errors.diserahkan_oleh ? '#ef4444' : '#cbd5e1', padding: '6px 10px' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px' }}>
                                    <div style={{ fontSize: '0.66rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <FileText size={13} color="#059669" />
                                        <span>3. Referensi Dokumen / Keterangan</span>
                                    </div>

                                    <div>
                                        <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: '700', color: '#334155', marginBottom: '5px', display: 'block' }}>
                                            No. PO / Catatan Surat Jalan Supplier
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            placeholder="Contoh: PO-889 / Pengiriman Vendor Truk 02"
                                            value={data.keterangan}
                                            onChange={(e) => setData('keterangan', e.target.value)}
                                            style={{ borderRadius: '8px', fontSize: '0.78rem', borderColor: '#cbd5e1', padding: '6px 10px' }}
                                        />
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    gap: '8px',
                                    paddingTop: '10px',
                                    borderTop: '1px solid #f1f5f9'
                                }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="btn btn-sm btn-light border"
                                        style={{
                                            borderRadius: '8px',
                                            fontSize: '0.78rem',
                                            fontWeight: '700',
                                            padding: '7px 16px',
                                            color: '#475569',
                                            background: '#ffffff',
                                            borderColor: '#cbd5e1'
                                        }}
                                    >
                                        Batal
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={processing || !data.id_barang}
                                        className="btn btn-sm text-white px-3"
                                        style={{
                                            background: '#059669',
                                            color: '#ffffff',
                                            borderRadius: '8px',
                                            fontSize: '0.78rem',
                                            fontWeight: '700',
                                            padding: '7px 20px',
                                            border: 'none',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
                                            cursor: processing || !data.id_barang ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        <ArrowDownLeft size={14} />
                                        <span>{processing ? 'Menyimpan...' : 'Simpan Inbound'}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}