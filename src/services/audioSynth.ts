// Native audio synthesizer using the Web Audio API.
// Eliminates the need for external mp3 sound assets and guarantees zero-latency, pitch-randomized playback.

class AudioSynthService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientSource: AudioNode | null = null;
  private isMuted: boolean = true;

  // Initialize the Web Audio Context
  private init() {
    if (this.ctx) return;
    
    // Create AudioContext (fallback for older browsers)
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    this.masterGain = this.ctx.createGain();
    // Muted by default
    this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.startAmbientHum();
  }

  // Generate low-frequency kettle simmer & ambient cafe hum
  private startAmbientHum() {
    if (!this.ctx || !this.masterGain) return;

    // Create noise buffer (brown noise is warmer and fits a cafe ambient vibe)
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Filter white noise to make it brown (warm low frequencies)
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      // Boost the volume slightly
      output[i] *= 3.5;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Filter noise to sound like boiling/simmering water
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    // Dynamic modulation (LFO) to create "bubbling/simmering" effect
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(1.8, this.ctx.currentTime); // 1.8 Hz bubbles

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(60, this.ctx.currentTime); // sweep filter by 60Hz

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    // Warm hum oscillator
    const humOsc = this.ctx.createOscillator();
    humOsc.type = 'sine';
    humOsc.frequency.setValueAtTime(65, this.ctx.currentTime); // 65Hz low hum

    const humGain = this.ctx.createGain();
    humGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    // Connect nodes
    noiseSource.connect(filter);
    
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    filter.connect(noiseGain);

    // Merge signals
    noiseGain.connect(this.masterGain);
    
    humOsc.connect(humGain);
    humGain.connect(this.masterGain);

    // Start audio
    noiseSource.start(0);
    lfo.start(0);
    humOsc.start(0);

    this.ambientSource = noiseSource;
  }

  // Synthesize a funny, satisfying "slurrrp" gulp
  public playSlurp(isFirstTick: boolean = false) {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    // Resume context if suspended (browser security)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    const duration = isFirstTick ? 0.45 : 0.28; // longer opening slurp

    // 1. Noise Generator for the breathy "slurrp" air sound
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * duration, this.ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    
    // Slurp sweeping resonance filter
    const startFreq = 600 + Math.random() * 200; // randomized starting pitch
    const endFreq = 1600 + Math.random() * 300;
    noiseFilter.frequency.setValueAtTime(startFreq, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
    noiseFilter.Q.setValueAtTime(4.0, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.4, now + 0.05);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // 2. Liquid gulp / low-end body (low frequency sweep)
    const gulpOsc = this.ctx.createOscillator();
    gulpOsc.type = 'triangle';
    
    // Randomize pitch base for funny gulp
    const pitchOffset = Math.random() * 40 - 20;
    gulpOsc.frequency.setValueAtTime(140 + pitchOffset, now);
    gulpOsc.frequency.exponentialRampToValueAtTime(70 + pitchOffset / 2, now + duration);

    const gulpGain = this.ctx.createGain();
    gulpGain.gain.setValueAtTime(0, now);
    gulpGain.gain.linearRampToValueAtTime(0.8, now + 0.08);
    gulpGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Connect slurp nodes directly to destination (unaffected by ambient mute)
    // but still respect browser interaction state.
    const slurpVolumeNode = this.ctx.createGain();
    // If master is muted, we can still play slurps at standard volume once they interact,
    // but we respect the global isMuted value for ambient audio only.
    slurpVolumeNode.gain.setValueAtTime(0.65, now);
    
    noiseNode.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(slurpVolumeNode);

    gulpOsc.connect(gulpGain);
    gulpGain.connect(slurpVolumeNode);

    slurpVolumeNode.connect(this.ctx.destination);

    // Play!
    noiseNode.start(now);
    gulpOsc.start(now);

    noiseNode.stop(now + duration);
    gulpOsc.stop(now + duration);
  }

  // Toggle master volume for ambient track
  public toggleMute(): boolean {
    this.init();
    if (!this.ctx || !this.masterGain) return this.isMuted;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.isMuted) {
      // Fade in ambient sound smoothly
      this.masterGain.gain.linearRampToValueAtTime(0.8, this.ctx.currentTime + 0.5);
      this.isMuted = false;
    } else {
      // Fade out ambient sound
      this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);
      this.isMuted = true;
    }

    return this.isMuted;
  }

  public getMutedState(): boolean {
    return this.isMuted;
  }

  // Ensure AudioContext is running upon first interaction
  public ensureContextStarted() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
}

export const audioSynth = new AudioSynthService();
export default audioSynth;
