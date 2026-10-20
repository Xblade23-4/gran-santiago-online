// client/src/utils/sound.js
// Sintetizador de efectos de sonido con Web Audio API

class SoundManager {
  constructor() {
    this.audioCtx = null;
    this.enabled = true;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
  }

  playTone(freq, type = "sine", duration = 0.1, gainValue = 0.15) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(gainValue, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  // Sonido al escribir una letra
  playType() {
    this.playTone(600 + Math.random() * 80, "triangle", 0.05, 0.08);
  }

  // Sonido al borrar una letra
  playBackspace() {
    this.playTone(320, "triangle", 0.06, 0.08);
  }

  // Sonido al completar una palabra con éxito
  playWordCorrect() {
    if (!this.enabled) return;
    try {
      this.init();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, index) => {
        setTimeout(() => {
          this.playTone(freq, "sine", 0.18, 0.15);
        }, index * 70);
      });
    } catch (e) {}
  }

  // Sonido de pista usada
  playHint() {
    this.playTone(440, "sine", 0.1, 0.12);
    setTimeout(() => this.playTone(880, "sine", 0.2, 0.12), 100);
  }

  // Sonido de victoria al terminar el crucigrama completo
  playVictory() {
    if (!this.enabled) return;
    try {
      this.init();
      const melody = [
        { f: 523.25, d: 0.15 },
        { f: 659.25, d: 0.15 },
        { f: 783.99, d: 0.15 },
        { f: 1046.5, d: 0.4 },
        { f: 880.0, d: 0.15 },
        { f: 1046.5, d: 0.6 }
      ];
      let t = 0;
      melody.forEach(item => {
        setTimeout(() => {
          this.playTone(item.f, "square", item.d, 0.1);
        }, t);
        t += item.d * 1000 + 30;
      });
    } catch (e) {}
  }
}

export const sound = new SoundManager();
