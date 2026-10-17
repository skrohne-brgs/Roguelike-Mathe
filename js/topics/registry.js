// Themen-Register: Jedes Thema (z. B. "Terme & Gleichungen, Jg. 7") meldet sich hier an.
// Neue Themen werden als eigene Datei in js/topics/ angelegt und in index.html eingebunden.
(function (RM) {
  'use strict';
  const { Q, Poly, fmt, check, parse, toPoly } = RM.math;

  RM.topics = [];
  RM.registerTopic = topic => { RM.topics.push(topic); };
  RM.getTopic = id => RM.topics.find(t => t.id === id);

  RM.makeTask = (topic, skillId, d) => {
    const task = topic.skills[skillId].gen(d);
    task.skill = skillId;
    task.d = d;
    return task;
  };

  // ---------- Bausteine für Aufgaben-Generatoren ----------
  const T = {};

  // Term aus Markup-String berechnen: P('3(x+2) - x')
  T.P = s => toPoly(parse(s));

  // Zahl in Klammern, falls negativ: (−3)
  T.par = n => (n < 0 ? '(' + n + ')' : String(n));

  // Liste [[koeffizient, variablen], ...] zu Termstring, z. B. [[4,'x'],[-2,''],[1,'y']] → "4x - 2 + y"
  T.join = list => list.map(([c, v], i) => {
    const abs = Math.abs(c);
    const body = v === '' ? String(abs) : (abs === 1 ? v : abs + v);
    if (i === 0) return (c < 0 ? '-' : '') + body;
    return (c < 0 ? ' - ' : ' + ') + body;
  }).join('');

  // Setzt Werte in einen Termstring ein: subst('3x^2 - y', {x: -2, y: 4}) → "3*(-2)^2 - 4"
  T.subst = (s, vals) => {
    let out = '';
    for (const c of s) {
      if (c in vals) {
        const v = vals[c];
        const prev = out.replace(/\s+$/, '').slice(-1);
        if (/[0-9)]/.test(prev)) out += '*';
        out += v < 0 ? '(' + v + ')' : String(v);
      } else out += c;
    }
    return out;
  };

  T.step = (html, note) => '<div class="step">' + html + (note ? ' <span class="note">' + note + '</span>' : '') + '</div>';
  // Umformungsschritt einer Gleichung mit Notiz, z. B. eqStep('3x + 5', '20', '-5')
  T.eqStep = (lhs, rhs, note) => '<div class="step">' + fmt(lhs + ' = ' + rhs) +
    (note ? ' <span class="note">| ' + fmt(note) + '</span>' : '') + '</div>';

  T.valueTask = o => Object.assign({
    input: 'number', vars: o.var ? [o.var] : [], time: 45, steps: [], hint: '',
    check: check.value(o.answer, o.var),
    answerHtml: fmt((o.var ? o.var + ' = ' : '') + o.answer.toMarkup()),
    solutionInput: (o.var ? o.var + '=' : '') + o.answer.toInput()
  }, o);

  T.termTask = o => Object.assign({
    input: 'term', time: 60, steps: [], hint: '', mode: 'equiv',
    vars: o.answer.vars().length ? o.answer.vars() : ['x'],
    answerHtml: fmt(o.answer.toMarkup()),
    solutionInput: o.answer.toInput()
  }, o, { check: check.term(o.answer, o.mode || 'equiv') });

  // options: [{html, correct}] – wird gemischt
  T.choiceTask = o => {
    const opts = o.noShuffle ? o.options : R().shuffle(o.options);
    return Object.assign({ input: 'choice', time: 45, steps: [], hint: '' }, o, {
      choices: opts.map(x => x.html),
      correct: opts.findIndex(x => x.correct),
      answerHtml: o.options.find(x => x.correct).html
    });
  };
  function R() { return RM.rand; }

  // Verschiedene Terme als Antwortmöglichkeiten: Duplikate (auch gleichwertige) werden entfernt
  T.distinctTerms = (correct, wrongs, n = 3) => {
    const cp = T.P(correct);
    const out = [];
    for (const w of wrongs) {
      const wp = T.P(w);
      if (wp.eq(cp) || out.some(o => T.P(o).eq(wp))) continue;
      out.push(w);
      if (out.length === n) break;
    }
    return out;
  };

  T.Q = Q; T.Poly = Poly; T.fmt = fmt;
  RM.T = T;
})(window.RM);
