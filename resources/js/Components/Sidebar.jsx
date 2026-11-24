import React from 'react';
import { router, usePage, Link } from '@inertiajs/react';
import { 
    Layers, 
    ArrowDownLeft, 
    ArrowUpRight, 
    FileSpreadsheet, 
    ShieldCheck, 
    Boxes, 
    LogOut,
    Shield,
    Package,
    TrendingUp,
    ClipboardList
} from 'lucide-react';

export default function Sidebar({ active = 'dashboard' }) {
    const { auth } = usePage().props;
    const currentUser = auth?.user || { name: 'Administrator', role: 'admin' };
    
    // Normalisasi Role Cerdas: Menjamin menu tidak hilang jika di database tersimpan 'Super Admin', 'Admin', dsb.
    const rawRole = (currentUser.role || 'admin').toLowerCase();
    const role = rawRole.includes('admin') 
        ? 'admin' 
        : (rawRole.includes('manage') ? 'manager' : 'gudang');

    // Struktur Menu Berdasarkan 3 Kategori Fungsional WMS
    const menuSections = [
        {
            category: 'Master Inventaris',
            items: [
                { 
                    id: 'dashboard', 
                    label: 'Katalog Material SKU', 
                    icon: Layers, 
                    href: '/', 
                    roles: ['admin', 'gudang', 'manager'], 
                    badge: 'Master' 
                },
            ]
        },
        {
            category: 'Operasional & Mutasi Fisik',
            items: [
                { 
                    id: 'inbound', 
                    label: 'Inbound Stock', 
                    icon: ArrowDownLeft, 
                    href: '/barang-masuk', 
                    roles: ['admin', 'gudang', 'manager'] 
                },
                { 
                    id: 'outbound', 
                    label: 'Outbound Stock', 
                    icon: ArrowUpRight, 
                    href: '/barang-keluar', 
                    roles: ['admin', 'gudang', 'manager'] 
                },
                { 
                    id: 'kartu-stok', 
                    label: 'Kartu Stok SKU', 
                    icon: ClipboardList, 
                    href: '/kartu-stok', 
                    roles: ['admin', 'gudang', 'manager'] 
                },
            ]
        },
        {
            category: 'Audit & Kontrol Sistem',
            items: [
                { 
                    id: 'reports', 
                    label: 'Reports Center', 
                    icon: FileSpreadsheet, 
                    href: '/laporan', 
                    roles: ['admin', 'manager'] 
                },
                { 
                    id: 'settings', 
                    label: 'Security & Logs', 
                    icon: ShieldCheck, 
                    href: '/settings', 
                    roles: ['admin', 'manager'] 
                },
            ]
        }
    ];

    const handleLogout = () => {
        if (confirm('Apakah Anda yakin ingin keluar dari sistem inventaris?')) {
            router.post('/logout');
        }
    };

    const roleConfig = {
        admin: { label: 'Super Admin', color: '#10b981', icon: Shield },
        gudang: { label: 'Staff Logistik', color: '#38bdf8', icon: Package },
        manager: { label: 'Manager Logistik', color: '#fbbf24', icon: TrendingUp },
    };

    const currentRole = roleConfig[role] || roleConfig.admin;
    const RoleIcon = currentRole.icon;

    return (
        <aside style={{ 
            width: '265px', 
            background: 'linear-gradient(180deg, #047857 0%, #065f46 45%, #064e3b 100%)', 
            borderRight: '1px solid rgba(255, 255, 255, 0.12)', 
            padding: '22px 16px', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            flexShrink: 0,
            position: 'sticky',
            top: 0,
            height: '100vh',
            boxSizing: 'border-box',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            zIndex: 100,
            userSelect: 'none',
            boxShadow: '4px 0 20px rgba(4, 120, 87, 0.15)'
        }}>
            
            {/* SISI ATAS: LOGO & NAVIGASI BERKATEGORI */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                
                {/* Header Logo Brand */}
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    padding: '2px 8px 18px 8px', 
                    borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
                    marginBottom: '18px'
                }}>
                    <div style={{ 
                        width: '42px', 
                        height: '42px', 
                        borderRadius: '12px', 
                        background: '#ffffff', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
                        flexShrink: 0
                    }}>
                        <Boxes size={22} color="#047857" strokeWidth={2.4} />
                    </div>
                    <div>
                        <div style={{ 
                            fontWeight: '800', 
                            fontSize: '1.05rem', 
                            color: '#ffffff', 
                            letterSpacing: '-0.3px', 
                            lineHeight: 1.15 
                        }}>
                            INVENTORY
                        </div>
                        <div style={{ 
                            fontSize: '0.64rem', 
                            color: '#a7f3d0', 
                            fontWeight: '700', 
                            letterSpacing: '0.8px', 
                            textTransform: 'uppercase',
                            marginTop: '2px'
                        }}>
                            Enterprise Portal
                        </div>
                    </div>
                </div>

                {/* Looping Setiap Kategori Menu */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {menuSections.map((section, sectionIdx) => {
                        const visibleItems = section.items.filter(item => item.roles.includes(role));
                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={sectionIdx}>
                                <div style={{ 
                                    fontSize: '0.64rem', 
                                    fontWeight: '800', 
                                    color: '#a7f3d0', 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '0.08em', 
                                    padding: '0 10px 7px 10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    opacity: 0.95
                                }}>
                                    <span>{section.category}</span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    {visibleItems.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = active === item.id;

                                        return (
                                            <Link
                                                key={item.id}
                                                href={item.href}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '10px 14px',
                                                    borderRadius: '10px',
                                                    textDecoration: 'none',
                                                    fontSize: '0.83rem',
                                                    fontWeight: isActive ? '800' : '600',
                                                    color: isActive ? '#047857' : '#f0fdf4',
                                                    background: isActive ? '#ffffff' : 'transparent',
                                                    boxShadow: isActive ? '0 4px 14px rgba(0, 0, 0, 0.12)' : 'none',
                                                    transition: 'all 0.15s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!isActive) {
                                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                                                        e.currentTarget.style.color = '#ffffff';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!isActive) {
                                                        e.currentTarget.style.background = 'transparent';
                                                        e.currentTarget.style.color = '#f0fdf4';
                                                    }
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                                                    <Icon 
                                                        size={17} 
                                                        color={isActive ? '#047857' : '#a7f3d0'} 
                                                        strokeWidth={isActive ? 2.5 : 2} 
                                                    />
                                                    <span>{item.label}</span>
                                                </div>

                                                {item.badge && (
                                                    <span style={{ 
                                                        fontSize: '0.62rem', 
                                                        padding: '2px 7px', 
                                                        borderRadius: '5px', 
                                                        background: isActive ? '#ecfdf5' : 'rgba(255, 255, 255, 0.18)', 
                                                        color: isActive ? '#047857' : '#ffffff', 
                                                        fontWeight: '700' 
                                                    }}>
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* SISI BAWAH: KARTU PROFIL PENGGUNA */}
            <div style={{ 
                background: 'rgba(0, 0, 0, 0.16)', 
                border: '1px solid rgba(255, 255, 255, 0.18)', 
                borderRadius: '12px', 
                padding: '12px', 
                marginTop: '14px',
                backdropFilter: 'blur(6px)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                        <div style={{ 
                            width: '36px', 
                            height: '36px', 
                            borderRadius: '10px', 
                            background: '#ffffff', 
                            color: '#047857', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontWeight: '800', 
                            fontSize: '0.78rem', 
                            flexShrink: 0,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                        }}>
                            {currentUser.name ? currentUser.name.substring(0, 2).toUpperCase() : 'MB'}
                        </div>

                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ 
                                fontSize: '0.82rem', 
                                fontWeight: '700', 
                                color: '#ffffff', 
                                whiteSpace: 'nowrap', 
                                textOverflow: 'ellipsis', 
                                overflow: 'hidden' 
                            }}>
                                {currentUser.name}
                            </div>
                            <div style={{ 
                                fontSize: '0.65rem', 
                                color: '#6ee7b7', 
                                fontWeight: '700', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '4px', 
                                marginTop: '1px' 
                            }}>
                                <RoleIcon size={11} color="#6ee7b7" />
                                <span>{currentRole.label}</span>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleLogout}
                        title="Keluar dari sistem"
                        style={{
                            background: 'rgba(255, 255, 255, 0.12)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: '#ffffff',
                            cursor: 'pointer',
                            padding: '7px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                            flexShrink: 0
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#ef4444';
                            e.currentTarget.style.color = '#ffffff';
                            e.currentTarget.style.borderColor = '#ef4444';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                            e.currentTarget.style.color = '#ffffff';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        }}
                    >
                        <LogOut size={15} />
                    </button>
                </div>
            </div>

        </aside>
    );
}