// Spielinhalte: Charakterklassen, Gegenstände, Relikte
(function (RM) {
  'use strict';

  RM.CLASSES = {
    abenteurer: {
      name: 'Abenteurer', emoji: '🗡️', hp: 12, gold: 10, items: ['trank'], timeFactor: 1, goldFactor: 1,
      desc: 'Ausgeglichen. Startet mit einem Heiltrank.',
      unlock: null
    },
    magier: {
      name: 'Rechenmagier', emoji: '🧙', hp: 10, gold: 10, items: ['merkzettel', 'merkzettel'], timeFactor: 1.5, goldFactor: 1,
      desc: '50 % mehr Zeit pro Aufgabe, zwei Merkzettel, aber weniger Leben.',
      unlock: { text: 'Besiege einen Boss.', test: m => m.bossKills >= 1 }
    },
    ritter: {
      name: 'Ritter', emoji: '🛡️', hp: 15, gold: 0, items: ['amulett'], timeFactor: 1, goldFactor: 0.8,
      desc: 'Viele Lebenspunkte und ein Schutzamulett, aber weniger Gold.',
      unlock: { text: 'Sammle 150 Erfahrungspunkte.', test: m => m.xp >= 150 }
    },
    haendler: {
      name: 'Händler', emoji: '💰', hp: 11, gold: 50, items: [], timeFactor: 1, goldFactor: 1.5,
      desc: 'Startet mit 50 Gold, erhält 50 % mehr Gold und Rabatt beim Händler.',
      unlock: { text: 'Sammle 400 Erfahrungspunkte.', test: m => m.xp >= 400 }
    }
  };

  // Verbrauchsgegenstände (max. 3 im Rucksack)
  RM.ITEMS = {
    trank: { name: 'Heiltrank', emoji: '🧪', price: 20, desc: 'Heilt 3 Lebenspunkte.' },
    merkzettel: { name: 'Merkzettel', emoji: '📜', price: 12, desc: 'Zeigt im Kampf einen Tipp zur aktuellen Aufgabe.' },
    sanduhr: { name: 'Sanduhr', emoji: '⏳', price: 12, desc: 'Verdoppelt die Zeit für die aktuelle Aufgabe.' },
    amulett: { name: 'Schutzamulett', emoji: '🔰', price: 18, desc: 'Der nächste Fehler kostet keine Lebenspunkte.' }
  };

  // Relikte (dauerhaft für den laufenden Durchgang)
  RM.RELICS = {
    kristallherz: { name: 'Kristallherz', emoji: '💎', desc: '+3 maximale Lebenspunkte.' },
    rechenschieber: { name: 'Rechenschieber', emoji: '🧮', desc: '25 % mehr Zeit für jede Aufgabe.' },
    goldbleistift: { name: 'Goldener Bleistift', emoji: '✏️', desc: '+2 Gold für jede richtige Antwort.' },
    phoenix: { name: 'Phönixfeder', emoji: '🪶', desc: 'Rettet dich einmal mit halben Lebenspunkten.' },
    lupe: { name: 'Lupe', emoji: '🔍', desc: 'Bei Auswahlaufgaben wird eine falsche Antwort ausgeblendet.' },
    kompass: { name: 'Kompass', emoji: '🧭', desc: 'Nach jedem gewonnenen Kampf +1 zusätzlicher Lebenspunkt.' },
    eule: { name: 'Eulenfeder', emoji: '🦉', desc: 'Der erste Fehler in jedem Kampf kostet keine Lebenspunkte.' }
  };
})(window.RM);
