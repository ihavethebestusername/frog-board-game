// Game settings: board layout, special squares, battle cards, players, shop items.

// --- Board: tiles on a grid, connected by paths ---
// Each path is a run of [col, row] tiles; consecutive tiles are connected in the direction of travel.
// A tile with more than one exit is a fork: the player picks which way to go.
const SIZE = 60, GAP = 18, STEP = SIZE + GAP; // GAP leaves room to see the dirt path between tiles
const COLS = 15, ROWS = 17;
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
// East wing: a big detour off the right side, rejoining lower down
path(line(8, 2, 14, 2), line(14, 3, 14, 10), line(13, 10, 8, 10));
// South wing: a loop under the bottom edge, rejoining further left
path(line(6, 12, 6, 16), line(5, 16, 1, 16), line(1, 15, 1, 12));

const SPRITES = { standing: 'sprites/frog_standing.png', jumping: 'sprites/frog_jumping.png' };
const COIN = '<svg class="coin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#e0a800"/><circle cx="12" cy="12" r="8" fill="#ffd23f" stroke="#b07f00" stroke-width="1.5"/><text x="12" y="16.5" text-anchor="middle" font-size="11" font-weight="bold" font-family="sans-serif" fill="#b07f00">$</text></svg>';
const SHOP_SQUARES = [at(4, 6), at(0, 12), at(14, 10)]; // the crossroads and the bottom-left corner
// Coin squares: index -> [min, max] coins. A skill check decides where in the range you land.
// Big ranges show a pile, small ones a single coin.
const COIN_SQUARES = {
  [at(2, 0)]: [1, 3], [at(8, 3)]: [2, 4], [at(8, 9)]: [1, 3], [at(6, 12)]: [1, 3], [at(0, 5)]: [2, 4],
  // Shortcuts pay better
  [at(4, 3)]: [4, 10], [at(6, 6)]: [5, 12], [at(4, 10)]: [4, 10], [at(2, 9)]: [3, 6],
  // The wings pay well too
  [at(11, 2)]: [3, 8], [at(14, 6)]: [4, 10], [at(10, 10)]: [3, 8], [at(3, 16)]: [3, 8], [at(1, 14)]: [2, 6],
  // Filling in the quiet stretches
  [at(5, 0)]: [2, 5], [at(8, 4)]: [2, 5], [at(3, 12)]: [2, 5], [at(0, 6)]: [2, 5], [at(4, 4)]: [4, 9], [at(4, 9)]: [3, 7],
  [at(12, 2)]: [3, 8], [at(14, 9)]: [3, 8], [at(1, 15)]: [2, 6],
};
// Coins you get for selling a card in the shop
const sellPrice = c => c.curse ? 0 : (c.gimmick ? 3 : Math.max(1, c.mult)) + (c.extra ? 2 : 0);
const cardSlots = c => c.slots || 1; // how many loadout slots a card takes
// Wrong (or too slow) math answers cost coins: coin squares take half the square's top prize,
// a missed card-draw question takes WRONG_CARD_PENALTY
const WRONG_CARD_PENALTY = 2;
const BIG_COIN_AMOUNT = 5; // ranges whose max reaches this show the pile
const coinIcon = ([, max]) => `sprites/${max >= BIG_COIN_AMOUNT ? 'coin_pile' : 'coin'}.png`;
// Card squares: index -> max cards you can draw there
// Card squares: every one lets you draw up to the same number of cards
const CARD_SQUARES = [at(6, 0), at(8, 11), at(2, 12), at(0, 7), at(4, 8), at(14, 8), at(5, 16), at(8, 7), at(0, 3), at(5, 6), at(13, 10)];
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
  { name: 'Stun Slime',     art: '🟢', mult: 1, count: 3, gimmick: 'stun', text: a => `${a} damage + ${Math.round(STUN_CHANCE * 100)}% chance foe skips a turn` },
  // --- Playstyle cards (they pair with the charms in js/charms.js) ---
  // Crit
  { name: 'Eagle Talon',    art: '🦅', mult: 2, count: 3, alwaysCrit: true, text: a => `${a * 2} damage, always a critical hit` },
  { name: 'Focus Croak',    art: '🎯', mult: 0, count: 2, gimmick: 'focus', text: () => '+50% crit chance for the rest of this turn (stacks)' },
  // Poison
  { name: 'Venom Fang',     art: '🦷', mult: 2, count: 3, gimmick: 'venomfang', text: a => `${a * 2} damage, double if the foe is poisoned` },
  { name: 'Toxic Cloud',    art: '☁️', mult: 1, count: 2, gimmick: 'plague', text: a => `${a} damage + doubles the foe's poison damage` },
  // Tank
  { name: 'Shell Bash',     art: '🐚', mult: 0, count: 3, gimmick: 'bash', text: a => `Deals ${a * 2} damage per shield you have (keeps them)` },
  { name: 'Bark Armor',     art: '🌳', mult: 0, count: 2, gimmick: 'armor', text: () => '+2 shields' },
  // Saws
  { name: 'Buzz Saw',       art: '⚙️', mult: 2, count: 2, gimmick: 'saw', text: a => `${a * 2} damage, then spin again` },
  // Combos
  { name: 'Mirror Frog',    art: '🪞', mult: 0, count: 2, gimmick: 'mirror', text: () => 'Copies the last card you played, even from last turn (and can count as a match!)' },
  // Healing
  { name: 'Lotus Bloom',    art: '🌸', mult: 2, count: 3, gimmick: 'lifesteal', text: a => `${a * 2} damage and heals you that much` },
  { name: 'Spring Rain',    art: '🌧️', mult: 0, count: 2, gimmick: 'regen', text: a => `Heal ${a} at the start of your next 3 turns` },
  // Gold
  { name: 'Gold Rush',      art: '🪙', mult: 1, count: 3, gimmick: 'loot', text: a => `${a} damage + you find 3 coins` },
  // ULTIMATE: the only mythical card you can find naturally. Not in the deck: the only way to get it is the
  // ULTIMATE difficulty of the cup game (see CUP_LEVELS). Does nothing until it lands
  // ORBITAL_CHARGES times in one turn (re-spins and Mirror Frog copies count), then fires the orbital laser.
  { name: 'Orbital Laser', art: '🛰️', mult: 0, count: 0, orbital: true, ultimate: true,
    text: a => `Land it ${ORBITAL_CHARGES}× in ONE turn: an orbital laser deals ${a * ORBITAL_MULT} damage, ignoring shields` },
  // Curse card (traps.js): never in the deck; forced into its owner's next loadout, hurts them when it lands
  { name: 'Rotten Egg', art: '🥚', mult: 0, count: 0, curse: true, text: a => `CURSED: when it lands you take ${a * 2} damage. Can't be sold.` },
  { name: 'Pickpocket',     art: '🦝', mult: 2, count: 2, gimmick: 'steal', text: a => `${a * 2} damage + steal 2 coins (vs enemies: find them)` },
];
CARD_TYPES.forEach(c => c.text ||= a => `${a * c.mult} damage`);
const ORBITAL_CHARGES = 3, ORBITAL_MULT = 40; // Orbital Laser: landings needed in one turn, damage multiplier
const MONSTER_LOSS_PENALTY = 0.25; // losing to a monster permanently cuts your battle stats by this much
// Cards whose hits play the heavy slam sound
const SLAM_CARDS = ['big-leap', 'shell-bash', 'cleaver-chop', 'bone-splitter', 'iron-shell-slam', 'rust-snap', 'tidal-crush',
  'iron-cleaver', 'royal-slam', 'tusk-frenzy', 'swamp-king', 'croak-blast',
  // Ice Lake and Volcano enemies (regions.js)
  'belly-slide', 'avalanche-pounce', 'glacier-slam', 'iceberg-toss', 'walrus-stampede', 'absolute-zero', 'moon-eater',
  'horn-charge', 'boulder-fist', 'quake-stomp', 'eruption', 'meteor-strike', 'tail-swipe', 'supernova', 'cinder-storm'];
