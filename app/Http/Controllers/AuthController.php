<?php

namespace App\Http\Controllers;

use App\Models\LogAktivitas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Carbon\Carbon;

class AuthController extends Controller
{
    public function showLogin()
    {
        if (Auth::check()) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('Login');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $throttleKey = 'login-ip-' . $request->ip();

        // 1. Cek apakah perangkat saat ini sedang dalam masa penangguhan (terkunci)
        if (RateLimiter::tooManyAttempts($throttleKey, 3)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return back()
                ->with('retry_after', $seconds)
                ->withErrors([
                    'email' => "Terlalu banyak percobaan gagal. Akses masuk ditangguhkan sementara.",
                ]);
        }

        $remember = $request->boolean('remember', false);

        if (Auth::attempt($credentials, $remember)) {
            // Jika berhasil login, bersihkan riwayat kegagalan
            RateLimiter::clear($throttleKey);
            
            $request->session()->regenerate();
            $user = Auth::user();

            date_default_timezone_set('Asia/Jakarta');
            LogAktivitas::create([
                'waktu' => Carbon::now('Asia/Jakarta'),
                'user' => $user->name,
                'role' => match($user->role) {
                    'admin' => 'Super Administrator',
                    'gudang' => 'Staff Logistik & Gudang',
                    'manager' => 'Operations Manager',
                    default => 'User'
                },
                'kategori' => 'Login',
                'ref_doc' => 'AUTH-' . strtoupper($user->role),
                'aksi' => 'Otorisasi Login Berhasil',
                'detail' => 'Login aktif pengguna role [' . strtoupper($user->role) . '] via portal otentikasi',
                'status' => 'Sesi Aktif',
            ]);

            return redirect()->intended('/')->with('pesan', 'Selamat datang kembali, ' . $user->name);
        }

        // 2. Jika password/email salah, hitung akumulasi kesalahannya
        $currentAttempts = RateLimiter::attempts($throttleKey) + 1;
        
        // Aturan Durasi Penalti Progresif:
        $penaltySeconds = 60; 
        if ($currentAttempts >= 6) {
            $penaltySeconds = 300; 
        }

        RateLimiter::hit($throttleKey, $penaltySeconds);

        // Jika kesalahan sudah mencapai atau melewati 3 kali, langsung aktifkan status terkunci
        if ($currentAttempts >= 3) {
            $remainingSeconds = RateLimiter::availableIn($throttleKey);
            return back()
                ->with('retry_after', $remainingSeconds)
                ->withErrors([
                    'email' => 'Kombinasi email dan password tidak sesuai.',
                ]);
        }

        // Percobaan 1 & 2: Hanya menampilkan error salah password biasa tanpa mengunci
        return back()->withErrors([
            'email' => 'Kombinasi email dan password tidak sesuai. (Percobaan ke-' . $currentAttempts . ' dari 3)',
        ]);
    }

    public function logout(Request $request)
    {
        $user = Auth::user();
        if ($user) {
            date_default_timezone_set('Asia/Jakarta');
            LogAktivitas::create([
                'waktu' => Carbon::now('Asia/Jakarta'),
                'user' => $user->name,
                'role' => strtoupper($user->role),
                'kategori' => 'Login',
                'ref_doc' => 'LOGOUT',
                'aksi' => 'Sesi Keluar (Logout)',
                'detail' => 'Pengguna mengakhiri sesi aktif aplikasi gudang',
                'status' => 'Selesai',
            ]);
        }

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}