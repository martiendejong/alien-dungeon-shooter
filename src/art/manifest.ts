export interface AssetEntry { key: string; file: string; }

/**
 * Real-art overrides (Pass B). Drop a PNG into `public/assets/...` and add an entry here:
 * its `key` replaces the matching procedural placeholder everywhere in the game — no other
 * code changes needed. Only list files that actually exist (a listed-but-missing file would
 * remove the placeholder and leave a gap). Prompts + sizes are in public/assets/README.md.
 *
 * Example once you've drawn the brick wall:
 *   { key: 'tile_brick', file: 'assets/tiles/brick.png' },
 */
export const ASSETS: AssetEntry[] = [
  // riveted steel/concrete bunker block → all solid wall + floor tiles
  { key: 'tile_rock_0', file: 'assets/tiles/block.png' },
  { key: 'tile_rock_1', file: 'assets/tiles/block.png' },
  { key: 'tile_rock_2', file: 'assets/tiles/block.png' },
  { key: 'tile_rock_3', file: 'assets/tiles/block.png' },
  // floor surface (lit walkable lip on top) → the walkable-surface tiles
  { key: 'tile_solid_0', file: 'assets/tiles/floor.png' },
  { key: 'tile_solid_1', file: 'assets/tiles/floor.png' },
  { key: 'tile_solid_2', file: 'assets/tiles/floor.png' },
  // background brick wall → tiled (10×10) behind the rooms
  { key: 'tile_brick', file: 'assets/tiles/brick.png' },
];