const STUN_CHANCE = 0.5; // Stun Slime (and fused stuns) only stun this often
// Card tabs: which playstyle tab each card sits under in the card menus (anything unlisted is Basic)
const CARD_STYLE = {
  'eagle-talon': 'Crit', 'focus-croak': 'Crit',
  'poison-dart': 'Poison', 'venom-fang': 'Poison', 'toxic-cloud': 'Poison',
  'lily-pad-shield': 'Tank', 'bark-armor': 'Tank', 'shell-bash': 'Tank',
  'saw-blade': 'Saws', 'buzz-saw': 'Saws',
  'mirror-frog': 'Combos', 'double-croak': 'Combos',
  'healing-pond': 'Healing', 'lotus-bloom': 'Healing', 'spring-rain': 'Healing', 'leech': 'Healing',
  'gold-rush': 'Gold', 'pickpocket': 'Gold',
  'stun-slime': 'Control', 'late-bloomer': 'Special', 'orbital-laser': 'Special', 'rotten-egg': 'Curse',
};
// Rarity: shown as a coloured glow and tag on the card, and sets how big its card-pack reveal is
const CARD_RARITY = {
  'Sticky Tongue': 'common', 'Tadpole Tackle': 'common',
  'Big Leap': 'rare', 'Poison Dart': 'rare', 'Lily Pad Shield': 'rare', 'Healing Pond': 'rare', 'Stun Slime': 'rare',
  'Croak Blast': 'epic', 'Leech': 'epic', 'Double Croak': 'epic', 'Saw Blade': 'epic',
  'Swamp King': 'legendary', 'Late Bloomer': 'legendary',
  'Eagle Talon': 'rare', 'Venom Fang': 'rare', 'Shell Bash': 'rare', 'Lotus Bloom': 'rare', 'Gold Rush': 'rare',
  'Focus Croak': 'epic', 'Toxic Cloud': 'epic', 'Bark Armor': 'epic', 'Buzz Saw': 'epic', 'Mirror Frog': 'epic',
  'Spring Rain': 'epic', 'Pickpocket': 'epic',
  'Rotten Egg': 'common',
  'Orbital Laser': 'mythical', // the only naturally obtainable mythical card
};
CARD_TYPES.forEach(c => c.rarity = CARD_RARITY[c.name] || 'common');
const NO_CARD = { name: 'Bare Hands', art: '✋', mult: 1, text: a => `${a} damage` }; // x1 so battles always end
// Saw Blades landing back to back chain: each saw in a row deals +50% more (x1, x1.5, x2, x2.5...)
const SAW_CHAIN_BONUS = 0.5;
// Match combos: wheels landing on the same card in one turn. 2 of a kind (PAIR) and 3 of a kind (JACKPOT)
// multiply that card's damage; cards without damage apply their gimmick again instead.
const MATCH_MULT = { 2: 1.5, 3: 3 };
const MAX_SPINS_PER_WHEEL = 6; // each of the 3 wheels can spin at most this many times a turn (Saw Blade re-spins count)
const LOADOUT_MIN = 3, LOADOUT_MAX = 5; // cards each player brings into a battle
const BATTLE_HP = 100; // starting max HP (upgradable per player)
const CRIT_CHANCE = 0.1, CRIT_MULT = 2; // starting crit: 10% chance per strike to deal double damage
const HP_SEGMENTS = 20; // health bar is split into this many sprite segments
const BASE_DAMAGE = 2; // every player's starting base damage stat (p.attack)

