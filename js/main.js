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
    run: async () => {
      const p = players[turn];
      p.noHandLimit = true; // testing: this player's hand limit is switched off from now on
      CARD_TYPES.filter(c => c.count || c.name === 'Orbital Laser').forEach(c => p.hand.push(copyCard(c), copyCard(c)));
    } },
  { name: 'Card animations', desc: 'Browse every card in the game and watch its battle animation', run: () => openAnimViewer() },
  { name: 'Show FPS', desc: 'Toggle a frames-per-second counter', run: async () => toggleFps() },
  { name: 'Lighter effects', desc: 'Toggle the lighter battle effects (switches on by itself if the device lags)',
    run: async () => { setFxLite(!fxLite); banner(fxLite ? '⚡ Lighter effects ON' : '✨ Full effects ON'); } },
  { name: 'Boss fight', desc: "Fight this region's boss", run: () => bossEvent() },
  { name: 'Enemy fight', desc: 'Pick a difficulty and fight a computer enemy', run: () => enemyEvent() },
  { name: 'Frog Math Swarm', desc: 'Catch number flies to build the biggest number', run: flyEvent },
  { name: 'Cups', desc: 'Follow the card under the shuffling cups', run: cupEvent },
  { name: 'Mystery tile', desc: 'Open a mystery chest', run: mysteryEvent },
  { name: 'Memory Match', desc: 'Match math problems to their answers', run: memoryEvent },
  { name: 'Lily Pad Hop', desc: 'Tap in time to hop across the pond', run: hopEvent },
  { name: 'Swamp event', desc: 'Start a random swamp event now', run: async () => startSwamp(SWAMP_EVENTS[Math.floor(Math.random() * SWAMP_EVENTS.length)]) },
  // Turn events (normally triggered by the number of rolls)
  ...SWAMP_EVENTS.map(ev => ({ name: `Swamp: ${ev.name}`, desc: ev.desc, run: async () => startSwamp(ev) })),
  { name: 'Monsters grow stronger', desc: 'Raise the threat level by 1 now', run: async () => forceThreat() },
  { name: 'Enemies evolve', desc: 'Evolve every enemy to its next form now', run: async () => forceEvolve() },
  { name: 'Travel to next region', desc: 'Testing: jump to the Ice Lake / Volcano now', run: async () => { if (!isFinalRegion()) await advanceRegion(players[turn]); } },
  { name: 'Get a crown', desc: 'Testing: +1 crown (try the match point and the recap screen)', run: async () => gainCrowns(players[turn], 1, 'Testing!') },
  { name: 'Boss hunts me', desc: 'Your next landing becomes a boss fight', run: async () => { players[turn].bossHunting = true; renderProgress(); } },
  { name: 'New boss tile', desc: 'Turn a coin or card square into a boss square now', run: async () => addBossTile() },
  { name: 'Get traps', desc: 'Testing: +1 of every trap', run: async () => { const p = players[turn]; p.traps = p.traps || {}; TRAP_TYPES.forEach(t => p.traps[t.key] = (p.traps[t.key] || 0) + 1); renderTrapButton(); } },
  { name: 'Rarity Forge', desc: "Upgrade a card's rarity (legendary → MYTHICAL)", run: forgeEvent },
  { name: 'Fusion', desc: 'Move a gimmick from one card onto another', run: fuseEvent },
  { name: 'Battle', desc: `${LOADOUT_MIN}–${LOADOUT_MAX} card spinner battle for ${BATTLE_PRIZE} coins`, run: battleEvent },
];

// Block rolling while an event is running
async function runEvent(fn) {
  if (busy) return;
  busy = true;
  render();
  try { await fn(); await endTurnProgress(players[turn]); } finally { busy = false; render(); }
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

// --- Start menu: 1 player (solo) or 2 players ---
const menuEl = document.getElementById('menu');
// Game length picker on the start menu (sets how many crowns win)
document.querySelectorAll('#menuLength button').forEach(b => b.onclick = () => {
  document.querySelectorAll('#menuLength button').forEach(x => x.classList.toggle('on', x === b));
  sfx('card_pick');
});
function startGame(solo) {
  SOLO = solo;
  CROWNS_PER_REGION = +(document.querySelector('#menuLength .on')?.dataset.crowns || 2);
  if (SOLO) {
    players[1].el.hidden = true; // only your frog on the board
    EVENTS.splice(EVENTS.findIndex(e => e.name === 'Battle'), 1);
    document.querySelectorAll('#eventList button').forEach(b => { if (b.textContent.startsWith('Battle')) b.remove(); });
  }
  menuEl.hidden = true;
  sfx('button_click');
  startRainSound(); // ambience can start now that the player has tapped
  render();
  busy = true; // no rolling until everyone has a pet
  choosePets().then(async () => { busy = false; render(); await offerTour(); }); // then Shelly offers the tour
}
document.getElementById('menuSolo').onclick = () => startGame(true);
document.getElementById('menuDuo').onclick = () => startGame(false);
