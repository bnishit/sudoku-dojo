// Lesson content. Each technique id matches engine.js.
export const BELTS = [
  { id: 'white', name: 'White Belt', color: 'var(--belt-white)', blurb: 'See what is already there.', lessons: ['fullHouse', 'hiddenSingleBox', 'hiddenSingleLine', 'nakedSingle'] },
  { id: 'yellow', name: 'Yellow Belt', color: 'var(--belt-yellow)', blurb: 'Notes start talking to each other.', lessons: ['notes', 'pointing', 'claiming'] },
  { id: 'green', name: 'Green Belt', color: 'var(--belt-green)', blurb: 'Groups that lock digits away.', lessons: ['nakedPair', 'hiddenPair', 'nakedTriple'] },
  { id: 'brown', name: 'Brown Belt', color: 'var(--belt-brown)', blurb: 'Patterns that span the whole board.', lessons: ['xWing', 'yWing'] },
  { id: 'black', name: 'Black Belt', color: 'var(--belt-black)', blurb: 'The big fish.', lessons: ['swordfish'] },
];

export const LESSONS = {
  fullHouse: {
    title: 'Full House', icon: '🏠', tagline: 'The last empty seat',
    idea: ['When a row, column or box has eight digits, the ninth cell is whatever digit is missing.', 'It sounds too simple, but it is the move you will make most at the end of every puzzle. Spotting it fast keeps you flowing.'],
    analogy: 'Like roll call: eight kids answered "here", so you know exactly who is absent.',
    lookFor: ['A row, column or box with one gap', 'Count 1 to 9 and find the missing digit'],
    nudge: 'Find a row, column or box with only one empty cell.',
  },
  hiddenSingleBox: {
    title: 'Hidden Single: Box', icon: '🔦', tagline: 'Cross-hatching',
    idea: ['Pick a digit, say 7, and a box that has no 7 yet. Every 7 already on the board shoots a beam along its row and its column.', 'If the beams cross out every empty cell in that box but one, the 7 must go there. This is how fast solvers scan: digit by digit, box by box.'],
    analogy: 'Like a laser grid in a heist film: only one tile is safe to step on.',
    lookFor: ['Pick a digit that appears a lot already', 'Find a box that is missing it', 'Follow the beams from that digit\'s copies'],
    nudge: 'Pick a digit. Is there a box where it has only one possible cell?',
  },
  hiddenSingleLine: {
    title: 'Hidden Single: Line', icon: '📏', tagline: 'One spot in a row or column',
    idea: ['Same idea, aimed at a row or column. A row needs every digit once. For a missing digit, check each empty cell in the row: is that digit already in the cell\'s column or its box? (For a column, check each cell\'s row and box.)', 'If only one cell survives, that is the digit\'s home.'],
    analogy: 'Nine people, nine chairs. If every chair but one is "taken" for Sam, Sam\'s seat is decided.',
    lookFor: ['Rows or columns with few empty cells', 'For a missing digit, test each empty cell', 'Check the crossing lines and the box for that digit'],
    nudge: 'Pick a row or column. Is there a missing digit with just one place to go?',
  },
  nakedSingle: {
    title: 'Naked Single', icon: '🎯', tagline: 'Only one digit fits',
    idea: ['Flip it around: focus on one cell instead of one digit. List what its row, column and box already contain.', 'If you see eight different digits, the one left is the answer. The digits that could still fit a cell are called **notes**. You will learn to write them in the next lesson. They are the key to every harder technique.'],
    analogy: 'Like a key ring with nine keys: once eight of them don\'t fit the lock, the last one must.',
    lookFor: ['Cells where a row, column and box overlap and are busy', 'Count the different digits the cell can "see"', 'Eight seen means one left'],
    nudge: 'Look for a crowded cell. Which digits can it see?',
  },
  notes: {
    title: 'Notes', icon: '✏️', tagline: 'Write down what could still fit', kind: 'notes',
    idea: ['When no cell is forced yet, write the digits that could still go in each empty cell, in small numbers. These are called **notes** (some people say candidates or pencil marks).', 'To find a cell\'s notes, start from 1 to 9 and drop every digit its row, column or box already has. Every harder technique works by **removing** notes. Removing a note never fills a cell. It only means "not this one".'],
    analogy: 'Like a guest list for one seat: you write everyone who could still sit there, and cross names off as you learn more.',
    lookFor: ['Pick an empty cell', 'Check its row, its column and its box', 'Write every digit that none of them has'],
    nudge: 'Tap digits to add or remove notes for the highlighted cell, then tap Check.',
  },
  pointing: {
    title: 'Pointing Pair', icon: '👉', tagline: 'A box points down a line',
    idea: ['Inside a box, suppose the notes for 4 all sit in the same row. You don\'t know which cell gets the 4 yet, but you know it is on that row.', 'So that row\'s 4 is "spent" inside this box. Every other 4 note on the same row, outside the box, can be crossed out.'],
    analogy: 'If your keys are definitely in the top drawer of the kitchen, you can stop searching the top drawer in the bedroom.',
    lookFor: ['A digit whose notes in a box line up in one row or column', 'Notes for that digit further along the same line'],
    nudge: 'In some box, the notes for one digit all line up. Find it.',
  },
  claiming: {
    title: 'Box-Line Reduction', icon: '📦', tagline: 'A line claims a box',
    idea: ['The pointing pair, reversed. In a row, suppose every 6 note sits inside the same box.', 'The row must get its 6 from that box. So the box\'s 6 is used up by that row, and every other 6 note in the box can go.'],
    analogy: 'If the only open seats on the bus\'s back row are by the window, the window seats will be taken, not the aisle ones.',
    lookFor: ['A digit whose notes in a row or column all fall in one box', 'Other notes of that digit in the same box'],
    nudge: 'In some row or column, the notes for one digit all fall inside one box.',
  },
  nakedPair: {
    title: 'Naked Pair', icon: '👯', tagline: 'Two cells, two digits',
    idea: ['Two cells in the same row, column or box both have exactly the same two notes, say 3 and 8.', 'One will be 3 and the other 8. We don\'t know which yet, but together they use up both digits. So no other cell in that unit can be 3 or 8.'],
    analogy: 'Two friends have reserved two seats. You don\'t know who sits where, but both seats are taken.',
    lookFor: ['Cells with only two notes', 'Two of them in one unit with the same pair', 'The same digits elsewhere in that unit'],
    nudge: 'Find two cells in one unit with the same two notes.',
  },
  hiddenPair: {
    title: 'Hidden Pair', icon: '🕵️', tagline: 'Two digits hiding in two cells',
    idea: ['In a unit, two digits, say 2 and 7, can only go in the same two cells. Those cells may hold other notes too, which hides the pair.', 'Since those two cells must be 2 and 7, every other note in them can be cleared. Then they become a naked pair.'],
    analogy: 'Only two people in the office have the key to two locked rooms. Whatever else they do, those two jobs are theirs.',
    lookFor: ['Pick a unit and a digit with only two spots', 'Find a second digit with exactly the same two spots', 'Clear the other notes from those cells'],
    nudge: 'In some unit, two digits can only go in the same two cells.',
  },
  nakedTriple: {
    title: 'Naked Triple', icon: '🎳', tagline: 'Three cells, three digits',
    idea: ['Three cells in one unit whose notes, all together, use only three digits. Like {1,4}, {4,9} and {1,9}. No cell needs to have all three.', 'Those three cells will take 1, 4 and 9 between them, so cross those digits out of the rest of the unit.'],
    analogy: 'Three kids share three toys. However they swap, those three toys stay with those three kids.',
    lookFor: ['Cells with two or three notes', 'Three in one unit that only use three digits in total'],
    nudge: 'Find three cells in one unit that use only three digits between them.',
  },
  xWing: {
    title: 'X-Wing', icon: '✖️', tagline: 'A rectangle of one digit',
    idea: ['Pick one digit, say 5. Find two rows where 5 can only go in two cells each, and those cells share the same two columns. They form a rectangle.', 'Either the 5s sit on one diagonal or the other. Both ways, each of those two columns gets its 5 from these corners. So 5 can be crossed out from everywhere else in those two columns.'],
    analogy: 'Two lamps, two switches wired so each lights exactly one lamp. However you flip them, both lamps get light, so no other switch is needed.',
    lookFor: ['Tap a digit to light up its notes', 'Two rows (or columns) with exactly two spots each', 'Spots that line up into a rectangle'],
    nudge: 'Pick one digit and look for a rectangle of its notes across two rows or two columns.',
  },
  yWing: {
    title: 'Y-Wing', icon: '🪁', tagline: 'Pivot and two pincers',
    idea: ['A pivot cell has two notes, say {3,7}. It sees two other two-note cells, the pincers: {3,5} and {7,5}.', 'If the pivot is 3, the first pincer is 5. If it is 7, the second pincer is 5. Either way one pincer is 5, so any cell that sees both pincers can\'t be 5.'],
    lookFor: ['Cells with exactly two notes', 'A pivot that shares one digit with each of two pincers', 'The pincers share the third digit'],
    nudge: 'Find a two-note cell that "sees" two other two-note cells forming an A-B, A-C, B-C chain.',
  },
  swordfish: {
    title: 'Swordfish', icon: '🗡️', tagline: 'An X-Wing with three rows',
    idea: ['The X-Wing, scaled up. Take one digit. Find three rows where it fits in only two or three cells each, and all those cells fall within the same three columns.', 'Each of the three rows needs that digit, and they must take it from three different columns. So those three columns are covered, and the digit leaves every other cell in them.'],
    analogy: 'Three guards covering three doors. Every door is watched, so nobody else needs to stand at them.',
    lookFor: ['Tap a digit to light up its notes', 'Rows (or columns) with only 2–3 spots', 'Three of them that use the same three columns'],
    nudge: 'Pick one digit. Find three rows (or columns) whose notes all fall in the same three columns (or rows).',
  },
};

export const TIERS = [
  { id: 'gentle', name: 'Gentle', belt: 'white', xp: 10, desc: 'Lots of clues. Only White Belt moves.' },
  { id: 'easy', name: 'Easy', belt: 'white', xp: 20, desc: 'Fewer clues. Still only White Belt moves.' },
  { id: 'medium', name: 'Medium', belt: 'green', xp: 35, desc: 'Needs Yellow and Green Belt moves.' },
  { id: 'hard', name: 'Hard', belt: 'brown', xp: 60, desc: 'Triples, X-Wings and Y-Wings.' },
  { id: 'expert', name: 'Expert', belt: 'black', xp: 100, desc: 'Swordfish or several big patterns.' },
];
