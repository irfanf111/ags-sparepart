import React, { useState, useMemo, useEffect } from 'react';
import { ShoppingCart, Search, Printer, X, User, AlertCircle, CheckCircle2, Info, Tag, Package } from 'lucide-react';
import { formatRupiah, generateNomorNota, formatTanggalSingkat, generateNomorNotaPenjualan } from '../utils/helpers';
import { KATEGORI_OPTIONS, getCustomers, getServices, addPartsToService } from '../utils/storage';
import NotaKontan from '../components/NotaKontan';
import NotaServicePrint from '../components/NotaServicePrint';

export default function TransaksiPenjualan({ parts, notas, onRefresh }) {
  const [search, setSearch] = useState('');
  const [kategori, setKategori] = useState('Semua');
  const [cart, setCart] = useState([]);
  
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerMode, setCustomerMode] = useState('Daftar');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [manualCustomer, setManualCustomer] = useState('');
  const [customNomorNota, setCustomNomorNota] = useState('');
  const [keteranganNota, setKeteranganNota] = useState('');
  const [showNota, setShowNota] = useState(false);
  const [transaksiData, setTransaksiData] = useState(null);
  
  const [toast, setToast] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [detailPart, setDetailPart] = useState(null);
  
  const [activeServices, setActiveServices] = useState([]);
  const [linkToService, setLinkToService] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [jasaPasang, setJasaPasang] = useState('0');

  useEffect(() => {
    getCustomers().then(setCustomers);
    getServices().then(all => {
      setActiveServices((all || []).filter(s => s.statusPengerjaan !== 'Sudah Diambil'));
    });
  }, [showCustomerModal]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredParts = useMemo(() => {
    return parts.filter(p => {
      if (kategori !== 'Semua' && p.kategori !== kategori) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return p.deskripsi.toLowerCase().includes(q) || p.kode.toLowerCase().includes(q);
    });
  }, [parts, search, kategori]);

  const addToCart = (part) => {
    if (part.stok <= 0) {
      showToast('Stok habis!', 'error');
      return;
    }
    const existing = cart.find(c => c.part.id === part.id);
    if (existing) {
      if (existing.qty + 1 > part.stok) {
        showToast('Melebihi stok maksimal!', 'error');
        return;
      }
      setCart(cart.map(c => c.part.id === part.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { part, qty: 1 }]);
    }
    showToast(`${part.deskripsi} ditambahkan`);
  };

  const updateCartQty = (id, newQty) => {
    const part = parts.find(p => p.id === id);
    if (!part) return;
    if (newQty > part.stok) {
      showToast('Melebihi stok!', 'error');
      return;
    }
    if (newQty <= 0) {
      setCart(cart.filter(c => c.part.id !== id));
      return;
    }
    setCart(cart.map(c => c.part.id === id ? { ...c, qty: newQty } : c));
  };

  const totalBelanja = cart.reduce((sum, c) => sum + (c.part.harga * c.qty), 0);

  const handleProses = () => {
    if (cart.length === 0) return;
    setCustomNomorNota(generateNomorNotaPenjualan(notas));
    setLinkToService(false);
    setSelectedServiceId('');
    setJasaPasang('0');
    setShowCustomerModal(true);
  };

  const handleCreateNota = async () => {
    const items = cart.map(c => ({
      id: c.part.id,
      partId: c.part.id,
      deskripsi: c.part.deskripsi,
      kategori: c.part.kategori,
      qty: c.qty,
      harga: c.part.harga,
      subtotal: c.qty * c.part.harga,
      keterangan: c.part.keterangan || ''
    }));

    if (linkToService) {
      if (!selectedServiceId) {
        alert('Pilih data servisan terlebih dahulu!');
        return;
      }
      try {
        const updatedService = await addPartsToService(selectedServiceId, items, Number(jasaPasang));
        setTransaksiData({
          ...updatedService,
          isService: true
        });
        setShowCustomerModal(false);
        setShowNota(true);
      } catch (err) {
        alert('Gagal menghubungkan ke servisan: ' + err.message);
      }
      return;
    }

    const finalCustomer = customerMode === 'Daftar' ? selectedCustomer : manualCustomer;
    if (!finalCustomer.trim()) {
      alert('Nama customer harus diisi!');
      return;
    }

    setTransaksiData({
      nomorNota: customNomorNota,
      namaCustomer: finalCustomer,
      namaAdmin: 'AGUS SUNARTO',
      keterangan: keteranganNota.trim(),
      items,
      total: totalBelanja
    });
    
    setShowCustomerModal(false);
    setShowNota(true);
  };  const handleNotaComplete = () => {
    setShowNota(false);
    setCart([]);
    setTransaksiData(null);
    setKeteranganNota('');
    onRefresh();
  };

  if (showNota && transaksiData) {
    if (transaksiData.isService) {
      return <NotaServicePrint data={transaksiData} onClose={handleNotaComplete} />;
    }
    return <NotaKontan data={transaksiData} onClose={handleNotaComplete} onRefresh={onRefresh} existingNotas={notas} />;
  }

  return (
    <div className="fade-in-up h-full flex flex-col">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-sm font-medium slide-in ${toast.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <ShoppingCart className="text-orange-400" size={24} />
        <h1 className="text-xl font-bold text-slate-800">Kasir Penjualan</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        
        {/* Kiri: Daftar Menu/Barang */}
        <div className="lg:col-span-2 flex flex-col card overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex gap-3 items-center bg-white">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari barang..." 
                className="input-field pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="select-field w-auto" value={kategori} onChange={e => setKategori(e.target.value)}>
              <option value="Semua">Semua Kategori</option>
              {KATEGORI_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredParts.map(p => (
                <div
                  key={p.id}
                  className={`relative flex flex-col text-left p-3 rounded-xl border transition-all ${p.stok <= 0 ? 'bg-slate-100 border-slate-200 opacity-60' : 'bg-white border-slate-200 hover:border-orange-400 hover:shadow-md hover:bg-orange-50/30'}`}
                >
                  {/* Tombol info detail */}
                  <button
                    onClick={e => { e.stopPropagation(); setDetailPart(p); }}
                    className="absolute top-2 right-2 p-1 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                    title="Lihat detail barang"
                  >
                    <Info size={13} />
                  </button>

                  {/* Area klik untuk tambah ke keranjang */}
                  <button
                    onClick={() => addToCart(p)}
                    disabled={p.stok <= 0}
                    className={`flex flex-col text-left flex-1 ${p.stok <= 0 ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span className="text-xs text-blue-600 font-mono mb-1 pr-5">{p.kode}</span>
                    <span className="font-medium text-slate-700 text-sm leading-tight flex-1 mb-2 pr-5">{p.deskripsi}</span>
                    <div className="w-full flex justify-between items-end mt-auto pt-2 border-t border-slate-100">
                      <span className="text-emerald-600 font-bold text-sm">{formatRupiah(p.harga)}</span>
                      <span className={`text-xs font-bold ${p.stok === 0 ? 'text-red-500' : 'text-slate-500'}`}>Stok: {p.stok}</span>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Kanan: Keranjang */}
        <div className="flex flex-col card overflow-hidden shadow-lg border-orange-200">
          <div className="p-5 bg-gradient-to-r from-orange-500 to-orange-600 border-b border-orange-600 text-center">
            <h2 className="font-bold text-white text-lg tracking-wide">Keranjang Belanja</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-2 bg-slate-50">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <ShoppingCart size={48} className="mb-2 opacity-20" />
                <p className="text-sm">Belum ada barang</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((c, i) => (
                  <div key={i} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-slate-700 text-sm">{c.part.deskripsi}</span>
                      <button onClick={() => updateCartQty(c.part.id, 0)} className="text-red-500 hover:text-red-600">
                        <X size={16} />
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <button onClick={() => updateCartQty(c.part.id, c.qty - 1)} className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center">-</button>
                        <span className="font-bold w-4 text-center">{c.qty}</span>
                        <button onClick={() => updateCartQty(c.part.id, c.qty + 1)} className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center">+</button>
                      </div>
                      <span className="font-bold text-emerald-600 text-sm">{formatRupiah(c.part.harga * c.qty)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-slate-200 space-y-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Total:</span>
              <span className="text-2xl font-bold text-emerald-600">{formatRupiah(totalBelanja)}</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setCart([])} 
                disabled={cart.length === 0}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition disabled:opacity-50"
              >
                Batal
              </button>
              <button 
                onClick={handleProses}
                disabled={cart.length === 0}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-lg shadow-emerald-900/30"
              >
                <Printer size={18} /> Proses & Cetak
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Input Customer */}
      {showCustomerModal && (
        <div className="modal-overlay fade-in-up">
          <div className="modal-content max-w-md">
            <div className="modal-header bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <User size={18}/>
                </div>
                Data Customer
              </h3>
              <button onClick={() => setShowCustomerModal(false)} className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"><X size={18}/></button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Option to Link to Active Service */}
              <div className="bg-orange-50/50 p-3.5 rounded-xl border border-orange-200/60 shadow-sm mb-4">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={linkToService} 
                    onChange={e => {
                      setLinkToService(e.target.checked);
                      if (e.target.checked && activeServices.length > 0) {
                        setSelectedServiceId(activeServices[0].id);
                      } else {
                        setSelectedServiceId('');
                      }
                    }} 
                    className="text-orange-500 rounded focus:ring-orange-500 w-4 h-4 cursor-pointer" 
                  />
                  <span className="text-xs font-black text-slate-800">Hubungkan ke Data Servisan Aktif</span>
                </label>
              </div>

              {linkToService ? (
                <div className="space-y-4 animate-scale-up">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Pilih Servisan Aktif</label>
                    <select 
                      className="select-field w-full" 
                      value={selectedServiceId} 
                      onChange={e => setSelectedServiceId(e.target.value)}
                    >
                      {activeServices.length === 0 ? (
                        <option value="">-- Tidak ada servisan aktif --</option>
                      ) : (
                        activeServices.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.noUrut} - {s.pemilik} ({s.jenis} {s.merek})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Biaya Jasa Servis / Pemasangan (Rp)</label>
                    <input 
                      type="text" 
                      className="input-field w-full font-bold text-emerald-600" 
                      placeholder="Masukkan biaya jasa servis/pasang..." 
                      value={jasaPasang ? jasaPasang.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ''} 
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        setJasaPasang(val);
                      }} 
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 shadow-inner">
                    <button 
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${customerMode === 'Daftar' ? 'bg-white text-orange-600 shadow-md transform scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}
                      onClick={() => setCustomerMode('Daftar')}
                    >Input dari Daftar</button>
                    <button 
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${customerMode === 'Manual' ? 'bg-white text-orange-600 shadow-md transform scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}
                      onClick={() => setCustomerMode('Manual')}
                    >Input Manual</button>
                  </div>

                  {customerMode === 'Daftar' ? (
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Pilih Customer Sebelumnya</label>
                      <select className="select-field w-full" value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)}>
                        <option value="">-- Pilih --</option>
                        {customers.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Nama Customer Baru</label>
                      <input type="text" className="input-field w-full" placeholder="Ketik nama lengkap..." value={manualCustomer} onChange={e => setManualCustomer(e.target.value)} />
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 mt-2">
                    <label className="text-xs text-slate-400 mb-1 block">Nomor Nota (Bisa diedit jika melanjutkan nota lama)</label>
                    <input type="text" className="input-field w-full font-mono text-blue-600" value={customNomorNota} onChange={e => setCustomNomorNota(e.target.value)} />
                  </div>

                  <div className="pt-2 border-t border-slate-200 mt-2">
                    <label className="text-xs text-slate-400 mb-1 block">Keterangan Nota (opsional)</label>
                    <input type="text" className="input-field w-full" placeholder="Ketik keterangan tambahan..." value={keteranganNota} onChange={e => setKeteranganNota(e.target.value)} />
                  </div>
                </>
              )}
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-3xl">
              <button onClick={() => setShowCustomerModal(false)} className="btn-secondary">Batal</button>
              <button onClick={handleCreateNota} className="btn-primary">
                Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Barang */}
      {detailPart && (
        <div className="modal-overlay fade-in-up" onClick={() => setDetailPart(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-0 overflow-hidden slide-in" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-5 text-white">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Package size={20} />
                  </div>
                  <div>
                    <p className="font-mono text-blue-100 text-xs">{detailPart.kode}</p>
                    <h3 className="font-bold text-base leading-tight">{detailPart.deskripsi}</h3>
                  </div>
                </div>
                <button onClick={() => setDetailPart(null)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                  <p className="text-[10px] text-slate-400 mb-1">Kategori</p>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 block text-center truncate">{detailPart.kategori}</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                  <p className="text-[10px] text-slate-400 mb-1 font-medium">Tgl Masuk</p>
                  <span className="text-xs font-bold text-slate-700 block text-center truncate">
                    {detailPart.tanggalMasuk ? formatTanggalSingkat(detailPart.tanggalMasuk) : '-'}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                  <p className="text-[10px] text-slate-400 mb-1">Stok</p>
                  <p className={`text-sm font-extrabold text-center ${detailPart.stok === 0 ? 'text-red-500' : detailPart.stok < 5 ? 'text-amber-500' : 'text-emerald-600'}`}>
                    {detailPart.stok} <span className="text-[10px] font-normal text-slate-400">unit</span>
                  </p>
                </div>
              </div>

              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <p className="text-xs text-emerald-600 mb-1 font-medium">Harga Jual</p>
                <p className="text-2xl font-extrabold text-emerald-600">{formatRupiah(detailPart.harga)}</p>
              </div>

              {detailPart.keterangan ? (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <p className="text-xs text-amber-600 mb-2 font-semibold flex items-center gap-1">
                    <Info size={12} /> Keterangan / Spesifikasi
                  </p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{detailPart.keterangan}</p>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
                  <p className="text-xs text-slate-400 italic">Tidak ada keterangan tambahan</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 flex gap-2">
              <button onClick={() => setDetailPart(null)} className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-medium text-sm transition">
                Tutup
              </button>
              <button
                disabled={detailPart.stok <= 0}
                onClick={() => { addToCart(detailPart); setDetailPart(null); }}
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition flex items-center justify-center gap-1.5"
              >
                <ShoppingCart size={15} /> Tambah ke Keranjang
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
