// The coin shop.

// --- Shop ---
// Run by Shelly the shopkeeper, with tabs for each kind of thing she sells. She chats about what you do.
const SHOP_TABS = [
  { key: 'upgrades', icon: '⬆️', name: 'Upgrades' },
  { key: 'charms',   icon: '🔮', name: 'Charms' },
  { key: 'items',    icon: '🎒', name: 'Items' },
  { key: 'traps',    icon: '🪤', name: 'Traps' },
  { key: 'sell',     icon: '💰', name: 'Sell' },
];
const KEEPER_LINES = {
  hello:    ['Welcome, welcome! Mind the shells.', 'Ahh, a customer! Best prices in the swamp.', 'Back again? I saved the good stuff for you.', 'Coins jingling? Music to my ears.'],
  upgrades: ['Train up that frog! Everything grows from the tree.', "Stronger legs, sharper crits... what'll it be?"],
  charms:   ['Charms! Pick a style and go all in, dear.', 'Crits, poison, saws... a charm for every kind of frog.'],
  items:    ['Handy little gadgets. Very handy.', 'Tools of the trade! Some are sneaky...'],
  traps:    ['Heh heh... planning something nasty?', 'Snares, mud, curses... all perfectly legal. Mostly.'],
  sell:     ["Selling? Let's see what you've got.", "I'll give you a fair price. Mostly fair."],
  bought:   ['Pleasure doing business!', 'Ooh, excellent choice!', "You won't regret that one.", 'Ka-ching! Thank you kindly.'],
  sold:     ["I'll put it on the shelf. Thank you!", 'A fine card! Well, fine enough.', 'Deal! Coins for cards.'],
  poor:     ['Hmm, a little short on coins, dear.', 'Come back when your pockets are heavier!'],
};
let shopTab = 'upgrades', shopSay = '';
const keeperLine = kind => KEEPER_LINES[kind][Math.floor(Math.random() * KEEPER_LINES[kind].length)];
// Make Shelly say something (and hop)
function keeperSays(kind) {
  shopSay = keeperLine(kind);
  const k = document.querySelector('.keeper-avatar');
  if (k) { k.classList.remove('talk'); void k.offsetWidth; k.classList.add('talk'); }
  const bubble = document.querySelector('.keeper-bubble');
  if (bubble) bubble.textContent = shopSay;
}
// A shop row: name/description on the left, a buy (or sell) button on the right
function shopRow({ name, desc, button, disabled = false, cls = '', color = '' }, onClick) {
  const row = document.createElement('div');
  row.className = 'shop-item ' + cls;
  if (color) row.style.setProperty('--sc', color);
  row.innerHTML = `<div><div class="name">${name}</div><div class="desc">${desc}</div></div><button ${disabled ? 'disabled' : ''}>${button}</button>`;
  row.querySelector('button').addEventListener('click', () => onClick(row));
  return row;
}
function shopSubhead(list, text, color) {
  const h = document.createElement('div');
  h.className = 'shop-subhead';
  h.textContent = text;
  if (color) h.style.color = color;
  list.appendChild(h);
}

