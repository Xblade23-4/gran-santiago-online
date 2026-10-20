// server/crosswords/generator.js
/**
 * Generador de Crucigramas Autodefinidos (Arrowords / Scandinavian style)
 * Las pistas, números, imágenes y flechas direccionales se ubican DIRECTAMENTE dentro de las casillas del tablero.
 */
const { DICTIONARIES } = require("./dictionaries");
const { enrichWordsWithOnlineClues } = require("./onlineClues");

const GRID_SIZE = 15; // Tablero oficial de 15x15 casillas

function normalizeWord(str) {
  return str
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-ZÑ]/g, "");
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function createEmptyGrid() {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
}

/**
 * Valida si una palabra puede ser colocada como Autodefinido (con su celda de pista adyacente)
 */
function canPlaceArroword(grid, word, startR, startC, dir) {
  const len = word.length;
  const clueR = dir === "across" ? startR : startR - 1;
  const clueC = dir === "across" ? startC - 1 : startC;

  // La celda de pista debe estar dentro de la cuadrícula
  if (clueR < 0 || clueR >= GRID_SIZE || clueC < 0 || clueC >= GRID_SIZE) return false;

  // El final de la palabra debe estar dentro de la cuadrícula
  if (dir === "across" && startC + len > GRID_SIZE) return false;
  if (dir === "down" && startR + len > GRID_SIZE) return false;

  // La celda de pista debe estar vacía o ser una celda de pista que no tenga asignada esta dirección aún
  const existingClueCell = grid[clueR][clueC];
  if (existingClueCell !== null) {
    if (existingClueCell.type !== "clue") return false;
    if (dir === "across" && existingClueCell.acrossClue) return false;
    if (dir === "down" && existingClueCell.downClue) return false;
  }

  // La celda inmediatamente posterior al término de la palabra no debe ser una letra que la extienda ilegalmente
  if (dir === "across" && startC + len < GRID_SIZE) {
    const after = grid[startR][startC + len];
    if (after !== null && after.type === "letter") return false;
  }
  if (dir === "down" && startR + len < GRID_SIZE) {
    const after = grid[startR + len][startC];
    if (after !== null && after.type === "letter") return false;
  }

  let hasIntersection = false;

  // Validar cada celda de letra
  for (let i = 0; i < len; i++) {
    const r = dir === "across" ? startR : startR + i;
    const c = dir === "across" ? startC + i : startC;
    const cell = grid[r][c];

    if (cell !== null) {
      if (cell.type !== "letter" || cell.solution !== word[i]) return false;
      hasIntersection = true;
    } else {
      // Si la celda está vacía, no debe tocar paralelamente otra palabra
      if (dir === "across") {
        if (r > 0 && grid[r - 1][c] && grid[r - 1][c].type === "letter") return false;
        if (r < GRID_SIZE - 1 && grid[r + 1][c] && grid[r + 1][c].type === "letter") return false;
      } else {
        if (c > 0 && grid[r][c - 1] && grid[r][c - 1].type === "letter") return false;
        if (c < GRID_SIZE - 1 && grid[r][c + 1] && grid[r][c + 1].type === "letter") return false;
      }
    }
  }

  return hasIntersection;
}

function placeWord(grid, wordItem, startR, startC, dir, tempId) {
  const word = wordItem.cleanWord;
  const len = word.length;
  const clueR = dir === "across" ? startR : startR - 1;
  const clueC = dir === "across" ? startC - 1 : startC;

  if (!grid[clueR][clueC]) {
    grid[clueR][clueC] = {
      type: "clue",
      row: clueR,
      col: clueC,
      number: null,
      acrossClue: null,
      downClue: null
    };
  }

  const clueObj = {
    tempId,
    number: null,
    direction: dir,
    answer: word,
    displayAnswer: wordItem.originalWord,
    clue: wordItem.clue,
    image: wordItem.image || "",
    row: startR,
    col: startC,
    targetRow: startR,
    targetCol: startC,
    clueRow: clueR,
    clueCol: clueC
  };

  if (dir === "across") grid[clueR][clueC].acrossClue = clueObj;
  else grid[clueR][clueC].downClue = clueObj;

  for (let i = 0; i < len; i++) {
    const r = dir === "across" ? startR : startR + i;
    const c = dir === "across" ? startC + i : startC;
    if (!grid[r][c]) {
      grid[r][c] = {
        type: "letter",
        solution: word[i],
        number: null,
        acrossClueNumber: null,
        downClueNumber: null
      };
    }
  }

  return clueObj;
}

