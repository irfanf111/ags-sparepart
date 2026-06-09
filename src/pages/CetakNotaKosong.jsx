import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
    pesan_kaki_nota: 'Garansi Berlaku 30 hari setelah barang diambil & dgn masalah yg sama. Brg yg tersimpan & blm diambil dlm 2 bulan (60 hr), kami lepas tgg. jwb'
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
          pesan_kaki_nota: settingsData.pesan_kaki_nota || 'Garansi Berlaku 30 hari setelah barang diambil & dgn masalah yg sama. Brg yg tersimpan & blm diambil dlm 2 bulan (60 hr), kami lepas tgg. jwb'
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
      className="nota-card relative flex flex-col px-5 pt-3 pb-3"
      style={{ 
        minHeight: '13.8cm', 
        height: 'auto', 
        fontFamily: 'Arial, sans-serif', 
        fontSize: '12px', 
        lineHeight: '1.45', 
        color: '#000', 
        background: '#fdfbf7' 
      }}
    >
      {/* Watermark Logo */}
      <div
        className="watermark-container"
        style={{
          position: 'absolute',
          top: '38%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 0,
          opacity: 0.04,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}
      >
        <img 
          src="logo_app.png" 
          alt="Watermark Logo" 
          style={{ 
            width: '180px', 
            height: '180px', 
            objectFit: 'contain',
            filter: 'grayscale(100%)',
            marginBottom: '4px'
          }} 
        />
        <div style={{ fontSize: '4.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', whiteSpace: 'nowrap', color: '#000' }}>
          {profile.nama_singkat}
        </div>
      </div>

      {/* Konten Nota */}
      <div className="relative flex flex-col w-full" style={{ zIndex: 1, height: '100%' }}>
        
        {/* Header / Kop */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="logo_app.png" alt="Logo AGS" style={{ width: '84px', height: '84px', objectFit: 'contain', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 900, fontSize: '18px', color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>{profile.nama_singkat}</div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{profile.nama_bengkel}</div>
              <div style={{ fontSize: '11px', color: '#374151' }}>{profile.alamat_bengkel}</div>
              <div style={{ fontSize: '11px', color: '#374151' }}>HP. {profile.no_hp_bengkel}</div>
            </div>
          </div>
          <div style={{ fontSize: '11px', color: '#000', fontWeight: 'bold', textAlign: 'right', marginTop: '8px' }}>
            Tanggal Transaksi : ___________________
          </div>
        </div>

        <div style={{ borderTop: '2px solid #000', marginBottom: '1px' }}></div>
        <div style={{ borderTop: '4px solid #000' }}></div>

        {/* Customer Line */}
        <div style={{ fontSize: '12px', fontWeight: 'bold', margin: '8px 0 10px 0' }}>
          Kepada : ___________________________
        </div>

        {/* Tabel Barang */}
        <div style={{ minHeight: '220px', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: '1.5px solid #000' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #000' }}>
                <th style={{ width: '35px', padding: '4px 6px', borderRight: '1px solid #000', backgroundColor: '#ccccff', color: '#000', fontWeight: 'bold', textAlign: 'center' }}>No</th>
                <th style={{ padding: '4px 6px', borderRight: '1px solid #000', backgroundColor: '#ccccff', color: '#000', fontWeight: 'bold', textAlign: 'center' }}>Deskripsi Barang</th>
                <th style={{ width: '50px', padding: '4px 6px', borderRight: '1px solid #000', backgroundColor: '#ccccff', color: '#000', fontWeight: 'bold', textAlign: 'center' }}>Qty</th>
                <th style={{ width: '110px', padding: '4px 6px', borderRight: '1px solid #000', backgroundColor: '#ccccff', color: '#000', fontWeight: 'bold', textAlign: 'center' }}>HARGA</th>
                <th style={{ width: '140px', padding: '4px 6px', backgroundColor: '#ccccff', color: '#000', fontWeight: 'bold', textAlign: 'center' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((idx) => (
                <tr key={idx} style={{ height: '36px', borderBottom: '1px solid #000' }}>
                  <td style={{ borderRight: '1px solid #000', padding: '4px' }} className="text-center"></td>
                  <td style={{ borderRight: '1px solid #000', padding: '4px' }}></td>
                  <td style={{ borderRight: '1px solid #000', padding: '4px' }} className="text-center"></td>
                  <td style={{ borderRight: '1px solid #000', padding: '4px' }}></td>
                  <td style={{ padding: '4px' }}></td>
                </tr>
              ))}
              <tr style={{ height: '28px', fontWeight: 'bold' }}>
                <td colSpan={4} style={{ borderRight: '1px solid #000', padding: '4px 6px', borderTop: '1.5px solid #000' }} className="text-left">
                  Jumlah Keseluruhan
                </td>
                <td style={{ padding: '4px 6px', borderTop: '1.5px solid #000' }} className="text-left">
                  Rp.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer & Signature */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '16px' }}>
          <div style={{ width: '60%', marginTop: '20px' }}>
            <div style={{ fontWeight: 700, fontSize: '10px', marginBottom: '2px' }}>
              Keterangan: <button onClick={handleOpenEditTerms} className="text-blue-600 font-bold no-print hover:underline" style={{ border: 'none', background: 'none', cursor: 'pointer' }}>Edit Keterangan</button>
            </div>
            <div style={{ fontSize: '9px', lineHeight: 1.4, color: '#1f2937' }}>
              <ol style={{ listStyleType: 'decimal', paddingLeft: '14px', margin: 0 }}>
                {blankTerms.map((term, i) => (
                  <li key={i}>{term}</li>
                ))}
              </ol>
            </div>
          </div>
          <div style={{ width: '40%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ textAlign: 'center', width: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '11px' }}>Hormat Kami,</div>
              <div style={{ height: '70px', width: '100%' }}></div>
              <div style={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', textDecoration: 'underline' }}>AGUS SUNARTO</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );

  // =========================================================
  // Render: Nota Thermal (Mini Printer) Kosong
  // =========================================================
  const renderThermalContent = () => (
    <>
      <div className="text-center mb-2">
        <p className="font-black text-base uppercase text-red-600">{profile.nama_singkat}</p>
        <p className="text-[10px] font-bold text-gray-600 uppercase border-b border-dashed border-gray-300 pb-1 mb-1 inline-block">{profile.nama_bengkel}</p>
        <p className="text-[10px] mt-1">{profile.alamat_bengkel}</p>
        <p className="text-[10px]">HP. {profile.no_hp_bengkel}</p>
      </div>

      <div className="border-b border-black my-2"></div>
      <div className="text-center font-bold">NOTA KOSONG</div>
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

      <div className="mt-2 text-[10px] font-medium">
        <div className="flex items-center gap-1 font-bold">
          <span>Keterangan:</span>
          <button 
            onClick={handleOpenEditTerms} 
            className="text-blue-600 font-bold no-print hover:underline"
            style={{ fontSize: '9px' }}
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
        <span className="text-[10px] mb-8 mr-4">Hormat Kami</span>
        <span className="font-bold text-[10px] uppercase border-b border-black pb-0.5 mr-2">
          AGUS SUNARTO
        </span>
      </div>
    </>
  );

  return createPortal(
    <div className="fixed inset-0 bg-slate-50 z-50 overflow-y-auto flex flex-col fade-in-up print-container">
      {/* Header Aksi */}
      <div className="bg-white border-b border-slate-200 p-4 flex flex-wrap justify-between items-center gap-4 no-print sticky top-0 z-10 shadow-sm">
        <h2 className="text-slate-800 font-bold flex items-center gap-2">
          <Monitor size={18} className="text-orange-500" />
          Preview Nota Belanja (Nota Kosong)
        </h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => handlePrint('Thermal')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition">
            <Printer size={14} /> Mini Printer
          </button>
          <button onClick={() => handlePrint('A4')} className="btn-primary text-xs">
            <Printer size={14} /> Cetak A4
          </button>
          {onClose && (
            <button onClick={onClose} className="btn-danger text-xs ml-4">
              <X size={14} /> Tutup
            </button>
          )}
        </div>
      </div>

      {/* Area Print */}
      <div className="flex-1 pt-0 px-4 pb-4 flex justify-center items-start bg-slate-100 overflow-y-auto">
        {/* ===== FORMAT A4 ===== */}
        {printMode === 'A4' && (
          <div
            className="bg-white shadow-2xl print-area print-area-a4 border border-gray-200"
            style={{ width: '210mm' }}
          >
            {renderA4Card()}
          </div>
        )}

        {/* ===== FORMAT THERMAL (58mm) ===== */}
        {printMode === 'Thermal' && (
          <div className="bg-white text-black p-4 shadow-2xl print-area w-[58mm] text-xs font-sans pb-10" style={{ lineHeight: '1.4' }}>
            {renderThermalContent()}
          </div>
        )}
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
          }
          body { zoom: 100% !important; }
          body * { visibility: hidden; }
          .print-container { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: relative !important; margin: 0 !important; box-shadow: none !important; border: none !important; width: ${printMode === 'Thermal' ? '58mm' : '100%'} !important; max-width: ${printMode === 'Thermal' ? '58mm' : '100%'} !important; }
          .print-area-a4 { width: 100% !important; height: auto !important; border: none !important; box-shadow: none !important; }
          .nota-card {
            padding-top: 14px !important;
            overflow: hidden !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .no-print { display: none !important; }
          @page { size: ${printMode === 'Thermal' ? '58mm auto' : 'A4 portrait'}; margin: 0 !important; }
        }
      `}} />
    </div>,
    document.body
  );
}
