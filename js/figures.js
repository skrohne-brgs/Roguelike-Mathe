// Skizzen für Geometrie-Aufgaben (SVG): Flächen mit Beschriftung, Höhen, Schrägbilder von Prismen und Netze.
// Koordinaten in „Aufgaben-Einheiten“ (y nach oben); die Skizze wird automatisch eingepasst.
(function (RM) {
  'use strict';

  const C = {
    fill: '#3b3158', fill2: '#4b3d72', side: '#332a4d', stroke: '#f1ecf7', hidden: '#a99fbd',
    height: '#ffcf7a', label: '#f1ecf7', accent: '#6ad6ff', good: '#5cc98a', cut: '#ef6461'
  };
  // Schrift mit dunklem Rand, damit Beschriftungen auch über Linien lesbar bleiben
  const FONT = 'font-family="Cambria Math, Times New Roman, serif" stroke="#262036" stroke-width="4" stroke-linejoin="round" paint-order="stroke"';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // Zahl mit Komma
  const num = x => String(Math.round(x * 1000) / 1000).replace('.', ',');

  class Scene {
    constructor() { this.items = []; }
    poly(pts, o = {}) { this.items.push(Object.assign({ t: 'poly', pts }, o)); return this; }
    line(a, b, o = {}) { this.items.push(Object.assign({ t: 'line', a, b }, o)); return this; }
    // Beschriftung einer Strecke; side = +1/−1 wählt die Seite (links bzw. rechts in Laufrichtung a → b)
    label(a, b, text, side = 1, o = {}) { this.items.push(Object.assign({ t: 'lbl', a, b, text, side }, o)); return this; }
    text(p, text, o = {}) { this.items.push(Object.assign({ t: 'text', p, text }, o)); return this; }
    // rechter Winkel bei p zwischen den Richtungen u und v
    right(p, u, v) { this.items.push({ t: 'ra', p, u, v }); return this; }
    // Höhe von p auf die Gerade durch a, b (gestrichelt, mit rechtem Winkel und Beschriftung)
    height(p, a, b, text, side = 1, o = {}) {
      const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy;
      const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2;
      const f = [a[0] + t * dx, a[1] + t * dy];
      // Verlängerung der Grundseite, wenn der Fußpunkt außerhalb liegt
      if (t < 0) this.line(f, a, { color: C.hidden, dash: true, w: 1.5 });
      if (t > 1) this.line(b, f, { color: C.hidden, dash: true, w: 1.5 });
      this.line(p, f, { color: o.color || C.height, dash: true, w: 2.5 });
      const L = Math.sqrt(L2), u = [dx / L, dy / L], hv = [p[0] - f[0], p[1] - f[1]], hl = Math.hypot(hv[0], hv[1]);
      this.right(f, t > 0.5 ? [-u[0], -u[1]] : u, [hv[0] / hl, hv[1] / hl]);
      if (text) this.label(f, p, text, side, { color: o.color || C.height });
      return this;
    }
    svg(maxW = 420, maxH = 260) {
      const pts = [];
      for (const it of this.items) {
        if (it.t === 'poly') pts.push(...it.pts);
        if (it.t === 'line' || it.t === 'lbl') pts.push(it.a, it.b);
        if (it.t === 'text' || it.t === 'ra') pts.push(it.p);
      }
      const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
      const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
      // seitlich mehr Rand für waagerechte Beschriftungen wie „12,5 cm“
      const px = 66, py = 30, w = Math.max(maxx - minx, 1e-6), h = Math.max(maxy - miny, 1e-6);
      const s = Math.min((maxW - 2 * px) / w, (maxH - 2 * py) / h);
      const W = Math.round(w * s + 2 * px), H = Math.round(h * s + 2 * py);
      const M = p => [px + (p[0] - minx) * s, H - py - (p[1] - miny) * s];
      this.map = M; // für Animationen: Aufgaben-Koordinaten → SVG-Koordinaten
      const P = p => M(p).map(v => v.toFixed(1)).join(',');
      let out = '';
      for (const it of this.items) {
        if (it.t === 'poly') {
          out += '<polygon points="' + it.pts.map(P).join(' ') + '" fill="' + (it.fill || C.fill) + '" fill-opacity="' + (it.opacity === undefined ? 1 : it.opacity) +
            '" stroke="' + (it.stroke || C.stroke) + '" stroke-width="' + (it.w || 2.5) + '" stroke-linejoin="round"' + (it.dash ? ' stroke-dasharray="7 5"' : '') + (it.cls ? ' class="' + it.cls + '"' : '') + '/>';
        } else if (it.t === 'line') {
          const [x1, y1] = M(it.a), [x2, y2] = M(it.b);
          out += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="' + (it.color || C.stroke) +
            '" stroke-width="' + (it.w || 2.5) + '" stroke-linecap="round"' + (it.dash ? ' stroke-dasharray="7 5"' : '') + (it.cls ? ' class="' + it.cls + '"' : '') + '/>';
        } else if (it.t === 'ra') {
          const [x, y] = M(it.p), k = 11;
          const u = [it.u[0], -it.u[1]], v = [it.v[0], -it.v[1]];
          out += '<path d="M' + (x + u[0] * k).toFixed(1) + ' ' + (y + u[1] * k).toFixed(1) + ' L' + (x + (u[0] + v[0]) * k).toFixed(1) + ' ' + (y + (u[1] + v[1]) * k).toFixed(1) +
            ' L' + (x + v[0] * k).toFixed(1) + ' ' + (y + v[1] * k).toFixed(1) + '" fill="none" stroke="' + C.height + '" stroke-width="1.8"/>' +
            '<circle cx="' + (x + (u[0] + v[0]) * k * .5).toFixed(1) + '" cy="' + (y + (u[1] + v[1]) * k * .5).toFixed(1) + '" r="1.6" fill="' + C.height + '"/>';
        } else if (it.t === 'lbl') {
          const [x1, y1] = M(it.a), [x2, y2] = M(it.b);
          const L = Math.hypot(x2 - x1, y2 - y1) || 1;
          const nx = (y2 - y1) / L * it.side, ny = -(x2 - x1) / L * it.side;
          const off = it.off || 15, cx = (x1 + x2) / 2 + nx * off, cy = (y1 + y2) / 2 + ny * off;
          const anchor = Math.abs(nx) < 0.35 ? 'middle' : nx > 0 ? 'start' : 'end';
          out += '<text x="' + cx.toFixed(1) + '" y="' + cy.toFixed(1) + '" text-anchor="' + anchor + '" dominant-baseline="middle" fill="' + (it.color || C.label) + '" font-size="' + (it.size || 17) + '" ' + FONT + (it.cls ? ' class="' + it.cls + '"' : '') + '>' + esc(it.text) + '</text>';
        } else if (it.t === 'text') {
          const [x, y] = M(it.p);
          out += '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" text-anchor="' + (it.anchor || 'middle') + '" dominant-baseline="middle" fill="' + (it.color || C.label) + '" font-size="' + (it.size || 17) + '" ' + FONT + (it.bold ? ' font-weight="700"' : '') + (it.cls ? ' class="' + it.cls + '"' : '') + '>' + esc(it.text) + '</text>';
        }
      }
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Skizze">' + out + '</svg>';
    }
  }

  // Seitenmitte nach außen beschriften: Für ein gegen den Uhrzeigersinn umlaufenes Vieleck liegt „außen“ rechts (side = −1)
  const ccw = pts => pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) > 0;
  function polygonFigure(pts, labels = {}, o = {}) {
    const S = new Scene();
    const out = ccw(pts) ? -1 : 1;
    S.poly(pts, { fill: o.fill });
    for (const [i, text] of Object.entries(labels)) if (text) S.label(pts[+i], pts[(+i + 1) % pts.length], text, out);
    return S;
  }

  // Schrägbild eines geraden Prismas: Grundfläche (konvex) vorne, Tiefe nach hinten rechts (45°, halbe Länge)
  // o: { labels: {i: text} für Kanten der Vorderseite, depth: Text für die Körperhöhe, extra(S, F, B) für weitere Linien }
  function prism(base, depth, o = {}) {
    const pts = ccw(base) ? base : base.slice().reverse();
    const n = pts.length, k = (o.k || 0.5) * depth / Math.SQRT2, dv = [k, k];
    const back = pts.map(p => [p[0] + dv[0], p[1] + dv[1]]);
    // Seitenfläche i (Kante i → i+1) ist sichtbar, wenn ihre Außennormale in Tiefenrichtung zeigt
    const vis = pts.map((p, i) => {
      const q = pts[(i + 1) % n], nx = q[1] - p[1], ny = -(q[0] - p[0]);
      return nx * dv[0] + ny * dv[1] > 1e-9;
    });
    const S = new Scene();
    for (let i = 0; i < n; i++) if (vis[i]) S.poly([pts[i], pts[(i + 1) % n], back[(i + 1) % n], back[i]], { fill: C.side, w: 2.2 });
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      if (!vis[i]) S.line(back[i], back[j], { color: C.hidden, dash: true, w: 1.6 });
      if (!vis[i] && !vis[(i - 1 + n) % n]) S.line(pts[i], back[i], { color: C.hidden, dash: true, w: 1.6 });
    }
    S.poly(pts, { fill: o.fill || C.fill2, opacity: 0.92 });
    const lbl = o.labels || {};
    const out = -1; // pts sind gegen den Uhrzeigersinn
    // Kanten neben einer sichtbaren Seitenfläche werden innen beschriftet, damit nichts überlappt
    for (const [i, text] of Object.entries(lbl)) if (text) S.label(pts[+i], pts[(+i + 1) % n], text, vis[+i] ? -out : out);
    if (o.depth) {
      // Tiefe an einer sichtbaren Verbindungskante unten rechts beschriften
      let best = 0;
      for (let i = 0; i < n; i++) if ((vis[i] || vis[(i - 1 + n) % n]) && (pts[i][0] - pts[i][1] > pts[best][0] - pts[best][1])) best = i;
      S.label(pts[best], back[best], o.depth, -1);
    }
    if (o.extra) o.extra(S, pts, back);
    return S;
  }

  // Netz aus Vielecken (z. B. Quadrate eines Würfelnetzes)
  function net(polys, o = {}) {
    const S = new Scene();
    polys.forEach((p, i) => S.poly(p, { fill: (o.fills && o.fills[i]) || C.fill, w: 2 }));
    return S;
  }
  // Würfelnetz aus Zellen [[spalte, zeile], ...] (Zeile nach unten)
  const cellsNet = cells => net(cells.map(([c, r]) => [[c, -r], [c + 1, -r], [c + 1, -r - 1], [c, -r - 1]]));

  // Würfelnetz? Prüfung durch „Abrollen“ eines Würfels über die Zellen [[spalte, zeile], ...]
  function isCubeNet(cells) {
    const key = c => c[0] + ',' + c[1];
    const set = new Set(cells.map(key));
    // Würfel: [unten, oben, nord, süd, ost, west]
    const seen = new Map([[key(cells[0]), [0, 1, 2, 3, 4, 5]]]), queue = [cells[0]];
    while (queue.length) {
      const c = queue.shift(), [b, t, n, s, e, w] = seen.get(key(c));
      const moves = [[[1, 0], [e, w, n, s, t, b]], [[-1, 0], [w, e, n, s, b, t]], [[0, -1], [n, s, t, b, e, w]], [[0, 1], [s, n, b, t, e, w]]];
      for (const [[dx, dy], o] of moves) {
        const d = [c[0] + dx, c[1] + dy];
        if (set.has(key(d)) && !seen.has(key(d))) { seen.set(key(d), o); queue.push(d); }
      }
    }
    return seen.size === 6 && new Set([...seen.values()].map(o => o[0])).size === 6;
  }
  // Schlüssel einer Zellenform, gleich für gedrehte und gespiegelte Formen
  const shapeKey = cells => {
    const forms = [];
    let cur = cells;
    for (let r = 0; r < 4; r++) {
      cur = cur.map(([x, y]) => [y, -x]);
      for (const m of [cur, cur.map(([x, y]) => [-x, y])]) {
        const mx = Math.min(...m.map(c => c[0])), my = Math.min(...m.map(c => c[1]));
        forms.push(m.map(c => (c[0] - mx) + ',' + (c[1] - my)).sort().join(';'));
      }
    }
    return forms.sort()[0];
  };


  RM.fig = { Scene, C, num, polygonFigure, prism, net, cellsNet, isCubeNet, shapeKey };
})(window.RM);
