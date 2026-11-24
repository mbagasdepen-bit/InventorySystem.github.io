import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
                            {p}
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