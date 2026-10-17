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
  // riveted steel/concrete bunker block -> all solid wall + floor tiles
  { key: 'tile_rock_0', file: 'assets/tiles/block.png' },
  { key: 'tile_rock_1', file: 'assets/tiles/block.png' },
  { key: 'tile_rock_2', file: 'assets/tiles/block.png' },
  { key: 'tile_rock_3', file: 'assets/tiles/block.png' },
  // floor surface (lit walkable lip on top) -> the walkable-surface tiles
  { key: 'tile_solid_0', file: 'assets/tiles/floor.png' },
  { key: 'tile_solid_1', file: 'assets/tiles/floor.png' },
  { key: 'tile_solid_2', file: 'assets/tiles/floor.png' },
  // background brick wall -> tiled (10x10) behind the rooms
  { key: 'tile_brick', file: 'assets/tiles/brick.png' },
  // pop-out spike trap (from the ChatGPT traps sheet)
  { key: 'spikes', file: 'assets/tiles/spikes.png' },
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
