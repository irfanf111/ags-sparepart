import React, { useState, useMemo, useEffect } from 'react';
import { 
  BookOpen, Search, DollarSign, Users, ChevronRight, 
  PlusCircle, Calendar, FileText, CheckCircle2, X, Printer, RefreshCw
} from 'lucide-react';
import { getServices, updateService, addKeuanganItem, getSettings } from '../utils/storage';
import { formatRupiah, formatTanggalSingkat, getTodayStr } from '../utils/helpers';

export default function BukuHutang({ onRefresh }) {
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [showInstallmentModal, setShowInstallmentModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  
  // Installment Form State
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [installmentNote, setInstallmentNote] = useState('');
  const [installmentDate, setInstallmentDate] = useState(getTodayStr());
  
  // Printed payment state
  const [selectedPaymentIndex, setSelectedPaymentIndex] = useState(-1);
  const [profile, setProfile] = useState({
    nama_singkat: 'AGS NOTEBOOK',
    nama_bengkel: 'PT AGS WIJAYA DHANESWARA',
    alamat_bengkel: 'Desa Kunirejo Kulon, RT.002/RW.001, Kecamatan Butuh, Kabupaten Purworejo, Jawa Tengah',
    no_hp_bengkel: '083863333322'
  });

  const fetchLocal = async () => {
    const data = await getServices();
    setServices(data || []);
  };

  useEffect(() => {
    fetchLocal();
    const loadProfile = async () => {
      const settingsData = await getSettings();
      if (settingsData) {
        setProfile({
          nama_singkat: settingsData.nama_singkat || 'AGS NOTEBOOK',
          nama_bengkel: settingsData.nama_bengkel || 'PT AGS WIJAYA DHANESWARA',
          alamat_bengkel: settingsData.alamat_bengkel || 'Desa Kunirejo Kulon, RT.002/RW.001, Kecamatan Butuh, Kabupaten Purworejo, Jawa Tengah',
          no_hp_bengkel: settingsData.no_hp_bengkel || '083863333322'
        });
      }
    };
    loadProfile();
  }, []);

  // Filter service items where:
  // 1. biaya > 0
  // 2. statusPembayaran is 'Belum Lunas' or 'Belum Lunas / Cicilan' or dibayar < biaya
  const activeDebts = useMemo(() => {
    return services.filter(s => {
      const isUnpaidStatus = s.statusPembayaran === 'Belum Lunas' || s.statusPembayaran === 'Belum Lunas / Cicilan';
      const isPartiallyPaid = s.biaya > 0 && (s.dibayar || 0) < s.biaya;
      return s.biaya > 0 && (isUnpaidStatus || isPartiallyPaid);
    });
  }, [services]);

  // Stats
  const stats = useMemo(() => {
    const totalPiutang = activeDebts.reduce((sum, s) => sum + ((s.biaya || 0) - (s.dibayar || 0)), 0);
    const totalCicilan = services.reduce((sum, s) => {
      if (s.biaya > 0) {
        // If lunas, we don't necessarily count its DP as 'cicilan' unless it was in unpaid state first.
        // We sum up the dibayar amount for active debts as the accumulated installments.
        const isUnpaid = s.statusPembayaran === 'Belum Lunas' || s.statusPembayaran === 'Belum Lunas / Cicilan' || (s.dibayar || 0) < s.biaya;
        if (isUnpaid) return sum + (s.dibayar || 0);
      }
      return sum;
    }, 0);
    const totalDebitur = activeDebts.length;
    return { totalPiutang, totalCicilan, totalDebitur };
  }, [activeDebts, services]);

  // Filter by search query
  const filteredDebts = useMemo(() => {
    return activeDebts.filter(s => {
      const q = search.toLowerCase();
      return (
        s.noUrut.toLowerCase().includes(q) ||
        s.pemilik.toLowerCase().includes(q) ||
        (s.jenis && s.jenis.toLowerCase().includes(q)) ||
        (s.merek && s.merek.toLowerCase().includes(q))
      );
    });
  }, [activeDebts, search]);

  const handleOpenInstallment = (service) => {
    setSelectedService(service);
    setInstallmentAmount('');
    setInstallmentNote('');
    setInstallmentDate(getTodayStr());
    setShowInstallmentModal(true);
  };

  const handleSaveInstallment = async () => {
    if (!selectedService || !installmentAmount || Number(installmentAmount) <= 0) return;
    
    const amount = Number(installmentAmount);
    const currentPaid = selectedService.dibayar || 0;
    const newPaid = currentPaid + amount;
    const totalCost = selectedService.biaya || 0;

    if (newPaid > totalCost) {
      alert(`Jumlah pembayaran melebihi sisa hutang! Maksimal yang dapat dibayar adalah ${formatRupiah(totalCost - currentPaid)}.`);
      return;
    }

    // Parse existing installment history
    let history = [];
    try {
      if (selectedService.riwayatCicilan) {
        history = typeof selectedService.riwayatCicilan === 'string' 
          ? JSON.parse(selectedService.riwayatCicilan) 
          : selectedService.riwayatCicilan;
      }
    } catch (e) {
      history = [];
    }

    const newPayment = {
      tanggal: installmentDate,
      jumlah: amount,
      keterangan: installmentNote.trim() || 'Cicilan Pembayaran'
    };

    const updatedHistory = [...history, newPayment];
    const isPaidOff = newPaid === totalCost;

    const updates = {
      dibayar: newPaid,
      statusPembayaran: isPaidOff ? 'Lunas' : 'Belum Lunas / Cicilan',
      riwayatCicilan: JSON.stringify(updatedHistory)
    };

    try {
      // 1. Update service record
      await updateService(selectedService.id, updates);

      // 2. Automatically log to Catatan Keuangan
      await addKeuanganItem({
        tanggal: installmentDate,
        tipe: 'Pemasukan',
        kode: selectedService.noUrut,
        deskripsi: `Cicilan Servis: ${selectedService.pemilik} (${newPayment.keterangan})`,
        jumlah: amount
      });

      // 3. Reset states & refresh
      setShowInstallmentModal(false);
      await fetchLocal();
      if (onRefresh) await onRefresh();
      
      // Keep selected service reference updated
      const freshServices = await getServices();
      const freshCurrent = freshServices.find(s => s.id === selectedService.id);
      setSelectedService(freshCurrent || null);
    } catch (e) {
      console.error(e);
      alert("Gagal menyimpan pembayaran cicilan.");
    }
  };

  const handleOpenPrint = (service, paymentIndex) => {
    setSelectedService(service);
    setSelectedPaymentIndex(paymentIndex);
    setShowPrintModal(true);
  };

  const handlePrintAction = () => {
    setTimeout(() => { window.print(); }, 200);
  };

  return (
    <div className="fade-in-up space-y-6">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="page-title text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <BookOpen className="text-red-500" size={28} />
            Buku Hutang / Cicilan Servisan
          </h1>
          <p className="page-subtitle text-sm text-slate-500">Pantau piutang pelanggan, kelola pembayaran cicilan, dan cek riwayat stempel pelunasan.</p>
        </div>
        <button onClick={fetchLocal} className="btn-secondary flex items-center gap-2 text-xs py-2 bg-white shadow-sm border border-slate-200" title="Refresh Data">
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card border border-red-200/60 bg-gradient-to-br from-red-50 to-white">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-600">
              <DollarSign size={20} className="stroke-[2.5]" />
            </div>
            <span className="text-[10px] uppercase font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">Piutang Aktif</span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-red-600 leading-tight">{formatRupiah(stats.totalPiutang)}</p>
            <p className="text-xs font-semibold text-slate-600 mt-1">Total sisa hutang pelanggan</p>
          </div>
        </div>

        <div className="stat-card border border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-white">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
              <DollarSign size={20} className="stroke-[2.5]" />
            </div>
            <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">DP &amp; Cicilan Masuk</span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-emerald-600 leading-tight">{formatRupiah(stats.totalCicilan)}</p>
            <p className="text-xs font-semibold text-slate-600 mt-1">Dana terbayar dari hutang aktif</p>
          </div>
        </div>

        <div className="stat-card border border-blue-200/60 bg-gradient-to-br from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
              <Users size={20} className="stroke-[2.5]" />
            </div>
            <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Debitur</span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-blue-600 leading-tight">{stats.totalDebitur} Pelanggan</p>
            <p className="text-xs font-semibold text-slate-600 mt-1">Memiliki tagihan belum lunas</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Main Debt List */}
        <div className="xl:col-span-2 flex flex-col card overflow-hidden border border-slate-200 shadow-xl bg-white">
          {/* Filters */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
            <div className="relative flex-1 min-w-[240px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                placeholder="Cari Nota, Pelanggan, atau Perangkat..." 
                className="input-field pl-9 w-full bg-white border-slate-300 focus:border-red-500 text-slate-800 text-sm"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-200 px-3 py-1 rounded-lg">
              {filteredDebts.length} Servisan Unpaid
            </span>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto max-h-[500px]">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0 z-10 shadow-sm text-xs uppercase font-bold">
                <tr>
                  <th className="px-4 py-3">No. Service</th>
                  <th className="px-4 py-3">Pelanggan</th>
                  <th className="px-4 py-3">Perangkat</th>
                  <th className="px-4 py-3 text-right">Total Biaya</th>
                  <th className="px-4 py-3 text-right">Telah Dibayar</th>
                  <th className="px-4 py-3 text-right text-red-600">Sisa Hutang</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDebts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-500">
                      <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-3 opacity-30" />
                      <p className="font-semibold text-slate-700">Luar biasa, semua tagihan lunas!</p>
                      <p className="text-xs text-slate-400 mt-1">Tidak ada piutang servisan yang belum diselesaikan.</p>
                    </td>
                  </tr>
                ) : (
                  filteredDebts.map(s => {
                    const debtAmount = (s.biaya || 0) - (s.dibayar || 0);
                    const isSelected = selectedService?.id === s.id;
                    return (
                      <tr 
                        key={s.id} 
                        onClick={() => setSelectedService(s)}
                        className={`cursor-pointer transition-colors hover:bg-slate-50/50 ${isSelected ? 'bg-red-50/40 border-l-4 border-l-red-500' : ''}`}
                      >
                        <td className="px-4 py-3.5 font-mono text-blue-600 text-xs font-bold">{s.noUrut}</td>
                        <td className="px-4 py-3.5 font-semibold text-slate-800">{s.pemilik}</td>
                        <td className="px-4 py-3.5 text-xs text-slate-600">
                          <div>{s.jenis}</div>
                          <div className="text-[10px] text-slate-500 font-semibold">{s.merek}</div>
                        </td>
                        <td className="px-4 py-3.5 text-right font-medium text-slate-700">{formatRupiah(s.biaya || 0)}</td>
                        <td className="px-4 py-3.5 text-right font-semibold text-emerald-600">{formatRupiah(s.dibayar || 0)}</td>
                        <td className="px-4 py-3.5 text-right font-black text-red-600">{formatRupiah(debtAmount)}</td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border
                            ${s.statusPengerjaan === 'Sudah Diambil' 
                              ? 'bg-slate-100 border-slate-200 text-slate-600'
                              : s.statusPengerjaan === 'Berhasil Dikerjakan'
                                ? 'bg-emerald-100 border-emerald-200 text-emerald-700'
                                : 'bg-amber-100 border-amber-200 text-amber-700'
                            }`}>
                            {s.statusPengerjaan}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
            <span>Klik baris pelanggan untuk mengelola cicilan & riwayat pembayaran di panel sebelah kanan.</span>
          </div>
        </div>

        {/* Right: Payment Management Panel */}
        <div className="card border border-slate-200 shadow-xl bg-white flex flex-col overflow-hidden">
          {!selectedService ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3 text-slate-400">
                <BookOpen size={28} className="opacity-20" />
              </div>
              <p className="font-semibold text-slate-400 text-sm">Pilih Debitur</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">Klik salah satu nama pelanggan pada daftar piutang untuk mengelola cicilan pembayaran.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Header Panel */}
              <div className="bg-slate-50 p-4 border-b border-slate-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="font-bold text-base text-slate-800">{selectedService.noUrut}</h2>
                    <p className="text-xs font-semibold text-slate-500">{selectedService.pemilik}</p>
                  </div>
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-0.5">
                    Hutang Aktif
                  </span>
                </div>
                
                <div className="mt-3 pt-3 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Perangkat:</span>
                    <p className="font-bold text-slate-700 leading-tight">{selectedService.jenis}</p>
                    <p className="text-[10px] text-slate-500 font-semibold">{selectedService.merek || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Sisa Tagihan:</span>
                    <p className="font-black text-red-600 text-sm leading-tight">
                      {formatRupiah((selectedService.biaya || 0) - (selectedService.dibayar || 0))}
                    </p>
                  </div>
                </div>
              </div>

              {/* Installment History Area */}
              <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 space-y-3">
                <h3 className="text-xs uppercase font-bold text-slate-600 tracking-wider mb-2">Riwayat Cicilan Pembayaran</h3>
                
                {(() => {
                  let list = [];
                  try {
                    if (selectedService.riwayatCicilan) {
                      list = typeof selectedService.riwayatCicilan === 'string'
                        ? JSON.parse(selectedService.riwayatCicilan)
                        : selectedService.riwayatCicilan;
                    }
                  } catch (e) {
                    list = [];
                  }

                  if (list.length === 0) {
                    return (
                      <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-lg border border-slate-200/60">
                        <FileText size={24} className="mx-auto opacity-20 mb-1.5" />
                        <p className="text-xs font-medium">Belum ada cicilan masuk</p>
                        <p className="text-[10px] text-slate-400">Pembayaran DP atau cicilan pertama belum tercatat.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      {list.map((item, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs transition-colors">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-semibold text-slate-600 flex items-center gap-1">
                              <Calendar size={10} />
                              {formatTanggalSingkat(item.tanggal)}
                            </span>
                            <p className="font-bold text-slate-700">{formatRupiah(item.jumlah)}</p>
                            <p className="text-[10px] text-slate-500">{item.keterangan}</p>
                          </div>
                          <button 
                            onClick={() => handleOpenPrint(selectedService, idx)}
                            className="p-1.5 bg-white hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg border border-slate-200 transition-colors shadow-sm cursor-pointer"
                            title="Cetak Bukti Pembayaran"
                          >
                            <Printer size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Quick Actions Panel */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
                {((selectedService.biaya || 0) - (selectedService.dibayar || 0)) > 0 ? (
                  <button 
                    onClick={() => handleOpenInstallment(selectedService)}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-red-500/20 text-xs active:scale-[0.98] cursor-pointer"
                  >
                    <PlusCircle size={15} /> Catat Pembayaran Cicilan
                  </button>
                ) : (
                  <div className="text-center py-2 bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5">
                    <CheckCircle2 size={14} /> Tagihan Telah Lunas
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Catat Cicilan Baru */}
      {showInstallmentModal && selectedService && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="bg-red-500 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                  <PlusCircle size={16} /> Catat Cicilan Baru
                </h3>
                <p className="text-[10px] text-red-100 mt-0.5">{selectedService.noUrut} · {selectedService.pemilik}</p>
              </div>
              <button onClick={() => setShowInstallmentModal(false)} className="text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors cursor-pointer">
                <X size={16} />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">Tanggal Pembayaran</label>
                <input 
                  type="date" 
                  className="input-field w-full py-2 bg-white border-slate-300 focus:border-red-500 text-xs" 
                  value={installmentDate}
                  onChange={e => setInstallmentDate(e.target.value)}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Jumlah Pembayaran (Rp)</label>
                  <span className="text-[10px] font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                    Sisa Hutang: {formatRupiah((selectedService.biaya || 0) - (selectedService.dibayar || 0))}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">Rp</span>
                  <input 
                    type="text" 
                    placeholder="Masukkan jumlah cicilan..."
                    className="input-field w-full pl-9 py-2 text-sm font-bold bg-white border-slate-300 focus:border-red-500 text-slate-700" 
                    value={installmentAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setInstallmentAmount(Number(val));
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">Keterangan / Catatan</label>
                <input 
                  type="text" 
                  placeholder="Contoh: DP, Cicilan ke-2, Pelunasan..."
                  className="input-field w-full py-2 text-xs bg-white border-slate-300 focus:border-red-500 text-slate-700" 
                  value={installmentNote}
                  onChange={e => setInstallmentNote(e.target.value)}
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-2 gap-2">
              <button 
                onClick={() => setShowInstallmentModal(false)}
                className="btn-secondary py-2 text-xs bg-white text-slate-600 border border-slate-300 font-bold hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveInstallment}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-xl text-xs flex justify-center items-center gap-1.5 transition-all shadow-md shadow-red-500/20 cursor-pointer"
              >
                <CheckCircle2 size={14} /> Simpan Pembayaran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cetak Bukti Cicilan */}
      {showPrintModal && selectedService && selectedPaymentIndex >= 0 && (
        <div className="fixed inset-0 bg-slate-50/98 z-50 overflow-y-auto flex flex-col print-container font-sans text-black">
          {/* Control Panel */}
          <div className="no-print bg-white p-4 flex justify-between items-center sticky top-0 z-10 shadow-sm border-b border-slate-200">
            <h2 className="text-slate-800 font-bold">Bukti Pembayaran: {selectedService.noUrut}</h2>
            <div className="flex gap-2">
              <button onClick={handlePrintAction} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold flex items-center gap-2 text-xs cursor-pointer shadow-md">
                <Printer size={14}/> Cetak Bukti Pembayaran
              </button>
              <button onClick={() => setShowPrintModal(false)} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded font-bold flex items-center gap-2 text-xs cursor-pointer shadow-md">
                <X size={14}/> Tutup
              </button>
            </div>
          </div>

          {/* Area Cetak Bukti Cicilan (Designed like standard thermal compact size) */}
          <div className="flex-1 pt-0 px-4 pb-4 flex justify-center items-start bg-slate-100">
            <div 
              className="bg-white p-4 shadow-2xl print-area w-[58mm] text-[10px] font-sans pb-6 border border-slate-200 mt-2" 
              style={{ lineHeight: '1.4', fontFamily: 'Arial, sans-serif' }}
            >
              {/* Header */}
              <div className="text-center mb-2">
                <p className="font-black text-sm uppercase text-red-600 leading-tight">{profile.nama_singkat}</p>
                <p className="text-[8px] font-bold text-gray-500 uppercase border-b border-dashed border-gray-300 pb-0.5 mb-1 inline-block">{profile.nama_bengkel}</p>
                <p className="text-[8px] mt-0.5">{profile.alamat_bengkel}</p>
                <p className="text-[8px]">HP. {profile.no_hp_bengkel}</p>
              </div>

              <div className="border-b border-black my-1.5"></div>
              <div className="text-center font-bold uppercase text-[9px] tracking-wider">Kuitansi Cicilan Servis</div>
              <div className="border-b border-black my-1.5"></div>

              {/* Invoice Details */}
              <div className="space-y-0.5">
                <div className="flex justify-between">
                  <span>No. Service:</span>
                  <span className="font-bold font-mono">{selectedService.noUrut}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span className="font-bold">{selectedService.pemilik}</span>
                </div>
                <div className="flex justify-between">
                  <span>Perangkat:</span>
                  <span>{selectedService.jenis}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span>{formatTanggalSingkat(
                    JSON.parse(selectedService.riwayatCicilan)[selectedPaymentIndex]?.tanggal || getTodayStr()
                  )}</span>
                </div>
              </div>

              <div className="border-b border-black my-1.5"></div>

              {/* Installment Info */}
              <div className="bg-slate-50 p-2.5 rounded border border-dashed border-slate-300 space-y-1 my-2">
                <div className="flex justify-between font-bold text-[11px] text-slate-800">
                  <span>Jumlah Bayar:</span>
                  <span>{formatRupiah(JSON.parse(selectedService.riwayatCicilan)[selectedPaymentIndex]?.jumlah || 0)}</span>
                </div>
                <div className="flex justify-between text-[8px] text-slate-500">
                  <span>Keterangan:</span>
                  <span className="text-right italic">{JSON.parse(selectedService.riwayatCicilan)[selectedPaymentIndex]?.keterangan || '-'}</span>
                </div>
              </div>

              <div className="border-b border-black my-1.5"></div>

              {/* Running Balance */}
              <div className="space-y-0.5 text-right font-medium">
                <div className="flex justify-between">
                  <span>Total Biaya Servis:</span>
                  <span>{formatRupiah(selectedService.biaya || 0)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Total Telah Dibayar:</span>
                  <span>{formatRupiah(
                    JSON.parse(selectedService.riwayatCicilan)
                      .slice(0, selectedPaymentIndex + 1)
                      .reduce((sum, item) => sum + item.jumlah, 0)
                  )}</span>
                </div>
                {((selectedService.biaya || 0) - JSON.parse(selectedService.riwayatCicilan).slice(0, selectedPaymentIndex + 1).reduce((sum, item) => sum + item.jumlah, 0)) > 0 ? (
                  <div className="flex justify-between text-red-600 font-bold border-t border-dashed border-gray-300 pt-0.5 mt-0.5">
                    <span>Sisa Piutang:</span>
                    <span>{formatRupiah(
                      (selectedService.biaya || 0) - 
                      JSON.parse(selectedService.riwayatCicilan)
                        .slice(0, selectedPaymentIndex + 1)
                        .reduce((sum, item) => sum + item.jumlah, 0)
                    )}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-emerald-700 font-black border-t border-dashed border-gray-300 pt-0.5 mt-0.5">
                    <span>Status:</span>
                    <span>LUNAS</span>
                  </div>
                )}
              </div>

              <div className="border-b border-black my-1.5"></div>

              {/* Signatures */}
              <div className="mt-4 flex justify-between text-[8px]">
                <div className="text-center w-[45%]">
                  <p>Penerima,</p>
                  <div className="h-6"></div>
                  <p className="font-bold underline text-[8px]">AGUS SUNARTO</p>
                </div>
                <div className="text-center w-[45%]">
                  <p>Penyetor,</p>
                  <div className="h-6"></div>
                  <p className="font-bold">......................</p>
                </div>
              </div>

              <div className="text-center text-[7px] text-gray-500 mt-6 leading-tight uppercase font-mono tracking-wider border-t border-gray-100 pt-2">
                🔒 AGS VERIFIED RECEIPT
              </div>
            </div>
          </div>

          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              html, body, #root { margin: 0 !important; padding: 0 !important; height: auto !important; }
              body { zoom: 100% !important; }
              body * { visibility: hidden; }
              .print-container { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
              .print-area, .print-area * { visibility: visible; }
              .print-area { position: absolute !important; left: 0 !important; top: 0 !important; margin: 0 !important; box-shadow: none !important; border: none !important; width: 58mm !important; max-width: 58mm !important; }
              .no-print { display: none !important; }
              @page { size: 58mm auto; margin: 0 !important; }
            }
          `}} />
        </div>
      )}
    </div>
  );
}
