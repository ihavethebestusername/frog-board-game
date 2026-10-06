// Progression and strategy: XP levels with perk picks, bounty quests, a hand limit with card choices,
// laps and crowns (the win goal), and monsters that grow stronger as the game goes on (threat).
// Other files call into this one through: gainXp, questEvent, threatLevel, scaleTier, pickCards,
// progressHop, endTurnProgress and renderProgress.

// ---------- Threat: monsters get stronger every few rolls ----------
const THREAT_EVERY = () => SOLO ? 5 : 10; // rolls (counting both players) per threat level
const THREAT_HP = 0.15, THREAT_REWARD = 0.15; // per threat level: +15% enemy HP and rewards
let rollsTotal = 0;
let regionRollStart = 0; // threat, evolution and boss tiles restart in each new region (regions.js)
const regionRolls = () => rollsTotal - regionRollStart;
let threatBonus = 0, evolveBonus = 0; // extra levels forced from the Events menu (testing)
const threatLevel = () => Math.floor(regionRolls() / THREAT_EVERY()) + threatBonus + (typeof swampActive === 'function' && swampActive('moon') ? 1 : 0); // Full Moon: +1
// ---------- Enemy evolution: every few rolls all enemies evolve into new forms ----------
// (separate from threat: evolving changes WHO they are: new name, look, cards and abilities)
const EVOLVE_EVERY = () => SOLO ? 20 : 40;
const evolveStage = () => Math.floor(regionRolls() / EVOLVE_EVERY()) + evolveBonus;
// Per tier: the evolved forms (stage 1, stage 2). Later stages keep the last form and get tougher.
const ENEMY_EVOLUTIONS = {
  easy: [
    { name: 'Swarm Mosquito', art: '🦟🦟', loadout: ['Swarm Sting', 'Blood Drain', 'Swarm Sting', 'Sticky Tongue'], crit: 0.1, startShield: 0 },
    { name: 'Mosquito Queen', art: '👑🦟', loadout: ['Royal Proboscis', 'Plague Swarm', 'Brood Wall', 'Swarm Sting', 'Blood Drain'], crit: 0.15, startShield: 1 },
  ],
  medium: [
    { name: 'Iron Turtle', art: '🛡️🐢', loadout: ['Iron Shell Slam', 'Rust Snap', 'Lily Pad Shield', 'Rust Snap', 'Big Leap'], crit: 0.12, startShield: 1 },
    { name: 'Dragon Turtle', art: '🐉🐢', loadout: ['Dragon Breath', 'Ancient Carapace', 'Iron Shell Slam', 'Dragon Breath', 'Rust Snap'], crit: 0.15, startShield: 2 },
  ],
  hard: [
    { name: 'Storm Heron', art: '⚡🦩', loadout: ['Lightning Beak', 'Gale Dive', 'Lightning Beak', 'Croak Blast', 'Big Leap'], crit: 0.18, startShield: 1 },
    { name: 'Phoenix Heron', art: '🔥🦩', loadout: ['Phoenix Flame', 'Rebirth Feather', 'Gale Dive', 'Lightning Beak', 'Phoenix Flame'], crit: 0.25, startShield: 1 },
  ],
  nightmare: [
    { name: 'Swamp Hydra', art: '🐍🐍', loadout: ['Three-Headed Bite', 'Hydra Venom', 'Toxic Spit', 'Three-Headed Bite', 'Swamp King', 'Toxic Spit'], crit: 0.22, startShield: 1 },
    { name: 'Ancient Leviathan', art: '🌊🐉', loadout: ['Tidal Crush', 'Abyssal Maw', 'Three-Headed Bite', 'Hydra Venom', 'Toxic Spit', 'Tidal Crush'], crit: 0.28, startShield: 2 },
  ],
  boss: [
    { name: 'Iron Butcher', art: '🐗', loadout: ['Iron Cleaver', 'Meat Hook', 'Cleaver Flurry', 'Mud Wallow', 'Iron Cleaver', 'Bacon Sizzle'], crit: 0.2, startShield: 1 },
    { name: 'Hog King', art: '👑🐗', loadout: ['Royal Slam', 'Tusk Frenzy', 'Royal Feast', 'Iron Cleaver', 'Meat Hook', 'Royal Slam'], crit: 0.25, startShield: 2 },
  ],
};
const EVOLVE_HP = [1, 1.25, 1.5]; // extra HP per evolution stage (stage 3+ keeps adding +25%)
function evolveTier(tier) {
  const st = evolveStage(), forms = ENEMY_EVOLUTIONS[tier.key];
  if (!st || !forms) return tier;
  const form = forms[Math.min(st, forms.length) - 1];
  const hpMult = st < EVOLVE_HP.length ? EVOLVE_HP[st] : EVOLVE_HP[EVOLVE_HP.length - 1] + 0.25 * (st - EVOLVE_HP.length + 1);
  return { ...tier, ...form, hp: Math.round(tier.hp * hpMult), attack: tier.attack + st, evolved: st };
}
// A copy of an enemy tier, evolved to the current stage and scaled up by the current threat
function scaleTier(tier) {
  tier = evolveTier(tier);
  const t = threatLevel();
  if (!t) return tier;
  return { ...tier, hp: Math.round(tier.hp * (1 + THREAT_HP * t)), attack: tier.attack + Math.floor(t / 2),
           reward: Math.round(tier.reward * (1 + THREAT_REWARD * t)), loss: Math.round(tier.loss * (1 + 0.1 * t)), threat: t };
}
function onRollProgress() {
  const threatBefore = threatLevel(), stageBefore = evolveStage();
  rollsTotal++;
  tickSwamp(); // mystery.js: random swamp events
  if (evolveStage() > stageBefore) announceEvolution();
  if (regionRolls() % BOSS_TILE_EVERY() === 0) addBossTile();
  if (threatLevel() > threatBefore) announceThreat();
}
function announceThreat() {
  banner(`☠️ THREAT ${threatLevel()}: MONSTERS GROW STRONGER!`, 'fire');
  sfx('big_hit', 0.5, 0.8);
  flash('#8a0a0a', 0.35);
}
function announceEvolution() {
  const names = [...ENEMY_TIERS, BOSS_TIER].map(t => { const e = evolveTier(t); return `${e.art} ${e.name}`; }).join(', ');
  setTimeout(() => { banner('🧬 ENEMIES EVOLVED!', 'fire'); sfx('big_hit', 0.4, 1); sfx('strengthen', 0.8, 0.8); flash('#5a0a7a', 0.5); }, 900);
  setTimeout(() => banner(names, 'lose'), 2600);
}
// Events menu (testing): trigger the roll-driven events by hand
function forceThreat() { threatBonus++; announceThreat(); renderProgress(); }
function forceEvolve() { evolveBonus++; announceEvolution(); renderProgress(); }

