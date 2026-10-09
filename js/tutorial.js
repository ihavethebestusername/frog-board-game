// Tutorials, narrated by Shelly the turtle shopkeeper.
//  - The main tour: offered when a game starts. It spotlights each part of the screen, has mini demos you
//    play (a quiz, the battle wheels) and ends by having you tap Roll. Skippable at any point.
//  - Square tutorials: the first time you land on each kind of square, Shelly explains it with a small
//    interactive demo before it starts. Skippable, and "Skip all tutorials" turns them off for good.
// What you've seen is remembered in this browser (localStorage), so returning players aren't nagged.

const TUT_KEY = 'frogTutorials';
const tutStore = (() => { try { return JSON.parse(localStorage.getItem(TUT_KEY)) || {}; } catch (e) { return {}; } })();
const tutSave = () => { try { localStorage.setItem(TUT_KEY, JSON.stringify(tutStore)); } catch (e) {} };
const tutSeen = key => tutStore.off || tutStore[key];
const tutMark = key => { tutStore[key] = true; tutSave(); };

// ---------- Shared pieces: Shelly's card with a typewriter speech bubble ----------
function shellyCard() {
  const card = document.createElement('div');
  card.className = 'tut-card';
  card.innerHTML = `<div class="tut-shelly"><span class="tut-turtle">🐢</span><span class="tut-hat">🎩</span></div>
    <div class="tut-body"><div class="tut-name">Shelly</div><div class="tut-text"></div><div class="tut-demo"></div>
      <div class="tut-foot"><div class="tut-dots"></div><div class="tut-btns"></div></div></div>`;
  return card;
}
// Types the text out letter by letter (tap the bubble to finish it instantly)
function typeText(el, text) {
  el._stop?.(); // a new step stops the previous one still typing
  el.textContent = '';
  let i = 0, done = false, timer;
  const finish = () => { if (done) return; done = true; clearInterval(timer); el.innerHTML = text; };
  el._stop = () => { done = true; clearInterval(timer); };
  const plain = text.replace(/<[^>]+>/g, '');
  timer = setInterval(() => {
    i += 2;
    el.textContent = plain.slice(0, i);
    if (i % 6 === 0) sfx('card_hover', 1.6 + Math.random() * 0.3, 0.25); // little chatter blips
    if (i >= plain.length) finish();
  }, 22);
  el.onclick = finish;
  return finish;
}
function tutButtons(card, list) {
  const box = card.querySelector('.tut-btns');
  box.innerHTML = '';
  return new Promise(res => list.forEach(b => {
    const btn = document.createElement('button');
    btn.className = 'tut-btn' + (b.primary ? ' primary' : '') + (b.small ? ' small' : '');
    btn.textContent = b.label;
    btn.disabled = !!b.disabled;
    if (b.id) btn.dataset.id = b.id;
    btn.onclick = () => res(b.value);
    box.appendChild(btn);
  }));
}
const tutDots = (card, n, i) => card.querySelector('.tut-dots').innerHTML = Array.from({ length: n }, (_, k) => `<span class="${k === i ? 'on' : k < i ? 'done' : ''}"></span>`).join('');
function shellyHop(card) {
  const t = card.querySelector('.tut-shelly');
  restartAnim(t, 'talk');
}

