import React, { useState, useMemo } from 'react';
import { BarChart2, Calendar, Filter, Trash2, Eye, ArrowLeft, TrendingUp, Settings, Package, FileSpreadsheet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatRupiah, formatTanggalSingkat, getTodayStr, getLast7Days, getDayLabel } from '../utils/helpers';
import { deleteNota, KATEGORI_OPTIONS } from '../utils/storage';

export default function LaporanPenjualan({ notas, services = [], parts, onRefresh }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [kategori, setKategori] = useState('Semua');
  const [viewMode, setViewMode] = useState('Laporan'); // Laporan | DetailNota
  const [selectedNota, setSelectedNota] = useState(null);

  const today = getTodayStr();

  // 1. Combine Notas & Services
  const combinedTransactions = useMemo(() => {
    const validServices = services
      .filter(s => ['Berhasil Dikerjakan', 'Sudah Diambil'].includes(s.statusPengerjaan) && s.biaya > 0)
      .map(s => {
        const isLunas = s.statusPembayaran === 'Lunas' || !s.statusPembayaran;
        const jumlahMasuk = isLunas ? s.biaya : (s.dibayar || 0);
        return {
          id: s.id,
          nomorNota: s.noUrut,
          tanggal: s.tanggalMasuk,
          waktu: '-',
          namaCustomer: s.pemilik,
          namaAdmin: 'AGUS SUNARTO',
          keterangan: `Servis: ${s.jenis} ${s.merek} [${isLunas ? 'Lunas' : 'Belum Lunas'}]`,
          total: jumlahMasuk,
          isService: true,
          items: [{ 
            id: s.id, 
            partId: 'jasa-servis', 
            deskripsi: `Jasa Servis & Barang: ${s.keluhan}`, 
            qty: 1, 
            harga: jumlahMasuk, 
            subtotal: jumlahMasuk 
          }]
        };
      })
      .filter(s => s.total > 0);

    return [...notas, ...validServices];
  }, [notas, services]);

  // 2. Filtered Transactions
  const filteredNotas = useMemo(() => {
    return combinedTransactions.filter(n => {
      // Date filter
      if (startDate && n.tanggal < startDate) return false;
      if (endDate && n.tanggal > endDate) return false;
      
      // Category filter
      if (kategori !== 'Semua') {
        if (kategori === 'Jasa Servis') {
          return n.isService;
        }
        if (kategori === 'Penjualan') {
          return !n.isService;
        }
      }
      return true;
    }).sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  }, [combinedTransactions, parts, startDate, endDate, kategori]);

  // 3. Stats Calculation
  const totalHariIni = useMemo(() => {
    return combinedTransactions.filter(n => n.tanggal === today).reduce((sum, n) => sum + n.total, 0);
  }, [combinedTransactions, today]);

  const totalPeriode = useMemo(() => {
    return filteredNotas.reduce((sum, n) => sum + n.total, 0);
  }, [filteredNotas]);

  const totalServisPeriode = useMemo(() => {
    return filteredNotas.filter(n => n.isService).reduce((sum, n) => sum + n.total, 0);
  }, [filteredNotas]);

  const totalPartPeriode = useMemo(() => {
    return filteredNotas.filter(n => !n.isService).reduce((sum, n) => sum + n.total, 0);
  }, [filteredNotas]);

  // 4. Category Rekap Calculation
  const rekapKategori = useMemo(() => {
    const rekap = {};
    KATEGORI_OPTIONS.forEach(k => {
      rekap[k] = { nama: k, qty: 0, total: 0 };
    });
    // Add Jasa Servis to rekap explicitly
    rekap['Jasa Servis'] = { nama: 'Jasa Servis', qty: 0, total: 0 };

    filteredNotas.forEach(n => {
      n.items.forEach(item => {
        let kat = 'Sparepart';
        if (n.isService) {
          kat = 'Jasa Servis';
        } else {
          const part = parts.find(p => p.id === item.partId);
          let rawKat = item.kategori || (part ? part.kategori : '');
          
          // Fallback: detect second-hand units from description if the product was deleted
          if (!rawKat && item.deskripsi) {
            const descLower = item.deskripsi.toLowerCase();
            if (descLower.includes('second') || descLower.includes('bekas') || descLower.includes('seken') || descLower.includes('2nd')) {
              rawKat = 'Unit Second';
            }
          }
          
          if (!rawKat) rawKat = 'Sparepart';

          if (rawKat === 'Aksesoris' || rawKat === 'Aksesories') {
            kat = 'Accessories';
          } else if (rawKat === 'Unit / Hardware' || rawKat === 'Tools' || rawKat === 'Hardware') {
            kat = 'Unit New';
          } else if (rawKat === 'Part' || rawKat === 'Komponen') {
            kat = 'Sparepart';
          } else if (rawKat === 'Second' || rawKat === 'Bekas' || rawKat === 'Seken' || rawKat === 'Unit Second') {
            kat = 'Unit Second';
          } else {
            kat = rawKat;
          }
        }
        if (rekap[kat]) {
          rekap[kat].qty += item.qty;
          rekap[kat].total += item.subtotal;
        }
      });
    });

    return Object.values(rekap)
      .sort((a, b) => b.total - a.total); // Urutkan paling laku
  }, [filteredNotas, parts]);

  // 5. Chart Data (7 Hari Terakhir)
  const chartData = useMemo(() => {
    const last7Days = getLast7Days().reverse();
    return last7Days.map(date => {
      const dailyTotal = combinedTransactions
        .filter(n => n.tanggal === date)
        .reduce((sum, n) => sum + n.total, 0);
      return {
        name: getDayLabel(date),
        total: dailyTotal,
        date
      };
    });
  }, [combinedTransactions]);

  const handleExportCSV = () => {
    if (filteredNotas.length === 0) {
      alert('Tidak ada data untuk diekspor!');
      return;
    }

    const headers = ['No Nota', 'Tanggal', 'Tuan (Customer)', 'Jumlah (Nominal)', 'Keterangan', 'Admin'];
    const rows = filteredNotas.map(n => [
      n.nomorNota,
      n.tanggal,
      n.namaCustomer,
      n.total,
      n.keterangan || '-',
      n.namaAdmin
    ]);

    const csvContent = "\uFEFF" + [
      headers.join(';'),
      ...rows.map(r => r.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(';'))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `laporan_penjualan_ags_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id, noNota, isService) => {
    if (isService) {
      alert('Transaksi ini adalah Jasa Servis. Untuk menghapusnya, silakan buka menu Data Servisan dan hapus dari sana.');
      return;
    }
    if (confirm(`Hapus nota ${noNota}? Aksi ini juga akan menghapus catatan keuangan terkait.`)) {
      await deleteNota(id);
      if (onRefresh) await onRefresh();
    }
  };

  const handleShowDetail = (nota) => {
    setSelectedNota(nota);
    setViewMode('DetailNota');
  };

  if (viewMode === 'DetailNota' && selectedNota) {
    return (
      <div className="fade-in-up space-y-4">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => setViewMode('Laporan')} className="p-2 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-700">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-slate-800">Detail Nota: <span className="text-orange-500">{selectedNota.nomorNota}</span></h1>
        </div>

        <div className="card p-6 max-w-3xl mx-auto">
          <div className="flex justify-between border-b border-slate-200 mb-4">
            <div>
              <p className="text-sm text-slate-500">Tanggal Transaksi</p>
              <p className="font-semibold text-slate-700">{formatTanggalSingkat(selectedNota.tanggal)} - {selectedNota.waktu}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Customer</p>
              <p className="font-semibold text-slate-700">{selectedNota.namaCustomer}</p>
            </div>
          </div>

          <table className="w-full text-sm mb-6">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left rounded-l-lg">Deskripsi Item</th>
                <th className="px-3 py-2 text-center">Qty</th>
                <th className="px-3 py-2 text-right">Harga</th>
                <th className="px-3 py-2 text-right rounded-r-lg">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {selectedNota.items.map((item, i) => (
                <tr key={i}>
                  <td className="px-3 py-3 text-slate-700">
                    <div>{item.deskripsi}</div>
                    {item.keterangan && <div className="text-[10px] text-slate-500 italic">({item.keterangan})</div>}
                  </td>
                  <td className="px-3 py-3 text-center text-slate-600">{item.qty}</td>
                  <td className="px-3 py-3 text-right text-slate-600">{formatRupiah(item.harga)}</td>
                  <td className="px-3 py-3 text-right font-medium text-emerald-600">{formatRupiah(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200">
                <td colSpan={3} className="px-3 py-3 text-right font-bold text-slate-600">TOTAL:</td>
                <td className="px-3 py-3 text-right font-bold text-emerald-600 text-lg">{formatRupiah(selectedNota.total)}</td>
              </tr>
            </tfoot>
          </table>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-wrap justify-between items-center gap-2">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Admin / Kasir:</p>
              <p className="font-semibold text-slate-700">{selectedNota.namaAdmin}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 font-mono bg-white border border-slate-200 px-2 py-1 rounded shadow-sm flex items-center gap-1 select-all select-none">
                <span>🔒 AGS SECURE VERIFIED:</span>
                <span className="font-bold text-slate-800">
                  {selectedNota.isService 
                    ? btoa((selectedNota.nomorNota) + '|' + selectedNota.namaCustomer).substring(0, 16).toUpperCase()
                    : btoa(selectedNota.nomorNota + '|' + selectedNota.total).substring(0, 16).toUpperCase()
                  }
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalQtyRekap = rekapKategori.reduce((sum, r) => sum + r.qty, 0);
  const totalPendapatanRekap = rekapKategori.reduce((sum, r) => sum + r.total, 0);

  return (
    <div className="fade-in-up space-y-6">
      <div className="mb-2">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <BarChart2 className="text-orange-500" /> 
          Laporan Pemasukan
        </h1>
        <p className="text-sm text-slate-500 mt-1">Laporan dari Penjualan Sparepart, Accessories, Unit New, Unit Second, serta Jasa Servis</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 bg-gradient-to-br from-blue-50 to-white border-l-4 border-l-blue-500 border border-blue-100">
          <p className="text-sm text-slate-500 mb-1 flex items-center gap-2"><Calendar size={16}/> Pemasukan Hari Ini</p>
          <p className="text-2xl font-bold text-emerald-600">{formatRupiah(totalHariIni)}</p>
        </div>
        <div className="card p-5 bg-gradient-to-br from-emerald-50 to-white border-l-4 border-l-emerald-500 border border-emerald-100">
          <p className="text-sm text-slate-500 mb-1 flex items-center gap-2"><Filter size={16}/> Total Periode (Filter)</p>
          <p className="text-2xl font-bold text-emerald-600">{formatRupiah(totalPeriode)}</p>
          <p className="text-xs text-slate-500 mt-1">{filteredNotas.length} Transaksi</p>
        </div>
        <div className="card p-5 bg-gradient-to-br from-purple-50 to-white border-l-4 border-l-purple-500 border border-purple-100">
          <p className="text-sm text-slate-500 mb-1 flex items-center gap-2"><Package size={16} className="text-purple-500"/> Penjualan Barang</p>
          <p className="text-2xl font-bold text-emerald-600">{formatRupiah(totalPartPeriode)}</p>
          <p className="text-xs text-slate-500 mt-1">Periode Filter</p>
        </div>
        <div className="card p-5 bg-gradient-to-br from-orange-50 to-white border-l-4 border-l-orange-500 border border-orange-100">
          <p className="text-sm text-slate-500 mb-1 flex items-center gap-2"><Settings size={16} className="text-orange-500"/> Jasa Servis</p>
          <p className="text-2xl font-bold text-emerald-600">{formatRupiah(totalServisPeriode)}</p>
          <p className="text-xs text-slate-500 mt-1">Periode Filter</p>
        </div>
      </div>

      {/* Chart */}
      <div className="card p-4 flex flex-col mt-2">
        <h2 className="text-sm font-bold text-slate-600 mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-orange-500"/> Grafik Pendapatan 7 Hari Terakhir
        </h2>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `Rp ${val/1000}k`} />
              <RechartsTooltip 
                formatter={(value) => [formatRupiah(value), "Pendapatan"]}
                labelStyle={{ color: '#64748b' }}
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px' }}
              />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.date === today ? '#f97316' : '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Main Table */}
        <div className="xl:col-span-2 space-y-4">
          <div className="card p-4">
            <div className="flex flex-wrap gap-4 items-end mb-4">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Mulai Tanggal</label>
                <input type="date" className="input-field py-1.5" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Sampai Tanggal</label>
                <input type="date" className="input-field py-1.5" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Kategori Barang</label>
                <select className="select-field py-1.5 min-w-[150px]" value={kategori} onChange={e => setKategori(e.target.value)}>
                  <option value="Semua">Semua Kategori</option>
                  <option value="Jasa Servis">Jasa Servis</option>
                  <option value="Penjualan">Penjualan</option>
                </select>
              </div>
              {(startDate || endDate || kategori !== 'Semua') && (
                <button onClick={() => {setStartDate(''); setEndDate(''); setKategori('Semua');}} className="text-sm text-blue-400 hover:text-blue-300 py-1.5 px-2">Reset Filter</button>
              )}
              <button 
                onClick={handleExportCSV}
                className="py-1.5 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5 shadow-sm transition ml-auto"
              >
                <FileSpreadsheet size={13} /> Ekspor Excel (CSV)
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-3 font-semibold">No Nota</th>
                    <th className="px-3 py-3 font-semibold">Tanggal</th>
                    <th className="px-3 py-3 font-semibold">Tuan (Customer)</th>
                    <th className="px-3 py-3 font-semibold">Jumlah</th>
                    <th className="px-3 py-3 font-semibold">Keterangan</th>
                    <th className="px-3 py-3 font-semibold">Admin</th>
                    <th className="px-3 py-3 font-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredNotas.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-6 text-slate-500">Tidak ada transaksi pada periode ini</td></tr>
                  ) : (
                    filteredNotas.map(n => (
                      <tr key={n.id} className="hover:bg-orange-50/40 transition">
                        <td className="px-3 py-2 font-mono text-blue-600 text-xs">{n.nomorNota}</td>
                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{formatTanggalSingkat(n.tanggal)}</td>
                        <td className="px-3 py-2 text-slate-700 font-medium">{n.namaCustomer}</td>
                        <td className="px-3 py-2 font-semibold text-emerald-600 whitespace-nowrap">{formatRupiah(n.total)}</td>
                        <td className="px-3 py-2 text-slate-500 text-xs truncate max-w-[100px]">{n.keterangan}</td>
                        <td className="px-3 py-2 text-slate-600 text-xs">{n.namaAdmin}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => handleShowDetail(n)} className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded" title="Detail">
                              <Eye size={15}/>
                            </button>
                            <button onClick={() => handleDelete(n.id, n.nomorNota, n.isService)} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded" title="Hapus">
                              <Trash2 size={15}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Rekap Kategori */}
        <div className="space-y-4">
          <div className="card p-4">
            <h2 className="text-sm font-bold text-orange-500 mb-3 border-b border-slate-200 pb-2">Rekap per Kategori Terjual</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs text-left border-b border-slate-200">
                  <tr>
                    <th className="px-2 py-2 rounded-l-md">Kategori</th>
                    <th className="px-2 py-2 text-center">Qty</th>
                    <th className="px-2 py-2 text-right rounded-r-md">Pendapatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rekapKategori.length === 0 ? (
                    <tr><td colSpan={3} className="text-center py-4 text-slate-500 text-xs">Belum ada data penjualan</td></tr>
                  ) : (
                    rekapKategori.map(r => (
                      <tr key={r.nama} className="hover:bg-orange-50/40">
                        <td className="px-2 py-2 font-medium text-slate-600">{r.nama}</td>
                        <td className="px-2 py-2 text-center text-slate-500">{r.qty}</td>
                        <td className="px-2 py-2 text-right text-emerald-600 font-semibold">{formatRupiah(r.total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {rekapKategori.length > 0 && (
                  <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-bold">
                    <tr>
                      <td className="px-2 py-2 text-slate-700">TOTAL</td>
                      <td className="px-2 py-2 text-center text-slate-700">{totalQtyRekap}</td>
                      <td className="px-2 py-2 text-right text-emerald-600">{formatRupiah(totalPendapatanRekap)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
