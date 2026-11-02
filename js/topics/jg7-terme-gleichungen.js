// Thema: Terme und Gleichungen – Jahrgang 7 (Gymnasium Niedersachsen, Doppeljahrgang 7/8)
// Jede Fähigkeit (skill) hat einen Generator gen(d) mit Schwierigkeit d = 1, 2, 3.
(function (RM) {
  'use strict';
  const R = RM.rand, T = RM.T;
  const { Q, fmt, P, par } = T;

  // T.join ohne Nullsummanden
  const J = list => {
    const l = list.filter(([c]) => c !== 0);
    return l.length ? T.join(l) : '0';
  };
  const pm = b => (b < 0 ? ' - ' : ' + ') + Math.abs(b);
  const vterm = (c, v) => J([[c, v]]); // 3x, -x, …
  // Notiz "−3x" / "+5" für Umformungen
  const opNote = (c, v = '') => (c > 0 ? '-' : '+') + (v && Math.abs(c) === 1 ? '' : Math.abs(c)) + v;

  const WORT = {
    2: ['Doppelte', 'Doppelten'], 3: ['Dreifache', 'Dreifachen'], 4: ['Vierfache', 'Vierfachen'],
    5: ['Fünffache', 'Fünffachen'], 6: ['Sechsfache', 'Sechsfachen'], 7: ['Siebenfache', 'Siebenfachen'],
    8: ['Achtfache', 'Achtfachen'], 9: ['Neunfache', 'Neunfachen'], 10: ['Zehnfache', 'Zehnfachen']
  };
  const W = k => WORT[k][0];
  const Wd = k => WORT[k][1];

  // Lösungszeilen für a·v + b = c·v + dd; die Umformungsnotiz steht hinter der Zeile, auf die sie angewendet wird
  function linLines(a, b, c, dd, v = 'x') {
    const lines = [{ l: J([[a, v], [b, '']]), r: J([[c, v], [dd, '']]) }];
    const last = () => lines[lines.length - 1];
    let A = a, B = b, D = dd;
    if (c !== 0) {
      last().note = opNote(c, v); A = a - c;
      lines.push({ l: J([[A, v], [B, '']]), r: String(D) });
    }
    if (B !== 0) {
      last().note = opNote(B); D = D - B;
      lines.push({ l: vterm(A, v), r: String(D) });
    }
    if (A !== 1) {
      last().note = ':' + par(A);
      lines.push({ l: v, r: new Q(D, A).toMarkup() });
    }
    return lines;
  }
  const renderLines = lines => lines.map(x => x.text
    ? '<div class="step">' + fmt(x.l + ' = ' + x.r) + ' <span class="note">| ' + x.text + '</span></div>'
    : T.eqStep(x.l, x.r, x.note));

  // Waage-Simulation für a·x + b = c·x + d, nur wenn alles positiv darstellbar ist
  function waageSim(a, b, c, d, x) {
    if (!(Number.isInteger(x) && x > 0 && c >= 0 && a > c && a <= 8 && c <= 6 && b >= 0 && d >= 0)) return null;
    return { type: 'waage', a, b, c, d, x };
  }

  // Lineare Gleichung mit ganzzahliger Lösung
  function linEq(d) {
    const x = d === 1 ? R.int(1, 12) : R.nonzero(-9, 12);
    if (d <= 2) {
      const a = R.sign() * R.int(2, 9), b = R.nonzero(-20, 20);
      return { x, a, b, c: 0, dd: a * x + b, lhs: J([[a, 'x'], [b, '']]), rhs: String(a * x + b) };
    }
    let a, c;
    do { a = R.nonzero(-6, 9); c = R.nonzero(-6, 9); } while (a === c);
    const b = R.nonzero(-15, 15), dd = a * x + b - c * x;
    return { x, a, b, c, dd, lhs: J([[a, 'x'], [b, '']]), rhs: J([[c, 'x'], [dd, '']]) };
  }

  // Monom-Schlüssel "x2y1" → "x^2y"
  const keyStr = k => k.replace(/([a-z])(\d+)/g, (m, v, e) => (e === '1' ? v : v + '^' + e));
  // Mehrere Polynome hintereinander schreiben, ohne zusammenzufassen
  const chain = polys => J(polys.flatMap(p => p.terms().map(t => [t.coef.n, keyStr(t.key)])));

  const skills = {
    // ---------------- Ebene 1 ----------------
    termwert: {
      label: 'Termwerte berechnen',
      kc: 'Zahlen und Operationen', pk: 'Mit symbolischen, formalen und technischen Elementen umgehen', afb: 'I',
      gen(d) {
        let term, vals;
        if (d === 1) {
          term = J([[R.int(2, 9), 'x'], [R.nonzero(-12, 12), '']]);
          vals = { x: R.int(1, 6) };
        } else if (d === 2) {
          if (R.chance(0.5)) {
            term = J([[R.nonzero(-6, 9), 'x'], [R.nonzero(-6, 6), 'y']]);
            vals = { x: R.nonzero(-5, 5), y: R.nonzero(-5, 5) };
          } else {
            term = R.int(2, 6) + '(x' + pm(R.nonzero(-8, 8)) + ')';
            vals = { x: R.nonzero(-6, 6) };
          }
        } else {
          term = J([[R.nonzero(-4, 4), 'x^2'], [R.nonzero(-6, 6), 'x'], [R.nonzero(-9, 9), '']]);
          vals = { x: R.nonzero(-4, 4) };
        }
        const sub = T.subst(term, vals);
        const value = P(sub).constValue();
        const bel = Object.entries(vals).map(([k, v]) => fmt(k + ' = ' + v)).join(' und ');
        return T.valueTask({
          prompt: 'Berechne den Wert des Terms ' + fmt(term) + ' für ' + bel + '.',
          answer: value, time: [30, 45, 60][d - 1],
          sim: { type: 'einsetz', term, vals, sub, value: value.toMarkup() },
          hint: 'Setze die Zahl für die Variable ein – negative Zahlen in Klammern! Dann gilt: Klammern, Potenzen, Punkt vor Strich.',
          steps: [T.step('Einsetzen: ' + fmt(sub)), T.step('Ausrechnen: ' + fmt(sub + ' = ' + value.toMarkup()))]
        });
      }
    },

    termaufstellen: {
      label: 'Terme aufstellen',
      kc: 'Zahlen und Operationen', pk: 'Mathematisch modellieren', afb: 'II',
      gen(d) {
        const k = R.int(2, 9), b = R.int(2, 20), m = R.int(2, 6);
        let text, sol;
        if (d === 1) {
          [text, sol] = R.pick([
            () => ['das ' + W(k) + ' einer Zahl x, vermehrt um ' + b, k + 'x + ' + b],
            () => ['die Differenz aus dem ' + Wd(k) + ' einer Zahl x und ' + b, k + 'x - ' + b],
            () => ['das Produkt aus ' + k + ' und einer Zahl x, vermindert um ' + b, k + 'x - ' + b],
            () => ['die Hälfte einer Zahl x, vermehrt um ' + b, 'x/2 + ' + b],
            () => ['die Summe aus dem ' + Wd(k) + ' einer Zahl x und ' + b, k + 'x + ' + b]
          ])();
          text = 'Stelle einen Term auf: „' + text + '“.';
        } else if (d === 2) {
          const p = R.int(6, 12), q = R.int(2, 6), g = R.int(5, 25), c = R.int(2, 5);
          [text, sol] = R.pick([
            () => ['Ein Kinoticket kostet ' + p + ' €, eine Tüte Popcorn ' + q + ' €. Eine Gruppe von x Personen geht ins Kino und kauft zusammen <b>eine</b> Tüte Popcorn. Gib einen Term für den Gesamtpreis in € an.', p + 'x + ' + q],
            () => ['Ein Handytarif kostet monatlich ' + g + ' € Grundgebühr und ' + c + ' € für jedes zusätzliche Gigabyte. Gib einen Term für die Monatskosten in € bei x zusätzlichen Gigabyte an.', c + 'x + ' + g],
            () => ['Eine Wandergruppe ist bereits ' + g + ' km gelaufen und schafft nun ' + c + ' km pro Stunde. Gib einen Term für die gesamte Strecke in km nach x weiteren Stunden an.', c + 'x + ' + g],
            () => ['Jonas hat ' + (g * 10) + ' € gespart und gibt jede Woche ' + c + ' € davon aus. Gib einen Term für sein Guthaben in € nach x Wochen an.', (g * 10) + ' - ' + c + 'x']
          ])();
        } else {
          [text, sol] = R.pick([
            () => ['Stelle einen Term auf: „das ' + W(k) + ' der Summe aus einer Zahl x und ' + b + '“.', k + '(x + ' + b + ')'],
            () => ['Ein Rechteck ist x cm breit und ' + b + ' cm länger als breit. Gib einen Term für den Umfang in cm an.', '2x + 2(x + ' + b + ')'],
            () => ['Ein gleichschenkliges Dreieck hat eine x cm lange Basis. Jeder Schenkel ist ' + b + ' cm länger als die Basis. Gib einen Term für den Umfang in cm an.', 'x + 2(x + ' + b + ')'],
            () => ['Stelle einen Term auf: „die Differenz aus dem ' + Wd(k) + ' von x und dem ' + Wd(m) + ' von y“.', k + 'x - ' + m + 'y']
          ])();
        }
        return T.termTask({
          prompt: text, answer: P(sol), mode: 'equiv', time: [45, 60, 75][d - 1],
          answerHtml: fmt(sol),
          hint: 'Übersetze Schritt für Schritt: „das Dreifache“ → 3 · …, „vermehrt um“ → +, „vermindert um“ → −. Für „die Summe … mal …“ brauchst du Klammern.',
          steps: [T.step('Ein möglicher Term: ' + fmt(sol)), T.step('Gleichwertige Schreibweisen werden auch als richtig gewertet.')]
        });
      }
    },

    zusammenfassen: {
      label: 'Terme zusammenfassen',
      kc: 'Zahlen und Operationen', pk: 'Mit symbolischen, formalen und technischen Elementen umgehen', afb: 'I',
      gen(d) {
        let items, ans;
        do {
          if (d === 1) {
            items = [[R.int(2, 9), 'x'], [R.int(1, 9), ''], [R.nonzero(-9, 9), 'x'], [R.nonzero(-9, 9), '']];
          } else if (d === 2) {
            items = [[R.int(2, 9), 'a'], [R.nonzero(-9, 9), 'b'], [R.nonzero(-9, 9), 'a'], [R.nonzero(-9, 9), 'b'], [R.nonzero(-5, 5), R.pick(['a', 'b'])]];
          } else {
            items = [[R.nonzero(-5, 6), 'x^2'], [R.nonzero(-9, 9), 'x'], [R.nonzero(-9, 9), ''], [R.nonzero(-5, 5), 'x^2'], [R.nonzero(-9, 9), 'x'], [R.nonzero(-9, 9), '']];
          }
          items = R.shuffle(items);
          ans = P(J(items));
        } while (ans.size === 0);
        const term = J(items);
        const order = ['x^2', 'x', 'a', 'b', ''];
        const grouped = order.filter(v => items.some(it => it[1] === v))
          .map(v => '(' + J(items.filter(it => it[1] === v)) + ')').join(' + ');
        const keys = order.filter(v => items.some(it => it[1] === v));
        const sim = {
          type: 'sort', term, result: ans.toMarkup(),
          chips: items.map(([c, v], i) => ({ key: v, text: i === 0 ? J([[c, v]]) : (c < 0 ? '- ' : '+ ') + J([[Math.abs(c), v]]) })),
          groups: keys.map(v => {
            const list = items.filter(it => it[1] === v), sum = list.reduce((p, it) => p + it[0], 0);
            return { key: v, label: v === '' ? 'Zahlen' : fmt(v) + '-Terme', res: J([[sum, v]]), calc: J(list) + ' = ' + J([[sum, v]]), zero: sum === 0 };
          })
        };
        return T.termTask({
          sim,
          prompt: 'Fasse den Term so weit wie möglich zusammen: ' + fmt(term),
          answer: ans, mode: 'simplified', time: [45, 60, 90][d - 1],
          hint: 'Nur gleichartige Terme darfst du zusammenfassen: gleiche Variable <b>und</b> gleiche Hochzahl. Zahlen ohne Variable bilden eine eigene Gruppe.',
          steps: [T.step('Gleichartige Terme ordnen: ' + fmt(grouped)), T.step('Zusammenfassen: ' + fmt(ans.toMarkup()))]
        });
      }
    },

    multiplizieren: {
      label: 'Produkte vereinfachen',
      kc: 'Zahlen und Operationen', pk: 'Mit symbolischen, formalen und technischen Elementen umgehen', afb: 'I',
      gen(d) {
        const [u, v] = R.pick([['x', 'y'], ['a', 'b']]);
        const a = R.int(2, 9), b = R.int(2, 9), c = R.int(2, 5);
        let term;
        if (d === 1) term = R.pick([a + ' * ' + b + u, a + u + ' * ' + b + v, a + ' * ' + b + u + v]);
        else if (d === 2) term = R.pick([a + u + ' * (' + (-b) + u + ')', '-' + a + u + ' * ' + b + v, a + u + ' * ' + b + u]);
        else term = R.pick([a + u + ' * (' + (-b) + v + ') * ' + c + u, '-' + a + u + v + ' * ' + b + u, a + u + '^2 * (' + (-b) + u + ')']);
        const ans = P(term);
        return T.termTask({
          prompt: 'Vereinfache das Produkt: ' + fmt(term),
          answer: ans, mode: 'simplified', time: [30, 45, 60][d - 1],
          hint: 'Multipliziere zuerst die Zahlen (Vorzeichen beachten!), dann die Variablen. Gleiche Variablen: x · x = x².',
          steps: [T.step('Zahlen und Variablen getrennt multiplizieren:'), T.step(fmt(term + ' = ' + ans.toMarkup()))]
        });
      }
    },

    // ---------------- Ebene 2 ----------------
    ausmultiplizieren: {
      label: 'Klammern auflösen',
      kc: 'Zahlen und Operationen', pk: 'Mit symbolischen, formalen und technischen Elementen umgehen', afb: 'I–II',
      gen(d) {
        const k = R.int(2, 9), b = R.nonzero(-9, 9), a = R.int(2, 6), m = R.int(2, 6), c = R.nonzero(-9, 9);
        let term, parts, raw, sim = null;
        if (d === 1) {
          const v = R.pick(['x', 'a']);
          term = k + '(' + v + pm(b) + ')';
          raw = k + '*' + v + ' + ' + k + '*' + par(b);
          parts = [P(term)];
          if (b > 0) sim = { type: 'flaeche', outer: String(k), parts: [{ top: v, area: k + v }, { top: String(b), area: String(k * b) }], whole: term, result: P(term).toMarkup() };
        } else if (d === 2) {
          if (R.chance(0.6)) {
            term = (-k) + '(' + a + 'x' + pm(b) + ')';
            raw = par(-k) + '*' + a + 'x + ' + par(-k) + '*' + par(b);
          } else {
            term = 'x(' + a + 'x' + pm(b) + ')';
            raw = 'x*' + a + 'x + x*' + par(b);
            if (b > 0) sim = { type: 'flaeche', outer: 'x', parts: [{ top: a + 'x', area: a + 'x^2' }, { top: String(b), area: b + 'x' }], whole: term, result: P(term).toMarkup() };
          }
          parts = [P(term)];
        } else {
          const p1 = k + '(x' + pm(b) + ')', p2 = m + '(x' + pm(c) + ')';
          const minus = R.chance(0.6);
          term = p1 + (minus ? ' - ' : ' + ') + p2;
          parts = [P(p1), minus ? P(p2).neg() : P(p2)];
          raw = chain(parts);
        }
        const ans = P(term);
        const steps = [T.step('Jeden Summanden in der Klammer mit dem Faktor davor multiplizieren:'), T.step(fmt(term + ' = ' + raw))];
        if (d === 3) steps.push(T.step('Zusammenfassen: ' + fmt(ans.toMarkup())));
        else steps.push(T.step('Ergebnis: ' + fmt(ans.toMarkup())));
        return T.termTask({
          sim,
          prompt: 'Löse die Klammern auf und fasse zusammen: ' + fmt(term),
          answer: ans, mode: 'simplified', time: [40, 60, 90][d - 1],
          hint: 'Distributivgesetz: a(b + c) = ab + ac. Steht ein Minus vor der Klammer, ändern sich alle Vorzeichen in der Klammer.',
          steps
        });
      }
    },

    ausklammern: {
      label: 'Ausklammern',
      kc: 'Zahlen und Operationen', pk: 'Mit symbolischen, formalen und technischen Elementen umgehen', afb: 'II',
      gen(d) {
        const gcd = RM.math.gcd;
        let g, inner, outer, expanded, sim = null;
        if (d === 1) {
          let a, b;
          do { a = R.int(1, 9); b = R.nonzero(-9, 9); } while (gcd(a, b) !== 1);
          g = R.int(2, 9);
          inner = J([[a, 'x'], [b, '']]); outer = String(g);
          expanded = J([[g * a, 'x'], [g * b, '']]);
          if (b > 0) sim = { type: 'flaeche', reverse: true, outer, parts: [{ top: vterm(a, 'x'), area: vterm(g * a, 'x') }, { top: String(b), area: String(g * b) }] };
        } else if (d === 2) {
          let a, b, c;
          do { a = R.int(1, 6); b = R.nonzero(-6, 6); c = R.nonzero(-9, 9); } while (gcd(gcd(a, b), c) !== 1);
          g = R.int(2, 8);
          const [u, v] = R.pick([['x', 'y'], ['a', 'b']]);
          inner = J([[a, u], [b, v], [c, '']]); outer = String(g);
          expanded = J([[g * a, u], [g * b, v], [g * c, '']]);
        } else {
          let a, b;
          do { a = R.int(1, 6); b = R.nonzero(-9, 9); } while (gcd(a, b) !== 1);
          g = R.int(1, 6);
          inner = J([[a, 'x'], [b, '']]); outer = (g === 1 ? '' : g) + 'x';
          expanded = J([[g * a, 'x^2'], [g * b, 'x']]);
          if (b > 0) sim = { type: 'flaeche', reverse: true, outer, parts: [{ top: vterm(a, 'x'), area: vterm(g * a, 'x^2') }, { top: String(b), area: vterm(g * b, 'x') }] };
        }
        const sol = outer + '(' + inner + ')';
        if (sim) { sim.whole = sol; sim.result = expanded; }
        return T.termTask({
          sim,
          prompt: 'Klammere den größten gemeinsamen Faktor aus: ' + fmt(expanded),
          answer: P(expanded), mode: 'factored', time: [45, 60, 75][d - 1],
          answerHtml: fmt(sol), solutionInput: sol.replace(/ /g, ''),
          hint: 'Suche den größten gemeinsamen Teiler aller Zahlen' + (d === 3 ? ' und die Variable, die in jedem Summanden steckt' : '') + '. Kontrolle: Ausmultiplizieren muss den Ausgangsterm ergeben.',
          steps: [T.step('Größter gemeinsamer Faktor: ' + fmt(outer)), T.step(fmt(expanded + ' = ' + sol)),
            T.step('Probe durch Ausmultiplizieren: ' + fmt(sol + ' = ' + expanded))]
        });
      }
    },

    aequivalenz: {
      label: 'Gleichwertige Terme erkennen',
      kc: 'Zahlen und Operationen', pk: 'Mathematisch argumentieren', afb: 'II',
      gen(d) {
        const a = R.int(2, 9), b = R.int(2, 9), k = R.int(2, 9), c = R.int(1, 9), e = R.int(1, 9);
        let m;
        do { m = R.int(2, 6); } while (m === k);
        const tpl = d === 1 ? R.pick(['klammer', 'gleichartig']) : d === 2 ? R.pick(['produkt', 'minus']) : R.pick(['komb', 'minus2']);
        let given, correct, wrongs, expl, canonical = false;
        switch (tpl) {
          case 'klammer':
            given = k + '(x + ' + b + ')'; correct = k + 'x + ' + (k * b);
            wrongs = [k + 'x + ' + b, 'x + ' + (k * b), k + 'x + ' + (k + b), (k + b) + 'x'];
            expl = 'Der Faktor ' + k + ' wird mit <b>jedem</b> Summanden in der Klammer multipliziert.';
            break;
          case 'gleichartig':
            given = a + 'x + ' + b + 'x'; correct = (a + b) + 'x';
            wrongs = [(a + b) + 'x^2', (a * b) + 'x', (a * b) + 'x^2', (a + b) + ' + x'];
            expl = 'Beim Addieren gleichartiger Terme addiert man nur die Zahlen davor: ' + a + ' + ' + b + ' = ' + (a + b) + '. Die Variable bleibt.';
            break;
          case 'produkt':
            given = a + 'x * ' + b + 'x'; correct = (a * b) + 'x^2';
            wrongs = [(a * b) + 'x', (a + b) + 'x^2', (a + b) + 'x', (a * b) + ' + x^2'];
            expl = 'Beim Multiplizieren: Zahlen multiplizieren (' + a + ' · ' + b + ' = ' + (a * b) + ') und x · x = x².';
            break;
          case 'minus':
            given = a + ' - (x - ' + b + ')'; correct = a + ' - x + ' + b;
            wrongs = [a + ' - x - ' + b, a + ' + x - ' + b, a + ' + x + ' + b];
            expl = 'Ein Minus vor der Klammer dreht <b>alle</b> Vorzeichen in der Klammer um: −(x − ' + b + ') = −x + ' + b + '.';
            break;
          case 'komb':
            given = k + '(x - ' + c + ') - ' + m + 'x'; correct = P(given).toMarkup(); canonical = true;
            wrongs = [k + 'x - ' + c + ' - ' + m + 'x', k + 'x + ' + (k * c) + ' - ' + m + 'x', k + 'x - ' + (k * c) + ' + ' + m + 'x'];
            expl = 'Erst ausmultiplizieren: ' + k + '(x − ' + c + ') = ' + k + 'x − ' + (k * c) + ', dann gleichartige Terme zusammenfassen.';
            break;
          default: // minus2
            given = a + 'x - (' + b + 'x - ' + c + ') + ' + e; correct = P(given).toMarkup(); canonical = true;
            wrongs = [a + 'x - ' + b + 'x - ' + c + ' + ' + e, a + 'x + ' + b + 'x - ' + c + ' + ' + e, a + 'x - ' + b + 'x + ' + c + ' - ' + e];
            expl = 'Minusklammer auflösen: −(' + b + 'x − ' + c + ') = −' + b + 'x + ' + c + '. Dann zusammenfassen.';
        }
        const ws = T.distinctTerms(correct, wrongs).map(w => (canonical ? P(w).toMarkup() : w));
        return T.choiceTask({
          prompt: 'Welcher Term ist gleichwertig zu ' + fmt(given) + '?',
          options: [{ html: fmt(correct), correct: true }, ...ws.map(w => ({ html: fmt(w) }))],
          time: [40, 50, 60][d - 1],
          hint: 'Rechne den gegebenen Term selbst um – oder setze eine Zahl für x ein und vergleiche die Werte.',
          steps: [T.step(expl), T.step(fmt(given + ' = ' + correct))]
        });
      }
    },

    // ---------------- Ebene 3 ----------------
    gleichung: {
      label: 'Lineare Gleichungen lösen',
      kc: 'Zahlen und Operationen', pk: 'Mit symbolischen, formalen und technischen Elementen umgehen', afb: 'I–II',
      gen(d) {
        let lhs, rhs, x, steps, sim = null;
        if (d === 1) {
          x = R.int(1, 15);
          const a = R.int(2, 9);
          const type = R.pick(['plus', 'minus', 'mal', 'geteilt']);
          if (type === 'plus') { lhs = 'x + ' + a; rhs = String(x + a); steps = [T.eqStep(lhs, rhs, '-' + a), T.eqStep('x', x)]; sim = waageSim(1, a, 0, x + a, x); }
          else if (type === 'minus') { lhs = 'x - ' + a; rhs = String(x - a); steps = [T.eqStep(lhs, rhs, '+' + a), T.eqStep('x', x)]; }
          else if (type === 'mal') { lhs = a + 'x'; rhs = String(a * x); steps = [T.eqStep(lhs, rhs, ':' + a), T.eqStep('x', x)]; sim = waageSim(a, 0, 0, a * x, x); }
          else { const q = R.int(1, 9); x = a * q; lhs = '[x/' + a + ']'; rhs = String(q); steps = [T.eqStep(lhs, rhs, '*' + a), T.eqStep('x', x)]; }
        } else {
          const e = linEq(d);
          x = e.x; lhs = e.lhs; rhs = e.rhs;
          steps = renderLines(linLines(e.a, e.b, e.c, e.dd));
          sim = waageSim(e.a, e.b, e.c, e.dd, x);
        }
        return T.valueTask({
          prompt: 'Löse die Gleichung: ' + fmt(lhs + ' = ' + rhs), sim,
          var: 'x', answer: new Q(x), time: [40, 60, 90][d - 1],
          hint: 'Bringe alle x auf eine Seite und alle Zahlen auf die andere. Was du links machst, musst du auch rechts machen.',
          steps
        });
      }
    },

    gleichung_klammer: {
      label: 'Gleichungen mit Klammern',
      kc: 'Zahlen und Operationen', pk: 'Mit symbolischen, formalen und technischen Elementen umgehen', afb: 'II',
      gen(d) {
        const x = R.nonzero(-8, 10);
        const k = R.sign() * R.int(2, 6), a = R.nonzero(-9, 9);
        let lhs, rhs, A, B, C, D;
        if (d <= 2) {
          lhs = k + '(x' + pm(a) + ')'; rhs = String(k * (x + a));
          A = k; B = k * a; C = 0; D = k * (x + a);
        } else {
          let m;
          do { m = R.nonzero(-5, 7); } while (m === k);
          const c = k * (x + a) - m * x;
          lhs = k + '(x' + pm(a) + ')'; rhs = J([[m, 'x'], [c, '']]);
          A = k; B = k * a; C = m; D = c;
        }
        const steps = renderLines([{ l: lhs, r: rhs, text: 'Klammer auflösen' }].concat(linLines(A, B, C, D)));
        return T.valueTask({
          prompt: 'Löse die Gleichung: ' + fmt(lhs + ' = ' + rhs),
          var: 'x', answer: new Q(x), time: [60, 75, 100][d - 1],
          hint: 'Löse zuerst die Klammer auf (Distributivgesetz). Danach wie gewohnt umformen.',
          steps
        });
      }
    },

    probe: {
      label: 'Lösungen prüfen (Probe)',
      kc: 'Zahlen und Operationen', pk: 'Mathematisch argumentieren', afb: 'I',
      gen(d) {
        const e = linEq(d === 1 ? 2 : 3);
        const eq = e.lhs + ' = ' + e.rhs;
        const probe = v => {
          const l = P(T.subst(e.lhs, { x: v })).constValue(), r = P(T.subst(e.rhs, { x: v })).constValue();
          return T.step('Probe mit ' + fmt('x = ' + v) + ': links ' + fmt(T.subst(e.lhs, { x: v }) + ' = ' + l.toMarkup()) +
            ', rechts ' + fmt(/x/.test(e.rhs) ? T.subst(e.rhs, { x: v }) + ' = ' + r.toMarkup() : r.toMarkup()) + (l.eq(r) ? ' ✔ gleich' : ' ✘ verschieden'));
        };
        if (d === 1) {
          const s = R.chance(0.5) ? e.x : e.x + R.nonzero(-3, 3);
          const yes = s === e.x;
          return T.choiceTask({
            prompt: 'Ist ' + fmt('x = ' + s) + ' eine Lösung der Gleichung ' + fmt(eq) + '?',
            options: [{ html: 'Ja, das ist eine Lösung.', correct: yes }, { html: 'Nein, das ist keine Lösung.', correct: !yes }],
            noShuffle: true, time: 40,
            hint: 'Setze die Zahl auf beiden Seiten ein. Kommt links und rechts dasselbe heraus?',
            steps: [probe(s)]
          });
        }
        const cand = [e.x + 1, e.x - 1, -e.x, e.x + 2, e.x - 3].filter((v, i, arr) => v !== e.x && arr.indexOf(v) === i);
        return T.choiceTask({
          prompt: 'Welche Zahl löst die Gleichung ' + fmt(eq) + '?',
          options: [{ html: fmt('x = ' + e.x), correct: true }, ...R.shuffle(cand).slice(0, 3).map(v => ({ html: fmt('x = ' + v) }))],
          time: [40, 50, 70][d - 1],
          hint: 'Du musst die Gleichung nicht lösen: Setze die angebotenen Zahlen ein und prüfe!',
          steps: [probe(e.x)]
        });
      }
    },

    fehler_finden: {
      label: 'Fehler in Rechnungen finden',
      kc: 'Zahlen und Operationen', pk: 'Mathematisch argumentieren', afb: 'II–III',
      gen(d) {
        const x = R.nonzero(-6, 9), a = R.int(3, 9), c = R.int(1, a - 2), b = R.nonzero(-12, 12);
        const dd = a * x + b - c * x;
        const errorAt = d === 1 ? R.weighted([[0, 1], [2, 3]]) : R.weighted([[0, 1], [1, 1], [2, 1], [3, 1]]);
        const A = errorAt === 1 ? a + c : a - c;
        const D = errorAt === 2 ? dd + b : dd - b;
        const X = errorAt === 3 ? new Q(D - A) : new Q(D, A);
        // Fehler muss sichtbar sein (z. B. 4 − 2 = 4 : 2)
        if (errorAt === 3 && X.eq(new Q(D, A))) return this.gen(d);
        const lines = [
          [J([[a, 'x'], [b, '']]) + ' = ' + J([[c, 'x'], [dd, '']]), opNote(c, 'x')],
          [J([[A, 'x'], [b, '']]) + ' = ' + dd, opNote(b)],
          [vterm(A, 'x') + ' = ' + D, ':' + A],
          ['x = ' + X.toMarkup(), '']
        ];
        const table = '<ol class="calc">' + lines.map(([l, n]) => '<li>' + fmt(l) + (n ? ' <span class="note">| ' + fmt(n) + '</span>' : '') + '</li>').join('') + '</ol>';
        const labels = ['Die Rechnung ist fehlerfrei.', 'Fehler von Zeile 1 zu Zeile 2', 'Fehler von Zeile 2 zu Zeile 3', 'Fehler von Zeile 3 zu Zeile 4'];
        const why = [
          'Alle Umformungen sind korrekt.',
          'Beim Subtrahieren von ' + fmt(vterm(c, 'x')) + ' muss ' + fmt(a + 'x - ' + c + 'x = ' + vterm(a - c, 'x')) + ' herauskommen.',
          'Beim Umformen mit ' + fmt(opNote(b)) + ' muss rechts ' + fmt(dd + pm(-b) + ' = ' + (dd - b)) + ' stehen.',
          'Bei ' + fmt(':' + A) + ' muss man <b>teilen</b>, nicht subtrahieren: ' + fmt('x = ' + new Q(D, A).toMarkup()) + '.'
        ];
        return T.choiceTask({
          prompt: 'Der Spiegelgeist zeigt dir diese Rechnung. Ist sie richtig – und wenn nicht, wo steckt der Fehler?' + table,
          options: labels.map((html, i) => ({ html, correct: i === errorAt })),
          noShuffle: true, time: [60, 75, 90][d - 1],
          hint: 'Prüfe jeden Schritt einzeln: Wurde die Umformung hinter dem Strich auf <b>beiden</b> Seiten richtig ausgeführt?',
          steps: [T.step(why[errorAt]), T.step('Richtige Rechnung:')].concat(renderLines(linLines(a, b, c, dd)))
        });
      }
    },

    textgleichung: {
      label: 'Sachaufgaben mit Gleichungen',
      kc: 'Zahlen und Operationen', pk: 'Probleme mathematisch lösen / Modellieren', afb: 'II–III',
      gen(d) {
        let text, ansatz, A, B, C, D, x, antwort;
        if (d === 1) {
          x = R.int(2, 15); const k = R.int(2, 9), b = R.int(1, 30);
          if (R.chance(0.5)) {
            text = 'Ich denke mir eine Zahl. Wenn ich sie mit ' + k + ' multipliziere und dann ' + b + ' addiere, erhalte ich ' + (k * x + b) + '. Wie heißt die Zahl?';
            ansatz = k + 'x + ' + b + ' = ' + (k * x + b); A = k; B = b; C = 0; D = k * x + b;
          } else {
            text = 'Ich denke mir eine Zahl. Wenn ich sie mit ' + k + ' multipliziere und dann ' + b + ' subtrahiere, erhalte ich ' + (k * x - b) + '. Wie heißt die Zahl?';
            ansatz = k + 'x - ' + b + ' = ' + (k * x - b); A = k; B = -b; C = 0; D = k * x - b;
          }
          antwort = 'Die gesuchte Zahl ist ' + x + '.';
        } else if (d === 2) {
          if (R.chance(0.5)) {
            x = R.int(4, 14); const n = R.int(2, 8), s = 2 * x + n;
            text = 'Mia ist ' + n + ' Jahre älter als ihr Bruder Ben. Zusammen sind die beiden ' + s + ' Jahre alt. Wie alt ist Ben?';
            ansatz = 'x + (x + ' + n + ') = ' + s; A = 2; B = n; C = 0; D = s;
            antwort = 'Ben ist ' + x + ' Jahre alt.';
          } else {
            const k = R.int(2, 5); x = R.int(3, 12);
            const b = R.int(1, (k - 1) * x - 1), m = k * x - b - x;
            text = 'Subtrahiert man ' + b + ' vom ' + Wd(k) + ' einer Zahl, so erhält man dasselbe, wie wenn man ' + m + ' zu der Zahl addiert. Wie heißt die Zahl?';
            ansatz = k + 'x - ' + b + ' = x + ' + m; A = k; B = -b; C = 1; D = m;
            antwort = 'Die gesuchte Zahl ist ' + x + '.';
          }
        } else {
          const t = R.pick(['rechteck', 'folge', 'geld']);
          if (t === 'rechteck') {
            x = R.int(2, 12); const k = R.int(2, 4), U = 2 * (k * x + x);
            text = 'Ein Rechteck ist ' + k + '-mal so lang wie breit. Sein Umfang beträgt ' + U + ' cm. Wie breit ist das Rechteck (in cm)?';
            ansatz = '2*(' + k + 'x + x) = ' + U; A = 2 * k + 2; B = 0; C = 0; D = U;
            antwort = 'Das Rechteck ist ' + x + ' cm breit (und ' + (k * x) + ' cm lang).';
          } else if (t === 'folge') {
            x = R.int(5, 40); const S = 3 * x + 3;
            text = 'Die Summe von drei aufeinanderfolgenden natürlichen Zahlen ist ' + S + '. Wie heißt die kleinste der drei Zahlen?';
            ansatz = 'x + (x + 1) + (x + 2) = ' + S; A = 3; B = 3; C = 0; D = S;
            antwort = 'Die Zahlen sind ' + x + ', ' + (x + 1) + ' und ' + (x + 2) + '. Die kleinste ist ' + x + '.';
          } else {
            x = R.int(4, 20); const k = R.int(2, 5), S = (k + 1) * x;
            text = 'Lea hat ' + k + '-mal so viel Geld gespart wie Tom. Zusammen haben sie ' + S + ' €. Wie viel Euro hat Tom gespart?';
            ansatz = 'x + ' + k + 'x = ' + S; A = k + 1; B = 0; C = 0; D = S;
            antwort = 'Tom hat ' + x + ' € gespart.';
          }
        }
        const steps = [T.step('Ansatz (x = gesuchte Größe): ' + fmt(ansatz))]
          .concat(renderLines(linLines(A, B, C, D)), [T.step('Antwort: ' + antwort)]);
        return T.valueTask({
          prompt: text, answer: new Q(x), time: [60, 90, 120][d - 1],
          sim: waageSim(A, B, C, D, x),
          hint: 'Lege fest, wofür x steht. Übersetze dann den Text Satz für Satz in eine Gleichung und löse sie.',
          steps
        });
      }
    }
  };

  // ---------------- Analoge Quests ----------------
  // text: Klassenmodus (Vorlage bei der Lehrkraft) · self: Übungsmodus (Selbstkontrolle) · check: Kontrollhinweise
  const quests = {
    f1: [
      () => {
        const v = R.int(2, 5), w = R.int(10, 30);
        return {
          emoji: '🔎', title: 'Term-Detektiv',
          text: 'Schreibe drei <b>verschiedene</b> Terme mit der Variablen ' + fmt('x') + ' ins Heft, die für ' + fmt('x = ' + v) + ' jeweils den Wert ' + fmt(String(w)) + ' haben. Mindestens ein Term soll eine Klammer enthalten. Lege sie deiner Lehrkraft vor.',
          self: 'Schreibe drei <b>verschiedene</b> Terme mit der Variablen ' + fmt('x') + ' ins Heft, die für ' + fmt('x = ' + v) + ' jeweils den Wert ' + fmt(String(w)) + ' haben. Mindestens ein Term soll eine Klammer enthalten.',
          check: ['Setze ' + fmt('x = ' + v) + ' in jeden deiner Terme ein. Kommt jedes Mal ' + w + ' heraus?', 'Sind die Terme wirklich verschieden – und nicht nur umgestellt (z. B. 2x + 3 und 3 + 2x)?']
        };
      },
      () => {
        const k = R.int(2, 9), b = R.int(3, 25);
        return {
          emoji: '📖', title: 'Geschichtenerzähler',
          text: 'Erfinde eine Alltagssituation (Einkauf, Handytarif, Eintritt …), die zum Term ' + fmt(k + 'x + ' + b) + ' passt. Schreibe sie ins Heft und erkläre deiner Lehrkraft, was ' + fmt('x') + ', ' + k + ' und ' + b + ' in deiner Geschichte bedeuten.',
          self: 'Erfinde eine Alltagssituation (Einkauf, Handytarif, Eintritt …), die zum Term ' + fmt(k + 'x + ' + b) + ' passt, und schreibe sie ins Heft.',
          check: ['Die Zahl vor x (' + k + ') ist ein Betrag, der sich für jede Einheit wiederholt – z. B. ein Preis pro Stück.', 'Die einzelne Zahl (' + b + ') ist ein fester Betrag – z. B. eine Grundgebühr.', 'Steht in deinem Text klar, wofür x steht?']
        };
      },
      () => ({
        emoji: '🗣️', title: 'Die Erklär-Prüfung',
        text: 'Erkläre deiner Lehrkraft mündlich: Warum ist ' + fmt('3x + 2x = 5x') + ', aber ' + fmt('3x * 2x = 6x^2') + '? Und warum lässt sich ' + fmt('3x + 2y') + ' nicht weiter zusammenfassen?',
        self: 'Erkläre laut (dir selbst oder jemandem zu Hause): Warum ist ' + fmt('3x + 2x = 5x') + ', aber ' + fmt('3x * 2x = 6x^2') + '? Und warum lässt sich ' + fmt('3x + 2y') + ' nicht weiter zusammenfassen? Schreibe deine Erklärung in Stichpunkten auf.',
        check: ['3x + 2x: Drei x und zwei x sind fünf x (wie 3 Äpfel + 2 Äpfel).', '3x · 2x = 3 · 2 · x · x = 6x².', 'x und y sind verschiedene Variablen – wie Äpfel und Birnen.']
      })
    ],
    f2: [
      () => {
        const k = R.int(2, 6), b = R.int(2, 8);
        return {
          emoji: '🟦', title: 'Das Flächenmodell',
          text: 'Zeichne ein Rechteck mit den Seitenlängen ' + fmt(String(k)) + ' und ' + fmt('x + ' + b) + ' ins Heft. Zeige an deiner Zeichnung, warum ' + fmt(k + '(x + ' + b + ') = ' + k + 'x + ' + (k * b)) + ' gilt, und erkläre es deiner Lehrkraft.',
          self: 'Zeichne ein Rechteck mit den Seitenlängen ' + fmt(String(k)) + ' und ' + fmt('x + ' + b) + ' ins Heft. Zeige an deiner Zeichnung, warum ' + fmt(k + '(x + ' + b + ') = ' + k + 'x + ' + (k * b)) + ' gilt.',
          check: ['Das große Rechteck zerfällt in zwei Teilrechtecke: ' + fmt(k + ' * x') + ' und ' + fmt(k + ' * ' + b) + '.', 'Die Gesamtfläche ist gleich der Summe der Teilflächen.']
        };
      },
      () => {
        const b = R.int(2, 9);
        return {
          emoji: '🩺', title: 'Der Fehlerdoktor',
          text: 'Eine Mitschülerin hat gerechnet: ' + fmt('-(x - ' + b + ') = -x - ' + b) + '. Schreibe ins Heft, was falsch ist, wie es richtig heißt und welche Regel man sich merken sollte. Lege es deiner Lehrkraft vor.',
          self: 'Eine Mitschülerin hat gerechnet: ' + fmt('-(x - ' + b + ') = -x - ' + b) + '. Schreibe ins Heft, was falsch ist, wie es richtig heißt und welche Regel man sich merken sollte.',
          check: ['Richtig ist: ' + fmt('-(x - ' + b + ') = -x + ' + b) + '.', 'Regel: Ein Minus vor der Klammer ändert beim Auflösen <b>alle</b> Vorzeichen in der Klammer.']
        };
      },
      () => ({
        emoji: '🤝', title: 'Partner-Duell',
        text: 'Stellt euch zu zweit gegenseitig je zwei Aufgaben zum Ausmultiplizieren und zwei zum Ausklammern. Löst sie im Heft, kontrolliert euch gegenseitig und legt die Ergebnisse gemeinsam vor.',
        self: 'Erfinde je zwei Aufgaben zum Ausmultiplizieren und zum Ausklammern und löse sie im Heft. Kontrolliere jede Lösung durch die Gegenrechnung.',
        check: ['Ausmultiplizieren kontrollierst du durch Ausklammern – und umgekehrt.', 'Wurde beim Ausklammern wirklich der <b>größte</b> gemeinsame Faktor gewählt?']
      })
    ],
    f3: [
      () => {
        const e = (function () {
          const x = R.nonzero(-5, 9), k = R.int(2, 5), a = R.nonzero(-6, 6), m = R.int(1, 4);
          return { x, eq: k + '(x' + pm(a) + ') = ' + J([[m, 'x'], [k * (x + a) - m * x, '']]) };
        })();
        return {
          emoji: '✍️', title: 'Lösungsweg mit Probe',
          text: 'Löse die Gleichung ' + fmt(e.eq) + ' im Heft. Notiere jede Umformung mit dem Umformungsstrich (z. B. „| −3x“) und führe am Ende die Probe durch. Lege deinen Lösungsweg vor.',
          self: 'Löse die Gleichung ' + fmt(e.eq) + ' im Heft. Notiere jede Umformung mit dem Umformungsstrich (z. B. „| −3x“) und führe am Ende die Probe durch.',
          check: ['Die Lösung ist ' + fmt('x = ' + e.x) + '.', 'Hast du hinter jeder Zeile die Umformung notiert?', 'Probe: Setze die Lösung in die <b>Ausgangsgleichung</b> ein – links und rechts muss dasselbe herauskommen.']
        };
      },
      () => {
        const s = R.nonzero(-6, 9);
        return {
          emoji: '🧩', title: 'Gleichungs-Erfinder',
          text: 'Erfinde zwei verschiedene Gleichungen, die beide die Lösung ' + fmt('x = ' + s) + ' haben. Eine davon soll x auf beiden Seiten enthalten, die andere eine Klammer. Zeige deiner Lehrkraft, wie du sie gebaut hast.',
          self: 'Erfinde zwei verschiedene Gleichungen, die beide die Lösung ' + fmt('x = ' + s) + ' haben. Eine davon soll x auf beiden Seiten enthalten, die andere eine Klammer.',
          check: ['Tipp zum Bauen: Starte mit ' + fmt('x = ' + s) + ' und führe auf beiden Seiten dieselben Umformungen aus.', 'Kontrolle: Löse deine Gleichungen oder mache die Probe mit ' + fmt('x = ' + s) + '.']
        };
      },
      () => {
        const b = R.int(2, 15), x = R.int(3, 20);
        return {
          emoji: '📝', title: 'Textaufgaben-Werkstatt',
          text: 'Schreibe eine eigene Textaufgabe, die man mit der Gleichung ' + fmt('2x + ' + b + ' = ' + (2 * x + b)) + ' lösen kann. Löse sie und formuliere einen Antwortsatz. Lege beides deiner Lehrkraft vor.',
          self: 'Schreibe eine eigene Textaufgabe, die man mit der Gleichung ' + fmt('2x + ' + b + ' = ' + (2 * x + b)) + ' lösen kann. Löse sie und formuliere einen Antwortsatz.',
          check: ['Die Lösung der Gleichung ist ' + fmt('x = ' + x) + '.', 'Passt die Lösung zu deiner Geschichte (z. B. keine negativen Preise)?', 'Hast du einen vollständigen Antwortsatz geschrieben?']
        };
      }
    ]
  };

  RM.registerTopic({
    id: 'jg7-terme-gleichungen',
    title: 'Terme & Gleichungen',
    grade: 7,
    codePrefix: 'TG',
    description: 'Termwerte, Terme aufstellen und umformen, Klammern, lineare Gleichungen und Sachaufgaben.',
    skills,
    floors: [
      {
        id: 'f1', name: 'Die Katakomben der Terme', emoji: '🕯️', theme: 'katakomben',
        intro: 'In den feuchten Gängen unter der Burg hausen Wesen, die nur mit Termen zu besiegen sind.',
        skills: ['termwert', 'termaufstellen', 'zusammenfassen', 'multiplizieren'],
        enemies: [{ name: 'Variablen-Fledermaus', emoji: '🦇', sprite: 'fledermaus' }, { name: 'Termratte', emoji: '🐀', sprite: 'ratte' }, { name: 'Rechenskelett', emoji: '💀', sprite: 'skelett' }, { name: 'Zahlenschleim', emoji: '🟢', sprite: 'schleim' }],
        elites: [{ name: 'Wächter der Katakomben', emoji: '🧟', sprite: 'mumie' }],
        boss: {
          name: 'Der Termtroll', emoji: '👹', sprite: 'termtroll',
          intro: 'Der Termtroll versperrt den Weg in die Tiefe. Zeig ihm, was du über Terme gelernt hast!',
          phases: [
            { title: 'Phase 1: Werte & Texte', skills: ['termwert', 'termaufstellen'], diff: [1, 2] },
            { title: 'Phase 2: Zusammenfassen', skills: ['zusammenfassen', 'multiplizieren'], diff: [2, 2] },
            { title: 'Phase 3: Alles zusammen', skills: ['termwert', 'termaufstellen', 'zusammenfassen', 'multiplizieren'], diff: [2, 3] }
          ]
        },
        quests: quests.f1
      },
      {
        id: 'f2', name: 'Die Klammerhöhlen', emoji: '🪨', theme: 'hoehlen',
        intro: 'Tiefer im Berg winden sich Gänge voller Klammern. Ein falsches Vorzeichen – und die Decke stürzt ein.',
        skills: ['ausmultiplizieren', 'ausklammern', 'aequivalenz', 'zusammenfassen'],
        enemies: [{ name: 'Klammerschlange', emoji: '🐍', sprite: 'schlange' }, { name: 'Minusskorpion', emoji: '🦂', sprite: 'skorpion' }, { name: 'Vorzeichengeist', emoji: '👻', sprite: 'geist' }, { name: 'Netzspinne', emoji: '🕷️', sprite: 'spinne' }],
        elites: [{ name: 'Steinwächter', emoji: '🗿', sprite: 'steinwaechter' }],
        boss: {
          name: 'Die Klammerhydra', emoji: '🐉', sprite: 'hydra',
          intro: 'Jeder Kopf der Hydra verlangt eine andere Klammer-Regel. Schlag alle ab!',
          phases: [
            { title: 'Phase 1: Klammern auflösen', skills: ['ausmultiplizieren', 'aequivalenz'], diff: [1, 2] },
            { title: 'Phase 2: Ausklammern', skills: ['ausklammern', 'zusammenfassen'], diff: [2, 2] },
            { title: 'Phase 3: Alles zusammen', skills: ['ausmultiplizieren', 'ausklammern', 'aequivalenz'], diff: [2, 3] }
          ]
        },
        quests: quests.f2
      },
      {
        id: 'f3', name: 'Der Turm der Gleichungen', emoji: '🗼', theme: 'turm',
        intro: 'Ganz oben im Turm wartet der Gleichungsgolem. Auf jeder Stufe muss die Waage im Gleichgewicht bleiben.',
        skills: ['gleichung', 'gleichung_klammer', 'probe', 'fehler_finden', 'textgleichung'],
        enemies: [{ name: 'Waagen-Kobold', emoji: '👺', sprite: 'kobold' }, { name: 'Spiegelgeist', emoji: '🪞', sprite: 'spiegel' }, { name: 'Turmeule', emoji: '🦉', sprite: 'eule' }, { name: 'Gleichungswolf', emoji: '🐺', sprite: 'wolf' }],
        elites: [{ name: 'Wächter der Waage', emoji: '⚖️', sprite: 'waage' }],
        boss: {
          name: 'Der Gleichungsgolem', emoji: '🤖', sprite: 'golem',
          intro: 'Der Golem besteht aus lauter Gleichungen. Bring ihn aus dem Gleichgewicht!',
          phases: [
            { title: 'Phase 1: Umformen', skills: ['gleichung', 'probe'], diff: [1, 2] },
            { title: 'Phase 2: Klammern & Fehler', skills: ['gleichung_klammer', 'fehler_finden'], diff: [2, 2] },
            { title: 'Phase 3: Sachaufgaben', skills: ['textgleichung', 'gleichung', 'gleichung_klammer'], diff: [2, 3] }
          ]
        },
        quests: quests.f3
      }
    ]
  });
})(window.RM);
