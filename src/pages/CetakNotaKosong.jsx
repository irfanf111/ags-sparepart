import React, { useState, useEffect } from 'react';
import { X, Printer, Monitor } from 'lucide-react';
import { getSettings } from '../utils/storage';

export default function CetakNotaKosong({ onClose }) {
  const [printMode, setPrintMode] = useState('A4');
  const [showEditTermsModal, setShowEditTermsModal] = useState(false);
  const [profile, setProfile] = useState({
    nama_singkat: 'AGS NOTEBOOK',
    nama_bengkel: 'PT AGS WIJAYA DHANESWARA',
    alamat_bengkel: 'Desa Kunirejo Kulon, RT.002/RW.001, Kecamatan Butuh, Kabupaten Purworejo, Jawa Tengah',
    no_hp_bengkel: '083863333322',
  });
  const [blankTerms, setBlankTerms] = useState([
    'Barang yang Sudah dibeli tidak dapat ditukar atau dikembalikan',
    'Terima kasih atas kunjungan anda'
  ]);
  const [tempTermsText, setTempTermsText] = useState('');

  useEffect(() => {
    getSettings().then(settingsData => {
      if (settingsData) {
        setProfile({
          nama_singkat: settingsData.nama_singkat || 'AGS NOTEBOOK',
          nama_bengkel: settingsData.nama_bengkel || 'PT AGS WIJAYA DHANESWARA',
          alamat_bengkel: settingsData.alamat_bengkel || 'Desa Kunirejo Kulon, RT.002/RW.001, Kecamatan Butuh, Kabupaten Purworejo, Jawa Tengah',
          no_hp_bengkel: settingsData.no_hp_bengkel || '083863333322',
        });
      }
    });
  }, []);

  const handlePrint = (mode) => {
    setPrintMode(mode);
    setTimeout(() => { window.print(); }, 300);
  };

  const handleOpenEditTerms = (e) => {
    e.preventDefault();
    setTempTermsText(blankTerms.join('\n'));
    setShowEditTermsModal(true);
  };

  const handleSaveTerms = () => {
    const lines = tempTermsText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    setBlankTerms(lines);
    setShowEditTermsModal(false);
  };

  // =========================================================
  // Render: Nota A4 Kosong
  // =========================================================
  const renderA4Card = () => (
    <div 
      className="print-area-blank bg-white shadow-xl p-8 relative flex flex-col mx-auto"
      style={{ 
        width: '210mm', 
        minHeight: '145mm', 
        color: '#000', 
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        lineHeight: '1.4',
        background: '#fdfbf7' 
      }}
    >
      {/* Kop Nota / Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-4">
          <img 
            src="logo.png" 
            alt="Logo" 
            className="w-[84px] h-[84px] object-contain flex-shrink-0" 
          />
          <div>
            <h2 
              className="font-extrabold text-xl tracking-wide uppercase leading-none"
              style={{ color: '#e02266' }}
            >
              {profile.nama_bengkel}
            </h2>
            <p className="text-sm font-semibold text-slate-800 mt-1">{profile.alamat_bengkel}</p>
            <p className="text-sm font-semibold text-slate-800">HP. {profile.no_hp_bengkel}</p>
          </div>
        </div>
        
        {/* Right Header: Tanggal Transaksi */}
        <div className="text-right pt-2 font-bold text-sm">
          <span>Tanggal Transaksi : ___________________</span>
        </div>
      </div>

      {/* Divider Line */}
      <div className="border-t-[3px] border-black mb-3"></div>

      {/* Customer Line */}
      <div className="font-bold text-sm mb-4">
        <span>Kepada : ___________________________</span>
      </div>

      {/* Table structure */}
      <div className="flex-1 mb-4">
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #000' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #000' }}>
              <th style={{ width: '40px', padding: '6px', borderRight: '2px solid #000', backgroundColor: '#d6d6fb', color: '#000', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center' }}>No</th>
              <th style={{ padding: '6px', borderRight: '2px solid #000', backgroundColor: '#d6d6fb', color: '#000', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'left' }}>Deskripsi Barang</th>
              <th style={{ width: '60px', padding: '6px', borderRight: '2px solid #000', backgroundColor: '#d6d6fb', color: '#000', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center' }}>Qty</th>
              <th style={{ width: '150px', padding: '6px', borderRight: '2px solid #000', backgroundColor: '#d6d6fb', color: '#000', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center' }}>HARGA</th>
              <th style={{ width: '180px', padding: '6px', backgroundColor: '#d6d6fb', color: '#000', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center' }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((idx) => (
              <tr key={idx} style={{ height: '48px', borderBottom: '2px solid #000' }}>
                <td style={{ borderRight: '2px solid #000' }} className="text-center"></td>
                <td style={{ borderRight: '2px solid #000' }}></td>
                <td style={{ borderRight: '2px solid #000' }} className="text-center"></td>
                <td style={{ borderRight: '2px solid #000' }}></td>
                <td></td>
              </tr>
            ))}
            <tr style={{ height: '36px', fontWeight: 'bold' }}>
              <td colSpan={4} style={{ borderRight: '2px solid #000', padding: '6px 12px' }} className="text-left font-bold text-sm">
                Jumlah Keseluruhan
              </td>
              <td style={{ padding: '6px 12px' }} className="text-left font-bold text-sm">
                Rp.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer Section */}
      <div className="flex justify-between items-start mt-4">
        {/* Left Notes */}
        <div className="w-[60%] text-left">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-sm text-slate-800">Keterangan :</span>
            <button 
              onClick={handleOpenEditTerms}
              className="text-blue-600 hover:text-blue-800 hover:underline font-bold text-xs no-print"
            >
              Edit Keterangan
            </button>
          </div>
          <ol className="list-decimal pl-4 space-y-1 text-sm font-semibold text-slate-800">
            {blankTerms.map((term, i) => (
              <li key={i}>{term}</li>
            ))}
          </ol>
        </div>

        {/* Right Signature */}
        <div className="w-[30%] text-right flex flex-col items-center">
          <span className="text-sm font-semibold text-slate-800 mb-12">Hormat Kami</span>
          <span className="font-extrabold text-sm text-slate-800 uppercase tracking-wide border-b-2 border-black pb-0.5">
            AGUS SUNARTO
          </span>
        </div>
      </div>
    </div>
  );

  // =========================================================
  // Render: Nota Thermal (Mini Printer) Kosong
  // =========================================================
  const renderThermalCard = () => (
    <div 
      className="print-area-blank bg-white text-black p-4 shadow-xl mx-auto w-[58mm] text-[10px] font-sans pb-8" 
      style={{ lineHeight: '1.4' }}
    >
      <div className="text-center mb-2">
        <p className="font-black text-xs uppercase text-rose-600">{profile.nama_singkat}</p>
        <p className="text-[8px] font-bold text-gray-600 uppercase border-b border-dashed border-gray-300 pb-1 mb-1 inline-block">{profile.nama_bengkel}</p>
        <p className="text-[8px] mt-1">{profile.alamat_bengkel}</p>
        <p className="text-[8px]">HP. {profile.no_hp_bengkel}</p>
      </div>

      <div className="border-b border-black my-2"></div>
      <div className="text-center font-bold text-[11px]">NOTA KOSONG</div>
      <div className="border-b border-black my-2"></div>

      <div className="flex flex-col gap-1 mb-2 font-semibold">
        <div>Tanggal : ________________</div>
        <div>Kepada  : ________________</div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '9px' }} className="my-2">
        <thead>
          <tr style={{ borderBottom: '1px solid #000', backgroundColor: '#e2e8f0' }}>
            <th style={{ width: '15px', borderRight: '1px solid #000', textAlign: 'center' }}>No</th>
            <th style={{ borderRight: '1px solid #000', paddingLeft: '2px' }}>Deskripsi</th>
            <th style={{ width: '20px', borderRight: '1px solid #000', textAlign: 'center' }}>Qty</th>
            <th style={{ width: '35px', borderRight: '1px solid #000', textAlign: 'right', paddingRight: '2px' }}>Harga</th>
            <th style={{ width: '40px', textAlign: 'right', paddingRight: '2px' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4].map((idx) => (
            <tr key={idx} style={{ height: '30px', borderBottom: '1px solid #000' }}>
              <td style={{ borderRight: '1px solid #000' }}></td>
              <td style={{ borderRight: '1px solid #000' }}></td>
              <td style={{ borderRight: '1px solid #000' }}></td>
              <td style={{ borderRight: '1px solid #000' }}></td>
              <td></td>
            </tr>
          ))}
          <tr style={{ fontWeight: 'bold' }}>
            <td colSpan={4} style={{ borderRight: '1px solid #000', padding: '2px' }}>Total</td>
            <td style={{ textAlign: 'right', paddingRight: '2px' }}>Rp.</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-2 text-[8px] font-semibold">
        <div className="flex items-center gap-1">
          <span>Keterangan:</span>
          <button 
            onClick={handleOpenEditTerms} 
            className="text-blue-600 font-bold no-print hover:underline"
            style={{ fontSize: '8px' }}
          >
            (Edit)
          </button>
        </div>
        <ol className="list-decimal pl-3 mt-1 space-y-0.5">
          {blankTerms.map((term, i) => (
            <li key={i}>{term}</li>
          ))}
        </ol>
      </div>

      <div className="mt-4 flex flex-col items-end">
        <span className="text-[8px] mb-8 mr-4">Hormat Kami</span>
        <span className="font-bold text-[8px] uppercase border-b border-black pb-0.5 mr-2">
          AGUS SUNARTO
        </span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-50 z-50 overflow-y-auto flex flex-col fade-in-up print-container">
      {/* Header Aksi */}
      <div className="bg-white border-b border-slate-200 p-4 flex flex-wrap justify-between items-center gap-4 no-print sticky top-0 z-10 shadow-sm">
        <h2 className="text-slate-800 font-bold flex items-center gap-2">
          <Monitor size={18} className="text-orange-500" />
          Preview Nota Belanja (Nota Kosong)
        </h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => handlePrint('A4')} className="btn-primary text-xs">
            <Printer size={14} /> Cetak A4
          </button>
          <button onClick={() => handlePrint('Thermal')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition">
            <Printer size={14} /> Mini Printer
          </button>
          {onClose && (
            <button onClick={onClose} className="btn-danger text-xs ml-4">
              <X size={14} /> Tutup
            </button>
          )}
        </div>
      </div>

      {/* Area Print */}
      <div className="flex-1 p-8 flex justify-center items-start bg-slate-100 overflow-y-auto">
        {printMode === 'A4' ? renderA4Card() : renderThermalCard()}
      </div>

      {/* Sub-modal: Edit Terms / Catatan Kaki */}
      {showEditTermsModal && (
        <div className="modal-overlay z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="modal-header bg-slate-50 border-b border-slate-200 px-5 py-4 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-base">Edit Keterangan Nota</h3>
              <button 
                onClick={() => setShowEditTermsModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-500 mb-2">Tuliskan syarat &amp; ketentuan. Gunakan baris baru (Enter) untuk poin berikutnya.</p>
              <textarea
                className="w-full h-32 input-field font-sans text-sm p-3 border border-slate-300 rounded-xl focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                value={tempTermsText}
                onChange={e => setTempTermsText(e.target.value)}
                placeholder="Masukkan keterangan nota..."
              />
            </div>
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button 
                onClick={() => setShowEditTermsModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveTerms}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles block injected for print layout override */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          html, body, #root, .print-container {
            margin: 0 !important;
            padding: 0 !important;
            transform: none !important;
            animation: none !important;
            perspective: none !important;
            filter: none !important;
            background: white !important;
          }
          body { zoom: 100% !important; }
          body * { visibility: hidden; }
          .print-container { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
          .print-area-blank, .print-area-blank * { visibility: visible; }
          .print-area-blank {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: ${printMode === 'Thermal' ? '58mm' : '100%'} !important;
            max-width: ${printMode === 'Thermal' ? '58mm' : '100%'} !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print { display: none !important; }
          @page { size: ${printMode === 'Thermal' ? '58mm auto' : 'A4 portrait'}; margin: 0 !important; }
        }
      `}} />
    </div>
  );
}
