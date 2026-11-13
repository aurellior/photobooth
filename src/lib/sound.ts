// Retro 8-bit Audio Synthesizer using Web Audio API

class SoundFX {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public playBeep(freq = 440, duration = 0.08, type: OscillatorType = "square") {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio context might be restricted before interaction
    }
  }

  public playCoin() {
    this.playBeep(987, 0.08);
    setTimeout(() => this.playBeep(1318, 0.25), 80);
  }

  public playShutter() {
    this.playBeep(320, 0.05, "sawtooth");
    setTimeout(() => this.playBeep(120, 0.1, "triangle"), 50);
  }

  public playSuccess() {
    this.playBeep(523, 0.06);
    setTimeout(() => this.playBeep(659, 0.06), 70);
    setTimeout(() => this.playBeep(784, 0.12), 140);
  }

  public playClick() {
    this.playBeep(330, 0.04, "square");
  }

  public playStamp() {
    this.playBeep(180, 0.06, "triangle");
  }
}

export const sound = new SoundFX();

