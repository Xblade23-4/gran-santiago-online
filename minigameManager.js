/**
 * minigameManager.js
 * 10 Minijuegos multijugador interactivos estilo Mario Party para Gran Santiago Online.
 * Aparecen en tarjetas de Lotería y "?" de imprevistos.
 * Todos los jugadores activos participan en vivo; los perdedores pierden dinero y los ganadores
 * se reparten el pozo acumulado.
 */

'use strict';

const MINIGAME_DEFS = {
  bomba_tiempo: {
    id: 'bomba_tiempo',
    title: '💣 ¡La Bomba de Tiempo!',
    icon: '💣',
    instruction: '¡Pasa la bomba rápido antes de que explote! Quien la tenga al detonar pierde.',
    durationSec: 10,
    type: 'hot_potato'
  },
  reflejos_metro: {
    id: 'reflejos_metro',
    title: '🟢 ¡Reflejos en el Metro!',
    icon: '⚡',
    instruction: 'Espera la luz verde y toca la tarjeta Bip! lo más rápido posible.',
    durationSec: 6,
    type: 'reaction'
  },
  empanada_rapida: {
    id: 'empanada_rapida',
    title: '🥟 ¡Empanada Caliente (Tapping Frenético)!',
    icon: '🥟',
    instruction: '¡Haz clic lo más rápido que puedas en 5 segundos para inflar tu empanada!',
    durationSec: 5,
    type: 'button_mash'
  },
  ruleta_santiago: {
    id: 'ruleta_santiago',
    title: '🎡 ¡Ruleta de la Fortuna Santiaguina!',
    icon: '🎡',
    instruction: 'Detén la ruleta en el multiplicador más alto para llevarte la victoria.',
    durationSec: 8,
    type: 'timing_wheel'
  },
  esquiva_tag: {
    id: 'esquiva_tag',
    title: '🛣️ ¡Esquiva el Pórtico TAG!',
    icon: '🦘',
    instruction: 'Salta en el instante exacto cuando la barra pase por la zona verde.',
    durationSec: 6,
    type: 'jump_timing'
  },
  micro_llena: {
    id: 'micro_llena',
    title: '🚌 ¡La Micro Llena (Asiento Musical)!',
    icon: '🪑',
    instruction: '¡Se liberó un asiento! Haz clic antes de que se agoten los lugares.',
    durationSec: 7,
    type: 'musical_seats'
  },
  lluvia_monedas: {
    id: 'lluvia_monedas',
    title: '💰 ¡Lluvia de Monedas en Ahumada!',
    icon: '🪙',
    instruction: 'Atrapa tantas monedas y tréboles como puedas antes de que caigan.',
    durationSec: 8,
    type: 'coin_catcher'
  },
  tira_cuerda: {
    id: 'tira_cuerda',
    title: '🪢 ¡Tira y Afloja en el Parque!',
    icon: '💪',
    instruction: '¡Presiona con fuerza para jalar la cuerda hacia tu lado!',
    durationSec: 6,
    type: 'tug_of_war'
  },
  memoria_santiago: {
    id: 'memoria_santiago',
    title: '🧠 ¡Memoria Fotográfica de Santiago!',
    icon: '📸',
    instruction: 'Memoriza y repite la secuencia de 4 iconos patrios en el orden correcto.',
    durationSec: 9,
    type: 'memory_repeat'
  },
  duelo_cronometro: {
    id: 'duelo_cronometro',
    title: '⏱️ ¡El Duelo del Cronómetro 5.00s!',
    icon: '⏱️',
    instruction: 'Detén el reloj lo más cerca posible de 5.00 segundos (la pantalla se ocultará a los 2.5s).',
    durationSec: 8,
    type: 'stopwatch_duel'
  }
};

const ALL_MINIGAME_IDS = Object.keys(MINIGAME_DEFS);

/**
 * Inicia un minijuego en una sala
 */