// Battle square: challenge the other frog; the winner takes coins from the loser
const BATTLE_SQUARES = [at(0, 2), at(7, 6), at(4, 11), at(14, 4), at(1, 9)];

// Enemy squares: fight a computer enemy of the difficulty you choose (same slot-machine battles)
const ENEMY_SQUARES = [at(3, 0), at(8, 10), at(1, 12), at(4, 5), at(3, 9), at(13, 2), at(12, 10), at(6, 14), at(8, 1), at(4, 7), at(14, 7)];
// Harder enemies hit harder and have more HP, but pay much more. After a win you answer a question
// (harder for harder enemies); answering fast multiplies the reward (×1 slow ... ×2 instant, wrong ×0.5).
// Loadouts are card names from CARD_TYPES.
const ENEMY_TIERS = [
  { key: 'easy', label: 'Easy', color: '#1e9e3a', name: 'Mosquito', art: '🦟', hp: 60, attack: 2, crit: 0.05,
    loadout: ['Tadpole Tackle', 'Tadpole Tackle', 'Sticky Tongue', 'Tadpole Tackle'], reward: 6, loss: 2, quiz: 0.1 },
  { key: 'medium', label: 'Medium', color: '#e0b000', name: 'Snapping Turtle', art: '🐢', hp: 100, attack: 3, crit: 0.1,
    loadout: ['Sticky Tongue', 'Big Leap', 'Tadpole Tackle', 'Poison Dart'], reward: 14, loss: 4, quiz: 0.4 },
  { key: 'hard', label: 'Hard', color: '#d46a20', name: 'Grey Heron', art: '🦩', hp: 150, attack: 4, crit: 0.12,
    loadout: ['Big Leap', 'Croak Blast', 'Stun Slime', 'Double Croak', 'Sticky Tongue'], reward: 28, loss: 7, quiz: 0.7 },
  { key: 'nightmare', label: 'Nightmare', color: '#8a1010', name: 'Swamp Serpent', art: '🐍', hp: 220, attack: 5, crit: 0.18,
    loadout: ['Swamp King', 'Croak Blast', 'Big Leap', 'Poison Dart', 'Double Croak'], reward: 55, loss: 12, quiz: 1 },
];
// Boss square: the Butcher Hog, a pig with a cleaver. Only found here, never on enemy squares.
const BOSS_SQUARES = [at(4, 12)];
// The boss's own attacks (not in the deck, so players never draw them)
const BOSS_CARDS = [
  { name: 'Cleaver Chop',   art: '🔪', mult: 6, rarity: 'epic', text: a => `${a * 6} damage` },
  { name: 'Bone Splitter',  art: '🦴', mult: 3, rarity: 'epic', gimmick: 'cleave', text: a => `Smash every shield, then ${a * 3} damage` },
  { name: 'Cleaver Flurry', art: '🔪', mult: 2, rarity: 'epic', gimmick: 'frenzy', text: a => `${a * 2} damage, strikes 3 times` },
  { name: 'Mud Wallow',     art: '🐖', mult: 0, rarity: 'epic', gimmick: 'wallow', text: a => `Heal ${a * 3} and gain a shield` },
  { name: 'Bacon Sizzle',   art: '🥓', mult: 2, rarity: 'epic', gimmick: 'poison', text: a => `${a * 2} damage + burns ${a} a turn for 3 turns` },
];
// Evolved enemies' own attacks (see ENEMY_EVOLUTIONS in progression.js). Players never draw these.
const EVOLVED_CARDS = [
  { name: 'Swarm Sting', art: '🦟', mult: 1, rarity: 'epic', evolved: true, gimmick: 'frenzy', text: a => `${a} damage, strikes 3 times` },
  { name: 'Blood Drain', art: '🩸', mult: 2, rarity: 'epic', evolved: true, gimmick: 'lifesteal', text: a => `${a * 2} damage and heals that much` },
  { name: 'Royal Proboscis', art: '👑', mult: 4, rarity: 'epic', evolved: true, gimmick: 'lifesteal', text: a => `${a * 4} damage and heals that much` },
  { name: 'Plague Swarm', art: '🦠', mult: 2, rarity: 'epic', evolved: true, gimmick: 'poison', text: a => `${a * 2} damage + poison ${a} a turn` },
  { name: 'Brood Wall', art: '🥚', mult: 0, rarity: 'epic', evolved: true, gimmick: 'armor', text: a => '+2 shields' },
  { name: 'Iron Shell Slam', art: '🛡️', mult: 0, rarity: 'epic', evolved: true, gimmick: 'bash', text: a => `Deals ${a * 2} damage per shield it has` },
  { name: 'Rust Snap', art: '🦷', mult: 3, rarity: 'epic', evolved: true, gimmick: 'cleave', text: a => `Smash every shield, then ${a * 3} damage` },
  { name: 'Dragon Breath', art: '🔥', mult: 5, rarity: 'epic', evolved: true, gimmick: 'poison', text: a => `${a * 5} damage + burns ${a} a turn` },
  { name: 'Ancient Carapace', art: '🐉', mult: 0, rarity: 'epic', evolved: true, gimmick: 'wallow', text: a => `Heal ${a * 3} and gain a shield` },
  { name: 'Lightning Beak', art: '⚡', mult: 4, rarity: 'epic', evolved: true, gimmick: 'stun', text: a => `${a * 4} damage + chance to stun` },
  { name: 'Gale Dive', art: '🌪️', mult: 2, rarity: 'epic', evolved: true, gimmick: 'frenzy', text: a => `${a * 2} damage, strikes 3 times` },
  { name: 'Phoenix Flame', art: '☄️', mult: 6, rarity: 'epic', evolved: true, gimmick: 'poison', text: a => `${a * 6} damage + burns ${a} a turn` },
  { name: 'Rebirth Feather', art: '🪶', mult: 0, rarity: 'epic', evolved: true, gimmick: 'wallow', text: a => `Heal ${a * 3} and gain a shield` },
  { name: 'Three-Headed Bite', art: '🐍', mult: 3, rarity: 'epic', evolved: true, gimmick: 'frenzy', text: a => `${a * 3} damage, strikes 3 times` },
  { name: 'Hydra Venom', art: '🧪', mult: 2, rarity: 'epic', evolved: true, gimmick: 'venomfang', text: a => `${a * 2} damage, double if you're poisoned` },
  { name: 'Toxic Spit', art: '💚', mult: 2, rarity: 'epic', evolved: true, gimmick: 'poison', text: a => `${a * 2} damage + poison ${a} a turn` },
  { name: 'Tidal Crush', art: '🌊', mult: 8, rarity: 'epic', evolved: true, gimmick: 'cleave', text: a => `Smash every shield, then ${a * 8} damage` },
  { name: 'Abyssal Maw', art: '🦈', mult: 5, rarity: 'epic', evolved: true, gimmick: 'lifesteal', text: a => `${a * 5} damage and heals that much` },
  { name: 'Meat Hook', art: '🪝', mult: 4, rarity: 'epic', evolved: true, gimmick: 'stun', text: a => `${a * 4} damage + chance to stun` },
  { name: 'Iron Cleaver', art: '⚔️', mult: 7, rarity: 'epic', evolved: true, gimmick: 'cleave', text: a => `Smash every shield, then ${a * 7} damage` },
  { name: 'Royal Slam', art: '👑', mult: 8, rarity: 'epic', evolved: true, gimmick: 'cleave', text: a => `Smash every shield, then ${a * 8} damage` },
  { name: 'Tusk Frenzy', art: '🐗', mult: 3, rarity: 'epic', evolved: true, gimmick: 'frenzy', text: a => `${a * 3} damage, strikes 3 times` },
  { name: 'Royal Feast', art: '🍖', mult: 0, rarity: 'epic', evolved: true, gimmick: 'wallow', text: a => `Heal ${a * 3} and gain a shield` },
];
const BOSS_TIER = { key: 'boss', label: 'BOSS', color: '#c2185b', name: 'Butcher Hog', art: '🐷', weapon: '🔪',
  hp: 400, attack: 6, crit: 0.15, reward: 120, loss: 20, quiz: 1,
  loadout: ['Cleaver Chop', 'Bone Splitter', 'Cleaver Flurry', 'Mud Wallow', 'Bacon Sizzle', 'Cleaver Chop'] };

