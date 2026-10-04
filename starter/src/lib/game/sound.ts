// Small synthesised sound effects for games (no audio files). Browsers only
// play sound after the player has clicked or tapped, which games always need first.

let context: AudioContext | null = null;

/** Plays one note. Does nothing if sound can't play here. */
export function tone(frequency: number, seconds: number, type: OscillatorType = 'sine', volume = 0.06, delay = 0) {
  try {
    context ??= new AudioContext();
    const start = context.currentTime + delay;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    osc.connect(gain).connect(context.destination);
    osc.start(start);
    osc.stop(start + seconds + 0.02);
  } catch {}
}

/** A rising run of notes, e.g. for a clear or a level up. */
export const arpeggio = (notes: number[], step = 0.055, type: OscillatorType = 'triangle', volume = 0.05) =>
  notes.forEach((f, i) => tone(f, 0.16, type, volume, i * step));
