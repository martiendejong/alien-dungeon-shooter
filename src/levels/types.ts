export interface Rect { x: number; y: number; w: number; h: number; }

// light positioned in BLOCK coords; radius in blocks
export interface LightDef {
  col: number; row: number; radius: number; intensity: number;
  color?: number; flicker?: number;
}

export type EnemyKind = 'guard' | 'crawler' | 'grenadier' | 'warden' | 'subject' | 'queen' | 'commander' | 'overmind'
  | 'trooper_red' | 'trooper_gold' | 'marksman' | 'sniper' | 'bomber' | 'hunter' | 'leaper' | 'brute' | 'drone' | 'gundrone';

/**
 * Grid level. `grid` is rows of chars:
 *   '#' solid   '.' / ' ' empty   'h' hide niche (empty, hideable)
 *   'P' spawn   'E' exit
 *   'g' guard   'c' crawler   'r' grenadier   'W' warden
 *   'm' medkit  'a' ammo
 */
export interface LevelData {
  id: string;
  name: string;
  objective: string;
  block: number;
  grid: string[];
  lights: LightDef[];
  bgColor: number;
  next?: string;          // id of the level to load on completion
  startUnarmed?: boolean; // if set, the player starts with no weapon (must pick one up)
  // enemies that spawn when the ALARM triggers (grabbing the weapon). col + floor row.
  reinforcements?: { kind: EnemyKind; col: number; floorRow: number }[];
  ambient?: number;       // override base darkness (0 lit .. 1 pitch); darker = scarier
  alarmAtCol?: number;    // crossing this column trips the alarm (instead of grabbing a weapon)
  alarmAtRow?: number;    // reaching this height (row <= value) trips the alarm (for climbing levels)
  alarmMsg?: string;      // banner shown when the alarm trips
  checkpoints?: { col: number; floorRow: number }[]; // reaching one sets your respawn point
  waveMs?: number;        // seconds between reinforcement waves (default 3.6s)
  intro?: string;         // story line shown on level start
  outro?: string;         // story line shown on level clear
  escapeMs?: number;      // once the alarm trips, you have this long to reach the exit or you die
  // sweeping searchlights: spot the player (if lit & not in cover) → spawn a hunter
  searchlights?: { x0: number; x1: number; y: number; speed: number }[];
  // timed hazards: deadly when ON; time your run. col + floor row + cycle.
  // kind: 'flame' (flame jet, default) or 'spike' (pop-out spike strip — classic PoP trap).
  hazards?: { col: number; floorRow: number; periodMs: number; onMs: number; offset: number; kind?: 'flame' | 'spike' }[];
  // PoP-style timed gates: a pressure plate opens the linked gate for openMs, then it slams shut.
  // A gate is a vertical bar of solid blocks (col, rows row0..row1) that is CLOSED (solid) by default.
  // openMs: how long the gate stays open after the plate is hit (PoP timed gate).
  // stayOpen: once opened by the plate it stays open permanently (a switch, not a timed gate).
  gates?: { id: number; col: number; row0: number; row1: number; openMs: number; stayOpen?: boolean; color?: number }[];
  // pressure plates: step on (col, floorRow) to open every gate sharing `id`.
  plates?: { id: number; col: number; floorRow: number; color?: number }[];
}
