// The coin shop.

// --- Shop ---
function renderShop() {
  const p = players[turn];
  document.getElementById('shopBalance').innerHTML = COIN + ' ' + p.coins;
  const list = document.getElementById('shopItems');
  list.innerHTML = '';
  SHOP_ITEMS.forEach(item => {
    const row = document.createElement('div');
    row.className = 'shop-item';
    row.innerHTML = `<div><div class="name">${item.name}</div><div class="desc">${item.desc}</div></div>
      <button ${p.coins < item.price ? 'disabled' : ''}>${COIN} ${item.price}</button>`;
    row.querySelector('button').addEventListener('click', () => {
      p.coins -= item.price;
      sfx('shop_buy');
      (p.items ||= []).push(item.name); // effects not implemented yet
      renderShop();
      render();
    });
    list.appendChild(row);
  });
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
      <button class="sell">Sell +${COIN} ${sellPrice(c)}</button>`;
    row.querySelector('button').addEventListener('click', () => {
      p.hand.splice(i, 1);
      p.coins += sellPrice(c);
      sfx('coin', 1.1);
      renderShop();
      render();
    });
    list.appendChild(row);
  });
}
// Resolves when the shop is closed
let closeShop = () => {};
function openShop() {
  renderShop();
  shopEl.hidden = false;
  return new Promise(resolve => closeShop = () => { shopEl.hidden = true; resolve(); });
}
document.getElementById('shopBtn').addEventListener('click', () => runEvent(openShop));
document.getElementById('shopClose').addEventListener('click', () => closeShop());
shopEl.addEventListener('click', e => { if (e.target === shopEl) closeShop(); });