// ---------- Interactive demos (each resolves when the player has done it) ----------
const DEMOS = {
  // A practice math question
  quiz(box) {
    const a = 3 + Math.floor(Math.random() * 6), b = 3 + Math.floor(Math.random() * 6), ans = a * b;
    const choices = choicesFor(ans);
    box.innerHTML = `<div class="demo-q">${a} × ${b} = ?</div><div class="demo-choices">${choices.map((c, i) =>
      `<button style="--c:${QUIZ_COLORS[i]}">${c}</button>`).join('')}</div>`;
    return new Promise(res => box.querySelectorAll('button').forEach(btn => btn.onclick = () => {
      if (+btn.textContent === ans) { btn.classList.add('right'); sfx('coin', 1.2); burst(btn, ['#5fd13a', '#fff', '#ffd23f'], 20, 1); setTimeout(res, 500); }
      else { btn.classList.add('wrong'); sfx('fail', 1.2, 0.5); }
    }));
  },
  // Three mini wheels that spin and land on a jackpot
  wheels(box) {
    const faces = ['👅', '🐸', '📢', '🥚', '🪷'];
    box.innerHTML = `<div class="demo-wheels">${[0, 1, 2].map(() => `<div class="demo-wheel"><span>❔</span></div>`).join('')}</div><button class="tut-btn primary demo-go">🎰 Spin!</button>`;
    return new Promise(res => box.querySelector('.demo-go').onclick = async e => {
      e.target.disabled = true;
      const wheels = [...box.querySelectorAll('.demo-wheel span')];
      for (let w = 0; w < 3; w++) {
        for (let k = 0; k < 8 + w * 4; k++) { wheels[w].textContent = faces[(k + w) % faces.length]; sfx('wheel_tick', 1 + k * 0.03, 0.6); await sleep(45 + k * 4); }
        wheels[w].textContent = '👑';
        wheels[w].parentElement.classList.add('lit');
        sfx('card_land_attack');
      }
      sfx('jackpot'); confetti(50); burst(box, ['#ffd23f', '#fff'], 30, 1.2);
      box.insertAdjacentHTML('beforeend', '<div class="demo-note">🎰 JACKPOT! 3 of a kind = ×3 damage!</div>');
      setTimeout(res, 700);
    });
  },
  // Follow the gem under the shuffling mushrooms
  cups(box) {
    box.innerHTML = `<div class="demo-cups">${[0, 1, 2].map(i => `<div class="demo-cup" style="--i:${i}"><span class="demo-gem">💎</span><img src="sprites/cup.png" alt=""></div>`).join('')}</div><div class="demo-note">Watch the gem...</div>`;
    const cups = [...box.querySelectorAll('.demo-cup')], note = box.querySelector('.demo-note');
    let order = [0, 1, 2]; // order[spot] = cup index
    const place = () => cups.forEach((c, i) => c.style.transform = `translateX(${(order.indexOf(i) - 1) * 76}px)`);
    place();
    cups[1].classList.add('up');
    return new Promise(async res => {
      await sleep(900); cups[1].classList.remove('up'); await sleep(400);
      for (let k = 0; k < 5; k++) { const a = k % 3, b = (k + 1) % 3; [order[a], order[b]] = [order[b], order[a]]; place(); sfx('card_pick', 0.9, 0.5); await sleep(380); }
      note.textContent = 'Which one has the gem? Tap it!';
      cups.forEach((c, i) => c.onclick = () => {
        cups.forEach(x => x.onclick = null);
        cups[1].classList.add('up');
        if (i === 1) { note.textContent = '✨ You found it!'; sfx('jackpot', 1, 0.6); confetti(30); }
        else { c.classList.add('up'); note.textContent = 'Not that one, but now you know how it works!'; sfx('fail', 1.2, 0.5); }
        setTimeout(res, 700);
      });
    });
  },
  // Catch the fly
  flies(box) {
    box.innerHTML = `<div class="demo-pond"><div class="demo-fly">🪰<b>+5</b></div><div class="demo-frog">🐸</div></div><div class="demo-note">Tap the fly to catch it with your tongue!</div>`;
    return new Promise(res => box.querySelector('.demo-fly').onclick = e => {
      const fly = e.currentTarget;
      fly.classList.add('caught'); sfx('card_pick', 1.3); sfx('coin', 1.1, 0.5);
      box.querySelector('.demo-note').textContent = 'Gulp! Its number joins your equation: 10 + 5';
      setTimeout(res, 800);
    });
  },
  // Flip two pairs
  memory(box) {
    const tiles = [['3 × 4', 'a'], ['12', 'a'], ['5²', 'b'], ['25', 'b']].sort(() => Math.random() - 0.5);
    box.innerHTML = `<div class="demo-mem">${tiles.map(t => `<div class="demo-tile"><span>${t[0]}</span></div>`).join('')}</div><div class="demo-note">Flip two tiles that match!</div>`;
    const els = [...box.querySelectorAll('.demo-tile')];
    let open = [], found = 0;
    return new Promise(res => els.forEach((el, i) => el.onclick = async () => {
      if (open.includes(i) || el.classList.contains('matched') || open.length === 2) return;
      el.classList.add('flipped'); sfx('card_pick', 1.1); open.push(i);
      if (open.length < 2) return;
      const [a, b] = open;
      if (tiles[a][1] === tiles[b][1]) {
        els[a].classList.add('matched'); els[b].classList.add('matched'); found++; comboSfx(found); open = [];
        if (found === 2) { box.querySelector('.demo-note').textContent = '🧠 Perfect memory!'; confetti(30); setTimeout(res, 600); }
      } else { await sleep(600); els[a].classList.remove('flipped'); els[b].classList.remove('flipped'); open = []; }
    }));
  },
  // Tap while the needle is in the green
  hop(box) {
    box.innerHTML = `<div class="demo-bar"><div class="demo-zone"></div><div class="demo-needle"></div></div><button class="tut-btn primary demo-go">HOP!</button><div class="demo-note">Tap HOP when the needle is in the green!</div>`;
    const needle = box.querySelector('.demo-needle'), bar = box.querySelector('.demo-bar'), note = box.querySelector('.demo-note');
    let pos = 0, dir = 1, last = performance.now(), live = true;
    (function frame(t) { if (!live) return; pos += dir * 0.8 * (t - last) / 1000; last = t; if (pos > 1) { pos = 1; dir = -1; } if (pos < 0) { pos = 0; dir = 1; }
      needle.style.transform = `translateX(${pos * bar.clientWidth}px)`; requestAnimationFrame(frame); })(last);
    return new Promise(res => box.querySelector('.demo-go').onclick = () => {
      if (pos >= 0.4 && pos <= 0.62) { live = false; note.textContent = '🪷 Boing! Nice timing!'; sfx('hop', 1.2); comboSfx(1); burst(bar, ['#5fd13a', '#fff'], 20, 1); setTimeout(res, 600); }
      else { note.textContent = 'Splash! Try again: wait for the green.'; sfx('fail', 1.3, 0.4); }
    });
  },
  // Open the mystery chest
  chest(box) {
    box.innerHTML = `<div class="demo-chest">🎁</div><div class="demo-note">Tap the chest to open it!</div>`;
    return new Promise(res => box.querySelector('.demo-chest').onclick = e => {
      const prizes = ['💰', '🃏', '⭐', '🔮', '🌀'];
      e.currentTarget.textContent = prizes[Math.floor(Math.random() * prizes.length)];
      e.currentTarget.classList.add('open'); sfx('jackpot', 1.1, 0.6); confetti(30);
      box.querySelector('.demo-note').textContent = 'Could be treasure... or a trap!';
      setTimeout(res, 700);
    });
  },
  // Pick 1 of 3 face-down cards
  cards(box) {
    const arts = ['👅', '🧪', '👑'];
    box.innerHTML = `<div class="demo-cards">${arts.map(a => `<div class="demo-card"><span class="b">🐸</span><span class="f">${a}</span></div>`).join('')}</div><div class="demo-note">Tap a card to pick it!</div>`;
    return new Promise(res => box.querySelectorAll('.demo-card').forEach(c => c.onclick = () => {
      box.querySelectorAll('.demo-card').forEach(x => x.classList.add('flipped'));
      c.classList.add('chosen'); sfx('card_land_gimmick', 1.1);
      box.querySelector('.demo-note').textContent = 'Nice pick! The other two go back into the deck.';
      setTimeout(res, 700);
    }));
  },
  // Upgrade a card's rarity
  forge(box) {
    box.innerHTML = `<div class="demo-forge"><div class="demo-rare r1">👅<small>RARE</small></div><span class="demo-arrow">➜</span><div class="demo-rare r2">👅<small>EPIC</small></div></div><button class="tut-btn primary demo-go">💎 Upgrade!</button>`;
    return new Promise(res => box.querySelector('.demo-go').onclick = e => {
      e.target.disabled = true;
      box.querySelector('.r2').classList.add('glow'); sfx('level_up'); burst(box.querySelector('.r2'), ['#a855f7', '#fff'], 24, 1);
      setTimeout(res, 700);
    });
  },
};