// ---------- More boss tiles over time ----------
const BOSS_TILE_EVERY = () => SOLO ? 10 : 20;
// Turn a random coin or card square (not one a frog is standing on) into a new BOSS square
function addBossTile() {
  const pool = cells.map((_, i) => i).filter(i => (COIN_SQUARES[i] || CARD_SQUARES.includes(i)) && !BOSS_SQUARES.includes(i) && !players.some(p => p.pos === i));
  if (!pool.length) return;
  const i = pool[Math.floor(Math.random() * pool.length)];
  delete COIN_SQUARES[i];
  const c = CARD_SQUARES.indexOf(i);
  if (c >= 0) CARD_SQUARES.splice(c, 1);
  BOSS_SQUARES.push(i);
  const sq = squareEls[i];
  sq.className = 'square boss';
  sq.innerHTML = '<div class="icon">🐷</div>BOSS';
  burst(sq, ['#ff2d75', '#fff', '#c2185b'], 30, 1.2);
  setTimeout(() => { banner('🐷 A NEW BOSS TILE APPEARS!', 'fire'); sfx('heavy_slam', 0.9, 0.9); }, 500);
}

// ---------- Laps and crowns: the win goal ----------
// Win by collecting 3 GRAND CROWNS: one for beating each region's boss. A boss unlocks after LAPS_TO_UNLOCK laps of its region.
const GRAND_CROWNS = 3, LAPS_TO_UNLOCK = 3, BOSS_CROWNS = 1;
const BOSS_HUNT_LAPS = 2; // laps without a boss fight before the boss hunts you down
const START_TILE = 0; // the START square (top-left corner); every lap of the board passes it
// Called after every hop: passing START completes a lap
function progressHop(p) {
  if (p.pos !== START_TILE) return;
  p.laps = (p.laps || 0) + 1;
  addLap(p, '🏁 Lap complete!');
  // Boss hunt: go BOSS_HUNT_LAPS laps without fighting the boss and it comes for you
  if (bossUnlocked(p)) p.lapsSinceBoss = (p.lapsSinceBoss || 0) + 1;
  if (p.lapsSinceBoss >= BOSS_HUNT_LAPS && !p.bossHunting) {
    p.bossHunting = true;
    setTimeout(() => { banner(`${BOSS_TIER.art} The ${BOSS_TIER.name} is hunting you!`, 'fire'); sfx('big_hit', 0.5, 0.8); }, 1200);
  }
  gainXp(p, 10);
}
// A lap of this region counts toward unlocking its boss
function addLap(p, why) {
  const before = p.regionLaps || 0;
  p.regionLaps = before + 1;
  banner(`${why} ${Math.min(p.regionLaps, LAPS_TO_UNLOCK)}/${LAPS_TO_UNLOCK} laps`, 'legendary');
  sfx('level_up'); confetti(30);
  if (before < LAPS_TO_UNLOCK && p.regionLaps >= LAPS_TO_UNLOCK) setTimeout(() => { // the region's boss is open
    banner(`🔓 ${p.name} unlocked the ${isFinalRegion() ? 'FINAL BOSS' : BOSS_TIER.name}! Find a boss square!`, 'fire');
    sfx('jackpot', 0.8, 0.8); flash('#ffd23f', 0.4);
  }, 1500);
  renderProgress();
}
// Grand crowns: one for each region boss beaten. Collect all 3 to win.
function gainCrowns(p, n, why) {
  p.crowns = (p.crowns || 0) + n;
  banner(`👑 GRAND CROWN! ${why} (${p.crowns}/${GRAND_CROWNS})`, 'legendary');
  sfx('level_up'); sfx('jackpot', 1, 0.7);
  confetti(80);
  renderProgress();
}

