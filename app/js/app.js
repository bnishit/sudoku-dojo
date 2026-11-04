import * as E from './engine.js';
import * as H from './habit.js';
import * as C from './coach.js';
import { freshSearch, loadSearch, mountSearch, boxes, ladderReady, followUpPrompt } from './search.js';
import { hasNativeBridge, download, share as shareResult, reminder, onReminderStatus, onNativeOpen } from './native.js';
import { BANK } from '../data/bank.js';
import { LESSONS, BELTS, TIERS } from './lessons.js';
import { Board, md } from './board.js';
import { sfx, confetti, fx } from './fx.js';

const $ = (s, r = document) => r.querySelector(s);
const app = $('#app');

// ================= storage (this browser only) =================
const KEY = 'sudoku-dojo-v1'; // old name kept on purpose: changing it would wipe every saved game
const fresh = () => ({
  searchBox: freshSearch(), coach: { stats: {}, moments: [] }, xp: 0, days: [], bestStreak: 0, lessons: {}, gym: {}, reviews: {}, solved: {}, best: {}, wins: {}, history: [],
  settings: { mistakes: true, peers: true, sound: true, quick: false, goal: 3, reminderOn: false, remindAt: '08:00' }, game: null, rushBest: 0,
});
let S = load();
function load(raw = localStorage.getItem(KEY)) {
  try {
    const d = JSON.parse(raw || '{}'), f = fresh();
    const s = { ...f, ...d, settings: { ...f.settings, ...(d.settings || {}) } };
    s.searchBox = loadSearch(d.searchBox);
    s.settings.reminderOn = s.settings.reminderOn === true;
    s.coach = { ...f.coach, ...(d.coach || {}) };
    // migrate release-1 saves
    if (d.streak?.last && !d.days) s.days = [d.streak.last];
    delete s.streak;
    for (const [t, v] of Object.entries(s.gym)) if (typeof v === 'number') s.gym[t] = { n: v, ids: [] };
    return s;
  } catch { return fresh(); }
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* storage full or blocked */ } }
fx.sound = S.settings.sound;

const today = () => H.dayKey();
let reminderDenied = false;
const syncReminder = (requestPermission = false) => reminder(S.settings, S.days.includes(today()), requestPermission);
onNativeOpen(() => syncReminder());
onReminderStatus(({ on, denied }) => {
  S.settings.reminderOn = on; reminderDenied = denied; save();
  const toggle = $('[data-k=reminderOn]');
  if (toggle) toggle.checked = on;
  const note = $('#reminderDenied');
  if (note) note.hidden = !denied;
});
const streakNow = () => H.streak(S.days, today());
// Any XP comes from real practice, so it also marks today as a practice day.
function award(xp, why) {
  S.xp += xp;
  const wasPractised = S.days.includes(today());
  S.days = H.addDay(S.days, today());
  if (!wasPractised) syncReminder();
  S.bestStreak = Math.max(S.bestStreak, streakNow());
  save();
  toast(`+${xp} XP${why ? ' · ' + why : ''}`, 'xp');
}

// ================= helpers =================
const shuffle = a => E.shuffle(a.slice());
const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const beltOf = id => BELTS.find(b => b.id === id);
const LESSON_ORDER = BELTS.flatMap(b => b.lessons);
const lessonDone = t => !!S.lessons[t]?.done;
const beltsEarned = () => BELTS.filter(b => b.lessons.every(lessonDone));
const nextLesson = () => LESSON_ORDER.find(t => !lessonDone(t));
const beltForTech = t => BELTS.find(b => b.lessons.includes(t));
const learnedTechs = () => { const l = E.TECH_ORDER.filter(lessonDone); return l.length ? l : BELTS[0].lessons; };
const stars = n => '★'.repeat(n) + '☆'.repeat(3 - n);
const pick = a => a[(Math.random() * a.length) | 0];
const appUrl = path => new URL(path, location.href.split('#')[0]).href;

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
  if (!active || e.target.closest('input,textarea,select') || document.querySelector('.overlay')) return;
  active.key?.(e);
});

function numpad(n, label = '') {
  let h = `<div class="numpad n${n}">`;
  for (let d = 1; d <= n; d++) h += `<button class="key" data-d="${d}"><span>${d}</span><small></small></button>`;
  return h + `</div>${label ? `<p class="pad-label">${label}</p>` : ''}`;
}

// Board container; labeled boards show row/column numbers so "R4C7" is easy to find.
function boardFrame(id, n = 9, labeled = false) {
  const nums = Array.from({ length: n }, (_, i) => `<span>${i + 1}</span>`).join('');
  return `<div class="board-frame${labeled ? ' labeled' : ''}" style="--n:${n}">${labeled ? `<div class="col-labels">${nums}</div><div class="row-labels">${nums}</div>` : ''}<div id="${id}"></div></div>`;
}
const keypadMap = `<span class="keypad-map" aria-hidden="true">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => `<i>${d}</i>`).join('')}</span>`;

// What the colours mean, for the step currently shown.
function legend(step, level) {
  if (!step || level < 2) return '';
  const roles = new Set(step.cells.map(c => c.role).filter(r => r !== 'target' || level >= 3));
  const items = [];
  if (step.units.length) items.push(['unit', 'where to look']);
  if (roles.has('blocker')) items.push(['blocker', 'digit doing the blocking']);
  if (roles.has('blocked')) items.push(['blocked', 'ruled out']);
  if (roles.has('pattern')) items.push(['pattern', 'the pattern']);
  if (roles.has('pivot')) items.push(['pivot', 'pivot']);
  if (roles.has('pincer')) items.push(['pincer', 'pincers']);
  if (step.marks.some(m => m.role === 'key')) items.push(['key', 'notes that form it']);
  if (level >= 3 && step.elim.length) items.push(['elim', 'notes it removes']);
  if (level >= 3 && step.place.length) items.push(['target', 'the answer']);
  return `<div class="legend">${items.map(([c, t]) => `<span><i class="lg-${c}"></i>${t}</span>`).join('')}</div>`;
}

function moveSel(sel, key, n) {
  const r = sel < 0 ? 0 : (sel / n) | 0, c = sel < 0 ? 0 : sel % n;
  const d = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[key];
  if (!d) return null;
  return ((r + d[0] + n) % n) * n + ((c + d[1] + n) % n);
}

function weekHtml() {
  return `<div class="week">${H.week(S.days, today()).map(d => `<span class="d${d.done ? ' done' : ''}${d.today ? ' today' : ''}${d.future ? ' future' : ''}"><i>${d.done ? '✓' : ''}</i>${d.label}</span>`).join('')}</div>`;
}
const weekCount = () => H.week(S.days, today()).filter(d => d.done).length;

// ================= shell & routing =================
const TABS = [
  ['learn', '🥋', 'Learn'], ['play', '🧩', 'Play'], ['gym', '🎯', 'Practice'], ['me', '📈', 'Me'],
];
function shell(tab, body) {
  const belt = beltsEarned().at(-1);
  app.innerHTML = `
    <header class="top">
      <div class="brand"><span class="logo">${logoSvg()}</span><span>Sudoku <em>Belts</em></span></div>
      <div class="chips">
        <span class="chip" title="Day streak (one rest day a week is allowed)">🔥 ${streakNow()}</span>
        <span class="chip" title="XP: points for practising">⭐ ${S.xp}</span>
        <span class="chip belt-chip" style="--belt:${belt ? belt.color : 'var(--line)'}" title="${belt ? belt.name : 'No belt yet'}"></span>
      </div>
    </header>
    <main class="page">${body}</main>
    <nav class="tabs">${TABS.map(([id, ic, name]) => `<a href="#/${id}" class="${tab === id ? 'on' : ''}"><span>${ic}</span>${name}</a>`).join('')}</nav>`;
}
const logoSvg = () => `<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="2" y="2" width="28" height="28" rx="8" fill="var(--accent)"/><path d="M12 6v20M20 6v20M6 12h20M6 20h20" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".9"/><circle cx="16" cy="16" r="3.2" fill="#fff"/></svg>`;

function route() {
  syncReminder();
  app.inert = false;
  clearTimers();
  active = null;
  document.querySelectorAll('.overlay, .search-overlay').forEach(o => o.remove());
  const [, name = 'learn', arg] = location.hash.split('/');
  window.scrollTo(0, 0);
  ({ learn: screenLearn, lesson: screenLesson, play: screenPlay, game: screenGame, gym: arg ? screenGymTech : screenGym, rush: screenRush, scan: screenScan, daily: screenDaily, blind: screenBlind, me: screenMe }[name] || screenLearn)(arg);
}
window.addEventListener('hashchange', route);
const go = h => { if (location.hash === h) route(); else location.hash = h; };

