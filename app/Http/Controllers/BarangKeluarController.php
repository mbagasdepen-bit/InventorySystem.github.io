<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use App\Models\Barang;
use App\Models\BarangKeluar;
use Inertia\Inertia;
use Carbon\Carbon;

class BarangKeluarController extends Controller
{
    /**
     * Catat Log Aktivitas Tunggal (Hanya saat ada aksi pengguna)
     */
    private function catatLogAktivitas($aksi, $refDoc, $detail)
    {
        try {
            $tableName = Schema::hasTable('log_aktivitas') ? 'log_aktivitas' : (Schema::hasTable('activity_logs') ? 'activity_logs' : null);
            if (!$tableName) return;

            $cols = Schema::getColumnListing($tableName);
            $payload = [];
            
            if (in_array('waktu', $cols)) $payload['waktu'] = Carbon::now('Asia/Jakarta');
            if (in_array('user', $cols)) $payload['user'] = auth()->user()->name ?? 'Administrator';
            if (in_array('role', $cols)) $payload['role'] = 'Administrator';
            if (in_array('kategori', $cols)) $payload['kategori'] = 'Outbound';
            if (in_array('ref_doc', $cols)) $payload['ref_doc'] = $refDoc;
            if (in_array('aksi', $cols)) $payload['aksi'] = $aksi;
            if (in_array('action', $cols)) $payload['action'] = $aksi;
            if (in_array('detail', $cols)) $payload['detail'] = $detail;
            if (in_array('description', $cols)) $payload['description'] = $detail;
            if (in_array('status', $cols)) $payload['status'] = 'Tervalidasi';
            if (in_array('created_at', $cols)) $payload['created_at'] = now();
            if (in_array('updated_at', $cols)) $payload['updated_at'] = now();

            DB::table($tableName)->insert($payload);
        } catch (\Exception $e) {
            // Safe logging
        }
    }

