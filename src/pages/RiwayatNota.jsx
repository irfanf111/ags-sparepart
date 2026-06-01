import React, { useState, useMemo } from 'react';
import {
  FileText, Search, Eye, Trash2, X, Calendar,
  ChevronDown, AlertCircle, CheckCircle2, Download, Package
} from 'lucide-react';
import { deleteNota } from '../utils/storage';
import { formatRupiah, formatTanggal, formatTanggalSingkat, filterByDateRange } from '../utils/helpers';

export default function RiwayatNota({ notas, onRefresh }) {
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewNota, setViewNota] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = useMemo(() => {
    let result = [...notas].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    if (search) {
      result = result.filter(n =>
        n.nomorNota?.toLowerCase().includes(search.toLowerCase()) ||
        n.namaPembeli?.toLowerCase().includes(search.toLowerCase()) ||
        n.namaAdmin?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (startDate || endDate) {
      result = filterByDateRange(result, startDate, endDate, 'tanggal');
    }
    return result;
  }, [notas, search, startDate, endDate]);

  const totalFiltered = useMemo(() => filtered.reduce((sum, n) => sum + n.total, 0), [filtered]);

  const handleDelete = async (id) => {
    await deleteNota(id);
    setDeleteConfirm(null);
    if (viewNota?.id === id) setViewNota(null);
    showToast('Nota berhasil dihapus', 'error');
    if (onRefresh) await onRefresh();
  };

  const resetFilter = () => {
    setSearch('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="fade-in-up space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-sm font-medium slide-in
          ${toast.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Riwayat Nota</h1>
          <p className="page-subtitle">{notas.length} total nota tersimpan</p>
        </div>
      </div>

      {/* Filter */}
      <div className="card p-4 flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Cari no. nota, nama pelanggan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <div>
          <label className="label text-xs">Dari Tanggal</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="label text-xs">Sampai Tanggal</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="input-field"
          />
        </div>
        {(search || startDate || endDate) && (
          <button onClick={resetFilter} className="btn-secondary">
            <X size={14} /> Reset
          </button>
        )}
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-slate-800">{filtered.length}</p>
          <p className="text-xs text-slate-500 mt-1">Nota Ditemukan</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{formatRupiah(totalFiltered)}</p>
          <p className="text-xs text-slate-500 mt-1">Total Pemasukan</p>
        </div>
        <div className="card p-4 text-center hidden sm:block">
          <p className="text-2xl font-bold text-blue-600">
            {filtered.reduce((s, n) => s + n.items.reduce((ss, i) => ss + i.qty, 0), 0)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Total Item Terjual</p>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <th className="table-header">No. Nota</th>
                <th className="table-header">Tanggal</th>
                <th className="table-header">Pelanggan</th>
                <th className="table-header">Admin</th>
                <th className="table-header">Item</th>
                <th className="table-header">Total</th>
                <th className="table-header text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <FileText size={48} className="mx-auto mb-3 opacity-20" />
                    <p className="font-medium">Tidak ada nota ditemukan</p>
                    <p className="text-sm mt-1">Coba ubah filter pencarian</p>
                  </td>
                </tr>
              ) : (
                filtered.map(nota => (
                  <tr key={nota.id} className="table-row">
                    <td className="table-cell">
                      <span className="font-mono text-blue-600 text-xs">{nota.nomorNota}</span>
                    </td>
                    <td className="table-cell text-slate-600">{formatTanggalSingkat(nota.tanggal)}</td>
                    <td className="table-cell font-medium text-slate-700">{nota.namaPembeli}</td>
                    <td className="table-cell text-slate-600">{nota.namaAdmin}</td>
                    <td className="table-cell">
                      <span className="badge badge-blue">{nota.items.length} item</span>
                    </td>
                    <td className="table-cell">
                      <span className="font-semibold text-emerald-600">{formatRupiah(nota.total)}</span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setViewNota(nota)}
                          className="p-2 hover:bg-blue-100 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(nota)}
                          className="p-2 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {viewNota && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setViewNota(null)}>
          <div className="modal-content slide-in max-w-2xl">
            {/* Modal Header */}
            <div className="modal-header bg-gradient-to-r from-blue-50 to-white border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-800">{viewNota.nomorNota}</h2>
                <p className="text-sm text-slate-500">{formatTanggal(viewNota.tanggal)}</p>
              </div>
              <button onClick={() => setViewNota(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Pelanggan</p>
                  <p className="font-semibold text-slate-700">{viewNota.namaPembeli}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Admin / Kasir</p>
                  <p className="font-semibold text-slate-700">{viewNota.namaAdmin}</p>
                </div>
                {viewNota.keterangan && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Keterangan</p>
                    <p className="text-slate-700 text-sm">{viewNota.keterangan}</p>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Detail Item</p>
                <div className="bg-white rounded-xl overflow-hidden border border-slate-200">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="table-header">Sparepart</th>
                        <th className="table-header text-center">Qty</th>
                        <th className="table-header text-right">Harga</th>
                        <th className="table-header text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewNota.items.map((item, i) => (
                        <tr key={i} className="table-row">
                          <td className="table-cell">
                            <div>{item.deskripsi}</div>
                            {item.keterangan && <div className="text-[10px] text-slate-500 italic">({item.keterangan})</div>}
                          </td>
                          <td className="table-cell text-center">{item.qty}</td>
                          <td className="table-cell text-right">{formatRupiah(item.harga)}</td>
                          <td className="table-cell text-right font-semibold text-emerald-600">{formatRupiah(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-200 bg-slate-50">
                        <td colSpan={3} className="table-cell font-semibold text-right text-slate-700">TOTAL</td>
                        <td className="table-cell text-right font-bold text-emerald-600 text-lg">{formatRupiah(viewNota.total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Footer Note */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-wrap justify-between items-center gap-2">
                <div>
                  <p className="text-xs text-slate-500">1. Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan</p>
                  <p className="text-xs text-slate-500 mt-1">2. Terima kasih atas kunjungan anda</p>
                </div>
                <div className="text-right select-all select-none">
                  <p className="text-[10px] text-gray-500 font-mono bg-white border border-gray-200 px-2 py-1 rounded shadow-sm flex items-center gap-1">
                    <span>🔒 AGS SECURE VERIFIED:</span>
                    <span className="font-bold text-slate-800">
                      {btoa(viewNota.nomorNota + '|' + viewNota.total).substring(0, 16).toUpperCase()}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteConfirm(null)}>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-sm p-6 slide-in">
            <div className="text-center mb-6">
              <div className="p-4 bg-red-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={28} className="text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Hapus Nota?</h3>
              <p className="text-sm text-slate-500 mt-2">
                Nota <strong className="text-slate-700">{deleteConfirm.nomorNota}</strong> akan dihapus permanen.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1 justify-center">Batal</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} className="btn-danger flex-1 justify-center">
                <Trash2 size={15} /> Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
