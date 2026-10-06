// Battles: loadout picking, spinning wheels, card effects and results.

// --- Battle: each player secretly picks a card (pass the device), then both are revealed ---
function cardFace(c, n, attack = BASE_DAMAGE) {
  // data-card picks the card's themed background design; data-mark is a big faded copy of its art
  const slug = c.name.replace(/^Golden /, '').replace(/ \+$/, '').toLowerCase().replace(/[^a-z]+/g, '-');
  const mark = c.art.startsWith('<') ? '' : c.art;
  return `<div class="card-face${c.gimmick || c.extra ? ' gimmick' : ''}${c.extra ? ' fused' : ''}${c.name.startsWith('Golden ') ? ' golden' : ''} r-${c.rarity || 'common'}" data-card="${slug}" data-style="${CARD_STYLE[slug] || 'Basic'}" data-mark="${mark}"${c.region ? ` data-region="${c.region}"` : ''}>` +
    (c.extra ? `<div class="fuse-badge">${c.extraArt}</div>` : '') +
    (c.quiz ? '<div class="quiz-badge" title="Skill check">🧠</div>' : '') +
    (c.rarity && c.rarity !== 'common' ? `<div class="rarity-tag">${c.rarity.toUpperCase()}</div>` : '') +
    (c.ultimate ? '<div class="ultimate-tag">ULTIMATE</div>' : '') +
    (c.superMove ? '<div class="ultimate-tag super-tag">SUPER MOVE</div>' : '') + // Ice Lake / Volcano signature attacks
    (cardSlots(c) > 1 ? `<div class="slot-tag">COUNTS AS ${cardSlots(c)}</div>` : '') +
    `<div class="art">${c.art}</div><div class="title">${c.name}</div>
    <div class="text">${c.text(attack)}</div>${n ? `<div class="qty">x${n}</div>` : ''}</div>`;
}

