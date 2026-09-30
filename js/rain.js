// Light drizzle locked to the map: drops live in board coordinates and are drawn with the camera's
// current transform, so they pan and zoom with the map (and flip with the screen on Player 2's turn).
// Drawn on one screen-sized canvas above the board but under the HUD.

const RAIN_DROPS = 70;
const WIND = 0.18; // sideways drift per unit fallen
const rainCanvas = document.createElement('canvas');
rainCanvas.className = 'rain';
view.appendChild(rainCanvas);
const rainCtx = rainCanvas.getContext('2d');

// Thin rain streaks don't need a retina canvas: drawing at 1x is 4x fewer pixels on an iPad
const RAIN_DPR = 1;
function sizeRain() {
  const dpr = RAIN_DPR;
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
  alpha: [0.18, 0.28, 0.38][Math.floor(Math.random() * 3)], // 3 brightness levels, so drops draw in 3 batches
  land: 0.3 + Math.random() * 0.7,       // how far down the view it lands
});
let drops = null;
// Weather for the current region: 'rain' (Swamp), 'snow' (Ice Lake) or 'embers' (Volcano)
let WEATHER = 'rain';
function setWeather(w) { WEATHER = w; drops = null; splashes.length = 0; }
const splashes = [];

let lastRain = performance.now(), rainFrame = 0, rainCovered = false;
// Reading the camera's live transform forces a style recalculation, so only do it while the camera is
// actually moving (a CSS transition) or its target changed; otherwise reuse the last matrix.
let camMoving = false, camMatrix = null, camStyle = '';
world.addEventListener('transitionrun', e => { if (e.target === world) camMoving = true; });
world.addEventListener('transitionend', e => { if (e.target === world) { camMoving = false; camMatrix = null; } });
world.addEventListener('transitioncancel', e => { if (e.target === world) { camMoving = false; camMatrix = null; } });
// Full-screen menus hide the board, so the rain can rest while one is open
const RAIN_COVERS = '#check:not([hidden]), #shop:not([hidden]), #battle:not([hidden]), #hand:not([hidden]), #flies:not([hidden]), #cups:not([hidden]), #fuse:not([hidden]), #events:not([hidden])';
(function drawRain(t) {
  const dt = Math.min(50, t - lastRain);
  lastRain = t;
  if (rainFrame++ % 20 === 0) {
    rainCovered = !!document.querySelector(RAIN_COVERS);
    document.body.classList.toggle('board-covered', rainCovered); // pauses ambient board animations (style.css)
  }
  if (rainCovered || document.hidden) { requestAnimationFrame(drawRain); return; }
  const dpr = RAIN_DPR;
  // The camera's live transform (includes its pan/zoom animations)
  if (camMoving || !camMatrix || camStyle !== world.style.transform) {
    camMatrix = new DOMMatrix(getComputedStyle(world).transform);
    camStyle = world.style.transform;
  }
  const m = camMatrix;
  const area = visibleArea(m);
  drops ||= Array.from({ length: RAIN_DROPS }, () => newDrop(area, true));

  rainCtx.setTransform(1, 0, 0, 1, 0, 0);
  rainCtx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
  rainCtx.setTransform(new DOMMatrix([dpr, 0, 0, dpr, 0, 0]).multiply(m));
  rainCtx.lineWidth = 1 / m.a; // keep streaks 1px thin at any zoom
  rainCtx.lineCap = 'round';

  if (WEATHER !== 'rain') { drawFlakes(t, dt, area, m); requestAnimationFrame(drawRain); return; }
  const batches = new Map(); // alpha -> drops to stroke in one path
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
    if (!batches.has(d.alpha)) batches.set(d.alpha, []);
    batches.get(d.alpha).push(d);
  }
  for (const [alpha, list] of batches) {
    rainCtx.strokeStyle = `rgba(190, 220, 255, ${alpha})`;
    rainCtx.beginPath();
    for (const d of list) { rainCtx.moveTo(d.x, d.y); rainCtx.lineTo(d.x - d.len * WIND, d.y - d.len); }
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

// Snow drifts down slowly and sways; embers float up and flicker. Batched into one path per brightness.
function drawFlakes(t, dt, area, m) {
  const snow = WEATHER === 'snow', batches = new Map();
  for (const d of drops) {
    d.phase = d.phase ?? Math.random() * 6;
    const move = d.speed * dt * (snow ? 0.22 : 0.18);
    d.y += snow ? move : -move;
    d.x += Math.sin(t / 700 + d.phase) * (snow ? 0.35 : 0.25);
    if (d.y > area.y + area.h + 20 || d.y < area.y - 30 || d.x < area.x - 60 || d.x > area.x + area.w + 60) {
      Object.assign(d, newDrop(area, false));
      d.x = area.x + Math.random() * area.w;
      d.y = snow ? area.y - 10 : area.y + area.h + 10;
      continue;
    }
    if (!batches.has(d.alpha)) batches.set(d.alpha, []);
    batches.get(d.alpha).push(d);
  }
  const r = (snow ? 1.8 : 1.4) / m.a * 1.6;
  for (const [alpha, list] of batches) {
    rainCtx.fillStyle = snow ? `rgba(255, 255, 255, ${alpha + 0.35})` : `rgba(255, ${140 + Math.round(alpha * 200)}, 60, ${alpha + 0.4})`;
    rainCtx.beginPath();
    for (const d of list) { rainCtx.moveTo(d.x + r, d.y); rainCtx.arc(d.x, d.y, r * (0.6 + d.len / 20), 0, Math.PI * 2); }
    rainCtx.fill();
  }
}
function stopRainSound() { try { rainAudio?.pause(); } catch (e) {} }

// --- Rain ambience: sounds/rain.mp3 on a loop, softened (quiet + muffled with a low-pass filter) ---
// Browsers only allow sound after the player taps something, so this starts from the start menu.
const RAIN_VOLUME = 0.07;     // overall loudness (kept very low: background only)
const RAIN_MUFFLE_HZ = 700;   // lower = softer, more muffled
let rainAudio = null;
function startRainSound() {
  if (rainAudio) return;
  rainAudio = new Audio('sounds/rain.mp3');
  rainAudio.loop = true;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const src = ctx.createMediaElementSource(rainAudio);
    const muffle = ctx.createBiquadFilter();
    muffle.type = 'lowpass';
    muffle.frequency.value = RAIN_MUFFLE_HZ;
    const gain = ctx.createGain();
    gain.gain.value = RAIN_VOLUME;
    src.connect(muffle).connect(gain).connect(ctx.destination);
    ctx.resume();
  } catch (e) {
    rainAudio.volume = RAIN_VOLUME; // no Web Audio: just play it quietly
  }
  rainAudio.play().catch(() => {});
}
