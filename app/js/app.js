import * as E from './engine.js';
import { BANK } from '../data/bank.js';
import { LESSONS, BELTS, TIERS } from './lessons.js';
import { Board, md } from './board.js';
import { sfx, confetti, fx } from './fx.js';

const $ = (s, r = document) => r.querySelector(s);
const app = $('#app');

// ================= storage (this browser only) =================
const KEY = 'sudoku-dojo-v1';
const fresh = () => ({
  xp: 0, streak: { n: 0, last: '' }, lessons: {}, gym: {}, solved: {}, best: {}, wins: {}, history: [],
  settings: { mistakes: true, peers: true, sound: true, quick: false }, game: null, rushBest: 0,
});
let S = load();
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || '{}'), f = fresh();
    return { ...f, ...d, settings: { ...f.settings, ...(d.settings || {}) }, streak: { ...f.streak, ...(d.streak || {}) } };
  } catch { return fresh(); }
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* storage full or blocked */ } }
fx.sound = S.settings.sound;

const today = () => new Date().toLocaleDateString('en-CA');
function award(xp, why) {
  S.xp += xp;
  const t = today(), y = new Date(Date.now() - 864e5).toLocaleDateString('en-CA');
  if (S.streak.last !== t) { S.streak.n = S.streak.last === y ? S.streak.n + 1 : 1; S.streak.last = t; }
  save();
  toast(`+${xp} XP${why ? ' · ' + why : ''}`, 'xp');
}

// ================= helpers =================
const shuffle = a => E.shuffle(a.slice());
const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const beltOf = id => BELTS.find(b => b.id === id);
const lessonDone = t => !!S.lessons[t]?.done;
const beltsEarned = () => BELTS.filter(b => b.lessons.every(lessonDone));
const nextLesson = () => E.TECH_ORDER.find(t => !lessonDone(t));
const beltForTech = t => BELTS.find(b => b.lessons.includes(t));
const stars = n => '★'.repeat(n) + '☆'.repeat(3 - n);

function toast(msg, kind = '') {
  const el = $('#toast');
  const t = document.createElement('div');
  t.className = 'toast ' + kind;
  t.innerHTML = md(msg);
  while (el.children.length >= 2) el.firstChild.remove();
  el.appendChild(t);
  setTimeout(() => t.classList.add('out'), 1900);
  setTimeout(() => t.remove(), 2300);
}

function posState(pos) {
  const grid = E.parse(pos.g), cands = E.basicCandidates(grid);
  for (const k of pos.x) cands[(k / 10) | 0] &= ~E.bit(k % 10);
  return { grid, cands, sol: E.parse(pos.s) };
}

function overlay(html, onMount) {
  const o = document.createElement('div');
  o.className = 'overlay';
  o.innerHTML = `<div class="sheet pop-in">${html}</div>`;
  document.body.appendChild(o);
  const close = () => { o.classList.add('out'); setTimeout(() => o.remove(), 200); };
  onMount?.(o, close);
  return close;
}

// keyboard goes to whichever board is active
let active = null;
let timers = [];
const clearTimers = () => { timers.forEach(clearInterval); timers = []; };
document.addEventListener('keydown', e => {
  if (!active || e.target.closest('input,textarea') || document.querySelector('.overlay')) return;
  active.key?.(e);
});

function numpad(n, label = '') {
  let h = `<div class="numpad n${n}">`;
  for (let d = 1; d <= n; d++) h += `<button class="key" data-d="${d}"><span>${d}</span><small></small></button>`;
  return h + `</div>${label ? `<p class="pad-label">${label}</p>` : ''}`;
}

function moveSel(sel, key, n) {
  const r = sel < 0 ? 0 : (sel / n) | 0, c = sel < 0 ? 0 : sel % n;
  const d = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[key];
  if (!d) return null;
  return ((r + d[0] + n) % n) * n + ((c + d[1] + n) % n);
}

// ================= shell & routing =================
const TABS = [
  ['learn', '🥋', 'Learn'], ['play', '🧩', 'Play'], ['gym', '🎯', 'Practice'], ['me', '📈', 'Me'],
];
function shell(tab, body) {
  const belt = beltsEarned().at(-1);
  app.innerHTML = `
    <header class="top">
      <div class="brand"><span class="logo">${logoSvg()}</span><span>Sudoku <em>Dojo</em></span></div>
      <div class="chips">
        <span class="chip" title="Day streak">🔥 ${S.streak.n}</span>
        <span class="chip" title="Experience">⭐ ${S.xp}</span>
        <span class="chip belt-chip" style="--belt:${belt ? belt.color : 'var(--line)'}" title="${belt ? belt.name : 'No belt yet'}"></span>
      </div>
    </header>
    <main class="page">${body}</main>
    <nav class="tabs">${TABS.map(([id, ic, name]) => `<a href="#/${id}" class="${tab === id ? 'on' : ''}"><span>${ic}</span>${name}</a>`).join('')}</nav>`;
}
const logoSvg = () => `<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="2" y="2" width="28" height="28" rx="8" fill="var(--accent)"/><path d="M12 6v20M20 6v20M6 12h20M6 20h20" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".9"/><circle cx="16" cy="16" r="3.2" fill="#fff"/></svg>`;

function route() {
  clearTimers();
  active = null;
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  const [, name = 'learn', arg] = location.hash.split('/');
  window.scrollTo(0, 0);
  ({ learn: screenLearn, lesson: screenLesson, play: screenPlay, game: screenGame, gym: arg ? screenGymTech : screenGym, rush: screenRush, me: screenMe }[name] || screenLearn)(arg);
}
window.addEventListener('hashchange', route);
const go = h => { if (location.hash === h) route(); else location.hash = h; };

