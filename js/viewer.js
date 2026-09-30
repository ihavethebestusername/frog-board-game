// Card animation viewer (Events menu → "Card animations"): every card in the game in tabs. Tap one to watch its
// battle animation on a practice stage (two HP boxes and three wheels, like a real battle), with buttons to
// replay each part. It calls the same hooks the battle does (see js/card-fx.js), so what you see is what plays.

const VIEWER_TABS = [
  { name: '🐸 Frog cards', cards: () => CARD_TYPES },
  { name: '🐷 Swamp enemies', cards: () => [...BOSS_CARDS, ...EVOLVED_CARDS] },
  { name: '🧊 Ice Lake', cards: () => REGION_CARDS.filter(c => c.region === 'ice'), region: 'ice' },
  { name: '🌋 Volcano', cards: () => REGION_CARDS.filter(c => c.region === 'volcano'), region: 'volcano' },
  { name: '✨ Battle moments', moments: true },
];
// Who uses each enemy card (shown under it), built from the regions' enemies and their evolutions
function viewerOwners() {
  const own = {};
  const addForm = (f, label) => f.loadout.forEach(n => (own[n] ||= new Set()).add(`${f.art} ${f.name}${label ? ' · ' + label : ''}`));
  REGIONS.forEach(r => {
    [...(r.tiers || []), r.boss].filter(Boolean).forEach(t => {
      addForm(t, '');
      (r.evolutions?.[t.key] || []).forEach((e, i) => addForm(e, `evolution ${i + 1}`));
    });
  });
  return own;
}

