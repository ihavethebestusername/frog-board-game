// Card effects: the Mosquito's and the Snapping Turtle's evolutions (Swarm Mosquito / Mosquito Queen and
// Iron Turtle / Dragon Turtle, see EVOLVED_CARDS in config.js). They replace the generic effects in evolved.js.
// Mosquitoes: murky swamp greens, blood reds and royal gold - zigzagging swarms, proboscis stabs, a crowned
// Queen diving in, germ clouds and a wall of eggs. Turtles: steel and rust, then jade and dragon fire - an iron
// shell ricocheting like a hockey puck, rusty jaws on a shooting neck, dragon breath and jade hexagon plates.
// Built on the region kit (RFX, js/fx/region-kit.js). Styles live in css/fx/swamp-evolved-1.css (prefix fxs1-).
(() => {
  const { later, wait, at, src, sizeOf, pow, dirOf, jolt, faceJiggle, remember, launchPoint, stampPoint,
    frame, glint, speedLines, crackBurst, core, shadow, reticle, orbit, smoke, sparks, embers, flames, heatWave, starSvg, vig } = RFX;
  const landXY = ctx => fxPoint(ctx.slot || ctx.win);

  // ---------- Graphics (inline SVG, all drawn pointing RIGHT where they fly) ----------
  // A mosquito: striped abdomen, humped thorax, red eye, long proboscis out front, fluttering wings
  const mosq = (body, belly, eye, ink, crown = false) => '<svg viewBox="0 0 100 60">' +
    '<g class="fxs1-wings"><path d="M44 26 C30 2 12 2 14 10 C16 18 32 24 44 26Z" fill="#e6fbff" fill-opacity=".75" stroke="' + ink + '" stroke-width="2"/>' +
    '<path d="M48 26 C44 4 30 -2 28 6 C27 14 38 22 48 26Z" fill="#e6fbff" fill-opacity=".6" stroke="' + ink + '" stroke-width="2"/></g>' +
    `<g stroke="${ink}" stroke-width="2.2" fill="none" stroke-linecap="round"><path d="M46 32 L38 46 L30 56"/><path d="M50 33 L48 48 L44 58"/><path d="M54 32 L60 46 L66 56"/></g>` +
    `<path d="M4 30 C10 22 30 22 42 28 C30 36 10 38 4 30Z" fill="${belly}" stroke="${ink}" stroke-width="2.5"/>` +
    `<path d="M14 26 V35 M22 25 V35 M30 26 V34" stroke="${body}" stroke-width="3"/>` +
    `<ellipse cx="50" cy="29" rx="10" ry="8" fill="${body}" stroke="${ink}" stroke-width="2.5"/>` +
    `<circle cx="63" cy="27" r="6.5" fill="${body}" stroke="${ink}" stroke-width="2.5"/>` +
    `<circle cx="65" cy="25" r="3" fill="${eye}"/><circle cx="66" cy="24" r="1" fill="#fff"/>` +
    `<path d="M68 29 L98 34" stroke="${crown ? '#ffd23f' : ink}" stroke-width="${crown ? 3.5 : 2.5}" stroke-linecap="round"/>` +
    (crown ? '<path d="M68 29 L98 34" stroke="#8a5a00" stroke-width="1" stroke-linecap="round"/>' +
      '<path d="M56 20 L57 9 L61 15 L64 6 L67 15 L71 9 L71 20 Z" fill="#ffd23f" stroke="#8a5a00" stroke-width="1.8" stroke-linejoin="round"/>' +
      '<circle cx="64" cy="16" r="1.8" fill="#ff2a45"/>' : '') + '</svg>';
  const MOSQ = mosq('#4d5b3a', '#7d8b5a', '#ff3b3b', '#1b220f');
  const MOSQ_RED = mosq('#5a3a2a', '#d0282a', '#ffd23f', '#2a0a06');
  const QUEEN = mosq('#c99a1a', '#ffd23f', '#ff2a2a', '#5a3a00', true);
  const QUEEN_BARE = mosq('#c99a1a', '#ffd23f', '#ff2a2a', '#5a3a00');
  // A royal crown with jewels
  const CROWN = '<svg viewBox="0 0 60 44"><path d="M4 40 L2 10 L16 22 L30 2 L44 22 L58 10 L56 40 Z" fill="#ffd23f" stroke="#7a4a00" stroke-width="3.5" stroke-linejoin="round"/>' +
    '<rect x="4" y="32" width="52" height="8" fill="#e8a800" stroke="#7a4a00" stroke-width="2.5"/>' +
    '<circle cx="30" cy="22" r="4.5" fill="#ff2a45" stroke="#7a0010" stroke-width="1.5"/><circle cx="15" cy="30" r="3" fill="#3fd18a"/><circle cx="45" cy="30" r="3" fill="#3fd18a"/>' +
    '<circle cx="2" cy="10" r="3" fill="#fff3a0"/><circle cx="30" cy="2" r="3.5" fill="#fff3a0"/><circle cx="58" cy="10" r="3" fill="#fff3a0"/>' +
    '<path d="M10 14 L12 30" stroke="#fff6c8" stroke-width="3" stroke-linecap="round" opacity=".8"/></svg>';
  // A grumpy germ: fuzzy knobs all round, frowning face
  const germ = (fill, spot) => '<svg viewBox="-32 -32 64 64"><g stroke="#1f3a0a" stroke-width="3" stroke-linecap="round">' +
    Array.from({ length: 9 }, (_, i) => { const a = i / 9 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      return `<path d="M${(c * 17).toFixed(1)} ${(s * 17).toFixed(1)} L${(c * 26).toFixed(1)} ${(s * 26).toFixed(1)}"/><circle cx="${(c * 27).toFixed(1)}" cy="${(s * 27).toFixed(1)}" r="3" fill="${fill}"/>`; }).join('') +
    `</g><circle r="19" fill="${fill}" stroke="#1f3a0a" stroke-width="3"/><circle cx="-10" cy="9" r="3" fill="${spot}"/><circle cx="11" cy="11" r="2" fill="${spot}"/>` +
    '<circle cx="-7" cy="-4" r="4.5" fill="#fff"/><circle cx="7" cy="-4" r="4.5" fill="#fff"/><circle cx="-6" cy="-3" r="2.2" fill="#111"/><circle cx="8" cy="-3" r="2.2" fill="#111"/>' +
    '<path d="M-12 -11 L-3 -8 M12 -11 L3 -8" stroke="#1f3a0a" stroke-width="2.5" stroke-linecap="round"/><path d="M-7 9 Q0 4 7 9" fill="none" stroke="#1f3a0a" stroke-width="2.5" stroke-linecap="round"/></svg>';
  const GERM = germ('#7ad13a', '#c8ff9a'), GERM_P = germ('#a259ff', '#e0c8ff');
  const GERMS = [GERM, GERM_P, GERM];
  // A slimy green splat with flung droplets
  const SPLAT = '<svg viewBox="-60 -60 120 120"><path d="M0 -34 C12 -44 20 -28 30 -30 C44 -32 40 -14 48 -6 C58 4 40 12 42 24 C44 40 24 34 14 44 C4 54 -6 38 -18 42 C-34 48 -32 28 -42 20 ' +
    'C-54 10 -40 -2 -44 -14 C-48 -30 -28 -28 -20 -38 C-12 -48 -6 -30 0 -34Z" fill="#6cd13a" stroke="#1f4a0a" stroke-width="4" stroke-linejoin="round"/>' +
    '<path d="M-14 -16 C-4 -24 10 -20 16 -10" fill="none" stroke="#d8ffb0" stroke-width="5" stroke-linecap="round" opacity=".8"/>' +
    '<g fill="#6cd13a" stroke="#1f4a0a" stroke-width="3"><circle cx="-52" cy="-40" r="6"/><circle cx="54" cy="-36" r="5"/><circle cx="50" cy="46" r="6"/><circle cx="-50" cy="44" r="4"/></g>' +
    '<g fill="#a259ff"><circle cx="-14" cy="14" r="5"/><circle cx="18" cy="8" r="4"/><circle cx="4" cy="26" r="3"/></g></svg>';
  // A speckled egg with a shine
  const egg = (fill = '#f5ecd6') => '<svg viewBox="0 0 40 50"><path d="M20 2 C32 2 38 22 38 32 C38 44 30 48 20 48 C10 48 2 44 2 32 C2 22 8 2 20 2Z" fill="' + fill + '" stroke="#6a4a2a" stroke-width="3"/>' +
    '<g fill="#b89a6a"><circle cx="14" cy="30" r="2"/><circle cx="26" cy="22" r="1.6"/><circle cx="28" cy="36" r="2.2"/><circle cx="18" cy="40" r="1.4"/></g>' +
    '<ellipse cx="13" cy="16" rx="4" ry="7" fill="#fff" opacity=".85" transform="rotate(20 13 16)"/></svg>';
  const EGGS = [egg(), egg('#e8f0c8'), egg('#f0e0c0')];
  // The iron shell from above: riveted steel hex plates, a rusty rim
  const SHELL = '<svg viewBox="-50 -50 100 100"><circle r="46" fill="#5a6470" stroke="#1a1e24" stroke-width="4"/>' +
    '<circle r="40" fill="#8a96a4" stroke="#2a3038" stroke-width="2.5"/>' +
    '<polygon points="0,-16 14,-8 14,8 0,16 -14,8 -14,-8" fill="#b8c4d0" stroke="#2a3038" stroke-width="2.5"/>' +
    [0, 60, 120, 180, 240, 300].map(a => `<g transform="rotate(${a})"><path d="M-12 -18 L12 -18 L18 -36 L-18 -36 Z" fill="#a0acb8" stroke="#2a3038" stroke-width="2.5" stroke-linejoin="round"/>` +
      `<circle cy="-42" r="2.6" fill="#dfe6ee" stroke="#2a3038" stroke-width="1.2"/></g>`).join('') +
    '<path d="M-26 -26 C-18 -34 -6 -38 6 -38" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/>' +
    '<g fill="#b0602a" opacity=".85"><circle cx="28" cy="20" r="5"/><circle cx="-30" cy="18" r="3.5"/><circle cx="10" cy="34" r="3"/></g></svg>';
  // Rusty snapping-turtle jaws (upper / lower half) with jagged teeth
  const RJAW = up => `<svg viewBox="0 0 120 50"><path d="${up ? 'M4 46 C10 14 40 4 60 4 C80 4 110 14 116 46 Z' : 'M4 4 C10 36 40 46 60 46 C80 46 110 36 116 4 Z'}" fill="#9a5a2a" stroke="#2a1206" stroke-width="4" stroke-linejoin="round"/>` +
    `<path d="${up ? 'M18 30 C30 16 50 12 60 12 C70 12 90 16 102 30' : 'M18 20 C30 34 50 38 60 38 C70 38 90 34 102 20'}" fill="none" stroke="#c8804a" stroke-width="4" stroke-linecap="round" opacity=".8"/>` +
    '<g fill="#e8dcc0" stroke="#5a3a1a" stroke-width="1.5" stroke-linejoin="round">' + Array.from({ length: 8 }, (_, i) => {
      const x = 12 + i * 13.7, len = 10 + (i % 2 ? 0 : 5);
      return up ? `<path d="M${x - 6} 45 L${x} ${45 + len} L${x + 6} 45 Z"/>` : `<path d="M${x - 6} 5 L${x} ${5 - len} L${x + 6} 5 Z"/>`;
    }).join('') + '</g><g fill="#5a2a0a" opacity=".7">' + (up ? '<circle cx="36" cy="26" r="4"/><circle cx="84" cy="20" r="3"/>' : '<circle cx="44" cy="28" r="3.5"/><circle cx="80" cy="32" r="3"/>') + '</g></svg>';
  // The Iron Turtle's head shooting out: grey-green, rusty open beak, angry eye
  const HEAD = '<svg viewBox="0 0 80 50"><path d="M0 16 C10 12 30 10 42 12 L42 38 C30 40 10 38 0 34Z" fill="#6b7a5a" stroke="#1e2414" stroke-width="3"/>' +
    '<ellipse cx="48" cy="25" rx="18" ry="15" fill="#7a8a64" stroke="#1e2414" stroke-width="3"/>' +
    '<path d="M56 12 C68 11 77 17 80 24 L60 24 Z" fill="#b0602a" stroke="#3a1a08" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<path d="M58 29 L78 31 C74 39 66 41 57 36Z" fill="#8a4a1a" stroke="#3a1a08" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<circle cx="50" cy="17" r="5" fill="#fff3a0" stroke="#1e2414" stroke-width="2"/><circle cx="51.5" cy="17" r="2.2" fill="#111"/>' +
    '<path d="M43 10 L57 13" stroke="#1e2414" stroke-width="3" stroke-linecap="round"/><path d="M34 32 C38 36 44 36 48 34" fill="none" stroke="#4a5638" stroke-width="2"/></svg>';
  // The Dragon Turtle's jade head: horns, gold eye, open mouth with fangs, gold whisker
  const DRAGON = '<svg viewBox="0 0 110 70"><path d="M30 18 C20 4 8 0 0 2 C10 8 14 14 20 24Z" fill="#e8d8a0" stroke="#5a4a20" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<path d="M42 14 C38 2 30 -4 22 -4 C30 4 32 10 34 18Z" fill="#e8d8a0" stroke="#5a4a20" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<path d="M70 34 L103 32 L98 47 L72 41Z" fill="#5a0a0a"/>' +
    '<path d="M24 40 C40 44 60 45 72 41 L98 47 C96 53 90 56 84 56 L60 58 C44 60 28 54 24 40Z" fill="#1f7a4a" stroke="#0a3a22" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M8 32 C12 14 44 4 66 12 L104 24 C108 26 107 31 103 32 L70 34 C50 37 24 42 8 32Z" fill="#2fa36b" stroke="#0a3a22" stroke-width="3" stroke-linejoin="round"/>' +
    '<g fill="#fff" stroke="#8a8a70" stroke-width="1"><path d="M80 33 L82 40 L85 33Z"/><path d="M92 32 L94 38 L96 32Z"/><path d="M84 48 L86 42 L89 48Z"/></g>' +
    '<g fill="none" stroke="#7affc0" stroke-width="2" opacity=".7"><path d="M20 26 C24 20 30 18 34 20"/><path d="M34 22 C38 16 44 14 48 16"/></g>' +
    '<ellipse cx="56" cy="19" rx="7.5" ry="5.5" fill="#ffd23f" stroke="#0a3a22" stroke-width="2"/><ellipse cx="57" cy="19" rx="2" ry="4.2" fill="#111"/>' +
    '<path d="M46 12 L64 14" stroke="#0a3a22" stroke-width="3" stroke-linecap="round"/><ellipse cx="98" cy="26" rx="2.5" ry="1.8" fill="#0a3a22"/>' +
    '<path d="M96 30 C104 22 110 24 116 14" fill="none" stroke="#ffd23f" stroke-width="2.5" stroke-linecap="round"/></svg>';
  // A glowing jade hexagon plate (flat-topped)
  const HEX = '<svg viewBox="-50 -50 100 100"><polygon points="46,0 23,40 -23,40 -46,0 -23,-40 23,-40" fill="#1f7a4a" stroke="#0a3a22" stroke-width="5" stroke-linejoin="round"/>' +
    '<polygon points="32,0 16,28 -16,28 -32,0 -16,-28 16,-28" fill="#2fa36b" stroke="#7affc0" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M-20 -18 L-6 -26" stroke="#d8ffe8" stroke-width="5" stroke-linecap="round" opacity=".8"/><circle r="5" fill="#ffd23f"/></svg>';

  const RUST_COLS = ['#b0602a', '#8a4a1a', '#d0803a', '#5a2a0a'];
  const BLOOD_COLS = ['#d0282a', '#ff5d6b', '#8a0a14'];
  const JADE_COLS = ['#7affc0', '#3fd18a', '#ffd23f', '#ffffff'];

  // ---------- Pieces ----------
  // Stamped word in one of this file's styles (swamp, blood, gold, plague, egg, iron, rust, fire, jade)
  function stamp(x, y, text, { kind = 'swamp', size = 40, rot = fxRand(-7, 7), ms = 860, star = null } = {}) {
    if (star) {
      const w = Math.max(size * 2.6, text.length * size * 0.62);
      const s = fxSpawn(x, y, { cls: 'fxs1-svg', html: starSvg(star, '#0008'), ms, size: [w, w * 0.62] });
      fxAnimate(s, [{ transform: `scale(0.2) rotate(${rot - 30}deg)`, opacity: 0 }, { transform: `scale(1.12) rotate(${rot}deg)`, opacity: 0.95, offset: 0.16 },
        { transform: `scale(1) rotate(${rot + 4}deg)`, opacity: 0.95, offset: 0.72 }, { transform: `scale(1.25) rotate(${rot + 8}deg)`, opacity: 0 }], ms, 'ease-out');
    }
    const el = fxSpawn(x, y, { cls: 'fxs1-stamp fxs1-' + kind, html: text, ms: ms + 40, style: { fontSize: size + 'px' } });
    return fxAnimate(el, [
      { transform: `scale(3) rotate(${rot - 14}deg)`, opacity: 0 },
      { transform: `scale(0.86) rotate(${rot}deg)`, opacity: 1, offset: 0.13 },
      { transform: `scale(1.08) rotate(${rot}deg)`, opacity: 1, offset: 0.22 },
      { transform: `scale(1) rotate(${rot}deg)`, opacity: 1, offset: 0.74 },
      { transform: `translate(0, -22px) scale(1.1) rotate(${rot}deg)`, opacity: 0 },
    ], ms, 'ease-out');
  }
  // Name plate punching in over the bottom of the wheel that landed (swamp-styled: --c glow, --bg fill)
  function plate(ctx, text, color, bg) {
    if (!ctx.win) return;
    const [x, y] = fxPoint(ctx.win), [, h] = sizeOf(ctx.win, 120, 180);
    const el = fxSpawn(x, y + h * 0.3, { cls: 'fxs1-plate', html: text, ms: 1000, vars: { '--c': color, '--bg': bg } });
    fxAnimate(el, [{ transform: 'translate(0, 16px) scale(0.3)', opacity: 0 }, { transform: 'scale(1.15)', opacity: 1, offset: 0.16 },
      { transform: 'scale(1)', opacity: 1, offset: 0.8 }, { transform: 'translate(0, -10px) scale(0.95)', opacity: 0 }], 1000, 'ease-out');
  }
  // Rotation that points a right-facing graphic along (vx, vy), mirrored so it never flies upside down
  const face = (vx, vy) => `rotate(${Math.atan2(vy, vx) * 180 / Math.PI}deg)${vx < 0 ? ' scaleY(-1)' : ''}`;
  // Fly a right-facing graphic along a path, nose first. amp/waves: zigzag across the path, arc: one big bow.
  // spin: spin it instead of pointing it. fade: fade out on arrival instead of vanishing.
  function flyPath(from, to, { html = '', cls = '', size = null, ms = 300, amp = 0, waves = 2, arc = 0, scale = [1, 1], easing = 'linear',
    trail = '', trailEvery = 34, spin = null, fade = false } = {}) {
    const el = fxSpawn(from[0], from[1], { cls, html, ms: ms + 60, size });
    if (!el) return Promise.resolve();
    const d = dirOf(from, to), ph = fxRand(0, Math.PI);
    const pt = t => { const off = Math.sin(Math.PI * t) * arc + Math.sin(t * Math.PI * 2 * waves + ph) * amp * (1 - t * 0.7);
      return [d.dx * t + d.nx * off, d.dy * t + d.ny * off]; };
    const frames = [];
    for (let i = 0, N = 14; i <= N; i++) {
      const t = i / N, [px, py] = pt(t), [qx, qy] = pt(Math.min(1, t + 0.04)), [rx, ry] = pt(Math.max(0, t - 0.04));
      const rot = spin === null ? face(qx - rx, qy - ry) : `rotate(${spin * t}deg)`;
      frames.push({ transform: `translate(${px}px, ${py}px) ${rot} scale(${scale[0] + (scale[1] - scale[0]) * t})`, opacity: fade && i === N ? 0 : 1 });
    }
    let timer = 0;
    if (trail) {
      const t0 = performance.now();
      timer = setInterval(() => { const [px, py] = pt(Math.min(1, (performance.now() - t0) / ms)); fxSpawn(from[0] + px, from[1] + py, { cls: trail, ms: 420 }); },
        fxLite ? trailEvery * 2 : trailEvery);
      setTimeout(() => clearInterval(timer), ms + 50);
    }
    return fxAnimate(el, frames, ms, easing).then(() => { clearInterval(timer); el.remove(); });
  }
  // A buzzing cloud of little mosquitoes rising and zigzagging up out of a point
  function buzzCloud(x, y, n, { w = 60, rise = 70, ms = 900, html = MOSQ, size = [28, 17], gap = 40 } = {}) {
    for (let i = 0; i < n; i++) later(i * gap, () => {
      const sx = x + fxRand(-w / 2, w / 2), sy = y + fxRand(-10, 20);
      flyPath([sx, sy], [sx + fxRand(-60, 60), sy - rise * fxRand(0.7, 1.2)], { html, cls: 'fxs1-svg fxs1-mosq', size, ms: ms * fxRand(0.7, 1),
        amp: fxRand(8, 16), waves: fxRand(1.5, 3), easing: 'ease-out', fade: true });
    });
  }
  // Glow blob (radial gradient class) that swells and fades
  function glow(x, y, cls, size, ms = 500, peak = 1) {
    const el = fxSpawn(x, y, { cls, ms, size: Array.isArray(size) ? size : [size, size] });
    fxAnimate(el, [{ transform: 'scale(0.3)', opacity: 0 }, { transform: 'scale(1)', opacity: peak, offset: 0.3 }, { transform: 'scale(1.3)', opacity: 0 }], ms, 'ease-out');
  }
  // Blood droplets flung from a point
  const droplets = (x, y, n, spread, extra = {}) => fxParticles(x, y, { count: n, cls: 'fxs1-drop', colors: BLOOD_COLS, size: [5, 10], spread,
    gravity: 140, angle: -90, cone: 220, ms: 750, spin: 0, ...extra });
  // Rust flakes crumbling off
  const rustFlakes = (x, y, n, spread, extra = {}) => fxParticles(x, y, { count: n, cls: 'fxs1-rust', colors: RUST_COLS, size: [5, 10], spread,
    gravity: 150, ms: 800, spin: 540, ...extra });
  // Snapping rusty jaws: the two halves slam together on (x, y), W px wide
  function jawSnap(x, y, W, ms = 520, gap = null) {
    const H = W * 50 / 120, g = gap ?? H * 0.9;
    [true, false].forEach(up => {
      const el = fxSpawn(x, y + (up ? -H * 0.42 : H * 0.42), { cls: 'fxs1-svg fxs1-jaw', html: RJAW(up), ms: ms + 40, size: [W, H] });
      const o = up ? -g : g;
      fxAnimate(el, [{ transform: `translate(0, ${o}px) scale(0.8)`, opacity: 0 }, { transform: `translate(0, ${o * 0.9}px) scale(1)`, opacity: 1, offset: 0.25 },
        { transform: 'translate(0, 0) scale(1.05)', opacity: 1, offset: 0.42 }, { transform: `translate(0, ${o * 0.08}px) scale(1)`, opacity: 1, offset: 0.75 },
        { transform: `translate(0, ${o * 0.4}px) scale(0.95)`, opacity: 0 }], ms, 'cubic-bezier(.5,0,.3,1.4)');
    });
  }

  // ================= Swarm Sting (x1, frenzy): swarms of mosquitoes zigzag in, bigger every strike =================
  CARD_FX['swarm-sting'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landXY(ctx), [w, h] = sizeOf(ctx.win, 120, 180);
      frame(ctx.win, '#9bd36a');
      glow(x, y, 'fxs1-haze', [w * 1.1, w], 950, 0.9);
      buzzCloud(x, y + h * 0.1, 10, { w: w * 0.7, rise: h * 0.55, size: [36, 22] });
      later(250, () => stamp(x, y - h * 0.34, 'bzzzz...', { kind: 'swamp', size: 18, rot: -6, ms: 700 }));
      faceJiggle(ctx, [{ transform: 'none' }, { transform: 'translate(-2px, 1px)' }, { transform: 'translate(2px, -1px)' }, { transform: 'translate(-1px, 0)' }, { transform: 'none' }], 300);
      plate(ctx, '🦟 SWARM STING', '#9bd36a', '#1f2a10');
    },
    // Frenzy: a mosquito storm whirls round the Swarm Mosquito
    gimmick(ctx) {
      const [x, y] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46);
      fxTint(vig('#1f3a0add'), { ms: 800, opacity: 0.6 });
      orbit(x, y, `<i class="fxs1-mini">${MOSQ}</i>`, 7, { rx: w * 0.6, ry: h * 0.95, ms: 1000, size: 20, turns: 1.6 });
      for (let i = 0; i < 3; i++) later(i * 140, () => fxRing(x, y, { color: i % 2 ? '#1b220f' : '#9bd36a', size: w * 1.1 + i * 40, width: 6 - i, ms: 480 }));
      buzzCloud(x, y + h * 0.3, 6, { w: w * 0.8, rise: 60, ms: 700, gap: 50 });
      stamp(x, y + h * 0.5 + 18, 'FRENZY!', { kind: 'swamp', size: 34, rot: -6, star: '#4d5b3a' });
      fxShake(ctx.from, 7, 360);
    },
    // 2, 4, then 6 mosquitoes zigzag out of the wheel at you
    windup(ctx) {
      const s = Math.min(2, ctx.strike || 0), n = 2 + s * 2, a = launchPoint(ctx), b = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46);
      for (let i = 0; i < n; i++) later(i * 22, () => flyPath([a[0] + fxRand(-24, 24), a[1] + fxRand(-24, 24)], [b[0] + fxRand(-w * 0.3, w * 0.3), b[1] + fxRand(-h * 0.4, h * 0.4)],
        { html: MOSQ, cls: 'fxs1-svg fxs1-mosq', size: [46 + s * 5, 28 + s * 3], ms: 300, amp: fxRand(14, 26), waves: fxRand(2, 3.5), easing: 'ease-in',
          trail: i % 2 ? '' : 'fxs1-buzztrail', trailEvery: 40 }));
      return wait(310 + n * 12);
    },
    // A flurry of tiny stings all over you, escalating BZZT! -> BZZZT!! -> SWARMED!!!
    impact(ctx) {
      const [x, y] = at(ctx), p = pow(ctx), s = Math.min(2, ctx.strike || 0), [w, h] = sizeOf(ctx.to, 200, 46);
      const n = 6 + s * 4 + (ctx.crit ? 4 : 0);
      for (let i = 0; i < n; i++) later(i * 18, () => {
        const px = x + fxRand(-w * 0.42, w * 0.42), py = y + fxRand(-h * 0.5, h * 0.5), a = fxRand(0, Math.PI * 2);
        fxBeam([px - Math.cos(a) * 20, py - Math.sin(a) * 20], [px, py], { cls: 'fxs1-needle', ms: 200, width: 3 });
        const welt = fxSpawn(px, py, { cls: 'fxs1-welt', ms: 560, size: [9, 9] });
        fxAnimate(welt, [{ transform: 'scale(0)', opacity: 1 }, { transform: 'scale(1.4)', opacity: 1, offset: 0.25 }, { transform: 'scale(1)', opacity: 1, offset: 0.7 }, { transform: 'scale(0.8)', opacity: 0 }], 540);
      });
      fxRing(x, y, { color: s === 2 ? '#ff3b3b' : '#9bd36a', size: (150 + s * 40) * p, width: 5 + s, ms: 420 });
      if (s === 2) { speedLines(x, y, { n: 10, r0: w * 0.3, r1: w * 0.7, cls: 'fxs1-line-swamp', ms: 380, width: 4 }); fxTint(vig('#1f3a0aee'), { ms: 500, opacity: 0.55 }); }
      const words = ctx.crit ? ['BZZZAP!', 'MEGA BZZT!!', 'MEGA SWARM!!!'] : ['BZZT!', 'BZZZT!!', 'SWARMED!!!'];
      const [sx, sy] = stampPoint(ctx);
      stamp(sx, sy, words[s], { kind: s === 2 ? 'blood' : 'swamp', size: Math.min(50, 26 + s * 8 + (ctx.crit ? 6 : 0)), rot: [-8, 6, -4][s], star: s === 2 ? '#9bd36a' : null });
      fxShake(ctx.to, 6 + s * 4, 300);
      if (s === 2) { fxShake(ctx.panel, 10 * p, 380); haptic(60); }
    },
  };

  // ================= Blood Drain (x2, lifesteal): a mosquito lands on you and its proboscis stabs in =================
  CARD_FX['blood-drain'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landXY(ctx), [w, h] = sizeOf(ctx.slot || ctx.win, 100, 130);
      frame(ctx.win, '#ff3b4a');
      // The card fills up with blood from the bottom
      const fill = fxSpawn(x, y, { cls: 'fxs1-bloodfill', ms: 1000, size: [w * 0.92, h * 0.9], style: { transformOrigin: '50% 100%' } });
      fxAnimate(fill, [{ transform: 'scaleY(0)', opacity: 0.9, offset: 0 }, { transform: 'scaleY(0)', opacity: 0.9, offset: 0.25 },
        { transform: 'scaleY(1)', opacity: 0.9, offset: 0.7 }, { transform: 'scaleY(1)', opacity: 0 }], 1000, 'ease-in-out');
      // A mosquito hovers above and dips its proboscis in
      const m = fxSpawn(x, y - h * 0.5 - 14, { cls: 'fxs1-svg fxs1-mosq', html: MOSQ_RED, ms: 1000, size: [70, 42] });
      fxAnimate(m, [{ transform: 'translate(0, -50px) rotate(90deg)', opacity: 0 }, { transform: 'translate(0, -8px) rotate(90deg)', opacity: 1, offset: 0.2 },
        { transform: 'translate(0, 6px) rotate(90deg)', opacity: 1, offset: 0.3 }, { transform: 'translate(0, 4px) rotate(88deg)', opacity: 1, offset: 0.55 },
        { transform: 'translate(0, 7px) rotate(92deg)', opacity: 1, offset: 0.75 }, { transform: 'translate(20px, -60px) rotate(60deg)', opacity: 0 }], 1000, 'ease-in-out');
      later(420, () => fxParticles(x, y + h * 0.3, { count: 8, cls: 'fxs1-drop', colors: BLOOD_COLS, size: [4, 7], spread: 60, gravity: -70, angle: -90, cone: 80, ms: 600, spin: 0 }));
      later(700, () => stamp(x, y - h * 0.2, 'slurp', { kind: 'blood', size: 18, rot: 6, ms: 600 }));
      plate(ctx, '🩸 BLOOD DRAIN', '#ff3b4a', '#3a0610');
    },
    // A mosquito zips onto your HP box, rears back and stabs its proboscis in
    windup(ctx) {
      const a = launchPoint(ctx), [tx, ty] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46), size = ctx.crit ? [110, 66] : [92, 55];
      const perch = [tx + w * 0.16, ty - h * 0.5 - 6], d = dirOf(perch, [tx - w * 0.04, ty]);
      flyPath(a, perch, { html: MOSQ_RED, cls: 'fxs1-svg fxs1-mosq', size, ms: 200, amp: 12, waves: 1.5, arc: -50, easing: 'ease-out' });
      later(200, () => {
        const el = fxSpawn(perch[0], perch[1], { cls: 'fxs1-svg fxs1-mosq', html: MOSQ_RED, size, ms: 620 });
        const rot = face(d.ux, d.uy);
        fxAnimate(el, [{ transform: `${rot}` }, { transform: `translate(${-d.ux * 12}px, ${-d.uy * 12}px) ${rot}`, offset: 0.3 },
          { transform: `translate(${d.ux * 16}px, ${d.uy * 16}px) ${rot}`, offset: 0.42 }, { transform: `translate(${d.ux * 14}px, ${d.uy * 14}px) ${rot} scale(1.04, 1.1)`, offset: 0.75 },
          { transform: `translate(${d.ux * 14}px, ${d.uy * 14}px) ${rot}`, opacity: 1, offset: 0.85 }, { transform: `translate(30px, -70px) ${rot}`, opacity: 0 }], 600, 'ease-in-out');
      });
      return wait(380);
    },
    // SLURP: a heartbeat of blood-red pulses and flung droplets
    impact(ctx) {
      const [x, y] = at(ctx), p = pow(ctx), [w] = sizeOf(ctx.to, 200, 46);
      glow(x, y, 'fxs1-pulse-blood', 150 * p, 460);
      later(170, () => glow(x, y, 'fxs1-pulse-blood', 190 * p, 460));
      [0, 170].forEach((t, i) => later(t, () => fxRing(x, y, { color: i ? '#8a0a14' : '#ff3b4a', size: (160 + i * 60) * p, width: 7 - i * 2, ms: 440 })));
      fxTint(vig('#7a0010ee'), { ms: 600, opacity: ctx.crit ? 0.7 : 0.5 });
      droplets(x, y, Math.round(10 + 4 * p), 120 * p);
      jolt(ctx.to, [{ transform: 'scale(1)' }, { transform: 'scale(0.94)' }, { transform: 'scale(1.03)' }, { transform: 'scale(0.96)' }, { transform: 'scale(1)' }], 420);
      const [sx, sy] = stampPoint(ctx);
      stamp(sx, sy, ctx.crit ? 'MEGA SLURP!!' : 'SLURP!', { kind: 'blood', size: Math.min(50, 30 + 10 * p), rot: 6, star: ctx.crit ? '#ffd0d4' : null });
      fxShake(ctx.to, 8 + 3 * p, 320);
      if (w && ctx.crit) haptic(60);
    },
    // Lifesteal: blood droplets stream back into the mosquito
    gimmick(ctx) { bloodStream(ctx, false); },
  };
  function bloodStream(ctx, royal) {
    const a = at(ctx), b = src(ctx), [, h] = sizeOf(ctx.from, 200, 46), n = royal ? 12 : 9;
    for (let i = 0; i < n; i++) later(i * 40, () => fxFly(a, [b[0] + fxRand(-24, 24), b[1] + fxRand(-12, 12)],
      { html: royal && i % 3 === 0 ? '<i class="fxs1-goldmote"></i>' : '<i class="fxs1-dropi"></i>', cls: 'fxs1-streamfly', ms: 440, arc: fxRand(-110, 110), scale: [1, 0.6], easing: 'ease-in-out' }));
    later(480, () => {
      fxRing(b[0], b[1], { color: royal ? '#ffd23f' : '#ff3b4a', size: 170, width: 6 });
      fxParticles(b[0], b[1], { count: 10, html: '✚', colors: royal ? ['#ffd23f', '#ff5d6b', '#fff3a0'] : ['#ff5d6b', '#ffd0d4', '#ffffff'], size: [6, 10], spread: 70, gravity: -80, angle: -90, cone: 140, ms: 800, spin: 0 });
      jolt(ctx.from, [{ transform: 'scale(1)' }, { transform: 'scale(1.08, 0.94)' }, { transform: 'scale(1)' }], 320);
      stamp(b[0], b[1] + h * 0.5 + 16, royal ? 'ROYAL FEAST!' : 'GULP!', { kind: royal ? 'gold' : 'blood', size: 24, rot: -4, ms: 700 });
    });
  }

  // ================= Royal Proboscis (x4, lifesteal): the crowned Queen dives, gold proboscis first =================
  CARD_FX['royal-proboscis'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landXY(ctx), [w, h] = sizeOf(ctx.win, 120, 180), W = w * 1.45, H = W * 0.6;
      frame(ctx.win, '#ffd23f', 900);
      const rays = fxSpawn(x, y, { cls: 'fxs1-rays', ms: 1050, size: [w * 1.6, w * 1.6] });
      fxAnimate(rays, [{ transform: 'scale(0.3) rotate(0deg)', opacity: 0 }, { transform: 'scale(1) rotate(40deg)', opacity: 0.9, offset: 0.4 }, { transform: 'scale(1.1) rotate(90deg)', opacity: 0 }], 1050, 'linear');
      // A giant golden mosquito rises out of the card...
      const q = fxSpawn(x, y, { cls: 'fxs1-svg fxs1-queen', html: QUEEN_BARE, ms: 1100, size: [W, H] });
      fxAnimate(q, [{ transform: 'translate(0, 30px) scale(0.3)', opacity: 0 }, { transform: 'translate(0, -4px) scale(1.06)', opacity: 1, offset: 0.25 },
        { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0.45 }, { transform: 'translate(0, 2px) scale(1.04, 0.96)', opacity: 1, offset: 0.52 },
        { transform: 'translate(0, -6px) scale(1)', opacity: 1, offset: 0.85 }, { transform: 'translate(0, -20px) scale(0.9)', opacity: 0 }], 1100, 'ease-out');
      // ...and a crown drops onto her head
      const head = [x + W * 0.13, y - H * 0.28];
      later(260, () => fxFly([head[0], head[1] - h * 0.7], head, { html: CROWN, cls: 'fxs1-svg fxs1-crown', ms: 260, spin: 20, easing: 'cubic-bezier(.6,0,1,.6)' }));
      later(520, () => {
        const c = fxSpawn(head[0], head[1], { cls: 'fxs1-svg fxs1-crown', html: CROWN, ms: 560 });
        fxAnimate(c, [{ transform: 'rotate(20deg) scale(1.2, 0.8)' }, { transform: 'rotate(-6deg) scale(1)', offset: 0.25 }, { transform: 'rotate(0deg) scale(1)', opacity: 1, offset: 0.7 },
          { transform: 'translate(0, -24px) scale(0.9)', opacity: 0 }], 540, 'ease-out');
        fxParticles(head[0], head[1], { count: 10, html: '✦', colors: ['#ffd23f', '#fff3a0', '#ffffff'], size: [5, 9], spread: 70, ms: 600, spin: 90 });
        fxRing(head[0], head[1], { color: '#ffd23f', size: 110, width: 4, ms: 380 });
        glint(ctx.slot);
      });
      plate(ctx, '👑 ROYAL PROBOSCIS', '#ffd23f', '#3a1a04');
    },
    // A gold reticle locks on and the Queen dives out of the sky at you, proboscis first, trailing sparkles
    windup(ctx) {
      const [tx, ty] = at(ctx), s = ctx.crit ? 1.3 : 1, W = 150 * s;
      reticle(tx, ty, '#ffd23f', 400);
      shadow(tx, ty + 24, 160, 36, 360);
      const from = [tx + innerWidth * 0.4, Math.max(-70, ty - 330)], d = dirOf(from, [tx, ty]);
      return flyPath(from, [tx - d.ux * W * 0.38, ty - d.uy * W * 0.38], { html: QUEEN, cls: 'fxs1-svg fxs1-queen', size: [W, W * 0.6], ms: 360, arc: 40,
        scale: [0.5, 1.15], easing: 'cubic-bezier(.5,0,1,.6)', trail: 'fxs1-goldtrail', trailEvery: 30 });
    },
    // A burst of gold and red: gold core, royal rings, sparkles, blood droplets and gold speed lines
    impact(ctx) {
      const [x, y] = at(ctx), p = pow(ctx), [w] = sizeOf(ctx.to, 200, 46);
      glow(x, y, 'fxs1-core-gold', 170 * p, 420);
      ['#fff3a0', '#ffd23f', '#b01c1c'].forEach((c, i) => later(i * 80, () => fxRing(x, y, { color: c, size: (170 + i * 70) * p, width: 8 - i * 2, ms: 520 })));
      speedLines(x, y, { n: 10, r0: w * 0.25, r1: w * 0.7 * Math.min(1.4, p), cls: 'fxs1-line-gold', ms: 400, width: 5 });
      fxParticles(x, y, { count: 14, html: '✦', colors: ['#ffd23f', '#fff3a0', '#ffffff'], size: [6, 12], spread: 150 * p, ms: 700, spin: 120 });
      droplets(x, y, 10, 130 * p);
      fxTint(vig('#8a5a00dd'), { ms: 600, opacity: 0.55 });
      const [sx, sy] = stampPoint(ctx);
      stamp(sx, sy, ctx.crit ? 'ROYAL CRIT!!' : 'ROYAL STING!', { kind: 'gold', size: Math.min(50, 30 + 8 * p), rot: -5, star: '#b01c1c' });
      fxShake(ctx.panel, Math.min(24, 10 * p), 440); fxShake(ctx.to, 14, 380);
      if (ctx.crit) { flash('#fff3a0', 0.35); haptic(90); }
    },
    // Lifesteal: blood and gold motes stream back to the Queen
    gimmick(ctx) { bloodStream(ctx, true); },
  };

  // ================= Plague Swarm (x2 + poison): a sickly cloud of grumpy germs drifts over and splats =================
  CARD_FX['plague-swarm'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landXY(ctx), [w, h] = sizeOf(ctx.win, 120, 180);
      frame(ctx.win, '#7ad13a');
      for (let i = 0; i < 5; i++) later(i * 60, () => {
        const el = fxSpawn(x + fxRand(-w * 0.3, w * 0.3), y + h * 0.1, { cls: 'fxs1-miasma', ms: 1000, size: [w * 0.6, w * 0.6] });
        fxAnimate(el, [{ transform: 'scale(0.3)', opacity: 0 }, { transform: `translate(${fxRand(-14, 14)}px, -24px) scale(1)`, opacity: 0.85, offset: 0.35 },
          { transform: `translate(${fxRand(-30, 30)}px, -${h * 0.35}px) scale(1.5)`, opacity: 0 }], 940, 'ease-out');
      });
      later(120, () => fxParticles(x, y + h * 0.1, { count: 8, html: i => `<i class="fxs1-germ-i">${GERMS[i % 3]}</i>`, colors: ['#fff'], size: [7, 12], spread: 80, gravity: -60, angle: -90, cone: 150, ms: 950, spin: 180 }));
      fxParticles(x, y + h * 0.3, { count: 10, cls: 'fxs1-bubble', colors: ['#b4ff8a'], size: [4, 9], spread: 70, gravity: -100, angle: -90, cone: 100, ms: 900, spin: 0 });
      faceJiggle(ctx, [{ transform: 'none' }, { transform: 'scale(1.05, 0.95)' }, { transform: 'scale(0.97, 1.04)' }, { transform: 'none' }], 420);
      later(300, () => stamp(x, y - h * 0.34, 'ACHOO!', { kind: 'plague', size: 20, rot: 6, ms: 700 }));
      plate(ctx, '🦠 PLAGUE SWARM', '#7ad13a', '#142a08');
    },
    // Germs wobble over to you inside a drifting green cloud
    windup(ctx) {
      const a = launchPoint(ctx), b = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46), s = ctx.crit ? 1.25 : 1;
      for (let i = 0; i < 3; i++) later(i * 40, () => flyPath(a, [b[0] + fxRand(-30, 30), b[1] + fxRand(-12, 12)], { cls: 'fxs1-miasma', size: [90 * s, 90 * s], ms: 360,
        arc: fxRand(-50, 50), scale: [0.5, 1.4], spin: 0, easing: 'ease-in-out', fade: false }));
      for (let i = 0; i < 6; i++) later(20 + i * 30, () => flyPath([a[0] + fxRand(-20, 20), a[1] + fxRand(-20, 20)], [b[0] + fxRand(-w * 0.35, w * 0.35), b[1] + fxRand(-h * 0.4, h * 0.4)],
        { html: GERMS[i % 3], cls: 'fxs1-svg fxs1-germ', size: [30 * s, 30 * s], ms: 330, amp: fxRand(10, 20), waves: 1.5, spin: fxRand(-360, 360), easing: 'ease-in' }));
      return wait(400);
    },
    // A slimy green splat, flung germs and toxic rings
    impact(ctx) {
      const [x, y] = at(ctx), p = pow(ctx), rot = fxRand(0, 360);
      const sp = fxSpawn(x, y, { cls: 'fxs1-svg fxs1-splat', html: SPLAT, ms: 820, size: [130 * p, 130 * p] });
      fxAnimate(sp, [{ transform: `scale(0.2) rotate(${rot}deg)`, opacity: 1 }, { transform: `scale(1.12, 0.92) rotate(${rot}deg)`, opacity: 1, offset: 0.18 },
        { transform: `scale(1) rotate(${rot}deg)`, opacity: 1, offset: 0.6 }, { transform: `translate(0, 16px) scale(1.05, 1.2) rotate(${rot}deg)`, opacity: 0 }], 800, 'ease-out');
      fxParticles(x, y, { count: Math.round(12 + 4 * p), colors: ['#6cd13a', '#b4ff8a', '#a259ff'], size: [5, 11], spread: 150 * p, gravity: 100, ms: 700 });
      fxParticles(x, y, { count: 5, html: i => `<i class="fxs1-germ-i">${GERMS[i % 3]}</i>`, colors: ['#fff'], size: [7, 11], spread: 120 * p, gravity: 40, ms: 800, spin: 360 });
      fxRing(x, y, { color: '#7ad13a', size: 170 * p, width: 7, ms: 460 });
      later(80, () => fxRing(x, y, { color: '#a259ff', size: 240 * p, width: 4, ms: 540 }));
      fxTint(vig('#2a6a0aee'), { ms: 600, opacity: 0.55 });
      const [sx, sy] = stampPoint(ctx);
      stamp(sx, sy, ctx.crit ? 'SUPER SICK!!' : 'PLAGUE!', { kind: 'plague', size: Math.min(50, 30 + 9 * p), rot: -6, star: ctx.crit ? '#a259ff' : null });
      fxShake(ctx.to, 10 + 3 * p, 360);
      if (ctx.crit) fxShake(ctx.panel, 10, 320);
    },
  };

  // ================= Brood Wall (armor +2): eggs roll in and stack into a wall around the Queen =================
  CARD_FX['brood-wall'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landXY(ctx), [w, h] = sizeOf(ctx.slot || ctx.win, 100, 130), E = Math.min(30, w * 0.26);
      frame(ctx.win, '#e8d8a8');
      // A little pyramid of eggs piles up on the card (3, 2, 1), then they all wobble
      const spots = [[-1, 0], [0, 0], [1, 0], [-0.5, 1], [0.5, 1], [0, 2]];
      spots.forEach(([cx, row], i) => later(i * 70, () => {
        const ex = x + cx * E * 0.95, ey = y + h * 0.22 - row * E * 1.05;
        const el = fxSpawn(ex, ey, { cls: 'fxs1-svg fxs1-egg', html: EGGS[i % 3], ms: 1100 - i * 70, size: [E, E * 1.25], style: { transformOrigin: '50% 100%' } });
        const ms = 1060 - i * 70, wob = fxRand(8, 14);
        fxAnimate(el, [{ transform: 'translate(0, -70px) scale(0.8)', opacity: 0 }, { transform: 'translate(0, 0) scale(1.15, 0.8)', opacity: 1, offset: 0.16 },
          { transform: 'translate(0, 0) scale(0.95, 1.06)', opacity: 1, offset: 0.26 }, { transform: 'rotate(0deg)', opacity: 1, offset: 0.4 },
          { transform: `rotate(${-wob}deg)`, opacity: 1, offset: 0.5 }, { transform: `rotate(${wob}deg)`, opacity: 1, offset: 0.62 },
          { transform: `rotate(${-wob * 0.5}deg)`, opacity: 1, offset: 0.74 }, { transform: 'rotate(0deg)', opacity: 1, offset: 0.86 }, { transform: 'translate(0, -8px)', opacity: 0 }], ms, 'ease-out');
      }));
      later(480, () => stamp(x, y - h * 0.36, 'wobble wobble', { kind: 'egg', size: 16, rot: -4, ms: 650 }));
      plate(ctx, '🥚 BROOD WALL', '#e8d8a8', '#2a200e');
    },
    // Armor: eggs roll in from both sides and stack into a wall around the Queen, then the shields lock on
    gimmick(ctx) {
      const [x, y] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46), E = 26, n = 12;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.PI / 2, tx = x + Math.cos(a) * (w * 0.55), ty = y + Math.sin(a) * (h * 0.5 + 16);
        const side = Math.cos(a) < 0 ? -1 : 1, sx = x + side * (w * 0.5 + 120), sy = y + h * 0.5 + 30;
        later(i * 35, () => {
          const el = fxSpawn(sx, sy, { cls: 'fxs1-svg fxs1-egg', html: EGGS[i % 3], ms: 1300 - i * 35, size: [E, E * 1.25] });
          const dx = tx - sx, dy = ty - sy, spin = -side * 720, wob = fxRand(8, 14);
          fxAnimate(el, [{ transform: `translate(0, 0) rotate(0deg)`, opacity: 0 }, { transform: `translate(${dx * 0.6}px, ${dy * 0.3}px) rotate(${spin * 0.6}deg)`, opacity: 1, offset: 0.18 },
            { transform: `translate(${dx}px, ${dy}px) rotate(${spin}deg) scale(1.15, 0.85)`, opacity: 1, offset: 0.3 }, { transform: `translate(${dx}px, ${dy}px) rotate(${spin + wob}deg)`, opacity: 1, offset: 0.42 },
            { transform: `translate(${dx}px, ${dy}px) rotate(${spin - wob * 0.6}deg)`, opacity: 1, offset: 0.54 }, { transform: `translate(${dx}px, ${dy}px) rotate(${spin}deg)`, opacity: 1, offset: 0.85 },
            { transform: `translate(${dx}px, ${dy - 10}px) rotate(${spin}deg) scale(0.9)`, opacity: 0 }], 1260 - i * 35, 'ease-out');
        });
      }
      later(560, () => {
        const wall = fxSpawn(x, y, { cls: 'fxs1-eggwall', ms: 700, size: [w + 40, h + 44] });
        fxAnimate(wall, [{ transform: 'scale(1.25)', opacity: 0 }, { transform: 'scale(0.97)', opacity: 1, offset: 0.25 }, { transform: 'scale(1)', opacity: 1, offset: 0.7 }, { transform: 'scale(1.06)', opacity: 0 }], 700, 'ease-out');
        fxRing(x, y, { color: '#f5ecd6', size: w + 70, width: 6, ms: 460 });
        stamp(x, y - h * 0.5 - 30, '🥚 +2 BROOD', { kind: 'egg', size: 26, rot: -4, ms: 750 });
        fxParticles(x, y, { count: 10, html: () => '✦', colors: ['#f5ecd6', '#ffd23f'], spread: 90, size: [5, 9], ms: 600 });
        sfx('shield', 0.8, 0.8);
      });
    },
  };

  // ================= Iron Shell Slam (bash): the turtle hides in its iron shell and ricochets into you like a puck =================
  CARD_FX['iron-shell-slam'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landXY(ctx), [w] = sizeOf(ctx.slot || ctx.win, 100, 130), S = w * 0.95;
      frame(ctx.win, '#b8c4d0');
      const sh = fxSpawn(x, y, { cls: 'fxs1-svg fxs1-shell', html: SHELL, ms: 950, size: [S, S] });
      fxAnimate(sh, [{ transform: 'scale(2.4) rotate(-40deg)', opacity: 0 }, { transform: 'scale(0.88) rotate(0deg)', opacity: 1, offset: 0.18 },
        { transform: 'scale(1.06) rotate(4deg)', opacity: 1, offset: 0.28 }, { transform: 'scale(1) rotate(0deg)', opacity: 1, offset: 0.75 }, { transform: 'scale(1.1)', opacity: 0 }], 950, 'ease-out');
      later(170, () => {
        sparks(x, y, { count: 14, spread: 110 });
        fxRing(x, y, { color: '#dfe6ee', size: S * 1.6, width: 6, ms: 380 });
        stamp(x, y - S * 0.62, 'CLANG!', { kind: 'iron', size: 22, rot: -6, ms: 650 });
        fxShake(ctx.panel, 5, 260);
      });
      later(420, () => glint(sh));
      plate(ctx, '🛡️ IRON SHELL SLAM', '#b8c4d0', '#1e242c');
    },
    // Bash: the turtle ducks into its shell, which ricochets into you once per shield (up to 4), then CLANG!
    gimmick(ctx) {
      const shields = ctx.attacker?.shield || 0, [x, y] = src(ctx), [, h] = sizeOf(ctx.from, 200, 46), T = at(ctx), [tw, th] = sizeOf(ctx.to, 200, 46), S = 64;
      const t = fxSpawn(x, y, { cls: 'fxs1-emoji', html: '🐢', ms: 360, style: { fontSize: '46px' } });
      fxAnimate(t, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.1, 0.8)', opacity: 1, offset: 0.4 }, { transform: 'scale(0.2)', opacity: 0 }], 340, 'ease-in');
      const pop = fxSpawn(x, y, { cls: 'fxs1-svg fxs1-shell', html: SHELL, ms: 340, size: [S, S] });
      fxAnimate(pop, [{ transform: 'scale(0.3) rotate(0deg)', opacity: 0 }, { transform: 'scale(1.15) rotate(90deg)', opacity: 1, offset: 0.6 }, { transform: 'scale(1) rotate(180deg)', opacity: 1 }], 320, 'ease-out');
      if (!shields) {
        later(320, () => {
          const sad = fxSpawn(x, y, { cls: 'fxs1-svg fxs1-shell', html: SHELL, ms: 620, size: [S, S] });
          fxAnimate(sad, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-12deg)', offset: 0.25 }, { transform: 'rotate(10deg)', offset: 0.5 }, { transform: 'rotate(0deg)', opacity: 1, offset: 0.75 }, { transform: 'scale(0.6)', opacity: 0 }], 600);
          stamp(x, y + h * 0.5 + 16, 'clunk...', { kind: 'iron', size: 20, rot: 4, ms: 650 });
        });
        return;
      }
      // The ricochet path: in at you, bounce off to the side, back in... then home
      const n = Math.min(4, shields), leg = 150, d = dirOf(T, [x, y]), pts = [[x, y]];
      for (let i = 0; i < n; i++) {
        pts.push([T[0] + fxRand(-tw * 0.2, tw * 0.2), T[1] + fxRand(-th * 0.3, th * 0.3)]);
        const sd = i % 2 ? 1 : -1;
        pts.push(i < n - 1 ? [T[0] + d.ux * 90 + d.nx * sd * 110, T[1] + d.uy * 90 + d.ny * sd * 110] : [x, y]);
      }
      fxTint(vig('#1e242cdd'), { ms: 320 + leg * pts.length, opacity: 0.45 });
      for (let k = 0; k < pts.length - 1; k++) later(320 + k * leg, () => {
        fxFly(pts[k], pts[k + 1], { html: SHELL, cls: 'fxs1-svg fxs1-shell fxs1-puck', ms: leg, spin: 540, easing: 'linear', trail: 'fxs1-skid', trailEvery: 28 });
        if (k % 2 === 0) later(leg, () => {
          const [hx, hy] = pts[k + 1], i = k / 2;
          sparks(hx, hy, { count: 10, spread: 100 });
          fxRing(hx, hy, { color: '#dfe6ee', size: 130 + i * 25, width: 5, ms: 340 });
          speedLines(hx, hy, { n: 6, r0: 24, r1: 80, cls: 'fxr-line', ms: 260, width: 3 });
          if (i < n - 1) stamp(hx + fxRand(-30, 30), hy - th * 0.5 - 20, 'CLANK!', { kind: 'iron', size: 20 + i * 3, ms: 500 });
          fxShake(ctx.to, 8 + i * 2, 200);
          sfx('blocked', 0.8 + i * 0.12, 0.45);
        });
      });
      later(320 + (2 * n - 1) * leg + 20, () => {
        const [sx, sy] = stampPoint(ctx);
        stamp(sx, sy, n > 1 ? `CLANG x${n}!` : 'CLANG!', { kind: 'iron', size: 32 + n * 4, rot: -5, star: '#6a7888' });
        crackBurst(T[0], T[1], Math.min(170, tw), 'stone', fxRand(0, 60), 600);
        fxShake(ctx.panel, 10 + n * 3, 380);
        haptic(60 + n * 15);
      });
      later(320 + 2 * n * leg, () => {
        const home = fxSpawn(x, y, { cls: 'fxs1-emoji', html: '🐢', ms: 520, style: { fontSize: '44px' } });
        fxAnimate(home, [{ transform: 'scale(0.2)', opacity: 0 }, { transform: 'scale(1.2)', opacity: 1, offset: 0.35 }, { transform: 'scale(1)', opacity: 1, offset: 0.7 }, { transform: 'translate(0, -16px)', opacity: 0 }], 500, 'ease-out');
      });
    },
  };

  // ================= Rust Snap (x3, cleave): the turtle's head shoots out on its neck and rusty jaws SNAP =================
  CARD_FX['rust-snap'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landXY(ctx), [w, h] = sizeOf(ctx.slot || ctx.win, 100, 130);
      frame(ctx.win, '#d0703a');
      jawSnap(x, y, w * 1.05, 720, h * 0.45);
      later(300, () => {
        rustFlakes(x, y, 14, 90, { angle: 90, cone: 200, gravity: 170 });
        crackBurst(x, y, w * 0.9, 'stone', fxRand(0, 60), 600);
        stamp(x, y - h * 0.46, 'SNAP!', { kind: 'rust', size: 22, rot: 6, ms: 600 });
        fxShake(ctx.panel, 4, 220);
      });
      faceJiggle(ctx, [{ transform: 'none' }, { transform: 'scale(1.06, 0.92)' }, { transform: 'none' }], 240);
      plate(ctx, '🦷 RUST SNAP', '#d0703a', '#2a1206');
    },
    // Cleave (before the hit): rusty jaws crunch straight through your shields
    gimmick(ctx) {
      const [tx, ty] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46);
      if (!ctx.blocked) { jawSnap(tx, ty, 110, 420); later(180, () => rustFlakes(tx, ty, 6, 60)); return; }
      const bub = fxSpawn(tx, ty, { cls: 'fxs1-shieldbub', ms: 340, size: [w + 30, h + 44] });
      fxAnimate(bub, [{ transform: 'scale(0.85)', opacity: 0 }, { transform: 'scale(1.04)', opacity: 1, offset: 0.3 }, { transform: 'scale(1, 0.8)', opacity: 1, offset: 0.7 }, { transform: 'scale(1.1, 0.5)', opacity: 0 }], 320, 'ease-in');
      jawSnap(tx, ty, Math.min(260, w * 1.3), 560, h + 30);
      later(230, () => {
        fxParticles(tx, ty, { count: 14, cls: 'fxs1-shard', colors: ['#bcd8ff', '#6aa8ff', '#e3f2ff', '#fff'], spread: 170, size: [9, 16], gravity: 120, ms: 700, spin: 540 });
        rustFlakes(tx, ty, 10, 130);
        crackBurst(tx, ty, Math.min(190, w), 'stone', 0, 360);
        fxRing(tx, ty, { color: '#d0703a', size: 240, width: 6, ms: 420 });
        const [sx, sy] = stampPoint(ctx, -20);
        stamp(sx, sy + 34, 'CRUNCH!', { kind: 'rust', size: 30, rot: -5, ms: 720 });
        fxShake(ctx.panel, 10, 300);
        sfx('bite', 0.7, 0.8);
      });
    },
    // The head shoots out of the turtle on a long scaly neck straight at you
    windup(ctx) {
      const [fx, fy] = src(ctx), [tx, ty] = at(ctx), d = dirOf([fx, fy], [tx, ty]), s = ctx.crit ? 1.25 : 1, a = [fx - d.ux * 50, fy - d.uy * 50];
      const end = [tx - d.ux * 24 * s, ty - d.uy * 34 * s], len = Math.hypot(end[0] - a[0], end[1] - a[1]), MS = 700;
      const neck = fxSpawn(a[0], a[1], { cls: 'fxs1-neck', ms: MS, style: { width: len + 'px', height: 24 * s + 'px', transformOrigin: '0 50%' } });
      const k = (sx, o, op = 1) => ({ transform: `translate(0, -50%) rotate(${d.ang}deg) scaleX(${sx})`, offset: o, opacity: op, easing: o < 0.4 ? 'cubic-bezier(.2,.9,.4,1)' : 'ease-in' });
      neck?.animate([k(0, 0), k(1, 0.42), k(1, 0.62), k(0, 1, 0.6)], { duration: MS, easing: 'linear', fill: 'forwards' });
      const head = fxSpawn(a[0], a[1], { cls: 'fxs1-svg fxs1-head', html: HEAD, ms: MS, size: [88 * s, 55 * s] });
      const r = face(d.ux, d.uy), ex = end[0] - a[0], ey = end[1] - a[1];
      const out = 'cubic-bezier(.2,.9,.4,1)';
      fxAnimate(head, [{ transform: `translate(0, 0) ${r} scale(0.5)`, opacity: 0, offset: 0, easing: out }, { transform: `translate(${ex}px, ${ey}px) ${r} scale(1)`, opacity: 1, offset: 0.42 },
        { transform: `translate(${ex}px, ${ey}px) ${r} scale(1.1, 0.9)`, opacity: 1, offset: 0.62, easing: 'ease-in' }, { transform: `translate(0, 0) ${r} scale(0.5)`, opacity: 0.6 }], MS, 'linear');
      return wait(320);
    },
    // SNAP: rusty jaws clamp down on you, rust flakes and cracks fly
    impact(ctx) {
      const [x, y] = at(ctx), p = pow(ctx), [w] = sizeOf(ctx.to, 200, 46);
      jawSnap(x, y, Math.min(300, 130 * p), 540);
      later(200, () => {
        rustFlakes(x, y, Math.round(12 + 4 * p), 140 * p);
        crackBurst(x, y, Math.min(200, w * 0.9), 'stone', fxRand(0, 60), 700);
        fxRing(x, y, { color: '#d0703a', size: 170 * p, width: 7, ms: 440 });
        const [sx, sy] = stampPoint(ctx);
        stamp(sx, sy, ctx.crit ? 'MEGA CHOMP!!' : 'SNAP!', { kind: 'rust', size: Math.min(52, 32 + 9 * p), rot: 5, star: ctx.crit ? '#d0703a' : null });
        fxShake(ctx.to, 12, 320); fxShake(ctx.panel, Math.min(22, 8 * p), 360);
        if (ctx.crit) haptic(80);
      });
    },
  };

  // ================= Dragon Breath (x5 + burn): the jade dragon-turtle breathes a stream of fire =================
  CARD_FX['dragon-breath'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landXY(ctx), [w, h] = sizeOf(ctx.win, 120, 180), W = w * 1.05;
      frame(ctx.win, '#3fd18a');
      const hd = fxSpawn(x, y, { cls: 'fxs1-svg fxs1-dragon', html: DRAGON, ms: 1050, size: [W, W * 70 / 110] });
      fxAnimate(hd, [{ transform: 'translate(0, 40px) scale(0.4)', opacity: 0 }, { transform: 'translate(0, -4px) scale(1.05)', opacity: 1, offset: 0.25 },
        { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0.4 }, { transform: 'translate(-3px, 0) scale(1.04, 0.97) rotate(-4deg)', opacity: 1, offset: 0.55 },
        { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0.85 }, { transform: 'translate(0, -16px) scale(0.9)', opacity: 0 }], 1050, 'ease-out');
      // Smoke curls from its nostrils, then a little puff of flame and embers
      const nose = [x + W * 0.39, y - W * 0.06];
      later(300, () => smoke(nose[0], nose[1], 4, { size: 34, spread: 20, dark: false, rise: 60, ms: 800 }));
      later(520, () => {
        const mouth = [x + W * 0.42, y + W * 0.1];
        fxParticles(mouth[0], mouth[1], { count: 8, cls: 'fxs1-fireorb', colors: ['#ff8a1f'], size: [8, 14], spread: 60, angle: 0, cone: 50, ms: 450, spin: 0 });
        embers(mouth[0], mouth[1], { count: 8, spread: 60 });
      });
      plate(ctx, '🔥 DRAGON BREATH', '#3fd18a', '#0a2a1a');
    },
    // The dragon head rears up over the attacker and breathes a roaring stream of fire at you
    windup(ctx) {
      const [x, y] = src(ctx), [tx, ty] = at(ctx), d = dirOf([x, y], [tx, ty]), s = ctx.crit ? 1.25 : 1, W = 110 * s;
      const hx = x + d.ux * 20, hy = y - 30;
      const hd = fxSpawn(hx, hy, { cls: 'fxs1-svg fxs1-dragon', html: DRAGON, ms: 620, size: [W, W * 70 / 110] });
      const r = face(d.ux, d.uy);
      fxAnimate(hd, [{ transform: `${r} scale(0.4)`, opacity: 0 }, { transform: `${r} scale(1.08)`, opacity: 1, offset: 0.15 },
        { transform: `translate(${-d.ux * 8}px, ${-d.uy * 8}px) ${r} scale(1)`, opacity: 1, offset: 0.25 }, { transform: `translate(${d.ux * 6}px, ${d.uy * 6}px) ${r} scale(1.04)`, opacity: 1, offset: 0.75 },
        { transform: `${r} scale(0.9)`, opacity: 0 }], 600, 'ease-out');
      const m = [hx + d.ux * W * 0.4, hy + d.uy * W * 0.4 + W * 0.1];
      later(90, () => {
        fxBeam(m, [tx, ty], { cls: 'fxs1-firebeam', ms: 480, width: 26 * s });
        fxBeam(m, [tx, ty], { cls: 'fxs1-firecore', ms: 420, width: 9 * s });
      });
      for (let i = 0; i < 9; i++) later(70 + i * 22, () => fxFly(m, [tx + fxRand(-26, 26), ty + fxRand(-18, 18)],
        { cls: 'fxs1-fireorb', ms: 230, arc: fxRand(-30, 30), scale: [0.4, 1.6 * s], easing: 'ease-in' }));
      fxShake(ctx.from, 5, 300);
      return wait(360);
    },
    // Fire bursts over you: flames, a heat wave, embers and a scorching word
    impact(ctx) {
      const [x, y] = at(ctx), p = pow(ctx), [w, h] = sizeOf(ctx.to, 200, 46);
      core(x, y, 150 * p, 'fire', 420);
      flames(x, y + h * 0.4, { n: 5 + Math.round(p), w: w * 0.9, h: Math.min(110, 60 * p), ms: 750 });
      heatWave(x, y, Math.min(320, 190 * p));
      embers(x, y, { count: 12, spread: 110 * p });
      sparks(x, y, { count: 10, spread: 130 * p });
      later(200, () => smoke(x, y - h * 0.4, 3, { size: 50 }));
      fxTint(vig('#7a1a00dd'), { ms: 620, opacity: 0.6 });
      const [sx, sy] = stampPoint(ctx);
      stamp(sx, sy, ctx.crit ? 'DRAGONFIRE!!' : 'SCORCH!', { kind: 'fire', size: Math.min(52, 32 + 9 * p), rot: -6, star: ctx.crit ? '#3fd18a' : null });
      fxShake(ctx.panel, Math.min(24, 10 * p), 440); fxShake(ctx.to, 14, 380);
      if (ctx.crit) { flash('#fff3a0', 0.35); haptic(90); }
    },
    // Burn: you catch fire (three flame ticks), with a jade flicker of dragon magic
    gimmick(ctx) {
      RFX.fire.burn(ctx, { word: 'BURNING!' });
      const [x, y] = at(ctx);
      later(120, () => fxRing(x, y, { color: '#3fd18a', size: 220, width: 4, ms: 520 }));
    },
  };

  // ================= Ancient Carapace (wallow: heal + shield): glowing jade hexagon plates lock around the turtle =================
  CARD_FX['ancient-carapace'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landXY(ctx), [w] = sizeOf(ctx.slot || ctx.win, 100, 130), R = w * 0.17;
      frame(ctx.win, '#7affc0', 900);
      // A honeycomb of jade hexagons spreads out from the middle of the card
      const cells = [[0, 0], ...Array.from({ length: 6 }, (_, i) => { const a = (30 + i * 60) * Math.PI / 180; return [Math.cos(a) * R * 1.78, Math.sin(a) * R * 1.78]; })];
      cells.forEach(([cx, cy], i) => later(i ? 90 + i * 45 : 0, () => {
        const el = fxSpawn(x + cx, y + cy, { cls: 'fxs1-svg fxs1-hex', html: HEX, ms: 1000 - i * 40, size: [R * 2, R * 2] });
        fxAnimate(el, [{ transform: 'scale(0) rotate(-60deg)', opacity: 0 }, { transform: 'scale(1.15) rotate(0deg)', opacity: 1, offset: 0.2 },
          { transform: 'scale(1)', opacity: 1, offset: 0.35 }, { transform: 'scale(1)', opacity: 1, offset: 0.8 }, { transform: 'scale(1.08)', opacity: 0 }], 980 - i * 40, 'ease-out');
      }));
      later(420, () => {
        fxRing(x, y, { color: '#7affc0', size: w * 1.6, width: 5, ms: 480 });
        fxParticles(x, y, { count: 10, html: '✦', colors: JADE_COLS, size: [5, 9], spread: 80, ms: 650, spin: 90 });
        glint(ctx.slot);
      });
      plate(ctx, '🐉 ANCIENT CARAPACE', '#7affc0', '#0a2a1a');
    },
    // Wallow: jade hexagon plates fly in and lock around the turtle, it glows and heals, and the shell sets
    gimmick(ctx) {
      const [x, y] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46), n = 8, P = 34;
      const start = ctx.win ? fxPoint(ctx.win) : [x, y + 120];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2, tx = x + Math.cos(a) * w * 0.54, ty = y + Math.sin(a) * (h * 0.5 + 16);
        later(i * 40, () => {
          const el = fxSpawn(start[0], start[1], { cls: 'fxs1-svg fxs1-hex', html: HEX, ms: 1250 - i * 40, size: [P, P] });
          const dx = tx - start[0], dy = ty - start[1], bow = fxRand(-60, 60);
          fxAnimate(el, [{ transform: 'translate(0, 0) scale(0.4) rotate(0deg)', opacity: 0 }, { transform: `translate(${dx * 0.5 + bow}px, ${dy * 0.5}px) scale(0.8) rotate(200deg)`, opacity: 1, offset: 0.14 },
            { transform: `translate(${dx}px, ${dy}px) scale(1.25) rotate(360deg)`, opacity: 1, offset: 0.26 }, { transform: `translate(${dx}px, ${dy}px) scale(1) rotate(360deg)`, opacity: 1, offset: 0.36 },
            { transform: `translate(${dx}px, ${dy}px) scale(1) rotate(360deg)`, opacity: 1, offset: 0.85 }, { transform: `translate(${dx}px, ${dy}px) scale(1.2) rotate(360deg)`, opacity: 0 }], 1210 - i * 40, 'ease-out');
        });
      }
      later(420, () => {
        const wall = fxSpawn(x, y, { cls: 'fxs1-jadewall', ms: 800, size: [w + 36, h + 40] });
        fxAnimate(wall, [{ transform: 'scale(1.25)', opacity: 0 }, { transform: 'scale(0.97)', opacity: 1, offset: 0.25 }, { transform: 'scale(1)', opacity: 1, offset: 0.7 }, { transform: 'scale(1.06)', opacity: 0 }], 800, 'ease-out');
        glint(wall);
        glow(x, y, 'fxs1-jadeglow', [w * 1.3, h * 2.6], 900);
        fxRing(x, y, { color: '#7affc0', size: w + 70, width: 6, ms: 480 });
        jolt(ctx.from, [{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], 300);
        sfx('shield', 0.7, 0.8);
      });
      later(540, () => {
        fxParticles(x, y, { count: 12, html: '✚', colors: ['#7affc0', '#ffd23f', '#d8ffe8'], size: [7, 12], spread: 80, gravity: -90, angle: -90, cone: 140, ms: 900, spin: 0 });
        fxParticles(x, y, { count: 8, html: '✦', colors: JADE_COLS, size: [5, 9], spread: w * 0.5, ms: 700, spin: 90 });
        stamp(x, y + h * 0.5 + 18, '🐉 ANCIENT SHELL!', { kind: 'jade', size: 24, rot: -4, ms: 800 });
      });
    },
  };
})();
