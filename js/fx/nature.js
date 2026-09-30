// Card effects: nature group (see js/card-fx.js)
// Lily Pad Shield 🪷, Healing Pond 💧 and the secret Late Bloomer 🌱, plus the shield / heal / grow
// gimmicks and the effect for a shield blocking a strike. Visuals only: nothing here touches game state.
(() => {
  // ---------- Shared helpers ----------

  // Wrap a callback so a broken effect can never throw into the game (timers and promises escape fxRun)
  const safe = fn => (...a) => { try { fn(...a); } catch (e) { console.warn('nature fx failed', e); } };
  const later = (ms, fn) => setTimeout(safe(fn), ms);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // Spawn an element and play keyframes on it. With `delay` it waits (on its first frame) before starting.
  function play(x, y, opts, frames, ms, easing = 'ease-out', delay = 0) {
    const el = fxSpawn(x, y, { ...opts, ms: ms + delay + 80 });
    if (el) fxAnimate(el, frames, ms, easing, { delay, fill: 'both' });
    return el;
  }

  // On-screen size of an element (the same on Player 2's flipped screen)
  function sizeOf(el, def = [180, 64]) {
    const r = el?.getBoundingClientRect?.();
    return r && r.width ? [r.width, r.height] : def;
  }

  // Jiggle the little card that just landed on the wheel (plays over the normal landing pop, then lets go)
  function jiggle(ctx, frames, ms) {
    const face = ctx.slot?.querySelector?.('.card-face');
    try { face?.animate(frames, { duration: ms, easing: 'ease-out' }); } catch (e) { /* no WAAPI: skip */ }
  }

  // Soft light blob (radial gradient) that swells and fades
  function glow(x, y, { size = 160, color = '#9dff6a', ms = 600, delay = 0, peak = 0.9 } = {}) {
    return play(x, y, { cls: 'fxn-glow', size: [size, size], vars: { '--c': color } }, [
      { transform: 'scale(0.3)', opacity: 0 },
      { transform: 'scale(0.9)', opacity: peak, offset: 0.3 },
      { transform: 'scale(1.3)', opacity: 0 },
    ], ms, 'ease-out', delay);
  }

  // Water ripple: a flattened ring spreading across a pond surface
  function ripple(x, y, { w = 120, flat = 0.38, color = '#9fe8ff', ms = 700, delay = 0, width = 3 } = {}) {
    return play(x, y, { cls: 'fxn-ripple', size: [w, w * flat], style: { borderColor: color, borderWidth: width + 'px' } }, [
      { transform: 'scale(0.15)', opacity: 1 },
      { transform: 'scale(1)', opacity: 0 },
    ], ms, 'cubic-bezier(.15,.8,.35,1)', delay);
  }

  // Comic-book stamp ("SPLOOSH!") that slams in from big, wobbles, holds and floats off.
  // tone picks the colour scheme: leaf, water, gold, pink, steel, sad, sprout
  function stamp(x, y, text, tone = 'leaf', { size = 32, rot = fxRand(-10, 10), ms = 900, delay = 0 } = {}) {
    return play(x, y, { cls: 'fxn-stamp fxn-t-' + tone, html: text, style: { fontSize: size + 'px' } }, [
      { transform: `scale(2.4) rotate(${rot - 16}deg)`, opacity: 0 },
      { transform: `scale(0.9) rotate(${rot}deg)`, opacity: 1, offset: 0.16 },
      { transform: `scale(1.08) rotate(${rot}deg)`, opacity: 1, offset: 0.26 },
      { transform: `scale(1) rotate(${rot}deg)`, opacity: 1, offset: 0.72 },
      { transform: `translate(0, -24px) scale(1.06) rotate(${rot}deg)`, opacity: 0 },
    ], ms, 'ease-out', delay);
  }

  // ---------- Graphics ----------

  // Lily pad in SVG: a disc with a notch, darker rim, a light sheen and veins
  const PAD_SVG = (() => {
    const pt = (a, r) => `${(50 + r * Math.cos(a * Math.PI / 180)).toFixed(1)} ${(50 + r * Math.sin(a * Math.PI / 180)).toFixed(1)}`;
    const disc = r => `M50 50 L${pt(-76, r)} A${r} ${r} 0 1 1 ${pt(-104, r)} Z`;
    const veins = [-40, 0, 40, 80, 120, 160, 200, 240].map(a => `M50 50 L${pt(a, 38)}`).join(' ');
    return `<svg viewBox="0 0 100 100"><path d="${disc(46)}" fill="#0b3d16" opacity=".45" transform="translate(2 4)"/>` +
      `<path d="${disc(46)}" fill="#1f7a2e"/><path d="${disc(41)}" fill="#45b84b"/>` +
      '<ellipse cx="36" cy="40" rx="20" ry="11" fill="#c4f7a1" opacity=".45" transform="rotate(-28 36 40)"/>' +
      `<path d="${veins}" stroke="#1f7a2e" stroke-width="2.2" stroke-linecap="round" opacity=".55" fill="none"/></svg>`;
  })();
  // Cracks that split a pad right before it shatters
  const CRACK_SVG = '<svg viewBox="0 0 100 100"><path d="M50 50 L38 30 L44 18 L36 4 M50 50 L70 40 L78 46 L96 38 ' +
    'M50 50 L56 70 L48 82 L54 97 M50 50 L28 58 L16 52 L3 60" stroke="#fff" stroke-width="4" stroke-linejoin="round" ' +
    'stroke-linecap="round" fill="none"/></svg>';

  // ---------- Lily Pad Shield ----------

  CARD_FX['lily-pad-shield'] = {
    // The card bobs like it's floating: pond ripples, a see-through pad shockwave, a lotus bursting up, petals
    land(ctx) {
      const [x, y] = fxPoint(ctx.slot || ctx.win);
      jiggle(ctx, [
        { transform: 'scale(1.45) rotate(-10deg)' }, { transform: 'scale(0.92) rotate(6deg)', offset: 0.35 },
        { transform: 'scale(1.06) rotate(-3deg)', offset: 0.65 }, { transform: 'scale(1) rotate(0deg)' },
      ], 650);
      for (let i = 0; i < 3; i++) ripple(x, y + 10, { w: 130 + i * 45, delay: i * 110, color: i % 2 ? '#b6ffcf' : '#8fe3ff' });
      play(x, y, { cls: 'fxn-pad', html: PAD_SVG, size: [120, 120] }, [
        { transform: 'scale(0.3) rotate(-120deg)', opacity: 0.95 },
        { transform: 'scale(1.1) rotate(-20deg)', opacity: 0.7, offset: 0.4 },
        { transform: 'scale(1.9) rotate(15deg)', opacity: 0 },
      ], 700, 'cubic-bezier(.2,.8,.3,1)');
      glow(x, y - 64, { size: 150, color: '#ff9ad5', ms: 800 });
      fxPop(x, y - 64, '🪷', { size: 64, ms: 950, rise: 34, rotate: fxRand(-8, 8) });
      fxParticles(x, y, { count: 14, cls: 'fxn-petal', colors: ['#ffc2e2', '#ff8fc8', '#fff', '#ffd9ef'],
        spread: 140, size: [8, 14], ms: 900, gravity: 50, spin: 540 });
      fxParticles(x, y, { count: 10, cls: 'fxn-drop', colors: ['#8fe3ff', '#d6f6ff', '#4fc3ff'],
        spread: 110, angle: -90, cone: 150, size: [5, 9], ms: 800, gravity: 140, spin: 0 });
      fxParticles(x, y - 30, { count: 5, html: '✨', spread: 90, size: [7, 11], ms: 800, spin: 90 });
    },
  };

  // The barrier itself: a jelly bubble over the HP box, ringed by lily pads that swoop in (more pads per stack)
  function barrier([x, y], bw, bh, stacks) {
    const w = clamp(bw * 1.1, 130, 360), h = clamp(bh * 1.6, 80, 190);
    glow(x, y, { size: w * 1.3, color: '#6dffb4', ms: 650, peak: 0.8 });
    play(x, y, { cls: 'fxn-bubble', size: [w, h] }, [
      { transform: 'scale(0.3, 0.2)', opacity: 0 },
      { transform: 'scale(1.12, 0.88)', opacity: 1, offset: 0.22 },
      { transform: 'scale(0.94, 1.08)', opacity: 1, offset: 0.4 },
      { transform: 'scale(1.03, 0.97)', opacity: 0.95, offset: 0.58 },
      { transform: 'scale(1)', opacity: 0.85, offset: 0.8 },
      { transform: 'scale(1.1)', opacity: 0 },
    ], 1050);
    const n = clamp(4 + stacks * 2, 6, 12);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2, px = Math.cos(a) * w / 2, py = Math.sin(a) * h / 2;
      play(x + px, y + py, { cls: 'fxn-pad', html: PAD_SVG, size: [32, 32] }, [
        { transform: `translate(${px * 1.2}px, ${py * 1.6}px) scale(0.3) rotate(-220deg)`, opacity: 0 },
        { transform: 'translate(0, 0) scale(1.25) rotate(0deg)', opacity: 1, offset: 0.35 },
        { transform: `scale(1) rotate(${(i * 25) % 40 - 20}deg)`, opacity: 1, offset: 0.75 },
        { transform: 'scale(0.3) rotate(60deg)', opacity: 0 },
      ], 950, 'cubic-bezier(.2,.8,.3,1.15)', i * 28);
    }
    fxRing(x, y, { color: '#c8ffe6', size: w * 1.5, ms: 600, width: 5 });
    later(130, () => fxRing(x, y, { color: '#6ad9ff', size: w * 1.9, ms: 650, width: 3 }));
    fxParticles(x, y, { count: 10, html: '✦', cls: 'fxn-glint', colors: ['#eafff4', '#9ff5ff'], spread: w * 0.6, size: [6, 10], ms: 750, spin: 180 });
    fxPop(x, y, '🪷', { size: 42 + Math.min(stacks, 5) * 6, ms: 850, rise: 18 });
    stamp(x, y - h * 0.6, stacks > 1 ? `SHIELD x${stacks}!` : 'SHIELD UP!', 'leaf', { size: 24 + Math.min(stacks, 5) * 3, delay: 60 });
    // A wall of three or more pads earns a green wash and an extra power-up chime
    if (stacks >= 3) { fxTint('#39d98a', { ms: 450, opacity: 0.16 }); sfx('buff', 1.3, 0.5); }
  }

  // Shield gimmick: a lily pad frisbees from the wheel to the fighter, then the barrier forms around them
  GIMMICK_FX.shield = ctx => {
    const dst = ctx.fromXY || fxPoint(ctx.from);
    const [bw, bh] = sizeOf(ctx.from);
    const stacks = (ctx.attacker?.shield || 0) + 1; // this fires just before the shield is added
    const form = () => barrier(dst, bw, bh, stacks);
    if (!ctx.win) { form(); return; }
    const src = fxPoint(ctx.win);
    // Short wait so the card's own landing effect shows first
    later(170, () => fxFly(src, dst, { html: PAD_SVG, cls: 'fxn-pad fxn-pad-fly', ms: 300, arc: 70, spin: 720, scale: [0.6, 1.3],
      trail: 'fxn-drip', trailEvery: 40, easing: 'cubic-bezier(.45,0,.7,1)' }).then(safe(form)));
  };

  // A shield soaks up a strike: the pad slams up facing the attacker, cracks and shatters into shards,
  // the strike ricochets off in sparks ("TING!"), and if shields are left a fresh pad bobs back up
  BATTLE_FX.block = ctx => {
    const [x, y] = ctx.toXY || fxPoint(ctx.to);
    const [ax, ay] = ctx.fromXY || [x - 200, y];
    const [bw] = sizeOf(ctx.to);
    const ang = Math.atan2(ay - y, ax - x), deg = ang * 180 / Math.PI; // towards the attacker
    const off = clamp(bw * 0.3, 30, 90), px = x + Math.cos(ang) * off, py = y + Math.sin(ang) * off, P = 96;
    glow(px, py, { size: 180, color: '#d9ffe9', ms: 450, peak: 1 });
    play(px, py, { cls: 'fxn-pad', html: PAD_SVG, size: [P, P] }, [
      { transform: 'scale(0.4) rotate(-30deg)', opacity: 0 },
      { transform: 'scale(1.15) rotate(0deg)', opacity: 1, offset: 0.15 },
      { transform: 'scale(0.88, 1.08) rotate(3deg)', opacity: 1, offset: 0.3 },
      { transform: 'scale(1.02) rotate(-2deg)', opacity: 1, offset: 0.42 },
      { transform: 'scale(1.35)', opacity: 0 },
    ], 520);
    play(px, py, { cls: 'fxn-crack', html: CRACK_SVG, size: [P * 0.9, P * 0.9] }, [
      { transform: 'scale(0.6)', opacity: 0 },
      { transform: 'scale(0.6)', opacity: 0, offset: 0.25 },
      { transform: 'scale(1)', opacity: 1, offset: 0.35 },
      { transform: 'scale(1.3)', opacity: 0 },
    ], 520, 'linear');
    // Shards blow away from the attacker and tumble down
    later(170, () => {
      for (let i = 0; i < 10; i++) {
        const a = ang + Math.PI + fxRand(-1.3, 1.3), d = fxRand(60, 150), ex = Math.cos(a) * d, ey = Math.sin(a) * d;
        play(px, py, { cls: `fxn-shard fxn-s${i % 3}` }, [
          { transform: 'translate(0, 0) rotate(0deg) scale(1)', opacity: 1 },
          { transform: `translate(${ex * 0.7}px, ${ey * 0.7}px) rotate(${fxRand(-300, 300)}deg) scale(0.9)`, opacity: 1, offset: 0.55 },
          { transform: `translate(${ex}px, ${ey + 70}px) rotate(${fxRand(-500, 500)}deg) scale(0.5)`, opacity: 0 },
        ], fxRand(650, 850), 'cubic-bezier(.2,.7,.4,1)');
      }
    });
    // Sparks bounce back at the attacker and the strike glances off into the air
    fxParticles(px, py, { count: 12, colors: ['#fff', '#fffbcc', '#ffd23f'], angle: deg, cone: 110, spread: 120, size: [3, 6], ms: 450, spin: 0 });
    const ga = ang + (Math.random() < 0.5 ? -1.1 : 1.1);
    fxFly([px, py], [px + Math.cos(ga) * 200, py + Math.sin(ga) * 200 - 60], { html: '✦', cls: 'fxn-glint fxn-ricochet', ms: 320,
      spin: 540, scale: [1.3, 0.5], trail: 'fxn-sparktrail', trailEvery: 45, easing: 'ease-out' });
    fxParticles(px, py, { count: 6, cls: 'fxn-drop', colors: ['#8fe3ff', '#d6f6ff'], angle: deg + 180, cone: 140, spread: 90,
      size: [5, 8], ms: 700, gravity: 110, spin: 0 });
    fxRing(px, py, { color: '#e8fff2', size: 170, ms: 420, width: 5 });
    stamp(px, py - 52, 'TING!', 'steel', { size: 30 });
    fxShake(ctx.to, 6, 260);
    sfx('coin', 1.6, 0.35); // metallic ting on top of the game's block sound
    const left = ctx.defender?.shield || 0; // shields still stacked after this one broke
    if (left > 0) later(430, () => {
      play(px, py, { cls: 'fxn-pad', html: PAD_SVG, size: [56, 56] }, [
        { transform: 'translate(0, 16px) scale(0.2) rotate(-90deg)', opacity: 0 },
        { transform: 'translate(0, 0) scale(1.2) rotate(8deg)', opacity: 1, offset: 0.3 },
        { transform: 'scale(1) rotate(0deg)', opacity: 1, offset: 0.7 },
        { transform: 'scale(0.9)', opacity: 0 },
      ], 800, 'cubic-bezier(.2,.9,.3,1.3)');
      stamp(px, py + 40, `🪷 x${left}`, 'leaf', { size: 18, rot: 0, ms: 800 });
    });
  };

  // ---------- Healing Pond ----------

  CARD_FX['healing-pond'] = {
    // A geyser of healing water erupts out of the card and rains back down: ripples, a big drop, "SPLOOSH!"
    land(ctx) {
      const [x, y] = fxPoint(ctx.slot || ctx.win);
      jiggle(ctx, [
        { transform: 'scale(1.35, 0.7)' }, { transform: 'scale(0.85, 1.28)', offset: 0.3 },
        { transform: 'scale(1.08, 0.92)', offset: 0.6 }, { transform: 'scale(1)' },
      ], 600);
      for (let i = 0; i < 3; i++) ripple(x, y + 26, { w: 110 + i * 50, delay: i * 120, color: i ? '#8fd8ff' : '#e6fbff', width: 4 - i });
      // Water column shooting up out of the card (anchored at its bottom), with a bright core
      const H = 170, base = y + 20;
      const column = (cls, wd, ms) => play(x, base - H / 2, { cls: 'fxn-geyser ' + cls, size: [wd, H] }, [
        { transform: 'scaleX(0.6) scaleY(0)', opacity: 1 },
        { transform: 'scaleX(1.1) scaleY(1.08)', opacity: 1, offset: 0.3 },
        { transform: 'scaleX(1) scaleY(0.95)', opacity: 0.95, offset: 0.55 },
        { transform: 'scaleX(0.7) scaleY(0.3)', opacity: 0 },
      ], ms, 'cubic-bezier(.2,.9,.3,1)');
      column('', 40, 850);
      column('fxn-core', 14, 750);
      // Spray raining back down from the top of the column
      later(170, () => fxParticles(x, base - H, { count: 18, cls: 'fxn-drop', colors: ['#bfefff', '#4fc3ff', '#ffffff', '#2f9bff'],
        spread: 110, angle: -90, cone: 200, size: [5, 10], ms: 850, gravity: 190, spin: 0 }));
      fxPop(x, y - 40, '💧', { size: 58, ms: 900, rise: 40 });
      fxParticles(x, y, { count: 6, html: '✨', spread: 100, size: [7, 11], ms: 800, spin: 90 });
      stamp(x, y + 58, 'SPLOOSH!', 'water', { size: 28, delay: 80 });
    },
  };

  // On the healed fighter: a pillar of green light, glowing ✚ crosses and bubbles floating up, a big 💚.
  // k = how big the heal is for this fighter (bigger heals, taller pillar, more crosses)
  function healBurst([x, y], bw, bh, k) {
    glow(x, y, { size: 200 * Math.sqrt(k), color: '#5dff8f', ms: 750, peak: 0.85 });
    const H = 200 + 40 * k;
    play(x, y + bh / 2 - H / 2, { cls: 'fxn-lightcol', size: [clamp(bw * 0.7, 80, 240), H] }, [
      { transform: 'scaleX(0.4) scaleY(0)', opacity: 0.9 },
      { transform: 'scaleX(1) scaleY(1)', opacity: 0.85, offset: 0.35 },
      { transform: 'scaleX(0.3) scaleY(1.05)', opacity: 0 },
    ], 850, 'cubic-bezier(.2,.8,.3,1)');
    const n = Math.round(7 + 4 * k);
    for (let i = 0; i < n; i++) {
      const rise = fxRand(60, 130);
      play(x + fxRand(-bw * 0.42, bw * 0.42), y + fxRand(-bh * 0.3, bh * 0.3),
        { cls: 'fxn-cross', html: '✚', style: { fontSize: fxRand(14, 26) + 'px' } }, [
          { transform: 'translate(0, 10px) scale(0.2)', opacity: 0 },
          { transform: 'translate(0, 0) scale(1.2)', opacity: 1, offset: 0.25 },
          { transform: `translate(${fxRand(-12, 12)}px, ${-rise}px) scale(0.7)`, opacity: 0 },
        ], fxRand(700, 950), 'ease-out', i * 35);
    }
    fxParticles(x, y, { count: 8, cls: 'fxn-bub', spread: 110, angle: -90, cone: 80, size: [8, 16], ms: 900, gravity: -30, spin: 0 });
    fxRing(x, y, { color: '#b8ffcf', size: bw * 1.3, ms: 600, width: 5 });
    later(120, () => fxRing(x, y, { color: '#5dff8f', size: bw * 1.7, ms: 650, width: 3 }));
    fxPop(x, y, '💚', { size: 40 + 10 * k, ms: 850, rise: 34 });
    fxParticles(x, y, { count: 6, html: '✨', spread: bw * 0.5, size: [7, 11], ms: 800, spin: 90 });
    if (k >= 1.4) fxTint('#3cff9a', { ms: 450, opacity: 0.15 });
  }

  // Heal gimmick: water drops arc from the wheel into the fighter's HP box, then the healing burst
  GIMMICK_FX.heal = ctx => {
    const dst = ctx.fromXY || fxPoint(ctx.from);
    const [bw, bh] = sizeOf(ctx.from);
    const f = ctx.attacker, amount = (f?.p?.attack || 1) * 2; // Healing Pond heals 2x attack
    const k = clamp(amount / Math.max(1, (f?.maxHp || 40) * 0.2), 0.6, 2);
    const bloom = () => healBurst(dst, bw, bh, k);
    if (!ctx.win) { bloom(); return; }
    const src = fxPoint(ctx.win, 0.5, 0.35);
    later(110, () => {
      for (let i = 0; i < 3; i++) fxFly(src, dst, { html: '💧', cls: 'fxn-flydrop', ms: 260 + i * 45, arc: (i - 1) * 110,
        scale: [0.6, 1.15], trail: i === 1 ? 'fxn-drip' : '', trailEvery: 40, easing: 'cubic-bezier(.5,0,.8,1)' });
      later(270, bloom);
    });
  };

  // ---------- Late Bloomer ----------
  // Its look grows with it: a sad sprout while it's still negative, then bigger and bigger blooms.

  const BLOOMS = [[1, '🌼'], [4, '🌷'], [8, '🌸'], [12, '🌺'], [16, '🌻'], [22, '🌳']];
  const bloomOf = g => BLOOMS.reduce((e, [min, em]) => (g >= min ? em : e), '🌱');
  const FLOWERS = ['🌼', '🌸', '🌷', '🌺', '🌻', '🌹'];
  // A random flower no fancier than stage g
  const flowerUpTo = g => FLOWERS[Math.floor(Math.random() * clamp(1 + Math.ceil(g / 4), 1, FLOWERS.length))];
  // Attack tier from the damage about to land: 1 seed shot, 2 petal shuriken, 3 falling tree (a crit bumps it up)
  const tierOf = ctx => clamp((ctx.dmg >= 13 || ctx.big ? 3 : ctx.dmg >= 6 ? 2 : 1) + (ctx.crit ? 1 : 0), 1, 3);
  // Where Late Bloomer is: its landed card on the wheels if showing, else the attacker's HP box
  function bloomerXY(ctx) {
    const lit = ctx.panel?.querySelectorAll?.('.wheel-slot.lit .card-face[data-card="late-bloomer"]');
    const el = ctx.slot || (lit?.length ? lit[lit.length - 1] : null);
    return el ? fxPoint(el) : (ctx.fromXY || fxPoint(ctx.from));
  }
  const sunburst = (x, y, S, ms) => play(x, y, { cls: 'fxn-sunburst', size: [S, S] }, [
    { transform: 'scale(0.2) rotate(0deg)', opacity: 0 },
    { transform: 'scale(1) rotate(40deg)', opacity: 1, offset: 0.3 },
    { transform: 'scale(1.15) rotate(110deg)', opacity: 0 },
  ], ms);

  CARD_FX['late-bloomer'] = {
    land(ctx) {
      const g = ctx.card?.growDmg ?? -5; // what it's about to do this time
      const [x, y] = fxPoint(ctx.slot || ctx.win);
      if (g <= 0) {
        // Still a dud: a tiny sprout (or, at 0, a seed) pokes up, trembles and droops.
        // Sparkles get busier the closer it is to turning good.
        jiggle(ctx, [{ transform: 'scale(1.2)' }, { transform: 'scale(0.9) rotate(-4deg)', offset: 0.4 }, { transform: 'scale(1)' }], 500);
        play(x, y - 50, { cls: 'fxn-emoji', html: g === 0 ? '🌰' : '🌱', style: { fontSize: '40px' } }, [
          { transform: 'translate(0, 30px) scale(0.2)', opacity: 0 },
          { transform: 'translate(0, 0) scale(1.1)', opacity: 1, offset: 0.25 },
          { transform: 'rotate(-8deg)', opacity: 1, offset: 0.4 },
          { transform: 'rotate(8deg)', opacity: 1, offset: 0.52 },
          { transform: 'rotate(0deg)', opacity: 1, offset: 0.62 },
          { transform: `translate(6px, 10px) rotate(${g === 0 ? 0 : 50}deg) scale(0.9)`, opacity: 0 },
        ], 1000);
        fxParticles(x, y - 40, { count: clamp(3 + (g + 5) * 2, 3, 13), html: '✨', spread: 70, size: [5, 9], ms: 800, spin: 90 });
        stamp(x, y + 52, g === 0 ? '...YET?' : '...', g === 0 ? 'gold' : 'sad', { size: 22, delay: 200 });
        return;
      }
      // Blooming: a legendary pull. Everything scales with how far it has grown.
      const p = Math.min(g, 24) / 24, S = 190 + p * 170;
      jiggle(ctx, [
        { transform: 'scale(1.6) rotate(-12deg)' }, { transform: 'scale(0.9) rotate(8deg)', offset: 0.3 },
        { transform: 'scale(1.12) rotate(-4deg)', offset: 0.6 }, { transform: 'scale(1)' },
      ], 700);
      sunburst(x, y, S, 1050);
      glow(x, y, { size: S * 0.9, color: '#c8ff6a', ms: 800 });
      fxRing(x, y, { color: '#9dff4a', size: S * 1.1, ms: 600, width: 6 });
      later(120, () => fxRing(x, y, { color: '#ffe45a', size: S * 1.4, ms: 700, width: 3 }));
      fxParticles(x, y, { count: 10, cls: 'fxn-leafp', colors: ['#5fd13a', '#9dff6a', '#2f8a1f'], spread: 120 + p * 60,
        size: [9, 15], ms: 900, gravity: 30, spin: 400 });
      fxParticles(x, y, { count: clamp(5 + g, 6, 16), html: () => flowerUpTo(g), spread: 120 + p * 80, size: [9, 14 + p * 6],
        ms: 1000, gravity: 40, spin: 220 });
      fxPop(x, y - 70, bloomOf(g), { size: 56 + p * 40, ms: 1000, rise: 30, rotate: fxRand(-10, 10) });
      stamp(x, y + 60, g >= 16 ? 'FULL BLOOM!!' : g >= 8 ? 'BLOOM!' : 'SPROUT!', g >= 8 ? 'gold' : 'leaf', { size: 26 + p * 14, delay: 90 });
      if (g >= 10) { fxTint('#ffe56a', { ms: 500, opacity: 0.14 }); sfx('jackpot', 1.3, 0.25); }
      if (g >= 18) banner('🌳 ANCIENT BLOOM 🌳', 'legendary');
    },

    // Attacks launch out of the card and get more dramatic as it grows (and with every extra strike)
    windup(ctx) {
      const src = bloomerXY(ctx), dst = ctx.toXY || fxPoint(ctx.to);
      const t = tierOf(ctx), s = Math.min(ctx.strike || 0, 4), side = ctx.side ? -1 : 1;
      glow(src[0], src[1], { size: 110 + t * 30, color: '#9dff6a', ms: 420 });
      if (t === 1) {
        // Seed shot: a spinning acorn with a trail of leaves
        fxParticles(src[0], src[1], { count: 5, cls: 'fxn-leafp', colors: ['#5fd13a', '#9dff6a'], spread: 50, size: [7, 11], ms: 400 });
        return fxFly(src, dst, { html: '🌰', cls: 'fxn-proj', ms: 260, arc: 40 * side, spin: 900, scale: [0.7, 1.3 + s * 0.2],
          trail: 'fxn-leaftrail', trailEvery: 30, easing: 'cubic-bezier(.4,0,.9,1)' });
      }
      if (t === 2) {
        // Petal shuriken riding a lashing vine, with two small petals curving in alongside
        fxBeam(src, dst, { cls: 'fxn-vine', ms: 380, width: 10 + s * 3 });
        for (const a of [-1, 1]) fxFly(src, dst, { html: '🌸', cls: 'fxn-proj fxn-small', ms: 300, arc: a * 90, spin: -720 * a, scale: [0.5, 1] });
        return fxFly(src, dst, { html: '🌸', cls: 'fxn-proj', ms: 320, arc: 30 * side, spin: 1080, scale: [0.6, 1.6 + s * 0.2],
          trail: 'fxn-petaltrail', trailEvery: 28, easing: 'cubic-bezier(.4,0,.8,1)' });
      }
      // Tier 3: a thorn vine whips across while a whole tree comes crashing down on the foe (its shadow grows first)
      fxBeam(src, dst, { cls: 'fxn-vine', ms: 400, width: 14 + s * 3 });
      play(dst[0], dst[1] + 20, { cls: 'fxn-shadow', size: [150, 44] }, [
        { transform: 'scale(0.2)', opacity: 0 },
        { transform: 'scale(1)', opacity: 0.9, offset: 0.63 },
        { transform: 'scale(1.3)', opacity: 0 },
      ], 600, 'ease-in');
      return fxFly([dst[0] + 70 * side, dst[1] - 280], dst, { html: `<div style="transform: rotate(${40 * side}deg)">🌳</div>`,
        cls: 'fxn-tree', ms: 380, spin: -40 * side, scale: [0.9, 1.6 + s * 0.15], trail: 'fxn-leaftrail', trailEvery: 40,
        easing: 'cubic-bezier(.55,0,1,.9)' });
    },

    // Petals and flowers explode off the foe: POP! / BLOOM! / TIMBER!! by tier, stronger on every extra strike
    impact(ctx) {
      const [x, y] = ctx.toXY || fxPoint(ctx.to);
      const t = tierOf(ctx), s = Math.min(ctx.strike || 0, 4), boost = 1 + s * 0.25;
      const cols = ctx.crit ? ['#ffd23f', '#fff4a0', '#ff8fc8', '#fff'] : ['#ff8fc8', '#ffc2e2', '#fff', '#ffd9ef'];
      glow(x, y, { size: (130 + t * 50) * boost, color: t === 3 ? '#e6ff6a' : '#9dff6a', ms: 700 });
      fxRing(x, y, { color: ctx.crit ? '#ffd23f' : '#9dff4a', size: (150 + t * 50) * boost, ms: 550, width: 6 });
      fxParticles(x, y, { count: Math.min(18, Math.round((6 + t * 4) * boost)), html: () => flowerUpTo(4 + t * 5),
        spread: (110 + t * 30) * boost, size: [8, 12 + t * 2], ms: 950, gravity: 60, spin: 300 });
      fxParticles(x, y, { count: Math.min(14, Math.round((6 + t * 3) * boost)), cls: t === 1 ? 'fxn-leafp' : 'fxn-petal',
        colors: t === 1 ? ['#5fd13a', '#9dff6a', '#2f8a1f'] : cols, spread: (120 + t * 30) * boost, size: [7, 13], ms: 850, gravity: 50, spin: 500 });
      if (t >= 2) {
        // Thorny vines burst out of the target
        const n = t === 3 ? 6 : 5;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + fxRand(-0.3, 0.3), r = fxRand(70, 110) * boost;
          fxBeam([x, y], [x + Math.cos(a) * r, y + Math.sin(a) * r], { cls: 'fxn-thorn', ms: 360, width: 7 });
        }
        later(110, () => fxRing(x, y, { color: '#ff9ad5', size: 230 * boost, ms: 600, width: 3 }));
      }
      if (t === 3) {
        // The fallen tree squashes on impact before fading, under a burst of sunlight
        play(x, y, { cls: 'fxn-tree', html: '🌳' }, [
          { transform: 'scale(1.7, 1.3)', opacity: 1 },
          { transform: 'scale(1.9, 1.1)', opacity: 1, offset: 0.15 },
          { transform: 'scale(1.5, 1.8)', opacity: 1, offset: 0.35 },
          { transform: 'translate(0, -20px) scale(1.6)', opacity: 0 },
        ], 700);
        sunburst(x, y, 300 * boost, 900);
        fxTint('#c8ff6a', { ms: 450, opacity: 0.2 });
        fxShake(ctx.to, 12, 380);
      }
      const word = t === 3 ? 'TIMBER!!' : t === 2 ? 'BLOOM!' : 'POP!';
      stamp(x + fxRand(-20, 20), y - 34, s ? `${word} x${s + 1}` : word, ctx.crit || t === 3 ? 'gold' : t === 2 ? 'pink' : 'leaf',
        { size: (26 + t * 7) * Math.min(boost, 1.6) });
    },
  };

  // Still negative (it just healed the foe!): the flower wilts under a little rain cloud, and a pale
  // "-5 → -4" shows it is slowly getting there
  function wilt(x, y, dmg, next) {
    play(x, y - 44, { cls: 'fxn-emoji', html: '🥀', style: { fontSize: '44px' } }, [
      { transform: 'scale(0.3)', opacity: 0 },
      { transform: 'scale(1.1)', opacity: 1, offset: 0.2 },
      { transform: 'scale(1) rotate(0deg)', opacity: 1, offset: 0.4 },
      { transform: 'translate(8px, 14px) rotate(55deg) scale(0.95)', opacity: 1, offset: 0.8 },
      { transform: 'translate(10px, 26px) rotate(70deg) scale(0.9)', opacity: 0 },
    ], 1100, 'ease-in-out');
    play(x, y - 104, { cls: 'fxn-emoji', html: '🌧️', style: { fontSize: '38px' } }, [
      { transform: 'translate(0, -10px) scale(0.5)', opacity: 0 },
      { transform: 'translate(0, 0) scale(1)', opacity: 0.95, offset: 0.2 },
      { transform: 'translate(0, 0) scale(1)', opacity: 0.95, offset: 0.75 },
      { transform: 'translate(0, -6px) scale(0.9)', opacity: 0 },
    ], 1100);
    later(150, () => fxParticles(x, y - 90, { count: 9, cls: 'fxn-rain', colors: ['#9fb8d8', '#c8d8ee'], spread: 70, angle: 90, cone: 24,
      size: [3, 5], ms: 700, spin: 0 }));
    fxParticles(x, y - 40, { count: 4, html: '🍂', spread: 50, angle: 90, cone: 140, size: [7, 10], ms: 1000, gravity: 80, spin: 200 });
    stamp(x, y + 48, 'wilted...', 'sad', { size: 20, rot: -6 });
    stamp(x, y + 76, `🌱 ${dmg} → ${next}`, 'sprout', { size: 16, rot: 0, delay: 450, ms: 900 });
    sfx('fail', 1.1, 0.25); // quiet sad "womp"
  }

  // It hit for real: a level-up growth spurt. The bloom swaps to its next stage, butterflies and bees
  // arrive once it's big, and its first real hit (and every 5 after) gets a fanfare.
  function growth(x, y, dmg, next) {
    const p = Math.min(dmg, 24) / 24;
    for (let i = 0; i < 4; i++) play(x + (i - 1.5) * 22, y + 10, { cls: 'fxn-chev', html: '▲', style: { fontSize: 20 + p * 10 + 'px' } }, [
      { transform: 'translate(0, 20px) scale(0.4)', opacity: 0 },
      { transform: 'translate(0, 0) scale(1.1)', opacity: 1, offset: 0.3 },
      { transform: 'translate(0, -80px) scale(0.8)', opacity: 0 },
    ], 800, 'ease-out', i * 70 + (i % 2) * 40);
    fxPop(x, y - 56, bloomOf(dmg), { size: 48 + p * 30, ms: 500, rise: 0 });
    later(330, () => fxPop(x, y - 56, bloomOf(next), { size: 60 + p * 36, ms: 850, rise: 30 }));
    fxRing(x, y - 40, { color: '#9dff4a', size: 140 + p * 80, ms: 550, width: 5 });
    fxParticles(x, y - 40, { count: 8 + Math.round(p * 8), html: () => flowerUpTo(next), spread: 90 + p * 60, size: [7, 11 + p * 4],
      ms: 900, gravity: 40, spin: 200 });
    if (next >= 6) {
      const bugs = Math.min(3, 1 + Math.floor(next / 8));
      for (let i = 0; i < bugs; i++) {
        const dx = fxRand(-140, 140), dy = -fxRand(60, 160);
        play(x, y - 30, { cls: 'fxn-bug', html: i % 2 ? '🐝' : '🦋' }, [
          { transform: 'translate(0, 0) scale(0.3)', opacity: 0 },
          { transform: `translate(${dx * 0.3}px, ${dy * 0.5}px) scale(1) rotate(-15deg)`, opacity: 1, offset: 0.25 },
          { transform: `translate(${dx * 0.6}px, ${dy * 0.6}px) scale(1) rotate(15deg)`, opacity: 1, offset: 0.55 },
          { transform: `translate(${dx}px, ${dy}px) scale(0.9) rotate(-10deg)`, opacity: 0 },
        ], 1100, 'ease-in-out', i * 120);
      }
    }
    stamp(x, y + 50, `GROW ▲ ${next}`, 'leaf', { size: 22 + p * 10, delay: 120 });
    if (dmg === 1) {
      // The joke card finally pays off
      banner('🌸 IT BLOOMED! 🌸', 'legendary');
      confetti(40);
      sfx('level_up', 1, 0.8);
      fxTint('#ffb3e0', { ms: 600, opacity: 0.2 });
    } else if (dmg % 5 === 0) {
      banner(`🌻 GROWN TO ${next}! 🌻`, 'fire');
      confetti(20);
      sfx('level_up', 1.1 + p * 0.3, 0.6);
    }
  }

  // Grow gimmick (after Late Bloomer resolves): ctx.dmg is what it did this time; it now does one more
  GIMMICK_FX.grow = ctx => {
    const dmg = ctx.dmg ?? 0, next = dmg + 1;
    const [x, y] = bloomerXY(ctx);
    if (dmg < 0) return wilt(x, y, dmg, next);
    if (dmg > 0) return growth(x, y, dmg, next);
    // Did nothing... but the seed is stirring: its next use is its first real hit
    play(x, y - 40, { cls: 'fxn-emoji', html: '🌰', style: { fontSize: '44px' } }, [
      { transform: 'scale(0.3)', opacity: 0 },
      { transform: 'scale(1.15)', opacity: 1, offset: 0.2 },
      { transform: 'rotate(-14deg)', opacity: 1, offset: 0.35 },
      { transform: 'rotate(14deg)', opacity: 1, offset: 0.5 },
      { transform: 'rotate(-10deg)', opacity: 1, offset: 0.62 },
      { transform: 'rotate(0deg) scale(1.1)', opacity: 1, offset: 0.75 },
      { transform: 'translate(0, -20px) scale(0.8)', opacity: 0 },
    ], 1100);
    glow(x, y - 40, { size: 130, color: '#ffe45a', ms: 900, peak: 0.7 });
    fxParticles(x, y - 40, { count: 8, html: '✨', spread: 80, size: [6, 10], ms: 900, spin: 90 });
    stamp(x, y + 50, 'SOMETHING STIRS...', 'gold', { size: 20, delay: 300, ms: 1000 });
  };
})();