async function openAnimViewer() {
  const el = document.createElement('div');
  el.className = 'prog-overlay anim-viewer';
  document.body.appendChild(el);
  const owners = viewerOwners();
  let tab = 0;
  const done = new Promise(res => el.addEventListener('viewer-close', res));

  function showList() {
    const t = VIEWER_TABS[tab];
    el.innerHTML = `<div class="shop-panel prog-panel prog-wide viewer-panel"><h2>🎬 Card animations</h2>
      <div class="viewer-tabs">${VIEWER_TABS.map((x, i) => `<button class="${i === tab ? 'on' : ''}" data-tab="${i}">${x.name}</button>`).join('')}</div>
      ${t.moments ? `<div class="battle-msg">Tap one to watch it.</div><div class="viewer-moments">${VIEWER_MOMENTS.map((m, i) =>
        `<button class="battle-go" data-m="${i}">${m.name}</button>`).join('')}</div>`
      : `<div class="battle-msg">Tap a card to watch its animation.</div><div class="hand-grid viewer-grid">${t.cards().map((c, i) =>
        `<div class="viewer-card" data-i="${i}">${cardFace(c, 0, c.region || BOSS_CARDS.includes(c) || EVOLVED_CARDS.includes(c) ? 7 : 3)}` +
        `${owners[c.name] ? `<small>${[...owners[c.name]][0]}${owners[c.name].size > 1 ? ` +${owners[c.name].size - 1}` : ''}</small>` : ''}</div>`).join('')}</div>`}
      <button class="shop-close">Close</button></div>`;
    el.querySelectorAll('[data-tab]').forEach(b => b.onclick = async () => {
      tab = +b.dataset.tab; sfx('card_pick');
      if (VIEWER_TABS[tab].region) await loadRegionFx(VIEWER_TABS[tab].region); // their card looks come with their effects
      showList();
    });
    el.querySelectorAll('.viewer-card').forEach(b => b.onclick = () => { sfx('card_pick'); showCard(t.cards()[+b.dataset.i], t.region); });
    el.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { sfx('card_pick'); showMoment(VIEWER_MOMENTS[+b.dataset.m]); });
    el.querySelector('.shop-close').onclick = () => { el.remove(); el.dispatchEvent(new Event('viewer-close')); };
  }

  // The practice stage: a battle panel with the player (left), the attacker (right, for enemy cards) and 3 wheels
  function stage(card, others, enemyCard) {
    el.innerHTML = `<div class="shop-panel battle-panel viewer-stage"><div class="shop-head" style="justify-content:center"><h2>${card ? card.art + ' ' + card.name : ''}</h2></div>
      <div class="battle-msg viewer-desc"></div>
      <div class="hp-row"><div class="hp"><div class="who">🐸 You</div><div class="hp-bar"></div><div class="hp-num">120 / 160</div><div class="status"></div></div>
        <div class="hp"><div class="who">${enemyCard ? '👾 Enemy' : '🐸 Rival'}</div><div class="hp-bar"></div><div class="hp-num">300 / 400</div><div class="status"></div></div></div>
      <div class="wheels">${[0, 1, 2].map(i => `<div class="wheel-window"><div class="wheel-pointer"></div><div class="wheel">` +
        `<div class="wheel-slot" style="transform: rotateX(0deg) translateZ(45px)">${cardFace(i === 0 || !others.length ? card : others[(i - 1) % others.length], 0, 7)}</div></div></div>`).join('')}</div>
      <div class="viewer-btns"></div>
      <button class="shop-close">Back</button></div>`;
    el.querySelector('.shop-close').onclick = () => { fxLayer.innerHTML = ''; showList(); };
    const panel = el.querySelector('.viewer-stage'), boxes = el.querySelectorAll('.hp-row .hp');
    const mk = (p, hp, maxHp) => ({ p, hp, maxHp, shield: 0, poison: 0, poisonDmg: 0, stunned: 0, doubleNext: 0 });
    const fighters = [mk({ name: 'You', attack: 3 }, 120, 160), mk({ name: 'Enemy', attack: 7, enemy: !!enemyCard, element: card?.element }, 300, 400)];
    // Enemy cards attack from the right-hand box; frog cards from the left
    const side = enemyCard ? 1 : 0;
    const ctx = (s, extra = {}) => ({ panel, side: s, attacker: fighters[s], defender: fighters[1 - s],
      from: boxes[s], to: boxes[1 - s], fromXY: fxPoint(boxes[s]), toXY: fxPoint(boxes[1 - s]), ...extra });
    const win = i => el.querySelectorAll('.wheel-window')[i];
    return { panel, fighters, side, ctx, win, slot: () => win(0).querySelector('.wheel-slot'), buttons: el.querySelector('.viewer-btns'), desc: el.querySelector('.viewer-desc') };
  }

  async function showCard(card, region) {
    if (region) await loadRegionFx(region); // the Ice Lake / Volcano effects load on demand
    const pool = VIEWER_TABS[tab].cards().filter(c => c !== card);
    const enemyCard = !CARD_TYPES.includes(card);
    const s = stage(card, pool.slice(0, 2), enemyCard);
    s.desc.innerHTML = `${card.text(enemyCard ? 7 : 3)}${card.superMove ? ' · <b>SUPER MOVE</b>' : ''}`;
    const g = card.gimmick, pre = g === 'cleave' || g === 'frenzy';
    let playing = 0;
    const land = () => {
      const w = s.win(0), sl = s.slot();
      sl.classList.remove('lit'); w.classList.remove('landed'); void w.offsetWidth;
      sl.classList.add('lit'); w.classList.add('landed');
      sfx(g ? 'card_land_gimmick' : 'card_land_attack');
      cardLandFx(card, s.ctx(s.side, { win: w, slot: sl }));
    };
    const strike = async (crit, h = 0, hits = 1) => {
      const dmg = Math.round(s.fighters[s.side].p.attack * Math.max(1, card.mult || 1) * (crit ? 2 : 1));
      await cardWindupFx(card, s.ctx(s.side, { card, crit, dmg, big: card.mult >= 5, strike: h, strikes: hits }));
      cardImpactFx(card, s.ctx(s.side, { card, crit, dmg, big: card.mult >= 5, blocked: false, strike: h, strikes: hits }));
      sfx(crit ? 'big_hit' : 'hit');
      if (crit) battleFx('crit', s.ctx(s.side, { card, crit, dmg }));
      if (card.name.toLowerCase().includes('slam') || card.mult >= 7) sfx('heavy_slam', 1, 0.8);
    };
    const attack = async crit => {
      const hits = g === 'frenzy' ? 3 : 1;
      for (let h = 0; h < hits; h++) { if (h) await sleep(Math.max(180, 380 - h * 60)); await strike(crit, h, hits); }
    };
    const gimmick = blocked => {
      if (!g) return;
      s.fighters[1 - s.side].shield = blocked ? 2 : 0;
      gimmickFx(g, s.ctx(s.side, { card, win: s.win(0), blocked }));
    };
    // The whole card, in battle order: land, (super move), cleave/frenzy, the strike(s), then its gimmick
    const full = async crit => {
      land(); await sleep(450);
      if (card.superMove) if (typeof superMoveFx === 'function') await superMoveFx(card, s.ctx(s.side, { card, win: s.win(0) }));
      if (pre) { gimmick(!!crit); await sleep(250); }
      if (card.mult > 0) await attack(crit);
      if (g && !pre) { await sleep(150); gimmick(false); }
    };
    const btn = (label, fn) => {
      const b = document.createElement('button');
      b.className = 'battle-go'; b.textContent = label;
      b.onclick = async () => { const n = ++playing; fxLayer.innerHTML = ''; try { await fn(); } catch (e) { console.warn('viewer', e); } if (n === playing) playing = 0; };
      s.buttons.appendChild(b);
    };
    btn('▶ Play', () => full(false));
    if (card.mult > 0) btn('💥 Play as a crit', () => full(true));
    btn('🎰 Land', land);
    if (card.mult > 0) btn('⚔️ Attack', () => attack(false));
    if (g) btn(`✨ ${g[0].toUpperCase() + g.slice(1)}`, () => gimmick(false));
    if (g === 'cleave') btn('🛡️ Smash shields', () => gimmick(true));
    if (card.superMove) btn('🌟 Super move', () => typeof superMoveFx === 'function' && superMoveFx(card, s.ctx(s.side, { card, win: s.win(0) })));
    await sleep(200);
    full(false);
  }

  function showMoment(m) {
    const s = stage(null, [], !!m.kind);
    el.querySelector('.viewer-stage h2').textContent = m.name;
    s.desc.textContent = m.desc;
    const play = () => { fxLayer.innerHTML = ''; m.run(s); };
    const b = document.createElement('button');
    b.className = 'battle-go'; b.textContent = '▶ Play again'; b.onclick = play;
    s.buttons.appendChild(b);
    (m.kind ? loadRegionFx(m.kind === 'frost' ? 'ice' : 'volcano') : Promise.resolve()).then(() => setTimeout(play, 200));
  }

  showList();
  await done;
}

