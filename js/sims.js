// Mathe-Simulationen für den Lösungsweg: Waage, Flächenmodell, Sortiermaschine, Einsetzmaschine
// Eine Aufgabe kann ein Feld task.sim = { type: 'waage' | 'flaeche' | 'sort' | 'einsetz', ... } mitbringen.
(function (RM) {
  'use strict';
  const { fmt, Q } = RM.math;
  const fx = RM.fx;
  const svgNS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs, parent) => {
    const e = document.createElementNS(svgNS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  // Markup → Klartext für SVG-Beschriftungen
  const plain = s => String(s).replace(/\^2/g, '²').replace(/\^3/g, '³').replace(/\*/g, ' · ').replace(/-/g, '−').replace(/\s+/g, ' ').trim();
  const J = list => {
    const l = list.filter(([c]) => c !== 0);
    if (!l.length) return '0';
    return l.map(([c, v], i) => {
      const abs = Math.abs(c), body = v === '' ? String(abs) : (abs === 1 ? v : abs + v);
      return i === 0 ? (c < 0 ? '-' : '') + body : (c < 0 ? ' - ' : ' + ') + body;
    }).join('');
  };

  // ---------------- Waage: a·x + b = c·x + d (alle Werte ≥ 0, x > 0) ----------------
  function waage(sim) {
    const { a, b, c, d, x } = sim;
    const eq = (l, r, op) => fmt(l + ' = ' + r) + (op ? ' <span class="op">nach | ' + fmt(op) + '</span>' : '');
    const box = n => (n === 1 ? 'eine Kiste' : n + ' Kisten');
    const ins = t => t.replace(/(\d*)x/g, (m, n) => (n ? n + '*' : '') + x); // x durch die Lösung ersetzen
    const S = [{
      L: { x: a, w: b ? [b] : [] }, R: { x: c, w: d ? [d] : [] },
      eq: eq(J([[a, 'x'], [b, '']]), J([[c, 'x'], [d, '']])),
      cap: 'Jede blaue Kiste wiegt <span class="m"><i>x</i></span>. Links liegen ' + box(a) + (b ? ' und ein ' + b + '-er-Gewicht' : '') +
        ', rechts ' + (c ? box(c) + (d ? ' und ' + d : '') : String(d)) + '. Die Waage ist im Gleichgewicht.'
    }];
    let A = a, B = b, D = d, tilted = false;
    if (c > 0) {
      S.push({ L: { x: A - c, w: B ? [B] : [] }, R: { x: c, w: D ? [D] : [] }, tilt: true, eq: '<span class="bad-text">' + fmt(J([[A - c, 'x'], [B, '']])) + ' ≠ ' + fmt(J([[c, 'x'], [D, '']])) + '</span>',
        cap: 'Nur links ' + box(c) + ' wegnehmen? Die Waage <b>kippt</b>! Was du auf einer Seite machst, musst du auch auf der anderen tun.' });
      tilted = true;
      A -= c;
      S.push({ L: { x: A, w: B ? [B] : [] }, R: { x: 0, w: [D] }, eq: eq(J([[A, 'x'], [B, '']]), String(D), '-' + (c === 1 ? '' : c) + 'x'),
        cap: 'Auf beiden Seiten ' + box(c) + ' weg: Die Waage ist wieder im Gleichgewicht.' });
    }
    if (B > 0) {
      if (!tilted) {
        S.push({ L: { x: A, w: [] }, R: { x: 0, w: [D] }, tilt: true, eq: '<span class="bad-text">' + fmt(J([[A, 'x']])) + ' ≠ ' + fmt(String(D)) + '</span>',
          cap: 'Nur links das ' + B + '-er-Gewicht wegnehmen? Die Waage <b>kippt</b>! Was du auf einer Seite machst, musst du auch auf der anderen tun.' });
      }
      D -= B;
      S.push({ L: { x: A, w: [] }, R: { x: 0, w: [D] }, eq: eq(J([[A, 'x']]), String(D), '-' + B),
        cap: 'Auf beiden Seiten ' + B + ' weg: Rechts bleiben ' + D + '. Gleichgewicht!' });
      B = 0;
    }
    if (A > 1) {
      S.push({ L: { x: A, w: [] }, R: { x: 0, w: Array(A).fill(x) }, groups: true, eq: eq(J([[A, 'x']]), String(D), ':' + A),
        cap: 'Teile beide Seiten in ' + A + ' gleiche Teile: Zu jeder Kiste gehört ein ' + x + '-er-Gewicht.' });
      S.push({ L: { x: 1, w: [] }, R: { x: 0, w: [x] }, eq: eq('x', String(x)), cap: 'Ein ' + A + '-tel jeder Seite bleibt liegen: Eine Kiste wiegt genau ' + x + '.' });
    }
    S.push({ L: { x: a, w: b ? [b] : [] }, R: { x: c, w: d ? [d] : [] }, probe: true,
      eq: fmt(ins(J([[a, 'x'], [b, '']])) + ' = ' + ins(J([[c, 'x'], [d, '']]))) + ' ✔',
      cap: '<b>Probe:</b> Jede Kiste wiegt ' + x + '. Links ' + (a * x + b) + ', rechts ' + (c * x + d) + ' – stimmt!' });

    let angle = 0, raf = null;
    const weightOf = s => (s.L.x - s.R.x) * x + s.L.w.reduce((p, q) => p + q, 0) - s.R.w.reduce((p, q) => p + q, 0);
    function draw(svg, s, ang) {
      svg.innerHTML = '';
      const cx = 180, cy = 70, arm = 120;
      mk('rect', { x: 170, y: 70, width: 20, height: 115, fill: '#5c4a7a' }, svg);
      mk('path', { d: 'M130 200 L230 200 L200 182 L160 182 Z', fill: '#5c4a7a' }, svg);
      const rad = ang * Math.PI / 180;
      const lx = cx - arm * Math.cos(rad), ly = cy - arm * Math.sin(rad), rx = cx + arm * Math.cos(rad), ry = cy + arm * Math.sin(rad);
      mk('line', { x1: lx, y1: ly, x2: rx, y2: ry, stroke: '#e3b25a', 'stroke-width': 7, 'stroke-linecap': 'round' }, svg);
      mk('circle', { cx, cy, r: 7, fill: '#ffcf7a' }, svg);
      [[lx, ly, s.L], [rx, ry, s.R]].forEach(([px, py, side]) => {
        const panY = py + 62;
        mk('line', { x1: px, y1: py, x2: px - 36, y2: panY, stroke: '#a99fbd', 'stroke-width': 1.5 }, svg);
        mk('line', { x1: px, y1: py, x2: px + 36, y2: panY, stroke: '#a99fbd', 'stroke-width': 1.5 }, svg);
        mk('path', { d: 'M' + (px - 50) + ' ' + panY + ' Q' + px + ' ' + (panY + 18) + ' ' + (px + 50) + ' ' + panY + ' Z', fill: '#8a7aa8' }, svg);
        const items = Array(side.x).fill('x').concat(side.w);
        let sizes = items.map(it => (it === 'x' ? 22 : 12 + Math.sqrt(it) * 3.2));
        const total = sizes.reduce((p, q) => p + q + 3, -3);
        if (total > 104) sizes = sizes.map(z => z * 104 / total);
        let xx = px - Math.min(total, 104) / 2;
        items.forEach((it, k) => {
          const sz = sizes[k];
          if (it === 'x') {
            mk('rect', { x: xx, y: panY - sz - 1, width: sz, height: sz, rx: 3, fill: s.probe ? '#3aa772' : '#4f7fd8', stroke: s.groups ? '#ffcf7a' : '#cfe0ff', 'stroke-width': s.groups ? 2.5 : 1 }, svg);
            const t = mk('text', { x: xx + sz / 2, y: panY - sz / 2 + 4, 'text-anchor': 'middle', fill: '#fff', 'font-size': Math.max(9, sz * .62), 'font-style': s.probe ? 'normal' : 'italic', 'font-family': 'Cambria Math, Times New Roman, serif' }, svg);
            t.textContent = s.probe ? x : 'x';
          } else {
            mk('path', { d: 'M' + (xx + 2) + ' ' + (panY - 1) + ' L' + (xx + sz - 2) + ' ' + (panY - 1) + ' L' + (xx + sz - 5) + ' ' + (panY - sz) + ' L' + (xx + 5) + ' ' + (panY - sz) + ' Z',
              fill: '#7d8597', stroke: s.groups ? '#ffcf7a' : '#c6cbd6', 'stroke-width': s.groups ? 2.5 : 1 }, svg);
            const t = mk('text', { x: xx + sz / 2, y: panY - sz / 2 + 4, 'text-anchor': 'middle', fill: '#fff', 'font-size': Math.max(8, Math.min(13, sz * .45)), 'font-weight': 700 }, svg);
            t.textContent = it;
          }
          xx += sz + 3;
        });
      });
    }
    return {
      n: S.length,
      html: '<div class="stage"><svg class="waage" viewBox="0 0 360 210"></svg></div><div class="eqline"></div>',
      render(step, el) {
        const s = S[step], svg = el.querySelector('svg');
        el.querySelector('.eqline').innerHTML = s.eq;
        const w = weightOf(s), target = w === 0 ? 0 : (w < 0 ? 12 : -12), from = angle, t0 = performance.now(), dur = fx.D(700);
        if (s.tilt || step === S.length - 1) fx.sfx.plop();
        cancelAnimationFrame(raf);
        (function f(now) {
          const t = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - t, 3);
          const wob = target === 0 && from !== 0 && !fx.isCalm() ? Math.sin(t * Math.PI * 3) * (1 - t) * 3 : 0;
          angle = from + (target - from) * e + wob;
          draw(svg, s, angle);
          if (t < 1) raf = requestAnimationFrame(f); else { angle = target; draw(svg, s, angle); }
        })(t0);
        return s.cap;
      }
    };
  }

  // ---------------- Flächenmodell: outer · (p1 + p2) ----------------
  function flaeche(sim) {
    const [p1, p2] = sim.parts, o = plain(sim.outer);
    const T = (x, y, txt, extra = '') => '<text x="' + x + '" y="' + y + '" text-anchor="middle" fill="#fff" font-size="18" font-family="Cambria Math, Times New Roman, serif" ' + extra + '>' + RM.esc(txt) + '</text>';
    const svg = '<svg class="flaeche" viewBox="0 0 360 200" data-step="0">' +
      '<text x="20" y="114" text-anchor="middle" fill="#a99fbd" font-size="18" font-family="Cambria Math, Times New Roman, serif">' + RM.esc(o) + '</text>' +
      '<g class="left"><rect x="40" y="60" width="160" height="96" fill="#5b4a86" stroke="#f1ecf7" stroke-width="2"/>' +
      T(120, 113, o + ' · ' + plain(p1.top) + ' = ' + plain(p1.area), 'class="part-label"') + T(120, 48, plain(p1.top), 'fill="#a99fbd"') + '</g>' +
      '<g class="right"><rect x="200" y="60" width="100" height="96" fill="#5b4a86" stroke="#f1ecf7" stroke-width="2"/>' +
      T(250, 113, plain(p2.area), 'class="part-label"') + T(250, 48, plain(p2.top), 'fill="#a99fbd"') + '</g>' +
      '<line class="split" x1="200" y1="60" x2="200" y2="156" stroke="#ffcf7a" stroke-width="3"/>' +
      T(170, 114, plain(sim.whole), 'class="whole-label" font-size="20"') +
      '<text class="plus" x="217" y="116" text-anchor="middle" fill="#ffcf7a" font-size="28">+</text></svg>';
    const forward = [
      [0, fmt(sim.whole), 'Ein Rechteck mit der Höhe ' + fmt(sim.outer) + ' und der Breite ' + fmt(p1.top + ' + ' + p2.top) + '. Seine Fläche ist ' + fmt(sim.whole) + '.'],
      [1, fmt(sim.whole), 'Die Breite besteht aus zwei Teilen: ' + fmt(p1.top) + ' und ' + fmt(p2.top) + '. Wir teilen das Rechteck an dieser Stelle.'],
      [2, fmt(p1.area) + ' &nbsp;und&nbsp; ' + fmt(p2.area), 'Jedes Teilrechteck hat die Höhe ' + fmt(sim.outer) + ': links ' + fmt(p1.area) + ', rechts ' + fmt(p2.area) + '.'],
      [3, fmt(sim.whole + ' = ' + sim.result), 'Die Gesamtfläche ist die Summe der Teilflächen.']
    ];
    const backward = [
      [3, fmt(sim.result), 'Zwei Rechtecke: ' + fmt(p1.area) + ' und ' + fmt(p2.area) + '. Beide haben die Höhe ' + fmt(sim.outer) + ' – das ist der gemeinsame Faktor.'],
      [2, fmt(p1.area) + ' &nbsp;und&nbsp; ' + fmt(p2.area), 'Wir schieben die Rechtecke zusammen. Die Höhe ' + fmt(sim.outer) + ' passt genau.'],
      [1, fmt(sim.outer + '*(' + p1.top + ' + ' + p2.top + ')'), 'Die gemeinsame Breite ist ' + fmt(p1.top + ' + ' + p2.top) + '.'],
      [0, fmt(sim.result + ' = ' + sim.whole), 'Ein einziges Rechteck: Höhe mal Breite. Das ist das Ausklammern.']
    ];
    const S = sim.reverse ? backward : forward;
    return {
      n: S.length,
      html: '<div class="stage">' + svg + '</div><div class="eqline"></div>',
      render(step, el) {
        el.querySelector('svg').dataset.step = S[step][0];
        el.querySelector('.eqline').innerHTML = S[step][1];
        if (step === S.length - 1) fx.sfx.coin(); else if (step) fx.sfx.tick();
        return S[step][2];
      }
    };
  }

  // ---------------- Sortiermaschine: gleichartige Terme ----------------
  function sort(sim) {
    const groups = sim.groups, g = groups.length;
    const binX = i => (i + 0.5) * 100 / g;
    const chips = sim.chips.map((c, i) => '<div class="chip k' + groups.findIndex(G => G.key === c.key) + '" data-i="' + i + '">' + fmt(c.text) + '</div>').join('');
    const res = groups.map((G, i) => '<div class="chip res gone" data-r="' + i + '">' + fmt(G.res) + '</div>').join('');
    const bins = groups.map((G, i) => '<div class="bin" style="left:' + binX(i) + '%;width:' + (88 / g) + '%"><span>' + G.label + '</span></div>').join('');
    const S = [
      [fmt(sim.term), 'Ein bunter Haufen Terme. Welche gehören zusammen?'],
      ['', 'Die Maschine sortiert nach Sorten: gleiche Variable <b>und</b> gleiche Hochzahl kommen in denselben Behälter. Das Vorzeichen wandert mit!'],
      ['', 'In jedem Behälter wird gerechnet: ' + groups.map(G => fmt(G.calc)).join(', ') + '.'],
      [fmt(sim.result), 'Fertig: Verschiedene Sorten lassen sich nicht weiter zusammenfassen.']
    ];
    return {
      n: S.length,
      html: '<div class="stage sorter">' + bins + chips + res + '</div><div class="eqline"></div>',
      render(step, el) {
        const counts = groups.map(() => 0), n = sim.chips.length;
        sim.chips.forEach((c, i) => {
          const ch = el.querySelector('[data-i="' + i + '"]'), gi = groups.findIndex(G => G.key === c.key);
          if (step === 0) { ch.style.left = ((i + 0.5) * 100 / n) + '%'; ch.style.top = '20%'; ch.classList.remove('gone'); }
          else { const k = counts[gi]++; ch.style.left = binX(gi) + '%'; ch.style.top = (50 + k * 15) + '%'; ch.classList.toggle('gone', step >= 2); }
        });
        const shown = groups.filter(G => !G.zero);
        groups.forEach((G, i) => {
          const ch = el.querySelector('[data-r="' + i + '"]'), j = shown.indexOf(G);
          ch.classList.toggle('gone', step < 2 || (step === 3 && G.zero));
          ch.style.left = step === 3 && j >= 0 ? ((j + 0.5) * 100 / shown.length) + '%' : binX(i) + '%';
          ch.style.top = step === 3 ? '20%' : '62%';
        });
        el.querySelector('.eqline').innerHTML = S[step][0];
        if (step === 1) fx.sfx.plop(); else if (step === 2) fx.sfx.tick(); else if (step === 3) fx.sfx.coin();
        return S[step][1];
      }
    };
  }

  // ---------------- Einsetzmaschine: Termwert ----------------
  function einsetz(sim) {
    const vars = Object.keys(sim.vals);
    const belegung = vars.map(v => fmt(v + ' = ' + sim.vals[v])).join(' &nbsp; ');
    const S = [
      'Der Term hat Lücken für ' + vars.map(v => fmt(v)).join(' und ') + '. Wir setzen ' + vars.map(v => fmt(v + ' = ' + sim.vals[v])).join(' und ') + ' ein.',
      'Die Zahl fällt in jede Lücke' + (vars.some(v => sim.vals[v] < 0) ? ' – <b>negative Zahlen in Klammern</b>!' : '.'),
      'Jetzt wird gerechnet: zuerst Klammern und Potenzen, dann Punkt- vor Strichrechnung.',
      'Der Termwert ist <b>' + fmt(sim.value) + '</b>.'
    ];
    return {
      n: S.length,
      html: '<div class="stage einsetz"></div>',
      render(step, el) {
        let k = 0;
        const term = fmt(sim.term).replace(/<i>([a-z])<\/i>/g, (m, v) => {
          if (!(v in sim.vals)) return m;
          const val = sim.vals[v], txt = val < 0 ? '(' + String(val).replace('-', '−') + ')' : String(val);
          return '<span class="es-slot">' + (step >= 1 ? '<span class="ball' + (step === 1 ? ' drop" style="animation-delay:' + (k++ * 0.15) + 's' : '') + '">' + txt + '</span>' : '<i>' + v + '</i>') + '</span>';
        });
        el.querySelector('.einsetz').innerHTML = '<div class="xball">' + belegung + (step === 0 ? ' ⬇' : '') + '</div><div>' + term + '</div>' +
          '<div class="es-calc' + (step >= 2 ? ' show' : '') + '">= ' + fmt(sim.sub) + '</div>' +
          '<div class="es-calc res' + (step >= 3 ? ' show' : '') + '">= ' + fmt(sim.value) + '</div>';
        if (step === 1) fx.sfx.plop(); if (step === 3) fx.sfx.coin();
        return S[step];
      }
    };
  }

  const builders = { waage, flaeche, sort, einsetz };
  const titles = { waage: '⚖️ An der Waage erklärt', flaeche: '🟦 Am Flächenmodell erklärt', sort: '🧺 Mit der Sortiermaschine erklärt', einsetz: '🎯 Mit der Einsetzmaschine erklärt' };

  // Baut die Simulation in ein Element ein; gibt eine Aufräumfunktion zurück
  RM.sims = {
    supports: sim => !!(sim && builders[sim.type]),
    mount(host, sim) {
      const b = builders[sim.type](sim);
      host.innerHTML = '<div class="sim"><div class="sim-title">' + titles[sim.type] + '</div>' + b.html +
        '<p class="cap"></p><div class="ctrl"><button class="btn ghost small" data-sim="prev" aria-label="Schritt zurück">◀</button>' +
        '<button class="btn ghost small" data-sim="next">Weiter ▶</button><button class="btn small" data-sim="play">▶ Abspielen</button><span class="count"></span></div></div>';
      const el = host.firstChild;
      let step = 0, timer = null;
      const go = s => {
        step = Math.max(0, Math.min(b.n - 1, s));
        el.querySelector('.cap').innerHTML = b.render(step, el);
        el.querySelector('.count').textContent = 'Schritt ' + (step + 1) + ' / ' + b.n;
        el.querySelector('[data-sim="prev"]').disabled = step === 0;
        el.querySelector('[data-sim="next"]').disabled = step === b.n - 1;
      };
      el.addEventListener('click', e => {
        const btn = e.target.closest('[data-sim]');
        if (!btn) return;
        e.stopPropagation();
        clearInterval(timer);
        if (btn.dataset.sim === 'prev') go(step - 1);
        else if (btn.dataset.sim === 'next') go(step + 1);
        else { go(0); timer = setInterval(() => { if (step >= b.n - 1) return clearInterval(timer); go(step + 1); }, fx.isCalm() ? 1400 : 1900); }
      });
      go(0);
      return () => clearInterval(timer);
    },
    _helpers: { J, plain, Q }
  };
})(window.RM);
