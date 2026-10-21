export class AudioKit {
  constructor({ muted = false } = {}) {
    this.muted = muted;
    this.context = null;
    this.master = null;
    this.lastBoostAt = 0;
  }

  ensure() {
    if (!this.context) {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return null;
      this.context = new Context();
      this.master = this.context.createGain();
      this.master.gain.value = this.muted ? 0 : 0.18;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === "suspended") this.context.resume().catch(() => {});
    return this.context;
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.18, this.context.currentTime, 0.02);
    }
  }

  tone({ frequency = 440, endFrequency = null, duration = 0.12, type = "sine", volume = 0.2, delay = 0 }) {
    const context = this.ensure();
    if (!context || !this.master || this.muted) return;
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, endFrequency), start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  }

  click() {
    this.tone({ frequency: 520, endFrequency: 700, duration: 0.07, type: "triangle", volume: 0.11 });
  }

  eat(value = 3) {
    const base = 480 + Math.min(300, value * 26) + Math.random() * 70;
    this.tone({ frequency: base, endFrequency: base * 1.5, duration: 0.09, type: "sine", volume: 0.14 });
    this.tone({ frequency: base * 2, endFrequency: base * 2.3, duration: 0.06, type: "triangle", volume: 0.05, delay: 0.015 });
  }

  boost() {
    const now = performance.now();
    if (now - this.lastBoostAt < 220) return;
    this.lastBoostAt = now;
    this.tone({ frequency: 190, endFrequency: 90, duration: 0.18, type: "sawtooth", volume: 0.055 });
  }

  bump() {
    this.tone({ frequency: 130, endFrequency: 70, duration: 0.16, type: "square", volume: 0.08 });
  }

  death() {
    this.tone({ frequency: 420, endFrequency: 65, duration: 0.55, type: "sawtooth", volume: 0.13 });
    this.tone({ frequency: 210, endFrequency: 42, duration: 0.65, type: "triangle", volume: 0.1, delay: 0.05 });
  }

  spawn() {
    this.tone({ frequency: 340, endFrequency: 680, duration: 0.22, type: "sine", volume: 0.12 });
    this.tone({ frequency: 510, endFrequency: 1020, duration: 0.18, type: "triangle", volume: 0.06, delay: 0.06 });
  }
}
