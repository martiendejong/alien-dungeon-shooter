# SUBTERRA — Progress Log

## Run it
```
cd e:\projects\games\alien_dungeon_shooter
npm install      # once
npm run dev      # → http://localhost:5180/
```
Build a static version: `npm run build` → `dist/` (open/host anywhere).

## Status — 2026-06-17

### DONE
- **Design** — `docs/GAME_DESIGN.md` (story, 8-level arc, full mechanics spec, controls), `docs/ART_BIBLE.md`.
- **Tech scaffold** — Vite + TypeScript + Phaser 3. Boots, typechecks, builds clean.
- **Placeholder art** — procedural `TextureFactory` (player, 4 enemy types, tiles, ladder, bg,
  bullets, grenade, pickups, exit, portal, radial light). Swappable for real art later.
- **Level 1 vertical slice — "The Descent"** (playable end-to-end):
  - Cinematic controller: walk/run (Shift toggles), momentum, jump (coyote+buffer), ladders,
    ledge-grab + mantle.
  - **PoP/Blackthorne controls**: WALK mode = careful, stops at ledges (won't fall off);
    RUN mode = commits, runs off edges. Verified.
  - **Mouse aim** + **hitscan** weapons (pistol/shotgun/SMG) — bullets are *instant* (raycast +
    tracer), no travel time, no tunnelling. Verified dealing damage.
  - Melee (F / right-click), grenades (G, arc throw, AoE that ignores cover).
  - **Hide-in-shadow cover**: only works inside authored hide-zones AND when dark enough;
    blocks ranged fire but NOT explosions or melee; can't hide in lit/open ground. Math verified
    (surface 0.52 < threshold → no hide; alcove 0.62 ≥ threshold → hide).
  - Dynamic lighting overlay (flicker, muzzle/explosion pulses) doubling as the hide-data source.
  - Enemies: Guard (cover-trading ranged w/ reload windows), Crawler (melee rush, ignores cover),
    Grenadier (flushes you from cover), **Site Warden boss** (charge + shotgun, HP bar).
  - Pickups (medkit/ammo), HUD (HP, weapon/ammo, grenades, WALK/RUN, objective, boss bar, messages),
    win (kill Warden → elevator) / lose (death → retry) flow.

### MOVEMENT v2 — grid-based PoP/Blackthorne action engine (2026-06-17)
Rebuilt the player from analog physics to **discrete, animation-timed, tile-grid actions**:
- Turn-then-step: press the way you don't face → turn (0.25s); press the way you face → move.
- Step = 1 block / 0.5s; Run-step = 4 blocks / 1.0s (run mode). Holding chains them.
- Up = vertical jump (1s) → grab a ledge if in reach, else drop back.
- Space = forward jump 3 blocks; gap 4 → grab; >4 → fall.
- Running jump = 5 blocks (finishes the run first); gap 6 → grab; >6 → fall.
- Floors exactly 3 blocks high; Level 1 is now a block grid with gaps 2/3/4/5/6 + an upper ledge.
- Verified (poll-based browser tests): turn, 1-block step, 4-block run, all gap land/grab thresholds,
  jump-up grab + climb — all exact. (Hitscan tracers, hide-in-shadow, enemies, boss carried over.)

### IN PROGRESS
- **Polish Level 1**: brighten desert surface, real art pass, more set-dressing, audio, balance.
- Tune feel with Martien (step/turn/jump timings) before building Levels 2–8.

### NEXT
- Finish Level 1 polish to "challenging + fun", then Level 2 "Containment".

## Verified this session (automated browser checks)
- Boots to menu → game with no runtime errors (only favicon 404).
- 7 enemies spawn with correct archetypes incl. boss; 28 ledge-grab points.
- Movement, Shift run-toggle, hitscan damage, careful-walk edge-stop, run-commit all pass.
