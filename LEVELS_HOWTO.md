# Editing levels

Levels are plain-text files in `src/levels/`, one per level: `level0.lvl` … `level5.lvl`.
Open any of them in a text editor, change it, save — the dev server (`npm run dev`) hot-reloads instantly.

A `.lvl` file has two parts separated by a line containing exactly `===`:

```
<header>          # metadata, one "key: value" per line
===
<map>             # the ASCII grid you draw
```

## The map (the part after `===`)

Draw the level with these characters. One character = one 32×32 tile.

### Terrain
| char | meaning |
|------|---------|
| `#` | solid wall / floor |
| `.` | empty air |
| `L` | ladder |
| `S` | static spikes (instant hurt) |
| `T` | loose tile — solid until you stand on it, then it crumbles and drops you through |

### Player / exit
| char | meaning |
|------|---------|
| `P` | player spawn (exactly one) |
| `E` | exit / extraction elevator (exactly one) |
| `h` | hide niche (stealth shadow) |

### Pickups
| char | weapon |   | char | item |
|------|--------|---|------|------|
| `w` | pistol |   | `m` | medkit |
| `x` | shotgun |  | `a` | ammo |
| `y` | smg |      |     |      |
| `z` | rifle |    |     |      |

### Enemies (weak → strong)
| char | enemy | char | enemy |
|------|-------|------|-------|
| `g` | soldier | `c` | crawler |
| `r` | **grenade thrower** | `R` / `G` | burst trooper (red / gold) |
| `M` | marksman | `N` | sniper |
| `B` | bomber | `H` | hunter |
| `D` | drone | `F` | gun-drone |
| `U` | brute | `J` | leaper |
| `W` `Z` `Q` `K` `O` | bosses | | |

> Tip: enemies get tougher automatically on later levels (more HP, faster fire, longer sight) — you don't set that per-enemy.

### Coordinates
Columns count from the **left** starting at 0; rows from the **top** starting at 0.
A "floor row" in the header is the row of the `#` floor an object sits on; the thing stands on the row *above* it.

## The header (the part before `===`)

One `key: value` per line. Lines starting with `#` or `//` are comments. Repeatable keys (gate, plate, hazard, light, checkpoint, reinforce) can appear many times.

| key | example | meaning |
|-----|---------|---------|
| `name` | `THE HIVE` | level title |
| `objective` | `Reach the bottom…` | shown on the HUD |
| `next` | `level3` | which level loads after this one |
| `bgColor` | `0x0a0c08` | background colour (hex) |
| `ambient` | `0.74` | darkness level (0 = bright, 1 = pitch black) |
| `startUnarmed` | `true` | player starts with no weapon |
| `intro` / `outro` | text | screens before / after the level |
| `alarmAtRow` | `23` | crossing this row triggers reinforcements |
| `alarmMsg` | text | the alarm banner |

Positioned extras (column/row numbers):

```
gate: <id> <col> <row0> <row1> <openMs> <stay 0|1> <color|->
plate: <id> <col> <floorRow> <color|->          # stepping on plate <id> opens gate <id>
hazard: <col> <floorRow> <periodMs> <onMs> <offset> [flame|spike]
checkpoint: <col> <floorRow>
reinforce: <enemyChar-name> <col> <floorRow>     # e.g. "reinforce: crawler 8 51"
light: <col> <row> <radius> <intensity> <color|-> [flicker]
searchlight: <x0> <x1> <y> <speed>
```

`-` means "none/default" for a colour slot.

## After editing

- **Just playing locally?** `npm run dev` reloads on save — nothing else needed.
- **Want to check a level is still beatable?** run the solvability verifier:
  `npx esbuild verify_levels.ts --bundle --format=esm --platform=node --outfile=verify.mjs && node verify.mjs`
  It reports `solvable: true/false` and `ladderPierces: 0` for every level.
- **Publishing?** `npm run build`, then push `dist/` to the `gh-pages` branch (the live site).
