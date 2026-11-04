// npm test — checks the engine against every bank position and the habit logic.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import * as E from '../app/js/engine.js';
import * as H from '../app/js/habit.js';
import * as C from '../app/js/coach.js';
import { freshSearch, loadSearch, recordSearch, ladderReady, followUpPrompt } from '../app/js/search.js';
import { LESSONS } from '../app/js/lessons.js';
import { BANK } from '../app/data/bank.js';
import { checkSearchInteractions } from './search-check.js';

let n = 0;
const ok = (name, fn) => { fn(); n++; console.log('✓', name); };

ok('reminder defaults off and old saves migrate without losing progress or time', () => {
  // Run the actual storage functions without booting the UI.
  const source = readFileSync(new URL('../app/js/app.js', import.meta.url), 'utf8');
  const storage = source.slice(source.indexOf('const fresh ='), source.indexOf('function save()'));
  const { fresh, load } = runInNewContext(`${storage}; ({ fresh, load })`, {
    freshSearch, loadSearch, localStorage: { getItem: () => null }, KEY: 'sudoku-dojo-v1',
  });
  assert.equal(fresh().settings.reminderOn, false);
  assert.equal(fresh().searchBox.introSeen, false);
  assert.equal(loadSearch({rung: 2}).introSeen, false);
  assert.equal(load(JSON.stringify({searchBox: {...freshSearch(), introSeen: true}})).searchBox.introSeen, true);
  const old = { xp: 42, days: ['2026-11-04'], settings: { remindAt: '19:30', sound: false } };
  const migrated = load(JSON.stringify(old));
  assert.equal(migrated.settings.reminderOn, false);
  assert.equal(migrated.settings.remindAt, '19:30');
  assert.equal(migrated.settings.sound, false);
  assert.deepEqual(migrated.searchBox, freshSearch());
  assert.equal(migrated.xp, 42);
  assert.equal(migrated.days[0], old.days[0]);
  old.settings.reminderOn = true;
  assert.equal(load(JSON.stringify(old)).settings.reminderOn, true);
  assert.equal(load('{broken').settings.reminderOn, false);
});

ok('box lesson intro appears once and Start preserves the saved rung', () => {
  const source = readFileSync(new URL('../app/js/app.js', import.meta.url), 'utf8');
  const root = {}, next = {}, state = {searchBox: {...freshSearch(), rung: 2}};
  let mounted = 0, saves = 0;
  const context = { S: state, LESSONS: {hiddenSingleBox: {}}, BANK, E, ladderReady,
    beltForTech: () => ({}), shuffle: a => a, clearTimers() {}, app: {},
    $: selector => selector === '#next' ? next : root,
    mountSearch() { mounted++; }, save() { saves++; },
  };
  const lesson = runInNewContext(`${source.slice(source.indexOf('function screenLesson('), source.indexOf('function beltCeremony('))}; screenLesson`, context);
  lesson('hiddenSingleBox');
  assert.match(root.innerHTML, /Every box needs each number 1 to 9 once/);
  assert.equal(mounted, 0);
  assert.equal(state.searchBox.introSeen, false);
  next.onclick();
  assert.equal(state.searchBox.introSeen, true);
  assert.equal(state.searchBox.rung, 2);
  assert.equal(saves, 1);
  assert.equal(mounted, 1);
  lesson('hiddenSingleBox');
  assert.equal(mounted, 2, 'reopening skips the intro');
});

