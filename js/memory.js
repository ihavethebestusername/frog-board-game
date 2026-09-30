// Memory Match: flip tiles to pair each math expression with its answer ("7 × 6" ↔ "42").
// 6 pairs, 45 seconds. Then solve an equation made from the answers you matched: right = full reward, wrong = half.

const MEMORY_PAIRS = 6, MEMORY_TIME = 45000;
// A random expression and its value; harder forms unlock as the threat rises
function memoryExpr() {
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const forms = [
    () => { const a = rnd(3, 12), b = rnd(3, 12); return [`${a} × ${b}`, a * b]; },
    () => { const a = rnd(-15, 20), b = rnd(2, 20); return [`${a} + ${b}`, a + b]; },
    () => { const a = rnd(5, 30), b = rnd(6, 35); return [`${a} − ${b}`, a - b]; },
    () => { const a = rnd(2, 12); return [`${a}²`, a * a]; },
    () => { const a = rnd(2, 9), b = rnd(2, 9), c = rnd(1, 15); return [`${a} × ${b} − ${c}`, a * b - c]; },
    () => { const a = rnd(2, 5); return [`${a}³`, a ** 3]; },
  ];
  const unlocked = Math.min(forms.length, 4 + threatLevel());
  return forms[Math.floor(Math.random() * unlocked)]();
}
async function memoryEvent() {
  const p = players[turn];
  // Six pairs with distinct answers
  const pairs = [], seen = new Set();
  while (pairs.length < MEMORY_PAIRS) { const [e, v] = memoryExpr(); if (!seen.has(v)) { seen.add(v); pairs.push({ e, v }); } }
  const tiles = pairs.flatMap((q, i) => [{ pair: i, face: q.e }, { pair: i, face: String(q.v), answer: true }]).sort(() => Math.random() - 0.5);
  const el = document.createElement('div');
  el.className = 'mg-overlay';
  el.innerHTML = `<div class="shop-panel prog-panel prog-wide mem-panel"><h2>🧠 Memory Match</h2>
    <div class="battle-msg">Match each problem with its answer!</div>
    <div class="check-timer"><div class="mem-timer"></div></div>
    <div class="mem-grid">${tiles.map(t => `<div class="mem-tile"><div class="mem-inner"><div class="mem-back">🐸</div>
      <div class="mem-front${t.answer ? ' ans' : ''}">${t.face}</div></div></div>`).join('')}</div>
    <div class="battle-msg mem-msg">0 / ${MEMORY_PAIRS} pairs</div><button class="battle-go" hidden>Continue</button></div>`;
  document.body.appendChild(el);
  const els = [...el.querySelectorAll('.mem-tile')], msg = el.querySelector('.mem-msg'), bar = el.querySelector('.mem-timer');
  let open = [], matched = [], locked = false, over = false;
  const start = performance.now();
  bar.style.transformOrigin = '0 50%';
  (function frame() { // timer bar (transform only)
    if (over) return;
    const left = 1 - (performance.now() - start) / MEMORY_TIME;
    bar.style.transform = `scaleX(${Math.max(0, left)})`;
    if (left <= 0) finish(); else requestAnimationFrame(frame);
  })();
  let finish;
  const done = new Promise(res => finish = () => { if (!over) { over = true; res(); } });
  els.forEach((t, i) => t.onclick = async () => {
    if (over || locked || open.includes(i) || matched.includes(tiles[i].pair)) return;
    t.classList.add('flipped');
    sfx('card_pick', 1.1);
    open.push(i);
    if (open.length < 2) return;
    const [a, b] = open;
    if (tiles[a].pair === tiles[b].pair) {
      matched.push(tiles[a].pair);
      [a, b].forEach(k => { els[k].classList.add('matched'); burst(els[k], ['#5fd13a', '#fff', '#ffd23f'], 14, 0.8); });
      comboSfx(matched.length);
      msg.textContent = `${matched.length} / ${MEMORY_PAIRS} pairs`;
      open = [];
      if (matched.length === MEMORY_PAIRS) { banner('🧠 ALL PAIRS!', 'legendary'); finish(); }
    } else {
      locked = true;
      sfx('fail', 1.3, 0.4);
      await sleep(650);
      [a, b].forEach(k => els[k].classList.remove('flipped'));
      open = [];
      locked = false;
    }
  });
  await done;
  const found = matched.length;
  stat(p, 'minigames');
  let coins = found * 2 + (found === MEMORY_PAIRS ? 6 : 0), xp = found * 2;
  msg.textContent = found ? `Time! ${found} pair${found === 1 ? '' : 's'} found. Now solve the equation to collect!` : 'No pairs found...';
  await sleep(900);
  if (found) {
    // The final equation: 3-4 of the matched answers added and subtracted
    const vals = matched.slice(0, 4).map(i => pairs[i].v);
    let text = `${vals[0]}`, ans = vals[0];
    vals.slice(1).forEach((v, k) => { const plus = k % 2 === 0; text += plus ? ` + ${v < 0 ? `(${v})` : v}` : ` − ${v < 0 ? `(${v})` : v}`; ans += plus ? v : -v; });
    el.hidden = true;
    const right = await solveEquation('🧠 Memory Match', text, ans);
    el.hidden = false;
    if (!right) { coins = Math.ceil(coins / 2); xp = Math.ceil(xp / 2); }
  }
  const got = coins ? gainCoins(p, coins) : 0;
  gainXp(p, xp);
  msg.textContent = got ? `+${got} coins, +${xp} XP` : 'No reward this time.';
  if (got) coinFly(innerWidth / 2, innerHeight / 2, got);
  render();
  const btn = el.querySelector('button');
  btn.hidden = false;
  await new Promise(res => btn.onclick = res);
  el.remove();
}
