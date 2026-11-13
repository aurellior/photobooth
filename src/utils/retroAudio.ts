// Retro 8-bit Audio Synthesizer utilizing pure Web Audio API (Zero External Files)

class RetroAudioSynthesizer {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Tactile physical plastic switch click (Micro-impulse)
   */
  public playPlasticClick() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.035);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.035);
    } catch {}
  }

  /**
   * 3-2-1 Countdown Beeps with climbing pitch
   */
  public playCountdownBeep(count: number) {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const freq = count === 1 ? 660 : count === 0 ? 880 : 440;
      const duration = count === 0 ? 0.16 : 0.09;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }

  /**
   * Camera Shutter Snap & Strobe Flash (Noise Burst + Mechanical Slap)
   */
  public playShutterFlash() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // 1. White Noise burst for curtain mechanical sound
      const bufferSize = ctx.sampleRate * 0.12;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.setValueAtTime(1200, now);
      noiseFilter.Q.setValueAtTime(2.5, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 0.12);

      // 2. Low-frequency punch (Mechanical mirror snap)
      const osc = ctx.createOscillator();
      const slapGain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.09);

      slapGain.gain.setValueAtTime(0.25, now);
      slapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(slapGain);
      slapGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);

      // 3. Strobe charging high beep
      const flash = ctx.createOscillator();
      const flashGain = ctx.createGain();
      flash.type = "sine";
      flash.frequency.setValueAtTime(1800, now + 0.04);
      flash.frequency.exponentialRampToValueAtTime(400, now + 0.2);

      flashGain.gain.setValueAtTime(0.08, now + 0.04);
      flashGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      flash.connect(flashGain);
      flashGain.connect(ctx.destination);
      flash.start(now + 0.04);
      flash.stop(now + 0.2);
    } catch {}
  }

  /**
   * Thermal Receipt Printer Stepper Motor Sound (Tick-Tick-Tick Paper Feed)
   */
  public playThermalPrinter(durationMs: number = 1200) {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const stepInterval = 40; // ms per stepper pulse
      const steps = Math.floor(durationMs / stepInterval);

      for (let i = 0; i < steps; i++) {
        const stepTime = ctx.currentTime + (i * stepInterval) / 1000;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Alternating pitch for gear tooth step sound
        const freq = i % 2 === 0 ? 480 : 360;
        osc.type = "square";
        osc.frequency.setValueAtTime(freq, stepTime);

        gain.gain.setValueAtTime(0.06, stepTime);
        gain.gain.exponentialRampToValueAtTime(0.001, stepTime + 0.02);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(stepTime);
        osc.stop(stepTime + 0.02);
      }
    } catch {}
  }

  /**
   * Arcade Coin Insert Melody
   */
  public playCoin() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.07); // E6

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);
    } catch {}
  }

  /**
   * Stamp Slap Impact
   */
  public playStamp() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.06);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch {}
  }

  /**
   * Session Complete Success Jingle
   */
  public playSuccess() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const time = now + idx * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.12, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.15);
      });
    } catch {}
  }
}

export const retroAudio = new RetroAudioSynthesizer();

