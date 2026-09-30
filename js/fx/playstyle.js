// Card effects: the playstyle cards (see js/card-fx.js).
// Eagle Talon, Focus Croak, Venom Fang, Toxic Cloud, Shell Bash, Bark Armor, Buzz Saw, Mirror Frog,
// Lotus Bloom, Spring Rain, Gold Rush and Pickpocket, plus the gimmicks they bring (focus, plague, bash,
// armor, lifesteal, regen, loot, steal). Each card gets a land flourish on the wheel, a signature windup,
// and a comic-book impact that scales with power(): crits, huge hits and later combo strikes hit harder.
(() => {
  // ---------- shared helpers ----------
  const later = (ms, fn) => setTimeout(() => { try { fn(); } catch (e) { console.warn('playstyle fx failed', e); } }, ms);
  const landXY = ctx => fxPoint(ctx.slot || ctx.win);
  const fromXY = ctx => ctx.fromXY || fxPoint(ctx.from);
  const toXY = ctx => ctx.toXY || fxPoint(ctx.to);
  function dirOf(a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    return { dx, dy, len, ux: dx / len, uy: dy / len, nx: -dy / len, ny: dx / len, ang: Math.atan2(dy, dx) * 180 / Math.PI };
  }
  function power(ctx) {
    const share = ctx.defender?.maxHp ? Math.min(0.8, (ctx.dmg || 0) / ctx.defender.maxHp * 2) : 0;
    return 1 + (ctx.big ? 0.6 : 0) + (ctx.crit ? 0.8 : 0) + Math.min(3, ctx.strike || 0) * 0.3 + share;
  }
  // Short WAAPI jolt on a battle element (no fill, so it snaps back)
  const jolt = (el, frames, ms, extra = {}) => { try { el?.animate?.(frames, { duration: ms, easing: 'ease-out', ...extra }); } catch (e) {} };
  const slotFace = ctx => ctx.slot?.querySelector?.('.card-face');
  const faceJiggle = (ctx, frames, ms = 340) => jolt(slotFace(ctx), frames, ms, { delay: 480 });
  const recoil = (el, d, px = 14) => jolt(el, [{ transform: 'translate(0,0)' }, { transform: `translate(${d.ux * px}px, ${d.uy * px}px) rotate(${d.ux > 0 ? 3 : -3}deg)` },
    { transform: `translate(${-d.ux * px * 0.3}px, 0)` }, { transform: 'translate(0,0)' }], 320);

  // Spiky comic starburst behind stamps
  function starSvg(fill, ink) {
    const pts = [];
    for (let i = 0; i < 28; i++) {
      const r = i % 2 ? fxRand(28, 34) : fxRand(42, 49), a = i / 28 * Math.PI * 2;
      pts.push((50 + Math.cos(a) * r).toFixed(1) + ',' + (50 + Math.sin(a) * r).toFixed(1));
    }
    return `<svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none"><polygon points="${pts.join(' ')}" ` +
      `fill="${fill}" stroke="${ink}" stroke-width="3.5" stroke-linejoin="round"/></svg>`;
  }
  // Comic stamp ("TALON!") that slams in from huge, settles, then drifts off
  function stamp(x, y, text, { color = '#ffd23f', ink = '#3a0a0a', size = 36, rot = fxRand(-12, 12), ms = 820, star = null } = {}) {
    if (star) {
      const w = Math.max(size * 2.6, text.length * size * 0.66);
      const s = fxSpawn(x, y, { cls: 'fxy-star', html: starSvg(star, ink), ms, size: [w, w * 0.78] });
      fxAnimate(s, [
        { transform: `scale(0.2) rotate(${rot - 30}deg)`, opacity: 0 },
        { transform: `scale(1.15) rotate(${rot}deg)`, opacity: 1, offset: 0.16 },
        { transform: `scale(1) rotate(${rot + 5}deg)`, opacity: 1, offset: 0.7 },
        { transform: `scale(1.3) rotate(${rot + 10}deg)`, opacity: 0 },
      ], ms, 'ease-out');
    }
    const el = fxSpawn(x, y, { cls: 'fxy-stamp', html: text, ms, vars: { c: color, ink }, style: { fontSize: size + 'px' } });
    return fxAnimate(el, [
      { transform: `scale(2.8) rotate(${rot - 8}deg)`, opacity: 0 },
      { transform: `scale(0.86) rotate(${rot}deg)`, opacity: 1, offset: 0.13 },
      { transform: `scale(1.08) rotate(${rot}deg)`, opacity: 1, offset: 0.22 },
      { transform: `scale(1) rotate(${rot}deg)`, opacity: 1, offset: 0.72 },
      { transform: `translate(0, -26px) scale(1.06) rotate(${rot}deg)`, opacity: 0 },
    ], ms, 'ease-out');
  }
  // Small bubbly caption that pops up and floats away
  function cute(x, y, text, { c = '#fff', ink = '#000', size = 20, ms = 760, rot = fxRand(-8, 8) } = {}) {
    const el = fxSpawn(x, y, { cls: 'fxy-cute', html: text, ms, vars: { c, ink }, style: { fontSize: size + 'px' } });
    return fxAnimate(el, [
      { transform: `translate(0, 12px) scale(0.3) rotate(${rot}deg)`, opacity: 0 },
      { transform: `translate(0, -4px) scale(1.2) rotate(${rot}deg)`, opacity: 1, offset: 0.22 },
      { transform: `scale(1) rotate(${rot}deg)`, opacity: 1, offset: 0.7 },
      { transform: `translate(0, -22px) scale(1) rotate(${rot}deg)`, opacity: 0 },
    ], ms, 'ease-out');
  }
  // Manga impact lines shooting outward
  function burstLines(x, y, { n = 10, r0 = 20, r1 = 90, len = 34, thick = 4, color = '#fff', ms = 380 } = {}) {
    const rot = fxRand(0, 360);
    for (let i = 0; i < n; i++) {
      const a = rot + i * 360 / n + fxRand(-8, 8);
      const el = fxSpawn(x, y, { cls: 'fxy-line', ms: ms + 40, size: [len * fxRand(0.7, 1.3), thick], vars: { lc: color } });
      fxAnimate(el, [
        { transform: `rotate(${a}deg) translateX(${r0}px) scaleX(0.2)`, opacity: 1 },
        { transform: `rotate(${a}deg) translateX(${(r0 + r1) / 2}px) scaleX(1)`, opacity: 1, offset: 0.35 },
        { transform: `rotate(${a}deg) translateX(${r1}px) scaleX(0.4)`, opacity: 0 },
      ], ms, 'cubic-bezier(.1,.8,.3,1)');
    }
  }
  // Speed lines rushing from a toward b
  function speedLines(a, b, { n = 5, color = '#fff', width = 26, ms = 260 } = {}) {
    const d = dirOf(a, b);
    for (let i = 0; i < n; i++) {
      const off = fxRand(-width, width), t0 = fxRand(0, 0.25);
      const el = fxSpawn(a[0] + d.dx * t0 + d.nx * off, a[1] + d.dy * t0 + d.ny * off, { cls: 'fxy-line', ms: ms + 40, size: [fxRand(40, 80), 3], vars: { lc: color } });
      fxAnimate(el, [
        { transform: `rotate(${d.ang}deg) translateX(0) scaleX(0.3)`, opacity: 0.9 },
        { transform: `rotate(${d.ang}deg) translateX(${d.len * 0.6}px) scaleX(1.3)`, opacity: 0 },
      ], ms * fxRand(0.8, 1), 'ease-in');
    }
  }
  // A graphic that pops in, holds (optionally spinning), then fades — for big art pieces
  function showArt(x, y, html, { cls = '', ms = 800, from = 0.3, to = 1, spin = 0, rise = 0 } = {}) {
    const el = fxSpawn(x, y, { cls: 'fxy-art ' + cls, html, ms });
    return fxAnimate(el, [
      { transform: `scale(${from}) rotate(0deg)`, opacity: 0 },
      { transform: `scale(${to * 1.12}) rotate(${spin * 0.25}deg)`, opacity: 1, offset: 0.2 },
      { transform: `scale(${to}) rotate(${spin * 0.8}deg)`, opacity: 1, offset: 0.75 },
      { transform: `translate(0, ${-rise}px) scale(${to * 0.9}) rotate(${spin}deg)`, opacity: 0 },
    ], ms, 'ease-out');
  }
  // Something arcs from a to b, with a trail
  const lob = (a, b, html, o = {}) => fxFly(a, b, { html, cls: 'fxy-proj ' + (o.cls || ''), ms: o.ms || 300, arc: o.arc ?? 0, spin: o.spin || 0,
    scale: o.scale || [1, 1], trail: o.trail || '', trailEvery: o.trailEvery || 30, easing: o.easing || 'ease-in' });

  // ---------- art ----------
  // Three curved talon slashes
  const CLAWS = c => '<svg viewBox="0 0 120 120" width="100%" height="100%"><g fill="none" stroke-linecap="round">' +
    [18, 48, 78].map(x => `<path d="M${x} 10 Q${x + 22} 60 ${x + 8} 112" stroke="#fff" stroke-width="12"/><path d="M${x} 10 Q${x + 22} 60 ${x + 8} 112" stroke="${c}" stroke-width="6"/>`).join('') + '</g></svg>';
  // Crosshair reticle
  const RETICLE = '<svg viewBox="0 0 100 100" width="100%" height="100%"><g fill="none" stroke="#ff3b3b" stroke-width="5">' +
    '<circle cx="50" cy="50" r="34"/><circle cx="50" cy="50" r="14"/><path d="M50 4 V26 M50 74 V96 M4 50 H26 M74 50 H96"/></g>' +
    '<circle cx="50" cy="50" r="4" fill="#ff3b3b"/></svg>';
  // Fang with a venom drip
  const FANG = '<svg viewBox="0 0 60 90" width="60" height="90"><path d="M8 4 Q30 0 52 4 Q44 50 30 86 Q16 50 8 4 Z" fill="#fff8ec" stroke="#2a2a2a" stroke-width="4"/>' +
    '<path d="M22 10 Q28 40 30 70" stroke="#d8d0c0" stroke-width="4" fill="none"/><ellipse cx="30" cy="86" rx="6" ry="8" fill="#5fd13a" stroke="#1a4a08" stroke-width="2"/></svg>';
  // Bite marks
  const BITE = '<svg viewBox="0 0 100 60" width="100%" height="100%"><g fill="#8a1010">' +
    [14, 32, 50, 68, 86].map((x, i) => `<path d="M${x - 7} 4 L${x + 7} 4 L${x} ${i % 2 ? 22 : 28} Z"/><path d="M${x - 7} 56 L${x + 7} 56 L${x} ${i % 2 ? 38 : 32} Z"/>`).join('') + '</g></svg>';
  // Skull for plague
  const SKULL = '<svg viewBox="0 0 80 80" width="80" height="80"><path d="M40 6 C18 6 8 22 10 40 C11 50 18 54 20 58 L20 68 L60 68 L60 58 C62 54 69 50 70 40 C72 22 62 6 40 6 Z" fill="#d8ffb0" stroke="#1a4a08" stroke-width="4"/>' +
    '<circle cx="28" cy="38" r="8" fill="#1a4a08"/><circle cx="52" cy="38" r="8" fill="#1a4a08"/><path d="M36 52 L40 46 L44 52 Z" fill="#1a4a08"/>' +
    '<path d="M28 68 V60 M36 68 V60 M44 68 V60 M52 68 V60" stroke="#1a4a08" stroke-width="3"/></svg>';
  // Spiral shell
  const SHELL = '<svg viewBox="0 0 60 60" width="56" height="56"><path d="M30 6 C48 6 56 22 54 34 C52 48 40 56 28 54 C16 52 10 42 12 32 C14 24 22 20 28 22 C34 24 36 30 34 34 C32 38 26 38 25 34" ' +
    'fill="#f8d9b0" stroke="#8a4a1a" stroke-width="4" stroke-linecap="round"/><path d="M30 6 L28 22 M50 20 L36 28 M54 38 L38 36 M40 54 L34 40" stroke="#c07a3a" stroke-width="2.5"/></svg>';
  // Wooden bark plate
  const PLANK = '<svg viewBox="0 0 40 60" width="34" height="52"><rect x="3" y="3" width="34" height="54" rx="8" fill="#9a6a3a" stroke="#4a3010" stroke-width="4"/>' +
    '<path d="M12 8 Q16 30 11 52 M22 8 Q26 30 21 52 M31 10 Q33 30 30 50" stroke="#6a4020" stroke-width="2.5" fill="none"/><circle cx="20" cy="18" r="3" fill="#5fd13a"/></svg>';
  // Toothed gear
  const GEAR = '<svg viewBox="0 0 100 100" width="100%" height="100%"><g fill="#c0c8d0" stroke="#3a3f47" stroke-width="4">' +
    Array.from({ length: 10 }, (_, i) => `<rect x="44" y="2" width="12" height="20" rx="3" transform="rotate(${i * 36} 50 50)"/>`).join('') +
    '<circle cx="50" cy="50" r="34"/></g><circle cx="50" cy="50" r="12" fill="#3a3f47"/><circle cx="50" cy="50" r="5" fill="#ffd23f"/></svg>';
  // Mirror hand-mirror frame
  const MIRROR = '<svg viewBox="0 0 70 100" width="70" height="100"><rect x="30" y="62" width="10" height="34" rx="4" fill="#b07f00" stroke="#5a3e1b" stroke-width="3"/>' +
    '<ellipse cx="35" cy="36" rx="30" ry="34" fill="#bfe6ff" stroke="#b07f00" stroke-width="6"/><path d="M18 22 L30 12 M16 36 L40 14" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".85"/></svg>';
  // Lotus flower
  const LOTUS = c => `<svg viewBox="0 0 100 70" width="100%" height="100%"><g stroke="#a02a6a" stroke-width="2.5">` +
    `<path d="M50 62 C20 60 8 40 14 26 C28 30 40 44 50 62 Z" fill="${c}"/><path d="M50 62 C80 60 92 40 86 26 C72 30 60 44 50 62 Z" fill="${c}"/>` +
    `<path d="M50 62 C34 46 34 20 50 4 C66 20 66 46 50 62 Z" fill="#ffd0ea"/></g><ellipse cx="50" cy="62" rx="30" ry="6" fill="#3ca83c"/></svg>`;
  // Rain cloud
  const CLOUD = '<svg viewBox="0 0 120 70" width="120" height="70"><path d="M24 58 C8 58 6 38 20 34 C18 18 38 10 48 22 C54 6 82 6 86 26 C104 22 116 42 100 58 Z" ' +
    'fill="#dfeaff" stroke="#6a86b8" stroke-width="4"/><ellipse cx="46" cy="36" rx="14" ry="6" fill="#fff" opacity=".8"/></svg>';
  // Coin
  const COINART = s => `<svg viewBox="0 0 24 24" width="${s}" height="${s}"><circle cx="12" cy="12" r="11" fill="#e0a800"/><circle cx="12" cy="12" r="8" fill="#ffd23f" stroke="#b07f00" stroke-width="1.5"/>` +
    '<text x="12" y="16.5" text-anchor="middle" font-size="11" font-weight="bold" font-family="sans-serif" fill="#b07f00">$</text></svg>';
  // Pickaxe
  const PICK = '<svg viewBox="0 0 80 80" width="70" height="70"><rect x="36" y="18" width="8" height="58" rx="3" fill="#8a5a2a" stroke="#3a2010" stroke-width="3" transform="rotate(35 40 47)"/>' +
    '<path d="M8 22 Q40 0 72 22 Q40 12 8 22 Z" fill="#c0c8d0" stroke="#3a3f47" stroke-width="4" transform="rotate(35 40 20)"/></svg>';
  // Swag bag
  const BAG = '<svg viewBox="0 0 70 70" width="60" height="60"><path d="M22 18 Q35 26 48 18 L52 10 Q35 16 18 10 Z" fill="#a8916b" stroke="#4a3a20" stroke-width="3"/>' +
    '<path d="M18 22 Q4 58 20 64 Q35 70 50 64 Q66 58 52 22 Q35 30 18 22 Z" fill="#c9b28a" stroke="#4a3a20" stroke-width="4"/>' +
    '<text x="35" y="52" text-anchor="middle" font-size="22" font-weight="900" font-family="sans-serif" fill="#e0a800" stroke="#4a3a20" stroke-width="1.2">$</text></svg>';

  // ---------- Crit: Eagle Talon ----------
  CARD_FX['eagle-talon'] = {
    land(ctx) {
      const [x, y] = landXY(ctx);
      // The eagle swoops across the card, shedding feathers
      sfx('eagle', 1.15, 0.6);
      lob([x - 90, y - 40], [x + 90, y - 10], '🦅', { ms: 520, arc: -40, scale: [0.8, 1.3], trail: 'fxy-feather', trailEvery: 45, easing: 'ease-in-out' });
      later(260, () => {
        fxParticles(x, y, { count: 8, html: () => '🪶', colors: ['#fff'], spread: 70, size: [7, 11], gravity: 50, ms: 900, spin: 200 });
        cute(x, y - 44, 'SCREEE!', { c: '#fff6c2', ink: '#6a4000', size: 19 });
      });
      faceJiggle(ctx, [{ transform: 'rotate(0)' }, { transform: 'rotate(-6deg) scale(1.08)' }, { transform: 'rotate(4deg)' }, { transform: 'rotate(0)' }]);
    },
    // A steep dive from high above the foe, with speed lines. Resolves on contact.
    windup(ctx) {
      const b = toXY(ctx), a = [b[0] - 170, b[1] - 280], s = Math.min(3, ctx.strike || 0);
      sfx('eagle', 1 + s * 0.08);
      speedLines(a, b, { n: 6 + s, color: '#ffd23f', width: 30 });
      cute(a[0] + 40, a[1] + 40, 'DIVE!', { c: '#ffd23f', ink: '#6a4000', size: 18 + s * 2, ms: 500 });
      return lob(a, b, '🦅', { cls: 'fxy-xl', ms: Math.max(220, 320 - s * 30), arc: 40, scale: [0.6, 1.7], trail: 'fxy-feather', trailEvery: 35 });
    },
    impact(ctx) {
      const [x, y] = toXY(ctx), k = power(ctx), d = dirOf(fromXY(ctx), [x, y]);
      // Three talon slashes rake across, then a gold starburst crit stamp (this card always crits)
      const claws = fxSpawn(x, y, { cls: 'fxy-art', html: CLAWS('#ffd23f'), ms: 620, size: [130 * Math.min(1.6, k), 130 * Math.min(1.6, k)] });
      fxAnimate(claws, [{ transform: 'translate(-30px, -30px) scale(0.6) rotate(-20deg)', opacity: 0 },
        { transform: 'translate(0, 0) scale(1.1) rotate(-20deg)', opacity: 1, offset: 0.2 },
        { transform: 'translate(8px, 8px) scale(1) rotate(-20deg)', opacity: 1, offset: 0.7 }, { transform: 'scale(1) rotate(-20deg)', opacity: 0 }], 620);
      burstLines(x, y, { n: 12, r1: 110 * k, color: '#ffd23f', thick: 5 });
      fxRing(x, y, { color: '#ffd23f', size: 200 * k, width: 8 });
      later(60, () => stamp(x, y - 56, 'TALON CRIT!', { color: '#ffd23f', ink: '#5a2a00', size: 30 + k * 5, star: '#fff6c2' }));
      fxParticles(x, y, { count: 18, colors: ['#ffd23f', '#fff', '#ff9a3b'], html: i => i % 3 ? null : '✦', spread: 150 * k, size: [4, 9] });
      recoil(ctx.to, d, 12 + k * 4);
      if (k > 2) fxTint('#ffd23f', { opacity: 0.18, ms: 350 });
    },
  };

  // ---------- Crit: Focus Croak ----------
  CARD_FX['focus-croak'] = {
    land(ctx) {
      const [x, y] = landXY(ctx);
      showArt(x, y, RETICLE, { cls: 'fxy-reticle', ms: 700, from: 2.4, to: 0.9, spin: 90 });
      later(250, () => { fxRing(x, y, { color: '#ff3b3b', size: 130, width: 4 }); cute(x, y - 48, 'FOCUS...', { c: '#ffd0d0', ink: '#7a0a0a', size: 18 }); });
    },
  };
  GIMMICK_FX.focus = ctx => {
    // A reticle drops onto the foe and locks with a ping; your side glows red-gold
    const [x, y] = toXY(ctx), [fx, fy] = fromXY(ctx);
    const r = fxSpawn(x, y, { cls: 'fxy-art fxy-reticle', html: RETICLE, ms: 1000 });
    fxAnimate(r, [{ transform: 'scale(3) rotate(-120deg)', opacity: 0 }, { transform: 'scale(0.9) rotate(0deg)', opacity: 1, offset: 0.35 },
      { transform: 'scale(1.05)', opacity: 1, offset: 0.45 }, { transform: 'scale(1)', opacity: 1, offset: 0.8 }, { transform: 'scale(0.6)', opacity: 0 }], 1000);
    later(350, () => { fxRing(x, y, { color: '#ff3b3b', size: 150, width: 5 }); stamp(x, y - 60, 'LOCKED ON', { color: '#ff5d5d', ink: '#3a0000', size: 26 }); });
    fxRing(fx, fy, { color: '#ffd23f', size: 170, width: 6 });
    fxParticles(fx, fy, { count: 12, colors: ['#ffd23f', '#ff5d5d'], html: () => '✦', spread: 90, size: [5, 8], angle: -90, cone: 120 });
  };

  // ---------- Poison: Venom Fang ----------
  CARD_FX['venom-fang'] = {
    land(ctx) {
      const [x, y] = landXY(ctx);
      showArt(x, y - 6, FANG, { ms: 700, from: 0.4, to: 0.9 });
      sfx('poison', 1.2, 0.5);
      later(300, () => {
        fxParticles(x, y + 30, { count: 8, cls: 'fxy-goo', colors: ['#5fd13a', '#b4ff8a', '#2a7a10'], angle: 90, cone: 50, spread: 60, gravity: 70, size: [5, 9], spin: 0 });
        cute(x, y - 50, 'HISSS!', { c: '#b4ff8a', ink: '#1a4a08', size: 19 });
      });
    },
    // Twin fangs lunge at the foe, dripping venom
    windup(ctx) {
      const a = fromXY(ctx), b = toXY(ctx), s = Math.min(3, ctx.strike || 0);
      speedLines(a, b, { n: 4 + s, color: '#b4ff8a' });
      lob(a, [b[0] - 14, b[1]], FANG, { ms: 260, arc: -30, scale: [0.5, 0.9], trail: 'fxy-venom', trailEvery: 30 });
      return lob(a, [b[0] + 14, b[1]], FANG, { ms: 280, arc: 30, scale: [0.5, 0.9], trail: 'fxy-venom', trailEvery: 30 });
    },
    impact(ctx) {
      const [x, y] = toXY(ctx), k = power(ctx), venom = !!ctx.defender?.poison;
      sfx('bite', venom ? 0.85 : 1);
      const bite = fxSpawn(x, y, { cls: 'fxy-art', html: BITE, ms: 700, size: [120 * Math.min(1.5, k), 72 * Math.min(1.5, k)] });
      fxAnimate(bite, [{ transform: 'scaleY(2)', opacity: 0 }, { transform: 'scaleY(0.8)', opacity: 1, offset: 0.2 }, { transform: 'scaleY(1)', opacity: 1, offset: 0.7 }, { opacity: 0 }], 700);
      fxParticles(x, y, { count: venom ? 22 : 12, cls: 'fxy-goo', colors: ['#5fd13a', '#2a7a10', '#b4ff8a'], spread: 130 * k, gravity: 90, size: [5, 11], spin: 0 });
      jolt(ctx.to, [{ transform: 'scale(1)' }, { transform: 'scale(0.92, 1.08)' }, { transform: 'scale(1.04, 0.96)' }, { transform: 'scale(1)' }], 320);
      if (venom) {
        later(80, () => stamp(x, y - 56, 'VENOM x2!', { color: '#b4ff8a', ink: '#0a2a00', size: 34 + k * 4, star: '#2a7a10' }));
        fxTint('#3a8a1a', { opacity: 0.28, ms: 550 });
        burstLines(x, y, { n: 12, r1: 120 * k, color: '#b4ff8a' });
      } else later(60, () => cute(x, y - 50, 'CHOMP!', { c: '#fff', ink: '#1a4a08', size: 24 }));
    },
  };

  // ---------- Poison: Toxic Cloud ----------
  CARD_FX['toxic-cloud'] = {
    land(ctx) {
      const [x, y] = landXY(ctx);
      for (let i = 0; i < 5; i++) later(i * 70, () => showArt(x + fxRand(-26, 26), y + fxRand(-18, 18), '☁️', { cls: 'fxy-toxic-puff', ms: 900, from: 0.3, to: fxRand(0.9, 1.4), rise: 20 }));
      later(200, () => cute(x, y - 50, 'COUGH!', { c: '#d8ffb0', ink: '#3a5a10', size: 18 }));
    },
    // A rolling, growing cloud drifts at the foe
    windup(ctx) {
      const a = fromXY(ctx), b = toXY(ctx);
      for (let i = 0; i < 3; i++) later(i * 50, () => lob([a[0], a[1] + (i - 1) * 16], [b[0], b[1] + (i - 1) * 16], '☁️', { cls: 'fxy-toxic-puff', ms: 360, scale: [0.4, 1.8], spin: 40, easing: 'ease-out' }));
      return new Promise(r => setTimeout(r, 380));
    },
    impact(ctx) {
      const [x, y] = toXY(ctx), k = power(ctx);
      for (let i = 0; i < 7; i++) later(i * 40, () => showArt(x + fxRand(-60, 60), y + fxRand(-40, 40), '☁️', { cls: 'fxy-toxic-puff', ms: 1000, from: 0.5, to: fxRand(1.2, 1.9), rise: 30 }));
      fxTint('#5a7a1a', { opacity: 0.2, ms: 700 });
      later(120, () => cute(x, y - 60, 'GASSED!', { c: '#d8ffb0', ink: '#1a3a00', size: 22 + k * 2 }));
    },
  };
  GIMMICK_FX.plague = ctx => {
    if (!ctx.defender?.poison) return;
    // A grinning skull rises out of the poison cloud: the foe's poison doubles
    const [x, y] = toXY(ctx);
    showArt(x, y - 20, SKULL, { ms: 1100, from: 0.2, to: 1.2, rise: 40 });
    later(250, () => {
      stamp(x, y - 80, '☠️ POISON x2', { color: '#b4ff8a', ink: '#0a2a00', size: 30, star: '#1a4a08' });
      fxRing(x, y, { color: '#5fd13a', size: 280, width: 10, ms: 650 });
      fxParticles(x, y, { count: 20, cls: 'fxy-goo', colors: ['#5fd13a', '#b4ff8a'], spread: 160, gravity: 60, size: [5, 10], spin: 0 });
      fxTint('#2a6a0a', { opacity: 0.3, ms: 700 });
    });
  };

  // ---------- Tank: Shell Bash ----------
  CARD_FX['shell-bash'] = {
    land(ctx) {
      const [x, y] = landXY(ctx);
      showArt(x, y, SHELL, { ms: 700, from: 0.3, to: 1.2, spin: 360 });
      later(280, () => { fxRing(x, y, { color: '#f4c28a', size: 130, width: 5 }); cute(x, y - 50, 'CLONK!', { c: '#ffe8c8', ink: '#6a3a10', size: 19 }); });
      faceJiggle(ctx, [{ transform: 'scale(1)' }, { transform: 'scale(1.12, 0.9)' }, { transform: 'scale(0.95, 1.05)' }, { transform: 'scale(1)' }]);
    },
  };
  GIMMICK_FX.bash = ctx => {
    const shields = ctx.attacker?.shield || 0;
    if (!shields) return;
    // Your shields gather into spinning shells that pelt the foe one after another
    const a = fromXY(ctx), b = toXY(ctx), n = Math.min(shields, 6);
    fxRing(a[0], a[1], { color: '#6aa8ff', size: 170, width: 6 });
    for (let i = 0; i < n; i++) later(i * 95, () => lob(a, [b[0] + fxRand(-26, 26), b[1] + fxRand(-18, 18)], SHELL, { ms: 260, arc: fxRand(-90, 90), spin: 720, scale: [0.5, 0.9] })
      .then(() => { burstLines(b[0], b[1], { n: 6, r1: 70, color: '#bcd8ff', thick: 3 }); fxShake(ctx.to, 7, 180); }));
    later(n * 95 + 220, () => {
      stamp(b[0], b[1] - 60, `SHELL BASH x${shields}!`, { color: '#bcd8ff', ink: '#0a1a4a', size: 28 + Math.min(12, shields * 3), star: '#2a6ad1' });
      fxRing(b[0], b[1], { color: '#6aa8ff', size: 200 + shields * 30, width: 8 });
    });
  };

  // ---------- Tank: Bark Armor ----------
  CARD_FX['bark-armor'] = {
    land(ctx) {
      const [x, y] = landXY(ctx);
      fxParticles(x, y, { count: 10, html: () => '🍃', colors: ['#5fd13a'], spread: 80, size: [7, 11], gravity: 40, ms: 900, spin: 300 });
      later(200, () => cute(x, y - 48, 'THUNK!', { c: '#e8d8a0', ink: '#4a3010', size: 19 }));
    },
  };
  GIMMICK_FX.armor = ctx => {
    // Six bark plates fly in from all sides and lock around you, then a leafy ring settles
    const [x, y] = fromXY(ctx);
    for (let i = 0; i < 6; i++) {
      const ang = i / 6 * Math.PI * 2;
      later(i * 40, () => lob([x + Math.cos(ang) * 140, y + Math.sin(ang) * 100], [x + Math.cos(ang) * 44, y + Math.sin(ang) * 28], PLANK,
        { ms: 260, spin: 200, scale: [0.6, 0.8], easing: 'cubic-bezier(.4,1.6,.6,1)' }));
    }
    later(320, () => {
      fxRing(x, y, { color: '#8a6a3a', size: 190, width: 9 });
      stamp(x, y - 56, '+2 ARMOR', { color: '#d8f5a0', ink: '#3a2408', size: 28, star: '#6a4020' });
      fxParticles(x, y, { count: 10, html: () => '🍃', colors: ['#5fd13a'], spread: 100, size: [6, 10], gravity: 40 });
      jolt(ctx.from, [{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], 260);
    });
  };

  // ---------- Saws: Buzz Saw ----------
  CARD_FX['buzz-saw'] = {
    land(ctx) {
      const [x, y] = landXY(ctx);
      showArt(x, y, GEAR, { cls: 'fxy-gear', ms: 700, from: 0.3, to: 1, spin: 720 });
      later(150, () => fxParticles(x, y, { count: 12, colors: ['#ffd23f', '#fff', '#ff9a3b'], spread: 80, size: [2, 4], ms: 500 }));
      later(260, () => cute(x, y - 50, 'VRRRM!', { c: '#e8eef5', ink: '#2a2f37', size: 19 }));
    },
    // The gear rips across in a straight line, throwing a spark trail
    windup(ctx) {
      const a = fromXY(ctx), b = toXY(ctx), s = Math.min(3, ctx.strike || 0);
      speedLines(a, b, { n: 5, color: '#ffd23f' });
      return fxFly(a, b, { html: GEAR, cls: 'fxy-proj fxy-gear', ms: Math.max(220, 300 - s * 25), spin: 1440, trail: 'fxy-spark', trailEvery: 22, easing: 'linear' });
    },
    impact(ctx) {
      const [x, y] = toXY(ctx), k = power(ctx);
      // The gear grinds in place, spraying sparks upward, and leaves a gash
      const g = fxSpawn(x, y, { cls: 'fxy-art fxy-gear', html: GEAR, ms: 520, size: [70, 70] });
      fxAnimate(g, [{ transform: 'rotate(0deg) scale(1)', opacity: 1 }, { transform: 'rotate(900deg) scale(1.1)', opacity: 1, offset: 0.8 }, { transform: 'rotate(1100deg) scale(0.6)', opacity: 0 }], 520, 'linear');
      fxParticles(x, y, { count: 28, colors: ['#ffd23f', '#fff', '#ff9a3b'], spread: 170 * k, size: [2, 5], cone: 150, angle: -90, gravity: 110, ms: 700 });
      later(180, () => fxBeam([x - 80 * k, y + 30], [x + 80 * k, y - 30], { cls: 'fxy-gash', ms: 600, width: 10 }));
      later(80, () => stamp(x, y - 56, k > 2 ? 'SHREDDED!' : 'BZZZT!', { color: '#e8eef5', ink: '#2a0a0a', size: 28 + k * 5, star: k > 2 ? '#ff5d5d' : null }));
      fxShake(ctx.to, 6 + k * 2, 380);
    },
  };

  // ---------- Combos: Mirror Frog ----------
  // Mirror Frog becomes the copied card before it resolves, so that card's own effects play after this reflection
  CARD_FX['mirror-frog'] = {
    land(ctx) {
      const [x, y] = landXY(ctx);
      const m = fxSpawn(x, y, { cls: 'fxy-art', html: MIRROR, ms: 900 });
      fxAnimate(m, [{ transform: 'scale(0.3) rotateY(90deg)', opacity: 0 }, { transform: 'scale(1) rotateY(0deg)', opacity: 1, offset: 0.3 },
        { transform: 'scale(1) rotateY(180deg)', opacity: 1, offset: 0.7 }, { transform: 'scale(0.5) rotateY(360deg)', opacity: 0 }], 900, 'ease-in-out');
      // A shine sweeps back toward the previous wheel: "copying that one!"
      const wins = ctx.panel?.querySelectorAll?.('.wheel-window');
      const i = wins ? [...wins].indexOf(ctx.win) : -1;
      if (i > 0) later(300, () => fxBeam([x, y], fxPoint(wins[i - 1]), { cls: 'fxy-mirror-beam', ms: 500, width: 10 }));
      later(320, () => { cute(x, y - 52, 'COPY!', { c: '#e0f6ff', ink: '#0a4a6a', size: 21 }); fxParticles(x, y, { count: 12, html: () => '✨', colors: ['#fff'], spread: 80, size: [6, 10] }); });
    },
  };

  // ---------- Healing: Lotus Bloom ----------
  CARD_FX['lotus-bloom'] = {
    land(ctx) {
      const [x, y] = landXY(ctx);
      const f = fxSpawn(x, y + 10, { cls: 'fxy-art', html: LOTUS('#ff9ad5'), ms: 900, size: [90, 63] });
      fxAnimate(f, [{ transform: 'scale(0.2, 0)', opacity: 0 }, { transform: 'scale(1.1, 1.2)', opacity: 1, offset: 0.35 }, { transform: 'scale(1)', opacity: 1, offset: 0.75 }, { transform: 'scale(1)', opacity: 0 }], 900, 'cubic-bezier(.3,1.6,.5,1)');
      later(300, () => { fxParticles(x, y, { count: 10, html: () => '🌸', colors: ['#fff'], spread: 80, size: [6, 10], gravity: 30, ms: 900 }); cute(x, y - 52, 'BLOOM!', { c: '#ffe0f0', ink: '#8a0a4a', size: 20 }); });
    },
    // A spinning blossom glides to the foe with a petal trail
    windup(ctx) {
      const a = fromXY(ctx), b = toXY(ctx);
      return lob(a, b, LOTUS('#ff9ad5'), { cls: 'fxy-lotus', ms: 320, arc: -50, spin: 540, scale: [0.4, 0.8], trail: 'fxy-petal', trailEvery: 30, easing: 'ease-in-out' });
    },
    impact(ctx) {
      const [x, y] = toXY(ctx), k = power(ctx);
      fxParticles(x, y, { count: 14, html: () => '🌸', colors: ['#fff'], spread: 130 * k, size: [7, 11], gravity: 40, ms: 900, spin: 300 });
      fxRing(x, y, { color: '#ff9ad5', size: 170 * k, width: 6 });
      later(60, () => cute(x, y - 52, 'PETAL STRIKE!', { c: '#ffe0f0', ink: '#8a0a4a', size: 20 + k * 2 }));
    },
  };
  GIMMICK_FX.lifesteal = ctx => {
    // Glowing petals stream from the foe back into you, then you bloom with light
    const a = toXY(ctx), b = fromXY(ctx);
    for (let i = 0; i < 9; i++) later(i * 45, () => lob(a, [b[0] + fxRand(-20, 20), b[1] + fxRand(-14, 14)], '🌸', { ms: 420, arc: fxRand(-110, 110), spin: 240, scale: [0.8, 1.2], easing: 'ease-in-out' }));
    later(480, () => {
      fxRing(b[0], b[1], { color: '#ff9ad5', size: 180, width: 7 });
      fxParticles(b[0], b[1], { count: 12, colors: ['#ffd0ea', '#fff', '#b4ff8a'], html: () => '✦', spread: 90, size: [5, 9], angle: -90, cone: 140 });
      jolt(ctx.from, [{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], 300);
    });
  };

  // ---------- Healing: Spring Rain ----------
  CARD_FX['spring-rain'] = {
    land(ctx) {
      const [x, y] = landXY(ctx);
      showArt(x, y - 20, CLOUD, { ms: 900, from: 0.3, to: 0.7 });
      for (let i = 0; i < 8; i++) later(150 + i * 55, () => lob([x + fxRand(-34, 34), y - 12], [x + fxRand(-34, 34), y + 40], '💧', { cls: 'fxy-drop', ms: 340 }));
      later(250, () => cute(x, y - 60, 'PITTER PAT', { c: '#e0ecff', ink: '#1a3a7a', size: 16 }));
    },
  };
  GIMMICK_FX.regen = ctx => {
    // A rain cloud gathers over you and showers sparkly drops, ending in a rainbow arc
    const [x, y] = fromXY(ctx);
    showArt(x, y - 70, CLOUD, { ms: 1300, from: 0.3, to: 1, rise: 10 });
    for (let i = 0; i < 14; i++) later(200 + i * 55, () => lob([x + fxRand(-50, 50), y - 55], [x + fxRand(-50, 50), y + 20], '💧', { cls: 'fxy-drop', ms: 360 }));
    later(1000, () => {
      const rb = fxSpawn(x, y - 20, { cls: 'fxy-rainbow', ms: 800, size: [150, 75] });
      fxAnimate(rb, [{ transform: 'scale(0.5)', opacity: 0 }, { transform: 'scale(1)', opacity: 0.9, offset: 0.4 }, { opacity: 0 }], 800);
      cute(x, y - 70, 'REGEN x3', { c: '#d8ffe8', ink: '#0a4a2a', size: 20 });
    });
  };

  // ---------- Gold: Gold Rush ----------
  const coinShower = (x, y, n, spread = 150) => fxParticles(x, y, { count: n, html: () => COINART(18), colors: ['#ffd23f'], spread, size: [8, 12], gravity: 110, cone: 150, angle: -90, ms: 900, spin: 540 });
  CARD_FX['gold-rush'] = {
    land(ctx) {
      const [x, y] = landXY(ctx);
      coinShower(x, y, 10, 90);
      later(120, () => { fxRing(x, y, { color: '#ffd23f', size: 130, width: 5 }); cute(x, y - 50, 'KA-CHING!', { c: '#fff6c2', ink: '#6a4000', size: 19 }); });
    },
    // A pickaxe swings end over end at the foe
    windup(ctx) {
      const a = fromXY(ctx), b = toXY(ctx);
      return lob(a, b, PICK, { ms: 280, arc: -60, spin: -720, scale: [0.6, 1], trail: 'fxy-spark', trailEvery: 40 });
    },
    impact(ctx) {
      const [x, y] = toXY(ctx), k = power(ctx);
      burstLines(x, y, { n: 8, r1: 90 * k, color: '#ffd23f' });
      fxParticles(x, y, { count: 10, colors: ['#c0c8d0', '#8a8a8a', '#ffd23f'], spread: 110, size: [4, 8], gravity: 80 });
      later(50, () => stamp(x, y - 52, 'CLANG!', { color: '#ffd23f', ink: '#4a2a00', size: 26 + k * 4 }));
    },
  };
  GIMMICK_FX.loot = ctx => {
    if (ctx.attacker?.p?.enemy) return;
    // Gold bursts out of the foe and rains into your side
    const a = toXY(ctx), b = fromXY(ctx);
    for (let i = 0; i < 6; i++) later(i * 55, () => lob(a, [b[0] + fxRand(-24, 24), b[1] + fxRand(-12, 12)], COINART(22), { ms: 420, arc: fxRand(-120, -40), spin: 720, scale: [1.2, 0.8], easing: 'ease-in-out' }));
    later(420, () => { coinShower(b[0], b[1], 12, 120); stamp(b[0], b[1] - 60, '+3 GOLD!', { color: '#ffd23f', ink: '#4a2a00', size: 30, star: '#b07f00' }); });
  };

  // ---------- Gold: Pickpocket ----------
  CARD_FX['pickpocket'] = {
    land(ctx) {
      const [x, y] = landXY(ctx);
      const r = fxSpawn(x - 50, y + 10, { cls: 'fxy-art', html: '🦝', ms: 800, style: { fontSize: '40px' } });
      fxAnimate(r, [{ transform: 'translate(0, 0)', opacity: 0 }, { transform: 'translate(40px, -6px)', opacity: 1, offset: 0.3 },
        { transform: 'translate(50px, -6px) rotate(-8deg)', opacity: 1, offset: 0.6 }, { transform: 'translate(110px, 0)', opacity: 0 }], 800, 'ease-in-out');
      later(300, () => cute(x, y - 48, 'SHH...', { c: '#e0e0ea', ink: '#2a2a3a', size: 18 }));
    },
    // The raccoon dashes at the foe low and fast
    windup(ctx) {
      const a = fromXY(ctx), b = toXY(ctx);
      speedLines(a, b, { n: 5, color: '#c8c8d8' });
      return lob(a, b, '🦝', { cls: 'fxy-xl', ms: 240, arc: 30, scale: [0.8, 1.2], trail: 'fxy-dust', trailEvery: 35 });
    },
    impact(ctx) {
      const [x, y] = toXY(ctx), k = power(ctx);
      burstLines(x, y, { n: 8, r1: 90 * k, color: '#fff' });
      later(40, () => stamp(x, y - 52, 'SWIPE!', { color: '#e8e8f5', ink: '#1a1a2a', size: 26 + k * 4, rot: 10 }));
      jolt(ctx.to, [{ transform: 'rotate(0)' }, { transform: 'rotate(-5deg)' }, { transform: 'rotate(3deg)' }, { transform: 'rotate(0)' }], 300);
    },
  };
  GIMMICK_FX.steal = ctx => {
    if (ctx.attacker?.p?.enemy) return;
    // Coins sneak out of the foe's pocket into a swag bag on your side
    const a = toXY(ctx), b = fromXY(ctx);
    showArt(b[0], b[1] - 10, BAG, { ms: 1000, from: 0.3, to: 1.1 });
    for (let i = 0; i < 5; i++) later(100 + i * 70, () => lob(a, [b[0], b[1] - 10], COINART(20), { ms: 380, arc: fxRand(-90, 90), spin: 540, easing: 'ease-in-out' }));
    later(520, () => { stamp(b[0], b[1] - 70, 'YOINK!', { color: '#ffd23f', ink: '#1a1a2a', size: 30, star: '#8a8a9a' }); fxRing(b[0], b[1], { color: '#ffd23f', size: 150, width: 5 }); });
  };
})();
