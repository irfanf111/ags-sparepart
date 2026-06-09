import { generateId, getTodayStr } from './helpers';

export const KATEGORI_OPTIONS = [
  'Sparepart', 'Accessories', 'Unit New', 'Unit Second'
];

export const JENIS_SERVICE_OPTIONS = [
  'LAPTOP', 'NETBOOK', 'PC ALL IN ONE', 'PC DESKTOP', 'PROYEKTOR', 
  'SMARTPHONE', 'PRINTER', 'TELEVISI LED', 'TELEVISI TABUNG'
];

// ==================== SEED DATA ====================
const seedParts = [
  { id: 'p-001', kode: 'HDMI 1.5M',  kategori: 'Accessories',    deskripsi: 'KABEL HDMI SERAT',          harga: 25000,   stok: 2,  keterangan: '' },
  { id: 'p-002', kode: 'KPL3C18',    kategori: 'Accessories',    deskripsi: 'KABEL POWER LAPTOP CENTRO', harga: 25000,   stok: 4,  keterangan: '' },
  { id: 'p-003', kode: 'POWER',      kategori: 'Accessories',    deskripsi: 'KABEL POWER PC',             harga: 25000,   stok: 12, keterangan: '' },
  { id: 'p-004', kode: 'ADP',        kategori: 'Sparepart',      deskripsi: 'ADAPTOR TV + POWER',         harga: 80000,   stok: 0,  keterangan: '' },
  { id: 'p-005', kode: 'ADAPTOR',    kategori: 'Sparepart',      deskripsi: 'ADAPTOR MONITOR',            harga: 90000,   stok: 4,  keterangan: '' },
  { id: 'p-006', kode: '9MM',        kategori: 'Sparepart',      deskripsi: 'HDD CADDY 9MM',              harga: 15000,   stok: 8,  keterangan: '' },
  { id: 'p-007', kode: '12.7MM',     kategori: 'Sparepart',      deskripsi: 'HDD CADDY 12.7MM',           harga: 35000,   stok: 9,  keterangan: '' },
  { id: 'p-008', kode: 'PASTA',      kategori: 'Accessories',    deskripsi: 'PASTA THERMAL',              harga: 40000,   stok: 5,  keterangan: '' },
  { id: 'p-009', kode: 'DDR4 8GB',   kategori: 'Sparepart',      deskripsi: 'RAM LAPTOP DDR4 8GB',        harga: 2500,    stok: 20, keterangan: '' },
  { id: 'p-010', kode: 'DDR3L 8GB',  kategori: 'Sparepart',      deskripsi: 'RAM LAPTOP DDR3L 8GB',       harga: 475000,  stok: 5,  keterangan: '' },
  { id: 'p-011', kode: 'TP LINK',    kategori: 'Accessories',    deskripsi: 'SWITCH HUB TP LINK 10 PORT', harga: 400000,  stok: 7,  keterangan: '' },
  { id: 'p-012', kode: 'DDR4 16GB',  kategori: 'Sparepart',      deskripsi: 'RAM PC DDR4 16GB RGB',       harga: 150000,  stok: 3,  keterangan: '' },
];

const seedNotas = [];

const seedSuppliers = [
  { id: 's-001', namaToko: 'Wepart',                  pemilik: 'Wepart',        telp: '-', whatsapp: '-', facebook: '', tokopedia: '', bukalapak: '', shopee: '', info: '' },
];

const seedCustomers = [];

const seedKeuangan = seedNotas.map(n => ({
  id: `keu-${n.id}`,
  tanggal: n.tanggal,
  tipe: 'Pemasukan',
  kode: n.nomorNota,
  deskripsi: 'Dari Nota Penjualan',
  jumlah: n.total,
}));

// ==================== LOCAL STORAGE FALLBACK ====================
const getLocal = (key, defaultVal) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
};

const setLocal = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {}
};

