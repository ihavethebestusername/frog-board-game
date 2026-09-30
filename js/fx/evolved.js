// Card effects: the evolved enemies' own attacks (see EVOLVED_CARDS in config.js).
// Each attack gets a themed projectile, trail, impact stamp and colours from the table below.
(() => {
  const later = (ms, fn) => setTimeout(() => { try { fn(); } catch (e) { console.warn('evolved fx failed', e); } }, ms);
  const toXY = ctx => ctx.toXY || fxPoint(ctx.to), fromXY = ctx => ctx.fromXY || fxPoint(ctx.from);
  const power = ctx => 1 + (ctx.big ? 0.6 : 0) + (ctx.crit ? 0.8 : 0) + Math.min(3, ctx.strike || 0) * 0.3;
  // slug: [projectile, colours, stamp, flight style]
  const LOOK = {
    'swarm-sting':       ['🦟', ['#c8c8c8', '#ff5d5d', '#fff'], 'BZZT!', 'swarm'],
    'blood-drain':       ['🩸', ['#b01c1c', '#ff6b6b', '#fff'], 'SLURP!', 'arc'],
    'royal-proboscis':   ['👑', ['#ffd23f', '#b01c1c', '#fff'], 'ROYAL STING!', 'dive'],
    'plague-swarm':      ['🦠', ['#5fd13a', '#b4ff8a', '#2a7a10'], 'PLAGUE!', 'swarm'],
    'brood-wall':        ['🥚', ['#f5e6d6', '#c9b28a', '#fff'], 'BROOD WALL!', 'self'],
    'iron-shell-slam':   ['🛡️', ['#9aa4b0', '#fff', '#6aa8ff'], 'CLANG!', 'spin'],
    'rust-snap':         ['🦷', ['#b0602a', '#fff', '#ffb070'], 'SNAP!', 'arc'],
    'dragon-breath':     ['🔥', ['#ff6a00', '#ffd23f', '#ff2b2b'], 'SCORCH!', 'beam'],
    'ancient-carapace':  ['🐉', ['#3ca83c', '#ffd23f', '#fff'], 'ANCIENT!', 'self'],
    'lightning-beak':    ['⚡', ['#ffea00', '#fff', '#6aa8ff'], 'ZAP!', 'beam'],
    'gale-dive':         ['🌪️', ['#c0e8ff', '#fff', '#6aa8ff'], 'WHOOSH!', 'spin'],
    'phoenix-flame':     ['☄️', ['#ff6a00', '#ffd23f', '#ff2bd6'], 'INFERNO!', 'dive'],
    'rebirth-feather':   ['🪶', ['#ffd23f', '#ff6a00', '#fff'], 'REBIRTH!', 'self'],
    'three-headed-bite': ['🐍', ['#3ca83c', '#b4ff8a', '#fff'], 'CHOMP!', 'swarm'],
    'hydra-venom':       ['🧪', ['#5fd13a', '#2a7a10', '#b4ff8a'], 'VENOM!', 'arc'],
    'toxic-spit':        ['💚', ['#5fd13a', '#b4ff8a', '#fff'], 'SPTUI!', 'arc'],
    'tidal-crush':       ['🌊', ['#2a6ad1', '#7ae0ff', '#fff'], 'TIDAL CRUSH!', 'beam'],
    'abyssal-maw':       ['🦈', ['#1a3a7a', '#7ae0ff', '#fff'], 'DEVOURED!', 'dive'],
    'meat-hook':         ['🪝', ['#9aa4b0', '#b01c1c', '#fff'], 'HOOKED!', 'arc'],
    'iron-cleaver':      ['⚔️', ['#c0c8d0', '#ff2b2b', '#fff'], 'CLEAVE!', 'spin'],
    'royal-slam':        ['👑', ['#ffd23f', '#c2185b', '#fff'], 'ROYAL SLAM!', 'dive'],
    'tusk-frenzy':       ['🐗', ['#8a5a2a', '#ff5d5d', '#fff'], 'GORE!', 'swarm'],
    'royal-feast':       ['🍖', ['#c07a3a', '#ffd23f', '#fff'], 'FEAST!', 'self'],
  };
  Object.entries(LOOK).forEach(([slug, [icon, colors, word, style]]) => {
    if (CARD_FX[slug]) return; // has its own hand-made effect (the evolved boss attacks live in boss.js)
    CARD_FX[slug] = {
      land(ctx) {
        const [x, y] = fxPoint(ctx.slot || ctx.win);
        fxRing(x, y, { color: colors[0], size: 150, width: 5 });
        fxParticles(x, y, { count: 12, colors, spread: 80, size: [4, 8] });
        later(150, () => fxPop(x, y - 40, icon, { size: 42, ms: 700 }));
      },
      windup(ctx) {
        const a = fromXY(ctx), b = toXY(ctx), s = Math.min(3, ctx.strike || 0);
        if (style === 'beam') { fxBeam(a, b, { cls: 'fxe-beam', ms: 380, width: 16 + s * 4 }); return new Promise(r => setTimeout(r, 220)); }
        if (style === 'dive') return fxFly([b[0] - 140, b[1] - 240], b, { html: icon, cls: 'fxe-proj', ms: 300, arc: 40, scale: [0.6, 1.6], trail: 'fxe-trail', trailEvery: 35 });
        if (style === 'spin') return fxFly(a, b, { html: icon, cls: 'fxe-proj', ms: 280, spin: 900, trail: 'fxe-trail', trailEvery: 30 });
        if (style === 'swarm') { for (let i = 0; i < 4; i++) later(i * 40, () => fxFly(a, [b[0] + fxRand(-20, 20), b[1] + fxRand(-14, 14)], { html: icon, cls: 'fxe-small', ms: 260, arc: fxRand(-80, 80) })); return new Promise(r => setTimeout(r, 300)); }
        if (style === 'self') return null;
        return fxFly(a, b, { html: icon, cls: 'fxe-proj', ms: 280, arc: -50, trail: 'fxe-trail', trailEvery: 30 });
      },
      impact(ctx) {
        const [x, y] = toXY(ctx), k = power(ctx);
        fxRing(x, y, { color: colors[0], size: 170 * k, width: 7 });
        fxParticles(x, y, { count: 18, colors, spread: 140 * k, size: [4, 10], gravity: 50 });
        later(40, () => fxPop(x, y - 50, word, { cls: 'fxe-stamp', size: 28 + k * 5, ms: 800, rotate: fxRand(-10, 10) }));
        fxShake(ctx.to, 6 + k * 3, 320);
      },
    };
  });
})();
