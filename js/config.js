// Game settings: board layout, special squares, battle cards, players, shop items.

// --- Board: tiles on a grid, connected by paths ---
// Each path is a run of [col, row] tiles; consecutive tiles are connected in the direction of travel.
// A tile with more than one exit is a fork: the player picks which way to go.
const SIZE = 60, GAP = 4, STEP = SIZE + GAP;
const COLS = 9, ROWS = 13;
const width = COLS * STEP - GAP;
const height = ROWS * STEP - GAP;

const cells = [];   // [x, y, w, h] per tile
const nextOf = [];  // nextOf[i] = tiles you can move to from tile i
const tileIndex = {};
function tile(c, r) {
  const k = c + ',' + r;
  if (!(k in tileIndex)) {
    tileIndex[k] = cells.length;
    cells.push([c * STEP, r * STEP, SIZE, SIZE]);
    nextOf.push([]);
  }
  return tileIndex[k];
}
const at = (c, r) => tileIndex[c + ',' + r];
// Straight run of tiles from (c1, r1) to (c2, r2), inclusive
function line(c1, r1, c2, r2) {
  const pts = [], n = Math.max(Math.abs(c2 - c1), Math.abs(r2 - r1));
  for (let i = 0; i <= n; i++) pts.push([c1 + Math.sign(c2 - c1) * i, r1 + Math.sign(r2 - r1) * i]);
  return pts;
}
function path(...runs) {
  const pts = runs.flat();
  for (let i = 0; i < pts.length - 1; i++) {
    const a = tile(...pts[i]), b = tile(...pts[i + 1]);
    if (a !== b && !nextOf[a].includes(b)) nextOf[a].push(b);
  }
}
// Main loop around the edge, clockwise from the top-left (tiles 0-39)
path(line(0, 0, 8, 0), line(8, 1, 8, 12), line(7, 12, 0, 12), line(0, 11, 0, 0));
// Shortcuts through the middle
path(line(4, 0, 4, 6));   // fork at the top: dive down the middle to the crossroads
path(line(4, 6, 8, 6));   // crossroads: go right to rejoin the right side...
path(line(4, 6, 4, 12));  // ...or keep going down to the bottom
path(line(0, 9, 4, 9));   // fork on the left side: cut across to the middle