// ---------- Comeback & rivalry (2-player) ----------
const rivalPlayer = p => players[1 - players.indexOf(p)];
// The player behind (fewer crowns, or level on a tie) is the underdog: +1 to rolls, +1 card choice, +25% coins
function isUnderdog(p) {
  if (SOLO || !p || p.enemy) return false;
  const r = rivalPlayer(p), a = progressScore(p), b = progressScore(r);
  return a < b || (a === b && (p.level || 1) < (r.level || 1));
}
// Leading by 2+ crowns puts a bounty on your head: lose a duel and the rival steals a crown
// How far along a player is: grand crowns count most, then laps in this region
const progressScore = p => (p.crowns || 0) * 10 + (p.regionLaps || 0);
// Leading by 2+ laps (or a grand crown) puts a bounty on you: lose a duel and the rival steals a lap
const hasBounty = p => !SOLO && p && !p.enemy && progressScore(p) - progressScore(rivalPlayer(p)) >= 2;
const bountyCoins = p => 5 + 5 * Math.min(4, progressScore(p) - progressScore(rivalPlayer(p)));

// ---------- XP and levels ----------
const xpToNext = lvl => 20 + (lvl - 1) * 12; // XP needed to go from this level to the next
function gainXp(p, n) {
  if (!p || p.enemy || !n) return;
  p.xp = (p.xp || 0) + Math.round(n * (1 + 0.25 * perkCount(p, 'quick')));
  while (p.xp >= xpToNext(p.level || 1)) {
    p.xp -= xpToNext(p.level || 1);
    p.level = (p.level || 1) + 1;
    p.pendingPerks = (p.pendingPerks || 0) + 1;
    unlockCards(p.level); // monster cards join the deck at higher levels
  }
  renderProgress();
}

