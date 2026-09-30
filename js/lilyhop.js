// Lily Pad Hop: a needle sweeps a timing bar; tap (or press space) while it's in the green zone to hop to the
// next lily pad. Each pad has a term (+4, ×2, −3) that's added to your equation. A miss = splash, game over.
// At the end you solve the equation you built: right = full reward, wrong = half.

const HOP_PADS = 8, HOP_START = 5;
function hopTerm(i) {
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const r = Math.random();
  if (r < 0.25 && i > 0) return { sym: '×', value: rnd(2, 4) };
  if (r < 0.6) return { sym: '+', value: rnd(2, 12) };
  return { sym: '−', value: rnd(1, 9) };
}
async function hopEvent() {
  const p = players[turn];
  const terms = [{ value: HOP_START }], pads = Array.from({ length: HOP_PADS }, (_, i) => hopTerm(i));
  const el = document.createElement('div');
  el.className = 'mg-overlay';
  el.innerHTML = `<div class="shop-panel prog-panel prog-wide hop-panel"><h2>🪷 Lily Pad Hop</h2>
    <div class="battle-msg hop-eq">${HOP_START}</div>
    <div class="hop-pond">${pads.map((t, i) => `<div class="hop-pad" style="left:${8 + i * 11.5}%">${t.sym}${t.value}</div>`).join('')}
      <div class="hop-frog">🐸</div></div>
    <div class="hop-bar"><div class="hop-zone"></div><div class="hop-perfect"></div><div class="hop-needle"></div></div>
    <div class="battle-msg hop-msg">Tap (or press space) when the needle is in the green!</div>
    <button class="battle-go hop-tap">HOP!</button></div>`;
  document.body.appendChild(el);
  const frog = el.querySelector('.hop-frog'), needle = el.querySelector('.hop-needle'), zone = el.querySelector('.hop-zone'),
        perfect = el.querySelector('.hop-perfect'), msg = el.querySelector('.hop-msg'), eq = el.querySelector('.hop-eq'),
        padEls = [...el.querySelectorAll('.hop-pad')], tap = el.querySelector('.hop-tap'), bar = el.querySelector('.hop-bar');
  let hops = 0, over = false, pos = 0, dir = 1, speed = 0.9, zoneAt = 0.4, zoneW = 0.22, last = performance.now();
  const placeZone = () => {
    zoneW = Math.max(0.1, 0.22 - hops * 0.015);
    zoneAt = 0.1 + Math.random() * (0.8 - zoneW);
    zone.style.left = zoneAt * 100 + '%'; zone.style.width = zoneW * 100 + '%';
    perfect.style.left = (zoneAt + zoneW * 0.35) * 100 + '%'; perfect.style.width = zoneW * 30 + '%';
  };
  placeZone();
  const W = () => bar.clientWidth;
  (function frame(t) { // the needle sweeps back and forth, faster every hop (transform only)
    if (over) return;
    pos += dir * speed * (t - last) / 1000; last = t;
    if (pos > 1) { pos = 1; dir = -1; } if (pos < 0) { pos = 0; dir = 1; }
    needle.style.transform = `translateX(${pos * W()}px)`;
    requestAnimationFrame(frame);
  })(last);
  let finish;
  const done = new Promise(res => finish = res);
  const press = () => {
    if (over) return;
    const inZone = pos >= zoneAt && pos <= zoneAt + zoneW;
    const isPerfect = pos >= zoneAt + zoneW * 0.35 && pos <= zoneAt + zoneW * 0.65;
    if (!inZone) { // splash!
      over = true;
      frog.textContent = '💦';
      sfx('fail'); flash('#6aa8ff', 0.3);
      msg.textContent = `Splash! You made ${hops} hop${hops === 1 ? '' : 's'}.`;
      return finish();
    }
    const t = pads[hops];
    terms.push(t);
    eq.textContent = flyEqText(terms);
    frog.style.left = `calc(${8 + hops * 11.5}% + 4px)`;
    frog.animate([{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-40px) scale(1.25)' }, { transform: 'translateY(0) scale(1)' }], { duration: 300, easing: 'ease-out' });
    padEls[hops].classList.add('landed');
    burst(padEls[hops], isPerfect ? ['#ffd23f', '#fff', '#5fd13a'] : ['#5fd13a', '#fff'], isPerfect ? 20 : 10, 0.8);
    sfx('hop', 1 + hops * 0.08); comboSfx(hops + 1);
    msg.textContent = isPerfect ? '✨ PERFECT!' : 'Nice hop!';
    hops++;
    speed *= isPerfect ? 1.12 : 1.18;
    if (hops === HOP_PADS) { over = true; banner('🪷 ALL THE WAY ACROSS!', 'legendary'); return finish(); }
    placeZone();
  };
  tap.onclick = press;
  const key = e => { if (e.key === ' ') { e.preventDefault(); e.stopPropagation(); press(); } };
  window.addEventListener('keydown', key, true);
  await done;
  window.removeEventListener('keydown', key, true);
  tap.hidden = true;
  stat(p, 'minigames');
  let coins = hops * 2 + (hops === HOP_PADS ? 8 : 0), xp = hops * 2;
  await sleep(900);
  if (hops) {
    el.hidden = true;
    const right = await solveEquation('🪷 Lily Pad Hop', flyEqText(terms), evalFlyEq(terms));
    el.hidden = false;
    if (!right) { coins = Math.ceil(coins / 2); xp = Math.ceil(xp / 2); }
  }
  const got = coins ? gainCoins(p, coins) : 0;
  gainXp(p, xp);
  msg.textContent = got ? `+${got} coins, +${xp} XP` : 'No reward this time.';
  if (got) coinFly(innerWidth / 2, innerHeight / 2, got);
  render();
  tap.hidden = false; tap.textContent = 'Continue';
  await new Promise(res => tap.onclick = res);
  el.remove();
}
