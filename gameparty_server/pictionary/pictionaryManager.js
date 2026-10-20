// server/pictionary/pictionaryManager.js
const { getRandomWords } = require("./words");

function normalizeText(str) {
  return (str || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]/g, "");
}

class PictionaryRoom {
  constructor(room, io) {
    this.room = room;
    this.io = io;

    this.status = "waiting"; // waiting | word_selection | drawing | round_end | game_over
    this.currentRound = 1;
    this.totalRounds = 3;
    this.currentArtistIndex = 0;
    this.currentWord = "";
    this.currentCategory = "";
    this.currentDifficulty = "";
    this.hiddenWord = "";
    this.wordOptions = [];
    this.strokes = []; // Historial de trazos del lienzo
    this.timeLeft = 0;
    this.timer = null;
    this.guessedPlayers = new Set(); // IDs de jugadores que ya adivinaron en la ronda actual
  }

  getArtist() {
    return this.room.players[this.currentArtistIndex] || this.room.players[0];
  }

  generateHiddenWord(word, revealIndices = []) {
    return word
      .split("")
      .map((char, index) => {
        if (char === " " || char === "-") return char;
        if (revealIndices.includes(index)) return char;
        return "_";
      })
      .join(" ");
  }

  startTurn() {
    if (this.room.players.length === 0) return;

    this.status = "word_selection";
    this.strokes = [];
    this.guessedPlayers.clear();
    this.currentWord = "";
    this.hiddenWord = "";
    this.wordOptions = getRandomWords(3);
    this.timeLeft = 15;

    const artist = this.getArtist();

    this.io.to(this.room.code).emit("pictionary-state", this.getPublicState());

    // Enviar opciones de palabras exclusivamente al dibujante
    this.io.to(artist.id).emit("pictionary-word-options", {
      options: this.wordOptions,
      timeLeft: this.timeLeft
    });

    this.clearTimer();
    this.timer = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        // Si no elige a tiempo, elegir la primera palabra automáticamente
        this.selectWord(this.wordOptions[0].word, this.wordOptions[0].category, this.wordOptions[0].difficulty);
      } else {
        this.io.to(this.room.code).emit("pictionary-timer", { timeLeft: this.timeLeft });
      }
    }, 1000);
  }

  selectWord(word, category, difficulty) {
    this.clearTimer();
    this.currentWord = word.toUpperCase();
    this.currentCategory = category;
    this.currentDifficulty = difficulty;
    this.status = "drawing";
    this.timeLeft = 75;
    this.strokes = [];
    this.guessedPlayers.clear();

    const artist = this.getArtist();
    const revealedIndices = [];
    this.hiddenWord = this.generateHiddenWord(this.currentWord, revealedIndices);

    // Estado para los adivinadores (palabra con guiones)
    this.io.to(this.room.code).emit("pictionary-state", this.getPublicState());

    // Avisar al dibujante de la palabra seleccionada
    this.io.to(artist.id).emit("pictionary-artist-word", {
      word: this.currentWord,
      category: this.currentCategory
    });

    this.timer = setInterval(() => {
      this.timeLeft--;

      // Revelar pistas de letras progresivas (a los 45s y a los 20s)
      if (this.timeLeft === 45 && this.currentWord.length > 3) {
        revealedIndices.push(0); // Primera letra
        this.hiddenWord = this.generateHiddenWord(this.currentWord, revealedIndices);
        this.io.to(this.room.code).emit("pictionary-state", this.getPublicState());
      } else if (this.timeLeft === 20 && this.currentWord.length > 5) {
        revealedIndices.push(this.currentWord.length - 1); // Última letra
        this.hiddenWord = this.generateHiddenWord(this.currentWord, revealedIndices);
        this.io.to(this.room.code).emit("pictionary-state", this.getPublicState());
      }

      if (this.timeLeft <= 0) {
        this.endTurn("¡Tiempo agotado!");
      } else {
        this.io.to(this.room.code).emit("pictionary-timer", { timeLeft: this.timeLeft });
      }
    }, 1000);
  }

  addStroke(socketId, stroke) {
    const artist = this.getArtist();
    if (artist && artist.id === socketId && this.status === "drawing") {
      this.strokes.push(stroke);
      this.io.to(this.room.code).emit("pictionary-new-stroke", stroke);
    }
  }

  clearCanvas(socketId) {
    const artist = this.getArtist();
    if (artist && artist.id === socketId && this.status === "drawing") {
      this.strokes = [];
      this.io.to(this.room.code).emit("pictionary-canvas-cleared");
    }
  }

  undoStroke(socketId) {
    const artist = this.getArtist();
    if (artist && artist.id === socketId && this.status === "drawing") {
      this.strokes.pop();
      this.io.to(this.room.code).emit("pictionary-all-strokes", this.strokes);
    }
  }

  handleGuess(socketId, guessText) {
    if (this.status !== "drawing") return null;

    const artist = this.getArtist();
    // El dibujante no puede adivinar
    if (artist && artist.id === socketId) return null;

    // Si ya adivinó esta ronda, no puede volver a adivinar
    if (this.guessedPlayers.has(socketId)) return null;

    const player = this.room.players.find(p => p.id === socketId);
    if (!player) return null;

    const cleanGuess = normalizeText(guessText);
    const cleanSecret = normalizeText(this.currentWord);

    // 1. Acierto exacto
    if (cleanGuess === cleanSecret) {
      this.guessedPlayers.add(socketId);

      // Calcular puntuación basada en velocidad (máx 400 pts, mín 75 pts)
      const points = Math.max(75, Math.floor((this.timeLeft / 75) * 350) + 50);
      player.score += points;
      player.wordsFound = (player.wordsFound || 0) + 1;

      // El dibujante recibe puntos por cada amigo que acierte (+60 pts)
      if (artist) {
        artist.score += 60;
      }

      const successMsg = {
        id: `msg-${Date.now()}`,
        sender: "Sistema",
        text: `🎉 ¡${player.nickname} adivinó la palabra! (+${points} pts)`,
        isSuccess: true,
        timestamp: Date.now()
      };

      this.room.chatMessages.push(successMsg);
      this.io.to(this.room.code).emit("new-chat-message", successMsg);
      this.io.to(this.room.code).emit("pictionary-player-guessed", {
        playerId: socketId,
        points,
        players: this.room.players
      });

      // Si todos los adivinadores acertaron, terminar la ronda de inmediato
      const guessersCount = this.room.players.length - 1;
      if (this.guessedPlayers.size >= guessersCount) {
        this.endTurn("¡Todos adivinaron la palabra!");
      }

      return { correct: true, points };
    }

    // 2. Intento normal (se retransmite al chat)
    const chatMsg = {
      id: `msg-${Date.now()}`,
      sender: player.nickname,
      avatar: player.avatar,
      color: player.color,
      text: guessText,
      timestamp: Date.now()
    };

    this.room.chatMessages.push(chatMsg);
    this.io.to(this.room.code).emit("new-chat-message", chatMsg);

    return { correct: false };
  }

  endTurn(reason) {
    this.clearTimer();
    this.status = "round_end";
    this.timeLeft = 5;

    this.io.to(this.room.code).emit("pictionary-round-ended", {
      reason,
      word: this.currentWord,
      players: this.room.players,
      nextArtist: this.getNextArtistName()
    });

    this.timer = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.clearTimer();
        this.advanceTurn();
      }
    }, 1000);
  }

  getNextArtistName() {
    const nextIndex = (this.currentArtistIndex + 1) % this.room.players.length;
    return this.room.players[nextIndex]?.nickname || "Siguiente jugador";
  }

  advanceTurn() {
    this.currentArtistIndex = (this.currentArtistIndex + 1) % this.room.players.length;

    // Si completamos una vuelta completa de todos los jugadores, avanzar ronda
    if (this.currentArtistIndex === 0) {
      this.currentRound++;
      if (this.currentRound > this.totalRounds) {
        this.endGame();
        return;
      }
    }

    this.startTurn();
  }

  endGame() {
    this.clearTimer();
    this.status = "game_over";
    this.room.status = "completed";
    this.room.endTime = Date.now();

    this.io.to(this.room.code).emit("game-over", {
      players: this.room.players,
      endTime: Date.now()
    });
  }

  restartGame() {
    this.clearTimer();
    this.currentRound = 1;
    this.currentArtistIndex = 0;
    this.status = "waiting";
    this.strokes = [];
    this.guessedPlayers.clear();
    this.startTurn();
  }

  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  getPublicState() {
    const artist = this.getArtist();
    return {
      status: this.status,
      currentRound: this.currentRound,
      totalRounds: this.totalRounds,
      artist: artist ? { id: artist.id, nickname: artist.nickname, avatar: artist.avatar, color: artist.color } : null,
      hiddenWord: this.hiddenWord,
      currentCategory: this.currentCategory,
      currentDifficulty: this.currentDifficulty,
      wordLength: this.currentWord.replace(/[\s-]/g, "").length,
      timeLeft: this.timeLeft,
      guessedPlayers: Array.from(this.guessedPlayers),
      players: this.room.players,
      strokes: this.strokes
    };
  }
}

module.exports = { PictionaryRoom };
