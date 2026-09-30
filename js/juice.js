// Juice: extra feel-good feedback used all over the game: confetti, banners, flying coins, haptics,
// answer streaks, and the card-pack reveal for card squares.

// Choir stab for anything in a row: each step `n` (1, 2, 3...) goes up a note of the major scale
const COMBO_SCALE = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19];
// The combo sound builds as the chain grows, so long chains feel huge:
//  - a bright chord that gains layers (octave from 3, sparkle tenth from 5, double octave from 7)
//  - louder each step, with an echo tail that gets longer
//  - a deep boom under it from 3 in a row, and a coin shimmer on top from 5
//  - a flash and a "COMBO xN" banner at the big milestones
// Layers are spread out across octaves (an octave = 12 semitones) for a huge, wide sound
const COMBO_CHORD = [ // [semitones from the note, volume, combo step it joins at]
  [0, 0.5, 1], [12, 0.45, 1], [-12, 0.35, 1], [19, 0.35, 2], [24, 0.3, 3], [-24, 0.3, 4], [31, 0.22, 5], [36, 0.2, 7],
];
// Synth drum hits (Web Audio, no files): a punchy kick that drops in pitch, and a noise crack like a snare/crash
function kick(loud = 1, low = 45) {
  if (!actx || actx.state !== 'running') return;
  const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(180, t);
  o.frequency.exponentialRampToValueAtTime(low, t + 0.18);
  g.gain.setValueAtTime(Math.min(1.2, 0.9 * loud), t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
  o.connect(g).connect(actx.destination);
  o.start(t); o.stop(t + 0.5);
}
let noiseBuf = null;
function crack(loud = 1, long = 0.25) {
  if (!actx || actx.state !== 'running') return;
  if (!noiseBuf) {
    noiseBuf = actx.createBuffer(1, actx.sampleRate, actx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = actx.currentTime, src = actx.createBufferSource(), hp = actx.createBiquadFilter(), g = actx.createGain();
  src.buffer = noiseBuf;
  hp.type = 'highpass'; hp.frequency.value = 1800;
  g.gain.setValueAtTime(Math.min(0.8, 0.45 * loud), t);
  g.gain.exponentialRampToValueAtTime(0.001, t + long);
  src.connect(hp).connect(g).connect(actx.destination);
  src.start(t); src.stop(t + long + 0.05);
}

// Clap: three quick noise bursts, like a stadium clap
function clap(loud = 1) {
  if (!actx || actx.state !== 'running') return;
  crack(0); // makes sure the noise buffer exists
  [0, 0.012, 0.026].forEach((d, i) => {
    const t = actx.currentTime + d, src = actx.createBufferSource(), bp = actx.createBiquadFilter(), g = actx.createGain();
    src.buffer = noiseBuf;
    bp.type = 'bandpass'; bp.frequency.value = 1200; bp.Q.value = 1.2;
    g.gain.setValueAtTime(Math.min(0.9, 0.5 * loud) * (i === 2 ? 1 : 0.6), t);
    g.gain.exponentialRampToValueAtTime(0.001, t + (i === 2 ? 0.18 : 0.03));
    src.connect(bp).connect(g).connect(actx.destination);
    src.start(t); src.stop(t + 0.25);
  });
}
// Riser: a whoosh of noise sweeping upward after the hit, building tension for the next one
function riser(loud = 1, dur = 0.5) {
  if (!actx || actx.state !== 'running') return;
  crack(0);
  const t = actx.currentTime, src = actx.createBufferSource(), bp = actx.createBiquadFilter(), g = actx.createGain();
  src.buffer = noiseBuf;
  bp.type = 'bandpass'; bp.Q.value = 3;
  bp.frequency.setValueAtTime(600, t); bp.frequency.exponentialRampToValueAtTime(7000, t + dur);
  g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(Math.min(0.5, 0.25 * loud), t + dur * 0.8);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(bp).connect(g).connect(actx.destination);
  src.start(t); src.stop(t + dur + 0.05);
}

// Flames licking up the screen edges while a combo is hot; each combo keeps them burning a bit longer
const flamesEl = document.createElement('div');
flamesEl.className = 'combo-flames';
document.body.appendChild(flamesEl);
let flamesTimer = 0;
function comboFlames(n) {
  if (n < 3) return; // only once the combo is good
  flamesEl.style.setProperty('--heat', Math.min(1, 0.45 + (n - 3) * 0.1).toFixed(2)); // taller/brighter with the combo
  flamesEl.classList.add('on');
  flamesEl.classList.toggle('inferno', n >= 7);
  clearTimeout(flamesTimer);
  flamesTimer = setTimeout(() => flamesEl.classList.remove('on', 'inferno'), 1800);
}

function comboSfx(n) {
  // Punch first: every combo step hits a kick, harder and deeper as it grows, with a crack from step 2
  kick(0.7 + n * 0.08, Math.max(30, 50 - n * 2));
  if (n >= 2) crack(0.6 + n * 0.06, 0.15 + Math.min(0.35, n * 0.03));
  if (n >= 2) clap(0.7 + n * 0.05);
  if (n >= 4) riser(0.6 + n * 0.06, 0.35 + Math.min(0.3, n * 0.03));
  comboFlames(n);
  const root = COMBO_SCALE[Math.min(n, COMBO_SCALE.length) - 1];
  const loud = Math.min(1.6, 0.8 + n * 0.12);
  const chord = () => COMBO_CHORD.forEach(([st, vol, from]) => { if (n >= from) sfx('combo', 2 ** ((root + st) / 12), vol * loud); });
  chord();
  // Chorus: slightly detuned copies of the main notes make it sound like a bigger choir (more voices from step 2)
  if (n >= 2) [-0.012, 0.012].forEach(cents => [-12, 0, 12].forEach(st =>
    sfx('combo', 2 ** ((root + st) / 12 + cents), 0.22 * loud)));
  // (chorus copies sit on the note and an octave either side)
  // Echo tail: quieter repeats, more of them the longer the chain
  const echoes = Math.min(3, 1 + Math.floor(n / 3));
  for (let e = 1; e <= echoes; e++) setTimeout(() => COMBO_CHORD.slice(0, 3).forEach(([st, vol]) =>
    sfx('combo', 2 ** ((root + st) / 12), vol * loud * 0.35 / e)), e * 110);
  if (n >= 3) sfx('big_hit', Math.max(0.45, 0.75 - n * 0.03), Math.min(1, 0.25 + n * 0.08)); // deep boom underneath
  if (n >= 5) sfx('coin', 1.6 + Math.min(0.8, n * 0.05), 0.5);                                   // shimmer on top
  if (n === 3 || n === 5 || n === 8 || n >= 10) {
    banner(`COMBO x${n + 1}!`, n >= 8 ? 'fire' : n >= 5 ? 'legendary' : '');
    flash(n >= 8 ? '#ff4b1f' : '#ffd23f', Math.min(0.5, 0.15 + n * 0.04));
    if (n >= 5) confetti(30 + n * 5);
    haptic(40 + n * 10);
  }
}

// Short vibration on devices that support it (Android; iPads/iPhones ignore it)
const haptic = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };

// Screen position of an element's centre, mirrored when the screen is flipped for Player 2
function screenCenter(el) {
  const r = el.getBoundingClientRect();
  let x = r.left + r.width / 2, y = r.top + r.height / 2;
  if (document.documentElement.classList.contains('flipped')) { x = innerWidth - x; y = innerHeight - y; }
  return [x, y];
}

// Confetti falling from the top of the screen
const CONFETTI_COLORS = ['#ffd23f', '#ff5d8a', '#3cdc3c', '#6aa8ff', '#b07cff', '#fff'];
function confetti(n = 70) {
  for (let i = 0; i < n; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    const dur = 1.4 + Math.random() * 1.2;
    Object.assign(c.style, { left: Math.random() * 100 + 'vw', background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      animationDuration: dur + 's', animationDelay: Math.random() * 0.3 + 's' });
    c.style.setProperty('--drift', (Math.random() * 160 - 80) + 'px');
    c.style.setProperty('--spin', (Math.random() * 1080 - 540) + 'deg');
    document.body.appendChild(c);
    setTimeout(() => c.remove(), (dur + 0.4) * 1000);
  }
}

// Big text that slams onto the middle of the screen for a moment
function banner(text, cls = '') {
  const b = document.createElement('div');
  b.className = 'juice-banner ' + cls;
  b.textContent = text;
  document.body.appendChild(b);
  setTimeout(() => b.remove(), 1500);
}

// Coins fly from a point on screen into the wallet, each landing with a rising "ting"
function coinFly(x, y, amount) {
  const n = Math.min(12, Math.max(1, Math.round(amount)));
  const [wx, wy] = screenCenter(wallet);
  for (let i = 0; i < n; i++) {
    const c = document.createElement('div');
    c.className = 'fly-coin';
    c.innerHTML = COIN;
    const sx = x + (Math.random() - 0.5) * 60, sy = y + (Math.random() - 0.5) * 40;
    Object.assign(c.style, { left: sx + 'px', top: sy + 'px' });
    document.body.appendChild(c);
    setTimeout(() => {
      Object.assign(c.style, { left: wx + 'px', top: wy + 'px', transform: 'translate(-50%, -50%) scale(0.6)' });
    }, 30 + i * 45);
    setTimeout(() => { c.remove(); sfx('coin', 1 + i * 0.06, 0.35); }, 530 + i * 45);
  }
}

// --- Answer streaks: right answers in a row multiply coin rewards (3 in a row x2, 5 in a row x3) ---
const streakMult = p => (p.streak || 0) >= 5 ? 3 : (p.streak || 0) >= 3 ? 2 : 1;
const streakEl = document.createElement('div');
streakEl.className = 'streak-meter';
streakEl.hidden = true;
document.body.appendChild(streakEl);
function renderStreak() {
  const p = players[turn], s = p.streak || 0, m = streakMult(p);
  streakEl.hidden = s < 1;
  streakEl.className = 'streak-meter' + (m === 3 ? ' fire' : m === 2 ? ' hot' : '');
  streakEl.innerHTML = `🔥 ${s}<small>${m > 1 ? `coins x${m}` : `${3 - s} more for x2`}</small>`;
}
// Called after every math answer (quizzes and the Frog Math Swarm solve)
function onAnswer(correct, p = players[turn]) {
  const before = streakMult(p);
  p.streak = correct ? (p.streak || 0) + 1 : 0;
  if (correct) { stat(p, 'right'); statMax(p, 'streak', p.streak); }
  const after = streakMult(p);
  if (correct && p.streak >= 2) comboSfx(p.streak - 1); // 2nd right answer in a row and on: rising choir
  if (after > before) {
    sfx('level_up');
    confetti(after === 3 ? 110 : 60);
    banner(after === 3 ? '🔥 ON FIRE! COINS x3' : '🔥 STREAK! COINS x2', after === 3 ? 'fire' : '');
    haptic(80);
  } else if (!correct && before > 1) banner('Streak lost!', 'lose');
  renderStreak();
}
// Sounds get a touch higher and brighter the longer your streak (see sfx in effects.js)
const streakPitch = () => 1 + Math.min(0.15, (players[turn].streak || 0) * 0.02);

// --- Rarity ---
const RARITY_COLORS = { common: '#9aa4b0', rare: '#3b82f6', epic: '#a855f7', legendary: '#f59e0b', mythical: '#ff2bd6' };
const rarityOf = c => c.rarity || 'common';

// --- Card pack: the cards you drew are dealt face down, then flip one at a time.
// Rarer cards shake and glow before they flip; a legendary gets the full jackpot treatment.
function showPack(cards, p) {
  if (!cards.length) return Promise.resolve();
  const el = document.createElement('div');
  el.className = 'pack-overlay';
  el.innerHTML = `<div class="shop-panel pack-panel"><h2>🎴 Card pack</h2><div class="pack-row">` +
    cards.map(c => `<div class="pack-card r-${rarityOf(c)}"><div class="pack-inner">
      <div class="pack-back">🐸</div><div class="pack-front">${cardFace(c, 0, p.attack)}</div></div></div>`).join('') +
    `</div><div class="battle-msg pack-msg"></div><button class="battle-go" hidden>Collect</button></div>`;
  document.body.appendChild(el);
  const slots = [...el.querySelectorAll('.pack-card')], msg = el.querySelector('.pack-msg'), btn = el.querySelector('button');
  return (async () => {
    await sleep(400);
    for (let i = 0; i < cards.length; i++) {
      const r = rarityOf(cards[i]), slot = slots[i];
      if (r !== 'common') {
        // Anticipation: the card rattles and glows in its rarity colour before flipping
        slot.classList.add('tease');
        for (let k = 0; k < (r === 'mythical' ? 14 : r === 'legendary' ? 8 : r === 'epic' ? 5 : 3); k++) { sfx('wheel_tick', 1 + k * 0.08); await sleep(90); }
      }
      slot.classList.remove('tease');
      slot.classList.add('flipped');
      if (i > 0) comboSfx(i); // each card flipped in a row climbs
      if (r === 'mythical') {
        sfx('jackpot'); sfx('level_up'); flash('#ff2bd6', 0.8); confetti(160); haptic(250);
        banner('🛰️ MYTHICAL ULTIMATE! 🛰️', 'legendary');
      } else if (r === 'legendary') {
        sfx('jackpot'); flash('#ffd23f', 0.6); confetti(120); haptic(150);
        banner('✨ LEGENDARY! ✨', 'legendary');
      } else if (r === 'epic') { sfx('celebrate', 1, 0.8); flash('#a855f7', 0.3); haptic(50); }
      else if (r === 'rare') sfx('card_land_attack', 1.1);
      else sfx('card_pick', 1);
      const huge = r === 'legendary' || r === 'mythical';
      if (r !== 'common') burst(slot, [RARITY_COLORS[r], '#fff', '#7af7ff'], huge ? 44 : 18, huge ? 1.6 : 0.9);
      await sleep(r === 'mythical' ? 1400 : huge ? 900 : 450);
    }
    const best = ['mythical', 'legendary', 'epic', 'rare'].find(r => cards.some(c => rarityOf(c) === r));
    msg.textContent = best ? `Best pull: ${best.toUpperCase()}!` : 'Nice pull!';
    btn.hidden = false;
    await new Promise(r => btn.onclick = r);
    el.remove();
  })();
}
