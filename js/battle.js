// Battles: loadout picking, spinning wheels, card effects and results.

// --- Battle: each player secretly picks a card (pass the device), then both are revealed ---
function cardFace(c, n, attack = BASE_DAMAGE) {
  return `<div class="card-face${c.gimmick || c.extra ? ' gimmick' : ''}${c.extra ? ' fused' : ''}">` +
    (c.extra ? `<div class="fuse-badge">${c.extraArt}</div>` : '') +
    (cardSlots(c) > 1 ? `<div class="slot-tag">COUNTS AS ${cardSlots(c)}</div>` : '') +
    `<div class="art">${c.art}</div><div class="title">${c.name}</div>
    <div class="text">${c.text(attack)}</div>${n ? `<div class="qty">x${n}</div>` : ''}</div>`;
}

// Each player secretly picks a loadout of LOADOUT_MIN–LOADOUT_MAX cards (pass the device).
// Then they take turns: a spinner rolls through the attacker's loadout and lands on a card,
// which deals base damage × its multiplier. First frog to 0 HP loses.
async function battleEvent() {
  const attacker = players[turn], defender = players[1 - turn];
  const el = document.getElementById('battle');
  const title = document.getElementById('battleTitle');
  const msg = document.getElementById('battleMsg');
  const body = document.getElementById('battleBody');
  const go = document.getElementById('battleGo');
  el.hidden = false;
  const waitGo = label => new Promise(r => { go.textContent = label; go.disabled = false; go.onclick = r; });

  async function chooseLoadout(p) {
    const other = p === attacker ? defender : attacker;
    setFlip(p); // face the player who is picking
    title.textContent = `${p.name}: build your loadout`;
    msg.textContent = `${other.name}, look away!`;
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
    const picked = [];
    msg.textContent = `Pick ${LOADOUT_MIN} to ${LOADOUT_MAX} cards. Tap a selected card to remove it.`;
    body.innerHTML = '<div class="pick-count" id="pickCount"></div><div class="hand-grid pick-grid">' +
      p.hand.map(c => cardFace(c, 0, p.attack)).join('') + '</div>';
    const grid = body.querySelector('.pick-grid');
    const countEl = body.querySelector('#pickCount');
    const faces = [...grid.querySelectorAll('.card-face')];
    // Slots used: most cards take 1, some (Late Bloomer) take 2
    const used = () => picked.reduce((n, i) => n + cardSlots(p.hand[i]), 0);
    const ready = () => used() >= LOADOUT_MIN && used() <= LOADOUT_MAX;
    const update = () => {
      faces.forEach((f, i) => {
        const n = picked.indexOf(i);
        f.classList.toggle('picked', n >= 0);
        f.querySelector('.pick-badge')?.remove();
        if (n >= 0) f.insertAdjacentHTML('beforeend', `<div class="pick-badge">${n + 1}</div>`);
      });
      grid.classList.toggle('has-picks', picked.length > 0);
      grid.classList.toggle('full', used() >= LOADOUT_MAX);
      // Cards that no longer fit in the remaining slots can't be picked
      faces.forEach((f, i) => f.classList.toggle('nofit', !picked.includes(i) && used() + cardSlots(p.hand[i]) > LOADOUT_MAX));
      countEl.textContent = `Slots used ${used()} / ${LOADOUT_MAX}` +
        (used() < LOADOUT_MIN ? ` (need at least ${LOADOUT_MIN})` : ' ✓');
      countEl.classList.toggle('ok', ready());
      go.disabled = !ready();
      go.textContent = ready() ? `Lock in ${picked.length} card${picked.length === 1 ? '' : 's'}` : 'Lock in';
    };
    faces.forEach((f, i) => f.onclick = () => {
      const n = picked.indexOf(i);
      if (n >= 0) { picked.splice(n, 1); sfx('card_pick', 0.8); }
      else if (used() + cardSlots(p.hand[i]) <= LOADOUT_MAX) { picked.push(i); sfx('card_pick', 0.9 + used() * 0.1); }
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
  msg.textContent = `${attacker.name} (${attacker.maxHp} HP) challenges ${defender.name} (${defender.maxHp} HP)! Winner takes ${BATTLE_PRIZE} coins.`;
  body.innerHTML = '';
  await waitGo('Start');
  const fighters = [
    { p: attacker, loadout: await chooseLoadout(attacker), hp: attacker.maxHp, maxHp: attacker.maxHp, poison: 0, poisonDmg: 0, shield: 0, stunned: 0, doubleNext: 0 },
    { p: defender, loadout: await chooseLoadout(defender), hp: defender.maxHp, maxHp: defender.maxHp, poison: 0, poisonDmg: 0, shield: 0, stunned: 0, doubleNext: 0 },
  ];

  // Battle screen: HP bars + the current attacker's spinner reel
  // Segmented health bar: each segment is maxHp / HP_SEGMENTS HP; a segment stays lit while any of its HP is left
  const hpBar = f => '<div class="hp-bar">' + Array.from({ length: HP_SEGMENTS }, (_, k) =>
    `<div class="hp-seg${f.hp > k * f.maxHp / HP_SEGMENTS ? ' full' : ''}"></div>`).join('') + '</div>';
  const hpRow = () => `<div class="hp-row">${fighters.map(f => `
    <div class="hp"><div class="who">${f.p.name}</div>
      ${hpBar(f)}
      <div class="hp-num">${f.hp} / ${f.maxHp} &nbsp; ⚔️ ${f.p.attack}</div>
      <div class="status">${f.poison ? `🧪 ${f.poisonDmg}/turn (${f.poison} left) ` : ''}${f.shield ? `🪷 x${f.shield} ` : ''}${f.stunned ? `🟢 Stunned x${f.stunned} ` : ''}${f.doubleNext ? `🎶 Next attack strikes x${1 + f.doubleNext}` : ''}</div></div>`).join('')}</div>`;
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
          seg.classList.remove('lost', 'gained');
          void seg.offsetWidth;
          seg.classList.add(full ? 'gained' : 'lost');
        }
      });
      el.querySelector('.hp-num').innerHTML = fresh.querySelector('.hp-num').innerHTML;
      el.querySelector('.status').innerHTML = fresh.querySelector('.status').innerHTML;
    });
  }
  const panel = el.querySelector('.battle-panel');
  // Floating text over a fighter's HP block
  function floatFx(i, text, kind, delay = 0) {
    setTimeout(() => {
      const box = body.querySelectorAll('.hp-row .hp')[i];
      if (!box) return;
      const pr = panel.getBoundingClientRect(), br = box.getBoundingClientRect();
      const t = document.createElement('div');
      t.className = 'fx-float ' + kind;
      t.textContent = text;
      // Measure from the opposite corner when the screen is flipped for Player 2
      const flipped = document.documentElement.classList.contains('flipped');
      t.style.left = ((flipped ? pr.right - br.right : br.left - pr.left) + br.width / 2 + panel.scrollLeft) + 'px';
      t.style.top = ((flipped ? pr.bottom - br.bottom : br.top - pr.top) + panel.scrollTop + 10) + 'px';
      panel.appendChild(t);
      setTimeout(() => t.remove(), 1100);
    }, delay);
  }
  function pulse(i, cls) {
    const box = body.querySelectorAll('.hp-row .hp')[i];
    if (!box) return;
    box.classList.remove(cls);
    void box.offsetWidth; // restart the animation
    box.classList.add(cls);
  }
  const hpBox = i => body.querySelectorAll('.hp-row .hp')[i];
  function hurtFx(i, text) { pulse(i, 'hurt'); floatFx(i, text, 'dmg'); }
  function healFx(i, text) {
    pulse(i, 'healed'); floatFx(i, text, 'heal'); sfx('heal');
    burst(hpBox(i), ['#3cdc3c', '#fff', '#b6ffb6'], 18, 0.8);
  }
  // Small colored burst + sound for status effects
  function statusFx(i, text, kind, sound, colors) {
    floatFx(i, text, kind); sfx(sound); burst(hpBox(i), colors, 14, 0.7);
  }
  function shake(big = false) {
    panel.classList.remove('shake', 'shake-big');
    void panel.offsetWidth;
    panel.classList.add(big ? 'shake-big' : 'shake');
  }
  // Damage counter: big number for the last attack with its modifiers
  function showDamage(d, formula, note) {
    const c = body.querySelector('.dmg-counter');
    if (!c) return;
    c.innerHTML = `<div class="dmg-num">${d}</div><div class="dmg-formula">${formula}${note ? ` <b>${note}</b>` : ''}</div>`;
    c.classList.remove('pop');
    void c.offsetWidth;
    c.classList.add('pop');
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
    let lastFace = Math.floor(from / step + 0.5);
    const tickPitch = 1 + spinsThisTurn * 0.1; // spinsThisTurn was already bumped for this spin
    await new Promise(done => {
      (function frame(t) {
        const x = Math.min(1, (t - start) / duration);
        const eased = 1 - (1 - x) ** 4; // fast start, long slow-down
        const ang = from + (to - from) * eased;
        wheel.style.transform = `rotateX(${-ang}deg)`;
        const face = Math.floor(ang / step + 0.5);
        if (face !== lastFace) { lastFace = face; sfx('wheel_tick', tickPitch); }
        if (x < 1) requestAnimationFrame(frame); else done();
      })(start);
    });
    w.angle = to % 360;
    w.face = k;
    win.classList.remove('active');
    const landed = f.loadout[k % n];
    win.querySelectorAll('.wheel-slot')[k].classList.add('lit');
    win.classList.remove('landed');
    void win.offsetWidth;
    win.classList.add('landed');
    // Burst colored by card type: purple for gimmicks, gold for attacks
    const big = landed.mult >= 5;
    if (landed.gimmick) sfx('card_land_gimmick');
    else sfx('card_land_attack', 1.25 - landed.mult * 0.07);
    burst(win, landed.gimmick ? ['#b07cff', '#fff', '#7b3fbf', '#e0c3ff'] : ['#ffd23f', '#fff', '#f90', '#ff5d5d'],
          16 + landed.mult * 4, 0.9 + landed.mult * 0.15);
    if (big) {
      win.classList.remove('big-land'); void win.offsetWidth; win.classList.add('big-land');
      flash('#ffd23f', 0.35);
    }
    return k % n;
  }


  // Deal damage to a fighter; each stacked shield soaks up one whole hit. Returns damage actually dealt.
  let blocked = 0;
  function hit(target, dmg) {
    if (dmg <= 0) return 0;
    if (target.shield) { target.shield--; blocked++; return 0; }
    const dealt = Math.min(dmg, target.hp);
    target.hp -= dealt;
    return dealt;
  }
  const times = n => n === 1 ? '' : ` x${n}`;

  let cur = 0;
  while (fighters[0].hp > 0 && fighters[1].hp > 0) {
    const f = fighters[cur], foe = fighters[1 - cur];
    title.textContent = `${f.p.name}'s turn`;
    setFlip(f.p); // face whoever is spinning
    // Start-of-turn effects: poison ticks, stun skips the turn
    if (f.poison) {
      f.hp = Math.max(0, f.hp - f.poisonDmg);
      f.poison--;
      msg.textContent = `🧪 Poison deals ${f.poisonDmg} to ${f.p.name}!`;
      body.innerHTML = hpRow() + reel(f);
      hurtFx(cur, `🧪 -${f.poisonDmg}`);
      if (!f.poison) f.poisonDmg = 0;
      updateHp();
      if (f.hp <= 0) break;
      await waitGo('Continue');
    }
    if (f.stunned) {
      f.stunned--;
      msg.textContent = `🟢 ${f.p.name} is stunned and skips this turn!` + (f.stunned ? ` (${f.stunned} more)` : '');
      body.innerHTML = hpRow() + reel(f);
      await waitGo(`Next: ${foe.p.name}'s turn`);
      cur = 1 - cur;
      continue;
    }
    msg.textContent = 'Spin to see which cards attack!';
    body.innerHTML = hpRow() + reel(f) + '<div class="dmg-counter"></div>';
    await waitGo('Spin');
    msg.textContent = '';
    go.disabled = true;
    spinsThisTurn = 0;
    sawsThisTurn = 0;
    const dmgOf = c => f.p.attack * c.mult;
    const fi = fighters.indexOf(f), foeI = 1 - fi;
    let bonus = 0, turnTotal = 0, physicalCount = 0;
    const leeches = []; // wheels that landed on Leech, resolved after all wheels
    // A physical attack. With Double Croak stacked, it really attacks several times in a row:
    // each strike lands separately with its own damage number, sound, shake and shield check.
    async function attack(dmg, parts) {
      if (dmg <= 0) { showDamage(0, parts.join(' × '), ''); return 0; }
      const hits = 1 + f.doubleNext;
      f.doubleNext = 0;
      physicalCount++;
      let total = 0;
      for (let h = 0; h < hits && foe.hp > 0; h++) {
        if (h > 0) await sleep(Math.max(180, 380 - h * 60)); // quick follow-up strikes
        blocked = 0;
        const crit = Math.random() < f.p.critChance; // rolled separately for every strike
        const d = hit(foe, crit ? Math.round(dmg * f.p.critMult) : dmg);
        total += d;
        turnTotal += d;
        const mods = [...parts];
        if (hits > 1) mods.push(`strike ${h + 1}/${hits}`);
        if (crit) mods.push(`${f.p.critMult} CRIT!`);
        showDamage(d, mods.join(' × '), blocked ? '🪷 blocked' : '');
        if (d > 0) {
          const bigHit = d >= f.p.attack * 5;
          hurtFx(foeI, `-${d}`);
          shake(bigHit || h > 0);
          const basePitch = Math.max(0.7, 1.25 - d / (f.p.attack * 12));
          // The first strike sounds normal; every strike after it is harsher than the one before
          // (h = 1 on the 2nd strike, 2 on the 3rd, ...): louder, deeper, with heavier layers piling on
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
          sfx('blocked');
          burst(hpBox(foeI), ['#6aa8ff', '#fff'], 16, 0.8);
        }
        updateHp();
      }
      return total;
    }
    // Apply one gimmick's effect. Used for a card's own gimmick and for a gimmick fused onto it.
    function applyEffect(g, wi) {
      switch (g) {
        case 'shield':
          f.shield++;
          statusFx(fi, `🪷 +1 shield`, 'shield', 'shield', ['#6aa8ff', '#fff', '#bcd8ff']);
          break;
        case 'heal': {
          const before = f.hp;
          f.hp = Math.min(f.maxHp, f.hp + f.p.attack * 2);
          healFx(fi, `+${f.hp - before}`);
          break;
        }
        case 'double':
          f.doubleNext++;
          statusFx(fi, `🎶 next attack strikes x${1 + f.doubleNext}`, 'buff', 'buff', ['#b07cff', '#fff', '#ffd23f']);
          // Each extra stack sounds more menacing: a lower, louder growl layered on the buff sound
          if (f.doubleNext > 1) sfx('big_hit', 0.8 - f.doubleNext * 0.08, 0.4 + f.doubleNext * 0.2);
          break;
        case 'leech':
          leeches.push(wi);
          statusFx(fi, '🩸 Leech ready', 'buff', 'leech', ['#b01c1c', '#ff6b6b', '#fff']);
          break;
        // Stacking: more poison adds damage per tick and resets the timer; more stun adds skipped turns
        case 'poison':
          foe.poison = 3;
          foe.poisonDmg = (foe.poisonDmg || 0) + f.p.attack;
          setTimeout(() => statusFx(foeI, `🧪 ${foe.poisonDmg}/turn`, 'poison', 'poison', ['#5fd13a', '#b4ff8a', '#2a7a10']), 350);
          break;
        case 'stun':
          foe.stunned++;
          setTimeout(() => statusFx(foeI, `🟢 stunned x${foe.stunned}`, 'poison', 'stun', ['#9dff3a', '#fff', '#ffe23a']), 350);
          break;
      }
    }
    // Late Bloomer: deal its current flat damage (negative heals the foe), then permanently grow by 1
    async function growCard(card) {
      const dmg = card.growDmg;
      if (dmg > 0) await attack(dmg, [`🌱 ${card.name} ${dmg}`]);
      else if (dmg < 0) {
        const before = foe.hp;
        foe.hp = Math.min(foe.maxHp, foe.hp - dmg);
        showDamage(before - foe.hp, `🌱 ${card.name} heals the foe`, '');
        healFx(foeI, `+${foe.hp - before}`);
        updateHp();
      } else showDamage(0, `🌱 ${card.name} does nothing... yet`, '');
      card.growDmg++;
      setTimeout(() => statusFx(fi, `🌱 now ${card.growDmg > 0 ? card.growDmg + ' dmg' : card.growDmg}`, 'buff', 'buff', ['#5fd13a', '#fff', '#b4ff8a']), 300);
    }
    for (let wi = 0; wi < WHEELS && foe.hp > 0; wi++) {
      const card = f.loadout[await spin(f, wi)];
      // A fused Double Croak powers up this card's own attack, so it's applied before attacking
      const preDouble = card.extra === 'double' && card.mult > 0;
      if (preDouble) applyEffect('double', wi);
      if (card.mult > 0) await attack(dmgOf(card), [`${f.p.attack} ⚔️`, `${card.mult} ${card.name}`]);
      if (card.gimmick === 'grow') await growCard(card);
      applyEffect(card.gimmick, wi);
      if (card.extra && !preDouble) applyEffect(card.extra, wi);
      updateHp();
      const isSaw = card.gimmick === 'saw' || card.extra === 'saw';
      if (isSaw) { sfx('saw', 1 + bonus * 0.15); sawsThisTurn++; }
      // Saw Blade (or a fused saw): this wheel spins again (capped so a loadout of saws can't go forever)
      if (isSaw && bonus < MAX_BONUS_SPINS && foe.hp > 0) {
        bonus++;
        await sleep(500);
        wi--;
        continue;
      }
      await sleep(450);
    }
    // Leech: if the turn had physical attacks, drain that much again (damage the foe and heal it);
    // otherwise re-spin its wheel and drain that card's damage
    const cardDamage = turnTotal; // damage from this turn's cards, not counting Leech drains
    // Decide once from the wheels themselves, so one Leech's re-spin doesn't change what the next Leech does
    const hadAttacks = physicalCount > 0;
    for (const wi of leeches) {
      if (foe.hp <= 0) break;
      // Point at the Leech's wheel so it's clear which card is acting
      const win = body.querySelectorAll('.wheel-window')[wi];
      win.classList.remove('landed'); void win.offsetWidth; win.classList.add('landed');
      if (hadAttacks) {
        blocked = 0;
        const dealt = hit(foe, cardDamage);
        turnTotal += dealt;
        showDamage(dealt, `🩸 Leech drains this turn's ${cardDamage} damage`, blocked ? '🪷 blocked' : '');
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
        const rolled = f.loadout[await spin(f, wi, c => c.mult > 0)];
        const d = await attack(dmgOf(rolled), [`${f.p.attack} ⚔️`, `${rolled.mult} ${rolled.name}`, 'Leech']);
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

  // Result
  // Growing cards keep their progress: they go back to their owner's hand instead of being used up
  fighters.forEach(fg => fg.p.hand.push(...new Set(fg.loadout.filter(c => c.gimmick === 'grow'))));
  const winF = fighters.find(f => f.hp > 0), loseF = fighters.find(f => f.hp <= 0);
  const prize = Math.min(BATTLE_PRIZE, loseF.p.coins);
  loseF.p.coins -= prize;
  const won = gainCoins(winF.p, prize); // winner's Money stat boosts what they receive
  await waitGo('See result');
  title.textContent = `${winF.p.name} wins!`;
  sfx('win');
  flash('#ffd23f', 0.5);
  burst(title, ['#ffd23f', '#fff', '#ff5d5d', '#6aa8ff', '#3cdc3c'], 60, 2);
  msg.textContent = `${winF.p.name} takes ${prize} coin${prize === 1 ? '' : 's'} from ${loseF.p.name}` + (won > prize ? ` (+${won - prize} Money bonus).` : '.');
  body.innerHTML = hpRow();
  render();
  await waitGo('Done');
  el.hidden = true;
}
