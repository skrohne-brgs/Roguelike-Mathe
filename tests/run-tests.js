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
        assert(!/NaN|undefined|Infinity|\[object/.test(t.prompt + t.steps.join('') + (t.answerHtml || '')), tag + ' – kaputte Ausgabe');
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

console.log(`${passes} Prüfungen bestanden, ${failures} fehlgeschlagen.`);
process.exit(failures ? 1 : 0);