function createMinigameState(room, forcedId = null, betAmount = 50000) {
  const minigameId = (forcedId && MINIGAME_DEFS[forcedId])
    ? forcedId
    : ALL_MINIGAME_IDS[Math.floor(Math.random() * ALL_MINIGAME_IDS.length)];

  const def = MINIGAME_DEFS[minigameId];
  const activePlayers = (room.players || []).filter((p) => !p.bankrupt);

  const playersState = {};
  activePlayers.forEach((p) => {
    playersState[p.id] = {
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      isBot: Boolean(p.isBot),
      score: 0,
      taps: 0,
      reactionTimeMs: null,
      clickedTime: null,
      eliminated: false,
      finished: false,
      choice: null
    };
  });

  // Configuración específica de cada minijuego
  let gameData = {};
  if (minigameId === 'bomba_tiempo') {
    const starter = activePlayers[Math.floor(Math.random() * activePlayers.length)];
    gameData = {
      holderId: starter ? starter.id : null,
      passesCount: 0,
      fuseDurationSec: 8 + Math.floor(Math.random() * 5),
      fuseEndTimestamp: Date.now() + 10000
    };
  } else if (minigameId === 'reflejos_metro') {
    const delay = 2200 + Math.floor(Math.random() * 2600); // 2.2 a 4.8s
    gameData = {
      signalTimestamp: Date.now() + delay,
      signaled: false
    };
  } else if (minigameId === 'micro_llena') {
    const totalSeats = Math.max(1, activePlayers.length - 1); // Siempre 1 asiento menos
    const delay = 1800 + Math.floor(Math.random() * 2400);
    gameData = {
      availableSeats: totalSeats,
      totalSeats,
      openedTimestamp: Date.now() + delay,
      claimedSeats: []
    };
  } else if (minigameId === 'memoria_santiago') {
    const SYMS = ['🦅', '🚇', '🗿', '🥟', '🌺', '🎸', '🦌', '🇨🇱'];
    const seq = [];
    for (let i = 0; i < 4; i++) {
      seq.push(SYMS[Math.floor(Math.random() * SYMS.length)]);
    }
    gameData = {
      sequence: seq,
      options: SYMS
    };
  } else if (minigameId === 'lluvia_monedas') {
    gameData = {
      totalSpawned: 24
    };
  }

  return {
    id: def.id,
    title: def.title,
    icon: def.icon,
    instruction: def.instruction,
    betAmount: Number(betAmount) || 50000,
    status: 'countdown', // 'countdown' (3..2..1) | 'active' | 'finished'
    countdownNumber: 3,
    startedTimestamp: Date.now() + 3200,
    durationSec: def.durationSec,
    gameData,
    players: playersState,
    results: null
  };
}

/**
 * Procesa la acción del jugador en el minijuego
 */
