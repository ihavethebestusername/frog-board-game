// Sound effects and visual effects (particle bursts, screen flash, dust).

// --- Sound effects: event -> [file in sounds/, volume, base pitch, max ms]. Events without a file stay silent. ---
// `max ms` cuts a long sound short with a quick fade, so it never drags on past the moment it's for.
const SFX = {
  dice_roll:         ['roll_dice', 0.7, 1],
  dice_land:         ['dice_land', 0.9, 1],
  shop_buy:          ['shop_buy', 0.8, 1],
  button_click:      ['button_click', 0.5, 1],
  card_hover:        ['card_hover', 0.35, 1],
  hop:               ['jump', 0.45, 1],
  coin:              ['coin_collect', 0.7, 1],
  wheel_tick:        ['wheel_tick', 0.3, 1],
  card_land_attack:  ['card_selected', 0.7, 1],
  card_land_gimmick: ['card_selected', 0.7, 1.35],
  card_pick:         ['card_selected', 0.5, 1.2],
  hit:               ['physical_attack', 0.8, 1],
  big_hit:           ['beam_attack', 1, 1],
  blocked:           ['shield', 0.8, 0.7],
  heal:              ['shield', 0.5, 1.5],
  shield:            ['shield', 0.7, 1],
  buff:              ['card_selected', 0.6, 1.6],
  poison:            ['poison', 0.7, 1],
  stun:              ['slimey_hit', 0.7, 1.2],
  leech:             ['slimey_hit', 0.7, 0.65],
  saw:               ['attack_saw', 0.8, 1],
  fail:              ['fail', 0.7, 1],
  win:               ['win', 1, 1],
  jackpot:           ['jackpot', 0.8, 1],
  celebrate:         ['celebrate', 0.8, 1],
  level_up:          ['level_up', 0.8, 1],
  eagle:             ['eagle', 0.7, 1],
  orbital_laser:     ['orbital_laser', 1, 1],
  bite:              ['bite', 0.8, 1],
  heavy_slam:        ['heavy_slam', 0.9, 1],
  combo:             ['combo.wav', 0.8, 1], // things in a row: pitched up with the count (see comboSfx)
  // Attack sounds (mostly used by the card sound table in js/card-sounds.js)
  iceshock:          ['iceshock', 0.75, 1],
  freeze:            ['freeze', 0.6, 1, 1600],
  eating:            ['eating', 0.7, 1, 1200],
  pig:               ['pig', 0.7, 1],
  mosquito:          ['mosquito', 0.45, 1, 1100],
  fire_spell:        ['fire_spell', 0.6, 1, 1500],
  burn:              ['burn', 0.6, 1, 1300],
  ember:             ['single_small_ember', 0.65, 1],
  lightning:         ['lightning strike', 0.6, 1, 1800],
  wind:              ['wind_gust', 0.65, 1],
  psychic:           ['psychic', 0.75, 1],
  wonder:            ['wonderous_synth', 0.5, 1, 2400],
  footstep:          ['single_footstep', 0.85, 1],
  support:           ['support_effect', 0.5, 1, 1800],
  strengthen:        ['strengthen', 0.6, 1, 1600],
  explosion:         ['explosion_strike', 0.75, 1],
  big_explosion:     ['strong_explosion_strike', 0.7, 1, 2600],
  breaking:          ['breaking', 0.75, 1],
  dud:               ['dud', 0.6, 1, 900],
  dramatic:          ['dramatic_loop', 0.55, 1, 1750], // the super-move cinematic
};
const sfxCache = {};
// Sound files are .mp3 unless the name already has an extension (e.g. combo.wav)
const sfxPath = file => encodeURI(`sounds/${file.includes('.') ? file : file + '.mp3'}`); // (some names have spaces)
// Sounds play through Web Audio: each file is decoded once and every play is a cheap buffer source.
// (Cloning an <audio> element per play is very slow on iPads, e.g. dozens of wheel ticks per spin.)
const AudioCtx = window.AudioContext || window.webkitAudioContext;
const actx = AudioCtx ? new AudioCtx() : null;
const sfxBuffers = {}; // file -> AudioBuffer, or a pending promise
function loadSfx(file) {
  if (sfxBuffers[file]) return;
  sfxBuffers[file] = fetch(sfxPath(file)).then(r => r.arrayBuffer())
    .then(data => new Promise((ok, fail) => actx.decodeAudioData(data, ok, fail)))
    .then(buf => sfxBuffers[file] = buf).catch(() => sfxBuffers[file] = 'missing');
}
if (actx) {
  Object.values(SFX).forEach(([file]) => loadSfx(file));
  // Browsers start audio suspended until the player touches the page
  const unlock = () => { if (actx.state !== 'running') actx.resume(); };
  addEventListener('pointerdown', unlock, true);
  addEventListener('keydown', unlock, true);
}
// `pitch` scales the playback speed/pitch; every play also gets a small random wobble so repeats don't sound identical
// `loud` scales the volume (capped at full volume)
function sfx(name, pitch = 1, loud = 1) {
  const def = SFX[name];
  if (!def) return;
  const [file, vol, basePitch, maxMs] = def;
  const hype = typeof streakPitch === 'function' && players[turn] ? streakPitch() : 1; // answer streak brightens sounds
  // Web Audio can pitch much further than <audio> (combo layers go several octaves up and down)
  const rate = Math.min(actx ? 32 : 4, Math.max(actx ? 0.06 : 0.25, basePitch * pitch * hype * (0.94 + Math.random() * 0.12)));
  const buf = actx && sfxBuffers[file];
  if (buf instanceof AudioBuffer) {
    const src = actx.createBufferSource(), gain = actx.createGain();
    src.buffer = buf;
    src.playbackRate.value = rate;
    gain.gain.value = Math.min(1, vol * loud);
    src.connect(gain).connect(actx.destination);
    src.start();
    if (maxMs) { // fade out and stop a long sound at its cut-off (the pitch changes how long it really plays)
      const end = actx.currentTime + maxMs / 1000;
      gain.gain.setValueAtTime(gain.gain.value, end - 0.15);
      gain.gain.linearRampToValueAtTime(0, end);
      try { src.stop(end + 0.02); } catch (e) {}
    }
    // Same shape as an <audio> element for callers that loop/stop a sound
    return { set loop(v) { src.loop = v; }, pause() { try { src.stop(); } catch (e) {} } };
  }
  // Still loading: skip rather than fall back to slow <audio>. But if the fetch failed (the game was opened
  // straight from the folder, where browsers block fetch on file:// pages), play it through <audio> instead.
  if (actx && buf !== 'missing') return;
  try {
    const base = sfxCache[file] ||= new Audio(sfxPath(file));
    if (base.error) return;
    const a = base.cloneNode();
    a.volume = Math.min(1, vol * loud);
    a.preservesPitch = a.mozPreservesPitch = a.webkitPreservesPitch = false; // let speed change the pitch
    a.playbackRate = Math.min(4, Math.max(0.25, rate)); // <audio> can't pitch as far as Web Audio
    a.play().catch(() => {});
    if (maxMs) setTimeout(() => a.pause(), maxMs);
    return a; // callers can loop/stop it
  } catch (e) {}
}

