// Card effects: power group (see js/card-fx.js)
// Croak Blast (sonic shockwave), Swamp King (royal gold super move), Double Croak (music notes),
// plus the Double Croak buff, every critical hit and the finishing K.O.
(() => {
  // --- Shared helpers ---
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const wait = ms => new Promise(r => setTimeout(r, ms));
  // Delayed step that can never throw into the page (fxRun's try/catch doesn't cover timers)
  const later = (ms, fn) => setTimeout(() => { try { fn(); } catch (e) { console.warn('power fx failed', e); } }, ms);
  const play = (...a) => { try { sfx(...a); } catch (e) {} };
  const angleTo = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
  const isGolden = c => /^Golden/.test(c?.name || '');
  // Point on an element, or a fallback point when the element is missing
  const at = (el, fallback, ox = 0.5, oy = 0.5) => el ? fxPoint(el, ox, oy) : (fallback || fxPoint(null));
  // Which way the target is along x from the attacker: 1 = to the right
  const dirOf = ctx => Math.sign((ctx.toXY?.[0] ?? 1) - (ctx.fromXY?.[0] ?? 0)) || 1;
  // How hard a hit should look: its share of the foe's max HP, plus extra strikes and crits
  const power = ctx => clamp(0.85 + (ctx.dmg || 0) / Math.max(1, ctx.defender?.maxHp || 80) * 2.2 +
    (ctx.strike || 0) * 0.2 + (ctx.crit ? 0.3 : 0), 0.85, 2.1);
  // Quick WAAPI jolt on a battle element; not filled, so it snaps back to its own styles afterwards
  const jolt = (el, frames, ms, easing = 'ease-out') => { try { el?.animate?.(frames, { duration: ms, easing }); } catch (e) {} };
  // Squash-and-stretch an HP box as if something heavy just hit it
  const squash = (el, k = 1, ms = 460) => {
    k = Math.min(1.4, k);
    jolt(el, [
      { transform: 'none' },
      { transform: `translate(${4 * k}px, ${3 * k}px) scale(${1 + 0.2 * k}, ${1 - 0.22 * k})`, offset: 0.12 },
      { transform: `translate(${-3 * k}px, 0) scale(${1 - 0.08 * k}, ${1 + 0.1 * k})`, offset: 0.35 },
      { transform: `translate(${2 * k}px, 0) scale(${1 + 0.03 * k}, ${1 - 0.03 * k})`, offset: 0.6 },
      { transform: 'none' },
    ], ms);
  };

  // Comic-book stamp: slams in from huge, holds, drifts up and fades
  function stamp(x, y, html, cls, { size = 44, ms = 800, rot = -8, from = 3.2 } = {}) {
    const el = fxSpawn(x, y, { cls: 'fxp-stamp ' + cls, html, ms, style: { fontSize: size + 'px' } });
    return fxAnimate(el, [
      { transform: `scale(${from}) rotate(${rot * 2.5}deg)`, opacity: 0 },
      { transform: `scale(0.86) rotate(${rot}deg)`, opacity: 1, offset: 0.13 },
      { transform: `scale(1.1) rotate(${rot}deg)`, opacity: 1, offset: 0.22 },
      { transform: `scale(1) rotate(${rot}deg)`, opacity: 1, offset: 0.7 },
      { transform: `translateY(-16px) scale(1.08) rotate(${rot}deg)`, opacity: 0 },
    ], ms, 'ease-out');
  }
  // Spinning sunburst of light rays (the look comes from cls: gold, crit, fire)
  function rays(x, y, cls, { size = 280, ms = 700, spin = 80, peak = 0.9, grow = [0.3, 1.25] } = {}) {
    const el = fxSpawn(x, y, { cls: 'fxp-rays ' + cls, ms, size: [size, size] });
    return fxAnimate(el, [
      { transform: `scale(${grow[0]}) rotate(0deg)`, opacity: 0 },
      { transform: `scale(${(grow[0] + grow[1]) / 2}) rotate(${spin * 0.3}deg)`, opacity: peak, offset: 0.2 },
      { transform: `scale(${grow[1]}) rotate(${spin}deg)`, opacity: 0 },
    ], ms, 'ease-out');
  }
  // Soft radial glow that swells and fades
  function glow(x, y, cls, { size = 200, ms = 500, grow = [0.3, 1.4], peak = 1 } = {}) {
    const el = fxSpawn(x, y, { cls: 'fxp-glow ' + cls, ms, size: [size, size] });
    return fxAnimate(el, [{ transform: `scale(${grow[0]})`, opacity: peak }, { transform: `scale(${grow[1]})`, opacity: 0 }],
      ms, 'cubic-bezier(.1,.8,.3,1)');
  }
  // Anime speed lines shooting outward from (x, y)
  function speedLines(x, y, cls, { count = 10, r0 = 30, r1 = 150, ms = 380, len = 1 } = {}) {
    for (let i = 0; i < count; i++) {
      const a = i * 360 / count + fxRand(-10, 10), r = r1 * fxRand(0.75, 1.15);
      const el = fxSpawn(x, y, { cls: 'fxp-line ' + cls, ms: ms + 40 });
      if (!el) return;
      fxAnimate(el, [
        { transform: `rotate(${a}deg) translateX(${r0}px) scaleX(${0.3 * len})`, opacity: 1 },
        { transform: `rotate(${a}deg) translateX(${r}px) scaleX(${len})`, opacity: 0 },
      ], ms * fxRand(0.8, 1), 'cubic-bezier(.1,.7,.3,1)');
    }
  }

  // ===== Croak Blast 📢: a sonic croak shockwave =====
  const CROAK_HUES = ['#ffb03b', '#ff6a2b', '#ff3b8a', '#b07cff'];
  // CROOAK! grows more O's (and !'s) with every extra strike
  const croakText = s => 'CR' + 'O'.repeat(2 + Math.min(5, s * 2)) + 'AK' + '!'.repeat(1 + Math.min(2, s));
  // Megaphone aimed along `ang` degrees (the 📢 emoji faces left, so it's mirrored to aim right)
  const megaphone = ang => Math.abs(ang) < 90
    ? `<div style="transform:rotate(${ang}deg) scaleX(-1)">📢</div>` : `<div style="transform:rotate(${ang - 180}deg)">📢</div>`;
  const arcHtml = (ang, color) => `<div class="fxp-arc" style="transform:rotate(${ang}deg)${color ? ';border-right-color:' + color : ''}"></div>`;

  CARD_FX['croak-blast'] = {
    // The reel buzzes, a megaphone pops out and blasts sound rings toward the foe
    land(ctx) {
      const [x, y] = at(ctx.slot, at(ctx.win)), dir = dirOf(ctx);
      const top = ctx.win ? fxPoint(ctx.win, 0.5, 0.1)[1] : y - 60;
      // Buzz starts at the game's big-land zoom so the two blend
      jolt(ctx.win, [0, -4, 4, -3, 3, -2, 1, 0].map((v, i, a) =>
        ({ transform: `translateX(${v}px) scale(${1.14 - 0.14 * i / (a.length - 1)})` })), 460, 'linear');
      fxPop(x, y, megaphone(dir > 0 ? 0 : 180), { cls: 'fxp-mega', size: 60, ms: 820, rise: 14 });
      [0, 110, 220].forEach((d, i) => later(d, () =>
        fxRing(x, y, { color: CROAK_HUES[i], size: 150 + i * 45, width: 7 - i * 2, ms: 480 })));
      // Sound arcs pour out of the megaphone's mouth
      for (let i = 0; i < 4; i++) later(60 + i * 70, () => {
        const el = fxSpawn(x + dir * 24, y, { html: arcHtml(dir > 0 ? 0 : 180, CROAK_HUES[i]), ms: 520 });
        fxAnimate(el, [{ transform: 'translateX(0) scale(0.35)', opacity: 1 },
                       { transform: `translateX(${dir * 95}px) scale(1.5)`, opacity: 0 }], 480, 'ease-out');
      });
      stamp(x, top, 'CROAK!', 'fxp-croak', { size: 24, ms: 760, rot: -6 * dir });
      fxParticles(x, y, { count: 12, colors: ['#ffd23f', '#ff9a1f', '#fff'], spread: 110, size: [4, 9], ms: 650,
        angle: dir > 0 ? 0 : 180, cone: 150 });
    },
    // Inhale, then a striped cone of sound with a volley of sonic arcs riding it (more, faster arcs per strike)
    windup(ctx) {
      const s = ctx.strike || 0, k = power(ctx), dir = dirOf(ctx);
      const from = at(ctx.from, ctx.fromXY, dir > 0 ? 0.8 : 0.2), to = at(ctx.to, ctx.toXY, dir > 0 ? 0.35 : 0.65);
      const ang = angleTo(from, to), n = 4 + Math.min(2, s), gap = 36, ms = Math.max(190, 290 - s * 40);
      jolt(ctx.from, [{ transform: 'none' }, { transform: 'scale(1.1, 0.9)', offset: 0.35 },
                      { transform: 'scale(0.95, 1.07)', offset: 0.7 }, { transform: 'none' }], 380);
      fxPop(from[0], from[1] - 4, megaphone(ang), { cls: 'fxp-mega', size: 40 + Math.min(16, s * 4), ms: 520, rise: 0 });
      play('big_hit', 0.55 - Math.min(0.2, s * 0.05), 0.35);
      fxBeam(from, to, { cls: 'fxp-cone', ms: ms + gap * n, width: 50 * Math.min(1.5, k) });
      let last = Promise.resolve();
      for (let i = 0; i < n; i++) {
        const hue = CROAK_HUES[(i + s) % CROAK_HUES.length];
        last = wait(i * gap).then(() => fxFly(from, to, { html: arcHtml(ang, hue), ms,
          scale: [0.35, 1.3 + 0.12 * i * k], easing: 'cubic-bezier(.4,0,.8,.6)' })).catch(() => {});
      }
      return last;
    },
    // Sonic boom: pressure wave, stacked shockwaves, equalizer bars blown out the far side, CROOOAK!
    impact(ctx) {
      const [x, y] = ctx.toXY || at(ctx.to);
      const s = ctx.strike || 0, k = power(ctx), dir = dirOf(ctx), hue = CROAK_HUES[Math.min(3, s)];
      glow(x, y, 'fxp-sonic-wave', { size: 260 * k, ms: 560, grow: [0.2, 1.3] });
      [hue, '#fff', '#ffd23f', hue].forEach((c, i) => later(i * 70, () =>
        fxRing(x, y, { color: c, size: (170 + i * 70) * k, width: Math.max(3, 9 - i * 2), ms: 480 + i * 70 })));
      speedLines(x, y, 'fxp-line-croak', { count: 10, r0: 40, r1: 150 * k, ms: 380 });
      fxParticles(x, y, { count: 12 + Math.min(6, s * 2), cls: 'fxp-bar', colors: [hue, '#fff', '#ffd23f'],
        spread: 170 * k, size: [12, 26], ms: 650, angle: dir > 0 ? 0 : 180, cone: 220, spin: 180 });
      stamp(x + dir * 10, y + 54, croakText(s), 'fxp-croak', { size: Math.min(56, 28 + 6 * k + s * 3), ms: 820, rot: -7 * dir });
      squash(ctx.to, k);
      fxTint(hue, { ms: 320, opacity: Math.min(0.32, 0.14 + s * 0.05) });
      if (s > 0 || ctx.crit) play('big_hit', 0.45, 0.35 + Math.min(0.4, s * 0.1)); // sub-bass on follow-ups
    },
  };

  // ===== Swamp King 👑: royal, golden, overwhelming =====
  const ROYAL_WORDS = ['ROYAL SMASH!', 'BOW DOWN!', 'ALL HAIL!', 'KNEEL!', 'LONG LIVE THE KING!'];
  const GEMS = ['✦', '★', '💎', '✧'];
  const GOLDS = ['#ffd23f', '#fff7c2', '#ffb300', '#fff'];
  // Little gold coin stamped with a crown
  const COIN_SVG = '<svg viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="12" r="11" fill="#c98a00"/>' +
    '<circle cx="12" cy="12" r="8.5" fill="#ffd23f" stroke="#fff3a0" stroke-width="1.2"/>' +
    '<path d="M7 15 L8 9 L10.5 12 L12 8 L13.5 12 L16 9 L17 15 Z" fill="#c98a00"/></svg>';
  // Gold coins raining down onto a point, flipping as they fall
  function coinRain(x, y, n) {
    for (let i = 0; i < n; i++) later(i * 40, () => {
      const h = fxRand(110, 170), ms = fxRand(480, 620);
      const el = fxSpawn(x + fxRand(-70, 70), y - h, { cls: 'fxp-coin', html: COIN_SVG, ms: ms + 40 });
      fxAnimate(el, [
        { transform: 'translateY(0) scaleX(1)', opacity: 0 },
        { transform: `translateY(${h * 0.35}px) scaleX(0.2)`, opacity: 1, offset: 0.3 },
        { transform: `translateY(${h * 0.75}px) scaleX(1)`, opacity: 1, offset: 0.65 },
        { transform: `translateY(${h + fxRand(-10, 20)}px) scaleX(0.3)`, opacity: 0 },
      ], ms, 'ease-in');
    });
  }

  CARD_FX['swamp-king'] = {
    // Legendary gacha pull: gold sunburst, a crown drops onto the card, gems fountain, LEGENDARY, coin chimes
    land(ctx) {
      const gold = isGolden(ctx.card), g = gold ? 1.3 : 1;
      const [x, y] = at(ctx.slot, at(ctx.win));
      const top = ctx.win ? fxPoint(ctx.win, 0.5, 0.1)[1] : y - 60;
      jolt(ctx.win, [{ transform: 'scale(1.22)' }, { transform: 'scale(0.95)', offset: 0.3 }, { transform: 'scale(1.05)', offset: 0.55 },
                     { transform: 'scale(0.99)', offset: 0.8 }, { transform: 'none' }], 620);
      rays(x, y, 'fxp-rays-gold', { size: 260 * g, ms: 1000, spin: 120, peak: 0.85, grow: [0.4, 1.3] });
      glow(x, y, 'fxp-glow-gold', { size: 200 * g, ms: 700 });
      fxRing(x, y, { color: '#ffd23f', size: 220 * g, width: 8, ms: 600 });
      later(140, () => fxRing(x, y, { color: '#fff', size: 300 * g, width: 4, ms: 650 }));
      // The crown falls out of the sky, squashes onto the card and bounces
      const crown = fxSpawn(x, y - 40, { cls: 'fxp-crown', html: '👑', ms: 1000, style: { fontSize: 44 * g + 'px' } });
      fxAnimate(crown, [
        { transform: 'translateY(-150px) scale(1.6) rotate(-25deg)', opacity: 0 },
        { transform: 'translateY(0) scale(1) rotate(0deg)', opacity: 1, offset: 0.28 },
        { transform: 'translateY(4px) scale(1.3, 0.75)', opacity: 1, offset: 0.36 },
        { transform: 'translateY(-8px) scale(0.92, 1.1)', opacity: 1, offset: 0.48 },
        { transform: 'translateY(0) scale(1)', opacity: 1, offset: 0.8 },
        { transform: 'translateY(-20px) scale(1.1)', opacity: 0 },
      ], 1000, 'ease-out');
      later(280, () => {
        fxParticles(x, y - 40, { count: 14, html: i => GEMS[i % GEMS.length], cls: 'fxp-gem', colors: GOLDS,
          spread: 130 * g, size: [7, 13], ms: 850, angle: -90, cone: 200, gravity: 70 });
        fxParticles(x, y, { count: 10, colors: ['#ffd23f', '#fff', '#ffb300'], spread: 150 * g, size: [4, 8], ms: 700 });
      });
      stamp(x, top, gold ? '✨ GOLDEN KING ✨' : 'LEGENDARY', 'fxp-royal', { size: gold ? 22 : 20, ms: 1050, rot: 0, from: 2.4 });
      // Gacha chime: a rising run of coin pings
      [1, 1.26, 1.5].concat(gold ? [2] : []).forEach((p, i) => later(i * 85, () => play('coin', p, 0.45)));
      if (gold) {
        flash('#ffd23f', 0.4);
        confetti(24);
        play('jackpot', 1, 0.55);
        banner('GOLDEN SWAMP KING!', 'legendary');
      }
    },
    // Super-move freeze: the screen dims, gold light rises from the King, and the crown is hurled in a high arc
    windup(ctx) {
      const s = ctx.strike || 0, k = power(ctx) * (isGolden(ctx.card) ? 1.15 : 1), dir = dirOf(ctx);
      const from = at(ctx.from, ctx.fromXY), to = at(ctx.to, ctx.toXY);
      const pre = s === 0 ? 90 : 30, ms = Math.max(200, 300 - s * 35);
      if (s === 0) fxTint('#1a0c00', { ms: 520, opacity: 0.5 });
      glow(from[0], from[1], 'fxp-glow-gold', { size: 170, ms: 420, grow: [0.5, 1.5] });
      const pillar = fxSpawn(from[0], from[1] - 90, { cls: 'fxp-pillar', ms: 480 });
      fxAnimate(pillar, [{ transform: 'scaleY(0.1) scaleX(1.6)', opacity: 1 }, { transform: 'scaleY(1) scaleX(1)', opacity: 1, offset: 0.35 },
                         { transform: 'scaleY(1.1) scaleX(0.2)', opacity: 0 }], 460, 'ease-out');
      play('coin', 1.5 + Math.min(0.5, s * 0.12), 0.5);
      return wait(pre).then(() => fxFly([from[0], from[1] - 20], to, { html: '👑', cls: 'fxp-crown fxp-crown-fly', ms,
        arc: -100 * dir, spin: 360 * dir, scale: [0.7, 1.5 * Math.min(1.5, k)], trail: 'fxp-trail-gold', trailEvery: 30,
        easing: 'cubic-bezier(.45,0,.85,.55)' })).catch(() => {});
    },
    // Royal smash: the crown slams down, gold sunburst, treasure explodes and coins rain on the foe
    impact(ctx) {
      const s = ctx.strike || 0, gold = isGolden(ctx.card), dir = dirOf(ctx);
      const k = Math.min(1.6, power(ctx) * (gold ? 1.15 : 1));
      const [x, y] = ctx.toXY || at(ctx.to);
      const crown = fxSpawn(x, y - 10, { cls: 'fxp-crown', html: '👑', ms: 760, style: { fontSize: Math.min(110, 64 * k) + 'px' } });
      fxAnimate(crown, [
        { transform: 'translateY(-50px) scale(2.4) rotate(-15deg)', opacity: 0.4 },
        { transform: 'translateY(0) scale(1.25, 0.8)', opacity: 1, offset: 0.16 },
        { transform: 'translateY(-10px) scale(0.95, 1.1)', opacity: 1, offset: 0.35 },
        { transform: 'translateY(-4px) scale(1)', opacity: 1, offset: 0.65 },
        { transform: 'translateY(-40px) scale(0.8)', opacity: 0 },
      ], 760, 'ease-out');
      rays(x, y, 'fxp-rays-gold', { size: 320 * k, ms: 800, spin: 90 * dir, grow: [0.3, 1.3] });
      glow(x, y, 'fxp-glow-gold', { size: 240 * k, ms: 520 });
      (gold ? ['#fff', '#ffd23f', '#ffb300', '#fff7c2'] : ['#fff', '#ffd23f', '#ffb300']).forEach((c, i) => later(i * 80, () =>
        fxRing(x, y, { color: c, size: (190 + i * 80) * k, width: Math.max(3, 10 - i * 2), ms: 520 + i * 60 })));
      speedLines(x, y, 'fxp-line-gold', { count: 8, r0: 40, r1: 170 * k, ms: 420 });
      fxParticles(x, y, { count: 12 + (gold ? 2 : 0), html: i => GEMS[i % GEMS.length], cls: 'fxp-gem', colors: GOLDS,
        spread: 170 * k, size: [8, 14], ms: 850, gravity: 80, spin: 200 });
      fxParticles(x, y, { count: 6, colors: ['#ffd23f', '#fff'], spread: 120, size: [5, 9], ms: 600 });
      coinRain(x, y, 6 + (gold ? 1 : 0));
      // Escalating royal decree per strike (the Golden King's first strike is a GOLDEN SMASH)
      const word = gold && s === 0 ? 'GOLDEN SMASH!' : ROYAL_WORDS[Math.min(s, ROYAL_WORDS.length - 1)];
      stamp(x + dir * 8, y + 54, word, 'fxp-royal', { size: Math.min(54, 28 + 6 * k + s * 3) * (word.length > 13 ? 0.7 : 1), ms: 860, rot: -6 * dir });
      // Crushed under the crown's weight: squashed down harder than a normal hit
      jolt(ctx.to, [
        { transform: 'none' },
        { transform: `translateY(${6 * k}px) scale(${1 + 0.18 * k}, ${1 - 0.3 * k})`, offset: 0.14 },
        { transform: `translateY(${-3 * k}px) scale(${1 - 0.06 * k}, ${1 + 0.12 * k})`, offset: 0.38 },
        { transform: 'translateY(1px) scale(1.02, 0.98)', offset: 0.62 },
        { transform: 'none' },
      ], 520);
      fxTint('#ffd23f', { ms: 380, opacity: 0.2 + Math.min(0.15, s * 0.04) });
      play('coin', 0.7, 0.6);
      if (gold) confetti(12);
    },
  };

  // ===== Double Croak 🎶: musical notes, everything happens twice =====
  const NOTES = ['♪', '♫', '🎵', '♬'];
  const NOTE_COLS = ['#d6a8ff', '#ff7ad9', '#ffd23f', '#7ae0ff'];
  const noteHtml = i => `<span style="color:${NOTE_COLS[i % NOTE_COLS.length]}">${NOTES[i % NOTES.length]}</span>`;

  CARD_FX['double-croak'] = {
    // The reel grooves to a double beat, sheet music sweeps across it and the card pops with an echo
    land(ctx) {
      const [x, y] = at(ctx.slot, at(ctx.win));
      const w = ctx.win?.getBoundingClientRect?.().width || 110;
      jolt(ctx.win, [
        { transform: 'scale(1.1) rotate(-4deg)' }, { transform: 'scale(1) rotate(3deg)', offset: 0.25 },
        { transform: 'scale(1.08) rotate(-3deg)', offset: 0.5 }, { transform: 'scale(1) rotate(2deg)', offset: 0.75 }, { transform: 'none' },
      ], 560, 'ease-in-out');
      const staff = fxSpawn(x, y, { cls: 'fxp-staff', html: '<span>♪</span><span>♫</span><span>♬</span>', ms: 760, size: [w + 50, 46] });
      fxAnimate(staff, [
        { transform: 'scaleX(0) skewX(-20deg)', opacity: 0 },
        { transform: 'scaleX(1.05) skewX(-8deg)', opacity: 1, offset: 0.3 },
        { transform: 'scaleX(1) skewX(0deg)', opacity: 1, offset: 0.65 },
        { transform: 'translateY(-14px) scaleX(1.1)', opacity: 0 },
      ], 740, 'ease-out');
      fxPop(x, y, '🎶', { cls: 'fxp-note-pop', size: 50, ms: 700, rise: 16 });
      // Two ghost copies slide apart: the echo that makes it "double"
      [-1, 1].forEach(side => {
        const g = fxSpawn(x, y, { cls: 'fxp-echo', html: '🎶', ms: 700, style: { fontSize: '50px' } });
        fxAnimate(g, [
          { transform: 'translateX(0) scale(1)', opacity: 0 },
          { transform: `translateX(${side * 30}px) scale(1.05)`, opacity: 0.6, offset: 0.3 },
          { transform: `translateX(${side * 70}px) scale(1.2)`, opacity: 0 },
        ], 680, 'ease-out');
      });
      // Two beats of rings, then a fountain of tumbling notes
      fxRing(x, y, { color: '#b07cff', size: 170, width: 6, ms: 480 });
      later(150, () => fxRing(x, y, { color: '#ff7ad9', size: 210, width: 5, ms: 480 }));
      fxParticles(x, y, { count: 14, html: i => NOTES[i % NOTES.length], cls: 'fxp-note', colors: NOTE_COLS,
        spread: 130, size: [8, 14], ms: 950, angle: -90, cone: 150, gravity: 60, spin: 60 });
      play('combo', 1.5, 0.3);
      later(140, () => play('combo', 2, 0.26));
    },
    // (Double Croak deals no damage itself; these only play if a variant of it ever does)
    windup(ctx) {
      const from = at(ctx.from, ctx.fromXY), to = at(ctx.to, ctx.toXY);
      return fxFly(from, to, { html: noteHtml(ctx.strike || 0), cls: 'fxp-note fxp-note-fly', ms: 300,
        arc: (ctx.strike % 2 ? 1 : -1) * 50, spin: 360 }).catch(() => {});
    },
    impact(ctx) {
      const [x, y] = ctx.toXY || at(ctx.to);
      fxRing(x, y, { color: '#b07cff', size: 190, width: 6, ms: 480 });
      fxParticles(x, y, { count: 12, html: i => NOTES[i % NOTES.length], cls: 'fxp-note', colors: NOTE_COLS,
        spread: 140, size: [8, 13], ms: 750, gravity: 40 });
    },
  };

  // Double buff: a stream of notes flows from the reel into the buffed frog, then the strike counter
  // (x2, x3...) slams on with an echo. More stacks: more notes, hotter colours, ENCORE!
  GIMMICK_FX.double = ctx => {
    const stacks = (ctx.attacker?.doubleNext || 0) + 1, strikes = stacks + 1; // doubleNext is bumped right after this fires
    const src = ctx.win ? fxPoint(ctx.win) : at(ctx.slot, ctx.fromXY);
    const dst = ctx.fromXY || at(ctx.from);
    const n = 4 + Math.min(4, stacks);
    // Starts just after the card's own landing burst
    for (let i = 0; i < n; i++) later(120 + i * 35, () => fxFly(src, dst, { html: noteHtml(i), cls: 'fxp-note fxp-note-fly', ms: 300,
      arc: (i % 2 ? 1 : -1) * fxRand(40, 90), spin: fxRand(-200, 200), scale: [0.6, 1.2] }));
    later(440, () => {
      const [x, y] = ctx.from ? fxPoint(ctx.from) : dst;
      const tier = ['', 'fxp-hot', 'fxp-max'][Math.min(2, stacks - 1)];
      const ringCols = [['#b07cff', '#e0c3ff'], ['#ff5dc8', '#ffd1f1'], ['#ffd23f', '#fff7c2']][Math.min(2, stacks - 1)];
      jolt(ctx.from, [{ transform: 'none' }, { transform: 'scale(1.14)', offset: 0.25 }, { transform: 'scale(0.96)', offset: 0.55 },
                      { transform: 'none' }], 420);
      fxRing(x, y, { color: ringCols[0], size: 170 + stacks * 20, width: 6, ms: 460 });
      later(110, () => fxRing(x, y, { color: ringCols[1], size: 210 + stacks * 20, width: 4, ms: 460 }));
      const size = Math.min(64, 30 + stacks * 7);
      stamp(x, y + 50, `×${strikes}`, 'fxp-badge ' + tier, { size, ms: 650, rot: -6, from: 2.6 });
      [-1, 1].forEach(side => later(90, () => {
        const g = fxSpawn(x, y + 50, { cls: 'fxp-stamp fxp-badge fxp-ghost ' + tier, html: `×${strikes}`, ms: 520, style: { fontSize: size + 'px' } });
        fxAnimate(g, [{ transform: 'translateX(0) scale(1) rotate(-6deg)', opacity: 0.55 },
                      { transform: `translateX(${side * 60}px) scale(1.15) rotate(-6deg)`, opacity: 0 }], 500, 'ease-out');
      }));
      fxParticles(x, y, { count: 8 + Math.min(6, stacks * 2), html: i => NOTES[i % NOTES.length], cls: 'fxp-note', colors: NOTE_COLS,
        spread: 110 + stacks * 15, size: [7, 12], ms: 650, gravity: 30 });
      play('combo', 1.3 * 2 ** (Math.min(12, stacks * 2) / 12), 0.28);
      if (stacks >= 3) {
        stamp(x, y + 96, 'ENCORE!', 'fxp-encore', { size: 26, ms: 620, rot: 6 });
        flash('#b07cff', 0.25);
      }
    });
  };

  // Critical hit (any card): white-out impact frame, crossed blade slashes, crit sunburst, shattering
  // shards, speed lines and a CRITICAL! stamp with the multiplier
  BATTLE_FX.crit = ctx => {
    const [x, y] = ctx.toXY || at(ctx.to);
    const k = clamp(0.9 + (ctx.dmg || 0) / Math.max(1, ctx.defender?.maxHp || 80) * 1.5, 0.9, 1.6);
    fxTint('#fff', { ms: 150, opacity: 0.55 });
    jolt(ctx.panel, [{ transform: 'scale(1.05)' }, { transform: 'scale(1.02)' }], 130); // punch-in during the hit-stop
    const base = fxRand(-20, 20), angles = [base - 32, base + 32].concat(k > 1.2 ? [base + 90] : []);
    angles.forEach((a, i) => later(i * 55, () => {
      const el = fxSpawn(x, y, { cls: 'fxp-slash', ms: 380, style: { width: 300 * k + 'px' } });
      fxAnimate(el, [
        { transform: `rotate(${a}deg) translateX(-60px) scaleX(0.05)`, opacity: 1 },
        { transform: `rotate(${a}deg) translateX(0) scaleX(1)`, opacity: 1, offset: 0.35 },
        { transform: `rotate(${a}deg) translateX(40px) scaleX(1.05) scaleY(0.15)`, opacity: 0 },
      ], 340, 'cubic-bezier(.2,.9,.3,1)');
    }));
    rays(x, y, 'fxp-rays-crit', { size: 320 * k, ms: 700, spin: 140, peak: 1, grow: [0.2, 1.2] });
    fxRing(x, y, { color: '#ffd23f', size: 280 * k, width: 10, ms: 520 });
    later(90, () => fxRing(x, y, { color: '#ff3b3b', size: 360 * k, width: 5, ms: 560 }));
    speedLines(x, y, 'fxp-line-gold', { count: 12, r0: 50, r1: 190 * k, ms: 400, len: 1.4 });
    fxParticles(x, y, { count: 14, cls: 'fxp-shard', colors: ['#fff', '#ffd23f', '#fff7c2', '#ff9a1f'], spread: 200 * k,
      size: [8, 18], ms: 700, gravity: 60, spin: 540 });
    const mult = ctx.attacker?.p?.critMult;
    stamp(x, y + 104, `CRITICAL!${mult ? `<small>×${mult} DAMAGE</small>` : ''}`, 'fxp-crit-text',
      { size: 40 * Math.min(1.25, k), ms: 900, rot: -9 });
    play('coin', 2.1, 0.35);
  };

  // K.O. (battle over): the screen dims, the loser's box is blown apart in an explosion, K.O. slams on
  // in two halves, and the winner gets a trophy (plus confetti unless the computer won)
  BATTLE_FX.ko = ctx => {
    const [x, y] = ctx.toXY || at(ctx.to);
    const [wx, wy] = ctx.fromXY || at(ctx.from);
    const [cx, cy] = ctx.panel ? fxPoint(ctx.panel, 0.5, 0.42) : [innerWidth / 2, innerHeight / 2];
    const enemyWon = !!ctx.attacker?.p?.enemy, enemyLost = !!ctx.defender?.p?.enemy;
    fxTint('#000', { ms: 900, opacity: 0.5 });
    fxTint('#fff', { ms: 170, opacity: 0.75 });
    play('big_hit', 0.42, 1);
    haptic(160);
    // Loser's box: violent shake, crumple and flicker
    jolt(ctx.to, [
      { transform: 'none', opacity: 1 },
      { transform: 'translate(-10px, 4px) scale(1.18) rotate(-4deg)', opacity: 1, offset: 0.08 },
      { transform: 'translate(9px, -5px) scale(0.9) rotate(3deg)', opacity: 1, offset: 0.18 },
      { transform: 'translate(-7px, 3px) scale(1.05) rotate(-2deg)', opacity: 1, offset: 0.28 },
      { transform: 'translate(5px, -2px) scale(0.92) rotate(2deg)', opacity: 0.5, offset: 0.4 },
      { transform: 'translate(-2px, 1px) scale(0.9) rotate(-1deg)', opacity: 0.85, offset: 0.55 },
      { transform: 'translate(0, 4px) scale(0.88) rotate(-3deg)', opacity: 0.45, offset: 0.8 },
      { transform: 'none', opacity: 1 },
    ], 880, 'linear');
    // Explosion: fireball, flame rays, 💥, fire rings, debris and sparks, then rising smoke
    glow(x, y, 'fxp-glow-fire', { size: 220, ms: 650, grow: [0.2, 2] });
    rays(x, y, 'fxp-rays-fire', { size: 340, ms: 750, spin: 60, peak: 1, grow: [0.3, 1.3] });
    fxPop(x, y, '💥', { size: 96, ms: 700, rise: 10 });
    ['#fff', '#ffd23f', '#ff5d1f'].forEach((c, i) => later(i * 80, () =>
      fxRing(x, y, { color: c, size: 260 + i * 90, width: 12 - i * 3, ms: 560 + i * 60 })));
    fxParticles(x, y, { count: 16, cls: 'fxp-debris', colors: ['#3a0010', '#8a1c1c', '#555', '#ff9a1f', '#fff3d6'],
      spread: 230, size: [6, 14], ms: 850, gravity: 140, spin: 720 });
    fxParticles(x, y, { count: 6, colors: ['#ffd23f', '#ff7a1f', '#fff'], spread: 170, size: [5, 9], ms: 600 });
    for (let i = 0; i < 4; i++) later(120 + i * 60, () => {
      const el = fxSpawn(x + fxRand(-40, 40), y + fxRand(-10, 15), { cls: 'fxp-smoke', ms: 720, size: [56, 56] });
      fxAnimate(el, [
        { transform: 'translate(0, 0) scale(0.4)', opacity: 0 },
        { transform: `translate(${fxRand(-10, 10)}px, -24px) scale(1)`, opacity: 0.75, offset: 0.3 },
        { transform: `translate(${fxRand(-25, 25)}px, -70px) scale(1.7)`, opacity: 0 },
      ], 680, 'ease-out');
    });
    // K. then O. slam onto the middle of the battle, each with a jolt and a boom
    [['K.', -1, 90, 1000], ['O.', 1, 200, 900]].forEach(([t, side, d, ms]) => later(d, () => {
      const el = fxSpawn(cx + side * 58, cy, { cls: 'fxp-stamp fxp-ko', html: t, ms, style: { fontSize: '110px' } });
      const r = side * -4;
      fxAnimate(el, [
        { transform: `scale(4) rotate(${side * 20}deg)`, opacity: 0 },
        { transform: `scale(0.85) rotate(${r}deg)`, opacity: 1, offset: 0.16 },
        { transform: `scale(1.08) rotate(${r}deg)`, opacity: 1, offset: 0.26 },
        { transform: `scale(1) rotate(${r}deg)`, opacity: 1, offset: 0.85 },
        { transform: `scale(1.15) rotate(${r}deg)`, opacity: 0 },
      ], ms, 'ease-out');
      fxShake(ctx.panel, 10, 280);
      play('big_hit', side < 0 ? 0.7 : 0.55, 0.7);
    }));
    later(320, () => {
      fxPop(wx, wy - 44, enemyWon ? '😈' : '🏆', { size: 54, ms: 760, rise: 26 });
      fxParticles(wx, wy, { count: 5, html: '✦', colors: ['#ffd23f', '#fff', '#7ae0ff'], spread: 90, size: [7, 12], ms: 700 });
      fxPop(x, y - 6, enemyLost ? '💀' : '😵', { size: 48, ms: 700, rise: 8 });
      if (!enemyWon) {
        confetti(40);
        play('celebrate', 1, 0.55);
      }
    });
  };
})();