const SPRITES = { standing: 'sprites/frog_standing.png', jumping: 'sprites/frog_jumping.png' };
const COIN = '<svg class="coin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#e0a800"/><circle cx="12" cy="12" r="8" fill="#ffd23f" stroke="#b07f00" stroke-width="1.5"/><text x="12" y="16.5" text-anchor="middle" font-size="11" font-weight="bold" font-family="sans-serif" fill="#b07f00">$</text></svg>';
const SHOP_SQUARES = [at(4, 6), at(0, 12)]; // the crossroads and the bottom-left corner
// Coin squares: index -> [min, max] coins. A skill check decides where in the range you land.
// Big ranges show a pile, small ones a single coin.
const COIN_SQUARES = {
  [at(2, 0)]: [1, 3], [at(8, 3)]: [2, 4], [at(8, 9)]: [1, 3], [at(6, 12)]: [1, 3], [at(0, 5)]: [2, 4],
  // Shortcuts pay better
  [at(4, 3)]: [4, 10], [at(6, 6)]: [5, 12], [at(4, 10)]: [4, 10], [at(2, 9)]: [3, 6],
};
// Coins you get for selling a card in the shop
const sellPrice = c => (c.gimmick ? 3 : Math.max(1, c.mult)) + (c.extra ? 2 : 0);
const cardSlots = c => c.slots || 1; // how many loadout slots a card takes
// Wrong (or too slow) math answers cost coins: coin squares take half the square's top prize,
// a missed card-draw question takes WRONG_CARD_PENALTY
const WRONG_CARD_PENALTY = 2;
const BIG_COIN_AMOUNT = 5; // ranges whose max reaches this show the pile
const coinIcon = ([, max]) => `sprites/${max >= BIG_COIN_AMOUNT ? 'coin_pile' : 'coin'}.png`;
// Card squares: index -> max cards you can draw there
// Card squares: every one lets you draw up to the same number of cards
const CARD_SQUARES = [at(6, 0), at(8, 11), at(2, 12), at(0, 7), at(4, 8)];
const CARDS_PER_SQUARE = 4;
// Battle cards: only used in battles. The deck holds `count` of each (40 total).
// Gimmick cards have a `gimmick` key handled in battleEvent; `text` describes what they do.
const CARD_TYPES = [
  // `mult`: damage = the player's base damage stat × mult
  { name: 'Tadpole Tackle', art: '🥚', mult: 1, count: 6 },
  { name: 'Sticky Tongue',  art: '👅', mult: 3, count: 5 },
  { name: 'Big Leap',       art: '🐸', mult: 4, count: 4 },
  { name: 'Croak Blast',    art: '📢', mult: 5, count: 3 },
  { name: 'Swamp King',     art: '👑', mult: 6, count: 2 },
  // Gimmicks
  { name: 'Poison Dart',    art: '🧪', mult: 1, count: 4, gimmick: 'poison', text: a => `${a} damage + poison ${a} a turn for 3 turns (stacks)` },
  { name: 'Lily Pad Shield', art: '🪷', mult: 0, count: 4, gimmick: 'shield', text: () => 'Block the next hit (stacks)' },
  { name: 'Healing Pond',   art: '💧', mult: 0, count: 3, gimmick: 'heal', text: a => `Heal ${a * 2}` },
  { name: 'Leech',          art: '🩸', mult: 0, count: 3, gimmick: 'leech', text: () => 'Drain your turn\'s damage again. No attacks? Spin for damage' },
  { name: 'Double Croak',   art: '🎶', mult: 0, count: 3, gimmick: 'double', text: () => 'Your next attack strikes one extra time (stacks)' },
  { name: 'Saw Blade',     art: '<img src="sprites/saw_blade.png" alt="">', mult: 1, count: 3, gimmick: 'saw', text: a => `${a} damage, then spin again` },
  // Secret growing card: flat damage that starts at -5 (heals the enemy!) and permanently goes up by 1
  // every time it's rolled; it returns to your hand after a battle. Not in the deck (count 0): there is
  // only one, unlocked by clicking the Cards button 10 times (see hand.js).
  { name: 'Late Bloomer',   art: '🌱', mult: 0, count: 0, gimmick: 'grow', growDmg: -5, slots: 2, // counts as two cards
    // Deliberately hides how it works: it just looks like a bad card
    text() { return `<span class="red-glow">it just does ${this.growDmg} damage.....</span>`; } },
  { name: 'Stun Slime',     art: '🟢', mult: 1, count: 3, gimmick: 'stun', text: a => `${a} damage + foe skips a turn` },
];
CARD_TYPES.forEach(c => c.text ||= a => `${a * c.mult} damage`);
const NO_CARD = { name: 'Bare Hands', art: '✋', mult: 1, text: a => `${a} damage` }; // x1 so battles always end
const MAX_BONUS_SPINS = 3; // max Saw Blade re-spins per turn, so a loadout of saws can't spin forever
const LOADOUT_MIN = 3, LOADOUT_MAX = 5; // cards each player brings into a battle
const BATTLE_HP = 100;
const HP_SEGMENTS = 20; // health bar is split into this many sprite segments
const HP_PER_SEGMENT = BATTLE_HP / HP_SEGMENTS;
const BASE_DAMAGE = 2; // every player's starting base damage stat (p.attack)

// Battle square: challenge the other frog; the winner takes coins from the loser
const BATTLE_SQUARES = [at(0, 2), at(7, 6), at(4, 11)];

// Fusion squares: move one card's gimmick onto another card (each card can carry one extra gimmick)
const FUSE_SQUARES = [at(0, 4), at(8, 8)];
// How a fused (extra) gimmick is described on the card it was added to
const EXTRA_TEXT = {
  poison: a => `poison ${a}/turn`,
  stun: () => 'stun',
  shield: () => '+1 shield',
  heal: a => `heal ${a * 2}`,
  double: () => 'strikes twice',
  leech: () => 'leech',
  saw: () => 'spin again',
};
const BATTLE_PRIZE = 3;
// Build and shuffle the deck
// Growing cards are copied so each one keeps its own damage
const copyCard = c => c.gimmick === 'grow' ? { ...c } : c;
const deck = CARD_TYPES.flatMap(c => Array.from({ length: c.count }, () => copyCard(c)));
for (let i = deck.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [deck[i], deck[j]] = [deck[j], deck[i]];
}

const players = [
  { name: 'Player 1', pos: 0, cls: 'p1', angle: 0, coins: 10, hand: [], attack: BASE_DAMAGE },
  { name: 'Player 2', pos: at(8, 12), cls: 'p2', angle: 0, coins: 10, hand: [], attack: BASE_DAMAGE },
];
// Placeholder items for now
const SHOP_ITEMS = [
  { name: 'Extra Roll', desc: 'Roll again this turn', price: 5 },
  { name: 'Lily Pad Boost', desc: 'Move +2 on your next roll', price: 3 },
  { name: 'Shield', desc: 'Block the next bad square', price: 8 },
];