// ==================== GETTERS ====================
export const getParts = async () => window.electronAPI ? await window.electronAPI.dbCall('parts', 'getAll') : getLocal('ags_parts', []);
export const getNotas = async () => window.electronAPI ? await window.electronAPI.dbCall('notas', 'getAll') : getLocal('ags_notas', []);
export const getSuppliers = async () => window.electronAPI ? await window.electronAPI.dbCall('suppliers', 'getAll') : getLocal('ags_suppliers', []);
export const getKeuangan = async () => window.electronAPI ? await window.electronAPI.dbCall('keuangan', 'getAll') : getLocal('ags_keuangan', []);
export const getServices = async () => window.electronAPI ? await window.electronAPI.dbCall('services', 'getAll') : getLocal('ags_services', []);
export const getSettings = async () => {
  if (window.electronAPI) {
    const data = await window.electronAPI.dbCall('settings', 'getSettings');
    return {
      nama_singkat: 'AGS NOTEBOOK',
      nama_bengkel: 'PT AGS WIJAYA DHANESWARA',
      alamat_bengkel: 'Desa Kunirejo Kulon, RT.002/RW.001, Kecamatan Butuh, Kabupaten Purworejo, Jawa Tengah',
      no_hp_bengkel: '083863333322',
      pesan_kaki_nota: 'Terima kasih telah mempercayakan kendaraan Anda kepada kami!',
      ...data
    };
  }
  return {
    nama_singkat: 'AGS NOTEBOOK',
    nama_bengkel: 'PT AGS WIJAYA DHANESWARA',
    alamat_bengkel: 'Desa Kunirejo Kulon, RT.002/RW.001, Kecamatan Butuh, Kabupaten Purworejo, Jawa Tengah',
    no_hp_bengkel: '083863333322',
    pesan_kaki_nota: 'Terima kasih telah mempercayakan kendaraan Anda kepada kami!',
    ...getLocal('ags_settings', {})
  };
};

export const saveSetting = async (key, value) => {
  if (window.electronAPI) {
    await window.electronAPI.dbCall('settings', 'saveSetting', { key, value });
  } else {
    const current = await getSettings();
    current[key] = value;
    setLocal('ags_settings', current);
  }
};
export const getCustomers = async () => {
  if (window.electronAPI) return await window.electronAPI.dbCall('customers', 'getCustomers');
  const notas = getLocal('ags_notas', []);
  const services = getLocal('ags_services', []);
  
  const custSet = new Set();
  seedCustomers.forEach(c => custSet.add(c));
  notas.forEach(n => {
    if (n.namaCustomer) custSet.add(n.namaCustomer);
  });
  services.forEach(s => {
    if (s.pemilik) custSet.add(s.pemilik);
  });
  
  return Array.from(custSet);
};

