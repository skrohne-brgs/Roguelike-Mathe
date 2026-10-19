// Spielfiguren als Vektorgrafik (SVG), ohne externe Dateien.
// Helm bzw. Kapuze: neutrale Figuren, mit denen sich alle identifizieren können.
// Jede Figur hat zwei Laufbilder (frame 0/1).
(function (RM) {
  'use strict';
  const OUT = '#1b1724';

  // Beine/Füße für das Laufbild: abwechselnd angehoben
  const legs = (f, color, boot) => {
    const a = f ? 3 : 0, b = f ? 0 : 3;
    return '<rect x="24" y="' + (44 - a) + '" width="7" height="13" rx="2" fill="' + color + '"/>' +
      '<rect x="33" y="' + (44 - b) + '" width="7" height="13" rx="2" fill="' + color + '"/>' +
      '<rect x="22" y="' + (55 - a) + '" width="10" height="6" rx="2" fill="' + boot + '"/>' +
      '<rect x="32" y="' + (55 - b) + '" width="10" height="6" rx="2" fill="' + boot + '"/>';
  };

  const BODIES = {
    // Kämpfer: Helm mit Visier und Federbusch, Schwert und Rundschild
    abenteurer: f => legs(f, '#4a4458', '#5b3a1a') +
      '<path d="M46 41 L55 9 L59 10 L50 42 Z" fill="#e8edf3"/>' +
      '<path d="M43 40 L53 36 L54 39 L44 43 Z" fill="#f2c94c"/>' +
      '<path d="M20 30 Q32 24 44 30 L45 47 Q32 51 19 47 Z" fill="#3f6fd8"/>' +
      '<rect x="19" y="41" width="26" height="5" fill="#6b4a2b"/>' +
      '<rect x="29.5" y="40.5" width="5" height="6" fill="#f2c94c"/>' +
      '<rect x="42" y="30" width="7" height="13" rx="3" fill="#8a94a6"/>' +
      '<circle cx="17" cy="39" r="11" fill="#9a6332"/>' +
      '<circle cx="17" cy="39" r="8.5" fill="none" stroke="#f2c94c" stroke-width="2"/>' +
      '<circle cx="17" cy="39" r="2.8" fill="#f2c94c"/>' +
      '<path d="M20 22 Q20 6 32 6 Q44 6 44 22 L44 28 Q32 31 20 28 Z" fill="#c9d1dc"/>' +
      '<rect x="23" y="17" width="18" height="4" rx="1.5" fill="#2a2533"/>' +
      '<path d="M31 6 Q35 -2 46 3 Q39 4 36 9 Z" fill="#e04f4f"/>' +
      '<path d="M25 11 Q28 8.5 31 8.5" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2"/>',

    // Rechenmagier: Robe, spitzer Hut mit Stern, Stab mit leuchtender Kugel
    magier: f => {
      const a = f ? 2 : 0, b = f ? 0 : 2;
      return '<ellipse cx="26" cy="' + (60 - a) + '" rx="5" ry="2.5" fill="#2b2533"/><ellipse cx="38" cy="' + (60 - b) + '" rx="5" ry="2.5" fill="#2b2533"/>' +
        '<path d="M48 61 L50 15" stroke="#7a4b23" stroke-width="3.5" stroke-linecap="round"/>' +
        '<circle cx="50" cy="12" r="6" fill="#6ad6ff"/><circle cx="48.5" cy="10.5" r="2" fill="#fff" stroke="none"/>' +
        '<path d="M18 59 L24 27 Q32 23 40 27 L46 59 Q32 62 18 59 Z" fill="#6b3fa0"/>' +
        '<path d="M32 27 L32 59" stroke="#4b2a78" stroke-width="2"/>' +
        '<path d="M23 42 Q32 45 41 42" fill="none" stroke="#f2c94c" stroke-width="2.5"/>' +
        '<circle cx="46" cy="37" r="4" fill="#6b3fa0"/>' +
        '<circle cx="32" cy="25" r="9" fill="#2a1f3a"/>' +
        '<ellipse cx="28.5" cy="25.5" rx="1.8" ry="2.2" fill="#ffe066" stroke="none"/><ellipse cx="35.5" cy="25.5" rx="1.8" ry="2.2" fill="#ffe066" stroke="none"/>' +
        '<ellipse cx="32" cy="18" rx="17" ry="4" fill="#4b2a78"/>' +
        '<path d="M22 18 Q29 9 40 1 Q37 9 42 18 Z" fill="#5a3290"/>' +
        '<path d="M33.5 9 l1.2 2.6 2.8.3 -2.1 1.9 .6 2.8 -2.5-1.4 -2.5 1.4 .6-2.8 -2.1-1.9 2.8-.3 Z" fill="#f2c94c" stroke="none"/>';
    },

    // Ritter: Topfhelm, Plattenrüstung, großer Schild mit Gleichheitszeichen
    ritter: f => legs(f, '#8a94a6', '#4a4458') +
      '<path d="M47 52 L50 22 L53 22 L52 52 Z" fill="#e8edf3"/>' +
      '<rect x="45" y="20" width="12" height="3.5" rx="1" fill="#f2c94c"/>' +
      '<path d="M19 30 Q32 23 45 30 L46 47 Q32 52 18 47 Z" fill="#b8c1cf"/>' +
      '<path d="M28 27 L36 27 L36 49 L28 49 Z" fill="#c0392b"/>' +
      '<rect x="18" y="42" width="28" height="4" fill="#6b4a2b"/>' +
      '<rect x="43" y="30" width="7" height="12" rx="3" fill="#8a94a6"/>' +
      '<path d="M6 27 L28 27 L28 42 Q17 59 6 42 Z" fill="#2c4f9e"/>' +
      '<path d="M8.5 29.5 L25.5 29.5 L25.5 41.5 Q17 55 8.5 41.5 Z" fill="none" stroke="#f2c94c" stroke-width="2"/>' +
      '<rect x="11" y="34" width="12" height="3" fill="#fff" stroke="none"/><rect x="11" y="40" width="12" height="3" fill="#fff" stroke="none"/>' +
      '<rect x="21" y="5" width="22" height="23" rx="5" fill="#b8c1cf"/>' +
      '<rect x="23" y="14" width="18" height="3" fill="#2a2533"/><rect x="30.5" y="14" width="3" height="10" fill="#2a2533"/>' +
      '<path d="M25 9 Q28 7 32 7" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2"/>',

    // Händler: Kapuzenmantel, Rucksack, Laterne und Münzbeutel
    haendler: f => legs(f, '#4a4458', '#5b3a1a') +
      '<rect x="12" y="27" width="12" height="20" rx="3" fill="#8a5a2b"/>' +
      '<rect x="12" y="33" width="12" height="3" fill="#5b3a1a"/>' +
      '<path d="M50 30 L50 40" stroke="#4a4458" stroke-width="2"/>' +
      '<rect x="45" y="40" width="10" height="12" rx="2" fill="#f2c94c"/>' +
      '<rect x="47.5" y="42.5" width="5" height="7" rx="1" fill="#fff3c4" stroke="none"/>' +
      '<path d="M19 30 Q32 23 45 30 L46 50 Q32 54 18 50 Z" fill="#3f8f5a"/>' +
      '<rect x="18" y="42" width="28" height="4" fill="#6b4a2b"/>' +
      '<circle cx="27" cy="49" r="4.5" fill="#f2c94c"/>' +
      '<rect x="42" y="30" width="7" height="12" rx="3" fill="#3f8f5a"/>' +
      '<path d="M19 26 Q19 6 32 6 Q45 6 45 26 Q32 31 19 26 Z" fill="#2f7a4a"/>' +
      '<ellipse cx="32" cy="21" rx="8.5" ry="7" fill="#1d2a22"/>' +
      '<ellipse cx="28.8" cy="21.5" rx="1.7" ry="2" fill="#ffe066" stroke="none"/><ellipse cx="35.2" cy="21.5" rx="1.7" ry="2" fill="#ffe066" stroke="none"/>'
  };

  const svg = (id, f = 0) => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g stroke="' + OUT + '" stroke-width="2" stroke-linejoin="round">' +
    (BODIES[id] || BODIES.abenteurer)(f) + '</g></svg>';

  const urls = {}, imgs = {};
  const url = (id, f = 0) => {
    const k = id + f;
    return urls[k] || (urls[k] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg(id, f)));
  };
  // Bild für Canvas (wird beim ersten Aufruf geladen)
  const image = (id, f = 0) => {
    const k = id + f;
    if (!imgs[k]) { imgs[k] = new Image(); imgs[k].src = url(id, f); }
    return imgs[k];
  };

  RM.sprites = {
    has: id => !!BODIES[id],
    svg, url, image,
    html: (id, size, cls = '') => '<img class="sprite ' + cls + '" src="' + url(id) + '" width="' + size + '" height="' + size + '" alt="">',
    preload: () => Object.keys(BODIES).forEach(id => { image(id, 0); image(id, 1); })
  };
  if (typeof Image !== 'undefined') RM.sprites.preload();
})(window.RM);
