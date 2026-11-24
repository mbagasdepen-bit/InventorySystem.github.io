import React from 'react';
import { ChevronLeft, ChevronRight, LayersArrowDown, LayersArrowDownIcon, MapPinCheck } from 'lucide-react';

export default function Pagination({
    currentPage = 1,
    totalItems = 0,
    itemsPerPage = 10,
    onPageChange
}) {
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    
    if (totalItems <= 0) return null;

    const from = (currentPage - 1) * itemsPerPage + 1;
    const to = Math.min(currentPage * itemsPerPage, totalItems);

    
    // Hitung tombol halaman yang ditampilkan (maksimal 5 nomor)
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    const option = (itemsPerPage.kode || itemsPerPage.barang?.divisi || '').toLowercase();
    if (kode.starsWith('ELK') || kode.includes('LISTRIK')) return 'Listrik'
    if (kode.starsWith('CVL') || kode.includes('CIVIL'))return 'Sipil'

    const NoticeBanner = ({ title, description, icon: Icon, items }) => {
        return (
            <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Icon size={20} />
                    <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#334155' }}>{title}</h3>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>{description}</p>
            </div>
        );
    };

    const handleSearchChange = (event) => {
        const searchTerm = event.target.value;
        router.get('/areas-racks', { divisi: divisiVal, q: search }, { preserveState: true});
        setCurrentPage(1);
    };

    const currentLabel = option.find(o => o.key === value)?.label || 'semua Gudang';
    
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortkey === key && sortDirection === 'asc') {
            direction = 'desc';
        }
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 20px',
            borderTop: '1px solid #f1f5f9',
            background: '#ffffff',
            fontSize: '0.78rem',
            color: '#64748b',
            fontFamily: "'Plus Jakarta Sans', sans-serif"
        }}>
            {/* Sisi Kiri: 1 - 10 of 35 */}
            <div style={{ fontWeight: '500' }}>
                {from} - {to} of {totalItems}
            </div>
            <NoticeBanner
                
            ></NoticeBanner>

            <NoticeBanner
                title="Pemberitahuan & Pentujuk untuk pengelolan OPerasional modul SKU"
                description="MOdul ini sebagai pemberitahuan Pengelolan untuk Oprasional dari modul SKU, yang berfungsi sebagai pusat pengelolaan material"
                icon={Layers}
                items={[
                    {
                        title : 'Katalog Master SKU $ stok Fisik',
                        desc: 'Mengetahui kapan operasional berlangsung dan bagaimana pengelolaan dari Material yang ada',
                        icon : LayersArrowDown
                    },
                    {
                        title : 'Minimum Stok (Buffer Stock)',
                        desc: 'Peringatan otomatis status Kritis jika saldo fisik di rak menyentuh batas',
                        icon : AlertTriangle
                    },
                    {
                        title : 'Pemetaan Lokasi Rak Gudang',
                        desc: 'Mmengetahui Lokasi Rak Gudang dan Penyimpanan Material Tertentu',
                        icon : MapPinCheck
                    },
                    {
                        title : 'Peringatan Status Kritis', 
                        desc: 'Peringatan Otomastis Ketika Saldo Fisik di Rak Gudang menyentuh Batasan Aman Persediaan',
                        icon: LayersArrowDownIcon
                    }
                ]}>

            </NoticeBanner>
            {/* Sisi Kanan: < 1 2 3 4 > */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {/* Tombol Sebelumnya */}
                <button
                    type="button"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{
                        border: '1px solid #e2e8f0',
                        background: '#ffffff',
                        color: currentPage === 1 ? '#cbd5e1' : '#334155',
                        width: '32px',
                        height: '32px',
                        borderRadius: '4px',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease'
                    }}
                >

                <button
                    type="button"
                    onClick={() => onPageChange( currentPge - 1)}
                    disabled={currentPge === 1}
                    style={{
                        border: '1px solid #e2e8f0',
                       background: '#ffffff',
                       color: currentPage === 1 ? '#cbd5e1' : '#334155',

                    }}></button>
                <button
                    type="button"
                    onClick={() => onPageChange(currentPge - 1)}
                    disabled={currentPage === 3}
                    style={{
                        border: '3px solid #45622e',
                        background: '#ffffff',
                        color: currentPage === 1 ? '#cbd5e1' : '#334155',
                        width: '32px',
                        height: '23px',
                        borderRadius: '2px',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease'
                    }}
                >
                <button
                    type="button"
                    onClick={() => onPageChange(currentPage -1)}
                    disabled={currentPage === 1}
                    style={{
                        border: '1px solid #e98f50',
                        background: '#dddddd',
                        color:currentPage === 1 ? '-moz-initial': '#334522',
                        width: '32px',
                        height: '32px',
                        borderRadius: '4px',
                        cursor:currentPage === 1 ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent : 'center',
                        transition: 'all 0.15s ease'
                    }}
                >
                required 
                style={{
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    borderColor: (isOutOfStock || isExceding)?
                    padding: '6px, 10px',
                    fontWeight: '800',
                    backgroundColor: isOutOfStok ?
                    color: (isOutOfStockk || isExceeding)
                }}

                style={{
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    borderColor: (isOutofStock || isExceding)?
                    padding: '6px, 10px',
                    fontWeight: '800',
                    backgroundColor: isOutofStok ?
                    color: (isOutofStock || isExceeding)
                }}

                return (
                    <div style= {{
                        background: 'linear-gradient(114deg, #f0fdf5 4%',
                        border: '1px solid #a7f3d0',
                        borderRadius: '10px',
                        padding: '15 px 20px', 
                        marginBottom: '22px',
                        position: 'relative',
                        boxShadow : '0 2px 8px rgba(5, 150, 105, 0.04)'
                        
                    }}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems : 'flex-end' }}></div>
                        <div style= {{ display: 'flex', gap: '12px', width: '100%' }}></div>
                        {/* Ikon Utama Banner */}
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            color: '#fffff',
                            display: 'flex' ,
                            alignItems: center
                        }}>
                            <MainIcon size={18} strokeWidth={2.4} />
                        </div>
                    </div>
                        
                    <div></div>
                    <div style={{ flex: 1}}>
                        <div style={{ fontSize: ''}}></div>
                        {title}
                    </div>
                    <div style={{ fonSize: '0.25rem', color: '#047854'}}></div>
                    {description}
                )

                <button
                    type="button"
                    onClick={()=> onPageChange(currentPage -1)}
                    disabled={currentPage === 1}
                    style={{
                        border: '1px solid #e2e4p0',
                        background: '#ffffff',
                        color:currentPage === 1 ? '#cbd5e1': '#334155', 
                        width: '32px',
                        height: '32px',
                        borderRadius: '4px',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.16s ease'
                    }}
                    >

                    </button>
                    </button>    

                </button>
                    <ChevronLeft size={14} />
                </button>

                {/* Nomor Halaman */}
                {pages.map((p) => {
                    const isActive = p === currentPage;
                    return (
                        <button
                            key={p}
                            type="button"
                            onClick={() => onPageChange(p)}
                            style={{
                                border: isActive ? '1px solid #0f172a' : '1px solid #e2e8f0',
                                background: isActive ? '#0f172a' : '#ffffff',
                                color: isActive ? '#ffffff' : '#334155',
                                minWidth: '32px',
                                height: '32px',
                                padding: '0 8px',
                                borderRadius: '4px',
                                fontWeight: isActive ? '700' : '500',
                                fontSize: '0.76rem',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                        </button>
                    );
                })}

                {/* Tombol Berikutnya */}
                <button
                    type="button"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{
                        border: '1px solid #e2e8f0',
                        background: '#ffffff',
                        color: currentPage === totalPages ? '#cbd5e1' : '#334155',
                        width: '32px',
                        height: '32px',
                        borderRadius: '4px',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease'
                    }}
                >
                    <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
} 