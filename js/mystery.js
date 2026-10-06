// Mystery "?" tiles and swamp events.
// A mystery tile opens a chest with a random outcome. Every few rolls a random swamp event changes the
// whole board for a while (see SWAMP_EVENTS); its effects are read by other files through swampActive().

// ---------- Mystery chest ----------
const MYSTERY_OUTCOMES = [
  { w: 22, icon: '💰', name: 'Treasure!', run: async p => { const n = gainCoins(p, 6 + threatLevel() * 3 + Math.floor(Math.random() * 6)); return `+${n} coins`; } },
  { w: 16, icon: '🃏', name: 'A free card!', run: async p => { const [c] = await pickCards(p, 1); if (c) p.hand.push(c); return c ? `${c.name} joins your hand` : 'The deck is empty...'; } },
  { w: 14, icon: '⭐', name: 'XP orb!', run: async p => { gainXp(p, 12 + threatLevel() * 3); return 'A burst of experience'; } },
  { w: 10, icon: '🔮', name: 'A charm!', run: async p => {
      const c = CHARMS.filter(x => charmCount(p, x.key) < x.max);
      if (!c.length) { gainCoins(p, 10); return 'You have every charm... +10 coins instead'; }
      const pick = c[Math.floor(Math.random() * c.length)];
      p.charms[pick.key] = charmCount(p, pick.key) + 1;
      return `${pick.icon} ${pick.name}`; } },
  { w: 8, icon: '🍖', name: 'Pet treat!', run: async p => { gainXp(p, 20); return `${petIcon(p) || '🐾'} Your buddy gobbles it up (+20 XP)`; } },
  { w: 10, icon: '🌀', name: 'Teleport!', run: async p => {
      const specials = cells.map((_, i) => i).filter(i => isSpecial(i) && !MYSTERY_SQUARES.includes(i) && i !== p.pos);
      p.pos = specials[Math.floor(Math.random() * specials.length)];
      render();
      return 'Whoosh! You land on a new square...'; }, after: p => runSquare(p) },
  { w: 10, icon: '💥', name: 'Booby trap!', bad: true, run: async p => { const n = Math.min(p.coins, 3 + threatLevel()); p.coins -= n; return `Ouch! -${n} coins`; } },
  { w: 8, icon: '👾', name: 'AMBUSH!', bad: true, run: async () => 'A monster jumps out of the chest!',
    after: async () => battleEvent(makeEnemy(ENEMY_TIERS[Math.random() < 0.6 ? 0 : 1])) },
  { w: 3, icon: '🗺️', name: 'A SECRET MAP!', run: async p => { addLap(p, '🗺️ Shortcut found!'); return 'Counts as a lap toward the boss!'; } },
];
async function mysteryEvent() {
  const p = players[turn];
  const total = MYSTERY_OUTCOMES.reduce((n, o) => n + o.w, 0);
  let r = Math.random() * total;
  const o = MYSTERY_OUTCOMES.find(x => (r -= x.w) < 0) || MYSTERY_OUTCOMES[0];
  const el = document.createElement('div');
  el.className = 'mg-overlay';
  el.innerHTML = `<div class="shop-panel prog-panel"><h2>❓ Mystery Chest</h2><div class="mystery-chest">🎁</div>
    <div class="battle-msg mystery-msg">What's inside...?</div><button class="battle-go" hidden>Continue</button></div>`;
  document.body.appendChild(el);
  const chest = el.querySelector('.mystery-chest'), msg = el.querySelector('.mystery-msg'), btn = el.querySelector('button');
  for (let k = 0; k < 8; k++) { sfx('wheel_tick', 1 + k * 0.08); await sleep(110); }
  chest.textContent = o.icon;
  chest.classList.add('open');
  if (o.bad) { sfx('fail'); flash('#ff2b2b', 0.3); } else { sfx('jackpot', 1.1, 0.7); flash('#b07cff', 0.35); confetti(40); }
  burst(chest, o.bad ? ['#ff5d5d', '#fff'] : ['#b07cff', '#ffd23f', '#fff'], 30, 1.3);
  el.querySelector('h2').textContent = `❓ ${o.name}`;
  el.hidden = o.icon === '🃏'; // the card pick screen shows on its own
  msg.textContent = await o.run(p);
  el.hidden = false;
  render();
  btn.hidden = false;
  await new Promise(res => btn.onclick = res);
  el.remove();
  if (o.after) await o.after(p);
}

