import React, { useState, useMemo } from 'react';
import {
  Package, Search, Save, Edit2, Trash2, Plus, Minus,
  X, CheckCircle2, AlertCircle, Calculator, FileSpreadsheet
} from 'lucide-react';
import { addPart, updatePart, deletePart, KATEGORI_OPTIONS } from '../utils/storage';
import { formatRupiah, formatTanggalSingkat, getTodayStr } from '../utils/helpers';
import KalkulatorMarkup from '../components/KalkulatorMarkup';

const getEmptyForm = () => ({
  kode: '',
  kategori: 'Sparepart',
  deskripsi: '',
  harga: '',
  stok: '',
  keterangan: '',
  tanggalMasuk: getTodayStr(),
});

export default function DatabasePart({ parts, onRefresh }) {
  // States
  const [form, setForm] = useState(getEmptyForm());
  const [editId, setEditId] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);
  
  // Search States
  const [searchValue, setSearchValue] = useState('');
  const [searchKategori, setSearchKategori] = useState('');
  
  // Utilities
  const [stokAdd, setStokAdd] = useState(0);
  const [showAset, setShowAset] = useState(false);
  const [toast, setToast] = useState(null);
  const [isKalkulatorOpen, setIsKalkulatorOpen] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ----- Filtering & Sorting Logic -----
  const filteredParts = useMemo(() => {
    return parts
      .filter(p => {
        // 1. Kategori Filter
        if (searchKategori && searchKategori !== 'Semua' && p.kategori !== searchKategori) {
          return false;
        }
        // 2. Value Filter
        if (!searchValue.trim()) return true;
        
        const val = searchValue.toLowerCase();
        return (
          p.kode.toLowerCase().includes(val) ||
          p.deskripsi.toLowerCase().includes(val) ||
          (p.keterangan || '').toLowerCase().includes(val)
        );
      })
      .sort((a, b) => {
        // Sort by category first (sejajar per jenis yang sama)
        const katA = a.kategori || '';
        const katB = b.kategori || '';
        if (katA !== katB) {
          return katA.localeCompare(katB);
        }
        // If categories are same, sort by description
        return (a.deskripsi || '').localeCompare(b.deskripsi || '');
      });
  }, [parts, searchValue, searchKategori]);

  // ----- Form Actions -----
  const handleSavePart = async () => {
    if (!form.kode || !form.deskripsi || !form.harga) {
      showToast('Kode, Deskripsi, dan Harga wajib diisi!', 'error');
      return;
    }
    
    const data = {
      kode: form.kode,
      kategori: form.kategori,
      deskripsi: form.deskripsi,
      harga: Number(form.harga),
      stok: Number(form.stok) || 0,
      keterangan: form.keterangan || '',
      tanggalMasuk: form.tanggalMasuk || getTodayStr()
    };

    if (editId) {
      await updatePart(editId, data);
      showToast('Barang berhasil diperbarui!');
    } else {
      await addPart(data);
      showToast('Barang berhasil ditambahkan!');
    }
    
    setForm(getEmptyForm());
    setEditId(null);
    setSelectedPart(null);
    if (onRefresh) await onRefresh();
  };

  const handleEditClick = () => {
    if (!selectedPart) {
      showToast('Pilih barang dari tabel terlebih dahulu', 'error');
      return;
    }
    setForm({
      kode: selectedPart.kode,
      kategori: selectedPart.kategori,
      deskripsi: selectedPart.deskripsi,
      harga: selectedPart.harga,
      stok: selectedPart.stok,
      keterangan: selectedPart.keterangan,
      tanggalMasuk: selectedPart.tanggalMasuk || ''
    });
    setEditId(selectedPart.id);
  };

  const handleDeleteClick = async () => {
    if (!selectedPart) return;
    if (confirm(`Hapus barang ${selectedPart.deskripsi}?`)) {
      await deletePart(selectedPart.id);
      setSelectedPart(null);
      showToast('Barang dihapus', 'error');
      if (onRefresh) await onRefresh();
    }
  };

  // ----- Stok Actions -----
  const handleUpdateStok = async () => {
    if (!selectedPart) return;
    if (stokAdd === 0) return;
    const newStok = Math.max(0, selectedPart.stok + stokAdd);
    
    const updates = { stok: newStok };
    if (stokAdd > 0) {
      updates.tanggalMasuk = getTodayStr();
    }
    
    await updatePart(selectedPart.id, updates);
    setSelectedPart({ ...selectedPart, ...updates });
    setStokAdd(0);
    if (onRefresh) await onRefresh();
    showToast('Stok berhasil diupdate!');
  };

  // Aset calculation
  const totalAset = useMemo(() => {
    return parts.reduce((sum, p) => sum + (p.harga * p.stok), 0);
  }, [parts]);

  const handleExportCSV = () => {
    if (filteredParts.length === 0) {
      showToast('Tidak ada data untuk diekspor!', 'error');
      return;
    }

    const headers = ['Kode', 'Kategori', 'Deskripsi/Nama', 'Harga Jual', 'Stok', 'Keterangan'];
    const rows = filteredParts.map(p => [
      p.kode,
      p.kategori,
      p.deskripsi,
      p.harga,
      p.stok,
      p.keterangan || '-'
    ]);

    const csvContent = "\uFEFF" + [
      headers.join(';'),
      ...rows.map(r => r.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(';'))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ags_inventaris_barang_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Ekspor data barang sukses!');
  };

  return (
    <div className="space-y-4 fade-in-up">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-sm font-medium slide-in ${toast.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* ================= PANEL KIRI (INPUT BARANG) ================= */}
        <div className="lg:col-span-4 space-y-4">
          <div className="card p-4">
            <h2 className="font-bold text-orange-400 mb-4 flex items-center gap-2">
              <Package size={18} />
              Input Barang Baru / Edit
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Kode Barang</label>
                <input type="text" className="input-field py-1.5 text-sm" value={form.kode} onChange={e => setForm({...form, kode: e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Kategori Barang</label>
                <select className="select-field py-1.5 text-sm" value={form.kategori} onChange={e => setForm({...form, kategori: e.target.value})}>
                  {KATEGORI_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Deskripsi / Nama</label>
                <input type="text" className="input-field py-1.5 text-sm" value={form.deskripsi} onChange={e => setForm({...form, deskripsi: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs text-slate-500 block">Harga (Rp)</label>
                    <button 
                      type="button" 
                      onClick={() => setIsKalkulatorOpen(true)}
                      className="text-[10px] text-orange-500 hover:text-orange-600 flex items-center gap-0.5 font-bold transition-all active:scale-95 cursor-pointer"
                    >
                      <Calculator size={11} className="stroke-[2.5]" /> Kalkulator
                    </button>
                  </div>
                   <input 
                    type="text" 
                    className="input-field py-1.5 text-sm" 
                    value={form.harga ? form.harga.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ''} 
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setForm({...form, harga: val});
                    }} 
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Stok Awal</label>
                  <input type="number" className="input-field py-1.5 text-sm" value={form.stok} onChange={e => setForm({...form, stok: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1 block">Keterangan / Spesifikasi</label>
                <textarea
                  className="input-field py-1.5 text-sm resize-none"
                  rows={3}
                  placeholder="Kondisi barang, spesifikasi, catatan, dll..."
                  value={form.keterangan}
                  onChange={e => setForm({...form, keterangan: e.target.value})}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleSavePart} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm py-2 rounded-lg font-medium transition flex justify-center items-center gap-1">
                  <Save size={16} /> Simpan
                </button>
                <button onClick={handleEditClick} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded-lg font-medium transition flex justify-center items-center gap-1">
                  <Edit2 size={16} /> Edit Terpilih
                </button>
                {editId && (
                  <button onClick={() => {setEditId(null); setForm(getEmptyForm());}} className="px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg">
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Panel Tambah Stok */}
          <div className="card p-4">
            <h2 className="font-bold text-orange-400 mb-3 text-sm">Update Stok Cepat</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => setStokAdd(prev => prev - 1)} className="p-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg"><Minus size={16} /></button>
              <input type="number" className="input-field text-center font-bold" value={stokAdd} onChange={e => setStokAdd(parseInt(e.target.value)||0)} />
              <button onClick={() => setStokAdd(prev => prev + 1)} className="p-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg"><Plus size={16} /></button>
              <button onClick={handleUpdateStok} disabled={!selectedPart || stokAdd === 0} className="ml-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
                Update
              </button>
            </div>

            {selectedPart && (
              <p className="text-xs text-slate-500 mt-2">Barang terpilih: {selectedPart.deskripsi} (Stok: {selectedPart.stok})</p>
            )}
          </div>
          
          {/* Panel Hitung Aset */}
          <div className="card p-4 bg-gradient-to-br from-slate-50 to-white border border-slate-200">
            <h2 className="font-bold text-orange-500 mb-2 flex items-center gap-2 text-sm">
              <Calculator size={16} /> Hitung Aset Barang
            </h2>
            {showAset ? (
              <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Total Nilai Aset:</p>
                <p className="text-xl font-bold text-emerald-600">{formatRupiah(totalAset)}</p>
              </div>
            ) : (
              <button onClick={() => setShowAset(true)} className="w-full py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg mt-2 transition">
                Tampilkan Total Aset
              </button>
            )}
          </div>
        </div>

        {/* ================= PANEL KANAN & TENGAH ================= */}
        <div className="lg:col-span-8 flex flex-col space-y-4 h-full">
          
          {/* Panel Pencarian Data */}
          <div className="card p-4 border-t-4 border-t-blue-500">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                      type="text"
                      className="input-field pl-9" 
                      placeholder="Cari Kode, Deskripsi, Keterangan..." 
                      value={searchValue} 
                      onChange={e => setSearchValue(e.target.value)} 
                    />
                  </div>
                  <select className="select-field w-auto" value={searchKategori} onChange={e => setSearchKategori(e.target.value)}>
                    <option value="Semua">Semua Kategori</option>
                    {KATEGORI_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                  <button 
                    onClick={handleExportCSV}
                    className="py-1.5 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5 shadow-sm transition"
                    title="Ekspor daftar barang ke CSV"
                  >
                    <FileSpreadsheet size={13} /> Ekspor Excel
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabel Daftar Barang */}
          <div className="card overflow-hidden border border-slate-200 flex-1 flex flex-col">
            <div className="overflow-x-auto flex-1 overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase sticky top-0 z-10 shadow-sm border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Kode</th>
                    <th className="px-4 py-3 font-semibold">Kategori</th>
                    <th className="px-4 py-3 font-semibold">Deskripsi</th>
                    <th className="px-4 py-3 font-semibold">Harga Jual</th>
                    <th className="px-4 py-3 font-semibold text-center">Stok</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredParts.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-slate-500">Tidak ada data</td></tr>
                  ) : (
                    filteredParts.map(p => (
                      <tr 
                        key={p.id} 
                        onClick={() => setSelectedPart(p)}
                        className={`cursor-pointer transition-colors ${selectedPart?.id === p.id ? 'bg-orange-50' : 'hover:bg-orange-50/40'}`}
                      >
                        <td className="px-4 py-2 font-mono text-blue-600">{p.kode}</td>
                        <td className="px-4 py-2"><span className="text-xs px-2 py-1 rounded-full bg-slate-200 text-slate-700">{p.kategori}</span></td>
                        <td className="px-4 py-2 text-slate-700">{p.deskripsi}</td>
                        <td className="px-4 py-2 text-emerald-600">{formatRupiah(p.harga)}</td>
                        <td className="px-4 py-2 text-center font-bold">
                          <span className={p.stok === 0 ? 'text-red-600' : p.stok < 5 ? 'text-amber-600' : 'text-slate-700'}>
                            {p.stok}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-slate-50 p-2 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
              <span>{filteredParts.length} item ditemukan</span>
              <button 
                onClick={handleDeleteClick} 
                disabled={!selectedPart}
                className="flex items-center gap-1 text-red-500 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={14} /> Hapus Item Terpilih
              </button>
            </div>
          </div>
        </div>
      </div>
      <KalkulatorMarkup isOpen={isKalkulatorOpen} onClose={() => setIsKalkulatorOpen(false)} />
    </div>
  );
}
