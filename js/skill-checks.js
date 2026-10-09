// Coin and card-draw events with their math-quiz minigames.

// Run the coin skill check for the current player and pay out
async function coinEvent(range) {
  const p = players[turn];
  const result = Math.max(-p.coins, await skillCheck(range)); // negative = lost coins (never below 0)
  // Winnings are boosted by the Money stat; losses aren't
  const sm = streakMult(p) * (swampActive('golden') ? 2 : 1); // answer streak x2 / x3, Golden Hour x2
  const amt = result > 0 ? gainCoins(p, result * sm) : (p.coins += result, result);
  if (amt > 0) { sfx('coin', 0.85 + amt * 0.04); coinFly(innerWidth / 2, innerHeight / 2, amt); }
  if (amt >= 15) { sfx('jackpot', 1, 0.7); confetti(50); }
  const [cx, cy] = center(p);
  const pop = document.createElement('div');
  pop.className = 'popup' + (amt < 0 ? ' lose' : '');
  pop.textContent = (amt < 0 ? '' : '+') + amt + (amt > 0 && sm > 1 ? ` 🔥x${sm}` : '');
  pop.style.fontSize = Math.min(64, 22 + Math.abs(amt) * 2) + 'px'; // bigger wins, bigger numbers
  Object.assign(pop.style, { left: cx + 'px', top: cy + 'px' });
  world.appendChild(pop);
  setTimeout(() => pop.remove(), 1000);
  render();
  await sleep(600);
}

// Draw-cards event: streak skill check, then cards fly from the deck to the player
async function cardEvent(maxCards = CARDS_PER_SQUARE) {
  const p = players[turn];
  const right = await drawCheck(maxCards);
  // All 4 right: you may buy a card pack to draw from (packs.js); otherwise the cards come from the deck
  const pack = right === maxCards && maxCards >= CARDS_PER_SQUARE ? await choosePack(p) : null;
  const got = pack ? right : Math.min(right, deck.length);
  const picks = got ? await pickCards(p, got, pack) : []; // each card earned is a choice of 3 (progression.js)
  const [px, py] = center(p);
  for (let i = 0; i < picks.length; i++) {
    const fc = document.createElement('div');
    fc.className = 'flying-card';
    Object.assign(fc.style, { left: DECK_POS[0] + 'px', top: DECK_POS[1] + 'px' });
    world.appendChild(fc);
    p.hand.push(picks[i]);
    render();
    requestAnimationFrame(() => requestAnimationFrame(() =>
      Object.assign(fc.style, { left: px + 'px', top: py + 'px', opacity: 0.2 })));
    setTimeout(() => fc.remove(), 550);
    await sleep(250);
  }
  render();
  await sleep(500);
}

// Four answer choices for any number: the answer plus tempting near-misses
function choicesFor(answer) {
  const choices = new Set([answer]);
  if (answer) choices.add(-answer);
  const spread = Math.max(4, Math.round(Math.abs(answer) * 0.15));
  while (choices.size < 4) choices.add(answer + (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * spread)));
  return [...choices].sort(() => Math.random() - 0.5);
}
// End-of-minigame equation (Memory Match, Lily Pad Hop): right = full reward, wrong = half
function solveEquation(title, text, answer) {
  return quizPanel('', title, 'Solve it to collect your full reward! (Wrong = half.)', async result => {
    const res = await askQuestion({ text: `${text} = ?`, answer, choices: choicesFor(answer) }, 25000);
    result.textContent = res.correct ? 'Correct! Full reward.' : `It was ${answer}. Half reward.`;
    if (!res.correct) sfx('fail');
    return res.correct;
  });
}

// --- Math quiz: multiple-choice +, − and × questions and "find x" equations. The answer is hidden in tiny text in the corner. ---

// Make a 7th-grade question: negative numbers, order of operations, 2-step problems using only +, − and ×,
// and equations to solve for x (one step, two steps, x on both sides). `level` 0..1 picks harder forms for bigger rewards.
const QUIZ_COLORS = ['#d42020', '#2a6ad1', '#1e9e3a', '#e0b000']; // red, blue, green, yellow

