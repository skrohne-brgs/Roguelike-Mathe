// Hilfsfunktionen: Zufall, lokaler Speicher, HTML-Escaping
window.RM = window.RM || {};
(function (RM) {
  'use strict';

  const R = {
    int(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); },
    nonzero(a, b) { let v; do { v = R.int(a, b); } while (v === 0); return v; },
    pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    chance(p) { return Math.random() < p; },
    // entries: [[wert, gewicht], ...]
    weighted(entries) {
      const total = entries.reduce((s, e) => s + e[1], 0);
      let r = Math.random() * total;
      for (const [v, w] of entries) { if ((r -= w) < 0) return v; }
      return entries[entries.length - 1][0];
    },
    sign() { return Math.random() < 0.5 ? -1 : 1; }
  };
  RM.rand = R;

  // Alle Daten bleiben ausschließlich lokal im Browser (kein Server, kein Tracking).
  RM.store = {
    get(key, fallback) {
      try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* Speicher nicht verfügbar */ }
    },
    remove(key) {
      try { localStorage.removeItem(key); } catch (e) { /* Speicher nicht verfügbar */ }
    }
  };

  RM.esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  RM.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
})(window.RM);
