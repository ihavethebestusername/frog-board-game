// Board rendering: squares, center deck, frog tokens, camera and HUD updates.

const view = document.getElementById('view');
// The view's size, kept up to date on resize. Reading view.clientWidth right after the page changed forces a
// layout, and the camera and weather used to do that every frame.
let viewW = view.clientWidth, viewH = view.clientHeight;
addEventListener('resize', () => { viewW = view.clientWidth; viewH = view.clientHeight; });
const world = document.getElementById('world');
const label = document.getElementById('label');
const rollBtn = document.getElementById('roll');
const dieEl = document.getElementById('die');
const wallet = document.getElementById('wallet');
const shopEl = document.getElementById('shop');
world.style.width = width + 'px';
world.style.height = height + 'px';

// The whole board (ground, roads, squares, deck, tokens) is drawn by buildBoard(), which runs at load and again
// whenever the adventure moves to a new region (regions.js)
const squareEls = [];
let DECK_POS = [2 * STEP + SIZE / 2, 3 * STEP + SIZE / 2]; // open space in the top-left of the Swamp
let deckEl, deckCountEl;
function buildBoard() {
  world.innerHTML = '';
  // Grass ground: a big layer inside the board itself, so it moves with the camera exactly
  const grass = document.createElement('div');
  grass.className = 'grass';
  world.appendChild(grass);

  // Roads between connected tiles (drawn under the tiles) so paths and forks are easy to follow
  nextOf.forEach((outs, a) => outs.forEach(b => {
    const [ax, ay] = cellCenter(a), [bx, by] = cellCenter(b);
    const road = document.createElement('div');
    road.className = 'road';
    const t = 34; // path width
    Object.assign(road.style, { left: Math.min(ax, bx) - t / 2 + 'px', top: Math.min(ay, by) - t / 2 + 'px',
                                width: Math.abs(bx - ax) + t + 'px', height: Math.abs(by - ay) + t + 'px' });
    world.appendChild(road);
  }));

  squareEls.length = 0;
  cells.forEach(([x, y, w, h], i) => {
    const sq = document.createElement('div');
    sq.className = 'square';
    if (SHOP_SQUARES.includes(i)) {
      sq.classList.add('shop');
      sq.innerHTML = COIN + 'SHOP';
    } else if (BOSS_SQUARES.includes(i)) {
      sq.classList.add('boss');
      sq.innerHTML = '<div class="icon">🐷</div>BOSS';
    } else if (ENEMY_SQUARES.includes(i)) {
      sq.classList.add('enemy');
      sq.innerHTML = '<div class="icon">👾</div>ENEMY';
    } else if (FUSE_SQUARES.includes(i)) {
      sq.classList.add('fuse');
      sq.innerHTML = '<div class="icon">⚗️</div>FUSE';
    } else if (HAZARD_SQUARES.includes(i)) {
      const lava = REGION().hazard === 'lava';
      sq.classList.add(lava ? 'lava' : 'ice');
      sq.innerHTML = lava ? '<div class="icon">🌋</div>LAVA' : '<div class="icon">🧊</div>ICE';
    } else if (MYSTERY_SQUARES.includes(i)) {
      sq.classList.add('mystery');
      sq.innerHTML = '<div class="icon">❓</div>MYSTERY';
    } else if (MEMORY_SQUARES.includes(i)) {
      sq.classList.add('memory');
      sq.innerHTML = '<div class="icon">🧠</div>MATCH';
    } else if (HOP_SQUARES.includes(i)) {
      sq.classList.add('hop');
      sq.innerHTML = '<div class="icon">🪷</div>HOP';
    } else if (FORGE_SQUARES.includes(i)) {
      sq.classList.add('forge');
      sq.innerHTML = '<div class="icon">💎</div>FORGE';
    } else if (FLY_SQUARES.includes(i)) {
      sq.classList.add('flies');
      sq.innerHTML = '<div class="icon">🪰</div>FLIES';
    } else if (CUP_SQUARES.includes(i)) {
      sq.classList.add('cups');
      sq.innerHTML = '<img class="icon cup-icon" src="sprites/cup.png" alt="">CUPS';
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
      if (i === 0) { sq.classList.add('start'); sq.innerHTML = '🏁<small>START</small>'; } // laps are counted here
      if (nextOf[i].length > 1) { sq.classList.add('fork'); sq.innerHTML = `${i + 1}<small>FORK</small>`; }
    }
    Object.assign(sq.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
    world.appendChild(sq);
    squareEls.push(sq);
  });
  // Deck of cards in the middle of the board
  deckEl = document.createElement('div');
  deckEl.className = 'deck';
  Object.assign(deckEl.style, { left: DECK_POS[0] + 'px', top: DECK_POS[1] + 'px' });
  for (let i = 0; i < 4; i++) {
    const c = document.createElement('div');
    c.className = 'card-back';
    c.style.transform = `translate(${-i * 2}px, ${-i * 2}px)`;
    deckEl.appendChild(c);
  }
  deckCountEl = document.createElement('div');
  deckCountEl.className = 'count';
  deckEl.appendChild(deckCountEl);
  world.appendChild(deckEl);

  players.forEach(p => {
    if (!p.el) {
      p.el = document.createElement('img');
      p.el.className = 'token ' + p.cls;
      p.el.src = SPRITES.standing;
      p.el.addEventListener('click', frogClicked);
    }
    world.appendChild(p.el);
    if (p.petEl) world.appendChild(p.petEl);
  });
  if (typeof spawnFireflies === 'function') { if (REGION().fireflies) spawnFireflies(); else fireflies = []; } // (at load, fireflies.js spawns them itself)
}
buildBoard();

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
  const shared = !SOLO && players[0].pos === players[1].pos;
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
  return Math.max(1, Math.min(2.2, Math.min(viewW, viewH) / 260));
}

