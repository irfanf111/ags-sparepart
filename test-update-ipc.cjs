const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

app.whenReady().then(() => {
  require('./main.cjs'); // Initializes db and ipcMain

  const win = new BrowserWindow({
    show: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadURL('data:text/html,<html><body><h1>Testing Update IPC</h1><script>' + 
    'const { ipcRenderer } = require("electron");' + 
    'async function test() {' +
    '  try {' +
    '    console.log("Calling insert...");' +
    '    const newItem = { pemilik: "s", noHp: "123", jenis: "LAPTOP", merek: "s", serialNumber: "s", keluhan: "d", kelengkapan: "Tas", catatanTeknisi: "", biaya: 0, statusPengerjaan: "Proses", id: "test-update-id", noUrut: "AGS999", tanggalMasuk: "2026-05-16", statusPembayaran: "Lunas" };' +
    '    await ipcRenderer.invoke("db-call", { table: "services", action: "insert", data: newItem });' +
    '    console.log("Calling update...");' +
    '    const updates = { ...newItem, statusPengerjaan: "Berhasil Dikerjakan" };' +
    '    const res = await ipcRenderer.invoke("db-call", { table: "services", action: "update", data: { id: "test-update-id", updates } });' +
    '    console.log("Update result:", res);' +
    '    const getRes = await ipcRenderer.invoke("db-call", { table: "services", action: "getAll" });' +
    '    const updatedItem = getRes.find(s => s.id === "test-update-id");' +
    '    console.log("Updated status:", updatedItem.statusPengerjaan);' +
    '    require("electron").ipcRenderer.send("test-done", "SUCCESS: " + updatedItem.statusPengerjaan);' +
    '  } catch (e) {' +
    '    console.error("TEST FAILED", e);' +
    '    require("electron").ipcRenderer.send("test-done", "ERROR: " + e.message);' +
    '  }' +
    '}' +
    'setTimeout(test, 1000);' +
    '</script></body></html>');

  ipcMain.on('test-done', (e, msg) => {
    console.log("TEST RESULT:", msg);
    app.quit();
  });
});
