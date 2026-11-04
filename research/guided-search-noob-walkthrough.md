# Hidden Single: Box — a beginner's skill ladder

A new player starts by tapping one placed digit. Digit choices and dead ends wait until the player has practised the smaller steps. This is local work, not a release. Claude completed R1 and R2 as a first-time player in the iPhone simulator without bugs. These six beginner-copy and cue changes are local; a fresh native review is still needed. No measured player count is available.

Each rung needs two clean reps on distinct real bank positions. A correction or Show me stops that rep from counting; it never takes away prior progress or stars. Skip offers a fresh lesson position, or returns from a Play or Scanning search. Reload resumes the saved rung. The lesson ends after two solo reps. Play and Scanning read the same saved rung.

In the examples below, 4 is the chosen digit. The actual digit and row come from the engine for that puzzle. A primary button is the single large filled button. Grid taps, digit choices, and the small Help link are separate controls.

## First visit and shared screen layout

The box lesson opens once with “Every box needs each number 1 to 9 once.” / “We'll find where a missing number goes, one small step at a time.” / **Start**. Start saves `introSeen`; later visits go straight to the saved rung. Old saves default to unseen without losing rung progress.

Every search has a big goal first: “Where can the 4 go in this box?” (or “a box” before choosing one; “Which number can we place?” before choosing a number). A smaller action sits below. The goal stays through action changes and wrong taps. Correct taps put tick-marked praise in the big line instead. Completion leaves only praise and Continue, with no extra instruction. Faint 1–9 labels mark rows and columns. Solo keeps the goal but hides coaching actions.

## R1 — one digit blocks a row or column

| Screen | Instruction at top | What glows | Primary buttons | Right tap / wrong tap |
|---|---|---|---|---|
| First rep | “Where can the 4 go in this box?” / “Tap the 4 in row 1 to see what it blocks.” | One placed 4 that blocks empty cells in the chosen box. Other placed digits are dim; empty cells in the chosen box stay readable. | 0; Help only | Its checked beam draws; cells get crosses. “Yes. That 4 blocks row 1 in this box.” A different cell: “Tap the glowing digit first.” No flash or counter. |
| After the tap | “✓ Yes. That 4 blocks row 1 in this box.” | None; the beam and crosses stay. | 1: Continue; Help stays | Continue opens a fresh bank position. No digit is placed on this rung. |
| Second rep | Same task, fresh position | One blocker | 0, then 1: Continue | Two clean reps unlock R2. |

Only the first R1 rep shows: “A beam shows a row or column. Stripes mean this digit cannot go there.” The saved first-view flag prevents it appearing again after reload.

## R2 — check the blockers, then fill the spot

| Screen | Instruction | What glows | Primary buttons | Right tap / wrong tap |
|---|---|---|---|---|
| Check | “Tap a glowing 4.” | Placed 4s that still rule out unchecked cells in the chosen box | 0; Help | Each correct tap draws only that blocker's beam and crosses. Praise names its row or column. A 4 that cannot block this box gets one calm reason. |
| Check more | “Tap a glowing 4.” | Only blockers still adding proof | 0; Help | Repeat until every blocked empty cell is explained. Repeated blockers say “Already checked. Try another.” Redundant blockers are not required. |
| Fill | “Tap the one spot for 4.” | No answer outline; all empty cells stay readable, ruled-out cells have stripes | 0; Help | Correct: “✓ Found it! The 4 goes here.” Wrong: names the row or column stripe that rules out the tapped cell. Before proof is complete: “Check the glowing 4s first.” |
| Place | “✓ Found it! The 4 goes here.” | None | 1: Continue; Help | Continue applies the proved digit, then opens a fresh rep. Two clean reps unlock R3. |

## R3 — find a box missing the digit

| Screen | Instruction | What glows | Primary buttons | Right tap / wrong tap |
|---|---|---|---|---|
| Pick box | “Tap a box missing 4.” | Empty cells only in boxes missing 4 pulse; boxes already holding 4 are dim | 0; Help | Any empty cell chooses its whole box. “Yes. This box is missing 4.” A box already holding it gets that exact reason. An empty cell is never read as a placed wrong digit. |
| Check / fill / place | R2 instructions, one at a time | R2 blockers, then stripes without an answer outline | 0, then 1: Continue | Same engine checks and calm feedback as R2. Two clean reps unlock R4. |

A player can choose a box that is missing the digit but is not ready. The app accepts that search and offers another box. The deliberately supplied two-spot example is reserved for R5; there is no dead-end exercise at the start of the lesson.

## R4 — choose a useful digit

| Screen | Instruction | What glows | Primary buttons | Right tap / wrong tap |
|---|---|---|---|---|
| Pick digit | “Try 4: it has the most placed.” | Grid dim; unfinished digit chips show their placed counts | 0; Help | A chip chooses that digit. “Yes. Look for 4.” It is a suggestion, not a required answer. Tied counts are allowed. |
| Pick box / check / fill / place | R3, then R2 | Only the next grid choices | 0, then 1: Continue | Same checks. Two checked dead ends offer another digit. Two clean placements unlock R5. |

