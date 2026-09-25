// Light drizzle locked to the map: drops live in board coordinates and are drawn with the camera's
// current transform, so they pan and zoom with the map (and flip with the screen on Player 2's turn).
// Drawn on one screen-sized canvas above the board but under the HUD.

const RAIN_DROPS = 70;
const WIND = 0.18; // sideways drift per unit fallen
const rainCanvas = document.createElement('canvas');
rainCanvas.className = 'rain';
view.appendChild(rainCanvas);
const rainCtx = rainCanvas.getContext('2d');

function sizeRain() {
  const dpr = window.devicePixelRatio || 1;
  rainCanvas.width = view.clientWidth * dpr;
  rainCanvas.height = view.clientHeight * dpr;
}
sizeRain();
addEventListener('resize', sizeRain);

// The part of the board currently on screen, in board coordinates (camera matrix inverted)
function visibleArea(m) {
  const inv = m.inverse();
  const a = inv.transformPoint(new DOMPoint(0, 0));
  const b = inv.transformPoint(new DOMPoint(view.clientWidth, view.clientHeight));
  return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) };
}

const newDrop = (area, anywhere) => ({
  x: area.x - 40 + Math.random() * (area.w + 80),
  y: anywhere ? area.y + Math.random() * area.h : area.y - 10 - Math.random() * 40,
  len: 6 + Math.random() * 7,            // streak length (board units)
  speed: 0.22 + Math.random() * 0.15,    // board units per ms
  alpha: 0.15 + Math.random() * 0.25,
  land: 0.3 + Math.random() * 0.7,       // how far down the view it lands
});
let drops = null;
const splashes = [];

let lastRain = performance.now();
(function drawRain(t) {
  const dt = Math.min(50, t - lastRain);
  lastRain = t;
  const dpr = window.devicePixelRatio || 1;
  // The camera's live transform (includes its pan/zoom animations)
  const m = new DOMMatrix(getComputedStyle(world).transform);
  const area = visibleArea(m);
  drops ||= Array.from({ length: RAIN_DROPS }, () => newDrop(area, true));

  rainCtx.setTransform(1, 0, 0, 1, 0, 0);
  rainCtx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
  rainCtx.setTransform(new DOMMatrix([dpr, 0, 0, dpr, 0, 0]).multiply(m));
  rainCtx.lineWidth = 1 / m.a; // keep streaks 1px thin at any zoom
  rainCtx.lineCap = 'round';

  for (const d of drops) {
    const fall = d.speed * dt;
    d.y += fall;
    d.x += fall * WIND;
    // Land partway down (leaving a ripple), or recycle drops the camera has moved away from
    const offscreen = d.y > area.y + area.h + 20 || d.x < area.x - 60 || d.x > area.x + area.w + 60 || d.y < area.y - 80;
    if (offscreen || d.y > area.y + area.h * d.land) {
      if (!offscreen) splashes.push({ x: d.x, y: d.y, age: 0 });
      Object.assign(d, newDrop(area, offscreen && d.y < area.y + area.h));
      continue;
    }
    rainCtx.strokeStyle = `rgba(190, 220, 255, ${d.alpha})`;
    rainCtx.beginPath();
    rainCtx.moveTo(d.x, d.y);
    rainCtx.lineTo(d.x - d.len * WIND, d.y - d.len);
    rainCtx.stroke();
  }
  // Ripples on the ground: small ellipses that grow and fade, staying where they landed on the map
  for (let i = splashes.length - 1; i >= 0; i--) {
    const s = splashes[i];
    s.age += dt;
    const k = s.age / 400;
    if (k >= 1) { splashes.splice(i, 1); continue; }
    rainCtx.strokeStyle = `rgba(190, 220, 255, ${0.35 * (1 - k)})`;
    rainCtx.beginPath();
    rainCtx.ellipse(s.x, s.y, 2 + k * 5, 1 + k * 1.6, 0, 0, Math.PI * 2);
    rainCtx.stroke();
  }
  requestAnimationFrame(drawRain);
})(lastRain);