async function generateCrossword({ category = "todo_tipo", difficulty = "Fácil", useOnlineClues = true } = {}) {
  const dict = DICTIONARIES[category] || DICTIONARIES.todo_tipo || DICTIONARIES.general;

  let targetWordCount = 14;
  if (difficulty === "Medio") targetWordCount = 18;
  if (difficulty === "Difícil") targetWordCount = 22;

  const rawWords = shuffle(dict.words).map(item => ({
    originalWord: item.word,
    cleanWord: normalizeWord(item.word),
    clue: item.clue,
    image: item.image || ""
  })).filter(w => w.cleanWord.length >= 3 && w.cleanWord.length <= 9);

  if (rawWords.length < targetWordCount * 2 && category !== "todo_tipo") {
    const fallbackWords = shuffle(DICTIONARIES.todo_tipo.words).map(item => ({
      originalWord: item.word,
      cleanWord: normalizeWord(item.word),
      clue: item.clue,
      image: item.image || ""
    })).filter(w => w.cleanWord.length >= 3 && w.cleanWord.length <= 9);

    for (const fw of fallbackWords) {
      if (!rawWords.some(rw => rw.cleanWord === fw.cleanWord)) {
        rawWords.push(fw);
      }
    }
  }

  let bestResult = { count: 0, grid: null, placedList: [] };
  const ATTEMPTS = 35;

  for (let att = 0; att < ATTEMPTS; att++) {
    const grid = createEmptyGrid();
    const placed = [];
    const pool = shuffle(rawWords);

    // Semilla: Palabra horizontal en filas 2 a 5, comenzando en col 1 (su celda de pista en col 0)
    const seedR = 2 + Math.floor(Math.random() * 4);
    const seedC = 1;
    const seed = pool.find(w => w.cleanWord.length >= 5 && w.cleanWord.length <= 8) || pool[0];
    const seedClue = placeWord(grid, seed, seedR, seedC, "across", 1);
    placed.push({ wordItem: seed, dir: "across", clueObj: seedClue });

    let tempCounter = 2;

    for (let pass = 0; pass < 5 && placed.length < targetWordCount; pass++) {
      for (const w of pool) {
        if (placed.length >= targetWordCount) break;
        if (placed.some(p => p.wordItem.cleanWord === w.cleanWord)) continue;

        let spots = [];
        for (const dir of ["across", "down"]) {
          const maxR = dir === "across" ? GRID_SIZE : GRID_SIZE - w.cleanWord.length;
          const maxC = dir === "across" ? GRID_SIZE - w.cleanWord.length : GRID_SIZE;
          const minR = dir === "down" ? 1 : 0;
          const minC = dir === "across" ? 1 : 0;

          for (let r = minR; r < maxR; r++) {
            for (let c = minC; c < maxC; c++) {
              if (canPlaceArroword(grid, w.cleanWord, r, c, dir)) {
                let intersections = 0;
                for (let i = 0; i < w.cleanWord.length; i++) {
                  const checkR = dir === "across" ? r : r + i;
                  const checkC = dir === "across" ? c + i : c;
                  if (grid[checkR][checkC] && grid[checkR][checkC].solution === w.cleanWord[i]) {
                    intersections++;
                  }
                }
                spots.push({ r, c, dir, intersections });
              }
            }
          }
        }

        if (spots.length > 0) {
          spots.sort((a, b) => b.intersections - a.intersections);
          const s = spots[0];
          const clueObj = placeWord(grid, w, s.r, s.c, s.dir, tempCounter++);
          placed.push({ wordItem: w, dir: s.dir, clueObj });
        }
      }
    }

    if (placed.length > bestResult.count) {
      bestResult = { count: placed.length, grid, placedList: placed };
      if (placed.length >= targetWordCount) break;
    }
  }

  const finalGrid = bestResult.grid;
  const placedWords = bestResult.placedList;

  // Enriquecer con pistas e imágenes en vivo desde Internet (Wikipedia)
  let enrichedWordItems = placedWords.map(p => ({
    ...p.wordItem,
    direction: p.dir,
    clueObj: p.clueObj
  }));

  if (useOnlineClues) {
    try {
      const enriched = await enrichWordsWithOnlineClues(enrichedWordItems);
      enrichedWordItems = enriched;
    } catch (e) {
      console.warn("[OnlineClues] Error en enriquecimiento:", e.message);
    }
  }

  // Asignar numeración secuencial ordenada (de arriba hacia abajo y de izquierda a derecha)
  let clueNumber = 1;
  const acrossClues = [];
  const downClues = [];

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const cell = finalGrid[r][c];
      if (cell && cell.type === "clue") {
        if (cell.acrossClue) {
          const num = clueNumber++;
          cell.acrossClue.number = num;
          cell.number = num;

          // Encontrar datos enriquecidos
          const enr = enrichedWordItems.find(item => item.cleanWord === cell.acrossClue.answer);
          if (enr) {
            cell.acrossClue.clue = enr.clue || cell.acrossClue.clue;
            cell.acrossClue.image = enr.image || cell.acrossClue.image;
            cell.acrossClue.source = enr.clueSource || "local";
          }

          acrossClues.push(cell.acrossClue);

          // Vincular celdas de letras
          for (let i = 0; i < cell.acrossClue.answer.length; i++) {
            const letterCell = finalGrid[cell.acrossClue.targetRow][cell.acrossClue.targetCol + i];
            if (letterCell) {
              letterCell.acrossClueNumber = num;
              if (!letterCell.number) letterCell.number = num;
            }
          }
        }

        if (cell.downClue) {
          const num = clueNumber++;
          cell.downClue.number = num;
          if (!cell.number) cell.number = num;

          const enr = enrichedWordItems.find(item => item.cleanWord === cell.downClue.answer);
          if (enr) {
            cell.downClue.clue = enr.clue || cell.downClue.clue;
            cell.downClue.image = enr.image || cell.downClue.image;
            cell.downClue.source = enr.clueSource || "local";
          }

          downClues.push(cell.downClue);

          for (let i = 0; i < cell.downClue.answer.length; i++) {
            const letterCell = finalGrid[cell.downClue.targetRow + i][cell.downClue.targetCol];
            if (letterCell) {
              letterCell.downClueNumber = num;
              if (!letterCell.number) letterCell.number = num;
            }
          }
        }
      }
    }
  }

  return {
    id: `autodefinido-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    title: `Autodefinido 15x15 de ${dict.name}`,
    category: dict.name,
    cover: dict.cover || "",
    difficulty,
    isArroword: true, // Identificador de autodefinido con pistas en celdas
    rows: GRID_SIZE,
    cols: GRID_SIZE,
    grid: finalGrid,
    clues: {
      across: acrossClues,
      down: downClues
    },
    totalWords: acrossClues.length + downClues.length
  };
}

module.exports = {
  GRID_SIZE,
  generateCrossword
};
