// client/src/components/pictionary/WordSelectionModal.jsx
import React from "react";
import { Sparkles, Clock } from "lucide-react";

export default function WordSelectionModal({
  options = [],
  timeLeft = 15,
  onSelectWord
}) {
  if (!options || options.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden">
        {/* Brillos de fondo */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Badge superior */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" /> ¡Tu turno de dibujar!
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Elige qué vas a dibujar
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm mt-1 mb-6">
          Selecciona una de las 3 palabras antes de que se agote el tiempo.
        </p>

        {/* Temporizador */}
        <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-slate-300 mb-5">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Tiempo para elegir: <strong className="text-amber-400 text-sm">{timeLeft}s</strong></span>
        </div>

        {/* Las 3 opciones de palabras */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {options.map((item, idx) => {
            const isFacil = item.difficulty === "Fácil";
            const isMedia = item.difficulty === "Media";

            const diffColor = isFacil
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              : isMedia
              ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
              : "bg-rose-500/15 text-rose-400 border-rose-500/30";

            return (
              <button
                key={item.word}
                type="button"
                onClick={() => onSelectWord(item.word, item.category, item.difficulty)}
                className="p-4 rounded-2xl bg-slate-950/70 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/80 transition-all flex flex-col items-center justify-center gap-2 shadow-lg group active:scale-95"
              >
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${diffColor}`}>
                  {item.difficulty}
                </span>

                <span className="text-base sm:text-lg font-black text-white group-hover:text-amber-300 tracking-wide">
                  {item.word}
                </span>

                <span className="text-[11px] text-slate-400">
                  {item.category}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
