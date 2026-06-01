import React, { useState, useMemo } from 'react';
import {
  BarChart2, TrendingUp, ShoppingCart, Package,
  Calendar, Filter, DollarSign, Award, FileText
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend
} from 'recharts';
import { formatRupiah, formatTanggalSingkat, getTodayStr, getLast7Days, getDayLabel, filterByDateRange } from '../utils/helpers';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-lg">
        <p className="text-slate-500 text-xs mb-1">{label}</p>
        <p className="text-blue-600 font-bold text-sm">{formatRupiah(payload[0]?.value || 0)}</p>
        {payload[1] && <p className="text-emerald-600 text-xs">{payload[1].value} transaksi</p>}
      </div>
    );
  }
  return null;
};

export default function Laporan({ spareparts, notas }) {
  const today = getTodayStr();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filtered, setFiltered] = useState(null);

  const activeNotas = filtered !== null ? filtered : notas;

  const handleFilter = () => {
    if (!startDate && !endDate) {
      setFiltered(null);
      return;
    }
    setFiltered(filterByDateRange(notas, startDate, endDate, 'tanggal'));
  };

  const handleResetFilter = () => {
    setStartDate('');
    setEndDate('');
    setFiltered(null);
  };

  // Ringkasan hari ini
  const todayStats = useMemo(() => {
    const todayNotas = notas.filter(n => n.tanggal === today);
    const pemasukan = todayNotas.reduce((s, n) => s + n.total, 0);
    const items = todayNotas.reduce((s, n) => s + n.items.reduce((ss, i) => ss + i.qty, 0), 0);
    return { transaksi: todayNotas.length, pemasukan, items };
  }, [notas, today]);

  // Grafik 7 hari terakhir
  const chartData = useMemo(() => {
    const days = getLast7Days();
    return days.map(day => {
      const dayNotas = notas.filter(n => n.tanggal === day);
      const pendapatan = dayNotas.reduce((s, n) => s + n.total, 0);
      const transaksi = dayNotas.length;
      return {
        tanggal: getDayLabel(day),
        Pendapatan: pendapatan,
        Transaksi: transaksi,
      };
    });
  }, [notas]);

  // Rekap per kategori
  const rekapKategori = useMemo(() => {
    const map = {};
    activeNotas.forEach(nota => {
      nota.items.forEach(item => {
        const sp = spareparts.find(s => s.id === (item.sparepartId || item.partId));
        let kategori = item.kategori || sp?.kategori || '';
        
        // Fallback: detect second-hand units from description if the product was deleted
        if (!kategori && item.deskripsi) {
          const descLower = item.deskripsi.toLowerCase();
          if (descLower.includes('second') || descLower.includes('bekas') || descLower.includes('seken') || descLower.includes('2nd')) {
            kategori = 'Unit Second';
          }
        }
        
        if (!kategori) kategori = 'Sparepart';
        
        // Normalize categories to match the standard options
        if (kategori === 'Aksesoris' || kategori === 'Aksesories') {
          kategori = 'Accessories';
        } else if (kategori === 'Unit / Hardware' || kategori === 'Tools' || kategori === 'Hardware') {
          kategori = 'Unit New';
        } else if (kategori === 'Part' || kategori === 'Komponen') {
          kategori = 'Sparepart';
        } else if (kategori === 'Second' || kategori === 'Bekas' || kategori === 'Seken') {
          kategori = 'Unit Second';
        }

        if (!map[kategori]) map[kategori] = { kategori, qtyTerjual: 0, totalPendapatan: 0 };
        map[kategori].qtyTerjual += item.qty;
        map[kategori].totalPendapatan += item.subtotal;
      });
    });
    return Object.values(map).sort((a, b) => b.totalPendapatan - a.totalPendapatan);
  }, [activeNotas, spareparts]);

  // Catatan keuangan
  const catatanKeuangan = useMemo(() => {
    return [...activeNotas]
      .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
      .map(nota => ({
        tanggal: nota.tanggal,
        deskripsi: `Penjualan ${nota.nomorNota} - ${nota.namaPembeli}`,
        jumlah: nota.total,
      }));
  }, [activeNotas]);

  const totalPendapatan = useMemo(() => activeNotas.reduce((s, n) => s + n.total, 0), [activeNotas]);
  const totalTransaksi = activeNotas.length;
  const totalItemTerjual = useMemo(() =>
    activeNotas.reduce((s, n) => s + n.items.reduce((ss, i) => ss + i.qty, 0), 0),
    [activeNotas]
  );

  return (
    <div className="fade-in-up space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Laporan & Hitung Penjualan</h1>
          <p className="page-subtitle">Analisis dan rekap data penjualan bengkel</p>
        </div>
      </div>

      {/* Ringkasan Hari Ini */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Calendar size={14} /> Ringkasan Hari Ini
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-5 border-l-4 border-blue-500">
            <p className="text-3xl font-bold text-slate-800">{todayStats.transaksi}</p>
            <p className="text-sm text-slate-600 font-medium mt-1">Total Transaksi</p>
            <p className="text-xs text-slate-500 mt-0.5">Nota masuk hari ini</p>
          </div>
          <div className="card p-5 border-l-4 border-emerald-500">
            <p className="text-2xl font-bold text-emerald-600">{formatRupiah(todayStats.pemasukan)}</p>
            <p className="text-sm text-slate-600 font-medium mt-1">Total Pemasukan</p>
            <p className="text-xs text-slate-500 mt-0.5">Omset hari ini</p>
          </div>
          <div className="card p-5 border-l-4 border-violet-500">
            <p className="text-3xl font-bold text-slate-800">{todayStats.items}</p>
            <p className="text-sm text-slate-600 font-medium mt-1">Item Terjual</p>
            <p className="text-xs text-slate-500 mt-0.5">Total unit hari ini</p>
          </div>
        </div>
      </div>

      {/* Filter Rentang Tanggal */}
      <div className="card p-5">
        <h2 className="font-semibold text-slate-700 flex items-center gap-2 mb-4">
          <Filter size={18} className="text-blue-600" />
          Filter Rentang Tanggal
          {filtered !== null && (
            <span className="badge badge-blue ml-2">{filtered.length} nota difilter</span>
          )}
        </h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="label">Tanggal Mulai</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Tanggal Akhir</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="input-field"
            />
          </div>
          <button onClick={handleFilter} className="btn-primary">
            <Filter size={16} /> Terapkan Filter
          </button>
          {filtered !== null && (
            <button onClick={handleResetFilter} className="btn-secondary">
              Tampilkan Semua
            </button>
          )}
        </div>
      </div>

      {/* Summary Terfilter */}
      {filtered !== null && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-4 text-center bg-blue-50 border-blue-200">
            <p className="text-2xl font-bold text-blue-600">{totalTransaksi}</p>
            <p className="text-xs text-slate-500 mt-1">Transaksi</p>
          </div>
          <div className="card p-4 text-center bg-emerald-50 border-emerald-200">
            <p className="text-xl font-bold text-emerald-600">{formatRupiah(totalPendapatan)}</p>
            <p className="text-xs text-slate-500 mt-1">Total Pendapatan</p>
          </div>
          <div className="card p-4 text-center bg-violet-50 border-violet-200">
            <p className="text-2xl font-bold text-violet-600">{totalItemTerjual}</p>
            <p className="text-xs text-slate-500 mt-1">Item Terjual</p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="card p-5">
        <h2 className="font-semibold text-slate-700 flex items-center gap-2 mb-6">
          <BarChart2 size={18} className="text-blue-600" />
          Grafik Pendapatan 7 Hari Terakhir
        </h2>
        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="tanggal"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={v => v >= 1000000 ? `${v/1000000}jt` : v >= 1000 ? `${v/1000}rb` : v}
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Pendapatan" radius={[6, 6, 0, 0]} maxBarSize={60}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.tanggal.includes(getDayLabel(today)) ? '#10b981' : '#3b82f6'}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-slate-500 text-center mt-2">Hijau = hari ini</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Rekap per Kategori */}
        <div className="card">
          <div className="p-5 border-b border-slate-200">
            <h2 className="font-semibold text-slate-700 flex items-center gap-2">
              <Award size={18} className="text-amber-500" />
              Rekap per Kategori
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="table-header">Peringkat</th>
                  <th className="table-header">Kategori</th>
                  <th className="table-header text-right">Qty Terjual</th>
                  <th className="table-header text-right">Total Pendapatan</th>
                </tr>
              </thead>
              <tbody>
                {rekapKategori.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-500 text-sm">Tidak ada data</td>
                  </tr>
                ) : (
                  rekapKategori.map((row, i) => (
                    <tr key={row.kategori} className="table-row">
                      <td className="table-cell">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold
                          ${i === 0 ? 'bg-amber-100 text-amber-600' :
                            i === 1 ? 'bg-slate-100 text-slate-600' :
                              i === 2 ? 'bg-orange-100 text-orange-600' :
                                'bg-slate-100 text-slate-500'}`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="table-cell font-medium text-slate-700">{row.kategori}</td>
                      <td className="table-cell text-right text-blue-600 font-semibold">{row.qtyTerjual}</td>
                      <td className="table-cell text-right text-emerald-600 font-bold">{formatRupiah(row.totalPendapatan)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {rekapKategori.length > 0 && (
                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-50">
                    <td colSpan={2} className="table-cell font-bold text-slate-700">TOTAL</td>
                    <td className="table-cell text-right font-bold text-blue-600">{rekapKategori.reduce((s, r) => s + r.qtyTerjual, 0)}</td>
                    <td className="table-cell text-right font-bold text-emerald-600">{formatRupiah(rekapKategori.reduce((s, r) => s + r.totalPendapatan, 0))}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Catatan Keuangan */}
        <div className="card">
          <div className="p-5 border-b border-slate-200">
            <h2 className="font-semibold text-slate-700 flex items-center gap-2">
              <FileText size={18} className="text-violet-600" />
              Catatan Keuangan
            </h2>
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="table-header">Tanggal</th>
                  <th className="table-header">Deskripsi</th>
                  <th className="table-header text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {catatanKeuangan.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-10 text-center text-slate-500 text-sm">Tidak ada data transaksi</td>
                  </tr>
                ) : (
                  catatanKeuangan.map((row, i) => (
                    <tr key={i} className="table-row">
                      <td className="table-cell text-slate-500 text-xs whitespace-nowrap">{formatTanggalSingkat(row.tanggal)}</td>
                      <td className="table-cell text-sm text-slate-700">{row.deskripsi}</td>
                      <td className="table-cell text-right text-emerald-600 font-semibold whitespace-nowrap">{formatRupiah(row.jumlah)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {catatanKeuangan.length > 0 && (
            <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50">
              <span className="text-sm text-slate-500">Total {catatanKeuangan.length} transaksi</span>
              <span className="text-emerald-600 font-bold">{formatRupiah(totalPendapatan)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
