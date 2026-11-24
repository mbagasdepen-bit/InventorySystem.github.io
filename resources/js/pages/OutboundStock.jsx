import React, { useState, useMemo } from 'react';
import { useForm, usePage, router } from '@inertiajs/react';
import Sidebar from '../Components/Sidebar';
import Pagination from '../Components/Pagination';
import NoticeBanner from '../Components/NoticeBanner.jsx';
import { 
    ArrowUpRight, 
    Search, 
    Plus, 
    X, 
    Package, 
    PackageMinus, 
    MapPin, 
    UserCheck, 
    ChevronDown, 
    AlertTriangle,  
    Boxes, 
    Filter, 
    Ban, 
    AlertCircle, 
    Trash2,
    ShieldCheck
} from 'lucide-react';

export const resolveDivisi = (item) => {
    if (!item) return 'Sipil';
    const rawDivisi = (item.divisi || item.barang?.divisi || '').toLowerCase();
    if (rawDivisi.includes('listrik') || rawDivisi.includes('elek')) return 'Listrik';
    if (rawDivisi.includes('sipil') || rawDivisi.includes('civil')) return 'Sipil';

    const kode = (item.kode_barang || item.part_number || item.barang?.kode_barang || '').toUpperCase();
    if (kode.startsWith('ELK') || kode.includes('LISTRIK')) return 'Listrik';
    if (kode.startsWith('CVL') || kode.includes('SIPIL')) return 'Sipil';

    const nama = (item.nama_barang || item.barang?.nama_barang || item.material || '').toLowerCase();
    if (nama.includes('kabel') || nama.includes('lampu') || nama.includes('saklar') || nama.includes('mcb') || nama.includes('listrik')) {
        return 'Listrik';
    }
    return 'Sipil';
};

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

