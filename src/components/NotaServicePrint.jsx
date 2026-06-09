import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { formatRupiah, formatTanggalSingkat, getTodayStr } from '../utils/helpers';
import { Printer, X } from 'lucide-react';
import { getSettings } from '../utils/storage';

const safeParseItems = (itemsStr) => {
  try {
    return JSON.parse(itemsStr || '[]') || [];
  } catch (e) {
    console.error("Error parsing items JSON:", e);
    return [];
  }
};

const maskPhoneNumber = (phone) => {
  if (!phone || phone === '-') return '-';
  const clean = phone.trim();
  if (clean.length < 8) return clean;
  const first = clean.slice(0, 4);
  const last = clean.slice(-4);
  return `${first}****${last}`;
};

export default function NotaServicePrint({ data, onClose }) {
  const [printMode, setPrintMode] = useState('A4');
  const [profile, setProfile] = useState({
    nama_singkat: 'AGS NOTEBOOK',
    nama_bengkel: 'PT AGS WIJAYA DHANESWARA',
    alamat_bengkel: 'Desa Kunirejo Kulon, RT.002/RW.001, Kecamatan Butuh, Kabupaten Purworejo, Jawa Tengah',
    no_hp_bengkel: '083863333322',
    pesan_kaki_nota: 'Garansi Berlaku 30 hari setelah barang diambil & dgn masalah yg sama. Brg yg tersimpan & blm diambil dlm 2 bulan (60 hr), kami lepas tgg. jwb'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const settingsData = await getSettings();
      if (settingsData) {
        setProfile({
          nama_singkat: settingsData.nama_singkat || 'AGS NOTEBOOK',
          nama_bengkel: settingsData.nama_bengkel || 'PT AGS WIJAYA DHANESWARA',
          alamat_bengkel: settingsData.alamat_bengkel || 'Desa Kunirejo Kulon, RT.002/RW.001, Kecamatan Butuh, Kabupaten Purworejo, Jawa Tengah',
          no_hp_bengkel: settingsData.no_hp_bengkel || '083863333322',
          pesan_kaki_nota: settingsData.pesan_kaki_nota || 'Garansi Berlaku 30 hari setelah barang diambil & dgn masalah yg sama. Brg yg tersimpan & blm diambil dlm 2 bulan (60 hr), kami lepas tgg. jwb'
        });
      }
    };
    fetchSettings();
  }, []);

  const handlePrint = (mode) => {
    setPrintMode(mode);
    setTimeout(() => { window.print(); }, 300);
  };

  if (!data) return null;

  // =========================================================
  // Helper: Render satu nota card (dipanggil 2x untuk A4)
  // Tinggi fixed 13.5cm → watermark absolute inset-0 benar-benar
  // di tengah NOTA, bukan tengah kertas
  // =========================================================
  const renderNotaCard = () => (
    <div
      className="nota-card relative flex flex-col px-4 pt-2.5 pb-2.5"
      style={{ minHeight: '13.5cm', height: 'auto', fontFamily: 'Arial, sans-serif', fontSize: '11px', lineHeight: '1.4', color: '#000', background: '#fdfbf7', boxSizing: 'border-box' }}
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
      <div className="relative flex flex-col w-full justify-between" style={{ zIndex: 1, flexGrow: 1, height: '100%' }}>
        <div className="flex flex-col w-full">
          {/* Header / Kop */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src="logo_app.png" alt="Logo AGS" style={{ width: '60px', height: '60px', objectFit: 'contain', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 900, fontSize: '15px', color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.1 }}>{profile.nama_singkat}</div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{profile.nama_bengkel}</div>
                <div style={{ fontSize: '10px', color: '#374151', lineHeight: 1.2 }}>{profile.alamat_bengkel}</div>
                <div style={{ fontSize: '10px', color: '#374151', lineHeight: 1.2 }}>HP. {profile.no_hp_bengkel}</div>
              </div>
            </div>
            <div style={{ fontSize: '10px', color: '#6b7280', textAlign: 'right', marginTop: '4px' }}>
              Dicetak: {formatTanggalSingkat(getTodayStr())} / {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          <div style={{ borderTop: '1.5px solid #1f2937', marginTop: '6px', marginBottom: '4px' }}></div>
          <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.15em', margin: '4px 0', color: '#111827' }}>
            Tanda Terima Service
          </div>
          <div style={{ borderTop: '1.5px solid #1f2937', marginTop: '4px', marginBottom: '6px' }}></div>

          {/* Info Grid (2 Kolom) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '8px 24px', borderBottom: '1.5px solid #1f2937', padding: '6px 4px', fontSize: '11px', lineHeight: '1.3' }}>
            {/* Kolom Kiri */}
            <div style={{ display: 'grid', gridTemplateColumns: '95px 1fr', gap: '3px 8px', alignItems: 'start' }}>
              <div style={{ color: '#4b5563', fontWeight: 600 }}>No. Nota</div>
              <div style={{ color: '#111827', fontFamily: 'monospace', fontWeight: 700 }}>: {data.noUrut || data.kode}</div>

              <div style={{ color: '#4b5563', fontWeight: 600 }}>Tgl Masuk</div>
              <div style={{ color: '#111827' }}>: {formatTanggalSingkat(data.tanggalMasuk)} / {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>

              <div style={{ color: '#4b5563', fontWeight: 600 }}>Status</div>
              <div style={{ color: '#dc2626', fontWeight: 700, textTransform: 'uppercase' }}>: {data.statusPengerjaan}</div>
            </div>

            {/* Kolom Kanan */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 180px', gap: '3px 8px', alignItems: 'start' }}>
              <div style={{ color: '#4b5563', fontWeight: 600, textAlign: 'right' }}>Nama Pemilik</div>
              <div style={{ color: '#111827' }}>:</div>
              <div style={{ color: '#111827', fontWeight: 700 }}>{data.pemilik}</div>

              <div style={{ color: '#4b5563', fontWeight: 600, textAlign: 'right' }}>Barang / Tipe</div>
              <div style={{ color: '#111827' }}>:</div>
              <div style={{ color: '#111827', fontWeight: 700 }}>{data.jenis}{data.merek && data.merek !== '-' ? ` / ${data.merek}` : ''}</div>

              <div style={{ color: '#4b5563', fontWeight: 600, textAlign: 'right' }}>No. HP</div>
              <div style={{ color: '#111827' }}>:</div>
              <div style={{ color: '#111827' }}>{maskPhoneNumber(data.noHp)}</div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e5e7eb', margin: '4px 0' }}></div>

          {/* Content Boxes */}
          <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '4px' }}>
            <div style={{ zIndex: 1 }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', marginBottom: '2px' }}>Masalah / Penyelesaian :</div>
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px 8px', minHeight: '48px', fontSize: '10px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'transparent', lineHeight: '1.35', color: '#1f2937' }}>
                {data.keluhan}{data.catatanTeknisi ? `\n\nPenanganan:\n${data.catatanTeknisi}` : ''}
              </div>
            </div>
            <div style={{ zIndex: 1 }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', marginBottom: '2px' }}>Kelengkapan :</div>
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px 8px', minHeight: '48px', fontSize: '10px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'transparent', lineHeight: '1.35', color: '#1f2937' }}>
                {data.kelengkapan}
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '4px', marginBottom: '6px' }}></div>

          {/* Spareparts & Fees Breakdown Table */}
          {((data.items && safeParseItems(data.items).length > 0) || (Number(data.biaya) > 0)) && (
            <div style={{ zIndex: 1, marginTop: '2px', marginBottom: '6px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5px', lineHeight: '1.3' }}>
                <tbody style={{ borderBottom: '1.5px solid #1f2937' }}>
                  {safeParseItems(data.items).map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '4px 0', color: '#1f2937' }}>{item.deskripsi}</td>
                      <td style={{ padding: '4px 0', textAlign: 'center', color: '#1f2937', width: '40px' }}>{item.qty}</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', color: '#1f2937', width: '90px' }}>{formatRupiah(item.harga)}</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', color: '#1f2937', width: '100px' }}>{formatRupiah(item.subtotal)}</td>
                    </tr>
                  ))}
                  {((Number(data.biaya) || 0) - safeParseItems(data.items).reduce((sum, i) => sum + (i.subtotal || 0), 0)) > 0 && (
                    <tr style={{ fontWeight: 'bold' }}>
                      <td colSpan="3" style={{ padding: '4px 0', textAlign: 'right', color: '#1f2937' }}>Jasa Servis</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', color: '#1f2937', width: '100px' }}>
                        {formatRupiah(Number(data.biaya) - safeParseItems(data.items).reduce((sum, i) => sum + (i.subtotal || 0), 0))}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer & Signature */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '10px' }}>
          <div style={{ width: '60%' }}>
            <div style={{ fontWeight: 700, fontSize: '9.5px', marginBottom: '2px' }}>Syarat &amp; Ketentuan / Garansi :</div>
            <div style={{ fontSize: '8.5px', lineHeight: 1.3, color: '#1f2937' }}>
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
              🔒 AGS VERIFIED: {btoa((data.noUrut || data.kode) + '|' + data.pemilik).substring(0, 12).toUpperCase()}
            </div>
          </div>
          <div style={{ width: '40%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '10px', textAlign: 'right' }}>
              Total Biaya : {formatRupiah(data.biaya || 0)}
            </div>
            <div style={{ textAlign: 'center', width: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '10px' }}>Hormat Kami,</div>
              <div style={{ height: '45px', width: '100%' }}></div>
              <div style={{ fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', textDecoration: 'underline' }}>AGUS SUNARTO</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 bg-slate-50 z-50 overflow-y-auto flex flex-col fade-in-up print-container">
      {/* Control Panel */}
      <div className="no-print bg-white p-4 flex justify-between items-center sticky top-0 z-10 shadow-sm border-b border-slate-200">
        <h2 className="text-slate-800 font-bold">Preview Cetak: {data.noUrut || data.kode}</h2>
        <div className="flex gap-3">
          <button onClick={() => handlePrint('Thermal')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded font-bold flex items-center gap-2 text-sm">
            <Printer size={16} /> Cetak Thermal (58mm)
          </button>
          <button onClick={() => handlePrint('A4')} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold flex items-center gap-2 text-sm">
            <Printer size={16} /> Cetak A4
          </button>
          <button onClick={onClose} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded font-bold flex items-center gap-2 text-sm">
            <X size={16} /> Tutup
          </button>
        </div>
      </div>

      <div className="flex-1 pt-0 px-4 pb-4 flex justify-center items-start bg-slate-100 overflow-y-auto">
        {/* ===== FORMAT A4 ===== */}
        {printMode === 'A4' && (
          <div
            className="bg-white shadow-2xl print-area print-area-a4 border border-gray-200"
            style={{ width: '210mm' }}
          >
            {renderNotaCard()}
          </div>
        )}

        {/* ===== FORMAT THERMAL (58mm) ===== */}
        {printMode === 'Thermal' && (
          <div className="bg-white text-black p-4 shadow-2xl print-area w-[58mm] text-xs font-sans pb-10" style={{ lineHeight: '1.4' }}>
            <div className="text-center mb-2">
              <p className="font-black text-base uppercase text-red-600">{profile.nama_singkat}</p>
              <p className="text-[10px] font-bold text-gray-600 uppercase border-b border-dashed border-gray-300 pb-1 mb-1 inline-block">{profile.nama_bengkel}</p>
              <p className="text-[10px] mt-1">{profile.alamat_bengkel}</p>
              <p className="text-[10px]">HP. {profile.no_hp_bengkel}</p>
            </div>
            <div className="border-b border-black my-2"></div>
            <div className="text-center font-bold">Tanda Terima Service</div>
            <div className="border-b border-black my-2"></div>
            <div className="flex justify-between">
              <span>Kode : {data.noUrut || data.kode}</span>
              <span>Pemilik : {data.pemilik || '-'}</span>
            </div>
            <div className="flex justify-between text-[10px] mt-1">
              <span>Tgl Masuk : {formatTanggalSingkat(data.tanggalMasuk)}</span>
              <span>No. HP : {maskPhoneNumber(data.noHp)}</span>
            </div>
            <div className="flex justify-between text-[10px] mt-1">
              <span>Status : <strong className="text-red-600 font-bold uppercase">{data.statusPengerjaan}</strong></span>
              <span></span>
            </div>
            <div className="border-b border-black my-2"></div>
            <div>{data.jenis}{data.merek && data.merek !== '-' ? ` - ${data.merek}` : ''}</div>
            <div className="border-b border-black my-2"></div>
            <div>Admin : AGUS SUNARTO</div>
            <div className="border-b border-black my-2"></div>
            <div className="font-bold">Masalah :</div>
            <div className="whitespace-pre-wrap break-words">{data.keluhan || '-'}</div>
            <div className="border-b border-black my-2"></div>
            <div className="font-bold">Kelengkapan :</div>
            <div className="whitespace-pre-wrap break-words">{data.kelengkapan || '-'}</div>
            <div className="border-b border-black my-2"></div>
            
            {/* Spareparts & Fees Breakdown for Thermal */}
            {((data.items && safeParseItems(data.items).length > 0) || (Number(data.biaya) > 0)) && (
              <>
                <div className="font-bold">Rincian Suku Cadang &amp; Jasa Servis:</div>
                {safeParseItems(data.items).map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[10px] mt-1 pl-1">
                    <span>{item.deskripsi} (x{item.qty})</span>
                    <span>{formatRupiah(item.subtotal)}</span>
                  </div>
                ))}
                {((Number(data.biaya) || 0) - safeParseItems(data.items).reduce((sum, i) => sum + (i.subtotal || 0), 0)) > 0 && (
                  <div className="flex justify-between text-[10px] mt-1 pl-1 font-semibold">
                    <span>Jasa Servis</span>
                    <span>{formatRupiah(Number(data.biaya) - safeParseItems(data.items).reduce((sum, i) => sum + (i.subtotal || 0), 0))}</span>
                  </div>
                )}
                <div className="border-b border-dashed border-black my-1"></div>
              </>
            )}
            
            <div className="text-right font-bold">
              Total Biaya : {data.biaya > 0 ? formatRupiah(data.biaya) : '-'}
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

      <style dangerouslySetInnerHTML={{
        __html: `
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
          .cut-line { visibility: visible !important; }
          .no-print { display: none !important; }
          .print-container .watermark-container {
            transform: translate(-50%, -50%) !important;
          }
          @page { size: ${printMode === 'Thermal' ? '58mm auto' : 'A4 portrait'}; margin: 0 !important; }
        }
      `}} />
    </div>,
    document.body
  );
}
