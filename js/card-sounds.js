// Card sounds: which sound plays at each moment of a card's animation, on top of the battle's own hit sounds.
// card-fx.js calls cardSound() from every hook, so a card's sounds live here instead of inside each effect file.
//   CARD_SOUNDS[slug] = { land, windup, impact, gimmick }   each: 'sfxName' or ['sfxName', pitch, volume]
//   Multi-strike (frenzy) impacts rise in pitch with every strike.
//   MOMENT_SOUNDS['poisonTick:frost'] etc. = sounds for the battle moments (see BATTLE_FX_KIND in card-fx.js)
// Sound names are the SFX keys in js/effects.js.

const CARD_SOUNDS = {
  // ---------- Frog cards ----------
  'focus-croak':     { gimmick: ['strengthen', 1.2, 0.7] },
  'double-croak':    { gimmick: ['strengthen', 1.1, 0.6] },
  'bark-armor':      { gimmick: ['strengthen', 0.9, 0.6] },
  'healing-pond':    { gimmick: ['support', 1.1, 0.7] },
  'spring-rain':     { gimmick: ['support', 1, 0.7] },
  'stun-slime':      { gimmick: ['psychic', 0.8, 0.6] },
  'croak-blast':     { impact: ['explosion', 1.1, 0.6] },
  'swamp-king':      { impact: ['explosion', 0.9, 0.7] },

  // ---------- The Butcher Hog and its evolutions ----------
  'cleaver-chop':    { land: 'pig', impact: ['explosion', 0.9, 0.6] },
  'bone-splitter':   { land: ['pig', 1.1], impact: 'breaking' },
  'cleaver-flurry':  { land: ['pig', 1.2], windup: ['wind', 1.4, 0.5] },
  'mud-wallow':      { land: ['pig', 0.9], gimmick: ['support', 0.9, 0.6] },
  'bacon-sizzle':    { land: 'pig', impact: 'burn', gimmick: ['burn', 1.1, 0.5] },
  'meat-hook':       { land: ['pig', 0.85], impact: 'breaking' },
  'iron-cleaver':    { land: ['pig', 0.8], impact: 'explosion' },
  'royal-slam':      { land: ['pig', 0.75], impact: 'big_explosion' },
  'tusk-frenzy':     { land: ['pig', 1.1], windup: ['footstep', 0.8] },
  'royal-feast':     { land: ['pig', 0.9], gimmick: 'eating' },

  // ---------- Swamp enemies' evolved attacks ----------
  'swarm-sting':     { land: 'mosquito', windup: ['mosquito', 1.3, 0.35] },
  'blood-drain':     { land: ['mosquito', 0.9], impact: ['eating', 1.3, 0.6] },
  'royal-proboscis': { land: ['mosquito', 0.8], impact: ['eating', 1.1, 0.6] },
  'plague-swarm':    { land: ['mosquito', 1.1], windup: ['mosquito', 1.4, 0.3] },
  'brood-wall':      { gimmick: 'strengthen' },
  'iron-shell-slam': { impact: 'breaking' },
  'rust-snap':       { impact: 'breaking' },
  'dragon-breath':   { windup: 'fire_spell', impact: 'burn' },
  'ancient-carapace': { gimmick: 'support' },
  'lightning-beak':  { windup: 'lightning' },
  'gale-dive':       { windup: 'wind' },
  'phoenix-flame':   { land: ['wonder', 1.2, 0.5], windup: 'fire_spell', impact: 'explosion' },
  'rebirth-feather': { gimmick: 'wonder' },
  'hydra-venom':     { impact: ['psychic', 0.7, 0.6] },
  'tidal-crush':     { impact: 'big_explosion' },
  'abyssal-maw':     { impact: 'eating' },

  // ---------- Ice Lake ----------
  // Snow Moth, Blizzard Moth, Aurora Moth Queen
  'wing-gust':       { windup: 'wind', impact: ['iceshock', 1.2, 0.5] },
  'snowflake-swirl': { gimmick: ['wind', 1.2, 0.5], impact: ['iceshock', 1.3, 0.55] },
  'frost-dust':      { windup: ['wind', 1.5, 0.4], gimmick: 'freeze' },
  'hypno-wings':     { land: 'psychic', windup: ['psychic', 0.8], gimmick: ['psychic', 0.6] },
  'frost-cocoon':    { gimmick: ['strengthen', 1.2, 0.6] },
  'moonbeam':        { land: ['wonder', 1.1, 0.5], impact: ['iceshock', 0.8] },
  'aurora-heal':     { land: ['wonder', 1, 0.45], gimmick: 'support' },
  // Ice Penguin, Penguin Commander, Emperor Penguin
  'belly-slide':     { windup: ['wind', 0.8, 0.5], impact: ['iceshock', 1.1, 0.5] },
  'snowball-volley': { gimmick: ['footstep', 1.2], impact: ['iceshock', 1.4, 0.5] },
  'snow-fort':       { gimmick: 'strengthen' },
  'torpedo-dive':    { windup: 'wind', impact: 'explosion' },
  'huddle-up':       { gimmick: 'support' },
  'penguin-march':   { gimmick: 'strengthen', windup: 'footstep', impact: ['footstep', 0.8] },
  'ice-fishing':     { gimmick: 'eating' },
  // Polar Owl, Frostfeather Owl, Snow Owl Sage
  'silent-swoop':    { windup: ['wind', 0.7, 0.5] },
  'blizzard':        { windup: 'wind', impact: 'iceshock', gimmick: ['freeze', 1.2, 0.5] },
  'deep-freeze':     { windup: ['iceshock', 0.8], gimmick: 'freeze' },
  'quill-volley':    { gimmick: ['wind', 1.3, 0.5], impact: ['iceshock', 1.5, 0.45] },
  'owl-eyes':        { land: 'psychic', gimmick: 'strengthen' },
  'crystal-spell':   { land: ['wonder', 1.3, 0.45], windup: 'psychic', impact: ['iceshock', 0.9] },
  'frost-nova':      { gimmick: 'breaking', impact: 'iceshock' },
  // Frost Wolf, Frostfang Alpha, Winter Fenrir
  'frost-bite':      { impact: 'bite', gimmick: 'freeze' },
  'frost-claw':      { gimmick: 'breaking', impact: 'iceshock' },
  'pack-hunt':       { gimmick: ['strengthen', 1.2, 0.5], windup: ['footstep', 1.1] },
  'moon-howl':       { land: ['wonder', 0.9, 0.5], gimmick: 'strengthen' },
  'avalanche-pounce': { windup: 'wind', impact: 'big_explosion' },
  'wolf-spirit':     { land: ['psychic', 0.7], gimmick: ['wonder', 0.8, 0.5] },
  'moon-eater':      { gimmick: 'breaking', impact: 'big_explosion' },
  // Glacier Walrus, Walrus Warlord, Glacier Titan
  'glacier-slam':    { gimmick: 'breaking', impact: 'big_explosion' },
  'tusk-spear':      { windup: ['wind', 1.1, 0.5], impact: 'iceshock' },
  'icicle-barrage':  { gimmick: ['freeze', 1.3, 0.4], impact: ['iceshock', 1.2, 0.55] },
  'fish-feast':      { gimmick: 'eating' },
  'arctic-breath':   { windup: 'wind', gimmick: 'freeze' },
  'iceberg-toss':    { windup: ['wind', 0.7], impact: 'big_explosion' },
  'ice-quake':       { windup: ['breaking', 0.8], impact: 'explosion', gimmick: 'freeze' },
  'walrus-stampede': { gimmick: 'strengthen', windup: ['footstep', 0.8], impact: ['footstep', 0.7] },
  'absolute-zero':   { gimmick: 'breaking', windup: ['freeze', 0.8], impact: 'big_explosion' },

  // ---------- Volcano ----------
  // Ember Beetle, Bombardier Beetle, Scarab King
  'ember-spit':      { windup: 'ember', impact: 'burn', gimmick: ['burn', 1.1, 0.5] },
  'horn-charge':     { windup: ['footstep', 1.2], impact: 'explosion' },
  'cinder-shell':    { gimmick: 'strengthen' },
  'bombardier-blast': { gimmick: 'ember', impact: ['explosion', 1.2, 0.6] },
  'mandible-crunch': { impact: 'bite', gimmick: 'eating' },
  'solar-flare':     { windup: 'fire_spell', impact: 'explosion', gimmick: 'burn' },
  'sunrise-rebirth': { land: ['wonder', 1.1, 0.5], gimmick: 'support' },
  // Lava Lizard, Magma Salamander, Lava Basilisk
  'lava-whip':       { gimmick: 'breaking', windup: ['wind', 1.2, 0.5], impact: 'burn' },
  'flame-tongue':    { windup: 'fire_spell', gimmick: 'burn' },
  'heat-bask':       { gimmick: 'support' },
  'flame-wheel':     { windup: 'fire_spell', impact: 'explosion' },
  'tail-regrow':     { gimmick: 'support' },
  'basilisk-gaze':   { land: 'psychic', windup: ['psychic', 0.7], gimmick: 'breaking' },
  'magma-geyser':    { gimmick: 'breaking', impact: 'big_explosion' },
  // Fire Hawk, Inferno Hawk, Cinder Roc
  'blazing-dive':    { windup: 'fire_spell', impact: 'explosion' },
  'fire-tornado':    { gimmick: 'wind', windup: ['fire_spell', 1.2, 0.5], impact: 'burn' },
  'ash-cloud':       { windup: ['wind', 0.8], gimmick: 'dud' },
  'molten-talons':   { impact: 'burn', gimmick: 'eating' },
  'heat-mirage':     { land: ['psychic', 1.2], gimmick: 'strengthen' },
  'cinder-storm':    { gimmick: 'breaking', windup: 'lightning', impact: 'big_explosion' },
  'ember-rain':      { windup: 'ember', impact: 'burn', gimmick: 'burn' },
  // Magma Golem, Obsidian Golem, Volcano Titan
  'boulder-fist':    { windup: ['wind', 0.8, 0.5], impact: 'explosion' },
  'quake-stomp':     { windup: ['footstep', 0.6], impact: 'breaking', gimmick: 'dud' },
  'magma-armor':     { gimmick: 'strengthen' },
  'obsidian-claw':   { impact: 'breaking', gimmick: ['eating', 0.9] },
  'molten-heart':    { land: ['strengthen', 0.8], gimmick: 'support' },
  'eruption':        { gimmick: 'breaking', impact: 'big_explosion' },
  'lava-flood':      { windup: ['burn', 0.8], impact: 'explosion', gimmick: 'burn' },
  // Inferno Dragon, Twin-Headed Dragon, Dragon Emperor
  'dragon-inferno':  { windup: 'fire_spell', impact: 'explosion', gimmick: 'burn' },
  'meteor-strike':   { gimmick: 'breaking', windup: ['fire_spell', 0.8, 0.5], impact: 'big_explosion' },
  'dragon-wings':    { gimmick: 'wind', windup: ['wind', 1.1, 0.6], impact: ['burn', 1.2, 0.5] },
  'treasure-hoard':  { land: 'coin', gimmick: 'support' },
  'tail-swipe':      { windup: 'wind', impact: 'explosion' },
  'twin-inferno':    { windup: 'fire_spell', impact: 'big_explosion', gimmick: 'burn' },
  'ember-scales':    { gimmick: 'strengthen' },
  'supernova':       { land: ['wonder', 1, 0.5], gimmick: 'breaking', windup: ['wonder', 1.4, 0.4], impact: 'big_explosion' },
  'dragon-roar':     { windup: ['explosion', 0.6, 0.5], gimmick: 'dud' },
};

