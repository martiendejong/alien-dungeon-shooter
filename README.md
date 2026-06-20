# SUBTERRA — Alien Dungeon Shooter

A Prince-of-Persia-style action platformer / shooter built with **TypeScript + Phaser 3 + Vite**.

You descend a bunker (Site Echo), slip through portals into alien worlds, and fight your way back to
an occupied Earth — using precise grid-based climbing, ledge-grabs and run-jumps, stealth in the dark,
timed button/gate puzzles, and a growing arsenal of weapons.

## Features

- **Grid-based platforming** — Prince-of-Persia / Blackthorne style movement: careful walk vs. run,
  fixed standing (5) and running (6) jump distances, ledge grab + climb, climb-down-to-hang, fall damage.
- **Stealth** — hide in shadow (hold **C**); soldiers patrol, see you in the light, and hold position
  for a few seconds after any shot.
- **Timed button/gate puzzles** — pressure plates open gates (permanent or PoP-style timed) gated behind
  difficult jumps.
- **Progression** — Level 1 is an unarmed stealth-maze; from Level 2 you're armed, each level is bigger
  with more jumps and gates, and you pick up **new weapons** (pistol → shotgun → SMG → rifle) that carry
  forward.
- **Enemies** — soldiers, crawlers, grenadiers, hunters, drones + colour-coded tougher variants per level,
  and a unique end-boss in its own arena each level.
- Procedural WebAudio SFX & music, dynamic lighting, grenades, melee.

## Controls

- **Arrows / WASD** — move (run by default; hold **Shift** to walk)
- **Up / W** — vertical jump / climb · **Down / S** — grab ledge to hang / drop · **Space** — forward jump
- **Mouse** — aim · **Left click** — shoot · **Right click / F** — melee · **G** — grenade
- **C** — hide in shadow · **1/2/3** or wheel — switch weapon · **Esc** — pause

## Run it

```bash
npm install
npm run dev      # dev server (http://localhost:5180)
npm run build    # production build to dist/
```

## Level design

`level design/` holds the hand-drawn level plans the levels are built from. Level data lives in
`src/levels/`.
