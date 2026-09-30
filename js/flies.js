// Frog Math Swarm: flies carry plain numbers (+7, −3...). The operation shown on the side (+, −, ×)
// changes every few seconds; catching a fly applies that operation with the fly's number. Build the biggest number before time runs out.

const fliesEl = document.getElementById('flies');
const flyArena = document.getElementById('flyArena');
const fliesMsg = document.getElementById('fliesMsg');
const fliesGo = document.getElementById('fliesGo');
const flyScoreEl = document.getElementById('flyScore');
const flyTimer = document.getElementById('flyTimer');
const flyAbsBtn = document.getElementById('flyAbs');
const FLY_COUNT = 7;
const FLY_REACH = 35; // how close the tongue tip must land to a fly (px)

// The side operations. Each catch adds `OP fly` to the equation; it is solved with normal order of operations.
const FLY_OPS = [
  { sym: '+', apply: (n, k) => n + k },
  { sym: '−', apply: (n, k) => n - k },
  { sym: '×', apply: (n, k) => n * k },
];
const FLY_POWER_CHANCE = 0.25; // share of flies carrying a square or cube
const FLY_OP_TIME = 4000; // ms before the operation changes
const flyNum = k => (k < 0 ? `(${k})` : `${k}`);
const SUP = { 2: '²', 3: '³', 4: '⁴' };
// How a term's number is written: plain (−3 in brackets) or as a power like 4² or (−2)³
const flyTermStr = t => {
  if (t.paren) return t.str; // golden fly (2 × the equation so far) or Absolute Value (|equation|)
  if (t.x) { const b = t.neg ? '(−x)' : 'x'; return t.e > 1 ? b + SUP[t.e] : b; } // x flies: x, (−x), x², (−x)³...
  return t.pow ? `${flyNum(t.pow[0])}${SUP[t.pow[1]]}` : flyNum(t.value);
};
const FLY_GOLD_MULT = 2;      // golden flies multiply your whole score by this
const FLY_MISS_KEEP = 0.75;   // each missed tongue keeps 75% of your final score (applied after solving)
const FLY_GOLD_CHANCE = 0.02; // chance a new fly is golden (one is also guaranteed each round)
const FLY_X_MAX = 250;       // x is 1–250 each round
const FLY_X_CHANCE = 0.2;    // share of flies that are x

// Random fly number: positive or negative, never 0
// Some flies carry a power instead (4², 3³, (−2)⁴): squares of 2–6, cubes or 4th powers of 2–3
function makeFlyOp(xVal) {
  // x flies: x or −x, sometimes to a power
  if (Math.random() < FLY_X_CHANCE) {
    const neg = Math.random() < 0.4, rr = Math.random();
    const e = rr < 0.55 ? 1 : rr < 0.8 ? 2 : rr < 0.93 ? 3 : 4;
    const value = (neg ? -xVal : xVal) ** e;
    return { value, x: true, neg, e, label: flyTermStr({ x: true, neg, e }), bad: value < 0, isX: true };
  }
  const sign = Math.random() < 0.5 ? -1 : 1;
  if (Math.random() < FLY_POWER_CHANCE) {
    const rr = Math.random(), e = rr < 0.5 ? 2 : rr < 0.8 ? 3 : 4;
    const b = sign * (2 + Math.floor(Math.random() * (e === 2 ? 5 : 2))); // squares of 2–6, cubes and 4th powers of 2–3
    const value = b ** e;
    return { value, pow: [b, e], label: flyTermStr({ pow: [b, e] }), bad: value < 0, power: true };
  }
  const k = (1 + Math.floor(Math.random() * 50)) * sign; // plain numbers: 1–50, positive or negative
  return { value: k, label: k > 0 ? `+${k}` : `−${-k}`, bad: k < 0 };
}
// Value of the built equation with normal order of operations (× before + and −)
function evalFlyEq(terms) {
  let total = 0, prod = terms[0].value;
  for (const t of terms.slice(1)) {
    if (t.sym === '×') prod *= t.value;
    else { total += prod; prod = t.sym === '+' ? t.value : -t.value; }
  }
  return total + prod;
}
const flyEqText = terms => terms.map((t, i) => i ? ` ${t.sym} ${flyTermStr(t)}` : t.paren ? t.str : `${t.value}`).join('');

