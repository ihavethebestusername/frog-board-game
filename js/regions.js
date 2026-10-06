// Regions: the adventure goes Swamp → Ice Lake → Volcano. Each region has its own board layout, look,
// weather, hazard tiles, enemies and boss. Complete enough laps of a region to unlock its boss (see
// LAPS_TO_UNLOCK in progression.js); beat the boss and everyone travels to the next region.
// Beating the Volcano's boss wins the game.

// ---------- Enemy-only attacks for the new regions ----------
// Every Ice Lake and Volcano enemy has its own cards, and each of its two evolutions adds two more of its
// own (an evolved form keeps some of its earlier cards). Players never draw these. Each card's animation
// lives in js/fx/ice-*.js / js/fx/volcano-*.js, keyed by the card's slug.
// `element` themes the battle text and effects: frostbite / frozen solid / ice shields for 'frost',
// burns / dazed / magma shields for 'fire' (see ELEMENTS below and battleFx in card-fx.js).
const addRegionCards = (region, element, rarity, list) => list.forEach(([name, art, mult, gimmick, text]) =>
  REGION_CARDS.push({ name, art, mult, ...(gimmick ? { gimmick } : {}), rarity, evolved: true, region, element, text }));
const pctStun = () => Math.round(STUN_CHANCE * 100);
// Ice Lake
addRegionCards('ice', 'frost', 'rare', [
  // Snow Moth
  ['Wing Gust',       '🌬️', 3, null,        a => `${a * 3} damage`],
  ['Snowflake Swirl', '❄️', 2, 'frenzy',    a => `${a * 2} damage, strikes 3 times`],
  ['Frost Dust',      '💠', 1, 'stun',      a => `${a} damage + ${pctStun()}% chance to freeze you solid`],
  // Ice Penguin
  ['Belly Slide',     '🛷', 4, null,        a => `${a * 4} damage`],
  ['Snowball Volley', '☃️', 2, 'frenzy',    a => `${a * 2} damage, strikes 3 times`],
  ['Snow Fort',       '🏰', 0, 'armor',     () => '+2 shields'],
  // Polar Owl
  ['Silent Swoop',    '🦉', 5, null,        a => `${a * 5} damage`],
  ['Blizzard',        '🌨️', 3, 'poison',    a => `${a * 3} damage + frostbite ${a} a turn for 3 turns`],
  ['Deep Freeze',     '🥶', 2, 'stun',      a => `${a * 2} damage + ${pctStun()}% chance to freeze you solid`],
  // Frost Wolf
  ['Frost Bite',      '🐺', 3, 'stun',      a => `${a * 3} damage + ${pctStun()}% chance to freeze you solid`],
  ['Frost Claw',      '🐾', 6, 'cleave',    a => `Smash every shield, then ${a * 6} damage`],
  ['Pack Hunt',       '🌲', 2, 'frenzy',    a => `${a * 2} damage, strikes 3 times`],
]);
addRegionCards('ice', 'frost', 'epic', [
  // Blizzard Moth
  ['Hypno Wings',     '👁️', 4, 'stun',      a => `${a * 4} damage + ${pctStun()}% chance to hypnotize you (skip a turn)`],
  ['Frost Cocoon',    '🕸️', 0, 'armor',     () => '+2 shields'],
  // Penguin Commander
  ['Torpedo Dive',    '🚀', 6, null,        a => `${a * 6} damage`],
  ['Huddle Up',       '🫂', 0, 'heal',      a => `Heal ${a * 2}`],
  // Frostfeather Owl
  ['Quill Volley',    '🏹', 2, 'frenzy',    a => `${a * 2} damage, strikes 3 times`],
  ['Owl Eyes',        '👀', 0, 'focus',     () => '+50% crit chance for the rest of its turn'],
  // Frostfang Alpha
  ['Moon Howl',       '🌕', 0, 'double',    () => 'Its next attack strikes one extra time'],
  ['Avalanche Pounce', '⛰️', 8, null,       a => `${a * 8} damage`],
  // Glacier Walrus (boss)
  ['Glacier Slam',    '🏔️', 7, 'cleave',    a => `Smash every shield, then ${a * 7} damage`],
  ['Tusk Spear',      '🔱', 5, 'lifesteal', a => `${a * 5} damage and heals that much`],
  ['Icicle Barrage',  '🧊', 2, 'frenzy',    a => `${a * 2} damage, strikes 3 times`],
  ['Fish Feast',      '🐟', 0, 'wallow',    a => `Heal ${a * 3} and gain a shield`],
  ['Arctic Breath',   '💨', 3, 'poison',    a => `${a * 3} damage + frostbite ${a} a turn for 3 turns`],
]);
addRegionCards('ice', 'frost', 'legendary', [
  // Aurora Moth Queen
  ['Moonbeam',        '🌙', 6, null,        a => `${a * 6} damage`],
  ['Aurora Heal',     '🌌', 0, 'wallow',    a => `Heal ${a * 3} and gain a shield`],
  // Emperor Penguin
  ['Penguin March',   '🥁', 2, 'frenzy',    a => `${a * 2} damage, strikes 3 times`],
  ['Ice Fishing',     '🎣', 4, 'lifesteal', a => `${a * 4} damage and heals that much`],
  // Snow Owl Sage
  ['Crystal Spell',   '🔮', 4, 'venomfang', a => `${a * 4} damage, double if you have frostbite`],
  ['Frost Nova',      '💎', 6, 'cleave',    a => `Smash every shield, then ${a * 6} damage`],
  // Winter Fenrir
  ['Wolf Spirit',     '👻', 5, 'lifesteal', a => `${a * 5} damage and heals that much`],
  ['Moon Eater',      '🌑', 8, 'cleave',    a => `Smash every shield, then ${a * 8} damage`],
  // Walrus Warlord, Glacier Titan (boss evolutions)
  ['Iceberg Toss',    '🗻', 9, null,        a => `${a * 9} damage`],
  ['Ice Quake',       '💥', 4, 'stun',      a => `${a * 4} damage + ${pctStun()}% chance to freeze you solid`],
  ['Walrus Stampede', '🦭', 3, 'frenzy',    a => `${a * 3} damage, strikes 3 times`],
  ['Absolute Zero',   '🌡️', 9, 'cleave',    a => `Smash every shield, then ${a * 9} damage`],
]);
// Volcano
addRegionCards('volcano', 'fire', 'rare', [
  // Ember Beetle
  ['Ember Spit',      '🔥', 2, 'poison',    a => `${a * 2} damage + burns ${a} a turn for 3 turns`],
  ['Horn Charge',     '🪲', 4, null,        a => `${a * 4} damage`],
  ['Cinder Shell',    '🌰', 0, 'shield',    () => '+1 shield'],
  // Lava Lizard
  ['Lava Whip',       '🦎', 4, 'cleave',    a => `Smash every shield, then ${a * 4} damage`],
  ['Flame Tongue',    '🌶️', 3, 'poison',    a => `${a * 3} damage + burns ${a} a turn for 3 turns`],
  ['Heat Bask',       '♨️', 0, 'heal',      a => `Heal ${a * 2}`],
  // Fire Hawk
  ['Blazing Dive',    '🌠', 5, null,        a => `${a * 5} damage`],
  ['Fire Tornado',    '🌀', 2, 'frenzy',    a => `${a * 2} damage, strikes 3 times`],
  ['Ash Cloud',       '🌫️', 2, 'stun',      a => `${a * 2} damage + ${pctStun()}% chance to blind you for a turn`],
  // Magma Golem
  ['Boulder Fist',    '👊', 7, null,        a => `${a * 7} damage`],
  ['Quake Stomp',     '🦶', 4, 'stun',      a => `${a * 4} damage + ${pctStun()}% chance to knock you flat for a turn`],
  ['Magma Armor',     '🪨', 0, 'armor',     () => '+2 shields'],
]);
addRegionCards('volcano', 'fire', 'epic', [
  // Bombardier Beetle
  ['Bombardier Blast', '🧨', 2, 'frenzy',   a => `${a * 2} damage, strikes 3 times`],
  ['Mandible Crunch', '✂️', 5, 'lifesteal', a => `${a * 5} damage and heals that much`],
  // Magma Salamander
  ['Flame Wheel',     '🎡', 6, null,        a => `${a * 6} damage`],
  ['Tail Regrow',     '♻️', 0, 'regen',     a => `Heals ${a} at the start of its next 3 turns`],
  // Inferno Hawk
  ['Molten Talons',   '⚜️', 6, 'lifesteal', a => `${a * 6} damage and heals that much`],
  ['Heat Mirage',     '🏜️', 0, 'armor',     () => '+2 shields'],
  // Obsidian Golem
  ['Obsidian Claw',   '🖤', 6, 'lifesteal', a => `${a * 6} damage and heals that much`],
  ['Molten Heart',    '❤️‍🔥', 0, 'wallow',    a => `Heal ${a * 3} and gain a shield`],
  // Inferno Dragon (boss)
  ['Dragon Inferno',  '🐲', 8, 'poison',    a => `${a * 8} damage + burns ${a} a turn for 3 turns`],
  ['Meteor Strike',   '☄️', 9, 'cleave',    a => `Smash every shield, then ${a * 9} damage`],
  ['Dragon Wings',    '🦇', 2, 'frenzy',    a => `${a * 2} damage, strikes 3 times`],
  ['Treasure Hoard',  '💰', 0, 'wallow',    a => `Heal ${a * 3} and gain a shield`],
  ['Tail Swipe',      '🦖', 6, null,        a => `${a * 6} damage`],
]);
addRegionCards('volcano', 'fire', 'legendary', [
  // Scarab King
  ['Solar Flare',     '☀️', 5, 'poison',    a => `${a * 5} damage + burns ${a} a turn for 3 turns`],
  ['Sunrise Rebirth', '🌅', 0, 'wallow',    a => `Heal ${a * 3} and gain a shield`],
  // Lava Basilisk
  ['Basilisk Gaze',   '🧿', 4, 'stun',      a => `${a * 4} damage + ${pctStun()}% chance to turn you to stone for a turn`],
  ['Magma Geyser',    '⛲', 6, 'cleave',    a => `Smash every shield, then ${a * 6} damage`],
  // Cinder Roc
  ['Cinder Storm',    '⛈️', 8, 'cleave',    a => `Smash every shield, then ${a * 8} damage`],
  ['Ember Rain',      '🎇', 4, 'poison',    a => `${a * 4} damage + burns ${a} a turn for 3 turns`],
  // Volcano Titan
  ['Eruption',        '🌋', 9, 'cleave',    a => `Smash every shield, then ${a * 9} damage`],
  ['Lava Flood',      '🫕', 5, 'poison',    a => `${a * 5} damage + burns ${a} a turn for 3 turns`],
  // Twin-Headed Dragon, Dragon Emperor (boss evolutions)
  ['Twin Inferno',    '🐉', 7, 'poison',    a => `${a * 7} damage + burns ${a} a turn for 3 turns`],
  ['Ember Scales',    '🔶', 0, 'armor',     () => '+2 shields'],
  ['Supernova',       '🌟', 10, 'cleave',   a => `Smash every shield, then ${a * 10} damage`],
  ['Dragon Roar',     '🔊', 5, 'stun',      a => `${a * 5} damage + ${pctStun()}% chance to terrify you into skipping a turn`],
]);
// Super moves: each final form's signature attack (and the bosses' evolved ones). Like the Orbital Laser, they
// get a cinematic before they strike (superMoveFx in js/fx/region-kit.js) and the mythical card glow.
['Moonbeam', 'Penguin March', 'Frost Nova', 'Moon Eater', 'Iceberg Toss', 'Absolute Zero',
 'Solar Flare', 'Magma Geyser', 'Cinder Storm', 'Eruption', 'Twin Inferno', 'Supernova'].forEach(n =>
  Object.assign(REGION_CARDS.find(c => c.name === n), { superMove: true, rarity: 'mythical' }));