// ================= LEARN =================
function screenLearn() {
  const earned = beltsEarned().length, next = nextLesson();
  const doneCount = E.TECH_ORDER.filter(lessonDone).length;
  const curBelt = next ? beltForTech(next) : BELTS.at(-1);
  shell('learn', `
    <section class="hero">
      <div class="hero-text">
        <p class="eyebrow">${earned ? `${beltsEarned().at(-1).name} · ` : ''}${doneCount}/12 techniques</p>
        <h1>${next ? `Next up: ${LESSONS[next].title}` : 'You are a Black Belt 🥷'}</h1>
        <p class="muted">${next ? LESSONS[next].tagline + '. Learn it in about 3 minutes.' : 'Every technique mastered. Go hunt Expert puzzles.'}</p>
        <div class="row gap">
          ${next ? `<a class="btn primary" href="#/lesson/${next}">Start lesson</a>` : `<a class="btn primary" href="#/play">Play Expert</a>`}
          <a class="btn ghost" href="#/gym">Practice</a>
        </div>
      </div>
      <div class="belt-progress">${BELTS.map(b => `<span class="belt-dot ${b.lessons.every(lessonDone) ? 'got' : ''}" style="--belt:${b.color}" title="${b.name}"></span>`).join('')}</div>
    </section>
    ${BELTS.map(b => `
      <section class="belt-sec">
        <div class="belt-head"><span class="belt-swatch" style="--belt:${b.color}"></span><div><h2>${b.name}</h2><p class="muted">${b.blurb}</p></div></div>
        <div class="path">
          ${b.lessons.map(t => {
            const L = LESSONS[t], st = S.lessons[t];
            return `<a class="node ${st?.done ? 'done' : ''} ${t === next ? 'next' : ''}" href="#/lesson/${t}" style="--belt:${b.color}">
              <span class="node-ic">${L.icon}</span>
              <span class="node-body"><strong>${L.title}</strong><small>${L.tagline}</small></span>
              <span class="node-end">${st?.done ? `<span class="stars">${stars(st.stars)}</span>` : t === next ? '<span class="pill">Next</span>' : '›'}</span>
            </a>`;
          }).join('')}
        </div>
      </section>`).join('')}
    <p class="foot muted">Know some already? Jump into any lesson. Nothing is locked.</p>`);
}

// ================= LESSON =================
function screenLesson(tech) {
  const L = LESSONS[tech];
  if (!L) return go('#/learn');
  const bank = BANK.lessons[tech], belt = beltForTech(tech), placing = E.PLACING.has(tech);
  const practice = shuffle(bank.slice(1)).slice(0, 3), results = [];
  let phase = 'intro', beat = 0, pi = 0;

  const draw = () => {
    clearTimers(); active = null;
    const steps = ['intro', 'watch', 'p0', 'p1', 'p2'], cur = phase === 'practice' ? 'p' + pi : phase;
    const idx = phase === 'done' ? 5 : steps.indexOf(cur);
    app.innerHTML = `
      <header class="bar">
        <a class="icon-btn" href="#/learn" aria-label="Close">✕</a>
        <div class="progress">${steps.map((s, k) => `<i class="${k < idx ? 'full' : k === idx ? 'now' : ''}"></i>`).join('')}</div>
        <span class="belt-chip small" style="--belt:${belt.color}"></span>
      </header>
      <main class="page lesson" id="lp"></main>`;
    const root = $('#lp');
    if (phase === 'intro') {
      root.innerHTML = `
        <div class="intro pop-in">
          <div class="big-ic">${L.icon}</div>
          <p class="eyebrow">${belt.name} · Lesson ${E.TECH_ORDER.indexOf(tech) + 1} of 12</p>
          <h1>${L.title}</h1>
          ${L.idea.map(p => `<p>${md(p)}</p>`).join('')}
          <div class="analogy"><span>💡</span><p>${md(L.analogy)}</p></div>
          <h3>What to look for</h3>
          <ul class="look">${L.lookFor.map(x => `<li>${md(x)}</li>`).join('')}</ul>
          <p class="muted small">Cells are named by row and column: <strong>R4C7</strong> is row 4, column 7.</p>
          <button class="btn primary wide" id="next">Show me on a real puzzle →</button>
        </div>`;
      $('#next').onclick = () => { phase = 'watch'; draw(); };
    } else if (phase === 'watch') {
      const st = posState(bank[0]);
      const step = E.findAll(st, tech)[0];
      root.innerHTML = `
        <div class="play-layout">
          <div class="board-wrap"><div id="board"></div></div>
          <div class="side">
            <div class="coach"><span class="owl">🦉</span><div class="bubble" id="say"></div></div>
            <div class="row gap"><button class="btn ghost" id="back">← Back</button><button class="btn primary grow" id="fwd"></button></div>
          </div>
        </div>`;
      const board = new Board($('#board'), () => {});
      const show = () => {
        const lines = [`Let's find a **${L.title}** together. ${L.nudge}`, step.hint, step.text];
        $('#say').innerHTML = `<p class="beat">Step ${beat + 1} of 3</p>${md(lines[beat])}`;
        board.render({ grid: st.grid, givens: st.grid.map(Boolean), notes: placing ? null : st.cands, step, level: [0, 2, 3][beat] });
        if (beat === 2) { (step.place.length ? step.place : step.elim).forEach((p, k) => board.pulse(p.cell, 'pop', k)); sfx('good'); }
        $('#back').disabled = beat === 0;
        $('#fwd').textContent = beat === 2 ? 'Your turn →' : 'Next';
      };
      $('#back').onclick = () => { beat = Math.max(0, beat - 1); show(); };
      $('#fwd').onclick = () => { if (beat < 2) { beat++; show(); } else { phase = 'practice'; draw(); } };
      show();
    } else if (phase === 'practice') {
      root.innerHTML = `<p class="task-head">Your turn · <strong>${pi + 1} of 3</strong></p><div id="task"></div>`;
      mountTask($('#task'), {
        pos: practice[pi], tech,
        onDone: r => { results.push(r); pi++; phase = pi >= practice.length ? 'done' : 'practice'; if (phase === 'done') finish(); draw(); },
      });
    } else {
      const st = S.lessons[tech];
      root.innerHTML = `
        <div class="intro center pop-in">
          <div class="big-ic">🎉</div>
          <h1>${L.title} learned!</h1>
          <p class="stars huge">${stars(st.stars)}</p>
          <p class="muted">${st.stars === 3 ? 'Flawless. No hints, no slips.' : 'Hints and wrong taps cost stars. Replay any time for 3 stars.'}</p>
          <div class="row gap center">
            <a class="btn ghost" href="#/gym/${tech}">Practice more</a>
            ${nextLesson() ? `<a class="btn primary" href="#/lesson/${nextLesson()}">Next: ${LESSONS[nextLesson()].title}</a>` : `<a class="btn primary" href="#/play">Play a puzzle</a>`}
          </div>
        </div>`;
    }
  };

  const finish = () => {
    const beltsBefore = beltsEarned().length;
    const score = Math.min(...results.map(r => (r.hints === 0 && r.mistakes === 0 ? 3 : r.hints <= 2 && r.mistakes <= 2 ? 2 : 1)));
    const prev = S.lessons[tech];
    S.lessons[tech] = { done: true, stars: Math.max(prev?.stars || 0, score) };
    award(prev?.done ? 15 : 50, 'lesson');
    sfx('win'); confetti();
    const nb = beltsEarned();
    if (nb.length > beltsBefore) setTimeout(() => beltCeremony(nb.at(-1)), 700);
  };
  draw();
}

