import React, { useMemo } from 'react';
import {
  Package, ShoppingCart, TrendingUp, AlertTriangle,
  ArrowUpRight, Clock, CheckCircle2, Boxes
} from 'lucide-react';
import { formatRupiah, formatTanggalSingkat, getTodayStr } from '../utils/helpers';

const StatCard = ({ icon: Icon, title, value, subtitle, color, trend }) => (
    <div className="stat-card group hover:border-slate-300 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={20} className="opacity-90" />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full
            ${trend >= 0 ? 'text-emerald-700 bg-emerald-100' : 'text-red-600 bg-red-100'}`}>
            <ArrowUpRight size={12} className={trend < 0 ? 'rotate-180' : ''} />
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm font-medium text-slate-600">{title}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

export default function Dashboard({ spareparts = [], notas = [], services = [] }) {
  const today = getTodayStr();

  const stats = useMemo(() => {
    // 1. Pemasukan Hari Ini (Penjualan Part + Jasa Servis yang diselesaikan/diambil hari ini)
    const todayNotas = notas.filter(n => n.tanggal === today);
    const todayNotasTotal = todayNotas.reduce((sum, n) => sum + n.total, 0);

    let todayServicesTotal = 0;
    let todayServicesCount = 0;

    services.forEach(s => {
      if (s.statusPengerjaan !== 'Sudah Diambil' || !(s.biaya > 0)) return;

      const isLunas = s.statusPembayaran === 'Lunas' || !s.statusPembayaran;
      const totalPaid = isLunas ? s.biaya : (s.dibayar || 0);

      if (totalPaid <= 0) return;

      // Parse installments
      let installments = [];
      try {
        if (s.riwayatCicilan) {
          installments = typeof s.riwayatCicilan === 'string'
            ? JSON.parse(s.riwayatCicilan)
            : s.riwayatCicilan;
        }
      } catch (e) {
        installments = [];
      }

      const sumInstallments = installments.reduce((sum, item) => sum + (item.jumlah || 0), 0);
      const initialPaymentAmount = totalPaid - sumInstallments;

      // Check initial payment date
      if (initialPaymentAmount > 0) {
        const tanggalInit = s.tanggalAmbil || s.tanggalMasuk;
        if (tanggalInit === today) {
          todayServicesTotal += initialPaymentAmount;
          todayServicesCount++;
        }
      }

      // Check installment dates
      installments.forEach(inst => {
        if (inst.tanggal === today) {
          todayServicesTotal += inst.jumlah;
          todayServicesCount++;
        }
      });
    });

    const pemasukanHariIni = todayNotasTotal + todayServicesTotal;

    // 2. Transaksi Hari Ini
    const transaksiHariIni = todayNotas.length + todayServicesCount;

    // 3. Antrean Servis Aktif (Proses Pengerjaan)
    const antreanServis = services.filter(s => s.statusPengerjaan === 'Proses Pengerjaan').length;

    // 4. Stok Menipis (Stok < 5)
    const stokMenipis = spareparts.filter(s => s.stok < 5);

    return {
      pemasukanHariIni,
      transaksiHariIni,
      antreanServis,
      stokMenipis,
      itemTerjualHariIni: todayNotas.reduce((sum, n) => sum + n.items.reduce((s, i) => s + i.qty, 0), 0)
    };
  }, [spareparts, notas, services, today]);

  const recentNotas = useMemo(() => {
    return [...notas].sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    ).slice(0, 5);
  }, [notas]);

  return (
    <div className="fade-in-up space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title text-2xl font-extrabold text-slate-800">Dashboard</h1>
          <p className="page-subtitle text-sm text-slate-500">Selamat datang! Ringkasan operasional bengkel hari ini.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Clock size={16} />
          <span>{formatTanggalSingkat(today)}</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          title="Pemasukan Hari Ini"
          value={formatRupiah(stats.pemasukanHariIni)}
          subtitle="Part & jasa servis hari ini"
          color="bg-emerald-100 text-emerald-600 font-bold"
        />
        <StatCard
          icon={ShoppingCart}
          title="Transaksi Hari Ini"
          value={`${stats.transaksiHariIni} nota`}
          subtitle={`${stats.itemTerjualHariIni} unit sparepart terjual`}
          color="bg-blue-100 text-blue-600 font-bold"
        />
        <StatCard
          icon={Clock}
          title="Antrean Servis Aktif"
          value={`${stats.antreanServis} unit`}
          subtitle="Sedang dalam proses pengerjaan"
          color="bg-violet-100 text-violet-600 font-bold"
        />
        <StatCard
          icon={AlertTriangle}
          title="Stok Menipis"
          value={`${stats.stokMenipis.length} item`}
          subtitle="Part dengan stok < 5"
          color="bg-amber-100 text-amber-600 font-bold"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="card xl:col-span-2">
          <div className="p-5 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-blue-500" />
                Transaksi Terbaru
              </h2>
              <span className="badge badge-blue">{recentNotas.length} nota</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            {recentNotas.length === 0 ? (
              <div className="p-10 text-center text-slate-500">
                <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
                <p>Belum ada transaksi</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="table-header">No. Nota</th>
                    <th className="table-header">Tanggal</th>
                    <th className="table-header">Pelanggan</th>
                    <th className="table-header">Total</th>
                    <th className="table-header">Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {recentNotas.map((nota) => (
                    <tr key={nota.id} className="table-row">
                      <td className="table-cell">
                        <span className="font-mono text-blue-600 text-xs">{nota.nomorNota}</span>
                      </td>
                      <td className="table-cell text-slate-500">{formatTanggalSingkat(nota.tanggal)}</td>
                      <td className="table-cell font-medium text-slate-700">{nota.namaCustomer}</td>
                      <td className="table-cell">
                        <span className="font-semibold text-emerald-600">{formatRupiah(nota.total)}</span>
                      </td>
                      <td className="table-cell text-slate-500">{nota.namaAdmin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className="card">
          <div className="p-5 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" />
              Stok Menipis
              {stats.stokMenipis.length > 0 && (
                <span className="badge badge-yellow ml-auto bg-amber-500 text-white font-bold">{stats.stokMenipis.length}</span>
              )}
            </h2>
          </div>
          <div className="p-3 space-y-2 max-h-72 overflow-y-auto">
            {stats.stokMenipis.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-500/50" />
                <p className="text-sm">Semua stok aman!</p>
              </div>
            ) : (
              stats.stokMenipis.map((sp) => (
                <div key={sp.id}
                  className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{sp.deskripsi}</p>
                    <p className="text-xs text-slate-500 font-semibold">{sp.kode} · {sp.kategori}</p>
                  </div>
                  <span className={`text-xs font-extrabold px-2 py-1 rounded-lg
                    ${sp.stok === 0
                      ? 'bg-red-100 text-red-600'
                      : 'bg-amber-100 text-amber-600'
                    }`}>
                    {sp.stok} unit
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Today's Summary */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/50">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Ringkasan Hari Ini</p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Omset Penjualan</span>
                <span className="font-semibold text-slate-700">{stats.transaksiHariIni} Transaksi</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Item Terjual</span>
                <span className="font-semibold text-slate-700">{stats.itemTerjualHariIni} pcs</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Total Pendapatan</span>
                <span className="font-bold text-emerald-600">{formatRupiah(stats.pemasukanHariIni)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
