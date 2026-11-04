// Board view: draws a 9x9 or 6x6 grid with values, notes and technique highlights.
import { geoOf, has } from './engine.js';

export class Board {
  constructor(el, onTap) {
    this.el = el;
    this.onTap = onTap;
    this.n = 0;
    this.cache = [];
    el.addEventListener('pointerdown', e => {
      const c = e.target.closest('.cell');
      if (c) { e.preventDefault(); this.onTap(+c.dataset.i); }
    });
  }

  build(n) {
    const G = geoOf(n * n);
    this.n = n; this.G = G; this.cache = [];
    this.el.className = `board n${n}`;
    this.el.style.setProperty('--n', n);
    let html = '';
    for (let i = 0; i < G.size; i++) {
      const r = G.ROW[i], c = G.COL[i];
      const edge = ((c + 1) % G.bw === 0 && c < n - 1 ? ' br' : '') + ((r + 1) % G.bh === 0 && r < n - 1 ? ' bb' : '');
      let notes = '';
      for (let d = 1; d <= n; d++) notes += `<span class="nt" data-d="${d}"></span>`;
      html += `<div class="cell${edge}" data-i="${i}" role="gridcell"><b class="v"></b><div class="notes">${notes}</div></div>`;
    }
    this.el.innerHTML = html;
    this.cells = [...this.el.children].map(c => ({ el: c, v: c.firstChild, notes: [...c.lastChild.children] }));
  }

  // v: { grid, givens, notes, struck, selected, spot, errors:Set, step, level, peers }
  render(v) {
    const n = Math.sqrt(v.grid.length);
    if (n !== this.n) this.build(n);
    const G = this.G, sel = v.selected ?? -1;
    const spot = v.spot || (sel >= 0 ? v.grid[sel] : 0);
    const H = highlights(G, v.step, v.level || 0);
    for (let i = 0; i < G.size; i++) {
      const val = v.grid[i], cell = this.cells[i];
      const cls = ['cell', cell.el.className.match(/ br/) ? 'br' : '', cell.el.className.match(/ bb/) ? 'bb' : ''];
      if (val) cls.push(v.givens?.[i] ? 'given' : 'user');
      if (v.errors?.has(i)) cls.push('err');
      if (sel >= 0 && v.peers !== false && i !== sel && G.sees(i, sel)) cls.push('peer');
      if (spot && val === spot) cls.push('same');
      if (H.beam.has(i)) cls.push('beam');
      if (H.unit.has(i)) cls.push('unit');
      const role = H.role.get(i);
      if (role) cls.push('r-' + role);
      if (i === sel) cls.push('sel');
      const ghost = H.ghost.get(i);
      if (ghost && !val) cls.push('ghosted');
      const name = cls.filter(Boolean).join(' ');
      const text = val ? String(val) : ghost ? String(ghost) : '';
      const mask = val ? 0 : (v.notes?.[i] || 0) | (v.struck?.[i] || 0);
      const key = name + '|' + text + '|' + mask + '|' + (val ? '' : noteKey(i, n, v, H, spot));
      if (this.cache[i] === key) continue;
      this.cache[i] = key;
      cell.el.className = name;
      cell.v.textContent = text;
      for (let d = 1; d <= n; d++) {
        const span = cell.notes[d - 1];
        const on = !val && has(v.notes?.[i] || 0, d), struck = !val && has(v.struck?.[i] || 0, d);
        span.textContent = on || struck ? d : '';
        const mark = H.mark.get(i * 10 + d);
        span.className = 'nt' + (struck ? ' struck' : '') + (mark ? ' m-' + mark : '') + (spot === d && on ? ' spot' : '');
      }
    }
  }

  pulse(i, cls = 'pop', k = 0) {
    const el = this.cells?.[i]?.el;
    if (!el) return;
    el.style.setProperty('--k', k);
    el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 600 + k * 45);
  }

  // Ripple across a finished row, column or box.
  wave(cells) { cells.forEach((i, k) => this.pulse(i, 'wave', k)); }
}

function noteKey(i, n, v, H, spot) {
  let k = spot + ':';
  for (let d = 1; d <= n; d++) k += H.mark.get(i * 10 + d) || '-';
  return k;
}

// level 0: nothing · 2: region + evidence · 3: full answer
export function highlights(G, step, level) {
  const H = { unit: new Set(), beam: new Set(), role: new Map(), mark: new Map(), ghost: new Map() };
  if (!step || level < 2) return H;
  for (const u of step.units || []) for (const i of G.UNITS[u]) H.unit.add(i);
  for (const u of step.beams || []) for (const i of G.UNITS[u]) H.beam.add(i);
  for (const { cell, role } of step.cells || []) if (role !== 'target' || level >= 3) H.role.set(cell, role);
  for (const m of step.marks || []) if (m.role !== 'elim' || level >= 3) H.mark.set(m.cell * 10 + m.digit, m.role);
  if (level >= 3) for (const p of step.place) H.ghost.set(p.cell, p.digit);
  return H;
}

// Tiny markdown: **bold** only. Text is ours, but escape anyway.
export const md = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