The nine digit chips appear only at R4 and only before a digit is chosen. Later independent searches choose a digit by tapping a placed copy on the board.

## R5 — a normal dead end

| Screen | Instruction | What glows | Primary buttons | Right tap / wrong tap |
|---|---|---|---|---|
| Check supplied box | “Tap a glowing 4.” | Blockers in an engine-proved two-spot search | 0; Help | Each blocker gets the same short praise and beams as R2. |
| Two spots | “Try another box.” | None; checked beams and crosses remain | 1: Try another box; Help | Feedback: “Two spots. Not ready yet. That is normal. Try another box.” No mistake is recorded. |
| Pick again / check / fill / place | R3, then R2 | Missing boxes, then blockers, then stripes without an answer outline | 0, then 1: Continue | A clean rep must include the two-spot search and a proved placement. Two clean reps unlock R6. |

## R6 — solo

| Screen | Instruction | What glows | Primary buttons | Right tap / wrong tap |
|---|---|---|---|---|
| Pick digit | “Which number can we place?”; no action | Placed copies of unfinished digits | 0; small Help | Tap a placed digit to choose it. “Yes. Look for 4.” |
| Pick box | Goal only; no action | Empty cells in boxes missing the chosen digit | 0; Help | Tap an empty cell. “Yes. This box is missing 4.” |
| Find spot | Goal only; no action | No answer outline; all empty cells in the chosen box stay readable | 0; Help | Tap the forced spot. The engine checks it directly. A blocked cell gets the same calm reason; no beam is supplied. |
| Place | “✓ Found it! The 4 goes here.” | None | 1: Continue; Help | “✓ Found it! The 4 goes here.” Two clean solo reps finish the lesson. |

## Help, on every rung

Help opens one sheet; the underlying controls hide. It contains one primary button, **Show me**, and two small choices, **Skip** and **Exit**. Help again closes the sheet. Show me supplies an engine-proved search without advancing that rep. Guided placements are labelled as helped; stars do not change. R1 demonstrates blockers without placing a digit. Skip changes lesson positions; in Play or Scanning it returns to the puzzle. Exit returns without editing the puzzle or notes. No visible mistake counter or red feedback is used in this search view.

## Scanning rule screens

The lesson no longer shows all rules, analogy and a list at once. Each rule gets one screen, a one-line analogy and **Start**, once per lesson run, when used:

- Nearly full area: “Look for a row, column or box with one or two gaps.” / “Like keys: check one place at a time.”
- Follow-up, after a placement: “After placing a number, check which cells it rules out in other boxes.” / “Like keys: check one place at a time.”
- One number, before the guided box search (or when the plan first calls for it): “Pick one number. Check each box missing it.” / “Like keys: check one place at a time.”

The board hides during each rule screen. Start returns to the real puzzle or opens the saved-rung search. The standalone Practice drill keeps its existing flow. A nearly full rule appears only if that puzzle has such a move.

## Scanning, Play, saves, and limits

- Play → Search with me and Scanning's follow-up open the same component at the saved rung. R1 uses fresh bank positions for its blocker-only reps. R5 also uses bank positions if the current puzzle cannot supply a two-spot search with a same-digit retry. These teaching reps return to the original puzzle and never write a bank answer into it.
- At R3 a Scanning follow-up can retain the last placed digit only when the engine can prove a box single for it. At digit-choice rungs it cannot take away the player's choice.
- After the six teaching rungs, the old fade continues on this same scale: R7 supplies beams (3 clean reps); R8 supplies the starting prompt (4 clean reps, including a full puzzle); R9 is solo with a next-day check on a fresh puzzle. No second stage field remains.
- Old stages 0 / 1 / 2 / 3 map to rungs 1 / 7 / 8 / 9. Old stage counters reset; other saved game and lesson data remain intact.
- Empty cells are tested using the actual rendered board indices. Proof uses placed digits, never missing handwritten notes. Conflicts and positions with no direct box single need another technique; Help allows exit.
- The native iPhone shell and a beginner's ability to transfer this skill still need a human usability check. Browser checks do not establish either result.

## Local validation of the six beginner gaps (2026-11-04)

`npm test`: 23 checks pass, including once-only intro, migration default, scanning rule timing, R2 no-answer-outline and stripe feedback. `npm run bank`: 560 items verified. Real browser checks at 390×844 in light and dark cover R1, R2 and each scanning rule; reload skips the box intro, R2 has zero answer outlines and 18 coordinate labels, page width is 390. Screenshots and the final annotated code diff are in [`../output/beginner-search-walkthrough.html`](../output/beginner-search-walkthrough.html). No commit or deployment.
