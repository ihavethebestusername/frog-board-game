// Card effects: boss group - the Butcher Hog's cards (see js/card-fx.js for the helpers and when each hook fires).
// Blood-red and steel: giant cleavers, cracking bones, sizzling bacon and mud. Brutal but cartoony, never gory.
// Styles live in css/fx/boss.css (every class is prefixed fxo-).
(() => {
  // ---------- Graphics (inline SVG / emoji, no image files) ----------
  // Butcher's cleaver: steel blade with its sharp edge along the bottom and a hang hole in the corner,
  // steel bolster, wooden handle with brass rivets. The handle sits at ~82% across (the swing pivot).
  const CLEAVER = '<svg viewBox="0 0 140 70">' +
    '<path d="M4 6 H94 V50 Q52 66 4 60 Z" fill="#cfd8dc" stroke="#263238" stroke-width="4" stroke-linejoin="round"/>' +
    '<path d="M8 10 H90 V22 H8 Z" fill="#f5f7f8"/>' +
    '<path d="M8 36 H90 V48 Q52 60 8 55 Z" fill="#9fb0b8"/>' +
    '<path d="M8 53 Q50 60 90 48" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M8 58 Q50 64 88 53" fill="none" stroke="#ff2a45" stroke-width="2.5" stroke-linecap="round"/>' +
    '<circle cx="20" cy="22" r="6.5" fill="#2a0508" stroke="#263238" stroke-width="3"/>' +
    '<rect x="92" y="18" width="12" height="22" rx="2" fill="#607d8b" stroke="#263238" stroke-width="3"/>' +
    '<rect x="102" y="20" width="34" height="18" rx="7" fill="#7b4a22" stroke="#2e1606" stroke-width="3"/>' +
    '<rect x="106" y="23" width="26" height="4" rx="2" fill="#a86b35"/>' +
    '<circle cx="113" cy="31" r="2.4" fill="#ffd54f"/><circle cx="126" cy="31" r="2.4" fill="#ffd54f"/></svg>';

  // Jagged cracks radiating from the centre: a dark outline under a light core
  const CRACK_LINES = ['0,0 -7,-13 -3,-24 -13,-44', '0,0 11,-7 21,-5 42,-19', '0,0 13,9 11,22 27,42',
    '0,0 -12,7 -25,5 -44,16', '0,0 -2,15 -11,29 -9,40', '0,0 4,-14 16,-26 22,-40'];
  const crackSvg = (core, dark) => '<svg viewBox="-50 -50 100 100">' + [[dark, 8], [core, 3.5]].map(([c, w]) =>
    `<g fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">` +
    CRACK_LINES.map(p => `<polyline points="${p}"/>`).join('') + '</g>').join('') + '</svg>';
  const CRACK = { bone: crackSvg('#fff6e0', '#5a0020'), ice: crackSvg('#ffffff', '#1f5fbf'), steel: crackSvg('#ffe0e4', '#3a0008') };

  // Lock-on reticle that tells the victim the big chop is coming
  const RETICLE = '<svg viewBox="-50 -50 100 100"><g fill="none" stroke="#ff1f3d" stroke-width="5"><circle r="34"/>' +
    '<circle r="13" stroke-width="3"/></g><path d="M0 -48 V-24 M0 24 V48 M-48 0 H-24 M24 0 H48" stroke="#ff1f3d" ' +
    'stroke-width="6" stroke-linecap="round"/><circle r="4" fill="#fff"/></svg>';

  // Motion smear left by the chop: a crescent swoosh
  const SWOOSH = '<svg viewBox="0 0 100 80"><path d="M96 6 Q18 2 6 74 Q34 20 96 6Z" fill="#fff" opacity=".9"/>' +
    '<path d="M96 6 Q26 10 12 66" fill="none" stroke="#ff1f3d" stroke-width="3" stroke-linecap="round"/></svg>';

  const BLOB = () => '<i class="fxo-blob"></i>';   // a mud clod (particle html)
  const VIG_RED = 'radial-gradient(ellipse at 50% 50%, #0000 38%, #6a000cdd 100%)';
  const VIG_DARK = 'radial-gradient(ellipse at 50% 50%, #0000 25%, #000c 100%)';

  // ---------- Small helpers ----------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // Run something a bit later without ever letting an error escape into the battle
  const later = (ms, fn) => setTimeout(() => { try { fn(); } catch (e) { console.warn('boss fx', e); } }, ms);
  const at = ctx => ctx.toXY || fxPoint(ctx.to);     // the victim's HP box centre
  const src = ctx => ctx.fromXY || fxPoint(ctx.from); // the hog's HP box centre
  // Width/height of an element (size only; positions always go through fxPoint)
  const sizeOf = (el, dw = 120, dh = 50) => {
    const r = el?.getBoundingClientRect?.();
    return r && r.width ? [r.width, r.height] : [dw, dh];
  };
  // Hit strength: ~0.7 for a light hit up to 2.2 for a monster crit. Everything scales with it.
  const pow = ctx => clamp(0.7 + (ctx.dmg || 0) / 40 + (ctx.crit ? 0.45 : 0), 0.7, 2.2);

  // Where the wheel last stopped on a boss card, so that card's attack launches straight out of the wheel
  let lastLand = null;
  const remember = ctx => { if (ctx.card) lastLand = { slug: fxSlug(ctx.card), el: ctx.slot || ctx.win, t: performance.now() }; };
  function launchPoint(ctx) {
    const l = lastLand;
    if (l && ctx.card && l.slug === fxSlug(ctx.card) && l.el?.isConnected && performance.now() - l.t < 3000) return fxPoint(l.el);
    return src(ctx);
  }

  // Big stamped word that slams down from huge, holds, then drifts up and fades
  function slam(x, y, text, { kind = '', size = 56, rotate = 0, ms = 800 } = {}) {
    const el = fxSpawn(x, y, { cls: 'fxo-stamp ' + kind, html: text, ms: ms + 40, style: { fontSize: size + 'px' } });
    return fxAnimate(el, [
      { transform: `translate(0, 0) scale(3.2) rotate(${rotate - 14}deg)`, opacity: 0 },
      { transform: `translate(0, 0) scale(0.86) rotate(${rotate}deg)`, opacity: 1, offset: 0.13 },
      { transform: `translate(0, 0) scale(1.08) rotate(${rotate}deg)`, opacity: 1, offset: 0.22 },
      { transform: `translate(0, 0) scale(1) rotate(${rotate}deg)`, opacity: 1, offset: 0.74 },
      { transform: `translate(0, -22px) scale(1.12) rotate(${rotate}deg)`, opacity: 0 },
    ], ms, 'ease-out');
  }

  // Gacha-style name plate punching in over the bottom of the wheel that landed
  function plate(ctx, text, color) {
    if (!ctx.win && !ctx.slot) return;
    const [x, y] = fxPoint(ctx.win || ctx.slot), [, h] = sizeOf(ctx.win, 120, 180);
    const el = fxSpawn(x, y + h * 0.3, { cls: 'fxo-plate', html: text, ms: 1000, vars: { '--c': color } });
    fxAnimate(el, [
      { transform: 'translate(0, 16px) scale(0.3)', opacity: 0 },
      { transform: 'translate(0, 0) scale(1.15)', opacity: 1, offset: 0.16 },
      { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0.26 },
      { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0.8 },
      { transform: 'translate(0, -10px) scale(0.95)', opacity: 0 },
    ], 1000, 'ease-out');
  }

  // Glowing frame flaring around the wheel window
  function frame(win, color, ms = 650) {
    if (!win) return;
    const [x, y] = fxPoint(win), [w, h] = sizeOf(win, 120, 180);
    const el = fxSpawn(x, y, { cls: 'fxo-frame', ms, size: [w + 10, h + 10], vars: { '--c': color } });
    fxAnimate(el, [
      { transform: 'scale(1.18)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.18 },
      { transform: 'scale(1.02)', opacity: 0.8, offset: 0.5 },
      { transform: 'scale(1.08)', opacity: 0 },
    ], ms, 'ease-out');
  }

  // The card's art leaps out of the wheel and fades (drawn big and scaled down so it stays crisp)
  function artPop(x, y, art, color, ms = 560) {
    const el = fxSpawn(x, y, { cls: 'fxo-art', html: art, ms: ms + 40, vars: { '--c': color } });
    fxAnimate(el, [
      { transform: 'translate(0, 0) scale(0.2)', opacity: 1 },
      { transform: 'translate(0, -16px) scale(0.75)', opacity: 0.9, offset: 0.35 },
      { transform: 'translate(0, -30px) scale(1)', opacity: 0 },
    ], ms, 'ease-out');
  }

  // A shine sweeping across the landed card, like light catching a blade
  function glint(el) {
    if (!el) return;
    const [x, y] = fxPoint(el), [w, h] = sizeOf(el, 58, 80);
    const g = fxSpawn(x, y, { cls: 'fxo-glint', ms: 540, size: [14, h * 1.25] });
    fxAnimate(g, [
      { transform: `translate(${-w * 0.7}px, 0) rotate(20deg)`, opacity: 0 },
      { transform: 'translate(0, 0) rotate(20deg)', opacity: 1, offset: 0.5 },
      { transform: `translate(${w * 0.7}px, 0) rotate(20deg)`, opacity: 0 },
    ], 500, 'ease-in-out');
  }

  // Anime speed lines bursting out of a point
  function speedLines(x, y, { n = 8, r0 = 40, r1 = 110, cls = 'fxo-line', ms = 380, width = 4 } = {}) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + fxRand(-0.2, 0.2), c = Math.cos(a), s = Math.sin(a), r = r1 * fxRand(0.8, 1.15);
      fxBeam([x + c * r0, y + s * r0], [x + c * r, y + s * r], { cls, ms, width });
    }
  }

  // Hot steel sparks spraying out where a blade bites
  const sparks = (x, y, count, spread, extra = {}) => fxParticles(x, y, { count, colors: ['#fff', '#ffe082', '#ffb300', '#fff3c4'],
    size: [3, 7], spread, gravity: 50, ms: 560, ...extra });

  // One blade slash across (x, y) at `deg`, `len` px long
  function slash(x, y, deg, len, width = 12) {
    const a = deg * Math.PI / 180, dx = Math.cos(a) * len / 2, dy = Math.sin(a) * len / 2;
    fxBeam([x - dx, y - dy], [x + dx, y + dy], { cls: 'fxo-slash', ms: 380, width });
  }

  // Cracks snapping outward from a point, like the floor (or a shield) breaking
  function crackBurst(x, y, size, kind = 'bone', rot = 0, ms = 800) {
    const el = fxSpawn(x, y, { cls: 'fxo-svg', html: CRACK[kind], ms, size: [size, size] });
    fxAnimate(el, [
      { transform: `scale(0.2) rotate(${rot}deg)`, opacity: 1 },
      { transform: `scale(1.05) rotate(${rot}deg)`, opacity: 1, offset: 0.18 },
      { transform: `scale(1) rotate(${rot}deg)`, opacity: 1, offset: 0.6 },
      { transform: `scale(1.02) rotate(${rot}deg)`, opacity: 0 },
    ], ms, 'ease-out');
  }

  // Bright flash ball at the heart of an impact
  function core(x, y, size, cls, ms = 380) {
    const el = fxSpawn(x, y, { cls, ms, size: [size, size] });
    fxAnimate(el, [
      { transform: 'scale(0.2)', opacity: 1 },
      { transform: 'scale(1)', opacity: 0.95, offset: 0.35 },
      { transform: 'scale(1.5)', opacity: 0 },
    ], ms, 'ease-out');
  }

  // Full-screen wash that fades IN then out (fxTint only fades out)
  function dim(bg, peak, ms) {
    const el = fxSpawn(0, 0, { cls: 'fx-tint', ms, style: { background: bg } });
    el?.animate([{ opacity: 0 }, { opacity: peak, offset: 0.75 }, { opacity: 0 }], { duration: ms, easing: 'ease-in', fill: 'forwards' });
  }

  // Steam puffs curling upward
  function steam(x, y, n = 3, ms = 800, cls = 'fxo-steam') {
    for (let i = 0; i < n; i++) {
      const el = fxSpawn(x + (i - (n - 1) / 2) * 22, y, { cls, ms });
      fxAnimate(el, [
        { transform: 'translate(0, 0) scale(0.4)', opacity: 0 },
        { transform: `translate(${fxRand(-6, 6)}px, -20px) scale(0.9)`, opacity: 0.8, offset: 0.3 },
        { transform: `translate(${fxRand(-14, 14)}px, -60px) scale(1.6)`, opacity: 0 },
      ], ms * fxRand(0.8, 1), 'ease-out');
    }
  }

  // ---------- Cleaver pieces ----------
  // Lock-on reticle that shrinks onto the victim before the big chop
  function reticle(x, y, ms = 420) {
    const el = fxSpawn(x, y, { cls: 'fxo-svg fxo-reticle', html: RETICLE, ms, size: [120, 120] });
    fxAnimate(el, [
      { transform: 'scale(2.2) rotate(-120deg)', opacity: 0 },
      { transform: 'scale(1) rotate(0deg)', opacity: 1, offset: 0.45 },
      { transform: 'scale(0.92) rotate(10deg)', opacity: 1, offset: 0.85 },
      { transform: 'scale(0.5) rotate(30deg)', opacity: 0 },
    ], ms, 'ease-out');
  }
  // Motion smear left in the air as the chop comes down
  function swoosh(x, y, s = 1) {
    const el = fxSpawn(x + 30 * s, y - 36 * s, { cls: 'fxo-svg', html: SWOOSH, ms: 300, size: [150 * s, 120 * s] });
    fxAnimate(el, [
      { transform: 'scale(0.85) rotate(-10deg)', opacity: 0 },
      { transform: 'scale(1) rotate(0deg)', opacity: 0.95, offset: 0.35 },
      { transform: 'scale(1.05) rotate(6deg)', opacity: 0 },
    ], 280, 'ease-out');
  }
  // A small cleaver spiralling out around (x, y) while spinning
  function orbitBlade(x, y, a0, ms = 700) {
    const el = fxSpawn(x, y, { cls: 'fxo-cleaver', html: CLEAVER, ms: ms + 40 });
    const frames = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8, a = (a0 + t * 320) * Math.PI / 180, r = 10 + 66 * Math.sqrt(t);
      frames.push({ transform: `translate(${Math.cos(a) * r}px, ${Math.sin(a) * r}px) scale(${0.3 + 0.5 * t}) rotate(${a0 + t * 900}deg)`,
        opacity: t < 0.75 ? 1 : (1 - t) * 4 });
    }
    fxAnimate(el, frames, ms, 'linear');
  }

  // ---------- Bone / mud / bacon pieces ----------
  // A bone snapped in two: each half flies off its own way
  function boneHalves(x, y, size = 56) {
    [-1, 1].forEach(sd => {
      const el = fxSpawn(x, y, { cls: sd < 0 ? 'fxo-half-l' : 'fxo-half-r', html: '🦴', ms: 760, style: { fontSize: size + 'px' } });
      fxAnimate(el, [
        { transform: 'translate(0, 0) rotate(0deg) scale(1.2)', opacity: 1 },
        { transform: `translate(${sd * 50}px, -46px) rotate(${sd * 160}deg) scale(1.1)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${sd * 90}px, 30px) rotate(${sd * 320}deg) scale(0.8)`, opacity: 0 },
      ], 720, 'cubic-bezier(.2,.7,.5,1)');
    });
  }
  // A cheeky pig bouncing out of the card with squash and stretch
  function pigPop(x, y, art = '🐷', ms = 820) {
    const el = fxSpawn(x, y, { cls: 'fxo-critter', html: art, ms: ms + 40 });
    fxAnimate(el, [
      { transform: 'translate(0, 20px) scale(0.3, 0.3)', opacity: 0 },
      { transform: 'translate(0, -32px) scale(0.9, 1.25)', opacity: 1, offset: 0.25 },
      { transform: 'translate(0, -6px) scale(1.3, 0.8)', opacity: 1, offset: 0.45 },
      { transform: 'translate(0, -18px) scale(1, 1.05)', opacity: 1, offset: 0.62 },
      { transform: 'translate(0, -12px) scale(1.05, 0.97)', opacity: 1, offset: 0.8 },
      { transform: 'translate(0, -40px) scale(0.9, 0.9)', opacity: 0 },
    ], ms, 'ease-out');
  }
  // The hog rolling happily through its mud
  function pigRoll(x, y, ms = 700) {
    const el = fxSpawn(x, y, { cls: 'fxo-critter', html: '🐖', ms: ms + 40, style: { fontSize: '40px' } });
    fxAnimate(el, [
      { transform: 'translate(-50px, 0) scale(0.5) rotate(0deg)', opacity: 0 },
      { transform: 'translate(-25px, -12px) scale(1.1) rotate(180deg)', opacity: 1, offset: 0.3 },
      { transform: 'translate(15px, -4px) scale(1.15) rotate(400deg)', opacity: 1, offset: 0.65 },
      { transform: 'translate(45px, -20px) scale(0.8) rotate(540deg)', opacity: 0 },
    ], ms, 'ease-out');
  }
  // Mud dripping down over a wheel
  function drip(x, y, fall, ms = 850) {
    const el = fxSpawn(x, y, { cls: 'fxo-drip', ms: ms + 40, size: [11, 20] });
    fxAnimate(el, [
      { transform: 'translate(0, 0) scale(1, 0.4)', opacity: 0 },
      { transform: 'translate(0, 4px) scale(1, 1)', opacity: 1, offset: 0.2 },
      { transform: `translate(0, ${fall}px) scale(0.8, 1.6)`, opacity: 1, offset: 0.85 },
      { transform: `translate(0, ${fall * 1.1}px) scale(0.6, 1.8)`, opacity: 0 },
    ], ms, 'ease-in');
  }
  // A mud puddle spreading out, then soaking away
  function puddle(x, y, w, h, ms = 850) {
    const el = fxSpawn(x, y, { cls: 'fxo-puddle', ms, size: [w, h] });
    fxAnimate(el, [
      { transform: 'scale(0.2, 0.2)', opacity: 0 },
      { transform: 'scale(1.1, 1)', opacity: 1, offset: 0.25 },
      { transform: 'scale(1, 1)', opacity: 1, offset: 0.7 },
      { transform: 'scale(1.15, 0.8)', opacity: 0 },
    ], ms, 'ease-out');
  }
  // Mud armor: a thick shell slaps shut around the box, with clods splatting onto its rim
  function mudShell(x, y, w, h, ms = 620) {
    const el = fxSpawn(x, y, { cls: 'fxo-mudshell', ms, size: [w, h] });
    fxAnimate(el, [
      { transform: 'scale(1.35)', opacity: 0 },
      { transform: 'scale(0.94)', opacity: 1, offset: 0.25 },
      { transform: 'scale(1.03)', opacity: 1, offset: 0.4 },
      { transform: 'scale(1)', opacity: 1, offset: 0.75 },
      { transform: 'scale(1.08)', opacity: 0 },
    ], ms, 'ease-out');
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      later(60 + i * 30, () => fxPop(x + Math.cos(a) * w * 0.5, y + Math.sin(a) * h * 0.5, BLOB(), { size: 22, ms: 480, rise: -6 }));
    }
  }
  // Rashers of bacon wiggling in the pan
  function baconWiggle(x, y, ms = 800) {
    const el = fxSpawn(x, y, { cls: 'fxo-critter', html: '🥓', ms: ms + 40, style: { fontSize: '46px' } });
    fxAnimate(el, [
      { transform: 'translate(0, 10px) scale(0.4) rotate(0deg)', opacity: 0 },
      { transform: 'translate(0, -18px) scale(1.3) rotate(-14deg)', opacity: 1, offset: 0.2 },
      { transform: 'translate(0, -22px) scale(1.25) rotate(12deg)', opacity: 1, offset: 0.36 },
      { transform: 'translate(0, -24px) scale(1.3) rotate(-10deg)', opacity: 1, offset: 0.52 },
      { transform: 'translate(0, -26px) scale(1.25) rotate(8deg)', opacity: 1, offset: 0.68 },
      { transform: 'translate(0, -44px) scale(1) rotate(0deg)', opacity: 0 },
    ], ms, 'ease-out');
  }

  // Where impact stamps go: just under the victim's HP box, clear of the battle's own damage numbers
  const stampPoint = (ctx, dx = 0) => {
    const [x, y] = at(ctx), [, h] = sizeOf(ctx.to, 200, 46);
    return [x + dx, y + h * 0.5 + 16];
  };

  // ================= Cleaver Chop (x6): the hog's giant cleaver comes down =================
  CARD_FX['cleaver-chop'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = fxPoint(ctx.slot || ctx.win), [w, h] = sizeOf(ctx.win, 130, 180);
      fxTint(VIG_RED, { ms: 800, opacity: 0.6 });
      frame(ctx.win, '#ff1f3d', 800);
      artPop(x, y, '🔪', '#ff1f3d');
      glint(ctx.slot);
      speedLines(x, y, { n: 10, r0: 46, r1: 130, cls: 'fxo-line-red' });
      sparks(x, y, 10, 90, { angle: -90, cone: 160 });
      // Red/black danger tape slapped across the top of the reel
      const tape = fxSpawn(x, y - h * 0.28, { cls: 'fxo-tape', html: '<span>⚠ DANGER ⚠</span>', ms: 950, size: [w * 1.35, 28] });
      fxAnimate(tape, [
        { transform: 'translate(0, 0) rotate(-10deg) scaleX(0.1)', opacity: 0 },
        { transform: 'translate(0, 0) rotate(-10deg) scaleX(1.08)', opacity: 1, offset: 0.18 },
        { transform: 'translate(0, 0) rotate(-10deg) scaleX(1)', opacity: 1, offset: 0.3 },
        { transform: 'translate(0, 0) rotate(-10deg) scaleX(1)', opacity: 1, offset: 0.8 },
        { transform: 'translate(0, 10px) rotate(-14deg) scaleX(1)', opacity: 0 },
      ], 950, 'ease-out');
      plate(ctx, '🔪 CLEAVER CHOP', '#ff1f3d');
      fxShake(ctx.panel, 6, 260);
    },
    // The cleaver rockets out of the wheel spinning, hangs raised over the victim, then comes down
    windup(ctx) {
      const [tx, ty] = at(ctx), from = launchPoint(ctx), s = ctx.crit ? 1.25 : 1;
      const W = 160, H = 80; // .fxo-huge size; the handle (swing pivot) sits 32% of W right of centre
      reticle(tx, ty, 420);
      dim(VIG_DARK, ctx.crit ? 0.75 : 0.55, 440);
      const el = fxSpawn(from[0], from[1], { cls: 'fxo-cleaver fxo-huge', html: CLEAVER, ms: 1120, style: { transformOrigin: '82% 50%' } });
      if (!el) return;
      // Place the handle at (hx, hy): the blade swings around it
      const d = (hx, hy) => `translate(${hx - from[0] - W * 0.32}px, ${hy - from[1]}px)`;
      const raise = [tx + W * 0.45, Math.max(70, ty - 115)];
      const bite = [tx + W * 0.45 * s, ty - H * 0.25 * s];
      later(200, () => sfx('saw', 2.4, 0.22));  // "shing" as the blade is raised
      later(270, () => swoosh(tx, ty, s));
      // (per-keyframe easings: fast rise, a held beat at the top, then an accelerating chop)
      const chop = fxAnimate(el, [
        { transform: `${d(from[0] + W * 0.32, from[1])} rotate(0deg) scale(0.35)`, opacity: 0.5, easing: 'ease-out' },
        { transform: `${d(...raise)} rotate(400deg) scale(${s})`, opacity: 1, offset: 0.5, easing: 'ease-in-out' },
        { transform: `${d(raise[0], raise[1] - 12)} rotate(415deg) scale(${s * 1.05})`, opacity: 1, offset: 0.7, easing: 'cubic-bezier(.7,0,1,.5)' },
        { transform: `${d(...bite)} rotate(348deg) scale(${s * 1.1})`, opacity: 1 },
      ], 400, 'linear');
      // Stuck fast: the cleaver quivers in the target, then yanks free and fades.
      // Not part of the returned promise, so the hit lands the moment the blade does.
      chop.then(() => {
        const k = `scale(${s * 1.1})`;
        fxAnimate(el, [
          { transform: `${d(...bite)} rotate(348deg) ${k}`, opacity: 1 },
          { transform: `${d(...bite)} rotate(354deg) ${k}`, opacity: 1, offset: 0.1 },
          { transform: `${d(...bite)} rotate(344deg) ${k}`, opacity: 1, offset: 0.22 },
          { transform: `${d(...bite)} rotate(351deg) ${k}`, opacity: 1, offset: 0.34 },
          { transform: `${d(...bite)} rotate(348deg) ${k}`, opacity: 1, offset: 0.55 },
          { transform: `${d(bite[0], bite[1] - 34)} rotate(330deg) scale(${s})`, opacity: 0 },
        ], 620, 'ease-out');
      }).catch(() => {});
      return chop;
    },
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit;
      fxTint('#9a0012', { ms: 420, opacity: crit ? 0.5 : 0.36 });
      core(tx, ty, 150 * p, 'fxo-core');
      slash(tx + 6, ty, 78, 190 * p, 16 * Math.min(1.5, p)); // the chop itself: nearly vertical
      if (crit) later(60, () => slash(tx, ty, -12, 230 * p, 11)); // a crit cuts across too
      fxRing(tx, ty, { color: '#fff', size: 150 * p, width: 6, ms: 360 });
      fxRing(tx, ty, { color: '#ff1f3d', size: 230 * p, width: 10, ms: 480 });
      later(110, () => fxRing(tx, ty, { color: '#cfd8dc', size: 320 * p, width: 3, ms: 560 }));
      sparks(tx, ty, 16, 170 * p, { gravity: 90 });
      // Wood chips off the chopping block
      fxParticles(tx, ty + 10, { count: 8, cls: 'fxo-chip', colors: ['#8b5a2b', '#a86b35', '#5d3a1a'], size: [6, 11],
        spread: 140 * p, gravity: 120, angle: -90, cone: 200, ms: 700, spin: 720 });
      crackBurst(tx, ty + 6, 170 * p, 'steel', fxRand(-20, 20), 900);
      const [sx, sy] = stampPoint(ctx, -8);
      slam(sx, sy, crit ? 'MEGA CHOP!!' : 'CHOP!', { kind: 'fxo-steel', size: crit ? 50 : Math.min(66, 36 + 14 * p), rotate: -8, ms: 900 });
      fxShake(ctx.panel, Math.min(26, 14 * p), 460);
      fxShake(ctx.to, 12, 360);
      later(50, () => sfx('hit', 0.55, 0.9)); // deep butcher-block thunk under the battle's own hit
      haptic(60);
    },
  };

  // ================= Bone Splitter (x3, cleave): smashes every shield, then cracks the victim =================
  CARD_FX['bone-splitter'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = fxPoint(ctx.slot || ctx.win);
      frame(ctx.win, '#ff4f8b', 700);
      artPop(x, y, '🦴', '#ff4f8b');
      crackBurst(x, y, 130, 'bone', fxRand(0, 60), 700);
      // A ring of little bones bursts out of the card
      fxParticles(x, y, { count: 6, html: '🦴', colors: ['#fff6e0'], size: [9, 13], spread: 110, ms: 700, spin: 720, gravity: 40 });
      fxParticles(x, y, { count: 6, colors: ['#fff6e0', '#ffb3c8', '#fff'], size: [3, 6], spread: 90, ms: 500 });
      fxRing(x, y, { color: '#fff6e0', size: 150, width: 5, ms: 420 });
      plate(ctx, '🦴 BONE SPLITTER', '#ff4f8b');
      fxShake(ctx.panel, 5, 220);
    },
    // The bone whirls out of the wheel like a boomerang, trailing bone dust
    windup(ctx) {
      const [tx, ty] = at(ctx), from = launchPoint(ctx);
      return fxFly(from, [tx, ty], { html: '🦴', cls: 'fxo-bone-fly', ms: 340, arc: -70, spin: 1080,
        scale: [0.6, ctx.crit ? 1.9 : 1.6], trail: 'fxo-trail-bone', trailEvery: 32, easing: 'cubic-bezier(.45,0,.9,.6)' });
    },
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx);
      crackBurst(tx, ty, 150 * p, 'bone', fxRand(-30, 30), 850);
      boneHalves(tx, ty, 54 * Math.min(1.4, p));
      fxParticles(tx, ty, { count: 12, html: () => '<i class="fxo-splinter"></i>', colors: ['#fff6e0'], spread: 140 * p,
        size: [8, 14], gravity: 70, ms: 650 });
      fxParticles(tx, ty, { count: 8, colors: ['#fff6e0', '#ffb3c8', '#fff'], spread: 110 * p, size: [4, 8], ms: 500 });
      fxRing(tx, ty, { color: '#fff6e0', size: 180 * p, width: 8, ms: 450 });
      later(80, () => fxRing(tx, ty, { color: '#ff4f8b', size: 240 * p, width: 4, ms: 500 }));
      if (ctx.big) speedLines(tx, ty, { n: 8, r0: 50, r1: 150, cls: 'fxo-line' });
      const [sx, sy] = stampPoint(ctx, 6);
      slam(sx, sy, ctx.crit ? 'BONE BREAKER!' : 'CRACK!', { kind: 'fxo-bone', size: ctx.crit ? 40 : Math.min(60, 38 * p), rotate: 7 });
      fxTint('#ff4f8b', { ms: 300, opacity: 0.18 });
      fxShake(ctx.panel, Math.min(22, 12 * p), 380);
      fxShake(ctx.to, 10, 300);
      sfx('blocked', 0.55, 0.6); // bony clack under the hit
    },
  };

  // Cleave (fires just before Bone Splitter's hit): a bone-white crack shoots at the victim; if it had
  // shields, they form a glass bubble that cracks and shatters into shards
  GIMMICK_FX.cleave = ctx => {
    const [tx, ty] = at(ctx), from = launchPoint(ctx), [w, h] = sizeOf(ctx.to, 200, 46);
    fxBeam(from, [tx, ty], { cls: 'fxo-crackbeam', ms: 300, width: 9 });
    if (!ctx.blocked) { later(100, () => fxRing(tx, ty, { color: '#fff6e0', size: 130, width: 4, ms: 350 })); return; }
    const bub = fxSpawn(tx, ty, { cls: 'fxo-bubble', ms: 240, size: [w + 30, h + 44] });
    fxAnimate(bub, [
      { transform: 'translate(0, 0) scale(0.85)', opacity: 0 },
      { transform: 'translate(0, 0) scale(1.04)', opacity: 1, offset: 0.3 },
      { transform: 'translate(4px, 0) scale(1)', opacity: 1, offset: 0.55 },
      { transform: 'translate(-4px, 0) scale(1)', opacity: 1, offset: 0.8 },
      { transform: 'translate(0, 0) scale(1.08)', opacity: 0.6 },
    ], 220, 'linear');
    later(90, () => crackBurst(tx, ty, Math.min(170, w), 'ice', 0, 260));
    later(200, () => {
      fxParticles(tx, ty, { count: 16, cls: 'fxo-shard', colors: ['#bcd8ff', '#6aa8ff', '#e3f2ff', '#fff'], spread: 160,
        size: [9, 18], gravity: 90, ms: 700, spin: 540 });
      fxRing(tx, ty, { color: '#bcd8ff', size: 230, width: 6, ms: 420 });
      const [sx, sy] = stampPoint(ctx, -20);
      slam(sx, sy + 34, 'SMASHED!', { kind: 'fxo-ice', size: 30, rotate: -5, ms: 700 });
      fxTint('#6aa8ff', { ms: 280, opacity: 0.22 });
      fxShake(ctx.panel, 10, 300);
      sfx('blocked', 0.45, 0.8); // glassy crunch
    });
  };

  // ================= Cleaver Flurry (x2, frenzy: 3 strikes): a whirlwind of cleavers =================
  CARD_FX['cleaver-flurry'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = fxPoint(ctx.slot || ctx.win);
      frame(ctx.win, '#cfd8dc', 750);
      glint(ctx.slot);
      // Three cleavers whirl out of the card in a spinning ring
      for (let i = 0; i < 3; i++) orbitBlade(x, y, i * 120, 700);
      speedLines(x, y, { n: 8, r0: 40, r1: 115 });
      sparks(x, y, 10, 100);
      later(120, () => slam(x, y - 18, '×3', { kind: 'fxo-steel', size: 46, rotate: -8, ms: 700 }));
      plate(ctx, '🔪 CLEAVER FLURRY', '#ff1f3d');
    },
    // Each strike throws one more cleaver than the last: the first straight out of the wheel,
    // the rest hurled by the hog itself, on crossing arcs
    windup(ctx) {
      const s = clamp(ctx.strike || 0, 0, 2), [tx, ty] = at(ctx), dir = s % 2 ? -1 : 1;
      const ms = [300, 260, 230][s], flights = [];
      for (let i = 0; i <= s; i++) {
        const from = i === 0 ? launchPoint(ctx) : [src(ctx)[0] + fxRand(-30, 30), src(ctx)[1] + fxRand(-10, 10)];
        flights.push(fxFly(from, [tx + fxRand(-14, 14), ty + fxRand(-10, 10)], {
          html: CLEAVER, cls: 'fxo-cleaver', ms: ms + i * 30, arc: dir * (i % 2 ? -1 : 1) * (50 + 40 * i),
          spin: dir * (720 + 180 * s), scale: [0.5, 1 + s * 0.2], trail: i === 0 ? 'fxo-trail-steel' : '', trailEvery: 28,
          easing: 'cubic-bezier(.4,0,.9,.7)' }));
      }
      if (s === 2) dim(VIG_RED, 0.7, 300); // the finisher: the screen bleeds red
      return Promise.all(flights);
    },
    // Slashes pile up strike by strike: /  then X  then *  with a huge FLURRY!!! finisher
    impact(ctx) {
      const s = clamp(ctx.strike || 0, 0, 2), [tx, ty] = at(ctx), p = pow(ctx) + s * 0.25;
      [[-35], [-35, 35], [-35, 35, 90]][s].forEach((a, i) =>
        later(i * 50, () => slash(tx, ty, a + fxRand(-8, 8), 150 * p, 10 + 3 * s)));
      sparks(tx, ty, 10 + s * 6, 120 * p);
      for (let i = 0; i <= s; i++) later(i * 70, () => fxRing(tx, ty, { color: i % 2 ? '#fff' : '#ff1f3d', size: 140 + 50 * i + 30 * s, ms: 420, width: 6 }));
      const [sx, sy] = stampPoint(ctx, (s - 1) * 26);
      slam(sx, sy, ['HACK!', 'SLASH!!', 'FLURRY!!!'][s], { kind: s === 2 ? 'fxo-rage' : 'fxo-steel',
        size: 32 + s * 12 + (ctx.crit ? 10 : 0), rotate: [-10, 8, -4][s], ms: 650 + s * 150 });
      fxShake(ctx.panel, 7 + s * 6, 260 + s * 60);
      fxShake(ctx.to, 6 + s * 3, 250);
      if (s === 2) {
        crackBurst(tx, ty, 190, 'steel', fxRand(-30, 30), 850);
        speedLines(tx, ty, { n: 10, r0: 60, r1: 170, cls: 'fxo-line-red', width: 5 });
        fxTint('#8a0010', { ms: 400, opacity: 0.38 });
        haptic(70);
      }
    },
  };

  // Frenzy (fires before the flurry): the hog boils over with rage
  GIMMICK_FX.frenzy = ctx => {
    const [x, y] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46);
    fxTint(VIG_RED, { ms: 900, opacity: 0.7 });
    const aura = fxSpawn(x, y, { cls: 'fxo-rage-aura', ms: 1050, size: [w * 1.5, h * 3.2] });
    fxAnimate(aura, [
      { transform: 'scale(0.6)', opacity: 0 },
      { transform: 'scale(1.05)', opacity: 1, offset: 0.2 },
      { transform: 'scale(0.92)', opacity: 0.8, offset: 0.4 },
      { transform: 'scale(1.1)', opacity: 1, offset: 0.6 },
      { transform: 'scale(0.95)', opacity: 0.7, offset: 0.8 },
      { transform: 'scale(1.25)', opacity: 0 },
    ], 1000, 'ease-in-out');
    for (let i = 0; i < 3; i++) later(i * 160, () => fxRing(x, y, { color: i % 2 ? '#1a0000' : '#ff1f3d', size: w * 1.2 + i * 40, width: 7 - i, ms: 500 }));
    // Anger marks pop all around the box
    for (let i = 0; i < 5; i++) later(60 + i * 110, () => fxPop(x + fxRand(-w * 0.5, w * 0.5), y + fxRand(-h * 0.9, -h * 0.2), '💢',
      { size: fxRand(24, 34), ms: 500, rise: 8, rotate: fxRand(-25, 25) }));
    // Red steam blasts out of both sides
    [-1, 1].forEach(sd => fxFly([x + sd * w * 0.3, y], [x + sd * (w * 0.5 + 60), y - 30], { cls: 'fxo-steam fxo-red', ms: 450, scale: [0.5, 1.6], easing: 'ease-out' }));
    fxParticles(x, y, { count: 12, colors: ['#ff1f3d', '#ff5d5d', '#1a0000'], size: [4, 8], spread: 80, gravity: -110, angle: -90, cone: 200, ms: 800 });
    slam(x, y + h * 0.5 + 16, 'FRENZY!', { kind: 'fxo-rage', size: 38, rotate: -6, ms: 850 });
    fxShake(ctx.from, 8, 400);
    fxShake(ctx.panel, 8, 300);
    sfx('big_hit', 0.5, 0.45); // a low growl
    haptic(40);
  };

  // ================= Mud Wallow (wallow): the hog rolls in mud to heal and armor up =================
  CARD_FX['mud-wallow'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = fxPoint(ctx.slot || ctx.win), [w, h] = sizeOf(ctx.win, 130, 180);
      frame(ctx.win, '#8d5a2b', 700);
      puddle(x, y + h * 0.28, w * 1.1, 40, 800);
      // Mud explodes up out of the card and rains back down
      fxParticles(x, y, { count: 14, html: BLOB, colors: ['#6d4523'], size: [8, 14], spread: 120, gravity: 110, angle: -90, cone: 220, ms: 750, spin: 180 });
      pigPop(x, y);
      // Mud oozes down over the reel
      for (let i = 0; i < 4; i++) later(40 + i * 60, () => drip(x + (i - 1.5) * w * 0.22, y - h * 0.32, h * 0.45 * fxRand(0.8, 1.1)));
      later(80, () => slam(x, y - 26, 'SPLOSH!', { kind: 'fxo-mud', size: 32, rotate: 6, ms: 750 }));
      plate(ctx, '🐖 MUD WALLOW', '#8d5a2b');
      sfx('leech', 0.7, 0.5); // wet splat
    },
  };

  // Wallow: mud flings from the wheel onto the hog, it rolls in the puddle, heals, and the mud hardens into armor
  GIMMICK_FX.wallow = ctx => {
    const [hx, hy] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46);
    const l = lastLand, start = l?.slug === 'mud-wallow' && l.el?.isConnected ? fxPoint(l.el) : ctx.win ? fxPoint(ctx.win) : [hx, hy + 120];
    for (let i = 0; i < 5; i++) later(i * 40, () => fxFly(start, [hx + fxRand(-w * 0.35, w * 0.35), hy + fxRand(-8, 8)],
      { html: BLOB(), cls: 'fxo-mudfly', ms: 280, arc: fxRand(-90, 90), spin: fxRand(-360, 360), scale: [0.6, 1.3], easing: 'ease-in' }));
    later(290, () => {
      puddle(hx, hy + h * 0.45, w * 1.1, 34, 800);
      fxParticles(hx, hy, { count: 12, html: BLOB, colors: ['#6d4523'], size: [7, 12], spread: 110, gravity: 100, angle: -90, cone: 200, ms: 700 });
      pigRoll(hx, hy);
      fxShake(ctx.from, 6, 260);
      sfx('leech', 0.6, 0.6);
    });
    // Healing pluses bubble up out of the mud
    later(420, () => fxParticles(hx, hy, { count: 9, html: '✚', colors: ['#3cdc3c', '#b6ffb6', '#7dff7d'], size: [7, 12],
      spread: 70, gravity: -80, angle: -90, cone: 140, ms: 800, spin: 0 }));
    later(520, () => {
      mudShell(hx, hy, w + 26, h + 30);
      slam(hx, hy + h * 0.5 + 16, 'MUD ARMOR!', { kind: 'fxo-mud', size: 26, rotate: -4, ms: 650 });
      sfx('shield', 0.6, 0.6); // the mud sets hard
    });
  };

  // ================= Bacon Sizzle (x2 + burn): a flaming rasher slapped onto the victim =================
  CARD_FX['bacon-sizzle'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = fxPoint(ctx.slot || ctx.win), [, h] = sizeOf(ctx.win, 130, 180);
      frame(ctx.win, '#ff6d00', 750);
      // Flames lick up from the bottom of the reel
      fxParticles(x, y + h * 0.35, { count: 7, html: '🔥', colors: ['#fff'], size: [9, 15], spread: 110, gravity: -30, angle: -90, cone: 60, ms: 750, spin: 0 });
      baconWiggle(x, y);
      // Popping grease
      fxParticles(x, y, { count: 8, colors: ['#ffd54f', '#ffb300', '#fff3c4'], size: [3, 6], spread: 100, gravity: 70, ms: 550 });
      steam(x, y - 20, 3);
      later(90, () => slam(x, y - 26, 'SIZZLE!', { kind: 'fxo-fire', size: 32, rotate: -6, ms: 750 }));
      plate(ctx, '🥓 BACON SIZZLE', '#ff6d00');
      sfx('saw', 2.1, 0.22); // crackle
    },
    // The bacon tumbles out of the wheel trailing fire
    windup(ctx) {
      const [tx, ty] = at(ctx), from = launchPoint(ctx);
      return fxFly(from, [tx, ty], { html: '🥓', cls: 'fxo-bacon-fly', ms: 340, arc: 60, spin: 720,
        scale: [0.6, ctx.crit ? 1.8 : 1.5], trail: 'fxo-trail-fire', trailEvery: 26, easing: 'cubic-bezier(.4,0,.9,.7)' });
    },
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx);
      fxTint('#ff6d00', { ms: 420, opacity: 0.28 });
      core(tx, ty, 170 * p, 'fxo-fireball', 460);
      fxParticles(tx, ty, { count: 10, html: '🔥', colors: ['#fff'], size: [10, 18], spread: 100 * p, gravity: -70, angle: -90, cone: 180, ms: 800, spin: 0 });
      fxParticles(tx, ty, { count: 10, colors: ['#ffd54f', '#ffb300', '#fff3c4'], size: [3, 6], spread: 140 * p, gravity: 90, ms: 600 });
      fxParticles(tx, ty, { count: 6, colors: ['#ff6d00', '#ff3d00'], size: [3, 5], spread: 80, gravity: -120, angle: -90, cone: 120, ms: 900 }); // embers
      fxParticles(tx, ty, { count: 3, html: '🥓', colors: ['#fff'], size: [8, 12], spread: 110, gravity: 60, ms: 700, spin: 540 });
      steam(tx, ty - 10, 3, 850);
      fxRing(tx, ty, { color: '#ffb300', size: 160 * p, width: 7, ms: 400 });
      later(70, () => fxRing(tx, ty, { color: '#ff3d00', size: 230 * p, width: 4, ms: 480 }));
      const [sx, sy] = stampPoint(ctx, 4);
      slam(sx, sy, ctx.crit ? 'EXTRA CRISPY!' : 'SIZZLE!', { kind: 'fxo-fire', size: ctx.crit ? 38 : Math.min(56, 30 + 12 * p), rotate: 6, ms: 850 });
      fxShake(ctx.panel, Math.min(20, 10 * p), 360);
      fxShake(ctx.to, 8, 300);
      sfx('saw', 1.9, 0.3); // sizzle
    },
  };

  // ======================================================================================================
  // EVOLVED BOSS ATTACKS: the Iron Butcher (steel & chains) and the Hog King (royal gold & crimson).
  // These use the same helpers as the Butcher Hog's cards above, with their own signature moves.
  // ======================================================================================================
  const GOLD_RAYS = 'repeating-conic-gradient(from 0deg at 50% 50%, #ffd23f55 0 8deg, #0000 8deg 22deg)';
  const VIG_GOLD = 'radial-gradient(ellipse at 50% 50%, #0000 35%, #7a4a00dd 100%)';
  const VIG_STEEL = 'radial-gradient(ellipse at 50% 50%, #0000 35%, #0a1a2add 100%)';
  // A royal crown drawn in SVG (gold with red jewels)
  const CROWN = '<svg viewBox="0 0 120 80"><path d="M8 70 L14 20 L38 44 L60 8 L82 44 L106 20 L112 70 Z" fill="#ffd23f" stroke="#6a4000" stroke-width="5" stroke-linejoin="round"/>' +
    '<rect x="8" y="62" width="104" height="12" rx="4" fill="#e0a800" stroke="#6a4000" stroke-width="4"/>' +
    '<circle cx="60" cy="40" r="7" fill="#e0162b" stroke="#6a0010" stroke-width="2"/><circle cx="32" cy="54" r="5" fill="#2a6ad1"/><circle cx="88" cy="54" r="5" fill="#2a6ad1"/>' +
    '<circle cx="60" cy="8" r="5" fill="#fff6c2"/><circle cx="14" cy="20" r="4" fill="#fff6c2"/><circle cx="106" cy="20" r="4" fill="#fff6c2"/></svg>';
  // Hook on the end of a chain
  const HOOK = '<svg viewBox="0 0 60 90"><rect x="26" y="0" width="8" height="30" rx="3" fill="#90a4ae" stroke="#263238" stroke-width="3"/>' +
    '<path d="M30 30 V58 Q30 80 14 76 Q2 72 6 60" fill="none" stroke="#263238" stroke-width="12" stroke-linecap="round"/>' +
    '<path d="M30 30 V58 Q30 80 14 76 Q2 72 6 60" fill="none" stroke="#cfd8dc" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="M6 60 L0 52 L12 54 Z" fill="#cfd8dc" stroke="#263238" stroke-width="2"/></svg>';
  // Steel sparks in cold blue-white for the Iron Butcher
  const ironSparks = (x, y, count, spread, extra = {}) => fxParticles(x, y, { count, colors: ['#fff', '#cfe8ff', '#7ab8ff', '#ffe082'],
    size: [3, 7], spread, gravity: 60, ms: 600, ...extra });
  const goldBurst = (x, y, count, spread, extra = {}) => fxParticles(x, y, { count, colors: ['#ffd23f', '#fff6c2', '#e0a800', '#fff'],
    html: i => i % 3 ? null : '✦', size: [4, 9], spread, gravity: 40, ms: 800, ...extra });
  // Chain links trailing behind a flying hook: a chain of small beams
  function chainBetween(a, b, ms = 420) {
    const n = 9;
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 0.7) / n;
      fxBeam([a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0], [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1],
        { cls: 'fxo-chain', ms: ms + i * 12, width: 7 });
    }
  }
  // Gold sunburst rays spinning behind a point
  function royalRays(x, y, size, ms = 900) {
    const el = fxSpawn(x, y, { cls: 'fxo-rays', ms, size: [size, size], style: { background: GOLD_RAYS } });
    fxAnimate(el, [{ transform: 'scale(0.3) rotate(0deg)', opacity: 0 }, { transform: 'scale(1) rotate(40deg)', opacity: 1, offset: 0.3 },
      { transform: 'scale(1.1) rotate(110deg)', opacity: 0 }], ms, 'ease-out');
  }

  // ================= Meat Hook (x4, stun): a hook on a chain snags the victim and yanks =================
  CARD_FX['meat-hook'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = fxPoint(ctx.slot || ctx.win), [, h] = sizeOf(ctx.win, 130, 180);
      frame(ctx.win, '#7ab8ff', 800);
      fxTint(VIG_STEEL, { ms: 800, opacity: 0.55 });
      // The hook swings down into the reel on its chain, rattling
      const hook = fxSpawn(x, y - h * 0.9, { cls: 'fxo-svg fxo-hook', html: HOOK, ms: 900 });
      fxAnimate(hook, [
        { transform: 'translate(0, -40px) rotate(30deg)', opacity: 0 },
        { transform: `translate(0, ${h * 0.55}px) rotate(-22deg)`, opacity: 1, offset: 0.35 },
        { transform: `translate(0, ${h * 0.55}px) rotate(16deg)`, opacity: 1, offset: 0.55 },
        { transform: `translate(0, ${h * 0.55}px) rotate(-8deg)`, opacity: 1, offset: 0.72 },
        { transform: `translate(0, ${h * 0.4}px) rotate(0deg)`, opacity: 0 },
      ], 900, 'ease-out');
      later(300, () => { ironSparks(x, y, 10, 80); sfx('saw', 0.5, 0.35); });
      plate(ctx, '🪝 MEAT HOOK', '#7ab8ff');
    },
    // Thrown on its chain: the hook flies at the victim with chain links trailing
    windup(ctx) {
      const [tx, ty] = at(ctx), from = launchPoint(ctx);
      later(60, () => sfx('saw', 0.7, 0.4)); // chain rattle
      chainBetween(from, [tx, ty], 380);
      return fxFly(from, [tx, ty], { html: HOOK, cls: 'fxo-svg fxo-hook', ms: 300, arc: -50, spin: 200, trail: 'fxo-trail-steel', trailEvery: 30 });
    },
    // Snagged! The victim's box gets yanked toward the hog, iron sparks fly
    impact(ctx) {
      const [tx, ty] = at(ctx), [fx] = src(ctx), p = pow(ctx), dir = Math.sign(fx - tx) || 1;
      core(tx, ty, 120 * p, 'fxo-core');
      ironSparks(tx, ty, 20, 160 * p);
      crackBurst(tx, ty, 150 * p, 'ice', fxRand(-20, 20), 800);
      fxRing(tx, ty, { color: '#7ab8ff', size: 220 * p, width: 8, ms: 460 });
      try { ctx.to?.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${dir * 26}px) rotate(${dir * 3}deg)` },
        { transform: `translateX(${dir * 8}px)` }, { transform: 'translateX(0)' }], { duration: 420, easing: 'cubic-bezier(.2,1.6,.4,1)' }); } catch (e) {}
      const [sx, sy] = stampPoint(ctx);
      slam(sx, sy, 'HOOKED!', { kind: 'fxo-steel', size: Math.min(60, 34 + 12 * p), rotate: -6 });
      fxShake(ctx.panel, 10 * p, 380);
      haptic(50);
    },
  };

  // ================= Iron Cleaver (x7, cleave): TWO iron cleavers cross-chop in an X =================
  CARD_FX['iron-cleaver'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = fxPoint(ctx.slot || ctx.win);
      fxTint(VIG_STEEL, { ms: 900, opacity: 0.65 });
      frame(ctx.win, '#cfe8ff', 850);
      // Two cleavers spin up out of the card and cross
      orbitBlade(x, y, 0, 760); orbitBlade(x, y, 180, 760);
      glint(ctx.slot);
      speedLines(x, y, { n: 12, r0: 46, r1: 140, cls: 'fxo-line' });
      later(200, () => { ironSparks(x, y, 14, 100, { angle: -90, cone: 180 }); sfx('saw', 2.2, 0.25); });
      plate(ctx, '⚔️ IRON CLEAVER', '#cfe8ff');
      fxShake(ctx.panel, 8, 300);
    },
    // Both blades rise over the victim, hang, then scissor down across each other
    windup(ctx) {
      const [tx, ty] = at(ctx), from = launchPoint(ctx), s = ctx.crit ? 1.2 : 1;
      reticle(tx, ty, 460);
      dim(VIG_DARK, ctx.crit ? 0.8 : 0.6, 480);
      later(220, () => sfx('saw', 2.6, 0.25));
      const blades = [-1, 1].map(side => {
        const el = fxSpawn(from[0], from[1], { cls: 'fxo-cleaver fxo-huge', html: CLEAVER, ms: 760 });
        const raise = [tx + side * 90, Math.max(60, ty - 130)];
        return fxAnimate(el, [
          { transform: `translate(0, 0) rotate(0deg) scale(0.35) ${side < 0 ? 'scaleX(-1)' : ''}`, opacity: 0.5 },
          { transform: `translate(${raise[0] - from[0]}px, ${raise[1] - from[1]}px) rotate(${side * 300}deg) scale(${s}) ${side < 0 ? 'scaleX(-1)' : ''}`, opacity: 1, offset: 0.55 },
          { transform: `translate(${raise[0] - from[0]}px, ${raise[1] - from[1] - 10}px) rotate(${side * 320}deg) scale(${s}) ${side < 0 ? 'scaleX(-1)' : ''}`, opacity: 1, offset: 0.75 },
          { transform: `translate(${tx - side * 40 - from[0]}px, ${ty - from[1]}px) rotate(${side * 390}deg) scale(${s * 1.1}) ${side < 0 ? 'scaleX(-1)' : ''}`, opacity: 1 },
        ], 440, 'cubic-bezier(.6,0,.9,.6)').then(() => el?.animate?.([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }));
      });
      return Promise.race(blades);
    },
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit;
      fxTint('#0a2a5a', { ms: 420, opacity: crit ? 0.5 : 0.35 });
      core(tx, ty, 170 * p, 'fxo-core');
      slash(tx, ty, 45, 230 * p, 16); slash(tx, ty, -45, 230 * p, 16); // the X
      fxRing(tx, ty, { color: '#fff', size: 170 * p, width: 6, ms: 360 });
      fxRing(tx, ty, { color: '#7ab8ff', size: 260 * p, width: 10, ms: 500 });
      later(120, () => fxRing(tx, ty, { color: '#cfd8dc', size: 360 * p, width: 3, ms: 600 }));
      ironSparks(tx, ty, 26, 200 * p, { gravity: 110 });
      crackBurst(tx, ty, 200 * p, 'steel', 45, 950);
      const [sx, sy] = stampPoint(ctx);
      slam(sx, sy, crit ? 'IRON EXECUTION!!' : 'IRON CLEAVE!', { kind: 'fxo-steel', size: crit ? 46 : Math.min(62, 36 + 12 * p), rotate: -7, ms: 950 });
      fxShake(ctx.panel, Math.min(28, 16 * p), 500); fxShake(ctx.to, 14, 380);
      haptic(80);
    },
  };

  // ================= Royal Slam (x8, cleave): the Hog King leaps into the sky and crashes down crown-first =================
  CARD_FX['royal-slam'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = fxPoint(ctx.slot || ctx.win);
      fxTint(VIG_GOLD, { ms: 1000, opacity: 0.6 });
      frame(ctx.win, '#ffd23f', 900);
      royalRays(x, y, 260, 1000);
      // A crown drops onto the card, bounces and gleams
      const c = fxSpawn(x, y - 90, { cls: 'fxo-svg fxo-crown', html: CROWN, ms: 950 });
      fxAnimate(c, [
        { transform: 'translate(0, -40px) scale(0.6) rotate(-20deg)', opacity: 0 },
        { transform: 'translate(0, 70px) scale(1.1, 0.85) rotate(0deg)', opacity: 1, offset: 0.35 },
        { transform: 'translate(0, 50px) scale(0.95, 1.08)', opacity: 1, offset: 0.5 },
        { transform: 'translate(0, 62px) scale(1)', opacity: 1, offset: 0.8 },
        { transform: 'translate(0, 40px) scale(0.9)', opacity: 0 },
      ], 950, 'ease-out');
      later(330, () => { goldBurst(x, y, 16, 110); sfx('coin', 0.7, 0.8); });
      plate(ctx, '👑 ROYAL SLAM', '#ffd23f');
      fxShake(ctx.panel, 8, 300);
    },
    // A growing shadow marks the landing spot while the king falls out of the sky
    windup(ctx) {
      const [tx, ty] = at(ctx);
      dim(VIG_DARK, ctx.crit ? 0.8 : 0.6, 440);
      const shadow = fxSpawn(tx, ty + 14, { cls: 'fxo-shadow', ms: 480, size: [180, 44] });
      fxAnimate(shadow, [{ transform: 'scale(0.2)', opacity: 0.2 }, { transform: 'scale(1.2)', opacity: 0.9 }], 420, 'ease-in');
      later(80, () => sfx('big_hit', 0.4, 0.5)); // rumble
      return fxFly([tx, -120], [tx, ty - 20], { html: '<span class="fxo-king">👑🐗</span>', cls: 'fxo-falling', ms: 400, scale: [0.6, 1.7], easing: 'cubic-bezier(.6,0,1,.6)' });
    },
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit;
      flash('#ffd23f', crit ? 0.6 : 0.45);
      royalRays(tx, ty, 480 * p, 1000);
      core(tx, ty, 200 * p, 'fxo-core');
      for (let i = 0; i < 3; i++) later(i * 90, () => fxRing(tx, ty, { color: ['#fff', '#ffd23f', '#e0162b'][i], size: (220 + i * 140) * p, width: 12 - i * 3, ms: 600 }));
      crackBurst(tx, ty + 10, 260 * p, 'bone', 0, 1000);
      goldBurst(tx, ty, 30, 240 * p, { gravity: 120 });
      fxParticles(tx, ty + 16, { count: 12, cls: 'fxo-chip', colors: ['#8b5a2b', '#5d3a1a', '#a86b35'], size: [6, 12], spread: 200 * p, gravity: 160, angle: -90, cone: 160, ms: 800, spin: 540 });
      const [sx, sy] = stampPoint(ctx);
      slam(sx, sy, crit ? 'ROYAL DECREE!!' : 'ROYAL SLAM!', { kind: 'fxo-gold', size: crit ? 48 : Math.min(64, 38 + 12 * p), rotate: -5, ms: 1000 });
      fxShake(ctx.panel, Math.min(32, 18 * p), 600); fxShake(ctx.to, 18, 480);
      haptic(120);
    },
  };

  // ================= Tusk Frenzy (x3, frenzy): the boar charges again and again, faster every strike =================
  CARD_FX['tusk-frenzy'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = fxPoint(ctx.slot || ctx.win);
      fxTint(VIG_RED, { ms: 800, opacity: 0.55 });
      frame(ctx.win, '#ff5d3a', 800);
      pigPop(x, y, '🐗');
      steam(x - 18, y - 16, 2, 700); // snorting
      later(200, () => { speedLines(x, y, { n: 10, r0: 40, r1: 120, cls: 'fxo-line-red' }); sfx('big_hit', 0.9, 0.4); });
      plate(ctx, '🐗 TUSK FRENZY', '#ff5d3a');
    },
    // Each strike the boar barrels in from alternating sides, leaving dust
    windup(ctx) {
      const [tx, ty] = at(ctx), side = (ctx.strike || 0) % 2 ? 1 : -1, n = ctx.strike || 0;
      const start = [tx + side * (innerWidth * 0.45), ty + 10];
      later(40, () => fxParticles(start[0], start[1] + 20, { count: 8, colors: ['#c9b28a', '#a8916b'], spread: 50, size: [8, 14], ms: 500, gravity: -20 }));
      return fxFly(start, [tx + side * 20, ty], { html: `<span class="fxo-boar" style="transform:scaleX(${-side})">🐗</span>`, cls: 'fxo-falling',
        ms: Math.max(200, 300 - n * 40), scale: [1, 1.4 + n * 0.15], trail: 'fxo-trail-bone', trailEvery: 28, easing: 'ease-in' });
    },
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), n = ctx.strike || 0, side = n % 2 ? 1 : -1;
      // Two tusk gouges, bigger every strike
      slash(tx - 12, ty - 8, side * 20, (150 + n * 40) * p, 10 + n * 2);
      slash(tx + 12, ty + 8, side * 20, (150 + n * 40) * p, 10 + n * 2);
      fxRing(tx, ty, { color: '#ff5d3a', size: (180 + n * 60) * p, width: 7 + n * 2 });
      fxParticles(tx, ty, { count: 12 + n * 6, colors: ['#c9b28a', '#8b5a2b', '#fff'], spread: (140 + n * 40) * p, gravity: 90, size: [5, 10] });
      const [sx, sy] = stampPoint(ctx, side * 20);
      slam(sx, sy, 'GORE' + '!'.repeat(n + 1), { kind: 'fxo-red', size: Math.min(64, 34 + n * 8 + 8 * p), rotate: side * 8, ms: 700 });
      fxShake(ctx.panel, 8 + n * 5, 320); fxShake(ctx.to, 10 + n * 3, 300);
      haptic(40 + n * 25);
    },
  };

  // ================= Royal Feast (heal + shield): a banquet rains onto the Hog King =================
  CARD_FX['royal-feast'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = fxPoint(ctx.slot || ctx.win);
      fxTint(VIG_GOLD, { ms: 900, opacity: 0.45 });
      frame(ctx.win, '#ffd23f', 800);
      royalRays(x, y, 220, 900);
      plate(ctx, '🍖 ROYAL FEAST', '#ffd23f');
      // The banquet: food falls onto the king's side
      const [fx, fy] = src(ctx), food = ['🍖', '🍗', '🍇', '🥧', '🍎', '🧀', '🍷'];
      for (let i = 0; i < 10; i++) later(150 + i * 60, () => fxFly([fx + fxRand(-90, 90), fy - 200], [fx + fxRand(-40, 40), fy + fxRand(-10, 10)],
        { html: food[i % food.length], cls: 'fxo-food', ms: 420, spin: fxRand(-360, 360), easing: 'ease-in' }));
      later(800, () => { goldBurst(fx, fy, 18, 120); sfx('heal', 0.9, 0.8); slam(fx, fy + 44, 'FEAST!', { kind: 'fxo-gold', size: 38, ms: 800 }); });
    },
  };
})();