// How each element shows up in the battle text (status line, pop-ups)
const ELEMENTS = {
  frost: { dot: '❄️', dotName: 'Frostbite', stun: '🧊', stunned: 'frozen solid', shield: '🧊' },
  fire:  { dot: '🔥', dotName: 'Burn', stun: '💫', stunned: 'dazed', shield: '🪨' },
};

const tierBase = { easy: ['Easy', '#1e9e3a'], medium: ['Medium', '#e0b000'], hard: ['Hard', '#d46a20'], nightmare: ['Nightmare', '#8a1010'] };
const mkTier = (key, element, name, art, hp, attack, crit, loadout, reward, loss, quiz) =>
  ({ key, label: tierBase[key][0], color: tierBase[key][1], element, name, art, hp, attack, crit, loadout, reward, loss, quiz });
// An evolved form (see evolveTier in progression.js): new name, look, crit, starting shields and cards
const mkEvo = (name, art, crit, startShield, loadout) => ({ name, art, crit, startShield, loadout });

// ---------- The three regions ----------
const REGIONS = [
  { key: 'swamp', name: 'Swamp', icon: '🐸', weather: 'rain', hazard: null, fireflies: true,
    intro: 'The Swamp! Where every frog\'s adventure begins.',
    // Built by config.js at page load; its tiers/boss/evolutions are the originals (snapshotted below)
  },
  { key: 'ice', name: 'Ice Lake', icon: '🧊', weather: 'snow', hazard: 'ice', seed: 7,
    intro: 'Brrr! The <b>Ice Lake</b>. Watch out for <b>🧊 ice tiles</b>: land on one and you <b>slide</b> 1–3 extra squares! The monsters here are tougher, and the <b>Glacier Walrus</b> guards the way to the Volcano.',
    build() {
      path(line(0, 0, 14, 0), line(14, 1, 14, 16), line(13, 16, 0, 16), line(0, 15, 0, 0)); // shore loop
      path(line(7, 0, 7, 8));                  // top fork: across the frozen lake to the middle
      path(line(7, 8, 1, 8), [[0, 8]]);          // ...then west to the shore
      path(line(7, 8, 7, 16));                 // ...or south to the bottom shore
      path(line(14, 5, 10, 5), line(10, 6, 10, 12), line(11, 12, 14, 12)); // an icy loop off the east shore
    },
    p2Start: [14, 16], deckPos: [3, 4], coinRanges: [[3, 7], [4, 9], [6, 12]],
    tiers: [
      mkTier('easy', 'frost', 'Snow Moth', '🦋', 90, 3, 0.08, ['Wing Gust', 'Snowflake Swirl', 'Frost Dust', 'Wing Gust'], 10, 3, 0.3),
      mkTier('medium', 'frost', 'Ice Penguin', '🐧', 140, 4, 0.1, ['Belly Slide', 'Snowball Volley', 'Snow Fort', 'Belly Slide'], 20, 5, 0.5),
      mkTier('hard', 'frost', 'Polar Owl', '🦉', 200, 5, 0.15, ['Silent Swoop', 'Blizzard', 'Deep Freeze', 'Silent Swoop', 'Blizzard'], 36, 8, 0.75),
      mkTier('nightmare', 'frost', 'Frost Wolf', '🐺', 280, 6, 0.2, ['Frost Claw', 'Frost Bite', 'Pack Hunt', 'Frost Bite', 'Frost Claw'], 65, 14, 1),
    ],
    boss: { key: 'boss', label: 'BOSS', color: '#2a6ad1', element: 'frost', name: 'Glacier Walrus', art: '🦭', weapon: '🧊', hp: 560, attack: 7, crit: 0.18,
      reward: 150, loss: 25, quiz: 1, loadout: ['Glacier Slam', 'Tusk Spear', 'Arctic Breath', 'Fish Feast', 'Icicle Barrage', 'Glacier Slam'] },
    evolutions: {
      easy: [
        mkEvo('Blizzard Moth', '🌨️🦋', 0.12, 0, ['Hypno Wings', 'Snowflake Swirl', 'Wing Gust', 'Frost Cocoon', 'Hypno Wings']),
        mkEvo('Aurora Moth Queen', '👑🦋', 0.18, 1, ['Moonbeam', 'Hypno Wings', 'Aurora Heal', 'Snowflake Swirl', 'Moonbeam']),
      ],
      medium: [
        mkEvo('Penguin Commander', '🎖️🐧', 0.12, 1, ['Torpedo Dive', 'Snowball Volley', 'Belly Slide', 'Huddle Up', 'Torpedo Dive']),
        mkEvo('Emperor Penguin', '👑🐧', 0.15, 2, ['Penguin March', 'Ice Fishing', 'Torpedo Dive', 'Snow Fort', 'Penguin March', 'Torpedo Dive']),
      ],
      hard: [
        mkEvo('Frostfeather Owl', '❄️🦉', 0.18, 1, ['Quill Volley', 'Owl Eyes', 'Silent Swoop', 'Blizzard', 'Quill Volley']),
        mkEvo('Snow Owl Sage', '🔮🦉', 0.25, 1, ['Crystal Spell', 'Frost Nova', 'Blizzard', 'Quill Volley', 'Crystal Spell', 'Owl Eyes']),
      ],
      nightmare: [
        mkEvo('Frostfang Alpha', '❄️🐺', 0.24, 1, ['Avalanche Pounce', 'Moon Howl', 'Frost Claw', 'Pack Hunt', 'Frost Bite', 'Avalanche Pounce']),
        mkEvo('Winter Fenrir', '🌕🐺', 0.28, 2, ['Moon Eater', 'Wolf Spirit', 'Avalanche Pounce', 'Moon Howl', 'Frost Claw', 'Moon Eater']),
      ],
      boss: [
        mkEvo('Walrus Warlord', '⚔️🦭', 0.2, 1, ['Iceberg Toss', 'Ice Quake', 'Tusk Spear', 'Fish Feast', 'Glacier Slam', 'Iceberg Toss']),
        mkEvo('Glacier Titan', '👑🦭', 0.25, 2, ['Absolute Zero', 'Walrus Stampede', 'Iceberg Toss', 'Fish Feast', 'Ice Quake', 'Absolute Zero']),
      ],
    },
  },
  { key: 'volcano', name: 'Volcano', icon: '🌋', weather: 'embers', hazard: 'lava', seed: 13,
    intro: 'The <b>Volcano</b>, the final region! <b>🌋 Lava tiles</b> singe your coins when you hop over them, and landing on one sets you on fire for your next battle. Beat the <b>Inferno Dragon</b> at the top to win the game!',
    build() {
      path(line(0, 0, 10, 0), line(10, 1, 10, 4), line(11, 4, 14, 4), line(14, 5, 14, 16), line(13, 16, 4, 16),
           line(4, 15, 4, 12), line(3, 12, 0, 12), line(0, 11, 0, 0));        // the volcano's rim
      path(line(5, 0, 5, 8), line(6, 8, 13, 8), [[14, 8]]);                        // a bridge across the crater
      path(line(5, 8, 5, 14), [[4, 14]]);                                          // ...or down the lava falls
      path(line(14, 12, 8, 12), line(8, 11, 8, 9), [[8, 8]]);                      // the caldera ring
      path(line(0, 6, 3, 6), line(3, 5, 3, 1), [[3, 0]]);                          // a lava tube back to the top
    },
    p2Start: [14, 16], deckPos: [7, 2], coinRanges: [[4, 9], [6, 12], [8, 16]],
    tiers: [
      mkTier('easy', 'fire', 'Ember Beetle', '🪲', 130, 4, 0.1, ['Horn Charge', 'Ember Spit', 'Cinder Shell', 'Horn Charge'], 14, 4, 0.4),
      mkTier('medium', 'fire', 'Lava Lizard', '🦎', 190, 5, 0.12, ['Lava Whip', 'Flame Tongue', 'Heat Bask', 'Lava Whip'], 28, 7, 0.6),
      mkTier('hard', 'fire', 'Fire Hawk', '🦅', 260, 6, 0.18, ['Blazing Dive', 'Fire Tornado', 'Ash Cloud', 'Ash Cloud', 'Blazing Dive'], 48, 11, 0.85),
      mkTier('nightmare', 'fire', 'Magma Golem', '🗿', 380, 7, 0.22, ['Boulder Fist', 'Quake Stomp', 'Magma Armor', 'Boulder Fist', 'Quake Stomp'], 85, 18, 1),
    ],
    boss: { key: 'boss', label: 'FINAL BOSS', color: '#d42020', element: 'fire', name: 'Inferno Dragon', art: '🐉', weapon: '🔥', hp: 800, attack: 9, crit: 0.22,
      reward: 250, loss: 35, quiz: 1, loadout: ['Dragon Inferno', 'Meteor Strike', 'Dragon Wings', 'Treasure Hoard', 'Tail Swipe', 'Meteor Strike'] },
    evolutions: {
      easy: [
        mkEvo('Bombardier Beetle', '💥🪲', 0.14, 0, ['Bombardier Blast', 'Mandible Crunch', 'Ember Spit', 'Cinder Shell', 'Horn Charge']),
        mkEvo('Scarab King', '👑🪲', 0.2, 1, ['Solar Flare', 'Bombardier Blast', 'Sunrise Rebirth', 'Mandible Crunch', 'Solar Flare']),
      ],
      medium: [
        mkEvo('Magma Salamander', '🔥🦎', 0.14, 1, ['Flame Wheel', 'Lava Whip', 'Flame Tongue', 'Tail Regrow', 'Flame Wheel']),
        mkEvo('Lava Basilisk', '🧿🦎', 0.18, 1, ['Magma Geyser', 'Basilisk Gaze', 'Flame Wheel', 'Tail Regrow', 'Magma Geyser']),
      ],
      hard: [
        mkEvo('Inferno Hawk', '🔥🦅', 0.22, 1, ['Molten Talons', 'Fire Tornado', 'Heat Mirage', 'Blazing Dive', 'Molten Talons']),
        mkEvo('Cinder Roc', '⛈️🦅', 0.28, 1, ['Cinder Storm', 'Ember Rain', 'Molten Talons', 'Fire Tornado', 'Cinder Storm', 'Ash Cloud']),
      ],
      nightmare: [
        mkEvo('Obsidian Golem', '🖤🗿', 0.25, 1, ['Obsidian Claw', 'Boulder Fist', 'Molten Heart', 'Quake Stomp', 'Obsidian Claw', 'Boulder Fist']),
        mkEvo('Volcano Titan', '🌋🗿', 0.3, 2, ['Eruption', 'Lava Flood', 'Obsidian Claw', 'Molten Heart', 'Boulder Fist', 'Eruption']),
      ],
      boss: [
        mkEvo('Twin-Headed Dragon', '🐉🐉', 0.25, 1, ['Twin Inferno', 'Meteor Strike', 'Ember Scales', 'Dragon Wings', 'Twin Inferno', 'Meteor Strike']),
        mkEvo('Dragon Emperor', '👑🐉', 0.3, 2, ['Supernova', 'Twin Inferno', 'Dragon Roar', 'Treasure Hoard', 'Meteor Strike', 'Supernova']),
      ],
    },
  },
];
// Each Ice Lake / Volcano enemy drops its own artifact (ARTIFACTS in config.js); its evolutions drop the same one
const REGION_ARTIFACTS = { ice: ['moth', 'penguin', 'owl', 'wolf', 'walrus'], volcano: ['beetle', 'lizard', 'hawk', 'golem', 'dragon'] };
REGIONS.forEach(r => (REGION_ARTIFACTS[r.key] || []).forEach((a, i) => { (i < 4 ? r.tiers[i] : r.boss).artifact = a; }));
// The Swamp keeps everything config.js / progression.js defined
Object.assign(REGIONS[0], {
  tiers: ENEMY_TIERS.map(t => ({ ...t })), boss: { ...BOSS_TIER }, evolutions: { ...ENEMY_EVOLUTIONS },
  squares: { shop: [...SHOP_SQUARES], coins: { ...COIN_SQUARES }, cards: [...CARD_SQUARES], battle: [...BATTLE_SQUARES], enemy: [...ENEMY_SQUARES],
    boss: [...BOSS_SQUARES], fuse: [...FUSE_SQUARES], cups: [...CUP_SQUARES], flies: [...FLY_SQUARES], forge: [...FORGE_SQUARES],
    mystery: [...MYSTERY_SQUARES], memory: [...MEMORY_SQUARES], hop: [...HOP_SQUARES], hazard: [] },
});

