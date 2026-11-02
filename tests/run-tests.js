// Automatische Tests für Mathe-Kern und Aufgaben-Generatoren: node tests/run-tests.js
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const ctx = { console, Math, JSON, Object, Array, String, Number, Map, Set, Error };
ctx.window = ctx;
vm.createContext(ctx);
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]).filter(s => !s.includes('app.js'));
for (const s of scripts) vm.runInContext(fs.readFileSync(path.join(root, s), 'utf8'), ctx, { filename: s });

const RM = ctx.RM;
const { check, Q, parseValue } = RM.math;
let failures = 0, passes = 0;
function assert(cond, msg) {
  if (cond) passes++;
  else { failures++; console.error('✘ ' + msg); }
}

// ---------- Mathe-Kern ----------
const P = RM.T.P;
const eqT = (a, b) => assert(P(a).eq(P(b)), `${a} ≡ ${b}`);
const neT = (a, b) => assert(!P(a).eq(P(b)), `${a} ≢ ${b}`);
eqT('2x+3', '3+2x');
eqT('3(x+4)', '3x+12');
eqT('-(x-4)', '-x+4');
eqT('2x·3x', '6x²');
eqT('x/2+1', '0,5x+1');
eqT('(x+1)(x-1)', 'x^2-1');
eqT('3a*4b', '12ab');
eqT('2(x+3)-3(x-1)', '-x+9');
neT('2x+3', '2x+4');
neT('x^2', '2x');

const simp = check.term(P('6x+2'), 'simplified');
assert(simp('6x+2').ok, 'simplified: 6x+2');
assert(simp('2+6x').ok, 'simplified: 2+6x');
assert(simp('4x+2x+2').partial, 'simplified: 4x+2x+2 ist nicht fertig');
assert(simp('2(3x+1)').partial, 'simplified: Klammer ist nicht fertig');
assert(simp('6x+3').ok === false && !simp('6x+3').partial, 'simplified: 6x+3 ist falsch');
assert(simp('6x+').syntax, 'Syntaxfehler wird erkannt');
assert(simp('(6x+2').syntax, 'Offene Klammer wird erkannt');
assert(simp('x6+2').syntax, 'x6 wird erkannt');

const sq = check.term(P('-10x^2'), 'simplified');
assert(sq('-10x^2').ok, '-10x^2');
assert(sq('-10x²').ok, '-10x²');
assert(sq('-10x·x').partial, '-10x·x ist nicht fertig');

const fac = check.term(P('6x+9'), 'factored');
assert(fac('3(2x+3)').ok, 'factored: 3(2x+3)');
assert(fac('3·(2x+3)').ok, 'factored: 3·(2x+3)');
assert(fac('(2x+3)3').ok, 'factored: (2x+3)3');
assert(fac('6x+9').partial, 'factored: nicht ausgeklammert');
assert(fac('1,5(4x+6)').partial, 'factored: nicht vollständig');
const fac2 = check.term(P('6x^2+9x'), 'factored');
assert(fac2('3x(2x+3)').ok, 'factored: 3x(2x+3)');
assert(fac2('3(2x^2+3x)').partial, 'factored: x nicht ausgeklammert');

const val = check.value(new Q(3, 2), 'x');
['x=3/2', '1,5', '3/2', 'x = 1.5', 'L={1,5}', '1.5=x'].forEach(s => assert(val(s).ok, 'Lösung ' + s));
assert(!val('2').ok, 'falsche Lösung');
assert(val('y=1,5').syntax, 'falsche Variable');
assert(parseValue('-(-3)').eq(3), '-(-3) = 3');

