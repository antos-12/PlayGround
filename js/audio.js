export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.enabled = true;
    this.musicEnabled = true;
    this.boostNodes = null;
    this.pad = null;
    this.chimeTimer = null;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.enabled ? 0.6 : 0;
    this.master.connect(this.ctx.destination);
    this.makeNoiseBuffer();
    if (this.musicEnabled) this.startPad();
  }

  makeNoiseBuffer() {
    const length = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buffer;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (this.master) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(enabled ? 0.6 : 0, this.ctx.currentTime + 0.15);
    }
    if (!enabled) this.stopBoost();
  }

  setMusic(enabled) {
    this.musicEnabled = enabled;
    if (!this.ctx) return;
    if (enabled) this.startPad();
    else this.stopPad();
  }

  startPad() {
    if (!this.ctx || this.pad) return;
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(0.028, this.ctx.currentTime + 2.5);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 520;
    filter.Q.value = 0.8;
    const oscA = this.ctx.createOscillator();
    const oscB = this.ctx.createOscillator();
    const oscC = this.ctx.createOscillator();
    oscA.type = 'sine';
    oscB.type = 'sine';
    oscC.type = 'triangle';
    oscA.frequency.value = 110;
    oscB.frequency.value = 164.81;
    oscC.frequency.value = 220;
    oscB.detune.value = 7;
    oscC.detune.value = -5;
    const sub = this.ctx.createGain();
    sub.gain.value = 0.3;
    oscC.connect(sub).connect(filter);
    oscA.connect(filter);
    oscB.connect(filter);
    filter.connect(gain).connect(this.master);
    oscA.start();
    oscB.start();
    oscC.start();
    this.pad = { oscA, oscB, oscC, gain, filter };
    this.scheduleChime();
  }

  stopPad() {
    if (!this.pad) return;
    const { oscA, oscB, oscC, gain } = this.pad;
    const now = this.ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.linearRampToValueAtTime(0, now + 0.8);
    [oscA, oscB, oscC].forEach((osc) => osc.stop(now + 0.9));
    this.pad = null;
    if (this.chimeTimer) clearTimeout(this.chimeTimer);
    this.chimeTimer = null;
  }

  scheduleChime() {
    if (this.chimeTimer) clearTimeout(this.chimeTimer);
    this.chimeTimer = setTimeout(() => {
      if (this.ctx && this.pad && this.enabled) {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        const note = notes[Math.floor(Math.random() * notes.length)];
        this.tone(note, 1.8, 'sine', 0.035);
        this.tone(note * 2, 1.2, 'triangle', 0.012);
      }
      if (this.pad) this.scheduleChime();
    }, 6500 + Math.random() * 8000);
  }

  tone(freq, duration, type = 'sine', volume = 0.12, delay = 0, endFreq = null) {
    if (!this.ctx || !this.enabled) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain).connect(this.master);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  eat(combo = 0) {
    const step = Math.min(combo, 10);
    const base = 520 * Math.pow(2, step / 12);
    this.tone(base, 0.14, 'sine', 0.1);
    this.tone(base * 1.5, 0.12, 'triangle', 0.05, 0.015);
  }

  heart() {
    [0, 4, 7, 12].forEach((semi, i) => {
      this.tone(660 * Math.pow(2, semi / 12), 0.25, 'sine', 0.08, i * 0.045);
    });
  }

  kill() {
    this.tone(160, 0.12, 'square', 0.09);
    this.tone(90, 0.35, 'sawtooth', 0.08, 0.04, 42);
  }

  death() {
    this.tone(220, 0.75, 'sawtooth', 0.12, 0, 38);
    this.tone(330, 0.55, 'triangle', 0.06, 0.04, 58);
  }

  click() {
    this.tone(420, 0.06, 'triangle', 0.05);
  }

  spawn() {
    [0, 5, 9].forEach((semi, i) => {
      this.tone(392 * Math.pow(2, semi / 12), 0.3, 'sine', 0.07, i * 0.07);
    });
  }

  rankUp() {
    [0, 7, 12, 19].forEach((semi, i) => {
      this.tone(523.25 * Math.pow(2, semi / 12), 0.55, 'sine', 0.08, i * 0.08);
    });
  }

  startBoost() {
    if (!this.ctx || !this.enabled || this.boostNodes) return;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 780;
    filter.Q.value = 0.7;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.0001;
    gain.gain.linearRampToValueAtTime(0.11, this.ctx.currentTime + 0.12);
    source.connect(filter).connect(gain).connect(this.master);
    source.start();
    this.boostNodes = { source, filter, gain };
  }

  stopBoost() {
    if (!this.boostNodes) return;
    const { source, gain } = this.boostNodes;
    const now = this.ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.18);
    source.stop(now + 0.22);
    this.boostNodes = null;
  }
}
