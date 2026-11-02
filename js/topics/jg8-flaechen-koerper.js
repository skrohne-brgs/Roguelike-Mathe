// Thema: Flächen und Körper – Jahrgang 8 (Gymnasium Niedersachsen, Doppeljahrgang 7/8)
// Flächeninhalt von Dreieck, Parallelogramm, Trapez und zusammengesetzten Figuren; Prismen: Netz, Schrägbild, Volumen, Oberfläche.
// Kreis und Zylinder sind bewusst nicht enthalten (Doppeljahrgang 9/10).
(function (RM) {
  'use strict';
  const R = RM.rand, T = RM.T, F = RM.fig;
  const { Q, fmt, P } = T;

  // ---------- Zahlen, Einheiten, Aufgabenbaustein ----------
  const round6 = x => Math.round(x * 1e6) / 1e6;
  const q = x => new Q(Math.round(round6(x) * 1e6), 1e6);   // exakte Dezimalzahl
  const ds = x => String(round6(x));                           // Markup (Punkt wird als Komma gesetzt)
  const Z = x => fmt(ds(x));                                   // Zahl im Text
  const ZU = (x, u) => Z(x) + '&nbsp;' + u;                    // Zahl mit Einheit im Text
  const L = (x, u = 'cm') => F.num(x) + ' ' + u;               // Beschriftung in der Skizze
  const half = () => R.int(3, 19) + 0.5;                       // Dezimalzahl mit ,5
  const step = (html, note) => T.step(html, note);
  const mid = (p1, p2) => [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
  const eq = (s, u) => fmt(s) + (u ? '&nbsp;' + u : '');

  // Zahlaufgabe mit Einheit; o.value ist eine (Dezimal-)Zahl
  function geoTask(o) {
    return T.valueTask(Object.assign({ time: 75 }, o, { answer: q(o.value), answerHtml: ZU(o.value, o.unit), solutionInput: ds(o.value) }));
  }

  // Pythagoreische Tripel (Kathete, Kathete, Hypotenuse) – nur, damit schräge Seiten ganzzahlig beschriftet werden können
  const TRIPEL = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 6, 10], [4, 3, 5], [9, 12, 15], [12, 5, 13], [8, 15, 17], [12, 9, 15]];

  // ---------- Figuren ----------
  // Dreieck mit Grundseite g, Höhe h; Spitze bei x = p (p < 0 oder p > g: stumpfwinklig, Höhe außerhalb)
  function triFig(g, h, p, o = {}) {
    const A = [0, 0], B = [g, 0], Cc = [p, h];
    const S = new F.Scene();
    S.poly([A, B, Cc]);
    S.label(A, B, o.gLabel || 'g = ' + L(g), -1);
    // Beschriftung der Höhe dorthin, wo Platz ist (bei stumpfwinkligen Dreiecken nach außen)
    S.height(Cc, A, B, o.hLabel === undefined ? 'h = ' + L(h) : o.hLabel, p > g || (p >= 0 && p <= g / 2) ? -1 : 1);
    if (o.left) S.label(A, Cc, o.left, 1);
    if (o.right) S.label(B, Cc, o.right, -1);
    return S;
  }
  // Parallelogramm: Grundseite g, Höhe h, Versatz o der oberen Seite
  function paraFig(g, h, off, o = {}) {
    const A = [0, 0], B = [g, 0], Cc = [g + off, h], D = [off, h];
    const S = new F.Scene();
    S.poly([A, B, Cc, D]);
    S.label(A, B, o.gLabel || 'g = ' + L(g), -1);
    S.height(D, A, B, o.hLabel === undefined ? 'h = ' + L(h) : o.hLabel, -1);
    if (o.side) S.label(B, Cc, o.side, -1);
    return S;
  }
  // Trapez: untere Seite a, obere Seite c, Höhe h, obere Seite beginnt bei x = off
  function trapFig(a, c, h, off, o = {}) {
    const A = [0, 0], B = [a, 0], Cc = [off + c, h], D = [off, h];
    const S = new F.Scene();
    S.poly([A, B, Cc, D]);
    S.label(A, B, o.aLabel || 'a = ' + L(a), -1);
    S.label(D, Cc, o.cLabel || 'c = ' + L(c), 1);
    if (o.hLabel !== null) S.height(D, A, B, o.hLabel === undefined ? 'h = ' + L(h) : o.hLabel, -1);
    if (o.legs) { S.label(B, Cc, o.legs[1], -1); S.label(A, D, o.legs[0], 1); }
    return S;
  }
  // Querschnitt eines Grabens: oben breit (a), unten schmal (c), Tiefe h
  function grabenFig(a, c, h) {
    const o = (a - c) / 2, S = new F.Scene();
    S.poly([[o, 0], [o + c, 0], [a, h], [0, h]]);
    S.label([0, h], [a, h], L(a, 'm'), 1).label([o, 0], [o + c, 0], L(c, 'm'), -1);
    S.height([a / 2, 0], [0, h], [a, h], L(h, 'm'), -1);
    return S;
  }
  function rectFig(a, b, o = {}) {
    const S = new F.Scene();
    S.poly([[0, 0], [a, 0], [a, b], [0, b]]);
    S.label([0, 0], [a, 0], o.aLabel || L(a, o.u), -1);
    S.label([a, 0], [a, b], o.bLabel || L(b, o.u), -1);
    return S;
  }

  // ---------- Formelzeilen für Lösungswege ----------
  const triSteps = (g, h, u = 'cm') => [
    step('Formel: ' + fmt('A = [1/2] * g * h'), 'Ein Dreieck ist ein halbes Parallelogramm.'),
    step('Einsetzen: ' + fmt('A = [1/2] * ' + ds(g) + ' * ' + ds(h))),
    step('Ausrechnen: ' + eq('A = ' + ds(g * h / 2), u + '²'))
  ];
  const paraSteps = (g, h, u = 'cm') => [
    step('Formel: ' + fmt('A = g * h'), 'Grundseite mal zugehörige Höhe – nicht die schräge Seite!'),
    step('Einsetzen: ' + fmt('A = ' + ds(g) + ' * ' + ds(h))),
    step('Ausrechnen: ' + eq('A = ' + ds(g * h), u + '²'))
  ];
  const trapSteps = (a, c, h, u = 'cm') => [
    step('Formel: ' + fmt('A = [(a + c)/2] * h'), 'Mittelwert der parallelen Seiten mal Höhe'),
    step('Einsetzen: ' + fmt('A = [(' + ds(a) + ' + ' + ds(c) + ')/2] * ' + ds(h))),
    step('Ausrechnen: ' + fmt('A = ' + ds((a + c) / 2) + ' * ' + ds(h) + ' = ' + ds((a + c) / 2 * h)) + '&nbsp;' + u + '²')
  ];

  // ---------- Einheiten ----------
  const FL = ['mm²', 'cm²', 'dm²', 'm²', 'a', 'ha', 'km²'];       // Faktor 100
  const VOL = ['mm³', 'cm³', 'dm³', 'm³'];                        // Faktor 1000
  const convSteps = (v, from, to, f, unitsBetween) => {
    const up = f < 1;
    return [
      step('Umrechnungszahl: ' + unitsBetween),
      step((up ? 'In eine größere Einheit: durch ' + Z(1 / f) + ' teilen' : 'In eine kleinere Einheit: mit ' + Z(f) + ' multiplizieren') + ' → ' + ZU(v, from) + ' = ' + ZU(v * f, to))
    ];
  };

  // ---------- Würfelnetze ----------
  const { isCubeNet, shapeKey } = F;
  // Zufälliges zusammenhängendes Sechsling-Muster (Hexomino), normalisiert
  function hexomino() {
    const cells = [[0, 0]];
    const has = (x, y) => cells.some(c => c[0] === x && c[1] === y);
    while (cells.length < 6) {
      const c = R.pick(cells), [dx, dy] = R.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]);
      if (!has(c[0] + dx, c[1] + dy)) cells.push([c[0] + dx, c[1] + dy]);
    }
    const mx = Math.min(...cells.map(c => c[0])), my = Math.min(...cells.map(c => c[1]));
    const n = cells.map(c => [c[0] - mx, c[1] - my]);
    return Math.max(...n.map(c => c[0])) <= 4 && Math.max(...n.map(c => c[1])) <= 3 ? n : hexomino();
  }
  // Regelmäßiges n-Eck (für Schrägbilder von Prismen)
  const ngon = (n, r = 3) => Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + Math.PI / n + 2 * Math.PI * i / n;
    return [r * Math.cos(a), r * Math.sin(a)];
  });
  const ECKNAME = { 3: 'Dreieck', 4: 'Viereck', 5: 'Fünfeck', 6: 'Sechseck', 7: 'Siebeneck', 8: 'Achteck' };

  // Netze für „Welcher Körper entsteht?“
  function netFigure(kind) {
    if (kind === 'wuerfel') return F.cellsNet(R.pick([[[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]], [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [3, 2]], [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1], [3, 2]]]));
    if (kind === 'quader') { // Kreuz aus Rechtecken a × b × c
      const a = 2, b = 1.2, c = 3;
      return F.net([
        [[0, 0], [c, 0], [c, -a], [0, -a]], [[c, 0], [c + b, 0], [c + b, -a], [c, -a]], [[c + b, 0], [2 * c + b, 0], [2 * c + b, -a], [c + b, -a]],
        [[2 * c + b, 0], [2 * c + 2 * b, 0], [2 * c + 2 * b, -a], [2 * c + b, -a]], [[c, b], [c + b, b], [c + b, 0], [c, 0]], [[c, -a], [c + b, -a], [c + b, -a - b], [c, -a - b]]
      ]);
    }
    if (kind === 'prisma3') { // drei Rechtecke, zwei Dreiecke
      const s = 2, l = 4, hh = 1.73;
      return F.net([
        [[0, 0], [s, 0], [s, -l], [0, -l]], [[s, 0], [2 * s, 0], [2 * s, -l], [s, -l]], [[2 * s, 0], [3 * s, 0], [3 * s, -l], [2 * s, -l]],
        [[s, 0], [2 * s, 0], [1.5 * s, hh]], [[s, -l], [2 * s, -l], [1.5 * s, -l - hh]]
      ]);
    }
    if (kind === 'pyramide') { // Quadrat mit vier Dreiecken
      const s = 2, t = 1.8;
      return F.net([[[0, 0], [s, 0], [s, s], [0, s]], [[0, 0], [s, 0], [s / 2, -t]], [[s, 0], [s, s], [s + t, s / 2]], [[s, s], [0, s], [s / 2, s + t]], [[0, s], [0, 0], [-t, s / 2]]]);
    }
    // sechsseitiges Prisma: sechs Rechtecke, zwei Sechsecke
    const s = 1, l = 2.6, hx = ngon(6, 1).map(([x, y]) => [x, y]);
    const rects = Array.from({ length: 6 }, (_, i) => [[i * s, 0], [(i + 1) * s, 0], [(i + 1) * s, -l], [i * s, -l]]);
    const top = hx.map(([x, y]) => [x + 2.5 * s, y + 0.866]), bot = hx.map(([x, y]) => [x + 2.5 * s, y - l - 0.866]);
    return F.net(rects.concat([top, bot]));
  }
  const KOERPER = { wuerfel: 'Würfel', quader: 'Quader', prisma3: 'dreiseitiges Prisma', pyramide: 'quadratische Pyramide', prisma6: 'sechsseitiges Prisma' };

  // ================= Fähigkeiten =================
  const skills = {
    // ---------------- Ebene 1: Halle der Flächen ----------------
    einheiten_flaeche: {
      label: 'Flächeneinheiten umrechnen',
      kc: 'Größen und Messen', pk: 'Mit symbolischen, formalen und technischen Elementen umgehen', afb: 'I',
      gen(d) {
        let i, j, v;
        if (d === 1) { i = R.int(1, 3); j = i - 1; v = R.int(2, 40); }                       // eine Stufe kleiner
        else if (d === 2) {
          if (R.chance(0.5)) { i = R.int(0, 2); j = i + 1; v = R.int(11, 99) * 10 + R.pick([0, 5]); } // eine Stufe größer
          else { i = R.int(2, 3); j = i - 2; v = R.int(2, 9); }                                // zwei Stufen kleiner
        } else {
          if (R.chance(0.5)) { i = R.int(3, 5); j = i + 1 > 6 ? i - 1 : i + 1; v = i < j ? R.int(12, 95) * 100 : half(); }
          else { i = R.int(4, 5); j = i - 2; v = R.pick([1.5, 2.5, 0.8, 3.2, 0.25, 1.75]); }
        }
        const f = Math.pow(100, i - j), res = v * f;
        const nameBetween = 'zwischen benachbarten Flächeneinheiten 100 (' + FL.slice(Math.min(i, j), Math.max(i, j) + 1).join(' → ') + ')';
        return geoTask({
          prompt: 'Rechne um: ' + ZU(v, FL[i]) + ' = ? ' + FL[j], value: res, unit: FL[j], time: [30, 45, 60][d - 1],
          hint: 'Bei Flächeneinheiten ist die Umrechnungszahl 100 (nicht 10!), denn 1 cm² = 10 mm · 10 mm = 100 mm². 1 a = 100 m², 1 ha = 100 a.',
          steps: convSteps(v, FL[i], FL[j], f, nameBetween)
        });
      }
    },

    rechteck: {
      label: 'Rechteck und Quadrat',
      kc: 'Größen und Messen', pk: 'Mit symbolischen, formalen und technischen Elementen umgehen', afb: 'I',
      gen(d) {
        let a = R.int(3, 15), b = R.int(2, 12);
        if (d === 2) a = half();
        const kind = d === 3 ? R.pick(['seite', 'quadrat', 'seiteU']) : R.pick(['A', 'u']);
        if (kind === 'A' || kind === 'u') {
          const isA = kind === 'A';
          return geoTask({
            prompt: 'Berechne den ' + (isA ? 'Flächeninhalt' : 'Umfang') + ' des Rechtecks.', figure: rectFig(a, b).svg(),
            value: isA ? a * b : 2 * (a + b), unit: isA ? 'cm²' : 'cm', time: [40, 60][d - 1],
            hint: isA ? 'Flächeninhalt: Länge mal Breite.' : 'Umfang: alle Seiten addieren – also 2 · Länge + 2 · Breite.',
            steps: isA ? [step(fmt('A = a * b = ' + ds(a) + ' * ' + b + ' = ' + ds(a * b)) + '&nbsp;cm²')]
              : [step(fmt('u = 2 * a + 2 * b = 2 * ' + ds(a) + ' + 2 * ' + b + ' = ' + ds(2 * (a + b))) + '&nbsp;cm')]
          });
        }
        if (kind === 'quadrat') {
          const s = R.int(3, 12);
          return geoTask({
            prompt: 'Ein Quadrat hat den Umfang ' + ZU(4 * s, 'cm') + '. Berechne seinen Flächeninhalt.', value: s * s, unit: 'cm²', time: 75,
            hint: 'Bestimme zuerst die Seitenlänge: Ein Quadrat hat vier gleich lange Seiten.',
            steps: [step('Seitenlänge: ' + fmt(4 * s + ' : 4 = ' + s) + '&nbsp;cm'), step(fmt('A = ' + s + ' * ' + s + ' = ' + s * s) + '&nbsp;cm²')]
          });
        }
        const A = a * b;
        if (kind === 'seiteU') {
          const u = 2 * (a + b);
          return geoTask({
            prompt: 'Ein Rechteck hat den Umfang ' + ZU(u, 'cm') + ' und ist ' + ZU(a, 'cm') + ' lang. Wie breit ist es?',
            figure: rectFig(a, b, { bLabel: 'b = ?' }).svg(), value: b, unit: 'cm', time: 75,
            hint: 'Der halbe Umfang ist Länge plus Breite.',
            steps: [step('Halber Umfang: ' + fmt(u + ' : 2 = ' + (u / 2)) + '&nbsp;cm = Länge + Breite'), step(fmt('b = ' + (u / 2) + ' - ' + a + ' = ' + b) + '&nbsp;cm')]
          });
        }
        return geoTask({
          prompt: 'Ein Rechteck hat den Flächeninhalt ' + ZU(A, 'cm²') + ' und ist ' + ZU(a, 'cm') + ' lang. Wie breit ist es?',
          figure: rectFig(a, b, { bLabel: 'b = ?' }).svg(), value: b, unit: 'cm', time: 75,
          hint: 'Aus A = a · b folgt b = A : a.',
          steps: [step(fmt('A = a * b') + ', also ' + fmt('b = A : a')), step(fmt('b = ' + A + ' : ' + a + ' = ' + b) + '&nbsp;cm')]
        });
      }
    },

    dreieck: {
      label: 'Flächeninhalt von Dreiecken',
      kc: 'Größen und Messen', pk: 'Mit symbolischen, formalen und technischen Elementen umgehen', afb: 'I–II',
      gen(d) {
        let g, h, p, o = {};
        if (d === 1) { g = R.int(2, 9) * 2; h = R.int(3, 12); p = Math.round(g * (0.25 + Math.random() * 0.5)); }
        else if (d === 2) { g = R.int(4, 14); h = R.chance(0.5) ? half() : R.int(3, 13); p = R.chance(0.5) ? g + R.int(2, 4) : -R.int(2, 4); }
        else {
          // mit überflüssiger Seitenlänge als Ablenkung
          const [pp, hh, s] = R.pick(TRIPEL);
          h = hh; p = pp; g = pp + R.int(3, 10);
          o.left = L(s);
          o.right = null;
        }
        const S = triFig(g, h, p, o);
        return geoTask({
          prompt: 'Berechne den Flächeninhalt des Dreiecks.', figure: S.svg(), value: g * h / 2, unit: 'cm²', time: [50, 70, 80][d - 1],
          sim: { type: 'zerlegen', kind: 'dreieck', g, h, p },
          hint: 'A = ½ · g · h. Die Höhe steht senkrecht auf der Grundseite – bei stumpfwinkligen Dreiecken liegt sie außerhalb.' + (d === 3 ? ' Nicht jede angegebene Länge wird gebraucht!' : ''),
          steps: triSteps(g, h)
        });
      }
    },

    parallelogramm: {
      label: 'Flächeninhalt von Parallelogrammen',
      kc: 'Größen und Messen', pk: 'Mit symbolischen, formalen und technischen Elementen umgehen', afb: 'I–II',
      gen(d) {
        let g = R.int(4, 14), h = R.int(3, 10), off = R.int(2, 4), o = {};
        if (d === 2) { if (R.chance(0.5)) g = half(); else h = half(); }
        if (d === 3) { const [oo, hh, s] = R.pick(TRIPEL); off = oo; h = hh; g = oo + R.int(4, 10); o.side = L(s); }
        return geoTask({
          prompt: 'Berechne den Flächeninhalt des Parallelogramms.', figure: paraFig(g, h, off, o).svg(), value: g * h, unit: 'cm²', time: [45, 60, 70][d - 1],
          sim: off < g ? { type: 'zerlegen', kind: 'parallelogramm', g, h, p: off } : null,
          hint: 'Schneidet man links ein Dreieck ab und legt es rechts an, entsteht ein Rechteck: A = g · h.' + (d === 3 ? ' Die schräge Seite ist nicht die Höhe!' : ''),
          steps: paraSteps(g, h)
        });
      }
    },

    trapez: {
      label: 'Flächeninhalt von Trapezen',
      kc: 'Größen und Messen', pk: 'Mit symbolischen, formalen und technischen Elementen umgehen', afb: 'II',
      gen(d) {
        let c = R.int(3, 9), a = c + R.int(2, 6) * 2, h = R.int(3, 9), off = (a - c) / 2, o = {};
        if (d === 1 && R.chance(0.5)) off = 0;                                  // rechtwinkliges Trapez
        if (d === 2) { h = R.chance(0.5) ? half() : R.int(4, 11); off = R.int(0, a - c); a += R.pick([0, 1]); }
        if (d === 3) { const k = R.pick([1, 2]); h = 4 * k; off = 3 * k; a = c + 6 * k; o.legs = [L(5 * k), L(5 * k)]; }
        return geoTask({
          prompt: 'Berechne den Flächeninhalt des Trapezes.', figure: trapFig(a, c, h, off, o).svg(), value: (a + c) / 2 * h, unit: 'cm²', time: [60, 75, 80][d - 1],
          sim: { type: 'zerlegen', kind: 'trapez', a, c, h, p: off },
          hint: 'A = (a + c) : 2 · h – a und c sind die beiden parallelen Seiten.' + (d === 3 ? ' Die schrägen Seiten brauchst du nicht.' : ''),
          steps: trapSteps(a, c, h)
        });
      }
    },

    ansatz: {
      label: 'Richtigen Ansatz wählen',
      kc: 'Größen und Messen', pk: 'Mathematisch argumentieren', afb: 'II',
      gen(d) {
        const kind = d === 1 ? R.pick(['dreieck', 'para']) : R.pick(['dreieck', 'para', 'trapez']);
        let fig, options, steps;
        if (kind === 'dreieck') {
          const [pp, h, s] = R.pick(TRIPEL), g = pp + R.int(3, 8);
          fig = triFig(g, h, pp, { left: L(s) });
          options = [
            { html: fmt('[1/2] * ' + g + ' * ' + h), correct: true },
            { html: fmt('[1/2] * ' + g + ' * ' + s) },
            { html: fmt(g + ' * ' + h) },
            { html: fmt(g + ' + ' + h + ' + ' + s) }
          ];
          steps = [step('Dreieck: ' + fmt('A = [1/2] * g * h') + '. Die Höhe (' + ZU(h, 'cm') + ') steht senkrecht auf der Grundseite, die Seite ' + ZU(s, 'cm') + ' ist schräg.')];
        } else if (kind === 'para') {
          const [off, h, s] = R.pick(TRIPEL), g = off + R.int(4, 9);
          fig = paraFig(g, h, off, { side: L(s) });
          options = [
            { html: fmt(g + ' * ' + h), correct: true },
            { html: fmt(g + ' * ' + s) },
            { html: fmt('[1/2] * ' + g + ' * ' + h) },
            { html: fmt('2 * ' + g + ' + 2 * ' + s) }
          ];
          steps = [step('Parallelogramm: ' + fmt('A = g * h') + ' mit der Höhe ' + ZU(h, 'cm') + ' – nicht mit der schrägen Seite.')];
        } else {
          const k = R.pick([1, 2]), h = 4 * k, c = R.int(3, 8), a = c + 6 * k;
          fig = trapFig(a, c, h, 3 * k, { legs: [L(5 * k), L(5 * k)] });
          options = [
            { html: fmt('[(' + a + ' + ' + c + ')/2] * ' + h), correct: true },
            { html: fmt('(' + a + ' + ' + c + ') * ' + h) },
            { html: fmt('[(' + a + ' + ' + c + ')/2] * ' + 5 * k) },
            { html: fmt(a + ' * ' + c + ' * ' + h) }
          ];
          steps = [step('Trapez: ' + fmt('A = [(a + c)/2] * h') + ' – Mittelwert der parallelen Seiten mal Höhe.')];
        }
        return T.choiceTask({
          prompt: 'Mit welchem Ansatz berechnet man den Flächeninhalt (in cm²) richtig?', figure: fig.svg(), time: 45, options,
          hint: 'Achte darauf, welche Strecke senkrecht auf der Grundseite steht, und ob die Formel ein ½ enthält.', steps
        });
      }
    },

    // ---------------- Ebene 2: Labyrinth der Vielecke ----------------
    zusammengesetzt: {
      label: 'Zusammengesetzte Flächen',
      kc: 'Größen und Messen', pk: 'Probleme mathematisch lösen', afb: 'II',
      gen(d) {
        let fig, sol, value, steps, hint;
        if (d === 1) {
          // L-Form: Rechteck W × H, oben rechts fehlt w × h
          const W = R.int(8, 14), H = R.int(7, 12), w = R.int(3, W - 3), h = R.int(3, H - 2);
          const pts = [[0, 0], [W, 0], [W, H - h], [W - w, H - h], [W - w, H], [0, H]];
          const lab = { 0: L(W), 1: L(H - h), 2: L(w), 3: L(h), 4: L(W - w), 5: L(H) };
          fig = F.polygonFigure(pts, lab);
          sol = F.polygonFigure(pts, lab);
          sol.line([W - w, 0], [W - w, H - h], { color: F.C.height, dash: true });
          sol.text([(W - w) / 2, H / 2], 'A₁', { color: F.C.height }).text([W - w / 2, (H - h) / 2], 'A₂', { color: F.C.height });
          value = W * H - w * h;
          const A1 = (W - w) * H, A2 = w * (H - h);
          steps = [step('Zerlege die Figur in zwei Rechtecke (gestrichelte Linie).'),
            step('A₁: ' + fmt((W - w) + ' * ' + H + ' = ' + A1) + '&nbsp;cm², &nbsp;A₂: ' + fmt(w + ' * ' + (H - h) + ' = ' + A2) + '&nbsp;cm²'),
            step(fmt('A = ' + A1 + ' + ' + A2 + ' = ' + value) + '&nbsp;cm²', 'Alternativ: großes Rechteck minus fehlendes Stück: ' + W * H + ' − ' + w * h)];
          hint = 'Zerlege die Figur in zwei Rechtecke – oder rechne „großes Rechteck minus fehlendes Stück“.';
        } else if (d === 2) {
          // Haus: Rechteck mit Dreieck als Giebel
          const W = R.int(3, 8) * 2, H = R.int(5, 10), t = R.int(3, 7);
          const pts = [[0, 0], [W, 0], [W, H], [W / 2, H + t], [0, H]];
          const make = () => { const S = F.polygonFigure(pts, { 0: L(W), 1: L(H) }); S.line([0, H], [W, H], { color: F.C.hidden, dash: true, w: 1.6 }); S.height([W / 2, H + t], [0, H], [W, H], L(t), -1); return S; };
          fig = make(); sol = make();
          value = W * H + W * t / 2;
          steps = [step('Rechteck: ' + fmt(W + ' * ' + H + ' = ' + W * H) + '&nbsp;cm²'), step('Dreieck (Giebel): ' + fmt('[1/2] * ' + W + ' * ' + t + ' = ' + (W * t / 2)) + '&nbsp;cm²'), step('Zusammen: ' + fmt(W * H + ' + ' + (W * t / 2) + ' = ' + value) + '&nbsp;cm²')];
          hint = 'Rechteck plus Dreieck. Die Grundseite des Dreiecks ist so breit wie das Rechteck.';
        } else {
          const kind = R.pick(['rahmen', 'kerbe', 'trapezdach']);
          if (kind === 'rahmen') {
            const W = R.int(9, 15), H = R.int(7, 12), w = R.int(3, W - 4), h = R.int(2, H - 4), x0 = R.int(1, W - w - 1), y0 = R.int(1, H - h - 1);
            const make = () => {
              const S = F.polygonFigure([[0, 0], [W, 0], [W, H], [0, H]], { 0: L(W), 1: L(H) });
              S.poly([[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]], { fill: '#1d1828' });
              S.label([x0, y0 + h], [x0 + w, y0 + h], L(w), 1).label([x0 + w, y0], [x0 + w, y0 + h], L(h), 1);
              return S;
            };
            fig = make(); sol = make();
            value = W * H - w * h;
            steps = [step('Großes Rechteck: ' + fmt(W + ' * ' + H + ' = ' + W * H) + '&nbsp;cm²'), step('Loch: ' + fmt(w + ' * ' + h + ' = ' + w * h) + '&nbsp;cm²'), step('Rahmen: ' + fmt(W * H + ' - ' + w * h + ' = ' + value) + '&nbsp;cm²')];
            hint = 'Ergänzen statt zerlegen: ganze Fläche minus Loch.';
          } else if (kind === 'kerbe') {
            const W = R.int(3, 7) * 2, H = R.int(7, 12), t = R.int(2, H - 3);
            const pts = [[0, 0], [W, 0], [W, H], [W / 2, H - t], [0, H]];
            const make = () => { const S = F.polygonFigure(pts, { 0: L(W), 1: L(H) }); S.line([0, H], [W, H], { color: F.C.hidden, dash: true, w: 1.6 }); S.height([W / 2, H - t], [W, H], [0, H], L(t), -1); return S; };
            fig = make(); sol = make();
            value = W * H - W * t / 2;
            steps = [step('Rechteck: ' + fmt(W + ' * ' + H + ' = ' + W * H) + '&nbsp;cm²'), step('Ausgeschnittenes Dreieck: ' + fmt('[1/2] * ' + W + ' * ' + t + ' = ' + W * t / 2) + '&nbsp;cm²'), step(fmt(W * H + ' - ' + W * t / 2 + ' = ' + value) + '&nbsp;cm²')];
            hint = 'Rechteck minus ausgeschnittenes Dreieck.';
          } else {
            const c = R.int(2, 6), W = c + R.int(2, 4) * 2, H = R.int(4, 9), t = R.int(2, 6);
            const pts = [[0, 0], [W, 0], [W, H], [(W + c) / 2, H + t], [(W - c) / 2, H + t], [0, H]];
            const make = () => { const S = F.polygonFigure(pts, { 0: L(W), 1: L(H), 3: L(c) }); S.line([0, H], [W, H], { color: F.C.hidden, dash: true, w: 1.6 }); S.height([(W - c) / 2, H + t], [0, H], [W, H], L(t), 1); return S; };
            fig = make(); sol = make();
            value = W * H + (W + c) / 2 * t;
            steps = [step('Rechteck: ' + fmt(W + ' * ' + H + ' = ' + W * H) + '&nbsp;cm²'), step('Trapez: ' + fmt('[(' + W + ' + ' + c + ')/2] * ' + t + ' = ' + ds((W + c) / 2 * t)) + '&nbsp;cm²'), step('Zusammen: ' + fmt(W * H + ' + ' + ds((W + c) / 2 * t) + ' = ' + ds(value)) + '&nbsp;cm²')];
            hint = 'Unten ein Rechteck, oben ein Trapez – die lange parallele Seite ist so breit wie das Rechteck.';
          }
        }
        return geoTask({ prompt: 'Berechne den Flächeninhalt der Figur.', figure: fig.svg(), figureSolution: sol.svg(), value, unit: 'cm²', time: [80, 90, 100][d - 1], hint, steps });
      }
    },

    rueckwaerts: {
      label: 'Fehlende Größen berechnen',
      kc: 'Größen und Messen', pk: 'Probleme mathematisch lösen', afb: 'II',
      gen(d) {
        const kind = d === 1 ? R.pick(['para_g', 'para_h', 'dreieck_h']) : d === 2 ? R.pick(['dreieck_h', 'dreieck_g', 'trapez_h']) : R.pick(['trapez_h', 'trapez_c']);
        if (kind.startsWith('para')) {
          const g = R.int(4, 13), h = R.int(3, 10), A = g * h, findG = kind === 'para_g';
          return geoTask({
            prompt: 'Ein Parallelogramm hat den Flächeninhalt ' + ZU(A, 'cm²') + '. Berechne die fehlende Länge.',
            figure: paraFig(g, h, R.int(2, 4), findG ? { gLabel: 'g = ?' } : { hLabel: 'h = ?' }).svg(), value: findG ? g : h, unit: 'cm', time: 60,
            hint: 'Aus A = g · h folgt ' + (findG ? 'g = A : h' : 'h = A : g') + '.',
            steps: [step(fmt('A = g * h') + ' &nbsp;⇒&nbsp; ' + fmt(findG ? 'g = A : h' : 'h = A : g')), step(fmt((findG ? 'g = ' : 'h = ') + A + ' : ' + (findG ? h : g) + ' = ' + (findG ? g : h)) + '&nbsp;cm')]
          });
        }
        if (kind.startsWith('dreieck')) {
          const g = R.int(3, 14), h = R.int(2, 9) * 2, A = g * h / 2, findG = kind === 'dreieck_g';
          return geoTask({
            prompt: 'Ein Dreieck hat den Flächeninhalt ' + ZU(A, 'cm²') + '. Berechne die fehlende Länge.',
            figure: triFig(g, h, Math.round(g * 0.4), findG ? { gLabel: 'g = ?' } : { hLabel: 'h = ?' }).svg(), value: findG ? g : h, unit: 'cm', time: 75,
            hint: 'Aus A = ½ · g · h folgt ' + (findG ? 'g = 2 · A : h' : 'h = 2 · A : g') + '. Das Verdoppeln nicht vergessen!',
            steps: [step(fmt('A = [1/2] * g * h') + ' &nbsp;⇒&nbsp; ' + fmt('2 * A = g * h')), step(fmt('2 * ' + ds(A) + ' = ' + (2 * A)) + '&nbsp;cm²'), step(fmt((findG ? 'g = ' : 'h = ') + 2 * A + ' : ' + (findG ? h : g) + ' = ' + (findG ? g : h)) + '&nbsp;cm')]
          });
        }
        const c = R.int(2, 8), a = c + R.int(1, 5) * 2, h = R.int(2, 9), A = (a + c) / 2 * h, findC = kind === 'trapez_c';
        return geoTask({
          prompt: 'Ein Trapez hat den Flächeninhalt ' + ZU(A, 'cm²') + '. Berechne die fehlende Länge.',
          figure: trapFig(a, c, h, (a - c) / 2, findC ? { cLabel: 'c = ?' } : { hLabel: 'h = ?' }).svg(), value: findC ? c : h, unit: 'cm', time: 100,
          hint: findC ? 'A : h ergibt den Mittelwert (a + c) : 2. Verdopple ihn und ziehe a ab.' : 'Teile den Flächeninhalt durch den Mittelwert der parallelen Seiten (a + c) : 2.',
          steps: findC
            ? [step(fmt('[(a + c)/2] = A : h = ' + ds(A) + ' : ' + h + ' = ' + ds((a + c) / 2))), step(fmt('a + c = ' + (a + c))), step(fmt('c = ' + (a + c) + ' - ' + a + ' = ' + c) + '&nbsp;cm')]
            : [step('Mittelwert der parallelen Seiten: ' + fmt('[(' + a + ' + ' + c + ')/2] = ' + ds((a + c) / 2))), step(fmt('h = A : ' + ds((a + c) / 2) + ' = ' + ds(A) + ' : ' + ds((a + c) / 2) + ' = ' + h) + '&nbsp;cm')]
        });
      }
    },

    formel_term: {
      label: 'Flächen mit Variablen (Terme)',
      kc: 'Zahlen und Operationen / Größen und Messen', pk: 'Mathematisch modellieren', afb: 'II',
      gen(d) {
        const X = 6; // Zeichenlänge für x
        let fig, sol, prompt = 'Gib einen Term für den Flächeninhalt der Figur an (Längen in cm).', steps;
        if (d === 1) {
          const k = R.int(2, 9);
          if (R.chance(0.5)) {
            fig = rectFig(X, k, { aLabel: 'x', bLabel: L(k) }); sol = k + 'x';
            steps = [step(fmt('A = x * ' + k + ' = ' + k + 'x'))];
          } else {
            fig = rectFig(X, k, { aLabel: 'x', bLabel: L(k) }); sol = '2x + ' + 2 * k; prompt = 'Gib einen Term für den <b>Umfang</b> des Rechtecks an (Längen in cm).';
            steps = [step(fmt('u = 2 * x + 2 * ' + k + ' = 2x + ' + 2 * k))];
          }
        } else if (d === 2) {
          if (R.chance(0.5)) {
            const g = R.int(2, 7) * 2;
            fig = triFig(g, X, g * 0.4, { hLabel: 'x' }); sol = (g / 2) + 'x';
            steps = [step(fmt('A = [1/2] * ' + g + ' * x = ' + g / 2 + 'x'))];
          } else {
            const k = R.int(1, 4) * 2, h = R.int(2, 6);
            fig = trapFig(X + k, X, h, k / 2, { aLabel: 'x + ' + k, cLabel: 'x', hLabel: L(h) }); sol = h + 'x + ' + (h * k / 2);
            steps = [step(fmt('A = [(x + ' + k + ' + x)/2] * ' + h + ' = (x + ' + k / 2 + ') * ' + h)), step(fmt('A = ' + h + 'x + ' + h * k / 2))];
          }
        } else {
          const kind = R.pick(['quadratdach', 'rechteckloch', 'lform']);
          if (kind === 'quadratdach') {
            const t = R.int(1, 4) * 2;
            const S = F.polygonFigure([[0, 0], [X, 0], [X, X], [X / 2, X + t], [0, X]], { 0: 'x', 1: 'x' });
            S.line([0, X], [X, X], { color: F.C.hidden, dash: true, w: 1.6 }); S.height([X / 2, X + t], [0, X], [X, X], L(t), -1);
            fig = S; sol = 'x^2 + ' + t / 2 + 'x';
            steps = [step('Quadrat: ' + fmt('x * x = x^2')), step('Dreieck: ' + fmt('[1/2] * x * ' + t + ' = ' + t / 2 + 'x')), step(fmt('A = x^2 + ' + t / 2 + 'x'))];
          } else if (kind === 'rechteckloch') {
            const k = R.int(2, 3);
            const S = F.polygonFigure([[0, 0], [2 * X, 0], [2 * X, X], [0, X]], { 0: '2x', 1: 'x' });
            S.poly([[X - k / 2, X / 2 - k / 2], [X + k / 2, X / 2 - k / 2], [X + k / 2, X / 2 + k / 2], [X - k / 2, X / 2 + k / 2]], { fill: '#1d1828' });
            S.label([X - k / 2, X / 2 - k / 2], [X + k / 2, X / 2 - k / 2], L(k), -1);
            fig = S; sol = '2x^2 - ' + k * k; prompt = 'Aus einem Rechteck wird ein Quadrat ausgeschnitten. Gib einen Term für den Flächeninhalt der übrigen Fläche an (Längen in cm).';
            steps = [step('Rechteck: ' + fmt('2x * x = 2x^2')), step('Quadrat: ' + fmt(k + ' * ' + k + ' = ' + k * k)), step(fmt('A = 2x^2 - ' + k * k))];
          } else {
            const k = R.int(2, 5);
            const S = F.polygonFigure([[0, 0], [X + k, 0], [X + k, k], [X, k], [X, X], [0, X]], { 0: 'x + ' + k, 1: L(k), 4: '', 5: 'x' });
            S.label([X, k], [X, X], 'x − ' + k, -1);
            fig = S; sol = 'x^2 + ' + k * k; prompt = 'Gib einen Term für den Flächeninhalt der Figur an (Längen in cm). Die Figur besteht aus einem Quadrat und einem kleinen Quadrat.';
            steps = [step('Großes Quadrat: ' + fmt('x * x = x^2')), step('Kleines Quadrat rechts unten: ' + fmt(k + ' * ' + k + ' = ' + k * k)), step(fmt('A = x^2 + ' + k * k))];
          }
        }
        return T.termTask({
          prompt, figure: fig.svg(), answer: P(sol), mode: 'equiv', vars: ['x'], time: [50, 70, 90][d - 1], unit: d === 1 && /Umfang/.test(prompt) ? 'cm' : 'cm²',
          hint: 'Rechne wie mit Zahlen – nur dass eine Länge x heißt. Gleichwertige Terme werden erkannt.',
          steps
        });
      }
    },

    fehler_flaeche: {
      label: 'Fehler in Flächenrechnungen finden',
      kc: 'Größen und Messen', pk: 'Mathematisch argumentieren', afb: 'II–III',
      gen(d) {
        const ERR = {
          seite: 'Statt der Höhe wurde die schräge Seite verwendet.',
          halb: 'Der Faktor ½ (das Halbieren) fehlt.',
          einheit: 'Die Einheit ist falsch: Flächeninhalte haben die Einheit cm².',
          rechen: 'Es gibt einen Rechenfehler beim Multiplizieren.',
          mal: 'Die parallelen Seiten wurden multipliziert statt addiert.',
          richtig: 'Die Rechnung ist richtig.'
        };
        const kind = R.pick(d === 1 ? ['dreieck', 'para'] : ['dreieck', 'para', 'trapez']);
        let fig, calc, err, pool, right;
        if (kind === 'dreieck') {
          const [pp, h, s] = R.pick(TRIPEL), g = pp + R.int(3, 8) * 2 - (pp % 2);
          fig = triFig(g, h, pp, { left: L(s) });
          err = R.pick(d === 1 ? ['seite', 'halb', 'richtig'] : ['seite', 'halb', 'einheit', 'rechen', 'richtig']);
          right = g * h / 2;
          calc = {
            seite: fmt('A = [1/2] * ' + g + ' * ' + s + ' = ' + ds(g * s / 2)) + ' cm²', halb: fmt('A = ' + g + ' * ' + h + ' = ' + g * h) + ' cm²',
            einheit: fmt('A = [1/2] * ' + g + ' * ' + h + ' = ' + ds(right)) + ' cm', rechen: fmt('A = [1/2] * ' + g + ' * ' + h + ' = ' + ds(right + R.pick([-2, 2, 4]))) + ' cm²',
            richtig: fmt('A = [1/2] * ' + g + ' * ' + h + ' = ' + ds(right)) + ' cm²'
          }[err];
          pool = ['seite', 'halb', 'einheit', 'rechen', 'richtig'];
        } else if (kind === 'para') {
          const [off, h, s] = R.pick(TRIPEL), g = off + R.int(4, 9);
          fig = paraFig(g, h, off, { side: L(s) });
          err = R.pick(['seite', 'halb', 'einheit', 'richtig']);
          right = g * h;
          calc = {
            seite: fmt('A = ' + g + ' * ' + s + ' = ' + g * s) + ' cm²', halb: fmt('A = [1/2] * ' + g + ' * ' + h + ' = ' + ds(g * h / 2)) + ' cm²',
            einheit: fmt('A = ' + g + ' * ' + h + ' = ' + right) + ' cm', richtig: fmt('A = ' + g + ' * ' + h + ' = ' + right) + ' cm²'
          }[err];
          pool = ['seite', 'einheit', 'rechen', 'richtig'];
          if (err === 'halb') { ERR.halb = 'Beim Parallelogramm wird nicht halbiert – der Faktor ½ ist falsch.'; pool = ['seite', 'halb', 'einheit', 'richtig']; }
        } else {
          const k = R.pick([1, 2]), h = 4 * k, c = R.int(3, 8), a = c + 6 * k;
          fig = trapFig(a, c, h, 3 * k, { legs: [L(5 * k), L(5 * k)] });
          err = R.pick(['halb', 'mal', 'seite', 'richtig']);
          right = (a + c) / 2 * h;
          calc = {
            halb: fmt('A = (' + a + ' + ' + c + ') * ' + h + ' = ' + (a + c) * h) + ' cm²', mal: fmt('A = [' + a + ' * ' + c + '/2] * ' + h + ' = ' + ds(a * c / 2 * h)) + ' cm²',
            seite: fmt('A = [(' + a + ' + ' + c + ')/2] * ' + 5 * k + ' = ' + ds((a + c) / 2 * 5 * k)) + ' cm²', richtig: fmt('A = [(' + a + ' + ' + c + ')/2] * ' + h + ' = ' + ds(right)) + ' cm²'
          }[err];
          pool = ['halb', 'mal', 'seite', 'richtig'];
        }
        const others = R.shuffle(pool.filter(e => e !== err)).slice(0, 3);
        const name = kind === 'dreieck' ? 'Dreiecks' : kind === 'para' ? 'Parallelogramms' : 'Trapezes';
        return T.choiceTask({
          prompt: 'Mia hat den Flächeninhalt des ' + name + ' so berechnet: <div class="step">' + calc + '</div>Was stimmt?',
          figure: fig.svg(), time: 60,
          options: [{ html: ERR[err], correct: true }].concat(others.map(e => ({ html: ERR[e] }))),
          hint: 'Prüfe nacheinander: richtige Formel? richtige Strecken? richtig gerechnet? richtige Einheit?',
          steps: [step('Richtig wäre: ' + fmt('A = ' + ds(right)) + '&nbsp;cm²'), step(ERR[err])]
        });
      }
    },

    // ---------------- Ebene 3: Kammer der Prismen ----------------
    koerper: {
      label: 'Prismen, Netze und Schrägbilder',
      kc: 'Raum und Form', pk: 'Mit symbolischen, formalen und technischen Elementen umgehen', afb: 'I–II',
      gen(d) {
        if (d === 1) {
          const n = R.int(3, 8), what = R.pick(['Ecken', 'Kanten', 'Flächen']);
          const val = { Ecken: 2 * n, Kanten: 3 * n, Flächen: n + 2 }[what];
          return T.valueTask({
            prompt: 'Ein Prisma hat als Grundfläche ein ' + ECKNAME[n] + '. Wie viele <b>' + what + '</b> hat es?',
            figure: F.prism(ngon(n), 6).svg(320, 220), answer: new Q(val), time: 45,
            hint: 'Ein Prisma hat zwei gleiche Grundflächen (unten und oben bzw. vorne und hinten), die durch Rechtecke verbunden sind.',
            steps: [step('Ecken: 2 · ' + n + ' = ' + 2 * n + ' (vorne und hinten je ' + n + ')'), step('Kanten: 3 · ' + n + ' = ' + 3 * n + ' (zwei Grundflächen und ' + n + ' Verbindungskanten)'), step('Flächen: ' + n + ' + 2 = ' + (n + 2) + ' (' + n + ' Rechtecke und 2 Grundflächen)')]
          });
        }
        if (d === 2) {
          const kind = R.pick(Object.keys(KOERPER));
          const names = [kind].concat(R.shuffle(Object.keys(KOERPER).filter(k => k !== kind)).slice(0, 3));
          return T.choiceTask({
            prompt: 'Welcher Körper entsteht, wenn man dieses Netz faltet?', figure: netFigure(kind).svg(360, 240), time: 40,
            options: names.map((k, i) => ({ html: KOERPER[k], correct: i === 0 })),
            hint: 'Zähle die Flächen und schau dir ihre Form an: Rechtecke, Quadrate, Dreiecke?',
            steps: [step('Das Netz ergibt einen <b>' + KOERPER[kind] + '</b>.'), step({ wuerfel: '6 gleich große Quadrate.', quader: '6 Rechtecke, je zwei gleich.', prisma3: '2 Dreiecke als Grundflächen und 3 Rechtecke als Mantel.', pyramide: '1 Quadrat als Grundfläche, 4 Dreiecke treffen sich in der Spitze.', prisma6: '2 Sechsecke als Grundflächen und 6 Rechtecke als Mantel.' }[kind])]
          });
        }
        // Welches Netz ergibt einen Würfel?
        let good;
        do good = hexomino(); while (!isCubeNet(good));
        const bad = [], keys = new Set([shapeKey(good)]);
        while (bad.length < 3) {
          const b = hexomino(), k = shapeKey(b);
          if (!isCubeNet(b) && !keys.has(k)) { keys.add(k); bad.push(b); }
        }
        return T.choiceTask({
          prompt: 'Aus welchem Netz lässt sich ein <b>Würfel</b> falten?', time: 60,
          options: [{ html: F.cellsNet(good).svg(200, 160), correct: true }].concat(bad.map(b => ({ html: F.cellsNet(b).svg(200, 160) }))),
          hint: 'Stell dir vor, du faltest das Netz um ein Quadrat herum. Keine zwei Quadrate dürfen aufeinander landen – und es dürfen nie vier Quadrate in einer Reihe plus zwei auf derselben Seite sein.',
          steps: [step('Falte in Gedanken: Wähle ein Quadrat als Boden und klappe die anderen hoch. Beim richtigen Netz landet jedes Quadrat auf einer anderen Würfelseite.'), step('Es gibt genau 11 verschiedene Würfelnetze. Tipp: Schneide Netze aus Kästchenpapier aus und probiere es aus!')]
        });
      }
    },

    einheiten_volumen: {
      label: 'Volumeneinheiten und Liter',
      kc: 'Größen und Messen', pk: 'Mit symbolischen, formalen und technischen Elementen umgehen', afb: 'I',
      gen(d) {
        // Einheiten mit Exponent zur Basis cm³: mm³ = −3, cm³ = ml = 0, dm³ = l = 3, m³ = 6
        const U = { 'mm³': -3, 'cm³': 0, 'ml': 0, 'dm³': 3, 'l': 3, 'm³': 6, 'hl': 5 };
        let from, to, v;
        if (d === 1) { [from, to] = R.pick([['dm³', 'cm³'], ['m³', 'dm³'], ['l', 'ml'], ['cm³', 'mm³'], ['l', 'cm³'], ['m³', 'l']]); v = R.int(2, 12); }
        else if (d === 2) { [from, to] = R.pick([['cm³', 'dm³'], ['ml', 'l'], ['dm³', 'm³'], ['cm³', 'l']]); v = R.int(11, 95) * 50; }
        else { [from, to] = R.pick([['m³', 'l'], ['hl', 'l'], ['l', 'm³'], ['dm³', 'ml'], ['m³', 'cm³']]); v = U[from] > U[to] ? R.pick([0.5, 1.2, 2.5, 0.75, 3.4, 0.08]) : R.int(12, 95) * 100; }
        const f = Math.pow(10, U[from] - U[to]), res = v * f;
        return geoTask({
          prompt: 'Rechne um: ' + ZU(v, from) + ' = ? ' + to, value: res, unit: to, time: [30, 45, 60][d - 1],
          hint: 'Bei Volumeneinheiten ist die Umrechnungszahl 1000. Merke: 1 l = 1 dm³, 1 ml = 1 cm³, 1 hl = 100 l.',
          steps: [step('1 m³ = 1000 dm³ = 1000 l, 1 dm³ = 1 l = 1000 cm³ = 1000 ml, 1 cm³ = 1000 mm³'),
            step(f >= 1 ? 'In die kleinere Einheit: mal ' + Z(f) : 'In die größere Einheit: durch ' + Z(1 / f)), step(ZU(v, from) + ' = ' + ZU(res, to))]
        });
      }
    },

    volumen: {
      label: 'Volumen von Prismen',
      kc: 'Größen und Messen', pk: 'Mit symbolischen, formalen und technischen Elementen umgehen', afb: 'I–II',
      gen(d) {
        let fig, G, Gtxt, l, sim;
        if (d === 1) {
          const a = R.int(2, 9), b = R.int(2, 8); l = R.int(2, 10);
          fig = F.prism([[0, 0], [a, 0], [a, b], [0, b]], l, { labels: { 0: L(a), 3: L(b) }, depth: L(l) });
          G = a * b; Gtxt = step('Grundfläche (Rechteck): ' + fmt('G = ' + a + ' * ' + b + ' = ' + G) + '&nbsp;cm²');
          sim = { type: 'zerlegen', kind: 'prisma', G, l, base: [[0, 0], [a, 0], [a, b], [0, b]] };
        } else if (d === 2) {
          const g = R.int(2, 6) * 2, h = R.int(3, 8), p = g / 2; l = R.int(4, 12);
          const base = [[0, 0], [g, 0], [p, h]];
          fig = F.prism(base, l, { labels: { 0: L(g) }, depth: L(l), extra: (S, f) => S.height(f[2], f[0], f[1], L(h), 1) });
          G = g * h / 2; Gtxt = step('Grundfläche (Dreieck): ' + fmt('G = [1/2] * ' + g + ' * ' + h + ' = ' + G) + '&nbsp;cm²');
          sim = { type: 'zerlegen', kind: 'prisma', G, l, base };
        } else {
          const c = R.int(2, 6), a = c + R.int(1, 4) * 2, h = R.int(2, 7); l = R.int(3, 10);
          const base = [[0, 0], [a, 0], [(a + c) / 2, h], [(a - c) / 2, h]];
          fig = F.prism(base, l, { labels: { 0: L(a), 2: L(c) }, depth: L(l), extra: (S, f) => S.height(mid(f[2], f[3]), f[0], f[1], L(h), -1) });
          G = (a + c) / 2 * h; Gtxt = step('Grundfläche (Trapez): ' + fmt('G = [(' + a + ' + ' + c + ')/2] * ' + h + ' = ' + ds(G)) + '&nbsp;cm²');
          sim = { type: 'zerlegen', kind: 'prisma', G, l, base };
        }
        return geoTask({
          prompt: 'Berechne das Volumen des Prismas.', figure: fig.svg(), value: G * l, unit: 'cm³', time: [50, 80, 100][d - 1], sim,
          hint: 'V = G · h: Grundfläche mal Höhe des Prismas. Hier ist die Grundfläche vorne, die Höhe des Prismas zeigt nach hinten.',
          steps: [step('Formel: ' + fmt('V = G * h') + '<sub>K</sub>', 'Grundfläche mal Körperhöhe'), Gtxt, step(fmt('V = ' + ds(G) + ' * ' + l + ' = ' + ds(G * l)) + '&nbsp;cm³')]
        });
      }
    },

    oberflaeche: {
      label: 'Oberflächeninhalt von Prismen',
      kc: 'Größen und Messen', pk: 'Probleme mathematisch lösen', afb: 'II',
      gen(d) {
        let fig, G, u, l, Gtxt, utxt;
        if (d === 1) {
          const a = R.int(2, 8), b = R.int(2, 6); l = R.int(2, 8);
          fig = F.prism([[0, 0], [a, 0], [a, b], [0, b]], l, { labels: { 0: L(a), 3: L(b) }, depth: L(l) });
          G = a * b; u = 2 * (a + b);
          Gtxt = step('Grundfläche: ' + fmt('G = ' + a + ' * ' + b + ' = ' + G) + '&nbsp;cm²'); utxt = step('Umfang der Grundfläche: ' + fmt('u = 2 * ' + a + ' + 2 * ' + b + ' = ' + u) + '&nbsp;cm');
        } else if (d === 2) {
          const [x, y, z] = R.pick([[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10]]); l = R.int(3, 10);
          fig = F.prism([[0, 0], [x, 0], [0, y]], l, { labels: { 0: L(x), 1: L(z), 2: L(y) }, depth: L(l), extra: (S, f) => S.right(f[0], [1, 0], [0, 1]) });
          G = x * y / 2; u = x + y + z;
          Gtxt = step('Grundfläche (rechtwinkliges Dreieck): ' + fmt('G = [1/2] * ' + x + ' * ' + y + ' = ' + G) + '&nbsp;cm²'); utxt = step('Umfang: ' + fmt('u = ' + x + ' + ' + y + ' + ' + z + ' = ' + u) + '&nbsp;cm');
        } else {
          const k = R.pick([1, 2]), h = 4 * k, s = 5 * k, c = R.int(2, 7), a = c + 6 * k; l = R.int(3, 10);
          const base = [[0, 0], [a, 0], [3 * k + c, h], [3 * k, h]];
          fig = F.prism(base, l, { labels: { 0: L(a), 1: L(s), 2: L(c), 3: L(s) }, depth: L(l), extra: (S, f) => S.height(mid(f[2], f[3]), f[0], f[1], L(h), -1) });
          G = (a + c) / 2 * h; u = a + c + 2 * s;
          Gtxt = step('Grundfläche (Trapez): ' + fmt('G = [(' + a + ' + ' + c + ')/2] * ' + h + ' = ' + ds(G)) + '&nbsp;cm²'); utxt = step('Umfang: ' + fmt('u = ' + a + ' + ' + c + ' + 2 * ' + s + ' = ' + u) + '&nbsp;cm');
        }
        const M = u * l, O = 2 * G + M;
        return geoTask({
          prompt: 'Berechne den Oberflächeninhalt des Prismas.', figure: fig.svg(), value: O, unit: 'cm²', time: [80, 110, 130][d - 1],
          hint: 'O = 2 · G + M. Der Mantel ist ein langes Rechteck: Umfang der Grundfläche mal Höhe des Prismas.',
          steps: [step('Formel: ' + fmt('O = 2 * G + M') + ' mit ' + fmt('M = u * h') + '<sub>K</sub>'), Gtxt, utxt,
            step('Mantel: ' + fmt('M = ' + u + ' * ' + l + ' = ' + M) + '&nbsp;cm²'), step(fmt('O = 2 * ' + ds(G) + ' + ' + M + ' = ' + ds(O)) + '&nbsp;cm²')]
        });
      }
    },

    sachaufgabe: {
      label: 'Sachaufgaben zu Körpern',
      kc: 'Größen und Messen / Raum und Form', pk: 'Mathematisch modellieren', afb: 'II–III',
      gen(d) {
        const pick = d === 1 ? ['aquarium', 'geschenk'] : d === 2 ? ['zelt', 'zimmer', 'aquarium'] : ['graben', 'riegel', 'zimmer'];
        const kind = R.pick(pick);
        if (kind === 'aquarium') {
          const a = R.int(4, 10) * 10, b = R.int(2, 5) * 10, h = R.int(3, 6) * 10, f = d === 1 ? h : h - R.int(1, 2) * 5;
          const V = a * b * f / 1000;
          return geoTask({
            prompt: 'Ein quaderförmiges Aquarium ist innen ' + ZU(a, 'cm') + ' lang, ' + ZU(b, 'cm') + ' breit und ' + ZU(h, 'cm') + ' hoch. ' +
              (f === h ? 'Es wird bis zum Rand gefüllt.' : 'Es wird bis ' + ZU(h - f, 'cm') + ' unter den Rand gefüllt.') + ' Wie viele Liter Wasser passen hinein?',
            figure: F.prism([[0, 0], [a, 0], [a, h], [0, h]], b * 1.4, { labels: { 0: L(a), 3: L(h) }, depth: L(b) }).svg(360, 220), value: V, unit: 'l', time: [90, 110][d - 1],
            hint: 'Berechne das Volumen in cm³ (Wasserhöhe beachten!) und rechne dann in Liter um: 1000 cm³ = 1 l.',
            steps: [step('Wasserhöhe: ' + ZU(f, 'cm')), step(fmt('V = ' + a + ' * ' + b + ' * ' + f + ' = ' + a * b * f) + '&nbsp;cm³'), step(fmt(a * b * f + ' : 1000 = ' + ds(V)) + ' → ' + ZU(V, 'l'))]
          });
        }
        if (kind === 'geschenk') {
          const a = R.int(10, 30), b = R.int(8, 20), c = R.int(4, 12), O = 2 * (a * b + a * c + b * c);
          return geoTask({
            prompt: 'Eine quaderförmige Geschenkbox ist ' + ZU(a, 'cm') + ' lang, ' + ZU(b, 'cm') + ' breit und ' + ZU(c, 'cm') + ' hoch. Wie viel Geschenkpapier braucht man mindestens, um sie ohne Überlappung zu bekleben?',
            figure: F.prism([[0, 0], [a, 0], [a, c], [0, c]], b, { labels: { 0: L(a), 3: L(c) }, depth: L(b) }).svg(360, 220), value: O, unit: 'cm²', time: 100,
            hint: 'Gesucht ist der Oberflächeninhalt: je zwei gleiche Rechtecke.',
            steps: [step(fmt('O = 2 * (' + a + ' * ' + b + ' + ' + a + ' * ' + c + ' + ' + b + ' * ' + c + ')')), step(fmt('O = 2 * (' + a * b + ' + ' + a * c + ' + ' + b * c + ') = ' + O) + '&nbsp;cm²')]
          });
        }
        if (kind === 'zelt') {
          const g = R.int(2, 4) * 1, h = R.pick([1.5, 2, 2.5]), l = R.int(2, 5);
          const V = g * h / 2 * l;
          return geoTask({
            prompt: 'Ein Zelt hat die Form eines dreiseitigen Prismas. Vorne ist es ' + ZU(g, 'm') + ' breit und ' + ZU(h, 'm') + ' hoch, es ist ' + ZU(l, 'm') + ' lang. Wie groß ist das Luftvolumen im Zelt?',
            figure: F.prism([[0, 0], [g, 0], [g / 2, h]], l * 1.2, { labels: { 0: L(g, 'm') }, depth: L(l, 'm'), extra: (S, f) => S.height(f[2], f[0], f[1], L(h, 'm'), 1) }).svg(360, 220),
            value: V, unit: 'm³', time: 100,
            hint: 'Die Vorderseite ist ein Dreieck – das ist die Grundfläche. Dann V = G · Länge.',
            steps: [step('Grundfläche: ' + fmt('G = [1/2] * ' + ds(g) + ' * ' + ds(h) + ' = ' + ds(g * h / 2)) + '&nbsp;m²'), step(fmt('V = ' + ds(g * h / 2) + ' * ' + l + ' = ' + ds(V)) + '&nbsp;m³')]
          });
        }
        if (kind === 'zimmer') {
          const a = R.int(3, 6), b = R.int(3, 5), h = R.pick([2.5, 3]), tuer = 2, M = 2 * (a + b) * h - tuer;
          return geoTask({
            prompt: 'Ein quaderförmiges Zimmer ist ' + ZU(a, 'm') + ' lang, ' + ZU(b, 'm') + ' breit und ' + ZU(h, 'm') + ' hoch. Die vier Wände sollen gestrichen werden, die Tür (' + ZU(tuer, 'm²') + ') nicht. Fenster gibt es nicht. Wie groß ist die Fläche, die gestrichen wird?',
            value: M, unit: 'm²', time: 110,
            hint: 'Die Wände bilden den Mantel des Quaders: Umfang des Bodens mal Raumhöhe. Dann die Tür abziehen.',
            steps: [step('Umfang des Bodens: ' + fmt('2 * ' + a + ' + 2 * ' + b + ' = ' + 2 * (a + b)) + '&nbsp;m'), step('Wände: ' + fmt(2 * (a + b) + ' * ' + ds(h) + ' = ' + ds(2 * (a + b) * h)) + '&nbsp;m²'), step('Ohne Tür: ' + fmt(ds(2 * (a + b) * h) + ' - ' + tuer + ' = ' + ds(M)) + '&nbsp;m²')]
          });
        }
        if (kind === 'graben') {
          const a = R.int(2, 4), c = R.pick([1, 1.5, 2].filter(x => x < a)), h = R.pick([0.5, 1, 1.5]), l = R.int(2, 10) * 10;
          const G = (a + c) / 2 * h, V = G * l;
          return geoTask({
            prompt: 'Ein ' + ZU(l, 'm') + ' langer Graben hat einen trapezförmigen Querschnitt: oben ' + ZU(a, 'm') + ' breit, unten ' + ZU(c, 'm') + ' breit und ' + ZU(h, 'm') + ' tief. Wie viel m³ Erde wurden ausgehoben?',
            figure: grabenFig(a, c, h).svg(320, 200), value: V, unit: 'm³', time: 120,
            hint: 'Der Graben ist ein liegendes Prisma mit einem Trapez als Grundfläche: V = G · Länge.',
            steps: [step('Querschnitt (Trapez): ' + fmt('G = [(' + a + ' + ' + ds(c) + ')/2] * ' + ds(h) + ' = ' + ds(G)) + '&nbsp;m²'), step(fmt('V = ' + ds(G) + ' * ' + l + ' = ' + ds(V)) + '&nbsp;m³')]
          });
        }
        // Schokoriegel in dreiseitiger Prisma-Packung (gleichseitiges Dreieck mit gerundeter Höhe)
        const s = R.pick([3, 4, 5]), hs = { 3: 2.6, 4: 3.5, 5: 4.3 }[s], l = R.int(15, 25);
        const G = s * hs / 2, O = 2 * G + 3 * s * l;
        return geoTask({
          prompt: 'Die Verpackung eines Schokoriegels ist ein dreiseitiges Prisma. Die Grundfläche ist ein gleichseitiges Dreieck mit der Seitenlänge ' + ZU(s, 'cm') + ' und der Höhe ' + ZU(hs, 'cm') + '. Die Packung ist ' + ZU(l, 'cm') + ' lang. Wie viel Karton braucht man (ohne Klebelaschen)?',
          figure: F.prism([[0, 0], [s, 0], [s / 2, hs]], l * 0.6, { labels: { 0: L(s) }, depth: L(l), extra: (S, f) => S.height(f[2], f[0], f[1], L(hs), 1) }).svg(360, 220),
          value: O, unit: 'cm²', time: 130,
          hint: 'O = 2 · G + M. Der Mantel besteht aus drei gleichen Rechtecken.',
          steps: [step('Grundfläche: ' + fmt('G = [1/2] * ' + s + ' * ' + ds(hs) + ' = ' + ds(G)) + '&nbsp;cm²'), step('Mantel: ' + fmt('3 * ' + s + ' * ' + l + ' = ' + 3 * s * l) + '&nbsp;cm²'), step(fmt('O = 2 * ' + ds(G) + ' + ' + 3 * s * l + ' = ' + ds(O)) + '&nbsp;cm²')]
        });
      }
    }
  };

  // ================= Analoge Quests =================
  const quests = {
    f1: [
      () => ({
        emoji: '📏', title: 'Der Zimmer-Vermesser',
        text: 'Miss den Fußboden deines Zimmers (oder einen großen Tisch) aus. Fertige im Heft eine Skizze mit allen Maßen an und berechne den Flächeninhalt in m² und in dm². Ist der Raum nicht rechteckig, zerlege ihn. Lege die Rechnung deiner Lehrkraft vor.',
        self: 'Miss den Fußboden deines Zimmers (oder einen großen Tisch) aus. Fertige im Heft eine Skizze mit allen Maßen an und berechne den Flächeninhalt in m² und in dm². Ist der Raum nicht rechteckig, zerlege ihn.',
        check: ['Stehen in deiner Skizze alle Maße mit Einheit?', 'Hast du alle Längen vor dem Rechnen in dieselbe Einheit umgerechnet?', 'Probe Umrechnung: 1 m² = 100 dm².']
      }),
      () => {
        const g = R.int(6, 10), h = R.int(4, 7);
        return {
          emoji: '✂️', title: 'Schere statt Formel',
          text: 'Zeichne auf Papier ein Parallelogramm mit ' + fmt('g = ' + g) + ' cm und ' + fmt('h = ' + h) + ' cm und schneide es aus. Zerschneide es so, dass du daraus ein Rechteck legen kannst, und klebe es ins Heft. Erkläre deiner Lehrkraft, warum ' + fmt('A = g * h') + ' gilt.',
          self: 'Zeichne auf Papier ein Parallelogramm mit ' + fmt('g = ' + g) + ' cm und ' + fmt('h = ' + h) + ' cm und schneide es aus. Zerschneide es so, dass du daraus ein Rechteck legen kannst, und klebe es ins Heft. Schreibe dazu, warum ' + fmt('A = g * h') + ' gilt.',
          check: ['Geschnitten wird entlang einer Höhe.', 'Das Rechteck ist ' + g + ' cm lang und ' + h + ' cm hoch: A = ' + g * h + ' cm².', 'Beim Umlegen geht keine Fläche verloren und keine kommt dazu.']
        };
      },
      () => {
        const A = R.pick([12, 18, 24]);
        return {
          emoji: '🔺', title: 'Das Dreiecks-Trio',
          text: 'Zeichne drei <b>verschiedene</b> Dreiecke, die alle den Flächeninhalt ' + A + ' cm² haben. Eines davon soll stumpfwinklig sein. Zeichne jeweils die Höhe ein, beschrifte g und h und zeige die Rechnung. Lege sie deiner Lehrkraft vor.',
          self: 'Zeichne drei <b>verschiedene</b> Dreiecke, die alle den Flächeninhalt ' + A + ' cm² haben. Eines davon soll stumpfwinklig sein. Zeichne jeweils die Höhe ein, beschrifte g und h und zeige die Rechnung.',
          check: ['Für jedes Dreieck gilt: ½ · g · h = ' + A + ', also g · h = ' + 2 * A + '.', 'Beim stumpfwinkligen Dreieck liegt die Höhe außerhalb – die Grundseite muss verlängert werden.', 'Steht die Höhe wirklich senkrecht (Geodreieck)?']
        };
      }
    ],
    f2: [
      () => ({
        emoji: '🏠', title: 'Grundriss-Architekt',
        text: 'Entwirf den Grundriss eines Fantasie-Hauses aus mindestens drei Teilflächen (z. B. Rechteck, Dreieck, Trapez) im Maßstab 1 : 100. Berechne die Gesamtfläche in m² – einmal durch Zerlegen und einmal durch Ergänzen. Lege beides deiner Lehrkraft vor.',
        self: 'Entwirf den Grundriss eines Fantasie-Hauses aus mindestens drei Teilflächen (z. B. Rechteck, Dreieck, Trapez) im Maßstab 1 : 100. Berechne die Gesamtfläche in m² – einmal durch Zerlegen und einmal durch Ergänzen.',
        check: ['Kommt auf beiden Wegen dasselbe Ergebnis heraus?', 'Maßstab 1 : 100 heißt: 1 cm im Heft sind 1 m in Wirklichkeit.', 'Sind alle Teilflächen und Maße beschriftet?']
      }),
      () => {
        const A = R.pick([20, 24, 30, 36]);
        return {
          emoji: '🎭', title: 'Gleiche Fläche, andere Form',
          text: 'Zeichne ein Dreieck, ein Parallelogramm und ein Trapez, die jeweils genau ' + A + ' cm² Flächeninhalt haben. Notiere die Rechnung daneben und erkläre deiner Lehrkraft, wie du die Maße gefunden hast.',
          self: 'Zeichne ein Dreieck, ein Parallelogramm und ein Trapez, die jeweils genau ' + A + ' cm² Flächeninhalt haben. Notiere die Rechnung daneben und schreibe auf, wie du die Maße gefunden hast.',
          check: ['Dreieck: g · h = ' + 2 * A + '.', 'Parallelogramm: g · h = ' + A + '.', 'Trapez: (a + c) · h = ' + 2 * A + ' – z. B. a + c = ' + (2 * A / 4) + ' und h = 4.']
        };
      },
      () => {
        const g = R.int(6, 12), h = R.int(3, 8);
        return {
          emoji: '🩺', title: 'Der Fehlerdoktor',
          text: 'Ein Mitschüler rechnet beim Dreieck mit ' + fmt('g = ' + g) + ' cm und ' + fmt('h = ' + h) + ' cm: ' + fmt('A = ' + g + ' * ' + h + ' = ' + g * h) + ' cm. Finde <b>beide</b> Fehler, rechne richtig und schreibe eine Merkregel auf. Lege sie deiner Lehrkraft vor.',
          self: 'Ein Mitschüler rechnet beim Dreieck mit ' + fmt('g = ' + g) + ' cm und ' + fmt('h = ' + h) + ' cm: ' + fmt('A = ' + g + ' * ' + h + ' = ' + g * h) + ' cm. Finde <b>beide</b> Fehler, rechne richtig und schreibe eine Merkregel auf.',
          check: ['Fehler 1: Der Faktor ½ fehlt.', 'Fehler 2: Die Einheit muss cm² sein.', 'Richtig: A = ' + ds(g * h / 2).replace('.', ',') + ' cm².']
        };
      }
    ],
    f3: [
      () => ({
        emoji: '📦', title: 'Verpackungsdesign',
        text: 'Entwirf eine Verpackung in Form eines Prismas (kein Quader!). Zeichne das Netz mit Klebelaschen auf Karton, bastle die Verpackung und berechne Volumen und Oberflächeninhalt. Bring sie mit und stelle sie deiner Lehrkraft vor.',
        self: 'Entwirf eine Verpackung in Form eines Prismas (kein Quader!). Zeichne das Netz mit Klebelaschen auf Karton, bastle die Verpackung und berechne Volumen und Oberflächeninhalt.',
        check: ['Lässt sich dein Netz ohne Lücken und Überlappungen falten?', 'V = G · h<sub>K</sub>, O = 2 · G + M.', 'Klebelaschen zählen nicht zum Oberflächeninhalt.']
      }),
      () => ({
        emoji: '🥛', title: 'Liter-Detektiv',
        text: 'Suche zu Hause zwei quaderförmige Verpackungen mit Inhaltsangabe (z. B. Milch, Saft, Taschentücher). Miss sie aus, berechne ihr Volumen in cm³ und in Litern und vergleiche mit dem Aufdruck. Erkläre deiner Lehrkraft mögliche Unterschiede.',
        self: 'Suche zu Hause zwei quaderförmige Verpackungen mit Inhaltsangabe (z. B. Milch, Saft, Taschentücher). Miss sie aus, berechne ihr Volumen in cm³ und in Litern und vergleiche mit dem Aufdruck.',
        check: ['1000 cm³ = 1 l.', 'Ein etwas größeres Ergebnis ist normal: Die Wände haben eine Dicke und die Packung ist nicht ganz voll.', 'Hast du Messwerte, Rechnung und Ergebnis mit Einheiten notiert?']
      }),
      () => ({
        emoji: '🎲', title: 'Würfelnetz-Jagd',
        text: 'Es gibt genau 11 verschiedene Würfelnetze. Finde mindestens 8 davon, zeichne sie ins Kästchenheft und markiere bei einem Netz mit gleichen Farben, welche Flächen sich gegenüberliegen. Lege deine Sammlung deiner Lehrkraft vor.',
        self: 'Es gibt genau 11 verschiedene Würfelnetze. Finde mindestens 8 davon, zeichne sie ins Kästchenheft und markiere bei einem Netz mit gleichen Farben, welche Flächen sich gegenüberliegen.',
        check: ['Schneide im Zweifel ein Netz aus und falte es.', 'Gedrehte oder gespiegelte Netze zählen nicht als neue Netze.', 'Gegenüberliegende Flächen berühren sich im Netz nie.']
      })
    ]
  };

  RM.registerTopic({
    id: 'jg8-flaechen-koerper',
    title: 'Flächen & Körper',
    grade: 8,
    codePrefix: 'FK',
    description: 'Dreieck, Parallelogramm, Trapez, zusammengesetzte Flächen; Prismen: Netz, Schrägbild, Volumen und Oberfläche.',
    skills,
    floors: [
      {
        id: 'f1', name: 'Die Halle der Flächen', emoji: '🔺', theme: 'katakomben',
        intro: 'In der Halle der Flächen ist der Boden mit Dreiecken, Parallelogrammen und Trapezen gefliest. Wer ihre Größe nicht kennt, findet den Ausgang nie.',
        skills: ['einheiten_flaeche', 'rechteck', 'dreieck', 'parallelogramm', 'trapez', 'ansatz'],
        enemies: [{ name: 'Dreieckskäfer', emoji: '🪲', sprite: 'dreieckskaefer' }, { name: 'Trapezkrabbe', emoji: '🦀', sprite: 'trapezkrabbe' }, { name: 'Rautenrochen', emoji: '🔷', sprite: 'rautenrochen' }],
        elites: [{ name: 'Der Maßbandwächter', emoji: '📏', sprite: 'massband' }],
        boss: {
          name: 'Der Flächenfresser', emoji: '🟪', sprite: 'flaechenfresser',
          intro: 'Der Flächenfresser verschlingt jede Fliese, deren Flächeninhalt niemand kennt. Rechne schneller, als er frisst!',
          phases: [
            { title: 'Phase 1: Rechteck & Dreieck', skills: ['rechteck', 'dreieck', 'einheiten_flaeche'], diff: [1, 2] },
            { title: 'Phase 2: Parallelogramm & Trapez', skills: ['parallelogramm', 'trapez', 'ansatz'], diff: [2, 2] },
            { title: 'Phase 3: Alles zusammen', skills: ['dreieck', 'parallelogramm', 'trapez', 'einheiten_flaeche'], diff: [2, 3] }
          ]
        },
        quests: quests.f1
      },
      {
        id: 'f2', name: 'Das Labyrinth der Vielecke', emoji: '🧩', theme: 'hoehlen',
        intro: 'Die Gänge des Labyrinths haben die seltsamsten Formen. Nur wer sie geschickt zerlegt oder ergänzt, kommt hindurch.',
        skills: ['zusammengesetzt', 'rueckwaerts', 'formel_term', 'fehler_flaeche', 'trapez'],
        enemies: [{ name: 'Mosaikmotte', emoji: '🦋', sprite: 'mosaikmotte' }, { name: 'Zackenigel', emoji: '🦔', sprite: 'zackenigel' }, { name: 'Vieleckwurm', emoji: '🐛', sprite: 'vieleckwurm' }],
        elites: [{ name: 'Der Grundriss-Golem', emoji: '🧱', sprite: 'grundriss' }],
        boss: {
          name: 'Die Polygon-Chimäre', emoji: '🐲', sprite: 'chimaere',
          intro: 'Die Chimäre ist aus lauter Vielecken zusammengesetzt. Zerlege sie Stück für Stück!',
          phases: [
            { title: 'Phase 1: Zerlegen & Ergänzen', skills: ['zusammengesetzt', 'trapez'], diff: [1, 2] },
            { title: 'Phase 2: Rückwärts & mit Variablen', skills: ['rueckwaerts', 'formel_term'], diff: [2, 2] },
            { title: 'Phase 3: Fehlerjagd', skills: ['fehler_flaeche', 'zusammengesetzt', 'rueckwaerts'], diff: [2, 3] }
          ]
        },
        quests: quests.f2
      },
      {
        id: 'f3', name: 'Die Kammer der Prismen', emoji: '🧊', theme: 'turm',
        intro: 'Hoch oben im Turm stapeln sich Kisten, Kristalle und Zelte – alles Prismen. Der Koloss in der letzten Kammer bewacht den Schatz des Pythagoras.',
        skills: ['koerper', 'einheiten_volumen', 'volumen', 'oberflaeche', 'sachaufgabe'],
        enemies: [{ name: 'Würfel-Mimic', emoji: '🎲', sprite: 'wuerfelmimic' }, { name: 'Kristallprisma', emoji: '💠', sprite: 'prismenkristall' }, { name: 'Netzspinne', emoji: '🕷️', sprite: 'spinne' }],
        elites: [{ name: 'Der Literlurch', emoji: '🦎', sprite: 'literlurch' }],
        boss: {
          name: 'Der Prismenkoloss', emoji: '🗿', sprite: 'koloss',
          intro: 'Der Koloss ist aus Quadern, Dreiecks- und Trapezprismen gebaut. Berechne ihn – dann zerfällt er!',
          phases: [
            { title: 'Phase 1: Netze & Einheiten', skills: ['koerper', 'einheiten_volumen'], diff: [1, 2] },
            { title: 'Phase 2: Volumen & Oberfläche', skills: ['volumen', 'oberflaeche'], diff: [2, 2] },
            { title: 'Phase 3: Sachaufgaben', skills: ['sachaufgabe', 'volumen', 'oberflaeche'], diff: [2, 3] }
          ]
        },
        quests: quests.f3
      }
    ]
  });
})(window.RM);