// ---------- Generatoren ----------
const N = 400;
for (const topic of RM.topics) {
  for (const [id, skill] of Object.entries(topic.skills)) {
    for (let d = 1; d <= 3; d++) {
      for (let i = 0; i < N; i++) {
        let t;
        try { t = RM.makeTask(topic, id, d); } catch (e) { assert(false, `${id} d${d}: Generator wirft ${e.stack}`); break; }
        const tag = `${id} d${d}: ${t.prompt.replace(/<[^>]+>/g, '').slice(0, 120)}`;
        assert(typeof t.prompt === 'string' && t.prompt.length > 10, tag + ' – Aufgabentext');
        assert(t.steps.length > 0, tag + ' – Lösungsweg');
        assert(!/NaN|undefined|Infinity|\[object/.test(t.prompt + t.steps.join('') + (t.answerHtml || '') + (t.figure || '') + (t.figureSolution || '') + (t.choices || []).join('')), tag + ' – kaputte Ausgabe');
        if (t.input === 'choice') {
          assert(t.correct >= 0 && t.correct < t.choices.length, tag + ' – richtige Option');
          assert(t.choices.length >= 2, tag + ' – genug Optionen');
          assert(new Set(t.choices).size === t.choices.length, tag + ' – Optionen verschieden');
        } else {
          const r = t.check(t.solutionInput);
          assert(r.ok === true, tag + ` – Musterlösung "${t.solutionInput}" wird nicht akzeptiert (${JSON.stringify(r)})`);
          const w = t.check(t.solutionInput + '+1');
          assert(w.ok !== true, tag + ' – falsche Antwort wird akzeptiert');
          assert(t.time > 0, tag + ' – Zielzeit');
        }
      }
    }
  }
  for (const f of topic.floors) {
    for (const s of f.skills.concat(...f.boss.phases.map(p => p.skills))) assert(topic.skills[s], `${f.id}: Fähigkeit ${s} existiert`);
    for (const q of f.quests) {
      const quest = q();
      assert(quest.title && quest.text && quest.self && quest.check.length, `${f.id}: Quest ${quest.title} vollständig`);
    }
  }
}

// ---------- Würfelnetze ----------
{
  // alle 35 freien Hexominos durch Anbauen erzeugen; genau 11 davon sind Würfelnetze
  let shapes = new Map([[RM.fig.shapeKey([[0, 0]]), [[0, 0]]]]);
  for (let n = 2; n <= 6; n++) {
    const next = new Map();
    for (const cells of shapes.values()) {
      for (const [x, y] of cells) {
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          if (cells.some(c => c[0] === x + dx && c[1] === y + dy)) continue;
          const c2 = cells.concat([[x + dx, y + dy]]);
          next.set(RM.fig.shapeKey(c2), c2);
        }
      }
    }
    shapes = next;
  }
  assert(shapes.size === 35, 'Es gibt 35 Hexominos (gefunden: ' + shapes.size + ')');
  const nets = [...shapes.values()].filter(c => RM.fig.isCubeNet(c));
  assert(nets.length === 11, 'Genau 11 Würfelnetze (gefunden: ' + nets.length + ')');
}

