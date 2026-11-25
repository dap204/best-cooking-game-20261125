// Sizzle Station — every sound is synthesized with WebAudio at run time.
// No audio files, no network: short bleeps, pops and sizzles built from
// oscillators and filtered noise.

const NOTE = { C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5, E6: 1318.5 };

export class SoundBank {
  constructor() {
    this.context = null;
    this.muted = false;
    this.sizzleNodes = null;
  }

  ensure() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return false;
      this.context = new AudioContext();
    }
    if (this.context.state === 'suspended') void this.context.resume();
    return true;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.stopSizzle();
    return this.muted;
  }

  tone(freq, seconds, type = 'sine', volume = 0.16, when = 0) {
    if (this.muted || !this.ensure()) return;
    const start = this.context.currentTime + when;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    osc.connect(gain).connect(this.context.destination);
    osc.start(start);
    osc.stop(start + seconds + 0.05);
  }

  noise(seconds, filterFreq, volume = 0.2, when = 0) {
    if (this.muted || !this.ensure()) return;
    const start = this.context.currentTime + when;
    const length = Math.max(1, Math.floor(this.context.sampleRate * seconds));
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    const filter = this.context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    source.connect(filter).connect(gain).connect(this.context.destination);
    source.start(start);
  }

  click() {
    this.tone(660, 0.06, 'triangle', 0.1);
  }

  chop() {
    this.noise(0.09, 1800, 0.28);
    this.tone(180, 0.07, 'square', 0.08);
  }

  sizzleStart() {
    if (this.muted || !this.ensure() || this.sizzleNodes) return;
    const length = this.context.sampleRate;
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = this.context.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3200;
    const gain = this.context.createGain();
    gain.gain.value = 0.045;
    source.connect(filter).connect(gain).connect(this.context.destination);
    source.start();
    this.sizzleNodes = { source, gain };
  }

  stopSizzle() {
    if (!this.sizzleNodes) return;
    try {
      this.sizzleNodes.gain.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.15);
      this.sizzleNodes.source.stop(this.context.currentTime + 0.2);
    } catch {
      // Already stopped; nothing to do.
    }
    this.sizzleNodes = null;
  }

  ding() {
    this.tone(NOTE.E6, 0.35, 'sine', 0.14);
    this.tone(NOTE.C6, 0.4, 'sine', 0.1, 0.07);
  }

  orderIn() {
    this.tone(NOTE.G5, 0.12, 'triangle', 0.14);
    this.tone(NOTE.C6, 0.18, 'triangle', 0.14, 0.1);
  }

  serve() {
    this.tone(NOTE.C5, 0.1, 'triangle', 0.16);
    this.tone(NOTE.E5, 0.1, 'triangle', 0.16, 0.09);
    this.tone(NOTE.G5, 0.14, 'triangle', 0.16, 0.18);
    this.tone(NOTE.C6, 0.3, 'sine', 0.14, 0.27);
  }

  wrong() {
    this.tone(220, 0.16, 'sawtooth', 0.1);
    this.tone(174, 0.24, 'sawtooth', 0.1, 0.12);
  }

  burn() {
    this.noise(0.3, 500, 0.2);
    this.tone(140, 0.3, 'sawtooth', 0.1, 0.05);
  }

  tick() {
    this.tone(880, 0.05, 'square', 0.06);
  }

  win() {
    [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6, NOTE.E6].forEach((freq, i) => {
      this.tone(freq, 0.22, 'triangle', 0.15, i * 0.11);
    });
  }
}
