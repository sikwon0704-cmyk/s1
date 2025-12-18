export class Synthesizer {
  private static instance: Synthesizer;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  
  // BGM State
  private bgmInterval: any = null;
  private bgmNoteIndex: number = 0;
  private isBgmPlaying: boolean = false;

  private constructor() {
    try {
      // @ts-ignore
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.2; // Master Volume
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.error("Web Audio API not supported", e);
    }
  }

  public static getInstance(): Synthesizer {
    if (!Synthesizer.instance) {
      Synthesizer.instance = new Synthesizer();
    }
    return Synthesizer.instance;
  }

  public async init() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    this.startBGM();
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : 0.2;
    }
  }

  // --- Sound Effects (Arcade Style) ---

  public playShoot() {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    
    // "Pew!" - Fast sweep
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'square'; // 8-bit feel
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  public playHit() {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    
    // "Pop!" / "Splats"
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle'; 
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  public playCollect() {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    
    // "Coin!" - Two distinct high tones
    const now = this.ctx.currentTime;
    
    // Tone 1 (B5)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(987.77, now);
    gain1.gain.setValueAtTime(0.1, now);
    gain1.gain.linearRampToValueAtTime(0, now + 0.08);
    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(now);
    osc1.stop(now + 0.08);

    // Tone 2 (E6) - higher
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.51, now + 0.08);
    gain2.gain.setValueAtTime(0.1, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.3);
  }

  public playMagnet() {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    
    // Vacuum/Suction Sound (Low Pitch Sweep)
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.linearRampToValueAtTime(400, now + 1.0); // Pitch up
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.linearRampToValueAtTime(800, now + 1.0); // Open filter
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0, now + 1.0);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + 1.0);
  }

  public playBuy() {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    
    // Cha-Ching! (Cash Register)
    const now = this.ctx.currentTime;
    
    // 1. Mechanical Clack (High Pitch Noise Burst)
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    noise.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(now);
    
    // 2. Bell Ring (High Sine)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1500, now + 0.05); // High Ding
    
    gain.gain.setValueAtTime(0.0, now);
    gain.gain.setValueAtTime(0.3, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.6);
    
    // 3. Coins (Arpeggio)
    const notes = [880, 1100, 1320];
    notes.forEach((freq, i) => {
       const cOsc = this.ctx!.createOscillator();
       const cGain = this.ctx!.createGain();
       cOsc.type = 'triangle';
       cOsc.frequency.value = freq;
       const t = now + 0.1 + (i * 0.05);
       cGain.gain.setValueAtTime(0.05, t);
       cGain.gain.linearRampToValueAtTime(0, t + 0.1);
       cOsc.connect(cGain);
       cGain.connect(this.masterGain!);
       cOsc.start(t);
       cOsc.stop(t + 0.1);
    });
  }

  public playLevelUp() {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    
    // Victory Fanfare - Rapid Major Arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50]; // C E G C G C
    const now = this.ctx.currentTime;
    
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.type = 'square'; // Arcade style
      osc.frequency.value = freq;
      
      const startTime = now + i * 0.08;
      
      gain.gain.setValueAtTime(0.1, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
      
      osc.connect(gain);
      gain.connect(this.masterGain!);
      
      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });
  }

  public playGameOver() {
      if (!this.ctx || this.isMuted || !this.masterGain) return;
      this.stopBGM();

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + 1.5);
      
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.5);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start();
      osc.stop(this.ctx.currentTime + 1.5);
  }

  public playGlassBreak() {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    
    // High pitched noise crunch
    const bufferSize = this.ctx.sampleRate * 0.2; // 0.2 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i/bufferSize, 2); // Decay
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000; // Remove low rumble
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start();
  }

  public playSiren() {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    
    // "Wee-Woo" Pattern (3 seconds)
    // 0s: Low -> 0.5s: High -> 1.0s: Low -> 1.5s: High -> ...
    const low = 400;
    const high = 800;
    
    osc.frequency.setValueAtTime(low, now);
    osc.frequency.linearRampToValueAtTime(high, now + 0.5);
    osc.frequency.linearRampToValueAtTime(low, now + 1.0);
    osc.frequency.linearRampToValueAtTime(high, now + 1.5);
    osc.frequency.linearRampToValueAtTime(low, now + 2.0);
    osc.frequency.linearRampToValueAtTime(high, now + 2.5);
    osc.frequency.linearRampToValueAtTime(low, now + 3.0);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 2.8);
    gain.gain.linearRampToValueAtTime(0, now + 3.0); // Fade out
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + 3.0);
  }

  // --- BGM System (Sequencer) ---
  
  public startBGM() {
      if (this.isBgmPlaying || !this.ctx) return;
      this.isBgmPlaying = true;
      this.bgmNoteIndex = 0;
      
      // 140 BPM = ~428ms per beat. 8th notes = ~214ms.
      const tempo = 214; 
      
      // Simple Bassline Loop (C Minorish)
      const sequence = [
          130.81, 0, 130.81, 0, 155.56, 0, 196.00, 155.56, // C3, Eb3, G3
          130.81, 0, 130.81, 130.81, 116.54, 0, 98.00, 116.54 // C3, Bb2, G2
      ];

      this.bgmInterval = setInterval(() => {
          if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;
          
          const freq = sequence[this.bgmNoteIndex % sequence.length];
          if (freq > 0) {
              const osc = this.ctx.createOscillator();
              const gain = this.ctx.createGain();
              
              osc.type = 'triangle'; // Softer bass
              osc.frequency.value = freq;
              
              gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
              
              osc.connect(gain);
              gain.connect(this.masterGain!);
              
              osc.start(this.ctx.currentTime);
              osc.stop(this.ctx.currentTime + 0.2);
          }
          
          this.bgmNoteIndex++;
      }, tempo);
  }

  public stopBGM() {
      if (this.bgmInterval) {
          clearInterval(this.bgmInterval);
          this.bgmInterval = null;
      }
      this.isBgmPlaying = false;
  }
}