    /**
     * Penyesuaian Kolom Database Saja (Tanpa Perulangan Log)
     */
    private function autoMigrateAndRepair()
    {
        try {
            $tableName = Schema::hasTable('barang_keluar') ? 'barang_keluar' : 'barang_keluars';

            if (!Schema::hasColumn($tableName, 'lokasi_proyek')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->string('lokasi_proyek', 255)->nullable();
                });
            }
            if (!Schema::hasColumn($tableName, 'picker')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->string('picker', 100)->nullable();
                });
            }
            if (!Schema::hasColumn($tableName, 'penerima')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->string('penerima', 100)->nullable();
                });
            }
            if (!Schema::hasColumn($tableName, 'keterangan')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->string('keterangan', 255)->nullable();
                });
            }

            // Standardisasi data lama
            DB::table($tableName)
                ->where(function ($q) {
                    $q->whereNull('picker')
                      ->orWhere('picker', '')
                      ->orWhere('picker', '-')
                      ->orWhere('picker', '-')
                      ->orWhere('picker', 'like', '%Petugas Gudang%');
                })
                ->update(['picker' => 'Administrator']);
        } catch (\Exception $e) {
            // Abaikan jika database sudah sinkron
        }
    }

    public function index(Request $request)
    {
        date_default_timezone_set('Asia/Jakarta');
        Carbon::setLocale('id');

        $this->autoMigrateAndRepair();

        $query = BarangKeluar::with('barang')->orderBy('tanggal', 'desc');

        if ($request->filled('q')) {
            $q = $request->q;
            $query->where(function ($sub) use ($q) {
                $sub->where('penerima', 'like', "%{$q}%")
                    ->orWhere('lokasi_proyek', 'like', "%{$q}%")
                    ->orWhere('keterangan', 'like', "%{$q}%")
                    ->orWhereHas('barang', function ($b) use ($q) {
                        $b->where('nama_barang', 'like', "%{$q}%")
                          ->orWhere('kode_barang', 'like', "%{$q}%");
                    });
            });
        }

        $listKeluar = $query->get()->map(function ($item) {
            $lokasi = $item->lokasi_proyek ?? $item->sektor ?? $item->lokasi ?? '';
            $ket = $item->keterangan ?? $item->keperluan ?? '';

            if ((empty($lokasi) || $lokasi === '-') && !empty($ket) && $ket !== '-') {
                $lokasi = $ket;
            }

            return [
                'id_keluar'     => $item->getKey() ?? ($item->id_keluar ?? ($item->id ?? ($item->id_bk ?? 0))),
                'id_barang'     => $item->id_barang ?? $item->barang_id,
                'kode_barang'   => $item->barang->kode_barang ?? '-',
                'nama_barang'   => $item->barang->nama_barang ?? 'Material Gudang',
                'divisi'        => $item->barang->divisi ?? 'Sipil',
                'unit'          => $item->barang->unit ?? 'Unit',
                'tanggal'       => Carbon::parse($item->tanggal ?? $item->tgl_keluar)->translatedFormat('d M Y'),
                'qty'           => (int) ($item->qty ?? $item->jumlah ?? $item->jumlah_keluar ?? 0),
                'penerima'      => $item->penerima ?? $item->diterima_oleh ?? '-',
                'picker'        => 'Administrator',
                'lokasi_proyek' => $lokasi ?: 'Sektor Lapangan',
                'keterangan'    => $ket,
            ];
        });

        $barangOptions = Barang::orderBy('nama_barang', 'asc')->get()->map(function ($b) {
            return [
                'id_barang'   => $b->id_barang ?? $b->id,
                'kode_barang' => $b->kode_barang,
                'nama_barang' => $b->nama_barang,
                'divisi'      => $b->divisi ?? 'Sipil',
                'stok'        => (int) $b->stok,
                'unit'        => $b->unit ?? 'Unit',
                'min_stok'    => (int) ($b->min_stok ?? 5),
                'remarks'     => $b->remarks ?? '-',
                'distrik'     => $b->distrik ?? 'Distrik Utama',
            ];
        });

        return Inertia::render('OutboundStock', [
            'listKeluar'    => $listKeluar,
            'barangOptions' => $barangOptions,
            'filters'       => $request->only('q'),
        ]);
    }

    public function store(Request $request)
    {
        $idBarang = $request->id_barang ?: $request->barang_id;
        $qty = (int) ($request->qty ?: ($request->jumlah ?: $request->jumlah_keluar));

        if (!$idBarang || $qty <= 0) {
            return back()->withErrors(['general' => 'Material dan kuantitas valid wajib diisi.']);
        }

        $this->autoMigrateAndRepair();

        try {
            DB::transaction(function () use ($idBarang, $qty, $request) {
                $pkCol = Schema::hasColumn('barang', 'id_barang') ? 'id_barang' : 'id';

                $barang = DB::table('barang')
                    ->where($pkCol, $idBarang)
                    ->lockForUpdate()
                    ->first();

                if (!$barang) {
                    throw new \Exception('Material SKU tidak ditemukan di database.');
                }

                if ($barang->stok < $qty) {
                    throw new \Exception("Stok fisik di rak tidak mencukupi! Sisa stok saat ini: {$barang->stok} {$barang->unit}, permintaan keluar: {$qty} {$barang->unit}.");
                }

                // Potong stok
                DB::table('barang')->where($pkCol, $idBarang)->decrement('stok', $qty);

                $tableBK = Schema::hasTable('barang_keluar') ? 'barang_keluar' : 'barang_keluars';
                $columns = Schema::getColumnListing($tableBK);

                $lokasiInput = $request->lokasi_proyek ?: ($request->keterangan ?: 'Sektor Proyek Lapangan');
                $ketInput = $request->keterangan ?: '-';

                $dataInsert = [];
                if (in_array('id_barang', $columns)) $dataInsert['id_barang'] = $idBarang;
                if (in_array('barang_id', $columns)) $dataInsert['barang_id'] = $idBarang;
                if (in_array('qty', $columns)) $dataInsert['qty'] = $qty;
                if (in_array('jumlah', $columns)) $dataInsert['jumlah'] = $qty;
                if (in_array('tanggal', $columns)) $dataInsert['tanggal'] = $request->tanggal ?: date('Y-m-d');
                if (in_array('penerima', $columns)) $dataInsert['penerima'] = $request->penerima ?: 'Mandor Proyek';
                if (in_array('picker', $columns)) $dataInsert['picker'] = 'Administrator';
                if (in_array('lokasi_proyek', $columns)) $dataInsert['lokasi_proyek'] = $lokasiInput;
                if (in_array('lokasi', $columns)) $dataInsert['lokasi'] = $lokasiInput;
                if (in_array('sektor', $columns)) $dataInsert['sektor'] = $lokasiInput;
                if (in_array('keterangan', $columns)) $dataInsert['keterangan'] = $ketInput;
                if (in_array('created_at', $columns)) $dataInsert['created_at'] = now();
                if (in_array('updated_at', $columns)) $dataInsert['updated_at'] = now();

                DB::table($tableBK)->insert($dataInsert);

                // HANYA MENCATAT 1 BARIS LOG UNTUK TRANSAKSI INI
                $this->catatLogAktivitas(
                    'Pengeluaran Material',
                    $barang->kode_barang,
                    "Mengeluarkan {$qty} {$barang->unit} [{$barang->kode_barang}] {$barang->nama_barang} ke {$lokasiInput}"
                );
            });

            return back()->with('pesan', 'Pengeluaran material berhasil diverifikasi.');
        } catch (\Exception $e) {
            return back()->withErrors(['general' => $e->getMessage()]);
        }
    }

    public function destroy($id)
    {
        if (!$id || $id === 'undefined') {
            return back()->withErrors(['general' => 'ID transaksi tidak valid.']);
        }

        try {
            DB::transaction(function () use ($id) {
                $tableName = Schema::hasTable('barang_keluar') ? 'barang_keluar' : 'barang_keluars';
                $columns = Schema::getColumnListing($tableName);

                $record = null;
                $pkCol = null;

                foreach (['id_keluar', 'id', 'id_bk', 'id_barang_keluar'] as $col) {
                    if (in_array($col, $columns)) {
                        $record = DB::table($tableName)->where($col, $id)->first();
                        if ($record) {
                            $pkCol = $col;
                            break;
                        }
                    }
                }

                if (!$record) {
                    throw new \Exception('Data transaksi mutasi pengeluaran tidak ditemukan di database.');
                }

                $idBarang = $record->id_barang ?? $record->barang_id;
                $qty = (int) ($record->qty ?? $record->jumlah ?? $record->jumlah_keluar ?? 0);

                $barang = DB::table('barang')->where('id_barang', $idBarang)->lockForUpdate()->first();
                $pkBarang = 'id_barang';
                if (!$barang) {
                    $barang = DB::table('barang')->where('id', $idBarang)->lockForUpdate()->first();
                    $pkBarang = 'id';
                }

                if ($barang) {
                    DB::table('barang')->where($pkBarang, $idBarang)->increment('stok', $qty);
                }

                DB::table($tableName)->where($pkCol, $id)->delete();

                // Catat log pembatalan tunggal
                $kodeBarang = $barang->kode_barang ?? 'SKU';
                $namaBarang = $barang->nama_barang ?? 'Material';
                $this->catatLogAktivitas(
                    'Pembatalan Outbound (Void)',
                    $kodeBarang,
                    "Membatalkan pengeluaran {$qty} material [{$kodeBarang}] {$namaBarang}. Saldo fisik di rak dikembalikan."
                );
            });

            return back()->with('pesan', 'Pengeluaran material berhasil dibatalkan dan saldo stok telah dikembalikan ke rak.');
        } catch (\Exception $e) {
            return back()->withErrors(['general' => $e->getMessage()]);
        }
    }
}