// Battle moments that aren't a single card: status ticks, skipped turns, shields blocking, crits, knockouts.
// The player (left box) is on the receiving end, except for the enemy's shields blocking your hit.
const VIEWER_MOMENTS = [
  { name: '🧪 Poison tick', desc: 'Poison hurts at the start of a turn', run: s => { s.fighters[0].dotKind = null; battleFx('poisonTick', s.ctx(1, { dmg: 9 })); } },
  { name: '❄️ Frostbite tick', kind: 'frost', desc: 'Ice Lake frostbite hurts at the start of a turn', run: s => { s.fighters[0].dotKind = 'frost'; battleFx('poisonTick', s.ctx(1, { dmg: 9 })); } },
  { name: '🔥 Burn tick', kind: 'fire', desc: 'Volcano burns hurt at the start of a turn', run: s => { s.fighters[0].dotKind = 'fire'; battleFx('poisonTick', s.ctx(1, { dmg: 9 })); } },
  { name: '🟢 Stunned', desc: 'A stunned frog skips its turn', run: s => { s.fighters[0].stunKind = null; battleFx('stunSkip', s.ctx(1)); } },
  { name: '🧊 Frozen solid', kind: 'frost', desc: 'Frozen by an Ice Lake monster: skip a turn', run: s => { s.fighters[0].stunKind = 'frost'; battleFx('stunSkip', s.ctx(1)); } },
  { name: '💫 Dazed', kind: 'fire', desc: 'Dazed by a Volcano monster: skip a turn', run: s => { s.fighters[0].stunKind = 'fire'; battleFx('stunSkip', s.ctx(1)); } },
  { name: '🪷 Shield block', desc: 'A lily pad shield soaks up a hit', run: s => { s.fighters[1].p.element = undefined; s.fighters[1].shield = 1; battleFx('block', s.ctx(0, { dmg: 0, blocked: true })); } },
  { name: '🧊 Ice shield block', kind: 'frost', desc: "An Ice Lake monster's shield soaks up your hit", run: s => { s.fighters[1].p.element = 'frost'; s.fighters[1].shield = 1; battleFx('block', s.ctx(0, { dmg: 0, blocked: true })); } },
  { name: '🪨 Magma shield block', kind: 'fire', desc: "A Volcano monster's shield soaks up your hit", run: s => { s.fighters[1].p.element = 'fire'; s.fighters[1].shield = 1; battleFx('block', s.ctx(0, { dmg: 0, blocked: true })); } },
  { name: '💥 Critical hit', desc: 'Any card landing a crit', run: s => battleFx('crit', s.ctx(0, { dmg: 40, crit: true })) },
  { name: '🏆 Knockout', desc: 'The finishing blow', run: s => battleFx('ko', s.ctx(0)) },
];
