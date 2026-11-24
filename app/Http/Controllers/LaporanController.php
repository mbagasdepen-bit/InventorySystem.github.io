<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Models\Barang;
use Inertia\Inertia;
use Carbon\Carbon;

class LaporanController extends Controller
{
    public function index(Request $request)
    {
        date_default_timezone_set('Asia/Jakarta');
        Carbon::setLocale('id');

        // Parameter Filter
        $startDate = $request->query('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->query('end_date', Carbon::now()->toDateString());
        $divisi = $request->query('divisi', 'Semua');
        $tab = $request->query('tab', 'stok'); // 'stok', 'inbound', 'outbound'

        // 1. REKAPITULASI STOK MATERIAL (MASTER SKU)
        $queryBarang = Barang::query();
        if ($divisi !== 'Semua') {
            $queryBarang->where('divisi', 'like', "%{$divisi}%");
        }
        $rawBarang = $queryBarang->orderBy('nama_barang', 'asc')->get();

        $dataStok = $rawBarang->map(function ($b) {
            $stok = (int) $b->stok;
            $minStok = (int) ($b->min_stok ?? 5);
            $status = 'Aman';
            if ($stok <= 0) {
                $status = 'Habis';
            } elseif ($stok <= $minStok) {
                $status = 'Kritis';
            }

            return [
                'id_barang'     => $b->id_barang ?? $b->id,
                'kode_barang'   => $b->kode_barang ?? 'SKU-NONE',
                'nama_barang'   => $b->nama_barang ?? 'Material Gudang',
                'divisi'        => $b->divisi ?? 'Sipil',
                'stok'          => $stok,
                'min_stok'      => $minStok,
                'unit'          => $b->unit ?? 'Unit',
                'remarks'       => $b->remarks ?? 'Rak Utama',
                'distrik'       => $b->distrik ?? 'Distrik Gudang',
                'status'        => $status,
            ];
        });

        // 2. REKAPITULASI BARANG MASUK (INBOUND)
        $tableBM = Schema::hasTable('barang_masuk') ? 'barang_masuk' : 'barang_masuks';
        $colsBM = Schema::getColumnListing($tableBM);
        $fkBM = in_array('id_barang', $colsBM) ? 'id_barang' : 'barang_id';
        $qtyColBM = in_array('qty', $colsBM) ? 'qty' : (in_array('jumlah', $colsBM) ? 'jumlah' : 'jumlah_masuk');
        $dateColBM = in_array('tanggal', $colsBM) ? 'tanggal' : 'tgl_masuk';

        $queryInbound = DB::table($tableBM)
            ->leftJoin('barang', "{$tableBM}.{$fkBM}", '=', 'barang.id_barang')
            ->whereBetween("{$tableBM}.{$dateColBM}", [$startDate, $endDate]);

        if ($divisi !== 'Semua') {
            $queryInbound->where('barang.divisi', 'like', "%{$divisi}%");
        }

        $dataInbound = $queryInbound->orderBy("{$tableBM}.{$dateColBM}", 'desc')
            ->select(
                "{$tableBM}.*",
                'barang.kode_barang',
                'barang.nama_barang',
                'barang.divisi',
                'barang.unit'
            )
            ->get()
            ->map(function ($item) use ($dateColBM, $qtyColBM) {
                $idDoc = $item->id_masuk ?? ($item->id ?? 0);
                return [
                    'id_masuk'        => $idDoc,
                    'tanggal'         => Carbon::parse($item->$dateColBM)->translatedFormat('d M Y'),
                    'raw_tanggal'     => $item->$dateColBM,
                    'kode_barang'     => $item->kode_barang ?? '-',
                    'nama_barang'     => $item->nama_barang ?? 'Material Gudang',
                    'divisi'          => $item->divisi ?? 'Sipil',
                    'qty'             => (int) ($item->$qtyColBM ?? 0),
                    'unit'            => $item->unit ?? 'Unit',
                    'diterima_oleh'   => $item->diterima_oleh ?? ($item->checker ?? 'Checker Gudang'),
                    'diserahkan_oleh' => $item->diserahkan_oleh ?? ($item->vendor ?? 'Kurir / Ekspedisi'),
                    'keterangan'      => $item->keterangan ?? '-',
                ];
            });

        // 3. REKAPITULASI BARANG KELUAR (OUTBOUND)
        $tableBK = Schema::hasTable('barang_keluar') ? 'barang_keluar' : 'barang_keluars';
        $colsBK = Schema::getColumnListing($tableBK);
        $fkBK = in_array('id_barang', $colsBK) ? 'id_barang' : 'barang_id';
        $qtyColBK = in_array('qty', $colsBK) ? 'qty' : (in_array('jumlah', $colsBK) ? 'jumlah' : 'jumlah_keluar');
        $dateColBK = in_array('tanggal', $colsBK) ? 'tanggal' : 'tgl_keluar';

        $queryOutbound = DB::table($tableBK)
            ->leftJoin('barang', "{$tableBK}.{$fkBK}", '=', 'barang.id_barang')
            ->whereBetween("{$tableBK}.{$dateColBK}", [$startDate, $endDate]);

        if ($divisi !== 'Semua') {
            $queryOutbound->where('barang.divisi', 'like', "%{$divisi}%");
        }

        $dataOutbound = $queryOutbound->orderBy("{$tableBK}.{$dateColBK}", 'desc')
            ->select(
                "{$tableBK}.*",
                'barang.kode_barang',
                'barang.nama_barang',
                'barang.divisi',
                'barang.unit'
            )
            ->get()
            ->map(function ($item) use ($dateColBK, $qtyColBK) {
                $idDoc = $item->id_keluar ?? ($item->id ?? 0);
                return [
                    'id_keluar'     => $idDoc,
                    'tanggal'       => Carbon::parse($item->$dateColBK)->translatedFormat('d M Y'),
                    'raw_tanggal'   => $item->$dateColBK,
                    'kode_barang'   => $item->kode_barang ?? '-',
                    'nama_barang'   => $item->nama_barang ?? 'Material Gudang',
                    'divisi'        => $item->divisi ?? 'Sipil',
                    'qty'           => (int) ($item->$qtyColBK ?? 0),
                    'unit'          => $item->unit ?? 'Unit',
                    'picker'        => $item->picker ?? ($item->disiapkan_oleh ?? 'Petugas Gudang'),
                    'penerima'      => $item->penerima ?? ($item->diterima_oleh ?? 'Mandor Lapangan'),
                    'lokasi_proyek' => $item->lokasi_proyek ?? ($item->sektor ?? 'Sektor Proyek'),
                    'keterangan'    => $item->keterangan ?? '-',
                ];
            });

        // 4. METRIK RINGKASAN AUDIT
        $totalSku = $dataStok->count();
        $stokKritis = $dataStok->whereIn('status', ['Kritis', 'Habis'])->count();
        $totalVolMasuk = $dataInbound->sum('qty');
        $totalVolKeluar = $dataOutbound->sum('qty');

        return Inertia::render('Laporan', [
            'dataStok'     => $dataStok,
            'dataInbound'  => $dataInbound,
            'dataOutbound' => $dataOutbound,
            'metrics'      => [
                'totalSku'       => $totalSku,
                'stokKritis'     => $stokKritis,
                'totalVolMasuk'  => $totalVolMasuk,
                'totalVolKeluar' => $totalVolKeluar,
            ],
            'filters'      => [
                'start_date' => $startDate,
                'end_date'   => $endDate,
                'divisi'     => $divisi,
                'tab'        => $tab,
            ],
        ]);
    }
}