// Flip the whole screen upside down for Player 2, so each player reads it the right way up from
// their side of the table
function setFlip(forPlayer) {
  document.documentElement.classList.toggle('flipped', forPlayer === players[1]);
}

// Wallet: coins count up (or down) to the real amount instead of jumping, ticking faster as they go
let shownCoins = 0, shownTurn = -1, countingCoins = false;
function drawWallet() {
  wallet.innerHTML = COIN + ` <span class="wallet-coins">${shownCoins}</span> &nbsp; <span class="mini-card"></span> ` + players[turn].hand.length;
}
function updateWallet() {
  if (shownTurn !== turn) { shownTurn = turn; shownCoins = players[turn].coins; } // new turn: no count-up
  drawWallet();
  if (countingCoins || shownCoins === players[turn].coins) return;
  countingCoins = true;
  wallet.classList.add('counting');
  let n = 0;
  (function step() {
    const d = players[turn].coins - shownCoins;
    if (!d) { countingCoins = false; wallet.classList.remove('counting'); drawWallet(); return; }
    shownCoins += Math.sign(d) * Math.max(1, Math.ceil(Math.abs(d) / 12));
    if (d > 0 && n % 2 === 0) sfx('coin', 1 + Math.min(1, n * 0.04), 0.25);
    n++;
    drawWallet();
    setTimeout(step, 45);
  })();
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
  const tx = viewW / 2 - fx * z;
  const ty = viewH / 2 - fy * z;
  world.style.transform = `translate(${tx}px, ${ty}px) scale(${z})`;
  label.textContent = SOLO ? `Turn ${turnCount}` : players[turn].name + "'s turn";
  updateWallet();
  if (typeof renderStreak === 'function') renderStreak();
  if (typeof renderProgress === 'function') renderProgress();
  if (typeof renderPets === 'function') { renderPets(); renderTraps(); }
  deckCountEl.textContent = deck.length + ' left';
  handBtn.textContent = `Cards (${players[turn].hand.length})`;
  handBtn.disabled = busy;
  rollBtn.disabled = busy;
  if (typeof eventsBtn !== 'undefined') eventsBtn.disabled = busy;
}

