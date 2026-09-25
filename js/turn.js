// Turn state and rolling the die / hopping around the board.

let turn = 0, busy = false;
// Show a die face using the dice_1..dice_6 sprites
function showDieFace(n) {
  dieEl.innerHTML = `<img src="sprites/dice_${n}.png" alt="${n}">`;
}
// Preload the faces so switching between them never flickers, and start on 1
for (let n = 1; n <= 6; n++) new Image().src = `sprites/dice_${n}.png`;
showDieFace(1);
// At a fork, highlight the possible next tiles and wait for the player to tap one
function pickNext(p) {
  const opts = nextOf[p.pos];
  if (opts.length === 1) return Promise.resolve(opts[0]);
  label.textContent = `${p.name}: pick a path!`;
  return new Promise(resolve => {
    opts.forEach(o => {
      squareEls[o].classList.add('fork-option');
      squareEls[o].onclick = () => {
        opts.forEach(x => { squareEls[x].classList.remove('fork-option'); squareEls[x].onclick = null; });
        label.textContent = `${p.name}'s turn`;
        resolve(o);
      };
    });
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function rollDice() {
  if (busy) return;
  busy = true;
  render();
  // Flick through random faces (slowing down), then the real roll lands with a pop and a burst
  dieEl.classList.remove('rolled');
  // Dice sound loops for the whole flicking animation, then stops when the die lands
  const rollSound = sfx('dice_roll');
  if (rollSound) rollSound.loop = true;
  for (let i = 0; i < 12; i++) {
    showDieFace(1 + Math.floor(Math.random() * 6));
    await sleep(50 + i * 8);
  }
  if (rollSound) rollSound.pause();
  const roll = 1 + Math.floor(Math.random() * 6);
  showDieFace(roll);
  sfx('dice_land', 1.15 - roll * 0.05); // bigger rolls land a little deeper
  void dieEl.offsetWidth;
  dieEl.classList.add('rolled');
  burst(dieEl, ['#ffd23f', '#fff', '#f90', '#ff5d5d'], 14 + roll * 4, 0.8 + roll * 0.12);
  flash(roll === 6 ? '#ffd23f' : '#fff', roll === 6 ? 0.55 : 0.2);
  await sleep(450);
  // Hop one square at a time, turning to face each step
  const p = players[turn];
  p.el.src = SPRITES.jumping;
  for (let s = 0; s < roll; s++) {
    // Each hop in a row is quicker than the last; the slide, hop arc and camera all match its speed
    const hopMs = Math.max(160, 400 * 0.8 ** s), turnMs = Math.max(60, 200 * 0.75 ** s);
    p.el.style.transitionDuration = `${hopMs}ms, ${hopMs}ms, ${Math.min(250, turnMs)}ms`;
    p.el.style.animationDuration = hopMs + 'ms';
    world.style.transitionDuration = hopMs + 'ms';
    const nxt = await pickNext(p); // asks the player at forks
    faceNext(p, nxt);
    render();
    await sleep(turnMs);
    // Takeoff dust on the first jump only
    if (s === 0) dust(p, 8);
    p.pos = nxt;
    sfx('hop', 0.85 + s * 0.08);
    // Hop: frog arcs up (grows + shadow) while it slides to the next square
    restartAnim(p.el, 'hopping');
    render();
    await sleep(hopMs);
    // Final landing: kick up a cloud of dust and thump the square
    if (s === roll - 1) {
      restartAnim(squareEls[p.pos], 'land-big');
      dust(p, 14);
    }
  }
  p.el.src = SPRITES.standing;
  p.el.style.transitionDuration = p.el.style.animationDuration = world.style.transitionDuration = '';
  // Landing on a coin square pays out
  if (COIN_SQUARES[p.pos]) await coinEvent(COIN_SQUARES[p.pos]);
  if (CARD_SQUARES.includes(p.pos)) await cardEvent();
  if (BATTLE_SQUARES.includes(p.pos)) await battleEvent();
  if (FUSE_SQUARES.includes(p.pos)) await fuseEvent();
  await sleep(400);
  // Hand over to the other player; the camera pans to them
  turn = 1 - turn;
  busy = false;
  render();
}
