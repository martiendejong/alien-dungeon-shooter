import { LevelData, EnemyKind } from './types';

// Parses a plain-text .lvl file into a LevelData. A .lvl file is:
//   <header lines: "key: value">      (one per line; gate/plate/hazard/light/checkpoint/reinforce repeat)
//   ===                               (a line of exactly three equals — the separator)
//   <ASCII map rows>                  (the level grid, drawn with the tile/marker chars)
// Lines in the header starting with // or # are comments. The map is taken verbatim after the ===.
//
// Tile/marker chars in the map:
//   #=wall/floor  .=empty  L=ladder  S=spikes  T=loose tile
//   P=spawn  E=exit/elevator  h=hide niche
//   g=soldier c=crawler r=grenadier  R/G=trooper(red/gold) M=marksman N=sniper B=bomber
//   H=hunter D=drone F=gundrone U=brute J=leaper   W/Z/Q/K/O=bosses
//   m=medkit a=ammo  w=pistol x=shotgun y=smg z=rifle

const num = (s: string): number => s.startsWith('0x') ? parseInt(s, 16) : parseFloat(s);
const col = (s: string | undefined): number | undefined => (!s || s === '-') ? undefined : num(s);

export function parseLevel(id: string, text: string): LevelData {
  const norm = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const i = norm.indexOf('\n===\n');
  const headerPart = i >= 0 ? norm.slice(0, i) : '';
  const mapPart = i >= 0 ? norm.slice(i + 5) : norm;
  const grid = mapPart.replace(/\n+$/, '').split('\n');

  const L: any = { id, block: 32, grid };
  const lights: any[] = [], gates: any[] = [], plates: any[] = [], hazards: any[] = [];
  const checkpoints: any[] = [], reinforcements: any[] = [], searchlights: any[] = [];

  for (const raw of headerPart.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('//') || line.startsWith('#')) continue;
    const ci = line.indexOf(':'); if (ci < 0) continue;
    const key = line.slice(0, ci).trim();
    const val = line.slice(ci + 1).trim();
    const t = val.split(/\s+/);
    switch (key) {
      case 'name': L.name = val; break;
      case 'objective': L.objective = val; break;
      case 'next': L.next = val; break;
      case 'intro': L.intro = val; break;
      case 'outro': L.outro = val; break;
      case 'alarmMsg': L.alarmMsg = val; break;
      case 'ambient': L.ambient = num(val); break;
      case 'bgColor': L.bgColor = num(val); break;
      case 'block': L.block = num(val); break;
      case 'startUnarmed': L.startUnarmed = val === 'true' || val === '1'; break;
      case 'alarmAtRow': L.alarmAtRow = num(val); break;
      case 'alarmAtCol': L.alarmAtCol = num(val); break;
      case 'escapeMs': L.escapeMs = num(val); break;
      case 'waveMs': L.waveMs = num(val); break;
      case 'gate': gates.push({ id: +t[0], col: +t[1], row0: +t[2], row1: +t[3], openMs: +t[4], stayOpen: t[5] === '1' || t[5] === 'stay', color: col(t[6]) }); break;
      case 'plate': plates.push({ id: +t[0], col: +t[1], floorRow: +t[2], color: col(t[3]) }); break;
      case 'hazard': hazards.push({ col: +t[0], floorRow: +t[1], periodMs: +t[2], onMs: +t[3], offset: +t[4], kind: (t[5] as any) || undefined }); break;
      case 'checkpoint': checkpoints.push({ col: +t[0], floorRow: +t[1] }); break;
      case 'reinforce': reinforcements.push({ kind: t[0] as EnemyKind, col: +t[1], floorRow: +t[2] }); break;
      case 'searchlight': searchlights.push({ x0: +t[0], x1: +t[1], y: +t[2], speed: +t[3] }); break;
      case 'light': lights.push({ col: +t[0], row: +t[1], radius: +t[2], intensity: +t[3], color: col(t[4]), flicker: t[5] ? +t[5] : undefined }); break;
    }
  }
  L.lights = lights;
  if (gates.length) L.gates = gates;
  if (plates.length) L.plates = plates;
  if (hazards.length) L.hazards = hazards;
  if (checkpoints.length) L.checkpoints = checkpoints;
  if (reinforcements.length) L.reinforcements = reinforcements;
  if (searchlights.length) L.searchlights = searchlights;
  return L as LevelData;
}

/** Serialize a LevelData back to .lvl text (used to convert the code-built levels into editable files). */
export function emitLevel(L: LevelData): string {
  const h = (s: string) => s.toString();
  const hex = (n: number | undefined) => n == null ? '-' : '0x' + n.toString(16).padStart(6, '0');
  const out: string[] = [];
  out.push(`name: ${L.name}`);
  if (L.objective) out.push(`objective: ${L.objective}`);
  if (L.next) out.push(`next: ${L.next}`);
  out.push(`bgColor: ${hex(L.bgColor)}`);
  if (L.ambient != null) out.push(`ambient: ${L.ambient}`);
  if (L.startUnarmed) out.push(`startUnarmed: true`);
  if (L.intro) out.push(`intro: ${L.intro}`);
  if (L.outro) out.push(`outro: ${L.outro}`);
  if (L.alarmAtRow != null) out.push(`alarmAtRow: ${L.alarmAtRow}`);
  if (L.alarmAtCol != null) out.push(`alarmAtCol: ${L.alarmAtCol}`);
  if (L.alarmMsg) out.push(`alarmMsg: ${L.alarmMsg}`);
  if (L.escapeMs != null) out.push(`escapeMs: ${L.escapeMs}`);
  if (L.waveMs != null) out.push(`waveMs: ${L.waveMs}`);
  for (const g of L.gates ?? []) out.push(`gate: ${g.id} ${g.col} ${g.row0} ${g.row1} ${g.openMs} ${g.stayOpen ? 1 : 0} ${hex(g.color)}`);
  for (const p of L.plates ?? []) out.push(`plate: ${p.id} ${p.col} ${p.floorRow} ${hex(p.color)}`);
  for (const z of L.hazards ?? []) out.push(`hazard: ${z.col} ${z.floorRow} ${z.periodMs} ${z.onMs} ${z.offset}${z.kind ? ' ' + z.kind : ''}`);
  for (const c of L.checkpoints ?? []) out.push(`checkpoint: ${c.col} ${c.floorRow}`);
  for (const r of L.reinforcements ?? []) out.push(`reinforce: ${r.kind} ${r.col} ${r.floorRow}`);
  for (const s of L.searchlights ?? []) out.push(`searchlight: ${s.x0} ${s.x1} ${s.y} ${s.speed}`);
  for (const li of L.lights ?? []) out.push(`light: ${li.col} ${li.row} ${li.radius} ${li.intensity} ${hex(li.color)}${li.flicker != null ? ' ' + li.flicker : ''}`);
  out.push('===');
  return out.join('\n') + '\n' + L.grid.map(h).join('\n') + '\n';
}
