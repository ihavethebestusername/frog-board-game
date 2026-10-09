// Card packs: answer all 4 questions right on a card square and you can buy a pack to draw those cards from.
// Playstyle packs (Crit, Poison, Saws...) hold the deck's cards of that style; monster packs (Swamp Serpent,
// Butcher Hog, Frost Wolf...) hold a monster family's own attacks once they're unlocked by level (see
// cardUnlockList in progression.js). Pack cards are fresh copies, so packs never run out.
// 3 packs are offered at a time; re-rolling costs coins like the item shop's stock (items.js). Better packs are
// rarer and cost more.

const PACK_KINDS = {
  style:   { rarity: 'rare',      label: 'Playstyle', weight: 10 },
  monster: { rarity: 'epic',      label: 'Monster',   weight: 2 },
  boss:    { rarity: 'legendary', label: 'Boss',      weight: 0.75 },
};
let allPacks = null;
// Built the first time it's needed (every card list and region exists by then)
function cardPacks() {
  if (allPacks) return allPacks;
  allPacks = [];
  // Playstyle packs: the deck's cards, by the tab they sit under in the card menus
  const styleOf = c => CARD_STYLE[fxSlug(c)] || 'Basic';
  const deckCards = CARD_TYPES.filter(c => c.count > 0);
  [...new Set(deckCards.map(styleOf))].forEach(style => {
    const cards = deckCards.filter(c => styleOf(c) === style);
    const avg = cards.reduce((n, c) => n + (RARITY_STEP[c.rarity || 'common'] || 0), 0) / cards.length;
    allPacks.push({ key: 'style-' + style, kind: 'style', icon: CARD_TAB_ICONS[style] || '🃏', name: `${style} Pack`, cards,
                    basePrice: Math.round(5 + 3 * avg) });
  });
  // Monster packs: each enemy family (its base form, both evolutions) and each boss, in every region
  const unlockable = new Map(cardUnlockList().map(u => [u.card.name, u]));
  REGIONS.forEach(r => [...r.tiers, r.boss].forEach(t => {
    const names = [t.loadout, ...((r.evolutions || {})[t.key] || []).map(e => e.loadout)].flat();
    const list = [...new Set(names)].map(n => unlockable.get(n)).filter(Boolean);
    if (!list.length) return;
    allPacks.push({ key: `monster-${r.key}-${t.key}`, kind: t.key === 'boss' ? 'boss' : 'monster', icon: t.art,
                    name: `${t.name} Pack`, region: r.name, unlocks: list });
  }));
  return allPacks;
}
// What a pack holds right now (monster packs: only their unlocked cards) and what it costs
const packCards = pk => pk.cards || pk.unlocks.filter(u => unlockedCards.has(u.card)).map(u => u.card);
function packPrice(p, pk) {
  // Monster packs: by how strong their unlocked cards are (their unlock level), 15 to 35ish coins
  const lv = (pk.unlocks || []).filter(u => unlockedCards.has(u.card));
  const list = lv.length ? lv : pk.unlocks || [];
  const base = pk.basePrice ?? 6 + 1.5 * list.reduce((n, u) => n + u.level, 0) / list.length;
  return Math.round(base * shopDiscount(p)); // Haggler perk, Market Day
}
// 3 different packs, weighted so monster packs (and boss packs most of all) are rarer. A pack needs at least 2
// cards to choose between (so Control, just Stun Slime, never shows; monster packs once 2 of their cards unlock).
const PACK_MIN_CARDS = 2;
function rollPacks() {
  const pool = cardPacks().filter(pk => packCards(pk).length >= PACK_MIN_CARDS), out = [];
  while (out.length < 3 && out.length < pool.length) {
    const left = pool.filter(pk => !out.includes(pk));
    let r = Math.random() * left.reduce((n, pk) => n + PACK_KINDS[pk.kind].weight, 0);
    out.push(left.find(pk => (r -= PACK_KINDS[pk.kind].weight) < 0) || left[0]);
  }
  return out;
}

// The pack screen. Resolves with the chosen pack, or null for the normal deck.
function choosePack(p) {
  let offer = rollPacks(), rerolls = 0;
  const el = document.createElement('div');
  el.className = 'prog-overlay';
  document.body.appendChild(el);
  return new Promise(resolve => {
    const draw = fresh => {
      const rerollPrice = REROLL_BASE + REROLL_STEP * rerolls; // same as re-rolling the item shop (items.js)
      el.innerHTML = `<div class="shop-panel prog-panel prog-wide"><h2>🎴 Perfect! Choose a card pack</h2>
        <div class="battle-msg">All 4 right! Draw your cards from a pack instead of the deck. <b>${COIN} ${p.coins}</b></div>
        <div class="pack-offer">${offer.map((pk, i) => {
          const kind = PACK_KINDS[pk.kind], col = RARITY_COLORS[kind.rarity], cards = packCards(pk), price = packPrice(p, pk);
          return `<button class="pack-box r-${kind.rarity}${fresh ? ' drop' : ''}" data-i="${i}" style="--rc:${col}; --d:${i * 90}ms" ${p.coins < price ? 'disabled' : ''}>
            <span class="pack-icon">${pk.icon}</span><b>${pk.name}</b>
            <span class="item-rarity" style="background:${col}">${kind.label}${pk.region ? ' · ' + pk.region : ''}</span>
            <span class="pack-arts">${cards.slice(0, 8).map(c => c.art).join('')}</span>
            <small>${cards.length} card${cards.length === 1 ? '' : 's'}</small>
            <span class="pack-price">${COIN} ${price}</span></button>`;
        }).join('')}</div>
        <div class="pack-actions"><button class="restock-btn pack-reroll" ${p.coins < rerollPrice ? 'disabled' : ''}><span class="btn-row">🎲 Re-roll packs · ${COIN} ${rerollPrice}</span><small>costs more each time</small></button>
          <button class="battle-go pack-skip">🃏 Normal deck (free)</button></div></div>`;
      if (offer.some(pk => pk.kind === 'boss') && fresh) { sfx('jackpot'); flash('#ffd23f', 0.35); }
      el.querySelectorAll('.pack-box').forEach(b => b.onclick = () => {
        const pk = offer[+b.dataset.i], price = packPrice(p, pk);
        if (p.coins < price) return;
        p.coins -= price;
        sfx('shop_buy', 1.05);
        burst(b, [RARITY_COLORS[PACK_KINDS[pk.kind].rarity], '#fff', '#ffd23f'], 26, 1.1);
        render();
        setTimeout(() => { el.remove(); resolve(pk); }, 300);
      });
      el.querySelector('.pack-reroll').onclick = () => {
        if (p.coins < rerollPrice) return;
        p.coins -= rerollPrice;
        rerolls++;
        offer = rollPacks();
        sfx('wheel_tick', 1.2);
        render();
        draw(true);
      };
      el.querySelector('.pack-skip').onclick = () => { el.remove(); resolve(null); };
    };
    draw(true);
  });
}
