// server/gameManager.js
const { createPuzzle, getCategories } = require("./crosswords/puzzles");
const { PictionaryRoom } = require("./pictionary/pictionaryManager");

const PLAYER_COLORS = [
  { name: "Cyan", hex: "#06b6d4", bg: "bg-cyan-500", text: "text-cyan-400", border: "border-cyan-500" },
  { name: "Rosa", hex: "#ec4899", bg: "bg-pink-500", text: "text-pink-400", border: "border-pink-500" },
  { name: "Esmeralda", hex: "#10b981", bg: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500" },
  { name: "Ámbar", hex: "#f59e0b", bg: "bg-amber-500", text: "text-amber-400", border: "border-amber-500" },
  { name: "Púrpura", hex: "#a855f7", bg: "bg-purple-500", text: "text-purple-400", border: "border-purple-500" },
  { name: "Naranja", hex: "#f97316", bg: "bg-orange-500", text: "text-orange-400", border: "border-orange-500" },
  { name: "Azul", hex: "#3b82f6", bg: "bg-blue-500", text: "text-blue-400", border: "border-blue-500" },
  { name: "Lima", hex: "#84cc16", bg: "bg-lime-500", text: "text-lime-400", border: "border-lime-500" }
];

const AVATARS = ["🦊", "🐼", "🦁", "🦉", "🐙", "🐸", "🦄", "🚀", "🎮", "🧠", "⭐", "⚡"];

class GameManager {
  constructor() {
    this.rooms = new Map(); // roomCode -> RoomData
    this.pictionaryRooms = new Map(); // roomCode -> PictionaryRoom
    this.io = null;
  }

  setIo(io) {
    this.io = io;
  }

  generateRoomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return this.rooms.has(code) ? this.generateRoomCode() : code;
  }

  createRoom({ hostSocketId, nickname, avatar }) {
    const code = this.generateRoomCode();
    const hostColor = PLAYER_COLORS[0];
    const hostPlayer = {
      id: hostSocketId,
      nickname: nickname || "Jugador 1",
      avatar: avatar || AVATARS[0],
      color: hostColor,
      score: 0,
      wordsFound: 0,
      isHost: true,
      cursor: { row: 0, col: 0, direction: "across" }
    };

    const room = {
      code,
      gameType: null, // se define al iniciar la partida
      hostId: hostSocketId,
      status: "lobby", // Inicia en la Sala de Espera
      selectedGame: "crossword",
      votes: {
        [hostSocketId]: "crossword"
      },
      settings: { category: "todo_tipo", difficulty: "Fácil", rounds: 3 },
      puzzle: null,
      boardState: null,
      solvedClues: {
        across: [],
        down: []
      },
      players: [hostPlayer],
      startTime: null,
      endTime: null,
      chatMessages: [
        {
          id: `msg-${Date.now()}`,
          sender: "Sistema",
          text: `¡Sala creada! Invita a tus amigos con el código: ${code}`,
          timestamp: Date.now(),
          isSystem: true
        }
      ]
    };

    this.rooms.set(code, room);
    return room;
  }

  voteGame(socketId, gameType) {
    const room = this.getRoomBySocketId(socketId);
    if (!room) return null;

    if (["crossword", "pictionary"].includes(gameType)) {
      room.votes = room.votes || {};
      room.votes[socketId] = gameType;
    }

    return { roomCode: room.code, room };
  }

  async startGame(socketId, options = {}) {
    const room = this.getRoomBySocketId(socketId);
    if (!room) return { error: "Sala no encontrada." };

    // Verificar que sea el anfitrión
    if (room.hostId !== socketId) {
      return { error: "Solo el dueño de la sala puede iniciar la partida." };
    }

    // Determinar juego más votado o seleccionado
    let crosswordVotes = 0;
    let pictionaryVotes = 0;
    for (const v of Object.values(room.votes || {})) {
      if (v === "crossword") crosswordVotes++;
      if (v === "pictionary") pictionaryVotes++;
    }
    const mostVotedGame = pictionaryVotes > crosswordVotes ? "pictionary" : "crossword";

    const chosenGame = options.gameType || room.selectedGame || mostVotedGame || "crossword";
    room.gameType = chosenGame;
    room.status = "playing";
    room.startTime = Date.now();
    room.endTime = null;

    const cat = options.category || room.settings.category || "todo_tipo";
    const diff = options.difficulty || room.settings.difficulty || "Fácil";
    room.settings = { ...room.settings, category: cat, difficulty: diff };

    // Resetear puntuaciones para la partida nueva
    for (const p of room.players) {
      p.score = 0;
      p.wordsFound = 0;
      p.cursor = { row: 0, col: 0, direction: "across" };
    }

    if (chosenGame === "crossword") {
      const puzzle = await createPuzzle({ category: cat, difficulty: diff });
      room.puzzle = puzzle;
      room.boardState = Array.from({ length: puzzle.rows }, (_, r) =>
        Array.from({ length: puzzle.cols }, (_, c) => {
          const gridCell = puzzle.grid[r][c];
          if (!gridCell || gridCell.type === "clue") return null;
          return {
            letter: "",
            locked: false,
            lastEditedBy: null
          };
        })
      );
      room.solvedClues = { across: [], down: [] };
    } else if (chosenGame === "pictionary") {
      room.puzzle = null;
      room.boardState = null;
      let pictionary = this.pictionaryRooms.get(room.code);
      if (!pictionary && this.io) {
        pictionary = new PictionaryRoom(room, this.io);
        this.pictionaryRooms.set(room.code, pictionary);
      }
      if (pictionary) {
        pictionary.restartGame();
      }
    }

    room.chatMessages.push({
      id: `msg-${Date.now()}`,
      sender: "Sistema",
      text: `🚀 ¡Partida iniciada! Juego: ${chosenGame === "pictionary" ? "Pictionary Party 🎨" : "Crucigrama Party 🧩"}`,
      timestamp: Date.now(),
      isSystem: true
    });

    return { roomCode: room.code, room, gameType: chosenGame };
  }

  returnToLobby(socketId) {
    const room = this.getRoomBySocketId(socketId);
    if (!room) return null;

    if (room.hostId !== socketId) {
      return { error: "Solo el anfitrión puede volver a la sala de espera." };
    }

    room.status = "lobby";
    room.endTime = null;

    const pictionary = this.pictionaryRooms.get(room.code);
    if (pictionary) {
      pictionary.clearTimer();
    }

    room.chatMessages.push({
      id: `msg-${Date.now()}`,
      sender: "Sistema",
      text: `🛋️ ¡Regresaron a la sala de espera! Podéis votar el siguiente juego.`,
      timestamp: Date.now(),
      isSystem: true
    });

    return { roomCode: room.code, room };
  }

  getPictionaryBySocketId(socketId) {
    const room = this.getRoomBySocketId(socketId);
    return room ? this.pictionaryRooms.get(room.code) : null;
  }

  getPictionaryByRoomCode(code) {
    return this.pictionaryRooms.get(code);
  }

  async startOrSyncUnifiedRoom({ code, gameType = "crossword", category = "todo_tipo", difficulty = "Fácil" }) {
    const cleanCode = code.toUpperCase().trim();
    const existingPictionary = this.pictionaryRooms.get(cleanCode);
    if (existingPictionary) {
      existingPictionary.clearTimer();
      this.pictionaryRooms.delete(cleanCode);
    }

    const room = {
      code: cleanCode,
      gameType,
      hostId: null,
      status: "playing",
      selectedGame: gameType,
      votes: {},
      settings: { category, difficulty, rounds: 3 },
      puzzle: null,
      boardState: null,
      solvedClues: { across: [], down: [] },
      players: [],
      startTime: Date.now(),
      endTime: null,
      chatMessages: [
        {
          id: `msg-${Date.now()}`,
          sender: "Sistema",
          text: `🚀 ¡Partida iniciada! Juego: ${gameType === "pictionary" ? "Doodle Party 🎨" : "Crucigrama Party 🧩"}`,
          timestamp: Date.now(),
          isSystem: true
        }
      ]
    };

    if (gameType === "crossword") {
      const puzzle = await createPuzzle({ category, difficulty });
      room.puzzle = puzzle;
      room.boardState = Array.from({ length: puzzle.rows }, (_, r) =>
        Array.from({ length: puzzle.cols }, (_, c) => {
          const gridCell = puzzle.grid[r][c];
          if (!gridCell || gridCell.type === "clue") return null;
          return { letter: "", locked: false, lastEditedBy: null };
        })
      );
    } else if (gameType === "pictionary" && this.io) {
      const pictionary = new PictionaryRoom(room, this.io);
      this.pictionaryRooms.set(cleanCode, pictionary);
    }

    this.rooms.set(cleanCode, room);
    return room;
  }

  joinRoom({ roomCode, socketId, nickname, avatar, isHost }) {
    const code = (roomCode || "").toUpperCase().trim();
    const room = this.rooms.get(code);

    if (!room) {
      return { error: "La sala no existe o el código es incorrecto." };
    }

    // Comprobar si el jugador ya está en la sala (reconexión)
    const existingIndex = room.players.findIndex(p => p.id === socketId);
    if (existingIndex !== -1) {
      return { room };
    }

    const colorIndex = room.players.length % PLAYER_COLORS.length;
    const playerColor = PLAYER_COLORS[colorIndex];
    const playerAvatar = avatar || AVATARS[room.players.length % AVATARS.length];
    const makeHost = Boolean(isHost) || room.players.length === 0 || !room.hostId;

    if (makeHost) {
      room.hostId = socketId;
      room.players.forEach((p) => { p.isHost = false; });
    }

    const newPlayer = {
      id: socketId,
      nickname: nickname || `Amigo ${room.players.length + 1}`,
      avatar: playerAvatar,
      color: playerColor,
      score: 0,
      wordsFound: 0,
      isHost: makeHost,
      cursor: { row: 0, col: 0, direction: "across" }
    };

    room.players.push(newPlayer);
    room.votes = room.votes || {};
    if (!room.votes[socketId]) {
      room.votes[socketId] = "crossword";
    }

    // Si es Pictionary y estaba esperando que entraran los jugadores del lobby unificado, iniciar turno
    if (room.gameType === "pictionary" && room.status === "playing") {
      let pictionary = this.pictionaryRooms.get(code);
      if (!pictionary && this.io) {
        pictionary = new PictionaryRoom(room, this.io);
        this.pictionaryRooms.set(code, pictionary);
      }
      if (pictionary && pictionary.status === "waiting" && room.players.length >= 1) {
        setTimeout(() => {
          if (pictionary.status === "waiting" && room.players.length >= 1) {
            pictionary.restartGame();
          }
        }, 600);
      }
    }

    room.chatMessages.push({
      id: `msg-${Date.now()}`,
      sender: "Sistema",
      text: `${newPlayer.nickname} se ha unido a la sala 👋`,
      timestamp: Date.now(),
      isSystem: true
    });

    return { room, newPlayer };
  }

  leaveRoom(socketId) {
    for (const [code, room] of this.rooms.entries()) {
      const index = room.players.findIndex(p => p.id === socketId);
      if (index !== -1) {
        const leavingPlayer = room.players[index];
        room.players.splice(index, 1);
        if (room.votes && room.votes[socketId]) {
          delete room.votes[socketId];
        }

        if (room.players.length === 0) {
          // Destruir sala vacía tras 5 minutos si no hay nadie
          setTimeout(() => {
            if (this.rooms.has(code) && this.rooms.get(code).players.length === 0) {
              this.rooms.delete(code);
            }
          }, 5 * 60 * 1000);
          return { roomCode: code, isEmpty: true };
        } else {
          // Si el anfitrión se fue, transferir anfitrión
          if (room.hostId === socketId) {
            room.hostId = room.players[0].id;
            room.players[0].isHost = true;
          }
          room.chatMessages.push({
            id: `msg-${Date.now()}`,
            sender: "Sistema",
            text: `${leavingPlayer.nickname} salió de la sala.`,
            timestamp: Date.now(),
            isSystem: true
          });
          return { roomCode: code, room, leavingPlayer };
        }
      }
    }
    return null;
  }

  getRoomBySocketId(socketId) {
    for (const room of this.rooms.values()) {
      if (room.players.some(p => p.id === socketId)) {
        return room;
      }
    }
    return null;
  }

  updateCursor(socketId, { row, col, direction }) {
    const room = this.getRoomBySocketId(socketId);
    if (!room) return null;

    const player = room.players.find(p => p.id === socketId);
    if (player) {
      player.cursor = { row, col, direction };
      return { roomCode: room.code, playerId: socketId, cursor: player.cursor };
    }
    return null;
  }

  updateCell(socketId, { row, col, letter }) {
    const room = this.getRoomBySocketId(socketId);
    if (!room || room.status === "completed") return null;

    const cell = room.boardState[row]?.[col];
    const gridCell = room.puzzle.grid[row]?.[col];

    if (!cell || !gridCell || cell.locked) {
      return null;
    }

    const player = room.players.find(p => p.id === socketId);
    const cleanLetter = (letter || "").toUpperCase().trim().slice(0, 1);

    cell.letter = cleanLetter;
    cell.lastEditedBy = cleanLetter ? {
      id: player.id,
      nickname: player.nickname,
      color: player.color
    } : null;

    const newWordsSolved = [];

    // Validar si alguna palabra asociada se ha completado
    if (cleanLetter) {
      // 1. Validar Across (Horizontal)
      if (gridCell.acrossClueNumber) {
        const acrossClue = room.puzzle.clues.across.find(c => c.number === gridCell.acrossClueNumber);
        if (acrossClue && !room.solvedClues.across.includes(acrossClue.number)) {
          let isFullMatch = true;
          for (let i = 0; i < acrossClue.answer.length; i++) {
            const currentC = room.boardState[acrossClue.row][acrossClue.col + i];
            if (currentC.letter !== acrossClue.answer[i]) {
              isFullMatch = false;
              break;
            }
          }

          if (isFullMatch) {
            // Palabra resuelta!
            room.solvedClues.across.push(acrossClue.number);
            for (let i = 0; i < acrossClue.answer.length; i++) {
              room.boardState[acrossClue.row][acrossClue.col + i].locked = true;
            }
            player.score += 100;
            player.wordsFound += 1;
            newWordsSolved.push({
              clue: acrossClue,
              direction: "across",
              player: player.nickname
            });
          }
        }
      }

      // 2. Validar Down (Vertical)
      if (gridCell.downClueNumber) {
        const downClue = room.puzzle.clues.down.find(c => c.number === gridCell.downClueNumber);
        if (downClue && !room.solvedClues.down.includes(downClue.number)) {
          let isFullMatch = true;
          for (let i = 0; i < downClue.answer.length; i++) {
            const currentC = room.boardState[downClue.row + i][downClue.col];
            if (currentC.letter !== downClue.answer[i]) {
              isFullMatch = false;
              break;
            }
          }

          if (isFullMatch) {
            // Palabra resuelta!
            room.solvedClues.down.push(downClue.number);
            for (let i = 0; i < downClue.answer.length; i++) {
              room.boardState[downClue.row + i][downClue.col].locked = true;
            }
            player.score += 100;
            player.wordsFound += 1;
            newWordsSolved.push({
              clue: downClue,
              direction: "down",
              player: player.nickname
            });
          }
        }
      }
    }

    // Verificar si el crucigrama completo ha sido resuelto
    const totalClues = room.puzzle.clues.across.length + room.puzzle.clues.down.length;
    const totalSolved = room.solvedClues.across.length + room.solvedClues.down.length;
    let isGameOver = false;

    if (totalSolved >= totalClues) {
      room.status = "completed";
      room.endTime = Date.now();
      isGameOver = true;
    }

    return {
      roomCode: room.code,
      row,
      col,
      cell,
      player,
      newWordsSolved,
      isGameOver,
      solvedClues: room.solvedClues,
      players: room.players
    };
  }

  requestHint(socketId, { row, col }) {
    const room = this.getRoomBySocketId(socketId);
    if (!room || room.status === "completed") return null;

    const cell = room.boardState[row]?.[col];
    const gridCell = room.puzzle.grid[row]?.[col];

    if (!cell || !gridCell || cell.locked) return null;

    const player = room.players.find(p => p.id === socketId);
    // Aplicar penalización pequeña por pista
    if (player) {
      player.score = Math.max(0, player.score - 20);
    }

    cell.letter = gridCell.solution;
    cell.locked = true;
    cell.lastEditedBy = {
      id: "hint",
      nickname: "Pista 💡",
      color: { hex: "#fbbf24", bg: "bg-amber-400", text: "text-amber-300" }
    };

    // Re-evaluar si se completó alguna palabra con esta pista
    return this.updateCell(socketId, { row, col, letter: gridCell.solution });
  }

  addMessage(socketId, text) {
    const room = this.getRoomBySocketId(socketId);
    if (!room) return null;

    const player = room.players.find(p => p.id === socketId);
    if (!player) return null;

    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sender: player.nickname,
      avatar: player.avatar,
      color: player.color,
      text: text.slice(0, 200),
      timestamp: Date.now()
    };

    room.chatMessages.push(message);
    if (room.chatMessages.length > 50) {
      room.chatMessages.shift();
    }

    return { roomCode: room.code, message };
  }

  addReaction(socketId, emoji) {
    const room = this.getRoomBySocketId(socketId);
    if (!room) return null;

    const player = room.players.find(p => p.id === socketId);
    if (!player) return null;

    return {
      roomCode: room.code,
      reaction: {
        id: `react-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        emoji,
        player: player.nickname,
        color: player.color
      }
    };
  }

  async restartGame(socketId, { category, difficulty } = {}) {
    const room = this.getRoomBySocketId(socketId);
    if (!room) return null;

    const selectedCategory = category || room.settings.category || "todo_tipo";
    const selectedDifficulty = difficulty || room.settings.difficulty || "Fácil";

    room.puzzle = await createPuzzle({ category: selectedCategory, difficulty: selectedDifficulty });
    room.settings = { category: selectedCategory, difficulty: selectedDifficulty };

    room.boardState = Array.from({ length: room.puzzle.rows }, (_, r) =>
      Array.from({ length: room.puzzle.cols }, (_, c) => {
        const gridCell = room.puzzle.grid[r][c];
        if (!gridCell || gridCell.type === "clue") return null;
        return {
          letter: "",
          locked: false,
          lastEditedBy: null
        };
      })
    );

    room.solvedClues = { across: [], down: [] };
    room.status = "playing";
    room.startTime = Date.now();
    room.endTime = null;

    // Resetear posiciones de cursor
    for (const p of room.players) {
      p.cursor = { row: 0, col: 0, direction: "across" };
    }

    room.chatMessages.push({
      id: `msg-${Date.now()}`,
      sender: "Sistema",
      text: `¡Nueva partida iniciada! Categoría: ${room.puzzle.category}`,
      timestamp: Date.now(),
      isSystem: true
    });

    return { roomCode: room.code, room };
  }
}

module.exports = { GameManager };
