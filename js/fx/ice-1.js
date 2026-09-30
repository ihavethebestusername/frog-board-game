// Card effects: Ice Lake group 1 - the Snow Moth (easy) and Ice Penguin (medium) enemies and their evolutions
// (Blizzard Moth, Aurora Moth Queen / Penguin Commander, Emperor Penguin). See js/card-fx.js for when each hook
// fires and js/fx/region-kit.js (RFX) for the shared frost pieces and themed gimmick defaults these build on.
// Moths: fluttering wings, curling gusts, snowflake shuriken, glittering dust, hypnotic eye-spots, silk cocoons,
// moonlight and aurora curtains. Penguins: belly slides, snowball fights, snow forts, torpedo dives, cozy
// huddles, a marching band and ice fishing. Styles live in css/fx/ice-1.css (every class and keyframe is prefixed fxi1-).
(() => {
  const { clamp, later, wait, at, src, sizeOf, pow, dirOf, jolt, lunge, knock, remember, launchPoint, slam, stampPoint, plate,
    frame, show, glint, speedLines, slash, crackBurst, core, dim, charge, orbit, aimFly, VIG, FLAKE, MOON, CRYSTAL, AURORA_COLS,
    snowflakes, iceShards, sparkle, frostPuff, frostBloom, snowfall, aurora, frost } = RFX;

  // ---------- Graphics (inline SVG / emoji, no image files) ----------
  // One snow-moth wing (the body side is at x = 0) and the fuzzy body; the two wings flap in CSS
  const MOTH_WING = '<svg viewBox="0 0 50 60"><path d="M1 28 C6 6 30 -2 44 6 C54 12 48 26 30 29 Z" fill="#f2f9ff" stroke="#5a7fc8" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<path d="M1 31 C16 31 34 36 33 48 C32 58 16 58 3 40 Z" fill="#dcebff" stroke="#5a7fc8" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<path d="M8 24 C14 14 28 8 38 11" fill="none" stroke="#bfd8ff" stroke-width="2"/><circle cx="33" cy="16" r="5" fill="#bfe6ff" stroke="#7ab8ff" stroke-width="1.5"/>' +
    '<circle cx="20" cy="44" r="3.5" fill="#bfe6ff"/><circle cx="42" cy="12" r="1.8" fill="#fff"/></svg>';
  const MOTH_BODY = '<svg viewBox="0 0 20 60"><path d="M10 12 Q4 2 -3 0 M10 12 Q16 2 23 0" fill="none" stroke="#5a7fc8" stroke-width="2" stroke-linecap="round"/>' +
    '<ellipse cx="10" cy="34" rx="6" ry="18" fill="#fff" stroke="#5a7fc8" stroke-width="2.5"/><circle cx="10" cy="15" r="6" fill="#fff" stroke="#5a7fc8" stroke-width="2.5"/>' +
    '<circle cx="7.8" cy="14" r="1.6" fill="#1a2a4a"/><circle cx="12.2" cy="14" r="1.6" fill="#1a2a4a"/><path d="M6 30 H14 M6 36 H14 M7 42 H13" stroke="#cfe0f5" stroke-width="2"/></svg>';
  const MOTH = `<i class="fxi1-moth-in"><i class="fxi1-wing fxi1-wl">${MOTH_WING}</i><i class="fxi1-wing fxi1-wr">${MOTH_WING}</i>` +
    `<i class="fxi1-mbody">${MOTH_BODY}</i></i>`;

  // A gust of wind pointing right: curly streaks behind a bright crescent (outline under a white core)
  const GUST = '<svg viewBox="0 0 110 60">' + [['#5a9ae0', 8], ['#ffffff', 3.5]].map(([c, w]) =>
    `<g fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"><path d="M8 16 H62 Q74 16 74 8 Q74 2 67 3"/><path d="M0 30 H80"/>` +
    '<path d="M12 44 H58 Q70 44 70 51 Q70 57 63 56"/></g>').join('') +
    '<path d="M84 4 Q112 30 84 56 Q98 30 84 4 Z" fill="#ffffff" stroke="#5a9ae0" stroke-width="2.5" stroke-linejoin="round"/></svg>';
  // A frosty swirl curl
  const SWIRL = '<svg viewBox="-50 -50 100 100">' + [['#5a9ae0', 8], ['#eaf6ff', 3.5]].map(([c, w]) =>
    `<path d="M0 0 C8 -8 20 -2 18 10 C16 24 -4 28 -14 18 C-26 6 -18 -18 2 -24 C22 -30 40 -16 42 4" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`).join('') + '</svg>';
  // A six-bladed snowflake shuriken
  const SHURIKEN = (() => {
    const pts = [];
    for (let i = 0; i < 12; i++) { const r = i % 2 ? 15 : 47, a = (i * 30 - 90) * Math.PI / 180; pts.push((Math.cos(a) * r).toFixed(1) + ',' + (Math.sin(a) * r).toFixed(1)); }
    return `<svg viewBox="-50 -50 100 100"><polygon points="${pts.join(' ')}" fill="#dff4ff" stroke="#1f5fbf" stroke-width="4" stroke-linejoin="round"/>` +
      [0, 60, 120].map(a => `<path transform="rotate(${a})" d="M0 -34 V34" stroke="#fff" stroke-width="3"/>`).join('') +
      '<circle r="10" fill="#7ab8ff" stroke="#1f5fbf" stroke-width="3"/><circle r="3.5" fill="#fff"/></svg>';
  })();
  // A hypnotic double spiral (lilac and white stripes on a dark disc)
  const spiralPts = a0 => {
    const pts = [];
    for (let i = 0; i <= 64; i++) { const t = i / 64, a = a0 + t * Math.PI * 6.4, r = 3 + t * 44; pts.push((Math.cos(a) * r).toFixed(1) + ',' + (Math.sin(a) * r).toFixed(1)); }
    return pts.join(' ');
  };
  const SPIRAL = '<svg viewBox="-50 -50 100 100"><circle r="49" fill="#2a0a5a88"/>' +
    `<polyline points="${spiralPts(0)}" fill="none" stroke="#c89bff" stroke-width="5.5" stroke-linecap="round"/>` +
    `<polyline points="${spiralPts(Math.PI)}" fill="none" stroke="#f4ecff" stroke-width="5.5" stroke-linecap="round"/><circle r="5" fill="#fff"/></svg>`;
  // Eye spots: dark ring, gold, ice-blue iris, pupil and a shine
  const eyeSpot = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#3a1a6a"/><circle cx="${cx}" cy="${cy}" r="${r * 0.74}" fill="#ffd23f"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r * 0.5}" fill="#7ae0ff"/><circle cx="${cx}" cy="${cy}" r="${r * 0.24}" fill="#1a0a3a"/>` +
    `<circle cx="${cx - r * 0.25}" cy="${cy - r * 0.3}" r="${r * 0.16}" fill="#fff"/>`;
  const EYE = `<svg viewBox="-50 -50 100 100">${eyeSpot(0, 0, 46)}</svg>`;
  // The Blizzard Moth's giant wings with glowing eye spots (right half drawn once, mirrored for the left)
  const HWING = '<path d="M0 -4 C14 -56 70 -74 94 -46 C108 -28 86 -2 6 0 Z" fill="#dbe6ff" stroke="#2a1a6a" stroke-width="3.5" stroke-linejoin="round"/>' +
    '<path d="M6 -8 C22 -44 60 -58 84 -44" fill="none" stroke="#9fb8ff" stroke-width="3"/>' +
    '<path d="M2 4 C40 4 82 20 76 50 C70 72 32 66 4 18 Z" fill="#c8d6ff" stroke="#2a1a6a" stroke-width="3.5" stroke-linejoin="round"/>' +
    eyeSpot(56, -34, 15) + eyeSpot(44, 34, 11) + '<circle cx="86" cy="-44" r="3" fill="#fff"/><circle cx="68" cy="56" r="2.5" fill="#fff"/>';
  const HYPNO_WINGS = `<svg viewBox="-100 -75 200 150"><g>${HWING}</g><g transform="scale(-1,1)">${HWING}</g>` +
    '<path d="M-3 -34 Q-12 -60 -26 -62 M3 -34 Q12 -60 26 -62" fill="none" stroke="#2a1a6a" stroke-width="3" stroke-linecap="round"/>' +
    '<ellipse cx="0" cy="4" rx="8" ry="34" fill="#f4f0ff" stroke="#2a1a6a" stroke-width="3.5"/><circle cy="-32" r="8" fill="#f4f0ff" stroke="#2a1a6a" stroke-width="3.5"/>' +
    '<circle cx="-3" cy="-33" r="2" fill="#2a1a6a"/><circle cx="3" cy="-33" r="2" fill="#2a1a6a"/></svg>';
  // A silk cocoon, wrapped round and round
  const COCOON = '<svg viewBox="0 0 60 90"><path d="M30 0 V10" stroke="#dfe9f5" stroke-width="2"/>' +
    '<ellipse cx="30" cy="48" rx="24" ry="38" fill="#f6fbff" stroke="#7aa6d6" stroke-width="3"/>' +
    '<g fill="none" stroke="#c4d8ef" stroke-width="2.5" stroke-linecap="round"><path d="M9 26 Q30 38 51 24"/><path d="M6 42 Q30 30 54 44"/>' +
    '<path d="M6 56 Q30 68 54 54"/><path d="M10 70 Q30 60 50 72"/></g><path d="M16 22 Q11 40 16 62" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>' +
    '<circle cx="42" cy="20" r="2.2" fill="#bfe6ff"/><circle cx="46" cy="64" r="1.8" fill="#bfe6ff"/></svg>';
  // A crescent slash of moonlight
  const CRESCENT = '<svg viewBox="-50 -50 100 100"><path d="M-44 16 Q0 46 44 -30 Q4 24 -44 16 Z" fill="#fffbe6" stroke="#c9a53a" stroke-width="2.5" stroke-linejoin="round"/></svg>';

  // A cute penguin, front view (hat: the Commander's cap, crown: the Emperor, salute: leave the right flipper off
  // so a separate one can swing up to the cap)
  function penguin({ hat = false, crown = false, salute = false } = {}) {
    const flip = d => `<path d="${d}" fill="#1d2533" stroke="#0a0f18" stroke-width="2" stroke-linejoin="round"/>`;
    return '<svg viewBox="0 0 60 80">' + flip('M10 40 Q-1 54 5 66 Q13 58 14 46 Z') + (salute ? '' : flip('M50 40 Q61 54 55 66 Q47 58 46 46 Z')) +
      '<ellipse cx="30" cy="46" rx="21" ry="29" fill="#1d2533" stroke="#0a0f18" stroke-width="3"/>' +
      '<path d="M30 24 C44 24 46 40 45 52 C44 66 38 72 30 72 C22 72 16 66 15 52 C14 40 16 24 30 24 Z" fill="#ffffff"/>' +
      (crown ? '<path d="M15 32 Q10 40 15 48 Q19 40 18 32 Z" fill="#ffc83a"/><path d="M45 32 Q50 40 45 48 Q41 40 42 32 Z" fill="#ffc83a"/>' : '') +
      '<circle cx="24" cy="31" r="3.4" fill="#0a0f18"/><circle cx="36" cy="31" r="3.4" fill="#0a0f18"/><circle cx="25" cy="30" r="1.2" fill="#fff"/><circle cx="37" cy="30" r="1.2" fill="#fff"/>' +
      '<path d="M25 36 L35 36 L30 42 Z" fill="#ff9a1f" stroke="#b35a00" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<circle cx="19" cy="38" r="3" fill="#ff9ab8" opacity=".8"/><circle cx="41" cy="38" r="3" fill="#ff9ab8" opacity=".8"/>' +
      '<ellipse cx="22" cy="75" rx="7" ry="3.5" fill="#ff9a1f" stroke="#b35a00" stroke-width="1.5"/><ellipse cx="38" cy="75" rx="7" ry="3.5" fill="#ff9a1f" stroke="#b35a00" stroke-width="1.5"/>' +
      (hat ? '<path d="M13 19 Q30 2 47 19 Z" fill="#23407a" stroke="#0a1a3a" stroke-width="2"/><rect x="11" y="17" width="38" height="6" rx="3" fill="#10204a"/><circle cx="30" cy="12" r="3.2" fill="#ffd23f"/>' : '') +
      (crown ? '<path d="M17 21 L19 6 L25 13 L30 3 L35 13 L41 6 L43 21 Z" fill="#ffd23f" stroke="#8a5a00" stroke-width="2" stroke-linejoin="round"/><circle cx="30" cy="15" r="2.2" fill="#e0162b"/>' : '') +
      '</svg>';
  }
  const PENG = penguin(), PENG_EMP = penguin({ crown: true });
  // The Commander's saluting flipper (pivots at its top)
  const FLIPPER = '<svg viewBox="0 0 12 24"><path d="M6 1 Q13 9 9 23 Q3 17 2 7 Q2 1 6 1 Z" fill="#1d2533" stroke="#0a0f18" stroke-width="2" stroke-linejoin="round"/></svg>';
  // A penguin lying on its belly, pointing right (sliding / torpedo-diving)
  function slider({ hat = false } = {}) {
    return '<svg viewBox="0 0 104 44">' +
      '<ellipse cx="9" cy="26" rx="7" ry="3.5" fill="#ff9a1f" stroke="#b35a00" stroke-width="1.5" transform="rotate(-25 9 26)"/>' +
      '<ellipse cx="8" cy="32" rx="7" ry="3.5" fill="#ff9a1f" stroke="#b35a00" stroke-width="1.5" transform="rotate(15 8 32)"/>' +
      '<ellipse cx="50" cy="24" rx="40" ry="15" fill="#1d2533" stroke="#0a0f18" stroke-width="3"/>' +
      '<path d="M16 28 Q50 44 86 28 Q84 36 50 38 Q20 38 16 28 Z" fill="#ffffff"/>' +
      '<circle cx="80" cy="20" r="13" fill="#1d2533" stroke="#0a0f18" stroke-width="3"/><ellipse cx="84" cy="21" rx="7" ry="6" fill="#fff"/>' +
      '<circle cx="86" cy="19" r="2.6" fill="#0a0f18"/><circle cx="87" cy="18" r="0.9" fill="#fff"/>' +
      '<path d="M92 20 L103 23 L92 26 Z" fill="#ff9a1f" stroke="#b35a00" stroke-width="1.5" stroke-linejoin="round"/><circle cx="82" cy="27" r="2.4" fill="#ff9ab8" opacity=".8"/>' +
      '<path d="M52 14 Q34 2 18 6 Q32 12 42 22 Z" fill="#1d2533" stroke="#0a0f18" stroke-width="2" stroke-linejoin="round"/>' +
      (hat ? '<path d="M70 10 Q80 -2 92 9 Z" fill="#23407a" stroke="#0a1a3a" stroke-width="2"/><rect x="68" y="8" width="26" height="4" rx="2" fill="#10204a"/><circle cx="81" cy="4.5" r="2" fill="#ffd23f"/>' : '') +
      '</svg>';
  }
  const SLIDER = slider(), TORPEDO = slider({ hat: true });
  // A snowman with a scarf, top hat and carrot nose
  const SNOWMAN = '<svg viewBox="0 0 60 90"><path d="M14 40 L2 30 M46 40 L58 28 M5 33 L2 26 M55 31 L58 24" stroke="#6b4423" stroke-width="3" stroke-linecap="round"/>' +
    '<circle cx="30" cy="68" r="20" fill="#fff" stroke="#8fb8e0" stroke-width="3"/><circle cx="30" cy="40" r="14" fill="#fff" stroke="#8fb8e0" stroke-width="3"/>' +
    '<circle cx="30" cy="42" r="2" fill="#2a2a3a"/><circle cx="30" cy="49" r="2" fill="#2a2a3a"/><circle cx="30" cy="62" r="2.4" fill="#2a2a3a"/>' +
    '<circle cx="30" cy="18" r="11" fill="#fff" stroke="#8fb8e0" stroke-width="3"/>' +
    '<rect x="17" y="27" width="26" height="6" rx="3" fill="#e0162b"/><path d="M36 30 L40 42 L34 41 Z" fill="#e0162b"/>' +
    '<circle cx="26" cy="16" r="1.8" fill="#2a2a3a"/><circle cx="34" cy="16" r="1.8" fill="#2a2a3a"/><path d="M30 19 L40 22 L30 22 Z" fill="#ff8a1f"/>' +
    '<rect x="21" y="0" width="18" height="10" rx="1" fill="#2a2a3a"/><rect x="17" y="8" width="26" height="3.5" rx="1.5" fill="#2a2a3a"/></svg>';
  // A white snowball splat with flecks
  const SPLAT = '<svg viewBox="-50 -50 100 100"><path d="M-30 -8 Q-38 -30 -16 -26 Q-10 -44 8 -34 Q26 -42 28 -22 Q46 -16 34 2 Q44 20 24 22 Q22 42 4 32 Q-4 48 -16 30 Q-40 34 -30 12 Q-46 4 -30 -8 Z" fill="#ffffff" stroke="#a8c8ea" stroke-width="3" stroke-linejoin="round"/>' +
    '<g fill="#fff" stroke="#a8c8ea" stroke-width="2"><circle cx="-40" cy="-30" r="5"/><circle cx="42" cy="-30" r="4"/><circle cx="-6" cy="44" r="4"/></g>' +
    '<path d="M-12 -14 Q-4 -20 6 -16" fill="none" stroke="#e6f2ff" stroke-width="4" stroke-linecap="round"/></svg>';
  // A snow brick (the fort's building block) and the fort's little flag
  const BRICK = '<svg viewBox="0 0 30 18"><rect x="1.5" y="1.5" width="27" height="15" rx="3" fill="#ffffff" stroke="#6f9bd0" stroke-width="2.5"/><rect x="4" y="11" width="22" height="3" rx="1.5" fill="#d6e8fb"/></svg>';
  const FLAG = '<svg viewBox="0 0 30 40"><rect x="3" y="4" width="3" height="36" rx="1.5" fill="#6b4423"/><path d="M6 5 L28 11 L6 18 Z" fill="#2a8ae0" stroke="#10306a" stroke-width="1.5" stroke-linejoin="round"/>' +
    '<path d="M12 11 H18 M15 8 V14" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><circle cx="4.5" cy="4" r="2.6" fill="#ffd23f"/></svg>';
  // A splash crown of water
  const SPLASH = '<svg viewBox="-50 -42 100 52"><path d="M-44 8 Q-40 -10 -34 -2 Q-30 -30 -20 -8 Q-12 -38 -4 -10 Q4 -40 10 -10 Q20 -34 24 -6 Q32 -24 36 -2 Q42 -12 44 8 Z" fill="#7ac8ff" stroke="#1f5fbf" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M-30 4 Q0 -4 30 4" stroke="#dff4ff" stroke-width="3" fill="none" stroke-linecap="round"/>' +
    '<g fill="#7ac8ff" stroke="#1f5fbf" stroke-width="2"><circle cx="-26" cy="-32" r="4"/><circle cx="16" cy="-38" r="3.5"/><circle cx="34" cy="-26" r="3"/></g></svg>';
  // An orange webbed penguin foot, toes up
  const FOOT = '<svg viewBox="-30 -34 60 64"><path d="M0 26 C-10 26 -14 14 -16 4 L-26 -22 Q-20 -26 -14 -18 L-6 -6 L-4 -30 Q0 -34 4 -30 L6 -6 L14 -18 Q20 -26 26 -22 L16 4 C14 14 10 26 0 26 Z" fill="#ff9a1f" stroke="#8a4a00" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M-12 -2 L-4 10 M12 -2 L4 10 M0 -20 V8" stroke="#ffc36a" stroke-width="2.5" stroke-linecap="round"/></svg>';
  // A fishing rod with its line and a red-and-white bobber (the bobber sits at 58,60 of 70x80)
  const ROD = '<svg viewBox="0 0 70 80"><path d="M20 62 L58 8" stroke="#3a2a1a" stroke-width="3" stroke-linecap="round"/><path d="M8 76 L20 62" stroke="#8b5a2b" stroke-width="7" stroke-linecap="round"/>' +
    '<circle cx="19" cy="66" r="5" fill="#9aa4b0" stroke="#3a3a4a" stroke-width="2"/><path d="M58 8 V55" stroke="#eaf6ff" stroke-width="1.5"/>' +
    '<circle cx="58" cy="60" r="5" fill="#fff" stroke="#3a2a1a" stroke-width="1.5"/><path d="M53 60 A5 5 0 0 1 63 60 Z" fill="#e0162b" stroke="#3a2a1a" stroke-width="1.5"/></svg>';
  // A shiny fish hook
  const HOOK = '<svg viewBox="0 0 30 44"><circle cx="15" cy="4" r="3" fill="none" stroke="#3a4a5a" stroke-width="2.5"/>' +
    '<path d="M15 7 V28 Q15 40 7 38 Q1 36 3 28" fill="none" stroke="#3a4a5a" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="M15 7 V28 Q15 40 7 38 Q1 36 3 28" fill="none" stroke="#e6eef5" stroke-width="3" stroke-linecap="round"/><path d="M3 28 L0 21 L7 25 Z" fill="#e6eef5" stroke="#3a4a5a" stroke-width="1.5"/></svg>';

  const NIGHT = 'radial-gradient(ellipse at 50% 40%, #0000 25%, #0a0f3add 100%)';
  const NIGHT_SKY = ['12% 18%', '78% 12%', '34% 8%', '88% 36%', '60% 24%', '22% 42%', '48% 6%'].map((p, i) =>
    `radial-gradient(circle at ${p}, #fff 0 ${i % 2 ? 1 : 1.6}px, #0000 ${i % 2 ? 2 : 2.6}px)`).join(', ') + ', linear-gradient(#0a0f3add, #1a0a3aaa 55%, #0a0f3a66)';
  const ICE_BLUE = ['#ffffff', '#dff4ff', '#bfe6ff'];

  // ---------- Small helpers ----------
  const landAt = ctx => fxPoint(ctx.slot || ctx.win);                                    // the card that just landed
  const faceX = (a, b) => (b[0] < a[0] ? -1 : 1);                                         // +1 when b is right of a
  const mirror = (html, dir) => (dir < 0 ? `<i class="fxi1-mirror">${html}</i>` : html);  // face a right-facing graphic left
  const flipV = (html, on) => (on ? `<i class="fxi1-flipv">${html}</i>` : html);          // keep it upright when aimFly turns it round

  // Spawn a graphic and play one keyframe track on it (it removes itself when done)
  function play(x, y, html, frames, ms, { cls = 'fxi1-svg', size = null, easing = 'ease-out', style = {} } = {}) {
    const el = fxSpawn(x, y, { cls, html, ms: ms + 40, size, style });
    fxAnimate(el, frames, ms, easing);
    return el;
  }
  // A thread / line drawn out from a to b, held, then faded (fishing line, silk)
  function strand(a, b, { cls = 'fxi1-silk', ms = 700, width = 3, grow = 0.25, hold = 0.75 } = {}) {
    const d = dirOf(a, b);
    const el = fxSpawn(a[0], a[1], { cls: 'fx-beam ' + cls, ms, style: { width: d.len + 'px', height: width + 'px', transformOrigin: '0 50%' } });
    const tf = s => `translate(0, -50%) rotate(${d.ang}deg) scaleX(${s})`;
    el?.animate([{ transform: tf(0), opacity: 1 }, { transform: tf(1), opacity: 1, offset: grow }, { transform: tf(1), opacity: 1, offset: hold },
      { transform: tf(1), opacity: 0 }], { duration: ms, easing: 'ease-out', fill: 'forwards' });
  }
  // Fly along any path: pt(t) is the point at t = 0..1, rot(t) an extra tilt. Drops an optional trail. Resolves on arrival.
  function flyPath(pt, { html = '', cls = '', ms = 320, spin = 0, scale = [1, 1], size = null, trail = '', trailEvery = 30, easing = 'linear', steps = 12, rot = null } = {}) {
    const [x0, y0] = pt(0), el = fxSpawn(x0, y0, { cls, html, ms: ms + 60, size });
    if (!el) return Promise.resolve();
    const frames = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, [x, y] = pt(t);
      frames.push({ transform: `translate(${x - x0}px, ${y - y0}px) rotate(${(rot ? rot(t) : 0) + spin * t}deg) scale(${scale[0] + (scale[1] - scale[0]) * t})` });
    }
    if (trail) for (let k = 1; k * trailEvery < ms; k++) later(k * trailEvery, () => { const [x, y] = pt(k * trailEvery / ms); fxSpawn(x, y, { cls: trail, ms: 420 }); });
    return fxAnimate(el, frames, ms, easing).then(() => el.remove());
  }
  // A high lob from a to b (peak `h` px above the straight line)
  const lobPt = (a, b, h) => t => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - h * 4 * t * (1 - t)];

  // ---------- Frost-moth pieces ----------
  // A frosty swirl curl spinning open
  function swirl(x, y, size, dir = 1, ms = 620) {
    play(x, y, SWIRL, [{ transform: 'scale(0.2) rotate(0deg)', opacity: 0 }, { transform: `scale(0.8) rotate(${dir * 120}deg)`, opacity: 1, offset: 0.3 },
      { transform: `scale(1.25) rotate(${dir * 320}deg)`, opacity: 0 }], ms, { cls: 'fxi1-svg fxi1-swirl', size: [size, size] });
  }
  // A four-point star twinkling in and out
  function twinkle(x, y, size = 16, color = '#fff6c8', ms = 600) {
    play(x, y, '✦', [{ transform: 'scale(0) rotate(0deg)', opacity: 0 }, { transform: 'scale(1.3) rotate(45deg)', opacity: 1, offset: 0.4 },
      { transform: 'scale(0) rotate(90deg)', opacity: 0 }], ms, { cls: 'fxi1-star', style: { fontSize: size + 'px', color } });
  }
  // Glittering frost dust: tiny diamonds in ice blue and lilac
  const glitter = (x, y, { count = 10, spread = 80, gravity = 30, ms = 700, angle = 0, cone = 360, size = [3, 6] } = {}) =>
    fxParticles(x, y, { count, html: i => (i % 3 ? '◆' : '✦'), colors: ['#7ae0ff', '#c9a8ff', '#ffffff', '#b3f0ff'], size, spread, gravity, ms, angle, cone, spin: 180, cls: 'fxi1-glit' });
  // A puff of glittering blue dust
  function dustPuff(x, y, size = 70, ms = 700) {
    play(x, y, '', [{ transform: 'scale(0.3) rotate(0deg)', opacity: 0 }, { transform: 'scale(1) rotate(40deg)', opacity: 0.95, offset: 0.3 },
      { transform: 'scale(1.5) rotate(90deg)', opacity: 0 }], ms, { cls: 'fxi1-dustcloud', size: [size, size] });
  }
  // A hypnotic spiral turning over a point
  function hypno(x, y, size, ms = 900, turns = 1.6, cls = '') {
    play(x, y, SPIRAL, [{ transform: 'scale(0.2) rotate(0deg)', opacity: 0 }, { transform: `scale(1) rotate(${turns * 110}deg)`, opacity: 0.95, offset: 0.25 },
      { transform: `scale(1.05) rotate(${turns * 300}deg)`, opacity: 0.9, offset: 0.75 }, { transform: `scale(1.25) rotate(${turns * 360}deg)`, opacity: 0 }],
    ms, { cls: 'fxi1-svg fxi1-spiral ' + cls, size: [size, size], easing: 'linear' });
  }
  // A tall aurora curtain hanging down and rippling (i picks its colours)
  function curtain(x, y, w, h, i, ms = 1100) {
    play(x, y, '', [{ transform: 'scaleY(0.2) skewX(-14deg)', opacity: 0 }, { transform: 'scaleY(1) skewX(12deg)', opacity: 0.9, offset: 0.3 },
      { transform: 'translateX(6px) scaleY(1.05) skewX(-10deg)', opacity: 0.85, offset: 0.62 }, { transform: 'translateX(-4px) scaleY(1.12) skewX(8deg)', opacity: 0 }],
    ms, { cls: 'fxi1-curtain fxi1-curtain-' + (i % 3), size: [w, h], easing: 'ease-in-out', style: { transformOrigin: '50% 0' } });
  }

  // ---------- Penguin pieces ----------
  // A little penguin waddles from a to b (rocking, with tiny hops), squeezes in and rocks there
  function waddle(a, b, { html = PENG, size = [24, 32], ms = 1100, walk = 0.45, steps = 6 } = {}) {
    const dx = b[0] - a[0], dy = b[1] - a[1], frames = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      frames.push({ transform: `translate(${dx * t}px, ${dy * t - (i % 2 ? 5 : 0)}px) rotate(${i === steps ? 0 : i % 2 ? 11 : -11}deg)`, opacity: i === 0 ? 0 : 1, offset: t * walk });
    }
    frames.push({ transform: `translate(${dx}px, ${dy}px) scale(1.15, 0.88)`, opacity: 1, offset: walk + 0.08 });
    frames.push({ transform: `translate(${dx}px, ${dy}px) scale(1)`, opacity: 1, offset: walk + 0.16 });
    frames.push({ transform: `translate(${dx}px, ${dy - 3}px) rotate(-5deg)`, opacity: 1, offset: 0.72 });
    frames.push({ transform: `translate(${dx}px, ${dy}px) rotate(5deg)`, opacity: 1, offset: 0.86 });
    frames.push({ transform: `translate(${dx}px, ${dy}px) scale(0.85)`, opacity: 0 });
    play(a[0], a[1], html, frames, ms, { cls: 'fxi1-svg fxi1-peng', size, easing: 'linear' });
  }
  // A snowball splat that slides slowly down the victim
  function splat(x, y, size, ms = 1000) {
    const r = fxRand(-40, 40);
    play(x, y, SPLAT, [{ transform: `scale(0.3) rotate(${r}deg)`, opacity: 0 }, { transform: `scale(1.15) rotate(${r}deg)`, opacity: 1, offset: 0.1 },
      { transform: `scale(1) rotate(${r}deg)`, opacity: 1, offset: 0.22 }, { transform: `translate(0, 12px) scale(0.96, 1.08) rotate(${r}deg)`, opacity: 1, offset: 0.78 },
      { transform: `translate(0, 22px) scale(0.9, 1.15) rotate(${r}deg)`, opacity: 0 }], ms, { cls: 'fxi1-svg fxi1-splat', size: [size, size] });
  }
  // A penguin footprint stamped onto a spot
  function footprint(x, y, rot, size, ms = 760) {
    play(x, y, FOOT, [{ transform: `scale(2.2) rotate(${rot}deg)`, opacity: 0 }, { transform: `scale(0.92) rotate(${rot}deg)`, opacity: 1, offset: 0.14 },
      { transform: `scale(1) rotate(${rot}deg)`, opacity: 1, offset: 0.7 }, { transform: `scale(1.05) rotate(${rot}deg)`, opacity: 0 }], ms, { cls: 'fxi1-svg fxi1-foot', size: [size, size * 1.07] });
  }
  // Water droplets flung up and falling back
  const drops = (x, y, { count = 12, spread = 110, gravity = 140, ms = 700, angle = -90, cone = 140, size = [5, 9] } = {}) =>
    fxParticles(x, y, { count, cls: 'fxi1-drop', colors: ['#4aa8ff'], size, spread, gravity, ms, angle, cone, spin: 0 });
  // Bubbles rising from a point
  function bubbles(x, y, n = 4, { spread = 30, rise = 60, ms = 700 } = {}) {
    for (let i = 0; i < n; i++) later(i * 70, () => {
      const s = fxRand(8, 15);
      play(x + fxRand(-spread, spread), y, '', [{ transform: 'translate(0, 0) scale(0.4)', opacity: 0 }, { transform: `translate(${fxRand(-6, 6)}px, ${-rise * 0.4}px) scale(1)`, opacity: 1, offset: 0.35 },
        { transform: `translate(${fxRand(-10, 10)}px, ${-rise}px) scale(1.15)`, opacity: 0 }], ms, { cls: 'fxi1-bubble', size: [s, s] });
    });
  }
  // A splash crown bursting up at a base point
  function splashCrown(x, y, w, ms = 620) {
    play(x, y - w * 0.2, SPLASH, [{ transform: 'scale(0.3, 0.1)', opacity: 0 }, { transform: 'scale(1.05, 1.1)', opacity: 1, offset: 0.25 },
      { transform: 'scale(1.15, 0.9)', opacity: 0.9, offset: 0.6 }, { transform: 'scale(1.25, 0.6)', opacity: 0 }], ms, { cls: 'fxi1-svg fxi1-splash', size: [w, w * 0.52], style: { transformOrigin: '50% 100%' } });
  }
  // A flat ripple ring spreading out on water
  function ripple(x, y, w, ms = 600) {
    play(x, y, '', [{ transform: 'scale(0.2)', opacity: 1 }, { transform: 'scale(1)', opacity: 0 }], ms, { cls: 'fxi1-ripple', size: [w, w * 0.34], easing: 'cubic-bezier(.1,.8,.3,1)' });
  }

  // ================= Wing Gust (x3): the Snow Moth beats up a curling gust of icy wind =================
  CARD_FX['wing-gust'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landAt(ctx);
      frame(ctx.win, '#bfe6ff', 750);
      glint(ctx.slot);
      // The moth flutters up out of the card in a zigzag, frosty swirls curling round it
      play(x, y, MOTH, [
        { transform: 'translate(0, 12px) scale(0.3) rotate(0deg)', opacity: 0 },
        { transform: 'translate(-16px, -26px) scale(1) rotate(-14deg)', opacity: 1, offset: 0.22 },
        { transform: 'translate(14px, -54px) scale(1.05) rotate(12deg)', opacity: 1, offset: 0.46 },
        { transform: 'translate(-10px, -84px) scale(1) rotate(-10deg)', opacity: 1, offset: 0.7 },
        { transform: 'translate(22px, -120px) scale(0.8) rotate(8deg)', opacity: 0 },
      ], 1000, { cls: 'fxi1-moth', size: [70, 56], easing: 'ease-in-out' });
      [[-30, 14, 1], [30, -18, -1], [-8, -56, 1]].forEach(([ox, oy, d], i) => later(80 + i * 130, () => swirl(x + ox, y + oy, 58, d)));
      later(200, () => snowflakes(x, y - 20, { count: 6, spread: 80, gravity: -20, angle: -90, cone: 160, size: [12, 20] }));
      plate(ctx, '🌬️ WING GUST', '#9fd8ff');
    },
    // Three curly gusts sweep out of the wheel on a bending path, carrying snowflakes
    windup(ctx) {
      const to = at(ctx), from = launchPoint(ctx), s = ctx.crit ? 1.25 : 1;
      return Promise.all([0, 1, 2].map(i => wait(i * 55).then(() => aimFly([from[0] + (i - 1) * 14, from[1]], [to[0] + (i - 1) * 16, to[1] + (i - 1) * 8], {
        html: GUST, cls: 'fxi1-svg fxi1-gust', ms: 290, arc: 50 + i * 22, scale: [0.45, (1.05 - i * 0.12) * s],
        trail: i === 1 ? 'fxi1-trail-flake' : '', trailEvery: 28, easing: 'cubic-bezier(.3,0,.7,1)' }))));
    },
    // WHOOSH: frost swirls spin open, wind streaks rush past, snowflakes scatter and the victim is blown back
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit, d = dirOf(launchPoint(ctx), [tx, ty]);
      [[0, 0, 1], [-24, 10, -1], [22, -12, 1]].forEach(([ox, oy, dd], i) => later(i * 70, () => swirl(tx + ox, ty + oy, (80 + i * 26) * p, dd, 620)));
      fxRing(tx, ty, { color: '#ffffff', size: 150 * p, width: 6, ms: 420 });
      later(60, () => fxRing(tx, ty, { color: '#7ab8ff', size: 220 * p, width: 4, ms: 520 }));
      for (let i = -2; i <= 2; i++) {
        const o = i * 15, back = 70 + Math.abs(i) * 16, fwd = 90 + 40 * p - Math.abs(i) * 12;
        later(Math.abs(i) * 30, () => fxBeam([tx - d.ux * back + d.nx * o, ty - d.uy * back + d.ny * o], [tx + d.ux * fwd + d.nx * o, ty + d.uy * fwd + d.ny * o], { cls: 'fxi1-windline', ms: 380, width: 3 }));
      }
      snowflakes(tx, ty, { count: 10, spread: 140 * p, gravity: 20, angle: d.ang, cone: 140, size: [14, 26] });
      frostPuff(tx, ty, 3, { size: 50 * Math.min(1.5, p), spread: 60 });
      knock(ctx.to, src(ctx), 16 + 8 * p, 400);
      const [sx, sy] = stampPoint(ctx);
      slam(sx, sy, crit ? 'GALE FORCE!!' : 'WHOOSH!', { kind: 'snow', size: crit ? 40 : Math.min(54, 30 + 10 * p), rotate: -6, ms: 850 });
      fxTint(VIG.frost, { ms: 420, opacity: crit ? 0.5 : 0.3 });
      fxShake(ctx.panel, Math.min(18, 8 * p), 340);
    },
  };

  // ================= Snowflake Swirl (x2, frenzy: 3 strikes): a blizzard of snowflake shuriken =================
  CARD_FX['snowflake-swirl'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landAt(ctx);
      frame(ctx.win, '#dff4ff', 750);
      glint(ctx.slot);
      // Snowflakes spiral up out of the card, widening as they rise
      for (let i = 0; i < 7; i++) {
        const a0 = (i / 7) * 360, frames = [];
        for (let k = 0; k <= 8; k++) {
          const t = k / 8, a = (a0 + t * 430) * Math.PI / 180, r = 6 + 52 * t;
          frames.push({ transform: `translate(${Math.cos(a) * r}px, ${Math.sin(a) * r * 0.42 - 120 * t}px) rotate(${t * 360}deg) scale(${0.5 + 0.7 * t})`, opacity: k === 0 || k === 8 ? 0 : 1 });
        }
        later(i * 40, () => play(x, y + 10, FLAKE, frames, 900, { cls: 'fxr-flake', size: [18, 18], easing: 'linear' }));
      }
      later(120, () => fxRing(x, y, { color: '#bfe6ff', size: 130, width: 5, ms: 420 }));
      later(160, () => slam(x, y - 20, '×3', { kind: 'snow', size: 40, rotate: -8, ms: 700 }));
      plate(ctx, '❄️ SNOWFLAKE SWIRL', '#dff4ff');
    },
    // Frenzy (before the strikes): a blizzard whirls up and a ring of snowflakes spins in round the moth
    gimmick(ctx) {
      const [x, y] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46);
      frost.frenzy(ctx, { word: 'FLURRY ×3!', html: () => `<i class="fxi1-shuri-o">${SHURIKEN}</i>` });
      for (let i = 0; i < 8; i++) {
        const a0 = (i / 8) * 360, frames = [];
        for (let k = 0; k <= 10; k++) {
          const t = k / 10, e = 1 - (1 - Math.min(1, t / 0.55)) ** 2, rad = w * 1.3 + (w * 0.64 - w * 1.3) * e, a = (a0 + t * 420) * Math.PI / 180;
          frames.push({ transform: `translate(${Math.cos(a) * rad}px, ${Math.sin(a) * rad * 0.45}px) rotate(${t * 540}deg) scale(${0.6 + 0.5 * e})`, opacity: k === 0 || k === 10 ? 0 : 1 });
        }
        play(x, y, FLAKE, frames, 1050, { cls: 'fxr-flake', size: [22, 22], easing: 'linear' });
      }
      // The moth itself flutters up over its box
      play(x, y - h * 0.5 - 14, MOTH, [{ transform: 'translate(0, 16px) scale(0.3)', opacity: 0 }, { transform: 'translate(0, -4px) scale(1) rotate(-8deg)', opacity: 1, offset: 0.25 },
        { transform: 'translate(0, 4px) rotate(8deg)', opacity: 1, offset: 0.5 }, { transform: 'translate(0, -6px) rotate(-6deg)', opacity: 1, offset: 0.75 },
        { transform: 'translate(0, -24px) scale(0.8)', opacity: 0 }], 1000, { cls: 'fxi1-moth', size: [56, 45], easing: 'ease-in-out' });
      later(420, () => frostBloom(x, y, Math.min(200, w * 1.1), 600));
    },
    // Each strike hurls one more spinning shuriken than the last, on crossing arcs, bigger every time
    windup(ctx) {
      const s = clamp(ctx.strike || 0, 0, 2), to = at(ctx), base = src(ctx), ms = [310, 280, 250][s], flights = [];
      for (let i = 0; i <= s; i++) {
        const from = i === 0 ? launchPoint(ctx) : [base[0] + fxRand(-30, 30), base[1] + fxRand(-12, 12)];
        const dir = i % 2 ? -1 : 1;
        flights.push(wait(i * 45).then(() => fxFly(from, [to[0] + fxRand(-16, 16), to[1] + fxRand(-10, 10)], {
          html: SHURIKEN, cls: 'fxi1-shuriken', ms, arc: dir * (s % 2 ? -1 : 1) * (60 + 30 * i), spin: 1080 + 360 * s,
          scale: [0.5, 0.9 + 0.3 * s + (ctx.crit ? 0.25 : 0)], trail: i === 0 ? 'fxr-trail-frost' : '', trailEvery: 28, easing: 'cubic-bezier(.35,0,.85,.7)' })));
      }
      if (s === 2) dim(VIG.frost, 0.6, 320);
      return Promise.all(flights);
    },
    // The flakes burst into sparkles: FLAKE! -> FLURRY!! -> WHITEOUT!!! with a huge frost bloom to finish
    impact(ctx) {
      const s = clamp(ctx.strike || 0, 0, 2), [tx, ty] = at(ctx), p = pow(ctx) + s * 0.2;
      for (let i = 0; i <= s; i++) later(i * 60, () => {
        const ox = fxRand(-22, 22), oy = fxRand(-10, 10);
        show(tx + ox, ty + oy, FLAKE, { cls: 'fxr-bloom', size: [46 + 18 * s, 46 + 18 * s], ms: 440, from: 0.3, to: 1, rise: 0, spin: 200 });
        sparkle(tx + ox, ty + oy, { count: 6 + s * 2, spread: 80 * p });
      });
      snowflakes(tx, ty, { count: 6 + s * 3, spread: 110 * p });
      for (let i = 0; i <= s; i++) later(i * 70, () => fxRing(tx, ty, { color: i % 2 ? '#7ab8ff' : '#ffffff', size: 130 + 50 * i + 30 * s, width: 5, ms: 420 }));
      const [sx, sy] = stampPoint(ctx, (s - 1) * 24);
      slam(sx, sy, ['FLAKE!', 'FLURRY!!', 'WHITEOUT!!!'][s], { kind: s === 2 ? 'frost' : 'snow', size: 30 + s * 10 + (ctx.crit ? 8 : 0),
        rotate: [-9, 7, -4][s], ms: 650 + s * 150, star: s === 2 ? '#dff4ff' : null });
      fxShake(ctx.panel, 5 + s * 5, 260 + s * 60);
      fxShake(ctx.to, 6 + s * 3, 250);
      if (s === 2) {
        frostBloom(tx, ty, 230 * Math.min(1.4, p), 900);
        crackBurst(tx, ty, 180, 'frost', fxRand(0, 60), 800);
        snowfall(tx, ty - 110, 280, 10, { fall: 200, ms: 900 });
        fxTint('#ffffff', { ms: 460, opacity: 0.5 }); // whiteout!
        haptic(60);
      }
    },
  };

  // ================= Frost Dust (x1, stun): glittering wing dust that makes you sneeze and freezes you =================
  CARD_FX['frost-dust'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landAt(ctx);
      frame(ctx.win, '#7ae0ff', 700);
      glint(ctx.slot);
      // The moth shakes its wings over the card and glittering dust puffs off
      play(x, y - 14, MOTH, [{ transform: 'translate(0, 10px) scale(0.3)', opacity: 0 }, { transform: 'translate(0, -8px) scale(0.9) rotate(-10deg)', opacity: 1, offset: 0.25 },
        { transform: 'translate(-4px, -10px) rotate(10deg)', opacity: 1, offset: 0.45 }, { transform: 'translate(4px, -12px) rotate(-10deg)', opacity: 1, offset: 0.65 },
        { transform: 'translate(0, -34px) scale(0.7)', opacity: 0 }], 900, { cls: 'fxi1-moth', size: [62, 50] });
      for (let i = 0; i < 3; i++) later(120 + i * 130, () => {
        dustPuff(x + fxRand(-22, 22), y + fxRand(-4, 24), fxRand(46, 64));
        glitter(x, y, { count: 6, spread: 70, gravity: 50 });
      });
      plate(ctx, '💠 FROST DUST', '#7ae0ff');
    },
    // A drifting cloud of glitter floats along an arc, trailing a sparkling stream
    windup(ctx) {
      const to = at(ctx), from = launchPoint(ctx), arc = to[0] - from[0] > 0 ? -70 : 70;
      later(70, () => fxFly(from, to, { cls: 'fxi1-dustcloud', ms: 300, arc: arc * 1.5, scale: [0.3, 0.8], trail: 'fxi1-trail-glitter', trailEvery: 40, easing: 'ease-in-out' }));
      return fxFly(from, to, { cls: 'fxi1-dustcloud', ms: 380, arc, scale: [0.4, ctx.crit ? 1.5 : 1.2], trail: 'fxi1-trail-glitter', trailEvery: 26, easing: 'ease-in-out' });
    },
    // A sparkly dust poof, and the victim sneezes: ACHOO!
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit;
      dustPuff(tx, ty, 120 * p, 700);
      later(60, () => dustPuff(tx + fxRand(-30, 30), ty + fxRand(-10, 10), 80 * p, 640));
      frostPuff(tx, ty, 3, { size: 56 * Math.min(1.5, p), spread: 70 });
      glitter(tx, ty, { count: 16, spread: 140 * p, gravity: 40, ms: 800, size: [4, 7] });
      sparkle(tx, ty, { count: 8, spread: 100 * p, colors: ['#fff', '#c9a8ff', '#7ae0ff'] });
      later(120, () => speedLines(tx, ty, { n: 8, r0: 30, r1: 80 + 30 * p, cls: 'fxr-line-ice', width: 3 }));
      jolt(ctx.to, [{ transform: 'none' }, { transform: 'scale(1.05, 0.9) translateY(3px)', offset: 0.3 },
        { transform: 'scale(0.95, 1.1) translateY(-6px)', offset: 0.5 }, { transform: 'scale(1.02, 0.98)', offset: 0.75 }, { transform: 'none' }], 460, { delay: 60 });
      const [sx, sy] = stampPoint(ctx);
      slam(sx, sy, crit ? 'MEGA ACHOO!!' : 'ACHOO!', { kind: 'snow', size: crit ? 38 : Math.min(50, 30 + 10 * p), rotate: 8, ms: 850 });
      fxShake(ctx.panel, Math.min(14, 7 * p), 300);
    },
    // Stun: the glitter hanging in the air is sucked in and crystallises into the ice: FROSTED!
    gimmick(ctx) {
      const [x, y] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46);
      charge(x, y, { html: () => '✦', colors: ['#7ae0ff', '#c9a8ff', '#ffffff'], n: 10, r: Math.max(90, w * 0.7), ms: 340, size: [4, 7] });
      later(200, () => frost.freeze(ctx, { word: 'FROSTED!' }));
      // Crystals grow out of the ice block's edges
      [[-0.5, -0.4, -30], [0.5, -0.45, 25], [-0.52, 0.35, -150], [0.5, 0.4, 150], [0, -0.6, 0]].forEach(([ox, oy, r], i) => later(360 + i * 50, () =>
        play(x + ox * (w + 20), y + oy * (h + 24), CRYSTAL, [{ transform: `rotate(${r}deg) scale(0.1, 0.1)`, opacity: 0 }, { transform: `rotate(${r}deg) scale(1.1)`, opacity: 1, offset: 0.2 },
          { transform: `rotate(${r}deg) scale(1)`, opacity: 1, offset: 0.75 }, { transform: `rotate(${r}deg) scale(1.2)`, opacity: 0 }], 800, { cls: 'fxi1-svg fxi1-crys', size: [16, 24] })));
      later(380, () => glitter(x, y, { count: 10, spread: w * 0.6, gravity: 20 }));
    },
  };

  // ================= Hypno Wings (x4, stun): the Blizzard Moth's eye-spot wings put you in a trance =================
  CARD_FX['hypno-wings'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landAt(ctx), [w] = sizeOf(ctx.win, 120, 180), ww = clamp(w * 2.1, 170, 250);
      fxTint(VIG.aurora, { ms: 950, opacity: 0.55 });
      frame(ctx.win, '#c89bff', 850);
      hypno(x, y, 150, 1000, 2);
      // Giant wings with glowing eye spots unfold over the wheel and beat once
      play(x, y - 6, HYPNO_WINGS, [{ transform: 'scale(0.08, 0.6)', opacity: 0 }, { transform: 'scale(1.08, 1)', opacity: 1, offset: 0.22 },
        { transform: 'scale(0.62, 0.96)', opacity: 1, offset: 0.42 }, { transform: 'scale(1, 1)', opacity: 1, offset: 0.62 },
        { transform: 'scale(0.98, 1)', opacity: 1, offset: 0.82 }, { transform: 'scale(1.12, 1.05)', opacity: 0 }], 1050, { cls: 'fxi1-svg fxi1-hwings', size: [ww, ww * 0.75] });
      later(260, () => { fxRing(x, y, { color: '#c89bff', size: 170, width: 5, ms: 500 }); sfx('stun', 1.3, 0.3); });
      later(420, () => fxRing(x, y, { color: '#7ae0ff', size: 220, width: 4, ms: 520 }));
      plate(ctx, '👁️ HYPNO WINGS', '#c89bff');
    },
    // Hypnotic rings pulse out of the wheel one after another, a spiral spinning along with them
    windup(ctx) {
      const to = at(ctx), from = launchPoint(ctx), s = ctx.crit ? 1.3 : 1;
      const rings = [0, 1, 2, 3].map(i => wait(i * 50).then(() => fxFly(from, to, { cls: 'fxi1-hring fxi1-hring-' + (i % 2), ms: 240, scale: [0.3, 1.5 * s], easing: 'ease-in' })));
      rings.push(fxFly(from, to, { html: SPIRAL, cls: 'fxi1-svg fxi1-spiralfly', ms: 340, spin: 900, scale: [0.3, s], easing: 'ease-in' }));
      return Promise.all(rings);
    },
    // A spiral swirls over the victim, who sways dizzily: WOOZY!
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit;
      hypno(tx, ty, 130 * Math.min(1.6, p), 800, 2.2);
      show(tx, ty, EYE, { cls: 'fxi1-eye', size: [60 * Math.min(1.5, p), 60 * Math.min(1.5, p)], ms: 460, from: 0.2, to: 1, rise: 0 });
      for (let i = 0; i < 3; i++) later(i * 80, () => fxRing(tx, ty, { color: i % 2 ? '#7ae0ff' : '#c89bff', size: (140 + 60 * i) * p, width: 5, ms: 480 }));
      sparkle(tx, ty, { count: 10, spread: 110 * p, colors: ['#fff', '#c89bff', '#7ae0ff'] });
      orbit(tx, ty - 20, i => (i % 2 ? '💫' : '✨'), 3, { rx: 60, ry: 14, ms: 800, size: 18 });
      jolt(ctx.to, [{ transform: 'rotate(0)' }, { transform: 'rotate(-5deg) translateX(-5px)' }, { transform: 'rotate(4deg) translateX(5px)' },
        { transform: 'rotate(-3deg) translateX(-2px)' }, { transform: 'rotate(0)' }], 760);
      const [sx, sy] = stampPoint(ctx);
      slam(sx, sy, crit ? 'SUPER WOOZY!!' : 'WOOZY!', { kind: 'aurora', size: crit ? 38 : Math.min(54, 32 + 10 * p), rotate: -7, ms: 900 });
      fxTint(VIG.aurora, { ms: 480, opacity: crit ? 0.55 : 0.35 });
      fxShake(ctx.panel, Math.min(18, 9 * p), 360);
    },
    // Stun: hypnotized AND glazed in ice, the spiral still spinning over the frozen victim
    gimmick(ctx) {
      const [x, y] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46);
      frost.freeze(ctx, { word: 'HYPNOTIZED!' });
      hypno(x, y, Math.min(170, w * 1.05), 1250, 3, 'fxi1-spiral-soft');
      later(120, () => orbit(x, y, () => `<i class="fxi1-eye-o">${EYE}</i>`, 3, { rx: w * 0.58, ry: h * 0.75, ms: 1050, size: 20, turns: 1 }));
    },
  };

  // ================= Frost Cocoon (armor +2): silk wraps round the moth and freezes into a hard shell =================
  CARD_FX['frost-cocoon'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landAt(ctx), [w, h] = sizeOf(ctx.slot || ctx.win, 70, 110);
      frame(ctx.win, '#e8f4ff', 850);
      // Silk threads wind round the card, criss-crossing band after band...
      for (let i = 0; i < 6; i++) later(i * 60, () => {
        const sd = i % 2 ? 1 : -1, yy = y + (i / 5 - 0.5) * h * 0.8, tilt = sd * h * 0.12;
        strand([x - w * 0.62, yy - tilt], [x + w * 0.62, yy + tilt], { cls: 'fxi1-silk', ms: 820 - i * 60, width: 3, grow: 0.3, hold: 0.7 });
      });
      // ...and a cocoon forms over it, glints and frosts over
      later(380, () => {
        const c = play(x, y, COCOON, [{ transform: 'scale(0.4, 0.2)', opacity: 0 }, { transform: 'scale(1.1, 1.05)', opacity: 1, offset: 0.25 },
          { transform: 'scale(1)', opacity: 1, offset: 0.4 }, { transform: 'rotate(-4deg)', opacity: 1, offset: 0.6 }, { transform: 'rotate(3deg)', opacity: 1, offset: 0.8 },
          { transform: 'scale(1.1)', opacity: 0 }], 700, { cls: 'fxi1-svg fxi1-cocoon', size: [clamp(w * 0.8, 44, 70), clamp(w * 0.8, 44, 70) * 1.5] });
        later(160, () => glint(c));
        sparkle(x, y, { count: 8, spread: 70 });
      });
      plate(ctx, '🕸️ FROST COCOON', '#e8f4ff');
    },
    // Armor: threads shoot from the wheel, wind criss-cross round the moth's box, then the cocoon hardens to ice
    gimmick(ctx) {
      const [x, y] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46), start = ctx.win ? fxPoint(ctx.win) : [x, y + 120];
      for (let i = 0; i < 3; i++) later(i * 50, () => strand(start, [x + (i - 1) * w * 0.32, y + h * 0.45], { cls: 'fxi1-silk', ms: 460, width: 2, grow: 0.45, hold: 0.6 }));
      for (let i = 0; i < 6; i++) later(170 + i * 55, () => {
        const sd = i % 2 ? 1 : -1, yy = y + (Math.floor(i / 2) - 1) * h * 0.34;
        strand([x - w * 0.62, yy - sd * h * 0.3], [x + w * 0.62, yy + sd * h * 0.3], { cls: 'fxi1-silk', ms: 1000 - i * 55, width: 3, grow: 0.2, hold: 0.7 });
      });
      later(260, () => frost.armor(ctx, { n: 2, word: '+2 COCOON' }));
      later(560, () => {
        const shell = play(x, y, '', [{ transform: 'scale(1.3)', opacity: 0 }, { transform: 'scale(0.96)', opacity: 1, offset: 0.2 },
          { transform: 'scale(1)', opacity: 1, offset: 0.75 }, { transform: 'scale(1.06)', opacity: 0 }], 760, { cls: 'fxi1-cocoonshell', size: [w * 1.25, h * 1.7] });
        later(120, () => glint(shell));
        frostPuff(x, y, 3, { size: 50, spread: w * 0.5 });
      });
    },
  };

  // ================= Moonbeam (x6): the Aurora Moth Queen calls down a shaft of moonlight =================
  CARD_FX['moonbeam'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landAt(ctx);
      dim(NIGHT, 0.65, 1000);
      frame(ctx.win, '#fff6c8', 850);
      // A halo and the crescent moon rise up behind the card, gleaming
      play(x, y - 30, '', [{ transform: 'scale(0.3)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: 0.4 }, { transform: 'scale(1.1)', opacity: 0 }], 1000, { cls: 'fxi1-moonhalo', size: [170, 170] });
      const moon = play(x, y + 10, MOON, [{ transform: 'translate(0, 40px) scale(0.5) rotate(-24deg)', opacity: 0 }, { transform: 'translate(0, -36px) scale(1) rotate(0deg)', opacity: 1, offset: 0.4 },
        { transform: 'translate(0, -42px) scale(1.02) rotate(5deg)', opacity: 1, offset: 0.8 }, { transform: 'translate(0, -56px) scale(0.95) rotate(6deg)', opacity: 0 }], 1000, { cls: 'fxi1-svg fxi1-moon', size: [84, 84] });
      later(420, () => { glint(moon); sfx('coin', 0.7, 0.3); });
      for (let i = 0; i < 6; i++) later(i * 90, () => twinkle(x + fxRand(-75, 75), y + fxRand(-110, 30), fxRand(12, 20), i % 2 ? '#ffffff' : '#fff6c8'));
      plate(ctx, '🌙 MOONBEAM', '#fff6c8');
    },
    // A moon appears over the victim, gathers light, then a pale shaft shines straight down on them
    windup(ctx) {
      const [tx, ty] = at(ctx), [, th] = sizeOf(ctx.to, 200, 46), s = ctx.crit ? 1.2 : 1;
      const my = Math.max(46, ty - th * 0.5 - 100), bottom = ty + th * 0.5;
      dim(NIGHT, ctx.crit ? 0.8 : 0.65, 460);
      play(tx, my, '', [{ transform: 'scale(0.3)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: 0.35 }, { transform: 'scale(1.2)', opacity: 0 }], 700, { cls: 'fxi1-moonhalo', size: [130, 130] });
      play(tx, my, MOON, [{ transform: 'scale(0.2) rotate(-40deg)', opacity: 0 }, { transform: `scale(${s}) rotate(0deg)`, opacity: 1, offset: 0.3 },
        { transform: `scale(${s * 1.08}) rotate(4deg)`, opacity: 1, offset: 0.7 }, { transform: `translate(0, -10px) scale(${s}) rotate(6deg)`, opacity: 0 }], 720, { cls: 'fxi1-svg fxi1-moon', size: [60, 60] });
      charge(tx, my, { colors: ['#fff', '#fff6c8', '#dfe8ff'], n: 10, r: 70, ms: 240 });
      later(220, () => {
        const len = bottom - my;
        play(tx, my + len / 2, '', [{ transform: 'scaleY(0) scaleX(0.6)', opacity: 1 }, { transform: 'scaleY(1) scaleX(1)', opacity: 1, offset: 0.25 },
          { transform: 'scaleY(1) scaleX(1.15)', opacity: 0.9, offset: 0.6 }, { transform: 'scaleY(1) scaleX(0.4)', opacity: 0 }], 520, { cls: 'fxi1-shaft', size: [56 * s, len], style: { transformOrigin: '50% 0' } });
        sfx('buff', 1.4, 0.35);
      });
      return wait(340);
    },
    // A silver-white pillar flash, a crescent slash and moon sparkles: MOONBEAM! (a crit: LUNAR STRIKE!!)
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit;
      play(tx, ty - 130, '', [{ transform: 'scaleX(0.3)', opacity: 1 }, { transform: 'scaleX(1.3)', opacity: 1, offset: 0.25 }, { transform: 'scaleX(0.15)', opacity: 0 }], 480,
        { cls: 'fxi1-pillar', size: [90 * Math.min(1.6, p), 380] });
      core(tx, ty, 170 * p, 'moon', 440);
      play(tx, ty, CRESCENT, [{ transform: 'rotate(-60deg) scale(0.4)', opacity: 0 }, { transform: 'rotate(0deg) scale(1)', opacity: 1, offset: 0.35 }, { transform: 'rotate(30deg) scale(1.15)', opacity: 0 }],
        440, { cls: 'fxi1-svg fxi1-crescent', size: [150 * Math.min(1.5, p), 150 * Math.min(1.5, p)] });
      slash(tx, ty, -32, 210 * p, 12, 'fxr-slash-moon');
      fxRing(tx, ty, { color: '#ffffff', size: 160 * p, width: 6, ms: 380 });
      later(80, () => fxRing(tx, ty, { color: '#fff6c8', size: 250 * p, width: 8, ms: 520 }));
      fxParticles(tx, ty, { count: 14, html: i => (i % 2 ? '✦' : '✧'), colors: ['#fff6c8', '#ffffff', '#ffe98a'], size: [5, 10], spread: 160 * p, gravity: 30, ms: 800, spin: 120, cls: 'fxi1-glit' });
      const [sx, sy] = stampPoint(ctx);
      slam(sx, sy, crit ? 'LUNAR STRIKE!!' : 'MOONBEAM!', { kind: 'moon', size: crit ? 42 : Math.min(56, 32 + 10 * p), rotate: -5, ms: 950, star: crit ? '#fff6c8' : null });
      if (crit) flash('#fff6c8', 0.45);
      fxTint('#dfe8ff', { ms: 380, opacity: crit ? 0.4 : 0.25 });
      fxShake(ctx.panel, Math.min(24, 12 * p), 440);
      fxShake(ctx.to, 12, 360);
      haptic(60);
    },
  };

  // ================= Aurora Heal (wallow: heal + shield): the northern lights heal the Queen =================
  CARD_FX['aurora-heal'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landAt(ctx), [w, h] = sizeOf(ctx.win, 120, 180);
      dim(NIGHT_SKY, 0.6, 1050);
      frame(ctx.win, '#5fffb0', 850);
      // Aurora ribbons ripple over the wheel under a starry night sky
      aurora(x, y - h * 0.2, clamp(w * 2.4, 180, 280), 70, 1000);
      for (let i = 0; i < 3; i++) later(i * 80, () => curtain(x + (i - 1) * w * 0.34, y - h * 0.5, clamp(w * 0.4, 28, 46), h * 0.9, i, 950));
      later(200, () => sparkle(x, y, { count: 10, spread: 90, colors: AURORA_COLS }));
      plate(ctx, '🌌 AURORA HEAL', '#5fffb0');
    },
    // Wallow: aurora curtains wave over the Queen and glowing motes rain down into her; she heals and gains a shield
    gimmick(ctx) {
      const [x, y] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46);
      for (let i = 0; i < 4; i++) later(i * 70, () => curtain(x + (i - 1.5) * w * 0.28, y - h * 0.5 - 120, clamp(w * 0.26, 26, 44), 150, i, 1150));
      for (let i = 0; i < 12; i++) later(80 + i * 45, () => fxFly([x + fxRand(-w * 0.6, w * 0.6), y - 150 - fxRand(0, 40)], [x + fxRand(-w * 0.32, w * 0.32), y + fxRand(-6, 6)],
        { html: `<i class="fxi1-mote" style="--c:${AURORA_COLS[i % 4]}"></i>`, cls: 'fxi1-motefly', ms: 380, scale: [0.6, 1.1], easing: 'ease-in' }));
      frost.heal(ctx, { aurora: true, shield: true, word: 'AURORA!' });
      later(540, () => show(x, y - h * 0.5 - 16, '👑', { cls: 'fxi1-crown', font: 26, ms: 700, rise: 14 }));
    },
  };

  // ================= Belly Slide (x4): the Ice Penguin toboggans across the ice into you =================
  CARD_FX['belly-slide'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landAt(ctx), dir = faceX(src(ctx), at(ctx));
      frame(ctx.win, '#7ab8ff', 750);
      // A penguin pops up out of the card...
      play(x, y, PENG, [{ transform: 'translate(0, 20px) scale(0.3)', opacity: 0 }, { transform: 'translate(0, -30px) scale(0.9, 1.2)', opacity: 1, offset: 0.35 },
        { transform: 'translate(0, -20px) scale(1.1, 0.9)', opacity: 1, offset: 0.6 }, { transform: `translate(${dir * 6}px, -26px) rotate(${dir * 40}deg) scale(1)`, opacity: 1, offset: 0.9 },
        { transform: `translate(${dir * 10}px, -10px) rotate(${dir * 70}deg)`, opacity: 0 }], 440, { cls: 'fxi1-svg fxi1-peng', size: [44, 58] });
      // ...then flops onto its belly with a squash and scoots off
      later(400, () => {
        play(x, y + 6, mirror(SLIDER, dir), [{ transform: 'translate(0, -16px) scale(0.9)', opacity: 0 }, { transform: 'translate(0, 4px) scale(1.25, 0.7)', opacity: 1, offset: 0.2 },
          { transform: `translate(${dir * 6}px, 0) scale(0.95, 1.1)`, opacity: 1, offset: 0.36 }, { transform: `translate(${dir * 14}px, 2px) scale(1)`, opacity: 1, offset: 0.7 },
          { transform: `translate(${dir * 40}px, 2px) scale(1)`, opacity: 0 }], 560, { cls: 'fxi1-svg fxi1-pslide', size: [80, 34] });
        fxParticles(x, y + 16, { count: 8, colors: ICE_BLUE, size: [4, 8], spread: 60, gravity: 40, angle: -90, cone: 160, ms: 500 });
        slam(x, y - 30, 'FLOP!', { kind: 'snow', size: 26, rotate: dir * 8, ms: 600 });
        sfx('hop', 0.8, 0.5);
      });
      plate(ctx, '🛷 BELLY SLIDE', '#7ab8ff');
    },
    // The penguin slides on its belly from the enemy to the victim, leaving an icy trail and a spray of snow
    windup(ctx) {
      const to = at(ctx), f = src(ctx), [, h] = sizeOf(ctx.from, 200, 46), [, th] = sizeOf(ctx.to, 200, 46);
      const a = [f[0], f[1] + h * 0.25], b = [to[0], to[1] + th * 0.1], d = dirOf(a, b), ms = 360;
      for (let k = 1; k <= 4; k++) later(k * 72, () => {
        const t = k * 72 / ms;
        fxParticles(a[0] + d.dx * t, a[1] + d.dy * t + 8, { count: 4, colors: ICE_BLUE, size: [3, 6], spread: 44, gravity: 10, angle: d.ang + 200, cone: 60, ms: 420 });
      });
      return aimFly(a, b, { html: flipV(SLIDER, d.dx < 0), cls: 'fxi1-svg fxi1-pslide', ms, scale: [0.8, ctx.crit ? 1.4 : 1.2], trail: 'fxi1-trail-ice', trailEvery: 26, easing: 'linear' });
    },
    // WHEE-BONK! It bounces off the victim spinning, snow spraying everywhere
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit, dir = faceX(src(ctx), [tx, ty]);
      play(tx - dir * 8, ty, mirror(SLIDER, dir), [{ transform: 'translate(0, 0) rotate(0deg) scale(1.2)', opacity: 1 },
        { transform: `translate(${-dir * 46}px, -74px) rotate(${-dir * 320}deg) scale(1)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${-dir * 86}px, -30px) rotate(${-dir * 640}deg) scale(0.8)`, opacity: 0 }], 720, { cls: 'fxi1-svg fxi1-pslide', size: [80, 34], easing: 'cubic-bezier(.2,.7,.5,1)' });
      core(tx, ty, 120 * p, 'white', 360);
      fxRing(tx, ty, { color: '#ffffff', size: 150 * p, width: 7, ms: 400 });
      later(60, () => fxRing(tx, ty, { color: '#7ab8ff', size: 210 * p, width: 4, ms: 480 }));
      fxParticles(tx, ty, { count: 14, colors: ICE_BLUE, size: [4, 9], spread: 140 * p, gravity: 80, angle: dir > 0 ? 0 : 180, cone: 200, ms: 650 });
      fxParticles(tx, ty - 10, { count: 4, html: '⭐', colors: ['#fff'], size: [7, 10], spread: 80, gravity: 20, angle: -90, cone: 160, ms: 700, spin: 360 });
      frostPuff(tx, ty + 10, 3, { size: 50, spread: 60 });
      knock(ctx.to, src(ctx), 16 + 6 * p, 380);
      const [sx, sy] = stampPoint(ctx);
      slam(sx, sy, crit ? 'MEGA BONK!!' : 'WHEE-BONK!', { kind: 'snow', size: crit ? 40 : Math.min(50, 28 + 10 * p), rotate: dir * -6, ms: 850 });
      fxShake(ctx.panel, Math.min(18, 9 * p), 340);
      later(30, () => sfx('hop', 1.4, 0.5)); // boing
    },
  };

  // ================= Snowball Volley (x2, frenzy): a snowball fight, faster and bigger every strike =================
  CARD_FX['snowball-volley'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landAt(ctx), [, h] = sizeOf(ctx.win, 120, 180);
      frame(ctx.win, '#dff4ff', 750);
      // A snowman pops up with a squash and a stretch...
      play(x, y - 8, SNOWMAN, [{ transform: 'translate(0, 24px) scale(0.3, 0.2)', opacity: 0 }, { transform: 'translate(0, -8px) scale(0.9, 1.15)', opacity: 1, offset: 0.25 },
        { transform: 'translate(0, 2px) scale(1.12, 0.9)', opacity: 1, offset: 0.4 }, { transform: 'translate(0, -2px) scale(1)', opacity: 1, offset: 0.55 },
        { transform: 'rotate(-6deg)', opacity: 1, offset: 0.72 }, { transform: 'rotate(4deg)', opacity: 1, offset: 0.86 }, { transform: 'translate(0, 10px) scale(0.8)', opacity: 0 }],
      900, { cls: 'fxi1-svg fxi1-snowman', size: [54, 81] });
      // ...and snowballs roll out from under it
      [-1, 1, -1, 1].forEach((sd, i) => later(220 + i * 70, () => play(x, y + h * 0.2, '', [{ transform: 'translate(0, 0) scale(0.5)', opacity: 0 },
        { transform: `translate(${sd * 18}px, 0) rotate(${sd * 120}deg) scale(1)`, opacity: 1, offset: 0.2 },
        { transform: `translate(${sd * (56 + i * 8)}px, 3px) rotate(${sd * 480}deg) scale(1)`, opacity: 1, offset: 0.8 },
        { transform: `translate(${sd * (74 + i * 8)}px, 4px) rotate(${sd * 600}deg) scale(0.9)`, opacity: 0 }], 620, { cls: 'fxi1-ball', size: [17, 17] })));
      later(150, () => fxParticles(x, y + h * 0.22, { count: 8, colors: ICE_BLUE, size: [4, 7], spread: 70, gravity: 40, angle: -90, cone: 180, ms: 500 }));
      plate(ctx, '☃️ SNOWBALL VOLLEY', '#dff4ff');
    },
    // Frenzy (before the strikes): SNOWBALL FIGHT! A pile of snowballs stacks up beside the penguin
    gimmick(ctx) {
      const [x, y] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46), away = x >= at(ctx)[0] ? 1 : -1;
      frost.frenzy(ctx, { word: 'SNOWBALL FIGHT!', html: () => '<i class="fxi1-ball-i"></i>' });
      const px = x + away * (w * 0.5 + 24), py = y + h * 0.3, b = 17;
      [[3, 0], [2, 1], [1, 2]].forEach(([n, row]) => {
        for (let i = 0; i < n; i++) {
          const bx = px + (i - (n - 1) / 2) * b, by = py - row * b * 0.85, k = row * 3 + i;
          later(80 + k * 55, () => play(bx, by, '', [{ transform: 'translate(0, -70px) scale(0.8)', opacity: 0 }, { transform: 'translate(0, 0) scale(1.15, 0.85)', opacity: 1, offset: 0.18 },
            { transform: 'translate(0, -4px) scale(0.95, 1.05)', opacity: 1, offset: 0.26 }, { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0.85 },
            { transform: 'translate(0, 4px) scale(0.9)', opacity: 0 }], 1150 - k * 55, { cls: 'fxi1-ball', size: [b, b] }));
        }
      });
    },
    // Each strike lobs 1..3 snowballs on high arcs
    windup(ctx) {
      const s = clamp(ctx.strike || 0, 0, 2), to = at(ctx), base = src(ctx), flights = [];
      for (let i = 0; i <= s; i++) {
        const from = i === 0 ? launchPoint(ctx) : [base[0] + fxRand(-26, 26), base[1] + fxRand(-10, 10)];
        const aim = [to[0] + fxRand(-20, 20), to[1] + fxRand(-12, 8)];
        flights.push(wait(i * 55).then(() => flyPath(lobPt(from, aim, 90 + 20 * i), { cls: 'fxi1-ball fxi1-ballfly', ms: 320 - s * 25, spin: 540,
          scale: [0.6, 1.1 + 0.25 * s + (ctx.crit ? 0.2 : 0)], trail: 'fxi1-trail-powder', trailEvery: 34, easing: 'linear' })));
      }
      return Promise.all(flights);
    },
    // SPLAT: the snowballs burst into powder and white splats slide down the victim: SPLAT! -> SPLAT!! -> AVALANCHE!!!
    impact(ctx) {
      const s = clamp(ctx.strike || 0, 0, 2), [tx, ty] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46), p = pow(ctx) + s * 0.2;
      for (let i = 0; i <= s; i++) later(i * 55, () => {
        const ox = fxRand(-w * 0.3, w * 0.3), oy = fxRand(-h * 0.3, h * 0.15);
        fxParticles(tx + ox, ty + oy, { count: 8 + s * 2, cls: 'fxi1-chunk', colors: ['#ffffff', '#eef6ff', '#d6e8fb'], size: [5, 11], spread: 90 * p, gravity: 100, ms: 650, spin: 360 });
        splat(tx + ox, ty + oy, 40 + 10 * s);
      });
      frostPuff(tx, ty, 2 + s, { size: 50 + 10 * s, spread: w * 0.4 });
      fxRing(tx, ty, { color: '#ffffff', size: (140 + 40 * s) * p, width: 6, ms: 420 });
      const [sx, sy] = stampPoint(ctx, (s - 1) * 24);
      slam(sx, sy, ['SPLAT!', 'SPLAT!!', 'AVALANCHE!!!'][s], { kind: s === 2 ? 'frost' : 'snow', size: 30 + s * 10 + (ctx.crit ? 8 : 0),
        rotate: [-8, 8, -4][s], ms: 650 + s * 150, star: s === 2 ? '#ffffff' : null });
      fxShake(ctx.panel, 5 + s * 6, 260 + s * 60);
      fxShake(ctx.to, 6 + s * 3, 260);
      if (s === 2) {
        // Avalanche: a heap of snow tumbles down onto the victim
        fxParticles(tx, ty - 120, { count: 14, cls: 'fxi1-chunk', colors: ['#ffffff', '#eef6ff'], size: [9, 18], spread: 70, gravity: 200, angle: 90, cone: 70, ms: 700, spin: 360 });
        snowfall(tx, ty - 130, w * 1.4, 10, { fall: 170, ms: 800 });
        later(200, () => play(tx, ty + h * 0.35, '', [{ transform: 'scale(0.3, 0.1)', opacity: 0 }, { transform: 'scale(1.1, 1)', opacity: 1, offset: 0.2 },
          { transform: 'scale(1)', opacity: 1, offset: 0.7 }, { transform: 'scale(1.1, 0.6) translateY(10px)', opacity: 0 }], 800, { cls: 'fxi1-mound', size: [w * 1.1, 46], style: { transformOrigin: '50% 100%' } }));
        fxTint('#ffffff', { ms: 420, opacity: 0.4 });
        haptic(60);
      }
    },
  };

  // ================= Snow Fort (armor +2): the penguin builds a snow fort to hide behind =================
  CARD_FX['snow-fort'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landAt(ctx), [w, h] = sizeOf(ctx.slot || ctx.win, 70, 110);
      frame(ctx.win, '#bfe6ff', 850);
      // Snow bricks drop in and stack up over the reel, with crenellations on top and a flag
      const bw = clamp(w * 0.3, 18, 28), bh = bw * 0.6, base = y + h * 0.22;
      const bricks = [[-1, 0], [0, 0], [1, 0], [-1, 1], [0, 1], [1, 1], [-1, 2], [1, 2]];
      bricks.forEach(([c, r], i) => later(i * 55, () => play(x + c * bw, base - r * bh, '', [{ transform: 'translate(0, -60px) scale(0.8)', opacity: 0 },
        { transform: 'translate(0, 0) scale(1.1, 0.85)', opacity: 1, offset: 0.16 }, { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0.26 },
        { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0.85 }, { transform: 'translate(0, 6px) scale(0.9)', opacity: 0 }], 1000 - i * 40, { cls: 'fxi1-brick', size: [bw - 1, bh - 1] })));
      later(470, () => {
        play(x, base - 2 * bh - bw * 0.55, FLAG, [{ transform: 'scale(0.2, 0)', opacity: 0 }, { transform: 'scale(1, 1.1)', opacity: 1, offset: 0.3 },
          { transform: 'rotate(-6deg)', opacity: 1, offset: 0.6 }, { transform: 'rotate(4deg)', opacity: 1, offset: 0.85 }, { transform: 'scale(0.9)', opacity: 0 }],
        560, { cls: 'fxi1-svg fxi1-flag', size: [bw * 0.8, bw * 1.07], style: { transformOrigin: '15% 100%' } });
        frostPuff(x, base + bh * 0.5, 2, { size: 40 });
        sfx('coin', 1.5, 0.3);
      });
      plate(ctx, '🏰 SNOW FORT', '#bfe6ff');
    },
    // Armor: snow blocks fly in from the wheel and stack into a crenellated wall in front of the box, then a flag pops up
    gimmick(ctx) {
      const [x, y] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46), start = ctx.win ? fxPoint(ctx.win) : [x, y + 120];
      frost.armor(ctx, { n: 2, word: 'SNOW FORT!', plates: BRICK });
      const bw = clamp(w * 0.17, 18, 30), bh = bw * 0.6, base = y + h * 0.5 - bh * 0.5 + 2, slots = [];
      for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) slots.push([(c - 2) * bw, -r * bh]);
      [0, 2, 4].forEach(c => slots.push([(c - 2) * bw, -2 * bh]));
      slots.forEach(([ox, oy], i) => later(40 + i * 35, () => {
        const dx = x + ox - start[0], dy = base + oy - start[1];
        play(start[0], start[1], '', [{ transform: 'translate(0, 0) rotate(200deg) scale(0.5)', opacity: 0.6 },
          { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 60}px) rotate(80deg) scale(0.9)`, opacity: 1, offset: 0.13 },
          { transform: `translate(${dx}px, ${dy}px) rotate(0deg) scale(1.1, 0.85)`, opacity: 1, offset: 0.26 },
          { transform: `translate(${dx}px, ${dy}px) scale(1)`, opacity: 1, offset: 0.34 },
          { transform: `translate(${dx}px, ${dy}px) scale(1)`, opacity: 1, offset: 0.88 },
          { transform: `translate(${dx}px, ${dy + 6}px) scale(0.9)`, opacity: 0 }], 1300 - i * 35, { cls: 'fxi1-brick', size: [bw - 1, bh - 1] });
      }));
      later(40 + slots.length * 35 + 180, () => {
        play(x, base - 2 * bh - bw * 0.62, FLAG, [{ transform: 'scale(0.2, 0)', opacity: 0 }, { transform: 'scale(1, 1.12)', opacity: 1, offset: 0.2 },
          { transform: 'rotate(-6deg)', opacity: 1, offset: 0.45 }, { transform: 'rotate(5deg)', opacity: 1, offset: 0.7 }, { transform: 'rotate(-2deg)', opacity: 1, offset: 0.88 },
          { transform: 'scale(0.9)', opacity: 0 }], 760, { cls: 'fxi1-svg fxi1-flag', size: [bw * 0.9, bw * 1.2], style: { transformOrigin: '15% 100%' } });
        sparkle(x, base - 2 * bh, { count: 6, spread: 50 });
        sfx('coin', 1.5, 0.3);
      });
    },
  };

  // ================= Torpedo Dive (x6): the Penguin Commander launches like a torpedo =================
  CARD_FX['torpedo-dive'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landAt(ctx), [, h] = sizeOf(ctx.win, 120, 180);
      frame(ctx.win, '#4aa8ff', 800);
      // The Commander pops up and salutes (its flipper snaps up to its cap)...
      play(x, y - 8, `<i class="fxi1-cmdr-in">${penguin({ hat: true, salute: true })}<i class="fxi1-salute">${FLIPPER}</i></i>`, [
        { transform: 'translate(0, 24px) scale(0.3)', opacity: 0 }, { transform: 'translate(0, -6px) scale(0.92, 1.12)', opacity: 1, offset: 0.2 },
        { transform: 'translate(0, 0) scale(1.06, 0.95)', opacity: 1, offset: 0.32 }, { transform: 'translate(0, -2px) scale(1)', opacity: 1, offset: 0.45 },
        { transform: 'translate(0, -2px) scale(1)', opacity: 1, offset: 0.85 }, { transform: 'translate(0, -30px) scale(0.9)', opacity: 0 }], 950, { cls: 'fxi1-svg fxi1-cmdr', size: [52, 69] });
      // ...as water splashes up round it
      later(80, () => { splashCrown(x, y + h * 0.24, 80); drops(x, y + h * 0.2, { count: 10, spread: 90 }); sfx('leech', 1.3, 0.35); });
      later(260, () => bubbles(x, y + h * 0.2, 4, { spread: 26, rise: 70 }));
      later(420, () => slam(x + 30, y - 42, '🫡', { kind: 'snow', size: 22, rotate: 10, ms: 520 }));
      plate(ctx, '🚀 TORPEDO DIVE', '#4aa8ff');
      fxShake(ctx.panel, 5, 240);
    },
    // It launches like a torpedo, nose along its path, with a bubbly wake and speed lines
    windup(ctx) {
      const to = at(ctx), from = launchPoint(ctx), s = ctx.crit ? 1.2 : 1, d = dirOf(from, to);
      dim(VIG.deep, ctx.crit ? 0.7 : 0.5, 420);
      speedLines(from[0], from[1], { n: 8, r0: 16, r1: 70, cls: 'fxr-line-ice', width: 3 });
      drops(from[0], from[1], { count: 8, spread: 60, gravity: 90 });
      [0.35, 0.6].forEach(t => later(t * 340, () => {
        const px = from[0] + d.dx * t, py = from[1] + d.dy * t;
        for (let i = -1; i <= 1; i++) fxBeam([px - d.ux * 60 + d.nx * i * 14, py - d.uy * 60 + d.ny * i * 14], [px - d.ux * 10 + d.nx * i * 14, py - d.uy * 10 + d.ny * i * 14], { cls: 'fxr-line', ms: 240, width: 3 });
      }));
      return aimFly(from, to, { html: flipV(TORPEDO, d.dx < 0), cls: 'fxi1-svg fxi1-torpedo', size: [92, 39], ms: 340, arc: 30, scale: [0.5, 1.25 * s],
        trail: 'fxi1-trail-bubble', trailEvery: 26, easing: 'cubic-bezier(.5,0,1,.7)' });
    },
    // KER-SPLOOSH: a big column of water and ice blasts up, rings spread: TORPEDO! (a crit: DIRECT HIT!!)
    impact(ctx) {
      const [tx, ty] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46), p = pow(ctx), crit = !!ctx.crit, base = ty + h * 0.35, colH = 190 * Math.min(1.6, p);
      play(tx, base - colH / 2, '', [{ transform: 'scaleY(0.1) scaleX(0.6)', opacity: 1 }, { transform: 'scaleY(1.05) scaleX(1)', opacity: 1, offset: 0.3 },
        { transform: 'scaleY(1) scaleX(1.15)', opacity: 0.9, offset: 0.6 }, { transform: 'scaleY(0.8) scaleX(1.35)', opacity: 0 }], 720,
      { cls: 'fxi1-column', size: [64 * Math.min(1.5, p), colH], style: { transformOrigin: '50% 100%' } });
      splashCrown(tx, base, 150 * Math.min(1.5, p), 700);
      core(tx, ty, 150 * p, 'deep', 420);
      drops(tx, base - colH * 0.8, { count: 16, spread: 150 * p, gravity: 200, cone: 200, ms: 800 });
      iceShards(tx, ty, { count: 10, spread: 150 * p });
      ripple(tx, base, 200 * p, 620);
      later(90, () => ripple(tx, base, 280 * p, 700));
      fxRing(tx, ty, { color: '#ffffff', size: 160 * p, width: 6, ms: 380 });
      later(70, () => fxRing(tx, ty, { color: '#4aa8ff', size: 250 * p, width: 9, ms: 520 }));
      const [sx, sy] = stampPoint(ctx);
      slam(sx, sy, crit ? 'DIRECT HIT!!' : 'TORPEDO!', { kind: 'deep', size: crit ? 42 : Math.min(58, 32 + 12 * p), rotate: -6, ms: 950, star: crit ? '#7ae0ff' : null });
      if (crit) flash('#7ae0ff', 0.4);
      fxTint('#2a6ad1', { ms: 420, opacity: crit ? 0.4 : 0.28 });
      fxShake(ctx.panel, Math.min(26, 14 * p), 480);
      fxShake(ctx.to, 14, 380);
      later(40, () => sfx('leech', 0.7, 0.6)); // sploosh
      haptic(80);
    },
  };

  // ================= Huddle Up (heal): the penguin squad huddles round the Commander to warm it up =================
  CARD_FX['huddle-up'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landAt(ctx), [w, h] = sizeOf(ctx.slot || ctx.win, 70, 110);
      frame(ctx.win, '#ffb3d4', 850);
      play(x, y, '', [{ transform: 'scale(0.4)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: 0.5 }, { transform: 'scale(1.1)', opacity: 0 }], 1000, { cls: 'fxi1-cozy', size: [w * 1.8, w * 1.8] });
      // Little penguins waddle in from both sides and squeeze together on the card
      for (let i = 0; i < 4; i++) {
        const sd = i < 2 ? -1 : 1, fx = x + (i - 1.5) * 15, fy = y + h * 0.12 + (i % 2 ? 3 : -3);
        later(i * 40, () => waddle([fx + sd * (w * 0.6 + 10), fy], [fx, fy], { size: [24, 32], ms: 1000, walk: 0.42 }));
      }
      later(560, () => { fxParticles(x, y - 10, { count: 5, html: i => ['💙', '🤍', '💗'][i % 3], colors: ['#fff'], size: [6, 9], spread: 60, gravity: -50, angle: -90, cone: 120, ms: 700, spin: 0 }); sfx('hop', 1.6, 0.3); });
      plate(ctx, '🫂 HUDDLE UP', '#9fd8ff');
    },
    // Heal: a ring of penguins waddles in and huddles round the Commander's box in a cozy glow, hearts floating up
    gimmick(ctx) {
      const [x, y] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46);
      for (let i = 0; i < 6; i++) {
        const a = Math.PI * (1 + i / 5), tx = x + Math.cos(a) * (w * 0.5 + 6), ty = y + Math.sin(a) * (h * 0.5 + 14) + (i === 0 || i === 5 ? 6 : 0);
        const ox = Math.cos(a) * 70, oy = Math.sin(a) * 40;
        later(i * 45, () => waddle([tx + ox, ty + oy], [tx, ty], { size: [26, 35], ms: 1300, walk: 0.36, steps: 5 }));
      }
      later(380, () => {
        play(x, y, '', [{ transform: 'scale(0.5)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: 0.35 }, { transform: 'scale(1.1)', opacity: 0 }], 900, { cls: 'fxi1-cozy', size: [w * 1.6, h * 2.8] });
        fxParticles(x, y - 6, { count: 8, html: i => ['💙', '🤍', '💗'][i % 3], colors: ['#fff'], size: [7, 11], spread: 80, gravity: -70, angle: -90, cone: 130, ms: 850, spin: 0 });
      });
      later(120, () => frost.heal(ctx, { word: 'HUDDLE!' }));
    },
  };

  // ================= Penguin March (x2, frenzy): the Emperor's marching band stomps over you =================
  CARD_FX['penguin-march'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landAt(ctx), [, h] = sizeOf(ctx.win, 120, 180), dy = y - h * 0.12;
      frame(ctx.win, '#ffd96a', 850);
      // Drum beats pulse out of the card...
      play(x, dy, '🥁', [{ transform: 'scale(0.3)', opacity: 0 }, { transform: 'scale(1.25)', opacity: 1, offset: 0.1 }, { transform: 'scale(1)', opacity: 1, offset: 0.2 },
        { transform: 'scale(1.25) rotate(-6deg)', opacity: 1, offset: 0.35 }, { transform: 'scale(1)', opacity: 1, offset: 0.45 },
        { transform: 'scale(1.3) rotate(6deg)', opacity: 1, offset: 0.6 }, { transform: 'scale(1)', opacity: 1, offset: 0.7 }, { transform: 'translate(0, -20px) scale(0.9)', opacity: 0 }],
      900, { cls: 'fxi1-drum' });
      for (let i = 0; i < 3; i++) later(90 + i * 225, () => {
        fxRing(x, dy, { color: i % 2 ? '#ffffff' : '#ffd96a', size: 110 + i * 25, width: 5, ms: 380 });
        fxParticles(x, dy, { count: 2, html: i % 2 ? '♪' : '♫', colors: ['#ffd96a'], size: [8, 11], spread: 60, gravity: -30, angle: -90, cone: 120, ms: 600, spin: 0, cls: 'fxi1-note' });
        if (i !== 1) sfx('hop', 0.55, 0.4); // boom
      });
      // ...and a row of penguins pops up in line, one per beat
      for (let i = 0; i < 3; i++) later(90 + i * 225, () => play(x + (i - 1) * 22, y + h * 0.2, PENG_EMP, [{ transform: 'translate(0, 16px) scale(0.3)', opacity: 0 },
        { transform: 'translate(0, -6px) scale(1, 1.1)', opacity: 1, offset: 0.14 }, { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0.25 },
        { transform: 'translate(0, -5px) rotate(-8deg)', opacity: 1, offset: 0.5 }, { transform: 'translate(0, 0) rotate(8deg)', opacity: 1, offset: 0.75 },
        { transform: 'translate(0, -12px) scale(0.9)', opacity: 0 }], 900 - i * 150, { cls: 'fxi1-svg fxi1-peng', size: [24, 32] }));
      plate(ctx, '🥁 PENGUIN MARCH', '#ffd96a');
    },
    // Frenzy (before the strikes): a drumroll, and a marching column of penguins files in over the Emperor: MARCH!
    gimmick(ctx) {
      const [x, y] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46), away = x >= at(ctx)[0] ? 1 : -1;
      frost.frenzy(ctx, { word: 'MARCH!', html: i => `<b class="fxi1-note">${i % 2 ? '♪' : '♫'}</b>` });
      const roll = [{ transform: 'scale(0.3)', opacity: 0 }];
      for (let k = 1; k < 10; k++) roll.push({ transform: `translate(${k % 2 ? 2 : -2}px, ${k % 2 ? -2 : 1}px) rotate(${k % 2 ? 8 : -8}deg) scale(${k % 2 ? 1.12 : 1})`, opacity: 1, offset: k / 11 });
      roll.push({ transform: 'scale(0.8)', opacity: 0 });
      play(x + away * (w * 0.5 + 18), y - h * 0.5, '🥁', roll, 900, { cls: 'fxi1-drum', easing: 'linear' });
      const top = y - h * 0.5 - 16;
      for (let i = 0; i < 5; i++) later(i * 70, () => {
        const tx = x + (i / 4 - 0.5) * w * 0.8, from = [x + away * (w * 0.5 + 90), top];
        waddle(from, [tx, top], { html: PENG_EMP, size: [22, 29], ms: 1100 - i * 50, walk: 0.4, steps: 8 });
      });
    },
    // Each strike a line of 1..3 penguins hop-marches across into the victim
    windup(ctx) {
      const s = clamp(ctx.strike || 0, 0, 2), to = at(ctx), f = src(ctx), [, h] = sizeOf(ctx.from, 200, 46), [, th] = sizeOf(ctx.to, 200, 46);
      const a = [f[0], f[1] + h * 0.1], b = [to[0], to[1] + th * 0.05], ms = 380 - s * 25, hops = 4, sz = 30 + s * 5;
      const pt = t => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.abs(Math.sin(t * Math.PI * hops)) * 16];
      const rot = t => Math.cos(t * Math.PI * hops) * 12;
      const line = [];
      for (let i = 0; i <= s; i++) line.push(wait(i * 45).then(() => flyPath(pt, { html: PENG_EMP, cls: 'fxi1-svg fxi1-peng', size: [sz, sz * 1.33], ms, rot, steps: 16,
        scale: [0.85, 1.1 + (ctx.crit ? 0.2 : 0)], easing: 'linear' })));
      return line[0];
    },
    // Stomp! Snow dust kicks up and footprints stamp on the victim: LEFT! -> RIGHT!! -> STOMP!!!
    impact(ctx) {
      const s = clamp(ctx.strike || 0, 0, 2), [tx, ty] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46), p = pow(ctx) + s * 0.2, base = ty + h * 0.35;
      fxParticles(tx, base, { count: 10 + 4 * s, colors: ICE_BLUE, size: [5, 10], spread: 100 * p, gravity: 70, angle: -90, cone: 170, ms: 620 });
      frostPuff(tx, base, 2 + s, { size: 46 + 10 * s, spread: w * 0.5 });
      for (let i = 0; i <= s; i++) later(i * 70, () => footprint(tx + (i - s / 2) * 36, ty + (i % 2 ? 8 : -6), (i % 2 ? 16 : -16) + fxRand(-6, 6), 30 + s * 5));
      ripple(tx, base, (150 + 40 * s) * p, 520);
      const [sx, sy] = stampPoint(ctx, (s - 1) * 24);
      slam(sx, sy, ['LEFT!', 'RIGHT!!', 'STOMP!!!'][s], { kind: s === 2 ? 'frost' : 'snow', size: 30 + s * 10 + (ctx.crit ? 8 : 0), rotate: [-10, 10, -3][s], ms: 650 + s * 150 });
      jolt(ctx.to, [{ transform: 'none' }, { transform: `translateY(${4 + s * 2}px) scale(1.04, 0.93)`, offset: 0.25 }, { transform: 'none' }], 300);
      fxShake(ctx.panel, 6 + s * 6, 260 + s * 60);
      if (s === 2) {
        // The finisher: one giant royal footprint
        later(120, () => {
          footprint(tx, ty, fxRand(-8, 8), 120 * Math.min(1.3, p), 900);
          crackBurst(tx, ty, 200, 'ice', fxRand(0, 60), 850);
          iceShards(tx, ty, { count: 12, spread: 160 });
          fxRing(tx, ty, { color: '#ffd96a', size: 280, width: 8, ms: 520 });
          fxShake(ctx.panel, 18, 420);
          sfx('heavy_slam', 1.3, 0.5);
          haptic(70);
        });
      }
    },
  };

  // ================= Ice Fishing (x4, lifesteal): the Emperor hooks you and reels in a feast =================
  CARD_FX['ice-fishing'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landAt(ctx), [w, h] = sizeOf(ctx.win, 120, 180), hx = x, hy = y + h * 0.2;
      frame(ctx.win, '#7ae0ff', 850);
      // An ice hole cracks open on the card...
      crackBurst(hx, hy, 90, 'ice', fxRand(0, 60), 500);
      play(hx, hy, '', [{ transform: 'scale(0.1)', opacity: 0 }, { transform: 'scale(1.12, 1)', opacity: 1, offset: 0.2 }, { transform: 'scale(1)', opacity: 1, offset: 0.85 },
        { transform: 'scale(0.9)', opacity: 0 }], 1000, { cls: 'fxi1-hole', size: [clamp(w * 0.8, 50, 90), 26] });
      // ...a fishing rod bobs over it, the bobber dipping in the water
      play(hx - 23, hy - 22, ROD, [{ transform: 'translate(-10px, -24px) rotate(-24deg)', opacity: 0 }, { transform: 'rotate(4deg)', opacity: 1, offset: 0.25 },
        { transform: 'translate(0, 4px) rotate(-2deg)', opacity: 1, offset: 0.42 }, { transform: 'rotate(4deg)', opacity: 1, offset: 0.6 },
        { transform: 'translate(0, 4px) rotate(-2deg)', opacity: 1, offset: 0.78 }, { transform: 'rotate(2deg)', opacity: 0 }], 1000, { cls: 'fxi1-svg fxi1-rod', size: [70, 80], style: { transformOrigin: '12% 95%' } });
      later(300, () => { bubbles(hx, hy, 3, { spread: 16, rise: 40 }); ripple(hx, hy, 70, 500); sfx('leech', 1.5, 0.25); });
      plate(ctx, '🎣 ICE FISHING', '#7ae0ff');
    },
    // The line casts in a high arc, unspooling behind the hook as it flies at the victim
    windup(ctx) {
      const to = at(ctx), from = launchPoint(ctx), aim = [to[0], to[1] - 4], pt = lobPt(from, aim, 90), ms = 360, segs = 10;
      play(from[0], from[1] - 20, ROD, [{ transform: 'rotate(30deg)', opacity: 0 }, { transform: 'rotate(-40deg)', opacity: 1, offset: 0.3 }, { transform: 'rotate(10deg)', opacity: 1, offset: 0.6 },
        { transform: 'rotate(0deg)', opacity: 0 }], 520, { cls: 'fxi1-svg fxi1-rod', size: [56, 64], style: { transformOrigin: '12% 95%' } });
      for (let k = 0; k < segs; k++) {
        const t = (k + 1) / segs * ms * 0.92;
        later(t, () => strand(pt(k / segs), pt((k + 1) / segs), { cls: 'fxi1-fline', ms: 880 - t, width: 2, grow: 0.06, hold: 0.8 }));
      }
      later(20, () => sfx('saw', 2.8, 0.12)); // the reel whirs
      return flyPath(pt, { html: HOOK, cls: 'fxi1-svg fxi1-hook', size: [22, 32], ms, spin: 200, scale: [0.7, ctx.crit ? 1.4 : 1.15], easing: 'linear' });
    },
    // The hook snags, the line snaps taut and YANKS the victim toward the Emperor (a crit: BIG CATCH!!)
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit, s = src(ctx);
      play(tx, ty - 4, HOOK, [{ transform: 'scale(1.3) rotate(0deg)', opacity: 1 }, { transform: 'scale(1.2) rotate(-18deg)', opacity: 1, offset: 0.25 },
        { transform: 'scale(1.2) rotate(12deg)', opacity: 1, offset: 0.5 }, { transform: 'scale(1) rotate(0deg)', opacity: 0 }], 520, { cls: 'fxi1-svg fxi1-hook', size: [26, 38] });
      strand([tx, ty], s, { cls: 'fxi1-taut', ms: 420, width: 3, grow: 0.12, hold: 0.55 });
      lunge(ctx.to, s, 22 + 8 * p, 400);
      core(tx, ty, 110 * p, 'frost', 360);
      drops(tx, ty, { count: 12, spread: 120 * p, gravity: 130, cone: 360 });
      sparkle(tx, ty, { count: 8, spread: 90 });
      fxRing(tx, ty, { color: '#7ae0ff', size: 170 * p, width: 6, ms: 420 });
      const [sx, sy] = stampPoint(ctx);
      slam(sx, sy, crit ? 'BIG CATCH!!' : 'YANK!', { kind: 'frost', size: crit ? 40 : Math.min(52, 30 + 10 * p), rotate: -6, ms: 850 });
      fxShake(ctx.panel, Math.min(18, 9 * p), 340);
    },
    // Lifesteal: fish fly out of the victim back to the Emperor, who gulps them down: GULP!
    gimmick(ctx) {
      const [bx, by] = src(ctx), [, bh] = sizeOf(ctx.from, 200, 46);
      frost.lifesteal(ctx, { html: '<i class="fxi1-fish">🐟</i>', n: 6 });
      later(470, () => {
        jolt(ctx.from, [{ transform: 'none' }, { transform: 'scale(1.12, 0.88)', offset: 0.3 }, { transform: 'scale(0.95, 1.06)', offset: 0.6 }, { transform: 'none' }], 440);
        slam(bx, by + bh * 0.5 + 18, 'GULP!', { kind: 'snow', size: 30, rotate: -6, ms: 800 });
        bubbles(bx, by - 6, 4, { spread: 40, rise: 50 });
        sfx('bite', 1.2, 0.5);
      });
    },
  };
})();
