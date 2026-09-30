// Card effects: Volcano boss - the Inferno Dragon's cards (the FINAL BOSS) and those of its two evolutions, the
// Twin-Headed Dragon and the Dragon Emperor (see js/card-fx.js for when each hook fires, js/fx/region-kit.js for RFX).
// The game's grand finale: crimson dragon scales, gold and glowing lava. Dragon fire, falling meteors, beating wings,
// a golden hoard, a spiked tail, twin flames, ember scale armor, a supernova and a terrifying roar.
// Twin Inferno and Supernova are super moves: the battle plays its shared cinematic first, then these hooks.
// Styles live in css/fx/volcano-boss.css (every class and keyframe is prefixed fxvb-).
(() => {
  const { clamp, later, wait, at, src, sizeOf, pow, dirOf, jolt, faceJiggle, lunge, knock, remember, launchPoint,
    slam, stampPoint, plate, frame, artPop, show, glint, speedLines, slash, crackBurst, core, dim, shadow, reticle, charge,
    orbit, aimFly, VIG, ROCK, FLAME, FIRE_COLS, flames, embers, sparks, smoke, lavaBlobs, rocks, scorch, heatWave, fire } = RFX;

  // ---------- Graphics (inline SVG / emoji, no image files) ----------
  const INK = '#2a0600';
  // A cartoon dragon head on its neck, facing right, jaws open: gold horns, spiky neck, angry slit eye, sharp teeth.
  // part: 'all', 'top' (everything but the lower jaw) or 'jaw' (only the lower jaw, hinged at 25% 64%)
  const JAW = '<path d="M30 64 Q56 64 100 70 Q106 74 102 80 Q70 88 42 84 Q30 78 30 64 Z" fill="#a81a08" stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round"/>' +
    '<path d="M78 70 L81 63 L84 70 Z M90 72 L93 65 L96 72 Z" fill="#fff" stroke="' + INK + '" stroke-width="1.5" stroke-linejoin="round"/>' +
    '<path d="M40 79 Q70 84 97 76" fill="none" stroke="#ffb300" stroke-width="3" stroke-linecap="round"/>';
  const HEAD_BACK = '<path d="M8 100 Q10 74 26 52 L50 58 Q40 78 44 100 Z" fill="#b01a0a" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M40 100 Q36 84 44 66" fill="none" stroke="#ffb300" stroke-width="6" stroke-dasharray="5 3"/>' +
    '<path d="M12 84 L1 78 L14 73 Z M17 67 L6 60 L21 58 Z M25 53 L18 42 L32 46 Z" fill="#ffc233" stroke="' + INK + '" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<path d="M36 34 Q18 20 3 22 Q18 30 28 44 Z M46 28 Q36 8 21 3 Q34 18 36 36 Z" fill="#ffd23f" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M12 23 Q22 27 28 36 M28 8 Q35 17 38 28" fill="none" stroke="#fff3a0" stroke-width="2" stroke-linecap="round"/>' +
    '<path d="M56 54 L114 52 L104 72 L56 66 Z" fill="#3a0000"/><path d="M62 61 Q84 58 101 63 Q84 67 62 63 Z" fill="#ff5a00"/>';
  const HEAD_TOP = '<path d="M24 44 Q36 24 62 24 Q90 26 112 40 Q119 46 114 52 L58 56 Q40 58 28 62 Q20 54 24 44 Z" fill="#d42a12" stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round"/>' +
    '<path d="M62 30 Q88 32 106 42" fill="none" stroke="#ff7a3a" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M70 55 L73 62 L77 55 Z M84 54 L87 61 L90 54 Z M98 53 L100 59 L103 53 Z" fill="#fff" stroke="' + INK + '" stroke-width="1.5" stroke-linejoin="round"/>' +
    '<ellipse cx="66" cy="38" rx="8" ry="6" fill="#ffe066" stroke="' + INK + '" stroke-width="2.5"/><path d="M66 32.5 Q68.5 38 66 43.5 Q63.5 38 66 32.5 Z" fill="#1a0000"/>' +
    '<path d="M55 29 L77 34" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/><ellipse cx="106" cy="42" rx="3" ry="2" fill="' + INK + '"/>' +
    '<path d="M32 50 q4 -4 8 0 M42 52 q4 -4 8 0 M30 57 q4 -4 8 0" fill="none" stroke="#8a1206" stroke-width="2" stroke-linecap="round"/>';
  const dragonSvg = (flip, part = 'all') => `<svg viewBox="0 0 120 100"><g${flip ? ' transform="translate(120 0) scale(-1 1)"' : ''}>` +
    (part === 'jaw' ? JAW : HEAD_BACK + (part === 'all' ? JAW : '') + HEAD_TOP) + '</g></svg>';
  const HEAD = { all: [dragonSvg(false), dragonSvg(true)], top: [dragonSvg(false, 'top'), dragonSvg(true, 'top')], jaw: [dragonSvg(false, 'jaw'), dragonSvg(true, 'jaw')] };
  // A leathery dragon wing (the left one: its shoulder sits bottom-right at 94% 91%; flip = the right wing)
  const wingSvg = flip => `<svg viewBox="0 0 140 110"><g${flip ? ' transform="translate(140 0) scale(-1 1)"' : ''}>` +
    '<path d="M130 100 L98 20 L6 12 Q28 30 12 50 Q38 58 30 82 Q56 82 66 104 Q98 94 130 100 Z" fill="#a82a14" stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round"/>' +
    '<path d="M98 20 L12 50 M98 20 L30 82 M98 20 L66 104 Q98 94 130 100" fill="none" stroke="#d8501e" stroke-width="7" stroke-linecap="round" opacity=".7"/>' +
    '<path d="M6 12 Q28 30 12 50 Q38 58 30 82 Q56 82 66 104" fill="none" stroke="#ff8a1f" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M130 100 L98 20 M98 20 L6 12 M98 20 L12 50 M98 20 L30 82 M98 20 L66 104" fill="none" stroke="' + INK + '" stroke-width="4.5" stroke-linecap="round"/>' +
    '<path d="M126 92 L100 28 M92 20 L14 14" fill="none" stroke="#ffb300" stroke-width="1.8" stroke-linecap="round"/>' +
    '<path d="M98 20 L92 3 L105 15 Z" fill="#ffd23f" stroke="' + INK + '" stroke-width="2.5" stroke-linejoin="round"/></g></svg>';
  const WING_L = wingSvg(false), WING_R = wingSvg(true);
  // A spiked dragon tail pointing right (its root at the left-centre), a spade of gold at the tip
  const TAIL = '<svg viewBox="0 0 200 70"><path d="M0 20 Q50 14 100 24 Q140 32 176 32 L176 42 Q140 46 100 46 Q50 50 0 52 Z" fill="#c42a12" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M14 19 L22 2 L30 17 Z M44 16 L53 0 L60 17 Z M74 20 L84 4 L90 22 Z M104 25 L114 10 L119 28 Z M134 31 L143 17 L148 33 Z" fill="#ffd23f" stroke="' + INK + '" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<path d="M4 47 Q50 45 100 42 Q140 40 172 39" fill="none" stroke="#ffb300" stroke-width="4" stroke-linecap="round" stroke-dasharray="7 3"/>' +
    '<path d="M30 30 q5 -5 10 0 M60 30 q5 -5 10 0 M90 33 q5 -5 10 0 M120 36 q5 -5 10 0" fill="none" stroke="#8a1206" stroke-width="2" stroke-linecap="round"/>' +
    '<path d="M170 25 Q187 26 200 37 Q187 48 170 49 L179 37 Z" fill="#ffd23f" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/></svg>';
  // One glowing dragon scale (point down), used for Ember Scales' armor
  const SCALE = '<svg viewBox="0 0 40 48"><path d="M3 4 Q20 -1 37 4 Q39 30 20 46 Q1 30 3 4 Z" fill="#ff7a1a" stroke="#5a1a00" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M9 8 Q20 5 31 8 Q31 28 20 38 Q9 28 9 8 Z" fill="#ffb300"/><path d="M20 7 V40" stroke="#fff3a0" stroke-width="2.5" stroke-linecap="round"/>' +
    '<path d="M12 11 Q14 19 17 25" stroke="#fffbe0" stroke-width="2" stroke-linecap="round" fill="none"/></svg>';
  // A gold coin stamped with a star
  const COIN = '<svg viewBox="-20 -20 40 40"><circle r="18" fill="#ffc233" stroke="#8a5a00" stroke-width="3"/><circle r="12.5" fill="#ffd23f" stroke="#e0a000" stroke-width="2"/>' +
    '<path d="M0 -8 L2.4 -2.6 L8 -2.4 L3.6 1.2 L5 7 L0 3.8 L-5 7 L-3.6 1.2 L-8 -2.4 L-2.4 -2.6 Z" fill="#e09a00"/><path d="M-11 -7 A13 13 0 0 1 -3 -13" fill="none" stroke="#fffbe0" stroke-width="2.5" stroke-linecap="round"/></svg>';
  const COIN_I = () => `<i class="fxvb-coin">${COIN}</i>`;
  const LOOT = i => (i % 3 === 2 ? ['💎', '💍', '👑', '💎'][Math.floor(i / 3) % 4] : COIN_I());
  // An eight-pointed star (Supernova): long white-gold rays, short gold ones and a white-hot heart
  const STAR = '<svg viewBox="-50 -50 100 100"><path transform="rotate(45) scale(.62)" d="M0 -48 L8 -8 L48 0 L8 8 L0 48 L-8 8 L-48 0 L-8 -8 Z" fill="#ffb300" stroke="#b34700" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M0 -48 L7 -7 L48 0 L7 7 L0 48 L-7 7 L-48 0 L-7 -7 Z" fill="#fff6c8" stroke="#ff9a1f" stroke-width="3" stroke-linejoin="round"/>' +
    '<circle r="11" fill="#fff"/><circle r="6" fill="#fffbe0"/></svg>';
  // A fiery crescent gust (its bulge points RIGHT, the way it flies)
  const CRESCENT = '<svg viewBox="0 0 60 80"><path d="M8 3 Q66 40 8 77 Q40 40 8 3 Z" fill="#ff6a00" stroke="#8a1a00" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<path d="M16 14 Q50 40 16 66 Q34 40 16 14 Z" fill="#ffd23f"/><path d="M24 26 Q38 40 24 54 Q30 40 24 26 Z" fill="#fffbe0"/></svg>';
  // A motion smear left by the tail's swing (fiery crescent swoosh)
  const SWOOSH = '<svg viewBox="0 0 100 80"><path d="M96 6 Q18 2 6 74 Q34 20 96 6 Z" fill="#ffd23f" opacity=".9"/>' +
    '<path d="M96 6 Q26 10 12 66" fill="none" stroke="#ff3d00" stroke-width="4" stroke-linecap="round"/><path d="M90 9 Q34 12 18 50" fill="none" stroke="#fffbe0" stroke-width="3" stroke-linecap="round"/></svg>';
  // Two glowing dragon eyes in the dark (Dragon Roar's terror)
  const EYES = '<svg viewBox="0 0 100 30"><g fill="#ffd23f" stroke="#ff3d00" stroke-width="2.5"><path d="M4 16 Q20 2 40 12 Q24 26 4 16 Z"/><path d="M96 16 Q80 2 60 12 Q76 26 96 16 Z"/></g>' +
    '<g fill="#1a0000"><path d="M23 7 Q26 14 23 21 Q20 14 23 7 Z"/><path d="M77 7 Q80 14 77 21 Q74 14 77 7 Z"/></g></svg>';
  // The meteor: a volcanic rock at the front (RIGHT) of a tapering fire tail
  const METEOR = `<i class="fxvb-mtail"></i><i class="fxvb-mrock">${ROCK}</i>`;
  const VIG_COSMIC = 'radial-gradient(ellipse at 50% 50%, #ffd23f22 0 20%, #0000 38%, #3a0a6add 100%)';
  const VIG_VOID = 'radial-gradient(ellipse at 50% 45%, #1a0830ee 0 25%, #030008fa 100%)';

  // ---------- Small helpers ----------
  const cardXY = ctx => fxPoint(ctx.slot || ctx.win);  // the card that just landed
  const winXY = ctx => fxPoint(ctx.win || ctx.slot);   // its whole wheel window
  const winSize = ctx => sizeOf(ctx.win, 90, 180);
  const rad = d => d * Math.PI / 180;
  // The final boss's name plate: the kit's fire plate in gold and crimson with a fringe of scales
  const bossPlate = (ctx, text, color) => plate(ctx, text, color, 'fire fxvb-plate');
  // A huge stamped word under the victim, nudged sideways so it never runs off the edge of the screen
  function stamp(ctx, text, { dx = 0, dy = 0, size = 44, ...opts } = {}) {
    const [sx, sy] = stampPoint(ctx, dx), half = text.length * size * 0.27 + 10;
    const x = innerWidth > half * 2 ? clamp(sx, half, innerWidth - half) : innerWidth / 2;
    return slam(x, sy + dy, text, { size, ...opts });
  }
  // Crimson, black and gold hazard tape slapped across a reel
  function tape(x, y, w, text, ms = 950) {
    const el = fxSpawn(x, y, { cls: 'fxvb-tape', html: `<span>${text}</span>`, ms, size: [w, 26] });
    fxAnimate(el, [
      { transform: 'rotate(-9deg) scaleX(0.1)', opacity: 0 },
      { transform: 'rotate(-9deg) scaleX(1.08)', opacity: 1, offset: 0.18 },
      { transform: 'rotate(-9deg) scaleX(1)', opacity: 1, offset: 0.3 },
      { transform: 'rotate(-9deg) scaleX(1)', opacity: 1, offset: 0.8 },
      { transform: 'translate(0, 10px) rotate(-13deg) scaleX(1)', opacity: 0 },
    ], ms, 'ease-out');
  }
  // Which way a head / wing faces to look from a toward b: flipped (facing left) when b is to the left,
  // and the tilt that aims its mouth at b (kept within +-maxTilt so it never ends up upside down)
  function aimOf(a, b, maxTilt = 38) {
    const d = dirOf(a, b), flip = d.dx < 0;
    let tilt = flip ? d.ang - 180 : d.ang;
    if (tilt < -180) tilt += 360;
    if (tilt > 180) tilt -= 360;
    return { flip, tilt: clamp(tilt, -maxTilt, maxTilt) };
  }
  // Where the dragon's mouth is for a head of width W centred on (x, y) (mouth at 90% 62% of the art), tilted
  // about its centre, or about the jaw hinge (25% 64%) for a roaring head
  function mouthOf(x, y, W, flip, tilt = 0, hinge = false) {
    const H = W * 0.83, f = flip ? -1 : 1, pv = hinge ? [x - f * 0.25 * W, y + 0.14 * H] : [x, y];
    const ox = x + f * 0.4 * W - pv[0], oy = y + 0.12 * H - pv[1], c = Math.cos(rad(tilt)), s = Math.sin(rad(tilt));
    return [pv[0] + ox * c - oy * s, pv[1] + ox * s + oy * c];
  }
  // A dragon head centred on (x, y) that rears up, holds and sinks away. Returns the element.
  function head(x, y, W, { flip = false, tilt = 0, ms = 900, part = 'all', rise = 40, cls = '', origin = '50% 50%' } = {}) {
    const el = fxSpawn(x, y, { cls: 'fxr-svg fxvb-head ' + cls, html: HEAD[part][flip ? 1 : 0], ms: ms + 40, size: [W, W * 0.83], style: { transformOrigin: origin } });
    const r = `rotate(${tilt}deg)`;
    fxAnimate(el, [
      { transform: `translate(0, ${rise}px) ${r} scale(0.5, 0.2)`, opacity: 0 },
      { transform: `translate(0, -6px) ${r} scale(1.04, 1.1)`, opacity: 1, offset: 0.2 },
      { transform: `translate(0, 0) ${r} scale(1)`, opacity: 1, offset: 0.32 },
      { transform: `translate(0, 0) ${r} scale(1)`, opacity: 1, offset: 0.8 },
      { transform: `translate(0, ${rise * 0.4}px) ${r} scale(0.92)`, opacity: 0 },
    ], ms, 'ease-out');
    return el;
  }
  // A roaring head: the head without its jaw, plus a jaw that swings open at `openAt` ms and snaps shut at the end
  function roarHead(x, y, W, { flip = false, tilt = 0, ms = 900, openAt = 150, rise = 30 } = {}) {
    const origin = flip ? '75% 64%' : '25% 64%'; // both halves tilt about the jaw hinge so they stay together
    head(x, y, W, { flip, tilt, ms, part: 'top', rise, origin });
    const jaw = fxSpawn(x, y, { cls: 'fxr-svg fxvb-head', html: HEAD.jaw[flip ? 1 : 0], ms: ms + 40, size: [W, W * 0.83], style: { transformOrigin: origin } });
    const r = `rotate(${tilt}deg)`, o = flip ? -1 : 1, t0 = clamp(openAt / ms, 0.25, 0.6);
    fxAnimate(jaw, [
      { transform: `translate(0, ${rise}px) ${r} scale(0.5, 0.2) rotate(${-14 * o}deg)`, opacity: 0 },
      { transform: `translate(0, -6px) ${r} scale(1.04, 1.1) rotate(${-14 * o}deg)`, opacity: 1, offset: 0.2 },
      { transform: `translate(0, 0) ${r} scale(1) rotate(${-14 * o}deg)`, opacity: 1, offset: t0 },
      { transform: `translate(0, 0) ${r} scale(1) rotate(${22 * o}deg)`, opacity: 1, offset: t0 + 0.08 },
      { transform: `translate(0, 0) ${r} scale(1) rotate(${18 * o}deg)`, opacity: 1, offset: 0.8 },
      { transform: `translate(0, ${rise * 0.4}px) ${r} scale(0.92) rotate(0deg)`, opacity: 0 },
    ], ms, 'ease-out');
  }
  // A pair of dragon wings centred on (x, y): they unfold from their shoulders (w apart), beat `beats` times, and fold away
  function wings(x, y, W, { gap = 0, ms = 900, beats = 1, spread = 1 } = {}) {
    [-1, 1].forEach(sd => {
      const H = W * 0.786, cx = x + sd * (gap / 2 + W * 0.44), cy = y - H * 0.41;
      const el = fxSpawn(cx, cy, { cls: 'fxr-svg fxvb-wing', html: sd < 0 ? WING_L : WING_R, ms: ms + 40, size: [W, H],
        style: { transformOrigin: sd < 0 ? '94% 91%' : '6% 91%' } });
      const k = [{ transform: `rotate(${sd * -70}deg) scale(0.3)`, opacity: 0 }, { transform: `rotate(${sd * 8}deg) scale(${1.05 * spread})`, opacity: 1, offset: 0.2 }];
      for (let b = 0; b < beats; b++) {
        const t = 0.2 + (b + 1) * (0.6 / (beats + 0.5));
        k.push({ transform: `rotate(${sd * -34}deg) scale(${0.9 * spread}, ${0.8 * spread})`, opacity: 1, offset: t - 0.6 / (beats + 0.5) / 2 },
          { transform: `rotate(${sd * 12}deg) scale(${spread})`, opacity: 1, offset: t });
      }
      k.push({ transform: `rotate(${sd * 2}deg) scale(${spread})`, opacity: 1, offset: 0.85 }, { transform: `rotate(${sd * -50}deg) scale(0.6)`, opacity: 0 });
      fxAnimate(el, k, ms, 'ease-in-out');
    });
  }
  // A roaring stream of dragon fire from a to b: a widening cone of flame with fireballs tumbling down it
  function stream(a, b, width, { ms = 380, balls = 6, gap = 32 } = {}) {
    const d = dirOf(a, b), el = fxSpawn(a[0], a[1], { cls: 'fxvb-stream', ms, size: [d.len * 1.06, width] });
    if (el) {
      el.style.transformOrigin = '0 50%';
      el.animate([
        { transform: `translate(0, -50%) rotate(${d.ang}deg) scale(0, 0.3)`, opacity: 0.4 },
        { transform: `translate(0, -50%) rotate(${d.ang}deg) scale(1, 0.9)`, opacity: 1, offset: 0.35 },
        { transform: `translate(0, -50%) rotate(${d.ang}deg) scale(1.02, 1.05)`, opacity: 0.95, offset: 0.7 },
        { transform: `translate(0, -50%) rotate(${d.ang}deg) scale(1.04, 0.3)`, opacity: 0 },
      ], { duration: ms, easing: 'ease-out', fill: 'forwards' });
    }
    fxBeam(a, b, { cls: 'fxvb-core-beam', ms: ms * 0.9, width: width * 0.22 });
    for (let i = 0; i < balls; i++) later(i * gap, () => {
      const sp = fxRand(-0.35, 0.35) * width;
      fxFly(a, [b[0] + d.nx * sp, b[1] + d.ny * sp], { cls: 'fxvb-fireball', ms: 230, scale: [0.35, 1.5], spin: fxRand(-200, 200), easing: 'ease-in' });
    });
  }
  // Fireballs bursting outward from (x, y): the heart of every dragon-fire explosion
  function fireballs(x, y, n, r, { ms = 560, size = 1 } = {}) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + fxRand(-0.3, 0.3), d = r * fxRand(0.6, 1), s = size * fxRand(0.9, 1.5);
      const el = fxSpawn(x, y, { cls: 'fxvb-fireball', ms: ms + 40 });
      fxAnimate(el, [
        { transform: 'translate(0, 0) scale(0.4)', opacity: 1 },
        { transform: `translate(${Math.cos(a) * d * 0.7}px, ${Math.sin(a) * d * 0.7 - 6}px) scale(${1.6 * s})`, opacity: 1, offset: 0.45 },
        { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d - 22}px) scale(${2.1 * s})`, opacity: 0 },
      ], ms * fxRand(0.8, 1), 'cubic-bezier(.2,.7,.4,1)');
    }
  }
  // A flat shockwave ring spreading over the ground
  function groundRing(x, y, size, color = '#ffd23f', ms = 520, width = 5) {
    const el = fxSpawn(x, y, { cls: 'fxvb-flatring', ms, size: [size, size * 0.34], style: { borderColor: color, borderWidth: width + 'px' } });
    fxAnimate(el, [{ transform: 'scale(0.15)', opacity: 1 }, { transform: 'scale(1)', opacity: 0 }], ms, 'cubic-bezier(.1,.8,.3,1)');
  }
  // A whirl of wind (a broken ring spinning open)
  function swirl(x, y, size, { ms = 560, cls = 'fxvb-swirl', turn = 1 } = {}) {
    const el = fxSpawn(x, y, { cls, ms, size: [size, size] });
    fxAnimate(el, [
      { transform: `rotate(0deg) scale(0.3)`, opacity: 0.2 },
      { transform: `rotate(${turn * 240}deg) scale(0.85)`, opacity: 1, offset: 0.45 },
      { transform: `rotate(${turn * 520}deg) scale(1.3)`, opacity: 0 },
    ], ms, 'ease-out');
  }
  // A sound-wave arc ")" travelling from a toward b and swelling as it goes
  function soundWave(a, b, { ms = 320, from = 0.5, to = 2, size = 60, cls = 'fxvb-wave' } = {}) {
    const d = dirOf(a, b), el = fxSpawn(a[0], a[1], { cls, ms: ms + 40, size: [size, size] });
    return fxAnimate(el, [
      { transform: `translate(0, 0) rotate(${d.ang}deg) scale(${from})`, opacity: 0 },
      { transform: `translate(${d.dx * 0.2}px, ${d.dy * 0.2}px) rotate(${d.ang}deg) scale(${from + (to - from) * 0.2})`, opacity: 1, offset: 0.15 },
      { transform: `translate(${d.dx * 0.7}px, ${d.dy * 0.7}px) rotate(${d.ang}deg) scale(${from + (to - from) * 0.7})`, opacity: 1, offset: 0.65 },
      { transform: `translate(${d.dx}px, ${d.dy}px) rotate(${d.ang}deg) scale(${to})`, opacity: 0 },
    ], ms, 'ease-out');
  }
  // Shaking with fear / after a blast: the victim's box rattles side to side
  const shiver = (el, px = 4, ms = 600) => jolt(el, [0, -1, 1, -0.8, 0.8, -0.6, 0.6, -0.3, 0].map(v => ({ transform: `translateX(${v * px}px)` })), ms);
  // Treasure spilling out of (x, y): coins and gems fly up in a fountain, tumble and fall
  function spill(x, y, n, { up = 60, fall = 70, spread = 60, ms = 800, size = [16, 24], html = LOOT } = {}) {
    for (let i = 0; i < n; i++) later(i * 25, () => {
      const el = fxSpawn(x, y, { cls: 'fxvb-loot', html: html(i), ms: ms + 40, style: { fontSize: fxRand(size[0], size[1]) + 'px' } });
      const dx = fxRand(-spread, spread), u = up * fxRand(0.7, 1.25), sp = fxRand(-540, 540), k = [];
      for (let j = 0; j <= 6; j++) {
        const t = j / 6;
        k.push({ transform: `translate(${dx * t}px, ${-4 * u * t * (1 - t) + fall * t * t}px) rotate(${sp * t}deg) scale(${0.5 + 0.5 * Math.min(1, t * 3)})`, opacity: t > 0.85 ? 0 : 1 });
      }
      fxAnimate(el, k, ms * fxRand(0.85, 1), 'linear');
    });
  }
  // Tiny twinkling stars popping up around a point
  function twinkles(x, y, w, h, n = 5, cls = 'fxvb-twinkle') {
    for (let i = 0; i < n; i++) later(i * 70, () => show(x + fxRand(-w / 2, w / 2), y + fxRand(-h / 2, h / 2), '✦',
      { cls, font: fxRand(12, 22), ms: 480, from: 0.1, to: 1.2, spin: 90, rise: 0 }));
  }

  // ================= Dragon Inferno (x8 + burn): the dragon's own breath of fire =================
  CARD_FX['dragon-inferno'] = {
    // A dragon head rears out of the card breathing smoke, a fiery danger tint and hazard tape
    land(ctx) {
      remember(ctx);
      const [x, y] = cardXY(ctx), [w, h] = winSize(ctx), flip = at(ctx)[0] < x, W = w * 1.45;
      fxTint(VIG.fire, { ms: 900, opacity: 0.65 });
      frame(ctx.win, '#ff3d00', 900);
      const hy = y - h * 0.08;
      head(x, hy, W, { flip, ms: 1000, rise: 50 });
      const [mx, my] = mouthOf(x, hy, W, flip);
      later(200, () => { fxShake(ctx.panel, 7, 300); sfx('big_hit', 0.4, 0.4); }); // a rumbling growl
      // Smoke curls from its nostrils and flames flicker in its jaws
      [260, 480].forEach(t => later(t, () => smoke(mx - (flip ? -8 : 8), my - W * 0.18, 2, { size: 30, spread: 16, rise: 50, ms: 700 })));
      later(320, () => { sparks(mx, my, { count: 8, spread: 50, angle: flip ? 180 : 0, cone: 60, gravity: 20 }); embers(mx, my, { count: 6, spread: 40 }); });
      tape(x, y - h * 0.4, w * 1.45, '⚠ DRAGON FIRE ⚠');
      bossPlate(ctx, '🐲 DRAGON INFERNO', '#ff5a1f');
    },
    // Fire charges in the dragon's jaws... then a huge roaring breath of flame to the victim
    windup(ctx) {
      const from = src(ctx), [tx, ty] = at(ctx), [, fh] = sizeOf(ctx.from, 200, 46), [, bh] = sizeOf(ctx.to, 200, 46), s = ctx.crit ? 1.25 : 1;
      const W = 104 * s, hx = from[0], hy = from[1] - fh * 0.5 - W * 0.22, { flip, tilt } = aimOf([hx, hy], [tx, ty]);
      head(hx, hy, W, { flip, tilt, ms: 700, rise: 30 });
      const m = mouthOf(hx, hy, W, flip, tilt);
      dim(VIG.fire, ctx.crit ? 0.8 : 0.6, 460);
      charge(m[0], m[1], { colors: FIRE_COLS, n: 12, r: 70, ms: 200, size: [4, 8] });
      later(40, () => core(m[0], m[1], 50, 'fire', 200));
      later(190, () => {
        stream(m, [tx, ty], bh * 2.2 * s, { ms: 420, balls: 7, gap: 26 });
        sparks(m[0], m[1], { count: 8, spread: 60, angle: dirOf(m, [tx, ty]).ang, cone: 50, gravity: 0 });
        sfx('saw', 1.4, 0.25); // whoosh of flame
      });
      return wait(400);
    },
    // An inferno engulfs the victim: fireballs, flames licking up, lava and a scorch mark
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit, [bw, bh] = sizeOf(ctx.to, 200, 46);
      flash('#ffb300', crit ? 0.5 : 0.3);
      fxTint('#ff3d00', { ms: 450, opacity: crit ? 0.45 : 0.3 });
      core(tx, ty, 200 * p, 'fire', 460);
      fireballs(tx, ty, crit ? 9 : 7, 90 * Math.min(1.6, p));
      flames(tx, ty + bh * 0.45, { n: 6, w: bw * 0.95, h: 70 * Math.min(1.5, p), ms: 800 });
      scorch(tx, ty + 6, Math.min(240, bw * 1.05), 1000);
      for (let i = 0; i < 3; i++) later(i * 90, () => fxRing(tx, ty, { color: ['#fff3a0', '#ff6a00', '#a01800'][i], size: (160 + i * 100) * p, width: 10 - i * 3, ms: 540 }));
      lavaBlobs(tx, ty, { count: 10, spread: 170 * p, cone: 260 });
      embers(tx, ty, { count: 14, spread: 150 * p });
      later(120, () => smoke(tx, ty - bh * 0.3, 4, { size: 64, spread: bw * 0.6 }));
      speedLines(tx, ty, { n: 10, r0: 50, r1: 170 * Math.min(1.4, p), cls: 'fxr-line-fire', width: 5 });
      jolt(ctx.to, [{ transform: 'none' }, { transform: 'translateY(-6px) scale(1.05)', offset: 0.2 }, { transform: 'translateY(3px) scale(0.98)', offset: 0.5 }, { transform: 'none' }], 420);
      stamp(ctx, crit ? 'DRAGONFIRE!!' : 'INFERNO!', { kind: 'fire fxvb-dragon', size: crit ? 46 : Math.min(50, 30 + 10 * p), rotate: -6, ms: 1000, star: crit ? '#ffd23f' : '#ff8a1f' });
      fxShake(ctx.panel, Math.min(28, 15 * p), 520);
      fxShake(ctx.to, 14, 400);
      haptic(crit ? 130 : 90);
    },
    // Burn: the kit's burn, plus a ring of dragon flames dancing round the victim and a roasting wisp of smoke
    gimmick(ctx) {
      fire.burn(ctx, { word: 'ROASTED!' });
      const [x, y] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46);
      orbit(x, y, `<i class="fxvb-oflame">${FLAME}</i>`, 5, { rx: w * 0.56, ry: h * 0.85, ms: 1000, size: 22, turns: 1.2 });
      later(300, () => smoke(x, y - h * 0.6, 3, { size: 40, spread: w * 0.4, rise: 60 }));
    },
  };

  // ================= Meteor Strike (x9, cleave): a flaming meteor falls out of the night sky =================
  CARD_FX['meteor-strike'] = {
    // A meteor streaks across the card under twinkling stars and bursts at its foot
    land(ctx) {
      remember(ctx);
      const [x, y] = winXY(ctx), [w, h] = winSize(ctx);
      frame(ctx.win, '#ff8a1f', 900);
      const night = fxSpawn(x, y, { cls: 'fxvb-night', ms: 950, size: [w + 6, h + 6] });
      fxAnimate(night, [{ transform: 'scale(0.96)', opacity: 0 }, { transform: 'scale(1)', opacity: 0.85, offset: 0.2 }, { transform: 'scale(1)', opacity: 0.85, offset: 0.75 }, { transform: 'scale(1)', opacity: 0 }], 950, 'ease-out');
      twinkles(x, y - h * 0.15, w * 0.9, h * 0.6, 6);
      const a = [x - w * 0.75, y - h * 0.55], b = [x + w * 0.15, y + h * 0.18];
      later(120, () => aimFly(a, b, { html: METEOR, cls: 'fxvb-meteor', ms: 360, scale: [0.3, 0.55], trail: 'fxvb-trail-meteor', trailEvery: 30, easing: 'cubic-bezier(.5,0,1,.6)' })
        .then(() => {
          core(b[0], b[1], 80, 'lava', 320);
          rocks(b[0], b[1], { count: 6, spread: 70, size: [5, 9] });
          fxRing(b[0], b[1], { color: '#ffb300', size: 90, width: 4, ms: 360 });
          fxShake(ctx.panel, 7, 260);
          sfx('big_hit', 0.5, 0.35);
        }));
      bossPlate(ctx, '☄️ METEOR STRIKE', '#ff8a1f');
    },
    // Cleave (before the hit): the kit's lava crack smashes any shields, with red-hot pebbles raining onto them
    gimmick(ctx) {
      fire.smash(ctx, { word: 'CRATERED!' });
      const [tx, ty] = at(ctx), [w] = sizeOf(ctx.to, 200, 46);
      if (!ctx.blocked) return;
      for (let i = 0; i < 4; i++) later(40 + i * 45, () => {
        const px = tx + fxRand(-w * 0.4, w * 0.4);
        fxFly([px + 40, ty - 170], [px, ty], { html: ROCK, cls: 'fxr-svg fxvb-pebble', ms: 200, spin: 300, easing: 'ease-in' })
          .then(() => sparks(px, ty, { count: 4, spread: 40 }));
      });
    },
    // A lock-on and a growing shadow... then the meteor plummets from the top corner, pointing along its path
    windup(ctx) {
      const [tx, ty] = at(ctx), s = ctx.crit ? 1.25 : 1, [bw, bh] = sizeOf(ctx.to, 200, 46);
      const side = tx < innerWidth / 2 ? 1 : -1, start = [side > 0 ? innerWidth + 50 : -50, Math.min(ty - 260, -60)];
      reticle(tx, ty, '#ff6a00', 440);
      dim(VIG.fire, ctx.crit ? 0.8 : 0.6, 460);
      shadow(tx, ty + bh * 0.35, bw * 1.1, 40, 420);
      later(30, () => sfx('big_hit', 0.35, 0.4)); // the sky rumbles
      return new Promise(r => later(40, () => aimFly(start, [tx, ty - 6], { html: METEOR, cls: 'fxvb-meteor', ms: 350, scale: [0.6, 1.5 * s],
        trail: 'fxvb-trail-meteor', trailEvery: 28, easing: 'cubic-bezier(.55,0,1,.7)' }).then(r)));
    },
    // A crater explosion: molten core, lava cracks, flying rocks and shockwave rings racing over the ground
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit, [bw, bh] = sizeOf(ctx.to, 200, 46), base = ty + bh * 0.4;
      flash('#ffd23f', crit ? 0.6 : 0.4);
      fxTint('#ff6a00', { ms: 450, opacity: crit ? 0.45 : 0.32 });
      const crater = fxSpawn(tx, base, { cls: 'fxvb-crater', ms: 1000, size: [Math.min(280, bw * 1.2) * Math.min(1.3, p), 48 * Math.min(1.3, p)] });
      fxAnimate(crater, [{ transform: 'scale(0.2)', opacity: 0 }, { transform: 'scale(1.08)', opacity: 1, offset: 0.15 }, { transform: 'scale(1)', opacity: 1, offset: 0.7 }, { transform: 'scale(1.04)', opacity: 0 }], 1000, 'ease-out');
      core(tx, ty, 210 * p, 'lava', 460);
      crackBurst(tx, ty + 6, Math.min(300, 180 * p), 'lava', fxRand(-20, 20), 1000);
      for (let i = 0; i < 3; i++) later(i * 90, () => fxRing(tx, ty, { color: ['#fff3a0', '#ff6a00', '#5a4a42'][i], size: (170 + i * 110) * p, width: 11 - i * 3, ms: 560 }));
      later(120, () => groundRing(tx, base, 340 * p, '#ffb300', 620, 6));
      rocks(tx, ty, { count: 14, spread: 200 * p, size: [10, 20] });
      lavaBlobs(tx, ty, { count: 10, spread: 170 * p });
      later(80, () => smoke(tx, base, 5, { size: 70, spread: bw * 0.8, rise: 70 }));
      speedLines(tx, ty, { n: 10, r0: 50, r1: 180 * Math.min(1.4, p), cls: 'fxr-line-fire', width: 5 });
      jolt(ctx.to, [{ transform: 'none' }, { transform: 'translateY(12px) scale(1.07, 0.84)', offset: 0.2 }, { transform: 'translateY(-5px) scale(0.98, 1.04)', offset: 0.5 }, { transform: 'none' }], 440);
      stamp(ctx, crit ? 'MEGA METEOR!!' : 'METEOR!', { kind: 'lava fxvb-dragon', size: crit ? 44 : Math.min(52, 32 + 10 * p), rotate: 5, ms: 1000, star: '#ff8a1f' });
      fxShake(ctx.panel, Math.min(32, 18 * p), 580);
      fxShake(ctx.to, 16, 420);
      later(260, () => fxShake(ctx.panel, 8, 260)); // falling debris
      haptic(crit ? 150 : 110);
    },
  };

  // ================= Dragon Wings (x2, frenzy: 3 strikes): fiery gusts from beating wings, more every strike =================
  let gustDir = 0; // the angle the current strike's gusts flew at (its impact blows embers on along it)
  CARD_FX['dragon-wings'] = {
    // Huge dragon wings unfold behind the card and give one mighty beat
    land(ctx) {
      remember(ctx);
      const [x, y] = cardXY(ctx), [w, h] = winSize(ctx);
      fxTint(VIG.fire, { ms: 800, opacity: 0.45 });
      frame(ctx.win, '#ff6a1f', 900);
      wings(x, y + h * 0.06, w * 1.35, { gap: w * 0.3, ms: 1000, beats: 1 });
      later(420, () => {
        speedLines(x, y, { n: 8, r0: w * 0.4, r1: w * 0.95, cls: 'fxr-line-fire', width: 4 });
        embers(x, y + h * 0.2, { count: 10, spread: w * 0.8, cone: 200 });
        fxShake(ctx.panel, 6, 260);
        sfx('eagle', 0.55, 0.3); // wing whoomph
      });
      later(160, () => slam(x, y - h * 0.05, '×3', { kind: 'fire', size: 40, rotate: -8, ms: 700 }));
      bossPlate(ctx, '🦇 DRAGON WINGS', '#ff6a1f');
    },
    // Frenzy (before the strikes): the kit's blazing aura as the wings beat over the dragon and gusts blow out
    gimmick(ctx) {
      fire.frenzy(ctx, { word: 'WING STORM!' });
      const [x, y] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46), dir = Math.sign(at(ctx)[0] - x) || -1;
      wings(x, y - h * 0.1, Math.min(120, w * 0.6), { gap: w * 0.5, ms: 950, beats: 2 });
      [180, 420].forEach(t => later(t, () => {
        for (let i = 0; i < 3; i++) fxBeam([x, y - h + i * h * 0.8], [x + dir * w * 1.2, y - h + i * h * 0.8 + 10], { cls: 'fxvb-gust', ms: 360, width: 5 });
        swirl(x + dir * w * 0.55, y, 70, { ms: 480 });
        fxShake(ctx.panel, 7, 200);
      }));
    },
    // Strike s: 2 + s fiery crescent gusts sweep from the dragon's wings at the victim on fanning arcs
    windup(ctx) {
      const s = clamp(ctx.strike || 0, 0, 2), n = 2 + s, [tx, ty] = at(ctx), from = src(ctx), [fw, fh] = sizeOf(ctx.from, 200, 46), ms = [300, 270, 245][s];
      gustDir = dirOf(from, [tx, ty]).ang;
      wings(from[0], from[1] - fh * 0.1, Math.min(110, fw * 0.6), { gap: fw * 0.4, ms: 420, beats: 1, spread: 0.9 });
      const flights = [];
      for (let i = 0; i < n; i++) {
        const sd = i % 2 ? 1 : -1, a = [from[0] + sd * fw * 0.35, from[1] - fh * 0.6 - fxRand(0, 20)];
        const hit = [tx + fxRand(-20, 20), ty + fxRand(-12, 12)], arc = sd * (40 + 20 * i);
        flights.push(new Promise(r => later(i * 40, () => aimFly(a, hit, { html: CRESCENT, cls: 'fxr-svg fxvb-crescent', ms, arc, scale: [0.8, 1.2 + s * 0.2],
          trail: i < 2 ? 'fxr-trail-fire' : '', trailEvery: 30, easing: 'cubic-bezier(.4,0,.9,.6)' }).then(r))));
      }
      if (s === 2) dim(VIG.fire, 0.6, 320);
      later(20, () => sfx('eagle', 0.6 + s * 0.08, 0.2));
      return Promise.all(flights);
    },
    // Wind and ember slashes: FWOOSH! -> FWOOSH!! -> HURRICANE!!!
    impact(ctx) {
      const s = clamp(ctx.strike || 0, 0, 2), [tx, ty] = at(ctx), p = pow(ctx) + s * 0.2, crit = !!ctx.crit, [bw] = sizeOf(ctx.to, 200, 46);
      for (let i = 0; i < 2 + s; i++) later(i * 45, () => slash(tx + fxRand(-20, 20), ty + fxRand(-12, 12), gustDir + 90 + fxRand(-40, 40), (120 + 30 * s) * Math.min(1.4, p), 10 + s * 2, 'fxr-slash-fire'));
      swirl(tx, ty, (120 + 40 * s) * Math.min(1.5, p), { ms: 560 });
      if (s > 0) later(80, () => swirl(tx, ty, (90 + 40 * s) * Math.min(1.5, p), { ms: 520, cls: 'fxvb-swirl fxvb-swirl-hot', turn: -1 }));
      fxParticles(tx, ty, { count: 10 + s * 4, colors: ['#ffd23f', '#ff9a1f', '#ff5a00', '#fff3a0'], size: [3, 7], spread: (130 + 40 * s) * p, gravity: -20, angle: gustDir, cone: 90, ms: 650 });
      for (let i = 0; i <= s; i++) later(i * 70, () => fxRing(tx, ty, { color: i % 2 ? '#ff6a00' : '#fff3a0', size: (130 + 50 * i + 30 * s) * p, ms: 420, width: 6 }));
      knock(ctx.to, src(ctx), 12 + s * 8, 340);
      stamp(ctx, ['FWOOSH!', 'FWOOSH!!', 'HURRICANE!!!'][s], { dx: (s - 1) * 24, kind: s === 2 ? 'fire fxvb-dragon' : 'fire',
        size: 30 + s * 9 + (crit ? 8 : 0), rotate: [-10, 8, -4][s], ms: 650 + s * 150, star: s === 2 ? '#ff8a1f' : null });
      fxShake(ctx.panel, 6 + s * 6, 260 + s * 60);
      fxShake(ctx.to, 6 + s * 3, 250);
      if (s === 2) {
        speedLines(tx, ty, { n: 10, r0: 60, r1: 170, cls: 'fxr-line-fire', width: 5 });
        embers(tx, ty, { count: 12, spread: bw * 0.7 });
        fxTint('#ff3d00', { ms: 400, opacity: 0.35 });
        flash('#ffb300', 0.3);
        haptic(80);
      }
    },
  };

  // ================= Treasure Hoard (wallow: heal + shield): the dragon wallows in its gold =================
  CARD_FX['treasure-hoard'] = {
    // Gold coins and gems spill out of the card with a golden gleam
    land(ctx) {
      remember(ctx);
      const [x, y] = cardXY(ctx), [w, h] = winSize(ctx);
      frame(ctx.win, '#ffd23f', 900);
      const g = fxSpawn(x, y, { cls: 'fxvb-goldglow', ms: 900, size: [w * 1.5, h * 0.9] });
      fxAnimate(g, [{ transform: 'scale(0.5)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: 0.3 }, { transform: 'scale(1.15)', opacity: 0 }], 900, 'ease-out');
      glint(ctx.slot);
      spill(x, y, 12, { up: h * 0.5, fall: h * 0.4, spread: w * 1.1, ms: 850, size: [20, 30] });
      later(200, () => spill(x, y + 10, 8, { up: h * 0.35, fall: h * 0.35, spread: w * 0.8, ms: 720, html: COIN_I, size: [16, 22] }));
      twinkles(x, y, w, h * 0.6, 5, 'fxvb-twinkle fxvb-twinkle-gold');
      later(420, () => slam(x, y - h * 0.3, 'MINE!', { kind: 'gold', size: 26, rotate: 8, ms: 650 }));
      bossPlate(ctx, '💰 TREASURE HOARD', '#ffd23f');
      sfx('coin', 1.2, 0.4);
      later(160, () => sfx('coin', 1.5, 0.3));
    },
    // Wallow: coins and gems rain onto the dragon's HP box with a golden glow, then it heals behind a golden shield
    gimmick(ctx) {
      const [x, y] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46);
      for (let i = 0; i < 14; i++) later(i * 40, () => fxFly([x + fxRand(-w * 0.6, w * 0.6), y - 190 - fxRand(0, 60)], [x + fxRand(-w * 0.35, w * 0.35), y + fxRand(-6, 10)],
        { html: LOOT(i), cls: 'fxvb-loot', ms: 360, spin: fxRand(-500, 500), scale: [1, 0.7], easing: 'cubic-bezier(.5,0,1,.7)' })
        .then(() => { if (i % 3 === 0) { sparks(x + fxRand(-w * 0.3, w * 0.3), y, { count: 4, spread: 40, gravity: 30 }); sfx('coin', 1.3 + (i % 5) * 0.12, 0.2); } }));
      later(300, () => {
        const g = fxSpawn(x, y, { cls: 'fxvb-goldglow', ms: 1000, size: [w * 1.5, h * 3] });
        fxAnimate(g, [{ transform: 'scale(0.6)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: 0.3 }, { transform: 'scale(1)', opacity: 0.9, offset: 0.7 }, { transform: 'scale(1.15)', opacity: 0 }], 1000, 'ease-out');
        twinkles(x, y, w, h * 1.6, 6, 'fxvb-twinkle fxvb-twinkle-gold');
        ['CLINK!', 'CHING!'].forEach((t, i) => later(i * 180, () => fxPop(x + (i ? 1 : -1) * w * 0.32, y - h * 0.5 - 14, t, { cls: 'fxvb-clink', size: 18, ms: 520, rise: 14, rotate: i ? 10 : -10 })));
        jolt(ctx.from, [{ transform: 'none' }, { transform: 'scale(1.06, 0.94)', offset: 0.35 }, { transform: 'scale(0.98, 1.03)', offset: 0.7 }, { transform: 'none' }], 300);
      });
      later(520, () => fire.heal(ctx, { word: 'MY HOARD!', shield: true, sun: true }));
    },
  };

  // ================= Tail Swipe (x6): a massive spiked tail sweeps the victim away =================
  // A tail rooted at (px, py) that swings from angle a0 to a1 (degrees, screen space). Its root stays put.
  function tailSwing(px, py, L, a0, a1, { ms = 380, linger = 380, flipY = false } = {}) {
    const el = fxSpawn(px, py, { cls: 'fxr-svg fxvb-tail', html: TAIL, ms: ms + linger + 40, size: [L, L * 0.35] });
    if (!el) return Promise.resolve();
    el.style.transformOrigin = '0 50%';
    const f = a => `translate(0, -50%) rotate(${a}deg)${flipY ? ' scaleY(-1)' : ''}`;
    const a = el.animate([
      { transform: f(a0), opacity: 0 },
      { transform: f(a0 + (a1 - a0) * 0.15), opacity: 1, offset: 0.25 },
      { transform: f(a1), opacity: 1 },
    ], { duration: ms, easing: 'cubic-bezier(.5,0,.8,.6)', fill: 'forwards' });
    return a.finished.then(() => el.animate([
      { transform: f(a1), opacity: 1 },
      { transform: f(a1 + (a1 - a0) * 0.12), opacity: 1, offset: 0.4 },
      { transform: f(a1 + (a1 - a0) * 0.2), opacity: 0 },
    ], { duration: linger, easing: 'ease-out', fill: 'forwards' })).catch(() => {});
  }
  let swipeSide = 1; // which side the tail came from (its impact knocks the victim the other way)
  CARD_FX['tail-swipe'] = {
    // A spiked tail swishes across the card, kicking up dust
    land(ctx) {
      remember(ctx);
      const [x, y] = cardXY(ctx), [w, h] = winSize(ctx), L = w * 1.7;
      frame(ctx.win, '#ff8a1f', 850);
      tailSwing(x - w * 0.62, y + h * 0.12, L, -70, 18, { ms: 420, linger: 420 });
      later(260, () => {
        smoke(x, y + h * 0.28, 4, { size: 40, spread: w * 0.8, rise: 30, dark: false });
        rocks(x + w * 0.2, y + h * 0.2, { count: 6, spread: 70, size: [5, 9] });
        fxShake(ctx.panel, 6, 240);
        sfx('saw', 0.8, 0.2); // swish
      });
      faceJiggle(ctx, [{ transform: 'none' }, { transform: 'translateX(5px) rotate(3deg)', offset: 0.3 }, { transform: 'translateX(-2px) rotate(-1deg)', offset: 0.6 }, { transform: 'none' }], 360);
      bossPlate(ctx, '🦖 TAIL SWIPE', '#ff8a1f');
    },
    // The massive tail sweeps in from the dragon's side around a pivot, spikes first
    windup(ctx) {
      const [tx, ty] = at(ctx), from = src(ctx), s = ctx.crit ? 1.2 : 1, [bw] = sizeOf(ctx.to, 200, 46);
      const side = Math.sign(from[0] - tx) || 1, L = Math.max(240, bw * 1.3) * s;
      swipeSide = side;
      const px = tx + side * L * 0.92, py = ty - 6;
      // Pointing back toward the victim (180 deg when it comes from the right); it swings down through the victim
      const a0 = side > 0 ? 245 : -65, a1 = side > 0 ? 174 : 6;
      dim(VIG.fire, ctx.crit ? 0.7 : 0.5, 420);
      later(150, () => { speedLines(tx, ty, { n: 6, r0: 60, r1: 140, cls: 'fxr-line', width: 3 }); sfx('saw', 0.7, 0.25); });
      return tailSwing(px, py, L, a0, a1, { ms: 370, linger: 420, flipY: side > 0 }).then(() => {});
    },
    // A sweeping arc slash, the victim knocked flying sideways, rocks and dust
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit, [bw, bh] = sizeOf(ctx.to, 200, 46), side = swipeSide;
      core(tx, ty, 140 * p, 'fire', 380);
      const sw = fxSpawn(tx - side * 10, ty - 6, { cls: 'fxr-svg fxvb-swoosh', html: SWOOSH, ms: 420, size: [170 * Math.min(1.4, p), 136 * Math.min(1.4, p)] });
      fxAnimate(sw, [
        { transform: `scale(${side > 0 ? 1 : -1}, 1) rotate(-30deg) scale(0.7)`, opacity: 0 },
        { transform: `scale(${side > 0 ? 1 : -1}, 1) rotate(0deg) scale(1)`, opacity: 1, offset: 0.3 },
        { transform: `scale(${side > 0 ? 1 : -1}, 1) rotate(20deg) scale(1.1)`, opacity: 0 },
      ], 400, 'ease-out');
      [-1, 0, 1].forEach((k, i) => later(i * 35, () => slash(tx + k * 18, ty + k * 10, side > 0 ? 150 + k * 12 : 30 - k * 12, 170 * Math.min(1.5, p), 11 - i * 2, 'fxr-slash-fire')));
      fxRing(tx, ty, { color: '#fff3a0', size: 170 * p, width: 7, ms: 420 });
      later(80, () => fxRing(tx, ty, { color: '#ff6a00', size: 240 * p, width: 5, ms: 480 }));
      rocks(tx, ty, { count: 12, spread: 180 * p, angle: side > 0 ? 200 : -20, cone: 120 });
      sparks(tx, ty, { count: 12, spread: 150 * p, angle: side > 0 ? 180 : 0, cone: 100 });
      smoke(tx, ty + bh * 0.4, 4, { size: 54, spread: bw * 0.7, rise: 30, dark: false });
      lunge(ctx.to, [tx - side * 200, ty - 20], 30 * Math.min(1.5, p), 420);
      stamp(ctx, crit ? 'TAIL WHIP!!' : 'WHAM!', { dx: -side * 20, kind: 'fire fxvb-dragon', size: crit ? 44 : Math.min(54, 32 + 11 * p), rotate: side * 8, ms: 900, star: crit ? '#ffd23f' : null });
      fxShake(ctx.panel, Math.min(26, 14 * p), 460);
      fxShake(ctx.to, 12, 360);
      haptic(crit ? 110 : 70);
    },
  };

  // ================= Twin Inferno (x7 + burn, SUPER MOVE): two heads, two streams of fire crossing in an X =================
  CARD_FX['twin-inferno'] = {
    // Two dragon heads rise from either side of the card and cross their flames over it
    land(ctx) {
      remember(ctx);
      const [x, y] = cardXY(ctx), [w, h] = winSize(ctx), W = w * 0.95, hy = y + h * 0.04;
      fxTint(VIG.fire, { ms: 1000, opacity: 0.7 });
      frame(ctx.win, '#ff3d00', 1000);
      const heads = [[x - w * 0.72, false], [x + w * 0.72, true]];
      heads.forEach(([hx, flip], i) => later(i * 90, () => head(hx, hy, W, { flip, tilt: flip ? 34 : -34, ms: 1000, rise: 60 })));
      later(160, () => { fxShake(ctx.panel, 8, 320); sfx('big_hit', 0.4, 0.4); });
      later(360, () => {
        heads.forEach(([hx, flip]) => {
          const m = mouthOf(hx, hy, W, flip, flip ? 34 : -34);
          stream(m, [x + (flip ? -1 : 1) * w * 0.8, y - h * 0.5], W * 0.45, { ms: 460, balls: 4, gap: 40 });
        });
        later(140, () => { core(x, y - h * 0.2, 110, 'fire', 420); sparks(x, y - h * 0.2, { count: 12, spread: 90 }); });
        sfx('saw', 1.3, 0.25);
      });
      bossPlate(ctx, '🐉 TWIN INFERNO', '#ff3d00');
    },
    // Two streams of fire from above-left and above-right of the dragon converge on the victim in an X
    windup(ctx) {
      const from = src(ctx), [tx, ty] = at(ctx), [fw, fh] = sizeOf(ctx.from, 200, 46), [, bh] = sizeOf(ctx.to, 200, 46), s = ctx.crit ? 1.2 : 1;
      const W = 84 * s;
      dim(VIG.fire, ctx.crit ? 0.85 : 0.7, 460);
      [-1, 1].forEach((sd, i) => {
        const hx = clamp(from[0] + sd * Math.max(70, fw * 0.45), 40, innerWidth - 40), hy = from[1] - fh * 0.5 - (sd < 0 ? 120 : 20), { flip, tilt } = aimOf([hx, hy], [tx, ty], 50);
        head(hx, hy, W, { flip, tilt, ms: 680, rise: 30 });
        const m = mouthOf(hx, hy, W, flip, tilt), d = dirOf(m, [tx, ty]);
        charge(m[0], m[1], { colors: FIRE_COLS, n: 8, r: 55, ms: 180, size: [4, 7] });
        // Aimed through the victim, so the two streams cross right on it
        later(170 + i * 30, () => stream(m, [tx + d.ux * 70, ty + d.uy * 70], bh * 1.3 * s, { ms: 400, balls: 5, gap: 28 }));
      });
      later(180, () => sfx('saw', 1.3, 0.28));
      return wait(410);
    },
    // A double explosion with a burning X across the victim
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit, [bw, bh] = sizeOf(ctx.to, 200, 46), k = Math.min(1.5, p);
      flash('#ffb300', crit ? 0.55 : 0.4);
      fxTint('#ff3d00', { ms: 500, opacity: crit ? 0.5 : 0.35 });
      [-1, 1].forEach((sd, i) => later(i * 110, () => {
        const ex = tx + sd * bw * 0.3, ey = ty - sd * 10;
        core(ex, ey, 120 * p, 'fire', 440);
        fireballs(ex, ey, 5, 80 * k);
        fxRing(ex, ey, { color: i ? '#ffd23f' : '#ff6a00', size: 200 * p, width: 8, ms: 500 });
        fxShake(ctx.panel, Math.min(26, 13 * p), 380);
      }));
      // The cross burst: two burning slashes in an X and a four-way flare
      later(90, () => slash(tx, ty, 45, 240 * k, 18, 'fxr-slash-fire'));
      later(140, () => slash(tx, ty, -45, 240 * k, 18, 'fxr-slash-fire'));
      later(90, () => { show(tx, ty, STAR, { cls: 'fxvb-starburst', size: [150 * k, 150 * k], ms: 520, from: 0.2, to: 1, rise: 0, spin: 45 }); crackBurst(tx, ty, 200 * p, 'lava', 45, 900); });
      flames(tx, ty + bh * 0.45, { n: 6, w: bw * 0.95, h: 70 * k, ms: 800 });
      lavaBlobs(tx, ty, { count: 10, spread: 170 * p, cone: 260 });
      embers(tx, ty, { count: 12, spread: 150 * p });
      later(220, () => fxRing(tx, ty, { color: '#fff3a0', size: 320 * p, width: 5, ms: 560 }));
      jolt(ctx.to, [{ transform: 'none' }, { transform: 'translateY(-8px) scale(1.06)', offset: 0.2 }, { transform: 'translateY(4px) scale(0.97)', offset: 0.5 }, { transform: 'none' }], 460);
      stamp(ctx, crit ? 'TWIN DRAGONFIRE!!' : 'DOUBLE INFERNO!', { kind: 'fire fxvb-dragon', size: crit ? 36 : Math.min(42, 28 + 7 * p), rotate: -5, ms: 1100, star: '#ff8a1f' });
      fxShake(ctx.to, 16, 440);
      haptic(crit ? 150 : 110);
    },
    // Burn: the kit's burn, then a second wave of flames from the other head
    gimmick(ctx) {
      fire.burn(ctx, { word: 'DOUBLE BURN!' });
      const [x, y] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46);
      later(260, () => {
        flames(x, y + h * 0.4, { n: 5, w: w * 0.9, h: 54, ms: 700 });
        fxRing(x, y, { color: '#ffd23f', size: 200, width: 5, ms: 480 });
        fxPop(x + w * 0.5, y - h * 0.4, '×2', { cls: 'fxvb-x2', size: 26, ms: 700, rise: 14, rotate: 10 });
      });
      orbit(x, y, `<i class="fxvb-oflame">${FLAME}</i>`, 4, { rx: w * 0.56, ry: h * 0.85, ms: 900, size: 20, turns: -1.2 });
    },
  };

  // ================= Ember Scales (armor +2): glowing dragon scales overlap into armor =================
  CARD_FX['ember-scales'] = {
    // Glowing orange scales ripple across the card in a wave
    land(ctx) {
      remember(ctx);
      const [x, y] = cardXY(ctx), [w, h] = winSize(ctx), cw = w * 0.95, ch = h * 0.7;
      frame(ctx.win, '#ff8a1f', 900);
      const cols = 4, rows = 5, sw = cw / (cols - 0.4), sh = sw * 1.2;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const sx = x - cw / 2 + sw * (c + (r % 2 ? 0.7 : 0.2)), sy = y - ch * 0.42 + r * sh * 0.7;
        later(c * 70 + r * 45, () => fxAnimate(fxSpawn(sx, sy, { cls: 'fxr-svg fxvb-scale', html: SCALE, ms: 640, size: [sw, sh] }), [
          { transform: 'translate(0, -6px) scale(0.2) rotate(-20deg)', opacity: 0 },
          { transform: 'translate(0, 0) scale(1.15) rotate(0deg)', opacity: 1, offset: 0.3 },
          { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1, offset: 0.7 },
          { transform: 'translate(0, 3px) scale(0.85)', opacity: 0 },
        ], 620, 'ease-out'));
      }
      later(380, () => { glint(ctx.slot); embers(x, y, { count: 8, spread: w * 0.5 }); });
      bossPlate(ctx, '🔶 EMBER SCALES', '#ff8a1f');
      sfx('shield', 0.7, 0.35);
    },
    // Armor: the kit's plates are dragon scales here, and they close into an overlapping shell of scale armor
    gimmick(ctx) {
      fire.armor(ctx, { n: 2, word: '+2 SCALES', plates: SCALE });
      const [x, y] = src(ctx), [w, h] = sizeOf(ctx.from, 200, 46), S = 24, n = clamp(Math.round(w / 20), 6, 12);
      later(430, () => {
        [-1, 1].forEach((row, ri) => {
          for (let i = 0; i < n; i++) later(i * 22 + ri * 40, () => {
            const sx = x - w / 2 + (i + 0.5) * (w / n), sy = y + row * (h / 2 + 4);
            fxAnimate(fxSpawn(sx, sy, { cls: 'fxr-svg fxvb-scale', html: SCALE, ms: 720, size: [S, S * 1.2] }), [
              { transform: `translate(0, ${row * -14}px) scale(0.3) rotate(${row < 0 ? 0 : 180}deg)`, opacity: 0 },
              { transform: `translate(0, 0) scale(1.1) rotate(${row < 0 ? 0 : 180}deg)`, opacity: 1, offset: 0.25 },
              { transform: `translate(0, 0) scale(1) rotate(${row < 0 ? 0 : 180}deg)`, opacity: 1, offset: 0.75 },
              { transform: `translate(0, ${row * 8}px) scale(1.1) rotate(${row < 0 ? 0 : 180}deg)`, opacity: 0 },
            ], 700, 'ease-out');
          });
        });
        later(300, () => { twinkles(x, y, w, h, 4, 'fxvb-twinkle fxvb-twinkle-gold'); embers(x, y, { count: 8, spread: w * 0.5 }); });
      });
    },
  };

  // ================= Supernova (x10, cleave, SUPER MOVE): a star forms over the victim and explodes =================
  CARD_FX['supernova'] = {
    // A star ignites on the card with blinding rays under a cosmic purple-gold sky
    land(ctx) {
      remember(ctx);
      const [x, y] = cardXY(ctx), [w, h] = winSize(ctx);
      const sky = fxSpawn(0, 0, { cls: 'fx-tint', ms: 1100, style: { background: VIG_COSMIC } });
      sky?.animate([{ opacity: 0 }, { opacity: 0.85, offset: 0.25 }, { opacity: 0.8, offset: 0.75 }, { opacity: 0 }], { duration: 1100, easing: 'ease-in-out', fill: 'forwards' });
      frame(ctx.win, '#ffd23f', 1000);
      twinkles(x, y, w * 1.2, h * 0.9, 6, 'fxvb-twinkle fxvb-twinkle-cosmic');
      later(180, () => {
        core(x, y, w * 1.4, 'sun', 520);
        const S = w * 1.1, st = fxSpawn(x, y, { cls: 'fxr-svg fxvb-star', html: STAR, ms: 860, size: [S, S] });
        fxAnimate(st, [
          { transform: 'scale(0.05) rotate(-90deg)', opacity: 0 },
          { transform: 'scale(1.3) rotate(0deg)', opacity: 1, offset: 0.2 },
          { transform: 'scale(1) rotate(10deg)', opacity: 1, offset: 0.4 },
          { transform: 'scale(1.06) rotate(35deg)', opacity: 1, offset: 0.8 },
          { transform: 'scale(0.4) rotate(60deg)', opacity: 0 },
        ], 840, 'ease-out');
        speedLines(x, y, { n: 12, r0: w * 0.3, r1: w * 1.1, cls: 'fxvb-ray', ms: 520, width: 5 });
        fxRing(x, y, { color: '#ffd23f', size: w * 1.8, width: 5, ms: 520 });
        later(90, () => fxRing(x, y, { color: '#b07cff', size: w * 2.3, width: 4, ms: 560 }));
        fxShake(ctx.panel, 7, 300);
        sfx('jackpot', 0.6, 0.25);
      });
      bossPlate(ctx, '🌟 SUPERNOVA', '#ffd23f');
    },
    // Cleave (before the hit): the kit's lava crack smashes any shields, and they boil away in a flash of starlight
    gimmick(ctx) {
      fire.smash(ctx, { word: 'VAPORIZED!' });
      const [tx, ty] = at(ctx), [w] = sizeOf(ctx.to, 200, 46);
      if (!ctx.blocked) { later(100, () => twinkles(tx, ty, w * 0.6, 40, 3, 'fxvb-twinkle fxvb-twinkle-cosmic')); return; }
      later(230, () => {
        core(tx, ty, 170, 'sun', 380);
        fxRing(tx, ty, { color: '#b07cff', size: 280, width: 5, ms: 480 });
        show(tx, ty, STAR, { cls: 'fxvb-starburst', size: [110, 110], ms: 420, from: 0.2, to: 1, rise: 0, spin: 60 });
      });
    },
    // Everything goes dark; a tiny star forms over the victim, soaking up light and trembling as it charges
    windup(ctx) {
      const [tx, ty] = at(ctx), crit = !!ctx.crit, [bw] = sizeOf(ctx.to, 200, 46), S = Math.min(110, bw * 0.6) * (crit ? 1.2 : 1);
      dim(VIG_VOID, crit ? 0.95 : 0.88, 470);
      const halo = fxSpawn(tx, ty, { cls: 'fxvb-halo', ms: 460, size: [S * 2.4, S * 2.4] });
      fxAnimate(halo, [{ transform: 'scale(0.1)', opacity: 0 }, { transform: 'scale(0.5)', opacity: 0.7, offset: 0.5 }, { transform: 'scale(1)', opacity: 1, offset: 0.9 }, { transform: 'scale(0.6)', opacity: 0 }], 450, 'ease-in');
      const st = fxSpawn(tx, ty, { cls: 'fxr-svg fxvb-star', html: STAR, ms: 470, size: [S, S] });
      const k = [];
      for (let i = 0; i <= 12; i++) {
        const t = i / 12, j = 1 + t * 5; // it trembles harder and harder as it grows
        k.push({ transform: `translate(${i % 2 ? j : -j}px, ${i % 3 ? -j * 0.6 : j * 0.6}px) scale(${0.08 + t * t * 0.95}) rotate(${t * 90}deg)`, opacity: i === 12 ? 1 : 0.4 + t * 0.6 });
      }
      fxAnimate(st, k, 440, 'linear');
      charge(tx, ty, { colors: ['#fff', '#ffd23f', '#b07cff', '#ff7ad9'], n: 16, r: S * 1.8, ms: 300, size: [4, 8] });
      later(160, () => charge(tx, ty, { colors: ['#fff6c8', '#ffd23f', '#b07cff'], n: 12, r: S * 1.3, ms: 250, size: [3, 6] }));
      later(20, () => sfx('jackpot', 0.4, 0.2));
      return wait(430);
    },
    // SUPERNOVA: a white-out, huge gold / purple / white rings, star rays, embers everywhere and the biggest shake in the game
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit, [bw] = sizeOf(ctx.to, 200, 46), k = Math.min(1.6, p);
      flash('#ffffff', 1);
      fxTint('#ffffff', { ms: 520, opacity: 0.95 });
      later(260, () => fxTint(VIG_COSMIC, { ms: 700, opacity: 0.8 }));
      core(tx, ty, 300 * p, 'sun', 560);
      later(40, () => core(tx, ty, 200 * p, 'white', 420));
      const big = Math.min(360, bw * 1.8) * k, st = fxSpawn(tx, ty, { cls: 'fxr-svg fxvb-star', html: STAR, ms: 760, size: [big, big] });
      fxAnimate(st, [{ transform: 'scale(0.2) rotate(0deg)', opacity: 1 }, { transform: 'scale(1.1) rotate(40deg)', opacity: 1, offset: 0.3 }, { transform: 'scale(1.6) rotate(80deg)', opacity: 0 }], 740, 'ease-out');
      ['#ffffff', '#ffd23f', '#b07cff', '#ff7ad9', '#fff6c8'].forEach((c, i) => later(i * 80, () => fxRing(tx, ty, { color: c, size: (200 + i * 140) * p, width: 14 - i * 2, ms: 620 + i * 40 })));
      speedLines(tx, ty, { n: 14, r0: 50, r1: 260 * k, cls: 'fxvb-ray', ms: 480, width: 6 });
      later(120, () => speedLines(tx, ty, { n: 8, r0: 80, r1: 320 * k, cls: 'fxr-line', ms: 420, width: 3 }));
      fxParticles(tx, ty, { count: 24, colors: ['#fff', '#fff3a0', '#ffd23f', '#ff9a1f', '#b07cff', '#ff7ad9'], size: [4, 9], spread: 320 * k, gravity: 40, ms: 900 });
      later(180, () => embers(tx, ty, { count: 16, spread: 260 * k, cone: 360, rise: 60 }));
      later(260, () => twinkles(tx, ty, bw * 1.6, 200, 6, 'fxvb-twinkle fxvb-twinkle-cosmic'));
      jolt(ctx.to, [{ transform: 'none' }, { transform: 'scale(1.12)', offset: 0.15 }, { transform: 'translateY(6px) scale(0.94)', offset: 0.4 }, { transform: 'scale(1.03)', offset: 0.7 }, { transform: 'none' }], 520);
      stamp(ctx, crit ? 'HYPERNOVA!!!' : 'SUPERNOVA!!!', { dy: 8, kind: 'sun fxvb-nova', size: crit ? 44 : Math.min(46, 32 + 7 * p), rotate: -4, ms: 1200, star: '#fff6a0' });
      fxShake(ctx.panel, Math.min(44, 26 * p), 720);
      fxShake(ctx.to, 20, 480);
      later(300, () => fxShake(ctx.panel, 18, 360));  // aftershocks
      later(560, () => fxShake(ctx.panel, 9, 260));
      haptic(crit ? 220 : 180);
    },
  };

  // ================= Dragon Roar (x5, stun): a roar so loud it terrifies =================
  CARD_FX['dragon-roar'] = {
    // The dragon's jaws gape open on the card and sound waves ripple out of it
    land(ctx) {
      remember(ctx);
      const [x, y] = cardXY(ctx), [w, h] = winSize(ctx), flip = at(ctx)[0] < x, W = w * 1.3, hy = y - h * 0.05;
      frame(ctx.win, '#ffd23f', 900);
      roarHead(x, hy, W, { flip, ms: 1000, openAt: 260, rise: 40 });
      const m = mouthOf(x, hy, W, flip), dir = flip ? -1 : 1;
      [300, 420, 540].forEach((t, i) => later(t, () => {
        soundWave(m, [m[0] + dir * w * 1.1, m[1] - 10 + i * 10], { ms: 460, from: 0.4, to: 1.6 + i * 0.2, size: 50 });
        soundWave([x, y], [x - dir * w * 0.9, y], { ms: 420, from: 0.3, to: 1.2, size: 44, cls: 'fxvb-wave fxvb-wave-dim' });
        fxShake(ctx.panel, 7 - i * 2, 160);
      }));
      later(300, () => { fxRing(x, y, { color: '#ffd23f', size: w * 1.8, width: 5, ms: 480 }); sfx('eagle', 0.45, 0.35); }); // ROAR
      later(330, () => slam(x, y - h * 0.34, 'ROAR!', { kind: 'fire', size: 26, rotate: -8, ms: 650 }));
      bossPlate(ctx, '🔊 DRAGON ROAR', '#ffd23f');
    },
    // A roaring head over the dragon: shockwaves roll from its jaws to the victim, and the screen shakes
    windup(ctx) {
      const from = src(ctx), [tx, ty] = at(ctx), [, fh] = sizeOf(ctx.from, 200, 46), [, bh] = sizeOf(ctx.to, 200, 46), s = ctx.crit ? 1.2 : 1;
      const W = 96 * s, hx = from[0], hy = from[1] - fh * 0.5 - W * 0.22, { flip, tilt } = aimOf([hx, hy], [tx, ty]);
      roarHead(hx, hy, W, { flip, tilt, ms: 700, openAt: 120, rise: 26 });
      const m = mouthOf(hx, hy, W, flip, tilt, true);
      dim(VIG.ash, ctx.crit ? 0.7 : 0.5, 440);
      for (let i = 0; i < 4; i++) later(100 + i * 60, () => {
        soundWave(m, [tx, ty], { ms: 300 - i * 20, from: 0.5, to: (bh * 2.4 / 60) * s, size: 60 });
        fxRing(m[0], m[1], { color: i % 2 ? '#fff' : '#ffd23f', size: 90, width: 4, ms: 300 });
      });
      later(100, () => { fxShake(ctx.panel, 10 * s, 380); sfx('eagle', 0.4, 0.35); });
      return wait(410);
    },
    // The blast hits: shockwave rings, rays and the victim trembling
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), crit = !!ctx.crit, d = dirOf(src(ctx), [tx, ty]);
      core(tx, ty, 170 * p, 'ash', 420);
      for (let i = 0; i < 3; i++) later(i * 80, () => fxRing(tx, ty, { color: ['#ffffff', '#ffd23f', '#ff6a00'][i], size: (160 + i * 90) * p, width: 9 - i * 2, ms: 520 }));
      for (let i = 0; i < 3; i++) later(i * 50, () => soundWave([tx - d.ux * 20, ty - d.uy * 20], [tx + d.ux * 120, ty + d.uy * 120], { ms: 360, from: 1, to: 3, size: 60 }));
      speedLines(tx, ty, { n: 10, r0: 50, r1: 170 * Math.min(1.4, p), cls: 'fxr-line', width: 4 });
      fxParticles(tx, ty, { count: 10, colors: ['#fff', '#ffd23f', '#ff9a1f'], size: [3, 6], spread: 140 * p, angle: d.ang, cone: 120, ms: 560 });
      shiver(ctx.to, 7, 700);
      knock(ctx.to, src(ctx), 14, 300);
      stamp(ctx, crit ? 'MEGA ROAAAR!!' : 'ROAAAR!', { kind: 'fire fxvb-dragon', size: crit ? 44 : Math.min(52, 32 + 10 * p), rotate: fxRand(-6, 6), ms: 950, star: crit ? '#ffd23f' : null });
      fxShake(ctx.panel, Math.min(26, 14 * p), 520);
      fxTint(VIG.ash, { ms: 500, opacity: 0.4 });
      haptic(crit ? 110 : 70);
    },
    // Stun (terrified): the kit's daze with sweat drops for stars; darkness closes in, the dragon's eyes glow behind
    // the victim, and it shakes with fear
    gimmick(ctx) {
      fire.daze(ctx, { word: 'TERRIFIED!', stars: i => ['💦', '😱', '💧', '💦', '❗'][i % 5] });
      const [x, y] = at(ctx), [w, h] = sizeOf(ctx.to, 200, 46);
      const dark = fxSpawn(innerWidth / 2, innerHeight / 2, { cls: 'fxvb-dark', ms: 1200, size: [innerWidth * 1.2, innerHeight * 1.2] });
      fxAnimate(dark, [{ transform: 'scale(1.8)', opacity: 0 }, { transform: 'scale(1.15)', opacity: 0.85, offset: 0.4 }, { transform: 'scale(1)', opacity: 0.9, offset: 0.75 }, { transform: 'scale(1.3)', opacity: 0 }], 1200, 'ease-out');
      const ew = Math.min(200, w * 1.05), eyes = fxSpawn(x, y - h * 0.5 - 50, { cls: 'fxr-svg fxvb-eyes', html: EYES, ms: 1000, size: [ew, ew * 0.3] });
      fxAnimate(eyes, [
        { transform: 'scale(1, 0.05)', opacity: 0 },
        { transform: 'scale(1, 1)', opacity: 1, offset: 0.25 },
        { transform: 'scale(1, 0.1)', opacity: 1, offset: 0.5 },
        { transform: 'scale(1.05, 1.1)', opacity: 1, offset: 0.6 },
        { transform: 'scale(1.1, 1)', opacity: 1, offset: 0.85 },
        { transform: 'scale(1.2, 0.05)', opacity: 0 },
      ], 1000, 'ease-in-out');
      [100, 380, 640].forEach(t => later(t, () => fxParticles(x + fxRand(-w * 0.3, w * 0.3), y - h * 0.3, { count: 4, cls: 'fxvb-sweat', colors: ['#7ac8ff'], size: [6, 9],
        spread: 60, gravity: 90, angle: -90, cone: 160, ms: 620, spin: 0 })));
      jolt(ctx.to, [0, -1, 1, -1, 1, -1, 1, -0.8, 0.8, -0.5, 0.5, 0].map(v => ({ transform: `translate(${v * 5}px, ${Math.abs(v) * 1.5}px)` })), 1000, { delay: 100 });
      sfx('stun', 0.5, 0.4);
    },
  };
})();
