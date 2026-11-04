// Minimal DOM adapter: mount the real search and Board, including pointer dispatch.
import assert from 'node:assert/strict';
import * as E from '../app/js/engine.js';
import { BANK } from '../app/data/bank.js';
import { mountSearch, freshSearch } from '../app/js/search.js';

class Element {
  constructor() {
    this.children = []; this.listeners = {}; this.className = '';
    this.style = { setProperty() {} };
    this.classList = {
      add: c => { this.className += ' ' + c; },
      toggle: (c, on) => { const names = new Set(this.className.split(/\s+/)); on ? names.add(c) : names.delete(c); this.className = [...names].join(' '); },
    };
  }
  set innerHTML(html) {
    this.children = []; this.html = html;
    // Board.build creates these exact cells. Keep their actual indices and text.
    for (const [, classes, i] of html.matchAll(/<div class="(cell[^"]*)" data-i="(\d+)"/g)) {
      const cell = new Element(); cell.className = classes; cell.dataset = { i };
      cell.firstChild = {}; cell.lastChild = { children: Array.from({ length: 9 }, () => ({})) };
      cell.closest = selector => selector === '.cell' ? cell : null;
      this.children.push(cell);
    }
  }
  append(child) { this.children.push(child); }
  addEventListener(name, fn) { this.listeners[name] = fn; }
  insertAdjacentHTML() {}
  querySelector(selector) { return this.parts[selector]; }
}

export function checkSearchInteractions() {
  const originalDocument = globalThis.document;
  globalThis.document = { createElement: () => new Element() };
  try {
    const grid=E.parse(BANK.lessons.hiddenSingleBox[0].g);
    for(let rung=1;rung<=9;rung++) {
      const root = new Element();
      root.parts = Object.fromEntries(['.search-controls','.search-grid','.search-prompt','.search-action','.search-feedback','[data-help]','.search-sheet'].map(s=>[s,new Element()]));
      let saved={...freshSearch(),rung}, result, reps=0;
      mountSearch(root,{grid,progress:saved,persist:p=>saved=p,onRep:()=>reps++,onPlace:r=>result=r});
      const controls=root.parts['.search-controls'], board=root.parts['.search-grid'];
      const tap=i=>board.listeners.pointerdown({target:board.children[i],preventDefault(){}});
      const chooseDigit=()=>controls.children.find(c=>c.className==='search-digits')?.children.find(c=>c.textContent.startsWith('4'))?.onclick();
      if(rung===4) chooseDigit();
      else if(rung>=6) tap(grid.indexOf(4));
      if([3,4,6,7,8,9].includes(rung)) tap(3); // Empty cell chooses top-middle box; never treats it as a wrong digit.
      assert.notEqual(root.parts['.search-feedback'].textContent,'Look for a placed 4.');
      if(rung===1) {
        const goal = root.parts['.search-prompt'].textContent;
        assert.match(goal, /Where can the/);
        assert.match(root.parts['.search-action'].textContent, /to see what it blocks/);
        tap(0); assert.equal(root.parts['.search-prompt'].textContent, goal);
        assert.ok(root.parts['.search-feedback'].textContent);
        const start=E.rankSearchStarts(grid,Array.from({length:9},(_,i)=>i+18)).find(s=>s.remaining.length===1&&s.blockers.length);
        tap(start.blockers[0].cell);
        assert.match(root.parts['.search-prompt'].textContent, /^✓ Yes\./);
        assert.equal(root.parts['.search-action'].textContent, '');
        controls.children.find(c=>c.textContent==='Continue').onclick(); assert.equal(reps,1);
        assert.equal(saved.positions.length,0,'corrected rep does not advance');
      }
      if(rung===2) {
        const start=E.rankSearchStarts(grid,Array.from({length:9},(_,i)=>i+18)).find(s=>s.remaining.length===1);
        for(const b of start.blockers) tap(b.cell);
        assert.match(root.parts['.search-action'].textContent, /Tap the one spot/);
        assert.ok(!board.children[start.remaining[0]].className.includes('search-tap'), 'answer has no outline');
        assert.ok(!board.children[start.remaining[0]].className.includes('search-dim'), 'unstriped cells remain readable');
        const blocked=start.blockers[0].cells[0]; tap(blocked);
        assert.match(root.parts['.search-feedback'].textContent, /stripe rules out/);
        tap(start.remaining[0]);
        assert.match(root.parts['.search-prompt'].textContent, /^✓ Found it!/);
      }
      assert.deepEqual(grid,E.parse(BANK.lessons.hiddenSingleBox[0].g),'caller grid stays unchanged');
      assert.ok(controls.children.filter(c=>c.className==='btn primary').length<=1);
      root.parts['[data-help]'].onclick();
      assert.deepEqual(root.parts['.search-sheet'].children.map(c=>c.textContent),['Show me','Skip','Exit']);
      assert.equal(controls.hidden,true);
      assert.equal(result,undefined);
      root.parts['.search-sheet'].children.find(c=>c.textContent==='Show me').onclick();
      const revealed=E.rankSearchStarts(grid,Array.from({length:9},(_,i)=>i+18)).find(s=>s.remaining.length===1);
      if(rung!==1) tap(revealed.remaining[0]);
      controls.children.find(c=>c.textContent==='Continue').onclick();
      assert.equal(saved.positions.length,0,'Show me cannot earn a clean rep');
      if(rung!==1) {
        assert.equal(result.cell,revealed.remaining[0]); assert.equal(result.digit,revealed.digit);
        assert.equal(result.mistakes,0,'help never costs stars'); assert.ok(result.hints>0);
      }
    }
    // Preserve the simulator regression: choose digit 3, then both visibly empty boxes.
    for(const options of [{},{fullPuzzle:true,hinted:true},{digit:3,supplied:true}]) {
      const reported=E.parse('35......21.6....3....73.1.....325....2..6..7...41.8.....3.94....8.....474......29');
      const root=new Element(); root.parts=Object.fromEntries(['.search-controls','.search-grid','.search-prompt','.search-action','.search-feedback','[data-help]','.search-sheet'].map(s=>[s,new Element()]));
      mountSearch(root,{grid:reported,progress:{...freshSearch(),rung:4},persist(){},...options});
      root.parts['.search-controls'].children.find(c=>c.className==='search-digits').children.find(c=>c.textContent.startsWith('3 ·')).onclick();
      const board=root.parts['.search-grid'];
      board.listeners.pointerdown({target:board.children[33],preventDefault(){}});
      assert.match(root.parts['.search-prompt'].textContent,/missing 3/);
    }
  } finally {
    if(originalDocument===undefined) delete globalThis.document; else globalThis.document=originalDocument;
  }
}
