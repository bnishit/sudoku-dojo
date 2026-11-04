# Sudoku Dojo — task board

The single place to see what is done, in progress, and next.
**Agents: update this file in the same commit as the work.** Move items between sections; don't delete history.
Sources for the "why" live in [`research/`](research/).

Legend: `S` small · `M` medium · `L` large · 🔬 = came from a research report

---

## 🚧 In progress

### Release 2 — "Bridge" (singles → notes drop-off)
- [ ] Fix Naked Triple hint: "same three notes" → "only three digits between them" (28/30 positions affected) 🔬 novice · S
- [ ] Fix Box-Line Reduction hint: "do they line up?" → "are they all inside one box?" 🔬 novice · S
- [ ] Hidden single text must not claim placed digits do all the blocking when earlier note removals are needed (263 hints / 108 of 200 puzzles) 🔬 novice · S
- [ ] Copy fixes: row/column lesson wording, PIN analogy, Y-Wing analogy, tier descriptions 🔬 novice · S
- [ ] New lesson "Notes" between Naked Single and Pointing Pair: add notes by hand, get told why a note is wrong/missing 🔬 novice · M
- [ ] Wrong answers explain **why** (part of the pattern / outside its reach / digit not involved / cell could still be X) 🔬 novice + teaching · M
- [ ] Row/column labels + box map on lesson and practice boards 🔬 novice · M
- [ ] Colour legend for highlights (pattern, removed, pivot, pincers) 🔬 novice · S
- [ ] Stars no longer punish hints: stars from mistakes; separate "Solved on your own 🏅" 🔬 novice · S
- [ ] Practice progress counts unique positions, not repeats 🔬 novice · S
- [ ] "Fill notes" keeps your own deductions instead of overwriting them 🔬 novice · S
- [ ] Me → "Puzzles" counts all wins, not the capped history list 🔬 novice · S

### Release 3 — "Daily practice"
- [ ] Mystery move: find any valid next move, technique not named; reveal which one it was 🔬 teaching · M
- [ ] Spaced review queue per technique (1 → 3 → 7 → 14 days; reset on hint or mistake) 🔬 teaching · M
- [ ] "Today's practice" one-button session: 5 mystery moves, 1 counts as a practice day 🔬 habit · M
- [ ] Weekly view (Mon–Sun dots) + weekly goal (default 3, settable 1–7) 🔬 habit · M
- [ ] Forgiving streak: 1 rest day per 7 allowed, best streak kept 🔬 habit · S
- [ ] Warm "Welcome back" after a break 🔬 habit · S
- [ ] Optional calendar reminder (.ics download, no server) 🔬 habit · S
- [ ] Spoiler-free share of today's result 🔬 habit · S

---

## 📋 Remaining (not started)
- [ ] Scanning-routine lesson + drill ("check near-full areas → scan one digit → follow up after each placement") 🔬 teaching · M
- [ ] Faded worked examples inside lessons (watch one → finish one → solo) 🔬 teaching · M
- [ ] "Pattern or impostor?" drill: spot the near-miss that is *not* a valid pattern 🔬 teaching · M
- [ ] Untimed Rush warm-up with persistent feedback 🔬 novice · S
- [ ] Belt mastery = delayed independent use on fresh positions, not lesson completion 🔬 teaching · M
- [ ] New techniques: Hidden Triple, Pointing Triple label, Skyscraper, Two-String Kite, XYZ-Wing, W-Wing, Simple Colouring 🔬 teaching · L
- [ ] Snyder / box-corner notation lesson, kept visually distinct from full notes 🔬 teaching · M
- [ ] Difficulty rating that uses total work + bottlenecks, not just hardest technique 🔬 teaching · L
- [ ] Export / import progress (local storage can be wiped) 🔬 habit · S
- [ ] Real push reminders (needs a push sender/backend) 🔬 habit · L
- [ ] Custom domain instead of `sudoku-dojo-eight.vercel.app` · S

---

## ✅ Done

### Release 1 — first launch (2026-11-04)
- [x] Engine: 9×9 + 6×6 geometry, unique-solution solver, symmetric generator, 12 technique finders with highlights and explanations
- [x] Generated bank: 30 positions × 12 techniques, 40 puzzles × 5 tiers; every step checked against the solution
- [x] 12 lessons in 5 belts (intro → 3-beat demo → 3 practice positions)
- [x] Practice any technique (30 positions each) and 90-second Technique Rush
- [x] Play: 5 tiers, daily puzzle, Mini 6×6, notes, fill notes, undo, Quick fill, 3-level hints, mistake check
- [x] Delight: sounds, haptics, pops, row/box ripple, confetti, belt ceremony
- [x] Local progress: XP, streak, stars, best times, recent games, settings
- [x] PWA: installable, works offline (network-first service worker)
- [x] Landing page, README, MIT license, public GitHub repo, Vercel auto-deploy from `main`
- [x] Research round: teaching, habit, novice review → `research/`
