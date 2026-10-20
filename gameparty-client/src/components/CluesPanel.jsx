// client/src/components/CluesPanel.jsx
import React, { useState } from "react";
import { CheckCircle2, Search, ArrowRight, ArrowDown, ZoomIn, Image as ImageIcon } from "lucide-react";

export default function CluesPanel({
  clues,
  solvedClues,
  selectedCell,
  direction,
  grid,
  onSelectClue,
  onOpenZoom
}) {
  const [filter, setFilter] = useState("");
  const [activeTab, setActiveTab] = useState("across");

  // Identificar el número de pista activo según la celda seleccionada
  const activeGridCell = selectedCell ? grid[selectedCell.row]?.[selectedCell.col] : null;
  const currentActiveClueNumber = activeGridCell
    ? direction === "across"
      ? activeGridCell.acrossClueNumber
      : activeGridCell.downClueNumber
    : null;

  const totalCluesCount = clues.across.length + clues.down.length;
  const solvedCluesCount = (solvedClues.across?.length || 0) + (solvedClues.down?.length || 0);
  const percentComplete = Math.round((solvedCluesCount / totalCluesCount) * 100) || 0;

  const filterClues = (list) => {
    if (!filter.trim()) return list;
    const term = filter.toLowerCase();
    return list.filter(
      (c) =>
        c.number.toString().includes(term) ||
        c.clue.toLowerCase().includes(term) ||
        c.answer.toLowerCase().includes(term)
    );
  };

  const renderClueItem = (clue, dir) => {
    const isSolved = solvedClues[dir]?.includes(clue.number);
    const isActive = direction === dir && currentActiveClueNumber === clue.number;

    return (
      <div
        key={`${dir}-${clue.number}`}
        onClick={() => onSelectClue(clue, dir)}
        className={`w-full text-left p-2.5 rounded-2xl transition-all border flex items-center gap-3 cursor-pointer select-none group relative ${
          isActive
            ? "bg-indigo-600/20 border-indigo-500 shadow-lg ring-1 ring-indigo-500/60 text-white"
            : isSolved
            ? "bg-slate-900/40 border-slate-800/60 text-slate-400 opacity-60 hover:opacity-90"
            : "bg-slate-900/70 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:text-slate-100"
        }`}
      >
        {/* Miniatura de la Foto */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenZoom) onOpenZoom(clue);
          }}
          className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-slate-950 border border-slate-700/80 shrink-0 shadow-sm"
          title="Toca para ampliar foto"
        >
          {clue.image ? (
            <>
              <img
                src={clue.image}
                alt={clue.clue}
                className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
              />
              <div className="absolute inset-0 bg-slate-950/20 hover:bg-slate-950/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                <ZoomIn className="w-3.5 h-3.5 text-white" />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600">
              <ImageIcon className="w-5 h-5" />
            </div>
          )}

          {/* Número de la pista sobre la imagen */}
          <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded bg-slate-950/80 text-[10px] font-bold text-slate-200 flex items-center justify-center">
            {clue.number}
          </span>
        </div>

        {/* Texto de la pista y letras */}
        <div className="flex-1 min-w-0">
          <p className={`text-xs sm:text-sm leading-tight font-medium line-clamp-2 ${isSolved ? "line-through text-slate-500" : ""}`}>
            {clue.clue}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] font-mono text-slate-400">
              {clue.answer.length} letras
            </span>
            {isSolved && (
              <span className="text-[11px] font-mono text-emerald-400 font-bold tracking-wider">
                ✓ {clue.answer}
              </span>
            )}
          </div>
        </div>

        {/* Indicador de resuelto */}
        {isSolved && (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mr-1" />
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col h-full shadow-xl">
      {/* Progreso del Crucigrama */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1.5">
          <span className="flex items-center gap-1.5">
            <span>Foto-Pistas</span>
            <span className="text-[10px] px-2 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
              {solvedCluesCount}/{totalCluesCount}
            </span>
          </span>
          <span className="text-indigo-400 font-mono">{percentComplete}%</span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-500 rounded-full"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </div>

      {/* Selector de Pestañas Horizontales / Verticales */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800 mb-3">
        <button
          type="button"
          onClick={() => setActiveTab("across")}
          className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
            activeTab === "across"
              ? "bg-indigo-600 text-white shadow"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <ArrowRight className="w-3.5 h-3.5" /> Horizontales ({clues.across.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("down")}
          className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
            activeTab === "down"
              ? "bg-indigo-600 text-white shadow"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <ArrowDown className="w-3.5 h-3.5" /> Verticales ({clues.down.length})
        </button>
      </div>

      {/* Buscador de pistas */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Buscar pista, foto o número..."
          className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
        />
      </div>

      {/* Lista de Pistas con Scroll */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px] max-h-[480px]">
        {activeTab === "across" ? (
          filterClues(clues.across).length > 0 ? (
            filterClues(clues.across).map((c) => renderClueItem(c, "across"))
          ) : (
            <div className="text-center py-8 text-xs text-slate-500">
              No hay pistas horizontales que coincidan.
            </div>
          )
        ) : (
          filterClues(clues.down).length > 0 ? (
            filterClues(clues.down).map((c) => renderClueItem(c, "down"))
          ) : (
            <div className="text-center py-8 text-xs text-slate-500">
              No hay pistas verticales que coincidan.
            </div>
          )
        )}
      </div>
    </div>
  );
}
