// Board rendering: squares, center deck, frog tokens, camera and HUD updates.

const view = document.getElementById('view');
const world = document.getElementById('world');
const label = document.getElementById('label');
const rollBtn = document.getElementById('roll');
const dieEl = document.getElementById('die');
const wallet = document.getElementById('wallet');
const shopEl = document.getElementById('shop');
world.style.width = width + 'px';
world.style.height = height + 'px';

// Roads between connected tiles (drawn under the tiles) so paths and forks are easy to follow
nextOf.forEach((outs, a) => outs.forEach(b => {
  const [ax, ay] = cellCenter(a), [bx, by] = cellCenter(b);
  const road = document.createElement('div');
  road.className = 'road';
  const t = 12;
  Object.assign(road.style, { left: Math.min(ax, bx) - t / 2 + 'px', top: Math.min(ay, by) - t / 2 + 'px',
                              width: Math.abs(bx - ax) + t + 'px', height: Math.abs(by - ay) + t + 'px' });
  world.appendChild(road);
}));

const squareEls = [];
cells.forEach(([x, y, w, h], i) => {
  const sq = document.createElement('div');
  sq.className = 'square';
  if (SHOP_SQUARES.includes(i)) {
    sq.classList.add('shop');
    sq.innerHTML = COIN + 'SHOP';
  } else if (FUSE_SQUARES.includes(i)) {
    sq.classList.add('fuse');
    sq.innerHTML = '<div class="icon">⚗️</div>FUSE';
  } else if (BATTLE_SQUARES.includes(i)) {
    sq.classList.add('battle');
    sq.innerHTML = '<div class="icon">⚔️</div>BATTLE';
  } else if (CARD_SQUARES.includes(i)) {
    sq.classList.add('cards');
    sq.innerHTML = `<div class="mini-card"></div>up to ${CARDS_PER_SQUARE}`;
  } else if (COIN_SQUARES[i]) {
    const [min, max] = COIN_SQUARES[i];
    sq.classList.add('coins');
    sq.innerHTML = `<img src="${coinIcon(COIN_SQUARES[i])}" alt="">${min}–${max}`;
  } else {
    sq.textContent = i + 1;
    if (nextOf[i].length > 1) { sq.classList.add('fork'); sq.innerHTML = `${i + 1}<small>FORK</small>`; }
  }
  Object.assign(sq.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
  world.appendChild(sq);
  squareEls.push(sq);
});
// Deck of cards in the middle of the board
const DECK_POS = [2 * STEP + SIZE / 2, 3 * STEP + SIZE / 2]; // open space in the top-left of the board
const deckEl = document.createElement('div');
deckEl.className = 'deck';
Object.assign(deckEl.style, { left: DECK_POS[0] + 'px', top: DECK_POS[1] + 'px' });
for (let i = 0; i < 4; i++) {
  const c = document.createElement('div');
  c.className = 'card-back';
  c.style.transform = `translate(${-i * 2}px, ${-i * 2}px)`;
  deckEl.appendChild(c);
}
const deckCountEl = document.createElement('div');
deckCountEl.className = 'count';
deckEl.appendChild(deckCountEl);
world.appendChild(deckEl);

players.forEach(p => {
  p.el = document.createElement('img');
  p.el.className = 'token ' + p.cls;
  p.el.src = SPRITES.standing;
  p.el.addEventListener('click', frogClicked);
  world.appendChild(p.el);
});

// Secret: clicking the frogs 10 times toggles the tiny quiz answer on/off, only for the player whose
// turn it is when they click (the device is shared, so the current player is the one clicking)
const CHEAT_CLICKS = 10;
function frogClicked() {
  const p = players[turn];
  p.frogClicks = (p.frogClicks || 0) + 1;
  if (p.frogClicks < CHEAT_CLICKS) return;
  p.frogClicks = 0;
  p.cheats = !p.cheats;
  document.body.classList.toggle('cheats', p.cheats);
  sfx('card_pick', p.cheats ? 1.4 : 0.7); // quiet blip: high = on, low = off
}

function cellCenter(i) {
  const [x, y, w, h] = cells[i];
  return [x + w / 2, y + h / 2];
}

// Token sits in the middle of its square; if both share a square, nudge them apart
function center(p) {
  const [cx, cy] = cellCenter(p.pos);
  const shared = players[0].pos === players[1].pos;
  const off = shared ? (p === players[0] ? -10 : 10) : 0;
  return [cx + off, cy + off];
}

// Point the frog along the direction of travel toward the next square.
// The sprite faces up by default. Angles accumulate so it always turns the short way.
function faceNext(p, to = nextOf[p.pos][0]) {
  const [ax, ay] = cellCenter(p.pos);
  const [bx, by] = cellCenter(to);
  const target = Math.atan2(bx - ax, ay - by) * 180 / Math.PI;
  const delta = ((target - p.angle) % 360 + 540) % 360 - 180;
  p.angle += delta;
}

// Zoom so a comfortable chunk of the board is visible on any screen size
function zoom() {
  return Math.max(1, Math.min(2.2, Math.min(view.clientWidth, view.clientHeight) / 260));
}

// Flip the whole screen upside down for Player 2, so each player reads it the right way up from
// their side of the table
function setFlip(forPlayer) {
  document.documentElement.classList.toggle('flipped', forPlayer === players[1]);
}

function render() {
  setFlip(players[turn]);
  players.forEach((p, i) => {
    const [cx, cy] = center(p);
    p.el.style.left = (cx - 18) + 'px';
    p.el.style.top = (cy - 22) + 'px';
    p.el.style.transform = `rotate(${p.angle}deg)`;
    p.el.classList.toggle('active', i === turn);
  });
  // Camera: keep the current player in the middle of the screen
  const z = zoom();
  const [fx, fy] = center(players[turn]);
  const tx = view.clientWidth / 2 - fx * z;
  const ty = view.clientHeight / 2 - fy * z;
  world.style.transform = `translate(${tx}px, ${ty}px) scale(${z})`;
  label.textContent = players[turn].name + "'s turn";
  wallet.innerHTML = COIN + ' ' + players[turn].coins + ' &nbsp; <span class="mini-card"></span> ' + players[turn].hand.length;
  deckCountEl.textContent = deck.length + ' left';
  handBtn.textContent = `Cards (${players[turn].hand.length})`;
  handBtn.disabled = busy;
  rollBtn.disabled = busy;
  if (typeof eventsBtn !== 'undefined') eventsBtn.disabled = busy;
}
