// The coin shop.

// --- Shop ---
function renderShop() {
  const p = players[turn];
  document.getElementById('shopBalance').innerHTML = COIN + ' ' + p.coins;
  const list = document.getElementById('shopItems');
  list.innerHTML = '';
  // Stat upgrades: each buy raises the stat by one step; prices grow exponentially with the level
  UPGRADES.forEach(u => {
    const cur = p[u.key], next = +(cur + u.step).toFixed(2);
    const maxed = u.max !== undefined && cur >= u.max - 1e-9;
    const price = upgradePrice(p, u), lvl = p.levels[u.key] || 0;
    const row = document.createElement('div');
    row.className = 'shop-item';
    row.innerHTML = `<div><div class="name">${u.icon} ${u.name} <span class="lvl">Lv ${lvl}</span></div>
      <div class="desc">${u.show(cur)}${maxed ? ' (max)' : ` → <b>${u.show(Math.min(next, u.max ?? next))}</b>`}${u.desc ? ' · ' + u.desc : ''}</div></div>
      <button ${maxed || p.coins < price ? 'disabled' : ''}>${maxed ? 'MAX' : COIN + ' ' + price}</button>`;
    row.querySelector('button').addEventListener('click', () => {
      p.coins -= price;
      const before = p[u.key];
      p[u.key] = Math.min(next, u.max ?? next);
      p.levels[u.key] = lvl + 1;
      shopPurchases.push({ u, gained: p[u.key] - before }); // tuned by the quiz when leaving
      sfx('shop_buy', 1 + lvl * 0.05);
      renderShop();
      render();
    });
    list.appendChild(row);
  });
  // Items
  const itemHead = document.createElement('div');
  itemHead.className = 'shop-subhead';
  itemHead.textContent = 'Items';
  list.appendChild(itemHead);
  const balloonRow = document.createElement('div');
  balloonRow.className = 'shop-item';
  balloonRow.innerHTML = `<div><div class="name">💧 Water Balloon <span class="lvl">You have ${p.balloons || 0}</span></div>
    <div class="desc">Throw it while your opponent is answering a question: soaks their screen for 3 seconds</div></div>
    <button ${p.coins < BALLOON_PRICE ? 'disabled' : ''}>${COIN} ${BALLOON_PRICE}</button>`;
  balloonRow.querySelector('button').addEventListener('click', () => {
    p.coins -= BALLOON_PRICE;
    p.balloons = (p.balloons || 0) + 1;
    sfx('shop_buy');
    renderBalloons();
    renderShop();
    render();
  });
  list.appendChild(balloonRow);

  // Sell cards from your hand for coins
  const head = document.createElement('div');
  head.className = 'shop-subhead';
  head.textContent = 'Sell cards';
  list.appendChild(head);
  if (!p.hand.length) {
    const none = document.createElement('div');
    none.className = 'shop-empty';
    none.textContent = 'No cards to sell.';
    list.appendChild(none);
  }
  p.hand.forEach((c, i) => {
    const row = document.createElement('div');
    row.className = 'shop-item';
    const art = c.art + (c.extra ? ' ' + c.extraArt : '');
    row.innerHTML = `<div><div class="name">${art} ${c.name}</div><div class="desc">${c.text(p.attack)}</div></div>
      <button class="sell">Sell +${COIN} ${Math.round(sellPrice(c) * p.moneyMult)}</button>`;
    row.querySelector('button').addEventListener('click', () => {
      p.hand.splice(i, 1);
      gainCoins(p, sellPrice(c)); // boosted by the Money stat
      sfx('coin', 1.1);
      renderShop();
      render();
    });
    list.appendChild(row);
  });
}
// Upgrades bought this visit; when you leave, a math question decides how effective they are
let shopPurchases = [];
const UPGRADE_BEST = 1.5, UPGRADE_WORST = 0.5; // fast right answer ×1.5 ... wrong answer ×0.5

// Quiz on the way out: scale every upgrade bought this visit by how fast (and whether) you answered
async function upgradeQuiz(p) {
  const bought = shopPurchases;
  shopPurchases = [];
  if (!bought.length) return;
  await quizPanel('', 'Install your upgrades', 'Answer fast to make your upgrades stronger. Wrong = weaker!', async result => {
    const { correct, timeLeft } = await askQuestion(makeQuestion(0.5), 12000);
    // Right answers scale from ×1 (just in time) to ×1.5 (instant); wrong or too slow is ×0.5
    const factor = correct ? 1 + (UPGRADE_BEST - 1) * timeLeft : UPGRADE_WORST;
    bought.forEach(({ u, gained }) => {
      const v = Math.min(u.max ?? Infinity, Math.max(0, p[u.key] + gained * (factor - 1)));
      p[u.key] = u.int ? Math.round(v) : +v.toFixed(3); // HP and damage stay whole numbers
    });
    sfx(correct ? 'card_land_gimmick' : 'fail', correct ? 0.9 + timeLeft * 0.4 : 1);
    const pct = Math.round(factor * 100);
    const list = [...new Set(bought.map(b => b.u))].map(u => `${u.icon} ${u.show(p[u.key])}`).join(' &nbsp; ');
    result.innerHTML = `${correct ? (timeLeft > 0.6 ? 'Lightning fast!' : 'Correct!') : timeLeft <= 0 ? 'Too slow!' : 'Wrong!'} ` +
      `Upgrades at <span class="${factor < 1 ? 'lose-text' : ''}">${pct}%</span><br><small>${list}</small>`;
  });
  render();
}

// Resolves when the shop is closed (after the upgrade quiz, if anything was bought)
let closeShop = () => {};
function openShop() {
  shopPurchases = [];
  renderShop();
  shopEl.hidden = false;
  return new Promise(resolve => {
    let closing = false;
    closeShop = async () => {
      if (closing) return;
      closing = true;
      shopEl.hidden = true;
      await upgradeQuiz(players[turn]);
      resolve();
    };
  });
}
document.getElementById('shopBtn').addEventListener('click', () => runEvent(openShop));
document.getElementById('shopClose').addEventListener('click', () => closeShop());
shopEl.addEventListener('click', e => { if (e.target === shopEl) closeShop(); });