// ================= LEARN =================
function todayCard() {
  const doneToday = S.days.includes(today()), away = H.daysAway(S.days, today());
  const welcome = !doneToday && away >= 2 && S.days.length;
  return `
    <section class="today-card pop-in">
      <div>
        <p class="eyebrow">${welcome ? 'Welcome back 👋' : doneToday ? 'Today ✓' : 'Today'}</p>
        <h2>${doneToday ? 'Practised today. Nice!' : welcome ? 'Ready for one move?' : "Today's practice"}</h2>
        <p>${doneToday ? 'Come back tomorrow, or keep going.' : '5 quick moves, about 3 minutes. Even one move counts.'}</p>
      </div>
      <div class="today-row">
        <div>${weekHtml()}<p class="week-meta">${weekCount()} of ${S.settings.goal} days this week · 🔥 ${streakNow()}</p></div>
        <a class="btn primary" href="#/daily">${doneToday ? 'Practise more' : 'Start'}</a>
      </div>
    </section>`;
}

function screenLearn() {
  const earned = beltsEarned().length, next = nextLesson();
  const doneCount = LESSON_ORDER.filter(lessonDone).length;
  const started = E.TECH_ORDER.some(lessonDone);
  shell('learn', `
    ${started ? todayCard() : ''}
    <section class="hero">
      <div class="hero-text">
        <p class="eyebrow">${earned ? `${beltsEarned().at(-1).name} · ` : ''}${doneCount}/${LESSON_ORDER.length} lessons</p>
        <h1>${next ? `Next up: ${LESSONS[next].title}` : 'You are a Black Belt 🥷'}</h1>
        <p class="muted">${next ? LESSONS[next].tagline + '. About 3 minutes.' : 'Every technique learned. Go hunt Expert puzzles.'}</p>
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
              <span class="node-end">${st?.done ? `<span class="stars">${stars(st.stars)}</span>${st.solo ? ' 🏅' : ''}` : t === next ? '<span class="pill">Next</span>' : '›'}</span>
            </a>`;
          }).join('')}
        </div>
      </section>`).join('')}
    <p class="foot muted">Know some already? Jump into any lesson. Nothing is locked.</p>`);
}

// Searches use a separate board so exit restores notes and normal controls untouched.
function openSearch(grid, options = {}) {
  const host = document.createElement('div'); host.className = 'search-overlay';
  host.setAttribute('role', 'dialog'); host.setAttribute('aria-modal', 'true'); host.setAttribute('aria-label', 'Search with me');
  document.body.append(host); app.inert = true;
  const previous = active; active = null;
  const close = () => { host.remove(); app.inert = false; if (active === null) active = previous; };
  const training = S.searchBox.rung === 1 || (S.searchBox.rung === 5 && !ladderReady(grid))
    ? BANK.lessons.hiddenSingleBox.filter(p => !S.searchBox.positions.includes(p.g) && ladderReady(E.parse(p.g))) : [];
  mountSearch(host, { grid: training.length ? E.parse(pick(training).g) : grid.slice(), progress: S.searchBox,
    persist: p => { S.searchBox = p; save(); }, ...options,
    fullPuzzle: !!options.fullPuzzle && !training.length,
    onExit: () => { close(); options.onExit?.(); },
    onSkip: () => { close(); options.onExit?.(); },
    onRep: () => { close(); openSearch(grid, options); },
    onPlace: move => { close(); if (training.length) return openSearch(grid, options); options.onPlace?.(move); },
  });
}

