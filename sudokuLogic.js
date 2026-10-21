/**
 * sudokuLogic.js - Lógica, puzzles predefinidos y validación para Sudoku Colaborativo
 * El líder de la sala define los números oficiales y los jugadores secundarios
 * aportan sugerencias y notas (pencil marks) en tiempo real.
 */

'use strict';

// Puzzles predefinidos verificados (81 caracteres, '.' o '0' para celdas vacías)
const PRESET_PUZZLES = {
  facil: [
    {
      name: 'Fácil Clásico #1',
      clues:
        '53..7....' +
        '6..195...' +
        '.98....6.' +
        '8...6...3' +
        '4..8.3..1' +
        '7...2...6' +
        '.6....28.' +
        '...419..5' +
        '....8..79',
      solution:
        '534678912' +
        '672195348' +
        '198342567' +
        '859761423' +
        '426853791' +
        '713924856' +
        '961537284' +
        '287419635' +
        '345286179'
    },
    {
      name: 'Fácil Amigable #2',
      clues:
        '...26.7.1' +
        '68..7..9.' +
        '19...45..' +
        '82.1...4.' +
        '..46.29..' +
        '.5...3.28' +
        '..93...74' +
        '.4..5..36' +
        '7.3.18...'
    }
  ],
  medio: [
    {
      name: 'Medio Equilibrado #1',
      clues:
        '..3.2.6..' +
        '9..3.5..1' +
        '..18.64..' +
        '..81.29..' +
        '7.......8' +
        '..67.82..' +
        '..26.95..' +
        '8..2.3..9' +
        '..5.1.3..'
    },
    {
      name: 'Medio Desafiante #2',
      clues:
        '2...8.3..' +
        '.6..7..84' +
        '.3.5..2.9' +
        '...1.54.8' +
        '.........' +
        '4.27.6...' +
        '3.1..7.4.' +
        '72..4..6.' +
        '..4.1...3'
    }
  ],
  dificil: [
    {
      name: 'Difícil Maestro #1',
      clues:
        '..5...9..' +
        '.2....7..' +
        '...4.8...' +
        '..8.1.5..' +
        '1.3...2.9' +
        '..9.7.4..' +
        '...6.3...' +
        '..7....1.' +
        '..4...6..'
    },
    {
      name: 'Difícil Experto #2',
      clues:
        '8........' +
        '..36.....' +
        '.7..9.2..' +
        '.5...7...' +
        '....457..' +
        '...1...3.' +
        '..1....68' +
        '..85...1.' +
        '.9....4..'
    }
  ]
};

/**
 * Crea una matriz inicial de 81 celdas para el Sudoku
 * @param {string} difficulty 'facil' | 'medio' | 'dificil' | 'custom'
 * @param {number} [presetIndex=0]
 */
function createSudokuBoard(difficulty = 'facil', presetIndex = 0) {
  const grid = [];
  let cluesString = '';

  if (difficulty !== 'custom' && PRESET_PUZZLES[difficulty]) {
    const list = PRESET_PUZZLES[difficulty];
    const item = list[presetIndex % list.length];
    cluesString = item.clues;
  }

  for (let i = 0; i < 81; i++) {
    const row = Math.floor(i / 9);
    const col = i % 9;
    const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);

    let val = 0;
    let isGiven = false;

    if (cluesString && cluesString[i] && cluesString[i] !== '.' && cluesString[i] !== '0') {
      const parsed = parseInt(cluesString[i], 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 9) {
        val = parsed;
        isGiven = true;
      }
    }

    grid.push({
      index: i,
      row,
      col,
      box,
      given: isGiven,
      value: val,
      suggestions: {} // { "1": [ { id, name, color } ], ... }
    });
  }

  return {
    difficulty,
    grid,
    solved: false,
    errors: [],
    solvedCount: countFilled(grid),
    totalEmpty: 81 - countFilled(grid)
  };
}

function countFilled(grid) {
  return grid.filter((c) => c.value > 0).length;
}

/**
 * Valida el estado actual de la grilla de Sudoku
 * Encuentra índices con números repetidos en fila, columna o caja 3x3
 * @param {Array} grid
 * @returns {{ errors: number[], isComplete: boolean, isValid: boolean }}
 */
function validateBoard(grid) {
  const errorIndices = new Set();

  // 1. Revisar Filas
  for (let r = 0; r < 9; r++) {
    const seen = new Map();
    for (let c = 0; c < 9; c++) {
      const idx = r * 9 + c;
      const cell = grid[idx];
      if (cell && cell.value > 0) {
        if (seen.has(cell.value)) {
          errorIndices.add(idx);
          errorIndices.add(seen.get(cell.value));
        } else {
          seen.set(cell.value, idx);
        }
      }
    }
  }

  // 2. Revisar Columnas
  for (let c = 0; c < 9; c++) {
    const seen = new Map();
    for (let r = 0; r < 9; r++) {
      const idx = r * 9 + c;
      const cell = grid[idx];
      if (cell && cell.value > 0) {
        if (seen.has(cell.value)) {
          errorIndices.add(idx);
          errorIndices.add(seen.get(cell.value));
        } else {
          seen.set(cell.value, idx);
        }
      }
    }
  }

  // 3. Revisar Cajas 3x3
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const seen = new Map();
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const row = br * 3 + r;
          const col = bc * 3 + c;
          const idx = row * 9 + col;
          const cell = grid[idx];
          if (cell && cell.value > 0) {
            if (seen.has(cell.value)) {
              errorIndices.add(idx);
              errorIndices.add(seen.get(cell.value));
            } else {
              seen.set(cell.value, idx);
            }
          }
        }
      }
    }
  }

  const errors = Array.from(errorIndices);
  const filledCount = countFilled(grid);
  const isComplete = filledCount === 81 && errors.length === 0;
  const isValid = errors.length === 0;

  return {
    errors,
    isComplete,
    isValid,
    filledCount
  };
}

/**
 * Agrega o quita una sugerencia (pencil mark) de un jugador en una celda
 */
function togglePlayerSuggestion(cell, num, player) {
  if (!cell || cell.value > 0) return false;
  if (num < 1 || num > 9) return false;

  const key = String(num);
  if (!cell.suggestions) cell.suggestions = {};
  if (!Array.isArray(cell.suggestions[key])) {
    cell.suggestions[key] = [];
  }

  const list = cell.suggestions[key];
  const existingIdx = list.findIndex((item) => item.id === player.id);

  if (existingIdx !== -1) {
    // Quitar sugerencia existente
    list.splice(existingIdx, 1);
    if (list.length === 0) {
      delete cell.suggestions[key];
    }
  } else {
    // Agregar nueva sugerencia
    list.push({
      id: player.id,
      name: player.name,
      color: player.avatar?.color || '#3B82F6',
      icon: player.avatar?.icon || '💡'
    });
  }

  return true;
}

module.exports = {
  PRESET_PUZZLES,
  createSudokuBoard,
  validateBoard,
  togglePlayerSuggestion,
  countFilled
};
