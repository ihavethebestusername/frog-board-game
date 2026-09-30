// Card effects: toxic group (see js/card-fx.js)
// Poison Dart, Stun Slime and Leech, plus the poison / stun / leech statuses they cause:
// toxic darts and bubbling green goo, glossy slime globs that jelly-lock the foe, and vampire fangs
// that siphon a stream of blood back to the Leech's owner.
(() => {
  // --- Palettes ---
  const TOX = ['#7cff3a', '#b4ff8a', '#39d353', '#e6ff6a', '#2fae1a'];
  const TOX_PURPLE = ['#7cff3a', '#a259ff', '#b4ff8a', '#d3a6ff', '#39d353'];
  const SLIME = ['#b6ff3a', '#e9ff7a', '#7be300', '#ffffff'];
  const ZAP = ['#fff45c', '#ffffff', '#d7ff3a'];
  const BLOOD = ['#ff1f3d', '#b0001e', '#ff6b7d', '#7a0014'];
  const FIRE = ['#ffd23f', '#ff8a1f', '#ff3b1f', '#fff1a8'];

  const now = () => performance.now();
  // A delayed step that can never throw into the page (effects are visuals only)
  const later = (ms, fn) => setTimeout(() => { try { fn(); } catch (e) { console.warn('toxic fx failed', e); } }, ms);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  // Screen-edge wash: clear in the middle, coloured at the edges (fxTint takes any CSS background)
  const vignette = c => `radial-gradient(ellipse at center, transparent 30%, ${c} 100%)`;

  // --- Where things are ---
  const toPt = ctx => ctx.toXY || fxPoint(ctx.to);
  const fromPt = ctx => ctx.fromXY || fxPoint(ctx.from);
  // A point on an element measured from the viewer's side. Player 2's screen is upside down, so the top
  // edge they see is the element's bottom on screen; fxPoint mirrors positions, this also mirrors the edge.
  const edge = (el, ox, oy) => (typeof fxFlipped === 'function' && fxFlipped()) ? fxPoint(el, 1 - ox, 1 - oy) : fxPoint(el, ox, oy);
  // Size of an element (the same whichever way up the screen is)
  const sizeOf = (el, fw = 120, fh = 60) => { const r = el?.getBoundingClientRect?.(); return r && r.width ? [r.width, r.height] : [fw, fh]; };
  // How hard a strike should look: follow-up strikes escalate, crits and huge hits go further
  const power = ctx => Math.min(2.6, 1 + (ctx.strike || 0) * 0.3 + (ctx.crit ? 0.6 : 0) + (ctx.big ? 0.4 : 0));
  const isFinisher = ctx => ctx.strikes > 1 && ctx.strike === ctx.strikes - 1;

  // Our card's attack launches from the card itself on the wheel, if it has just landed there
  let landed = null;
  const remember = ctx => { landed = { slug: ctx.card ? fxSlug(ctx.card) : '', slot: ctx.slot, t: now() }; };
  function launchPt(ctx) {
    const ok = landed && ctx.card && landed.slug === fxSlug(ctx.card) && landed.slot?.isConnected && now() - landed.t < 8000;
    return ok ? fxPoint(landed.slot) : fromPt(ctx);
  }
  // Centre of the card that just landed (or its wheel window)
  const landPt = ctx => fxPoint(ctx.slot?.isConnected ? ctx.slot : ctx.win);

  // --- Graphics (inline SVG; flying things are drawn pointing right so they can turn to face their flight) ---
  const DART_SVG = (tip = '#b6ff3a') => '<svg viewBox="0 0 100 32">' +
    '<path d="M2 3 L28 13 L28 19 L2 29 L11 16 Z" fill="#a259ff" stroke="#2a0a4a" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<rect x="25" y="9" width="50" height="14" rx="7" fill="#e9ffe0" stroke="#1d5c0c" stroke-width="2.5"/>' +
    '<rect x="29" y="12.5" width="42" height="7" rx="3.5" fill="#6cff2a"/>' +
    '<circle cx="40" cy="15" r="1.8" fill="#fff"/><circle cx="56" cy="17" r="1.3" fill="#fff"/>' +
    '<path d="M74 11.5 L99 16 L74 20.5 Z" fill="#eef6ff" stroke="#3d5563" stroke-width="1.5" stroke-linejoin="round"/>' +
    `<circle cx="96" cy="16" r="3.2" fill="${tip}"/></svg>`;
  // Upper jaw of vampire fangs (the lower jaw is the same drawing turned upside down)
  const FANGS_SVG = '<svg viewBox="0 0 120 52"><g fill="#fffaf0" stroke="#8a7f70" stroke-width="1.5" stroke-linejoin="round">' +
    '<path d="M24 12 L33 50 L42 14 Z"/><path d="M78 14 L87 50 L96 12 Z"/>' +
    '<path d="M6 8 L12 24 L18 10 Z"/><path d="M102 10 L108 24 L114 8 Z"/>' +
    '<path d="M44 15 L50 31 L56 16 Z"/><path d="M56 16 L60 30 L64 16 Z"/><path d="M64 16 L70 31 L76 15 Z"/></g>' +
    '<path d="M0 0 H120 V13 Q60 27 0 13 Z" fill="#7a0014" stroke="#2a0008" stroke-width="2"/>' +
    '<path d="M30 24 L33 40 M84 24 L87 40" stroke="#fff" stroke-width="1.6" opacity=".85"/></svg>';
  const BOLT_SVG = '<svg viewBox="0 0 24 48"><path d="M15 1 L3 27 H11 L7 47 L22 18 H13 L18 1 Z" fill="#fff45c" ' +
    'stroke="#6a5a00" stroke-width="1.5" stroke-linejoin="round"/></svg>';
  // Blood seal shown when a Leech arms itself: a dashed ring with six little fangs
  const SIGIL_SVG = '<svg viewBox="-50 -50 100 100"><g fill="none" stroke="#ff1f3d" stroke-linecap="round">' +
    '<circle r="44" stroke-width="3" stroke-dasharray="10 7"/><circle r="33" stroke-width="1.5" opacity=".75"/></g><g fill="#ff1f3d">' +
    [0, 60, 120, 180, 240, 300].map(a => `<path d="M-5 -42 L0 -26 L5 -42 Z" transform="rotate(${a})"/>`).join('') +
    '</g><circle r="8" fill="#b0001e" stroke="#ff6b7d" stroke-width="2"/></svg>';
  // A random goo splat: a blobby star with a few flung droplets and a shine
  function splatSvg(fill, stroke) {
    const n = 9 + Math.floor(Math.random() * 4), pts = [], f = v => v.toFixed(1);
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * Math.PI * 2 + fxRand(-0.12, 0.12), r = i % 2 ? fxRand(18, 24) : fxRand(30, 45);
      pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    // Smooth closed curve through the midpoints, with the points as controls (spikes become round lobes)
    const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    let d = 'M' + mid(pts[pts.length - 1], pts[0]).map(f).join(' ');
    pts.forEach((p, i) => { const m = mid(p, pts[(i + 1) % pts.length]); d += `Q${f(p[0])} ${f(p[1])} ${f(m[0])} ${f(m[1])}`; });
    let drops = '';
    for (let i = 0; i < 5; i++) {
      const a = fxRand(0, Math.PI * 2), r = fxRand(46, 57);
      drops += `<circle cx="${f(Math.cos(a) * r)}" cy="${f(Math.sin(a) * r)}" r="${f(fxRand(2.5, 5.5))}"/>`;
    }
    return `<svg viewBox="-60 -60 120 120"><g fill="${fill}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round">` +
      `<path d="${d}Z"/>${drops}</g><ellipse cx="-11" cy="-12" rx="11" ry="6" fill="#ffffff80" transform="rotate(-30 -11 -12)"/></svg>`;
  }

  // --- Building blocks ---
  // Comic stamp text that pops, holds and floats off
  const stamp = (x, y, text, kind, { size = 32, ms = 820, rotate = fxRand(-12, 12), rise = 18 } = {}) =>
    fxPop(x, y, text, { cls: 'fxt-stamp fxt-stamp-' + kind, ms, size, rise, rotate });
  // Glossy bubbles that float up and away
  const BUB = '<i class="fxt-bub"></i>';
  const bubbles = (x, y, n, colors = TOX, { spread = 90, rise = 70, ms = 850, size = [5, 11] } = {}) =>
    fxParticles(x, y, { count: n, colors, html: BUB, spread, gravity: -rise, ms, size, angle: -90, cone: 220, spin: 0 });
  // Blobs of goo flung out that fall under gravity
  const goo = (x, y, n, colors, spread = 110, gravity = 90, ms = 750) =>
    fxParticles(x, y, { count: n, colors, spread, gravity, ms, size: [5, 11] });

  // Splat graphic that slaps on, then sags and slides off
  function splat(x, y, size, fill, stroke, ms = 720) {
    const el = fxSpawn(x, y, { cls: 'fxt-svg fxt-splat', html: splatSvg(fill, stroke), ms: ms + 40, size: [size, size] });
    const r = fxRand(0, 360);
    return fxAnimate(el, [
      { transform: `rotate(${r}deg) scale(0.2)`, opacity: 1 },
      { transform: `rotate(${r}deg) scale(1.15)`, opacity: 1, offset: 0.16 },
      { transform: `rotate(${r}deg) scale(1)`, opacity: 0.95, offset: 0.34 },
      { transform: `translateY(10px) rotate(${r}deg) scale(1.06, 1.12)`, opacity: 0 },
    ], ms, 'ease-out');
  }

  // Motes of colour sucked into a point, plus a ring closing in: the "charging up" before a throw
  function charge([x, y], colors, n, r = 60, ms = 170) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, d = r * fxRand(0.6, 1), c = colors[i % colors.length];
      const el = fxSpawn(x, y, { cls: 'fxt-mote', ms: ms + 40, style: { color: c } });
      fxAnimate(el, [
        { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d}px) scale(1.3)`, opacity: 0 },
        { transform: `translate(${Math.cos(a) * d * 0.5}px, ${Math.sin(a) * d * 0.5}px) scale(1)`, opacity: 1, offset: 0.5 },
        { transform: 'translate(0, 0) scale(0.3)', opacity: 0.3 },
      ], ms, 'ease-in');
    }
    const ring = fxSpawn(x, y, { cls: 'fx-ring', ms: ms + 40, size: [r * 2, r * 2], style: { borderColor: colors[0], borderWidth: '3px' } });
    fxAnimate(ring, [{ transform: 'scale(1)', opacity: 0 }, { transform: 'scale(0.12)', opacity: 1 }], ms, 'ease-in');
  }

  // A teardrop of goo that swells, stretches and falls
  function drip(x, y, color, { fall = 60, ms = 700, size = 10, delay = 0 } = {}) {
    later(delay, () => {
      const el = fxSpawn(x, y, { cls: 'fxt-drip', html: '<i></i>', ms: ms + 40, size: [size, size], style: { color } });
      fxAnimate(el, [
        { transform: 'translateY(0) scale(0.3)', opacity: 0 },
        { transform: 'translateY(2px) scale(1)', opacity: 1, offset: 0.25 },
        { transform: `translateY(${fall * 0.3}px) scale(0.85, 1.3)`, opacity: 1, offset: 0.55 },
        { transform: `translateY(${fall}px) scale(0.7, 1.5)`, opacity: 0 },
      ], ms, 'cubic-bezier(.5,0,.8,.6)');
    });
  }

  // Soft cloud of toxin that swells and drifts up
  function puff(x, y, color, size = 90, ms = 900) {
    const el = fxSpawn(x, y, { cls: 'fxt-cloud', ms: ms + 40, size: [size, size],
      style: { background: `radial-gradient(circle, ${color}aa 0%, ${color}55 38%, transparent 70%)` } });
    const dx = fxRand(-30, 30), dy = fxRand(-34, -10);
    fxAnimate(el, [
      { transform: 'scale(0.3)', opacity: 0 },
      { transform: `translate(${dx * 0.4}px, ${dy * 0.4}px) scale(1)`, opacity: 0.9, offset: 0.3 },
      { transform: `translate(${dx}px, ${dy}px) scale(1.5)`, opacity: 0 },
    ], ms, 'ease-out');
  }

  // Trails: little droplets shed along a flight path that sag and shrink
  const dropTrail = (colors, fall, size) => (x, y) => {
    const s = size * fxRand(0.6, 1.1);
    const el = fxSpawn(x + fxRand(-3, 3), y + fxRand(-3, 3), { cls: 'fxt-trail', ms: 420, size: [s, s], style: { color: pick(colors) } });
    fxAnimate(el, [{ transform: 'scale(1)', opacity: 0.95 }, { transform: `translateY(${fxRand(fall * 0.4, fall)}px) scale(0.2)`, opacity: 0 }], 380, 'ease-in');
  };
  const toxTrail = dropTrail(TOX, 12, 8), slimeTrail = dropTrail(SLIME, 26, 10), bloodTrail = dropTrail(BLOOD, 16, 7);

  // Fly something from one point to another along a bowed path, turned to face where it's heading
  // (squash stretches it along the direction of travel). Positions are pre-eased so it accelerates into
  // the target and the trail stays in step with it. Resolves with the final heading in degrees.
  function flyAim(from, to, { html = '', cls = '', size = null, ms = 280, arc = 0, scale = [1, 1], squash = 0, face = true,
                             trail = null, trailEvery = 30 } = {}) {
    const dx = to[0] - from[0], dy = to[1] - from[1];
    const len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
    const ease = t => t * (0.4 + 0.6 * t);
    const pos = t => { const u = ease(t), bow = Math.sin(Math.PI * u) * arc; return [dx * u + nx * bow, dy * u + ny * bow]; };
    const heading = t => {
      const a = pos(Math.max(0, t - 0.03)), b = pos(Math.min(1, t + 0.03));
      return Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
    };
    const end = heading(1);
    const el = fxSpawn(from[0], from[1], { cls, html, size, ms: ms + 80 });
    if (!el) return Promise.resolve(end);
    const frames = [];
    let prev = null;
    for (let i = 0; i <= 12; i++) {
      const t = i / 12, [x, y] = pos(t);
      let ang = face ? heading(t) : 0;
      if (prev !== null) { while (ang - prev > 180) ang -= 360; while (ang - prev < -180) ang += 360; } // turn the short way
      prev = ang;
      const s = scale[0] + (scale[1] - scale[0]) * t, q = squash * Math.sin(Math.PI * t);
      frames.push({ transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${ang.toFixed(1)}deg) ` +
        `scale(${(s * (1 + q)).toFixed(3)}, ${(s * (1 - q * 0.5)).toFixed(3)})` });
    }
    if (trail) {
      const start = now();
      let last = 0;
      (function tick() {
        const t = (now() - start) / ms;
        if (t >= 1 || !el.isConnected) return;
        if (now() - last >= trailEvery) { last = now(); const [x, y] = pos(t); trail(from[0] + x, from[1] + y); }
        requestAnimationFrame(tick);
      })();
    }
    return fxAnimate(el, frames, ms, 'linear').then(() => { el.remove(); return end; });
  }

  // Things circling over a point in a flat ellipse (dizzy stars), bigger when they swing to the front
  function orbit(x, y, html, n, { rx = 60, ry = 16, ms = 1000, size = 22, cls = '' } = {}) {
    for (let i = 0; i < n; i++) {
      const el = fxSpawn(x, y, { cls: 'fxt-glow-zap ' + cls, html: typeof html === 'function' ? html(i) : html, ms: ms + 40,
        style: { fontSize: size + 'px' } });
      const frames = [];
      for (let s = 0; s <= 12; s++) {
        const a = (i / n + (s / 12) * 1.5) * Math.PI * 2, depth = Math.sin(a); // 1.5 laps
        frames.push({ transform: `translate(${(Math.cos(a) * rx).toFixed(1)}px, ${(depth * ry).toFixed(1)}px) scale(${(0.75 + 0.3 * depth).toFixed(2)})`,
          opacity: s === 0 || s === 12 ? 0 : 1 });
      }
      fxAnimate(el, frames, ms, 'linear');
    }
  }

  // A wobbling block of see-through slime dropped over an element
  function jelly(el, { ms = 1000, pad = 14, delay = 0 } = {}) {
    if (!el) return;
    later(delay, () => {
      const [w, h] = sizeOf(el), [x, y] = fxPoint(el);
      const j = fxSpawn(x, y, { cls: 'fxt-jelly', ms: ms + 40, size: [w + pad, h + pad] });
      fxAnimate(j, [
        { transform: 'translateY(-36px) scale(1.15, 0.5)', opacity: 0 },
        { transform: 'translateY(0) scale(1.12, 0.84)', opacity: 0.95, offset: 0.16 },
        { transform: 'scale(0.93, 1.08)', opacity: 0.95, offset: 0.3 },
        { transform: 'scale(1.04, 0.97)', opacity: 0.9, offset: 0.45 },
        { transform: 'scale(1)', opacity: 0.85, offset: 0.75 },
        { transform: 'translateY(10px) scale(1.06, 0.9)', opacity: 0 },
      ], ms, 'ease-out');
    });
  }

  // Lightning bolts flickering around a point, each pointing outwards
  function bolts(x, y, n, r = 60, size = 24) {
    for (let i = 0; i < n; i++) later(i * 55, () => {
      const a = (i / n) * Math.PI * 2 + fxRand(-0.4, 0.4), d = r * fxRand(0.75, 1.1);
      const el = fxSpawn(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.6, { cls: 'fxt-svg fxt-bolt', html: BOLT_SVG, ms: 420, size: [size, size * 2] });
      const rot = a * 180 / Math.PI - 90 + fxRand(-20, 20); // the drawing points down; turn it to point out
      fxAnimate(el, [
        { transform: `rotate(${rot}deg) scale(0.4)`, opacity: 0 },
        { transform: `rotate(${rot}deg) scale(1.15)`, opacity: 1, offset: 0.15 },
        { transform: `rotate(${rot}deg) scale(1)`, opacity: 0.25, offset: 0.35 },
        { transform: `rotate(${rot}deg) scale(1.05)`, opacity: 1, offset: 0.55 },
        { transform: `rotate(${rot}deg) scale(0.8)`, opacity: 0 },
      ], 380, 'linear');
    });
  }

  // Vampire fangs that slam shut on a point (they bite at ~40% of `ms`).
  // bite = false: they clang to a stop wide open (off a shield) and spring back
  function chomp([x, y], { w = 110, ms = 600, bite = true } = {}) {
    const h = w * 52 / 120, gap = bite ? h * 0.47 : h * 0.85; // where each jaw's centre stops
    [-1, 1].forEach(s => {
      const el = fxSpawn(x, y, { cls: 'fxt-svg fxt-fang', html: FANGS_SVG, ms: ms + 40, size: [w, h] });
      const flip = s > 0 ? ' rotate(180deg)' : ''; // lower jaw
      fxAnimate(el, [
        { transform: `translateY(${s * h * 1.7}px)${flip} scale(0.8)`, opacity: 0 },
        { transform: `translateY(${s * h * 1.15}px)${flip} scale(1.05)`, opacity: 1, offset: 0.28 },
        { transform: `translateY(${s * gap}px)${flip} scale(1.12)`, opacity: 1, offset: 0.4 },
        { transform: `translateY(${s * gap * (bite ? 1.04 : 1.25)}px)${flip} scale(1)`, opacity: 1, offset: 0.7 },
        { transform: `translateY(${s * h * 1.3}px)${flip} scale(0.9)`, opacity: 0 },
      ], ms, 'ease-in-out');
    });
  }

  // The biohazard sign spinning up and out
  function hazardSpin(x, y, size = 130, ms = 820, opacity = 0.7) {
    const el = fxSpawn(x, y, { cls: 'fxt-hazard', html: '☣︎', ms: ms + 40, style: { fontSize: size + 'px' } });
    return fxAnimate(el, [
      { transform: 'rotate(-120deg) scale(0.2)', opacity: 0 },
      { transform: 'rotate(0deg) scale(1)', opacity, offset: 0.35 },
      { transform: 'rotate(100deg) scale(1.7)', opacity: 0 },
    ], ms, 'cubic-bezier(.2,.8,.3,1)');
  }

  // Squash-and-stretch a battle element like jelly (WAAPI, no fill: it springs back to normal on its own)
  const wobble = (el, k = 1, ms = 560) => el?.animate?.([
    { transform: 'scale(1)' }, { transform: `scale(${1 + 0.14 * k}, ${1 - 0.14 * k})` }, { transform: `scale(${1 - 0.08 * k}, ${1 + 0.1 * k})` },
    { transform: `scale(${1 + 0.04 * k}, ${1 - 0.04 * k})` }, { transform: 'scale(1)' },
  ], { duration: ms, easing: 'ease-out' });

  // ================= Poison Dart: a toxic dart volley and a bubbling green splat =================
  let lastDart = null; // heading of the dart that just flew, so the one that sticks in points the same way
  CARD_FX['poison-dart'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landPt(ctx), top = ctx.win ? edge(ctx.win, 0.5, 0.2) : [x, y - 50];
      // The biohazard sign spins up over the card while the vial bubbles over
      hazardSpin(x, y, 110, 900, 0.6);
      fxPop(x, y - 6, '🧪', { cls: 'fxt-glow-tox', size: 58, ms: 780, rise: 46, rotate: fxRand(-18, 18) });
      bubbles(x, y, 16, TOX_PURPLE, { spread: 110, rise: 90 });
      fxRing(x, y, { color: '#7cff3a', size: 150, ms: 520, width: 7 });
      later(110, () => fxRing(x, y, { color: '#a259ff', size: 220, ms: 620, width: 4 }));
      for (let i = 0; i < 4; i++) drip(x + fxRand(-24, 24), y + 26, pick(TOX), { delay: 80 + i * 70, fall: fxRand(40, 70) });
      stamp(top[0], top[1], 'TOXIC!', 'toxic', { size: 30, ms: 880 });
      fxTint(vignette('#39ff14'), { ms: 480, opacity: 0.55 });
    },
    windup(ctx) {
      const from = launchPt(ctx), to = toPt(ctx), k = ctx.strike || 0, pw = power(ctx);
      charge(from, ctx.crit ? ['#ffd23f', '#fff', '#7cff3a'] : TOX, 7 + Math.min(6, k * 2));
      sfx('card_pick', 1.8 + k * 0.12, 0.45); // the throw: a quick "fwip"
      // Follow-up strikes throw a growing volley (1, 2, 3, 4 darts), each volley a little faster
      const darts = Math.min(4, 1 + k), ms = Math.max(210, 280 - k * 22);
      const tip = ctx.crit ? '#ffd23f' : '#b6ff3a', w = 58 * Math.min(1.6, pw);
      let main = null;
      for (let i = 0; i < darts; i++) {
        const off = i - (darts - 1) / 2;
        const aim = i === 0 ? to : [to[0] + off * 22 + fxRand(-8, 8), to[1] + fxRand(-14, 14)];
        const go = sleep(110 + i * 30).then(() => flyAim(from, aim, {
          html: DART_SVG(tip), cls: 'fxt-svg fxt-dart' + (ctx.crit ? ' fxt-dart-crit' : ''), size: [w, w * 0.32], ms,
          arc: i === 0 ? fxRand(-40, 40) : off * 50 + fxRand(-15, 15), scale: [0.6, 1.1],
          trail: i === 0 ? toxTrail : null, trailEvery: 26 }));
        if (i === 0) main = go.then(ang => { lastDart = { ang, t: now() }; });
      }
      return main;
    },
    impact(ctx) {
      const [x, y] = toPt(ctx), k = ctx.strike || 0, pw = power(ctx), fin = isFinisher(ctx);
      splat(x, y, 90 + 34 * pw, '#6cff2a', '#1d5c0c');
      // The dart sticks in the target and quivers
      const from = fromPt(ctx);
      const ang = lastDart && now() - lastDart.t < 500 ? lastDart.ang : Math.atan2(y - from[1], x - from[0]) * 180 / Math.PI;
      stuckDart(x, y, ang, 58 * Math.min(1.6, pw), ctx.crit ? '#ffd23f' : '#b6ff3a');
      const text = ctx.crit ? 'CRITICAL DOSE!' : ctx.big ? 'LETHAL DOSE!' : k >= 3 ? 'OVERDOSE!!' : k === 2 ? 'TRIPLE DOSE!' :
        k === 1 ? 'DOUBLE DOSE!' : pick(['TOXIC!', 'SPLAT!', 'GLUK!']);
      stamp(x, y + 6, text, 'toxic', { size: 24 + 6 * pw, ms: 820 });
      fxPop(x + fxRand(-26, 26), y - 4, '☠️', { cls: 'fxt-skull', size: 30 + 10 * pw, ms: 950, rise: 60, rotate: fxRand(-15, 15) });
      bubbles(x, y, Math.min(14, 8 + k * 3 + Math.round((ctx.dmg || 0) / 8)), TOX_PURPLE, { spread: 90 + 20 * pw, rise: 80 });
      goo(x, y, Math.min(12, 8 + k * 2), TOX, 100 + 30 * pw);
      fxRing(x, y, { color: '#7cff3a', size: 130 * pw, ms: 480, width: 8 });
      later(70, () => fxRing(x, y, { color: '#a259ff', size: 190 * pw, ms: 560, width: 4 }));
      fxShake(ctx.to, 5 + 3 * pw, 320);
      fxTint(vignette(ctx.crit ? '#d4ff00' : '#39ff14'), { ms: 450, opacity: Math.min(0.8, 0.35 + 0.15 * pw) });
      // Crits, huge hits and the last strike of a volley get the full biohazard blast
      if (ctx.crit || ctx.big || fin) { hazardSpin(x, y, 120 + 30 * pw, 800, 0.75); sfx('poison', 1.25, 0.6); }
    },
  };
  // A dart stuck point-first in the target, quivering about its tip before it fades
  function stuckDart(x, y, ang, w, tip) {
    const rad = ang * Math.PI / 180, tx = x + Math.cos(rad) * w * 0.1, ty = y + Math.sin(rad) * w * 0.1;
    const el = fxSpawn(tx, ty, { cls: 'fxt-svg fxt-dart', html: DART_SVG(tip), ms: 760, size: [w, w * 0.32] });
    if (!el) return;
    // Shift it back half its length so its tip (not its middle) sits on the point, and turn it about that tip
    el.style.transformOrigin = '100% 50%';
    const wob = [0, 10, -8, 5, -3, 1.5, 0];
    fxAnimate(el, wob.map((d, i) => ({ transform: `translate(-50%, 0) rotate(${ang + d}deg)`, opacity: i === wob.length - 1 ? 0 : 1 })), 720, 'ease-out');
  }

  // ================= Stun Slime: a cute slime, a lobbed glob, and a jelly-locked foe =================
  CARD_FX['stun-slime'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landPt(ctx), top = ctx.win ? edge(ctx.win, 0.5, 0.18) : [x, y - 50];
      wobble(ctx.win, 0.9, 620); // the whole wheel window jiggles like jelly
      // A slime pops out of the card, hops, lands with a squish and melts away
      const s = fxSpawn(x, y, { cls: 'fxt-slime', ms: 1020 });
      fxAnimate(s, [
        { transform: 'translateY(30px) scale(0.2)', opacity: 0 },
        { transform: 'translateY(0) scale(1.35, 0.7)', opacity: 1, offset: 0.14 },
        { transform: 'translateY(-34px) scale(0.85, 1.2)', opacity: 1, offset: 0.34 },
        { transform: 'translateY(0) scale(1.25, 0.78)', opacity: 1, offset: 0.52 },
        { transform: 'translateY(-6px) scale(0.96, 1.05)', opacity: 1, offset: 0.66 },
        { transform: 'translateY(16px) scale(1.5, 0.3)', opacity: 0 },
      ], 980, 'ease-in-out');
      // Slime oozes down from the top of the window
      if (ctx.win) for (let i = 0; i < 5; i++) {
        const [dx, dy] = edge(ctx.win, 0.12 + i * 0.19, 0.06);
        drip(dx, dy, pick(SLIME), { delay: i * 60, fall: fxRand(60, 110), size: 11, ms: 800 });
      }
      fxParticles(x, y, { count: 6, html: '⚡', colors: ZAP, spread: 90, size: [9, 14], ms: 600, spin: 60 });
      goo(x, y, 10, SLIME, 100, 70);
      fxRing(x, y, { color: '#b6ff3a', size: 160, ms: 520, width: 8 });
      stamp(top[0], top[1], 'BLORP!', 'slime', { size: 30, ms: 860 });
      fxTint(vignette('#9dff3a'), { ms: 450, opacity: 0.45 });
      sfx('leech', 1.7, 0.35); // a wet little "blorp"
    },
    windup(ctx) {
      const from = launchPt(ctx), to = toPt(ctx), k = ctx.strike || 0, pw = power(ctx);
      charge(from, ctx.crit ? ['#ffd23f', '#fff', '#b6ff3a'] : SLIME, 6 + Math.min(6, k * 2));
      later(100, () => sfx('leech', 2, 0.25));
      // Lobbed globs: each follow-up strike throws one more, and they swing in from alternate sides
      const balls = Math.min(3, 1 + k), ms = Math.max(220, 300 - k * 25), side = k % 2 ? 1 : -1;
      let main = null;
      for (let i = 0; i < balls; i++) {
        const aim = i === 0 ? to : [to[0] + fxRand(-30, 30), to[1] + fxRand(-18, 18)];
        const go = sleep(100 + i * 40).then(() => flyAim(from, aim, {
          cls: 'fxt-glob' + (ctx.crit ? ' fxt-crit' : ''), ms, arc: side * (70 + i * 25), scale: [0.5, 0.9 + 0.25 * pw],
          squash: 0.45, trail: i === 0 ? slimeTrail : null, trailEvery: 30 }));
        if (i === 0) main = go;
      }
      return main;
    },
    impact(ctx) {
      const [x, y] = toPt(ctx), k = ctx.strike || 0, pw = power(ctx), fin = isFinisher(ctx);
      splat(x, y, 100 + 36 * pw, '#b6ff3a', '#2f7a00', 760);
      wobble(ctx.to, Math.min(1.6, 0.9 + 0.2 * pw), 520); // the target gets squished
      const text = ctx.crit ? 'MEGA SLIME!' : ctx.big ? 'SLIMED!!' : k >= 3 ? 'SLIME TIME!!' : k ? `GLOOP x${k + 1}!` :
        pick(['SPLORCH!', 'GLOOP!', 'SPLAT!']);
      stamp(x, y + 6, text, 'slime', { size: 24 + 6 * pw, ms: 820 });
      // Goo drips off the bottom of the target
      if (ctx.to) {
        const n = 5 + Math.min(3, k);
        for (let i = 0; i < n; i++) {
          const [dx, dy] = edge(ctx.to, fxRand(0.1, 0.9), 0.95);
          drip(dx, dy, pick(SLIME), { delay: 60 + i * 50, fall: fxRand(60, 110), size: 12, ms: 800 });
        }
      }
      fxParticles(x, y, { count: Math.min(10, 5 + k * 2), html: '⚡', colors: ZAP, spread: 110 * pw, size: [9, 15], ms: 650, spin: 90 });
      goo(x, y, 10, SLIME, 120 * pw, 110);
      fxRing(x, y, { color: '#b6ff3a', size: 140 * pw, ms: 480, width: 8 });
      later(70, () => fxRing(x, y, { color: '#fff45c', size: 200 * pw, ms: 560, width: 4 }));
      fxTint(vignette('#b6ff3a'), { ms: 450, opacity: Math.min(0.8, 0.35 + 0.15 * pw) });
      sfx('leech', 1.35, 0.5); // wet splat
      if (ctx.crit || ctx.big || fin) bolts(x, y, 4, 70, 26);
    },
  };

  // ================= Leech: a blood-red epic pull (it never attacks by itself) =================
  CARD_FX.leech = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landPt(ctx), top = ctx.win ? edge(ctx.win, 0.5, 0.18) : [x, y - 50];
      // Crimson rays wheel out behind the card, like an epic gacha pull
      const rays = fxSpawn(x, y, { cls: 'fxt-rays', ms: 1050, size: [240, 240] });
      fxAnimate(rays, [
        { transform: 'rotate(0deg) scale(0.3)', opacity: 0 },
        { transform: 'rotate(40deg) scale(1)', opacity: 0.9, offset: 0.3 },
        { transform: 'rotate(110deg) scale(1.25)', opacity: 0 },
      ], 1000, 'ease-out');
      // A blood drop beats like a heart: ba-dum
      const drop = fxSpawn(x, y, { cls: 'fx-pop fxt-glow-blood', html: '🩸', ms: 1000, style: { fontSize: '54px' } });
      fxAnimate(drop, [
        { transform: 'scale(0.2)', opacity: 0 },
        { transform: 'scale(1.3)', opacity: 1, offset: 0.1 },
        { transform: 'scale(1)', opacity: 1, offset: 0.2 },
        { transform: 'scale(1.25)', opacity: 1, offset: 0.3 },
        { transform: 'scale(1)', opacity: 1, offset: 0.42 },
        { transform: 'translateY(-40px) scale(0.9)', opacity: 0 },
      ], 1000, 'ease-out');
      [100, 300].forEach((d, i) => later(d, () => {
        fxRing(x, y, { color: i ? '#ff6b7d' : '#ff1f3d', size: 140 + i * 50, ms: 480, width: 7 - i * 2 });
        sfx('big_hit', 0.42 + i * 0.05, 0.3);
      }));
      stamp(top[0], top[1], 'THIRSTY...', 'blood', { size: 24, ms: 950, rotate: fxRand(-6, 6) });
      // Then the fangs bite down on the card and blood sprays
      later(380, () => chomp([x, y], { w: 88, ms: 560 }));
      later(610, () => {
        goo(x, y, 14, BLOOD, 100, 110);
        splat(x, y, 80, '#d0102a', '#4a0010', 520);
        fxTint(vignette('#b0001e'), { ms: 500, opacity: 0.6 });
      });
    },
    // Fallbacks in case a Leech ever deals damage itself: a blood orb and a bite
    windup(ctx) {
      return flyAim(launchPt(ctx), toPt(ctx), { cls: 'fxt-orb fxt-big', ms: 260, arc: fxRand(-40, 40), squash: 0.5, trail: bloodTrail });
    },
    impact(ctx) {
      const p = toPt(ctx);
      chomp(p, { w: 100, ms: 500 });
      later(200, () => { goo(p[0], p[1], 12, BLOOD, 110, 100); splat(p[0], p[1], 100, '#d0102a', '#4a0010'); });
    },
  };

  // ================= Statuses =================
  // Bacon Sizzle's burn: a quick fiery flare instead of green toxin (the boss group owns Bacon's main look)
  function baconBurn(ctx) {
    const [x, y] = toPt(ctx);
    fxParticles(x, y, { count: 8, html: '🔥', colors: FIRE, spread: 70, size: [9, 15], gravity: -60, angle: -90, cone: 120, ms: 700, spin: 0 });
    fxParticles(x, y, { count: 12, colors: FIRE, spread: 90, size: [3, 7], gravity: -80, ms: 650 }); // embers
    fxRing(x, y, { color: '#ff8a1f', size: 150, ms: 450, width: 6 });
    stamp(x, y, 'SIZZLE!', 'fire', { size: 28, ms: 700 });
    fxTint(vignette('#ff5a1f'), { ms: 400, opacity: 0.4 });
  }

  // A syringe stabs in from the upper right, plunges, and pulls back out
  function inject([x, y]) {
    const el = fxSpawn(x, y, { cls: 'fxt-syringe', html: '💉', ms: 660, style: { fontSize: '46px' } });
    fxAnimate(el, [
      { transform: 'translate(70px, -70px) scale(0.6)', opacity: 0 },
      { transform: 'translate(34px, -34px) scale(1.1)', opacity: 1, offset: 0.25 },
      { transform: 'translate(16px, -16px) scale(1)', opacity: 1, offset: 0.38 },
      { transform: 'translate(14px, -14px) scale(1, 0.9)', opacity: 1, offset: 0.6 },
      { transform: 'translate(50px, -50px) scale(0.8)', opacity: 0 },
    ], 620, 'ease-in-out');
  }

  // Poison applied: injected, a toxic cloud wraps the foe, and three skulls tick in (one per poisoned turn)
  GIMMICK_FX.poison = ctx => {
    if (ctx.card && fxSlug(ctx.card) === 'bacon-sizzle') { baconBurn(ctx); return; }
    const p = toPt(ctx), [x, y] = p;
    inject(p);
    later(220, () => {
      fxRing(x, y, { color: '#7cff3a', size: 170, ms: 520, width: 7 });
      later(90, () => fxRing(x, y, { color: '#a259ff', size: 240, ms: 600, width: 4 }));
      bubbles(x, y, 12, TOX_PURPLE, { spread: 100, rise: 90 });
      for (let i = 0; i < 4; i++) later(i * 60, () => puff(x + fxRand(-55, 55), y + fxRand(-18, 18), i % 2 ? '#a259ff' : '#5fd13a'));
      fxTint(vignette('#6cff2a'), { ms: 550, opacity: 0.45 });
    });
    const base = ctx.to ? edge(ctx.to, 0.5, 1) : [x, y + 36];
    [-1, 0, 1].forEach((o, i) => later(260 + i * 90, () => {
      const el = fxSpawn(base[0] + o * 30, base[1] + 14, { cls: 'fx-pop fxt-skull', html: '☠️', ms: 740, style: { fontSize: '24px' } });
      fxAnimate(el, [
        { transform: 'scale(0.2) rotate(-30deg)', opacity: 0 },
        { transform: 'scale(1.35) rotate(8deg)', opacity: 1, offset: 0.2 },
        { transform: 'scale(1) rotate(0deg)', opacity: 1, offset: 0.4 },
        { transform: 'scale(1)', opacity: 1, offset: 0.8 },
        { transform: 'translateY(8px) scale(0.6)', opacity: 0 },
      ], 700, 'ease-out');
    }));
  };

  // Stunned: encased in jelly, lightning crackles, and dizzy stars circle overhead
  GIMMICK_FX.stun = ctx => {
    const [x, y] = toPt(ctx), top = ctx.to ? edge(ctx.to, 0.5, 0) : [x, y - 36];
    jelly(ctx.to, { ms: 1050 });
    later(80, () => bolts(x, y, 4, 75, 24));
    later(150, () => orbit(top[0], top[1] - 6, i => i % 2 ? '💫' : '⭐', 4, { rx: 58, ry: 14, ms: 950, size: 20 }));
    stamp(x, y + 4, 'STUNNED!', 'zap', { size: 30, ms: 900 });
    fxRing(x, y, { color: '#fff45c', size: 170, ms: 480, width: 6 });
    later(90, () => fxRing(x, y, { color: '#b6ff3a', size: 230, ms: 560, width: 4 }));
    fxParticles(x, y, { count: 8, html: '✦', colors: ZAP, spread: 110, size: [7, 12], ms: 650 });
    fxTint(vignette('#fff45c'), { ms: 350, opacity: 0.35 });
  };

  // Leech armed on its wheel: a blood seal spins in and blood is drawn into it, heartbeat pulsing
  GIMMICK_FX.leech = ctx => {
    const el = ctx.win || ctx.from, [x, y] = fxPoint(el);
    const sg = fxSpawn(x, y, { cls: 'fxt-svg fxt-sigil', html: SIGIL_SVG, ms: 1000, size: [130, 130] });
    fxAnimate(sg, [
      { transform: 'rotate(-60deg) scale(1.6)', opacity: 0 },
      { transform: 'rotate(0deg) scale(1)', opacity: 1, offset: 0.3 },
      { transform: 'rotate(50deg) scale(0.95)', opacity: 0.9, offset: 0.7 },
      { transform: 'rotate(90deg) scale(0.4)', opacity: 0 },
    ], 980, 'ease-in-out');
    later(120, () => charge([x, y], BLOOD, 10, 90, 320));
    [250, 430].forEach((d, i) => later(d, () => fxRing(x, y, { color: i ? '#ff6b7d' : '#ff1f3d', size: 120 + i * 40, ms: 460, width: 6 - i * 2 })));
    if (el) for (let i = 0; i < 4; i++) {
      const [dx, dy] = edge(el, 0.2 + i * 0.2, 0.92);
      drip(dx, dy, pick(BLOOD), { delay: 200 + i * 70, fall: fxRand(35, 60), size: 9 });
    }
    later(460, () => fxPop(x, y, '🩸', { cls: 'fxt-glow-blood', size: 40, ms: 560, rise: 24 }));
  };

  // ================= Battle moments =================
  // Poison ticks at the start of a turn: the poisoned fighter bubbles, turns queasy and a skull flares up
  BATTLE_FX.poisonTick = ctx => {
    const [x, y] = toPt(ctx), dmg = ctx.dmg || 0;
    sfx('poison', 0.85, 0.8);
    ctx.to?.animate?.([
      { transform: 'none' }, { transform: 'skewX(-6deg) scale(1.04, 0.96)' }, { transform: 'skewX(5deg) scale(0.97, 1.03)' },
      { transform: 'skewX(-3deg)' }, { transform: 'none' },
    ], { duration: 700, easing: 'ease-in-out' });
    bubbles(x, y, Math.min(18, 8 + Math.round(dmg / 2)), TOX_PURPLE, { spread: 100, rise: 100, ms: 950 });
    for (let i = 0; i < 4; i++) later(i * 70, () => puff(x + fxRand(-60, 60), y + fxRand(-15, 15), i % 2 ? '#a259ff' : '#5fd13a', 100));
    // The skull shudders before it drifts away
    const sk = fxSpawn(x, y, { cls: 'fx-pop fxt-skull', html: '☠️', ms: 950, style: { fontSize: 44 + Math.min(30, dmg) + 'px' } });
    fxAnimate(sk, [
      { transform: 'scale(0.2)', opacity: 0 },
      { transform: 'scale(1.3)', opacity: 1, offset: 0.15 },
      { transform: 'translate(-4px, 0) rotate(-9deg) scale(1)', opacity: 1, offset: 0.25 },
      { transform: 'translate(4px, 0) rotate(9deg)', opacity: 1, offset: 0.35 },
      { transform: 'translate(-3px, 0) rotate(-6deg)', opacity: 1, offset: 0.45 },
      { transform: 'translate(0, 0) rotate(0deg)', opacity: 1, offset: 0.6 },
      { transform: 'translate(0, -50px) scale(0.9)', opacity: 0 },
    ], 920, 'ease-out');
    fxRing(x, y, { color: '#7cff3a', size: 150, ms: 520, width: 6 });
    goo(x, y, 6, TOX, 80, 70);
    fxTint(vignette('#39ff14'), { ms: 650, opacity: 0.6 });
  };

  // A stunned fighter skips their turn: their wheels get gummed up with slime and they sit there dizzy
  BATTLE_FX.stunSkip = ctx => {
    const wins = [...(ctx.panel?.querySelectorAll('.wheel-window') || [])].slice(0, 4);
    const [x, y] = toPt(ctx), top = ctx.to ? edge(ctx.to, 0.5, 0) : [x, y - 36];
    sfx('stun', 0.8, 0.9);
    later(160, () => sfx('leech', 1.5, 0.4));
    wins.forEach((w, i) => {
      jelly(w, { delay: i * 90, ms: 1100, pad: 6 });
      later(i * 90 + 150, () => { const [wx, wy] = fxPoint(w); goo(wx, wy, 4, SLIME, 70, 60); });
    });
    // Dizzy sway, stars circling, and a few sleepy Zs
    ctx.to?.animate?.([
      { transform: 'rotate(0)' }, { transform: 'rotate(-5deg)' }, { transform: 'rotate(4deg)' },
      { transform: 'rotate(-3deg)' }, { transform: 'rotate(2deg)' }, { transform: 'rotate(0)' },
    ], { duration: 900, easing: 'ease-in-out' });
    orbit(top[0], top[1] - 4, i => i % 2 ? '💫' : '⭐', 5, { rx: 62, ry: 14, ms: 1100, size: 20 });
    for (let i = 0; i < 3; i++) later(i * 200, () => fxPop(x + 36 + i * 10, y - 8 - i * 12, 'z', { cls: 'fxt-zz', size: 16 + i * 6, rise: 30, ms: 700 }));
    const mid = wins.length ? fxPoint(wins[Math.floor(wins.length / 2)]) : [x, y + 80];
    later(140, () => stamp(mid[0], mid[1], 'SKIPPED!', 'slime', { size: 42, ms: 1000 }));
    fxTint(vignette('#b6ff3a'), { ms: 600, opacity: 0.5 });
  };

  // The Leech feeds: fangs bite the foe and a stream of blood orbs flies back to heal its owner
  function gulp(el, [x, y]) {
    fxRing(x, y, { color: '#ff1f3d', size: 150, ms: 480, width: 7 });
    fxPop(x, y, '❤️', { cls: 'fxt-glow-blood', size: 44, ms: 700, rise: 34 });
    fxParticles(x, y, { count: 6, html: '❤', colors: ['#ff1f3d', '#ff6b7d'], spread: 70, size: [7, 11], gravity: -30, ms: 650, spin: 0 });
    el?.animate?.([{ transform: 'scale(1)' }, { transform: 'scale(1.1)' }, { transform: 'scale(0.97)' }, { transform: 'scale(1)' }],
      { duration: 380, easing: 'ease-out' });
  }
  BATTLE_FX.leechDrain = ctx => {
    const victim = toPt(ctx), owner = fromPt(ctx), dmg = ctx.dmg || 0;
    // The Leech's wheel throbs, showing which card is feeding
    if (ctx.win) { const [wx, wy] = fxPoint(ctx.win); fxRing(wx, wy, { color: '#ff1f3d', size: 140, ms: 460, width: 6 }); }
    chomp(victim, { w: 120, ms: 620, bite: dmg > 0 });
    later(220, () => sfx('big_hit', 0.55, 0.45));
    if (!(dmg > 0)) {
      // The fangs clang off a shield (or find nothing to drink)
      later(250, () => {
        fxRing(victim[0], victim[1], { color: ctx.blocked ? '#6aa8ff' : '#bbbbbb', size: 150, ms: 420, width: 6 });
        fxParticles(victim[0], victim[1], { count: 10, html: '✦', colors: ['#6aa8ff', '#ffffff'], spread: 90, size: [6, 10], ms: 500 });
        if (ctx.blocked) sfx('blocked', 0.85, 0.7);
      });
      return;
    }
    later(240, () => {
      sfx('leech', 0.85, 0.9); // the slurp
      fxShake(ctx.to, 8, 320);
      splat(victim[0], victim[1], 110, '#d0102a', '#4a0010', 700);
      goo(victim[0], victim[1], 6, BLOOD, 90, 100);
      fxTint(vignette('#b0001e'), { ms: 800, opacity: 0.6 });
      stamp(victim[0], victim[1] + 4, dmg >= 20 ? 'MEGA SLURP!' : 'SLURP!', 'blood', { size: dmg >= 20 ? 34 : 30, ms: 800 });
      fxBeam(victim, owner, { cls: 'fxt-siphon', ms: 700, width: 12 });
      // More damage drained, more blood in the stream
      const n = Math.min(12, 5 + Math.round(dmg / 3));
      for (let i = 0; i < n; i++) later(i * 36, () => flyAim(victim, owner, {
        cls: 'fxt-orb', ms: 360, arc: (i % 2 ? 1 : -1) * fxRand(15, 70), scale: [1.2, 0.7], squash: 0.45,
        trail: i === 0 ? bloodTrail : null, trailEvery: 40 }));
      later(360, () => gulp(ctx.from, owner));
      later(360 + n * 36, () => sfx('leech', 1.3, 0.35)); // the last gulp
    });
  };
})();
