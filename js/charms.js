// Charms: passive items bought in the shop that push a playstyle (crits, poison, tanking, saws,
// match combos, healing, gold). They stack up to `max`; each extra copy strengthens the effect.
// The battle code asks charmCount(player, key) at the moment each effect applies.

const CHARM_PRICE_GROWTH = 1.6; // each copy you own makes the next one cost more
const CHARMS = [
  // Crit
  { key: 'eagle',   style: 'Crit',   icon: '🦅', name: 'Eagle Eye',        base: 14, max: 1,
    desc: n => 'A card that lands on 2+ wheels in one turn (a match) ALWAYS crits' },
  { key: 'claws',   style: 'Crit',   icon: '🗡️', name: 'Sharpened Claws',  base: 8,  max: 3,
    desc: n => `+${n * 0.5 || 0.5}× crit damage` },
  { key: 'adren',   style: 'Crit',   icon: '💉', name: 'Adrenaline',       base: 9,  max: 3,
    desc: n => `+${(n || 1) * 25}% crit chance for your first 3 turns of every battle` },
  // Poison
  { key: 'toxic',   style: 'Poison', icon: '☠️', name: 'Toxic Glands',     base: 8,  max: 3,
    desc: n => `Poison you apply deals +${n || 1}× your damage stat per turn` },
  { key: 'linger',  style: 'Poison', icon: '🧫', name: 'Lingering Venom',  base: 7,  max: 3,
    desc: n => `Poison lasts ${(n || 1) * 2} extra turns` },
  { key: 'venom',   style: 'Poison', icon: '🐍', name: 'Venom Strike',     base: 10, max: 3,
    desc: n => `+${(n || 1) * 30}% damage against poisoned foes` },
  // Tank
  { key: 'stone',   style: 'Tank',   icon: '🪨', name: 'Stone Skin',       base: 8,  max: 3,
    desc: n => `Start every battle with ${n || 1} extra shield${n > 1 ? 's' : ''}` },
  { key: 'spikes',  style: 'Tank',   icon: '🌵', name: 'Spiked Shell',     base: 10, max: 3,
    desc: n => `When a shield blocks a hit, the attacker takes ${(n || 1) * 2}× your damage stat` },
  // Saws
  { key: 'grease',  style: 'Saws',   icon: '🛢️', name: 'Grease',           base: 9,  max: 3,
    desc: n => `Saw chains add +${(n || 1) * 50}% more per link` },
  { key: 'moment',  style: 'Saws',   icon: '🌀', name: 'Momentum',         base: 9,  max: 3,
    desc: n => `+${(n || 1) * 10}% damage for every re-spin so far this turn` },
  // Combos
  { key: 'lucky',   style: 'Combos', icon: '🍀', name: 'Lucky Coin',       base: 12, max: 3,
    desc: n => `Pairs deal ×${1.5 + (n || 1) * 0.5}, jackpots ×${3 + (n || 1)}` },
  { key: 'magnet',  style: 'Combos', icon: '🧲', name: 'Magnet',           base: 12, max: 3,
    desc: n => `${(n || 1) * 20}% chance each wheel after the first lands on a card already showing` },
  // Healing
  { key: 'bandage', style: 'Healing', icon: '🩹', name: 'Bandages',        base: 8,  max: 3,
    desc: n => `Heal ${(n || 1) * 8}% of your max HP at the start of each turn` },
  { key: 'honey',   style: 'Healing', icon: '🍯', name: 'Honey',           base: 7,  max: 3,
    desc: n => `Heals are +${(n || 1) * 50}% stronger` },
  // Gold
  { key: 'bounty',  style: 'Gold',   icon: '💰', name: 'Bounty Hunter',    base: 10, max: 3,
    desc: n => `+${(n || 1) * 30}% coins from winning battles` },
  // Elements: for the Ice Lake and Volcano monsters (their frostbite / burns, freezes / dazes, see battle.js)
  { key: 'scarf',   style: 'Elements', icon: '🧣', name: 'Wool Scarf',     base: 9,  max: 2,
    desc: n => `Frostbite hurts you ${(n || 1) * 40}% less` },
  { key: 'warmer',  style: 'Elements', icon: '♨️', name: 'Hand Warmer',    base: 10, max: 3,
    desc: n => `${(n || 1) * 25}% chance to thaw out instead of losing a turn frozen` },
  { key: 'icepack', style: 'Elements', icon: '🧊', name: 'Ice Pack',       base: 9,  max: 2,
    desc: n => `Burns hurt you ${(n || 1) * 40}% less` },
  { key: 'goggles', style: 'Elements', icon: '🥽', name: 'Smoke Goggles',  base: 10, max: 3,
    desc: n => `${(n || 1) * 25}% chance to shake off being dazed instead of losing a turn` },
  { key: 'hunter',  style: 'Elements', icon: '🏹', name: 'Monster Hunter', base: 12, max: 3,
    desc: n => `+${(n || 1) * 15}% damage against evolved monsters` },
];
const CHARM_STYLE_COLORS = { Crit: '#ffd23f', Poison: '#5fd13a', Tank: '#6aa8ff', Saws: '#c0c8d0', Combos: '#ff5d8a', Healing: '#3cdc8c', Gold: '#e0a800', Elements: '#7ae0ff' };
// How much of a frostbite / burn tick a fighter takes (Wool Scarf, Ice Pack)
const dotResist = f => 1 - 0.4 * charmCount(f.p, f.dotKind === 'frost' ? 'scarf' : f.dotKind === 'fire' ? 'icepack' : '');
// Chance to shake off a frozen / dazed turn (Hand Warmer, Smoke Goggles)
const stunShrug = f => 0.25 * charmCount(f.p, f.stunKind === 'frost' ? 'warmer' : f.stunKind === 'fire' ? 'goggles' : '');
const charmCount = (p, key) => (p && p.charms && p.charms[key]) || 0;
const charmPrice = (p, c) => Math.round(c.base * CHARM_PRICE_GROWTH ** charmCount(p, c.key) * shopDiscount(p)); // Haggler perk