// ==================== INITIALIZE DATA ====================
export const initializeData = async () => {
  if (window.electronAPI) {
    // Sync custom settings from SQLite settings table to localStorage
    try {
      const settings = await window.electronAPI.dbCall('settings', 'getSettings') || {};
      if (settings.ags_is_custom_markup !== undefined) {
        localStorage.setItem('ags_is_custom_markup', settings.ags_is_custom_markup);
      }
      if (settings.ags_custom_markup_tiers !== undefined) {
        localStorage.setItem('ags_custom_markup_tiers', settings.ags_custom_markup_tiers);
      }
      if (settings.ags_hidden_keuangan_ids !== undefined) {
        localStorage.setItem('ags_hidden_keuangan_ids', settings.ags_hidden_keuangan_ids);
      }
      if (settings.ags_zoom_level !== undefined) {
        localStorage.setItem('ags_zoom_level', settings.ags_zoom_level);
      }
    } catch (err) {
      console.error('Failed to sync SQLite settings to localStorage:', err);
    }

    const parts = await getParts();
    // If database is empty, check for migration from localStorage
    if (parts.length === 0) {
       const localParts = getLocal('ags_parts', []);
       const localNotas = getLocal('ags_notas', []);
       const localSuppliers = getLocal('ags_suppliers', []);
       const localKeuangan = getLocal('ags_keuangan', []);
       const localServices = getLocal('ags_services', []);

       // If there is significant data in localStorage, migrate it
       if (localParts.length > 0 || localNotas.length > 0 || localServices.length > 0) {
          console.log('Migrating data from localStorage to SQLite...');
          await window.electronAPI.dbCall(null, 'clearAndSeed', { 
            parts: localParts.length > 0 ? localParts : seedParts, 
            notas: localNotas.length > 0 ? localNotas : seedNotas, 
            suppliers: localSuppliers.length > 0 ? localSuppliers : seedSuppliers, 
            keuangan: localKeuangan.length > 0 ? localKeuangan : seedKeuangan, 
            customers: seedCustomers, // Seed customers will be populated from notas anyway
            services: localServices
          });
       } else {
          // No local data, seed with default data
          await window.electronAPI.dbCall(null, 'clearAndSeed', { 
            parts: seedParts, 
            notas: seedNotas, 
            suppliers: seedSuppliers, 
            keuangan: seedKeuangan, 
            customers: seedCustomers,
            services: []
          });
       }
    } else {
       // Database is not empty, check if we need to migrate existing parts' categories to new standard
       let migratedCount = 0;
       for (const p of parts) {
         let newKat = null;
         if (p.kategori === 'Aksesoris' || p.kategori === 'Aksesories') {
           newKat = 'Accessories';
         } else if (p.kategori === 'Part' || p.kategori === 'Komponen') {
           newKat = 'Sparepart';
         } else if (p.kategori === 'Unit / Hardware' || p.kategori === 'Tools' || p.kategori === 'Hardware') {
           newKat = 'Unit New';
         } else if (p.kategori === 'Jasa') {
           newKat = 'Sparepart';
         }
         if (newKat) {
           await updatePart(p.id, { kategori: newKat });
           migratedCount++;
         }
       }
       if (migratedCount > 0) {
         console.log(`Migrating data: updated ${migratedCount} database parts to final categories.`);
       }
    }
  } else {
    if (!localStorage.getItem('ags_parts')) {
      setLocal('ags_parts', seedParts);
    } else {
      // Migrate localStorage
      const localParts = getLocal('ags_parts', []);
      let updated = false;
      const migratedParts = localParts.map(p => {
        let newKat = null;
        if (p.kategori === 'Aksesoris' || p.kategori === 'Aksesories') newKat = 'Accessories';
        else if (p.kategori === 'Part' || p.kategori === 'Komponen') newKat = 'Sparepart';
        else if (p.kategori === 'Unit / Hardware' || p.kategori === 'Tools' || p.kategori === 'Hardware') newKat = 'Unit New';
        else if (p.kategori === 'Jasa') newKat = 'Sparepart';
        
        if (newKat) {
          updated = true;
          return { ...p, kategori: newKat };
        }
        return p;
      });
      if (updated) {
        setLocal('ags_parts', migratedParts);
      }
    }
    if (!localStorage.getItem('ags_notas')) setLocal('ags_notas', seedNotas);
    if (!localStorage.getItem('ags_suppliers')) setLocal('ags_suppliers', seedSuppliers);
    if (!localStorage.getItem('ags_keuangan')) setLocal('ags_keuangan', seedKeuangan);
    if (!localStorage.getItem('ags_services')) setLocal('ags_services', []);
  }
};

export const resetToSeedData = async () => {
  if (window.electronAPI) {
    await window.electronAPI.dbCall(null, 'clearAndSeed', { parts: seedParts, notas: seedNotas, suppliers: seedSuppliers, keuangan: seedKeuangan, customers: seedCustomers });
  } else {
    localStorage.clear();
    setLocal('ags_parts', seedParts);
    setLocal('ags_notas', seedNotas);
    setLocal('ags_suppliers', seedSuppliers);
    setLocal('ags_keuangan', seedKeuangan);
    setLocal('ags_services', []);
  }
};

export const resetTransactions = async () => {
  if (window.electronAPI) {
    await window.electronAPI.dbCall(null, 'resetTransactions');
  } else {
    setLocal('ags_notas', []);
    setLocal('ags_keuangan', []);
    setLocal('ags_services', []);
  }
};

// ==================== PART CRUD ====================
export const addPart = async (part) => {
  const newItem = { ...part, id: generateId() };
  if (window.electronAPI) {
    await window.electronAPI.dbCall('parts', 'insert', newItem);
  } else {
    const data = await getParts();
    setLocal('ags_parts', [...data, newItem]);
  }
  return newItem;
};

export const updatePart = async (id, updates) => {
  if (window.electronAPI) {
    await window.electronAPI.dbCall('parts', 'update', { id, updates });
  } else {
    const data = await getParts();
    setLocal('ags_parts', data.map(p => p.id === id ? { ...p, ...updates } : p));
  }
};

export const deletePart = async (id) => {
  if (window.electronAPI) {
    await window.electronAPI.dbCall('parts', 'delete', id);
  } else {
    const data = await getParts();
    setLocal('ags_parts', data.filter(p => p.id !== id));
  }
};

