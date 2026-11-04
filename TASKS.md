# Sudoku Dojo — task board

The single place to see what is done, in progress, and next.
**Agents: update this file in the same commit as the work.** Move items between sections; don't delete history.
Sources for the "why" live in [`research/`](research/).

Legend: `S` small · `M` medium · `L` large · 🔬 = came from a research report

---

## 🚧 In progress

- [ ] iPhone app v1, **fully free**: thin native shell around `app/`, offline, native haptics/backup/reminders. Brief: [`ios/BRIEF.md`](ios/BRIEF.md). Codex builds, Claude reviews each phase in the simulator 🔬 market research · L
  - [x] Brief written; Xcode 27 selected (2026-11-04)
  - [x] Phase 1 shell (2026-11-04) · built by Codex, reviewed by Claude: builds, runs on iPhone 17 simulator from the bundle (no network allowed), save survives reinstall, light + dark OK, notch clear. Fonts fall back to system fonts in the shell for now. Cold launch ~4 s in a debug build.
  - [x] Phase 2 iPhone fixes (2026-11-04) · built by Codex, reviewed by Claude: backup opens the share sheet with the .json file (Save to Files offered; full save not tried), native haptics wired, sound follows the silent switch, calendar button hidden in the app. Haptics can't be felt in the simulator; check on a real phone.
  - [x] Phase 3 daily reminder (2026-11-04) · built by Codex, reviewed by Claude: toggle asks permission only on tap, notification 'Today's puzzle is ready. Five minutes?' delivered on time in the simulator, no server. App-only copy fixed (phone, not browser). Not verified: tapping the notification opens the daily puzzle (simulator won't open from lock screen; code path reviewed); real-phone check needed.
  - [ ] Phase 4 store prep · code done 2026-11-04 (Codex, reviewed by Claude): sharp 1024 icon rendered from icon.svg, dark/light launch colour (no white flash, checked), privacy manifest = no tracking, no data collected, v1.0 (1), iPhone portrait. Still to do: 6 store screenshots; real-phone check of haptics + reminder tap. No submission.
  - [ ] Store pack · icon options + listing + screenshot generator written (2026-11-04), pending Claude review; real captures pending. See [`ios/store/README.md`](ios/store/README.md).

---

## 📋 Remaining (not started)
- [ ] Faded worked examples inside lessons (watch one → finish one → solo) 🔬 teaching · M
- [ ] "Pattern or impostor?" drill: spot the near-miss that is *not* a valid pattern 🔬 teaching · M
- [ ] Belt mastery = delayed independent use on fresh positions, not lesson completion 🔬 teaching · M
- [ ] New techniques: Hidden Triple, Pointing Triple label, Skyscraper, Two-String Kite, XYZ-Wing, W-Wing, Simple Colouring 🔬 teaching · L
- [ ] Snyder / box-corner notation lesson, kept visually distinct from full notes 🔬 teaching · M
- [ ] Difficulty rating that uses total work + bottlenecks, not just hardest technique 🔬 teaching · L
- [ ] Real push reminders (needs a push sender/backend) 🔬 habit · L
- [ ] Custom domain instead of `sudoku-dojo-eight.vercel.app` · S
- [ ] iPhone paid unlock (after v1 is live and free). Decide free vs paid and the price first. Proposal: free = White + Yellow Belt, Gentle/Easy, daily, Mini 6×6; one purchase unlocks the rest; hints never paid; anchor Good Sudoku $4.99. Build: StoreKit 2 on device, no server, "Restore purchase" on Me 🔬 market research · M

---

## ✅ Done

### Release 5 — "Your coach" (2026-11-04) · built by Codex, reviewed + UI-checked by Claude
- [x] Rename to **Sudoku Belts** (the "Sudoku Dojo" name is taken on both stores); save key + backup id unchanged so no progress is lost
- [x] Blind-spot coach: while you play 9×9 puzzles (daily included), it notes what you find fast, slow, or get stuck on (45 s with a move available) or need a hint for; hidden singles split into row / column / box 🔬 market research · L
- [x] Me → "Your blind spot" card + win-screen tile, shown only once there is enough evidence (12+ moves, 4+ of that kind)
- [x] "Your missed moments": replays the exact positions where you got stuck (last 20 kept)
- [x] Market research report → `research/market-research.md`
- [x] `npm test`: coach classification, row/column split, blind-spot rules, moment cap

### Release 4 — "Find moves faster" (2026-11-04)
- [x] Scanning Routine lesson (White Belt, lesson 5): nearly full areas → one digit → follow up, coached on a real puzzle; help fades after 3 placements 🔬 teaching · M
- [x] Scanning drill in Practice: 12 placements, no timer, any provable digit accepted 🔬 teaching · M
- [x] Untimed Rush warm-up: same moves, no clock, hints on, explanations stay until Continue 🔬 novice · S
- [x] Back up / restore progress as a file (Me → Back up your progress) 🔬 habit · S
- [x] `npm test`: scanning coach never runs dry on Gentle/Easy and every digit is true; backup round-trip

### Release 3 — "Daily practice" (2026-11-04)
- [x] Mystery move: find any valid next move, technique not named; reveal which one it was 🔬 teaching · M
- [x] Spaced review queue per technique (1 → 3 → 7 → 14 → 30 days; reset on hint or mistake) 🔬 teaching · M
- [x] "Today's practice" one-button session: 5 mystery moves, 1 counts as a practice day 🔬 habit · M
- [x] Weekly view (Mon–Sun dots) + weekly goal (default 3, settable 1–7) 🔬 habit · M
- [x] Forgiving streak: 1 rest day per 7 allowed, best streak kept 🔬 habit · S
- [x] Warm "Welcome back" after a break 🔬 habit · S
- [x] Optional calendar reminder (.ics download, no server) 🔬 habit · S
- [x] Spoiler-free share of today's result 🔬 habit · S
- [x] Mystery-moves card in Practice; Rush described as best for techniques that already feel easy

### Release 2 — "Bridge" (2026-11-04)
- [x] Fix Naked Triple hint: "same three notes" → "only three digits between them" (28/30 positions affected) 🔬 novice · S
- [x] Fix Box-Line Reduction hint: "do they line up?" → "are they all inside one box?" 🔬 novice · S
- [x] Hidden single text must not claim placed digits do all the blocking when earlier note removals are needed (263 hints / 108 of 200 puzzles) 🔬 novice · S
- [x] Copy fixes: row/column lesson wording, PIN analogy, Y-Wing analogy, tier descriptions 🔬 novice · S
- [x] New lesson "Notes" between Naked Single and Pointing Pair: add notes by hand, get told why a note is wrong/missing 🔬 novice · M
- [x] Wrong answers explain **why** (part of the pattern / outside its reach / digit not involved / cell could still be X) 🔬 novice + teaching · M
- [x] Row/column labels + box map on lesson and practice boards 🔬 novice · M
- [x] Colour legend for highlights (pattern, removed, pivot, pincers) 🔬 novice · S
- [x] Stars no longer punish hints: stars from mistakes; separate "Solved on your own 🏅" 🔬 novice · S
- [x] Practice progress counts unique positions, not repeats 🔬 novice · S
- [x] "Fill notes" keeps your own deductions instead of overwriting them 🔬 novice · S
- [x] Me → "Puzzles" counts all wins, not the capped history list 🔬 novice · S

- [x] `npm test` (tools/check.js): engine on every bank position, hint-text honesty, 6×6, habit logic

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
