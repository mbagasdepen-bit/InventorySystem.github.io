<?php

namespace App\Http\Controllers;

use App\Models\Barang;
use App\Models\BarangMasuk;
use App\Models\LogAktivitas;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

class BarangMasukController extends Controller
{
    private function autoMigrateAndRepair()
    {
        try {
            $tableName = Schema::hasTable('barang_masuk') ? 'barang_masuk' : 'barang_masuks';

            if (!Schema::hasColumn($tableName, 'diterima_oleh')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->string('diterima_oleh', 100)->nullable();
                });
            }

            if (!Schema::hasColumn($tableName, 'diserahkan_oleh')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->string('diserahkan_oleh', 100)->nullable();
                });
            }

            $defaultChecker = auth()->user()->name ?? 'Administrator';
            DB::table($tableName)->whereNull('diterima_oleh')
                ->orWhere('diterima_oleh', '')
                ->orWhere('diterima_oleh', '-')
                ->update(['diterima_oleh' => $defaultChecker]);

            DB::table($tableName)->whereNull('diserahkan_oleh')
                ->orWhere('diserahkan_oleh', '')
                ->orWhere('diserahkan_oleh', '-')
                ->update(['diserahkan_oleh' => 'Kurir / Vendor Ekspedisi']);
        } catch (\Exception $e) {
            // Safe silent migration
        }
    }

    public function index(Request $request)
    {
        date_default_timezone_set('Asia/Jakarta');
        Carbon::setLocale('id');

        $this->autoMigrateAndRepair();

        $cari = $request->query('q', '');
        $tableBM = Schema::hasTable('barang_masuk') ? 'barang_masuk' : 'barang_masuks';
        $pkBarang = Schema::hasColumn('barang', 'id_barang') ? 'id_barang' : 'id';
        $fkBM = Schema::hasColumn($tableBM, 'id_barang') ? 'id_barang' : 'barang_id';

        $query = DB::table($tableBM)
            ->leftJoin('barang', "{$tableBM}.{$fkBM}", '=', "barang.{$pkBarang}")
            ->select(
                "{$tableBM}.*",
                'barang.kode_barang',
                'barang.nama_barang',
                'barang.divisi',
                'barang.unit',
                'barang.distrik'
            );

        if (!empty($cari)) {
            $query->where(function ($q) use ($cari, $tableBM) {
                $q->where('barang.kode_barang', 'like', "%{$cari}%")
                  ->orWhere('barang.nama_barang', 'like', "%{$cari}%")
                  ->orWhere('barang.divisi', 'like', "%{$cari}%")
                  ->orWhere("{$tableBM}.keterangan", 'like', "%{$cari}%")
                  ->orWhere("{$tableBM}.tanggal", 'like', "%{$cari}%");

                if (Schema::hasColumn($tableBM, 'diterima_oleh')) {
                    $q->orWhere("{$tableBM}.diterima_oleh", 'like', "%{$cari}%");
                }
                if (Schema::hasColumn($tableBM, 'diserahkan_oleh')) {
                    $q->orWhere("{$tableBM}.diserahkan_oleh", 'like', "%{$cari}%");
                }
            });
        }

        $allMasuk = $query->orderBy("{$tableBM}.tanggal", 'desc')->get();
        $defaultName = auth()->user()->name ?? 'Administrator';

        $listMasuk = $allMasuk->map(function ($item, $idx) use ($defaultName) {
            $qty = (int) ($item->qty ?? $item->jumlah ?? 0);

            $fotoUrl = null;
            if (!empty($item->foto)) {
                $fotoUrl = str_starts_with($item->foto, 'http') || str_starts_with($item->foto, '/') 
                    ? $item->foto 
                    : asset('storage/' . $item->foto);
            }

            $checker = !empty($item->diterima_oleh) && $item->diterima_oleh !== '-' ? $item->diterima_oleh : $defaultName;
            $pengantar = !empty($item->diserahkan_oleh) && $item->diserahkan_oleh !== '-' ? $item->diserahkan_oleh : 'Kurir / Vendor Ekspedisi';

            $pkMasukCol = Schema::hasColumn('barang_masuk', 'id_masuk') ? 'id_masuk' : 'id';

            return [
                'id_masuk'        => $item->$pkMasukCol ?? ($idx + 1),
                'id_barang'       => $item->id_barang ?? $item->barang_id,
                'tanggal'         => Carbon::parse($item->tanggal)->translatedFormat('d M Y'),
                'raw_tanggal'     => $item->tanggal,
                'foto'            => $fotoUrl,
                'kode_barang'     => $item->kode_barang ?? '-',
                'nama_barang'     => $item->nama_barang ?? 'Material Dihapus',
                'divisi'          => $item->divisi ?? '-',
                'qty'             => $qty,
                'unit'            => $item->unit ?? 'Unit',
                'diterima_oleh'   => $checker,
                'diserahkan_oleh' => $pengantar,
                'keterangan'      => $item->keterangan ?? '-',
            ];
        });

        $barangOptions = Barang::orderBy('nama_barang', 'asc')->get()->map(function ($b) use ($pkBarang) {
            return [
                'id_barang'   => $b->$pkBarang,
                'kode_barang' => $b->kode_barang,
                'nama_barang' => $b->nama_barang,
                'unit'        => $b->unit,
                'stok'        => (int) $b->stok,
                'distrik'     => $b->distrik ?? '',
            ];
        });

        return Inertia::render('InboundStock', [
            'listMasuk'     => $listMasuk,
            'barangOptions' => $barangOptions,
            'filters'       => ['q' => $cari],
            'flash'         => ['pesan' => session('pesan')]
        ]);
    }

    public function store(Request $request)
    {
        $pkBarang = Schema::hasColumn('barang', 'id_barang') ? 'id_barang' : 'id';
        $idBarangInput = $request->id_barang ?: $request->barang_id;

        $validated = $request->validate([
            'id_barang'       => "required|exists:barang,{$pkBarang}",
            'tanggal'         => 'required|date',
            'qty'             => 'required|integer|min:1',
            'diterima_oleh'   => 'nullable|string|max:100',
            'diserahkan_oleh' => 'nullable|string|max:100',
            'keterangan'      => 'nullable|string|max:255',
            'foto'            => 'nullable|image|max:2048',
        ]);

        $this->autoMigrateAndRepair();

        $fotoPath = null;
        if ($request->hasFile('foto')) {
            $fotoPath = $request->file('foto')->store('inbound', 'public');
            $fotoPath = '/storage/' . $fotoPath;
        }

        $barang = Barang::where($pkBarang, $idBarangInput)->firstOrFail();

        $checkerName = !empty($validated['diterima_oleh']) ? $validated['diterima_oleh'] : (auth()->user()->name ?? 'Administrator');
        $vendorName = !empty($validated['diserahkan_oleh']) ? $validated['diserahkan_oleh'] : 'Kurir / Driver Vendor';

        $tableName = Schema::hasTable('barang_masuk') ? 'barang_masuk' : 'barang_masuks';
        $columns = Schema::getColumnListing($tableName);
        $fkCol = in_array('id_barang', $columns) ? 'id_barang' : 'barang_id';

        $dataInsert = [
            $fkCol            => $idBarangInput,
            'tanggal'         => $validated['tanggal'],
            'keterangan'      => $validated['keterangan'] ?? '-',
            'foto'            => $fotoPath,
            'diterima_oleh'   => $checkerName,
            'diserahkan_oleh' => $vendorName,
            'created_at'      => now(),
            'updated_at'      => now(),
        ];

        if (in_array('qty', $columns)) $dataInsert['qty'] = $validated['qty'];
        if (in_array('jumlah', $columns)) $dataInsert['jumlah'] = $validated['qty'];

        DB::table($tableName)->insert($dataInsert);

        // Tambah stok fisik di master SKU
        Barang::where($pkBarang, $idBarangInput)->increment('stok', $validated['qty']);

        // Catat Audit Trail
        date_default_timezone_set('Asia/Jakarta');
        try {
            LogAktivitas::create([
                'waktu'    => Carbon::now('Asia/Jakarta'),
                'user'     => auth()->user()->name ?? 'Administrator',
                'role'     => auth()->user()->role === 'admin' ? 'Administrator' : 'Staff Gudang',
                'kategori' => 'Inbound',
                'ref_doc'  => $barang->kode_barang,
                'aksi'     => 'Penerimaan Material (+Masuk)',
                'detail'   => 'Diterima ' . $validated['qty'] . ' ' . $barang->unit . ' [' . $barang->kode_barang . '] oleh ' . $checkerName . ' dari ' . $vendorName,
                'status'   => 'Tervalidasi',
            ]);
        } catch (\Exception $e) {
            // safe logging
        }

        return redirect()->back()->with('pesan', 'Penerimaan material berhasil dicatat dan diverifikasi!');
    }

    public function destroy($id)
    {
        try {
            DB::transaction(function () use ($id) {
                $tableName = Schema::hasTable('barang_masuk') ? 'barang_masuk' : 'barang_masuks';
                $columns = Schema::getColumnListing($tableName);

                $record = null;
                $pk = null;
                foreach (['id_masuk', 'id', 'id_bm', 'barang_masuk_id'] as $col) {
                    if (in_array($col, $columns)) {
                        $record = DB::table($tableName)->where($col, $id)->first();
                        if ($record) {
                            $pk = $col;
                            break;
                        }
                    }
                }

                if (!$record) {
                    throw new \Exception('Data transaksi penerimaan tidak ditemukan.');
                }

                $idBarang = $record->id_barang ?? $record->barang_id;
                $qty = (int) ($record->qty ?? $record->jumlah ?? $record->jumlah_masuk ?? 0);

                $pkBarang = Schema::hasColumn('barang', 'id_barang') ? 'id_barang' : 'id';
                $barang = DB::table('barang')->where($pkBarang, $idBarang)->lockForUpdate()->first();

                if ($barang) {
                    if ($barang->stok < $qty) {
                        throw new \Exception("Gagal menghapus! Sisa stok di rak tinggal {$barang->stok} {$barang->unit}, tidak cukup untuk menarik kembali {$qty} {$barang->unit} karena sebagian material sudah keluar ke proyek.");
                    }

                    DB::table('barang')->where($pkBarang, $idBarang)->decrement('stok', $qty);
                }

                DB::table($tableName)->where($pk, $id)->delete();
            });

            return back()->with('pesan', 'Penerimaan material berhasil dihapus dan penambahan saldo telah ditarik kembali.');
        } catch (\Exception $e) {
            return back()->withErrors(['general' => $e->getMessage()]);
        }
    }
}


