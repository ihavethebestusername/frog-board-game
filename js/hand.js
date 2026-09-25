// Hand viewer: shows the current player's cards.

// --- Hand viewer: shows the current player's cards, grouped by type ---
const handEl = document.getElementById('hand');
const handBtn = document.getElementById('handBtn');
function openHand() {
  const p = players[turn];
  document.getElementById('handTitle').textContent = `${p.name}'s cards`;
  const box = document.getElementById('handCards');
  if (!p.hand.length) {
    box.innerHTML = '<div class="hand-empty">No cards yet &mdash; land on a card square to draw some.</div>';
  } else {
    const groups = new Map();
    p.hand.forEach(c => groups.set(c, (groups.get(c) || 0) + 1));
    box.innerHTML = '<div class="hand-grid">' + [...groups].map(([c, n]) =>
      cardFace(c, n, p.attack)).join('') + '</div>';
  }
  handEl.hidden = false;
}
// Secret: the 10th click on the Cards button (over the whole game) gives the one and only Late Bloomer
const SECRET_CLICKS = 10;
let cardsBtnClicks = 0, secretUnlocked = false;
function checkSecret() {
  if (secretUnlocked || ++cardsBtnClicks < SECRET_CLICKS) return;
  secretUnlocked = true;
  players[turn].hand.push(copyCard(CARD_TYPES.find(c => c.gimmick === 'grow')));
  sfx('card_land_gimmick', 0.6);
  sfx('big_hit', 0.5, 0.6);
  flash('#ff2020', 0.4);
  burst(handBtn, ['#ff2b2b', '#5fd13a', '#fff'], 40, 1.4);
}
handBtn.addEventListener('click', () => { if (busy) return; checkSecret(); openHand(); });
document.getElementById('handClose').addEventListener('click', () => handEl.hidden = true);
handEl.addEventListener('click', e => { if (e.target === handEl) handEl.hidden = true; });
