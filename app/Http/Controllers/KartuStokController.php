<?php

namespace App\Http\Controllers;

use App\Models\Barang;
use App\Models\BarangMasuk;
use App\Models\BarangKeluar;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class KartuStokController extends Controller
{
    public function index(Request $request)
    {
        date_default_timezone_set('Asia/Jakarta');
        Carbon::setLocale('id');

        $barangList = Barang::orderBy('nama_barang', 'asc')->get();

        if ($barangList->isEmpty()) {
            return Inertia::render('KartuStok', [
                'barangList'     => [],
                'selectedBarang' => null,
                'ledger'         => [],
                'metrics'        => [
                    'tgl_dibuat'   => '-',
                    'total_masuk'  => 0,
                    'total_keluar' => 0,
                    'saldo_akhir'  => 0,
                ],
            ]);
        }

        $defaultId = $barangList->first()->id_barang;
        $selectedId = $request->query('id_barang', $defaultId);
        $barang = Barang::where('id_barang', $selectedId)->first() ?? $barangList->first();

        $inbounds = BarangMasuk::where('id_barang', $barang->id_barang)->get();
        $outbounds = BarangKeluar::where('id_barang', $barang->id_barang)->get();

        $defaultName = auth()->user()->name ?? 'Administrator';
        $timeline = collect();

        foreach ($inbounds as $in) {
            $qty = (int) ($in->qty ?? $in->jumlah ?? 0);
            $petugas = !empty($in->diterima_oleh) && $in->diterima_oleh !== '-' ? $in->diterima_oleh : $defaultName;
            $pengantar = !empty($in->diserahkan_oleh) && $in->diserahkan_oleh !== '-' ? $in->diserahkan_oleh : 'Kurir / Vendor Ekspedisi';
            $tgl = $in->tanggal ?? date('Y-m-d');
            $created = $in->created_at ?? ($tgl . ' 08:00:00');

            $timeline->push([
                'timestamp'   => Carbon::parse($tgl)->timestamp,
                'created_at'  => $created,
                'raw_date'    => $tgl,
                'tanggal'     => Carbon::parse($tgl)->translatedFormat('d M Y'),
                'jam'         => Carbon::parse($created)->format('H:i') . ' WIB',
                'tipe'        => 'inbound',
                'no_dokumen'  => $in->keterangan ?? 'PO Masuk',
                'masuk'       => $qty,
                'keluar'      => 0,
                'petugas'     => $petugas,
                'pihak_kedua' => $pengantar,
                'lokasi'      => 'Rak Gudang Fisik',
                'catatan'     => $in->keterangan ?? 'Penerimaan Vendor',
            ]);
        }

        foreach ($outbounds as $out) {
            $qty = (int) ($out->qty ?? $out->jumlah ?? 0);
            $petugas = $out->disiapkan_oleh ?? $out->picker ?? $defaultName;
            if (empty($petugas) || $petugas === '-') $petugas = $defaultName;

            $mandor = !empty($out->penerima) && $out->penerima !== '-' ? $out->penerima : 'Mandor Lapangan';
            $lokasi = $out->lokasi_tujuan ?? $out->lokasi_proyek ?? 'Sektor Proyek Lapangan';
            if (empty($lokasi) || $lokasi === '-') $lokasi = 'Sektor Proyek Lapangan';

            $tgl = $out->tanggal ?? date('Y-m-d');
            $created = $out->created_at ?? ($tgl . ' 09:00:00');

            $timeline->push([
                'timestamp'   => Carbon::parse($tgl)->timestamp,
                'created_at'  => $created,
                'raw_date'    => $tgl,
                'tanggal'     => Carbon::parse($tgl)->translatedFormat('d M Y'),
                'jam'         => Carbon::parse($created)->format('H:i') . ' WIB',
                'tipe'        => 'outbound',
                'no_dokumen'  => $out->keterangan ?? 'Bon Dispatch Proyek',
                'masuk'       => 0,
                'keluar'      => $qty,
                'petugas'     => $petugas,
                'pihak_kedua' => $mandor,
                'lokasi'      => $lokasi,
                'catatan'     => $out->keterangan ?? 'Distribusi Lapangan',
            ]);
        }

        // Urutkan kronologis untuk hitung saldo berjalan
        $sortedTimeline = $timeline->sortBy(function ($item) {
            return $item['raw_date'] . ' ' . $item['created_at'];
        })->values();

        $runningStock = 0;
        $totalMasuk = 0;
        $totalKeluar = 0;

        $ledgerAsc = $sortedTimeline->map(function ($row) use (&$runningStock, &$totalMasuk, &$totalKeluar) {
            if ($row['tipe'] === 'inbound') {
                $runningStock += $row['masuk'];
                $totalMasuk += $row['masuk'];
            } else {
                $runningStock -= $row['keluar'];
                $totalKeluar += $row['keluar'];
            }
            $row['saldo_berjalan'] = $runningStock;
            return $row;
        });

        $createdAt = !empty($barang->created_at)
            ? Carbon::parse($barang->created_at)->translatedFormat('l, d F Y - H:i') . ' WIB'
            : 'Terdata pada Registrasi Awal';

        return Inertia::render('KartuStok', [
            'barangList' => $barangList->map(fn($b) => [
                'id_barang'   => $b->id_barang,
                'kode_barang' => $b->kode_barang,
                'nama_barang' => $b->nama_barang,
                'unit'        => $b->unit,
                'stok'        => $b->stok,
                'divisi'      => $b->divisi,
            ]),
            'selectedBarang' => [
                'id_barang'     => $barang->id_barang,
                'kode_barang'   => $barang->kode_barang,
                'nama_barang'   => $barang->nama_barang,
                'divisi'        => $barang->divisi,
                'unit'          => $barang->unit,
                'stok'          => $barang->stok,
                'min_stok'      => $barang->min_stok ?? 5,
                'remarks'       => $barang->remarks ?? '-',
                'distrik'       => $barang->distrik ?? '-',
                'asal_material' => $barang->asal_material ?? '-',
            ],
            'metrics' => [
                'tgl_dibuat'   => $createdAt,
                'total_masuk'  => $totalMasuk,
                'total_keluar' => $totalKeluar,
                'saldo_akhir'  => (int) ($barang->stok ?? 0),
            ],
            'ledger' => $ledgerAsc->reverse()->values(),
        ]);
    }
}