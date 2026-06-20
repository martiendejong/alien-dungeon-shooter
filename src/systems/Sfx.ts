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

  // ---- music: a looping dark minor pulse; tempo rises with intensity --------
  private musicTimer = 0;
  private step = 0;
  private intensity = 0;
  startMusic() {
    this.ensure(); if (!this.ctx || this.musicTimer) return;
    this.musicTimer = window.setInterval(() => this.musicStep(), 280 - this.intensity * 60);
  }
  stopMusic() { if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = 0; } }
  setMusicIntensity(level: number) { // 0 calm .. 1 alarm
    if (level === this.intensity) return;
    this.intensity = level;
    if (this.musicTimer) { this.stopMusic(); this.startMusic(); }
  }
  private musicStep() {
    if (this.muted || !this.ctx) return;
    const bass = [55, 55, 73.4, 65.4];                 // A1 A1 D2 C2 — minor, brooding
    const b = bass[this.step % 4];
    this.tone(b, 0.26, 'sawtooth', 0.09);
    if (this.step % 2 === 0) this.tone(b * 2, 0.10, 'triangle', 0.04);
    if (this.intensity > 0 && this.step % 4 === 2) this.tone(b * 3, 0.08, 'square', 0.035); // alarm arp
    if (this.step % 8 === 7) this.tone(220, 0.16, 'square', 0.04);
    this.step++;
  }
}

export const Sfx = new SfxEngine();