function handleMinigameAction(room, playerId, action) {
  const mg = room.minigame;
  if (!mg || mg.status !== 'active') return { ok: false, error: 'Minijuego no activo' };

  const pState = mg.players[playerId];
  if (!pState || pState.eliminated) return { ok: false, error: 'Jugador no participa o eliminado' };

  const now = Date.now();

  switch (mg.id) {
    case 'bomba_tiempo': {
      if (mg.gameData.holderId === playerId) {
        // Pasar la bomba a otro jugador vivo
        const candidates = Object.values(mg.players).filter((p) => p.id !== playerId && !p.eliminated);
        if (candidates.length > 0) {
          const nextP = candidates[Math.floor(Math.random() * candidates.length)];
          mg.gameData.holderId = nextP.id;
          mg.gameData.passesCount = (mg.gameData.passesCount || 0) + 1;
          pState.score += 1;
        }
      }
      break;
    }

    case 'reflejos_metro': {
      if (!pState.finished) {
        if (now < mg.gameData.signalTimestamp) {
          // Falso inicio / penalización
          pState.reactionTimeMs = 9999;
          pState.finished = true;
          pState.eliminated = true;
        } else {
          pState.reactionTimeMs = now - mg.gameData.signalTimestamp;
          pState.finished = true;
        }
      }
      break;
    }

    case 'empanada_rapida': {
      pState.taps = (pState.taps || 0) + 1;
      pState.score = pState.taps;
      break;
    }

    case 'ruleta_santiago': {
      if (!pState.finished) {
        const val = action.value !== undefined ? Number(action.value) : Math.floor(Math.random() * 10) + 1;
        pState.score = val;
        pState.finished = true;
      }
      break;
    }

    case 'esquiva_tag': {
      if (!pState.finished) {
        const jumpedInZone = Boolean(action.inZone);
        pState.score = jumpedInZone ? 100 : 0;
        pState.finished = true;
        if (!jumpedInZone) pState.eliminated = true;
      }
      break;
    }

    case 'micro_llena': {
      if (!pState.finished && now >= mg.gameData.openedTimestamp) {
        if (mg.gameData.availableSeats > 0 && !mg.gameData.claimedSeats.includes(playerId)) {
          mg.gameData.claimedSeats.push(playerId);
          mg.gameData.availableSeats -= 1;
          pState.score = 10;
          pState.finished = true;
        } else {
          pState.score = 0;
          pState.eliminated = true;
          pState.finished = true;
        }
      }
      break;
    }

    case 'lluvia_monedas': {
      pState.score = (pState.score || 0) + (Number(action.coins) || 1);
      break;
    }

    case 'tira_cuerda': {
      pState.score = (pState.score || 0) + 1;
      break;
    }

    case 'memoria_santiago': {
      const idx = action.stepIndex || 0;
      const sym = action.symbol;
      if (mg.gameData.sequence && mg.gameData.sequence[idx] === sym) {
        pState.score = idx + 1;
        if (idx === mg.gameData.sequence.length - 1) {
          pState.finished = true;
        }
      } else {
        pState.eliminated = true;
        pState.finished = true;
      }
      break;
    }

    case 'duelo_cronometro': {
      if (!pState.finished) {
        const elapsedSec = (now - mg.startedTimestamp) / 1000;
        const diff = Math.abs(elapsedSec - 5.0);
        pState.score = Math.max(0, Math.round((5.0 - diff) * 1000));
        pState.clickedTime = elapsedSec;
        pState.finished = true;
      }
      break;
    }
  }

  return { ok: true };
}

/**
 * Simula acciones de Bots en el minijuego
 */
function simulateBotMinigameActions(room) {
  const mg = room.minigame;
  if (!mg || mg.status !== 'active') return;

  const now = Date.now();
  const bots = Object.values(mg.players).filter((p) => p.isBot && !p.eliminated && !p.finished);

  bots.forEach((b) => {
    switch (mg.id) {
      case 'bomba_tiempo': {
        if (mg.gameData.holderId === b.id && Math.random() < 0.6) {
          handleMinigameAction(room, b.id, {});
        }
        break;
      }
      case 'reflejos_metro': {
        if (now >= mg.gameData.signalTimestamp && !b.finished) {
          if (now - mg.gameData.signalTimestamp > 280 + Math.random() * 450) {
            handleMinigameAction(room, b.id, {});
          }
        }
        break;
      }
      case 'empanada_rapida': {
        if (Math.random() < 0.75) {
          handleMinigameAction(room, b.id, {});
        }
        break;
      }
      case 'ruleta_santiago': {
        if (Math.random() < 0.15) {
          handleMinigameAction(room, b.id, { value: Math.floor(Math.random() * 8) + 2 });
        }
        break;
      }
      case 'esquiva_tag': {
        if (Math.random() < 0.18) {
          handleMinigameAction(room, b.id, { inZone: Math.random() < 0.8 });
        }
        break;
      }
      case 'micro_llena': {
        if (now >= mg.gameData.openedTimestamp && !b.finished) {
          if (now - mg.gameData.openedTimestamp > 250 + Math.random() * 500) {
            handleMinigameAction(room, b.id, {});
          }
        }
        break;
      }
      case 'lluvia_monedas': {
        if (Math.random() < 0.4) {
          handleMinigameAction(room, b.id, { coins: 1 });
        }
        break;
      }
      case 'tira_cuerda': {
        if (Math.random() < 0.7) {
          handleMinigameAction(room, b.id, {});
        }
        break;
      }
      case 'memoria_santiago': {
        if (Math.random() < 0.25) {
          const currentStep = b.score || 0;
          if (currentStep < (mg.gameData.sequence?.length || 4)) {
            const sym = Math.random() < 0.85
              ? mg.gameData.sequence[currentStep]
              : mg.gameData.options[0];
            handleMinigameAction(room, b.id, { stepIndex: currentStep, symbol: sym });
          }
        }
        break;
      }
      case 'duelo_cronometro': {
        const elapsedSec = (now - mg.startedTimestamp) / 1000;
        if (elapsedSec >= 4.7 + Math.random() * 0.6 && !b.finished) {
          handleMinigameAction(room, b.id, {});
        }
        break;
      }
    }
  });
}

