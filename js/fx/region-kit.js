// Card effects kit for the Ice Lake and Volcano enemies' cards (js/fx/ice-*.js and js/fx/volcano-*.js).
// It holds the shared helpers (the same toolbox the Butcher Hog's effects use in boss.js), frost and fire
// building blocks (snowflakes, icicles, ice blocks, frost cracks / flames, embers, smoke, lava, rocks),
// the themed default gimmick effects every frost and fire card builds on (freeze, frostbite, ice armor /
// daze, burn, magma armor...) and the themed battle moments: frostbite and burn ticks, frozen and dazed
// turn skips, and ice and magma shields blocking a hit (see BATTLE_FX_KIND in card-fx.js).
// Styles live in css/fx/region-kit.css (every class and keyframe is prefixed fxr-).
const RFX = (() => {
  // ---------- Small helpers ----------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pick = list => list[Math.floor(Math.random() * list.length)];
  // Run something a bit later without ever letting an error escape into the battle
  const later = (ms, fn) => setTimeout(() => { try { fn(); } catch (e) { console.warn('region fx', e); } }, ms);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const at = ctx => ctx.toXY || fxPoint(ctx.to);       // the victim's HP box centre
  const src = ctx => ctx.fromXY || fxPoint(ctx.from);  // the attacker's HP box centre
  const landXY = ctx => fxPoint(ctx.slot || ctx.win);  // the card that just landed on the wheel
  // Width/height of an element (size only; positions always go through fxPoint)
  const sizeOf = (el, dw = 120, dh = 50) => {
    const r = el?.getBoundingClientRect?.();
    return r && r.width ? [r.width, r.height] : [dw, dh];
  };
  // Hit strength: ~0.7 for a light hit up to 2.2 for a monster crit. Everything scales with it.
  const pow = ctx => clamp(0.7 + (ctx.dmg || 0) / 40 + (ctx.crit ? 0.45 : 0) + (ctx.big ? 0.15 : 0), 0.7, 2.2);
  // Direction from a to b: deltas, length, unit vector, its normal and the angle in degrees
  function dirOf(a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    return { dx, dy, len, ux: dx / len, uy: dy / len, nx: -dy / len, ny: dx / len, ang: Math.atan2(dy, dx) * 180 / Math.PI };
  }
  // Short WAAPI jolt on a battle element (HP box, card face). No fill, so it always snaps back.
  function jolt(el, frames, ms, extra = {}) {
    try { el?.animate?.(frames, { duration: ms, easing: 'ease-out', ...extra }); } catch (e) { /* visuals only */ }
  }
  // The landed card's face: animate this, never the slot itself (its transform holds its place on the wheel)
  const slotFace = ctx => ctx.slot?.querySelector?.('.card-face');
  const faceJiggle = (ctx, frames, ms = 320) => jolt(slotFace(ctx), frames, ms, { delay: 480 });
  // A fighter's HP box lurches toward (or recoils away from) a point
  function lunge(el, toward, px = 22, ms = 300) {
    if (!el || !toward) return;
    const [x, y] = fxPoint(el), d = dirOf([x, y], toward); // fx-layer points share the page's (possibly flipped) axes
    jolt(el, [{ transform: 'none' }, { transform: `translate(${d.ux * px}px, ${d.uy * px}px)`, offset: 0.35 }, { transform: 'none' }], ms);
  }
  const knock = (el, from, px = 18, ms = 360) => {
    if (!el || !from) return;
    const [x, y] = fxPoint(el);
    lunge(el, [x * 2 - from[0], y * 2 - from[1]], px, ms);
  };

  // Where the wheel last stopped on a card, so its attack launches straight out of the wheel
  let lastLand = null;
  const remember = ctx => { if (ctx.card) lastLand = { slug: fxSlug(ctx.card), el: ctx.slot || ctx.win, t: performance.now() }; };
  function launchPoint(ctx) {
    const l = lastLand;
    if (l && ctx.card && l.slug === fxSlug(ctx.card) && l.el?.isConnected && performance.now() - l.t < 3000) return fxPoint(l.el);
    return src(ctx);
  }

  // ---------- Graphics (inline SVG / emoji, no image files) ----------
  // Jagged cracks radiating from the centre: a dark outline under a light core
  const CRACK_LINES = ['0,0 -7,-13 -3,-24 -13,-44', '0,0 11,-7 21,-5 42,-19', '0,0 13,9 11,22 27,42',
    '0,0 -12,7 -25,5 -44,16', '0,0 -2,15 -11,29 -9,40', '0,0 4,-14 16,-26 22,-40'];
  const crackSvg = (core, dark) => '<svg viewBox="-50 -50 100 100">' + [[dark, 8], [core, 3.5]].map(([c, w]) =>
    `<g fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">` +
    CRACK_LINES.map(p => `<polyline points="${p}"/>`).join('') + '</g>').join('') + '</svg>';
  const CRACK = { ice: crackSvg('#ffffff', '#1f5fbf'), frost: crackSvg('#dff4ff', '#6aa8ff'), lava: crackSvg('#ffe066', '#ff3d00'),
    stone: crackSvg('#b0a090', '#2a1a14'), dark: crackSvg('#d9c2ff', '#2a0a4a') };
  // A six-armed snowflake (dark outline under a bright core so it reads on any background)
  const flakeArm = '<path d="M0 -44 V44"/><path d="M0 -30 L-11 -41 M0 -30 L11 -41 M0 30 L-11 41 M0 30 L11 41"/>' +
    '<path d="M0 -13 L-9 -22 M0 -13 L9 -22 M0 13 L-9 22 M0 13 L9 22"/>';
  const flakeSvg = (core = '#ffffff', dark = '#2a6ad1') => '<svg viewBox="-50 -50 100 100">' + [[dark, 11], [core, 5]].map(([c, w]) =>
    `<g stroke="${c}" stroke-width="${w}" stroke-linecap="round" fill="none">` +
    [0, 60, 120].map(a => `<g transform="rotate(${a})">${flakeArm}</g>`).join('') + '</g>').join('') + '</svg>';
  const FLAKE = flakeSvg();
  const FLAKE_AURORA = flakeSvg('#eafff4', '#7a3fd1');
  // An icicle pointing right (the direction it flies)
  const ICICLE = '<svg viewBox="0 0 90 30"><path d="M2 3 V27 L88 15 Z" fill="#dff4ff" stroke="#1f5fbf" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M6 8 L70 15 L8 13 Z" fill="#fff" opacity=".95"/><path d="M6 22 L50 17" stroke="#8fc8ff" stroke-width="2"/></svg>';
  // A chunky ice crystal (hexagonal prism)
  const CRYSTAL = '<svg viewBox="0 0 60 90"><path d="M30 2 L52 20 L52 66 L30 88 L8 66 L8 20 Z" fill="#bfe6ff" stroke="#1f5fbf" stroke-width="3.5" stroke-linejoin="round"/>' +
    '<path d="M30 2 L30 88 M8 20 L30 34 L52 20" fill="none" stroke="#7ab8ff" stroke-width="2.5"/><path d="M14 26 L26 36 L26 70 L14 62 Z" fill="#fff" opacity=".75"/></svg>';
  // Crescent moon and a round sun
  const MOON = '<svg viewBox="0 0 100 100"><path d="M64 8 A44 44 0 1 0 92 70 A36 36 0 1 1 64 8 Z" fill="#fff6c8" stroke="#c9a53a" stroke-width="4" stroke-linejoin="round"/>' +
    '<circle cx="38" cy="58" r="6" fill="#e8d89a"/><circle cx="52" cy="78" r="4" fill="#e8d89a"/><circle cx="28" cy="36" r="4" fill="#e8d89a"/></svg>';
  const FULL_MOON = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="#fffbe6" stroke="#d8c890" stroke-width="4"/>' +
    '<circle cx="36" cy="40" r="9" fill="#ece0b0"/><circle cx="62" cy="62" r="12" fill="#ece0b0"/><circle cx="64" cy="30" r="5" fill="#ece0b0"/><circle cx="34" cy="68" r="5" fill="#ece0b0"/></svg>';
  const SUN = '<svg viewBox="-50 -50 100 100"><g fill="#ffb300" stroke="#b34700" stroke-width="3" stroke-linejoin="round">' +
    Array.from({ length: 12 }, (_, i) => `<path transform="rotate(${i * 30})" d="M-7 -30 L0 -48 L7 -30 Z"/>`).join('') + '</g>' +
    '<circle r="28" fill="#ffd23f" stroke="#b34700" stroke-width="4"/><circle r="18" fill="#fff3a0"/></svg>';
  // A flame tongue (three layers: orange, gold, white-hot)
  const FLAME = '<svg viewBox="0 0 60 90"><path d="M30 2 C38 22 56 34 52 58 C49 78 38 88 30 88 C22 88 10 80 8 60 C6 44 18 38 20 22 C26 34 30 30 30 2Z" fill="#ff5a00" stroke="#8a1a00" stroke-width="2.5"/>' +
    '<path d="M30 30 C35 44 46 52 43 66 C41 78 35 84 30 84 C25 84 17 78 17 66 C17 56 25 52 30 30Z" fill="#ffb300"/>' +
    '<path d="M30 54 C33 62 38 66 36 74 C35 80 32 82 30 82 C27 82 24 80 24 74 C24 68 28 64 30 54Z" fill="#fff3a0"/></svg>';
  // A craggy volcanic rock with glowing seams
  const rockSvg = (fill = '#4a3a34', seam = '#ff8a1f') => '<svg viewBox="0 0 60 50"><path d="M6 30 L14 10 L32 4 L50 12 L56 30 L46 46 L20 46 Z" fill="' + fill +
    '" stroke="#1a0e0a" stroke-width="3" stroke-linejoin="round"/><path d="M18 22 L28 28 L24 38 M34 14 L38 26 L48 30" fill="none" stroke="' + seam +
    '" stroke-width="2.5" stroke-linecap="round"/><path d="M16 14 L30 8" stroke="#8a7a70" stroke-width="3" stroke-linecap="round"/></svg>';
  const ROCK = rockSvg(), OBSIDIAN = rockSvg('#1e1428', '#b07cff');
  // A spiky starburst behind big stamps
  function starSvg(fill, ink) {
    const pts = [];
    for (let i = 0; i < 28; i++) {
      const r = i % 2 ? fxRand(28, 34) : fxRand(42, 49), a = i / 28 * Math.PI * 2;
      pts.push((50 + Math.cos(a) * r).toFixed(1) + ',' + (50 + Math.sin(a) * r).toFixed(1));
    }
    return `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="${pts.join(' ')}" fill="${fill}" stroke="${ink}" stroke-width="3.5" stroke-linejoin="round"/></svg>`;
  }
  const vig = color => `radial-gradient(ellipse at 50% 50%, #0000 38%, ${color} 100%)`;
  const VIG = { frost: vig('#0d3b7add'), deep: vig('#061a3add'), aurora: vig('#2a0a5add'), fire: vig('#7a1a00dd'),
    ash: vig('#1a1410ee'), sun: vig('#8a5a00cc'), dark: vig('#000c') };

  // ---------- Generic pieces ----------
  // Big stamped word that slams down from huge, holds, then drifts up and fades.
  // kind: frost, snow, aurora, moon, deep | fire, lava, ash, sun, stone, obsidian, gold
  function slam(x, y, text, { kind = 'frost', size = 44, rotate = fxRand(-8, 8), ms = 820, star = null } = {}) {
    if (star) {
      const w = Math.max(size * 2.6, text.length * size * 0.62);
      const s = fxSpawn(x, y, { cls: 'fxr-svg', html: starSvg(star, '#0008'), ms, size: [w, w * 0.62] });
      fxAnimate(s, [
        { transform: `scale(0.2) rotate(${rotate - 30}deg)`, opacity: 0 },
        { transform: `scale(1.12) rotate(${rotate}deg)`, opacity: 0.95, offset: 0.16 },
        { transform: `scale(1) rotate(${rotate + 4}deg)`, opacity: 0.95, offset: 0.72 },
        { transform: `scale(1.25) rotate(${rotate + 8}deg)`, opacity: 0 },
      ], ms, 'ease-out');
    }
    const el = fxSpawn(x, y, { cls: 'fxr-stamp fxr-' + kind, html: text, ms: ms + 40, style: { fontSize: size + 'px' } });
    return fxAnimate(el, [
      { transform: `translate(0, 0) scale(3) rotate(${rotate - 14}deg)`, opacity: 0 },
      { transform: `translate(0, 0) scale(0.86) rotate(${rotate}deg)`, opacity: 1, offset: 0.13 },
      { transform: `translate(0, 0) scale(1.08) rotate(${rotate}deg)`, opacity: 1, offset: 0.22 },
      { transform: `translate(0, 0) scale(1) rotate(${rotate}deg)`, opacity: 1, offset: 0.74 },
      { transform: `translate(0, -22px) scale(1.1) rotate(${rotate}deg)`, opacity: 0 },
    ], ms, 'ease-out');
  }
  // Where impact stamps go: just under the victim's HP box, clear of the battle's own damage numbers
  const stampPoint = (ctx, dx = 0) => {
    const [x, y] = at(ctx), [, h] = sizeOf(ctx.to, 200, 46);
    return [x + dx, y + h * 0.5 + 18];
  };
  // Gacha-style name plate punching in over the bottom of the wheel that landed
  function plate(ctx, text, color, element = 'frost') {
    if (!ctx.win && !ctx.slot) return;
    const [x, y] = fxPoint(ctx.win || ctx.slot), [, h] = sizeOf(ctx.win, 120, 180);
    const el = fxSpawn(x, y + h * 0.3, { cls: 'fxr-plate fxr-plate-' + element, html: text, ms: 1000, vars: { '--c': color } });
    fxAnimate(el, [
      { transform: 'translate(0, 16px) scale(0.3)', opacity: 0 },
      { transform: 'translate(0, 0) scale(1.15)', opacity: 1, offset: 0.16 },
      { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0.26 },
      { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0.8 },
      { transform: 'translate(0, -10px) scale(0.95)', opacity: 0 },
    ], 1000, 'ease-out');
  }
  // Glowing frame flaring around a wheel window
  function frame(win, color, ms = 650) {
    if (!win) return;
    const [x, y] = fxPoint(win), [w, h] = sizeOf(win, 120, 180);
    const el = fxSpawn(x, y, { cls: 'fxr-frame', ms, size: [w + 10, h + 10], vars: { '--c': color } });
    fxAnimate(el, [
      { transform: 'scale(1.18)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.18 },
      { transform: 'scale(1.02)', opacity: 0.8, offset: 0.5 },
      { transform: 'scale(1.08)', opacity: 0 },
    ], ms, 'ease-out');
  }
  // The card's art (or any graphic) leaps out of the wheel and fades (drawn big and scaled down so it stays crisp)
  function artPop(x, y, art, color, ms = 560) {
    const el = fxSpawn(x, y, { cls: 'fxr-art', html: art, ms: ms + 40, vars: { '--c': color } });
    fxAnimate(el, [
      { transform: 'translate(0, 0) scale(0.2)', opacity: 1 },
      { transform: 'translate(0, -16px) scale(0.75)', opacity: 0.9, offset: 0.35 },
      { transform: 'translate(0, -30px) scale(1)', opacity: 0 },
    ], ms, 'ease-out');
  }
  // An SVG / emoji graphic that pops in at (x, y), holds and fades. size: [w, h] px for SVGs
  function show(x, y, html, { cls = '', size = null, ms = 700, from = 0.3, to = 1, rise = 20, spin = 0, font = 0 } = {}) {
    const el = fxSpawn(x, y, { cls: 'fxr-svg ' + cls, html, ms: ms + 40, size, style: font ? { fontSize: font + 'px' } : {} });
    return fxAnimate(el, [
      { transform: `translate(0, 0) scale(${from}) rotate(${-spin / 2}deg)`, opacity: 0 },
      { transform: `translate(0, 0) scale(${to * 1.12}) rotate(0deg)`, opacity: 1, offset: 0.22 },
      { transform: `translate(0, ${-rise * 0.4}px) scale(${to}) rotate(${spin * 0.2}deg)`, opacity: 1, offset: 0.72 },
      { transform: `translate(0, ${-rise}px) scale(${to * 0.92}) rotate(${spin / 2}deg)`, opacity: 0 },
    ], ms, 'ease-out');
  }
  // A shine sweeping across the landed card
  function glint(el) {
    if (!el) return;
    const [x, y] = fxPoint(el), [w, h] = sizeOf(el, 58, 80);
    const g = fxSpawn(x, y, { cls: 'fxr-glint', ms: 540, size: [14, h * 1.25] });
    fxAnimate(g, [
      { transform: `translate(${-w * 0.7}px, 0) rotate(20deg)`, opacity: 0 },
      { transform: 'translate(0, 0) rotate(20deg)', opacity: 1, offset: 0.5 },
      { transform: `translate(${w * 0.7}px, 0) rotate(20deg)`, opacity: 0 },
    ], 500, 'ease-in-out');
  }
  // Anime speed lines bursting out of a point. cls: fxr-line (white), fxr-line-ice, fxr-line-fire
  function speedLines(x, y, { n = 8, r0 = 40, r1 = 110, cls = 'fxr-line', ms = 380, width = 4 } = {}) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + fxRand(-0.2, 0.2), c = Math.cos(a), s = Math.sin(a), r = r1 * fxRand(0.8, 1.15);
      fxBeam([x + c * r0, y + s * r0], [x + c * r, y + s * r], { cls, ms, width });
    }
  }
  // One slash across (x, y) at `deg`, `len` px long. cls: fxr-slash-ice, fxr-slash-fire, fxr-slash-dark, fxr-slash-moon
  function slash(x, y, deg, len, width = 12, cls = 'fxr-slash-ice') {
    const a = deg * Math.PI / 180, dx = Math.cos(a) * len / 2, dy = Math.sin(a) * len / 2;
    fxBeam([x - dx, y - dy], [x + dx, y + dy], { cls, ms: 380, width });
  }
  // Cracks snapping outward from a point. kind: ice, frost, lava, stone, dark
  function crackBurst(x, y, size, kind = 'ice', rot = fxRand(0, 60), ms = 800) {
    const el = fxSpawn(x, y, { cls: 'fxr-svg', html: CRACK[kind] || CRACK.ice, ms, size: [size, size] });
    fxAnimate(el, [
      { transform: `scale(0.2) rotate(${rot}deg)`, opacity: 1 },
      { transform: `scale(1.05) rotate(${rot}deg)`, opacity: 1, offset: 0.18 },
      { transform: `scale(1) rotate(${rot}deg)`, opacity: 1, offset: 0.6 },
      { transform: `scale(1.02) rotate(${rot}deg)`, opacity: 0 },
    ], ms, 'ease-out');
  }
  // Bright flash ball at the heart of an impact. kind: frost, white, aurora, moon, deep | fire, sun, lava, ash, dark
  function core(x, y, size, kind = 'frost', ms = 380) {
    const el = fxSpawn(x, y, { cls: 'fxr-core fxr-core-' + kind, ms, size: [size, size] });
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
  // A shadow that grows where something is about to crash down
  function shadow(x, y, w = 170, h = 42, ms = 440) {
    const el = fxSpawn(x, y, { cls: 'fxr-shadow', ms: ms + 60, size: [w, h] });
    fxAnimate(el, [{ transform: 'scale(0.2)', opacity: 0.2 }, { transform: 'scale(1.15)', opacity: 0.9 }], ms, 'ease-in');
  }
  // Lock-on reticle shrinking onto the victim before a big hit. color: any CSS colour
  function reticle(x, y, color = '#7ae0ff', ms = 420) {
    const svg = `<svg viewBox="-50 -50 100 100"><g fill="none" stroke="${color}" stroke-width="5"><circle r="34"/><circle r="13" stroke-width="3"/></g>` +
      `<path d="M0 -48 V-24 M0 24 V48 M-48 0 H-24 M24 0 H48" stroke="${color}" stroke-width="6" stroke-linecap="round"/><circle r="4" fill="#fff"/></svg>`;
    const el = fxSpawn(x, y, { cls: 'fxr-svg fxr-reticle', html: svg, ms, size: [120, 120], vars: { '--c': color } });
    fxAnimate(el, [
      { transform: 'scale(2.2) rotate(-120deg)', opacity: 0 },
      { transform: 'scale(1) rotate(0deg)', opacity: 1, offset: 0.45 },
      { transform: 'scale(0.92) rotate(10deg)', opacity: 1, offset: 0.85 },
      { transform: 'scale(0.5) rotate(30deg)', opacity: 0 },
    ], ms, 'ease-out');
  }
  // Particles sucked INTO a point (charging up a beam or a spell)
  function charge(x, y, { colors = ['#fff'], n = 10, r = 90, ms = 320, html = null, size = [4, 8] } = {}) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + fxRand(-0.3, 0.3), d = r * fxRand(0.7, 1.2), s = fxRand(size[0], size[1]);
      const col = colors[i % colors.length], inner = typeof html === 'function' ? html(i) : html;
      const el = fxSpawn(x + Math.cos(a) * d, y + Math.sin(a) * d, { cls: 'fx-particle', html: inner || '', ms: ms + 40,
        size: inner ? null : [s, s], style: inner ? { fontSize: s * 2 + 'px', color: col } : { background: col, boxShadow: `0 0 ${s}px ${col}` } });
      fxAnimate(el, [{ transform: 'translate(0, 0) scale(1)', opacity: 0 }, { transform: `translate(${-Math.cos(a) * d * 0.5}px, ${-Math.sin(a) * d * 0.5}px) scale(1)`, opacity: 1, offset: 0.4 },
        { transform: `translate(${-Math.cos(a) * d}px, ${-Math.sin(a) * d}px) scale(0.3)`, opacity: 0.6 }], ms * fxRand(0.8, 1), 'ease-in');
    }
  }
  // Things circling a point on a flat ellipse (dizzy stars, orbiting snowflakes...). html: string or fn(i)
  function orbit(x, y, html, n = 4, { rx = 60, ry = 16, ms = 950, size = 20, turns = 1.2 } = {}) {
    for (let i = 0; i < n; i++) {
      const el = fxSpawn(x, y, { cls: 'fxr-orbit', html: typeof html === 'function' ? html(i) : html, ms: ms + 40, style: { fontSize: size + 'px' } });
      const frames = [];
      for (let k = 0; k <= 10; k++) {
        const t = k / 10, a = (i / n + t * turns) * Math.PI * 2;
        frames.push({ transform: `translate(${Math.cos(a) * rx}px, ${Math.sin(a) * ry}px) scale(${0.8 + 0.3 * Math.sin(a)})`, opacity: k === 0 || k === 10 ? 0 : 1 });
      }
      fxAnimate(el, frames, ms, 'linear');
    }
  }
  // Fly along a path while pointing the way it travels (icicles, spears, arrows, darts, comets).
  // The graphic should point RIGHT in its artwork. Resolves on arrival.
  function aimFly(from, to, { html = '', cls = '', ms = 300, arc = 0, scale = [1, 1], trail = '', trailEvery = 30, easing = 'ease-in', size = null, spinAfter = 0 } = {}) {
    const el = fxSpawn(from[0], from[1], { cls, html, ms: ms + 60, size });
    if (!el) return Promise.resolve();
    const dx = to[0] - from[0], dy = to[1] - from[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
    const pt = t => [dx * t + nx * Math.sin(Math.PI * t) * arc, dy * t + ny * Math.sin(Math.PI * t) * arc];
    const frames = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10, [px, py] = pt(t), [qx, qy] = pt(Math.min(1, t + 0.05)), [rx, ry] = pt(Math.max(0, t - 0.05));
      const ang = Math.atan2(qy - ry, qx - rx) * 180 / Math.PI + spinAfter * t;
      frames.push({ transform: `translate(${px}px, ${py}px) rotate(${ang}deg) scale(${scale[0] + (scale[1] - scale[0]) * t})` });
    }
    let timer = 0;
    if (trail) {
      const start = performance.now();
      timer = setInterval(() => {
        const t = Math.min(1, (performance.now() - start) / ms), [px, py] = pt(t);
        fxSpawn(from[0] + px, from[1] + py, { cls: trail, ms: 420 });
      }, fxLite ? trailEvery * 2 : trailEvery);
      setTimeout(() => clearInterval(timer), ms + 50); // never outlive the flight, even if its end event is late
    }
    return fxAnimate(el, frames, ms, easing).then(() => { clearInterval(timer); el.remove(); });
  }
  // Something dropping out of the sky onto (x, y): starts above the top of the screen
  function dropIn(x, y, html, { cls = '', ms = 380, scale = [0.6, 1.5], drift = 0, spin = 0, trail = '' } = {}) {
    return fxFly([x + drift, -140], [x, y], { html, cls, ms, scale, spin, trail, trailEvery: 30, easing: 'cubic-bezier(.6,0,1,.6)' });
  }

  // ---------- Frost pieces ----------
  const ICE_COLS = ['#ffffff', '#dff4ff', '#bfe6ff', '#7ab8ff'];
  const AURORA_COLS = ['#5fffb0', '#7ae0ff', '#b07cff', '#ff7ad9'];
  // Snowflakes bursting out of a point (SVG flakes; `aurora` tints them)
  const snowflakes = (x, y, { count = 8, spread = 110, gravity = 30, ms = 900, size = [16, 30], aurora = false, angle = 0, cone = 360 } = {}) =>
    fxParticles(x, y, { count, html: () => `<i class="fxr-flake">${aurora ? FLAKE_AURORA : FLAKE}</i>`, colors: ['#fff'],
      size: [size[0] / 2, size[1] / 2], spread, gravity, ms, spin: 240, angle, cone });
  // Glassy ice shards flying out (they tumble and fall)
  const iceShards = (x, y, { count = 14, spread = 150, gravity = 90, ms = 700, size = [8, 16], angle = 0, cone = 360 } = {}) =>
    fxParticles(x, y, { count, cls: 'fxr-shard', colors: ICE_COLS, spread, size, gravity, ms, spin: 540, angle, cone });
  // Cold twinkles
  const sparkle = (x, y, { count = 8, spread = 90, ms = 650, colors = ['#fff', '#bfe6ff', '#7ae0ff'] } = {}) =>
    fxParticles(x, y, { count, html: () => '✦', colors, spread, size: [5, 10], ms, spin: 90 });
  // Icy mist puffs drifting from a point
  function frostPuff(x, y, n = 4, { ms = 800, size = 44, spread = 50 } = {}) {
    for (let i = 0; i < n; i++) {
      const el = fxSpawn(x + fxRand(-spread, spread) * 0.4, y + fxRand(-10, 10), { cls: 'fxr-mist', ms: ms + 40, size: [size, size] });
      fxAnimate(el, [
        { transform: 'translate(0, 0) scale(0.4)', opacity: 0 },
        { transform: `translate(${fxRand(-spread, spread) * 0.5}px, -8px) scale(1)`, opacity: 0.85, offset: 0.3 },
        { transform: `translate(${fxRand(-spread, spread)}px, -26px) scale(1.7)`, opacity: 0 },
      ], ms * fxRand(0.8, 1), 'ease-out');
    }
  }
  // A frost crystal flowering outward from a point (a big spinning snowflake)
  function frostBloom(x, y, size = 150, ms = 800, aurora = false) {
    return show(x, y, aurora ? FLAKE_AURORA : FLAKE, { cls: 'fxr-bloom', size: [size, size], ms, from: 0.1, to: 1, rise: 0, spin: 90 });
  }
  // Snow falling over an area (w wide, starting at y)
  function snowfall(x, y, w = 160, n = 10, { fall = 90, ms = 900, aurora = false } = {}) {
    for (let i = 0; i < n; i++) later(i * (ms / n / 2), () => {
      const sx = x + fxRand(-w / 2, w / 2), s = fxRand(10, 18);
      const el = fxSpawn(sx, y, { cls: 'fxr-flake', html: aurora ? FLAKE_AURORA : FLAKE, ms: ms + 40, size: [s, s] });
      fxAnimate(el, [
        { transform: 'translate(0, 0) rotate(0deg)', opacity: 0 },
        { transform: `translate(${fxRand(-12, 12)}px, ${fall * 0.4}px) rotate(120deg)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${fxRand(-20, 20)}px, ${fall}px) rotate(300deg)`, opacity: 0 },
      ], ms * fxRand(0.75, 1), 'linear');
    });
  }
  // Icicles falling onto an area and shattering
  function icicleRain(x, y, w = 160, n = 5, { ms = 320, gap = 60 } = {}) {
    for (let i = 0; i < n; i++) later(i * gap, () => {
      const tx = x + fxRand(-w / 2, w / 2), ty = y + fxRand(-10, 10);
      aimFly([tx + fxRand(-30, 30), ty - 260], [tx, ty], { html: ICICLE, cls: 'fxr-icicle', ms, scale: [0.7, 1.1] })
        .then(() => { iceShards(tx, ty, { count: 5, spread: 60, size: [5, 10], ms: 500 }); fxRing(tx, ty, { color: '#bfe6ff', size: 60, width: 3, ms: 300 }); });
    });
  }
  // Ice block that freezes over an element (or a point + size): it frosts over, holds, cracks and shatters
  function iceBlock(el, { ms = 1100, pad = 18, shatter = true, pt = null, size = null } = {}) {
    const [x, y] = pt || fxPoint(el), [w, h] = size || sizeOf(el, 160, 60);
    const b = fxSpawn(x, y, { cls: 'fxr-iceblock', ms: ms + 40, size: [w + pad * 2, h + pad * 2] });
    fxAnimate(b, [
      { transform: 'scale(1.25)', opacity: 0 },
      { transform: 'scale(0.96)', opacity: 1, offset: 0.14 },
      { transform: 'scale(1.02)', opacity: 1, offset: 0.24 },
      { transform: 'scale(1)', opacity: 1, offset: 0.78 },
      { transform: 'translate(3px, 0) scale(1)', opacity: 1, offset: 0.84 },
      { transform: 'translate(-3px, 0) scale(1)', opacity: 1, offset: 0.9 },
      { transform: 'scale(1.06)', opacity: 0 },
    ], ms, 'ease-out');
    later(ms * 0.14, () => { sparkle(x, y - h * 0.3, { count: 5, spread: w * 0.5 }); glint(b); });
    if (shatter) later(ms * 0.8, () => {
      crackBurst(x, y, Math.min(200, w + 40), 'ice', fxRand(0, 60), 360);
      later(160, () => { iceShards(x, y, { count: 14, spread: 140 + w * 0.3, size: [8, 16] }); sfx('blocked', 0.5, 0.7); });
    });
  }
  // Aurora ribbons waving over a point (green / cyan / purple curtains)
  function aurora(x, y, w = 260, h = 90, ms = 1100) {
    for (let i = 0; i < 3; i++) later(i * 90, () => {
      const el = fxSpawn(x + (i - 1) * w * 0.12, y + (i - 1) * 10, { cls: 'fxr-aurora fxr-aurora-' + i, ms: ms + 40, size: [w, h] });
      fxAnimate(el, [
        { transform: 'scaleX(0.3) skewX(-20deg)', opacity: 0 },
        { transform: 'scaleX(1) skewX(10deg)', opacity: 0.85, offset: 0.3 },
        { transform: 'scaleX(1.05) skewX(-12deg)', opacity: 0.7, offset: 0.6 },
        { transform: 'scaleX(1.1) skewX(8deg) translateY(-10px)', opacity: 0 },
      ], ms, 'ease-in-out');
    });
  }

  // ---------- Fire pieces ----------
  const FIRE_COLS = ['#fff3a0', '#ffd23f', '#ffb300', '#ff6a00', '#ff3d00'];
  // Flame tongues licking up along a line (w wide) at y
  function flames(x, y, { n = 5, w = 120, h = 60, ms = 700, delay = 30 } = {}) {
    for (let i = 0; i < n; i++) later(i * delay, () => {
      const fx = x + (n > 1 ? (i / (n - 1) - 0.5) * w : 0) + fxRand(-8, 8), s = fxRand(0.7, 1.2);
      const el = fxSpawn(fx, y, { cls: 'fxr-flame', html: FLAME, ms: ms + 40, size: [h * 0.62 * s, h * s], style: { transformOrigin: '50% 100%' } });
      fxAnimate(el, [
        { transform: 'translate(0, 0) scale(0.2, 0.1)', opacity: 0 },
        { transform: `translate(0, -${h * 0.3}px) scale(1, 1.15) skewX(${fxRand(-8, 8)}deg)`, opacity: 1, offset: 0.3 },
        { transform: `translate(0, -${h * 0.35}px) scale(0.9, 1.05) skewX(${fxRand(-10, 10)}deg)`, opacity: 1, offset: 0.55 },
        { transform: `translate(0, -${h * 0.6}px) scale(0.5, 0.9)`, opacity: 0 },
      ], ms * fxRand(0.8, 1), 'ease-out');
    });
  }
  // Glowing embers drifting up
  const embers = (x, y, { count = 10, spread = 90, ms = 900, rise = 110, cone = 150 } = {}) =>
    fxParticles(x, y, { count, colors: ['#ffd23f', '#ff9a1f', '#ff5a00', '#fff3a0'], size: [3, 6], spread, gravity: -rise, angle: -90, cone, ms, spin: 0 });
  // Hot sparks spraying out
  const sparks = (x, y, { count = 12, spread = 130, gravity = 60, ms = 560, angle = 0, cone = 360 } = {}) =>
    fxParticles(x, y, { count, colors: ['#fff', '#fff3a0', '#ffd23f', '#ffb300'], size: [3, 7], spread, gravity, ms, angle, cone });
  // Smoke puffs rolling upward (dark = sooty volcanic smoke)
  function smoke(x, y, n = 4, { ms = 900, size = 50, spread = 60, dark = true, rise = 50 } = {}) {
    for (let i = 0; i < n; i++) {
      const el = fxSpawn(x + fxRand(-spread, spread) * 0.5, y + fxRand(-8, 8), { cls: dark ? 'fxr-smoke' : 'fxr-steam', ms: ms + 40, size: [size, size] });
      fxAnimate(el, [
        { transform: 'translate(0, 0) scale(0.4)', opacity: 0 },
        { transform: `translate(${fxRand(-spread, spread) * 0.3}px, ${-rise * 0.3}px) scale(1)`, opacity: 0.9, offset: 0.3 },
        { transform: `translate(${fxRand(-spread, spread) * 0.6}px, ${-rise}px) scale(1.8)`, opacity: 0 },
      ], ms * fxRand(0.8, 1), 'ease-out');
    }
  }
  // Molten lava blobs that arc out and fall
  const lavaBlobs = (x, y, { count = 10, spread = 130, gravity = 130, ms = 800, angle = -90, cone = 200, size = [7, 14] } = {}) =>
    fxParticles(x, y, { count, cls: 'fxr-lava', colors: ['#ff6a00'], size, spread, gravity, ms, angle, cone, spin: 180 });
  // Stone debris (obsidian = shiny black-purple glass)
  const rocks = (x, y, { count = 8, spread = 140, gravity = 150, ms = 800, size = [8, 15], obsidian = false, angle = -90, cone = 220 } = {}) =>
    fxParticles(x, y, { count, cls: obsidian ? 'fxr-obsid' : 'fxr-rock', colors: obsidian ? ['#2a1a3a'] : ['#5a4a42'], size, spread, gravity, ms, angle, cone, spin: 540 });
  // Grey ash flakes drifting down over an area
  function ashFall(x, y, w = 160, n = 10, { fall = 80, ms = 900 } = {}) {
    for (let i = 0; i < n; i++) later(i * (ms / n / 2), () => {
      const el = fxSpawn(x + fxRand(-w / 2, w / 2), y, { cls: 'fxr-ash', ms: ms + 40, size: [fxRand(4, 8), fxRand(3, 6)] });
      fxAnimate(el, [
        { transform: 'translate(0, 0) rotate(0deg)', opacity: 0 },
        { transform: `translate(${fxRand(-16, 16)}px, ${fall * 0.4}px) rotate(200deg)`, opacity: 0.9, offset: 0.3 },
        { transform: `translate(${fxRand(-24, 24)}px, ${fall}px) rotate(500deg)`, opacity: 0 },
      ], ms * fxRand(0.75, 1), 'linear');
    });
  }
  // A dark scorch mark burned onto a spot, glowing at the edges, then fading
  function scorch(x, y, size = 140, ms = 1000) {
    const el = fxSpawn(x, y, { cls: 'fxr-scorch', ms, size: [size, size * 0.55] });
    fxAnimate(el, [{ transform: 'scale(0.3)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: 0.2 },
      { transform: 'scale(1.05)', opacity: 0.85, offset: 0.7 }, { transform: 'scale(1.1)', opacity: 0 }], ms, 'ease-out');
  }
  // A shimmering heat wave rolling out from a point
  function heatWave(x, y, size = 200, ms = 520) {
    fxRing(x, y, { color: '#fff3a0', size: size * 0.7, width: 5, ms: ms * 0.8 });
    later(60, () => fxRing(x, y, { color: '#ff6a00', size, width: 9, ms }));
    const h = fxSpawn(x, y, { cls: 'fxr-haze', ms, size: [size, size] });
    fxAnimate(h, [{ transform: 'scale(0.3)', opacity: 0.9 }, { transform: 'scale(1.2)', opacity: 0 }], ms, 'ease-out');
  }
  // A column of lava blasting upward from (x, y), h px tall
  function lavaJet(x, y, h = 220, { ms = 600, width = 34 } = {}) {
    fxBeam([x, y], [x, y - h], { cls: 'fxr-jet', ms, width });
    later(80, () => lavaBlobs(x, y - h * 0.8, { count: 8, spread: 90, gravity: 170, cone: 140 }));
    later(40, () => smoke(x, y - h * 0.9, 3, { size: 60 }));
  }

  // ======================================================================================================
  // Themed default gimmick effects. A card's `gimmick` hook calls one of these (and adds its own flourish),
  // so no frost / fire card ever falls back to the swamp's slime, mud or lily pads.
  // ======================================================================================================
  const tag = (ctx, dflt) => ctx.card?.art || dflt;
  const frost = {
    // Stun: the victim freezes solid inside a block of ice (it shatters when the freeze wears off the screen)
    freeze(ctx, { word = 'FROZEN!', ms = 1150 } = {}) {
      const [x, y] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46);
      frostPuff(x, y, 4, { size: 60, spread: w * 0.4 });
      iceBlock(ctx.to, { ms, pad: 14 });
      later(60, () => frostBloom(x, y, Math.min(220, w * 1.1), 700));
      later(120, () => orbit(x, y - h * 0.6 - 10, () => `<i class="fxr-flake">${FLAKE}</i>`, 4, { rx: w * 0.35, ry: 12, ms: 1000, size: 16 }));
      fxRing(x, y, { color: '#bfe6ff', size: 180, width: 6, ms: 460 });
      const [sx, sy] = stampPoint(ctx);
      later(80, () => slam(sx, sy, word, { kind: 'frost', size: 34, rotate: -5, ms: 950, star: '#bfe6ff' }));
      fxTint(VIG.frost, { ms: 700, opacity: 0.55 });
      sfx('blocked', 0.45, 0.7);
      haptic(40);
    },
    // Damage over time: frost creeps over the victim and three snowflake ticks mark the three frozen turns
    frostbite(ctx, { word = 'FROSTBITE!' } = {}) {
      const [x, y] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46);
      crackBurst(x, y, Math.min(190, w), 'frost', fxRand(0, 60), 900);
      frostPuff(x, y, 5, { size: 52, spread: w * 0.45 });
      snowflakes(x, y, { count: 8, spread: 100, gravity: 40 });
      fxRing(x, y, { color: '#7ab8ff', size: 170, width: 6, ms: 500 });
      const base = [x, y + h * 0.5 + 12];
      [-1, 0, 1].forEach((o, i) => later(220 + i * 110, () => show(base[0] + o * 30, base[1], FLAKE, { cls: 'fxr-tick', size: [24, 24], ms: 720, rise: -6, spin: 60 })));
      later(60, () => slam(x, y - h * 0.5 - 22, word, { kind: 'snow', size: 26, rotate: 4, ms: 850 }));
      fxTint(VIG.frost, { ms: 600, opacity: 0.45 });
    },
    // Armor / shield: ice plates fly from the wheel and lock into a crystal wall around the caster
    armor(ctx, { n = 2, word = null, plates = CRYSTAL } = {}) {
      const [x, y] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46);
      const start = ctx.win ? fxPoint(ctx.win) : [x, y + 120];
      const k = Math.min(6, 2 + n * 2);
      for (let i = 0; i < k; i++) {
        const a = (i / k) * Math.PI * 2 - Math.PI / 2, tx = x + Math.cos(a) * w * 0.52, ty = y + Math.sin(a) * (h * 0.5 + 16);
        later(100 + i * 45, () => fxFly(start, [tx, ty], { html: plates, cls: 'fxr-plate-fly', ms: 280, arc: fxRand(-70, 70), spin: 360, scale: [0.4, 0.9], easing: 'cubic-bezier(.4,1.5,.6,1)' }));
      }
      later(420, () => {
        const wall = fxSpawn(x, y, { cls: 'fxr-icewall', ms: 700, size: [w + 34, h + 40] });
        fxAnimate(wall, [{ transform: 'scale(1.3)', opacity: 0 }, { transform: 'scale(0.96)', opacity: 1, offset: 0.25 },
          { transform: 'scale(1)', opacity: 1, offset: 0.7 }, { transform: 'scale(1.06)', opacity: 0 }], 700, 'ease-out');
        glint(wall);
        sparkle(x, y, { count: 10, spread: w * 0.6 });
        fxRing(x, y, { color: '#bfe6ff', size: w + 60, width: 6, ms: 460 });
        slam(x, y + h * 0.5 + 18, word || `${tag(ctx, '🧊')} +${n} ICE`, { kind: 'frost', size: 26, rotate: -4, ms: 750 });
        jolt(ctx.from, [{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], 280);
        sfx('shield', 0.8, 1.2);
      });
    },
    // Healing (heal / wallow / regen): glittering snow motes rise around the caster in a soft cyan glow
    heal(ctx, { word = null, shield = false, aurora: au = false } = {}) {
      const [x, y] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46);
      const start = ctx.win ? fxPoint(ctx.win) : null;
      if (start) for (let i = 0; i < 5; i++) later(i * 50, () => fxFly(start, [x + fxRand(-w * 0.35, w * 0.35), y + fxRand(-8, 8)],
        { html: `<i class="fxr-flake">${au ? FLAKE_AURORA : FLAKE}</i>`, cls: 'fxr-flake-fly', ms: 320, arc: fxRand(-90, 90), spin: 360, scale: [0.5, 1] }));
      later(260, () => {
        const g = fxSpawn(x, y, { cls: au ? 'fxr-glow-aurora' : 'fxr-glow-frost', ms: 900, size: [w * 1.3, h * 2.6] });
        fxAnimate(g, [{ transform: 'scale(0.6)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: 0.3 }, { transform: 'scale(1.15)', opacity: 0 }], 900, 'ease-out');
        fxParticles(x, y, { count: 10, html: '✚', colors: au ? AURORA_COLS : ['#bfffea', '#7ae0ff', '#ffffff'], size: [7, 12], spread: 70, gravity: -80, angle: -90, cone: 140, ms: 850, spin: 0 });
        sparkle(x, y - 10, { count: 8, spread: w * 0.5, colors: au ? AURORA_COLS : undefined });
        if (au) aurora(x, y - h, w * 1.3, 60, 900);
        if (word) slam(x, y + h * 0.5 + 18, word, { kind: au ? 'aurora' : 'frost', size: 26, rotate: 4, ms: 750 });
      });
      if (shield) later(520, () => frost.armor({ ...ctx, win: null }, { n: 1, word: '+1 ICE' }));
    },
    // Lifesteal: frosty wisps stream out of the victim back into the caster
    lifesteal(ctx, { html = null, n = 8 } = {}) {
      const a = at(ctx), b = src(ctx);
      for (let i = 0; i < n; i++) later(i * 40, () => fxFly(a, [b[0] + fxRand(-24, 24), b[1] + fxRand(-12, 12)],
        { html: html || '<i class="fxr-wisp fxr-wisp-frost"></i>', cls: 'fxr-wisp-fly', ms: 420, arc: fxRand(-110, 110), scale: [1, 0.6], easing: 'ease-in-out' }));
      later(460, () => {
        fxRing(b[0], b[1], { color: '#7ae0ff', size: 170, width: 6 });
        sparkle(b[0], b[1], { count: 10, spread: 80 });
        jolt(ctx.from, [{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], 300);
      });
    },
    // Cleave: an ice spike shoots at the victim; any shields turn to a glass bubble that shatters
    smash(ctx, { word = 'SHATTERED!' } = {}) {
      const [tx, ty] = at(ctx), from = launchPoint(ctx), [w, h] = sizeOf(ctx.to, 200, 46);
      fxBeam(from, [tx, ty], { cls: 'fxr-icebeam', ms: 300, width: 9 });
      if (!ctx.blocked) { later(100, () => fxRing(tx, ty, { color: '#dff4ff', size: 130, width: 4, ms: 350 })); return; }
      iceBlock(null, { pt: [tx, ty], size: [w, h], ms: 260, pad: 16, shatter: false });
      later(120, () => crackBurst(tx, ty, Math.min(190, w), 'ice', 0, 300));
      later(230, () => {
        iceShards(tx, ty, { count: 18, spread: 170, size: [9, 18] });
        fxRing(tx, ty, { color: '#bfe6ff', size: 240, width: 6, ms: 420 });
        const [sx, sy] = stampPoint(ctx, -20);
        slam(sx, sy + 34, word, { kind: 'frost', size: 30, rotate: -5, ms: 720 });
        fxTint('#6aa8ff', { ms: 280, opacity: 0.22 });
        fxShake(ctx.panel, 10, 300);
        sfx('blocked', 0.45, 0.8);
      });
    },
    // Frenzy (three strikes): a howling blizzard whirls up around the attacker
    frenzy(ctx, { word = 'FRENZY!', html = null } = {}) {
      const [x, y] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46);
      fxTint(VIG.frost, { ms: 800, opacity: 0.6 });
      for (let i = 0; i < 3; i++) later(i * 140, () => fxRing(x, y, { color: i % 2 ? '#ffffff' : '#7ab8ff', size: w * 1.1 + i * 40, width: 6 - i, ms: 480 }));
      orbit(x, y, html || (() => `<i class="fxr-flake">${FLAKE}</i>`), 6, { rx: w * 0.55, ry: h * 0.9, ms: 900, size: 18, turns: 1.5 });
      snowfall(x, y - h, w, 8, { fall: h * 2.4, ms: 800 });
      speedLines(x, y, { n: 8, r0: w * 0.4, r1: w * 0.75, cls: 'fxr-line-ice' });
      slam(x, y + h * 0.5 + 18, word, { kind: 'frost', size: 34, rotate: -6, ms: 800 });
      fxShake(ctx.from, 7, 360);
      sfx('big_hit', 0.55, 0.45);
    },
    // Focus: the caster's eyes lock on, a frosty reticle settles onto the victim
    focus(ctx, { word = 'LOCKED ON' } = {}) {
      const [x, y] = at(ctx), [fx, fy] = src(ctx);
      reticle(x, y, '#7ae0ff', 900);
      fxRing(fx, fy, { color: '#7ae0ff', size: 170, width: 6 });
      sparkle(fx, fy, { count: 10, spread: 80 });
      later(350, () => slam(x, y - 60, word, { kind: 'frost', size: 26, rotate: -4, ms: 800 }));
    },
    // Double: cold power gathers in the caster (its next attack strikes again)
    double(ctx, { word = null } = {}) {
      const [x, y] = src(ctx), strikes = (ctx.attacker?.doubleNext || 0) + 2;
      charge(x, y, { colors: ['#fff', '#bfe6ff', '#7ae0ff'], n: 12, r: 110, ms: 380 });
      later(360, () => {
        fxRing(x, y, { color: '#bfe6ff', size: 190, width: 7, ms: 460 });
        slam(x, y + 44, word || `×${strikes}`, { kind: 'moon', size: 40, rotate: -6, ms: 700 });
        jolt(ctx.from, [{ transform: 'none' }, { transform: 'scale(1.12)', offset: 0.3 }, { transform: 'none' }], 380);
      });
    },
  };

  const fire = {
    // Stun: the victim is dazed: smoke swallows them and stars spin round their head
    daze(ctx, { word = 'DAZED!', stars = i => (i % 2 ? '💫' : '⭐') } = {}) {
      const [x, y] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46);
      smoke(x, y, 6, { size: 70, spread: w * 0.5, rise: 30 });
      later(200, () => orbit(x, y - h * 0.5 - 10, stars, 5, { rx: w * 0.3, ry: 12, ms: 1000, size: 20 }));
      jolt(ctx.to, [{ transform: 'rotate(0)' }, { transform: 'rotate(-5deg)' }, { transform: 'rotate(4deg)' }, { transform: 'rotate(-2deg)' }, { transform: 'rotate(0)' }], 800, { delay: 150 });
      fxRing(x, y, { color: '#ffb300', size: 170, width: 6, ms: 460 });
      const [sx, sy] = stampPoint(ctx);
      later(80, () => slam(sx, sy, word, { kind: 'ash', size: 34, rotate: -5, ms: 950, star: '#ffd23f' }));
      fxTint(VIG.ash, { ms: 700, opacity: 0.5 });
      sfx('stun', 0.7, 0.6);
    },
    // Damage over time: the victim catches fire and three flame ticks mark the three burning turns
    burn(ctx, { word = 'BURNING!' } = {}) {
      const [x, y] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46);
      flames(x, y + h * 0.4, { n: 5, w: w * 0.8, h: 60, ms: 750 });
      embers(x, y, { count: 12, spread: 90 });
      smoke(x, y - h * 0.3, 3, { size: 46 });
      fxRing(x, y, { color: '#ff6a00', size: 170, width: 6, ms: 500 });
      const base = [x, y + h * 0.5 + 12];
      [-1, 0, 1].forEach((o, i) => later(220 + i * 110, () => show(base[0] + o * 30, base[1], FLAME, { cls: 'fxr-tick', size: [18, 27], ms: 720, rise: 4 })));
      later(60, () => slam(x, y - h * 0.5 - 22, word, { kind: 'fire', size: 26, rotate: 4, ms: 850 }));
      fxTint(VIG.fire, { ms: 600, opacity: 0.45 });
      sfx('saw', 1.9, 0.25); // sizzle
    },
    // Armor / shield: molten rock plates slap on around the caster and cool into a stone shell
    armor(ctx, { n = 2, word = null, plates = ROCK } = {}) {
      const [x, y] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46);
      const start = ctx.win ? fxPoint(ctx.win) : [x, y + 120];
      const k = Math.min(6, 2 + n * 2);
      for (let i = 0; i < k; i++) {
        const a = (i / k) * Math.PI * 2 - Math.PI / 2, tx = x + Math.cos(a) * w * 0.52, ty = y + Math.sin(a) * (h * 0.5 + 16);
        later(100 + i * 45, () => fxFly(start, [tx, ty], { html: plates, cls: 'fxr-plate-fly', ms: 280, arc: fxRand(-70, 70), spin: 360, scale: [0.4, 0.9], easing: 'cubic-bezier(.4,1.5,.6,1)' }));
      }
      later(420, () => {
        const wall = fxSpawn(x, y, { cls: 'fxr-magmawall', ms: 700, size: [w + 34, h + 40] });
        fxAnimate(wall, [{ transform: 'scale(1.3)', opacity: 0 }, { transform: 'scale(0.96)', opacity: 1, offset: 0.25 },
          { transform: 'scale(1)', opacity: 1, offset: 0.7 }, { transform: 'scale(1.06)', opacity: 0 }], 700, 'ease-out');
        smoke(x, y - h * 0.5, 3, { size: 40, dark: false }); // the lava cools with a hiss
        sparks(x, y, { count: 10, spread: w * 0.6 });
        fxRing(x, y, { color: '#ff8a1f', size: w + 60, width: 6, ms: 460 });
        slam(x, y + h * 0.5 + 18, word || `${tag(ctx, '🪨')} +${n} MAGMA`, { kind: 'stone', size: 26, rotate: -4, ms: 750 });
        jolt(ctx.from, [{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], 280);
        sfx('shield', 0.6, 1.2);
      });
    },
    // Healing (heal / wallow / regen): warm embers swirl up around the caster in a golden glow
    heal(ctx, { word = null, shield = false, sun = false } = {}) {
      const [x, y] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46);
      const start = ctx.win ? fxPoint(ctx.win) : null;
      if (start) for (let i = 0; i < 5; i++) later(i * 50, () => fxFly(start, [x + fxRand(-w * 0.35, w * 0.35), y + fxRand(-8, 8)],
        { html: '<i class="fxr-wisp fxr-wisp-fire"></i>', cls: 'fxr-wisp-fly', ms: 320, arc: fxRand(-90, 90), scale: [0.6, 1.1] }));
      later(260, () => {
        const g = fxSpawn(x, y, { cls: sun ? 'fxr-glow-sun' : 'fxr-glow-fire', ms: 900, size: [w * 1.3, h * 2.6] });
        fxAnimate(g, [{ transform: 'scale(0.6)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: 0.3 }, { transform: 'scale(1.15)', opacity: 0 }], 900, 'ease-out');
        fxParticles(x, y, { count: 10, html: '✚', colors: ['#ffe066', '#ffb300', '#b6ff8a'], size: [7, 12], spread: 70, gravity: -80, angle: -90, cone: 140, ms: 850, spin: 0 });
        embers(x, y, { count: 10, spread: w * 0.4 });
        if (word) slam(x, y + h * 0.5 + 18, word, { kind: sun ? 'sun' : 'fire', size: 26, rotate: 4, ms: 750 });
      });
      if (shield) later(520, () => fire.armor({ ...ctx, win: null }, { n: 1, word: '+1 MAGMA' }));
    },
    // Lifesteal: fiery wisps stream out of the victim back into the caster
    lifesteal(ctx, { html = null, n = 8 } = {}) {
      const a = at(ctx), b = src(ctx);
      for (let i = 0; i < n; i++) later(i * 40, () => fxFly(a, [b[0] + fxRand(-24, 24), b[1] + fxRand(-12, 12)],
        { html: html || '<i class="fxr-wisp fxr-wisp-fire"></i>', cls: 'fxr-wisp-fly', ms: 420, arc: fxRand(-110, 110), scale: [1, 0.6], easing: 'ease-in-out' }));
      later(460, () => {
        fxRing(b[0], b[1], { color: '#ff8a1f', size: 170, width: 6 });
        embers(b[0], b[1], { count: 10, spread: 80 });
        jolt(ctx.from, [{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], 300);
      });
    },
    // Cleave: a lava crack races to the victim; any shields glow red-hot and burst apart
    smash(ctx, { word = 'MELTED!' } = {}) {
      const [tx, ty] = at(ctx), from = launchPoint(ctx), [w, h] = sizeOf(ctx.to, 200, 46);
      fxBeam(from, [tx, ty], { cls: 'fxr-lavabeam', ms: 300, width: 9 });
      if (!ctx.blocked) { later(100, () => fxRing(tx, ty, { color: '#ffb300', size: 130, width: 4, ms: 350 })); return; }
      const b = fxSpawn(tx, ty, { cls: 'fxr-hotshield', ms: 280, size: [w + 30, h + 40] });
      fxAnimate(b, [{ transform: 'scale(0.85)', opacity: 0 }, { transform: 'scale(1.04)', opacity: 1, offset: 0.3 },
        { transform: 'translate(4px, 0) scale(1)', opacity: 1, offset: 0.6 }, { transform: 'translate(-4px, 0) scale(1.08)', opacity: 0.4 }], 260, 'linear');
      later(120, () => crackBurst(tx, ty, Math.min(190, w), 'lava', 0, 300));
      later(230, () => {
        lavaBlobs(tx, ty, { count: 10, spread: 150, cone: 300 });
        rocks(tx, ty, { count: 8, spread: 160, cone: 300 });
        fxRing(tx, ty, { color: '#ff6a00', size: 240, width: 6, ms: 420 });
        const [sx, sy] = stampPoint(ctx, -20);
        slam(sx, sy + 34, word, { kind: 'lava', size: 30, rotate: -5, ms: 720 });
        fxTint('#ff6a00', { ms: 280, opacity: 0.22 });
        fxShake(ctx.panel, 10, 300);
        sfx('blocked', 0.45, 0.6);
      });
    },
    // Frenzy (three strikes): the attacker blazes up in a roaring aura of flame
    frenzy(ctx, { word = 'FRENZY!' } = {}) {
      const [x, y] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46);
      fxTint(VIG.fire, { ms: 800, opacity: 0.6 });
      for (let i = 0; i < 3; i++) later(i * 140, () => fxRing(x, y, { color: i % 2 ? '#ffd23f' : '#ff3d00', size: w * 1.1 + i * 40, width: 6 - i, ms: 480 }));
      flames(x, y + h * 0.5, { n: 6, w: w * 0.9, h: 70, ms: 800 });
      embers(x, y, { count: 14, spread: w * 0.5 });
      speedLines(x, y, { n: 8, r0: w * 0.4, r1: w * 0.75, cls: 'fxr-line-fire' });
      slam(x, y + h * 0.5 + 18, word, { kind: 'fire', size: 34, rotate: -6, ms: 800 });
      fxShake(ctx.from, 7, 360);
      sfx('big_hit', 0.55, 0.45);
    },
    focus(ctx, { word = 'LOCKED ON' } = {}) {
      const [x, y] = at(ctx), [fx, fy] = src(ctx);
      reticle(x, y, '#ff8a1f', 900);
      fxRing(fx, fy, { color: '#ffb300', size: 170, width: 6 });
      embers(fx, fy, { count: 10, spread: 80 });
      later(350, () => slam(x, y - 60, word, { kind: 'fire', size: 26, rotate: -4, ms: 800 }));
    },
    double(ctx, { word = null } = {}) {
      const [x, y] = src(ctx), strikes = (ctx.attacker?.doubleNext || 0) + 2;
      charge(x, y, { colors: FIRE_COLS, n: 12, r: 110, ms: 380 });
      later(360, () => {
        heatWave(x, y, 200);
        slam(x, y + 44, word || `×${strikes}`, { kind: 'fire', size: 40, rotate: -6, ms: 700 });
        jolt(ctx.from, [{ transform: 'none' }, { transform: 'scale(1.12)', offset: 0.3 }, { transform: 'none' }], 380);
      });
    },
  };

  // ======================================================================================================
  // Themed battle moments (picked by battleFx through BATTLE_FX_KIND in card-fx.js)
  // ======================================================================================================
  const wheelsOf = ctx => [...(ctx.panel?.querySelectorAll('.wheel-window') || [])].slice(0, 4);
  // Frostbite ticks at the start of a turn: the victim shivers, frost crackles over them
  BATTLE_FX['poisonTick:frost'] = ctx => {
    const [x, y] = at(ctx), dmg = ctx.dmg || 0, [w] = sizeOf(ctx.to, 200, 46);
    sfx('blocked', 0.6, 0.6);
    jolt(ctx.to, [{ transform: 'none' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(-3px)' },
      { transform: 'translateX(3px)' }, { transform: 'translateX(-2px)' }, { transform: 'none' }], 600);
    crackBurst(x, y, Math.min(200, w), 'frost', fxRand(0, 60), 900);
    frostPuff(x, y, 5, { size: 56, spread: w * 0.45 });
    snowflakes(x, y, { count: Math.min(12, 6 + Math.round(dmg / 3)), spread: 110, gravity: 50 });
    show(x, y, FLAKE, { cls: 'fxr-bigflake', size: [70 + Math.min(40, dmg), 70 + Math.min(40, dmg)], ms: 900, rise: 40, spin: 120 });
    fxRing(x, y, { color: '#7ab8ff', size: 160, width: 6, ms: 520 });
    const [sx, sy] = stampPoint(ctx);
    slam(sx, sy, 'BRRR!', { kind: 'snow', size: 30, rotate: fxRand(-8, 8), ms: 800 });
    fxTint(VIG.frost, { ms: 650, opacity: 0.6 });
  };
  // Burn ticks: flames flare up on the victim, smoke and embers
  BATTLE_FX['poisonTick:fire'] = ctx => {
    const [x, y] = at(ctx), dmg = ctx.dmg || 0, [w, h] = sizeOf(ctx.to, 200, 46);
    sfx('saw', 1.8, 0.3);
    jolt(ctx.to, [{ transform: 'none' }, { transform: 'translateY(-5px) scale(1.03)' }, { transform: 'translateY(2px)' }, { transform: 'none' }], 500);
    flames(x, y + h * 0.4, { n: 6, w: w * 0.85, h: 60 + Math.min(40, dmg * 1.5), ms: 800 });
    embers(x, y, { count: Math.min(16, 8 + Math.round(dmg / 2)), spread: 100 });
    smoke(x, y - h * 0.4, 4, { size: 54 });
    scorch(x, y + 6, Math.min(220, w * 0.9), 900);
    fxRing(x, y, { color: '#ff6a00', size: 160, width: 6, ms: 520 });
    const [sx, sy] = stampPoint(ctx);
    slam(sx, sy, 'OUCH, HOT!', { kind: 'fire', size: 28, rotate: fxRand(-8, 8), ms: 800 });
    fxTint(VIG.fire, { ms: 650, opacity: 0.6 });
  };
  // Frozen solid: the fighter's wheels are iced over and they can't spin this turn
  BATTLE_FX['stunSkip:frost'] = ctx => {
    const wins = wheelsOf(ctx), [x, y] = at(ctx);
    sfx('blocked', 0.4, 0.9);
    later(200, () => sfx('stun', 0.6, 0.5));
    wins.forEach((w, i) => later(i * 90, () => { iceBlock(w, { ms: 1150, pad: 6 }); const [wx, wy] = fxPoint(w); frostPuff(wx, wy, 2, { size: 50 }); }));
    iceBlock(ctx.to, { ms: 1200, pad: 10 });
    jolt(ctx.to, [{ transform: 'none' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(3px)' }, { transform: 'translateX(-2px)' }, { transform: 'none' }], 700);
    const mid = wins.length ? fxPoint(wins[Math.floor(wins.length / 2)]) : [x, y + 80];
    later(160, () => slam(mid[0], mid[1], 'FROZEN SOLID!', { kind: 'frost', size: 38, ms: 1000, star: '#dff4ff' }));
    snowfall(mid[0], mid[1] - 120, 300, 12, { fall: 200, ms: 1000 });
    fxTint(VIG.frost, { ms: 700, opacity: 0.6 });
  };
  // Dazed: smoke fills the fighter's wheels and stars spin round their head
  BATTLE_FX['stunSkip:fire'] = ctx => {
    const wins = wheelsOf(ctx), [x, y] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46);
    sfx('stun', 0.7, 0.8);
    wins.forEach((win, i) => later(i * 90, () => { const [wx, wy] = fxPoint(win); smoke(wx, wy + 20, 3, { size: 70, rise: 40 }); ashFall(wx, wy - 60, 80, 5); }));
    orbit(x, y - h * 0.5 - 8, i => (i % 2 ? '💫' : '⭐'), 5, { rx: w * 0.32, ry: 13, ms: 1100, size: 20 });
    jolt(ctx.to, [{ transform: 'rotate(0)' }, { transform: 'rotate(-5deg)' }, { transform: 'rotate(4deg)' }, { transform: 'rotate(-3deg)' }, { transform: 'rotate(0)' }], 900);
    const mid = wins.length ? fxPoint(wins[Math.floor(wins.length / 2)]) : [x, y + 80];
    later(160, () => slam(mid[0], mid[1], 'DAZED!', { kind: 'ash', size: 42, ms: 1000, star: '#ffd23f' }));
    fxTint(VIG.ash, { ms: 700, opacity: 0.55 });
  };
  // An ice shield soaks a hit: a crystal wall flashes up facing the attacker, cracks and sprays shards
  function blockAt(ctx) {
    const [x, y] = at(ctx), [ax, ay] = ctx.fromXY || [x - 200, y], [bw] = sizeOf(ctx.to, 200, 46);
    const ang = Math.atan2(ay - y, ax - x), off = clamp(bw * 0.3, 30, 90);
    return { x, y, ang, deg: ang * 180 / Math.PI, px: x + Math.cos(ang) * off, py: y + Math.sin(ang) * off };
  }
  BATTLE_FX['block:frost'] = ctx => {
    const { px, py, deg } = blockAt(ctx), left = ctx.defender?.shield || 0;
    const el = fxSpawn(px, py, { cls: 'fxr-svg fxr-crystal', html: CRYSTAL, ms: 560, size: [60, 90] });
    fxAnimate(el, [{ transform: 'scale(0.4)', opacity: 0 }, { transform: 'scale(1.15)', opacity: 1, offset: 0.15 },
      { transform: 'scale(0.92, 1.06)', opacity: 1, offset: 0.35 }, { transform: 'scale(1.3)', opacity: 0 }], 540, 'ease-out');
    later(120, () => crackBurst(px, py, 110, 'ice', 0, 420));
    later(170, () => iceShards(px, py, { count: 12, spread: 120, angle: deg + 180, cone: 200 }));
    sparkle(px, py, { count: 10, spread: 100 });
    fxRing(px, py, { color: '#dff4ff', size: 160, width: 5, ms: 420 });
    slam(px, py - 52, 'CLINK!', { kind: 'frost', size: 28, rotate: 0, ms: 700 });
    fxShake(ctx.to, 6, 260);
    sfx('coin', 1.9, 0.3);
    if (left > 0) later(430, () => slam(px, py + 40, `🧊 x${left}`, { kind: 'frost', size: 18, rotate: 0, ms: 800 }));
  };
  BATTLE_FX['block:fire'] = ctx => {
    const { px, py, deg } = blockAt(ctx), left = ctx.defender?.shield || 0;
    const el = fxSpawn(px, py, { cls: 'fxr-svg fxr-rockplate', html: ROCK, ms: 560, size: [90, 75] });
    fxAnimate(el, [{ transform: 'scale(0.4) rotate(-20deg)', opacity: 0 }, { transform: 'scale(1.15) rotate(0deg)', opacity: 1, offset: 0.15 },
      { transform: 'scale(0.92, 1.06)', opacity: 1, offset: 0.35 }, { transform: 'scale(1.3)', opacity: 0 }], 540, 'ease-out');
    later(120, () => crackBurst(px, py, 110, 'lava', 0, 420));
    later(170, () => rocks(px, py, { count: 10, spread: 120, angle: deg + 180, cone: 200 }));
    sparks(px, py, { count: 12, spread: 110, angle: deg, cone: 120 });
    fxRing(px, py, { color: '#ffb300', size: 160, width: 5, ms: 420 });
    slam(px, py - 52, 'CLONK!', { kind: 'stone', size: 28, rotate: 0, ms: 700 });
    fxShake(ctx.to, 6, 260);
    sfx('blocked', 0.8, 0.5);
    if (left > 0) later(430, () => slam(px, py + 40, `🪨 x${left}`, { kind: 'stone', size: 18, rotate: 0, ms: 800 }));
  };

  // ======================================================================================================
  // Emoji hits: every frost / fire card's art slams onto the victim on impact, spinning, with a spray of
  // tiny copies (on top of the card's own impact). Super moves get a much bigger one.
  // ======================================================================================================
  function emojiHit(ctx) {
    const c = ctx.card;
    if (!c?.region || !c.art || c.art.startsWith('<')) return;
    const [x, y] = at(ctx), big = c.superMove, k = clamp(pow(ctx), 0.8, 2) * (big ? 1.5 : 1);
    const glow = c.element === 'fire' ? '#ff6a00' : '#7ae0ff', side = fxRand(-1, 1) < 0 ? -1 : 1;
    const el = fxSpawn(x + side * 36, y - 26, { cls: 'fxr-emoji', html: c.art, ms: 760, vars: { '--c': glow }, style: { fontSize: Math.round(64 * k) + 'px' } });
    fxAnimate(el, [
      { transform: `translate(${side * 60}px, -40px) scale(2.4) rotate(${side * -40}deg)`, opacity: 0 },
      { transform: 'translate(0, 0) scale(0.9) rotate(0deg)', opacity: 1, offset: 0.16 },
      { transform: `translate(0, 0) scale(1.15) rotate(${side * 8}deg)`, opacity: 1, offset: 0.28 },
      { transform: `translate(${side * 6}px, -6px) scale(1) rotate(${side * 4}deg)`, opacity: 1, offset: 0.7 },
      { transform: `translate(${side * 24}px, -40px) scale(0.7) rotate(${side * 30}deg)`, opacity: 0 },
    ], 740, 'ease-out');
    fxParticles(x, y, { count: big ? 10 : 5, html: c.art, colors: ['#fff'], size: [7, big ? 14 : 11], spread: 110 * k, gravity: 60, ms: 700, spin: 360 });
  }
  IMPACT_LAYERS.push(emojiHit);

  // ======================================================================================================
  // SUPER MOVES (card.superMove, see regions.js): like the Orbital Laser, the battle waits for a short
  // cinematic before they strike. Each one has its own scene (SUPER_SCENES below: a moonrise, a penguin
  // parade, an eclipse, an erupting volcano, a galaxy...), then power charges in and the screen flashes.
  // ======================================================================================================
  const THERMO = '<svg viewBox="0 0 60 200"><rect x="18" y="6" width="24" height="150" rx="12" fill="#eaf6ff" stroke="#0d3b7a" stroke-width="5"/>' +
    '<circle cx="30" cy="170" r="24" fill="#2a8aff" stroke="#0d3b7a" stroke-width="5"/><rect x="25" y="40" width="10" height="130" rx="5" fill="#2a8aff"/>' +
    [40, 70, 100, 130].map(y => `<path d="M42 ${y} H50" stroke="#0d3b7a" stroke-width="4" stroke-linecap="round"/>`).join('') + '</svg>';
  const VOLCANO = '<svg viewBox="0 0 300 160"><path d="M0 160 L110 30 Q150 14 190 30 L300 160 Z" fill="#2a1a14" stroke="#0a0604" stroke-width="5" stroke-linejoin="round"/>' +
    '<path d="M112 32 Q150 50 188 32 Q150 18 112 32 Z" fill="#ff6a00"/><path d="M130 40 L118 90 L136 70 L128 120 M170 40 L184 100 L166 76 L176 130" fill="none" stroke="#ff8a1f" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const BOLT = '<svg viewBox="0 0 40 120" preserveAspectRatio="none"><polygon points="25,0 7,56 20,56 5,120 36,44 23,44 35,0" fill="#fff6a0" stroke="#ff8a1f" stroke-width="3" stroke-linejoin="round"/></svg>';
  const SEA = 'linear-gradient(#1f7ad6 0, #0d3b7a 30%, #041a3a 100%)';
  // Twinkling stars scattered over the top of the screen
  function starfield(VW, VH, n, ms, colors = ['#fff', '#fff6c8', '#bfe6ff'], top = 0.7) {
    for (let i = 0; i < n; i++) later(fxRand(0, ms * 0.4), () => {
      const el = fxSpawn(fxRand(10, VW - 10), fxRand(10, VH * top), { cls: 'fxr-star', html: '✦', ms: ms * 0.7, style: { color: pick(colors), fontSize: fxRand(8, 18) + 'px' } });
      fxAnimate(el, [{ transform: 'scale(0.2)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: 0.3 }, { transform: 'scale(0.6)', opacity: 0.4, offset: 0.6 },
        { transform: 'scale(1.1)', opacity: 1, offset: 0.8 }, { transform: 'scale(0.3)', opacity: 0 }], ms * 0.7, 'ease-in-out');
    });
  }
  // A big graphic that holds for the whole scene: rises / descends / grows, then flares out at the end
  function prop(x, y, html, size, ms, { from = 'below', cls = '', dist = 260, spin = 0 } = {}) {
    const el = fxSpawn(x, y, { cls: 'fxr-svg fxr-prop ' + cls, html, ms: ms + 40, size });
    const start = from === 'below' ? `translate(0, ${dist}px) scale(0.7)` : from === 'above' ? `translate(0, ${-dist}px) scale(0.7)` : 'scale(0.1)';
    fxAnimate(el, [{ transform: `${start} rotate(${-spin}deg)`, opacity: 0 }, { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1, offset: 0.35 },
      { transform: `translate(0, -6px) scale(1.04) rotate(${spin * 0.3}deg)`, opacity: 1, offset: 0.85 }, { transform: `translate(0, -10px) scale(1.25) rotate(${spin * 0.5}deg)`, opacity: 0 }], ms, 'ease-out');
    return el;
  }
  // A full-screen band (sea, frost wall...) sliding in from a side
  function band(x, y, w, h, bg, ms, from = [0, 80]) {
    const el = fxSpawn(x, y, { cls: 'fxr-band', ms: ms + 40, size: [w, h], style: { background: bg } });
    fxAnimate(el, [{ transform: `translate(${from[0]}px, ${from[1]}px)`, opacity: 0 }, { transform: 'translate(0, 0)', opacity: 1, offset: 0.3 },
      { transform: 'translate(0, 0)', opacity: 1, offset: 0.85 }, { transform: `translate(${from[0] * 0.3}px, ${from[1] * 0.3}px)`, opacity: 0 }], ms, 'ease-out');
  }
  const SUPER_SCENES = {
    // Aurora Moth Queen: a starry night, a full moon rises and moths flutter across it, then its light pours down
    'moonbeam': { dark: 'radial-gradient(ellipse at 50% 30%, #1a2a6acc 0%, #02051af4 70%)', colors: ['#fff6c8', '#ffffff', '#b07cff'], kind: 'moon', art: false,
      scene({ x, y, VW, VH, MS }) {
        starfield(VW, VH, 26, MS);
        const mx = x, my = Math.max(100, y - 190);
        prop(mx, my, FULL_MOON, [200, 200], MS, { from: 'below', cls: 'fxr-moonglow', dist: 320 });
        for (let i = 0; i < 4; i++) later(350 + i * 170, () => fxFly([mx - 180, my + fxRand(-60, 40)], [mx + 200, my + fxRand(-80, 20)],
          { html: '🦋', cls: 'fxr-silhouette', ms: 700, arc: fxRand(-60, 60), scale: [0.8, 1.1] }));
        later(MS - 450, () => fxBeam([mx, my + 60], [x, y], { cls: 'fxr-moonbeam', ms: 520, width: 70 }));
      } },
    // Emperor Penguin: a parade across the snow to a drumbeat
    'penguin-march': { dark: 'linear-gradient(#2a5a9acc, #0a1a3af0)', colors: ['#ffffff', '#bfe6ff', '#ffd23f'], kind: 'snow', art: true,
      scene({ x, y, VW, VH, MS }) {
        snowfall(VW / 2, 0, VW, 26, { fall: VH * 0.7, ms: MS });
        const gy = Math.min(VH - 60, y + 170);
        band(VW / 2, gy + 50, VW + 40, 120, 'linear-gradient(#ffffff00, #ffffffee 30%, #dff4ff 60%, #9ac8ee)', MS, [0, 60]);
        for (let i = 0; i < 7; i++) {
          const el = fxSpawn(-40 - i * 70, gy, { cls: 'fxr-marcher', html: i === 0 ? '<span>👑</span>🐧' : '🐧', ms: MS + 40 });
          const frames = [];
          for (let k = 0; k <= 12; k++) frames.push({ transform: `translate(${(VW + 160) * k / 12}px, ${k % 2 ? -10 : 0}px) rotate(${k % 2 ? -8 : 8}deg)` });
          fxAnimate(el, frames, MS, 'linear');
        }
        for (let b = 0; b < 4; b++) later(250 + b * 330, () => { fxRing(x, y - 150, { color: '#ffd23f', size: 180, width: 6, ms: 380 }); sfx('footstep', 0.9, 0.9);
          slam(VW * (0.25 + b * 0.17), gy + 48, b % 2 ? 'RIGHT!' : 'LEFT!', { kind: 'snow', size: 22, ms: 420 }); });
      } },
    // Snow Owl Sage: shards of ice fly in from every edge and lock into a crystal ring round the victim
    'frost-nova': { dark: 'radial-gradient(ellipse at 50% 45%, #0d3b7acc 0%, #020814f2 70%)', colors: ['#7ae0ff', '#ffffff', '#ff7ad9'], kind: 'frost', art: true,
      scene({ x, y, VW, VH, MS }) {
        for (let i = 0; i < 14; i++) later(120 + i * 55, () => {
          const a = fxRand(0, Math.PI * 2), r = Math.max(VW, VH) * 0.7;
          aimFly([x + Math.cos(a) * r, y + Math.sin(a) * r], [x + Math.cos(a) * 60, y + Math.sin(a) * 60], { html: ICICLE, cls: 'fxr-icicle', ms: 420, scale: [1.4, 0.8] });
        });
        later(700, () => { for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2;
          show(x + Math.cos(a) * 110, y + Math.sin(a) * 110, CRYSTAL, { cls: 'fxr-crystal', size: [44, 66], ms: MS - 700, from: 0.2, to: 1, rise: 0 }); } });
        later(500, () => frostBloom(x, y, 260, MS - 500));
        for (let i = 0; i < 4; i++) later(300 + i * 280, () => fxRing(x, y, { color: pick(AURORA_COLS), size: 300 - i * 40, width: 5, ms: 500 }));
      } },
    // Winter Fenrir: an eclipse. A black maw slides across the full moon, leaving a burning corona; wolves howl
    'moon-eater': { dark: 'radial-gradient(ellipse at 50% 30%, #3a0a2acc 0%, #050008f6 70%)', colors: ['#ff5d8a', '#ffffff', '#7ae0ff'], kind: 'deep', art: false,
      scene({ x, y, VW, VH, MS }) {
        starfield(VW, VH, 16, MS, ['#fff', '#ff9ab8']);
        const mx = x, my = Math.max(100, y - 190);
        prop(mx, my, FULL_MOON, [210, 210], MS, { from: 'below', cls: 'fxr-moonglow', dist: 300 });
        const shade = fxSpawn(mx, my, { cls: 'fxr-eclipse', ms: MS, size: [206, 206] });
        fxAnimate(shade, [{ transform: 'translate(-260px, 40px)', opacity: 0 }, { transform: 'translate(-200px, 30px)', opacity: 1, offset: 0.3 },
          { transform: 'translate(0, 0)', opacity: 1, offset: 0.75 }, { transform: 'translate(0, 0) scale(1.05)', opacity: 0 }], MS, 'ease-in-out');
        later(MS * 0.72, () => { const c = fxSpawn(mx, my, { cls: 'fxr-corona', ms: 520, size: [250, 250] });
          fxAnimate(c, [{ transform: 'scale(0.8)', opacity: 0 }, { transform: 'scale(1.05)', opacity: 1, offset: 0.3 }, { transform: 'scale(1.3)', opacity: 0 }], 500); });
        [[-1, VW * 0.12], [1, VW * 0.88]].forEach(([sd, wx]) => later(420, () => {
          const w = fxSpawn(wx, VH - 70, { cls: 'fxr-silhouette fxr-howler', html: `<span style="display:inline-block;transform:scaleX(${-sd})">🐺</span>`, ms: MS - 400 });
          fxAnimate(w, [{ transform: 'translate(0, 60px)', opacity: 0 }, { transform: 'translate(0, 0)', opacity: 1, offset: 0.3 }, { transform: 'translate(0, -4px) rotate(-6deg)', opacity: 1, offset: 0.8 }, { opacity: 0 }], MS - 400);
        }));
      } },
    // Walrus Warlord: the sea rises and a colossal iceberg surfaces, water pouring off it
    'iceberg-toss': { dark: 'linear-gradient(#0d2a5acc, #02081af4)', colors: ['#bfe6ff', '#ffffff', '#1f7ad6'], kind: 'frost', art: false,
      scene({ x, y, VW, VH, MS }) {
        const sy = Math.min(VH - 40, y + 190);
        band(VW / 2, sy + 60, VW + 40, 170, SEA, MS, [0, 90]);
        const berg = prop(x, sy - 60, CRYSTAL, [150, 220], MS, { from: 'below', cls: 'fxr-berg', dist: 220 });
        for (let i = 0; i < 5; i++) later(300 + i * 160, () => fxParticles(x + fxRand(-60, 60), sy - 40, { count: 10, cls: 'fxr-shard', colors: ['#7ad7ff', '#ffffff'], spread: 120, gravity: 200, angle: -90, cone: 120, ms: 700, size: [6, 11] }));
        later(400, () => fxShake(berg, 5, 800));
        for (let i = 0; i < 3; i++) later(200 + i * 300, () => fxRing(x, sy, { color: '#bfefff', size: 260 + i * 60, width: 5, ms: 600 }));
      } },
    // Glacier Titan: frost walls slide in from every edge, a thermometer plunges, a giant snowflake forms
    'absolute-zero': { dark: 'radial-gradient(ellipse at 50% 45%, #1f5fbfaa 0%, #02081af6 75%)', colors: ['#ffffff', '#bfe6ff', '#7ae0ff'], kind: 'frost', art: false,
      scene({ x, y, VW, VH, MS }) {
        // Frost creeps in from every edge (soft gradients that fade toward the middle), cracking as it spreads
        const wall = deg => `linear-gradient(${deg}deg, #fffffff2 0, #dff4ffcc 25%, #7ab8ff66 60%, #7ab8ff00)`;
        band(70, VH / 2, 140, VH + 40, wall(90), MS, [-140, 0]); band(VW - 70, VH / 2, 140, VH + 40, wall(270), MS, [140, 0]);
        band(VW / 2, 60, VW + 40, 120, wall(180), MS, [0, -120]); band(VW / 2, VH - 60, VW + 40, 120, wall(0), MS, [0, 120]);
        [[60, 80], [VW - 60, 80], [60, VH - 80], [VW - 60, VH - 80]].forEach(([cx, cy], i) => later(300 + i * 90, () => crackBurst(cx, cy, 180, 'ice', fxRand(0, 60), MS - 400)));
        const th = prop(x - 150, y - 60, THERMO, [60, 200], MS, { from: 'above', dist: 200 });
        later(500, () => slam(x - 150, y + 70, '-273°', { kind: 'deep', size: 30, ms: 900 }));
        later(250, () => frostBloom(x, y, 300, MS - 250));
        snowfall(VW / 2, 0, VW, 20, { fall: VH * 0.8, ms: MS });
      } },
    // Scarab King: dawn breaks. A blazing sun climbs over the horizon, lens flares streaking across the screen
    'solar-flare': { dark: 'linear-gradient(#5a2a00cc, #1a0600f0)', colors: ['#fff6a0', '#ffd23f', '#ff8a1f'], kind: 'sun', art: false, rays: '#ffd23f',
      scene({ x, y, VW, VH, MS }) {
        const sy = Math.max(110, y - 180);
        band(VW / 2, VH - 70, VW + 40, 200, 'linear-gradient(#ff8a1f00, #ff8a1f99 30%, #3a1000ee)', MS, [0, 60]);
        prop(x, sy, SUN, [230, 230], MS, { from: 'below', cls: 'fxr-sunglow', dist: VH * 0.5, spin: 40 });
        for (let i = 0; i < 4; i++) later(500 + i * 90, () => { const t = (i + 1) / 5;
          show(x + (VW * 0.2 - x) * t, sy + (VH * 0.8 - sy) * t, '', { cls: 'fxr-flare', size: [60 - i * 10, 60 - i * 10], ms: 900, from: 0.3, rise: 0 }); });
        for (let i = 0; i < 3; i++) later(300 + i * 280, () => heatWave(x, sy, 300));
      } },
    // Lava Basilisk: the ground splits into glowing cracks, bubbles pop and lava spurts up everywhere
    'magma-geyser': { dark: 'linear-gradient(#3a0a00cc, #0e0200f4)', colors: ['#ffb300', '#ff3d00', '#fff3a0'], kind: 'lava', art: false,
      scene({ x, y, VW, VH, MS }) {
        const gy = Math.min(VH - 60, y + 160);
        band(VW / 2, gy + 50, VW + 40, 120, 'linear-gradient(#5a2a1a, #1a0806)', MS, [0, 70]);
        for (let i = 0; i < 6; i++) later(150 + i * 120, () => { const cx = VW * (0.1 + i * 0.16) + fxRand(-20, 20);
          crackBurst(cx, gy + 20, 140, 'lava', fxRand(0, 60), MS - 150 - i * 120); fxShake(ctx0.panel, 4, 200); });
        for (let i = 0; i < 5; i++) later(500 + i * 160, () => lavaJet(VW * (0.15 + i * 0.18), gy + 10, fxRand(90, 170), { ms: 480, width: 22 }));
      } },
    // Cinder Roc: black clouds roll over, lightning cracks down, and burning cinders rain
    'cinder-storm': { dark: 'linear-gradient(#1a1418ee, #050204f6)', colors: ['#fff6a0', '#ffb300', '#ff5a00'], kind: 'ash', art: false,
      scene({ x, y, VW, VH, MS }) {
        for (let i = 0; i < 10; i++) later(i * 50, () => smoke(VW * (i / 9), fxRand(70, 130), 2, { size: 190, spread: 60, rise: 30, ms: MS }));
        [300, 620, 900, 1150, 1420].forEach((t, i) => later(t, () => {
          const last = i === 4, bx = last ? x : fxRand(VW * 0.1, VW * 0.9), by = last ? y : fxRand(VH * 0.45, VH * 0.85), top = 100;
          const b = fxSpawn(bx, (top + by) / 2, { cls: 'fxr-svg fxr-bolt', html: BOLT, ms: 380, size: [56, by - top] });
          fxAnimate(b, [{ opacity: 0 }, { opacity: 1, offset: 0.1 }, { opacity: 0.3, offset: 0.3 }, { opacity: 1, offset: 0.5 }, { opacity: 0 }], 380, 'linear');
          fxRing(bx, by, { color: '#fff6a0', size: 120, width: 5, ms: 360 }); sparks(bx, by, { count: 10, spread: 80 });
          flash('#fff6a0', 0.35); sfx('lightning', 1 + i * 0.1, 0.4);
        }));
        for (let i = 0; i < 18; i++) later(200 + i * 70, () => aimFly([fxRand(0, VW), -20], [fxRand(0, VW), VH * fxRand(0.5, 0.9)], { cls: 'fxr-trail-fire', ms: 600, easing: 'ease-in' }));
      } },
    // Volcano Titan: a volcano rears up on the horizon and blows its top: a column of smoke and flying lava
    'eruption': { dark: 'linear-gradient(#4a1200cc, #0e0200f6)', colors: ['#ff8a1f', '#ffd23f', '#ff3d00'], kind: 'lava', art: false,
      scene({ x, y, VW, VH, MS }) {
        const vy = VH - 90, vw = Math.min(VW * 0.9, 460);
        prop(VW / 2, vy, VOLCANO, [vw, vw * 0.53], MS, { from: 'below', dist: 200 });
        later(500, () => { for (let i = 0; i < 4; i++) later(i * 150, () => lavaJet(VW / 2 + fxRand(-20, 20), vy - vw * 0.2, fxRand(220, 340), { ms: 600, width: 40 })); });
        later(450, () => smoke(VW / 2, vy - vw * 0.25, 8, { size: 120, rise: 260, spread: 80, ms: MS - 450 }));
        for (let i = 0; i < 5; i++) later(300 + i * 220, () => fxShake(ctx0.panel, 8, 220));
      } },
    // Twin-Headed Dragon: two dragon heads rise from the corners, glaring, fire gathering in their jaws
    'twin-inferno': { dark: 'radial-gradient(ellipse at 50% 50%, #5a1400cc 0%, #0e0200f4 70%)', colors: ['#ffb300', '#ff3d00', '#fff3a0'], kind: 'fire', art: false,
      scene({ x, y, VW, VH, MS }) {
        [[-1, VW * 0.18], [1, VW * 0.82]].forEach(([sd, hx]) => {
          const hy = VH - 120, el = fxSpawn(hx, hy, { cls: 'fxr-dragonhead', html: `<span style="display:inline-block;transform:scaleX(${-sd})">🐉</span>`, ms: MS + 40 });
          fxAnimate(el, [{ transform: 'translate(0, 200px) scale(0.6)', opacity: 0 }, { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0.35 },
            { transform: `translate(${-sd * 10}px, -8px) scale(1.05) rotate(${-sd * 6}deg)`, opacity: 1, offset: 0.7 }, { transform: 'scale(1.2)', opacity: 0 }], MS, 'ease-out');
          for (let i = 0; i < 4; i++) later(500 + i * 200, () => charge(hx - sd * 40, hy - 40, { colors: FIRE_COLS, n: 8, r: 90, ms: 260 }));
          later(400, () => flames(hx, hy + 60, { n: 4, w: 120, h: 70, ms: MS - 500 }));
        });
      } },
    // Dragon Emperor: the cosmos opens. A spinning galaxy, stars pulled into a newborn star that trembles
    'supernova': { dark: 'radial-gradient(ellipse at 50% 45%, #2a0a4acc 0%, #02000af8 70%)', colors: ['#ffd23f', '#ffffff', '#b07cff'], kind: 'gold', art: true, rays: '#fff6a0',
      scene({ x, y, VW, VH, MS }) {
        starfield(VW, VH, 30, MS, ['#fff', '#ffd23f', '#d9c2ff'], 1);
        const g = fxSpawn(x, y, { cls: 'fxr-galaxy', ms: MS, size: [Math.max(VW, VH) * 0.9, Math.max(VW, VH) * 0.9] });
        fxAnimate(g, [{ transform: 'scale(0.2) rotate(0deg)', opacity: 0 }, { transform: 'scale(1) rotate(120deg)', opacity: 0.9, offset: 0.4 },
          { transform: 'scale(0.5) rotate(340deg)', opacity: 1, offset: 0.9 }, { transform: 'scale(0.1) rotate(400deg)', opacity: 0 }], MS, 'ease-in');
        for (let i = 0; i < 6; i++) later(300 + i * 180, () => charge(x, y, { colors: ['#fff', '#ffd23f', '#b07cff'], n: 14, r: Math.max(VW, VH) * 0.5, ms: 420, html: '✦', size: [6, 12] }));
      } },
  };
  let ctx0 = {}; // the super move playing now (scenes shake its panel)
  const superSeen = new WeakMap(); // card -> last time its cinematic played (once per turn is plenty)
  async function superMove(card, ctx) {
    if (!card?.superMove) return;
    const t0 = performance.now();
    if (t0 - (superSeen.get(card) || -1e9) < 6000) return;
    superSeen.set(card, t0);
    const S = SUPER_SCENES[fxSlug(card)] || SUPER_SCENES['frost-nova'];
    const [a, b, c] = S.colors;
    const [x, y] = at(ctx), VW = innerWidth, VH = innerHeight, MS = 1700;
    const before = FX_MAX_NODES;
    FX_MAX_NODES = Math.max(before, 480); // room for every layer
    ctx0 = ctx;
    try {
      if (typeof banner === 'function') banner(`${card.art} SUPER MOVE: ${card.name.toUpperCase()} ${card.art}`, 'fire');
      sfx('dramatic'); later(700, () => sfx('strengthen', 1.1, 0.6));
      const dark = fxSpawn(0, 0, { cls: 'fx-tint', ms: MS + 250, style: { background: S.dark } });
      dark?.animate([{ opacity: 0 }, { opacity: 0.94, offset: 0.14 }, { opacity: 0.94, offset: 0.86 }, { opacity: 0 }], { duration: MS + 250, fill: 'forwards' });
      const edge = fxSpawn(0, 0, { cls: 'fx-tint', ms: MS, style: { background: vig(a + 'aa') } });
      edge?.animate([{ opacity: 0 }, { opacity: 0.6, offset: 0.2 }, { opacity: 0.3, offset: 0.45 }, { opacity: 0.9, offset: 0.8 }, { opacity: 0 }], { duration: MS, fill: 'forwards' });
      fxRun(S.scene, { x, y, VW, VH, MS, card });
      // The card's own art descends huge (for scenes without a centrepiece of their own), soaking up power
      const hx = x, hy = Math.max(110, y - 150);
      if (S.art) later(150, () => {
        if (S.rays) { const rays = fxSpawn(hx, hy, { cls: 'fxr-rays', ms: MS - 150, size: [360, 360], vars: { '--c': S.rays } });
          fxAnimate(rays, [{ transform: 'scale(0.2) rotate(0deg)', opacity: 0 }, { transform: 'scale(1) rotate(60deg)', opacity: 0.9, offset: 0.3 },
            { transform: 'scale(1.1) rotate(160deg)', opacity: 0.9, offset: 0.85 }, { transform: 'scale(1.6) rotate(200deg)', opacity: 0 }], MS - 150, 'linear'); }
        const art = fxSpawn(hx, hy, { cls: 'fxr-superart', html: card.art, ms: MS - 150, vars: { '--c': a } });
        fxAnimate(art, [{ transform: `translate(0, ${-hy - 120}px) scale(0.5) rotate(-30deg)`, opacity: 0 },
          { transform: 'translate(0, 0) scale(1.1) rotate(0deg)', opacity: 1, offset: 0.3 },
          { transform: 'translate(0, -6px) scale(1) rotate(-4deg)', opacity: 1, offset: 0.5 },
          { transform: 'translate(0, 4px) scale(1.06) rotate(4deg)', opacity: 1, offset: 0.7 },
          { transform: 'translate(0, 0) scale(1.35) rotate(0deg)', opacity: 1, offset: 0.9 },
          { transform: 'translate(0, 30px) scale(2.2)', opacity: 0 }], MS - 150, 'ease-in-out');
      });
      later(560, () => slam(x, Math.min(VH - 60, y + 90), card.name.toUpperCase() + '!', { kind: S.kind, size: 36, rotate: -4, ms: 1000, star: a }));
      later(1100, () => charge(x, y, { colors: [a, b, c], n: 16, r: 170, ms: 420 }));
      later(500, () => fxShake(ctx.panel, 6, 900));
      later(MS - 180, () => { flash(b, 0.7); haptic(120); fxRing(x, y, { color: b, size: 340, width: 10, ms: 420 }); });
      await wait(MS);
    } finally { FX_MAX_NODES = before; }
  }

  return {
    emojiHit, superMove,
    // helpers
    clamp, pick, later, wait, at, src, landXY, sizeOf, pow, dirOf, jolt, slotFace, faceJiggle, lunge, knock, remember, launchPoint,
    slam, stampPoint, plate, frame, artPop, show, glint, speedLines, slash, crackBurst, core, dim, shadow, reticle, charge, orbit,
    aimFly, dropIn, vig, VIG,
    // graphics
    FLAKE, FLAKE_AURORA, flakeSvg, ICICLE, CRYSTAL, MOON, FULL_MOON, SUN, FLAME, ROCK, OBSIDIAN, rockSvg, CRACK, crackSvg, starSvg,
    ICE_COLS, AURORA_COLS, FIRE_COLS,
    // frost pieces
    snowflakes, iceShards, sparkle, frostPuff, frostBloom, snowfall, icicleRain, iceBlock, aurora,
    // fire pieces
    flames, embers, sparks, smoke, lavaBlobs, rocks, ashFall, scorch, heatWave, lavaJet,
    // themed gimmick defaults
    frost, fire,
  };
})();
// The battle awaits this before a super move strikes (battle.js); never throws
const superMoveFx = (card, ctx) => RFX.superMove(card, ctx).catch(e => console.warn('super move fx failed', e));
