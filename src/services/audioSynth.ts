// Native audio synthesizer using the Web Audio API.
// Eliminates the need for external mp3 sound assets and guarantees zero-latency, pitch-randomized playback.

class AudioSynthService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgAudio: HTMLAudioElement | null = null;
  private slurpBuffer: AudioBuffer | null = null;
  private pourBuffer: AudioBuffer | null = null;
  private isMuted: boolean = true;

  // Initialize the Web Audio Context & Background Audio
  private init() {
    if (this.ctx) return;
    
    // Create AudioContext (fallback for older browsers)
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Initialize HTML5 Audio for background stream loop
    this.bgAudio = new Audio('/bgsound.mp3');
    this.bgAudio.loop = true;
    this.bgAudio.volume = 0; // Start muted
    this.bgAudio.play().catch((err) => {
      console.log('Autoplay pending interaction:', err);
    });

    this.preloadSlurp();
    this.preloadPour();
  }

  // Preload the slurp sound file
  private async preloadSlurp() {
    if (!this.ctx) return;
    try {
      const response = await fetch('/slurp.mp3');
      const arrayBuffer = await response.arrayBuffer();
      this.slurpBuffer = await this.ctx.decodeAudioData(arrayBuffer);
    } catch (err) {
      console.error('Failed to load slurp.mp3:', err);
    }
  }

  // Preload the pour sound file
  private async preloadPour() {
    if (!this.ctx) return;
    try {
      const response = await fetch('/pour.mp3');
      const arrayBuffer = await response.arrayBuffer();
      this.pourBuffer = await this.ctx.decodeAudioData(arrayBuffer);
    } catch (err) {
      console.error('Failed to load pour.mp3:', err);
    }
  }

  // Play the satisfing "slurrrp" gulp using the slurp.mp3 asset
  public playSlurp(isFirstTick: boolean = false) {
    this.init();
    if (!this.ctx) return;

    // Resume context if suspended (browser security)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.slurpBuffer) {
      const source = this.ctx.createBufferSource();
      source.buffer = this.slurpBuffer;

      // Pitch variation: cycle randomly between 0.9 and 1.15
      source.playbackRate.setValueAtTime(0.9 + Math.random() * 0.25, this.ctx.currentTime);

      const gainNode = this.ctx.createGain();
      // First slurp is slightly louder for extra satisfaction
      gainNode.gain.setValueAtTime(isFirstTick ? 0.95 : 0.65, this.ctx.currentTime);

      source.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      source.start(0);
    } else {
      // Fallback: create dynamic Audio element if buffer isn't decoded yet
      const fallbackAudio = new Audio('/slurp.mp3');
      fallbackAudio.volume = 0.65;
      fallbackAudio.play().catch((err) => console.log('Fallback slurp audio error:', err));
    }
  }

  // Play the refilling "pour" sound using pour.mp3 asset
  public playPour() {
    this.init();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.pourBuffer) {
      const source = this.ctx.createBufferSource();
      source.buffer = this.pourBuffer;

      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(0.7, this.ctx.currentTime);

      source.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      source.start(0);
    } else {
      const fallbackAudio = new Audio('/pour.mp3');
      fallbackAudio.volume = 0.7;
      fallbackAudio.play().catch((err) => console.log('Fallback pour audio error:', err));
    }
  }

  // Toggle master volume for ambient track
  public toggleMute(): boolean {
    this.init();
    if (!this.bgAudio) return this.isMuted;

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.isMuted) {
      this.bgAudio.volume = 0.45;
      this.bgAudio.play().catch((e) => console.log('Playback error:', e));
      this.isMuted = false;
    } else {
      this.bgAudio.volume = 0;
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
    if (this.bgAudio && !this.isMuted) {
      this.bgAudio.play().catch((e) => console.log('Playback error:', e));
    }
  }
}

export const audioSynth = new AudioSynthService();
export default audioSynth;
