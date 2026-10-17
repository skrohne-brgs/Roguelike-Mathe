// Mathematischer Kern: Brüche, Polynome, Parser für Schülereingaben, Prüfung und Darstellung
(function (RM) {
  'use strict';

  class ParseError extends Error {}
  class MathError extends Error {}

  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { const t = a % b; a = b; b = t; }
    return a;
  }

  // ---------- Rationale Zahlen ----------
  class Q {
    constructor(n, d = 1) {
      if (d === 0) throw new MathError('Division durch 0 ist nicht erlaubt.');
      if (d < 0) { n = -n; d = -d; }
      const g = gcd(n, d) || 1;
      this.n = n / g + 0; // +0 vermeidet -0
      this.d = d / g;
    }
    static of(x) { return x instanceof Q ? x : new Q(x, 1); }
    add(o) { o = Q.of(o); return new Q(this.n * o.d + o.n * this.d, this.d * o.d); }
    sub(o) { return this.add(Q.of(o).neg()); }
    mul(o) { o = Q.of(o); return new Q(this.n * o.n, this.d * o.d); }
    div(o) {
      o = Q.of(o);
      if (o.n === 0) throw new MathError('Division durch 0 ist nicht erlaubt.');
      return new Q(this.n * o.d, this.d * o.n);
    }
    neg() { return new Q(-this.n, this.d); }
    abs() { return new Q(Math.abs(this.n), this.d); }
    eq(o) { o = Q.of(o); return this.n === o.n && this.d === o.d; }
    isZero() { return this.n === 0; }
    isInt() { return this.d === 1; }
    valueOf() { return this.n / this.d; }
    // Notation für fmt(): ganze Zahl oder [z/n]
    toMarkup() {
      if (this.d === 1) return String(this.n);
      return (this.n < 0 ? '-' : '') + '[' + Math.abs(this.n) + '/' + this.d + ']';
    }
    // So, wie man es eintippen würde
    toInput() { return this.d === 1 ? String(this.n) : this.n + '/' + this.d; }
  }

  // ---------- Polynome (mehrere Variablen) ----------
  // Monom-Schlüssel: Variablen alphabetisch mit Exponent, z. B. "a1x2"; "" = Konstante
  function keyToObj(k) {
    const o = {}; const re = /([a-z])(\d+)/g; let m;
    while ((m = re.exec(k))) o[m[1]] = +m[2];
    return o;
  }
  function objToKey(o) {
    return Object.keys(o).filter(v => o[v] !== 0).sort().map(v => v + o[v]).join('');
  }
  function keyDegree(k) { return Object.values(keyToObj(k)).reduce((s, e) => s + e, 0); }

  class Poly {
    constructor(entries) {
      this.m = new Map();
      if (entries) for (const [k, c] of entries) if (!c.isZero()) this.m.set(k, c);
    }
    static const(q) { return new Poly([['', Q.of(q)]]); }
    static variable(name) { return new Poly([[name + '1', new Q(1)]]); }
    add(o) {
      const r = new Map(this.m);
      for (const [k, c] of o.m) r.set(k, r.has(k) ? r.get(k).add(c) : c);
      return new Poly(r);
    }
    neg() { return new Poly([...this.m].map(([k, c]) => [k, c.neg()])); }
    sub(o) { return this.add(o.neg()); }
    mul(o) {
      const r = new Map();
      for (const [k1, c1] of this.m) {
        for (const [k2, c2] of o.m) {
          const a = keyToObj(k1), b = keyToObj(k2);
          for (const v in b) a[v] = (a[v] || 0) + b[v];
          const k = objToKey(a), c = c1.mul(c2);
          r.set(k, r.has(k) ? r.get(k).add(c) : c);
        }
      }
      return new Poly(r);
    }
    pow(n) { let r = Poly.const(1); for (let i = 0; i < n; i++) r = r.mul(this); return r; }
    scale(q) { return this.mul(Poly.const(q)); }
    get size() { return this.m.size; }
    isConst() { return [...this.m.keys()].every(k => k === ''); }
    constValue() { return this.m.get('') || new Q(0); }
    eq(o) { return this.sub(o).size === 0; }
    vars() {
      const s = new Set();
      for (const k of this.m.keys()) Object.keys(keyToObj(k)).forEach(v => s.add(v));
      return [...s].sort();
    }
    // Wert für eine Belegung, z. B. {x: Q}
    evaluate(vals) {
      let sum = new Q(0);
      for (const [k, c] of this.m) {
        let t = c; const o = keyToObj(k);
        for (const v in o) for (let i = 0; i < o[v]; i++) t = t.mul(vals[v]);
        sum = sum.add(t);
      }
      return sum;
    }
    terms() {
      return [...this.m].map(([key, coef]) => ({ key, coef }))
        .sort((a, b) => keyDegree(b.key) - keyDegree(a.key) || (a.key === '' ? 1 : b.key === '' ? -1 : a.key.localeCompare(b.key)));
    }
    _render(numFn) {
      if (this.size === 0) return '0';
      return this.terms().map((t, i) => {
        const o = keyToObj(t.key);
        const vars = Object.keys(o).sort().map(v => v + (o[v] > 1 ? '^' + o[v] : '')).join('');
        const neg = t.coef.n < 0, abs = t.coef.abs();
        let body;
        if (t.key === '') body = numFn(abs);
        else if (abs.eq(1)) body = vars;
        else body = numFn(abs) + vars;
        if (i === 0) return (neg ? '-' : '') + body;
        return (neg ? ' - ' : ' + ') + body;
      }).join('');
    }
    toMarkup() { return this._render(q => q.toMarkup()); }
    toInput() { return this._render(q => q.toInput()).replace(/ /g, ''); }
  }

  // ---------- Parser für Eingaben ----------
  function normalize(s) {
    return String(s)
      .toLowerCase()
      .replace(/[·×∙⋅*]/g, '*')
      .replace(/[:÷]/g, '/')
      .replace(/[−–—]/g, '-')
      .replace(/,/g, '.')
      .replace(/²/g, '^2').replace(/³/g, '^3')
      .replace(/\s+/g, '');
  }

  function tokenize(s) {
    const out = [];
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/[0-9.]/.test(c)) {
        let j = i;
        while (j < s.length && /[0-9.]/.test(s[j])) j++;
        const raw = s.slice(i, j);
        if ((raw.match(/\./g) || []).length > 1 || raw === '.') {
          throw new ParseError('Die Zahl „' + raw.replace(/\./g, ',') + '“ kann ich nicht lesen.');
        }
        out.push({ t: 'num', v: raw }); i = j; continue;
      }
      if (/[a-z]/.test(c)) { out.push({ t: 'var', v: c }); i++; continue; }
      if ('+-*/^()='.includes(c)) { out.push({ t: c }); i++; continue; }
      throw new ParseError('Das Zeichen „' + c + '“ kenne ich nicht.');
    }
    // implizites Malzeichen: 3x, 2(x+1), (x+1)(x-1), xy
    const res = [];
    for (const b of out) {
      const a = res[res.length - 1];
      if (a && a.t === 'var' && b.t === 'num') throw new ParseError('Schreibe Zahlen vor die Variable, also z. B. 3x statt x3.');
      if (a && (a.t === 'num' || a.t === 'var' || a.t === ')') &&
          (b.t === 'var' || b.t === '(' || (b.t === 'num' && a.t === ')'))) {
        res.push({ t: '*', implicit: true });
      }
      res.push(b);
    }
    return res;
  }

  function numToQ(raw) {
    if (raw.startsWith('.')) raw = '0' + raw;
    const [ip, fp = ''] = raw.split('.');
    return new Q(parseInt(ip + fp, 10), Math.pow(10, fp.length));
  }

  // AST-Knoten: num, var, neg, paren, pow, sum{items:[{sign,node}]}, prod{items:[{op,node}]}
  function parse(src) {
    const toks = tokenize(normalize(src));
    if (!toks.length) throw new ParseError('Die Eingabe ist leer.');
    let p = 0;
    const peek = () => toks[p];
    const next = () => toks[p++];

    function expr() {
      const items = [{ sign: 1, node: term() }];
      while (peek() && (peek().t === '+' || peek().t === '-')) {
        const sign = next().t === '+' ? 1 : -1;
        items.push({ sign, node: term() });
      }
      return items.length === 1 ? items[0].node : { t: 'sum', items };
    }
    function term() {
      const items = [{ op: '*', node: unary() }];
      while (peek() && (peek().t === '*' || peek().t === '/')) {
        const op = next().t;
        items.push({ op, node: unary() });
      }
      return items.length === 1 ? items[0].node : { t: 'prod', items };
    }
    function unary() {
      const tk = peek();
      if (tk && (tk.t === '-' || tk.t === '+')) {
        next();
        const n = unary();
        return tk.t === '-' ? { t: 'neg', node: n } : n;
      }
      return power();
    }
    function power() {
      const base = primary();
      if (peek() && peek().t === '^') {
        next();
        const e = next();
        if (!e || e.t !== 'num' || e.v.includes('.')) throw new ParseError('Als Hochzahl sind nur natürliche Zahlen erlaubt.');
        const ex = parseInt(e.v, 10);
        if (ex > 12) throw new ParseError('Diese Hochzahl ist zu groß.');
        return { t: 'pow', base, exp: ex };
      }
      return base;
    }
    function primary() {
      const tk = next();
      if (!tk) throw new ParseError('Die Eingabe ist unvollständig.');
      if (tk.t === 'num') return { t: 'num', v: numToQ(tk.v) };
      if (tk.t === 'var') return { t: 'var', name: tk.v };
      if (tk.t === '(') {
        const inner = expr();
        if (!peek() || peek().t !== ')') throw new ParseError('Eine Klammer wird nicht geschlossen.');
        next();
        return { t: 'paren', node: inner };
      }
      if (tk.t === '=') throw new ParseError('Hier wird kein Gleichheitszeichen erwartet.');
      throw new ParseError('An einer Stelle fehlt eine Zahl oder Variable.');
    }

    const ast = expr();
    if (p < toks.length) {
      throw new ParseError(toks[p].t === ')' ? 'Es gibt eine schließende Klammer zu viel.' :
        toks[p].t === '=' ? 'Hier wird kein Gleichheitszeichen erwartet.' : 'Die Eingabe ist nicht vollständig lesbar.');
    }
    return ast;
  }

  function toPoly(n) {
    switch (n.t) {
      case 'num': return Poly.const(n.v);
      case 'var': return Poly.variable(n.name);
      case 'neg': return toPoly(n.node).neg();
      case 'paren': return toPoly(n.node);
      case 'pow': return toPoly(n.base).pow(n.exp);
      case 'sum':
        return n.items.reduce((acc, it) => {
          const q = toPoly(it.node);
          return acc.add(it.sign > 0 ? q : q.neg());
        }, new Poly());
      case 'prod':
        return n.items.reduce((acc, it) => {
          const q = toPoly(it.node);
          if (it.op === '*') return acc.mul(q);
          if (!q.isConst()) throw new MathError('Durch Variablen kann hier nicht geteilt werden.');
          return acc.mul(Poly.const(new Q(1).div(q.constValue())));
        }, Poly.const(1));
    }
    throw new ParseError('Unbekannter Ausdruck.');
  }

  // ---------- Formprüfungen ----------
  function hasParen(n) {
    switch (n.t) {
      case 'paren': return true;
      case 'neg': return hasParen(n.node);
      case 'pow': return hasParen(n.base);
      case 'sum': case 'prod': return n.items.some(i => hasParen(i.node));
      default: return false;
    }
  }

  // Ist ein Summand ein einzelnes Monom wie 3x, -2ab, x^2, 3/2x?
  function isMonomialNode(n) {
    if (n.t === 'neg') n = n.node;
    const factors = n.t === 'prod' ? n.items : [{ op: '*', node: n }];
    let nums = 0, divs = 0;
    const seen = new Set();
    for (const f of factors) {
      const x = f.node.t === 'neg' && f.node.node.t === 'num' ? f.node.node : f.node; // −54a²b
      if (f.op === '/') {
        if (x.t !== 'num') return false;
        divs++; continue;
      }
      if (x.t === 'num') { nums++; continue; }
      let name = null;
      if (x.t === 'var') name = x.name;
      else if (x.t === 'pow' && x.base.t === 'var' && x.exp >= 2) name = x.base.name;
      if (!name || seen.has(name)) return false;
      seen.add(name);
    }
    return nums <= 1 && divs <= 1;
  }

  // vollständig zusammengefasst: keine Klammern, jedes Monom genau einmal
  function isSimplified(ast, poly) {
    if (hasParen(ast)) return false;
    const summands = ast.t === 'sum' ? ast.items.map(i => i.node) : [ast];
    if (poly.size === 0) return summands.length === 1 && summands[0].t === 'num';
    if (summands.length !== poly.size) return false;
    return summands.every(isMonomialNode);
  }

  // vollständig ausgeklammert: Monom · (Summe), Summe ohne gemeinsamen Faktor
  function isFullyFactored(ast) {
    let n = ast;
    if (n.t === 'neg') n = n.node;
    if (n.t !== 'prod') return false;
    if (n.items.some(i => i.op === '/')) return false;
    const parens = n.items.filter(i => i.node.t === 'paren');
    if (parens.length !== 1) return false;
    const outside = n.items.filter(i => i.node.t !== 'paren').map(i => i.node);
    if (!outside.every(x => x.t === 'num' || x.t === 'var' || (x.t === 'pow' && x.base.t === 'var'))) return false;
    const inner = toPoly(parens[0].node);
    if (inner.size < 2) return false;
    const coefs = [...inner.m.values()];
    if (!coefs.every(c => c.isInt())) return false;
    if (coefs.reduce((g, c) => gcd(g, c.n), 0) !== 1) return false;
    const keys = [...inner.m.keys()].map(keyToObj);
    const common = Object.keys(keys[0]).filter(v => keys.every(o => o[v] > 0));
    return common.length === 0;
  }

  // Zahlwert aus Eingaben wie "3", "-1,5", "3/4", "x = 3", "L = {3}"
  function parseValue(src, varName) {
    let s = normalize(src).replace(/^l=\{(.*)\}$/, '$1').replace(/^\{(.*)\}$/, '$1');
    const parts = s.split('=');
    if (parts.length > 2) throw new ParseError('Bitte nur ein Gleichheitszeichen verwenden.');
    if (parts.length === 2) {
      const [l, r] = parts;
      const isVar = x => /^[a-z]$/.test(x) && (!varName || x === varName);
      if (isVar(l)) s = r;
      else if (isVar(r)) s = l;
      else throw new ParseError('Schreibe die Lösung in der Form ' + (varName || 'x') + ' = …');
    }
    const p = toPoly(parse(s));
    if (!p.isConst()) throw new ParseError('Die Lösung darf keine Variable mehr enthalten.');
    return p.constValue();
  }

  function safe(fn) {
    return input => {
      if (!String(input || '').trim()) return { syntax: true, msg: 'Bitte gib zuerst eine Antwort ein.' };
      try { return fn(input); } catch (e) {
        if (e instanceof ParseError || e instanceof MathError) return { syntax: true, msg: e.message };
        throw e;
      }
    };
  }

  const check = {
    // Zahl / Lösung einer Gleichung
    value: (expected, varName) => safe(input => ({ ok: parseValue(input, varName).eq(expected) })),
    // Term; mode: 'equiv' (gleichwertig), 'simplified' (zusammengefasst), 'factored' (ausgeklammert)
    term: (expected, mode = 'equiv') => safe(input => {
      const ast = parse(input);
      const p = toPoly(ast);
      if (!p.eq(expected)) return { ok: false };
      if (mode === 'simplified' && !isSimplified(ast, p)) {
        return { ok: false, partial: true, msg: 'Gleichwertig – aber noch nicht fertig: Löse alle Klammern auf und fasse vollständig zusammen.' };
      }
      if (mode === 'factored' && !isFullyFactored(ast)) {
        return { ok: false, partial: true, msg: 'Gleichwertig – aber noch nicht vollständig ausgeklammert. Klammere den größten gemeinsamen Faktor aus.' };
      }
      return { ok: true };
    })
  };

  // ---------- Darstellung ----------
  // Markup: 3x^2 - 2(x+1) = 5, * für Mal, / bzw. : für Geteilt, [a/b] für Bruch, | für Umformungsnotiz
  function fmtRaw(s) {
    s = String(s);
    let out = '', prev = null;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c === ' ') continue;
      if (c === '[') {
        const j = s.indexOf(']', i);
        const inner = s.slice(i + 1, j);
        const k = inner.indexOf('/');
        out += '<span class="frac"><span>' + fmtRaw(inner.slice(0, k)) + '</span><span>' + fmtRaw(inner.slice(k + 1)) + '</span></span>';
        i = j; prev = 'v'; continue;
      }
      if (c === '^') {
        let j = i + 1;
        while (j < s.length && /\d/.test(s[j])) j++;
        out += '<sup>' + s.slice(i + 1, j) + '</sup>';
        i = j - 1; prev = 'v'; continue;
      }
      if (/[a-zA-Z]/.test(c)) { out += '<i>' + c + '</i>'; prev = 'v'; continue; }
      if (/[0-9]/.test(c)) { out += c; prev = 'v'; continue; }
      if (c === '.') { out += ','; continue; }
      if (c === '-') { out += (prev === 'v' || prev === ')') ? ' − ' : '−'; prev = 'op'; continue; }
      // am Anfang (z. B. Umformungsnotiz „+5“, „:3“) ohne Abstände
      if (c === '+') { out += prev === null ? '+' : ' + '; prev = 'op'; continue; }
      if (c === '*') { out += prev === null ? '·' : ' · '; prev = 'op'; continue; }
      if (c === '/' || c === ':') { out += prev === null ? ':' : ' : '; prev = 'op'; continue; }
      if (c === '=') { out += ' = '; prev = 'op'; continue; }
      if (c === '|') { out += ' <span class="note">|</span> '; prev = 'op'; continue; }
      if (c === '(') { out += '('; prev = '('; continue; }
      if (c === ')') { out += ')'; prev = ')'; continue; }
      out += RM.esc(c);
    }
    return out;
  }
  function fmt(s) { return '<span class="m">' + fmtRaw(s) + '</span>'; }

  // Live-Anzeige der Schülereingabe
  function fmtInput(raw) {
    let out = '';
    const s = String(raw);
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c === '^') {
        let j = i + 1;
        while (j < s.length && /\d/.test(s[j])) j++;
        out += j > i + 1 ? '<sup>' + s.slice(i + 1, j) + '</sup>' : '^';
        i = j - 1;
      } else if (/[a-z]/.test(c)) out += '<i>' + c + '</i>';
      else out += ({ '*': '·', '-': '−', '.': ',' })[c] || RM.esc(c);
    }
    return out;
  }

  RM.math = { Q, Poly, ParseError, MathError, gcd, parse, toPoly, normalize, parseValue, isSimplified, isFullyFactored, check, fmt, fmtInput };
})(window.RM);