// Do almost all the math for the player: every × part, power, x, bracket and |…| is worked out into a
// number, then neighbours are combined until only a few numbers are left to add and subtract.
const FLY_SOLVE_TERMS = 3;
function simplifyFlyEq(terms) {
  const nums = []; // one signed number per additive part
  terms.forEach((t, i) => {
    if (i && t.sym === '×') nums[nums.length - 1] *= t.value;
    else nums.push(t.sym === '−' ? -t.value : t.value);
  });
  while (nums.length > FLY_SOLVE_TERMS) {
    const k = Math.floor(Math.random() * (nums.length - 1)); // combine a random neighbouring pair
    nums.splice(k, 2, nums[k] + nums[k + 1]);
  }
  return nums.map((v, i) => i ? (v < 0 ? ` − ${-v}` : ` + ${v}`) : (v < 0 ? `−${-v}` : `${v}`)).join('');
}
// Left-to-right value (ignoring order of operations): a classic wrong answer
const flyLeftToRight = terms => terms.slice(1).reduce((n, t) => FLY_OPS.find(o => o.sym === t.sym).apply(n, t.value), terms[0].value);

async function flyEvent() {
  const p = players[turn];
  // The equation being built: the start number, then one term per fly caught. No running total is shown.
  const terms = [{ value: FLY_START }];
  const xVal = 1 + Math.floor(Math.random() * FLY_X_MAX);
  // Equation at the top, plus whether its value is currently positive or negative (the number itself stays hidden)
  const showEq = () => {
    fliesMsg.innerHTML = `<div class="fly-eq">${flyEqText(terms)}</div>`;
    const v = evalFlyEq(terms);
    flyScoreEl.className = 'fly-score fly-sign ' + (v > 0 ? 'pos' : v < 0 ? 'neg' : 'zero');
    flyScoreEl.textContent = v > 0 ? '▲ POSITIVE' : v < 0 ? '▼ NEGATIVE' : '● ZERO';
  };
  flyScoreEl.textContent = ''; flyScoreEl.className = 'fly-score';
  flyArena.innerHTML = '<div class="fly-frog"><img src="sprites/frog_standing.png" alt=""></div><div class="fly-tongue"></div>' +
    '<div class="fly-side"><div class="fly-side-label">operation</div><div class="fly-side-op" id="flyOp"></div><div class="fly-side-bar"><div></div></div></div>' +
    `<div class="fly-side fly-side-x"><div class="fly-side-label">value of</div><div class="fly-side-op">x</div><div class="fly-x-val">= ${xVal}</div></div>`;
  const opEl = flyArena.querySelector('#flyOp'), opBar = flyArena.querySelector('.fly-side-bar div');
  let curOp = FLY_OPS[0], opSince = 0;
  const setOp = () => {
    curOp = FLY_OPS.filter(o => o !== curOp)[Math.floor(Math.random() * (FLY_OPS.length - 1))];
    opEl.textContent = curOp.sym;
    opEl.classList.remove('pop'); void opEl.offsetWidth; opEl.classList.add('pop');
  };
  setOp();
  const frog = flyArena.querySelector('.fly-frog'), tongue = flyArena.querySelector('.fly-tongue');
  flyTimer.style.width = '100%';
  flyTimer.style.transformOrigin = '0 50%';
  flyTimer.style.transform = 'scaleX(1)';
  flyTimer.parentElement.hidden = false;
  fliesMsg.textContent = `Start at ${FLY_START}. Catch number flies: the operation on the side is applied with the fly's number, and it keeps changing. At the end you solve the equation you built: get it right to win coins!`;
  fliesEl.hidden = false;
  await new Promise(r => { fliesGo.hidden = false; fliesGo.textContent = 'Start'; fliesGo.onclick = r; });
  fliesGo.hidden = true;
  showEq();

  const W = flyArena.clientWidth, H = flyArena.clientHeight;
  const frogX = W / 2, frogY = H - 40;
  const flies = [];
  let busyTongue = false;
  let goldenSeen = false;
  function spawn(golden = Math.random() < FLY_GOLD_CHANCE) {
    if (golden && flies.some(g => g.op.golden && !g.caught)) golden = false; // one golden fly at a time
    if (golden) goldenSeen = true;
    const op = golden ? { golden: true, label: `×${FLY_GOLD_MULT}` } : makeFlyOp(xVal);
    const el = document.createElement('div');
    el.className = 'fly' + (op.golden ? ' golden' : op.isX ? ' xfly' : op.power ? ' power' : op.bad ? ' bad' : '');
    el.innerHTML = `<span class="bug">🪰</span><span class="op">${op.label}</span>`;
    // Flies drift slowly left or right in their own lane
    const speed = (op.golden ? 2 : 1) + Math.random() * 0.8; // golden flies are quicker
    const f = { el, op, x: 110 + Math.random() * (W - 220), y: 25 + Math.random() * (H - 150),
                vx: Math.random() < 0.5 ? speed : -speed };
    flyArena.appendChild(el);
    flies.push(f);
  }
  // Click anywhere: the tongue shoots to the cursor and grabs the nearest fly at its tip, if any
  let running = false;
  flyArena.onclick = async e => {
    if (!running || busyTongue) return;
    busyTongue = true;
    const box = flyArena.getBoundingClientRect();
    const tx = e.clientX - box.left, ty = e.clientY - box.top;
    const dx = tx - frogX, dy = ty - frogY;
    Object.assign(tongue.style, { left: frogX + 'px', top: frogY + 'px', transform: `rotate(${Math.atan2(dy, dx)}rad)`, width: Math.hypot(dx, dy) + 'px' });
    sfx('card_pick', 1.3);
    await sleep(120);
    let f = null, best = FLY_REACH;
    for (const g of flies) {
      const d = Math.hypot(g.x - tx, g.y - ty);
      if (!g.caught && d < best) { best = d; f = g; }
    }
    if (f) { f.caught = true; await catchFly(f); }
    else { tongue.style.width = '0px'; missPenalty(tx, ty); await sleep(120); } // missed
    busyTongue = false;
  };
  // Pull a caught fly in and apply its operation
  // Catches less than 1.5s apart chain into a combo, each one a note higher
  let chain = 0, lastCatch = 0;
  async function catchFly(f) {
    const now = performance.now();
    chain = now - lastCatch < 1500 ? chain + 1 : 1;
    lastCatch = now;
    if (chain >= 2) comboSfx(chain - 1);
    tongue.style.width = '0px';
    Object.assign(f.el.style, { transition: 'left 0.12s, top 0.12s, opacity 0.12s', left: frogX + 'px', top: frogY + 'px', opacity: 0 });
    if (f.op.golden) {
      // Golden fly: the whole equation so far is multiplied by FLY_GOLD_MULT
      const inner = terms.slice();
      terms.splice(0, terms.length, { paren: inner, value: evalFlyEq(inner) * FLY_GOLD_MULT,
        str: `${FLY_GOLD_MULT} × (${flyEqText(inner)})` });
      burst(frog, ['#ffd23f', '#fff', '#ffb000'], 30, 1.3);
      flash('#ffd23f', 0.3);
    } else terms.push({ sym: curOp.sym, value: f.op.value, pow: f.op.pow, x: f.op.x, neg: f.op.neg, e: f.op.e });
    showEq();
    const pop = document.createElement('div');
    pop.className = 'fly-pop' + (f.op.bad ? ' lose' : '');
    if (chain >= 2) pop.classList.add('combo');
    pop.textContent = (chain >= 2 ? `COMBO x${chain}  ` : '') + (f.op.golden ? `×${FLY_GOLD_MULT} SCORE!` : `${curOp.sym} ${flyTermStr(f.op)}`);
    Object.assign(pop.style, { left: frogX + 'px', top: frogY - 60 + 'px' });
    flyArena.appendChild(pop);
    setTimeout(() => pop.remove(), 900);
    sfx('card_pick', 1.1, 0.7);
    await sleep(130);
    f.el.remove();
    flies.splice(flies.indexOf(f), 1);
    if (running) spawn();
  }
  // Missing with the tongue costs 25% of your final score. It's kept out of the equation and applied after solving.
  let misses = 0;
  function missPenalty(x, y) {
    misses++;
    const pop = document.createElement('div');
    pop.className = 'fly-pop lose';
    pop.textContent = 'MISS! −25%';
    Object.assign(pop.style, { left: x + 'px', top: y + 'px' });
    flyArena.appendChild(pop);
    setTimeout(() => pop.remove(), 900);
    sfx('fail', 1.2, 0.5);
  }
  // Absolute Value item: wrap the whole equation in | | so it's positive.
  // The button sits inside the play area (so it's always on screen); A on the keyboard works too.
  flyArena.appendChild(flyAbsBtn);
  const showAbs = () => {
    flyAbsBtn.hidden = !running || !p.absValues;
    flyAbsBtn.textContent = `|x| Absolute Value (${p.absValues || 0}) [A]`;
  };
  const useAbs = () => {
    if (!running || !p.absValues) return;
    p.absValues--;
    const inner = terms.slice();
    terms.splice(0, terms.length, { paren: inner, value: Math.abs(evalFlyEq(inner)),
      str: `|${flyEqText(inner)}|` });
    showEq();
    sfx('card_land_gimmick');
    burst(flyScoreEl, ['#1e9e3a', '#fff', '#b4ff8a'], 20, 1);
    showAbs();
  };
  flyAbsBtn.onclick = e => { e.stopPropagation(); useAbs(); }; // don't also fire the tongue
  const absKey = e => { if (e.key === 'a' || e.key === 'A') useAbs(); };
  window.addEventListener('keydown', absKey);
  for (let i = 0; i < FLY_COUNT; i++) spawn();

  // Buzz around, bouncing off the walls, until time runs out
  running = true;
  showAbs();
  const start = performance.now();
  const goldenAt = start + FLY_TIME * (0.2 + Math.random() * 0.5); // guaranteed golden fly by now
  opSince = start;
  await new Promise(done => {
    (function frame() {
      const left = 1 - (performance.now() - start) / FLY_TIME;
      flyTimer.style.transform = `scaleX(${Math.max(0, left)})`; // transform: no layout work each frame
      const now = performance.now();
      if (now - opSince > FLY_OP_TIME) { opSince = now; setOp(); sfx('card_pick', 0.6); }
      if (!goldenSeen && now > goldenAt - 1000 && !flyArena.classList.contains('gold-tease')) {
        flyArena.classList.add('gold-tease'); // a second of shimmer before the guaranteed golden fly
        sfx('celebrate', 1.4, 0.4);
      }
      if (!goldenSeen && now > goldenAt) { flyArena.classList.remove('gold-tease'); spawn(true); }
      opBar.style.width = (1 - (now - opSince) / FLY_OP_TIME) * 100 + '%';
      for (const f of flies) {
        if (f.caught) continue;
        f.x += f.vx;
        if (f.x < 110 || f.x > W - 110) { f.vx *= -1; f.x = Math.max(110, Math.min(W - 110, f.x)); }
        f.el.style.left = f.x + 'px'; f.el.style.top = f.y + 'px';
        f.el.classList.toggle('flip', f.vx < 0);
      }
      if (left > 0) requestAnimationFrame(frame); else done();
    })();
  });
  running = false;
  showAbs();
  window.removeEventListener('keydown', absKey);
  flies.forEach(f => f.caught = true);
  while (busyTongue) await sleep(50);

  // Solve it: a simplified version of the equation as a multiple-choice question
  const num = evalFlyEq(terms);
  const text = simplifyFlyEq(terms);
  fliesMsg.innerHTML = `<div class="fly-eq">${flyEqText(terms)}</div>Time! Now solve it...`;
  await sleep(900);
  const choices = new Set([num]);
  const wrong = flyLeftToRight(terms);
  if (wrong !== num) choices.add(wrong);
  if (num) choices.add(-num);
  // Wrong choices are well away from the answer so they're easier to rule out
  const far = Math.max(10, Math.abs(num));
  while (choices.size < 4) choices.add(num + (Math.random() < 0.5 ? -1 : 1) * Math.round(far * (0.3 + Math.random() * 0.5) + 5));
  const q = { text: `${text} = ?`, answer: num, choices: [...choices].sort(() => Math.random() - 0.5) };
  flyTimer.parentElement.hidden = true; // no timer while solving
  // Answers go where the game was played; no timer. The secret corner hint still shows the right colour.
  fliesMsg.innerHTML = `<div class="fly-eq">${q.text}</div><div class="fly-solve">Solve it! Most of the math is already done for you. Just add and subtract</div>`;
  flyArena.innerHTML = '<div class="fly-choices">' + q.choices.map((c, i) =>
    `<button class="quiz-choice" style="--c:${QUIZ_COLORS[i]}">${c}</button>`).join('') + '</div>';
  const cheat = document.getElementById('quizCheat');
  cheat.textContent = '';
  cheat.style.background = QUIZ_COLORS[q.choices.indexOf(num)];
  document.body.classList.toggle('cheats', !!p.cheats);
  document.body.classList.add('fly-solving');
  const buttons = [...flyArena.querySelectorAll('button')];
  const correct = await new Promise(r => buttons.forEach(btn => btn.onclick = () => {
    const ok = +btn.textContent === num;
    buttons.forEach(x => { x.disabled = true; if (+x.textContent === num) x.classList.add('right'); });
    if (!ok) btn.classList.add('wrong');
    onAnswer(ok);
    r(ok);
  }));
  document.body.classList.remove('fly-solving');
  // Missed tongues shave 25% each off the score you cash in
  const score = Math.round(num * FLY_MISS_KEEP ** misses);
  const coins = correct ? gainCoins(p, flyCoins(score)) : 0;
  stat(p, 'minigames');
  if (correct) gainXp(p, 8);
  fliesMsg.innerHTML = `<div class="fly-eq">${text} = <b>${num.toLocaleString()}</b></div>` +
    (misses ? `<div class="lose-text">${misses} miss${misses === 1 ? '' : 'es'}: −25% each → score ${score.toLocaleString()}</div>` : '') +
    (correct ? `Correct! ` + (coins ? `+${coins} coins` : '<span class="lose-text">not enough for any coins</span>')
             : '<span class="lose-text">Wrong! No coins.</span>');
  if (coins) { sfx('coin', 0.9 + Math.min(coins, 15) * 0.03); coinFly(innerWidth / 2, innerHeight / 2, coins); }
  if (coins >= 20) { sfx('jackpot'); confetti(90); }
  else sfx('fail');
  render();
  await new Promise(r => { fliesGo.hidden = false; fliesGo.textContent = 'Continue'; fliesGo.onclick = r; });
  fliesEl.hidden = true;
}
