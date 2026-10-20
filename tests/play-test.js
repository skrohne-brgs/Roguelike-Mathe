// Automatischer Spieltest im Browser: node tests/play-test.js [anzahl] [ausgabeordner]
// Umgebungsvariablen: TOPIC=jg8-flaechen-koerper (Thema), MODE=hausaufgabe (Spielmodus), KIND=pfad|dungeon, ACC=0.85 (Trefferquote)
'use strict';
const path = require('path');
const { chromium, devices } = require('playwright');

const runs = +(process.argv[2] || 3);
const outDir = process.argv[3] || null;
const url = 'file://' + path.join(__dirname, '..', 'index.html');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices['iPad (gen 7) landscape'] });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.stack || e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url);
  const shot = async name => { if (outDir) await page.screenshot({ path: path.join(outDir, name + '.png'), fullPage: false }); };
  const seen = new Set();
  const view = () => page.evaluate(() => RM.debug.view.name);
  const click = sel => page.click(sel);

  for (let r = 0; r < runs; r++) {
    const mode = process.env.MODE || (r % 2 ? 'uebung' : 'klasse');
    if (!(await page.$('[data-act="newInSlot"]'))) { await click('[data-act="deleteSlot"]'); await click('[data-act="deleteSlotYes"]'); }
    await click('[data-act="newInSlot"]');
    const kind = (process.env.KIND || '') || (r % 2 ? 'pfad' : 'dungeon');
    await page.evaluate(k => { const s = JSON.parse(localStorage.getItem('rm.settings') || '{}'); s.kartenart = k; localStorage.setItem('rm.settings', JSON.stringify(s)); }, kind);
    await page.fill('#nick', 'Testheld' + r);
    await click(`[data-act="draft"][data-v="${mode}"]`);
    if (process.env.TOPIC) await click(`[data-act="draft"][data-v="${process.env.TOPIC}"]`);
    if (mode === 'hausaufgabe') await page.fill('#key', 'TEST-' + r);
    if (!seen.has('newrun')) { seen.add('newrun'); await shot('01-neues-abenteuer'); }
    await click('[data-act="startRun"]');
    let steps = 0, stuck = 0;
    while (steps++ < 1500) {
      await page.waitForTimeout(30);
      const v = await view();
      if (!seen.has(v)) { seen.add(v); await shot('v-' + v); }
      if (v === 'runEnd') { await shot('runEnd-' + r); break; }
      if (v === 'combat') {
        const st = await page.evaluate(() => { const e = RM.debug.enc; return { state: e.state, input: e.task.input, correct: e.task.correct, sol: e.task.solutionInput, hidden: e.hidden, n: e.task.choices && e.task.choices.length }; });
        if (st.state === 'solution') {
          if (await page.$('#simHost .sim')) {
            await page.click('#simHost [data-sim="next"]'); await page.waitForTimeout(800);
            const kind = await page.evaluate(() => RM.debug.enc.task.sim.type);
            if (!seen.has('sim-' + kind)) { seen.add('sim-' + kind); await page.$eval('#simHost', el => el.scrollIntoView({ block: 'center' })); await shot('sim-' + kind); }
          }
          await click('[data-act="afterSolution"]'); continue;
        }
        if (st.state !== 'ask') { await page.waitForTimeout(400); continue; }
        const right = Math.random() < +(process.env.ACC || 0.85);
        if (st.input === 'choice') {
          let i = st.correct;
          if (!right) { const w = [...Array(st.n).keys()].filter(k => k !== st.correct && !st.hidden.includes(k)); if (w.length) i = w[0]; }
          await click(`[data-act="choose"][data-i="${i}"]`);
        } else {
          await page.keyboard.press('Escape');
          await page.keyboard.type(right ? st.sol : '12345');
          if (!seen.has('eingabe-' + st.input)) { seen.add('eingabe-' + st.input); await shot('kampf-eingabe-' + st.input); }
          await page.keyboard.press('Enter');
          if (!right) {
            await page.waitForTimeout(50);
            await page.waitForTimeout(250);
            if (!seen.has('falsch')) { seen.add('falsch'); await shot('kampf-falsch'); }
          }
        }
        if (right && !seen.has('rune')) { await page.waitForTimeout(350); seen.add('rune'); await shot('kampf-rune'); }
        await page.waitForTimeout(right ? 1500 : 900);
        continue;
      }
      if (v === 'map') {
        if (await page.evaluate(() => RM.debug.walking)) { await page.waitForTimeout(200); continue; }
        const nodes = await page.$$('.node.avail');
        if (!nodes.length) {
          stuck++;
          if (stuck === 20) { console.log('Pfadkarte: kein Feld verfügbar', await page.evaluate(() => JSON.stringify({ pos: RM.debug.run.pos, done: RM.debug.run.nodeDone, kind: RM.debug.run.kind }))); await shot('haengt-pfad'); }
          await page.waitForTimeout(200); continue;
        }
        stuck = 0;
        await nodes[Math.floor(Math.random() * nodes.length)].click();
        if (!seen.has('karte-vorschau')) { seen.add('karte-vorschau'); await shot('karte-vorschau'); }
        const go = await page.$('[data-act="mapGo"]');
        if (go) await go.click();
        await page.waitForTimeout(1000);
        continue;
      }
      if (['floorIntro', 'victory', 'result', 'floorSummary'].includes(v)) { await click('[data-act="toWorld"], [data-act="go"]'); continue; }
      if (v === 'dungeon') {
        if (await page.$('.modal-bg [data-act="closeModal"]')) { await click('.modal-bg [data-act="closeModal"]'); continue; }
        const go = await page.evaluate(() => {
          const T = RM.dungeon.test, S = T.state, W = RM.dungeon.W, H = RM.dungeon.H;
          if (!S || T.busy) return null;
          const reachable = e => T.canReach(e.x, e.y);
          const st = S.ents.find(e => e.type === 'stairs' && !e.gone);
          if (st) return [st.x, st.y];
          const ms = S.ents.filter(e => !e.gone && (e.type === 'monster' || e.type === 'elite') && T.visible[e.y * W + e.x] && reachable(e));
          if (ms.length) return [ms[0].x, ms[0].y];
          if (S.kills >= S.need) {
            const bo = S.ents.find(e => e.type === 'boss' && !e.gone);
            if (bo && S.explored[bo.y * W + bo.x] && reachable(bo)) return [bo.x, bo.y];
            if (S.explored[S.gate[1] * W + S.gate[0]] && T.canReach(S.gate[0], S.gate[1]) && S.tiles[S.gate[1] * W + S.gate[0]] === 3) return S.gate;
          }
          const fr = [];
          for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
            const i = y * W + x;
            if (S.explored[i] && S.tiles[i] === 0 && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !S.explored[(y + dy) * W + x + dx]) && !(x === S.hero.x && y === S.hero.y) && T.canReach(x, y)) fr.push([x, y, Math.abs(x - S.hero.x) + Math.abs(y - S.hero.y)]);
          }
          fr.sort((a, b) => a[2] - b[2]);
          if (fr.length) return fr[0].slice(0, 2);
          if (S.tiles[S.door[1] * W + S.door[0]] === 2) return S.door;
          const left = S.ents.filter(e => !e.gone && (e.type === 'monster' || e.type === 'elite') && reachable(e));
          return left.length ? [left[0].x, left[0].y] : null;
        });
        if (!go) { await page.waitForTimeout(300); continue; }
        await page.evaluate(([x, y]) => RM.dungeon.test.walkTo(x, y), go);
        if (!seen.has('dungeon-lauf')) { await page.waitForTimeout(400); seen.add('dungeon-lauf'); await shot('dungeon-lauf'); }
        await page.waitForTimeout(900);
        continue;
      }
      if (v === 'bossIntro') { await click('[data-act="bossStart"]'); continue; }
      if (v === 'relicChoice') { await click('[data-act="pickRelic"]'); continue; }
      if (v === 'shop') { const b = await page.$('[data-act="buyItem"], [data-act="buyHeal"]'); if (b) { await b.click(); continue; } await click('[data-act="completeNode"]'); continue; }
      if (v === 'rest') { const c = await page.$$('.card.choice'); await c[Math.floor(Math.random() * c.length)].click(); continue; }
      if (v === 'event') { const o = await page.$$('[data-act="eventOpt"]'); await o[0].click(); continue; }
      if (v === 'quest') { if (mode === 'klasse') await click('[data-act="questPresent"]'); else await click('[data-to="questCheck"]'); continue; }
      if (v === 'pin') { await page.keyboard.type('2468'); await page.keyboard.press('Enter'); continue; }
      if (v === 'questRate') { if (!seen.has('questRevise')) { seen.add('questRevise'); await click('[data-act="questRevise"]'); continue; } await click('[data-act="questRate"][data-s="2"]'); continue; }
      if (v === 'questCheck') { await click('[data-act="questSelf"][data-s="2"]'); continue; }
      throw new Error('Unbekannter Bildschirm: ' + v);
    }
    const res = await page.evaluate(() => { const m = JSON.parse(localStorage.getItem('rm.meta')); return m.runs[0]; });
    console.log(`Durchgang ${r + 1} (${mode}, ${kind}): ${res.victory ? 'Sieg' : 'besiegt auf Ebene ' + res.floor}, Schritte ${steps}`);
    await click('[data-act="go"][data-to="title"]');
  }
  // Trainingsraum, Lernstand, Lehrkraft-Bereich
  await click('[data-to="training"]'); await shot('training');
  await click('[data-act="train"][data-skill="ausklammern"][data-d="2"]'); await shot('training-aufgabe');
  await page.keyboard.type('7x+'); await page.keyboard.press('Enter'); await shot('training-syntaxfehler');
  await click('[data-to="training"]'); await click('[data-to="title"]');
  await click('[data-to="progress"]'); await shot('lernstand'); await click('[data-to="title"]');
  await click('[data-act="teacherLogin"]'); await page.keyboard.type('2468'); await page.keyboard.press('Enter'); await shot('lehrkraft');
  console.log('Gesehene Bildschirme:', [...seen].join(', '));
  console.log(errors.length ? 'FEHLER:\n' + errors.join('\n') : 'Keine JavaScript-Fehler.');
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})();
