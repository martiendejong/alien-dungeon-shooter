// Central balancing knobs. Tweak gameplay here, not in system code.
export const TUNING = {
  world: {
    gravity: 900,
    tile: 32,
  },
  // grid-based, animation-timed movement (Prince of Persia / Blackthorne model)
  grid: { block: 32, floorBlocks: 3 },
  move: {
    turnMs: 250,
    stepBlocks: 1,  stepMs: 500,    // walk: 1 block / 0.5s
    runBlocks: 4,   runMs: 1000,    // run-step: 4 blocks / 1.0s (4x), chains while held
    jumpUpMs: 1000, jumpUpReach: 3, // vertical jump; grab a ledge up to 3 blocks above
    standJump: 5,   standJumpMs: 920, standJumpPeak: 1.9, // gap<=5 land, ==6 grab, >6 fall (clear a 5-wide gap → grab the far edge)
    runJump: 6,     runJumpMs: 1080,  runJumpPeak: 2.1,   // gap<=6 land, ==7 grab, >7 fall
    fallPxPerMs: 0.9,
    dashBlocks: 5, dashMs: 200, dashCdMs: 650, // quick i-frame dash (double-tap a direction)
    climbUpMs: 500,
    climbSpeed: 130,   // ladder climb px/s
    runByDefault: true, // movement is RUN by default; Shift toggles to careful WALK
  },
  player: {
    walkSpeed: 86,        // deliberate, PoP/Blackthorne careful pace
    runSpeed: 215,
    accel: 2200,          // reach speed fast, little float
    friction: 2600,       // stop crisply, no ice-skating
    airAccel: 600,        // limited air control = committed jumps
    jumpVel: -360,
    coyoteMs: 100,
    jumpBufferMs: 120,
    climbSpeed: 80,
    maxHp: 3,             // HP is measured in HEARTS now (start with 3)
    invulnMs: 800,        // i-frames after taking a hit
    width: 18,
    height: 40,
  },
  cover: {
    hideDarknessThreshold: 0.45, // darkness (0 lit .. 1 pitch) needed to hide
    popOutMs: 260,               // exposed window when you fire from cover
  },
  lighting: {
    ambientDarkness: 0.55, // base darkness of unlit areas (0..1) — lower = brighter shadows
  },
  // Player weapons are HITSCAN (instant tracer) — bullets land almost immediately.
  weapons: {
    pistol:  { name: 'PISTOL',  dmg: 20, cooldownMs: 2000, spread: 0.015, ammo: Infinity, range: 1100, auto: false }, // 2s reload; you stand still while reloading
    shotgun: { name: 'SHOTGUN', dmg: 13, cooldownMs: 700, spread: 0.22,  ammo: 24,       range: 520,  pellets: 7, auto: false },
    smg:     { name: 'SMG',     dmg: 11, cooldownMs: 90,  spread: 0.07,  ammo: 120,      range: 950,  auto: true },
    rifle:   { name: 'RIFLE',   dmg: 34, cooldownMs: 220, spread: 0.012, ammo: 60,       range: 1300, auto: true }, // hard-hitting, accurate, long range
  },
  melee: {
    dmg: 40, rangePx: 34, cooldownMs: 360, arc: 1.2,
  },
  grenade: {
    fuseMs: 1500, radius: 95, dmg: 70, bounce: 0.45, throwSpeed: 430, startCount: 4,
  },
  // all enemies die in ONE hit. Ranged enemies: walk 1 block/step, only shoot while standing
  // still — see player → stand `aimMs` → shoot once → `reloadMs` reload. Crawlers RUN.
  enemyFire: { aimMs: 3000, reloadMs: 5000 },
  enemies: {
    guard:     { hp: 1, sightPx: 360, projSpeed: 540 },
    crawler:   { hp: 1, sightPx: 340, fragile: true },
    grenadier: { hp: 1, sightPx: 420 },
    // LEVEL 1 boss — armored gunner. Shotgun volleys + GRENADE LOB every 3rd shot, summons, charges wounded. 4 hits.
    warden:    { hp: 4, sightPx: 560, projSpeed: 560, pellets: 5, spread: 0.26, aimMs: 1800, reloadMs: 3000, summonMs: 11000, chargeBelow: 0.4, grenadeEvery: 3 },
    // LEVEL 2 boss — escaped experiment. Charges + 3-shot acid volley. At half HP it ENRAGES: summons
    // crawlers, closes in tighter. 4 hits.
    subject:   { hp: 4, sightPx: 700, projSpeed: 440, pellets: 3, spread: 0.20, chargeRange: 6, aimMs: 2000, reloadMs: 3500, summonMs: 7000, slamMs: 4200, slamR: 84 },
    // LEVEL 3 boss — THE QUEEN (alien): faster charger, 4-shot acid fan, ground-pound SLAM, enrages. 5 hits.
    queen:     { hp: 5, sightPx: 720, projSpeed: 470, pellets: 4, spread: 0.24, chargeRange: 6, aimMs: 1700, reloadMs: 2900, summonMs: 6000, slamMs: 3600, slamR: 100, scale: 1.3 },
    // LEVEL 4 boss — THE COMMANDER (human): heavy gunner, GRENADE LOB every 2nd shot, summons, charges. 5 hits.
    commander: { hp: 5, sightPx: 620, projSpeed: 610, pellets: 6, spread: 0.22, aimMs: 1500, reloadMs: 2500, summonMs: 9000, chargeBelow: 0.4, grenadeEvery: 2, scale: 1.5 },
    // LEVEL 5 boss — THE OVERMIND (final): relentless charger, always summoning, fast fan + frequent SLAM. 7 hits.
    overmind:  { hp: 7, sightPx: 780, projSpeed: 500, pellets: 4, spread: 0.22, chargeRange: 5, aimMs: 1400, reloadMs: 2400, summonMs: 5000, summonAlways: true, slamMs: 2800, slamR: 116, scale: 1.7 },

    // ---- 10 extra enemies (reuse art via `art` + recolor via `tint`) ----
    // soldier colour-variants: more HP, BURST fire (N shots ~0.5s apart, then a longer reload)
    trooper_red:  { hp: 2, behavior: 'ranged', art: 'guard', tint: 0xff6a6a, sightPx: 380, projSpeed: 540, aimMs: 1400, reloadMs: 2600, burst: { count: 3, gapMs: 500 } },
    trooper_gold: { hp: 3, behavior: 'ranged', art: 'guard', tint: 0xffd23a, sightPx: 410, projSpeed: 560, aimMs: 1600, reloadMs: 3200, burst: { count: 5, gapMs: 450 } },
    marksman:     { hp: 2, behavior: 'ranged', art: 'guard', tint: 0x7ab0ff, sightPx: 560, projSpeed: 760, aimMs: 1000, reloadMs: 1800 },
    sniper:       { hp: 2, behavior: 'ranged', art: 'guard', tint: 0xb07aff, sightPx: 780, projSpeed: 920, aimMs: 2600, reloadMs: 3000 },
    bomber:       { hp: 2, behavior: 'ranged', art: 'grenadier', tint: 0xff8a3a, sightPx: 440, lobs: true, aimMs: 1400, reloadMs: 3000, burst: { count: 2, gapMs: 700 } },
    // melee hunters that navigate terrain (jump gaps / climb ladders & ledges)
    hunter:       { hp: 2, behavior: 'hunter', art: 'crawler', tint: 0xff7aff, sightPx: 440, canJump: true, canClimb: true },
    leaper:       { hp: 1, behavior: 'hunter', art: 'crawler', tint: 0x7affd0, sightPx: 440, canJump: true, fragile: true },
    brute:        { hp: 4, behavior: 'hunter', art: 'subject', tint: 0xcc5555, scale: 1.15, sightPx: 440, canJump: true, canClimb: true },
    // flying drones
    drone:        { hp: 1, behavior: 'drone', art: 'drone', sightPx: 540, projSpeed: 520, aimMs: 1200, reloadMs: 2000, droneSpeed: 92, fireRange: 6 },
    gundrone:     { hp: 2, behavior: 'drone', art: 'drone', tint: 0xffaa3a, sightPx: 580, projSpeed: 540, aimMs: 1200, reloadMs: 2600, droneSpeed: 80, fireRange: 6, burst: { count: 3, gapMs: 400 } },
  },
} as const;
