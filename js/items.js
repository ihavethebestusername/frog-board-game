// Battle items: gimmicky one-use items bought in the shop (🧪 Battle Items tab). In a battle, before each spin you
// can use items from your bag (the tray above the Spin button); each one is used up (perishes) when you use it.
// Their effects are wired into the battle in js/battle.js (look for `f.it`); this file holds the list, the shop
// tab, the tray, and the effects that are pure maths.

// Shop stock: STOCK_SIZE random items each turn; better items are rarer (and pricier). Re-rolling costs coins,
// a bit more each time; the stock (and the re-roll price) refreshes for free on your next turn.
const STOCK_SIZE = 4;
const ITEM_RARITY = {
  common:    { weight: 55, price: 5,  label: 'Common' },
  rare:      { weight: 28, price: 8,  label: 'Rare' },
  epic:      { weight: 13, price: 12, label: 'Epic' },
  legendary: { weight: 4,  price: 18, label: 'Legendary' },
};
const REROLL_BASE = 4, REROLL_STEP = 3;
const BATTLE_ITEMS = [
  { key: 'dice',      icon: '🎲', name: 'Loaded Dice',        rarity: 'epic',     desc: 'Your crit chance is set to 1%, but every crit deals +500% damage' },
  { key: 'berry',     icon: '💥', name: 'Desperation Berry',  rarity: 'common',   desc: 'The lower your HP, the more damage your cards deal (up to +150%)' },
  { key: 'shard',     icon: '👑', name: 'Crown Shard',        rarity: 'epic',     desc: 'The fewer grand crowns you have, the stronger you hit (+25% per missing crown)' },
  { key: 'sawdust',   icon: '🪚', name: 'Sawdust',            rarity: 'common',   desc: 'Every time a saw chain breaks, your saws get +50% stronger' },
  { key: 'bloodfly',  icon: '🩸', name: 'Bloodfly',           rarity: 'rare',     desc: 'Your lifesteal deals bonus damage instead of healing you' },
  { key: 'ticket',    icon: '🎰', name: 'Jackpot Ticket',     rarity: 'legendary',desc: 'Your next PAIR counts as a JACKPOT, if the third card is a different rarity' },
  { key: 'snail',     icon: '🐌', name: 'Snail Shell',        rarity: 'common',   desc: "You can't crit this turn or next, but each attack in them hits 25% harder than the last" },
  { key: 'goldfly',   icon: '🪰', name: 'Golden Fly',         rarity: 'rare',     desc: 'Every missed skill check feeds the Fly; after 3 misses it attacks for 8× your damage' },
  { key: 'egg',       icon: '☠️', name: 'Rotten Egg',         rarity: 'common',   desc: "The foe's poison grows every turn, but healing the foe washes all of it away" },
  { key: 'smart',     icon: '🧠', name: 'Smart Berry',        rarity: 'rare',     desc: 'The faster you answer a skill check, the more your next card is boosted (up to ×2)' },
  { key: 'glass',     icon: '⚔️', name: 'Glass Fang',         rarity: 'legendary',desc: 'Double damage, until you take any damage' },
  { key: 'copycat',   icon: '🃏', name: 'Copycat Card',       rarity: 'common',   desc: 'Your next card copies the card right before it' },
  { key: 'hot',       icon: '🔥', name: 'Hot Streak',         rarity: 'rare',     desc: 'Each right skill check in a row adds +25% damage; a wrong answer resets it' },
  { key: 'pond',      icon: '🪞', name: 'Mirror Pond',        rarity: 'rare',     desc: "Your next card becomes a copy of the enemy's most recent card" },
  { key: 'magnet',    icon: '🧲', name: 'Magnet Fly',         rarity: 'epic',     desc: 'Your next 3 spins are pulled onto your highest-damage card' },
  { key: 'greedy',    icon: '💰', name: 'Greedy Frog',        rarity: 'common',   desc: 'The more coins you have, the more damage (up to +100%), but losing costs 25% of your coins too' },
  { key: 'bullseye',  icon: '🎯', name: 'Bullseye Bug',       rarity: 'common',   desc: 'Your next attack ignores luck: it never crits or gets dodged, and deals its average damage' },
  { key: 'goo',       icon: '🧪', name: 'Mutation Goo',       rarity: 'common',   desc: 'A random card in your loadout mutates a random new gimmick for this battle' },
  { key: 'ice',       icon: '🧊', name: 'Ice Cube',           rarity: 'rare',     desc: 'This turn hits ×3, then your cards melt weaker every turn (down to ×0.5)' },
  { key: 'seed',      icon: '🌋', name: 'Volcano Seed',       rarity: 'rare',     desc: 'Each elemental card in a row hits +30% harder; a non-elemental card resets it' },
  { key: 'ghost',     icon: '👻', name: 'Ghost Fly',          rarity: 'epic',     desc: 'If your next hit would finish the foe, it leaves them at 1 HP and pays you a big coin bonus' },
  { key: 'stand',     icon: '🛡️', name: 'Last Stand',         rarity: 'rare',     desc: 'While below 10% HP, every strike is a guaranteed crit' },
  { key: 'legs',      icon: '🐸', name: 'Frog Legs',          rarity: 'epic',     desc: 'Your next 3 attack cards may strike twice (60%, then 40%, then 20% after each success)' },
  { key: 'mask',      icon: '🎭', name: 'Trick Mask',         rarity: 'epic',     desc: 'Your weakest loadout card becomes your strongest for this battle' },
  { key: 'rebound',   icon: '🔄', name: 'Rebound Shell',      rarity: 'rare',     desc: 'Reflect 30% of every hit you take back at the attacker' },
  { key: 'weakling',  icon: '📉', name: "Weakling's Revenge", rarity: 'rare',     desc: 'The stronger the foe is than you, the harder you hit (up to ×3)' },
  { key: 'overcharge', icon: '⚡', name: 'Overcharge',        rarity: 'legendary',desc: 'Your next card hits ×3, but your other wheels that turn are skipped' },
  { key: 'threes',    icon: '🃏', name: "Three's Company",    rarity: 'rare',     desc: 'Whenever all 3 wheels land on different cards: a bonus hit for 4× your damage' },
  { key: 'curse',     icon: '💎', name: 'Rarity Curse',       rarity: 'common',   desc: 'Rarer cards hit +15% harder per rarity step... but hurt you after you use them' },
  { key: 'flip',      icon: '🪙', name: 'Coin Flip',          rarity: 'common',   desc: 'Your next attack: 50% chance of ×0, 50% chance of ×5' },
];
const itemDef = k => BATTLE_ITEMS.find(i => i.key === k);
const itemOwned = (p, k) => (p && p.battleItems && p.battleItems[k]) || 0;
const RARITY_STEP = { common: 0, rare: 1, epic: 2, legendary: 3, mythical: 4 };

