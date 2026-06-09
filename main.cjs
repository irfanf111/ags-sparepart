const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const initSqlJs = require('sql.js');
const fs = require('fs');

let db;
let dbPath;

async function initDB() {
  const SQL = await initSqlJs({
    // Use a more robust way to find the wasm file
    locateFile: file => {
      const wasmPath = path.join(__dirname, 'node_modules', 'sql.js', 'dist', file);
      if (fs.existsSync(wasmPath)) return wasmPath;
      // Fallback for packaged app
      return path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'sql.js', 'dist', file);
    }
  });

  const dbDir = path.join(app.getPath('userData'), 'database');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  dbPath = path.join(dbDir, 'ags_service.db');

  if (fs.existsSync(dbPath)) {
    try {
      const filebuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(filebuffer);
    } catch (err) {
      console.error('Error loading database file:', err);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS spareparts (
      id TEXT PRIMARY KEY,
      kode TEXT,
      kategori TEXT,
      deskripsi TEXT,
      harga INTEGER,
      stok INTEGER,
      keterangan TEXT,
      tanggalMasuk TEXT
    );
    CREATE TABLE IF NOT EXISTS notas (
      id TEXT PRIMARY KEY,
      nomorNota TEXT,
      tanggal TEXT,
      waktu TEXT,
      namaCustomer TEXT,
      namaAdmin TEXT,
      keterangan TEXT,
      items TEXT,
      total INTEGER,
      createdAt TEXT
    );
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      namaToko TEXT,
      pemilik TEXT,
      telp TEXT,
      whatsapp TEXT,
      facebook TEXT,
      tokopedia TEXT,
      bukalapak TEXT,
      shopee TEXT,
      tipeKemitraan TEXT,
      status TEXT,
      kontrak TEXT,
      info TEXT
    );
    CREATE TABLE IF NOT EXISTS keuangan (
      id TEXT PRIMARY KEY,
      tanggal TEXT,
      tipe TEXT,
      kode TEXT,
      deskripsi TEXT,
      jumlah INTEGER
    );
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      noUrut TEXT,
      tanggalMasuk TEXT,
      pemilik TEXT,
      noHp TEXT,
      jenis TEXT,
      merek TEXT,
      serialNumber TEXT,
      kelengkapan TEXT,
      keluhan TEXT,
      statusPengerjaan TEXT,
      statusPembayaran TEXT,
      biaya INTEGER,
      dibayar INTEGER,
      riwayatCicilan TEXT,
      catatanTeknisi TEXT,
      tanggalAmbil TEXT,
      items TEXT,
      jasaPasang INTEGER
    );
    CREATE TABLE IF NOT EXISTS customers (
      name TEXT PRIMARY KEY
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
    INSERT OR IGNORE INTO settings (key, value) VALUES ('nama_singkat', 'AGS NOTEBOOK');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('nama_bengkel', 'PT AGS WIJAYA DHANESWARA');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('alamat_bengkel', 'Jl. Dhaneswara');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('no_hp_bengkel', '0812-3456-7890');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('pesan_kaki_nota', 'Terima kasih telah mempercayakan kendaraan Anda kepada kami!');
  `);

  // Migration: Ensure latest columns exist for existing databases
  runMigrations(db);
  saveDb();
}

function runMigrations(dbInstance) {
  const migrations = [
    "ALTER TABLE spareparts ADD COLUMN tanggalMasuk TEXT;",
    "ALTER TABLE services ADD COLUMN serialNumber TEXT;",
    "ALTER TABLE services ADD COLUMN noHp TEXT;",
    "ALTER TABLE services ADD COLUMN dibayar INTEGER;",
    "ALTER TABLE services ADD COLUMN riwayatCicilan TEXT;",
    "ALTER TABLE services ADD COLUMN tanggalAmbil TEXT;",
    "ALTER TABLE services ADD COLUMN items TEXT;",
    "ALTER TABLE services ADD COLUMN jasaPasang INTEGER;",
    "ALTER TABLE suppliers ADD COLUMN tipeKemitraan TEXT;",
    "ALTER TABLE suppliers ADD COLUMN status TEXT;",
    "ALTER TABLE suppliers ADD COLUMN kontrak TEXT;"
  ];
  for (const query of migrations) {
    try {
      dbInstance.run(query);
    } catch (e) {
      // ignore duplicate column errors
    }
  }
}

function saveDb() {
  if (!db || !dbPath) return;
  try {
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  } catch (err) {
    console.error('Failed to save database:', err);
  }
}

function getAllRows(query, params = []) {
  const stmt = db.prepare(query);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// IPC Handlers for database operations
ipcMain.handle('db-call', async (event, { table, action, data, id }) => {
  try {
    if (!db) await initDB();

    // Map frontend 'parts' to database 'spareparts'
    const actualTable = table === 'parts' ? 'spareparts' : table;

    if (action === 'getAll') {
      const rows = getAllRows(`SELECT * FROM ${actualTable}`);
      if (actualTable === 'notas') {
        return rows.map(r => {
          try {
            return { ...r, items: JSON.parse(r.items) };
          } catch (e) {
            return { ...r, items: [] };
          }
        });
      }
      return rows;
    }
    
    if (action === 'getSettings') {
      const rows = getAllRows('SELECT * FROM settings');
      const settingsMap = {};
      rows.forEach(r => {
        settingsMap[r.key] = r.value;
      });
      return settingsMap;
    }

    if (action === 'saveSetting') {
      db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [data.key, data.value]);
      saveDb();
      return { success: true };
    }
    
    if (action === 'getCustomers') {
      const rows = getAllRows('SELECT name FROM customers');
      return rows.map(r => r.name);
    }

    if (action === 'insert') {
      const keys = Object.keys(data);
      let values = Object.values(data);
      
      if (actualTable === 'notas' && data.items) {
        values = values.map(v => Array.isArray(v) ? JSON.stringify(v) : v);
      }

      const placeholders = keys.map(() => '?').join(',');
      db.run(`INSERT INTO ${actualTable} (${keys.join(',')}) VALUES (${placeholders})`, values);
      saveDb();
      return { success: true };
    }

    if (action === 'update') {
      // Handle both {id, updates} and direct data as updates
      const targetId = id || data.id;
      const updates = data.updates || data;
      
      const keys = Object.keys(updates).filter(k => k !== 'id');
      let values = keys.map(k => updates[k]);
      
      if (actualTable === 'notas' && updates.items) {
        values = values.map(v => Array.isArray(v) ? JSON.stringify(v) : v);
      }

      const setString = keys.map(k => `${k} = ?`).join(', ');
      db.run(`UPDATE ${actualTable} SET ${setString} WHERE id = ?`, [...values, targetId]);
      saveDb();
      return { success: true };
    }

    if (action === 'delete') {
      const targetId = id || data;
      db.run(`DELETE FROM ${actualTable} WHERE id = ?`, [targetId]);
      saveDb();
      return { success: true };
    }
    
    if (action === 'deleteByKode') {
      db.run(`DELETE FROM ${actualTable} WHERE kode = ?`, [data.kode]);
      saveDb();
      return { success: true };
    }

    if (action === 'insertOrIgnore') {
      db.run(`INSERT OR IGNORE INTO ${actualTable} (name) VALUES (?)`, [data]);
      saveDb();
      return { success: true };
    }

    if (action === 'transaction') {
      db.run("BEGIN TRANSACTION;");
      try {
        for (const q of data) {
          const actualQTable = q.table === 'parts' ? 'spareparts' : q.table;
          if (q.action === 'insert') {
            const keys = Object.keys(q.data);
            let values = Object.values(q.data);
            if (actualQTable === 'notas' && q.data.items) {
              values = values.map(v => Array.isArray(v) ? JSON.stringify(v) : v);
            }
            const placeholders = keys.map(() => '?').join(',');
            db.run(`INSERT INTO ${actualQTable} (${keys.join(',')}) VALUES (${placeholders})`, values);
          } else if (q.action === 'update') {
            const targetId = q.id || q.data.id;
            const updates = q.data.updates || q.data;
            const keys = Object.keys(updates).filter(k => k !== 'id');
            const values = keys.map(k => updates[k]);
            const setString = keys.map(k => `${k} = ?`).join(', ');
            db.run(`UPDATE ${actualQTable} SET ${setString} WHERE id = ?`, [...values, targetId]);
          } else if (q.action === 'delete') {
            db.run(`DELETE FROM ${actualQTable} WHERE id = ?`, [q.id || q.data]);
          } else if (q.action === 'deleteByKode') {
            db.run(`DELETE FROM ${actualQTable} WHERE kode = ?`, [q.kode || q.data.kode]);
          } else if (q.action === 'insertOrIgnore') {
             db.run(`INSERT OR IGNORE INTO ${actualQTable} (name) VALUES (?)`, [q.data]);
          }
        }
        db.run("COMMIT;");
        saveDb();
      } catch (err) {
        db.run("ROLLBACK;");
        throw err;
      }
      return { success: true };
    }

    if (action === 'resetTransactions') {
      db.run("BEGIN TRANSACTION;");
      try {
        db.run('DELETE FROM services');
        db.run('DELETE FROM notas');
        db.run('DELETE FROM keuangan');
        db.run('DELETE FROM customers');
        db.run("COMMIT;");
        saveDb();
      } catch (err) {
        db.run("ROLLBACK;");
        throw err;
      }
      return { success: true };
    }
    
    if (action === 'clearAndSeed') {
      db.run("BEGIN TRANSACTION;");
      try {
        ['spareparts', 'notas', 'suppliers', 'keuangan', 'services', 'customers'].forEach(t => {
          db.run(`DELETE FROM ${t}`);
        });
        
        if (data.parts) data.parts.forEach(p => db.run('INSERT INTO spareparts (id, kode, kategori, deskripsi, harga, stok, keterangan, tanggalMasuk) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [p.id, p.kode, p.kategori, p.deskripsi, p.harga, p.stok, p.keterangan, p.tanggalMasuk || '']));
        if (data.notas) data.notas.forEach(n => db.run('INSERT INTO notas (id, nomorNota, tanggal, waktu, namaCustomer, namaAdmin, keterangan, items, total, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [n.id, n.nomorNota, n.tanggal, n.waktu, n.namaCustomer, n.namaAdmin, n.keterangan, JSON.stringify(n.items), n.total, n.createdAt]));
        if (data.suppliers) data.suppliers.forEach(s => db.run('INSERT INTO suppliers (id, namaToko, pemilik, telp, whatsapp, facebook, tokopedia, bukalapak, shopee, info) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [s.id, s.namaToko, s.pemilik, s.telp, s.whatsapp, s.facebook, s.tokopedia, s.bukalapak, s.shopee, s.info]));
        if (data.keuangan) data.keuangan.forEach(k => db.run('INSERT INTO keuangan (id, tanggal, tipe, kode, deskripsi, jumlah) VALUES (?, ?, ?, ?, ?, ?)', [k.id, k.tanggal, k.tipe, k.kode, k.deskripsi, k.jumlah]));
        if (data.customers) data.customers.forEach(c => db.run('INSERT INTO customers (name) VALUES (?)', [c]));
        if (data.services) data.services.forEach(s => db.run('INSERT INTO services (id, noUrut, tanggalMasuk, pemilik, noHp, jenis, merek, serialNumber, kelengkapan, keluhan, statusPengerjaan, statusPembayaran, biaya, catatanTeknisi, tanggalAmbil, items, jasaPasang) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [s.id, s.noUrut, s.tanggalMasuk, s.pemilik, s.noHp || s.telp || '-', s.jenis, s.merek, s.serialNumber || '-', s.kelengkapan, s.keluhan, s.statusPengerjaan, s.statusPembayaran, s.biaya, s.catatanTeknisi, s.tanggalAmbil || '', s.items || '[]', s.jasaPasang || 0]));
        
        db.run("COMMIT;");
        saveDb();
      } catch (err) {
        db.run("ROLLBACK;");
        throw err;
      }
      return { success: true };
    }

  } catch (error) {
    console.error('Database Error:', error);
    throw error;
  }
});

ipcMain.handle('focus-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.blur();
    win.focus();
  }
  return { success: true };
});

ipcMain.handle('backup-db', async (event) => {
  try {
    if (!db || !dbPath) return { success: false, error: 'Database belum terinisialisasi' };
    
    const data = db.export();
    
    const { filePath, canceled } = await dialog.showSaveDialog({
      title: 'Simpan Pencadangan Database',
      defaultPath: path.join(app.getPath('downloads'), `ags_service_backup_${new Date().toISOString().split('T')[0]}.db`),
      filters: [
        { name: 'SQLite Database', extensions: ['db'] }
      ]
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    fs.writeFileSync(filePath, Buffer.from(data));
    return { success: true, filePath };
  } catch (err) {
    console.error('Backup Error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('restore-db', async (event) => {
  try {
    const { filePaths, canceled } = await dialog.showOpenDialog({
      title: 'Pilih File Database untuk Pemulihan',
      filters: [
        { name: 'SQLite Database', extensions: ['db'] }
      ],
      properties: ['openFile']
    });

    if (canceled || filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const selectedPath = filePaths[0];
    const filebuffer = fs.readFileSync(selectedPath);
    
    // Validate database file using sql.js
    const SQL = await initSqlJs({
      locateFile: file => {
        const wasmPath = path.join(__dirname, 'node_modules', 'sql.js', 'dist', file);
        if (fs.existsSync(wasmPath)) return wasmPath;
        return path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'sql.js', 'dist', file);
      }
    });

    // Try opening it to ensure it is a valid sqlite file
    let tempDb;
    try {
      tempDb = new SQL.Database(filebuffer);
      // Run a quick query to test
      tempDb.run("SELECT name FROM sqlite_master WHERE type='table';");
    } catch (e) {
      return { success: false, error: 'File yang dipilih bukan database SQLite yang valid atau file rusak.' };
    }

    // Run migrations on the restored database
    runMigrations(tempDb);

    // Save the migrated buffer to disk
    const data = tempDb.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
    
    // Replace the global db
    db = tempDb;
    
    return { success: true };
  } catch (err) {
    console.error('Restore Error:', err);
    return { success: false, error: err.message };
  }
});

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    autoHideMenuBar: true,
  });

  // Right-click context menu (Copy-Paste with mouse support)
  mainWindow.webContents.on('context-menu', (event, params) => {
    const contextMenuTemplate = [];
    
    if (params.isEditable) {
      contextMenuTemplate.push(
        { role: 'undo', label: 'Batal', accelerator: 'CmdOrCtrl+Z' },
        { role: 'redo', label: 'Ulangi', accelerator: 'CmdOrCtrl+Y' },
        { type: 'separator' },
        { role: 'cut', label: 'Potong', accelerator: 'CmdOrCtrl+X' },
        { role: 'copy', label: 'Salin', accelerator: 'CmdOrCtrl+C' },
        { role: 'paste', label: 'Tempel', accelerator: 'CmdOrCtrl+V' },
        { type: 'separator' },
        { role: 'selectall', label: 'Pilih Semua', accelerator: 'CmdOrCtrl+A' }
      );
    } else if (params.selectionText && params.selectionText.trim() !== '') {
      contextMenuTemplate.push(
        { role: 'copy', label: 'Salin', accelerator: 'CmdOrCtrl+C' },
        { role: 'selectall', label: 'Pilih Semua', accelerator: 'CmdOrCtrl+A' }
      );
    } else {
      contextMenuTemplate.push(
        { role: 'reload', label: 'Muat Ulang Halaman', accelerator: 'CmdOrCtrl+R' }
      );
    }

    if (contextMenuTemplate.length > 0) {
      const menu = Menu.buildFromTemplate(contextMenuTemplate);
      menu.popup({ window: mainWindow });
    }
  });

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    // Change to 5173 to match default Vite port
    mainWindow.loadURL('http://localhost:5173');
  }
}

const template = [
  {
    label: 'Edit',
    submenu: [
      { role: 'undo', label: 'Batal', accelerator: 'CmdOrCtrl+Z' },
      { role: 'redo', label: 'Ulangi', accelerator: 'CmdOrCtrl+Y' },
      { type: 'separator' },
      { role: 'cut', label: 'Potong', accelerator: 'CmdOrCtrl+X' },
      { role: 'copy', label: 'Salin', accelerator: 'CmdOrCtrl+C' },
      { role: 'paste', label: 'Tempel', accelerator: 'CmdOrCtrl+V' },
      { role: 'selectall', label: 'Pilih Semua', accelerator: 'CmdOrCtrl+A' }
    ]
  },
  {
    label: 'Tampilan',
    submenu: [
      { role: 'reload', label: 'Muat Ulang', accelerator: 'CmdOrCtrl+R' },
      { role: 'forcereload', label: 'Paksa Muat Ulang', accelerator: 'CmdOrCtrl+Shift+R' },
      { role: 'toggledevtools', label: 'Developer Tools', accelerator: 'F12' },
      { type: 'separator' },
      { role: 'resetzoom', label: 'Reset Zoom', accelerator: 'CmdOrCtrl+0' },
      { role: 'zoomin', label: 'Perbesar', accelerator: 'CmdOrCtrl+=' },
      { role: 'zoomout', label: 'Perkecil', accelerator: 'CmdOrCtrl+-' },
      { type: 'separator' },
      { role: 'togglefullscreen', label: 'Layar Penuh', accelerator: 'F11' }
    ]
  }
];

app.whenReady().then(async () => {
  await initDB();
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  createWindow();

  // Setup Auto Updater Event Handlers
  autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Pembaruan Tersedia',
      message: `Versi baru (${info.version}) sedang diunduh di latar belakang. Anda dapat tetap menggunakan aplikasi selama proses berlangsung.`,
      buttons: ['Oke']
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Pembaruan Siap Dipasang',
      message: `Versi baru (${info.version}) telah berhasil diunduh. Aplikasi akan ditutup dan diperbarui sekarang.`,
      buttons: ['Mulai Ulang & Pasang', 'Nanti Saja']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  // Check for updates
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

