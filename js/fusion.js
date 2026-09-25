// Fusion: move one card's gimmick onto another card. The donor card is used up, and each card
// can carry only one extra (fused) gimmick.

// Build the fused card: the target card plus the donor's gimmick
function fuseCards(target, donor) {
  return {
    ...target,
    name: target.name + ' +',
    extra: donor.gimmick,
    extraArt: donor.art,
    text(a) { return target.text.call(this, a) + ' + ' + EXTRA_TEXT[donor.gimmick](a); },
  };
}

const fuseEl = document.getElementById('fuse');
async function fuseEvent() {
  const p = players[turn];
  const title = document.getElementById('fuseTitle');
  const msg = document.getElementById('fuseMsg');
  const body = document.getElementById('fuseBody');
  const go = document.getElementById('fuseGo');
  const cancel = document.getElementById('fuseCancel');
  fuseEl.hidden = false;
  const done = () => { fuseEl.hidden = true; };

  // Let the player tap one card from a list; resolves with its hand index, or -1 if they cancel
  const pickFrom = (indexes, prompt) => new Promise(resolve => {
    msg.textContent = prompt;
    body.innerHTML = '<div class="hand-grid">' + indexes.map(i => cardFace(p.hand[i], 0, p.attack)).join('') + '</div>';
    body.querySelectorAll('.card-face').forEach((el, k) => el.onclick = () => { sfx('card_pick'); resolve(indexes[k]); });
    go.hidden = true;
    cancel.onclick = () => resolve(-1);
  });

  title.textContent = '⚗️ Fusion';
  // Donors: gimmick cards that haven't been fused themselves
  const donors = p.hand.map((c, i) => i).filter(i => p.hand[i].gimmick && p.hand[i].gimmick !== 'grow' && !p.hand[i].extra); // growing cards can't be donated
  if (!donors.length || p.hand.length < 2) {
    msg.textContent = 'You need a gimmick card and at least one other card to fuse.';
    body.innerHTML = '';
    go.hidden = true;
    await new Promise(r => cancel.onclick = r);
    return done();
  }
  const d = await pickFrom(donors, 'Step 1: pick the gimmick to take (this card will be used up).');
  if (d < 0) return done();
  const donor = p.hand[d];
  // Targets: any other card with no fused gimmick yet that doesn't already have this gimmick
  const targets = p.hand.map((c, i) => i).filter(i => i !== d && !p.hand[i].extra && p.hand[i].gimmick !== donor.gimmick);
  if (!targets.length) {
    msg.textContent = `No card can take ${donor.name}'s gimmick (each card can only hold one extra gimmick).`;
    body.innerHTML = '';
    await new Promise(r => cancel.onclick = r);
    return done();
  }
  const t = await pickFrom(targets, `Step 2: pick the card to add ${donor.art} ${donor.name}'s gimmick to.`);
  if (t < 0) return done();

  // Preview and confirm
  const fused = fuseCards(p.hand[t], donor);
  msg.textContent = 'Fuse these into:';
  body.innerHTML = '<div class="hand-grid fuse-preview">' + cardFace(fused, 0, p.attack) + '</div>';
  go.hidden = false;
  go.textContent = 'Fuse!';
  const confirmed = await new Promise(r => { go.onclick = () => r(true); cancel.onclick = () => r(false); });
  if (confirmed) {
    // Remove both originals (higher index first so the other index stays valid), add the fused card
    [d, t].sort((a, b) => b - a).forEach(i => p.hand.splice(i, 1));
    p.hand.push(fused);
    sfx('card_land_gimmick', 0.8);
    burst(body.querySelector('.card-face'), ['#b07cff', '#fff', '#ffd23f', '#e0c3ff'], 40, 1.3);
    flash('#b07cff', 0.35);
    msg.textContent = `Fused! ${fused.name} is in your hand.`;
    go.hidden = true;
    cancel.textContent = 'Done';
    await new Promise(r => cancel.onclick = r);
    cancel.textContent = 'Cancel';
  }
  done();
  render();
}
