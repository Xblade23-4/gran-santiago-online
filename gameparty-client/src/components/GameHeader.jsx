// client/src/components/GameHeader.jsx
import React, { useState, useEffect } from "react";
import { 
  Copy, Check, Volume2, VolumeX, Lightbulb, Clock, 
  LogOut, RefreshCw, Share2, Sparkles 
} from "lucide-react";
import { sound } from "../utils/sound";

export default function GameHeader({
  room,
  player,
  onRequestHint,
  onRestartGame,
  onReturnToLobby,
  onLeaveRoom,
  activeCell
}) {
  const [copied, setCopied] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(sound.enabled);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Temporizador de partida
  useEffect(() => {
    if (!room?.startTime || room?.status === "completed") return;

    const interval = setInterval(() => {
      const now = Date.now();
      const sec = Math.floor((now - room.startTime) / 1000);
      setElapsedSeconds(sec);
    }, 1000);

    return () => clearInterval(interval);
  }, [room?.startTime, room?.status]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const copyInviteLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${room.code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      // Fallback
      navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const toggleSound = () => {
    sound.enabled = !sound.enabled;
    setSoundEnabled(sound.enabled);
  };

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Izquierda: Info de la Sala y Título */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧩</span>
            <div>
              <h1 className="text-base font-bold text-slate-100 flex items-center gap-2 leading-tight">
                {room.puzzle.title}
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium border border-slate-700">
                  {room.puzzle.difficulty}
                </span>
                <span>•</span>
                <span className="text-indigo-400 font-medium">{room.puzzle.category}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Centro: Cronómetro y Código de Sala */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Temporizador */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 font-mono text-sm font-semibold shadow-inner">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>

          {/* Botón Compartir / Copiar Código */}
          <button
            type="button"
            onClick={copyInviteLink}
            title="Copiar enlace de invitación"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/40 text-indigo-300 hover:text-indigo-200 text-xs font-semibold transition active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-bold">¡Enlace Copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-indigo-400" />
                <span>Sala: <strong className="font-mono text-white tracking-wider">{room.code}</strong></span>
              </>
            )}
          </button>
        </div>

        {/* Derecha: Acciones (Pistas, Sonido, Salir) */}
        <div className="flex items-center gap-2">
          {/* Botón Pedir Pista */}
          <button
            type="button"
            onClick={onRequestHint}
            disabled={!activeCell}
            title="Revelar letra seleccionada (-20 puntos)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Pista</span>
            <span className="text-[10px] text-amber-400/80">(-20)</span>
          </button>

          {/* Volver a la Sala de Espera / Cambiar Juego (Host) */}
          {player?.isHost && onReturnToLobby && (
            <button
              type="button"
              onClick={onReturnToLobby}
              title="Volver a la sala de espera para votar otro juego"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-indigo-200 text-xs font-semibold transition active:scale-95 cursor-pointer"
            >
              <span>🛋️ Cambiar Juego</span>
            </button>
          )}

          {/* Siguiente Crucigrama (Host o Jugador) */}
          {player?.isHost && (
            <button
              type="button"
              onClick={onRestartGame}
              title="Cargar nuevo crucigrama"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Nuevo Crucigrama</span>
            </button>
          )}

          {/* Toggle Sonido */}
          <button
            type="button"
            onClick={toggleSound}
            title={soundEnabled ? "Silenciar sonido" : "Activar sonido"}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition active:scale-95"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Salir */}
          <button
            type="button"
            onClick={onLeaveRoom}
            title="Salir al Lobby"
            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-200 transition active:scale-95"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
}
