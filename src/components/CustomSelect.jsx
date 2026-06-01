import React, { useState } from 'react';

const CustomSelect = ({ value, options, onChange, className }) => {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="relative w-full">
      <div 
        className={`${className} flex items-center justify-between cursor-pointer`}
        onClick={() => setOpen(!open)}
      >
        <span className="truncate">{value}</span>
        <svg className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpen(false); }}></div>
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-auto max-h-60 py-1">
            {options.map(opt => (
              <div 
                key={opt}
                className={`px-4 py-2.5 hover:bg-orange-50 cursor-pointer text-sm ${value === opt ? 'font-bold text-orange-600 bg-orange-50/50' : 'text-slate-700'}`}
                onClick={(e) => { e.stopPropagation(); onChange(opt); setOpen(false); }}
              >
                {opt}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CustomSelect;
