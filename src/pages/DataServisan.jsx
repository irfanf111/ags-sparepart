import React, { useState, useMemo } from 'react';
import { Search, Filter, Printer, Save, CheckCircle2, AlertCircle, RefreshCw, Trash2, Smartphone, PenTool, Calendar, Calculator } from 'lucide-react';
import { getServices, updateService, deleteService, removePartFromService } from '../utils/storage';
import { formatRupiah, formatTanggalSingkat, getTodayStr } from '../utils/helpers';
import NotaServicePrint from '../components/NotaServicePrint';
import CustomSelect from '../components/CustomSelect';
import KalkulatorMarkup from '../components/KalkulatorMarkup';

const STATUS_OPTIONS = [
  'Semua Status',
  'Proses Pengerjaan',
  'Menunggu Konfirmasi',
  'Menunggu Part',
  'Gagal Dikerjakan',
  'Di Cancel User',
  'Berhasil Dikerjakan',
  'Sudah Diambil'
];

export default function DataServisan({ onRefresh }) {
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState('');

  React.useEffect(() => {
    getServices().then(setServices);
  }, []);
  const [statusFilter, setStatusFilter] = useState('Semua Status');
  
  const [selectedService, setSelectedService] = useState(null);
  const [panelData, setPanelData] = useState(null);
  const [toast, setToast] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isKalkulatorOpen, setIsKalkulatorOpen] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredServices = useMemo(() => {
    return services.filter(s => {
      if (statusFilter !== 'Semua Status' && s.statusPengerjaan !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (s.noUrut?.toLowerCase().includes(q) || s.pemilik?.toLowerCase().includes(q) || s.merek?.toLowerCase().includes(q));
    }).sort((a, b) => b.noUrut.localeCompare(a.noUrut));
  }, [services, search, statusFilter]);

  const handleSelectService = (s) => {
    setSelectedService(s);
    setPanelData({ ...s });
    setIsEditingInfo(false);
  };

  const handleUpdatePanel = (field, value) => {
    if (!panelData) return;
    setPanelData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'statusPengerjaan') {
        if (value === 'Sudah Diambil') {
          if (!next.tanggalAmbil) {
            next.tanggalAmbil = getTodayStr();
          }
        } else {
          next.tanggalAmbil = '';
        }
      }
      return next;
    });
  };

  const handleSavePanel = async () => {
    if (!panelData) return;
    try {
      let updatedData = { ...panelData };
      if (updatedData.statusPembayaran === 'Lunas') {
        updatedData.dibayar = updatedData.biaya || 0;
      } else if (updatedData.statusPembayaran === 'Belum Lunas / Cicilan' || updatedData.statusPembayaran === 'Belum Lunas') {
        updatedData.dibayar = Number(updatedData.dibayar) || 0;
      }
      await updateService(panelData.id, updatedData);
      showToast('Data servis berhasil diperbarui');
      setIsEditingInfo(false);
      await refreshLocal();
    } catch (e) {
      console.error("Update error:", e);
      alert("Gagal mengupdate data: " + (e.message || e));
    }
  };

  const handleDelete = async () => {
    if (!selectedService) return;
    if (confirm(`Hapus data ${selectedService.noUrut} atas nama ${selectedService.pemilik}?`)) {
      await deleteService(selectedService.id);
      setSelectedService(null);
      setPanelData(null);
      showToast('Data berhasil dihapus', 'error');
      await refreshLocal();
    }
  };

  const handleOpenPrintModal = () => {
    if (!selectedService) return;
    setShowPrintModal(true);
  };

  const refreshLocal = async () => {
    const updated = await getServices();
    setServices(updated);
    if (selectedService) {
      const current = updated.find(s => s.id === selectedService.id);
      setSelectedService(current || null);
      setPanelData(current ? { ...current } : null);
    }
    if (onRefresh) await onRefresh();
  };

  const handleOpenWA = (service) => {
    if (!service || !service.noHp || service.noHp === '-') {
      showToast('Nomor HP tidak valid', 'error');
      return;
    }
    let num = service.noHp.replace(/\D/g, '');
    if (num.startsWith('0')) num = '62' + num.substring(1);

    const formattedBiaya = formatRupiah(service.biaya || 0);
    const status = service.statusPengerjaan;
    let message = '';

    if (status === 'Menunggu Konfirmasi') {
      message = `Assalamu Alaikum,
Ini dengan AGS NOTEBOOK.

Ingin mengkonfirmasikan hasil pengecekan perangkat Anda:
------------------------------------------------------
No. Nota : ${service.noUrut || '-'}
Jenis : ${service.jenis || '-'}
Merek : ${service.merek || '-'}
Keluhan : ${service.keluhan || '-'}

Estimasi Biaya : ${formattedBiaya}
------------------------------------------------------
Terkait estimasi biaya tersebut, mohon konfirmasinya apakah perbaikan perangkat ini ingin DILANJUTKAN atau DI-CANCEL?

Terima Kasih.`;
    } else if (status === 'Berhasil Dikerjakan') {
      message = `Assalamu Alaikum,
Ini dengan AGS NOTEBOOK.

Kabar gembira! Perangkat Anda sudah SELESAI kami perbaiki:
------------------------------------------------------
No. Nota : ${service.noUrut || '-'}
Jenis : ${service.jenis || '-'}
Merek : ${service.merek || '-'}
Masalah : ${service.catatanTeknisi || '-'}

Total Biaya : ${formattedBiaya}
------------------------------------------------------
Perangkat sudah bisa diambil di toko kami pada jam kerja. 

Terima Kasih.`;
    } else {
      message = `Assalamu Alaikum,
Ini dengan AGS NOTEBOOK.

Ingin menginformasikan update terbaru perangkat Anda:
------------------------------------------------------
No. Nota : ${service.noUrut || '-'}
Jenis : ${service.jenis || '-'}
Merek : ${service.merek || '-'}

Status Saat Ini : ${service.statusPengerjaan || '-'}
Biaya : ${formattedBiaya}
------------------------------------------------------
Terima Kasih.`;
    }

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${num}?text=${encodedMessage}`, '_blank');
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Berhasil Dikerjakan': return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-lg border border-emerald-200">Berhasil Dikerjakan</span>;
      case 'Proses Pengerjaan': return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-lg border border-amber-200">Proses Pengerjaan</span>;
      case 'Gagal Dikerjakan': 
      case 'Di Cancel User': return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-lg border border-red-200">{status}</span>;
      case 'Menunggu Konfirmasi': 
      case 'Menunggu Part': return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-lg border border-blue-200">{status}</span>;
      case 'Sudah Diambil': return <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg border border-slate-200">Sudah Diambil</span>;
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg border border-slate-200">{status}</span>;
    }
  };

  return (
    <div className="fade-in-up h-full flex flex-col">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium slide-in ${toast.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <PenTool className="text-orange-500" size={28} /> 
            Pengerjaan Servisan
          </h1>
          <p className="text-sm text-slate-500 mt-1">Dasbor teknisi untuk memantau dan memperbarui status pengerjaan</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        
        {/* Kiri: Tabel Antrean */}
        <div className="lg:col-span-2 flex flex-col card overflow-hidden border border-slate-200 shadow-xl">
          {/* Header & Filter */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                placeholder="Cari No.Urut, Pemilik, Merek..." 
                className="input-field pl-9 w-full bg-white border-slate-300 focus:border-blue-500 text-slate-800"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-500" />
              <CustomSelect 
                className="select-field bg-white border-slate-300 focus:border-blue-500 py-2.5 text-sm w-[180px] text-slate-800" 
                value={statusFilter}
                options={STATUS_OPTIONS}
                onChange={val => setStatusFilter(val)}
              />
            </div>
            <button onClick={refreshLocal} className="btn-secondary px-3 py-2.5" title="Refresh Data">
              <RefreshCw size={16} />
            </button>
          </div>

          {/* Tabel */}
          <div className="flex-1 overflow-auto bg-white relative">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-3 font-medium">No. Urut</th>
                  <th className="px-4 py-3 font-medium">Pemilik</th>
                  <th className="px-4 py-3 font-medium">Jenis</th>
                  <th className="px-4 py-3 font-medium">Merek - Tipe</th>
                  <th className="px-4 py-3 font-medium">Status Pengerjaan</th>
                  <th className="px-4 py-3 font-medium">Pembayaran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredServices.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500 font-medium">Tidak ada data servisan ditemukan</td></tr>
                ) : (
                  filteredServices.map(s => (
                    <tr 
                      key={s.id} 
                      onClick={() => handleSelectService(s)}
                      className={`cursor-pointer transition-colors ${selectedService?.id === s.id ? 'bg-orange-50' : 'hover:bg-orange-50/40'}`}
                    >
                      <td className="px-4 py-3 font-mono text-blue-600 text-xs">
                        {selectedService?.id === s.id && <span className="inline-block w-1.5 h-1.5 bg-blue-600 rounded-full mr-2 shadow-[0_0_5px_#3b82f6]"></span>}
                        {s.noUrut}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">{s.pemilik}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{s.jenis}</td>
                      <td className="px-4 py-3 text-slate-600">{s.merek}</td>
                      <td className="px-4 py-3">{getStatusBadge(s.statusPengerjaan)}</td>
                      <td className="px-4 py-3">
                        {s.biaya > 0 ? (
                          (s.statusPembayaran === 'Belum Lunas / Cicilan' || s.statusPembayaran === 'Belum Lunas') ? (
                            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-lg border border-red-200">
                              Hutang: {formatRupiah((s.biaya || 0) - (s.dibayar || 0))}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-200">Lunas</span>
                          )
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between text-xs text-slate-500">
            <span>Total Antrean: {filteredServices.length} Barang</span>
            <span className="italic">Klik baris tabel untuk melihat detail & update status</span>
          </div>
        </div>

        {/* Kanan: Panel Detail */}
        <div className="card border border-slate-200 shadow-xl flex flex-col overflow-hidden bg-white relative">
          {!selectedService ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <PenTool size={32} className="opacity-20" />
              </div>
              <p className="font-medium text-slate-400">Belum ada servisan yang dipilih</p>
              <p className="text-sm mt-2">Pilih data dari tabel di sebelah kiri untuk melihat detail, menulis catatan teknisi, dan mengubah status pengerjaan.</p>
            </div>
          ) : (
            <>
              {/* Header Panel */}
              <div className="bg-slate-50 p-5 border-b border-slate-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h2 className="font-bold text-lg text-slate-800">{selectedService.noUrut}</h2>
                    <p className="text-slate-500 text-sm">{selectedService.pemilik}</p>
                  </div>
                  {getStatusBadge(panelData.statusPengerjaan)}
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => handleOpenWA(panelData)} className="flex-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-200 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                    <Smartphone size={14}/> Hubungi WA
                  </button>
                  <button 
                    onClick={() => setIsEditingInfo(!isEditingInfo)} 
                    className={`px-3 py-1.5 border rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors
                      ${isEditingInfo ? 'bg-orange-500 text-white border-orange-500' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'}`}
                    title={isEditingInfo ? "Batal Edit Info" : "Edit Info Perangkat"}
                  >
                    <PenTool size={14}/> {isEditingInfo ? "Batal" : "Edit Info"}
                  </button>
                  <button onClick={handleDelete} className="px-3 bg-red-100 hover:bg-red-200 text-red-700 border border-red-200 rounded-lg transition-colors" title="Hapus Data">
                    <Trash2 size={14}/>
                  </button>
                </div>
              </div>

              {/* Body Panel */}
              {(() => {
                const partsList = panelData?.items ? (typeof panelData.items === 'string' ? JSON.parse(panelData.items) : panelData.items) : [];
                const totalParts = partsList.reduce((sum, item) => sum + (item.subtotal || 0), 0);
                const jasaServisVal = panelData ? Math.max(0, (panelData.biaya || 0) - totalParts) : 0;

                const handleUpdateJasaServis = (val) => {
                  const nextBiaya = Number(val) + totalParts;
                  handleUpdatePanel('biaya', nextBiaya);
                  handleUpdatePanel('jasaPasang', 0);
                };

                const handleRemovePart = async (partId) => {
                  if (!panelData) return;
                  if (confirm('Hapus sparepart ini dari data servisan dan kembalikan stoknya?')) {
                    try {
                      await removePartFromService(panelData.id, partId);
                      showToast('Sparepart dihapus & stok dikembalikan!');
                      await refreshLocal();
                    } catch (err) {
                      alert('Gagal menghapus sparepart: ' + err.message);
                    }
                  }
                };

                return (
                  <div className="flex-1 overflow-y-auto px-5 pt-5 pb-36 space-y-6">
                
                {/* Info Masalah */}
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Informasi Barang</p>
                  
                  {isEditingInfo ? (
                    <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-200 space-y-3 animate-scale-up">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">Nama Pemilik</label>
                        <input 
                          type="text" 
                          className="input-field py-1 text-xs bg-white border-slate-300 focus:border-orange-500 text-slate-800" 
                          value={panelData.pemilik || ''} 
                          onChange={e => handleUpdatePanel('pemilik', e.target.value)} 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-500 block mb-1">No. HP (WhatsApp)</label>
                          <input 
                            type="text" 
                            className="input-field py-1 text-xs bg-white border-slate-300 focus:border-orange-500 text-slate-800" 
                            value={panelData.noHp || ''} 
                            onChange={e => handleUpdatePanel('noHp', e.target.value)} 
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-500 block mb-1">Jenis Perangkat</label>
                          <CustomSelect 
                            className="select-field py-1 text-xs bg-white border-slate-300 focus:border-orange-500 text-slate-800" 
                            value={panelData.jenis || 'LAPTOP'}
                            options={['LAPTOP', 'NETBOOK', 'PC ALL IN ONE', 'PC DESKTOP', 'PROYEKTOR', 'SMARTPHONE', 'PRINTER', 'TELEVISI LED', 'TELEVISI TABUNG']}
                            onChange={val => handleUpdatePanel('jenis', val)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">Merek / Tipe</label>
                        <input 
                          type="text" 
                          className="input-field py-1 text-xs bg-white border-slate-300 focus:border-orange-500 text-slate-800" 
                          value={panelData.merek || ''} 
                          onChange={e => handleUpdatePanel('merek', e.target.value)} 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-500 block mb-1">Tanggal Masuk</label>
                          <input 
                            type="date" 
                            className="input-field py-1 text-xs bg-white border-slate-300 focus:border-orange-500 text-slate-800" 
                            value={panelData.tanggalMasuk || ''} 
                            onChange={e => handleUpdatePanel('tanggalMasuk', e.target.value)} 
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-500 block mb-1">Kelengkapan</label>
                          <input 
                            type="text" 
                            className="input-field py-1 text-xs bg-white border-slate-300 focus:border-orange-500 text-slate-800" 
                            value={panelData.kelengkapan || ''} 
                            onChange={e => handleUpdatePanel('kelengkapan', e.target.value)} 
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">Keluhan / Masalah</label>
                        <textarea 
                          className="input-field py-1 text-xs h-16 resize-none bg-white border-slate-300 focus:border-orange-500 text-slate-800" 
                          value={panelData.keluhan || ''} 
                          onChange={e => handleUpdatePanel('keluhan', e.target.value)} 
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-slate-500 text-xs block mb-1">Jenis Perangkat</span>
                          <span className="text-slate-700 font-medium">{selectedService.jenis || '-'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-xs block mb-1">Merek / Tipe</span>
                          <span className="text-slate-700 font-medium">{selectedService.merek}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4 border-t border-slate-100 pt-3">
                        <div>
                          <span className="text-slate-500 text-xs block mb-1">Tanggal Masuk</span>
                          <span className="text-slate-700 flex items-center gap-1 font-medium"><Calendar size={12}/> {formatTanggalSingkat(selectedService.tanggalMasuk)}</span>
                        </div>
                        {selectedService.statusPengerjaan === 'Sudah Diambil' && selectedService.tanggalAmbil && (
                          <div>
                            <span className="text-slate-500 text-xs block mb-1">Tanggal Diambil</span>
                            <span className="text-slate-700 flex items-center gap-1 font-medium text-emerald-600"><Calendar size={12}/> {formatTanggalSingkat(selectedService.tanggalAmbil)}</span>
                          </div>
                        )}
                      </div>
                      <div className="border-t border-slate-100 pt-3">
                        <span className="text-slate-500 text-xs block mb-1">Keluhan / Masalah Bawaan</span>
                        <p className="text-red-500 font-medium italic">{selectedService.keluhan}</p>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <span className="text-slate-500 text-xs block mb-1">Kelengkapan</span>
                        <p className="text-blue-600 text-sm font-medium">{selectedService.kelengkapan}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Update Teknisi */}
                <div className="space-y-4">
                  <p className="text-xs text-orange-500 font-bold uppercase tracking-wider mb-2">Update Teknisi</p>
                  
                  <div>
                    <label className="text-sm text-slate-700 font-medium mb-1.5 block">Status Pengerjaan</label>
                    <CustomSelect 
                      className="select-field w-full py-2.5 bg-white border-slate-300 focus:border-orange-500 font-medium" 
                      value={panelData.statusPengerjaan}
                      options={STATUS_OPTIONS.filter(o => o !== 'Semua Status')}
                      onChange={val => handleUpdatePanel('statusPengerjaan', val)}
                    />
                  </div>

                  {panelData.statusPengerjaan === 'Sudah Diambil' && (
                    <div className="animate-scale-up">
                      <label className="text-sm text-slate-700 font-medium mb-1.5 block">Tanggal Diambil (Penyerahan)</label>
                      <input 
                        type="date" 
                        className="input-field w-full py-2.5 bg-white border-slate-300 focus:border-orange-500 text-slate-800" 
                        value={panelData.tanggalAmbil || getTodayStr()}
                        onChange={e => handleUpdatePanel('tanggalAmbil', e.target.value)}
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-sm text-slate-700 font-medium mb-1.5 block">Catatan Teknisi (Part Diganti/Kerusakan)</label>
                    <textarea 
                      className="input-field w-full h-28 bg-white border-slate-300 focus:border-orange-500 resize-none" 
                      value={panelData.catatanTeknisi || ''}
                      onChange={e => handleUpdatePanel('catatanTeknisi', e.target.value)}
                    />
                  </div>

                  {/* Spareparts List */}
                  {partsList.length > 0 && (
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                      <label className="text-xs text-slate-500 font-bold block uppercase">Sparepart Terpasang</label>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {partsList.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 text-xs shadow-sm">
                            <div className="flex-1 min-w-0 pr-2">
                              <p className="font-bold text-slate-800 truncate">{item.deskripsi}</p>
                              <p className="text-slate-400 text-[10px] font-mono">{item.qty} x {formatRupiah(item.harga)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-emerald-600">{formatRupiah(item.subtotal)}</span>
                              <button 
                                type="button"
                                onClick={() => handleRemovePart(item.partId)}
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                title="Hapus part & kembalikan stok"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-600 pt-1 border-t border-slate-100">
                        <span>Total Suku Cadang:</span>
                        <span className="text-slate-800 font-bold">{formatRupiah(totalParts)}</span>
                      </div>
                    </div>
                  )}

                  {/* Cost breakdown inputs */}
                  <div>
                    <label className="text-xs text-slate-500 font-bold block uppercase mb-1">Jasa Servis / Perbaikan (Rp)</label>
                    <input 
                      type="text" 
                      className="input-field w-full py-2 bg-white border-slate-300 focus:border-orange-500 text-sm font-semibold"
                      value={jasaServisVal ? jasaServisVal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ''}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        handleUpdateJasaServis(Number(val));
                      }}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-sm text-slate-700 font-medium block">Total Biaya Akhir (Rp)</label>
                      <button 
                        type="button" 
                        onClick={() => setIsKalkulatorOpen(true)}
                        className="text-[11px] text-orange-500 hover:text-orange-600 flex items-center gap-0.5 font-bold transition-all active:scale-95 cursor-pointer"
                      >
                        <Calculator size={12} className="stroke-[2.5]" /> Kalkulator Markup
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">Rp</span>
                      <input 
                        type="text" 
                        readOnly
                        className="input-field w-full pl-12 py-2.5 text-lg font-black bg-slate-50 border-slate-200 text-emerald-600 cursor-not-allowed" 
                        value={panelData.biaya ? panelData.biaya.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : '0'}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1.5">*Total biaya otomatis dihitung dari: Jasa Servis + Total Suku Cadang.</p>
                  </div>

                  {(panelData.biaya > 0 || panelData.statusPengerjaan === 'Berhasil Dikerjakan' || panelData.statusPengerjaan === 'Sudah Diambil') && (
                    <div className="space-y-4 pt-2">
                      <div>
                        <label className="text-sm text-slate-700 font-medium mb-1.5 block">Status Pembayaran</label>
                        <CustomSelect 
                          className="select-field w-full py-2.5 bg-white border-slate-300 focus:border-orange-500 font-medium text-emerald-700" 
                          value={panelData.statusPembayaran || 'Lunas'}
                          options={['Lunas', 'Belum Lunas / Cicilan']}
                          onChange={val => handleUpdatePanel('statusPembayaran', val)}
                        />
                      </div>

                      {(panelData.statusPembayaran === 'Belum Lunas / Cicilan' || panelData.statusPembayaran === 'Belum Lunas') && (
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3 shadow-inner">
                          <div>
                            <label className="text-xs text-slate-600 font-bold mb-1.5 block">Sudah Dibayar / DP (Rp)</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">Rp</span>
                              <input 
                                type="text" 
                                className="input-field w-full pl-9 py-2 text-sm font-bold bg-white border-slate-300 focus:border-orange-500 text-slate-700" 
                                value={panelData.dibayar !== undefined ? panelData.dibayar.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : '0'}
                                onChange={e => {
                                  const val = e.target.value.replace(/\D/g, '');
                                  handleUpdatePanel('dibayar', Number(val));
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-xs font-semibold text-slate-700 pt-1">
                            <span>Sisa Hutang:</span>
                            <span className="text-red-600 text-sm font-black">
                              {formatRupiah((panelData.biaya || 0) - (panelData.dibayar || 0))}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-2 gap-3 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
                <button 
                  onClick={handleSavePanel}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 transition-colors shadow-lg shadow-orange-500/20"
                >
                  <Save size={18} /> Simpan Perubahan
                </button>
                <button 
                  onClick={handleOpenPrintModal}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
                >
                  <Printer size={18} /> Cetak Nota Akhir
                </button>
              </div>
            </>
          )}
        </div>

      </div>

      {showPrintModal && panelData && (
        <NotaServicePrint 
          data={panelData} 
          onClose={() => setShowPrintModal(false)} 
        />
      )}
      <KalkulatorMarkup isOpen={isKalkulatorOpen} onClose={() => setIsKalkulatorOpen(false)} onApply={(total) => handleUpdatePanel('biaya', total)} />
    </div>
  );
}