function beltCeremony(b) {
  confetti(2); sfx('win');
  overlay(`<div class="center"><div class="belt-big" style="--belt:${b.color}"></div><h1>${b.name}!</h1><p class="muted">${b.blurb}</p><button class="btn primary wide" data-close>Oss! 🙇</button></div>`,
    (o, close) => o.querySelector('[data-close]').onclick = close);
}

// ================= TASK: find one technique on a real position =================
// Used by lesson practice, technique practice and Rush.
function mountTask(root, { pos, tech, onDone, rush = false, onWrong }) {
  const L = LESSONS[tech], placing = E.PLACING.has(tech);
  const st = posState(pos), n = Math.sqrt(st.grid.length), G = E.geoOf(st.grid.length);
  const inst = E.findAll(st, tech);
  const grid = st.grid.slice(), givens = st.grid.map(Boolean), struck = Array(G.size).fill(0);
  const elimSet = new Set(inst.flatMap(s => s.elim.map(e => e.cell * 10 + e.digit)));
  let sel = -1, spot = 0, hintLv = 0, mistakes = 0, done = false, shown = null, level = 0, errors = new Set();

  root.innerHTML = `
    <div class="play-layout">
      <div class="board-wrap"><div id="tb"></div></div>
      <div class="side">
        <div class="coach"><span class="owl">🦉</span><div class="bubble" id="say"></div></div>
        ${numpad(n, placing ? 'Tap a cell, then its digit.' : 'Tap a cell, then the digit to cross out.')}
        <div class="row gap tools-row">
          ${rush ? '' : '<button class="btn ghost grow" id="hint">💡 Hint</button>'}
          <button class="btn primary grow hidden" id="cont">Continue →</button>
        </div>
      </div>
    </div>`;
  const board = new Board($('#tb', root), i => tap(i));
  const say = html => { $('#say', root).innerHTML = html; };
  const intro = `Find a <strong>${L.title}</strong>. ${placing ? 'Place the digit it gives you.' : 'Cross out every note it removes.'}`;
  say(rush ? `<p class="find">${L.icon} ${L.title}</p>` : intro);

  const notes = () => (placing ? null : st.cands.map((m, i) => m & ~struck[i]));
  const render = () => board.render({ grid, givens, notes: notes(), struck: placing ? null : struck, selected: sel, spot, step: shown, level, errors, peers: S.settings.peers });
  const bestInst = () => inst.slice().sort((a, b) => b.elim.filter(e => E.has(struck[e.cell], e.digit)).length - a.elim.filter(e => E.has(struck[e.cell], e.digit)).length)[0];

  function tap(i) {
    if (done) return;
    sel = i; spot = grid[i] || (S.settings.quick ? spot : 0);
    sfx('tap'); render();
  }
  function wrong(msg, cell) {
    mistakes++; sfx('bad'); board.pulse(cell, 'shake');
    onWrong?.();
    if (!rush) say(`<span class="bad">Not quite.</span> ${md(msg)}`);
    else toast(msg.replace(/\*\*/g, ''), 'bad');
  }
  function success(step) {
    done = true; shown = step; level = 3; errors = new Set();
    sfx('good'); render();
    (step.place.length ? step.place : step.elim).forEach((p, k) => board.pulse(p.cell, 'pop', k));
    if (rush) { setTimeout(() => onDone({ mistakes, hints: hintLv }), 650); return; }
    say(`<span class="good">Nailed it!</span> ${md(step.text)}`);
    $('#cont', root).classList.remove('hidden');
    $('#hint', root)?.classList.add('hidden');
  }
  function input(d) {
    if (done) return;
    if (sel < 0 || grid[sel]) { spot = spot === d ? 0 : d; render(); if (sel < 0) toast(`Showing every ${d}. Tap a cell to answer.`); return; }
    if (placing) {
      const hit = inst.find(s => s.place.some(p => p.cell === sel && p.digit === d));
      if (hit) { grid[sel] = d; return success(hit); }
      const clash = G.PEERS[sel].find(p => grid[p] === d);
      if (clash !== undefined) { errors = new Set([clash]); render(); setTimeout(() => { errors = new Set(); render(); }, 900); return wrong(`There's already a ${d} at **${G.cellName(clash)}**, in the same ${G.ROW[clash] === G.ROW[sel] ? 'row' : G.COL[clash] === G.COL[sel] ? 'column' : 'box'}.`, sel); }
      if (st.sol[sel] === d) { sfx('tap'); return say(`True, **${d}** is right there — but you can't prove it with a ${L.title} yet. Look for a different cell.`); }
      return wrong(`**${d}** doesn't belong in **${G.cellName(sel)}**. Look again.`, sel);
    }
    if (!E.has(st.cands[sel], d)) return toast(`No ${d} note in that cell.`);
    if (E.has(struck[sel], d)) return toast('Already crossed out.');
    if (!elimSet.has(sel * 10 + d)) return wrong(`The **${d}** in **${G.cellName(sel)}** stays. A ${L.title} doesn't remove it.`, sel);
    struck[sel] |= E.bit(d); spot = d;
    sfx('place'); board.pulse(sel, 'pop'); render();
    const full = inst.find(s => s.elim.every(e => E.has(struck[e.cell], e.digit)));
    if (full) success(full);
    else if (!rush) say(`<span class="good">Yes!</span> Keep going: what else does it remove?`);
  }
  function hint() {
    if (done) return;
    hintLv = Math.min(3, hintLv + 1);
    shown = bestInst();
    level = hintLv === 1 ? 0 : hintLv;
    say(`<p class="beat">Hint ${hintLv} of 3</p>${md([L.nudge, shown.hint, shown.text][hintLv - 1])}`);
    render();
  }

  root.querySelectorAll('.key').forEach(k => k.onclick = () => input(+k.dataset.d));
  $('#hint', root) && ($('#hint', root).onclick = hint);
  $('#cont', root).onclick = () => onDone({ mistakes, hints: hintLv });
  active = {
    key(e) {
      if (/^[1-9]$/.test(e.key) && +e.key <= n) input(+e.key);
      else if (e.key === 'h') hint();
      else if (e.key === 'Enter' && done && !rush) onDone({ mistakes, hints: hintLv });
      else { const m = moveSel(sel, e.key, n); if (m !== null) { e.preventDefault(); tap(m); } }
    },
  };
  render();
}

