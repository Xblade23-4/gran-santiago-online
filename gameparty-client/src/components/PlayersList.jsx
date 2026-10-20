// client/src/components/PlayersList.jsx
import React from "react";
import { Trophy, Crown, Award } from "lucide-react";

export default function PlayersList({ players, myPlayerId }) {
  // Ordenar jugadores por puntuación descendente
  const sortedPlayers = [...(players || [])].sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Jugadores ({players?.length || 0})
          </h2>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">Marcador en vivo</span>
      </div>

      <div className="space-y-2">
        {sortedPlayers.map((player, index) => {
          const isMe = player.id === myPlayerId;
          const isFirst = index === 0 && player.score > 0;

          return (
            <div
              key={player.id}
              className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                isMe
                  ? "bg-indigo-950/40 border-indigo-500/50 shadow-sm"
                  : "bg-slate-900/60 border-slate-800/80"
              }`}
            >
              {/* Avatar, Posición y Nombre */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative">
                  <div
                    style={{ borderColor: player.color?.hex || "#6366f1" }}
                    className="w-9 h-9 rounded-xl bg-slate-800 border-2 flex items-center justify-center text-lg shadow-sm"
                  >
                    {player.avatar || "👤"}
                  </div>
                  {player.isHost && (
                    <span 
                      title="Anfitrión de la sala" 
                      className="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-950 p-0.5 rounded-full shadow"
                    >
                      <Crown className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                      {player.nickname}
                    </span>
                    {isMe && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                        Tú
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span>{player.wordsFound || 0} palabras</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <span 
                        className="w-1.5 h-1.5 rounded-full" 
                        style={{ backgroundColor: player.color?.hex || "#6366f1" }}
                      />
                      {player.color?.name || "Activo"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Puntuación */}
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 justify-end font-mono font-black text-sm text-amber-400">
                  {isFirst && <Award className="w-3.5 h-3.5 text-amber-400" />}
                  <span>{player.score || 0}</span>
                  <span className="text-[10px] text-slate-400 font-normal">pts</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
