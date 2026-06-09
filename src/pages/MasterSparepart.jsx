import React, { useState, useMemo } from 'react';
import {
  Plus, Search, Edit2, Trash2, Package, X,
  CheckCircle2, AlertCircle, Save, Tag
} from 'lucide-react';
import { addSparepart, updateSparepart, deleteSparepart, KATEGORI_OPTIONS } from '../utils/storage';
import { formatRupiah, formatTanggalSingkat } from '../utils/helpers';

const EMPTY_FORM = {
  kode: '',
  kategori: 'Oli',
  deskripsi: '',
  hargaJual: '',
  stok: '',
  keterangan: '',
};

const getBadgeColor = (kategori) => {
  const map = {
    Oli: 'badge-blue',
    Filter: 'badge-green',
    Rem: 'badge-red',
    Busi: 'badge-yellow',
    Aki: 'badge-gray',
    Lampu: 'badge-yellow',
    Kelistrikan: 'badge-blue',
    Body: 'badge-green',
  };
  return map[kategori] || 'badge-gray';
};

export default function MasterSparepart({ spareparts, onRefresh }) {
  const [search, setSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = useMemo(() => {
    return spareparts.filter(sp => {
      const matchSearch = !search ||
        sp.deskripsi?.toLowerCase().includes(search.toLowerCase()) ||
        sp.kode?.toLowerCase().includes(search.toLowerCase());
      const matchKategori = !kategoriFilter || sp.kategori === kategoriFilter;
      return matchSearch && matchKategori;
    });
  }, [spareparts, search, kategoriFilter]);

  const openAdd = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      kode: item.kode,
      kategori: item.kategori,
      deskripsi: item.deskripsi,
      hargaJual: String(item.hargaJual),
      stok: String(item.stok),
      keterangan: item.keterangan || '',
    });
    setErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.kode.trim()) e.kode = 'Kode wajib diisi';
    if (!form.deskripsi.trim()) e.deskripsi = 'Deskripsi wajib diisi';
    if (!form.hargaJual || isNaN(form.hargaJual) || Number(form.hargaJual) <= 0) {
      e.hargaJual = 'Harga harus angka positif';
    }
    if (!form.stok || isNaN(form.stok) || Number(form.stok) < 0) {
      e.stok = 'Stok tidak boleh minus';
    }
    // Check duplicate kode
    const duplicate = spareparts.find(
      sp => sp.kode.toLowerCase() === form.kode.toLowerCase() && sp.id !== editItem?.id
    );
    if (duplicate) e.kode = 'Kode sudah digunakan';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    const data = {
      kode: form.kode.trim().toUpperCase(),
      kategori: form.kategori,
      deskripsi: form.deskripsi.trim(),
      hargaJual: Number(form.hargaJual),
      stok: Number(form.stok),
      keterangan: form.keterangan.trim(),
    };

    if (editItem) {
      updateSparepart(editItem.id, data);
      showToast('Sparepart berhasil diperbarui');
    } else {
      addSparepart(data);
      showToast('Sparepart berhasil ditambahkan');
    }

    setShowModal(false);
    onRefresh();
  };

  const handleDelete = (id) => {
    deleteSparepart(id);
    setDeleteConfirm(null);
    showToast('Sparepart berhasil dihapus', 'error');
    onRefresh();
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
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
          <h1 className="page-title">Master Sparepart</h1>
          <p className="page-subtitle">{spareparts.length} jenis part terdaftar</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={16} />
          Tambah Sparepart
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Cari nama atau kode sparepart..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <select
          value={kategoriFilter}
          onChange={e => setKategoriFilter(e.target.value)}
          className="select-field w-auto min-w-36"
        >
          <option value="">Semua Kategori</option>
          {KATEGORI_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        {(search || kategoriFilter) && (
          <button
            onClick={() => { setSearch(''); setKategoriFilter(''); }}
            className="btn-secondary"
          >
            <X size={14} /> Reset
          </button>
        )}
        <span className="text-sm text-slate-500 ml-auto">{filtered.length} data ditemukan</span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <th className="table-header">Kode</th>
                <th className="table-header">Kategori</th>
                <th className="table-header">Deskripsi</th>
                <th className="table-header">Harga Jual</th>
                <th className="table-header">Stok</th>
                <th className="table-header">Keterangan</th>
                <th className="table-header text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <Package size={48} className="mx-auto mb-3 opacity-20" />
                    <p className="font-medium">Tidak ada data ditemukan</p>
                    <p className="text-sm mt-1">Coba ubah filter atau tambah data baru</p>
                  </td>
                </tr>
              ) : (
                filtered.map(sp => (
                  <tr key={sp.id} className="table-row">
                    <td className="table-cell font-mono text-blue-600 text-xs">{sp.kode}</td>
                    <td className="table-cell">
                      <span className={`badge ${getBadgeColor(sp.kategori)}`}>{sp.kategori}</span>
                    </td>
                    <td className="table-cell font-medium text-slate-700">{sp.deskripsi}</td>
                    <td className="table-cell font-semibold text-emerald-600">{formatRupiah(sp.hargaJual)}</td>
                    <td className="table-cell">
                      <span className={`font-bold px-2 py-1 rounded-lg text-sm
                        ${sp.stok === 0
                          ? 'bg-red-100 text-red-600'
                          : sp.stok < 5
                            ? 'bg-amber-100 text-amber-600'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                        {sp.stok}
                      </span>
                    </td>
                    <td className="table-cell text-slate-500 text-xs">{sp.keterangan || '-'}</td>
                    <td className="table-cell">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(sp)}
                          className="p-2 hover:bg-blue-100 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(sp)}
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

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content slide-in">
            <div className="modal-header">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Package size={20} className="text-blue-500" />
                {editItem ? 'Edit Sparepart' : 'Tambah Sparepart'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Kode Part *</label>
                  <input
                    type="text"
                    placeholder="cth: OLI-001"
                    value={form.kode}
                    onChange={e => handleChange('kode', e.target.value)}
                    className={`input-field ${errors.kode ? 'border-red-500' : ''}`}
                  />
                  {errors.kode && <p className="text-red-500 text-xs mt-1">{errors.kode}</p>}
                </div>
                <div>
                  <label className="label">Kategori *</label>
                  <select
                    value={form.kategori}
                    onChange={e => handleChange('kategori', e.target.value)}
                    className="select-field"
                  >
                    {KATEGORI_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Deskripsi / Nama Part *</label>
                <input
                  type="text"
                  placeholder="cth: Oli Mesin Yamalube 1 Liter"
                  value={form.deskripsi}
                  onChange={e => handleChange('deskripsi', e.target.value)}
                  className={`input-field ${errors.deskripsi ? 'border-red-500' : ''}`}
                />
                {errors.deskripsi && <p className="text-red-500 text-xs mt-1">{errors.deskripsi}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Harga Jual (Rp) *</label>
                  <input
                    type="text"
                    placeholder="cth: 55.000"
                    value={form.hargaJual ? form.hargaJual.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ''}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      handleChange('hargaJual', val);
                    }}
                    className={`input-field ${errors.hargaJual ? 'border-red-500' : ''}`}
                  />
                  {form.hargaJual && !isNaN(form.hargaJual) && Number(form.hargaJual) > 0 && (
                    <p className="text-slate-500 text-xs mt-1">= {formatRupiah(Number(form.hargaJual))}</p>
                  )}
                  {errors.hargaJual && <p className="text-red-500 text-xs mt-1">{errors.hargaJual}</p>}
                </div>
                <div>
                  <label className="label">Stok (unit) *</label>
                  <input
                    type="number"
                    placeholder="cth: 20"
                    value={form.stok}
                    onChange={e => handleChange('stok', e.target.value)}
                    className={`input-field ${errors.stok ? 'border-red-500' : ''}`}
                    min="0"
                  />
                  {errors.stok && <p className="text-red-500 text-xs mt-1">{errors.stok}</p>}
                </div>
              </div>
              <div>
                <label className="label">Keterangan (opsional)</label>
                <textarea
                  placeholder="Catatan tambahan tentang sparepart ini..."
                  value={form.keterangan}
                  onChange={e => handleChange('keterangan', e.target.value)}
                  className="input-field resize-none h-20"
                />
              </div>
            </div>
            <div className="p-6 pt-0 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Batal</button>
              <button onClick={handleSave} className="btn-primary">
                <Save size={16} />
                {editItem ? 'Simpan Perubahan' : 'Tambah Sparepart'}
              </button>
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
              <h3 className="text-lg font-semibold text-slate-800">Hapus Sparepart?</h3>
              <p className="text-sm text-slate-500 mt-2">
                <strong className="text-slate-700">{deleteConfirm.deskripsi}</strong> akan dihapus permanen dan tidak dapat dipulihkan.
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
