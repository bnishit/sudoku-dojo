// Practice-habit logic. Pure functions on plain data, so tools/check.js can test them in Node.
// Days are local calendar dates as 'YYYY-MM-DD' strings.

const pad = n => String(n).padStart(2, '0');
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (k, n) => { const d = fromKey(k); d.setDate(d.getDate() + n); return dayKey(d); };
const diffDays = (a, b) => Math.round((fromKey(a) - fromKey(b)) / 864e5);

// Record a practice day. Keeps the list sorted, unique and bounded.
export function addDay(days, k) {
  if (days.includes(k)) return days;
  return [...days, k].sort().slice(-400);
}

// Forgiving streak: consecutive practice days, allowing one rest day in any 7-day stretch.
// Today not being done yet never breaks the streak.
export function streak(days, today) {
  if (!days.length) return 0;
  const set = new Set(days), first = days[0];
  let d = set.has(today) ? today : addDays(today, -1);
  let count = 0, lastMiss = null;
  while (d >= first) {
    if (set.has(d)) count++;
    else {
      if (lastMiss && diffDays(lastMiss, d) < 7) break;
      lastMiss = d;
    }
    d = addDays(d, -1);
  }
  return count;
}

// Mon–Sun of the current week.
export function week(days, today) {
  const set = new Set(days), dow = (fromKey(today).getDay() + 6) % 7;
  const monday = addDays(today, -dow);
  return ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, i) => {
    const k = addDays(monday, i);
    return { key: k, label, done: set.has(k), today: k === today, future: k > today };
  });
}

export const daysAway = (days, today) => (days.length ? diffDays(today, days[days.length - 1]) : Infinity);

// Spaced review: solo success moves a technique up a box (longer wait); a hint or slip resets it.
export const INTERVALS = [1, 3, 7, 14, 30];
export function review(entry, solo, today) {
  const box = solo ? Math.min((entry?.box ?? -1) + 1, INTERVALS.length - 1) : 0;
  return { box, due: addDays(today, INTERVALS[box]) };
}

// Pick n techniques for today's practice: due reviews first, then a shuffled mix of the rest.
export function pickDaily(learned, reviews, today, n = 5, rng = Math.random) {
  if (!learned.length) return [];
  const due = learned.filter(t => (reviews[t]?.due ?? today) <= today).sort((a, b) => (reviews[a]?.due ?? today).localeCompare(reviews[b]?.due ?? today));
  const out = due.slice(0, n);
  while (out.length < n) {
    let t = learned[(rng() * learned.length) | 0];
    if (learned.length > 1 && t === out[out.length - 1]) t = learned[(learned.indexOf(t) + 1) % learned.length];
    out.push(t);
  }
  // interleave: avoid the same technique twice in a row where possible
  for (let i = 1; i < out.length; i++) {
    if (out[i] === out[i - 1]) {
      const j = out.findIndex((x, k) => k > i && x !== out[i]);
      if (j > 0) [out[i], out[j]] = [out[j], out[i]];
    }
  }
  return out;
}

// A daily calendar reminder the player can import. No server needed.
export function reminderIcs(hhmm, url, today) {
  const [h, m] = hhmm.split(':');
  const date = today.replace(/-/g, '');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Sudoku Dojo//EN', 'BEGIN:VEVENT',
    `UID:sudoku-dojo-daily-${date}@sudoku-dojo`, `DTSTAMP:${stamp}`,
    `DTSTART:${date}T${h}${m}00`, 'DURATION:PT5M', 'RRULE:FREQ=DAILY',
    'SUMMARY:🥋 Sudoku Dojo: one move today', `DESCRIPTION:Your 1-minute practice: ${url}`, `URL:${url}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Sudoku Dojo', 'TRIGGER:PT0M', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}
