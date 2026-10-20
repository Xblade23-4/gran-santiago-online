// client/src/components/PictureClueCard.jsx
import React from "react";
import { ZoomIn, ArrowRight, ArrowDown, ChevronLeft, ChevronRight, CheckCircle2, Image as ImageIcon } from "lucide-react";

export default function PictureClueCard({
  clue,
  isSolved,
  onOpenZoom,
  onPrevClue,
  onNextClue,
  onDirectionToggle
}) {
  if (!clue) {
    return (
      <div className="w-full max-w-xl bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 text-center text-xs text-slate-400 mb-3 shadow-lg">
        Toca una casilla del crucigrama para ver su foto-pista.
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl bg-slate-900/90 backdrop-blur border border-slate-800/90 rounded-2xl p-3 sm:p-4 mb-3 shadow-xl transition-all relative overflow-hidden">
      {/* Fondo con brillo sutil */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Miniatura de la Imagen con botón de Zoom interactivo */}
        <div 
          onClick={onOpenZoom}
          className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-950 border border-slate-700/80 cursor-pointer group shrink-0 shadow-md"
          title="Toca para ampliar la foto"
        >
          {clue.image ? (
            <>
              <img
                src={clue.image}
                alt={clue.clue}
                className="w-full h-full object-cover transition duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                <ZoomIn className="w-5 h-5 text-white filter drop-shadow" />
              </div>
              <div className="absolute bottom-1 right-1 p-1 rounded-md bg-slate-950/70 backdrop-blur-sm text-white">
                <ZoomIn className="w-3 h-3 text-indigo-300" />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs">
              <ImageIcon className="w-6 h-6 mb-1 text-slate-600" />
              <span>Sin foto</span>
            </div>
          )}

          {/* Badge si está resuelta */}
          {isSolved && (
            <div className="absolute top-1 left-1 bg-emerald-500 text-white p-0.5 rounded-full shadow">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        {/* Contenido de la pista */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            {/* Pill de Dirección y Número */}
            <button
              type="button"
              onClick={onDirectionToggle}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition"
              title="Alternar entre Horizontal y Vertical"
            >
              <span className="w-4 h-4 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                {clue.number}
              </span>
              <span>{clue.direction === "across" ? "Horizontal" : "Vertical"}</span>
              {clue.direction === "across" ? (
                <ArrowRight className="w-3 h-3" />
              ) : (
                <ArrowDown className="w-3 h-3" />
              )}
            </button>

            {/* Contador de letras, ubicación en el tablero y estado */}
            <div className="flex items-center gap-2">
              {clue.clueRow !== undefined && (
                <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded">
                  📌 [{clue.clueRow},{clue.clueCol}]
                </span>
              )}
              {isSolved ? (
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
                  ¡Resuelta!
                </span>
              ) : (
                <span className="text-xs font-mono font-semibold text-slate-400">
                  {clue.answer?.length || 0} letras
                </span>
              )}
            </div>
          </div>

          {/* Pista o Definición */}
          <p className={`text-xs sm:text-sm font-medium text-slate-200 line-clamp-2 leading-tight ${isSolved ? "line-through text-slate-400" : ""}`}>
            {clue.clue}
          </p>

          {/* Navegación rápida entre pistas */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80">
            <span className="text-[10px] text-slate-400 italic">
              Toca la imagen para ampliar 🔍
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onPrevClue}
                className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                title="Pista anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onNextClue}
                className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                title="Siguiente pista"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
