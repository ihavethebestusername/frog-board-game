// Card effects: Ice Lake boss - the Glacier Walrus's cards and those of its two evolutions, the Walrus Warlord
// and the Glacier Titan (see js/card-fx.js for when each hook fires, js/fx/region-kit.js for the RFX kit).
// The region's showpieces: deep glacier blues and ivory tusks. Falling glaciers, tusk spears, icicle storms,
// a seafood feast, freezing breath, tossed icebergs, ice quakes, a walrus stampede and absolute zero.
// Styles live in css/fx/ice-boss.css (every class and keyframe is prefixed fxib-).
(() => {
  const { clamp, later, wait, at, src, sizeOf, pow, dirOf, jolt, faceJiggle, lunge, knock, remember, launchPoint,
    slam, stampPoint, plate, frame, artPop, show, glint, speedLines, slash, crackBurst, core, dim, shadow, reticle, charge,
    orbit, aimFly, dropIn, VIG, FLAKE, ICICLE, CRYSTAL, snowflakes, iceShards, sparkle, frostPuff, frostBloom, snowfall,
    iceBlock, frost } = RFX;

  // ---------- Graphics (inline SVG / emoji, no image files) ----------
  const INK = '#0d3b7a';
  // A towering glacier: lit left faces, shaded right faces, snowy peaks and crevasses
  const GLACIER_EDGE = 'M4 116 L28 64 L42 74 L70 10 L92 48 L106 34 L134 80 L156 116 Z';
  const GLACIER = `<svg viewBox="0 0 160 120"><path d="${GLACIER_EDGE}" fill="#9fd4ff"/>` +
    '<path d="M70 10 L62 58 L54 116 L4 116 L28 64 L42 74 Z" fill="#e6f6ff"/><path d="M106 34 L104 74 L116 116 L156 116 L134 80 Z" fill="#6aaee8"/>' +
    '<path d="M70 10 L58 37 L64 33 L70 42 L77 32 L84 38 Z" fill="#fff"/><path d="M106 34 L99 46 L105 44 L110 50 L113 44 Z" fill="#fff"/>' +
    '<path d="M62 64 L72 82 L64 100 M92 60 L88 80 L96 96 M30 92 L40 100" fill="none" stroke="#4a8ee0" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M20 102 L32 78 M46 92 L56 66" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' +
    `<path d="${GLACIER_EDGE}" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/></svg>`;
  // A gigantic chunk of glacier (the thing that falls out of the sky), snow on top and a jagged underside
  const CHUNK_EDGE = 'M8 38 L26 10 L64 4 L100 14 L114 40 L104 70 L84 94 L62 80 L40 96 L16 72 Z';
  const CHUNK = `<svg viewBox="0 0 120 100"><path d="${CHUNK_EDGE}" fill="#9fd4ff"/>` +
    '<path d="M8 38 L26 10 L64 4 L100 14 L114 40 L66 44 Z" fill="#eaf8ff"/><path d="M114 40 L104 70 L84 94 L62 80 L66 44 Z" fill="#6aaee8"/>' +
    '<path d="M26 10 L64 4 L100 14 L92 22 L78 16 L64 25 L48 16 L34 23 Z" fill="#fff"/>' +
    '<path d="M66 44 L58 62 L64 78 M40 50 L30 66 M92 50 L98 62" fill="none" stroke="#4a8ee0" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M18 42 L30 22" stroke="#fff" stroke-width="4" stroke-linecap="round"/>' +
    `<path d="${CHUNK_EDGE}" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/></svg>`;
  // A long ivory tusk pointing right (flip = mirrored top-to-bottom, so a pair curves symmetrically)
  const tuskSvg = flip => `<svg viewBox="0 0 140 32"><g${flip ? ' transform="translate(0 32) scale(1 -1)"' : ''}>` +
    '<path d="M4 7 Q70 0 137 17 Q70 27 4 25 Z" fill="#fff8e6" stroke="#5a4020" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M10 21 Q70 23 124 17" fill="none" stroke="#e6d2a8" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M18 10 Q66 5 112 13" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' +
    '<rect x="1" y="5" width="13" height="22" rx="5" fill="#c9a36a" stroke="#5a4020" stroke-width="3"/>' +
    '<path d="M5.5 9 V23 M9.5 9 V23" stroke="#8a6a3a" stroke-width="1.5"/></g></svg>';
  const TUSK = tuskSvg(false), TUSK_M = tuskSvg(true);
  // The puncture a tusk leaves: a four-point burst with a cold hole in the middle
  const STAB = '<svg viewBox="-50 -50 100 100"><path d="M0 -46 L9 -9 L46 0 L9 9 L0 46 L-9 9 L-46 0 L-9 -9 Z" fill="#fff" stroke="#1f5fbf" stroke-width="4" stroke-linejoin="round"/>' +
    `<circle r="10" fill="${INK}"/><circle r="5" fill="#7ae0ff"/></svg>`;
  // An icicle hanging point-down, with a cap of snow
  const ICICLE_DOWN = '<svg viewBox="0 0 30 90" preserveAspectRatio="none"><path d="M2 3 H28 L16 88 Z" fill="#dff4ff" stroke="#1f5fbf" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M7 7 L15 70 L12 7 Z" fill="#fff"/><path d="M22 8 L17 50" stroke="#8fc8ff" stroke-width="2"/>' +
    '<path d="M0 3 Q15 12 30 3" fill="#fff" stroke="#1f5fbf" stroke-width="2.5" stroke-linejoin="round"/></svg>';
  // The tip of an iceberg (what shows above the water)
  const BERG_TOP = '<svg viewBox="0 0 120 90" preserveAspectRatio="none"><path d="M4 90 L22 46 L36 54 L58 6 L80 40 L92 30 L116 90 Z" fill="#e6f6ff"/>' +
    '<path d="M58 6 L80 40 L92 30 L116 90 L70 90 L64 48 Z" fill="#a8d8ff"/><path d="M58 6 L50 27 L57 23 L62 31 Z" fill="#fff"/>' +
    '<path d="M30 70 L38 58 M84 62 L90 74" stroke="#6aaee8" stroke-width="3" stroke-linecap="round"/>' +
    `<path d="M4 90 L22 46 L36 54 L58 6 L80 40 L92 30 L116 90" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/></svg>`;
  // A whole iceberg (peaks above a wet waterline, the big blue bulk that hides underwater)
  const BERG_EDGE = 'M10 72 L30 34 L44 44 L66 6 L90 38 L104 26 L130 72 L118 102 L84 124 L42 120 L18 98 Z';
  const ICEBERG = `<svg viewBox="0 0 140 130"><path d="${BERG_EDGE}" fill="#4a96e6"/>` +
    '<path d="M10 72 L30 34 L44 44 L66 6 L90 38 L104 26 L130 72 Z" fill="#e6f6ff"/><path d="M66 6 L90 38 L104 26 L130 72 L74 72 L70 40 Z" fill="#b8e0ff"/>' +
    '<path d="M10 72 L130 72 L118 102 L84 124 L42 120 L18 98 Z" fill="#2a78d6"/><path d="M66 6 L58 25 L65 21 L70 29 L75 20 Z" fill="#fff"/>' +
    '<path d="M10 72 Q24 66 38 72 T66 72 T94 72 T122 72" fill="none" stroke="#dff4ff" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M40 86 L58 100 M86 88 L98 104 M64 108 L70 116" stroke="#7ac8ff" stroke-width="3" stroke-linecap="round"/>' +
    `<path d="${BERG_EDGE}" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/></svg>`;
  // An ice spike jutting up out of the ground (stretches to whatever box it's given)
  const SPIKE = '<svg viewBox="0 0 40 100" preserveAspectRatio="none"><path d="M20 2 L37 98 L3 98 Z" fill="#bfe6ff"/><path d="M20 2 L15 98 L3 98 Z" fill="#fff"/>' +
    `<path d="M20 4 L26 98" stroke="#7ab8ff" stroke-width="2"/><path d="M20 2 L37 98 L3 98 Z" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/></svg>`;
  // A jagged crack running across a floor
  const FLOOR_CRACK = '<svg viewBox="0 0 200 30" preserveAspectRatio="none">' + [['#1f5fbf', 7], ['#ffffff', 3]].map(([c, w]) =>
    `<g fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"><polyline points="2,15 22,10 36,19 54,8 72,17 90,11 106,21 124,9 142,18 160,10 178,19 198,14"/>` +
    '<path d="M54 8 L60 1 M106 21 L112 29 M142 18 L150 27 M90 11 L94 3"/></g>').join('') + '</svg>';
  // A giant thermometer: glass at the back, then the mercury (divs, so it can drop), then the outline and scale
  const THERMO = '<svg viewBox="0 0 60 200"><rect x="17" y="5" width="26" height="160" rx="13" fill="#f4fbff"/><circle cx="30" cy="169" r="23" fill="#f4fbff"/>' +
    '<circle cx="30" cy="169" r="15" fill="#2a8ae8"/></svg><div class="fxib-merc fxib-cold"></div><div class="fxib-merc fxib-hot"></div><div class="fxib-bulb"></div>' +
    `<svg viewBox="0 0 60 200"><path d="M17 150 V18 A13 13 0 0 1 43 18 V150 A23 23 0 1 1 17 150 Z" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` +
    `<path d="M47 30 H55 M47 50 H52 M47 70 H55 M47 90 H52 M47 110 H55 M47 130 H52" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>` +
    '<path d="M22 24 V140" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".9"/><circle cx="22" cy="163" r="4" fill="#fff" opacity=".85"/></svg>';
  // A chubby cartoon walrus facing right (flip = facing left): big tusks, whiskers and a determined eyebrow
  const walrusSvg = flip => `<svg viewBox="0 0 120 90"><g${flip ? ' transform="translate(120 0) scale(-1 1)"' : ''}>` +
    '<path d="M14 62 Q0 52 4 44 Q14 50 20 60 Z" fill="#7a4a30" stroke="#3a2010" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M12 70 Q8 36 40 26 Q70 16 92 30 Q114 42 112 62 Q110 82 86 84 L28 84 Q12 82 12 70 Z" fill="#a0704c" stroke="#3a2010" stroke-width="4" stroke-linejoin="round"/>' +
    '<path d="M30 78 Q60 70 92 78" fill="none" stroke="#c8966e" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="M56 78 Q62 90 76 88 Q70 80 70 74 Z" fill="#7a4a30" stroke="#3a2010" stroke-width="3" stroke-linejoin="round"/>' +
    '<ellipse cx="98" cy="56" rx="14" ry="10" fill="#d8aa80" stroke="#3a2010" stroke-width="3"/>' +
    '<path d="M91 62 L89 87 L97 64 Z M102 62 L104 87 L109 61 Z" fill="#fffaf0" stroke="#3a2010" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<ellipse cx="108" cy="50" rx="4.5" ry="3.2" fill="#3a2010"/><circle cx="86" cy="40" r="4.5" fill="#1a0a04"/><circle cx="87.5" cy="38.5" r="1.6" fill="#fff"/>' +
    '<path d="M79 32 L93 36" stroke="#3a2010" stroke-width="3.2" stroke-linecap="round"/>' +
    '<g fill="#3a2010"><circle cx="93" cy="55" r="1.3"/><circle cx="98" cy="59" r="1.3"/><circle cx="103" cy="55" r="1.3"/></g></g></svg>';
  const WALRUS = walrusSvg(false), WALRUS_L = walrusSvg(true);
  // A crown of seawater thrown up by a big splash
  const SPLASH = '<svg viewBox="0 0 120 80"><path d="M6 78 Q12 44 22 60 Q28 22 42 52 Q50 4 60 48 Q70 4 78 52 Q92 22 98 60 Q108 44 114 78 Z" fill="#7ac8ff" stroke="#1f5fbf" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M22 78 Q30 56 40 66 Q52 34 60 64 Q68 34 80 66 Q90 56 98 78 Z" fill="#dff4ff"/>' +
    '<g fill="#7ac8ff" stroke="#1f5fbf" stroke-width="2"><circle cx="30" cy="14" r="5"/><circle cx="60" cy="5" r="4"/><circle cx="90" cy="12" r="5"/></g></svg>';
  const SEAFOOD = ['🐟', '🐠', '🦐', '🦑'];
  const FLAKE_I = () => `<i class="fxr-flake">${FLAKE}</i>`;
  const VIG_ABYSS = 'radial-gradient(ellipse at 50% 50%, #0a2a6a99 0 30%, #020a1ef2 100%)';

  // ---------- Small helpers ----------
  const cardXY = ctx => fxPoint(ctx.slot || ctx.win);      // the card that just landed
  const winXY = ctx => fxPoint(ctx.win || ctx.slot);       // its whole wheel window
  const winSize = ctx => sizeOf(ctx.win, 90, 180);
  // The boss's richer name plate (the kit's frost plate plus an icicle fringe)
  const bossPlate = (ctx, text, color) => plate(ctx, text, color, 'frost fxib-plate');
  // fxFly / aimFly bow their arc along the path's normal: pick the sign that bows it UP the screen
  const upArc = (a, b, h) => (dirOf(a, b).ny > 0 ? -h : h);
  // A huge stamped word under the victim, nudged sideways so it never runs off the edge of the screen
  function stamp(ctx, text, { dx = 0, dy = 0, size = 44, ...opts } = {}) {
    const [sx, sy] = stampPoint(ctx, dx), half = text.length * size * 0.27 + 10;
    const x = innerWidth > half * 2 ? clamp(sx, half, innerWidth - half) : innerWidth / 2;
    return slam(x, sy + dy, text, { size, ...opts });
  }
  // Blue-and-white hazard tape slapped across a reel: the boss's danger warning
  function tape(x, y, w, text, ms = 950) {
    const el = fxSpawn(x, y, { cls: 'fxib-tape', html: `<span>${text}</span>`, ms, size: [w, 26] });
    fxAnimate(el, [
      { transform: 'rotate(-9deg) scaleX(0.1)', opacity: 0 },
      { transform: 'rotate(-9deg) scaleX(1.08)', opacity: 1, offset: 0.18 },
      { transform: 'rotate(-9deg) scaleX(1)', opacity: 1, offset: 0.3 },
      { transform: 'rotate(-9deg) scaleX(1)', opacity: 1, offset: 0.8 },
      { transform: 'translate(0, 10px) rotate(-13deg) scaleX(1)', opacity: 0 },
    ], ms, 'ease-out');
  }
  // A graphic whose base sits on (x, y) and that grows straight up out of it (spikes, splashes)
  function sprout(x, y, html, [w, h], { cls = '', ms = 700, rot = 0 } = {}) {
    const el = fxSpawn(x, y - h / 2, { cls: 'fxr-svg ' + cls, html, ms: ms + 40, size: [w, h], style: { transformOrigin: '50% 100%' } });
    return fxAnimate(el, [
      { transform: `rotate(${rot}deg) scale(0.4, 0)`, opacity: 1 },
      { transform: `rotate(${rot}deg) scale(1.06, 1.16)`, opacity: 1, offset: 0.2 },
      { transform: `rotate(${rot}deg) scale(1, 1)`, opacity: 1, offset: 0.34 },
      { transform: `rotate(${rot}deg) scale(1, 1)`, opacity: 1, offset: 0.74 },
      { transform: `rotate(${rot}deg) scale(0.85, 0.25)`, opacity: 0 },
    ], ms, 'ease-out');
  }
  const spike = (x, y, h, rot = 0, ms = 640) => sprout(x, y, SPIKE, [h * 0.36, h], { cls: 'fxib-spike', ms, rot });
  // A graphic breaking apart: each piece (a clip-path of the whole) flies off its own way and tumbles down
  function breakApart(x, y, html, [w, h], pieces, { ms = 820, spread = 90 } = {}) {
    pieces.forEach(([clip, dx, dy]) => {
      const el = fxSpawn(x, y, { cls: 'fxr-svg fxib-piece', html, ms: ms + 40, size: [w, h], style: { clipPath: clip } });
      fxAnimate(el, [
        { transform: 'translate(0, 0) rotate(0deg) scale(1)', opacity: 1 },
        { transform: `translate(${dx * spread * 0.55}px, ${dy * spread * 0.4 - 34}px) rotate(${dx * 45}deg) scale(1.02)`, opacity: 1, offset: 0.4 },
        { transform: `translate(${dx * spread}px, ${dy * spread * 0.5 + 70}px) rotate(${dx * 120}deg) scale(0.85)`, opacity: 0 },
      ], ms, 'cubic-bezier(.2,.7,.5,1)');
    });
  }
  const HALVES = [['polygon(0 0, 52% 0, 44% 32%, 57% 58%, 46% 100%, 0 100%)', -1, 0], ['polygon(52% 0, 100% 0, 100% 100%, 46% 100%, 57% 58%, 44% 32%)', 1, 0]];
  const QUARTERS = [['polygon(0 0, 55% 0, 46% 52%, 0 44%)', -1, -1], ['polygon(55% 0, 100% 0, 100% 50%, 46% 52%)', 1, -1],
    ['polygon(0 44%, 46% 52%, 40% 100%, 0 100%)', -0.7, 0.6], ['polygon(46% 52%, 100% 50%, 100% 100%, 40% 100%)', 0.7, 0.6]];
  // Chunky glassy ice boulder bits, tumbling
  const chunks = (x, y, { count = 10, spread = 160, gravity = 150, size = [10, 22], ms = 800, angle = -90, cone = 300 } = {}) =>
    fxParticles(x, y, { count, cls: 'fxib-bit', colors: ['#bfe6ff'], size, spread, gravity, ms, angle, cone, spin: 600 });
  // Seawater droplets thrown up and falling back
  const water = (x, y, { count = 10, spread = 110, gravity = 180, ms = 700, angle = -90, cone = 140, size = [5, 10] } = {}) =>
    fxParticles(x, y, { count, cls: 'fxib-drop', colors: ['#7ac8ff', '#dff4ff', '#3a8ae0', '#ffffff'], size, spread, gravity, ms, angle, cone, spin: 0 });
  // A flat shockwave ring spreading over the ground
  function groundRing(x, y, size, color = '#fff', ms = 520, width = 5) {
    const el = fxSpawn(x, y, { cls: 'fxib-flatring', ms, size: [size, size * 0.34], style: { borderColor: color, borderWidth: width + 'px' } });
    fxAnimate(el, [{ transform: 'scale(0.15)', opacity: 1 }, { transform: 'scale(1)', opacity: 0 }], ms, 'cubic-bezier(.1,.8,.3,1)');
  }
  // A drop of meltwater falling from (x, y) and splatting `fall` px below
  function drip(x, y, fall, ms = 560) {
    const el = fxSpawn(x, y, { cls: 'fxib-drip', ms: ms + 40, size: [7, 10] });
    fxAnimate(el, [
      { transform: 'translate(0, 0) scale(0.3)', opacity: 0 },
      { transform: 'translate(0, 2px) scale(1)', opacity: 1, offset: 0.25 },
      { transform: `translate(0, ${fall}px) scale(0.8, 1.3)`, opacity: 1, offset: 0.9 },
      { transform: `translate(0, ${fall}px) scale(1.8, 0.3)`, opacity: 0 },
    ], ms, 'ease-in');
  }
  // A puff of freezing breath billowing from a to b, swelling and thinning out as it goes
  function breath(a, b, { ms = 420, from = 0.4, to = 2, end = 0 } = {}) {
    const el = fxSpawn(a[0], a[1], { cls: 'fxib-breath', ms: ms + 40 });
    const dx = b[0] - a[0], dy = b[1] - a[1];
    return fxAnimate(el, [
      { transform: `translate(0, 0) scale(${from})`, opacity: 0.2 },
      { transform: `translate(${dx * 0.3}px, ${dy * 0.3}px) scale(${from + (to - from) * 0.3})`, opacity: 0.95, offset: 0.25 },
      { transform: `translate(${dx}px, ${dy}px) scale(${to})`, opacity: end },
    ], ms, 'ease-out');
  }
  // A cone of freezing breath fanning out from a toward b (anchored at a, like a beam)
  function cone(a, b, width, ms = 420) {
    const d = dirOf(a, b), el = fxSpawn(a[0], a[1], { cls: 'fxib-cone', ms, size: [d.len * 1.1, width] });
    if (!el) return;
    el.style.transformOrigin = '0 50%';
    el.animate([
      { transform: `translate(0, -50%) rotate(${d.ang}deg) scale(0, 0.3)`, opacity: 0.3 },
      { transform: `translate(0, -50%) rotate(${d.ang}deg) scale(1, 0.85)`, opacity: 0.95, offset: 0.5 },
      { transform: `translate(0, -50%) rotate(${d.ang}deg) scale(1.03, 1.1)`, opacity: 0 },
    ], { duration: ms, easing: 'ease-out', fill: 'forwards' });
  }
  // A walrus bouncing along from a to b, squashing flat on every landing. Resolves when it gets there;
  // `after(el, dx, dy)` can keep animating it (the element lives on for another 480 ms)
  function walrusRun(a, b, { size = 60, ms = 500, hops = 3, hopH = 24, fade = false, after = null } = {}) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const el = fxSpawn(a[0], a[1], { cls: 'fxr-svg fxib-walrus', html: dx < 0 ? WALRUS_L : WALRUS, ms: ms + (after ? 480 : 40),
      size: [size, size * 0.75], style: { transformOrigin: '50% 100%' } });
    if (!el) return Promise.resolve();
    const frames = [], N = hops * 4;
    for (let i = 0; i <= N; i++) {
      const t = i / N, air = Math.sin(Math.PI * ((t * hops) % 1)); // 0 on the ground, 1 at the top of a hop
      const sq = i % 4 === 0 ? 'scale(1.16, 0.84)' : i % 4 === 2 ? 'scale(0.93, 1.1)' : 'scale(1)';
      frames.push({ transform: `translate(${dx * t}px, ${dy * t - air * hopH}px) ${sq}`, opacity: fade && (i === 0 || i === N) ? 0 : 1 });
    }
    const run = fxAnimate(el, frames, ms, 'linear');
    run.then(() => (after ? after(el, dx, dy) : el.remove()));
    return run;
  }
  // A frosty rime spreading over a box (the victim's HP box, a card)
  function rime(x, y, w, h, { ms = 900, cls = 'fxib-coat', origin = '50% 50%' } = {}) {
    const el = fxSpawn(x, y, { cls, ms, size: [w, h], style: { transformOrigin: origin } });
    fxAnimate(el, [
      { transform: 'scale(0.7, 0.2)', opacity: 0 },
      { transform: 'scale(1.03, 1.04)', opacity: 1, offset: 0.22 },
      { transform: 'scale(1)', opacity: 0.95, offset: 0.72 },
      { transform: 'scale(1.04)', opacity: 0 },
    ], ms, 'ease-out');
    return el;
  }
  // Shivering: the victim's box rattles side to side
  const shiver = (el, px = 4, ms = 600) => jolt(el, [0, -1, 1, -0.8, 0.8, -0.6, 0.6, -0.3, 0].map(v => ({ transform: `translateX(${v * px}px)` })), ms);

  // ================= Glacier Slam (x7, cleave): a gigantic chunk of glacier falls out of the sky =================
  CARD_FX['glacier-slam'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = cardXY(ctx), [w, h] = winSize(ctx);
      fxTint(VIG.deep, { ms: 900, opacity: 0.65 });
      frame(ctx.win, '#7ae0ff', 900);
      // The glacier heaves up out of the card and towers over the reel
      const GW = w * 1.7, GH = GW * 0.75, base = y + 34;
      const g = fxSpawn(x, base - GH / 2, { cls: 'fxr-svg fxib-glacier', html: GLACIER, ms: 1000, size: [GW, GH], style: { transformOrigin: '50% 100%' } });
      fxAnimate(g, [
        { transform: 'translate(0, 30px) scale(0.4, 0.05)', opacity: 0 },
        { transform: 'translate(0, -6px) scale(1.06, 1.14)', opacity: 1, offset: 0.24 },
        { transform: 'translate(0, 0) scale(0.98, 0.96)', opacity: 1, offset: 0.36 },
        { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0.82 },
        { transform: 'translate(0, -12px) scale(0.96)', opacity: 0 },
      ], 1000, 'ease-out');
      later(240, () => {
        frostPuff(x, base, 4, { size: 54, spread: GW * 0.6 });
        iceShards(x, base - 10, { count: 12, spread: 120, angle: -90, cone: 160, gravity: 140 });
        snowflakes(x, base - GH * 0.6, { count: 6, spread: 90, gravity: 50 });
        fxShake(ctx.panel, 8, 320);
        sfx('big_hit', 0.4, 0.45); // the ice groans as it rises
      });
      later(420, () => glint(g));
      tape(x, y - h * 0.36, w * 1.45, '⚠ FALLING ICE ⚠');
      bossPlate(ctx, '🏔️ GLACIER SLAM', '#7ae0ff');
    },
    // Cleave (before the hit): the kit's ice spike smashes the shields, and the glacier's teeth punch up through them
    gimmick(ctx) {
      frost.smash(ctx, { word: 'SHATTERED!' });
      const [tx, ty] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46);
      if (!ctx.blocked) { later(120, () => sparkle(tx, ty, { count: 6, spread: w * 0.5 })); return; }
      [-0.42, 0, 0.42].forEach((o, i) => later(80 + i * 45, () => spike(tx + o * w, ty + h * 0.5 + 6, i === 1 ? 74 : 52, o * 50, 480)));
    },
    // Lock-on, a growing shadow and loose snow tumbling down... then the chunk drops out of the sky
    windup(ctx) {
      const [tx, ty] = at(ctx), s = ctx.crit ? 1.2 : 1, [bw, bh] = sizeOf(ctx.to, 200, 46);
      reticle(tx, ty, '#7ae0ff', 440);
      dim(VIG.deep, ctx.crit ? 0.8 : 0.6, 460);
      shadow(tx, ty + bh * 0.3, bw * 1.1, 40, 400);
      snowfall(tx, ty - 170, bw, 5, { fall: 150, ms: 500 });
      later(60, () => sfx('big_hit', 0.35, 0.5)); // rumble
      return dropIn(tx, ty - 10, CHUNK, { cls: 'fxr-svg fxib-chunk', ms: 400, scale: [0.5, 1.55 * s], spin: 20, trail: 'fxr-trail-snow' });
    },
    // The chunk splits in two in a massive ice explosion
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit, [bw, bh] = sizeOf(ctx.to, 200, 46);
      flash('#dff4ff', crit ? 0.6 : 0.4);
      fxTint('#2a6ad1', { ms: 450, opacity: crit ? 0.45 : 0.3 });
      core(tx, ty, 190 * p, 'frost', 460);
      breakApart(tx, ty - 14, CHUNK, [120 * Math.min(1.5, p), 100 * Math.min(1.5, p)], HALVES, { spread: 110 * p });
      crackBurst(tx, ty + 8, 230 * p, 'ice', fxRand(-20, 20), 1000);
      for (let i = 0; i < 3; i++) later(i * 90, () => fxRing(tx, ty, { color: ['#ffffff', '#7ae0ff', '#2a6ad1'][i], size: (170 + i * 110) * p, width: 11 - i * 3, ms: 560 }));
      iceShards(tx, ty, { count: 20, spread: 200 * p, size: [10, 20], gravity: 130 });
      chunks(tx, ty, { count: 10, spread: 170 * p });
      later(80, () => snowflakes(tx, ty, { count: 8, spread: 160 * p }));
      frostPuff(tx, ty + bh * 0.4, 5, { size: 70, spread: bw * 0.8 });
      speedLines(tx, ty, { n: 10, r0: 50, r1: 170 * Math.min(1.4, p), cls: 'fxr-line-ice', width: 5 });
      jolt(ctx.to, [{ transform: 'none' }, { transform: 'translateY(10px) scale(1.06, 0.86)', offset: 0.2 }, { transform: 'translateY(-4px) scale(0.98, 1.04)', offset: 0.5 }, { transform: 'none' }], 420);
      stamp(ctx, crit ? 'GLACIER CRUSH!!' : 'GLACIER SLAM!', { kind: 'frost fxib-glacier', size: crit ? 42 : Math.min(46, 28 + 9 * p), rotate: -6, ms: 1000, star: '#bfe6ff' });
      fxShake(ctx.panel, Math.min(30, 16 * p), 560);
      fxShake(ctx.to, 16, 420);
      haptic(crit ? 140 : 100);
    },
  };

  // ================= Tusk Spear (x5, lifesteal): the walrus charges tusk-first and drains the cold back =================
  CARD_FX['tusk-spear'] = {
    // Two long ivory tusks cross over the card like spears and gleam
    land(ctx) {
      remember(ctx);
      const [x, y] = cardXY(ctx), [w] = winSize(ctx), L = w * 1.35;
      fxTint(VIG.frost, { ms: 700, opacity: 0.45 });
      frame(ctx.win, '#fff6e0', 800);
      [-58, -122].forEach((ang, i) => {
        const ox = Math.cos(ang * Math.PI / 180), oy = Math.sin(ang * Math.PI / 180);
        const el = fxSpawn(x, y, { cls: 'fxr-svg fxib-tusk', html: i ? TUSK_M : TUSK, ms: 950, size: [L, L * 0.23] });
        fxAnimate(el, [
          { transform: `translate(${-ox * 60}px, ${-oy * 60}px) rotate(${ang}deg) scale(0.6)`, opacity: 0 },
          { transform: `translate(${ox * 6}px, ${oy * 6}px) rotate(${ang}deg) scale(1.05)`, opacity: 1, offset: 0.25 },
          { transform: `translate(0, 0) rotate(${ang}deg) scale(1)`, opacity: 1, offset: 0.4 },
          { transform: `translate(0, 0) rotate(${ang}deg) scale(1)`, opacity: 1, offset: 0.8 },
          { transform: `translate(${ox * 16}px, ${oy * 16}px) rotate(${ang}deg) scale(1)`, opacity: 0 },
        ], 950, 'ease-out');
        // A glint runs up each tusk and twinkles at its tip
        later(330 + i * 90, () => {
          glint(el);
          show(x + ox * L * 0.47, y + oy * L * 0.47, '<b class="fxib-twinkle">✦</b>', { font: 30, ms: 420, from: 0.2, to: 1.3, spin: 90, rise: 0 });
        });
      });
      later(250, () => { sparkle(x, y, { count: 8, spread: 70, colors: ['#fff', '#fff6e0', '#bfe6ff'] }); sfx('saw', 2.6, 0.18); }); // shing!
      bossPlate(ctx, '🔱 TUSK SPEAR', '#fff6e0');
    },
    // The walrus charges: twin tusks thrust side by side along the charge, the walrus's box lunging after them
    windup(ctx) {
      const [tx, ty] = at(ctx), from = src(ctx), d = dirOf(from, [tx, ty]), s = ctx.crit ? 1.25 : 1, off = 13;
      lunge(ctx.from, [tx, ty], 34, 380);
      fxBeam(from, [tx, ty], { cls: 'fxib-charge', ms: 380, width: 40 });
      later(40, () => sfx('saw', 2.3, 0.2));
      return Promise.all([-1, 1].map(sd => aimFly([from[0] + d.nx * off * sd, from[1] + d.ny * off * sd],
        [tx + d.nx * off * sd - d.ux * 22, ty + d.ny * off * sd - d.uy * 22],
        { html: sd < 0 ? TUSK : TUSK_M, cls: 'fxr-svg fxib-tusk-fly', ms: 300, scale: [0.6, 1.1 * s], trail: sd < 0 ? 'fxr-trail-frost' : '',
          trailEvery: 30, easing: 'cubic-bezier(.6,0,.9,.5)' })));
    },
    // Two stab marks side by side, ice spraying on through and ivory sparks
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit, from = src(ctx), d = dirOf(from, [tx, ty]);
      core(tx, ty, 130 * p, 'white', 360);
      [-1, 1].forEach((sd, i) => {
        const px = tx + d.nx * 13 * sd, py = ty + d.ny * 13 * sd;
        later(i * 40, () => {
          slash(px, py, d.ang, 110 * p, 9, 'fxr-slash-ice');
          show(px + d.ux * 8, py + d.uy * 8, STAB, { cls: 'fxib-stab', size: [46 * Math.min(1.5, p), 46 * Math.min(1.5, p)], ms: 720, from: 0.2, to: 1, rise: 0, spin: 30 });
          crackBurst(px, py, 80 * p, 'ice', fxRand(0, 60), 700);
        });
      });
      iceShards(tx, ty, { count: 12, spread: 150 * p, angle: d.ang, cone: 120 });
      fxParticles(tx, ty, { count: 10, colors: ['#fff', '#fff6e0', '#bfe6ff', '#ffe9b0'], size: [3, 7], spread: 130 * p, gravity: 60, ms: 560 });
      fxRing(tx, ty, { color: '#fff6e0', size: 180 * p, width: 7 });
      later(80, () => fxRing(tx, ty, { color: '#7ae0ff', size: 250 * p, width: 4 }));
      knock(ctx.to, from, 24, 380);
      stamp(ctx, crit ? 'SKEWERED!!' : 'IMPALED!', { kind: 'frost fxib-ivory', size: crit ? 44 : Math.min(50, 30 + 11 * p), rotate: -5, ms: 900, star: crit ? '#fff6e0' : null });
      fxShake(ctx.panel, Math.min(22, 11 * p), 400);
      haptic(60);
    },
    // Lifesteal: cold wisps stream back into the walrus, and its tusks flash crossed over its box
    gimmick(ctx) {
      frost.lifesteal(ctx, { n: 9 });
      const [x, y] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46), L = Math.min(110, w * 0.7);
      later(430, () => {
        [-35, -145].forEach((ang, i) => fxAnimate(fxSpawn(x, y - h * 0.1, { cls: 'fxr-svg fxib-tusk', html: i ? TUSK_M : TUSK, ms: 620, size: [L, L * 0.23] }), [
          { transform: `rotate(${ang + (i ? 35 : -35)}deg) scale(0.5)`, opacity: 0 },
          { transform: `rotate(${ang}deg) scale(1.1)`, opacity: 1, offset: 0.3 },
          { transform: `rotate(${ang}deg) scale(1)`, opacity: 1, offset: 0.7 },
          { transform: `translate(0, -12px) rotate(${ang}deg) scale(0.95)`, opacity: 0 },
        ], 600, 'ease-out'));
        sparkle(x, y - h * 0.4, { count: 8, spread: w * 0.5, colors: ['#fff', '#fff6e0', '#7ae0ff'] });
        slam(x, y + h * 0.5 + 18, 'ICE DRAIN!', { kind: 'deep', size: 24, rotate: 4, ms: 750 });
        sfx('leech', 0.8, 0.45);
      });
    },
  };

  // ================= Icicle Barrage (x2, frenzy: 3 strikes): volleys of icicles, more every strike =================
  let volley = null; // where the current barrage strike's icicles are headed (its impact shatters them there)
  CARD_FX['icicle-barrage'] = {
    // Icicles grow down from the top of the wheel and drip
    land(ctx) {
      remember(ctx);
      const [x, y] = winXY(ctx), [w, h] = winSize(ctx), top = y - h * 0.5 + 4;
      frame(ctx.win, '#bfe6ff', 850);
      for (let i = 0; i < 5; i++) {
        const ix = x + (i - 2) * w * 0.2, len = h * (i % 2 ? 0.3 : 0.42) * fxRand(0.85, 1.1), ms = 980 - i * 40;
        later(i * 50, () => {
          const el = fxSpawn(ix, top + len / 2, { cls: 'fxr-svg fxib-icicle-down', html: ICICLE_DOWN, ms, size: [len * 0.3, len], style: { transformOrigin: '50% 0' } });
          fxAnimate(el, [
            { transform: 'scale(0.6, 0)', opacity: 0 },
            { transform: 'scale(1, 1.08)', opacity: 1, offset: 0.3 },
            { transform: 'scale(1, 1)', opacity: 1, offset: 0.45 },
            { transform: 'scale(1, 1)', opacity: 1, offset: 0.85 },
            { transform: 'scale(1, 1)', opacity: 0 },
          ], ms, 'ease-out');
          later(330, () => drip(ix, top + len, h * 0.5));
        });
      }
      later(200, () => sparkle(x, top + 24, { count: 8, spread: w * 0.6 }));
      later(160, () => slam(x, y + 6, '×3', { kind: 'frost', size: 40, rotate: -8, ms: 700 }));
      bossPlate(ctx, '🧊 ICICLE BARRAGE', '#bfe6ff');
      sfx('coin', 2.2, 0.22); // tinkle
    },
    // Frenzy (before the strikes): the kit's blizzard with hanging icicles orbiting the walrus, and more
    // icicles bristling out all around its box like a porcupine arming up
    gimmick(ctx) {
      frost.frenzy(ctx, { word: 'ICICLE STORM!', html: () => `<i class="fxib-oicicle">${ICICLE_DOWN}</i>` });
      const [x, y] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + 0.39, ex = Math.cos(a) * (w * 0.5 + 12), ey = Math.sin(a) * (h * 0.5 + 12);
        const deg = Math.atan2(ey, ex) * 180 / Math.PI, ux = Math.cos(deg * Math.PI / 180), uy = Math.sin(deg * Math.PI / 180);
        later(i * 25, () => fxAnimate(fxSpawn(x + ex, y + ey, { cls: 'fxr-icicle', html: ICICLE, ms: 720 }), [
          { transform: `rotate(${deg}deg) scale(0.2)`, opacity: 0 },
          { transform: `translate(${ux * 14}px, ${uy * 14}px) rotate(${deg}deg) scale(0.8)`, opacity: 1, offset: 0.3 },
          { transform: `translate(${ux * 10}px, ${uy * 10}px) rotate(${deg}deg) scale(0.75)`, opacity: 1, offset: 0.75 },
          { transform: `translate(${ux * 30}px, ${uy * 30}px) rotate(${deg}deg) scale(0.5)`, opacity: 0 },
        ], 700, 'ease-out'));
      }
    },
    // Strike s fires 2 + s icicles: the first straight out of the wheel, the rest from the walrus, on fanning arcs
    windup(ctx) {
      const s = clamp(ctx.strike || 0, 0, 2), n = 2 + s, [tx, ty] = at(ctx), ms = [300, 270, 240][s];
      const pts = [], flights = [];
      for (let i = 0; i < n; i++) {
        const from = i === 0 ? launchPoint(ctx) : [src(ctx)[0] + fxRand(-40, 40), src(ctx)[1] + fxRand(-20, 20)];
        const hit = [tx + fxRand(-26, 26), ty + fxRand(-12, 12)], arc = (i % 2 ? -1 : 1) * (30 + 22 * i);
        const d = dirOf(from, hit), deg = Math.atan2(d.dy - d.ny * arc * Math.PI, d.dx - d.nx * arc * Math.PI) * 180 / Math.PI;
        pts.push([hit[0], hit[1], deg]);
        flights.push(new Promise(r => later(i * 35, () => aimFly(from, hit, { html: ICICLE, cls: 'fxr-icicle', ms, arc, scale: [0.7, 1 + s * 0.15],
          trail: i === 0 ? 'fxr-trail-frost' : '', trailEvery: 30, easing: 'cubic-bezier(.4,0,.9,.6)' }).then(r))));
      }
      volley = { pts, t: performance.now() };
      if (s === 2) dim(VIG.frost, 0.6, 320);
      later(20, () => sfx('coin', 2.5 - s * 0.2, 0.18));
      return Promise.all(flights);
    },
    // The icicles stick in for a blink and burst into glitter: TINK! -> CRACK!! -> BARRAGE!!!
    impact(ctx) {
      const s = clamp(ctx.strike || 0, 0, 2), [tx, ty] = at(ctx), p = pow(ctx) + s * 0.2, crit = !!ctx.crit;
      const pts = volley && performance.now() - volley.t < 1500 ? volley.pts : Array.from({ length: 2 + s }, () => [tx + fxRand(-26, 26), ty + fxRand(-12, 12), fxRand(150, 210)]);
      pts.forEach(([hx, hy, deg], i) => later(i * 30, () => {
        const ux = Math.cos(deg * Math.PI / 180), uy = Math.sin(deg * Math.PI / 180);
        const el = fxSpawn(hx - ux * 28, hy - uy * 28, { cls: 'fxr-icicle', html: ICICLE, ms: 320 });
        fxAnimate(el, [
          { transform: `rotate(${deg}deg) scale(1.1)`, opacity: 1 },
          { transform: `rotate(${deg + 6}deg) scale(1.1)`, opacity: 1, offset: 0.2 },
          { transform: `rotate(${deg - 5}deg) scale(1.1)`, opacity: 1, offset: 0.4 },
          { transform: `rotate(${deg}deg) scale(1.2)`, opacity: 1, offset: 0.6 },
          { transform: `rotate(${deg}deg) scale(1.4)`, opacity: 0 },
        ], 300, 'linear');
        later(180, () => {
          iceShards(hx, hy, { count: 5 + s, spread: 70 + 25 * s, size: [5, 11], ms: 520 });
          fxRing(hx, hy, { color: '#dff4ff', size: 60 + 20 * s, width: 3, ms: 300 });
        });
      }));
      for (let i = 0; i <= s; i++) later(i * 70, () => fxRing(tx, ty, { color: i % 2 ? '#7ae0ff' : '#fff', size: (130 + 50 * i + 30 * s) * p, ms: 420, width: 6 }));
      sparkle(tx, ty, { count: 6 + s * 3, spread: 90 + 30 * s });
      stamp(ctx, ['TINK!', 'CRACK!!', 'BARRAGE!!!'][s], { dx: (s - 1) * 26, kind: s === 2 ? 'frost fxib-glacier' : 'snow',
        size: 30 + s * 10 + (crit ? 8 : 0), rotate: [-10, 8, -4][s], ms: 650 + s * 150, star: s === 2 ? '#bfe6ff' : null });
      fxShake(ctx.panel, 6 + s * 6, 260 + s * 60);
      fxShake(ctx.to, 6 + s * 3, 250);
      if (s === 2) {
        crackBurst(tx, ty, 200, 'ice', fxRand(-30, 30), 850);
        speedLines(tx, ty, { n: 10, r0: 60, r1: 170, cls: 'fxr-line-ice', width: 5 });
        snowflakes(tx, ty, { count: 8, spread: 160 });
        fxTint('#2a6ad1', { ms: 400, opacity: 0.35 });
        flash('#dff4ff', 0.3);
        haptic(70);
      }
    },
  };

  // ================= Fish Feast (wallow: heal + shield): a seafood shower the walrus gulps down =================
  CARD_FX['fish-feast'] = {
    // An ice hole opens on the card and fish leap out of it
    land(ctx) {
      remember(ctx);
      const [x, y] = cardXY(ctx), [w, h] = winSize(ctx), hy = y + 20;
      frame(ctx.win, '#5fd1ff', 850);
      const hole = fxSpawn(x, hy, { cls: 'fxib-hole', ms: 1000, size: [w * 0.9, w * 0.32] });
      fxAnimate(hole, [
        { transform: 'scale(0.1)', opacity: 0 },
        { transform: 'scale(1.1)', opacity: 1, offset: 0.15 },
        { transform: 'scale(1)', opacity: 1, offset: 0.25 },
        { transform: 'scale(1)', opacity: 1, offset: 0.85 },
        { transform: 'scale(0.6)', opacity: 0 },
      ], 1000, 'ease-out');
      // Each fish arcs up out of the water, flips over and dives back in with a splash
      ['🐟', '🐠', '🐟', '🦐'].forEach((f, i) => later(110 + i * 120, () => {
        const dir = i % 2 ? 1 : -1, jump = h * (0.42 + 0.06 * (i % 2)), far = w * 0.34 * dir;
        const el = fxSpawn(x - far * 0.5, hy, { cls: 'fxib-fish', html: `<span style="display:inline-block;transform:scaleX(${-dir})">${f}</span>`, ms: 560 });
        fxAnimate(el, [
          { transform: `translate(0, 0) rotate(${-dir * 60}deg) scale(0.6)`, opacity: 0 },
          { transform: `translate(${far * 0.25}px, ${-jump * 0.75}px) rotate(${-dir * 30}deg) scale(1)`, opacity: 1, offset: 0.25 },
          { transform: `translate(${far * 0.5}px, ${-jump}px) rotate(0deg) scale(1.1)`, opacity: 1, offset: 0.5 },
          { transform: `translate(${far * 0.75}px, ${-jump * 0.75}px) rotate(${dir * 40}deg) scale(1)`, opacity: 1, offset: 0.75 },
          { transform: `translate(${far}px, 0) rotate(${dir * 80}deg) scale(0.6)`, opacity: 0 },
        ], 520, 'linear');
        later(0, () => water(x - far * 0.5, hy, { count: 4, spread: 36, size: [4, 7], ms: 450 }));
        later(500, () => water(x + far * 0.5, hy, { count: 4, spread: 36, size: [4, 7], ms: 450 }));
      }));
      later(520, () => slam(x, y - h * 0.3, 'YUM!', { kind: 'snow', size: 26, rotate: 8, ms: 650 }));
      bossPlate(ctx, '🐟 FISH FEAST', '#5fd1ff');
      sfx('leech', 1.1, 0.35); // splish
    },
    // Wallow: seafood rains onto the walrus's box, it gulps every bite, then heals and freezes a fresh ice shield
    gimmick(ctx) {
      const [x, y] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46);
      for (let i = 0; i < 12; i++) later(i * 55, () => fxFly([x + fxRand(-w * 0.6, w * 0.6), y - 190 - fxRand(0, 60)], [x + fxRand(-w * 0.2, w * 0.2), y + fxRand(-6, 6)],
        { html: SEAFOOD[i % 4], cls: 'fxib-food', ms: 380, spin: fxRand(-400, 400), scale: [0.9, 0.45], easing: 'cubic-bezier(.5,0,1,.7)' }));
      // GULP: the box squashes on every mouthful
      ['GULP!', 'CHOMP!', 'MMM!'].forEach((word, i) => later(380 + i * 200, () => {
        jolt(ctx.from, [{ transform: 'none' }, { transform: 'scale(1.08, 0.9)', offset: 0.35 }, { transform: 'scale(0.97, 1.05)', offset: 0.7 }, { transform: 'none' }], 220);
        fxPop(x + (i - 1) * w * 0.3, y - h * 0.5 - 16, word, { cls: 'fxib-gulp', size: 20, ms: 540, rise: 16, rotate: (i - 1) * 10 });
        water(x, y - 6, { count: 4, spread: 50, size: [4, 7], ms: 420 });
        sfx('bite', 1.2 + i * 0.12, 0.35);
      }));
      later(420, () => frost.heal(ctx, { word: 'FISH FEAST!', shield: true }));
    },
  };

  // ================= Arctic Breath (x3 + frostbite): a widening cone of freezing breath =================
  CARD_FX['arctic-breath'] = {
    // Frosty breath gusts out of the card toward the victim, blowing snowflakes along
    land(ctx) {
      remember(ctx);
      const [x, y] = cardXY(ctx), [w] = winSize(ctx), dir = Math.sign(at(ctx)[0] - x) || -1;
      frame(ctx.win, '#dff4ff', 800);
      artPop(x, y, '💨', '#7ae0ff');
      for (let i = 0; i < 3; i++) later(i * 120, () => {
        const yy = y - 12 + i * 12;
        breath([x, yy], [x + dir * w * 0.9, yy + fxRand(-10, 10)], { ms: 540, from: 0.4, to: 1.8 });
        breath([x, yy], [x + dir * w * 0.6, yy - 18], { ms: 480, from: 0.3, to: 1.3 });
      });
      later(80, () => snowflakes(x, y, { count: 7, spread: w * 0.9, angle: dir < 0 ? 180 : 0, cone: 50, gravity: 10, size: [12, 20] }));
      bossPlate(ctx, '💨 ARCTIC BREATH', '#dff4ff');
    },
    // The walrus rears up and blows: a cone of mist and freezing beams sweeps over the victim
    windup(ctx) {
      const from = src(ctx), [tx, ty] = at(ctx), d = dirOf(from, [tx, ty]), s = ctx.crit ? 1.2 : 1, [, bh] = sizeOf(ctx.to, 200, 46);
      jolt(ctx.from, [{ transform: 'none' }, { transform: 'scale(0.94, 1.08)', offset: 0.25 }, { transform: 'scale(1.08, 0.95)', offset: 0.6 }, { transform: 'none' }], 440);
      cone(from, [tx, ty], bh * 2.8 * s, 460);
      for (let i = 0; i < 7; i++) later(i * 35, () => {
        const sp = fxRand(-1, 1) * bh * 0.9;
        breath(from, [tx + d.nx * sp - d.ux * 10, ty + d.ny * sp - d.uy * 10], { ms: 320, from: 0.4, to: 2.3 * s, end: 0.5 });
      });
      [-1, 0, 1].forEach((k, i) => later(60 + i * 50, () => fxBeam(from, [tx + d.nx * k * bh * 0.6, ty + d.ny * k * bh * 0.6], { cls: 'fxr-icebeam', ms: 320, width: 6 })));
      later(90, () => snowflakes(from[0], from[1], { count: 8, spread: d.len * 0.95, angle: d.ang, cone: 26, gravity: 0, ms: 440, size: [12, 20] }));
      return wait(360);
    },
    // Frost coats the victim: a rime of ice crystals, a frost bloom, and a big shiver
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit, [bw, bh] = sizeOf(ctx.to, 200, 46), d = dirOf(src(ctx), [tx, ty]);
      rime(tx, ty, bw + 22, bh + 22);
      frostBloom(tx, ty, Math.min(200, bw * 1.1) * Math.min(1.3, p), 800);
      frostPuff(tx, ty, 5, { size: 60, spread: bw * 0.6 });
      snowflakes(tx, ty, { count: 10, spread: 130 * p, angle: d.ang, cone: 160 });
      sparkle(tx, ty, { count: 8, spread: bw * 0.6 });
      fxRing(tx, ty, { color: '#dff4ff', size: 170 * p, width: 6 });
      shiver(ctx.to, 5, 620);
      stamp(ctx, crit ? 'ICE COLD!!' : 'BRRR!', { kind: 'snow', size: crit ? 44 : Math.min(50, 30 + 10 * p), rotate: fxRand(-6, 6), ms: 850, star: crit ? '#dff4ff' : null });
      fxTint(VIG.frost, { ms: 600, opacity: crit ? 0.6 : 0.45 });
      fxShake(ctx.panel, Math.min(18, 9 * p), 360);
    },
    // Frostbite: the kit's frostbite, plus icy wisps curling round the victim and chattering teeth
    gimmick(ctx) {
      frost.frostbite(ctx, { word: 'FROSTBITE!' });
      const [x, y] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46);
      orbit(x, y, '<i class="fxib-wisp"></i>', 5, { rx: w * 0.55, ry: h * 0.8, ms: 1000, size: 22, turns: 1.4 });
      later(250, () => fxPop(x + w * 0.5, y - h * 0.5, '🥶', { size: 30, ms: 700, rise: 10, rotate: 10 }));
    },
  };

  // ================= Iceberg Toss (x9): the Warlord heaves a whole iceberg =================
  CARD_FX['iceberg-toss'] = {
    // The sea opens on the card and an iceberg bobs up out of the water
    land(ctx) {
      remember(ctx);
      const [x, y] = cardXY(ctx), [w] = winSize(ctx), SW = w * 1.25, SH = SW * 0.95;
      fxTint(VIG.deep, { ms: 800, opacity: 0.5 });
      frame(ctx.win, '#5fa8ff', 850);
      const sea = fxSpawn(x, y - 6, { cls: 'fxib-sea', html: `<div class="fxib-berg">${BERG_TOP}</div><div class="fxib-wave"></div>`, ms: 1050, size: [SW, SH] });
      fxAnimate(sea, [
        { transform: 'scale(0.6)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1, offset: 0.12 },
        { transform: 'scale(1)', opacity: 1, offset: 0.85 },
        { transform: 'scale(0.95)', opacity: 0 },
      ], 1050, 'ease-out');
      const line = y - 6 + SH * 0.2;
      later(240, () => { water(x, line, { count: 10, spread: 70, size: [4, 8] }); fxShake(ctx.panel, 6, 280); sfx('leech', 0.8, 0.4); }); // it surfaces with a sploosh
      later(480, () => sparkle(x, y - SH * 0.3, { count: 6, spread: 50 }));
      bossPlate(ctx, '🗻 ICEBERG TOSS', '#5fa8ff');
    },
    // The walrus squats and heaves: the iceberg sails up on a high arc, turning slowly, onto a locked-on victim
    windup(ctx) {
      const from = src(ctx), [tx, ty] = at(ctx), s = ctx.crit ? 1.2 : 1, [bw, bh] = sizeOf(ctx.to, 200, 46), d = dirOf(from, [tx, ty]);
      jolt(ctx.from, [{ transform: 'none' }, { transform: 'translateY(6px) scale(1.06, 0.88)', offset: 0.3 }, { transform: 'translateY(-10px) scale(0.95, 1.08)', offset: 0.55 }, { transform: 'none' }], 420);
      reticle(tx, ty, '#5fa8ff', 440);
      shadow(tx, ty + bh * 0.35, bw, 40, 420);
      dim(VIG.deep, ctx.crit ? 0.75 : 0.55, 460);
      later(30, () => water(from[0], from[1] - 10, { count: 8, spread: 60 })); // seawater pouring off it
      later(50, () => sfx('big_hit', 0.5, 0.35));
      return fxFly(from, [tx, ty - 10], { html: ICEBERG, cls: 'fxr-svg fxib-berg-fly', ms: 410, arc: upArc(from, [tx, ty], Math.max(120, d.len * 0.45)),
        spin: (tx < from[0] ? -1 : 1) * 70, scale: [0.5, 1.45 * s], trail: 'fxib-trail-drip', trailEvery: 34, easing: 'cubic-bezier(.35,0,.75,.6)' });
    },
    // The iceberg smashes: huge tumbling chunks, a crown of seawater, spray and rings
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit, [bw, bh] = sizeOf(ctx.to, 200, 46), k = Math.min(1.5, p);
      flash('#bfe6ff', crit ? 0.55 : 0.35);
      core(tx, ty, 180 * p, 'deep', 440);
      breakApart(tx, ty - 10, ICEBERG, [110 * k, 102 * k], QUARTERS, { spread: 120 * p, ms: 880 });
      chunks(tx, ty, { count: 12, spread: 200 * p, size: [12, 24] });
      sprout(tx, ty + bh * 0.45, SPLASH, [170 * k, 110 * k], { cls: 'fxib-splash', ms: 700 });
      water(tx, ty, { count: 16, spread: 190 * p, gravity: 220, size: [6, 12] });
      fxRing(tx, ty, { color: '#fff', size: 170 * p, width: 6, ms: 380 });
      later(60, () => fxRing(tx, ty, { color: '#5fa8ff', size: 260 * p, width: 10, ms: 520 }));
      later(140, () => groundRing(tx, ty + bh * 0.45, 320 * p, '#dff4ff', 620, 5));
      crackBurst(tx, ty, 150 * p, 'frost', fxRand(0, 60), 800);
      jolt(ctx.to, [{ transform: 'none' }, { transform: 'translateY(12px) scale(1.07, 0.85)', offset: 0.2 }, { transform: 'translateY(-5px) scale(0.98, 1.04)', offset: 0.5 }, { transform: 'none' }], 440);
      stamp(ctx, crit ? 'TITANIC!!' : 'ICEBERG!', { kind: 'frost fxib-glacier', size: crit ? 50 : Math.min(54, 32 + 10 * p), rotate: 5, ms: 1000, star: '#7ac8ff' });
      fxShake(ctx.panel, Math.min(30, 17 * p), 560);
      fxShake(ctx.to, 16, 420);
      haptic(crit ? 140 : 110);
    },
  };

  // ================= Ice Quake (x4, stun): a crack races across the floor and spikes erupt under the victim =================
  CARD_FX['ice-quake'] = {
    // The card's floor cracks and the reel rumbles
    land(ctx) {
      remember(ctx);
      const [x, y] = cardXY(ctx), [w] = winSize(ctx), cy = y + 26;
      frame(ctx.win, '#7ab8ff', 900);
      const c = fxSpawn(x, cy, { cls: 'fxr-svg fxib-floorcrack', html: FLOOR_CRACK, ms: 900, size: [w * 1.3, 24] });
      fxAnimate(c, [{ transform: 'scaleX(0.05)', opacity: 1 }, { transform: 'scaleX(1.05)', opacity: 1, offset: 0.2 }, { transform: 'scaleX(1)', opacity: 1, offset: 0.75 }, { transform: 'scaleX(1)', opacity: 0 }], 900, 'ease-out');
      later(120, () => {
        frostPuff(x, cy, 4, { size: 40, spread: w * 0.8 });
        iceShards(x, cy, { count: 10, spread: 90, angle: -90, cone: 100, gravity: 120 });
        [-0.32, 0, 0.32].forEach((o, i) => later(i * 60, () => spike(x + o * w, cy + 4, i === 1 ? 44 : 32, o * 40, 560)));
      });
      [0, 170, 340].forEach((t, i) => later(t, () => fxShake(ctx.panel, 6 - i, 170)));
      faceJiggle(ctx, [0, -1, 1, -1, 1, -0.5, 0].map(v => ({ transform: `translate(${v * 3}px, ${Math.abs(v) * 2}px)` })), 420);
      bossPlate(ctx, '💥 ICE QUAKE', '#7ab8ff');
      sfx('big_hit', 0.4, 0.45); // rumble
    },
    // A crack races along the floor from the walrus to the victim, ice spikes jutting up in its wake
    windup(ctx) {
      const from = src(ctx), [tx, ty] = at(ctx), [, bh] = sizeOf(ctx.to, 200, 46), [, fh] = sizeOf(ctx.from, 200, 46);
      const a = [from[0], from[1] + fh * 0.5 + 6], b = [tx, ty + bh * 0.5 + 6], n = 7, T = 330;
      let prev = a;
      for (let i = 1; i <= n; i++) {
        const t = i / n, pt = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + (i < n ? fxRand(-9, 9) : 0)], q = prev;
        prev = pt;
        later((i - 1) * T / n, () => {
          fxBeam(q, pt, { cls: 'fxib-crackline', ms: 700, width: 7 });
          spike(pt[0], pt[1], 30 + i * 4, fxRand(-18, 18), 520);
          if (i % 2) iceShards(pt[0], pt[1], { count: 3, spread: 40, angle: -90, cone: 90, size: [4, 8], ms: 420 });
        });
      }
      fxShake(ctx.panel, 5, 360);
      sfx('big_hit', 0.35, 0.4);
      return wait(T + 30);
    },
    // A fan of ice spikes erupts from under the victim and tosses it up
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit, [bw, bh] = sizeOf(ctx.to, 200, 46), base = ty + bh * 0.5 + 8, k = crit ? 7 : 5;
      for (let i = 0; i < k; i++) {
        const o = i / (k - 1) - 0.5;
        later(Math.abs(o) * 120, () => spike(tx + o * bw * 0.9, base, (60 + (0.5 - Math.abs(o)) * 70) * Math.min(1.5, p), o * 50, 760));
      }
      crackBurst(tx, base, 190 * p, 'ice', 0, 900);
      iceShards(tx, base, { count: 16, spread: 170 * p, angle: -90, cone: 160, gravity: 140 });
      frostPuff(tx, base, 5, { size: 60, spread: bw * 0.8 });
      groundRing(tx, base, 260 * p, '#bfe6ff', 560, 6);
      fxRing(tx, ty, { color: '#fff', size: 160 * p, width: 6, ms: 380 });
      jolt(ctx.to, [{ transform: 'none' }, { transform: 'translateY(-18px) rotate(-2deg)', offset: 0.25 }, { transform: 'translateY(4px) rotate(1deg)', offset: 0.55 }, { transform: 'none' }], 460);
      stamp(ctx, crit ? 'MEGA QUAKE!!' : 'QUAKE!', { dy: 26, kind: 'frost fxib-glacier', size: crit ? 44 : Math.min(52, 32 + 10 * p), rotate: -6, ms: 900, star: crit ? '#bfe6ff' : null });
      fxShake(ctx.panel, Math.min(26, 14 * p), 520);
      later(220, () => fxShake(ctx.panel, 8, 300)); // aftershock
      haptic(crit ? 110 : 70);
    },
    // Stun: the kit's freeze, and the ice splits all around the frozen victim
    gimmick(ctx) {
      frost.freeze(ctx, { word: 'FROZEN!' });
      const [x, y] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46);
      [[-0.5, 0.45], [0.5, 0.45], [-0.2, -0.55], [0.3, -0.5]].forEach(([ox, oy], i) => later(140 + i * 80, () => crackBurst(x + ox * w, y + oy * h, 80, 'frost', fxRand(0, 60), 800)));
      later(90, () => fxBeam([x - w * 0.7, y + h * 0.5 + 6], [x + w * 0.7, y + h * 0.5 + 6], { cls: 'fxib-crackline', ms: 900, width: 6 }));
      fxShake(ctx.panel, 8, 400);
    },
  };

  // ================= Walrus Stampede (x3, frenzy: 3 strikes): the Titan's herd charges in, more every strike =================
  CARD_FX['walrus-stampede'] = {
    // A herd of walruses thunders across the card
    land(ctx) {
      remember(ctx);
      const [x, y] = winXY(ctx), [w] = winSize(ctx), size = w * 0.55;
      fxTint(VIG.frost, { ms: 800, opacity: 0.5 });
      frame(ctx.win, '#c8966e', 850);
      for (let i = 0; i < 4; i++) later(i * 110, () => {
        const yy = y + 12 + (i % 2 ? -20 : 14), a = [x - w * 0.9, yy], b = [x + w * 0.9, yy];
        walrusRun(a, b, { size, ms: 560, hops: 3, hopH: 18, fade: true });
        [0.2, 0.55, 0.9].forEach(t => later(t * 560, () => frostPuff(a[0] + (b[0] - a[0]) * t, yy + size * 0.3, 1, { size: 30, spread: 20 })));
      });
      [0, 160, 320, 480].forEach(t => later(t, () => fxShake(ctx.panel, 5, 170)));
      bossPlate(ctx, '🦭 WALRUS STAMPEDE', '#c8966e');
      sfx('big_hit', 0.5, 0.35); // thunder of flippers
    },
    // Frenzy (before the strikes): the kit's blizzard with walruses orbiting the Titan, the ground rumbling
    gimmick(ctx) {
      frost.frenzy(ctx, { word: 'STAMPEDE!', html: i => `<i class="fxib-owalrus">${i % 2 ? WALRUS_L : WALRUS}</i>` });
      const [x, y] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46);
      [0, 140, 280].forEach((t, i) => later(t, () => { fxShake(ctx.panel, 6 + i * 2, 180); frostPuff(x + (i - 1) * w * 0.4, y + h * 0.5, 2, { size: 44 }); }));
    },
    // Strike s: s + 1 walruses bounce-charge in from the side (alternating sides), then rebound off the victim
    windup(ctx) {
      const s = clamp(ctx.strike || 0, 0, 2), n = s + 1, [tx, ty] = at(ctx), side = s % 2 ? 1 : -1, ms = [320, 290, 260][s];
      const flights = [];
      for (let i = 0; i < n; i++) {
        const yOff = (i - (n - 1) / 2) * 24, start = [side < 0 ? -50 : innerWidth + 50, ty + yOff + 4];
        const end = [tx + side * 18 + fxRand(-10, 10), ty + yOff * 0.6];
        flights.push(new Promise(r => later(i * 45, () => walrusRun(start, end, { size: 64 + s * 8, ms, hops: 3, hopH: 26,
          after: (el, dx, dy) => fxAnimate(el, [
            { transform: `translate(${dx}px, ${dy}px) scale(1.16, 0.84)`, opacity: 1 },
            { transform: `translate(${dx + side * 30}px, ${dy - 42}px) rotate(${side * 20}deg)`, opacity: 1, offset: 0.5 },
            { transform: `translate(${dx + side * 52}px, ${dy - 10}px) rotate(${side * 35}deg) scale(0.9)`, opacity: 0 },
          ], 440, 'ease-out') }).then(r))));
      }
      later(40, () => frostPuff(side < 0 ? 30 : innerWidth - 30, ty + 20, 2, { size: 50 }));
      if (s === 2) dim(VIG.frost, 0.55, 300);
      return Promise.all(flights);
    },
    // Stomp! The victim is squashed flat and snow bursts out: THUD! -> THUD!! -> STAMPEDE!!!
    impact(ctx) {
      const s = clamp(ctx.strike || 0, 0, 2), [tx, ty] = at(ctx), p = pow(ctx) + s * 0.2, crit = !!ctx.crit, [bw, bh] = sizeOf(ctx.to, 200, 46);
      const base = ty + bh * 0.5, side = s % 2 ? 1 : -1;
      jolt(ctx.to, [{ transform: 'none' }, { transform: `translateY(${6 + s * 3}px) scale(1.08, ${0.86 - s * 0.04})`, offset: 0.2 }, { transform: 'translateY(-4px) scale(0.97, 1.04)', offset: 0.5 }, { transform: 'none' }], 380);
      fxParticles(tx, base, { count: 12 + s * 4, colors: ['#fff', '#eef8ff', '#dff4ff'], size: [6, 12], spread: (110 + s * 40) * p, gravity: 110, angle: -90, cone: 160, ms: 700 });
      snowflakes(tx, base, { count: 5 + s * 2, spread: 120 * p, angle: -90, cone: 180 });
      frostPuff(tx, base, 3 + s, { size: 56 + s * 10, spread: bw * 0.8 });
      groundRing(tx, base, (170 + s * 60) * p, '#fff', 520, 5 + s);
      fxRing(tx, ty, { color: s === 2 ? '#7ae0ff' : '#fff', size: (140 + s * 50) * p, width: 6 + s * 2, ms: 420 });
      stamp(ctx, ['THUD!', 'THUD!!', 'STAMPEDE!!!'][s], { dx: side * 20, kind: s === 2 ? 'frost fxib-glacier' : 'snow',
        size: 32 + s * 10 + (crit ? 8 : 0), rotate: [-8, 8, -4][s], ms: 650 + s * 150, star: s === 2 ? '#dff4ff' : null });
      fxShake(ctx.panel, 8 + s * 7, 280 + s * 80);
      fxShake(ctx.to, 8 + s * 4, 260);
      if (s === 2) {
        crackBurst(tx, base, 200 * p, 'ice', fxRand(-20, 20), 900);
        speedLines(tx, ty, { n: 10, r0: 60, r1: 170, cls: 'fxr-line', width: 5 });
        fxTint('#2a6ad1', { ms: 400, opacity: 0.35 });
        flash('#dff4ff', 0.35);
        haptic(100);
      } else haptic(30 + s * 20);
    },
  };

  // ================= Absolute Zero (x9, cleave): the Titan freezes the whole world, then the victim shatters =================
  CARD_FX['absolute-zero'] = {
    // A giant thermometer plunges into the card, its mercury drops to the bottom, frost spreads and the screen goes deep blue
    land(ctx) {
      remember(ctx);
      const [x, y] = cardXY(ctx), [w, h] = winSize(ctx), [cw, ch] = sizeOf(ctx.slot, 58, 80);
      const deep = fxSpawn(0, 0, { cls: 'fx-tint', ms: 1150, style: { background: VIG_ABYSS } });
      deep?.animate([{ opacity: 0 }, { opacity: 0.8, offset: 0.3 }, { opacity: 0.75, offset: 0.75 }, { opacity: 0 }], { duration: 1150, easing: 'ease-in-out', fill: 'forwards' });
      frame(ctx.win, '#7ae0ff', 1000);
      const TH = h * 0.95, TW = TH * 0.3;
      const t = fxSpawn(x, y - 6, { cls: 'fxib-thermo', html: THERMO, ms: 1100, size: [TW, TH] });
      fxAnimate(t, [
        { transform: 'translate(0, -120px) scale(0.8)', opacity: 0 },
        { transform: 'translate(0, 6px) scale(1, 0.94)', opacity: 1, offset: 0.18 },
        { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0.28 },
        { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0.85 },
        { transform: 'translate(0, 10px) scale(0.95)', opacity: 0 },
      ], 1100, 'ease-out');
      later(200, () => { fxShake(ctx.panel, 7, 300); frostPuff(x, y + TH * 0.4, 3, { size: 44, spread: w * 0.6 }); });
      // Frost spreads up over the card as the temperature plunges
      later(380, () => {
        rime(x, y, cw + 10, ch + 10, { ms: 720, cls: 'fxib-frostcard', origin: '50% 100%' });
        sfx('blocked', 0.35, 0.6); // crackling frost
      });
      later(300, () => snowfall(x, y - h * 0.5, w, 8, { fall: h * 0.9, ms: 800 }));
      later(700, () => slam(x, y - h * 0.34, '-273°', { kind: 'deep fxib-zero', size: 26, rotate: -6, ms: 650 }));
      bossPlate(ctx, '🌡️ ABSOLUTE ZERO', '#7ae0ff');
    },
    // Cleave (before the hit): the kit's ice spike smashes any shields, and the air around the victim freezes
    gimmick(ctx) {
      frost.smash(ctx, { word: 'ZERO!' });
      const [tx, ty] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46);
      frostPuff(tx, ty, 3, { size: 50, spread: w * 0.5 });
      if (!ctx.blocked) return;
      // The broken shield's crystals fly off in every direction
      for (let i = 0; i < 6; i++) later(240, () => {
        const a = (i / 6) * Math.PI * 2, r = w * 0.55;
        fxFly([tx, ty], [tx + Math.cos(a) * r, ty + Math.sin(a) * (h + 30)], { html: CRYSTAL, cls: 'fxr-svg fxib-crystal-fly', ms: 420, spin: fxRand(-300, 300), scale: [1, 0.4], easing: 'ease-out' });
      });
    },
    // Frost creeps in from the screen edges while a huge snowflake crystallizes over the victim, soaking up cold energy
    windup(ctx) {
      const [tx, ty] = at(ctx), crit = !!ctx.crit, [bw] = sizeOf(ctx.to, 200, 46);
      const edge = fxSpawn(innerWidth / 2, innerHeight / 2, { cls: 'fxib-edgefrost', ms: 560, size: [innerWidth, innerHeight] });
      fxAnimate(edge, [{ transform: 'scale(1.35)', opacity: 0 }, { transform: 'scale(1.1)', opacity: 0.85, offset: 0.5 }, { transform: 'scale(1)', opacity: 1, offset: 0.8 }, { transform: 'scale(1)', opacity: 0 }], 560, 'ease-out');
      dim(VIG.deep, crit ? 0.85 : 0.7, 480);
      const S = Math.min(240, bw * 1.5) * (crit ? 1.15 : 1);
      const f = fxSpawn(tx, ty, { cls: 'fxr-svg fxib-bigflake', html: FLAKE, ms: 480, size: [S, S] });
      fxAnimate(f, [
        { transform: 'scale(0.1) rotate(-120deg)', opacity: 0 },
        { transform: 'scale(0.8) rotate(-20deg)', opacity: 0.9, offset: 0.6 },
        { transform: 'scale(1) rotate(0deg)', opacity: 1, offset: 0.9 },
        { transform: 'scale(0.7) rotate(15deg)', opacity: 0 },
      ], 460, 'ease-in');
      charge(tx, ty, { colors: ['#fff', '#bfe6ff', '#7ae0ff'], n: 14, r: S * 0.9, ms: 360, size: [4, 8] });
      later(120, () => charge(tx, ty, { html: FLAKE_I, n: 6, r: S * 0.8, ms: 280, size: [6, 9] }));
      later(60, () => sfx('blocked', 0.3, 0.5));
      return wait(420);
    },
    // A white-blue flash, the victim frozen solid in a block of ice... which shatters into shards
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit, [bw] = sizeOf(ctx.to, 200, 46);
      flash('#dff4ff', crit ? 0.8 : 0.6);
      fxTint('#bfe6ff', { ms: 500, opacity: 0.55 });
      iceBlock(ctx.to, { ms: 900, pad: 16 });
      core(tx, ty, 200 * p, 'white', 420);
      frostBloom(tx, ty, Math.min(260, bw * 1.4) * Math.min(1.3, p), 900);
      for (let i = 0; i < 3; i++) later(i * 100, () => fxRing(tx, ty, { color: ['#ffffff', '#7ae0ff', '#2a6ad1'][i], size: (190 + i * 120) * p, width: 10 - i * 3, ms: 600 }));
      snowflakes(tx, ty, { count: 12, spread: 220 * p, gravity: 40, size: [18, 32] });
      speedLines(tx, ty, { n: 12, r0: 60, r1: 200, cls: 'fxr-line-ice', width: 5 });
      // The ice block bursts (the kit's shatter lands ~720 ms in): extra chunks and one last jolt
      later(740, () => {
        chunks(tx, ty, { count: 12, spread: 200 * p });
        fxRing(tx, ty, { color: '#dff4ff', size: 260 * p, width: 6, ms: 420 });
        fxShake(ctx.panel, 14, 300);
        fxShake(ctx.to, 10, 260);
      });
      stamp(ctx, crit ? 'FROZEN FOREVER!!' : 'ABSOLUTE ZERO!!', { dy: 8, kind: 'deep fxib-zero', size: crit ? 38 : Math.min(42, 28 + 7 * p), rotate: -4, ms: 1150, star: '#bfe6ff' });
      fxShake(ctx.panel, Math.min(32, 18 * p), 600);
      fxShake(ctx.to, 14, 400);
      haptic(crit ? 160 : 120);
    },
  };
})();
