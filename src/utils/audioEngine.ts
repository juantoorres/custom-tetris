/**
 * Procedural sound engine using Web Audio API.
 * All sounds are synthesized — no external assets needed.
 */

type Waveform = OscillatorType;

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  private getCtx(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch {
        return null;
      }
    }
    // Resume if suspended (browser autoplay policy)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // ── Low-level helpers ─────────────────────────────────────────────────────

  private tone(
    freq: number,
    duration: number,
    type: Waveform = 'square',
    gainPeak = 0.18,
    freqEnd?: number,
  ): void {
    const ctx = this.getCtx();
    if (!ctx) return;

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type      = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (freqEnd !== undefined) {
      osc.frequency.linearRampToValueAtTime(freqEnd, ctx.currentTime + duration);
    }

    gain.gain.setValueAtTime(gainPeak, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration + 0.01);
  }

  private noise(duration: number, gainPeak = 0.15): void {
    const ctx = this.getCtx();
    if (!ctx) return;

    const bufferSize = ctx.sampleRate * duration;
    const buffer     = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data       = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainPeak, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    const filter = ctx.createBiquadFilter();
    filter.type            = 'lowpass';
    filter.frequency.value = 400;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(ctx.currentTime);
  }

  // ── Public sound events ───────────────────────────────────────────────────

  /** Piece moved left or right */
  playMove(): void {
    this.tone(220, 0.05, 'square', 0.08);
  }

  /** Piece rotated */
  playRotate(): void {
    this.tone(330, 0.06, 'square', 0.1);
  }

  /** Piece held */
  playHold(): void {
    this.tone(440, 0.04, 'sine', 0.12);
    setTimeout(() => this.tone(660, 0.04, 'sine', 0.1), 50);
  }

  /** Soft drop tick */
  playSoftDrop(): void {
    this.tone(180, 0.04, 'sine', 0.08, 140);
  }

  /** Hard drop thud */
  playHardDrop(): void {
    this.noise(0.08, 0.2);
    this.tone(80, 0.12, 'sawtooth', 0.18, 40);
  }

  /** Piece locked in place */
  playLock(): void {
    this.noise(0.06, 0.12);
  }

  /**
   * Line cleared — different sound per count:
   * 1 = single blip, 2 = double, 3 = triple, 4 = Tetris fanfare
   */
  playLineClear(count: 1 | 2 | 3 | 4): void {
    const ctx = this.getCtx();
    if (!ctx) return;

    if (count === 4) {
      // Tetris fanfare: ascending arpeggio
      const notes = [523, 659, 784, 1047];
      notes.forEach((f, i) => {
        setTimeout(() => this.tone(f, 0.12, 'sine', 0.2), i * 60);
      });
      return;
    }

    const sequences: Record<number, number[]> = {
      1: [440],
      2: [440, 554],
      3: [440, 554, 659],
    };
    const seq = sequences[count] ?? [440];
    seq.forEach((f, i) => {
      setTimeout(() => this.tone(f, 0.1, 'sine', 0.16), i * 55);
    });
  }

  /** Perfect clear */
  playPerfectClear(): void {
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((f, i) => {
      setTimeout(() => this.tone(f, 0.15, 'sine', 0.22), i * 50);
    });
  }

  /** Game over descending melody */
  playGameOver(): void {
    const notes = [440, 370, 330, 277, 220];
    notes.forEach((f, i) => {
      setTimeout(() => this.tone(f, 0.22, 'sawtooth', 0.15), i * 100);
    });
  }

  setMuted(m: boolean): void {
    this.muted = m;
  }

  isMuted(): boolean {
    return this.muted;
  }
}
