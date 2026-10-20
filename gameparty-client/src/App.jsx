// client/src/App.jsx
import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import Lobby from "./components/Lobby";
import GameHeader from "./components/GameHeader";
import CrosswordBoard from "./components/CrosswordBoard";
import CluesPanel from "./components/CluesPanel";
import PlayersList from "./components/PlayersList";
import ChatReactions from "./components/ChatReactions";
import VictoryModal from "./components/VictoryModal";
import PictureClueCard from "./components/PictureClueCard";
import ImageLightboxModal from "./components/ImageLightboxModal";
import PictionaryGame from "./components/pictionary/PictionaryGame";
import WaitingRoom from "./components/WaitingRoom";
import { sound } from "./utils/sound";

// Determinar URL del servidor socket
const SOCKET_URL = window.location.port === "5173"
  ? "http://localhost:3000"
  : window.location.origin;

export default function App() {
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState(null);
  const [myPlayerId, setMyPlayerId] = useState(null);

  // Estado del cursor local para Crucigramas
  const [selectedCell, setSelectedCell] = useState(null);
  const [direction, setDirection] = useState("across");

  // Estado específico para Pictionary
  const [pictionaryState, setPictionaryState] = useState(null);
  const [wordOptions, setWordOptions] = useState([]);
  const [artistWord, setArtistWord] = useState(null);
  const [roundEndData, setRoundEndData] = useState(null);

  // Reacciones flotantes, zoom de imagen y notificaciones
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [showVictory, setShowVictory] = useState(false);
  const [defaultRoomCode, setDefaultRoomCode] = useState("");
  const [zoomModalClue, setZoomModalClue] = useState(null);

  // Referencia al socket para listeners
  const socketRef = useRef(null);

  // 1. Inicializar Socket y leer URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get("room");
    if (roomParam) {
      setDefaultRoomCode(roomParam.toUpperCase());
    }

    const newSocket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Conectado al servidor WebSocket con ID:", newSocket.id);
      setMyPlayerId(newSocket.id);
    });

    // Sincronización completa de sala
    newSocket.on("room-state", (roomData) => {
      setRoom(roomData);
      if (roomData.status === "completed") {
        setShowVictory(true);
      } else {
        setShowVictory(false);
      }

      // Inicializar selección en Crucigrama
      if (roomData.puzzle?.clues?.across?.[0]) {
        const first = roomData.puzzle.clues.across[0];
        setSelectedCell({ row: first.row, col: first.col });
        setDirection("across");
      }
    });

    // Sincronización de Crucigrama
    newSocket.on("cell-updated", ({ row, col, cell, players, solvedClues }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        const newBoardState = prev.boardState.map((r) => [...r]);
        newBoardState[row][col] = cell;
        return {
          ...prev,
          boardState: newBoardState,
          players: players || prev.players,
          solvedClues: solvedClues || prev.solvedClues
        };
      });
    });

    newSocket.on("player-cursor", ({ playerId, cursor }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.map((p) =>
            p.id === playerId ? { ...p, cursor } : p
          )
        };
      });
    });

    newSocket.on("words-solved", ({ words, players }) => {
      sound.playWordCorrect();
      setRoom((prev) => {
        if (!prev) return prev;
        return { ...prev, players: players || prev.players };
      });
    });

    // Sincronización de Pictionary
    newSocket.on("pictionary-state", (state) => {
      setPictionaryState(state);
      if (state.status === "drawing") {
        setRoundEndData(null);
      }
    });

    newSocket.on("pictionary-timer", ({ timeLeft }) => {
      setPictionaryState((prev) => prev ? { ...prev, timeLeft } : prev);
    });

    newSocket.on("pictionary-word-options", ({ options, timeLeft }) => {
      setWordOptions(options);
    });

    newSocket.on("pictionary-artist-word", ({ word, category }) => {
      setArtistWord({ word, category });
      setWordOptions([]);
    });

    newSocket.on("pictionary-new-stroke", (stroke) => {
      setPictionaryState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          strokes: [...(prev.strokes || []), stroke]
        };
      });
    });

    newSocket.on("pictionary-all-strokes", (strokes) => {
      setPictionaryState((prev) => prev ? { ...prev, strokes } : prev);
    });

    newSocket.on("pictionary-canvas-cleared", () => {
      setPictionaryState((prev) => prev ? { ...prev, strokes: [] } : prev);
    });

    newSocket.on("pictionary-player-guessed", ({ playerId, points, players }) => {
      sound.playWordCorrect();
      setPictionaryState((prev) => {
        if (!prev) return prev;
        const updatedGuessed = Array.from(new Set([...(prev.guessedPlayers || []), playerId]));
        return {
          ...prev,
          guessedPlayers: updatedGuessed,
          players: players || prev.players
        };
      });
      setRoom((prev) => prev ? { ...prev, players: players || prev.players } : prev);
    });

    newSocket.on("pictionary-round-ended", (data) => {
      sound.playHint();
      setRoundEndData(data);
      setRoom((prev) => prev ? { ...prev, players: data.players || prev.players } : prev);
      setTimeout(() => setRoundEndData(null), 5000);
    });

    // Fin de partida general
    newSocket.on("game-over", ({ players }) => {
      setRoom((prev) => (prev ? { ...prev, status: "completed", players } : prev));
      setShowVictory(true);
    });

    // Mensajes de chat
    newSocket.on("new-chat-message", (message) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          chatMessages: [...(prev.chatMessages || []), message]
        };
      });
    });

    // Reacción flotante
    newSocket.on("floating-reaction", (reaction) => {
      const newReact = { ...reaction, x: Math.random() * 60 + 20 };
      setFloatingReactions((prev) => [...prev, newReact]);
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== newReact.id));
      }, 2100);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // 2. Acciones del Juego
  const handleCreateRoom = (data, cb) => {
    if (!socket) return;
    socket.emit("create-room", data, (res) => {
      if (res?.success) {
        setRoom(res.room);
        window.history.pushState({}, "", `?room=${res.roomCode}`);
        if (cb) cb(null);
      } else {
        if (cb) cb(res?.error || "No se pudo crear la sala");
      }
    });
  };

  const handleJoinRoom = (data, cb) => {
    if (!socket) return;
    socket.emit("join-room", data, (res) => {
      if (res?.success) {
        setRoom(res.room);
        window.history.pushState({}, "", `?room=${res.roomCode}`);
        if (cb) cb(null);
      } else {
        if (cb) cb(res?.error || "No se pudo unir a la sala");
      }
    });
  };

  // Acciones Crucigrama
  const handleSelectCell = (row, col) => {
    setSelectedCell({ row, col });
    if (socket && room) {
      socket.emit("cursor-move", { row, col, direction });
    }
  };

  const handleDirectionChange = (newDir) => {
    setDirection(newDir);
    if (socket && room && selectedCell) {
      socket.emit("cursor-move", { ...selectedCell, direction: newDir });
    }
  };

  const handleLetterInput = (row, col, letter) => {
    if (!socket || !room) return;
    socket.emit("cell-update", { row, col, letter });
  };

  const handleSelectClue = (clue, dir) => {
    setDirection(dir);
    setSelectedCell({ row: clue.row, col: clue.col });
    if (socket && room) {
      socket.emit("cursor-move", { row: clue.row, col: clue.col, direction: dir });
    }
  };

  const handleRequestHint = () => {
    if (!socket || !room || !selectedCell) return;
    sound.playHint();
    socket.emit("request-hint", { row: selectedCell.row, col: selectedCell.col });
  };

  // Acciones Pictionary
  const handleSelectPictionaryWord = (word, category, difficulty) => {
    if (!socket) return;
    socket.emit("pictionary-choose-word", { word, category, difficulty });
  };

  const handlePictionaryStroke = (stroke) => {
    if (!socket) return;
    socket.emit("pictionary-draw-stroke", stroke);
  };

  const handlePictionaryClear = () => {
    if (!socket) return;
    socket.emit("pictionary-clear-canvas");
  };

  const handlePictionaryUndo = () => {
    if (!socket) return;
    socket.emit("pictionary-undo");
  };

  const handlePictionaryGuess = (text) => {
    if (!socket) return;
    socket.emit("pictionary-guess", { text });
  };

  // Acciones Compartidas
  const handleSendMessage = (text) => {
    if (!socket || !room) return;
    if (room.gameType === "pictionary") {
      socket.emit("pictionary-guess", { text });
    } else {
      socket.emit("chat-message", { text });
    }
  };

  const handleSendReaction = (emoji) => {
    if (!socket || !room) return;
    socket.emit("quick-reaction", { emoji });
  };

  const handleRestartGame = () => {
    if (!socket || !room) return;
    if (room.gameType === "pictionary") {
      socket.emit("pictionary-restart");
    } else {
      socket.emit("restart-game", {});
    }
  };

  const handleVoteGame = (gameType) => {
    if (!socket) return;
    socket.emit("vote-game", { gameType });
  };

  const handleStartGame = (options, cb) => {
    if (!socket) return;
    socket.emit("start-game", options, (res) => {
      if (res?.success) {
        if (cb) cb(null);
      } else {
        if (cb) cb(res?.error || "Error al iniciar la partida");
      }
    });
  };

  const handleReturnToLobby = () => {
    if (!socket) return;
    setShowVictory(false);
    socket.emit("return-to-lobby");
  };

  const handleLeaveRoom = () => {
    setRoom(null);
    setPictionaryState(null);
    setShowVictory(false);
    setSelectedCell(null);
    setZoomModalClue(null);
    window.history.pushState({}, "", window.location.pathname);
    if (socket) {
      socket.disconnect();
      socket.connect();
    }
  };

  // 3. Obtener la pista activa de Crucigrama (si aplica)
  const activeGridCell = selectedCell && room?.puzzle?.grid?.[selectedCell.row]?.[selectedCell.col];
  const activeClueNumber = activeGridCell
    ? direction === "across"
      ? activeGridCell.acrossClueNumber
      : activeGridCell.downClueNumber
    : null;

  const currentCluesList = room?.puzzle?.clues?.[direction] || [];
  const activeClue = activeClueNumber
    ? currentCluesList.find((c) => c.number === activeClueNumber)
    : currentCluesList[0] || null;

  const isCurrentClueSolved = activeClue
    ? room?.solvedClues?.[direction]?.includes(activeClue.number)
    : false;

  const handlePrevClue = () => {
    if (!currentCluesList.length) return;
    const currentIndex = currentCluesList.findIndex((c) => c.number === activeClue?.number);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : currentCluesList.length - 1;
    const prevClue = currentCluesList[prevIndex];
    handleSelectClue(prevClue, direction);
  };

  const handleNextClue = () => {
    if (!currentCluesList.length) return;
    const currentIndex = currentCluesList.findIndex((c) => c.number === activeClue?.number);
    const nextIndex = currentIndex < currentCluesList.length - 1 ? currentIndex + 1 : 0;
    const nextClue = currentCluesList[nextIndex];
    handleSelectClue(nextClue, direction);
  };

  const handleDirectionToggle = () => {
    if (!selectedCell) return;
    const cell = room?.puzzle?.grid?.[selectedCell.row]?.[selectedCell.col];
    if (!cell) return;

    if (direction === "across" && cell.downClueNumber) {
      handleDirectionChange("down");
    } else if (direction === "down" && cell.acrossClueNumber) {
      handleDirectionChange("across");
    } else {
      const otherDir = direction === "across" ? "down" : "across";
      const otherList = room?.puzzle?.clues?.[otherDir] || [];
      if (otherList.length > 0) {
        handleSelectClue(otherList[0], otherDir);
      }
    }
  };

  // 4. Vista del Lobby inicial si no hay sala activa
  if (!room) {
    return (
      <Lobby
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        defaultRoomCode={defaultRoomCode}
      />
    );
  }

  // 5. Vista de la Sala de Espera (Lobby previo a partida con votaciones y control del host)
  if (room.status === "lobby") {
    return (
      <WaitingRoom
        room={room}
        myPlayerId={myPlayerId}
        onVoteGame={handleVoteGame}
        onStartGame={handleStartGame}
        onLeaveRoom={handleLeaveRoom}
        onSendMessage={handleSendMessage}
      />
    );
  }

  const myPlayer = room.players?.find((p) => p.id === myPlayerId);
  const otherPlayers = room.players?.filter((p) => p.id !== myPlayerId) || [];

  // 6. Renderizar Modo Pictionary
  if (room.gameType === "pictionary") {
    return (
      <>
        <PictionaryGame
          room={room}
          pictionaryState={pictionaryState}
          myPlayerId={myPlayerId}
          wordOptions={wordOptions}
          artistWord={artistWord}
          roundEndData={roundEndData}
          onSelectWord={handleSelectPictionaryWord}
          onSendStroke={handlePictionaryStroke}
          onClearCanvas={handlePictionaryClear}
          onUndoStroke={handlePictionaryUndo}
          onSendGuess={handlePictionaryGuess}
          onLeaveRoom={handleLeaveRoom}
          onRestartGame={handleRestartGame}
          onReturnToLobby={handleReturnToLobby}
        />

        <ChatReactions
          messages={[]}
          floatingReactions={floatingReactions}
          onSendMessage={handleSendMessage}
          onSendReaction={handleSendReaction}
        />

        {showVictory && (
          <VictoryModal
            room={room}
            players={room.players}
            onPlayAgain={handleRestartGame}
            onReturnToLobby={handleReturnToLobby}
            onLeaveRoom={handleLeaveRoom}
            isHost={myPlayer?.isHost}
          />
        )}
      </>
    );
  }

  // 7. Renderizar Modo Crucigrama Master
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black relative">
      {/* Cabecera Superior */}
      <GameHeader
        room={room}
        player={myPlayer}
        onRequestHint={handleRequestHint}
        onRestartGame={handleRestartGame}
        onReturnToLobby={handleReturnToLobby}
        onLeaveRoom={handleLeaveRoom}
        activeCell={selectedCell}
      />

      {/* Cuerpo Principal del Crucigrama */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* Foto-Pista Destacada y Tablero */}
        <section className="lg:col-span-7 flex flex-col items-center bg-slate-900/50 backdrop-blur border border-slate-800/80 rounded-3xl p-3 sm:p-5 shadow-xl">
          <PictureClueCard
            clue={activeClue}
            isSolved={isCurrentClueSolved}
            onOpenZoom={() => setZoomModalClue(activeClue)}
            onPrevClue={handlePrevClue}
            onNextClue={handleNextClue}
            onDirectionToggle={handleDirectionToggle}
          />

          <CrosswordBoard
            room={room}
            playerId={myPlayerId}
            selectedCell={selectedCell}
            direction={direction}
            onSelectCell={handleSelectCell}
            onDirectionChange={handleDirectionChange}
            onLetterInput={handleLetterInput}
            otherPlayers={otherPlayers}
          />
        </section>

        {/* Pistas con Fotos y Marcador */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          <PlayersList
            players={room.players}
            myPlayerId={myPlayerId}
          />

          <CluesPanel
            clues={room.puzzle.clues}
            solvedClues={room.solvedClues}
            selectedCell={selectedCell}
            direction={direction}
            grid={room.puzzle.grid}
            onSelectClue={handleSelectClue}
            onOpenZoom={(clue) => setZoomModalClue(clue)}
          />
        </section>

      </main>

      {/* Chat y Reacciones Flotantes */}
      <ChatReactions
        messages={room.chatMessages}
        floatingReactions={floatingReactions}
        onSendMessage={handleSendMessage}
        onSendReaction={handleSendReaction}
      />

      {/* Lightbox de Fotografía */}
      <ImageLightboxModal
        clue={zoomModalClue}
        isOpen={Boolean(zoomModalClue)}
        onClose={() => setZoomModalClue(null)}
        onRequestHint={handleRequestHint}
      />

      {/* Modal de Victoria */}
      {showVictory && (
        <VictoryModal
          room={room}
          players={room.players}
          onPlayAgain={handleRestartGame}
          onReturnToLobby={handleReturnToLobby}
          onLeaveRoom={handleLeaveRoom}
          isHost={myPlayer?.isHost}
        />
      )}
    </div>
  );
}
