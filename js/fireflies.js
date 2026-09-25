// Ambient fireflies drifting around the map. They live inside the board (world) so they move with the camera.

const FIREFLY_COUNT = 40;      // spread anywhere over the map
const OPEN_FIREFLY_COUNT = 36; // extra ones that gather in open grass (between tiles and around the board)
const FIREFLY_REACH = 400;     // how far past the board's edges fireflies can spawn

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

// Each firefly is two nested elements: the outer one sways left/right and the inner one bobs up/down,
// on different timings, which traces a lazy looping path. It's all CSS animation (run by the GPU),
// so dozens of fireflies cost almost nothing per frame.
for (let i = 0; i < FIREFLY_COUNT + OPEN_FIREFLY_COUNT; i++) {
  const open = i >= FIREFLY_COUNT;
  const [hx, hy] = open ? openSpot() : [-FIREFLY_REACH + Math.random() * (width + FIREFLY_REACH * 2), -FIREFLY_REACH + Math.random() * (height + FIREFLY_REACH * 2)];
  // How far it roams; the open-area ones stay closer to home so they hang around the clearings
  const rx = open ? 15 + Math.random() * 30 : 30 + Math.random() * 70;
  const ry = open ? 10 + Math.random() * 25 : 20 + Math.random() * 60;
  const tx = 6 + Math.random() * 10, ty = 5 + Math.random() * 9; // seconds per sway / bob
  const sway = document.createElement('div');
  sway.className = 'firefly-sway';
  Object.assign(sway.style, { left: hx + 'px', top: hy + 'px', animationDuration: tx + 's', animationDelay: -Math.random() * tx + 's' });
  sway.style.setProperty('--rx', rx + 'px');
  const dot = document.createElement('div');
  dot.className = 'firefly';
  Object.assign(dot.style, { animationDuration: ty + 's', animationDelay: -Math.random() * ty + 's' });
  dot.style.setProperty('--ry', ry + 'px');
  sway.appendChild(dot);
  world.appendChild(sway);
}