// Each player secretly picks a loadout of LOADOUT_MIN–LOADOUT_MAX cards (pass the device).
// Then they take turns: a spinner rolls through the attacker's loadout and lands on a card,
// which deals base damage × its multiplier. First frog to 0 HP loses.
// Pass an enemy (from makeEnemy) to fight the computer instead of the other player.
async function battleEvent(enemy = null) {
  const attacker = players[turn], defender = enemy || players[1 - turn];
  // Face whoever is acting; the computer never needs the screen, so keep facing the human then
  const face = p => setFlip(p.enemy ? attacker : p);
  const el = document.getElementById('battle');
  const title = document.getElementById('battleTitle');
  const msg = document.getElementById('battleMsg');
  const body = document.getElementById('battleBody');
  const go = document.getElementById('battleGo');
  el.hidden = false;
  const waitGo = label => new Promise(r => { go.textContent = label; go.disabled = false; go.onclick = r; });

  async function chooseLoadout(p) {
    if (p.enemy) return p.loadout; // the computer's loadout is fixed by its difficulty
    const other = p === attacker ? defender : attacker;
    face(p); // face the player who is picking
    title.textContent = `${p.name}: build your loadout`;
    msg.textContent = other.enemy ? 'Pick your cards for the fight.' : `${other.name}, look away!`;
    body.innerHTML = '';
    await waitGo(`I'm ${p.name} — show my cards`);
    // Not enough cards to choose: take them all and fill up to the minimum with Bare Hands
    if (p.hand.reduce((n, c) => n + cardSlots(c), 0) < LOADOUT_MIN) {
      const loadout = p.hand.flatMap(c => Array(cardSlots(c)).fill(c)); // multi-slot cards fill several slots
      p.hand.length = 0;
      while (loadout.length < LOADOUT_MIN) loadout.push(NO_CARD);
      msg.textContent = `You have fewer than ${LOADOUT_MIN} cards, so all of them go in. Empty slots are Bare Hands.`;
      body.innerHTML = '<div class="hand-grid">' + loadout.map(c => cardFace(c, 0, p.attack)).join('') + '</div>';
      await waitGo('Lock in');
      return loadout;
    }
    // Otherwise pick between LOADOUT_MIN and LOADOUT_MAX cards (in pick order)
    // Cursed cards are forced in (they can't be taken back out)
    const picked = p.hand.map((c, i) => i).filter(i => p.hand[i].curse).slice(0, LOADOUT_MAX);
    msg.textContent = `Pick ${LOADOUT_MIN} to ${LOADOUT_MAX} cards. Tap a card to add a copy, tap − to take one back.` + (picked.length ? ' 🥚 Cursed cards are forced in!' : '');
    // Copies of the same card share one stacked face (like the Cards menu): groups[k] = hand indexes of that card
    const groups = [...p.hand.reduce((m, c, i) => m.set(c, [...(m.get(c) || []), i]), new Map()).values()];
    body.innerHTML = '<div class="pick-count" id="pickCount"></div><div class="hand-grid pick-grid">' +
      groups.map(g => cardFace(p.hand[g[0]], g.length > 1 ? g.length : 0, p.attack)).join('') + '</div>';
    const grid = body.querySelector('.pick-grid');
    addCardTabs(grid);
    const countEl = body.querySelector('#pickCount');
    const faces = [...grid.querySelectorAll('.card-face')];
    // Slots used: most cards take 1, some (Late Bloomer) take 2
    const used = () => picked.reduce((n, i) => n + cardSlots(p.hand[i]), 0);
    const ready = () => used() >= LOADOUT_MIN && used() <= LOADOUT_MAX;
    const pickedIn = g => g.filter(i => picked.includes(i));
    const update = () => {
      faces.forEach((f, k) => {
        const n = pickedIn(groups[k]).length;
        f.classList.toggle('picked', n > 0);
        f.querySelectorAll('.pick-badge, .pick-minus').forEach(x => x.remove());
        if (n > 0) f.insertAdjacentHTML('beforeend', `<div class="pick-badge">${groups[k].length > 1 ? '✓' + n : '✓'}</div><button class="pick-minus">−</button>`);
      });
      grid.classList.toggle('has-picks', picked.length > 0);
      grid.classList.toggle('full', used() >= LOADOUT_MAX);
      // Stacks with no copy left that fits in the remaining slots can't be picked
      faces.forEach((f, k) => f.classList.toggle('nofit',
        pickedIn(groups[k]).length === groups[k].length || used() + cardSlots(p.hand[groups[k][0]]) > LOADOUT_MAX));
      countEl.textContent = `Slots used ${used()} / ${LOADOUT_MAX}` +
        (used() < LOADOUT_MIN ? ` (need at least ${LOADOUT_MIN})` : ' ✓');
      countEl.classList.toggle('ok', ready());
      go.disabled = !ready();
      go.textContent = ready() ? `Lock in ${picked.length} card${picked.length === 1 ? '' : 's'}` : 'Lock in';
    };
    faces.forEach((f, k) => f.onclick = e => {
      const g = groups[k];
      if (e.target.closest('.pick-minus')) { // take back the last copy picked from this stack
        const last = [...picked].reverse().find(i => g.includes(i) && !p.hand[i].curse);
        if (last === undefined) return; // curses stay in
        picked.splice(picked.indexOf(last), 1);
        sfx('card_pick', 0.8);
      } else {
        const free = g.find(i => !picked.includes(i));
        if (free !== undefined && used() + cardSlots(p.hand[free]) <= LOADOUT_MAX) { picked.push(free); sfx('card_pick', 0.9 + used() * 0.1); }
      }
      update();
    });
    update();
    await new Promise(r => go.onclick = () => ready() && r());
    // A 2-slot card goes in twice, so it also takes two faces on the wheel
    const loadout = picked.flatMap(i => Array(cardSlots(p.hand[i])).fill(p.hand[i]));
    p.hand = p.hand.filter((_, i) => !picked.includes(i)); // loadout cards are used up
    return loadout;
  }

  title.textContent = 'Battle!';
  msg.textContent = enemy
    ? `${attacker.name} (${attacker.maxHp} HP) vs ${defender.name} (${defender.maxHp} HP, ⚔️ ${defender.attack})! Win for ${enemy.tier.reward}+ coins, lose and pay ${enemy.tier.loss}.`
    : `${attacker.name} (${attacker.maxHp} HP) challenges ${defender.name} (${defender.maxHp} HP)! Winner takes ${BATTLE_PRIZE} coins.`;
  body.innerHTML = '';
  await waitGo('Start');
  const fighters = [
    { p: attacker, loadout: await chooseLoadout(attacker), hp: attacker.maxHp, maxHp: attacker.maxHp, poison: 0, poisonDmg: 0, shield: 0, stunned: 0, doubleNext: 0 },
    { p: defender, loadout: await chooseLoadout(defender), hp: defender.maxHp, maxHp: defender.maxHp, poison: 0, poisonDmg: 0, shield: 0, stunned: 0, doubleNext: 0 },
  ];
  // Artifact effects that apply at the start of the battle
  fighters.forEach((fg, i) => {
    if (fg.p.burning) { fg.p.burning = false; fg.poison = 3; fg.poisonDmg = (fg.poisonDmg || 0) + 3 + regionIndex * 2; fg.dotKind = 'fire'; setTimeout(() => banner(`🔥 ${fg.p.name} is still burning from the lava!`, 'lose'), 900); } // Volcano lava
    if (fg.p.revenge) { fg.revenge = true; fg.p.revenge = false; setTimeout(() => banner(`😤 ${fg.p.name} wants REVENGE: +30% damage!`, 'fire'), 600); }
    fg.shield += charmCount(fg.p, 'stone') + perkCount(fg.p, 'guard') + (fg.p.startShield || 0); // Stone Skin charm, Opening Guard perk, evolved enemies
    const shell = artifactCount(fg.p, 'medium');             // Turtle Shell: shields and extra HP
    fg.shield += turtleShields(shell);
    fg.hp += turtleHp(shell); fg.maxHp += turtleHp(shell);
    const scale = artifactCount(fg.p, 'dragon') * 15;         // Dragon Scale: extra HP
    fg.hp += scale; fg.maxHp += scale;
    const fang = artifactCount(fg.p, 'nightmare');           // Serpent Fang
    if (fang) { fighters[1 - i].poison = 3; fighters[1 - i].poisonDmg += fg.p.attack * fang; }
  });
  // Battle items (items.js): each player picks which ones to bring; they're used up by this battle
  fighters.forEach(fg => fg.it = {}); // battle items in use (items.js); you use them from the tray before each spin

  // Battle screen: HP bars + the current attacker's spinner reel
  // Segmented health bar: each segment is maxHp / HP_SEGMENTS HP; a segment stays lit while any of its HP is left
  const hpBar = f => '<div class="hp-bar">' + Array.from({ length: HP_SEGMENTS }, (_, k) =>
    `<div class="hp-seg${f.hp > k * f.maxHp / HP_SEGMENTS ? ' full' : ''}"></div>`).join('') + '</div>';
  // Frost and fire enemies' damage over time and stuns show as frostbite / burns and frozen / dazed (regions.js)
  const dotIcon = f => ELEMENTS[f.dotKind]?.dot || '🧪', stunIcon = f => ELEMENTS[f.stunKind]?.stun || '🟢';
  const stunWord = f => { const w = ELEMENTS[f.stunKind]?.stunned || 'stunned'; return w[0].toUpperCase() + w.slice(1); };
  const hpRow = () => `<div class="hp-row">${fighters.map(f => `
    <div class="hp"><div class="who">${f.p.name} ${petIcon(f.p) ? `<span class="hp-pet">${petIcon(f.p)}</span>` : ''}</div>
      ${hpBar(f)}
      <div class="hp-num">${f.hp} / ${f.maxHp} &nbsp; ⚔️ ${f.p.attack}</div>
      <div class="status">${f.poison ? `${dotIcon(f)} ${f.poisonDmg}/turn (${f.poison} left) ` : ''}${f.shield ? `${ELEMENTS[f.p.element]?.shield || '🪷'} x${f.shield} ` : ''}${f.stunned ? `${stunIcon(f)} ${stunWord(f)} x${f.stunned} ` : ''}${f.doubleNext ? `🎶 Next attack strikes x${1 + f.doubleNext}` : ''}</div></div>`).join('')}</div>`;
  // Update HP bars and statuses in place (so effects on them keep playing)
  function updateHp() {
    const row = body.querySelector('.hp-row');
    if (!row) return;
    const tmp = document.createElement('div');
    tmp.innerHTML = hpRow();
    row.querySelectorAll('.hp').forEach((el, i) => {
      const fresh = tmp.querySelectorAll('.hp')[i];
      // Flip only the segments that changed, so each one can animate as it empties/refills
      const segs = el.querySelectorAll('.hp-seg'), freshSegs = fresh.querySelectorAll('.hp-seg');
      segs.forEach((seg, k) => {
        const full = freshSegs[k].classList.contains('full');
        if (seg.classList.contains('full') !== full) {
          seg.classList.toggle('full', full);
          restartAnim(seg, full ? 'gained' : 'lost', ['lost', 'gained']);
        }
      });
      el.querySelector('.hp-num').innerHTML = fresh.querySelector('.hp-num').innerHTML;
      el.querySelector('.status').innerHTML = fresh.querySelector('.status').innerHTML;
    });
  }
  const panel = el.querySelector('.battle-panel');
  // Floating text over a fighter's HP block
  function floatFx(i, text, kind, delay = 0, size = 0) {
    setTimeout(() => {
      const box = body.querySelectorAll('.hp-row .hp')[i];
      if (!box) return;
      const pr = cachedRect(panel), br = cachedRect(box); // (cached: no forced layout per pop-up)
      const t = document.createElement('div');
      t.className = 'fx-float ' + kind;
      t.textContent = text;
      if (size) t.style.fontSize = size + 'px';
      // Measure from the opposite corner when the screen is flipped for Player 2
      const flipped = document.documentElement.classList.contains('flipped');
      // Scatter each pop-up around the HP box so a flurry of hits spreads out instead of stacking in the middle
      const jx = (Math.random() * 2 - 1) * Math.max(60, br.width * 0.6), jy = (Math.random() * 2 - 1) * 45;
      t.style.left = ((flipped ? pr.right - br.right : br.left - pr.left) + br.width / 2 + panel.scrollLeft + jx) + 'px';
      t.style.top = ((flipped ? pr.bottom - br.bottom : br.top - pr.top) + panel.scrollTop + 10 + jy) + 'px';
      panel.appendChild(t);
      setTimeout(() => t.remove(), 1100);
    }, delay);
  }
  function pulse(i, cls) {
    const box = body.querySelectorAll('.hp-row .hp')[i];
    if (!box) return;
    restartAnim(box, cls);
  }
  const hpBox = i => body.querySelectorAll('.hp-row .hp')[i];
  // Context handed to the card effects (js/card-fx.js): who's attacking whom, and where they are on screen
  const fxCtx = (side, extra = {}) => ({ panel, side, attacker: fighters[side], defender: fighters[1 - side],
    from: hpBox(side), to: hpBox(1 - side), fromXY: fxPoint(hpBox(side)), toXY: fxPoint(hpBox(1 - side)), ...extra });
  function hurtFx(i, text, size = 0) { pulse(i, 'hurt'); floatFx(i, text, 'dmg', 0, size); }
  function healFx(i, text) {
    pulse(i, 'healed'); floatFx(i, text, 'heal'); sfx('heal');
    burst(hpBox(i), ['#3cdc3c', '#fff', '#b6ffb6'], 18, 0.8);
  }
  // Small colored burst + sound for status effects
  function statusFx(i, text, kind, sound, colors) {
    floatFx(i, text, kind); sfx(sound); burst(hpBox(i), colors, 14, 0.7);
  }
  // Shake the panel; `k` scales how hard (bigger hits shake harder)
  function shake(big = false, k = 1) {
    panel.style.setProperty('--shk', Math.max(0.6, Math.min(3, k)));
    restartAnim(panel, big ? 'shake-big' : 'shake', ['shake', 'shake-big']);
  }
  // Re-spin marker: a gold circle of two chasing arrows spins over the wheel, then fades out
  const RESPIN_SVG = '<svg viewBox="0 0 100 100"><g fill="none" stroke="#ffd23f" stroke-width="9" stroke-linecap="round">' +
    '<path d="M50 12 A38 38 0 0 1 86 60"/><path d="M50 88 A38 38 0 0 1 14 40"/></g>' +
    '<g fill="#ffd23f"><path d="M74 58 L96 56 L84 76 Z"/><path d="M26 42 L4 44 L16 24 Z"/></g></svg>';
  // Shown big, just right of the wheels, level with the wheel that's re-spinning
  function respinFx(wi) {
    const win = body.querySelectorAll('.wheel-window')[wi];
    if (!win) return;
    const SIZE = 150;
    const pr = body.querySelector('.wheels').getBoundingClientRect(), wr = win.getBoundingClientRect();
    // Visual centre on screen: right of the box, or squeezed against the screen edge if there's no room
    let x = Math.min(pr.right + 16 + SIZE / 2, innerWidth - SIZE / 2 - 4), y = wr.top + wr.height / 2;
    // Player 2's screen is rotated 180°, so convert to the rotated page's coordinates
    if (document.documentElement.classList.contains('flipped')) { x = innerWidth - x; y = innerHeight - y; }
    const fx = document.createElement('div');
    fx.className = 'respin-fx';
    fx.innerHTML = RESPIN_SVG;
    Object.assign(fx.style, { left: x - SIZE / 2 + 'px', top: y - SIZE / 2 + 'px', width: SIZE + 'px', height: SIZE + 'px' });
    document.body.appendChild(fx);
    setTimeout(() => fx.remove(), 1000);
  }
  // Match combo callout: link the matching wheels with gold frames and beams, then stamp PAIR / JACKPOT
  function matchFx(n, wis, newest, mult) {
    try {
      const wins = body.querySelectorAll('.wheel-window');
      wis.forEach(i => wins[i]?.classList.add('match-lit'));
      const pts = wis.map(i => fxPoint(wins[i]));
      for (let i = 1; i < pts.length; i++) fxBeam(pts[i - 1], pts[i], { cls: 'match-beam', ms: 700, width: 8 });
      const [x, y] = fxPoint(wins[newest]);
      if (n >= 3) {
        fxPop(x, y - 10, `🎰 JACKPOT! ×${mult}`, { cls: 'match-pop jackpot', ms: 1400, size: 52 });
        fxRing(x, y, { color: '#ffd23f', size: 360, width: 10, ms: 700 });
        fxParticles(x, y, { count: 44, colors: ['#ffd23f', '#fff', '#ff5d8a', '#6aa8ff'], spread: 260, size: [4, 10], ms: 900 });
        sfx('jackpot'); confetti(120); banner(`🎰 JACKPOT! ×${mult}`, 'legendary');
        flash('#ffd23f', 0.5); fxShake(panel, 14, 450); haptic(150);
      } else {
        fxPop(x, y - 10, `🎰 PAIR! ×${mult}`, { cls: 'match-pop', ms: 1100, size: 38 });
        fxRing(x, y, { color: '#ffd23f', size: 200, width: 6 });
        fxParticles(x, y, { count: 20, colors: ['#ffd23f', '#fff'], spread: 140, size: [3, 7] });
        comboSfx(2); flash('#ffd23f', 0.25); fxShake(panel, 6, 300); haptic(60);
      }
    } catch (e) { console.warn('match fx', e); }
  }
  // Saw chain callout: a big stamp over the wheel showing the chain and the damage boost, bigger every link
  function sawChainFx(n, mult, wi) {
    try {
      const win = body.querySelectorAll('.wheel-window')[wi];
      const [x, y] = fxPoint(win);
      const size = Math.min(64, 30 + n * 7);
      fxPop(x, y - 20, `🪚 CHAIN x${n}`, { cls: 'saw-chain-pop', ms: 1100, size, rotate: n % 2 ? -8 : 8 });
      fxPop(x, y + size * 0.6, `+${Math.round((mult - 1) * 100)}% DMG`, { cls: 'saw-chain-dmg', ms: 1100, size: size * 0.55, rise: 50 });
      fxRing(x, y, { color: n >= 4 ? '#ff4b1f' : '#ffd23f', size: 120 + n * 40, width: 4 + n });
      fxParticles(x, y, { count: 10 + n * 5, colors: ['#ffd23f', '#fff', '#ff9a3b'], spread: 80 + n * 25, size: [3, 7] });
      flash(n >= 4 ? '#ff4b1f' : '#ffd23f', Math.min(0.45, 0.12 + n * 0.07));
      fxShake(panel, 4 + n * 2, 320);
      if (n >= 3) banner(`🪚 SAW CHAIN x${n}! +${Math.round((mult - 1) * 100)}%`, n >= 5 ? 'fire' : 'legendary');
      sfx('saw', 1 + n * 0.12, 0.8 + n * 0.1);
      haptic(20 + n * 15);
    } catch (e) { console.warn('saw chain fx', e); }
  }
  // Damage counter: big number for the last attack with its modifiers
  function showDamage(d, formula, note) {
    const c = body.querySelector('.dmg-counter');
    if (!c) return;
    c.innerHTML = `<div class="dmg-num" style="font-size:${Math.min(96, 40 + d * 0.8)}px">${d}</div><div class="dmg-formula">${formula}${note ? ` <b>${note}</b>` : ''}</div>`;
    restartAnim(c, 'pop');
  }

  // Each wheel repeats the loadout around its rim so there are always at least 8 faces
  const WHEELS = 3;
  const wheelFaces = f => f.loadout.length * Math.ceil(8 / f.loadout.length);
  // Render all wheels at their saved angles; `lit` highlights each wheel's front card
  const reel = (f, lit = false) => {
    const n = f.loadout.length, m = wheelFaces(f), step = 360 / m;
    const r = Math.round(40 / Math.tan(Math.PI / m)) + 3; // radius so faces sit edge to edge
    f.wheels ||= Array.from({ length: WHEELS }, () => ({ angle: 0, face: -1 }));
    return '<div class="wheels">' + f.wheels.map(w => {
      const slots = Array.from({ length: m }, (_, k) =>
        `<div class="wheel-slot${lit && k === w.face ? ' lit' : ''}" style="transform: rotateX(${k * step}deg) translateZ(${r}px)">` +
        cardFace(f.loadout[k % n], 0, f.p.attack) + '</div>').join('');
      return `<div class="wheel-window"><div class="wheel-pointer"></div>
        <div class="wheel" style="transform: rotateX(${-w.angle}deg)">${slots}</div></div>`;
    }).join('') + '</div>';
  };

  let spinsThisTurn = 0, sawsThisTurn = 0; // each Saw Blade landed this turn speeds spins up even more
  // Spin wheel `wi` a few full turns, easing out onto a random card. Returns its loadout index.
  // `only` (optional) limits where it can land, e.g. only damaging cards; ignored if nothing matches
  async function spin(f, wi, only) {
    const win = body.querySelectorAll('.wheel-window')[wi];
    const wheel = win.querySelector('.wheel');
    const w = f.wheels[wi];
    const n = f.loadout.length, m = wheelFaces(f), step = 360 / m;
    win.querySelectorAll('.wheel-slot.lit').forEach(el => el.classList.remove('lit'));
    win.classList.add('active');
    const allowed = Array.from({ length: m }, (_, i) => i).filter(i => !only || only(f.loadout[i % n]));
    const pool = allowed.length ? allowed : Array.from({ length: m }, (_, i) => i);
    const k = pool[Math.floor(Math.random() * pool.length)]; // landing face
    const from = w.angle;
    const to = from + 360 * Math.max(1, 3 - spinsThisTurn) + (((k * step - from) % 360) + 360) % 360;
    // Each spin in a turn is quicker than the last
    const duration = Math.max(220, 1800 * 0.55 ** spinsThisTurn++ * 0.7 ** sawsThisTurn), start = performance.now();
    const creep = duration > 600 && Math.random() < 0.35 ? step * 0.65 : 0; // near miss: overshoot then rock back
    let lastFace = Math.floor(from / step + 0.5), lastTick = 0;
    const tickPitch = 1 + spinsThisTurn * 0.1; // spinsThisTurn was already bumped for this spin
    await new Promise(done => {
      (function frame(t) {
        const x = Math.min(1, (t - start) / duration);
        const eased = 1 - (1 - x) ** 4; // fast start, long slow-down
        const back = x < 0.82 ? 0 : (x - 0.82) / 0.18, settle = back * back * (3 - 2 * back); // smoothstep
        const ang = from + (to + creep - from) * eased - creep * settle;
        wheel.style.transform = `rotateX(${-ang}deg)`;
        const face = Math.floor(ang / step + 0.5);
        // Tick for each card that passes, but at most every 40ms so a fast spin doesn't flood the audio
        if (face !== lastFace) { lastFace = face; if (t - lastTick > 40) { lastTick = t; sfx('wheel_tick', tickPitch); } }
        if (x < 1) requestAnimationFrame(frame); else done();
      })(start);
    });
    w.angle = to % 360;
    w.face = k;
    win.classList.remove('active');
    const landed = f.loadout[k % n];
    win.querySelectorAll('.wheel-slot')[k].classList.add('lit');
    cardLandFx(landed, fxCtx(fighters.indexOf(f), { win, slot: win.querySelectorAll('.wheel-slot')[k] }));
    restartAnim(win, 'landed');
    // Burst colored by card type: purple for gimmicks, gold for attacks
    const big = landed.mult >= 5;
    if (landed.gimmick) sfx('card_land_gimmick');
    else sfx('card_land_attack', 1.25 - landed.mult * 0.07);
    burst(win, landed.gimmick ? ['#b07cff', '#fff', '#7b3fbf', '#e0c3ff'] : ['#ffd23f', '#fff', '#f90', '#ff5d5d'],
          16 + landed.mult * 4, 0.9 + landed.mult * 0.15);
    if (big) {
      restartAnim(win, 'big-land');
      flash('#ffd23f', 0.35);
    }
    return k % n;
  }


  // Battle items reacting to taking damage: Glass Fang breaks, Rebound Shell reflects 30%
  function itemsOnHurt(target, dealt, hitter) {
    if (!target.it || dealt <= 0) return;
    const ti = fighters.indexOf(target);
    if ('glass' in target.it) { delete target.it.glass; setTimeout(() => statusFx(ti, '⚔️ Glass Fang shattered!', 'poison', 'fail', ['#fff', '#aaa']), 200); }
    if ('rebound' in target.it && hitter && hitter.hp > 0) {
      const back = Math.min(hitter.hp, Math.max(1, Math.round(dealt * 0.3)));
      hitter.hp -= back;
      setTimeout(() => { hurtFx(1 - ti, `🔄 -${back}`); updateHp(); }, 250);
    }
  }
  // Deal damage to a fighter; each stacked shield soaks up one whole hit. Returns damage actually dealt.
  let blocked = 0;
  let dodged = 0;
  function hit(target, dmg) {
    if (dmg <= 0) return 0;
    if (target.shield) { target.shield--; blocked++; return 0; }
    const hitter = fighters.find(x => x !== target);
    const sure = hitter?.it?.bullseyeNow; if (sure) hitter.it.bullseyeNow = false; // Bullseye Bug: can't be dodged
    if (!sure && Math.random() < mothDodge(artifactCount(target.p, 'moth'))) { dodged++; return 0; } // Frost Moth Wings
    dmg = Math.max(1, Math.round(dmg * (1 - golemGuard(artifactCount(target.p, 'golem'))))); // Golem Core
    const dealt = Math.min(dmg, target.hp);
    target.hp -= dealt;
    lastStand(target);
    itemsOnHurt(target, dealt, hitter);
    return dealt;
  }
  // Lizard Tail: once per battle, a knocked-out fighter bounces back with some HP
  function lastStand(t) {
    const n = artifactCount(t.p, 'lizard');
    if (t.hp > 0 || !n || t.tailUsed) return;
    t.tailUsed = true;
    t.hp = Math.max(1, Math.round(t.maxHp * lizardSave(n)));
    const i = fighters.indexOf(t);
    setTimeout(() => statusFx(i, '🦎 Lizard Tail: back on its feet!', 'heal', 'heal', ['#5fd13a', '#fff', '#ffd23f']), 300);
  }
  const times = n => n === 1 ? '' : ` x${n}`;

  let cur = 0;
  while (fighters[0].hp > 0 && fighters[1].hp > 0) {
    const f = fighters[cur], foe = fighters[1 - cur];
    title.textContent = `${f.p.name}'s turn`;
    face(f.p); // face whoever is spinning
    f.turns = (f.turns || 0) + 1; // this fighter's turn number in the battle (Adrenaline charm)
    f.focus = 0; // Focus Croak only lasts the turn it's played
    if (perkCount(f.p, 'second') && !f.secondWind && f.hp > 0 && f.hp < f.maxHp * 0.3) { // Second Wind perk
      f.secondWind = true;
      const before = f.hp;
      f.hp = Math.min(f.maxHp, f.hp + Math.round(f.maxHp * 0.3));
      setTimeout(() => healFx(cur, `💚 Second Wind +${f.hp - before}`), 250);
    }
    if (f.regen > 0 && f.hp > 0) { // Spring Rain
      const before = f.hp;
      f.hp = Math.min(f.maxHp, f.hp + f.regenAmt);
      f.regen--;
      setTimeout(() => healFx(cur, `🌧️ +${f.hp - before}`), 250);
    }
    // Companion pets (pets.js): the snail shields you, the firefly heals you
    if (f.p.pet === 'snail') {
      const st = petStage(f.p), n = st === 1 ? f.turns % 2 : st === 2 ? 1 : (Math.random() < 0.35 ? 2 : 1);
      if (n) { f.shield += n; stat(f.p, 'pet'); setTimeout(() => statusFx(cur, `${petIcon(f.p)} +${n} shield`, 'shield', 'shield', ['#6aa8ff', '#fff']), 300); }
    }
    if (f.p.pet === 'firefly' && f.hp > 0 && f.hp < f.maxHp) {
      const before = f.hp;
      f.hp = Math.min(f.maxHp, f.hp + Math.round(f.maxHp * [0.04, 0.07, 0.1][petStage(f.p) - 1]));
      stat(f.p, 'pet');
      setTimeout(() => healFx(cur, `${petIcon(f.p)} +${f.hp - before}`), 350);
    }
    const bandage = charmCount(f.p, 'bandage');
    if (bandage && f.hp > 0 && f.hp < f.maxHp) {
      const before = f.hp;
      f.hp = Math.min(f.maxHp, f.hp + Math.round(f.maxHp * 0.08 * bandage));
      setTimeout(() => healFx(cur, `🩹 +${f.hp - before}`), 200);
    }
    // Start-of-turn effects: poison ticks, stun skips the turn
    // Rotten Egg item (the other fighter's): this fighter's poison grows every tick, unless they healed since the last one
    if (f.poison && foe.it && 'egg' in foe.it) {
      if (f.eggHp !== undefined && f.hp > f.eggHp) { f.poison = 0; f.poisonDmg = 0; statusFx(cur, '☠️ healing washed the poison away', 'heal', 'heal', ['#b4ff8a', '#fff']); }
      else { f.poisonDmg += Math.max(1, Math.round(foe.p.attack * 0.5)); }
    }
    if (f.poison) {
      const tick = Math.max(1, Math.round(f.poisonDmg * dotResist(f))); // Wool Scarf / Ice Pack charms
      f.hp = Math.max(0, f.hp - tick);
      lastStand(f);
      f.poison--;
      msg.textContent = `${dotIcon(f)} ${ELEMENTS[f.dotKind]?.dotName || 'Poison'} deals ${tick} to ${f.p.name}!` + (tick < f.poisonDmg ? ` (${charmCount(f.p, 'scarf') && f.dotKind === 'frost' ? '🧣' : '🧊'} softened it)` : '');
      body.innerHTML = hpRow() + reel(f);
      hurtFx(cur, `${dotIcon(f)} -${tick}`);
      battleFx('poisonTick', fxCtx(1 - cur, { dmg: tick })); // the poisoned fighter is the target
      if (!f.poison) f.poisonDmg = 0;
      f.eggHp = f.hp;
      updateHp();
      if (f.hp <= 0) break;
      await waitGo('Continue');
    }
    if (f.stunned && Math.random() < stunShrug(f)) { // Hand Warmer / Smoke Goggles charms
      f.stunned--;
      setTimeout(() => statusFx(cur, f.stunKind === 'frost' ? '♨️ thawed out!' : '🥽 shook it off!', 'buff', 'buff', ['#ffd23f', '#fff']), 200);
    } else if (f.stunned) {
      f.stunned--;
      msg.textContent = `${stunIcon(f)} ${f.p.name} is ${ELEMENTS[f.stunKind]?.stunned || 'stunned'} and skips this turn!` + (f.stunned ? ` (${f.stunned} more)` : '');
      body.innerHTML = hpRow() + reel(f);
      battleFx('stunSkip', fxCtx(1 - cur)); // the stunned fighter is the target
      await waitGo(`Next: ${foe.p.name}'s turn`);
      cur = 1 - cur;
      continue;
    }
    msg.textContent = f.p.enemy ? `${f.p.name} is spinning...` : 'Spin to see which cards attack! Match cards on the wheels for combos!';
    body.innerHTML = hpRow() + reel(f) + '<div class="dmg-counter"></div>';
    if (f.p.enemy) { go.disabled = true; go.textContent = 'Enemy turn'; await sleep(700); } // the computer spins by itself
    else {
      // Battle items (items.js): use items from your bag before you spin
      const tray = itemTray(f, (k, lines) => {
        statusFx(cur, `${itemDef(k).icon} ${itemDef(k).name}!`, 'buff', 'buff', [RARITY_COLORS[itemDef(k).rarity], '#fff']);
        if (lines.length) { msg.textContent = lines.join(' · '); body.querySelector('.wheels').outerHTML = reel(f); } // the loadout changed
      });
      if (tray) body.appendChild(tray);
      await waitGo('Spin');
      tray?.remove();
    }
    msg.textContent = '';
    go.disabled = true;
    spinsThisTurn = 0;
    sawsThisTurn = 0;
    const atk = f.p.attack + artifactCount(f.p, 'boss') * 2 + artifactCount(f.p, 'dragon'); // Butcher's Cleaver, Dragon Scale add base damage
    const dmgOf = c => atk * c.mult;
    const fi = fighters.indexOf(f), foeI = 1 - fi;
    let bonus = 0, turnTotal = 0, physicalCount = 0, respinsThisTurn = 0, sawChain = 0; // re-spins so far this turn (for the combo sound)
    const landedThisTurn = []; // the card showing on each wheel this turn (for match combos)
    let curMatch = 1;          // match size of the card resolving right now (Eagle Eye charm)
    const isVenom = c => c.gimmick === 'venomfang' || c.extra === 'venomfang'; // Venom Fang (or fused onto a card)
    let lastHit = 0;           // damage the current card's attack dealt (Lotus Bloom heals it back)
    let orbitalCharges = 0;    // Orbital Laser landings this turn
    const leeches = []; // wheels that landed on Leech, resolved after all wheels
    // Battle items reacting to skill checks: Golden Fly (misses), Smart Berry (speed), Hot Streak (right in a row)
    async function itemsOnSkillCheck(right, speed) {
      const it = f.it || {};
      if ('smart' in it && right) it.smart = 1 + Math.max(0, Math.min(1, speed));
      if ('hot' in it) { it.hot = right ? it.hot + 1 : 0; if (!right) statusFx(fi, '🔥 streak lost', 'poison', 'fail', ['#aaa']); }
      if ('goldfly' in it && !right && it.goldfly >= 0) {
        it.goldfly++;
        statusFx(fi, `🪰 Golden Fly ${it.goldfly}/3`, 'buff', 'buff', ['#ffd23f', '#fff']);
        if (it.goldfly >= 3 && foe.hp > 0) {
          it.goldfly = -1;
          await sleep(300);
          const extra = hit(foe, f.p.attack * 8);
          banner('🪰 THE GOLDEN FLY STRIKES!', 'legendary');
          if (extra) { hurtFx(foeI, `🪰 -${extra}`, 60); turnTotal += extra; }
          updateHp();
        }
      }
    }
    // A physical attack. With Double Croak stacked, it really attacks several times in a row:
    // each strike lands separately with its own damage number, sound, shake and shield check.
    async function attack(dmg, parts, card = null) {
      if (dmg <= 0) { showDamage(0, parts.join(' × '), ''); return 0; }
      const hits = 1 + f.doubleNext;
      f.doubleNext = 0;
      physicalCount++;
      let total = 0;
      for (let h = 0; h < hits && foe.hp > 0 && f.hp > 0; h++) {
        if (h > 0) await sleep(Math.max(180, 380 - h * 60)); // quick follow-up strikes
        blocked = 0; dodged = 0;
        // Crit chance: your stat + Heron Feather + Adrenaline (first 3 turns); Eagle Eye makes matched cards always crit
        let critChance = f.p.critChance + artifactCount(f.p, 'hard') * 0.1 + (f.turns <= 3 ? charmCount(f.p, 'adren') * 0.25 : 0) + (f.focus || 0);
        if (f.it && 'dice' in f.it) critChance = 0.01;                                   // Loaded Dice
        if (f.it && 'stand' in f.it && f.hp < f.maxHp * 0.1) critChance = 1;             // Last Stand
        const item = itemDamage(f, foe, card, h === 0);                                   // battle items (items.js)
        let crit = card?.alwaysCrit || (charmCount(f.p, 'eagle') && curMatch > 1) || Math.random() < critChance; // rolled separately for every strike
        if (item.noCrit) crit = false;                                                     // Snail Shell, Bullseye Bug
        const critMult = (f.it && 'dice' in f.it ? 5 : 0) + f.p.critMult + charmCount(f.p, 'claws') * 0.5 + artifactCount(f.p, 'owl') * 0.25; // Sharpened Claws, Owl Monocle
        // Venom Strike (vs poisoned foes) and Momentum (per re-spin this turn) boost the hit
        const boost = (foe.poison ? 1 + charmCount(f.p, 'venom') * 0.3 : 1) * (1 + charmCount(f.p, 'moment') * 0.1 * respinsThisTurn) * (f.revenge ? 1.3 : 1) * (foe.p.tier?.evolved ? 1 + charmCount(f.p, 'hunter') * 0.15 : 1) // charms, revenge, Monster Hunter
          * (f.hp < f.maxHp / 2 ? 1 + artifactCount(f.p, 'wolf') * 0.15 : 1) * (f.openerDone ? 1 : 1 + artifactCount(f.p, 'penguin') * 0.5); // Wolf Pelt, Penguin Belly
        let raw = Math.round((crit ? dmg * critMult : dmg) * boost * item.mult);
        // Ghost Fly: a finishing blow leaves the foe at 1 HP and pays a big coin bonus instead
        if (f.it?.ghost === 0 && raw >= foe.hp + (foe.shield ? 1e9 : 0) && foe.hp > 1) {
          raw = foe.hp - 1; f.it.ghost = -1;
          if (!f.p.enemy) { const c = gainCoins(f.p, 25 + regionIndex * 15); setTimeout(() => statusFx(fi, `👻 Ghost Fly! +${c} coins`, 'buff', 'coin', ['#e0e0ff', '#fff', '#ffd23f']), 300); }
        }
        // The card's windup (a projectile, a lunge...) plays out before the strike lands
        await cardWindupFx(card, fxCtx(fi, { card, crit, dmg: raw, big: raw >= f.p.attack * 5, strike: h, strikes: hits }));
        const d = hit(foe, raw);
        if (d > 0) { stat(f.p, 'damage', d); statMax(f.p, 'bigHit', d); if (crit) stat(f.p, 'crits'); f.openerDone = true; }
        if (dodged) { floatFx(foeI, '🦋 DODGED!', 'shield'); sfx('wind', 1.3, 0.6); }
        if (d > 0 && foe.hp > 0) { // Walrus Tusk freezes, Fire Feather burns
          const tusk = artifactCount(f.p, 'walrus'), feather = artifactCount(f.p, 'hawk');
          if (tusk && Math.random() < tusk * 0.1) { foe.stunned++; foe.stunKind = 'frost'; setTimeout(() => statusFx(foeI, `🦭 frozen solid x${foe.stunned}`, 'poison', 'stun', ['#bfe6ff', '#fff']), 250); }
          if (feather && Math.random() < feather * 0.15) { foe.poison = Math.max(foe.poison, 3); foe.poisonDmg = (foe.poisonDmg || 0) + f.p.attack; foe.dotKind = 'fire';
            setTimeout(() => statusFx(foeI, `🦅 burning ${foe.poisonDmg}/turn`, 'poison', 'poison', ['#ff8a1f', '#fff']), 300); }
        }
        const sctx = fxCtx(fi, { card, crit, dmg: d, big: d >= f.p.attack * 5, blocked: !!blocked, strike: h, strikes: hits });
        if (d > 0) cardImpactFx(card, sctx);
        // Slamming attacks land with a heavy thud (deeper on big hits and crits)
        if (d > 0 && card && SLAM_CARDS.includes(fxSlug(card))) sfx('heavy_slam', crit || d >= f.p.attack * 5 ? 0.85 : 1, 1);
        if (blocked) battleFx('block', sctx);
        if (crit && d > 0) { battleFx('crit', sctx); questEvent(f.p, 'crit'); }
        // Hit-stop: a crit or huge hit freezes for a split second before it lands
        if (d > 0 && (crit || d >= f.p.attack * 5)) { panel.classList.add('hitstop'); await sleep(crit ? 110 : 70); panel.classList.remove('hitstop'); }
        total += d;
        turnTotal += d;
        const mods = [...parts];
        if (hits > 1) mods.push(`strike ${h + 1}/${hits}`);
        if (crit) mods.push(`${critMult} CRIT!`);
        mods.push(...item.notes);
        if (boost > 1) mods.push(`charms x${+boost.toFixed(2)}`);
        showDamage(d, mods.join(' × '), blocked ? '🪷 blocked' : '');
        // Mosquito Proboscis: heal part of the damage dealt
        const suck = Math.round(d * mosquitoHeal(artifactCount(f.p, 'easy')));
        if (suck > 0) { f.hp = Math.min(f.maxHp, f.hp + suck); setTimeout(() => healFx(fi, `🦟 +${suck}`), 200); }
        if (d > 0) {
          const bigHit = d >= f.p.attack * 5;
          hurtFx(foeI, `-${d}`, Math.min(64, 26 + d * 0.9)); // bigger hits, bigger numbers
          shake(bigHit || h > 0, d / (f.p.attack * 3));
          haptic(crit ? 70 : bigHit ? 40 : 15);
          const basePitch = Math.max(0.7, 1.25 - d / (f.p.attack * 12));
          // The first strike sounds normal; every strike after it is harsher than the one before
          // (h = 1 on the 2nd strike, 2 on the 3rd, ...): louder, deeper, with heavier layers piling on
          if (h > 0) comboSfx(h); // extra strikes in a row (Double Croak, Cleaver Flurry) climb too
          if (h === 0) sfx(bigHit ? 'big_hit' : 'hit', basePitch);
          else {
            sfx('hit', basePitch - h * 0.08, 1.2 + h * 0.35);
            sfx('big_hit', 0.95 - h * 0.08, 0.6 + h * 0.3);                  // 2nd strike on: heavy thud
            if (h >= 2) sfx('saw', 0.72 - h * 0.04, 0.5 + h * 0.15);         // 3rd strike on: grinding crunch
            if (h >= 3) sfx('leech', 0.55 - h * 0.03, 0.8);                  // 4th strike on: wet splat
            if (h === hits - 1) setTimeout(() => sfx('big_hit', 0.62 - h * 0.04, 1), 90); // last strike booms
          }
          burst(hpBox(foeI), ['#ff3b3b', '#fff', '#ff9a3b'], bigHit ? 30 : 14, bigHit ? 1.3 : 0.8);
          flash('#ff2020', bigHit ? 0.45 : 0.15);
          if (crit) {
            // Critical hit: gold flash, big CRIT! pop, heavy boom and an extra shake
            floatFx(foeI, 'CRIT!', 'crit', 120);
            flash('#ffd23f', 0.5);
            burst(hpBox(foeI), ['#ffd23f', '#fff', '#ff5d5d'], 36, 1.5);
            sfx('big_hit', 0.8, 1.3);
            shake(true);
            body.querySelector('.dmg-counter')?.classList.add('crit');
          } else body.querySelector('.dmg-counter')?.classList.remove('crit');
        } else if (blocked) {
          floatFx(foeI, 'BLOCKED', 'shield');
          const spikes = charmCount(foe.p, 'spikes');
          if (spikes) { // Spiked Shell: the attacker hurts themselves on the shield
            const back = Math.min(f.hp, foe.p.attack * 2 * spikes);
            f.hp -= back;
            lastStand(f);
            setTimeout(() => hurtFx(fi, `🌵 -${back}`), 150);
          }
          const carapace = artifactCount(foe.p, 'beetle'); // Ember Carapace
          if (carapace) { f.poison = Math.max(f.poison, 3); f.poisonDmg = (f.poisonDmg || 0) + foe.p.attack * carapace; f.dotKind = 'fire';
            setTimeout(() => statusFx(fi, `🪲 burned ${f.poisonDmg}/turn`, 'poison', 'poison', ['#ff8a1f', '#fff']), 200); }
          sfx('blocked');
          burst(hpBox(foeI), ['#6aa8ff', '#fff'], 16, 0.8);
        }
        updateHp();
      }
      return total;
    }
    // Apply one gimmick's effect. Used for a card's own gimmick and for a gimmick fused onto it.
    function applyEffect(g, wi, card = null) {
      const icon = swampIcon => card?.element ? card.art : swampIcon; // Ice Lake / Volcano cards show their own art
      // Stun only lands some of the time
      if (g === 'stun' && Math.random() >= STUN_CHANCE) {
        setTimeout(() => statusFx(foeI, `${icon('🟢')} ${card?.element ? 'missed' : 'stun missed'}!`, 'poison', 'fail', ['#9dff3a', '#fff']), 350);
        setTimeout(() => sfx('dud', 1, 0.6), 350);
        return;
      }
      // (cleave, frenzy and grow play their effects at their own moment, see below)
      if (!['cleave', 'frenzy', 'grow'].includes(g)) gimmickFx(g, fxCtx(fi, { card, win: body.querySelectorAll('.wheel-window')[wi] }));
      switch (g) {
        case 'shield':
          f.shield++;
          statusFx(fi, `${icon('🪷')} +1 shield`, 'shield', 'shield', ['#6aa8ff', '#fff', '#bcd8ff']);
          break;
        case 'heal': {
          const before = f.hp;
          f.hp = Math.min(f.maxHp, f.hp + Math.round(f.p.attack * 2 * (1 + charmCount(f.p, 'honey') * 0.5))); // Honey charm
          healFx(fi, `${card?.element ? card.art + ' ' : ''}+${f.hp - before}`);
          break;
        }
        case 'double':
          f.doubleNext++;
          statusFx(fi, `${icon('🎶')} next attack strikes x${1 + f.doubleNext}`, 'buff', 'buff', ['#b07cff', '#fff', '#ffd23f']);
          // Each extra stack sounds more menacing: a lower, louder growl layered on the buff sound
          if (f.doubleNext > 1) sfx('big_hit', 0.8 - f.doubleNext * 0.08, 0.4 + f.doubleNext * 0.2);
          break;
        case 'leech':
          leeches.push(wi);
          statusFx(fi, '🩸 Leech ready', 'buff', 'leech', ['#b01c1c', '#ff6b6b', '#fff']);
          break;
        // Stacking: more poison adds damage per tick and resets the timer; more stun adds skipped turns
        case 'poison':
          questEvent(f.p, 'poison');
          foe.poison = 3 + charmCount(f.p, 'linger') * 2;                                   // Lingering Venom
          foe.poisonDmg = (foe.poisonDmg || 0) + f.p.attack * (1 + charmCount(f.p, 'toxic')); // Toxic Glands
          foe.dotKind = card?.element || null; // frostbite, burn or plain poison
          setTimeout(() => statusFx(foeI, `${dotIcon(foe)} ${foe.poisonDmg}/turn`, 'poison', 'poison', ['#5fd13a', '#b4ff8a', '#2a7a10']), 350);
          break;
        case 'wallow': {
          const before = f.hp;
          f.hp = Math.min(f.maxHp, f.hp + f.p.attack * 3);
          healFx(fi, `${icon('🐖')} +${f.hp - before}`);
          f.shield++;
          break;
        }
        case 'focus':
          f.focus = (f.focus || 0) + 0.5;
          statusFx(fi, `${icon('🎯')} +50% crit (${Math.round(Math.min(1, f.p.critChance + f.focus) * 100)}%)`, 'buff', 'buff', ['#ffd23f', '#fff']);
          break;
        case 'plague':
          if (foe.poison) { foe.poisonDmg *= 2; setTimeout(() => statusFx(foeI, `☁️ poison x2 → ${foe.poisonDmg}/turn`, 'poison', 'poison', ['#5fd13a', '#b4ff8a']), 300); }
          break;
        case 'bash': {
          const dmg = f.shield * f.p.attack * 2;
          if (dmg > 0) {
            const before = foe.hp;
            foe.hp = Math.max(0, foe.hp - dmg);
            turnTotal += before - foe.hp; stat(f.p, 'damage', before - foe.hp);
            hurtFx(foeI, `🐚 -${before - foe.hp}`);
            showDamage(before - foe.hp, `🐚 ${f.shield} shields × ${f.p.attack * 2}`, '');
            sfx('heavy_slam', 1, 1);
            shake(true, dmg / (f.p.attack * 3));
          } else setTimeout(() => statusFx(fi, '🐚 no shields to bash with', 'buff', 'fail', ['#aaa']), 100);
          break;
        }
        case 'armor':
          f.shield += 2;
          statusFx(fi, `${icon('🌳')} +2 shields`, 'shield', 'shield', ['#8a6a3a', '#fff', '#5fd13a']);
          break;
        case 'lifesteal':
          if (lastHit > 0 && f.it && 'bloodfly' in f.it) { // Bloodfly: the drained life hurts the foe instead
            const extra = hit(foe, lastHit);
            if (extra) { hurtFx(foeI, `🩸 Bloodfly -${extra}`); turnTotal += extra; updateHp(); }
          } else if (lastHit > 0) {
            const before = f.hp;
            f.hp = Math.min(f.maxHp, f.hp + lastHit);
            if (f.hp > before) setTimeout(() => healFx(fi, `${icon('🌸')} +${f.hp - before}`), 200);
          }
          break;
        case 'regen':
          f.regen = 3;
          f.regenAmt = f.p.attack;
          statusFx(fi, `${icon('🌧️')} regen ${f.p.attack} for 3 turns`, 'heal', 'heal', ['#6aa8ff', '#fff', '#b4ff8a']);
          break;
        case 'loot':
        case 'steal':
          if (!f.p.enemy) {
            let got;
            if (g === 'steal' && !foe.p.enemy) { got = Math.min(2, foe.p.coins); foe.p.coins -= got; f.p.coins += got; }
            else got = gainCoins(f.p, g === 'loot' ? 3 : 2);
            if (got) { setTimeout(() => statusFx(fi, `${g === 'loot' ? '🪙' : '🦝'} +${got} coins`, 'buff', 'coin', ['#ffd23f', '#fff']), 250); render(); face(f.p); } // render() faces players[turn]
          }
          break;
        case 'stun':
          foe.stunned++;
          foe.stunKind = card?.element || null; // frozen solid, dazed or stunned
          setTimeout(() => statusFx(foeI, `${stunIcon(foe)} ${ELEMENTS[foe.stunKind]?.stunned || 'stunned'} x${foe.stunned}`, 'poison', 'stun', ['#9dff3a', '#fff', '#ffe23a']), 350);
          break;
      }
    }
    // Late Bloomer: deal its current flat damage (negative heals the foe), then permanently grow by 1
    async function growCard(card, mult = 1) {
      const dmg = card.growDmg > 0 ? Math.round(card.growDmg * mult) : card.growDmg; // match combos boost grown damage
      if (dmg > 0 && card.quiz && !f.p.enemy) {
        // Skill check on a grown Late Bloomer: fast answers hit harder, a miss heals the foe instead
        const res = await battleCheck(f.p, card, dmg);
        if (res > 0) await attack(res, [`🧠🌱 ${card.name} ${res}`], card);
        else {
          const before = foe.hp;
          foe.hp = Math.min(foe.maxHp, foe.hp - res);
          showDamage(before - foe.hp, `🧠 ${card.name} failed — heals the foe`, '');
          healFx(foeI, `+${foe.hp - before}`);
          updateHp();
        }
      } else if (dmg > 0) await attack(dmg, [`🌱 ${card.name} ${dmg}`], card);
      else if (dmg < 0) {
        const before = foe.hp;
        foe.hp = Math.min(foe.maxHp, foe.hp - dmg);
        showDamage(before - foe.hp, `🌱 ${card.name} heals the foe`, '');
        healFx(foeI, `+${foe.hp - before}`);
        updateHp();
      } else showDamage(0, `🌱 ${card.name} does nothing... yet`, '');
      card.growDmg++;
      gimmickFx('grow', fxCtx(fi, { card, dmg }));
      setTimeout(() => statusFx(fi, `🌱 now ${card.growDmg > 0 ? card.growDmg + ' dmg' : card.growDmg}`, 'buff', 'buff', ['#5fd13a', '#fff', '#b4ff8a']), 300);
    }
    for (let wi = 0; wi < WHEELS && foe.hp > 0 && f.hp > 0; wi++) {
      // Magnet charm: a chance to pull this wheel onto a card already showing on another wheel
      const showing = landedThisTurn.filter((c, i) => c && i !== wi).map(fxSlug);
      const pull = showing.length && Math.random() < charmCount(f.p, 'magnet') * 0.2;
      // Magnet Fly item: the next spins are pulled onto your highest-damage card
      const magnetItem = f.it?.magnet > 0, bestMult = Math.max(...f.loadout.map(c => c.mult || 0));
      if (magnetItem) f.it.magnet--;
      let card = f.loadout[await spin(f, wi, magnetItem ? c => (c.mult || 0) === bestMult : pull ? c => showing.includes(fxSlug(c)) : undefined)];
      if (magnetItem) setTimeout(() => statusFx(fi, `🧲 Magnet Fly (${f.it.magnet} left)`, 'buff', 'buff', ['#ff5d8a', '#fff']), 100);
      // Super moves (regions.js) get their Orbital-Laser-style cinematic before they strike
      if (card.superMove && typeof superMoveFx === 'function') await superMoveFx(card, fxCtx(fi, { card, win: body.querySelectorAll('.wheel-window')[wi] }));
      lastHit = 0;
      // Mirror Frog: turns into the card on the wheel before it (so it also counts as a match)
      // (the last card this fighter played: earlier this turn, or from their previous turn)
      const mirrorOf = card.gimmick === 'mirror' ? ([...landedThisTurn.slice(0, wi)].reverse().find(Boolean) || f.lastCard) : null;
      if (mirrorOf) { card = mirrorOf; setTimeout(() => statusFx(fi, `🪞 copies ${mirrorOf.name}!`, 'buff', 'buff', ['#c0e8ff', '#fff', '#7ae0ff']), 100); }
      // Copycat Card / Mirror Pond items: this card turns into the previous card / the enemy's last card
      if (f.it?.copycat === 0 && wi > 0 && landedThisTurn[wi - 1]) { card = landedThisTurn[wi - 1]; f.it.copycat = -1; setTimeout(() => statusFx(fi, `🃏 Copycat: ${card.name}!`, 'buff', 'buff', ['#c0e8ff', '#fff']), 100); }
      else if (f.it?.pond === 0 && foe.lastCard) { card = foe.lastCard; f.it.pond = -1; setTimeout(() => statusFx(fi, `🪞 Mirror Pond: ${card.name}!`, 'buff', 'buff', ['#7ae0ff', '#fff']), 100); }
      // Overcharge item: the first card of a turn hits x3, the other wheels are skipped
      let overcharged = false;
      if (f.it?.overcharge === 0 && wi === 0 && card.mult > 0) { f.it.overcharge = -1; f.it.overchargeNow = true; overcharged = true; statusFx(fi, '⚡ OVERCHARGE x3!', 'buff', 'buff', ['#ffea00', '#fff']); }
      // Volcano Seed: elemental cards in a row stack up; anything else resets
      if (f.it && 'seed' in f.it) f.it.seed = (card.region || card.element) ? f.it.seed + 1 : 0;
      // Frog Legs: attack cards may strike twice (less likely after each success)
      if (f.it?.legs > 0 && card.mult > 0) { f.it.legs--; if (Math.random() < f.it.legsChance) { f.doubleNext++; f.it.legsChance = Math.max(0, f.it.legsChance - 0.2); setTimeout(() => statusFx(fi, '🐸 Frog Legs: double hit!', 'buff', 'buff', ['#5fd13a', '#fff']), 120); } }
      if (pull && showing.includes(fxSlug(card))) setTimeout(() => statusFx(fi, '🧲 Magnet!', 'buff', 'buff', ['#ff5d8a', '#fff']), 100);
      // Saw chain: saws landing back to back hit harder each time; any other card breaks the chain
      const chainBefore = sawChain;
      sawChain = card.gimmick === 'saw' || card.extra === 'saw' ? sawChain + 1 : 0;
      if (f.it && 'sawdust' in f.it && chainBefore >= 1 && sawChain === 0) { f.it.sawdust++; statusFx(fi, `🪚 Sawdust x${f.it.sawdust}`, 'buff', 'saw', ['#c0c8d0', '#fff']); } // a chain broke
      const sawMult = 1 + (SAW_CHAIN_BONUS + charmCount(f.p, 'grease') * 0.5) * Math.max(0, sawChain - 1); // Grease charm
      if (sawChain > 1) sawChainFx(sawChain, sawMult, wi);
      // Match combo: how many wheels this turn show this same card (a saw re-spin replaces its wheel's card)
      landedThisTurn[wi] = card;
      statCard(f.p, card); // favourite card (awards)
      const matchWheels = landedThisTurn.map((c, i) => c && fxSlug(c) === fxSlug(card) ? i : -1).filter(i => i >= 0);
      const match = matchWheels.length, lucky = charmCount(f.p, 'lucky');
      // Jackpot Ticket item: the next pair counts as a jackpot (if the other wheel's card is a different rarity)
      const other = landedThisTurn.find((c, i) => c && !matchWheels.includes(i));
      const ticket = match === 2 && f.it?.ticket === 0 && (!other || (other.rarity || 'common') !== (card.rarity || 'common'));
      if (ticket) { f.it.ticket = -1; setTimeout(() => banner('🎰 Jackpot Ticket: PAIR → JACKPOT!', 'legendary'), 200); }
      const matchMult = match === 3 || ticket ? MATCH_MULT[3] + lucky : match === 2 ? MATCH_MULT[2] + lucky * 0.5 : 1; // Lucky Coin
      curMatch = match;
      if (match > 1) { matchFx(match, matchWheels, wi, matchMult); questEvent(f.p, 'jackpot'); stat(f.p, 'combos'); }
      const matchPart = match > 1 ? [`🎰 ${match === 3 ? 'JACKPOT' : 'pair'} x${matchMult}`] : [];
      // A fused Double Croak powers up this card's own attack, so it's applied before attacking
      const preDouble = card.extra === 'double' && card.mult > 0;
      if (preDouble) applyEffect('double', wi, card);
      // Mythical cards: their special gimmick (some act before the attack, some after)
      const myth = mythicOf(card), mythCtx = { f, foe, wi, leeches, card };
      if (myth) setTimeout(() => statusFx(fi, `✨ ${myth.name}!`, 'buff', 'buff', ['#ff2bd6', '#7a5cff', '#2bd6ff', '#fff']), 150);
      if (myth?.pre) myth.pre(mythCtx);
      // Boss attacks that act before the hit lands
      if (card.gimmick === 'cleave') gimmickFx('cleave', fxCtx(fi, { card, blocked: foe.shield > 0 }));
      if (card.gimmick === 'frenzy') gimmickFx('frenzy', fxCtx(fi, { card }));
      if (card.gimmick === 'cleave' && foe.shield) {
        foe.shield = 0;
        statusFx(foeI, `${card.element ? card.art : '🦴'} shields smashed!`, 'poison', 'stun', ['#fff', '#c2185b', '#ffb3c8']);
      }
      if (card.gimmick === 'frenzy') f.doubleNext += 2; // three strikes
      if (card.curse) { // Rotten Egg: the stink hurts you
        const self = Math.min(f.hp - 1 > 0 ? f.hp - 1 : 0, f.p.attack * 2);
        f.hp -= self;
        showDamage(self, `🥚 ${card.name} — it hurts YOU`, 'cursed');
        hurtFx(fi, `🥚 -${self}`);
        fxParticles(...fxPoint(hpBox(fi)), { count: 16, colors: ['#8a9a3a', '#c8d060', '#5a6a1a'], spread: 110, gravity: 60 });
        sfx('poison', 0.7); updateHp();
      }
      if (card.orbital) {
        // Orbital Laser: each landing charges it; the ORBITAL_CHARGES-th landing this turn fires the laser
        orbitalCharges++;
        if (orbitalCharges % ORBITAL_CHARGES) orbitalChargeFx(orbitalCharges % ORBITAL_CHARGES, body.querySelectorAll('.wheel-window')[wi]);
        else {
          const dmg = Math.round(dmgOf({ mult: ORBITAL_MULT }) * matchMult);
          await orbitalLaserFx(hpBox(foeI), panel);
          const before = foe.hp;
          foe.hp = Math.max(0, foe.hp - dmg); // straight from orbit: shields can't stop it
          turnTotal += before - foe.hp;
          showDamage(before - foe.hp, `🛰️ ORBITAL LASER · ${f.p.attack} ⚔️ × ${ORBITAL_MULT}${matchMult > 1 ? ` × ${matchMult}` : ''}`, 'ignores shields');
          hurtFx(foeI, `-${before - foe.hp}`, 72);
          updateHp();
          await sleep(700);
        }
      }
      if (card.mult > 0 && card.quiz && !f.p.enemy) {
        // Skill check card: answer fast for more damage; a wrong or slow answer heals the foe instead
        const base = Math.round(dmgOf(card) * sawMult * matchMult * (isVenom(card) && foe.poison ? 2 : 1));
        const res = await battleCheck(f.p, card, base);
        await itemsOnSkillCheck(res > 0, res / Math.max(1, base * 2));
        if (res > 0) lastHit = await attack(res, [`🧠 ${card.name} ${res}`], card);
        else {
          const before = foe.hp;
          foe.hp = Math.min(foe.maxHp, foe.hp - res);
          showDamage(before - foe.hp, `🧠 ${card.name} failed — heals the foe`, '');
          healFx(foeI, `+${foe.hp - before}`);
          updateHp();
        }
      } else if (card.mult > 0) lastHit = await attack(Math.round(dmgOf(card) * sawMult * matchMult * (isVenom(card) && foe.poison ? 2 : 1)), [`${f.p.attack} ⚔️`, `${card.mult} ${card.name}`,
        ...(isVenom(card) && foe.poison ? ['🦷 poisoned x2'] : []),
        ...(sawMult > 1 ? [`🪚 chain x${sawMult}`] : []), ...matchPart], card);
      if (card.gimmick === 'grow') await growCard(card, matchMult);
      applyEffect(card.gimmick, wi, card);
      // Matched cards without damage apply their gimmick again (once more for a pair, twice for a jackpot)
      if (match > 1 && !(card.mult > 0) && card.gimmick !== 'grow') for (let k = 1; k < match; k++) applyEffect(card.gimmick, wi, card);
      if (card.extra && !preDouble) applyEffect(card.extra, wi, card);
      if (myth?.post) { myth.post(mythCtx); updateHp(); }
      if (card.gimmick !== 'mirror') f.lastCard = card; // Mirror Frog copies this later, even next turn
      const step = RARITY_STEP[card.rarity || 'common'] || 0;
      if (f.it && 'curse' in f.it && step && f.hp > 1) { const self = Math.min(f.hp - 1, Math.round(f.maxHp * [0, 0.02, 0.04, 0.06, 0.1][step])); f.hp -= self; hurtFx(fi, `💎 curse -${self}`); updateHp(); }
      updateHp();
      const isSaw = card.gimmick === 'saw' || card.extra === 'saw';
      if (isSaw) { sfx('saw', 1 + bonus * 0.15); sawsThisTurn++; }
      // Saw Blade (or a fused saw): this wheel spins again, up to MAX_SPINS_PER_WHEEL spins on this wheel
      if (isSaw && bonus < MAX_SPINS_PER_WHEEL - 1 && foe.hp > 0) {
        bonus++;
        respinFx(wi);
        comboSfx(++respinsThisTurn); // each re-spin this turn sings a note higher
        await sleep(500);
        wi--;
        continue;
      }
      bonus = 0; // next wheel gets its own spin count
      await sleep(450);
      if (overcharged) break; // Overcharge: the other wheels sit this turn out
    }
    // Three's Company item: all 3 wheels on different cards = a bonus hit
    if (f.it && 'threes' in f.it && foe.hp > 0 && landedThisTurn.filter(Boolean).length === 3 && new Set(landedThisTurn.map(fxSlug)).size === 3) {
      const extra = hit(foe, f.p.attack * 4);
      statusFx(fi, "🃏 Three's Company!", 'buff', 'buff', ['#ffd23f', '#fff']);
      if (extra) { hurtFx(foeI, `🃏 -${extra}`); turnTotal += extra; }
      updateHp(); await sleep(400);
    }
    // Dragonfly pet: a quick strike of its own after your wheels
    if (f.p.pet === 'dragonfly' && foe.hp > 0) {
      const st = petStage(f.p), crit = st >= 3 && Math.random() < f.p.critChance;
      const dealt = hit(foe, Math.round(f.p.attack * st * (crit ? f.p.critMult : 1)));
      await fxFly(fxPoint(hpBox(fi)), fxPoint(hpBox(foeI)), { html: petIcon(f.p), cls: 'pet-strike', ms: 320, arc: -60, spin: 30 });
      stat(f.p, 'pet');
      if (dealt) { hurtFx(foeI, `${petIcon(f.p)} -${dealt}${crit ? ' CRIT' : ''}`); sfx('hit', 1.4); turnTotal += dealt; }
      else floatFx(foeI, 'BLOCKED', 'shield');
      updateHp();
      await sleep(300);
    }
    questEvent(f.p, 'bigturn', turnTotal);
    curMatch = 1; // Leech's drains and re-spins aren't part of a match
    // Leech: if the turn had physical attacks, drain that much again (damage the foe and heal it);
    // otherwise re-spin its wheel and drain that card's damage
    const cardDamage = turnTotal; // damage from this turn's cards, not counting Leech drains
    // Decide once from the wheels themselves, so one Leech's re-spin doesn't change what the next Leech does
    const hadAttacks = physicalCount > 0;
    for (const wi of leeches) {
      if (foe.hp <= 0 || f.hp <= 0) break;
      // Point at the Leech's wheel so it's clear which card is acting
      const win = body.querySelectorAll('.wheel-window')[wi];
      restartAnim(win, 'landed');
      if (hadAttacks) {
        blocked = 0;
        const dealt = hit(foe, cardDamage);
        turnTotal += dealt;
        showDamage(dealt, `🩸 Leech drains this turn's ${cardDamage} damage`, blocked ? '🪷 blocked' : '');
        battleFx('leechDrain', fxCtx(fi, { dmg: dealt, blocked: !!blocked, win }));
        if (dealt > 0) { hurtFx(foeI, `-${dealt}`); shake(); }
        else if (blocked) floatFx(foeI, 'BLOCKED', 'shield');
        const before = f.hp;
        f.hp = Math.min(f.maxHp, f.hp + dealt);
        if (dealt > 0) healFx(fi, `🩸 +${f.hp - before}`);
        updateHp();
      } else {
        showDamage(0, '🩸 No attacks this turn — Leech spins for damage!', '');
        await sleep(600);
        // Re-spin the Leech's own wheel; guaranteed to land on a damaging card if the loadout has one
        respinFx(wi);
        comboSfx(++respinsThisTurn);
        const rolled = f.loadout[await spin(f, wi, c => c.mult > 0)];
        const d = await attack(dmgOf(rolled), [`${f.p.attack} ⚔️`, `${rolled.mult} ${rolled.name}`, 'Leech'], rolled);
        if (d > 0) {
          f.hp = Math.min(f.maxHp, f.hp + d);
          healFx(fi, `🩸 +${d}`);
          updateHp();
        } else if (!dmgOf(rolled)) {
          showDamage(0, `🩸 Leech rolled ${rolled.name} — no damage`, '');
        }
      }
      await sleep(450);
    }
    body.innerHTML = hpRow() + reel(f, true) + body.querySelector('.dmg-counter').outerHTML;
    if (foe.hp > 0) await waitGo(`Next: ${foe.p.name}'s turn`);
    cur = 1 - cur;
  }

  // Enemy fight result: win → reward quiz (speed multiplies the coins); lose → pay the tier's penalty
  async function enemyResult(won) {
    const tier = enemy.tier, p = attacker;
    await waitGo('See result');
    if (!won) {
      stat(p, 'losses');
      p.revenge = true; // comeback: +30% damage in your next battle
      const greedy = fighters[0].it && 'greedy' in fighters[0].it ? Math.round(p.coins * 0.25) : 0; // Greedy Frog item
      const lost = Math.min(p.coins, tier.loss + greedy);
      p.coins -= lost;
      title.textContent = `${enemy.name} wins...`;
      sfx('fail');
      // Losing to a monster permanently weakens you: -25% HP, damage, crit chance and crit damage
      const k = 1 - MONSTER_LOSS_PENALTY;
      p.maxHp = Math.max(10, Math.round(p.maxHp * k));
      p.attack = Math.max(1, Math.round(p.attack * k));
      p.critChance = +(p.critChance * k).toFixed(3);
      p.critMult = Math.max(1.5, +(p.critMult * k).toFixed(2));
      flash('#5a0000', 0.5); banner('💀 WEAKENED! All stats -25%', 'lose');
      msg.innerHTML = `${p.name} was defeated and drops <span class="lose-text">${lost} coins</span>.<br>` +
        `<span class="lose-text">💀 Permanently weakened: ❤️ ${p.maxHp} HP · ⚔️ ${p.attack} · 🎯 ${Math.round(p.critChance * 100)}% · 💥 x${p.critMult}</span>`;
      body.innerHTML = hpRow();
    } else {
      // Reward question, as hard as the enemy was
      el.hidden = true;
      const mult = await quizPanel(coinIcon([0, tier.reward]), `Victory! ${tier.reward} coins`,
        'Answer fast to multiply your reward! Wrong answer halves it.', async result => {
          const { correct, timeLeft } = await askQuestion(makeQuestion(tier.quiz), 9000 + tier.quiz * 6000);
          const m = correct ? +(1 + timeLeft).toFixed(2) : 0.5;
          sfx(correct ? 'coin' : 'fail', correct ? 0.9 + timeLeft * 0.4 : 1);
          result.innerHTML = `${correct ? (timeLeft > 0.6 ? 'Lightning fast!' : 'Correct!') : timeLeft <= 0 ? 'Too slow!' : 'Wrong!'} ` +
            `Reward <span class="${m < 1 ? 'lose-text' : ''}">×${m}</span>`;
          return m;
        });
      const sm = streakMult(p); // answer streak multiplies the reward too
      questEvent(p, 'win');
      stat(p, 'wins'); if (tier.key === 'boss') stat(p, 'bosses');
      gainXp(p, 12 + (tier.key === 'boss' ? ENEMY_TIERS.length * 8 + 40 : ENEMY_TIERS.findIndex(t => t.key === tier.key) * 8)); // the boss ranks above every tier
      if (tier.key === 'boss') { gainCrowns(p, BOSS_CROWNS, `${BOSS_TIER.name} defeated!`); p.clearedRegion = true; } // on to the next region (progression.js)
      const bounty = (1 + charmCount(p, 'bounty') * 0.3) * (swampActive('moon') ? 2 : 1); // Bounty Hunter charm, Full Moon
      const got = gainCoins(p, Math.round(tier.reward * mult * sm * bounty));
      coinFly(innerWidth / 2, innerHeight / 2, got);
      confetti(60);
      el.hidden = false;
      title.textContent = `${p.name} defeats ${enemy.name}!`;
      sfx('win');
      flash('#ffd23f', 0.5);
      burst(title, ['#ffd23f', '#fff', '#ff5d5d', '#6aa8ff', '#3cdc3c'], 60, 2);
      // The enemy drops its artifact, or levels it up if you already have it
      const ak = artifactKey(tier), a = ARTIFACTS[ak], lvl = artifactCount(p, ak) + 1;
      p.artifacts[ak] = lvl;
      msg.innerHTML = `Reward: ${tier.reward} × ${mult}${sm > 1 ? ` × 🔥${sm}` : ''} = <b>${got} coins</b>` + (p.moneyMult !== 1 ? ' (with Money bonus)' : '') +
        `<div class="artifact-drop">${a.art} ${lvl > 1 ? 'Artifact upgraded' : 'New artifact'}: <b>${a.name} Lv ${lvl}</b><br><small>${a.desc(lvl)}</small></div>`;
      setTimeout(() => sfx('card_land_gimmick', 0.8), 300);
      body.innerHTML = hpRow();
    }
    render();
    await waitGo('Done');
    el.hidden = true;
  }

  // Result
  // Growing cards keep their progress: they go back to their owner's hand instead of being used up
  fighters.forEach(fg => fg.p.hand.push(...new Set(fg.loadout.filter(c => c.gimmick === 'grow'))));
  // (if both somehow fell at once, the one whose turn it was loses)
  const winF = fighters.find(f => f.hp > 0) || fighters[1 - cur], loseF = fighters.find(f => f !== winF);
  if (winF && loseF) { battleFx('ko', fxCtx(fighters.indexOf(winF))); sfx('heavy_slam', 0.8, 1); await sleep(900); } // finishing blow
  if (enemy) return enemyResult(winF.p === attacker);
  const bounty = hasBounty(loseF.p), bountyPay = bounty ? bountyCoins(loseF.p) : 0; // the leader lost a duel
  stat(winF.p, 'wins'); stat(loseF.p, 'losses');
  const prize = Math.min(BATTLE_PRIZE, loseF.p.coins);
  loseF.p.coins -= prize;
  const won = gainCoins(winF.p, Math.round(prize * (1 + charmCount(winF.p, 'bounty') * 0.3))); // Money stat and Bounty Hunter boost it
  questEvent(winF.p, 'win');
  gainXp(winF.p, 15);
  if (bounty) { // collect the bounty: coins and a stolen crown
    gainCoins(winF.p, bountyPay);
    loseF.p.regionLaps = Math.max(0, (loseF.p.regionLaps || 0) - 1); // the bounty steals a lap
    setTimeout(() => addLap(winF.p, `🎯 Bounty claimed! Stole a lap from ${loseF.p.name}!`), 400);
  }
  await waitGo('See result');
  title.textContent = `${winF.p.name} wins!`;
  sfx('win');
  flash('#ffd23f', 0.5);
  burst(title, ['#ffd23f', '#fff', '#ff5d5d', '#6aa8ff', '#3cdc3c'], 60, 2);
  msg.textContent = `${winF.p.name} takes ${prize} coin${prize === 1 ? '' : 's'} from ${loseF.p.name}` + (won > prize ? ` (+${won - prize} Money bonus).` : '.') +
    (bounty ? ` 🎯 Bounty claimed: +${bountyPay} coins and a lap!` : '');
  body.innerHTML = hpRow();
  render();
  await waitGo('Done');
  el.hidden = true;
}

