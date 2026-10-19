// Gegner als Vektorgrafik (SVG) im Stil der Spielfiguren – mit kleinen Mathe-Details.
(function (RM) {
  'use strict';
  const reg = RM.sprites.register;
  const eye = (x, y, r = 2.6, c = '#ffe066') => '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + c + '"/><circle cx="' + (x + .5) + '" cy="' + (y + .5) + '" r="' + r * .4 + '" fill="#1b1724" stroke="none"/>';
  // Linie mit dunkler Kontur (für Schwänze, Hälse, Beine)
  const tube = (d, color, w) => '<path d="' + d + '" fill="none" stroke="#1b1724" stroke-width="' + (w + 4) + '" stroke-linecap="round"/><path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="' + w + '" stroke-linecap="round"/>';
  const txt = (x, y, size, color, t, extra = '') => '<text x="' + x + '" y="' + y + '" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="' + size + '" fill="' + color + '" stroke="none" ' + extra + '>' + t + '</text>';

  // ---------------- Ebene 1: Katakomben der Terme ----------------
  reg('fledermaus', () =>
    '<path d="M24 30 Q12 16 2 24 Q8 28 6 35 Q12 31 15 37 Q18 31 24 35 Z" fill="#4a3470"/>' +
    '<path d="M40 30 Q52 16 62 24 Q56 28 58 35 Q52 31 49 37 Q46 31 40 35 Z" fill="#4a3470"/>' +
    '<path d="M25 25 L23 13 L30 20 Z" fill="#5b3f86"/><path d="M39 25 L41 13 L34 20 Z" fill="#5b3f86"/>' +
    '<ellipse cx="32" cy="33" rx="10" ry="12" fill="#5b3f86"/>' +
    '<path d="M28.5 36.5 L35.5 43.5 M35.5 36.5 L28.5 43.5" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>' +
    eye(28, 28) + eye(36, 28) +
    '<path d="M29.5 32 L30.5 35 L31.5 32 Z M32.5 32 L33.5 35 L34.5 32 Z" fill="#fff" stroke-width="1"/>' +
    '<path d="M28 45 L27 49 M36 45 L37 49" stroke-width="2.5" stroke-linecap="round"/>');

  reg('ratte', () =>
    tube('M16 47 Q4 45 6 35 Q8 27 5 22', '#c48b9f', 3) +
    '<path d="M1 21 L9 21 M5 17 L5 25" stroke="#f2c94c" stroke-width="3" stroke-linecap="round"/>' +
    '<rect x="20" y="51" width="6" height="8" rx="2" fill="#6f6a7d"/><rect x="34" y="51" width="6" height="8" rx="2" fill="#6f6a7d"/>' +
    '<ellipse cx="30" cy="45" rx="16" ry="11" fill="#8a8496"/>' +
    '<circle cx="42" cy="31" r="5.5" fill="#c48b9f"/>' +
    '<path d="M37 37 Q46 27 59 40 Q51 48 40 47 Z" fill="#9b95a8"/>' +
    '<circle cx="47" cy="37.5" r="2.4" fill="#1b1724" stroke="none"/><circle cx="47.7" cy="36.8" r=".9" fill="#fff" stroke="none"/>' +
    '<circle cx="58.5" cy="40" r="2.2" fill="#e57399"/>' +
    '<path d="M54 42.5 L62 44 M54 43.5 L61 47.5" stroke-width="1"/>');

  reg('skelett', () =>
    '<path d="M28 46 L26 60 M36 46 L38 60" stroke="#1b1724" stroke-width="6.5" stroke-linecap="round"/><path d="M28 46 L26 60 M36 46 L38 60" stroke="#e9e4d8" stroke-width="3.5" stroke-linecap="round"/>' +
    '<rect x="25" y="42" width="14" height="6" rx="3" fill="#e9e4d8"/>' +
    '<rect x="30" y="25" width="4" height="18" fill="#e9e4d8"/>' +
    '<path d="M24 30 Q32 27 40 30 M24 35 Q32 32 40 35 M25 40 Q32 37 39 40" fill="none" stroke="#1b1724" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M24 30 Q32 27 40 30 M24 35 Q32 32 40 35 M25 40 Q32 37 39 40" fill="none" stroke="#e9e4d8" stroke-width="2.6" stroke-linecap="round"/>' +
    tube('M24 29 L16 41', '#e9e4d8', 3) + tube('M40 29 L47 37', '#e9e4d8', 3) +
    '<rect x="44" y="30" width="17" height="13" rx="1.5" fill="#2f4f3f"/>' +
    '<path d="M48.5 35 L56.5 35 M48.5 39 L56.5 39" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>' +
    '<rect x="27" y="20" width="10" height="7" rx="2" fill="#f3efe4"/>' +
    '<circle cx="32" cy="15" r="10" fill="#f3efe4"/>' +
    '<circle cx="28" cy="15" r="3" fill="#2a2533"/><circle cx="36" cy="15" r="3" fill="#2a2533"/>' +
    '<circle cx="28" cy="15" r="1.1" fill="#6ad6ff" stroke="none"/><circle cx="36" cy="15" r="1.1" fill="#6ad6ff" stroke="none"/>' +
    '<path d="M29 23 L29 26 M32 23 L32 26 M35 23 L35 26" stroke-width="1.2"/>');

  reg('schleim', () =>
    '<path d="M9 56 Q7 36 20 26 Q32 15 44 26 Q57 36 55 56 Q32 61 9 56 Z" fill="#4cc38a"/>' +
    '<ellipse cx="20" cy="33" rx="3.5" ry="6" fill="#d3f8e4" stroke="none" opacity=".85"/>' +
    '<circle cx="26" cy="36" r="5" fill="#fff"/><circle cx="38" cy="36" r="5" fill="#fff"/>' +
    '<circle cx="27" cy="37" r="2.2" fill="#1b1724" stroke="none"/><circle cx="39" cy="37" r="2.2" fill="#1b1724" stroke="none"/>' +
    '<path d="M28 44 Q32 47 36 44" fill="none" stroke-width="2" stroke-linecap="round"/>' +
    txt(32, 56, 11, '#2c8a5c', '7'));

  // Elitegegner: Mumie mit Laterne
  reg('mumie', () =>
    '<rect x="8" y="31" width="14" height="7" rx="3" fill="#e3d6b5"/><rect x="42" y="31" width="14" height="7" rx="3" fill="#e3d6b5"/>' +
    '<path d="M52 38 L52 44" stroke-width="2"/><rect x="48" y="44" width="9" height="11" rx="2" fill="#f2c94c"/><rect x="50.5" y="46.5" width="4" height="6" fill="#fff3c4" stroke="none"/>' +
    '<path d="M20 61 L20 24 Q20 9 32 9 Q44 9 44 24 L44 61 Z" fill="#e3d6b5"/>' +
    '<path d="M20 19 L44 26 M20 31 L44 35 M20 41 L44 38 M20 49 L44 53 M20 56 L44 59" stroke="#b8a77f" stroke-width="2"/>' +
    '<rect x="23" y="19" width="18" height="7" rx="2" fill="#2a2533"/>' +
    '<circle cx="28" cy="22.5" r="2.2" fill="#7cfc9a" stroke="none"/><circle cx="36" cy="22.5" r="2.2" fill="#7cfc9a" stroke="none"/>' +
    '<path d="M44 44 Q50 48 47 54" fill="none" stroke="#e3d6b5" stroke-width="3"/>');

  // Boss: Termtroll mit Keule
  reg('termtroll', () =>
    '<rect x="19" y="49" width="10" height="12" rx="3" fill="#3f7d4a"/><rect x="35" y="49" width="10" height="12" rx="3" fill="#3f7d4a"/>' +
    tube('M45 42 L53 22', '#6b4a2b', 4) +
    '<path d="M49 22 L56 4 Q63 5 62 12 L55 26 Z" fill="#8a5a2b"/>' +
    '<circle cx="56" cy="10" r="1.3" fill="#5b3a1a" stroke="none"/><circle cx="54" cy="17" r="1.3" fill="#5b3a1a" stroke="none"/>' +
    '<rect x="5" y="28" width="9" height="21" rx="4" fill="#4f9a5a"/>' +
    '<path d="M11 50 Q9 29 22 24 L42 24 Q55 29 53 50 Q32 56 11 50 Z" fill="#4f9a5a"/>' +
    '<ellipse cx="32" cy="40" rx="11" ry="8" fill="#8fd19a" stroke="none"/>' +
    '<text x="32" y="45" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-weight="700" font-size="13" fill="#2f6b3a" stroke="none">x²</text>' +
    '<path d="M13 48 Q32 54 51 48 L51 52 Q32 58 13 52 Z" fill="#7a4b23"/>' +
    '<rect x="44" y="27" width="9" height="15" rx="4" fill="#4f9a5a"/>' +
    '<path d="M21 12 Q14 4 17 0 Q22 5 26 9 Z" fill="#e9e4d8"/><path d="M43 12 Q50 4 47 0 Q42 5 38 9 Z" fill="#e9e4d8"/>' +
    '<ellipse cx="32" cy="17" rx="13" ry="11" fill="#5fae6a"/>' +
    '<path d="M24 12 L30 14 M40 12 L34 14" stroke-width="2.5" stroke-linecap="round"/>' +
    eye(27, 16, 2.6, '#ffcf3a') + eye(37, 16, 2.6, '#ffcf3a') +
    '<path d="M25 22 Q32 27 39 22 Z" fill="#2a2533"/>' +
    '<path d="M26 22.5 L27 19 L28.5 23 Z M38 22.5 L37 19 L35.5 23 Z" fill="#fff" stroke-width="1"/>');

  // ---------------- Ebene 2: Klammerhöhlen ----------------
  // Körper als Klammerpaar ( )
  reg('schlange', () =>
    tube('M22 58 Q8 47 22 36', '#2a9d8f', 8) + tube('M40 58 Q54 47 40 36', '#2a9d8f', 8) + tube('M22 58 Q31 62 40 58', '#2a9d8f', 8) +
    tube('M40 36 Q34 26 40 16', '#2a9d8f', 7) +
    '<path d="M48 13 L55 12 M55 12 L58 9 M55 12 L58 14" stroke="#e04f4f" stroke-width="1.8" stroke-linecap="round"/>' +
    '<ellipse cx="42" cy="13" rx="8" ry="6" fill="#36b5a5"/>' +
    '<ellipse cx="44" cy="11" rx="1.8" ry="2.4" fill="#ffe066"/><rect x="43.6" y="9.5" width=".9" height="3" fill="#1b1724" stroke="none"/>' +
    '<circle cx="16" cy="47" r="1.6" fill="#f2c94c" stroke="none"/><circle cx="48" cy="47" r="1.6" fill="#f2c94c" stroke="none"/><circle cx="31" cy="60" r="1.6" fill="#f2c94c" stroke="none"/>');

  // Minus auf dem Rücken
  reg('skorpion', () =>
    '<path d="M22 50 L14 58 M28 52 L24 60 M36 52 L38 60 M40 50 L46 58" stroke-width="2.5" stroke-linecap="round"/>' +
    '<circle cx="14" cy="40" r="4.5" fill="#d9622b"/><circle cx="12" cy="31" r="4.5" fill="#d9622b"/><circle cx="15" cy="23" r="4.5" fill="#d9622b"/><circle cx="21" cy="17" r="4.5" fill="#d9622b"/><circle cx="28" cy="15" r="4" fill="#d9622b"/>' +
    '<path d="M31 11 L38 8 L34 17 Z" fill="#2a2533"/>' +
    '<ellipse cx="31" cy="46" rx="14" ry="8" fill="#d9622b"/>' +
    '<rect x="25" y="44" width="11" height="3.6" rx="1.6" fill="#fff" stroke="none"/>' +
    tube('M43 44 L50 38', '#d9622b', 3) +
    '<path d="M48 36 Q54 28 61 32 L55 35 L60 39 Q53 42 48 36 Z" fill="#e8743b"/>' +
    '<circle cx="42" cy="43" r="1.3" fill="#1b1724" stroke="none"/><circle cx="43" cy="47" r="1.3" fill="#1b1724" stroke="none"/>');

  // Plus-Minus auf dem Körper
  reg('geist', () =>
    '<path d="M14 58 L14 28 Q14 8 32 8 Q50 8 50 28 L50 58 L44 53 L38 58 L32 53 L26 58 L20 53 Z" fill="#eef1ff"/>' +
    '<path d="M14 34 Q6 34 7 40 M50 34 Q58 34 57 40" fill="none" stroke-width="2.5" stroke-linecap="round"/>' +
    '<ellipse cx="26" cy="25" rx="3" ry="4" fill="#2a2533"/><ellipse cx="38" cy="25" rx="3" ry="4" fill="#2a2533"/>' +
    '<ellipse cx="32" cy="33" rx="2.5" ry="3" fill="#2a2533"/>' +
    '<circle cx="21" cy="31" r="2.2" fill="#ffb3c7" stroke="none"/><circle cx="43" cy="31" r="2.2" fill="#ffb3c7" stroke="none"/>' +
    '<path d="M27 41 L37 41 M32 36.5 L32 45.5 M27 49 L37 49" stroke="#6a7bd8" stroke-width="2.6" stroke-linecap="round"/>');

  reg('spinne', () =>
    '<path d="M4 4 L60 60 M60 4 L4 60 M32 0 L32 64 M0 32 L64 32" stroke="#d6d0e6" stroke-opacity=".35" stroke-width="1"/>' +
    '<path d="M24 36 Q12 24 5 30 M24 40 Q10 36 4 44 M25 44 Q14 48 9 57 M27 47 Q22 54 19 62 M40 36 Q52 24 59 30 M40 40 Q54 36 60 44 M39 44 Q50 48 55 57 M37 47 Q42 54 45 62" fill="none" stroke="#1b1724" stroke-width="3.5" stroke-linecap="round"/>' +
    '<ellipse cx="32" cy="41" rx="11" ry="10" fill="#3b2f52"/>' +
    '<path d="M28 37 L36 45 M36 37 L28 45" stroke="#e04f4f" stroke-width="2.5" stroke-linecap="round"/>' +
    '<circle cx="32" cy="28" r="7.5" fill="#4a3d66"/>' +
    '<circle cx="29" cy="27" r="1.8" fill="#ff5a5a" stroke="none"/><circle cx="35" cy="27" r="1.8" fill="#ff5a5a" stroke="none"/><circle cx="30.5" cy="23.8" r="1.1" fill="#ff5a5a" stroke="none"/><circle cx="33.5" cy="23.8" r="1.1" fill="#ff5a5a" stroke="none"/>');

  // Elitegegner: Steinwächter mit Klammer-Runen
  reg('steinwaechter', () =>
    '<rect x="18" y="50" width="11" height="11" rx="2" fill="#6d7280"/><rect x="35" y="50" width="11" height="11" rx="2" fill="#6d7280"/>' +
    '<rect x="4" y="22" width="11" height="24" rx="3" fill="#7d8291"/><rect x="49" y="22" width="11" height="24" rx="3" fill="#7d8291"/>' +
    '<rect x="13" y="12" width="38" height="40" rx="6" fill="#8b8f99"/>' +
    '<path d="M16 18 Q22 14 26 18 Q22 20 16 18 Z M40 46 Q46 42 49 46 Q44 49 40 46 Z" fill="#5e8f4a" stroke="none"/>' +
    '<rect x="20" y="20" width="24" height="8" rx="2" fill="#4a4f5c"/>' +
    '<circle cx="27" cy="24" r="2.4" fill="#6ad6ff" stroke="none"/><circle cx="37" cy="24" r="2.4" fill="#6ad6ff" stroke="none"/>' +
    txt(32, 45, 14, '#6ad6ff', '( )') +
    '<path d="M22 32 L25 36 M42 31 L39 35" stroke-width="1.5"/>');

  // Boss: dreiköpfige Klammerhydra
  reg('hydra', () =>
    tube('M22 46 Q12 34 14 20', '#2f8f7a', 7) + tube('M32 44 Q32 26 32 13', '#2f8f7a', 7) + tube('M42 46 Q52 34 50 20', '#2f8f7a', 7) +
    '<path d="M8 61 Q10 44 32 41 Q54 44 56 61 Z" fill="#2f8f7a"/>' +
    '<path d="M20 58 Q32 50 44 58" fill="none" stroke="#7fd6c2" stroke-width="2"/>' +
    txt(32, 56, 9, '#f2c94c', '( ) [ ]') +
    ['14,18', '32,11', '50,18'].map(p => {
      const [x, y] = p.split(',').map(Number);
      return '<path d="M' + (x - 5) + ' ' + (y - 4) + ' L' + (x - 7) + ' ' + (y - 10) + ' L' + (x - 2) + ' ' + (y - 6) + ' Z M' + (x + 5) + ' ' + (y - 4) + ' L' + (x + 7) + ' ' + (y - 10) + ' L' + (x + 2) + ' ' + (y - 6) + ' Z" fill="#e9e4d8" stroke-width="1.2"/>' +
        '<ellipse cx="' + x + '" cy="' + y + '" rx="7.5" ry="6" fill="#3aa88f"/>' +
        '<circle cx="' + (x - 2.8) + '" cy="' + (y - 1) + '" r="1.7" fill="#ff5a5a" stroke="none"/><circle cx="' + (x + 2.8) + '" cy="' + (y - 1) + '" r="1.7" fill="#ff5a5a" stroke="none"/>' +
        '<path d="M' + (x - 3) + ' ' + (y + 3) + ' L' + (x + 3) + ' ' + (y + 3) + '" stroke-width="1.5"/>';
    }).join(''));

  // ---------------- Ebene 3: Turm der Gleichungen ----------------
  reg('kobold', () =>
    '<path d="M48 54 L48 24 M39 24 L57 24" stroke="#1b1724" stroke-width="4.5" stroke-linecap="round"/><path d="M48 54 L48 24 M39 24 L57 24" stroke="#f2c94c" stroke-width="2.2" stroke-linecap="round"/>' +
    '<path d="M36 30 Q39 35 42 30 Z M54 30 Q57 35 60 30 Z" fill="#f2c94c"/>' +
    '<path d="M36 24 L39 30 M42 24 L39 30 M54 24 L57 30 M60 24 L57 30" stroke-width="1"/>' +
    '<rect x="25" y="52" width="6" height="8" rx="2" fill="#7a2a20"/><rect x="33" y="52" width="6" height="8" rx="2" fill="#7a2a20"/>' +
    '<path d="M22 54 L24 36 Q32 32 40 36 L42 54 Z" fill="#c0392b"/>' +
    '<rect x="39" y="38" width="10" height="6" rx="3" fill="#e05a4a"/>' +
    '<path d="M22 24 L6 18 L20 30 Z M42 24 L58 18 L44 30 Z" fill="#e05a4a"/>' +
    '<circle cx="32" cy="26" r="11" fill="#e05a4a"/>' +
    eye(28, 24, 2.4) + eye(36, 24, 2.4) +
    '<path d="M27 30 Q32 34 37 30" fill="#2a2533"/><path d="M29 30.5 L30 32.5 L31 31 M33 31 L34 32.5 L35 30.5" fill="#fff" stroke-width=".8"/>');

  // Spiegel mit Gesicht – zeigt Rechnungen verkehrt
  reg('spiegel', () =>
    '<path d="M24 60 L40 60 L36 52 L28 52 Z" fill="#b8892b"/>' +
    '<ellipse cx="32" cy="29" rx="19" ry="24" fill="#f2c94c"/>' +
    '<ellipse cx="32" cy="29" rx="14.5" ry="19.5" fill="#9fd3ff"/>' +
    '<path d="M22 18 L28 12 M21 24 L31 14" stroke="#fff" stroke-opacity=".8" stroke-width="2" stroke-linecap="round"/>' +
    '<ellipse cx="27" cy="27" rx="2.6" ry="3.4" fill="#2a3a5c"/><ellipse cx="37" cy="27" rx="2.6" ry="3.4" fill="#2a3a5c"/>' +
    '<path d="M25 37 Q28.5 34 32 37 Q35.5 40 39 37" fill="none" stroke="#2a3a5c" stroke-width="2" stroke-linecap="round"/>' +
    txt(32, 47, 8, '#2a3a5c', '2x = 6', 'opacity=".6" transform="translate(64 0) scale(-1 1)"'));

  // Eule mit Brille
  reg('eule', () =>
    '<path d="M24 58 L22 62 M28 58 L28 62 M36 58 L36 62 M40 58 L42 62" stroke="#e08a2b" stroke-width="2.5" stroke-linecap="round"/>' +
    '<ellipse cx="32" cy="40" rx="16" ry="19" fill="#8a5a2b"/>' +
    '<ellipse cx="32" cy="46" rx="10" ry="11" fill="#d9b48a" stroke="none"/>' +
    '<path d="M27 42 l2 2 2 -2 M33 46 l2 2 2 -2 M27 50 l2 2 2 -2" fill="none" stroke="#8a5a2b" stroke-width="1.4"/>' +
    '<path d="M18 26 L16 14 L25 22 Z M46 26 L48 14 L39 22 Z" fill="#7a4b23"/>' +
    '<circle cx="26" cy="29" r="6.5" fill="#fff"/><circle cx="38" cy="29" r="6.5" fill="#fff"/>' +
    '<circle cx="26" cy="29" r="3" fill="#e08a2b" stroke="none"/><circle cx="38" cy="29" r="3" fill="#e08a2b" stroke="none"/>' +
    '<circle cx="26" cy="29" r="1.4" fill="#1b1724" stroke="none"/><circle cx="38" cy="29" r="1.4" fill="#1b1724" stroke="none"/>' +
    '<circle cx="26" cy="29" r="7.2" fill="none" stroke="#f2c94c" stroke-width="1.8"/><circle cx="38" cy="29" r="7.2" fill="none" stroke="#f2c94c" stroke-width="1.8"/>' +
    '<path d="M33.2 29 L30.8 29" stroke="#f2c94c" stroke-width="1.8"/>' +
    '<path d="M30 34 L34 34 L32 38 Z" fill="#e08a2b"/>');

  // Wolf mit Gleichheitszeichen am Halsband
  reg('wolf', () =>
    '<path d="M18 42 Q12 61 22 61 L42 61 Q52 61 46 42 Z" fill="#7d8597"/>' +
    '<path d="M26 44 Q32 58 38 44 Z" fill="#c9ced8" stroke="none"/>' +
    '<path d="M18 26 L14 6 L27 17 Q32 15 37 17 L50 6 L46 26 Q46 41 32 45 Q18 41 18 26 Z" fill="#8f97a8"/>' +
    '<path d="M19 22 L17 11 L24 18 Z M45 22 L47 11 L40 18 Z" fill="#c48b9f" stroke="none"/>' +
    '<path d="M25 32 Q32 46 39 32 Q32 30 25 32 Z" fill="#d7dbe3"/>' +
    '<ellipse cx="32" cy="34" rx="3" ry="2.2" fill="#1b1724"/>' +
    eye(26, 25, 2.3, '#ffcf3a') + eye(38, 25, 2.3, '#ffcf3a') +
    '<path d="M22 44 Q32 49 42 44" fill="none" stroke="#c0392b" stroke-width="3"/>' +
    '<circle cx="32" cy="50" r="4.5" fill="#f2c94c"/>' +
    '<path d="M29.8 48.9 L34.2 48.9 M29.8 51.1 L34.2 51.1" stroke="#7a4b23" stroke-width="1.3"/>');

  // Elitegegner: lebende Waage
  reg('waage', () =>
    '<path d="M20 61 L44 61 L38 53 L26 53 Z" fill="#b8892b"/>' +
    '<rect x="29" y="22" width="6" height="32" fill="#d4a63a"/>' +
    '<path d="M8 20 L56 20" stroke="#1b1724" stroke-width="5.5" stroke-linecap="round"/><path d="M8 20 L56 20" stroke="#f2c94c" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M10 20 L5 34 M10 20 L15 34 M54 20 L49 34 M54 20 L59 34" stroke-width="1.2"/>' +
    '<path d="M3 34 Q10 40 17 34 Z M47 34 Q54 40 61 34 Z" fill="#f2c94c"/>' +
    txt(10, 33, 7, '#7a4b23', 'x') + txt(54, 33, 7, '#7a4b23', '7') +
    '<circle cx="32" cy="15" r="9" fill="#f2c94c"/>' +
    eye(28.5, 14, 2.2, '#fff') + eye(35.5, 14, 2.2, '#fff') +
    '<path d="M28.5 19 L35.5 19" stroke-width="1.8" stroke-linecap="round"/>');

  // Boss: Gleichungsgolem mit leuchtendem Gleichheitszeichen
  reg('golem', () =>
    '<rect x="16" y="50" width="12" height="12" rx="2" fill="#5a5f6c"/><rect x="36" y="50" width="12" height="12" rx="2" fill="#5a5f6c"/>' +
    '<rect x="1" y="22" width="12" height="28" rx="4" fill="#7d8291"/><rect x="51" y="22" width="12" height="28" rx="4" fill="#7d8291"/>' +
    '<rect x="2" y="46" width="10" height="9" rx="3" fill="#6d7280"/><rect x="52" y="46" width="10" height="9" rx="3" fill="#6d7280"/>' +
    '<rect x="11" y="19" width="42" height="34" rx="6" fill="#6d7280"/>' +
    '<path d="M16 26 L22 30 L19 36 M48 40 L44 44 L47 49" fill="none" stroke-width="1.5"/>' +
    '<rect x="22" y="31" width="20" height="4.5" rx="1.5" fill="#6ad6ff"/><rect x="22" y="40" width="20" height="4.5" rx="1.5" fill="#6ad6ff"/>' +
    '<rect x="21" y="3" width="22" height="17" rx="4" fill="#7d8291"/>' +
    '<rect x="24" y="9" width="16" height="5" rx="1.5" fill="#2a2533"/>' +
    '<circle cx="28.5" cy="11.5" r="1.8" fill="#6ad6ff" stroke="none"/><circle cx="35.5" cy="11.5" r="1.8" fill="#6ad6ff" stroke="none"/>');

  if (typeof Image !== 'undefined') RM.sprites.preload();
})(window.RM);