// ---------- Level-locked monster cards ----------
// Reaching higher levels lets frogs find the monsters' own attacks: at each card's level it's shuffled into the
// deck. The level comes from how strong the card is (ultimate / super-move cards never unlock).
// Boss attacks: level 15. Ice Lake cards are 2 levels later than a Swamp card of the same power, Volcano 4.
const GIMMICK_POWER = { frenzy: m => m * 2, cleave: () => 2, lifesteal: m => m * 0.6, poison: () => 2, stun: () => 2,
  venomfang: m => m * 0.5, bash: () => 5, armor: () => 3, wallow: () => 4, heal: () => 3, shield: () => 2, focus: () => 3, double: () => 4 };
function cardUnlockLevel(c, region) {
  if (region === 'boss') return 15;
  const p = (c.mult || 0) + (GIMMICK_POWER[c.gimmick]?.(c.mult || 0) || 0);
  return Math.max(4, Math.min(20, Math.round(3 + p * 1.1 + (region === 'ice' ? 2 : region === 'volcano' ? 4 : 0))));
}
let cardUnlocks = null; // [{ card, level }], built once every card list exists
const cardUnlockList = () => cardUnlocks ||= [
  ...EVOLVED_CARDS.map(c => ({ card: c, level: cardUnlockLevel(c, 'swamp') })),
  ...BOSS_CARDS.map(c => ({ card: c, level: cardUnlockLevel(c, 'boss') })),
  ...REGION_CARDS.map(c => ({ card: c, level: cardUnlockLevel(c, c.region) })),
].filter(u => !u.card.ultimate && !u.card.superMove).sort((a, b) => a.level - b.level);
const unlockedCards = new Set();
function unlockCards(level) {
  const fresh = cardUnlockList().filter(u => u.level <= level && !unlockedCards.has(u.card));
  if (!fresh.length) return;
  fresh.forEach(u => { unlockedCards.add(u.card); deck.splice(Math.floor(Math.random() * (deck.length + 1)), 0, u.card); });
  setTimeout(() => {
    banner(`🔓 Level ${level}: ${fresh.length} monster card${fresh.length === 1 ? '' : 's'} added to the deck! ${fresh.slice(0, 4).map(u => u.card.art).join('')}`, 'legendary');
    sfx('celebrate', 1.1, 0.7);
  }, 1800);
}
const nextUnlockLevel = p => cardUnlockList().find(u => !unlockedCards.has(u.card) && u.level > (p.level || 1))?.level;

