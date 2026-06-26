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

  // ---- music: 96-phrase D-Phrygian dark-Buddhist composition (~3 min loop) -----
  // Scale: D Eb F G A Bb C  (Phrygian — Eastern, dark, rich)
  // Grid:  16th notes @ 118 ms → 127 BPM  |  96 phrases × 16 steps = 1536 steps ≈ 3:01
  //
  // Song arc:  Intro → A → A' → Bridge → Return → Return' → Climax → Outro
  //            sparse   full   low-mel  bridge    richer    var     high    sparse
  private musicTimer = 0;
  private step = 0;
  private intensity = 0;
  private readonly BASE_MS = 118;
  private readonly SONG_LEN = 1536; // 96 × 16 ≈ 181 s

  // Bass line patterns (sawtooth) — D2=73.4 Eb2=77.8 F2=87.3 G2=98.0 A1=55.0 C2=65.4
  private readonly BP = [
    [73.4, 0, 77.8, 73.4, 65.4, 73.4, 0, 0, 73.4, 77.8, 65.4, 0, 55.0, 0, 65.4, 73.4],           // B0 main walk
    [55.0, 0, 65.4, 0, 73.4, 0, 77.8, 0, 87.3, 77.8, 73.4, 65.4, 73.4, 0, 0, 0],                  // B1 bridge
    [73.4, 77.8, 87.3, 77.8, 73.4, 65.4, 73.4, 77.8, 73.4, 0, 73.4, 0, 65.4, 73.4, 65.4, 55.0],  // B2 climax run
    [73.4, 0, 0, 0, 0, 0, 55.0, 0, 73.4, 0, 0, 0, 65.4, 0, 73.4, 0],                              // B3 sparse
  ];
  // Melody patterns (triangle, long decay — singing-bowl quality)
  // Each note rings ~600ms so adjacent 0s are legato "hold".
  // Frequencies — D Phrygian (D Eb F G A Bb C):
  //   Eb3=155.6 F3=174.6 G3=196 A3=220 Bb3=233.1 C4=261.6 D4=293.7 Eb4=311.1 F4=349.2
  private readonly MP = [
    // M0 — main statement: D rises to Eb, settles A-G, returns via C-Bb-A-G
    [293.7, 0, 311.1, 0,  220.0, 196.0, 0, 0,   293.7, 0, 261.6, 0,   233.1, 220.0, 0, 196.0],
    // M1 — low meditation: A falls to F, rises to Bb and back
    [220.0, 0, 0, 196.0,  174.6, 0, 155.6, 0,   174.6, 196.0, 220.0, 0,   233.1, 0, 220.0, 0],
    // M2 — bridge circle: starts C, descends to F, climbs back via A-Bb-C
    [261.6, 0, 233.1, 220.0,  196.0, 220.0, 233.1, 0,  261.6, 0, 293.7, 0,   311.1, 293.7, 261.6, 233.1],
    // M3 — climax drive: D-Eb-F climb, peak Eb4-F4, fall back
    [293.7, 311.1, 349.2, 0,  311.1, 293.7, 261.6, 0,   233.1, 261.6, 293.7, 311.1,  349.2, 311.1, 293.7, 0],
    // M4 — sparse intro/outro: long silences, only 4 anchor notes
    [293.7, 0, 0, 0,  0, 0, 220.0, 0,   0, 0, 0, 0,   196.0, 0, 0, 293.7],
    // M5 — call: ascent G→A→Bb→C→D→Eb, then fall D→C→Bb→A
    [196.0, 0, 220.0, 0,  233.1, 0, 261.6, 0,   293.7, 311.1, 293.7, 0,   261.6, 0, 233.1, 220.0],
    // M6 — response: starts D falls D→C→Bb→A→G→F, rises F→G→A→Bb
    [293.7, 261.6, 0, 233.1,  220.0, 0, 196.0, 0,   174.6, 0, 196.0, 220.0,   233.1, 0, 0, 220.0],
    // M7 — bridge dark: starts high Eb4, chromatic fall Eb→D→C→Bb→A→G→F, rises back
    [311.1, 0, 293.7, 261.6,  233.1, 220.0, 0, 196.0,   174.6, 0, 196.0, 0,   220.0, 233.1, 261.6, 0],
  ];
  // Harmony patterns (triangle, mid-range) — A2=110 G2=98 Bb2=116.5 C3=130.8 F2=87.3 D3=146.8 Eb3=155.6
  private readonly HP = [
    [110.0, 0, 0, 0,   98.0, 0, 0, 0,   116.5, 0, 0, 0,   130.8, 0, 0, 0],              // H0 modal 5ths
    [110.0, 0, 98.0, 0,   87.3, 0, 98.0, 0,   110.0, 0, 116.5, 0,   130.8, 0, 110.0, 0], // H1 rich
    [146.8, 0, 0, 0,   130.8, 0, 0, 0,   116.5, 0, 0, 0,   110.0, 0, 0, 0],              // H2 bridge descend
    [110.0, 155.6, 0, 0,   98.0, 0, 116.5, 0,   110.0, 0, 146.8, 0,   155.6, 0, 130.8, 110.0], // H3 tense
  ];
  // Sub-bass accent (sine) — A0=27.5 C1=32.7 — steady regardless of section
  private readonly SUB = [0,0,0,0, 0,0,27.5,0, 0,0,0,0, 0,0,32.7,0];

  // Song sections — 8 × 12 phrases = 96 phrases
  // m=melody pattern for even phrase-pairs, m2=for odd phrase-pairs (call/response every 2 phrases)
  private readonly SECTS = [
    { start:  0, b: 3, m: 4, m2: 4, h: 0, drums: false }, // intro    — sparse, atmospheric
    { start: 12, b: 0, m: 0, m2: 5, h: 0, drums: true  }, // A        — main statement + call
    { start: 24, b: 0, m: 6, m2: 1, h: 0, drums: true  }, // A'       — response + low variation
    { start: 36, b: 1, m: 2, m2: 7, h: 2, drums: true  }, // Bridge   — circle + dark variation
    { start: 48, b: 0, m: 0, m2: 5, h: 1, drums: true  }, // Return   — main theme, richer harmony
    { start: 60, b: 0, m: 6, m2: 1, h: 1, drums: true  }, // Return'  — response + low, rich
    { start: 72, b: 2, m: 3, m2: 5, h: 3, drums: true  }, // Climax   — driving + call over tension
    { start: 84, b: 3, m: 4, m2: 1, h: 0, drums: false }, // Outro    — sparse fading to meditation
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

    // Find current section (last entry whose start ≤ phrase)
    let sect = this.SECTS[0];
    for (const sc of this.SECTS) if (phrase >= sc.start) sect = sc;

    // Drone — D1 sustained sine, re-fired every 8 steps for continuous rumble
    if (pos % 8 === 0) this.tone(36.7, 1.05, 'sine', 0.18);

    if (sect.drums) {
      if (pos === 0 || pos === 8) this.tone(58, 0.22, 'sine', 0.40, 28); // kick
      if (pos === 8)              this.noise(0.10, 0.22, 4000, 'bandpass'); // snare
      if (pos === 4 || pos === 12) this.noise(0.055, 0.11, 10000, 'highpass'); // open hat
      else if (pos % 4 === 2)     this.noise(0.028, 0.07,  9000, 'highpass'); // closed hat
    }

    const sub = this.SUB[pos];
    if (sub) this.tone(sub, 0.30, 'sine', 0.20);

    const b = this.BP[sect.b][pos];
    if (b) this.tone(b, 0.15, 'sawtooth', 0.18);

    // Alternate between m and m2 every 2 phrases (call / response)
    const phraseInSect = phrase - sect.start;
    const melPat = (Math.floor(phraseInSect / 2) % 2 === 0) ? sect.m : sect.m2;
    const m = this.MP[melPat][pos];
    if (m) this.tone(m, 0.60, 'triangle', 0.10);

    const h = this.HP[sect.h][pos];
    if (h) this.tone(h, 0.36, 'triangle', 0.06);

    // Alarm arp overlay at high intensity
    if (this.intensity > 0 && pos % 4 === 2)
      this.tone(b ? b * 2 : 146.8, 0.09, 'square', 0.045);

    this.step++;
  }
}

export const Sfx = new SfxEngine();