// ---------- Shop tab ----------
const itemPrice = (p, it) => Math.round(ITEM_RARITY[it.rarity].price * shopDiscount(p));
// One random item: first roll a rarity by weight, then an item of that rarity (no duplicates in one stock)
function rollStockItem(exclude) {
  const pool = BATTLE_ITEMS.filter(it => !exclude.includes(it.key));
  const weights = pool.map(it => ITEM_RARITY[it.rarity].weight / BATTLE_ITEMS.filter(x => x.rarity === it.rarity).length);
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  return pool.find((_, i) => (r -= weights[i]) < 0) || pool[0];
}
function restockItems(p) {
  p.itemStock = [];
  for (let i = 0; i < STOCK_SIZE; i++) p.itemStock.push({ key: rollStockItem(p.itemStock.map(x => x.key)).key, sold: false });
}
// Drawn with the shop's wooden shelves (shelfStore in shop.js): today's stock on the top shelf, your bag below,
// and a restock button under the info card.
let shelfFresh = true;   // new stock: items drop onto the shelf (only animates right after a restock)
function renderItemShop(page, p, buy) {
  if (!p.itemStock || p.stockRoll !== rollsTotal) { restockItems(p); p.stockRoll = rollsTotal; p.rerolls = 0; shelfFresh = true; } // free new stock each turn
  const rerollPrice = REROLL_BASE + REROLL_STEP * (p.rerolls || 0);
  const drop = shelfFresh; shelfFresh = false;
  const stock = p.itemStock.map(slot => {
    const it = itemDef(slot.key), n = itemOwned(p, it.key);
    return { icon: it.icon, name: it.name, desc: it.desc, price: itemPrice(p, it), color: RARITY_COLORS[it.rarity], chip: ITEM_RARITY[it.rarity].label,
      glow: it.rarity, owned: n, gone: slot.sold, buy: () => { p.battleItems = p.battleItems || {}; p.battleItems[it.key] = n + 1; slot.sold = true; } };
  });
  const wrap = shelfStore(page, p, buy, { id: 'gear', sign: '🧪 Battle Items', sub: 'new stock every turn', drop, shelves: [{ items: stock }],
    bag: { label: '🎒 Your bag (use them in battle before a spin; each one is used up)',
      items: BATTLE_ITEMS.filter(it => itemOwned(p, it.key)).map(it => ({ icon: it.icon, n: itemOwned(p, it.key), color: RARITY_COLORS[it.rarity], title: it.name })) } });
  const restock = document.createElement('button');
  restock.className = 'restock-btn';
  restock.disabled = p.coins < rerollPrice;
  restock.innerHTML = `🔔 Restock the shelf · ${COIN} ${rerollPrice}<small>new items, costs more each time this turn</small>`;
  restock.onclick = () => buy(rerollPrice, () => { p.rerolls = (p.rerolls || 0) + 1; restockItems(p); shelfFresh = true; shelfPicks.gear = 0; },
    restock, ['#ffd23f', '#b07cff', '#fff']);
  wrap.appendChild(restock);
}

