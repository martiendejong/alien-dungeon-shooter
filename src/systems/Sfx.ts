// Procedural WebAudio sound effects — no asset files. One shared context across the game.
class SfxEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = false;

  private ensure() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.32;
      this.master.connect(this.ctx.destination);
    } catch { this.ctx = null; }
  }
  resume() { this.ensure(); if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
  toggleMute() { this.muted = !this.muted; if (this.master) this.master.gain.value = this.muted ? 0 : 0.32; return this.muted; }

  private now() { return this.ctx!.currentTime; }

  // a pitched blip; optional pitch slide
  private tone(freq: number, dur: number, type: OscillatorType, vol: number, slideTo?: number, delay = 0) {
    this.ensure(); if (!this.ctx || !this.master || this.muted) return;
    const t = this.now() + delay;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  }
  // Melody voice: slow attack (50ms), long ring (1.4s), sine+triangle for warmth
  private mel(freq: number, vol: number) {
    this.ensure(); if (!this.ctx || !this.master || this.muted) return;
    const t = this.now(); const dur = 1.4;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(this.master);
    const o1 = this.ctx.createOscillator(); o1.type = 'sine';
    o1.frequency.setValueAtTime(freq, t); o1.connect(g); o1.start(t); o1.stop(t + dur + 0.05);
    const o2 = this.ctx.createOscillator(); o2.type = 'triangle';
    o2.frequency.setValueAtTime(freq * 1.003, t); // slight detune for warmth
    const g2 = this.ctx.createGain(); g2.gain.value = 0.4;
    o2.connect(g2).connect(g); o2.start(t); o2.stop(t + dur + 0.05);
  }
  // filtered noise burst
  private noise(dur: number, vol: number, cutoff: number, type: BiquadFilterType = 'lowpass', delay = 0) {
    this.ensure(); if (!this.ctx || !this.master || this.muted) return;
    const t = this.now() + delay;
    const n = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = cutoff;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.master); src.start(t); src.stop(t + dur);
  }

  shot()        { this.tone(880, 0.07, 'square', 0.18, 180); this.noise(0.06, 0.18, 2600, 'highpass'); }
  enemyShot()   { this.tone(320, 0.10, 'sawtooth', 0.12, 120); }
  explosion()   { this.noise(0.5, 0.5, 900); this.tone(90, 0.45, 'sawtooth', 0.25, 40); }
  hit()         { this.tone(180, 0.16, 'square', 0.3, 70); this.noise(0.12, 0.2, 1200); }
  enemyDeath()  { this.tone(420, 0.18, 'sawtooth', 0.16, 90); this.noise(0.16, 0.15, 1800); }
  melee()       { this.noise(0.08, 0.22, 3200, 'highpass'); this.tone(150, 0.08, 'square', 0.15, 80); }
  pickup()      { this.tone(660, 0.09, 'triangle', 0.16); this.tone(990, 0.12, 'triangle', 0.16, undefined, 0.08); }
  jump()        { this.tone(300, 0.10, 'triangle', 0.12, 560); }
  land()        { this.tone(120, 0.07, 'sine', 0.14, 70); }
  climb()       { this.tone(200, 0.05, 'sine', 0.06, 260); }
  alarm()       { for (let i = 0; i < 4; i++) { this.tone(740, 0.18, 'sawtooth', 0.16, 520, i * 0.22); this.tone(520, 0.18, 'sawtooth', 0.16, 740, i * 0.22 + 0.11); } }
  bossRoar()    { this.tone(70, 0.7, 'sawtooth', 0.3, 45); this.noise(0.7, 0.22, 700); this.tone(110, 0.6, 'square', 0.12, 60, 0.05); }
  win()         { this.stopMusic(); [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.18, undefined, i * 0.12)); }
  lose()        { [330, 247, 165].forEach((f, i) => this.tone(f, 0.4, 'sawtooth', 0.2, undefined, i * 0.18)); this.noise(0.6, 0.2, 600); }

  // ---- music: 96-phrase D-Phrygian dark dungeon groove (~3 min loop) ----------
  // Scale: D Eb F G A Bb C  (Phrygian — Eastern, dark)
  // Grid:  16th notes @ 165 ms → ~91 BPM  |  96 phrases × 16 steps = 1536 steps ≈ 4:13
  //
  // Everything an octave lower than before. Melody = quarter notes (every 4 steps).
  // Bass is the main driver; melody floats above it as a slow dark pad.
  private musicTimer = 0;
  private step = 0;
  private intensity = 0;
  private readonly BASE_MS = 165;
  private readonly SONG_LEN = 1536;

  // Bass line (sawtooth) — D1=36.7 Eb1=41.2 F1=43.7 G1=49.0 A1=55.0 Bb1=58.3 C2=65.4 D2=73.4
  private readonly BP = [
    [36.7, 0, 0, 55.0,  36.7, 0, 0, 49.0,  36.7, 0, 0, 65.4,  49.0, 0, 55.0, 0],         // B0 main
    [55.0, 0, 0, 0,     36.7, 0, 49.0, 0,   55.0, 0, 0, 0,     41.2, 0, 36.7, 0],         // B1 bridge
    [36.7, 0, 41.2, 0,  43.7, 0, 49.0, 0,   55.0, 0, 49.0, 0,  43.7, 0, 36.7, 55.0],      // B2 climax
    [36.7, 0, 0, 0,     0,    0, 0,    0,   36.7, 0, 0,    0,   0,    0, 0,    0],          // B3 sparse
  ];
  // Melody (sine+triangle pad, quarter-note spacing — pos 0/4/8/12 only)
  // D2=73.4 Eb2=77.8 F2=87.3 G2=98.0 A2=110.0 Bb2=116.5 C3=130.8 D3=146.8
  private readonly MP = [
    // M0 — anchor descent: D3→A2→G2→A2
    [146.8, 0, 0, 0,  110.0, 0, 0, 0,   98.0, 0, 0, 0,  110.0, 0, 0, 0],
    // M1 — low sway: A2→G2→F2→G2
    [110.0, 0, 0, 0,   98.0, 0, 0, 0,   87.3, 0, 0, 0,   98.0, 0, 0, 0],
    // M2 — Phrygian color: Bb2→A2→Bb2→C3
    [116.5, 0, 0, 0,  110.0, 0, 0, 0,  116.5, 0, 0, 0,  130.8, 0, 0, 0],
    // M3 — slow rise: G2→A2→Bb2→D3
    [ 98.0, 0, 0, 0,  110.0, 0, 0, 0,  116.5, 0, 0, 0,  146.8, 0, 0, 0],
    // M4 — sparse intro/outro: D3 and A2 only
    [146.8, 0, 0, 0,    0,   0, 0, 0,  110.0, 0, 0, 0,    0,   0, 0, 0],
    // M5 — deep floor: D2→Eb2→F2→Eb2
    [ 73.4, 0, 0, 0,   77.8, 0, 0, 0,   87.3, 0, 0, 0,   77.8, 0, 0, 0],
    // M6 — dark riff: F2→G2→F2→Eb2
    [ 87.3, 0, 0, 0,   98.0, 0, 0, 0,   87.3, 0, 0, 0,   77.8, 0, 0, 0],
    // M7 — fall: D3→Bb2→A2→G2
    [146.8, 0, 0, 0,  116.5, 0, 0, 0,  110.0, 0, 0, 0,   98.0, 0, 0, 0],
  ];
  // Harmony pad (triangle, very low — A1=55.0 G1=49.0 Bb1=58.3 C2=65.4 D2=73.4 F2=87.3)
  private readonly HP = [
    [55.0, 0, 0, 0,   0,    0, 0, 0,   49.0, 0, 0, 0,   0,    0, 0, 0],              // H0 sparse
    [55.0, 0, 0, 0,  49.0,  0, 0, 0,   58.3, 0, 0, 0,  65.4,  0, 0, 0],              // H1 walking
    [73.4, 0, 0, 0,  65.4,  0, 0, 0,   58.3, 0, 0, 0,  55.0,  0, 0, 0],              // H2 descend
    [55.0, 0, 77.8, 0, 49.0, 0, 0, 0,  55.0, 0, 73.4, 0, 77.8, 0, 65.4, 0],         // H3 tense
  ];
  // Sub-bass (sine) — A0=27.5 D1=36.7
  private readonly SUB = [27.5, 0, 0, 0,  0, 0, 36.7, 0,  27.5, 0, 0, 0,  0, 0, 36.7, 0];

  // Song sections — 8 × 12 phrases = 96 phrases
  private readonly SECTS = [
    { start:  0, b: 3, m: 4, m2: 4, h: 0, drums: false }, // intro    — sparse, dark
    { start: 12, b: 0, m: 0, m2: 1, h: 0, drums: true  }, // A        — groove enters
    { start: 24, b: 0, m: 6, m2: 1, h: 0, drums: true  }, // A'       — low riff
    { start: 36, b: 1, m: 2, m2: 7, h: 2, drums: true  }, // Bridge   — Phrygian color
    { start: 48, b: 0, m: 0, m2: 5, h: 1, drums: true  }, // Return   — deep floor melody
    { start: 60, b: 0, m: 6, m2: 1, h: 1, drums: true  }, // Return'  — low riff, richer
    { start: 72, b: 2, m: 3, m2: 7, h: 3, drums: true  }, // Climax   — slow rise + tension
    { start: 84, b: 3, m: 4, m2: 1, h: 0, drums: false }, // Outro    — sparse, fading
  ];

  startMusic() {
    this.ensure(); if (!this.ctx || this.musicTimer) return;
    this.musicTimer = window.setInterval(() => this.musicStep(), this.BASE_MS - Math.round(this.intensity * 18));
  }
  stopMusic() { if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = 0; } }
  setMusicIntensity(level: number) {
    if (level === this.intensity) return;
    this.intensity = level;
    if (this.musicTimer) { this.stopMusic(); this.startMusic(); }
  }
  private musicStep() {
    if (this.muted || !this.ctx) return;
    const s   = this.step % this.SONG_LEN;
    const pos = s % 16;
    const phrase = Math.floor(s / 16);

    let sect = this.SECTS[0];
    for (const sc of this.SECTS) if (phrase >= sc.start) sect = sc;

    // Deep drone — D1, re-fired every 8 steps for continuous dark rumble
    if (pos % 8 === 0) this.tone(36.7, 1.35, 'sine', 0.24);


    const sub = this.SUB[pos];
    if (sub) this.tone(sub, 0.38, 'sine', 0.28);

    const b = this.BP[sect.b][pos];
    if (b) this.tone(b, 0.16, 'sawtooth', 0.30);

    const phraseInSect = phrase - sect.start;
    const melPat = (Math.floor(phraseInSect / 2) % 2 === 0) ? sect.m : sect.m2;
    const m = this.MP[melPat][pos];
    if (m) this.mel(m, 0.18);

    const h = this.HP[sect.h][pos];
    if (h) this.tone(h, 0.42, 'triangle', 0.08);

    // Subtle low growl at high intensity
    if (this.intensity > 0 && pos === 12)
      this.tone(b ? b * 2 : 73.4, 0.14, 'square', 0.038);

    this.step++;
  }
}

export const Sfx = new SfxEngine();