function makeQuestion(level) {
  const rnd = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  const neg = n => (Math.random() < 0.5 ? -n : n);            // randomly flip the sign
  const show = n => (n < 0 ? `(${n})` : `${n}`);              // wrap negatives in brackets
  // For "find x" equations: 3x, -x, x and "+ 5" / "− 5"
  const xTerm = a => (a === 1 ? 'x' : a === -1 ? '-x' : `${a}x`);
  const plusTerm = b => (b < 0 ? ` − ${-b}` : ` + ${b}`);
  // Each form returns [question text, answer, a tempting wrong answer from a classic mistake, extra seconds];
  // "find x" forms return the whole question (Find x: ...), the others get " = ?" added
  const forms = [
    // Integer addition/subtraction with negatives: -14 + 9, 7 - (-12)
    () => { const a = neg(rnd(5, 30)), b = neg(rnd(5, 30)), plus = Math.random() < 0.5;
            return plus ? [`${a} + ${show(b)}`, a + b, a - b] : [`${a} − ${show(b)}`, a - b, a + b]; },
    // Find x, one step: x + 7 = -3, x − 12 = 5  (mistake: doing the same operation instead of undoing it)
    () => { const x = neg(rnd(2, 20)), b = neg(rnd(2, 20));
            return [`Find x: x${plusTerm(b)} = ${x + b}`, x, x + 2 * b, 1]; },
    // Multiplying integers: -8 × 7, (-6) × (-9)
    () => { const a = neg(rnd(3, 12)), b = neg(rnd(3, 12));
            return [`${show(a)} × ${show(b)}`, a * b, -a * b]; },
    // Find x, multiplying: -4x = 28  (mistake: losing the sign)
    () => { const x = neg(rnd(2, 12)), a = neg(rnd(2, 9));
            return [`Find x: ${xTerm(a)} = ${a * x}`, x, -x, 1]; },
    // Order of operations: 5 + 3 × (-4)  (mistake: working left to right)
    () => { const a = neg(rnd(2, 20)), b = rnd(2, 9), c = neg(rnd(2, 9));
            return [`${a} + ${b} × ${show(c)}`, a + b * c, (a + b) * c]; },
    // Brackets first: (12 − 19) × 3
    () => { const a = rnd(2, 20), b = rnd(2, 25), c = neg(rnd(2, 9));
            return [`(${a} − ${b}) × ${show(c)}`, (a - b) * c, a - b * c]; },
    // Two-digit × one-digit with a step: 23 × 4 − 57
    () => { const a = rnd(12, 35), b = rnd(3, 9), c = rnd(10, 90);
            return [`${a} × ${b} − ${c}`, a * b - c, a * (b - c)]; },
    // Find x, two steps: 3x − 5 = 16  (mistake: undoing the − 5 the wrong way first)
    () => { const x = neg(rnd(1, 10)), a = neg(rnd(2, 9)), b = neg(rnd(2, 20));
            const wrong = (a * x + 2 * b) / a;
            return [`Find x: ${xTerm(a)}${plusTerm(b)} = ${a * x + b}`, x, Number.isInteger(wrong) ? wrong : -x, 3]; },
    // Three terms with negatives: -6 × 4 − (-3) × 5
    () => { const a = neg(rnd(2, 9)), b = rnd(2, 9), c = neg(rnd(2, 9)), d = rnd(2, 9);
            return [`${show(a)} × ${b} − ${show(c)} × ${d}`, a * b - c * d, a * b + c * d]; },
    // Find x on both sides: 5x + 3 = 2x − 9  (mistake: adding the x terms instead of subtracting)
    () => { const x = neg(rnd(1, 9)), a = rnd(2, 9), c = (() => { let c; do c = neg(rnd(1, 8)); while (c === a); return c; })(), b = neg(rnd(1, 15));
            const d = a * x + b - c * x, wrong = (d - b) / (a + c);
            return [`Find x: ${xTerm(a)}${plusTerm(b)} = ${xTerm(c)}${d ? plusTerm(d) : ''}`, x, a + c && Number.isInteger(wrong) ? wrong : -x, 5]; },
  ];
  // Easier squares use the first forms; harder squares unlock the multi-step ones
  const unlocked = 2 + Math.round(level * (forms.length - 2));
  const [text, answer, trap, extra = 0] = forms[Math.floor(Math.random() * unlocked)]();
  const choices = new Set([answer]);
  if (trap !== answer) choices.add(trap);
  choices.add(-answer || answer + 1);                          // sign slip
  while (choices.size < 4) choices.add(answer + neg(rnd(1, Math.max(3, Math.round(Math.abs(answer) * 0.25)))));
  return { text: text.startsWith('Find x') ? text : `${text} = ?`, answer, extraMs: extra * 1000, // equations get a little more time
           choices: [...choices].slice(0, 4).sort(() => Math.random() - 0.5) };
}