// ================= PRACTICE (technique gym) =================
function screenGym() {
  shell('gym', `
    <a class="rush-card" href="#/rush">
      <div><p class="eyebrow">⚡ Speed drill</p><h2>Technique Rush</h2><p>90 seconds. Spot as many techniques as you can. Builds the fast eye.</p></div>
      <div class="rush-best"><small>Best</small><strong>${S.rushBest}</strong></div>
    </a>
    <h2 class="sec-title">Practice one technique</h2>
    <p class="muted">Every technique has 30 real puzzle positions where it's the move to find.</p>
    <div class="gym-grid">
      ${E.TECH_ORDER.map(t => {
        const L = LESSONS[t], b = beltForTech(t), c = S.gym[t] || 0;
        return `<a class="gym-card" href="#/gym/${t}" style="--belt:${b.color}">
          <span class="node-ic">${L.icon}</span><strong>${L.title}</strong>
          <small>${c ? `${c} solved` : L.tagline}</small>
          <span class="meter"><i style="width:${Math.min(100, (c / 30) * 100)}%"></i></span>
        </a>`;
      }).join('')}
    </div>`);
}

function screenGymTech(tech) {
  const L = LESSONS[tech];
  if (!L) return go('#/gym');
  const order = shuffle(BANK.lessons[tech]);
  let k = 0;
  const draw = () => {
    clearTimers(); active = null;
    app.innerHTML = `
      <header class="bar">
        <a class="icon-btn" href="#/gym" aria-label="Back">←</a>
        <div class="bar-title">${L.icon} ${L.title} <small>${k + 1} / ${order.length}</small></div>
        <a class="icon-btn" href="#/lesson/${tech}" title="Re-read the lesson">📖</a>
      </header>
      <main class="page lesson"><div id="task"></div><div class="row center"><button class="btn link" id="skip">Skip this one →</button></div></main>`;
    mountTask($('#task'), {
      pos: order[k % order.length], tech,
      onDone: r => {
        S.gym[tech] = (S.gym[tech] || 0) + 1;
        award(r.hints ? 2 : 5);
        k = (k + 1) % order.length; draw();
      },
    });
    $('#skip').onclick = () => { k = (k + 1) % order.length; draw(); };
  };
  draw();
}

