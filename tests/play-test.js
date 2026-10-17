// Automatischer Spieltest im Browser: node tests/play-test.js [anzahl] [ausgabeordner]
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
    const mode = r % 2 ? 'uebung' : 'klasse';
    if (!(await page.$('[data-act="newInSlot"]'))) { await click('[data-act="deleteSlot"]'); await click('[data-act="deleteSlotYes"]'); }
    await click('[data-act="newInSlot"]');
    await page.fill('#nick', 'Testheld' + r);
    await click(`[data-act="draft"][data-v="${mode}"]`);
    if (!seen.has('newrun')) { seen.add('newrun'); await shot('01-neues-abenteuer'); }
    await click('[data-act="startRun"]');
    let steps = 0;
    while (steps++ < 600) {
      await page.waitForTimeout(30);
      const v = await view();
      if (!seen.has(v)) { seen.add(v); await shot('v-' + v); }
      if (v === 'runEnd') { await shot('runEnd-' + r); break; }
      if (v === 'combat') {
        const st = await page.evaluate(() => { const e = RM.debug.enc; return { state: e.state, input: e.task.input, correct: e.task.correct, sol: e.task.solutionInput, hidden: e.hidden, n: e.task.choices && e.task.choices.length }; });
        if (st.state === 'solution') { if (!seen.has('solution')) { seen.add('solution'); await shot('kampf-loesungsweg'); } await click('[data-act="afterSolution"]'); continue; }
        if (st.state !== 'ask') { await page.waitForTimeout(400); continue; }
        const right = Math.random() < +(process.env.ACC || 0.85);
        if (st.input === 'choice') {
          let i = st.correct;
          if (!right) { const w = [...Array(st.n).keys()].filter(k => k !== st.correct && !st.hidden.includes(k)); if (w.length) i = w[0]; }
          await click(`[data-act="choose"][data-i="${i}"]`);
        } else {
          await page.keyboard.type(right ? st.sol : '12345');
          if (!seen.has('eingabe-' + st.input)) { seen.add('eingabe-' + st.input); await shot('kampf-eingabe-' + st.input); }
          await page.keyboard.press('Enter');
          if (!right) {
            await page.waitForTimeout(50);
            if (!seen.has('falsch')) { seen.add('falsch'); await shot('kampf-falsch'); }
            for (let k = 0; k < 6; k++) await page.keyboard.press('Backspace');
          }
        }
        await page.waitForTimeout(right ? 1400 : 100);
        continue;
      }
      if (v === 'map') { const nodes = await page.$$('.node.available'); await nodes[Math.floor(Math.random() * nodes.length)].click(); continue; }
      if (['floorIntro', 'victory', 'result', 'floorSummary'].includes(v)) { await click('[data-act="go"]'); continue; }
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
    console.log(`Durchgang ${r + 1} (${mode}): ${res.victory ? 'Sieg' : 'besiegt auf Ebene ' + res.floor}, Schritte ${steps}`);
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