ok('scanning teaches one rule when used and does not repeat it', () => {
  const source = readFileSync(new URL('../app/js/app.js', import.meta.url), 'utf8');
  const element = () => ({style: {}, classList: {remove() {}}, querySelector: () => button});
  const button = {}, layout = element(), say = element(), hint = element(), guide = element();
  const keys = [1,2].map(d => ({dataset: {d}}));
  const cards = []; let tap, rendered, opened = 0;
  const root = {querySelector: () => layout, querySelectorAll: s => s === '.key' ? keys : [], append: card => cards.push(card)};
  const state = {grid: Array(81).fill(0)};
  const context = { E: {...E, newState: () => state,
      scanPlan: (_, last) => ({mode: last < 0 ? 'area' : 'follow', unit: 0, gaps: 1, step: {}, singles: [{units: [], place: [{cell: last+1, digit: last+2}]}], units: []}),
      applyStep: (st, step) => { const p=step.place[0]; st.grid[p.cell]=p.digit; }},
    Board: class {constructor(_, fn) {tap=fn;} render(v) {rendered=v;} pulse() {}},
    LESSONS, S: {settings: {}}, document: {createElement: () => ({...element(), remove() {}})},
    $: selector => ({'#say': say, '#hint': hint, '#guide': guide})[selector],
    boardFrame() {}, numpad() {}, sfx() {}, cap: s => s, followUpPrompt: () => 'Follow up',
    openSearch() {opened++;},
  };
  const drill = runInNewContext(`${source.slice(source.indexOf('function scanDrill('), source.indexOf('function screenScan('))}; scanDrill`, context);
  drill(root, {p: '.'.repeat(81), s: '1'.repeat(81)}, 8, () => {}, true);
  assert.match(cards[0].innerHTML, /that is nearly full/);
  assert.match(cards[0].innerHTML, /Like looking for lost keys/);
  assert.deepEqual([...rendered.step.units], [0]);
  assert.equal(rendered.level, 2);
  assert.equal(layout.style.display, 'none');
  button.onclick(); assert.equal(layout.style.display, '');
  tap(0); keys[0].onclick();
  assert.match(cards[1].innerHTML, /After placing a number/);
  assert.equal(opened, 0, 'read the follow-up rule before the search opens');
  button.onclick(); assert.match(cards[2].innerHTML, /Pick one number/);
  button.onclick(); assert.equal(opened, 1);
  tap(1); keys[1].onclick();
  assert.equal(cards.length, 3, 'later placements do not repeat rule screens');
});

ok('mounted ladder: all rungs, calm errors, isolated board and empty-cell regression', checkSearchInteractions);

ok('search ladder: two distinct clean reps per rung, migration and later fading', () => {
  assert.ok(BANK.lessons.hiddenSingleBox.slice(1).filter(p => ladderReady(E.parse(p.g))).length >= 12, 'enough distinct real positions for the complete ladder');
  let p = freshSearch();
  const record = (position, extra = {}) => { p = recordSearch(p, { position, clean: true, placed: true, day: '2026-11-04', ...extra }); };
  for (let rung=1; rung<=6; rung++) {
    record(`help${rung}`, {clean:false});
    assert.equal(p.positions.length, 0);
    record(`a${rung}`, {placed:rung!==1, completed:true});
    record(`a${rung}`);
    assert.equal(p.rung, rung);
    record(`b${rung}`, {placed:rung!==1, completed:true});
    assert.equal(p.rung, rung+1);
  }
  record('a7'); record('b7'); record('c7'); assert.equal(p.rung,8);
  for(let i=0;i<4;i++) record(`start${i}`);
  assert.equal(p.rung,8);
  record('full', {fullPuzzle:true}); assert.equal(p.rung,9);
  for(let i=0;i<10;i++) record(`solo${i}`);
  assert.equal(p.checkedDay,null);
  record('fresh puzzle',{fullPuzzle:true,day:'2026-11-05'});
  assert.equal(p.checkedDay,'2026-11-05');
  for(const [stage,rung] of [[0,1],[1,7],[2,8],[3,9]]) {
    const migrated=loadSearch({stage,positions:['old'],solo:['kept']});
    assert.equal(migrated.rung,rung); assert.ok(!('stage' in migrated));
    assert.deepEqual(migrated.positions,[]); assert.deepEqual(migrated.solo,['kept']);
  }
  assert.equal(loadSearch({rung:99}).rung,1);
  assert.deepEqual(loadSearch(null),freshSearch());
});

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