// ---------- Swamp events ----------
const SWAMP_EVERY = () => SOLO ? 6 : 12; // rolls between events
const SWAMP_EVENTS = [
  { key: 'golden', icon: '🌅', name: 'Golden Hour', rolls: 4, desc: 'Coin squares pay double!', tint: '#ffd23f' },
  { key: 'market', icon: '🛍️', name: 'Market Day', rolls: 4, desc: 'Everything in the shop is 30% off!', tint: '#e0a800' },
  { key: 'rain',   icon: '🌧️', name: 'Frog Rain', rolls: 0, desc: 'Frogs fall from the sky: everyone gets XP!', tint: '#6aa8ff',
    start: () => players.forEach(p => gainXp(p, 15)) },
  { key: 'moon',   icon: '🌕', name: 'Full Moon', rolls: 4, desc: 'Monsters are stronger, but battle rewards are doubled!', tint: '#b07cff' },
  { key: 'treasure', icon: '💎', name: 'Treasure Drop', rolls: 6, desc: 'Treasure chests appear on 3 tiles. First to land takes one!', tint: '#3ad1c4',
    start: () => dropTreasure(3), end: () => clearTreasure() },
  { key: 'storm',  icon: '⛈️', name: 'Swamp Storm', rolls: 0, desc: 'The storm washes every trap away!', tint: '#3a4a6a',
    start: () => clearTraps() },
];
let swampEvent = null, swampLeft = 0, swampRolls = 0;
const swampActive = key => swampEvent && swampEvent.key === key && swampLeft > 0;
// Called once per roll (from onRollProgress)
function tickSwamp() {
  if (swampEvent && swampLeft > 0 && --swampLeft === 0) { swampEvent.end?.(); swampEvent = null; setBoardTint(null); }
  if (++swampRolls % SWAMP_EVERY()) return;
  startSwamp(SWAMP_EVENTS[Math.floor(Math.random() * SWAMP_EVENTS.length)]);
}
function startSwamp(ev) {
  swampEvent?.end?.();
  swampEvent = ev;
  swampLeft = ev.rolls;
  ev.start?.();
  banner(`${ev.icon} ${ev.name.toUpperCase()}! ${ev.desc}`, 'legendary');
  sfx('celebrate'); flash(ev.tint, 0.4);
  setBoardTint(ev.rolls ? ev.tint : null);
  if (!ev.rolls) { swampEvent = null; setTimeout(() => setBoardTint(null), 100); }
  renderProgress();
}
const swampLine = () => swampEvent && swampLeft > 0 ? `${swampEvent.icon} ${swampEvent.name} (${swampLeft} roll${swampLeft === 1 ? '' : 's'})` : '';
// A soft colour wash over the board while an event lasts
const tintEl = document.createElement('div');
tintEl.className = 'swamp-tint';
document.getElementById('view').appendChild(tintEl);
function setBoardTint(color) {
  tintEl.style.background = color ? `radial-gradient(ellipse at center, transparent 40%, ${color}55 100%)` : 'none';
  tintEl.classList.toggle('on', !!color);
}

// Treasure Drop: glowing chests on random tiles
const treasureTiles = new Map(); // tile -> marker element
function dropTreasure(n) {
  const free = cells.map((_, i) => i).filter(i => i !== START_TILE && !treasureTiles.has(i)).sort(() => Math.random() - 0.5).slice(0, n);
  free.forEach(i => {
    const el = document.createElement('div');
    el.className = 'treasure-marker';
    el.textContent = '💎';
    const [x, y] = cellCenter(i);
    Object.assign(el.style, { left: x + 'px', top: y + 'px' });
    world.appendChild(el);
    treasureTiles.set(i, el);
  });
}
function clearTreasure() { treasureTiles.forEach(el => el.remove()); treasureTiles.clear(); }
async function checkTreasure(p) {
  const el = treasureTiles.get(p.pos);
  if (!el) return;
  treasureTiles.delete(p.pos);
  burst(el, ['#3ad1c4', '#fff', '#ffd23f'], 30, 1.2);
  el.remove();
  const n = gainCoins(p, 12 + threatLevel() * 4);
  gainXp(p, 10);
  banner(`💎 Treasure! +${n} coins`, 'legendary');
  sfx('jackpot');
  render();
  await sleep(600);
}
