// Card effects: the swamp's evolved Heron and Serpent cards (see EVOLVED_CARDS in config.js). They replace the
// generic table effects in js/fx/evolved.js (this file loads after it).
//   Storm Heron / Phoenix Heron (the Grey Heron's evolutions): storm blues and electric yellow, then phoenix fire
//   golds and magenta - Lightning Beak, Gale Dive, Phoenix Flame, Rebirth Feather.
//   Swamp Hydra (the Swamp Serpent's 1st evolution): toxic greens and venom purples - Three-Headed Bite,
//   Hydra Venom, Toxic Spit.
// Built on the region kit (RFX, js/fx/region-kit.js). Styles live in css/fx/swamp-evolved-2.css (prefix fxs2-).
(() => {
  const { later, wait, at, src, sizeOf, pow, dirOf, jolt, lunge, knock, remember, launchPoint, stampPoint, frame, glint,
    speedLines, slash, core, charge, aimFly, show, flames, embers, sparks, smoke, vig, FLAME, clamp } = RFX;
  const landAt = ctx => fxPoint(ctx.slot || ctx.win);
  const bang = (c, s) => { if (typeof flash === 'function') flash(c, s); };
  const buzz = ms => { if (typeof haptic === 'function') haptic(ms); };

  // ---------- Graphics (inline SVG, no image files) ----------
  // A storm cloud
  const CLOUD = '<svg viewBox="0 0 120 64"><path d="M20 58 C4 58 2 36 18 34 C16 16 40 8 50 22 C58 4 90 6 92 26 C112 24 118 52 100 58 Z" ' +
    'fill="#3a4a66" stroke="#141c2e" stroke-width="4" stroke-linejoin="round"/><path d="M26 36 C28 26 40 22 48 30 M62 22 C70 14 84 18 86 28" ' +
    'fill="none" stroke="#7a8cb0" stroke-width="4" stroke-linecap="round"/></svg>';
  // A heron from above, flying RIGHT: swept wings, long neck, dagger beak, legs trailing. pal = [wing, body, beak]
  const heronSvg = ([wing, body, beak]) => '<svg viewBox="0 0 120 70">' +
    `<path d="M36 33 L6 29 M36 37 L6 41" stroke="${beak}" stroke-width="2.5" stroke-linecap="round"/>` +
    `<path d="M62 31 C54 16 40 5 20 1 C31 12 35 22 38 31 Z M62 39 C54 54 40 65 20 69 C31 58 35 48 38 39 Z" fill="${wing}" stroke="#0a1426" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M34 31 L18 35 L34 39 Z" fill="${wing}" stroke="#0a1426" stroke-width="2.5" stroke-linejoin="round"/>` +
    `<ellipse cx="54" cy="35" rx="22" ry="8" fill="${body}" stroke="#0a1426" stroke-width="3"/>` +
    `<path d="M72 35 C80 31 86 36 92 35" fill="none" stroke="#0a1426" stroke-width="8" stroke-linecap="round"/>` +
    `<path d="M72 35 C80 31 86 36 92 35" fill="none" stroke="${body}" stroke-width="4.5" stroke-linecap="round"/>` +
    `<circle cx="94" cy="35" r="5.5" fill="${body}" stroke="#0a1426" stroke-width="2.5"/><path d="M98 32 L119 35 L98 38 Z" fill="${beak}" stroke="#0a1426" stroke-width="2" stroke-linejoin="round"/>` +
    '<circle cx="95" cy="33" r="1.4" fill="#000"/></svg>';
  const STORM_HERON = heronSvg(['#4a6a92', '#9ab8d8', '#ffe14a']);
  const WIND_HERON = heronSvg(['#6a86a8', '#d8ecff', '#ffd23f']);
  // A firebird from above, flying RIGHT with its wings spread wide and a flaming tail. pal = [wing a, wing b, body]
  const phoenixSvg = ([a, b, body], id) => '<svg viewBox="0 0 140 120"><defs>' +
    `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${body}"/></linearGradient></defs>` +
    `<path d="M52 56 C38 50 22 38 4 42 C18 50 12 58 0 62 C14 64 22 70 4 80 C26 76 40 70 52 64 Z" fill="url(#${id})" stroke="#5a0a2a" stroke-width="2.5" stroke-linejoin="round"/>` +
    `<path d="M80 55 C72 30 58 12 30 3 L40 17 L22 15 L34 29 L16 31 L36 41 L24 48 L54 54 Z" fill="url(#${id})" stroke="#5a0a2a" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M80 65 C72 90 58 108 30 117 L40 103 L22 105 L34 91 L16 89 L36 79 L24 72 L54 66 Z" fill="url(#${id})" stroke="#5a0a2a" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M70 50 C60 38 48 28 36 24 M70 70 C60 82 48 92 36 96" fill="none" stroke="#fff6c8" stroke-width="2.5" stroke-linecap="round" opacity=".8"/>` +
    `<ellipse cx="74" cy="60" rx="24" ry="9" fill="${body}" stroke="#5a0a2a" stroke-width="3"/>` +
    `<path d="M96 54 L90 44 L100 50 L104 42 L106 53 Z" fill="${b}" stroke="#5a0a2a" stroke-width="2" stroke-linejoin="round"/>` +
    `<circle cx="102" cy="60" r="8" fill="${body}" stroke="#5a0a2a" stroke-width="3"/><path d="M108 56 L122 60 L108 64 Z" fill="#fff3a0" stroke="#5a0a2a" stroke-width="2" stroke-linejoin="round"/>` +
    '<circle cx="104" cy="58" r="1.8" fill="#3a0010"/></svg>';
  const PHOENIX = phoenixSvg(['#ff2bd6', '#ff6a00', '#ffd23f'], 'fxs2PhA');
  const GOLD_PHOENIX = phoenixSvg(['#ff9a1f', '#ffd23f', '#fff3a0'], 'fxs2PhB');
  // A feather (points UP). pal = [vane, edge]
  const featherSvg = ([vane, edge]) => '<svg viewBox="0 0 30 80"><path d="M15 2 C28 16 28 44 18 64 L15 78 L12 64 C2 44 2 16 15 2 Z" ' +
    `fill="${vane}" stroke="${edge}" stroke-width="2.5" stroke-linejoin="round"/><path d="M15 8 V78" stroke="${edge}" stroke-width="2"/>` +
    `<path d="M15 24 L6 18 M15 34 L5 28 M15 44 L7 40 M15 24 L24 18 M15 34 L25 28 M15 44 L23 40" stroke="${edge}" stroke-width="1.5" opacity=".7"/></svg>`;
  const GOLD_FEATHER = featherSvg(['#ffd23f', '#a04a00']), GREY_FEATHER = featherSvg(['#e8f2ff', '#5a7aa0']);
  const FIRE_FEATHER = featherSvg(['#ffb300', '#c2185b']);
  // A funnel of wind (a small tornado)
  const TORNADO = '<svg viewBox="0 0 80 120"><g fill="none" stroke-linecap="round">' +
    [[40, 12, 36, 8], [42, 34, 28, 7], [38, 54, 21, 6], [42, 72, 15, 5], [39, 88, 10, 4], [41, 102, 6, 3.5]].map(([cx, cy, rx, sw]) =>
      `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${rx * 0.28}" stroke="#2a4a6a" stroke-width="${sw + 3}"/><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${rx * 0.28}" stroke="#dff2ff" stroke-width="${sw}"/>`).join('') +
    '<path d="M40 110 L40 118" stroke="#dff2ff" stroke-width="4"/></g></svg>';
  // A hydra head on its neck, lunging RIGHT with its jaws open
  const HEAD = '<svg viewBox="0 0 130 64">' +
    '<path d="M0 22 C26 14 48 18 66 20 L66 46 C48 46 26 50 0 44 Z" fill="#2f8a2f" stroke="#0c2a0c" stroke-width="3.5" stroke-linejoin="round"/>' +
    '<path d="M0 38 C26 42 48 40 66 40" fill="none" stroke="#b4ff8a" stroke-width="4" opacity=".7"/>' +
    '<path d="M4 26 C12 24 20 24 28 26 M34 24 C42 22 50 22 58 24" fill="none" stroke="#1a5a1a" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M76 32 L122 30 L112 42 Z" fill="#6a0a4a"/>' +
    '<path d="M60 16 C74 4 104 6 124 22 C112 26 96 28 78 31 Z" fill="#3ca83c" stroke="#0c2a0c" stroke-width="3.5" stroke-linejoin="round"/>' +
    '<path d="M60 48 C74 58 100 56 118 42 C106 38 92 36 78 34 Z" fill="#3ca83c" stroke="#0c2a0c" stroke-width="3.5" stroke-linejoin="round"/>' +
    '<g fill="#fff" stroke="#0c2a0c" stroke-width="1.5" stroke-linejoin="round"><path d="M104 24 L108 36 L112 23 Z"/><path d="M88 28 L91 36 L94 27 Z"/>' +
    '<path d="M100 42 L103 33 L107 41 Z"/></g>' +
    '<path d="M70 14 L64 4 L78 10 Z" fill="#a259ff" stroke="#0c2a0c" stroke-width="2" stroke-linejoin="round"/>' +
    '<ellipse cx="84" cy="18" rx="5" ry="3.5" fill="#ffe14a" stroke="#0c2a0c" stroke-width="1.5"/><ellipse cx="85" cy="18" rx="1.3" ry="3" fill="#000"/></svg>';
  // Two dripping fangs (point DOWN)
  const FANGS = '<svg viewBox="0 0 80 70"><path d="M4 6 C20 0 60 0 76 6 L70 16 C54 12 26 12 10 16 Z" fill="#3ca83c" stroke="#0c2a0c" stroke-width="3" stroke-linejoin="round"/>' +
    '<g fill="#fff" stroke="#3a1a4a" stroke-width="2.5" stroke-linejoin="round"><path d="M16 14 C18 34 22 48 26 58 C28 44 30 30 32 13 Z"/><path d="M48 13 C50 30 52 44 54 58 C58 48 62 34 64 14 Z"/></g>' +
    '<circle cx="26" cy="64" r="4" fill="#b44bff"/><circle cx="54" cy="64" r="4" fill="#7cff3a"/></svg>';
  // A bubbling round flask of venom
  const FLASK = '<svg viewBox="0 0 70 90"><path d="M26 4 H44 V32 C60 38 66 52 64 64 C62 80 48 88 35 88 C22 88 8 80 6 64 C4 52 10 38 26 32 Z" fill="#e8f4ff55" stroke="#1a0a2a" stroke-width="4" stroke-linejoin="round"/>' +
    '<path d="M10 58 C22 52 48 64 60 56 C62 74 50 84 35 84 C20 84 10 74 10 58 Z" fill="#7a2ad1"/><path d="M12 60 C24 56 46 66 58 58" fill="none" stroke="#7cff3a" stroke-width="4" stroke-linecap="round"/>' +
    '<circle cx="26" cy="70" r="4" fill="#b4ff8a"/><circle cx="42" cy="74" r="3" fill="#d9b0ff"/><path d="M22 4 H48" stroke="#1a0a2a" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="M16 46 C14 52 14 56 15 60" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/></svg>';
  // A splash crown of venom (purple-green)
  const VSPLASH = '<svg viewBox="0 0 160 110"><path d="M10 104 C30 70 22 40 34 22 C40 46 50 60 56 64 C60 36 70 14 80 2 C90 14 100 36 104 64 C110 60 120 46 126 22 C138 40 130 70 150 104 Z" ' +
    'fill="#8a3ae0" stroke="#2a0a4a" stroke-width="5" stroke-linejoin="round"/><path d="M30 100 C44 80 56 76 66 80 C74 70 86 70 94 80 C104 76 116 80 130 100 Z" fill="#5fd13a"/>' +
    '<circle cx="34" cy="10" r="6" fill="#7cff3a"/><circle cx="80" cy="-8" r="7" fill="#d9b0ff"/><circle cx="126" cy="10" r="6" fill="#7cff3a"/></svg>';
  // A glob of toxic spit, flying RIGHT (drips trailing behind)
  const GLOB = '<svg viewBox="0 0 90 60"><path d="M4 30 C14 26 22 18 40 14 C62 8 86 16 86 32 C86 48 64 56 42 50 C24 46 16 36 4 30 Z" fill="#5fd13a" stroke="#1a4a0a" stroke-width="3.5" stroke-linejoin="round"/>' +
    '<path d="M44 50 C44 56 40 60 38 58 C36 56 40 52 40 49" fill="#5fd13a" stroke="#1a4a0a" stroke-width="2.5"/>' +
    '<ellipse cx="62" cy="24" rx="10" ry="5" fill="#d9ffb4" opacity=".9"/><circle cx="48" cy="34" r="4" fill="#b4ff8a"/><circle cx="72" cy="40" r="3" fill="#2a8a10"/></svg>';
  // A gooey splat with blobs flung round it
  const SPLAT = '<svg viewBox="-60 -60 120 120"><path d="M-8 -38 C4 -52 12 -36 18 -30 C34 -44 44 -30 34 -16 C52 -12 50 6 36 8 C48 24 34 40 18 30 C14 48 -6 50 -8 34 C-24 48 -40 36 -30 20 ' +
    'C-50 16 -48 -6 -32 -8 C-44 -26 -26 -40 -8 -38 Z" fill="#5fd13a" stroke="#1a4a0a" stroke-width="4" stroke-linejoin="round"/>' +
    '<path d="M-14 -20 C0 -28 16 -18 20 -4" fill="none" stroke="#d9ffb4" stroke-width="5" stroke-linecap="round" opacity=".8"/>' +
    '<circle cx="-46" cy="-34" r="6" fill="#5fd13a" stroke="#1a4a0a" stroke-width="2.5"/><circle cx="48" cy="-38" r="5" fill="#5fd13a" stroke="#1a4a0a" stroke-width="2.5"/>' +
    '<circle cx="52" cy="36" r="6" fill="#5fd13a" stroke="#1a4a0a" stroke-width="2.5"/><circle cx="-50" cy="40" r="4" fill="#5fd13a" stroke="#1a4a0a" stroke-width="2.5"/></svg>';

  // ---------- Swamp-styled pieces ----------
  // Stamped word: slams down from huge, holds, drifts up. kind: zap, wind, fire, gold, venom, goo
  function stamp(x, y, text, kind, size = 40, rot = fxRand(-7, 7), ms = 860) {
    const half = Math.min(innerWidth / 2, text.length * size * 0.3 + 8); // keep long words on screen
    x = clamp(x, half, innerWidth - half);
    const el = fxSpawn(x, y, { cls: 'fxs2-stamp fxs2-st-' + kind, html: text, ms: ms + 40, style: { fontSize: size + 'px' } });
    return fxAnimate(el, [
      { transform: `scale(3) rotate(${rot - 14}deg)`, opacity: 0 },
      { transform: `scale(0.86) rotate(${rot}deg)`, opacity: 1, offset: 0.13 },
      { transform: `scale(1.08) rotate(${rot}deg)`, opacity: 1, offset: 0.22 },
      { transform: `scale(1) rotate(${rot}deg)`, opacity: 1, offset: 0.74 },
      { transform: `translate(0, -22px) scale(1.1) rotate(${rot}deg)`, opacity: 0 },
    ], ms, 'ease-out');
  }
  // Name plate punching in over the bottom of the wheel. kind: storm, fire, venom
  function plate(ctx, text, kind) {
    if (!ctx.win && !ctx.slot) return;
    const [x, y] = fxPoint(ctx.win || ctx.slot), [, h] = sizeOf(ctx.win, 120, 180);
    const el = fxSpawn(x, y + h * 0.3, { cls: 'fxs2-plate fxs2-pl-' + kind, html: text, ms: 1000 });
    fxAnimate(el, [{ transform: 'translate(0, 16px) scale(0.3)', opacity: 0 }, { transform: 'scale(1.15)', opacity: 1, offset: 0.16 },
      { transform: 'scale(1)', opacity: 1, offset: 0.26 }, { transform: 'scale(1)', opacity: 1, offset: 0.8 }, { transform: 'translate(0, -10px) scale(0.95)', opacity: 0 }], 1000, 'ease-out');
  }
  // A jagged zigzag between two points (for lightning)
  function jag(a, b, n = 8, amp = 16) {
    const d = dirOf(a, b), pts = [a];
    for (let i = 1; i < n; i++) {
      const t = i / n, o = fxRand(-amp, amp) * Math.sin(Math.PI * t) * 1.4;
      pts.push([a[0] + d.dx * t + d.nx * o, a[1] + d.dy * t + d.ny * o]);
    }
    pts.push(b);
    return pts;
  }
  // A jagged ring of arcs round a box (w x h) centred on (x, y)
  function arcRing(x, y, w, h, n = 18, amp = 8) {
    return Array.from({ length: n + 1 }, (_, i) => {
      const a = (i % n) / n * Math.PI * 2, j = i % n === 0 ? 0 : fxRand(-amp, amp);
      return [x + Math.cos(a) * (w / 2 + j), y + Math.sin(a) * (h / 2 + j)];
    });
  }
  // Lightning: polylines drawn in fx-layer coordinates on one full-layer SVG that flickers and fades
  function bolt(paths, { ms = 340, cls = '', delay = 0 } = {}) {
    later(delay, () => {
      const W = innerWidth, H = innerHeight;
      const lines = paths.map(p => { const s = p.map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ');
        return `<polyline class="g" points="${s}"/><polyline class="c" points="${s}"/>`; }).join('');
      const el = fxSpawn(0, 0, { cls: 'fxs2-bolt ' + cls, ms, html: `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${lines}</svg>`,
        size: [W, H], style: { left: '0px', top: '0px', transform: 'none' } });
      el?.animate([{ opacity: 0 }, { opacity: 1, offset: 0.06 }, { opacity: 0.25, offset: 0.2 }, { opacity: 1, offset: 0.32 },
        { opacity: 0.85, offset: 0.7 }, { opacity: 0 }], { duration: ms, fill: 'forwards' });
    });
  }
  // Rising / popping bubbles (green or purple venom)
  const bubbles = (x, y, n, spread, { ms = 900, purple = false, rise = 120 } = {}) => fxParticles(x, y, { count: n,
    cls: purple ? 'fxs2-bub fxs2-bub-p' : 'fxs2-bub', colors: ['#fff'], size: [6, 14], spread, gravity: -rise, angle: -90, cone: 110, ms, spin: 0 });
  // Venom droplets spattering out and falling
  const spatter = (x, y, n, spread, { angle = -90, cone = 220, gravity = 150, ms = 750 } = {}) => fxParticles(x, y, { count: n,
    cls: 'fxs2-drop', colors: ['#7cff3a', '#b44bff', '#5fd13a', '#d9b0ff'], size: [6, 12], spread, gravity, angle, cone, ms, spin: 0 });
  // Feathers drifting out of a hit
  const feathers = (x, y, n, spread, svg = GREY_FEATHER, { gravity = 60, ms = 900 } = {}) => fxParticles(x, y, { count: n,
    html: () => `<i class="fxs2-fth">${svg}</i>`, colors: ['#fff'], size: [6, 10], spread, gravity, ms, spin: 300 });
  // Short-lived glowing trail dots use CSS animations (fxFly / aimFly trails aren't animated)

  // ================= Lightning Beak (x4 + stun): storm clouds, a charged beak and a zigzag bolt =================
  CARD_FX['lightning-beak'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landAt(ctx), [w, h] = sizeOf(ctx.win, 120, 180);
      frame(ctx.win, '#ffe14a');
      fxTint(vig('#0a1430cc'), { ms: 800, opacity: 0.55 });
      // Two clouds roll in over the card and rumble
      [-1, 1].forEach((sd, i) => {
        const c = fxSpawn(x + sd * w * 0.22, y - h * 0.34, { cls: 'fxs2-svg fxs2-cloud', html: CLOUD, ms: 1000, size: [w * 0.8, w * 0.43] });
        fxAnimate(c, [{ transform: `translate(${sd * 40}px, -10px) scale(0.6)`, opacity: 0 }, { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0.25 },
          { transform: `translate(${-sd * 3}px, 1px) scale(1.02)`, opacity: 1, offset: 0.5 }, { transform: `translate(${sd * 3}px, 0) scale(1)`, opacity: 1, offset: 0.75 },
          { transform: `translate(${sd * 20}px, -6px) scale(0.9)`, opacity: 0 }], 1000, 'ease-out');
      });
      // The bolt strikes the card, then crackles again
      bolt([jag([x - w * 0.1, y - h * 0.3], [x + 4, y + 6], 6, 14)], { delay: 260, ms: 300 });
      bolt([jag([x + w * 0.2, y - h * 0.3], [x - 6, y], 5, 12)], { delay: 520, ms: 240 });
      later(280, () => {
        core(x, y, 90, 'sun', 300);
        sparks(x, y, { count: 12, spread: 80 });
        fxRing(x, y, { color: '#ffe14a', size: 130, width: 5, ms: 380 });
        jolt(ctx.slot?.querySelector?.('.card-face'), [{ transform: 'none' }, { transform: 'translate(-3px, 1px)' }, { transform: 'translate(3px, -1px)' }, { transform: 'none' }], 240);
        sfx('stun', 1.3, 0.35);
      });
      plate(ctx, '⚡ LIGHTNING BEAK', 'storm');
    },
    // The heron's head pops up at the wheel, sparks are sucked into its beak, then the bolt arcs out to the victim
    windup(ctx) {
      const a = launchPoint(ctx), b = at(ctx), d = dirOf(a, b), s = ctx.crit ? 1.25 : 1;
      const tip = [a[0] + d.ux * 38 * s, a[1] + d.uy * 38 * s];
      const hd = fxSpawn(a[0], a[1], { cls: 'fxs2-svg fxs2-heron', html: STORM_HERON, ms: 440, size: [130 * s, 76 * s] });
      fxAnimate(hd, [{ transform: `rotate(${d.ang}deg) scale(0.4)`, opacity: 0 }, { transform: `rotate(${d.ang}deg) scale(1.05)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${-d.ux * 10}px, ${-d.uy * 10}px) rotate(${d.ang}deg) scale(1)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${d.ux * 14}px, ${d.uy * 14}px) rotate(${d.ang}deg) scale(1.1)`, opacity: 1, offset: 0.8 },
        { transform: `translate(${d.ux * 16}px, ${d.uy * 16}px) rotate(${d.ang}deg) scale(1.1)`, opacity: 0 }], 420, 'ease-out');
      charge(tip[0], tip[1], { colors: ['#ffe14a', '#fff', '#6ad0ff'], n: 10, r: 70, ms: 200, html: () => '✦', size: [5, 8] });
      later(90, () => core(tip[0], tip[1], 40 * s, 'sun', 200));
      later(200, () => {
        bolt([jag(tip, b, 9, 26 * s), jag(tip, b, 7, 18)], { ms: 320, cls: ctx.crit ? 'fxs2-bolt-big' : '' });
        fxRing(tip[0], tip[1], { color: '#ffe14a', size: 70, width: 4, ms: 260 });
      });
      return wait(300);
    },
    // ZAP: an electric burst, arcs crackling round the victim's box, sparks and a blue-white wash
    impact(ctx) {
      const [x, y] = at(ctx), p = pow(ctx), [w, h] = sizeOf(ctx.to, 200, 46);
      core(x, y, 150 * p, 'sun', 380);
      fxTint(ctx.crit ? '#fff6a0' : '#6ad0ff', { ms: 320, opacity: ctx.crit ? 0.5 : 0.28 });
      bolt([arcRing(x, y, w + 20, h + 26)], { ms: 420 });
      bolt([arcRing(x, y, w + 34, h + 44, 14, 12)], { ms: 360, delay: 140 });
      for (let i = 0; i < (ctx.crit ? 5 : 3); i++) {
        const ang = fxRand(0, Math.PI * 2), r = 90 * p;
        bolt([jag([x, y], [x + Math.cos(ang) * r, y + Math.sin(ang) * r * 0.7], 5, 10)], { ms: 260, delay: i * 60 });
      }
      sparks(x, y, { count: Math.round(12 + 6 * p), spread: 150 * p });
      fxRing(x, y, { color: '#ffe14a', size: 190 * p, width: 7, ms: 460 });
      later(80, () => fxRing(x, y, { color: '#6ad0ff', size: 260 * p, width: 4, ms: 520 }));
      jolt(ctx.to, [{ transform: 'none' }, { transform: 'translate(-5px, 2px)' }, { transform: 'translate(5px, -2px)' }, { transform: 'translate(-3px, 0)' }, { transform: 'translate(3px, 1px)' }, { transform: 'none' }], 360);
      const [sx, sy] = stampPoint(ctx);
      stamp(sx, sy, ctx.crit ? 'THUNDERSTRUCK!!' : 'ZAP!', 'zap', ctx.crit ? 38 : Math.min(54, 34 + 10 * p));
      fxShake(ctx.panel, Math.min(24, 10 * p), 420);
      if (ctx.crit) { bang('#fff6a0', 0.45); buzz(90); }
    },
  };

  // ================= Gale Dive (x2, frenzy: 3 strikes): the heron dives in on a gust, from a new angle each time =================
  const DIVE_ANGLES = [-140, -40, -95]; // where each strike dives from, measured round the victim (deg)
  CARD_FX['gale-dive'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landAt(ctx), [w, h] = sizeOf(ctx.win, 120, 180);
      frame(ctx.win, '#bfe6ff');
      // A little whirlwind spins up out of the card, swaying as it grows
      const tw = fxSpawn(x, y - h * 0.05, { cls: 'fxs2-svg fxs2-tornado', html: TORNADO, ms: 1000, size: [w * 0.7, w * 1.05], style: { transformOrigin: '50% 100%' } });
      fxAnimate(tw, [{ transform: 'translate(0, 30px) scale(0.2, 0.1)', opacity: 0 }, { transform: 'translate(-8px, 0) scale(1, 1) skewX(8deg)', opacity: 1, offset: 0.3 },
        { transform: 'translate(8px, -4px) scale(1.05, 1.05) skewX(-8deg)', opacity: 1, offset: 0.55 }, { transform: 'translate(-6px, -8px) scale(1, 1.08) skewX(6deg)', opacity: 1, offset: 0.78 },
        { transform: 'translate(0, -30px) scale(0.6, 1.2)', opacity: 0 }], 1000, 'ease-in-out');
      // Leaves and feathers whipped round it
      RFX.orbit(x, y - h * 0.05, i => i % 2 ? '🍃' : `<i class="fxs2-fth">${GREY_FEATHER}</i>`, 5, { rx: w * 0.42, ry: 14, ms: 950, size: 16, turns: 2 });
      for (let i = 0; i < 3; i++) later(i * 120, () => fxBeam([x - w * 0.6, y + (i - 1) * 24], [x + w * 0.6, y + (i - 1) * 24 - 8], { cls: 'fxs2-gust', ms: 360, width: 4 }));
      plate(ctx, '🌪️ GALE DIVE', 'storm');
      sfx('hop', 0.6, 0.35); // a whoosh
    },
    // Each strike the heron dives down on a gust from a different angle, wind streaks racing alongside
    windup(ctx) {
      const s = Math.min(2, ctx.strike || 0), b = at(ctx), deg = DIVE_ANGLES[s], r = deg * Math.PI / 180, L = Math.min(300, innerHeight * 0.4);
      const a = [b[0] + Math.cos(r) * L * 1.1, b[1] + Math.sin(r) * L];
      const d = dirOf(a, b);
      for (let i = 0; i < 4; i++) later(i * 50, () => {
        const o = (i - 1.5) * 26;
        fxBeam([a[0] + d.nx * o, a[1] + d.ny * o], [b[0] + d.nx * o * 0.6 - d.ux * 30, b[1] + d.ny * o * 0.6 - d.uy * 30], { cls: 'fxs2-gust', ms: 300, width: 3 + (i % 2) * 2 });
      });
      const k = 1 + s * 0.15 + (ctx.crit ? 0.2 : 0);
      return aimFly(a, b, { html: WIND_HERON, cls: 'fxs2-svg fxs2-heron', size: [140 * k, 82 * k], ms: 300, arc: s === 1 ? 50 : -50,
        scale: [0.6, 1.2], trail: 'fxs2-windtrail', trailEvery: 30, easing: 'cubic-bezier(.5,0,1,.7)' });
    },
    // WHOOSH: crossing wind slashes, a gust ring and feathers everywhere, escalating each strike
    impact(ctx) {
      const [x, y] = at(ctx), p = pow(ctx), s = Math.min(2, ctx.strike || 0), k = p * (1 + s * 0.25);
      const base = DIVE_ANGLES[s] + 180;
      for (let i = 0; i <= s; i++) later(i * 50, () => slash(x, y, base + (i - s / 2) * 40 + fxRand(-8, 8), 150 * k, 10 + s * 2, 'fxs2-slash-wind'));
      fxRing(x, y, { color: '#dff2ff', size: 170 * k, width: 6, ms: 440 });
      if (s === 2) later(80, () => fxRing(x, y, { color: '#6aa8ff', size: 260 * k, width: 8, ms: 520 }));
      speedLines(x, y, { n: 6 + s * 2, r0: 40, r1: 110 * k, cls: 'fxs2-gust', width: 3 });
      feathers(x, y, 6 + s * 4, 130 * k);
      knock(ctx.to, [x + Math.cos(DIVE_ANGLES[s] * Math.PI / 180) * 100, y + Math.sin(DIVE_ANGLES[s] * Math.PI / 180) * 100], 10 + s * 6);
      const word = ctx.crit ? ['GUST!!', 'TYPHOON!!', 'MEGA HURRICANE!!!'][s] : ['WHOOSH!', 'WHOOSH!!', 'HURRICANE!!!'][s];
      const [sx, sy] = stampPoint(ctx, (s - 1) * 14);
      stamp(sx, sy, word, 'wind', Math.min(52, 28 + s * 6 + 8 * p), [-8, 7, -4][s], 760);
      fxShake(ctx.panel, 6 + s * 6 * p, 360);
      if (s === 2) { fxTint(vig('#6aa8ffbb'), { ms: 500, opacity: 0.5 }); buzz(70); }
    },
  };

  // ================= Phoenix Flame (x6 + burn): a firebird swoops in trailing fire and explodes in its own shape =================
  CARD_FX['phoenix-flame'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landAt(ctx), [w, h] = sizeOf(ctx.win, 120, 180);
      frame(ctx.win, '#ff2bd6', 800);
      fxTint(vig('#7a0a3add'), { ms: 900, opacity: 0.5 });
      // The card bursts into flame and a firebird rises out of it, spreading its wings wide
      flames(x, y + h * 0.3, { n: 5, w: w * 0.8, h: 64, ms: 800 });
      const bird = fxSpawn(x, y - 6, { cls: 'fxs2-svg fxs2-phoenix', html: PHOENIX, ms: 1000, size: [w * 1.2, w * 1.03] });
      fxAnimate(bird, [{ transform: 'translate(0, 30px) rotate(-90deg) scale(0.3, 0.1)', opacity: 0 },
        { transform: 'translate(0, 0) rotate(-90deg) scale(0.9, 0.35)', opacity: 1, offset: 0.25 },
        { transform: 'translate(0, -8px) rotate(-90deg) scale(1, 1.1)', opacity: 1, offset: 0.5 },
        { transform: 'translate(0, -12px) rotate(-90deg) scale(1, 0.95)', opacity: 1, offset: 0.75 },
        { transform: 'translate(0, -40px) rotate(-90deg) scale(1.2, 1.3)', opacity: 0 }], 1000, 'ease-out');
      later(200, () => { embers(x, y, { count: 12, spread: 100 }); core(x, y, 110, 'fire', 420); });
      later(350, () => feathers(x, y - 10, 5, 80, FIRE_FEATHER, { gravity: -30 }));
      jolt(ctx.slot?.querySelector?.('.card-face'), [{ transform: 'none' }, { transform: 'scale(1.06)' }, { transform: 'none' }], 300, { delay: 200 });
      plate(ctx, '☄️ PHOENIX FLAME', 'fire');
      sfx('saw', 1.6, 0.25); // a whoosh of flame
    },
    // The firebird bursts out of the wheel and swoops at the victim, wings spread, trailing fire
    windup(ctx) {
      const a = launchPoint(ctx), b = at(ctx), s = ctx.crit ? 1.25 : 1;
      core(a[0], a[1], 100, 'fire', 280);
      fxTint(vig('#ff3d0099'), { ms: 420, opacity: 0.4 });
      return aimFly(a, b, { html: PHOENIX, cls: 'fxs2-svg fxs2-phoenix', size: [130 * s, 112 * s], ms: 360, arc: -90, scale: [0.5, 1.35],
        trail: 'fxs2-firetrail', trailEvery: 28, easing: 'cubic-bezier(.45,0,.9,.6)' });
    },
    // INFERNO: a giant firebird of flame bursts over the victim, with golden feathers, flames and rings
    impact(ctx) {
      const [x, y] = at(ctx), p = pow(ctx), [w, h] = sizeOf(ctx.to, 200, 46);
      const W = Math.min(innerWidth * 0.95, 220 * p);
      const burst = fxSpawn(x, y, { cls: 'fxs2-svg fxs2-phoenix fxs2-burst', html: PHOENIX, ms: 760, size: [W, W * 0.86] });
      fxAnimate(burst, [{ transform: 'rotate(-90deg) scale(0.3)', opacity: 1 }, { transform: 'rotate(-90deg) scale(1.1)', opacity: 1, offset: 0.35 },
        { transform: 'translate(0, -20px) rotate(-90deg) scale(1.5, 1.4)', opacity: 0 }], 740, 'ease-out');
      core(x, y, 170 * p, 'fire', 460);
      flames(x, y + h * 0.4, { n: 6, w: w * 0.9, h: 60 + 20 * p, ms: 800 });
      feathers(x, y, Math.round(8 + 4 * p), 170 * p, GOLD_FEATHER, { gravity: 40 });
      embers(x, y, { count: 14, spread: 140 * p });
      fxRing(x, y, { color: '#ffd23f', size: 200 * p, width: 8, ms: 480 });
      later(90, () => fxRing(x, y, { color: '#ff2bd6', size: 290 * p, width: 5, ms: 560 }));
      fxTint(ctx.crit ? '#ff6a00' : vig('#ff2bd6cc'), { ms: 560, opacity: ctx.crit ? 0.5 : 0.55 });
      const [sx, sy] = stampPoint(ctx);
      stamp(sx, sy, ctx.crit ? 'SUPERNOVA!!' : 'INFERNO!', 'fire', ctx.crit ? 44 : Math.min(54, 34 + 10 * p), -5);
      fxShake(ctx.panel, Math.min(28, 14 * p), 520); fxShake(ctx.to, 14, 420);
      buzz(ctx.crit ? 120 : 70);
      if (ctx.crit) bang('#ffd23f', 0.5);
    },
    // Burn: the victim catches phoenix fire (the fire kit's burn, with magenta phoenix sparks)
    gimmick(ctx) {
      RFX.fire.burn(ctx, { word: 'PHOENIX BURN!' });
      const [x, y] = at(ctx);
      later(120, () => fxParticles(x, y, { count: 8, html: () => '✦', colors: ['#ff2bd6', '#ffd23f', '#fff3a0'], spread: 90, size: [6, 10], gravity: -50, ms: 700 }));
    },
  };

  // ================= Rebirth Feather (wallow: heal + shield): a golden feather, then the heron is reborn from its ashes =================
  CARD_FX['rebirth-feather'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landAt(ctx), [w, h] = sizeOf(ctx.win, 120, 180);
      frame(ctx.win, '#ffd23f', 900);
      // A glowing golden feather floats down, rocking side to side, and settles onto the card
      const f = fxSpawn(x, y, { cls: 'fxs2-svg fxs2-gfeather', html: GOLD_FEATHER, ms: 1100, size: [Math.max(40, w * 0.36), Math.max(106, w * 0.95)] });
      fxAnimate(f, [{ transform: `translate(-18px, ${-h * 0.55}px) rotate(-30deg)`, opacity: 0 },
        { transform: `translate(14px, ${-h * 0.36}px) rotate(24deg)`, opacity: 1, offset: 0.25 },
        { transform: `translate(-10px, ${-h * 0.18}px) rotate(-18deg)`, opacity: 1, offset: 0.5 },
        { transform: 'translate(0, 0) rotate(4deg) scale(1.05)', opacity: 1, offset: 0.75 },
        { transform: 'translate(0, 0) rotate(0deg) scale(1.3)', opacity: 0 }], 1100, 'ease-in-out');
      later(820, () => {
        core(x, y, 120, 'sun', 360);
        fxParticles(x, y, { count: 10, html: () => '✦', colors: ['#ffd23f', '#fff3a0', '#fff'], spread: 80, size: [5, 9], ms: 600 });
        glint(ctx.slot);
        sfx('buff', 1.2, 0.35);
      });
      plate(ctx, '🪶 REBIRTH FEATHER', 'fire');
    },
    // Wallow: the heron bursts into flame, crumbles to ashes, and a golden phoenix rises from them - healed and shielded
    gimmick(ctx) {
      const [x, y] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46);
      fxTint(vig('#8a3a00dd'), { ms: 1300, opacity: 0.55 });
      // Burst into flame
      flames(x, y + h * 0.4, { n: 6, w: w * 0.9, h: 70, ms: 700 });
      core(x, y, 150, 'fire', 420);
      fxShake(ctx.from, 6, 300);
      // ... crumble to ash and smoke
      later(350, () => { smoke(x, y, 4, { size: 54, spread: w * 0.5 }); RFX.ashFall(x, y - h * 0.5, w * 0.8, 8, { fall: 50, ms: 700 }); });
      // ... embers rise, and the golden phoenix is reborn from the ashes, wings spreading wide
      later(520, () => {
        embers(x, y + h * 0.3, { count: 16, spread: 130, rise: 150 });
        const bird = fxSpawn(x, y - 10, { cls: 'fxs2-svg fxs2-phoenix fxs2-gold', html: GOLD_PHOENIX, ms: 1100, size: [200, 172] });
        fxAnimate(bird, [{ transform: 'translate(0, 30px) rotate(-90deg) scale(0.2, 0.05)', opacity: 0 },
          { transform: 'translate(0, 0) rotate(-90deg) scale(0.7, 0.3)', opacity: 1, offset: 0.25 },
          { transform: 'translate(0, -16px) rotate(-90deg) scale(1, 1.1)', opacity: 1, offset: 0.55 },
          { transform: 'translate(0, -24px) rotate(-90deg) scale(1, 1)', opacity: 1, offset: 0.8 },
          { transform: 'translate(0, -60px) rotate(-90deg) scale(1.2, 1.3)', opacity: 0 }], 1100, 'ease-out');
        fxRing(x, y, { color: '#ffd23f', size: 220, width: 7, ms: 560 });
        sfx('heal', 1, 0.6);
      });
      // Healing sparks and a golden shield bubble
      later(760, () => fxParticles(x, y, { count: 10, html: '✚', colors: ['#ffd23f', '#fff3a0', '#7dff7d'], size: [7, 12], spread: 80, gravity: -80, angle: -90, cone: 140, ms: 800, spin: 0 }));
      later(950, () => {
        const sh = fxSpawn(x, y, { cls: 'fxs2-goldshield', ms: 900, size: [w + 34, h + 40] });
        fxAnimate(sh, [{ transform: 'scale(1.3)', opacity: 0 }, { transform: 'scale(0.96)', opacity: 1, offset: 0.2 }, { transform: 'scale(1.02)', opacity: 1, offset: 0.35 },
          { transform: 'scale(1)', opacity: 1, offset: 0.8 }, { transform: 'scale(1.08)', opacity: 0 }], 900, 'ease-out');
        stamp(x, y + h * 0.5 + 18, 'REBORN!', 'gold', 32, -4, 900);
        sfx('shield', 1.1, 0.5);
      });
    },
  };

  // ================= Three-Headed Bite (x3, frenzy): one more head lunges in each strike =================
  // Offsets (deg) round the line from the victim back to the wheel for 1, 2 and 3 heads
  const HEAD_FANS = [[0], [-38, 38], [-55, 0, 55]];
  CARD_FX['three-headed-bite'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landAt(ctx), [w, h] = sizeOf(ctx.win, 120, 180);
      frame(ctx.win, '#5fd13a', 900);
      // Three serpent heads rise up out of the card and sway, out of step with each other
      [-1, 0, 1].forEach((o, i) => later(i * 90, () => {
        const hd = fxSpawn(x + o * w * 0.28 + w * 0.45, y - 4 + Math.abs(o) * 10, { cls: 'fxs2-svg fxs2-head', html: HEAD, ms: 980, size: [w * 0.9, w * 0.44], style: { transformOrigin: '0% 50%' } });
        const base = -90 + o * 22;
        fxAnimate(hd, [{ transform: `translate(0, ${h * 0.3}px) rotate(${base}deg) scale(0.2, 0.6)`, opacity: 0 },
          { transform: `translate(0, 0) rotate(${base - 8}deg) scale(1)`, opacity: 1, offset: 0.3 },
          { transform: `translate(${o * 4}px, -4px) rotate(${base + 10}deg) scale(1)`, opacity: 1, offset: 0.55 },
          { transform: `translate(${-o * 4}px, 0) rotate(${base - 8}deg) scale(1.02)`, opacity: 1, offset: 0.78 },
          { transform: `translate(0, ${h * 0.2}px) rotate(${base}deg) scale(0.6)`, opacity: 0 }], 960 - i * 90, 'ease-in-out');
      }));
      bubbles(x, y + h * 0.3, 8, 60, { purple: true });
      later(400, () => sfx('bite', 1.3, 0.25)); // a hiss and a snap
      plate(ctx, '🐍 THREE-HEADED BITE', 'venom');
    },
    // Strike 1: one head lunges; strike 2: two; strike 3: all three, each from its own angle, necks trailing
    windup(ctx) {
      const s = Math.min(2, ctx.strike || 0), b = at(ctx), o = launchPoint(ctx), back = dirOf(b, o), L = clamp(back.len, 180, 280);
      HEAD_FANS[s].forEach((off, i) => later(i * 40, () => {
        const r = (back.ang + off) * Math.PI / 180, a = [b[0] + Math.cos(r) * L, b[1] + Math.sin(r) * L];
        aimFly(a, b, { html: HEAD, cls: 'fxs2-svg fxs2-head', size: [140, 70], ms: 290, arc: off ? -off : 30, scale: [0.6, 1.15],
          trail: 'fxs2-neck', trailEvery: 28, easing: 'cubic-bezier(.5,0,1,.6)' });
      }));
      return wait(290 + (HEAD_FANS[s].length - 1) * 40);
    },
    // CHOMP: fang marks punch in, venom spatters, and the words escalate to TRIPLE BITE
    impact(ctx) {
      const [x, y] = at(ctx), p = pow(ctx), s = Math.min(2, ctx.strike || 0), k = p * (1 + s * 0.2), [w] = sizeOf(ctx.to, 200, 46);
      for (let i = 0; i <= s; i++) {
        const mx = x + (i - s / 2) * Math.min(60, w * 0.25), my = y + fxRand(-8, 8), rot = fxRand(-20, 20), fm = clamp(k, 0.9, 1.5);
        later(i * 60, () => {
          const m = fxSpawn(mx, my, { cls: 'fxs2-fangmark', ms: 760, html: '<i></i><i></i><i></i><i></i>' });
          fxAnimate(m, [{ transform: `rotate(${rot}deg) scale(1.8)`, opacity: 0 }, { transform: `rotate(${rot}deg) scale(${0.9 * fm})`, opacity: 1, offset: 0.15 },
            { transform: `rotate(${rot}deg) scale(${fm})`, opacity: 1, offset: 0.7 }, { transform: `rotate(${rot}deg) scale(${fm})`, opacity: 0 }], 740, 'ease-out');
          spatter(mx, my, 6 + s * 2, 90 * k);
        });
      }
      fxRing(x, y, { color: '#7cff3a', size: 160 * k, width: 6, ms: 420 });
      if (s >= 1) later(70, () => fxRing(x, y, { color: '#b44bff', size: 230 * k, width: 4, ms: 500 }));
      jolt(ctx.to, [{ transform: 'none' }, { transform: 'scale(0.94, 1.06)' }, { transform: 'scale(1.04, 0.96)' }, { transform: 'none' }], 300);
      const word = ctx.crit ? ['CRUNCH!', 'CRUNCH-CRUNCH!!', 'HYDRA FEAST!!!'][s] : ['CHOMP!', 'CHOMP-CHOMP!!', 'TRIPLE BITE!!!'][s];
      const [sx, sy] = stampPoint(ctx, (s - 1) * 14);
      stamp(sx, sy, word, 'venom', Math.min(50, 26 + s * 6 + 8 * p), [-6, 6, -3][s], 780);
      fxShake(ctx.panel, 6 + s * 6 * p, 360);
      if (s === 2) { fxTint(vig('#2a7a10cc'), { ms: 500, opacity: 0.5 }); buzz(80); }
    },
  };

  // ================= Hydra Venom (x2, venomfang: double if poisoned): dripping fangs and a venom spray =================
  CARD_FX['hydra-venom'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landAt(ctx), [w, h] = sizeOf(ctx.win, 120, 180);
      frame(ctx.win, '#b44bff', 900);
      // Fangs hang over the card and drip venom into a bubbling flask below
      show(x, y - h * 0.24, FANGS, { cls: 'fxs2-fangs', size: [w * 0.85, w * 0.74], ms: 1000, from: 0.4, rise: 6 });
      show(x, y + h * 0.16, FLASK, { cls: 'fxs2-flask', size: [w * 0.6, w * 0.77], ms: 1000, from: 0.2, rise: 0 });
      for (let i = 0; i < 4; i++) later(180 + i * 140, () => {
        const sx = x + (i % 2 ? 0.17 : -0.17) * w * 0.6;
        const d = fxSpawn(sx, y - h * 0.08, { cls: 'fxs2-drip' + (i % 2 ? '' : ' fxs2-drip-p'), ms: 360 });
        fxAnimate(d, [{ transform: 'translate(0, 0) scale(0.4, 0.6)', opacity: 0 }, { transform: 'translate(0, 6px) scale(1, 1.2)', opacity: 1, offset: 0.25 },
          { transform: `translate(${-(sx - x) * 0.7}px, ${h * 0.2}px) scale(0.8, 1.3)`, opacity: 0.9 }], 340, 'ease-in');
      });
      later(300, () => bubbles(x, y + h * 0.05, 8, 40, { purple: true, rise: 80 }));
      plate(ctx, '🧪 HYDRA VENOM', 'venom');
      sfx('poison', 1.1, 0.3);
    },
    // Fangs flash at the wheel and spray a fan of venom droplets at the victim
    windup(ctx) {
      const a = launchPoint(ctx), b = at(ctx), d = dirOf(a, b), n = ctx.crit ? 14 : 11;
      const fg = fxSpawn(a[0], a[1], { cls: 'fxs2-svg fxs2-fangs', html: FANGS, ms: 400, size: [80, 70] });
      fxAnimate(fg, [{ transform: `rotate(${d.ang - 90}deg) scale(0.4)`, opacity: 0 }, { transform: `rotate(${d.ang - 90}deg) scale(1.15)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${d.ux * 20}px, ${d.uy * 20}px) rotate(${d.ang - 90}deg) scale(1)`, opacity: 0 }], 380, 'ease-out');
      later(40, () => fxBeam(a, b, { cls: 'fxs2-spray', ms: 380, width: ctx.crit ? 30 : 22 }));
      for (let i = 0; i < n; i++) later(60 + i * 14, () => fxFly(a, [b[0] + fxRand(-40, 40), b[1] + fxRand(-22, 22)],
        { html: '<i class="fxs2-vd"></i>', cls: i % 2 ? 'fxs2-vdrop fxs2-vdrop-p' : 'fxs2-vdrop', ms: 220, arc: fxRand(-40, 40), scale: [0.6, 1.3], easing: 'ease-in' }));
      return wait(60 + n * 14 + 200);
    },
    // A purple-green splash; when you're already poisoned the venom doubles and the splash goes huge
    impact(ctx) {
      const [x, y] = at(ctx), dbl = (ctx.defender?.poison || 0) > 0, p = pow(ctx) * (dbl ? 1.3 : 1);
      const sp = fxSpawn(x, y - 16 * p, { cls: 'fxs2-svg fxs2-vsplash', html: VSPLASH, ms: 760, size: [160 * p, 110 * p], style: { transformOrigin: '50% 100%' } });
      fxAnimate(sp, [{ transform: 'scale(0.3, 0.1)', opacity: 0 }, { transform: 'scale(1.1, 1.15)', opacity: 1, offset: 0.3 },
        { transform: 'scale(1, 0.9)', opacity: 1, offset: 0.6 }, { transform: 'translate(0, 24px) scale(1.2, 0.3)', opacity: 0 }], 740, 'ease-out');
      spatter(x, y, Math.round(14 + 6 * p), 160 * p);
      bubbles(x, y, 10, 110 * p, { purple: true });
      fxRing(x, y, { color: '#b44bff', size: 180 * p, width: 7, ms: 460 });
      later(80, () => fxRing(x, y, { color: '#7cff3a', size: 250 * p, width: 5, ms: 520 }));
      if (dbl) {
        later(140, () => { fxRing(x, y, { color: '#fff', size: 320 * p, width: 9, ms: 560 }); spatter(x, y, 12, 200 * p); });
        fxTint(vig('#6a1ab0ee'), { ms: 650, opacity: 0.6 });
        buzz(90);
      } else fxTint(vig('#5fd13acc'), { ms: 500, opacity: 0.45 });
      const [sx, sy] = stampPoint(ctx);
      stamp(sx, sy, dbl ? (ctx.crit ? 'DOUBLE VENOM!!!' : 'DOUBLE VENOM!') : (ctx.crit ? 'VENOM BLAST!!' : 'VENOM!'), 'venom',
        dbl ? Math.min(50, 36 + 8 * p) : Math.min(48, 30 + 10 * p), dbl ? -6 : 5, dbl ? 1000 : 820);
      fxShake(ctx.panel, Math.min(24, (dbl ? 14 : 9) * p), 420);
    },
  };

  // ================= Toxic Spit (x2 + poison): a big dripping glob of spit arcs over and splats =================
  CARD_FX['toxic-spit'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landAt(ctx), [w, h] = sizeOf(ctx.win, 120, 180);
      frame(ctx.win, '#7cff3a', 800);
      // The card gurgles: green bubbles swell up from the bottom and pop at the top
      for (let i = 0; i < 9; i++) later(i * 65, () => {
        const bx = x + fxRand(-w * 0.35, w * 0.35), s = fxRand(16, 28);
        const bb = fxSpawn(bx, y + h * 0.3, { cls: 'fxs2-bub', ms: 640, size: [s, s] });
        fxAnimate(bb, [{ transform: 'translate(0, 0) scale(0.3)', opacity: 0 }, { transform: `translate(${fxRand(-8, 8)}px, ${-h * 0.25}px) scale(1)`, opacity: 1, offset: 0.5 },
          { transform: `translate(${fxRand(-10, 10)}px, ${-h * 0.5}px) scale(1.3)`, opacity: 1, offset: 0.9 }, { transform: `translate(0, ${-h * 0.52}px) scale(1.8)`, opacity: 0 }], 620, 'ease-in');
      });
      later(500, () => spatter(x, y - h * 0.2, 8, 60, { gravity: 90 }));
      jolt(ctx.slot?.querySelector?.('.card-face'), [{ transform: 'none' }, { transform: 'scale(1.04, 0.96)' }, { transform: 'scale(0.97, 1.03)' }, { transform: 'none' }], 420, { delay: 150 });
      plate(ctx, '💚 TOXIC SPIT', 'venom');
      sfx('leech', 1.2, 0.35); // a wet gurgle
    },
    // HAWK... a big glob lobs high over the battle, dripping as it goes
    windup(ctx) {
      const a = launchPoint(ctx), b = at(ctx), s = ctx.crit ? 1.3 : 1;
      fxParticles(a[0], a[1], { count: 6, cls: 'fxs2-drop', colors: ['#7cff3a', '#5fd13a'], size: [5, 9], spread: 50, gravity: 60, ms: 400 });
      return aimFly(a, b, { html: GLOB, cls: 'fxs2-svg fxs2-glob', size: [100 * s, 66 * s], ms: 380, arc: -140, scale: [0.6, 1.4],
        trail: 'fxs2-drip-trail', trailEvery: 30, easing: 'cubic-bezier(.3,0,.8,.8)' });
    },
    // SPTUI: a gooey splat flattens onto the victim and slowly drips down off them
    impact(ctx) {
      const [x, y] = at(ctx), p = pow(ctx), [w, h] = sizeOf(ctx.to, 200, 46);
      const sp = fxSpawn(x, y, { cls: 'fxs2-svg fxs2-splat', html: SPLAT, ms: 1000, size: [130 * p, 130 * p] });
      fxAnimate(sp, [{ transform: 'scale(0.2) rotate(0deg)', opacity: 1 }, { transform: 'scale(1.2, 0.85) rotate(8deg)', opacity: 1, offset: 0.14 },
        { transform: 'scale(0.95, 1.05) rotate(8deg)', opacity: 1, offset: 0.28 }, { transform: 'translate(0, 6px) scale(1, 1.02) rotate(8deg)', opacity: 1, offset: 0.7 },
        { transform: 'translate(0, 18px) scale(0.9, 1.1) rotate(8deg)', opacity: 0 }], 1000, 'ease-out');
      // Goo drips run down off the bottom of the box
      for (let i = 0; i < 5; i++) later(200 + i * 70, () => {
        const dx = x + (i / 4 - 0.5) * Math.min(w, 140 * p), len = fxRand(20, 40);
        const d = fxSpawn(dx, y + h * 0.3, { cls: 'fxs2-goo', ms: 780, size: [10, len] });
        fxAnimate(d, [{ transform: 'scale(1, 0.1)', opacity: 0 }, { transform: 'translate(0, 6px) scale(1, 1)', opacity: 1, offset: 0.3 },
          { transform: `translate(0, ${len + 20}px) scale(0.7, 1.3)`, opacity: 0 }], 760, 'ease-in');
      });
      fxParticles(x, y, { count: Math.round(12 + 4 * p), cls: 'fxs2-drop', colors: ['#7cff3a', '#5fd13a', '#b4ff8a'], size: [7, 13], spread: 150 * p, gravity: 140, ms: 750 });
      fxRing(x, y, { color: '#7cff3a', size: 170 * p, width: 6, ms: 440 });
      fxTint(vig('#3a9a10cc'), { ms: 520, opacity: 0.45 });
      jolt(ctx.to, [{ transform: 'none' }, { transform: 'scale(1.06, 0.92)' }, { transform: 'scale(0.97, 1.04)' }, { transform: 'none' }], 360);
      const [sx, sy] = stampPoint(ctx);
      stamp(sx, sy, ctx.crit ? 'MEGA SPTUI!!' : 'SPTUI!', 'goo', ctx.crit ? 42 : Math.min(52, 34 + 10 * p), 6);
      fxShake(ctx.panel, Math.min(20, 9 * p), 380);
      sfx('leech', 1.4, 0.4); // splat
    },
  };
})();