ok('guided search: all 560 bank positions, every digit and house, have exact blockers and true forced spots', () => {
  const positions = [...Object.values(BANK.lessons).flat(), ...Object.values(BANK.tiers).flat()];
  assert.equal(positions.length, 560);
  for (const p of positions) {
    const grid = E.parse(p.g || p.p), sol = E.parse(p.s), snapshot = grid.slice(), G = E.G9;
    const basic = E.basicCandidates(grid);
    for (let digit = 1; digit <= 9; digit++) for (let unit = 0; unit < 27; unit++) {
      const f = E.searchFacts(grid, digit, unit), cells = G.UNITS[unit];
      assert.equal(f.present, cells.some(i => grid[i] === digit));
      assert.deepEqual(f.filled, cells.filter(i => grid[i]));
      assert.deepEqual(f.remaining, cells.filter(i => !grid[i] && E.has(basic[i], digit)));
      const sources = grid.map((v, i) => v === digit && cells.some(c => !grid[c] && G.sees(i, c)) ? i : -1).filter(i => i >= 0);
      assert.deepEqual(f.blockers.map(b => b.cell), sources);
      for (const b of f.blockers) {
        assert.equal(grid[b.cell], digit);
        assert.deepEqual(b.cells, cells.filter(i => !grid[i] && G.sees(b.cell, i)));
        assert.deepEqual(b.beams.map(b => b.unit), G.CELL_UNITS[b.cell].filter(u => cells.some(i => !grid[i] && G.UNITS[u].includes(i))));
        for (const beam of b.beams) {
          assert.ok(G.UNITS[beam.unit].includes(b.cell));
          assert.deepEqual(beam.cells, cells.filter(i => !grid[i] && G.UNITS[beam.unit].includes(i)));
        }
        assert.deepEqual([...new Set(b.beams.flatMap(b => b.cells))].sort((a, b) => a - b), b.cells);
      }
      if (f.remaining.length === 1) assert.equal(sol[f.remaining[0]], digit);
    }
    const ranked = E.rankSearchStarts(grid);
    assert.deepEqual(E.rankSearchStarts(grid), ranked, 'stable ranking');
    assert.ok(ranked.every(s => !s.present && s.remaining.length));
    if (ranked.some(s => s.remaining.length === 1)) assert.equal(ranked[0].remaining.length, 1);
    for (const s of ranked) assert.equal(s.placed, grid.filter(v => v === s.digit).length);
    assert.deepEqual(grid, snapshot, 'searches must not write to the grid');
    // One legal placement per bank position; compare ALL houses to an independent before/after oracle.
    const last = ranked.find(s => s.remaining.length === 1)?.remaining[0] ?? grid.indexOf(0);
    if (last < 0) continue;
    const after = grid.slice(), digit = sol[last]; after[last] = digit;
    const next = E.basicCandidates(after), follow = E.searchFollowUps(after, last);
    const expected = G.UNITS.map((cells, unit) => ({ unit,
      before: cells.filter(i => E.has(basic[i], digit)), after: cells.filter(i => E.has(next[i], digit)),
    })).filter(s => !G.UNITS[s.unit].some(i => after[i] === digit) && s.before.length > 1 && s.after.length === 1);
    assert.deepEqual(follow.map(s => s.unit), expected.map(s => s.unit));
    for (const f of follow) {
      assert.equal(f.digit, digit);
      assert.equal(sol[f.remaining[0]], digit);
      assert.deepEqual(f.removed, G.UNITS[f.unit].filter(i => E.has(basic[i], digit) && !E.has(next[i], digit)));
      assert.ok(f.removed.every(i => G.sees(last, i)));
    }
    assert.deepEqual(after, grid.map((v, i) => i === last ? digit : v));
  }
});

ok('guided search: dead ends, present digits, 6×6, invalid requests and remote follow-ups', () => {
  const empty = Array(36).fill(0);
  assert.equal(E.searchFacts(empty, 6, 12).remaining.length, 6);
  assert.deepEqual(E.searchFollowUps(empty, -1), []);
  assert.deepEqual(E.searchFollowUps(empty, 0), []);
  assert.throws(() => E.searchFacts(empty, 7, 12), RangeError);
  assert.throws(() => E.searchFacts(empty, 1, 18), RangeError);
  const sol = E.solve(empty, 1).solution, grid = sol.slice(); grid[0] = 0;
  assert.deepEqual(E.searchFacts(grid, sol[0], 12).remaining, [0]);
  assert.equal(E.searchFacts(sol, sol[0], 12).present, true);
  assert.deepEqual(E.rankSearchStarts(sol), []);
  assert.deepEqual(E.rankSearchStarts(empty, [12]).map(s => s.unit), Array(6).fill(12));
  const p = BANK.tiers.gentle[0], st = E.newState(E.parse(p.p));
  // gentle-1: after two preparatory moves, r1c5=7 newly forces box 8.
  for (let i = 0; i < 2; i++) E.applyStep(st, E.findStep(st));
  E.placeDigit(st, 4, 7);
  const last = 4, follow = E.searchFollowUps(st.grid, last);
  assert.equal(followUpPrompt(st.grid, last), 'Your new 7 rules out cells. Check a box it reached.');
  assert.match(followUpPrompt(E.parse(BANK.tiers.gentle[0].s), 0), /^No empty cells/);
  const sparse = Array(81).fill(0); sparse[0] = 1;
  assert.match(followUpPrompt(sparse, 0), /^That did not force another 1/);
  assert.ok(follow.some(s => !E.G9.CELL_UNITS[last].includes(s.unit)), 'new digit touches a remote house');
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
