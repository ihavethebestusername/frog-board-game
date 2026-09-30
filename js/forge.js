// Rarity Forge: upgrade one card's rarity by one step (common → rare → epic → legendary → mythical).
// Each step adds damage; reaching MYTHICAL (only possible here) also gives the card its own mythic gimmick.
// Uses the Fusion panel (#fuse) for its screens.

const RARITY_STEPS = ['common', 'rare', 'epic', 'legendary', 'mythical'];
const FORGE_BONUS = 1, FORGE_MYTHIC_BONUS = 2; // extra damage multiplier per upgrade / for the mythical step

// Mythic gimmicks, one per card (by its slug). `pre` runs before the card attacks, `post` after its
// normal effects. Each gets the battle's { f, foe, wi, leeches } and returns nothing.
const MYTHIC_GIMMICKS = {
  'tadpole-tackle':  { name: 'Frog Army',        text: 'strikes 3 times',                pre: b => { b.f.doubleNext += 2; } },
  'sticky-tongue':   { name: 'Tongue Snatch',    text: 'steals a shield from the foe',   post: b => { if (b.foe.shield) { b.foe.shield--; b.f.shield++; } } },
  'big-leap':        { name: 'Earthquake',       text: 'stuns the foe for a turn',       post: b => { b.foe.stunned++; } },
  'croak-blast':     { name: 'Sonic Boom',       text: 'blasts through every shield',    pre: b => { b.foe.shield = 0; } },
  'swamp-king':      { name: 'Royal Decree',     text: 'heals you 4× your damage stat',  post: b => { b.f.hp = Math.min(b.f.maxHp, b.f.hp + b.f.p.attack * 4); } },
  'poison-dart':     { name: 'Plague',           text: 'poison hits 3× as hard',         post: b => { b.foe.poisonDmg += b.f.p.attack * 2; } },
  'lily-pad-shield': { name: 'Lotus Fortress',   text: '+2 more shields',                post: b => { b.f.shield += 2; } },
  'healing-pond':    { name: 'Fountain of Youth', text: 'extra heal and cures poison',   post: b => { b.f.hp = Math.min(b.f.maxHp, b.f.hp + b.f.p.attack * 3); b.f.poison = 0; b.f.poisonDmg = 0; } },
  'leech':           { name: 'Vampire Lord',     text: 'drains twice',                   post: b => { b.leeches.push(b.wi); } },
  'double-croak':    { name: 'Echo Chorus',      text: 'next attack strikes 2 more times', post: b => { b.f.doubleNext += 2; } },
  'saw-blade':       { name: 'Buzzsaw Storm',    text: 'strikes twice',                  pre: b => { b.f.doubleNext += 1; } },
  'late-bloomer':    { name: 'Eternal Bloom',    text: 'grows 3 per use instead of 1',   post: b => { b.card.growDmg += 2; } },
  'stun-slime':      { name: 'Paralysis',        text: 'stuns for 2 turns',              post: b => { b.foe.stunned++; } },
  'bare-hands':      { name: 'Iron Fist',        text: 'strikes twice',                  pre: b => { b.f.doubleNext += 1; } },
};
const MYTHIC_FALLBACK = { name: 'Mythic Might', text: 'strikes twice', pre: b => { b.f.doubleNext += 1; } };
const mythicOf = c => c.mythic ? (MYTHIC_GIMMICKS[fxSlug(c)] || MYTHIC_FALLBACK) : null;

