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

  // ---- music: 16-step D-Phrygian dark-Buddhist groove — heavy sub, ~127 BPM ----
  // Scale: D Eb F G A Bb C  (Phrygian — dark, Eastern, harmonically rich)
  // Grid:  16th notes at 118 ms → quarter note 472 ms → 127 BPM
  private musicTimer = 0;
  private step = 0;
  private intensity = 0;
  private readonly BASE_MS = 118;
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
    const pos = this.step % 16;

    // Drone — D1 (36.7 Hz) sustained sine, re-triggered every 8 steps to keep rumble continuous
    if (pos % 8 === 0) this.tone(36.7, 1.05, 'sine', 0.18);

    // Kick — pitched sine drop (58→28 Hz) on beats 1 & 3
    if (pos === 0 || pos === 8) this.tone(58, 0.22, 'sine', 0.40, 28);

    // Snare — bandpass noise burst on beat 3
    if (pos === 8) this.noise(0.10, 0.22, 4000, 'bandpass');

    // Sub-bass accent hits — A0 (27.5) and C1 (32.7) for harmonic depth
    //   pos:  0  1  2  3   4  5  6  7   8  9 10 11  12 13 14 15
    const SUB = [0, 0, 0, 0,  0, 0, 27.5, 0,  0, 0, 0, 0,  0, 0, 32.7, 0];
    if (SUB[pos]) this.tone(SUB[pos], 0.30, 'sine', 0.20);

    // Bass melody — sawtooth, walking D-Phrygian line
    const BASS = [73.4, 0, 77.8, 73.4,  65.4, 73.4, 0, 0,
                  73.4, 77.8, 65.4, 0,   55.0, 0, 65.4, 73.4];
    if (BASS[pos]) this.tone(BASS[pos], 0.15, 'sawtooth', 0.18);

    // Bell melody — long-decay triangle for Buddhist singing-bowl feel
    //   D4=293.7  A3=220  G3=196  Eb4=311.1  C4=261.6  Bb3=233.1  F3=174.6
    const BELL = [293.7, 0, 0, 220.0,  196.0, 0, 311.1, 0,
                  293.7, 0, 0, 261.6,  220.0, 233.1, 0, 196.0];
    if (BELL[pos]) this.tone(BELL[pos], 0.60, 'triangle', 0.10);

    // Harmony — modal 5ths & minor intervals (triangle), one per bar
    const HARM = [110.0, 0, 0, 0,   98.0, 0, 0, 0,   116.5, 0, 0, 0,   130.8, 0, 0, 0];
    if (HARM[pos]) this.tone(HARM[pos], 0.36, 'triangle', 0.06);

    // Hi-hat — open on off-beats 4 & 12, closed shaker on 2 6 10 14
    if (pos === 4 || pos === 12) this.noise(0.055, 0.11, 10000, 'highpass');
    else if (pos % 4 === 2)      this.noise(0.028, 0.07,  9000, 'highpass');

    // Alarm arp overlay at high intensity
    if (this.intensity > 0 && pos % 4 === 2)
      this.tone(BASS[pos] ? BASS[pos] * 2 : 146.8, 0.09, 'square', 0.045);

    this.step++;
  }
}

export const Sfx = new SfxEngine();