// ---------- In battle: the item tray (shown before each of your spins) ----------
// One-shot items are "spent" once they've triggered (-1, or a counter run down to 0); spent items can be used again.
// The rest stay switched on for the whole battle once used, so using a second one would be a waste.
const ONE_SHOT = ['ticket', 'copycat', 'pond', 'ghost', 'bullseye', 'overcharge', 'flip', 'goldfly', 'mask', 'goo'];
const itemActive = (f, k) => k in f.it && (k === 'legs' ? f.it.legs > 0 : k === 'magnet' ? f.it.magnet > 0 : !(ONE_SHOT.includes(k) && f.it[k] < 0));
// Use an item from the bag: it perishes, its effect switches on. Returns lines to announce (loadout changes).
function useBattleItem(f, k) {
  f.p.battleItems[k]--;
  const it = f.it, out = [];
  it[k] = 0;
  if (k === 'legs') { it.legs = 3; it.legsChance = 0.6; }
  if (k === 'magnet') it.magnet = 3;
  if (k === 'ice') it.iceTurn = f.turns || 1;
  if (k === 'snail') { it.snailTurn = f.turns || 1; it.snailN = 0; }
  if (k === 'mask' && f.loadout.length > 1) { // Trick Mask: weakest card becomes the strongest
    const sorted = [...f.loadout].sort((a, b) => (a.mult || 0) - (b.mult || 0));
    const weak = sorted[0], strong = sorted[sorted.length - 1];
    if (weak !== strong) { f.loadout = f.loadout.map(c => c === weak ? strong : c); out.push(`🎭 ${weak.name} → ${strong.name}`); }
  }
  if (k === 'goo' && f.loadout.length) { // Mutation Goo: a random card gets a random new gimmick
    const base = f.loadout[Math.floor(Math.random() * f.loadout.length)];
    const pool = ['poison', 'stun', 'shield', 'heal', 'double', 'lifesteal', 'armor', 'focus', 'regen'].filter(g => g !== base.gimmick);
    const g = pool[Math.floor(Math.random() * pool.length)];
    const mutant = { ...base, gimmick: g, extra: undefined, name: base.name + ' 🧪', text(a) { return base.text.call(this, a) + ` · mutated: ${g}`; } };
    f.loadout = f.loadout.map(c => c === base ? mutant : c);
    out.push(`🧪 ${base.name} mutated: ${g}`);
  }
  if (k === 'mask' || k === 'goo') it[k] = -1; // instant: done right away
  return out;
}
// The tray element, or null if you have no items and none are switched on. onUse(key, lines) runs after each use.
function itemTray(f, onUse) {
  const bag = () => BATTLE_ITEMS.filter(it => itemOwned(f.p, it.key));
  if (!bag().length && !BATTLE_ITEMS.some(it => itemActive(f, it.key))) return null;
  const el = document.createElement('div');
  el.className = 'item-tray';
  let pick = null;
  const draw = () => {
    const on = BATTLE_ITEMS.filter(it => itemActive(f, it.key));
    const sel = pick && itemDef(pick);
    el.innerHTML = `<div class="tray-head">🎒 Items: tap one, then use it before you spin</div>
      <div class="tray-row">${bag().map(it => `<button class="tray-item${pick === it.key ? ' picked' : ''}${itemActive(f, it.key) ? ' active' : ''}" data-k="${it.key}" style="--rc:${RARITY_COLORS[it.rarity]}">
        <span class="tray-icon">${it.icon}</span><b>x${itemOwned(f.p, it.key)}</b></button>`).join('') || '<span class="tray-empty">Your bag is empty</span>'}</div>
      ${sel ? `<div class="tray-info" style="--rc:${RARITY_COLORS[sel.rarity]}"><div><b>${sel.icon} ${sel.name}</b><small>${sel.desc}</small></div>
        <button class="tray-use" ${itemActive(f, sel.key) || !itemOwned(f.p, sel.key) ? 'disabled' : ''}>${itemActive(f, sel.key) ? '✓ Active' : 'Use it'}</button></div>` : ''}
      ${on.length ? `<div class="tray-active">Active: ${on.map(it => `<span title="${it.name}">${it.icon}</span>`).join(' ')}</div>` : ''}`;
    el.querySelectorAll('.tray-item').forEach(b => b.onclick = () => { pick = pick === b.dataset.k ? null : b.dataset.k; sfx('card_pick', 1.1); draw(); });
    const use = el.querySelector('.tray-use');
    if (use) use.onclick = () => {
      const k = pick, lines = useBattleItem(f, k);
      sfx('buff');
      burst(use, [RARITY_COLORS[itemDef(k).rarity], '#fff'], 18, 0.8);
      if (!itemOwned(f.p, k)) pick = null;
      draw();
      onUse(k, lines);
    };
  };
  draw();
  return el;
}