// Artifacts: beating an enemy gives you its artifact, and every further win against that enemy levels it
// up, making its effect stronger. Keyed by the tier's key; the value stored per player is the level.
const ARTIFACTS = {
  easy:      { name: 'Mosquito Proboscis', art: '🦟', desc: n => `Heal ${+(mosquitoHeal(n) * 100).toFixed(1)}% of the damage you deal` },
  medium:    { name: 'Turtle Shell',       art: '🐢', desc: n => `Start every battle with ${turtleShields(n)} shield${turtleShields(n) === 1 ? '' : 's'}` +
                 (turtleHp(n) ? ` and +${turtleHp(n)} HP` : '') },
  hard:      { name: 'Heron Feather',      art: '🪶', desc: n => `+${n * 10}% crit chance in battle` },
  boss:      { name: 'Butcher\'s Cleaver', art: '🔪', desc: n => `+${n * 2} base damage in battle` },
  nightmare: { name: 'Serpent Fang',       art: '🐍', desc: n => `Foes start poisoned: ${n}× your damage a turn for 3 turns` },
  // Ice Lake enemies (a tier's `artifact` key in regions.js picks its drop; evolved forms drop the same one)
  moth:      { name: 'Frost Moth Wings',   art: '🦋', desc: n => `${Math.round(mothDodge(n) * 100)}% chance to dodge a hit completely` },
  penguin:   { name: 'Penguin Belly',      art: '🐧', desc: n => `Your first hit of every battle deals +${n * 50}% damage` },
  owl:       { name: 'Owl Monocle',        art: '🦉', desc: n => `+${n * 0.25}× crit damage in battle` },
  wolf:      { name: 'Wolf Pelt',          art: '🐺', desc: n => `Below half HP you deal +${n * 15}% damage` },
  walrus:    { name: 'Walrus Tusk',        art: '🦭', desc: n => `Each of your hits has a ${n * 10}% chance to freeze the foe solid` },
  // Volcano enemies
  beetle:    { name: 'Ember Carapace',     art: '🪲', desc: n => `When a shield blocks a hit, the attacker catches fire (${n}× your damage a turn)` },
  lizard:    { name: 'Lizard Tail',        art: '🦎', desc: n => `Once per battle, survive a knockout with ${Math.round(lizardSave(n) * 100)}% HP` },
  hawk:      { name: 'Fire Feather',       art: '🦅', desc: n => `Each of your hits has a ${n * 15}% chance to set the foe on fire` },
  golem:     { name: 'Golem Core',         art: '🗿', desc: n => `Take ${Math.round(golemGuard(n) * 100)}% less damage from every hit` },
  dragon:    { name: 'Dragon Scale',       art: '🐉', desc: n => `+${n * 15} HP and +${n} base damage in battle` },
};
// Level curves for the Ice Lake / Volcano artifacts (capped so they never get silly)
const mothDodge = n => Math.min(0.4, n * 0.08), lizardSave = n => Math.min(0.5, n * 0.1), golemGuard = n => Math.min(0.4, n * 0.08);
// Which artifact an enemy drops (the Swamp's are keyed by difficulty; the other regions name their own)
const artifactKey = tier => tier.artifact || tier.key;
const artifactCount = (p, key) => (p.artifacts && p.artifacts[key]) || 0;
// Mosquito: 15% at Lv 1, then +20% of its current value each level (15%, 18%, 21.6%...)
const mosquitoHeal = n => n ? 0.15 * 1.2 ** (n - 1) : 0;
// Turtle: 1 shield, +5 battle HP per level after the first, and a second shield from Lv 5
const turtleShields = n => n >= 5 ? 2 : n ? 1 : 0;
const turtleHp = n => Math.max(0, n - 1) * 5;
// Build an enemy fighter from a tier (looks like a player to the battle code)
function makeEnemy(tier) {
  tier = scaleTier(tier); // monsters grow stronger with the threat level (progression.js)
  return {
    enemy: true, boss: tier.key === 'boss', tier, name: `${tier.art}${tier.weapon || ''} ${tier.name}`, maxHp: tier.hp, attack: tier.attack,
    critChance: tier.crit, critMult: 2, coins: 0, hand: [], startShield: tier.startShield || 0, // evolved enemies start shielded
    element: tier.element, // Ice Lake / Volcano enemies: 'frost' or 'fire' (themes their shields and effects)
    loadout: tier.loadout.map(n => [...CARD_TYPES, ...BOSS_CARDS, ...EVOLVED_CARDS, ...REGION_CARDS].find(c => c.name === n)),
  };
}

