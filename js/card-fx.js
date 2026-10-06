// Card FX: special effects and graphics for every card and attack in battles.
// This file is the engine: drawing helpers plus the registries that the files in js/fx/ fill in.
//
// Registries (each js/fx/*.js file adds to these):
//   CARD_FX[slug]  = { land(ctx), windup(ctx), impact(ctx) }   slug = fxSlug(card), e.g. 'sticky-tongue'
//     land    - the wheel just landed on this card (ctx.win = wheel window, ctx.slot = the landed card)
//     windup  - right before one strike hits (e.g. a projectile flying at the foe). May return a
//               Promise; the battle waits for it, but never more than FX_WINDUP_MAX ms.
//     impact  - the strike just landed (ctx.dmg > 0) on the foe's HP box
//     gimmick - optional: plays instead of GIMMICK_FX[its gimmick] when the card's own gimmick fires
//               (so a frost card's stun can freeze you in ice instead of the green slime)
//   GIMMICK_FX[gimmick] = fn(ctx)   shield, heal, double, leech, poison, stun, saw, grow, cleave, frenzy, wallow
//   BATTLE_FX[name]     = fn(ctx)   crit, block, poisonTick, stunSkip, leechDrain, ko
//   BATTLE_FX['name:kind']          a themed variant, e.g. 'poisonTick:frost' for frostbite (see BATTLE_FX_KIND)
//
// ctx (every field may be missing when it doesn't apply):
//   card, gimmick, panel (battle panel el), win (wheel window el), slot (landed card el in the wheel),
//   from / to (attacker / target HP box els), fromXY / toXY ([x, y] centres in fx-layer coords),
//   dmg, crit, big (a huge hit), blocked, strike (0-based strike number), strikes (total),
//   attacker / defender (fighter objects: hp, maxHp, shield, poison...), side (attacker index 0/1)
//
// All helpers draw into one fixed full-screen layer above the battle. They only animate transform and
// opacity (cheap on iPads) and every element removes itself when its animation ends.

const fxLayer = document.createElement('div');
fxLayer.className = 'fx-layer';
document.body.appendChild(fxLayer);

const FX_WINDUP_MAX = 450; // longest the battle will wait for a windup animation (ms)
let FX_MAX_NODES = 260;    // safety cap: skip new effects if this many are already on screen (the Orbital Laser raises it)

// Same slug the card designs use (see cardFace in battle.js)
const fxSlug = c => c.name.replace(/^Golden /, '').replace(/ \+$/, '').toLowerCase().replace(/[^a-z]+/g, '-');
const fxFlipped = () => document.documentElement.classList.contains('flipped');
const fxBusy = () => fxLayer.childElementCount > FX_MAX_NODES * (fxLite ? 0.6 : 1);

// Adaptive quality: if the device drops frames while effects are playing, switch to a lighter look for good
// (half the particles, sparser trails, no glow filters or shadows, fewer nodes on screen). Remembered per device.
let fxLite = false;
try { fxLite = localStorage.getItem('fxLite') === '1'; } catch (e) {}
const setFxLite = on => {
  fxLite = on;
  document.documentElement.classList.toggle('fx-lite', on);
  try { localStorage.setItem('fxLite', on ? '1' : '0'); } catch (e) {}
};
if (fxLite) document.documentElement.classList.add('fx-lite');
(() => {
  let last = 0, slow = 0, seen = 0;
  (function watch(t) {
    // Only judge frames while a lot is on screen (a busy moment is when slowness shows)
    if (!fxLite && last && fxLayer.childElementCount > 40) {
      seen++;
      if (t - last > 34) slow++; // under ~30 FPS
      if (seen >= 90) { if (slow > seen * 0.4) setFxLite(true); seen = slow = 0; }
    }
    last = t;
    if (!fxLite) requestAnimationFrame(watch);
  })(0);
})();
const fxRand = (a, b) => a + Math.random() * (b - a);

