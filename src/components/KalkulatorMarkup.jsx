import React, { useState, useEffect } from 'react';
import { X, Calculator, RotateCcw, Check } from 'lucide-react';
import { formatRupiah } from '../utils/helpers';

const DEFAULT_TIERS = [
  { min: 0, max: 10000, label: '0 - 10rb', value: 150 },
  { min: 10000, max: 50000, label: '10rb - 50rb', value: 100 },
  { min: 50000, max: 100000, label: '50rb - 100rb', value: 40 },
  { min: 100000, max: 300000, label: '100rb - 300rb', value: 35 },
  { min: 300000, max: 500000, label: '300rb - 500rb', value: 30 },
  { min: 500000, max: 1000000, label: '500rb - 1jt', value: 25 },
  { min: 1000000, max: 10000000, label: '1jt - 10jt', value: 15 },
  { min: 10000000, max: Infinity, label: '10jt - ∞', value: 10 },
];

export default function KalkulatorMarkup({ isOpen, onClose, onApply }) {
  // Inputs
  const [hargaPart, setHargaPart] = useState(0);
  const [ongkir, setOngkir] = useState(0);
  const [biayaJasa, setBiayaJasa] = useState(0);

  // Scheme
  const [isCustomScheme, setIsCustomScheme] = useState(() => {
    const saved = localStorage.getItem('ags_is_custom_markup');
    return saved === 'true';
  });

  // Tiers
  const [tiers, setTiers] = useState(() => {
    const saved = localStorage.getItem('ags_custom_markup_tiers');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse custom tiers", e);
      }
    }
    return JSON.parse(JSON.stringify(DEFAULT_TIERS));
  });

  // Temporary editing tiers (to only apply when "Terapkan Custom" is clicked)
  const [tempTiers, setTempTiers] = useState(() => JSON.parse(JSON.stringify(tiers)));

  // Sync temp tiers when tiers changes
  useEffect(() => {
    setTempTiers(JSON.parse(JSON.stringify(tiers)));
  }, [tiers]);

  // Persist scheme
  useEffect(() => {
    localStorage.setItem('ags_is_custom_markup', isCustomScheme.toString());
  }, [isCustomScheme]);

  if (!isOpen) return null;

  // Find percentage based on Modal Masuk (hargaPart + ongkir)
  const modalMasuk = Number(hargaPart) + Number(ongkir);

  // Determine which tiers list to use
  const activeTiers = isCustomScheme ? tiers : DEFAULT_TIERS;

  // Find markup percentage
  const getMarkupPercent = (val) => {
    const matchedTier = activeTiers.find(t => val > t.min && val <= t.max) || 
                       activeTiers.find(t => val === 0 && t.min === 0) ||
                       activeTiers[0]; // fallback
    return matchedTier ? matchedTier.value : 0;
  };

  const markupPercent = getMarkupPercent(modalMasuk);
  const profitPart = Math.round(modalMasuk * (markupPercent / 100));
  const hargaJualPart = modalMasuk + profitPart;
  const totalCustomer = hargaJualPart + Number(biayaJasa);

  // Actions
  const handleTempTierChange = (index, val) => {
    const updated = [...tempTiers];
    updated[index].value = parseInt(val) || 0;
    setTempTiers(updated);
  };

  const handleApplyCustom = () => {
    setTiers(tempTiers);
    localStorage.setItem('ags_custom_markup_tiers', JSON.stringify(tempTiers));
  };

  const handleResetToDefault = () => {
    const defaults = JSON.parse(JSON.stringify(DEFAULT_TIERS));
    setTiers(defaults);
    setTempTiers(defaults);
    localStorage.setItem('ags_custom_markup_tiers', JSON.stringify(defaults));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200/80 rounded-3xl w-full max-w-[700px] overflow-hidden shadow-2xl p-6 text-slate-800 flex flex-col my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 tracking-wide flex items-center gap-2">
            <Calculator className="text-orange-500 stroke-[2.5]" size={20} />
            Kalkulator Markup
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 space-y-5 pt-4 overflow-y-auto max-h-[70vh] pr-1 scrollbar-custom">
          
          {/* Main Inputs Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Harga Part
              </label>
              <input 
                type="number" 
                className="input-field py-2.5 text-sm bg-slate-50/50 border border-slate-200 text-slate-800 font-semibold focus:bg-white" 
                placeholder="0"
                value={hargaPart || ''} 
                onChange={e => setHargaPart(parseFloat(e.target.value) || 0)} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Ongkir
              </label>
              <input 
                type="number" 
                className="input-field py-2.5 text-sm bg-slate-50/50 border border-slate-200 text-slate-800 font-semibold focus:bg-white" 
                placeholder="0"
                value={ongkir || ''} 
                onChange={e => setOngkir(parseFloat(e.target.value) || 0)} 
              />
            </div>
          </div>

          {/* Main Inputs Row 2 (Biaya Jasa) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Biaya Jasa
              </label>
              <input 
                type="number" 
                className="input-field py-2.5 text-sm bg-slate-50/50 border border-slate-200 text-slate-800 font-semibold focus:bg-white" 
                placeholder="0"
                value={biayaJasa || ''} 
                onChange={e => setBiayaJasa(parseFloat(e.target.value) || 0)} 
              />
            </div>
          </div>

          {/* Skema Markup Switch */}
          <div className="flex items-center gap-3 py-1">
            <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Skema Markup:</span>
            
            {/* Toggle Switch */}
            <button 
              onClick={() => setIsCustomScheme(!isCustomScheme)}
              className={`w-12 h-6.5 rounded-full p-0.5 transition-colors duration-300 relative focus:outline-none flex items-center ${isCustomScheme ? 'bg-orange-500' : 'bg-slate-200'}`}
            >
              <span 
                className={`w-5.5 h-5.5 bg-white rounded-full transition-transform duration-300 shadow-md ${isCustomScheme ? 'translate-x-5.5' : 'translate-x-0.5'}`} 
              />
            </button>

            {/* Scheme Status Badge */}
            {isCustomScheme ? (
              <span className="badge bg-orange-50 text-orange-600 border-orange-200 px-3 py-1 rounded-full text-xs font-bold transition duration-300">
                Custom (Diubah)
              </span>
            ) : (
              <span className="badge bg-slate-100 text-slate-600 border-slate-200 px-3 py-1 rounded-full text-xs font-bold transition duration-300">
                Standar (Bawaan)
              </span>
            )}
          </div>

          {/* CUSTOM TIER MARKUP SECTION */}
          {isCustomScheme && (
            <div className="bg-slate-50/70 border border-slate-200/50 rounded-2xl p-5 space-y-4 fade-in-up">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                Custom Tier Markup
              </h3>
              
              {/* Tiers Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {tempTiers.map((tier, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 border-b border-slate-200/50">
                    <span className="text-xs text-slate-600 font-bold">{tier.label}</span>
                    <div className="flex items-center gap-1.5">
                      <input 
                        type="number" 
                        className="bg-white border border-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 rounded-xl px-3 py-1.5 text-xs text-center text-slate-800 w-20 font-bold outline-none transition" 
                        value={tier.value}
                        onChange={e => handleTempTierChange(idx, e.target.value)}
                      />
                      <span className="text-xs text-slate-500 font-semibold">%</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons inside Tiers */}
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={handleApplyCustom}
                  className="btn-primary px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-[0_4px_10px_0_rgba(249,115,22,0.2)] active:scale-95 transition-all"
                >
                  <Check size={14} className="stroke-[3]" />
                  Terapkan Custom
                </button>
                <button 
                  onClick={handleResetToDefault}
                  className="btn-secondary px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                >
                  <RotateCcw size={14} />
                  Reset ke Default
                </button>
              </div>
            </div>
          )}

          {/* CALCULATED OUTPUT LIST */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-3.5 shadow-sm">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Persentase Markup:</span>
              <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{markupPercent}%</span>
            </div>
            
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Modal Masuk:</span>
              <span className="text-sm font-bold text-slate-700">{formatRupiah(modalMasuk)}</span>
            </div>
            
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Profit Part:</span>
              <span className="text-sm font-bold text-slate-700">{formatRupiah(profitPart)}</span>
            </div>
            
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Harga Jual Part:</span>
              <span className="text-sm font-bold text-slate-700">{formatRupiah(hargaJualPart)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-800 uppercase tracking-wider">Total Customer:</span>
              <span className="text-lg font-black text-emerald-600">{formatRupiah(totalCustomer)}</span>
            </div>
          </div>

          {/* App Branded Footer */}
          <div className="text-center text-[10px] text-slate-400 mt-2 font-medium tracking-wide">
            © 2026 · PT AGS Wijaya Dhaneswara · Manajemen Service
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex justify-between gap-2 pt-4 mt-2 border-t border-slate-100">
          {onApply && (
            <button
              onClick={() => { onApply(totalCustomer); onClose(); }}
              className="btn-primary px-6 py-2 rounded-xl text-sm transition-all cursor-pointer active:scale-95 flex items-center gap-2"
            >
              <Check size={14} className="stroke-[3]" /> Terapkan ke Biaya Servis
            </button>
          )}
          <button 
            onClick={onClose} 
            className="btn-secondary px-6 py-2 rounded-xl text-sm transition-all cursor-pointer active:scale-95 ml-auto"
          >
            Tutup
          </button>
        </div>

      </div>
      
      {/* Scrollbar Custom styling injection */}
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-custom::-webkit-scrollbar {
          width: 5px;
        }
        .scrollbar-custom::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 99px;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}} />
    </div>
  );
}
