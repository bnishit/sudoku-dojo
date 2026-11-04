import * as E from './engine.js';
import { LESSONS } from './lessons.js';

export const KIND_NAMES = {
  ...Object.fromEntries(E.TECH_ORDER.map(t => [t, LESSONS[t].title])),
  fullHouse: 'Full House', hiddenSingleBox: 'Hidden Single in a box',
  hiddenSingleRow: 'Hidden Single in a row', hiddenSingleCol: 'Hidden Single in a column',
  nakedSingle: 'Naked Single',
};
export const kindTech = kind => ['hiddenSingleRow', 'hiddenSingleCol'].includes(kind) ? 'hiddenSingleLine' : kind;
export const stepKind = step => step.tech === 'hiddenSingleLine'
  ? (E.G9.isRow(step.units[0]) ? 'hiddenSingleRow' : 'hiddenSingleCol') : step.tech;

export function available(grid) {
  if (grid.length !== 81) return [];
  const st = E.newState(grid), seen = new Set(), moves = [];
  for (const tech of E.TECH_ORDER.filter(t => E.PLACING.has(t))) {
    for (const step of E.findAll(st, tech)) for (const { cell, digit } of step.place) {
      const key = cell * 10 + digit;
      if (seen.has(key)) continue;
      seen.add(key);
      moves.push({ kind: stepKind(step), cell, digit });
    }
  }
  return moves;
}
export const classify = (grid, cell, digit) => available(grid).find(m => m.cell === cell && m.digit === digit)?.kind || null;

export function record(stats, kind, outcome, secs) {
  const v = { found: 0, stuck: 0, hint: 0, secs: 0, n: 0, timed: 0, ...stats[kind] };
  // Older stats without a timed counter counted every found event as timed.
  v.timed = stats[kind]?.timed ?? v.found;
  v[outcome]++; v.n++;
  if (outcome === 'found' && secs > 0) { v.secs += secs; v.timed++; }
  return { ...stats, [kind]: v };
}
const average = v => (v.timed ?? v.found) ? v.secs / (v.timed ?? v.found) : null;

export function blindSpot(stats) {
  const entries = Object.entries(stats), total = entries.reduce((n, [, v]) => n + v.n, 0);
  if (total < 12) return null;
  const timed = entries.reduce((n, [, v]) => n + (v.timed ?? v.found), 0);
  const avg = timed ? entries.reduce((n, [, v]) => n + v.secs, 0) / timed : 0;
  const candidates = entries.filter(([, v]) => v.n >= 4 &&
    ((v.stuck + v.hint) / v.n >= 0.3 || (avg > 0 && average(v) >= 2 * avg)));
  candidates.sort(([, a], [, b]) => (b.stuck + b.hint) / b.n - (a.stuck + a.hint) / a.n || (average(b) || 0) - (average(a) || 0));
  if (!candidates.length) return null;
  const [kind, v] = candidates[0], secs = average(v);
  const comparison = kind.startsWith('hiddenSingle') ? entries
    .filter(([k, s]) => k !== kind && ['hiddenSingleRow', 'hiddenSingleCol', 'hiddenSingleBox'].includes(k) && average(s) !== null)
    .sort(([, a], [, b]) => average(a) - average(b))[0] : null;
  const labels = { hiddenSingleRow: 'rows', hiddenSingleCol: 'columns', hiddenSingleBox: 'boxes' };
  const compare = comparison ? `, but only ${Math.round(average(comparison[1]))}s in ${labels[comparison[0]]}` : '';
  const timing = secs === null ? '' : `You take ${Math.round(secs)}s to spot these${compare}. `;
  const help = v.stuck + v.hint;
  return { kind, why: `${timing}You needed help on ${help} of ${v.n}.` };
}

export const addMoment = (moments, m) => [...moments, {
  g: m.g, s: m.s, tech: m.tech, kind: m.kind, date: m.date,
}].slice(-20);
