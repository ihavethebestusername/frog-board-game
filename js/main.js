// Special events registry + Events menu, then wires up controls and starts the game.
// Loaded last because the registry references functions from every other file.

// --- Special events registry ---
// Every special event goes here; the Events menu lists them all automatically.
// run() is async and acts on the current player.
const EVENTS = [
  { name: 'Shop', desc: 'Open the shop', run: openShop },
  ...Object.entries(COIN_SQUARES).map(([i, range]) => ({
    name: `Coin square #${+i + 1}`, desc: `Skill check for ${range[0]}–${range[1]} coins`, run: () => coinEvent(range),
  })),
  { name: 'Card square', desc: `Draw up to ${CARDS_PER_SQUARE} cards`, run: () => cardEvent() },
  { name: 'Give 2 of every card', desc: 'Testing: adds 2 of each card type to your hand',
    run: async () => { CARD_TYPES.filter(c => c.count).forEach(c => players[turn].hand.push(copyCard(c), copyCard(c))); } },
  { name: 'Fusion', desc: 'Move a gimmick from one card onto another', run: fuseEvent },
  { name: 'Battle', desc: `${LOADOUT_MIN}–${LOADOUT_MAX} card spinner battle for ${BATTLE_PRIZE} coins`, run: battleEvent },
];

// Block rolling while an event is running
async function runEvent(fn) {
  if (busy) return;
  busy = true;
  render();
  try { await fn(); } finally { busy = false; render(); }
}

const eventsEl = document.getElementById('events');
const eventsBtn = document.getElementById('eventsBtn');
EVENTS.forEach(ev => {
  const b = document.createElement('button');
  b.innerHTML = `${ev.name}<small>${ev.desc}</small>`;
  b.addEventListener('click', () => { eventsEl.hidden = true; runEvent(ev.run); });
  document.getElementById('eventList').appendChild(b);
});
eventsBtn.addEventListener('click', () => { if (!busy) eventsEl.hidden = false; });
document.getElementById('eventsClose').addEventListener('click', () => eventsEl.hidden = true);
eventsEl.addEventListener('click', e => { if (e.target === eventsEl) eventsEl.hidden = true; });

// UI sounds: a click for every button, a soft tick when hovering a card (throttled)
document.addEventListener('click', e => { if (e.target.closest('button')) sfx('button_click'); }, true);
let lastHoverCard = null;
document.addEventListener('mouseover', e => {
  const card = e.target.closest('.card-face');
  if (card && card !== lastHoverCard && !card.closest('.wheel-slot')) sfx('card_hover');
  lastHoverCard = card;
});

rollBtn.addEventListener('click', rollDice);
addEventListener('keydown', e => { if (e.key === ' ' && shopEl.hidden) { e.preventDefault(); rollDice(); } });
addEventListener('resize', render);
players.forEach(p => faceNext(p));
render();
