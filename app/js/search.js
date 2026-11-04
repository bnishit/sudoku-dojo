import * as E from './engine.js';
import { Board } from './board.js';

// One scale: six teaching rungs, then the existing beams / start / solo fade.
export const freshSearch = () => ({ rung: 1, positions: [], puzzle: false, solo: [], puzzleIds: [], nextDay: null, checkedDay: null, introSeen: false, legendSeen: false });
export function loadSearch(value) {
  const p = { ...freshSearch(), ...value };
  p.rung = Number.isInteger(value?.rung) && value.rung >= 1 && value.rung <= 9 ? value.rung
    : [1, 7, 8, 9][value?.stage] || 1;
  delete p.stage; delete p.setbacks;
  for (const k of ['positions', 'solo', 'puzzleIds']) p[k] = Array.isArray(p[k]) ? p[k].filter(v => typeof v === 'string') : [];
  // Old positions belong to a different scale; don't count them as new reps.
  if (value && !('rung' in value)) p.positions = [];
  return p;
}
export function recordSearch(value, { position, clean, placed, completed = placed, fullPuzzle = false, puzzleId = position, day, rung = value.rung }) {
  const p = loadSearch(value);
  if (!completed || !clean || rung !== p.rung) return p;
  const seenPuzzle = p.puzzleIds.includes(puzzleId);
  if (fullPuzzle && !seenPuzzle) p.puzzleIds.push(puzzleId);
  if (p.rung === 9) {
    if (!p.solo.includes(position)) {
      if (p.nextDay && day > p.nextDay && fullPuzzle && !seenPuzzle && !p.positions.includes(position)) p.checkedDay = day;
      p.solo.push(position); p.nextDay ??= day;
    }
    return p;
  }
  if (p.positions.includes(position)) return p;
  p.positions.push(position); p.puzzle ||= fullPuzzle;
  const needed = p.rung <= 6 ? 2 : p.rung === 7 ? 3 : 4;
  if (p.positions.length >= needed && (p.rung !== 8 || p.puzzle)) {
    p.rung++; p.positions = []; p.puzzle = false;
    if (p.rung === 9) p.nextDay = day;
  }
  return p;
}
export const boxes = E.G9.UNITS.map((_, u) => u).filter(u => !E.G9.isLine(u));

// Lesson reps must support both the first blocker tap and the later dead-end retry.
export function ladderReady(grid) {
  const starts = E.rankSearchStarts(grid, boxes);
  return starts.some(s => s.remaining.length === 2 && starts.some(t => t.digit === s.digit && t.remaining.length === 1 && t.blockers.length));
}

export function followUpPrompt(grid, last) {
  const d = grid[last], before = grid.slice(); before[last] = 0;
  const forced = E.searchFollowUps(grid, last).some(s => boxes.includes(s.unit));
  const reached = boxes.some(u => {
    const after = E.searchFacts(grid, d, u), prior = E.searchFacts(before, d, u);
    return prior.remaining.some(i => i !== last && !after.remaining.includes(i));
  });
  return !reached ? `No empty cells were newly ruled out for ${d}. Pick a new number.`
    : forced ? `Your new ${d} rules out cells. Check a box it reached.`
    : `That did not force another ${d}. Check another box or pick a new number.`;
}

