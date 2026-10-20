// client/src/components/pictionary/PictionaryGame.jsx
import React, { useState, useRef, useEffect } from "react";
import { 
  Palette, Clock, Trophy, Send, Share2, Check, LogOut, 
  Crown, CheckCircle2, RotateCcw, Sparkles, AlertCircle 
} from "lucide-react";
import PictionaryCanvas from "./PictionaryCanvas";
import WordSelectionModal from "./WordSelectionModal";
import { sound } from "../../utils/sound";

export default function PictionaryGame({
  room,
  pictionaryState,
  myPlayerId,
  wordOptions,
  artistWord,
  roundEndData,
  onSelectWord,
  onSendStroke,
  onClearCanvas,
  onUndoStroke,
  onSendGuess,
  onLeaveRoom,
  onRestartGame,
  onReturnToLobby
}) {
  const [guessInput, setGuessInput] = useState("");
  const [copied, setCopied] = useState(false);
  const chatEndRef = useRef(null);

  const myPlayer = room?.players?.find((p) => p.id === myPlayerId);
  const isHost = myPlayer?.isHost;
  const artist = pictionaryState?.artist;
  const isArtist = artist?.id === myPlayerId;
  const hasGuessed = pictionaryState?.guessedPlayers?.includes(myPlayerId);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [room?.chatMessages]);

  const handleGuessSubmit = (e) => {
    e.preventDefault();
    if (!guessInput.trim() || isArtist || hasGuessed) return;
    onSendGuess(guessInput.trim());
    setGuessInput("");
  };

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

  const sortedPlayers = [...(room?.players || [])].sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 relative">
      {/* 1. Barra Superior del Juego */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Izquierda: Info de Pictionary */}
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🎨</span>
            <div>
              <h1 className="text-sm sm:text-base font-black text-slate-100 flex items-center gap-1.5 leading-tight">
                Doodle Party
              </h1>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                <span className="px-2 py-0.2 rounded-full bg-slate-800 text-amber-300 font-bold border border-slate-700">
                  Ronda {pictionaryState?.currentRound || 1}/{pictionaryState?.totalRounds || 3}
                </span>
                {pictionaryState?.currentCategory && (
                  <>
                    <span>•</span>
                    <span className="text-indigo-400 font-medium">{pictionaryState.currentCategory}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Centro: Palabra Oculta / Indicador del Dibujante */}
          <div className="flex flex-col items-center">
            {isArtist ? (
              <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 shadow">
                <Palette className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Estás dibujando:</span>
                <span className="font-black text-sm sm:text-base tracking-widest text-white underline decoration-amber-400 decoration-2">
                  {artistWord?.word || pictionaryState?.currentWord || "..."}
                </span>
              </div>
            ) : hasGuessed ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>¡Acertaste la palabra! Espera a tus amigos</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="text-xl sm:text-2xl font-mono font-black tracking-[0.35em] text-white select-none">
                  {pictionaryState?.hiddenWord || "_ _ _ _"}
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {pictionaryState?.wordLength || 0} letras • Dibuja: <strong className="text-slate-200">{artist?.nickname || "..."}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Derecha: Cronómetro, Enlace y Salir */}
          <div className="flex items-center gap-2">
            {/* Temporizador */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-sm font-black shadow-inner ${
              (pictionaryState?.timeLeft || 0) <= 15
                ? "bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse"
                : "bg-slate-950/80 border-slate-800 text-amber-400"
            }`}>
              <Clock className="w-4 h-4 text-amber-400" />
              <span>{pictionaryState?.timeLeft ?? 0}s</span>
            </div>

            {/* Compartir */}
            <button
              type="button"
              onClick={copyInviteLink}
              title="Copiar enlace de invitación"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/40 text-indigo-300 text-xs font-semibold transition active:scale-95 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline font-mono font-bold text-white">{room.code}</span>
            </button>

            {/* Cambiar de Juego / Volver a Sala de Espera (Host) */}
            {isHost && onReturnToLobby && (
              <button
                type="button"
                onClick={onReturnToLobby}
                title="Volver a la sala de espera para votar otro juego"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-semibold transition active:scale-95 cursor-pointer"
              >
                <span>🛋️ Cambiar Juego</span>
              </button>
            )}

            {/* Salir */}
            <button
              type="button"
              onClick={onLeaveRoom}
              title="Salir al Lobby"
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition active:scale-95 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* 2. Cuerpo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* Columna Izquierda: Lienzo de Dibujo (8 columnas en LG) */}
        <section className="lg:col-span-8 flex flex-col items-center bg-slate-900/50 backdrop-blur border border-slate-800/80 rounded-3xl p-3 sm:p-4 shadow-xl">
          <PictionaryCanvas
            isArtist={isArtist && pictionaryState?.status === "drawing"}
            strokes={pictionaryState?.strokes || []}
            onSendStroke={onSendStroke}
            onClearCanvas={onClearCanvas}
            onUndoStroke={onUndoStroke}
          />
        </section>

        {/* Columna Derecha: Marcador y Chat de Adivinanzas (4 columnas en LG) */}
        <section className="lg:col-span-4 flex flex-col gap-3">
          
          {/* Marcador de Jugadores */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 shadow-lg">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2 pb-1.5 border-b border-slate-800">
              <span className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" /> Marcador
              </span>
              <span className="text-[10px] text-slate-400">{room.players.length} amigos</span>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {sortedPlayers.map((player) => {
                const isCurrentArtist = player.id === artist?.id;
                const playerGuessed = pictionaryState?.guessedPlayers?.includes(player.id);
                const isMe = player.id === myPlayerId;

                return (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs border ${
                      isCurrentArtist
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
                        : playerGuessed
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                        : "bg-slate-900/60 border-slate-800 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span>{player.avatar}</span>
                      <span className="font-bold truncate">
                        {player.nickname} {isMe && "(Tú)"}
                      </span>
                      {isCurrentArtist && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded-md font-bold flex items-center gap-1">
                          <Palette className="w-2.5 h-2.5" /> Dibuja
                        </span>
                      )}
                      {playerGuessed && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-md font-bold flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> Acertó
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-bold text-amber-400 shrink-0">
                      {player.score || 0} pts
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat de Adivinanzas */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 shadow-lg flex flex-col h-[340px] sm:h-[380px]">
            <div className="text-xs font-bold text-slate-300 mb-2 pb-1.5 border-b border-slate-800">
              Adivina la palabra en el chat:
            </div>

            {/* Mensajes del chat */}
            <div className="flex-1 overflow-y-auto space-y-1.5 text-xs pr-1">
              {room.chatMessages?.map((msg) => {
                if (msg.isSuccess) {
                  return (
                    <div key={msg.id} className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-center text-[11px] shadow-sm animate-bounce">
                      {msg.text}
                    </div>
                  );
                }
                if (msg.isSystem) {
                  return (
                    <div key={msg.id} className="text-center my-1">
                      <span className="px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 text-[10px] inline-block">
                        {msg.text}
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className="flex items-start gap-1.5">
                    <span className="text-xs">{msg.avatar || "👤"}</span>
                    <div className="min-w-0">
                      <span style={{ color: msg.color?.hex || "#94a3b8" }} className="font-bold text-[10px]">
                        {msg.sender}:
                      </span>
                      <span className="text-slate-200 ml-1.5 break-words font-medium">
                        {msg.text}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Input de Adivinanza */}
            <form onSubmit={handleGuessSubmit} className="mt-2 pt-2 border-t border-slate-800 flex gap-1.5">
              <input
                type="text"
                maxLength={40}
                disabled={isArtist || hasGuessed}
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                placeholder={
                  isArtist
                    ? "Eres el dibujante..."
                    : hasGuessed
                    ? "¡Ya adivinaste la palabra!"
                    : "Escribe tu respuesta..."
                }
                className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!guessInput.trim() || isArtist || hasGuessed}
                className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </section>

      </main>

      {/* 3. Modal de Selección de Palabra para el Artista */}
      {pictionaryState?.status === "word_selection" && isArtist && (
        <WordSelectionModal
          options={wordOptions}
          timeLeft={pictionaryState?.timeLeft || 15}
          onSelectWord={onSelectWord}
        />
      )}

      {/* 4. Overlay de Fin de Ronda */}
      {roundEndData && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 text-center shadow-2xl">
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="text-lg font-bold text-slate-300">
              {roundEndData.reason || "¡Ronda finalizada!"}
            </h3>
            <div className="my-3">
              <span className="text-xs text-slate-400">La palabra secreta era:</span>
              <div className="text-2xl font-black text-amber-400 tracking-wider mt-1">
                {roundEndData.word}
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Siguiente dibujante: <strong className="text-white">{roundEndData.nextArtist}</strong>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