// ================= RUSH =================
function screenRush() {
  const pool = E.TECH_ORDER.filter(lessonDone);
  const techs = pool.length ? pool : BELTS[0].lessons;
  const intro = () => {
    app.innerHTML = `
      <header class="bar"><a class="icon-btn" href="#/gym">←</a><div class="bar-title">⚡ Technique Rush</div><span></span></header>
      <main class="page lesson"><div class="intro center pop-in">
        <div class="big-ic">⏱️</div><h1>90 seconds. Go fast.</h1>
        <p>You'll be told which technique to find. Each find adds <strong>+3 seconds</strong>. A wrong tap costs <strong>2 seconds</strong>. Chain finds for a combo.</p>
        <p class="muted small">Using: ${techs.map(t => LESSONS[t].title).join(', ')}${pool.length ? '' : ' (finish lessons to add more)'}</p>
        <p class="muted">Best: <strong>${S.rushBest}</strong></p>
        <button class="btn primary wide" id="go">Start</button>
      </div></main>`;
    $('#go').onclick = run;
  };
  const run = () => {
    let left = 90, score = 0, combo = 0, over = false;
    app.innerHTML = `
      <header class="bar"><a class="icon-btn" href="#/gym">✕</a>
        <div class="rush-hud"><span class="clock" id="clock">1:30</span><span>Score <strong id="score">0</strong></span><span class="combo" id="combo"></span></div><span></span></header>
      <main class="page lesson"><div id="task"></div><div class="row center"><button class="btn link" id="skip">Skip →</button></div></main>`;
    const hud = () => {
      $('#clock').textContent = fmt(Math.max(0, left));
      $('#clock').classList.toggle('low', left <= 10);
      $('#score').textContent = score;
      $('#combo').textContent = combo >= 2 ? `🔥 x${combo}` : '';
    };
    const next = () => {
      if (over) return;
      const t = techs[(Math.random() * techs.length) | 0];
      const pos = BANK.lessons[t][(Math.random() * BANK.lessons[t].length) | 0];
      mountTask($('#task'), {
        pos, tech: t, rush: true,
        onDone: () => { score++; combo++; left += 3; if (combo >= 3) sfx('unit'); hud(); next(); },
        onWrong: () => { left -= 2; combo = 0; hud(); },
      });
    };
    $('#skip').onclick = () => { combo = 0; hud(); next(); };
    timers.push(setInterval(() => {
      if (document.hidden) return;
      left--; hud();
      if (left <= 0 && !over) {
        over = true; clearTimers(); active = null;
        const best = score > S.rushBest;
        if (best) S.rushBest = score;
        S.history.unshift({ kind: 'rush', score, date: Date.now() }); S.history = S.history.slice(0, 50);
        save();
        if (score) award(score * 4, 'rush');
        if (best && score) confetti(1.4);
        sfx('win');
        overlay(`<div class="center"><div class="big-ic">${best && score ? '🏆' : '⏱️'}</div><h1>${score} found</h1><p class="muted">${best && score ? 'New personal best!' : `Best: ${S.rushBest}`}</p>
          <div class="row gap center"><button class="btn ghost" data-a="out">Done</button><button class="btn primary" data-a="again">Again</button></div></div>`,
          (o, close) => {
            o.querySelector('[data-a=out]').onclick = () => { close(); go('#/gym'); };
            o.querySelector('[data-a=again]').onclick = () => { close(); run(); };
          });
      }
    }, 1000));
    hud(); next();
  };
  intro();
}

// ================= PLAY =================
const dailyIndex = () => { const d = new Date(); return (d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate()) % BANK.tiers.medium.length; };

function screenPlay() {
  const g = S.game;
  const tierCard = t => {
    const won = S.wins[t.id] || 0, best = S.best[t.id];
    return `<button class="tier" data-tier="${t.id}" style="--belt:${beltOf(t.belt).color}">
      <span class="tier-band"></span>
      <span class="tier-body"><strong>${t.name}</strong><small>${t.desc}</small></span>
      <span class="tier-stats">${won ? `<small>${won} won</small>` : ''}${best != null ? `<small>⏱ ${fmt(best)}</small>` : ''}</span>
    </button>`;
  };
  const dailyDone = S.history.some(h => h.daily === today());
  shell('play', `
    ${g ? `<button class="continue" id="cont"><span>▶</span><span><strong>Continue ${g.name}</strong><small>${fmt(g.time)} · ${g.grid.filter((v, i) => v && !g.givens[i]).length} placed</small></span></button>` : ''}
    <button class="daily" id="daily"><span class="big-ic sm">📅</span><span><strong>Daily puzzle</strong><small>${dailyDone ? 'Done today ✓ — play again for fun' : 'A fresh Medium every day'}</small></span></button>
    <h2 class="sec-title">Classic 9×9</h2>
    <div class="tiers">${TIERS.map(tierCard).join('')}</div>
    <h2 class="sec-title">Mini 6×6 <span class="pill">quick</span></h2>
    <p class="muted">Digits 1–6, boxes of 2×3. A full game in 2–5 minutes, great for warming up.</p>
    <div class="tiers">
      ${tierCard({ id: 'mini-quick', name: 'Mini · Quick', belt: 'white', desc: 'Extra clues. Pure scanning.' })}
      ${tierCard({ id: 'mini-tricky', name: 'Mini · Tricky', belt: 'yellow', desc: 'Few clues. Needs a real technique.' })}
    </div>
    <details class="tips"><summary>⚡ How to get faster</summary>
      <ol>
        <li><strong>Scan by digit, not by cell.</strong> Pick a digit, tap it on the keypad, and every copy lights up. Look for boxes that are missing it.</li>
        <li><strong>Start with the digit that's on the board most.</strong> It has the fewest places left, so its singles jump out.</li>
        <li><strong>Turn on Quick fill</strong> (⚡ in the toolbar). Tap a digit once, then tap cell after cell to drop it, with no back-and-forth.</li>
        <li><strong>Only write notes when singles run out.</strong> Notes are slow; the first half of most puzzles needs none.</li>
        <li><strong>Train your eye in Rush.</strong> Ninety seconds a day on Technique Rush makes patterns pop out without thinking.</li>
        <li><strong>Keyboard:</strong> 1–9 to place, Shift+digit for a note, arrows to move, N notes, Z undo, H hint, Q quick fill.</li>
      </ol>
    </details>`);
  $('#cont') && ($('#cont').onclick = () => go('#/game'));
  $('#daily').onclick = () => startGame('medium', BANK.tiers.medium[dailyIndex()], { daily: today(), name: 'Daily puzzle' });
  app.querySelectorAll('.tier').forEach(b => b.onclick = () => {
    const t = b.dataset.tier;
    if (S.game && !confirm('Start a new game? Your current one will be lost.')) return;
    if (t.startsWith('mini')) {
      const lv = t.split('-')[1], { puzzle, solution } = E.generate6(lv);
      startGame(t, { id: `${t}-${Date.now()}`, p: E.stringify(puzzle), s: solution.join('') }, { name: lv === 'quick' ? 'Mini · Quick' : 'Mini · Tricky' }, true);
    } else {
      const list = BANK.tiers[t], seen = new Set(S.solved[t] || []);
      let pool = list.filter(p => !seen.has(p.id));
      if (!pool.length) { S.solved[t] = []; pool = list; }
      startGame(t, pool[(Math.random() * pool.length) | 0], { name: TIERS.find(x => x.id === t).name }, true);
    }
  });
}

