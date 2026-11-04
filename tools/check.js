// npm test — checks the engine against every bank position and the habit logic.
import assert from 'node:assert/strict';
import * as E from '../app/js/engine.js';
import * as H from '../app/js/habit.js';
import * as C from '../app/js/coach.js';
import { BANK } from '../app/data/bank.js';

let n = 0;
const ok = (name, fn) => { fn(); n++; console.log('✓', name); };

ok('coach classifies the first 20 placing steps on every Gentle puzzle at least as easily', () => {
  for (const puzzle of BANK.tiers.gentle) {
    const grid = E.parse(puzzle.p), st = E.newState(grid);
    let placements = 0;
    for (const step of E.logicSolve(grid).steps) {
      if (step.place.length) {
        for (const { cell, digit } of step.place) {
          const kind = C.classify(st.grid, cell, digit);
          assert.ok(kind, puzzle.id);
          assert.ok(E.TECH_ORDER.indexOf(C.kindTech(kind)) <= E.TECH_ORDER.indexOf(step.tech));
        }
        placements++;
      }
      E.applyStep(st, step);
      if (placements >= 20) break;
    }
  }
});

ok('coach splits hidden singles by row and column', () => {
  const seen = new Set();
  for (const pos of BANK.lessons.hiddenSingleLine) {
    const st = E.newState(E.parse(pos.g));
    for (const k of pos.x) st.cands[(k / 10) | 0] &= ~E.bit(k % 10);
    for (const step of E.findAll(st, 'hiddenSingleLine')) {
      const kind = E.G9.isRow(step.units[0]) ? 'hiddenSingleRow' : 'hiddenSingleCol';
      assert.equal(C.stepKind(step), kind);
      assert.equal(C.kindTech(kind), step.tech);
      seen.add(kind);
    }
  }
  assert.equal(seen.size, 2);
});

ok('coach needs enough evidence, chooses missed columns, and preserves input stats', () => {
  let stats = {};
  for (let i = 0; i < 5; i++) stats = C.record(stats, 'hiddenSingleCol', i < 3 ? 'stuck' : 'found', 41);
  assert.equal(C.blindSpot(stats), null);
  for (let i = 0; i < 7; i++) stats = C.record(stats, 'hiddenSingleRow', 'found', 9);
  const blind = C.blindSpot(stats);
  assert.equal(blind.kind, 'hiddenSingleCol');
  assert.match(blind.why, /41s.*only 9s in rows.*help on 3 of 5/);
  const drill = C.record(stats, 'hiddenSingleCol', 'found', 0);
  assert.equal(drill.hiddenSingleCol.secs, 82);
  assert.equal(drill.hiddenSingleCol.timed, 2);
  assert.equal(stats.hiddenSingleCol.found, 2);
  assert.equal(drill.hiddenSingleCol.found, 3);
});

ok('coach stays quiet for even results and spots slow finds without misses', () => {
  let stats = {};
  for (let i = 0; i < 12; i++) stats = C.record(stats, 'fullHouse', 'found', 9);
  assert.equal(C.blindSpot(stats), null);
  for (let i = 0; i < 4; i++) stats = C.record(stats, 'hiddenSingleCol', 'found', 60);
  assert.equal(C.blindSpot(stats).kind, 'hiddenSingleCol');
  assert.equal(C.classify(Array(36).fill(0), 0, 1), null);
  assert.equal(C.classify(Array(81).fill(0), 0, 1), null);
});

ok('coach keeps only the last 20 exact moments without mutating the list', () => {
  let moments = [];
  const p = BANK.tiers.gentle[0];
  for (let date = 0; date < 25; date++) {
    const before = moments.slice();
    const next = C.addMoment(moments, { g: p.p, s: p.s, tech: 'fullHouse', kind: 'fullHouse', date });
    assert.deepEqual(moments, before);
    moments = next;
  }
  assert.equal(moments.length, 20);
  assert.equal(moments[0].date, 5);
  assert.equal(moments[19].g, p.p);
});

ok('every lesson position: its technique exists, is the easiest, and every step is true', () => {
  for (const [tech, list] of Object.entries(BANK.lessons)) for (const pos of list) {
    const grid = E.parse(pos.g), sol = E.parse(pos.s), cands = E.basicCandidates(grid);
    for (const k of pos.x) cands[(k / 10) | 0] &= ~E.bit(k % 10);
    const st = { grid, cands };
    for (const t of E.TECH_ORDER) { if (t === tech) break; assert.equal(E.findAll(st, t).length, 0, `${tech}: easier ${t}`); }
    const all = E.findAll(st, tech);
    assert.ok(all.length, `${tech}: none found`);
    for (const s of all) {
      for (const p of s.place) assert.equal(sol[p.cell], p.digit);
      for (const e of s.elim) assert.notEqual(sol[e.cell], e.digit);
    }
  }
});

ok('hint text never claims placed digits do all the blocking when they do not', () => {
  for (const list of Object.values(BANK.tiers)) for (const p of list.slice(0, 15)) {
    const st = E.newState(E.parse(p.p));
    while (st.grid.includes(0)) {
      const s = E.findStep(st);
      if (s.tech.startsWith('hiddenSingle')) {
        const blockers = s.cells.filter(c => c.role === 'blocker').map(c => c.cell);
        const uncovered = s.cells.filter(c => c.role === 'blocked' && !blockers.some(b => E.G9.sees(b, c.cell)));
        if (uncovered.length) assert.match(s.text, /earlier note removals/);
        else assert.match(s.text, /cross out every other empty cell/);
      }
      E.applyStep(st, s);
    }
  }
});

