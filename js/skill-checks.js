// Coin and card-draw events with their math-quiz minigames.

// Run the coin skill check for the current player and pay out
async function coinEvent(range) {
  const p = players[turn];
  const amt = Math.max(-p.coins, await skillCheck(range)); // negative = lost coins (never below 0)
  p.coins += amt;
  if (amt > 0) sfx('coin', 0.85 + amt * 0.04);
  const [cx, cy] = center(p);
  const pop = document.createElement('div');
  pop.className = 'popup' + (amt < 0 ? ' lose' : '');
  pop.textContent = (amt < 0 ? '' : '+') + amt;
  Object.assign(pop.style, { left: cx + 'px', top: cy + 'px' });
  world.appendChild(pop);
  setTimeout(() => pop.remove(), 1000);
  render();
  await sleep(600);
}

// Draw-cards event: streak skill check, then cards fly from the deck to the player
async function cardEvent(maxCards = CARDS_PER_SQUARE) {
  const p = players[turn];
  const got = Math.min(await drawCheck(maxCards), deck.length);
  const [px, py] = center(p);
  for (let i = 0; i < got; i++) {
    const fc = document.createElement('div');
    fc.className = 'flying-card';
    Object.assign(fc.style, { left: DECK_POS[0] + 'px', top: DECK_POS[1] + 'px' });
    world.appendChild(fc);
    p.hand.push(deck.pop());
    render();
    requestAnimationFrame(() => requestAnimationFrame(() =>
      Object.assign(fc.style, { left: px + 'px', top: py + 'px', opacity: 0.2 })));
    setTimeout(() => fc.remove(), 550);
    await sleep(250);
  }
  render();
  await sleep(500);
}

// --- Math quiz: multiple-choice +, − and × questions. The answer is hidden in tiny text in the corner. ---

// Make a 7th-grade question: negative numbers, order of operations and 2-step problems using
// only +, − and ×. `level` 0..1 picks harder forms for bigger rewards.
function makeQuestion(level) {
  const rnd = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  const neg = n => (Math.random() < 0.5 ? -n : n);            // randomly flip the sign
  const show = n => (n < 0 ? `(${n})` : `${n}`);              // wrap negatives in brackets
  // Each form returns [question text, answer, a tempting wrong answer from a classic mistake]
  const forms = [
    // Integer addition/subtraction with negatives: -14 + 9, 7 - (-12)
    () => { const a = neg(rnd(5, 30)), b = neg(rnd(5, 30)), plus = Math.random() < 0.5;
            return plus ? [`${a} + ${show(b)}`, a + b, a - b] : [`${a} − ${show(b)}`, a - b, a + b]; },
    // Multiplying integers: -8 × 7, (-6) × (-9)
    () => { const a = neg(rnd(3, 12)), b = neg(rnd(3, 12));
            return [`${show(a)} × ${show(b)}`, a * b, -a * b]; },
    // Order of operations: 5 + 3 × (-4)  (mistake: working left to right)
    () => { const a = neg(rnd(2, 20)), b = rnd(2, 9), c = neg(rnd(2, 9));
            return [`${a} + ${b} × ${show(c)}`, a + b * c, (a + b) * c]; },
    // Brackets first: (12 − 19) × 3
    () => { const a = rnd(2, 20), b = rnd(2, 25), c = neg(rnd(2, 9));
            return [`(${a} − ${b}) × ${show(c)}`, (a - b) * c, a - b * c]; },
    // Two-digit × one-digit with a step: 23 × 4 − 57
    () => { const a = rnd(12, 35), b = rnd(3, 9), c = rnd(10, 90);
            return [`${a} × ${b} − ${c}`, a * b - c, a * (b - c)]; },
    // Three terms with negatives: -6 × 4 − (-3) × 5
    () => { const a = neg(rnd(2, 9)), b = rnd(2, 9), c = neg(rnd(2, 9)), d = rnd(2, 9);
            return [`${show(a)} × ${b} − ${show(c)} × ${d}`, a * b - c * d, a * b + c * d]; },
  ];
  // Easier squares use the first forms; harder squares unlock the multi-step ones
  const unlocked = 2 + Math.round(level * (forms.length - 2));
  const [text, answer, trap] = forms[Math.floor(Math.random() * unlocked)]();
  const choices = new Set([answer]);
  if (trap !== answer) choices.add(trap);
  choices.add(-answer || answer + 1);                          // sign slip
  while (choices.size < 4) choices.add(answer + neg(rnd(1, Math.max(3, Math.round(Math.abs(answer) * 0.25)))));
  return { text: `${text} = ?`, answer, choices: [...choices].slice(0, 4).sort(() => Math.random() - 0.5) };
}