// A private, upgraded copy of a card (cards in the deck are shared objects, so never change them in place)
function forgeCard(c) {
  const from = c.rarity || 'common', to = RARITY_STEPS[RARITY_STEPS.indexOf(from) + 1];
  const mythic = to === 'mythical';
  const bonus = (c.forgeBonus || 0) + (mythic ? FORGE_MYTHIC_BONUS : FORGE_BONUS);
  const baseText = c.baseText || c.text, baseMult = c.baseMult ?? c.mult;
  const up = { ...c, rarity: to, mult: baseMult + bonus, forgeBonus: bonus, baseText, baseMult, quiz: false, base: undefined };
  if (mythic) up.mythic = true;
  up.text = function (a) {
    // Plain attack cards just show their new total; gimmick cards show the extra damage on top
    let t = !c.gimmick && !c.extra ? `${a * up.mult} damage` : `${baseText.call(this, a)} + ${a * bonus} damage`;
    const m = mythicOf(up);
    if (m) t += ` · ✨ ${m.name}: ${m.text}`;
    return t;
  };
  return up;
}

async function forgeEvent() {
  const p = players[turn];
  const el = document.getElementById('fuse');
  const title = document.getElementById('fuseTitle'), msg = document.getElementById('fuseMsg');
  const body = document.getElementById('fuseBody'), go = document.getElementById('fuseGo');
  const cancel = document.getElementById('fuseCancel');
  el.hidden = false;
  title.textContent = '💎 Rarity Forge';
  const done = () => { el.hidden = true; cancel.textContent = 'Cancel'; render(); };
  const choices = p.hand.map((c, i) => i).filter(i => (p.hand[i].rarity || 'common') !== 'mythical' && !p.hand[i].curse);
  if (!choices.length) {
    msg.textContent = p.hand.length ? 'All your cards are already MYTHICAL!' : 'You have no cards to upgrade.';
    body.innerHTML = '';
    go.hidden = true;
    await new Promise(r => cancel.onclick = r);
    return done();
  }
  // Pick a card
  msg.textContent = 'Pick a card to upgrade its rarity by one. Legendary cards become MYTHICAL, with their own special gimmick!';
  // Copies of the same card show as one stacked face (x2, x3...); upgrading uses one copy
  const groups = [...choices.reduce((m, i) => m.set(p.hand[i], [...(m.get(p.hand[i]) || []), i]), new Map()).values()];
  body.innerHTML = '<div class="hand-grid">' + groups.map(g => cardFace(p.hand[g[0]], g.length > 1 ? g.length : 0, p.attack)).join('') + '</div>';
  addCardTabs(body.querySelector('.hand-grid'));
  go.hidden = true;
  const pick = await new Promise(r => {
    body.querySelectorAll('.card-face').forEach((f, k) => f.onclick = () => { sfx('card_pick'); r(groups[k][0]); });
    cancel.onclick = () => r(-1);
  });
  if (pick < 0) return done();
  // Preview before → after
  const before = p.hand[pick], after = forgeCard(before);
  msg.textContent = `${(before.rarity || 'common').toUpperCase()} → ${after.rarity.toUpperCase()}`;
  body.innerHTML = '<div class="hand-grid forge-preview">' + cardFace(before, 0, p.attack) + '<div class="forge-arrow">➜</div>' +
    cardFace(after, 0, p.attack) + '</div>';
  go.hidden = false;
  go.textContent = 'Upgrade!';
  const ok = await new Promise(r => { go.onclick = () => r(true); cancel.onclick = () => r(false); });
  if (!ok) { go.hidden = true; return done(); }
  p.hand[pick] = after;
  questEvent(p, 'forge'); gainXp(p, 6);
  go.hidden = true;
  const face = body.querySelectorAll('.card-face')[1];
  if (after.mythic) {
    sfx('jackpot'); flash('#ff2bd6', 0.5); confetti(120); haptic(150);
    banner('✨ MYTHICAL! ✨', 'legendary');
    burst(face, ['#ff2bd6', '#7a5cff', '#2bd6ff', '#fff'], 48, 1.6);
  } else {
    sfx('level_up'); flash(RARITY_COLORS[after.rarity] || '#fff', 0.35);
    burst(face, [RARITY_COLORS[after.rarity] || '#fff', '#fff'], 30, 1.2);
  }
  msg.textContent = `Upgraded to ${after.rarity.toUpperCase()}!`;
  cancel.textContent = 'Done';
  await new Promise(r => cancel.onclick = r);
  done();
}
