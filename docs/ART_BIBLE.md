# SUBTERRA — ART BIBLE

Goal: graphics **clearly better** than 1994-era PoP/Blackthorne. We get there in two passes:

- **Pass A (now):** procedural placeholder art via `TextureFactory` so the game is fully playable.
  Clean silhouettes, readable shapes, a consistent palette. Ugly-but-honest, never "programmer pink".
- **Pass B (per level):** replace placeholders with hand-crafted / AI-generated art dropped into
  `public/assets/`, swapped through an atlas manifest — no code changes to gameplay.

## Visual direction
- **Mood:** oppressive, cinematic, high-contrast. Light is gameplay — darkness = safety, light = danger.
- **Camera:** side-on, slight parallax depth (3+ layers): far background, mid props, play layer, foreground gloom.
- **Palette per zone:**
  - L1 Facility: cold steel blue-grey `#1b2230`, hazard amber `#e8a13a`, blood-red alarms `#c0392b`, concrete `#3a4150`.
  - L2 Containment: sickly green `#3a5a40` tank-glow, bone white, dried-blood brown.
  - L4 Portal: violet/cyan alien energy `#7a5cff` / `#36e0d4`.
  - L5 Hive: chitin purple-black, acid green, wet reds.
- **Lighting:** Phaser Light2D — point lights (lamps, alarms, muzzle flash, portal glow), normal-mapped
  later. A darkness overlay defines hide-zones visually AND mechanically (same data).

## Character: Cole Vance
- Realistic proportions, rotoscope-feel animation (PoP heritage): several frames per action, weighty.
- Animation set (per direction, mirrored): idle, walk(8), run(8), skid, jump rise/apex/fall, ledge-grab,
  climb, mantle, crouch, cover-press, fire (aim-blended upper body), melee swing, hurt, death.
- Pass A: a clean 2-tone silhouette with a distinct head/gun so aim direction reads at a glance.

## Enemies
- Distinct silhouettes per archetype (readability rule): Guard = bulky+rifle; Crawler = low+spindly;
  Grenadier = arm cocked; Turret = geometric; bosses = 2–3× size, unique palette.

## Tiles / environment
- 32px tile grid. Solids, ladders, hazards (grates/gas), destructibles, hide-niches (darker, recessed).
- Background tells story: dissection tables, tanks, wires, graffiti warnings, alien growth deeper down.

## Asset pipeline (Pass B)
- Source art → texture atlas (`public/assets/atlas/`) + JSON frame data → Phaser loader.
- Sprite sheets named `cole_run_8.png` etc.; manifest in `src/art/manifest.ts` maps logical names → files.
- Audio later: ambient drones, weapon SFX, alien vox (`public/assets/audio/`).

## "Better graphics" checklist (per level Pass B)
- [ ] 3+ parallax layers  [ ] dynamic lights + soft shadows  [ ] particle muzzle/blood/dust/sparks
- [ ] screen-shake + hit-flash juice  [ ] animated props (flickering lights, dripping, tank bubbles)
- [ ] consistent palette + grain/vignette post FX  [ ] readable silhouettes at gameplay zoom
