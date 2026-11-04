// Sudoku Dojo engine: board geometry, solver, generator and human-style techniques.
// Works for 9x9 (3x3 boxes) and 6x6 (2-row x 3-column boxes), in the browser and in Node.
// Board size is read from the grid's length, so every function works on both.

export function makeGeo(N) {
  const bh = N === 9 ? 3 : 2, bw = 3, perRow = N / bw, size = N * N;
  const ROW = [], COL = [], BOX = [];
  for (let i = 0; i < size; i++) {
    ROW[i] = (i / N) | 0; COL[i] = i % N;
    BOX[i] = ((ROW[i] / bh) | 0) * perRow + ((COL[i] / bw) | 0);
  }
  // Units: 0..N-1 rows, N..2N-1 columns, 2N..3N-1 boxes.
  const UNITS = [];
  for (let r = 0; r < N; r++) UNITS.push(Array.from({ length: N }, (_, c) => r * N + c));
  for (let c = 0; c < N; c++) UNITS.push(Array.from({ length: N }, (_, r) => r * N + c));
  for (let b = 0; b < N; b++) {
    const r0 = ((b / perRow) | 0) * bh, c0 = (b % perRow) * bw, u = [];
    for (let r = 0; r < bh; r++) for (let c = 0; c < bw; c++) u.push((r0 + r) * N + c0 + c);
    UNITS.push(u);
  }
  const CELL_UNITS = Array.from({ length: size }, (_, i) => [ROW[i], N + COL[i], 2 * N + BOX[i]]);
  const PEERS = Array.from({ length: size }, (_, i) => {
    const s = new Set();
    for (const u of CELL_UNITS[i]) for (const j of UNITS[u]) if (j !== i) s.add(j);
    return [...s];
  });
  const range = (a, b) => Array.from({ length: b - a }, (_, k) => a + k);
  return {
    N, bh, bw, size, ROW, COL, BOX, UNITS, CELL_UNITS, PEERS,
    ALL: ((1 << (N + 1)) - 1) & ~1, BOXES: range(2 * N, 3 * N), LINES: range(0, 2 * N),
    isRow: u => u < N, isLine: u => u < 2 * N,
    sees: (a, b) => a !== b && (ROW[a] === ROW[b] || COL[a] === COL[b] || BOX[a] === BOX[b]),
    unitName: u => (u < N ? `row ${u + 1}` : u < 2 * N ? `column ${u - N + 1}` : `box ${u - 2 * N + 1}`),
    cellName: i => `R${ROW[i] + 1}C${COL[i] + 1}`,
  };
}
export const G9 = makeGeo(9), G6 = makeGeo(6);
export const geoOf = len => (len === 36 ? G6 : G9);

export const bit = d => 1 << d;
export const has = (m, d) => (m >> d) & 1;
export const popcount = m => { let n = 0; while (m) { m &= m - 1; n++; } return n; };
export const digitsOf = m => { const a = []; for (let d = 1; d <= 9; d++) if (m & (1 << d)) a.push(d); return a; };

export const parse = str => Array.from(str, ch => (ch >= '1' && ch <= '9' ? +ch : 0));
export const stringify = grid => grid.map(v => v || '.').join('');