// ---------- Square tutorials ----------
const SQUARE_TUTORIALS = {
  coins: { title: '🪙 Coin squares', steps: [
    { text: 'A <b>coin square</b>! I\'ll ask you a math question. Answer <b>fast</b> for more coins, but a wrong answer loses some!' },
    { text: 'Give it a try, no pressure:', demo: 'quiz' },
    { text: 'Get 3 right in a row for a 🔥 streak that doubles your coins!' }] },
  cards: { title: '🃏 Card squares', steps: [
    { text: 'Card squares ask you questions too. Every right answer earns you a card, but one wrong answer ends the streak.' },
    { text: 'For each card you earn, you <b>pick 1 of 3</b>. Try it:', demo: 'cards' },
    { text: 'Get <b>all 4 right</b> and you can buy a <b>card pack</b>: draw your cards from one playstyle, like Crit or Poison, instead of the deck. I offer 3 packs at a time, and you can <b>re-roll</b> them for coins. Better packs cost more, and <b>monster packs</b> (like the Swamp Serpent pack) are rare, and only show up once you\'ve unlocked their monster cards!' },
    { text: 'Your hand holds up to 12 cards, so choose ones that fit your playstyle!' }] },
  battle: { title: '⚔️ Battles', steps: [
    { text: 'Time to fight! First you pick 3–6 cards for your <b>loadout</b>. Each turn, 3 wheels spin through them.' },
    { text: 'Land the same card on 2 wheels for a PAIR, or 3 for a JACKPOT. Go on, spin:', demo: 'wheels' },
    { text: 'Shields block hits, poison ticks every turn, and saws spin again. Watch the health bars!' }] },
  boss: { title: '🐷 The Boss', steps: [
    { text: 'Uh oh... a <b>region boss</b>! Every region has one guarding the way forward, and they are very tough, with their own attacks.' },
    { text: 'Beat it to <b>travel to the next region</b> (the Volcano boss wins the game!), but lose and your stats drop 25%. Bring your best cards!' },
    { text: 'No exact roll needed: hop <b>past</b> a boss square and you can stop to fight. Avoid him for 2 laps and he\'ll come hunting YOU!' }] },
  fuse: { title: '⚗️ Fusion', steps: [
    { text: 'The fusion lab moves a <b>gimmick</b> from one card onto another. The first card gets used up.' },
    { text: 'For example, put Poison onto your strongest attack card and it poisons AND hits hard!' }] },
  forge: { title: '💎 Rarity Forge', steps: [
    { text: 'The forge raises a card\'s rarity by one step, and every step adds damage.' },
    { text: 'Try it:', demo: 'forge' },
    { text: 'Legendary cards become <b>MYTHICAL</b>, with their own special gimmick!' }] },
  cups: { title: '🍄 Cup game', steps: [
    { text: 'A prize card goes under one mushroom. They shuffle, and you pick where it went!' },
    { text: 'Practice round:', demo: 'cups' },
    { text: 'More cups is harder but pays better... and the ULTIMATE level hides the <b>Orbital Laser</b>. 🛰️' }] },
  flies: { title: '🪰 Frog Math Swarm', steps: [
    { text: 'Tap to shoot your tongue at flies. Each fly\'s number joins your equation using the operation on the side.' },
    { text: 'Catch one:', demo: 'flies' },
    { text: 'Go for big numbers! At the end you solve the equation to cash in. Missing costs 25%.' }] },
  memory: { title: '🧠 Memory Match', steps: [
    { text: 'Flip tiles to match each <b>problem</b> with its <b>answer</b> before time runs out!' },
    { text: 'Try these:', demo: 'memory' },
    { text: 'At the end, solve the equation made from your matches for the full reward.' }] },
  hop: { title: '🪷 Lily Pad Hop', steps: [
    { text: 'Hop across the pond by tapping when the needle hits the <b>green</b>. Gold is a perfect hop!' },
    { text: 'Practice:', demo: 'hop' },
    { text: 'Each pad adds a term to your equation. Solve it at the end to collect!' }] },
  mystery: { title: '❓ Mystery tiles', steps: [
    { text: 'Ooh, a mystery chest! It could be treasure, a card, a charm... or an ambush!' },
    { text: 'Open it:', demo: 'chest' }] },
  shop: { title: '🛒 My shop!', steps: [
    { text: 'Welcome to my shop! Upgrades live on the <b>Upgrade Tree</b>, charms build playstyles, and the Traps tab is for sneaky frogs.' },
    { text: 'Buying upgrades ends with a quick quiz when you leave. Answer fast to make them stronger!' },
    { text: 'The <b>Dice</b> tab has special dice: a Short Die to land exactly on a square, a High Die to zoom ahead, and more. Each one lasts 3 rolls. Choose which die to roll with the little button above the die!' }] },
};
async function squareTutorial(key) {
  const tut = SQUARE_TUTORIALS[key];
  if (!tut || tutSeen(key)) return;
  tutMark(key);
  const el = document.createElement('div');
  el.className = 'tut-overlay';
  const card = shellyCard();
  card.classList.add('center');
  card.querySelector('.tut-name').textContent = `Shelly · ${tut.title}`;
  el.appendChild(card);
  document.body.appendChild(el);
  sfx('card_land_gimmick', 1.2, 0.6);
  for (let i = 0; i < tut.steps.length; i++) {
    const step = tut.steps[i], last = i === tut.steps.length - 1;
    tutDots(card, tut.steps.length, i);
    shellyHop(card);
    typeText(card.querySelector('.tut-text'), step.text);
    const demoBox = card.querySelector('.tut-demo');
    demoBox.innerHTML = '';
    const btns = [{ label: 'Skip', value: 'skip', small: true }, { label: 'Skip all tutorials', value: 'off', small: true },
                  { label: last ? 'Got it! 👍' : 'Next ➜', value: 'next', primary: true, disabled: !!step.demo, id: 'next' }];
    const pick = tutButtons(card, btns);
    if (step.demo) DEMOS[step.demo](demoBox).then(() => { const n = card.querySelector('[data-id="next"]'); if (n) { n.disabled = false; n.classList.add('ready'); } });
    const v = await pick;
    if (v === 'off') { tutStore.off = true; tutSave(); break; }
    if (v === 'skip') break;
    sfx('card_pick', 1.2, 0.6);
  }
  el.classList.add('out');
  await sleep(220);
  el.remove();
}

