# ALIEN DUNGEON SHOOTER — Working title: **SUBTERRA**

> A cinematic 2D action-platformer. *Prince of Persia* movement + *Blackthorne* cover-tactics,
> with mouse-aimed shooting and modern graphics.

Design authored via mastermind methodology (channelled experts: a cinematic-platformer designer,
a tactical-combat designer, a technical architect, an art director, a level designer) and the
SOLFMBQ+ reasoning pass (IQ: systems coherence · EQ: player feel · SQ: thematic dread · AQ: scope
realism · MQ: the "one more room" pull). Holy-Ghost stance: build the whole thing as one coherent
signal, not a pile of features.

---

## 1. PILLARS (the three things every decision serves)

1. **Weighty, readable movement.** The character has momentum, frames, and commitment — like PoP.
   You feel the body. Mistakes come from misjudging space and timing, not from twitch.
2. **Cover is a tactic, not a wall.** Like Blackthorne, you step into shadow to dodge *bullets* —
   but explosions, gas, and melee reach you anyway. Cover is a decision with risk, not safety.
3. **Aim with intent.** The mouse decouples *where you look/shoot* from *where you move*. You can
   back away while firing, shoot upward at a ledge enemy, lob a grenade over a wall.

If a feature doesn't serve one of these, it's cut or deferred.

---

## 2. STORY

A lone human — **Cole Vance**, ex-Army, chasing a brother who vanished — finds a black-site
facility buried in the desert (an Area-51 analogue, "**Site Echo**"). He descends. Each level down
is more wrong than the last: dissection labs, things in tanks, things that got out. Deep enough,
the facility stops being human-built — there are **portals**. He steps through to alien worlds,
fights his way across them, and comes back to an Earth where the invasion has already begun.
The finale is a gauntlet of human collaborators and alien overlords.

Tone: dread, then awe, then defiance. Sparse text. The environment tells the story (Blackthorne /
*Another World* school of environmental narrative).

### Level arc (8 levels, bosses at ends)

| # | Level | Setting | New mechanic / threat | Boss |
|---|-------|---------|------------------------|------|
| 1 | **The Descent** | Desert entrance → elevator → upper labs | core combat, cover, grenadiers | **Site Warden** (armoured human, shotgun) |
| 2 | **Containment** | Labs, specimen tanks | melee aliens (Crawlers), darkness puzzles | **Subject 0** (escaped experiment) |
| 3 | **The Vault** | Deep reactor levels | gas/explosions ignore cover, turrets | **Hunter-Killer drone** |
| 4 | **The Portal Chamber** | Alien-tech core | first energy weapon, low-grav sections | **The Gatekeeper** (alien sentinel) |
| 5 | **Hive World** | Organic alien planet | acid, ranged spitters, ceiling-clingers | **Brood Matriarch** |
| 6 | **The Spires** | Crystal alien city | light-puzzle inversions (light = safe here) | **Crystal Warlord** |
| 7 | **Earth Fallen** | Invaded city ruins | mixed human+alien enemies, civilians | **Collaborator General** (human traitor) |
| 8 | **The Mothership** | Final ascent | everything combined, boss gauntlet | **The Overmind** (multi-phase) |

---

## 3. CONTROLS (final)

| Action | Key |
|--------|-----|
| Move left / right | ← → |
| Climb up / mantle ledge / climb ladder | ↑ |
| Crouch / drop through platform / descend ladder | ↓ |
| **Toggle Walk / Run** | Left Shift (tap to switch mode; HUD shows WALK/RUN) |
| Jump | Space |
| **Aim** | Mouse (reticle + upper-body aim) |
| **Fire ranged weapon** | Left mouse button |
| Melee attack | Right mouse button *or* F |
| **Throw grenade** (arcs toward cursor) | G |
| Switch weapon | 1 / 2 / 3 and mouse wheel |
| Reload | R |
| **Enter / hold cover (hide)** | C (only inside a hide-zone that is in shadow) |
| Interact (doors, levers, portals, pickups) | E |
| Pause | Esc |

Design notes:
- **Shift = toggle** (explicit user request), not hold. Default mode is WALK (precise, PoP-style).
  RUN is faster but harder to stop on a ledge and noisier (alerts enemies sooner).
- **Cover is its own key (C)** so it never fights with ↑ (climb) or ↓ (crouch). You must be
  standing inside a tile flagged *hideable* **and** the tile must be unlit. In cover you can't move;
  tapping Fire makes you pop out, shoot, and you're briefly exposed (the Blackthorne rhythm).
- Mouse aim works while moving, crouching, and at the instant you pop out of cover.

---

## 4. CORE MECHANICS (spec)

### 4.1 Movement (cinematic controller)
- Custom kinematic state machine over Phaser Arcade bodies. States:
  `idle, walk, run, skid, crouch, jump_rise, jump_fall, ledge_grab, climb, mantle, cover, melee, hurt, dead`.
- **Momentum**: acceleration & friction. RUN has a skid-stop. You can run off a ledge (commit).
- **Ledge grab**: when falling next to a grabbable edge, auto-catch if ↑/Space held; ↑ to mantle, ↓ to drop.
- **Ladders / climbables**: ↑/↓ on a climb surface enters `climb`.
- **Jump**: fixed-arc, gravity-driven; short hop vs full jump by hold time. Coyote-time + jump buffer for feel.
- Numbers (tunable, in `src/config/tuning.ts`): walkSpeed 90, runSpeed 190, jumpVel −340, gravity 900,
  accel 1200, friction 1400, climbSpeed 70.

