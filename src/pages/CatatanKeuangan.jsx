import React, { useState, useMemo } from 'react';
import { 
  BookOpen, ArrowDownCircle, ArrowUpCircle, PlusCircle, 
  Trash2, FileSpreadsheet, X, Check, Calendar, Search, TrendingUp, DollarSign
} from 'lucide-react';
import { formatRupiah, formatTanggalSingkat, getTodayStr } from '../utils/helpers';
import { addKeuanganItem, deleteKeuanganItem } from '../utils/storage';

export default function CatatanKeuangan({ keuangan = [], services = [], onRefresh }) {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Hidden / Deleted financial transaction IDs
  const [hiddenIds, setHiddenIds] = useState(() => {
    try {
      const saved = localStorage.getItem('ags_hidden_keuangan_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Selected IDs for bulk actions
  const [selectedIds, setSelectedIds] = useState(new Set());

  const hideTransactionIds = (ids) => {
    const updated = [...new Set([...hiddenIds, ...ids])];
    setHiddenIds(updated);
    localStorage.setItem('ags_hidden_keuangan_ids', JSON.stringify(updated));
  };

  // New transaction state
  const [newTrans, setNewTrans] = useState({
    tipe: 'Pengeluaran',
    tanggal: getTodayStr(),
    jumlah: '',
    deskripsi: '',
    kode: ''
  });

  // Combine automatic service records with SQLite keuangan records
  const combinedKeuangan = useMemo(() => {
    const validServices = services
      .filter(s => ['Berhasil Dikerjakan', 'Sudah Diambil'].includes(s.statusPengerjaan) && s.biaya > 0)
      .map(s => {
        const isLunas = s.statusPembayaran === 'Lunas' || !s.statusPembayaran;
        const jumlahMasuk = isLunas ? s.biaya : (s.dibayar || 0);
        return {
          id: `keu-srv-${s.id}`,
          tanggal: s.tanggalMasuk,
          tipe: 'Pemasukan',
          kode: s.noUrut,
          deskripsi: `Dari Jasa Servis: ${s.jenis} ${s.merek} (${s.pemilik}) [${isLunas ? 'Lunas' : 'Belum Lunas'}]`,
          jumlah: jumlahMasuk,
        };
      })
      .filter(item => item.jumlah > 0);
    
    const hiddenSet = new Set(hiddenIds);
    return [...keuangan, ...validServices].filter(k => !hiddenSet.has(k.id));
  }, [keuangan, services, hiddenIds]);

  // Filters search
  const filteredData = useMemo(() => {
    return combinedKeuangan.filter(k => {
      const q = search.toLowerCase();
      const codeMatch = k.kode ? k.kode.toLowerCase().includes(q) : false;
      const descMatch = k.deskripsi ? k.deskripsi.toLowerCase().includes(q) : false;
      const typeMatch = k.tipe ? k.tipe.toLowerCase().includes(q) : false;
      return !search.trim() || codeMatch || descMatch || typeMatch;
    }).sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  }, [combinedKeuangan, search]);

  // Calculate totals
  const stats = useMemo(() => {
    const pemasukan = filteredData.filter(k => k.tipe === 'Pemasukan').reduce((sum, k) => sum + k.jumlah, 0);
    const pengeluaran = filteredData.filter(k => k.tipe === 'Pengeluaran').reduce((sum, k) => sum + k.jumlah, 0);
    const labaBersih = pemasukan - pengeluaran;
    return { pemasukan, pengeluaran, labaBersih };
  }, [filteredData]);

  // Calculate periodic revenue (pemasukan berkala: hari, minggu, bulan, tahun)
  const periodicStats = useMemo(() => {
    const today = getTodayStr(); // 'YYYY-MM-DD'
    const todayObj = new Date(today);
    
    // Calendar week starting Sunday
    const startOfWeek = new Date(todayObj);
    startOfWeek.setDate(todayObj.getDate() - todayObj.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const currentMonth = today.substring(0, 7); // 'YYYY-MM'
    const currentYear = today.substring(0, 4); // 'YYYY'
    
    let hariIni = 0;
    let mingguIni = 0;
    let bulanIni = 0;
    let tahunIni = 0;
    
    combinedKeuangan.forEach(k => {
      if (k.tipe === 'Pemasukan') {
        const dateParts = k.tanggal.split('-');
        const transDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        
        // Hari Ini
        if (k.tanggal === today) {
          hariIni += k.jumlah;
        }
        
        // Minggu Ini
        if (transDate >= startOfWeek) {
          mingguIni += k.jumlah;
        }
        
        // Bulan Ini
        if (k.tanggal.startsWith(currentMonth)) {
          bulanIni += k.jumlah;
        }
        
        // Tahun Ini
        if (k.tanggal.startsWith(currentYear)) {
          tahunIni += k.jumlah;
        }
      }
    });
    
    return { hariIni, mingguIni, bulanIni, tahunIni };
  }, [combinedKeuangan]);

  const handleOpenModal = () => {
    setNewTrans({
      tipe: 'Pengeluaran',
      tanggal: getTodayStr(),
      jumlah: '',
      deskripsi: '',
      kode: `OUT-${Math.floor(100 + Math.random() * 900)}` // Auto generate code
    });
    setShowModal(true);
  };

  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    if (!newTrans.jumlah || isNaN(newTrans.jumlah) || parseInt(newTrans.jumlah) <= 0) {
      alert('Jumlah uang harus berupa angka positif!');
      return;
    }
    setLoading(true);
    try {
      const item = {
        tipe: newTrans.tipe,
        tanggal: newTrans.tanggal,
        jumlah: parseInt(newTrans.jumlah),
        deskripsi: newTrans.deskripsi || 'Pengeluaran Manual',
        kode: newTrans.kode || 'MANUAL'
      };
      await addKeuanganItem(item);
      setShowModal(false);
      if (onRefresh) await onRefresh();
    } catch (err) {
      alert('Gagal mencatat transaksi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = (filteredItems) => {
    setSelectedIds(prev => {
      const allSelected = filteredItems.length > 0 && filteredItems.every(item => prev.has(item.id));
      if (allSelected) {
        const next = new Set(prev);
        filteredItems.forEach(item => next.delete(item.id));
        return next;
      } else {
        const next = new Set(prev);
        filteredItems.forEach(item => next.add(item.id));
        return next;
      }
    });
  };

  const handleDeleteSingle = async (id, isManual, desc) => {
    if (confirm(`Hapus catatan keuangan "${desc}"?`)) {
      if (isManual) {
        try {
          await deleteKeuanganItem(id);
        } catch (err) {
          console.error("Gagal menghapus entri manual dari database:", err);
        }
      }
      hideTransactionIds([id]);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      if (onRefresh) await onRefresh();
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Hapus ${selectedIds.size} catatan keuangan terpilih?`)) {
      try {
        const idsArray = Array.from(selectedIds);
        for (const id of idsArray) {
          const isManual = id.toString().startsWith('keu-man-');
          if (isManual) {
            await deleteKeuanganItem(id);
          }
        }
        hideTransactionIds(idsArray);
        setSelectedIds(new Set());
        if (onRefresh) await onRefresh();
      } catch (err) {
        alert('Gagal menghapus beberapa item: ' + err.message);
      }
    }
  };

  // ----- FEATURE 4: EXPORT TO CSV (EXCEL) -----
  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert('Tidak ada data untuk diekspor!');
      return;
    }

    const headers = ['Tanggal', 'Tipe', 'Kode Nota', 'Deskripsi Transaksi', 'Jumlah (Nominal)'];
    const rows = filteredData.map(k => [
      k.tanggal,
      k.tipe,
      k.kode || '-',
      k.deskripsi,
      k.jumlah
    ]);

    // Use semicolon for direct double-click loading in European/Indonesian Excel
    const csvContent = "\uFEFF" + [
      headers.join(';'),
      ...rows.map(r => r.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(';'))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `laporan_keuangan_ags_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fade-in-up space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="text-orange-500" /> 
            Catatan Keuangan & Kas Buku
          </h1>
          <p className="text-sm text-slate-500 mt-1">Riwayat otomatis dari penjualan serta pencatatan pengeluaran manual.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition"
          >
            <FileSpreadsheet size={16} /> Ekspor Excel
          </button>
          
          <button 
            onClick={handleOpenModal}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-black rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition"
          >
            <PlusCircle size={16} /> Catat Pengeluaran
          </button>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 bg-gradient-to-br from-emerald-50 to-white border-l-4 border-l-emerald-500 border border-emerald-100 shadow-sm">
          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1 font-semibold uppercase tracking-wider">
            <ArrowDownCircle size={14} className="text-emerald-500" /> Total Pemasukan
          </p>
          <p className="text-2xl font-black text-emerald-600 font-sans">{formatRupiah(stats.pemasukan)}</p>
          <p className="text-[10px] text-slate-400 mt-1">Penjualan part & biaya servis</p>
        </div>
        
        <div className="card p-5 bg-gradient-to-br from-red-50 to-white border-l-4 border-l-red-500 border border-red-100 shadow-sm">
          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1 font-semibold uppercase tracking-wider">
            <ArrowUpCircle size={14} className="text-red-500" /> Total Pengeluaran
          </p>
          <p className="text-2xl font-black text-red-600 font-sans">{formatRupiah(stats.pengeluaran)}</p>
          <p className="text-[10px] text-slate-400 mt-1">Biaya operasional & belanja stok</p>
        </div>

        <div className={`card p-5 border-l-4 border border-slate-100 shadow-sm bg-gradient-to-br 
          ${stats.labaBersih >= 0 ? 'from-blue-50 border-l-blue-500' : 'from-red-50 border-l-red-600'}`}>
          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1 font-semibold uppercase tracking-wider">
            <TrendingUp size={14} className={stats.labaBersih >= 0 ? 'text-blue-500' : 'text-red-600'} /> Laba Rugi Bersih (Net)
          </p>
          <p className={`text-2xl font-black font-sans ${stats.labaBersih >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {formatRupiah(stats.labaBersih)}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            {stats.labaBersih >= 0 ? 'Status keuangan: Surplus' : 'Status keuangan: Defisit/Rugi'}
          </p>
        </div>
      </div>

      {/* Periodic Inflow Summary */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Calendar size={13} className="text-orange-500" /> Ringkasan Pemasukan Berkala (Hari, Minggu, Bulan, Tahun)
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4 bg-white border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-orange-200 transition-all duration-300">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Hari Ini</p>
            <p className="text-lg font-bold text-slate-800">{formatRupiah(periodicStats.hariIni)}</p>
            <div className="absolute top-0 right-0 w-8 h-8 bg-orange-500/5 rounded-bl-full flex items-center justify-center">
              <span className="text-[9px] font-bold text-orange-500 uppercase px-1.5 py-1">H</span>
            </div>
          </div>

          <div className="card p-4 bg-white border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-orange-200 transition-all duration-300">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Minggu Ini</p>
            <p className="text-lg font-bold text-slate-800">{formatRupiah(periodicStats.mingguIni)}</p>
            <div className="absolute top-0 right-0 w-8 h-8 bg-blue-500/5 rounded-bl-full flex items-center justify-center">
              <span className="text-[9px] font-bold text-blue-500 uppercase px-1.5 py-1">M</span>
            </div>
          </div>

          <div className="card p-4 bg-white border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-orange-200 transition-all duration-300">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Bulan Ini</p>
            <p className="text-lg font-bold text-slate-800">{formatRupiah(periodicStats.bulanIni)}</p>
            <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500/5 rounded-bl-full flex items-center justify-center">
              <span className="text-[9px] font-bold text-emerald-500 uppercase px-1.5 py-1">B</span>
            </div>
          </div>

          <div className="card p-4 bg-white border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-orange-200 transition-all duration-300">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Tahun Ini</p>
            <p className="text-lg font-bold text-slate-800">{formatRupiah(periodicStats.tahunIni)}</p>
            <div className="absolute top-0 right-0 w-8 h-8 bg-purple-500/5 rounded-bl-full flex items-center justify-center">
              <span className="text-[9px] font-bold text-purple-500 uppercase px-1.5 py-1">T</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card p-5 space-y-4">
        {/* Search & Actions Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-sm flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={16} />
            </span>
            <input 
              type="text" 
              placeholder="Cari deskripsi, tipe, kode..." 
              className="input-field pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/20 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Trash2 size={13} /> Hapus Terpilih ({selectedIds.size})
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-center w-12">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-orange-500 focus:ring-orange-500 h-4 w-4 cursor-pointer"
                    checked={filteredData.length > 0 && filteredData.every(item => selectedIds.has(item.id))}
                    onChange={() => handleToggleSelectAll(filteredData)}
                  />
                </th>
                <th className="px-4 py-3 font-semibold">Tanggal</th>
                <th className="px-4 py-3 font-semibold">Tipe</th>
                <th className="px-4 py-3 font-semibold">Kode Nota</th>
                <th className="px-4 py-3 font-semibold">Deskripsi Transaksi</th>
                <th className="px-4 py-3 font-semibold text-right">Jumlah</th>
                <th className="px-4 py-3 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    Belum ada riwayat transaksi keuangan pada filter ini.
                  </td>
                </tr>
              ) : (
                filteredData.map(k => {
                  const isManual = k.id.toString().startsWith('keu-man-');
                  return (
                    <tr 
                      key={k.id} 
                      onClick={() => handleToggleSelect(k.id)}
                      className={`hover:bg-slate-50/50 transition cursor-pointer ${selectedIds.has(k.id) ? 'bg-orange-50/35' : ''}`}
                    >
                      <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 text-orange-500 focus:ring-orange-500 h-4 w-4 cursor-pointer"
                          checked={selectedIds.has(k.id)}
                          onChange={() => handleToggleSelect(k.id)}
                        />
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatTanggalSingkat(k.tanggal)}</td>
                      <td className="px-4 py-3">
                        {k.tipe === 'Pemasukan' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[11px] font-bold">
                            <ArrowDownCircle size={11} /> Pemasukan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-700 bg-red-100 px-2 py-0.5 rounded text-[11px] font-bold">
                            <ArrowUpCircle size={11} /> Pengeluaran
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-blue-600 text-xs font-semibold">{k.kode || '-'}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{k.deskripsi}</td>
                      <td className={`px-4 py-3 text-right font-bold whitespace-nowrap
                        ${k.tipe === 'Pemasukan' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {k.tipe === 'Pemasukan' ? '+' : '-'} {formatRupiah(k.jumlah)}
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-center items-center gap-2">
                          {!isManual && (
                            <span className="text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                              Sistem
                            </span>
                          )}
                          <button 
                            onClick={() => handleDeleteSingle(k.id, isManual, k.deskripsi)} 
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                            title="Hapus catatan"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DRAWER / MODAL INPUT PENGELUARAN */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 animate-scale-up">
            
            {/* Header */}
            <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center">
              <h2 className="font-extrabold text-sm flex items-center gap-2">
                <PlusCircle size={18} className="text-orange-500" />
                Catat Transaksi Pengeluaran
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition">
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveTransaction} className="p-5 space-y-4">
              
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Tipe Transaksi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button" 
                    onClick={() => setNewTrans(prev => ({ ...prev, tipe: 'Pengeluaran' }))}
                    className={`py-2 text-xs font-bold border rounded-lg transition-all flex items-center justify-center gap-1
                      ${newTrans.tipe === 'Pengeluaran' ? 'bg-red-50 border-red-500 text-red-600 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    <ArrowUpCircle size={14} /> Pengeluaran
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setNewTrans(prev => ({ ...prev, tipe: 'Pemasukan' }))}
                    className={`py-2 text-xs font-bold border rounded-lg transition-all flex items-center justify-center gap-1
                      ${newTrans.tipe === 'Pemasukan' ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    <ArrowDownCircle size={14} /> Pemasukan Manual
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Tanggal</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={newTrans.tanggal} 
                    onChange={e => setNewTrans(prev => ({ ...prev, tanggal: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Kode Transaksi</label>
                  <input 
                    type="text" 
                    className="input-field font-mono uppercase" 
                    value={newTrans.kode} 
                    onChange={e => setNewTrans(prev => ({ ...prev, kode: e.target.value }))}
                    placeholder="Contoh: OUT-091"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Jumlah Uang (Rupiah)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-xs">Rp</span>
                  <input 
                    type="number" 
                    placeholder="Nominal uang, misal: 150000" 
                    className="input-field pl-9 font-semibold"
                    value={newTrans.jumlah} 
                    onChange={e => setNewTrans(prev => ({ ...prev, jumlah: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Deskripsi Transaksi</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Belanja kopi toko, Bayar listrik ruko" 
                  className="input-field"
                  value={newTrans.deskripsi} 
                  onChange={e => setNewTrans(prev => ({ ...prev, deskripsi: e.target.value }))}
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary py-2 px-5 font-bold flex items-center justify-center gap-2 w-full mt-4 bg-orange-500 hover:bg-orange-600 text-black"
              >
                <Check size={16} /> {loading ? 'Memproses...' : 'Simpan Transaksi'}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