// ---------- Perks: pick 1 of 3 at every level-up ----------
const PERKS = [
  { key: 'sharp',    icon: '🎯', name: 'Sharpshooter',  max: 3, desc: '+10% crit chance',                 apply: p => p.critChance = Math.min(1, p.critChance + 0.1) },
  { key: 'heavy',    icon: '⚔️', name: 'Heavy Hitter',  max: 3, desc: '+1 base damage',                   apply: p => p.attack += 1 },
  { key: 'thick',    icon: '❤️', name: 'Thick Hide',    max: 3, desc: '+15 max HP',                       apply: p => p.maxHp += 15 },
  { key: 'lucky',    icon: '🍀', name: 'Lucky Frog',    max: 3, desc: '+10% luck (rolls land on special tiles)', apply: p => p.luck = Math.min(1, p.luck + 0.1) },
  { key: 'treasure', icon: '💰', name: 'Treasure Sense', max: 3, desc: '+20% coins from everything',      apply: p => p.moneyMult = +(p.moneyMult + 0.2).toFixed(2) },
  { key: 'haggle',   icon: '🏷️', name: 'Haggler',       max: 2, desc: 'Everything in the shop costs 15% less' },
  { key: 'quick',    icon: '📚', name: 'Quick Study',   max: 2, desc: '+25% XP' },
  { key: 'deep',     icon: '🎒', name: 'Deep Pockets',  max: 2, desc: '+3 hand limit' },
  { key: 'guard',    icon: '🛡️', name: 'Opening Guard', max: 2, desc: 'Start every battle with +1 shield' },
  { key: 'second',   icon: '💚', name: 'Second Wind',   max: 1, desc: 'Once per battle, below 30% HP, heal 30% of your max HP' },
  { key: 'picky',    icon: '🃏', name: 'Picky Picker',  max: 1, desc: 'Card squares show 4 choices instead of 3' },
  { key: 'fast',     icon: '⏱️', name: 'Fast Fingers',  max: 2, desc: '+2 seconds on every math question' },
];
const perkCount = (p, key) => (p && p.perks && p.perks[key]) || 0;
const shopDiscount = p => 0.85 ** perkCount(p, 'haggle') * (typeof swampActive === 'function' && swampActive('market') ? 0.7 : 1); // Haggler perk, Market Day
function showPerkPick(p) {
  const pool = PERKS.filter(k => perkCount(p, k.key) < k.max).sort(() => Math.random() - 0.5).slice(0, 3);
  if (!pool.length) return Promise.resolve();
  const el = document.createElement('div');
  el.className = 'prog-overlay';
  el.innerHTML = `<div class="shop-panel prog-panel"><h2>⭐ LEVEL ${p.level}!</h2><div class="battle-msg">${p.name}, pick a perk:</div>
    <div class="perk-row">${pool.map(k => `<button class="perk-card"><span class="perk-icon">${k.icon}</span><b>${k.name}</b>
      <small>${k.desc}</small>${perkCount(p, k.key) ? `<span class="lvl">have ${perkCount(p, k.key)}</span>` : ''}</button>`).join('')}</div></div>`;
  document.body.appendChild(el);
  sfx('level_up'); confetti(60); flash('#ffd23f', 0.3);
  return new Promise(res => el.querySelectorAll('.perk-card').forEach((b, i) => b.onclick = () => {
    const k = pool[i];
    p.perks = p.perks || {};
    p.perks[k.key] = perkCount(p, k.key) + 1;
    k.apply?.(p);
    sfx('shop_buy', 1.2);
    burst(b, ['#ffd23f', '#fff'], 30, 1.2);
    setTimeout(() => { el.remove(); res(); }, 250);
  }));
}

// ---------- Hand limit ----------
const HAND_LIMIT = 12;
const handLimit = p => p.noHandLimit ? Infinity : HAND_LIMIT + 3 * perkCount(p, 'deep'); // off after the 'Give 2 of every card' test event
// Too many cards: sell (tap) cards until you're back at the limit
async function enforceHandLimit(p) {
  if (p.hand.length <= handLimit(p)) return;
  const el = document.createElement('div');
  el.className = 'prog-overlay';
  document.body.appendChild(el);
  while (p.hand.length > handLimit(p)) {
    const over = p.hand.length - handLimit(p);
    el.innerHTML = `<div class="shop-panel prog-panel prog-wide"><h2>🎒 Hand full!</h2>
      <div class="battle-msg">Your hand limit is ${handLimit(p)}. Sell ${over} more card${over === 1 ? '' : 's'} (tap to sell).</div>
      <div class="hand-grid">${p.hand.map(c => cardFace(c, 0, p.attack)).join('')}</div></div>`;
    // (cursed cards can't be sold, so they don't react to taps)
    addCardTabs(el.querySelector('.hand-grid'));
    const i = await new Promise(r => el.querySelectorAll('.hand-grid .card-face').forEach((f, k) => { if (!p.hand[k].curse) f.onclick = () => r(k); }));
    const [c] = p.hand.splice(i, 1);
    gainCoins(p, sellPrice(c));
    sfx('coin', 1.1);
    render();
  }
  el.remove();
}