// The isolated board never edits a game's grid or notes.
export function mountSearch(root, { grid, progress, persist, onPlace, onExit, onRep, onSkip, digit = 0, fullPuzzle = false, puzzleId, hinted = false }) {
  const G = E.G9, position = E.stringify(grid), starts = E.rankSearchStarts(grid, boxes);
  const rung = loadSearch(progress).rung, solo = rung === 6 || rung === 9;
  const start = starts.find(s => s.remaining.length === (rung === 5 ? 2 : 1) && (rung !== 1 || s.blockers.length) && (rung !== 5 || starts.some(t => t.digit === s.digit && t.remaining.length === 1)));
  let d = rung <= 3 ? start?.digit || 0 : 0, unit = rung <= 2 || rung === 5 ? start?.unit ?? -1 : -1;
  if (rung === 5) d = start?.digit || 0;
  // A supplied follow-up digit must not take away the digit-choice rungs.
  if (rung === 3 && digit && starts.some(s => s.digit === digit && s.remaining.length === 1)) d = digit;
  let searched = 0;
  let checked = new Set(), dirty = hinted && rung >= 8, hints = 0, message = '', done = false, deadSeen = false, sheet = false;
  const firstLegend = rung === 1 && !progress.legendSeen;
  if (firstLegend) { progress = { ...loadSearch(progress), legendSeen: true }; persist(progress); }
  root.innerHTML = `<section class="search-view"><p class="search-prompt" aria-live="polite"></p><p class="search-action" aria-live="polite"></p><div class="search-board board-frame labeled"><div class="col-labels">${Array.from({length:9},(_,i)=>`<span>${i+1}</span>`).join('')}</div><div class="row-labels">${Array.from({length:9},(_,i)=>`<span>${i+1}</span>`).join('')}</div><div class="search-grid"></div></div><p class="search-feedback" aria-live="polite"></p><div class="search-controls"></div><div class="search-footer"><button class="btn link sm" data-help>Help</button></div><div class="search-sheet" hidden></div></section>`;
  const q = s => root.querySelector(s), controls = q('.search-controls');
  const facts = () => unit < 0 ? null : E.searchFacts(grid, d, unit);
  const blocked = () => new Set((facts()?.blockers || []).filter(b => checked.has(b.cell)).flatMap(b => b.cells));
  const pending = () => (facts()?.blockers || []).filter(b => !checked.has(b.cell) && b.cells.some(i => !blocked().has(i)));
  const fail = text => { dirty = true; message = text; draw(); };
  const ready = () => !pending().length;
  function choose(u) {
    const f = E.searchFacts(grid, d, u);
    if (f.present) return fail(`This box already has a ${d}.`);
    if (!f.remaining.length) return fail('No spots remain. Check the puzzle for a conflict.');
    unit = u; checked.clear(); message = `Yes. This box is missing ${d}.`;
    if (rung === 7) checked = new Set(f.blockers.map(b => b.cell));
    draw();
  }
  function finish(place) {
    done = true;
    persist(recordSearch(progress, { position, clean: !dirty && (rung !== 5 || deadSeen), placed: place, completed: true, fullPuzzle, puzzleId, day: new Date().toLocaleDateString('en-CA'), rung }));
    message = place ? `Found it! The ${d} goes here.` : message;
    draw();
  }
  const board = new Board(q('.search-grid'), i => {
    if (done) return;
    if (!d && rung === 4) return fail('Choose a digit below.');
    if (!d && grid[i] && grid.filter(v=>v===grid[i]).length < 9) { d=grid[i]; message=`Yes. Look for ${d}.`; return draw(); }
    if (!d) return fail('Tap a placed digit first.');
    if (unit < 0) {
      if (grid[i]) return fail(`Tap an empty cell in a box missing ${d}.`);
      return choose(G.CELL_UNITS[i].find(u => boxes.includes(u)));
    }
    if (grid[i]) {
      if (rung === 1 && i !== pending()[0]?.cell) return fail('Tap the glowing digit first.');
      if (grid[i] !== d) return fail(`Look for a placed ${d}.`);
      const b = facts().blockers.find(b => b.cell === i);
      if (!b) return fail(`This ${d} blocks no empty cells in this box.`);
      if (checked.has(i)) { message = 'Already checked. Try another.'; return draw(); }
      checked.add(i);
      const beam = b.beams.find(b => G.isLine(b.unit));
      message = beam ? `Yes. That ${d} blocks ${G.isRow(beam.unit) ? 'row' : 'column'} ${G.isRow(beam.unit) ? G.ROW[i] + 1 : G.COL[i] + 1} in this box.` : `Yes. That ${d} blocks these cells in this box.`;
      if (rung === 1) return finish(false);
      return draw();
    }
    if (!G.UNITS[unit].includes(i)) {
      if (solo || rung === 8) return choose(G.CELL_UNITS[i].find(u => boxes.includes(u)));
      return fail('Tap inside the chosen box.');
    }
    if (!ready() && !solo && rung !== 8) return fail(`Check the glowing ${d}s first.`);
    if (facts().remaining.length !== 1) return fail('More than one spot fits. Try another box.');
    if (!facts().remaining.includes(i)) {
      const beam = !solo && rung !== 8 ? facts().blockers.find(b => b.cells.includes(i))?.beams.find(b => G.UNITS[b.unit].includes(i)) : null;
      return fail(beam ? `The ${G.isRow(beam.unit) ? 'row' : 'column'} ${G.isRow(beam.unit) ? G.ROW[i]+1 : G.COL[i]+1} stripe rules out this cell for ${d}.` : `A placed ${d} blocks that cell.`);
    }
    finish(true);
  });
  function draw() {
    const independent = (rung >= 8 || solo) && !hints;
    const f = facts(), bs = (f?.blockers || []).filter(b => checked.has(b.cell)), crossed = blocked();
    const step = { units: unit < 0 ? [] : [unit], beams: independent ? [] : bs.flatMap(b => b.beams.map(b => b.unit)), cells: (independent ? [] : [...crossed]).map(cell => ({cell,role:'blocked'})), marks: [], place: [], elim: [] };
    const display = grid.slice();
    if (done && rung !== 1) display[f.remaining[0]] = d;
    board.render({ grid: display, givens: grid.map(Boolean), step, level: 2, peers: false });
    board.el.classList.add('search-view-grid');
    let targets = !d && !done && rung !== 4 ? grid.flatMap((v,i)=>v && grid.filter(n=>n===v).length<9 ? [i] : []) : [];
    if (!done && d) targets = unit < 0 ? boxes.filter(u => !E.searchFacts(grid,d,u).present).flatMap(u => G.UNITS[u].filter(i => !grid[i]))
      : independent || ready() ? [] : pending().map(b => b.cell);
    if (rung === 1) targets = targets.slice(0, 1);
    // Reapply after Board.render, including when its render cache skips a cell.
    board.cells.forEach((c,i) => { c.el.classList.toggle('search-tap', targets.includes(i)); c.el.classList.toggle('search-dim', !targets.includes(i) && !(unit >= 0 && G.UNITS[unit].includes(i) && !grid[i])); c.el.classList.toggle('search-choice', unit < 0 && targets.includes(i)); });
    let instruction = !d ? 'Pick a digit.' : unit < 0 ? `Tap a box missing ${d}.` : ready() ? `Tap the one spot for ${d}.` : `Tap a glowing ${d}.`;
    if (rung === 1 && !done) { const b = pending()[0]; if (b) instruction = `Tap the ${d} in row ${G.ROW[b.cell] + 1} to see what it blocks.`; }
    if (rung === 4 && !d) {
      const n = Array.from({length:9},(_,i)=>i+1).filter(n => grid.filter(v=>v===n).length < 9).sort((a,b)=>grid.filter(v=>v===b).length-grid.filter(v=>v===a).length)[0];
      instruction = `Try ${n}: it has the most placed.`;
    }
    if (f && ready() && f.remaining.length > 1 && !done) instruction = 'Try another box.';
    const praise = /^(Yes\.|Found it!)/.test(message);
    q('.search-prompt').textContent = praise ? `✓ ${message}` : d ? `Where can the ${d} go in ${unit < 0 ? 'a' : 'this'} box?` : 'Which number can we place?';
    q('.search-prompt').classList.toggle('search-praise', praise);
    q('.search-action').textContent = done || ((solo || (rung === 8 && d)) && !hints) ? '' : instruction;
    q('.search-feedback').textContent = praise ? '' : message;
    controls.innerHTML = '';
    const button = (text, fn, parent = controls, primary = true) => { const b = document.createElement('button'); b.className = primary ? 'btn primary' : 'btn ghost'; b.textContent = text; b.onclick = fn; parent.append(b); return b; };
    if (firstLegend && !done) { const legend = document.createElement('small'); legend.textContent = 'A beam shows a row or column. Stripes mean this digit cannot go there.'; controls.append(legend); }
    if (!d && !done && rung === 4) {
      const digits = document.createElement('div'); digits.className = 'search-digits'; controls.append(digits);
      for (let n=1;n<=9;n++) { const count=grid.filter(v=>v===n).length; if(count===9) continue;
        button(`${n} · ${count}`, () => { d=n; message=`Yes. Look for ${n}.`; unit=-1; draw(); }, digits, false);
      }
    }
    if (done) button('Continue', () => {
      if (rung === 1) return onRep?.();
      onPlace?.({cell:f.remaining[0],digit:d,mistakes:0,hints:hints + Number(dirty || rung < 6 || rung === 7)});
    });
    else if (f && ready() && f.remaining.length > 1) {
      if (rung === 5 && !deadSeen && f.remaining.length === 2) { deadSeen = true; message = 'Two spots. Not ready yet. That is normal. Try another box.'; q('.search-feedback').textContent = message; }
      else if (!message) q('.search-feedback').textContent = `${f.remaining.length} spots. Not ready yet. Try another box.`;
      button(searched >= 1 && rung >= 4 ? 'Try another digit' : 'Try another box', () => { if (++searched >= 2 && rung >= 4) { d=0; searched=0; } unit=-1; checked.clear(); message='Yes. Keep looking.'; draw(); });
    }
    else if (!start && !d) q('.search-feedback').textContent = 'No box is ready. Open Help to skip this search.';
    const panel = q('.search-sheet'); panel.hidden = !sheet; panel.innerHTML = '';
    if (sheet) {
      button('Show me', () => {
        dirty=true; hints++; sheet=false;
        const s = starts.find(s=>s.remaining.length===1);
        if (!s) { message='No box is ready. Skip this search.'; return draw(); }
        d=s.digit; unit=s.unit; checked=new Set(s.blockers.map(b=>b.cell)); message=`Look at the one spot for ${d}.`; if (rung === 1) { message=`Watch how the placed ${d}s block these cells.`; return finish(false); } draw();
      }, panel);
      button('Skip', () => { dirty=true; sheet=false; (onSkip || onRep || onExit)?.(); }, panel, false);
      button('Exit', onExit, panel, false);
    }
    controls.hidden = sheet;
    q('[data-help]').onclick = () => { sheet=!sheet; draw(); };
  }
  draw();
}