// ==================== NOTA CRUD ====================
export const addNota = async (nota) => {
  const newNota = { ...nota, id: generateId(), createdAt: nota.tanggal };
  
  if (window.electronAPI) {
    const queries = [];
    queries.push({ table: 'notas', action: 'insert', data: newNota });
    
    const parts = await getParts();
    nota.items.forEach(item => {
      const part = parts.find(p => p.id === item.partId);
      if (part) {
        queries.push({ table: 'parts', action: 'update', id: part.id, data: { stok: Math.max(0, part.stok - item.qty) } });
      }
    });

    queries.push({
      table: 'keuangan', action: 'insert', data: {
        id: `keu-${newNota.id}`,
        tanggal: nota.tanggal,
        tipe: 'Pemasukan',
        kode: nota.nomorNota,
        deskripsi: 'Dari Nota Penjualan',
        jumlah: nota.total,
      }
    });

    if (nota.namaCustomer) {
      queries.push({ table: 'customers', action: 'insertOrIgnore', data: nota.namaCustomer });
    }
    await window.electronAPI.dbCall(null, 'transaction', queries);
  } else {
    const notas = await getNotas();
    setLocal('ags_notas', [...notas, newNota]);

    const parts = await getParts();
    const updatedParts = parts.map(p => {
      const item = nota.items.find(i => i.partId === p.id);
      if (item) return { ...p, stok: Math.max(0, p.stok - item.qty) };
      return p;
    });
    setLocal('ags_parts', updatedParts);

    const keuangan = await getKeuangan();
    setLocal('ags_keuangan', [...keuangan, {
      id: `keu-${newNota.id}`,
      tanggal: nota.tanggal,
      tipe: 'Pemasukan',
      kode: nota.nomorNota,
      deskripsi: 'Dari Nota Penjualan',
      jumlah: nota.total,
    }]);
  }
  return newNota;
};

export const deleteNota = async (id) => {
  if (window.electronAPI) {
    const notas = await getNotas();
    const nota = notas.find(n => n.id === id);
    if (nota) {
      const queries = [
        { table: 'notas', action: 'delete', id: id },
        { table: 'keuangan', action: 'deleteByKode', kode: nota.nomorNota }
      ];
      
      const parts = await getParts();
      nota.items.forEach(item => {
        if (item.partId) {
          const part = parts.find(p => p.id === item.partId);
          if (part) {
            queries.push({ table: 'parts', action: 'update', id: part.id, data: { stok: part.stok + item.qty } });
          }
        }
      });
      
      await window.electronAPI.dbCall(null, 'transaction', queries);
    }
  } else {
    const notas = await getNotas();
    const nota = notas.find(n => n.id === id);
    if (nota) {
      setLocal('ags_notas', notas.filter(n => n.id !== id));
      const keuangan = await getKeuangan();
      setLocal('ags_keuangan', keuangan.filter(k => k.kode !== nota.nomorNota));
      
      const parts = await getParts();
      const updatedParts = parts.map(p => {
        const itemInNota = nota.items.find(i => i.partId === p.id);
        if (itemInNota) {
          return { ...p, stok: p.stok + itemInNota.qty };
        }
        return p;
      });
      setLocal('ags_parts', updatedParts);
    }
  }
};

// ==================== KEUANGAN CRUD ====================
export const addKeuanganItem = async (item) => {
  const newItem = { ...item, id: generateId() };
  if (window.electronAPI) {
    await window.electronAPI.dbCall('keuangan', 'insert', newItem);
  } else {
    const data = await getKeuangan();
    setLocal('ags_keuangan', [...data, newItem]);
  }
  return newItem;
};

export const deleteKeuanganItem = async (id) => {
  if (window.electronAPI) {
    await window.electronAPI.dbCall('keuangan', 'delete', id);
  } else {
    const data = await getKeuangan();
    setLocal('ags_keuangan', data.filter(k => k.id !== id));
  }
};

// ==================== SUPPLIER CRUD ====================
export const addSupplier = async (supplier) => {
  const newItem = { ...supplier, id: generateId() };
  if (window.electronAPI) {
    await window.electronAPI.dbCall('suppliers', 'insert', newItem);
  } else {
    const data = await getSuppliers();
    setLocal('ags_suppliers', [...data, newItem]);
  }
  return newItem;
};

export const updateSupplier = async (id, updates) => {
  if (window.electronAPI) {
    await window.electronAPI.dbCall('suppliers', 'update', { id, updates });
  } else {
    const data = await getSuppliers();
    setLocal('ags_suppliers', data.map(s => s.id === id ? { ...s, ...updates } : s));
  }
};

