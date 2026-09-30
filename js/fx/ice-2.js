// Card effects: Ice Lake - the Polar Owl and Frost Wolf lines (see js/card-fx.js for when each hook fires,
// js/fx/region-kit.js for the RFX kit these build on).
//   Polar Owl (hard): Silent Swoop, Blizzard, Deep Freeze. Frostfeather Owl: Quill Volley, Owl Eyes.
//   Snow Owl Sage: Crystal Spell, Frost Nova.
//   Frost Wolf (nightmare): Frost Bite, Frost Claw, Pack Hunt. Frostfang Alpha: Moon Howl, Avalanche Pounce.
//   Winter Fenrir: Wolf Spirit, Moon Eater.
// Owls are silent night hunters: moonlight, feathers, glowing eyes and crystal magic. Wolves are icy fangs,
// claws, the pack, the moon and the spirit world. Styles live in css/fx/ice-2.css (every class is prefixed fxi2-).
(() => {
  const { clamp, later, wait, at, src, sizeOf, pow, dirOf, jolt, lunge, remember, launchPoint, slam, stampPoint, plate, frame,
    show, glint, speedLines, slash, crackBurst, core, dim, shadow, charge, orbit, aimFly, dropIn, vig, VIG, FLAKE, ICICLE, MOON,
    FULL_MOON, snowflakes, iceShards, sparkle, frostPuff, frostBloom, snowfall, iceBlock, frost } = RFX;

  // ---------- Graphics (inline SVG / emoji, no image files) ----------
  // An owl seen from the front with its wings spread (symmetric, so it reads the same flying either way)
  function owlSvg(body, shade, ink, eye = '#ffd23f') {
    const wing = `<path d="M-12 -8 Q-34 -26 -58 -17 L-51 -9 L-56 -3 L-46 1 L-49 8 L-37 7 L-37 14 L-24 11 L-13 17 Z" fill="${body}" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/>` +
      `<path d="M-20 -7 Q-36 -16 -50 -13 M-22 2 Q-34 -3 -44 -1" fill="none" stroke="${shade}" stroke-width="2.5" stroke-linecap="round"/>`;
    return '<svg viewBox="-60 -42 120 84">' + `<g>${wing}</g><g transform="scale(-1 1)">${wing}</g>` +
      `<ellipse cx="0" cy="6" rx="16" ry="21" fill="${body}" stroke="${ink}" stroke-width="2.5"/>` +
      `<path d="M-8 6 l3 3 l3 -3 M2 11 l3 3 l3 -3 M-6 17 l3 3 l3 -3" fill="none" stroke="${shade}" stroke-width="2" stroke-linecap="round"/>` +
      `<path d="M-12 -24 L-16 -36 L-4 -27 Z M12 -24 L16 -36 L4 -27 Z" fill="${body}" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/>` +
      `<circle cx="0" cy="-15" r="14" fill="${body}" stroke="${ink}" stroke-width="2.5"/>` +
      `<circle cx="-6" cy="-15" r="6.2" fill="${shade}"/><circle cx="6" cy="-15" r="6.2" fill="${shade}"/>` +
      `<circle cx="-6" cy="-15" r="4.3" fill="${eye}"/><circle cx="6" cy="-15" r="4.3" fill="${eye}"/>` +
      '<circle cx="-6" cy="-15" r="2" fill="#000"/><circle cx="6" cy="-15" r="2" fill="#000"/>' +
      '<path d="M-2.6 -10 L0 -5 L2.6 -10 Z" fill="#e0a800"/>' +
      `<path d="M-6 26 l-3 5 M-6 26 v6 M-6 26 l3 5 M6 26 l-3 5 M6 26 v6 M6 26 l3 5" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/></svg>`;
  }
  const OWL = owlSvg('#f7fbff', '#c4d6ec', '#27466e');            // the snowy owl itself
  const OWL_DARK = owlSvg('#1a2d55', '#2e4a80', '#0a1428');       // its night silhouette
  const OWL_GHOST = owlSvg('#dff4ff', '#9fdcff', '#7ab8ff', '#fff6c8'); // the faint trail it leaves

  // A soft feather (quill on the left), and an ice-tipped feather dart pointing RIGHT
  const FEATHER = '<svg viewBox="0 0 40 14"><path d="M2 7 Q14 -1 38 6 Q16 15 2 7 Z" fill="#f4f9ff" stroke="#6a8ab8" stroke-width="1.5"/>' +
    '<path d="M1 7 L36 6" stroke="#8aa4c8" stroke-width="1.2"/></svg>';
  const QUILL = '<svg viewBox="0 0 100 24"><path d="M4 12 Q20 0 62 8 L62 16 Q20 24 4 12 Z" fill="#f4f9ff" stroke="#27466e" stroke-width="2"/>' +
    '<path d="M10 7 L20 12 M18 5 L28 12 M28 5 L38 11 M10 17 L20 12 M18 19 L28 12 M28 19 L38 13" stroke="#9fb8d8" stroke-width="1.6"/>' +
    '<path d="M1 12 H66" stroke="#27466e" stroke-width="2.2"/>' +
    '<path d="M60 5 L98 12 L60 19 Z" fill="#bfe6ff" stroke="#1f5fbf" stroke-width="2" stroke-linejoin="round"/><path d="M63 8.5 L90 12 L63 11 Z" fill="#fff"/></svg>';
  // An owl's wing, spread and pointing RIGHT from the shoulder (leading edge on top)
  const WING = '<svg viewBox="0 0 100 56"><path d="M2 30 Q28 0 98 6 L88 15 L96 21 L82 26 L90 34 L74 36 L79 45 L62 43 L62 53 L44 45 L26 50 Z" fill="#f7fbff" stroke="#27466e" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M14 26 Q40 10 80 12 M22 34 Q46 24 70 26 M30 42 Q44 36 56 38" fill="none" stroke="#c4d6ec" stroke-width="3" stroke-linecap="round"/></svg>';
  // Talon rakes: three curved, tapering claw marks
  const TALONS = '<svg viewBox="0 0 90 100"><g fill="#fff" stroke="#0d3b7a" stroke-width="2.5" stroke-linejoin="round">' +
    [14, 38, 62].map(x => `<path d="M${x} 2 Q${x + 24} 50 ${x + 6} 98 Q${x + 12} 50 ${x} 2 Z"/>`).join('') + '</g></svg>';
  // A heavy storm cloud: a dark outline layer, the cloud, then lighter tops
  const CLOUD = (() => {
    const puffs = [[28, 38, 18], [54, 26, 23], [82, 32, 19], [101, 42, 13], [15, 46, 11]];
    const layer = (fill, grow, dy = 0, k = 1) => `<g fill="${fill}">` + puffs.map(([x, y, r]) => `<circle cx="${x}" cy="${y + dy}" r="${r * k + grow}"/>`).join('') +
      `<rect x="${14 - grow}" y="${38 + dy}" width="${92 + grow * 2}" height="${18 + grow}" rx="9"/></g>`;
    return '<svg viewBox="0 0 120 64">' + layer('#2c3e5c', 3) + layer('#8397b5', 0) + layer('#b3c3da', 0, -5, 0.62) + '</svg>';
  })();
  // Big glowing owl eyes; (lx, ly) nudges the pupils so they look somewhere
  function eyesSvg(lx = 0, ly = 0, iris = '#ffb300', inner = '#ffd23f') {
    const eye = cx => `<circle cx="${cx}" r="23" fill="#0d1f3a"/><circle cx="${cx}" r="19" fill="${iris}"/><circle cx="${cx}" r="15" fill="${inner}"/>` +
      `<circle cx="${cx + lx}" cy="${ly}" r="8.5" fill="#000"/><circle cx="${cx + lx - 4}" cy="${ly - 4}" r="3.2" fill="#fff"/>`;
    return '<svg viewBox="-60 -34 120 60">' + eye(-27) + eye(27) +
      '<path d="M-54 -22 Q-30 -36 -6 -19 M54 -22 Q30 -36 6 -19" fill="none" stroke="#0d1f3a" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M-4.5 10 L0 21 L4.5 10 Z" fill="#e0a800" stroke="#6a4000" stroke-width="1.5" stroke-linejoin="round"/></svg>';
  }
  const EYES_ICE = eyesSvg(0, 0, '#2a8ad1', '#9ff0ff');
  // Runes (tiny line glyphs) and the spinning rune circle
  const RUNE_PATHS = ['M-2 -4 V4 M-2 -4 L3 -1.5 M-2 0 L3 2.5', 'M-3 4 L0 -4 L3 4 M-1.8 1 H1.8', 'M0 -4 V4 M0 -1 L-3 -4 M0 -1 L3 -4',
    'M-3 -4 L3 4 M3 -4 L-3 4', 'M-2 -4 V4 L3 0 Z', 'M0 -4 L3 0 L0 4 L-3 0 Z M0 -4 V4'];
  const RUNES = RUNE_PATHS.map(d => '<svg viewBox="-5 -5 10 10"><path d="' + d + '" fill="none" stroke="#4a1a9a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="' + d + '" fill="none" stroke="#f0faff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>');
  const RUNE_CIRCLE = (() => {
    const art = (c, k) => `<g fill="none" stroke="${c}" stroke-linecap="round" stroke-linejoin="round">` +
      `<circle r="46" stroke-width="${3 * k}"/><circle r="33" stroke-width="${2 * k}"/>` +
      `<path d="M0 -32 L27.7 16 L-27.7 16 Z M0 32 L-27.7 -16 L27.7 -16 Z" stroke-width="${1.8 * k}"/>` +
      RUNE_PATHS.concat(RUNE_PATHS.slice(0, 2)).map((d, i) => `<g transform="rotate(${i * 45}) translate(0 -39.5) scale(0.95)"><path d="${d}" stroke-width="${1.5 * k}"/></g>`).join('') + '</g>';
    return '<svg viewBox="-50 -50 100 100">' + art('#4a1a9a', 2.2) + art('#e8f8ff', 1) + '<circle r="6" fill="#fff" opacity=".85"/></svg>';
  })();
  // A crystal ball on its stand
  const BALL = '<svg viewBox="0 0 80 88"><path d="M16 84 L64 84 L56 68 L24 68 Z" fill="#6a4ab8" stroke="#24104a" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M22 79 H58" stroke="#b89aff" stroke-width="2.5" stroke-linecap="round"/>' +
    '<circle cx="40" cy="36" r="30" fill="#d8ecff" fill-opacity=".9" stroke="#3a2a8a" stroke-width="3"/><circle cx="40" cy="36" r="24" fill="#b8a8ff" fill-opacity=".35"/>' +
    '<ellipse cx="29" cy="24" rx="9" ry="6" fill="#fff" opacity=".9" transform="rotate(-30 29 24)"/><circle cx="52" cy="50" r="3" fill="#fff" opacity=".7"/></svg>';
  // A cut diamond (facets in several blues) and a four-point diamond starburst
  const DIAMOND = '<svg viewBox="0 0 80 70"><path d="M20 4 H60 L76 22 L40 66 L4 22 Z" fill="#bfe6ff"/>' +
    '<path d="M20 4 L28 22 L4 22 Z M60 4 L52 22 L76 22 Z" fill="#e8f8ff"/><path d="M40 4 L52 22 L28 22 Z" fill="#fff"/>' +
    '<path d="M52 22 L76 22 L40 66 Z" fill="#6aa8f0"/><path d="M4 22 L28 22 L40 66 Z" fill="#9fd0ff"/>' +
    '<path d="M20 4 H60 L76 22 L40 66 L4 22 Z M4 22 H76 M20 4 L28 22 L40 66 L52 22 L60 4 M28 22 L40 4 L52 22" fill="none" stroke="#1f5fbf" stroke-width="3" stroke-linejoin="round"/></svg>';
  const star4 = (r, k) => `M0 ${-r} L${k} ${-k} L${r} 0 L${k} ${k} L0 ${r} L${-k} ${k} L${-r} 0 L${-k} ${-k} Z`;
  const STAR4 = `<svg viewBox="-50 -50 100 100"><path d="${star4(36, 8)}" transform="rotate(45)" fill="#bfe6ff" stroke="#2a6ad1" stroke-width="2.5" stroke-linejoin="round"/>` +
    `<path d="${star4(50, 10)}" fill="#fff" stroke="#2a6ad1" stroke-width="3" stroke-linejoin="round"/><circle r="9" fill="#fff"/></svg>`;
  // A chunky ice crystal pointing RIGHT (it grows out of its left end)
  const CRYSTAL_R = '<svg viewBox="0 0 100 44"><path d="M2 10 L64 4 L98 22 L64 40 L2 34 Z" fill="#bfe6ff" stroke="#1f5fbf" stroke-width="3.5" stroke-linejoin="round"/>' +
    '<path d="M64 4 L74 22 L64 40 M74 22 H98 M2 22 H74" fill="none" stroke="#7ab8ff" stroke-width="2.5"/><path d="M6 13 L62 8 L69 18 L6 19 Z" fill="#fff" opacity=".8"/></svg>';
  // Wolf jaws seen from the front: a snout dome with teeth hanging from it (the bottom jaw is the same, flipped)
  function jawSvg(gum, ink, tooth, { nose = false, flip = false } = {}) {
    let teeth = '';
    for (let i = 0; i < 8; i++) {
      const x = 12 + i * 13.7, fang = i === 1 || i === 6, len = fang ? 20 : 11, hw = fang ? 6.5 : 5.5;
      teeth += `<path d="M${(x - hw).toFixed(1)} 32 L${x.toFixed(1)} ${33 + len} L${(x + hw).toFixed(1)} 32 Z"/>`;
    }
    const body = `<g fill="${tooth}" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round">${teeth}</g>` +
      `<path d="M2 36 Q2 4 60 4 Q118 4 118 36 Z" fill="${gum}" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>` +
      '<path d="M14 26 Q20 11 44 9" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>' +
      (nose ? `<ellipse cx="60" cy="15" rx="11" ry="7" fill="${ink}"/><ellipse cx="56" cy="12.5" rx="4" ry="2" fill="#fff" opacity=".6"/>` : '');
    return '<svg viewBox="0 0 120 56">' + (flip ? `<g transform="translate(0 56) scale(1 -1)">${body}</g>` : body) + '</svg>';
  }
  const JAW_TOP = jawSvg('#bfe6ff', '#1f4f8f', '#ffffff', { nose: true }), JAW_BOT = jawSvg('#9fd0ff', '#1f4f8f', '#ffffff', { flip: true });
  const MAW_TOP = jawSvg('#0b1026', '#000', '#dfe6ff'), MAW_BOT = jawSvg('#0b1026', '#000', '#dfe6ff', { flip: true });
  // Icy teeth marks left by a CHOMP, and a round bite mark (two arcs of tooth dents)
  const TEETH_MARKS = '<svg viewBox="0 0 100 44"><g fill="#0d3b7a" stroke="#dff4ff" stroke-width="2" stroke-linejoin="round">' +
    [10, 25, 40, 60, 75, 90].map((x, i) => { const l = i === 1 || i === 4 ? 14 : 9; return `<path d="M${x - 5} 4 L${x} ${4 + l} L${x + 5} 4 Z"/><path d="M${x - 4} 40 L${x} ${42 - l} L${x + 4} 40 Z"/>`; }).join('') + '</g></svg>';
  const BITE = (() => {
    let d = '';
    for (let k = 0; k < 5; k++) for (const sd of [-1, 1]) {
      const th = Math.PI * (0.18 + 0.16 * k), x = 30 + 24 * Math.cos(th), y = 25 - sd * 17 * Math.sin(th);
      const l = Math.hypot(30 - x, 25 - y), nx = (30 - x) / l, ny = (25 - y) / l, len = k === 0 || k === 4 ? 9 : 6.5;
      d += `<path d="M${(x - ny * 3.6).toFixed(1)} ${(y + nx * 3.6).toFixed(1)} L${(x + nx * len).toFixed(1)} ${(y + ny * len).toFixed(1)} L${(x + ny * 3.6).toFixed(1)} ${(y - nx * 3.6).toFixed(1)} Z"/>`;
    }
    return `<svg viewBox="0 0 60 50"><g fill="#0d3b7a" stroke="#eaf8ff" stroke-width="1.6" stroke-linejoin="round">${d}</g></svg>`;
  })();
  // An icy paw print with claws
  const PAW = '<svg viewBox="-50 -50 100 100"><g fill="#bfe6ff" stroke="#1f5fbf" stroke-width="4" stroke-linejoin="round">' +
    '<path d="M0 2 C16 2 30 16 28 30 C26 42 12 40 0 38 C-12 40 -26 42 -28 30 C-30 16 -16 2 0 2 Z"/>' +
    [[-30, -12, -20], [-12, -30, -6], [12, -30, 6], [30, -12, 20]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="11" transform="rotate(${r} ${x} ${y})"/>`).join('') + '</g>' +
    '<g fill="#fff" stroke="#1f5fbf" stroke-width="2.5" stroke-linejoin="round">' +
    [[-34, -25, -20], [-14, -44, -6], [14, -44, 6], [34, -25, 20]].map(([x, y, r]) => `<path d="M${x - 4} ${y + 3} L${x} ${y - 9} L${x + 4} ${y + 3} Z" transform="rotate(${r} ${x} ${y})"/>`).join('') + '</g>' +
    '<path d="M-14 13 Q-4 7 7 11 M-24 -16 Q-26 -10 -24 -6" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>';
  // Three jagged frozen gashes (horizontal; rotated to match the claw swipe)
  const GASHES = '<svg viewBox="0 0 120 70">' + [14, 35, 56].map(y => {
    const pts = Array.from({ length: 9 }, (_, i) => `${6 + i * 13.5},${y + (i && i < 8 ? (i % 2 ? -3.5 : 3.5) : 0)}`).join(' ');
    return `<polyline points="${pts}" fill="none" stroke="#0d3b7a" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<polyline points="${pts}" fill="none" stroke="#dff4ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  }).join('') + '</svg>';
  // A snowy pine tree
  const PINE = '<svg viewBox="0 0 60 92"><rect x="25" y="76" width="10" height="14" rx="2" fill="#5a3a2a" stroke="#1f140e" stroke-width="2"/>' +
    '<g fill="#2f6a78" stroke="#10303a" stroke-width="2.5" stroke-linejoin="round"><path d="M30 38 L58 78 L2 78 Z"/><path d="M30 20 L52 54 L8 54 Z"/><path d="M30 3 L46 32 L14 32 Z"/></g>' +
    '<g fill="#fff"><path d="M30 3 L38 17 Q30 14 22 17 Z"/><path d="M14 32 Q22 28 30 31 Q38 28 46 32 L43 27 Q30 23 17 27 Z"/>' +
    '<path d="M8 54 Q18 49 30 53 Q42 49 52 54 L48 48 Q30 44 12 48 Z"/><path d="M2 78 Q16 72 30 77 Q44 72 58 78 L53 71 Q30 66 7 71 Z"/></g></svg>';
  // A pair of glowing wolf eyes in the dark
  const weyesSvg = (c = '#eaffff') => `<svg viewBox="0 0 40 14"><path d="M2 5 Q9 1 16 6.5 Q9 10 2 5 Z M38 5 Q31 1 24 6.5 Q31 10 38 5 Z" fill="${c}"/>` +
    '<path d="M9 3.5 V8 M31 3.5 V8" stroke="#0d1f3a" stroke-width="2" stroke-linecap="round"/></svg>';
  const WEYES = weyesSvg(), WEYES_GOLD = weyesSvg('#fff3a0');
  // A frost wolf leaping, side on, pointing RIGHT
  const WOLF = '<svg viewBox="0 0 120 60">' +
    '<path d="M4 14 Q16 18 28 22 Q52 12 80 15 L90 9 L95 1 L99 9 L108 12 L118 19 L113 24 L103 25 L97 30 L106 39 L117 46 L113 51 L100 45 L86 39 Q62 44 42 39 L24 49 L6 54 L8 49 L21 42 L27 35 Q18 30 4 14 Z" fill="#e6f0fa" stroke="#1f3556" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M44 36 Q62 40 84 35 M8 16 Q16 22 26 25" fill="none" stroke="#a9bfd8" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M34 23 Q56 15 78 18" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".85"/>' +
    '<path d="M113 24 L105 22" stroke="#1f3556" stroke-width="2" stroke-linecap="round"/><circle cx="104" cy="15.5" r="2.5" fill="#2ab8ff"/><circle cx="117.5" cy="19" r="2" fill="#1f3556"/></svg>';
  // A wolf sitting with its head thrown back, howling (a dark silhouette for in front of the moon)
  const HOWLER = '<svg viewBox="0 0 80 100"><path d="M16 98 Q8 96 4 88 Q2 80 8 77 Q9 86 18 88 Q15 72 22 58 Q28 46 33 36 L35 22 L36 8 L42 16 L46 13 L55 6 L64 1 L63 8 L56 15 L58 19 L50 25 Q49 38 53 50 Q58 62 57 78 L58 94 L66 95 L66 98 Z" fill="#101c3a" stroke="#fff6c8" stroke-width="1.5" stroke-linejoin="round"/>' +
    '<circle cx="47" cy="15" r="1.6" fill="#7ae0ff"/></svg>';
  // A howl: one sound-wave arc (mirrored for the other side)
  const ARC = '<svg viewBox="0 0 20 60"><path d="M4 4 Q22 30 4 56" fill="none" stroke="#fff6c8" stroke-width="5" stroke-linecap="round"/></svg>';
  // A snowy double mountain peak
  const MOUNTAIN = '<svg viewBox="0 0 120 80"><path d="M40 78 L78 10 L118 78 Z" fill="#8fb0d0" stroke="#27466e" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M78 10 L90 31 L84 28 L78 34 L72 28 L67 30 Z" fill="#fff" stroke="#27466e" stroke-width="2" stroke-linejoin="round"/>' +
    '<path d="M2 78 L44 22 L86 78 Z" fill="#aac6e2" stroke="#27466e" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M44 22 L57 39 L50 36 L44 43 L38 36 L31 39 Z" fill="#fff" stroke="#27466e" stroke-width="2" stroke-linejoin="round"/>' +
    '<path d="M20 70 L34 56 M60 60 L70 70" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/></svg>';
  // A ghostly wolf spirit: a wolf's head trailing a wisp of mist
  const GHOST = '<svg viewBox="-50 -56 100 124">' +
    '<path d="M-22 14 Q-30 40 -12 50 Q-22 60 -4 66 Q-6 56 6 52 Q24 44 22 14 Z" fill="#9fdcff" fill-opacity=".5" stroke="#e8fbff" stroke-width="2"/>' +
    '<path d="M-30 -50 L-15 -26 L15 -26 L30 -50 L35 -16 L42 -6 L30 2 L25 14 L10 26 L0 32 L-10 26 L-25 14 L-30 2 L-42 -6 L-35 -16 Z" fill="#bfeaff" fill-opacity=".72" stroke="#f0fcff" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<path d="M-26 -42 L-18 -28 L-25 -26 Z M26 -42 L18 -28 L25 -26 Z" fill="#7ac8ff" opacity=".8"/>' +
    '<path d="M-23 -9 L-6 -4 L-11 1 Z M23 -9 L6 -4 L11 1 Z" fill="#fff"/><path d="M-6 20 L6 20 L0 27 Z" fill="#2a6ad1"/>' +
    '<path d="M-14 6 Q0 14 14 6" fill="none" stroke="#7ac8ff" stroke-width="2" stroke-linecap="round"/></svg>';
  const WISP = '<i class="fxr-wisp fxr-wisp-frost"></i>';
  const PRISM = ['#ff9ad8', '#ffe066', '#7affc8', '#7ae0ff', '#b07cff', '#ffffff'];
  const NIGHT = vig('#020818f2');

  // ---------- Small helpers ----------
  const landAt = ctx => fxPoint(ctx.slot || ctx.win);
  const cardSize = ctx => sizeOf(ctx.slot, 58, 80);
  const accel = t => t * t, decel = t => 1 - (1 - t) * (1 - t);
  // A graphic spawned at (x, y) that plays its own keyframes. Returns the animation's promise.
  function put(x, y, html, frames, ms, { cls = '', size = null, easing = 'ease-out', style = {} } = {}) {
    const el = fxSpawn(x, y, { cls: 'fxi2-svg ' + cls, html, ms: ms + 40, size, style });
    return fxAnimate(el, frames, ms, easing);
  }
  // Points along a quadratic curve a → (pulled toward c) → b, and along a straight or bowed line
  const quad = (a, c, b) => t => [(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]];
  const line = (a, b, bow = 0) => { const d = dirOf(a, b); return t => [a[0] + d.dx * t + d.nx * Math.sin(Math.PI * t) * bow, a[1] + d.dy * t + d.ny * Math.sin(Math.PI * t) * bow]; };
  // Move a spawned element along path(s) (spawn it at path(0)). The easing is baked into the keyframes, so
  // afterimages() below can drop copies exactly where the element is at any moment.
  function glide(el, path, ms, { ease = t => t, steps = 12, rot = null, scale = [1, 1], alpha = null } = {}) {
    if (!el) return Promise.resolve();
    const [x0, y0] = path(0), frames = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, s = ease(t), [x, y] = path(s), k = scale[0] + (scale[1] - scale[0]) * s;
      const f = { transform: `translate(${x - x0}px, ${y - y0}px) rotate(${rot ? rot(s) : 0}deg) scale(${k})` };
      if (alpha) f.opacity = alpha(t);
      frames.push(f);
    }
    return fxAnimate(el, frames, ms, 'linear');
  }
  function fly(a, b, html, { cls = '', size = null, ms = 300, bow = 0, ease = t => t, scale = [1, 1], spin = 0 } = {}) {
    const el = fxSpawn(a[0], a[1], { cls: 'fxi2-svg ' + cls, html, ms: ms + 40, size });
    return glide(el, line(a, b, bow), ms, { ease, scale, rot: s => spin * s });
  }
  // Fading copies of a graphic dropped along a path while something glides along it (ghost trails)
  function afterimages(path, ms, html, { cls = '', every = 34, ease = t => t, size = null, scale = [1, 1], life = 320, rot = null, peak = 0.5 } = {}) {
    for (let k = every; k < ms - 10; k += every) later(k, () => {
      const s = ease(k / ms), [x, y] = path(s), sc = scale[0] + (scale[1] - scale[0]) * s, r = rot ? rot(s) : 0;
      put(x, y, html, [{ transform: `rotate(${r}deg) scale(${sc})`, opacity: peak }, { transform: `rotate(${r}deg) scale(${sc * 0.92})`, opacity: 0 }], life, { cls, size, easing: 'ease-in' });
    });
  }
  // A graphic that points RIGHT growing out of (bx, by) toward `deg` (crystals, icicles, quills)
  function jut(bx, by, deg, len, { ms = 800, html = CRYSTAL_R, cls = 'fxi2-crystal', aspect = 0.44 } = {}) {
    put(bx + len / 2, by, html, [
      { transform: `rotate(${deg}deg) scale(0, 0.4)`, opacity: 1 },
      { transform: `rotate(${deg}deg) scale(1.15, 1.05)`, opacity: 1, offset: 0.18 },
      { transform: `rotate(${deg}deg) scale(1)`, opacity: 1, offset: 0.7 },
      { transform: `rotate(${deg}deg) scale(0.85, 1)`, opacity: 0 },
    ], ms, { cls, size: [len, len * aspect], style: { transformOrigin: '0 50%' } });
  }
  // A ring of those jutting out of an ellipse round (x, y)
  function jutRing(x, y, rx, ry, n, len, { delay = 25, ...opts } = {}) {
    const a0 = fxRand(0, 1);
    for (let i = 0; i < n; i++) later(i * delay, () => {
      const a = ((i + a0) / n) * Math.PI * 2;
      jut(x + Math.cos(a) * rx, y + Math.sin(a) * ry, a * 180 / Math.PI, len * fxRand(0.8, 1.2), opts);
    });
  }
  // n parallel slashes across (x, y) at `deg`, `gap` px apart (claw / talon marks)
  function rake(x, y, deg, len, width, gap, { n = 3, cls = 'fxr-slash-ice', stagger = 40 } = {}) {
    const a = deg * Math.PI / 180, nx = -Math.sin(a), ny = Math.cos(a);
    for (let i = 0; i < n; i++) later(i * stagger, () => { const o = (i - (n - 1) / 2) * gap; slash(x + nx * o, y + ny * o, deg, len, width, cls); });
  }
  // One feather see-sawing gently down
  function feather(x, y, { fall = 60, ms = 900, size = 22, dx = 0 } = {}) {
    const s = fxRand(0.8, 1.2);
    put(x, y, FEATHER, [
      { transform: 'translate(0, 0) rotate(-30deg)', opacity: 0 },
      { transform: `translate(${10 + dx * 0.3}px, ${fall * 0.3}px) rotate(20deg)`, opacity: 1, offset: 0.3 },
      { transform: `translate(${-8 + dx * 0.6}px, ${fall * 0.65}px) rotate(-25deg)`, opacity: 1, offset: 0.65 },
      { transform: `translate(${6 + dx}px, ${fall}px) rotate(15deg)`, opacity: 0 },
    ], ms, { cls: 'fxi2-feather', size: [size * s, size * s * 0.36], easing: 'ease-in-out' });
  }
  const featherBurst = (x, y, { count = 10, spread = 120, gravity = 50, ms = 900 } = {}) =>
    fxParticles(x, y, { count, html: () => `<i class="fxi2-fp">${FEATHER}</i>`, colors: ['#fff'], size: [7, 11], spread, gravity, ms, spin: 300 });
  // Eyes (owl or wolf) that blink open, stare, blink once and fade
  function blinkEyes(x, y, html, size, ms = 1000, cls = 'fxi2-eyes', k = 1) {
    return put(x, y, html, [
      { transform: `scale(${k}, 0.02)`, opacity: 0 },
      { transform: `scale(${k}, 0.02)`, opacity: 1, offset: 0.08 },
      { transform: `scale(${k * 1.05}, ${k * 1.1})`, opacity: 1, offset: 0.22 },
      { transform: `scale(${k})`, opacity: 1, offset: 0.5 },
      { transform: `scale(${k}, ${k * 0.05})`, opacity: 1, offset: 0.57 },
      { transform: `scale(${k})`, opacity: 1, offset: 0.64 },
      { transform: `scale(${k})`, opacity: 1, offset: 0.85 },
      { transform: `scale(${k * 1.2}, ${k * 0.2})`, opacity: 0 },
    ], ms, { cls, size, easing: 'linear' });
  }
  // Icy wolf jaws that gape open, snap shut on (x, y) and hold for a beat. W = jaw width, snap = when they close (0..1)
  function chomp(x, y, W, { gap = 50, ms = 700, snap = 0.3, top = JAW_TOP, bottom = JAW_BOT, cls = 'fxi2-jaw' } = {}) {
    const H = W * 56 / 120, shut = H * 0.3;
    [[-1, top], [1, bottom]].forEach(([sd, html]) => put(x, y, html, [
      { transform: `translate(0, ${sd * (gap + shut) * 1.3}px) scale(0.7)`, opacity: 0 },
      { transform: `translate(0, ${sd * (gap + shut)}px) scale(1)`, opacity: 1, offset: snap * 0.6, easing: 'cubic-bezier(.6,0,1,.6)' },
      { transform: `translate(0, ${sd * shut}px) scale(1.06, 0.94)`, opacity: 1, offset: snap },
      { transform: `translate(0, ${sd * shut * 1.12}px) scale(1)`, opacity: 1, offset: Math.min(0.75, snap + 0.08) },
      { transform: `translate(0, ${sd * shut}px) scale(1)`, opacity: 1, offset: 0.8 },
      { transform: `translate(0, ${sd * (shut + 10)}px) scale(1)`, opacity: 0 },
    ], ms, { cls, size: [W, H] }));
  }
  // Howl sound waves: pairs of arcs rippling outward from a point
  function howlArcs(x, y, n = 3, { reach = 70, ms = 620, gap = 130 } = {}) {
    for (let i = 0; i < n; i++) later(i * gap, () => [-1, 1].forEach(sd => put(x + sd * 16, y, ARC, [
      { transform: `translate(0, 0) scale(${sd * 0.5}, 0.5)`, opacity: 0.95 },
      { transform: `translate(${sd * reach}px, -18px) scale(${sd * 1.5}, 1.5)`, opacity: 0 },
    ], ms, { cls: 'fxi2-arc', size: [16, 44] })));
  }
  // A small storm cloud that boils up, jostles and drifts away
  function cloud(x, y, w, ms = 1000) {
    return put(x, y, CLOUD, [
      { transform: 'scale(0.3, 0.2)', opacity: 0 },
      { transform: 'scale(1.1, 1)', opacity: 1, offset: 0.18 },
      { transform: 'translate(-3px, 0) scale(1)', opacity: 1, offset: 0.4 },
      { transform: 'translate(3px, 0) scale(1.03)', opacity: 1, offset: 0.6 },
      { transform: 'translate(0, -3px) scale(1)', opacity: 1, offset: 0.82 },
      { transform: 'translate(0, -10px) scale(1.1)', opacity: 0 },
    ], ms, { cls: 'fxi2-cloud', size: [w, w * 0.53] });
  }

  // ================= Silent Swoop (x5): a snowy owl drops out of the night sky, talons first =================
  CARD_FX['silent-swoop'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landAt(ctx), [w, h] = cardSize(ctx);
      frame(ctx.win, '#bfd4ff', 850);
      fxTint(VIG.deep, { ms: 850, opacity: 0.5 });
      // A crescent moon glints over the card...
      show(x + w * 0.34, y - h * 0.36, MOON, { cls: 'fxi2-moonglow', size: [30, 30], ms: 950, rise: 4 });
      later(260, () => sparkle(x + w * 0.34, y - h * 0.36, { count: 5, spread: 34, colors: ['#fff6c8', '#fff'] }));
      // ...and the owl's silhouette glides silently across it, one slow wingbeat, feathers drifting behind
      put(x, y, OWL_DARK, [
        { transform: `translate(${-w * 1.1}px, 12px) scale(0.6, 0.5) rotate(10deg)`, opacity: 0 },
        { transform: `translate(${-w * 0.5}px, 0) scale(0.8, 0.85) rotate(5deg)`, opacity: 1, offset: 0.25 },
        { transform: 'translate(0, -6px) scale(0.85, 0.5) rotate(0deg)', opacity: 1, offset: 0.5 },
        { transform: `translate(${w * 0.5}px, -12px) scale(0.8, 0.85) rotate(-5deg)`, opacity: 1, offset: 0.75 },
        { transform: `translate(${w * 1.1}px, -22px) scale(0.6, 0.5) rotate(-10deg)`, opacity: 0 },
      ], 880, { cls: 'fxi2-owl-dark', size: [84, 59], easing: 'ease-in-out' });
      for (let i = 0; i < 4; i++) later(160 + i * 120, () => feather(x + (-0.6 + i * 0.4) * w, y - 4, { fall: h * 0.6, dx: fxRand(-10, 10) }));
      plate(ctx, '🦉 SILENT SWOOP', '#bfd4ff');
    },
    // Night falls; the owl dives on a big curve out of the sky and swoops level into the victim, a ghostly trail behind
    windup(ctx) {
      const [tx, ty] = at(ctx), [sx] = src(ctx), side = Math.sign(sx - tx) || 1, crit = !!ctx.crit, ms = 380;
      dim(NIGHT, crit ? 0.85 : 0.7, 460);
      show(tx + side * 120, ty - 150, FULL_MOON, { cls: 'fxi2-moon', size: [56, 56], ms: 520, rise: 0, from: 0.8 });
      const a = [tx + side * 150, ty - 220], c = [tx + side * 70, ty + 80], b = [tx + side * 6, ty - 4];
      const path = quad(a, c, b), ease = t => t * t * (1.4 - 0.4 * t), rot = s => side * 30 * (1 - s) * (1 - s);
      const owl = fxSpawn(a[0], a[1], { cls: 'fxi2-svg fxi2-owl', html: OWL, ms: ms + 40, size: [110, 77] });
      afterimages(path, ms, OWL_GHOST, { cls: 'fxi2-ghost', size: [110, 77], ease, scale: [0.5, 1.25], rot, peak: 0.45 });
      return glide(owl, path, ms, { ease, scale: [0.5, crit ? 1.5 : 1.3], rot });
    },
    // Three curved talon rakes rip down the victim and feathers burst everywhere
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit, s = Math.min(1.7, 0.6 + p * 0.5);
      core(tx, ty, 130 * p, 'moon');
      const rakeAt = (dx, deg, k) => put(tx + dx, ty, TALONS, [
        { transform: `rotate(${deg}deg) scale(${k}, 0)`, opacity: 1 },
        { transform: `rotate(${deg}deg) scale(${k}, ${k * 1.06})`, opacity: 1, offset: 0.22 },
        { transform: `rotate(${deg}deg) scale(${k})`, opacity: 1, offset: 0.7 },
        { transform: `rotate(${deg}deg) scale(${k})`, opacity: 0 },
      ], 720, { cls: 'fxi2-talons', size: [90, 100], style: { transformOrigin: '50% 0' } });
      rakeAt(0, -20, s);
      if (crit) later(90, () => rakeAt(6, 24, s * 0.9)); // a crit rakes back the other way too
      featherBurst(tx, ty, { count: crit ? 14 : 10, spread: 140 * p });
      sparkle(tx, ty, { count: 6, spread: 90 * p, colors: ['#fff', '#fff6c8', '#bfe6ff'] });
      fxRing(tx, ty, { color: '#ffffff', size: 150 * p, width: 6, ms: 380 });
      later(70, () => fxRing(tx, ty, { color: '#bfd4ff', size: 230 * p, width: 4, ms: 500 }));
      const [px, py] = stampPoint(ctx, -6);
      slam(px, py, crit ? 'SILENT STRIKE!!' : 'SWOOP!', { kind: 'moon', size: crit ? 38 : Math.min(56, 32 + 12 * p), rotate: -6, ms: 880, star: crit ? '#fff6c8' : null });
      fxShake(ctx.panel, Math.min(22, 11 * p), 380);
      fxShake(ctx.to, 10, 300);
      if (crit) haptic(60);
    },
  };

  // ================= Blizzard (x3 + frostbite): a howling snowstorm blasts the victim =================
  CARD_FX['blizzard'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landAt(ctx), [w, h] = cardSize(ctx), cy = y - h * 0.44;
      frame(ctx.win, '#dfe8f5', 900);
      // A storm cloud boils up over the card and it snows hard, slanting in the wind
      cloud(x, cy, w * 1.6, 1050);
      later(140, () => snowfall(x - 8, cy + 12, w * 1.3, 14, { fall: h * 0.9, ms: 800 }));
      for (let i = 0; i < 6; i++) later(200 + i * 80, () => {
        const sx = x - w * 0.7 + fxRand(0, w * 0.4), sy = y + fxRand(-h * 0.35, h * 0.3);
        fxBeam([sx, sy], [sx + w * 0.9, sy + 22], { cls: 'fxi2-gust', ms: 320, width: 2.5 });
      });
      later(300, () => frostPuff(x, y + h * 0.36, 3, { size: 36, spread: w }));
      plate(ctx, '🌨️ BLIZZARD', '#dfe8f5');
    },
    // A blizzard gust: driving streaks of snow blast diagonally from the owl across to the victim
    windup(ctx) {
      const from = src(ctx), to = at(ctx), d = dirOf(from, to), crit = !!ctx.crit;
      fxTint(vig('#dfe8f5aa'), { ms: 500, opacity: 0.6 });
      const n = crit ? 12 : 9;
      for (let i = 0; i < n; i++) later(i * 28, () => {
        const off = fxRand(-50, 50), a = [from[0] + d.nx * off, from[1] + d.ny * off - 30];
        fxBeam(a, [to[0] + d.nx * off * 0.5 + d.ux * 40, to[1] + d.ny * off * 0.5 + d.uy * 40 + 12], { cls: 'fxi2-gust', ms: 280, width: fxRand(3, 6) });
      });
      for (let i = 0; i < 7; i++) later(i * 34, () => fxFly([from[0] + fxRand(-20, 20), from[1] - 30 + fxRand(-26, 26)],
        [to[0] + fxRand(-40, 40), to[1] + fxRand(-20, 24)], { html: `<i class="fxr-flake">${FLAKE}</i>`, cls: 'fxi2-flakefly', ms: 250, spin: 360, arc: fxRand(-30, 30), easing: 'ease-in' }));
      return fxFly([from[0], from[1] - 30], to, { cls: 'fxi2-gustball', ms: 320, scale: [0.6, crit ? 2.4 : 1.9], easing: 'ease-in' });
    },
    // WHITEOUT: a burst of snow and the whole screen goes white for a moment
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit, [w] = sizeOf(ctx.to, 200, 46);
      fxTint('#ffffff', { ms: crit ? 750 : 560, opacity: crit ? 0.78 : 0.58 });
      core(tx, ty, 170 * p, 'white', 440);
      snowflakes(tx, ty, { count: 14, spread: 160 * p, gravity: 40, ms: 950 });
      frostPuff(tx, ty, 6, { size: 60 * Math.min(1.5, p), spread: w * 0.6, ms: 950 });
      fxRing(tx, ty, { color: '#ffffff', size: 180 * p, width: 8, ms: 460 });
      later(80, () => fxRing(tx, ty, { color: '#bfe6ff', size: 250 * p, width: 4, ms: 540 }));
      if (crit) speedLines(tx, ty, { n: 10, r0: 40, r1: 150 * p, cls: 'fxr-line', width: 5 });
      const [px, py] = stampPoint(ctx, 4);
      slam(px, py, crit ? 'TOTAL WHITEOUT!!' : 'WHITEOUT!', { kind: 'snow', size: crit ? 36 : Math.min(52, 30 + 11 * p), rotate: 5, ms: 900, star: crit ? '#ffffff' : null });
      fxShake(ctx.panel, Math.min(20, 10 * p), 360);
      fxShake(ctx.to, 8, 300);
    },
    // Frostbite (after the hit): the kit's frost creeps over the victim, and a little snow cloud parks over them
    gimmick(ctx) {
      frost.frostbite(ctx, { word: 'FROSTBITE!' });
      const [x, y] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46), cy = y - h * 0.5 - 62;
      cloud(x, cy, Math.min(150, w * 0.75), 1150);
      later(130, () => snowfall(x, cy + 12, Math.min(150, w * 0.75), 14, { fall: h + 70, ms: 950 }));
    },
  };

  // ================= Deep Freeze (x2, stun): a freezing ray from the owl's eyes =================
  CARD_FX['deep-freeze'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landAt(ctx), [w, h] = cardSize(ctx);
      frame(ctx.win, '#7ae0ff', 950);
      // Rime frosts over the card from the edges in, a frost crack spreads...
      put(x, y, '', [{ transform: 'scale(1.12)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: 0.3 },
        { transform: 'scale(1)', opacity: 1, offset: 0.78 }, { transform: 'scale(1.02)', opacity: 0 }], 1000, { cls: 'fxi2-rime', size: [w + 6, h + 6] });
      later(100, () => crackBurst(x, y, w * 1.5, 'frost', fxRand(0, 60), 850));
      // ...and a small block of ice clunks down over the slot, then pops
      later(250, () => {
        iceBlock(null, { pt: [x, y], size: [w, h], pad: 5, ms: 720, shatter: false });
        frostPuff(x, y + h * 0.35, 3, { size: 36, spread: w });
      });
      later(830, () => iceShards(x, y, { count: 8, spread: 80, size: [5, 10], ms: 520 }));
      plate(ctx, '🥶 DEEP FREEZE', '#7ae0ff');
    },
    // The owl's eyes flash icy blue and shoot twin freezing rays, sparkling along their length
    windup(ctx) {
      const from = src(ctx), [tx, ty] = at(ctx), crit = !!ctx.crit, ey = from[1] - 4;
      put(from[0], ey, EYES_ICE, [
        { transform: 'scale(1, 0.05)', opacity: 0 }, { transform: 'scale(1.15)', opacity: 1, offset: 0.3 },
        { transform: 'scale(1)', opacity: 1, offset: 0.8 }, { transform: 'scale(1.2, 0.2)', opacity: 0 },
      ], 460, { cls: 'fxi2-eyes-ice', size: [72, 36], easing: 'ease-out' });
      charge(from[0], ey, { colors: ['#fff', '#7ae0ff', '#bfe6ff'], n: 8, r: 60, ms: 150 });
      later(130, () => {
        [-1, 1].forEach(k => fxBeam([from[0] + k * 16, ey - 2], [tx + k * 5, ty], { cls: 'fxi2-ray', ms: 400, width: crit ? 12 : 9 }));
        for (let i = 1; i <= 5; i++) later(i * 24, () => {
          const t = i / 6;
          fxParticles(from[0] + (tx - from[0]) * t, ey + (ty - ey) * t, { count: 2, html: '✦', colors: ['#fff', '#bfe6ff'], size: [4, 8], spread: 22, ms: 380, spin: 90 });
        });
        sfx('shield', 1.8, 0.35); // icy shimmer
      });
      return wait(300);
    },
    // Frost crystals burst up all around the victim
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit, [w, h] = sizeOf(ctx.to, 200, 46);
      core(tx, ty, 120 * p, 'frost');
      jutRing(tx, ty, w * 0.46, h * 0.5 + 4, crit ? 10 : 8, 34 * Math.min(1.5, p), { delay: 22, ms: 820 });
      frostBloom(tx, ty, Math.min(190, w * 0.9), 700);
      sparkle(tx, ty, { count: 10, spread: 110 * p });
      fxRing(tx, ty, { color: '#7ae0ff', size: 170 * p, width: 6 });
      const [px, py] = stampPoint(ctx);
      slam(px, py, crit ? 'SUB-ZERO!!' : 'ICE RAY!', { kind: 'deep', size: crit ? 40 : Math.min(52, 30 + 11 * p), rotate: -5, ms: 850, star: crit ? '#7ae0ff' : null });
      fxShake(ctx.panel, Math.min(18, 9 * p), 340);
      fxShake(ctx.to, 8, 280);
    },
    // Stun: frozen solid in the kit's ice block, with extra crystals jutting out of it
    gimmick(ctx) {
      frost.freeze(ctx, { word: 'DEEP FREEZE!' });
      const [x, y] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46);
      later(170, () => jutRing(x, y, w * 0.5 + 14, h * 0.5 + 14, 10, 40, { delay: 24, ms: 900 }));
    },
  };

  // ================= Quill Volley (x2, frenzy: 3 strikes): volleys of ice-tipped feather darts =================
  let volley = null; // where the last volley's darts hit (so impact can stick them in the right places)
  CARD_FX['quill-volley'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landAt(ctx), [w, h] = cardSize(ctx), px = x, py = y + h * 0.18, n = 7, len = 60;
      frame(ctx.win, '#bfe6ff', 850);
      glint(ctx.slot);
      // Ice-tipped feathers fan out of the card like a hand of cards, and their tips glint
      for (let i = 0; i < n; i++) {
        const deg = -90 + (i - (n - 1) / 2) * 22;
        put(px + len / 2, py, QUILL, [
          { transform: 'rotate(-90deg) scale(0.2)', opacity: 0 },
          { transform: `rotate(${deg}deg) scale(1.05)`, opacity: 1, offset: 0.3 },
          { transform: `rotate(${deg}deg) scale(1)`, opacity: 1, offset: 0.78 },
          { transform: `rotate(${deg}deg) scale(1.12)`, opacity: 0 },
        ], 900, { cls: 'fxi2-quill', size: [len, len * 0.24], style: { transformOrigin: '0 50%' }, easing: 'cubic-bezier(.3,1.3,.5,1)' });
        const a = deg * Math.PI / 180;
        later(330 + i * 35, () => put(px + Math.cos(a) * len, py + Math.sin(a) * len, '✦', [{ transform: 'scale(0.2) rotate(0deg)', opacity: 0 },
          { transform: 'scale(1.2) rotate(45deg)', opacity: 1, offset: 0.4 }, { transform: 'scale(0.3) rotate(90deg)', opacity: 0 }], 360, { cls: 'fxi2-twinkle' }));
      }
      plate(ctx, '🏹 QUILL VOLLEY', '#bfe6ff');
    },
    // Frenzy (before the strikes): the owl spreads its great wings and a fan of quills bristles up round its HP box
    gimmick(ctx) {
      const [x, y] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46), ww = Math.min(110, w * 0.55);
      frost.frenzy(ctx, { word: 'QUILLS UP!', html: () => `<i class="fxi2-fp">${FEATHER}</i>` });
      [-1, 1].forEach(sd => {
        const open = sd > 0 ? -28 : 208, shut = sd > 0 ? 70 : 110, flip = sd > 0 ? '' : ' scale(1, -1)', bx = x + sd * w * 0.4;
        put(bx + ww / 2, y - 2, WING, [
          { transform: `rotate(${shut}deg) scale(0.5)${flip}`, opacity: 0 },
          { transform: `rotate(${open - sd * 8}deg) scale(1.08)${flip}`, opacity: 1, offset: 0.25 },
          { transform: `rotate(${open}deg) scale(1)${flip}`, opacity: 1, offset: 0.4 },
          { transform: `rotate(${open + sd * 10}deg) scale(1)${flip}`, opacity: 1, offset: 0.6 },
          { transform: `rotate(${open}deg) scale(1)${flip}`, opacity: 1, offset: 0.8 },
          { transform: `rotate(${open}deg) scale(1.1)${flip}`, opacity: 0 },
        ], 1000, { cls: 'fxi2-wing', size: [ww, ww * 0.56], style: { transformOrigin: '0 50%' } });
      });
      for (let i = 0; i < 9; i++) later(120 + i * 28, () => {
        const deg = 180 + (i / 8) * 180, a = deg * Math.PI / 180;
        jut(x + Math.cos(a) * w * 0.3, y + Math.sin(a) * (h * 0.5 + 2), deg, 44, { ms: 900, html: QUILL, cls: 'fxi2-quill', aspect: 0.24 });
      });
    },
    // Each strike looses a volley of 2, then 3, then 4 ice-tipped darts
    windup(ctx) {
      const s = clamp(ctx.strike || 0, 0, 2), [tx, ty] = at(ctx), n = 2 + s, hits = [], flights = [];
      for (let i = 0; i < n; i++) {
        const [sx, sy] = src(ctx), from = i === 0 && s === 0 ? launchPoint(ctx) : [sx + fxRand(-30, 30), sy + fxRand(-14, 14)];
        const to = [tx + fxRand(-28, 28), ty + fxRand(-12, 12)], arc = (i % 2 ? -1 : 1) * (26 + i * 16), d = dirOf(from, to);
        const ang = Math.atan2(d.dy - d.ny * arc * Math.PI, d.dx - d.nx * arc * Math.PI) * 180 / Math.PI; // heading as it arrives
        hits.push([to[0], to[1], ang]);
        flights.push(new Promise(r => later(i * 40, () => aimFly(from, to, { html: QUILL, cls: 'fxi2-quill', size: [56, 14], ms: 240 - s * 20, arc,
          trail: i === 0 ? 'fxi2-trail-quill' : '', trailEvery: 28, easing: 'cubic-bezier(.3,0,.8,.6)', scale: [0.7, 1.15] }).then(r))));
      }
      volley = { t: performance.now(), hits };
      if (s === 2) dim(VIG.frost, 0.6, 320);
      return Promise.all(flights);
    },
    // The darts thunk in and quiver, ice shards fly: THWIP! → THWIP-THWIP!! → QUILL STORM!!!
    impact(ctx) {
      const s = clamp(ctx.strike || 0, 0, 2), [tx, ty] = at(ctx), p = pow(ctx) + s * 0.2, crit = !!ctx.crit;
      const hits = volley && performance.now() - volley.t < 1200 ? volley.hits : Array.from({ length: 2 + s }, () => [tx + fxRand(-28, 28), ty + fxRand(-12, 12), fxRand(160, 200)]);
      hits.forEach(([hx, hy, ang], i) => later(i * 30, () => {
        const a = ang * Math.PI / 180, cx = hx - Math.cos(a) * 17, cy = hy - Math.sin(a) * 17; // the tip sits in the target
        put(cx, cy, QUILL, [
          { transform: `rotate(${ang}deg) scale(1.1)`, opacity: 1 },
          { transform: `rotate(${ang + 9}deg) scale(1.1)`, opacity: 1, offset: 0.08 },
          { transform: `rotate(${ang - 7}deg) scale(1.1)`, opacity: 1, offset: 0.16 },
          { transform: `rotate(${ang + 4}deg) scale(1.1)`, opacity: 1, offset: 0.24 },
          { transform: `rotate(${ang}deg) scale(1.1)`, opacity: 1, offset: 0.75 },
          { transform: `rotate(${ang}deg) scale(1.1)`, opacity: 0 },
        ], 760, { cls: 'fxi2-quill', size: [56, 14], easing: 'linear' });
        iceShards(hx, hy, { count: 4, spread: 55, size: [5, 9], ms: 450 });
      }));
      for (let i = 0; i <= s; i++) later(i * 70, () => fxRing(tx, ty, { color: i % 2 ? '#ffffff' : '#7ab8ff', size: 130 + 50 * i + 30 * s, ms: 420, width: 6 }));
      const [px, py] = stampPoint(ctx, (s - 1) * 22);
      slam(px, py, ['THWIP!', 'THWIP-THWIP!!', 'QUILL STORM!!!'][s], { kind: s === 2 ? 'deep' : 'frost',
        size: [30, 32, 36][s] + (crit ? 6 : 0), rotate: [-8, 6, -4][s], ms: 650 + s * 150, star: s === 2 ? '#bfe6ff' : null });
      fxShake(ctx.panel, 6 + s * 5, 260 + s * 60);
      fxShake(ctx.to, 6 + s * 3, 250);
      if (s === 2) {
        crackBurst(tx, ty, 180, 'ice', fxRand(0, 60), 850);
        featherBurst(tx, ty, { count: 12, spread: 160 });
        speedLines(tx, ty, { n: 10, r0: 50, r1: 160, cls: 'fxr-line-ice', width: 4 });
        fxTint('#7ab8ff', { ms: 380, opacity: 0.3 });
        haptic(60);
      }
    },
  };

  // ================= Owl Eyes (focus: +50% crit): two huge eyes open in the dark and lock on =================
  CARD_FX['owl-eyes'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landAt(ctx), [w, h] = cardSize(ctx);
      frame(ctx.win, '#ffd23f', 950);
      // The card goes dark, and two huge glowing owl eyes blink open on it
      put(x, y, '', [{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.82 }, { opacity: 0 }], 1050, { cls: 'fxi2-darkcard', size: [w + 8, h + 8] });
      later(80, () => blinkEyes(x, y - h * 0.06, eyesSvg(), [w * 1.3, w * 0.65], 950, 'fxi2-eyes'));
      later(300, () => [-1, 1].forEach(k => sparkle(x + k * w * 0.3, y - h * 0.1, { count: 3, spread: 26, colors: ['#fff', '#fff3a0'] })));
      plate(ctx, '👀 OWL EYES', '#ffd23f');
    },
    // Focus: the eyes open wide over the owl's HP box and stare the victim down while the kit's frosty reticle locks on
    gimmick(ctx) {
      const [fx, fy] = src(ctx), [tx, ty] = at(ctx), [w] = sizeOf(ctx.from, 200, 46), d = dirOf([fx, fy], [tx, ty]), ew = Math.min(150, w * 0.8);
      fxTint(VIG.deep, { ms: 1000, opacity: 0.5 });
      frost.focus(ctx, { word: 'I SEE YOU...' });
      blinkEyes(fx, fy - 2, eyesSvg(d.ux * 5, d.uy * 4), [ew, ew * 0.5], 1150, 'fxi2-eyes');
      later(300, () => [-1, 1].forEach(k => fxBeam([fx + k * ew * 0.22, fy - 2], [tx, ty], { cls: 'fxi2-gaze', ms: 700, width: 3 })));
      sfx('buff', 0.7, 0.3);
    },
  };

  // ================= Crystal Spell (x4, double vs frostbite): a crystal orb cast through a rune circle =================
  CARD_FX['crystal-spell'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landAt(ctx), [w] = cardSize(ctx), s = w * 1.1, oy = y - 4 - s * 0.1;
      frame(ctx.win, '#b07cff', 950);
      fxTint(VIG.aurora, { ms: 850, opacity: 0.4 });
      put(x, oy, '', [{ transform: 'scale(0.4)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: 0.3 },
        { transform: 'scale(1.1)', opacity: 0.8, offset: 0.75 }, { transform: 'scale(1.25)', opacity: 0 }], 1050, { cls: 'fxi2-glow-violet', size: [s * 1.8, s * 1.8] });
      // The crystal ball rises, mist swirling inside it...
      put(x, y - 4, BALL, [{ transform: 'translate(0, 16px) scale(0.3)', opacity: 0 }, { transform: 'translate(0, 0) scale(1.08)', opacity: 1, offset: 0.2 },
        { transform: 'scale(1)', opacity: 1, offset: 0.82 }, { transform: 'translate(0, -8px) scale(0.95)', opacity: 0 }], 1050, { cls: 'fxi2-ball', size: [s, s * 1.1] });
      put(x, oy, '', [{ transform: 'rotate(0deg) scale(0.3)', opacity: 0 }, { transform: 'rotate(160deg) scale(1)', opacity: 0.95, offset: 0.3 },
        { transform: 'rotate(540deg) scale(1)', opacity: 0.95, offset: 0.8 }, { transform: 'rotate(720deg) scale(0.8)', opacity: 0 }], 1050, { cls: 'fxi2-mist', size: [s * 0.62, s * 0.62], easing: 'linear' });
      // ...and glowing runes circle round it
      later(130, () => orbit(x, oy, i => `<i class="fxi2-rune">${RUNES[i % RUNES.length]}</i>`, 5, { rx: s * 0.78, ry: s * 0.3, ms: 880, size: 15, turns: 1 }));
      later(320, () => sparkle(x, oy, { count: 6, spread: 50, colors: ['#fff', '#e0d0ff', '#b4f0ff'] }));
      plate(ctx, '🔮 CRYSTAL SPELL', '#b07cff');
    },
    // A rune circle spins up in front of the owl (seen edge-on, facing the victim) and a crystal orb shoots through it
    windup(ctx) {
      const from = src(ctx), [tx, ty] = at(ctx), d = dirOf(from, [tx, ty]), crit = !!ctx.crit;
      const c = [from[0] + d.ux * 34, from[1] + d.uy * 34], disc = spin => `rotate(${d.ang}deg) scale(0.42, 1) rotate(${spin}deg)`;
      put(c[0], c[1], RUNE_CIRCLE, [
        { transform: `${disc(0)} scale(0.2)`, opacity: 0 },
        { transform: `${disc(140)} scale(1)`, opacity: 1, offset: 0.3 },
        { transform: `${disc(300)} scale(1)`, opacity: 1, offset: 0.75 },
        { transform: `${disc(400)} scale(1.3)`, opacity: 0 },
      ], 540, { cls: 'fxi2-runecircle', size: [96, 96], easing: 'linear' });
      charge(c[0], c[1], { colors: ['#fff', '#b07cff', '#7ae0ff'], n: 8, r: 60, ms: 150 });
      return new Promise(r => later(100, () => fxFly(c, [tx, ty], { html: '<i class="fxi2-orb"></i>', cls: 'fxi2-orbfly', ms: 280, arc: -24,
        scale: [0.5, crit ? 1.7 : 1.35], trail: 'fxi2-trail-prism', trailEvery: 28, easing: 'cubic-bezier(.4,0,.9,.6)' }).then(r)));
    },
    // The orb shatters into prism shards. Against a frostbitten victim it goes off as a huge double ice explosion.
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit, bitten = (ctx.defender?.poison || 0) > 0;
      const [px, py] = stampPoint(ctx);
      fxParticles(tx, ty, { count: bitten ? 22 : 16, cls: 'fxi2-prism', colors: PRISM, spread: (bitten ? 210 : 140) * p, size: [8, 16], gravity: 60, ms: 760, spin: 540 });
      core(tx, ty, 130 * p, 'aurora');
      fxRing(tx, ty, { color: '#e0d0ff', size: 160 * p, width: 6 });
      sfx('coin', 1.7, 0.3); // glassy tinkle
      if (!bitten) {
        sparkle(tx, ty, { count: 8, spread: 100 * p, colors: PRISM });
        slam(px, py, crit ? 'PRISM BLAST!!' : 'CRYSTAL!', { kind: 'aurora', size: crit ? 38 : Math.min(52, 30 + 10 * p), rotate: 5, ms: 850, star: crit ? '#e0d0ff' : null });
        fxShake(ctx.panel, Math.min(18, 9 * p), 340);
        fxShake(ctx.to, 8, 280);
        return;
      }
      flash('#bfe6ff', crit ? 0.6 : 0.45);
      core(tx, ty, 260 * p, 'frost', 520);
      later(50, () => crackBurst(tx, ty, Math.min(420, 220 * p), 'ice', fxRand(0, 60), 950));
      frostBloom(tx, ty, Math.min(300, 190 * p), 850, true);
      iceShards(tx, ty, { count: 18, spread: 220 * p, size: [10, 20] });
      for (let i = 0; i < 3; i++) later(i * 80, () => fxRing(tx, ty, { color: ['#ffffff', '#7ae0ff', '#b07cff'][i], size: Math.min(700, (220 + i * 100) * p), width: 10 - i * 2, ms: 580 }));
      speedLines(tx, ty, { n: 10, r0: 50, r1: 170 * p, cls: 'fxr-line-ice', width: 5 });
      slam(px, py, crit ? 'MEGA SHATTER ×2!!' : 'SHATTER ×2!', { kind: 'aurora', size: crit ? 36 : 40, rotate: -6, ms: 1050, star: '#e0d0ff' });
      fxShake(ctx.panel, Math.min(28, 16 * p), 520);
      fxShake(ctx.to, 14, 380);
      sfx('blocked', 0.6, 0.8);
      haptic(90);
    },
    // Venomfang (after the hit): the runes flare on a frostbitten victim; otherwise only a faint glimmer
    gimmick(ctx) {
      const [x, y] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46);
      if (!((ctx.defender?.poison || 0) > 0)) { sparkle(x, y - 4, { count: 4, spread: 40, colors: ['#e0d0ff', '#ffffff'] }); return; }
      put(x, y + h * 0.3, RUNE_CIRCLE, [
        { transform: 'scale(0.4, 0.14) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1.1, 0.38) rotate(60deg)', opacity: 1, offset: 0.3 },
        { transform: 'scale(1, 0.35) rotate(150deg)', opacity: 1, offset: 0.7 },
        { transform: 'scale(1.2, 0.42) rotate(200deg)', opacity: 0 },
      ], 760, { cls: 'fxi2-runecircle', size: [Math.min(170, w * 0.9), Math.min(170, w * 0.9)], easing: 'linear' });
      for (let i = 0; i < 4; i++) later(80 + i * 70, () => put(x + (i - 1.5) * w * 0.2, y - h * 0.2, RUNES[i], [{ transform: 'translate(0, 6px) scale(0.3)', opacity: 0 },
        { transform: 'translate(0, -6px) scale(1.2)', opacity: 1, offset: 0.35 }, { transform: 'translate(0, -24px) scale(0.9)', opacity: 0 }], 560, { cls: 'fxi2-runeflash', size: [18, 18] }));
      sparkle(x, y, { count: 6, spread: 60, colors: ['#e0d0ff', '#b4f0ff', '#fff'] });
    },
  };

  // ================= Frost Nova (x6, cleave): a diamond-bright blast of ice crystals =================
  CARD_FX['frost-nova'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landAt(ctx), [w, h] = cardSize(ctx), dy = y - 6;
      frame(ctx.win, '#dff4ff', 950);
      // Light rays wheel round behind a diamond that spins like a coin, its facets flashing
      put(x, dy, '', [{ transform: 'rotate(0deg) scale(0.3)', opacity: 0 }, { transform: 'rotate(40deg) scale(1)', opacity: 1, offset: 0.25 },
        { transform: 'rotate(110deg) scale(1.05)', opacity: 0.85, offset: 0.75 }, { transform: 'rotate(150deg) scale(1.2)', opacity: 0 }], 1050, { cls: 'fxi2-rays', size: [w * 2.5, w * 2.5], easing: 'linear' });
      put(x, dy, DIAMOND, [
        { transform: 'scale(0.2)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1, offset: 0.15 },
        { transform: 'scale(0.08, 1)', opacity: 1, offset: 0.3 },
        { transform: 'scale(-1, 1)', opacity: 1, offset: 0.45 },
        { transform: 'scale(0.08, 1)', opacity: 1, offset: 0.6 },
        { transform: 'scale(1)', opacity: 1, offset: 0.75 },
        { transform: 'scale(1.3)', opacity: 0 },
      ], 1050, { cls: 'fxi2-diamond', size: [w * 1.1, w * 0.96], easing: 'ease-in-out' });
      [160, 420, 700, 800].forEach(t => later(t, () => put(x + fxRand(-w * 0.3, w * 0.3), dy + fxRand(-w * 0.25, w * 0.1), '✦', [{ transform: 'scale(0.2) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1.4) rotate(45deg)', opacity: 1, offset: 0.4 }, { transform: 'scale(0.3) rotate(90deg)', opacity: 0 }], 340, { cls: 'fxi2-twinkle' })));
      later(760, () => sparkle(x, dy, { count: 8, spread: 70 }));
      plate(ctx, '💎 FROST NOVA', '#dff4ff');
    },
    // Cleave (before the hit): the kit's ice spike smashes any shields, and a ring of ice spikes stabs up round the victim
    gimmick(ctx) {
      frost.smash(ctx, { word: 'NOVA SMASH!' });
      const [x, y] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46), big = !!ctx.blocked;
      later(big ? 230 : 110, () => jutRing(x, y, w * 0.48, h * 0.5 + 8, big ? 12 : 8, big ? 46 : 32, { delay: 16, ms: 700, html: ICICLE, cls: 'fxi2-spike', aspect: 0.33 }));
    },
    // The owl charges up, then a ring of ice crystals bursts out of it and rushes all the way out to the victim
    windup(ctx) {
      const from = src(ctx), to = at(ctx), R = dirOf(from, to).len, crit = !!ctx.crit;
      charge(from[0], from[1], { colors: ['#fff', '#dff4ff', '#7ae0ff'], n: 12, r: 90, ms: 170 });
      jolt(ctx.from, [{ transform: 'scale(1)' }, { transform: 'scale(0.92)', offset: 0.6 }, { transform: 'scale(1.08)', offset: 0.8 }, { transform: 'scale(1)' }], 300);
      sfx('buff', 0.8, 0.35);
      return new Promise(r => later(170, () => {
        core(from[0], from[1], 110, 'frost', 280);
        fxRing(from[0], from[1], { color: '#dff4ff', size: R * 2.1, width: crit ? 8 : 5, ms: 260 });
        const n = crit ? 14 : 12;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
          aimFly([from[0] + c * 20, from[1] + s * 20], [from[0] + c * R, from[1] + s * R], { html: CRYSTAL_R, cls: 'fxi2-crystal', size: [34, 15], ms: 230, easing: 'cubic-bezier(.2,.6,.4,1)', scale: [0.5, 1.2] });
        }
        later(230, r);
      }));
    },
    // A huge diamond starburst, crystals erupting in a circle round the victim
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit, [w, h] = sizeOf(ctx.to, 200, 46), S = Math.min(380, 200 * p);
      flash('#dff4ff', crit ? 0.6 : 0.4);
      put(tx, ty, STAR4, [{ transform: 'rotate(0deg) scale(0.2)', opacity: 1 }, { transform: 'rotate(20deg) scale(1.1)', opacity: 1, offset: 0.22 },
        { transform: 'rotate(35deg) scale(1)', opacity: 0.95, offset: 0.6 }, { transform: 'rotate(45deg) scale(1.3)', opacity: 0 }], 760, { cls: 'fxi2-star', size: [S, S] });
      core(tx, ty, 150 * p, 'white');
      jutRing(tx, ty, w * 0.5 + 6, h * 0.5 + 10, crit ? 12 : 10, 40 * Math.min(1.5, p), { delay: 18, ms: 850 });
      iceShards(tx, ty, { count: 16, spread: 190 * p });
      for (let i = 0; i < 3; i++) later(i * 80, () => fxRing(tx, ty, { color: ['#ffffff', '#7ae0ff', '#bfe6ff'][i], size: Math.min(700, (180 + i * 100) * p), width: 9 - i * 2, ms: 560 }));
      const [px, py] = stampPoint(ctx);
      slam(px, py, crit ? 'FROST SUPERNOVA!!' : 'FROST NOVA!', { kind: 'frost', size: crit ? 34 : Math.min(52, 32 + 10 * p), rotate: -5, ms: 950, star: '#dff4ff' });
      fxShake(ctx.panel, Math.min(26, 14 * p), 480);
      fxShake(ctx.to, 12, 360);
      haptic(70);
    },
  };

  // ================= Frost Bite (x3, stun): icy jaws CHOMP =================
  CARD_FX['frost-bite'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landAt(ctx), [w, h] = cardSize(ctx);
      frame(ctx.win, '#7ab8ff', 850);
      // Icy wolf jaws snap shut on the card, frosty breath puffing out
      chomp(x, y, w * 1.3, { gap: h * 0.5, ms: 850, snap: 0.3 });
      later(250, () => {
        frostPuff(x, y, 4, { size: 36, spread: w * 0.9, ms: 700 });
        iceShards(x, y, { count: 6, spread: 60, size: [4, 8], ms: 500 });
        fxShake(ctx.panel, 4, 200);
        sfx('bite', 1.3, 0.5);
      });
      plate(ctx, '🐺 FROST BITE', '#7ab8ff');
    },
    // The wolf lunges and its gaping jaws fly at the victim
    windup(ctx) {
      const from = src(ctx), [tx, ty] = at(ctx), W = ctx.crit ? 110 : 92, H = W * 56 / 120, k = ctx.crit ? 1.3 : 1.15;
      lunge(ctx.from, [tx, ty], 28, 320);
      frostPuff(from[0], from[1], 3, { size: 40 });
      const opts = { size: [W, H], ms: 300, bow: -18, ease: accel, scale: [0.5, k], cls: 'fxi2-jaw' };
      fly([from[0], from[1] - H * 0.7], [tx, ty - H * 0.85], JAW_TOP, opts);
      return fly([from[0], from[1] + H * 0.7], [tx, ty + H * 0.85], JAW_BOT, opts);
    },
    // CHOMP: the jaws slam shut on the victim and leave icy teeth marks
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit, [w] = sizeOf(ctx.to, 200, 46);
      const W = Math.min(w * 1.05, 150) * Math.min(1.35, 0.8 + p * 0.25);
      chomp(tx, ty, W, { gap: 18, ms: 640, snap: 0.14 });
      later(90, () => {
        core(tx, ty, 120 * p, 'frost');
        put(tx, ty, TEETH_MARKS, [{ transform: 'scale(1.2)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: 0.12 },
          { transform: 'scale(1)', opacity: 1, offset: 0.7 }, { transform: 'scale(1.02)', opacity: 0 }], 950, { cls: 'fxi2-marks', size: [W * 0.8, W * 0.35] });
        iceShards(tx, ty, { count: 12, spread: 140 * p });
        frostPuff(tx, ty, 3, { size: 50, spread: W * 0.5 });
        fxRing(tx, ty, { color: '#bfe6ff', size: 170 * p, width: 7 });
        const [px, py] = stampPoint(ctx);
        slam(px, py, crit ? 'MEGA CHOMP!!' : 'CHOMP!', { kind: 'frost', size: crit ? 42 : Math.min(58, 34 + 12 * p), rotate: -7, ms: 850, star: crit ? '#bfe6ff' : null });
        fxShake(ctx.panel, Math.min(22, 11 * p), 380);
        fxShake(ctx.to, 12, 320);
        sfx('bite', 0.9, 0.8);
        if (crit) haptic(60);
      });
    },
    // Stun: frozen solid in the kit's ice block, icy fangs clamped on it top and bottom
    gimmick(ctx) {
      frost.freeze(ctx, { word: 'FROZEN BITE!' });
      const [x, y] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46), o = { ms: 950, html: ICICLE, cls: 'fxi2-spike', aspect: 0.33 };
      later(150, () => [-0.3, -0.1, 0.1, 0.3].forEach((k, i) => {
        jut(x + k * w, y - h * 0.5 - 16, 90, i % 3 ? 26 : 38, o);
        jut(x + k * w, y + h * 0.5 + 16, -90, i % 3 ? 22 : 32, o);
      }));
    },
  };

  // ================= Frost Claw (x6, cleave): three giant icy claw slashes =================
  CARD_FX['frost-claw'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landAt(ctx), [w, h] = cardSize(ctx);
      frame(ctx.win, '#5aa8ff', 850);
      // A big icy paw print stamps onto the card...
      put(x, y - 4, PAW, [
        { transform: 'scale(2.4) rotate(-22deg)', opacity: 0 },
        { transform: 'scale(0.92) rotate(-8deg)', opacity: 1, offset: 0.16 },
        { transform: 'scale(1) rotate(-8deg)', opacity: 1, offset: 0.24 },
        { transform: 'scale(1) rotate(-8deg)', opacity: 1, offset: 0.8 },
        { transform: 'scale(1.05) rotate(-8deg)', opacity: 0 },
      ], 950, { cls: 'fxi2-paw', size: [w * 1.05, w * 1.05] });
      later(150, () => { fxRing(x, y, { color: '#bfe6ff', size: 110, width: 4, ms: 360 }); frostPuff(x, y + h * 0.3, 3, { size: 34, spread: w }); fxShake(ctx.panel, 5, 220); });
      // ...then claws scratch across it
      later(400, () => { rake(x, y, 62, h * 1.05, 6, 13, { stagger: 35 }); iceShards(x, y, { count: 6, spread: 70, size: [4, 8], ms: 500 }); });
      plate(ctx, '🐾 FROST CLAW', '#5aa8ff');
    },
    // Cleave (before the hit): the kit's ice spike smashes the shields; a quick claw swipe rakes them first
    gimmick(ctx) {
      frost.smash(ctx, { word: 'CLAWED!' });
      const [x, y] = at(ctx);
      if (ctx.blocked) later(40, () => rake(x, y, -28, 130, 7, 16, { cls: 'fxi2-slash-claw', stagger: 30 }));
    },
    // Three claw marks glow by the wolf, then it leaps: the claw streaks tear across to the victim
    windup(ctx) {
      const from = src(ctx), to = at(ctx), d = dirOf(from, to), crit = !!ctx.crit;
      rake(from[0], from[1] - 30, 68, 48, 5, 11, { cls: 'fxi2-clawglow', stagger: 30 });
      frostPuff(from[0], from[1], 2, { size: 36 });
      later(150, () => {
        lunge(ctx.from, to, crit ? 44 : 36, 300);
        [-1, 0, 1].forEach(k => fxBeam([from[0] + d.nx * k * 12, from[1] + d.ny * k * 12], [to[0] + d.nx * k * 12, to[1] + d.ny * k * 12], { cls: 'fxr-line-ice', ms: 260, width: 4 }));
      });
      return wait(330);
    },
    // RIP: three giant icy claw slashes tear across the victim, leaving frozen gashes
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit, k = Math.min(1.5, p), len = Math.min(380, 210 * p);
      fxTint('#2a6ad1', { ms: 380, opacity: crit ? 0.4 : 0.26 });
      core(tx, ty, 130 * p, 'deep');
      rake(tx, ty, -32, len, 14 * k, 26 * k, { cls: 'fxi2-slash-claw', stagger: 45 });
      if (crit) later(170, () => rake(tx, ty, 32, len * 0.85, 11, 22, { cls: 'fxi2-slash-claw', stagger: 40 }));
      later(140, () => put(tx, ty, GASHES, [{ transform: 'rotate(-32deg) scale(0.6, 0.9)', opacity: 0 }, { transform: 'rotate(-32deg) scale(1)', opacity: 1, offset: 0.15 },
        { transform: 'rotate(-32deg) scale(1)', opacity: 1, offset: 0.7 }, { transform: 'rotate(-32deg) scale(1.02)', opacity: 0 }], 900, { cls: 'fxi2-gash', size: [140 * k, 82 * k] }));
      crackBurst(tx, ty, 170 * p, 'ice', fxRand(0, 60), 850);
      iceShards(tx, ty, { count: 16, spread: 180 * p, angle: 148, cone: 200 });
      fxRing(tx, ty, { color: '#7ae0ff', size: 190 * p, width: 8 });
      const [px, py] = stampPoint(ctx, 6);
      slam(px, py, crit ? 'FROSTCLAW!!' : 'RIP!', { kind: 'deep', size: crit ? 44 : Math.min(62, 38 + 12 * p), rotate: -8, ms: 880, star: crit ? '#7ae0ff' : null });
      fxShake(ctx.panel, Math.min(26, 14 * p), 460);
      fxShake(ctx.to, 14, 360);
      haptic(crit ? 90 : 50);
    },
  };

  // ================= Pack Hunt (x2, frenzy: 3 strikes): the pack leaps in from every side =================
  CARD_FX['pack-hunt'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landAt(ctx), [w, h] = cardSize(ctx);
      frame(ctx.win, '#7ae0ff', 900);
      put(x, y, '', [{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.82 }, { opacity: 0 }], 1050, { cls: 'fxi2-nightcard', size: [w + 8, h + 8] });
      // Snowy pines rise out of the card...
      [[0, 1.15, 0], [-0.36, 0.9, 60], [0.38, 0.95, 110]].forEach(([o, s, dl]) => later(dl, () => put(x + o * w, y + h * 0.1, PINE, [
        { transform: 'translate(0, 24px) scale(0.6, 0.1)', opacity: 0 },
        { transform: 'translate(0, 0) scale(1, 1.08)', opacity: 1, offset: 0.25 },
        { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0.82 },
        { transform: 'translate(0, 6px) scale(1)', opacity: 0 },
      ], 950 - dl, { cls: 'fxi2-pine', size: [w * 0.55 * s, w * 0.84 * s], style: { transformOrigin: '50% 100%' } })));
      // ...and glowing wolf eyes blink open between the trees
      [[-0.2, -0.05, 300], [0.2, 0.14, 400], [-0.02, 0.36, 480]].forEach(([ox, oy, dl]) =>
        later(dl, () => blinkEyes(x + ox * w, y + oy * h, WEYES, [22, 8], 650, 'fxi2-weyes')));
      later(180, () => snowfall(x, y - h * 0.5, w * 1.2, 8, { fall: h, ms: 800 }));
      plate(ctx, '🌲 PACK HUNT', '#7ae0ff');
    },
    // Frenzy (before the strikes): the pack howls, glowing eyes open all round the darkened edges of the screen
    gimmick(ctx) {
      const [x, y] = src(ctx), [, h] = sizeOf(ctx.from, 200, 46), W = innerWidth, H = innerHeight;
      fxTint(vig('#000000f2'), { ms: 1200, opacity: 0.8 });
      frost.frenzy(ctx, { word: 'THE PACK!', html: () => '🐾' });
      for (let i = 0; i < 10; i++) later(90 + i * 60, () => {
        const e = i % 4, t = fxRand(0.1, 0.9), m = fxRand(26, 60);
        const [ex, ey] = e === 0 ? [W * t, m] : e === 1 ? [W - m, H * t] : e === 2 ? [W * t, H - m] : [m, H * t];
        blinkEyes(ex, ey, WEYES, [44, 15], 1000 - i * 40, 'fxi2-weyes', fxRand(0.8, 1.3));
      });
      howlArcs(x, y - h * 0.5, 3, { reach: 60 });
      sfx('eagle', 0.5, 0.35); // a distant howl
    },
    // Each strike a wolf leaps in on an arc from a different side: from the left, the right, then down from above
    windup(ctx) {
      const s = clamp(ctx.strike || 0, 0, 2), [tx, ty] = at(ctx);
      const a = [[tx - 230, ty + 50], [tx + 230, ty + 50], [tx + 50, ty - 260]][s], left = tx < a[0], W = 110 + s * 14;
      later(20, () => fxParticles(a[0], a[1], { count: 6, colors: ['#fff', '#dff4ff'], size: [6, 12], spread: 50, ms: 450, gravity: -10 }));
      return aimFly(a, [tx, ty], { html: `<i class="fxi2-flip" style="transform:scale(1,${left ? -1 : 1})">${WOLF}</i>`, cls: 'fxi2-svg fxi2-wolf',
        size: [W, W * 0.5], ms: 300 - s * 30, arc: s === 2 ? 40 : left ? 90 : -90, trail: 'fxr-trail-snow', trailEvery: 30,
        easing: 'cubic-bezier(.3,0,.8,.7)', scale: [0.75, 1.1 + s * 0.1] });
    },
    // Snow dust and bite marks, one more bite each strike: ONE! → TWO!! → PACK ATTACK!!!
    impact(ctx) {
      const s = clamp(ctx.strike || 0, 0, 2), [tx, ty] = at(ctx), p = pow(ctx) + s * 0.2, [w, h] = sizeOf(ctx.to, 200, 46);
      frostPuff(tx, ty + h * 0.2, 3 + s, { size: 50 + s * 10, spread: w * 0.6 });
      fxParticles(tx, ty + h * 0.3, { count: 10 + s * 4, colors: ['#ffffff', '#eef8ff', '#dff4ff'], size: [4, 9], spread: 120 * p, gravity: 70, angle: -90, cone: 220, ms: 650 });
      for (let i = 0; i <= s; i++) later(i * 60, () => put(tx + (i - s / 2) * 36, ty + (i % 2 ? 6 : -4), BITE, [
        { transform: `rotate(${(i - 1) * 12}deg) scale(1.4)`, opacity: 0 }, { transform: `rotate(${(i - 1) * 12}deg) scale(1)`, opacity: 1, offset: 0.12 },
        { transform: `rotate(${(i - 1) * 12}deg) scale(1)`, opacity: 1, offset: 0.7 }, { transform: `rotate(${(i - 1) * 12}deg) scale(1)`, opacity: 0 },
      ], 850, { cls: 'fxi2-bite', size: [54, 45] }));
      fxRing(tx, ty, { color: s === 2 ? '#7ae0ff' : '#ffffff', size: (150 + 50 * s) * p, width: 6 + s });
      const [px, py] = stampPoint(ctx, (s - 1) * 22);
      slam(px, py, ['ONE!', 'TWO!!', 'PACK ATTACK!!!'][s], { kind: s === 2 ? 'deep' : 'frost',
        size: [34, 40, 38][s] + (ctx.crit ? 6 : 0), rotate: [-8, 8, -4][s], ms: 650 + s * 150, star: s === 2 ? '#7ae0ff' : null });
      fxShake(ctx.panel, 7 + s * 6, 260 + s * 60);
      fxShake(ctx.to, 8 + s * 3, 260);
      if (s === 2) {
        crackBurst(tx, ty, 190, 'ice', fxRand(0, 60), 850);
        speedLines(tx, ty, { n: 10, r0: 50, r1: 170, cls: 'fxr-line-ice', width: 5 });
        fxTint(VIG.deep, { ms: 420, opacity: 0.5 });
        sfx('bite', 0.8, 0.7);
        haptic(70);
      }
    },
  };

  // ================= Moon Howl (double: its next attack strikes again): the Alpha howls at the full moon =================
  CARD_FX['moon-howl'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landAt(ctx), [w, h] = cardSize(ctx), my = y - h * 0.16;
      fxTint(VIG.deep, { ms: 1050, opacity: 0.6 });
      frame(ctx.win, '#fff6c8', 950);
      // The full moon rises behind the card...
      put(x, my, '', [{ transform: 'scale(0.4)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: 0.35 },
        { transform: 'scale(1.05)', opacity: 0.9, offset: 0.8 }, { transform: 'scale(1.2)', opacity: 0 }], 1100, { cls: 'fxi2-moonhalo', size: [w * 2.1, w * 2.1] });
      put(x, my, FULL_MOON, [{ transform: 'translate(0, 40px) scale(0.7)', opacity: 0 }, { transform: 'translate(0, -4px) scale(1)', opacity: 1, offset: 0.35 },
        { transform: 'translate(0, -8px) scale(1)', opacity: 1, offset: 0.85 }, { transform: 'translate(0, -12px) scale(1.05)', opacity: 0 }], 1100, { cls: 'fxi2-moon', size: [w * 1.1, w * 1.1] });
      // ...and a wolf's silhouette throws back its head and howls in front of it
      later(220, () => put(x - w * 0.06, y + h * 0.1, HOWLER, [
        { transform: 'translate(0, 14px) scale(0.8, 0.5)', opacity: 0 },
        { transform: 'translate(0, 0) scale(1, 1.05)', opacity: 1, offset: 0.25 },
        { transform: 'translate(0, 0) rotate(-5deg) scale(1)', opacity: 1, offset: 0.5 },
        { transform: 'translate(0, 0) rotate(0deg) scale(1)', opacity: 1, offset: 0.85 },
        { transform: 'translate(0, 4px) scale(1)', opacity: 0 },
      ], 860, { cls: 'fxi2-howler', size: [w * 0.7, w * 0.88], style: { transformOrigin: '50% 100%' } }));
      later(420, () => howlArcs(x + w * 0.12, y - h * 0.18, 2, { reach: 34, ms: 520, gap: 120 }));
      plate(ctx, '🌕 MOON HOWL', '#fff6c8');
    },
    // Double: the moon rises over the Alpha, howl waves ripple out, its eyes glow, AWOOOO! and the kit's ×N strike count
    gimmick(ctx) {
      const [x, y] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46), my = y - h * 0.5 - 44;
      fxTint(VIG.deep, { ms: 1100, opacity: 0.55 });
      put(x, my, '', [{ transform: 'scale(0.4)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: 0.35 }, { transform: 'scale(1.2)', opacity: 0 }], 1100, { cls: 'fxi2-moonhalo', size: [170, 170] });
      put(x, my, FULL_MOON, [{ transform: 'translate(0, 36px) scale(0.6)', opacity: 0 }, { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0.35 },
        { transform: 'translate(0, -4px) scale(1)', opacity: 1, offset: 0.85 }, { transform: 'translate(0, -8px) scale(1.05)', opacity: 0 }], 1100, { cls: 'fxi2-moon', size: [78, 78] });
      frost.double(ctx);
      later(200, () => {
        blinkEyes(x, y - 2, WEYES_GOLD, [Math.min(90, w * 0.45), Math.min(90, w * 0.45) * 0.35], 900, 'fxi2-weyes-gold');
        howlArcs(x, y - h * 0.3, 3, { reach: Math.min(90, w * 0.45) });
        slam(x, my + 6, 'AWOOOO!', { kind: 'moon', size: 30, rotate: -4, ms: 900 });
        sfx('eagle', 0.45, 0.45); // the howl
      });
    },
  };

  // ================= Avalanche Pounce (x8): the Alpha pounces out of the sky in an avalanche =================
  CARD_FX['avalanche-pounce'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landAt(ctx), [w, h] = cardSize(ctx), my = y - h * 0.06;
      frame(ctx.win, '#dff4ff', 900);
      // A snowy mountain rumbles on the card...
      put(x, my, MOUNTAIN, [
        { transform: 'translate(0, 20px) scale(0.7, 0.3)', opacity: 0 },
        { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0.2 },
        { transform: 'translate(-2px, 1px)', opacity: 1, offset: 0.3 },
        { transform: 'translate(2px, -1px)', opacity: 1, offset: 0.36 },
        { transform: 'translate(-2px, 0)', opacity: 1, offset: 0.42 },
        { transform: 'translate(2px, 1px)', opacity: 1, offset: 0.48 },
        { transform: 'translate(0, 0)', opacity: 1, offset: 0.82 },
        { transform: 'translate(0, 4px)', opacity: 0 },
      ], 1050, { cls: 'fxi2-mountain', size: [w * 1.3, w * 0.87], easing: 'linear' });
      // ...and snow slides down its slopes
      for (let i = 0; i < 8; i++) later(280 + i * 45, () => {
        const sd = i % 2 ? 1 : -1, peak = [x + (sd > 0 ? w * 0.22 : -w * 0.05), my - w * 0.3], s = fxRand(6, 11);
        fly(peak, [peak[0] + sd * w * fxRand(0.35, 0.6), my + w * 0.36], '', { cls: 'fxi2-chunk', size: [s, s * 0.85], ms: 460, ease: accel, spin: sd * 300 });
      });
      later(300, () => { frostPuff(x, y + h * 0.3, 4, { size: 40, spread: w }); fxShake(ctx.panel, 6, 380); sfx('big_hit', 0.5, 0.3); }); // rumble
      plate(ctx, '⛰️ AVALANCHE POUNCE', '#dff4ff');
    },
    // A shadow grows on the victim while the wolf pounces from high above, snow chunks tumbling after it
    windup(ctx) {
      const [tx, ty] = at(ctx), crit = !!ctx.crit;
      shadow(tx, ty + 18, 180, 44, 400);
      dim(VIG.deep, crit ? 0.75 : 0.55, 440);
      for (let i = 0; i < 5; i++) later(50 + i * 50, () => dropIn(tx + fxRand(-60, 60), ty + fxRand(-20, 10), '', { cls: 'fxi2-chunk-big', ms: 330, drift: fxRand(-40, 40), spin: 360, scale: [0.6, 1.3] }));
      later(80, () => sfx('big_hit', 0.4, 0.45)); // rumble
      return dropIn(tx, ty - 10, `<i class="fxi2-down">${WOLF}</i>`, { cls: 'fxi2-svg fxi2-pouncer', ms: 400, scale: [0.6, crit ? 1.7 : 1.45], trail: 'fxi2-trail-chunk' });
    },
    // AVALANCHE: a massive snow burst, big rings, tumbling chunks, a heavy shake
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit, [w] = sizeOf(ctx.to, 200, 46);
      flash('#ffffff', crit ? 0.6 : 0.45);
      fxTint('#eaf6ff', { ms: 620, opacity: 0.5 });
      core(tx, ty, Math.min(420, 220 * p), 'white', 480);
      frostPuff(tx, ty, 8, { size: 80 * Math.min(1.4, p), spread: w, ms: 1000 });
      fxParticles(tx, ty, { count: 18, cls: 'fxi2-chunk', colors: ['#fff'], size: [8, 18], spread: 220 * p, gravity: 160, angle: -90, cone: 240, ms: 900, spin: 540 });
      snowflakes(tx, ty, { count: 10, spread: 180 * p });
      for (let i = 0; i < 3; i++) later(i * 90, () => fxRing(tx, ty + 10, { color: ['#ffffff', '#bfe6ff', '#7ab8ff'][i], size: Math.min(760, (240 + i * 130) * p), width: 13 - i * 3, ms: 620 }));
      crackBurst(tx, ty + 10, Math.min(440, 230 * p), 'ice', 0, 1000);
      const [px, py] = stampPoint(ctx);
      slam(px, py, crit ? 'AVALANCHE CRUSH!!' : 'AVALANCHE!', { kind: 'snow', size: crit ? 36 : Math.min(54, 34 + 10 * p), rotate: -5, ms: 1000, star: '#ffffff' });
      fxShake(ctx.panel, Math.min(34, 20 * p), 620);
      fxShake(ctx.to, 20, 480);
      sfx('heavy_slam', 0.8, 0.8);
      haptic(120);
    },
  };

  // ================= Wolf Spirit (x5, lifesteal): a ghost wolf tears out a bit of soul =================
  CARD_FX['wolf-spirit'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landAt(ctx), [w, h] = cardSize(ctx);
      frame(ctx.win, '#9fdcff', 950);
      fxTint(VIG.deep, { ms: 950, opacity: 0.45 });
      // A ghostly wolf spirit rises out of the card, swaying, soul wisps drifting up with it
      put(x, y, GHOST, [
        { transform: 'translate(0, 30px) scale(0.5, 0.3)', opacity: 0 },
        { transform: 'translate(-4px, -8px) scale(0.9, 1)', opacity: 0.85, offset: 0.3 },
        { transform: 'translate(4px, -26px) scale(1)', opacity: 0.9, offset: 0.6 },
        { transform: 'translate(-2px, -42px) scale(1.05)', opacity: 0.7, offset: 0.8 },
        { transform: 'translate(0, -58px) scale(1.1, 1.2)', opacity: 0 },
      ], 1150, { cls: 'fxi2-spirit', size: [w * 1.1, w * 1.36], easing: 'ease-in-out' });
      fxParticles(x, y + h * 0.3, { count: 8, html: WISP, colors: ['#fff'], size: [5, 8], spread: 60, gravity: -80, angle: -90, cone: 100, ms: 1000, spin: 0 });
      later(250, () => sparkle(x, y - h * 0.2, { count: 5, spread: 50, colors: ['#e8fbff', '#9fdcff'] }));
      plate(ctx, '👻 WOLF SPIRIT', '#9fdcff');
    },
    // The spectral wolf phases across to the victim on a weaving path, flickering, ghostly afterimages behind it
    windup(ctx) {
      const from = src(ctx), to = at(ctx), d = dirOf(from, to), crit = !!ctx.crit, ms = 340;
      const path = t => [from[0] + d.dx * t + d.nx * Math.sin(t * Math.PI * 2) * 20, from[1] + d.dy * t + d.ny * Math.sin(t * Math.PI * 2) * 20];
      const el = fxSpawn(from[0], from[1], { cls: 'fxi2-svg fxi2-spirit', html: GHOST, ms: ms + 40, size: [70, 87] });
      afterimages(path, ms, GHOST, { cls: 'fxi2-spirit', size: [70, 87], every: 40, ease: accel, scale: [0.8, 1.3], peak: 0.35, life: 280 });
      return glide(el, path, ms, { ease: accel, scale: [0.8, crit ? 1.6 : 1.35], alpha: t => 0.5 + 0.45 * Math.abs(Math.cos(t * 10)) });
    },
    // A ghostly slash, and soul wisps get tugged out of the victim
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit, [w] = sizeOf(ctx.to, 200, 46);
      fxTint(VIG.deep, { ms: 420, opacity: 0.4 });
      core(tx, ty, 120 * p, 'deep');
      slash(tx, ty, -40, Math.min(360, 180 * p), 13, 'fxi2-slash-ghost');
      later(60, () => slash(tx, ty, 40, Math.min(360, 180 * p), 13, 'fxi2-slash-ghost'));
      for (let i = 0; i < 7; i++) later(i * 30, () => {
        const a = [tx + fxRand(-w * 0.3, w * 0.3), ty + fxRand(-8, 8)];
        fly(a, [a[0] + fxRand(-30, 30), a[1] - fxRand(30, 60)], WISP, { ms: 520, ease: decel, scale: [0.5, 1.3] });
      });
      fxRing(tx, ty, { color: '#9fdcff', size: 170 * p, width: 6 });
      const [px, py] = stampPoint(ctx);
      slam(px, py, crit ? 'PHANTOM FANG!!' : 'SPIRIT SLASH!', { kind: 'deep', size: crit ? 36 : Math.min(48, 28 + 10 * p), rotate: 6, ms: 850, star: crit ? '#9fdcff' : null });
      fxShake(ctx.panel, Math.min(20, 10 * p), 360);
      fxShake(ctx.to, 10, 300);
    },
    // Lifesteal (after the hit): the wisps stream back into Fenrir (the kit's frost lifesteal): SOUL DRAIN!
    gimmick(ctx) {
      frost.lifesteal(ctx, { n: 10 });
      const [x, y] = src(ctx), [, h] = sizeOf(ctx.from, 200, 46);
      later(420, () => {
        put(x, y - 8, GHOST, [{ transform: 'scale(0.6)', opacity: 0 }, { transform: 'scale(1.1)', opacity: 0.8, offset: 0.3 },
          { transform: 'translate(0, -24px) scale(1.3)', opacity: 0 }], 720, { cls: 'fxi2-spirit', size: [58, 72] });
        slam(x, y + h * 0.5 + 18, 'SOUL DRAIN!', { kind: 'deep', size: 28, rotate: -4, ms: 850 });
        sfx('leech', 0.8, 0.5);
      });
    },
  };

  // ================= Moon Eater (x8, cleave): Fenrir swallows the moon and brings it crashing down =================
  CARD_FX['moon-eater'] = {
    land(ctx) {
      remember(ctx);
      const [x, y] = landAt(ctx), [w, h] = cardSize(ctx), my = y - h * 0.1, s = w * 1.05;
      fxTint(VIG.dark, { ms: 1050, opacity: 0.6 });
      frame(ctx.win, '#7a8cff', 950);
      put(x, y, '', [{ transform: 'scale(0.6)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: 0.3 },
        { transform: 'scale(1.1)', opacity: 1, offset: 0.8 }, { transform: 'scale(1.2)', opacity: 0 }], 1100, { cls: 'fxi2-darkaura', size: [w * 2.2, h * 1.7] });
      // An eclipse: a shadow slides over the moon on the card until only a burning ring is left
      put(x, my, FULL_MOON, [{ transform: 'scale(0.4)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: 0.2 },
        { transform: 'scale(1)', opacity: 1, offset: 0.85 }, { transform: 'scale(0.9)', opacity: 0 }], 1100, { cls: 'fxi2-moon', size: [s, s] });
      put(x, my, '', [
        { transform: `translate(${-s * 0.9}px, ${s * 0.2}px)`, opacity: 0 },
        { transform: `translate(${-s * 0.6}px, ${s * 0.12}px)`, opacity: 1, offset: 0.2 },
        { transform: 'translate(0, 0)', opacity: 1, offset: 0.55 },
        { transform: 'translate(0, 0)', opacity: 1, offset: 0.85 },
        { transform: 'translate(0, 0) scale(0.9)', opacity: 0 },
      ], 1100, { cls: 'fxi2-shadowdisc', size: [s * 0.98, s * 0.98], easing: 'ease-in-out' });
      later(580, () => {
        put(x, my, '', [{ transform: 'scale(0.8)', opacity: 0 }, { transform: 'scale(1.05)', opacity: 1, offset: 0.25 }, { transform: 'scale(1.15)', opacity: 0 }], 520, { cls: 'fxi2-corona', size: [s * 1.5, s * 1.5] });
        sparkle(x, my, { count: 6, spread: s * 0.8, colors: ['#ffffff', '#bfe6ff', '#7a8cff'] });
      });
      plate(ctx, '🌑 MOON EATER', '#7a8cff');
    },
    // Cleave (before the hit): the kit's ice spike smashes the shields, and a shadow maw snaps them up
    gimmick(ctx) {
      frost.smash(ctx, { word: 'DEVOURED!' });
      const [x, y] = at(ctx), [w] = sizeOf(ctx.to, 200, 46);
      if (ctx.blocked) later(60, () => chomp(x, y, Math.min(160, w * 0.9), { gap: 30, ms: 520, snap: 0.3, top: MAW_TOP, bottom: MAW_BOT, cls: 'fxi2-maw' }));
      else later(90, () => fxRing(x, y, { color: '#2a3a9a', size: 140, width: 8, ms: 400 }));
    },
    // The sky goes dark, a giant moon hangs over the victim, a black maw swallows it... and the dark moon crashes down
    windup(ctx) {
      const [tx, ty] = at(ctx), crit = !!ctx.crit, M = crit ? 120 : 104, my = Math.max(70, ty - 170);
      dim(vig('#000000f0'), crit ? 0.85 : 0.75, 460);
      put(tx, my, FULL_MOON, [{ transform: 'scale(0.5)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: 0.4 }, { transform: 'scale(1)', opacity: 1 }], 240, { cls: 'fxi2-moon', size: [M, M] });
      later(40, () => chomp(tx, my, M * 1.25, { gap: M * 0.42, ms: 300, snap: 0.5, top: MAW_TOP, bottom: MAW_BOT, cls: 'fxi2-maw' }));
      later(90, () => sfx('big_hit', 0.4, 0.5)); // rumble
      return new Promise(r => later(200, () => fly([tx, my], [tx, ty], '', { cls: 'fxi2-eclipse', size: [M, M], ms: 190, ease: accel, scale: [1, 1.35] }).then(r)));
    },
    // Dark-blue shockwave, an eclipse corona ring and frost cracks: MOON EATER!!
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit, C = 170 * Math.min(1.6, p);
      flash('#1a2a7a', crit ? 0.6 : 0.45);
      fxTint(VIG.dark, { ms: 700, opacity: 0.6 });
      put(tx, ty, '', [{ transform: 'scale(0.3)', opacity: 1 }, { transform: 'scale(1)', opacity: 1, offset: 0.3 },
        { transform: 'scale(1.08)', opacity: 0.9, offset: 0.7 }, { transform: 'scale(1.3)', opacity: 0 }], 900, { cls: 'fxi2-corona', size: [C, C] });
      core(tx, ty, 180 * p, 'deep');
      for (let i = 0; i < 3; i++) later(i * 90, () => fxRing(tx, ty, { color: ['#2a3a9a', '#7a8cff', '#0a1040'][i], size: Math.min(760, (230 + i * 120) * p), width: 14 - i * 3, ms: 640 }));
      crackBurst(tx, ty, Math.min(440, 220 * p), 'dark', fxRand(0, 60), 950);
      later(80, () => crackBurst(tx, ty, Math.min(320, 160 * p), 'ice', fxRand(0, 60), 800));
      iceShards(tx, ty, { count: 14, spread: 190 * p });
      fxParticles(tx, ty, { count: 10, colors: ['#2a3a9a', '#7a8cff', '#0a1040'], size: [5, 10], spread: 170 * p, gravity: -40, ms: 800 });
      const [px, py] = stampPoint(ctx);
      slam(px, py, crit ? 'TOTAL ECLIPSE!!' : 'MOON EATER!!', { kind: 'moon fxi2-eclipse-word', size: crit ? 40 : Math.min(50, 32 + 9 * p), rotate: -6, ms: 1000, star: '#2a3a9a' });
      fxShake(ctx.panel, Math.min(34, 20 * p), 620);
      fxShake(ctx.to, 18, 460);
      haptic(120);
    },
  };
})();
