# Art I need from you (drop pictures here)

Put images in **`public/assets/`** using the exact filenames below. Both **sprite sheets** (a strip of
equal frames left→right) and **single frames** work — for a sheet, just tell me how many frames are in it
(or name it `name_Nframes.png`, e.g. `player_run_8frames.png`). A transparent or solid-colour background
is fine; I key it out and trim automatically. PNG preferred.

## Player  (folder: `public/assets/player/`)
- `idle.png`, `walk.png`, `run.png`, `jump.png`, `climb.png`, `hang.png`, `mantle.png`, `shoot.png`,
  `melee.png`, `hurt.png`, `death.png`
(You already gave cole_sheet 1–3 — extra/cleaner poses here will replace them.)

## Enemies  (folder: `public/assets/enemies/`)
For each, ideally: `idle.png`, `walk.png`, `shoot.png` (or `attack.png`), `death.png`
- `soldier/…`   (the basic guard; colour variants are auto-tinted, so one sheet is enough)
- `grenadier/…`
- `crawler/…`   (fast melee alien)
- `hunter/…`    (jumps/climbs)
- `drone/…`     (flying)

## Bosses  (folder: `public/assets/bosses/`)  ← biggest visual win
For each: `idle.png`, `attack.png` (one or more, e.g. `attack1.png`), `hurt.png`, `death.png`
- `warden/…`     (Level 1-ish armored gunner)
- `subject/…`    (Subject Zero — escaped experiment)
- `queen/…`      (alien Queen)
- `commander/…`  (human Commander)
- `overmind/…`   (final boss)

## Backgrounds  (folder: `public/assets/bg/`)  ← huge atmosphere win
One **parallax** background per world, ideally 2–3 layers (far → near):
- `bunker_far.png`, `bunker_mid.png`, `bunker_near.png`        (Site Echo / lockdown)
- `hive_*.png`        (the alien dungeon/hive)
- `nest_*.png`        (the alien cavern)
- `earth_*.png`       (occupied Earth streets)
- `core_*.png`        (the Overmind core)
(One image per world is fine to start; layers are a bonus.)

## Tiles  (folder: `public/assets/tiles/`)  — optional (I can theme procedurally)
- `wall.png`, `floor.png`, `ladder.png`, `door.png`, `spikes.png` per world (suffix the world name).

## Optional extras
- `title.png` (logo), `portrait_*.png` (story beats), any **music** (`.mid` or audio) / **SFX** files.

---
**Tip:** even just the **5 boss images + 5 background images** would transform the look. Drop what you
have and tell me the filenames + frame counts, and I'll wire them in.