/**
 * Concluye el minijuego, liquida pagos y determina ganadores/perdedores
 */
function concludeMinigame(room) {
  const mg = room.minigame;
  if (!mg) return null;

  mg.status = 'finished';

  const playersArr = Object.values(mg.players);
  let winners = [];
  let losers = [];

  if (mg.id === 'bomba_tiempo') {
    // El que tiene la bomba al terminar es el perdedor absoluto
    const explodedOnId = mg.gameData.holderId;
    losers = playersArr.filter((p) => p.id === explodedOnId);
    winners = playersArr.filter((p) => p.id !== explodedOnId);
  } else if (mg.id === 'micro_llena') {
    // Los que no consiguieron asiento son los perdedores
    losers = playersArr.filter((p) => p.eliminated || !mg.gameData.claimedSeats?.includes(p.id));
    winners = playersArr.filter((p) => mg.gameData.claimedSeats?.includes(p.id));
  } else if (mg.id === 'reflejos_metro') {
    // Ordenar por menor tiempo de reacción
    const valid = playersArr.filter((p) => !p.eliminated && p.reactionTimeMs !== null);
    valid.sort((a, b) => a.reactionTimeMs - b.reactionTimeMs);
    if (valid.length > 0) {
      winners = [valid[0]];
      losers = playersArr.filter((p) => p.id !== valid[0].id);
    } else {
      winners = [playersArr[0]];
      losers = playersArr.slice(1);
    }
  } else {
    // Por puntaje más alto
    playersArr.sort((a, b) => (b.score || 0) - (a.score || 0));
    const highestScore = playersArr[0]?.score || 0;
    winners = playersArr.filter((p) => (p.score || 0) === highestScore);
    losers = playersArr.filter((p) => (p.score || 0) < highestScore);
    if (losers.length === 0 && playersArr.length > 1) {
      // Empate total: el último pierde
      losers = [playersArr[playersArr.length - 1]];
      winners = playersArr.slice(0, playersArr.length - 1);
    }
  }

  // Realizar transferencias de dinero
  const betAmount = mg.betAmount || 50000;
  let totalPot = 0;

  losers.forEach((lp) => {
    const realPlayer = room.players.find((p) => p.id === lp.id);
    if (realPlayer) {
      const deduction = Math.min(realPlayer.money, betAmount);
      realPlayer.money -= deduction;
      totalPot += deduction;
    }
  });

  const winShare = winners.length > 0 ? Math.floor(totalPot / winners.length) : 0;
  winners.forEach((wp) => {
    const realPlayer = room.players.find((p) => p.id === wp.id);
    if (realPlayer) {
      realPlayer.money += winShare;
    }
  });

  mg.results = {
    winners: winners.map((w) => ({ id: w.id, name: w.name, avatar: w.avatar, share: winShare })),
    losers: losers.map((l) => ({ id: l.id, name: l.name, avatar: l.avatar, lost: betAmount })),
    totalPot
  };

  return mg.results;
}

module.exports = {
  MINIGAME_DEFS,
  ALL_MINIGAME_IDS,
  createMinigameState,
  handleMinigameAction,
  simulateBotMinigameActions,
  concludeMinigame
};