// ---------- Orbital Laser (global so the card animation viewer can play it too) ----------
// Orbital Laser charging: a satellite light on the wheel and a charge meter (1/3, 2/3)
function orbitalChargeFx(n, win) {
  try {
    const [x, y] = fxPoint(win);
    fxPop(x, y - 20, `🛰️ CHARGE ${n}/${ORBITAL_CHARGES}`, { cls: 'orbital-charge', ms: 1100, size: 26 + n * 6 });
    fxRing(x, y, { color: '#7af7ff', size: 120 + n * 50, width: 3 + n * 2 });
    fxParticles(x, y, { count: 8 + n * 6, colors: ['#7af7ff', '#ff2bd6', '#fff'], spread: 70 + n * 30, size: [2, 5], ms: 700 });
    sfx('buff', 0.7 + n * 0.2, 0.8); comboSfx(n);
    if (n === ORBITAL_CHARGES - 1) banner('🛰️ ONE MORE FOR ORBITAL LASER!', 'legendary');
  } catch (e) { console.warn('orbital charge fx', e); }
}
// Orbital Laser pieces (the full timeline is described above orbitalLaserFx below)
const OL_RAINBOW = ['#ff1744', '#ff9100', '#ffea00', '#00e676', '#00b0ff', '#d500f9'];
function olWarp(el, k) { // brief screen "distortion": squash, skew and snap back
  try { el?.animate?.([{ transform: 'none' }, { transform: `scale(${1 + 0.04 * k}, ${1 - 0.05 * k}) skewX(${-3 * k}deg)` },
    { transform: `scale(${1 - 0.03 * k}, ${1 + 0.04 * k}) skewX(${2 * k}deg)` }, { transform: `scale(${1 + 0.015 * k}) skewX(${-1 * k}deg)` }, { transform: 'none' }], { duration: 520, easing: 'ease-out' }); } catch (e) {}
}
function olDetonate(x, y, colors, k) {
  for (let i = 0; i < 4; i++) setTimeout(() => fxRing(x, y, { color: colors[i % colors.length], size: (420 + i * 260) * k, width: 14 - i * 2, ms: 700 + i * 180 }), i * 90);
  // Heat ripples: thin fast rings that read as the air bending
  for (let i = 0; i < 3; i++) setTimeout(() => fxRing(x, y, { color: '#ffffff88', size: 260 * k + i * 120, width: 2, ms: 500, cls: 'ol-ripple' }), 60 + i * 110);
  fxParticles(x, y, { count: 36, colors, spread: 420 * k, size: [4, 12], gravity: 160, ms: 1300 });
  fxParticles(x, y, { count: 14, colors: ['#fff'], spread: 260 * k, size: [2, 4], cone: 120, angle: -90, ms: 900 });
  const orb = fxSpawn(x, y, { cls: 'ol-orb', ms: 1100, size: [300 * k, 300 * k] });
  fxAnimate(orb, [{ transform: 'scale(0.15)', opacity: 1 }, { transform: 'scale(1.5)', opacity: 0.95, offset: 0.3 }, { transform: 'scale(2.6)', opacity: 0 }], 1100, 'ease-out');
}
// Lightning arc: a jagged bolt between two points that flickers for a moment
function olBolt(a, b, color, ms = 160) {
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, n = 7;
  let pts = '0,10';
  for (let i = 1; i < n; i++) pts += ` ${(i / n * 100).toFixed(1)},${(10 + fxRand(-9, 9)).toFixed(1)}`;
  pts += ' 100,10';
  const el = fxSpawn(a[0], a[1], { cls: 'ol-bolt', ms, style: { width: len + 'px', height: '40px', transformOrigin: '0 50%' },
    html: `<svg viewBox="0 0 100 20" preserveAspectRatio="none" width="100%" height="100%"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round"/>` +
      `<polyline points="${pts}" fill="none" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/></svg>` });
  el?.animate([{ transform: `translate(0, -50%) rotate(${Math.atan2(dy, dx)}rad)`, opacity: 1 }, { transform: `translate(0, -50%) rotate(${Math.atan2(dy, dx)}rad)`, opacity: 0 }],
    { duration: ms, easing: 'steps(3)', fill: 'forwards' });
}
// Rune circle: a flattened, spinning ring of glyphs on the ground under the target
const OL_GLYPHS = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ☉☽♄♃♂♀☿✶⟁';
const olGlyph = i => OL_GLYPHS[i % OL_GLYPHS.length];
// A big, detailed sigil: three rings of glyphs, a hexagram, spokes and tick marks
const OL_SIGIL = (c1, c2, c3) => '<svg viewBox="0 0 400 400" width="100%" height="100%"><g fill="none">' +
  `<circle cx="200" cy="200" r="192" stroke="${c1}" stroke-width="5"/><circle cx="200" cy="200" r="178" stroke="${c2}" stroke-width="2"/>` +
  `<circle cx="200" cy="200" r="142" stroke="${c1}" stroke-width="3" stroke-dasharray="14 6"/><circle cx="200" cy="200" r="104" stroke="${c3}" stroke-width="3"/>` +
  `<circle cx="200" cy="200" r="60" stroke="${c2}" stroke-width="4"/><circle cx="200" cy="200" r="22" stroke="${c1}" stroke-width="3"/>` +
  `<polygon points="200,58 323,271 77,271" stroke="${c2}" stroke-width="3"/><polygon points="200,342 77,129 323,129" stroke="${c2}" stroke-width="3"/>` +
  Array.from({ length: 24 }, (_, i) => `<line x1="200" y1="8" x2="200" y2="${i % 2 ? 22 : 34}" stroke="${c1}" stroke-width="3" transform="rotate(${i * 15} 200 200)"/>`).join('') +
  Array.from({ length: 8 }, (_, i) => `<line x1="200" y1="104" x2="200" y2="142" stroke="${c3}" stroke-width="2" transform="rotate(${i * 45 + 22.5} 200 200)"/>`).join('') + '</g>' +
  Array.from({ length: 24 }, (_, i) => `<text x="200" y="48" transform="rotate(${i * 15} 200 200)" text-anchor="middle" font-size="22" fill="${c1}">${olGlyph(i)}</text>`).join('') +
  Array.from({ length: 16 }, (_, i) => `<text x="200" y="92" transform="rotate(${i * 22.5 + 11} 200 200)" text-anchor="middle" font-size="18" fill="${c3}">${olGlyph(i + 7)}</text>`).join('') +
  Array.from({ length: 6 }, (_, i) => `<text x="200" y="166" transform="rotate(${i * 60} 200 200)" text-anchor="middle" font-size="20" fill="${c2}">${olGlyph(i + 24)}</text>`).join('') + '</svg>';
