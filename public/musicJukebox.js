/**
 * musicJukebox.js - 20 Canciones pegajosas generadas con Web Audio API sintetizado
 * Canciones completas con melodías, líneas de bajo, acordes y ritmos electrónicos/chiptune.
 */

'use strict';

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MusicJukebox = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  const N = {
    _: 0,
    C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, B2: 123.47,
    C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
    C6: 1046.50, D6: 1174.66, E6: 1318.51
  };

  const DRUM_PATTERNS = {
    disco: ['K', 'H', 'KS', 'H', 'K', 'H', 'KS', 'O', 'K', 'H', 'KS', 'H', 'K', 'H', 'KS', 'O'],
    cumbia: ['K', '_', 'H', 'O', 'K', '_', 'H', 'O', 'K', '_', 'H', 'O', 'KS', '_', 'H', 'O'],
    driving: ['K', 'H', 'O', 'H', 'KS', 'H', 'O', 'H', 'K', 'H', 'O', 'H', 'KS', 'H', 'O', 'H'],
    shuffle: ['K', '_', 'H', 'KS', '_', 'H', 'K', '_', 'H', 'KS', '_', 'H', 'K', 'H', 'KS', 'O'],
    fast8bit: ['K', 'H', 'KS', 'H', 'K', 'K', 'KS', 'O', 'K', 'H', 'KS', 'H', 'K', 'KS', 'KS', 'O']
  };

  const SONGS = [
    {
      id: 1,
      name: '1. Fiesta en Sanhattan (Electro-Funk)',
      bpm: 124,
      leadWave: 'sawtooth',
      bassWave: 'sawtooth',
      chords: [[N.C3, N.G3, N.C4], [N.E3, N.B3, N.E4], [N.F3, N.C4, N.F4], [N.G3, N.D4, N.G4]],
      bass: [
        N.C2, N.C3, N.C2, N.C3, N.E2, N.E3, N.G2, N.G3, N.A2, N.A3, N.A2, N.A3, N.G2, N.G3, N.F2, N.G2,
        N.F2, N.F3, N.F2, N.F3, N.G2, N.G3, N.G2, N.G3, N.C2, N.C3, N.C2, N.C3, N.G2, N.E2, N.D2, N.B1,
        N.C2, N.C3, N.C2, N.C3, N.E2, N.E3, N.G2, N.G3, N.A2, N.A3, N.A2, N.A3, N.G2, N.G3, N.F2, N.G2,
        N.F2, N.F3, N.F2, N.F3, N.G2, N.G3, N.G2, N.G3, N.C2, N.E2, N.G2, N.C3, N.B2, N.G2, N.F2, N.D2
      ],
      lead: [
        N.C5, N.E5, N.G5, N.C6, N._, N.G5, N.E5, N.D5, N.E5, N.G5, N.A5, N.C6, N._, N.A5, N.G5, N.E5,
        N.F5, N.A5, N.C6, N.D6, N._, N.C6, N.A5, N.F5, N.G5, N.B5, N.D6, N.E6, N._, N.D6, N.B5, N.G5,
        N.C6, N.B5, N.A5, N.G5, N.E5, N.G5, N.A5, N.G5, N.E5, N.D5, N.C5, N.D5, N.E5, N.G5, N.A5, N.C6,
        N.D6, N.C6, N.A5, N.G5, N.A5, N.C6, N.D6, N.E6, N.G6, N._, N.E6, N.D6, N.C6, N._, N.C6, N._
      ],
      drums: DRUM_PATTERNS.disco
    },
    {
      id: 2,
      name: '2. Metro Expreso Línea 1 (Arcade Rush)',
      bpm: 132,
      leadWave: 'square',
      bassWave: 'sawtooth',
      chords: [[N.E3, N.B3, N.E4], [N.C3, N.G3, N.C4], [N.D3, N.A3, N.D4], [N.B2, N.F3, N.B3]],
      bass: [
        N.E2, N.E3, N.E2, N.E3, N.E2, N.E3, N.G2, N.B2, N.C2, N.C3, N.C2, N.C3, N.C2, N.C3, N.E2, N.G2,
        N.D2, N.D3, N.D2, N.D3, N.D2, N.D3, N.F2, N.A2, N.B2, N.B3, N.B2, N.B3, N.E3, N.D3, N.B2, N.G2,
        N.E2, N.E3, N.E2, N.E3, N.E2, N.E3, N.G2, N.B2, N.C2, N.C3, N.C2, N.C3, N.C2, N.C3, N.E2, N.G2,
        N.D2, N.D3, N.D2, N.D3, N.A2, N.D3, N.F3, N.A3, N.G2, N.B2, N.D3, N.G3, N.B3, N.A3, N.G3, N.F3
      ],
      lead: [
        N.B5, N.G5, N.E5, N.G5, N.B5, N._, N.A5, N.G5, N.E5, N.G5, N.A5, N.B5, N.G5, N.E5, N.D5, N.E5,
        N.G5, N.E5, N.C5, N.E5, N.G5, N._, N.A5, N.G5, N.E5, N._, N.C5, N.E5, N.G5, N.A5, N.G5, N.E5,
        N.A5, N.F5, N.D5, N.F5, N.A5, N._, N.B5, N.A5, N.F5, N.D5, N.F5, N.A5, N.C6, N.B5, N.A5, N.F5,
        N.G5, N._, N.B5, N._, N.A5, N.G5, N.E5, N.D5, N.E5, N.G5, N.B5, N.A5, N.G5, N.E5, N.G5, N.A5
      ],
      drums: DRUM_PATTERNS.fast8bit
    },
    {
      id: 3,
      name: '3. Cumbia Santiaguina en Bellavista',
      bpm: 116,
      leadWave: 'triangle',
      bassWave: 'triangle',
      chords: [[N.A3, N.C4, N.E4], [N.E3, N.G3, N.B3], [N.A3, N.C4, N.E4], [N.E3, N.G3, N.B3]],
      bass: [
        N.A2, N._, N._, N.C3, N._, N._, N.E3, N._, N.A2, N._, N._, N.C3, N._, N._, N.E3, N._,
        N.E2, N._, N._, N.G2, N._, N._, N.B2, N._, N.E2, N._, N._, N.G2, N._, N._, N.B2, N._,
        N.A2, N._, N._, N.C3, N._, N._, N.E3, N._, N.F2, N._, N._, N.A2, N._, N._, N.C3, N._,
        N.E2, N._, N._, N.G2, N._, N._, N.B2, N._, N.E2, N.G2, N.B2, N.E3, N.D3, N.C3, N.B2, N.G2
      ],
      lead: [
        N.A4, N.C5, N.E5, N.E5, N._, N.E5, N.D5, N.C5, N.E5, N.C5, N.A4, N._, N.A4, N.C5, N.E5, N._,
        N.B4, N.D5, N.G5, N.G5, N._, N.G5, N.F5, N.E5, N.D5, N.B4, N.G4, N._, N.G4, N.B4, N.D5, N._,
        N.C5, N.E5, N.A5, N.A5, N._, N.G5, N.F5, N.E5, N.F5, N.A5, N.C5, N._, N.C5, N.F5, N.A5, N._,
        N.G5, N.E5, N.B4, N.E5, N.G5, N.E5, N.B4, N.D5, N.E5, N._, N.C5, N.B4, N.A4, N._, N.A5, N._
      ],
      drums: DRUM_PATTERNS.cumbia
    },
    {
      id: 4,
      name: '4. Avenida Alameda Beat (Groovy Pop)',
      bpm: 122,
      leadWave: 'sawtooth',
      bassWave: 'sawtooth',
      chords: [[N.F3, N.A3, N.C4], [N.G3, N.B3, N.D4], [N.A3, N.C4, N.E4], [N.E3, N.G3, N.B3]],
      bass: [
        N.F2, N.F2, N.F3, N.F2, N.F3, N.F2, N.A2, N.C3, N.G2, N.G2, N.G3, N.G2, N.G3, N.G2, N.B2, N.D3,
        N.A2, N.A2, N.A3, N.A2, N.A3, N.A2, N.C3, N.E3, N.E2, N.E2, N.E3, N.E2, N.G2, N.B2, N.D3, N.E3,
        N.F2, N.F2, N.F3, N.F2, N.F3, N.F2, N.A2, N.C3, N.G2, N.G2, N.G3, N.G2, N.G3, N.G2, N.B2, N.D3,
        N.A2, N.A2, N.A3, N.A2, N.C3, N.E3, N.G3, N.A3, N.G3, N.E3, N.D3, N.B2, N.A2, N.G2, N.E2, N.D2
      ],
      lead: [
        N.C5, N.D5, N.F5, N.A5, N._, N.A5, N.G5, N.F5, N.D5, N.F5, N.G5, N.B5, N._, N.B5, N.A5, N.G5,
        N.E5, N.G5, N.A5, N.C6, N._, N.C6, N.B5, N.A5, N.G5, N.E5, N.D5, N.E5, N.G5, N._, N.E5, N.D5,
        N.C5, N.D5, N.F5, N.A5, N.C6, N.A5, N.F5, N.A5, N.G5, N.B5, N.D6, N.C6, N.B5, N.G5, N.B5, N.D6,
        N.E6, N.D6, N.C6, N.A5, N.C6, N.D6, N.E6, N.G6, N.E6, N.D6, N.C6, N.A5, N.C6, N._, N.C6, N._
      ],
      drums: DRUM_PATTERNS.disco
    },
    {
      id: 5,
      name: '5. Tarde Soleada en el Forestal (Lofi Melodic)',
      bpm: 108,
      leadWave: 'sine',
      bassWave: 'triangle',
      chords: [[N.D3, N.F3, N.A3], [N.G2, N.B2, N.D3], [N.C3, N.E3, N.G3], [N.A2, N.C3, N.E3]],
      bass: [
        N.D2, N._, N.A2, N.D3, N._, N.D2, N.F2, N.A2, N.G2, N._, N.D3, N.G2, N._, N.B2, N.D3, N.G2,
        N.C2, N._, N.G2, N.C3, N._, N.C2, N.E2, N.G2, N.A2, N._, N.E3, N.A2, N._, N.C3, N.E3, N.A2,
        N.D2, N._, N.A2, N.D3, N._, N.D2, N.F2, N.A2, N.G2, N._, N.D3, N.G2, N._, N.B2, N.D3, N.G2,
        N.C2, N._, N.G2, N.C3, N._, N.E2, N.G2, N.B2, N.A2, N.C3, N.E3, N.G3, N.F3, N.E3, N.D3, N.C3
      ],
      lead: [
        N.F5, N.A5, N.D6, N._, N.C6, N.A5, N.F5, N.D5, N.B4, N.D5, N.G5, N._, N.F5, N.D5, N.B4, N.G4,
        N.E4, N.G4, N.C5, N._, N.B4, N.G4, N.E4, N.C4, N.C4, N.E4, N.A4, N.C5, N.E5, N.D5, N.C5, N.A4,
        N.F5, N.A5, N.D6, N.F6, N.E6, N.C6, N.A5, N.F5, N.G5, N.B5, N.D6, N.G6, N.F6, N.D6, N.B5, N.G5,
        N.E5, N.G5, N.C6, N.E6, N.D6, N.B5, N.G5, N.E5, N.A5, N.C6, N.E6, N.D6, N.C6, N.A5, N.D6, N._
      ],
      drums: DRUM_PATTERNS.shuffle
    },
    {
      id: 6,
      name: '6. Fonda Gamer (Cueca 8-Bit)',
      bpm: 136,
      leadWave: 'square',
      bassWave: 'triangle',
      chords: [[N.A3, N.C4, N.E4], [N.D3, N.F3, N.A3], [N.E3, N.G3, N.B3], [N.A3, N.C4, N.E4]],
      bass: [
        N.A2, N.A3, N.A2, N.C3, N.E3, N.A2, N.D2, N.D3, N.D2, N.F2, N.A2, N.D3,
        N.E2, N.E3, N.E2, N.G2, N.B2, N.E3, N.A2, N.A3, N.A2, N.C3, N.E3, N.A2,
        N.A2, N.C3, N.E3, N.A3, N.D2, N.F2, N.A2, N.D3, N.E2, N.G2, N.B2, N.E3,
        N.A2, N.C3, N.E3, N.A3, N.E3, N.C3, N.A2, N.E2, N.A2, N.E2, N.A2, N.C3
      ],
      lead: [
        N.A5, N.A5, N.C6, N.A5, N.E5, N.C5, N.D5, N.F5, N.A5, N.F5, N.D5, N.F5,
        N.E5, N.G5, N.B5, N.G5, N.E5, N.D5, N.C5, N.E5, N.A5, N.E5, N.C5, N.A4,
        N.C5, N.E5, N.A5, N.C6, N.B5, N.A5, N.D5, N.F5, N.A5, N.C6, N.B5, N.A5,
        N.E5, N.G5, N.B5, N.D6, N.C6, N.B5, N.A5, N.C6, N.E6, N.A6, N.E6, N.A5
      ],
      drums: DRUM_PATTERNS.fast8bit
    },
    {
      id: 7,
      name: '7. Cordillera Sunset Synthwave',
      bpm: 115,
      leadWave: 'sawtooth',
      bassWave: 'sawtooth',
      chords: [[N.D3, N.F3, N.A3], [N.B2, N.D3, N.F3], [N.G2, N.B2, N.D3], [N.A2, N.C3, N.E3]],
      bass: [
        N.D2, N.D2, N.D3, N.D2, N.D2, N.D3, N.F2, N.A2, N.B1, N.B1, N.B2, N.B1, N.B1, N.B2, N.D2, N.F2,
        N.G1, N.G1, N.G2, N.G1, N.G1, N.G2, N.B1, N.D2, N.A1, N.A1, N.A2, N.A1, N.C2, N.E2, N.G2, N.A2,
        N.D2, N.D2, N.D3, N.D2, N.D2, N.D3, N.F2, N.A2, N.B1, N.B1, N.B2, N.B1, N.B1, N.B2, N.D2, N.F2,
        N.G1, N.G1, N.G2, N.G1, N.G1, N.G2, N.B1, N.D2, N.A1, N.C2, N.E2, N.G2, N.F2, N.E2, N.D2, N.C2
      ],
      lead: [
        N.D5, N.F5, N.A5, N.D6, N._, N.A5, N.F5, N.E5, N.D5, N.F5, N.B5, N.D6, N._, N.B5, N.A5, N.F5,
        N.G5, N.B5, N.D6, N.G6, N._, N.D6, N.B5, N.A5, N.A5, N.C6, N.E6, N.A6, N._, N.G6, N.E6, N.C6,
        N.F6, N.E6, N.D6, N.A5, N.D6, N.C6, N.B5, N.F5, N.B5, N.A5, N.G5, N.D5, N.G5, N.F5, N.E5, N.C5,
        N.D5, N.F5, N.A5, N.D6, N.E6, N.F6, N.G6, N.A6, N.D6, N._, N.A5, N._, N.D6, N._, N.D5, N._
      ],
      drums: DRUM_PATTERNS.driving
    },
    {
      id: 8,
      name: '8. Paseo Ahumada Shuffle (Urban Groove)',
      bpm: 120,
      leadWave: 'triangle',
      bassWave: 'sawtooth',
      chords: [[N.G3, N.B3, N.D4], [N.C3, N.E3, N.G3], [N.D3, N.F3, N.A3], [N.G3, N.B3, N.D4]],
      bass: [
        N.G2, N.G2, N.B2, N.D3, N.E3, N.D3, N.B2, N.G2, N.C2, N.C2, N.E2, N.G2, N.A2, N.G2, N.E2, N.C2,
        N.D2, N.D2, N.F2, N.A2, N.B2, N.A2, N.F2, N.D2, N.G2, N.B2, N.D3, N.E3, N.D3, N.B2, N.A2, N.F2,
        N.G2, N.G2, N.B2, N.D3, N.E3, N.D3, N.B2, N.G2, N.C2, N.C2, N.E2, N.G2, N.A2, N.G2, N.E2, N.C2,
        N.D2, N.D2, N.F2, N.A2, N.C3, N.A2, N.F2, N.D2, N.G2, N.D3, N.G3, N.B3, N.A3, N.F3, N.D3, N.B2
      ],
      lead: [
        N.G5, N.B5, N.D6, N.E6, N._, N.D6, N.B5, N.A5, N.G5, N.E5, N.G5, N.C6, N._, N.G5, N.E5, N.C5,
        N.F5, N.A5, N.C6, N.D6, N._, N.C6, N.A5, N.F5, N.G5, N.B5, N.D6, N.E6, N._, N.D6, N.B5, N.G5,
        N.B5, N.D6, N.G6, N.G6, N.F6, N.E6, N.D6, N.B5, N.C6, N.E6, N.G6, N.G6, N.E6, N.C6, N.A5, N.G5,
        N.A5, N.C6, N.D6, N.F6, N.E6, N.D6, N.C6, N.A5, N.G5, N.B5, N.D6, N.G6, N._, N.G5, N.G6, N._
      ],
      drums: DRUM_PATTERNS.shuffle
    },
    {
      id: 9,
      name: '9. Parque O\'Higgins Carnaval',
      bpm: 126,
      leadWave: 'sawtooth',
      bassWave: 'square',
      chords: [[N.C3, N.E3, N.G3], [N.F3, N.A3, N.C4], [N.G3, N.B3, N.D4], [N.C3, N.E3, N.G3]],
      bass: [
        N.C2, N.C3, N.E2, N.G2, N.C3, N.E2, N.G2, N.C3, N.F2, N.F3, N.A2, N.C3, N.F3, N.A2, N.C3, N.F2,
        N.G2, N.G3, N.B2, N.D3, N.G3, N.B2, N.D3, N.G2, N.C2, N.C3, N.E2, N.G2, N.C3, N.G2, N.E2, N.D2,
        N.C2, N.C3, N.E2, N.G2, N.C3, N.E2, N.G2, N.C3, N.F2, N.F3, N.A2, N.C3, N.F3, N.A2, N.C3, N.F2,
        N.G2, N.G3, N.B2, N.D3, N.F3, N.D3, N.B2, N.G2, N.C2, N.E2, N.G2, N.C3, N.B2, N.A2, N.G2, N.F2
      ],
      lead: [
        N.E5, N.G5, N.C6, N.E6, N.D6, N.C6, N.G5, N.E5, N.A5, N.C6, N.F6, N.A6, N.G6, N.F6, N.C6, N.A5,
        N.B5, N.D6, N.G6, N.B6, N.A6, N.G6, N.D6, N.B5, N.C6, N.E6, N.G6, N.C7, N.B6, N.G6, N.E6, N.D6,
        N.E6, N.G6, N.C7, N.B6, N.A6, N.G6, N.F6, N.E6, N.F6, N.A6, N.D7, N.C7, N.B6, N.A6, N.G6, N.F6,
        N.G6, N.B6, N.E7, N.D7, N.C7, N.B6, N.A6, N.G6, N.C7, N._, N.G6, N._, N.C6, N._, N.C7, N._
      ],
      drums: DRUM_PATTERNS.disco
    },
    {
      id: 10,
      name: '10. Plaza Baquedano Anthems (Synth Pop)',
      bpm: 125,
      leadWave: 'sawtooth',
      bassWave: 'sawtooth',
      chords: [[N.A3, N.C4, N.E4], [N.F3, N.A3, N.C4], [N.C3, N.E3, N.G3], [N.G3, N.B3, N.D4]],
      bass: [
        N.A2, N.A3, N.A2, N.A3, N.A2, N.A3, N.C3, N.E3, N.F2, N.F3, N.F2, N.F3, N.F2, N.F3, N.A2, N.C3,
        N.C2, N.C3, N.C2, N.C3, N.C2, N.C3, N.E2, N.G2, N.G2, N.G3, N.G2, N.G3, N.D3, N.B2, N.G2, N.E2,
        N.A2, N.A3, N.A2, N.A3, N.A2, N.A3, N.C3, N.E3, N.F2, N.F3, N.F2, N.F3, N.F2, N.F3, N.A2, N.C3,
        N.C2, N.C3, N.C2, N.C3, N.E3, N.G3, N.C4, N.E4, N.G2, N.B2, N.D3, N.G3, N.B3, N.A3, N.G3, N.E3
      ],
      lead: [
        N.E5, N.A5, N.C6, N.E6, N._, N.C6, N.A5, N.G5, N.F5, N.A5, N.C6, N.F6, N._, N.C6, N.A5, N.F5,
        N.G5, N.C6, N.E6, N.G6, N._, N.E6, N.C6, N.B5, N.D5, N.G5, N.B5, N.D6, N._, N.B5, N.G5, N.E5,
        N.C6, N.B5, N.A5, N.E5, N.A5, N.C6, N.E6, N.D6, N.C6, N.A5, N.F5, N.C5, N.F5, N.A5, N.C6, N.B5,
        N.G5, N.E5, N.C5, N.E5, N.G5, N.C6, N.E6, N.G6, N.A6, N._, N.E6, N._, N.A5, N._, N.A6, N._
      ],
      drums: DRUM_PATTERNS.driving
    },
    {
      id: 11,
      name: '11. Subida al Cerro San Cristóbal',
      bpm: 118,
      leadWave: 'triangle',
      bassWave: 'triangle',
      chords: [[N.D3, N.G3, N.B3], [N.E3, N.A3, N.C4], [N.F3, N.A3, N.D4], [N.G3, N.B3, N.E4]],
      bass: [
        N.G2, N.D3, N.G3, N.B2, N.D3, N.G2, N.B2, N.D3, N.A2, N.E3, N.A3, N.C3, N.E3, N.A2, N.C3, N.E3,
        N.D2, N.A2, N.D3, N.F2, N.A2, N.D2, N.F2, N.A2, N.E2, N.B2, N.E3, N.G2, N.B2, N.E2, N.G2, N.B2,
        N.G2, N.D3, N.G3, N.B2, N.D3, N.G2, N.B2, N.D3, N.A2, N.E3, N.A3, N.C3, N.E3, N.A2, N.C3, N.E3,
        N.D2, N.A2, N.D3, N.F3, N.A3, N.D4, N.C4, N.A3, N.G2, N.B2, N.D3, N.G3, N.B3, N.D4, N.G4, N._
      ],
      lead: [
        N.D5, N.G5, N.B5, N.D6, N.B5, N.G5, N.D5, N.B4, N.E5, N.A5, N.C6, N.E6, N.C6, N.A5, N.E5, N.C5,
        N.F5, N.A5, N.D6, N.F6, N.D6, N.A5, N.F5, N.D5, N.G5, N.B5, N.E6, N.G6, N.E6, N.B5, N.G5, N.E5,
        N.B5, N.D6, N.G6, N.F6, N.E6, N.D6, N.B5, N.G5, N.C6, N.E6, N.A6, N.G6, N.F6, N.E6, N.C6, N.A5,
        N.D6, N.F6, N.A6, N.G6, N.F6, N.D6, N.A5, N.F5, N.G6, N._, N.D6, N._, N.B5, N._, N.G5, N._
      ],
      drums: DRUM_PATTERNS.disco
    },
    {
      id: 12,
      name: '12. Bohemia en Barrio Italia (Jazz-Hop)',
      bpm: 112,
      leadWave: 'sine',
      bassWave: 'triangle',
      chords: [[N.D3, N.F3, N.A3], [N.G2, N.B2, N.F3], [N.C3, N.E3, N.B3], [N.A2, N.C3, N.G3]],
      bass: [
        N.D2, N._, N.A2, N.F2, N.D2, N.F2, N.A2, N.C3, N.G2, N._, N.D3, N.B2, N.G2, N.B2, N.D3, N.F3,
        N.C2, N._, N.G2, N.E2, N.C2, N.E2, N.G2, N.B2, N.A2, N._, N.E3, N.C3, N.A2, N.C3, N.E3, N.G3,
        N.D2, N._, N.A2, N.F2, N.D2, N.F2, N.A2, N.C3, N.G2, N._, N.D3, N.B2, N.G2, N.B2, N.D3, N.F3,
        N.C2, N._, N.G2, N.E2, N.A2, N.C3, N.E3, N.G3, N.D3, N.A2, N.F2, N.D2, N.G2, N.A2, N.C3, N.D3
      ],
      lead: [
        N.F5, N.A5, N.C6, N.E6, N._, N.D6, N.A5, N.F5, N.F5, N.G5, N.B5, N.D6, N._, N.B5, N.G5, N.D5,
        N.E5, N.G5, N.B5, N.D6, N._, N.C6, N.G5, N.E5, N.E5, N.A5, N.C6, N.E6, N._, N.C6, N.A5, N.E5,
        N.D6, N.C6, N.A5, N.F5, N.A5, N.C6, N.E6, N.F6, N.E6, N.D6, N.B5, N.G5, N.B5, N.D6, N.F6, N.G6,
        N.E6, N.D6, N.C6, N.A5, N.C6, N.E6, N.G6, N.A6, N.D6, N._, N.A5, N._, N.F5, N._, N.D5, N._
      ],
      drums: DRUM_PATTERNS.shuffle
    },
    {
      id: 13,
      name: '13. TAG a Máxima Velocidad (Synthwave 80s)',
      bpm: 130,
      leadWave: 'sawtooth',
      bassWave: 'sawtooth',
      chords: [[N.A2, N.E3, N.A3], [N.F2, N.C3, N.F3], [N.D2, N.A2, N.D3], [N.E2, N.B2, N.E3]],
      bass: [
        N.A1, N.A1, N.A2, N.A1, N.A1, N.A2, N.A1, N.A2, N.F1, N.F1, N.F2, N.F1, N.F1, N.F2, N.F1, N.F2,
        N.D1, N.D1, N.D2, N.D1, N.D1, N.D2, N.D1, N.D2, N.E1, N.E1, N.E2, N.E1, N.E1, N.E2, N.G1, N.B1,
        N.A1, N.A1, N.A2, N.A1, N.A1, N.A2, N.A1, N.A2, N.F1, N.F1, N.F2, N.F1, N.F1, N.F2, N.F1, N.F2,
        N.D1, N.D1, N.D2, N.D1, N.D1, N.D2, N.F1, N.A1, N.E1, N.E1, N.E2, N.E1, N.G1, N.B1, N.D2, N.E2
      ],
      lead: [
        N.A5, N.C6, N.E6, N.A6, N.G6, N.E6, N.C6, N.A5, N.F5, N.A5, N.C6, N.F6, N.E6, N.C6, N.A5, N.F5,
        N.D5, N.F5, N.A5, N.D6, N.C6, N.A5, N.F5, N.D5, N.E5, N.G5, N.B5, N.E6, N.D6, N.B5, N.G5, N.E5,
        N.E6, N.A6, N.C7, N.B6, N.A6, N.E6, N.C6, N.A5, N.F6, N.A6, N.C7, N.B6, N.A6, N.F6, N.C6, N.A5,
        N.D6, N.F6, N.A6, N.G6, N.F6, N.D6, N.A5, N.F5, N.E6, N.G6, N.B6, N.E7, N.D7, N.B6, N.A6, N._
      ],
      drums: DRUM_PATTERNS.driving
    },
    {
      id: 14,
      name: '14. Barrio Lastarria Vibe (Acoustic Chiptune)',
      bpm: 114,
      leadWave: 'triangle',
      bassWave: 'triangle',
      chords: [[N.C3, N.E3, N.G3], [N.A2, N.C3, N.E3], [N.F2, N.A2, N.C3], [N.G2, N.B2, N.D3]],
      bass: [
        N.C2, N.G2, N.C3, N.E3, N.G2, N.C3, N.E2, N.G2, N.A2, N.E3, N.A3, N.C4, N.E3, N.A3, N.C3, N.E3,
        N.F2, N.C3, N.F3, N.A3, N.C3, N.F3, N.A2, N.C3, N.G2, N.D3, N.G3, N.B3, N.D3, N.G3, N.B2, N.D3,
        N.C2, N.G2, N.C3, N.E3, N.G2, N.C3, N.E2, N.G2, N.A2, N.E3, N.A3, N.C4, N.E3, N.A3, N.C3, N.E3,
        N.F2, N.C3, N.F3, N.A3, N.G2, N.D3, N.G3, N.B3, N.C2, N.E2, N.G2, N.C3, N.E3, N.G3, N.C4, N._
      ],
      lead: [
        N.E5, N.G5, N.C6, N.E6, N._, N.D6, N.C6, N.B5, N.C6, N.E5, N.A5, N.C6, N._, N.B5, N.A5, N.G5,
        N.A5, N.C6, N.F6, N.A6, N._, N.G6, N.F6, N.E6, N.F6, N.D5, N.G5, N.B5, N._, N.A5, N.G5, N.F5,
        N.G5, N.C6, N.E6, N.G6, N.F6, N.E6, N.D6, N.C6, N.A5, N.C6, N.E6, N.A6, N.G6, N.E6, N.D6, N.C6,
        N.F6, N.A6, N.C7, N.B6, N.A6, N.F6, N.D6, N.B5, N.C6, N._, N.G5, N._, N.E5, N._, N.C5, N._
      ],
      drums: DRUM_PATTERNS.disco
    },
    {
      id: 15,
      name: '15. Pudú en Aventura Arcade (Cute & Catchy)',
      bpm: 134,
      leadWave: 'square',
      bassWave: 'sawtooth',
      chords: [[N.F3, N.A3, N.C4], [N.C3, N.E3, N.G3], [N.D3, N.F3, N.A3], [N.B2, N.D3, N.G3]],
      bass: [
        N.F2, N.F3, N.F2, N.F3, N.C3, N.A2, N.F2, N.A2, N.C2, N.C3, N.C2, N.C3, N.G2, N.E2, N.C2, N.E2,
        N.D2, N.D3, N.D2, N.D3, N.A2, N.F2, N.D2, N.F2, N.B1, N.B2, N.B1, N.B2, N.G2, N.D2, N.B1, N.D2,
        N.F2, N.F3, N.F2, N.F3, N.C3, N.A2, N.F2, N.A2, N.C2, N.C3, N.C2, N.C3, N.G2, N.E2, N.C2, N.E2,
        N.D2, N.D3, N.D2, N.D3, N.F2, N.A2, N.D3, N.F3, N.G2, N.B2, N.D3, N.G3, N.B3, N.G3, N.D3, N.B2
      ],
      lead: [
        N.A5, N.C6, N.F6, N.A6, N.G6, N.F6, N.C6, N.A5, N.G5, N.E5, N.C5, N.E5, N.G5, N.C6, N.E6, N.G6,
        N.F6, N.D6, N.A5, N.D6, N.F6, N.A6, N.G6, N.F6, N.D6, N.B5, N.G5, N.B5, N.D6, N.F6, N.E6, N.D6,
        N.C6, N.F6, N.A6, N.C7, N.B6, N.A6, N.F6, N.C6, N.E6, N.G6, N.C7, N.B6, N.A6, N.G6, N.E6, N.C6,
        N.F6, N.A6, N.D7, N.C7, N.B6, N.A6, N.F6, N.D6, N.G6, N._, N.E6, N._, N.C6, N._, N.F6, N._
      ],
      drums: DRUM_PATTERNS.fast8bit
    },
    {
      id: 16,
      name: '16. Torre Sanhattan Neón Club',
      bpm: 128,
      leadWave: 'sawtooth',
      bassWave: 'sawtooth',
      chords: [[N.B2, N.F3, N.B3], [N.G2, N.D3, N.G3], [N.E2, N.B2, N.E3], [N.F2, N.C3, N.F3]],
      bass: [
        N.B1, N.B2, N.B1, N.B2, N.F2, N.D2, N.B1, N.D2, N.G1, N.G2, N.G1, N.G2, N.D2, N.B1, N.G1, N.B1,
        N.E1, N.E2, N.E1, N.E2, N.B1, N.G1, N.E1, N.G1, N.F1, N.F2, N.F1, N.F2, N.C2, N.A1, N.F1, N.A1,
        N.B1, N.B2, N.B1, N.B2, N.F2, N.D2, N.B1, N.D2, N.G1, N.G2, N.G1, N.G2, N.D2, N.B1, N.G1, N.B1,
        N.E1, N.E2, N.E1, N.E2, N.G1, N.B1, N.E2, N.G2, N.F1, N.A1, N.C2, N.F2, N.A2, N.C3, N.F3, N._
      ],
      lead: [
        N.D6, N.B5, N.F5, N.B5, N.D6, N.F6, N.E6, N.D6, N.B5, N.G5, N.D5, N.G5, N.B5, N.D6, N.C6, N.B5,
        N.G5, N.E5, N.B4, N.E5, N.G5, N.B5, N.A5, N.G5, N.A5, N.F5, N.C5, N.F5, N.A5, N.C6, N.B5, N.A5,
        N.F6, N.D6, N.B5, N.D6, N.F6, N.B6, N.A6, N.F6, N.D6, N.B5, N.G5, N.B5, N.D6, N.G6, N.F6, N.D6,
        N.B5, N.G5, N.E5, N.G5, N.B5, N.E6, N.D6, N.B5, N.C6, N.A5, N.F5, N.A5, N.C6, N.F6, N.B6, N._
      ],
      drums: DRUM_PATTERNS.driving
    },
    {
      id: 17,
      name: '17. Carnaval de la Primavera',
      bpm: 124,
      leadWave: 'square',
      bassWave: 'triangle',
      chords: [[N.A3, N.C4, N.E4], [N.D3, N.F3, N.A3], [N.G3, N.B3, N.D4], [N.C3, N.E3, N.G3]],
      bass: [
        N.A2, N.C3, N.E3, N.A3, N.E3, N.C3, N.A2, N.C3, N.D2, N.F2, N.A2, N.D3, N.A2, N.F2, N.D2, N.F2,
        N.G2, N.B2, N.D3, N.G3, N.D3, N.B2, N.G2, N.B2, N.C2, N.E2, N.G2, N.C3, N.G2, N.E2, N.C2, N.E2,
        N.A2, N.C3, N.E3, N.A3, N.E3, N.C3, N.A2, N.C3, N.D2, N.F2, N.A2, N.D3, N.A2, N.F2, N.D2, N.F2,
        N.G2, N.B2, N.D3, N.G3, N.B3, N.D4, N.B3, N.G3, N.C3, N.E3, N.G3, N.C4, N.B3, N.A3, N.G3, N.E3
      ],
      lead: [
        N.C6, N.A5, N.E5, N.A5, N.C6, N.E6, N.D6, N.C6, N.A5, N.F5, N.D5, N.F5, N.A5, N.D6, N.C6, N.A5,
        N.B5, N.G5, N.D5, N.G5, N.B5, N.D6, N.C6, N.B5, N.G5, N.E5, N.C5, N.E5, N.G5, N.C6, N.B5, N.G5,
        N.A5, N.C6, N.E6, N.A6, N.G6, N.E6, N.C6, N.A5, N.D6, N.F6, N.A6, N.D7, N.C7, N.A6, N.F6, N.D6,
        N.G6, N.B6, N.D7, N.G7, N.F7, N.D7, N.B6, N.G6, N.C7, N._, N.G6, N._, N.E6, N._, N.C6, N._
      ],
      drums: DRUM_PATTERNS.disco
    },
    {
      id: 18,
      name: '18. Lluvia de Primavera en Maipú',
      bpm: 110,
      leadWave: 'sine',
      bassWave: 'triangle',
      chords: [[N.E3, N.G3, N.B3], [N.C3, N.E3, N.G3], [N.A2, N.C3, N.E3], [N.B2, N.D3, N.F3]],
      bass: [
        N.E2, N.B2, N.E3, N.G3, N.B2, N.E3, N.G2, N.B2, N.C2, N.G2, N.C3, N.E3, N.G2, N.C3, N.E2, N.G2,
        N.A2, N.E3, N.A3, N.C4, N.E3, N.A3, N.C3, N.E3, N.B2, N.F3, N.B3, N.D4, N.F3, N.B3, N.D3, N.F3,
        N.E2, N.B2, N.E3, N.G3, N.B2, N.E3, N.G2, N.B2, N.C2, N.G2, N.C3, N.E3, N.G2, N.C3, N.E2, N.G2,
        N.A2, N.E3, N.A3, N.C4, N.B2, N.D3, N.F3, N.B3, N.E2, N.G2, N.B2, N.E3, N.D3, N.B2, N.A2, N.G2
      ],
      lead: [
        N.G5, N.B5, N.E6, N.G6, N._, N.E6, N.B5, N.G5, N.E5, N.G5, N.C6, N.E6, N._, N.C6, N.G5, N.E5,
        N.C5, N.E5, N.A5, N.C6, N._, N.A5, N.E5, N.C5, N.D5, N.F5, N.B5, N.D6, N._, N.B5, N.F5, N.D5,
        N.B5, N.E6, N.G6, N.B6, N.A6, N.G6, N.E6, N.B5, N.G5, N.C6, N.E6, N.G6, N.F6, N.E6, N.C6, N.G5,
        N.E5, N.A5, N.C6, N.E6, N.D6, N.C6, N.B5, N.A5, N.G5, N.E5, N.B4, N.E5, N.G5, N._, N.E5, N._
      ],
      drums: DRUM_PATTERNS.shuffle
    },
    {
      id: 19,
      name: '19. Duelo de Magnates (Rival Battle)',
      bpm: 138,
      leadWave: 'square',
      bassWave: 'sawtooth',
      chords: [[N.C3, N.E3, N.G3], [N.D3, N.F3, N.A3], [N.E3, N.G3, N.B3], [N.C3, N.E3, N.G3]],
      bass: [
        N.C2, N.C3, N.C2, N.C3, N.G2, N.E2, N.C2, N.E2, N.D2, N.D3, N.D2, N.D3, N.A2, N.F2, N.D2, N.F2,
        N.E2, N.E3, N.E2, N.E3, N.B2, N.G2, N.E2, N.G2, N.C2, N.C3, N.C2, N.C3, N.E2, N.G2, N.B2, N.D3,
        N.C2, N.C3, N.C2, N.C3, N.G2, N.E2, N.C2, N.E2, N.D2, N.D3, N.D2, N.D3, N.A2, N.F2, N.D2, N.F2,
        N.E2, N.E3, N.G3, N.B3, N.D4, N.B3, N.G3, N.E3, N.C3, N.E3, N.G3, N.C4, N.D4, N.C4, N.B3, N.G3
      ],
      lead: [
        N.C6, N.C6, N.E6, N.G6, N.E6, N.C6, N.G5, N.E5, N.D6, N.D6, N.F6, N.A6, N.F6, N.D6, N.A5, N.F5,
        N.E6, N.E6, N.G6, N.B6, N.G6, N.E6, N.B5, N.G5, N.C7, N.B6, N.A6, N.G6, N.E6, N.D6, N.C6, N.G5,
        N.C6, N.E6, N.G6, N.C7, N.B6, N.G6, N.E6, N.C6, N.D6, N.F6, N.A6, N.D7, N.C7, N.A6, N.F6, N.D6,
        N.E6, N.G6, N.B6, N.E7, N.D7, N.B6, N.G6, N.E6, N.C7, N._, N.G6, N._, N.E6, N._, N.C7, N._
      ],
      drums: DRUM_PATTERNS.fast8bit
    },
    {
      id: 20,
      name: '20. Victoria Monumental en Santiago',
      bpm: 126,
      leadWave: 'sawtooth',
      bassWave: 'triangle',
      chords: [[N.F3, N.A3, N.C4], [N.G3, N.B3, N.D4], [N.C3, N.E3, N.G3], [N.A3, N.C4, N.E4]],
      bass: [
        N.F2, N.C3, N.F3, N.A3, N.C3, N.F3, N.A2, N.C3, N.G2, N.D3, N.G3, N.B3, N.D3, N.G3, N.B2, N.D3,
        N.C2, N.G2, N.C3, N.E3, N.G2, N.C3, N.E2, N.G2, N.A2, N.E3, N.A3, N.C4, N.E3, N.A3, N.C3, N.E3,
        N.F2, N.C3, N.F3, N.A3, N.C3, N.F3, N.A2, N.C3, N.G2, N.D3, N.G3, N.B3, N.D3, N.G3, N.B2, N.D3,
        N.C2, N.E2, N.G2, N.C3, N.E3, N.G3, N.C4, N.E4, N.C4, N.G3, N.E3, N.C3, N.G2, N.E2, N.C2, N._
      ],
      lead: [
        N.C5, N.F5, N.A5, N.C6, N.D6, N.C6, N.A5, N.F5, N.D5, N.G5, N.B5, N.D6, N.E6, N.D6, N.B5, N.G5,
        N.E5, N.G5, N.C6, N.E6, N.G6, N.E6, N.C6, N.G5, N.A5, N.C6, N.E6, N.A6, N.G6, N.E6, N.C6, N.A5,
        N.F6, N.A6, N.C7, N.C7, N.B6, N.A6, N.F6, N.D6, N.G6, N.B6, N.D7, N.D7, N.C7, N.B6, N.G6, N.E6,
        N.C7, N.B6, N.A6, N.G6, N.E6, N.D6, N.C6, N.G5, N.C6, N.E6, N.G6, N.C7, N.C7, N._, N.C7, N._
      ],
      drums: DRUM_PATTERNS.disco
    }
  ];

  return {
    SONGS,
    DRUM_PATTERNS
  };
});