// Battle moments (the themed variants come from BATTLE_FX_KIND in card-fx.js)
const MOMENT_SOUNDS = {
  'poisonTick:frost': ['freeze', 1.3, 0.5],
  'poisonTick:fire':  'burn',
  'stunSkip:frost':   'freeze',
  'stunSkip:fire':    'dud',
  'block:frost':      'iceshock',
  'block:fire':       'breaking',
  'ko':               ['big_explosion', 1.1, 0.6],
};

// Play a card's sound for a hook ('land' | 'windup' | 'impact' | 'gimmick'), or a battle moment's sound
function cardSound(hook, card, ctx = {}) {
  let spec = CARD_SOUNDS[fxSlug(card)]?.[hook];
  if (!spec) return;
  const [name, pitch = 1, vol = 1] = Array.isArray(spec) ? spec : [spec];
  const rise = hook === 'impact' || hook === 'windup' ? 1 + Math.min(3, ctx.strike || 0) * 0.08 : 1; // frenzy strikes climb
  sfx(name, pitch * rise, vol * (ctx.crit && hook === 'impact' ? 1.2 : 1));
}
function momentSound(key) {
  const spec = MOMENT_SOUNDS[key];
  if (!spec) return;
  const [name, pitch = 1, vol = 1] = Array.isArray(spec) ? spec : [spec];
  sfx(name, pitch, vol);
}
