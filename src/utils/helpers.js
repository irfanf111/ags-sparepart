// Format angka ke format Rupiah gaya AGS: "Rp. 25.000"
export const formatRupiah = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Rp. 0';
  const num = Math.round(Number(amount));
  return 'Rp. ' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Format tanggal ke DD/MM/YYYY
export const formatTanggal = (dateStr) => {
  if (!dateStr) return '-';
  // dateStr bisa YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

// Format tanggal panjang
export const formatTanggalPanjang = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

// Format tanggal singkat
export const formatTanggalSingkat = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Dapatkan tanggal hari ini dalam format YYYY-MM-DD (menggunakan waktu lokal bengkel)
export const getTodayStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Dapatkan jam sekarang HH:MM:SS
export const getTimeStr = () => {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
};

// Format datetime lengkap untuk nota: DD/MM/YYYY - HH:MM:SS
export const formatDateTimeNota = (dateStr, timeStr) => {
  return `${formatTanggal(dateStr)} - ${timeStr || '00:00:00'}`;
};

// Dapatkan tanggal 7 hari terakhir (menggunakan waktu lokal)
export const getLast7Days = () => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    days.push(`${year}-${month}-${day}`);
  }
  return days;
};

// Generate nomor nota otomatis format AGS00001
export const generateNomorNota = (existingNotas) => {
  const allNums = existingNotas
    .map(n => {
      const mNew = n.nomorNota?.match(/AGS(\d+)/i);
      if (mNew) return parseInt(mNew[1]);
      const mOld = n.nomorNota?.match(/PC\/JJ\/(\d+)/);
      if (mOld) return parseInt(mOld[1]);
      return 0;
    })
    .filter(n => !isNaN(n));
  const maxNum = allNums.length > 0 ? Math.max(...allNums) : 0;
  const nextNum = String(maxNum + 1).padStart(5, '0');
  return `AGS${nextNum}`;
};

// Generate nomor nota otomatis format AGS/PC/0001 untuk kasir penjualan mandiri
export const generateNomorNotaPenjualan = (existingNotas) => {
  const allNums = existingNotas
    .map(n => {
      const match = n.nomorNota?.match(/AGS\/PC\/(\d+)/i);
      if (match) return parseInt(match[1]);
      return 0;
    })
    .filter(n => !isNaN(n));
  const maxNum = allNums.length > 0 ? Math.max(...allNums) : 0;
  const nextNum = String(maxNum + 1).padStart(4, '0');
  return `AGS/PC/${nextNum}`;
};

// Generate ID unik
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Filter nota berdasarkan rentang tanggal (YYYY-MM-DD)
export const filterByDateRange = (items, startDate, endDate, dateField = 'tanggal') => {
  return items.filter(item => {
    const itemDate = item[dateField];
    if (!itemDate) return false;
    if (startDate && itemDate < startDate) return false;
    if (endDate && itemDate > endDate) return false;
    return true;
  });
};

// Hitung total nota
export const hitungTotalNota = (items) => {
  return items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
};

// Dapatkan label hari singkat
export const getDayLabel = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short' });
};

// Truncate text
export const truncate = (str, n = 30) => {
  return str && str.length > n ? str.substring(0, n - 3) + '...' : str;
};

// Versi Aplikasi AGS Techflow (Pusat Kendali Versi)
export const APP_VERSION = '1.0.1';
