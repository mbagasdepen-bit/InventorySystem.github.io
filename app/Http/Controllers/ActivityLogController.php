<?php

namespace App\Http\Controllers;

use App\Models\LogAktivitas;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        date_default_timezone_set('Asia/Jakarta');
        Carbon::setLocale('id');

        $cari = $request->query('q', '');
        $kategori = $request->query('kategori', '');

        $query = LogAktivitas::orderBy('waktu', 'desc');

        if (!empty($kategori) && $kategori !== 'Semua') {
            $query->where('kategori', $kategori);
        }

        if (!empty($cari)) {
            $query->where(function ($q) use ($cari) {
                $q->where('user', 'like', "%{$cari}%")
                  ->orWhere('role', 'like', "%{$cari}%")
                  ->orWhere('kategori', 'like', "%{$cari}%")
                  ->orWhere('ref_doc', 'like', "%{$cari}%")
                  ->orWhere('aksi', 'like', "%{$cari}%")
                  ->orWhere('detail', 'like', "%{$cari}%")
                  ->orWhere('status', 'like', "%{$cari}%")
                  ->orWhere('waktu', 'like', "%{$cari}%");
            });
        }

        $allLogs = $query->get();

        $logs = $allLogs->map(function ($item, $idx) {
            $cleanDetail = preg_replace('/Nilai:\s*Rp\s*[\d\.\,]+/i', '', $item->detail ?? '');
            $cleanDetail = preg_replace('/Beban:\s*Rp\s*[\d\.\,]+/i', '', $cleanDetail);
            $cleanDetail = trim($cleanDetail);

            return [
                'id'        => $item->id ?? ($idx + 1),
                'waktu'     => Carbon::parse($item->waktu ?? now())->translatedFormat('d M Y - H:i') . ' WIB',
                'raw_waktu' => $item->waktu,
                'user'      => $item->user ?? 'Administrator',
                'role'      => $item->role ?? 'Administrator',
                'kategori'  => $item->kategori ?? 'Aktivitas',
                'ref_doc'   => $item->ref_doc ?? '-',
                'aksi'      => $item->aksi ?? '-',
                'detail'    => $cleanDetail ?: ($item->detail ?? '-'),
                'status'    => $item->status ?? 'Tervalidasi',
    ];
        });

        // 4 Metrik Ringkasan Keamanan & Operasional Gudang
        $totalLog = $allLogs->count();
        $totalMutasi = $allLogs->whereIn('kategori', ['Inbound', 'Outbound'])->count();
        $totalMasterSKU = $allLogs->where('kategori', 'Master SKU')->count();

        return Inertia::render('Settings', [
            'logs'    => $logs,
            'metrics' => [
                'totalLog'       => $totalLog,
                'totalMutasi'    => $totalMutasi,
                'totalMasterSKU' => $totalMasterSKU,
            ],
            'filters' => [
                'q'        => $cari,
                'kategori' => $kategori,
            ]
        ]);
    }
}