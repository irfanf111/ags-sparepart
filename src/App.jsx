import React, { useState, useEffect, useCallback } from 'react';
import {
  Package, ShoppingCart, BarChart2, BookOpen,
  Users, Menu, X, Wrench, ChevronRight, Bell, PlusCircle, ClipboardList, Home, Settings,
  ZoomIn, ZoomOut, Calculator
} from 'lucide-react';
import KalkulatorMarkup from './components/KalkulatorMarkup';
import { initializeData, getParts, getNotas, getSuppliers, getKeuangan, getServices } from './utils/storage';
import { getTodayStr, APP_VERSION } from './utils/helpers';
import Dashboard from './pages/Dashboard';
import DatabasePart from './pages/DatabasePart';
import TransaksiPenjualan from './pages/TransaksiPenjualan';
import LaporanPenjualan from './pages/LaporanPenjualan';
import CatatanKeuangan from './pages/CatatanKeuangan';
import DataSupplier from './pages/DataSupplier';
import DataServisan from './pages/DataServisan';
import InputServisan from './pages/InputServisan';
import Pengaturan from './pages/Pengaturan';
import BukuHutang from './pages/BukuHutang';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, bgClass: 'bg-[#00f7b0] hover:bg-[#00d89a]', textClass: 'text-black' },
  { id: 'input_servisan', label: 'Input Servisan', icon: PlusCircle, bgClass: 'bg-[#00f7b0] hover:bg-[#00d89a]', textClass: 'text-black' },
  { id: 'data_servisan', label: 'Data Servisan', icon: ClipboardList, bgClass: 'bg-[#00f7b0] hover:bg-[#00d89a]', textClass: 'text-black' },
  { id: 'database', label: 'Master Barang', icon: Package, bgClass: 'bg-orange-500 hover:bg-orange-600', textClass: 'text-black' },
  { id: 'transaksi', label: 'Kasir Penjualan', icon: ShoppingCart, bgClass: 'bg-orange-500 hover:bg-orange-600', textClass: 'text-black' },
  { id: 'laporan', label: 'Data Transaksi', icon: BarChart2, bgClass: 'bg-orange-500 hover:bg-orange-600', textClass: 'text-black' },
  { id: 'supplier', label: 'Mitra & Kerjasama', icon: Users, bgClass: 'bg-orange-500 hover:bg-orange-600', textClass: 'text-black' },
  { id: 'keuangan', label: 'Catatan Keuangan', icon: BookOpen, bgClass: 'bg-[#00f7b0] hover:bg-[#00d89a]', textClass: 'text-black' },
  { id: 'buku_hutang', label: 'Buku Hutang / Cicilan', icon: BookOpen, bgClass: 'bg-[#00f7b0] hover:bg-[#00d89a]', textClass: 'text-black' },
  { id: 'pengaturan', label: 'Pengaturan Toko', icon: Settings, bgClass: 'bg-slate-700 hover:bg-slate-600', textClass: 'text-white' },
];

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isKalkulatorOpen, setIsKalkulatorOpen] = useState(false);

  const [parts, setParts] = useState([]);
  const [notas, setNotas] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [keuangan, setKeuangan] = useState([]);
  const [services, setServices] = useState([]);

  // Tampilan Zoom scale level yang disimpan di localStorage
  const [zoomLevel, setZoomLevel] = useState(() => {
    const saved = localStorage.getItem('ags_zoom_level');
    return saved ? parseFloat(saved) : 1.0;
  });

  useEffect(() => {
    if (window.electronAPI && typeof window.electronAPI.setZoomFactor === 'function') {
      window.electronAPI.setZoomFactor(zoomLevel);
      document.body.style.zoom = 'normal'; // Clear CSS zoom to prevent double scale
    } else {
      document.body.style.zoom = zoomLevel;
    }
    localStorage.setItem('ags_zoom_level', zoomLevel.toString());
  }, [zoomLevel]);

  // Listener keyboard shortcut untuk zoom (Ctrl/Cmd + '+', '-', '0')
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          setZoomLevel(prev => Math.min(prev + 0.05, 1.5));
        } else if (e.key === '-') {
          e.preventDefault();
          setZoomLevel(prev => Math.max(prev - 0.05, 0.5));
        } else if (e.key === '0') {
          e.preventDefault();
          setZoomLevel(1.0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const init = async () => {
      await initializeData();
      await refreshData();
    };
    init();
  }, []);

  const refreshData = useCallback(async () => {
    setParts(await getParts() || []);
    setNotas(await getNotas() || []);
    setSuppliers(await getSuppliers() || []);
    setKeuangan(await getKeuangan() || []);
    setServices(await getServices() || []);
  }, []);

  const today = getTodayStr();
  const stokHabis = parts.filter(p => p.stok === 0).length;
  const stokMenipis = parts.filter(p => p.stok > 0 && p.stok < 5).length;
  const transaksiHariIni = notas.filter(n => n.tanggal === today).length;

  const navigate = (page) => {
    setActivePage(page);
    setSidebarOpen(false);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard spareparts={parts} notas={notas} services={services} />;
      case 'input_servisan': return <InputServisan onRefresh={refreshData} navigate={navigate} />;
      case 'data_servisan': return <DataServisan onRefresh={refreshData} />;
      case 'database': return <DatabasePart parts={parts} onRefresh={refreshData} />;
      case 'transaksi': return <TransaksiPenjualan parts={parts} notas={notas} onRefresh={refreshData} />;
      case 'laporan': return <LaporanPenjualan notas={notas} services={services} parts={parts} onRefresh={refreshData} />;
      case 'keuangan': return <CatatanKeuangan keuangan={keuangan} services={services} onRefresh={refreshData} />;
      case 'buku_hutang': return <BukuHutang onRefresh={refreshData} />;
      case 'supplier': return <DataSupplier suppliers={suppliers} onRefresh={refreshData} />;
      case 'pengaturan': return <Pengaturan onRefresh={refreshData} />;
      default: return <Dashboard spareparts={parts} notas={notas} services={services} />;
    }
  };

  const activeNav = NAV_ITEMS.find(n => n.id === activePage);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 flex flex-col bg-slate-900 border-r border-slate-700/50 sidebar-transition ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              <img
                src="logo.png"
                alt="Logo AGS"
                className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]"
              />
            </div>
            <div className="flex flex-col justify-center leading-none">
              <h1 className="text-base font-black text-slate-100 tracking-tight leading-none">PT AGS WIJAYA</h1>
              <p className="text-[11px] text-orange-400 font-black tracking-[0.22em] leading-none mt-1">DHANESWARA</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="px-3 pt-3 space-y-2">
          {stokHabis > 0 && (
            <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
              <Bell size={13} className="text-red-400 shrink-0" />
              <p className="text-xs text-red-300"><strong>{stokHabis}</strong> part stok habis!</p>
            </div>
          )}
          {stokMenipis > 0 && (
            <div className="px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2">
              <Bell size={13} className="text-amber-400 shrink-0" />
              <p className="text-xs text-amber-300"><strong>{stokMenipis}</strong> part stok menipis</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-2 overflow-y-auto mt-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id && item.id !== 'input_servisan';

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2 border-2 ${isActive ? 'border-white brightness-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-transparent shadow-[inset_1px_1px_0_rgba(255,255,255,0.3),_inset_-1px_-1px_0_rgba(0,0,0,0.5)]'} ${item.bgClass} ${item.textClass} font-bold transition-all`}
              >
                <Icon size={16} />
                <span className="flex-1 text-[13px] tracking-wide">{item.label}</span>
                {isActive && <ChevronRight size={13} />}
                {item.id === 'transaksi' && transaksiHariIni > 0 && !isActive && (
                  <span className="w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-bold shadow-sm">
                    {transaksiHariIni}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700/50">
          <div className="bg-gradient-to-r from-orange-900/20 to-slate-800 rounded-xl p-3 border border-orange-800/20 text-center">
            <p className="text-xs font-bold text-orange-400 mb-0">Admin: AGUS SUNARTO</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-200 shadow-sm flex items-center px-4 gap-4 shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 hover:bg-slate-700 rounded-lg text-slate-400">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400 hidden sm:block">PT AGS Wijaya Dhaneswara</span>
            <ChevronRight size={14} className="text-slate-600 hidden sm:block" />
            <span className="font-semibold text-slate-700">{activeNav?.label}</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {/* Kalkulator Markup Trigger */}
            <button 
              onClick={() => setIsKalkulatorOpen(true)}
              title="Buka Kalkulator Markup"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <Calculator size={13} className="stroke-[2.5]" />
              Kalkulator Markup
            </button>
            {/* Sleek Premium Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-100/80 hover:bg-slate-100 rounded-xl p-1 border border-slate-200/60 shadow-sm transition-all duration-300">
              <button 
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.05, 0.5))}
                title="Perkecil Tampilan (Ctrl + -)"
                className="p-1.5 text-slate-500 hover:text-orange-500 hover:bg-white rounded-lg transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <ZoomOut size={14} className="stroke-[2.5]" />
              </button>
              
              <button 
                onClick={() => setZoomLevel(1.0)}
                title="Reset ke Semula (Ctrl + 0)"
                className="px-2 py-1 text-[11px] font-bold text-slate-600 hover:text-orange-500 hover:bg-white rounded-lg transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              
              <button 
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.05, 1.5))}
                title="Perbesar Tampilan (Ctrl + +)"
                className="p-1.5 text-slate-500 hover:text-orange-500 hover:bg-white rounded-lg transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <ZoomIn size={14} className="stroke-[2.5]" />
              </button>
            </div>

            {(stokHabis > 0 || stokMenipis > 0) && (
              <button onClick={() => navigate('database')} className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg text-xs font-medium transition-colors">
                <Bell size={13} />
                {stokHabis + stokMenipis} peringatan stok
              </button>
            )}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-xs font-bold">A</div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-50">
          {renderPage()}
        </main>
      </div>
      <KalkulatorMarkup isOpen={isKalkulatorOpen} onClose={() => setIsKalkulatorOpen(false)} />
    </div>
  );
}
