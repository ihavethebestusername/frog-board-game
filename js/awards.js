// End-of-game awards: stats are tracked through the whole game with stat()/statMax(), and when someone
// wins, a recap screen reveals fun awards one by one, then shows everyone's totals side by side.

const stat = (p, key, n = 1) => { if (!p || p.enemy) return; p.stats = p.stats || {}; p.stats[key] = (p.stats[key] || 0) + n; };
const statMax = (p, key, n) => { if (!p || p.enemy) return; p.stats = p.stats || {}; p.stats[key] = Math.max(p.stats[key] || 0, n); };
const statOf = (p, key) => (p.stats && p.stats[key]) || 0;
// Cards landed on the wheels, to find each player's favourite
function statCard(p, card) {
  if (!p || p.enemy || !card) return;
  p.cardUses = p.cardUses || {};
  p.cardUses[card.name] = (p.cardUses[card.name] || 0) + 1;
}
const favouriteCard = p => {
  const e = Object.entries(p.cardUses || {}).sort((a, b) => b[1] - a[1])[0];
  if (!e) return null;
  const c = [...CARD_TYPES, ...EVOLVED_CARDS, ...BOSS_CARDS, ...REGION_CARDS].find(x => x.name === e[0]);
  return { name: e[0], art: c ? c.art : '🃏', uses: e[1] };
};

// Award definitions: the player with the highest value wins it (ties share it); 0 means nobody gets it
const AWARDS = [
  { key: 'bigHit',   icon: '💥', title: 'Heavy Hitter',   desc: v => `Biggest single hit: ${v} damage` },
  { key: 'right',    icon: '🧠', title: 'Math Whiz',      desc: v => `${v} math questions answered right` },
  { key: 'streak',   icon: '🔥', title: 'Streak Master',  desc: v => `Best answer streak: ${v} in a row` },
  { key: 'coins',    icon: '💰', title: 'Tycoon',         desc: v => `${v} coins earned` },
  { key: 'wins',     icon: '⚔️', title: 'Warlord',        desc: v => `${v} battles won` },
  { key: 'bosses',   icon: '🐷', title: 'Hog Slayer',     desc: v => `Beat the boss ${v} time${v === 1 ? '' : 's'}` },
  { key: 'crits',    icon: '🎯', title: 'Critical Eye',   desc: v => `${v} critical hits` },
  { key: 'combos',   icon: '🎰', title: 'Lucky Spinner',  desc: v => `${v} match combos` },
  { key: 'cards',    icon: '🃏', title: 'Collector',      desc: v => `${v} cards collected` },
  { key: 'traps',    icon: '🪤', title: 'Trickster',      desc: v => `${v} traps sprung on the rival` },
  { key: 'minigames', icon: '🎮', title: 'Game Master',   desc: v => `${v} minigames played` },
  { key: 'pet',      icon: '🐾', title: 'Pet MVP',        desc: v => `Pet helped ${v} times` },
];
const STAT_ROWS = [['👑 Crowns', p => p.crowns || 0], ['⭐ Level', p => p.level || 1], ['🏁 Laps', p => p.laps || 0],
  ['💥 Biggest hit', p => statOf(p, 'bigHit')], ['⚔️ Total damage', p => statOf(p, 'damage')], ['🏆 Battles won', p => statOf(p, 'wins')],
  ['💀 Battles lost', p => statOf(p, 'losses')], ['🧠 Right answers', p => statOf(p, 'right')], ['🔥 Best streak', p => statOf(p, 'streak')],
  ['💰 Coins earned', p => statOf(p, 'coins')], ['🃏 Cards collected', p => statOf(p, 'cards')], ['🎰 Match combos', p => statOf(p, 'combos')]];

async function showRecap(winner) {
  const list = SOLO ? [players[0]] : players;
  // Hand out the awards
  const won = [];
  AWARDS.forEach(a => {
    const best = Math.max(...list.map(p => statOf(p, a.key)));
    if (best > 0) won.push({ ...a, value: best, who: list.filter(p => statOf(p, a.key) === best) });
  });
  list.forEach(p => { const f = favouriteCard(p); if (f) won.push({ icon: f.art, title: 'Favourite Card', desc: () => `${p.name}: ${f.name} (landed ${f.uses}×)`, value: f.uses, who: [p] }); });
  const el = document.createElement('div');
  el.className = 'prog-overlay recap';
  el.innerHTML = `<div class="shop-panel prog-panel recap-panel">
    <h2>🏆 ${winner.name} WINS!</h2>
    <div class="recap-podium"><div class="recap-frog">🐸👑</div><div class="battle-msg">Conquered the 🌋 Volcano in ${turnCount} turns · ${winner.crowns} crowns${petIcon(winner) ? ` · with ${petIcon(winner)}` : ''}</div></div>
    <div class="recap-awards"></div>
    <div class="recap-table" hidden></div>
    <button class="battle-go" hidden>Play again</button></div>`;
  document.body.appendChild(el);
  sfx('win'); sfx('jackpot'); confetti(200); banner('🏆 VICTORY! 🏆', 'legendary');
  await sleep(1400);
  // Reveal the awards one at a time as flipping cards
  const box = el.querySelector('.recap-awards');
  for (const a of won) {
    const card = document.createElement('div');
    card.className = 'recap-award';
    card.innerHTML = `<div class="recap-icon">${a.icon}</div><b>${a.title}</b><span>${a.who.map(p => p.name).join(' & ')}</span><small>${a.desc(a.value)}</small>`;
    box.appendChild(card);
    sfx('card_land_gimmick', 1 + box.children.length * 0.04, 0.7);
    burst(card, ['#ffd23f', '#fff'], 14, 0.8);
    await sleep(420);
  }
  // Everyone's totals side by side
  const table = el.querySelector('.recap-table');
  table.innerHTML = `<table><tr><th></th>${list.map(p => `<th>${p.name}${p === winner ? ' 👑' : ''}</th>`).join('')}</tr>` +
    STAT_ROWS.map(([label, f]) => `<tr><td>${label}</td>${list.map(p => `<td>${f(p)}</td>`).join('')}</tr>`).join('') + '</table>';
  table.hidden = false;
  const btn = el.querySelector('button');
  btn.hidden = false;
  return new Promise(() => btn.onclick = () => location.reload());
}
