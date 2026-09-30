// Cup game: a valuable card is shown going under one cup, the cups shuffle, then you pick one.

const cupsEl = document.getElementById('cups');
const cupTable = document.getElementById('cupTable');
const cupsMsg = document.getElementById('cupsMsg');
const cupsGo = document.getElementById('cupsGo');
const CUP_GAP = 170; // px between cup spots

async function cupEvent() {
  const p = players[turn];
  // Prize: the base card with boosted damage and a random fused gimmick
  const base = CARD_TYPES.find(c => c.name === CUP_PRIZE);
  const donors = CARD_TYPES.filter(c => c.gimmick && c.gimmick !== 'grow');
  const mult = base.mult + CUP_BOOST;
  const boosted = { ...base, name: 'Golden ' + base.name, mult, rarity: 'legendary', text: a => `${a * mult} damage` };
  let prize = fuseCards(boosted, donors[Math.floor(Math.random() * donors.length)]);
  const waitGo = label => new Promise(r => { cupsGo.hidden = false; cupsGo.textContent = label; cupsGo.onclick = () => { cupsGo.hidden = true; r(); }; });
  // Difficulty: more cups (and more swaps) is harder
  cupsEl.hidden = false;
  cupsGo.hidden = true;
  cupTable.className = 'cup-table';
  cupTable.style.width = '';
  cupsMsg.textContent = 'Pick a difficulty.';
  cupTable.innerHTML = '<div class="cup-levels">' + CUP_LEVELS.map(l =>
    `<button class="battle-go${l.ultimate ? ' cup-ultimate' : ''}">${l.name}<small>${l.cups} cups${l.speed ? ', much faster' : ''}${l.prize ? ` · prize: ${l.prize} 🛰️` : ''}</small></button>`).join('') + '</div>';
  const level = await new Promise(r => cupTable.querySelectorAll('button').forEach((b, i) => b.onclick = () => r(CUP_LEVELS[i])));
  sfx('card_pick');
  if (level.prize) prize = CARD_TYPES.find(c => c.name === level.prize); // ULTIMATE: the Orbital Laser
  const count = level.cups;
  stat(p, 'minigames');
  // slot[i] = which spot cup i sits in; the card rides under cup `winner`
  const slot = [...Array(count).keys()];
  const winner = Math.floor(Math.random() * count);
  cupTable.style.width = (count - 1) * CUP_GAP + 150 + 'px';
  cupTable.innerHTML = slot.map(i => `<div class="cup-spot" data-i="${i}">` +
    (i === winner ? `<div class="cup-card">${cardFace(prize, 0, p.attack)}</div>` : '') +
    '<img class="cup" src="sprites/cup.png" alt=""></div>').join('');
  const spots = [...cupTable.querySelectorAll('.cup-spot')];
  const place = (ms = 0) => spots.forEach((s, i) => { s.style.transitionDuration = ms + 'ms'; s.style.left = slot[i] * CUP_GAP + 'px'; });
  place();

  // Highlight the cup with the card and lift it a bit so you can see the card, then drop it and start
  cupsMsg.textContent = `Watch closely! A mystery card is under the glowing cup.`;
  await sleep(300);
  cupTable.classList.add('hide-card'); // the card stays secret until the final reveal
  spots[winner].classList.add('lifted', 'marked');
  sfx('card_pick', 1.1);
  await sleep(1800);
  spots[winner].classList.remove('lifted');
  sfx('card_pick', 0.7);
  await sleep(500);
  spots[winner].classList.remove('marked');
  await sleep(300);

  // Shuffle: swap two cups at a time, getting faster
  cupsMsg.textContent = 'Shuffling...';
  for (let n = 0; n < level.swaps; n++) {
    const ms = Math.max(level.minMs || 220, (520 - n * 40) * (level.speed || 1)); // ULTIMATE shuffles much faster
    const a = Math.floor(Math.random() * count);
    const b = (a + 1 + Math.floor(Math.random() * (count - 1))) % count;
    const ia = slot.indexOf(a), ib = slot.indexOf(b);
    [slot[ia], slot[ib]] = [b, a];
    spots[ia].classList.add('front'); spots[ib].classList.remove('front');
    place(ms);
    sfx('card_pick', 0.8 + n * 0.05, 0.5);
    await sleep(ms + 60);
  }

  // Pick a cup
  cupsMsg.textContent = 'Which cup has the card?';
  cupTable.classList.add('picking');
  const pick = await new Promise(r => spots.forEach((s, i) => s.onclick = () => r(i)));
  cupTable.classList.remove('picking');
  spots.forEach(s => s.onclick = null);
  cupTable.classList.remove('hide-card');
  // Reveal: the other cups lift away one at a time, then a drumroll, then the cup you picked
  spots[pick].classList.add('picked');
  for (const i of spots.map((_, i) => i).filter(i => i !== pick).sort(() => Math.random() - 0.5)) {
    spots[i].classList.add('gone');
    sfx('card_pick', 0.9);
    await sleep(380);
  }
  cupsMsg.textContent = '...';
  spots[pick].classList.add('tease');
  for (let k = 0; k < 10; k++) { sfx('wheel_tick', 1 + k * 0.06); await sleep(70 + k * 8); }
  spots[pick].classList.remove('tease');
  cupTable.classList.add('reveal');
  await sleep(400);
  if (pick === winner) {
    p.hand.push(prize); // already its own object
    gainXp(p, 8 + level.cups * 3);
    cupsMsg.textContent = `You found it! +1 ${prize.name}`;
    sfx('jackpot');
    flash('#ffd23f', 0.5);
    confetti(100);
    haptic(120);
    banner('✨ FOUND IT! ✨', 'legendary');
    burst(spots[pick], ['#ffd23f', '#fff', '#5fd13a'], 30, 1.2);
  } else {
    cupsMsg.textContent = 'Empty! Better luck next time.';
    sfx('fail');
  }
  render();
  await waitGo('Continue');
  cupsEl.hidden = true;
}