// ================= LESSON =================
function screenLesson(tech) {
  const L = LESSONS[tech];
  if (!L) return go('#/learn');
  const belt = beltForTech(tech), isNotes = L.kind === 'notes', isScan = L.kind === 'scan';
  const bank = BANK.lessons[isNotes ? 'pointing' : isScan ? 'fullHouse' : tech], placing = E.PLACING.has(tech);
  const practice = shuffle(bank.slice(1).filter(p => tech !== 'hiddenSingleBox' || ladderReady(E.parse(p.g)))).slice(0, tech === 'hiddenSingleBox' ? bank.length : 3), results = [];
  let phase = tech === 'hiddenSingleBox' ? 'practice' : 'intro', beat = 0, pi = 0;
  const steps = tech === 'hiddenSingleBox' ? ['r1','r2','r3','r4','r5','r6'] : isNotes ? ['intro', 'notes'] : isScan ? ['intro', 'scan'] : ['intro', 'watch', 'p0', 'p1', 'p2'];

  const draw = () => {
    clearTimers(); active = null;
    const cur = phase === 'practice' ? 'p' + pi : phase;
    const idx = phase === 'done' ? steps.length : tech === 'hiddenSingleBox' ? Math.min(5, S.searchBox.rung - 1) : steps.indexOf(cur);
    app.innerHTML = `
      <header class="bar">
        ${tech === 'hiddenSingleBox' && phase === 'practice' ? '<span></span>' : '<a class="icon-btn" href="#/learn" aria-label="Close">✕</a>'}
        <div class="progress">${steps.map((s, k) => `<i class="${k < idx ? 'full' : k === idx ? 'now' : ''}"></i>`).join('')}</div>
        <span class="belt-chip small" style="--belt:${belt.color}"></span>
      </header>
      <main class="page lesson" id="lp"></main>`;
    const root = $('#lp');
    if (phase === 'intro') {
      root.innerHTML = `
        <div class="intro pop-in">
          <div class="big-ic">${L.icon}</div>
          <p class="eyebrow">${belt.name} · Lesson ${LESSON_ORDER.indexOf(tech) + 1} of ${LESSON_ORDER.length}</p>
          <h1>${L.title}</h1>
          ${L.idea.map(p => `<p>${md(p)}</p>`).join('')}
          ${L.analogy ? `<div class="analogy"><span>💡</span><p>${md(L.analogy)}</p></div>` : ''}
          <h3>What to look for</h3>
          <ul class="look">${L.lookFor.map(x => `<li>${md(x)}</li>`).join('')}</ul>
          ${tech === 'hiddenSingleBox' ? '' : `<p class="muted small"><strong>R4C7</strong> means row 4, column 7. Boxes are numbered like a phone keypad ${keypadMap}</p>`}
          <button class="btn primary wide" id="next">${isNotes ? "Let's write some notes →" : isScan ? 'Try the routine →' : 'Show me on a real puzzle →'}</button>
        </div>`;
      $('#next').onclick = () => { phase = isNotes ? 'notes' : isScan ? 'scan' : tech === 'hiddenSingleBox' ? 'practice' : 'watch'; draw(); };
    } else if (phase === 'notes') {
      notesExercise(root, bank[0], r => { results.push(r); phase = 'done'; finish(); draw(); });
    } else if (phase === 'scan') {
      root.innerHTML = `<p class="task-head">Place <strong>8 digits</strong> using the routine. No timer.</p><div id="task"></div>`;
      scanDrill($('#task'), pick(BANK.tiers.gentle), 8, r => { results.push(r); phase = 'done'; finish(); draw(); });
    } else if (phase === 'watch') {
      const st = posState(bank[0]);
      const step = E.findAll(st, tech)[0];
      root.innerHTML = `
        <div class="play-layout">
          <div class="board-wrap">${boardFrame('board', 9, true)}</div>
          <div class="side">
            <div class="coach"><span class="owl">🦉</span><div class="bubble" id="say"></div></div>
            <div class="row gap"><button class="btn ghost" id="back">← Back</button><button class="btn primary grow" id="fwd"></button></div>
          </div>
        </div>`;
      const board = new Board($('#board'), () => {});
      const show = () => {
        const lines = [`Let's find a **${L.title}** together. ${L.nudge}`, step.hint, step.text];
        const lv = [0, 2, 3][beat];
        $('#say').innerHTML = `<p class="beat">Step ${beat + 1} of 3</p>${md(lines[beat])}${legend(step, lv)}`;
        board.render({ grid: st.grid, givens: st.grid.map(Boolean), notes: placing ? null : st.cands, step, level: lv });
        if (beat === 2) { (step.place.length ? step.place : step.elim).forEach((p, k) => board.pulse(p.cell, 'pop', k)); sfx('good'); }
        $('#back').disabled = beat === 0;
        $('#fwd').textContent = beat === 2 ? 'Your turn →' : 'Next';
      };
      $('#back').onclick = () => { beat = Math.max(0, beat - 1); show(); };
      $('#fwd').onclick = () => { if (beat < 2) { beat++; show(); } else { phase = 'practice'; draw(); } };
      show();
    } else if (phase === 'practice') {
      root.innerHTML = `${tech === 'hiddenSingleBox' ? '' : `<p class="task-head">Your turn · <strong>${pi + 1} of 3</strong></p>`}<div id="task"></div>`;
      if (tech === 'hiddenSingleBox') {
        mountSearch($('#task'), { grid: E.parse(practice[pi % practice.length].g), progress: S.searchBox,
          persist: p => { S.searchBox = p; save(); },
          onExit: () => go('#/learn'),
          onRep: () => { pi++; draw(); },
          onPlace: r => { results.push(r); pi++; if (S.searchBox.rung >= 7) { phase = 'done'; finish(); } draw(); },
        });
        return;
      }
      mountTask($('#task'), {
        pos: practice[pi], tech, labeled: true,
        onDone: r => { results.push(r); pi++; phase = pi >= practice.length ? 'done' : 'practice'; if (phase === 'done') finish(); draw(); },
      });
    } else {
      const st = S.lessons[tech], nl = nextLesson();
      root.innerHTML = `
        <div class="intro center pop-in">
          <div class="big-ic">🎉</div>
          <h1>${L.title} learned!</h1>
          <p class="stars huge">${stars(st.stars)}</p>
          <p>${st.lastSolo ? '<span class="solo">Solved on your own 🏅</span>' : '<span class="muted">Done with a little help. That is how learning works. Replay any time to try it solo.</span>'}</p>
          <div class="row gap center">
            ${isNotes ? '' : `<a class="btn ghost" href="${isScan ? '#/scan' : `#/gym/${tech}`}">Practice more</a>`}
            ${nl ? `<a class="btn primary" href="#/lesson/${nl}">Next: ${LESSONS[nl].title}</a>` : `<a class="btn primary" href="#/play">Play a puzzle</a>`}
          </div>
        </div>`;
    }
  };

  // Stars measure accuracy only. Hints never cost stars; solving without them earns a separate medal.
  const finish = () => {
    const beltsBefore = beltsEarned().length;
    const worst = Math.max(...results.map(r => r.mistakes));
    const score = worst === 0 ? 3 : worst <= 2 ? 2 : 1;
    const solo = results.every(r => !r.hints && !r.mistakes);
    const prev = S.lessons[tech];
    S.lessons[tech] = { done: true, stars: Math.max(prev?.stars || 0, score), solo: !!(prev?.solo || solo), lastSolo: solo };
    if (!L.kind) S.reviews[tech] = H.review(S.reviews[tech], solo, today());
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

// ================= NOTES LESSON: write notes by hand =================
function notesExercise(root, pos, onDone) {
  const grid = E.parse(pos.g), G = E.G9, basic = E.basicCandidates(grid);
  const fits = i => !grid[i] && E.popcount(basic[i]) >= 2 && E.popcount(basic[i]) <= 4;
  let targets = [];
  for (const u of G.BOXES) { const c = G.UNITS[u].filter(fits); if (c.length >= 3) { targets = c.slice(0, 3); break; } }
  if (!targets.length) targets = grid.map((_, i) => i).filter(fits).slice(0, 3);
  const notes = Array(81).fill(0);
  let t = 0, mistakes = 0, stage = 'write', errors = new Set();

  root.innerHTML = `
    <div class="play-layout">
      <div class="board-wrap">${boardFrame('nb', 9, true)}</div>
      <div class="side">
        <div class="coach"><span class="owl">🦉</span><div class="bubble" id="say"></div></div>
        ${numpad(9, 'Tap digits to add or remove notes.')}
        <div class="check-row"><button class="btn ghost grow" id="clear">Clear</button><button class="btn primary grow" id="check">Check</button></div>
      </div>
    </div>`;
  const board = new Board($('#nb', root), () => {});
  const say = h => { $('#say', root).innerHTML = h; };
  const render = () => board.render({ grid, givens: grid.map(Boolean), notes: stage === 'write' ? notes : basic, selected: stage === 'write' ? targets[t] : -1, errors, peers: true });
  const ask = () => say(`<p class="beat">Cell ${t + 1} of ${targets.length}</p>What could go in <strong>${G.cellName(targets[t])}</strong>? Its row, column and box are shaded. Add every digit none of them has.`);

  root.querySelectorAll('.key').forEach(k => k.onclick = () => {
    if (stage !== 'write') return;
    notes[targets[t]] ^= E.bit(+k.dataset.d); errors = new Set(); sfx('tap'); render();
  });
  $('#clear', root).onclick = () => { notes[targets[t]] = 0; render(); };
  $('#check', root).onclick = () => {
    if (stage === 'outro') return onDone({ mistakes, hints: 0 });
    const cell = targets[t], have = notes[cell], want = basic[cell];
    const extra = E.digitsOf(have & ~want), missing = E.digitsOf(want & ~have);
    if (extra.length) {
      const d = extra[0], clash = G.PEERS[cell].find(p => grid[p] === d);
      const where = G.ROW[clash] === G.ROW[cell] ? 'row' : G.COL[clash] === G.COL[cell] ? 'column' : 'box';
      mistakes++; sfx('bad'); board.pulse(cell, 'shake'); errors = new Set([clash]); render();
      return say(`<span class="bad">Not quite.</span> <strong>${d}</strong> can't go here: there's already a ${d} at <strong>${G.cellName(clash)}</strong>, in the same ${where}. Tap ${d} to remove it.`);
    }
    if (missing.length) {
      mistakes++; sfx('bad'); board.pulse(cell, 'shake');
      return say(`<span class="bad">Almost.</span> You're missing <strong>${list(missing)}</strong>. Nothing in this cell's row, column or box has ${missing.length > 1 ? 'those digits' : 'that digit'} yet, so ${missing.length > 1 ? 'they are' : 'it is'} still possible.`);
    }
    sfx('good'); board.pulse(cell, 'pop');
    if (++t < targets.length) { render(); ask(); return; }
    stage = 'outro'; render();
    board.cells.forEach((c, i) => !grid[i] && board.pulse(i, 'pop', (i % 9) + ((i / 9) | 0)));
    say(`<span class="good">You've got it!</span> Now every empty cell has its notes. Writing them all by hand is slow, so in games you can tap <strong>▦ Fill notes</strong> to do it for you.<br><br>Remember: <strong>removing a note never fills a cell.</strong> It only means "not this one". Next lesson, Pointing Pair, is your first way to remove notes with logic.`);
    $('#check', root).textContent = 'Finish lesson →';
    $('#clear', root).classList.add('hidden');
  };
  const list = a => (a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a.at(-1));
  render(); ask();
}

// ================= SCANNING ROUTINE: place digits in the order a fast solver looks =================
// Any provable digit is accepted; the coach just says where the routine would look next.
// Help fades: the first few prompts name the exact row or digit, later ones only name the step.
function scanDrill(root, puz, goal, onDone) {
  const st = E.newState(E.parse(puz.p)), sol = E.parse(puz.s), givens = st.grid.map(Boolean), G = E.G9;
  let sel = -1, spot = 0, last = -1, placed = 0, mistakes = 0, hints = 0, hintLv = 0, plan, shown = null, level = 0, errors = new Set();
  root.innerHTML = `
    <div class="play-layout">
      <div class="board-wrap">${boardFrame('sb', 9, true)}</div>
      <div class="side">
        <ol class="routine" id="routine"><li data-m="area">Nearly full</li><li data-m="digit">One digit</li><li data-m="follow">Follow up</li></ol>
        <div class="coach"><span class="owl">🦉</span><div class="bubble" id="say"></div></div>
        ${numpad(9, 'Tap a cell, then its digit. Tap a digit first to light up every copy.')}
        <div class="row gap tools-row"><button class="btn ghost grow" id="hint">💡 Hint</button><button class="btn ghost hidden" id="guide">Search with me</button></div>
      </div>
    </div>`;
  const board = new Board($('#sb', root), i => { sel = i; spot = st.grid[i] || spot; sfx('tap'); render(); });
  const say = h => { $('#say', root).innerHTML = `<p class="beat">${placed} of ${goal} placed</p>${h}`; };
  const render = () => board.render({ grid: st.grid, givens, notes: null, selected: sel, spot, step: shown, level, errors, peers: S.settings.peers });
  const prompt = () => {
    const s = plan.step, specific = placed < 3 || hintLv > 0, d = st.grid[last];
    root.querySelectorAll('#routine li').forEach(li => li.classList.toggle('on', li.dataset.m === plan.mode || (plan.mode === 'cell' && li.dataset.m === 'digit')));
    const back = plan.quiet ? `Nothing new near your ${d}. <strong>Back to step 1.</strong> ` : '';
    shown = null; level = 0;
    if (last >= 0) return say(followUpPrompt(st.grid, last));
    if (plan.mode === 'area') return say(`${back}<strong>Step 1 · Nearly full areas.</strong> ${specific ? `<strong>${cap(G.unitName(plan.unit))}</strong> has only ${plan.gaps} empty cell${plan.gaps > 1 ? 's' : ''}. Which digit fits?` : 'Find a row, column or box with just one or two gaps.'}`);
    if (plan.mode === 'digit') return say(`${back}<strong>Step 2 · One digit at a time.</strong> ${specific ? `Try the <strong>${plan.digit}s</strong>: tap ${plan.digit} on the keypad to light them up, then find a box missing a ${plan.digit} with only one spot left.` : 'Pick the digit you see most. Light it up and check every box that is missing it.'}`);
    say(`${back}<strong>Crowded cell.</strong> No quick scan works here. Find a cell whose row, column and box already hold eight different digits.`);
  };
  const next = () => {
    hintLv = 0; errors = new Set();
    plan = E.scanPlan(st, last);
    if (!plan || placed >= goal) return onDone({ mistakes, hints, placed });
    prompt(); render();
    if (last >= 0) { $('#guide', root).classList.remove('hidden'); guide(); }
  };
  const wrong = (msg, cell) => { mistakes++; sfx('bad'); board.pulse(cell, 'shake'); say(`<span class="bad">Not quite.</span> ${md(msg)}`); };
  const cap = s => s[0].toUpperCase() + s.slice(1);

  function input(d) {
    if (sel < 0 || st.grid[sel]) { spot = spot === d ? 0 : d; sfx('tap'); render(); return; }
    const hit = plan.singles.find(s => s.place[0].cell === sel && s.place[0].digit === d);
    if (hit) {
      const followed = plan.mode === 'follow' && hit.units.some(u => plan.units.includes(u));
      E.applyStep(st, hit); last = sel; placed++; spot = d; sel = -1;
      sfx('place'); board.pulse(last, 'pop');
      if (followed) toast('Follow-up spotted 👍');
      return next();
    }
    const clash = G.PEERS[sel].find(p => st.grid[p] === d);
    if (clash !== undefined) {
      errors = new Set([clash]); render(); setTimeout(() => { errors = new Set(); render(); }, 900);
      return wrong(`There's already a ${d} at **${G.cellName(clash)}**, in the same ${G.ROW[clash] === G.ROW[sel] ? 'row' : G.COL[clash] === G.COL[sel] ? 'column' : 'box'}.`, sel);
    }
    if (sol[sel] === d) { sfx('tap'); return say(`True, <strong>${d}</strong> goes there. But nothing proves it yet, so a real solver wouldn't place it. Look for a forced one.`); }
    wrong(`Nothing forces **${d}** into **${G.cellName(sel)}** yet. That cell could still be ${E.digitsOf(st.cands[sel]).join(', ')}.`, sel);
  }
  const guide = () => openSearch(st.grid, { digit: st.grid[last] || 0,
    onPlace: r => { hints += r.hints; mistakes += r.mistakes; sel = r.cell; input(r.digit); },
  });
  $('#guide', root).onclick = guide;
  $('#hint', root).onclick = () => {
    hintLv = Math.min(3, hintLv + 1); hints++;
    if (hintLv === 2 && last >= 0) return guide();
    if (hintLv === 1) prompt();
    else { shown = plan.step; level = hintLv; say(`<p class="beat">Hint ${hintLv} of 3</p>${md(hintLv === 2 ? plan.step.hint : plan.step.text)}${legend(plan.step, level)}`); }
    render();
  };
  root.querySelectorAll('.key').forEach(k => k.onclick = () => input(+k.dataset.d));
  active = {
    key(e) {
      if (/^[1-9]$/.test(e.key)) input(+e.key);
      else if (e.key === 'h') $('#hint', root).click();
      else { const m = moveSel(sel, e.key, 9); if (m !== null) { e.preventDefault(); sel = m; render(); } }
    },
  };
  next();
}

function screenScan() {
  let round = 0;
  const draw = () => {
    clearTimers(); active = null;
    app.innerHTML = `
      <header class="bar"><a class="icon-btn" href="#/gym" aria-label="Back">←</a><div class="bar-title">🔎 Scanning drill <small>no timer</small></div><a class="icon-btn" href="#/lesson/scan" aria-label="Re-read the lesson">📖</a></header>
      <main class="page lesson"><div id="task"></div></main>`;
    scanDrill($('#task'), pick(BANK.tiers[round % 2 ? 'easy' : 'gentle']), 12, r => {
      clearTimers(); active = null; round++;
      const solo = !r.hints && !r.mistakes;
      award(solo ? 12 : 6, 'scanning');
      sfx('win');
      overlay(`<div class="center"><div class="big-ic">🔎</div><h1>${r.placed} placed</h1><p class="muted">${solo ? 'All on your own 🏅' : `${r.mistakes} slip${r.mistakes === 1 ? '' : 's'} · ${r.hints} hint${r.hints === 1 ? '' : 's'}`}</p>
        <div class="row gap center"><button class="btn ghost" data-a="out">Done</button><button class="btn primary" data-a="again">Again</button></div></div>`,
        (o, close) => {
          o.querySelector('[data-a=out]').onclick = () => { close(); go('#/gym'); };
          o.querySelector('[data-a=again]').onclick = () => { close(); draw(); };
        });
    });
  };
  draw();
}

// ================= TASK: find one move on a real position =================
// Lesson practice, technique practice, Rush and Today's practice all use this.
// mystery: the technique isn't named; any valid move a known technique gives is accepted.
function mountTask(root, { pos, tech, onDone, rush = false, mystery = false, labeled = false, onWrong }) {
  const placing = E.PLACING.has(tech);
  const st = posState(pos), n = Math.sqrt(st.grid.length), G = E.geoOf(st.grid.length);
  const inst = mystery
    ? E.TECH_ORDER.filter(t => E.PLACING.has(t) === placing).flatMap(t => E.findAll(st, t))
    : E.findAll(st, tech);
  const grid = st.grid.slice(), givens = st.grid.map(Boolean), struck = Array(G.size).fill(0);
  const elimSet = new Set(inst.flatMap(s => s.elim.map(e => e.cell * 10 + e.digit)));
  let sel = -1, spot = 0, hintLv = 0, mistakes = 0, done = false, shown = null, level = 0, errors = new Set();
  const title = t => LESSONS[t].title;

  root.innerHTML = `
    <div class="play-layout">
      <div class="board-wrap">${boardFrame('tb', n, labeled || mystery)}</div>
      <div class="side">
        <div class="coach"><span class="owl">🦉</span><div class="bubble" id="say"></div></div>
        ${numpad(n, placing ? 'Tap a cell, then its digit.' : 'Tap a cell, then the note to cross out.')}
        <div class="row gap tools-row">
          ${rush ? '' : '<button class="btn ghost grow" id="hint">💡 Hint</button>'}
          <button class="btn primary grow hidden" id="cont">Continue →</button>
        </div>
      </div>
    </div>`;
  const board = new Board($('#tb', root), i => tap(i));
  const say = html => { $('#say', root).innerHTML = html; };
  const head = rush ? `<p class="find">${LESSONS[tech].icon} ${title(tech)}</p>` : '';
  const intro = mystery
    ? `Find the next move. ${placing ? 'A cell can be filled. Which one?' : "No cell can be filled yet, but some notes can be crossed out. Find a pattern you know."} No technique name this time: you choose.`
    : `Find a <strong>${title(tech)}</strong>. ${placing ? 'Place the digit it gives you.' : 'Cross out every note it removes.'}`;
  say(rush ? head : intro);

  const notes = () => (placing ? null : st.cands.map((m, i) => m & ~struck[i]));
  const render = () => board.render({ grid, givens, notes: notes(), struck: placing ? null : struck, selected: sel, spot, step: shown, level, errors, peers: S.settings.peers });
  const progress = s => s.elim.filter(e => E.has(struck[e.cell], e.digit)).length;
  const bestInst = () => inst.slice().sort((a, b) => progress(b) - progress(a))[0];
  const flashRegion = s => { shown = s; level = 2; render(); setTimeout(() => { if (!done && shown === s && hintLv < 2) { shown = null; level = 0; render(); } }, 1600); };

  function tap(i) {
    if (done) return;
    sel = i; spot = grid[i] || (S.settings.quick ? spot : 0);
    sfx('tap'); render();
  }
  function wrong(msg, cell) {
    mistakes++; sfx('bad'); board.pulse(cell, 'shake');
    onWrong?.();
    say(`${head}<span class="bad">Not quite.</span> ${md(msg)}`);
  }
  function success(step) {
    done = true; shown = step; level = 3; errors = new Set();
    sfx('good'); render();
    (step.place.length ? step.place : step.elim).forEach((p, k) => board.pulse(p.cell, 'pop', k));
    if (rush) { setTimeout(() => onDone({ mistakes, hints: hintLv, tech: step.tech }), 650); return; }
    const named = mystery ? `That was a <strong>${title(step.tech)}</strong> ${LESSONS[step.tech].icon}. ` : '';
    say(`<span class="good">Nailed it!</span> ${named}${md(step.text)}${legend(step, 3)}`);
    $('#cont', root).classList.remove('hidden');
    $('#hint', root)?.classList.add('hidden');
  }
  // Why a crossed-out note is wrong: part of the pattern, out of its reach, or a digit it doesn't touch.
  function whyNotElim(cell, d) {
    const pattern = inst.find(s => s.marks.some(m => m.role === 'key' && m.cell === cell && m.digit === d));
    if (pattern) return `That **${d}** in **${G.cellName(cell)}** is part of the pattern itself. The pattern removes ${d}s from the other cells around it.`;
    const sameDigit = inst.find(s => s.elim.some(e => e.digit === d));
    if (sameDigit) {
      flashRegion(sameDigit);
      const reach = sameDigit.tech === 'yWing' ? 'cells that see both pincers' : 'the shaded area';
      return `A ${mystery ? 'pattern' : title(tech)} can remove ${d}s here, but only from ${reach}. **${G.cellName(cell)}** is outside it, so its ${d} stays.`;
    }
    const ds = [...new Set(inst.flatMap(s => s.marks.filter(m => m.role === 'key').map(m => m.digit)))].sort();
    return `The **${d}** in **${G.cellName(cell)}** stays. ${mystery ? 'The pattern here' : `The ${title(tech)} here`} is about ${ds.length ? ds.join(' / ') + ' notes' : 'other digits'}, not ${d}.`;
  }
  function input(d) {
    if (done) return;
    if (sel < 0 || grid[sel]) { spot = spot === d ? 0 : d; render(); if (sel < 0) toast(`Showing every ${d}. Tap a cell to answer.`); return; }
    if (placing) {
      const hit = inst.find(s => s.place.some(p => p.cell === sel && p.digit === d));
      if (hit) { grid[sel] = d; return success(hit); }
      const clash = G.PEERS[sel].find(p => grid[p] === d);
      if (clash !== undefined) { errors = new Set([clash]); render(); setTimeout(() => { errors = new Set(); render(); }, 900); return wrong(`There's already a ${d} at **${G.cellName(clash)}**, in the same ${G.ROW[clash] === G.ROW[sel] ? 'row' : G.COL[clash] === G.COL[sel] ? 'column' : 'box'}.`, sel); }
      if (st.sol[sel] === d) { sfx('tap'); return say(`${head}True, **${d}** is right there. But you can't prove it ${mystery ? 'yet' : `with a ${title(tech)} yet`}. Look for a different cell.`.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')); }
      const left = E.digitsOf(E.basicCandidates(grid)[sel]);
      return wrong(`Nothing forces **${d}** into **${G.cellName(sel)}** yet. That cell could still be ${left.join(', ')}.`, sel);
    }
    if (!E.has(st.cands[sel], d)) return toast(`No ${d} note in that cell.`);
    if (E.has(struck[sel], d)) return toast('Already crossed out.');
    if (!elimSet.has(sel * 10 + d)) return wrong(whyNotElim(sel, d), sel);
    struck[sel] |= E.bit(d); spot = d;
    sfx('place'); board.pulse(sel, 'pop'); render();
    const full = inst.find(s => s.elim.every(e => E.has(struck[e.cell], e.digit)));
    if (full) success(full);
    else say(`${head}<span class="good">Yes!</span> Keep going: what else does it remove?`);
  }
  function hint() {
    if (done) return;
    hintLv = Math.min(3, hintLv + 1);
    shown = bestInst();
    level = hintLv === 1 ? 0 : hintLv;
    const L = LESSONS[shown.tech];
    const first = mystery ? `Try a **${L.title}** ${L.icon}. ${L.nudge}` : L.nudge;
    say(`<p class="beat">Hint ${hintLv} of 3</p>${md([first, shown.hint, shown.text][hintLv - 1])}${legend(shown, level)}`);
    render();
  }

  root.querySelectorAll('.key').forEach(k => k.onclick = () => input(+k.dataset.d));
  $('#hint', root) && ($('#hint', root).onclick = hint);
  $('#cont', root).onclick = () => onDone({ mistakes, hints: hintLv, tech: shown?.tech || tech });
  active = {
    key(e) {
      if (/^[1-9]$/.test(e.key) && +e.key <= n) input(+e.key);
      else if (e.key === 'h') hint();
      else if (e.key === 'Enter' && done && !rush) $('#cont', root).click();
      else { const m = moveSel(sel, e.key, n); if (m !== null) { e.preventDefault(); tap(m); } }
    },
  };
  render();
}

// ================= TODAY'S PRACTICE =================
function screenDaily() {
  const picks = H.pickDaily(learnedTechs(), S.reviews, today(), 5);
  const results = [];
  const draw = () => {
    clearTimers(); active = null;
    const k = results.length, t = picks[k];
    app.innerHTML = `
      <header class="bar">
        <a class="icon-btn" href="#/learn" aria-label="Close">✕</a>
        <div class="progress">${picks.map((_, i) => `<i class="${i < k ? 'full' : i === k ? 'now' : ''}"></i>`).join('')}</div>
        <span></span>
      </header>
      <main class="page lesson"><p class="task-head">Today's practice · <strong>move ${k + 1} of ${picks.length}</strong></p><div id="task"></div>
      ${k ? '<div class="row center"><button class="btn link" id="stop">Finish for today ✓</button></div>' : ''}</main>`;
    mountTask($('#task'), {
      pos: pick(BANK.lessons[t]), tech: t, mystery: true,
      onDone: r => {
        const solo = !r.hints && !r.mistakes;
        S.reviews[r.tech] = H.review(S.reviews[r.tech], solo, today());
        results.push({ ...r, solo });
        award(solo ? 6 : 3, solo ? 'on your own' : 'practice');
        if (results.length >= picks.length) summary(); else draw();
      },
    });
    $('#stop') && ($('#stop').onclick = summary);
  };
  const summary = () => {
    clearTimers(); active = null;
    const solo = results.filter(r => r.solo).length;
    const text = `Sudoku Belts 🥋 Today: ${results.length} move${results.length === 1 ? '' : 's'}, ${solo} on my own · 🔥 ${streakNow()}-day streak\n${results.map(r => (r.solo ? '🟩' : '🟨')).join('')}`;
    app.innerHTML = `
      <header class="bar"><a class="icon-btn" href="#/learn">✕</a><div class="bar-title">Today's practice</div><span></span></header>
      <main class="page lesson"><div class="intro center pop-in">
        <div class="big-ic">✅</div>
        <h1>Practised today!</h1>
        <p class="muted">${results.length} move${results.length === 1 ? '' : 's'} · ${solo} on your own</p>
        <div class="summary-dots">${results.map(r => `<span title="${LESSONS[r.tech].title}">${r.solo ? '🟩' : '🟨'}</span>`).join('')}</div>
        <div class="card" style="display:inline-block;margin-bottom:14px">${weekHtml()}<p class="week-meta">${weekCount()} of ${S.settings.goal} days this week · 🔥 ${streakNow()}</p></div>
        <p class="small muted">🟩 on your own · 🟨 with a hint or a slip. Techniques you needed help with come back sooner.</p>
        <div class="row gap center"><button class="btn ghost" id="share">Share</button><a class="btn primary" href="#/play">Daily puzzle →</a></div>
      </div></main>`;
    sfx('win'); confetti(0.8);
    $('#share').onclick = () => share(text);
  };
  draw();
}

async function share(text) {
  const full = `${text}\n${hasNativeBridge() ? 'https://sudoku-dojo-eight.vercel.app/' : appUrl('../')}`;
  try {
    if (await shareResult(full) === 'copied') toast('Copied. Paste it anywhere.');
  } catch { /* cancelled */ }
}

// ================= PRACTICE (technique gym) =================
const gymOf = t => S.gym[t] || { n: 0, ids: [] };
function screenGym() {
  shell('gym', `
    <a class="rush-card" href="#/daily" style="background:linear-gradient(135deg,#2F5BD3,#7B5BE0)">
      <div><p class="eyebrow">🧭 Mixed practice</p><h2>Mystery moves</h2><p>Find the next move without being told which technique. This is what real puzzles feel like.</p></div>
      <div class="rush-best"><small>Week</small><strong>${weekCount()}</strong></div>
    </a>
    <a class="rush-card" href="#/scan" style="margin-top:10px;background:linear-gradient(135deg,#1F8A70,#3FA34D)">
      <div><p class="eyebrow">🔎 Find moves faster</p><h2>Scanning drill</h2><p>Place 12 digits on a real puzzle with the 3-step routine. No timer.</p></div>
      <div class="rush-best"><small>Steps</small><strong>3</strong></div>
    </a>
    <a class="rush-card" href="#/rush" style="margin-top:10px">
      <div><p class="eyebrow">⚡ Speed drill</p><h2>Technique Rush</h2><p>90 seconds. Best once a technique already feels easy. Untimed warm-up included.</p></div>
      <div class="rush-best"><small>Best</small><strong>${S.rushBest}</strong></div>
    </a>
    <h2 class="sec-title">Practice one technique</h2>
    <p class="muted">Each technique has 30 real puzzle positions where it's the move to find.</p>
    <div class="gym-grid">
      ${E.TECH_ORDER.map(t => {
        const L = LESSONS[t], b = beltForTech(t), u = gymOf(t).ids.length;
        return `<a class="gym-card" href="#/gym/${t}" style="--belt:${b.color}">
          <span class="node-ic">${L.icon}</span><strong>${L.title}</strong>
          <small>${u ? `${u} of 30 done` : L.tagline}</small>
          <span class="meter"><i style="width:${(u / 30) * 100}%"></i></span>
        </a>`;
      }).join('')}
    </div>`);
}

function screenGymTech(tech) {
  const L = LESSONS[tech];
  if (!L || !BANK.lessons[tech]) return go('#/gym');
  const bank = BANK.lessons[tech], seen = () => new Set(gymOf(tech).ids);
  // new positions first, then repeats
  const order = [...shuffle(bank.map((_, i) => i).filter(i => !seen().has(i))), ...shuffle(bank.map((_, i) => i).filter(i => seen().has(i)))];
  let k = 0;
  const draw = () => {
    clearTimers(); active = null;
    const idx = order[k % order.length];
    app.innerHTML = `
      <header class="bar">
        <a class="icon-btn" href="#/gym" aria-label="Back">←</a>
        <div class="bar-title">${L.icon} ${L.title} <small>${seen().size} of ${bank.length} done${seen().has(idx) ? ' · repeat' : ''}</small></div>
        <a class="icon-btn" href="#/lesson/${tech}" aria-label="Re-read the lesson">📖</a>
      </header>
      <main class="page lesson"><div id="task"></div><div class="row center"><button class="btn link" id="skip">Skip this one →</button></div></main>`;
    mountTask($('#task'), {
      pos: bank[idx], tech, labeled: true,
      onDone: r => {
        const g = gymOf(tech);
        S.gym[tech] = { n: g.n + 1, ids: g.ids.includes(idx) ? g.ids : [...g.ids, idx] };
        S.reviews[tech] = H.review(S.reviews[tech], !r.hints && !r.mistakes, today());
        award(r.hints ? 2 : 5);
        k++; draw();
      },
    });
    $('#skip').onclick = () => { k++; draw(); };
  };
  draw();
}

// ================= MISSED MOMENTS =================
function screenBlind() {
  const blind = C.blindSpot(S.coach.stats);
  const moments = S.coach.moments.slice().sort((a, b) => Number(b.kind === blind?.kind) - Number(a.kind === blind?.kind));
  let k = 0, lastTech = blind ? C.kindTech(blind.kind) : moments[0]?.tech || 'hiddenSingleLine';
  const draw = () => {
    clearTimers(); active = null;
    app.innerHTML = `<header class="bar"><a class="icon-btn" href="#/me" aria-label="Back">←</a><div class="bar-title">🎯 Your missed moments</div><span></span></header>
      <main class="page lesson">${moments[k] ? `<p class="task-head">A move you missed · <strong>${k + 1} of ${moments.length}</strong></p>` : ''}<div id="task"></div></main>`;
    const m = moments[k];
    if (!m) {
      $('#task').innerHTML = `<div class="intro center pop-in"><div class="big-ic">✅</div><h1>All caught up</h1><p class="muted">No missed moves left to replay. Play a puzzle and your coach will save the next ones.</p><div class="row gap center"><a class="btn ghost" href="#/gym/${lastTech}">Practice ${LESSONS[lastTech].title}</a><a class="btn primary" href="#/play">Play a puzzle</a></div></div>`;
      return;
    }
    lastTech = m.tech;
    mountTask($('#task'), {
      pos: { g: m.g, x: [], s: m.s }, tech: m.tech, labeled: true,
      onDone: r => {
        S.coach.stats = C.record(S.coach.stats, m.kind, r.hints ? 'hint' : 'found', 0);
        S.coach.moments = S.coach.moments.filter(v => v !== m);
        S.reviews[m.tech] = H.review(S.reviews[m.tech], !r.hints && !r.mistakes, today());
        award(r.hints ? 2 : 5);
        k++; draw();
      },
    });
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
        <button class="btn ghost wide" id="warm" style="margin-top:10px">🧘 Warm up first (no timer)</button>
        <p class="muted small">Same moves, no clock. Hints are on and every answer is explained.</p>
      </div></main>`;
    $('#go').onclick = run;
    $('#warm').onclick = warm;
  };
  // Untimed warm-up: hints on, explanations stay until you tap Continue.
  const warm = () => {
    let found = 0, solo = 0;
    const next = () => {
      clearTimers(); active = null;
      const t = pick(techs);
      app.innerHTML = `
        <header class="bar"><a class="icon-btn" href="#/gym">✕</a><div class="bar-title">🧘 Warm-up <small>${found} found · ${solo} on your own</small></div><span></span></header>
        <main class="page lesson"><p class="task-head">${LESSONS[t].icon} ${LESSONS[t].title}</p><div id="task"></div>
        <div class="row gap center"><button class="btn link" id="skip">Skip →</button><button class="btn link" id="go">⏱️ Start the timed run</button></div></main>`;
      mountTask($('#task'), {
        pos: pick(BANK.lessons[t]), tech: t, labeled: true,
        onDone: r => {
          found++; if (!r.hints && !r.mistakes) solo++;
          S.reviews[r.tech] = H.review(S.reviews[r.tech], !r.hints && !r.mistakes, today());
          award(r.hints ? 2 : 5);
          next();
        },
      });
      $('#skip').onclick = next;
      $('#go').onclick = run;
    };
    next();
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
      const t = pick(techs);
      mountTask($('#task'), {
        pos: pick(BANK.lessons[t]), tech: t, rush: true,
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
    <h2 class="sec-title">Classic 9×9</h2>
    <div class="tiers">${TIERS.map(tierCard).join('')}</div>
    <button class="daily" id="daily" style="margin-top:10px"><span class="big-ic sm">📅</span><span><strong>Daily puzzle</strong><small>${dailyDone ? 'Done today ✓ · play again for fun' : 'A fresh Medium every day'}</small></span></button>
    <h2 class="sec-title">Mini 6×6 <span class="pill">quick</span></h2>
    <p class="muted">Digits 1–6, boxes of 2×3. A full game in 2–5 minutes, great for warming up.</p>
    <div class="tiers">
      ${tierCard({ id: 'mini-quick', name: 'Mini · Quick', belt: 'white', desc: 'Extra clues. Just look and place.' })}
      ${tierCard({ id: 'mini-tricky', name: 'Mini · Tricky', belt: 'yellow', desc: 'Fewer clues. May need note-based moves.' })}
    </div>
    <details class="tips"><summary>⚡ How to get faster</summary>
      <ol>
        <li><strong>Scan by digit, not by cell.</strong> Tap a digit on the keypad and every copy lights up. Look for boxes that are missing it.</li>
        <li><strong>Start with the digit that's on the board most.</strong> It has the fewest places left, so its singles jump out.</li>
        <li><strong>Turn on Quick fill</strong> (⚡ in the toolbar). Tap a digit once, then tap cell after cell to drop it.</li>
        <li><strong>Only write notes when singles run out.</strong> The first half of most puzzles needs none.</li>
        <li><strong>Do Today's practice.</strong> Mixed "mystery moves" train you to pick the right technique.</li>
        <li><strong>Keyboard:</strong> 1–9 to place, Shift+digit for a note, arrows to move, N notes, Z undo, H hint, Q quick fill.</li>
      </ol>
    </details>
    <details class="tips"><summary>🧰 What the tools do</summary>
      <ol>
        <li><strong>Tap a cell, then a digit</strong> to place it.</li>
        <li><strong>✎ Notes</strong>: while it's on, digits go in as small notes instead.</li>
        <li><strong>▦ Fill notes</strong>: writes every possible note for you. Notes you already crossed out stay crossed out.</li>
        <li><strong>⚡ Quick</strong>: tap a digit first, then tap cells to drop it.</li>
        <li><strong>💡 Hint</strong>: 1st tap names a technique, 2nd shows where, 3rd explains and can apply it.</li>
        <li>Small numbers under the keypad digits show how many of that digit are still to place.</li>
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
      startGame(t, pick(pool), { name: TIERS.find(x => x.id === t).name }, true);
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
  const coaching = n === 9;
  g.lastAt ??= g.time;
  const resetStall = () => { g.lastAt = g.time; g.coachStalled = false; };
  const coachEvent = (kind, outcome, secs = 0, tech = C.kindTech(kind)) => {
    S.coach.stats = C.record(S.coach.stats, kind, outcome, secs);
    if (outcome !== 'found') {
      // Replays use basic notes, so only save positions that still prove this move.
      if (E.findAll(E.newState(g.grid), tech).some(step => C.stepKind(step) === kind)) S.coach.moments = C.addMoment(S.coach.moments,
        { g: E.stringify(g.grid), s: g.s, tech, kind, date: Date.now() });
    }
  };
  let sel = -1, spot = 0, notesMode = false, lock = 0, hintStep = null, hintLv = 0, hintCands = null, searchHinted = false;
  const tierXp = (TIERS.find(t => t.id === g.tier)?.xp) ?? (g.tier === 'mini-quick' ? 8 : 15);

  app.innerHTML = `
    <header class="bar">
      <a class="icon-btn" href="#/play" aria-label="Back">←</a>
      <div class="bar-title">${g.name}<small><span id="clock">${fmt(g.time)}</span> · <span id="miss"></span></small></div>
      <button class="icon-btn" id="restart" title="Restart">↺</button>
    </header>
    <main class="page game">
      <div class="play-layout">
        <div class="board-wrap">${boardFrame('gb', n)}</div>
        <div class="side">
          <div class="coach hidden" id="coach"><span class="owl">🦉</span><div class="bubble"><div id="say"></div><div class="row gap" id="hint-actions"></div></div></div>
          <div class="tools">
            <button class="tool" id="undo"><span>↶</span>Undo</button>
            <button class="tool" id="erase"><span>⌫</span>Erase</button>
            <button class="tool" id="notes"><span>✎</span>Notes<i class="state"></i></button>
            <button class="tool" id="fill"><span>▦</span>Fill notes</button>
            <button class="tool" id="quick" title="Quick fill: pick a digit, then tap cells"><span>⚡</span>Quick<i class="state"></i></button>
            <button class="tool hint" id="hint"><span>💡</span>Hint</button>
            ${n === 9 ? '<button class="tool" id="guide-game">Guide me</button>' : ''}
          </div>
          ${numpad(n)}
          <p class="pad-label" id="mode"></p>
        </div>
      </div>
    </main>`;
  const board = new Board($('#gb'), i => tap(i));
  const say = (html, actions = '') => { $('#coach').classList.remove('hidden'); $('#say').innerHTML = html; $('#hint-actions').innerHTML = actions; };
  const hush = () => { $('#coach').classList.add('hidden'); hintStep = null; hintLv = 0; searchHinted = false; };

  const errors = () => {
    const e = new Set();
    for (let i = 0; i < G.size; i++) {
      const v = g.grid[i];
      if (!v || g.givens[i]) continue;
      if (S.settings.mistakes && v !== sol[i]) e.add(i);
      for (const p of G.PEERS[i]) if (g.grid[p] === v) e.add(i);
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
    $('#mode').textContent = S.settings.quick
      ? (lock ? `⚡ Quick fill: tap cells to ${notesMode ? 'note' : 'place'} ${lock}. Tap ${lock} again to stop.` : '⚡ Quick fill: pick a digit first.')
      : notesMode ? '✎ Notes on: digits go in as small notes.' : 'Tap a cell, then a digit.';
  };
  const snapshot = () => { g.hist.push({ grid: g.grid.slice(), notes: g.notes.slice() }); if (g.hist.length > 200) g.hist.shift(); };

  function tap(i) {
    if (g.done) return;
    if (S.settings.quick && lock) { sel = i; apply(i, lock); return; }
    sel = i; spot = g.grid[i] || 0;
    sfx('tap'); render();
  }
  function apply(i, d, asNote = notesMode, helped = false) {
    if (g.givens[i]) { spot = g.grid[i]; render(); return; }
    if (asNote) {
      if (g.grid[i]) return;
      snapshot(); g.notes[i] ^= E.bit(d); sfx('tap');
    } else {
      if (g.grid[i] === d) { render(); return; }
      snapshot();
      if (d === sol[i]) {
        if (coaching && !helped) {
          const kind = C.classify(g.grid, i, d);
          if (kind) coachEvent(kind, 'found', g.time - g.lastAt);
        }
        resetStall();
      }
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
  // Keeps the player's own deductions: a cell that already has notes only loses impossible ones.
  function fill() {
    snapshot();
    const c = E.basicCandidates(g.grid);
    let kept = 0;
    for (let i = 0; i < G.size; i++) if (!g.grid[i]) {
      if (g.notes[i]) { kept++; g.notes[i] &= c[i]; } else g.notes[i] = c[i];
    }
    hush(); save(); sfx('good'); render(); toast(kept ? 'Notes filled. Your crossed-out notes stay crossed out.' : 'Notes filled in');
  }
  function hint() {
    if (g.done) return;
    if (hintStep && hintLv < 3) { hintLv++; return showHint(); }
    const wrong = g.grid.findIndex((v, i) => v && !g.givens[i] && v !== sol[i]);
    if (wrong >= 0) { sel = wrong; render(); return say(`There's a mistake at <strong>${G.cellName(wrong)}</strong>. Erase it first, then ask again.`); }
    const cands = E.basicCandidates(g.grid);
    for (let i = 0; i < G.size; i++) {
      if (!g.notes[i] || g.grid[i]) continue;
      if (!E.has(g.notes[i], sol[i])) { sel = i; render(); return say(`Your notes in <strong>${G.cellName(i)}</strong> are missing the right digit. Fix them, or erase that cell's notes and tap "Fill notes".`); }
      cands[i] &= g.notes[i];
    }
    const step = E.findStep({ grid: g.grid.slice(), cands });
    if (!step) {
      const i = g.grid.findIndex(v => !v);
      say(`I'm stuck too! Here's a free one: <strong>${G.cellName(i)}</strong> is <strong>${sol[i]}</strong>.`, `<button class="btn primary sm" id="free">Place it</button>`);
      $('#free').onclick = () => apply(i, sol[i], false, true);
      return;
    }
    if (coaching && step.place.length) coachEvent(C.stepKind(step), 'hint', 0, step.tech);
    hintStep = step; hintCands = cands; hintLv = 1; g.hints++; save(); showHint();
  }
  function showHint() {
    if (n === 9 && hintStep.tech === 'hiddenSingleBox') {
      searchHinted = true;
      const { cell, digit } = hintStep.place[0];
      const unit = G.CELL_UNITS[cell].find(u => boxes.includes(u));
      const direct = E.searchFacts(g.grid, digit, unit);
      if (hintLv < 3) {
        if (hintLv === 2) {
          if (direct.remaining.length !== 1) {
            say('This move needs earlier note removals. Placed digits alone do not prove it.', '<button class="btn ghost sm" id="answer">Proof + answer</button>');
            $('#answer').onclick = () => { hintLv = 3; showHint(); };
            return render();
          }
          say('Search with me', '<button class="btn ghost sm" id="answer">Proof + answer</button>');
          $('#answer').onclick = () => { hintLv = 3; showHint(); };
          render();
          return openSearch(g.grid, { fullPuzzle: true, puzzleId: g.id || g.p, hinted: true,
            onPlace: r => { apply(r.cell, r.digit, false, true); },
          });
        }
        say(`Try scanning the ${digit}s; ${g.grid.filter(v => v === digit).length} placed.`, '<button class="btn ghost sm" id="search">Search with me</button><button class="btn ghost sm" id="answer">Proof + answer</button>');
        $('#search').onclick = () => { hintLv = 2; showHint(); };
        $('#answer').onclick = () => { hintLv = 3; showHint(); };
        return render();
      }
    }
    const L = LESSONS[hintStep.tech];
    const body = [`Try a <strong>${L.title}</strong> ${L.icon}. ${md(L.nudge)}`, md(hintStep.hint), md(hintStep.text)][hintLv - 1];
    const acts = hintLv < 3
      ? `<button class="btn ghost sm" id="more">Show more</button><a class="btn link sm" href="#/lesson/${hintStep.tech}">Learn it</a>`
      : `<button class="btn primary sm" id="applyh">Apply it</button><button class="btn ghost sm" id="dismiss">Got it</button>`;
    say(`<p class="beat">Hint ${hintLv} of 3</p>${body}${legend(hintStep, hintLv >= 2 ? hintLv : 0)}`, acts);
    $('#more') && ($('#more').onclick = () => { hintLv++; showHint(); });
    $('#dismiss') && ($('#dismiss').onclick = () => { hush(); render(); });
    $('#applyh') && ($('#applyh').onclick = () => {
      const s = hintStep, c = hintCands;
      if (s.place.length) resetStall();
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
    const blind = coaching ? C.blindSpot(S.coach.stats) : null;
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
        ${blind ? `<button class="continue" data-a="blind" style="margin:0 0 14px;text-align:left"><span>🎯</span><span><strong>Blind spot: ${C.KIND_NAMES[blind.kind]}</strong><small>Replay the moves you missed</small></span></button>` : ''}
        <div class="row gap center"><button class="btn ghost" data-a="home">Menu</button><button class="btn primary" data-a="again">Another one</button></div>
      </div>`, (o, close) => {
      o.querySelector('[data-a=blind]')?.addEventListener('click', () => { close(); go('#/blind'); });
      o.querySelector('[data-a=home]').onclick = () => { close(); go('#/play'); };
      o.querySelector('[data-a=again]').onclick = () => { close(); go('#/play'); setTimeout(() => app.querySelector(`.tier[data-tier="${g.tier}"]`)?.click(), 50); };
    }), 900);
  }

  app.querySelectorAll('.key').forEach(k => k.onclick = () => input(+k.dataset.d));
  $('#guide-game')?.addEventListener('click', () => {
    // The same validity checks as Hint run before a free-choice search.
    if (g.grid.some((v, i) => v && v !== sol[i]) || g.notes.some((m, i) => !g.grid[i] && m && !E.has(m, sol[i]))) return hint();
    if (g.done) return;
    openSearch(g.grid, { fullPuzzle: true, puzzleId: g.id || g.p, hinted: searchHinted, onPlace: r => apply(r.cell, r.digit, false, true) });
  });
  $('#undo').onclick = undo; $('#erase').onclick = erase; $('#fill').onclick = fill; $('#hint').onclick = hint;
  $('#notes').onclick = () => { notesMode = !notesMode; sfx('tap'); render(); };
  $('#quick').onclick = () => { S.settings.quick = !S.settings.quick; lock = 0; save(); sfx('tap'); render(); toast(S.settings.quick ? '⚡ Quick fill on: pick a digit, then tap cells' : 'Quick fill off'); };
  $('#restart').onclick = () => {
    if (!confirm('Restart this puzzle from the beginning?')) return;
    g.grid = E.parse(g.p); g.notes = Array(G.size).fill(0); g.hist = []; g.time = 0; g.mistakes = 0; resetStall(); hush(); save(); render();
  };
  active = {
    key(e) {
      const code = e.code.startsWith('Digit') ? +e.code.slice(5) : e.code.startsWith('Numpad') ? +e.code.slice(6) : NaN;
      if (code >= 1 && code <= n) {
        e.preventDefault();
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
    g.time++;
    if (coaching && !g.coachStalled && g.time - g.lastAt >= 45 && g.grid.every((v, i) => !v || v === sol[i])) {
      const move = C.available(g.grid)[0];
      if (move) { coachEvent(move.kind, 'stuck'); g.coachStalled = true; save(); }
    }
    $('#clock') && ($('#clock').textContent = fmt(g.time));
    if (g.time % 5 === 0) save();
  }, 1000));
  render();
}

// ================= ME =================
function screenMe() {
  const blind = C.blindSpot(S.coach.stats);
  const allTiers = [...TIERS, { id: 'mini-quick', name: 'Mini · Quick' }, { id: 'mini-tricky', name: 'Mini · Tricky' }];
  const wins = Object.values(S.wins).reduce((a, b) => a + b, 0);
  const row = (k, v) => `<div class="kv"><span>${k}</span><strong>${v}</strong></div>`;
  const toggle = (k, label, sub) => `<label class="toggle"><span><strong>${label}</strong><small>${sub}</small></span><input type="checkbox" data-k="${k}" ${S.settings[k] ? 'checked' : ''}><i></i></label>`;
  shell('me', `
    <section class="stats-hero">
      <div><small>Streak</small><strong>🔥 ${streakNow()}</strong></div>
      <div><small>XP</small><strong>⭐ ${S.xp}</strong></div>
      <div><small>Puzzles</small><strong>🧩 ${wins}</strong></div>
      <div><small>Rush best</small><strong>⚡ ${S.rushBest}</strong></div>
    </section>
    <h2 class="sec-title">Your week</h2>
    <div class="card" style="padding:16px">
      ${weekHtml()}
      <p class="week-meta" style="margin-top:8px">${weekCount()} of ${S.settings.goal} days ${weekCount() >= S.settings.goal ? '· goal reached 🎉' : ''}</p>
      <p class="muted small">Your streak allows one rest day a week. Best streak: ${S.bestStreak} · ${S.days.length} practice days in total.</p>
      <div class="goal-row"><span><strong>Weekly goal</strong></span>
        <select id="goal">${[1, 2, 3, 4, 5, 6, 7].map(n => `<option value="${n}" ${n === S.settings.goal ? 'selected' : ''}>${n} day${n > 1 ? 's' : ''} a week</option>`).join('')}</select></div>
    </div>
    <h2 class="sec-title">Your blind spot</h2>
    <div class="card" style="padding:16px">
      ${blind ? `<p class="eyebrow">🎯 Work on this next</p><h3 style="margin:2px 0 6px">${C.KIND_NAMES[blind.kind]}</h3><p class="muted small" style="margin:0 0 12px">${blind.why}</p><a class="btn primary" href="#/blind">Replay the moves you missed</a>` : '<p class="muted small" style="margin:0">Play a few puzzles and your coach will spot the moves you tend to miss.</p>'}
    </div>
    <h2 class="sec-title">Daily reminder</h2>
    <div class="card" style="padding:16px">
      <p class="muted small" style="margin:0 0 8px">${hasNativeBridge() ? "We'll send one gentle nudge a day. Skipped if you've already practised." : 'Add a repeating 5-minute event to your own calendar. Your calendar sends the reminder. No account needed.'}</p>
      ${hasNativeBridge() ? toggle('reminderOn', 'Daily reminder', 'One gentle nudge at your chosen time') + `<p id="reminderDenied" class="muted small" role="status" ${reminderDenied ? '' : 'hidden'}>Turn on notifications for Sudoku Belts in Settings.</p>` : ''}
      <div class="remind-row"><input type="time" aria-label="Reminder time" id="remindAt" value="${S.settings.remindAt}">${hasNativeBridge() ? '' : '<button class="btn primary sm" id="ics">Add to my calendar</button>'}</div>
    </div>
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
    <h2 class="sec-title">Back up your progress</h2>
    <div class="card" style="padding:16px">
      <p class="muted small" style="margin:0 0 8px">${hasNativeBridge() ? 'Progress lives on this phone only. Deleting the app wipes it. Save a backup file now and then, and open it here to bring everything back.' : 'Progress lives in this browser only. Clearing site data or switching phones wipes it. Save a backup file now and then, and open it here to bring everything back.'}</p>
      <div class="row gap"><button class="btn primary sm" id="export">Save backup file</button><label class="btn ghost sm" for="import">Restore from file</label><input type="file" id="import" accept=".json,application/json" hidden></div>
    </div>
    <p class="muted small">XP = points for practising.</p>
    <button class="btn link danger" id="reset">Reset all progress</button>`);
  app.querySelectorAll('.toggle input').forEach(inp => inp.onchange = () => {
    S.settings[inp.dataset.k] = inp.checked;
    if (inp.dataset.k === 'reminderOn') syncReminder(inp.checked);
    fx.sound = S.settings.sound; save(); sfx('tap');
  });
  $('#goal').onchange = e => { S.settings.goal = +e.target.value; save(); screenMe(); };
  $('#remindAt').onchange = e => { S.settings.remindAt = e.target.value || '08:00'; save(); syncReminder(); };
  if ($('#ics')) $('#ics').onclick = () => {
    download('sudoku-dojo-reminder.ics', H.reminderIcs(S.settings.remindAt, appUrl('#/daily'), today()), 'text/calendar');
    toast('Open the file to add it to your calendar');
  };
  $('#export').onclick = () => {
    download(`sudoku-dojo-backup-${today()}.json`, H.backupText(S, today()), 'application/json');
    toast(hasNativeBridge() ? 'Choose where to save your backup.' : 'Backup saved. Keep it somewhere safe.');
  };
  $('#import').onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    const b = H.readBackup(await file.text());
    e.target.value = '';
    if (!b) return toast("That file isn't a Sudoku Belts backup.");
    const lessons = Object.values(b.data.lessons || {}).filter(l => l.done).length;
    if (!confirm(`Restore the backup${b.saved ? ` from ${b.saved}` : ''}?\n${b.data.xp} XP · ${b.data.days.length} practice days · ${lessons} lessons\n\nThis replaces the progress on this device.`)) return;
    S = load(JSON.stringify(b.data)); fx.sound = S.settings.sound; save();
    toast('Progress restored ✓'); route();
  };
  $('#reset').onclick = () => { if (confirm('Erase all XP, belts, times and saved games?')) { S = fresh(); save(); route(); } };
}

// ================= boot =================
route();
if ('serviceWorker' in navigator && ['http:', 'https:'].includes(location.protocol)) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
