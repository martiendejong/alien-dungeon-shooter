export interface AssetEntry { key: string; file: string; }

/**
 * Real-art overrides (Pass B). Drop a PNG into `public/assets/...` and add an entry here:
 * its `key` replaces the matching procedural placeholder everywhere in the game - no other
 * code changes needed. Only list files that actually exist (a listed-but-missing file would
 * remove the placeholder and leave a gap). Prompts + sizes are in public/assets/README.md.
 *
 * Example once you've drawn the brick wall:
 *   { key: 'tile_brick', file: 'assets/tiles/brick.png' },
 */
export const ASSETS: AssetEntry[] = [
  // master-tileset walls + floors (from the ChatGPT Military Base master tileset)
  { key: 'tile_rock_0', file: 'assets/tiles/wall_a.png' },
  { key: 'tile_rock_1', file: 'assets/tiles/wall_b.png' },
  { key: 'tile_rock_2', file: 'assets/tiles/wall_c.png' },
  { key: 'tile_rock_3', file: 'assets/tiles/wall_d.png' },
  { key: 'tile_solid_0', file: 'assets/tiles/floor_a.png' },
  { key: 'tile_solid_1', file: 'assets/tiles/floor_b.png' },
  { key: 'tile_solid_2', file: 'assets/tiles/floor_c.png' },
  // background wall -> tiled behind the rooms
  { key: 'tile_brick', file: 'assets/tiles/bgwall.png' },
  { key: 'tile_platform', file: 'assets/tiles/platform_lip.png' },
  { key: 'tile_ladder', file: 'assets/tiles/ladder.png' },
  { key: 'tile_hide', file: 'assets/tiles/hide.png' },
  // per-world themed variants (picked up by GameScene.tkey when present)
  { key: 'tile_rock_0_hive', file: 'assets/tiles/wall_hive.png' },
  { key: 'tile_brick_hive', file: 'assets/tiles/bgwall_hive.png' },
  { key: 'tile_rock_0_under', file: 'assets/tiles/wall_under.png' },
  { key: 'tile_brick_under', file: 'assets/tiles/bgwall_under.png' },
  // mechanisms (from the ChatGPT mechanisms sheet): gate cell, pressure plate, portal
  { key: 'door', file: 'assets/tiles/gate.png' },
  { key: 'plate', file: 'assets/tiles/plate_up.png' },
  { key: 'plate_dn', file: 'assets/tiles/plate_down.png' },
  { key: 'portal', file: 'assets/tiles/portal.png' },
  // hazards + pickups
  { key: 'spikes', file: 'assets/tiles/spikes.png' },
  { key: 'flame', file: 'assets/tiles/flame.png' },
  { key: 'medkit', file: 'assets/tiles/medkit.png' },
  { key: 'ammo', file: 'assets/tiles/ammo.png' },
  // wall props (lighting + mechanisms sheets)
  { key: 'prop_lamp', file: 'assets/props/walllamp.png' },
  { key: 'prop_beacon', file: 'assets/props/beacon.png' },
  { key: 'prop_ceillamp', file: 'assets/props/ceilinglamp.png' },
  { key: 'prop_fan', file: 'assets/props/fan.png' },
  { key: 'prop_camera', file: 'assets/props/camera.png' },
  { key: 'prop_barrel', file: 'assets/props/barrel.png' },
  { key: 'prop_crate', file: 'assets/props/crate.png' },
  // real enemy art (from the ChatGPT enemy sheet): alien spitter -> Subject Zero + brute,
  // alien claw -> the Queen, gun-drone -> drone/gundrone
  { key: 'subject_0', file: 'assets/enemies/subject_0.png' },
  { key: 'subject_1', file: 'assets/enemies/subject_1.png' },
  { key: 'subject_2', file: 'assets/enemies/subject_2.png' },
  { key: 'subject_3', file: 'assets/enemies/subject_3.png' },
  { key: 'queen_0', file: 'assets/enemies/queen_0.png' },
  { key: 'queen_1', file: 'assets/enemies/queen_1.png' },
  { key: 'queen_2', file: 'assets/enemies/queen_2.png' },
  { key: 'queen_3', file: 'assets/enemies/queen_3.png' },
  { key: 'drone_0', file: 'assets/enemies/drone_0.png' },
  { key: 'drone_1', file: 'assets/enemies/drone_1.png' },
  // cinematic parallax backdrops (from the ChatGPT level concept art), one per level + title
  { key: 'bg_title', file: 'assets/bg/bg_title.jpg' },
  { key: 'bg_level0', file: 'assets/bg/bg_level0.jpg' },
  { key: 'bg_level1', file: 'assets/bg/bg_level1.jpg' },
  { key: 'bg_level2', file: 'assets/bg/bg_level2.jpg' },
  { key: 'bg_level3', file: 'assets/bg/bg_level3.jpg' },
  { key: 'bg_level4', file: 'assets/bg/bg_level4.jpg' },
  { key: 'bg_level5', file: 'assets/bg/bg_level5.jpg' },
  { key: 'bg_level6', file: 'assets/bg/bg_level6.jpg' },
  { key: 'bg_level7', file: 'assets/bg/bg_level7.jpg' },
  { key: 'bg_level8', file: 'assets/bg/bg_level8.jpg' },
  { key: 'bg_level9', file: 'assets/bg/bg_level9.jpg' },
  { key: 'bg_level10', file: 'assets/bg/bg_level10.jpg' },
];
