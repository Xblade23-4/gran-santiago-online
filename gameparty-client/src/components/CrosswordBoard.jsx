// client/src/components/CrosswordBoard.jsx
import React, { useEffect, useRef } from "react";
import { sound } from "../utils/sound";

export default function CrosswordBoard({
  room,
  playerId,
  selectedCell,
  direction,
  onSelectCell,
  onDirectionChange,
  onLetterInput,
  otherPlayers
}) {
  const boardRef = useRef(null);

  const { rows, cols, grid } = room.puzzle;
  const boardState = room.boardState;

  // Encontrar la pista activa según la celda y dirección seleccionada
  const currentGridCell = selectedCell ? grid[selectedCell.row]?.[selectedCell.col] : null;
  const activeClueNumber = currentGridCell
    ? direction === "across"
      ? currentGridCell.acrossClueNumber
      : currentGridCell.downClueNumber
    : null;

  // Manejar teclado físico
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedCell) return;
      
      // Ignorar si el usuario está escribiendo en el chat o en un input
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
        return;
      }

      const { row, col } = selectedCell;

      // 1. Tecla de alternar dirección (Espacio)
      if (e.key === " ") {
        e.preventDefault();
        toggleDirection();
        return;
      }

      // 2. Flechas de navegación
      if (e.key === "ArrowRight") {
        e.preventDefault();
        moveToCell(row, col + 1, "across");
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        moveToCell(row, col - 1, "across");
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        moveToCell(row + 1, col, "down");
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        moveToCell(row - 1, col, "down");
        return;
      }

      // 3. Borrar (Backspace / Delete)
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        const currentCellData = boardState[row]?.[col];
        if (currentCellData && !currentCellData.locked) {
          if (currentCellData.letter) {
            onLetterInput(row, col, "");
            sound.playBackspace();
          } else {
            // Retroceder una casilla y borrarla si no está bloqueada
            const prev = getPrevCell(row, col, direction);
            if (prev) {
              onSelectCell(prev.row, prev.col);
              const prevCellData = boardState[prev.row]?.[prev.col];
              if (prevCellData && !prevCellData.locked) {
                onLetterInput(prev.row, prev.col, "");
                sound.playBackspace();
              }
            }
          }
        } else {
          // Si está bloqueada, retroceder
          const prev = getPrevCell(row, col, direction);
          if (prev) onSelectCell(prev.row, prev.col);
        }
        return;
      }

      // 4. Escribir letra (A-Z, Ñ)
      const letter = e.key.toUpperCase();
      if (/^[A-ZÑ]$/.test(letter)) {
        e.preventDefault();
        const currentCellData = boardState[row]?.[col];
        if (currentCellData && !currentCellData.locked) {
          onLetterInput(row, col, letter);
          sound.playType();
        }
        // Avanzar automáticamente a la siguiente celda de la palabra
        const next = getNextCell(row, col, direction);
        if (next) {
          onSelectCell(next.row, next.col);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCell, direction, boardState]);

  const toggleDirection = () => {
    if (!selectedCell) return;
    const cell = grid[selectedCell.row]?.[selectedCell.col];
    if (!cell) return;

    if (direction === "across" && cell.downClueNumber) {
      onDirectionChange("down");
    } else if (direction === "down" && cell.acrossClueNumber) {
      onDirectionChange("across");
    }
  };

  const getNextCell = (r, c, dir) => {
    let nextR = dir === "down" ? r + 1 : r;
    let nextC = dir === "across" ? c + 1 : c;
    if (nextR < rows && nextC < cols && grid[nextR]?.[nextC] && grid[nextR][nextC].type === "letter") {
      return { row: nextR, col: nextC };
    }
    return null;
  };

  const getPrevCell = (r, c, dir) => {
    let prevR = dir === "down" ? r - 1 : r;
    let prevC = dir === "across" ? c - 1 : c;
    if (prevR >= 0 && prevC >= 0 && grid[prevR]?.[prevC] && grid[prevR][prevC].type === "letter") {
      return { row: prevR, col: prevC };
    }
    return null;
  };

  const moveToCell = (r, c, newDir) => {
    if (r >= 0 && r < rows && c >= 0 && c < cols && grid[r]?.[c] && grid[r][c].type === "letter") {
      onSelectCell(r, c);
      if (newDir) onDirectionChange(newDir);
    }
  };

  const handleCellClick = (r, c) => {
    const cell = grid[r]?.[c];
    if (!cell) return;

    // Si es una casilla de pista (Autodefinido)
    if (cell.type === "clue") {
      if (cell.acrossClue && cell.downClue) {
        if (direction === "across") {
          onSelectCell(cell.downClue.targetRow, cell.downClue.targetCol);
          onDirectionChange("down");
        } else {
          onSelectCell(cell.acrossClue.targetRow, cell.acrossClue.targetCol);
          onDirectionChange("across");
        }
      } else if (cell.acrossClue) {
        onSelectCell(cell.acrossClue.targetRow, cell.acrossClue.targetCol);
        onDirectionChange("across");
      } else if (cell.downClue) {
        onSelectCell(cell.downClue.targetRow, cell.downClue.targetCol);
        onDirectionChange("down");
      }
      return;
    }

    // Casilla de letra
    if (selectedCell?.row === r && selectedCell?.col === c) {
      toggleDirection();
    } else {
      if (direction === "across" && !cell.acrossClueNumber && cell.downClueNumber) {
        onDirectionChange("down");
      } else if (direction === "down" && !cell.downClueNumber && cell.acrossClueNumber) {
        onDirectionChange("across");
      }
      onSelectCell(r, c);
    }
  };

  // Determinar si una celda pertenece a la palabra activa
  const isCellInActiveWord = (r, c) => {
    if (!activeClueNumber || !grid[r]?.[c]) return false;
    const cell = grid[r][c];
    if (cell.type === "clue") {
      return (direction === "across" && cell.acrossClue?.number === activeClueNumber) ||
             (direction === "down" && cell.downClue?.number === activeClueNumber);
    }
    return direction === "across"
      ? cell.acrossClueNumber === activeClueNumber
      : cell.downClueNumber === activeClueNumber;
  };

  return (
    <div className="flex flex-col items-center select-none w-full">
      {/* Contenedor del Tablero con Scroll horizontal en móviles */}
      <div 
        ref={boardRef}
        className="w-full flex justify-center overflow-auto p-2 sm:p-4 touch-manipulation"
      >
        <div 
          className="grid gap-0.5 sm:gap-1 bg-slate-950 p-2 sm:p-3 rounded-2xl border border-slate-800 shadow-2xl relative"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            width: "fit-content",
            maxWidth: "100%"
          }}
        >
          {Array.from({ length: rows }).map((_, r) =>
            Array.from({ length: cols }).map((_, c) => {
              const cellMeta = grid[r]?.[c];
              const cellState = boardState[r]?.[c];

              // Celda bloqueada (casilla negra vacía)
              if (!cellMeta) {
                return (
                  <div
                    key={`${r}-${c}`}
                    className="w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 bg-slate-950/80 rounded-md border border-slate-900/60"
                  />
                );
              }

              // Casilla de Pista Integrada (Autodefinido / Swedish Arroword)
              if (cellMeta.type === "clue") {
                const isActiveClue = isCellInActiveWord(r, c);
                const hasAcross = !!cellMeta.acrossClue;
                const hasDown = !!cellMeta.downClue;
                const clueImg = cellMeta.acrossClue?.image || cellMeta.downClue?.image;
                const clueText = cellMeta.acrossClue?.clue || cellMeta.downClue?.clue || "";
                const isSolvedAcross = cellMeta.acrossClue ? room.solvedClues?.across?.includes(cellMeta.acrossClue.number) : false;
                const isSolvedDown = cellMeta.downClue ? room.solvedClues?.down?.includes(cellMeta.downClue.number) : false;
                const isAllSolved = (cellMeta.acrossClue ? isSolvedAcross : true) && (cellMeta.downClue ? isSolvedDown : true);

                return (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    title={cellMeta.acrossClue ? `[→] ${cellMeta.acrossClue.clue}` : `[↓] ${cellMeta.downClue?.clue}`}
                    className={`relative w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-lg flex flex-col items-center justify-center p-0.5 cursor-pointer overflow-hidden transition-all duration-150 select-none ${
                      isActiveClue
                        ? "bg-amber-500/20 border-2 border-amber-400 ring-2 ring-amber-400/40 shadow-lg scale-105 z-20 text-amber-200"
                        : isAllSolved
                        ? "bg-emerald-950/50 border border-emerald-500/50 text-emerald-400"
                        : "bg-slate-900 border border-indigo-500/40 hover:border-indigo-400 text-slate-200 hover:bg-slate-800"
                    }`}
                  >
                    {/* Si tiene imagen: miniatura fotográfica con overlay */}
                    {clueImg ? (
                      <div className="relative w-full h-full rounded overflow-hidden">
                        <img src={clueImg} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                          <span className="text-amber-300 font-black text-xs sm:text-sm drop-shadow">
                            {hasAcross && hasDown ? "↘" : hasAcross ? "→" : "↓"}
                          </span>
                        </div>
                        <span className="absolute top-0 left-0 text-[7px] sm:text-[8px] font-bold text-white bg-slate-950/80 px-0.5 rounded-br leading-none">
                          {cellMeta.number}
                        </span>
                      </div>
                    ) : (
                      // Pista de texto: número + flecha direccional
                      <div className="w-full h-full flex flex-col items-center justify-between p-0.5">
                        <div className="w-full flex items-center justify-between">
                          <span className="text-[7px] sm:text-[8px] font-bold text-indigo-300 leading-none">
                            {cellMeta.number}
                          </span>
                          {isAllSolved && <span className="text-emerald-400 text-[8px] leading-none">✓</span>}
                        </div>
                        <div className="flex items-center justify-center gap-0.5 text-amber-400 font-black text-xs sm:text-sm leading-none">
                          {hasAcross && <span>→</span>}
                          {hasDown && <span>↓</span>}
                        </div>
                        <div className="text-[6px] sm:text-[7px] leading-[1] text-slate-300 truncate w-full text-center">
                          {clueText.slice(0, 8)}...
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              // Casilla de Letra
              const isSelected = selectedCell?.row === r && selectedCell?.col === c;
              const isInWord = isCellInActiveWord(r, c);
              const isLocked = cellState?.locked;

              // Encontrar jugadores con cursor en esta casilla
              const cursorsHere = otherPlayers?.filter(
                p => p.cursor?.row === r && p.cursor?.col === c
              ) || [];

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={`relative w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 flex items-center justify-center font-black text-xs sm:text-sm md:text-base lg:text-lg cursor-pointer rounded-lg transition-all duration-100 ${
                    isSelected
                      ? "bg-indigo-600 text-white ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950 z-20 shadow-lg scale-105"
                      : isInWord
                      ? "bg-indigo-950/70 text-indigo-100 border border-indigo-500/40"
                      : isLocked
                      ? "bg-slate-800/80 text-emerald-400 border border-emerald-500/30"
                      : "bg-slate-800/60 text-slate-100 hover:bg-slate-700/60 border border-slate-700/60"
                  }`}
                >
                  {/* Número de la pista en la esquina superior izquierda */}
                  {cellMeta.number && (
                    <span 
                      className={`absolute top-0.5 left-1 text-[7px] sm:text-[9px] md:text-[10px] font-semibold leading-none pointer-events-none ${
                        isSelected ? "text-indigo-200" : "text-slate-400"
                      }`}
                    >
                      {cellMeta.number}
                    </span>
                  )}

                  {/* Letra ingresada */}
                  <span className={`leading-none ${isSelected ? "text-white" : isLocked ? "text-emerald-400 font-extrabold" : "text-slate-100 font-bold"}`}>
                    {cellState?.letter || ""}
                  </span>

                  {/* Cursors de otros jugadores */}
                  {cursorsHere.length > 0 && (
                    <div 
                      className="absolute -top-3 -right-2 flex -space-x-1 z-30 pointer-events-none animate-bounce"
                      title={cursorsHere.map(p => p.nickname).join(", ")}
                    >
                      {cursorsHere.map((p) => (
                        <div
                          key={p.id}
                          style={{ borderColor: p.color.hex }}
                          className="w-5 h-5 rounded-full bg-slate-900 border-2 flex items-center justify-center text-[10px] shadow-md"
                        >
                          {p.avatar}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Borde del color del amigo que escribió */}
                  {cellState?.lastEditedBy && !isSelected && (
                    <div 
                      className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: cellState.lastEditedBy.color?.hex || "#94a3b8" }}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Teclado en Pantalla Virtual (útil en móviles o mouse) */}
      <div className="w-full max-w-xl px-2 mt-3 block sm:hidden">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 shadow-lg">
          {/* Fila 1 */}
          <div className="flex justify-center gap-1 mb-1">
            {["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"].map(letter => (
              <button
                key={letter}
                type="button"
                onClick={() => {
                  if (selectedCell) {
                    onLetterInput(selectedCell.row, selectedCell.col, letter);
                    sound.playType();
                    const next = getNextCell(selectedCell.row, selectedCell.col, direction);
                    if (next) onSelectCell(next.row, next.col);
                  }
                }}
                className="flex-1 h-9 rounded bg-slate-800 active:bg-indigo-600 text-xs font-bold text-slate-200 active:text-white"
              >
                {letter}
              </button>
            ))}
          </div>

          {/* Fila 2 */}
          <div className="flex justify-center gap-1 mb-1">
            {["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ñ"].map(letter => (
              <button
                key={letter}
                type="button"
                onClick={() => {
                  if (selectedCell) {
                    onLetterInput(selectedCell.row, selectedCell.col, letter);
                    sound.playType();
                    const next = getNextCell(selectedCell.row, selectedCell.col, direction);
                    if (next) onSelectCell(next.row, next.col);
                  }
                }}
                className="flex-1 h-9 rounded bg-slate-800 active:bg-indigo-600 text-xs font-bold text-slate-200 active:text-white"
              >
                {letter}
              </button>
            ))}
          </div>

          {/* Fila 3 con Cambiar Dirección y Borrar */}
          <div className="flex justify-center gap-1">
            <button
              type="button"
              onClick={toggleDirection}
              className="px-2 h-9 rounded bg-indigo-600 active:bg-indigo-500 text-[11px] font-bold text-white flex items-center gap-1"
            >
              {direction === "across" ? "↔ Horiz" : "↕ Vert"}
            </button>

            {["Z", "X", "C", "V", "B", "N", "M"].map(letter => (
              <button
                key={letter}
                type="button"
                onClick={() => {
                  if (selectedCell) {
                    onLetterInput(selectedCell.row, selectedCell.col, letter);
                    sound.playType();
                    const next = getNextCell(selectedCell.row, selectedCell.col, direction);
                    if (next) onSelectCell(next.row, next.col);
                  }
                }}
                className="flex-1 h-9 rounded bg-slate-800 active:bg-indigo-600 text-xs font-bold text-slate-200 active:text-white"
              >
                {letter}
              </button>
            ))}

            <button
              type="button"
              onClick={() => {
                if (selectedCell) {
                  onLetterInput(selectedCell.row, selectedCell.col, "");
                  sound.playBackspace();
                  const prev = getPrevCell(selectedCell.row, selectedCell.col, direction);
                  if (prev) onSelectCell(prev.row, prev.col);
                }
              }}
              className="px-2 h-9 rounded bg-rose-600/30 active:bg-rose-600 text-xs font-bold text-rose-300 active:text-white"
            >
              ⌫
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
