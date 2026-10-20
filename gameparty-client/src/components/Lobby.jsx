// client/src/components/Lobby.jsx
import React, { useState, useEffect } from "react";
import { 
  Users, Sparkles, Trophy, ArrowRight, Dice5, ShieldCheck, Image as ImageIcon, Palette
} from "lucide-react";

const AVATARS = ["🦊", "🐼", "🦁", "🦉", "🐙", "🐸", "🦄", "🚀", "🎮", "🧠", "⭐", "⚡"];

const RANDOM_NAMES = [
  "CazadorDeLetras", "Palabrista", "Acróstico", "EnigmaMaster", 
  "Lexicón", "ElCrucigramista", "BuscadorDePistas", "LetraViva",
  "MenteÁgil", "VórticeVerbal", "ElDescifrador", "PincelVeloz"
];

export default function Lobby({ onCreateRoom, onJoinRoom, defaultRoomCode = "" }) {
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [activeTab, setActiveTab] = useState(defaultRoomCode ? "join" : "create");
  
  // Preferencia inicial opcional
  const [preferredGame, setPreferredGame] = useState("crossword");

  // Código para unirse
  const [roomCode, setRoomCode] = useState(defaultRoomCode);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!nickname) {
      const randomNick = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
      setNickname(randomNick);
      setAvatar(AVATARS[Math.floor(Math.random() * AVATARS.length)]);
    }
  }, []);

  useEffect(() => {
    if (defaultRoomCode) {
      setRoomCode(defaultRoomCode.toUpperCase());
      setActiveTab("join");
    }
  }, [defaultRoomCode]);

  const rollRandomNickname = () => {
    const randomNick = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    setNickname(randomNick);
    setAvatar(AVATARS[Math.floor(Math.random() * AVATARS.length)]);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setErrorMsg("Por favor, ingresa tu apodo.");
      return;
    }
    setErrorMsg("");
    setLoading(true);
    onCreateRoom({
      nickname: nickname.trim(),
      avatar,
      gameType: preferredGame
    }, (err) => {
      setLoading(false);
      if (err) setErrorMsg(err);
    });
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setErrorMsg("Por favor, ingresa tu apodo.");
      return;
    }
    if (!roomCode.trim()) {
      setErrorMsg("Ingresa el código de la sala.");
      return;
    }
    setErrorMsg("");
    setLoading(true);
    onJoinRoom({
      roomCode: roomCode.trim().toUpperCase(),
      nickname: nickname.trim(),
      avatar
    }, (err) => {
      setLoading(false);
      if (err) setErrorMsg(err);
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Luces decorativas */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Contenedor Principal */}
      <div className="relative w-full max-w-xl z-10">
        
        {/* Cabecera / Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="mb-3">
            <a
              href="/"
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-300 text-xs font-bold transition shadow-md"
            >
              🚇 Volver a Gran Santiago &amp; ¿Cuál es?
            </a>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-indigo-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2.5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Juegos Multijugador en Directo
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-amber-200 to-indigo-300 bg-clip-text text-transparent">
            GameParty Web 🎮
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-2 max-w-md mx-auto">
            Crea tu sala, vota con tus amigos y compite en Crucigramas con fotos o Pictionary en tiempo real.
          </p>
        </div>

        {/* Tarjeta de Configuración */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-2xl p-5 sm:p-7">
          
          {/* Perfil del Jugador */}
          <div className="mb-5 p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50">
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
              Tu Perfil de Jugador
            </label>
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-400/50">
                {avatar}
              </div>

              {/* Input Nickname */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  maxLength={18}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Tu apodo..."
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium text-sm"
                />
              </div>

              {/* Botón Aleatorio */}
              <button
                type="button"
                onClick={rollRandomNickname}
                title="Nombre y avatar aleatorios"
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition active:scale-95 cursor-pointer"
              >
                <Dice5 className="w-5 h-5" />
              </button>
            </div>

            {/* Selector rápido de avatares */}
            <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1">
              {AVATARS.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setAvatar(av)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-base transition cursor-pointer ${
                    avatar === av 
                      ? "bg-indigo-600 ring-2 ring-indigo-400 scale-110" 
                      : "hover:bg-slate-700/60 bg-slate-800/40"
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Selector de Pestañas: Crear vs Unirse */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/60 rounded-xl border border-slate-800 mb-5">
            <button
              type="button"
              onClick={() => setActiveTab("create")}
              className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "create"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-4 h-4" /> Crear Sala
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("join")}
              className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "join"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Users className="w-4 h-4" /> Unirse con Código
            </button>
          </div>

          {/* Mensaje de error si ocurre */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              {errorMsg}
            </div>
          )}

          {/* TAB 1: CREAR SALA */}
          {activeTab === "create" && (
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Tu Sala de Espera privada con votaciones</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Al crear la sala se generará un código único para que compartas con tus amigos. Todos los que entren podrán votar entre <strong>Crucigrama Party</strong> y <strong>Doodle Party</strong>. Como dueño de la sala, tú tendrás la última palabra para iniciar la partida.
                </p>

                {/* Previsualización rápida de tu voto inicial */}
                <div className="pt-2 border-t border-indigo-500/20">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Tu primer voto sugerido:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPreferredGame("crossword")}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        preferredGame === "crossword"
                          ? "bg-indigo-600 border-indigo-400 text-white shadow-sm"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span>🧩 Crucigrama</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreferredGame("pictionary")}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        preferredGame === "pictionary"
                          ? "bg-amber-500 border-amber-400 text-slate-950 shadow-sm"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span>🎨 Doodle Party</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Botón de crear sala */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50 mt-3 cursor-pointer"
              >
                {loading ? "Creando sala..." : (
                  <>
                    Crear Sala de Espera <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: UNIRSE A SALA */}
          {activeTab === "join" && (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Código de Sala (5 letras)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="Ej: ABCDE"
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-2xl px-4 py-3 text-center text-2xl font-mono tracking-widest text-amber-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 uppercase font-black"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2 text-center">
                  Introduce el código de 5 caracteres que te compartió tu amigo.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50 mt-4 cursor-pointer"
              >
                {loading ? "Entrando a la sala..." : (
                  <>
                    Unirse a la Sala de Espera <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}

        </div>

        {/* Footer badges */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" /> Votaciones en vivo
          </div>
          <div className="flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-indigo-400" /> Fotos HD
          </div>
          <div className="flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-amber-400" /> Lienzo de Dibujo
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Sin descargas
          </div>
        </div>

      </div>
    </div>
  );
}
