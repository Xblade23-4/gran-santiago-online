/**
 * sudokuLogic.js - Lógica, puzzles predefinidos y validación para Sudoku Colaborativo
 * El líder de la sala define los números oficiales y los jugadores secundarios
 * aportan sugerencias y notas (pencil marks) en tiempo real.
 * 
 * Incluye un banco de 1000 tablas distintas y únicas de Sudoku por cada dificultad:
 * - 1000 tablas Fácil
 * - 1000 tablas Medio
 * - 1000 tablas Difícil
 */

'use strict';

const fs = require('fs');
const path = require('path');

let RAW_PUZZLES = null;
try {
  RAW_PUZZLES = require('./sudokuPuzzles.json');
} catch (_) {
  try {
    const raw = fs.readFileSync(path.join(__dirname, 'sudokuPuzzles.json'), 'utf8');
    RAW_PUZZLES = JSON.parse(raw);
  } catch (err) {
    console.error('Error al cargar sudokuPuzzles.json:', err);
  }
}

const diffLabels = {
  facil: 'Fácil',
  medio: 'Medio',
  dificil: 'Difícil'
};

// Banco de 1000 tablas verificadas por dificultad (3000 tablas en total)
const PRESET_PUZZLES = {
  facil: [],
  medio: [],
  dificil: []
};

if (RAW_PUZZLES) {
  for (const diff of ['facil', 'medio', 'dificil']) {
    const list = RAW_PUZZLES[diff] || [];
    PRESET_PUZZLES[diff] = list.map((cluesStr, idx) => ({
      name: `${diffLabels[diff]} #${idx + 1}`,
      clues: cluesStr
    }));
  }
}

/**
 * Crea una matriz inicial de 81 celdas para el Sudoku
 * @param {string} difficulty 'facil' | 'medio' | 'dificil' | 'custom'
 * @param {number|null} [presetIndex=null] Si es null, elige aleatoriamente entre las 1000 tablas
 */
function createSudokuBoard(difficulty = 'facil', presetIndex = null) {
  const grid = [];
  let cluesString = '';
  let selectedIndex = 0;

  if (difficulty !== 'custom' && PRESET_PUZZLES[difficulty] && PRESET_PUZZLES[difficulty].length > 0) {
    const list = PRESET_PUZZLES[difficulty];
    selectedIndex = (presetIndex !== null && presetIndex !== undefined)
      ? Math.abs(Number(presetIndex)) % list.length
      : Math.floor(Math.random() * list.length);
    const item = list[selectedIndex];
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
    puzzleIndex: selectedIndex,
    puzzleName: (PRESET_PUZZLES[difficulty] && PRESET_PUZZLES[difficulty][selectedIndex])
      ? PRESET_PUZZLES[difficulty][selectedIndex].name
      : `${difficulty.toUpperCase()}`,
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
