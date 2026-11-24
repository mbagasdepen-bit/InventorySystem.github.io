<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Models\Barang;
use App\Models\LogAktivitas;
use Inertia\Inertia;
use Carbon\Carbon;

class BarangController extends Controller
{
    private function catatLog($aksi, $refDoc, $detail, $status = 'Tervalidasi')
{
    try {
        $user = auth()->user();
        $userName = $user->name ?? 'Administrator';
        $userRole = (auth()->user()->role ?? 'admin') === 'admin' ? 'Administrator' : 'Staff Gudang';

        if (class_exists(LogAktivitas::class) && Schema::hasTable('log_aktivitas')) {
            LogAktivitas::create([
                'waktu'    => Carbon::now('Asia/Jakarta'),
                'user'     => $userName,
                'role'     => $userRole,
                'kategori' => 'Master SKU',
                'ref_doc'  => $refDoc ?: '-',
                'aksi'     => $aksi,
                'detail'   => $detail,
                'status'   => $status,
            ]);
        }
    } catch (\Exception $e) {
        // safe silent logging
    }
}

    public function index(Request $request)
    {
        date_default_timezone_set('Asia/Jakarta');
        Carbon::setLocale('id');

        $cari = $request->query('q', '');
        $divisi = $request->query('divisi', '');

        $query = Barang::query();

        if (!empty($divisi) && $divisi !== 'Semua') {
            $query->where('divisi', $divisi);
        }

        if (!empty($cari)) {
            $query->where(function ($q) use ($cari) {
                $q->where('kode_barang', 'like', "%{$cari}%")
                  ->orWhere('nama_barang', 'like', "%{$cari}%")
                  ->orWhere('remarks', 'like', "%{$cari}%")
                  ->orWhere('distrik', 'like', "%{$cari}%")
                  ->orWhere('asal_material', 'like', "%{$cari}%");
            });
        }

        $allBarang = $query->orderBy('nama_barang', 'asc')->get();

        $tableBM = Schema::hasTable('barang_masuk') ? 'barang_masuk' : 'barang_masuks';
        $tableBK = Schema::hasTable('barang_keluar') ? 'barang_keluar' : 'barang_keluars';

        $colDateBM = Schema::hasColumn($tableBM, 'tanggal') ? 'tanggal' : 'tgl_masuk';
        $colDateBK = Schema::hasColumn($tableBK, 'tanggal') ? 'tanggal' : 'tgl_keluar';

        $colQtyBM = Schema::hasColumn($tableBM, 'qty') ? 'qty' : 'jumlah';
        $colQtyBK = Schema::hasColumn($tableBK, 'qty') ? 'qty' : 'jumlah';

        $fkBM = Schema::hasColumn($tableBM, 'id_barang') ? 'id_barang' : 'barang_id';
        $fkBK = Schema::hasColumn($tableBK, 'id_barang') ? 'id_barang' : 'barang_id';

        $pkCol = Schema::hasColumn('barang', 'id_barang') ? 'id_barang' : 'id';
        $barangIds = $allBarang->pluck($pkCol)->toArray();

        $allInbound = DB::table($tableBM)->whereIn($fkBM, $barangIds)->get()->groupBy($fkBM);
        $allOutbound = DB::table($tableBK)->whereIn($fkBK, $barangIds)->get()->groupBy($fkBK);

        $currentYear = Carbon::now()->year;
        $startOfWeek = Carbon::now()->startOfWeek();
        $weekDates = [];
        for ($i = 0; $i < 5; $i++) {
            $weekDates[$i] = $startOfWeek->copy()->addDays($i)->toDateString();
        }

        $barangList = $allBarang->map(function ($b) use (
            $pkCol, $allInbound, $allOutbound, $colDateBM, $colDateBK, $colQtyBM, $colQtyBK, $currentYear, $weekDates
        ) {
            $id = $b->$pkCol;
            $stok = (int) $b->stok;
            $minStok = (int) ($b->min_stok ?? 5);
            $isKritis = $stok <= $minStok;

            $itemIn = $allInbound->get($id, collect());
            $itemOut = $allOutbound->get($id, collect());

            // 1. Tren Mingguan
            $weeklyIn = [];
            $weeklyOut = [];
            for ($i = 0; $i < 5; $i++) {
                $targetDate = $weekDates[$i];
                $weeklyIn[] = (int) $itemIn->filter(fn($row) => Carbon::parse($row->$colDateBM)->toDateString() === $targetDate)->sum($colQtyBM);
                $weeklyOut[] = (int) $itemOut->filter(fn($row) => Carbon::parse($row->$colDateBK)->toDateString() === $targetDate)->sum($colQtyBK);
            }

            // 2. Tren Bulanan
            $monthlyIn = [];
            $monthlyOut = [];
            for ($m = 1; $m <= 12; $m++) {
                $monthlyIn[] = (int) $itemIn->filter(function ($row) use ($colDateBM, $currentYear, $m) {
                    $dt = Carbon::parse($row->$colDateBM);
                    return $dt->year === $currentYear && $dt->month === $m;
                })->sum($colQtyBM);

                $monthlyOut[] = (int) $itemOut->filter(function ($row) use ($colDateBK, $currentYear, $m) {
                    $dt = Carbon::parse($row->$colDateBK);
                    return $dt->year === $currentYear && $dt->month === $m;
                })->sum($colQtyBK);
            }

            // 3. Tren Tahunan
            $yearLabels = [(string)($currentYear - 2), (string)($currentYear - 1), (string)$currentYear];
            $yearlyIn = [];
            $yearlyOut = [];
            foreach ($yearLabels as $yr) {
                $yInt = (int) $yr;
                $yearlyIn[] = (int) $itemIn->filter(fn($row) => Carbon::parse($row->$colDateBM)->year === $yInt)->sum($colQtyBM);
                $yearlyOut[] = (int) $itemOut->filter(fn($row) => Carbon::parse($row->$colDateBK)->year === $yInt)->sum($colQtyBK);
            }

            // 4. Empat Mutasi Terakhir
            $logsIn = $itemIn->map(function ($row) use ($colDateBM, $colQtyBM, $b) {
                $rawDate = $row->$colDateBM ?? date('Y-m-d');
                $rawCreated = $row->created_at ?? ($rawDate . ' 08:00:00');
                return [
                    'tipe'      => 'inbound',
                    'qty'       => (int) ($row->$colQtyBM ?? 0),
                    'unit'      => $b->unit ?? 'Unit',
                    'tanggal'   => Carbon::parse($rawDate)->translatedFormat('d M Y'),
                    'timestamp' => Carbon::parse($rawCreated)->timestamp,
                ];
            });

            $logsOut = $itemOut->map(function ($row) use ($colDateBK, $colQtyBK, $b) {
                $rawDate = $row->$colDateBK ?? date('Y-m-d');
                $rawCreated = $row->created_at ?? ($rawDate . ' 09:00:00');
                return [
                    'tipe'      => 'outbound',
                    'qty'       => (int) ($row->$colQtyBK ?? 0),
                    'unit'      => $b->unit ?? 'Unit',
                    'tanggal'   => Carbon::parse($rawDate)->translatedFormat('d M Y'),
                    'timestamp' => Carbon::parse($rawCreated)->timestamp,
                ];
            });

            $recentLogs = $logsIn->concat($logsOut)->sortByDesc('timestamp')->values()->take(4)->all();

            return [
                'id_barang'     => $id,
                'kode_barang'   => $b->kode_barang,
                'nama_barang'   => $b->nama_barang,
                'divisi'        => $b->divisi ?? 'Sipil',
                'stok'          => $stok,
                'min_stok'      => $minStok,
                'unit'          => $b->unit ?? 'Unit',
                'remarks'       => $b->remarks ?? 'Rak A-01',
                'distrik'       => $b->distrik ?? 'Distrik Pekanbaru Barat',
                'asal_material' => $b->asal_material ?? 'Distributor Konstruksi (Lokal)',
                'is_kritis'     => $isKritis,
                'trend_weekly'  => [
                    'labels'   => ['Sen', 'Sel', 'Rab', 'Kam', 'Jum'],
                    'inbound'  => $weeklyIn,
                    'outbound' => $weeklyOut,
                ],
                'trend_monthly' => [
                    'labels'   => ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
                    'inbound'  => $monthlyIn,
                    'outbound' => $monthlyOut,
                ],
                'trend_yearly'  => [
                    'labels'   => $yearLabels,
                    'inbound'  => $yearlyIn,
                    'outbound' => $yearlyOut,
                ],
                'recent_logs'   => $recentLogs,
            ];
        });

        $defaultDistrik = [
            'Distrik Pekanbaru Barat',
            'Distrik Pekanbaru Kota',
            'Distrik Rumbai',
            'Distrik Tampan',
            'Distrik Tenayan Raya',
            'Distrik Bukit Raya',
            'Distrik Marpoyan Damai',
            'Distrik Payung Sekaki'
        ];
        $dbDistrik = Barang::whereNotNull('distrik')->where('distrik', '!=', '')->pluck('distrik')->toArray();
        $listDistrik = array_values(array_unique(array_merge($defaultDistrik, $dbDistrik)));

        $defaultVendors = [
            'Distributor Konstruksi (Lokal)',
            'PT. Supreme Cable Indonesia',
            'PT. Schneider Electric Indonesia',
            'PT. Semen Padang Distributor',
            'PT. Philips Lighting Indonesia',
            'Distributor Rekanan Pekanbaru'
        ];
        $dbVendors = Barang::whereNotNull('asal_material')->where('asal_material', '!=', '')->pluck('asal_material')->toArray();
        $listAsalMaterial = array_values(array_unique(array_merge($defaultVendors, $dbVendors)));

        return Inertia::render('Dashboard', [
            'barangList'       => $barangList,
            'listDistrik'      => $listDistrik,
            'listAsalMaterial' => $listAsalMaterial,
            'filters'          => [
                'divisi' => $divisi,
            ],
            'flash'            => [
                'pesan' => session('pesan'),
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode_barang'   => 'required|string|max:50|unique:barang,kode_barang',
            'nama_barang'   => 'required|string|max:150',
            'divisi'        => 'required|string|in:Sipil,Listrik',
            'stok'          => 'required|integer|min:0',
            'min_stok'      => 'required|integer|min:1',
            'unit'          => 'required|string|max:30',
            'remarks'       => 'nullable|string|max:100',
            'distrik'       => 'nullable|string|max:100',
            'asal_material' => 'nullable|string|max:150',
        ]);

        try {
            DB::transaction(function () use ($validated) {
                $barang = Barang::create([
                    'kode_barang'   => strtoupper(trim($validated['kode_barang'])),
                    'nama_barang'   => trim($validated['nama_barang']),
                    'divisi'        => $validated['divisi'],
                    'stok'          => $validated['stok'],
                    'min_stok'      => $validated['min_stok'],
                    'unit'          => trim($validated['unit']),
                    'remarks'       => $validated['remarks'] ?: 'Rak A-01',
                    'distrik'       => $validated['distrik'] ?: 'Distrik Pekanbaru Barat',
                    'asal_material' => $validated['asal_material'] ?: 'Distributor Konstruksi (Lokal)',
                ]);

                $this->catatLog(
                    'Pendaftaran SKU Baru',
                    $barang->kode_barang,
                    "Menambahkan material baru [{$barang->kode_barang}] {$barang->nama_barang} dengan stok awal {$barang->stok} {$barang->unit}",
                    'Tervalidasi'
                );
            });

            return back()->with('pesan', 'Material SKU baru berhasil didaftarkan ke sistem inventaris.');
        } catch (\Exception $e) {
            return back()->withErrors(['general' => $e->getMessage()]);
        }
    }

    public function update(Request $request, $id)
    {
        $pkCol = Schema::hasColumn('barang', 'id_barang') ? 'id_barang' : 'id';
        $barang = Barang::where($pkCol, $id)->firstOrFail();

        $validated = $request->validate([
            'kode_barang'   => "required|string|max:50|unique:barang,kode_barang,{$barang->$pkCol},{$pkCol}",
            'nama_barang'   => 'required|string|max:150',
            'divisi'        => 'required|string|in:Sipil,Listrik',
            'stok'          => 'required|integer|min:0',
            'min_stok'      => 'required|integer|min:1',
            'unit'          => 'required|string|max:30',
            'remarks'       => 'nullable|string|max:100',
            'distrik'       => 'nullable|string|max:100',
            'asal_material' => 'nullable|string|max:150',
        ]);

        try {
            DB::transaction(function () use ($barang, $validated) {
                $barang->update([
                    'kode_barang'   => strtoupper(trim($validated['kode_barang'])),
                    'nama_barang'   => trim($validated['nama_barang']),
                    'divisi'        => $validated['divisi'],
                    'stok'          => $validated['stok'],
                    'min_stok'      => $validated['min_stok'],
                    'unit'          => trim($validated['unit']),
                    'remarks'       => $validated['remarks'] ?: 'Rak A-01',
                    'distrik'       => $validated['distrik'] ?: 'Distrik Pekanbaru Barat',
                    'asal_material' => $validated['asal_material'] ?: 'Distributor Konstruksi (Lokal)',
                ]);

                $this->catatLog(
                    'Pembaruan Master SKU',
                    $barang->kode_barang,
                    "Memperbarui parameter fisik dan titik rak untuk SKU [{$barang->kode_barang}] {$barang->nama_barang}",
                    'Tervalidasi'
                );
            });

            return back()->with('pesan', 'Informasi material SKU berhasil diperbarui.');
        } catch (\Exception $e) {
            return back()->withErrors(['general' => $e->getMessage()]);
        }
    }

    public function destroy($id)
    {
        try {
            $pkCol = Schema::hasColumn('barang', 'id_barang') ? 'id_barang' : 'id';
            $barang = Barang::where($pkCol, $id)->firstOrFail();

            $tableBM = Schema::hasTable('barang_masuk') ? 'barang_masuk' : 'barang_masuks';
            $tableBK = Schema::hasTable('barang_keluar') ? 'barang_keluar' : 'barang_keluars';

            $fkBM = Schema::hasColumn($tableBM, 'id_barang') ? 'id_barang' : 'barang_id';
            $fkBK = Schema::hasColumn($tableBK, 'id_barang') ? 'id_barang' : 'barang_id';

            $hasInbound = DB::table($tableBM)->where($fkBM, $id)->exists();
            $hasOutbound = DB::table($tableBK)->where($fkBK, $id)->exists();

            if ($hasInbound || $hasOutbound) {
                return back()->withErrors([
                    'general' => "Tidak bisa menghapus material [{$barang->kode_barang}]! Material ini sudah memiliki riwayat mutasi masuk/keluar di database."
                ]);
            }

            $kode = $barang->kode_barang;
            $nama = $barang->nama_barang;
            $barang->delete();

            $this->catatLog(
                'Penghapusan SKU',
                $kode,
                "Menghapus material SKU [{$kode}] {$nama} dari katalog master",
                'Dibatalkan'
            );

            return back()->with('pesan', "Material [{$kode}] berhasil dihapus dari master inventaris.");
        } catch (\Exception $e) {
            return back()->withErrors(['general' => $e->getMessage()]);
        }
    }

    public function batchDelete(Request $request)
    {
        $ids = $request->input('ids', []);
        if (empty($ids) || !is_array($ids)) {
            return back()->withErrors(['general' => 'Tidak ada material SKU yang dipilih untuk dihapus.']);
        }

        try {
            $pkCol = Schema::hasColumn('barang', 'id_barang') ? 'id_barang' : 'id';
            $tableBM = Schema::hasTable('barang_masuk') ? 'barang_masuk' : 'barang_masuks';
            $tableBK = Schema::hasTable('barang_keluar') ? 'barang_keluar' : 'barang_keluars';
            $fkBM = Schema::hasColumn($tableBM, 'id_barang') ? 'id_barang' : 'barang_id';
            $fkBK = Schema::hasColumn($tableBK, 'id_barang') ? 'id_barang' : 'barang_id';

            $deletedCount = 0;
            $skippedCodes = [];

            DB::transaction(function () use ($ids, $pkCol, $tableBM, $tableBK, $fkBM, $fkBK, &$deletedCount, &$skippedCodes) {
                foreach ($ids as $id) {
                    $barang = Barang::where($pkCol, $id)->first();
                    if (!$barang) continue;

                    $hasInbound = DB::table($tableBM)->where($fkBM, $id)->exists();
                    $hasOutbound = DB::table($tableBK)->where($fkBK, $id)->exists();

                    if ($hasInbound || $hasOutbound) {
                        $skippedCodes[] = $barang->kode_barang;
                        continue;
                    }

                    $kode = $barang->kode_barang;
                    $nama = $barang->nama_barang;
                    $barang->delete();
                    $deletedCount++;

                    $this->catatLog(
                        'Hapus Masal SKU',
                        $kode,
                        "Menghapus material SKU [{$kode}] {$nama} via aksi masal",
                        'Dibatalkan'
                    );
                }
            });

            $msg = "Berhasil menghapus {$deletedCount} material SKU secara masal.";
            if (!empty($skippedCodes)) {
                $msg .= " (" . count($skippedCodes) . " material dilewati karena memiliki riwayat mutasi: " . implode(', ', $skippedCodes) . ")";
            }

            return back()->with('pesan', $msg);
        } catch (\Exception $e) {
            return back()->withErrors(['general' => $e->getMessage()]);
        }
    }
}