// Test der drei Spielstände: node tests/slot-test.js [screenshot-ordner]
'use strict';
const path = require('path');
const { chromium, devices } = require('playwright');
const url = 'file://' + path.join(__dirname, '..', 'index.html');
const out = process.argv[2];

(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ ...devices['iPad (gen 7) landscape'] })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  let fails = 0;
  const ok = (c, m) => { console.log((c ? '✔ ' : '✘ ') + m); if (!c) fails++; };
  const slotsData = () => page.evaluate(() => JSON.parse(localStorage.getItem('rm.slots') || 'null'));
  await page.goto(url);

  async function newGame(i, name) {
    await page.click(`[data-act="newInSlot"][data-i="${i}"]`);
    await page.fill('#nick', name);
    await page.click('[data-act="startRun"]');
    await page.click('[data-act="go"][data-to="map"]');
    await page.click('.node.avail');                // Feld antippen (Vorschau)
    await page.click('[data-act="mapGo"]');          // ersten Kampf betreten
    await page.waitForFunction(() => RM.debug.view.name === 'combat');
    await page.click('[data-act="pause"]');
    await page.click('[data-act="toTitle"]');
  }

  await newGame(0, 'Anna');
  await newGame(1, 'Ben');
  let s = await slotsData();
  ok(s[0] && s[0].name === 'Anna' && s[1] && s[1].name === 'Ben' && !s[2], 'Zwei Abenteuer liegen in Platz 1 und 2');
  ok(!(await page.$('[data-act="newInSlot"][data-i="0"]')), 'Belegter Platz bietet kein „Neues Abenteuer“ an');

  await page.reload();
  ok((await page.$$('[data-act="loadSlot"]')).length === 2, 'Nach dem Neuladen sind beide Spielstände da');
  if (out) await page.screenshot({ path: path.join(out, 'spielstaende.png') });

  await page.click('[data-act="loadSlot"][data-i="0"]');
  ok(await page.evaluate(() => RM.debug.run.name) === 'Anna', 'Platz 1 lädt Anna');
  await page.click('[data-act="pause"]'); await page.click('[data-act="toTitle"]');

  await page.click('[data-act="deleteSlot"][data-i="1"]');
  await page.click('[data-act="closeModal"]');
  ok((await slotsData())[1], 'Abbrechen beim Löschen behält den Spielstand');
  await page.click('[data-act="deleteSlot"][data-i="1"]');
  await page.click('[data-act="deleteSlotYes"]');
  s = await slotsData();
  ok(!s[1] && s[0].name === 'Anna', 'Löschen entfernt nur Platz 2');

  // Übernahme eines Spielstands aus der alten Version (rm.run)
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('rm.slots')); localStorage.setItem('rm.run', JSON.stringify(s[0])); localStorage.removeItem('rm.slots'); });
  await page.reload();
  s = await slotsData();
  ok(s && s[0] && s[0].name === 'Anna' && !(await page.evaluate(() => localStorage.getItem('rm.run'))), 'Alter Spielstand wird in Platz 1 übernommen');

  // Abenteuer beenden leert nur den eigenen Platz
  await newGame(2, 'Cem');
  await page.click('[data-act="loadSlot"][data-i="2"]');
  await page.click('[data-act="pause"]'); await page.click('[data-act="giveUp"]'); await page.click('[data-act="giveUpYes"]');
  s = await slotsData();
  ok(!s[2] && s[0].name === 'Anna', 'Aufgeben leert nur Platz 3');

  ok(!errors.length, 'Keine JavaScript-Fehler ' + errors.join(' | '));
  await browser.close();
  process.exit(fails ? 1 : 0);
})();
