import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Printer, FileText, CheckSquare, XSquare, PlusCircle } from 'lucide-react';
import { JENIS_SERVICE_OPTIONS, addService, getServices } from '../utils/storage';
import { getTodayStr, formatTanggalSingkat } from '../utils/helpers';
import NotaServicePrint from '../components/NotaServicePrint';
import CustomSelect from '../components/CustomSelect';

const KELENGKAPAN_OPTS = [
  'Tas', 'Adaptor', 'Unit Lengkap',
  'LCD', 'Hardisk', 'DVD Drive',
  'Baterai', 'RAM', 'Keyboard',
  'Wireless', 'Casing', 'Cmos'
];

export default function InputServisan({ onRefresh, navigate }) {
  const [kode, setKode] = useState('');
  
  const [form, setForm] = useState({
    pemilik: '',
    noHp: '',
    jenis: JENIS_SERVICE_OPTIONS[0],
    merek: '',
    keluhan: '',
    isiSendiri: ''
  });

  const [kelengkapan, setKelengkapan] = useState({});
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [savedData, setSavedData] = useState(null);

  useEffect(() => {
    // Generate next kode
    const fetchKode = async () => {
      const all = await getServices();
      const nextNum = all.length > 0 ? Math.max(...all.map(s => parseInt(s.noUrut.replace('AGS', '')) || 0)) + 1 : 1;
      setKode(`AGS${String(nextNum).padStart(5, '0')}`);
    };
    fetchKode();
  }, []);

  const handleChange = (field, value) => setForm(p => ({ ...p, [field]: value }));
  
  const toggleKelengkapan = (item) => setKelengkapan(p => ({ ...p, [item]: !p[item] }));

  const handleReset = () => {
    setForm({
      pemilik: '', noHp: '', jenis: JENIS_SERVICE_OPTIONS[0],
      merek: '', keluhan: '', isiSendiri: ''
    });
    setKelengkapan({});
  };

  const handleSimpan = async (e) => {
    e.preventDefault();
    if (!form.pemilik) {
      alert("Pemilik harus diisi!");
      return;
    }

    const kelengkapanList = Object.keys(kelengkapan).filter(k => kelengkapan[k]);
    if (form.isiSendiri) kelengkapanList.push(form.isiSendiri);
    
    const serviceData = {
      pemilik: form.pemilik,
      noHp: form.noHp || '-',
      jenis: form.jenis,
      merek: form.merek || '-',
      serialNumber: '-',
      keluhan: form.keluhan || '-',
      kelengkapan: kelengkapanList.join(', ') || '-',
      catatanTeknisi: '',
      biaya: 0,
      statusPengerjaan: 'Proses Pengerjaan'
    };

    try {
      const newData = await addService(serviceData);
      setSavedData(newData);
      
      if (onRefresh) onRefresh();
      
      // Tawarkan print
      setShowPrintModal(true);
    } catch (error) {
      console.error("Save error:", error);
      alert("Gagal menyimpan data: " + (error.message || error));
    }
  };

  const handleClosePrintModal = () => {
    setShowPrintModal(false);
    navigate('data_servisan');
  };

  return (
    <div className="fade-in-up max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <PlusCircle className="text-emerald-400" size={28} /> 
            Penerimaan Barang Servis
          </h1>
          <p className="text-sm text-slate-500 mt-1">Input data servis pelanggan baru ke dalam sistem</p>
        </div>
        <div className="text-right bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-md">
          <p className="text-xs text-slate-400">Tanggal Masuk</p>
          <p className="text-sm font-bold text-emerald-400">{formatTanggalSingkat(getTodayStr())}</p>
        </div>
      </div>

      <div className="card overflow-hidden shadow-md">
        <div className="bg-slate-50 p-5 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-blue-400" size={20} /> Form Input Data
          </h2>
          <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-lg text-sm font-mono font-bold">
            Kode: {kode}
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSimpan} className="space-y-8">
            {/* Grid 2 Column */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Baris 1: Nama Pemilik (Kiri) - Merek / Tipe / Serial Number (Kanan) */}
              <div>
                <label className="text-xs font-bold text-gray-900 mb-1.5 block uppercase tracking-wider">Nama Pemilik *</label>
                <input 
                  type="text" 
                  required
                  className="input-field w-full py-2.5" 
                  value={form.pemilik} 
                  onChange={e => handleChange('pemilik', e.target.value)} 
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-900 mb-1.5 block uppercase tracking-wider">Merek / Tipe</label>
                <input 
                  type="text" 
                  className="input-field w-full py-2.5" 
                  value={form.merek} 
                  onChange={e => handleChange('merek', e.target.value)} 
                />
              </div>

              {/* Baris 2: Nomor Handphone (Kiri) - Keluhan / Masalah (Kanan) */}
              <div>
                <label className="text-xs font-bold text-gray-900 mb-1.5 block uppercase tracking-wider">Nomor Handphone</label>
                <input 
                  type="text" 
                  className="input-field w-full py-2.5" 
                  value={form.noHp} 
                  onChange={e => handleChange('noHp', e.target.value)} 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-900 mb-1.5 block uppercase tracking-wider">Keluhan / Masalah</label>
                <textarea 
                  className="input-field w-full resize-none h-[46px]" 
                  value={form.keluhan} 
                  onChange={e => handleChange('keluhan', e.target.value)} 
                />
              </div>

              {/* Baris 3: Jenis Barang (Kiri) - (kosong) */}
              <div>
                <label className="text-xs font-bold text-gray-900 mb-1.5 block uppercase tracking-wider">Jenis Barang</label>
                <CustomSelect 
                  className="select-field w-full py-2.5" 
                  value={form.jenis} 
                  options={JENIS_SERVICE_OPTIONS}
                  onChange={val => handleChange('jenis', val)}
                />
              </div>
              <div></div> {/* Kolom Kanan Kosong */}
            </div>

            {/* Kelengkapan Section */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <label className="text-sm text-slate-700 font-bold mb-4 block flex items-center gap-2">
                <CheckSquare className="text-emerald-400" size={18} />
                Kelengkapan Barang Bawaan
              </label>
              
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 gap-4 mb-5">
                {KELENGKAPAN_OPTS.map(item => (
                  <label key={item} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors border ${kelengkapan[item] ? 'bg-orange-50 border-orange-400' : 'bg-white border-slate-300 hover:border-orange-400'}`}>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={kelengkapan[item] || false} 
                      onChange={() => toggleKelengkapan(item)} 
                    />
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${kelengkapan[item] ? 'border-orange-500 bg-orange-500' : 'bg-white border-slate-300'}`}>
                      {kelengkapan[item] && <CheckSquare size={14} className="text-white" />}
                    </div>
                    <span className={`text-sm ${kelengkapan[item] ? 'text-orange-500 font-medium' : 'text-slate-600'}`}>{item}</span>
                  </label>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-gray-900 uppercase tracking-wider shrink-0">Lainnya (Isi Sendiri):</label>
                <input 
                  type="text" 
                  className="input-field w-full md:w-1/2 py-2" 
                  value={form.isiSendiri} 
                  onChange={e => handleChange('isiSendiri', e.target.value)} 
                />
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button 
                type="button" 
                onClick={handleReset} 
                className="px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors"
              >
                <RefreshCw size={18}/> Reset Form
              </button>
              <button 
                type="submit" 
                className="px-8 py-2.5 rounded-lg font-bold flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-200 transition-colors"
              >
                <Save size={18}/> Simpan Data Servisan
              </button>
            </div>
          </form>
        </div>
      </div>

      {showPrintModal && savedData && (
        <NotaServicePrint 
          data={savedData} 
          onClose={handleClosePrintModal} 
        />
      )}
    </div>
  );
}
