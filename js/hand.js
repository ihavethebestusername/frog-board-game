// Hand viewer: shows the current player's cards.

// Playstyle tabs above any row of cards (Cards menu, loadout picking, fusion, forge). Only styles you
// actually have get a tab; the chosen tab is remembered between menus.
const CARD_TAB_ICONS = { All: '🃏', Basic: '⚔️', Crit: '🎯', Poison: '🧪', Tank: '🛡️', Saws: '⚙️', Combos: '🎰',
                         Healing: '💚', Gold: '🪙', Control: '🟢', Special: '🌱', Curse: '🥚' };
let cardTab = 'All';
const CARD_ROW_MAX = 15; // cards per row before the row wraps onto another layer
function addCardTabs(grid) {
  if (!grid) return;
  const faces = [...grid.querySelectorAll('.card-face')];
  const styles = Object.keys(CARD_TAB_ICONS).filter(s => s === 'All' || faces.some(f => f.dataset.style === s));
  if (!styles.includes(cardTab)) cardTab = 'All';
  const bar = document.createElement('div');
  bar.className = 'card-tabs';
  const show = () => {
    faces.forEach(f => f.style.display = cardTab === 'All' || f.dataset.style === cardTab ? '' : 'none');
    bar.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.tab === cardTab));
    // Too many cards for one pannable row: wrap onto extra rows of CARD_ROW_MAX cards each
    const shown = faces.filter(f => f.style.display !== 'none').length;
    grid.classList.toggle('multi-row', shown > CARD_ROW_MAX);
  };
  bar.innerHTML = styles.map(s => {
    const n = s === 'All' ? faces.length : faces.filter(f => f.dataset.style === s).length;
    return `<button data-tab="${s}">${CARD_TAB_ICONS[s]} ${s} <small>${n}</small></button>`;
  }).join('');
  bar.querySelectorAll('button').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); cardTab = b.dataset.tab; show(); }));
  grid.before(bar);
  show();
  // A re-rendered row (e.g. after toggling a skill check) starts where the old one was panned to,
  // instead of snapping back to the middle for a frame, and joins a pan that's already running
  grid.style.translate = `${cardPanX.toFixed(1)}px 0`;
  if (cardPanRunning) panGrids = [...document.querySelectorAll(CARD_ROWS)].filter(g => g.offsetParent || g === grid);
}

