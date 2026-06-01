import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, Plus, Trash2, RefreshCw, Edit2, MessageCircle, 
  ExternalLink, X, Save, AlertCircle, CheckCircle2, Search, Filter, Briefcase, FileText
} from 'lucide-react';
import { addSupplier, updateSupplier, deleteSupplier } from '../utils/storage';
import CustomSelect from '../components/CustomSelect';

const EMPTY_FORM = {
  namaToko: '',
  pemilik: '',
  shopee: '',
  tokopedia: '',
  bukalapak: '',
  facebook: '',
  telp: '',
  whatsapp: '',
  tipeKemitraan: 'Supplier Utama',
  status: 'Aktif',
  kontrak: '',
  info: ''
};

const TIPE_MITRA_OPTIONS = [
  'Supplier Utama',
  'Teknisi / Bengkel Rekanan',
  'Reseller / Toko Mitra',
  'Mitra Korporat / Instansi'
];

export default function DataSupplier({ suppliers = [], onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [toast, setToast] = useState(null);
  
  // Search and Filter State
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('Semua Kemitraan');

  // WhatsApp Customization States
  const [showWaModal, setShowWaModal] = useState(false);
  const [waPartner, setWaPartner] = useState(null);
  const [waTopic, setWaTopic] = useState('stok');
  const [waIncludeNotes, setWaIncludeNotes] = useState(false);
  const [waCustomText, setWaCustomText] = useState('');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditId(s.id);
    setForm({
      namaToko: s.namaToko,
      pemilik: s.pemilik || '',
      shopee: s.shopee || '',
      tokopedia: s.tokopedia || '',
      bukalapak: s.bukalapak || '',
      facebook: s.facebook || '',
      telp: s.telp || '',
      whatsapp: s.whatsapp || '',
      tipeKemitraan: s.tipeKemitraan || 'Supplier Utama',
      status: s.status || 'Aktif',
      kontrak: s.kontrak || '',
      info: s.info || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (confirm(`Hapus data mitra ${name}?`)) {
      await deleteSupplier(id);
      if (selectedSupplier?.id === id) setSelectedSupplier(null);
      if (onRefresh) await onRefresh();
      showToast('Kemitraan dihapus', 'error');
    }
  };

  const handleSave = async () => {
    if (!form.namaToko.trim()) {
      showToast('Nama mitra/instansi wajib diisi!', 'error');
      return;
    }
    
    const saveData = {
      ...form,
      tipeKemitraan: form.tipeKemitraan || 'Supplier Utama',
      status: form.status || 'Aktif'
    };

    if (editId) {
      await updateSupplier(editId, saveData);
      showToast('Data mitra diperbarui!');
      if (selectedSupplier?.id === editId) setSelectedSupplier({...saveData, id: editId});
    } else {
      await addSupplier(saveData);
      showToast('Mitra baru ditambahkan!');
    }
    setShowModal(false);
    if (onRefresh) await onRefresh();
  };

  const generateWaText = (partner, topic, includeNotes) => {
    if (!partner) return '';
    let name = partner.pemilik && partner.pemilik !== '-' ? partner.pemilik : 'Bapak/Ibu';
    let greeting = `Halo ${name} dari *${partner.namaToko}*, ini dengan *AGS NOTEBOOK* (Admin: Agus Sunarto). `;
    
    let body = '';
    switch (topic) {
      case 'stok':
        body = 'Kami ingin menanyakan ketersediaan stok sparepart/aksesoris berikut: ';
        break;
      case 'servis':
        body = 'Kami ingin mendiskusikan terkait pengerjaan unit servis rekanan berikut: ';
        break;
      case 'update':
        body = 'Terkait unit/part servis pesanan Anda, berikut kami infokan rinciannya: ';
        break;
      case 'sla':
        body = 'Kami ingin berkoordinasi terkait kerjasama B2B / SLA perawatan berikut: ';
        break;
      case 'catatan':
        body = partner.kontrak && partner.kontrak !== '-' ? `${partner.kontrak}` : '';
        break;
      case 'sapaan':
      default:
        body = '';
        break;
    }
    
    let fullText = greeting + body;
    
    if (includeNotes && topic !== 'catatan' && partner.kontrak && partner.kontrak !== '-') {
      fullText += `\n\n*Catatan Tambahan:*\n"${partner.kontrak}"`;
    }
    
    return fullText;
  };

  const openWaModal = (partner) => {
    setWaPartner(partner);
    
    let defaultTopic = 'sapaan';
    if (partner.tipeKemitraan === 'Supplier Utama') {
      defaultTopic = 'stok';
    } else if (partner.tipeKemitraan === 'Teknisi / Bengkel Rekanan') {
      defaultTopic = 'servis';
    } else if (partner.tipeKemitraan === 'Reseller / Toko Mitra') {
      defaultTopic = 'update';
    } else if (partner.tipeKemitraan === 'Mitra Korporat / Instansi') {
      defaultTopic = 'sla';
    }

    setWaTopic(defaultTopic);
    
    const hasNotes = partner.kontrak && partner.kontrak !== '-' && partner.kontrak.trim() !== '';
    setWaIncludeNotes(hasNotes);
    
    const initialText = generateWaText(partner, defaultTopic, hasNotes);
    setWaCustomText(initialText);
    
    setShowWaModal(true);
  };

  useEffect(() => {
    if (waPartner && showWaModal) {
      const updatedText = generateWaText(waPartner, waTopic, waIncludeNotes);
      setWaCustomText(updatedText);
    }
  }, [waTopic, waIncludeNotes, waPartner, showWaModal]);

  const formatWaLink = (number, text) => {
    if (!number || number === '-') return '#';
    let clean = number.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.substring(1);
    return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
  };

  const handleOpenLink = (url) => {
    if (!url || url === '-') return;
    let finalUrl = url;
    if (!url.startsWith('http')) finalUrl = `https://${url}`;
    window.open(finalUrl, '_blank');
  };

  // Filtered List
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      const q = search.toLowerCase();
      const matchSearch = (
        s.namaToko.toLowerCase().includes(q) ||
        (s.pemilik && s.pemilik.toLowerCase().includes(q)) ||
        (s.info && s.info.toLowerCase().includes(q))
      );
      
      const matchType = typeFilter === 'Semua Kemitraan' || s.tipeKemitraan === typeFilter;
      
      return matchSearch && matchType;
    });
  }, [suppliers, search, typeFilter]);

  const getPartnerBadge = (type) => {
    switch (type) {
      case 'Supplier Utama': 
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold rounded-lg uppercase tracking-wider">Supplier</span>;
      case 'Teknisi / Bengkel Rekanan': 
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-lg uppercase tracking-wider">Rekanan</span>;
      case 'Reseller / Toko Mitra': 
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-lg uppercase tracking-wider">Reseller</span>;
      case 'Mitra Korporat / Instansi': 
        return <span className="px-2 py-0.5 bg-purple-100 text-purple-700 border border-purple-200 text-[10px] font-bold rounded-lg uppercase tracking-wider">Korporat / SLA</span>;
      default: 
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold rounded-lg uppercase tracking-wider">Mitra</span>;
    }
  };

  return (
    <div className="fade-in-up space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium slide-in ${toast.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="page-title text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <Users className="text-orange-500" size={28} /> 
            Mitra &amp; Hubungan Kerjasama
          </h1>
          <p className="page-subtitle text-sm text-slate-500 mt-1">Kelola jaringan supplier, teknisi rekanan, reseller, dan mitra korporat untuk memperluas operasional bisnis.</p>
        </div>
        
        <div className="flex gap-2 shrink-0">
          <button onClick={() => onRefresh()} className="btn-secondary px-3.5 py-2.5 bg-white shadow-sm border border-slate-200" title="Refresh">
            <RefreshCw size={16} />
          </button>
          <button onClick={openAdd} className="btn-success flex items-center gap-2 font-bold px-4 py-2.5 shadow-lg shadow-emerald-500/20 text-xs">
            <Plus size={16} /> Tambah Mitra Baru
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Table Kiri */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card overflow-hidden flex flex-col h-full min-h-[500px] border border-slate-200 shadow-xl bg-white">
            
            {/* Search & Filter Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Cari nama toko, pemilik, kontak..." 
                  className="input-field pl-9 w-full bg-white border-slate-300 focus:border-orange-500 text-slate-800 text-sm"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter size={15} className="text-slate-500" />
                <CustomSelect 
                  className="select-field bg-white border-slate-300 focus:border-orange-500 py-2 text-xs w-[180px] text-slate-800 font-medium" 
                  value={typeFilter}
                  options={['Semua Kemitraan', ...TIPE_MITRA_OPTIONS]}
                  onChange={val => setTypeFilter(val)}
                />
              </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[550px]">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0 z-10 text-xs uppercase font-bold">
                  <tr>
                    <th className="px-4 py-3">Nama Mitra / Instansi</th>
                    <th className="px-4 py-3">Tipe</th>
                    <th className="px-4 py-3">Kontak / Pemilik</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-500">
                        <Users size={40} className="mx-auto mb-3 opacity-20" />
                        <p className="font-semibold text-slate-700">Tidak ada data mitra ditemukan</p>
                        <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter tipe kemitraan.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredSuppliers.map(s => (
                      <tr 
                        key={s.id} 
                        onClick={() => setSelectedSupplier(s)}
                        className={`cursor-pointer transition-colors ${selectedSupplier?.id === s.id ? 'bg-orange-50/50 border-l-4 border-l-orange-500' : 'hover:bg-orange-50/20'}`}
                      >
                        <td className="px-4 py-3.5 font-bold text-slate-800">{s.namaToko}</td>
                        <td className="px-4 py-3.5">{getPartnerBadge(s.tipeKemitraan)}</td>
                        <td className="px-4 py-3.5">
                          <div className="font-medium text-slate-700">{s.pemilik || '-'}</div>
                          {s.whatsapp && s.whatsapp !== '-' && <div className="text-[10px] font-semibold text-emerald-600 font-mono">{s.whatsapp}</div>}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border
                            ${(s.status === 'Aktif' || !s.status)
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${(s.status === 'Aktif' || !s.status) ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                            {s.status || 'Aktif'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => openEdit(s)} className="p-1.5 text-blue-500 hover:bg-blue-50 border border-transparent hover:border-blue-200 rounded-lg transition-colors" title="Edit">
                              <Edit2 size={13}/>
                            </button>
                            <button onClick={() => handleDelete(s.id, s.namaToko)} className="p-1.5 text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg transition-colors" title="Hapus">
                              <Trash2 size={13}/>
                            </button>
                            {s.whatsapp && s.whatsapp !== '-' && (
                              <button 
                                onClick={() => openWaModal(s)} 
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 rounded-lg transition-colors cursor-pointer" 
                                title="Hubungi B2B WhatsApp"
                              >
                                <MessageCircle size={13}/>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
              <span>Total Mitra Terdaftar: {suppliers.length} Instansi/Toko</span>
              <span>Klik baris tabel untuk melihat rincian kerjasama</span>
            </div>
          </div>
        </div>
 
        {/* Panel Kanan (Preview) */}
        <div className="space-y-4">
          <div className="card p-5 h-full min-h-[500px] flex flex-col border border-slate-200 shadow-xl bg-white relative">
            <h2 className="font-bold text-orange-500 mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
              <Briefcase size={16}/> Profil Kemitraan
            </h2>
            
            {selectedSupplier ? (
              <div className="flex flex-col h-full flex-1">
                <div className="mb-5 text-center">
                  <div className="w-16 h-16 bg-gradient-to-tr from-orange-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl font-black text-white shadow-md shadow-orange-500/25">
                    {selectedSupplier.namaToko.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-800 leading-snug">{selectedSupplier.namaToko}</h3>
                  <div className="flex justify-center gap-1.5 mt-2">
                    {getPartnerBadge(selectedSupplier.tipeKemitraan)}
                    <span className={`px-2 py-0.5 border text-[10px] font-bold rounded-lg uppercase tracking-wider
                      ${(selectedSupplier.status === 'Aktif' || !selectedSupplier.status) ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                      {selectedSupplier.status || 'Aktif'}
                    </span>
                  </div>
                </div>
 
                <div className="space-y-4 mb-5 flex-1 overflow-y-auto pb-4 max-h-[350px]">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Informasi Kontak</span>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Nama Pemilik:</span>
                        <strong className="text-slate-700">{selectedSupplier.pemilik || '-'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">No. HP / WhatsApp:</span>
                        <strong className="text-emerald-700 font-mono">{selectedSupplier.whatsapp || '-'}</strong>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Catatan Tambahan</span>
                    <div className="bg-gradient-to-br from-amber-50/40 to-white p-3 rounded-xl border border-amber-200 min-h-[70px] text-xs text-slate-700 space-y-1">
                      {selectedSupplier.kontrak ? (
                        <div className="whitespace-pre-wrap break-words">{selectedSupplier.kontrak}</div>
                      ) : (
                        <p className="text-slate-400 italic">Belum ada catatan tambahan yang disimpan.</p>
                      )}
                    </div>
                  </div>

                  {selectedSupplier.tipeKemitraan === 'Supplier Utama' && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Toko Vendor &amp; Marketplace</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          disabled={!selectedSupplier.tokopedia || selectedSupplier.tokopedia === '-'}
                          onClick={() => handleOpenLink(selectedSupplier.tokopedia)}
                          className="flex items-center justify-center gap-1.5 p-2 bg-[#03AC0E]/10 border border-[#03AC0E]/20 text-[#03AC0E] rounded-xl text-[10px] font-bold disabled:opacity-30 disabled:grayscale transition cursor-pointer"
                        >
                          <ExternalLink size={12}/> Tokopedia
                        </button>
                        <button 
                          disabled={!selectedSupplier.shopee || selectedSupplier.shopee === '-'}
                          onClick={() => handleOpenLink(selectedSupplier.shopee)}
                          className="flex items-center justify-center gap-1.5 p-2 bg-[#EE4D2D]/10 border border-[#EE4D2D]/20 text-[#EE4D2D] rounded-xl text-[10px] font-bold disabled:opacity-30 disabled:grayscale transition cursor-pointer"
                        >
                          <ExternalLink size={12}/> Shopee
                        </button>
                        <button 
                          disabled={!selectedSupplier.bukalapak || selectedSupplier.bukalapak === '-'}
                          onClick={() => handleOpenLink(selectedSupplier.bukalapak)}
                          className="flex items-center justify-center gap-1.5 p-2 bg-[#000000]/10 border border-[#000000]/20 text-[#000000] rounded-xl text-[10px] font-bold disabled:opacity-30 disabled:grayscale transition cursor-pointer"
                        >
                          <ExternalLink size={12}/> Tiktokshop
                        </button>
                        <button 
                          disabled={!selectedSupplier.facebook || selectedSupplier.facebook === '-'}
                          onClick={() => handleOpenLink(selectedSupplier.facebook)}
                          className="flex items-center justify-center gap-1.5 p-2 bg-[#1877F2]/10 border border-[#1877F2]/20 text-[#1877F2] rounded-xl text-[10px] font-bold disabled:opacity-30 disabled:grayscale transition cursor-pointer"
                        >
                          <ExternalLink size={12}/> Facebook
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Alamat</span>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 min-h-[60px] text-xs text-slate-700 whitespace-pre-wrap break-words">
                      {selectedSupplier.info || '-'}
                    </div>
                  </div>
                </div>
 
                <button 
                  disabled={!selectedSupplier.whatsapp || selectedSupplier.whatsapp === '-'}
                  onClick={() => openWaModal(selectedSupplier)}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-100 disabled:text-slate-400 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 mt-auto transition shadow-lg shadow-emerald-500/20 text-xs active:scale-[0.98] cursor-pointer"
                >
                  <MessageCircle size={16} /> Hubungi WhatsApp Kemitraan
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                <Users size={48} className="mb-3 opacity-20 text-slate-400" />
                <p className="font-semibold text-slate-400 text-sm">Pilih Mitra</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[180px] mx-auto">Klik salah satu mitra pada tabel di sebelah kiri untuk melihat rincian kerjasama.</p>
              </div>
            )}
          </div>
        </div>
 
      </div>

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                <Users size={18} className="text-orange-500"/> 
                {editId ? 'Edit Hubungan Kemitraan' : 'Form Input Hubungan Kemitraan'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={20}/></button>
            </div>
            
            <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4">
              <p className="text-xs text-amber-500 font-semibold mb-3">* Kolom Nama Toko/Instansi wajib diisi.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">Nama Toko / Instansi *</label>
                    <input type="text" className="input-field text-sm" value={form.namaToko} onChange={e => setForm({...form, namaToko: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">Pemilik / Contact Person</label>
                    <input type="text" className="input-field text-sm" value={form.pemilik} onChange={e => setForm({...form, pemilik: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">No. HP / WhatsApp</label>
                    <input type="text" className="input-field text-sm font-mono" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value, telp: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block">Tipe Kemitraan</label>
                      <CustomSelect 
                        className="select-field py-2 text-xs bg-white border-slate-300 focus:border-orange-500 font-semibold text-slate-700" 
                        value={form.tipeKemitraan}
                        options={TIPE_MITRA_OPTIONS}
                        onChange={val => setForm({...form, tipeKemitraan: val})}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block">Status</label>
                      <CustomSelect 
                        className="select-field py-2 text-xs bg-white border-slate-300 focus:border-orange-500 font-semibold text-slate-700" 
                        value={form.status}
                        options={['Aktif', 'Non-Aktif']}
                        onChange={val => setForm({...form, status: val})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">Link Shopee</label>
                    <input type="text" className="input-field text-sm font-mono" value={form.shopee} onChange={e => setForm({...form, shopee: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">Link Tokopedia</label>
                    <input type="text" className="input-field text-sm font-mono" value={form.tokopedia} onChange={e => setForm({...form, tokopedia: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">Link Tiktokshop</label>
                    <input type="text" className="input-field text-sm font-mono" value={form.bukalapak} onChange={e => setForm({...form, bukalapak: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">Link Facebook</label>
                    <input type="text" className="input-field text-sm font-mono" value={form.facebook} onChange={e => setForm({...form, facebook: e.target.value})} />
                  </div>
                </div>

                <div className="md:col-span-2 mt-2">
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block flex items-center gap-1">
                    <FileText size={14} className="text-amber-500"/> Catatan Tambahan
                  </label>
                  <textarea 
                    className="input-field h-20 text-xs resize-none p-2.5" 
                    value={form.kontrak} 
                    onChange={e => setForm({...form, kontrak: e.target.value})}
                  ></textarea>
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Alamat</label>
                  <textarea 
                    className="input-field h-16 text-xs resize-none p-2.5" 
                    value={form.info} 
                    onChange={e => setForm({...form, info: e.target.value})}
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button onClick={() => setForm(EMPTY_FORM)} className="px-4 py-2 rounded-xl text-xs bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold cursor-pointer">Reset</button>
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-xs bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold cursor-pointer">Batal</button>
              <button onClick={handleSave} className="px-5 py-2.5 rounded-xl text-xs bg-orange-500 hover:bg-orange-600 text-white font-bold flex items-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer">
                <Save size={14}/> Simpan Mitra
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal WhatsApp B2B */}
      {showWaModal && waPartner && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in duration-200 zoom-in-95">
            {/* Header */}
            <div className="bg-emerald-600 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Kirim Pesan WhatsApp B2B</h3>
                  <p className="text-[10px] text-emerald-100 font-medium mt-0.5">
                    Kemitraan: {waPartner.namaToko} ({waPartner.whatsapp})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowWaModal(false)} 
                className="text-emerald-100 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20}/>
              </button>
            </div>
            
            {/* Body */}
            <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4 text-slate-800">
              
              {/* Info Mitra */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">PENERIMA / CP</span>
                  <strong className="text-slate-700">{waPartner.pemilik && waPartner.pemilik !== '-' ? waPartner.pemilik : 'Bapak/Ibu'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">TIPE KEMITRAAN</span>
                  <strong className="text-slate-700">{waPartner.tipeKemitraan}</strong>
                </div>
              </div>

              {/* Pilihan Topik Template */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-2 block flex items-center gap-1.5">
                  <Filter size={14} className="text-emerald-600" /> Pilih Topik / Template Pesan
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    { id: 'stok', label: '📦 Tanya Stok / Barang' },
                    { id: 'servis', label: '🔧 Koordinasi Servis' },
                    { id: 'update', label: '📝 Info Update Pesanan' },
                    { id: 'sla', label: '🤝 Kerjasama / SLA' },
                    { id: 'catatan', label: '📄 Catatan Tambahan', disabled: !waPartner.kontrak || waPartner.kontrak === '-' || waPartner.kontrak.trim() === '' },
                    { id: 'sapaan', label: '👋 Sapaan Umum saja' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      disabled={item.disabled}
                      onClick={() => setWaTopic(item.id)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex flex-col justify-between ${
                        item.disabled 
                          ? 'opacity-40 grayscale cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400'
                          : waTopic === item.id
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm shadow-emerald-500/10'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                      } cursor-pointer`}
                    >
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Opsi Sertakan Catatan Tambahan */}
              {waPartner.kontrak && waPartner.kontrak !== '-' && waPartner.kontrak.trim() !== '' && waTopic !== 'catatan' && (
                <div className="flex items-center justify-between p-3 bg-amber-50/50 border border-amber-200/60 rounded-xl">
                  <div className="flex flex-col gap-0.5 pr-2">
                    <span className="text-xs font-bold text-amber-800">Sertakan Catatan Tambahan?</span>
                    <span className="text-[10px] text-slate-500 line-clamp-1">"{waPartner.kontrak}"</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={waIncludeNotes} 
                      onChange={e => setWaIncludeNotes(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              )}

              {/* Live Preview Textarea */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    💬 Live Preview &amp; Edit Pesan
                  </label>
                  <span className="text-[10px] text-slate-400 font-semibold">Teks ini dapat Anda ubah secara bebas</span>
                </div>
                <textarea 
                  className="input-field h-40 text-xs resize-none p-3 bg-slate-50 font-mono leading-relaxed text-slate-700 w-full border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white" 
                  value={waCustomText} 
                  onChange={e => setWaCustomText(e.target.value)}
                ></textarea>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button 
                onClick={() => setShowWaModal(false)} 
                className="px-4 py-2 rounded-xl text-xs bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold cursor-pointer"
              >
                Batal
              </button>
              <button 
                onClick={() => {
                  window.open(formatWaLink(waPartner.whatsapp, waCustomText), '_blank');
                  setShowWaModal(false);
                }} 
                className="px-5 py-2.5 rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <MessageCircle size={14}/> Buka WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