// Point on an element in fx-layer coordinates. ox/oy pick where on it (0.5, 0.5 = centre).
// Player 2's screen is rotated 180°, so on-screen positions are mirrored into the rotated page.
function fxPoint(el, ox = 0.5, oy = 0.5) {
  if (!el) return [innerWidth / 2, innerHeight / 2];
  const r = cachedRect(el);
  let x = r.left + r.width * ox, y = r.top + r.height * oy;
  if (fxFlipped()) { x = innerWidth - x; y = innerHeight - y; }
  return [x, y];
}

// Create an element in the fx layer, centred on (x, y). Removed after `ms`.
//   cls: CSS classes, html: inner HTML, size: [w, h] px (optional), vars: CSS custom properties,
//   style: extra inline styles
function fxSpawn(x, y, { cls = '', html = '', ms = 800, size = null, vars = {}, style = {} } = {}) {
  if (fxBusy()) return null;
  const el = document.createElement('div');
  el.className = 'fx ' + cls;
  if (html) el.innerHTML = html;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  if (size) { el.style.width = size[0] + 'px'; el.style.height = size[1] + 'px'; }
  for (const k in vars) el.style.setProperty(k.startsWith('--') ? k : '--' + k, vars[k]);
  Object.assign(el.style, style);
  fxLayer.appendChild(el);
  setTimeout(() => el.remove(), ms);
  return el;
}

// Animate an element with the Web Animations API (transform/opacity keyframes). Returns a Promise.
// Each keyframe's transform is prefixed with translate(-50%, -50%) so elements stay centred on their point.
function fxAnimate(el, frames, ms, easing = 'ease-out', extra = {}) {
  if (!el) return Promise.resolve();
  const centred = frames.map(f => ({ ...f, transform: 'translate(-50%, -50%) ' + (f.transform || '') }));
  const a = el.animate(centred, { duration: ms, easing, fill: 'forwards', ...extra });
  return a.finished.catch(() => {});
}

// Fly something from one point to another (optionally along an arc, spinning). Resolves on arrival.
//   html/cls: what flies, arc: px the path bows sideways (+/-), spin: degrees turned on the way,
//   scale: [start, end], trail: CSS class for a short-lived trail dropped along the way (or '')
function fxFly(from, to, { html = '', cls = '', ms = 300, arc = 0, spin = 0, scale = [1, 1], trail = '', trailEvery = 30, easing = 'ease-in' } = {}) {
  const el = fxSpawn(from[0], from[1], { cls, html, ms: ms + 60 });
  if (!el) return Promise.resolve();
  const dx = to[0] - from[0], dy = to[1] - from[1];
  const len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len; // normal, for the arc
  const steps = 8, frames = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, bow = Math.sin(Math.PI * t) * arc;
    frames.push({ transform: `translate(${dx * t + nx * bow}px, ${dy * t + ny * bow}px) rotate(${spin * t}deg) scale(${scale[0] + (scale[1] - scale[0]) * t})` });
  }
  let trailTimer = 0;
  if (trail) {
    const start = performance.now();
    trailTimer = setInterval(() => {
      const t = Math.min(1, (performance.now() - start) / ms), bow = Math.sin(Math.PI * t) * arc;
      fxSpawn(from[0] + dx * t + nx * bow, from[1] + dy * t + ny * bow, { cls: trail, ms: 400 });
    }, fxLite ? trailEvery * 2 : trailEvery);
    setTimeout(() => clearInterval(trailTimer), ms + 50); // never outlive the flight, even if its end event is late
  }
  return fxAnimate(el, frames, ms, easing).then(() => { clearInterval(trailTimer); el.remove(); });
}

