// client/src/components/ImageLightboxModal.jsx
import React, { useEffect } from "react";
import { X, ZoomIn, Lightbulb, ArrowRight, ArrowDown } from "lucide-react";

export default function ImageLightboxModal({
  clue,
  isOpen,
  onClose,
  onRequestHint
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !clue) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col relative"
      >
        {/* Cabecera del modal */}
        <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center">
              {clue.number}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
              {clue.direction === "across" ? (
                <>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Horizontal</span>
                </>
              ) : (
                <>
                  <ArrowDown className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Vertical</span>
                </>
              )}
              <span className="text-slate-500">•</span>
              <span className="text-indigo-400 font-mono">({clue.answer?.length || 0} letras)</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Fotografía principal ampliada */}
        <div className="relative bg-slate-950 flex items-center justify-center min-h-[260px] max-h-[60vh] overflow-hidden group">
          {clue.image ? (
            <img
              src={clue.image}
              alt={clue.clue}
              className="w-full h-full object-contain max-h-[55vh] transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="text-slate-500 text-sm py-12">No hay imagen disponible</div>
          )}
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-sm border border-slate-700 text-[11px] font-semibold text-slate-300 flex items-center gap-1 pointer-events-none">
            <ZoomIn className="w-3.5 h-3.5 text-indigo-400" /> Foto-Pista HD
          </div>
        </div>

        {/* Pista y botones inferiores */}
        <div className="p-4 sm:p-5 bg-slate-900/90 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm sm:text-base font-semibold text-slate-100 leading-snug">
              {clue.clue}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Observa con atención la fotografía para deducir la palabra.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onRequestHint && (
              <button
                type="button"
                onClick={() => {
                  onRequestHint();
                  onClose();
                }}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Lightbulb className="w-3.5 h-3.5" /> Pista (-20)
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/30"
            >
              Volver al Tablero
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
