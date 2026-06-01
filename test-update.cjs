const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

async function test() {
  const SQL = await initSqlJs({
    locateFile: file => path.join(__dirname, 'node_modules', 'sql.js', 'dist', file)
  });
  
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
  
  // Insert a record
  db.run(`INSERT INTO services (id, statusPengerjaan, catatanTeknisi) VALUES ('test-id', 'Proses Pengerjaan', 'catatan awal')`);
  
  const actualTable = 'services';
  const id = null;
  const data = {
    id: 'test-id',
    updates: {
      id: 'test-id',
      statusPengerjaan: 'Berhasil Dikerjakan',
      catatanTeknisi: 'selesai',
      biaya: 150000
    }
  };
  
  // Update logic from main.cjs
  const targetId = id || data.id;
  const updates = data.updates || data;
  
  const keys = Object.keys(updates).filter(k => k !== 'id');
  let values = keys.map(k => updates[k]);
  
  const setString = keys.map(k => `${k} = ?`).join(', ');
  
  try {
    const query = `UPDATE ${actualTable} SET ${setString} WHERE id = ?`;
    console.log("Query:", query);
    console.log("Values:", [...values, targetId]);
    db.run(query, [...values, targetId]);
    console.log("UPDATE SUCCESS");
    
    // Check if updated
    const stmt = db.prepare('SELECT * FROM services WHERE id = ?');
    stmt.bind(['test-id']);
    stmt.step();
    console.log("Result:", stmt.getAsObject());
    stmt.free();
  } catch (e) {
    console.error("UPDATE ERROR:", e);
  }
}
test();
