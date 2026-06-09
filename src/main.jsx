import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Fix Electron print freeze/unresponsive clicks by restoring window focus
if (typeof window !== 'undefined') {
  const originalPrint = window.print;
  window.print = function (...args) {
    originalPrint.apply(window, args);
    setTimeout(() => {
      window.focus();
      if (window.electronAPI && window.electronAPI.focusWindow) {
        window.electronAPI.focusWindow().catch(err => console.error('Refocus error:', err));
      }
    }, 500);
  };

  window.addEventListener('afterprint', () => {
    setTimeout(() => {
      window.focus();
      if (window.electronAPI && window.electronAPI.focusWindow) {
        window.electronAPI.focusWindow().catch(err => console.error('Refocus error:', err));
      }
    }, 500);
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
