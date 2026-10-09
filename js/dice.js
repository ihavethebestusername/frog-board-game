// Special dice: bought in the shop (🎲 Dice tab), each one good for DIE_ROLLS rolls, then it's used up.
// The selector above the die picks which one your next roll uses; the normal die is free and never runs out.
// Faces stay 1–6 so the dice sprites still show the roll.

const DIE_ROLLS = 3;
const DICE = [
  { key: 'short',  icon: '🎯', name: 'Short Die',  price: 5,  faces: [1, 2, 3], color: '#3b82f6', desc: 'Rolls 1–3: land exactly where you want' },
  { key: 'steady', icon: '⚖️', name: 'Steady Die', price: 5,  faces: [3, 4],    color: '#3b82f6', desc: 'Always rolls a 3 or a 4' },
  { key: 'high',   icon: '🚀', name: 'High Die',   price: 6,  faces: [4, 5, 6], color: '#3b82f6', desc: 'Rolls 4–6: zoom across the board' },
  { key: 'double', icon: '🎲', name: 'Double Die', price: 9,  faces: [1, 2, 3, 4, 5, 6], double: true, color: '#a855f7', desc: 'Roll twice, then pick which number to use' },
  { key: 'lucky',  icon: '🍀', name: 'Lucky Die',  price: 10, faces: [1, 2, 3, 4, 5, 6], lucky: true,  color: '#f59e0b', desc: 'Always lands on a special square if one is in reach' },
];
const dieDef = k => DICE.find(d => d.key === k);
const dieRolls = (p, k) => (p && p.dice && p.dice[k]) || 0;
const ownsDice = p => DICE.some(d => dieRolls(p, d.key));
// The die the player's next roll uses (null = the normal die)
const currentDie = p => (p.dieChoice && dieRolls(p, p.dieChoice) ? dieDef(p.dieChoice) : null);

// A roll from a set of faces. Luck (the Luck stat, or 100% for the Lucky Die) nudges it toward a face that
// reaches a special square, like the normal die does (luckyRoll in turn.js).
function faceRoll(p, faces, luck) {
  const roll = faces[Math.floor(Math.random() * faces.length)];
  const good = r => reachable(p.pos, r).some(isSpecial);
  if (Math.random() >= luck || good(roll)) return roll;
  const goodRolls = faces.filter(good);
  return goodRolls.length ? goodRolls[Math.floor(Math.random() * goodRolls.length)] : roll;
}
// Roll with the chosen die (turn.js rollDice). Uses up one of its rolls.
async function rollWithDie(p) {
  const d = currentDie(p);
  if (!d) return luckyRoll(p);
  p.dice[d.key]--;
  const roll = d.double ? await pickDouble(p) : faceRoll(p, d.faces, d.lucky ? 1 : p.luck);
  const left = dieRolls(p, d.key);
  if (!left) p.dieChoice = null; // used up: back to the normal die
  banner(`${d.icon} ${d.name}: ${roll}${left ? ` · ${left} roll${left === 1 ? '' : 's'} left` : ' · used up!'}`, 'legendary');
  renderDieChoice();
  return roll;
}
// Double Die: two rolls land side by side, tap the one you want
function pickDouble(p) {
  const a = faceRoll(p, [1, 2, 3, 4, 5, 6], p.luck), b = 1 + Math.floor(Math.random() * 6);
  const el = document.createElement('div');
  el.className = 'prog-overlay';
  el.innerHTML = `<div class="shop-panel prog-panel"><h2>🎲 Double Die</h2><div class="battle-msg">Pick which roll to use</div>
    <div class="double-dice">${[a, b].map(n => `<button class="double-die" data-n="${n}"><img src="sprites/dice_${n}.png" alt="${n}"><b>${n}</b></button>`).join('')}</div></div>`;
  document.body.appendChild(el);
  sfx('dice_land', 1.1);
  return new Promise(res => el.querySelectorAll('.double-die').forEach(btn => btn.onclick = () => {
    sfx('card_pick', 1.2);
    el.remove();
    res(+btn.dataset.n);
  }));
}

// --- The selector above the die (hidden until you own a special die) ---
const dieChoiceBtn = document.getElementById('dieChoice');
let dieChoiceText = '';
function renderDieChoice() {
  const p = players[turn], d = currentDie(p);
  const text = !ownsDice(p) ? '' : d ? `${d.icon} ×${dieRolls(p, d.key)}` : '🎲 Normal';
  if (text === dieChoiceText) return; // render() runs a lot; only touch the DOM when it changes
  dieChoiceText = text;
  dieChoiceBtn.hidden = !text;
  dieChoiceBtn.textContent = text;
  dieChoiceBtn.classList.toggle('special', !!d);
}
dieChoiceBtn.addEventListener('click', () => { if (!busy) openDiceTray(); });
function openDiceTray() {
  const p = players[turn];
  const el = document.createElement('div');
  el.className = 'prog-overlay';
  const opts = [null, ...DICE.filter(d => dieRolls(p, d.key))];
  el.innerHTML = `<div class="shop-panel prog-panel prog-wide"><h2>🎲 Choose your die</h2>
    <div class="battle-msg">Your next roll uses this die. Special dice are used up after ${DIE_ROLLS} rolls.</div>
    <div class="perk-row">${opts.map(d => `<button class="perk-card die-card${(currentDie(p) || null) === d ? ' on' : ''}" data-k="${d ? d.key : ''}" style="--rc:${d ? d.color : '#9aa4b0'}">
      <span class="perk-icon">${d ? d.icon : '🎲'}</span><b>${d ? d.name : 'Normal Die'}</b>
      <small>${d ? d.desc : 'Rolls 1–6. Free, never runs out'}</small><small class="die-left">${d ? `${dieRolls(p, d.key)} roll${dieRolls(p, d.key) === 1 ? '' : 's'} left` : '∞'}</small></button>`).join('')}</div></div>`;
  document.body.appendChild(el);
  el.querySelectorAll('.die-card').forEach(b => b.onclick = () => {
    p.dieChoice = b.dataset.k || null;
    sfx('card_pick', 1.1);
    el.remove();
    renderDieChoice();
  });
  el.addEventListener('click', e => { if (e.target === el) el.remove(); });
}

// --- Shop tab: dice on the shelf (shelfStore in shop.js) ---
function renderDiceShop(page, p, buy) {
  shelfStore(page, p, buy, { id: 'dice', sign: '🎲 Dice', sub: `each die is good for ${DIE_ROLLS} rolls, then it's used up`,
    shelves: [{ items: DICE.map(d => ({ icon: d.icon, name: d.name, desc: `${d.desc}. Buying adds ${DIE_ROLLS} rolls; choose it with the button above the die.`,
      price: Math.round(d.price * shopDiscount(p)), color: d.color, chip: `${DIE_ROLLS} rolls`, owned: dieRolls(p, d.key),
      ownedText: `${dieRolls(p, d.key)} roll${dieRolls(p, d.key) === 1 ? '' : 's'} left`,
      buy: () => { p.dice = p.dice || {}; p.dice[d.key] = dieRolls(p, d.key) + DIE_ROLLS; if (!currentDie(p)) p.dieChoice = d.key; renderDieChoice(); } })) }] });
}
