import { AudioSettings, VehicleCategory } from '../types/game';

class ArcadeAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private engineOsc: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;

  private driftSource: AudioBufferSourceNode | null = null;
  private driftGain: GainNode | null = null;

  private musicTimer: number | null = null;
  private musicStep = 0;

  private settings: AudioSettings = {
    masterVolume: 0.75,
    musicVolume: 0.45,
    sfxVolume: 0.85,
    muted: false,
  };

  public applySettings(next: AudioSettings): void {
    this.settings = { ...next };
    if (!this.ctx || !this.masterGain || !this.musicGain || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const master = next.muted ? 0 : next.masterVolume;
    this.masterGain.gain.setTargetAtTime(master, now, 0.04);
    this.musicGain.gain.setTargetAtTime(next.musicVolume * 0.32, now, 0.04);
    this.sfxGain.gain.setTargetAtTime(next.sfxVolume, now, 0.04);
  }

  public ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      this.applySettings(this.settings);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public startMusic(): void {
    const ctx = this.ensureContext();
    if (!ctx || this.musicTimer !== null) return;

    // Energetic Manila Street Arcade synth bassline & lead groove (132 BPM eighth notes)
    const bassNotes = [110, 110, 130.81, 146.83, 110, 110, 164.81, 146.83];
    const leadNotes = [440, 0, 523.25, 587.33, 659.25, 0, 587.33, 523.25];

    this.musicTimer = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || this.ctx.state !== 'running' || this.settings.muted) return;
      const now = this.ctx.currentTime;
      const idx = this.musicStep % bassNotes.length;
      this.musicStep++;

      // Bass pulse
      const bOsc = this.ctx.createOscillator();
      const bEnv = this.ctx.createGain();
      bOsc.type = 'sawtooth';
      bOsc.frequency.setValueAtTime(bassNotes[idx], now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(520, now);

      bEnv.gain.setValueAtTime(0.001, now);
      bEnv.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
      bEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

      bOsc.connect(filter);
      filter.connect(bEnv);
      bEnv.connect(this.musicGain);
      bOsc.start(now);
      bOsc.stop(now + 0.21);

      // Lead stab
      const lFreq = leadNotes[idx];
      if (lFreq > 0) {
        const lOsc = this.ctx.createOscillator();
        const lEnv = this.ctx.createGain();
        lOsc.type = 'triangle';
        lOsc.frequency.setValueAtTime(lFreq, now);
        lEnv.gain.setValueAtTime(0.001, now);
        lEnv.gain.exponentialRampToValueAtTime(0.1, now + 0.015);
        lEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        lOsc.connect(lEnv);
        lEnv.connect(this.musicGain);
        lOsc.start(now);
        lOsc.stop(now + 0.18);
      }
    }, 225);
  }

  public stopMusic(): void {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  public startRaceEngineSound(category: VehicleCategory): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    this.stopRaceEngineSound();

    const osc = ctx.createOscillator();
    const subOsc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = category === 'futuristic' ? 'sine' : category === 'motorcycle' ? 'sawtooth' : 'triangle';
    subOsc.type = category === 'monster_truck' ? 'sawtooth' : 'sine';

    filter.type = 'lowpass';
    filter.frequency.value = category === 'futuristic' ? 950 : 480;

    gain.gain.value = 0.001;

    osc.connect(filter);
    subOsc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    subOsc.start();

    this.engineOsc = osc;
    this.engineSubOsc = subOsc;
    this.engineGain = gain;

    // White noise buffer for tire screech during drift
    const bufferSize = ctx.sampleRate * 1.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 1450;
    band.Q.value = 3.2;

    const dGain = ctx.createGain();
    dGain.gain.value = 0;

    noise.connect(band);
    band.connect(dGain);
    dGain.connect(this.sfxGain);
    noise.start();

    this.driftSource = noise;
    this.driftGain = dGain;
  }

  public updateRaceEngine(speedNorm: number, isDrifting: boolean, isNitro: boolean, category: VehicleCategory): void {
    if (!this.ctx || !this.engineOsc || !this.engineSubOsc || !this.engineGain) return;
    const now = this.ctx.currentTime;
    const baseHz =
      category === 'motorcycle'
        ? 95
        : category === 'monster_truck'
          ? 52
          : category === 'futuristic'
            ? 120
            : 68;
    const targetFreq = baseHz + speedNorm * (category === 'motorcycle' ? 190 : 125) + (isNitro ? 45 : 0);
    this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.05);
    this.engineSubOsc.frequency.setTargetAtTime(targetFreq * 0.5, now, 0.05);
    const vol = 0.04 + speedNorm * 0.07 + (isNitro ? 0.03 : 0);
    this.engineGain.gain.setTargetAtTime(vol, now, 0.05);

    if (this.driftGain) {
      this.driftGain.gain.setTargetAtTime(isDrifting && speedNorm > 0.25 ? 0.08 : 0, now, 0.04);
    }
  }

  public stopRaceEngineSound(): void {
    try {
      this.engineOsc?.stop();
      this.engineSubOsc?.stop();
      this.driftSource?.stop();
    } catch {
      // already stopped
    }
    this.engineOsc = null;
    this.engineSubOsc = null;
    this.engineGain = null;
    this.driftSource = null;
    this.driftGain = null;
  }

  public playCountdownBeep(isGo: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = isGo ? 'square' : 'sine';
    osc.frequency.setValueAtTime(isGo ? 880 : 440, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isGo ? 0.38 : 0.18));
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + (isGo ? 0.4 : 0.2));
  }

  public playNitroBurst(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.28);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.38);
  }

  public playBump(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(125, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.14);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playLapChime(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const now = ctx.currentTime + i * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + 0.22);
    });
  }

  public playVictoryFanfare(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const fanfare = [523.25, 659.25, 783.99, 1046.5];
    fanfare.forEach((freq, i) => {
      const now = ctx.currentTime + i * 0.11;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (i === 3 ? 0.55 : 0.22));
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + 0.6);
    });
  }

  public playUiClick(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }
}

export const audioEngine = new ArcadeAudioEngine();
