<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Models\Barang;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Carbon\Carbon;

class ExportController extends Controller
{
    public function exportKartuStok(Request $request)
    {
        $idBarang = $request->query('id_barang');
        $barang = Barang::findOrFail($idBarang);

        $tableBM = Schema::hasTable('barang_masuk') ? 'barang_masuk' : 'barang_masuks';
        $tableBK = Schema::hasTable('barang_keluar') ? 'barang_keluar' : 'barang_keluars';
        $fk = Schema::hasColumn($tableBM, 'id_barang') ? 'id_barang' : 'barang_id';

        $colDateBM = Schema::hasColumn($tableBM, 'tanggal') ? 'tanggal' : 'tgl_masuk';
        $colDateBK = Schema::hasColumn($tableBK, 'tanggal') ? 'tanggal' : 'tgl_keluar';
        $colQtyBM = Schema::hasColumn($tableBM, 'qty') ? 'qty' : 'jumlah';
        $colQtyBK = Schema::hasColumn($tableBK, 'qty') ? 'qty' : 'jumlah';

        $inbounds = DB::table($tableBM)->where($fk, $idBarang)->select([
            DB::raw("'INBOUND' as tipe"),
            "{$colQtyBM} as masuk",
            DB::raw("0 as keluar"),
            "{$colDateBM} as tanggal",
            "created_at",
            "keterangan as catatan",
            DB::raw("COALESCE(diterima_oleh, 'Petugas') as petugas"),
            DB::raw("COALESCE(diserahkan_oleh, 'Vendor') as pihak_kedua"),
            DB::raw("'Rak Fisik' as lokasi"),
            "id_masuk as id_doc"
        ]);

        $transactions = DB::table($tableBK)->where($fk, $idBarang)->select([
            DB::raw("'OUTBOUND' as tipe"),
            DB::raw("0 as masuk"),
            "{$colQtyBK} as keluar",
            "{$colDateBK} as tanggal",
            "created_at",
            "keterangan as catatan",
            DB::raw("COALESCE(picker, 'Picker') as petugas"),
            DB::raw("COALESCE(penerima, 'Mandor') as pihak_kedua"),
            DB::raw("COALESCE(lokasi_proyek, 'Proyek') as lokasi"),
            "id_keluar as id_doc"
        ])->unionAll($inbounds)
          ->orderBy('tanggal', 'asc')
          ->orderBy('created_at', 'asc')
          ->get();

        $fileName = "Kartu_Stok_{$barang->kode_barang}_" . date('Ymd_His') . ".csv";

        return new StreamedResponse(function () use ($transactions, $barang) {
            $handle = fopen('php://output', 'w');
            
            // Tulis UTF-8 BOM agar Excel membukanya langsung rapi tanpa dialog encoding
            fputs($handle, "\xEF\xBB\xBF");

            // Header Dokumen
            fputcsv($handle, ['BUKU BESAR KARTU STOK MATERIAL']);
            fputcsv($handle, ['Part Number', $barang->kode_barang]);
            fputcsv($handle, ['Nama Material', $barang->nama_barang]);
            fputcsv($handle, ['Divisi', $barang->divisi]);
            fputcsv($handle, ['Satuan', $barang->unit]);
            fputcsv($handle, []);

            // Header Tabel
            fputcsv($handle, [
                'No', 'Tanggal', 'Waktu', 'Jenis Mutasi', 'No. Referensi', 
                'Petugas', 'Pihak Terkait', 'Lokasi/Sektor', 
                'Masuk (+)', 'Keluar (-)', 'Saldo Berjalan', 'Keterangan'
            ]);

            $balance = 0;
            foreach ($transactions as $idx => $t) {
                $balance = $balance + $t->masuk - $t->keluar;
                fputcsv($handle, [
                    $idx + 1,
                    Carbon::parse($t->tanggal)->format('d/m/Y'),
                    Carbon::parse($t->created_at ?? $t->tanggal)->format('H:i') . ' WIB',
                    $t->tipe,
                    ($t->tipe === 'INBOUND' ? 'BM-' : 'BK-') . str_pad($t->id_doc, 4, '0', STR_PAD_LEFT),
                    $t->petugas,
                    $t->pihak_kedua,
                    $t->lokasi,
                    $t->masuk > 0 ? $t->masuk : 0,
                    $t->keluar > 0 ? $t->keluar : 0,
                    $balance,
                    $t->catatan
                ]);
            }

            fclose($handle);
        }, 200, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            'Pragma'              => 'no-cache',
            'Cache-Control'       => 'must-revalidate, post-check=0, pre-check=0',
            'Expires'             => '0',
        ]);
    }
}