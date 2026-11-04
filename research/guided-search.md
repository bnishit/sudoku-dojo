# Guided search: learn where to look

**Teach a search that can come up empty, then fade it based on skill.**
Nishit felt lost on his iPhone even with hints. Novices in Hidden Single lessons, Play and Scanning face this gap; affected-player count is unknown. Without a change, they may follow answers without learning to find moves. Only design and engine support are done; Claude review comes before UI work.

## A real example

`BANK.lessons.hiddenSingleBox[0]` needs no earlier note removals.
Its hint names both **4** and **box 2**. Its next explanation reveals **row 3, column 6**. Choosing the digit, area and blockers never becomes the learner's job.

This is the second watch beat in the lesson and level 2 in Play. Play level 1 names the technique and gives a broad nudge. Scanning level 1 can already name an exact area or digit. The gap is the missing checked search before the answer.

Actual top-middle box; `x` means ruled out for 4, `?` remains:

```text
             c4 c5 c6
r1            x  x  x  <--- 4 at r1c8
r2            x  8  1
r3            x  9  ?
              ^
              | 4 at r4c4
```

The first 4 blocks row 1; the second blocks column 4. Eight, one and nine fill three cells. Only r3c6 remains. A third 4 at r8c5 blocks r1c5 again; tapping it adds no proof.

## Three disagreements

1. **Most common is a useful bet, not a rule.** Prefer well-placed digits with a direct move available. Accept any unfinished digit and any area missing it, even when the search ends with several spots. Do not pre-light the winning box.
2. **Follow changed cells beyond the new digit's own areas.** In `gentle-1`, after two prior moves, placing 7 at r1c5 newly forces 7 at r8c6 in box 8. That box is outside the new 7's own row, column and box. Compare before and after before saying a move was unlocked.
3. **Do not require every matching digit to be tapped.** Stop once the empty cells are fully checked. Redundant blockers and valid dead ends are not mistakes. Fade by search skill, not raw placement count.

## The routine

A house means a row, column or box; use those familiar words on screen.

1. **Pick a digit:** “Try a number with lots already placed.” Show placed counts; accept any unfinished digit.
2. **Pick an area missing it:** tap an empty cell inside a box, or a row/column label in the line lesson. Name the chosen area. Taps in search mode never place digits.
3. **Tap blockers:** “Tap a placed 4 that rules out cells here.” Draw only that tap's checked beams and grey its blocked empty cells. For line searches, a shared box also blocks cells: shade that intersection and explain it. Show occupied cells separately.
4. **Count:** ask “One spot or more than one?” Check the count. One: tap the cell, then Place 4. More: “Not this box yet. That is normal. Try another box.” Mark checked boxes for this digit until the grid changes.

Do not show the final candidate set before the learner checks the blockers. The engine's full answer is not the learner's partial proof. If an unchecked blocker still changes the result, ask “Any other 4s to check?” Offer free “Show the rest.” Allow changing digit or area at any point.

## Screen flows

| Entry | Ordered flow | Why / limit |
|---|---|---|
| Hidden Single: Box lesson | Short intro → one worked search → pick digit → pick box → tap blockers → count → place or search again → fresh position with less help | Include a valid two-spot dead end. Accept any proved placement, not just the stored answer. |
| Hidden Single: Line lesson | Same routine → choose Row or Column → tap its label → check crossing lines **and boxes** → count → place or move on | Show one worked example per orientation. A box restriction is a shaded area, not a straight beam. |
| Play → Hint | L1: “Try scanning the 4s; several are placed.” → L2: “Search with me” → L3: proof, answer and optional Apply | L1 gives no target area. Let players exit or skip guidance. All hints stay free and cost no stars. |
| Practice → Scanning → placement | Explain the new digit's effect → hold that digit → pick a touched box → tap blockers → count → place or move on | Only call a spot newly forced when the before/after check proves it. Keep other valid moves accepted. |

Scanning copy, when true: “Your new 7 rules out cells in its row, column and box. Check a box it reached.” The new 7 is one blocker, not necessarily the whole proof. L1 names the new digit and its effect, not the winning box. L2 can steer the search.

If none became forced: “That did not force another 7. Check another box or pick a new number.” If no empty cells were newly ruled out, do not claim they were. If another digit became forced, the wider scanning plan can suggest a fresh search; do not call it another 7.

## Fading: numbers to test

Track box and line searches separately. These thresholds are product guesses.

| Stage | Help | Advance after |
|---|---|---|
| Full guidance | All four prompts; learner taps blockers | 3 clean searches on distinct positions |
| Beams supplied | Learner picks digit/area; beams draw; learner counts/places | 3 clean searches on new positions |
| Start only | “Pick a digit to hunt.” No area cue or beams | 4 clean searches on new positions, including one in a full puzzle |
| Solo | No prompt; Hint and “Guide me” stay | Next-day check on a fresh puzzle; ten searches alone do not prove mastery |

Clean = proved placement, correct count, no corrected logic taps or answer reveal. The demo does not count. Correct dead ends are good work but cannot alone advance the counter. Stage-expected help counts for that stage; a supplied digit at “Start only” does not count as independent choice. Record stage separately from solo success.

After two attempts needing correction or extra help, offer the prior stage; do not force it. One hint pauses that attempt's advancement, not earlier progress or stars. Full guidance stays available. Future saved fields need defaults and migration; none are added now.

## Edges

- **No box ready:** accept dead ends. After two checked boxes with several spots, suggest changing digit. If no direct single exists, say this routine has run out and offer the next technique.
- **Wrong area:** if it already holds the digit, point to it. Missing the digit but having several spots is valid, not a red failure.
- **Wrong blocker:** explain “We are hunting 4” for another digit, or “This 4 shares no row, column or box with an empty cell here.” Repeated/redundant taps get “Already checked,” without penalty.
- **Wrong count/place:** show the overlooked cell or blocking rule, then retry. Reveal the final cell only after proof or L3.
- **Notes on:** notes are small digits showing what could still fit. Dim them in a labelled “Search view,” keep saved notes intact, restore on exit. Missing handwritten notes are not proof. A single needing earlier note removals needs a separate notes explanation; never invent a beam.
- **Bad state:** existing Play checks for wrong entries/notes run first. Helpers assume a valid grid; they do not prove solvability. Zero spots for a missing digit means conflict, not a dead end.
- **Edit/undo:** clear search marks and re-read facts. Follow-up comparison assumes exactly the last placement changed.
- **Mini:** engine supports 6×6; teaching UI starts with 9×9. Before release, check phone taps, labels, light/dark and non-colour cues.

## Leave out

No UI in this run. No new techniques, timer, scoring change, telemetry service or belt rule. No new hint ladder for pairs/chains. Keep the old scanning plan until the guided UI is reviewed and built.

## Know it works

After UI exists, observe 6 novices on phones. Before teaching: two unaided moves on fresh easy positions. After: two matched new positions and a full easy puzzle, without digit, area or technique cues. Next day: new positions again. Help stays available.

Record valid search choices/dead ends, blocker/count errors, hint depth and proved unaided finds within 90 seconds (measurement only, no visible timer). Ask them to explain one blocker. Initial target: at least 4 of 6 find and explain two moves unaided after teaching, and 4 of 6 next day; fewer answer reveals than baseline. This is a usability signal, not statistical proof. If guided success fails to transfer, revise search-choice teaching before fading further.

**Next step:** Claude reviews choice rules and fading thresholds before UI work.