// ---------- Passing a boss square: fight or sneak past? ----------
async function bossBlocksPath() {
  const el = document.createElement('div');
  el.className = 'tut-overlay';
  const card = shellyCard();
  card.classList.add('center', 'boss-block');
  card.querySelector('.tut-turtle').textContent = BOSS_TIER.art;
  card.querySelector('.tut-hat').textContent = BOSS_TIER.weapon || '';
  card.querySelector('.tut-name').textContent = `The ${BOSS_TIER.name}`;
  el.appendChild(card);
  document.body.appendChild(el);
  sfx('heavy_slam', 0.8, 1); flash('#8a0a2a', 0.3);
  shellyHop(card);
  typeText(card.querySelector('.tut-text'), `The ${BOSS_TIER.name} <b>blocks your path</b>! Stop and fight it here, or sneak past?`);
  const v = await tutButtons(card, [{ label: '🥷 Sneak past', value: false }, { label: '⚔️ Fight!', value: true, primary: true }]);
  el.remove();
  return v;
}

// ---------- Meeting the rival on the board: duel? ----------
async function duelPrompt(p) {
  const r = rivalPlayer(p);
  const el = document.createElement('div');
  el.className = 'tut-overlay';
  const card = shellyCard();
  card.classList.add('center');
  el.appendChild(card);
  document.body.appendChild(el);
  shellyHop(card);
  sfx('card_land_attack', 0.8);
  typeText(card.querySelector('.tut-text'), `Ooh, you caught up with <b>${r.name}</b>! Challenge them to a duel? The winner takes coins` +
    (hasBounty(r) ? ` and, since they're way ahead, <b>steals a lap</b>!` : '!'));
  const v = await tutButtons(card, [{ label: 'Keep hopping', value: false }, { label: '⚔️ Duel!', value: true, primary: true }]);
  el.remove();
  return v;
}