// Damage multiplier from items for one strike. Uses up one-shot effects (Coin Flip, Bullseye, Smart Berry, Overcharge).
// Returns { mult, notes: [...formula parts], noCrit }.
function itemDamage(f, foe, card, firstStrike) {
  const it = f.it || {}, notes = [];
  let mult = 1;
  const add = (m, note) => { if (m !== 1) { mult *= m; notes.push(note); } };
  if ('berry' in it) add(1 + (1 - f.hp / f.maxHp) * 1.5, '💥 desperation');
  if ('shard' in it) add(1 + 0.25 * Math.max(0, GRAND_CROWNS - (f.p.crowns || 0)), '👑 shard');
  if ('glass' in it) add(2, '⚔️ glass fang x2');
  if ('greedy' in it) add(1 + Math.min(1, (f.p.coins || 0) / 100), '💰 greedy');
  if ('weakling' in it) {
    const ratio = ((foe.maxHp / Math.max(1, f.maxHp)) + (foe.p.attack / Math.max(1, f.p.attack))) / 2;
    add(Math.max(1, Math.min(3, ratio)), '📉 revenge');
  }
  if ('ice' in it) add(Math.max(0.5, 3 - 0.5 * ((f.turns || 1) - it.iceTurn)), '🧊 ice cube');
  if ('seed' in it && card && (card.region || card.element) && it.seed > 0) add(1 + 0.3 * it.seed, `🌋 seed x${it.seed}`);
  if ('hot' in it && it.hot > 0) add(1 + 0.25 * it.hot, `🔥 streak ${it.hot}`);
  if ('sawdust' in it && it.sawdust > 0 && card && (card.gimmick === 'saw' || card.extra === 'saw')) add(1 + 0.5 * it.sawdust, `🪚 sawdust x${it.sawdust}`);
  if ('curse' in it && card) add(1 + 0.15 * (RARITY_STEP[card.rarity || 'common'] || 0), '💎 rarity');
  const snailOn = 'snail' in it && (f.turns || 1) - it.snailTurn < 2;
  if (snailOn) { it.snailN = (it.snailN || 0) + 1; add(1 + 0.25 * (it.snailN - 1), `🐌 shell x${it.snailN}`); }
  let noCrit = snailOn;
  if (firstStrike) {
    if (it.smart > 0) { add(it.smart, '🧠 smart'); it.smart = 0; }
    if (it.overchargeNow) { add(3, '⚡ overcharge x3'); it.overchargeNow = false; }
    if (it.flip === 0) { const win = Math.random() < 0.5; add(win ? 5 : 0, win ? '🪙 HEADS x5' : '🪙 TAILS x0'); it.flip = -1; }
    if (it.bullseye === 0) { add(1 + f.p.critChance * (f.p.critMult - 1), '🎯 bullseye'); noCrit = true; it.bullseye = -1; it.bullseyeNow = true; }
  }
  return { mult, notes, noCrit };
}
