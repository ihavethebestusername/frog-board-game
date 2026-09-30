// Enemy squares: pick a difficulty, then fight that enemy in a normal slot-machine battle.

async function enemyEvent() {
  const el = document.getElementById('battle');
  const title = document.getElementById('battleTitle');
  const msg = document.getElementById('battleMsg');
  const body = document.getElementById('battleBody');
  const go = document.getElementById('battleGo');
  el.hidden = false;
  title.textContent = '👾 Enemy!';
  msg.textContent = 'Choose how tough an enemy to fight. Harder = more HP and damage, but much bigger rewards.';
  const tiers = ENEMY_TIERS.map(scaleTier); // stats grow with the threat level
  if (threatLevel()) msg.textContent += ` ☠️ Threat ${threatLevel()}: they're stronger now!`;
  body.innerHTML = '<div class="tier-list">' + tiers.map((t, i) => `
    <button class="tier-btn" data-i="${i}" style="--c:${t.color}">
      <span class="tier-art">${t.art}</span>
      <span class="tier-info"><b>${t.label}: ${t.name}</b>
        <small>❤️ ${t.hp} HP · ⚔️ ${t.attack} · Win ${COIN} ${t.reward}+ · Lose ${t.loss}</small>
        <small>Drops ${ARTIFACTS[artifactKey(t)].art} ${ARTIFACTS[artifactKey(t)].name}</small></span>
    </button>`).join('') + '</div>';
  go.hidden = true;
  const tier = await new Promise(resolve =>
    body.querySelectorAll('.tier-btn').forEach(b => b.onclick = () => { sfx('button_click'); resolve(ENEMY_TIERS[+b.dataset.i]); }));
  go.hidden = false;
  await battleEvent(makeEnemy(tier));
}

// Boss square: no choosing, the region's boss is waiting
async function bossEvent() {
  const hunter = players[turn];
  hunter.lapsSinceBoss = 0; hunter.bossHunting = false; // fighting the boss calls off the hunt
  const el = document.getElementById('battle');
  const t = scaleTier(BOSS_TIER); // grows with the threat level
  el.hidden = false;
  document.getElementById('battleTitle').textContent = `${t.art}${t.weapon} ${isFinalRegion() ? 'FINAL ' : ''}BOSS FIGHT!`;
  document.getElementById('battleMsg').textContent = `The ${t.name} ${isFinalRegion() ? 'rises from the lava...' : 'blocks the way to the next region...'}`;
  document.getElementById('battleBody').innerHTML = `<div class="boss-intro"><div class="boss-art">${t.art}<span>${t.weapon}</span></div>
    <b>${t.name}</b><small>❤️ ${t.hp} HP · ⚔️ ${t.attack} · Win ${COIN} ${t.reward}+ and the ${ARTIFACTS[artifactKey(t)].name} · Lose ${t.loss}</small>
    <div class="hand-grid">${[...new Set(t.loadout)].map(n => [...BOSS_CARDS, ...EVOLVED_CARDS, ...REGION_CARDS, ...CARD_TYPES].find(c => c.name === n)).filter(Boolean).map(c => cardFace(c, 0, t.attack)).join('')}</div></div>`;
  sfx('heavy_slam', 0.75, 1); // the boss arrives
  flash('#c2185b', 0.4);
  await new Promise(r => { const go = document.getElementById('battleGo'); go.hidden = false; go.disabled = false; go.textContent = 'Face the boss'; go.onclick = r; });
  await battleEvent(makeEnemy(BOSS_TIER)); // makeEnemy applies the threat scaling itself
}
