import React, { useRef, useState, useEffect } from 'react';
import { X, Printer, Monitor } from 'lucide-react';
import { formatRupiah, formatTanggal, getTimeStr, getTodayStr, generateNomorNota } from '../utils/helpers';
import { addNota, getSettings } from '../utils/storage';

export default function NotaKontan({ data, onClose, onRefresh, existingNotas }) {
  const [mode, setMode] = useState('A4');
  const [nota, setNota] = useState(null);
  const [profile, setProfile] = useState({
    nama_singkat: 'AGS NOTEBOOK',
    nama_bengkel: 'PT AGS WIJAYA DHANESWARA',
    alamat_bengkel: 'Desa Kunirejo Kulon, RT.002/RW.001, Kecamatan Butuh, Kabupaten Purworejo, Jawa Tengah',
    no_hp_bengkel: '083863333322',
    pesan_kaki_nota: 'Garansi Berlaku 30 hari setelah barang diambil dan dengan masalah yang sama. Barang yang telah tersimpan & blm diambil dlm 2 bulan (60 hr), kami lepas tgg jwb.'
  });

  useEffect(() => {
    const today = getTodayStr();
    const time = getTimeStr();
    const completeData = {
      ...data,
      tanggal: today,
      waktu: time,
      nomorNota: data.nomorNota || generateNomorNota(existingNotas),
      keterangan: data.keterangan || '-',
    };
    const initNota = async () => {
      const savedNota = await addNota(completeData);
      setNota(savedNota);
      const settingsData = await getSettings();
      if (settingsData) {
        setProfile({
          nama_singkat: settingsData.nama_singkat || 'AGS NOTEBOOK',
          nama_bengkel: settingsData.nama_bengkel || 'PT AGS WIJAYA DHANESWARA',
          alamat_bengkel: settingsData.alamat_bengkel || 'Desa Kunirejo Kulon, RT.002/RW.001, Kecamatan Butuh, Kabupaten Purworejo, Jawa Tengah',
          no_hp_bengkel: settingsData.no_hp_bengkel || '083863333322',
          pesan_kaki_nota: settingsData.pesan_kaki_nota || 'Garansi Berlaku 30 hari setelah barang diambil dan dengan masalah yang sama. Barang yang telah tersimpan & blm diambil dlm 2 bulan (60 hr), kami lepas tgg jwb.'
        });
      }
    };
    initNota();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePrint = (printMode) => {
    setMode(printMode);
    setTimeout(() => { window.print(); }, 300);
  };

  if (!nota) return <div className="flex justify-center items-center h-full text-white">Menyimpan Transaksi...</div>;

  // =========================================================
  // Helper: Render satu nota kontan card (dipanggil 2x untuk A4)
  // Tinggi fixed 13.5cm → watermark inset-0 benar di tengah nota
  // =========================================================
  const renderNotaCard = () => (
    <div
      className="nota-card relative flex flex-col px-5 pt-3 pb-3"
      style={{ minHeight: '13.8cm', height: 'auto', fontFamily: 'Arial, sans-serif', fontSize: '12px', lineHeight: '1.45', color: '#000', background: '#fdfbf7' }}
    >
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
          src="logo.png" 
          alt="Watermark Logo" 
          style={{ 
            width: '180px', 
            height: '180px', 
            objectFit: 'contain',
            filter: 'grayscale(100%)',
            marginBottom: '4px'
          }} 
        />
        <div style={{ fontSize: '4.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', border: '3px dashed #000', borderRadius: '1rem', padding: '6px 24px', whiteSpace: 'nowrap', color: '#000' }}>
          {profile.nama_singkat}
        </div>
      </div>

      {/* Konten Nota */}
      <div className="relative flex flex-col w-full" style={{ zIndex: 1, height: '100%' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="logo.png" alt="Logo" style={{ width: '84px', height: '84px', objectFit: 'contain', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 900, fontSize: '18px', color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>{profile.nama_singkat}</div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{profile.nama_bengkel}</div>
              <div style={{ fontSize: '11px', color: '#374151' }}>{profile.alamat_bengkel}</div>
              <div style={{ fontSize: '11px', color: '#374151' }}>HP. {profile.no_hp_bengkel}</div>
            </div>
          </div>
          <div style={{ fontSize: '11px', color: '#6b7280', textAlign: 'right', marginTop: '8px' }}>
            Dicetak: {formatTanggal(nota.tanggal)} / {nota.waktu || '00:00'}
          </div>
        </div>

        <div style={{ borderTop: '2px solid #000', marginBottom: '1px' }}></div>
        <div style={{ borderTop: '4px solid #000' }}></div>
        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '2px 0' }}>
          Nota Kontan
        </div>
        <div style={{ borderTop: '1px solid #000', marginBottom: '2px' }}></div>

        {/* Info Rows */}
        <div style={{ borderBottom: '1px solid #d1d5db', display: 'flex', justifyContent: 'space-between', padding: '4px 6px', fontSize: '12px', lineHeight: '1.45' }}>
          <div><span style={{ color: '#6b7280', fontWeight: 700, textTransform: 'uppercase' }}>No. Nota : </span><strong style={{ fontFamily: 'monospace' }}>{nota.nomorNota}</strong></div>
          <div><span style={{ color: '#6b7280', fontWeight: 700, textTransform: 'uppercase' }}>Nama Pemilik : </span><strong>{nota.namaCustomer}</strong></div>
        </div>
        <div style={{ borderBottom: '2px solid #000', display: 'flex', justifyContent: 'space-between', padding: '4px 6px', fontSize: '12px', lineHeight: '1.45' }}>
          <div><span style={{ color: '#6b7280', fontWeight: 700, textTransform: 'uppercase' }}>Keterangan : </span><strong>{nota.keterangan || '-'}</strong></div>
          <div><span style={{ color: '#6b7280', fontWeight: 700, textTransform: 'uppercase' }}>Kasir / Admin : </span><strong>{nota.namaAdmin || 'AGUS SUNARTO'}</strong></div>
        </div>

        <div style={{ borderTop: '1px solid #000', margin: '3px 0' }}></div>

        {/* Tabel Barang */}
        <div style={{ minHeight: '85px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', lineHeight: '1.45' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #000' }}>
                <th style={{ textAlign: 'left', width: '25px', padding: '2px 0', fontWeight: 700 }}>No</th>
                <th style={{ textAlign: 'left', padding: '2px 0', fontWeight: 700 }}>Deskripsi Barang</th>
                <th style={{ textAlign: 'center', width: '40px', padding: '2px 0', fontWeight: 700 }}>Qty</th>
                <th style={{ textAlign: 'right', width: '90px', padding: '2px 0', fontWeight: 700 }}>Harga</th>
                <th style={{ textAlign: 'right', width: '100px', padding: '2px 0', fontWeight: 700 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {nota.items.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '3px 0' }}>{i + 1}</td>
                  <td style={{ padding: '3px 0' }}>
                    <div>{item.deskripsi}</div>
                    {item.keterangan && <div style={{ fontSize: '10px', color: '#6b7280', fontStyle: 'italic' }}>({item.keterangan})</div>}
                  </td>
                  <td style={{ padding: '3px 0', textAlign: 'center' }}>{item.qty}</td>
                  <td style={{ padding: '3px 0', textAlign: 'right' }}>{formatRupiah(item.harga)}</td>
                  <td style={{ padding: '3px 0', textAlign: 'right' }}>{formatRupiah(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ borderTop: '1.5px solid #000', marginTop: '8px', marginBottom: '8px' }}></div>

        {/* Total */}
        <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '13px', marginBottom: '42px' }}>
          Total Biaya : {formatRupiah(nota.total || 0)}
        </div>

        {/* Footer & Signature */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ width: '60%', marginTop: '40px' }}>
            <div style={{ fontWeight: 700, fontSize: '10px', marginBottom: '2px' }}>Syarat &amp; Ketentuan / Garansi :</div>
            <div style={{ fontSize: '9px', lineHeight: 1.4, color: '#1f2937' }}>
              {profile.pesan_kaki_nota.split('\n').map((line, i) => {
                const trimmed = line.trim();
                const isBullet = trimmed.startsWith('-') || trimmed.startsWith('*');
                if (isBullet) {
                  return (
                    <div key={i} style={{ display: 'flex', gap: '4px' }}>
                      <span style={{ flexShrink: 0, fontWeight: 700 }}>-</span>
                      <span>{trimmed.replace(/^[-*]\s*/, '')}</span>
                    </div>
                  );
                }
                return <div key={i}>{line}</div>;
              })}
            </div>
            <div style={{ fontSize: '8px', color: '#9ca3af', fontFamily: 'monospace', marginTop: '4px' }}>
              🔒 AGS VERIFIED: {btoa(nota.nomorNota + '|' + nota.total).substring(0, 12).toUpperCase()}
            </div>
          </div>
          <div style={{ width: '40%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ textAlign: 'center', width: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '11px' }}>Hormat Kami,</div>
              <div style={{ height: '75px', width: '100%' }}></div>
              <div style={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', textDecoration: 'underline' }}>AGUS SUNARTO</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-50 z-50 overflow-y-auto flex flex-col fade-in-up print-container">
      {/* Header Aksi */}
      <div className="bg-white border-b border-slate-200 p-4 flex flex-wrap justify-between items-center gap-4 no-print sticky top-0 z-10 shadow-sm">
        <h2 className="text-slate-800 font-bold flex items-center gap-2">
          <Monitor size={18} className="text-orange-500" />
          Preview Nota: <span className="text-orange-600 font-mono">{nota.nomorNota}</span>
        </h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => handlePrint('A4')} className="btn-primary text-xs">
            <Printer size={14} /> Cetak A4
          </button>
          <button onClick={() => handlePrint('Thermal')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition">
            <Printer size={14} /> Mini Printer
          </button>
          <button onClick={onClose} className="btn-danger text-xs ml-4">
            <X size={14} /> Tutup
          </button>
        </div>
      </div>

      {/* Area Print */}
      <div className="flex-1 pt-0 px-4 pb-4 flex justify-center items-start bg-slate-100 overflow-y-auto">

        {/* ===== FORMAT A4 — 2 nota per halaman ===== */}
        {(mode === 'A4' || mode === 'A5') && (
          <div
            className="bg-white shadow-2xl print-area print-area-a4 border border-gray-200"
            style={{ width: '210mm' }}
          >
            {renderNotaCard()}
          </div>
        )}

        {/* ===== FORMAT THERMAL (58mm) ===== */}
        {mode === 'Thermal' && (
          <div className="bg-white text-black p-4 shadow-2xl print-area w-[58mm] text-xs font-sans pb-10" style={{ lineHeight: '1.4' }}>
            <div className="text-center mb-2">
              <p className="font-black text-base uppercase text-red-600">{profile.nama_singkat}</p>
              <p className="text-[10px] font-bold text-gray-600 uppercase border-b border-dashed border-gray-300 pb-1 mb-1 inline-block">{profile.nama_bengkel}</p>
              <p className="text-[10px] mt-1">{profile.alamat_bengkel}</p>
              <p className="text-[10px]">HP. {profile.no_hp_bengkel}</p>
            </div>
            <div className="border-b border-black my-2"></div>
            <div className="text-center font-bold">NOTA KONTAN</div>
            <div className="border-b border-black my-2"></div>
            <div className="flex justify-between">
              <span>Nota : {nota.nomorNota.split('/').pop()}</span>
              <span>Kpd : {nota.namaCustomer ? nota.namaCustomer.substring(0, 8) : '-'}</span>
            </div>
            <div>Admin : {nota.namaAdmin}</div>
            <div className="border-b border-black my-2"></div>
            <div className="mb-2">
              {nota.items.map((item, i) => (
                <div key={i} className="mb-1">
                  <div>{item.deskripsi}</div>
                  {item.keterangan && <div style={{ fontSize: '9px', color: '#4b5563', fontStyle: 'italic' }}>({item.keterangan})</div>}
                  <div className="flex justify-between">
                    <span>{item.qty} x {formatRupiah(item.harga).replace('Rp. ', '')}</span>
                    <span>{formatRupiah(item.subtotal).replace('Rp. ', '')}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-b border-black my-2"></div>
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>{formatRupiah(nota.total)}</span>
            </div>
            <div className="border-b border-black my-2"></div>
            <div className="text-[10px] font-medium">
              {profile.pesan_kaki_nota.split('\n').map((line, i) => {
                const trimmed = line.trim();
                const isBullet = trimmed.startsWith('-') || trimmed.startsWith('*');
                if (isBullet) {
                  return (
                    <div key={i} className="flex items-start gap-1 text-left">
                      <span className="shrink-0 font-bold">-</span>
                      <span>{trimmed.replace(/^[-*]\s*/, '')}</span>
                    </div>
                  );
                }
                return <div key={i} className="text-left">{line}</div>;
              })}
            </div>
          </div>
        )}
      </div>

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
          .print-area { position: relative !important; margin: 0 !important; box-shadow: none !important; border: none !important; width: ${mode === 'Thermal' ? '58mm' : '100%'} !important; max-width: ${mode === 'Thermal' ? '58mm' : '100%'} !important; }
          .print-area-a4 { width: 100% !important; height: auto !important; border: none !important; box-shadow: none !important; }
          .nota-card {
            padding-top: 14px !important;
            overflow: hidden !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .cut-line { visibility: visible !important; }
          .no-print { display: none !important; }
          .print-container .watermark-container {
            transform: translate(-50%, -50%) !important;
          }
          @page { size: ${mode === 'Thermal' ? '58mm auto' : 'A4 portrait'}; margin: 0 !important; }
        }
      `}} />
    </div>
  );
}
