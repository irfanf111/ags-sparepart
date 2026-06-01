const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

async function test() {
  const SQL = await initSqlJs({
    locateFile: file => path.join(__dirname, 'node_modules', 'sql.js', 'dist', file)
  });
  
  const dbDir = path.join(__dirname, 'test-db');
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);
  const dbPath = path.join(dbDir, 'test.db');
  
  const db = new SQL.Database();
  db.run(`
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
      catatanTeknisi TEXT
    );
  `);
  
  const data = {
    pemilik: 's',
    noHp: '87654321',
    jenis: 'LAPTOP',
    merek: 's',
    serialNumber: 's',
    keluhan: 'd',
    kelengkapan: 'Adaptor',
    catatanTeknisi: '',
    biaya: 0,
    statusPengerjaan: 'Proses Pengerjaan',
    id: '123',
    noUrut: 'AGS3188',
    tanggalMasuk: '2026-05-16',
    statusPembayaran: 'Lunas'
  };
  
  const keys = Object.keys(data);
  let values = Object.values(data);
  const placeholders = keys.map(() => '?').join(',');
  
  try {
    db.run(`INSERT INTO services (${keys.join(',')}) VALUES (${placeholders})`, values);
    console.log("INSERT SUCCESS");
  } catch (e) {
    console.error("INSERT ERROR:", e);
  }
}
test();