let regionIndex = 0;
const REGION = () => REGIONS[regionIndex];
const isFinalRegion = () => regionIndex === REGIONS.length - 1;

// ---------- Placing a new region's squares ----------
// A small seeded random generator, so each region's layout of squares is the same every game
function seededRandom(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const REGION_SQUARE_COUNTS = { coins: 18, cards: 8, enemy: 11, battle: 4, shop: 3, fuse: 2, cups: 4, flies: 4, forge: 3,
  mystery: 6, memory: 2, hop: 2, hazard: 8 };
function autoPlaceSquares(region) {
  const rnd = seededRandom(region.seed), n = cells.length;
  const prevOf = cells.map(() => []);
  nextOf.forEach((outs, a) => outs.forEach(b => prevOf[b].push(a)));
  const p2 = at(...region.p2Start);
  const plain = new Set(cells.map((_, i) => i).filter(i => i !== 0 && i !== p2 && nextOf[i].length < 2));
  const type = {};
  // The boss sits as far from START as possible (by hops)
  const dist = new Array(n).fill(Infinity); dist[0] = 0;
  const queue = [0];
  while (queue.length) { const a = queue.shift(); nextOf[a].forEach(b => { if (dist[b] === Infinity) { dist[b] = dist[a] + 1; queue.push(b); } }); }
  const far = [...plain].sort((a, b) => dist[b] - dist[a]).slice(0, 5);
  const boss = far[Math.floor(rnd() * far.length)];
  type[boss] = 'boss'; plain.delete(boss);
  // Everything else: a shuffled bag of square types, avoiding two of the same type next to each other
  const bag = Object.entries(REGION_SQUARE_COUNTS).flatMap(([k, c]) => Array(c).fill(k)).sort(() => rnd() - 0.5);
  const tiles = [...plain].sort(() => rnd() - 0.5);
  for (const t of bag) {
    const ok = i => ![...nextOf[i], ...prevOf[i]].some(j => type[j] === t);
    const i = tiles.find(x => !type[x] && ok(x)) ?? tiles.find(x => !type[x]);
    if (i === undefined) break;
    type[i] = t;
  }
  const sq = { shop: [], coins: {}, cards: [], battle: [], enemy: [], boss: [], fuse: [], cups: [], flies: [], forge: [], mystery: [], memory: [], hop: [], hazard: [] };
  Object.entries(type).forEach(([i, t]) => {
    i = +i;
    if (t === 'coins') sq.coins[i] = region.coinRanges[Math.floor(rnd() * region.coinRanges.length)];
    else sq[t].push(i);
  });
  return sq;
}

// ---------- Region effects, loaded on demand ----------
// The Ice Lake / Volcano card effects are big (~0.5 MB), so they're only fetched when you first reach that
// region instead of at startup. Scripts keep their order. Resolves once they've all loaded.
const REGION_FX = { ice: ['fx/ice-1', 'fx/ice-2', 'fx/ice-boss'], volcano: ['fx/volcano-1', 'fx/volcano-2', 'fx/volcano-boss'] };
const regionFxLoads = {};
function loadRegionFx(key) {
  if (!REGION_FX[key]) return Promise.resolve();
  const stamp = typeof V !== 'undefined' ? '?v=' + V : '';
  const add = f => {
    if (regionFxLoads[f]) return regionFxLoads[f];
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = `css/${f}.css${stamp}`;
    document.head.appendChild(css);
    return regionFxLoads[f] = new Promise(res => {
      const js = document.createElement('script');
      js.src = `js/${f}.js${stamp}`; js.async = false; // run in order
      js.onload = js.onerror = res; // a missing file just means plainer effects, never a stuck game
      document.body.appendChild(js);
    });
  };
  return Promise.all(REGION_FX[key].map(add)); // (the shared kit, fx/region-kit, loads at startup)
}

// ---------- Loading a region ----------
const setList = (list, items) => { list.length = 0; list.push(...items); };
function loadRegion(i) {
  regionIndex = i;
  const r = REGION();
  loadRegionFx(r.key);
  if (r.build) { // rebuild the board graph in place (lots of code holds on to these arrays)
    cells.length = 0; nextOf.length = 0;
    Object.keys(tileIndex).forEach(k => delete tileIndex[k]);
    r.build();
    r.squares ||= autoPlaceSquares(r);
  }
  const s = r.squares;
  setList(SHOP_SQUARES, s.shop); setList(CARD_SQUARES, s.cards); setList(BATTLE_SQUARES, s.battle); setList(ENEMY_SQUARES, s.enemy);
  setList(BOSS_SQUARES, s.boss); setList(FUSE_SQUARES, s.fuse); setList(CUP_SQUARES, s.cups); setList(FLY_SQUARES, s.flies);
  setList(FORGE_SQUARES, s.forge); setList(MYSTERY_SQUARES, s.mystery); setList(MEMORY_SQUARES, s.memory); setList(HOP_SQUARES, s.hop);
  setList(HAZARD_SQUARES, s.hazard);
  Object.keys(COIN_SQUARES).forEach(k => delete COIN_SQUARES[k]);
  Object.assign(COIN_SQUARES, s.coins);
  // Enemies, boss and their evolutions
  setList(ENEMY_TIERS, r.tiers.map(t => ({ ...t })));
  Object.keys(BOSS_TIER).forEach(k => delete BOSS_TIER[k]);
  Object.assign(BOSS_TIER, r.boss);
  Object.keys(ENEMY_EVOLUTIONS).forEach(k => delete ENEMY_EVOLUTIONS[k]);
  Object.assign(ENEMY_EVOLUTIONS, r.evolutions);
  DECK_POS = r.deckPos ? [r.deckPos[0] * STEP + SIZE / 2, r.deckPos[1] * STEP + SIZE / 2] : DECK_POS;
  document.body.classList.remove(...REGIONS.map(x => 'region-' + x.key));
  document.body.classList.add('region-' + r.key);
  setWeather(r.weather);
}
// Boss gate: a region's boss only fights you once you've collected enough crowns in that region
const bossUnlocked = p => (p.regionLaps || 0) >= LAPS_TO_UNLOCK;
function sealedBoss(p) {
  const need = LAPS_TO_UNLOCK - (p.regionLaps || 0);
  banner(`🔒 The ${BOSS_TIER.name} is sealed! Complete ${need} more lap${need === 1 ? '' : 's'} of the ${REGION().name}`, 'lose');
  sfx('blocked', 0.7);
}

// ---------- Travelling to the next region ----------
async function advanceRegion(p) {
  const from = REGION(), to = REGIONS[regionIndex + 1];
  const el = document.createElement('div');
  el.className = 'tut-overlay region-travel';
  const card = shellyCard();
  card.classList.add('center');
  card.querySelector('.tut-name').textContent = `Shelly · ${from.icon} → ${to.icon}`;
  card.querySelector('.tut-demo').innerHTML = `<div class="region-route">${REGIONS.map((r, i) =>
    `<div class="region-stop${i < regionIndex + 1 ? ' done' : i === regionIndex + 1 ? ' next' : ''}"><span>${r.icon}</span><small>${r.name}</small></div>`).join('<div class="region-arrow">➜</div>')}</div>`;
  el.appendChild(card);
  document.body.appendChild(el);
  sfx('level_up'); confetti(80); shellyHop(card);
  typeText(card.querySelector('.tut-text'), `Amazing, ${p.name}! With the boss beaten, the path to the <b>${to.name}</b> is open. Everyone, pack your bags!`);
  await tutButtons(card, [{ label: `${to.icon} Travel to the ${to.name}!`, value: 1, primary: true }]);
  // Fly away: white-out, rebuild the world, land in the new region
  const white = fxSpawn(0, 0, { cls: 'fx-tint', ms: 1400, style: { background: '#fff' } });
  white?.animate([{ opacity: 0 }, { opacity: 1, offset: 0.4 }, { opacity: 1, offset: 0.6 }, { opacity: 0 }], { duration: 1400, fill: 'forwards' });
  sfx('celebrate');
  await sleep(560);
  el.remove();
  clearTraps(); clearTreasure();
  if (swampEvent) { swampEvent.end?.(); swampEvent = null; swampLeft = 0; setBoardTint(null); }
  loadRegion(regionIndex + 1);
  buildBoard();
  regionRollStart = rollsTotal; threatBonus = 0; evolveBonus = 0; // threat and evolution restart for the new region
  players.forEach((q, i) => {
    q.pos = i === 0 ? 0 : at(...REGION().p2Start);
    q.regionLaps = 0; q.lapsSinceBoss = 0; q.bossHunting = false;
    faceNext(q);
  });
  if (REGION().key !== 'swamp') stopRainSound();
  render();
  await sleep(700);
  banner(`${to.icon} ${to.name.toUpperCase()}${isFinalRegion() ? ': THE FINAL REGION' : ''}`, 'legendary');
  // Shelly explains the new region
  const el2 = document.createElement('div');
  el2.className = 'tut-overlay';
  const card2 = shellyCard();
  card2.classList.add('center');
  card2.querySelector('.tut-name').textContent = `Shelly · ${to.icon} ${to.name}`;
  card2.querySelector('.tut-demo').innerHTML = `<div class="region-foes">${REGION().tiers.map(t => `<span title="${t.name}">${t.art}</span>`).join('')}<span class="boss" title="${BOSS_TIER.name}">${BOSS_TIER.art}${BOSS_TIER.weapon}</span></div>`;
  el2.appendChild(card2);
  document.body.appendChild(el2);
  shellyHop(card2);
  typeText(card2.querySelector('.tut-text'), to.intro + ` Complete <b>${LAPS_TO_UNLOCK} laps</b> here to unlock the boss, and beat it for a <b>grand crown 👑</b>.`);
  await tutButtons(card2, [{ label: 'Let\'s go! 🐸', value: 1, primary: true }]);
  el2.remove();
}
document.body.classList.add('region-swamp');
