// Ambient fireflies drifting around the map. They're drawn on the weather canvas (rain.js) in board coordinates,
// so they move with the camera. (They used to be 2 DOM elements each with CSS animations; those animations used
// CSS variables, which made the browser restyle every firefly on every frame — the board's biggest lag.)

const LOW_POWER = matchMedia('(pointer: coarse)').matches; // tablets/phones: fewer fireflies
const FIREFLY_COUNT = LOW_POWER ? 14 : 40;      // spread anywhere over the map
const OPEN_FIREFLY_COUNT = LOW_POWER ? 12 : 36; // extra ones that gather in open grass (between tiles and around the board)
const FIREFLY_REACH = 400;     // how far past the board's edges fireflies can spawn
const FIREFLY_SIZE = 18;       // glow diameter in board units

// Is this spot open grass (not on or right next to a tile)?
const isOpenSpot = (x, y) => !cells.some(([cx, cy, w, h]) => x > cx - 12 && x < cx + w + 12 && y > cy - 12 && y < cy + h + 12);
function openSpot() {
  for (let tries = 0; tries < 200; tries++) {
    const x = -FIREFLY_REACH + Math.random() * (width + FIREFLY_REACH * 2);
    const y = -FIREFLY_REACH + Math.random() * (height + FIREFLY_REACH * 2);
    if (isOpenSpot(x, y)) return [x, y];
  }
  return [Math.random() * width, Math.random() * height];
}

// The glow, drawn once to a small canvas and stamped for every firefly
const fireflySprite = document.createElement('canvas');
fireflySprite.width = fireflySprite.height = 36;
(() => {
  const g = fireflySprite.getContext('2d'), r = 18;
  const grad = g.createRadialGradient(r, r, 0, r, r, r);
  grad.addColorStop(0, '#fffbb0'); grad.addColorStop(0.22, '#fffbb0');
  grad.addColorStop(0.33, '#e8ff6acc'); grad.addColorStop(0.66, '#c8ff3a44'); grad.addColorStop(1, '#c8ff3a00');
  g.fillStyle = grad;
  g.fillRect(0, 0, 36, 36);
})();

// Each firefly sways left/right and bobs up/down on different timings, which traces a lazy looping path
let fireflies = [];
function spawnFireflies() {
  fireflies = [];
  for (let i = 0; i < FIREFLY_COUNT + OPEN_FIREFLY_COUNT; i++) {
    const open = i >= FIREFLY_COUNT;
    const [hx, hy] = open ? openSpot() : [-FIREFLY_REACH + Math.random() * (width + FIREFLY_REACH * 2), -FIREFLY_REACH + Math.random() * (height + FIREFLY_REACH * 2)];
    // How far it roams; the open-area ones stay closer to home so they hang around the clearings
    const rx = open ? 15 + Math.random() * 30 : 30 + Math.random() * 70;
    const ry = open ? 10 + Math.random() * 25 : 20 + Math.random() * 60;
    const tx = (6 + Math.random() * 10) * 1000, ty = (5 + Math.random() * 9) * 1000; // ms per sway / bob
    fireflies.push({ hx, hy, rx, ry, wx: Math.PI / tx, wy: Math.PI / ty, px: Math.random() * 7, py: Math.random() * 7 });
  }
}
// Called by the weather loop with the canvas already in board coordinates
function drawFireflies(ctx, t, area) {
  if (!fireflies.length) return;
  ctx.globalAlpha = 0.9;
  const s = FIREFLY_SIZE, h = s / 2;
  for (const f of fireflies) {
    const x = f.hx - f.rx * Math.cos(t * f.wx + f.px), y = f.hy - f.ry * Math.cos(t * f.wy + f.py); // smooth back-and-forth
    if (x < area.x - s || x > area.x + area.w + s || y < area.y - s || y > area.y + area.h + s) continue; // off screen
    ctx.drawImage(fireflySprite, x - h, y - h, s, s);
  }
  ctx.globalAlpha = 1;
}
spawnFireflies(); // the Swamp's fireflies (later regions rebuild the board without them)