export const deleteSupplier = async (id) => {
  if (window.electronAPI) {
    await window.electronAPI.dbCall('suppliers', 'delete', id);
  } else {
    const data = await getSuppliers();
    setLocal('ags_suppliers', data.filter(s => s.id !== id));
  }
};

// ==================== SERVICE CRUD ====================
export const addService = async (service) => {
  const all = await getServices();
  const nextNum = all.length > 0 ? Math.max(...all.map(s => parseInt(s.noUrut.replace('AGS', '')) || 0)) + 1 : 1;
  const noUrut = `AGS${String(nextNum).padStart(5, '0')}`;
  const newItem = { 
    ...service, 
    id: generateId(), 
    noUrut, 
    tanggalMasuk: new Date().toISOString().split('T')[0], 
    statusPengerjaan: 'Proses Pengerjaan',
    statusPembayaran: 'Lunas',
    dibayar: 0,
    riwayatCicilan: '[]',
    tanggalAmbil: '',
    items: '[]',
    jasaPasang: 0
  };
  
  if (window.electronAPI) {
    await window.electronAPI.dbCall('services', 'insert', newItem);
  } else {
    setLocal('ags_services', [...all, newItem]);
  }
  return newItem;
};

// Menghubungkan sparepart dari kasir penjualan ke data servisan aktif
export const addPartsToService = async (serviceId, cartItems, jasaPasang) => {
  const allServices = await getServices();
  const service = allServices.find(s => s.id === serviceId);
  if (!service) throw new Error('Service tidak ditemukan');

  let currentItems = [];
  try {
    currentItems = service.items ? (typeof service.items === 'string' ? JSON.parse(service.items) : service.items) : [];
  } catch (e) {
    currentItems = [];
  }

  const updatedItems = [...currentItems];
  cartItems.forEach(cartItem => {
    const existing = updatedItems.find(i => i.partId === cartItem.partId);
    if (existing) {
      existing.qty += cartItem.qty;
      existing.subtotal = existing.qty * existing.harga;
    } else {
      updatedItems.push({ ...cartItem });
    }
  });

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  const newJasaPasang = (service.jasaPasang || 0) + Number(jasaPasang);
  const newBiaya = (service.biaya || 0) + Number(jasaPasang) + cartTotal;

  const updates = {
    items: JSON.stringify(updatedItems),
    jasaPasang: newJasaPasang,
    biaya: newBiaya
  };

  if (service.statusPembayaran === 'Lunas') {
    updates.dibayar = newBiaya;
  } else {
    updates.dibayar = service.dibayar || 0;
  }

  const shouldDeductStock = service.statusPengerjaan === 'Sudah Diambil';

  if (window.electronAPI) {
    const queries = [];
    queries.push({ table: 'services', action: 'update', id: serviceId, data: updates });

    if (shouldDeductStock) {
      const parts = await getParts();
      cartItems.forEach(item => {
        const part = parts.find(p => p.id === item.partId);
        if (part) {
          queries.push({ table: 'parts', action: 'update', id: part.id, data: { stok: Math.max(0, part.stok - item.qty) } });
        }
      });
    }

    await window.electronAPI.dbCall(null, 'transaction', queries);
  } else {
    // LocalStorage Fallback
    const updatedServices = allServices.map(s => s.id === serviceId ? { ...s, ...updates } : s);
    setLocal('ags_services', updatedServices);

    if (shouldDeductStock) {
      const parts = await getParts();
      const updatedParts = parts.map(p => {
        const item = cartItems.find(i => i.partId === p.id);
        if (item) return { ...p, stok: Math.max(0, p.stok - item.qty) };
        return p;
      });
      setLocal('ags_parts', updatedParts);
    }
  }

  return { ...service, ...updates };
};

