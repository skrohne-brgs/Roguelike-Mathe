// Test des Hausaufgabenmodus: node tests/hausaufgabe-test.js [screenshot-ordner]
// Spielt Ebene 1 von „Flächen & Körper“, prüft den Nachweis-Code, den Kontrollpunkt, das Codebuch und die Prüfung durch die Lehrkraft.
'use strict';
const path = require('path');
const { chromium, devices } = require('playwright');
const url = 'file://' + path.join(__dirname, '..', 'index.html');
const out = process.argv[2];

(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ ...devices['iPad (gen 7) landscape'] })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.stack || e.message));
  let fails = 0;
  const ok = (c, m) => { console.log((c ? '✔ ' : '✘ ') + m); if (!c) fails++; };
  const shot = async name => { if (out) await page.screenshot({ path: path.join(out, name + '.png') }); };
  const view = () => page.evaluate(() => RM.debug.view.name);
  await page.goto(url);
  // kurze Ebenen: nur 3 Monster bis zum Boss-Tor
  await page.evaluate(() => localStorage.setItem('rm.settings', JSON.stringify({ monsterMin: 3 })));
  await page.reload();

  await page.click('[data-act="newInSlot"][data-i="0"]');
  await page.click('[data-act="draft"][data-v="hausaufgabe"]');
  await page.click('[data-act="draft"][data-v="jg8-flaechen-koerper"]');
  await page.fill('#nick', 'Lea M.');
  await page.click('[data-act="startRun"]');
  ok(await view() === 'newrun', 'Ohne Aufgabenschlüssel startet kein Abenteuer');
  await page.fill('#key', '8b-test');
  await shot('ha-neues-abenteuer');
  await page.click('[data-act="startRun"]');
  ok(await page.evaluate(() => RM.debug.run.mode === 'hausaufgabe' && RM.debug.run.schluessel === '8B-TEST'), 'Hausaufgabe mit Schlüssel gestartet');

  // Ebene 1 spielen, bis die Zwischenbilanz erscheint (alle Antworten richtig, zwei bewusste Fehler im Boss)
  let bossWrong = 0;
  for (let i = 0; i < 1500; i++) {
    await page.waitForTimeout(30);
    const v = await view();
    if (v === 'floorSummary') break;
    if (v === 'floorIntro' || v === 'victory' || v === 'result') { await page.click('[data-act="toWorld"]'); continue; }
    if (v === 'bossIntro') { await shot('ha-boss-intro'); await page.click('[data-act="bossStart"]'); continue; }
    if (v === 'combat') {
      const st = await page.evaluate(() => { const e = RM.debug.enc; return { kind: e.kind, state: e.state, input: e.task.input, correct: e.task.correct, sol: e.task.solutionInput, hidden: e.hidden, n: e.task.choices && e.task.choices.length }; });
      if (st.state === 'solution') { await page.click('[data-act="afterSolution"]'); continue; }
      if (st.state !== 'ask') { await page.waitForTimeout(300); continue; }
      const wrong = st.kind === 'boss' && bossWrong < 2;
      if (wrong) bossWrong++;
      if (st.input === 'choice') {
        const w = [...Array(st.n).keys()].filter(k => k !== st.correct && !st.hidden.includes(k));
        await page.click(`[data-act="choose"][data-i="${wrong && w.length ? w[0] : st.correct}"]`);
      } else {
        await page.keyboard.press('Escape');
        await page.keyboard.type(wrong ? '99999' : st.sol);
        await page.keyboard.press('Enter');
      }
      await page.waitForTimeout(wrong ? 900 : 1500);
      continue;
    }
    if (v === 'dungeon') {
      if (await page.$('.modal-bg [data-act="closeModal"]')) { await page.click('.modal-bg [data-act="closeModal"]'); continue; }
      const go = await page.evaluate(() => {
        const T = RM.dungeon.test, S = T.state, W = RM.dungeon.W, H = RM.dungeon.H;
        if (!S || T.busy) return null;
        const ms = S.ents.filter(e => !e.gone && e.type === 'monster' && T.visible[e.y * W + e.x] && T.canReach(e.x, e.y));
        if (S.kills < S.need && ms.length) return [ms[0].x, ms[0].y];
        if (S.kills >= S.need) {
          const bo = S.ents.find(e => e.type === 'boss' && !e.gone);
          if (bo && S.explored[bo.y * W + bo.x] && T.canReach(bo.x, bo.y)) return [bo.x, bo.y];
          if (S.explored[S.gate[1] * W + S.gate[0]] && T.canReach(S.gate[0], S.gate[1]) && S.tiles[S.gate[1] * W + S.gate[0]] === 3) return S.gate;
        }
        const fr = [];
        for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
          const i = y * W + x;
          if (S.explored[i] && S.tiles[i] === 0 && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !S.explored[(y + dy) * W + x + dx]) && !(x === S.hero.x && y === S.hero.y) && T.canReach(x, y)) fr.push([x, y, Math.abs(x - S.hero.x) + Math.abs(y - S.hero.y)]);
        }
        fr.sort((a, b) => a[2] - b[2]);
        return fr.length ? fr[0].slice(0, 2) : null;
      });
      if (go) await page.evaluate(([x, y]) => RM.dungeon.test.walkTo(x, y), go);
      await page.waitForTimeout(700);
      continue;
    }
    // Händler, Feuer, Altar, Quest: einfach weiter
    const btn = await page.$('[data-act="completeNode"], [data-act="restHeal"], [data-act="eventOpt"], [data-to="questCheck"], [data-act="questSelf"][data-s="2"]');
    if (btn) { await btn.click(); continue; }
    throw new Error('Unbekannter Bildschirm: ' + v);
  }
  ok(await view() === 'floorSummary', 'Boss der Ebene 1 besiegt');
  const code = await page.evaluate(() => RM.debug.run.lastCode && RM.debug.run.lastCode.code);
  ok(/^FK1S-[A-Z2-9]{6}$/.test(code || ''), 'Code mit Gütestufe Silber (2 Fehler): ' + code);
  ok((await page.textContent('.code-box .code')) === code, 'Code wird in der Zwischenbilanz angezeigt');
  ok(await page.evaluate(c => RM.codes.verify(c, 'leam', '8B-TEST').ok, code), 'Code ist für Kürzel und Schlüssel gültig');
  await page.$eval('.code-box', el => el.scrollIntoView({ block: 'center' }));
  await shot('ha-code');

  // Aufgeben → Kontrollpunkt
  await page.click('[data-act="go"][data-to="relicChoice"]');
  await page.click('[data-act="pickRelic"]');
  await page.click('[data-act="pause"]'); await page.click('[data-act="giveUp"]'); await page.click('[data-act="giveUpYes"]');
  ok(await view() === 'runEnd', 'Auswertung nach dem Aufgeben');
  ok((await page.textContent('.report')).includes(code), 'Auswertung listet den Code');
  await shot('ha-auswertung');
  await page.click('[data-act="retryCheckpoint"]');
  ok(await view() === 'newrun' && !!(await page.$('[data-act="draftFloor"][data-i="1"].on')), 'Kontrollpunkt: Ebene 2 ist vorausgewählt');
  await page.click('[data-act="startRun"]');
  ok(await page.evaluate(() => RM.debug.run.floor === 1 && RM.debug.run.mode === 'hausaufgabe'), 'Neues Abenteuer startet auf Ebene 2');
  await page.click('[data-act="toWorld"]');
  await page.click('[data-act="pause"]'); await page.click('[data-act="toTitle"]');

  // Codebuch
  await page.click('[data-to="codes"]');
  ok((await page.textContent('.report')).includes(code), 'Codebuch zeigt den Code');
  await shot('ha-codebuch');
  await page.click('[data-to="title"]');

  // Lehrkraft prüft
  await page.click('[data-act="teacherLogin"]'); await page.keyboard.type('2468'); await page.keyboard.press('Enter');
  await page.click('[data-to="verify"]');
  await page.fill('#vKey', '8b-test');
  await page.fill('#vText', 'LeaM ' + code + '\ntim ' + code);
  await page.click('[data-act="verifyRun"]');
  ok((await page.$$('.verify .ok')).length === 1 && (await page.$$('.verify .bad')).length === 1, 'Prüfung: Lea gültig, Tim ungültig');
  await shot('ha-pruefung');

  ok(!errors.length, 'Keine JavaScript-Fehler ' + errors.join(' | '));
  await browser.close();
  process.exit(fails ? 1 : 0);
})();
