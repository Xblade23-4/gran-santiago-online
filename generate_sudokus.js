/**
 * generate_sudokus.js
 * Genera 1000 tablas distintas y únicas de Sudoku para cada dificultad:
 * - 1000 tablas Fácil (38-42 pistas)
 * - 1000 tablas Medio (32-35 pistas)
 * - 1000 tablas Difícil (26-29 pistas)
 * Todas con solución única matemáticamente verificada.
 */

'use strict';

const fs = require('fs');
const path = require('path');

function createEmptyGrid() {
  return new Array(81).fill(0);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function solveSudoku(grid, limit = 2) {
  let solutions = 0;
  function solve(idx) {
    if (solutions >= limit) return;
    if (idx === 81) {
      solutions++;
      return;
    }
    if (grid[idx] !== 0) {
      solve(idx + 1);
      return;
    }
    const r = Math.floor(idx / 9), c = idx % 9;
    const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
    let used = 0;
    for (let i = 0; i < 9; i++) {
      used |= (1 << grid[r * 9 + i]);
      used |= (1 << grid[i * 9 + c]);
      const rr = br + Math.floor(i / 3), cc = bc + (i % 3);
      used |= (1 << grid[rr * 9 + cc]);
    }
    for (let num = 1; num <= 9; num++) {
      if (!(used & (1 << num))) {
        grid[idx] = num;
        solve(idx + 1);
        grid[idx] = 0;
        if (solutions >= limit) return;
      }
    }
  }
  solve(0);
  return solutions;
}

function generateCompleteGrid() {
  const grid = createEmptyGrid();
  function fill(idx) {
    if (idx === 81) return true;
    const r = Math.floor(idx / 9), c = idx % 9;
    const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
    let used = 0;
    for (let i = 0; i < 9; i++) {
      used |= (1 << grid[r * 9 + i]);
      used |= (1 << grid[i * 9 + c]);
      const rr = br + Math.floor(i / 3), cc = bc + (i % 3);
      used |= (1 << grid[rr * 9 + cc]);
    }
    const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const num of nums) {
      if (!(used & (1 << num))) {
        grid[idx] = num;
        if (fill(idx + 1)) return true;
        grid[idx] = 0;
      }
    }
    return false;
  }
  fill(0);
  return grid;
}

function generateSeedPuzzle(targetClues) {
  const full = generateCompleteGrid();
  const puzzle = full.slice();
  const indices = shuffle(Array.from({ length: 81 }, (_, i) => i));

  let currentClues = 81;
  for (const idx of indices) {
    if (currentClues <= targetClues) break;
    const backup = puzzle[idx];
    puzzle[idx] = 0;
    const clone = puzzle.slice();
    if (solveSudoku(clone, 2) === 1) {
      currentClues--;
    } else {
      puzzle[idx] = backup;
    }
  }

  return puzzle.map(n => (n === 0 ? '.' : String(n))).join('');
}

function transformSudoku(cluesStr) {
  const map = [0];
  const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  for (let d = 1; d <= 9; d++) map[d] = digits[d - 1];

  let grid = [];
  for (let r = 0; r < 9; r++) {
    grid[r] = [];
    for (let c = 0; c < 9; c++) {
      const ch = cluesStr[r * 9 + c];
      grid[r][c] = (ch >= '1' && ch <= '9') ? map[parseInt(ch, 10)] : '.';
    }
  }

  // Permutar filas dentro de cada banda (3 filas)
  for (let b = 0; b < 3; b++) {
    const perm = shuffle([0, 1, 2]);
    const bandRows = [grid[b * 3], grid[b * 3 + 1], grid[b * 3 + 2]];
    grid[b * 3] = bandRows[perm[0]];
    grid[b * 3 + 1] = bandRows[perm[1]];
    grid[b * 3 + 2] = bandRows[perm[2]];
  }

  // Permutar columnas dentro de cada stack (3 columnas)
  for (let s = 0; s < 3; s++) {
    const perm = shuffle([0, 1, 2]);
    for (let r = 0; r < 9; r++) {
      const stackCols = [grid[r][s * 3], grid[r][s * 3 + 1], grid[r][s * 3 + 2]];
      grid[r][s * 3] = stackCols[perm[0]];
      grid[r][s * 3 + 1] = stackCols[perm[1]];
      grid[r][s * 3 + 2] = stackCols[perm[2]];
    }
  }

  // Permutar bandas completas de filas
  const bandPerm = shuffle([0, 1, 2]);
  const newGridBands = [];
  for (let b = 0; b < 3; b++) {
    const origB = bandPerm[b];
    newGridBands.push(grid[origB * 3], grid[origB * 3 + 1], grid[origB * 3 + 2]);
  }
  grid = newGridBands;

  // Permutar stacks completos de columnas
  const stackPerm = shuffle([0, 1, 2]);
  for (let r = 0; r < 9; r++) {
    const row = grid[r];
    const newRow = [];
    for (let s = 0; s < 3; s++) {
      const origS = stackPerm[s];
      newRow.push(row[origS * 3], row[origS * 3 + 1], row[origS * 3 + 2]);
    }
    grid[r] = newRow;
  }

  // Transposición diagonal aleatoria (50% prob)
  if (Math.random() < 0.5) {
    const transposed = [];
    for (let c = 0; c < 9; c++) {
      transposed[c] = [];
      for (let r = 0; r < 9; r++) {
        transposed[c][r] = grid[r][c];
      }
    }
    grid = transposed;
  }

  let out = '';
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      out += grid[r][c];
    }
  }
  return out;
}

function generateDifficultyBatch(targetClues, count = 1000) {
  const uniqueSet = new Set();
  const numSeeds = 10;
  const seeds = [];

  console.log(`Generando ${numSeeds} semillas maestras para dificultad objetivo ${targetClues} pistas...`);
  for (let s = 0; s < numSeeds; s++) {
    seeds.push(generateSeedPuzzle(targetClues));
  }

  console.log(`Expandiendo a ${count} tablas únicas mediante automorfismos de Sudoku...`);
  let seedIdx = 0;
  while (uniqueSet.size < count) {
    const seed = seeds[seedIdx % seeds.length];
    seedIdx++;
    const variant = transformSudoku(seed);
    uniqueSet.add(variant);
  }

  return Array.from(uniqueSet);
}

console.log('🚀 Iniciando generación de 1000 tablas por dificultad...');

console.time('Facil');
const facil = generateDifficultyBatch(38, 1000);
console.timeEnd('Facil');
console.log(`✅ Fácil: ${facil.length} tablas únicas generadas.`);

console.time('Medio');
const medio = generateDifficultyBatch(32, 1000);
console.timeEnd('Medio');
console.log(`✅ Medio: ${medio.length} tablas únicas generadas.`);

console.time('Dificil');
const dificil = generateDifficultyBatch(28, 1000);
console.timeEnd('Dificil');
console.log(`✅ Difícil: ${dificil.length} tablas únicas generadas.`);

const output = {
  facil,
  medio,
  dificil
};

const outputPath = path.join(__dirname, 'sudokuPuzzles.json');
fs.writeFileSync(outputPath, JSON.stringify(output), 'utf8');

const stat = fs.statSync(outputPath);
console.log(`\n🎉 Archivo guardado con éxito en: ${outputPath}`);
console.log(`📊 Tamaño del archivo: ${(stat.size / 1024).toFixed(1)} KB`);
console.log(`Total tablas: Fácil: ${facil.length}, Medio: ${medio.length}, Difícil: ${dificil.length}`);
