// client/src/components/WaitingRoom.jsx
import React, { useState } from "react";
import { 
  Users, Crown, Share2, Check, Sparkles, Trophy, 
  ArrowRight, CheckCircle2, MessageSquare, Send, Globe, Film, Trees, Compass, Cpu, LogOut
} from "lucide-react";

const CATEGORIES = [
  { id: "todo_tipo", name: "🎲 De Todo Tipo (15x15)", icon: Sparkles, desc: "Ciencia, historia, arte, objetos y pistas online" },
  { id: "general", name: "Cultura General", icon: Globe, desc: "Historia, arte y curiosidades" },
  { id: "ciencia", name: "Ciencia y Espacio", icon: Cpu, desc: "Astronomía, física y tecnología" },
  { id: "animales", name: "Animales y Fauna", icon: Trees, desc: "Fauna salvaje y marina" },
  { id: "geografia", name: "Viajes y Geografía", icon: Compass, desc: "Países, capitales y maravillas" },
  { id: "arte", name: "Arte y Música", icon: Film, desc: "Pintura, música y cine" }
];

export default function WaitingRoom({
  room,
  myPlayerId,
  onVoteGame,
  onStartGame,
  onLeaveRoom,
  onSendMessage
}) {
  const [copied, setCopied] = useState(false);
  const [chatInput, setChatInput] = useState("");
  
  // Opciones configurables por el anfitrión
  const [selectedGameOverride, setSelectedGameOverride] = useState(null);
  const [category, setCategory] = useState(room.settings?.category || "todo_tipo");
  const [difficulty, setDifficulty] = useState(room.settings?.difficulty || "Fácil");
  const [loading, setLoading] = useState(false);

  const myPlayer = room.players?.find((p) => p.id === myPlayerId);
  const isHost = myPlayer?.isHost;
  const hostPlayer = room.players?.find((p) => p.isHost);

  // Calcular votos
  const votes = room.votes || {};
  let crosswordVotes = 0;
  let pictionaryVotes = 0;
  const crosswordVoters = [];
  const pictionaryVoters = [];

  for (const player of room.players || []) {
    const vote = votes[player.id];
    if (vote === "crossword") {
      crosswordVotes++;
      crosswordVoters.push(player);
    } else if (vote === "pictionary") {
      pictionaryVotes++;
      pictionaryVoters.push(player);
    }
  }

  const totalVotes = crosswordVotes + pictionaryVotes;
  const mostVotedGame = pictionaryVotes > crosswordVotes ? "pictionary" : "crossword";
  const currentGameSelection = selectedGameOverride || mostVotedGame;
  const myVote = votes[myPlayerId];

  const copyInviteLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${room.code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleStart = () => {
    setLoading(true);
    onStartGame({
      gameType: currentGameSelection,
      category,
      difficulty
    }, (err) => {
      setLoading(false);
      if (err) alert(err);
    });
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput.trim());
    setChatInput("");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-3 sm:p-6 selection:bg-amber-500 selection:text-slate-950 relative overflow-x-hidden">
      {/* Luces de fondo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Barra Superior de la Sala */}
      <div className="w-full max-w-5xl flex items-center justify-between gap-3 mb-6 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl z-10">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛋️</span>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Sala de Espera
            </div>
            <h1 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              Código: <span className="font-mono text-amber-300 tracking-widest">{room.code}</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón copiar enlace */}
          <button
            type="button"
            onClick={copyInviteLink}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold transition active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">¡Enlace Copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-indigo-400" />
                <span>Invitar Amigos</span>
              </>
            )}
          </button>

          {/* Salir */}
          <button
            type="button"
            onClick={onLeaveRoom}
            title="Salir de la sala"
            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition active:scale-95"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contenido Principal de la Sala de Espera */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-5 z-10 items-start">
        
        {/* Columna Izquierda: Votación de Juegos y Control de Partida (8 columnas) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          
          {/* Tarjeta de Votación */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <span>Votad por el juego que queréis jugar</span>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cada jugador puede votar. El dueño de la sala decidirá cuándo iniciar.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/30">
                {totalVotes} votos emitidos
              </span>
            </div>

            {/* Opciones de Votación */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* OPCIÓN 1: Crucigrama Party */}
              <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                myVote === "crossword"
                  ? "bg-indigo-950/40 border-indigo-500 shadow-md ring-2 ring-indigo-500/50"
                  : "bg-slate-950/60 border-slate-800"
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl">🧩</span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {crosswordVotes} {crosswordVotes === 1 ? "voto" : "votos"}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-white">Crucigrama Party</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-snug">
                    Resuelve crucigramas con foto-pistas en alta calidad colaborando en directo con amigos.
                  </p>
                </div>

                {/* Avatares de votantes */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {crosswordVoters.map(v => (
                      <span key={v.id} title={v.nickname} className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs shadow">
                        {v.avatar}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => onVoteGame("crossword")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer ${
                      myVote === "crossword"
                        ? "bg-indigo-600 text-white shadow"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                    }`}
                  >
                    {myVote === "crossword" ? "✓ Has votado" : "Votar este"}
                  </button>
                </div>
              </div>

              {/* OPCIÓN 2: Doodle Party (Dibuja y Adivina) */}
              <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                myVote === "pictionary"
                  ? "bg-amber-950/40 border-amber-400 shadow-md ring-2 ring-amber-400/50"
                  : "bg-slate-950/60 border-slate-800"
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl">🎨</span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {pictionaryVotes} {pictionaryVotes === 1 ? "voto" : "votos"}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-white">Doodle Party</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-snug">
                    Por turnos, uno dibuja en el lienzo en vivo con colores y los demás adivinan la palabra en el chat.
                  </p>
                </div>

                {/* Avatares de votantes */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {pictionaryVoters.map(v => (
                      <span key={v.id} title={v.nickname} className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs shadow">
                        {v.avatar}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => onVoteGame("pictionary")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer ${
                      myVote === "pictionary"
                        ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                    }`}
                  >
                    {myVote === "pictionary" ? "✓ Has votado" : "Votar este"}
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Panel de Control del Anfitrión / Estado de Espera */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl">
            {isHost ? (
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>Control del Dueño de la Sala (Anfitrión)</span>
                </div>
                <h3 className="text-lg font-extrabold text-white">
                  Tú decides el juego final y cuándo comenzar
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 mb-4">
                  Juego actualmente seleccionado: <strong className="text-white uppercase">{currentGameSelection === "pictionary" ? "Doodle Party 🎨" : "Crucigrama Party 🧩"}</strong>
                </p>

                {/* Selector de Juego manual por el Host si desea anular votos */}
                <div className="flex items-center gap-2 mb-4 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedGameOverride("crossword")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                      currentGameSelection === "crossword"
                        ? "bg-indigo-600 text-white shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    🧩 Crucigrama
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedGameOverride("pictionary")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                      currentGameSelection === "pictionary"
                        ? "bg-amber-500 text-slate-950 font-black shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    🎨 Doodle Party
                  </button>
                </div>

                {/* Opciones específicas de Crucigrama */}
                {currentGameSelection === "crossword" && (
                  <div className="space-y-3 mb-5 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1.5">
                        Temática del Crucigrama:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {CATEGORIES.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setCategory(c.id)}
                            className={`p-2 rounded-xl text-left border text-xs transition ${
                              category === c.id
                                ? "bg-indigo-600/30 border-indigo-400 text-white font-bold"
                                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                            }`}
                          >
                            <div className="truncate">{c.name}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1.5">
                        Dificultad:
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {["Fácil", "Medio", "Difícil"].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setDifficulty(d)}
                            className={`py-1.5 text-xs font-bold rounded-xl border transition ${
                              difficulty === d
                                ? "bg-amber-500 text-slate-950 font-black border-amber-400"
                                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Botón de Inicio */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleStart}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-base shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>{loading ? "Iniciando partida..." : `¡Iniciar Partida: ${currentGameSelection === "pictionary" ? "Doodle Party" : "Crucigrama"}!`}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto mb-3 animate-pulse">
                  <Crown className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  Esperando a que {hostPlayer?.nickname || "el anfitrión"} inicie la partida
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  El dueño de la sala tiene la palabra final y dará comienzo cuando todos estén listos. ¡Puedes seguir votando o charlando en el chat!
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Columna Derecha: Amigos Conectados y Chat (4 columnas) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Lista de Jugadores */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Jugadores en la sala ({room.players?.length || 0})</span>
              </div>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {room.players?.map((p) => {
                const playerVote = votes[p.id];
                const isMe = p.id === myPlayerId;

                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950/50 border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative">
                        <span className="text-xl">{p.avatar}</span>
                        {p.isHost && (
                          <span title="Dueño de la sala" className="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-950 p-0.5 rounded-full shadow">
                            <Crown className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate flex items-center gap-1">
                          {p.nickname} {isMe && <span className="text-[10px] text-indigo-400 font-normal">(Tú)</span>}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {p.isHost ? "Anfitrión" : "Amigo"}
                        </div>
                      </div>
                    </div>

                    {/* Voto del jugador */}
                    <div className="shrink-0">
                      {playerVote === "crossword" ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                          🧩 Crucigrama
                        </span>
                      ) : playerVote === "pictionary" ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                          🎨 Doodle Party
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">
                          Sin votar
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat de la Sala de Espera */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col h-[280px]">
            <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-slate-800 text-xs font-bold text-slate-300">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span>Chat de la sala</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 text-xs pr-1">
              {room.chatMessages?.map((msg) => (
                <div key={msg.id} className="flex items-start gap-1.5">
                  <div className="min-w-0">
                    <span style={{ color: msg.color?.hex || "#a855f7" }} className="font-bold text-[10px]">
                      {msg.sender}:
                    </span>
                    <span className="text-slate-200 ml-1.5 break-words">
                      {msg.text}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleChatSubmit} className="mt-2 pt-2 border-t border-slate-800 flex gap-1.5">
              <input
                type="text"
                maxLength={100}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Escribe algo a tus amigos..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition"
              >
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
