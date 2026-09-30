// Card effects: the Ancient Leviathan's attacks (the Swamp Serpent's 2nd evolution, see progression.js).
// Tidal Crush: a towering wave curls up behind you and comes crashing down. Abyssal Maw: the screen sinks into
// the deep, a lure glows in the dark, and a colossal maw rises from below and snaps shut on you.
// Styles live in css/fx/leviathan.css (prefix fxl-).
(() => {
  const later = (ms, fn) => setTimeout(() => { try { fn(); } catch (e) { console.warn('leviathan fx', e); } }, ms);
  const at = ctx => ctx.toXY || fxPoint(ctx.to), src = ctx => ctx.fromXY || fxPoint(ctx.from);
  const sizeOf = (el, dw = 200, dh = 46) => { const r = el?.getBoundingClientRect?.(); return r && r.width ? [r.width, r.height] : [dw, dh]; };
  const pow = ctx => Math.max(0.8, Math.min(2.2, 0.8 + (ctx.dmg || 0) / 40 + (ctx.crit ? 0.45 : 0)));
  const vig = c => `radial-gradient(ellipse at 50% 50%, #0000 30%, ${c} 100%)`;
  function stamp(x, y, text, size = 40, rot = -6, ms = 900) {
    const el = fxSpawn(x, y, { cls: 'fxl-stamp', html: text, ms: ms + 40, style: { fontSize: size + 'px' } });
    return fxAnimate(el, [
      { transform: `scale(3) rotate(${rot - 14}deg)`, opacity: 0 },
      { transform: `scale(0.86) rotate(${rot}deg)`, opacity: 1, offset: 0.13 },
      { transform: `scale(1.08) rotate(${rot}deg)`, opacity: 1, offset: 0.22 },
      { transform: `scale(1) rotate(${rot}deg)`, opacity: 1, offset: 0.74 },
      { transform: `translate(0, -22px) scale(1.1) rotate(${rot}deg)`, opacity: 0 },
    ], ms, 'ease-out');
  }
  const stampAt = (ctx, dx = 0) => { const [x, y] = at(ctx), [, h] = sizeOf(ctx.to); return [x + dx, y + h * 0.5 + 18]; };
  function frame(win, color, ms = 800) {
    if (!win) return;
    const [x, y] = fxPoint(win), [w, h] = sizeOf(win, 120, 180);
    const el = fxSpawn(x, y, { cls: 'fxl-frame', ms, size: [w + 10, h + 10], vars: { '--c': color } });
    fxAnimate(el, [{ transform: 'scale(1.18)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: 0.18 }, { transform: 'scale(1.08)', opacity: 0 }], ms);
  }
  function plate(ctx, text, color) {
    if (!ctx.win) return;
    const [x, y] = fxPoint(ctx.win), [, h] = sizeOf(ctx.win, 120, 180);
    const el = fxSpawn(x, y + h * 0.3, { cls: 'fxl-plate', html: text, ms: 1000, vars: { '--c': color } });
    fxAnimate(el, [{ transform: 'translate(0, 16px) scale(0.3)', opacity: 0 }, { transform: 'scale(1.15)', opacity: 1, offset: 0.16 },
      { transform: 'scale(1)', opacity: 1, offset: 0.8 }, { transform: 'translate(0, -10px)', opacity: 0 }], 1000);
  }
  const droplets = (x, y, n, spread, extra = {}) => fxParticles(x, y, { count: n, cls: 'fxl-drop', colors: ['#bfefff', '#7ad7ff', '#ffffff', '#3aa0ff'],
    size: [6, 12], spread, gravity: 160, angle: -90, cone: 200, ms: 800, spin: 0, ...extra });
  const bubbles = (x, y, n, spread, ms = 1000) => fxParticles(x, y, { count: n, cls: 'fxl-bubble', colors: ['#dff6ff'], size: [6, 14],
    spread, gravity: -140, angle: -90, cone: 120, ms, spin: 0 });
  function foam(x, y, w, n = 6) {
    for (let i = 0; i < n; i++) {
      const el = fxSpawn(x + (i / (n - 1) - 0.5) * w, y + fxRand(-8, 8), { cls: 'fxl-foam', ms: 760, size: [fxRand(34, 56), fxRand(24, 36)] });
      fxAnimate(el, [{ transform: 'scale(0.3)', opacity: 0 }, { transform: `translate(0, -10px) scale(1.1)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${fxRand(-20, 20)}px, -30px) scale(1.5)`, opacity: 0 }], 740, 'ease-out');
    }
  }

  // ---------- Graphics ----------
  // A towering curling wave (the crest curls to the LEFT), with foam along the lip
  const WAVE = '<svg viewBox="0 0 200 220"><defs><linearGradient id="fxlW" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#7ad7ff"/><stop offset=".45" stop-color="#1f7ad6"/><stop offset="1" stop-color="#0a2a6a"/></linearGradient></defs>' +
    '<path d="M200 220 L200 60 C190 18 150 2 110 6 C70 10 38 34 30 70 C26 90 40 108 60 106 C78 104 84 86 74 76 C96 72 120 88 124 120 C128 160 110 190 90 220 Z" fill="url(#fxlW)" stroke="#06205a" stroke-width="5" stroke-linejoin="round"/>' +
    '<path d="M186 70 C176 36 144 22 112 24 C84 26 60 42 52 64" fill="none" stroke="#bfefff" stroke-width="6" stroke-linecap="round" opacity=".8"/>' +
    '<path d="M160 120 C166 150 160 180 150 210 M140 140 C144 160 140 185 134 205" fill="none" stroke="#5ab8ff" stroke-width="5" stroke-linecap="round" opacity=".6"/>' +
    '<g fill="#fff">' + [[36, 66, 9], [50, 50, 8], [68, 36, 9], [90, 24, 8], [114, 18, 9], [140, 20, 8], [30, 84, 7], [62, 100, 7]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('') + '</g></svg>';
  // A splash crown
  const SPLASH = '<svg viewBox="0 0 160 110"><path d="M10 104 C30 70 22 40 34 22 C40 46 50 60 56 64 C60 36 70 14 80 2 C90 14 100 36 104 64 C110 60 120 46 126 22 C138 40 130 70 150 104 Z" ' +
    'fill="#7ad7ff" stroke="#0a3a8a" stroke-width="5" stroke-linejoin="round"/><path d="M44 96 C52 76 60 72 66 74 M94 74 C100 72 108 76 116 96" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>' +
    '<circle cx="34" cy="10" r="6" fill="#bfefff"/><circle cx="80" cy="-8" r="7" fill="#bfefff"/><circle cx="126" cy="10" r="6" fill="#bfefff"/></svg>';
  // The abyssal maw: upper and lower jaws, rows of needle teeth, drawn as two halves that snap together
  const JAW = up => `<svg viewBox="0 0 240 110"><path d="${up ? 'M4 104 C20 30 80 4 120 4 C160 4 220 30 236 104 Z' : 'M4 6 C20 80 80 106 120 106 C160 106 220 80 236 6 Z'}" fill="#0b1a33" stroke="#030814" stroke-width="5" stroke-linejoin="round"/>` +
    `<path d="${up ? 'M14 100 C40 50 90 26 120 26 C150 26 200 50 226 100' : 'M14 10 C40 60 90 84 120 84 C150 84 200 60 226 10'}" fill="none" stroke="#1d3a66" stroke-width="6"/>` +
    '<g fill="#eaf6ff" stroke="#8ab0d8" stroke-width="1.5" stroke-linejoin="round">' + Array.from({ length: 11 }, (_, i) => {
      const x = 16 + i * 20.8, len = 22 + (i % 2 ? 0 : 10) - Math.abs(i - 5) * 1.5;
      return up ? `<path d="M${x - 8} 104 L${x} ${104 + len} L${x + 8} 104 Z"/>` : `<path d="M${x - 8} 6 L${x} ${6 - len} L${x + 8} 6 Z"/>`;
    }).join('') + '</g>' + (up ? '<ellipse cx="70" cy="60" rx="12" ry="7" fill="#7af7ff" opacity=".9"/><ellipse cx="170" cy="60" rx="12" ry="7" fill="#7af7ff" opacity=".9"/>' +
      '<circle cx="70" cy="60" r="3.5" fill="#001"/><circle cx="170" cy="60" r="3.5" fill="#001"/>' : '') + '</svg>';
  // An anglerfish lure glowing in the dark
  const LURE = '<svg viewBox="0 0 60 90"><path d="M30 90 C30 60 20 40 30 22" fill="none" stroke="#2a4a7a" stroke-width="4" stroke-linecap="round"/>' +
    '<circle cx="30" cy="16" r="13" fill="#b6fff6"/><circle cx="30" cy="16" r="7" fill="#ffffff"/></svg>';

  // ================= Tidal Crush (x8, cleave): a towering wave curls over you and crashes down =================
  CARD_FX['tidal-crush'] = {
    land(ctx) {
      const [x, y] = fxPoint(ctx.slot || ctx.win), [w, h] = sizeOf(ctx.win, 120, 180);
      frame(ctx.win, '#3aa0ff');
      fxTint(vig('#06205add'), { ms: 900, opacity: 0.6 });
      // A little wave rises out of the card, curls and spills over it
      const wv = fxSpawn(x, y + h * 0.1, { cls: 'fxl-svg', html: WAVE, ms: 900, size: [w * 1.1, w * 1.2], style: { transformOrigin: '50% 100%' } });
      fxAnimate(wv, [{ transform: 'translate(0, 40px) scale(0.3, 0.1)', opacity: 0 }, { transform: 'translate(0, 0) scale(1, 1.1)', opacity: 1, offset: 0.4 },
        { transform: 'translate(-10px, 6px) scale(1, 0.9) rotate(-8deg)', opacity: 1, offset: 0.7 }, { transform: 'translate(-20px, 30px) scale(1.1, 0.4) rotate(-14deg)', opacity: 0 }], 900, 'ease-out');
      later(560, () => { droplets(x, y + h * 0.2, 12, 90); foam(x, y + h * 0.3, w, 4); });
      bubbles(x, y + h * 0.3, 8, 50);
      plate(ctx, '🌊 TIDAL CRUSH', '#3aa0ff');
      sfx('leech', 0.6, 0.5); // a deep slosh
    },
    // Cleave: the undertow rips any shields away in a whirlpool
    gimmick(ctx) {
      const [tx, ty] = at(ctx), [w, h] = sizeOf(ctx.to);
      const pool = fxSpawn(tx, ty, { cls: 'fxl-whirl', ms: 800, size: [w * 1.1, w * 1.1] });
      fxAnimate(pool, [{ transform: 'scale(0.2) rotate(0deg)', opacity: 0 }, { transform: 'scale(1) rotate(260deg)', opacity: 1, offset: 0.4 },
        { transform: 'scale(0.4) rotate(720deg)', opacity: 0 }], 800, 'ease-in');
      if (!ctx.blocked) return;
      later(250, () => {
        fxParticles(tx, ty, { count: 14, cls: 'fxl-shard', colors: ['#bcd8ff', '#6aa8ff', '#fff'], spread: 160, size: [9, 16], gravity: 120, ms: 700, spin: 540 });
        const [sx, sy] = stampAt(ctx, -20);
        stamp(sx, sy + 34, 'SWEPT AWAY!', 28, -5, 720);
        sfx('breaking', 1, 0.7);
      });
    },
    // The wave rises huge behind the victim, towers for a beat, then curls over and crashes down on them
    windup(ctx) {
      const [tx, ty] = at(ctx), [w] = sizeOf(ctx.to), s = ctx.crit ? 1.25 : 1;
      const W = Math.min(innerWidth * 0.9, Math.max(260, w * 1.6)) * s, H = W * 1.1;
      const wave = fxSpawn(tx + W * 0.18, ty - H * 0.35, { cls: 'fxl-svg fxl-bigwave', html: WAVE, ms: 520, size: [W, H], style: { transformOrigin: '70% 100%' } });
      if (!wave) return;
      fxShake(ctx.panel, 6, 420);
      later(40, () => { droplets(tx + W * 0.3, ty - H * 0.6, 10, 80, { gravity: 200 }); bubbles(tx, ty + 20, 6, 80, 600); });
      return fxAnimate(wave, [
        { transform: 'translate(0, 120px) scale(0.4, 0.2)', opacity: 0, easing: 'ease-out' },
        { transform: 'translate(0, 0) scale(1, 1)', opacity: 1, offset: 0.45, easing: 'ease-in-out' },
        { transform: 'translate(-6px, -10px) scale(1.02, 1.05)', opacity: 1, offset: 0.62, easing: 'cubic-bezier(.7,0,1,.5)' },
        { transform: 'translate(-60px, 60px) rotate(-38deg) scale(1.08, 0.9)', opacity: 1 },
      ], 420, 'linear').then(() => later(0, () => wave.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: 'forwards' })));
    },
    // SPLOOSH: a splash crown, a foam line, spray, water rings and a deep-blue wash
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), [w, h] = sizeOf(ctx.to);
      fxTint('#1f7ad6', { ms: 500, opacity: ctx.crit ? 0.5 : 0.38 });
      const sp = fxSpawn(tx, ty - 20 * p, { cls: 'fxl-svg', html: SPLASH, ms: 760, size: [170 * p, 120 * p], style: { transformOrigin: '50% 100%' } });
      fxAnimate(sp, [{ transform: 'scale(0.3, 0.1)', opacity: 0 }, { transform: 'scale(1.1, 1.15)', opacity: 1, offset: 0.3 },
        { transform: 'scale(1, 0.9)', opacity: 1, offset: 0.6 }, { transform: 'translate(0, 30px) scale(1.2, 0.3)', opacity: 0 }], 740, 'ease-out');
      droplets(tx, ty, Math.round(18 + 6 * p), 180 * p);
      foam(tx, ty + h * 0.4, w * 1.1, 7);
      bubbles(tx, ty, 10, 120 * p);
      for (let i = 0; i < 3; i++) later(i * 90, () => fxRing(tx, ty + h * 0.3, { color: ['#ffffff', '#7ad7ff', '#1f7ad6'][i], size: (200 + i * 110) * p, width: 9 - i * 2, ms: 600 }));
      const [sx, sy] = stampAt(ctx);
      stamp(sx, sy, ctx.crit ? 'TSUNAMI!!' : 'TIDAL CRUSH!', Math.min(56, 32 + 12 * p));
      fxShake(ctx.panel, Math.min(30, 16 * p), 560); fxShake(ctx.to, 16, 440);
      if (typeof haptic === 'function') haptic(100);
    },
  };

  // ================= Abyssal Maw (x5, lifesteal): something huge rises from the deep and swallows you =================
  CARD_FX['abyssal-maw'] = {
    land(ctx) {
      const [x, y] = fxPoint(ctx.slot || ctx.win), [w, h] = sizeOf(ctx.win, 120, 180);
      frame(ctx.win, '#7af7ff');
      // The card sinks into black water; a lure blinks on in the dark, then two eyes open behind it
      const dark = fxSpawn(x, y, { cls: 'fxl-abyss', ms: 1100, size: [w + 6, h + 6] });
      fxAnimate(dark, [{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], 1100);
      const lure = fxSpawn(x, y, { cls: 'fxl-svg fxl-lure', html: LURE, ms: 1000, size: [30, 45] });
      fxAnimate(lure, [{ transform: 'translate(0, 30px) scale(0.4)', opacity: 0 }, { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0.25 },
        { transform: 'translate(-6px, -4px) scale(1)', opacity: 0.4, offset: 0.45 }, { transform: 'translate(6px, 0) scale(1.1)', opacity: 1, offset: 0.65 },
        { transform: 'translate(0, -10px) scale(0.9)', opacity: 0 }], 1000);
      later(450, () => [-1, 1].forEach(sd => fxPop(x + sd * 16, y - h * 0.22, '<i class="fxl-eye"></i>', { size: 14, ms: 600, rise: 0 })));
      bubbles(x, y + h * 0.3, 10, 50, 1100);
      plate(ctx, '🦈 ABYSSAL MAW', '#7af7ff');
      sfx('big_hit', 0.4, 0.5); // a low rumble from the depths
    },
    // The screen sinks into the deep; a lure glows before the victim; the maw rises from below and gapes open
    windup(ctx) {
      const [tx, ty] = at(ctx), [w] = sizeOf(ctx.to), s = ctx.crit ? 1.2 : 1;
      const deep = fxSpawn(0, 0, { cls: 'fx-tint', ms: 900, style: { background: vig('#000814f2') } });
      deep?.animate([{ opacity: 0 }, { opacity: 0.9, offset: 0.5 }, { opacity: 0.9, offset: 0.8 }, { opacity: 0 }], { duration: 900, fill: 'forwards' });
      const lure = fxSpawn(tx, ty - 70, { cls: 'fxl-svg fxl-lure', html: LURE, ms: 480, size: [40, 60] });
      fxAnimate(lure, [{ transform: 'translate(0, 40px) scale(0.5)', opacity: 0 }, { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0.4 },
        { transform: 'translate(0, -6px) scale(1.1)', opacity: 1, offset: 0.8 }, { transform: 'scale(0.4)', opacity: 0 }], 460);
      bubbles(tx, ty + 60, 12, 120, 800);
      const W = Math.min(innerWidth * 0.95, Math.max(320, w * 2.2)) * s, H = W * 110 / 240;
      const gap = H * 0.9;
      const jaws = [true, false].map(up => fxSpawn(tx, ty + (up ? -gap * 0.5 : gap * 0.5), { cls: 'fxl-svg fxl-jaw', html: JAW(up), ms: 900, size: [W, H] }));
      jaws.forEach((j, i) => fxAnimate(j, [{ transform: `translate(0, ${160 + i * 60}px) scale(0.6)`, opacity: 0 },
        { transform: `translate(0, ${i ? 10 : -10}px) scale(1)`, opacity: 1, offset: 0.7 }, { transform: 'translate(0, 0) scale(1.02)', opacity: 1 }], 380, 'ease-out'));
      fxShake(ctx.panel, 5, 380);
      ctx._jaws = jaws; lastJaws = { jaws, gap, t: performance.now() };
      return new Promise(r => setTimeout(r, 400));
    },
    // SNAP: both jaws slam shut on the victim, then sink back into the dark
    impact(ctx) {
      const [tx, ty] = at(ctx), p = pow(ctx), J = lastJaws && performance.now() - lastJaws.t < 1200 ? lastJaws : null;
      if (J) J.jaws.forEach((j, i) => { if (!j) return; const up = i === 0, d = J.gap * 0.5;
        fxAnimate(j, [{ transform: 'translate(0, 0)', opacity: 1 }, { transform: `translate(0, ${up ? d * 0.85 : -d * 0.85}px) scale(1.04)`, opacity: 1, offset: 0.2 },
          { transform: `translate(0, ${up ? d * 0.8 : -d * 0.8}px)`, opacity: 1, offset: 0.6 }, { transform: `translate(0, ${up ? d * 0.8 + 40 : -d * 0.8 + 80}px) scale(0.9)`, opacity: 0 }], 480, 'cubic-bezier(.2,1.4,.4,1)'); });
      fxTint(vig('#001a3aee'), { ms: 700, opacity: 0.7 });
      later(60, () => {
        fxRing(tx, ty, { color: '#7af7ff', size: 180 * p, width: 7, ms: 460 });
        fxRing(tx, ty, { color: '#0a2a6a', size: 280 * p, width: 12, ms: 560 });
        bubbles(tx, ty, Math.round(14 + 4 * p), 140 * p);
        fxParticles(tx, ty, { count: 8, colors: ['#7af7ff', '#ffffff'], html: () => '✦', spread: 120 * p, size: [6, 10], ms: 600 });
        const [sx, sy] = stampAt(ctx);
        stamp(sx, sy, ctx.crit ? 'SWALLOWED WHOLE!!' : 'DEVOURED!', ctx.crit ? 36 : Math.min(54, 32 + 12 * p), 5);
        fxShake(ctx.panel, Math.min(26, 14 * p), 480); fxShake(ctx.to, 14, 400);
        sfx('bite', 0.7, 1);
        if (typeof haptic === 'function') haptic(90);
      });
    },
    // Lifesteal: glowing deep-sea wisps and bubbles drift back into the Leviathan
    gimmick(ctx) {
      const a = at(ctx), b = src(ctx);
      for (let i = 0; i < 9; i++) later(i * 45, () => fxFly(a, [b[0] + fxRand(-24, 24), b[1] + fxRand(-12, 12)],
        { html: i % 3 ? '<i class="fxl-wisp"></i>' : '<i class="fxl-bubble-i"></i>', cls: 'fxl-wisp-fly', ms: 460, arc: fxRand(-110, 110), easing: 'ease-in-out' }));
      later(500, () => { fxRing(b[0], b[1], { color: '#7af7ff', size: 170, width: 6 }); bubbles(b[0], b[1], 8, 70); });
    },
  };
  let lastJaws = null;
})();