// ---------- Card squares: pick 1 of 3 for every card you earn ----------
async function pickCards(p, count) {
  const picked = [];
  for (let n = 0; n < count && deck.length; n++) {
    const shown = deck.splice(-Math.min(deck.length, 3 + perkCount(p, 'picky') + (isUnderdog(p) ? 1 : 0))); // Picky perk, underdog // take the top cards off the deck
    const el = document.createElement('div');
    el.className = 'prog-overlay';
    el.innerHTML = `<div class="shop-panel prog-panel prog-wide"><h2>🃏 Pick a card (${n + 1}/${count})</h2>
      <div class="battle-msg">Choose 1. The others go back into the deck.</div>
      <div class="pick-row">${shown.map(c => `<div class="pick-choice">${cardFace(c, 0, p.attack)}</div>`).join('')}</div></div>`;
    document.body.appendChild(el);
    const best = ['mythical', 'legendary', 'epic', 'rare'].find(r => shown.some(c => (c.rarity || 'common') === r));
    if (best === 'legendary' || best === 'mythical') { sfx('jackpot'); flash('#ffd23f', 0.4); } else if (best === 'epic') sfx('celebrate', 1, 0.7); else sfx('card_pick');
    const i = await new Promise(r => el.querySelectorAll('.pick-choice').forEach((f, k) => f.onclick = () => r(k)));
    burst(el.querySelectorAll('.pick-choice')[i], ['#ffd23f', '#fff'], 24, 1);
    sfx('card_land_gimmick', 1.1);
    await sleep(250);
    el.remove();
    picked.push(shown[i]);
    stat(p, 'cards');
    // Unpicked cards are shuffled back into the deck
    shown.forEach((c, k) => { if (k !== i) deck.splice(Math.floor(Math.random() * (deck.length + 1)), 0, c); });
  }
  return picked;
}

// ---------- Bounty quests ----------
const QUEST_TYPES = [
  { type: 'win',     text: n => `Win ${n} battle${n > 1 ? 's' : ''}`,             goals: [1, 2, 3], reward: 14 },
  { type: 'answer',  text: n => `Answer ${n} math questions right`,             goals: [4, 6, 8], reward: 10 },
  { type: 'crit',    text: n => `Land ${n} critical hits`,                        goals: [3, 5, 8], reward: 12 },
  { type: 'poison',  text: n => `Poison foes ${n} times`,                         goals: [2, 4],    reward: 12 },
  { type: 'jackpot', text: n => `Hit ${n} match combo${n > 1 ? 's' : ''} (pair or jackpot)`, goals: [1, 2, 3], reward: 14 },
  { type: 'coins',   text: n => `Earn ${n} coins`,                                goals: [25, 40, 60], reward: 12 },
  { type: 'buy',     text: n => `Buy ${n} things in the shop`,                    goals: [2, 3],    reward: 10 },
  { type: 'special', text: n => `Land on ${n} special squares`,                   goals: [4, 6],    reward: 10 },
  { type: 'bigturn', text: n => `Deal ${n}+ damage in a single turn`,             goals: [25, 40, 60], reward: 16, max: true },
  { type: 'forge',   text: n => `Use the Forge or Fusion ${n} time${n > 1 ? 's' : ''}`, goals: [1, 2], reward: 12 },
];
function newQuest(p) {
  const taken = new Set((p.quests || []).map(q => q.type));
  const pool = QUEST_TYPES.filter(q => !taken.has(q.type));
  const t = pool[Math.floor(Math.random() * pool.length)], gi = Math.floor(Math.random() * t.goals.length);
  return { type: t.type, goal: t.goals[gi], progress: 0, coins: Math.round(t.reward * (1 + gi * 0.5)), xp: 12 + gi * 8 };
}
function ensureQuests(p) {
  p.quests = p.quests || [];
  while (p.quests.length < 3) p.quests.push(newQuest(p));
}
players.forEach(ensureQuests);
// Report progress: `n` is added to counting quests; for "max" quests (bigturn) it's compared to the goal
function questEvent(p, type, n = 1) {
  if (!p || p.enemy || !p.quests) return;
  p.quests.forEach((q, i) => {
    if (q.type !== type || q.done) return;
    const def = QUEST_TYPES.find(t => t.type === type);
    q.progress = def.max ? Math.max(q.progress, n) : q.progress + n;
    if (q.progress >= q.goal) {
      q.done = true;
      setTimeout(() => {
        p.quests.splice(p.quests.indexOf(q), 1);
        gainCoins(p, q.coins);
        gainXp(p, q.xp);
        banner(`📜 BOUNTY DONE! +${q.coins} coins`, 'legendary');
        sfx('jackpot', 1.1, 0.8);
        ensureQuests(p);
        render();
      }, 400);
    }
  });
  renderProgress();
}

