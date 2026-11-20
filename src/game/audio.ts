import type { DomainEffectType } from './types';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterLimiter: DynamicsCompressorNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private saturationCurve: Float32Array<ArrayBuffer> | null = null;
  private activeDomainBus: GainNode | null = null;
  private activeDomainTimer: number | null = null;
  private muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private getMasterDestination(ctx: AudioContext): AudioNode {
    if (!this.masterLimiter || this.masterLimiter.context !== ctx) {
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.setValueAtTime(-14, ctx.currentTime);
      comp.knee.setValueAtTime(18, ctx.currentTime);
      comp.ratio.setValueAtTime(6, ctx.currentTime);
      comp.attack.setValueAtTime(0.004, ctx.currentTime);
      comp.release.setValueAtTime(0.18, ctx.currentTime);
      comp.connect(ctx.destination);
      this.masterLimiter = comp;
    }
    return this.masterLimiter;
  }

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer && this.noiseBuffer.sampleRate === ctx.sampleRate) {
      return this.noiseBuffer;
    }
    const length = Math.floor(ctx.sampleRate * 1.6);
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        // Soft pink-ish underwater spectrum roll-off
        b0 = 0.997 * b0 + white * 0.029;
        b1 = 0.985 * b1 + white * 0.032;
        b2 = 0.95 * b2 + white * 0.048;
        data[i] = Math.max(-1, Math.min(1, (b0 + b1 + b2 + white * 0.14) * 1.35));
      }
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  private getSaturationCurve(): Float32Array<ArrayBuffer> {
    if (this.saturationCurve) return this.saturationCurve;
    const n = 256;
    const curve = new Float32Array(new ArrayBuffer(n * 4));
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = Math.tanh(x * 2.2);
    }
    this.saturationCurve = curve;
    return curve;
  }

  public unlock(): void {
    this.ensureContext();
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      this.stopDomainAmbience();
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public playSlash(empowered: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = empowered ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(empowered ? 680 : 520, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.13);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playHitTentacle(critical: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(critical ? 340 : 220, now);
    osc.frequency.exponentialRampToValueAtTime(85, now + 0.09);

    gain.gain.setValueAtTime(critical ? 0.15 : 0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  public playSever(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Crisp high slice + deep oceanic thud
    const sliceOsc = ctx.createOscillator();
    const sliceGain = ctx.createGain();
    sliceOsc.type = 'sawtooth';
    sliceOsc.frequency.setValueAtTime(920, now);
    sliceOsc.frequency.exponentialRampToValueAtTime(210, now + 0.18);
    sliceGain.gain.setValueAtTime(0.18, now);
    sliceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    sliceOsc.connect(sliceGain);
    sliceGain.connect(ctx.destination);
    sliceOsc.start(now);
    sliceOsc.stop(now + 0.21);

    const thudOsc = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thudOsc.type = 'sine';
    thudOsc.frequency.setValueAtTime(135, now);
    thudOsc.frequency.exponentialRampToValueAtTime(42, now + 0.24);
    thudGain.gain.setValueAtTime(0.24, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
    thudOsc.connect(thudGain);
    thudGain.connect(ctx.destination);
    thudOsc.start(now);
    thudOsc.stop(now + 0.27);
  }

  public playDash(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.11);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playJustDodge(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [587.33, 880];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.055);
      gain.gain.setValueAtTime(0.14, now + idx * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.055 + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.055);
      osc.stop(now + idx * 0.055 + 0.19);
    });
  }

  public playSlamImpact(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(34, now + 0.22);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playPlayerHit(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(170, now);
    osc.frequency.linearRampToValueAtTime(60, now + 0.28);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.32);
  }

  public playPickup(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.045);
      gain.gain.setValueAtTime(0.11, now + i * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.045 + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.045);
      osc.stop(now + i * 0.045 + 0.15);
    });
  }

  public playWaveClear(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [392.0, 493.88, 587.33, 783.99];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.08);
      gain.gain.setValueAtTime(0.14, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.26);
    });
  }

  public playSkillWhirlwind(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [0, 0.09, 0.18].forEach((offset, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(420 + i * 110, now + offset);
      osc.frequency.exponentialRampToValueAtTime(180, now + offset + 0.14);
      gain.gain.setValueAtTime(0.13, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.16);
    });
  }

  public playSkillWave(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(860, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.25);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.27);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  public playSkillCleaver(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Rising leap charge
    const rise = ctx.createOscillator();
    const riseGain = ctx.createGain();
    rise.type = 'triangle';
    rise.frequency.setValueAtTime(220, now);
    rise.frequency.exponentialRampToValueAtTime(660, now + 0.22);
    riseGain.gain.setValueAtTime(0.12, now);
    riseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    rise.connect(riseGain);
    riseGain.connect(ctx.destination);
    rise.start(now);
    rise.stop(now + 0.25);

    // Heavy impact slam
    const slam = ctx.createOscillator();
    const slamGain = ctx.createGain();
    slam.type = 'sawtooth';
    slam.frequency.setValueAtTime(180, now + 0.24);
    slam.frequency.exponentialRampToValueAtTime(42, now + 0.56);
    slamGain.gain.setValueAtTime(0.24, now + 0.24);
    slamGain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);
    slam.connect(slamGain);
    slamGain.connect(ctx.destination);
    slam.start(now + 0.24);
    slam.stop(now + 0.6);
  }

  public playKrakenDefeat(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const rumble = ctx.createOscillator();
    const rumbleGain = ctx.createGain();
    rumble.type = 'sawtooth';
    rumble.frequency.setValueAtTime(140, now);
    rumble.frequency.exponentialRampToValueAtTime(34, now + 1.15);
    rumbleGain.gain.setValueAtTime(0.22, now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    rumble.connect(rumbleGain);
    rumbleGain.connect(ctx.destination);
    rumble.start(now);
    rumble.stop(now + 1.25);
  }

  public playVictoryFanfare(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.11;
      const dur = idx === notes.length - 1 ? 0.58 : 0.24;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    });
  }

  public playCoinExchange(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [987.77, 1318.51].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.055);
      gain.gain.setValueAtTime(0.14, now + i * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.055);
      osc.stop(now + i * 0.055 + 0.17);
    });
  }

  public playSwordForge(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [440, 659.25, 880, 1174.66].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + i * 0.06;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  public playSkillRush(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(1120, now + 0.14);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.28);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.32);
  }

  public playSkillOrbit(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = now + idx * 0.045;
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.15, t + 0.2);
      gain.gain.setValueAtTime(0.11, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  public playSkillMeteor(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(740, now);
    osc.frequency.exponentialRampToValueAtTime(95, now + 0.36);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  public playBerserkActivate(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(110, now);
    sub.frequency.exponentialRampToValueAtTime(55, now + 0.38);
    subGain.gain.setValueAtTime(0.2, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    sub.connect(subGain);
    subGain.connect(ctx.destination);
    sub.start(now);
    sub.stop(now + 0.42);

    [330, 440, 659.25, 880].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.045;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  public stopDomainAmbience(): void {
    if (this.activeDomainTimer !== null) {
      window.clearTimeout(this.activeDomainTimer);
      this.activeDomainTimer = null;
    }
    const bus = this.activeDomainBus;
    this.activeDomainBus = null;
    if (!bus || !this.ctx) return;

    const now = this.ctx.currentTime;
    try {
      bus.gain.cancelScheduledValues(now);
      bus.gain.setValueAtTime(Math.max(0.0001, bus.gain.value), now);
      bus.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
      window.setTimeout(() => {
        try {
          bus.disconnect();
        } catch {
          // Ignore already-disconnected node
        }
      }, 130);
    } catch {
      // Ignore context state errors
    }
  }

  public playDomainExpansion(
    effect: DomainEffectType = 'infinite_void',
    durationSec = 7,
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.stopDomainAmbience();

    const now = ctx.currentTime;
    const safeDur = Math.max(2.5, Math.min(15, durationSec));
    const dest = this.getMasterDestination(ctx);

    const domainBus = ctx.createGain();
    domainBus.gain.setValueAtTime(0.0001, now);
    domainBus.gain.exponentialRampToValueAtTime(0.95, now + 0.05);
    domainBus.gain.setValueAtTime(0.95, now + Math.max(0.5, safeDur - 0.35));
    domainBus.gain.exponentialRampToValueAtTime(0.0001, now + safeDur + 0.2);
    domainBus.connect(dest);
    this.activeDomainBus = domainBus;

    this.activeDomainTimer = window.setTimeout(() => {
      if (this.activeDomainBus === domainBus) {
        this.activeDomainBus = null;
        this.activeDomainTimer = null;
      }
      try {
        domainBus.disconnect();
      } catch {
        // Ignore
      }
    }, Math.ceil((safeDur + 0.4) * 1000));

    const noiseBuf = this.getNoiseBuffer(ctx);

    // 1. Pre-drop Spatial Vacuum Suction (0.00s -> 0.11s, locks into the uBurst shockwave)
    const suctionSrc = ctx.createBufferSource();
    suctionSrc.buffer = noiseBuf;
    const suctionFilter = ctx.createBiquadFilter();
    suctionFilter.type = 'bandpass';
    suctionFilter.Q.setValueAtTime(3.6, now);
    suctionFilter.frequency.setValueAtTime(190, now);
    suctionFilter.frequency.exponentialRampToValueAtTime(2200, now + 0.1);
    const suctionGain = ctx.createGain();
    suctionGain.gain.setValueAtTime(0.001, now);
    suctionGain.gain.exponentialRampToValueAtTime(0.24, now + 0.085);
    suctionGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    suctionSrc.connect(suctionFilter);
    suctionFilter.connect(suctionGain);
    suctionGain.connect(domainBus);
    suctionSrc.start(now);
    suctionSrc.stop(now + 0.16);

    // 2. Low-Frequency Spatial Distortion Shockwave (0.06s -> 1.65s, synced with uBurst 0->1)
    const subOsc = ctx.createOscillator();
    const subHarmOsc = ctx.createOscillator();
    const subDrive = ctx.createWaveShaper();
    subDrive.curve = this.getSaturationCurve();
    subDrive.oversample = '2x';

    const subLowpass = ctx.createBiquadFilter();
    subLowpass.type = 'lowpass';
    subLowpass.Q.setValueAtTime(4.2, now + 0.06);
    subLowpass.frequency.setValueAtTime(420, now + 0.06);
    subLowpass.frequency.exponentialRampToValueAtTime(92, now + 0.78);
    subLowpass.frequency.exponentialRampToValueAtTime(140, now + 1.5);

    // FM spatial warp LFO modulating the low-frequency sub & filter
    const warpSubLfo = ctx.createOscillator();
    const warpSubPitchGain = ctx.createGain();
    const warpSubFilterGain = ctx.createGain();
    warpSubLfo.type = 'sine';
    warpSubLfo.frequency.setValueAtTime(16.0, now + 0.06);
    warpSubLfo.frequency.exponentialRampToValueAtTime(4.5, now + 1.55);
    warpSubPitchGain.gain.setValueAtTime(14, now + 0.06);
    warpSubPitchGain.gain.linearRampToValueAtTime(3.5, now + 1.55);
    warpSubFilterGain.gain.setValueAtTime(95, now + 0.06);
    warpSubFilterGain.gain.linearRampToValueAtTime(22, now + 1.55);
    warpSubLfo.connect(warpSubPitchGain);
    warpSubLfo.connect(warpSubFilterGain);
    warpSubFilterGain.connect(subLowpass.frequency);

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(142, now + 0.06);
    subOsc.frequency.exponentialRampToValueAtTime(34, now + 1.45);
    warpSubPitchGain.connect(subOsc.frequency);

    subHarmOsc.type = 'triangle';
    subHarmOsc.frequency.setValueAtTime(98, now + 0.06);
    subHarmOsc.frequency.exponentialRampToValueAtTime(46, now + 1.45);
    warpSubPitchGain.connect(subHarmOsc.frequency);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.0001, now);
    subGain.gain.exponentialRampToValueAtTime(0.46, now + 0.1);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.65);

    subOsc.connect(subDrive);
    subHarmOsc.connect(subDrive);
    subDrive.connect(subLowpass);
    subLowpass.connect(subGain);
    subGain.connect(domainBus);

    subOsc.start(now + 0.05);
    subOsc.stop(now + 1.7);
    subHarmOsc.start(now + 0.05);
    subHarmOsc.stop(now + 1.7);
    warpSubLfo.start(now + 0.05);
    warpSubLfo.stop(now + 1.7);

    // 3. Stereo Delay Spatial Resonance Chamber (shared by Kraken Cry & Domain Law Harmonics)
    const delayL = ctx.createDelay(0.5);
    const delayR = ctx.createDelay(0.5);
    delayL.delayTime.setValueAtTime(0.15, now);
    delayR.delayTime.setValueAtTime(0.23, now);

    const fbL = ctx.createGain();
    const fbR = ctx.createGain();
    fbL.gain.setValueAtTime(0.38, now);
    fbR.gain.setValueAtTime(0.38, now);

    const echoFilter = ctx.createBiquadFilter();
    echoFilter.type = 'lowpass';
    echoFilter.frequency.setValueAtTime(1150, now);

    const echoPanL = ctx.createStereoPanner();
    const echoPanR = ctx.createStereoPanner();
    echoPanL.pan.setValueAtTime(-0.68, now);
    echoPanR.pan.setValueAtTime(0.68, now);

    const echoOut = ctx.createGain();
    echoOut.gain.setValueAtTime(0.46, now);

    delayL.connect(fbL);
    fbL.connect(echoFilter);
    echoFilter.connect(delayR);
    delayR.connect(fbR);
    fbR.connect(delayL);
    delayL.connect(echoPanL);
    delayR.connect(echoPanR);
    echoPanL.connect(echoOut);
    echoPanR.connect(echoOut);
    echoOut.connect(domainBus);

    // 4. Kraken Abyssal Cry / Leviathan Roar Layer (0.08s -> 1.85s)
    // Dual detuned low-frequency vocal-chord oscillators + breathy noise through parallel vowel formants
    const roarStart = now + 0.08;
    const roarEnd = now + 1.82;

    const roarDrive = ctx.createWaveShaper();
    roarDrive.curve = this.getSaturationCurve();
    roarDrive.oversample = '2x';

    // Guttural FM throat flutter modulating Kraken pitch (wet cephalopod growl texture)
    const throatLfo = ctx.createOscillator();
    const throatLfoGain = ctx.createGain();
    throatLfo.type = 'sine';
    throatLfo.frequency.setValueAtTime(19.5, roarStart);
    throatLfo.frequency.exponentialRampToValueAtTime(6.2, roarEnd);
    throatLfoGain.gain.setValueAtTime(16.5, roarStart);
    throatLfoGain.gain.linearRampToValueAtTime(4.5, roarEnd);
    throatLfo.connect(throatLfoGain);

    const roarVoiceA = ctx.createOscillator();
    const roarVoiceB = ctx.createOscillator();
    roarVoiceA.type = 'sawtooth';
    roarVoiceB.type = 'triangle';

    // Swell upward into a monstrous abyssal cry, then groan downward into the deep
    roarVoiceA.frequency.setValueAtTime(72, roarStart);
    roarVoiceA.frequency.exponentialRampToValueAtTime(114, roarStart + 0.22);
    roarVoiceA.frequency.exponentialRampToValueAtTime(46, roarEnd - 0.05);

    roarVoiceB.frequency.setValueAtTime(72 * 0.503, roarStart);
    roarVoiceB.frequency.exponentialRampToValueAtTime(114 * 0.506, roarStart + 0.22);
    roarVoiceB.frequency.exponentialRampToValueAtTime(46 * 0.498, roarEnd - 0.05);

    throatLfoGain.connect(roarVoiceA.frequency);
    throatLfoGain.connect(roarVoiceB.frequency);

    // Breathy underwater roar air-turbulence layer
    const roarNoise = ctx.createBufferSource();
    roarNoise.buffer = noiseBuf;
    roarNoise.loop = true;
    const roarNoiseGain = ctx.createGain();
    roarNoiseGain.gain.setValueAtTime(0.35, roarStart);

    // Parallel Formant Filters shaping the Kraken vocal tract ("Grrr-OOOAAAH-rrgh")
    const formant1 = ctx.createBiquadFilter();
    formant1.type = 'bandpass';
    formant1.Q.setValueAtTime(4.6, roarStart);
    formant1.frequency.setValueAtTime(175, roarStart);
    formant1.frequency.exponentialRampToValueAtTime(340, roarStart + 0.26);
    formant1.frequency.exponentialRampToValueAtTime(135, roarEnd - 0.05);

    const formant2 = ctx.createBiquadFilter();
    formant2.type = 'bandpass';
    formant2.Q.setValueAtTime(5.8, roarStart);
    formant2.frequency.setValueAtTime(440, roarStart);
    formant2.frequency.exponentialRampToValueAtTime(760, roarStart + 0.24);
    formant2.frequency.exponentialRampToValueAtTime(240, roarEnd - 0.05);

    const chestFilter = ctx.createBiquadFilter();
    chestFilter.type = 'lowpass';
    chestFilter.frequency.setValueAtTime(190, roarStart);

    const roarOutGain = ctx.createGain();
    roarOutGain.gain.setValueAtTime(0.0001, roarStart);
    roarOutGain.gain.exponentialRampToValueAtTime(0.42, roarStart + 0.16);
    roarOutGain.gain.exponentialRampToValueAtTime(0.26, roarStart + 0.72);
    roarOutGain.gain.exponentialRampToValueAtTime(0.0001, roarEnd);

    const roarPan = ctx.createStereoPanner();
    const roarPanLfo = ctx.createOscillator();
    const roarPanDepth = ctx.createGain();
    roarPanLfo.type = 'sine';
    roarPanLfo.frequency.setValueAtTime(1.6, roarStart);
    roarPanDepth.gain.setValueAtTime(0.32, roarStart);
    roarPanLfo.connect(roarPanDepth);
    roarPanDepth.connect(roarPan.pan);

    roarVoiceA.connect(roarDrive);
    roarVoiceB.connect(roarDrive);
    roarNoise.connect(roarNoiseGain);
    roarNoiseGain.connect(roarDrive);

    roarDrive.connect(formant1);
    roarDrive.connect(formant2);
    roarDrive.connect(chestFilter);

    formant1.connect(roarOutGain);
    formant2.connect(roarOutGain);
    chestFilter.connect(roarOutGain);

    roarOutGain.connect(roarPan);
    roarPan.connect(domainBus);
    roarOutGain.connect(delayL);
    roarOutGain.connect(delayR);

    throatLfo.start(roarStart);
    throatLfo.stop(roarEnd + 0.04);
    roarVoiceA.start(roarStart);
    roarVoiceA.stop(roarEnd + 0.04);
    roarVoiceB.start(roarStart);
    roarVoiceB.stop(roarEnd + 0.04);
    roarNoise.start(roarStart);
    roarNoise.stop(roarEnd + 0.04);
    roarPanLfo.start(roarStart);
    roarPanLfo.stop(roarEnd + 0.04);

    // 5. Underwater Spatial Distortion Filter Sweep (LFO-warped bandpass + stereo pan)
    const warpSrc = ctx.createBufferSource();
    warpSrc.buffer = noiseBuf;
    warpSrc.loop = true;

    const warpFilter = ctx.createBiquadFilter();
    warpFilter.type = 'bandpass';
    warpFilter.Q.setValueAtTime(4.8, now);
    warpFilter.frequency.setValueAtTime(2100, now + 0.08);
    warpFilter.frequency.exponentialRampToValueAtTime(175, now + 0.72);
    warpFilter.frequency.exponentialRampToValueAtTime(480, now + 1.4);
    warpFilter.frequency.exponentialRampToValueAtTime(210, now + 1.9);

    const filterLfo = ctx.createOscillator();
    const filterLfoGain = ctx.createGain();
    filterLfo.type = 'sine';
    filterLfo.frequency.setValueAtTime(7.5, now + 0.08);
    filterLfo.frequency.linearRampToValueAtTime(2.6, now + 1.8);
    filterLfoGain.gain.setValueAtTime(220, now + 0.08);
    filterLfoGain.gain.linearRampToValueAtTime(60, now + 1.8);
    filterLfo.connect(filterLfoGain);
    filterLfoGain.connect(warpFilter.frequency);

    const warpPan = ctx.createStereoPanner();
    const panLfo = ctx.createOscillator();
    const panLfoGain = ctx.createGain();
    panLfo.type = 'sine';
    panLfo.frequency.setValueAtTime(2.2, now + 0.08);
    panLfoGain.gain.setValueAtTime(0.68, now + 0.08);
    panLfo.connect(panLfoGain);
    panLfoGain.connect(warpPan.pan);

    const warpGain = ctx.createGain();
    warpGain.gain.setValueAtTime(0.0001, now);
    warpGain.gain.exponentialRampToValueAtTime(0.28, now + 0.14);
    warpGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.92);

    warpSrc.connect(warpFilter);
    warpFilter.connect(warpPan);
    warpPan.connect(warpGain);
    warpGain.connect(domainBus);

    warpSrc.start(now + 0.07);
    warpSrc.stop(now + 1.95);
    filterLfo.start(now + 0.07);
    filterLfo.stop(now + 1.95);
    panLfo.start(now + 0.07);
    panLfo.stop(now + 1.95);

    // 6. Domain Law Low-Mid Resonance Chord
    const chordFreqs =
      effect === 'malevolent_shrine'
        ? [110.0, 155.56, 220.0, 311.13]
        : effect === 'celestial_judgement'
          ? [196.0, 293.66, 392.0, 587.33]
          : effect === 'abyss_feast'
            ? [98.0, 146.83, 220.0, 293.66]
            : [164.81, 246.94, 329.63, 493.88];

    const vibLfo = ctx.createOscillator();
    const vibGain = ctx.createGain();
    vibLfo.type = 'sine';
    vibLfo.frequency.setValueAtTime(4.8, now + 0.12);
    vibGain.gain.setValueAtTime(5.5, now + 0.12);
    vibLfo.connect(vibGain);
    vibLfo.start(now + 0.1);
    vibLfo.stop(now + 1.85);

    chordFreqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const pan = ctx.createStereoPanner();
      const tStart = now + 0.12 + idx * 0.035;

      osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq * 1.03, tStart);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.95, tStart + 1.35);
      vibGain.connect(osc.frequency);

      pan.pan.setValueAtTime((idx % 2 === 0 ? -1 : 1) * (0.25 + idx * 0.12), tStart);

      gain.gain.setValueAtTime(0.0001, tStart);
      gain.gain.exponentialRampToValueAtTime(0.065, tStart + 0.14);
      gain.gain.exponentialRampToValueAtTime(0.0001, tStart + 1.45);

      osc.connect(gain);
      gain.connect(pan);
      pan.connect(domainBus);
      gain.connect(idx % 2 === 0 ? delayL : delayR);

      osc.start(tStart);
      osc.stop(tStart + 1.5);
    });

    // 7. Submerged Underwater Bubble Chirps (synced with caustic ripples & 3D bubbles)
    const bubbleOffsets = [0.24, 0.4, 0.58, 0.8, 1.04, 1.3];
    bubbleOffsets.forEach((off, idx) => {
      const bOsc = ctx.createOscillator();
      const bGain = ctx.createGain();
      const bPan = ctx.createStereoPanner();
      const t0 = now + off;
      const baseF = 320 + ((idx * 137) % 340);

      bOsc.type = 'sine';
      bOsc.frequency.setValueAtTime(baseF, t0);
      bOsc.frequency.exponentialRampToValueAtTime(baseF * 1.85, t0 + 0.075);
      bPan.pan.setValueAtTime((idx % 2 === 0 ? -1 : 1) * (0.25 + (idx % 3) * 0.22), t0);

      bGain.gain.setValueAtTime(0.0001, t0);
      bGain.gain.exponentialRampToValueAtTime(0.055, t0 + 0.014);
      bGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.085);

      bOsc.connect(bGain);
      bGain.connect(bPan);
      bPan.connect(domainBus);
      bOsc.start(t0);
      bOsc.stop(t0 + 0.095);
    });

    // 8. Subtle Underwater Domain Ambience Bed for the active duration
    if (safeDur > 1.4) {
      const bedStart = now + 0.55;
      const bedEnd = now + safeDur;
      const bedFilter = ctx.createBiquadFilter();
      bedFilter.type = 'lowpass';
      bedFilter.Q.setValueAtTime(3.2, bedStart);
      bedFilter.frequency.setValueAtTime(220, bedStart);

      const bedLfo = ctx.createOscillator();
      const bedLfoGain = ctx.createGain();
      bedLfo.type = 'sine';
      bedLfo.frequency.setValueAtTime(0.55, bedStart);
      bedLfoGain.gain.setValueAtTime(90, bedStart);
      bedLfo.connect(bedLfoGain);
      bedLfoGain.connect(bedFilter.frequency);

      const bedGain = ctx.createGain();
      bedGain.gain.setValueAtTime(0.0001, bedStart);
      bedGain.gain.exponentialRampToValueAtTime(0.06, bedStart + 0.45);
      bedGain.gain.setValueAtTime(0.06, Math.max(bedStart + 0.5, bedEnd - 0.4));
      bedGain.gain.exponentialRampToValueAtTime(0.0001, bedEnd + 0.05);

      const rootHz = chordFreqs[0] * 0.5;
      [rootHz, rootHz * 1.498].forEach((f) => {
        const padOsc = ctx.createOscillator();
        padOsc.type = 'triangle';
        padOsc.frequency.setValueAtTime(f, bedStart);
        padOsc.connect(bedFilter);
        padOsc.start(bedStart);
        padOsc.stop(bedEnd + 0.08);
      });

      bedFilter.connect(bedGain);
      bedGain.connect(domainBus);
      bedLfo.start(bedStart);
      bedLfo.stop(bedEnd + 0.08);
    }
  }

  public playDomainCollapse(): void {
    this.stopDomainAmbience();
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const dest = this.getMasterDestination(ctx);

    // Rising decompression whoosh as underwater domain dissolves back to sea air
    const src = ctx.createBufferSource();
    src.buffer = this.getNoiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(2.6, now);
    filter.frequency.setValueAtTime(240, now);
    filter.frequency.exponentialRampToValueAtTime(1750, now + 0.36);

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.0001, now);
    nGain.gain.exponentialRampToValueAtTime(0.14, now + 0.08);
    nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.44);

    src.connect(filter);
    filter.connect(nGain);
    nGain.connect(dest);
    src.start(now);
    src.stop(now + 0.46);

    const chime = ctx.createOscillator();
    const cGain = ctx.createGain();
    chime.type = 'sine';
    chime.frequency.setValueAtTime(523.25, now);
    chime.frequency.exponentialRampToValueAtTime(196.0, now + 0.38);
    cGain.gain.setValueAtTime(0.09, now);
    cGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    chime.connect(cGain);
    cGain.connect(dest);
    chime.start(now);
    chime.stop(now + 0.42);
  }
}

export const soundEngine = new SoundEngine();