// Menghapus sparepart terpasang dari data servisan dan mengembalikan stok
export const removePartFromService = async (serviceId, partId) => {
  const allServices = await getServices();
  const service = allServices.find(s => s.id === serviceId);
  if (!service) throw new Error('Service tidak ditemukan');

  let currentItems = [];
  try {
    currentItems = service.items ? (typeof service.items === 'string' ? JSON.parse(service.items) : service.items) : [];
  } catch (e) {
    currentItems = [];
  }

  const targetItem = currentItems.find(i => i.partId === partId);
  if (!targetItem) return service; // No item to remove

  const updatedItems = currentItems.filter(i => i.partId !== partId);
  const itemTotal = targetItem.subtotal || 0;
  const newBiaya = Math.max(0, (service.biaya || 0) - itemTotal);

  const updates = {
    items: JSON.stringify(updatedItems),
    biaya: newBiaya
  };

  if (service.statusPembayaran === 'Lunas') {
    updates.dibayar = newBiaya;
  } else {
    updates.dibayar = Math.min(service.dibayar || 0, newBiaya);
  }

  const shouldRestoreStock = service.statusPengerjaan === 'Sudah Diambil';

  if (window.electronAPI) {
    const queries = [];
    queries.push({ table: 'services', action: 'update', id: serviceId, data: updates });

    if (shouldRestoreStock) {
      const parts = await getParts();
      const part = parts.find(p => p.id === partId);
      if (part) {
        queries.push({ table: 'parts', action: 'update', id: partId, data: { stok: part.stok + targetItem.qty } });
      }
    }

    await window.electronAPI.dbCall(null, 'transaction', queries);
  } else {
    const updatedServices = allServices.map(s => s.id === serviceId ? { ...s, ...updates } : s);
    setLocal('ags_services', updatedServices);

    if (shouldRestoreStock) {
      const parts = await getParts();
      const updatedParts = parts.map(p => {
        if (p.id === partId) return { ...p, stok: p.stok + targetItem.qty };
        return p;
      });
      setLocal('ags_parts', updatedParts);
    }
  }

  return { ...service, ...updates };
};

export const updateService = async (id, updates) => {
  const all = await getServices();
  const service = all.find(s => s.id === id);
  if (!service) return;

  const oldStatus = service.statusPengerjaan;
  const newStatus = updates.statusPengerjaan !== undefined ? updates.statusPengerjaan : oldStatus;

  let itemsList = [];
  try {
    const itemsStr = updates.items !== undefined ? updates.items : service.items;
    itemsList = itemsStr ? (typeof itemsStr === 'string' ? JSON.parse(itemsStr) : itemsStr) : [];
  } catch (e) {
    itemsList = [];
  }

  const isEnteringSudahDiambil = oldStatus !== 'Sudah Diambil' && newStatus === 'Sudah Diambil';
  const isLeavingSudahDiambil = oldStatus === 'Sudah Diambil' && newStatus !== 'Sudah Diambil';

  if (window.electronAPI) {
    const queries = [];
    queries.push({ table: 'services', action: 'update', id, data: updates });

    if (isEnteringSudahDiambil) {
      const parts = await getParts();
      itemsList.forEach(item => {
        const part = parts.find(p => p.id === item.partId);
        if (part) {
          queries.push({ table: 'parts', action: 'update', id: part.id, data: { stok: Math.max(0, part.stok - item.qty) } });
        }
      });
    } else if (isLeavingSudahDiambil) {
      const parts = await getParts();
      itemsList.forEach(item => {
        const part = parts.find(p => p.id === item.partId);
        if (part) {
          queries.push({ table: 'parts', action: 'update', id: part.id, data: { stok: part.stok + item.qty } });
        }
      });
    }

    await window.electronAPI.dbCall(null, 'transaction', queries);
  } else {
    // LocalStorage Fallback
    const updatedServices = all.map(s => s.id === id ? { ...s, ...updates } : s);
    setLocal('ags_services', updatedServices);

    if (isEnteringSudahDiambil) {
      const parts = await getParts();
      const updatedParts = parts.map(p => {
        const item = itemsList.find(i => i.partId === p.id);
        if (item) return { ...p, stok: Math.max(0, p.stok - item.qty) };
        return p;
      });
      setLocal('ags_parts', updatedParts);
    } else if (isLeavingSudahDiambil) {
      const parts = await getParts();
      const updatedParts = parts.map(p => {
        const item = itemsList.find(i => i.partId === p.id);
        if (item) return { ...p, stok: p.stok + item.qty };
        return p;
      });
      setLocal('ags_parts', updatedParts);
    }
  }
};

export const deleteService = async (id) => {
  if (window.electronAPI) {
    await window.electronAPI.dbCall('services', 'delete', id);
  } else {
    const all = await getServices();
    setLocal('ags_services', all.filter(s => s.id !== id));
  }
};
