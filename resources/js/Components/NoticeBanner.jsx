import React, { useState } from 'react';
import { X, Info } from 'lucide-react';

export default function NoticeBanner({ 
    title, 
    description, 
    items = [], 
    icon: MainIcon = Info 
}) {
    const [show, setShow] = useState(true);

    if (!show) return null;

    return (
        <div style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
            border: '1px solid #a7f3d0',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '22px',
            position: 'relative',
            boxShadow: '0 2px 8px rgba(5, 150, 105, 0.04)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                    {/* Ikon Utama Banner */}
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: '#059669',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <MainIcon size={18} strokeWidth={2.4} />
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.86rem', fontWeight: '800', color: '#064e3b' }}>
                            {title}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#047857', marginTop: '3px', lineHeight: 1.5 }}>
                            {description}
                        </div>

                        {/* 3 Kotak Petunjuk Sejajar 1 Baris (Tidak Turun ke Bawah) */}
                        {items.length > 0 && (
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(3, 1fr)', 
                                gap: '12px', 
                                marginTop: '12px' 
                            }}>
                                {items.map((item, idx) => {
                                    const ItemIcon = item.icon;
                                    return (
                                        <div key={idx} style={{ 
                                            background: 'rgba(255, 255, 255, 0.8)', 
                                            padding: '10px 14px', 
                                            borderRadius: '8px', 
                                            border: '1px solid rgba(167, 243, 208, 0.7)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'flex-start'
                                        }}>
                                            <div style={{ fontSize: '0.74rem', fontWeight: '800', color: '#065f46', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {ItemIcon && <ItemIcon size={13} color="#059669" />}
                                                <span>{item.title}</span>
                                            </div>
                                            <div style={{ fontSize: '0.68rem', color: '#334155', marginTop: '3px', lineHeight: 1.45 }}>
                                                {item.desc}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Tombol Tutup Banner (✕) */}
                <button
                    type="button"
                    onClick={() => setShow(false)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#059669',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '6px',
                        flexShrink: 0
                    }}
                    title="Tutup pemberitahuan"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}