// Card effects: Volcano group 2 - the Fire Hawk (hard) with the Inferno Hawk and Cinder Roc, and the Magma Golem
// (nightmare) with the Obsidian Golem and Volcano Titan (see js/card-fx.js for when each hook fires).
// The hawks bring flaming comets, fire tornadoes, choking ash, molten talons, heat mirages and cinder storms;
// the golems bring stone fists, earthquakes, magma armor, obsidian glass, a beating magma heart and eruptions.
// Built on the region kit (RFX, js/fx/region-kit.js). Styles live in css/fx/volcano-2.css (prefix fxv2-).
(() => {
  const { clamp, later, wait, at, src, sizeOf, pow, dirOf, jolt, slotFace, faceJiggle, lunge, knock, remember, launchPoint,
    slam, stampPoint, plate, frame, show, glint, speedLines, slash, crackBurst, core, dim, shadow, reticle, charge, orbit,
    aimFly, VIG, FLAME, FIRE_COLS, flames, embers, sparks, smoke, lavaBlobs, rocks, ashFall, scorch, heatWave, lavaJet, fire } = RFX;

  // ---------- Graphics (inline SVG, no image files) ----------
  // A hawk seen from above, wings swept back, diving head-first inside a comet of fire (points RIGHT)
  const HAWK_COMET = '<svg viewBox="0 0 160 64">' +
    '<path d="M0 32 C30 10 70 6 112 18 L140 32 L112 46 C70 58 30 54 0 32Z" fill="#ff3d00" opacity=".75"/>' +
    '<path d="M24 32 C50 18 80 16 116 24 L138 32 L116 40 C80 48 50 46 24 32Z" fill="#ff9a1f"/>' +
    '<path d="M60 32 C80 25 100 25 122 28 L136 32 L122 36 C100 39 80 39 60 32Z" fill="#fff3a0"/>' +
    '<path d="M154 32 L138 27 L110 3 L104 7 L116 28 L98 29 L84 21 L89 32 L84 43 L98 35 L116 36 L104 57 L110 61 L138 37 Z" ' +
    'fill="#8a1a00" stroke="#ffd23f" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<path d="M144 32 L98 32" stroke="#ff6a00" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M154 32 L145 29 L145 35 Z" fill="#ffd23f"/></svg>';
  // A small shooting star (points RIGHT): tapered flame tail and a twinkling head
  const STREAK = '<svg viewBox="0 0 100 24"><path d="M0 12 L84 5 L84 19 Z" fill="#ff6a00" opacity=".7"/>' +
    '<path d="M30 12 L86 8 L86 16 Z" fill="#ffd23f"/>' +
    '<path d="M88 1 L91 9 L99 12 L91 15 L88 23 L85 15 L77 12 L85 9 Z" fill="#fffbe0" stroke="#ff8a1f" stroke-width="1.5"/></svg>';
  // A lumpy cloud (ash grey, or a black thundercloud with a glowing underside)
  const cloudSvg = (body, edge, shade, hi, dots) => '<svg viewBox="0 0 120 70">' +
    `<path d="M18 62 C4 62 2 44 14 40 C10 26 28 18 38 26 C42 10 66 6 74 22 C84 12 104 18 102 34 C116 36 118 60 102 62 Z" fill="${body}" stroke="${edge}" stroke-width="4" stroke-linejoin="round"/>` +
    `<path d="M16 55 C28 49 38 53 46 47 C56 53 66 47 74 53 C84 47 96 53 106 51" fill="none" stroke="${shade}" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M28 32 C32 26 38 25 43 29 M62 19 C66 14 72 15 75 20" fill="none" stroke="${hi}" stroke-width="4" stroke-linecap="round"/>` + dots + '</svg>';
  const ASH_CLOUD = cloudSvg('#6a6058', '#1e1a16', '#4a423c', '#a09890', '<circle cx="40" cy="58" r="2.5" fill="#ff8a1f"/><circle cx="80" cy="59" r="2" fill="#ffb300"/>');
  const STORM_CLOUD = cloudSvg('#2a2430', '#0a080c', '#ff5a00', '#5a5060', '<g fill="#ffb300"><circle cx="30" cy="67" r="2.5"/><circle cx="58" cy="69" r="2"/><circle cx="90" cy="67" r="2.5"/></g>');
  // A zigzag lightning bolt (stretched to fit between a cloud and its target)
  const BOLT = '<svg viewBox="0 0 40 120" preserveAspectRatio="none"><polygon points="25,0 7,56 20,56 5,120 36,44 23,44 35,0" ' +
    'fill="#fff6a0" stroke="#ff8a1f" stroke-width="3" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>' +
    '<polygon points="27,6 14,52 25,52 16,98 30,48 19,48 30,6" fill="#fff"/></svg>';
  // Red-hot talons: a scaly leg and three hooked claws glowing at the edges (points RIGHT)
  const TALONS = '<svg viewBox="0 0 110 80">' +
    '<path d="M0 34 Q16 30 30 34 L32 48 Q16 52 0 48 Z" fill="#6a2410" stroke="#200600" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M6 36 V46 M14 35 V47 M22 35 V47" stroke="#3a1206" stroke-width="2"/>' +
    '<g fill="#ff6a00" stroke="#4a0c00" stroke-width="3" stroke-linejoin="round">' +
    '<path d="M28 34 C44 12 74 2 100 14 C84 12 64 20 42 42 Z"/><path d="M32 40 C56 32 86 36 106 54 C88 46 62 46 38 50 Z"/>' +
    '<path d="M28 48 C42 62 64 74 90 76 C70 80 48 74 30 58 Z"/></g>' +
    '<g fill="none" stroke="#fff3a0" stroke-width="2.5" stroke-linecap="round"><path d="M44 30 C60 18 76 12 92 14"/>' +
    '<path d="M48 42 C66 40 84 42 98 50"/><path d="M42 58 C54 66 66 72 82 74"/></g>' +
    '<circle cx="34" cy="42" r="9" fill="#8a3414" stroke="#200600" stroke-width="3"/></svg>';
  // A shimmering heat-haze disc (the Heat Mirage's shield plates)
  const HAZE = '<svg viewBox="0 0 30 40"><ellipse cx="15" cy="20" rx="13" ry="18" fill="#ffd23f40" stroke="#fff3a0" stroke-width="2.5"/>' +
    '<path d="M6 14 Q10 11 15 14 T24 14 M6 22 Q10 19 15 22 T24 22 M6 30 Q10 27 15 30 T24 30" fill="none" stroke="#ffe8a0" stroke-width="2" stroke-linecap="round"/></svg>';
  // A giant stone fist punching RIGHT: forearm, curled fingers, thumb, glowing lava cracks
  const FIST = '<svg viewBox="0 0 110 80">' +
    '<path d="M2 24 L30 20 L32 62 L2 58 Z" fill="#4a3a34" stroke="#1a0e0a" stroke-width="4" stroke-linejoin="round"/>' +
    '<path d="M26 16 Q28 6 44 6 L88 8 Q104 10 104 24 L104 58 Q104 74 88 74 L44 74 Q28 74 26 62 Z" fill="#6a5a50" stroke="#1a0e0a" stroke-width="4" stroke-linejoin="round"/>' +
    '<path d="M68 9 V74 M68 27 H104 M68 42 H104 M68 58 H104" fill="none" stroke="#2a1e1a" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M34 44 Q52 36 72 44 Q78 54 68 60 L38 60 Q30 54 34 44 Z" fill="#7a6a60" stroke="#1a0e0a" stroke-width="3.5" stroke-linejoin="round"/>' +
    '<path d="M36 18 L46 28 L42 36 M86 64 L92 54 M50 66 L56 70" fill="none" stroke="#ff8a1f" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M34 12 L62 11 M74 13 L96 15" stroke="#9a8a80" stroke-width="3" stroke-linecap="round"/></svg>';
  // A huge stone foot seen from the side (toes to the right, sole at the bottom)
  const FOOT = '<svg viewBox="0 0 110 100">' +
    '<path d="M22 0 H58 L62 54 H18 Z" fill="#4a3a34" stroke="#1a0e0a" stroke-width="4" stroke-linejoin="round"/>' +
    '<path d="M10 58 Q10 44 28 44 L64 46 Q96 48 104 70 Q108 86 94 88 L16 88 Q6 88 8 72 Z" fill="#6a5a50" stroke="#1a0e0a" stroke-width="4" stroke-linejoin="round"/>' +
    '<path d="M78 62 Q83 55 89 60 M88 70 Q94 63 100 69" fill="none" stroke="#2a1e1a" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M12 85 H98" stroke="#2a1a14" stroke-width="4"/>' +
    '<path d="M28 56 L38 66 L34 76 M52 10 L46 26" fill="none" stroke="#ff8a1f" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M28 6 V40 M18 52 L50 51" stroke="#8a7a70" stroke-width="3" stroke-linecap="round"/></svg>';
  // Three black obsidian-glass blades fanned from a knuckle, purple edges (points RIGHT)
  const OBS_CLAW = '<svg viewBox="0 0 110 80">' +
    '<g stroke="#b07cff" stroke-width="2.5" stroke-linejoin="round"><path d="M14 36 L98 4 L78 30 L30 44 Z" fill="#1a0e26"/>' +
    '<path d="M16 42 L108 42 L82 52 L30 50 Z" fill="#241634"/><path d="M14 48 L98 78 L78 56 L30 50 Z" fill="#1a0e26"/></g>' +
    '<g fill="none" stroke="#e8d0ff" stroke-width="2" stroke-linecap="round"><path d="M36 38 L86 12"/><path d="M40 45 L96 44"/><path d="M36 50 L86 70"/></g>' +
    '<path d="M2 32 L24 30 L28 54 L2 52 Z" fill="#2a1a3a" stroke="#b07cff" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<path d="M60 20 L66 26 M70 44 L76 40 M60 62 L66 58" stroke="#ff4b1f" stroke-width="2" stroke-linecap="round"/></svg>';
  // A heart of dark rock with glowing magma cracks and a white-hot core
  const HEART_CRACKS = ['50,40 40,30 30,26 20,30', '50,40 62,28 74,24', '50,40 46,54 52,66 50,78', '50,40 66,48 80,40', '50,40 34,50 22,44'];
  const HEART = '<svg viewBox="0 0 100 90">' +
    '<path d="M50 86 C18 64 4 48 4 28 C4 12 16 4 29 4 C39 4 46 10 50 18 C54 10 61 4 71 4 C84 4 96 12 96 28 C96 48 82 64 50 86 Z" fill="#3a1e18" stroke="#1a0806" stroke-width="4" stroke-linejoin="round"/>' +
    '<circle cx="50" cy="40" r="17" fill="#ff5a00" opacity=".55"/>' +
    [['#ff6a00', 6], ['#fff3a0', 2.5]].map(([c, w]) => `<g fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">` +
      HEART_CRACKS.map(p => `<polyline points="${p}"/>`).join('') + '</g>').join('') +
    '<circle cx="50" cy="40" r="6" fill="#fff3a0"/><path d="M16 24 Q20 13 31 12" stroke="#7a5a50" stroke-width="4" fill="none" stroke-linecap="round"/></svg>';
  // A smoking volcano cone with a lava-filled crater and lava streams
  const VOLCANO = '<svg viewBox="0 0 120 90">' +
    '<path d="M2 88 L42 22 Q60 14 78 22 L118 88 Z" fill="#4a3a34" stroke="#1a0e0a" stroke-width="4" stroke-linejoin="round"/>' +
    '<path d="M42 22 Q60 32 78 22 Q60 12 42 22 Z" fill="#ffb300" stroke="#1a0e0a" stroke-width="3"/>' +
    '<path d="M50 26 Q46 40 38 52 Q34 60 36 66 M68 27 Q72 44 82 56 M59 29 Q61 40 57 50" fill="none" stroke="#ff5a00" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M50 26 Q46 40 38 52 M68 27 Q72 44 82 56" fill="none" stroke="#ffd23f" stroke-width="2" stroke-linecap="round"/>' +
    '<path d="M28 62 L18 82 M92 60 L102 80" stroke="#6a5a50" stroke-width="4" stroke-linecap="round"/></svg>';
  // A curling wave of lava, crest to the RIGHT (the way it rolls)
  const WAVE = '<svg viewBox="0 0 130 80">' +
    '<path d="M0 80 L0 56 Q18 44 40 46 Q70 48 86 30 Q98 12 114 12 Q128 14 126 28 Q124 36 114 34 Q118 26 110 24 Q100 26 100 40 Q100 60 112 80 Z" fill="#ff5a00" stroke="#4a0c00" stroke-width="3.5" stroke-linejoin="round"/>' +
    '<path d="M4 64 Q24 54 44 56 Q72 58 90 40 Q98 30 106 30" fill="none" stroke="#ffb300" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="M88 30 Q98 16 112 16 Q122 18 122 26" fill="none" stroke="#fff3a0" stroke-width="3.5" stroke-linecap="round"/>' +
    '<g fill="#3a1208"><ellipse cx="30" cy="69" rx="7" ry="3"/><ellipse cx="62" cy="65" rx="6" ry="2.5"/><ellipse cx="86" cy="71" rx="5" ry="2.5"/></g></svg>';
  // A crown of lava spikes and droplets thrown up by a splash
  const SPLASH = '<svg viewBox="0 0 120 80"><g fill="#ff6a00" stroke="#5a1000" stroke-width="3" stroke-linejoin="round">' +
    '<path d="M4 78 Q14 52 8 32 Q24 50 30 78 Z"/><path d="M26 78 Q32 38 38 14 Q50 42 52 78 Z"/><path d="M48 78 Q56 30 62 4 Q72 34 74 78 Z"/>' +
    '<path d="M70 78 Q78 40 86 18 Q94 46 94 78 Z"/><path d="M90 78 Q100 50 112 34 Q110 56 116 78 Z"/></g>' +
    '<g fill="#ffd23f"><path d="M38 26 Q42 46 44 72 L36 72 Q36 46 38 26Z"/><path d="M62 16 Q66 40 66 72 L58 72 Q58 40 62 16Z"/><path d="M86 30 Q88 50 88 72 L80 72 Q80 50 86 30Z"/></g>' +
    '<g fill="#ff8a1f" stroke="#5a1000" stroke-width="2.5"><circle cx="20" cy="18" r="5"/><circle cx="50" cy="6" r="4"/><circle cx="100" cy="14" r="5"/><circle cx="78" cy="5" r="3.5"/></g>' +
    '<ellipse cx="60" cy="76" rx="58" ry="6" fill="#ff5a00" stroke="#5a1000" stroke-width="3"/></svg>';
  // A fire tornado: stacked spinning flame rings (CSS spins them) over a glowing funnel. [top %, width %, sway px, spin s]
  const TW_RINGS = [[10, 100, 0, 0.26], [26, 82, 3, 0.3], [42, 66, -3, 0.24], [58, 50, 4, 0.28], [73, 36, -2, 0.22], [87, 24, 2, 0.26]];
  const TORNADO = '<div class="fxv2-tor-sway"><i class="fxv2-funnel"></i>' + TW_RINGS.map(([y, w, dx, d]) =>
    `<b class="fxv2-tw" style="top:${y}%;width:${w}%;--x:${dx}px"><i style="--d:${d}s"></i></b>`).join('') + '</div>';
  const MINI_FLAME = () => `<i class="fxv2-mini-flame">${FLAME}</i>`;
  const TWINKLE = ['#fff', '#fff3a0', '#ffd23f'];
  const VIOLET = ['#fff', '#e8d0ff', '#b07cff'];

  // ---------- Small helpers ----------
  const faceXY = ctx => fxPoint(ctx.slot || ctx.win);                  // the landed card
  const faceSize = ctx => sizeOf(slotFace(ctx) || ctx.slot, 58, 80);
  const sideOf = ctx => Math.sign(src(ctx)[0] - at(ctx)[0]) || 1;      // which side the attacker is on
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  // A stamped word that always fits on screen: shrinks for long words and slides in from the edges
  function word(x, y, text, opts = {}) {
    const len = [...text].length, size = Math.min(opts.size || 36, (innerWidth - 24) / (len * 0.56)), half = len * size * 0.28 + 10;
    return slam(clamp(x, half, Math.max(half, innerWidth - half)), y, text, { ...opts, size });
  }
  // Resolve after `ms` with whatever fn starts (so a windup's promise can wait for a delayed flight), never later than `cap`
  const after = (ms, fn, cap = 440) => new Promise(res => { later(ms, () => Promise.resolve(fn()).then(res, res)); later(cap, res); });
  // Fly a graphic that points RIGHT, staying upright: going leftward it's mirrored instead of turned upside down
  // (fists, talons, waves). bob: px it bounces up and down on the way; tilt: false keeps it level.
  function aim(from, to, { html = '', cls = '', ms = 320, arc = 0, scale = [1, 1], trail = '', trailEvery = 30, easing = 'ease-in', bob = 0, tilt = true } = {}) {
    const el = fxSpawn(from[0], from[1], { cls, html, ms: ms + 60 });
    if (!el) return Promise.resolve();
    const d = dirOf(from, to), flip = d.dx < 0 ? -1 : 1;
    const pt = t => [d.dx * t + d.nx * Math.sin(Math.PI * t) * arc, d.dy * t + d.ny * Math.sin(Math.PI * t) * arc - Math.abs(Math.sin(t * Math.PI * 3)) * bob];
    const frames = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10, [px, py] = pt(t), [qx, qy] = pt(Math.min(1, t + 0.05)), [rx, ry] = pt(Math.max(0, t - 0.05));
      let ang = tilt ? Math.atan2(qy - ry, qx - rx) * 180 / Math.PI - (flip < 0 ? 180 : 0) : 0;
      ang = ((ang + 540) % 360) - 180;
      const s = scale[0] + (scale[1] - scale[0]) * t;
      frames.push({ transform: `translate(${px}px, ${py}px) rotate(${ang}deg) scale(${s * flip}, ${s})` });
    }
    let timer = 0;
    const start = performance.now(), end = () => { clearInterval(timer); el.remove(); };
    if (trail) timer = setInterval(() => {
      const t = (performance.now() - start) / ms;
      if (t > 1.05) { clearInterval(timer); return; } // stop on the clock too, not only when the animation reports finished
      try { const [px, py] = pt(Math.min(1, t)); fxSpawn(from[0] + px, from[1] + py, { cls: trail, ms: 420 }); } catch (e) { clearInterval(timer); }
    }, trailEvery);
    return Promise.race([fxAnimate(el, frames, ms, easing), wait(ms + 20)]).then(end);
  }
  // A flame ring lying flat and spinning (the inner ring spins in CSS; this squashes it and lifts it up)
  function spinRing(x, y, w, { ms = 600, rise = 60, grow = 1.4, delay = 0, squash = 0.3 } = {}) {
    later(delay, () => {
      const el = fxSpawn(x, y, { cls: 'fxv2-spinring', html: `<i style="--d:${fxRand(0.22, 0.32).toFixed(2)}s"></i>`, ms: ms + 40, size: [w, w] });
      fxAnimate(el, [
        { transform: `translate(0, 0) scale(0.4, ${0.4 * squash})`, opacity: 0 },
        { transform: `translate(0, ${-rise * 0.35}px) scale(1, ${squash})`, opacity: 1, offset: 0.3 },
        { transform: `translate(0, ${-rise}px) scale(${grow}, ${grow * squash})`, opacity: 0 },
      ], ms, 'ease-out');
    });
  }
  // Embers flung out on a spiral (a whirlwind throwing sparks)
  function spiral(x, y, { n = 10, r = 110, ms = 700, turns = 0.9, dir = 1, colors = FIRE_COLS } = {}) {
    for (let i = 0; i < n; i++) {
      const s = fxRand(4, 8), col = colors[i % colors.length], k = fxRand(0.8, 1.1), a0 = (i / n) * Math.PI * 2;
      const el = fxSpawn(x, y, { cls: 'fx-particle', ms: ms + 40, size: [s, s], style: { background: col, boxShadow: `0 0 ${s}px ${col}` } });
      if (!el) return;
      const frames = [];
      for (let j = 0; j <= 8; j++) {
        const t = j / 8, a = a0 + dir * t * turns * Math.PI * 2, rr = r * k * t;
        frames.push({ transform: `translate(${Math.cos(a) * rr}px, ${Math.sin(a) * rr * 0.55 - t * 24}px) scale(${1 - t * 0.6})`, opacity: t > 0.75 ? (1 - t) * 4 : 1 });
      }
      fxAnimate(el, frames, ms * k, 'ease-out');
    }
  }
  // One soft puff (ash, dust or storm cloud) that swells and drifts
  function puff(x, y, size, { dx = 0, dy = -20, ms = 800, cls = 'fxv2-puff', delay = 0 } = {}) {
    later(delay, () => {
      const el = fxSpawn(x, y, { cls, ms: ms + 40, size: [size, size] });
      fxAnimate(el, [
        { transform: 'translate(0, 0) scale(0.3)', opacity: 0 },
        { transform: `translate(${dx * 0.4}px, ${dy * 0.4}px) scale(1)`, opacity: 0.95, offset: 0.3 },
        { transform: `translate(${dx}px, ${dy}px) scale(1.6)`, opacity: 0 },
      ], ms * fxRand(0.85, 1), 'ease-out');
    });
  }
  // Tan dust clouds kicked up along the ground
  function dust(x, y, n = 4, { size = 48, spread = 60, rise = 24, ms = 800 } = {}) {
    for (let i = 0; i < n; i++) puff(x + (n > 1 ? (i / (n - 1) - 0.5) * spread : 0), y, size * fxRand(0.8, 1.2),
      { dx: (n > 1 ? (i / (n - 1) - 0.5) : 0) * spread * 0.8, dy: -rise, ms, cls: 'fxv2-dust' });
  }
  // A shockwave ring lying flat on the ground
  function groundRing(x, y, w, { color = '#d8a060', ms = 440, width = 5 } = {}) {
    const el = fxSpawn(x, y, { cls: 'fx-ring', ms, size: [w, w * 0.3], style: { borderColor: color, borderWidth: width + 'px' } });
    fxAnimate(el, [{ transform: 'scale(0.15)', opacity: 1 }, { transform: 'scale(1)', opacity: 0 }], ms, 'cubic-bezier(.1,.8,.3,1)');
  }
  // A glowing burn line left behind by a red-hot claw
  function burnMark(x, y, deg, len, ms = 800, width = 8) {
    const a = deg * Math.PI / 180, dx = Math.cos(a) * len / 2, dy = Math.sin(a) * len / 2;
    fxBeam([x - dx, y - dy], [x + dx, y + dy], { cls: 'fxv2-burnline', ms, width });
  }
  // Lightning cracking down from y0 to y1, flickering
  function bolt(x, y0, y1, s = 1, ms = 260) {
    const len = Math.max(40, y1 - y0);
    const el = fxSpawn(x, y0 + len / 2, { cls: 'fxr-svg fxv2-bolt', html: BOLT, ms: ms + 30, size: [36 * s, len], style: { transformOrigin: '50% 0' } });
    fxAnimate(el, [
      { transform: 'scale(1, 0.15)', opacity: 1 },
      { transform: 'scale(1, 1)', opacity: 1, offset: 0.2 },
      { transform: 'scale(1.15, 1)', opacity: 0.3, offset: 0.38 },
      { transform: 'scale(1, 1)', opacity: 1, offset: 0.52 },
      { transform: 'scale(0.8, 1)', opacity: 0 },
    ], ms, 'linear');
  }
  // A sparkler spark falling straight down
  function fallSpark(x, y, fall, ms = 480) {
    const el = fxSpawn(x, y, { cls: 'fxv2-spark', ms: ms + 40 });
    fxAnimate(el, [{ transform: 'translate(0, 0) scale(0.6)', opacity: 0 }, { transform: `translate(0, ${fall * 0.3}px) scale(1)`, opacity: 1, offset: 0.25 },
      { transform: `translate(${fxRand(-6, 6)}px, ${fall}px) scale(0.5)`, opacity: 0 }], ms * fxRand(0.8, 1), 'ease-in');
  }
  // Black cinders with glowing hearts drifting down under a storm cloud
  function cinderFall(x, y, w, n, fall, ms = 800) {
    for (let i = 0; i < n; i++) later(i * (ms / n / 2), () => {
      const s = fxRand(4, 8), el = fxSpawn(x + fxRand(-w / 2, w / 2), y, { cls: 'fxv2-cinder', ms: ms + 40, size: [s, s] });
      fxAnimate(el, [{ transform: 'translate(0, 0) rotate(0deg)', opacity: 0 }, { transform: `translate(${fxRand(-10, 10)}px, ${fall * 0.4}px) rotate(180deg)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${fxRand(-18, 18)}px, ${fall}px) rotate(420deg)`, opacity: 0 }], ms * fxRand(0.75, 1), 'linear');
    });
  }
  // A lava bubble swelling up and popping
  function bubble(x, y, s, ms = 420) {
    const el = fxSpawn(x, y, { cls: 'fxv2-bubble', ms: ms + 40, size: [s, s] });
    fxAnimate(el, [{ transform: 'translate(0, 4px) scale(0.2)', opacity: 0 }, { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0.6 },
      { transform: 'translate(0, -2px) scale(1.15, 0.9)', opacity: 1, offset: 0.8 }, { transform: 'translate(0, -4px) scale(1.5)', opacity: 0 }], ms, 'ease-out');
    later(ms * 0.8, () => fxRing(x, y - 2, { color: '#ffb300', size: s * 2.4, width: 2, ms: 260 }));
  }
  // A drip of lava running down; harden = it cools into a stone drop as it goes
  function drip(x, y, fall, harden = true, ms = 800) {
    const el = fxSpawn(x, y, { cls: 'fxv2-drip', html: '<i class="fxv2-hot"></i>' + (harden ? '<i class="fxv2-cold"></i>' : ''), ms: ms + 40, vars: { '--t': ms + 'ms' } });
    fxAnimate(el, [{ transform: 'translate(0, 0) scale(1, 0.4)', opacity: 0 }, { transform: 'translate(0, 3px) scale(1, 1)', opacity: 1, offset: 0.15 },
      { transform: `translate(0, ${fall}px) scale(0.85, 1.4)`, opacity: 1, offset: 0.7 }, { transform: `translate(0, ${fall * 1.05}px) scale(0.9, 1.2)`, opacity: 0 }], ms, 'ease-in');
  }
  // A glowing patch spreading over the ground (the earth about to blow)
  function groundGlow(x, y, w, ms = 440) {
    const el = fxSpawn(x, y, { cls: 'fxv2-groundglow', ms: ms + 60, size: [w, w * 0.34] });
    fxAnimate(el, [{ transform: 'scale(0.2)', opacity: 0.3 }, { transform: 'scale(0.9)', opacity: 0.85, offset: 0.6 },
      { transform: 'scale(1.05)', opacity: 1, offset: 0.9 }, { transform: 'scale(1.1)', opacity: 0.6 }], ms, 'ease-in');
  }
  // A long low rumble on any element (lots of tiny jitters)
  function rumble(el, px = 3, ms = 600) {
    const k = [];
    for (let i = 0; i <= 12; i++) k.push({ transform: i === 0 || i === 12 ? 'none' : `translate(${(i % 2 ? 1 : -1) * px * fxRand(0.5, 1)}px, ${fxRand(-0.5, 0.5) * px}px)` });
    jolt(el, k, ms, { easing: 'linear' });
  }
  // The heartbeat: two thumps, then a slow fade
  const BEAT = [
    { transform: 'scale(0.3)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: 0.14 },
    { transform: 'scale(1.28)', opacity: 1, offset: 0.26 }, { transform: 'scale(0.94)', opacity: 1, offset: 0.36 },
    { transform: 'scale(1.22)', opacity: 1, offset: 0.46 }, { transform: 'scale(1)', opacity: 1, offset: 0.6 },
    { transform: 'scale(1)', opacity: 0.9, offset: 0.86 }, { transform: 'scale(0.9)', opacity: 0 },
  ];
  // A ghost copy of the landed card drifting off in the heat (a mirage)
  function ghostCard(ctx, { dx = 40, dy = -30, ms = 850, delay = 0, peak = 0.6 } = {}) {
    const face = slotFace(ctx);
    if (!face) return;
    const [x, y] = fxPoint(face), [w, h] = sizeOf(face, 58, 80);
    later(delay, () => {
      const el = fxSpawn(x, y, { cls: 'fxv2-ghost', ms: ms + 40, size: [w, h] });
      if (!el) return;
      const c = face.cloneNode(true);
      c.removeAttribute('style');
      el.appendChild(c);
      fxAnimate(el, [
        { transform: 'translate(0, 0) scale(1) skewX(0deg)', opacity: 0 },
        { transform: `translate(${dx * 0.3}px, ${dy * 0.3}px) scale(1.04) skewX(-7deg)`, opacity: peak, offset: 0.25 },
        { transform: `translate(${dx * 0.65}px, ${dy * 0.65}px) scale(1.08) skewX(7deg)`, opacity: peak * 0.7, offset: 0.6 },
        { transform: `translate(${dx}px, ${dy}px) scale(1.15) skewX(-4deg)`, opacity: 0 },
      ], ms, 'ease-out');
    });
  }
  // A flickering mirror image of the attacker's HP box, sliding out to one side
  function mirrorBox(ctx, dx, delay = 0, ms = 900) {
    if (!ctx.from?.cloneNode) return;
    const [x, y] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46);
    later(delay, () => {
      const el = fxSpawn(x, y, { cls: 'fxv2-mirror', ms: ms + 40, size: [w, h] });
      if (!el) return;
      const c = ctx.from.cloneNode(true);
      c.removeAttribute('id');
      el.appendChild(c);
      fxAnimate(el, [
        { transform: 'translate(0, 0) skewX(0deg)', opacity: 0 },
        { transform: `translate(${dx * 0.5}px, -2px) skewX(-8deg)`, opacity: 0.55, offset: 0.15 },
        { transform: `translate(${dx * 0.7}px, 1px) skewX(6deg)`, opacity: 0.15, offset: 0.3 },
        { transform: `translate(${dx * 0.85}px, -1px) skewX(-5deg)`, opacity: 0.6, offset: 0.45 },
        { transform: `translate(${dx}px, 0) skewX(4deg)`, opacity: 0.2, offset: 0.6 },
        { transform: `translate(${dx}px, 0) skewX(-3deg)`, opacity: 0.5, offset: 0.75 },
        { transform: `translate(${dx * 1.1}px, -4px) skewX(0deg)`, opacity: 0 },
      ], ms, 'linear');
    });
  }
  // A see-through hawk shimmering in and out of the heat
  function hawkGhost(x, y, flip = 1, ms = 700) {
    const el = fxSpawn(x, y, { cls: 'fxv2-hawkghost', html: `<span style="display:inline-block;transform:scaleX(${flip})">🦅</span>`, ms: ms + 40 });
    fxAnimate(el, [
      { transform: 'scale(0.6) skewX(0deg)', opacity: 0 }, { transform: 'scale(1) skewX(-8deg)', opacity: 0.65, offset: 0.2 },
      { transform: 'scale(1.02) skewX(10deg)', opacity: 0.15, offset: 0.35 }, { transform: 'scale(1.04) skewX(-6deg)', opacity: 0.6, offset: 0.5 },
      { transform: 'scale(1.06) skewX(6deg)', opacity: 0.1, offset: 0.7 }, { transform: 'scale(1.15) skewX(0deg)', opacity: 0 },
    ], ms, 'linear');
  }
  // Obsidian shards swarming in to a point (they're about to form the claw)
  function swarm(x, y, n = 10, r = 80, ms = 170) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + fxRand(-0.3, 0.3), d = r * fxRand(0.7, 1.2), s = fxRand(7, 12);
      const el = fxSpawn(x + Math.cos(a) * d, y + Math.sin(a) * d, { cls: 'fx-particle fxr-obsid', ms: ms + 30, size: [s, s] });
      fxAnimate(el, [
        { transform: 'translate(0, 0) rotate(0deg) scale(1)', opacity: 0 },
        { transform: `translate(${-Math.cos(a) * d * 0.5}px, ${-Math.sin(a) * d * 0.5}px) rotate(200deg) scale(1)`, opacity: 1, offset: 0.4 },
        { transform: `translate(${-Math.cos(a) * d}px, ${-Math.sin(a) * d}px) rotate(420deg) scale(0.5)`, opacity: 0.8 },
      ], ms, 'ease-in');
    }
  }

  // ================= Blazing Dive (x5): the hawk dives out of the sky as a flaming comet =================
  CARD_FX['blazing-dive'] = {
    // A shooting star streaks across the card
    land(ctx) {
      remember(ctx);
      const [x, y] = faceXY(ctx), [w, h] = faceSize(ctx);
      frame(ctx.win, '#ff8a1f', 750);
      fxTint(VIG.sun, { ms: 700, opacity: 0.35 });
      const a = [x - w * 1.1, y - h * 0.75], b = [x + w * 1.1, y + h * 0.55];
      later(70, () => fxBeam(a, b, { cls: 'fxv2-starbeam', ms: 560, width: 5 }));
      aim(a, b, { html: STREAK, cls: 'fxv2-streak', ms: 340, trail: 'fxr-trail-sun', trailEvery: 26, easing: 'ease-in-out' })
        .then(() => { sparks(b[0], b[1], { count: 8, spread: 60 }); fxRing(b[0], b[1], { color: '#fff3a0', size: 60, width: 3, ms: 300 }); });
      later(170, () => fxParticles(x, y, { count: 8, html: '✦', colors: TWINKLE, size: [5, 9], spread: 70, ms: 600, spin: 120 }));
      later(200, () => glint(ctx.slot));
      faceJiggle(ctx, [{ transform: 'none' }, { transform: 'translate(2px, 2px) rotate(2deg)' }, { transform: 'none' }], 260);
      plate(ctx, '🌠 BLAZING DIVE', '#ff8a1f', 'fire');
    },
    // A shadow grows on the victim while the hawk plunges from high above, a comet of fire pointing down its path
    windup(ctx) {
      const [tx, ty] = at(ctx), sd = sideOf(ctx);
      dim(VIG.fire, ctx.crit ? 0.7 : 0.5, 420);
      shadow(tx, ty + 16, 150, 36, 360);
      later(30, () => sfx('eagle', 1.15, 0.45)); // the screech
      later(230, () => speedLines(tx, ty, { n: 6, r0: 70, r1: 140, cls: 'fxr-line-fire', ms: 220 }));
      return aim([tx + sd * 170, -110], [tx, ty], { html: HAWK_COMET, cls: 'fxv2-comet', ms: 360, scale: [0.55, ctx.crit ? 1.5 : 1.25],
        trail: 'fxv2-trail-comet', trailEvery: 26, easing: 'cubic-bezier(.5,0,1,.6)' });
    },
    // A fiery crash: flaming feathers burst everywhere and flutter down
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit, [w, h] = sizeOf(ctx.to, 200, 46);
      fxTint('#ff6a00', { ms: 420, opacity: crit ? 0.42 : 0.3 });
      core(tx, ty, 170 * p, 'fire', 420);
      fxRing(tx, ty, { color: '#fff3a0', size: 150 * p, width: 6, ms: 380 });
      later(70, () => fxRing(tx, ty, { color: '#ff3d00', size: 250 * p, width: 9, ms: 500 }));
      crackBurst(tx, ty + 8, 170 * p, 'lava', fxRand(-20, 20), 850);
      fxParticles(tx, ty, { count: Math.round(10 + 3 * p), html: () => '<i class="fxv2-feather"></i>', colors: ['#fff'], size: [7, 11],
        spread: 150 * p, gravity: 40, ms: 1000, spin: 280 });
      sparks(tx, ty, { count: 12, spread: 150 * p, gravity: 80 });
      flames(tx, ty + h * 0.45, { n: 5, w: w * 0.7, h: 50 + 14 * p, ms: 650 });
      speedLines(tx, ty, { n: 8, r0: 50, r1: 150 * p, cls: 'fxr-line-fire', ms: 360 });
      const [sx, sy] = stampPoint(ctx);
      word(sx, sy, crit ? 'METEOR HAWK!!' : 'BLAZING DIVE!', { kind: crit ? 'sun' : 'fire', size: crit ? 40 : Math.min(46, 26 + 10 * p), rotate: -6, ms: 900, star: crit ? '#ff6a00' : null });
      jolt(ctx.to, [{ transform: 'none' }, { transform: 'translateY(10px) scale(1.05, 0.9)', offset: 0.25 }, { transform: 'translateY(-3px)', offset: 0.6 }, { transform: 'none' }], 380);
      fxShake(ctx.panel, Math.min(24, 12 * p), 420);
      haptic(50);
    },
  };

  // ================= Fire Tornado (x2, frenzy: 3 strikes): a whirling tornado of flame, bigger every strike =================
  CARD_FX['fire-tornado'] = {
    // A little fire whirl spins up out of the card
    land(ctx) {
      remember(ctx);
      const [x, y] = faceXY(ctx), [w, h] = faceSize(ctx);
      frame(ctx.win, '#ff6a00', 750);
      const tw = fxSpawn(x, y + h * 0.15, { cls: 'fxv2-tornado', html: TORNADO, ms: 900 });
      fxAnimate(tw, [
        { transform: 'translate(0, 20px) scale(0.1, 0.2)', opacity: 0 },
        { transform: 'translate(0, -6px) scale(0.75, 0.8)', opacity: 1, offset: 0.3 },
        { transform: 'translate(-4px, -14px) scale(0.8, 0.85)', opacity: 1, offset: 0.55 },
        { transform: 'translate(4px, -22px) scale(0.85, 0.9)', opacity: 1, offset: 0.75 },
        { transform: 'translate(0, -50px) scale(0.5, 1.1)', opacity: 0 },
      ], 900, 'ease-out');
      spiral(x, y + h * 0.2, { n: 10, r: 80, ms: 800, turns: 1.2 });
      later(100, () => orbit(x, y + h * 0.1, MINI_FLAME, 3, { rx: w * 0.6, ry: 10, ms: 800, size: 14, turns: 1.6 }));
      later(260, () => slam(x, y - h * 0.55, '×3', { kind: 'fire', size: 30, rotate: -8, ms: 700 }));
      plate(ctx, '🌀 FIRE TORNADO', '#ff6a00', 'fire');
    },
    // FIRESTORM: the hawk's own flame aura, plus a tornado of spinning rings spiralling up around its box
    gimmick(ctx) {
      const [x, y] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46);
      fire.frenzy(ctx, { word: 'FIRESTORM!' });
      for (let i = 0; i < 7; i++) spinRing(x + Math.sin(i * 1.3) * w * 0.08, y + h * 0.6, w * (0.5 + i * 0.09), { delay: i * 70, rise: h * 1.6 + 30, ms: 620, grow: 1.25 });
      const tw = fxSpawn(x, y - h * 0.2, { cls: 'fxv2-tornado', html: TORNADO, ms: 900 });
      fxAnimate(tw, [{ transform: 'scale(0.4, 0.3)', opacity: 0 }, { transform: 'scale(2.1, 1.3)', opacity: 0.55, offset: 0.3 },
        { transform: 'scale(2.3, 1.4)', opacity: 0.5, offset: 0.7 }, { transform: 'translate(0, -30px) scale(2.8, 1.6)', opacity: 0 }], 900, 'ease-out');
    },
    // The tornado travels to the victim: straight out of the wheel first, then from the hawk, bigger each strike
    windup(ctx) {
      const s = clamp(ctx.strike || 0, 0, 2), [tx, ty] = at(ctx);
      const from = s === 0 ? launchPoint(ctx) : [src(ctx)[0], src(ctx)[1] + 10];
      if (s === 2) dim(VIG.fire, 0.6, 320); // the finisher: the sky burns
      return aim(from, [tx, ty - 6], { tilt: false, html: TORNADO, cls: 'fxv2-tornado', ms: [340, 300, 270][s], arc: [50, -60, 40][s],
        scale: [0.5, (1 + s * 0.3) * (ctx.crit ? 1.15 : 1)], trail: 'fxr-trail-fire', trailEvery: 28, easing: 'cubic-bezier(.4,0,.8,.8)' });
    },
    // Fire swirls round the victim and embers spiral out: WHIRL! -> SWIRL!! -> INFERNO!!!
    impact(ctx) {
      const s = clamp(ctx.strike || 0, 0, 2), [tx, ty] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46), p = pow(ctx) + s * 0.2, k = 1 + s * 0.3;
      const tw = fxSpawn(tx, ty - 8, { cls: 'fxv2-tornado', html: TORNADO, ms: 520 });
      fxAnimate(tw, [{ transform: `scale(${k})`, opacity: 0.95 }, { transform: `scale(${k * 1.5}, ${k * 1.1})`, opacity: 0.7, offset: 0.4 },
        { transform: `translate(0, -20px) scale(${k * 2}, ${k * 1.2})`, opacity: 0 }], 500, 'ease-out');
      for (let i = 0; i <= s + 1; i++) spinRing(tx, ty + h * 0.4, w * (0.6 + i * 0.15), { delay: i * 60, rise: h + 30 * (s + 1), ms: 520, grow: 1.3 + s * 0.2 });
      orbit(tx, ty, MINI_FLAME, 3 + s * 2, { rx: w * (0.4 + s * 0.08), ry: 16 + s * 4, ms: 700, size: 16 + s * 3, turns: 1.4 });
      spiral(tx, ty, { n: 8 + s * 4, r: (90 + s * 30) * p, ms: 700, turns: 0.8 });
      sparks(tx, ty, { count: 8 + s * 4, spread: 110 * p });
      const [sx, sy] = stampPoint(ctx, (s - 1) * 22);
      word(sx, sy, ['WHIRL!', 'SWIRL!!', 'INFERNO!!!'][s], { kind: s === 2 ? 'lava' : 'fire', size: 30 + s * 10 + (ctx.crit ? 8 : 0),
        rotate: [-10, 8, -4][s], ms: 650 + s * 150, star: s === 2 ? '#ff6a00' : null });
      fxShake(ctx.panel, 6 + s * 6, 260 + s * 60);
      fxShake(ctx.to, 6 + s * 3, 260);
      if (s === 2) { fxTint(VIG.fire, { ms: 500, opacity: 0.55 }); heatWave(tx, ty, 260); haptic(60); }
    },
  };

  // ================= Ash Cloud (x2, stun: blind): a choking cloud of volcanic ash =================
  CARD_FX['ash-cloud'] = {
    // Grey ash billows up and over the card
    land(ctx) {
      remember(ctx);
      const [x, y] = faceXY(ctx), [w, h] = faceSize(ctx);
      frame(ctx.win, '#a09080', 750);
      fxTint(VIG.ash, { ms: 750, opacity: 0.45 });
      smoke(x, y + h * 0.3, 4, { size: 56, spread: w * 1.2, rise: 50, ms: 900 });
      later(80, () => show(x, y - h * 0.15, ASH_CLOUD, { cls: 'fxv2-cloud', size: [w * 1.7, w], ms: 850, from: 0.3, to: 1, rise: 14 }));
      later(160, () => ashFall(x, y - h * 0.3, w * 1.3, 10, { fall: h * 0.9, ms: 850 }));
      later(220, () => smoke(x, y - h * 0.1, 3, { size: 46, spread: w, rise: 30, ms: 700 }));
      plate(ctx, '🌫️ ASH CLOUD', '#b0a090', 'fire');
    },
    // A dark ash cloud rolls toward the victim with smoke puffs tumbling alongside
    windup(ctx) {
      const [tx, ty] = at(ctx), from = launchPoint(ctx);
      for (let i = 0; i < 3; i++) later(40 + i * 45, () => fxFly([from[0] + fxRand(-20, 20), from[1] + fxRand(-14, 14)], [tx + fxRand(-40, 40), ty + fxRand(-16, 16)],
        { cls: 'fxv2-puff fxv2-puff-fly', ms: 300, arc: fxRand(-50, 50), scale: [0.5, 1.6], easing: 'ease-in' }));
      return aim(from, [tx, ty - 8], { tilt: false, html: ASH_CLOUD, cls: 'fxr-svg fxv2-cloud fxv2-cloud-fly', ms: 380, arc: -40, scale: [0.4, ctx.crit ? 1.5 : 1.25],
        trail: 'fxr-trail-smoke', trailEvery: 30, easing: 'cubic-bezier(.3,0,.8,.8)' });
    },
    // Ash engulfs the victim and they cough out little puffs
    impact(ctx) {
      const [tx, ty] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46), p = pow(ctx), crit = !!ctx.crit;
      fxTint(VIG.ash, { ms: 600, opacity: crit ? 0.65 : 0.5 });
      core(tx, ty, 140 * p, 'ash', 420);
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        puff(tx + Math.cos(a) * w * 0.3, ty + Math.sin(a) * h * 0.5, 50 + 14 * p, { dx: Math.cos(a) * 40 * p, dy: Math.sin(a) * 20 - 16, ms: 800 });
      }
      ashFall(tx, ty - h, w * 1.1, 10, { fall: h * 2.2, ms: 900 });
      [-1, 1].forEach((sd, i) => later(120 + i * 140, () => fxPop(tx + sd * w * 0.42, ty - h * 0.4, '💨', { size: 26, ms: 560, rise: 12, rotate: sd * 20 })));
      fxRing(tx, ty, { color: '#8a8078', size: 200 * p, width: 8, ms: 480 });
      embers(tx, ty, { count: 6, spread: 70 });
      const [sx, sy] = stampPoint(ctx);
      word(sx, sy, crit ? 'COUGH COUGH!!' : 'COUGH!', { kind: 'ash', size: crit ? 36 : Math.min(46, 28 + 10 * p), rotate: 5, ms: 850 });
      knock(ctx.to, src(ctx), 14, 360);
      fxShake(ctx.panel, Math.min(18, 8 * p), 340);
    },
    // BLINDED: the victim's box is smothered under a dark blanket of ash
    gimmick(ctx) {
      const [x, y] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46);
      const m = fxSpawn(x, y, { cls: 'fxv2-smother', ms: 1250, size: [w + 30, h + 30] });
      fxAnimate(m, [{ transform: 'scale(0.6)', opacity: 0 }, { transform: 'scale(1.04)', opacity: 0.92, offset: 0.2 },
        { transform: 'scale(1)', opacity: 0.88, offset: 0.75 }, { transform: 'scale(1.1)', opacity: 0 }], 1200, 'ease-out');
      fire.daze(ctx, { word: 'BLINDED!', stars: i => (i % 2 ? '🙈' : '💫') });
      ashFall(x, y - h - 20, w * 1.1, 12, { fall: h * 2.4, ms: 1000 });
    },
  };

  // ================= Molten Talons (x6, lifesteal): red-hot claws rake the victim =================
  CARD_FX['molten-talons'] = {
    // The talons rake down across the card, leaving three glowing scratches
    land(ctx) {
      remember(ctx);
      const [x, y] = faceXY(ctx), [w, h] = faceSize(ctx);
      frame(ctx.win, '#ff5a1f', 750);
      const t = fxSpawn(x - w * 0.25, y - h * 0.6, { cls: 'fxr-svg fxv2-talons', html: TALONS, ms: 540 });
      fxAnimate(t, [
        { transform: 'translate(-20px, -20px) rotate(62deg) scale(0.6)', opacity: 0 },
        { transform: 'translate(0, 0) rotate(62deg) scale(0.75)', opacity: 1, offset: 0.25 },
        { transform: `translate(${w * 0.5}px, ${h * 1.05}px) rotate(70deg) scale(0.8)`, opacity: 1, offset: 0.7 },
        { transform: `translate(${w * 0.6}px, ${h * 1.2}px) rotate(74deg) scale(0.7)`, opacity: 0 },
      ], 520, 'ease-in');
      [-1, 0, 1].forEach((o, i) => later(170 + i * 35, () => {
        const cx = x + o * w * 0.24, cy = y + o * 2;
        burnMark(cx, cy, 64, h * 0.95, 850, 7);
        slash(cx, cy, 64, h * 1.05, 7, 'fxr-slash-fire');
        sparks(cx + w * 0.1, cy + h * 0.3, { count: 4, spread: 50, gravity: 60 });
      }));
      faceJiggle(ctx, [{ transform: 'none' }, { transform: 'translate(2px, 3px) rotate(2deg)' }, { transform: 'none' }], 260);
      plate(ctx, '⚜️ MOLTEN TALONS', '#ff5a1f', 'fire');
    },
    // The hawk swoops talons-first at the victim, trailing fire
    windup(ctx) {
      const [tx, ty] = at(ctx), from = launchPoint(ctx);
      dim(VIG.fire, 0.4, 360);
      later(20, () => sfx('eagle', 1.3, 0.35));
      return aim(from, [tx, ty - 6], { html: TALONS, cls: 'fxr-svg fxv2-talons', ms: 340, arc: -90, scale: [0.5, ctx.crit ? 1.45 : 1.2],
        trail: 'fxr-trail-fire', trailEvery: 28, easing: 'cubic-bezier(.45,0,.9,.6)' });
    },
    // Three molten claw slashes that leave glowing burn marks, sparks and sizzling steam
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit, [, h] = sizeOf(ctx.to, 200, 46), deg = sideOf(ctx) > 0 ? 64 : 116;
      fxTint('#ff3d00', { ms: 400, opacity: crit ? 0.4 : 0.28 });
      core(tx, ty, 130 * p, 'fire', 380);
      [-1, 0, 1].forEach((o, i) => later(i * 45, () => {
        const cx = tx + o * 26 * p, cy = ty + o * 4;
        slash(cx, cy, deg, 150 * p, 11, 'fxr-slash-fire');
        burnMark(cx, cy, deg, 130 * p, 950, 8);
        sparks(cx, cy, { count: 6, spread: 90 * p, gravity: 70 });
      }));
      lavaBlobs(tx, ty, { count: 8, spread: 100 * p, gravity: 120, size: [5, 10] });
      fxRing(tx, ty, { color: '#ff8a1f', size: 200 * p, width: 7, ms: 440 });
      later(120, () => smoke(tx, ty - h * 0.3, 3, { size: 40, dark: false, rise: 40 })); // sizzle
      const [sx, sy] = stampPoint(ctx);
      word(sx, sy, crit ? 'WHITE HOT!!' : 'SEARED!', { kind: crit ? 'sun' : 'fire', size: crit ? 40 : Math.min(50, 30 + 10 * p), rotate: -7, ms: 850 });
      fxShake(ctx.panel, Math.min(22, 11 * p), 380);
      fxShake(ctx.to, 9, 300);
      sfx('saw', 2.0, 0.18);
    },
    // Lifesteal: drops of molten life drip back into the hawk
    gimmick(ctx) {
      fire.lifesteal(ctx, { html: '<i class="fxv2-drop"></i>', n: 8 });
    },
  };

  // ================= Heat Mirage (armor +2): the hawk hides among shimmering mirror images =================
  CARD_FX['heat-mirage'] = {
    // The card shimmers in heat haze and ghost copies of it drift away
    land(ctx) {
      remember(ctx);
      const [x, y] = faceXY(ctx), [w, h] = faceSize(ctx);
      frame(ctx.win, '#ffcf6a', 800);
      const hz = fxSpawn(x, y, { cls: 'fxv2-haze', html: '<i></i>', ms: 1000, size: [w + 8, h + 8] });
      fxAnimate(hz, [{ transform: 'scale(1)', opacity: 0 }, { transform: 'scale(1.02)', opacity: 1, offset: 0.2 },
        { transform: 'scale(1.03)', opacity: 0.9, offset: 0.7 }, { transform: 'scale(1.06)', opacity: 0 }], 1000, 'ease-in-out');
      ghostCard(ctx, { dx: w * 0.95, dy: -h * 0.35, ms: 900, delay: 140 });
      ghostCard(ctx, { dx: -w * 0.85, dy: -h * 0.2, ms: 900, delay: 300, peak: 0.45 });
      later(120, () => heatWave(x, y, 150, 520));
      later(200, () => embers(x, y + h * 0.3, { count: 6, spread: 50 }));
      plate(ctx, '🏜️ HEAT MIRAGE', '#ffcf6a', 'fire');
    },
    // Mirror images of the hawk flicker round its box, then a heat-haze shield shimmers up
    gimmick(ctx) {
      const [x, y] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46);
      mirrorBox(ctx, -w * 0.32, 0);
      mirrorBox(ctx, w * 0.32, 70);
      [[-0.55, -0.95, 1], [0.55, -0.95, -1], [-0.35, 1.05, 1], [0.35, 1.05, -1]].forEach(([ox, oy, f], i) =>
        later(60 + i * 90, () => hawkGhost(x + ox * w, y + oy * h, f)));
      later(40, () => heatWave(x, y, w * 1.3, 560));
      fire.armor(ctx, { word: '+2 MIRAGE', plates: HAZE });
      later(430, () => {
        const sh = fxSpawn(x, y, { cls: 'fxv2-hazeshield', html: '<i></i>', ms: 860, size: [w + 44, h + 50] });
        fxAnimate(sh, [{ transform: 'scale(1.3)', opacity: 0 }, { transform: 'scale(0.97)', opacity: 1, offset: 0.25 },
          { transform: 'scale(1.01)', opacity: 0.85, offset: 0.7 }, { transform: 'scale(1.1)', opacity: 0 }], 820, 'ease-out');
        fxParticles(x, y, { count: 8, html: '✦', colors: TWINKLE, size: [5, 8], spread: w * 0.6, ms: 600, spin: 90 });
      });
    },
  };

  // ================= Cinder Storm (x8, cleave): a thundercloud of cinders and lightning =================
  CARD_FX['cinder-storm'] = {
    // A black storm cloud swells over the card, lightning cracks down and cinders rain out
    land(ctx) {
      remember(ctx);
      const [x, y] = faceXY(ctx), [w, h] = faceSize(ctx), cy = y - h * 0.42;
      frame(ctx.win, '#ffd23f', 800);
      fxTint(VIG.dark, { ms: 800, opacity: 0.55 });
      const c = fxSpawn(x, cy, { cls: 'fxr-svg fxv2-storm', html: STORM_CLOUD, ms: 950, size: [w * 1.9, w * 1.1] });
      fxAnimate(c, [{ transform: 'scale(0.3)', opacity: 0 }, { transform: 'scale(1.05)', opacity: 1, offset: 0.25 },
        { transform: 'translate(2px, 0) scale(1)', opacity: 1, offset: 0.5 }, { transform: 'translate(-2px, 0) scale(1.02)', opacity: 1, offset: 0.75 },
        { transform: 'translate(0, -8px) scale(1.08)', opacity: 0 }], 950, 'ease-out');
      later(150, () => cinderFall(x, cy + 14, w * 1.3, 8, h * 0.9, 800));
      later(300, () => { bolt(x - 4, cy + 12, y + h * 0.35, 0.7, 260); core(x, y + h * 0.3, 70, 'sun', 300); sparks(x, y + h * 0.3, { count: 8, spread: 60 }); });
      later(560, () => bolt(x + w * 0.3, cy + 12, y + h * 0.15, 0.5, 220));
      faceJiggle(ctx, [{ transform: 'none' }, { transform: 'translate(-2px, 2px)' }, { transform: 'translate(2px, -1px)' }, { transform: 'none' }], 260);
      plate(ctx, '⛈️ CINDER STORM', '#ffd23f', 'fire');
    },
    // Cleave: the kit's lava crack melts the shields, and a bolt of lightning zaps them
    gimmick(ctx) {
      const [tx, ty] = at(ctx);
      fire.smash(ctx, { word: 'FRIED!' });
      if (ctx.blocked) later(90, () => { bolt(tx, Math.max(20, ty - 140), ty, 0.6, 240); sparks(tx, ty, { count: 8, spread: 90 }); });
    },
    // The sky darkens, a storm cloud gathers over the victim and zigzag lightning strikes down
    windup(ctx) {
      const [tx, ty] = at(ctx), cy = Math.max(40, ty - 120), s = ctx.crit ? 1.25 : 1;
      dim(VIG.dark, ctx.crit ? 0.8 : 0.65, 420);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + 0.4;
        fxFly([tx + Math.cos(a) * 130, cy + Math.sin(a) * 50], [tx, cy], { cls: 'fxv2-puff fxv2-puff-dark fxv2-puff-fly', ms: 220, scale: [0.6, 1.4], easing: 'ease-in' });
      }
      const cloud = fxSpawn(tx, cy, { cls: 'fxr-svg fxv2-storm', html: STORM_CLOUD, ms: 760, size: [150 * s, 88 * s] });
      fxAnimate(cloud, [{ transform: 'scale(0.3)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: 0.35 },
        { transform: 'translate(3px, 0) scale(1.03)', opacity: 1, offset: 0.5 }, { transform: 'translate(-3px, 0) scale(1.05)', opacity: 1, offset: 0.65 },
        { transform: 'scale(1.1)', opacity: 0 }], 760, 'ease-out');
      later(160, () => cinderFall(tx, cy + 30, 130 * s, 6, ty - cy + 20, 500));
      later(290, () => bolt(tx, cy + 26, ty, s, 260));
      return wait(330);
    },
    // The bolt strikes home: lightning, a white flash and a burst of cinders
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit;
      bolt(tx, Math.max(20, ty - 150), ty, 0.9 * Math.min(1.5, p), 300);
      flash('#fff6a0', crit ? 0.5 : 0.35);
      fxTint('#ffd23f', { ms: 300, opacity: 0.22 });
      core(tx, ty, 170 * p, 'sun', 420);
      later(40, () => core(tx, ty, 120 * p, 'lava', 500));
      crackBurst(tx, ty, 180 * p, 'lava', fxRand(0, 60), 850);
      embers(tx, ty, { count: 12, spread: 140 * p, rise: 60 });
      rocks(tx, ty, { count: 8, spread: 150 * p, size: [5, 10], cone: 300 }); // black cinders
      sparks(tx, ty, { count: 14, spread: 170 * p });
      fxRing(tx, ty, { color: '#fff6a0', size: 170 * p, width: 6, ms: 360 });
      later(80, () => fxRing(tx, ty, { color: '#ff6a00', size: 280 * p, width: 9, ms: 500 }));
      const [sx, sy] = stampPoint(ctx);
      word(sx, sy, crit ? 'THUNDERSTRUCK!!' : 'CINDER STORM!', { kind: 'sun fxv2-storm', size: crit ? 40 : Math.min(44, 26 + 9 * p), rotate: -5, ms: 950, star: crit ? '#ffd23f' : null });
      fxShake(ctx.panel, Math.min(28, 14 * p), 480);
      fxShake(ctx.to, 12, 360);
      haptic(70);
    },
  };

  // ================= Ember Rain (x4 + burn): a shower of sparkler embers =================
  CARD_FX['ember-rain'] = {
    // Sparklers fizz along the top of the card and embers rain down it
    land(ctx) {
      remember(ctx);
      const [x, y] = faceXY(ctx), [w, h] = faceSize(ctx), top = y - h * 0.5;
      frame(ctx.win, '#ffb300', 800);
      for (let i = 0; i < 3; i++) later(i * 110, () => fxParticles(x + (i - 1) * w * 0.35, top, { count: 6, html: '✦', colors: TWINKLE, size: [4, 7], spread: 30, ms: 420, spin: 180 }));
      for (let i = 0; i < 14; i++) later(i * 45, () => fallSpark(x + fxRand(-w * 0.5, w * 0.5), top, h * fxRand(0.8, 1.1), 480));
      later(220, () => glint(ctx.slot));
      later(420, () => fxRing(x, y + h * 0.45, { color: '#ffb300', size: 70, width: 3, ms: 320 }));
      plate(ctx, '🎇 EMBER RAIN', '#ffb300', 'fire');
    },
    // A slanting rain of glowing embers pours down on the victim
    windup(ctx) {
      const [tx, ty] = at(ctx), [w] = sizeOf(ctx.to, 200, 46), n = ctx.crit ? 10 : 8;
      dim(VIG.fire, 0.35, 380);
      for (let i = 0; i < n; i++) later(i * 14, () => {
        const ex = tx + (i / (n - 1) - 0.5) * w * 0.85 + fxRand(-8, 8), ey = ty + fxRand(-12, 12);
        aimFly([ex + 70, ty - 300], [ex, ey], { cls: 'fxv2-emberstreak', ms: 240, easing: 'ease-in' })
          .then(() => fxParticles(ex, ey, { count: 3, colors: TWINKLE, size: [3, 5], spread: 30, gravity: 30, angle: -90, cone: 140, ms: 300 }));
      });
      return wait(n * 14 + 250);
    },
    // Sizzling splashes pop all over the victim, leaving a scorch mark
    impact(ctx) {
      const [tx, ty] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46), p = pow(ctx), crit = !!ctx.crit, n = crit ? 6 : 5;
      fxTint('#ffb300', { ms: 380, opacity: crit ? 0.35 : 0.22 });
      for (let i = 0; i < n; i++) later(i * 50, () => {
        const x = tx + (i / (n - 1) - 0.5) * w * 0.85 + fxRand(-8, 8), y = ty + fxRand(-h * 0.3, h * 0.3);
        fxRing(x, y, { color: '#ffb300', size: 56 + 18 * p, width: 4, ms: 360 });
        fxParticles(x, y, { count: 4, colors: TWINKLE, size: [3, 5], spread: 50, gravity: 40, angle: -90, cone: 140, ms: 420 });
        smoke(x, y - 6, 1, { size: 34, dark: false, rise: 36, ms: 600 });
      });
      core(tx, ty, 120 * p, 'fire', 400);
      scorch(tx, ty + 4, Math.min(220, w * 0.9), 900);
      embers(tx, ty, { count: 10, spread: 110 });
      const [sx, sy] = stampPoint(ctx);
      word(sx, sy, crit ? 'FIRE SHOWER!!' : 'EMBER RAIN!', { kind: crit ? 'sun' : 'fire', size: crit ? 38 : Math.min(44, 26 + 9 * p), rotate: 6, ms: 850 });
      fxShake(ctx.panel, Math.min(18, 9 * p), 360);
      fxShake(ctx.to, 7, 280);
      sfx('saw', 1.9, 0.2); // sizzle
    },
    // Burn: the kit's flames, with a last few embers still drizzling down
    gimmick(ctx) {
      const [x, y] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46);
      fire.burn(ctx, { word: 'SIZZLING!' });
      for (let i = 0; i < 6; i++) later(i * 60, () => fallSpark(x + fxRand(-w * 0.45, w * 0.45), y - h * 1.2, h * 1.4, 460));
    },
  };

  // ================= Boulder Fist (x7): a giant stone fist rockets at the victim =================
  CARD_FX['boulder-fist'] = {
    // A giant stone fist slams into the card and cracks it
    land(ctx) {
      remember(ctx);
      const [x, y] = faceXY(ctx), [w, h] = faceSize(ctx);
      frame(ctx.win, '#c8a890', 750);
      const f = fxSpawn(x, y, { cls: 'fxr-svg fxv2-fist', html: FIST, ms: 900 });
      fxAnimate(f, [
        { transform: 'translate(-90px, -70px) rotate(-25deg) scale(1.8)', opacity: 0, easing: 'cubic-bezier(.6,0,1,.6)' },
        { transform: 'translate(-4px, 0) rotate(0deg) scale(0.8)', opacity: 1, offset: 0.5 },
        { transform: 'translate(2px, 0) rotate(0deg) scale(0.86, 0.74)', opacity: 1, offset: 0.57 },
        { transform: 'translate(0, 0) rotate(0deg) scale(0.8)', opacity: 1, offset: 0.7 },
        { transform: 'translate(-20px, -10px) rotate(-8deg) scale(0.7)', opacity: 0 },
      ], 900, 'ease-out');
      later(450, () => {
        crackBurst(x + w * 0.15, y, w * 1.6, 'stone', fxRand(0, 60), 700);
        rocks(x + w * 0.2, y, { count: 7, spread: 90, gravity: 120, size: [6, 11] });
        fxRing(x, y, { color: '#c8a890', size: 150, width: 6, ms: 420 });
        dust(x, y + h * 0.3, 3, { size: 40, spread: w, rise: 20 });
        slam(x, y - h * 0.58, 'POW!', { kind: 'stone', size: 26, rotate: -8, ms: 600 });
        fxShake(ctx.panel, 8, 280);
        sfx('heavy_slam', 1.2, 0.35);
      });
      faceJiggle(ctx, [{ transform: 'none' }, { transform: 'translate(4px, 1px) scale(0.95)' }, { transform: 'none' }], 280);
      plate(ctx, '👊 BOULDER FIST', '#c8a890', 'fire');
    },
    // The golem lunges and the fist rockets out of it, growing, trailing dust
    windup(ctx) {
      const [tx, ty] = at(ctx), from = src(ctx);
      lunge(ctx.from, [tx, ty], 26, 320);
      speedLines(from[0], from[1], { n: 6, r0: 30, r1: 90, cls: 'fxr-line', ms: 260 });
      return aim(from, [tx, ty], { html: FIST, cls: 'fxr-svg fxv2-fist', ms: 330, scale: [0.75, ctx.crit ? 1.7 : 1.4],
        trail: 'fxv2-trail-dust', trailEvery: 26, easing: 'cubic-bezier(.55,0,1,.55)' });
    },
    // KA-POW: a comic burst, a huge crack, rock chunks everywhere and a heavy shake
    impact(ctx) {
      const [tx, ty] = at(ctx), [, h] = sizeOf(ctx.to, 200, 46), p = pow(ctx), crit = !!ctx.crit, from = src(ctx), sd = sideOf(ctx);
      fxTint('#6a4a30', { ms: 380, opacity: 0.3 });
      core(tx, ty, 170 * p, 'fire', 400);
      crackBurst(tx, ty, Math.min(300, 220 * p), 'stone', fxRand(0, 60), 950);
      later(40, () => crackBurst(tx, ty, 150 * p, 'lava', fxRand(0, 60), 800));
      rocks(tx, ty, { count: 14, spread: 190 * p, gravity: 160, size: [8, 16], cone: 360 });
      dust(tx, ty + h * 0.3, 4, { size: 58, spread: 120, rise: 22 });
      fxRing(tx, ty, { color: '#fff', size: 160 * p, width: 7, ms: 340 });
      later(60, () => fxRing(tx, ty, { color: '#c8a890', size: 280 * p, width: 10, ms: 520 }));
      speedLines(tx, ty, { n: 10, r0: 50, r1: 160 * p, cls: 'fxr-line', width: 5 });
      slam(tx - sd * 50, ty - h * 0.5 - 22, 'KA-POW!', { kind: 'gold', size: 22, rotate: -12 * sd, ms: 700, star: '#ff6a00' });
      const [sx, sy] = stampPoint(ctx);
      word(sx, sy, crit ? 'MEGA PUNCH!!' : 'BOULDER PUNCH!', { kind: 'stone', size: crit ? 46 : Math.min(44, 26 + 9 * p), rotate: -6, ms: 950, star: crit ? '#ffd23f' : null });
      knock(ctx.to, from, 26, 380);
      fxShake(ctx.panel, Math.min(30, 16 * p), 520);
      haptic(90);
    },
  };

  // ================= Quake Stomp (x4, stun: knock flat): the golem stomps and the ground splits =================
  CARD_FX['quake-stomp'] = {
    // A huge stone foot stomps the card and kicks up a ring of dust
    land(ctx) {
      remember(ctx);
      const [x, y] = faceXY(ctx), [w, h] = faceSize(ctx), gy = y + h * 0.4;
      frame(ctx.win, '#d8a060', 750);
      shadow(x, gy, w * 1.6, 22, 420);
      const f = fxSpawn(x, y - h * 0.05, { cls: 'fxr-svg fxv2-foot', html: FOOT, ms: 950 });
      fxAnimate(f, [
        { transform: 'translate(0, -160px) scale(1.2)', opacity: 0, easing: 'cubic-bezier(.7,0,1,.5)' },
        { transform: 'translate(0, 0) scale(0.9)', opacity: 1, offset: 0.47 },
        { transform: 'translate(0, 6px) scale(1, 0.8)', opacity: 1, offset: 0.54 },
        { transform: 'translate(0, 0) scale(0.9)', opacity: 1, offset: 0.7 },
        { transform: 'translate(0, -30px) scale(0.85)', opacity: 0 },
      ], 950, 'ease-out');
      later(450, () => {
        groundRing(x, gy, w * 2.4, { color: '#d8a060', ms: 500, width: 6 });
        later(80, () => groundRing(x, gy, w * 3.2, { color: '#8a6a4a', ms: 560, width: 4 }));
        dust(x, gy, 5, { size: 44, spread: w * 1.8, rise: 16 });
        crackBurst(x, gy - 4, w * 1.4, 'stone', 0, 650);
        rocks(x, gy, { count: 6, spread: 80, gravity: 110, size: [5, 9], cone: 140 });
        fxShake(ctx.panel, 10, 320);
        sfx('heavy_slam', 1.3, 0.3);
      });
      faceJiggle(ctx, [{ transform: 'none' }, { transform: 'translateY(4px) scale(1.06, 0.9)' }, { transform: 'none' }], 300);
      plate(ctx, '🦶 QUAKE STOMP', '#d8a060', 'fire');
    },
    // The golem's box stomps and a shockwave rolls along the ground to the victim, cracking as it goes
    windup(ctx) {
      const [sx, sy] = src(ctx), [tx, ty] = at(ctx), [, h] = sizeOf(ctx.from, 200, 46), g = h * 0.5 + 4, n = 5;
      jolt(ctx.from, [{ transform: 'none' }, { transform: 'translateY(-16px)', offset: 0.35 }, { transform: 'translateY(4px) scale(1.05, 0.92)', offset: 0.55 }, { transform: 'none' }], 300);
      later(110, () => { groundRing(sx, sy + g, 130, { color: '#d8a060', ms: 380 }); dust(sx, sy + g, 3, { size: 40, spread: 80, rise: 14, ms: 600 }); fxShake(ctx.panel, 6, 240); });
      for (let i = 0; i < n; i++) later(140 + i * 50, () => {
        const t = (i + 1) / n, x = sx + (tx - sx) * t, y = sy + g + (ty - sy) * t;
        crackBurst(x, y, 50 + i * 12, 'stone', fxRand(0, 60), 420);
        groundRing(x, y, 60 + i * 16, { color: i === n - 1 ? '#ff8a1f' : '#d8a060', ms: 360 });
        rocks(x, y, { count: 3, spread: 50, gravity: 90, size: [5, 9], cone: 100, ms: 500 });
      });
      return wait(140 + (n - 1) * 50 + 40);
    },
    // The ground cracks open under the victim, bucking them up and throwing rocks
    impact(ctx) {
      const [tx, ty] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46), p = pow(ctx), crit = !!ctx.crit, gy = ty + h * 0.45;
      core(tx, gy, 130 * p, 'lava', 420);
      crackBurst(tx, gy, Math.min(300, 230 * p), 'stone', 0, 950);
      later(30, () => crackBurst(tx, gy, 150 * p, 'lava', 30, 800));
      groundRing(tx, gy, 260 * p, { color: '#d8a060', width: 7, ms: 520 });
      later(90, () => groundRing(tx, gy, 360 * p, { color: '#8a6a4a', width: 4, ms: 600 }));
      rocks(tx, gy, { count: 12, spread: 170 * p, gravity: 170, angle: -90, cone: 120, size: [7, 14] });
      dust(tx, gy, 5, { size: 56, spread: w, rise: 20 });
      jolt(ctx.to, [{ transform: 'none' }, { transform: 'translateY(-16px) rotate(-3deg)', offset: 0.3 }, { transform: 'translateY(3px) scale(1.04, 0.94)', offset: 0.6 }, { transform: 'none' }], 460);
      const [sx, sy] = stampPoint(ctx);
      word(sx, sy + 8, crit ? 'MEGA QUAKE!!' : 'QUAKE!', { kind: 'stone', size: crit ? 44 : Math.min(52, 30 + 10 * p), rotate: 4, ms: 900, star: crit ? '#d8a060' : null });
      fxShake(ctx.panel, Math.min(30, 15 * p), 560);
      haptic(80);
    },
    // Knocked flat: the kit's daze, and the victim's box is squashed like a pancake as rocks tumble
    gimmick(ctx) {
      const [x, y] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46);
      fire.daze(ctx, { word: 'KNOCKED FLAT!' });
      rocks(x, y + h * 0.4, { count: 8, spread: 120, gravity: 150, cone: 160 });
      dust(x, y + h * 0.5, 4, { size: 50, spread: w, rise: 14 });
      groundRing(x, y + h * 0.5, w * 1.5, { color: '#d8a060', ms: 460 });
      jolt(ctx.to, [{ transform: 'none' }, { transform: 'translateY(8px) scale(1.18, 0.5)', offset: 0.25 }, { transform: 'translateY(6px) scale(1.12, 0.6)', offset: 0.7 }, { transform: 'none' }], 520);
    },
  };

  // ================= Magma Armor (armor +2): molten rock bubbles up and hardens into a shell =================
  CARD_FX['magma-armor'] = {
    // Molten rock bubbles up over the card, then cools into a hard stone crust
    land(ctx) {
      remember(ctx);
      const [x, y] = faceXY(ctx), [w, h] = faceSize(ctx);
      frame(ctx.win, '#ff8a1f', 900);
      const lava = fxSpawn(x, y, { cls: 'fxv2-lavacoat', ms: 900, size: [w + 6, h + 6], style: { transformOrigin: '50% 100%' } });
      fxAnimate(lava, [{ transform: 'scale(1, 0.05)', opacity: 0.9 }, { transform: 'scale(1, 1)', opacity: 0.88, offset: 0.35 },
        { transform: 'scale(1.02, 1)', opacity: 0.85, offset: 0.55 }, { transform: 'scale(1.02, 1)', opacity: 0 }], 900, 'ease-out');
      for (let i = 0; i < 6; i++) later(i * 55, () => bubble(x + fxRand(-w * 0.4, w * 0.4), y + h * fxRand(-0.1, 0.4), fxRand(12, 20), 420));
      later(420, () => {
        const crust = fxSpawn(x, y, { cls: 'fxv2-crust', ms: 640, size: [w + 8, h + 8] });
        fxAnimate(crust, [{ transform: 'scale(1.05)', opacity: 0 }, { transform: 'scale(1)', opacity: 0.95, offset: 0.3 },
          { transform: 'scale(1)', opacity: 0.9, offset: 0.7 }, { transform: 'scale(1.04)', opacity: 0 }], 620, 'ease-out');
        smoke(x, y - h * 0.4, 3, { size: 38, dark: false, rise: 40, ms: 700 }); // the lava cools with a hiss
        sparks(x, y, { count: 8, spread: 60 });
        sfx('shield', 0.5, 0.5);
      });
      faceJiggle(ctx, [{ transform: 'none' }, { transform: 'scale(1.05)' }, { transform: 'none' }], 260);
      plate(ctx, '🪨 MAGMA ARMOR', '#ff8a1f', 'fire');
    },
    // The kit's magma shell, with lava dripping off it and hardening into stone
    gimmick(ctx) {
      const [x, y] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46);
      fire.armor(ctx, { word: '+2 MAGMA' });
      later(430, () => lavaBlobs(x, y - h * 0.5, { count: 6, spread: 70, gravity: 120 }));
      for (let i = 0; i < 6; i++) later(440 + i * 45, () => drip(x + (i / 5 - 0.5) * w * 0.9, y + h * 0.5 + 10, 24 + fxRand(0, 18), true, 800));
    },
  };

  // ================= Obsidian Claw (x6, lifesteal): claws of black volcanic glass =================
  CARD_FX['obsidian-claw'] = {
    // Shiny black glass claws unsheathe over the card and a purple glint runs along their edges
    land(ctx) {
      remember(ctx);
      const [x, y] = faceXY(ctx), [w, h] = faceSize(ctx);
      frame(ctx.win, '#b07cff', 800);
      fxTint(VIG.aurora, { ms: 800, opacity: 0.45 });
      const c = fxSpawn(x, y, { cls: 'fxr-svg fxv2-obclaw', html: OBS_CLAW, ms: 950 });
      fxAnimate(c, [{ transform: 'rotate(-40deg) scale(0.3)', opacity: 0 }, { transform: 'rotate(-58deg) scale(0.95)', opacity: 1, offset: 0.25 },
        { transform: 'rotate(-55deg) scale(0.9)', opacity: 1, offset: 0.75 }, { transform: 'translate(0, -16px) rotate(-55deg) scale(0.85)', opacity: 0 }], 950, 'ease-out');
      later(200, () => rocks(x, y, { count: 5, obsidian: true, spread: 70, gravity: 90, size: [6, 10] }));
      later(320, () => fxBeam([x - w * 0.45, y + h * 0.4], [x + w * 0.45, y - h * 0.45], { cls: 'fxv2-purpleglint', ms: 380, width: 6 }));
      later(380, () => fxParticles(x, y, { count: 8, html: '✦', colors: VIOLET, size: [5, 9], spread: 70, ms: 600, spin: 90 }));
      later(480, () => glint(ctx.slot));
      plate(ctx, '🖤 OBSIDIAN CLAW', '#b07cff', 'fire');
    },
    // Obsidian shards swarm into a claw, which flies at the victim
    windup(ctx) {
      const [tx, ty] = at(ctx), from = launchPoint(ctx);
      swarm(from[0], from[1], 10, 80, 170);
      later(150, () => fxRing(from[0], from[1], { color: '#b07cff', size: 90, width: 4, ms: 260 }));
      return after(150, () => aim(from, [tx, ty], { html: OBS_CLAW, cls: 'fxr-svg fxv2-obclaw', ms: 240, arc: 50, scale: [0.6, ctx.crit ? 1.45 : 1.2],
        trail: 'fxr-trail-dark', trailEvery: 26, easing: 'cubic-bezier(.5,0,.9,.6)' }));
    },
    // Glassy purple-black slashes and a spray of obsidian shards
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit;
      fxTint('#2a0a4a', { ms: 420, opacity: crit ? 0.45 : 0.32 });
      core(tx, ty, 140 * p, 'dark', 420);
      [-1, 0, 1].forEach((o, i) => later(i * 40, () => slash(tx + o * 24 * p, ty + o * 3, -62, 170 * p, 12, 'fxr-slash-dark')));
      if (crit) later(140, () => slash(tx, ty, 18, 210 * p, 10, 'fxr-slash-dark'));
      crackBurst(tx, ty, 170 * p, 'dark', fxRand(0, 60), 850);
      rocks(tx, ty, { count: 12, obsidian: true, spread: 170 * p, gravity: 110, size: [7, 14], cone: 360 });
      fxParticles(tx, ty, { count: 8, html: '✦', colors: VIOLET, size: [5, 9], spread: 120 * p, ms: 600, spin: 90 });
      fxRing(tx, ty, { color: '#b07cff', size: 200 * p, width: 7, ms: 440 });
      later(70, () => fxRing(tx, ty, { color: '#ff4b1f', size: 260 * p, width: 3, ms: 500 }));
      const [sx, sy] = stampPoint(ctx);
      word(sx, sy, crit ? 'GLASS SHATTER!!' : 'OBSIDIAN!', { kind: 'obsidian', size: crit ? 38 : Math.min(48, 28 + 10 * p), rotate: -6, ms: 850 });
      fxShake(ctx.panel, Math.min(22, 11 * p), 400);
      fxShake(ctx.to, 10, 300);
      sfx('blocked', 1.6, 0.25); // glassy clink
    },
    // Lifesteal: purple-red wisps stream back into the golem
    gimmick(ctx) {
      const [x, y] = src(ctx);
      fire.lifesteal(ctx, { html: '<i class="fxv2-wisp-obs"></i>', n: 9 });
      later(470, () => { fxRing(x, y, { color: '#b07cff', size: 140, width: 4, ms: 420 }); fxParticles(x, y, { count: 6, html: '✦', colors: VIOLET, size: [5, 8], spread: 60, ms: 520 }); });
    },
  };

  // ================= Molten Heart (wallow: heal + shield): a heart of magma beats in the golem's chest =================
  CARD_FX['molten-heart'] = {
    // A glowing heart of magma beats inside the card, its cracks flaring on each thump
    land(ctx) {
      remember(ctx);
      const [x, y] = faceXY(ctx), [w] = faceSize(ctx);
      frame(ctx.win, '#ff5a3a', 900);
      const glow = fxSpawn(x, y, { cls: 'fxv2-heartglow', ms: 1000, size: [w * 1.9, w * 1.9] });
      fxAnimate(glow, [{ transform: 'scale(0.4)', opacity: 0 }, { transform: 'scale(1)', opacity: 0.7, offset: 0.14 }, { transform: 'scale(1.35)', opacity: 1, offset: 0.26 },
        { transform: 'scale(1)', opacity: 0.6, offset: 0.36 }, { transform: 'scale(1.3)', opacity: 1, offset: 0.46 }, { transform: 'scale(1)', opacity: 0.6, offset: 0.7 },
        { transform: 'scale(1.1)', opacity: 0 }], 1000, 'ease-in-out');
      const heart = fxSpawn(x, y, { cls: 'fxr-svg fxv2-heart', html: HEART, ms: 1000, size: [w * 0.95, w * 0.86] });
      fxAnimate(heart, BEAT, 1000, 'ease-in-out');
      [260, 460].forEach(t => later(t, () => { fxRing(x, y, { color: '#ff8a1f', size: 120, width: 4, ms: 380 }); embers(x, y, { count: 4, spread: 50 }); }));
      plate(ctx, '❤️‍🔥 MOLTEN HEART', '#ff5a3a', 'fire');
    },
    // The golem's core thumps with heat waves, then the kit heals it and grows a rock shell
    gimmick(ctx) {
      const [x, y] = src(ctx), [, h] = sizeOf(ctx.from, 200, 46);
      const heart = fxSpawn(x, y, { cls: 'fxr-svg fxv2-heart', html: HEART, ms: 1000, size: [h * 1.5, h * 1.35] });
      fxAnimate(heart, BEAT, 1000, 'ease-in-out');
      [260, 460].forEach((t, i) => later(t, () => {
        heatWave(x, y, 200 + i * 60, 520);
        jolt(ctx.from, [{ transform: 'scale(1)' }, { transform: 'scale(1.07)', offset: 0.3 }, { transform: 'scale(1)' }], 240);
      }));
      fire.heal(ctx, { shield: true, word: 'MOLTEN HEART!' });
    },
  };

  // ================= Eruption (x9, cleave): the volcano blows its top right under the victim =================
  CARD_FX['eruption'] = {
    // A volcano rises out of the card, rumbling, smoking and spitting lava
    land(ctx) {
      remember(ctx);
      const [x, y] = faceXY(ctx), [w, h] = faceSize(ctx), H = w * 1.12, vy = y + h * 0.1, cy = vy - H * 0.28;
      frame(ctx.win, '#ff3d00', 950);
      fxTint(VIG.fire, { ms: 900, opacity: 0.5 });
      const v = fxSpawn(x, vy, { cls: 'fxr-svg fxv2-volcano', html: `<div class="fxv2-rumble">${VOLCANO}</div>`, ms: 1000, size: [w * 1.5, H], style: { transformOrigin: '50% 100%' } });
      fxAnimate(v, [{ transform: 'translate(0, 20px) scale(0.6, 0.1)', opacity: 0 }, { transform: 'translate(0, 0) scale(1, 1.05)', opacity: 1, offset: 0.3 },
        { transform: 'scale(1)', opacity: 1, offset: 0.4 }, { transform: 'scale(1)', opacity: 1, offset: 0.82 }, { transform: 'translate(0, 10px) scale(1, 0.9)', opacity: 0 }], 1000, 'ease-out');
      later(300, () => { smoke(x, cy - 6, 3, { size: 40, spread: 30, rise: 60 }); lavaBlobs(x, cy, { count: 5, spread: 60, gravity: 90, cone: 90, size: [4, 8] }); });
      later(600, () => { smoke(x, cy - 6, 2, { size: 46, spread: 30, rise: 70 }); lavaBlobs(x, cy, { count: 5, spread: 70, gravity: 100, cone: 90, size: [4, 8] }); });
      later(120, () => rumble(ctx.panel, 3, 750));
      plate(ctx, '🌋 ERUPTION', '#ff3d00', 'fire');
    },
    // Cleave: the kit's lava crack melts every shield
    gimmick(ctx) {
      fire.smash(ctx, { word: 'MELTED!' });
    },
    // The screen shakes and darkens while the ground under the victim glows and cracks, charging up
    windup(ctx) {
      const [tx, ty] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46), gy = ty + h * 0.35;
      dim(VIG.dark, ctx.crit ? 0.8 : 0.65, 440);
      rumble(ctx.panel, 5, 420);
      reticle(tx, ty, '#ff5a00', 420);
      groundGlow(tx, gy, w * 1.2, 420);
      later(60, () => crackBurst(tx, gy, w * 0.8, 'lava', fxRand(0, 60), 400));
      later(190, () => crackBurst(tx, gy, w * 1.1, 'lava', fxRand(0, 60), 280));
      charge(tx, gy, { colors: FIRE_COLS, n: 10, r: 120, ms: 340 });
      later(120, () => smoke(tx, gy, 3, { size: 44, spread: w * 0.6, rise: 30 }));
      later(40, () => sfx('big_hit', 0.35, 0.4)); // deep rumble
      return wait(400);
    },
    // A massive eruption: lava jets blast up under the victim with rocks, smoke and a huge flash
    impact(ctx) {
      const [tx, ty] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46), p = pow(ctx), crit = !!ctx.crit, gy = ty + h * 0.45, jets = crit ? 4 : 3;
      flash('#ff8a1f', crit ? 0.6 : 0.45);
      fxTint(VIG.fire, { ms: 700, opacity: 0.6 });
      core(tx, ty, 220 * p, 'lava', 500);
      for (let i = 0; i < jets; i++) later(i * 60, () => lavaJet(tx + (i / (jets - 1) - 0.5) * w * 0.8, gy, (170 + 50 * (i % 2)) * Math.min(1.6, p), { ms: 620, width: 26 + 6 * Math.min(1.5, p) }));
      crackBurst(tx, gy, Math.min(320, 240 * p), 'lava', 0, 1000);
      rocks(tx, gy, { count: 10, spread: 200 * p, gravity: 180, cone: 150, size: [8, 15] });
      later(100, () => smoke(tx, ty - h, 4, { size: 70, spread: w * 0.8, rise: 70 }));
      for (let i = 0; i < 3; i++) later(i * 90, () => fxRing(tx, ty, { color: ['#fff3a0', '#ff6a00', '#8a1a00'][i], size: (200 + i * 120) * p, width: 11 - i * 3, ms: 600 }));
      const [sx, sy] = stampPoint(ctx);
      word(sx, sy, crit ? 'MEGA ERUPTION!!!' : 'ERUPTION!!', { kind: 'lava', size: crit ? 42 : Math.min(52, 32 + 10 * p), rotate: -5, ms: 1000, star: '#ff6a00' });
      fxShake(ctx.panel, Math.min(34, 18 * p), 650);
      fxShake(ctx.to, 16, 460);
      haptic(120);
    },
  };

  // ================= Lava Flood (x5 + burn): a rolling wave of lava =================
  CARD_FX['lava-flood'] = {
    // Molten lava swells over the top rim of the card, bubbles pop and drips run down it
    land(ctx) {
      remember(ctx);
      const [x, y] = faceXY(ctx), [w, h] = faceSize(ctx), top = y - h * 0.5;
      frame(ctx.win, '#ff6a00', 900);
      const pool = fxSpawn(x, top + 4, { cls: 'fxv2-lavarim', ms: 950, size: [w * 1.15, 22] });
      fxAnimate(pool, [{ transform: 'translate(0, 10px) scale(0.6, 0.2)', opacity: 0 }, { transform: 'translate(0, 0) scale(1, 1)', opacity: 1, offset: 0.25 },
        { transform: 'translate(0, 2px) scale(1.04, 0.9)', opacity: 1, offset: 0.7 }, { transform: 'translate(0, 6px) scale(1, 0.6)', opacity: 0 }], 950, 'ease-out');
      for (let i = 0; i < 5; i++) later(80 + i * 70, () => bubble(x + fxRand(-w * 0.5, w * 0.5), top + fxRand(-4, 4), fxRand(9, 15), 360));
      for (let i = 0; i < 5; i++) later(200 + i * 60, () => drip(x + (i / 4 - 0.5) * w * 0.9, top + 10, h * fxRand(0.45, 0.9), false, 700));
      later(260, () => smoke(x, top - 8, 2, { size: 36, dark: false, rise: 40, ms: 700 }));
      plate(ctx, '🫕 LAVA FLOOD', '#ff6a00', 'fire');
    },
    // A wave of lava rolls along the ground from the titan to the victim
    windup(ctx) {
      const [tx, ty] = at(ctx), [sx] = src(ctx), [, h] = sizeOf(ctx.to, 200, 46);
      const from = [sx, ty + h * 0.15], to = [tx, ty + h * 0.05];
      dim(VIG.fire, 0.45, 400);
      [140, 260].forEach(t => later(t, () => { const [x, y] = lerp(from, to, t / 380); lavaBlobs(x, y - 20, { count: 4, spread: 50, gravity: 90, cone: 90, size: [5, 9] }); }));
      return aim(from, to, { html: WAVE, cls: 'fxr-svg fxv2-wave', ms: 380, scale: [0.55, ctx.crit ? 1.5 : 1.3], bob: 5, tilt: false,
        trail: 'fxr-trail-lava', trailEvery: 28, easing: 'cubic-bezier(.3,0,.8,.7)' });
    },
    // SPLOOSH: the wave crashes into a crown of lava
    impact(ctx) {
      const [tx, ty] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46), p = pow(ctx), crit = !!ctx.crit;
      fxTint('#ff5a00', { ms: 420, opacity: crit ? 0.4 : 0.3 });
      show(tx, ty, SPLASH, { cls: 'fxv2-splash', size: [150 * Math.min(1.6, p), 100 * Math.min(1.6, p)], ms: 640, from: 0.3, to: 1, rise: -10 });
      lavaBlobs(tx, ty, { count: 14, spread: 150 * p, gravity: 160, cone: 160 });
      core(tx, ty, 150 * p, 'lava', 440);
      groundRing(tx, ty + h * 0.4, 240 * p, { color: '#ff8a1f', width: 6, ms: 480 });
      later(100, () => smoke(tx, ty - h * 0.3, 3, { size: 50, dark: false, rise: 50 }));
      scorch(tx, ty + 6, Math.min(230, w), 1000);
      const [sx, sy] = stampPoint(ctx);
      word(sx, sy, crit ? 'MEGA SPLOOSH!!' : 'SPLOOSH!', { kind: 'lava', size: crit ? 40 : Math.min(52, 30 + 10 * p), rotate: 6, ms: 900 });
      knock(ctx.to, src(ctx), 18, 360);
      fxShake(ctx.panel, Math.min(24, 12 * p), 420);
    },
    // Burn: the kit's flames, with lava still dripping off the victim
    gimmick(ctx) {
      const [x, y] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46);
      fire.burn(ctx, { word: 'SCORCHED!' });
      for (let i = 0; i < 4; i++) later(80 + i * 60, () => drip(x + (i / 3 - 0.5) * w * 0.8, y + h * 0.5, 22 + fxRand(0, 14), false, 700));
    },
  };
})();