// Spray particles (dots and stars) plus a shockwave ring out from the center of an element
function burst(target, colors, count = 14, power = 1) {
  if (!target) return;
  const r = cachedRect(target);
  let cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  // When the screen is flipped for Player 2, on-screen positions are mirrored inside the rotated page
  if (document.documentElement.classList.contains('flipped')) { cx = innerWidth - cx; cy = innerHeight - cy; }
  const ring = document.createElement('div');
  ring.className = 'shockwave';
  Object.assign(ring.style, { left: cx + 'px', top: cy + 'px', borderColor: colors[0] });
  ring.style.setProperty('--s', 3 + power * 2);
  document.body.appendChild(ring);
  setTimeout(() => ring.remove(), 650);
  for (let i = 0; i < count; i++) {
    const star = i % 3 === 0;
    const b = document.createElement('div');
    b.className = 'burst' + (star ? ' star' : '');
    if (star) b.textContent = Math.random() < 0.5 ? '✦' : '★';
    const a = Math.random() * Math.PI * 2, dist = (50 + Math.random() * 80) * power;
    const size = 5 + Math.random() * 9;
    Object.assign(b.style, { left: cx + 'px', top: cy + 'px' });
    if (star) { b.style.color = colors[i % colors.length]; b.style.fontSize = size * 2 + 'px'; }
    else { b.style.background = colors[i % colors.length]; b.style.width = b.style.height = size + 'px'; b.style.boxShadow = `0 0 8px ${colors[i % colors.length]}`; }
    b.style.setProperty('--dx', Math.cos(a) * dist + 'px');
    b.style.setProperty('--dy', Math.sin(a) * dist + 'px');
    b.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
    b.style.animationDuration = (0.6 + Math.random() * 0.5) + 's';
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 1150);
  }
}
// Brief full-screen color flash
function flash(color, strength = 0.5) {
  const f = document.createElement('div');
  f.className = 'screen-flash';
  f.style.background = color;
  f.style.setProperty('--o', strength);
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 450);
}

// Soft dust puffs that roll outward along the ground at a player's feet.
// They live inside the board (world) so they pan and zoom with the map, not the screen.
function dust(p, count) {
  const [px, py] = center(p);
  const cx = px, cy = py + 14;
  const colors = ['#c9b28a', '#a8916b', '#e0d2b4', '#b89f78'];
  for (let i = 0; i < count; i++) {
    const d = document.createElement('div');
    d.className = 'dust';
    const side = i % 2 ? 1 : -1;
    const size = (7 + Math.random() * 9) * 1.4; // a bit bigger: the soft gradient edge fades sooner than the old blur did
    Object.assign(d.style, { left: cx + 'px', top: cy + 'px', width: size + 'px', height: size + 'px',
                             color: colors[i % colors.length], animationDelay: Math.random() * 0.08 + 's' });
    d.style.setProperty('--dx', side * (10 + Math.random() * 28) + 'px');
    d.style.setProperty('--dy', -(3 + Math.random() * 14) + 'px');
    world.appendChild(d);
    setTimeout(() => d.remove(), 1000);
  }
}

// Restart a CSS animation class. The old trick (remove it, read el.offsetWidth, add it back) forced the browser to
// lay out the whole page right then, several times per hit in battle, which was a big part of the battle lag.
// Now: if the class isn't on, just add it; if it is, take it off and put it back two frames later (once a frame
// has been drawn without it). `others` are classes to drop first (e.g. the other size of shake).
function restartAnim(el, cls, others = []) {
  if (!el) return;
  others.forEach(c => c !== cls && el.classList.remove(c));
  if (!el.classList.contains(cls)) { el.classList.add(cls); return; }
  el.classList.remove(cls);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add(cls)));
}

// An element's screen box, remembered for a moment. Effects ask for the same few boxes many times per hit (HP
// boxes, wheels), and every fresh read right after a DOM change forces a layout. Battle boxes don't move, so a
// reading up to 400ms old is fine.
const rectCache = new WeakMap();
function cachedRect(el) {
  const now = performance.now(), c = rectCache.get(el);
  if (c && now - c.t < 400) return c.r;
  const r = el.getBoundingClientRect();
  rectCache.set(el, { t: now, r });
  return r;
}
