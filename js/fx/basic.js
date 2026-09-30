// Card effects: basic group (see js/card-fx.js)
// Tadpole Tackle, Sticky Tongue, Big Leap and Bare Hands. Each card gets its own land flourish on the wheel,
// a signature windup (a tadpole swarm, a tongue lash, a leap, a flying fist) and a themed comic-book impact.
// Everything scales with power(): crits, huge hits and later strikes of a combo hit harder and bigger.
(() => {
  // ---------- shared helpers ----------
  // setTimeout that can never throw into the page (effects must never break the battle)
  const later = (ms, fn) => setTimeout(() => { try { fn(); } catch (e) { console.warn('basic fx failed', e); } }, ms);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const isGold = ctx => /^Golden /.test(ctx.card?.name || '');
  const landXY = ctx => fxPoint(ctx.slot || ctx.win);
  const fromXY = ctx => ctx.fromXY || fxPoint(ctx.from);
  const toXY = ctx => ctx.toXY || fxPoint(ctx.to);
  const pick = (list, i) => list[Math.min(list.length - 1, Math.max(0, i))];
  // Direction from a to b: deltas, length, unit vector, its normal and the angle in degrees
  function dirOf(a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    return { dx, dy, len, ux: dx / len, uy: dy / len, nx: -dy / len, ny: dx / len, ang: Math.atan2(dy, dx) * 180 / Math.PI };
  }
  // How hard a strike should feel: 1 for a plain hit, up to ~4 for crits, huge hits and late combo strikes
  function power(ctx) {
    const share = ctx.defender?.maxHp ? Math.min(0.8, (ctx.dmg || 0) / ctx.defender.maxHp * 2) : 0;
    return 1 + (ctx.big ? 0.6 : 0) + (ctx.crit ? 0.8 : 0) + Math.min(3, ctx.strike || 0) * 0.3 + share;
  }
  // Short WAAPI jolt on a battle element (HP box, card face). No fill, so it always snaps back to normal.
  function jolt(el, frames, ms, extra = {}) {
    try { el?.animate?.(frames, { duration: ms, easing: 'ease-out', ...extra }); } catch (e) { /* visuals only */ }
  }
  // The landed card's face: animate this, never the slot itself (the slot's transform holds its 3D place on the wheel)
  const slotFace = ctx => ctx.slot?.querySelector?.('.card-face');
  // Jiggle the landed card once its own landing bounce (0.5s, style.css) is over
  const faceJiggle = (ctx, frames, ms = 320) => jolt(slotFace(ctx), frames, ms, { delay: 480 });

  // Spiky comic starburst (random spikes each time), stretched to whatever box it's drawn in
  function starSvg(fill, ink) {
    const pts = [];
    for (let i = 0; i < 28; i++) {
      const r = i % 2 ? fxRand(28, 34) : fxRand(42, 49), a = i / 28 * Math.PI * 2;
      pts.push((50 + Math.cos(a) * r).toFixed(1) + ',' + (50 + Math.sin(a) * r).toFixed(1));
    }
    return `<svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none"><polygon points="${pts.join(' ')}" ` +
      `fill="${fill}" stroke="${ink}" stroke-width="3.5" stroke-linejoin="round"/></svg>`;
  }
  // Comic-book stamp ("POW!") that slams in from huge, settles, then drifts off. `star` = colour of a starburst behind it.
  function stamp(x, y, text, { color = '#ffd23f', ink = '#3a0a0a', size = 36, rot = fxRand(-12, 12), ms = 820, star = null } = {}) {
    if (star) {
      const w = Math.max(size * 2.6, text.length * size * 0.66);
      const s = fxSpawn(x, y, { cls: 'fxb-star', html: starSvg(star, ink), ms, size: [w, w * 0.78] });
      fxAnimate(s, [
        { transform: `scale(0.2) rotate(${rot - 30}deg)`, opacity: 0 },
        { transform: `scale(1.15) rotate(${rot}deg)`, opacity: 1, offset: 0.16 },
        { transform: `scale(1) rotate(${rot + 5}deg)`, opacity: 1, offset: 0.7 },
        { transform: `scale(1.3) rotate(${rot + 10}deg)`, opacity: 0 },
      ], ms, 'ease-out');
    }
    const el = fxSpawn(x, y, { cls: 'fxb-stamp', html: text, ms, vars: { c: color, ink }, style: { fontSize: size + 'px' } });
    return fxAnimate(el, [
      { transform: `scale(2.8) rotate(${rot - 8}deg)`, opacity: 0 },
      { transform: `scale(0.86) rotate(${rot}deg)`, opacity: 1, offset: 0.13 },
      { transform: `scale(1.08) rotate(${rot}deg)`, opacity: 1, offset: 0.22 },
      { transform: `scale(1) rotate(${rot}deg)`, opacity: 1, offset: 0.72 },
      { transform: `translate(0, -26px) scale(1.06) rotate(${rot}deg)`, opacity: 0 },
    ], ms, 'ease-out');
  }
  // Small bubbly caption ("HATCH!", "BOING!") that pops up and floats away
  function cute(x, y, text, { c = '#fff', ink = '#000', size = 20, ms = 760, rot = fxRand(-8, 8) } = {}) {
    const el = fxSpawn(x, y, { cls: 'fxb-cute', html: text, ms, vars: { c, ink }, style: { fontSize: size + 'px' } });
    return fxAnimate(el, [
      { transform: `translate(0, 12px) scale(0.3) rotate(${rot}deg)`, opacity: 0 },
      { transform: `translate(0, -4px) scale(1.2) rotate(${rot}deg)`, opacity: 1, offset: 0.22 },
      { transform: `translate(0, 0) scale(1) rotate(${rot}deg)`, opacity: 1, offset: 0.7 },
      { transform: `translate(0, -22px) scale(1) rotate(${rot}deg)`, opacity: 0 },
    ], ms, 'ease-out');
  }
  // Manga impact lines shooting outward from (x, y)
  function burstLines(x, y, { n = 10, r0 = 20, r1 = 90, len = 34, thick = 4, color = '#fff', ms = 380 } = {}) {
    const rot = fxRand(0, 360);
    for (let i = 0; i < n; i++) {
      const a = rot + i * 360 / n + fxRand(-8, 8);
      const el = fxSpawn(x, y, { cls: 'fxb-line', ms: ms + 40, size: [len * fxRand(0.7, 1.3), thick], vars: { lc: color } });
      fxAnimate(el, [
        { transform: `rotate(${a}deg) translateX(${r0}px) scaleX(0.2)`, opacity: 1 },
        { transform: `rotate(${a}deg) translateX(${(r0 + r1) / 2}px) scaleX(1)`, opacity: 1, offset: 0.35 },
        { transform: `rotate(${a}deg) translateX(${r1}px) scaleX(0.4)`, opacity: 0 },
      ], ms, 'cubic-bezier(.1,.8,.3,1)');
    }
  }
  // Speed lines rushing from a toward b, spread across the path (for punches and lunges)
  function speedLines(a, b, { n = 5, color = '#fff', width = 26, ms = 260 } = {}) {
    const d = dirOf(a, b);
    for (let i = 0; i < n; i++) {
      const off = fxRand(-width, width), t0 = fxRand(0, 0.25);
      const el = fxSpawn(a[0] + d.dx * t0 + d.nx * off, a[1] + d.dy * t0 + d.ny * off,
        { cls: 'fxb-line', ms: ms + 40, size: [fxRand(40, 80), 3], vars: { lc: color } });
      fxAnimate(el, [
        { transform: `rotate(${d.ang}deg) translateX(0) scaleX(0.3)`, opacity: 0.9 },
        { transform: `rotate(${d.ang}deg) translateX(${d.len * 0.6}px) scaleX(1.3)`, opacity: 0 },
      ], ms * fxRand(0.8, 1), 'ease-in');
    }
  }
  // Gold sparkle shower for Golden cards
  function goldShower(x, y, n = 8) {
    fxParticles(x, y, { count: n, html: i => (i % 2 ? '✨' : '✦'), colors: ['#ffd23f', '#fff6c2'], spread: 90, size: [6, 11], gravity: 30, ms: 800 });
  }

  // ---------- art ----------
  // A cartoon tadpole facing right (+x). White outlines keep it readable on the black wheel and the pale panel.
  const TADPOLE = gold => {
    const body = gold ? '#e0a800' : '#27313f', belly = gold ? '#ffe27a' : '#5a6b82';
    return '<svg viewBox="0 0 64 28" width="64" height="28">' +
      '<path d="M40 14 C32 5 26 23 18 14 S8 6 2 12" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round"/>' +
      `<path d="M40 14 C32 5 26 23 18 14 S8 6 2 12" fill="none" stroke="${body}" stroke-width="4.5" stroke-linecap="round"/>` +
      `<ellipse cx="46" cy="14" rx="14" ry="11" fill="${body}" stroke="#fff" stroke-width="2.5"/>` +
      `<ellipse cx="44" cy="17.5" rx="8" ry="4.5" fill="${belly}"/>` +
      '<circle cx="52" cy="9" r="4.2" fill="#fff"/><circle cx="53.2" cy="9" r="2.2" fill="#000"/>' +
      '<circle cx="49" cy="5.5" r="1.4" fill="#fff" opacity=".8"/></svg>';
  };
  // Zigzag crack drawn across the egg just before it bursts
  const EGG_CRACK = '<svg viewBox="0 0 40 40" width="44" height="44"><polyline points="20,5 15,12 22,18 14,25 21,31 17,38" ' +
    'fill="none" stroke="#5a3e1b" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/></svg>';
  // Pink slime splat with a shine and flung droplets
  const SPLAT = c => '<svg viewBox="0 0 100 100" width="100%" height="100%">' +
    `<path fill="${c}" d="M50 18 C60 6 72 20 70 30 C84 24 92 38 80 46 C94 54 86 70 74 66 C78 82 62 88 56 76 C50 92 34 86 38 72 ` +
    'C22 80 12 66 24 58 C8 50 16 34 30 38 C24 22 40 12 50 18 Z"/>' +
    `<circle cx="86" cy="20" r="5" fill="${c}"/><circle cx="12" cy="82" r="4" fill="${c}"/><circle cx="92" cy="86" r="3" fill="${c}"/>` +
    `<circle cx="8" cy="22" r="3" fill="${c}"/><ellipse cx="42" cy="40" rx="10" ry="5" fill="#fff" opacity=".45" transform="rotate(-30 42 40)"/></svg>`;
  // Ground crack left behind by the Big Leap body slam
  const CRACK = '<svg viewBox="0 0 100 100" width="100%" height="100%"><g fill="none" stroke="#2b1a0a" stroke-width="3.5" ' +
    'stroke-linecap="round" stroke-linejoin="round"><path d="M50 50 L38 40 L30 42 L16 30"/><path d="M50 50 L62 38 L66 26 L80 16"/>' +
    '<path d="M50 50 L66 56 L80 52 L95 60"/><path d="M50 50 L44 64 L48 76 L40 92"/><path d="M50 50 L32 57 L18 72"/>' +
    '<path d="M38 40 L36 27"/><path d="M66 56 L71 70"/><path d="M62 38 L74 40"/></g>' +
    '<ellipse cx="50" cy="50" rx="11" ry="8" fill="#2b1a0a"/></svg>';

  // ---------- Tadpole Tackle: an egg hatches on the wheel, a tadpole (swarm) swims in and bonks ----------
  // One tadpole swimming from a to b on a wiggly path, dropping bubbles. offset = sideways start (converges on b).
  function swim(a, b, { ms = 300, amp = 12, waves = 2.5, offset = 0, delay = 0, size = 1, gold = false } = {}) {
    return new Promise(done => later(delay, () => {
      const d = dirOf(a, b);
      const at = t => {
        const side = Math.sin(t * Math.PI * 2 * waves) * amp * (1 - t * 0.7) + offset * (1 - t);
        return [d.dx * t + d.nx * side, d.dy * t + d.ny * side];
      };
      const el = fxSpawn(a[0], a[1], { cls: 'fxb-tadpole', html: TADPOLE(gold), ms: ms + 60 });
      if (!el) return done();
      const flip = Math.abs(d.ang) > 90 ? ' scaleY(-1)' : ''; // keep the eye on top when swimming left
      const frames = [];
      for (let i = 0; i <= 10; i++) {
        const t = i / 10, [px, py] = at(t);
        const heading = d.ang + Math.cos(t * Math.PI * 2 * waves) * 28; // body follows the wiggle
        frames.push({ transform: `translate(${px}px, ${py}px) rotate(${heading}deg)${flip} scale(${size * (0.75 + 0.45 * t)})`, opacity: t ? 1 : 0.3 });
      }
      for (let j = 1; j <= 3; j++) later(ms * j / 4, () => {
        const [px, py] = at(j / 4), s = fxRand(7, 12);
        fxSpawn(a[0] + px, a[1] + py, { cls: 'fxb-bubble', ms: 520, size: [s, s] });
      });
      fxAnimate(el, frames, ms, 'linear').then(() => { el.remove(); done(); });
    }));
  }

  CARD_FX['tadpole-tackle'] = {
    land(ctx) {
      const [x, y] = landXY(ctx), gold = isGold(ctx);
      // The egg pops up and wobbles...
      const egg = fxSpawn(x, y, { cls: 'fxb-egg', html: '🥚', ms: 420 });
      fxAnimate(egg, [
        { transform: 'scale(0.3)', opacity: 0 },
        { transform: 'scale(1.15) rotate(0deg)', opacity: 1, offset: 0.2 },
        { transform: 'scale(1) rotate(-16deg)', opacity: 1, offset: 0.4 },
        { transform: 'scale(1) rotate(14deg)', opacity: 1, offset: 0.6 },
        { transform: 'scale(1.05) rotate(-10deg)', opacity: 1, offset: 0.8 },
        { transform: 'scale(1.2, 0.9) rotate(0deg)', opacity: 1 },
      ], 400, 'ease-in-out');
      later(230, () => fxAnimate(fxSpawn(x, y, { cls: 'fxb-eggcrack', html: EGG_CRACK, ms: 180 }),
        [{ transform: 'scale(0.4)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], 120));
      // ...then cracks open: shell halves fly apart and a tadpole wriggles out
      later(400, () => {
        for (const [half, dir] of [['l', -1], ['r', 1]]) {
          const s = fxSpawn(x, y, { cls: 'fxb-shell ' + half, html: '🥚', ms: 700 });
          fxAnimate(s, [
            { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
            { transform: `translate(${dir * 34}px, -24px) rotate(${dir * 40}deg)`, opacity: 1, offset: 0.35 },
            { transform: `translate(${dir * 60}px, 50px) rotate(${dir * 120}deg)`, opacity: 0 },
          ], 680, 'cubic-bezier(.2,.6,.4,1)');
        }
        const tad = fxSpawn(x, y, { cls: 'fxb-tadpole', html: TADPOLE(gold), ms: 720 });
        fxAnimate(tad, [
          { transform: 'translate(0, 8px) rotate(-90deg) scale(0.3)', opacity: 0 },
          { transform: 'translate(0, -30px) rotate(-68deg) scale(1.25)', opacity: 1, offset: 0.3 },
          { transform: 'translate(-4px, -38px) rotate(-112deg) scale(1.15)', opacity: 1, offset: 0.5 },
          { transform: 'translate(4px, -46px) rotate(-72deg) scale(1.15)', opacity: 1, offset: 0.7 },
          { transform: 'translate(0, -64px) rotate(-95deg) scale(0.9)', opacity: 0 },
        ], 700, 'ease-out');
        fxRing(x, y, { color: '#8fe3ff', size: 130, ms: 480, width: 5 });
        fxParticles(x, y, { count: 10, colors: ['#fff8e1', '#ffe9b0', '#fff'], spread: 70, size: [4, 8], gravity: 60, ms: 650 });
        fxParticles(x, y, { count: 6, html: () => '<i class="fxb-bub"></i>', spread: 55, size: [4, 8], gravity: -40, ms: 700 });
        cute(x, y + 44, 'HATCH!', { c: '#fff8e1', ink: '#1d5d8c', size: 19 });
        if (gold) goldShower(x, y, 6);
        jolt(slotFace(ctx), [{ transform: 'rotate(0)' }, { transform: 'rotate(-7deg)' }, { transform: 'rotate(6deg)' }, { transform: 'rotate(0)' }], 300, { delay: 100 });
      });
    },
    // A tadpole swims at the foe; every extra strike (and a crit) adds another to the swarm
    windup(ctx) {
      const a = fromXY(ctx), b = toXY(ctx), s = Math.min(3, ctx.strike || 0), gold = isGold(ctx);
      const n = Math.min(4, 1 + s + (ctx.crit ? 1 : 0)), ms = Math.max(220, 300 - s * 25);
      fxRing(a[0], a[1], { color: '#8fe3ff', size: 70, ms: 360, width: 4 });
      const offsets = [0, -18, 18, -34], runs = [];
      for (let i = 0; i < n; i++) runs.push(swim(a, b, { ms, offset: offsets[i], delay: i * 36, size: 1 + s * 0.12, gold, amp: 12 + s * 3 }));
      return Promise.all(runs);
    },
    // Splash! Water rings, droplets, and the tadpole bouncing off the foe
    impact(ctx) {
      const [x, y] = toXY(ctx), p = power(ctx), k = Math.sqrt(p), s = ctx.strike || 0;
      const d = dirOf(fromXY(ctx), [x, y]);
      jolt(ctx.to, [{ transform: 'scale(1)' }, { transform: 'scale(1.1, 0.86)', offset: 0.3 },
        { transform: 'scale(0.96, 1.05)', offset: 0.65 }, { transform: 'scale(1)' }], 320);
      fxRing(x, y, { color: '#7fdcff', size: 110 * k, ms: 460, width: 5 });
      later(70, () => fxRing(x, y, { color: '#fff', size: 150 * k, ms: 460, width: 3 }));
      fxParticles(x, y, { count: Math.min(14, 7 + Math.round(2 * p)), html: () => '💧', spread: 75 * k, size: [5, 9],
        angle: -90, cone: 160, gravity: 90, ms: 720 });
      fxParticles(x, y, { count: 7, html: () => '<i class="fxb-bub"></i>', spread: 60 * k, size: [4, 8], gravity: -35, ms: 700 });
      // The tadpole ricochets off, spinning
      const bounce = fxSpawn(x, y, { cls: 'fxb-tadpole', html: TADPOLE(isGold(ctx)), ms: 560 });
      fxAnimate(bounce, [
        { transform: 'translate(0, 0) rotate(0deg) scale(1.1)', opacity: 1 },
        { transform: `translate(${-d.ux * 40}px, ${-d.uy * 40 - 50}px) rotate(${-Math.sign(d.dx || 1) * 300}deg) scale(0.85)`, opacity: 1, offset: 0.6 },
        { transform: `translate(${-d.ux * 62}px, ${-d.uy * 62 - 12}px) rotate(${-Math.sign(d.dx || 1) * 440}deg) scale(0.6)`, opacity: 0 },
      ], 540, 'ease-out');
      const word = ctx.crit ? 'MEGA BONK!' : pick(['BONK!', 'BOP!', 'BLOOP!', 'SPLOOSH!'], s);
      stamp(x + (s ? (s % 2 ? 22 : -22) : 0), y + 28, word,
        { color: '#9beaff', ink: '#08365e', size: 24 + 9 * k, star: s || ctx.crit ? '#ffffff' : null });
      if (ctx.crit || ctx.big) fxTint('#6fd6ff', { ms: 320, opacity: 0.2 });
    },
  };

  // ---------- Sticky Tongue: a giant lick on the wheel, a pink tongue lashes out, snaps back and yanks ----------
  CARD_FX['sticky-tongue'] = {
    land(ctx) {
      const [x, y] = landXY(ctx), gold = isGold(ctx);
      // A giant tongue flicks out of the card and licks side to side
      const t = fxSpawn(x, y, { cls: 'fxb-lick', html: '👅', ms: 760 });
      fxAnimate(t, [
        { transform: 'translate(0, 8px) scale(0.3, 0.1)', opacity: 0 },
        { transform: 'translate(0, 18px) scale(1.1, 1.5)', opacity: 1, offset: 0.2 },
        { transform: 'translate(-10px, 20px) scale(1, 1.2) rotate(-18deg)', opacity: 1, offset: 0.4 },
        { transform: 'translate(10px, 20px) scale(1, 1.3) rotate(18deg)', opacity: 1, offset: 0.6 },
        { transform: 'translate(0, 14px) scale(1.05, 1.1) rotate(0deg)', opacity: 1, offset: 0.8 },
        { transform: 'translate(0, 0) scale(0.4, 0.2)', opacity: 0 },
      ], 740, 'ease-in-out');
      // ...and one wet lick streaks right across the wheel window
      if (ctx.win) later(110, () => fxBeam(fxPoint(ctx.win, 0.04, 0.64), fxPoint(ctx.win, 0.96, 0.36), { cls: 'fxb-tongue-beam', ms: 420, width: 14 }));
      later(180, () => {
        fxParticles(x, y + 28, { count: 9, cls: 'fxb-goo', colors: ['#ff5c95', '#ff8fb8', '#d81b60'], angle: 90, cone: 80,
          spread: 55, gravity: 80, size: [5, 10], ms: 800, spin: 0 });
        fxParticles(x, y, { count: 4, html: () => '💦', spread: 70, size: [6, 9], angle: -90, cone: 120, gravity: 40, ms: 700 });
        fxRing(x, y, { color: '#ff7eb6', size: 120, ms: 450, width: 5 });
        cute(x, y - 46, 'SLURP!', { c: '#ffd0e1', ink: '#8c0f45', size: 21, rot: -8 });
        if (gold) goldShower(x, y, 6);
      });
      // The card goes all jelly
      faceJiggle(ctx, [{ transform: 'scale(1)' }, { transform: 'scale(1.15, 0.85)' }, { transform: 'scale(0.9, 1.1)' },
        { transform: 'scale(1.05, 0.95)' }, { transform: 'scale(1)' }], 380);
    },
    // A pink tongue shoots from the attacker to the foe (resolves on contact), then snaps back.
    // Every extra strike makes it faster and fatter.
    windup(ctx) {
      const a = fromXY(ctx), b = toXY(ctx), d = dirOf(a, b), s = Math.min(4, ctx.strike || 0);
      const out = Math.max(110, 170 - s * 15), hold = 60, back = 170, total = out + hold + back;
      const thick = 12 + s * 3 + (ctx.crit ? 5 : 0);
      const reach = out / total, grip = (out + hold) / total;
      const body = fxSpawn(a[0], a[1], { cls: 'fxb-tongue' + (isGold(ctx) ? ' gold' : ''), ms: total + 30,
        style: { width: d.len + 'px', height: thick + 'px', transformOrigin: '0 50%' } });
      if (body) {
        // Anchored at its root (like fxBeam), so scaleX stretches it out toward the foe
        const tf = sx => `translate(0, -50%) rotate(${d.ang}deg) scaleX(${sx})`;
        body.animate([
          { transform: tf(0), easing: 'cubic-bezier(.2,.9,.3,1)' },
          { transform: tf(1), offset: reach },
          { transform: tf(1), offset: grip, easing: 'cubic-bezier(.6,0,.9,.4)' },
          { transform: tf(0) },
        ], { duration: total, fill: 'forwards' });
      }
      const tip = fxSpawn(a[0], a[1], { cls: 'fxb-tongue-tip', ms: total + 30, size: [thick * 1.9, thick * 1.9] });
      fxAnimate(tip, [
        { transform: 'translate(0, 0) scale(0.6)', easing: 'cubic-bezier(.2,.9,.3,1)' },
        { transform: `translate(${d.dx}px, ${d.dy}px) scale(1.25)`, offset: reach },
        { transform: `translate(${d.dx}px, ${d.dy}px) scale(1)`, offset: grip, easing: 'cubic-bezier(.6,0,.9,.4)' },
        { transform: 'translate(0, 0) scale(0.5)' },
      ], total, 'linear');
      fxRing(a[0], a[1], { color: '#ff7eb6', size: 60 + s * 10, ms: 300, width: 4 });
      cute(a[0] - d.ux * 10, a[1] - 26, s >= 2 ? 'THWIP!!' : 'THWIP!', { c: '#fff', ink: '#c2185b', size: 15 + s * 2, ms: 520 });
      // Drool drips off the tongue while it's stretched out (more on every strike)
      later(out, () => {
        for (let i = 0; i < 2 + Math.min(3, s); i++) {
          const t = fxRand(0.25, 0.85);
          fxParticles(a[0] + d.dx * t, a[1] + d.dy * t, { count: 1, cls: 'fxb-goo', colors: ['#ff8fb8'], angle: 90, cone: 20,
            spread: 30, gravity: 40, size: [5, 8], ms: 520, spin: 0 });
        }
      });
      return wait(out);
    },
    // THWAP! Pink slime splat, goo everywhere, and the foe gets yanked toward the attacker
    impact(ctx) {
      const [x, y] = toXY(ctx), p = power(ctx), k = Math.sqrt(p), s = ctx.strike || 0;
      const d = dirOf(fromXY(ctx), [x, y]), gold = isGold(ctx);
      jolt(ctx.to, [
        { transform: 'translate(0, 0) scale(1)' },
        { transform: `translate(${-d.ux * 16 * k}px, ${-d.uy * 16 * k}px) scale(1.06, 0.94)`, offset: 0.3 },
        { transform: `translate(${d.ux * 4}px, ${d.uy * 4}px) scale(0.98, 1.03)`, offset: 0.7 },
        { transform: 'translate(0, 0) scale(1)' },
      ], 340);
      const w = 100 * k, rot = fxRand(0, 360);
      const splat = fxSpawn(x, y, { cls: 'fxb-splat', html: SPLAT(gold ? '#ffcf3f' : '#ff5c95'), ms: 700, size: [w, w] });
      fxAnimate(splat, [
        { transform: `scale(0.2) rotate(${rot}deg)`, opacity: 0.9 },
        { transform: `scale(1.15) rotate(${rot}deg)`, opacity: 0.95, offset: 0.18 },
        { transform: `scale(1) rotate(${rot}deg)`, opacity: 0.9, offset: 0.6 },
        { transform: `translate(0, 14px) scale(1, 1.1) rotate(${rot}deg)`, opacity: 0 },
      ], 680, 'ease-out');
      fxParticles(x, y, { count: Math.min(16, 9 + Math.round(3 * p)), cls: 'fxb-goo', colors: ['#ff5c95', '#ff8fb8', '#d81b60', '#ffd0e1'],
        spread: 95 * k, size: [5, 11], gravity: 90, ms: 760, spin: 0 });
      fxParticles(x, y, { count: 4, html: () => '💦', spread: 80 * k, size: [7, 10], angle: -90, cone: 180, gravity: 50, ms: 700 });
      fxRing(x, y, { color: '#ff7eb6', size: 130 * k, ms: 440, width: 6 });
      burstLines(x, y, { n: 8, r0: 24, r1: 70 + 25 * k, len: 28, color: '#ffd0e1' });
      if (!s) sfx('leech', 1.7, 0.35); // wet slap on top of the regular hit
      const word = ctx.crit ? 'SUPER SLURP!' : pick(['THWAP!', 'SLURP!', 'YOINK!', 'SPLAT!!'], s);
      stamp(x + (s ? (s % 2 ? 22 : -22) : 0), y + 30, word,
        { color: '#ffb3cf', ink: '#6b0f3a', size: 26 + 9 * k, star: s || ctx.crit ? '#fff0f6' : null });
      if (ctx.crit || ctx.big) fxTint('#ff4f8b', { ms: 320, opacity: 0.2 });
    },
  };

  // ---------- Big Leap: the frog leaps out of the card, then launches sky-high and body-slams the foe ----------
  // Where the leaping frog is at time t (0..1): a fast climb, then a steep plunge onto the target
  function leapAt(d, H, t) {
    let along, up;
    if (t <= 0.55) { const u = t / 0.55; up = H * (1 - (1 - u) ** 2); along = 0.72 * u; }
    else { const u = (t - 0.55) / 0.45; up = H * (1 - u * u); along = 0.72 + 0.28 * u; }
    return [d.dx * along, d.dy * along - up];
  }

  CARD_FX['big-leap'] = {
    land(ctx) {
      const [x, y] = landXY(ctx), gold = isGold(ctx);
      // Rare pull: light rays spin up behind the card
      const rays = fxSpawn(x, y, { cls: 'fxb-rays' + (gold ? ' gold' : ''), ms: 1050, size: [230, 230] });
      fxAnimate(rays, [
        { transform: 'rotate(0deg) scale(0.2)', opacity: 0 },
        { transform: 'rotate(40deg) scale(1.1)', opacity: 1, offset: 0.3 },
        { transform: 'rotate(110deg) scale(1.3)', opacity: 0 },
      ], 1000, 'ease-out');
      fxParticles(x, y, { count: 8, html: i => (i % 2 ? '✨' : '✦'), colors: ['#d8ff7a', '#fff'], spread: 80, size: [6, 10], ms: 700 });
      fxTint(gold ? '#ffd23f' : '#b6ff7a', { ms: 380, opacity: 0.14 });
      // The frog crouches, springs out of the card, hangs at the top and splats back down
      const frog = fxSpawn(x, y, { cls: 'fxb-frog' + (gold ? ' gold' : ''), html: '🐸', ms: 760 });
      fxAnimate(frog, [
        { transform: 'translate(0, 0) scale(1.3, 0.6)', opacity: 0 },
        { transform: 'translate(0, 0) scale(1.3, 0.6)', opacity: 1, offset: 0.12 },
        { transform: 'translate(0, -70px) scale(0.9, 1.25)', opacity: 1, offset: 0.3 },
        { transform: 'translate(0, -104px) scale(1.2) rotate(-10deg)', opacity: 1, offset: 0.48 },
        { transform: 'translate(0, -64px) scale(1, 1.2) rotate(6deg)', opacity: 1, offset: 0.68 },
        { transform: 'translate(0, 6px) scale(1.45, 0.62)', opacity: 1, offset: 0.84 },
        { transform: 'translate(0, 0) scale(1)', opacity: 0 },
      ], 740, 'linear');
      later(90, () => fxParticles(x, y + 20, { count: 6, cls: 'fxb-dust', colors: ['#e9dcc0', '#c8b089'], spread: 45, size: [8, 13], gravity: -10, ms: 450 }));
      later(160, () => stamp(x, y + 58, 'BIG LEAP!', { color: '#b6ff5a', ink: '#0f4d12', size: 22, rot: -6, ms: 900, star: gold ? '#ffd23f' : null }));
      // Touchdown
      later(620, () => {
        fxRing(x, y, { color: '#7dff5a', size: 150, ms: 460, width: 6 });
        fxRing(x, y, { color: '#fff', size: 100, ms: 360, width: 3 });
        fxParticles(x, y + 10, { count: 8, html: () => '🍃', spread: 80, size: [6, 10], angle: -90, cone: 200, gravity: 50, ms: 700 });
        cute(x + 34, y - 34, 'BOING!', { c: '#eaffd6', ink: '#1f6b12', size: 18, rot: 10 });
        fxShake(ctx.win, 5, 260);
        sfx('card_pick', 1.5, 0.6);
        if (gold) goldShower(x, y, 8);
        jolt(slotFace(ctx), [{ transform: 'scale(1)' }, { transform: 'scale(1.12, 0.84)' }, { transform: 'scale(0.94, 1.08)' }, { transform: 'scale(1)' }], 300);
      });
    },
    // The frog launches from the attacker in a huge arc (growing as it "rises toward the camera") while a landing
    // shadow grows on the target. Combo strikes leap higher, flip and leave green afterimages.
    windup(ctx) {
      const a = fromXY(ctx), b = toXY(ctx), d = dirOf(a, b), s = Math.min(3, ctx.strike || 0), gold = isGold(ctx);
      const ms = s ? 360 : 400;
      const H = Math.max(60, Math.min(150 + 35 * s + (ctx.crit ? 40 : 0), Math.min(a[1], b[1]) - 40)); // stay on screen
      const dir = d.dx >= 0 ? 1 : -1;
      fxParticles(a[0], a[1] + 10, { count: 6, cls: 'fxb-dust', colors: ['#e9dcc0', '#c8b089', '#a08a64'], spread: 50, size: [8, 13], gravity: -10, ms: 450 });
      fxRing(a[0], a[1], { color: '#e9dcc0', size: 90, ms: 380, width: 4 });
      const sh = fxSpawn(b[0], b[1] + 12, { cls: 'fxb-shadow', ms: ms + 40, size: [110, 30] });
      fxAnimate(sh, [{ transform: 'scale(0.2)', opacity: 0 }, { transform: 'scale(1.1)', opacity: 0.75 }], ms, 'ease-in');
      const frog = fxSpawn(a[0], a[1], { cls: 'fxb-frog' + (gold ? ' gold' : ''), html: '🐸', ms: ms + 60, style: { fontSize: 50 + 6 * s + 'px' } });
      const frames = [];
      for (let i = 0; i <= 12; i++) {
        const t = i / 12, [px, py] = leapAt(d, H, t);
        const sc = i === 0 ? 'scale(1.25, 0.7)' : i === 12 ? 'scale(1.35, 0.7)' : `scale(${1 + 0.7 * Math.sin(Math.PI * t)})`;
        const rot = s || ctx.crit ? dir * 360 * Math.min(1, t / 0.85) : dir * (t < 0.55 ? -14 : 20);
        frames.push({ transform: `translate(${px}px, ${py}px) rotate(${rot}deg) ${sc}` });
      }
      if (s || ctx.crit) for (let j = 1; j <= 4; j++) later(ms * j / 6, () => {
        const [px, py] = leapAt(d, H, j / 6);
        fxSpawn(a[0] + px, a[1] + py, { cls: 'fxb-ghost', html: '🐸', ms: 320, style: { fontSize: 50 + 6 * s + 'px' } });
      });
      return fxAnimate(frog, frames, ms, 'linear').then(() => frog?.remove());
    },
    // BODY SLAM: crater crack, triple shockwave, debris flying sideways, the foe flattened, the frog bouncing off
    impact(ctx) {
      const [x, y] = toXY(ctx), p = power(ctx), k = Math.sqrt(p), s = ctx.strike || 0;
      const d = dirOf(fromXY(ctx), [x, y]), gold = isGold(ctx);
      jolt(ctx.to, [{ transform: 'scale(1)' }, { transform: 'translateY(6px) scale(1.18, 0.7)', offset: 0.2 },
        { transform: 'scale(0.94, 1.08)', offset: 0.55 }, { transform: 'scale(1)' }], 420);
      const cw = 150 * k;
      const crack = fxSpawn(x, y + 6, { cls: 'fxb-crack', html: CRACK, ms: 820, size: [cw, cw * 0.7] });
      fxAnimate(crack, [
        { transform: 'scale(0.5)', opacity: 0 },
        { transform: 'scale(1.05)', opacity: 0.85, offset: 0.12 },
        { transform: 'scale(1)', opacity: 0.8, offset: 0.6 },
        { transform: 'scale(1)', opacity: 0 },
      ], 800, 'ease-out');
      fxRing(x, y, { color: '#7dff5a', size: 200 * k, ms: 520, width: 10 });
      later(70, () => fxRing(x, y, { color: '#fff', size: 280 * k, ms: 520, width: 5 }));
      if (ctx.crit || ctx.big || s >= 2) later(140, () => fxRing(x, y, { color: gold ? '#ffd23f' : '#d8ff7a', size: 380 * k, ms: 560, width: 4 }));
      // Debris thrown out to both sides, leaves fluttering up
      const chunks = Math.min(9, 5 + Math.round(p * 1.5));
      for (const ang of [180, 0]) fxParticles(x, y + 8, { count: chunks, html: i => (i % 2 ? '◆' : '■'),
        colors: ['#8b5a2b', '#c8a26b', '#5d3a1a', '#6fcf3a'], spread: 110 * k, size: [4, 8], angle: ang + 20 * Math.sign(ang - 90), cone: 60, gravity: 70, ms: 700 });
      fxParticles(x, y, { count: 6, html: () => '🍃', spread: 90 * k, size: [6, 10], angle: -90, cone: 140, gravity: 40, ms: 800 });
      burstLines(x, y, { n: 10, r0: 30, r1: 100 + 30 * k, len: 40, thick: 5, color: '#eaffd6' });
      // The frog lands squashed on top, then springs back toward its side
      const frog = fxSpawn(x, y - 14, { cls: 'fxb-frog' + (gold ? ' gold' : ''), html: '🐸', ms: 600, style: { fontSize: 54 + 6 * Math.min(3, s) + 'px' } });
      fxAnimate(frog, [
        { transform: 'translate(0, 0) scale(1.55, 0.55)', opacity: 1 },
        { transform: 'translate(0, 0) scale(1.4, 0.65)', opacity: 1, offset: 0.2 },
        { transform: `translate(${-d.dx * 0.3}px, ${-d.dy * 0.3 - 70}px) scale(0.9, 1.2) rotate(${-Math.sign(d.dx || 1) * 20}deg)`, opacity: 1, offset: 0.6 },
        { transform: `translate(${-d.dx * 0.5}px, ${-d.dy * 0.5 - 40}px) scale(0.7)`, opacity: 0 },
      ], 580, 'ease-out');
      if (!s) sfx('big_hit', 0.55, 0.7); // deep extra thud on the first slam (combo strikes already stack thuds)
      const word = ctx.crit || ctx.big ? 'KA-BOOM!' : pick(['SLAM!', 'CRUSH!', 'MEGA SLAM!', 'FROGQUAKE!'], s);
      stamp(x + (s ? (s % 2 ? 24 : -24) : 0), y + 30, word,
        { color: gold ? '#ffe066' : '#b6ff5a', ink: '#0f4d12', size: 30 + 10 * k, star: '#ffffff' });
      fxTint(gold ? '#ffd23f' : '#9dff5a', { ms: 320, opacity: Math.min(0.32, 0.1 + 0.05 * p) });
    },
  };

  // ---------- Bare Hands: a wave, a fist raised; then punches and slaps with comic POW! bursts ----------
  CARD_FX['bare-hands'] = {
    land(ctx) {
      const [x, y] = landXY(ctx);
      // A hand waves hello...
      const hand = fxSpawn(x, y, { cls: 'fxb-hand', html: '✋', ms: 470 });
      fxAnimate(hand, [
        { transform: 'scale(0.3) rotate(-30deg)', opacity: 0 },
        { transform: 'scale(1.15) rotate(0deg)', opacity: 1, offset: 0.25 },
        { transform: 'scale(1) rotate(-22deg)', opacity: 1, offset: 0.45 },
        { transform: 'scale(1) rotate(18deg)', opacity: 1, offset: 0.65 },
        { transform: 'scale(0.9) rotate(0deg)', opacity: 1, offset: 0.85 },
        { transform: 'scale(0.6)', opacity: 0 },
      ], 460, 'ease-in-out');
      // ...then clenches into a fist that punches straight out at the player
      later(400, () => {
        const fist = fxSpawn(x, y, { cls: 'fxb-hand', html: '👊', ms: 560 });
        fxAnimate(fist, [
          { transform: 'scale(0.6)', opacity: 0 },
          { transform: 'scale(1.1)', opacity: 1, offset: 0.3 },
          { transform: 'scale(1)', opacity: 1, offset: 0.5 },
          { transform: 'scale(2.3)', opacity: 0 },
        ], 540, 'cubic-bezier(.5,0,.8,.4)');
        burstLines(x, y, { n: 10, r0: 24, r1: 90, len: 30, color: '#fff' });
        fxRing(x, y, { color: '#ffd23f', size: 120, ms: 380, width: 4 });
        fxPop(x + 26, y - 30, '💢', { size: 28, ms: 520 });
        cute(x, y + 48, 'FISTS UP!', { c: '#fff', ink: '#8a1c1c', size: 16 });
        jolt(slotFace(ctx), [{ transform: 'scale(1)' }, { transform: 'scale(0.9)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], 240, { delay: 100 });
      });
    },
    // Straight punches on even strikes, spinning arc slaps on odd ones; combos shout ORA!
    windup(ctx) {
      const a = fromXY(ctx), b = toXY(ctx), d = dirOf(a, b), s = Math.min(4, ctx.strike || 0);
      const slap = s % 2 === 1, ms = Math.max(170, 240 - s * 20), turn = d.dx >= 0 ? 1 : -1;
      speedLines(a, b, { n: 4 + s, color: '#fff' });
      if (s) fxPop(a[0], a[1] - 30, s >= 3 ? 'ORAAA!' : 'ORA!', { cls: 'fxb-ora', size: 18 + s * 3, ms: 420, rotate: fxRand(-15, 15) });
      return fxFly(a, b, {
        html: slap ? '✋' : turn > 0 ? '🤜' : '🤛', cls: 'fxb-fist', ms,
        arc: slap ? (s % 4 === 1 ? 70 : -70) : 0, spin: slap ? turn * 80 : 0,
        scale: [0.7, 1.5 + 0.12 * s], trail: 'fxb-smear', trailEvery: 28, easing: 'cubic-bezier(.55,0,.9,.5)',
      });
    },
    // POW! Starburst stamp, manga impact lines, stars, and the foe knocked back (a red handprint for slaps)
    impact(ctx) {
      const [x, y] = toXY(ctx), p = power(ctx), k = Math.sqrt(p), s = ctx.strike || 0;
      const slap = s % 2 === 1, d = dirOf(fromXY(ctx), [x, y]);
      jolt(ctx.to, [
        { transform: 'translate(0, 0) rotate(0deg)' },
        { transform: `translate(${d.ux * 16 * k}px, ${d.uy * 16 * k}px) rotate(${Math.sign(d.dx || 1) * 4}deg)`, offset: 0.25 },
        { transform: 'translate(0, 0) rotate(0deg)' },
      ], 300);
      burstLines(x, y, { n: 12, r0: 20, r1: 80 + 30 * k, len: 34 * k, thick: 4, color: '#fff7c2' });
      if (slap) {
        const r = fxRand(-25, 25);
        const print = fxSpawn(x + fxRand(-18, 18), y, { cls: 'fxb-print', html: '✋', ms: 720, style: { fontSize: 52 * k + 'px' } });
        fxAnimate(print, [
          { transform: `scale(1.5) rotate(${r}deg)`, opacity: 0 },
          { transform: `scale(1) rotate(${r}deg)`, opacity: 0.9, offset: 0.12 },
          { transform: `scale(1) rotate(${r}deg)`, opacity: 0.8, offset: 0.65 },
          { transform: `scale(1.05) rotate(${r}deg)`, opacity: 0 },
        ], 700, 'ease-out');
      } else fxPop(x, y, '💥', { size: 56 * k, ms: 460, rise: 0 });
      fxParticles(x, y, { count: Math.min(12, 6 + Math.round(2 * p)), html: i => (i % 3 ? '⭐' : '✦'), colors: ['#ffe14d', '#fff'],
        spread: 90 * k, size: [6, 10], gravity: 40, ms: 700 });
      const word = ctx.crit ? 'CRIT PUNCH!' : pick(slap ? ['SLAP!', 'SMACK!', 'THWACK!'] : ['POW!', 'WHAM!', 'KAPOW!'], Math.floor(s / 2));
      stamp(x + (s ? (s % 2 ? 22 : -22) : 0), y + 28, word, { color: '#ffe14d', ink: '#b3000c', size: 28 + 8 * k, star: '#ff3b3b' });
      if (ctx.crit) fxTint('#fff', { ms: 220, opacity: 0.4 });
    },
  };
})();