### 4.2 Aiming & shooting
- Reticle follows the mouse in world space. The player's "aim angle" = angle from chest to cursor.
- Firing spawns a projectile (or hitscan for fast weapons) toward the aim angle, with weapon spread.
- Player upper-body / gun sprite rotates toward aim independent of facing; facing flips to match aim side.
- You can fire while walking, running, crouched, falling, and on cover pop-out.

### 4.3 Cover / hide (the signature)
- A **hide-zone** is a level-authored region (`hideZones[]`) — alcoves, shadowed niches, vents.
- The **lighting system** computes a darkness value at the player's position. Hiding requires
  `inHideZone && darkness >= HIDE_THRESHOLD`.
- In cover: immune to **direct ranged fire** (bullets/energy bolts) and unseen by ranged AI.
- **Cover does NOT protect from**: grenade/AoE explosions, gas clouds, melee enemies adjacent to you,
  or being in light. This is the core risk/reward.
- Enemies also use cover (ranged ones), creating the bullet-trading duel: wait for their reload window.

### 4.4 Weapons
| Weapon | Type | Feel | Notes |
|--------|------|------|-------|
| Pistol | semi, projectile | reliable, low dmg | starting, generous ammo |
| Shotgun | spread hitscan | brutal up close | drops off with range; slow |
| SMG (later) | auto projectile | spray | found L3 |
| Energy Rifle (later) | charged bolt | pierces | found L4 (alien) |
| **Melee**: Combat Knife → Stun Baton | swing arc | finisher / ammo-saver | always available |
| **Grenade (frag)** | thrown arc | clears cover | limited count; arcs toward cursor; ignores cover |

### 4.5 Enemies (AI archetypes)
- **Guard (ranged):** patrols, takes cover, fires in bursts, reloads (vulnerability window).
- **Crawler (melee):** rushes, leaps, claws; cover useless against it — forces you out.
- **Grenadier:** lobs grenades to flush you from cover; keep moving.
- **Turret:** fixed arc, suppresses; destroy or slip past in cover when its light sweeps away.
- **Spitter / Clinger / Boss-specific** (later levels).
- Shared AI: state machine `idle→alert→engage→reposition→reload/cooldown`, line-of-sight via the
  lighting/visibility grid (they can't see you in dark cover either — symmetry).

### 4.6 Health, death, checkpoints
- Player HP bar; med-kits restore. Death → respawn at last checkpoint (level start for L1).
- Enemies telegraph; damage values tuned so a careless open-ground fight kills you — cover matters.

---

## 5. TECH ARCHITECTURE

- **Stack:** Vite + TypeScript + **Phaser 3** (stable, vast docs, Light2D pipeline, Arcade physics).
  (Phaser 4 considered but 2 months old; stability + example base win for a long iterative build.)
- **Scenes:** `BootScene → PreloadScene → MainMenuScene → GameScene(levelId) + HUDScene(overlay) → GameOverScene / PauseScene`.
- **Systems** (`src/systems/`): `InputManager, PlayerController, WeaponSystem, GrenadeSystem,
  ProjectileSystem, EnemyManager, LightingSystem, HideSystem, DamageSystem, LevelLoader, CameraDirector`.
- **Entities** (`src/entities/`): `Player, Enemy (+archetypes), Projectile, Grenade, Pickup, Door, Portal`.
- **Levels as data** (`src/levels/level1.ts` …): geometry (solids), ladders, hideZones, lights,
  enemy spawns, pickups, exits/portals, checkpoints. Migratable to Tiled JSON later.
- **Art**: `TextureFactory` generates placeholder textures procedurally at boot so the game is
  playable immediately; real art drops into `public/assets/` and is swapped via an atlas manifest.
  See `ART_BIBLE.md`.
- **Tuning** centralised in `src/config/tuning.ts` for fast balancing.
- **Build**: `npm run dev` (hot reload) for iteration; `npm run build` → static `dist/` you can open/host.

### Folder layout
```
alien_dungeon_shooter/
  docs/            GAME_DESIGN.md, ART_BIBLE.md, PROGRESS.md
  public/assets/   real art/audio when produced
  src/
    main.ts
    config/tuning.ts
    scenes/
    systems/
    entities/
    levels/
    art/TextureFactory.ts
  index.html  package.json  vite.config.ts  tsconfig.json
```

---

## 6. MILESTONES (sequencing — matches the brief)

1. ✅ Docs (this) + Art bible.
2. Scaffold project, boots to a black screen with HUD.
3. **Level 1 vertical slice**: full movement, mouse-aim shooting, melee, grenades, cover/hide,
   lighting, 3 enemy types, the Site Warden boss, win/lose, checkpoint. Placeholder art.
4. Polish Level 1: real art, lighting atmosphere, animation, juice, balance until it's *challenging and fun*.
5. Level 2 … 8, each: build → playable → polish → boss → next.

**Definition of "level done":** playable start-to-boss, no soft-locks, win+lose paths work, difficulty
curve verified, art at target quality, runs 60fps.