// Show one question in the #check panel. Resolves with { correct, timeLeft (0..1) }.
function askQuestion(q, timeLimit) {
  const qEl = document.getElementById('quizQuestion');
  const grid = document.getElementById('quizChoices');
  const cheat = document.getElementById('quizCheat');
  const timerBar = document.getElementById('timerBar');
  qEl.textContent = q.text;
  cheat.textContent = q.answer;
  grid.innerHTML = q.choices.map(c => `<button class="quiz-choice">${c}</button>`).join('');
  return new Promise(resolve => {
    const start = performance.now();
    let finished = false;
    const finish = (correct, btn) => {
      if (finished) return;
      finished = true;
      clearInterval(tick);
      const timeLeft = Math.max(0, 1 - (performance.now() - start) / timeLimit);
      grid.querySelectorAll('button').forEach(b => {
        b.disabled = true;
        if (+b.textContent === q.answer) b.classList.add('right');
      });
      if (btn && !correct) btn.classList.add('wrong');
      resolve({ correct, timeLeft });
    };
    const tick = setInterval(() => {
      const left = 1 - (performance.now() - start) / timeLimit;
      timerBar.style.width = Math.max(0, left * 100) + '%';
      if (left <= 0) finish(false);
    }, 30);
    grid.querySelectorAll('button').forEach(b => b.onclick = () => finish(+b.textContent === q.answer, b));
  });
}

// Open the quiz panel with a title/icon, run `body`, then wait for Collect
async function quizPanel(icon, title, hint, body) {
  const el = document.getElementById('check');
  const result = document.getElementById('checkResult');
  const btn = document.getElementById('checkBtn');
  document.getElementById('checkIcon').src = icon;
  document.getElementById('checkTitle').textContent = title;
  document.getElementById('quizHint').textContent = hint;
  document.getElementById('quizPips').innerHTML = '';
  document.body.classList.toggle('cheats', !!players[turn].cheats); // answer only shows for a player who unlocked it
  result.textContent = '';
  btn.hidden = true;
  el.hidden = false;
  const value = await body(result);
  btn.hidden = false;
  btn.textContent = 'Collect';
  await new Promise(r => btn.onclick = r);
  el.hidden = true;
  return value;
}

// Coins: one question. Right answer pays more the faster you are; wrong or too slow pays the minimum.
function skillCheck(range) {
  const [min, max] = range;
  const level = Math.min(1, Math.max(0, (max - 3) / 9));
  return quizPanel(coinIcon(range), `${min}–${max} coins`, 'Answer fast for the most coins! Get it wrong and you LOSE coins.', async result => {
    const { correct, timeLeft } = await askQuestion(makeQuestion(level), 9000 + level * 6000); // harder questions get more time
    if (!correct) {
      // Wrong or too slow: lose coins
      const loss = Math.min(players[turn].coins, Math.ceil(max / 2));
      sfx('fail');
      result.innerHTML = `${timeLeft <= 0 ? 'Too slow!' : 'Wrong!'} <span class="lose-text">−${loss} coins</span>`;
      return -loss;
    }
    const amount = min + Math.round((max - min) * Math.min(1, 0.4 + timeLeft));
    sfx('coin', 0.9 + timeLeft * 0.4);
    result.textContent = (timeLeft > 0.6 ? 'Lightning fast! ' : 'Correct! ') + `+${amount} coins`;
    return amount;
  });
}

// Cards: a streak of questions. Each right answer draws a card; one wrong answer (or running out of time) ends it.
function drawCheck(maxCards) {
  return quizPanel('', 'Draw cards', `Each right answer draws a card. A wrong answer ends it and costs ${WRONG_CARD_PENALTY} coins!`, async result => {
    const pips = document.getElementById('quizPips');
    pips.innerHTML = '<span></span>'.repeat(maxCards);
    let got = 0, lost = 0;
    for (let round = 0; round < maxCards; round++) {
      const { correct } = await askQuestion(makeQuestion(Math.min(1, round * 0.25)), 12000 - round * 1000);
      pips.children[round].className = correct ? 'got' : 'miss';
      if (!correct) {
        // Wrong or too slow: the streak ends and it costs coins
        sfx('fail');
        lost = Math.min(players[turn].coins, WRONG_CARD_PENALTY);
        players[turn].coins -= lost;
        render();
        break;
      }
      got++;
      sfx('card_pick', 0.9 + round * 0.12);
      result.textContent = 'Correct! +1';
      if (round < maxCards - 1) await sleep(600);
    }
    result.innerHTML = (got === maxCards ? 'Full hand! ' : got ? 'Missed! ' : 'No cards! ') + `+${got} card${got === 1 ? '' : 's'}` +
      (lost ? ` <span class="lose-text">−${lost} coins</span>` : '');
    return got;
  });
}
