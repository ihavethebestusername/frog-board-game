// Sound effects and visual effects (particle bursts, screen flash, dust).

// --- Sound effects: event -> [file in sounds/, volume, base pitch]. Events without a file stay silent. ---
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
  poison:            ['slimey_hit', 0.7, 0.8],
  stun:              ['slimey_hit', 0.7, 1.2],
  leech:             ['slimey_hit', 0.7, 0.65],
  saw:               ['attack_saw', 0.8, 1],
  fail:              ['fail', 0.7, 1],
  win:               ['win', 1, 1],
};
const sfxCache = {};
// `pitch` scales the playback speed/pitch; every play also gets a small random wobble so repeats don't sound identical
// `loud` scales the volume (capped at full volume)
function sfx(name, pitch = 1, loud = 1) {
  const def = SFX[name];
  if (!def) return;
  const [file, vol, basePitch] = def;
  try {
    const base = sfxCache[file] ||= new Audio(`sounds/${file}.mp3`);
    if (base.error) return;
    const a = base.cloneNode();
    a.volume = Math.min(1, vol * loud);
    a.preservesPitch = a.mozPreservesPitch = a.webkitPreservesPitch = false; // let speed change the pitch
    a.playbackRate = Math.min(4, Math.max(0.25, basePitch * pitch * (0.94 + Math.random() * 0.12)));
    a.play().catch(() => {});
    return a; // callers can loop/stop it
  } catch (e) {}
}

// Spray particles (dots and stars) plus a shockwave ring out from the center of an element
function burst(target, colors, count = 14, power = 1) {
  if (!target) return;
  const r = target.getBoundingClientRect();
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
    const size = 7 + Math.random() * 9;
    Object.assign(d.style, { left: cx + 'px', top: cy + 'px', width: size + 'px', height: size + 'px',
                             background: colors[i % colors.length], animationDelay: Math.random() * 0.08 + 's' });
    d.style.setProperty('--dx', side * (10 + Math.random() * 28) + 'px');
    d.style.setProperty('--dy', -(3 + Math.random() * 14) + 'px');
    world.appendChild(d);
    setTimeout(() => d.remove(), 1000);
  }
}

function restartAnim(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}
