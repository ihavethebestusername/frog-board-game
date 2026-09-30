// Companion pets: each player picks a buddy at the start. It follows the frog around the board, helps in
// battles (see petTurnStart / petTurnEnd in battle.js) and evolves as its owner levels up.

const PET_STAGE_LEVELS = [1, 5, 10]; // player level needed for stage 1 / 2 / 3
const PETS = [
  { key: 'dragonfly', name: 'Zippy the Dragonfly', icons: ['🦟', '🐝', '🐉'],
    desc: s => `Strikes the foe for ${s}× your damage after your battle turn${s >= 3 ? ' (can crit)' : ''}` },
  { key: 'snail', name: 'Shellby the Snail', icons: ['🐌', '🐚', '🐢'],
    desc: s => s === 1 ? '+1 shield every other battle turn' : s === 2 ? '+1 shield every battle turn' : '+1 shield every battle turn, sometimes +2' },
  { key: 'firefly', name: 'Glim the Firefly', icons: ['✨', '🌟', '☀️'],
    desc: s => `Heals you ${[4, 7, 10][s - 1]}% of your max HP at the start of each battle turn` },
  { key: 'ladybug', name: 'Dot the Ladybug', icons: ['🐞', '🦋', '🦚'],
    desc: s => `+${s * 5}% crit chance and +${s * 5}% luck` },
];
const petOf = p => p && p.pet ? PETS.find(x => x.key === p.pet) : null;
const petStage = p => (p.level || 1) >= PET_STAGE_LEVELS[2] ? 3 : (p.level || 1) >= PET_STAGE_LEVELS[1] ? 2 : 1;
const petIcon = p => { const k = petOf(p); return k ? k.icons[petStage(p) - 1] : ''; };

// Ladybug is passive: keep its stat bonus in step with its stage
function applyPetStats(p) {
  if (p.pet !== 'ladybug') return;
  const want = petStage(p) * 0.05, have = p.petBonus || 0;
  if (want === have) return;
  p.critChance = Math.min(1, +(p.critChance + want - have).toFixed(3));
  p.luck = Math.min(1, +(p.luck + want - have).toFixed(3));
  p.petBonus = want;
}

// Pick screen for one player
function pickPet(p) {
  const el = document.createElement('div');
  el.className = 'prog-overlay';
  el.innerHTML = `<div class="shop-panel prog-panel prog-wide"><h2>🐾 ${p.name}, choose your buddy!</h2>
    <div class="battle-msg">Your pet follows you, helps in battles and evolves at levels ${PET_STAGE_LEVELS[1]} and ${PET_STAGE_LEVELS[2]}.</div>
    <div class="perk-row">${PETS.map(k => `<button class="perk-card pet-card"><span class="perk-icon pet-bob">${k.icons[0]}</span><b>${k.name}</b>
      <small>${k.desc(1)}</small><small class="pet-evo">${k.icons.join(' → ')}</small></button>`).join('')}</div></div>`;
  document.body.appendChild(el);
  return new Promise(res => el.querySelectorAll('.pet-card').forEach((b, i) => b.onclick = () => {
    p.pet = PETS[i].key;
    p.petShown = 1;
    applyPetStats(p);
    sfx('level_up'); burst(b, ['#ffd23f', '#fff', '#5fd13a'], 30, 1.2);
    setTimeout(() => { el.remove(); res(); }, 300);
  }));
}
async function choosePets() {
  for (const p of SOLO ? [players[0]] : players) await pickPet(p);
  render();
}

// Board follower: a little pet next to each frog, moving with it
function renderPets() {
  players.forEach(p => {
    if (!p.pet || !p.el || p.el.hidden) { if (p.petEl) p.petEl.hidden = true; return; }
    if (!p.petEl) {
      p.petEl = document.createElement('div');
      p.petEl.className = 'pet-follow';
      world.appendChild(p.petEl);
    }
    const [cx, cy] = center(p);
    p.petEl.hidden = false;
    p.petEl.textContent = petIcon(p);
    p.petEl.style.left = (cx + 14) + 'px';
    p.petEl.style.top = (cy + 6) + 'px';
    // Evolved since we last looked: celebrate
    const st = petStage(p);
    if (st > (p.petShown || 1)) {
      p.petShown = st;
      applyPetStats(p);
      const k = petOf(p);
      banner(`🐾 ${k.name.split(' ')[0]} evolved! ${k.icons[st - 2]} → ${k.icons[st - 1]}`, 'legendary');
      sfx('level_up'); sfx('celebrate', 1.2, 0.7); confetti(60);
      burst(p.petEl, ['#ffd23f', '#fff', '#5fd13a'], 30, 1.2);
    }
  });
}