// Fusion squares: move one card's gimmick onto another card (each card can carry one extra gimmick)
const FUSE_SQUARES = [at(0, 4), at(8, 8), at(6, 15), at(14, 3)];
// Rarity Forge squares: upgrade one card's rarity (the only way to get MYTHICAL cards)
// Hazard tiles (the Ice Lake's ice and the Volcano's lava; the Swamp has none). Filled by regions.js.
const HAZARD_SQUARES = [];
// Enemy-only attacks for the Ice Lake and Volcano (regions.js)
const REGION_CARDS = [];
// Mystery "?" tiles and the two new minigames (mystery.js, memory.js, lilyhop.js)
const MYSTERY_SQUARES = [at(1, 0), at(8, 0), at(0, 11), at(14, 2), at(6, 16), at(4, 1)];
const MEMORY_SQUARES = [at(7, 12), at(9, 10)];
const HOP_SQUARES = [at(8, 6), at(1, 16)];
const FORGE_SQUARES = [at(0, 8), at(14, 5), at(4, 16)];
// Cup squares: watch a valuable card get hidden under a cup, follow the shuffle and pick the right cup to win it
const CUP_SQUARES = [at(7, 0), at(0, 10), at(10, 2), at(0, 1), at(9, 2), at(1, 13)];
// Fly squares: Frog Math Swarm. Catch number flies with your tongue to build the biggest number, then cash it in for coins
const FLY_SQUARES = [at(8, 5), at(5, 12), at(2, 16), at(4, 2), at(11, 10), at(6, 13)];
const FLY_START = 10, FLY_TIME = 20000; // starting number, round length (ms)
// Coins for a final number: the number divided by 10,000,000, rounded (0 to FLY_MAX_COINS)
const FLY_MAX_COINS = 250;
const ABS_PRICE = 20; // shop item: Absolute Value, used in Frog Math Swarm to make your score positive
const flyCoins = n => Math.min(FLY_MAX_COINS, Math.max(0, Math.round(n / 10000000)));
const CUP_LEVELS = [ // difficulty: how many cups and how many swaps (min 2 cups)
  { name: 'Easy', cups: 2, swaps: 6 },
  { name: 'Medium', cups: 3, swaps: 8 },
  { name: 'Hard', cups: 4, swaps: 11 },
  { name: 'Expert', cups: 5, swaps: 14 },
  // The only way to get the Orbital Laser: 5 cups shuffling much faster
  { name: 'ULTIMATE', cups: 5, swaps: 18, speed: 0.55, minMs: 130, prize: 'Orbital Laser', ultimate: true },
];
const CUP_PRIZE = 'Swamp King'; // the card you win: this one boosted, with a random fused gimmick
const CUP_BOOST = 2;             // extra damage multiplier on the prize
// How a fused (extra) gimmick is described on the card it was added to
const EXTRA_TEXT = {
  poison: a => `poison ${a}/turn`,
  stun: () => 'stun',
  shield: () => '+1 shield',
  heal: a => `heal ${a * 2}`,
  double: () => 'strikes twice',
  leech: () => 'leech',
  saw: () => 'spin again',
  focus: () => '+50% crit this turn',
  venomfang: () => 'double vs poisoned',
  plague: () => 'doubles poison',
  bash: a => `${a * 2} per shield`,
  armor: () => '+2 shields',
  mirror: () => 'copies the previous wheel',
  lifesteal: () => 'lifesteal',
  regen: a => `regen ${a}`,
  loot: () => '+3 coins',
  steal: () => 'steal 2 coins',
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

// Solo mode (chosen on the start menu): only Player 1 plays, battle squares become enemy fights
let SOLO = false;
let turnCount = 1;

const players = [
  { name: 'Player 1', pos: 0, cls: 'p1', angle: 0, coins: 10, hand: [] },
  { name: 'Player 2', pos: at(8, 12), cls: 'p2', angle: 0, coins: 10, hand: [] },
];
// Each player's stats (all upgradable in the shop)
players.forEach(p => Object.assign(p, {
  maxHp: BATTLE_HP,        // battle health
  attack: BASE_DAMAGE,     // base damage (cards multiply this)
  critChance: CRIT_CHANCE, // chance per strike to crit
  critMult: CRIT_MULT,     // crit damage multiplier
  luck: 0,                 // chance your die roll is nudged onto a special tile
  moneyMult: 1,            // coins you gain are multiplied by this
  levels: {},              // upgrade levels bought, per stat
  artifacts: {},           // artifacts collected from enemies: tier key -> level
  charms: {},              // charms bought in the shop: key -> copies (see js/charms.js)
}));

// Shop upgrades: each buy adds `step` to a stat. Price grows exponentially: base × growth^level.
const UPGRADE_GROWTH = 1.8;
const UPGRADES = [
  { key: 'maxHp',      name: 'Health',      icon: '❤️', step: 10,   base: 4, int: true, show: v => `${v} HP` },
  { key: 'attack',     name: 'Base Damage', icon: '⚔️', step: 1,    base: 5, int: true, show: v => `${v}` },
  { key: 'critChance', name: 'Crit Chance', icon: '🎯', step: 0.05, base: 4, max: 1, show: v => `${Math.round(v * 100)}%` },
  { key: 'critMult',   name: 'Crit Damage', icon: '💥', step: 0.5,  base: 4, show: v => `x${v}` },
  { key: 'luck',       name: 'Luck',        icon: '🍀', step: 0.1,  base: 5, max: 1, show: v => `${Math.round(v * 100)}%`,
    desc: 'Chance your roll lands you on a special tile' },
  { key: 'moneyMult',  name: 'Money',       icon: '💰', step: 0.25, base: 6, show: v => `x${v}`,
    desc: 'Multiplies every coin you gain, including selling cards' },
];
// Upgrade tree: three branches from the frog at the root. A node unlocks once the node above it
// (`requires`) has at least one level.
const UPGRADE_TREE = [
  { name: 'Combat',   icon: '⚔️', color: '#d42020', nodes: ['attack', 'critChance', 'critMult'] },
  { name: 'Survival', icon: '❤️', color: '#1e9e3a', nodes: ['maxHp'] },
  { name: 'Fortune',  icon: '💰', color: '#e0a800', nodes: ['moneyMult', 'luck'] },
];
const upgradeReq = key => { // the node right above this one in its branch, if any
  const b = UPGRADE_TREE.find(b => b.nodes.includes(key)), i = b.nodes.indexOf(key);
  return i > 0 ? UPGRADES.find(u => u.key === b.nodes[i - 1]) : null;
};
const upgradePrice = (p, u) => Math.round(u.base * UPGRADE_GROWTH ** (p.levels[u.key] || 0) * shopDiscount(p)); // Haggler perk
// Give a player coins, boosted by their Money stat. Returns how many they actually got.
function gainCoins(p, n) {
  const got = Math.round(n * p.moneyMult * (typeof isUnderdog === 'function' && isUnderdog(p) ? 1.25 : 1)); // underdog +25%
  if (got > 0 && typeof stat === 'function') stat(p, 'coins', got);
  p.coins += got;
  if (got > 0 && typeof questEvent === 'function') questEvent(p, 'coins', got);
  return got;
}