// --- Hand viewer: shows the current player's cards, grouped by type ---
const handEl = document.getElementById('hand');
const handBtn = document.getElementById('handBtn');
function openHand() {
  const p = players[turn];
  document.getElementById('handTitle').textContent = `${p.name}'s cards`;
  const box = document.getElementById('handCards');
  if (!p.hand.length) {
    box.innerHTML = '<div class="hand-empty">No cards yet &mdash; land on a card square to draw some.</div>';
  } else {
    const groups = new Map();
    p.hand.forEach(c => groups.set(c, (groups.get(c) || 0) + 1));
    box.innerHTML = '<div class="hand-grid">' + [...groups].map(([c, n]) =>
      cardFace(c, n, p.attack)).join('') + '</div>' +
      '<div class="hand-empty">Tap attack cards to toggle a 🧠 skill check: fast answers hit harder, wrong answers heal the foe.</div>';
    const cards = [...groups.keys()];
    box.querySelectorAll('.card-face').forEach((el, i) => el.addEventListener('click', () => toggleQuiz(p, cards[i])));
    addCardTabs(box.querySelector('.hand-grid'));
  }
  // Charms bought in the shop
  const charms = CHARMS.filter(c => charmCount(p, c.key));
  if (charms.length) box.insertAdjacentHTML('beforeend', '<div class="artifact-list"><div class="shop-subhead">Charms</div>' +
    charms.map(c => { const n = charmCount(p, c.key);
      return `<div class="artifact"><span class="artifact-art">${c.icon}</span><div><b>${c.name} <span class="lvl">x${n}</span></b><small>${c.style} · ${c.desc(n)}</small></div></div>`; }).join('') + '</div>');
  // Artifacts collected from enemies
  const owned = Object.keys(ARTIFACTS).filter(k => artifactCount(p, k));
  box.insertAdjacentHTML('beforeend', '<div class="artifact-list"><div class="shop-subhead">Artifacts</div>' + (owned.length
    ? owned.map(k => { const a = ARTIFACTS[k], n = artifactCount(p, k);
        return `<div class="artifact"><span class="artifact-art">${a.art}</span><div><b>${a.name} <span class="lvl">Lv ${n}</span></b><small>${a.desc(n)}</small></div></div>`; }).join('')
    : '<div class="hand-empty">None yet &mdash; defeat enemies to collect their artifacts. Beat the same enemy again to level its artifact up.</div>') + '</div>');
  handEl.hidden = false;
}
// Toggle the skill check on every copy of a card in this player's hand. Most cards are shared objects
// (the same object for every copy in the deck), so a marked card is swapped for a private copy.
function toggleQuiz(p, c) {
  if (!(c.mult > 0) && c.gimmick !== 'grow') return; // only cards that deal damage have damage to scale (Late Bloomer grows its own)
  let next;
  if (c.gimmick === 'grow') { c.quiz = !c.quiz; next = c; } // already a unique copy
  else if (!c.quiz) next = { ...c, quiz: true, base: c };
  else if (c.base && c.base.extra === c.extra) next = c.base; // back to the shared card
  else { next = { ...c, quiz: false }; delete next.base; } // fused since it was marked: keep the fusion
  p.hand = p.hand.map(h => h === c ? next : h);
  sfx('card_pick', next.quiz ? 1.2 : 0.8);
  openHand();
}
// Secret: the 10th click on the Cards button (over the whole game) gives the one and only Late Bloomer
const SECRET_CLICKS = 10;
let cardsBtnClicks = 0, secretUnlocked = false;
function checkSecret() {
  if (secretUnlocked || ++cardsBtnClicks < SECRET_CLICKS) return;
  secretUnlocked = true;
  players[turn].hand.push(copyCard(CARD_TYPES.find(c => c.gimmick === 'grow')));
  sfx('card_land_gimmick', 0.6);
  sfx('big_hit', 0.5, 0.6);
  flash('#ff2020', 0.4);
  burst(handBtn, ['#ff2b2b', '#5fd13a', '#fff'], 40, 1.4);
}
handBtn.addEventListener('click', () => { if (busy) return; checkSecret(); openHand(); });
document.getElementById('handClose').addEventListener('click', () => handEl.hidden = true);
handEl.addEventListener('click', e => { if (e.target === handEl) handEl.hidden = true; });

// Card menus (Cards and battle loadout pick): moving the mouse toward the left/right edge
// smoothly pans the row of cards that way.
const CARD_PAN = 0.25; // max pan as a fraction of the screen width
let cardPanTarget = 0, cardPanX = 0;
// Every card-choosing screen uses the Cards menu's row layout, so they all pan the same way
const CARD_ROWS = '#handCards .hand-grid, .pick-grid, #fuseBody .hand-grid';
let cardPanRunning = false;
let panGrids = [];
function cardPanLoop() {
  const grids = panGrids; // looked up once when the pan starts, not every frame
  cardPanX += (cardPanTarget - cardPanX) * 0.08;
  grids.forEach(g => g.style.translate = `${cardPanX.toFixed(1)}px 0`);
  // Sleep once it has caught up (or no card menu is open); the next mouse move wakes it
  if (grids.length && Math.abs(cardPanTarget - cardPanX) > 0.3) requestAnimationFrame(cardPanLoop);
  else cardPanRunning = false;
}
window.addEventListener('mousemove', e => {
  cardPanTarget = -(e.clientX / window.innerWidth * 2 - 1) * window.innerWidth * CARD_PAN;
  if (!cardPanRunning) {
    panGrids = [...document.querySelectorAll(CARD_ROWS)].filter(g => g.offsetParent); // only rows on screen
    if (!panGrids.length) return;
    cardPanRunning = true;
    requestAnimationFrame(cardPanLoop);
  }
});
