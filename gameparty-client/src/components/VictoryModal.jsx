// client/src/components/VictoryModal.jsx
import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { Trophy, Clock, Award, RotateCcw, ArrowRight, Sparkles } from "lucide-react";
import { sound } from "../utils/sound";

export default function VictoryModal({
  room,
  players,
  onPlayAgain,
  onReturnToLobby,
  onLeaveRoom,
  isHost
}) {
  useEffect(() => {
    // Sonido de victoria
    sound.playVictory();

    // Ráfagas de confeti festivo
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 }
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 }
      });

      if (Date.now() < animationEnd) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  // Ordenar jugadores por puntos
  const sortedPlayers = [...(players || [])].sort((a, b) => (b.score || 0) - (a.score || 0));
  const winner = sortedPlayers[0];

  const totalTimeSec = room?.endTime && room?.startTime
    ? Math.max(1, Math.floor((room.endTime - room.startTime) / 1000))
    : 0;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const isPictionary = room?.gameType === "pictionary";

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center">
        {/* Luces de fondo de celebración */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Corona / Trofeo */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 shadow-xl shadow-amber-500/30 mb-4 animate-bounce">
          <Trophy className="w-10 h-10" />
        </div>

        <h2 className="text-3xl font-black text-white tracking-tight">
          {isPictionary ? "¡Partida de Doodle Party Finalizada!" : "¡Crucigrama Completado!"}
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          {isPictionary
            ? "¡Gran partida de dibujo e intuición con tus amigos!"
            : "¡Excelente trabajo en equipo! Todas las palabras han sido resueltas."}
        </p>

        {/* Tarjeta del Ganador / MVP */}
        {winner && (
          <div className="my-5 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/15 to-amber-500/10 border border-amber-500/30">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1 flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Ganador de la Partida (MVP)
            </div>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl">{winner.avatar}</span>
              <div className="text-left">
                <div className="text-base font-extrabold text-white">{winner.nickname}</div>
                <div className="text-xs text-amber-300 font-mono font-bold">
                  {winner.score} puntos {winner.wordsFound ? `• ${winner.wordsFound} palabras` : ""}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resumen de estadísticas */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            <div className="text-slate-400 text-xs flex items-center justify-center gap-1 mb-1">
              <Clock className="w-3.5 h-3.5" /> Tiempo Total
            </div>
            <div className="text-lg font-mono font-bold text-slate-100">
              {formatTime(totalTimeSec)}
            </div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            <div className="text-slate-400 text-xs flex items-center justify-center gap-1 mb-1">
              <Award className="w-3.5 h-3.5" /> Modo Jugado
            </div>
            <div className="text-lg font-mono font-bold text-indigo-400">
              {isPictionary ? "Doodle Party" : "Crucigrama"}
            </div>
          </div>
        </div>

        {/* Podio / Tabla Final de Jugadores */}
        <div className="space-y-2 mb-6 text-left max-h-40 overflow-y-auto pr-1">
          {sortedPlayers.map((p, idx) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-400 w-4">
                  {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                </span>
                <span>{p.avatar}</span>
                <span className="font-semibold text-slate-200">{p.nickname}</span>
              </div>
              <span className="font-mono font-bold text-amber-400">{p.score} pts</span>
            </div>
          ))}
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={onLeaveRoom}
            className="w-full sm:w-1/3 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition active:scale-95 cursor-pointer"
          >
            Salir al Menú
          </button>
          {isHost ? (
            <button
              type="button"
              onClick={onReturnToLobby || onPlayAgain}
              className="w-full sm:w-2/3 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs sm:text-sm font-black shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <span>🛋️ Votar Siguiente Juego en Sala</span>
            </button>
          ) : (
            <div className="w-full sm:w-2/3 py-3 px-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-400 text-xs text-center font-medium">
              Esperando a que el anfitrión elija la sala de votación...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
