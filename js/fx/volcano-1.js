// Card effects: Volcano group 1 - the Ember Beetle line (Ember Beetle, Bombardier Beetle, Scarab King) and the
// Lava Lizard line (Lava Lizard, Magma Salamander, Lava Basilisk). See js/card-fx.js for when each hook fires and
// js/fx/region-kit.js for the RFX kit. Glowing beetle shells, ember spit, firecrackers, pincers, the rising sun,
// whipping lava tails, forked tongues, wheels of fire, a petrifying serpent eye and a geyser of magma.
// Styles live in css/fx/volcano-1.css (every class and keyframe is prefixed fxv1-).
(() => {
  const { clamp, later, wait, at, src, sizeOf, pow, dirOf, jolt, faceJiggle, lunge, knock, remember, launchPoint,
    slam, stampPoint, plate, frame, artPop, show, glint, speedLines, slash, crackBurst, core, dim, shadow, charge,
    orbit, aimFly, VIG, SUN, FLAME, ROCK, starSvg, FIRE_COLS, flames, embers, sparks, smoke, lavaBlobs, rocks,
    ashFall, scorch, heatWave, lavaJet, fire } = RFX;

  // ---------- Graphics (inline SVG / emoji, no image files) ----------
  const INK = '#1a0804';
  // A chunky cartoon fire beetle facing right (flip = facing left): a basalt shell with glowing seams and a big horn
  const beetleSvg = flip => `<svg viewBox="0 0 100 70"><g${flip ? ' transform="translate(100 0) scale(-1 1)"' : ''}>` +
    `<g stroke="${INK}" stroke-width="4" stroke-linecap="round"><path d="M30 50 L20 65"/><path d="M47 53 L45 67"/><path d="M63 50 L73 64"/></g>` +
    `<ellipse cx="44" cy="38" rx="35" ry="23" fill="#3a1a10" stroke="${INK}" stroke-width="4"/>` +
    '<path d="M12 36 Q44 28 78 36" fill="none" stroke="#ff8a1f" stroke-width="3.5" stroke-linecap="round"/>' +
    '<circle cx="30" cy="46" r="4" fill="#ff6a00"/><circle cx="50" cy="48" r="3" fill="#ffb300"/><circle cx="62" cy="44" r="3.5" fill="#ff6a00"/>' +
    '<path d="M22 26 Q40 17 60 20" fill="none" stroke="#8a5a40" stroke-width="3.5" stroke-linecap="round"/>' +
    `<circle cx="80" cy="43" r="12" fill="#2a1008" stroke="${INK}" stroke-width="4"/>` +
    `<path d="M84 34 Q95 20 89 5 Q102 15 98 36 Z" fill="#ffb300" stroke="#7a1a00" stroke-width="3" stroke-linejoin="round"/>` +
    '<path d="M92 12 Q96 20 94 30" stroke="#fff3a0" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
    '<circle cx="86" cy="42" r="3.4" fill="#ffe066"/></g></svg>';
  const BEETLE = beetleSvg(false), BEETLE_L = beetleSvg(true);
  // One half of a cinder shell dome (left half; flip = the right half), glowing cracks in the crust
  const shellSvg = flip => `<svg viewBox="0 0 50 100" preserveAspectRatio="none"><g${flip ? ' transform="translate(50 0) scale(-1 1)"' : ''}>` +
    `<path d="M50 2 Q3 6 3 50 Q3 94 50 98 Z" fill="#3a2018" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` +
    '<path d="M44 9 Q13 20 11 50" fill="none" stroke="#7a4a36" stroke-width="3.5" stroke-linecap="round"/>' +
    '<g fill="none" stroke="#ff8a1f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="50,30 37,36 31,52 18,58"/><polyline points="50,72 38,67 27,78"/></g>' +
    '<g fill="none" stroke="#fff3a0" stroke-width="1.2" stroke-linecap="round"><polyline points="50,30 37,36 31,52"/></g></g></svg>';
  const SHELL_L = shellSvg(false), SHELL_R = shellSvg(true);
  // A red firecracker with gold bands and a curly fuse
  const CRACKER = '<svg viewBox="0 0 60 100"><rect x="16" y="32" width="28" height="64" rx="6" fill="#d81e1e" stroke="#4a0000" stroke-width="3.5"/>' +
    '<rect x="16" y="42" width="28" height="7" fill="#ffd23f"/><rect x="16" y="78" width="28" height="7" fill="#ffd23f"/>' +
    '<path d="M21 52 V74" stroke="#ff8a8a" stroke-width="4" stroke-linecap="round"/>' +
    '<ellipse cx="30" cy="33" rx="14" ry="4" fill="#8a0a0a" stroke="#4a0000" stroke-width="2.5"/>' +
    '<path d="M30 32 Q29 20 38 14 Q46 8 41 2" fill="none" stroke="#3a2a1a" stroke-width="3.5" stroke-linecap="round"/></svg>';
  // One jaw of a giant pincer. The hinge sits at the CENTRE of the box (so rotating the element swings the jaw);
  // top jaw curls down at its tip, `low` mirrors it into the bottom jaw
  const jawSvg = low => `<svg viewBox="-100 -40 200 80"><g${low ? ' transform="scale(1 -1)"' : ''}>` +
    `<path d="M0 -6 Q30 -36 70 -28 Q97 -20 98 9 Q88 -5 66 -8 L60 -1 L52 -10 L44 -3 L36 -11 L27 -3 Q12 2 0 6 Z" fill="#c4501c" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` +
    '<path d="M12 -13 Q40 -30 74 -21" fill="none" stroke="#ffb070" stroke-width="3.5" stroke-linecap="round"/>' +
    '<path d="M66 -8 L60 -1 L52 -10 L44 -3 L36 -11 L27 -3" fill="none" stroke="#fff3a0" stroke-width="2" stroke-linejoin="round"/>' +
    `<circle r="8" fill="#2a1008" stroke="${INK}" stroke-width="3"/><circle r="3" fill="#ff8a1f"/></g></svg>`;
  const JAW_T = jawSvg(false), JAW_B = jawSvg(true);
  // A curvy lizard tail pointing right (stretches to whatever box it's given): outline, scales, glowing lava seam
  const tailSvg = (body = '#c0400a', seam = '#ffe066') => '<svg viewBox="0 0 200 60" preserveAspectRatio="none">' +
    `<path d="M4 30 C40 4 70 56 110 30 S168 8 196 28" fill="none" stroke="${INK}" stroke-width="17" stroke-linecap="round"/>` +
    `<path d="M4 30 C40 4 70 56 110 30 S168 8 196 28" fill="none" stroke="${body}" stroke-width="11" stroke-linecap="round"/>` +
    `<path d="M4 30 C40 4 70 56 110 30 S168 8 196 28" fill="none" stroke="${seam}" stroke-width="3" stroke-linecap="round" stroke-dasharray="10 7"/></svg>`;
  const TAIL = tailSvg(), TAIL_OLD = tailSvg('#6a5a52', '#3a302a'), TAIL_NEW = tailSvg('#ff6a00', '#fff3a0');
  // A forked lizard tongue pointing right
  const TONGUE = '<svg viewBox="0 0 120 30" preserveAspectRatio="none"><path d="M0 10 Q60 7 96 12 L119 2 L104 15 L119 28 L96 18 Q60 23 0 20 Z" fill="#ff3d6a" stroke="#5a0018" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<path d="M4 13 Q50 11 92 14" stroke="#ffb0c4" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>';
  // A ring of fire: a burning hoop with flame tips all round (for the Flame Wheel)
  const FIRE_RING = '<svg viewBox="-50 -50 100 100"><g fill="#ff6a00" stroke="#8a1a00" stroke-width="2.5" stroke-linejoin="round">' +
    Array.from({ length: 10 }, (_, i) => `<path transform="rotate(${i * 36})" d="M-9 -30 Q-6 -44 4 -49 Q2 -40 9 -30 Z"/>`).join('') + '</g>' +
    '<g fill="#ffd23f">' + Array.from({ length: 10 }, (_, i) => `<path transform="rotate(${i * 36})" d="M-4 -31 Q-2 -39 2 -42 Q1 -36 5 -31 Z"/>`).join('') + '</g>' +
    '<circle r="30" fill="none" stroke="#8a1a00" stroke-width="13"/><circle r="30" fill="none" stroke="#ff8a1f" stroke-width="9"/>' +
    '<circle r="30" fill="none" stroke="#fff3a0" stroke-width="3" stroke-dasharray="12 8"/></svg>';
  // A giant slit-pupil serpent eye: molten-gold iris, black slit, glint
  const EYE = `<svg viewBox="0 0 120 70"><path d="M4 35 Q60 -12 116 35 Q60 82 4 35 Z" fill="#fff0c0" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>` +
    '<circle cx="60" cy="35" r="27" fill="#ff8a1f" stroke="#7a1a00" stroke-width="3"/><circle cx="60" cy="35" r="19" fill="#ffcf3a"/>' +
    '<g stroke="#ff8a1f" stroke-width="2" stroke-linecap="round"><path d="M60 13 V20 M60 50 V57 M40 26 L46 29 M80 26 L74 29 M40 44 L46 41 M80 44 L74 41"/></g>' +
    '<ellipse cx="60" cy="35" rx="5.5" ry="25" fill="#120604"/><circle cx="71" cy="24" r="4.5" fill="#fff"/><circle cx="50" cy="45" r="2" fill="#fff" opacity=".8"/></svg>';
  // A fiery splat (irregular blob with droplets)
  function splatSvg() {
    const pts = [];
    for (let i = 0; i < 16; i++) {
      const r = i % 2 ? fxRand(20, 28) : fxRand(34, 46), a = i / 16 * Math.PI * 2;
      pts.push((Math.cos(a) * r).toFixed(1) + ',' + (Math.sin(a) * r).toFixed(1));
    }
    return `<svg viewBox="-50 -50 100 100"><polygon points="${pts.join(' ')}" fill="#ff5a00" stroke="#7a1500" stroke-width="3.5" stroke-linejoin="round"/>` +
      '<circle r="17" fill="#ffb300"/><circle cx="-4" cy="-4" r="8" fill="#fff3a0"/></svg>';
  }
  const BURST = () => starSvg('#fff3a0', '#7a1a00');
  const GOLD = ['#fff', '#fff6a0', '#ffd23f', '#ffb300'];
  const DUST = ['#8a6a50', '#a88a6a', '#6a5040'];

  // ---------- Small helpers ----------
  const cardXY = ctx => fxPoint(ctx.slot || ctx.win);      // the card that just landed
  const winXY = ctx => fxPoint(ctx.win || ctx.slot);       // its whole wheel window
  const winSize = ctx => sizeOf(ctx.win, 90, 180);
  const cardSize = ctx => sizeOf(ctx.slot, 70, 110);
  const firePlate = (ctx, text, color) => plate(ctx, text, color, 'fire');
  // fxFly / aimFly bow their arc along the path's normal: pick the sign that bows it UP the screen
  const upArc = (a, b, h) => (dirOf(a, b).ny > 0 ? -h : h);
  // A huge stamped word under the victim, nudged sideways so it never runs off the edge of the screen
  function stamp(ctx, text, { dx = 0, dy = 0, size = 44, ...opts } = {}) {
    const [sx, sy] = stampPoint(ctx, dx), half = text.length * size * 0.27 + 10;
    const x = innerWidth > half * 2 ? clamp(sx, half, innerWidth - half) : innerWidth / 2;
    return slam(x, sy + dy, text, { size, ...opts });
  }
  // Something anchored at a and pointing at b (tails, tongues, beams of flame): it grows out of a like a beam.
  // frames(ang) returns keyframes in the element's own space (the translate/rotate prefix is added here)
  function anchored(a, b, { cls = '', html = '', width = 30, ms = 400, frames, len = null } = {}) {
    const d = dirOf(a, b), el = fxSpawn(a[0], a[1], { cls, html, ms: ms + 30, size: [len || d.len, width] });
    if (!el) return Promise.resolve();
    el.style.transformOrigin = '0 50%';
    const fr = frames.map(f => ({ ...f, transform: `translate(0, -50%) rotate(${d.ang}deg) ${f.transform || ''}` }));
    return el.animate(fr, { duration: ms, easing: 'ease-out', fill: 'forwards' }).finished.catch(() => {});
  }
  // A graphic whose base sits on (x, y) and that grows straight up out of it
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
  // Brown dust kicked up off the ground
  const dust = (x, y, { count = 8, spread = 60, angle = -90, cone = 120, ms = 600, size = [8, 14] } = {}) =>
    fxParticles(x, y, { count, cls: 'fxv1-dust', colors: DUST, size, spread, gravity: -10, angle, cone, ms, spin: 0 });
  // A drop of molten lava falling from (x, y) and splatting `fall` px below
  function drip(x, y, fall, ms = 560) {
    const el = fxSpawn(x, y, { cls: 'fxv1-drip', ms: ms + 40, size: [8, 11] });
    fxAnimate(el, [
      { transform: 'translate(0, 0) scale(0.3)', opacity: 0 },
      { transform: 'translate(0, 2px) scale(1)', opacity: 1, offset: 0.25 },
      { transform: `translate(0, ${fall}px) scale(0.8, 1.3)`, opacity: 1, offset: 0.9 },
      { transform: `translate(0, ${fall}px) scale(1.9, 0.3)`, opacity: 0 },
    ], ms, 'ease-in');
  }
  // A beetle scuttling from a to b with a busy little bob (and dust kicked up behind). Resolves on arrival
  function scuttle(a, b, { size = 56, ms = 340, dustTrail = true, fade = false } = {}) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const el = fxSpawn(a[0], a[1], { cls: 'fxr-svg fxv1-beetle', html: dx < 0 ? BEETLE_L : BEETLE, ms: ms + 40, size: [size, size * 0.7] });
    if (!el) return Promise.resolve();
    const frames = [], N = 12;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      frames.push({ transform: `translate(${dx * t}px, ${dy * t - (i % 2 ? 4 : 0)}px) rotate(${i % 2 ? -4 : 3}deg)`, opacity: fade && (i === 0 || i === N) ? 0 : 1 });
    }
    if (dustTrail) for (let k = 1; k < ms / 34; k++) later(k * 34, () => {
      const t = Math.min(1, k * 34 / ms);
      fxSpawn(a[0] + dx * t - Math.sign(dx) * size * 0.4, a[1] + dy * t + size * 0.25, { cls: 'fxv1-trail-dust', ms: 480 });
    });
    return fxAnimate(el, frames, ms, 'linear').then(() => el.remove());
  }
  // A glowing sun-ray fan spinning at (x, y)
  function rays(x, y, size, ms = 900, cls = '') {
    const el = fxSpawn(x, y, { cls: 'fxv1-rays ' + cls, html: '<i></i>', ms: ms + 40, size: [size, size] });
    fxAnimate(el, [{ transform: 'scale(0.3)', opacity: 0 }, { transform: 'scale(1)', opacity: 0.9, offset: 0.25 },
      { transform: 'scale(1.05)', opacity: 0.8, offset: 0.7 }, { transform: 'scale(1.25)', opacity: 0 }], ms, 'ease-out');
    return el;
  }
  // Sparks spiralling outward from a point (the Flame Wheel's explosion)
  function spiral(x, y, { n = 12, r = 120, ms = 700, turns = 0.6 } = {}) {
    for (let i = 0; i < n; i++) {
      const el = fxSpawn(x, y, { cls: 'fx-particle fxv1-spark', ms: ms + 40, size: [7, 7] });
      const frames = [];
      for (let k = 0; k <= 8; k++) {
        const t = k / 8, a = (i / n + t * turns) * Math.PI * 2, rr = r * t;
        frames.push({ transform: `translate(${Math.cos(a) * rr}px, ${Math.sin(a) * rr}px) scale(${1.3 - t})`, opacity: k === 8 ? 0 : 1 });
      }
      fxAnimate(el, frames, ms * fxRand(0.85, 1), 'ease-out');
    }
  }
  // A glowing ellipse spreading over the ground (hot ground, lava pools)
  function groundGlow(x, y, w, h, cls, ms = 500, peak = 1) {
    const el = fxSpawn(x, y, { cls, ms: ms + 40, size: [w, h] });
    fxAnimate(el, [{ transform: 'scale(0.2, 0.3)', opacity: 0 }, { transform: 'scale(1.05, 1)', opacity: peak, offset: 0.6 },
      { transform: 'scale(1, 1)', opacity: peak, offset: 0.85 }, { transform: 'scale(1.1, 1.05)', opacity: 0 }], ms, 'ease-out');
    return el;
  }
  // Molten bubbles swelling and popping on a pool of lava
  function bubbles(x, y, w, n = 5, span = 400) {
    for (let i = 0; i < n; i++) later(i * (span / n), () => {
      const bx = x + fxRand(-w / 2, w / 2), s = fxRand(8, 16);
      const el = fxSpawn(bx, y + fxRand(-4, 4), { cls: 'fxv1-bubble', ms: 360, size: [s, s] });
      fxAnimate(el, [{ transform: 'scale(0.2)', opacity: 0.6 }, { transform: 'translate(0, -4px) scale(1)', opacity: 1, offset: 0.7 },
        { transform: 'translate(0, -6px) scale(1.5)', opacity: 0 }], 340, 'ease-out');
      later(300, () => fxParticles(bx, y - 6, { count: 3, cls: 'fxr-lava', colors: ['#ff6a00'], size: [3, 5], spread: 20, gravity: 20, angle: -90, cone: 120, ms: 360 }));
    });
  }
  // A fighter's HP box turns to grey stone: it hardens, cracks, then crumbles away
  function stoneBlock(el, { ms = 1150, pad = 12 } = {}) {
    const [x, y] = fxPoint(el), [w, h] = sizeOf(el, 160, 50);
    const b = fxSpawn(x, y, { cls: 'fxv1-stone', ms: ms + 40, size: [w + pad * 2, h + pad * 2] });
    fxAnimate(b, [
      { transform: 'scale(1.2)', opacity: 0 },
      { transform: 'scale(0.96)', opacity: 1, offset: 0.12 },
      { transform: 'scale(1.02)', opacity: 1, offset: 0.2 },
      { transform: 'scale(1)', opacity: 1, offset: 0.76 },
      { transform: 'translate(3px, 0)', opacity: 1, offset: 0.82 },
      { transform: 'translate(-3px, 0)', opacity: 1, offset: 0.88 },
      { transform: 'translate(0, 16px) scale(0.96)', opacity: 0 },
    ], ms, 'ease-in');
    later(ms * 0.12, () => { dust(x, y + h * 0.5, { count: 8, spread: w * 0.5, cone: 160 }); sfx('blocked', 0.35, 0.6); });
    later(ms * 0.45, () => crackBurst(x - w * 0.18, y, Math.min(170, w * 0.9), 'stone', fxRand(0, 60), ms * 0.5));
    later(ms * 0.6, () => crackBurst(x + w * 0.22, y + 4, Math.min(130, w * 0.7), 'stone', fxRand(0, 60), ms * 0.36));
    later(ms * 0.84, () => {
      rocks(x, y, { count: 12, spread: 110 + w * 0.3, size: [8, 16], cone: 300 });
      dust(x, y + h * 0.4, { count: 10, spread: w * 0.7, cone: 200, size: [12, 20] });
      sfx('heavy_slam', 1.4, 0.3);
    });
  }

  // ================= Ember Spit (x2 + burn): the beetle hocks a glowing glob of ember spit =================
  CARD_FX['ember-spit'] = {
    // Two glowing mandibles snap at the top of the card and embers puff out
    land(ctx) {
      remember(ctx);
      const [x, y] = cardXY(ctx), [cw, ch] = cardSize(ctx), my = y - ch * 0.12, L = cw * 1.9;
      frame(ctx.win, '#ff8a1f', 750);
      [[JAW_T, -1], [JAW_B, 1]].forEach(([jaw, sd]) => fxAnimate(fxSpawn(x - L * 0.25, my, { cls: 'fxr-svg fxv1-jaw fxv1-hot', html: jaw, ms: 820, size: [L, L * 0.4] }), [
        { transform: 'rotate(0deg) scale(0.3)', opacity: 0 },
        { transform: `rotate(${sd * 26}deg) scale(1)`, opacity: 1, offset: 0.2 },
        { transform: 'rotate(0deg) scale(1)', opacity: 1, offset: 0.36 },
        { transform: `rotate(${sd * 20}deg) scale(1)`, opacity: 1, offset: 0.52 },
        { transform: 'rotate(0deg) scale(1)', opacity: 1, offset: 0.66 },
        { transform: 'rotate(0deg) scale(0.9)', opacity: 0 },
      ], 800, 'ease-in-out'));
      [290, 530].forEach((t, i) => later(t, () => {
        embers(x + L * 0.2, my, { count: 7, spread: 60 });
        smoke(x + L * 0.2, my - 6, 1, { size: 30, rise: 30 });
        if (!i) sfx('bite', 1.7, 0.2);
      }));
      firePlate(ctx, '🔥 EMBER SPIT', '#ff8a1f');
    },
    // A glowing glob of ember spit lobs out on a high arc, trailing fire
    windup(ctx) {
      const from = launchPoint(ctx), to = at(ctx), s = ctx.crit ? 1.3 : 1;
      later(20, () => sfx('hop', 1.8, 0.25));
      return fxFly(from, to, { html: '<i class="fxv1-glob-in"></i>', cls: 'fxv1-glob', ms: 360, arc: upArc(from, to, 50), spin: 300,
        scale: [0.6, 1.2 * s], trail: 'fxr-trail-fire', trailEvery: 28, easing: 'cubic-bezier(.3,0,.8,.7)' });
    },
    // A fiery splat on the victim that sizzles and steams
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit, [bw, bh] = sizeOf(ctx.to, 200, 46);
      scorch(tx, ty + bh * 0.3, Math.min(200, bw * 0.8) * Math.min(1.3, p), 900);
      core(tx, ty, 100 * p, 'fire', 300);
      show(tx, ty, splatSvg(), { cls: 'fxv1-splat', size: [90 * Math.min(1.5, p), 90 * Math.min(1.5, p)], ms: 780, from: 0.2, to: 1, rise: -6, spin: 30 });
      lavaBlobs(tx, ty, { count: 8, spread: 90 * p, gravity: 110, cone: 300, size: [5, 10] });
      later(160, () => smoke(tx, ty - bh * 0.2, 3, { size: 44, dark: false, rise: 44 })); // sssss...
      fxRing(tx, ty, { color: '#ff8a1f', size: 150 * p, width: 6 });
      jolt(ctx.to, [{ transform: 'none' }, { transform: 'scale(1.06, 0.92)', offset: 0.3 }, { transform: 'none' }], 300);
      stamp(ctx, crit ? 'MEGA PTOO!!' : 'PTOO!', { kind: 'fire', size: crit ? 42 : Math.min(46, 30 + 9 * p), rotate: -8, ms: 820, star: crit ? '#ffb300' : null });
      later(120, () => sfx('saw', 2.2, 0.18)); // sizzle
      fxShake(ctx.panel, Math.min(16, 7 * p), 300);
    },
    // Burn: the kit's burn, and a few ember globs dripping off the victim
    gimmick(ctx) {
      fire.burn(ctx, { word: 'BURNING!' });
      const [x, y] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46);
      [-0.3, 0.05, 0.35].forEach((o, i) => later(150 + i * 110, () => drip(x + o * w, y + h * 0.3, 36)));
    },
  };

  // ================= Horn Charge (x4): the beetle paws the ground and rams horn-first =================
  CARD_FX['horn-charge'] = {
    // A beetle scuttles out onto the card, its horn glows and it paws the ground, kicking up dust
    land(ctx) {
      remember(ctx);
      const [x, y] = cardXY(ctx), [cw, ch] = cardSize(ctx), dir = Math.sign(at(ctx)[0] - x) || -1, S = cw * 1.4, by = y;
      frame(ctx.win, '#ffb300', 800);
      const el = fxSpawn(x, by, { cls: 'fxr-svg fxv1-beetle', html: dir < 0 ? BEETLE_L : BEETLE, ms: 940, size: [S, S * 0.7] });
      fxAnimate(el, [
        { transform: `translate(${-dir * 50}px, 0) scale(0.6)`, opacity: 0 },
        { transform: 'translate(0, -3px) scale(1)', opacity: 1, offset: 0.2 },
        { transform: `translate(${-dir * 5}px, 0) rotate(${dir * 4}deg)`, opacity: 1, offset: 0.36 },
        { transform: `translate(${dir * 2}px, -2px) rotate(${-dir * 2}deg)`, opacity: 1, offset: 0.46 },
        { transform: `translate(${-dir * 6}px, 0) rotate(${dir * 4}deg)`, opacity: 1, offset: 0.56 },
        { transform: `translate(${dir * 2}px, -2px) rotate(${-dir * 2}deg)`, opacity: 1, offset: 0.66 },
        { transform: `translate(${dir * 14}px, 0) scale(1)`, opacity: 1, offset: 0.85 },
        { transform: `translate(${dir * 40}px, 0) scale(0.9)`, opacity: 0 },
      ], 900, 'ease-out');
      // The horn glows white-hot
      const hx = x + dir * S * 0.42, hy = by - S * 0.22;
      later(260, () => { show(hx, hy, '<i class="fxv1-hornglow"></i>', { size: [34, 34], ms: 560, from: 0.2, to: 1.2, rise: 0 }); glint(el); });
      // ...while it paws the ground: dust kicks back behind it
      [330, 510].forEach(t => later(t, () => { dust(x - dir * S * 0.3, by + S * 0.26, { count: 6, spread: 50, angle: dir < 0 ? -30 : -150, cone: 60 }); fxShake(ctx.panel, 3, 140); }));
      firePlate(ctx, '🪲 HORN CHARGE', '#ffb300');
    },
    // The beetle charges low across to the victim, horn first, a dust trail behind it
    windup(ctx) {
      const from = src(ctx), [tx, ty] = at(ctx), [fw, fh] = sizeOf(ctx.from, 200, 46), [bw, bh] = sizeOf(ctx.to, 200, 46);
      const dir = Math.sign(tx - from[0]) || -1, s = ctx.crit ? 1.25 : 1;
      lunge(ctx.from, [tx, ty], 18, 300);
      later(30, () => sfx('hop', 0.7, 0.3));
      return scuttle([from[0] - dir * fw * 0.1, from[1] + fh * 0.3], [tx - dir * bw * 0.3, ty + bh * 0.2], { size: 60 * s, ms: 330 });
    },
    // A horn-impact starburst, sparks and dust: the victim is knocked back while the beetle bounces off
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit, from = src(ctx), d = dirOf(from, [tx, ty]), [bw, bh] = sizeOf(ctx.to, 200, 46);
      const hx = tx - d.ux * bw * 0.25, hy = ty + bh * 0.1;
      show(hx, hy, BURST(), { cls: 'fxv1-burst', size: [110 * p, 80 * p], ms: 520, from: 0.3, to: 1, rise: 0, spin: 20 });
      core(hx, hy, 110 * p, 'fire', 320);
      sparks(hx, hy, { count: 14, spread: 130 * p, angle: d.ang, cone: 160 });
      dust(tx, ty + bh * 0.5, { count: 10, spread: 90 * p, cone: 160 });
      speedLines(hx, hy, { n: 8, r0: 24, r1: 90 * Math.min(1.5, p), cls: 'fxr-line-fire', width: 4 });
      // The beetle rebounds off with a flip
      const el = fxSpawn(hx - d.ux * 20, hy + 6, { cls: 'fxr-svg fxv1-beetle', html: d.dx < 0 ? BEETLE_L : BEETLE, ms: 560, size: [58, 41] });
      fxAnimate(el, [
        { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${-d.ux * 40}px, -40px) rotate(${-Math.sign(d.dx) * 160}deg)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${-d.ux * 64}px, 10px) rotate(${-Math.sign(d.dx) * 320}deg)`, opacity: 0 },
      ], 540, 'ease-out');
      knock(ctx.to, from, 26 * Math.min(1.4, p), 380);
      stamp(ctx, crit ? 'MEGA RAM!!' : 'RAM!', { kind: 'fire', size: crit ? 44 : Math.min(50, 32 + 10 * p), rotate: -6, ms: 820, star: crit ? '#ffd23f' : null });
      fxShake(ctx.panel, Math.min(22, 10 * p), 380);
      haptic(crit ? 80 : 50);
    },
  };

  // ================= Cinder Shell (shield +1): two glowing shell halves slam shut =================
  CARD_FX['cinder-shell'] = {
    // The two halves of a cinder shell slide in and close over the card with a hiss
    land(ctx) {
      remember(ctx);
      const [x, y] = cardXY(ctx), [cw, ch] = cardSize(ctx), W = cw * 0.58, H = ch * 1.02;
      frame(ctx.win, '#ff8a1f', 850);
      [[SHELL_L, -1], [SHELL_R, 1]].forEach(([svg, sd]) => fxAnimate(fxSpawn(x + sd * W * 0.5, y, { cls: 'fxr-svg fxv1-shell', html: svg, ms: 900, size: [W, H] }), [
        { transform: `translate(${sd * W * 1.2}px, 0) rotate(${sd * 20}deg)`, opacity: 0 },
        { transform: `translate(${sd * W * 0.5}px, 0) rotate(${sd * 8}deg)`, opacity: 1, offset: 0.2 },
        { transform: 'translate(0, 0) rotate(0deg)', opacity: 1, offset: 0.36 },
        { transform: `translate(${sd * 3}px, 0)`, opacity: 1, offset: 0.44 },
        { transform: 'translate(0, 0)', opacity: 1, offset: 0.84 },
        { transform: 'translate(0, -8px) scale(0.95)', opacity: 0 },
      ], 900, 'ease-out'));
      later(320, () => {
        fxBeam([x, y - H * 0.46], [x, y + H * 0.46], { cls: 'fxv1-seam', ms: 520, width: 7 });
        sparks(x, y, { count: 10, spread: 70 });
        smoke(x, y - H * 0.4, 2, { size: 34, dark: false, rise: 36 });
        fxShake(ctx.panel, 4, 180);
        sfx('blocked', 1.1, 0.35); // clack
      });
      firePlate(ctx, '🌰 CINDER SHELL', '#ff8a1f');
    },
    // Shield: the kit's magma plates, then a glowing cinder shell clamps shut around the beetle's HP box
    gimmick(ctx) {
      fire.armor(ctx, { n: 1, word: '+1 SHELL' });
      const [x, y] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46), W = w * 0.56 + 12, H = h + 34;
      later(380, () => {
        [[SHELL_L, -1], [SHELL_R, 1]].forEach(([svg, sd]) => fxAnimate(fxSpawn(x + sd * W * 0.5, y, { cls: 'fxr-svg fxv1-shell', html: svg, ms: 760, size: [W, H] }), [
          { transform: `translate(${sd * W * 0.7}px, 0)`, opacity: 0 },
          { transform: 'translate(0, 0)', opacity: 1, offset: 0.25 },
          { transform: `translate(${sd * 3}px, 0)`, opacity: 1, offset: 0.34 },
          { transform: 'translate(0, 0)', opacity: 0.9, offset: 0.75 },
          { transform: 'scale(1.06)', opacity: 0 },
        ], 740, 'ease-out'));
        later(190, () => {
          fxBeam([x, y - H * 0.46], [x, y + H * 0.46], { cls: 'fxv1-seam', ms: 480, width: 7 });
          embers(x, y - h * 0.3, { count: 10, spread: w * 0.5 });
        });
      });
    },
  };

  // ================= Bombardier Blast (x2, frenzy: 3 strikes): hot little blasts from the beetle's tail =================
  let volley = null; // where the current strike's blasts are headed (its impact pops them there)
  CARD_FX['bombardier-blast'] = {
    // A firecracker pops up on the card and its fuse fizzes down, sparkling
    land(ctx) {
      remember(ctx);
      const [x, y] = cardXY(ctx), [cw, ch] = cardSize(ctx), S = ch * 0.72;
      frame(ctx.win, '#ff3d3d', 850);
      const el = fxSpawn(x, y, { cls: 'fxr-svg fxv1-cracker', html: CRACKER, ms: 940, size: [S * 0.6, S] });
      fxAnimate(el, [
        { transform: 'translate(0, 30px) scale(0.4) rotate(-20deg)', opacity: 0 },
        { transform: 'translate(0, -4px) scale(1.08) rotate(6deg)', opacity: 1, offset: 0.2 },
        { transform: 'translate(0, 0) scale(1) rotate(-4deg)', opacity: 1, offset: 0.32 },
        { transform: 'translate(0, 0) scale(1) rotate(3deg)', opacity: 1, offset: 0.6 },
        { transform: 'translate(0, 0) scale(1.1) rotate(-3deg)', opacity: 1, offset: 0.85 },
        { transform: 'translate(0, 0) scale(1.4)', opacity: 0 },
      ], 920, 'ease-out');
      // The fuse sparkles as it burns down toward the cracker
      for (let i = 0; i < 6; i++) later(200 + i * 70, () => {
        const t = i / 5, fx = x + S * 0.6 * (0.18 - 0.1 * t), fy = y - S * (0.48 - 0.16 * t);
        fxParticles(fx, fy, { count: 5, colors: ['#fff', '#fff3a0', '#ffd23f'], size: [2, 4], spread: 26, gravity: 14, ms: 320 });
      });
      later(780, () => { core(x, y, 70, 'fire', 280); sparks(x, y, { count: 12, spread: 80 }); sfx('hit', 1.6, 0.25); });
      later(520, () => slam(x, y + S * 0.3, '×3', { kind: 'fire', size: 34, rotate: -8, ms: 600 }));
      firePlate(ctx, '🧨 BOMBARDIER BLAST', '#ff3d3d');
    },
    // Frenzy (before the strikes): the kit's fire aura, the beetle's tail glows red-hot and a fuse fizzes along its box
    gimmick(ctx) {
      fire.frenzy(ctx, { word: 'BOMBS AWAY!' });
      const [x, y] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46), dir = Math.sign(at(ctx)[0] - x) || -1;
      const tail = [x - dir * w * 0.55, y + h * 0.1];
      show(tail[0], tail[1], '<i class="fxv1-tailglow"></i>', { size: [60, 60], ms: 900, from: 0.3, to: 1.2, rise: 0 });
      // The fuse: a spark races along under the box toward the tail
      const a = [x + dir * w * 0.45, y + h * 0.5 + 8], b = [tail[0], y + h * 0.5 + 8];
      fxBeam(a, b, { cls: 'fxv1-fuse', ms: 700, width: 4 });
      for (let i = 0; i <= 6; i++) later(i * 50, () => {
        const t = i / 6;
        fxParticles(a[0] + (b[0] - a[0]) * t, a[1], { count: 4, colors: ['#fff', '#fff3a0', '#ffb300'], size: [2, 4], spread: 22, gravity: 10, ms: 300 });
      });
      later(340, () => { core(tail[0], tail[1], 90, 'fire', 320); sparks(tail[0], tail[1], { count: 10, spread: 80 }); smoke(tail[0], tail[1], 2, { size: 40 }); });
    },
    // Strike s fires s + 1 hot little blasts from the beetle's tail in rapid succession
    windup(ctx) {
      const s = clamp(ctx.strike || 0, 0, 2), n = s + 1, [tx, ty] = at(ctx), ms = [280, 260, 240][s];
      const pts = [], flights = [];
      for (let i = 0; i < n; i++) {
        const from = i === 0 ? launchPoint(ctx) : [src(ctx)[0] + fxRand(-30, 30), src(ctx)[1] + fxRand(-14, 14)];
        const hit = [tx + fxRand(-28, 28), ty + fxRand(-12, 12)];
        pts.push(hit);
        flights.push(new Promise(r => later(i * 55, () => {
          fxRing(from[0], from[1], { color: '#ffd23f', size: 50, width: 4, ms: 240 });
          sfx('hit', 1.8 + i * 0.2, 0.18); // pff!
          fxFly(from, hit, { html: '<i class="fxv1-shot-in"></i>', cls: 'fxv1-shot', ms, arc: (i % 2 ? -1 : 1) * (30 + 20 * i), spin: 360,
            scale: [0.6, 1 + s * 0.2], trail: 'fxr-trail-fire', trailEvery: 30, easing: 'cubic-bezier(.4,0,.9,.6)' }).then(r);
        })));
      }
      volley = { pts, t: performance.now() };
      if (s === 2) dim(VIG.fire, 0.55, 320);
      return Promise.all(flights);
    },
    // Pops that grow every strike: POP! -> BANG!! -> KABOOM!!!
    impact(ctx) {
      const s = clamp(ctx.strike || 0, 0, 2), [tx, ty] = at(ctx), p = pow(ctx) + s * 0.25, crit = !!ctx.crit;
      const pts = volley && performance.now() - volley.t < 1500 ? volley.pts : Array.from({ length: s + 1 }, () => [tx + fxRand(-28, 28), ty + fxRand(-12, 12)]);
      pts.forEach(([hx, hy], i) => later(i * 50, () => {
        core(hx, hy, (50 + 22 * s) * Math.min(1.4, p), 'fire', 320);
        show(hx, hy, BURST(), { cls: 'fxv1-burst', size: [(50 + 18 * s) * Math.min(1.3, p), (38 + 14 * s) * Math.min(1.3, p)], ms: 420, from: 0.3, to: 1, rise: 0 });
        sparks(hx, hy, { count: 6 + s * 2, spread: (60 + 30 * s) * p, ms: 460 });
        smoke(hx, hy, 1 + (s > 0 ? 1 : 0), { size: 34 + s * 10, rise: 30 });
      }));
      for (let i = 0; i <= s; i++) later(i * 70, () => fxRing(tx, ty, { color: i % 2 ? '#ffd23f' : '#ff3d00', size: (120 + 50 * i + 30 * s) * p, ms: 420, width: 6 }));
      stamp(ctx, ['POP!', 'BANG!!', 'KABOOM!!!'][s], { dx: (s - 1) * 24, kind: s === 2 ? 'lava' : 'fire',
        size: 30 + s * 10 + (crit ? 8 : 0), rotate: [-10, 8, -4][s], ms: 650 + s * 150, star: s === 2 ? '#ffb300' : null });
      fxShake(ctx.panel, 6 + s * 6, 260 + s * 60);
      fxShake(ctx.to, 6 + s * 3, 250);
      if (s === 2) {
        core(tx, ty, 150 * Math.min(1.4, p), 'fire', 460);
        speedLines(tx, ty, { n: 10, r0: 60, r1: 170, cls: 'fxr-line-fire', width: 5 });
        smoke(tx, ty, 4, { size: 70, spread: 90, rise: 60 });
        lavaBlobs(tx, ty, { count: 8, spread: 140, cone: 300 });
        fxTint('#ff3d00', { ms: 400, opacity: 0.3 });
        flash('#fff3a0', 0.3);
        haptic(80);
      }
    },
  };

  // ================= Mandible Crunch (x5, lifesteal): huge pincers fly at the victim and CRUNCH =================
  // Two jaws at (x, y) pointing along `ang`, swinging from `open0` to `open1` degrees apart over ms
  function jaws(x, y, ang, L, { open0 = 30, open1 = 0, ms = 300, move = [0, 0], hold = 1, easing = 'ease-in' } = {}) {
    return Promise.all([[JAW_T, -1], [JAW_B, 1]].map(([svg, sd]) => {
      const el = fxSpawn(x, y, { cls: 'fxr-svg fxv1-jaw', html: svg, ms: ms + 40, size: [L, L * 0.4] });
      return fxAnimate(el, [
        { transform: `translate(0, 0) rotate(${ang + sd * open0}deg)`, opacity: 1 },
        { transform: `translate(${move[0]}px, ${move[1]}px) rotate(${ang + sd * open1}deg)`, opacity: 1, offset: hold },
        ...(hold < 1 ? [{ transform: `translate(${move[0]}px, ${move[1]}px) rotate(${ang + sd * open1}deg) scale(0.9)`, opacity: 0 }] : []),
      ], ms, easing).then(() => { if (hold >= 1) el?.remove(); });
    }));
  }
  CARD_FX['mandible-crunch'] = {
    // Huge pincers swing in from the sides and snap shut on the card
    land(ctx) {
      remember(ctx);
      const [x, y] = cardXY(ctx), [cw] = cardSize(ctx), L = cw * 2.2;
      frame(ctx.win, '#ff6a00', 850);
      fxTint(VIG.fire, { ms: 700, opacity: 0.35 });
      // hinge off to the left of the card, jaws reaching right across it
      const hx = x - L * 0.36;
      jaws(hx, y, 0, L, { open0: 55, open1: 40, ms: 260, easing: 'ease-out' }).then(() =>
        jaws(hx, y, 0, L, { open0: 40, open1: 0, ms: 560, hold: 0.55 }));
      later(330, () => {
        sparks(x + L * 0.1, y, { count: 12, spread: 80 });
        core(x + L * 0.1, y, 60, 'fire', 260);
        slam(x + L * 0.05, y - 36, 'SNAP!', { kind: 'fire', size: 22, rotate: -8, ms: 560 });
        faceJiggle(ctx, [{ transform: 'none' }, { transform: 'scale(0.92, 1.05)' }, { transform: 'none' }], 240);
        fxShake(ctx.panel, 5, 200);
        sfx('bite', 0.9, 0.35);
      });
      firePlate(ctx, '✂️ MANDIBLE CRUNCH', '#ff6a00');
    },
    // The pincers fly at the victim, opening wider and wider
    windup(ctx) {
      const from = launchPoint(ctx), [tx, ty] = at(ctx), d = dirOf(from, [tx, ty]), s = ctx.crit ? 1.25 : 1, L = 140 * s;
      const stop = [tx - d.ux * L * 0.3, ty - d.uy * L * 0.3];
      later(40, () => sfx('saw', 1.2, 0.15));
      for (let i = 1; i < 8; i++) later(i * 40, () => fxSpawn(from[0] + (stop[0] - from[0]) * i / 9, from[1] + (stop[1] - from[1]) * i / 9, { cls: 'fxr-trail-fire', ms: 400 }));
      return jaws(from[0], from[1], d.ang, L, { open0: 8, open1: 42, ms: 340, move: [stop[0] - from[0], stop[1] - from[1]], easing: 'cubic-bezier(.4,0,.8,.6)' });
    },
    // CRUNCH: the jaws slam shut on the victim, sparks and shell cracks fly
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit, from = src(ctx), d = dirOf(launchPoint(ctx), [tx, ty]), L = 140 * Math.min(1.3, p * 0.8 + 0.3);
      const hx = tx - d.ux * L * 0.3, hy = ty - d.uy * L * 0.3;
      jaws(hx, hy, d.ang, L, { open0: 42, open1: 0, ms: 100 });
      later(90, () => {
        core(tx, ty, 90 * p, 'fire', 300);
        later(10, () => jaws(hx, hy, d.ang, L, { open0: -4, open1: 0, ms: 420, hold: 0.6 })); // clamped shut on top of the blast
        sparks(tx, ty, { count: 16, spread: 140 * p });
        crackBurst(tx, ty, 140 * p, 'lava', fxRand(0, 60), 720);
        fxRing(tx, ty, { color: '#ffb300', size: 170 * p, width: 7 });
        jolt(ctx.to, [{ transform: 'none' }, { transform: 'scale(1.08, 0.82)', offset: 0.25 }, { transform: 'scale(0.97, 1.04)', offset: 0.6 }, { transform: 'none' }], 380);
        knock(ctx.to, from, 12, 300);
      });
      stamp(ctx, crit ? 'MEGA CRUNCH!!' : 'CRUNCH!', { kind: 'lava', size: crit ? 44 : Math.min(50, 32 + 10 * p), rotate: -5, ms: 880, star: crit ? '#ff8a1f' : null });
      fxShake(ctx.panel, Math.min(24, 11 * p), 400);
      haptic(crit ? 90 : 60);
    },
    // Lifesteal: fiery wisps stream back into the beetle, and its jaws chomp on the stolen life
    gimmick(ctx) {
      fire.lifesteal(ctx, { n: 9 });
      const [x, y] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46);
      later(440, () => {
        jaws(x - 30, y - h * 0.5 - 16, 0, 60, { open0: 30, open1: 0, ms: 420, hold: 0.4 });
        later(150, () => slam(x, y + h * 0.5 + 18, 'NOM NOM!', { kind: 'fire', size: 24, rotate: 4, ms: 700 }));
        sfx('leech', 0.8, 0.4);
      });
    },
  };

  // ================= Solar Flare (x5 + burn, SUPER MOVE): the Scarab King calls down the sun =================
  CARD_FX['solar-flare'] = {
    // A sun rises behind the card, its rays spinning, and everything turns gold
    land(ctx) {
      remember(ctx);
      const [x, y] = cardXY(ctx), [w, h] = winSize(ctx), S = w * 1.2, sy = y - h * 0.18;
      dim(VIG.sun, 0.8, 1100);
      frame(ctx.win, '#ffd23f', 1000);
      rays(x, sy, S * 2.1, 1080);
      const sun = fxSpawn(x, sy, { cls: 'fxr-svg fxv1-sun', html: `<i class="fxv1-spin">${SUN}</i>`, ms: 1100, size: [S, S] });
      fxAnimate(sun, [
        { transform: 'translate(0, 80px) scale(0.3)', opacity: 0 },
        { transform: 'translate(0, -4px) scale(1.05)', opacity: 1, offset: 0.35 },
        { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0.5 },
        { transform: 'translate(0, 0) scale(1.08)', opacity: 1, offset: 0.85 },
        { transform: 'translate(0, -10px) scale(1.3)', opacity: 0 },
      ], 1080, 'ease-out');
      later(380, () => { fxParticles(x, sy, { count: 12, html: '✦', colors: GOLD, size: [5, 10], spread: S * 0.9, ms: 700, spin: 90 }); sfx('celebrate', 1.2, 0.25); });
      later(620, () => fxRing(x, sy, { color: '#fff6a0', size: S * 1.8, width: 6, ms: 460 }));
      firePlate(ctx, '☀️ SOLAR FLARE', '#ffd23f');
    },
    // The sun flares over the Scarab King, then a thick blinding golden beam blasts at the victim
    windup(ctx) {
      const from = src(ctx), [tx, ty] = at(ctx), s = ctx.crit ? 1.25 : 1, [, fh] = sizeOf(ctx.from, 200, 46);
      const o = [from[0], from[1] - fh * 0.2];
      dim(VIG.sun, ctx.crit ? 0.9 : 0.75, 460);
      fxAnimate(fxSpawn(o[0], o[1], { cls: 'fxr-svg fxv1-sun', html: `<i class="fxv1-spin">${SUN}</i>`, ms: 460, size: [90, 90] }), [
        { transform: 'scale(0.2)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: 0.4 },
        { transform: 'scale(1.5)', opacity: 1, offset: 0.6 }, { transform: 'scale(2)', opacity: 0 }], 440, 'ease-in');
      charge(o[0], o[1], { colors: GOLD, n: 14, r: 110, ms: 200 });
      later(190, () => {
        fxBeam(o, [tx, ty], { cls: 'fxv1-sunbeam', ms: 520, width: 58 * s });
        fxBeam(o, [tx, ty], { cls: 'fxv1-sunbeam-core', ms: 480, width: 20 * s });
        fxTint('#fff6c8', { ms: 280, opacity: 0.35 });
        sfx('combo', 1.4, 0.25);
      });
      return wait(400);
    },
    // A blinding flash: sun rays burst from the victim and a golden shock rolls out
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit, [bw] = sizeOf(ctx.to, 200, 46);
      flash('#fff6c8', crit ? 0.8 : 0.6);
      fxTint(VIG.sun, { ms: 700, opacity: 0.7 });
      rays(tx, ty, Math.min(360, 240 * p), 900);
      core(tx, ty, 220 * p, 'sun', 480);
      show(tx, ty, SUN, { cls: 'fxv1-sun', size: [100 * Math.min(1.4, p), 100 * Math.min(1.4, p)], ms: 700, from: 0.2, to: 1, rise: 10, spin: 90 });
      for (let i = 0; i < 3; i++) later(i * 90, () => fxRing(tx, ty, { color: ['#ffffff', '#ffd23f', '#ff8a1f'][i], size: (180 + i * 110) * p, width: 11 - i * 3, ms: 580 }));
      speedLines(tx, ty, { n: 12, r0: 50, r1: 190 * Math.min(1.4, p), cls: 'fxv1-line-sun', width: 5 });
      sparks(tx, ty, { count: 18, spread: 200 * p });
      embers(tx, ty, { count: 12, spread: bw * 0.6 });
      jolt(ctx.to, [{ transform: 'none' }, { transform: 'scale(1.1)', offset: 0.2 }, { transform: 'scale(0.96)', offset: 0.5 }, { transform: 'none' }], 420);
      stamp(ctx, crit ? 'SUPERNOVA!!' : 'SOLAR FLARE!', { kind: 'sun fxv1-sunstamp', size: crit ? 44 : Math.min(44, 28 + 8 * p), rotate: -5, ms: 1050, star: '#ffd23f' });
      fxShake(ctx.panel, Math.min(28, 15 * p), 520);
      fxShake(ctx.to, 14, 380);
      haptic(crit ? 140 : 100);
    },
    // Burn: the kit's burn as a sunburn, with golden sparkles and a mini sun baking the victim
    gimmick(ctx) {
      fire.burn(ctx, { word: 'SUNBURN!' });
      const [x, y] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46);
      later(100, () => show(x + w * 0.45, y - h * 0.6, SUN, { cls: 'fxv1-sun', size: [40, 40], ms: 800, from: 0.2, to: 1, rise: 8, spin: 120 }));
      fxParticles(x, y, { count: 10, html: '✦', colors: GOLD, size: [5, 9], spread: w * 0.5, ms: 700, spin: 90 });
      later(260, () => fxPop(x - w * 0.45, y - h * 0.5, '🥵', { size: 26, ms: 700, rise: 10, rotate: -10 }));
    },
  };

  // ================= Sunrise Rebirth (wallow: heal + shield): the scarab rolls the sun up into the sky =================
  CARD_FX['sunrise-rebirth'] = {
    // A sunrise over a horizon line on the card: the sky warms, the sun climbs and its rays fan out
    land(ctx) {
      remember(ctx);
      const [x, y] = cardXY(ctx), [cw, ch] = cardSize(ctx), W = cw * 1.1, H = ch * 0.8;
      frame(ctx.win, '#ffb347', 1000);
      const el = fxSpawn(x, y, { cls: 'fxv1-dawn', html: `<div class="fxv1-dawn-sky"></div><div class="fxv1-dawn-sun">${SUN}</div><div class="fxv1-dawn-ground"></div>`, ms: 1100, size: [W, H] });
      fxAnimate(el, [
        { transform: 'scale(0.7)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1, offset: 0.12 },
        { transform: 'scale(1)', opacity: 1, offset: 0.85 },
        { transform: 'scale(0.96)', opacity: 0 },
      ], 1080, 'ease-out');
      // The sun climbs out from behind the horizon
      jolt(el?.querySelector('.fxv1-dawn-sun'), [{ transform: 'translateY(75%) scale(0.9)' }, { transform: 'translateY(-12%) scale(1.05)', offset: 0.6 },
        { transform: 'translateY(-8%) scale(1)' }], 1000, { easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'forwards' });
      later(560, () => { fxParticles(x, y - H * 0.1, { count: 8, html: '✦', colors: GOLD, size: [4, 8], spread: W * 0.6, ms: 600, spin: 90 }); sfx('heal', 1.3, 0.25); });
      later(700, () => slam(x, y - H * 0.34, 'DAWN!', { kind: 'sun', size: 24, rotate: 6, ms: 600 }));
      firePlate(ctx, '🌅 SUNRISE REBIRTH', '#ffb347');
    },
    // Wallow: the scarab rolls a glowing sun up over its HP box, then golden healing and a shell of magma
    gimmick(ctx) {
      const [x, y] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46), R = 44, T = 620;
      const path = t => { const a = Math.PI * (1 - t * 0.5); return [Math.cos(a) * w * 0.5, -Math.sin(a) * (h * 0.5 + 34) + h * 0.2]; };
      const sunEl = fxSpawn(x, y, { cls: 'fxr-svg fxv1-sun', html: SUN, ms: T + 80, size: [R, R] });
      const bug = fxSpawn(x, y, { cls: 'fxv1-scarab', html: '<span>🪲</span>', ms: T + 80 });
      const sf = [], bf = [];
      for (let k = 0; k <= 10; k++) {
        const t = k / 10, [px, py] = path(t), [qx, qy] = path(Math.max(0, t - 0.1));
        const [ax, ay] = path(Math.max(0, t - 0.09)), [cx, cy] = path(Math.min(1, t + 0.01));
        const ang = Math.atan2(cy - ay, cx - ax) * 180 / Math.PI;
        sf.push({ transform: `translate(${px}px, ${py}px) rotate(${t * 540}deg) scale(${0.6 + 0.8 * t})`, opacity: k === 10 ? 0.4 : 1 });
        bf.push({ transform: `translate(${qx}px, ${qy + 4}px) rotate(${ang + 90}deg)`, opacity: k === 10 ? 0 : 1 });
      }
      fxAnimate(sunEl, sf, T, 'ease-in-out');
      fxAnimate(bug, bf, T, 'ease-in-out');
      for (let i = 1; i < 9; i++) later(i * T / 9, () => { const [px, py] = path(i / 9); fxSpawn(x + px, y + py, { cls: 'fxr-trail-sun', ms: 420 }); });
      later(T - 40, () => {
        const top = [x + path(1)[0], y + path(1)[1]];
        rays(top[0], top[1], 220, 900);
        core(top[0], top[1], 130, 'sun', 420);
        fxRing(top[0], top[1], { color: '#fff6a0', size: 220, width: 7, ms: 520 });
        flash('#fff6c8', 0.25);
        fire.heal(ctx, { sun: true, shield: true, word: 'REBORN!' });
      });
    },
  };

  // ================= Lava Whip (x4, cleave): a long glowing lizard tail lashes the victim =================
  CARD_FX['lava-whip'] = {
    // A curvy lizard tail whips across the card, dripping lava
    land(ctx) {
      remember(ctx);
      const [x, y] = cardXY(ctx), [cw, ch] = cardSize(ctx), L = cw * 1.5;
      frame(ctx.win, '#ff5a00', 800);
      const hx = x - cw * 0.55, hy = y + ch * 0.28;
      const el = fxSpawn(hx, hy, { cls: 'fxr-svg fxv1-tail', html: TAIL, ms: 820, size: [L, L * 0.3], style: { transformOrigin: '0 50%' } });
      if (el) el.animate([
        { transform: 'translate(0, -50%) rotate(20deg) scaleX(0.3)', opacity: 0 },
        { transform: 'translate(0, -50%) rotate(-10deg) scaleX(1)', opacity: 1, offset: 0.2 },
        { transform: 'translate(0, -50%) rotate(-70deg) scaleX(0.95) scaleY(-1)', opacity: 1, offset: 0.45 },
        { transform: 'translate(0, -50%) rotate(-30deg) scaleX(1)', opacity: 1, offset: 0.7 },
        { transform: 'translate(0, -50%) rotate(-40deg) scaleX(0.6)', opacity: 0 },
      ], { duration: 800, easing: 'ease-in-out', fill: 'forwards' });
      later(340, () => { slash(x, y - ch * 0.1, -35, cw * 1.2, 7, 'fxr-slash-fire'); sparks(x + cw * 0.3, y - ch * 0.3, { count: 8, spread: 60 }); sfx('saw', 3, 0.12); });
      [-0.25, 0.05, 0.3].forEach((o, i) => later(380 + i * 90, () => drip(x + o * cw, y - ch * 0.05, ch * 0.4)));
      firePlate(ctx, '🦎 LAVA WHIP', '#ff5a00');
    },
    // Cleave (before the hit): the kit's lava crack melts any shields, and the tail tip snaps over them
    gimmick(ctx) {
      fire.smash(ctx, { word: 'MELTED!' });
      const [tx, ty] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46);
      if (!ctx.blocked) return;
      later(200, () => { slash(tx, ty - h * 0.2, 20, w * 0.9, 8, 'fxr-slash-fire'); [-0.3, 0, 0.3].forEach((o, i) => later(i * 70, () => drip(tx + o * w, ty + h * 0.3, 40))); });
    },
    // The long glowing tail lashes out from the lizard to the victim
    windup(ctx) {
      const from = src(ctx), to = at(ctx), s = ctx.crit ? 1.2 : 1;
      jolt(ctx.from, [{ transform: 'none' }, { transform: 'rotate(-4deg)', offset: 0.3 }, { transform: 'rotate(3deg)', offset: 0.7 }, { transform: 'none' }], 360);
      anchored(from, to, { cls: 'fxr-svg fxv1-tail', html: TAIL, width: 46 * s, ms: 420, frames: [
        { transform: 'scaleX(0.1) scaleY(1)', opacity: 0.6 },
        { transform: 'scaleX(0.6) scaleY(-1.3)', opacity: 1, offset: 0.3 },
        { transform: 'scaleX(1) scaleY(1)', opacity: 1, offset: 0.75 },
        { transform: 'scaleX(0.9) scaleY(0.6)', opacity: 0 },
      ] });
      later(30, () => sfx('saw', 2.6, 0.12));
      return wait(320);
    },
    // WHIP-CRACK: a crack line across the victim, sparks and a splash of lava
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit, [bw, bh] = sizeOf(ctx.to, 200, 46);
      slash(tx, ty, -18, bw * 1.1 * Math.min(1.4, p), 12, 'fxr-slash-fire');
      later(40, () => slash(tx, ty + 2, -18, bw * 0.9, 4, 'fxv1-crackline'));
      core(tx, ty, 110 * p, 'fire', 320);
      sparks(tx, ty, { count: 14, spread: 140 * p, angle: -18, cone: 80 });
      later(60, () => sparks(tx, ty, { count: 8, spread: 120 * p, angle: 162, cone: 80 }));
      lavaBlobs(tx, ty, { count: 10, spread: 120 * p, cone: 220 });
      speedLines(tx, ty, { n: 6, r0: 30, r1: 110, cls: 'fxr-line-fire', width: 4 });
      jolt(ctx.to, [{ transform: 'none' }, { transform: 'rotate(-3deg) translateX(-6px)', offset: 0.25 }, { transform: 'rotate(2deg)', offset: 0.6 }, { transform: 'none' }], 360);
      stamp(ctx, crit ? 'MEGA CRACK!!' : 'WHIP-CRACK!', { kind: 'lava', size: crit ? 42 : Math.min(40, 26 + 8 * p), rotate: -8, ms: 860, star: crit ? '#ff8a1f' : null });
      fxShake(ctx.panel, Math.min(20, 9 * p), 340);
      haptic(40);
    },
  };

  // ================= Flame Tongue (x3 + burn): a forked tongue flicks out as a stream of flame =================
  CARD_FX['flame-tongue'] = {
    // A forked tongue flicks out twice over a heat shimmer, and a chili pops up
    land(ctx) {
      remember(ctx);
      const [x, y] = cardXY(ctx), [cw, ch] = cardSize(ctx), dir = Math.sign(at(ctx)[0] - x) || -1, L = cw * 1.1;
      frame(ctx.win, '#ff3d6a', 800);
      heatWave(x, y, cw * 1.6, 700);
      const a = [x - dir * cw * 0.3, y + ch * 0.05];
      anchored(a, [a[0] + dir * 10, a[1]], { cls: 'fxr-svg fxv1-tongue', html: TONGUE, width: 22, len: L * 1.3, ms: 900, frames: [
        { transform: 'scaleX(0)', opacity: 1 }, { transform: 'scaleX(1)', opacity: 1, offset: 0.2 }, { transform: 'scaleX(0.1)', opacity: 1, offset: 0.4 },
        { transform: 'scaleX(1.1)', opacity: 1, offset: 0.6 }, { transform: 'scaleX(0)', opacity: 0.6, offset: 0.85 }, { transform: 'scaleX(0)', opacity: 0 }] });
      later(200, () => show(x + dir * cw * 0.2, y - ch * 0.26, '<b class="fxv1-emoji">🌶️</b>', { font: 34, ms: 700, from: 0.2, to: 1, rise: 14, spin: 40 }));
      later(420, () => embers(x + dir * cw * 0.5, y, { count: 7, spread: 50 }));
      firePlate(ctx, '🌶️ FLAME TONGUE', '#ff3d6a');
    },
    // The tongue flicks out and a stream of flame rolls off it onto the victim
    windup(ctx) {
      const from = src(ctx), [tx, ty] = at(ctx), d = dirOf(from, [tx, ty]), s = ctx.crit ? 1.25 : 1;
      anchored(from, [tx, ty], { cls: 'fxr-svg fxv1-tongue', html: TONGUE, width: 18, len: d.len * 0.4, ms: 380, frames: [
        { transform: 'scaleX(0)', opacity: 1 }, { transform: 'scaleX(1)', opacity: 1, offset: 0.3 }, { transform: 'scaleX(1)', opacity: 1, offset: 0.6 }, { transform: 'scaleX(0)', opacity: 0 }] });
      later(80, () => anchored(from, [tx, ty], { cls: 'fxv1-stream', width: 40 * s, ms: 380, frames: [
        { transform: 'scale(0, 0.4)', opacity: 0.4 }, { transform: 'scale(1, 1)', opacity: 1, offset: 0.55 }, { transform: 'scale(1.03, 1.2)', opacity: 0 }] }));
      for (let i = 0; i < 6; i++) later(80 + i * 40, () => fxParticles(from[0] + d.ux * d.len * 0.35, from[1] + d.uy * d.len * 0.35,
        { count: 3, colors: FIRE_COLS, size: [5, 9], spread: d.len * 0.6, angle: d.ang, cone: 22, gravity: -10, ms: 300 }));
      later(80, () => sfx('saw', 1.5, 0.15)); // whoosh
      return wait(340);
    },
    // Flames lick up all over the victim, heat shimmers and chilis fly: SPICY!
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit, [bw, bh] = sizeOf(ctx.to, 200, 46);
      flames(tx, ty + bh * 0.45, { n: crit ? 7 : 5, w: bw * 0.9, h: 60 * Math.min(1.5, p), ms: 720 });
      heatWave(tx, ty, 200 * Math.min(1.4, p), 520);
      core(tx, ty, 110 * p, 'fire', 320);
      embers(tx, ty, { count: 12, spread: 100 * p });
      fxParticles(tx, ty, { count: crit ? 6 : 3, html: '🌶️', colors: ['#fff'], size: [8, 12], spread: 110 * p, gravity: 90, angle: -90, cone: 200, ms: 750 });
      jolt(ctx.to, [{ transform: 'none' }, { transform: 'translateY(-8px) scale(1.04)', offset: 0.25 }, { transform: 'translateY(2px)', offset: 0.6 }, { transform: 'none' }], 380);
      stamp(ctx, crit ? 'EXTRA SPICY!!' : 'SPICY!', { kind: 'fire fxv1-spicy', size: crit ? 42 : Math.min(48, 30 + 10 * p), rotate: 6, ms: 860, star: crit ? '#ff3d6a' : null });
      fxShake(ctx.panel, Math.min(18, 8 * p), 320);
    },
    // Burn: the kit's burn gone spicy, the victim steams red-faced
    gimmick(ctx) {
      fire.burn(ctx, { word: 'SPICY BURN!' });
      const [x, y] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46);
      later(200, () => fxPop(x + w * 0.45, y - h * 0.5, '🥵', { size: 28, ms: 760, rise: 12, rotate: 10 }));
      [-1, 1].forEach((sd, i) => later(260 + i * 120, () => smoke(x + sd * w * 0.3, y - h * 0.5, 1, { size: 30, dark: false, rise: 40 })));
    },
  };

  // ================= Heat Bask (heal): a lizard in sunglasses lounges on hot rocks =================
  CARD_FX['heat-bask'] = {
    // Hot rocks steam at the bottom of the card while a cool lizard lounges on them
    land(ctx) {
      remember(ctx);
      const [x, y] = cardXY(ctx), [cw, ch] = cardSize(ctx), by = y + ch * 0.26;
      frame(ctx.win, '#ffb070', 950);
      [-0.3, 0, 0.3].forEach((o, i) => later(i * 60, () => show(x + o * cw * 1.1, by + (i === 1 ? 4 : 0), ROCK, { cls: 'fxv1-rock', size: [cw * 0.52, cw * 0.43], ms: 950, from: 0.4, to: 1, rise: 0 })));
      later(150, () => smoke(x, by - 6, 4, { size: 36, dark: false, spread: cw * 0.8, rise: ch * 0.5, ms: 900 }));
      later(420, () => smoke(x, by - 6, 3, { size: 32, dark: false, spread: cw * 0.7, rise: ch * 0.5, ms: 700 }));
      later(120, () => {
        const liz = fxSpawn(x, by - cw * 0.26, { cls: 'fxv1-lounge', html: '<span class="fxv1-liz">🦎</span><span class="fxv1-shades">😎</span>', ms: 880 });
        fxAnimate(liz, [
          { transform: 'translate(0, 20px) scale(0.4)', opacity: 0 },
          { transform: 'translate(0, 0) scale(1.08)', opacity: 1, offset: 0.2 },
          { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0.35 },
          { transform: 'translate(0, -2px) scale(1.02)', opacity: 1, offset: 0.6 },
          { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0.85 },
          { transform: 'translate(0, -8px) scale(0.95)', opacity: 0 },
        ], 860, 'ease-out');
      });
      later(560, () => slam(x, y - ch * 0.3, 'AHHH~', { kind: 'sun', size: 20, rotate: -6, ms: 520 }));
      firePlate(ctx, '♨️ HEAT BASK', '#ffb070');
    },
    // Heal: the kit's warm glow, with steam and heat waves rolling up around the lizard's box
    gimmick(ctx) {
      fire.heal(ctx, { word: 'BASKING!' });
      const [x, y] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46);
      [0, 220].forEach(t => later(t, () => heatWave(x, y, w * 1.2, 560)));
      for (let i = 0; i < 3; i++) later(120 + i * 150, () => smoke(x + (i - 1) * w * 0.3, y + h * 0.3, 2, { size: 38, dark: false, rise: 70, spread: 30 }));
      later(300, () => fxPop(x + w * 0.5, y - h * 0.5, '😎', { size: 30, ms: 800, rise: 8, rotate: 12 }));
      later(380, () => fxPop(x - w * 0.5, y - h * 0.5, '♨️', { size: 24, ms: 700, rise: 14, rotate: -8 }));
    },
  };

  // ================= Flame Wheel (x6): the salamander curls into a wheel of fire and rolls into the victim =================
  CARD_FX['flame-wheel'] = {
    // The salamander curls up and spins into a wheel of fire on the card
    land(ctx) {
      remember(ctx);
      const [x, y] = cardXY(ctx), [cw] = cardSize(ctx), S = cw * 1.15;
      frame(ctx.win, '#ff6a00', 900);
      const liz = fxSpawn(x, y, { cls: 'fxv1-curl', html: '🦎', ms: 900, style: { fontSize: S * 0.42 + 'px' } });
      fxAnimate(liz, [
        { transform: 'rotate(0deg) scale(1.2)', opacity: 0 },
        { transform: 'rotate(-90deg) scale(1)', opacity: 1, offset: 0.2 },
        { transform: 'rotate(-540deg) scale(0.85)', opacity: 1, offset: 0.7 },
        { transform: 'rotate(-900deg) scale(0.7)', opacity: 0 },
      ], 880, 'ease-in');
      later(180, () => {
        const ring = fxSpawn(x, y, { cls: 'fxr-svg fxv1-ring', html: `<i class="fxv1-spin fxv1-spin-fast">${FIRE_RING}</i>`, ms: 760, size: [S, S] });
        fxAnimate(ring, [{ transform: 'scale(0.2)', opacity: 0 }, { transform: 'scale(1.08)', opacity: 1, offset: 0.25 },
          { transform: 'scale(1)', opacity: 1, offset: 0.8 }, { transform: 'scale(1.2)', opacity: 0 }], 740, 'ease-out');
        spiral(x, y, { n: 10, r: S * 0.8, ms: 700 });
        sfx('saw', 1.6, 0.18);
      });
      later(480, () => embers(x, y, { count: 8, spread: S * 0.6 }));
      firePlate(ctx, '🎡 FLAME WHEEL', '#ff6a00');
    },
    // A spinning ring of fire rolls along the floor from the salamander to the victim, trailing flame
    windup(ctx) {
      const from = src(ctx), [tx, ty] = at(ctx), [, fh] = sizeOf(ctx.from, 200, 46), [bw, bh] = sizeOf(ctx.to, 200, 46), s = ctx.crit ? 1.25 : 1;
      const dir = Math.sign(tx - from[0]) || -1, a = [from[0], from[1] + fh * 0.2], b = [tx - dir * bw * 0.1, ty + bh * 0.1];
      later(20, () => sfx('saw', 1.3, 0.2));
      return fxFly(a, b, { html: FIRE_RING, cls: 'fxr-svg fxv1-ring fxv1-ring-fly', ms: 360, spin: dir * 900, scale: [0.6, 1.2 * s],
        trail: 'fxr-trail-fire', trailEvery: 26, easing: 'cubic-bezier(.3,0,.8,.8)' });
    },
    // The ring explodes: sparks spiral out, flames flare and a hot shock rolls out
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit, [bw, bh] = sizeOf(ctx.to, 200, 46);
      fxAnimate(fxSpawn(tx, ty, { cls: 'fxr-svg fxv1-ring', html: FIRE_RING, ms: 420, size: [100, 100] }), [
        { transform: 'scale(1) rotate(0deg)', opacity: 1 }, { transform: `scale(${2.4 * Math.min(1.4, p)}) rotate(120deg)`, opacity: 0 }], 400, 'ease-out');
      core(tx, ty, 120 * Math.min(1.4, p), 'fire', 420);
      spiral(tx, ty, { n: crit ? 16 : 12, r: 150 * Math.min(1.5, p), ms: 720, turns: 0.7 });
      flames(tx, ty + bh * 0.45, { n: 5, w: bw * 0.9, h: 60, ms: 700 });
      for (let i = 0; i < 2; i++) later(i * 90, () => fxRing(tx, ty, { color: i ? '#ff3d00' : '#fff3a0', size: (170 + i * 110) * p, width: 9 - i * 3, ms: 520 }));
      smoke(tx, ty - bh * 0.2, 3, { size: 54, rise: 50 });
      jolt(ctx.to, [{ transform: 'none' }, { transform: 'rotate(-6deg) scale(1.06)', offset: 0.25 }, { transform: 'rotate(4deg)', offset: 0.55 }, { transform: 'none' }], 420);
      stamp(ctx, crit ? 'INFERNO WHEEL!!' : 'FLAME WHEEL!', { kind: 'fire', size: crit ? 40 : Math.min(42, 28 + 8 * p), rotate: -5, ms: 950, star: '#ff8a1f' });
      fxTint(VIG.fire, { ms: 500, opacity: 0.45 });
      fxShake(ctx.panel, Math.min(24, 12 * p), 460);
      haptic(crit ? 100 : 70);
    },
  };

  // ================= Tail Regrow (regen): the old tail drops off and a new glowing one sprouts =================
  CARD_FX['tail-regrow'] = {
    // The dull old tail drops off the card, then a fresh glowing tail sprouts in its place
    land(ctx) {
      remember(ctx);
      const [x, y] = cardXY(ctx), [cw, ch] = cardSize(ctx), L = cw * 1.1, a = [x - L * 0.5, y + ch * 0.12];
      frame(ctx.win, '#b6ff8a', 950);
      const old = fxSpawn(a[0], a[1], { cls: 'fxr-svg fxv1-tail', html: TAIL_OLD, ms: 640, size: [L, L * 0.3], style: { transformOrigin: '0 50%' } });
      if (old) old.animate([
        { transform: 'translate(0, -50%) rotate(-6deg)', opacity: 1 },
        { transform: 'translate(0, -50%) rotate(4deg)', opacity: 1, offset: 0.25 },
        { transform: 'translate(10px, -50%) rotate(18deg)', opacity: 1, offset: 0.45 },
        { transform: 'translate(24px, 90%) rotate(60deg)', opacity: 0 },
      ], { duration: 620, easing: 'ease-in', fill: 'forwards' });
      later(270, () => { fxPop(x + L * 0.1, y + ch * 0.2, 'PLOP!', { cls: 'fxv1-word', size: 16, ms: 520, rise: 10, rotate: 10 }); sfx('hop', 1.2, 0.25); });
      later(360, () => {
        const nu = fxSpawn(a[0], a[1], { cls: 'fxr-svg fxv1-tail fxv1-tail-new', html: TAIL_NEW, ms: 700, size: [L, L * 0.3], style: { transformOrigin: '0 50%' } });
        if (nu) nu.animate([
          { transform: 'translate(0, -50%) rotate(-10deg) scaleX(0)', opacity: 1 },
          { transform: 'translate(0, -50%) rotate(-10deg) scaleX(1.05)', opacity: 1, offset: 0.45 },
          { transform: 'translate(0, -50%) rotate(-10deg) scaleX(1)', opacity: 1, offset: 0.75 },
          { transform: 'translate(0, -50%) rotate(-10deg) scaleX(1)', opacity: 0 },
        ], { duration: 680, easing: 'ease-out', fill: 'forwards' });
        later(260, () => { if (nu) glint(nu); fxParticles(x, y, { count: 10, html: '✦', colors: ['#fff', '#b6ff8a', '#ffe066'], size: [4, 8], spread: L * 0.6, ms: 600, spin: 90 }); });
        sfx('heal', 1.4, 0.25);
      });
      firePlate(ctx, '♻️ TAIL REGROW', '#b6ff8a');
    },
    // Regen: the kit's warm heal, regrowth sparkles, and three pulses beat through the salamander's box (one per turn)
    gimmick(ctx) {
      fire.heal(ctx, { word: 'REGROW ×3' });
      const [x, y] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46);
      [0, 1, 2].forEach(i => later(300 + i * 220, () => {
        fxRing(x, y, { color: i === 1 ? '#ffe066' : '#b6ff8a', size: w * 0.9 + i * 30, width: 5, ms: 420 });
        jolt(ctx.from, [{ transform: 'none' }, { transform: 'scale(1.06)', offset: 0.35 }, { transform: 'none' }], 240);
        show(x + (i - 1) * 30, y - h * 0.5 - 14, '<b class="fxv1-pulse">✚</b>', { font: 18, ms: 520, from: 0.3, to: 1.2, rise: 6 });
        fxParticles(x, y, { count: 6, html: '✦', colors: ['#fff', '#b6ff8a', '#ffe066'], size: [4, 7], spread: w * 0.45, ms: 520, spin: 90 });
      }));
    },
  };

  // ================= Basilisk Gaze (x4, stun): a petrifying serpent stare turns the victim to stone =================
  CARD_FX['basilisk-gaze'] = {
    // A giant slit-pupil serpent eye opens on the card and glares
    land(ctx) {
      remember(ctx);
      const [x, y] = cardXY(ctx), [cw] = cardSize(ctx), W = cw * 1.3;
      dim(VIG.ash, 0.7, 1000);
      frame(ctx.win, '#ffcf3a', 950);
      const eye = fxSpawn(x, y, { cls: 'fxr-svg fxv1-eye', html: EYE, ms: 1000, size: [W, W * 0.58] });
      fxAnimate(eye, [
        { transform: 'scale(1, 0.02)', opacity: 0 },
        { transform: 'scale(1, 0.06)', opacity: 1, offset: 0.12 },
        { transform: 'scale(1.06, 1.1)', opacity: 1, offset: 0.34 },
        { transform: 'scale(1, 1)', opacity: 1, offset: 0.46 },
        { transform: 'scale(1.04, 1.04)', opacity: 1, offset: 0.8 },
        { transform: 'scale(1, 0.05)', opacity: 0 },
      ], 980, 'ease-out');
      later(420, () => {
        fxRing(x, y, { color: '#ffcf3a', size: W * 1.4, width: 5, ms: 460 });
        glint(eye);
        faceJiggle(ctx, [0, -1, 1, -1, 0].map(v => ({ transform: `translateX(${v * 2}px)` })), 300);
        sfx('stun', 0.5, 0.35);
      });
      firePlate(ctx, '🧿 BASILISK GAZE', '#ffcf3a');
    },
    // Two serpent eyes open over the basilisk and fire twin petrifying beams
    windup(ctx) {
      const from = src(ctx), [tx, ty] = at(ctx), [fw, fh] = sizeOf(ctx.from, 200, 46), s = ctx.crit ? 1.2 : 1;
      const eyes = [-1, 1].map(sd => [from[0] + sd * Math.min(26, fw * 0.18), from[1] - fh * 0.1]);
      dim(VIG.ash, ctx.crit ? 0.8 : 0.6, 440);
      eyes.forEach(([ex, ey]) => fxAnimate(fxSpawn(ex, ey, { cls: 'fxr-svg fxv1-eye', html: EYE, ms: 440, size: [46, 27] }), [
        { transform: 'scale(1, 0.05)', opacity: 0 }, { transform: 'scale(1.2, 1.2)', opacity: 1, offset: 0.35 },
        { transform: 'scale(1, 1)', opacity: 1, offset: 0.8 }, { transform: 'scale(1, 0.05)', opacity: 0 }], 420, 'ease-out'));
      charge(from[0], from[1] - fh * 0.1, { colors: ['#ffcf3a', '#fff', '#b0a090'], n: 10, r: 80, ms: 180 });
      later(170, () => {
        eyes.forEach(([ex, ey], i) => fxBeam([ex, ey], [tx + (i ? 8 : -8), ty], { cls: 'fxv1-gaze', ms: 360, width: 10 * s }));
        sfx('stun', 0.8, 0.3);
      });
      return wait(380);
    },
    // Stone cracks spread over the victim and grit flies
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit, [bw, bh] = sizeOf(ctx.to, 200, 46);
      const coat = fxSpawn(tx, ty, { cls: 'fxv1-stonecoat', ms: 620, size: [bw + 16, bh + 16] });
      fxAnimate(coat, [{ transform: 'scale(1.1)', opacity: 0 }, { transform: 'scale(1)', opacity: 0.9, offset: 0.25 }, { transform: 'scale(1)', opacity: 0.7, offset: 0.7 }, { transform: 'scale(1.02)', opacity: 0 }], 600, 'ease-out');
      [[0, 0, 1], [-0.3, 0.1, 0.7], [0.32, -0.1, 0.65]].forEach(([ox, oy, k], i) => later(i * 90, () => crackBurst(tx + ox * bw, ty + oy * bh, 110 * Math.min(1.3, p) * k, 'stone', fxRand(0, 60), 800)));
      core(tx, ty, 110 * p, 'ash', 360);
      rocks(tx, ty, { count: 10, spread: 130 * p, size: [6, 12] });
      dust(tx, ty + bh * 0.4, { count: 8, spread: bw * 0.6, cone: 180 });
      fxRing(tx, ty, { color: '#ffcf3a', size: 160 * p, width: 6 });
      jolt(ctx.to, [{ transform: 'none' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(-3px)' }, { transform: 'none' }], 380);
      stamp(ctx, crit ? 'ROCK SOLID!!' : 'STONE COLD!', { kind: 'stone', size: crit ? 42 : Math.min(40, 26 + 8 * p), rotate: -5, ms: 860, star: crit ? '#b0a090' : null });
      fxShake(ctx.panel, Math.min(18, 8 * p), 340);
    },
    // Stun: the victim's HP box turns to grey stone, cracks, then crumbles
    gimmick(ctx) {
      const [x, y] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46);
      stoneBlock(ctx.to, { ms: 1150 });
      later(40, () => show(x, y - h * 0.5 - 26, EYE, { cls: 'fxv1-eye', size: [56, 33], ms: 800, from: 0.3, to: 1, rise: 6 }));
      fxRing(x, y, { color: '#b0a090', size: 180, width: 6, ms: 460 });
      const [sx, sy] = stampPoint(ctx);
      later(80, () => slam(sx, sy, 'PETRIFIED!', { kind: 'stone', size: 32, rotate: -5, ms: 950, star: '#b0a090' }));
      fxTint(VIG.ash, { ms: 700, opacity: 0.55 });
      haptic(40);
    },
  };

  // ================= Magma Geyser (x6, cleave, SUPER MOVE): the ground erupts in a geyser of lava =================
  CARD_FX['magma-geyser'] = {
    // A bubbling lava pool opens on the card and spurts
    land(ctx) {
      remember(ctx);
      const [x, y] = cardXY(ctx), [cw, ch] = cardSize(ctx), py = y + ch * 0.22;
      fxTint(VIG.fire, { ms: 900, opacity: 0.55 });
      frame(ctx.win, '#ff3d00', 950);
      groundGlow(x, py, cw * 1.1, cw * 0.38, 'fxv1-pool', 1000);
      bubbles(x, py, cw * 0.8, 5, 500);
      later(440, () => {
        lavaJet(x, py, ch * 0.8, { ms: 480, width: 22 });
        fxShake(ctx.panel, 7, 260);
        sfx('heavy_slam', 1.3, 0.3);
      });
      [0, 200].forEach(t => later(t, () => fxShake(ctx.panel, 3, 160))); // rumble
      firePlate(ctx, '⛲ MAGMA GEYSER', '#ff3d00');
    },
    // Cleave (before the hit): the kit's lava crack melts any shields, a spurt of lava bursting up through them
    gimmick(ctx) {
      fire.smash(ctx, { word: 'MELTED!' });
      const [tx, ty] = at(ctx), [, h] = sizeOf(ctx.to, 200, 46);
      if (ctx.blocked) later(200, () => lavaJet(tx, ty + h * 0.5, 120, { ms: 420, width: 22 }));
    },
    // The ground under the victim glows red-hot, cracks and bubbles
    windup(ctx) {
      const [tx, ty] = at(ctx), [bw, bh] = sizeOf(ctx.to, 200, 46), base = ty + bh * 0.5 + 6, crit = !!ctx.crit;
      dim(VIG.fire, crit ? 0.8 : 0.6, 440);
      groundGlow(tx, base, bw * 1.5, 56, 'fxv1-hotground', 480);
      later(120, () => flames(tx, base, { n: 4, w: bw * 0.8, h: 34, ms: 360, delay: 40 }));
      crackBurst(tx, base, 120, 'lava', fxRand(0, 60), 460);
      bubbles(tx, base - 2, bw * 0.9, 5, 300);
      later(100, () => smoke(tx, base, 3, { size: 44, spread: bw * 0.7, rise: 40 }));
      [0, 130, 260].forEach((t, i) => later(t, () => { fxShake(ctx.panel, 3 + i * 2, 140); jolt(ctx.to, [{ transform: 'none' }, { transform: `translateY(${-2 - i}px)` }, { transform: 'none' }], 120); }));
      later(40, () => sfx('big_hit', 0.35, 0.4)); // rumble
      return wait(400);
    },
    // GEYSER: a column of lava erupts under the victim, blobs rain down, rocks and smoke everywhere
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit, [bw, bh] = sizeOf(ctx.to, 200, 46), base = ty + bh * 0.5 + 6;
      flash('#ffb300', crit ? 0.6 : 0.4);
      fxTint('#ff3d00', { ms: 500, opacity: crit ? 0.45 : 0.3 });
      lavaJet(tx, base, Math.min(340, 230 * p), { ms: 700, width: 56 * Math.min(1.4, p) });
      later(60, () => lavaJet(tx - bw * 0.25, base, 150 * Math.min(1.4, p), { ms: 520, width: 26 }));
      later(110, () => lavaJet(tx + bw * 0.25, base, 170 * Math.min(1.4, p), { ms: 520, width: 26 }));
      core(tx, ty, 190 * p, 'lava', 460);
      rocks(tx, base, { count: 10, spread: 180 * p, cone: 160 });
      scorch(tx, base, Math.min(260, bw * 1.3), 1000);
      // Molten blobs rain back down over the victim
      for (let i = 0; i < 7; i++) later(260 + i * 55, () => {
        const bx = tx + fxRand(-bw * 0.7, bw * 0.7), by = ty + fxRand(-10, bh * 0.4);
        fxFly([bx + fxRand(-20, 20), ty - 240], [bx, by], { cls: 'fxr-lava fxv1-blob', ms: 320, easing: 'cubic-bezier(.6,0,1,.6)', scale: [0.6, 1.2] })
          .then(() => { fxParticles(bx, by, { count: 4, cls: 'fxr-lava', colors: ['#ff6a00'], size: [3, 6], spread: 30, gravity: 30, ms: 360 }); smoke(bx, by, 1, { size: 26, dark: false, rise: 24 }); });
      });
      for (let i = 0; i < 3; i++) later(i * 90, () => fxRing(tx, ty, { color: ['#fff3a0', '#ff8a1f', '#a01800'][i], size: (180 + i * 110) * p, width: 11 - i * 3, ms: 560 }));
      jolt(ctx.to, [{ transform: 'none' }, { transform: 'translateY(-22px) rotate(-3deg)', offset: 0.25 }, { transform: 'translateY(5px) rotate(1deg)', offset: 0.55 }, { transform: 'none' }], 480);
      stamp(ctx, crit ? 'MEGA GEYSER!!' : 'GEYSER!', { dy: 20, kind: 'lava', size: crit ? 46 : Math.min(52, 32 + 10 * p), rotate: -6, ms: 1000, star: '#ff8a1f' });
      fxShake(ctx.panel, Math.min(30, 17 * p), 580);
      later(260, () => fxShake(ctx.panel, 8, 300)); // aftershock
      fxShake(ctx.to, 14, 420);
      haptic(crit ? 150 : 110);
    },
  };
})();
