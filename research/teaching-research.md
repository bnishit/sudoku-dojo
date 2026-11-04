**Prioritize teaching players to find their next move unaided, before adding more advanced techniques.**

The main trap is passing a named-technique drill, then feeling lost in a full puzzle. This affects the beginner/intermediate audience; Dojo’s affected-player count is unknown. This report uses your feature description, not a live UI audit. Learning-science findings below support design choices; their effect on Dojo still needs testing.

## Top 10 recommendations for Sudoku Dojo

1. **Build “Find the next move” mixed practice.** After a short run of one technique, mix it with earlier lessons and hide technique names. Accept any valid deduction. Players must learn *which tool to choose*, as well as how to use it. Rohrer’s mathematics experiment supports this distinction. **Effort: M.** [Source](https://gwern.net/doc/psychology/spaced-repetition/2014-rohrer-2.pdf)

2. **Teach a repeatable scanning routine.** Players should stop staring randomly: check nearly finished areas → scan one digit across boxes → inspect affected cells after each placement → search for eliminations. Start untimed; measure accurate finds before speed. Conceptis teaches scanning before deeper candidate analysis. **Effort: M.** [Source](https://www.conceptispuzzles.com/index.aspx?uri=puzzle/sudoku/techniques)

3. **Fade help within each lesson.** Show one complete example; let the learner finish the next; then remove region highlights and technique labels. This bridges watching and doing. Worked examples help novices, while fading transfers responsibility gradually. **Effort: M.** [Sweller–Cooper](https://www.tandfonline.com/doi/abs/10.1207/s1532690xci0201_3), [Renkl–Atkinson](https://www.tandfonline.com/doi/abs/10.1207/S15326985EP3801_3)

4. **Add a small spaced-review queue.** Players revisit weak techniques on new boards, rather than finish 30 examples once. Start with next-day, three-day and one-week reviews; adjust after independent success. Those intervals are a product hypothesis, not a proven Sudoku schedule. **Effort: M.** [Spacing evidence](https://pubmed.ncbi.nlm.nih.gov/16719566/)

5. **Teach sparse notes and full candidates explicitly.** Players need to know what their marks mean. Teach Snyder notation—recording a digit’s two possible positions within a box—then transition to complete cell candidates when scanning stalls. Offer automatic candidates after a short manual lesson. **Effort: M.** [Sudoku Coach](https://sudoku.coach/en/learn/box-candidate-notation), [CTC on notation limits](https://www.youtube.com/watch?v=92YAm1dfsqE)

6. **Fill the bridge between subsets and advanced patterns.** Add Hidden Triple, strong-link basics, Skyscraper and Two-String Kite before expanding the exotic catalogue. A strong link means a digit has exactly two possible places in an area: if one is false, the other is true. HoDoKu describes Skyscrapers as frequent and readily spotted. **Effort: L.** [Source](https://hodoku.sourceforge.net/en/tech_sdp.php)

7. **Explain failed reasoning immediately after submission.** A learner should see *why* a claimed pair fails or an elimination is unsafe, then retry. Highlight the overlooked candidate; avoid a bare red cross or revealing the answer automatically. Specific, task-focused feedback is the useful ingredient; immediate feedback is not universally best for every task. **Effort: M.** [Shute](https://myweb.fsu.edu/vshute/pdf/shute%202008_b.pdf)

8. **Rate the whole solving experience.** Players can stall on a “simple” puzzle with one obscure available move. Combine hardest technique, total work and bottlenecks, then calibrate against learner results. HoDoKu uses technique level plus accumulated scores; Sudoku research also identifies dependencies between steps. **Effort: L.** [HoDoKu](https://hodoku.sourceforge.net/en/docs_cre.php), [Pelánek](https://arxiv.org/pdf/1403.7373)

9. **Award mastery for delayed, independent use.** Players should earn belts through fresh mixed positions and full puzzles, including a later check—not lesson completion alone. Track finding the pattern, making the deduction and using hints separately. Target weak components with focused practice. **Effort: M.** [Retrieval practice](https://www.psychologicalscience.org/journals/psychological-science/j.1467-9280.2006.01693.x/), [Ericsson](https://blogs.ischool.berkeley.edu/i225s14/files/2014/04/Ericsson-1993-article.pdf)

10. **Keep Technique Rush optional and downstream.** Players learning a new idea need time to reason. Use Rush for already accurate skills, offer untimed practice, and score accuracy alongside speed. “Desirable difficulty” means useful mental effort; unfamiliar logic plus a countdown may simply overwhelm. **Effort: S.** [Bjork–Bjork](https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/11/Making-Things-Hard-on-Yourself-but-in-a-Good-Way-20111.pdf)

## Recommended technique curriculum

**Your order is broadly sound through Green. The larger gap is scanning, notation and the transition into advanced reasoning.**

Teachers do not share one definitive order:

- **Stuart’s book** groups naked subsets, hidden subsets, intersections, then fish and chains; his current solver uses a different order.
- **Learn-Sudoku** begins with visual elimination and singles, then subsets/intersections.
- **Sudoku Coach** combines notation, lessons, focused exercises and full puzzles.
- **HoDoKu’s ordering is configurable**, intended for solving and rating.
- **Good Sudoku** emphasizes technique requirements, individual practice and reducing busywork. [Stuart](https://www.sudokuwiki.org/The_Logic_of_Sudoku), [Learn-Sudoku](https://www.learn-sudoku.com/basic-techniques.html), [Coach](https://sudoku.coach/en/campaign), [HoDoKu](https://hodoku.sourceforge.net/en/docs_solv.php), [Good Sudoku](https://www.playgoodsudoku.com/)

| Order | Technique | Belt | Keep/add/drop | Why |
|---|---|---|---|---|
| 0 | Scanning and cross-hatching | White | Add | Teach where to look |
| 1 | Full House | White | Keep | Immediate, clear deduction |
| 2 | Hidden Single: box | White | Keep | Natural digit-first search |
| 3 | Hidden Single: row/column | White | Keep | Extend the same reasoning |
| 4 | Naked Single | White | Keep | Introduce cell-first search |
| 5 | Sparse/full candidate notation | White–Yellow | Add | Make note meaning explicit |
| 6 | Pointing Pair **and Triple** | Yellow | Extend | Same rule, either count |
| 7 | Box-Line Reduction | Yellow | Keep | Teach reverse direction |
| 8 | Naked Pair | Green | Keep | Simplest cell subset |
| 9 | Hidden Pair | Green | Keep | Practise digit restrictions |
| 10 | Naked Triple | Green | Keep | Include unequal candidate sets |
| 11 | Hidden Triple | Green | Add | Complete core subset reasoning |
| 12 | X-Wing | Brown | Keep | Clear single-digit pattern |
| 13 | Strong/weak links | Brown | Add | Explain subsequent patterns |
| 14 | Skyscraper | Brown | Add | Small, reusable inference |
| 15 | Two-String Kite | Brown | Add | Extend across row/column |
| 16 | Y-Wing / XY-Wing | Brown | Keep | Teach both common names |
| 17 | XYZ-Wing | Black | Add | Useful Y-Wing extension |
| 18 | W-Wing | Black | Add | Apply links across cells |
| 19 | Simple Coloring | Black | Add | Bridge into chains |
| 20 | Swordfish | Black | Keep | Extend X-Wing; avoid making it the sole graduation test |
| Optional | Naked/Hidden Quads | Green+ | Add later | Teach as subset extensions |
| Optional | Unique Rectangle Type 1; BUG+1 | Black | Add later | Useful shortcuts with explicit uniqueness assumption |
| Later | Empty Rectangle; longer chains | Black+ | Defer | Beyond the immediate audience |

This placement is my teaching recommendation, informed by [Coach’s catalogue](https://sudoku.coach/en/learn/technique-overview) and HoDoKu. Unique Rectangle and BUG+1 require a puzzle known to have one solution. [Uniqueness explanation](https://hodoku.sourceforge.net/en/tech_ur.php)

**Lower priority:** standalone hidden-quad lessons, large/finned fish and exotic named patterns. They can matter on hard puzzles; their teaching cost is high for this audience. No consulted source establishes universal technique frequencies. Measure incremental coverage in Dojo’s puzzle bank before expanding.

**Scanning and notes:** Cross-hatching, also called slicing and dicing, uses existing copies of one digit to rule out positions. Teach digit-first scanning for hidden singles and intersections; cell-first scanning for naked singles and subsets. After placing a number, check its local effects before restarting the whole grid. [Conceptis](https://www.conceptispuzzles.com/index.aspx?uri=puzzle/sudoku/techniques), [Coach](https://sudoku.coach/beapi/get-page/en/learn/computer-solver)

Corner placement alone does not make notes “Snyder.” Keep box-position notes visually distinct from complete cell candidates. Sparse marks must never be treated as exhaustive possibilities. CTC teaches sparse notation and its limits; Coach explicitly teaches the transition to full candidates. [CTC](https://www.youtube.com/watch?v=TomEiPJyQiU), [Coach](https://sudoku.coach/en/learn/full-candidate-notation)

## Exercise formats to add

| Name | How it works in the app | Learning principle | Source |
|---|---|---|---|
| Finish the explanation | Complete the last deduction; gradually remove earlier steps | Faded worked examples | [Renkl–Atkinson](https://www.tandfonline.com/doi/abs/10.1207/S15326985EP3801_3) |
| Mystery move | Mix learned techniques without labels | Interleaving; strategy choice | [Rohrer](https://gwern.net/doc/psychology/spaced-repetition/2014-rohrer-2.pdf) |
| Daily return | Retrieve yesterday’s weak skill on a fresh board | Spacing and retrieval | [Bjork–Bjork](https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/11/Making-Things-Hard-on-Yourself-but-in-a-Good-Way-20111.pdf) |
| Pattern or impostor? | Compare valid patterns with near-misses; identify the broken condition | Discrimination | [Rohrer review](https://digitalcommons.usf.edu/psy_facpub/1755/) |
| Scan and follow through | Find one placement, then its next consequence | Focused component practice | [Ericsson](https://blogs.ischool.berkeley.edu/i225s14/files/2014/04/Ericsson-1993-article.pdf) |
| Full-puzzle mission | Solve using learned tools; revisit the actual sticking point | Application beyond isolated drills | [HoDoKu training](https://hodoku.sourceforge.net/en/docs_cre.php) |

**Mistakes to address in the UI:** These are teaching targets, not observed Dojo bugs.

| Misconception | UI response |
|---|---|
| “It fits, so it must be correct” | Ask what rules out alternatives |
| Two matching marks always form a pair | Reveal any additional cell candidate |
| A naked triple needs three identical lists | Show `{1,2}`, `{2,3}`, `{1,3}` |
| An elimination is not progress | Show the deduction it enables |
| My notes are always complete | Label note mode; offer repair and undo |
| Harder means fewer starting digits | Explain technique and workload separately |

For pacing, first assign puzzles solvable with learned techniques; introduce one unfamiliar demand at a time. Adjust using unaided success, hint depth and learner feedback—not time alone. There is no established universal “flow” percentage. A study of **31 players** found diverse strategies and notation-dependent difficulty, reinforcing the need for human calibration. [Study](https://dl.digra.org/index.php/dl/article/download/1376/1376/1373)

## What we're doing right

- Real positions and short walkthroughs provide a strong worked-example foundation.
- Focused practice plus full puzzles supplies both component training and application.
- Three-level hints let players control assistance; retain that control.
- The current curriculum covers core singles, intersections and subsets.
- 6×6 offers a smaller learning surface; check mastery again on 9×9.

**Next step:** test mixed, unlabeled practice against the current lesson path, measuring fresh-puzzle performance and retention one week later.

## Sources

URLs consulted and used above:

- [Stuart: book contents](https://www.sudokuwiki.org/The_Logic_of_Sudoku); [current solver order](https://www.sudokuwiki.org/sudoku.htm)
- [HoDoKu: solver](https://hodoku.sourceforge.net/en/docs_solv.php); [rating/training](https://hodoku.sourceforge.net/en/docs_cre.php); [patterns](https://hodoku.sourceforge.net/en/tech_sdp.php); [uniqueness](https://hodoku.sourceforge.net/en/tech_ur.php)
- [Coach: campaign](https://sudoku.coach/en/campaign); [techniques](https://sudoku.coach/en/learn/technique-overview); [box notes](https://sudoku.coach/en/learn/box-candidate-notation); [full notes](https://sudoku.coach/en/learn/full-candidate-notation); [scanning](https://sudoku.coach/beapi/get-page/en/learn/computer-solver)
- [Good Sudoku](https://www.playgoodsudoku.com/); [Learn-Sudoku](https://www.learn-sudoku.com/basic-techniques.html)
- [Conceptis techniques](https://www.conceptispuzzles.com/index.aspx?uri=puzzle/sudoku/techniques); [difficulty](https://www.conceptispuzzles.com/index.aspx?uri=info/article/2)
- [CTC: Snyder notation](https://www.youtube.com/watch?v=TomEiPJyQiU); [limits](https://www.youtube.com/watch?v=92YAm1dfsqE)
- [Lynch et al.: human players](https://dl.digra.org/index.php/dl/article/download/1376/1376/1373); [Pelánek: difficulty](https://arxiv.org/pdf/1403.7373)
- [Ericsson et al.](https://blogs.ischool.berkeley.edu/i225s14/files/2014/04/Ericsson-1993-article.pdf); [Bjork–Bjork](https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/11/Making-Things-Hard-on-Yourself-but-in-a-Good-Way-20111.pdf)
- [Rohrer experiment](https://gwern.net/doc/psychology/spaced-repetition/2014-rohrer-2.pdf); [review](https://digitalcommons.usf.edu/psy_facpub/1755/)
- [Sweller–Cooper](https://www.tandfonline.com/doi/abs/10.1207/s1532690xci0201_3); [Renkl–Atkinson](https://www.tandfonline.com/doi/abs/10.1207/S15326985EP3801_3)
- [Cepeda et al.](https://pubmed.ncbi.nlm.nih.gov/16719566/); [Roediger–Karpicke](https://www.psychologicalscience.org/journals/psychological-science/j.1467-9280.2006.01693.x/); [Shute](https://myweb.fsu.edu/vshute/pdf/shute%202008_b.pdf)