// A beam/line from one point to another that shoots out and fades. cls styles it (background etc.).
function fxBeam(from, to, { cls = '', ms = 350, width = 10 } = {}) {
  const dx = to[0] - from[0], dy = to[1] - from[1], len = Math.hypot(dx, dy);
  const el = fxSpawn(from[0], from[1], { cls: 'fx-beam ' + cls, ms, style: { width: len + 'px', height: width + 'px' } });
  if (!el) return Promise.resolve();
  const ang = Math.atan2(dy, dx) * 180 / Math.PI;
  // Beams grow from their start point, so they're anchored at the left-centre instead of the centre
  el.style.transformOrigin = '0 50%';
  const a = el.animate([
    { transform: `translate(0, -50%) rotate(${ang}deg) scaleX(0)`, opacity: 1 },
    { transform: `translate(0, -50%) rotate(${ang}deg) scaleX(1)`, opacity: 1, offset: 0.3 },
    { transform: `translate(0, -50%) rotate(${ang}deg) scaleX(1) scaleY(0.2)`, opacity: 0 },
  ], { duration: ms, easing: 'ease-out', fill: 'forwards' });
  return a.finished.catch(() => {});
}

// Particles bursting out from (x, y).
//   count, colors, html (string or fn(i) for emoji/shapes; default = coloured dots), spread: px travelled,
//   size: [min, max] px, ms, gravity: px pulled down by the end, angle/cone: aim (deg) and width of the burst
function fxParticles(x, y, { count = 16, colors = ['#fff'], html = null, cls = '', spread = 120, size = [5, 12], ms = 700,
                             gravity = 0, angle = 0, cone = 360, spin = 360 } = {}) {
  count = Math.min(fxLite ? Math.ceil(count / 2) : count, 48);
  for (let i = 0; i < count; i++) {
    const s = fxRand(size[0], size[1]), col = colors[i % colors.length];
    const inner = typeof html === 'function' ? html(i) : html;
    const el = fxSpawn(x, y, { cls: 'fx-particle ' + cls, html: inner || '', ms: ms + 50,
      size: inner ? null : [s, s], style: inner ? { fontSize: s * 2 + 'px', color: col } : { background: col, boxShadow: `0 0 ${s}px ${col}` } });
    if (!el) return;
    const a = (angle + fxRand(-cone / 2, cone / 2)) * Math.PI / 180, d = spread * fxRand(0.45, 1);
    const ex = Math.cos(a) * d, ey = Math.sin(a) * d + gravity;
    fxAnimate(el, [
      { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1 },
      { transform: `translate(${ex * 0.7}px, ${ey * 0.6}px) scale(0.9) rotate(${spin * 0.6}deg)`, opacity: 1, offset: 0.6 },
      { transform: `translate(${ex}px, ${ey}px) scale(0.3) rotate(${spin}deg)`, opacity: 0 },
    ], ms * fxRand(0.75, 1), 'cubic-bezier(.2,.7,.4,1)');
  }
}

// Expanding ring (shockwave) at (x, y)
function fxRing(x, y, { color = '#fff', size = 160, ms = 500, width = 6, cls = '' } = {}) {
  const el = fxSpawn(x, y, { cls: 'fx-ring ' + cls, ms, size: [size, size], style: { borderColor: color, borderWidth: width + 'px' } });
  return fxAnimate(el, [{ transform: 'scale(0.1)', opacity: 1 }, { transform: 'scale(1)', opacity: 0 }], ms, 'cubic-bezier(.1,.8,.3,1)');
}

// Big emoji/text/graphic that pops in at (x, y), holds, then fades (like a stamp or sticker)
function fxPop(x, y, html, { cls = '', ms = 700, size = 64, rise = 30, rotate = 0 } = {}) {
  const el = fxSpawn(x, y, { cls: 'fx-pop ' + cls, html, ms, style: { fontSize: size + 'px' } });
  return fxAnimate(el, [
    { transform: `scale(0.2) rotate(${rotate - 20}deg)`, opacity: 0 },
    { transform: `scale(1.25) rotate(${rotate}deg)`, opacity: 1, offset: 0.2 },
    { transform: `scale(1) rotate(${rotate}deg)`, opacity: 1, offset: 0.7 },
    { transform: `translate(0, ${-rise}px) scale(0.9) rotate(${rotate}deg)`, opacity: 0 },
  ], ms, 'ease-out');
}