// A full-screen sigil turning slowly behind everything
function olBigSigil(x, y, size, ms, colors, spin) {
  const el = fxSpawn(x, y, { cls: 'ol-sigil', ms, size: [size, size], html: OL_SIGIL(...colors) });
  fxAnimate(el, [{ transform: 'scale(0.4) rotate(0deg)', opacity: 0 }, { transform: `scale(1) rotate(${spin * 0.15}deg)`, opacity: 0.55, offset: 0.15 },
    { transform: `scale(1.02) rotate(${spin * 0.8}deg)`, opacity: 0.55, offset: 0.85 }, { transform: `scale(1.3) rotate(${spin}deg)`, opacity: 0 }], ms, 'linear');
  return el;
}
// A stack of flattened rune rings down the beam's path, lighting up one after another
function olRuneColumn(x, y, n, size, ms, colors, gap) {
  for (let i = 0; i < n; i++) setTimeout(() => {
    const ry = y * (i + 0.5) / n, el = fxSpawn(x, ry, { cls: 'ol-runes', ms: ms - i * gap, size: [size * (0.6 + i / n * 0.5), size * (0.6 + i / n * 0.5)],
      html: OL_RUNES(colors[i % colors.length], colors[(i + 1) % colors.length]) }); // the lighter ring art: these are flattened and small anyway
    const dir = i % 2 ? -1 : 1;
    fxAnimate(el, [{ transform: 'scale(0.1, 0.03) rotate(0deg)', opacity: 0 }, { transform: 'scale(1, 0.26) rotate(0deg)', opacity: 1, offset: 0.1 },
      { transform: `scale(1, 0.26) rotate(${dir * 300}deg)`, opacity: 1, offset: 0.88 }, { transform: `scale(1.5, 0.4) rotate(${dir * 360}deg)`, opacity: 0 }], ms - i * gap, 'linear');
    sfx('wheel_tick', 0.8 + i * 0.12, 0.9);
  }, i * gap);
}
// Glowing glyphs that float up around the target, or swirl inward toward it
function olGlyphs(x, y, n, colors, { inward = false, radius = 300, ms = 1100 } = {}) {
  for (let i = 0; i < n; i++) setTimeout(() => {
    const a = fxRand(0, Math.PI * 2), rr = fxRand(radius * 0.4, radius), c = colors[i % colors.length];
    const from = inward ? [x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.7] : [x + fxRand(-radius, radius), y + fxRand(-20, 40)];
    const g = fxSpawn(from[0], from[1], { cls: 'ol-glyph', html: olGlyph(i * 5 + 3), ms, style: { color: c, textShadow: `0 0 8px ${c}`, fontSize: fxRand(20, 42) + 'px' } });
    const end = inward ? `translate(${x - from[0]}px, ${y - from[1]}px) scale(0.3) rotate(${fxRand(-180, 180)}deg)` : `translate(${fxRand(-40, 40)}px, ${-fxRand(180, 380)}px) scale(1.3) rotate(${fxRand(-90, 90)}deg)`;
    fxAnimate(g, [{ transform: 'scale(0.2)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: 0.2 }, { transform: end, opacity: 0 }], ms, inward ? 'ease-in' : 'ease-out');
  }, i * (ms / n) * 0.8);
}
// Glowing cracks spreading across the screen from the impact (like reality splitting)
function olCracks(x, y, colors) {
  let paths = '';
  for (let i = 0; i < 10; i++) {
    let px = 500, py = 500, d = `M500 500`;
    const a = i / 10 * Math.PI * 2 + fxRand(-0.2, 0.2);
    for (let k = 1; k <= 6; k++) { px += Math.cos(a + fxRand(-0.5, 0.5)) * 70; py += Math.sin(a + fxRand(-0.5, 0.5)) * 70; d += ` L${px.toFixed(0)} ${py.toFixed(0)}`; }
    paths += `<path d="${d}" stroke="${colors[i % colors.length]}" stroke-width="5" fill="none" stroke-linejoin="round"/><path d="${d}" stroke="#fff" stroke-width="2" fill="none"/>`;
  }
  const size = Math.max(innerWidth, innerHeight) * 1.2;
  const el = fxSpawn(x, y, { cls: 'ol-cracks', ms: 1500, size: [size, size], html: `<svg viewBox="0 0 1000 1000" width="100%" height="100%">${paths}</svg>` });
  fxAnimate(el, [{ transform: 'scale(0.1)', opacity: 1 }, { transform: 'scale(1)', opacity: 1, offset: 0.25 }, { transform: 'scale(1.05)', opacity: 0.8, offset: 0.7 }, { transform: 'scale(1.1)', opacity: 0 }], 1500, 'cubic-bezier(.1,.9,.3,1)');
}
const OL_RUNES = (c1, c2) => '<svg viewBox="0 0 200 200" width="100%" height="100%"><g fill="none">' +
  `<circle cx="100" cy="100" r="92" stroke="${c1}" stroke-width="4"/><circle cx="100" cy="100" r="74" stroke="${c2}" stroke-width="2" stroke-dasharray="6 5"/>` +
  `<circle cx="100" cy="100" r="40" stroke="${c1}" stroke-width="3"/>` +
  `<polygon points="100,12 176,144 24,144" stroke="${c2}" stroke-width="2"/><polygon points="100,188 24,56 176,56" stroke="${c2}" stroke-width="2"/></g>` +
  Array.from({ length: 12 }, (_, i) => `<text x="100" y="22" transform="rotate(${i * 30} 100 100)" text-anchor="middle" font-size="13" fill="${c1}">${'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃ'[i]}</text>`).join('') + '</svg>';
function olRunes(x, y, size, c1, c2, ms) {
  const el = fxSpawn(x, y, { cls: 'ol-runes', ms, size: [size, size], html: OL_RUNES(c1, c2) });
  fxAnimate(el, [{ transform: 'scale(0.2, 0.07) rotate(0deg)', opacity: 0 }, { transform: 'scale(1, 0.35) rotate(0deg)', opacity: 1, offset: 0.12 },
    { transform: 'scale(1.05, 0.37) rotate(200deg)', opacity: 1, offset: 0.85 }, { transform: 'scale(1.4, 0.5) rotate(260deg)', opacity: 0 }], ms, 'linear');
}
// Energy rings and helix sparks travelling down the beam from the sky into the target
function olDescend(x, y, W, colors, count, every) {
  for (let i = 0; i < count; i++) setTimeout(() => {
    const ring = fxSpawn(x, -40, { cls: 'ol-descend', ms: 460, size: [W * 1.1, W * 0.28], style: { borderColor: colors[i % colors.length] } });
    fxAnimate(ring, [{ transform: 'translateY(0) scale(0.7)', opacity: 0.9 }, { transform: `translateY(${y + 40}px) scale(1.15)`, opacity: 0.2 }], 440, 'ease-in');
    // Two helix sparks spiralling round the beam
    [0, 1].forEach(k => {
      const spark = fxSpawn(x, -20, { cls: 'ol-helix', ms: 560, style: { background: colors[(i + k) % colors.length], boxShadow: `0 0 12px ${colors[(i + k) % colors.length]}` } });
      const frames = [];
      for (let f = 0; f <= 8; f++) { const t = f / 8; frames.push({ transform: `translate(${Math.sin(t * Math.PI * 3 + k * Math.PI) * W * 0.6}px, ${(y + 20) * t}px) scale(${1 + Math.cos(t * Math.PI * 3 + k * Math.PI) * 0.5})` }); }
      fxAnimate(spark, frames, 540, 'linear');
    });
  }, i * every);
}
// Orbital Laser firing. Timeline (t = 0 is the impact, when orbital_laser plays):
//   -1.2s  the screen goes to deep space, a reticle + rune circle lock onto the target, targeting lines sweep in
//    0s    a screen-wide beam slams down: a pure white core (with energy flowing through it) inside a vivid
//          cyan beam and a glow that fills the screen; white-out, shockwaves, lightning, debris, screen warp
//    1.9s  ESCALATION (matches the second hit in the sound): an edge-to-edge rainbow laser erupts over it,
//          strobing and pulsing, side lasers converge from the corners, a second, bigger detonation
//    ~3.6s everything collapses back into the sky
// No words at impact: it's all light, energy and motion.
async function orbitalLaserFx(to, panel) {
  const capBefore = FX_MAX_NODES;
  FX_MAX_NODES = 700; // the ultimate gets room for all its layers
  try {
    // The beam comes straight down the middle of the screen, landing level with the target
    const y = fxPoint(to)[1], x = innerWidth / 2;
    const VW = innerWidth, VH = innerHeight;
    banner('🛰️ ORBITAL LASER 🛰️', 'fire');
    // Deep-space darkness for the whole sequence, and a pulsing energy vignette round the screen edges
    const dark = fxSpawn(0, 0, { cls: 'fx-tint orbital-dark', ms: 5000 });
    dark?.animate([{ opacity: 0 }, { opacity: 0.9, offset: 0.12 }, { opacity: 0.9, offset: 0.82 }, { opacity: 0 }], { duration: 5000, fill: 'forwards' });
    const edge = fxSpawn(0, 0, { cls: 'fx-tint ol-edge', ms: 5000 });
    edge?.animate([{ opacity: 0 }, { opacity: 0.4, offset: 0.25 }, { opacity: 0.9, offset: 0.28 }, { opacity: 0.5, offset: 0.5 }, { opacity: 1, offset: 0.62 },
      { opacity: 0.6, offset: 0.75 }, { opacity: 0 }], { duration: 5000, fill: 'forwards' });
    // Lock-on: reticle, rune circle, and targeting lines sweeping in from the screen corners
    const lock = fxSpawn(x, y, { cls: 'orbital-lock', ms: 1200, size: [240, 240] });
    fxAnimate(lock, [{ transform: 'scale(3) rotate(-120deg)', opacity: 0 }, { transform: 'scale(1) rotate(0)', opacity: 1, offset: 0.55 },
      { transform: 'scale(0.92)', opacity: 1, offset: 0.85 }, { transform: 'scale(0.5)', opacity: 0 }], 1200);
    olRunes(x, y + 20, Math.min(VW, 700), '#00e5ff', '#ff2bd6', 5200);
    // A giant sigil fills the screen behind everything, a column of rune rings stacks down the beam's path,
    // and glyphs swirl in toward the target
    olBigSigil(VW / 2, VH / 2, Math.max(VW, VH) * 1.25, 5400, ['#00e5ff', '#ff2bd6', '#7af7ff'], 140);
    olRuneColumn(x, y, 3, Math.min(VW * 0.7, 460), 5000, ['#00e5ff', '#ff2bd6', '#7a5cff'], 300);
    olGlyphs(x, y, 12, ['#7af7ff', '#ff2bd6', '#ffffff'], { inward: true, radius: Math.min(VW, 700) * 0.7, ms: 1500 });
    // Rune seals spin up in the four corners, then fire their targeting lines
    [[70, 70], [VW - 70, 70], [70, VH - 70], [VW - 70, VH - 70]].forEach((c, i) => setTimeout(() => olRunes(c[0], c[1], 150, '#ff2b2b', '#ffea00', 1800), i * 100));
    [[70, 70], [VW - 70, 70], [70, VH - 70], [VW - 70, VH - 70]].forEach((c, i) => setTimeout(() => fxBeam(c, [x, y], { cls: 'ol-target', ms: 900, width: 4 }), 500 + i * 140));
    for (let i = 0; i < 12; i++) setTimeout(() => sfx('wheel_tick', 1.2 + i * 0.12, 1), 400 + i * 110);
    setTimeout(() => {
      const sight = fxSpawn(x, y / 2, { cls: 'ol-sight', ms: 1250, size: [6, y + 40] });
      fxAnimate(sight, [{ transform: 'scaleY(0)', opacity: 0 }, { transform: 'scaleY(1)', opacity: 0.9, offset: 0.4 }, { transform: 'scaleY(1) scaleX(3)', opacity: 1 }], 1200, 'ease-in');
    }, 500);
    await sleep(1750);

    // ---- IMPACT (t = 0) ----
    sfx('orbital_laser', 1, 1);
    const H = VH + 120, cy = H / 2 - 80; // the beam runs top to bottom of the whole screen
    const W = VW * 0.5;
    const beam = fxSpawn(x, cy, { cls: 'ol-beam', ms: 3800, size: [W, H],
      html: '<div class="ol-glow"></div><div class="ol-outer"></div><div class="ol-core"><div class="ol-flow"></div></div>' });
    fxAnimate(beam, [
      { transform: 'scaleX(0.02)', opacity: 1 }, { transform: 'scaleX(1.35)', opacity: 1, offset: 0.05 },
      { transform: 'scaleX(0.94)', opacity: 1, offset: 0.1 }, { transform: 'scaleX(1.06)', opacity: 1, offset: 0.3 },
      { transform: 'scaleX(0.96)', opacity: 1, offset: 0.5 }, { transform: 'scaleX(1.1)', opacity: 1, offset: 0.8 },
      { transform: 'scaleX(1)', opacity: 1, offset: 0.9 }, { transform: 'scaleX(0) scaleY(1.05)', opacity: 0 },
    ], 3800, 'ease-out');
    // Chromatic split copies jittering either side
    [-1, 1].forEach(side => {
      const ghost = fxSpawn(x + side * 14, cy, { cls: 'ol-ghost ' + (side < 0 ? 'l' : 'r'), ms: 1500, size: [W, H] });
      fxAnimate(ghost, [{ transform: 'translateX(0)', opacity: 0.55 }, { transform: `translateX(${side * 22}px)`, opacity: 0.45, offset: 0.2 },
        { transform: `translateX(${-side * 8}px)`, opacity: 0.3, offset: 0.5 }, { transform: `translateX(${side * 30}px)`, opacity: 0 }], 1500, 'linear');
    });
    flash('#ffffff', 0.95); haptic(300);
    fxShake(panel, 28, 900); fxShake(to, 22, 800); olWarp(panel, 1.2);
    olDetonate(x, y, ['#ffffff', '#00e5ff', '#18ffff', '#40c4ff'], 1.2);
    olDescend(x, y, W * 0.6, ['#ffffff', '#00e5ff', '#18ffff'], 12, 150);
    olGlyphs(x, y, 10, ['#ffffff', '#18ffff', '#7af7ff'], { radius: W * 0.9, ms: 1500 });
    // Lightning crawling off the beam's edges
    for (let i = 0; i < 6; i++) setTimeout(() => {
      const side = i % 2 ? 1 : -1, sy = fxRand(40, y);
      olBolt([x + side * W * 0.35, sy], [x + side * fxRand(W * 0.6, W * 1.1), sy + fxRand(-120, 120)], '#18ffff');
    }, 80 + i * 250);
    await sleep(1900);

    // ---- ESCALATION (t = 1.9s): the rainbow laser, edge to edge ----
    const RW = VW * 1.15;
    const rb = fxSpawn(x, cy, { cls: 'ol-rainbow', ms: 1900, size: [RW, H],
      // three strobing layers, two colours each, cycle through the whole rainbow
      html: [[0, 1], [2, 3], [4, 5]].map(([a, b]) => `<div class="ol-rb" style="--c:${OL_RAINBOW[a]};--c2:${OL_RAINBOW[b]}"></div>`).join('') + '<div class="ol-rb-edge"></div>' });
    const pulse = [{ transform: 'scaleX(0.05)', opacity: 0 }, { transform: 'scaleX(1.1)', opacity: 1, offset: 0.07 }];
    for (let i = 0; i < 7; i++) pulse.push({ transform: `scaleX(${i % 2 ? 1.08 : 0.62})`, opacity: 1, offset: 0.14 + i * 0.105 });
    pulse.push({ transform: 'scaleX(0)', opacity: 0 });
    fxAnimate(rb, pulse, 1900, 'ease-in-out');
    flash('#ffffff', 1); haptic(400);
    setTimeout(() => flash(OL_RAINBOW[4], 0.5), 120);
    setTimeout(() => flash(OL_RAINBOW[5], 0.45), 260);
    fxShake(panel, 36, 1200); fxShake(to, 28, 1100); olWarp(panel, 1.8);
    olDetonate(x, y, OL_RAINBOW, 1.3);
    olCracks(x, y, OL_RAINBOW);
    olGlyphs(x, y, 14, OL_RAINBOW, { radius: RW * 0.45, ms: 1700 });
    olDescend(x, y, W * 0.8, OL_RAINBOW, 6, 240);
    // Satellite lasers converge from the top corners and sides
    [[0, 0], [VW, 0], [0, VH * 0.4], [VW, VH * 0.4]].forEach((c, i) =>
      setTimeout(() => fxBeam(c, [x, y], { cls: 'ol-side', ms: 900, width: 22 }), 80 + i * 110));
    // Rainbow lightning everywhere
    for (let i = 0; i < 6; i++) setTimeout(() => {
      const a = fxRand(0, Math.PI * 2), r = fxRand(200, 520);
      olBolt([x, y], [x + Math.cos(a) * r, y + Math.sin(a) * r * 0.6], OL_RAINBOW[i % 6], 180);
    }, 60 + i * 220);
    for (let i = 1; i <= 3; i++) setTimeout(() => {
      fxRing(x, y, { color: OL_RAINBOW[i * 2 % 6], size: 600 + i * 160, width: 9, ms: 850 });
      fxShake(panel, 18, 300); haptic(80);
    }, i * 420);
    await sleep(1800);
  } catch (e) { console.warn('orbital laser fx', e); }
  FX_MAX_NODES = capBefore;
}
