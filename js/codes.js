// Nachweis-Codes für Hausaufgaben: Nach jedem Boss erhält man einen Code, den die Lehrkraft prüfen kann.
// Ein Code hängt ab von Thema, Ebene, Gütestufe, Kürzel, Aufgabenschlüssel und dem Geheimwort in js/config.js.
// Aufbau: <Themenkürzel><Ebene><Stufe>-<6 Prüfzeichen>, z. B. FK2S-KX7M4Q
(function (RM) {
  'use strict';

  // Ohne leicht verwechselbare Zeichen (0/O, 1/I/L)
  const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const LEN = 6;

  const STUFEN = {
    G: { name: 'Gold', emoji: '🥇', text: 'höchstens 1 Fehler im Bosskampf' },
    S: { name: 'Silber', emoji: '🥈', text: 'höchstens 3 Fehler im Bosskampf' },
    B: { name: 'Bronze', emoji: '🥉', text: 'Boss besiegt' }
  };
  const stufeFor = fehler => (fehler <= 1 ? 'G' : fehler <= 3 ? 'S' : 'B');

  // Kürzel: Groß-/Kleinschreibung, Leerzeichen und Umlaute spielen keine Rolle („Lea M.“ = „leam“)
  const normKuerzel = s => String(s || '').toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]/g, '');
  const normSchluessel = s => String(s || '').toUpperCase().replace(/Ä/g, 'AE').replace(/Ö/g, 'OE').replace(/Ü/g, 'UE').replace(/[^A-Z0-9]/g, '');

  // 53-Bit-Prüfsumme (cyrb53) – kein kryptografischer Schutz, aber für einen Hausaufgaben-Nachweis ausreichend
  function hash(str, seed) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  }
  function check(prefix, kuerzel, schluessel) {
    const secret = String((RM.CONFIG && RM.CONFIG.codeGeheimwort) || '');
    let n = hash([secret, prefix, normKuerzel(kuerzel), normSchluessel(schluessel)].join('|'), 7);
    let out = '';
    for (let i = 0; i < LEN; i++) { out += ALPHA[n % ALPHA.length]; n = Math.floor(n / ALPHA.length); }
    return out;
  }

  const topicPrefix = tp => tp.codePrefix || tp.id.replace(/[^a-z]/gi, '').slice(0, 2).toUpperCase();

  // floor: Index der Ebene (0, 1, 2 …), stufe: 'G' | 'S' | 'B'
  function make(topicId, floor, stufe, kuerzel, schluessel) {
    const prefix = topicPrefix(RM.getTopic(topicId)) + (floor + 1) + stufe;
    return prefix + '-' + check(prefix, kuerzel, schluessel);
  }

  // Liefert { ok, topic, floor, stufe } oder { ok: false, why }
  function verify(code, kuerzel, schluessel) {
    const c = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const m = /^([A-Z]{2})(\d)([GSB])([A-Z0-9]{6})$/.exec(c);
    if (!m) return { ok: false, why: 'Kein gültiges Format' };
    const tp = RM.topics.find(t => topicPrefix(t) === m[1]);
    if (!tp) return { ok: false, why: 'Unbekanntes Thema' };
    const floor = +m[2] - 1;
    if (floor < 0 || floor >= tp.floors.length) return { ok: false, why: 'Diese Ebene gibt es nicht' };
    if (check(m[1] + m[2] + m[3], kuerzel, schluessel) !== m[4]) return { ok: false, why: 'Code passt nicht zu Kürzel und Schlüssel' };
    return { ok: true, topic: tp, floor, stufe: m[3] };
  }

  // Sammelprüfung: eine Zeile pro Schüler, z. B. „leam  FK1G-ABCDEF FK2S-…“ (Trenner: Leerzeichen, Tab, ; oder ,)
  function verifyList(text, schluessel) {
    return String(text || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(line => {
      const parts = line.split(/[\s;,]+/).filter(Boolean);
      const codes = parts.filter(p => /^[A-Za-z]{2}\d[GSBgsb]-?[A-Za-z0-9]{6}$/.test(p));
      const kuerzel = parts.filter(p => !codes.includes(p)).join(' ');
      return { line, kuerzel, results: codes.map(code => Object.assign({ code }, verify(code, kuerzel, schluessel))) };
    });
  }

  RM.codes = { STUFEN, stufeFor, make, verify, verifyList, normKuerzel, normSchluessel, topicPrefix };
})(window.RM);
