<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BarangController;
use App\Http\Controllers\BarangMasukController;
use App\Http\Controllers\BarangKeluarController;
use App\Http\Controllers\KartuStokController;
use App\Http\Controllers\LaporanController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\ExportController;

// Rute Tamu (Login dengan Pengamanan Sesi & Rate Limiting di Controller)
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->name('login.post');
});

// Rute Terproteksi Otentikasi (Wajib Login - Tanpa Batasan Role)
Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    // Dashboard & CRUD SKU Master
    Route::get('/', [BarangController::class, 'index'])->name('dashboard');
    Route::post('/barang', [BarangController::class, 'store'])->name('barang.store');
    Route::post('/barang/batch-delete', [BarangController::class, 'batchDelete'])->name('barang.batch-delete');
    Route::put('/barang/{id}', [BarangController::class, 'update'])->name('barang.update');
    Route::delete('/barang/{id}', [BarangController::class, 'destroy'])->name('barang.destroy');

    // Inbound Stock (Pencatatan Barang Masuk)
    Route::get('/barang-masuk', [BarangMasukController::class, 'index'])->name('barang-masuk.index');
    Route::post('/barang-masuk', [BarangMasukController::class, 'store'])->name('barang-masuk.store');
    Route::delete('/barang-masuk/{id}', [BarangMasukController::class, 'destroy'])->name('barang-masuk.destroy');

    Route::get('/inbound', [BarangMasukController::class, 'index'])->name('inbound.index');
    Route::post('/inbound', [BarangMasukController::class, 'store'])->name('inbound.store');
    Route::delete('/inbound/{id}', [BarangMasukController::class, 'destroy'])->name('inbound.destroy');

    // Outbound Stock (Pencatatan Barang Keluar)
    Route::get('/barang-keluar', [BarangKeluarController::class, 'index'])->name('barang-keluar.index');
    Route::post('/barang-keluar', [BarangKeluarController::class, 'store'])->name('barang-keluar.store');
    Route::delete('/barang-keluar/{id}', [BarangKeluarController::class, 'destroy'])->name('barang-keluar.destroy');

    Route::get('/outbound', [BarangKeluarController::class, 'index'])->name('outbound.index');
    Route::post('/outbound', [BarangKeluarController::class, 'store'])->name('outbound.store');
    Route::delete('/outbound/{id}', [BarangKeluarController::class, 'destroy'])->name('outbound.destroy');

    // Kartu Stok, Laporan, & Settings (Bisa diakses semua user yang login)
    Route::get('/kartu-stok', [KartuStokController::class, 'index'])->name('kartu-stok');
    Route::get('/kartu-stok/export', [KartuStokController::class, 'exportExcel'])->name('kartu-stok.export');

    Route::get('/laporan', [LaporanController::class, 'index'])->name('laporan.index');
    Route::get('/laporan/export', [ExportController::class, 'exportLaporan'])->name('laporan.export');
    Route::get('/settings', [ActivityLogController::class, 'index'])->name('settings.index');
});