// ---------- The main tour ----------
// Steps: `target` is spotlighted; `tap: true` means the player must tap it (the real button is clicked and the
// tour carries on inside whatever menu opened); `demo` plays a mini game; `when` skips steps that don't apply.
const TOUR = [
  { text: 'Hi there! I\'m <b>Shelly</b>, the swamp shopkeeper. 🐢 Let me show you around. You\'ll tap the real buttons as we go!' },
  { text: 'Your adventure: 🐸 Swamp → 🧊 Ice Lake → 🌋 Volcano. Do <b>3 laps</b> of a region (past 🏁 START) to unlock its boss, then beat it for a <b>grand crown 👑</b>. Collect all <b>3 grand crowns</b> to win!', target: '.prog-crowns' },
  { text: 'Tap <b>Roll</b> to roll the die and hop 1–6 squares. At a fork, you choose the way!', target: '.hud' },
  { text: 'Almost every square does something! Here\'s the swamp guide:', legend: true },
  { text: 'Math is your superpower. Most squares ask a quick question: faster answers = bigger rewards. Try one!', demo: 'quiz' },
  { text: 'These are your <b>coins</b>. Spend them in my shop!', target: '#wallet' },
  // Cards menu
  { text: 'Let\'s look at your cards. <b>Tap the Cards button!</b>', target: '#handBtn', tap: true },
  { text: 'This is your hand. Cards you collect show up here, sorted into <b>playstyle tabs</b>. Tap an attack card to give it a <b>🧠 skill check</b> (answer fast = more damage). Your charms and artifacts are listed below.', target: '#hand .shop-panel' },
  { text: 'Now <b>tap Close</b> to put your cards away.', target: '#handClose', tap: true },
  // Shop
  { text: 'Next, my favourite place. <b>Tap the Shop button!</b>', target: '#shopBtn', tap: true, before: () => tutMark('shop') },
  { text: 'That\'s me! I\'ll chat with you while you shop. 🐢', target: '#shop .keeper' },
  { text: 'The shop has <b>tabs</b>: Upgrades, Charms, Items, Traps, and Sell for turning cards into coins.', target: '#shop .shop-tabs' },
  { text: 'The <b>Upgrade Tree</b> makes your frog stronger: health, damage, crits, luck and money.', target: '#shop .tree-open' },
  { text: '<b>Tap the Charms tab.</b>', target: '#shop .shop-tab[data-tab="charms"]', tap: true },
  { text: 'Charms push a <b>playstyle</b>: crits, poison, tanking, saws, combos, healing or gold. Pick one and go all in!', target: '#shop .shop-page' },
  // Traps (2-player only)
  { text: 'Playing against a friend? Then you\'ll love this. <b>Tap the Traps tab!</b>', target: '#shop .shop-tab[data-tab="traps"]', tap: true, when: () => !SOLO },
  { text: 'Buy <b>traps</b> to set on the board: 🪤 Coin Snare steals coins, 🟫 Sticky Mud stops them dead, 🫧 Bubble Trap bounces them away, 🦝 Card Thief swipes a card. <b>Curses</b> hit your rival right away: a 🥚 Rotten Egg card or a 🐈‍⬛ Jinx that halves their next roll!', target: '#shop .shop-page', when: () => !SOLO },
  { text: 'Once you own a trap, a <b>🪤 Set trap</b> button appears at the top right. Tap it, pick a trap, then tap any tile. Traps are <b>hidden</b> on your rival\'s turn... but careful: your own traps catch you 25% of the time!', when: () => !SOLO },
    { text: 'Okay, <b>tap Close</b> to leave the shop.', target: '#shopClose', tap: true },
  // HUD + bounties
  { text: 'Here\'s your ⭐ <b>level</b> and XP (every level-up gives you a perk, and higher levels <b>unlock the monsters&#39; own attacks</b> for your deck: the boss cards at level 15!), your 👑 crowns and the ☠️ threat.', target: '.prog-hud' },
  { text: 'These timers count down to <b>swamp events</b>, <b>stronger monsters</b>, <b>new boss tiles</b> and <b>evolutions</b>. Plan ahead!', target: '.prog-countdown' },
  { text: '<b>Tap Bounties!</b>', target: '.prog-quest-btn', tap: true },
  { text: 'Bounties are little goals. Finish one for coins and XP, and a new one appears.', target: '#questBoard .quest' },
  { text: 'The rules of the game are always written here too, in case you forget.', target: '#questBoard .prog-goal' },
  { text: '<b>Tap Close</b>.', target: '#questBoard .shop-close', tap: true },
  // Battles and rivalry
  { text: 'Battles spin 3 wheels of your cards. Matching cards make combos. Spin these!', demo: 'wheels' },
  { text: 'Two players? Whoever\'s behind is the 🐢 <b>underdog</b> (+1 to rolls, extra card choices, +25% coins). Get 2 laps ahead and you wear a 🎯 <b>bounty</b>: lose a duel and your rival steals a lap! Hop onto your rival to challenge them.', when: () => !SOLO },
  { text: 'Lose a monster fight and you\'ll want <b>😤 revenge</b>: +30% damage in your next battle. Never give up!', when: () => SOLO },
  { text: 'That\'s everything! <b>Tap Roll</b> to begin. Good luck, little frog! 🐸', target: '#roll', tap: true, final: true },
];
const TILE_LEGEND = [
  ['coins', '🪙', 'Coins'], ['cards', '🃏', 'Cards'], ['battle', '⚔️', 'Battle'], ['enemy', '👾', 'Enemy'], ['boss', '🐷', 'Boss'],
  ['shop', '🛒', 'Shop'], ['mystery', '❓', 'Mystery'], ['fuse', '⚗️', 'Fusion'], ['forge', '💎', 'Forge'],
  ['cups', '🍄', 'Cups'], ['flies', '🪰', 'Math Swarm'], ['memory', '🧠', 'Match'], ['hop', '🪷', 'Lily Hop'],
];
// Visual rect of an element in the page's own coordinates (Player 2's screen is rotated 180°)
function tutRect(el) {
  const r = el.getBoundingClientRect();
  if (!document.documentElement.classList.contains('flipped')) return r;
  return { left: innerWidth - r.right, top: innerHeight - r.bottom, width: r.width, height: r.height, right: innerWidth - r.left, bottom: innerHeight - r.top };
}
let tourActive = false; // rolling is blocked while the tour runs (turn.js checks this)
async function runTour() {
  const root = document.createElement('div');
  root.className = 'tut-overlay tour';
  const spot = document.createElement('div');
  spot.className = 'tut-spot on';
  const ring = document.createElement('div');
  ring.className = 'tut-ring';
  const card = shellyCard();
  root.append(spot, ring, card);
  document.body.appendChild(root);
  tourActive = true;
  busy = false; render();
  const steps = TOUR.filter(s => !s.when || s.when());
  let i = 0, opened = []; // menus the tour opened (closed again if the player skips)
  while (i < steps.length) {
    const step = steps[i];
    await sleep(step.target ? 120 : 0); // let a freshly opened menu settle before measuring it
    const target = step.target && document.querySelector(step.target);
    tutDots(card, steps.length, i);
    shellyHop(card);
    if (target && target.offsetParent !== null) {
      const r = tutRect(target), pad = 8;
      const box = { left: r.left - pad + 'px', top: r.top - pad + 'px', width: r.width + pad * 2 + 'px', height: r.height + pad * 2 + 'px' };
      Object.assign(spot.style, box); Object.assign(ring.style, box);
      ring.classList.add('on');
      card.classList.toggle('top', r.top + r.height / 2 > innerHeight * 0.5);
      card.classList.remove('center');
    } else { // nothing to point at: shrink the spotlight to nothing so the whole screen dims evenly
      Object.assign(spot.style, { left: innerWidth / 2 + 'px', top: innerHeight / 2 + 'px', width: '0px', height: '0px' });
      ring.classList.remove('on');
      card.classList.remove('top');
      card.classList.add('center');
    }
    typeText(card.querySelector('.tut-text'), step.text);
    const demoBox = card.querySelector('.tut-demo');
    demoBox.innerHTML = step.legend ? `<div class="tut-legend">${TILE_LEGEND.map(([c, icon, name], k) =>
      `<div class="tut-tile square ${c}" style="animation-delay:${k * 60}ms"><span>${icon}</span><small>${name}</small></div>`).join('')}</div>` : '';
    const btns = []; // no skipping mid-tour: the player already chose to take it when Shelly asked
    if (i > 0 && !steps[i - 1].tap && !step.tap) btns.push({ label: '⬅ Back', value: 'back', small: true });
    if (!step.tap || !target) btns.push({ label: 'Next ➜', value: 'next', primary: true, disabled: !!step.demo, id: 'next' });
    const pick = tutButtons(card, btns);
    if (step.demo) DEMOS[step.demo](demoBox).then(() => { const n = card.querySelector('[data-id="next"]'); if (n) { n.disabled = false; n.classList.add('ready'); } });
    // Tap steps: the player taps the highlighted button itself
    let tapped = null;
    if (step.tap && target) {
      ring.classList.add('tap');
      tapped = new Promise(res => ring.onclick = () => res('tapped'));
    }
    const v = await Promise.race([pick, tapped].filter(Boolean));
    ring.onclick = null; ring.classList.remove('tap');
    if (v === 'skip') break;
    if (v === 'back') { i--; continue; }
    if (v === 'tapped') {
      step.before?.();
      if (step.final) { root.remove(); tutMark('tour'); tourActive = false; rollDice(); return; }
      busy = false; render(); // make sure the real button is enabled
      target.click();
      sfx('card_pick', 1.3, 0.6);
    } else sfx('card_pick', 1.2, 0.6);
    i++;
  }
  // Skipped: close anything the tour opened
  ['#handClose', '#questBoard:not([hidden]) .shop-close'].forEach(sel => { const b = document.querySelector(sel); if (b && b.offsetParent !== null) b.click(); });
  if (!document.getElementById('shop').hidden) document.getElementById('shopClose').click();
  tutMark('tour');
  tourActive = false;
  root.classList.add('out');
  await sleep(220);
  root.remove();
  render();
}
// Asked once the pets are chosen: take the tour, or skip it
async function offerTour() {
  if (tutStore.tourAsked && tutStore.off) return;
  const el = document.createElement('div');
  el.className = 'tut-overlay';
  const card = shellyCard();
  card.classList.add('center');
  el.appendChild(card);
  document.body.appendChild(el);
  shellyHop(card);
  typeText(card.querySelector('.tut-text'), tutStore.tour ? 'Welcome back! Want a quick refresher tour of the swamp?' : 'Welcome to the swamp, little frog! Want me to show you how everything works?');
  const v = await tutButtons(card, [{ label: 'Skip', value: 'skip', small: true }, { label: '🐢 Show me around!', value: 'tour', primary: true }]);
  tutStore.tourAsked = true; tutSave();
  el.remove();
  if (v === 'tour') await runTour();
}
