// Sound, haptics and confetti. All optional and fail silently.
let ctx = null;
export const fx = { sound: true };

function tone(freq, start, dur, type = 'sine', vol = 0.12) {
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    const t = ctx.currentTime + start, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t); o.stop(t + dur + 0.02);
  } catch { /* no audio */ }
}

const SOUNDS = {
  tap: () => tone(660, 0, 0.06, 'triangle', 0.05),
  place: () => tone(523, 0, 0.12, 'triangle', 0.09),
  good: () => { tone(659, 0, 0.12); tone(988, 0.08, 0.18); },
  bad: () => tone(150, 0, 0.18, 'sawtooth', 0.06),
  unit: () => [784, 988, 1175].forEach((f, k) => tone(f, k * 0.06, 0.2, 'sine', 0.08)),
  win: () => [523, 659, 784, 1047, 1319].forEach((f, k) => tone(f, k * 0.09, 0.35, 'triangle', 0.1)),
};

export function sfx(name) {
  if (fx.sound) SOUNDS[name]?.();
  if (name === 'bad') haptic(40);
  else if (name === 'good' || name === 'unit') haptic(12);
}
export function haptic(ms) { try { navigator.vibrate?.(ms); } catch { /* ignore */ } }

export function confetti(power = 1) {
  const cv = document.getElementById('confetti');
  if (!cv || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = cv.getContext('2d'), dpr = devicePixelRatio || 1;
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  c.scale(dpr, dpr);
  const colors = ['#E8613C', '#F2C230', '#3BA36B', '#5B7CFA', '#C86BD8', '#FF9EB5'];
  const parts = Array.from({ length: Math.round(140 * power) }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 120, y: innerHeight * 0.38,
    vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 15 - 4,
    s: 5 + Math.random() * 7, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
    col: colors[(Math.random() * colors.length) | 0], life: 0,
  }));
  let frame = 0;
  const step = () => {
    c.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += 0.38; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = p.col;
      c.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); c.restore();
    }
    if (++frame < 160) requestAnimationFrame(step);
    else c.clearRect(0, 0, innerWidth, innerHeight);
  };
  requestAnimationFrame(step);
}