function renderShop() {
  const p = players[turn];
  document.getElementById('shopBalance').innerHTML = COIN + ' ' + p.coins;
  const list = document.getElementById('shopItems');
  list.innerHTML = `<div class="keeper"><div class="keeper-avatar">🐢<span class="keeper-hat">🎩</span></div>
    <div class="keeper-bubble">${shopSay || keeperLine('hello')}</div></div>
    <div class="shop-tabs">${SHOP_TABS.map(t => `<button class="shop-tab${t.key === shopTab ? ' on' : ''}" data-tab="${t.key}">${t.icon} ${t.name}</button>`).join('')}</div>`;
  list.querySelectorAll('.shop-tab').forEach(b => b.addEventListener('click', () => {
    if (shopTab === b.dataset.tab) return;
    shopTab = b.dataset.tab;
    renderShop();
    keeperSays(shopTab);
  }));
  const page = document.createElement('div');
  page.className = 'shop-page';
  list.appendChild(page);
  // Pay, apply the purchase, then celebrate (or Shelly tells you you're short)
  const buy = (price, apply, row, colors = ['#ffd23f', '#fff']) => {
    if (p.coins < price) { keeperSays('poor'); return; }
    p.coins -= price;
    apply();
    questEvent(p, 'buy');
    sfx('shop_buy', 1.05);
    burst(row, colors, 18, 0.8);
    renderShop();
    keeperSays('bought');
    render();
  };

  if (shopTab === 'upgrades') {
    // Stat upgrades live on their own screen: the upgrade tree
    const treeBtn = document.createElement('button');
    treeBtn.className = 'battle-go tree-open';
    treeBtn.innerHTML = `🌳 Open the Upgrade Tree <small>Health, damage, crits, luck & money</small>`;
    treeBtn.addEventListener('click', openTree);
    page.appendChild(treeBtn);
    shopSubhead(page, 'Your frog');
    const stats = document.createElement('div');
    stats.className = 'shop-stats';
    stats.innerHTML = UPGRADES.map(u => `<div><span>${u.icon}</span><b>${u.show(p[u.key])}</b><small>${u.name} · Lv ${p.levels[u.key] || 0}</small></div>`).join('');
    page.appendChild(stats);
  }

  if (shopTab === 'charms') {
    // Charms: passive battle items, grouped by playstyle
    [...new Set(CHARMS.map(c => c.style))].forEach(style => {
      shopSubhead(page, style, CHARM_STYLE_COLORS[style]);
      CHARMS.filter(c => c.style === style).forEach(c => {
        const n = charmCount(p, c.key), maxed = n >= c.max, price = charmPrice(p, c);
        page.appendChild(shopRow({
          name: `${c.icon} ${c.name}${n ? ` <span class="lvl">x${n}</span>` : ''}`, desc: c.desc(maxed ? n : n + 1),
          button: maxed ? 'MAX' : COIN + ' ' + price, disabled: maxed || p.coins < price, cls: 'charm-row', color: CHARM_STYLE_COLORS[style],
        }, row => buy(price, () => { p.charms[c.key] = n + 1; }, row, [CHARM_STYLE_COLORS[style], '#fff'])));
      });
    });
  }

  if (shopTab === 'items') {
    const absPrice = Math.round(ABS_PRICE * shopDiscount(p)), balloonPrice = Math.round(BALLOON_PRICE * shopDiscount(p)); // Haggler perk
    shopSubhead(page, 'Minigame tools');
    page.appendChild(shopRow({
      name: `|x| Absolute Value <span class="lvl">You have ${p.absValues || 0}</span>`,
      desc: 'Use it in Frog Math Swarm: wraps your equation in | | so your score turns positive',
      button: COIN + ' ' + absPrice, disabled: p.coins < absPrice,
    }, row => buy(absPrice, () => { p.absValues = (p.absValues || 0) + 1; }, row)));
    // Water balloons need an opponent, so there are none in solo
    if (!SOLO) {
      shopSubhead(page, 'Pranks');
      page.appendChild(shopRow({
        name: `💧 Water Balloon <span class="lvl">You have ${p.balloons || 0}</span>`,
        desc: 'Throw it while your opponent is answering a question: soaks their screen for 3 seconds',
        button: COIN + ' ' + balloonPrice, disabled: p.coins < balloonPrice,
      }, row => buy(balloonPrice, () => { p.balloons = (p.balloons || 0) + 1; renderBalloons(); }, row, ['#6aa8ff', '#fff'])));
    }
  }

  if (shopTab === 'traps') renderTrapShop(page, p, buy);

  if (shopTab === 'sell') {
    // Sell cards from your hand for coins
    shopSubhead(page, 'Sell cards');
    if (!p.hand.length) {
      const none = document.createElement('div');
      none.className = 'shop-empty';
      none.textContent = 'No cards to sell.';
      page.appendChild(none);
    }
    p.hand.forEach((c, i) => {
      if (c.curse) return; // cursed cards can't be sold
      page.appendChild(shopRow({
        name: `${c.art}${c.extra ? ' ' + c.extraArt : ''} ${c.name}`, desc: c.text(p.attack),
        button: `Sell +${COIN} ${Math.round(sellPrice(c) * p.moneyMult * (typeof isUnderdog === 'function' && isUnderdog(p) ? 1.25 : 1))}`, // same as gainCoins
      }, () => {
        p.hand.splice(i, 1);
        gainCoins(p, sellPrice(c)); // boosted by the Money stat
        sfx('coin', 1.1);
        renderShop();
        keeperSays('sold');
        render();
      }));
      page.lastChild.querySelector('button').classList.add('sell');
    });
  }
}
// --- Upgrade tree screen (opened from the shop) ---
// Buying a node raises that stat one step; prices grow exponentially with the level. Upgrades bought
// here count as shop purchases, so the install quiz still runs when you leave the shop.
const treeEl = document.createElement('div');
treeEl.id = 'tree';
treeEl.hidden = true;
treeEl.innerHTML = `<div class="shop-panel tree-panel"><div class="shop-head"><h2>🌳 Upgrade Tree</h2><div class="shop-balance" id="treeBalance"></div></div>
  <div class="tree-root">🐸</div><div class="tree-branches" id="treeBranches"></div>
  <div class="tree-info" id="treeInfo">Tap an upgrade to buy its next level.</div>
  <button class="shop-close" id="treeClose">Back to shop</button></div>`;
