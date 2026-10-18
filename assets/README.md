# SUBTERRA — Real Art Drop-In (Pass B)

Make a PNG, save it at the path below, then add one line to `src/art/manifest.ts`:
```ts
{ key: 'tile_brick', file: 'assets/tiles/brick.png' },
```
It instantly replaces the placeholder everywhere — no other code changes. Restart `npm run dev`.

## Hard rules for every image
- **Any resolution is fine** — tiles are auto-scaled to the 32px grid, so generate big (e.g. 512–1024px square) for detail. Just keep the **aspect ratio** noted (tiles square; window ~5:7).
- **Flat / evenly lit** — NO baked shadows, highlights, or perspective. The game adds dynamic lighting on top; baked light fights it.
- **Tiles must be seamless** (tileable) on the noted edges, or you'll see grid seams.
- **Props & characters: transparent background** (PNG alpha).
- **Characters: drawn in side-profile FACING RIGHT.** The game mirrors them for left. Keep the silhouette identical across a character's frames (only legs/arms move) or animation will jitter.
- Style: gritty sci-fi bunker / dungeon, muted desaturated palette, readable at small size.

---

## TILES (32×32, seamless)

**`assets/tiles/brick.png`** — background wall
> Seamless 32×32 tileable 2D game background wall of small dark dungeon bricks, muted purple-grey, recessed mortar, flat even lighting, no perspective, gritty sci-fi bunker, tileable on all four edges.

**`assets/tiles/rock_0.png` … `rock_3.png`** — solid wall/rock (4 variants)
> Seamless 32×32 tileable dark blue-grey stone/concrete bunker wall tile, subtle cracks and grime, flat even lighting, no perspective, tileable on all edges. (Make 4 slightly different versions for variety.)

**`assets/tiles/floor_0.png` … `floor_2.png`** — walkable floor top (3 variants)
> 32×32 industrial metal-and-stone floor tile with a slightly brighter top lip (the walkable surface), worn panels and bolts, flat lighting, tileable left/right. (3 variants.)

**`assets/tiles/ladder.png`** — ladder rung
> 32×32 metal ladder tile, two vertical rails plus one rung, dark worn metal, transparent background between/around the rails, seamless top and bottom.

---

## PROPS (transparent background)

**`assets/props/window.png`** — 40×56 — barred window
> 2D game prop, barred bunker/dungeon window at night, dark iron frame, deep-blue night glass with a faint cold moonlight glow, iron cross-bars, transparent background, flat lighting, 40×56 px.

(Decals like cracks/stains/pipes/panels/vents/moss/cables are optional 32×32 transparent overlays — keys `decal_crack, decal_stain, decal_vent, decal_pipe, decal_panel, decal_moss, decal_cable, decal_bolts`.)

---

## CHARACTERS (side-profile, FACING RIGHT, transparent bg)

**Hero "Cole"** — 28×48 each:
- `assets/characters/cole_idle.png` — standing, weight settled.
- `assets/characters/cole_walk_0..3.png` — 4-frame walk cycle (contact, passing, contact, passing).
- `assets/characters/cole_jump.png` — pushing up, legs tucked.
- `assets/characters/cole_fall.png` — falling, legs/arms spread.
- `assets/characters/cole_climb_0..1.png` — gripping a ledge/ladder, 2-frame.
> Side-profile 2D platformer hero FACING RIGHT, ex-soldier in olive/teal tactical gear, a clear bright visor on the FRONT of the head so facing reads instantly, transparent background, flat lighting, 28×48 px, [pose]. Identical proportions across all frames.

**Enemies** (28×48 unless noted), keys `guard_0..3`, `grenadier_0..3`, `warden_0..3` (warden 48×80), `crawler_0..1` (44×28). Each `_0` is idle, `_1.._3` a walk cycle.
> Side-profile 2D enemy FACING RIGHT, transparent background, flat lighting, distinct silhouette:
> - **guard**: bulky grey human soldier with a rifle, red visor. 28×48.
> - **grenadier**: human with one arm cocked to throw, orange trim. 28×48.
> - **warden** (boss): hulking armoured human with a shotgun, red eye-glare, menacing. 48×80.
> - **crawler**: low spindly alien creature, multiple legs, glowing purple eyes on the front. 44×28.

---

## How overrides resolve
`BootScene` generates the procedural placeholders, then loads every file in `manifest.ts` and swaps it in by `key`. Animations are rebuilt afterward, so replacing a frame (e.g. `cole_walk_2`) just works. Only list files that exist.
