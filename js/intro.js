// Story intro: a short storybook that plays when a game starts (after picking 1 or 2 players, before the pets).
// Each page has a little scene and its text typed out; tap the text to finish it, Next to turn the page.
// "Skip intro" (top right) jumps straight to the game at any point.

const INTRO_PAGES = [
  { title: 'Long ago...', scene: 'shatter', sound: ['heavy_slam', 0.8],
    text: 'Long ago, the <b>Crown of the Wild</b> was destroyed, releasing a wave of magical energy across the world.' },
  { scene: 'corrupt', sound: ['bite', 0.9],
    text: 'Every animal caught in the wave was changed by it. Their instincts became twisted, making them <b>aggressive and territorial</b>.' },
  { scene: 'underground', sound: ['hop', 0.8],
    text: 'However, <b>frogs and turtles</b> were underground when the Crown shattered. They were protected from the first wave, so they never became corrupted.' },
  { scene: 'friends', sound: ['heal', 1],
    text: "Generations later, the Crown's power still fills the world, but frogs and turtles are naturally resistant to it. That's why <b>you, your rival frog and Shelly</b> are peaceful, while almost every other animal has turned hostile." },
  { scene: 'pieces', sound: ['jackpot', 0.9],
    text: "Now the Crown's power is suddenly growing stronger again, and its <b>three pieces</b> have revealed themselves across the world. Whoever reunites them will gain control over the Crown's power." },
  { scene: 'race', sound: ['dice_land', 1],
    text: '<b>Two frogs</b> decide to race for them.' },
  { title: 'Your goal', scene: 'map', sound: ['level_up', 1], last: true,
    text: 'Beat your rival to all <b>three Crowns</b> and become the first frog to reunite the Crown of the Wild. The race takes you through the <b>Swamp</b>, <b>Ice Lake</b> and <b>Volcano</b>, where corrupted animals and their powerful guardians stand between you and the Crowns.' },
];

// The little scene above each page's text (plain emoji + CSS animation)
const INTRO_SCENES = {
  shatter: `<div class="is-crown">👑</div><div class="is-wave"></div><div class="is-wave w2"></div>
    <span class="is-shard s1">✦</span><span class="is-shard s2">✦</span><span class="is-shard s3">✦</span>`,
  corrupt: `<div class="is-row">${['🐗', '🦅', '🐍', '🐻', '🦈'].map((a, i) => `<span class="is-beast" style="--d:${i * 0.12}s">${a}</span>`).join('')}</div>`,
  underground: `<div class="is-sky"><span class="is-wave flat"></span></div><div class="is-ground"><span class="is-hide">🐸</span><span class="is-hide t">🐢</span></div>`,
  friends: `<div class="is-row"><span class="is-pal">🐸</span><span class="is-pal rival">🐸</span><span class="is-pal">🐢<span class="is-hat">🎩</span></span></div>`,
  pieces: `<div class="is-row">${[0, 1, 2].map(i => `<span class="is-piece" style="--d:${i * 0.25}s">👑</span>`).join('')}</div>`,
  race: `<div class="is-track"><span class="is-racer">🐸</span><span class="is-racer rival">🐸</span><span class="is-flag">🏁</span></div>`,
  map: `<div class="is-row is-map">${[['🐸', 'Swamp'], ['🧊', 'Ice Lake'], ['🌋', 'Volcano']].map(([icon, name], i) =>
    `<div class="is-stop" style="--d:${i * 0.3}s"><span>${icon}</span><span class="is-mini">👑</span><small>${name}</small></div>${i < 2 ? '<span class="is-arrow">➜</span>' : ''}`).join('')}</div>`,
};

async function playIntro() {
  const el = document.createElement('div');
  el.className = 'intro-overlay';
  el.innerHTML = `<button class="intro-skip">Skip intro ⏭</button>
    <div class="intro-book"><div class="intro-title"></div><div class="intro-scene"></div><div class="intro-text"></div>
      <div class="intro-foot"><div class="intro-dots"></div><button class="intro-next"></button></div></div>`;
  document.body.appendChild(el);
  const title = el.querySelector('.intro-title'), scene = el.querySelector('.intro-scene'), text = el.querySelector('.intro-text');
  const next = el.querySelector('.intro-next'), dots = el.querySelector('.intro-dots');
  let skipped = false, turn = () => {};
  el.querySelector('.intro-skip').onclick = () => { skipped = true; turn(); };
  for (let i = 0; i < INTRO_PAGES.length && !skipped; i++) {
    const pg = INTRO_PAGES[i];
    title.textContent = pg.title || '';
    title.hidden = !pg.title;
    scene.className = 'intro-scene is-' + pg.scene;
    scene.innerHTML = INTRO_SCENES[pg.scene];
    dots.innerHTML = INTRO_PAGES.map((_, k) => `<span class="${k === i ? 'on' : k < i ? 'done' : ''}"></span>`).join('');
    next.textContent = pg.last ? '🐸 Begin the race!' : 'Next ▶';
    restartAnim(el.querySelector('.intro-book'), 'turn');
    sfx(...pg.sound);
    if (pg.scene === 'shatter') flash('#ffd23f', 0.35);
    const finish = typeText(text, pg.text); // tutorial.js: types it out; tapping the text finishes it
    // Next: if the text is still typing, the first tap finishes it; the next tap turns the page
    const plain = pg.text.replace(/<[^>]+>/g, '');
    await new Promise(res => { turn = res; next.onclick = () => (text.textContent.length < plain.length ? finish() : res()); });
  }
  text._stop?.();
  if (!skipped) { sfx('celebrate'); confetti(40); }
  el.classList.add('out');
  await sleep(250);
  el.remove();
}