// Show one question in the #check panel. Resolves with { correct, timeLeft (0..1) }.
function askQuestion(q, timeLimit, player = players[turn]) {
  const qEl = document.getElementById('quizQuestion');
  const grid = document.getElementById('quizChoices');
  const cheat = document.getElementById('quizCheat');
  const timerBar = document.getElementById('timerBar');
  qEl.textContent = q.text;
  // Each answer button gets its own color; the secret corner hint is just a square of the right one's color
  grid.innerHTML = q.choices.map((c, i) => `<button class="quiz-choice" style="--c:${QUIZ_COLORS[i]}">${c}</button>`).join('');
  cheat.textContent = '';
  cheat.style.background = QUIZ_COLORS[q.choices.indexOf(q.answer)];
  return new Promise(resolve => {
    timeLimit += 2000 * perkCount(player, 'fast') + (q.extraMs || 0); // Fast Fingers perk, extra time for "find x"
    const start = performance.now();
    let finished = false;
    const finish = (correct, btn) => {
      if (finished) return;
      finished = true;
      const timeLeft = Math.max(0, 1 - (performance.now() - start) / timeLimit);
      grid.querySelectorAll('button').forEach(b => {
        b.disabled = true;
        if (+b.textContent === q.answer) b.classList.add('right');
      });
      if (btn && !correct) btn.classList.add('wrong');
      onAnswer(correct, player);
      if (correct) { gainXp(player, 2); questEvent(player, 'answer'); }
      resolve({ correct, timeLeft });
    };
    // Timer bar shrinks with a transform (no layout work), once per frame until answered or out of time
    timerBar.style.width = '100%';
    timerBar.style.transformOrigin = '0 50%';
    (function frame() {
      if (finished) return;
      const left = 1 - (performance.now() - start) / timeLimit;
      timerBar.style.transform = `scaleX(${Math.max(0, left)})`;
      if (left <= 0) finish(false); else requestAnimationFrame(frame);
    })();
    grid.querySelectorAll('button').forEach(b => b.onclick = () => finish(+b.textContent === q.answer, b));
  });
}

// Open the quiz panel with a title/icon, run `body`, then wait for Collect
async function quizPanel(icon, title, hint, body, player = players[turn]) {
  const el = document.getElementById('check');
  const result = document.getElementById('checkResult');
  const btn = document.getElementById('checkBtn');
  document.getElementById('checkIcon').src = icon;
  document.getElementById('checkTitle').textContent = title;
  document.getElementById('quizHint').textContent = hint;
  document.getElementById('quizPips').innerHTML = '';
  document.body.classList.toggle('cheats', !!player.cheats); // answer only shows for a player who unlocked it
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
  return quizPanel('', 'Draw cards', `Each right answer draws a card. A wrong answer ends it and costs ${WRONG_CARD_PENALTY} coins!` +
    (maxCards >= CARDS_PER_SQUARE ? ` Get all ${maxCards} right to choose a card pack!` : ''), async result => {
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

// Battle skill check card: one question. Right answer deals damage scaled by speed (up to 2x);
// wrong or too slow returns a negative number = how much the foe heals.
function battleCheck(p, card, base) {
  return quizPanel('', `🧠 ${card.name}`, `Answer fast for up to ${base * 2} damage! Get it wrong and the foe heals ${base}.`, async result => {
    const { correct, timeLeft } = await askQuestion(makeQuestion(0.5), 10000, p);
    if (!correct) {
      sfx('fail');
      result.innerHTML = `${timeLeft <= 0 ? 'Too slow!' : 'Wrong!'} <span class="lose-text">Foe heals ${base}</span>`;
      return -base;
    }
    const dmg = Math.max(1, Math.round(base * 2 * timeLeft));
    sfx('card_pick', 0.9 + timeLeft * 0.5);
    result.textContent = (timeLeft > 0.6 ? 'Lightning fast! ' : 'Correct! ') + `${dmg} damage`;
    return dmg;
  }, p);
}