function startGame(tier, p, extra = {}, skipConfirm = false) {
  if (!skipConfirm && S.game && !confirm('Start a new game? Your current one will be lost.')) return;
  const grid = E.parse(p.p);
  S.game = { id: p.id, tier, p: p.p, s: p.s, grid, givens: grid.map(Boolean), notes: Array(grid.length).fill(0), time: 0, mistakes: 0, hints: 0, hist: [], ...extra };
  save();
  go('#/game');
}

function screenGame() {
  const g = S.game;
  if (!g) return go('#/play');
  const sol = E.parse(g.s), n = Math.sqrt(g.grid.length), G = E.geoOf(g.grid.length);
  let sel = -1, spot = 0, notesMode = false, lock = 0, hintStep = null, hintLv = 0, hintCands = null;
  const tierXp = (TIERS.find(t => t.id === g.tier)?.xp) ?? (g.tier === 'mini-quick' ? 8 : 15);

  app.innerHTML = `
    <header class="bar">
      <a class="icon-btn" href="#/play" aria-label="Back">←</a>
      <div class="bar-title">${g.name}<small><span id="clock">${fmt(g.time)}</span> · <span id="miss"></span></small></div>
      <button class="icon-btn" id="restart" title="Restart">↺</button>
    </header>
    <main class="page game">
      <div class="play-layout">
        <div class="board-wrap"><div id="gb"></div></div>
        <div class="side">
          <div class="coach hidden" id="coach"><span class="owl">🦉</span><div class="bubble"><div id="say"></div><div class="row gap" id="hint-actions"></div></div></div>
          <div class="tools">
            <button class="tool" id="undo"><span>↶</span>Undo</button>
            <button class="tool" id="erase"><span>⌫</span>Erase</button>
            <button class="tool" id="notes"><span>✎</span>Notes<i class="state"></i></button>
            <button class="tool" id="fill"><span>▦</span>Fill notes</button>
            <button class="tool" id="quick" title="Quick fill: pick a digit, then tap cells"><span>⚡</span>Quick<i class="state"></i></button>
            <button class="tool hint" id="hint"><span>💡</span>Hint</button>
          </div>
          ${numpad(n)}
        </div>
      </div>
    </main>`;
  const board = new Board($('#gb'), i => tap(i));
  const say = (html, actions = '') => { $('#coach').classList.remove('hidden'); $('#say').innerHTML = html; $('#hint-actions').innerHTML = actions; };
  const hush = () => { $('#coach').classList.add('hidden'); hintStep = null; hintLv = 0; };

  const errors = () => {
    const e = new Set();
    for (let i = 0; i < G.size; i++) {
      const v = g.grid[i];
      if (!v || g.givens[i]) continue;
      if (S.settings.mistakes && v !== sol[i]) e.add(i);
      for (const p of G.PEERS[i]) if (g.grid[p] === v) { e.add(i); }
    }
    return e;
  };
  const render = () => {
    board.render({ grid: g.grid, givens: g.givens, notes: g.notes, selected: sel, spot: lock || spot, errors: errors(), step: hintStep, level: hintLv >= 2 ? hintLv : 0, peers: S.settings.peers });
    const counts = Array(n + 1).fill(0);
    g.grid.forEach((v, i) => { if (v && v === sol[i]) counts[v]++; });
    app.querySelectorAll('.key').forEach(k => {
      const d = +k.dataset.d, left = n - counts[d];
      k.querySelector('small').textContent = left || '';
      k.classList.toggle('complete', left === 0);
      k.classList.toggle('locked', lock === d);
    });
    $('#notes').classList.toggle('on', notesMode);
    $('#quick').classList.toggle('on', S.settings.quick);
    $('#miss').textContent = S.settings.mistakes ? `${g.mistakes} mistake${g.mistakes === 1 ? '' : 's'}` : `${g.hints} hints`;
  };
  const snapshot = () => { g.hist.push({ grid: g.grid.slice(), notes: g.notes.slice() }); if (g.hist.length > 200) g.hist.shift(); };

  function tap(i) {
    if (g.done) return;
    if (S.settings.quick && lock) { sel = i; apply(i, lock); return; }
    sel = i; spot = g.grid[i] || 0;
    sfx('tap'); render();
  }
  function apply(i, d, asNote = notesMode) {
    if (g.givens[i]) { spot = g.grid[i]; render(); return; }
    if (asNote) {
      if (g.grid[i]) return;
      snapshot(); g.notes[i] ^= E.bit(d); sfx('tap');
    } else {
      if (g.grid[i] === d) { render(); return; }
      snapshot();
      g.grid[i] = d; g.notes[i] = 0;
      for (const p of G.PEERS[i]) g.notes[p] &= ~E.bit(d);
      if (d !== sol[i]) {
        g.mistakes++;
        if (S.settings.mistakes) { sfx('bad'); setTimeout(() => board.pulse(i, 'shake')); }
        else sfx('place');
      } else {
        sfx('place'); setTimeout(() => board.pulse(i, 'pop'));
        const doneUnits = G.CELL_UNITS[i].filter(u => G.UNITS[u].every(c => g.grid[c] === sol[c]));
        if (doneUnits.length) { sfx('unit'); setTimeout(() => doneUnits.forEach(u => board.wave(G.UNITS[u]))); }
        if (g.grid.filter(v => v === d).length === n && g.grid.every((v, c) => v !== d || sol[c] === d)) toast(`All ${d}s placed ✓`);
      }
    }
    hush(); save(); render();
    if (g.grid.every((v, c) => v === sol[c])) win();
  }
  function input(d, asNote) {
    if (g.done) return;
    if (S.settings.quick) { lock = lock === d ? 0 : d; spot = lock; sfx('tap'); render(); return; }
    if (sel < 0) { spot = spot === d ? 0 : d; render(); return; }
    apply(sel, d, asNote ?? notesMode);
  }
  function erase() {
    if (sel < 0 || g.givens[sel] || (!g.grid[sel] && !g.notes[sel])) return;
    snapshot(); g.grid[sel] = 0; g.notes[sel] = 0; hush(); save(); sfx('tap'); render();
  }
  function undo() {
    const h = g.hist.pop();
    if (!h) return toast('Nothing to undo');
    g.grid = h.grid; g.notes = h.notes; hush(); save(); sfx('tap'); render();
  }
  function fill() {
    snapshot();
    const c = E.basicCandidates(g.grid);
    for (let i = 0; i < G.size; i++) if (!g.grid[i]) g.notes[i] = c[i];
    hush(); save(); sfx('good'); render(); toast('Notes filled in');
  }
  function hint() {
    if (g.done) return;
    if (hintStep && hintLv < 3) { hintLv++; return showHint(); }
    const wrong = g.grid.findIndex((v, i) => v && !g.givens[i] && v !== sol[i]);
    if (wrong >= 0) { sel = wrong; render(); return say(`There's a mistake at <strong>${G.cellName(wrong)}</strong>. Erase it first, then ask again.`); }
    const cands = E.basicCandidates(g.grid);
    for (let i = 0; i < G.size; i++) {
      if (!g.notes[i] || g.grid[i]) continue;
      if (!E.has(g.notes[i], sol[i])) { sel = i; render(); return say(`Your notes in <strong>${G.cellName(i)}</strong> are missing the right digit. Fix them, or tap "Fill notes" to start fresh.`); }
      cands[i] &= g.notes[i];
    }
    const step = E.findStep({ grid: g.grid.slice(), cands });
    if (!step) {
      const i = g.grid.findIndex(v => !v);
      say(`I'm stuck too! Here's a free one: <strong>${G.cellName(i)}</strong> is <strong>${sol[i]}</strong>.`, `<button class="btn primary sm" id="free">Place it</button>`);
      $('#free').onclick = () => apply(i, sol[i], false);
      return;
    }
    hintStep = step; hintCands = cands; hintLv = 1; g.hints++; save(); showHint();
  }
  function showHint() {
    const L = LESSONS[hintStep.tech];
    const body = [`Try a <strong>${L.title}</strong> ${L.icon}. ${md(L.nudge)}`, md(hintStep.hint), md(hintStep.text)][hintLv - 1];
    const acts = hintLv < 3
      ? `<button class="btn ghost sm" id="more">Show more</button><a class="btn link sm" href="#/lesson/${hintStep.tech}">Learn it</a>`
      : `<button class="btn primary sm" id="applyh">Apply it</button><button class="btn ghost sm" id="dismiss">Got it</button>`;
    say(`<p class="beat">Hint ${hintLv} of 3</p>${body}`, acts);
    $('#more') && ($('#more').onclick = () => { hintLv++; showHint(); });
    $('#dismiss') && ($('#dismiss').onclick = () => { hush(); render(); });
    $('#applyh') && ($('#applyh').onclick = () => {
      const s = hintStep, c = hintCands;
      snapshot();
      for (const { cell, digit } of s.place) { g.grid[cell] = digit; g.notes[cell] = 0; for (const p of G.PEERS[cell]) g.notes[p] &= ~E.bit(digit); }
      for (const { cell, digit } of s.elim) { if (!g.notes[cell]) g.notes[cell] = c[cell]; g.notes[cell] &= ~E.bit(digit); }
      hush(); save(); sfx('good'); render();
      (s.place.length ? s.place : s.elim).forEach((p, k) => board.pulse(p.cell, 'pop', k));
      if (g.grid.every((v, c2) => v === sol[c2])) win();
    });
    render();
  }
  function win() {
    g.done = true; clearTimers(); active = null;
    const first = S.best[g.tier] == null || g.time < S.best[g.tier];
    if (first) S.best[g.tier] = g.time;
    S.wins[g.tier] = (S.wins[g.tier] || 0) + 1;
    if (g.id && BANK.tiers[g.tier]) S.solved[g.tier] = [...(S.solved[g.tier] || []), g.id];
    S.history.unshift({ kind: 'game', tier: g.tier, name: g.name, time: g.time, mistakes: g.mistakes, hints: g.hints, daily: g.daily, date: Date.now() });
    S.history = S.history.slice(0, 50);
    const xp = Math.max(5, tierXp - g.hints * 3);
    S.game = null; save();
    award(xp, 'puzzle solved');
    sfx('win'); setTimeout(() => board.wave([...Array(G.size).keys()].sort((a, b) => (G.ROW[a] + G.COL[a]) - (G.ROW[b] + G.COL[b]))), 50);
    setTimeout(() => confetti(1.6), 400);
    setTimeout(() => overlay(`
      <div class="center">
        <div class="big-ic">🏆</div><h1>Solved!</h1>
        <div class="win-stats">
          <div><small>Time</small><strong>${fmt(g.time)}</strong>${first ? '<em>Best!</em>' : `<em>Best ${fmt(S.best[g.tier])}</em>`}</div>
          <div><small>Mistakes</small><strong>${g.mistakes}</strong></div>
          <div><small>Hints</small><strong>${g.hints}</strong></div>
        </div>
        <div class="row gap center"><button class="btn ghost" data-a="home">Menu</button><button class="btn primary" data-a="again">Another one</button></div>
      </div>`, (o, close) => {
      o.querySelector('[data-a=home]').onclick = () => { close(); go('#/play'); };
      o.querySelector('[data-a=again]').onclick = () => { close(); go('#/play'); setTimeout(() => app.querySelector(`.tier[data-tier="${g.tier}"]`)?.click(), 50); };
    }), 900);
  }

  app.querySelectorAll('.key').forEach(k => k.onclick = () => input(+k.dataset.d));
  $('#undo').onclick = undo; $('#erase').onclick = erase; $('#fill').onclick = fill; $('#hint').onclick = hint;
  $('#notes').onclick = () => { notesMode = !notesMode; sfx('tap'); render(); };
  $('#quick').onclick = () => { S.settings.quick = !S.settings.quick; lock = 0; save(); sfx('tap'); render(); toast(S.settings.quick ? '⚡ Quick fill on: pick a digit, then tap cells' : 'Quick fill off'); };
  $('#restart').onclick = () => {
    if (!confirm('Restart this puzzle from the beginning?')) return;
    g.grid = E.parse(g.p); g.notes = Array(G.size).fill(0); g.hist = []; g.time = 0; g.mistakes = 0; hush(); save(); render();
  };
  active = {
    key(e) {
      const code = e.code.startsWith('Digit') ? +e.code.slice(5) : e.code.startsWith('Numpad') ? +e.code.slice(6) : NaN;
      if (code >= 1 && code <= n) {
        e.preventDefault();
        if (S.settings.quick && sel >= 0) return apply(sel, code, e.shiftKey || notesMode);
        return sel >= 0 ? apply(sel, code, e.shiftKey || notesMode) : input(code);
      }
      const k = e.key.toLowerCase();
      if (k === 'backspace' || k === 'delete' || k === '0') erase();
      else if (k === 'z') undo();
      else if (k === 'n') $('#notes').click();
      else if (k === 'q') $('#quick').click();
      else if (k === 'h') hint();
      else if (k === 'escape') { sel = -1; spot = 0; lock = 0; render(); }
      else { const m = moveSel(sel, e.key, n); if (m !== null) { e.preventDefault(); sel = m; spot = g.grid[m] || 0; render(); } }
    },
  };
  timers.push(setInterval(() => {
    if (document.hidden || g.done || document.querySelector('.overlay')) return;
    g.time++; $('#clock') && ($('#clock').textContent = fmt(g.time));
    if (g.time % 5 === 0) save();
  }, 1000));
  render();
}

