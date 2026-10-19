// Frei begehbarer Dungeon: Erzeugung, Darstellung (Canvas), Laufen, Sicht, Zoom
// Der Zustand ist reines JSON und wird im Spielstand gespeichert (run.dungeon).
(function (RM) {
  'use strict';
  const W = 40, H = 28, BASE = 38;
  const FLOOR = 0, WALL = 1, DOOR = 2, GATE = 3;
  const ZOOMS = [0.7, 1, 1.35, 1.75];
  const R = RM.rand;
  const idx = (x, y) => y * W + x;
  const fy = y => H - 1 - y; // Koordinaten wie im Unterricht: y nach oben
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  const THEMES = {
    katakomben: { floor: ['#6e6156', '#76695d'], wall: '#15111b', top: '#2e2633', edge: '#e2cfae', void: '#0b0910', light: 'rgba(255, 180, 90, ', torch: true },
    hoehlen: { floor: ['#4b5f80', '#53688b'], wall: '#0b0f1a', top: '#1d2638', edge: '#a8dcff', void: '#080a12', light: 'rgba(140, 200, 255, ', crystal: true },
    turm: { floor: ['#675a8f', '#6f6298'], wall: '#110e20', top: '#262040', edge: '#ddd0ff', void: '#07081a', light: 'rgba(255, 240, 200, ', stars: true }
  };
  const EMO = { shop: '🛒', fire: '🔥', altar: '❓', board: '📜', chest: '🧰', map: '🗺️', stairs: '🪜' };
  const SOLID = new Set(['monster', 'elite', 'boss', 'shop', 'fire', 'altar', 'board']);

  // ================= Erzeugung =================
  // opts: { enemies: [emoji], elite, boss, need, quest: bool }
  function generate(opts) {
    for (let k = 0; k < 300; k++) {
      const s = tryGenerate(opts);
      if (s) return s;
    }
    throw new Error('Es konnte keine Ebene erzeugt werden.');
  }

  function bfsReach(tiles, sx, sy, ok) {
    const seen = new Set([idx(sx, sy)]), q = [[sx, sy]];
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy] of DIRS) {
        const nx = x + dx, ny = y + dy, k = idx(nx, ny);
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen.has(k) || !ok(tiles[k])) continue;
        seen.add(k); q.push([nx, ny]);
      }
    }
    return seen;
  }

  function tryGenerate(opts) {
    const tiles = new Array(W * H).fill(WALL);
    const rooms = [];
    for (let k = 0; k < 400 && rooms.length < 10; k++) {
      const w = R.int(4, 8), h = R.int(4, 6), x = R.int(1, W - w - 2), y = R.int(1, H - h - 2);
      if (rooms.some(r => x < r.x + r.w + 2 && x + w + 2 > r.x && y < r.y + r.h + 2 && y + h + 2 > r.y)) continue;
      rooms.push({ x, y, w, h, cx: x + (w >> 1), cy: y + (h >> 1) });
    }
    if (rooms.length < 9) return null;
    const carveRoom = r => { for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) tiles[idx(x, y)] = FLOOR; };
    const inRoom = (r, x, y) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
    const corridor = (a, b) => {
      const pts = [];
      let x = a.cx, y = a.cy;
      const stepX = () => { while (x !== b.cx) { x += Math.sign(b.cx - x); pts.push([x, y]); } };
      const stepY = () => { while (y !== b.cy) { y += Math.sign(b.cy - y); pts.push([x, y]); } };
      if (R.chance(0.5)) { stepX(); stepY(); } else { stepY(); stepX(); }
      return pts;
    };
    rooms.sort((a, b) => a.cx - b.cx);
    const start = rooms[0];
    const dist = r => Math.hypot(r.cx - start.cx, r.cy - start.cy);
    const boss = rooms.slice(1).reduce((best, r) => (dist(r) > dist(best) ? r : best), rooms[1]);
    const others = rooms.filter(r => r !== boss);
    const small = others.filter(r => r !== start && r.w * r.h <= 30);
    const vault = small.length ? R.pick(small) : others[others.length - 1];
    const main = others.filter(r => r !== vault);
    main.forEach(carveRoom);
    // Haupträume verbinden (nächster Nachbar) plus zwei Rundwege
    const linked = [main[0]], rest = main.slice(1);
    while (rest.length) {
      let bi = 0, bj = 0, bd = 1e9;
      rest.forEach((r, i) => linked.forEach((l, j) => { const d = Math.abs(r.cx - l.cx) + Math.abs(r.cy - l.cy); if (d < bd) { bd = d; bi = i; bj = j; } }));
      corridor(linked[bj], rest[bi]).forEach(([x, y]) => { tiles[idx(x, y)] = FLOOR; });
      linked.push(rest.splice(bi, 1)[0]);
    }
    for (let k = 0; k < 2; k++) {
      const a = R.pick(main), b = R.pick(main);
      if (a !== b) corridor(a, b).forEach(([x, y]) => { tiles[idx(x, y)] = FLOOR; });
    }
    // Boss-Raum und Schatzkammer mit genau einem Zugang (Tor bzw. Rätseltür)
    const attach = (room, kind) => {
      for (let y = room.y - 1; y <= room.y + room.h; y++) for (let x = room.x - 1; x <= room.x + room.w; x++) if (tiles[idx(x, y)] === FLOOR) return null;
      carveRoom(room);
      let target = main[0], bd = 1e9;
      main.forEach(r => { const d = Math.abs(r.cx - room.cx) + Math.abs(r.cy - room.cy); if (d < bd) { bd = d; target = r; } });
      let door = null;
      for (const [x, y] of corridor(room, target)) {
        if (!door && !inRoom(room, x, y)) { door = [x, y]; tiles[idx(x, y)] = kind; }
        else if (tiles[idx(x, y)] === WALL) tiles[idx(x, y)] = FLOOR;
      }
      return door;
    };
    const gate = attach(boss, GATE);
    if (!gate) return null;
    const door = attach(vault, DOOR);
    if (!door) return null;
    const reach = bfsReach(tiles, start.cx, start.cy, t => t === FLOOR);
    if (reach.has(idx(boss.cx, boss.cy)) || reach.has(idx(vault.cx, vault.cy))) return null;
    if (main.some(r => !reach.has(idx(r.cx, r.cy)))) return null;

    const S = {
      v: 1, tiles, explored: new Array(W * H).fill(0), rooms, gate, door,
      hero: { x: start.cx, y: start.cy }, ents: [], kills: 0, need: opts.need, hasMap: false, treasure: null,
      bossDead: false, log: [], nextId: 1
    };
    const used = new Set([idx(start.cx, start.cy)]);
    const freeTile = (r, margin = 0) => {
      for (let k = 0; k < 80; k++) {
        const x = R.int(r.x + margin, r.x + r.w - 1 - margin), y = R.int(r.y + margin, r.y + r.h - 1 - margin);
        if (!used.has(idx(x, y))) { used.add(idx(x, y)); return [x, y]; }
      }
      return null;
    };
    const add = (type, room, extra = {}, margin = 0) => {
      const p = freeTile(room, margin);
      if (!p) return null;
      const e = Object.assign({ id: S.nextId++, type, x: p[0], y: p[1], home: rooms.indexOf(room) }, extra);
      S.ents.push(e);
      return e;
    };
    const roomsNoStart = R.shuffle(main.filter(r => r !== start));
    for (let k = 0; k < 8; k++) {
      const ei = R.int(0, opts.enemies.length - 1);
      add('monster', roomsNoStart[k % roomsNoStart.length], { enemy: ei, emoji: opts.enemies[ei], cool: 0 });
    }
    // Elitegegner bewacht eine Truhe
    const eliteRoom = roomsNoStart[0];
    const chest = add('chest', eliteRoom, { gold: 25, item: true }, 1);
    if (chest) {
      const nb = DIRS.map(([dx, dy]) => [chest.x + dx, chest.y + dy]).find(([x, y]) => tiles[idx(x, y)] === FLOOR && !used.has(idx(x, y)));
      if (nb) { used.add(idx(nb[0], nb[1])); S.ents.push({ id: S.nextId++, type: 'elite', x: nb[0], y: nb[1], home: rooms.indexOf(eliteRoom), emoji: opts.elite }); }
    }
    add('shop', roomsNoStart[1 % roomsNoStart.length]);
    add('fire', roomsNoStart[2 % roomsNoStart.length]);
    add('altar', roomsNoStart[3 % roomsNoStart.length]);
    if (opts.quest) add('board', start);
    else add('altar', start);
    add('map', roomsNoStart[4 % roomsNoStart.length]);
    const tp = freeTile(R.pick(roomsNoStart));
    S.treasure = { x: tp[0], y: tp[1], found: false };
    add('chest', vault, { gold: 40, item: true });
    add('chest', vault, { gold: 20 });
    S.ents.push({ id: S.nextId++, type: 'boss', x: boss.cx, y: boss.cy, home: rooms.indexOf(boss), emoji: opts.boss });
    const monsters = S.ents.filter(e => e.type === 'monster' || e.type === 'elite').length;
    S.need = Math.max(1, Math.min(S.need, monsters));
    return S;
  }

  // ================= Ansicht & Steuerung =================
  let V = null; // aktive Ansicht

  function mount(root, S, hooks, opts) {
    unmount();
    const theme = THEMES[opts.theme] || THEMES.katakomben;
    root.innerHTML =
      '<div class="dgame" id="dgame"><canvas id="dview" aria-label="Dungeon. Tippe auf ein Feld, um dorthin zu laufen."></canvas>' +
      '<div class="dhud" aria-live="polite"><span class="dchip goal" id="dGoal"></span><span class="dchip" id="dPos"></span><span class="dchip hint" id="dMap" hidden></span></div>' +
      '<canvas class="dmini" id="dmini" aria-hidden="true"></canvas>' +
      '<div class="dzoom"><button class="zbtn" data-z="1" aria-label="Vergrößern">＋</button><button class="zbtn" data-z="-1" aria-label="Verkleinern">－</button></div>' +
      '<div class="dflash" id="dflash"></div></div>' +
      '<div class="dbelow"><div class="dpad" aria-label="Steuerkreuz"><span></span><button data-d="0,-1" aria-label="nach oben">▲</button><span></span>' +
      '<button data-d="-1,0" aria-label="nach links">◀</button><button class="c" data-d="0,0" aria-label="Eine Runde warten">warten</button><button data-d="1,0" aria-label="nach rechts">▶</button>' +
      '<span></span><button data-d="0,1" aria-label="nach unten">▼</button><span></span></div><div class="dlog" id="dlog" aria-live="polite"></div></div>';
    const cv = root.querySelector('#dview'), mini = root.querySelector('#dmini');
    V = {
      root, S, hooks, theme, cv, ctx: cv.getContext('2d'), mini, mctx: mini.getContext('2d'), hero: opts.hero,
      zoom: RM.clamp(opts.zoom, 0, ZOOMS.length - 1), path: [], walkTimer: null, busy: false, raf: 0,
      px: S.hero.x * BASE, py: S.hero.y * BASE, cam: { x: 0, y: 0 }, vw: 0, vh: 0, bursts: [], visible: new Uint8Array(W * H),
      pointers: new Map(), pinch: null, scale: 1
    };
    computeFov();
    resize();
    V.ro = window.ResizeObserver ? new ResizeObserver(resize) : null;
    if (V.ro) V.ro.observe(cv);
    hudUpdate();
    renderLog();
    if (S.lastBurst) { burst(S.lastBurst.x, S.lastBurst.y, S.lastBurst.emoji); S.lastBurst = null; }

    cv.addEventListener('pointerdown', onPointerDown);
    cv.addEventListener('pointermove', onPointerMove);
    cv.addEventListener('pointerup', onPointerUp);
    cv.addEventListener('pointercancel', onPointerUp);
    root.querySelectorAll('.dpad button').forEach(b => b.addEventListener('click', () => {
      if (V.busy) return;
      stopWalk();
      const [dx, dy] = b.dataset.d.split(',').map(Number);
      tryMove(dx, dy);
    }));
    root.querySelectorAll('.zbtn').forEach(b => b.addEventListener('click', () => setZoom(V.zoom + Number(b.dataset.z))));
    V.onKey = e => {
      if (V.busy || (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) || document.querySelector('.modal-bg')) return;
      const d = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0], ' ': [0, 0] }[e.key];
      if (e.key === '+') return setZoom(V.zoom + 1);
      if (e.key === '-') return setZoom(V.zoom - 1);
      if (!d) return;
      e.preventDefault();
      stopWalk();
      tryMove(d[0], d[1]);
    };
    document.addEventListener('keydown', V.onKey);
    const loop = now => { if (!V) return; draw(now); V.raf = requestAnimationFrame(loop); };
    V.raf = requestAnimationFrame(loop);
  }

  function unmount() {
    if (!V) return;
    cancelAnimationFrame(V.raf);
    stopWalk();
    if (V.ro) V.ro.disconnect();
    document.removeEventListener('keydown', V.onKey);
    V = null;
  }

  const TS = () => BASE * ZOOMS[V.zoom];
  function setZoom(z) {
    z = RM.clamp(z, 0, ZOOMS.length - 1);
    if (!V || z === V.zoom) return;
    V.zoom = z;
    V.hooks.onZoom(z);
  }

  function resize() {
    if (!V) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), r = V.cv.getBoundingClientRect();
    V.vw = r.width; V.vh = r.height;
    V.cv.width = r.width * dpr; V.cv.height = r.height * dpr;
    V.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const mr = V.mini.getBoundingClientRect();
    V.mini.width = mr.width * dpr; V.mini.height = mr.height * dpr;
    V.mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ---------- Sicht ----------
  const opaque = (x, y) => { const t = V.S.tiles[idx(x, y)]; return t === WALL || t === DOOR || t === GATE; };
  function computeFov() {
    const S = V.S, Rr = 6, hx = S.hero.x, hy = S.hero.y;
    V.visible.fill(0);
    for (let y = hy - Rr; y <= hy + Rr; y++) for (let x = hx - Rr; x <= hx + Rr; x++) {
      if (x < 0 || y < 0 || x >= W || y >= H || (x - hx) ** 2 + (y - hy) ** 2 > Rr * Rr + 1) continue;
      let x0 = hx, y0 = hy, clear = true;
      const dx = Math.abs(x - x0), dy = -Math.abs(y - y0), sx = x0 < x ? 1 : -1, sy = y0 < y ? 1 : -1;
      let err = dx + dy;
      while (!(x0 === x && y0 === y)) {
        if (!(x0 === hx && y0 === hy) && opaque(x0, y0)) { clear = false; break; }
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
      if (clear) { V.visible[idx(x, y)] = 1; S.explored[idx(x, y)] = 1; }
    }
  }

  // ---------- Bewegung ----------
  const entAt = (x, y) => V.S.ents.find(e => e.x === x && e.y === y && !e.gone);
  const walkable = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H || V.S.tiles[idx(x, y)] !== FLOOR) return false;
    const e = entAt(x, y);
    return !(e && SOLID.has(e.type) && !e.used);
  };
  function findPath(tx, ty) {
    const S = V.S, prev = new Map([[idx(S.hero.x, S.hero.y), null]]), q = [[S.hero.x, S.hero.y]];
    while (q.length) {
      const [x, y] = q.shift();
      if (x === tx && y === ty) break;
      for (const [dx, dy] of DIRS) {
        const nx = x + dx, ny = y + dy, k = idx(nx, ny);
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || prev.has(k) || !S.explored[k]) continue;
        if (!(nx === tx && ny === ty) && !walkable(nx, ny)) continue;
        prev.set(k, [x, y]);
        q.push([nx, ny]);
      }
    }
    if (!prev.has(idx(tx, ty))) return [];
    const out = [];
    for (let cur = [tx, ty]; cur && !(cur[0] === S.hero.x && cur[1] === S.hero.y); cur = prev.get(idx(cur[0], cur[1]))) out.unshift(cur);
    return out;
  }
  function stopWalk() { if (V) { clearInterval(V.walkTimer); V.path = []; } }
  function walkTo(tx, ty) {
    if (V.busy) return;
    const S = V.S;
    if (tx === S.hero.x && ty === S.hero.y) return;
    V.path = findPath(tx, ty);
    if (!V.path.length) return log('Dorthin findest du (noch) keinen Weg.');
    clearInterval(V.walkTimer);
    V.walkTimer = setInterval(stepPath, RM.fx.isCalm() ? 60 : 130);
    stepPath();
  }
  function stepPath() {
    if (!V || V.busy || !V.path.length) return stopWalk();
    const [nx, ny] = V.path.shift();
    if (!tryMove(nx - V.S.hero.x, ny - V.S.hero.y)) stopWalk();
  }
  // Ein Schritt oder „Anstoßen“; false = Laufen anhalten
  function tryMove(dx, dy) {
    const S = V.S;
    if (V.busy) return false;
    if (dx === 0 && dy === 0) { worldTurn(); save(); return !!V && !V.busy; }
    const nx = S.hero.x + dx, ny = S.hero.y + dy, t = S.tiles[idx(nx, ny)], e = entAt(nx, ny);
    if (t === WALL) return false;
    if (t === DOOR) { encounter({ type: 'door', x: nx, y: ny }); return false; }
    if (t === GATE) {
      if (S.kills >= S.need) { S.tiles[idx(nx, ny)] = FLOOR; log('⛩️ Das Boss-Tor öffnet sich knarrend …'); RM.fx.sfx.rage(); computeFov(); save(); return false; }
      log('⛩️ Das Tor ist verschlossen. Besiege noch ' + (S.need - S.kills) + ' Monster.');
      return false;
    }
    if (e && SOLID.has(e.type) && !e.used) { encounter(e); return false; }
    S.hero.x = nx; S.hero.y = ny;
    RM.fx.sfx.step();
    if (e) pickup(e);
    if (!V || V.busy) return false; // z. B. Treppe: das Spiel hat bereits gewechselt
    if (S.hasMap && !S.treasure.found && nx === S.treasure.x && ny === S.treasure.y) {
      S.treasure.found = true;
      V.hooks.onGold(30, 'Schatz');
      log('💰 Hier ist der Schatz! +30 Gold');
      burst(nx, ny, '🪙');
    }
    computeFov();
    worldTurn();
    if (!V) return false; // ein Monster hat angegriffen, der Kampf läuft schon
    hudUpdate();
    save();
    return !V.busy;
  }

  // Monster bewegen sich nur, wenn du einen Schritt machst, und bleiben in ihrem Raum
  function worldTurn() {
    const S = V.S;
    for (const m of S.ents) {
      if (m.gone || m.type !== 'monster') continue;
      if (m.cool > 0) { m.cool--; continue; }
      if (!R.chance(0.5)) continue;
      const r = S.rooms[m.home];
      for (const [dx, dy] of R.shuffle(DIRS.slice())) {
        const nx = m.x + dx, ny = m.y + dy;
        if (nx < r.x || ny < r.y || nx >= r.x + r.w || ny >= r.y + r.h) continue;
        if (!walkable(nx, ny) || (nx === S.hero.x && ny === S.hero.y) || entAt(nx, ny)) continue;
        m.x = nx; m.y = ny;
        break;
      }
    }
    if (V.busy) return;
    const adj = S.ents.find(m => !m.gone && m.type === 'monster' && !(m.cool > 0) && Math.abs(m.x - S.hero.x) + Math.abs(m.y - S.hero.y) === 1);
    if (adj) { log(adj.emoji + ' Ein Monster springt dich an!'); encounter(adj); }
  }

  function pickup(e) {
    const S = V.S;
    if (e.type === 'chest') {
      e.gone = true;
      V.hooks.onGold(e.gold, 'Truhe', e.item);
      log('🧰 Truhe geöffnet: +' + e.gold + ' Gold');
      burst(e.x, e.y, '🪙');
    } else if (e.type === 'map') {
      e.gone = true;
      S.hasMap = true;
      log('🗺️ Eine Schatzkarte! Der Schatz liegt bei (' + S.treasure.x + '|' + fy(S.treasure.y) + ').');
      V.hooks.onMap(S.treasure.x, fy(S.treasure.y), S.hero.x, fy(S.hero.y));
    } else if (e.type === 'stairs') {
      V.busy = true;
      save();
      V.hooks.onStairs();
    }
  }

  // Begegnung: Kamera fährt kurz heran, dann übernimmt das Spiel
  function encounter(e) {
    const fightish = e.type === 'monster' || e.type === 'elite' || e.type === 'boss';
    V.busy = true;
    stopWalk();
    save();
    if (!fightish || RM.fx.isCalm()) return V.hooks.onEncounter(e);
    V.focus = { x: e.x, y: e.y, t0: performance.now() };
    const flash = V.root.querySelector('#dflash');
    setTimeout(() => { if (flash) flash.classList.add('on'); }, 280);
    setTimeout(() => { if (V) V.hooks.onEncounter(e); }, 450);
  }

  function save() { if (V) V.hooks.onSave(); }

  // ---------- Meldungen & Anzeige ----------
  function log(s) {
    const L = V.S.log;
    L.unshift(s);
    L.length = Math.min(L.length, 6);
    renderLog();
  }
  function renderLog() {
    const el = V.root.querySelector('#dlog');
    if (el) el.innerHTML = V.S.log.map(l => '<div>' + l + '</div>').join('');
  }
  function hudUpdate() {
    const S = V.S, q = id => V.root.querySelector(id);
    const done = S.kills >= S.need;
    q('#dGoal').textContent = '⚔️ ' + Math.min(S.kills, S.need) + ' / ' + S.need + (done ? (S.bossDead ? ' · Treppe nach unten!' : ' · Boss-Tor offen') : ' Monster');
    q('#dGoal').classList.toggle('done', done);
    q('#dPos').innerHTML = '📍 <span class="m">(' + S.hero.x + '|' + fy(S.hero.y) + ')</span>';
    q('#dMap').hidden = !S.hasMap || S.treasure.found;
    q('#dMap').innerHTML = '🗺️ Schatz: <span class="m">(' + S.treasure.x + '|' + fy(S.treasure.y) + ')</span>';
  }
  function burst(x, y, emoji) { if (!RM.fx.isCalm()) V.bursts.push({ x, y, emoji, t0: performance.now() }); }

  // ---------- Eingabe: Tippen, Wischen, Pinch-Zoom ----------
  function onPointerDown(e) {
    V.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY });
    if (V.pointers.size === 2) {
      const [a, b] = [...V.pointers.values()];
      V.pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y), z0: V.zoom };
    }
  }
  function onPointerMove(e) {
    const p = V.pointers.get(e.pointerId);
    if (!p) return;
    p.x = e.clientX; p.y = e.clientY;
    if (V.pinch && V.pointers.size === 2) {
      const [a, b] = [...V.pointers.values()];
      const ratio = Math.hypot(a.x - b.x, a.y - b.y) / V.pinch.d0;
      const step = ratio > 1.3 ? 1 : ratio < 0.77 ? -1 : 0;
      setZoom(V.pinch.z0 + step + (ratio > 1.9 ? 1 : ratio < 0.5 ? -1 : 0));
    }
  }
  function onPointerUp(e) {
    const p = V.pointers.get(e.pointerId);
    V.pointers.delete(e.pointerId);
    if (V.pinch) { if (!V.pointers.size) V.pinch = null; return; }
    if (!p || V.busy || e.type === 'pointercancel') return;
    if (Math.hypot(p.x - p.sx, p.y - p.sy) > 12) return;
    const r = V.cv.getBoundingClientRect(), ts = TS();
    const tx = Math.floor((e.clientX - r.left + V.cam.x) / ts), ty = Math.floor((e.clientY - r.top + V.cam.y) / ts);
    if (tx < 0 || ty < 0 || tx >= W || ty >= H) return;
    if (!V.S.explored[idx(tx, ty)]) return log('Dort warst du noch nicht – erkunde zuerst den Weg dorthin.');
    walkTo(tx, ty);
  }

  // ---------- Zeichnen ----------
  const hash = (x, y) => ((x * 73856093) ^ (y * 19349663)) >>> 0;
  function draw(now) {
    const { ctx, S, theme } = V, calm = RM.fx.isCalm(), t = now / 1000;
    let ts = TS();
    // Kamera-Fahrt zur Begegnung
    if (V.focus) { const p = Math.min(1, (now - V.focus.t0) / 400); ts *= 1 + 0.5 * p; }
    const k = calm ? 1 : 0.35;
    V.px += (S.hero.x * BASE - V.px) * k;
    V.py += (S.hero.y * BASE - V.py) * k;
    const hpx = V.px / BASE * ts, hpy = V.py / BASE * ts;
    const fx0 = V.focus ? V.focus.x * ts : hpx, fy0 = V.focus ? V.focus.y * ts : hpy;
    const cx = (hpx + fx0) / 2, cy = (hpy + fy0) / 2;
    V.cam.x = W * ts < V.vw ? (W * ts - V.vw) / 2 : Math.max(-ts, Math.min(W * ts - V.vw + ts, cx + ts / 2 - V.vw / 2));
    V.cam.y = H * ts < V.vh ? (H * ts - V.vh) / 2 : Math.max(-2 * ts, Math.min(H * ts - V.vh + ts, cy + ts / 2 - V.vh / 2));
    const cam = V.cam;
    ctx.fillStyle = theme.void;
    ctx.fillRect(0, 0, V.vw, V.vh);
    const x0 = Math.max(0, Math.floor(cam.x / ts)), x1 = Math.min(W - 1, Math.ceil((cam.x + V.vw) / ts));
    const y0 = Math.max(0, Math.floor(cam.y / ts)), y1 = Math.min(H - 1, Math.ceil((cam.y + V.vh) / ts));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const open = (xx, yy) => xx >= 0 && yy >= 0 && xx < W && yy < H && S.tiles[idx(xx, yy)] !== WALL && S.explored[idx(xx, yy)];
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = idx(x, y);
      if (!S.explored[i]) continue;
      const sx = x * ts - cam.x, sy = y * ts - cam.y, tile = S.tiles[i], vis = V.visible[i];
      if (tile === WALL) {
        let edge = false;
        for (let dy = -1; dy <= 1 && !edge; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H && S.tiles[idx(xx, yy)] !== WALL) { edge = true; break; } }
        if (!edge) continue;
        ctx.fillStyle = theme.wall; ctx.fillRect(sx, sy, ts, ts);
        if (y + 1 < H && S.tiles[idx(x, y + 1)] !== WALL) { ctx.fillStyle = theme.top; ctx.fillRect(sx, sy + ts * .68, ts, ts * .32); }
        if (theme.torch && hash(x, y) % 11 === 0 && y + 1 < H && S.tiles[idx(x, y + 1)] === FLOOR) {
          const f = calm ? 1 : 1 + .12 * Math.sin(t * 9 + x) + .07 * Math.sin(t * 23 + y);
          const g = ctx.createRadialGradient(sx + ts / 2, sy + ts / 2, 2, sx + ts / 2, sy + ts / 2, ts * 1.2 * f);
          g.addColorStop(0, 'rgba(255, 170, 70, .45)'); g.addColorStop(1, 'rgba(255, 170, 70, 0)');
          ctx.fillStyle = g; ctx.fillRect(sx - ts, sy - ts, ts * 3, ts * 3);
          ctx.fillStyle = 'rgba(255, 200, 90, .95)'; ctx.beginPath(); ctx.ellipse(sx + ts / 2, sy + ts / 2, ts * .1 * f, ts * .18 * f, 0, 0, 7); ctx.fill();
        }
        if (theme.crystal && hash(x, y) % 13 === 0) {
          ctx.fillStyle = 'hsla(' + (hash(x, y) % 2 ? 190 : 285) + ', 80%, 65%, ' + (calm ? .7 : .45 + .35 * Math.sin(t * 2 + x)) + ')';
          ctx.beginPath(); ctx.moveTo(sx + ts / 2, sy + ts * .2); ctx.lineTo(sx + ts * .66, sy + ts / 2); ctx.lineTo(sx + ts / 2, sy + ts * .75); ctx.lineTo(sx + ts * .34, sy + ts / 2); ctx.fill();
        }
        if (theme.stars && hash(x, y) % 9 === 0) { ctx.fillStyle = 'rgba(255, 255, 255, ' + (calm ? .6 : .3 + .5 * Math.abs(Math.sin(t * 1.3 + y))) + ')'; ctx.fillRect(sx + (hash(x, y) % 30) / 38 * ts, sy + (hash(y, x) % 20) / 38 * ts, 2, 2); }
      } else {
        ctx.fillStyle = theme.floor[(x + y) % 2]; ctx.fillRect(sx, sy, ts, ts);
        ctx.strokeStyle = 'rgba(0, 0, 0, .22)'; ctx.strokeRect(sx + .5, sy + .5, ts - 1, ts - 1);
        if (hash(x, y) % 7 === 0) { ctx.fillStyle = 'rgba(255, 255, 255, .06)'; ctx.fillRect(sx + ts * .16, sy + ts * .2, ts * .26, ts * .16); }
        if (tile === DOOR) { ctx.font = (ts * .8) + 'px serif'; ctx.fillText('🚪', sx + ts / 2, sy + ts / 2 + 2); }
        if (tile === GATE) { ctx.fillStyle = '#5c1f2a'; ctx.fillRect(sx + 3, sy + 3, ts - 6, ts - 6); ctx.font = (ts * .72) + 'px serif'; ctx.fillText('⛩️', sx + ts / 2, sy + ts / 2 + 2); }
      }
      if (!vis) { ctx.fillStyle = 'rgba(8, 6, 12, .45)'; ctx.fillRect(sx, sy, ts, ts); }
      if (tile === WALL) {
        ctx.strokeStyle = theme.edge; ctx.globalAlpha = vis ? .9 : .5; ctx.lineWidth = Math.max(2, ts * .07);
        ctx.beginPath();
        if (open(x, y - 1)) { ctx.moveTo(sx, sy + 1); ctx.lineTo(sx + ts, sy + 1); }
        if (open(x, y + 1)) { ctx.moveTo(sx, sy + ts - 1); ctx.lineTo(sx + ts, sy + ts - 1); }
        if (open(x - 1, y)) { ctx.moveTo(sx + 1, sy); ctx.lineTo(sx + 1, sy + ts); }
        if (open(x + 1, y)) { ctx.moveTo(sx + ts - 1, sy); ctx.lineTo(sx + ts - 1, sy + ts); }
        ctx.stroke();
        ctx.globalAlpha = 1; ctx.lineWidth = 1;
      }
    }
    if (S.hasMap && !S.treasure.found && S.explored[idx(S.treasure.x, S.treasure.y)]) {
      const sx = S.treasure.x * ts - cam.x, sy = S.treasure.y * ts - cam.y;
      ctx.strokeStyle = 'rgba(255, 207, 122, .95)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(sx + ts * .25, sy + ts * .25); ctx.lineTo(sx + ts * .75, sy + ts * .75); ctx.moveTo(sx + ts * .75, sy + ts * .25); ctx.lineTo(sx + ts * .25, sy + ts * .75); ctx.stroke();
      ctx.lineWidth = 1;
    }
    for (const e of S.ents) {
      if (e.gone) continue;
      const i = idx(e.x, e.y), mob = e.type === 'monster' || e.type === 'elite' || e.type === 'boss';
      if (mob ? !V.visible[i] : !S.explored[i]) continue;
      const sx = e.x * ts - cam.x, sy = e.y * ts - cam.y, bob = calm || !mob ? 0 : Math.sin(t * 3 + e.x) * ts * .05;
      // dunkle Scheibe als Kontrast zum hellen Boden
      ctx.fillStyle = mob ? 'rgba(60, 10, 20, .55)' : 'rgba(10, 8, 16, .5)';
      ctx.beginPath(); ctx.arc(sx + ts / 2, sy + ts / 2, ts * (e.type === 'boss' ? .55 : .42), 0, 7); ctx.fill();
      ctx.font = (e.type === 'boss' ? ts * 1.15 : ts * .78) + 'px serif';
      ctx.globalAlpha = e.used ? .35 : (V.visible[i] ? 1 : .6);
      ctx.fillText(e.emoji || EMO[e.type], sx + ts / 2, sy + ts / 2 + 2 + bob);
      ctx.globalAlpha = 1;
    }
    const hx = hpx - cam.x + ts / 2, hy = hpy - cam.y + ts / 2;
    const lg = ctx.createRadialGradient(hx, hy, 10, hx, hy, ts * 6.5);
    lg.addColorStop(0, theme.light + '.18)'); lg.addColorStop(1, theme.light + '0)');
    ctx.fillStyle = lg; ctx.fillRect(hx - ts * 7, hy - ts * 7, ts * 14, ts * 14);
    ctx.fillStyle = 'rgba(0, 0, 0, .4)'; ctx.beginPath(); ctx.ellipse(hx, hy + ts * .34, ts * .3, ts * .1, 0, 0, 7); ctx.fill();
    ctx.font = (ts * .85) + 'px serif';
    ctx.fillText(V.hero, hx, hy - 1);
    if (V.path.length) {
      ctx.fillStyle = 'rgba(255, 207, 122, .6)';
      V.path.forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x * ts - cam.x + ts / 2, y * ts - cam.y + ts / 2, Math.max(3, ts * .08), 0, 7); ctx.fill(); });
    }
    for (let b = V.bursts.length - 1; b >= 0; b--) {
      const p = (now - V.bursts[b].t0) / 900;
      if (p >= 1) { V.bursts.splice(b, 1); continue; }
      ctx.globalAlpha = 1 - p; ctx.font = Math.round(ts * .5) + 'px serif';
      for (let n = 0; n < 6; n++) {
        const a = n / 6 * Math.PI * 2;
        ctx.fillText(V.bursts[b].emoji, V.bursts[b].x * ts - cam.x + ts / 2 + Math.cos(a) * p * ts, V.bursts[b].y * ts - cam.y + ts / 2 + Math.sin(a) * p * ts - p * ts * .5);
      }
      ctx.globalAlpha = 1;
    }
    // Koordinaten am Rand: x nach rechts, y nach oben
    ctx.font = Math.round(Math.max(10, ts * .28)) + 'px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, .5)';
    for (let x = x0; x <= x1; x++) ctx.fillText(x, x * ts - cam.x + ts / 2, V.vh - 8);
    ctx.textAlign = 'left';
    for (let y = y0; y <= y1; y++) ctx.fillText(fy(y), 3, y * ts - cam.y + ts / 2);
    drawMini();
  }
  function drawMini() {
    const { mctx, mini, S, theme } = V, mw = mini.clientWidth, mh = mini.clientHeight;
    if (!mw) return;
    const s = Math.min(mw / W, mh / H), ox = (mw - W * s) / 2, oy = (mh - H * s) / 2;
    mctx.clearRect(0, 0, mw, mh);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = idx(x, y);
      if (!S.explored[i] || S.tiles[i] === WALL) continue;
      mctx.fillStyle = S.tiles[i] === GATE ? '#ef6461' : S.tiles[i] === DOOR ? '#b9772a' : theme.floor[1];
      mctx.fillRect(ox + x * s, oy + y * s, s + .3, s + .3);
    }
    const st = S.ents.find(e => e.type === 'stairs' && !e.gone);
    if (st) { mctx.fillStyle = '#5cc98a'; mctx.fillRect(ox + st.x * s - 1, oy + st.y * s - 1, s + 2, s + 2); }
    mctx.fillStyle = '#ffcf7a';
    mctx.beginPath(); mctx.arc(ox + (S.hero.x + .5) * s, oy + (S.hero.y + .5) * s, Math.max(2, s), 0, 7); mctx.fill();
  }

  // ================= Schnittstelle für das Spiel =================
  RM.dungeon = {
    W, H, ZOOMS, generate, mount, unmount, fy,
    // Lesezugriff für automatische Tests
    test: { get state() { return V && V.S; }, get visible() { return V && V.visible; }, get busy() { return !V || V.busy; }, walkTo: (x, y) => V && walkTo(x, y), canReach: (x, y) => !!V && findPath(x, y).length > 0 },
    log: s => { if (V) log(s); },
    // nach einer Begegnung: Ereignis abschließen
    resolve(S, id, how) {
      const e = S.ents.find(x => x.id === id);
      if (!e) return;
      if (how === 'defeated') {
        e.gone = true;
        S.kills++;
        S.lastBurst = { x: e.x, y: e.y, emoji: '✨' };
        S.log.unshift(e.emoji + ' besiegt! ' + (S.kills < S.need ? 'Noch ' + (S.need - S.kills) + ' bis zum Boss-Tor.' : S.kills === S.need ? 'Das Boss-Tor lässt sich jetzt öffnen!' : 'Schon ' + S.kills + ' Monster besiegt.'));
        if (e.type === 'boss') {
          S.bossDead = true;
          S.ents.push({ id: S.nextId++, type: 'stairs', x: e.x, y: e.y });
          S.log.unshift('👑 Der Boss ist besiegt! Eine Treppe führt nach unten.');
        }
      } else if (how === 'repelled') {
        e.cool = 3;
        S.log.unshift('💨 Das Monster weicht zurück.');
      } else if (how === 'used') {
        e.used = true;
      }
      S.log.length = Math.min(S.log.length, 6);
    },
    openDoor(S, x, y) {
      S.tiles[idx(x, y)] = FLOOR;
      S.log.unshift('🚪 Die Rätseltür schwingt auf – dahinter liegt eine Schatzkammer!');
    }
  };
})(window.RM);