const list = a => (a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
const bold = s => `**${s}**`;
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

export function basicCandidates(grid) {
  const G = geoOf(grid.length), c = new Array(G.size).fill(0);
  for (let i = 0; i < G.size; i++) {
    if (grid[i]) continue;
    let m = G.ALL;
    for (const p of G.PEERS[i]) if (grid[p]) m &= ~bit(grid[p]);
    c[i] = m;
  }
  return c;
}

// ---------- random ----------
export function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function shuffle(a, rng = Math.random) {
  for (let i = a.length - 1; i > 0; i--) { const j = (rng() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// ---------- brute-force solver (counts solutions up to `limit`) ----------
export function solve(grid, limit = 2, rng = null) {
  const G = geoOf(grid.length), { N, size, ROW, COL, BOX, ALL } = G;
  const g = grid.slice(), rows = Array(N).fill(0), cols = Array(N).fill(0), boxes = Array(N).fill(0);
  for (let i = 0; i < size; i++) {
    if (!g[i]) continue;
    const b = bit(g[i]);
    if ((rows[ROW[i]] | cols[COL[i]] | boxes[BOX[i]]) & b) return { count: 0, solution: null };
    rows[ROW[i]] |= b; cols[COL[i]] |= b; boxes[BOX[i]] |= b;
  }
  let count = 0, solution = null;
  const rec = () => {
    let best = -1, bestMask = 0, bestN = 10;
    for (let i = 0; i < size; i++) {
      if (g[i]) continue;
      const m = ALL & ~(rows[ROW[i]] | cols[COL[i]] | boxes[BOX[i]]);
      const n = popcount(m);
      if (n < bestN) { bestN = n; best = i; bestMask = m; if (n <= 1) break; }
    }
    if (best < 0) { count++; if (!solution) solution = g.slice(); return count >= limit; }
    if (bestN === 0) return false;
    const ds = digitsOf(bestMask);
    if (rng) shuffle(ds, rng);
    const r = ROW[best], c = COL[best], x = BOX[best];
    for (const d of ds) {
      const b = bit(d);
      g[best] = d; rows[r] |= b; cols[c] |= b; boxes[x] |= b;
      if (rec()) return true;
      g[best] = 0; rows[r] &= ~b; cols[c] &= ~b; boxes[x] &= ~b;
    }
    return false;
  };
  rec();
  return { count, solution };
}

// Random unique puzzle with 180° symmetry. n = 9 or 6.
export function generate(rng = Math.random, n = 9) {
  const size = n * n;
  const solution = solve(Array(size).fill(0), 1, rng).solution;
  const g = solution.slice();
  for (const i of shuffle([...Array(Math.ceil(size / 2)).keys()], rng)) {
    const j = size - 1 - i, a = g[i], b = g[j];
    g[i] = 0; g[j] = 0;
    if (solve(g, 2).count !== 1) { g[i] = a; g[j] = b; }
  }
  return { puzzle: g, solution };
}

// ---------- logical state ----------
export const newState = (grid, cands) => ({ grid: grid.slice(), cands: cands ? cands.slice() : basicCandidates(grid) });
export function placeDigit(st, i, d) {
  st.grid[i] = d; st.cands[i] = 0;
  for (const p of geoOf(st.grid.length).PEERS[i]) st.cands[p] &= ~bit(d);
}
export function applyStep(st, step) {
  for (const { cell, digit } of step.place) placeDigit(st, cell, digit);
  for (const { cell, digit } of step.elim) st.cands[cell] &= ~bit(digit);
}

function* combos(arr, k, start = 0, acc = []) {
  if (acc.length === k) { yield acc.slice(); return; }
  for (let i = start; i < arr.length; i++) { acc.push(arr[i]); yield* combos(arr, k, i + 1, acc); acc.pop(); }
}

// ---------- techniques ----------
// Every finder returns a list of steps:
// { tech, place:[{cell,digit}], elim:[{cell,digit}], units:[], beams:[], cells:[{cell,role}],
//   marks:[{cell,digit,role:'key'|'elim'}], hint:'region-level nudge', text:'full explanation' }

function fullHouse(st, G, first) {
  const out = [], seen = new Set();
  for (let u = 0; u < 3 * G.N; u++) {
    const empty = G.UNITS[u].filter(i => !st.grid[i]);
    if (empty.length !== 1) continue;
    const cell = empty[0];
    let used = 0;
    for (const i of G.UNITS[u]) if (st.grid[i]) used |= bit(st.grid[i]);
    const d = digitsOf(G.ALL & ~used)[0];
    if (seen.has(cell) || !has(st.cands[cell], d)) continue;
    seen.add(cell);
    out.push({
      tech: 'fullHouse', digit: d, place: [{ cell, digit: d }], elim: [], units: [u], beams: [],
      cells: [{ cell, role: 'target' }], marks: [],
      hint: `${cap(G.unitName(u))} is almost full. Which digit is missing?`,
      text: `${bold(cap(G.unitName(u)))} has just one empty cell, ${bold(G.cellName(cell))}. Count 1 to ${G.N}: the only digit missing is ${bold(d)}.`,
    });
    if (first) break;
  }
  return out;
}

// Pick the fewest placed copies of `d` that rule out every other empty cell of unit `u`.
function coverBlockers(st, G, others, d, u) {
  const sources = [];
  for (let i = 0; i < G.size; i++) if (st.grid[i] === d) sources.push(i);
  let left = others.filter(o => sources.some(s => G.sees(s, o)));
  const blockers = [], beams = new Set();
  while (left.length) {
    let best = -1, cov = [];
    for (const s of sources) {
      const c = left.filter(o => G.sees(s, o));
      if (c.length > cov.length) { best = s; cov = c; }
    }
    blockers.push(best);
    for (const o of cov) {
      const shared = G.CELL_UNITS[best].find(x => x !== u && G.CELL_UNITS[o].includes(x));
      if (shared !== undefined) beams.add(shared);
    }
    left = left.filter(o => !cov.includes(o));
  }
  const viaNotes = others.filter(o => !blockers.some(b => G.sees(b, o)));
  return { blockers, beams: [...beams], viaNotes };
}

function hiddenSingle(st, G, first, units, tech) {
  const out = [], seen = new Set();
  for (const u of units) for (let d = 1; d <= G.N; d++) {
    const cells = G.UNITS[u];
    if (cells.some(i => st.grid[i] === d)) continue;
    const pos = cells.filter(i => has(st.cands[i], d));
    if (pos.length !== 1 || seen.has(pos[0])) continue;
    const cell = pos[0];
    seen.add(cell);
    const others = cells.filter(i => !st.grid[i] && i !== cell);
    const { blockers, beams, viaNotes } = coverBlockers(st, G, others, d, u);
    const why = viaNotes.length
      ? `The ${d}s already on the board rule out some cells, and earlier note removals rule out ${list(viaNotes.map(c => bold(G.cellName(c))))}.`
      : `The ${d}s already on the board cross out every other empty cell.`;
    out.push({
      tech, digit: d, place: [{ cell, digit: d }], elim: [], units: [u], beams,
      cells: [...blockers.map(c => ({ cell: c, role: 'blocker' })), ...others.map(c => ({ cell: c, role: 'blocked' })), { cell, role: 'target' }],
      marks: [],
      hint: `Look at ${bold(G.unitName(u))}. Where can a ${bold(d)} go?`,
      text: `Where can ${bold(d)} go in ${bold(G.unitName(u))}? ${why} So ${d} has one home left: ${bold(G.cellName(cell))}.`,
    });
    if (first) return out;
  }
  return out;
}

function nakedSingle(st, G, first) {
  const out = [];
  for (let cell = 0; cell < G.size; cell++) {
    if (st.grid[cell] || popcount(st.cands[cell]) !== 1) continue;
    const d = digitsOf(st.cands[cell])[0];
    const witnesses = [], seenDigits = [];
    for (let e = 1; e <= G.N; e++) {
      if (e === d) continue;
      const w = G.PEERS[cell].find(p => st.grid[p] === e);
      if (w !== undefined) { witnesses.push(w); seenDigits.push(e); }
    }
    const extra = seenDigits.length < G.N - 1 ? ' (your notes rule out the rest)' : '';
    out.push({
      tech: 'nakedSingle', digit: d, place: [{ cell, digit: d }], elim: [], units: G.CELL_UNITS[cell], beams: [],
      cells: [...witnesses.map(c => ({ cell: c, role: 'blocker' })), { cell, role: 'target' }], marks: [],
      hint: `Look at ${bold(G.cellName(cell))}. Which digits does its row, column and box already have?`,
      text: `${bold(G.cellName(cell))} already sees ${list(seenDigits)} in its row, column and box${extra}. Only one digit is left: ${bold(d)}.`,
    });
    if (first) break;
  }
  return out;
}

function lockedCandidates(st, G, first, pointing) {
  const out = [], cl = cells => list(cells.map(c => bold(G.cellName(c))));
  for (const b of pointing ? G.BOXES : G.LINES) for (let d = 1; d <= G.N; d++) {
    if (G.UNITS[b].some(i => st.grid[i] === d)) continue;
    const pos = G.UNITS[b].filter(i => has(st.cands[i], d));
    if (pos.length < 2) continue;
    const targets = pointing
      ? [new Set(pos.map(i => G.ROW[i])), new Set(pos.map(i => G.N + G.COL[i]))]
      : [new Set(pos.map(i => 2 * G.N + G.BOX[i]))];
    for (const t of targets) {
      if (t.size !== 1) continue;
      const L = [...t][0];
      const elim = G.UNITS[L].filter(i => !G.UNITS[b].includes(i) && has(st.cands[i], d)).map(cell => ({ cell, digit: d }));
      if (!elim.length) continue;
      const ec = cl(elim.map(e => e.cell));
      const text = pointing
        ? `Inside ${bold(G.unitName(b))}, ${bold(d)} can only go in ${cl(pos)}, and they all sit in ${bold(G.unitName(L))}. So the box's ${d} lands somewhere on that ${G.isRow(L) ? 'row' : 'column'}, and the rest of ${G.unitName(L)} can't be ${d}. Cross ${d} out of ${ec}.`
        : `In ${bold(G.unitName(b))}, ${bold(d)} can only go in ${cl(pos)}, and they all sit inside ${bold(G.unitName(L))}. So the ${G.isRow(b) ? 'row' : 'column'} takes its ${d} from that box, and no other cell of ${G.unitName(L)} can be ${d}. Cross ${d} out of ${ec}.`;
      out.push({
        tech: pointing ? 'pointing' : 'claiming', digit: d, place: [], elim, units: [b, L], beams: [],
        cells: pos.map(cell => ({ cell, role: 'pattern' })),
        marks: [...pos.map(cell => ({ cell, digit: d, role: 'key' })), ...elim.map(e => ({ ...e, role: 'elim' }))],
        hint: pointing
          ? `Look at the ${bold(d)} notes in ${bold(G.unitName(b))}. Do they all sit in one row or one column?`
          : `Look at the ${bold(d)} notes in ${bold(G.unitName(b))}. Are they all inside one box?`,
        text,
      });
      if (first) return out;
    }
  }
  return out;
}

function nakedSubset(st, G, first, n, tech) {
  const out = [], seen = new Set(), cl = cells => list(cells.map(c => bold(G.cellName(c))));
  for (let u = 0; u < 3 * G.N; u++) {
    const pool = G.UNITS[u].filter(i => !st.grid[i] && popcount(st.cands[i]) >= 2 && popcount(st.cands[i]) <= n);
    if (pool.length < n) continue;
    for (const set of combos(pool, n)) {
      let m = 0;
      for (const i of set) m |= st.cands[i];
      if (popcount(m) !== n) continue;
      const key = set.join(',');
      if (seen.has(key)) continue;
      const units = G.CELL_UNITS[set[0]].filter(x => set.every(i => G.CELL_UNITS[i].includes(x)));
      const elim = [], done = new Set();
      for (const cu of units) for (const i of G.UNITS[cu]) {
        if (set.includes(i) || st.grid[i]) continue;
        for (const d of digitsOf(st.cands[i] & m)) {
          if (!done.has(i * 10 + d)) { done.add(i * 10 + d); elim.push({ cell: i, digit: d }); }
        }
      }
      if (!elim.length) continue;
      seen.add(key);
      const ds = digitsOf(m), word = n === 2 ? 'two' : 'three';
      const intro = n === 2 ? `${cl(set)} both hold only ${bold(ds.join(' and '))}.` : `${cl(set)} hold only ${bold(list(ds))} between them.`;
      out.push({
        tech, place: [], elim, units, beams: [],
        cells: set.map(cell => ({ cell, role: 'pattern' })),
        marks: [...set.flatMap(cell => digitsOf(st.cands[cell]).map(digit => ({ cell, digit, role: 'key' }))), ...elim.map(e => ({ ...e, role: 'elim' }))],
        hint: n === 2
          ? `Look in ${bold(G.unitName(units[0]))}. Can you find two cells that both have exactly the same two notes?`
          : `Look in ${bold(G.unitName(units[0]))}. Can you find three cells whose notes use only three different digits between them? They don't need identical notes.`,
        text: `${intro} ${cap(word)} cells, ${word} digits: they will use up ${list(ds)} in ${list(units.map(G.unitName))}, even though we don't know which goes where yet. So no other cell there can be ${list(ds)}.`,
      });
      if (first) return out;
    }
  }
  return out;
}

function hiddenPair(st, G, first) {
  const out = [], seen = new Set(), cl = cells => list(cells.map(c => bold(G.cellName(c))));
  for (let u = 0; u < 3 * G.N; u++) {
    const where = {}, ds = [];
    for (let d = 1; d <= G.N; d++) {
      if (G.UNITS[u].some(i => st.grid[i] === d)) continue;
      const pos = G.UNITS[u].filter(i => has(st.cands[i], d));
      if (pos.length === 2) { where[d] = pos; ds.push(d); }
    }
    for (const [a, b] of combos(ds, 2)) {
      const [c1, c2] = where[a];
      if (where[b][0] !== c1 || where[b][1] !== c2) continue;
      const keep = bit(a) | bit(b);
      const elim = [c1, c2].flatMap(cell => digitsOf(st.cands[cell] & ~keep).map(digit => ({ cell, digit })));
      if (!elim.length) continue;
      const key = `${c1},${c2},${a},${b}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        tech: 'hiddenPair', place: [], elim, units: [u], beams: [],
        cells: [c1, c2].map(cell => ({ cell, role: 'pattern' })),
        marks: [...[c1, c2].flatMap(cell => [a, b].map(digit => ({ cell, digit, role: 'key' }))), ...elim.map(e => ({ ...e, role: 'elim' }))],
        hint: `In ${bold(G.unitName(u))}, look for two digits that can only go in the same two cells.`,
        text: `In ${bold(G.unitName(u))}, ${bold(a)} and ${bold(b)} can only go in ${cl([c1, c2])}. Those two cells must be ${a} and ${b}, so every other note in them can go: cross out ${list([...new Set(elim.map(e => e.digit))].sort())}.`,
      });
      if (first) return out;
    }
  }
  return out;
}

function fish(st, G, first, n, tech) {
  const out = [], seen = new Set();
  for (let d = 1; d <= G.N; d++) for (const byCol of [false, true]) {
    const base = [];
    for (let k = 0; k < G.N; k++) {
      const u = byCol ? G.N + k : k;
      if (G.UNITS[u].some(i => st.grid[i] === d)) continue;
      const pos = G.UNITS[u].filter(i => has(st.cands[i], d));
      if (pos.length >= 2 && pos.length <= n) base.push({ u, pos, cover: pos.map(i => (byCol ? G.ROW[i] : G.N + G.COL[i])) });
    }
    for (const set of combos(base, n)) {
      const cover = [...new Set(set.flatMap(s => s.cover))].sort((x, y) => x - y);
      if (cover.length !== n) continue;
      const baseUnits = set.map(s => s.u), pattern = set.flatMap(s => s.pos);
      const elim = cover.flatMap(cu => G.UNITS[cu]
        .filter(i => has(st.cands[i], d) && !baseUnits.includes(byCol ? G.N + G.COL[i] : G.ROW[i]))
        .map(cell => ({ cell, digit: d })));
      if (!elim.length) continue;
      const key = d + ':' + baseUnits.join(',');
      if (seen.has(key)) continue;
      seen.add(key);
      const bk = byCol ? 'column' : 'row', ck = byCol ? 'row' : 'column';
      const shape = n === 2
        ? `The four corners make a rectangle, and the two ${d}s must sit on opposite corners.`
        : `Three ${bk}s, three ${ck}s: each of those ${bk}s needs a ${d}, and can only find it inside these ${ck}s.`;
      out.push({
        tech, digit: d, place: [], elim, units: [...baseUnits, ...cover], beams: [],
        cells: pattern.map(cell => ({ cell, role: 'pattern' })),
        marks: [...pattern.map(cell => ({ cell, digit: d, role: 'key' })), ...elim.map(e => ({ ...e, role: 'elim' }))],
        hint: `Light up the ${bold(d)}s and look at the ${bk}s where ${d} has only ${n === 2 ? 'two' : 'two or three'} spots.`,
        text: `Look at the ${bold(d)}s. In ${list(baseUnits.map(x => bold(G.unitName(x))))}, ${d} can only go in ${list(cover.map(x => bold(G.unitName(x))))}. ${shape} Either way, those ${ck}s get their ${d} from the highlighted cells, so cross ${d} out everywhere else in them.`,
      });
      if (first) return out;
    }
  }
  return out;
}

function yWing(st, G, first) {
  const out = [], seen = new Set(), bi = [];
  for (let i = 0; i < G.size; i++) if (!st.grid[i] && popcount(st.cands[i]) === 2) bi.push(i);
  for (const P of bi) {
    const [x, y] = digitsOf(st.cands[P]);
    for (const [px, py] of [[x, y], [y, x]]) for (const A of bi) {
      if (!G.sees(P, A)) continue;
      const ma = st.cands[A];
      if (!has(ma, px) || has(ma, py)) continue;
      const zm = ma & ~bit(px), z = digitsOf(zm)[0];
      for (const B of bi) {
        if (B === A || !G.sees(P, B) || st.cands[B] !== (bit(py) | zm)) continue;
        const key = [P, Math.min(A, B), Math.max(A, B)].join(',');
        if (seen.has(key)) continue;
        const elim = [];
        for (let i = 0; i < G.size; i++) if (i !== P && i !== A && i !== B && has(st.cands[i], z) && G.sees(i, A) && G.sees(i, B)) elim.push({ cell: i, digit: z });
        if (!elim.length) continue;
        seen.add(key);
        const n = G.cellName;
        out.push({
          tech: 'yWing', digit: z, place: [], elim, units: [], beams: [],
          cells: [{ cell: P, role: 'pivot' }, { cell: A, role: 'pincer' }, { cell: B, role: 'pincer' }],
          marks: [
            { cell: P, digit: px, role: 'key' }, { cell: P, digit: py, role: 'key' },
            { cell: A, digit: px, role: 'key' }, { cell: A, digit: z, role: 'key' },
            { cell: B, digit: py, role: 'key' }, { cell: B, digit: z, role: 'key' },
            ...elim.map(e => ({ ...e, role: 'elim' })),
          ],
          hint: `Start from ${bold(n(P))}, a cell with just two notes. Find two cells it sees that each share one of them.`,
          text: `The pivot ${bold(n(P))} is ${px} or ${py}. If it's ${px}, then ${bold(n(A))} must be ${bold(z)}. If it's ${py}, then ${bold(n(B))} must be ${bold(z)}. Either way one pincer is ${z}, so any cell that sees both pincers can't be ${z}. Cross ${z} out of ${list(elim.map(e => bold(n(e.cell))))}.`,
        });
        if (first) return out;
      }
    }
  }
  return out;
}

export const TECH_ORDER = ['fullHouse', 'hiddenSingleBox', 'hiddenSingleLine', 'nakedSingle', 'pointing', 'claiming', 'nakedPair', 'hiddenPair', 'nakedTriple', 'xWing', 'yWing', 'swordfish'];
export const PLACING = new Set(['fullHouse', 'hiddenSingleBox', 'hiddenSingleLine', 'nakedSingle']);

const FINDERS = {
  fullHouse,
  hiddenSingleBox: (s, G, f) => hiddenSingle(s, G, f, G.BOXES, 'hiddenSingleBox'),
  hiddenSingleLine: (s, G, f) => hiddenSingle(s, G, f, G.LINES, 'hiddenSingleLine'),
  nakedSingle,
  pointing: (s, G, f) => lockedCandidates(s, G, f, true),
  claiming: (s, G, f) => lockedCandidates(s, G, f, false),
  nakedPair: (s, G, f) => nakedSubset(s, G, f, 2, 'nakedPair'),
  hiddenPair,
  nakedTriple: (s, G, f) => nakedSubset(s, G, f, 3, 'nakedTriple'),
  xWing: (s, G, f) => fish(s, G, f, 2, 'xWing'),
  yWing,
  swordfish: (s, G, f) => fish(s, G, f, 3, 'swordfish'),
};

export const findAll = (st, tech) => FINDERS[tech](st, geoOf(st.grid.length), false);
export function findStep(st, techs = TECH_ORDER) {
  const G = geoOf(st.grid.length);
  for (const t of techs) {
    const s = FINDERS[t](st, G, true);
    if (s.length) return s[0];
  }
  return null;
}

// Solve like a human. Returns the steps used, or solved:false if the techniques run out.
export function logicSolve(grid) {
  const st = newState(grid), steps = [];
  while (st.grid.includes(0)) {
    const s = findStep(st);
    if (!s) return { solved: false, steps, state: st };
    steps.push(s);
    applyStep(st, s);
  }
  return { solved: true, steps, state: st };
}

// Make a fresh 6x6 puzzle that the hint engine can fully solve.
// level 'quick' adds clues back; 'tricky' prefers puzzles needing more than singles.
export function generate6(level = 'quick', rng = Math.random) {
  for (let tries = 0; tries < 200; tries++) {
    const { puzzle, solution } = generate(rng, 6);
    const r = logicSolve(puzzle);
    if (!r.solved) continue;
    const needsMore = r.steps.some(s => !PLACING.has(s.tech));
    if (level === 'tricky' && !needsMore && tries < 150) continue;
    if (level === 'quick') {
      const empty = shuffle(puzzle.map((v, i) => (v ? -1 : i)).filter(i => i >= 0), rng);
      while (puzzle.filter(Boolean).length < 16) { const i = empty.pop(); puzzle[i] = solution[i]; }
    }
    return { puzzle, solution };
  }
  throw new Error('could not generate 6x6');
}
