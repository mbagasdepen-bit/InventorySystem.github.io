import React, { useState, useMemo } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import Sidebar from '../Components/Sidebar';
import Pagination from '../Components/Pagination';
import NoticeBanner from '../Components/NoticeBanner.jsx';
import {
    Plus,
    Trash2,
    Edit,
    Eye,
    Search,
    Calendar,
    ChevronDown,
    Filter,
    MapPin,
    Building2,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Package,
    Layers,
    ClipboardList,
    ArrowUpRight,
    ArrowDownLeft,
    Activity,
    ArrowRightLeft,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    X
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function SearchableDropdown({ label, value, onChange, options = [], placeholder, required = false }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const safeOptions = Array.isArray(options) ? options : [];

    const filteredOptions = safeOptions.filter(opt =>
        (opt || '').toString().toLowerCase().includes((searchTerm || '').toLowerCase())
    );

    return (
        <div style={{ position: 'relative' }}>
            <label className="form-label small fw-bold text-secondary">{label}</label>
            <div style={{ position: 'relative' }}>
                <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder={placeholder}
                    value={value || ''}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => {
                        setSearchTerm('');
                        setIsOpen(true);
                    }}
                    required={required}
                    style={{ paddingRight: '28px', fontSize: '0.78rem' }}
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
                        padding: 0,
                        color: '#64748b'
                    }}
                >
                    <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                </button>
            </div>

            {isOpen && (
                <>
                    <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1060 }} />
                    <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                        maxHeight: '180px',
                        overflowY: 'auto',
                        zIndex: 1070,
                        padding: '4px'
                    }}>
                        <div style={{ padding: '4px 8px', fontSize: '0.64rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>
                            Pilih atau Cari:
                        </div>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt, i) => (
                                <div
                                    key={i}
                                    onClick={() => {
                                        onChange(opt);
                                        setIsOpen(false);
                                    }}
                                    style={{
                                        padding: '7px 10px',
                                        fontSize: '0.76rem',
                                        color: value === opt ? '#059669' : '#334155',
                                        fontWeight: value === opt ? '700' : '500',
                                        background: value === opt ? '#ecfdf5' : 'transparent',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = value === opt ? '#ecfdf5' : 'transparent'}
                                >
                                    {opt}
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '8px 10px', fontSize: '0.73rem', color: '#64748b' }}>
                                Belum ada di daftar. Menggunakan: <strong>"{searchTerm}"</strong>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default function Dashboard(props) {
    const rawBarangList = Array.isArray(props.barangList) ? props.barangList : (props.barangList?.data || []);
    const listDistrik = Array.isArray(props.listDistrik) ? props.listDistrik : [];
    const listAsalMaterial = Array.isArray(props.listAsalMaterial) ? props.listAsalMaterial : [];
    const filters = props.filters || {};
    const flash = props.flash || {};

    const { auth } = usePage().props;
    const rawRole = (auth?.user?.role || 'gudang').toLowerCase();
    const isAdmin = rawRole.includes('admin') || rawRole.includes('super');

    const [search, setSearch] = useState('');
    const [selectedDivisi, setSelectedDivisi] = useState(filters?.divisi || '');
    const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'kritis', 'aman'

    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [selectedIds, setSelectedIds] = useState([]);

    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const [timeRange, setTimeRange] = useState('monthly');
    const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredBarang = useMemo(() => {
        const q = search.toLowerCase().trim();
        let result = rawBarangList.filter((item) => {
            const matchesDivisi = !selectedDivisi || item.divisi === selectedDivisi;
            const isItemKritis = item.is_kritis || Number(item.stok) <= Number(item.min_stok);
            const matchesStatus =
                statusFilter === 'all'
                    ? true
                    : statusFilter === 'kritis'
                        ? isItemKritis
                        : !isItemKritis;

            const matchesQuery =
                !q ||
                item.kode_barang?.toLowerCase().includes(q) ||
                item.nama_barang?.toLowerCase().includes(q) ||
                item.distrik?.toLowerCase().includes(q) ||
                item.asal_material?.toLowerCase().includes(q) ||
                item.remarks?.toLowerCase().includes(q);

            return matchesDivisi && matchesStatus && matchesQuery;
        });

        if (sortConfig.key) {
            result.sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];

                if (sortConfig.key === 'stok' || sortConfig.key === 'min_stok') {
                    aVal = Number(aVal || 0);
                    bVal = Number(bVal || 0);
                } else {
                    aVal = (aVal || '').toString().toLowerCase();
                    bVal = (bVal || '').toString().toLowerCase();
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [rawBarangList, selectedDivisi, statusFilter, search, sortConfig]);

    const [selectedBarangId, setSelectedBarangId] = useState(rawBarangList[0]?.id_barang || null);
    const activeItem = useMemo(() => {
        return rawBarangList.find(b => String(b.id_barang) === String(selectedBarangId)) || filteredBarang[0] || rawBarangList[0] || null;
    }, [rawBarangList, selectedBarangId, filteredBarang]);

    const [detailItem, setDetailItem] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const paginatedBarang = filteredBarang.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const isAllSelected = paginatedBarang.length > 0 && paginatedBarang.every(item => selectedIds.includes(item.id_barang));

    const handleSelectAll = () => {
        const currentPageIds = paginatedBarang.map(item => item.id_barang);
        if (isAllSelected) {
            setSelectedIds(prev => prev.filter(id => !currentPageIds.includes(id)));
        } else {
            setSelectedIds(prev => Array.from(new Set([...prev, ...currentPageIds])));
        }
    };

    const handleToggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
        );
    };

    const handleBatchDelete = () => {
        if (confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} material yang dicentang secara masal?`)) {
            router.post('/barang/batch-delete', { ids: selectedIds }, {
                preserveScroll: true,
                onSuccess: () => setSelectedIds([])
            });
        }
    };

    const { data, setData, post, processing, reset } = useForm({
        divisi: 'Sipil',
        kode_barang: '',
        nama_barang: '',
        unit: 'Pcs',
        stok: 0,
        min_stok: 5,
        remarks: 'Rak A-01',
        distrik: listDistrik[0] || 'Distrik Pekanbaru Barat',
        harga: 0,
        asal_material: listAsalMaterial[0] || 'Distributor Konstruksi (Lokal)',
    });

    const editForm = useForm({
        id_barang: '',
        divisi: 'Sipil',
        kode_barang: '',
        nama_barang: '',
        unit: 'Pcs',
        stok: 0,
        min_stok: 5,
        remarks: '',
        distrik: '',
        harga: 0,
        asal_material: '',
    });

    const submitTambahBarang = (e) => {
        e.preventDefault();
        post('/barang', {
            onSuccess: () => {
                reset();
                setShowModal(false);
            }
        });
    };

    const handleOpenEdit = (item) => {
        editForm.setData({
            id_barang: item.id_barang,
            divisi: item.divisi,
            kode_barang: item.kode_barang,
            nama_barang: item.nama_barang,
            unit: item.unit,
            stok: item.stok,
            min_stok: item.min_stok,
            remarks: item.remarks,
            distrik: item.distrik,
            harga: 0,
            asal_material: item.asal_material,
        });
        setShowEditModal(true);
    };

    const submitEditBarang = (e) => {
        e.preventDefault();
        editForm.put(`/barang/${editForm.data.id_barang}`, {
            onSuccess: () => {
                setShowEditModal(false);
            }
        });
    };

    const handleOpenDetail = (item) => {
        setDetailItem(item);
        setSelectedBarangId(item.id_barang);
        setShowDetailModal(true);
    };

    const handleDelete = (id, nama) => {
        if (confirm(`Hapus material "${nama}" dari sistem inventaris?`)) {
            router.delete(`/barang/${id}`, { preserveScroll: true });
        }
    };

    const currentDivisiLabel = !selectedDivisi
        ? 'Semua Gudang'
        : selectedDivisi === 'Sipil'
            ? 'Gudang Sipil'
            : 'Gudang Listrik';

    const periodConfigs = {
        weekly: { title: 'Mingguan (Sen - Jum)', subtitle: 'Histori mutasi harian kerja aktif (Senin s/d Jumat)' },
        monthly: { title: 'Bulanan (Jan - Des)', subtitle: 'Histori mutasi bulanan tahun berjalan (Bulan 1 s/d 12)' },
        yearly: { title: 'Tahunan (3 Tahun)', subtitle: 'Histori mutasi tahunan 3 tahun terakhir' },
    };

    const currentTrend = useMemo(() => {
        if (!activeItem) return { labels: ['-'], inbound: [0], outbound: [0] };
        if (timeRange === 'weekly') {
            return activeItem.trend_weekly || { labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum'], inbound: [0, 0, 0, 0, 0], outbound: [0, 0, 0, 0, 0] };
        }
        if (timeRange === 'yearly') {
            return activeItem.trend_yearly || { labels: ['2024', '2025', '2026'], inbound: [0, 0, 0], outbound: [0, 0, 0] };
        }
        return activeItem.trend_monthly || { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'], inbound: Array(12).fill(0), outbound: Array(12).fill(0) };
    }, [activeItem, timeRange]);

    const trendLabels = currentTrend.labels?.length ? currentTrend.labels : ['-'];
    const trendInboundData = currentTrend.inbound?.length ? currentTrend.inbound : [0];
    const trendOutboundData = currentTrend.outbound?.length ? currentTrend.outbound : [0];

    const sumPeriodIn = trendInboundData.reduce((acc, curr) => acc + curr, 0);
    const sumPeriodOut = trendOutboundData.reduce((acc, curr) => acc + curr, 0);
    const netFlow = sumPeriodIn - sumPeriodOut;

    // KALKULASI BUFFER LOGISTIK
    const currentStok = Number(activeItem?.stok || 0);
    const minBuffer = Number(activeItem?.min_stok || 1);
    const rawRatio = Math.round((currentStok / minBuffer) * 100);
    const cappedRatio = Math.min(100, Math.max(0, rawRatio));
    const stockDelta = currentStok - minBuffer;
    const isCritical = activeItem ? (activeItem.is_kritis || currentStok <= minBuffer) : false;

    const lineChartData = {
        labels: trendLabels,
        datasets: [
            {
                label: 'Inbound (+Masuk)',
                data: trendInboundData,
                borderColor: '#059669',
                backgroundColor: 'rgba(5, 150, 105, 0.08)',
                fill: true,
                tension: 0.35,
                pointRadius: 4,
                pointBackgroundColor: '#059669',
                borderWidth: 2.2,
            },
            {
                label: 'Outbound (-Keluar)',
                data: trendOutboundData,
                borderColor: '#e11d48',
                backgroundColor: 'rgba(225, 29, 72, 0.05)',
                fill: true,
                tension: 0.35,
                pointRadius: 4,
                pointBackgroundColor: '#e11d48',
                borderWidth: 2.2,
            }
        ]
    };

    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#0f172a',
                padding: 10,
                titleFont: { size: 11, weight: '700' },
                bodyFont: { size: 11 },
                callbacks: {
                    label: (context) => ` ${context.dataset.label}: ${context.raw} ${activeItem?.unit || 'Unit'}`
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: '#f1f5f9' },
                ticks: { font: { size: 10 }, color: '#94a3b8', precision: 0 },
                border: { display: false }
            },
            x: {
                grid: { display: false },
                ticks: { font: { size: 10, weight: '600' }, color: '#64748b' },
                border: { display: false }
            }
        }
    };

    const renderSortIcon = (key) => {
        if (sortConfig.key !== key) return <ArrowUpDown size={11} color="#94a3b8" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp size={11} color="#059669" />
            : <ArrowDown size={11} color="#059669" />;
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', color: '#1e293b', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

            <style>{`
                .katalog-row {
                    cursor: pointer;
                    transition: all 0.12s ease;
                    border-left: 3.5px solid transparent;
                }
                .katalog-row:hover:not(.is-selected-row) td {
                    background-color: #f8fafc !important;
                }
                .katalog-row:hover:not(.is-selected-row) {
                    border-left: 3.5px solid #cbd5e1 !important;
                }
                .katalog-row:hover:not(.is-selected-row) .part-number-text {
                    color: #0f172a !important;
                }
                .katalog-row.is-selected-row td {
                    background-color: #f1f5f9 !important;
                }
                .katalog-row.is-selected-row {
                    border-left: 3.5px solid #334155 !important;
                }
                .custom-checkbox {
                    width: 16px;
                    height: 16px;
                    cursor: pointer;
                    accent-color: #059669;
                    border-radius: 4px;
                    border: 1.5px solid #cbd5e1;
                    transition: all 0.1s ease;
                }
                .sortable-th {
                    cursor: pointer;
                    user-select: none;
                    transition: background-color 0.15s ease;
                }
                .sortable-th:hover {
                    background-color: #f1f5f9 !important;
                    color: #0f172a !important;
                }
            `}</style>

            <Sidebar active="dashboard" />

            <main style={{ flex: 1, padding: '28px 36px', overflowY: 'auto' }}>

                {/* Header Judul */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <h4 style={{ fontWeight: '800', color: '#0f172a', margin: 0, fontSize: '1.3rem', letterSpacing: '-0.3px' }}>
                            Katalog Master SKU & Stok Fisik
                        </h4>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                            Pusat pengelolaan master material, pemetaan lokasi rak gudang, dan pemantauan ambang batas minimum (safety stock)
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 14px', fontSize: '0.75rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                            <Calendar size={14} color="#059669" />
                            <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            <span style={{ color: '#cbd5e1' }}>•</span>
                            <span style={{ color: '#059669', fontSize: '0.7rem', fontWeight: '700' }}>Have A Nice Day</span>
                        </div>

                        {isAdmin && (
                            <button
                                onClick={() => setShowModal(true)}
                                className="btn btn-sm"
                                style={{ background: '#059669', color: '#ffffff', borderRadius: '8px', fontSize: '0.76rem', fontWeight: '600', padding: '7px 16px', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)' }}
                            >
                                <Plus size={14} /> Registrasi SKU Baru
                            </button>
                        )}
                    </div>
                </div>

                {flash?.pesan && (
                    <div className="alert alert-success border-0 py-2 px-3 mb-3" style={{ borderRadius: '8px', fontSize: '0.8rem', background: '#ecfdf5', color: '#065f46' }}>
                        {flash.pesan}
                    </div>
                )}

                {/* Banner Panduan */}
                <NoticeBanner
                    title="Pemberitahuan & Petunjuk Operasional Katalog Master SKU"
                    description="Modul sentral untuk registrasi spesifikasi material fisik, alokasi rak penyimpanan, dan pengawasan ambang batas kritis gudang:"
                    icon={Layers}
                    items={[
                        {
                            title: 'Registrasi & Kodifikasi SKU',
                            desc: 'Pendaftaran part number resmi, nama spesifikasi, asal vendor pabrikan, dan satuan unit fisik material.',
                            icon: Package
                        },
                        {
                            title: 'Pemetaan Rak & Wilayah Distrik',
                            desc: 'Alokasi lokasi rak simpan di gudang Sipil & Listrik agar mudah diinspeksi oleh staf logistik.',
                            icon: MapPin
                        },
                        {
                            title: 'Ambang Batas Minimum (Buffer Stock)',
                            desc: 'Peringatan otomatis status kritis jika saldo fisik di rak menyentuh batas aman persediaan.',
                            icon: AlertTriangle
                        }
                    ]}
                />

                {/* ============================================================== */}
                {/* TELEMETRI MATERIAL & TREN MUTASI                               */}
                {/* ============================================================== */}
                {activeItem ? (
                    <div className="row g-3 mb-4">
                        {/* KARTU KIRI: PROFIL MATERIAL & BUFFER INSTRUMENT */}
                        <div className="col-lg-5">
                            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '22px', boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 10px 25px -5px rgba(15, 23, 42, 0.04)', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '0.74rem', fontWeight: '800', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', padding: '3px 8px', borderRadius: '6px', letterSpacing: '0.02em' }}>
                                                {activeItem.kode_barang}
                                            </span>
                                            <span style={{ fontSize: '0.68rem', fontWeight: '700', padding: '2px 8px', borderRadius: '5px', background: activeItem.divisi === 'Listrik' ? '#eff6ff' : '#fefce8', color: activeItem.divisi === 'Listrik' ? '#0284c7' : '#a16207', border: `1px solid ${activeItem.divisi === 'Listrik' ? '#bfdbfe' : '#fde68a'}` }}>
                                                Divisi {activeItem.divisi}
                                            </span>
                                        </div>

                                        {isCritical ? (
                                            <span style={{ fontSize: '0.68rem', fontWeight: '800', color: '#b91c1c', background: '#fef2f2', padding: '3px 10px', borderRadius: '6px', border: '1px solid #fee2e2', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }}></span>
                                                Kritis (Restock)
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: '0.68rem', fontWeight: '800', color: '#047857', background: '#ecfdf5', padding: '3px 10px', borderRadius: '6px', border: '1px solid #a7f3d0', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669' }}></span>
                                                Stok Aman
                                            </span>
                                        )}
                                    </div>

                                    <h5 style={{ fontWeight: '800', color: '#0f172a', margin: '4px 0 2px', fontSize: '1.25rem', letterSpacing: '-0.3px', lineHeight: 1.25 }}>
                                        {activeItem.nama_barang}
                                    </h5>

                                    <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                                        <MapPin size={12} color="#059669" />
                                        <span>Lokasi Rak: <strong style={{ color: '#0f172a' }}>{activeItem.remarks || '-'}</strong></span>
                                        <span>•</span>
                                        <span>{activeItem.distrik}</span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '14px', marginBottom: '12px' }}>
                                        <div style={{ background: '#f8fafc', border: `1.5px solid ${isCritical ? '#fecdd3' : '#e2e8f0'}`, borderRadius: '12px', padding: '12px 14px' }}>
                                            <div style={{ fontSize: '0.63rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                Saldo Fisik Riil
                                            </div>
                                            <div style={{ fontSize: '1.45rem', fontWeight: '800', color: isCritical ? '#dc2626' : '#0f172a', margin: '2px 0' }}>
                                                {currentStok} <span style={{ fontSize: '0.76rem', fontWeight: '600', color: '#64748b' }}>{activeItem.unit}</span>
                                            </div>
                                            <div style={{ fontSize: '0.64rem', color: isCritical ? '#b91c1c' : '#059669', fontWeight: '700' }}>
                                                {isCritical ? `Defisit ${Math.abs(stockDelta)} ${activeItem.unit}` : `Surplus +${stockDelta} ${activeItem.unit}`}
                                            </div>
                                        </div>

                                        <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px' }}>
                                            <div style={{ fontSize: '0.63rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                Ambang Batas Min
                                            </div>
                                            <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#0f172a', margin: '2px 0' }}>
                                                {minBuffer} <span style={{ fontSize: '0.76rem', fontWeight: '600', color: '#64748b' }}>{activeItem.unit}</span>
                                            </div>
                                            <div style={{ fontSize: '0.64rem', color: '#64748b' }}>
                                                Batas safety stock
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '11px', padding: '11px 13px', marginBottom: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                Rasio Pemenuhan Buffer:
                                            </span>
                                            <div style={{ fontSize: '0.73rem', fontWeight: '800', color: isCritical ? '#dc2626' : '#059669' }}>
                                                {rawRatio}% <span style={{ fontSize: '0.66rem', fontWeight: '600', color: '#64748b' }}>({currentStok}/{minBuffer} {activeItem.unit})</span>
                                            </div>
                                        </div>

                                        <div style={{ position: 'relative', height: '7px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ width: `${cappedRatio}%`, height: '100%', background: isCritical ? '#ef4444' : '#059669', borderRadius: '4px', transition: 'width 0.4s ease' }} />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '9px', padding: '8px 10px' }}>
                                            <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Wilayah Distrik</div>
                                            <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#0f172a', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {activeItem.distrik}
                                            </div>
                                        </div>

                                        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '9px', padding: '8px 10px' }}>
                                            <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Vendor Pabrik</div>
                                            <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#0f172a', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {activeItem.asal_material || '-'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669' }}></span>
                                        <span>Status Master SKU Aktif</span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => router.get('/kartu-stok', { id_barang: activeItem.id_barang })}
                                        style={{ border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontSize: '0.72rem', fontWeight: '700', padding: '5px 12px', borderRadius: '7px', display: 'inline-flex', alignItems: 'center', gap: '5px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                                    >
                                        <ClipboardList size={12} color="#059669" />
                                        <span>Buku Besar Kartu Stok</span>
                                        <ArrowUpRight size={12} color="#64748b" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* KARTU KANAN: TREN KECEPATAN MUTASI & GRAFIK VISUAL */}
                        <div className="col-lg-7">
                            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '22px', boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 10px 25px -5px rgba(15, 23, 42, 0.04)', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Activity size={15} color="#059669" />
                                                <h5 style={{ fontWeight: '800', fontSize: '1.05rem', color: '#0f172a', margin: 0, letterSpacing: '-0.2px' }}>
                                                    Tren Mutasi: {activeItem.nama_barang}
                                                </h5>
                                            </div>
                                            <div style={{ fontSize: '0.69rem', color: '#64748b', marginTop: '2px' }}>
                                                {periodConfigs[timeRange].subtitle}
                                            </div>
                                        </div>

                                        <div style={{ position: 'relative' }}>
                                            <button
                                                type="button"
                                                onClick={() => setPeriodDropdownOpen(!periodDropdownOpen)}
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '5px 12px', fontSize: '0.74rem', fontWeight: '700', color: '#0f172a', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                                            >
                                                <Clock size={12} color="#059669" />
                                                <span>{periodConfigs[timeRange].title}</span>
                                                <ChevronDown size={13} color="#64748b" style={{ transform: periodDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                                            </button>

                                            {periodDropdownOpen && (
                                                <>
                                                    <div onClick={() => setPeriodDropdownOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 50 }} />
                                                    <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4px', minWidth: '185px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 60, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                        <button type="button" onClick={() => { setTimeRange('weekly'); setPeriodDropdownOpen(false); }} style={{ padding: '7px 10px', border: 'none', background: timeRange === 'weekly' ? '#f1f5f9' : 'transparent', color: timeRange === 'weekly' ? '#0f172a' : '#334155', fontWeight: timeRange === 'weekly' ? '700' : '500', fontSize: '0.74rem', textAlign: 'left', borderRadius: '6px', cursor: 'pointer' }}>Mingguan (Senin - Jumat)</button>
                                                        <button type="button" onClick={() => { setTimeRange('monthly'); setPeriodDropdownOpen(false); }} style={{ padding: '7px 10px', border: 'none', background: timeRange === 'monthly' ? '#f1f5f9' : 'transparent', color: timeRange === 'monthly' ? '#0f172a' : '#334155', fontWeight: timeRange === 'monthly' ? '700' : '500', fontSize: '0.74rem', textAlign: 'left', borderRadius: '6px', cursor: 'pointer' }}>Bulanan (Jan - Des)</button>
                                                        <button type="button" onClick={() => { setTimeRange('yearly'); setPeriodDropdownOpen(false); }} style={{ padding: '7px 10px', border: 'none', background: timeRange === 'yearly' ? '#f1f5f9' : 'transparent', color: timeRange === 'yearly' ? '#0f172a' : '#334155', fontWeight: timeRange === 'yearly' ? '700' : '500', fontSize: '0.74rem', textAlign: 'left', borderRadius: '6px', cursor: 'pointer' }}>Tahunan (3 Tahun)</button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px' }}>
                                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '7px 10px' }}>
                                            <div style={{ fontSize: '0.62rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Total Inbound</div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#059669', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px' }}>
                                                <ArrowDownLeft size={13} /> +{sumPeriodIn} {activeItem.unit}
                                            </div>
                                        </div>

                                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '7px 10px' }}>
                                            <div style={{ fontSize: '0.62rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Total Outbound</div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#e11d48', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px' }}>
                                                <ArrowUpRight size={13} /> -{sumPeriodOut} {activeItem.unit}
                                            </div>
                                        </div>

                                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '7px 10px' }}>
                                            <div style={{ fontSize: '0.62rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Net Inventory Flow</div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: '800', color: netFlow >= 0 ? '#059669' : '#e11d48', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px' }}>
                                                <ArrowRightLeft size={13} /> {netFlow >= 0 ? `+${netFlow}` : netFlow} {activeItem.unit}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ height: '145px', marginTop: '6px' }}>
                                        <Line data={lineChartData} options={lineChartOptions} />
                                    </div>
                                </div>

                                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', marginTop: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '0.66rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            4 Aktivitas Mutasi Terakhir:
                                        </span>
                                        <span style={{ fontSize: '0.64rem', color: '#94a3b8' }}>
                                            Histori riil gudang
                                        </span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))', gap: '6px' }}>
                                        {activeItem.recent_logs?.length > 0 ? (
                                            activeItem.recent_logs.map((log, idx) => {
                                                const isInbound = log.tipe === 'inbound';
                                                return (
                                                    <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '7px', padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                        <div style={{ fontSize: '0.76rem', fontWeight: '800', color: isInbound ? '#059669' : '#e11d48', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                            {isInbound ? <ArrowDownLeft size={11} /> : <ArrowUpRight size={11} />}
                                                            <span>{isInbound ? '+' : '-'}{log.qty} {log.unit}</span>
                                                        </div>
                                                        <div style={{ fontSize: '0.64rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                            <Clock size={10} color="#94a3b8" />
                                                            <span>{log.tanggal}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div style={{ gridColumn: 'span 4', fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic', padding: '4px 0' }}>
                                                Belum ada mutasi barang yang tercatat untuk SKU ini.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* ============================================================== */}
                {/* TABEL DATA MATERIAL SKU                                        */}
                {/* ============================================================== */}
                <div style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                    overflow: 'hidden',
                    borderTop: '3.5px solid #059669'
                }}>

                    {/* Header Toolbar Tabel */}
                    <div style={{
                        padding: '14px 20px',
                        background: '#ffffff',
                        borderBottom: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '9px',
                                background: '#f1f5f9',
                                border: '1px solid #e2e8f0',
                                color: '#334155',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Package size={18} strokeWidth={2.4} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.94rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.2px' }}>
                                    Katalog SKU Material
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '1px' }}>
                                    Menampilkan <strong style={{ color: '#0f172a' }}>{filteredBarang.length}</strong> dari {rawBarangList.length} SKU terdaftar
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>

                            {/* Filter Status Ketersediaan */}
                            <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px', gap: '2px' }}>
                                <button
                                    type="button"
                                    onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
                                    style={{
                                        border: 'none',
                                        background: statusFilter === 'all' ? '#ffffff' : 'transparent',
                                        color: statusFilter === 'all' ? '#0f172a' : '#64748b',
                                        fontWeight: statusFilter === 'all' ? '800' : '600',
                                        fontSize: '0.72rem',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        boxShadow: statusFilter === 'all' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                                    }}
                                >
                                    Semua
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setStatusFilter('kritis'); setCurrentPage(1); }}
                                    style={{
                                        border: 'none',
                                        background: statusFilter === 'kritis' ? '#fee2e2' : 'transparent',
                                        color: statusFilter === 'kritis' ? '#991b1b' : '#64748b',
                                        fontWeight: statusFilter === 'kritis' ? '800' : '600',
                                        fontSize: '0.72rem',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    ● Kritis
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setStatusFilter('aman'); setCurrentPage(1); }}
                                    style={{
                                        border: 'none',
                                        background: statusFilter === 'aman' ? '#dcfce7' : 'transparent',
                                        color: statusFilter === 'aman' ? '#166534' : '#64748b',
                                        fontWeight: statusFilter === 'aman' ? '800' : '600',
                                        fontSize: '0.72rem',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    ● Aman
                                </button>
                            </div>

                            {/* Filter Divisi */}
                            <div style={{ position: 'relative' }}>
                                <button
                                    type="button"
                                    onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '7px',
                                        background: selectedDivisi ? '#334155' : '#ffffff',
                                        color: selectedDivisi ? '#ffffff' : '#334155',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '8px',
                                        padding: '6px 12px',
                                        fontSize: '0.74rem',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                                    }}
                                >
                                    <Filter size={12} color={selectedDivisi ? '#ffffff' : '#64748b'} />
                                    <span>{currentDivisiLabel}</span>
                                    <ChevronDown size={12} style={{ transform: filterDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                                </button>

                                {filterDropdownOpen && (
                                    <>
                                        <div onClick={() => setFilterDropdownOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                                        <div style={{ position: 'absolute', top: 'calc(100% + 5px)', left: 0, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '9px', padding: '5px', minWidth: '155px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)', zIndex: 50, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <button type="button" onClick={() => { setSelectedDivisi(''); setFilterDropdownOpen(false); setCurrentPage(1); }} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 11px', border: 'none', background: !selectedDivisi ? '#f1f5f9' : 'transparent', color: !selectedDivisi ? '#0f172a' : '#334155', fontWeight: !selectedDivisi ? '700' : '500', fontSize: '0.74rem', cursor: 'pointer', borderRadius: '6px' }}><span>Semua Gudang</span></button>
                                            <button type="button" onClick={() => { setSelectedDivisi('Sipil'); setFilterDropdownOpen(false); setCurrentPage(1); }} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 11px', border: 'none', background: selectedDivisi === 'Sipil' ? '#f1f5f9' : 'transparent', color: selectedDivisi === 'Sipil' ? '#0f172a' : '#334155', fontWeight: selectedDivisi === 'Sipil' ? '700' : '500', fontSize: '0.74rem', cursor: 'pointer', borderRadius: '6px' }}><span>Gudang Sipil</span></button>
                                            <button type="button" onClick={() => { setSelectedDivisi('Listrik'); setFilterDropdownOpen(false); setCurrentPage(1); }} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 11px', border: 'none', background: selectedDivisi === 'Listrik' ? '#f1f5f9' : 'transparent', color: selectedDivisi === 'Listrik' ? '#0f172a' : '#334155', fontWeight: selectedDivisi === 'Listrik' ? '700' : '500', fontSize: '0.74rem', cursor: 'pointer', borderRadius: '6px' }}><span>Gudang Listrik</span></button>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Live Search */}
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                                    placeholder="Cari SKU, nama, lokasi..."
                                    className="form-control form-control-sm"
                                    style={{ paddingLeft: '30px', paddingRight: search ? '26px' : '10px', fontSize: '0.75rem', borderRadius: '8px', width: '220px', borderColor: '#cbd5e1' }}
                                />
                                <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '8px' }} />
                                {search && (
                                    <button type="button" onClick={() => { setSearch(''); setCurrentPage(1); }} style={{ position: 'absolute', right: '6px', top: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}><X size={12} /></button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bilah Aksi Masal Checkbox */}
                    {selectedIds.length > 0 && (
                        <div style={{
                            background: '#f8fafc',
                            borderBottom: '1px solid #cbd5e1',
                            padding: '8px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            animation: 'fadeIn 0.15s ease'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ background: '#334155', color: '#ffffff', fontSize: '0.7rem', fontWeight: '800', padding: '2px 8px', borderRadius: '5px' }}>
                                    {selectedIds.length}
                                </span>
                                <span style={{ fontSize: '0.76rem', fontWeight: '700', color: '#0f172a' }}>
                                    Material SKU Dipilih
                                </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                    type="button"
                                    onClick={() => setSelectedIds([])}
                                    style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 10px', fontSize: '0.72rem', fontWeight: '600', color: '#475569', cursor: 'pointer' }}
                                >
                                    Batalkan Pilihan
                                </button>

                                {isAdmin && (
                                    <button
                                        type="button"
                                        onClick={handleBatchDelete}
                                        style={{ background: '#ef4444', border: 'none', borderRadius: '6px', padding: '4px 12px', fontSize: '0.72rem', fontWeight: '700', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={12} />
                                        <span>Hapus Masal ({selectedIds.length})</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TABEL RESPONSIVE */}
                    <div style={{ width: '100%', overflowX: 'hidden' }}>
                        <table className="table align-middle mb-0" style={{ fontSize: '0.79rem', width: '100%', tableLayout: 'auto' }}>
                            <thead>
                                <tr>
                                    <th style={{ backgroundColor: '#f8fafc', color: '#64748b', width: '38px', textAlign: 'center', padding: '12px 6px', borderBottom: '1.5px solid #e2e8f0' }}>
                                        <input
                                            type="checkbox"
                                            className="custom-checkbox"
                                            checked={isAllSelected}
                                            onChange={handleSelectAll}
                                            title="Pilih seluruh barang di halaman ini"
                                        />
                                    </th>

                                    <th onClick={() => handleSort('kode_barang')} className="sortable-th" style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.71rem', fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase', padding: '12px 10px', borderBottom: '1.5px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                            <span>Part Number</span>
                                            {renderSortIcon('kode_barang')}
                                        </div>
                                    </th>

                                    <th onClick={() => handleSort('nama_barang')} className="sortable-th" style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.71rem', fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase', padding: '12px 10px', borderBottom: '1.5px solid #e2e8f0' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                            <span>Nama Material</span>
                                            {renderSortIcon('nama_barang')}
                                        </div>
                                    </th>

                                    <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.71rem', fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase', padding: '12px 10px', borderBottom: '1.5px solid #e2e8f0' }}>
                                        Lokasi Rak
                                    </th>

                                    <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.71rem', fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase', padding: '12px 10px', borderBottom: '1.5px solid #e2e8f0' }}>
                                        Vendor Asal
                                    </th>

                                    <th onClick={() => handleSort('stok')} className="sortable-th" style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.71rem', fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase', padding: '12px 10px', borderBottom: '1.5px solid #e2e8f0', textAlign: 'left', whiteSpace: 'nowrap' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                            <span>Stok Fisik</span>
                                            {renderSortIcon('stok')}
                                        </div>
                                    </th>

                                    <th onClick={() => handleSort('min_stok')} className="sortable-th" style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.71rem', fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase', padding: '12px 10px', borderBottom: '1.5px solid #e2e8f0', textAlign: 'left', whiteSpace: 'nowrap' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                            <span>Batas Min</span>
                                            {renderSortIcon('min_stok')}
                                        </div>
                                    </th>

                                    <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.71rem', fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase', padding: '12px 6px', borderBottom: '1.5px solid #e2e8f0', textAlign: 'center' }}>
                                        Divisi
                                    </th>

                                    <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.71rem', fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase', padding: '12px 14px 12px 6px', borderBottom: '1.5px solid #e2e8f0', textAlign: 'center', width: '105px' }}>
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBarang.length > 0 ? (
                                    paginatedBarang.map((item, idx) => {
                                        const isSelected = selectedBarangId === item.id_barang;
                                        const isChecked = selectedIds.includes(item.id_barang);
                                        const isKritis = item.is_kritis || Number(item.stok) <= Number(item.min_stok);
                                        const defaultRowBg = idx % 2 === 1 ? '#fafbfc' : '#ffffff';

                                        return (
                                            <tr
                                                key={item.id_barang}
                                                onClick={() => setSelectedBarangId(item.id_barang)}
                                                className={`katalog-row ${isSelected ? 'is-selected-row' : ''}`}
                                                style={{
                                                    borderBottom: '1px solid #eef2f6',
                                                    backgroundColor: isSelected ? '#f1f5f9' : (isChecked ? '#f8fafc' : defaultRowBg)
                                                }}
                                                title="Klik baris untuk meninjau grafik material ini di atas"
                                            >
                                                <td
                                                    style={{ textAlign: 'center', padding: '12px 6px' }}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="custom-checkbox"
                                                        checked={isChecked}
                                                        onChange={() => handleToggleSelect(item.id_barang)}
                                                    />
                                                </td>

                                                <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <span className="part-number-text" style={{
                                                            fontFamily: "'Plus Jakarta Sans', ui-monospace, sans-serif",
                                                            fontSize: '0.81rem',
                                                            fontWeight: isSelected ? '800' : '700',
                                                            color: isSelected ? '#0f172a' : '#1e293b',
                                                            letterSpacing: '0.01em',
                                                            transition: 'color 0.15s ease'
                                                        }}>
                                                            {item.kode_barang}
                                                        </span>

                                                        {isSelected && (
                                                            <span style={{
                                                                fontSize: '0.6rem',
                                                                fontWeight: '800',
                                                                color: '#334155',
                                                                background: '#e2e8f0',
                                                                border: '1px solid #cbd5e1',
                                                                padding: '1px 5px',
                                                                borderRadius: '4px',
                                                                letterSpacing: '0.03em'
                                                            }}>
                                                                AKTIF
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td style={{ padding: '12px 10px', fontWeight: isSelected ? '800' : '700', color: '#0f172a', fontSize: '0.82rem' }}>
                                                    {item.nama_barang}
                                                </td>

                                                <td style={{ padding: '12px 10px' }}>
                                                    <div style={{ color: '#0f172a', fontWeight: '600', fontSize: '0.78rem' }}>
                                                        {item.distrik}
                                                    </div>
                                                    <div style={{ fontSize: '0.71rem', color: '#64748b', marginTop: '1px' }}>
                                                        Rak: <strong style={{ color: '#334155' }}>{item.remarks || '-'}</strong>
                                                    </div>
                                                </td>

                                                <td style={{ padding: '12px 10px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#475569', fontSize: '0.76rem' }}>
                                                        <Building2 size={12} color="#94a3b8" />
                                                        <span style={{ maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {item.asal_material || '-'}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                                                    {isKritis ? (
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            background: '#fef2f2',
                                                            color: '#dc2626',
                                                            border: '1px solid #fee2e2',
                                                            padding: '2px 7px',
                                                            borderRadius: '5px',
                                                            fontWeight: '800',
                                                            fontSize: '0.78rem'
                                                        }}>
                                                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ef4444' }}></span>
                                                            {item.stok} <span style={{ fontSize: '0.68rem', fontWeight: '600' }}>{item.unit}</span>
                                                        </span>
                                                    ) : (
                                                        <div style={{ fontSize: '0.82rem' }}>
                                                            <span style={{ fontWeight: '800', color: '#0f172a' }}>{item.stok}</span>
                                                            <span style={{ color: '#64748b', fontSize: '0.71rem', marginLeft: '3px' }}>{item.unit}</span>
                                                        </div>
                                                    )}
                                                </td>

                                                <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                                                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                                        <span style={{ fontWeight: '600' }}>{item.min_stok}</span>
                                                        <span style={{ fontSize: '0.7rem', marginLeft: '2px' }}>{item.unit}</span>
                                                    </div>
                                                </td>

                                                <td style={{ padding: '12px 6px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        fontSize: '0.67rem',
                                                        fontWeight: '700',
                                                        padding: '2px 7px',
                                                        borderRadius: '5px',
                                                        background: item.divisi === 'Listrik' ? '#eff6ff' : '#fefce8',
                                                        color: item.divisi === 'Listrik' ? '#0369a1' : '#a16207',
                                                        border: `1px solid ${item.divisi === 'Listrik' ? '#dbeafe' : '#fef08a'}`
                                                    }}>
                                                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: item.divisi === 'Listrik' ? '#0284c7' : '#ca8a04' }}></span>
                                                        {item.divisi}
                                                    </span>
                                                </td>

                                                <td style={{ padding: '12px 14px 12px 6px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); handleOpenDetail(item); }}
                                                            title="Rincian SKU"
                                                            style={{
                                                                border: '1px solid #e2e8f0',
                                                                background: '#ffffff',
                                                                color: '#64748b',
                                                                padding: '5px 7px',
                                                                borderRadius: '6px',
                                                                cursor: 'pointer',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                transition: 'all 0.15s ease'
                                                            }}
                                                        >
                                                            <Eye size={13} />
                                                        </button>

                                                        {isAdmin && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => { e.stopPropagation(); handleOpenEdit(item); }}
                                                                    title="Edit SKU"
                                                                    style={{
                                                                        border: '1px solid #e2e8f0',
                                                                        background: '#ffffff',
                                                                        color: '#64748b',
                                                                        padding: '5px 7px',
                                                                        borderRadius: '6px',
                                                                        cursor: 'pointer',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        transition: 'all 0.15s ease'
                                                                    }}
                                                                >
                                                                    <Edit size={13} />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id_barang, item.nama_barang); }}
                                                                    title="Hapus SKU"
                                                                    style={{
                                                                        border: '1px solid #e2e8f0',
                                                                        background: '#ffffff',
                                                                        color: '#64748b',
                                                                        padding: '5px 7px',
                                                                        borderRadius: '6px',
                                                                        cursor: 'pointer',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        transition: 'all 0.15s ease'
                                                                    }}
                                                                >
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                                            Tidak ada material yang sesuai kriteria filter/pencarian "{search}".
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        currentPage={currentPage}
                        totalItems={filteredBarang.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={(page) => setCurrentPage(page)}
                    />
                </div>

                {/* MODAL 1: REGISTRASI MATERIAL SKU BARU */}
                {showModal && (
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
                            maxWidth: '600px',
                            maxHeight: '92vh',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.2)',
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
                                        <Package size={20} color="#059669" />
                                    </div>
                                    <div>
                                        <h6 style={{ fontWeight: '800', color: '#0f172a', margin: 0, fontSize: '1.05rem', letterSpacing: '-0.2px' }}>
                                            Registrasi Material SKU Baru
                                        </h6>
                                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                                            Pendaftaran identitas part number, klasifikasi divisi, dan alokasi rak gudang
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

                            <form onSubmit={submitTambahBarang} style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px' }}>
                                    <div style={{ fontSize: '0.66rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                                        1. Identitas & Klasifikasi SKU
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px' }}>
                                        <div>
                                            <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: '700', color: '#334155', marginBottom: '5px', display: 'block' }}>
                                                Divisi Gudang <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <select
                                                className="form-select form-select-sm"
                                                value={data.divisi}
                                                onChange={e => setData('divisi', e.target.value)}
                                                style={{ borderRadius: '8px', fontSize: '0.78rem', borderColor: '#cbd5e1', padding: '7px 12px', backgroundColor: '#ffffff' }}
                                            >
                                                <option value="Sipil">Gudang Sipil</option>
                                                <option value="Listrik">Gudang Listrik</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: '700', color: '#334155', marginBottom: '5px', display: 'block' }}>
                                                Part Number / Kode SKU <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="(Misal: 10023 / CVL-01)"
                                                value={data.kode_barang}
                                                onChange={e => setData('kode_barang', e.target.value)}
                                                required
                                                style={{ borderRadius: '8px', fontSize: '0.78rem', borderColor: '#cbd5e1', padding: '6px 12px', fontWeight: '600', backgroundColor: '#ffffff' }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: '700', color: '#334155', marginBottom: '5px', display: 'block' }}>
                                            Nama Material <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            placeholder="Nama material spesifik"
                                            value={data.nama_barang}
                                            onChange={e => setData('nama_barang', e.target.value)}
                                            required
                                            style={{ borderRadius: '8px', fontSize: '0.78rem', borderColor: '#cbd5e1', padding: '6px 12px', backgroundColor: '#ffffff' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px' }}>
                                    <div style={{ fontSize: '0.66rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                                        2. Wilayah Distribusi & Asal Vendor
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                                        <div>
                                            <SearchableDropdown
                                                label="Wilayah / Distrik"
                                                value={data.distrik}
                                                onChange={val => setData('distrik', val)}
                                                options={listDistrik}
                                                placeholder="Pilih distrik..."
                                                required
                                            />
                                        </div>

                                        <div>
                                            <SearchableDropdown
                                                label="Asal Material Vendor"
                                                value={data.asal_material}
                                                onChange={val => setData('asal_material', val)}
                                                options={listAsalMaterial}
                                                placeholder="Pilih vendor..."
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px' }}>
                                    <div style={{ fontSize: '0.66rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                                        3. Parameter Stok & Alokasi Rak Fisik
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
                                        <div>
                                            <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: '700', color: '#334155', marginBottom: '5px', display: 'block' }}>
                                                Satuan Fisik <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Sak / Pcs / Roll"
                                                value={data.unit}
                                                onChange={e => setData('unit', e.target.value)}
                                                required
                                                style={{ borderRadius: '8px', fontSize: '0.78rem', borderColor: '#cbd5e1', padding: '6px 10px', backgroundColor: '#ffffff' }}
                                            />
                                        </div>

                                        <div>
                                            <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: '700', color: '#334155', marginBottom: '5px', display: 'block' }}>
                                                Stok Awal Fisik <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                className="form-control form-control-sm"
                                                value={data.stok}
                                                onChange={e => setData('stok', e.target.value)}
                                                required
                                                style={{ borderRadius: '8px', fontSize: '0.78rem', borderColor: '#cbd5e1', padding: '6px 10px', fontWeight: '700', backgroundColor: '#ffffff' }}
                                            />
                                        </div>

                                        <div>
                                            <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: '700', color: '#334155', marginBottom: '5px', display: 'block' }}>
                                                Ambang Batas Min <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                className="form-control form-control-sm"
                                                value={data.min_stok}
                                                onChange={e => setData('min_stok', e.target.value)}
                                                required
                                                style={{ borderRadius: '8px', fontSize: '0.78rem', borderColor: '#cbd5e1', padding: '6px 10px', fontWeight: '700', backgroundColor: '#ffffff' }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: '700', color: '#334155', marginBottom: '5px', display: 'block' }}>
                                            Lokasi Rak Gudang
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            placeholder="Contoh: Rak Sipil A-01"
                                            value={data.remarks}
                                            onChange={e => setData('remarks', e.target.value)}
                                            style={{ borderRadius: '8px', fontSize: '0.78rem', borderColor: '#cbd5e1', padding: '6px 12px' }}
                                        />
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    gap: '8px',
                                    paddingTop: '12px',
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
                                        disabled={processing}
                                        className="btn btn-sm text-white px-3"
                                        style={{
                                            background: '#059669',
                                            borderRadius: '8px',
                                            fontSize: '0.78rem',
                                            fontWeight: '700',
                                            padding: '7px 20px',
                                            border: 'none',
                                            boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
                                            cursor: processing ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {processing ? 'Menyimpan...' : 'Simpan Material SKU'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL 2: UBAH SPESIFIKASI SKU */}
                {showEditModal && (
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
                            maxWidth: '600px',
                            maxHeight: '92vh',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.2)',
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
                                        background: '#e0f2fe',
                                        border: '1px solid #bae6fd',
                                        color: '#0284c7',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <Edit size={18} color="#0284c7" />
                                    </div>
                                    <div>
                                        <h6 style={{ fontWeight: '800', color: '#0f172a', margin: 0, fontSize: '1.05rem', letterSpacing: '-0.2px' }}>
                                            Ubah Spesifikasi SKU
                                        </h6>
                                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                                            Pembaruan data teknis, vendor, dan penempatan rak material
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
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

                            <form onSubmit={submitEditBarang} style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px' }}>
                                    <div style={{ fontSize: '0.66rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                                        1. Identitas & Klasifikasi SKU
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px' }}>
                                        <div>
                                            <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: '700', color: '#334155', marginBottom: '5px', display: 'block' }}>
                                                Divisi Gudang <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <select
                                                className="form-select form-select-sm"
                                                value={editForm.data.divisi}
                                                onChange={e => editForm.setData('divisi', e.target.value)}
                                                style={{ borderRadius: '8px', fontSize: '0.78rem', borderColor: '#cbd5e1', padding: '7px 12px', backgroundColor: '#ffffff' }}
                                            >
                                                <option value="Sipil">Gudang Sipil</option>
                                                <option value="Listrik">Gudang Listrik</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: '700', color: '#334155', marginBottom: '5px', display: 'block' }}>
                                                Part Number / Kode SKU <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={editForm.data.kode_barang}
                                                onChange={e => editForm.setData('kode_barang', e.target.value)}
                                                required
                                                style={{ borderRadius: '8px', fontSize: '0.78rem', borderColor: '#cbd5e1', padding: '6px 12px', fontWeight: '600', backgroundColor: '#ffffff' }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: '700', color: '#334155', marginBottom: '5px', display: 'block' }}>
                                            Nama Material <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            value={editForm.data.nama_barang}
                                            onChange={e => editForm.setData('nama_barang', e.target.value)}
                                            required
                                            style={{ borderRadius: '8px', fontSize: '0.78rem', borderColor: '#cbd5e1', padding: '6px 12px', backgroundColor: '#ffffff' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px' }}>
                                    <div style={{ fontSize: '0.66rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                                        2. Wilayah Distribusi & Asal Vendor
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                                        <div>
                                            <SearchableDropdown
                                                label="Wilayah / Distrik"
                                                value={editForm.data.distrik}
                                                onChange={val => editForm.setData('distrik', val)}
                                                options={listDistrik}
                                                placeholder="Pilih distrik..."
                                                required
                                            />
                                        </div>

                                        <div>
                                            <SearchableDropdown
                                                label="Asal Material Vendor"
                                                value={editForm.data.asal_material}
                                                onChange={val => editForm.setData('asal_material', val)}
                                                options={listAsalMaterial}
                                                placeholder="Pilih vendor..."
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px' }}>
                                    <div style={{ fontSize: '0.66rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                                        3. Parameter Stok & Alokasi Rak Fisik
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
                                        <div>
                                            <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: '700', color: '#334155', marginBottom: '5px', display: 'block' }}>
                                                Satuan Fisik <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={editForm.data.unit}
                                                onChange={e => editForm.setData('unit', e.target.value)}
                                                required
                                                style={{ borderRadius: '8px', fontSize: '0.78rem', borderColor: '#cbd5e1', padding: '6px 10px', backgroundColor: '#ffffff' }}
                                            />
                                        </div>

                                        <div>
                                            <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: '700', color: '#334155', marginBottom: '5px', display: 'block' }}>
                                                Stok Fisik <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <input
                                                type="number"
                                                className="form-control form-control-sm"
                                                value={editForm.data.stok}
                                                onChange={e => editForm.setData('stok', e.target.value)}
                                                required
                                                style={{ borderRadius: '8px', fontSize: '0.78rem', borderColor: '#cbd5e1', padding: '6px 10px', fontWeight: '700', backgroundColor: '#ffffff' }}
                                            />
                                        </div>

                                        <div>
                                            <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: '700', color: '#334155', marginBottom: '5px', display: 'block' }}>
                                                Ambang Batas Min <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                className="form-control form-control-sm"
                                                value={editForm.data.min_stok}
                                                onChange={e => editForm.setData('min_stok', e.target.value)}
                                                required
                                                style={{ borderRadius: '8px', fontSize: '0.78rem', borderColor: '#cbd5e1', padding: '6px 10px', fontWeight: '700', backgroundColor: '#ffffff' }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: '700', color: '#334155', marginBottom: '5px', display: 'block' }}>
                                            Lokasi Rak Gudang
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            value={editForm.data.remarks}
                                            onChange={e => editForm.setData('remarks', e.target.value)}
                                            style={{ borderRadius: '8px', fontSize: '0.78rem', borderColor: '#cbd5e1', padding: '6px 12px' }}
                                        />
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    gap: '8px',
                                    paddingTop: '12px',
                                    borderTop: '1px solid #f1f5f9'
                                }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
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
                                        disabled={editForm.processing}
                                        className="btn btn-sm text-white px-3"
                                        style={{
                                            background: '#0284c7',
                                            borderRadius: '8px',
                                            fontSize: '0.78rem',
                                            fontWeight: '700',
                                            padding: '7px 20px',
                                            border: 'none',
                                            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
                                            cursor: editForm.processing ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {editForm.processing ? 'Menyimpan...' : 'Perbarui Spesifikasi'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL 3: DETAIL SKU TERSTRUKTUR */}
                {showDetailModal && detailItem && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, backdropFilter: 'blur(4px)' }}>
                        <div style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '520px', padding: '24px 26px', boxShadow: '0 20px 45px rgba(15, 23, 42, 0.16)', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.74rem', fontWeight: '800', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#0f172a', padding: '2px 8px', borderRadius: '6px' }}>
                                            {detailItem.kode_barang}
                                        </span>
                                        <span style={{ fontSize: '0.68rem', fontWeight: '700', padding: '2px 8px', borderRadius: '5px', background: detailItem.divisi === 'Listrik' ? '#eff6ff' : '#fefce8', color: detailItem.divisi === 'Listrik' ? '#0284c7' : '#a16207', border: `1px solid ${detailItem.divisi === 'Listrik' ? '#bfdbfe' : '#fde68a'}` }}>
                                            Divisi {detailItem.divisi}
                                        </span>
                                    </div>

                                    <h5 style={{ fontWeight: '800', color: '#0f172a', margin: '4px 0 0', fontSize: '1.2rem', letterSpacing: '-0.3px' }}>
                                        {detailItem.nama_barang}
                                    </h5>
                                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                        Spesifikasi fisik material dan titik penempatan inventaris
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', color: '#64748b', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <X size={15} />
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '12px' }}>
                                <div style={{ background: detailItem.is_kritis ? '#fff5f5' : '#f0fdf4', border: `1.5px solid ${detailItem.is_kritis ? '#fecdd3' : '#bbf7d0'}`, borderRadius: '12px', padding: '12px 14px' }}>
                                    <div style={{ fontSize: '0.64rem', fontWeight: '800', color: detailItem.is_kritis ? '#be123c' : '#15803d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        Stok Fisik Tersedia
                                    </div>
                                    <div style={{ fontSize: '1.35rem', fontWeight: '800', color: detailItem.is_kritis ? '#dc2626' : '#059669', margin: '2px 0' }}>
                                        {detailItem.stok} <span style={{ fontSize: '0.76rem', fontWeight: '600' }}>{detailItem.unit}</span>
                                    </div>
                                    <div style={{ fontSize: '0.64rem', color: '#64748b' }}>
                                        Saldo aktual fisik di rak
                                    </div>
                                </div>

                                <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px' }}>
                                    <div style={{ fontSize: '0.64rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        Ambang Batas Minimum
                                    </div>
                                    <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', margin: '2px 0' }}>
                                        {detailItem.min_stok} <span style={{ fontSize: '0.76rem', fontWeight: '600' }}>{detailItem.unit}</span>
                                    </div>
                                    <div style={{ fontSize: '0.64rem', color: '#64748b' }}>
                                        Buffer pengaman gudang
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: detailItem.is_kritis ? '#fef2f2' : '#ecfdf5', border: `1px solid ${detailItem.is_kritis ? '#fecdd3' : '#a7f3d0'}`, borderRadius: '10px', padding: '10px 14px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {detailItem.is_kritis ? (
                                    <AlertTriangle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
                                ) : (
                                    <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0 }} />
                                )}
                                <div>
                                    <div style={{ fontSize: '0.76rem', fontWeight: '800', color: detailItem.is_kritis ? '#991b1b' : '#065f46' }}>
                                        {detailItem.is_kritis ? 'Status: Kritis (Perlu Restock Segera)' : 'Status: Persediaan Aman'}
                                    </div>
                                    <div style={{ fontSize: '0.67rem', color: detailItem.is_kritis ? '#b91c1c' : '#047857', marginTop: '1px' }}>
                                        {detailItem.is_kritis
                                            ? 'Stok fisik saat ini berada di bawah batas minimum pengaman gudang.'
                                            : 'Kuantitas fisik di rak mencukupi ambang batas buffer operasional.'}
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                                <div>
                                    <div style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                                        Titik Rak Penyimpanan
                                    </div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
                                        <MapPin size={13} color="#059669" />
                                        <span>{detailItem.remarks || '-'}</span>
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                                        Wilayah Distrik
                                    </div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#0f172a', marginTop: '3px' }}>
                                        {detailItem.distrik || '-'}
                                    </div>
                                </div>

                                <div style={{ gridColumn: 'span 2', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                                    <div style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                                        Vendor / Pabrik Asal
                                    </div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                                        <Building2 size={13} color="#64748b" />
                                        <span>{detailItem.asal_material || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
                                <button
                                    type="button"
                                    onClick={() => router.get('/kartu-stok', { id_barang: detailItem.id_barang })}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '7px 14px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                                >
                                    <ClipboardList size={13} />
                                    <span>Inspeksi Kartu Stok</span>
                                    <ArrowUpRight size={13} />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setShowDetailModal(false)}
                                    className="btn btn-sm btn-light border px-3"
                                    style={{ borderRadius: '8px', fontSize: '0.76rem', fontWeight: '700', color: '#334155' }}
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