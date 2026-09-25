// Water balloons: bought in the shop, then thrown with the 💧 buttons, but only while someone is
// answering a math question (the buttons only appear while the quiz panel is open).
// Throwing one makes the screen look soaked for 3 seconds: the quiz wobbles and blurs under streaming water.

const BALLOON_PRICE = 4;
const SPLASH_MS = 3000;
const balloonBar = document.getElementById('balloons');
let splashing = false;

const quizEl = document.getElementById('check');
// Each player has their own balloons (p.balloons). A player's button only shows while their
// OPPONENT is answering a question, e.g. "💧 P2 ×2" appears during Player 1's quiz.
function renderBalloons() {
  balloonBar.innerHTML = '';
  if (quizEl.hidden) return;
  players.forEach((p, i) => {
    if (!p.balloons || p === players[turn]) return; // can't soak yourself
    const b = document.createElement('button');
    b.className = 'balloon-btn';
    b.textContent = `💧 P${i + 1} ×${p.balloons}`;
    b.onclick = () => throwBalloon(p);
    balloonBar.appendChild(b);
  });
}

function throwBalloon(p) {
  if (splashing || !p.balloons || quizEl.hidden || p === players[turn]) return;
  p.balloons--;
  renderBalloons();
  splashing = true;
  sfx('big_hit', 0.9, 1.3); // beam sound
  sfx('leech', 1.3, 0.8);   // plus a wet splat
  // Soaked look: the quiz wobbles and blurs, and water streams down the screen (all GPU-friendly CSS)
  document.body.classList.add('soaked');
  const water = document.createElement('div');
  water.className = 'water-drips';
  water.innerHTML = '<div class="water-layer"></div><div class="water-layer two"></div>';
  document.body.appendChild(water);
  setTimeout(() => water.classList.add('fading'), SPLASH_MS - 700);
  setTimeout(() => {
    document.body.classList.remove('soaked');
    water.remove();
    splashing = false;
  }, SPLASH_MS);
}

// Show/hide the buttons whenever the quiz panel opens or closes
new MutationObserver(renderBalloons).observe(quizEl, { attributes: true, attributeFilter: ['hidden'] });
renderBalloons();