function SearchableSkuSelect({ value, onChange, options = [], error }) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [filterGudangModal, setFilterGudangModal] = useState('Semua');

    const selectedItem = useMemo(() => {
        return options.find(opt => String(opt.id_barang || opt.id) === String(value)) || null;
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
                        borderColor: error ? '#ef4444' : (isOpen ? '#e11d48' : '#cbd5e1'),
                        boxShadow: isOpen ? '0 0 0 3px rgba(225, 29, 72, 0.12)' : 'none',
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
                                const itemId = item.id_barang || item.id;
                                const isSelected = String(itemId) === String(value);
                                const divName = resolveDivisi(item);
                                const isListrik = divName === 'Listrik';
                                const itemStok = Number(item.stok || 0);
                                const isItemEmpty = itemStok <= 0;

                                return (
                                    <div
                                        key={itemId}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            onChange(itemId);
                                            setIsOpen(false);
                                            setQuery('');
                                        }}
                                        style={{
                                            padding: '8px 10px',
                                            fontSize: '0.76rem',
                                            cursor: 'pointer',
                                            borderRadius: '6px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            background: isSelected ? '#fff1f2' : (isItemEmpty ? '#fffbfb' : 'transparent'),
                                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                                            marginBottom: '2px',
                                            userSelect: 'none',
                                            opacity: isItemEmpty ? 0.85 : 1
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSelected) e.currentTarget.style.background = isItemEmpty ? '#fee2e2' : '#f8fafc';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSelected) e.currentTarget.style.background = isItemEmpty ? '#fffbfb' : 'transparent';
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
                                                    background: isListrik ? '#eff6ff' : '#fefce8',
                                                    color: isListrik ? '#0284c7' : '#a16207',
                                                    border: isListrik ? '1px solid #bfdbfe' : '1px solid #fde68a'
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
                                        <div style={{ textAlign: 'right', marginLeft: '12px', whiteSpace: 'nowrap' }}>
                                            {isItemEmpty ? (
                                                <span style={{ color: '#dc2626', fontWeight: '800', fontSize: '0.70rem', background: '#fee2e2', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fecdd3' }}>
                                                    STOK HABIS (0)
                                                </span>
                                            ) : (
                                                <span style={{ color: '#059669', fontWeight: '800', fontSize: '0.74rem' }}>
                                                    Sisa: {itemStok} {item.unit || 'Unit'}
                                                </span>
                                            )}
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

export default function OutboundStock(props) {
    const pageProps = usePage().props;
    const userRole = (pageProps.auth?.user?.role || '').toLowerCase();
    const isManager = userRole === 'manager' || userRole.includes('manage');
    const defaultPicker = pageProps.auth?.user?.name || 'Administrator';

    const rawOutbound = 
        props.listKeluar || 
        props.barangKeluar || 
        props.outboundList || 
        pageProps.listKeluar || 
        [];

    const outboundList = Array.isArray(rawOutbound) 
        ? rawOutbound 
        : (Array.isArray(rawOutbound?.data) ? rawOutbound.data : []);

    const rawBarang = 
        props.barangOptions || 
        props.barangList || 
        props.barangs || 
        props.barang || 
        pageProps.barangOptions || 
        pageProps.barangList || 
        [];

    const barangList = Array.isArray(rawBarang) 
        ? rawBarang 
        : (Array.isArray(rawBarang?.data) ? rawBarang.data : []);

    const [search, setSearch] = useState(props.filters?.q || '');
    const [selectedDivisi, setSelectedDivisi] = useState('Semua');
    const [showModal, setShowModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const { data, setData, post, processing, reset, errors, clearErrors } = useForm({
        id_barang: '',
        barang_id: '',
        tanggal: new Date().toISOString().slice(0, 10),
        qty: '1',
        picker: defaultPicker,
        penerima: '',
        lokasi_proyek: '',
        keterangan: ''
    });

    const handleSelectSku = (val) => {
        const targetId = val;
        const selected = barangList.find(b => String(b.id_barang || b.id) === String(targetId));
        const sAwal = Number(selected?.stok || 0);

        setData(prev => ({
            ...prev,
            id_barang: targetId,
            barang_id: targetId,
            qty: sAwal <= 0 ? '0' : '1'
        }));
    };

    const selectedBarang = useMemo(() => {
        const targetId = data.id_barang || data.barang_id;
        return barangList.find(b => String(b.id_barang || b.id) === String(targetId)) || null;
    }, [barangList, data.id_barang, data.barang_id]);

    const stokAwal = Number(selectedBarang?.stok || 0);
    const minStok = Number(selectedBarang?.min_stok || 0);
    const qtyKeluar = Number(data.qty || 0);
    const isOutOfStock = Boolean(selectedBarang && stokAwal <= 0);
    const isExceeding = Boolean(selectedBarang && !isOutOfStock && qtyKeluar > stokAwal);
    const isUnderBuffer = Boolean(selectedBarang && !isOutOfStock && !isExceeding && (stokAwal - qtyKeluar) <= minStok);
    const estimasiSisa = isOutOfStock ? 0 : Math.max(0, stokAwal - qtyKeluar);

    const filteredList = useMemo(() => {
        const q = search.toLowerCase().trim();
        return outboundList.filter((item) => {
            const itemDivisi = resolveDivisi(item);
            const matchDivisi = selectedDivisi === 'Semua' || itemDivisi.toLowerCase() === selectedDivisi.toLowerCase();

            const kode = (item.kode_barang || item.part_number || '').toLowerCase();
            const nama = (item.nama_barang || item.material || '').toLowerCase();
            const penerima = (item.penerima || '').toLowerCase();
            const lokasi = (item.lokasi_proyek || '').toLowerCase();
            const ket = (item.keterangan || '').toLowerCase();
            const tgl = (item.tanggal || '').toLowerCase();

            const matchSearch = !q || 
                kode.includes(q) || 
                nama.includes(q) || 
                penerima.includes(q) || 
                lokasi.includes(q) || 
                ket.includes(q) || 
                tgl.includes(q);

            return matchDivisi && matchSearch;
        });
    }, [outboundList, search, selectedDivisi]);

    const paginatedList = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleSubmitOutbound = (e) => {
        e.preventDefault();
        clearErrors();

        if (isOutOfStock) {
            alert('Material ini kosong (0) di rak. Tidak bisa melakukan pengeluaran!');
            return;
        }

        if (isExceeding) {
            alert(`Jumlah pengeluaran (${qtyKeluar}) melebihi stok fisik rak yang tersedia (${stokAwal})!`);
            return;
        }

        post('/barang-keluar', {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setShowModal(false);
            }
        });
    };

    const handleVoidOutbound = (id, sku, qty, unit) => {
        if (!id || id === 'undefined') {
            alert('Gagal: ID transaksi tidak terbaca dari database!');
            return;
        }

        if (confirm(`Yakin ingin membatalkan pengeluaran material [${sku}] sebanyak ${qty} ${unit}?\n\nSaldo stok material akan langsung dikembalikan ke rak penyimpanan.`)) {
            const endpoint = window.location.pathname.includes('outbound') 
                ? `/outbound/${id}` 
                : `/barang-keluar/${id}`;

            router.delete(endpoint, {
                preserveScroll: true,
                onError: (err) => {
                    alert(err.general || 'Gagal membatalkan transaksi.');
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
            <Sidebar active="outbound" />

            <main style={{ flex: 1, padding: '28px 36px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h4 style={{ fontWeight: '800', color: '#0f172a', margin: 0, fontSize: '1.30rem', letterSpacing: '-0.3px' }}>
                            Mutasi Barang Keluar (Outbound)
                        </h4>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                            Pencatatan pengeluaran material fisik gudang, validasi PIC proyek, dan alokasi sektor lapangan
                        </div>
                    </div>

                    {/* Tombol Input HANYA MUNCUL jika BUKAN MANAGER */}
                    {!isManager && (
                        <button 
                            onClick={() => {
                                clearErrors();
                                setData({
                                    id_barang: '',
                                    barang_id: '',
                                    tanggal: new Date().toISOString().slice(0, 10),
                                    qty: '1',
                                    picker: defaultPicker,
                                    penerima: '',
                                    lokasi_proyek: '',
                                    keterangan: ''
                                });
                                setShowModal(true);
                            }}
                            className="btn btn-sm"
                            style={{ 
                                background: '#e11d48', 
                                color: '#ffffff', 
                                borderRadius: '8px', 
                                fontSize: '0.76rem', 
                                fontWeight: '700', 
                                padding: '8px 16px', 
                                border: 'none', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px', 
                                boxShadow: '0 2px 8px rgba(225, 29, 72, 0.25)' 
                            }}
                        >
                            <Plus size={15} /> Input Barang Keluar
                        </button>
                    )}
                </div>

                {pageProps.flash?.pesan && (
                    <div className="alert alert-success border-0 py-2 px-3 mb-3" style={{ borderRadius: '8px', fontSize: '0.8rem', background: '#ecfdf5', color: '#065f46' }}>
                        {pageProps.flash.pesan}
                    </div>
                )}

                <NoticeBanner 
                    title="Petunjuk Validasi Pengeluaran Material Lapangan"
                    description="Seluruh pengeluaran barang tercatat kronologis untuk menjaga sinkronisasi saldo fisik rak:"
                    icon={PackageMinus}
                    items={[
                        {
                            title: 'Pengecekan Saldo Rak',
                            desc: 'Pastikan fisik barang di rak mencukupi sebelum memvalidasi bon pengeluaran.',
                            icon: Boxes
                        },
                        {
                            title: 'Otentikasi Serah Terima',
                            desc: 'Catat nama mandor atau PIC proyek yang menerima barang secara fisik di gudang.',
                            icon: UserCheck
                        },
                        {
                            title: 'Validasi & Pembatalan',
                            desc: 'Gunakan tombol batal jika terjadi revisi pengambilan barang fisik di lapangan.',
                            icon: ShieldCheck
                        }
                    ]}
                />

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderTop: '3.5px solid #059669', borderRadius: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fff1f2', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ArrowUpRight size={18} strokeWidth={2.4} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.94rem', fontWeight: '800', color: '#0f172a' }}>
                                    Riwayat Mutasi Keluar
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                    Total {filteredList.length} transaksi pengeluaran material terdata
                                </div>
                            </div>
                        </div>

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
                                    placeholder="Cari SKU, nama, penerima, sektor..." 
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
                                    <th style={{ ...thStyle, width: '130px' }}>TANGGAL KELUAR</th>
                                    <th style={{ ...thStyle, width: '160px' }}>PART NUMBER / SKU</th>
                                    <th style={{ ...thStyle, minWidth: '240px' }}>MATERIAL DISERAHKAN</th>
                                    <th style={{ ...thStyle, textAlign: 'center', width: '130px' }}>VOLUME KELUAR</th>
                                    <th style={thStyle}>MANDOR PENERIMA</th>
                                    <th style={{ ...thStyle, maxWidth: '250px' }}>SEKTOR PROYEK</th>
                                    {/* Kolom Aksi hanya muncul jika BUKAN MANAGER */}
                                    {!isManager && <th style={{ ...thStyle, textAlign: 'center', width: '90px' }}>AKSI</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedList.length > 0 ? (
                                    paginatedList.map((row, idx) => {
                                        const recordId = row.id_keluar || row.id || row.id_bk;
                                        const tgl = row.tanggal || '-';
                                        const sku = row.kode_barang || 'SKU-NONE';
                                        const nama = row.nama_barang || 'Material Gudang';
                                        const qty = row.qty || 0;
                                        const unit = row.unit || 'Unit';
                                        const picker = row.picker || 'Petugas Gudang';
                                        const penerima = row.penerima || '-';
                                        const divisi = resolveDivisi(row);
                                        const isListrik = divisi === 'Listrik';
                                        
                                        const rawLokasi = (row.lokasi_proyek || '').trim();
                                        const rawKet = (row.keterangan || '').trim();
                                        const cleanLokasi = (rawLokasi && rawLokasi !== '-') ? rawLokasi : '';
                                        const cleanKet = (rawKet && rawKet !== '-') ? rawKet : '';

                                        return (
                                            <tr key={recordId || idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 1 ? '#fafbfc' : '#ffffff' }}>
                                                {/* 1. TANGGAL KELUAR */}
                                                <td style={{ padding: '12px 16px', color: '#475569', whiteSpace: 'nowrap' }}>
                                                    <div style={{ fontWeight: '700', color: '#0f172a' }}>{tgl}</div>
                                                </td>

                                                {/* 2. PART NUMBER / SKU */}
                                                <td>
                                                    <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.80rem' }}>
                                                        {sku}
                                                    </span>
                                                </td>

                                                {/* 3. MATERIAL DISERAHKAN */}
                                                <td style={{ padding: '12px 16px', minWidth: '240px' }}>
                                                    <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.81rem', marginBottom: '4px' }}>
                                                        {nama}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                        <span style={{ 
                                                            fontSize: '0.67rem', 
                                                            fontWeight: '700', 
                                                            padding: '2px 7px', 
                                                            borderRadius: '4px',
                                                            whiteSpace: 'nowrap',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            background: isListrik ? '#eff6ff' : '#fefce8',
                                                            color: isListrik ? '#0284c7' : '#a16207',
                                                            border: isListrik ? '1px solid #bfdbfe' : '1px solid #fde68a'
                                                        }}>
                                                            Gudang {divisi}
                                                        </span>
                                                        <span style={{ 
                                                            fontSize: '0.68rem', 
                                                            color: '#64748b',
                                                            background: '#f8fafc',
                                                            border: '1px solid #e2e8f0',
                                                            padding: '2px 7px',
                                                            borderRadius: '4px',
                                                            whiteSpace: 'nowrap',
                                                            display: 'inline-flex',
                                                            alignItems: 'center'
                                                        }}>
                                                            Picker: {picker}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* 4. VOLUME KELUAR */}
                                                <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                                                    <span style={{ color: '#e11d48', fontWeight: '800', fontSize: '0.84rem' }}>
                                                        -{qty} <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{unit}</span>
                                                    </span>
                                                </td>

                                                {/* 5. MANDOR PENERIMA */}
                                                <td>
                                                    <div style={{ fontWeight: '700', color: '#0f172a' }}>
                                                        {penerima}
                                                    </div>
                                                </td>

                                                {/* 6. SEKTOR PROYEK */}
                                                <td style={{ maxWidth: '250px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                                    <div style={{ color: '#0f172a', fontWeight: '700', fontSize: '0.78rem', wordBreak: 'break-all' }}>
                                                        {cleanLokasi || '-'}
                                                    </div>
                                                    {cleanKet ? (
                                                        <div style={{ fontSize: '0.70rem', color: '#64748b', marginTop: '2px', fontWeight: '500', wordBreak: 'break-all' }}>
                                                            Ref: {cleanKet}
                                                        </div>
                                                    ) : (
                                                        !cleanLokasi && (
                                                            <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '1px' }}>
                                                                Tanpa catatan dokumen
                                                            </div>
                                                        )
                                                    )}
                                                </td>

                                                {/* 7. AKSI: HAPUS HANYA JIKA BUKAN MANAGER */}
                                                {!isManager && (
                                                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap', padding: '12px 14px' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleVoidOutbound(recordId, sku, qty, unit)}
                                                            title="Batalkan pengeluaran ini dan kembalikan stok fisik ke rak"
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
                                                            onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = '#fef2f2'}
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
                                            Tidak ada rekaman pengeluaran untuk {selectedDivisi === 'Semua' ? 'semua gudang' : `Gudang ${selectedDivisi}`}.
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

                {/* MODAL INPUT HANYA JIKA BUKAN MANAGER */}
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
                                        background: '#fff1f2',
                                        border: '1px solid #fecdd3',
                                        color: '#e11d48',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <ArrowUpRight size={20} strokeWidth={2.4} />
                                    </div>
                                    <div>
                                        <h6 style={{ fontWeight: '800', color: '#0f172a', margin: 0, fontSize: '1.05rem', letterSpacing: '-0.2px' }}>
                                            Input Barang Keluar & Validasi Lapangan
                                        </h6>
                                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                                            Pencatatan penyerahan material fisik dari rak ke proyek
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

                            <form onSubmit={handleSubmitOutbound} style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {Object.keys(errors).length > 0 && (
                                    <div style={{ background: '#fef2f2', border: '1px solid #fecdd3', borderRadius: '8px', padding: '10px 14px', color: '#991b1b', fontSize: '0.75rem', fontWeight: '600' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                            <AlertTriangle size={14} color="#dc2626" />
                                            <span>Terjadi Kendala Validasi:</span>
                                        </div>
                                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                            {Object.entries(errors).map(([k, msg]) => (
                                                <li key={k}>{msg}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px' }}>
                                    <div style={{ fontSize: '0.66rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Package size={13} color="#e11d48" />
                                        <span>1. Spesifikasi Material & Kuantitas Keluar</span>
                                    </div>

                                    <div style={{ marginBottom: '10px' }}>
                                        <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '5px', display: 'block' }}>
                                            Pilih Material SKU <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <SearchableSkuSelect
                                            value={data.id_barang || data.barang_id}
                                            onChange={handleSelectSku}
                                            options={barangList}
                                            error={errors.id_barang || errors.barang_id}
                                        />
                                    </div>

                                    {selectedBarang && (
                                        <>
                                            <div style={{
                                                background: (isOutOfStock || isExceeding) ? '#fff1f2' : '#ffffff',
                                                border: (isOutOfStock || isExceeding) 
                                                    ? '1.5px solid #fecdd3' 
                                                    : (isUnderBuffer ? '1.5px solid #fef08a' : '1px solid #e2e8f0'),
                                                borderRadius: '9px',
                                                padding: '10px 12px',
                                                marginBottom: '10px',
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(3, 1fr)',
                                                gap: '8px',
                                                transition: 'all 0.2s ease'
                                            }}>
                                                <div>
                                                    <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                                                        Gudang & Stok Fisik
                                                    </div>
                                                    <div style={{ fontSize: '0.90rem', fontWeight: '800', color: isOutOfStock ? '#dc2626' : '#0f172a' }}>
                                                        {stokAwal} <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{selectedBarang.unit}</span> (Gudang {resolveDivisi(selectedBarang)})
                                                    </div>
                                                </div>

                                                <div>
                                                    <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                                                        Titik Rak Simpan
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#059669', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                                                        <MapPin size={11} /> {selectedBarang.remarks || selectedBarang.distrik || 'Rak Utama'}
                                                    </div>
                                                </div>

                                                <div>
                                                    <div style={{ 
                                                        fontSize: '0.62rem', 
                                                        color: (isOutOfStock || isExceeding) ? '#dc2626' : (isUnderBuffer ? '#b45309' : '#059669'), 
                                                        fontWeight: '800', 
                                                        textTransform: 'uppercase' 
                                                    }}>
                                                        Estimasi Sisa Stok
                                                    </div>
                                                    <div style={{ fontSize: '0.86rem', fontWeight: '800', color: (isOutOfStock || isExceeding) ? '#dc2626' : '#0f172a', marginTop: '2px' }}>
                                                        {isOutOfStock ? (
                                                            <span style={{ color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                                <Ban size={12} /> HABIS (0 {selectedBarang.unit})
                                                            </span>
                                                        ) : isExceeding ? (
                                                            <span style={{ color: '#dc2626' }}>
                                                                TIDAK CUKUP (Kurang {qtyKeluar - stokAwal})
                                                            </span>
                                                        ) : (
                                                            <span>
                                                                {estimasiSisa} <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{selectedBarang.unit}</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {isOutOfStock && (
                                                <div style={{
                                                    background: '#fee2e2',
                                                    border: '1.5px solid #f87171',
                                                    borderRadius: '8px',
                                                    padding: '9px 12px',
                                                    marginBottom: '10px',
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: '8px',
                                                    fontSize: '0.74rem',
                                                    color: '#991b1b',
                                                    fontWeight: '700'
                                                }}>
                                                    <Ban size={15} color="#dc2626" style={{ marginTop: '2px', flexShrink: 0 }} />
                                                    <div>
                                                        <div>Material Ini Sedang Kosong (0 {selectedBarang.unit}) di Rak!</div>
                                                        <div style={{ fontSize: '0.68rem', fontWeight: '500', color: '#b91c1c', marginTop: '1px' }}>
                                                            Pengeluaran material tidak dapat dilakukan. Lakukan transaksi Barang Masuk (Inbound) terlebih dahulu.
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {isExceeding && !isOutOfStock && (
                                                <div style={{
                                                    background: '#fff1f2',
                                                    border: '1.5px solid #fecdd3',
                                                    borderRadius: '8px',
                                                    padding: '9px 12px',
                                                    marginBottom: '10px',
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: '8px',
                                                    fontSize: '0.74rem',
                                                    color: '#991b1b',
                                                    fontWeight: '700'
                                                }}>
                                                    <AlertCircle size={15} color="#dc2626" style={{ marginTop: '2px', flexShrink: 0 }} />
                                                    <div>
                                                        <div>Kuantitas Pengeluaran Melebihi Stok Rak!</div>
                                                        <div style={{ fontSize: '0.68rem', fontWeight: '500', color: '#b91c1c', marginTop: '1px' }}>
                                                            Anda menginput {qtyKeluar} {selectedBarang.unit}, sedangkan fisik barang di rak hanya tersisa {stokAwal} {selectedBarang.unit}.
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                                        <div>
                                            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '5px', display: 'block' }}>
                                                Tanggal Keluar <span style={{ color: '#ef4444' }}>*</span>
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
                                            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: '700', color: isOutOfStock ? '#94a3b8' : '#334155', marginBottom: '5px', display: 'block' }}>
                                                Jumlah Keluar {selectedBarang ? `(${selectedBarang.unit})` : ''} <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                disabled={isOutOfStock}
                                                placeholder={isOutOfStock ? '0' : '1'}
                                                className="form-control form-control-sm"
                                                value={isOutOfStock ? '0' : data.qty}
                                                onFocus={(e) => e.target.select()}
                                                onChange={(e) => {
                                                    let val = e.target.value.replace(/\D/g, '');
                                                    val = val.replace(/^0+(?=\d)/, '');
                                                    setData('qty', val);
                                                }}
                                                onBlur={() => {
                                                    if (!data.qty || Number(data.qty) <= 0) {
                                                        setData('qty', isOutOfStock ? '0' : '1');
                                                    }
                                                }}
                                                required
                                                style={{ 
                                                    borderRadius: '8px', 
                                                    fontSize: '0.82rem', 
                                                    borderColor: (isOutOfStock || isExceeding) ? '#ef4444' : '#cbd5e1', 
                                                    padding: '6px 10px', 
                                                    fontWeight: '800', 
                                                    backgroundColor: isOutOfStock ? '#f1f5f9' : '#ffffff',
                                                    color: (isOutOfStock || isExceeding) ? '#dc2626' : '#0f172a',
                                                    cursor: isOutOfStock ? 'not-allowed' : 'text'
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px' }}>
                                    <div style={{ fontSize: '0.66rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <UserCheck size={13} color="#0284c7" />
                                        <span>2. Serah Terima Lapangan</span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                                        <div>
                                            <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: '700', color: '#334155', marginBottom: '5px', display: 'block' }}>
                                                Disiapkan Oleh (Picker Gudang) <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Nama petugas picker gudang"
                                                value={data.picker}
                                                onChange={(e) => setData('picker', e.target.value)}
                                                required
                                                style={{ borderRadius: '8px', fontSize: '0.78rem', background: '#ffffff', borderColor: '#cbd5e1', fontWeight: '600', color: '#0f172a' }}
                                            />
                                        </div>

                                        <div>
                                            <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: '700', color: '#334155', marginBottom: '5px', display: 'block' }}>
                                                Diterima Oleh (PIC Proyek / Mandor) <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Nama Mandor / PIC Lapangan"
                                                value={data.penerima}
                                                onChange={(e) => setData('penerima', e.target.value)}
                                                required
                                                style={{ borderRadius: '8px', fontSize: '0.78rem', borderColor: errors.penerima ? '#ef4444' : '#cbd5e1', padding: '6px 10px' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px' }}>
                                    <div style={{ fontSize: '0.66rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <MapPin size={13} color="#e11d48" />
                                        <span>3. Alokasi Sektor & Keperluan Proyek</span>
                                    </div>

                                    <div style={{ marginBottom: '10px' }}>
                                        <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: '700', color: '#334155', marginBottom: '5px', display: 'block' }}>
                                            Lokasi / Sektor Proyek Lapangan <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            placeholder="Contoh: Gedung A Lantai 2 / Mess Pekerja Blok C"
                                            value={data.lokasi_proyek}
                                            onChange={(e) => setData('lokasi_proyek', e.target.value)}
                                            required
                                            style={{ borderRadius: '8px', fontSize: '0.78rem', borderColor: errors.lokasi_proyek ? '#ef4444' : '#cbd5e1', padding: '6px 10px' }}
                                        />
                                    </div>

                                    <div>
                                        <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: '700', color: '#334155', marginBottom: '5px', display: 'block' }}>
                                            Keperluan / Keterangan Proyek
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            placeholder="Contoh: Instalasi Kabel Jalur Utama"
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
                                        disabled={processing || isOutOfStock || isExceeding || (!data.id_barang && !data.barang_id)}
                                        className="btn btn-sm text-white px-3"
                                        style={{
                                            background: (isOutOfStock || isExceeding || (!data.id_barang && !data.barang_id)) ? '#94a3b8' : '#e11d48',
                                            color: '#ffffff',
                                            borderRadius: '8px',
                                            fontSize: '0.78rem',
                                            fontWeight: '700',
                                            padding: '7px 20px',
                                            border: 'none',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            boxShadow: (isOutOfStock || isExceeding || (!data.id_barang && !data.barang_id)) ? 'none' : '0 2px 8px rgba(225, 29, 72, 0.25)',
                                            cursor: (processing || isOutOfStock || isExceeding || (!data.id_barang && !data.barang_id)) ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.15s ease'
                                        }}
                                    >
                                        <ArrowUpRight size={14} />
                                        <span>
                                            {isOutOfStock 
                                                ? 'Stok Fisik Habis (0)' 
                                                : (isExceeding 
                                                    ? 'Kuantitas Melebihi Stok' 
                                                    : (processing ? 'Menyimpan...' : 'Simpan Outbound'))}
                                        </span>
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