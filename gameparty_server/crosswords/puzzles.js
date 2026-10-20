// server/crosswords/puzzles.js
const { generateCrossword, GRID_SIZE } = require("./generator");
const { DICTIONARIES } = require("./dictionaries");

function getCategories() {
  return Object.keys(DICTIONARIES).map(key => ({
    id: key,
    name: DICTIONARIES[key].name,
    description: DICTIONARIES[key].description,
    icon: DICTIONARIES[key].icon,
    cover: DICTIONARIES[key].cover
  }));
}

async function createPuzzle({ category = "todo_tipo", difficulty = "Fácil", useOnlineClues = true } = {}) {
  return await generateCrossword({ category, difficulty, useOnlineClues });
}

module.exports = {
  GRID_SIZE,
  getCategories,
  createPuzzle
};
