import React, { useState, useEffect } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { 
    Boxes, 
    Lock, 
    Mail, 
    ShieldCheck, 
    PackageCheck, 
    TrendingUp, 
    ArrowRight, 
    Eye, 
    EyeOff,
    Info,
    CheckCircle2,
    LockKeyhole
} from 'lucide-react';

export default function Login() {
    const { flash } = usePage().props;
    const [selectedRole, setSelectedRole] = useState('admin');
    const [showPassword, setShowPassword] = useState(false);

    // STATE HITUNG MUNDUR DETIK DARI BACKEND
    const [countdown, setCountdown] = useState(flash?.retry_after || 0);

    // Sinkronisasi detik jika backend mengirimkan durasi blokir baru
    useEffect(() => {
        if (flash?.retry_after && flash.retry_after > countdown) {
            setCountdown(flash.retry_after);
        }
    }, [flash]);

    // Jalankan hitung mundur otomatis setiap 1 detik
    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [countdown]);

    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (countdown > 0) return; // Blokir total jika waktu tunggu belum habis
        post('/login');
    };

    const rolesConfig = [
        {
            id: 'admin',
            title: 'Administrator',
            roleCode: 'SUPER-ADMIN',
            icon: ShieldCheck,
            desc: 'Kendali Penuh Master Data & SKU',
        },
        {
            id: 'gudang',
            title: 'Staff Gudang',
            roleCode: 'LOGISTICS-OPS',
            icon: PackageCheck,
            desc: 'Pencatatan Fisik Inbound & Outbound',
        },
        {
            id: 'manager',
            title: 'Manager Logistik',
            roleCode: 'EXECUTIVE-AUDIT',
            icon: TrendingUp,
            desc: 'Valuasi Aset & Pengawasan Laporan',
        },
    ];

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#cfcfcf',
            backgroundImage: 'radial-gradient(at 0% 0%, rgba(233, 225, 225, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(147, 148, 151, 0.8) 0px, transparent 50%)',
            padding: '24px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
            {/* CONTAINER UTAMA */}
            <div style={{
                width: '100%',
                maxWidth: '960px',
                minHeight: '520px',
                background: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
                display: 'flex',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
                
                {/* SISI KIRI: LOGO & PEMBERITAHUAN RINGKAS */}
                <div style={{
                    flex: '1',
                    background: 'linear-gradient(165deg, #091e17 0%, #064e3b 60%, #022c22 100%)',
                    color: '#ffffff',
                    padding: '48px 40px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    borderRight: '1px solid #e2e8f0',
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                            <div style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '12px',
                                background: '#059669',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 6px 16px rgba(5, 150, 105, 0.4)',
                            }}>
                                <Boxes size={24} color="#ffffff" strokeWidth={2.4} />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.15rem', fontWeight: '800', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
                                    INVENTORY
                                </div>
                                <div style={{ fontSize: '0.66rem', color: '#6ee7b7', fontWeight: '700', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                                    Management System
                                </div>
                            </div>
                        </div>

                        {/* Kotak Pemberitahuan Sederhana */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            padding: '20px',
                            backdropFilter: 'blur(4px)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6ee7b7', fontSize: '0.74rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                                <Info size={14} />
                                <span>Pemberitahuan Sistem</span>
                            </div>
                            <p style={{ fontSize: '0.82rem', color: '#e2e8f0', lineHeight: 1.6, margin: 0 }}>
                                Selamat datang di portal resmi inventaris gudang. Pastikan memilih peran akses yang sesuai sebelum masuk untuk mengelola pencatatan stok fisik dan verifikasi transaksi.
                            </p>
                        </div>
                    </div>

                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                        Inventory System • Ver 2.4
                    </div>
                </div>

                {/* SISI KANAN: FORMULIR LOGIN */}
                <div style={{
                    flex: '1.25',
                    padding: '44px 40px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    background: '#ffffff',
                }}>
                    <div style={{ marginBottom: '22px' }}>
                        <h3 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
                            Masuk ke Akun Anda
                        </h3>
                        <p style={{ fontSize: '0.76rem', color: '#64748b', margin: 0 }}>
                            Pilih hak akses dan masukkan alamat email serta kata sandi Anda.
                        </p>
                    </div>

                    {/* BANNER PERINGATAN KEAMANAN (BERSIH & ELEGAN TANPA KATA TEKNIS) */}
                    {countdown > 0 && (
                        <div style={{
                            background: '#fff1f2',
                            border: '1px solid #fecdca',
                            borderRadius: '10px',
                            padding: '12px 16px',
                            marginBottom: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            color: '#991b1b',
                        }}>
                            <LockKeyhole size={20} color="#dc2626" style={{ flexShrink: 0 }} />
                            <div style={{ fontSize: '0.75rem', lineHeight: 1.4 }}>
                                <div style={{ fontWeight: '700', marginBottom: '2px', color: '#7f1d1d' }}>
                                    Akses Masuk Ditangguhkan Sementara
                                </div>
                                <div>
                                    Terlalu banyak percobaan gagal. Formulir dikunci. Silakan coba kembali dalam waktu <strong style={{ textDecoration: 'underline' }}>{countdown} detik</strong>.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pilihan 3 Role */}
                    <div style={{ marginBottom: '22px' }}>
                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '8px' }}>
                            Otoritas Jabatan
                        </label>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '8px',
                            background: '#f8fafc',
                            padding: '4px',
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0',
                        }}>
                            {rolesConfig.map((r) => {
                                const isSelected = selectedRole === r.id;
                                const IconComponent = r.icon;

                                return (
                                    <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => setSelectedRole(r.id)}
                                        style={{
                                            border: isSelected ? '1px solid #059669' : '1px solid transparent',
                                            background: isSelected ? '#ffffff' : 'transparent',
                                            borderRadius: '8px',
                                            padding: '9px 8px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            boxShadow: isSelected ? '0 2px 6px rgba(0, 0, 0, 0.05)' : 'none',
                                            transition: 'all 0.15s ease',
                                        }}
                                    >
                                        <IconComponent size={17} color={isSelected ? '#059669' : '#64748b'} />
                                        <span style={{
                                            fontSize: '0.73rem',
                                            fontWeight: isSelected ? '800' : '600',
                                            color: isSelected ? '#0f172a' : '#475569',
                                            marginTop: '4px',
                                        }}>
                                            {r.title}
                                        </span>
                                        <span style={{
                                            fontSize: '0.58rem',
                                            color: isSelected ? '#059669' : '#94a3b8',
                                            fontWeight: '700',
                                            marginTop: '1px',
                                        }}>
                                            {r.roleCode}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Formulir Input */}
                    <form onSubmit={handleSubmit}>
                        
                        {/* Email */}
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                                Alamat Email Perusahaan
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    placeholder="nama@company.co.id"
                                    required
                                    disabled={countdown > 0} 
                                    autoComplete="off"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px 10px 38px',
                                        fontSize: '0.8rem',
                                        borderRadius: '8px',
                                        border: (countdown === 0 && errors.email) ? '1px solid #ef4444' : '1px solid #cbd5e1',
                                        background: countdown > 0 ? '#f1f5f9' : '#ffffff',
                                        color: countdown > 0 ? '#94a3b8' : '#0f172a',
                                        outline: 'none',
                                        cursor: countdown > 0 ? 'not-allowed' : 'text',
                                    }}
                                />
                                <Mail size={15} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                            </div>
                            {countdown === 0 && errors.email && (
                                <div style={{ fontSize: '0.69rem', color: '#ef4444', marginTop: '4px', fontWeight: '500' }}>
                                    {errors.email}
                                </div>
                            )}
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                                Kata Sandi Akses
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={data.password}
                                    onChange={e => setData('password', e.target.value)}
                                    placeholder="Masukkan kata sandi akun"
                                    required
                                    disabled={countdown > 0} 
                                    autoComplete="new-password"
                                    style={{
                                        width: '100%',
                                        padding: '10px 38px 10px 38px',
                                        fontSize: '0.8rem',
                                        borderRadius: '8px',
                                        border: (countdown === 0 && errors.password) ? '1px solid #ef4444' : '1px solid #cbd5e1',
                                        background: countdown > 0 ? '#f1f5f9' : '#ffffff',
                                        color: countdown > 0 ? '#94a3b8' : '#0f172a',
                                        outline: 'none',
                                        cursor: countdown > 0 ? 'not-allowed' : 'text',
                                    }}
                                />
                                <Lock size={15} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={countdown > 0}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '11px',
                                        background: 'none',
                                        border: 'none',
                                        cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                                        color: '#94a3b8',
                                        padding: 0,
                                    }}
                                >
                                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                            {countdown === 0 && errors.password && (
                                <div style={{ fontSize: '0.69rem', color: '#ef4444', marginTop: '4px', fontWeight: '500' }}>
                                    {errors.password}
                                </div>
                            )}
                        </div>

                        {/* Sesi */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                            <input
                                type="checkbox"
                                id="rememberMe"
                                checked={data.remember}
                                disabled={countdown > 0}
                                onChange={e => setData('remember', e.target.checked)}
                                style={{ accentColor: '#059669', cursor: countdown > 0 ? 'not-allowed' : 'pointer', borderRadius: '4px' }}
                            />
                            <label htmlFor="rememberMe" style={{ fontSize: '0.74rem', color: '#475569', cursor: countdown > 0 ? 'not-allowed' : 'pointer', userSelect: 'none', margin: 0 }}>
                                Ingat sesi login di perangkat ini
                            </label>
                        </div>

                        {/* TOMBOL MASUK */}
                        <button
                            type="submit"
                            disabled={processing || countdown > 0}
                            style={{
                                width: '100%',
                                padding: '11px 18px',
                                borderRadius: '8px',
                                background: countdown > 0 ? '#cbd5e1' : '#059669', 
                                color: countdown > 0 ? '#475569' : '#ffffff',
                                border: 'none',
                                fontSize: '0.82rem',
                                fontWeight: '700',
                                cursor: (processing || countdown > 0) ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: countdown > 0 ? 'none' : '0 2px 6px rgba(5, 150, 105, 0.25)',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            <span>
                                {countdown > 0 
                                    ? `Terkunci (Silakan tunggu ${countdown}s)` 
                                    : (processing ? 'Memverifikasi...' : 'Masuk ke Sistem')}
                            </span>
                            {countdown === 0 && <ArrowRight size={15} />}
                        </button>
                    </form>

                    {/* Deskripsi Role */}
                    <div style={{
                        marginTop: '16px',
                        padding: '9px 12px',
                        borderRadius: '6px',
                        background: '#f8fafc',
                        border: '1px solid #eef2f6',
                        fontSize: '0.7rem',
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                    }}>
                        <CheckCircle2 size={13} color="#059669" />
                        <span>
                            Lingkup Wewenang: <strong>{rolesConfig.find(r => r.id === selectedRole)?.desc}</strong>
                        </span>
                    </div>

                </div>

            </div>
        </div>
    );
}