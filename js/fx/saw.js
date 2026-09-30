// Card effects: saw group - Saw Blade and its re-spin gimmick (helpers are in js/card-fx.js).
// The saw's look: the real sprite blade spinning, hot spark streaks flung off its rim, a molten cut
// left in the target, and a "heat" that climbs while saws chain re-spins:
// silver -> gold -> red-hot -> pink plasma -> blue arc -> white-violet overload.
(() => {
  // saw_blade.png has the blade off-centre; .fxs-blade crops it so the blade's centre is the element's
  // centre (so it spins without wobbling). The wheel card's art (object-fit: contain) spins around this point:
  const ART_ORIGIN = '54.8% 47.5%';
  const IMG = '<img src="sprites/saw_blade.png" alt="">';

  // Heat palettes: c1 = spark / edge colour, c2 = hot core, glow = halo
  const HEAT = [
    { c1: '#ff9a1f', c2: '#fff1c2', glow: '#ffe7a3' }, // steel, gold sparks
    { c1: '#ff7a00', c2: '#ffd23f', glow: '#ffae00' }, // gold
    { c1: '#ff3b1f', c2: '#ffb347', glow: '#ff4b1f' }, // red-hot
    { c1: '#ff1f8f', c2: '#ffc2ea', glow: '#ff3fb0' }, // pink plasma
    { c1: '#2fa8ff', c2: '#d9f4ff', glow: '#4fc3ff' }, // blue arc
    { c1: '#a06bff', c2: '#ffffff', glow: '#d2b0ff' }, // white-violet overload
  ];
  const pal = lvl => HEAT[Math.max(0, Math.min(HEAT.length - 1, lvl | 0))];
  const hv = p => ({ '--c1': p.c1, '--c2': p.c2, '--glow': p.glow });

  // Saw chain: every re-spin within ~4s of the last one heats the saw up a level
  let chain = 0, lastSaw = -1e9;
  const heat = () => performance.now() - lastSaw < 4000 ? chain : 0;

  // How hard a strike is, 1..3: bigger damage, crits, later strikes and hot chains all push it up
  function power(ctx) {
    const atk = ctx.attacker?.p?.attack || 0;
    const rel = atk > 0 && ctx.dmg > 0 ? ctx.dmg / atk : 1;
    const v = 0.7 + rel * 0.3 + (ctx.strike || 0) * 0.4 + (ctx.crit ? 0.6 : 0) + (ctx.big ? 0.4 : 0) + heat() * 0.12;
    return Math.max(1, Math.min(3, v));
  }

  // --- Drawing pieces ---

  // A spinning blade sprite (fxs-blur adds a motion-blur disc and heat halo, fxs-hot tints it red-hot)
  function spawnBlade(x, y, size, p, { cls = '', ms = 800 } = {}) {
    return fxSpawn(x, y, { cls: 'fxs-blade ' + cls, html: IMG, size: [size, size], ms, vars: hv(p) });
  }
  // Faded afterimage of the blade left behind in flight
  function ghost(x, y, size, p, rot) {
    fxSpawn(x, y, { cls: 'fxs-blade fxs-ghost', html: IMG, size: [size, size], ms: 270, vars: { ...hv(p), '--r': rot + 'deg' } });
  }

  // Hot spark streaks: thin glowing lines that point along their flight and arc down under gravity
  function sparks(x, y, p, { count = 8, angle = 0, cone = 360, spread = 110, gravity = 70, ms = 520, len = [10, 22] } = {}) {
    for (let i = 0; i < count; i++) {
      const a = (angle + fxRand(-cone / 2, cone / 2)) * Math.PI / 180, d = spread * fxRand(0.45, 1);
      const vx = Math.cos(a) * d, vy = Math.sin(a) * d;
      const el = fxSpawn(x, y, { cls: 'fxs-spark', size: [fxRand(len[0], len[1]), 3], ms: ms + 40, vars: hv(p) });
      if (!el) return;
      let prev = null;
      const frames = [0, 0.3, 0.65, 1].map(t => {
        // Heading follows the velocity; unwrapped so it never swings the long way round between keyframes
        let r = Math.atan2(vy + 2 * gravity * t, vx) * 180 / Math.PI;
        if (prev !== null) { while (r - prev > 180) r -= 360; while (r - prev < -180) r += 360; }
        prev = r;
        return { offset: t, opacity: t === 1 ? 0 : 1,
          transform: `translate(${vx * t}px, ${vy * t + gravity * t * t}px) rotate(${r}deg) scaleX(${t === 0 ? 0.4 : 1.3 - t})` };
      });
      fxAnimate(el, frames, ms * fxRand(0.7, 1), 'cubic-bezier(.2,.75,.45,1)');
    }
  }
  // Sparks thrown off the rim of a spinning blade, tangentially (like a grinder)
  function rimSparks(x, y, radius, p, n, spread = 90) {
    for (let i = 0; i < n; i++) {
      const a = fxRand(0, 360), r = a * Math.PI / 180;
      sparks(x + Math.cos(r) * radius, y + Math.sin(r) * radius, p, { count: 1, angle: a + 90, cone: 20, spread, gravity: 50, ms: 480 });
    }
  }

  // Serrated saw-tooth ring (inline SVG), used as a spinning shockwave
  const TEETH = (() => {
    const n = 24, step = 360 / n;
    const pt = (r, a) => `${(r * Math.cos(a * Math.PI / 180)).toFixed(1)} ${(r * Math.sin(a * Math.PI / 180)).toFixed(1)}`;
    let d = '';
    for (let i = 0; i < n; i++) d += (i ? ' L' : 'M') + pt(40, i * step) + ' L' + pt(49, i * step + step * 0.25);
    d += ' Z M36 0 A36 36 0 1 0 -36 0 A36 36 0 1 0 36 0 Z'; // hollow middle
    return `<svg viewBox="-50 -50 100 100"><path d="${d}" fill-rule="evenodd"/></svg>`;
  })();
  function teethRing(x, y, size, p, { ms = 700, spin = 200, from = 0.3, to = 1.2, fill = '' } = {}) {
    const el = fxSpawn(x, y, { cls: 'fxs-teeth', html: TEETH, size: [size, size], ms, vars: { ...hv(p), '--tf': fill || '#e6edf5' } });
    return fxAnimate(el, [
      { transform: `rotate(0deg) scale(${from})`, opacity: 0.3 },
      { transform: `rotate(${spin * 0.35}deg) scale(${from + (to - from) * 0.45})`, opacity: 1, offset: 0.25 },
      { transform: `rotate(${spin}deg) scale(${to})`, opacity: 0 },
    ], ms, 'cubic-bezier(.2,.7,.3,1)');
  }

  // Gacha-pull light rays fanning out behind a point
  function rays(x, y, size, p, ms = 900) {
    const el = fxSpawn(x, y, { cls: 'fxs-rays', size: [size, size], ms, vars: hv(p) });
    return fxAnimate(el, [
      { transform: 'rotate(0deg) scale(0.4)', opacity: 0 },
      { transform: 'rotate(20deg) scale(1)', opacity: 0.9, offset: 0.25 },
      { transform: 'rotate(70deg) scale(1.1)', opacity: 0 },
    ], ms, 'ease-out');
  }

  // Chrome text that slams down like a stamp, holds, then lifts away
  function stamp(x, y, text, { size = 34, rotate = 0, p = HEAT[0], ms = 850, hot = false } = {}) {
    const el = fxSpawn(x, y, { cls: 'fxs-metal' + (hot ? ' fxs-metal-hot' : ''), html: text, ms, vars: hv(p), style: { fontSize: size + 'px' } });
    return fxAnimate(el, [
      { transform: `scale(2.6) rotate(${rotate - 14}deg)`, opacity: 0 },
      { transform: `scale(0.92) rotate(${rotate}deg)`, opacity: 1, offset: 0.14 },
      { transform: `scale(1.06) rotate(${rotate}deg)`, opacity: 1, offset: 0.24 },
      { transform: `scale(1) rotate(${rotate}deg)`, opacity: 1, offset: 0.72 },
      { transform: `translate(0, -26px) scale(1.1) rotate(${rotate}deg)`, opacity: 0 },
    ], ms, 'ease-out');
  }

  // Four-point glint that twinkles on polished metal
  function glint(x, y, size = 26, delay = 0) {
    setTimeout(() => {
      const el = fxSpawn(x, y, { cls: 'fxs-glint', html: '✦', ms: 460, style: { fontSize: size + 'px' } });
      fxAnimate(el, [
        { transform: 'scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1.5) rotate(45deg)', opacity: 1, offset: 0.35 },
        { transform: 'scale(0) rotate(120deg)', opacity: 0 },
      ], 420, 'ease-out');
    }, delay);
  }

  // Molten, ragged cut ripped across the target (drawn from one end to the other)
  function gashSvg(teeth = 16) {
    let d = 'M0 20';
    for (let i = 1; i <= teeth; i++) {
      const amp = Math.sin(Math.PI * i / teeth) * fxRand(4, 9);
      d += ` L${(i * 200 / teeth).toFixed(1)} ${(20 + (i % 2 ? -amp : amp)).toFixed(1)}`;
    }
    const line = c => `<path class="${c}" d="${d}" vector-effect="non-scaling-stroke"/>`;
    return `<svg viewBox="0 0 200 40" preserveAspectRatio="none">${line('fxs-g1')}${line('fxs-g2')}${line('fxs-g3')}</svg>`;
  }
  function gash(x, y, len, angle, p, delay = 0) {
    setTimeout(() => {
      const h = 30;
      const el = fxSpawn(x, y, { cls: 'fxs-gash', html: gashSvg(), size: [len, h], ms: 1000, vars: hv(p), style: { transformOrigin: '0 50%' } });
      if (!el) return;
      // Pivot on the left end so it rips outward, placed so the finished cut is centred on (x, y)
      const a = angle * Math.PI / 180;
      const base = `translate(${-len / 2 * Math.cos(a)}px, ${-h / 2 - len / 2 * Math.sin(a)}px) rotate(${angle}deg)`;
      el.animate([
        { transform: `${base} scaleX(0)`, opacity: 1 },
        { transform: `${base} scaleX(1)`, opacity: 1, offset: 0.14 },
        { transform: `${base} scaleX(1)`, opacity: 1, offset: 0.6 },
        { transform: `${base} scaleX(1) scaleY(0.2)`, opacity: 0 },
      ], { duration: 950, easing: 'ease-out', fill: 'forwards' });
    }, delay);
  }

  // Fast grinding judder on a battle element (WAAPI, so it reverts by itself)
  function grind(el, px, ms) {
    if (!el?.animate) return;
    const k = [{ transform: 'none' }];
    for (let i = 0; i < 12; i++) k.push({ transform: `translate(${fxRand(-px, px)}px, ${fxRand(-px, px) * 0.6}px) rotate(${fxRand(-1.2, 1.2)}deg)` });
    k.push({ transform: 'none' });
    el.animate(k, { duration: ms, easing: 'linear' });
  }

  // --- Saw Blade ---

  const LAND_TEXT = ['SHING!', 'AGAIN!', 'NO WAY!', 'UNSTOPPABLE!', 'SAW GOD!', 'INFINITE SAW!'];

  // Landed: chrome sheen over the reel, the card's blade revs up, a big blade bursts out throwing sparks
  function land(ctx) {
    const win = ctx.win, h = heat(), p = pal(h), k = 1 + Math.min(h, 6) * 0.1;
    const [cx, cy] = fxPoint(ctx.slot || win);
    const r = win?.getBoundingClientRect?.();
    const ww = r?.width || 120, wh = r?.height || 180;
    // Polished-steel sheen sweeps across the whole reel window
    if (win) {
      const [wx, wy] = fxPoint(win);
      const sh = fxSpawn(wx, wy, { cls: 'fxs-sheen', html: '<i></i>', size: [ww, wh], ms: 700 });
      fxAnimate(sh, [{ opacity: 1 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], 650, 'linear');
    }
    // The saw drawn on the card itself spins up and coasts to a stop
    ctx.slot?.querySelector('.art img')?.animate([
      { transform: 'rotate(0deg)', transformOrigin: ART_ORIGIN },
      { transform: `rotate(${1080 + Math.min(h, 4) * 360}deg)`, transformOrigin: ART_ORIGIN },
    ], { duration: 950, easing: 'cubic-bezier(.15,.85,.35,1)' });
    // Gacha rays + serrated shockwave + a clean steel ring
    rays(cx, cy, Math.max(ww, wh) * 1.9 * k, p);
    teethRing(cx, cy, 120 * k, p, { ms: 650, spin: 240, from: 0.35, to: 1.5, fill: h ? p.c2 : '' });
    fxRing(cx, cy, { color: h ? p.c1 : '#e8f1ff', size: 220 * k, ms: 560, width: 5 });
    // A big blade zooms out of the card at full rev, then drops back into it
    const size = Math.min(ww * 0.95, 130) * k;
    const b = spawnBlade(cx, cy, size, p, { cls: 'fxs-blur' + (h >= 2 ? ' fxs-hot' : ''), ms: 900 });
    fxAnimate(b, [
      { transform: 'rotate(0deg) scale(0.2)', opacity: 0 },
      { transform: 'rotate(320deg) scale(1.25)', opacity: 1, offset: 0.18 },
      { transform: 'rotate(1150deg) scale(1)', opacity: 0.95, offset: 0.6 },
      { transform: 'rotate(1800deg) scale(0.3)', opacity: 0 },
    ], 860, 'cubic-bezier(.2,.6,.4,1)');
    // Two bursts of sparks flung off its rim as it revs
    const n = Math.min(12, 7 + h * 2);
    setTimeout(() => rimSparks(cx, cy, size * 0.6, p, n, 80 + h * 15), 110);
    setTimeout(() => rimSparks(cx, cy, size * 0.55, p, n, 70 + h * 15), 300);
    glint(cx + size * 0.35, cy - size * 0.3, 28, 160);
    glint(cx - size * 0.3, cy + size * 0.25, 20, 380);
    stamp(cx, cy - wh * 0.32, LAND_TEXT[Math.min(h, LAND_TEXT.length - 1)], { size: 26 + Math.min(h, 5) * 3, rotate: fxRand(-10, 10), p, hot: h >= 2 });
    sfx('saw', 2.2 + Math.min(h, 5) * 0.15, 0.3); // short high rev
    // After its landing pop, the reel shudders like the blade is biting the frame
    win?.animate?.([0, 2, -2, 1.5, -1.5, 1, 0].map(v => ({ transform: `translate(${v}px, ${-v * 0.5}px)` })), { duration: 280, delay: 440, easing: 'linear' });
  }

  // Windup: the blade revs up at the attacker, then rips across on an arc trailing sparks and afterimages
  function windup(ctx) {
    const to = ctx.toXY || fxPoint(ctx.to), from = ctx.fromXY || [to[0] - 160, to[1]];
    const s = ctx.strike || 0, h = heat(), P = power(ctx), p = pal(h + s + (ctx.crit ? 2 : 0));
    const dir = to[0] >= from[0] ? 1 : -1;
    const size = Math.min(92, 40 + P * 14);
    const rev = s ? 80 : 130, fly = Math.max(200, 280 - s * 25), ms = rev + fly; // <= 410ms
    const arc = (s % 2 ? 1 : -1) * (36 + Math.min(s, 4) * 14) * dir; // follow-up strikes swing in from alternate sides
    const start = [from[0] + dir * 14, from[1] - 4];
    const dx = to[0] - start[0], dy = to[1] - start[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
    const at = t => { const bow = Math.sin(Math.PI * t) * arc; return [start[0] + dx * t + nx * bow, start[1] + dy * t + ny * bow]; };
    const b = spawnBlade(start[0], start[1], size, p, { cls: 'fxs-blur' + (ctx.crit || h >= 2 || s >= 2 ? ' fxs-hot' : ''), ms: ms + 80 });
    if (!b) return;
    const r0 = rev / ms, frames = [
      { transform: 'translate(0px, 0px) rotate(0deg) scale(0.15)', opacity: 0.3, offset: 0 },
      { transform: `translate(0px, 0px) rotate(${dir * 260}deg) scale(1.25)`, opacity: 1, offset: r0 * 0.6 },
      { transform: `translate(0px, 0px) rotate(${dir * 480}deg) scale(1)`, opacity: 1, offset: r0 },
    ];
    for (let i = 1; i <= 8; i++) {
      const t = i / 8, [x, y] = at(t);
      frames.push({ offset: r0 + (1 - r0) * t, opacity: 1,
        transform: `translate(${x - start[0]}px, ${y - start[1]}px) rotate(${dir * (480 + 1700 * t)}deg) scale(${1 + 0.3 * t})` });
    }
    const done = fxAnimate(b, frames, ms, 'linear');
    // Revving: sparks spit out the back of the blade before it launches
    setTimeout(() => sparks(start[0], start[1] + size * 0.3, p, { count: 5 + Math.min(s, 3), angle: -90 - dir * 45, cone: 70, spread: 70, gravity: 90, ms: 420 }), rev * 0.4);
    // In flight: a spark trail and afterimages every couple of frames (stops by itself on arrival)
    const t0 = performance.now() + rev, back = Math.atan2(-dy, -dx) * 180 / Math.PI;
    let last = 0, n = 0;
    const tick = now => {
      const t = (now - t0) / fly;
      if (t >= 1) return;
      if (t >= 0 && now - last > 32) {
        last = now;
        const [x, y] = at(t);
        sparks(x, y, p, { count: ctx.crit ? 3 : 2, angle: back, cone: 70, spread: 60, gravity: 40, ms: 320, len: [8, 16] });
        if (n++ % 2 === 0) ghost(x, y, size * (1 + 0.3 * t), p, fxRand(0, 360));
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return done;
  }

  const HIT_TEXT = ['RIP!', 'SHRRK!', 'GRIND!', 'BZZZT!'];
  const hitText = ctx => {
    const s = ctx.strike || 0;
    if (s >= 3) return 'OBLITERATED!!!';
    if (s === 2) return 'SHREDDED!!';
    if (s === 1) return 'RIP RIP!';
    if (ctx.crit) return 'BUZZ CRIT!!';
    if (ctx.big) return 'MEGA SHRED!';
    return HIT_TEXT[Math.floor(Math.random() * HIT_TEXT.length)];
  };

  // Impact: the blade bites in and grinds (fountain of sparks, target judders), rips a molten gash, ricochets off
  function impact(ctx) {
    const [x, y] = ctx.toXY || fxPoint(ctx.to);
    const from = ctx.fromXY || [x - 100, y];
    const s = ctx.strike || 0, h = heat(), P = power(ctx), p = pal(h + s + (ctx.crit ? 2 : 0));
    const dir = x >= from[0] ? 1 : -1;
    const size = Math.min(110, 48 + P * 18);
    // Hot glow around the bite (spawned first so it sits under everything else)
    fxTint(`radial-gradient(circle at ${x}px ${y}px, ${p.glow}, #0000 ${Math.round(120 + P * 50)}px)`, { ms: 480, opacity: 0.45 });
    if (ctx.crit || ctx.big || s >= 2) fxTint(p.c1, { ms: 380, opacity: 0.18 });
    // Grinding blade: jitters hard in place while spinning, then ricochets up and away
    const b = spawnBlade(x - dir * 6, y - 4, size, p, { cls: 'fxs-blur' + (ctx.crit || h >= 2 || s >= 2 ? ' fxs-hot' : ''), ms: 920 });
    if (b) {
      const frames = [];
      for (let i = 0; i <= 8; i++) {
        const t = i / 8 * 0.62, j = i ? 2 + P * 1.5 : 0;
        frames.push({ offset: t, opacity: 1, transform: `translate(${fxRand(-j, j)}px, ${fxRand(-j, j)}px) rotate(${dir * 2600 * t}deg) scale(${i ? 1 : 1.35})` });
      }
      frames.push({ offset: 1, opacity: 0, transform: `translate(${dir * 150}px, -120px) rotate(${dir * 3600}deg) scale(0.45)` });
      fxAnimate(b, frames, 880, 'linear');
    }
    // Four waves of sparks fountain up and back from the bite (plus a stray one skittering forward)
    const per = Math.min(7, 3 + Math.round(P * 1.3)), bx = x + dir * size * 0.3, by = y + size * 0.15;
    for (let w = 0; w < 4; w++) setTimeout(() => {
      sparks(bx, by, p, { count: per - 1, angle: -90 - dir * 50, cone: 70, spread: 120 + P * 30, gravity: 170, ms: 600 });
      sparks(bx, by, p, { count: 1, angle: dir > 0 ? 20 : 160, cone: 40, spread: 90, gravity: 60, ms: 420 });
    }, w * 115);
    // The cut: one gash, crossed into an X on crits, huge hits and follow-up strikes
    const ga = (dir > 0 ? 0 : 180) + (s % 2 ? 28 : -28) + fxRand(-10, 10);
    gash(x, y, Math.min(220, 110 + P * 35), ga, p, 30);
    if (ctx.crit || ctx.big || s >= 1) gash(x, y, Math.min(200, 100 + P * 30), ga + (s % 2 ? -56 : 56), p, 130);
    // Shockwaves and flying nuts and bolts
    fxRing(x, y, { color: p.c1, size: 120 + P * 50, ms: 480, width: 6 });
    fxRing(x, y, { color: '#e8f1ff', size: 80 + P * 40, ms: 380, width: 3 });
    fxParticles(x, y, { count: Math.min(5, 2 + Math.round(P)), html: i => ['🔩', '⚙️', '✦'][i % 3], colors: ['#dfe8f2'],
      size: [6, 10], spread: 130, gravity: 140, ms: 850, angle: -90, cone: 220, spin: 540 });
    stamp(x, y - 46, hitText(ctx), { size: Math.min(56, 28 + P * 7), rotate: -dir * 8 + fxRand(-6, 6), p, hot: ctx.crit || s >= 1 || h >= 2 });
    // The target box judders like it's being ground down
    grind(ctx.to, 2 + P * 1.5, 460);
    // Crits and huge hits: a clean white-hot slice through everything and a spinning tooth ring
    if (ctx.crit || ctx.big || s >= 2) {
      const a = ga * Math.PI / 180, L = 200;
      fxBeam([x - Math.cos(a) * L, y - Math.sin(a) * L], [x + Math.cos(a) * L, y + Math.sin(a) * L], { cls: 'fxs-slice', ms: 420, width: 6 });
      teethRing(x, y, 150 + P * 20, p, { ms: 620, spin: dir * 260, from: 0.3, to: 1.4, fill: p.c2 });
    }
    if (ctx.crit) sfx('saw', 0.75, 0.55); // deep grind under the crit boom
  }

  CARD_FX['saw-blade'] = { land, windup, impact };

  // --- Saw gimmick: the wheel spins again ---

  const chainText = c => c === 1 ? 'BZZZT!' : c === 2 ? 'SAW x2!' : c === 3 ? 'SAW x3!!' : c === 4 ? 'BUZZSAW x4!!'
    : c === 5 ? 'SHREDSTORM x5!!!' : `SAW-MAGEDDON x${c}!!!`;

  // A blade saws straight through the reel (down, then up on the next link), leaving a glowing seam.
  // Each saw in a chain is hotter, bigger and louder than the last.
  GIMMICK_FX.saw = ctx => {
    const now = performance.now();
    if (now - lastSaw > 4000) chain = 0;
    chain++;
    lastSaw = now;
    const c = chain, k = Math.min(c, 6), p = pal(c);
    const win = ctx.win, r = win?.getBoundingClientRect?.();
    const [cx, cy] = win ? fxPoint(win) : (ctx.fromXY || fxPoint(null));
    const ww = r?.width || 140, wh = r?.height || 180;
    const size = Math.max(70, Math.min(150, ww * 0.85)) * (1 + k * 0.06);
    const down = c % 2 === 1, sign = down ? 1 : -1;
    const y0 = cy - sign * (wh / 2 + size * 0.1), y1 = cy + sign * (wh / 2 + size * 0.1), ms = 540;
    // Heat glow washes over the reel (spawned first so it sits under everything else)
    if (c >= 2) fxTint(`radial-gradient(circle at ${cx}px ${cy}px, ${p.glow}, #0000 ${Math.round(160 + k * 30)}px)`, { ms: 600, opacity: 0.45 });
    if (c >= 3) fxTint(p.c1, { ms: 450, opacity: 0.08 + k * 0.03 });
    // The cutting blade
    const b = spawnBlade(cx, y0, size, p, { cls: 'fxs-blur' + (c >= 2 ? ' fxs-hot' : ''), ms: ms + 60 });
    const spin = sign * (1400 + k * 200), dy = y1 - y0;
    fxAnimate(b, [
      { transform: 'translate(0px, 0px) rotate(0deg) scale(0.6)', opacity: 0 },
      { transform: `translate(0px, ${dy * 0.12}px) rotate(${spin * 0.12}deg) scale(1)`, opacity: 1, offset: 0.12 },
      { transform: `translate(0px, ${dy * 0.85}px) rotate(${spin * 0.85}deg) scale(1)`, opacity: 1, offset: 0.85 },
      { transform: `translate(0px, ${dy}px) rotate(${spin}deg) scale(0.7)`, opacity: 0 },
    ], ms, 'linear');
    // Sparks spray out of the cut on both sides as it goes
    const per = Math.min(7, 3 + c);
    for (let w = 1; w <= 4; w++) setTimeout(() => {
      const sy = y0 + dy * w / 5;
      sparks(cx, sy, p, { count: Math.ceil(per / 2), angle: -20, cone: 50, spread: 90 + k * 12, gravity: 140, ms: 520 });
      sparks(cx, sy, p, { count: Math.floor(per / 2), angle: -160, cone: 50, spread: 90 + k * 12, gravity: 140, ms: 520 });
    }, ms * w / 5);
    // Glowing seam that grows behind the blade, then flares and fades
    const seam = fxSpawn(cx, cy, { cls: 'fxs-seam', size: [4 + k, wh * 0.92], ms: 950, vars: hv(p), style: { transformOrigin: down ? '50% 0' : '50% 100%' } });
    fxAnimate(seam, [
      { transform: 'scaleY(0)', opacity: 1 },
      { transform: 'scaleY(1)', opacity: 1, offset: 0.55 },
      { transform: 'scaleY(1) scaleX(2.5)', opacity: 0 },
    ], 900, 'linear');
    // Spinning tooth ring, shockwaves and the chain counter slammed over the reel
    teethRing(cx, cy, Math.max(ww, wh) * 0.9, p, { ms: 700, spin: -sign * 300, from: 0.4, to: 1.4, fill: p.c2 });
    fxRing(cx, cy, { color: p.c1, size: 200 + k * 30, ms: 520, width: 6 });
    if (c >= 3) setTimeout(() => fxRing(cx, cy, { color: p.c2, size: 260 + k * 30, ms: 560, width: 4 }), 120);
    stamp(cx, cy - wh * 0.18, chainText(c), { size: Math.min(58, 26 + c * 5), rotate: fxRand(-12, 12), p, hot: c >= 2, ms: 950 });
    // Hot chains: the blade splits into mini saws that fly out in every direction
    if (c >= 3) {
      const n = Math.min(5, c - 1), off = fxRand(0, 360);
      for (let i = 0; i < n; i++) {
        const a = (off + i * 360 / n) * Math.PI / 180, d = fxRand(100, 150);
        const m = spawnBlade(cx, cy, fxRand(30, 40), p, { cls: 'fxs-blur', ms: 700 });
        fxAnimate(m, [
          { transform: 'translate(0px, 0px) rotate(0deg) scale(0.3)', opacity: 0 },
          { transform: `translate(${Math.cos(a) * d * 0.5}px, ${Math.sin(a) * d * 0.5}px) rotate(500deg) scale(1.1)`, opacity: 1, offset: 0.35 },
          { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d}px) rotate(1200deg) scale(0.6)`, opacity: 0 },
        ], 650, 'cubic-bezier(.2,.7,.4,1)');
      }
    }
    fxShake(win, 3 + k, 320);
    // Milestones: extra sound and a screen banner for long chains
    if (c === 3) sfx('level_up', 1.15, 0.4);
    if (c === 5 || (c > 5 && c % 3 === 2)) sfx('jackpot', 1 + Math.min(c, 12) * 0.03, 0.5);
    if (c === 4 && typeof banner === 'function') { banner('SAW COMBO x4!', 'fire'); flash(p.glow, 0.25); }
    if (c === 6 && typeof banner === 'function') { banner('SHREDSTORM!!', 'fire'); flash(p.glow, 0.3); }
    if (c >= 8 && c % 2 === 0 && typeof banner === 'function') banner(`SAW x${c}!!!`, 'legendary');
    if (typeof haptic === 'function') haptic(Math.min(80, 15 + c * 8));
  };
})();