// ---------- HUD: level/XP, crowns, threat, and the quest board ----------
const progEl = document.createElement('div');
progEl.className = 'prog-hud';
document.getElementById('view').appendChild(progEl);
const questEl = document.createElement('div');
questEl.className = 'prog-overlay';
questEl.id = 'questBoard';
questEl.hidden = true;
document.body.appendChild(questEl);
// Countdown bar at the top: rolls until the next swamp event and the next monster strengthening
const countdownEl = document.createElement('div');
countdownEl.className = 'prog-countdown';
document.getElementById('view').appendChild(countdownEl);
function renderCountdown() {
  const p = players[turn];
  const ev = SWAMP_EVERY() - swampRolls % SWAMP_EVERY(), th = THREAT_EVERY() - regionRolls() % THREAT_EVERY();
  const bo = BOSS_TILE_EVERY() - regionRolls() % BOSS_TILE_EVERY(), evo = EVOLVE_EVERY() - regionRolls() % EVOLVE_EVERY();
  const bar = (left, every) => `<span class="cd-bar"><span style="width:${(1 - left / every) * 100}%"></span></span>`;
  countdownEl.innerHTML = `<div class="cd-item cd-event">🌀 Next swamp event in <b>${ev}</b> roll${ev === 1 ? '' : 's'}${bar(ev, SWAMP_EVERY())}</div>` +
    `<div class="cd-item cd-threat">☠️ Monsters grow stronger in <b>${th}</b> roll${th === 1 ? '' : 's'}${bar(th, THREAT_EVERY())}</div>` +
    `<div class="cd-item cd-boss">🐷 New boss tile in <b>${bo}</b> roll${bo === 1 ? '' : 's'}${bar(bo, BOSS_TILE_EVERY())}</div>` +
    `<div class="cd-item cd-evolve">🧬 Enemies evolve in <b>${evo}</b> roll${evo === 1 ? '' : 's'}${bar(evo, EVOLVE_EVERY())}</div>` +
    (p.bossHunting ? `<div class="cd-item cd-hunt">🐷 The boss is HUNTING you: your next landing is a boss fight!</div>`
      : `<div class="cd-item cd-boss">🐷 Boss hunts you in <b>${BOSS_HUNT_LAPS - (p.lapsSinceBoss || 0)}</b> lap${BOSS_HUNT_LAPS - (p.lapsSinceBoss || 0) === 1 ? '' : 's'}</div>`);
}
function renderProgress() {
  const p = players[turn];
  if (!p) return;
  renderCountdown();
  const lvl = p.level || 1, need = xpToNext(lvl), pct = Math.round((p.xp || 0) / need * 100);
  progEl.innerHTML = `<div class="prog-lvl">⭐ Lv ${lvl}<div class="prog-xp"><div style="width:${pct}%"></div></div></div>
    <div class="prog-region">${REGION().icon} ${REGION().name} <small>${regionIndex + 1}/${REGIONS.length}</small></div>
    <div class="prog-crowns">👑 ${p.crowns || 0}/${GRAND_CROWNS} grand crowns</div>
    <div class="prog-laps${bossUnlocked(p) ? ' match' : ''}">🏁 ${Math.min(p.regionLaps || 0, LAPS_TO_UNLOCK)}/${LAPS_TO_UNLOCK} laps${bossUnlocked(p) ? ' 🔓 BOSS OPEN' : ' to unlock the boss'}</div>
    ${isUnderdog(p) ? '<div class="prog-underdog">🐢 Underdog: +1 roll, +1 card choice, +25% coins</div>' : ''}
    ${hasBounty(p) ? `<div class="prog-bounty">🎯 Bounty on you! Lose a duel = lose a lap</div>` : ''}
    <div class="prog-threat" title="Monsters get stronger every ${THREAT_EVERY()} rolls">☠️ ${threatLevel()}</div>
    ${typeof swampLine === 'function' && swampLine() ? `<div class="prog-swamp">${swampLine()}</div>` : ''}
    <button class="prog-quest-btn">📜 Bounties</button>`;
  progEl.querySelector('.prog-quest-btn').onclick = () => { if (!busy) openQuests(); };
}
function openQuests() {
  const p = players[turn];
  ensureQuests(p);
  questEl.innerHTML = `<div class="shop-panel prog-panel"><h2>📜 Bounty Board</h2>
    <div class="battle-msg">Finish bounties for coins and XP. A new one appears when you finish one.</div>
    ${p.quests.map(q => `<div class="quest"><div><b>${QUEST_TYPES.find(t => t.type === q.type).text(q.goal)}</b>
      <div class="quest-bar"><div style="width:${Math.min(100, q.progress / q.goal * 100)}%"></div></div>
      <small>${Math.min(q.progress, q.goal)} / ${q.goal}</small></div><div class="quest-reward">${COIN} ${q.coins}<br><small>+${q.xp} XP</small></div></div>`).join('')}
    <div class="battle-msg prog-goal">🏆 Goal: collect <b>${GRAND_CROWNS} grand crowns 👑</b>, one for beating each region's boss (🐸 Swamp → 🧊 Ice Lake → 🌋 Volcano). A boss unlocks after <b>${LAPS_TO_UNLOCK} laps</b> of its region (past 🏁 START).<br>
      ☠️ Monsters grow stronger every ${THREAT_EVERY()} rolls (now threat ${threatLevel()}).<br>⭐ Level ${p.level || 1}: ${p.xp || 0}/${xpToNext(p.level || 1)} XP${nextUnlockLevel(p) ? ` · 🔓 more monster cards at Lv ${nextUnlockLevel(p)}` : ''} · Hand limit ${p.noHandLimit ? "off (testing)" : handLimit(p)}</div>
    <button class="shop-close">Close</button></div>`;
  questEl.hidden = false;
  questEl.querySelector('.shop-close').onclick = () => questEl.hidden = true;
}
questEl.addEventListener('click', e => { if (e.target === questEl) questEl.hidden = true; });

