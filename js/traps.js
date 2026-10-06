// Traps & sabotage: buy traps in the shop's Traps tab and set them on board tiles. The rival triggers them
// when they hop onto the tile (your own traps catch you 25% of the time, and always in solo so you can test
// them). Curses go straight to the rival (to yourself in solo): a Rotten Egg card or a Jinx on the next roll.

const TRAP_TYPES = [
  { key: 'snare',  icon: '🪤', name: 'Coin Snare',  price: 6, desc: 'Whoever steps on it loses 5 coins (to you)' },
  { key: 'mud',    icon: '🟫', name: 'Sticky Mud',  price: 5, desc: 'Stops their movement right there' },
  { key: 'bubble', icon: '🫧', name: 'Bubble Trap', price: 7, desc: 'Bounces them to a random tile' },
  { key: 'thief',  icon: '🦝', name: 'Card Thief',  price: 8, desc: 'You steal a random card from them' },
];
const CURSES = [
  { key: 'egg',  icon: '🥚', name: 'Rotten Egg', price: 7, desc: 'Puts a curse card in the rival\'s hand: forced into their next battle, it hurts them' },
  { key: 'jinx', icon: '🐈‍⬛', name: 'Jinx',     price: 6, desc: 'The rival\'s next roll is halved' },
];
const OWN_TRAP_CHANCE = 0.25;
const boardTraps = []; // { tile, type, owner }
const rivalOf = p => SOLO ? p : players[1 - players.indexOf(p)];

// ---------- Shop tab ----------
function renderTrapShop(page, p, buy) {
  const traps = TRAP_TYPES.map(t => {
    const have = (p.traps && p.traps[t.key]) || 0;
    return { icon: t.icon, name: t.name, desc: t.desc, price: Math.round(t.price * shopDiscount(p)), color: '#c8a060', chip: 'Trap', owned: have,
      buy: () => { p.traps = p.traps || {}; p.traps[t.key] = have + 1; renderTrapButton(); }, colors: ['#8a6a3a', '#fff'] };
  });
  const curses = CURSES.map(c => ({ icon: c.icon, name: c.name, desc: c.desc, price: Math.round(c.price * shopDiscount(p)), color: '#b04cff', chip: 'Curse',
    glow: 'epic', buy: () => castCurse(p, c.key), colors: ['#7a0aa8', '#fff'] }));
  shelfStore(page, p, buy, { id: 'traps', sign: '🪤 Traps & Curses', sub: 'set traps on the board with the 🪤 button',
    shelves: [{ label: 'Traps', items: traps },
      { label: SOLO ? 'Curses (solo: they hit you, for testing)' : 'Curses (sent to your rival right away)', items: curses }] });
}
function castCurse(p, key) {
  const target = rivalOf(p);
  if (key === 'egg') target.hand.push({ ...CARD_TYPES.find(c => c.name === 'Rotten Egg') });
  if (key === 'jinx') target.jinx = true;
  banner(`${key === 'egg' ? '🥚' : '🐈‍⬛'} ${target.name} is cursed!`, 'lose');
  sfx('poison', 0.8);
}

// ---------- Placing traps ----------
const trapBtn = document.createElement('button');
trapBtn.className = 'prog-quest-btn trap-btn';
document.getElementById('view').appendChild(trapBtn);
function renderTrapButton() {
  const p = players[turn];
  const n = p && p.traps ? Object.values(p.traps).reduce((a, b) => a + b, 0) : 0;
  trapBtn.hidden = !n;
  trapBtn.textContent = `🪤 Set trap (${n})`;
  trapBtn.disabled = busy;
}
trapBtn.addEventListener('click', () => { if (!busy) runEvent(placeTrap); });
async function placeTrap() {
  const p = players[turn];
  const types = TRAP_TYPES.filter(t => p.traps && p.traps[t.key]);
  if (!types.length) return;
  // Choose which trap (if you own more than one kind), then tap a tile on the board
  const type = types.length === 1 ? types[0] : await new Promise(res => {
    const el = document.createElement('div');
    el.className = 'prog-overlay';
    el.innerHTML = `<div class="shop-panel prog-panel"><h2>🪤 Which trap?</h2><div class="perk-row">${types.map(t =>
      `<button class="perk-card"><span class="perk-icon">${t.icon}</span><b>${t.name} x${p.traps[t.key]}</b><small>${t.desc}</small></button>`).join('')}</div></div>`;
    document.body.appendChild(el);
    el.querySelectorAll('.perk-card').forEach((b, i) => b.onclick = () => { el.remove(); res(types[i]); });
  });
  label.textContent = `${p.name}: tap a tile to set the ${type.name}`;
  const ok = squareEls.map((_, i) => i).filter(i => i !== START_TILE && !boardTraps.some(t => t.tile === i));
  const tile = await new Promise(res => ok.forEach(i => {
    squareEls[i].classList.add('trap-target');
    squareEls[i].onclick = () => { ok.forEach(j => { squareEls[j].classList.remove('trap-target'); squareEls[j].onclick = null; }); res(i); };
  }));
  p.traps[type.key]--;
  boardTraps.push({ tile, type: type.key, owner: p });
  sfx('card_pick', 0.8);
  burst(squareEls[tile], ['#8a6a3a', '#fff'], 18, 0.8);
  renderTraps();
}

// Trap markers: only visible on their owner's turn (hidden from the rival)
function renderTraps() {
  boardTraps.forEach(t => {
    if (!t.el) {
      t.el = document.createElement('div');
      t.el.className = 'trap-marker';
      t.el.textContent = TRAP_TYPES.find(x => x.key === t.type).icon;
      const [x, y] = cellCenter(t.tile);
      Object.assign(t.el.style, { left: x + 'px', top: y + 'px' });
      world.appendChild(t.el);
    }
    t.el.hidden = t.owner !== players[turn];
  });
  renderTrapButton();
}
function clearTraps() {
  boardTraps.forEach(t => t.el?.remove());
  boardTraps.length = 0;
}

// Called after every hop. Returns 'stop' if the move should end here (mud, bubble).
async function checkTrap(p) {
  const i = boardTraps.findIndex(t => t.tile === p.pos);
  if (i < 0) return null;
  const t = boardTraps[i];
  const own = t.owner === p;
  if (own && !SOLO && Math.random() >= OWN_TRAP_CHANCE) return null; // you usually remember your own traps
  boardTraps.splice(i, 1);
  t.el?.remove();
  const type = TRAP_TYPES.find(x => x.key === t.type);
  if (!own) stat(t.owner, 'traps');
  const sq = squareEls[p.pos];
  burst(sq, ['#8a6a3a', '#ff5d5d', '#fff'], 28, 1.2);
  flash('#ff2b2b', 0.35); haptic(120); sfx('blocked', 0.7);
  banner(`${type.icon} ${type.name}!${own && !SOLO ? ' (your own trap!)' : ''}`, 'lose');
  await sleep(500);
  if (t.type === 'snare') {
    const lost = Math.min(5, p.coins);
    p.coins -= lost;
    if (!own) t.owner.coins += lost;
  } else if (t.type === 'thief' && p.hand.length) {
    const [card] = p.hand.splice(Math.floor(Math.random() * p.hand.length), 1);
    if (!own) t.owner.hand.push(card);
  } else if (t.type === 'bubble') {
    p.pos = Math.floor(Math.random() * cells.length);
    render();
    return 'stop';
  } else if (t.type === 'mud') return 'stop';
  render();
  return null;
}
