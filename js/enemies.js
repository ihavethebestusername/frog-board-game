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
  body.innerHTML = '<div class="tier-list">' + ENEMY_TIERS.map((t, i) => `
    <button class="tier-btn" data-i="${i}" style="--c:${t.color}">
      <span class="tier-art">${t.art}</span>
      <span class="tier-info"><b>${t.label}: ${t.name}</b>
        <small>❤️ ${t.hp} HP · ⚔️ ${t.attack} · Win ${COIN} ${t.reward}+ · Lose ${t.loss}</small></span>
    </button>`).join('') + '</div>';
  go.hidden = true;
  const tier = await new Promise(resolve =>
    body.querySelectorAll('.tier-btn').forEach(b => b.onclick = () => { sfx('button_click'); resolve(ENEMY_TIERS[+b.dataset.i]); }));
  go.hidden = false;
  await battleEvent(makeEnemy(tier));
}