// ---------- Nachweis-Codes ----------
{
  const C = RM.codes;
  const tp = RM.getTopic('jg8-flaechen-koerper');
  const code = C.make(tp.id, 1, 'S', 'Lea M.', '8b-herbst');
  assert(/^FK2S-[A-Z2-9]{6}$/.test(code), 'Codeformat ' + code);
  assert(!/[01ILO]/.test(code.slice(5)), 'keine verwechselbaren Zeichen');
  let v = C.verify(code, 'leam', '8B-HERBST');
  assert(v.ok && v.floor === 1 && v.stufe === 'S' && v.topic.id === tp.id, 'Code wird erkannt (Kürzel/Schlüssel normalisiert)');
  assert(C.verify(code.toLowerCase().replace('-', ' '), 'LEA M', '8b herbst').ok, 'Kleinschreibung und Leerzeichen egal');
  assert(!C.verify(code, 'tim', '8B-HERBST').ok, 'anderes Kürzel → ungültig');
  assert(!C.verify(code, 'leam', '8C-HERBST').ok, 'anderer Schlüssel → ungültig');
  assert(!C.verify(code.replace('2S', '2G'), 'leam', '8B-HERBST').ok, 'Gütestufe nicht fälschbar');
  assert(!C.verify(code.replace('FK2', 'FK3'), 'leam', '8B-HERBST').ok, 'Ebene nicht fälschbar');
  assert(!C.verify('FK9G-ABCDEF', 'leam', 'X').ok && !C.verify('Quatsch', 'leam', 'X').ok, 'unsinnige Codes');
  assert(C.verify(C.make('jg7-terme-gleichungen', 2, 'G', 'tom', 'KEY'), 'tom', 'KEY').topic.id === 'jg7-terme-gleichungen', 'Codes auch für Jg. 7');
  assert(C.normKuerzel('Jürgen Ö.') === 'juergenoe', 'Umlaute im Kürzel');
  assert(C.stufeFor(0) === 'G' && C.stufeFor(1) === 'G' && C.stufeFor(2) === 'S' && C.stufeFor(3) === 'S' && C.stufeFor(4) === 'B', 'Gütestufen');
  // verschiedene Schüler bekommen verschiedene Codes
  const seen = new Set();
  for (let i = 0; i < 2000; i++) seen.add(C.make(tp.id, 0, 'G', 'kind' + i, 'KEY'));
  assert(seen.size === 2000, 'keine Code-Kollisionen bei 2000 Kürzeln');
  const list = C.verifyList('leam; ' + code + ' FK1G-AAAAAA\n\ntim\t' + C.make(tp.id, 0, 'B', 'tim', '8B-HERBST'), '8B-HERBST');
  assert(list.length === 2 && list[0].kuerzel === 'leam' && list[0].results.length === 2 && list[0].results[0].ok && !list[0].results[1].ok, 'Sammelprüfung Zeile 1');
  assert(list[1].kuerzel === 'tim' && list[1].results[0].ok && list[1].results[0].stufe === 'B', 'Sammelprüfung Zeile 2');
}

// ---------- Dungeon-Erzeugung ----------
{
  const { W, H } = RM.dungeon;
  const reach = (S, sx, sy, passGate) => {
    const seen = new Set([sy * W + sx]), q = [[sx, sy]];
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, k = ny * W + nx, t = S.tiles[k];
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen.has(k) || !(t === 0 || (passGate && (t === 2 || t === 3)))) continue;
        seen.add(k); q.push([nx, ny]);
      }
    }
    return seen;
  };
  for (let i = 0; i < 300; i++) {
    const S = RM.dungeon.generate({ enemies: ['🦇', '🐀'], elite: '🧟', boss: '👹', need: 5, quest: i % 2 === 0 });
    const tag = 'Dungeon ' + i;
    const boss = S.ents.find(e => e.type === 'boss');
    const r0 = reach(S, S.hero.x, S.hero.y, false), rAll = reach(S, S.hero.x, S.hero.y, true);
    assert(!r0.has(boss.y * W + boss.x), tag + ': Boss nur über das Tor erreichbar');
    assert(rAll.has(boss.y * W + boss.x), tag + ': Boss über das Tor erreichbar');
    assert(S.ents.every(e => S.tiles[e.y * W + e.x] === 0 && rAll.has(e.y * W + e.x)), tag + ': alle Objekte stehen erreichbar auf Boden');
    assert(new Set(S.ents.map(e => e.y * W + e.x)).size === S.ents.length, tag + ': keine Objekte übereinander');
    const mons = S.ents.filter(e => e.type === 'monster' || e.type === 'elite').length;
    assert(mons >= 6 && S.need <= mons, tag + ': genug Monster für das Boss-Tor');
    assert(S.ents.some(e => e.type === (i % 2 === 0 ? 'board' : 'altar')), tag + ': Quest-Brett nur mit Quests');
    assert(JSON.parse(JSON.stringify(S)).tiles.length === W * H, tag + ': Zustand ist speicherbar');
  }
}

console.log(`${passes} Prüfungen bestanden, ${failures} fehlgeschlagen.`);
process.exit(failures ? 1 : 0);
