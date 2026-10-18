// Spiel-Engine: Bildschirme, Karte, Kämpfe, Händler, Rastplätze, Ereignisse, Quests, Auswertung
(function (RM) {
  'use strict';
  const R = RM.rand, esc = RM.esc;
  const { fmtInput } = RM.math;
  const $app = () => document.getElementById('app');

  // ================= Speicher =================
  const DEFAULT_SETTINGS = { zeitdruck: 'moderat', zeitfaktor: 1, schwierigkeit: 'normal', quests: true, alleKlassen: false, pin: '', klang: false, bewegung: 'normal' };
  const settings = () => Object.assign({}, DEFAULT_SETTINGS, RM.store.get('rm.settings', {}));
  const saveSettings = s => RM.store.set('rm.settings', s);
  const teacherPin = () => settings().pin || RM.CONFIG.lehrerPin;
  const applyFx = () => { const s = settings(); RM.fx.configure({ sound: s.klang, reduced: s.bewegung === 'reduziert' }); };
  const sfx = RM.fx.sfx;
  const byId = id => document.getElementById(id);

  const DEFAULT_META = { xp: 0, bossKills: 0, runs: [], skillStats: {}, name: '' };
  const meta = () => Object.assign({}, DEFAULT_META, RM.store.get('rm.meta', {}));
  const saveMeta = m => RM.store.set('rm.meta', m);

  // Drei Spielstände; ein belegter Platz wird nie automatisch überschrieben
  const SLOTS = 3;
  function loadSlots() {
    let list = RM.store.get('rm.slots', null);
    if (!Array.isArray(list)) {
      list = [];
      const old = RM.store.get('rm.run', null); // Spielstand aus der Version mit nur einem Platz übernehmen
      if (old) list.push(old);
      RM.store.set('rm.slots', list);
      RM.store.remove('rm.run');
    }
    return Array.from({ length: SLOTS }, (_, i) => {
      const r = list[i];
      return r && r.v && RM.getTopic(r.topicId) ? r : null;
    });
  }
  const slots = loadSlots();
  let slot = -1;   // aktiver Spielstand
  let run = null;  // = slots[slot], solange ein Abenteuer läuft
  const saveRun = () => {
    if (!run || slot < 0) return;
    run.updatedAt = Date.now();
    slots[slot] = run;
    RM.store.set('rm.slots', slots);
  };
  function clearSlot(i) {
    slots[i] = null;
    RM.store.set('rm.slots', slots);
  }

  let enc = null;   // aktuelle Begegnung (Kampf, Ereignisaufgabe oder Training)
  let view = { name: 'title', params: {} };

  const topic = () => RM.getTopic(run.topicId);
  const floor = () => topic().floors[run.floor];
  const cls = () => RM.CLASSES[run.cls];
  const hasRelic = id => !!run && run.relics.includes(id) && !(enc && enc.kind === 'training');
  const goldAmt = g => Math.round(g * (run ? cls().goldFactor : 1));
  const heal = n => { run.hp = Math.min(run.maxHp, run.hp + n); };

  const NODE = {
    battle: { emoji: '⚔️', name: 'Gegner' },
    elite: { emoji: '💀', name: 'Elitegegner' },
    event: { emoji: '❓', name: 'Ereignis' },
    shop: { emoji: '🛒', name: 'Händler' },
    rest: { emoji: '🔥', name: 'Rastplatz' },
    quest: { emoji: '📜', name: 'Analoge Quest' },
    boss: { emoji: '👑', name: 'Boss' }
  };

  // ================= Darstellung =================
  const screens = {};
  const mounts = {};
  const A = {}; // Aktionen (data-act)

  let simCleanup = null;
  function show(name, params = {}) {
    stopTimer();
    closeModal();
    RM.fx.stopMap();
    if (simCleanup) { simCleanup(); simCleanup = null; }
    view = { name, params };
    $app().innerHTML = screens[name](params);
    $app().scrollTop = 0;
    window.scrollTo(0, 0);
    if (mounts[name]) mounts[name](params);
  }

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    RM.fx.unlock();
    const fn = A[el.dataset.act];
    if (fn) { e.preventDefault(); fn(el.dataset, el); }
  });

  let toastTimer = null;
  function toast(msg, kind = 'info') {
    const el = document.getElementById('toast');
    el.innerHTML = msg;
    el.className = 'show ' + kind;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.className = ''; }, 2800);
  }

  function modal(html) {
    closeModal();
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = '<div class="modal">' + html + '</div>';
    document.body.appendChild(bg);
  }
  function closeModal() { document.querySelectorAll('.modal-bg').forEach(x => x.remove()); }
  A.closeModal = closeModal;

  function confirmBox(text, actYes, labelYes, extra = '') {
    modal('<p>' + text + '</p><div class="row"><button class="btn ghost" data-act="closeModal">Abbrechen</button>' +
      '<button class="btn danger" data-act="' + actYes + '" ' + extra + '>' + labelYes + '</button></div>');
  }

  function hud() {
    const pct = Math.max(0, run.hp / run.maxHp * 100);
    const slots = [0, 1, 2].map(i => {
      const id = run.items[i];
      return id ? '<button class="slot" data-act="itemInfo" data-i="' + i + '" aria-label="' + RM.ITEMS[id].name + '">' + RM.ITEMS[id].emoji + '</button>'
        : '<span class="slot empty"></span>';
    }).join('');
    const relics = run.relics.map(id => '<button class="relic" data-act="relicInfo" data-id="' + id + '" aria-label="' + RM.RELICS[id].name + '">' + RM.RELICS[id].emoji + '</button>').join('');
    return '<header class="hud">' +
      '<div class="hud-hp"><span>❤️ ' + run.hp + ' / ' + run.maxHp + (run.shield ? ' 🔰' : '') + '</span><div class="bar"><div style="width:' + pct + '%"></div></div></div>' +
      '<div class="hud-gold">🪙 ' + run.gold + '</div>' +
      '<div class="hud-items">' + slots + '</div>' +
      '<div class="hud-relics">' + relics + '</div>' +
      '<button class="hud-menu" data-act="pause" aria-label="Menü">☰</button>' +
      '</header>';
  }

  // ================= Gegenstände & Relikte =================
  function canUse(id) {
    const inTask = view.name === 'combat' && enc && enc.state === 'ask';
    switch (id) {
      case 'trank': return run.hp < run.maxHp ? { ok: true } : { ok: false, why: 'Du hast bereits volle Lebenspunkte.' };
      case 'merkzettel':
        if (!inTask) return { ok: false, why: 'Nur während einer Aufgabe nutzbar.' };
        return enc.hintShown ? { ok: false, why: 'Der Tipp wird schon angezeigt.' } : { ok: true };
      case 'sanduhr':
        if (!inTask || !timerOn()) return { ok: false, why: 'Nur während einer Aufgabe mit Zeitdruck nutzbar.' };
        return enc.timeBoost > 1 ? { ok: false, why: 'Die Sanduhr läuft bereits.' } : { ok: true };
      case 'amulett': return run.shield ? { ok: false, why: 'Ein Amulett schützt dich bereits.' } : { ok: true };
    }
    return { ok: false, why: '' };
  }

  A.itemInfo = d => {
    const id = run.items[+d.i], it = RM.ITEMS[id], u = canUse(id);
    modal('<div class="big-emoji">' + it.emoji + '</div><h3>' + it.name + '</h3><p>' + it.desc + '</p>' +
      (u.ok ? '' : '<p class="muted">' + u.why + '</p>') +
      '<div class="row"><button class="btn ghost" data-act="closeModal">Zurück</button>' +
      (u.ok ? '<button class="btn" data-act="useItem" data-i="' + d.i + '">Benutzen</button>' : '') + '</div>');
  };

  A.useItem = d => {
    const i = +d.i, id = run.items[i];
    if (!id || !canUse(id).ok) return closeModal();
    run.items.splice(i, 1);
    if (id === 'trank') { heal(3); toast('🧪 +3 Lebenspunkte', 'good'); }
    if (id === 'merkzettel') enc.hintShown = true;
    if (id === 'sanduhr') { enc.timeBoost = 2; toast('⏳ Du hast jetzt doppelt so viel Zeit.', 'good'); }
    if (id === 'amulett') { run.shield = true; toast('🔰 Das Amulett schützt dich vor dem nächsten Fehler.', 'good'); }
    saveRun();
    closeModal();
    if (view.name === 'combat') refreshCombat(); else show(view.name, view.params);
  };

  A.relicInfo = d => {
    const r = RM.RELICS[d.id];
    modal('<div class="big-emoji">' + r.emoji + '</div><h3>' + r.name + '</h3><p>' + r.desc + '</p><div class="row"><button class="btn" data-act="closeModal">OK</button></div>');
  };

  function randomRelic(exclude = []) {
    const free = Object.keys(RM.RELICS).filter(id => !run.relics.includes(id) && !exclude.includes(id));
    return free.length ? R.pick(free) : null;
  }
  function gainRelic(id) {
    run.relics.push(id);
    if (id === 'kristallherz') { run.maxHp += 3; run.hp += 3; }
  }
  function gainItem() {
    if (run.items.length >= 3) return null;
    const id = R.pick(Object.keys(RM.ITEMS));
    run.items.push(id);
    return id;
  }

  // ================= Titel =================
  screens.title = () => {
    const m = meta();
    return '<section class="screen title-screen">' +
      '<div class="logo"><div class="logo-emoji">🏰</div><h1>Die Gewölbe<br>des Pythagoras</h1><p class="sub">Ein Mathe-Roguelike</p></div>' +
      '<h3 class="center">Spielstände</h3><div class="slots">' + slots.map(slotCard).join('') + '</div>' +
      '<div class="menu">' +
      '<button class="btn ghost" data-act="go" data-to="training">🎯 Trainingsraum</button>' +
      '<button class="btn ghost" data-act="go" data-to="progress">📊 Mein Lernstand</button>' +
      '<button class="btn ghost" data-act="go" data-to="help">❔ Spielanleitung</button>' +
      '<div class="row"><button class="btn ghost small" data-act="toggleSound">' + soundLabel() + '</button>' +
      '<button class="btn ghost small" data-act="teacherLogin">🔑 Lehrkraft</button></div>' +
      '</div>' +
      '<p class="muted center">⭐ ' + m.xp + ' Erfahrungspunkte · Alle Daten bleiben nur auf diesem Gerät.</p>' +
      '</section>';
  };
  A.go = d => show(d.to);

  function slotCard(r, i) {
    const head = '<div class="slot-head"><span class="slot-no">Spielstand ' + (i + 1) + '</span>';
    if (!r) {
      return '<div class="slot-card empty">' + head + '</div><p class="muted">frei</p>' +
        '<button class="btn" data-act="newInSlot" data-i="' + i + '">⚔️ Neues Abenteuer</button></div>';
    }
    const c = RM.CLASSES[r.cls], tp = RM.getTopic(r.topicId);
    return '<div class="slot-card">' + head +
      '<button class="slot-del" data-act="deleteSlot" data-i="' + i + '" aria-label="Spielstand ' + (i + 1) + ' löschen">🗑️</button></div>' +
      '<div class="slot-name">' + c.emoji + ' ' + esc(r.name) + '</div>' +
      '<small>Jg. ' + tp.grade + ': ' + esc(tp.title) + ' · ' + (r.mode === 'klasse' ? 'Klassenmodus' : 'Übungsmodus') + '</small>' +
      '<div class="slot-stats">Ebene ' + (r.floor + 1) + '/' + tp.floors.length + ' · ❤️ ' + r.hp + '/' + r.maxHp + ' · 🪙 ' + r.gold + '</div>' +
      (r.updatedAt ? '<small>zuletzt gespielt: ' + dateStr(new Date(r.updatedAt).toISOString()) + '</small>' : '') +
      '<button class="btn" data-act="loadSlot" data-i="' + i + '">▶ Weiterspielen</button></div>';
  }
  A.loadSlot = d => {
    slot = +d.i;
    run = slots[slot];
    A.continueRun();
  };
  A.newInSlot = d => {
    if (slots[+d.i]) return; // belegte Plätze nie überschreiben
    slot = +d.i;
    run = null;
    startDraft();
  };
  A.deleteSlot = d => {
    const r = slots[+d.i];
    if (!r) return;
    confirmBox('Spielstand ' + (+d.i + 1) + ' von <b>' + esc(r.name) + '</b> (Ebene ' + (r.floor + 1) + ') wirklich löschen? Das kann nicht rückgängig gemacht werden. Erfahrung und Lernstand bleiben erhalten.',
      'deleteSlotYes', 'Löschen', 'data-i="' + d.i + '"');
  };
  A.deleteSlotYes = d => {
    clearSlot(+d.i);
    show('title');
    toast('Spielstand ' + (+d.i + 1) + ' wurde gelöscht.', 'good');
  };

  // ================= Neuer Durchgang =================
  let draft = null;
  function startDraft() {
    draft = { name: meta().name || '', mode: 'klasse', topicId: RM.topics[0].id, cls: 'abenteurer', ruhe: false };
    show('newrun');
  }
  const classUnlocked = (c, m) => settings().alleKlassen || !c.unlock || c.unlock.test(m);

  screens.newrun = () => {
    const m = meta(), s = settings();
    const card = (k, v, emoji, title, text, disabled) =>
      '<button class="card choice ' + (draft[k] === v ? 'selected' : '') + '" ' + (disabled ? 'disabled' : 'data-act="draft" data-k="' + k + '" data-v="' + v + '"') + '>' +
      '<div class="card-emoji">' + emoji + '</div><b>' + title + '</b><small>' + text + '</small></button>';
    const classes = Object.entries(RM.CLASSES).map(([id, c]) => {
      const ok = classUnlocked(c, m);
      return card('cls', id, ok ? c.emoji : '🔒', c.name, ok ? c.desc + '<br>❤️ ' + c.hp + ' · 🪙 ' + c.gold : c.unlock.text, !ok);
    }).join('');
    const topics = RM.topics.map(t => card('topicId', t.id, '📚', 'Jg. ' + t.grade + ': ' + t.title, t.description)).join('');
    let ruhe = '';
    if (draft.mode === 'uebung') ruhe = '<label class="check"><input type="checkbox" id="ruhe" ' + (draft.ruhe ? 'checked' : '') + '> Ruhemodus – ohne Zeitdruck spielen</label>';
    else if (s.zeitdruck === 'aus') ruhe = '<p class="muted">Der Ruhemodus (ohne Zeitdruck) ist auf diesem Gerät eingeschaltet.</p>';
    return '<section class="screen narrow">' +
      '<h2>Neues Abenteuer</h2><p class="muted">Wird in Spielstand ' + (slot + 1) + ' gespeichert.</p>' +
      '<label class="field">Dein Spitzname <small>(bitte nicht deinen vollständigen Namen)</small><input id="nick" maxlength="20" autocomplete="off" value="' + esc(draft.name) + '"></label>' +
      '<h3>Spielmodus</h3><div class="cards two">' +
      card('mode', 'klasse', '🏫', 'Klassenmodus', 'Im Unterricht: Analoge Quests legst du deiner Lehrkraft vor.') +
      card('mode', 'uebung', '🏠', 'Übungsmodus', 'Zum Nachlernen: Quests mit Selbstkontrolle – ohne Lehrkraft.') +
      '</div>' + ruhe +
      '<h3>Thema</h3><div class="cards">' + topics + '</div>' +
      '<h3>Charakter</h3><div class="cards four">' + classes + '</div>' +
      '<div class="row"><button class="btn ghost" data-act="go" data-to="title">Zurück</button><button class="btn big" data-act="startRun">Los geht’s!</button></div>' +
      '</section>';
  };
  function readDraft() {
    const n = document.getElementById('nick'); if (n) draft.name = n.value.trim();
    const r = document.getElementById('ruhe'); if (r) draft.ruhe = r.checked;
  }
  A.draft = d => { readDraft(); draft[d.k] = d.v; show('newrun'); };
  A.startRun = () => {
    readDraft();
    if (!draft.name) { toast('Bitte gib einen Spitznamen ein.', 'bad'); return; }
    if (slot < 0 || slots[slot]) { show('title'); return; }
    const c = RM.CLASSES[draft.cls], m = meta();
    m.name = draft.name; saveMeta(m);
    run = {
      v: 1, name: draft.name, mode: draft.mode, topicId: draft.topicId, cls: draft.cls,
      ruhe: draft.mode === 'uebung' && draft.ruhe,
      hp: c.hp, maxHp: c.hp, gold: c.gold, items: c.items.slice(), relics: [], shield: false,
      floor: 0, map: null, pos: null, visited: [], nodeDone: true,
      stats: {}, floorStats: {}, mistakes: [], quests: [], bosses: 0, bonusXp: 0, flags: {}, startedAt: Date.now()
    };
    run.map = genMap();
    saveRun();
    show('floorIntro');
  };

  A.continueRun = () => {
    if (run.relicChoice) return show('floorSummary');
    if (run.pos && !run.nodeDone) return enterNode(run.pos.row, run.pos.col);
    show('map');
  };

  // ================= Karte =================
  function genMap() {
    const N = 6, rows = [];
    for (let r = 0; r < N; r++) {
      const n = r === 0 ? 3 : R.int(2, 4), row = [];
      for (let c = 0; c < n; c++) {
        let type;
        if (r === 0) type = 'battle';
        else if (r === N - 1) type = R.pick(['rest', 'rest', 'shop']);
        else type = R.weighted([['battle', 45], ['elite', r >= 2 ? 14 : 0], ['event', 16], ['shop', r >= 2 ? 9 : 0], ['rest', r >= 3 ? 7 : 0], ['quest', 10]]);
        row.push({ type, col: Math.round((c + 1) * 6 / (n + 1)), links: [] });
      }
      rows.push(row);
    }
    if (!rows[N - 1].some(n => n.type === 'rest')) R.pick(rows[N - 1]).type = 'rest';
    // mindestens eine Quest und ein Händler pro Ebene
    if (!rows.some(row => row.some(n => n.type === 'quest'))) R.pick(rows[R.int(2, 3)]).type = 'quest';
    if (!rows.some(row => row.some(n => n.type === 'shop'))) R.pick(rows[R.int(3, 4)]).type = 'shop';
    if (run.mode === 'klasse' && !settings().quests) rows.forEach(row => row.forEach(n => { if (n.type === 'quest') n.type = 'event'; }));
    rows.push([{ type: 'boss', col: 3, links: [] }]);

    // Wege ohne Überkreuzungen
    for (let r = 0; r < rows.length - 1; r++) {
      const a = rows[r].length, b = rows[r + 1].length;
      rows[r].forEach((node, i) => {
        const lo = Math.floor(i * b / a), hi = Math.floor(((i + 1) * b - 1) / a);
        for (let j = lo; j <= hi; j++) node.links.push(j);
      });
      // zusätzliche Abzweigungen
      rows[r].forEach((node, i) => {
        const max = Math.max(...node.links), min = Math.min(...node.links);
        const nextNode = rows[r][i + 1], prevNode = rows[r][i - 1];
        if (max + 1 < b && (!nextNode || Math.min(...nextNode.links) >= max + 1) && R.chance(0.35)) node.links.push(max + 1);
        else if (min - 1 >= 0 && (!prevNode || Math.max(...prevNode.links) <= min - 1) && R.chance(0.35)) node.links.unshift(min - 1);
      });
    }
    return { rows };
  }

  function available() {
    const rows = run.map.rows;
    if (walking) return [];
    if (!run.pos) return rows[0].map((_, i) => [0, i]);
    if (!run.nodeDone) return [[run.pos.row, run.pos.col]];
    return rows[run.pos.row][run.pos.col].links.map(c => [run.pos.row + 1, c]);
  }

  screens.floorIntro = () => {
    const f = floor();
    return hud() + '<section class="screen center story">' +
      '<div class="big-emoji">' + f.emoji + '</div><p class="muted">Ebene ' + (run.floor + 1) + ' von ' + topic().floors.length + '</p>' +
      '<h2>' + f.name + '</h2><p class="lead">' + f.intro + '</p>' +
      '<p class="muted">Themen: ' + f.skills.map(s => topic().skills[s].label).join(' · ') + '</p>' +
      '<button class="btn big" data-act="go" data-to="map">Betreten</button></section>';
  };

  // Karte als Koordinatengitter: Spalte 0–6, Reihe 0–6 (Boss in Reihe 6)
  const mx = col => 45 + col * 55, my = r => 610 - r * 82;
  const colOf = n => (n.col !== undefined ? n.col : Math.round((n.x || 50) / 100 * 6));
  const curve = (x1, y1, x2, y2) => 'M' + x1 + ' ' + y1 + ' C' + x1 + ' ' + (y1 + y2) / 2 + ' ' + x2 + ' ' + (y1 + y2) / 2 + ' ' + x2 + ' ' + y2;
  const START = { x: mx(3), y: my(-0.75) };
  const themeOf = () => floor().theme || ['katakomben', 'hoehlen', 'turm'][run.floor % 3];
  const heroRow = () => (run.pos ? run.pos.row : -1);
  let mapSel = null, walking = false;
  const NODE_INFO = {
    battle: ['1–3 Aufgaben · Belohnung: Gold', 1], elite: ['4 schwere Aufgaben · Belohnung: ein Relikt', 3],
    event: ['Eine Überraschung – gut oder knifflig', 2], shop: ['Gegenstände und Heilung kaufen', 1],
    rest: ['Ausruhen oder Fehlerwerkstatt', 1], quest: ['', 1], boss: ['Zwischenprüfung in 3 Phasen · Belohnung: Relikt nach Wahl', 3]
  };

  screens.map = () => {
    const f = floor();
    run.walked = run.walked || [];
    const legend = Object.entries(NODE).filter(([k]) => k !== 'quest' || run.mode === 'uebung' || settings().quests)
      .map(([k, v]) => '<span>' + v.emoji + ' ' + (k === 'quest' && run.mode === 'uebung' ? 'Selbst-Quest' : v.name) + '</span>').join('');
    return hud() + '<section class="screen map-screen">' +
      '<div class="floor-title">' + f.emoji + ' Ebene ' + (run.floor + 1) + ': ' + f.name + '</div>' +
      '<div class="mapbox" id="mapbox"><canvas id="mapCanvas"></canvas>' +
      '<svg class="paths" id="mapSvg" viewBox="0 0 420 680" preserveAspectRatio="none" aria-hidden="true"></svg>' +
      '<div class="fog" id="fog"></div><div class="lantern" id="lantern"></div><div id="mapNodes"></div>' +
      '<div class="hero-token" id="heroToken">' + cls().emoji + '</div></div>' +
      '<div class="preview" id="mapPreview" aria-live="polite"></div>' +
      '<div class="legend">' + legend + '</div></section>';
  };
  mounts.map = () => {
    mapSel = null; walking = false;
    RM.fx.startMap(byId('mapCanvas'), themeOf(), run.floor * 31 + (run.startedAt || 7));
    drawMapPaths();
    drawMapDynamic();
    // nur die Seite scrollen (scrollIntoView würde auch den Kartenrahmen verschieben)
    const el = document.querySelector('.node.avail');
    if (el) window.scrollBy(0, el.getBoundingClientRect().top - window.innerHeight / 2);
  };

  function drawMapPaths() {
    const rows = run.map.rows, svg = byId('mapSvg');
    let h = '<g class="grid">';
    for (let c = 0; c <= 6; c++) h += '<line x1="' + mx(c) + '" y1="20" x2="' + mx(c) + '" y2="660"/>';
    for (let r = 0; r < rows.length; r++) h += '<line x1="12" y1="' + my(r) + '" x2="408" y2="' + my(r) + '"/>';
    h += '</g>';
    for (let c = 0; c <= 6; c++) h += '<text class="axis" x="' + mx(c) + '" y="674" text-anchor="middle">' + c + '</text>';
    for (let r = 0; r < rows.length; r++) h += '<text class="axis" x="4" y="' + (my(r) + 4) + '">' + r + '</text>';
    const path = (d, walked) => '<path d="' + d + '" class="path' + (walked ? ' walked' : '') + '"/>';
    rows[0].forEach((n, i) => { h += path(curve(START.x, START.y, mx(colOf(n)), my(0)), run.walked.includes('s-' + i)); });
    rows.forEach((row, r) => row.forEach((n, i) => n.links.forEach(j => {
      h += path(curve(mx(colOf(n)), my(r), mx(colOf(rows[r + 1][j])), my(r + 1)), run.walked.includes(r + ':' + i + '-' + j));
    })));
    svg.innerHTML = h + '<g id="mapSteps"></g>';
  }

  function placeHero(x, y) {
    const t = byId('heroToken'), l = byId('lantern');
    if (!t) return;
    t.style.left = l.style.left = x / 420 * 100 + '%';
    t.style.top = l.style.top = y / 680 * 100 + '%';
  }

  function drawMapDynamic() {
    const rows = run.map.rows;
    const av = new Set(available().map(([r, c]) => r + ':' + c));
    let h = '';
    rows.forEach((row, r) => row.forEach((n, c) => {
      const key = r + ':' + c, far = r > heroRow() + 2 && n.type !== 'boss';
      const cur = run.pos && run.pos.row === r && run.pos.col === c;
      const label = (far ? 'Unbekanntes Feld' : NODE[n.type].name) + ' bei (' + colOf(n) + '|' + r + ')';
      h += '<button class="node ' + n.type + (av.has(key) ? ' avail' : '') + (run.visited.includes(key) ? ' visited' : '') + (far ? ' far' : '') +
        (mapSel === key ? ' sel' : '') + (cur ? ' current' : '') + '" style="left:' + mx(colOf(n)) / 4.2 + '%;top:' + my(r) / 6.8 + '%" ' +
        'data-act="mapTap" data-r="' + r + '" data-c="' + c + '" aria-label="' + label + '">' + (far ? '?' : NODE[n.type].emoji) +
        '<small>(' + colOf(n) + '|' + r + ')</small></button>';
    }));
    byId('mapNodes').innerHTML = h;
    byId('fog').style.height = Math.max(0, my(heroRow() + 2.6) / 6.8) + '%';
    if (!walking) placeHero(run.pos ? mx(colOf(rows[run.pos.row][run.pos.col])) : START.x, run.pos ? my(run.pos.row) : START.y);
    renderPreview();
  }

  function renderPreview() {
    const p = byId('mapPreview');
    if (!p) return;
    if (!mapSel) {
      const resume = run.pos && !run.nodeDone;
      p.innerHTML = '<div class="pv-head"><span>🧭</span><div><b>' + (resume ? 'Du stehst noch auf einem Feld.' : 'Wohin geht es weiter?') + '</b>' +
        '<small>' + (resume ? 'Tippe auf dein Feld, um weiterzumachen.' : 'Tippe ein leuchtendes Feld an, um zu sehen, was dich dort erwartet.') + '</small></div></div>';
      return;
    }
    const [r, c] = mapSel.split(':').map(Number), n = run.map.rows[r][c];
    const far = r > heroRow() + 2 && n.type !== 'boss';
    const can = available().some(([a, b]) => a === r && b === c);
    const coord = '(' + colOf(n) + '|' + r + ')';
    if (far) {
      p.innerHTML = '<div class="pv-head"><span>🌫️</span><div><b>Unbekanntes Feld bei ' + coord + '</b><small>Noch im Nebel. Komm näher heran, um mehr zu sehen.</small></div></div>';
      return;
    }
    const info = NODE_INFO[n.type];
    const text = n.type === 'quest' ? (run.mode === 'klasse' ? 'Aufgabe im Heft, Freigabe durch die Lehrkraft' : 'Aufgabe im Heft mit Selbstkontrolle') : info[0];
    const risk = ['', '<span class="pill r1">Risiko: gering</span>', '<span class="pill r2">Risiko: mittel</span>', '<span class="pill r3">Risiko: hoch</span>'][info[1]];
    p.innerHTML = '<div class="pv-head"><span>' + NODE[n.type].emoji + '</span><div><b>' + NODE[n.type].name + ' bei ' + coord + '</b><small>' + text + '</small></div></div>' +
      '<div class="pv-row">' + risk + (can ? '<button class="btn" data-act="mapGo">Betreten</button>' : '<span class="muted">Von hier aus nicht erreichbar</span>') + '</div>';
  }

  A.mapTap = d => {
    if (walking) return;
    const r = +d.r, c = +d.c, key = r + ':' + c;
    const can = available().some(([a, b]) => a === r && b === c);
    if (mapSel === key && can) return walkTo(r, c);
    mapSel = key;
    sfx.select();
    drawMapDynamic();
  };
  A.mapGo = () => {
    if (!mapSel || walking) return;
    const [r, c] = mapSel.split(':').map(Number);
    walkTo(r, c);
  };

  // Die Spielfigur läuft den Weg entlang, danach wird das Feld betreten
  function walkTo(r, c) {
    const rows = run.map.rows;
    if (run.pos && run.pos.row === r && run.pos.col === c) return enterNode(r, c);
    const from = run.pos ? { x: mx(colOf(rows[run.pos.row][run.pos.col])), y: my(run.pos.row) } : START;
    const to = { x: mx(colOf(rows[r][c])), y: my(r) };
    run.walked.push(run.pos ? run.pos.row + ':' + run.pos.col + '-' + c : 's-' + c);
    walking = true;
    mapSel = null;
    drawMapPaths();
    drawMapDynamic();
    const tok = byId('heroToken'), steps = byId('mapSteps');
    tok.classList.add('walk');
    const dur = RM.fx.D(850), t0 = performance.now(), ym = (from.y + to.y) / 2;
    const bez = (p0, p1, p2, p3, t) => { const u = 1 - t; return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3; };
    let last = 0;
    requestAnimationFrame(function frame(now) {
      if (view.name !== 'map') { walking = false; return; }
      const t = Math.min(1, (now - t0) / dur), e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const x = bez(from.x, from.x, to.x, to.x, e), y = bez(from.y, ym, ym, to.y, e);
      placeHero(x, y);
      if (t - last > 0.12 && t < .95) {
        last = t;
        steps.insertAdjacentHTML('beforeend', '<circle class="step" cx="' + (x + (Math.round(t * 10) % 2 ? 4 : -4)) + '" cy="' + (y + 6) + '" r="2.6"/>');
        sfx.step();
      }
      if (t < 1) return requestAnimationFrame(frame);
      walking = false;
      enterNode(r, c);
    });
  }

  function enterNode(r, c) {
    const node = run.map.rows[r][c];
    run.pos = { row: r, col: c };
    run.nodeDone = false;
    if (!run.visited.includes(r + ':' + c)) run.visited.push(r + ':' + c);
    saveRun();
    switch (node.type) {
      case 'battle': case 'elite': case 'boss': return startCombat(node.type);
      case 'shop': return openShop();
      case 'rest': return show('rest');
      case 'event': return startEvent();
      case 'quest': return startQuest();
    }
  }
  function completeNode() {
    run.nodeDone = true;
    run.shop = null;
    saveRun();
    show('map');
  }
  A.completeNode = completeNode;

  // ================= Kampf =================
  function startCombat(kind) {
    const f = floor(), row = run.pos.row;
    const base = { topic: topic(), kind, combo: 0, euleUsed: false };
    if (kind === 'boss') enc = Object.assign(base, { enemy: f.boss, phases: f.boss.phases, phase: 0, hp: 3 });
    else if (kind === 'elite') enc = Object.assign(base, { enemy: R.pick(f.elites), skills: f.skills, diff: [2, 3], hp: 4 });
    else enc = Object.assign(base, { enemy: R.pick(f.enemies), skills: f.skills, diff: row <= 1 ? [1, 1] : row <= 3 ? [1, 2] : [2, 2], hp: row <= 1 ? 2 : 3 });
    enc.maxHp = enc.hp;
    if (kind === 'boss') show('bossIntro');
    else nextTask();
  }

  screens.bossIntro = () => {
    const b = enc.enemy;
    return hud() + '<section class="screen center story boss-intro">' +
      '<div class="bossstage theme-' + themeOf() + '" id="bossStage"><div class="vignette"></div><div class="bossbody">' + b.emoji + '</div>' +
      '<div class="banner"><b>' + b.name + '</b><small>Zwischenprüfung · ' + b.phases.length + ' Phasen</small></div></div>' +
      '<p class="lead">' + b.intro + '</p>' +
      '<div class="info-box"><b>Zwischenprüfung</b><br>Der Kampf hat ' + b.phases.length + ' Phasen mit je 3 Treffern:<ul>' +
      b.phases.map(p => '<li>' + p.title + '</li>').join('') + '</ul>Am Ende siehst du, welche Themen du schon sicher beherrschst.</div>' +
      '<button class="btn big danger" data-act="bossStart">⚔️ Kampf beginnen</button></section>';
  };
  mounts.bossIntro = () => RM.fx.bossEntrance(byId('bossStage'));
  A.bossStart = () => nextTask();

  function timerOn() {
    if (!enc || enc.kind === 'training' || enc.noTimer) return false;
    if (settings().zeitdruck === 'aus') return false;
    return !(run && run.ruhe);
  }
  function timeLimit() {
    let f = enc.task.time * settings().zeitfaktor * enc.timeBoost;
    if (run && enc.kind !== 'training') f *= cls().timeFactor * (hasRelic('rechenschieber') ? 1.25 : 1);
    return f;
  }

  function nextTask() {
    const ph = enc.kind === 'boss' ? enc.phases[enc.phase] : null;
    const skills = ph ? ph.skills : enc.skills;
    const range = ph ? ph.diff : enc.diff;
    let d = R.int(range[0], range[1]);
    if (enc.kind !== 'training') d += ({ leicht: -1, normal: 0, schwer: 1 })[settings().schwierigkeit] || 0;
    d = RM.clamp(d, 1, 3);
    let skill = R.pick(skills);
    if (skills.length > 1 && skill === enc.lastSkill) skill = R.pick(skills.filter(s => s !== enc.lastSkill));
    enc.lastSkill = skill;
    enc.task = RM.makeTask(enc.topic, skill, d);
    Object.assign(enc, { attempts: 0, input: '', hidden: [], timeBoost: 1, hintShown: false, state: 'ask', start: Date.now(), dead: false });
    if (enc.task.input === 'choice' && enc.task.choices.length > 2 && hasRelic('lupe')) {
      const wrong = enc.task.choices.map((_, i) => i).filter(i => i !== enc.task.correct);
      enc.hidden.push(R.pick(wrong));
    }
    show('combat');
  }
  // Neu zeichnen, ohne die Aufgabe zu wechseln (Zeit läuft weiter)
  function refreshCombat() { show('combat'); }

  screens.combat = () => {
    const t = enc.task, sk = enc.topic.skills[t.skill];
    let head, enemy;
    if (enc.kind === 'training') {
      head = '<header class="hud"><button class="btn ghost small" data-act="go" data-to="training">← Trainingsraum</button>' +
        '<div class="hud-gold">✔ ' + enc.solved + ' / ' + enc.done + '</div><div class="hud-gold">🔥 Serie: ' + enc.streak + '</div></header>';
      enemy = '<div class="enemy training"><div class="enemy-emoji">🎯</div><div class="enemy-info"><b>Trainingsraum</b><small>' + sk.label + ' · Stufe ' + t.d + '</small></div></div>';
    } else {
      head = hud();
      enemy = arenaHtml();
    }
    const timer = timerOn() && enc.state === 'ask' ? '<div class="timer"><div id="timerBar"></div><span id="timerLabel"></span></div>' : '';
    let body;
    if (enc.state === 'solution') body = solutionHtml();
    else {
      body = '<div class="task-prompt">' + t.prompt + '</div>' +
        (enc.hintShown && t.hint ? '<div class="hint">💡 ' + t.hint + '</div>' : '') +
        '<div id="fb" class="feedback"></div>' +
        (t.input === 'choice' ? choicesHtml() : inputHtml());
    }
    return head + '<section class="screen combat">' + enemy + timer +
      '<div class="task-card"><div class="task-meta">' + sk.label + ' · Stufe ' + t.d + '</div>' + body + '</div></section>';
  };
  mounts.combat = () => {
    startTimer();
    if (enc.pendingFeedback) { feedback(enc.pendingFeedback.msg, enc.pendingFeedback.kind); enc.pendingFeedback = null; }
    const host = byId('simHost');
    if (host && enc.state === 'solution') simCleanup = RM.sims.mount(host, enc.task.sim);
  };

  // Kampfbühne: Held links, Gegner rechts
  function pipsHtml() {
    const total = enc.kind === 'boss' ? enc.phases.length * enc.maxHp : enc.maxHp;
    const left = enc.kind === 'boss' ? (enc.phases.length - enc.phase - 1) * enc.maxHp + enc.hp : enc.hp;
    return '<div class="pips" id="pips" aria-label="Gegner-Leben: ' + left + '">' + Array.from({ length: total }, (_, i) => '<i class="' + (i < left ? 'on' : '') + '"></i>').join('') + '</div>';
  }
  function arenaHtml() {
    const sleeping = !timerOn() && enc.kind !== 'event';
    const sub = enc.kind === 'boss' ? enc.phases[enc.phase].title : enc.kind === 'elite' ? 'Elitegegner' : '';
    return '<div class="arena theme-' + themeOf() + ' ' + enc.kind + '" id="arena">' +
      '<div class="torch" style="left:7%"></div><div class="torch" style="left:93%"></div><div class="floorline"></div>' +
      '<div class="combo" id="combo">' + (enc.combo > 1 ? '🔥 Kombo ×' + enc.combo : '') + '</div>' +
      '<div class="fighter hero" id="heroF"><span class="body">' + cls().emoji + '</span><div class="shadow"></div></div>' +
      '<div class="fighter enemy" id="enemyF"><div class="aura" id="aura"></div>' + (sleeping ? '<div class="zzz">💤</div>' : '') +
      '<span class="body' + (enc.kind === 'boss' && enc.phase > 0 ? ' rage' : '') + '" id="enemyBody">' + enc.enemy.emoji + '</span><div class="shadow"></div></div>' +
      '<div class="enemy-tag"><b>' + enc.enemy.name + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + pipsHtml() + '</div>' +
      '</div>';
  }
  function updateHud() {
    const old = document.querySelector('.hud');
    if (old && run) old.outerHTML = hud();
  }
  // Uhr anhalten, solange eine Animation läuft
  async function frozen(promise) {
    const t0 = Date.now();
    await promise;
    if (enc) enc.start += Date.now() - t0;
  }

  function choicesHtml() {
    const t = enc.task;
    return '<div class="choices">' + t.choices.map((c, i) => enc.hidden.includes(i)
      ? '<button class="choice-btn gone" disabled><span class="choice-key">' + 'ABCD'[i] + '</span>' + c + '</button>'
      : '<button class="choice-btn" data-act="choose" data-i="' + i + '"><span class="choice-key">' + 'ABCD'[i] + '</span>' + c + '</button>').join('') + '</div>';
  }

  function inputHtml() {
    const t = enc.task;
    const ph = t.input === 'term' ? 'Term eingeben …' : t.var ? 'Lösung eingeben, z. B. ' + t.var + ' = 3' : 'Zahl eingeben …';
    return '<div class="answer-display" id="ansDisplay">' + displayInner(ph) + '</div>' + keypad(t);
  }
  function displayInner(ph) {
    return enc.input ? fmtInput(enc.input) + '<span class="caret"></span>' : '<span class="placeholder">' + ph + '</span><span class="caret"></span>';
  }

  function keypad(t) {
    const k = (label, ins, cls = '') => '<button class="key ' + cls + '" data-act="key" data-ins="' + esc(ins) + '">' + label + '</button>';
    const blank = '<span class="key blank"></span>';
    const term = t.input === 'term';
    const vars = term ? t.vars.slice(0, 3) : (t.var ? [t.var] : []);
    const v = i => (vars[i] ? k('<i>' + vars[i] + '</i>', vars[i], 'var') : blank);
    return '<div class="keypad">' +
      k('7', '7') + k('8', '8') + k('9', '9') + k('+', '+', 'op') + k('−', '-', 'op') + k('⌫', 'BS', 'fn') +
      k('4', '4') + k('5', '5') + k('6', '6') + k('·', '*', 'op') + k('/', '/', 'op') + k('(', '(', 'op') +
      k('1', '1') + k('2', '2') + k('3', '3') + v(0) + v(1) + k(')', ')', 'op') +
      k('0', '0') + k(',', '.') + (term ? k('□²', '^2', 'op') : blank) + v(2) + (term ? k('^', '^', 'op') : (t.var ? k('=', '=', 'op') : blank)) + k('C', 'C', 'fn') +
      '<button class="key submit" data-act="submit">Prüfen ✓</button>' +
      '</div>';
  }

  A.key = d => {
    if (!enc || enc.state !== 'ask') return;
    if (d.ins === 'BS') enc.input = enc.input.slice(0, -1);
    else if (d.ins === 'C') enc.input = '';
    else if (enc.input.length < 40) enc.input += d.ins;
    const el = document.getElementById('ansDisplay');
    if (el) el.innerHTML = displayInner(enc.task.input === 'term' ? 'Term eingeben …' : 'Zahl eingeben …');
    const fb = document.getElementById('fb');
    if (fb && fb.classList.contains('info')) fb.className = 'feedback';
  };
  A.submit = () => submit();
  A.choose = d => submit(+d.i);

  function feedback(msg, kind) {
    const el = document.getElementById('fb');
    if (el) { el.innerHTML = msg; el.className = 'feedback show ' + kind; }
  }

  // ---- Zeitanzeige ----
  let timerInt = null;
  function startTimer() {
    stopTimer();
    if (!enc || !timerOn() || enc.state !== 'ask') return;
    timerInt = setInterval(tickTimer, 250);
    tickTimer();
  }
  function stopTimer() { clearInterval(timerInt); timerInt = null; }
  function tickTimer() {
    const bar = document.getElementById('timerBar'), label = document.getElementById('timerLabel');
    if (!bar || !enc || !enc.task) return stopTimer();
    const el = (Date.now() - enc.start) / 1000, lim = timeLimit();
    const aura = byId('aura');
    if (aura) {
      const p = Math.min(1, el / (2 * lim));
      aura.style.setProperty('--aura', el <= lim ? 'rgba(92, 201, 138, .7)' : el <= 2 * lim ? 'rgba(242, 201, 76, .8)' : 'rgba(239, 100, 97, .9)');
      aura.style.opacity = .2 + .8 * p;
      aura.style.transform = 'translate(-50%, -50%) scale(' + (.5 + 1.1 * p) + ')';
    }
    if (el <= lim) { bar.style.width = (100 - el / lim * 100) + '%'; bar.className = 'ok'; label.textContent = '⚡ Blitz-Bonus: noch ' + Math.ceil(lim - el) + ' s'; }
    else if (el <= 2 * lim) { bar.style.width = (100 - (el - lim) / lim * 100) + '%'; bar.className = 'warn'; label.textContent = 'Der Gegner holt aus …'; }
    else { bar.style.width = '100%'; bar.className = 'late'; label.textContent = 'Zu langsam: −1 ❤️ (auch bei richtiger Antwort)'; }
  }

  // ---- Auswertung einer Antwort ----
  function submit(choice) {
    if (!enc || enc.state !== 'ask') return;
    const t = enc.task;
    if (t.input === 'choice' && (choice === undefined || enc.hidden.includes(choice))) return;
    const res = t.input === 'choice' ? { ok: choice === t.correct } : t.check(enc.input);
    if (res.syntax) return feedback('✏️ ' + res.msg, 'info');
    if (res.partial) return feedback('🤏 ' + res.msg, 'warn');
    const elapsed = (Date.now() - enc.start) / 1000;
    if (res.ok) onCorrect(elapsed, choice); else onWrong(choice);
  }

  function applyDamage(n) { // true = besiegt
    if (n <= 0) return false;
    run.hp -= n;
    document.body.classList.add('hurt');
    setTimeout(() => document.body.classList.remove('hurt'), 450);
    if (run.hp <= 0) {
      if (hasRelic('phoenix') && !run.flags.phoenix) {
        run.flags.phoenix = true;
        run.hp = Math.ceil(run.maxHp / 2);
        toast('🪶 Die Phönixfeder rettet dich!', 'good');
      } else { run.hp = 0; saveRun(); return true; }
    }
    saveRun();
    return false;
  }

  // Was als Rune zum Gegner fliegt: die eigene Antwort
  function runeHtml(choice) {
    const t = enc.task;
    if (t.input !== 'choice') return fmtInput(enc.input);
    const txt = t.choices[choice].replace(/<[^>]+>/g, '');
    return txt.length <= 22 ? t.choices[choice] : '✦ ' + 'ABCD'[choice];
  }

  async function onCorrect(elapsed, choice) {
    const t = enc.task, first = enc.attempts === 0, me = enc;
    stopTimer();
    enc.state = 'done';
    recordStat(t, true, first);
    if (enc.kind === 'training') {
      enc.solved++; enc.done++; enc.streak++;
      feedback('✔ Richtig!' + (enc.streak >= 3 ? ' 🔥 ' + enc.streak + ' in Folge!' : ''), 'good');
      sfx.coin();
      setTimeout(() => { if (enc === me && view.name === 'combat') nextTask(); }, 900);
      return;
    }
    let msg = first ? '✔ Richtig!' : '✔ Richtig – im zweiten Versuch.';
    let gold = 1 + (hasRelic('goldbleistift') ? 2 : 0), crit = false, slow = false;
    if (timerOn()) {
      const lim = timeLimit();
      if (first && elapsed <= lim) {
        enc.combo++;
        crit = true;
        gold += 1 + Math.min(enc.combo, 3);
        msg = '⚡ Blitzschnell und richtig – kritischer Treffer!' + (enc.combo > 1 ? ' Kombo ×' + enc.combo : '');
      } else {
        enc.combo = 0;
        if (elapsed > 2 * lim) {
          slow = true;
          msg += ' Aber du hast sehr lange gebraucht – der Gegner trifft dich (−1 ❤️).';
          if (applyDamage(1)) { enc.dead = true; enc.state = 'solution'; return show('combat'); }
        }
      }
    }
    gold = goldAmt(gold);
    run.gold += gold;
    msg += ' <span class="gold">+' + gold + ' 🪙</span>';
    enc.hp--;
    saveRun();
    updateHud();
    feedback(msg, 'good');
    const arena = byId('arena');
    const hit = await RM.fx.attack(arena, runeHtml(choice), crit);
    if (enc !== me || view.name !== 'combat') return;
    const pips = byId('pips');
    if (pips) pips.outerHTML = pipsHtml();
    const combo = byId('combo');
    if (combo) combo.textContent = enc.combo > 1 ? '🔥 Kombo ×' + enc.combo : '';
    if (hit) RM.fx.floatText(arena, '+' + gold + ' 🪙', hit.x, hit.y - 40, crit ? 'crit' : 'gold');
    sfx.coin();
    if (slow) await RM.fx.enemyAttack(arena, '−1 ❤️', false);
    await RM.fx.wait(450);
    if (enc !== me || view.name !== 'combat') return;
    if (enc.hp <= 0) enemyDefeated(); else nextTask();
  }

  async function onWrong(choice) {
    const t = enc.task, me = enc;
    enc.attempts++;
    if (t.input === 'choice') enc.hidden.push(choice);
    const visible = t.input === 'choice' ? t.choices.length - enc.hidden.length : 99;
    const final = enc.attempts >= 2 || visible <= 1;
    let dmg = enc.kind === 'training' || enc.noDamage ? 0 : 1;
    if (settings().schwierigkeit === 'leicht' && enc.attempts === 1) dmg = 0;
    let note = '';
    if (dmg > 0 && run.shield) { run.shield = false; dmg = 0; note = ' 🔰 Dein Amulett fängt den Treffer ab.'; }
    else if (dmg > 0 && hasRelic('eule') && !enc.euleUsed) { enc.euleUsed = true; dmg = 0; note = ' 🦉 Die Eulenfeder schützt dich.'; }
    if (final) {
      recordStat(t, false, false);
      if (enc.kind === 'training') { enc.done++; enc.streak = 0; }
      else if (run && enc.kind !== 'event') run.mistakes.push({ skill: t.skill, d: t.d });
    }
    if (enc.kind !== 'training') {
      enc.state = 'anim';
      enc.combo = 0;
      const blocked = !dmg && !enc.noDamage;
      await frozen(RM.fx.enemyAttack(byId('arena'), dmg ? '💔 −' + dmg : blocked ? '🛡️ geblockt' : '✘ daneben', !dmg));
      if (enc !== me || view.name !== 'combat') return;
      enc.state = 'ask';
    }
    if (run && enc.kind !== 'training' && applyDamage(dmg)) {
      enc.dead = true; enc.state = 'solution';
      return show('combat');
    }
    if (final) {
      enc.state = 'solution';
      enc.lastDamage = dmg;
      enc.lastNote = note;
      saveRun();
      return show('combat');
    }
    enc.pendingFeedback = {
      msg: '✘ Leider falsch' + (dmg ? ' (−' + dmg + ' ❤️)' : '') + '.' + note + ' Du hast noch einen Versuch.' + (t.hint ? '<div class="hint">💡 ' + t.hint + '</div>' : ''),
      kind: 'bad'
    };
    saveRun();
    refreshCombat();
  }

  function solutionHtml() {
    const t = enc.task;
    let title = '📖 So geht es richtig';
    let sub = '';
    if (enc.dead) { title = '💀 Du wurdest besiegt'; sub = '<p class="muted">Kein Problem – jeder Durchgang macht dich stärker. Schau dir den Lösungsweg an.</p>'; }
    else if (enc.kind !== 'training' && enc.lastDamage) sub = '<p class="bad-text">Auch der zweite Versuch war falsch (−' + enc.lastDamage + ' ❤️).' + (enc.lastNote || '') + '</p>';
    else if (enc.lastNote) sub = '<p>' + enc.lastNote + '</p>';
    return '<div class="task-prompt dim">' + t.prompt + '</div>' +
      '<div class="solution"><h3>' + title + '</h3>' + sub +
      '<p>Richtige Antwort: <b>' + t.answerHtml + '</b></p>' +
      (RM.sims.supports(t.sim) ? '<div id="simHost"></div>' : '') +
      '<div class="steps">' + t.steps.join('') + '</div>' +
      '<button class="btn big" data-act="afterSolution">' + (enc.dead ? 'Zur Auswertung' : 'Weiter') + '</button></div>';
  }
  A.afterSolution = () => {
    if (enc.dead) return finishRun(false);
    if (enc.single) return enc.onEnd(false);
    nextTask();
  };

  async function enemyDefeated() {
    const me = enc, arena = byId('arena');
    if (enc.kind === 'boss' && enc.phase < enc.phases.length - 1) {
      enc.phase++;
      enc.hp = enc.maxHp;
      await RM.fx.phaseChange(arena, enc.enemy.name + ' wird wütend!', enc.phases[enc.phase].title);
      if (enc === me && view.name === 'combat') nextTask();
      return;
    }
    if (enc.single) return enc.onEnd(true);
    await RM.fx.defeat(arena);
    if (enc !== me || view.name !== 'combat') return;
    if (enc.kind === 'boss') return bossDefeated();
    const rewards = [];
    const hp = 1 + (hasRelic('kompass') ? 1 : 0);
    if (run.hp < run.maxHp) { heal(hp); rewards.push('❤️ +' + hp + ' Lebenspunkt' + (hp > 1 ? 'e' : '') + (hasRelic('kompass') ? ' (mit Kompass)' : '')); }
    if (enc.kind === 'battle') {
      const g = goldAmt(R.int(8, 12)); run.gold += g; rewards.push('🪙 ' + g + ' Gold');
      if (R.chance(0.3)) { const it = gainItem(); if (it) rewards.push(RM.ITEMS[it].emoji + ' ' + RM.ITEMS[it].name); }
    } else {
      const g = goldAmt(20); run.gold += g; rewards.push('🪙 ' + g + ' Gold');
      const rel = randomRelic();
      if (rel) { gainRelic(rel); rewards.push(RM.RELICS[rel].emoji + ' Relikt: <b>' + RM.RELICS[rel].name + '</b> – ' + RM.RELICS[rel].desc); }
    }
    run.nodeDone = true;
    saveRun();
    show('victory', { rewards, enemy: enc.enemy, chest: enc.kind === 'elite' });
  }

  const chestStage = () => '<div class="cheststage" id="chestStage"><div class="rays"></div><div class="chest"><div class="lid"></div><div class="box"></div></div></div>';
  mounts.victory = p => { if (p.chest) RM.fx.chest(byId('chestStage')); else sfx.coin(); };
  screens.victory = p => hud() + '<section class="screen center story">' +
    (p.chest ? chestStage() : '<div class="big-emoji">🏆</div>') + '<h2>Sieg!</h2><p class="lead">' + p.enemy.emoji + ' ' + p.enemy.name + ' ist besiegt.</p>' +
    '<ul class="rewards">' + p.rewards.map(r => '<li>' + r + '</li>').join('') + '</ul>' +
    '<button class="btn big" data-act="go" data-to="map">Weiter</button></section>';

  function bossDefeated() {
    const g = goldAmt(40);
    run.gold += g;
    run.bosses++;
    const choice = [];
    for (let i = 0; i < 3; i++) { const r = randomRelic(choice); if (r) choice.push(r); }
    run.relicChoice = choice;
    run.nodeDone = true;
    saveRun();
    show('floorSummary');
  }

  // ================= Statistik =================
  function recordStat(t, ok, first) {
    const m = meta(), tid = enc.topic.id;
    m.skillStats[tid] = m.skillStats[tid] || {};
    const s = m.skillStats[tid][t.skill] = m.skillStats[tid][t.skill] || { n: 0, ok: 0 };
    s.n++;
    if (ok) s.ok++;
    if (ok && enc.kind === 'training') m.xp += 1;
    saveMeta(m);
    if (run && enc.kind !== 'training') {
      run.floorStats[run.floor] = run.floorStats[run.floor] || {};
      for (const bucket of [run.stats, run.floorStats[run.floor]]) {
        const x = bucket[t.skill] = bucket[t.skill] || { n: 0, ok: 0, first: 0 };
        x.n++;
        if (ok) x.ok++;
        if (first && ok) x.first++;
      }
    }
  }

  const ampel = q => (q >= 0.8 ? '🟢' : q >= 0.5 ? '🟡' : '🔴');
  function statsTable(stats, tp, only) {
    const ids = (only || Object.keys(tp.skills)).filter(id => stats[id] && stats[id].n > 0);
    if (!ids.length) return '<p class="muted">Noch keine Aufgaben bearbeitet.</p>';
    return '<table class="stats"><thead><tr><th>Thema</th><th>richtig</th><th>Quote</th><th></th></tr></thead><tbody>' +
      ids.map(id => {
        const s = stats[id], q = s.ok / s.n;
        return '<tr><td>' + tp.skills[id].label + '</td><td>' + s.ok + ' / ' + s.n + '</td>' +
          '<td><div class="qbar"><div style="width:' + Math.round(q * 100) + '%"></div></div></td><td>' + ampel(q) + ' ' + Math.round(q * 100) + ' %</td></tr>';
      }).join('') + '</tbody></table>';
  }
  function recommendations(stats, tp) {
    const weak = Object.keys(tp.skills).filter(id => stats[id] && stats[id].n >= 2 && stats[id].ok / stats[id].n < 0.6);
    if (!weak.length) return '<p>👍 In allen bearbeiteten Themen bist du schon ziemlich sicher. Weiter so!</p>';
    return '<p>📌 Diese Themen solltest du im <b>Trainingsraum</b> noch üben:</p><ul>' +
      weak.map(id => '<li>' + tp.skills[id].label + '</li>').join('') + '</ul>';
  }

  screens.floorSummary = () => {
    const f = floor(), stats = run.floorStats[run.floor] || {};
    return hud() + '<section class="screen narrow">' +
      '<div class="center">' + chestStage() + '<h2>' + f.boss.name + ' ist besiegt!</h2>' +
      '<p class="lead">Ebene ' + (run.floor + 1) + ' geschafft: „' + f.name + '“</p></div>' +
      '<h3>Deine Zwischenbilanz für diese Ebene</h3>' + statsTable(stats, topic(), f.skills) + recommendations(stats, topic()) +
      '<div class="row"><button class="btn big" data-act="go" data-to="relicChoice">' + (run.relicChoice.length ? '🎁 Belohnung wählen' : 'Weiter') + '</button></div></section>';
  };

  mounts.floorSummary = () => RM.fx.chest(byId('chestStage'));
  screens.relicChoice = () => {
    if (!run.relicChoice.length) { setTimeout(advanceFloor, 0); return ''; }
    return hud() + '<section class="screen center">' +
      '<h2>🎁 Wähle ein Relikt</h2><p class="muted">Relikte wirken bis zum Ende dieses Abenteuers.</p><div class="cards three">' +
      run.relicChoice.map(id => '<button class="card choice" data-act="pickRelic" data-id="' + id + '"><div class="card-emoji">' + RM.RELICS[id].emoji + '</div><b>' + RM.RELICS[id].name + '</b><small>' + RM.RELICS[id].desc + '</small></button>').join('') +
      '</div></section>';
  };
  A.pickRelic = d => { gainRelic(d.id); advanceFloor(); };

  function advanceFloor() {
    run.relicChoice = null;
    if (run.floor >= topic().floors.length - 1) return finishRun(true);
    run.floor++;
    run.map = genMap();
    run.pos = null;
    run.visited = [];
    run.nodeDone = true;
    heal(Math.ceil(run.maxHp * 0.3));
    saveRun();
    show('floorIntro');
    toast('Du hast dich erholt: +' + Math.ceil(run.maxHp * 0.3) + ' ❤️', 'good');
  }

  // ================= Ende eines Durchgangs =================
  function finishRun(victory) {
    stopTimer();
    const r = run, m = meta();
    const solved = Object.values(r.stats).reduce((s, x) => s + x.ok, 0);
    const xp = solved * 2 + r.bosses * 30 + (victory ? 50 : 0) + r.quests.reduce((s, q) => s + q.stars * 5, 0) + (r.bonusXp || 0);
    const before = Object.values(RM.CLASSES).filter(c => classUnlocked(c, m)).map(c => c.name);
    m.xp += xp;
    m.bossKills += r.bosses;
    const unlocked = Object.values(RM.CLASSES).filter(c => classUnlocked(c, m) && !before.includes(c.name)).map(c => c.emoji + ' ' + c.name);
    const summary = {
      date: new Date().toISOString(), name: r.name, mode: r.mode, topicId: r.topicId, cls: r.cls,
      victory, floor: r.floor + 1, floors: RM.getTopic(r.topicId).floors.length, stats: r.stats, quests: r.quests, xp
    };
    m.runs = [summary].concat(m.runs || []).slice(0, 20);
    saveMeta(m);
    clearSlot(slot);
    run = null; enc = null; slot = -1;
    show('runEnd', { s: summary, unlocked });
  }

  const dateStr = iso => new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  screens.runEnd = p => {
    const s = p.s, tp = RM.getTopic(s.topicId);
    const total = Object.values(s.stats).reduce((a, x) => a + x.n, 0), ok = Object.values(s.stats).reduce((a, x) => a + x.ok, 0);
    const quests = s.quests.length ? '<h3>Analoge Quests</h3><ul>' + s.quests.map(q => '<li>' + esc(q.title) + ': ' +
      (q.skipped ? 'übersprungen' : '⭐'.repeat(q.stars) + (q.stars === 0 ? 'nicht geschafft' : '') + (q.teacher ? ' (Lehrkraft)' : ' (Selbsteinschätzung)')) + '</li>').join('') + '</ul>' : '';
    return '<section class="screen narrow report">' +
      '<div class="center"><div class="big-emoji">' + (s.victory ? '🏆' : '💀') + '</div><h2>' + (s.victory ? 'Sieg! Alle Ebenen geschafft!' : 'Das Abenteuer ist vorbei') + '</h2>' +
      '<p class="lead">' + esc(s.name) + ' · ' + RM.CLASSES[s.cls].emoji + ' ' + RM.CLASSES[s.cls].name + '</p>' +
      '<p class="muted">' + dateStr(s.date) + ' · ' + (s.mode === 'klasse' ? 'Klassenmodus' : 'Übungsmodus') + ' · Jg. ' + tp.grade + ': ' + tp.title + ' · erreicht: Ebene ' + s.floor + ' von ' + s.floors + '</p></div>' +
      '<div class="kpis"><div><b>' + ok + ' / ' + total + '</b><small>Aufgaben richtig</small></div><div><b>' + (total ? Math.round(ok / total * 100) : 0) + ' %</b><small>Quote</small></div><div><b>+' + s.xp + '</b><small>Erfahrung</small></div></div>' +
      '<h3>Ergebnisse nach Themen</h3>' + statsTable(s.stats, tp) + quests + recommendations(s.stats, tp) +
      (p.unlocked.length ? '<div class="info-box">🔓 Neu freigeschaltet: ' + p.unlocked.join(', ') + '</div>' : '') +
      (s.mode === 'klasse' ? '<div class="info-box">📸 Zeige diese Übersicht deiner Lehrkraft.</div>' : '') +
      '<div class="row"><button class="btn ghost" data-act="go" data-to="title">Hauptmenü</button><button class="btn" data-act="go" data-to="training">🎯 Trainingsraum</button></div></section>';
  };

  // ================= Händler =================
  const price = p => Math.round(p * (run.cls === 'haendler' ? 0.8 : 1));
  function openShop() {
    if (!run.shop) {
      run.shop = { items: R.shuffle(Object.keys(RM.ITEMS)).slice(0, 3).map(id => ({ id, sold: false })), relic: randomRelic(), relicSold: false, heals: 0 };
      saveRun();
    }
    show('shop');
  }
  screens.shop = () => {
    const sh = run.shop, full = run.items.length >= 3;
    const offer = (emoji, name, desc, cost, act, attrs, sold, blockedWhy) => {
      const why = sold ? 'Verkauft' : run.gold < cost ? 'Zu wenig Gold' : blockedWhy;
      return '<div class="offer ' + (sold ? 'sold' : '') + '"><div class="card-emoji">' + emoji + '</div><div><b>' + name + '</b><small>' + desc + '</small></div>' +
        '<button class="btn small" ' + (why ? 'disabled' : 'data-act="' + act + '" ' + attrs) + '>' + (why || '🪙 ' + cost) + '</button></div>';
    };
    return hud() + '<section class="screen narrow">' +
      '<div class="center"><div class="big-emoji">🧙‍♂️</div><h2>Der Händler</h2><p class="lead">„Willkommen! Gutes Werkzeug für kluge Köpfe.“</p></div>' +
      '<div class="offers">' +
      sh.items.map((o, i) => offer(RM.ITEMS[o.id].emoji, RM.ITEMS[o.id].name, RM.ITEMS[o.id].desc, price(RM.ITEMS[o.id].price), 'buyItem', 'data-i="' + i + '"', o.sold, full ? 'Rucksack voll' : '')).join('') +
      (sh.relic ? offer(RM.RELICS[sh.relic].emoji, 'Relikt: ' + RM.RELICS[sh.relic].name, RM.RELICS[sh.relic].desc, price(50), 'buyRelic', '', sh.relicSold, '') : '') +
      offer('🌿', 'Heilkräuter', '+2 Lebenspunkte (höchstens 3-mal)', price(10), 'buyHeal', '', sh.heals >= 3, run.hp >= run.maxHp ? 'Volle Leben' : '') +
      '</div><div class="row"><button class="btn big" data-act="completeNode">Weiterziehen</button></div></section>';
  };
  A.buyItem = d => {
    const o = run.shop.items[+d.i], cost = price(RM.ITEMS[o.id].price);
    if (o.sold || run.gold < cost || run.items.length >= 3) return;
    run.gold -= cost; o.sold = true; run.items.push(o.id); saveRun(); show('shop');
  };
  A.buyRelic = () => {
    const cost = price(50);
    if (run.shop.relicSold || run.gold < cost) return;
    run.gold -= cost; run.shop.relicSold = true; gainRelic(run.shop.relic); saveRun(); show('shop');
  };
  A.buyHeal = () => {
    const cost = price(10);
    if (run.shop.heals >= 3 || run.gold < cost || run.hp >= run.maxHp) return;
    run.gold -= cost; run.shop.heals++; heal(2); saveRun(); show('shop');
  };

  // ================= Rastplatz =================
  screens.rest = () => {
    const amount = Math.max(3, Math.ceil(run.maxHp * 0.3));
    const mistake = run.mistakes.length > 0;
    return hud() + '<section class="screen narrow">' +
      '<div class="center"><div class="big-emoji">🔥</div><h2>Rastplatz</h2><p class="lead">Ein ruhiges Lagerfeuer. Du hast Zeit für <b>eine</b> Sache.</p></div>' +
      '<div class="cards two">' +
      '<button class="card choice" data-act="restHeal"><div class="card-emoji">😴</div><b>Ausruhen</b><small>+' + amount + ' Lebenspunkte</small></button>' +
      (mistake
        ? '<button class="card choice" data-act="restWorkshop"><div class="card-emoji">🛠️</div><b>Fehlerwerkstatt</b><small>Löse ohne Zeitdruck eine Aufgabe zu „' + topic().skills[run.mistakes[run.mistakes.length - 1].skill].label + '“, wo du vorher einen Fehler gemacht hast. Geschafft: +1 maximale Lebenspunkte.</small></button>'
        : '<button class="card choice" data-act="restStudy"><div class="card-emoji">📚</div><b>Lernen</b><small>Löse ohne Zeitdruck eine Aufgabe: +15 Gold.</small></button>') +
      '</div></section>';
  };
  A.restHeal = () => {
    const amount = Math.max(3, Math.ceil(run.maxHp * 0.3));
    heal(amount);
    result('😴', 'Gut geschlafen', 'Du erholst dich am Feuer: +' + amount + ' ❤️.');
  };
  A.restWorkshop = () => {
    const mk = run.mistakes[run.mistakes.length - 1];
    eventTask({ skills: [mk.skill], diff: [mk.d, mk.d], title: 'Fehlerwerkstatt', emoji: '🛠️' }, win => {
      if (win) {
        run.mistakes.pop();
        run.maxHp++; run.hp++;
        result('🛠️', 'Fehler ausgebessert!', 'Aus Fehlern lernen macht stark: +1 maximale Lebenspunkte.');
      } else result('🛠️', 'Noch nicht ganz', 'Schau dir den Lösungsweg in Ruhe an. Übe dieses Thema auch im Trainingsraum!');
    });
  };
  A.restStudy = () => {
    eventTask({ skills: floor().skills, diff: [2, 2], title: 'Lernen am Feuer', emoji: '📚' }, win => {
      if (win) { const g = goldAmt(15); run.gold += g; result('📚', 'Gut gelernt!', '+' + g + ' Gold.'); }
      else result('📚', 'Knapp daneben', 'Der Lösungsweg hilft dir beim nächsten Mal.');
    });
  };

  // Einzelaufgabe außerhalb eines Kampfes (ohne Zeitdruck und ohne Schaden)
  function eventTask(o, cb) {
    enc = { topic: topic(), kind: 'event', enemy: { name: o.title, emoji: o.emoji }, skills: o.skills, diff: o.diff, hp: 1, maxHp: 1, single: true, noTimer: true, noDamage: true, combo: 0, onEnd: cb };
    nextTask();
  }

  function result(emoji, title, text) {
    run.nodeDone = true;
    run.shop = null;
    saveRun();
    show('result', { emoji, title, text });
  }
  screens.result = p => hud() + '<section class="screen center story"><div class="big-emoji">' + p.emoji + '</div><h2>' + p.title + '</h2><p class="lead">' + p.text + '</p>' +
    '<button class="btn big" data-act="go" data-to="map">Weiter</button></section>';

  // Schaden außerhalb eines Kampfes; bei Niederlage endet der Durchgang
  function hurtOutside(n) {
    if (applyDamage(n)) { finishRun(false); return true; }
    return false;
  }

  // ================= Ereignisse =================
  const EVENTS = [
    {
      emoji: '🧰', title: 'Die verschlossene Truhe',
      text: 'Ein Zahlenschloss sichert eine alte Truhe. Löst du die Aufgabe, springt sie auf. Ein Fehler löst aber eine Falle aus (−2 ❤️)!',
      options: () => [
        { label: '🔓 Schloss knacken', run: () => eventTask({ skills: floor().skills, diff: [2, 2], title: 'Zahlenschloss', emoji: '🧰' }, win => {
          if (win) {
            const g = goldAmt(25); run.gold += g;
            const it = gainItem();
            result('🧰', 'Die Truhe springt auf!', 'Du findest ' + g + ' Gold' + (it ? ' und ' + RM.ITEMS[it].emoji + ' ' + RM.ITEMS[it].name : '') + '.');
          } else if (!hurtOutside(2)) result('💥', 'Falle!', 'Ein Pfeil schnellt aus der Truhe: −2 ❤️.');
        }) },
        { label: '🚶 Weitergehen', run: completeNode }
      ]
    },
    {
      emoji: '🦉', title: 'Die weise Eule',
      text: '„Huhu! Wer fleißig lernt, wird belohnt. Was darf es sein?“',
      options: () => [
        { label: '❤️ 3 Lebenspunkte heilen', disabled: run.hp >= run.maxHp, run: () => { heal(3); result('🦉', 'Danke, Eule!', 'Du fühlst dich erfrischt: +3 ❤️.'); } },
        { label: '📜 Einen Merkzettel mitnehmen', disabled: run.items.length >= 3, run: () => { run.items.push('merkzettel'); result('🦉', 'Danke, Eule!', 'Du erhältst einen 📜 Merkzettel.'); } },
        { label: '🚶 Weitergehen', run: completeNode }
      ]
    },
    {
      emoji: '🧛', title: 'Der zwielichtige Fremde',
      cond: () => run.hp > 3 && randomRelic(),
      text: '„Psst! Ein Relikt gefällig? Es kostet dich nur … 3 Lebenspunkte.“',
      options: () => [
        { label: '🤝 Handel annehmen (−3 ❤️)', run: () => { run.hp -= 3; const r = randomRelic(); gainRelic(r); result(RM.RELICS[r].emoji, RM.RELICS[r].name, 'Der Fremde verschwindet im Schatten. ' + RM.RELICS[r].desc); } },
        { label: '🙅 Ablehnen', run: completeNode }
      ]
    },
    {
      emoji: '⛲', title: 'Der Wunschbrunnen',
      text: 'Das Wasser glitzert geheimnisvoll. Man sagt, wer eine Münze opfert, wird geheilt.',
      options: () => [
        { label: '🪙 15 Gold opfern (+5 ❤️)', disabled: run.gold < 15 || run.hp >= run.maxHp, run: () => { run.gold -= 15; heal(5); result('⛲', 'Der Brunnen leuchtet', 'Eine warme Welle durchströmt dich: +5 ❤️.'); } },
        { label: '🚶 Weitergehen', run: completeNode }
      ]
    },
    {
      emoji: '🗿', title: 'Die Rätseltafel',
      text: 'In eine Steintafel ist ein kniffliges Rätsel gemeißelt. Wer es löst, erhält 30 Gold und Erfahrung. Ein Fehler kostet nichts – außer Stolz.',
      options: () => [
        { label: '🧠 Rätsel lösen', run: () => eventTask({ skills: floor().skills, diff: [3, 3], title: 'Rätseltafel', emoji: '🗿' }, win => {
          if (win) { const g = goldAmt(30); run.gold += g; run.bonusXp += 10; result('🗿', 'Rätsel gelöst!', '+' + g + ' Gold und +10 Erfahrung.'); }
          else result('🗿', 'Die Tafel schweigt', 'Schau dir den Lösungsweg gut an – beim nächsten Mal klappt es!');
        }) },
        { label: '🚶 Weitergehen', run: completeNode }
      ]
    }
  ];
  let curEvent = null;
  function startEvent() {
    const ev = R.pick(EVENTS.filter(e => !e.cond || e.cond()));
    curEvent = { ev, opts: ev.options() };
    show('event');
  }
  screens.event = () => {
    const { ev, opts } = curEvent;
    return hud() + '<section class="screen center story"><div class="big-emoji">' + ev.emoji + '</div><h2>' + ev.title + '</h2><p class="lead">' + ev.text + '</p>' +
      '<div class="menu">' + opts.map((o, i) => '<button class="btn" ' + (o.disabled ? 'disabled' : 'data-act="eventOpt" data-i="' + i + '"') + '>' + o.label + '</button>').join('') + '</div></section>';
  };
  A.eventOpt = d => curEvent.opts[+d.i].run();

  // ================= Analoge Quests =================
  function startQuest() {
    if (!run.quest) {
      const f = floor();
      const custom = (RM.CONFIG.eigeneQuests || []).filter(q => q.ebene === 'alle' || q.ebene === f.id)
        .map(q => () => ({ emoji: q.emoji || '📜', title: q.titel, text: q.text, self: q.selbst || q.text, check: q.kontrolle || [] }));
      run.quest = R.pick(f.quests.concat(custom))();
      run.quest.note = '';
      saveRun();
    }
    show('quest');
  }
  screens.quest = () => {
    const q = run.quest, klasse = run.mode === 'klasse';
    return hud() + '<section class="screen narrow"><div class="quest-card">' +
      '<div class="quest-head"><span class="big-emoji">' + q.emoji + '</span><div><small>' + (klasse ? 'Analoge Quest' : 'Selbst-Quest') + '</small><h2>' + q.title + '</h2></div></div>' +
      '<p class="lead">' + (klasse ? q.text : q.self) + '</p>' +
      (q.note ? '<div class="hint">✏️ Rückmeldung deiner Lehrkraft: <b>' + esc(q.note) + '</b></div>' : '') +
      (klasse
        ? '<p class="muted">Bearbeite die Quest im Heft. Wenn du fertig bist, gehe zu deiner Lehrkraft. Dein Spielstand bleibt gespeichert.</p>' +
          '<div class="menu"><button class="btn big" data-act="questPresent">🧑‍🏫 Bei der Lehrkraft vorlegen</button>'
        : '<p class="muted">Bearbeite die Quest im Heft und kontrolliere dich danach selbst – ehrlich sein lohnt sich!</p>' +
          '<div class="menu"><button class="btn big" data-act="go" data-to="questCheck">✅ Ich bin fertig</button>') +
      '<button class="btn ghost small" data-act="questSkip">Überspringen (keine Belohnung)</button></div></div></section>';
  };
  A.questSkip = () => confirmBox('Möchtest du die Quest wirklich überspringen? Du erhältst dann keine Belohnung.', 'questSkipYes', 'Überspringen');
  A.questSkipYes = () => {
    run.quests.push({ title: run.quest.title, stars: 0, skipped: true });
    run.quest = null;
    completeNode();
  };
  A.questPresent = () => { pinBuf = ''; show('pin', { purpose: 'quest' }); };

  screens.questCheck = () => {
    const q = run.quest;
    return hud() + '<section class="screen narrow"><div class="quest-card"><h2>✅ Selbstkontrolle: ' + q.title + '</h2>' +
      '<ul class="checklist">' + q.check.map(c => '<li>' + c + '</li>').join('') + '</ul>' +
      '<h3>Wie gut ist es dir gelungen?</h3><div class="cards rate">' +
      [[3, 'Alles richtig'], [2, 'Größtenteils'], [1, 'Teilweise'], [0, 'Noch nicht']].map(([s, t]) =>
        '<button class="card choice" data-act="questSelf" data-s="' + s + '"><b>' + (s ? '⭐'.repeat(s) : '🔁') + '</b><small>' + t + '</small></button>').join('') +
      '</div><button class="btn ghost small" data-act="go" data-to="quest">← Zurück zur Aufgabe</button></div></section>';
  };
  A.questSelf = d => {
    const s = +d.s, q = run.quest;
    run.quests.push({ title: q.title, stars: s, teacher: false });
    run.quest = null;
    if (s === 0) return result('🔁', 'Ehrlich gesagt – stark!', 'Nimm dir die Aufgabe später noch einmal vor. Ehrliche Selbsteinschätzung ist der erste Schritt zum Lernen.');
    const g = goldAmt(8 * s);
    run.gold += g;
    if (s >= 2) heal(1);
    result(q.emoji, 'Quest abgeschlossen', 'Belohnung: ' + g + ' Gold' + (s >= 2 ? ' und +1 ❤️' : '') + '.');
  };

  screens.questRate = () => {
    const q = run.quest;
    const chips = ['Rechenweg fehlt', 'Begründung ergänzen', 'Ergebnis noch einmal prüfen', 'Sauberer aufschreiben', 'Bitte noch einmal mündlich erklären'];
    return '<section class="screen narrow teacher-view"><h2>🧑‍🏫 Bewertung der Quest</h2>' +
      '<p class="muted">' + esc(run.name) + ' · Ebene ' + (run.floor + 1) + '</p><div class="quest-card"><h3>' + q.emoji + ' ' + q.title + '</h3><p>' + q.text + '</p></div>' +
      '<h3>Quest bestanden</h3><div class="cards three rate">' +
      [[3, 'Hervorragend'], [2, 'Gut gelöst'], [1, 'Bestanden']].map(([s, t]) =>
        '<button class="card choice" data-act="questRate" data-s="' + s + '"><b>' + '⭐'.repeat(s) + '</b><small>' + t + '</small></button>').join('') +
      '</div><h3>Oder zur Überarbeitung zurückgeben</h3><div class="chips">' +
      chips.map(c => '<button class="chip" data-act="questRevise" data-note="' + esc(c) + '">' + c + '</button>').join('') + '</div></section>';
  };
  A.questRate = d => {
    const s = +d.s, q = run.quest;
    run.quests.push({ title: q.title, stars: s, teacher: true });
    run.quest = null;
    const g = goldAmt(10 * s);
    run.gold += g;
    heal(s);
    result('🏅', 'Quest bestanden: ' + '⭐'.repeat(s), 'Deine Lehrkraft hat die Quest freigegeben. Belohnung: ' + g + ' Gold und +' + s + ' ❤️.');
  };
  A.questRevise = d => {
    run.quest.note = d.note;
    saveRun();
    show('quest');
    toast('Die Quest wurde zur Überarbeitung zurückgegeben.', 'warn');
  };

  // ================= PIN =================
  let pinBuf = '';
  screens.pin = p => '<section class="screen center narrow"><h2>🔑 ' + (p.purpose === 'quest' ? 'Freigabe durch die Lehrkraft' : 'Lehrkraft-Bereich') + '</h2>' +
    '<p class="muted">Bitte PIN eingeben.</p><div class="pin-dots" id="pinDots">' + pinDots() + '</div><div class="pinpad">' +
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK'].map(k => '<button class="key ' + (k === 'OK' ? 'submit' : k === 'C' ? 'fn' : '') + '" data-act="pinKey" data-k="' + k + '">' + k + '</button>').join('') +
    '</div><button class="btn ghost" data-act="pinCancel">Abbrechen</button></section>';
  const pinDots = () => '●'.repeat(pinBuf.length) + '○'.repeat(Math.max(0, 4 - pinBuf.length));
  A.pinKey = d => {
    if (d.k === 'C') pinBuf = '';
    else if (d.k === 'OK') return checkPin();
    else if (pinBuf.length < 8) pinBuf += d.k;
    document.getElementById('pinDots').textContent = pinDots();
  };
  function checkPin() {
    const ok = pinBuf === String(teacherPin());
    pinBuf = '';
    if (!ok) { toast('Falsche PIN.', 'bad'); document.getElementById('pinDots').textContent = pinDots(); return; }
    show(view.params.purpose === 'quest' ? 'questRate' : 'teacher');
  }
  A.pinCancel = () => { pinBuf = ''; show(view.params.purpose === 'quest' ? 'quest' : 'title'); };
  A.teacherLogin = () => { pinBuf = ''; show('pin', { purpose: 'teacher' }); };

  // ================= Lehrkraft-Bereich =================
  screens.teacher = () => {
    const s = settings();
    const opt = (k, v, label) => '<button class="seg ' + (s[k] === v ? 'on' : '') + '" data-act="setSetting" data-k="' + k + '" data-v="' + v + '">' + label + '</button>';
    return '<section class="screen narrow teacher-view"><h2>🔑 Lehrkraft-Bereich</h2>' +
      '<p class="muted">Die Einstellungen gelten nur für dieses Gerät bzw. diesen Browser.</p>' +
      '<div class="setting"><div><b>Zeitdruck</b><small>„Aus“ = Ruhemodus für alle Durchgänge, z. B. als Nachteilsausgleich.</small></div><div class="segs">' + opt('zeitdruck', 'moderat', 'Moderat') + opt('zeitdruck', 'aus', 'Aus') + '</div></div>' +
      '<div class="setting"><div><b>Zeitfaktor</b><small>Verlängert die Zielzeiten aller Aufgaben.</small></div><div class="segs">' + opt('zeitfaktor', 1, '1×') + opt('zeitfaktor', 1.5, '1,5×') + opt('zeitfaktor', 2, '2×') + '</div></div>' +
      '<div class="setting"><div><b>Schwierigkeit</b><small>Leicht: Aufgaben eine Stufe leichter, erster Fehler ohne Schaden. Schwer: eine Stufe schwerer.</small></div><div class="segs">' + opt('schwierigkeit', 'leicht', 'Leicht') + opt('schwierigkeit', 'normal', 'Normal') + opt('schwierigkeit', 'schwer', 'Schwer') + '</div></div>' +
      '<div class="setting"><div><b>Analoge Quests im Klassenmodus</b><small>Wirkt ab der nächsten Ebene bzw. dem nächsten Durchgang.</small></div><div class="segs">' + opt('quests', true, 'An') + opt('quests', false, 'Aus') + '</div></div>' +
      '<div class="setting"><div><b>Klänge</b><small>Im Browser erzeugt, ohne Sounddateien. Schüler können sie im Pause-Menü umschalten.</small></div><div class="segs">' + opt('klang', true, 'An') + opt('klang', false, 'Aus') + '</div></div>' +
      '<div class="setting"><div><b>Bewegung</b><small>„Reduziert“ schaltet Animationen weitgehend ab, z. B. bei Reizempfindlichkeit. Gilt automatisch, wenn das Gerät „Bewegung reduzieren“ nutzt.</small></div><div class="segs">' + opt('bewegung', 'normal', 'Normal') + opt('bewegung', 'reduziert', 'Reduziert') + '</div></div>' +
      '<div class="setting"><div><b>Alle Charaktere freischalten</b></div><div class="segs">' + opt('alleKlassen', true, 'An') + opt('alleKlassen', false, 'Aus') + '</div></div>' +
      '<div class="setting"><div><b>PIN für dieses Gerät ändern</b><small>Standard-PIN steht in js/config.js.</small></div><div class="segs"><input id="newPin" inputmode="numeric" pattern="[0-9]*" maxlength="8" placeholder="neue PIN"><button class="btn small" data-act="setPin">Speichern</button></div></div>' +
      '<div class="row"><button class="btn ghost" data-act="go" data-to="progress">📊 Lernstand auf diesem Gerät</button><button class="btn danger" data-act="resetAll">Alle Spieldaten löschen</button></div>' +
      '<div class="row"><button class="btn big" data-act="go" data-to="title">Fertig</button></div></section>';
  };
  A.setSetting = d => {
    const s = settings();
    let v = d.v;
    if (v === 'true') v = true; else if (v === 'false') v = false; else if (d.k === 'zeitfaktor') v = +v;
    s[d.k] = v;
    saveSettings(s);
    applyFx();
    show('teacher');
  };
  A.setPin = () => {
    const v = document.getElementById('newPin').value.trim();
    if (!/^\d{4,8}$/.test(v)) return toast('Die PIN muss aus 4 bis 8 Ziffern bestehen.', 'bad');
    const s = settings(); s.pin = v; saveSettings(s);
    toast('Neue PIN gespeichert.', 'good');
  };
  A.resetAll = () => confirmBox('Wirklich <b>alle</b> Spieldaten auf diesem Gerät löschen (Lernstand, Erfahrung, alle drei Spielstände)? Die Lehrkraft-Einstellungen bleiben erhalten.', 'resetAllYes', 'Löschen');
  A.resetAllYes = () => {
    RM.store.remove('rm.meta');
    for (let i = 0; i < SLOTS; i++) clearSlot(i);
    run = null; enc = null; slot = -1;
    show('title');
    toast('Alle Spieldaten wurden gelöscht.', 'good');
  };

  // ================= Lernstand =================
  screens.progress = () => {
    const m = meta();
    const topics = RM.topics.map(tp => '<h3>Jg. ' + tp.grade + ': ' + tp.title + '</h3>' + statsTable(m.skillStats[tp.id] || {}, tp) + recommendations(m.skillStats[tp.id] || {}, tp)).join('');
    const runs = (m.runs || []).slice(0, 10);
    const runTable = runs.length ? '<table class="stats"><thead><tr><th>Datum</th><th>Name</th><th>Modus</th><th>Ergebnis</th><th>Quote</th></tr></thead><tbody>' +
      runs.map(r => {
        const n = Object.values(r.stats).reduce((a, x) => a + x.n, 0), ok = Object.values(r.stats).reduce((a, x) => a + x.ok, 0);
        return '<tr><td>' + dateStr(r.date) + '</td><td>' + esc(r.name) + '</td><td>' + (r.mode === 'klasse' ? 'Klasse' : 'Übung') + '</td><td>' + (r.victory ? '🏆 Sieg' : 'Ebene ' + r.floor) + '</td><td>' + (n ? Math.round(ok / n * 100) + ' %' : '–') + '</td></tr>';
      }).join('') + '</tbody></table>' : '<p class="muted">Noch keine abgeschlossenen Abenteuer.</p>';
    return '<section class="screen narrow report"><h2>📊 Mein Lernstand</h2>' +
      '<p class="muted">Alle Aufgaben aus Abenteuern und Trainingsraum auf diesem Gerät · ⭐ ' + m.xp + ' Erfahrungspunkte</p>' + topics +
      '<h3>Letzte Abenteuer</h3>' + runTable +
      '<div class="row"><button class="btn ghost" data-act="go" data-to="title">Hauptmenü</button><button class="btn" data-act="go" data-to="training">🎯 Trainingsraum</button></div></section>';
  };

  // ================= Trainingsraum =================
  screens.training = () => {
    const m = meta();
    const list = RM.topics.map(tp => '<h3>Jg. ' + tp.grade + ': ' + tp.title + '</h3>' + tp.floors.map(f =>
      '<div class="train-floor"><div class="muted">' + f.emoji + ' ' + f.name + '</div>' + f.skills.filter((s, i, a) => a.indexOf(s) === i).map(id => {
        const sk = tp.skills[id], st = (m.skillStats[tp.id] || {})[id];
        const q = st && st.n ? st.ok / st.n : null;
        return '<div class="train-row"><div><b>' + sk.label + '</b><small>' + (q === null ? 'noch nicht geübt' : ampel(q) + ' ' + st.ok + ' / ' + st.n + ' richtig') + ' · ' + sk.pk + '</small></div>' +
          '<div class="segs">' + [1, 2, 3].map(d => '<button class="seg" data-act="train" data-topic="' + tp.id + '" data-skill="' + id + '" data-d="' + d + '">Stufe ' + d + '</button>').join('') + '</div></div>';
      }).join('') + '</div>').join('')).join('');
    return '<section class="screen narrow"><h2>🎯 Trainingsraum</h2>' +
      '<p class="muted">Übe gezielt einzelne Themen – ohne Zeitdruck und ohne Lebenspunkte. Bei Fehlern siehst du den Lösungsweg.</p>' + list +
      '<div class="row"><button class="btn ghost" data-act="go" data-to="title">Hauptmenü</button></div></section>';
  };
  A.train = d => {
    enc = { topic: RM.getTopic(d.topic), kind: 'training', skills: [d.skill], diff: [+d.d, +d.d], hp: Infinity, solved: 0, done: 0, streak: 0, combo: 0 };
    nextTask();
  };

  // ================= Menü & Hilfe =================
  const soundLabel = () => (settings().klang ? '🔊 Klänge: an' : '🔇 Klänge: aus');
  const motionLabel = () => (settings().bewegung === 'reduziert' ? '🐢 Weniger Bewegung: an' : '🐢 Weniger Bewegung: aus');
  function toggleSetting(k, a, b) {
    const s = settings();
    s[k] = s[k] === a ? b : a;
    saveSettings(s);
    applyFx();
    if (k === 'klang') sfx.coin();
  }
  A.toggleSound = () => {
    toggleSetting('klang', true, false);
    if (document.querySelector('.modal-bg')) A.pause(); else show(view.name, view.params);
  };
  A.toggleMotion = () => { toggleSetting('bewegung', 'reduziert', 'normal'); A.pause(); };
  A.pause = () => modal('<h3>Pause</h3><div class="menu">' +
    '<button class="btn" data-act="closeModal">▶ Weiterspielen</button>' +
    '<button class="btn ghost" data-act="toggleSound">' + soundLabel() + '</button>' +
    '<button class="btn ghost" data-act="toggleMotion">' + motionLabel() + '</button>' +
    '<button class="btn ghost" data-act="toTitle">🏠 Hauptmenü (Spielstand wird gespeichert)</button>' +
    '<button class="btn ghost" data-act="giveUp">🏳️ Abenteuer beenden</button></div>');
  A.toTitle = () => { saveRun(); enc = null; run = null; slot = -1; show('title'); };
  A.giveUp = () => confirmBox('Abenteuer wirklich beenden? Du erhältst die Auswertung und die bisher gesammelte Erfahrung.', 'giveUpYes', 'Beenden');
  A.giveUpYes = () => finishRun(false);

  screens.help = () => '<section class="screen narrow help"><h2>❔ Spielanleitung</h2>' +
    '<h3>Das Ziel</h3><p>Kämpfe dich durch drei Ebenen voller Mathe-Monster. Am Ende jeder Ebene wartet ein Boss – eine Zwischenprüfung zum Thema der Ebene.</p>' +
    '<h3>Die Karte</h3><p>Du wählst selbst deinen Weg: ⚔️ Gegner, 💀 Elitegegner (schwerer, aber mit Relikt), ❓ Ereignisse, 🛒 Händler, 🔥 Rastplätze und 📜 Quests. Tippe ein Feld einmal an, um zu sehen, was dort wartet, und ein zweites Mal (oder „Betreten“), um loszugehen. Weiter entfernte Felder liegen im Nebel.</p>' +
    '<h3>Kämpfe</h3><ul><li>Jede richtige Antwort trifft den Gegner.</li><li>Eine falsche Antwort kostet 1 ❤️ – du hast aber einen zweiten Versuch (mit Tipp).</li>' +
    '<li>Ist auch der zweite Versuch falsch, kostet das noch 1 ❤️ und du siehst den Lösungsweg.</li>' +
    '<li>Nach jedem gewonnenen Kampf erholst du dich um 1 ❤️.</li>' +
    '<li>⚡ Bist du schnell (grüner Balken), gibt es Bonus-Gold. Brauchst du extrem lange (roter Balken), trifft dich der Gegner (−1 ❤️).</li>' +
    '<li>Eingaben: Terme wie <span class="m">3<i>x</i> + 2</span>, Brüche als <span class="m">3/4</span>, Dezimalzahlen mit Komma. Gleichwertige Schreibweisen werden erkannt.</li></ul>' +
    '<h3>Lösungswege</h3><p>Nach einem Fehler siehst du den Lösungsweg. Bei vielen Aufgaben zeigt eine Animation das Prinzip: die Waage bei Gleichungen, das Flächenmodell bei Klammern, die Sortiermaschine beim Zusammenfassen und die Einsetzmaschine beim Termwert.</p>' +
    '<h3>Analoge Quests</h3><p>Im Klassenmodus bearbeitest du Quests im Heft und legst sie deiner Lehrkraft vor. Im Übungsmodus kontrollierst du dich selbst.</p>' +
    '<h3>Fortschritt</h3><p>Verlierst du alle Lebenspunkte, beginnt ein neues Abenteuer. Deine Erfahrung bleibt und schaltet neue Charaktere frei. Im 🎯 Trainingsraum kannst du jedes Thema gezielt üben.</p>' +
    '<h3>Datenschutz</h3><p>Das Spiel speichert nichts im Internet. Alle Daten bleiben in diesem Browser auf diesem Gerät.</p>' +
    '<div class="row"><button class="btn" data-act="go" data-to="title">Verstanden</button></div></section>';

  // ================= Tastatur (für Laptops) =================
  document.addEventListener('keydown', e => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (view.name === 'pin') {
      if (/^[0-9]$/.test(e.key)) A.pinKey({ k: e.key });
      else if (e.key === 'Enter') A.pinKey({ k: 'OK' });
      else if (e.key === 'Backspace' || e.key === 'Escape') A.pinKey({ k: 'C' });
      return;
    }
    if (view.name !== 'combat' || !enc || document.querySelector('.modal-bg')) return;
    if (enc.state === 'solution' && e.key === 'Enter') { e.preventDefault(); return A.afterSolution(); }
    if (enc.state !== 'ask') return;
    const t = enc.task;
    if (t.input === 'choice') {
      let i = '1234'.indexOf(e.key);
      if (i < 0) i = 'abcd'.indexOf(e.key.toLowerCase());
      if (i >= 0 && i < t.choices.length) submit(i);
      return;
    }
    if (e.key === 'Enter') { e.preventDefault(); return submit(); }
    if (e.key === 'Backspace') { e.preventDefault(); return A.key({ ins: 'BS' }); }
    if (e.key === 'Escape') return A.key({ ins: 'C' });
    const k = ({ ',': '.', ':': '/', '²': '^2', '×': '*' })[e.key] || e.key;
    if (/^[0-9.+\-*/^()=]$/.test(k) || k === '^2' || (/^[a-z]$/.test(k) && (t.vars || []).includes(k))) {
      e.preventDefault();
      A.key({ ins: k });
    }
  });

  // Lesezugriff für automatische Tests
  RM.debug = { get run() { return run; }, get enc() { return enc; }, get view() { return view; }, get walking() { return walking; } };

  applyFx();
  show('title');
})(window.RM);