// ================= ME =================
function screenMe() {
  const allTiers = [...TIERS, { id: 'mini-quick', name: 'Mini · Quick' }, { id: 'mini-tricky', name: 'Mini · Tricky' }];
  const games = S.history.filter(h => h.kind === 'game');
  const row = (k, v) => `<div class="kv"><span>${k}</span><strong>${v}</strong></div>`;
  const toggle = (k, label, sub) => `<label class="toggle"><span><strong>${label}</strong><small>${sub}</small></span><input type="checkbox" data-k="${k}" ${S.settings[k] ? 'checked' : ''}><i></i></label>`;
  shell('me', `
    <section class="stats-hero">
      <div><small>Streak</small><strong>🔥 ${S.streak.n}</strong></div>
      <div><small>XP</small><strong>⭐ ${S.xp}</strong></div>
      <div><small>Puzzles</small><strong>🧩 ${games.length}</strong></div>
      <div><small>Rush best</small><strong>⚡ ${S.rushBest}</strong></div>
    </section>
    <h2 class="sec-title">Belts</h2>
    <div class="belts-row">${BELTS.map(b => `<div class="belt-tile ${b.lessons.every(lessonDone) ? 'got' : ''}"><span class="belt-big sm" style="--belt:${b.color}"></span><small>${b.name.replace(' Belt', '')}</small></div>`).join('')}</div>
    <h2 class="sec-title">Best times</h2>
    <div class="card">${allTiers.map(t => row(t.name, S.best[t.id] != null ? `${fmt(S.best[t.id])} <small class="muted">· ${S.wins[t.id]} won</small>` : '—')).join('')}</div>
    <h2 class="sec-title">Recent</h2>
    <div class="card">${S.history.length ? S.history.slice(0, 12).map(h => h.kind === 'rush'
      ? row(`⚡ Rush · ${new Date(h.date).toLocaleDateString()}`, `${h.score} found`)
      : row(`${h.daily ? '📅 ' : ''}${h.name} · ${new Date(h.date).toLocaleDateString()}`, `${fmt(h.time)} <small class="muted">· ${h.mistakes}✗ ${h.hints}💡</small>`)).join('') : '<p class="muted">Solve a puzzle and it shows up here.</p>'}</div>
    <h2 class="sec-title">Settings</h2>
    <div class="card">
      ${toggle('mistakes', 'Show mistakes', 'Wrong digits turn red right away')}
      ${toggle('peers', 'Highlight row, column & box', 'Shade the cells the selected cell can see')}
      ${toggle('quick', 'Quick fill', 'Pick a digit first, then tap cells')}
      ${toggle('sound', 'Sound & haptics', 'Little pops and chimes')}
    </div>
    <p class="muted small">Progress is saved in this browser only.</p>
    <button class="btn link danger" id="reset">Reset all progress</button>`);
  app.querySelectorAll('.toggle input').forEach(inp => inp.onchange = () => {
    S.settings[inp.dataset.k] = inp.checked; fx.sound = S.settings.sound; save(); sfx('tap');
  });
  $('#reset').onclick = () => { if (confirm('Erase all XP, belts, times and saved games?')) { S = fresh(); save(); route(); } };
}

// ================= boot =================
route();
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
