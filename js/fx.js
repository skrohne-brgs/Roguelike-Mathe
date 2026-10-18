// Effekte: Klänge (Web Audio, ohne Dateien), Animationen der Kampfbühne, Kulissen der Karte
(function (RM) {
  'use strict';

  const fx = {};
  let soundOn = false, calm = false, ac = null;
  const prefersCalm = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Einstellungen aus dem Spiel übernehmen
  fx.configure = ({ sound, reduced }) => {
    soundOn = !!sound;
    calm = !!reduced || prefersCalm();
    document.documentElement.classList.toggle('calm', calm);
    if (soundOn && !ac) {
      try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { soundOn = false; }
    }
    if (ac && ac.state === 'suspended') ac.resume();
  };
  fx.isCalm = () => calm;
  // Browser erlauben Ton erst nach einer Berührung
  fx.unlock = () => { if (soundOn && ac && ac.state === 'suspended') ac.resume(); };
  const D = ms => (calm ? 1 : ms);
  fx.D = D;
  fx.wait = ms => new Promise(r => setTimeout(r, D(ms)));
  fx.anim = (el, frames, opts) => {
    if (!el || !el.animate) return Promise.resolve();
    return el.animate(frames, Object.assign({ fill: 'forwards' }, opts, { duration: D(opts.duration) })).finished.catch(() => {});
  };

  // ---------- Klänge ----------
  function tone(f, dur, type = 'square', vol = 0.1, to = null, delay = 0) {
    if (!soundOn || !ac) return;
    const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ac.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol = 0.15, delay = 0) {
    if (!soundOn || !ac) return;
    const t = ac.currentTime + delay, buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 900; s.buffer = buf; g.gain.value = vol;
    s.connect(f).connect(g).connect(ac.destination);
    s.start(t);
  }
  fx.sfx = {
    step: () => tone(220, 0.05, 'triangle', 0.06),
    select: () => tone(660, 0.07, 'triangle', 0.07),
    cast: () => tone(500, 0.35, 'sine', 0.07, 1200),
    hit: () => { noise(0.18, 0.22); tone(180, 0.15, 'square', 0.07, 90); },
    crit: () => { noise(0.2, 0.26); [660, 880, 1320].forEach((f, i) => tone(f, 0.12, 'square', 0.06, null, i * 0.07)); },
    wrong: () => { tone(140, 0.3, 'sawtooth', 0.1, 60); noise(0.25, 0.18, 0.05); },
    coin: () => { tone(988, 0.08, 'square', 0.05); tone(1319, 0.18, 'square', 0.05, null, 0.08); },
    boss: () => { tone(70, 1.2, 'sawtooth', 0.1, 50); tone(105, 1.2, 'sawtooth', 0.05, 70); },
    rage: () => { noise(0.6, 0.26); tone(90, 0.7, 'sawtooth', 0.12, 45); },
    win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.07, null, i * 0.1)),
    tick: () => tone(1200, 0.03, 'square', 0.03),
    plop: () => tone(330, 0.12, 'sine', 0.09, 520)
  };

  // ---------- Kampfbühne ----------
  function center(el, box) {
    const a = box.getBoundingClientRect(), r = el.getBoundingClientRect();
    return { x: r.left - a.left + r.width / 2, y: r.top - a.top + r.height / 2 };
  }
  fx.floatText = (box, html, x, y, cls) => {
    const d = document.createElement('div');
    d.className = 'dmg ' + (cls || '');
    d.innerHTML = html;
    d.style.left = x + 'px'; d.style.top = y + 'px';
    box.appendChild(d);
    fx.anim(d, [{ transform: 'translate(-50%, 0) scale(.6)', opacity: 0 }, { transform: 'translate(-50%, -26px) scale(1.1)', opacity: 1, offset: .25 },
      { transform: 'translate(-50%, -60px) scale(1)', opacity: 0 }], { duration: 1100, easing: 'ease-out' }).then(() => d.remove());
  };
  fx.sparks = (box, x, y, n, color) => {
    if (calm) return;
    for (let i = 0; i < n; i++) {
      const s = document.createElement('div');
      s.className = 'spark';
      s.style.left = x + 'px'; s.style.top = y + 'px';
      if (color) { s.style.background = color; s.style.boxShadow = '0 0 6px ' + color; }
      box.appendChild(s);
      const a = Math.random() * Math.PI * 2, dist = 30 + Math.random() * 55;
      fx.anim(s, [{ transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
        { transform: 'translate(' + (Math.cos(a) * dist - 3) + 'px, ' + (Math.sin(a) * dist - 3) + 'px) scale(.2)', opacity: 0 }],
      { duration: 500 + Math.random() * 300, easing: 'cubic-bezier(.2, .8, .3, 1)' }).then(() => s.remove());
    }
  };
  fx.shake = el => { if (!el || calm) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); };

  // Richtige Antwort: die Antwort fliegt als Rune zum Gegner
  fx.attack = async (arena, runeHtml, crit) => {
    if (!arena) return;
    const heroBody = arena.querySelector('#heroF .body'), enemyBody = arena.querySelector('#enemyBody');
    const h = center(heroBody, arena), e = center(enemyBody, arena);
    fx.anim(heroBody, [{ transform: 'none' }, { transform: 'translateX(14px) rotate(8deg)' }, { transform: 'none' }], { duration: 300 });
    const rune = document.createElement('div');
    rune.className = 'rune' + (crit ? ' crit' : '');
    rune.innerHTML = runeHtml;
    arena.appendChild(rune);
    fx.sfx.cast();
    await fx.anim(rune, [
      { transform: 'translate(' + h.x + 'px, ' + h.y + 'px) translate(-50%, -50%) scale(.5)', opacity: 0 },
      { transform: 'translate(' + (h.x + e.x) / 2 + 'px, ' + (Math.min(h.y, e.y) - 55) + 'px) translate(-50%, -50%) scale(1.1)', opacity: 1, offset: .5 },
      { transform: 'translate(' + e.x + 'px, ' + e.y + 'px) translate(-50%, -50%) scale(.9)', opacity: 1 }
    ], { duration: crit ? 480 : 600, easing: 'ease-in' });
    rune.remove();
    if (crit) fx.sfx.crit(); else fx.sfx.hit();
    fx.sparks(arena, e.x, e.y, crit ? 24 : 12, crit ? '#ffe9a8' : null);
    enemyBody.classList.remove('hit'); void enemyBody.offsetWidth; enemyBody.classList.add('hit');
    if (crit) fx.shake(arena);
    return e;
  };

  // Falsche Antwort: der Gegner stürmt vor
  fx.enemyAttack = async (arena, text, blocked) => {
    if (!arena) return;
    const eF = arena.querySelector('#enemyF'), heroBody = arena.querySelector('#heroF .body');
    const h = center(heroBody, arena), e = center(arena.querySelector('#enemyBody'), arena);
    fx.sfx.wrong();
    await fx.anim(eF, [{ transform: 'translateX(-50%)' }, { transform: 'translateX(calc(-50% + 16px))', offset: .3 },
      { transform: 'translateX(calc(-50% - ' + Math.max(0, e.x - h.x - 60) + 'px))', offset: .6 }, { transform: 'translateX(-50%)' }], { duration: 620, easing: 'ease-in-out' });
    if (eF.getAnimations) eF.getAnimations().forEach(a => a.cancel());
    fx.shake(arena);
    fx.sparks(arena, h.x, h.y, 10, blocked ? '#6aa7ff' : '#ef6461');
    fx.floatText(arena, text, h.x, h.y - 30, blocked ? 'block' : '');
    await fx.wait(350);
  };

  fx.defeat = async arena => {
    const eb = arena && arena.querySelector('#enemyBody');
    if (!eb) return;
    fx.sfx.win();
    await fx.anim(eb, [{ transform: 'none', opacity: 1 }, { transform: 'scale(1.3) rotate(-12deg)', opacity: 1, offset: .3 },
      { transform: 'scale(.1) rotate(200deg)', opacity: 0 }], { duration: 700, easing: 'ease-in' });
  };

  // Boss wechselt die Phase
  fx.phaseChange = async (arena, title, sub) => {
    if (!arena) return;
    fx.sfx.rage();
    const flash = document.createElement('div'); flash.className = 'flash'; arena.appendChild(flash);
    fx.anim(flash, [{ opacity: .8 }, { opacity: 0 }], { duration: 450 }).then(() => flash.remove());
    const eb = arena.querySelector('#enemyBody');
    fx.anim(eb, [{ transform: 'scale(1)', filter: 'none' }, { transform: 'scale(1.3) rotate(-5deg)', filter: 'brightness(2.5)', offset: .3 },
      { transform: 'scale(1.1) rotate(3deg)', offset: .6 }, { transform: 'scale(1.15)', filter: 'drop-shadow(0 0 18px #ef6461) saturate(1.6)' }], { duration: 900 });
    fx.shake(arena);
    const b = document.createElement('div');
    b.className = 'banner';
    b.innerHTML = '<b>' + title + '</b><small>' + sub + '</small>';
    arena.appendChild(b);
    await fx.anim(b, [{ transform: 'translateX(-110%)' }, { transform: 'translateX(0)', offset: .25 }, { transform: 'translateX(0)', offset: .8 }, { transform: 'translateX(110%)' }], { duration: 1800, easing: 'ease-in-out' });
    b.remove();
  };

  // Boss-Auftritt
  fx.bossEntrance = async stage => {
    if (!stage) return;
    const body = stage.querySelector('.bossbody'), banner = stage.querySelector('.banner'), vig = stage.querySelector('.vignette');
    fx.sfx.boss();
    vig.classList.add('on');
    await fx.wait(400);
    body.classList.add('in');
    await fx.wait(700);
    fx.shake(stage);
    banner.classList.add('show');
  };

  // Belohnungstruhe
  fx.chest = async stage => {
    if (!stage) return;
    const c = stage.querySelector('.chest');
    for (let i = 0; i < 3 && !calm; i++) {
      fx.sfx.tick();
      await fx.anim(c, [{ transform: 'translateX(-50%) rotate(0)' }, { transform: 'translateX(-50%) rotate(-6deg)' }, { transform: 'translateX(-50%) rotate(6deg)' }, { transform: 'translateX(-50%) rotate(0)' }], { duration: 240 });
      await fx.wait(100);
    }
    c.classList.add('open');
    stage.querySelector('.rays').classList.add('on');
    fx.sfx.win();
    const sr = stage.getBoundingClientRect(), cr = c.getBoundingClientRect();
    const ox = cr.left - sr.left + cr.width / 2, oy = cr.top - sr.top + 10;
    for (let i = 0; i < (calm ? 0 : 12); i++) {
      const l = document.createElement('div');
      l.className = 'loot'; l.textContent = '🪙';
      l.style.left = ox + 'px'; l.style.top = oy + 'px';
      stage.appendChild(l);
      const dx = (Math.random() - .5) * 240, up = 70 + Math.random() * 80;
      fx.anim(l, [{ transform: 'translate(-50%, 0) scale(.4)', opacity: 1 }, { transform: 'translate(calc(-50% + ' + dx * .6 + 'px), -' + up + 'px) scale(1)', opacity: 1, offset: .45 },
        { transform: 'translate(calc(-50% + ' + dx + 'px), 50px) scale(.9)', opacity: 0 }], { duration: 1100 + Math.random() * 400, easing: 'ease-out', delay: i * 40 }).then(() => l.remove());
      setTimeout(fx.sfx.coin, i * 70);
    }
  };

  // ---------- Kulissen der Karte (Canvas) ----------
  let bg = null;
  fx.stopMap = () => {
    if (!bg) return;
    cancelAnimationFrame(bg.raf);
    if (bg.ro) bg.ro.disconnect();
    bg = null;
  };
  fx.startMap = (canvas, theme, seed) => {
    fx.stopMap();
    const ctx = canvas.getContext('2d');
    bg = { canvas, ctx, theme, seed, raf: 0, ro: null, w: 0, h: 0, deco: [], img: null };
    const build = () => {
      const r = canvas.getBoundingClientRect();
      if (!r.width) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      bg.w = r.width; bg.h = r.height;
      canvas.width = r.width * dpr; canvas.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildStatic(dpr);
      draw(performance.now());
    };
    if (window.ResizeObserver) { bg.ro = new ResizeObserver(build); bg.ro.observe(canvas); }
    build();
    const loop = now => {
      if (!bg) return;
      if (!calm && !document.hidden) draw(now);
      bg.raf = requestAnimationFrame(loop);
    };
    bg.raf = requestAnimationFrame(loop);
  };
  function rnd(seed) { let s = seed % 2147483646 + 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  function buildStatic(dpr) {
    const { w, h, theme } = bg, off = document.createElement('canvas');
    off.width = w * dpr; off.height = h * dpr;
    const o = off.getContext('2d');
    o.setTransform(dpr, 0, 0, dpr, 0, 0);
    const R = rnd(bg.seed || 7);
    bg.deco = [];
    if (theme === 'hoehlen') {
      const g = o.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0f1426'); g.addColorStop(1, '#1d1430');
      o.fillStyle = g; o.fillRect(0, 0, w, h);
      for (let i = 0; i < 18; i++) { const x = R() * w, s = 12 + R() * 26, l = 30 + R() * 80; o.fillStyle = 'hsl(250, 18%, ' + (10 + R() * 6) + '%)'; o.beginPath(); o.moveTo(x - s, 0); o.lineTo(x + s, 0); o.lineTo(x, l); o.fill(); }
      for (let i = 0; i < 14; i++) { const x = R() * w, s = 14 + R() * 24, l = 20 + R() * 60; o.fillStyle = 'hsl(250, 16%, ' + (9 + R() * 5) + '%)'; o.beginPath(); o.moveTo(x - s, h); o.lineTo(x + s, h); o.lineTo(x, h - l); o.fill(); }
      for (let i = 0; i < 16; i++) bg.deco.push({ kind: 'crystal', x: R() < .5 ? R() * w * .14 : w - R() * w * .14, y: R() * h, s: 8 + R() * 14, hue: R() < .5 ? 190 : 285, ph: R() * 10 });
    } else if (theme === 'turm') {
      const g = o.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0a0f24'); g.addColorStop(1, '#2a1d45');
      o.fillStyle = g; o.fillRect(0, 0, w, h);
      o.fillStyle = 'rgba(255, 244, 214, .9)'; o.beginPath(); o.arc(w * .84, h * .07, 20, 0, 7); o.fill();
      o.fillStyle = '#0a0f24'; o.beginPath(); o.arc(w * .81, h * .065, 18, 0, 7); o.fill();
      o.fillStyle = 'rgba(30, 24, 44, .85)'; o.fillRect(0, h * .1, w * .08, h); o.fillRect(w * .92, h * .1, w * .08, h);
      o.strokeStyle = 'rgba(255, 255, 255, .05)'; o.lineWidth = 10;
      for (let y = h; y > 0; y -= 70) { o.beginPath(); o.moveTo(w * .08, y); o.lineTo(w * .92, y - 35); o.stroke(); }
      for (let i = 0; i < 70; i++) bg.deco.push({ kind: 'star', x: R() * w, y: R() * h * .85, s: .6 + R() * 1.6, ph: R() * 10 });
    } else {
      o.fillStyle = '#18131f'; o.fillRect(0, 0, w, h);
      const bh = 26, bw = 54;
      for (let y = 0; y < h; y += bh) {
        for (let x = (y / bh) % 2 ? -bw / 2 : 0; x < w; x += bw) {
          o.fillStyle = 'hsl(265, 10%, ' + (11 + R() * 7) + '%)'; o.fillRect(x + 2, y + 2, bw - 4, bh - 4);
          if (R() < .12) { o.fillStyle = 'rgba(80, 110, 70, .25)'; o.fillRect(x + 2 + R() * bw * .5, y + bh - 8, 14, 6); }
        }
      }
      o.fillStyle = 'rgba(10, 8, 14, .45)'; o.fillRect(w * .1, 0, w * .8, h);
      for (let i = 0; i < 6; i++) bg.deco.push({ kind: 'torch', x: i % 2 ? w * .05 : w * .95, y: h * (.12 + Math.floor(i / 2) * .3), ph: R() * 10 });
    }
    bg.img = off;
  }
  function draw(now) {
    if (!bg || !bg.img) return;
    const { ctx, w, h } = bg, t = now / 1000;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(bg.img, 0, 0, w, h);
    for (const d of bg.deco) {
      if (d.kind === 'torch') {
        const f = calm ? 1 : 1 + .12 * Math.sin(t * 9 + d.ph) + .08 * Math.sin(t * 23 + d.ph * 2);
        const g = ctx.createRadialGradient(d.x, d.y, 2, d.x, d.y, 55 * f);
        g.addColorStop(0, 'rgba(255, 170, 70, .5)'); g.addColorStop(1, 'rgba(255, 170, 70, 0)');
        ctx.fillStyle = g; ctx.fillRect(d.x - 65, d.y - 65, 130, 130);
        ctx.fillStyle = '#5c3a1a'; ctx.fillRect(d.x - 2, d.y, 4, 16);
        ctx.fillStyle = 'rgba(255, 200, 90, .95)'; ctx.beginPath(); ctx.ellipse(d.x, d.y - 3, 4 * f, 8 * f, 0, 0, 7); ctx.fill();
      } else if (d.kind === 'crystal') {
        const a = calm ? .7 : .45 + .35 * Math.sin(t * 2 + d.ph);
        ctx.fillStyle = 'hsla(' + d.hue + ', 80%, 65%, ' + a + ')';
        ctx.shadowColor = 'hsl(' + d.hue + ', 90%, 60%)'; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.moveTo(d.x, d.y - d.s); ctx.lineTo(d.x + d.s * .45, d.y); ctx.lineTo(d.x, d.y + d.s * .5); ctx.lineTo(d.x - d.s * .45, d.y); ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, ' + (calm ? .7 : .35 + .55 * Math.abs(Math.sin(t * 1.3 + d.ph))) + ')';
        ctx.fillRect(d.x, d.y, d.s, d.s);
      }
    }
  }

  RM.fx = fx;
})(window.RM);
