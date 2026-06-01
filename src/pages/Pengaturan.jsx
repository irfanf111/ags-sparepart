import React, { useState, useEffect } from 'react';
import { 
  Settings, User, Shield, FileSpreadsheet, Save, Download, 
  Upload, AlertTriangle, CheckCircle2, Copy, FileText, Info
} from 'lucide-react';
import { getSettings, saveSetting, addPart, resetTransactions } from '../utils/storage';
import { formatRupiah, APP_VERSION } from '../utils/helpers';

export default function Pengaturan({ onRefresh }) {
  const [activeTab, setActiveTab] = useState('profil');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [systemInfo, setSystemInfo] = useState(null);
  
  // State for profile settings
  const [profile, setProfile] = useState({
    nama_singkat: 'AGS NOTEBOOK',
    nama_bengkel: 'PT AGS WIJAYA DHANESWARA',
    alamat_bengkel: 'Desa Kunirejo Kulon, RT.002/RW.001, Kecamatan Butuh, Kabupaten Purworejo, Jawa Tengah',
    no_hp_bengkel: '083863333322',
    pesan_kaki_nota: 'Terima kasih telah mempercayakan kendaraan Anda kepada kami!'
  });

  // State for CSV Import
  const [csvPreview, setCsvPreview] = useState([]);
  const [csvFile, setCsvFile] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await getSettings();
      if (data) {
        setProfile({
          nama_singkat: data.nama_singkat || 'AGS NOTEBOOK',
          nama_bengkel: data.nama_bengkel || 'PT AGS WIJAYA DHANESWARA',
          alamat_bengkel: data.alamat_bengkel || 'Desa Kunirejo Kulon, RT.002/RW.001, Kecamatan Butuh, Kabupaten Purworejo, Jawa Tengah',
          no_hp_bengkel: data.no_hp_bengkel || '083863333322',
          pesan_kaki_nota: data.pesan_kaki_nota || 'Terima kasih telah mempercayakan kendaraan Anda kepada kami!'
        });
      }
    };
    fetchSettings();
  }, []);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await saveSetting('nama_singkat', profile.nama_singkat);
      await saveSetting('nama_bengkel', profile.nama_bengkel);
      await saveSetting('alamat_bengkel', profile.alamat_bengkel);
      await saveSetting('no_hp_bengkel', profile.no_hp_bengkel);
      await saveSetting('pesan_kaki_nota', profile.pesan_kaki_nota);
      
      setSuccessMsg('Profil Bengkel berhasil diperbarui!');
      setTimeout(() => setSuccessMsg(''), 4000);
      if (onRefresh) await onRefresh();
    } catch (err) {
      setErrorMsg('Gagal memperbarui profil: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----- FEATURE 2: BACKUP & RESTORE -----
  const handleBackup = async () => {
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      if (window.electronAPI) {
        const res = await window.electronAPI.backupDB();
        if (res.success) {
          setSuccessMsg(`Database berhasil dicadangkan ke:\n${res.filePath}`);
        } else if (!res.canceled) {
          setErrorMsg('Gagal melakukan pencadangan: ' + res.error);
        }
      } else {
        // Fallback for Web/Browser: Backup all localStorage data to a JSON file
        const backupData = {
          parts: JSON.parse(localStorage.getItem('ags_parts') || '[]'),
          notas: JSON.parse(localStorage.getItem('ags_notas') || '[]'),
          suppliers: JSON.parse(localStorage.getItem('ags_suppliers') || '[]'),
          keuangan: JSON.parse(localStorage.getItem('ags_keuangan') || '[]'),
          services: JSON.parse(localStorage.getItem('ags_services') || '[]'),
          settings: JSON.parse(localStorage.getItem('ags_settings') || '{}'),
          backupVersion: APP_VERSION || '8.6.2',
          backupTime: new Date().toISOString()
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `ags_backup_web_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        setSuccessMsg('Database berhasil dicadangkan (Format JSON untuk Browser)!');
      }
    } catch (err) {
      setErrorMsg('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    const confirmRestore = confirm(
      'PERINGATAN KRUSIAL!\n\nMemulihkan database akan menimpa (menghapus permanen) seluruh data transaksi, riwayat servis, catatan keuangan, dan master sparepart Anda saat ini!\n\nApakah Anda yakin ingin melanjutkan?'
    );
    
    if (!confirmRestore) return;

    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      if (window.electronAPI) {
        const res = await window.electronAPI.restoreDB();
        if (res.success) {
          setSuccessMsg('Database berhasil dipulihkan! Aplikasi akan memuat ulang data baru.');
          if (onRefresh) await onRefresh();
          setTimeout(() => window.location.reload(), 1500);
        } else if (!res.canceled) {
          setErrorMsg('Gagal memulihkan database: ' + res.error);
        }
      } else {
        // Fallback for Web/Browser: Restore localStorage from selected JSON file
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.onchange = (e) => {
          const file = e.target.files[0];
          if (!file) {
            setLoading(false);
            return;
          }
          const reader = new FileReader();
          reader.onload = async (event) => {
            try {
              const parsed = JSON.parse(event.target.result);
              if (!parsed.parts && !parsed.notas && !parsed.services) {
                throw new Error('Format file backup tidak valid. Harus mengandung data transaksi / sparepart.');
              }
              
              if (parsed.parts) localStorage.setItem('ags_parts', JSON.stringify(parsed.parts));
              if (parsed.notas) localStorage.setItem('ags_notas', JSON.stringify(parsed.notas));
              if (parsed.suppliers) localStorage.setItem('ags_suppliers', JSON.stringify(parsed.suppliers));
              if (parsed.keuangan) localStorage.setItem('ags_keuangan', JSON.stringify(parsed.keuangan));
              if (parsed.services) localStorage.setItem('ags_services', JSON.stringify(parsed.services));
              if (parsed.settings) localStorage.setItem('ags_settings', JSON.stringify(parsed.settings));
              
              setSuccessMsg('Database berhasil dipulihkan dari file JSON! Memuat ulang halaman...');
              if (onRefresh) await onRefresh();
              setTimeout(() => window.location.reload(), 1500);
            } catch (err) {
              setErrorMsg('Gagal memulihkan database: ' + err.message);
              setLoading(false);
            }
          };
          reader.readAsText(file);
        };
        fileInput.click();
      }
    } catch (err) {
      setErrorMsg('Error: ' + err.message);
      setLoading(false);
    }
  };

  const handleResetTransactions = async () => {
    const confirmReset = confirm(
      'PERINGATAN SANGAT KRUSIAL!\\n\\nTindakan ini akan menghapus secara PERMANEN:\\n- Semua data Penerimaan & Riwayat Servis\\n- Semua data Nota Transaksi Penjualan\\n- Semua Catatan Keuangan (Pemasukan & Pengeluaran)\\n- Semua Riwayat Customer\\n\\nData Master Spareparts (Gudang) & Suppliers TIDAK akan dihapus.\\n\\nApakah Anda yakin ingin melanjutkan reset data?'
    );
    
    if (!confirmReset) return;

    const secondConfirm = confirm(
      'APAKAH ANDA BENAR-BENAR YAKIN?\\n\\nSemua riwayat transaksi dan servisan akan hilang selamanya dan tidak dapat dikembalikan.\\n\\nKlik OK jika Anda sudah mantap ingin mengosongkan data testing.'
    );
    
    if (!secondConfirm) return;

    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await resetTransactions();
      setSuccessMsg('Semua data transaksi, keuangan, dan servisan berhasil dikosongkan!');
      if (onRefresh) await onRefresh();
    } catch (err) {
      setErrorMsg('Gagal mengosongkan data transaksi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----- FEATURE 4: CSV PARSING & IMPORT -----
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFile(file);
    setSuccessMsg('');
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        
        if (lines.length <= 1) {
          setErrorMsg('File CSV kosong atau hanya berisi baris header.');
          return;
        }

        // Determine separator (comma or semicolon)
        const header = lines[0];
        const separator = header.includes(';') ? ';' : ',';
        
        const previewRows = [];
        // Preview maximum first 5 rows
        for (let i = 1; i < Math.min(lines.length, 6); i++) {
          const cols = lines[i].split(separator).map(s => s.trim().replace(/^"|"$/g, ''));
          if (cols.length >= 3) {
            previewRows.push({
              kode: cols[0] || '',
              kategori: cols[1] || 'Sparepart',
              deskripsi: cols[2] || '',
              harga: parseInt(cols[3]) || 0,
              stok: parseInt(cols[4]) || 0,
              keterangan: cols[5] || ''
            });
          }
        }
        setCsvPreview(previewRows);
      } catch (err) {
        setErrorMsg('Gagal membaca file CSV: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleImportCSV = async () => {
    if (!csvFile) {
      setErrorMsg('Silakan pilih file CSV terlebih dahulu!');
      return;
    }
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        const header = lines[0];
        const separator = header.includes(';') ? ';' : ',';

        let count = 0;
        let errors = 0;

        // Start from index 1 (skip header)
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(separator).map(s => s.trim().replace(/^"|"$/g, ''));
          if (cols.length >= 3 && cols[0]) {
            try {
              const part = {
                kode: cols[0],
                kategori: cols[1] || 'Sparepart',
                deskripsi: cols[2],
                harga: parseInt(cols[3]) || 0,
                stok: parseInt(cols[4]) || 0,
                keterangan: cols[5] || ''
              };
              await addPart(part);
              count++;
            } catch (e) {
              errors++;
            }
          }
        }

        setSuccessMsg(`Berhasil mengimpor ${count} item sparepart ke database!${errors > 0 ? ` (${errors} item gagal)` : ''}`);
        setCsvFile(null);
        setCsvPreview([]);
        if (onRefresh) await onRefresh();
      } catch (err) {
        setErrorMsg('Proses impor gagal: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(csvFile);
  };

  // Sample CSV Template to Copy
  const sampleCSV = `Kode;Kategori;Deskripsi;Harga;Stok;Keterangan
SSD120;Sparepart;SSD VGEN 120GB SATA;220000;12;Garansi 3 tahun
MOUSE-LOG;Accessories;MOUSE LOGITECH B100;45000;8;Warna Hitam
THERMAL-PASTA;Accessories;THERMAL GRAPHYTE PASTA;35000;20;Premium Grey`;

  const copyTemplate = () => {
    navigator.clipboard.writeText(sampleCSV);
    alert('Template CSV disalin ke clipboard!');
  };

  const checkSystemSpecs = () => {
    const memory = navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'Tidak terdeteksi (Estimasi 4GB+)';
    const cores = navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} Core` : 'Tidak terdeteksi';
    const userAgent = navigator.userAgent;
    let os = 'Unknown OS';
    if (userAgent.indexOf('Win') !== -1) os = 'Windows OS';
    if (userAgent.indexOf('Mac') !== -1) os = 'macOS';
    if (userAgent.indexOf('Linux') !== -1) os = 'Linux OS';

    setSystemInfo({
      os,
      memory,
      cores,
      screenResolution: `${window.screen.width}x${window.screen.height} px`,
      databaseStatus: 'Terhubung (SQLite WebAssembly)',
      appVersion: `v${APP_VERSION}`
    });
  };

  return (
    <div className="fade-in-up space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="text-orange-500" />
            Pengaturan Sistem & Profil
          </h1>
          <p className="text-sm text-slate-500 mt-1">Konfigurasi profil toko, backup database, dan impor data massal.</p>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-start gap-2 animate-bounce-short whitespace-pre-line">
          <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={16} />
          <p className="text-sm font-medium">{successMsg}</p>
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-2">
          <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('profil')} 
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2
            ${activeTab === 'profil' ? 'border-orange-500 text-orange-500' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <User size={16} /> Profil Toko
        </button>
        <button 
          onClick={() => setActiveTab('keamanan')} 
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2
            ${activeTab === 'keamanan' ? 'border-orange-500 text-orange-500' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Shield size={16} /> Backup & Restore
        </button>
        <button 
          onClick={() => setActiveTab('impor')} 
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2
            ${activeTab === 'impor' ? 'border-orange-500 text-orange-500' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <FileSpreadsheet size={16} /> Impor Massal Sparepart
        </button>
        <button 
          onClick={() => setActiveTab('tentang')} 
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2
            ${activeTab === 'tentang' ? 'border-orange-500 text-orange-500' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Info size={16} /> Tentang Aplikasi
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        
        {/* TAB 1: PROFIL BENGKEL */}
        {activeTab === 'profil' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card p-5 space-y-4">
              <h2 className="text-md font-bold text-slate-700 pb-2 border-b border-slate-200">Ubah Profil Bengkel</h2>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Nama Singkat / Brand (Watermark &amp; Kop Utama)</label>
                    <input 
                      type="text" 
                      name="nama_singkat"
                      className="input-field" 
                      value={profile.nama_singkat}
                      onChange={handleProfileChange}
                      required 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Nama Lengkap Bengkel/Toko</label>
                    <input 
                      type="text" 
                      name="nama_bengkel"
                      className="input-field" 
                      value={profile.nama_bengkel}
                      onChange={handleProfileChange}
                      required 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">No. HP / Kontak Admin</label>
                    <input 
                      type="text" 
                      name="no_hp_bengkel"
                      className="input-field" 
                      value={profile.no_hp_bengkel}
                      onChange={handleProfileChange}
                      required 
                    />
                  </div>
                  <div></div>
                </div>
                
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Alamat Lengkap</label>
                  <input 
                    type="text" 
                    name="alamat_bengkel"
                    className="input-field" 
                    value={profile.alamat_bengkel}
                    onChange={handleProfileChange}
                    required 
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Catatan/Pesan Kaki Nota (Receipt Footer)</label>
                  <textarea 
                    name="pesan_kaki_nota"
                    rows={3}
                    className="input-field" 
                    value={profile.pesan_kaki_nota}
                    onChange={handleProfileChange}
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn-primary py-2 px-5 font-bold flex items-center gap-2"
                >
                  <Save size={16} /> {loading ? 'Menyimpan...' : 'Simpan Profil'}
                </button>
              </form>
            </div>

            {/* LIVE PREVIEW NOTA */}
            <div className="space-y-4">
              <div className="card p-5 bg-[#fdfbf7] text-black border border-amber-200/50 shadow-md font-sans text-xs">
                <h3 className="text-center font-bold text-slate-400 border-b border-dashed border-slate-300 pb-2 mb-2 uppercase tracking-wider">Simulasi Tampilan Nota</h3>
                <div className="text-center mb-4">
                  <h4 className="font-black text-sm text-black uppercase tracking-wider">{profile.nama_singkat}</h4>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest border-b border-dashed border-gray-300 pb-0.5 mb-1 inline-block">{profile.nama_bengkel}</p>
                  <p className="text-[9px] text-slate-600 font-medium leading-tight">{profile.alamat_bengkel}</p>
                  <p className="text-[9px] text-slate-600 font-medium leading-tight">HP. {profile.no_hp_bengkel}</p>
                </div>
                
                {/* Dummy Item list */}
                <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1">
                  <div className="flex justify-between font-mono">
                    <span>RAM LAPTOP DDR4 8GB</span>
                    <span>1 x Rp 350.000</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span>SSD VGEN 256GB</span>
                    <span>1 x Rp 275.000</span>
                  </div>
                </div>
                
                {/* Total */}
                <div className="flex justify-between font-bold text-xs mt-2 border-b border-dashed border-slate-300 pb-2">
                  <span>TOTAL BILL:</span>
                  <span className="font-mono text-emerald-700">{formatRupiah(625000)}</span>
                </div>

                {/* Footer Message */}
                <div className="mt-4 text-[9px] text-slate-500 leading-normal px-2">
                  {profile.pesan_kaki_nota.split('\n').map((line, i) => {
                    const trimmed = line.trim();
                    const isBullet = trimmed.startsWith('-') || trimmed.startsWith('*');
                    if (isBullet) {
                      const cleanLine = trimmed.replace(/^[-*]\s*/, '');
                      return (
                        <div key={i} className="flex items-start gap-1 text-left">
                          <span className="shrink-0 font-bold">-</span>
                          <span>{cleanLine}</span>
                        </div>
                      );
                    }
                    return <div key={i} className="text-left">{line}</div>;
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BACKUP & RESTORE */}
        {activeTab === 'keamanan' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Backup Box */}
            <div className="card p-6 flex flex-col justify-between space-y-6 hover:shadow-lg transition-shadow border-t-4 border-t-blue-500">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Download size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-700">Pencadangan Database (Backup)</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Ekspor dan simpan seluruh data yang telah diinput (Data Servis, Master Barang, dan Catatan Transaksi Keuangan) ke komputer Anda. 
                  Mendukung format SQLite (`.db`) untuk aplikasi desktop dan format JSON (`.json`) untuk web browser.
                </p>
              </div>
              <button 
                onClick={handleBackup}
                disabled={loading}
                className="btn-primary py-2.5 px-4 font-bold flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700"
              >
                <Download size={18} /> {loading ? 'Memproses...' : 'Cadangkan Sekarang'}
              </button>
            </div>

            {/* Restore Box */}
            <div className="card p-6 flex flex-col justify-between space-y-6 hover:shadow-lg transition-shadow border-t-4 border-t-red-500">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <Upload size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-700">Pemulihan Database (Restore)</h3>
                <p className="text-sm text-slate-500 leading-relaxed text-red-800 bg-red-50/50 p-3 rounded-lg border border-red-100 font-medium">
                  <AlertTriangle className="inline shrink-0 mr-1 text-red-600" size={14} /> 
                  PENTING: Menimpa seluruh database aktif saat ini dengan file cadangan Anda (format `.db` atau `.json`). Pastikan file backup valid.
                </p>
              </div>
              <button 
                onClick={handleRestore}
                disabled={loading}
                className="btn-primary py-2.5 px-4 font-bold flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700"
              >
                <Upload size={18} /> {loading ? 'Memproses...' : 'Pulihkan Database'}
              </button>
            </div>

            {/* Reset Box */}
            <div className="card p-6 flex flex-col justify-between space-y-6 hover:shadow-lg transition-shadow border-t-4 border-t-rose-600">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-700">Kosongkan Transaksi (Reset)</h3>
                <p className="text-sm text-slate-500 leading-relaxed text-rose-800 bg-rose-50/50 p-3 rounded-lg border border-rose-100 font-medium">
                  <AlertTriangle className="inline shrink-0 mr-1 text-rose-600" size={14} />
                  PENTING: Menghapus permanen seluruh riwayat transaksi penjualan (Nota), catatan keuangan, dan data servisan. Master Sparepart & Supplier tetap aman.
                </p>
              </div>
              <button 
                onClick={handleResetTransactions}
                disabled={loading}
                className="btn-primary py-2.5 px-4 font-bold flex items-center justify-center gap-2 w-full bg-rose-600 hover:bg-rose-700"
              >
                <AlertTriangle size={18} /> {loading ? 'Memproses...' : 'Reset Data Transaksi'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: CSV IMPORT */}
        {activeTab === 'impor' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Guide & Template */}
            <div className="card p-5 space-y-4">
              <h2 className="text-md font-bold text-slate-700 flex items-center gap-2 pb-2 border-b border-slate-200">
                <FileText size={18} className="text-orange-500" />
                Panduan Format CSV
              </h2>
              <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                <p>Format file harus berupa CSV dengan pemisah titik koma (`;`) atau koma (`,`), dengan baris pertama berupa nama kolom:</p>
                <div className="bg-slate-900 text-slate-300 p-2.5 rounded-lg font-mono text-[10px] relative">
                  <pre>{sampleCSV}</pre>
                  <button 
                    onClick={copyTemplate}
                    className="absolute top-2 right-2 p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                    title="Salin template"
                  >
                    <Copy size={12} />
                  </button>
                </div>
                <p className="font-semibold text-slate-700">Kolom Wajib:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Kode:</strong> Kode barang unik (misal: ADP, SSD120).</li>
                  <li><strong>Kategori:</strong> Sparepart, Accessories, Unit New, atau Unit Second.</li>
                  <li><strong>Deskripsi:</strong> Nama lengkap sparepart.</li>
                  <li><strong>Harga:</strong> Nilai angka (tanpa Rp atau titik).</li>
                  <li><strong>Stok:</strong> Nilai angka (tanpa titik).</li>
                </ul>
              </div>
            </div>

            {/* Importer Area */}
            <div className="lg:col-span-2 card p-5 space-y-4">
              <h2 className="text-md font-bold text-slate-700 pb-2 border-b border-slate-200">Unggah & Validasi File CSV</h2>
              
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-orange-500 transition-colors bg-slate-50/50">
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden" 
                  id="csv-file-input"
                />
                <label htmlFor="csv-file-input" className="cursor-pointer space-y-2 block">
                  <div className="mx-auto w-12 h-12 rounded-xl bg-orange-100 text-orange-500 flex items-center justify-center">
                    <FileSpreadsheet size={24} />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    {csvFile ? csvFile.name : 'Klik untuk memilih File CSV (.csv)'}
                  </p>
                  <p className="text-xs text-slate-500">Maksimum ukuran file 5MB</p>
                </label>
              </div>

              {/* Preview */}
              {csvPreview.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pratinjau Data (Maks. 5 baris awal)</h3>
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-3 py-2">Kode</th>
                          <th className="px-3 py-2">Kategori</th>
                          <th className="px-3 py-2">Deskripsi</th>
                          <th className="px-3 py-2 text-right">Harga</th>
                          <th className="px-3 py-2 text-center">Stok</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {csvPreview.map((row, index) => (
                          <tr key={index} className="hover:bg-slate-50">
                            <td className="px-3 py-2 font-semibold font-mono text-blue-600">{row.kode}</td>
                            <td className="px-3 py-2 text-slate-500">{row.kategori}</td>
                            <td className="px-3 py-2 text-slate-700 font-medium">{row.deskripsi}</td>
                            <td className="px-3 py-2 text-right text-emerald-600 font-bold">{formatRupiah(row.harga)}</td>
                            <td className="px-3 py-2 text-center text-slate-600 font-semibold">{row.stok}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button 
                    onClick={handleImportCSV}
                    disabled={loading}
                    className="btn-primary py-2 px-5 font-bold flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 mt-2"
                  >
                    <CheckCircle2 size={16} /> {loading ? 'Memproses Impor...' : 'Mulai Impor Sekarang'}
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 4: TENTANG APLIKASI */}
        {activeTab === 'tentang' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Left Card: Logo & Copyright */}
            <div className="md:col-span-4 card p-6 text-center space-y-4 flex flex-col justify-between items-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 border border-slate-700/30 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="space-y-4 my-auto relative z-10">
                <div className="w-24 h-24 mx-auto flex items-center justify-center p-2 rounded-2xl bg-white/5 border border-white/10 shadow-lg backdrop-blur-md">
                  <img src="logo.png" alt="Logo AGS" className="max-w-full max-h-full object-contain filter drop-shadow-[0_0_12px_rgba(249,115,22,0.5)]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-wide text-white leading-tight">AGS Techflow</h2>
                  <p className="text-xs text-orange-400 font-semibold tracking-wider uppercase mt-1">PT AGS WIJAYA DHANESWARA</p>
                  <p className="text-[11px] text-slate-400 mt-2">Sistem Informasi Manajemen Bengkel, Kasir POS, Gudang Sparepart, & Antrean Jasa Service Luring.</p>
                </div>
              </div>

              <div className="w-full pt-4 border-t border-slate-800 text-[10px] text-slate-500 space-y-1 relative z-10">
                <p className="font-semibold text-slate-400">Hak Cipta © 2026 PT AGS WIJAYA.</p>
                <p>Dikembangkan untuk Admin: <span className="text-orange-400 font-bold">AGUS SUNARTO</span></p>
                <p className="text-slate-600">All rights reserved. Lisensi Terdaftar.</p>
              </div>
            </div>

            {/* Right Card: Tech Stack & System Specs */}
            <div className="md:col-span-8 card p-6 space-y-6 bg-white border border-slate-200 shadow-md">
              
              {/* Spec grid */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Informasi Versi & Runtime</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-500 block">Versi Aplikasi</span>
                    <span className="text-md font-bold text-slate-800 block mt-1">v{APP_VERSION}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-500 block">Status Database</span>
                    <span className="text-xs font-bold text-emerald-600 block mt-1">Terhubung (SQLite)</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-500 block">Engine Runtime</span>
                    <span className="text-xs font-bold text-blue-600 block mt-1">Electron v40.10.0</span>
                  </div>
                </div>
              </div>

              {/* System Specs (Dynamic from web API) */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Spesifikasi Sistem Klien (Live Specs)</h3>
                  {!systemInfo && (
                    <button 
                      onClick={checkSystemSpecs} 
                      className="text-[11px] font-bold text-orange-500 hover:text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1 rounded-md transition-colors"
                    >
                      Muat Spesifikasi
                    </button>
                  )}
                </div>

                {systemInfo ? (
                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                    <div>
                      <span className="text-slate-500 block">Sistem Operasi</span>
                      <span className="font-semibold text-slate-800">{systemInfo.os}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Estimasi RAM</span>
                      <span className="font-semibold text-slate-800">{systemInfo.memory}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Jumlah Core CPU</span>
                      <span className="font-semibold text-slate-800">{systemInfo.cores}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Resolusi Layar</span>
                      <span className="font-semibold text-slate-800">{systemInfo.screenResolution}</span>
                    </div>
                    <div className="col-span-2 border-t border-slate-200/60 pt-2 mt-1">
                      <span className="text-slate-500 block">UserAgent / Browser Version</span>
                      <span className="font-mono text-[10px] text-slate-600 block truncate">{navigator.userAgent}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border border-slate-100 rounded-lg text-center text-xs text-slate-400">
                    Klik tombol untuk mengambil data hardware komputer Anda.
                  </div>
                )}
              </div>

              {/* Technologies */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Teknologi yang Digunakan</h3>
                <div className="flex flex-wrap gap-2">
                  {['React 18', 'Electron 40', 'Vite 5', 'SQLite Wasm', 'TailwindCSS 3', 'Lucide Icons', 'Recharts'].map(tech => (
                    <span key={tech} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px] border border-slate-200/50 transition-colors">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