// Whole-screen colour wash (e.g. green for poison), fading out over `ms`
function fxTint(color, { ms = 500, opacity = 0.35, cls = '' } = {}) {
  const el = fxSpawn(0, 0, { cls: 'fx-tint ' + cls, ms, style: { background: color } });
  if (!el) return Promise.resolve();
  const a = el.animate([{ opacity }, { opacity: 0 }], { duration: ms, easing: 'ease-out', fill: 'forwards' });
  return a.finished.catch(() => {});
}

// Shake/jolt any element (e.g. an HP box or the panel) with the Web Animations API
function fxShake(el, px = 8, ms = 300) {
  if (!el) return;
  const k = [0, -1, 0.8, -0.6, 0.4, -0.2, 0].map(v => ({ transform: `translate(${v * px}px, ${-v * px * 0.4}px)` }));
  el.animate(k, { duration: ms, easing: 'linear' });
}

// Run one registered effect safely: a broken effect must never break the battle
function fxRun(fn, ctx) {
  if (typeof fn !== 'function') return null;
  try { return fn(ctx); } catch (e) { console.warn('card fx failed', e); return null; }
}
const CARD_FX = {}, GIMMICK_FX = {}, BATTLE_FX = {};
// Every hook also plays the card's sound for that moment (the table lives in js/card-sounds.js)
const fxSound = (hook, card, ctx) => { if (typeof cardSound === 'function') fxRun(() => cardSound(hook, card, ctx)); };
function cardLandFx(card, ctx) { if (card) { fxRun(CARD_FX[fxSlug(card)]?.land, { card, ...ctx }); fxSound('land', card, ctx); } }
async function cardWindupFx(card, ctx) {
  if (!card) return;
  const p = fxRun(CARD_FX[fxSlug(card)]?.windup, { card, ...ctx });
  fxSound('windup', card, ctx);
  if (p && typeof p.then === 'function') await Promise.race([p, sleep(FX_WINDUP_MAX)]);
}
// Extra layers drawn on top of every card's own impact: fn(ctx). (The region kit adds its big emoji hits here.)
const IMPACT_LAYERS = [];
function cardImpactFx(card, ctx) {
  if (!card) return;
  fxRun(CARD_FX[fxSlug(card)]?.impact, { card, ...ctx });
  fxSound('impact', card, ctx);
  IMPACT_LAYERS.forEach(fn => fxRun(fn, { card, ...ctx }));
}
function gimmickFx(g, ctx) {
  if (!g) return;
  const own = ctx.card?.gimmick === g ? CARD_FX[fxSlug(ctx.card)]?.gimmick : null; // the card's own themed version
  fxRun(own || GIMMICK_FX[g], { gimmick: g, ...ctx });
  if (ctx.card?.gimmick === g) fxSound('gimmick', ctx.card, ctx);
}
// Which themed variant of a battle moment plays: frostbite / burn ticks, frozen / dazed turn skips, and ice /
// magma shields blocking. ctx.defender is the fighter it happens to (see ELEMENTS in regions.js).
const BATTLE_FX_KIND = {
  poisonTick: ctx => ctx.defender?.dotKind,
  stunSkip: ctx => ctx.defender?.stunKind,
  block: ctx => ctx.defender?.p?.element,
};
function battleFx(name, ctx) {
  const kind = BATTLE_FX_KIND[name]?.(ctx);
  fxRun((kind && BATTLE_FX[name + ':' + kind]) || BATTLE_FX[name], ctx);
  if (typeof momentSound === 'function') fxRun(() => momentSound(kind ? name + ':' + kind : name));
}