ok('naked triple hint does not ask for identical notes', () => {
  const s = E.findAll((() => { const pos = BANK.lessons.nakedTriple[0], g = E.parse(pos.g), c = E.basicCandidates(g); for (const k of pos.x) c[(k / 10) | 0] &= ~E.bit(k % 10); return { grid: g, cands: c }; })(), 'nakedTriple')[0];
  assert.doesNotMatch(s.hint, /same three notes/);
});

ok('scanning routine: always has a next single on easy puzzles, every digit true, follow-ups really touch the last placement', () => {
  for (const t of ['gentle', 'easy']) for (const p of BANK.tiers[t]) {
    const st = E.newState(E.parse(p.p)), sol = E.parse(p.s);
    let last = -1;
    while (st.grid.includes(0)) {
      const plan = E.scanPlan(st, last);
      assert.ok(plan, `${p.id}: routine ran dry`);
      const { cell, digit } = plan.step.place[0];
      assert.equal(sol[cell], digit, `${p.id}: wrong digit`);
      if (plan.mode === 'follow') assert.ok(plan.step.units.some(u => plan.units.includes(u)) || plan.step.digit === st.grid[last]);
      if (plan.mode === 'area') assert.ok(plan.gaps <= 3);
      E.applyStep(st, plan.step); last = cell;
    }
  }
});

ok('6×6 generator: unique and logic-solvable', () => {
  for (let i = 0; i < 40; i++) {
    const { puzzle, solution } = E.generate6(i % 2 ? 'quick' : 'tricky');
    assert.equal(E.solve(puzzle, 2).count, 1);
    assert.equal(E.logicSolve(puzzle).state.grid.join(''), solution.join(''));
  }
});

ok('streak: forgives one rest day per week, breaks on two', () => {
  const t = '2026-11-10';
  assert.equal(H.streak([], t), 0);
  assert.equal(H.streak(['2026-11-10'], t), 1);
  assert.equal(H.streak(['2026-11-09'], t), 1, 'today not done yet does not break it');
  assert.equal(H.streak(['2026-11-08', '2026-11-09', '2026-11-10'], t), 3);
  assert.equal(H.streak(['2026-11-07', '2026-11-08', '2026-11-10'], t), 3, 'one rest day is forgiven');
  assert.equal(H.streak(['2026-11-06', '2026-11-08', '2026-11-10'], t), 2, 'two rest days in a week break it');
  assert.equal(H.streak(['2026-11-07', '2026-11-10'], t), 1, 'two days in a row missed breaks it');
  assert.equal(H.streak(['2026-11-01', '2026-11-02', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09', '2026-11-11'], '2026-11-11'), 9, 'rest days 7+ apart are both forgiven');
});

ok('week view starts Monday and marks today', () => {
  const w = H.week(['2026-11-09', '2026-11-11'], '2026-11-11'); // Wednesday
  assert.deepEqual(w.map(d => d.key), ['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15']);
  assert.deepEqual(w.map(d => d.done), [true, false, true, false, false, false, false]);
  assert.equal(w[2].today, true);
  assert.equal(w[3].future, true);
});

ok('spaced review: solo moves up, help resets', () => {
  let e = H.review(undefined, true, '2026-11-10');
  assert.deepEqual(e, { box: 0, due: '2026-11-11' });
  e = H.review(e, true, '2026-11-11'); assert.deepEqual(e, { box: 1, due: '2026-11-14' });
  e = H.review(e, true, '2026-11-14'); assert.deepEqual(e, { box: 2, due: '2026-11-21' });
  e = H.review(e, false, '2026-11-21'); assert.deepEqual(e, { box: 0, due: '2026-11-22' });
});

ok('daily pick: due first, interleaved, right length', () => {
  const learned = ['fullHouse', 'hiddenSingleBox', 'pointing'];
  const picks = H.pickDaily(learned, { pointing: { box: 0, due: '2026-11-01' }, fullHouse: { box: 3, due: '2026-12-01' } }, '2026-11-10', 5, () => 0);
  assert.equal(picks.length, 5);
  assert.equal(picks[0], 'pointing');
  for (let i = 1; i < picks.length; i++) assert.notEqual(picks[i], picks[i - 1]);
  assert.deepEqual(H.pickDaily([], {}, '2026-11-10'), []);
});

ok('calendar reminder is a valid daily event', () => {
  const ics = H.reminderIcs('08:30', 'https://example.com/app/#/daily', '2026-11-10');
  assert.match(ics, /DTSTART:20261110T083000/);
  assert.match(ics, /RRULE:FREQ=DAILY/);
  assert.ok(ics.startsWith('BEGIN:VCALENDAR') && ics.endsWith('END:VCALENDAR'));
});

ok('backup file: round-trips a save and rejects other files', () => {
  const save = { xp: 120, days: ['2026-11-03', '2026-11-04'], lessons: { fullHouse: { done: true, stars: 3 } }, settings: { goal: 4 } };
  const b = H.readBackup(H.backupText(save, '2026-11-04'));
  assert.deepEqual(b.data, save);
  assert.equal(b.saved, '2026-11-04');
  assert.equal(H.readBackup('not json'), null);
  assert.equal(H.readBackup(JSON.stringify(save)), null, 'raw save without the wrapper');
  assert.equal(H.readBackup(JSON.stringify({ app: 'sudoku-dojo', data: { xp: 'lots' } })), null);
});

console.log(`\n${n} checks passed`);