document.body.appendChild(treeEl);
function openTree() { renderTree(); treeEl.hidden = false; }
function renderTree() {
  const p = players[turn];
  document.getElementById('treeBalance').innerHTML = COIN + ' ' + p.coins;
  document.getElementById('treeBranches').innerHTML = UPGRADE_TREE.map(b => `
    <div class="tree-branch" style="--bc:${b.color}"><div class="tree-branch-name">${b.icon} ${b.name}</div>` +
    b.nodes.map(key => {
      const u = UPGRADES.find(x => x.key === key), lvl = p.levels[key] || 0, req = upgradeReq(key);
      const locked = req && !(p.levels[req.key] > 0);
      const maxed = u.max !== undefined && p[key] >= u.max - 1e-9;
      const price = upgradePrice(p, u);
      const state = locked ? 'locked' : maxed ? 'maxed' : p.coins >= price ? 'buyable' : 'poor';
      return `<div class="tree-link${locked ? '' : ' on'}"></div>
        <button class="tree-node ${state}" data-key="${key}" ${state === 'buyable' ? '' : 'aria-disabled="true"'}>
          <span class="tree-icon">${locked ? '🔒' : u.icon}</span><b>${u.name}</b>
          <span class="tree-lvl">Lv ${lvl}</span>
          <small>${locked ? `Needs ${req.name}` : maxed ? 'MAX' : `${COIN} ${price}`}</small></button>`;
    }).join('') + '</div>').join('');
  document.querySelectorAll('#treeBranches .tree-node').forEach(n => n.addEventListener('click', () => buyNode(n)));
}
function buyNode(nodeEl) {
  const p = players[turn], u = UPGRADES.find(x => x.key === nodeEl.dataset.key);
  const info = document.getElementById('treeInfo');
  const lvl = p.levels[u.key] || 0, req = upgradeReq(u.key), price = upgradePrice(p, u);
  const cur = p[u.key], next = +(cur + u.step).toFixed(2);
  const nextShown = u.show(Math.min(next, u.max ?? next));
  info.innerHTML = `${u.icon} <b>${u.name}</b>: ${u.show(cur)} → <b>${nextShown}</b>${u.desc ? ' · ' + u.desc : ''}`;
  if (req && !(p.levels[req.key] > 0)) { info.innerHTML += `<br><span class="lose-text">Unlock ${req.name} first.</span>`; sfx('fail', 1.2, 0.5); return; }
  if (u.max !== undefined && cur >= u.max - 1e-9) { info.innerHTML = `${u.icon} <b>${u.name}</b> is maxed out!`; return; }
  if (p.coins < price) { info.innerHTML += `<br><span class="lose-text">Needs ${price} coins.</span>`; sfx('fail', 1.2, 0.5); return; }
  p.coins -= price;
  p[u.key] = Math.min(next, u.max ?? next);
  p.levels[u.key] = lvl + 1;
  shopPurchases.push({ u, gained: p[u.key] - cur }); // tuned by the quiz when leaving the shop
  questEvent(p, 'buy');
  sfx('shop_buy', 1 + lvl * 0.05);
  if (lvl === 0 && UPGRADE_TREE.some(b => b.nodes[b.nodes.indexOf(u.key) + 1])) sfx('level_up', 1, 0.6); // unlocked the next node
  renderTree();
  const fresh = document.querySelector(`#treeBranches .tree-node[data-key="${u.key}"]`);
  if (fresh) { fresh.classList.add('bought'); burst(fresh, ['#ffd23f', '#fff', '#5fd13a'], 24, 1); }
  info.innerHTML = `${u.icon} <b>${u.name}</b> upgraded to Lv ${lvl + 1}: <b>${nextShown}</b>`;
  renderShop();
  render();
}
document.getElementById('treeClose').addEventListener('click', () => { treeEl.hidden = true; renderShop(); });
treeEl.addEventListener('click', e => { if (e.target === treeEl) { treeEl.hidden = true; renderShop(); } });

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
async function openShop() {
  await squareTutorial('shop'); // Shelly explains her shop the first time
  shopPurchases = [];
  shopSay = keeperLine('hello');
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
