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
        render();
        resolve(o);
      };
    });
  });
}
// Special tiles: anything that does something when you land on it
const isSpecial = i => SHOP_SQUARES.includes(i) || COIN_SQUARES[i] || CARD_SQUARES.includes(i) ||
                       BATTLE_SQUARES.includes(i) || FUSE_SQUARES.includes(i) || ENEMY_SQUARES.includes(i) || BOSS_SQUARES.includes(i) ||
                       CUP_SQUARES.includes(i) || FLY_SQUARES.includes(i) || FORGE_SQUARES.includes(i) ||
                       MYSTERY_SQUARES.includes(i) || MEMORY_SQUARES.includes(i) || HOP_SQUARES.includes(i);
// Tiles you could end up on after exactly `steps` hops (following every fork)
function reachable(from, steps) {
  let now = new Set([from]);
  for (let s = 0; s < steps; s++) now = new Set([...now].flatMap(i => nextOf[i]));
  return [...now];
}
// Roll the die. Luck: a chance that the roll is changed to one that can reach a special tile
// (if the normal roll can't already, and some roll can)
function luckyRoll(p) {
  const roll = 1 + Math.floor(Math.random() * 6);
  const good = r => reachable(p.pos, r).some(isSpecial);
  if (Math.random() >= p.luck || good(roll)) return roll;
  const goodRolls = [1, 2, 3, 4, 5, 6].filter(good);
  return goodRolls.length ? goodRolls[Math.floor(Math.random() * goodRolls.length)] : roll;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Run the event of the square a player is standing on (also used by the mystery-tile teleport)
// A little floating number over a frog on the board (e.g. lava singeing your coins)
function floatText(p, text) {
  const [x, y] = center(p);
  const el = document.createElement('div');
  el.className = 'popup lose';
  el.textContent = text;
  Object.assign(el.style, { left: x + 'px', top: y + 'px' });
  world.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

async function runSquare(p) {
  if (COIN_SQUARES[p.pos]) await squareTutorial('coins');
  if (COIN_SQUARES[p.pos]) await coinEvent(COIN_SQUARES[p.pos]);
  if (CARD_SQUARES.includes(p.pos)) { await squareTutorial('cards'); await cardEvent(); }
  if (BATTLE_SQUARES.includes(p.pos) || ENEMY_SQUARES.includes(p.pos) || BOSS_SQUARES.includes(p.pos)) await squareTutorial('battle');
  if (BOSS_SQUARES.includes(p.pos) && bossUnlocked(p)) await squareTutorial('boss');
  if (BATTLE_SQUARES.includes(p.pos)) await (SOLO ? enemyEvent() : battleEvent()); // no opponent in solo: fight an enemy
  if (FUSE_SQUARES.includes(p.pos)) { await squareTutorial('fuse'); await fuseEvent(); }
  if (ENEMY_SQUARES.includes(p.pos)) await enemyEvent();
  if (BOSS_SQUARES.includes(p.pos)) { if (bossUnlocked(p)) await bossEvent(); else sealedBoss(p); } // crowns unlock the boss
  if (CUP_SQUARES.includes(p.pos)) { await squareTutorial('cups'); await cupEvent(); }
  if (FLY_SQUARES.includes(p.pos)) { await squareTutorial('flies'); await flyEvent(); }
  if (FORGE_SQUARES.includes(p.pos)) { await squareTutorial('forge'); await forgeEvent(); }
  if (MYSTERY_SQUARES.includes(p.pos)) { await squareTutorial('mystery'); await mysteryEvent(); }
  if (MEMORY_SQUARES.includes(p.pos)) { await squareTutorial('memory'); await memoryEvent(); }
  if (HOP_SQUARES.includes(p.pos)) { await squareTutorial('hop'); await hopEvent(); }
}

async function rollDice() {
  if (busy || !document.getElementById('menu').hidden) return; // not before a mode is picked
  if (typeof tourActive !== 'undefined' && tourActive) return; // Shelly's tour is running
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
  let roll = luckyRoll(players[turn]); // (can grow while hopping: ice slides)
  if (players[turn].jinx) { players[turn].jinx = false; roll = Math.ceil(roll / 2); banner(`🐈‍⬛ Jinxed! Roll halved to ${roll}`, 'lose'); } // Jinx curse
  onRollProgress(); // threat rises every few rolls
  showDieFace(roll);
  if (isUnderdog(players[turn])) { roll++; setTimeout(() => banner(`🐢 Underdog bonus: +1 → ${roll}`, 'legendary'), 300); } // comeback
  sfx('dice_land', 1.15 - roll * 0.05); // bigger rolls land a little deeper
  void dieEl.offsetWidth;
  dieEl.classList.add('rolled');
  burst(dieEl, ['#ffd23f', '#fff', '#f90', '#ff5d5d'], 14 + roll * 4, 0.8 + roll * 0.12);
  flash(roll === 6 ? '#ffd23f' : '#fff', roll === 6 ? 0.55 : 0.2);
  await sleep(450);
  // Hop one square at a time, turning to face each step
  const p = players[turn];
  p.el.src = SPRITES.jumping;
  let duel = false; // challenged the rival on the way
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
    progressHop(p); // passing your start tile completes a lap (+crown)
    let trapped = await checkTrap(p); // traps.js: mud stops you, a bubble bounces you away
    // Hopping over a boss square: the boss blocks the path and offers a fight (so you never need an exact roll)
    if (!trapped && s < roll - 1 && BOSS_SQUARES.includes(p.pos) && bossUnlocked(p) && await bossBlocksPath()) trapped = 'stop';
    // Hazards: lava singes you as you hop over it; landing on ice makes you slide further
    if (!trapped && HAZARD_SQUARES.includes(p.pos)) {
      if (REGION().hazard === 'lava') {
        const lost = Math.min(p.coins, 2); p.coins -= lost;
        burst(squareEls[p.pos], ['#ff6a00', '#ffd23f', '#ff2b2b'], 16, 0.8); sfx('poison', 1.4, 0.5);
        if (s === roll - 1) { p.burning = true; banner('🔥 Landed in lava! You\'ll start your next battle burning', 'lose'); flash('#ff4b1f', 0.35); }
        else if (lost) floatText(p, `🔥 -${lost}`);
      } else if (REGION().hazard === 'ice' && s === roll - 1) {
        const extra = 1 + Math.floor(Math.random() * 3);
        roll += extra; // keep hopping: slide over the ice
        banner(`🧊 Wheee! Sliding ${extra} more square${extra === 1 ? '' : 's'}!`, 'legendary');
        burst(squareEls[p.pos], ['#bfe6ff', '#fff', '#7ab8ff'], 18, 0.8); sfx('card_pick', 1.6);
      }
    }
    // Hopping onto (or past) the rival: challenge them to a duel
    if (!trapped && !SOLO && p.pos === rivalPlayer(p).pos && await duelPrompt(p)) { trapped = 'stop'; duel = true; }
    sfx('hop', 0.85 + s * 0.08);
    // Hop: frog arcs up (grows + shadow) while it slides to the next square
    restartAnim(p.el, 'hopping');
    render();
    await sleep(hopMs);
    // Final landing: kick up a cloud of dust and thump the square
    if (s === roll - 1 || trapped === 'stop') {
      restartAnim(squareEls[p.pos], 'land-big');
      dust(p, 14);
    }
    if (trapped === 'stop') break;
  }
  await checkTreasure(p); // Treasure Drop swamp event
  p.el.src = SPRITES.standing;
  p.el.style.transitionDuration = p.el.style.animationDuration = world.style.transitionDuration = '';
  // Landing on a coin square pays out
  if (isSpecial(p.pos)) { questEvent(p, 'special'); gainXp(p, 1); }
  // Avoided the boss for too long: it hunts you down, and this landing becomes a boss fight
  if (duel) await battleEvent(); // the duel replaces this square's event
  else if (p.bossHunting && bossUnlocked(p) && !BOSS_SQUARES.includes(p.pos)) {
    p.bossHunting = false;
    banner(`${BOSS_TIER.art} THE ${BOSS_TIER.name.toUpperCase()} FOUND YOU!`, 'fire'); flash('#8a0a2a', 0.5); sfx('heavy_slam', 0.75, 1);
    await sleep(900);
    await squareTutorial('battle'); await squareTutorial('boss');
    await bossEvent();
  } else await runSquare(p);
  await sleep(400);
  await endTurnProgress(p); // perk picks, hand limit, win check
  // Hand over to the other player (the camera pans to them); in solo you keep going
  if (!SOLO) turn = 1 - turn;
  turnCount++;
  busy = false;
  render();
}
