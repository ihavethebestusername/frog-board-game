// Optional FPS counter, toggled from the Events menu ("Show FPS")
let fpsEl = null;
function toggleFps() {
  if (fpsEl) { fpsEl.remove(); fpsEl = null; return; }
  fpsEl = document.createElement('div');
  fpsEl.className = 'fps';
  document.body.appendChild(fpsEl);
  let frames = 0, last = performance.now();
  (function count(t) {
    if (!fpsEl) return;
    frames++;
    if (t - last >= 500) {
      const fps = Math.round(frames * 1000 / (t - last));
      fpsEl.textContent = fps + ' FPS';
      fpsEl.style.color = fps >= 50 ? '#9dff7a' : fps >= 30 ? '#ffd23f' : '#ff5d5d';
      frames = 0; last = t;
    }
    requestAnimationFrame(count);
  })(last);
}