// ---------- End of a turn / event: level-ups, hand limit, and the win check ----------
async function endTurnProgress(p) {
  while ((p.pendingPerks || 0) > 0) { p.pendingPerks--; await showPerkPick(p); }
  await enforceHandLimit(p);
  renderPets();
  render();
  // Beat a region's boss: on to the next region, or (in the Volcano) win the game
  const cleared = players.find(q => q.clearedRegion);
  if (cleared) {
    cleared.clearedRegion = false;
    if (isFinalRegion()) await showRecap(cleared); // awards.js
    else await advanceRegion(cleared);            // regions.js
  }
}
function showWin(p) {
  const el = document.createElement('div');
  el.className = 'prog-overlay';
  el.innerHTML = `<div class="shop-panel prog-panel"><h2>🏆 ${p.name} WINS!</h2>
    <div class="battle-msg">${p.crowns} crowns in ${turnCount} turns · Level ${p.level || 1} · ${p.laps || 0} laps</div>
    <div class="win-frog">🐸👑</div><button class="battle-go">Play again</button></div>`;
  document.body.appendChild(el);
  sfx('win'); sfx('jackpot'); confetti(200); banner('🏆 VICTORY! 🏆', 'legendary');
  return new Promise(() => el.querySelector('button').onclick = () => location.reload());
}
