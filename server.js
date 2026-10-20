const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const {
  COLOR_GROUPS,
  PLAYER_AVATARS,
  BOARD_TILES,
  CHANCE_CARDS,
  COMMUNITY_CARDS,
  CUAL_ES_SYMBOLS,
  generateCualEsDeck
} = require('./boardData');
const { GameManager } = require('./gameparty_server/gameManager');
const { getCategories } = require('./gameparty_server/crosswords/puzzles');

const app = express();
app.use(cors());
app.use(express.json());

// Si alguien abre /?room=XXXX (enlace de Crucigrama o Doodle Party), redirigir a /gameparty/?room=XXXX
app.get('/', (req, res, next) => {
  if (req.query && req.query.room) {
    return res.redirect(`/gameparty/?room=${encodeURIComponent(req.query.room)}`);
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Gestor de salas de GameParty Web (Crucigrama Party & Doodle Party / Pictionary)
const gamePartyManager = new GameManager();
gamePartyManager.setIo(io);

// Almacenamiento en memoria de las salas de juego
const rooms = new Map();

function formatCLP(amount) {
  return '$' + Number(amount).toLocaleString('es-CL');
}

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'STGO-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function createInitialProperties() {
  const props = {};
  BOARD_TILES.forEach((tile) => {
    if (['property', 'station', 'utility'].includes(tile.type)) {
      props[tile.id] = {
        ownerId: null,
        houses: 0, // 0..4 casas, 5 = Torre / Hotel
        mortgaged: false
      };
    }
  });
  return props;
}

function createRoom(hostPlayer, customCode, settings = {}) {
  const code = customCode || generateRoomCode();
  const initialMoney = Number(settings.startingMoney) || 1500000;
  const passGoMoney = Number(settings.passGoMoney) || 200000;
  const gameType = settings.gameType === 'cual_es' ? 'cual_es' : 'santiago';

  const room = {
    code,
    hostId: hostPlayer.id,
    gameType, // 'santiago' | 'cual_es'
    status: 'lobby', // 'lobby' | 'playing' | 'finished'
    settings: {
      startingMoney: initialMoney,
      passGoMoney: passGoMoney,
      maxPlayers: 8
    },
    players: [hostPlayer],
    turnIndex: 0,
    turnPhase: 'ROLL', // 'ROLL' | 'BUY_DECISION' | 'END_TURN'
    pendingBuyTileId: null,
    lastDice: [1, 1],
    doublesCount: 0,
    pot: 100000, // Pozo inicial Parque O'Higgins
    properties: createInitialProperties(),
    trades: [], // Ofertas de trueque activas
    cualEs: {
      centerCard: [],
      remainingDeckCount: 0,
      playerCards: {},
      scores: {},
      penalties: {},
      lastMatch: null
    },
    logs: [
      {
        id: Date.now() + '-' + Math.random(),
        time: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
        text: `¡Sala ${code} creada (${gameType === 'cual_es' ? '¿Cuál es?' : 'Gran Santiago'})! Esperando jugadores (2 a 8)...`,
        type: 'system'
      }
    ],
    chat: [],
    winner: null
  };

  rooms.set(code, room);
  return room;
}

function addLog(room, text, type = 'info') {
  room.logs.unshift({
    id: Date.now() + '-' + Math.random(),
    time: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
    text,
    type
  });
  if (room.logs.length > 60) {
    room.logs.length = 60;
  }
}

function getCurrentPlayer(room) {
  if (!room.players.length) return null;
  return room.players[room.turnIndex] || room.players[0];
}

function ownsFullGroup(room, ownerId, groupKey) {
  if (!ownerId || !groupKey) return false;
  const groupTiles = BOARD_TILES.filter((t) => t.group === groupKey);
  if (!groupTiles.length) return false;
  return groupTiles.every(
    (t) => room.properties[t.id] && room.properties[t.id].ownerId === ownerId && !room.properties[t.id].mortgaged
  );
}

function calculateRent(room, tile, diceSum) {
  const propState = room.properties[tile.id];
  if (!propState || !propState.ownerId || propState.mortgaged) return 0;

  const ownerId = propState.ownerId;

  if (tile.type === 'property') {
    const houses = propState.houses || 0;
    if (houses > 0) {
      return tile.rents[houses];
    }
    const baseRent = tile.rents[0];
    return ownsFullGroup(room, ownerId, tile.group) ? baseRent * 2 : baseRent;
  }

  if (tile.type === 'station') {
    const ownedStations = BOARD_TILES.filter(
      (t) => t.type === 'station' && room.properties[t.id]?.ownerId === ownerId && !room.properties[t.id]?.mortgaged
    ).length;
    return tile.rents[Math.max(0, Math.min(3, ownedStations - 1))] || 50000;
  }

  if (tile.type === 'utility') {
    const ownedUtilities = BOARD_TILES.filter(
      (t) => t.type === 'utility' && room.properties[t.id]?.ownerId === ownerId && !room.properties[t.id]?.mortgaged
    ).length;
    const multiplier = ownedUtilities >= 2 ? 10000 : 4000;
    return diceSum * multiplier;
  }

  return 0;
}

function calculateNetWorth(room, player) {
  let total = player.money;
  for (const [tileIdStr, prop] of Object.entries(room.properties)) {
    if (prop.ownerId === player.id) {
      const tile = BOARD_TILES[Number(tileIdStr)];
      if (tile) {
        total += prop.mortgaged ? Math.floor(tile.price / 2) : tile.price;
        if (prop.houses > 0 && tile.houseCost) {
          total += prop.houses * tile.houseCost;
        }
      }
    }
  }
  return total;
}

// Intenta recaudar fondos automáticamente vendiendo casas o hipotecando si un jugador queda en negativo
function autoRaiseFundsIfNeeded(room, player) {
  if (player.money >= 0) return;

  // 1. Vender casas construidas a mitad de precio
  for (const [tileIdStr, prop] of Object.entries(room.properties)) {
    if (player.money >= 0) break;
    if (prop.ownerId === player.id && prop.houses > 0) {
      const tile = BOARD_TILES[Number(tileIdStr)];
      while (prop.houses > 0 && player.money < 0) {
        prop.houses -= 1;
        const refund = Math.floor((tile.houseCost || 50000) / 2);
        player.money += refund;
        addLog(room, `⚠️ ${player.name} vendió una edificación en ${tile.name} por ${formatCLP(refund)} para cubrir deudas.`, 'warning');
      }
    }
  }

  // 2. Hipotecar propiedades sin casas
  for (const [tileIdStr, prop] of Object.entries(room.properties)) {
    if (player.money >= 0) break;
    if (prop.ownerId === player.id && !prop.mortgaged && prop.houses === 0) {
      const tile = BOARD_TILES[Number(tileIdStr)];
      prop.mortgaged = true;
      const mortgageVal = Math.floor(tile.price / 2);
      player.money += mortgageVal;
      addLog(room, `🏦 ${player.name} hipotecó ${tile.name} al Banco Estado por ${formatCLP(mortgageVal)}.`, 'warning');
    }
  }

  // 3. Si aún sigue con saldo negativo, cae en bancarrota
  if (player.money < 0) {
    declareBankruptcy(room, player);
  }
}

function declareBankruptcy(room, player, creditorId = null) {
  player.bankrupt = true;
  player.money = 0;

  for (const [tileIdStr, prop] of Object.entries(room.properties)) {
    if (prop.ownerId === player.id) {
      if (creditorId) {
        prop.ownerId = creditorId;
        prop.houses = 0;
      } else {
        prop.ownerId = null;
        prop.houses = 0;
        prop.mortgaged = false;
      }
    }
  }

  addLog(room, `💥 ¡BANCARROTA! ${player.name} quedó sin liquidez ni propiedades en Santiago.`, 'danger');

  const activePlayers = room.players.filter((p) => !p.bankrupt);
  if (activePlayers.length === 1 && room.status === 'playing') {
    room.status = 'finished';
    room.winner = activePlayers[0];
    addLog(room, `🏆 ¡${room.winner.name} ha conquistado el Gran Santiago y gana la partida!`, 'success');
  }
}

function advanceTurn(room) {
  if (room.status !== 'playing') return;

  const activePlayers = room.players.filter((p) => !p.bankrupt);
  if (activePlayers.length <= 1) {
    if (activePlayers.length === 1) {
      room.status = 'finished';
      room.winner = activePlayers[0];
      addLog(room, `🏆 ¡${room.winner.name} es el gran magnate inmobiliario de Santiago!`, 'success');
    }
    return;
  }

  room.pendingBuyTileId = null;
  room.pendingCard = null;
  if (room.cardConfirmTimer) {
    clearTimeout(room.cardConfirmTimer);
    room.cardConfirmTimer = null;
  }
  room.doublesCount = 0;

  let nextIdx = room.turnIndex;
  for (let i = 0; i < room.players.length; i++) {
    nextIdx = (nextIdx + 1) % room.players.length;
    if (!room.players[nextIdx].bankrupt) {
      break;
    }
  }

  room.turnIndex = nextIdx;
  room.turnPhase = 'ROLL';
  const nextPlayer = room.players[room.turnIndex];
  addLog(room, `🎲 Turno de ${nextPlayer.avatar.icon} ${nextPlayer.name}.`, 'turn');

  if (nextPlayer.isBot) {
    scheduleBotTurn(room);
  }
}

function evaluateLandingTile(room, player, diceSum, ioInstance) {
  const tile = BOARD_TILES[player.position];
  if (!tile) {
    room.turnPhase = 'END_TURN';
    return;
  }

  // Propiedad, Estación de Metro o Servicio Básico
  if (['property', 'station', 'utility'].includes(tile.type)) {
    const prop = room.properties[tile.id];
    if (!prop.ownerId) {
      if (player.money >= tile.price) {
        room.turnPhase = 'BUY_DECISION';
        room.pendingBuyTileId = tile.id;
        return;
      } else {
        addLog(room, `${player.name} aterrizó en ${tile.name} (${formatCLP(tile.price)}), pero no tiene suficiente efectivo para comprarla.`, 'info');
        room.turnPhase = 'END_TURN';
        return;
      }
    } else if (prop.ownerId !== player.id) {
      const owner = room.players.find((p) => p.id === prop.ownerId);
      if (!owner || owner.bankrupt || prop.mortgaged) {
        if (prop.mortgaged) {
          addLog(room, `${player.name} pasó por ${tile.name}, pero está hipotecada. ¡No paga arriendo!`, 'info');
        }
        room.turnPhase = 'END_TURN';
        return;
      }

      const rent = calculateRent(room, tile, diceSum);
      player.money -= rent;
      owner.money += rent;
      addLog(
        room,
        `💸 ${player.name} pagó ${formatCLP(rent)} de arriendo a ${owner.name} en ${tile.name}.`,
        'rent'
      );
      autoRaiseFundsIfNeeded(room, player);
      room.turnPhase = 'END_TURN';
      return;
    } else {
      addLog(room, `${player.name} descansa en su propia propiedad: ${tile.name}.`, 'info');
      room.turnPhase = 'END_TURN';
      return;
    }
  }

  // Impuestos (SII o Pórtico TAG)
  if (tile.type === 'tax') {
    const amount = tile.taxAmount || 100000;
    player.money -= amount;
    room.pot += amount;
    addLog(
      room,
      `🏛️ ${player.name} pagó ${formatCLP(amount)} en ${tile.name}. Pozo Parque O'Higgins sube a ${formatCLP(room.pot)}.`,
      'warning'
    );
    autoRaiseFundsIfNeeded(room, player);
    room.turnPhase = 'END_TURN';
    return;
  }

  // Parque O'Higgins (Fonda Libre - Lotería)
  if (tile.type === 'freeparking') {
    if (room.pot > 0) {
      const prize = room.pot;
      player.money += prize;
      room.pot = 50000; // Pozo base se reinicia en $50.000
      addLog(
        room,
        `🎡 ¡FONDA LIBRE! ${player.name} cayó en el Parque O'Higgins y se llevó el pozo acumulado de ${formatCLP(prize)}!`,
        'success'
      );
    }
    room.turnPhase = 'END_TURN';
    return;
  }

  // Ir a la Comisaría
  if (tile.type === 'gotojail') {
    player.position = 10;
    player.inJail = true;
    player.jailTurns = 0;
    room.doublesCount = 0;
    addLog(room, `🚨 ¡Control de Carabineros! ${player.name} fue enviado directo a la Comisaría.`, 'danger');
    room.turnPhase = 'END_TURN';
    return;
  }

  // Tarjetas de Suerte (¡Aló Santiago!) o Polla Chilena de Beneficencia
  if (tile.type === 'chance' || tile.type === 'community') {
    const deck = tile.type === 'chance' ? CHANCE_CARDS : COMMUNITY_CARDS;
    const card = deck[Math.floor(Math.random() * deck.length)];
    const deckTitle = tile.type === 'chance' ? '¡Aló Santiago! (Suerte)' : 'Polla Chilena de Beneficencia';

    addLog(room, `🃏 [${deckTitle}] ${player.name}: "${card.title}" — ${card.text}`, 'card');

    room.turnPhase = 'CARD_CONFIRM';
    room.pendingCard = {
      id: 'card_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      playerId: player.id,
      playerName: player.name,
      deckType: tile.type,
      deckTitle,
      card,
      diceSum
    };

    if (ioInstance) {
      ioInstance.to(room.code).emit('card_drawn', room.pendingCard);
    }

    if (room.cardConfirmTimer) {
      clearTimeout(room.cardConfirmTimer);
    }
    // Timeout de respaldo en servidor (1s dados + caminata + 10s de ventana modal)
    room.cardConfirmTimer = setTimeout(() => {
      resolvePendingCard(room, ioInstance || io);
    }, 12500);
    return;
  }

  room.turnPhase = 'END_TURN';
}

function resolvePendingCard(room, ioInstance) {
  if (!room || room.turnPhase !== 'CARD_CONFIRM' || !room.pendingCard) return;
  if (room.cardConfirmTimer) {
    clearTimeout(room.cardConfirmTimer);
    room.cardConfirmTimer = null;
  }

  const pending = room.pendingCard;
  room.pendingCard = null;
  const player = room.players.find((p) => p.id === pending.playerId);

  if (!player || player.bankrupt) {
    room.turnPhase = 'END_TURN';
  } else {
    applyCardAction(room, player, pending.card, pending.diceSum, ioInstance);
  }

  if (ioInstance) {
    ioInstance.to(room.code).emit('card_resolved', { cardId: pending.id });
  }
  broadcastRoomState(room);

  // Si es el turno de un Bot y la tarjeta no generó otra tarjeta en cadena, continuar su turno
  const current = getCurrentPlayer(room);
  if (current && current.isBot && !current.bankrupt && room.turnPhase !== 'CARD_CONFIRM') {
    scheduleBotPostLanding(room, current);
  }
}

function applyCardAction(room, player, card, diceSum, ioInstance) {
  switch (card.action) {
    case 'collect': {
      player.money += card.amount;
      room.turnPhase = 'END_TURN';
      break;
    }
    case 'pay_tax': {
      player.money -= card.amount;
      room.pot += card.amount;
      autoRaiseFundsIfNeeded(room, player);
      room.turnPhase = 'END_TURN';
      break;
    }
    case 'move_to': {
      const oldPos = player.position;
      player.position = card.target;
      if (card.target < oldPos && card.target !== 10) {
        player.money += room.settings.passGoMoney;
        addLog(room, `🏁 ${player.name} pasó por Plaza Baquedano y cobró sueldo de ${formatCLP(room.settings.passGoMoney)}.`, 'success');
      }
      evaluateLandingTile(room, player, diceSum, ioInstance);
      break;
    }
    case 'move_rel': {
      player.position = (player.position + card.steps + 40) % 40;
      evaluateLandingTile(room, player, diceSum, ioInstance);
      break;
    }
    case 'goto_jail': {
      player.position = 10;
      player.inJail = true;
      player.jailTurns = 0;
      room.doublesCount = 0;
      room.turnPhase = 'END_TURN';
      break;
    }
    case 'street_repairs': {
      let cost = 0;
      for (const prop of Object.values(room.properties)) {
        if (prop.ownerId === player.id && prop.houses > 0) {
          if (prop.houses === 5) cost += card.perHotel;
          else cost += prop.houses * card.perHouse;
        }
      }
      if (cost > 0) {
        player.money -= cost;
        room.pot += cost;
        addLog(room, `🏗️ ${player.name} pagó ${formatCLP(cost)} en contribuciones al SII.`, 'warning');
        autoRaiseFundsIfNeeded(room, player);
      } else {
        addLog(room, `${player.name} no tiene casas ni torres construidas, ¡se salvó de pagar contribuciones!`, 'info');
      }
      room.turnPhase = 'END_TURN';
      break;
    }
    case 'pay_each_player': {
      const others = room.players.filter((p) => p.id !== player.id && !p.bankrupt);
      const total = others.length * card.amount;
      player.money -= total;
      others.forEach((o) => {
        o.money += card.amount;
      });
      autoRaiseFundsIfNeeded(room, player);
      room.turnPhase = 'END_TURN';
      break;
    }
    case 'collect_each_player': {
      const others = room.players.filter((p) => p.id !== player.id && !p.bankrupt);
      others.forEach((o) => {
        o.money -= card.amount;
        player.money += card.amount;
        autoRaiseFundsIfNeeded(room, o);
      });
      room.turnPhase = 'END_TURN';
      break;
    }
    default:
      room.turnPhase = 'END_TURN';
  }
}

function handleRollDice(room, player, ioInstance) {
  if (room.turnPhase !== 'ROLL') return;

  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * 6) + 1;
  const sum = d1 + d2;
  const isDoubles = d1 === d2;

  room.lastDice = [d1, d2];

  if (ioInstance) {
    ioInstance.to(room.code).emit('dice_rolled', {
      playerId: player.id,
      playerName: player.name,
      dice: [d1, d2],
      sum,
      isDoubles
    });
  }

  // Si está en la Comisaría
  if (player.inJail) {
    if (isDoubles) {
      player.inJail = false;
      player.jailTurns = 0;
      addLog(room, `🎲 ¡Dobles (${d1} y ${d2})! ${player.name} sale libre de la Comisaría y avanza ${sum} casillas.`, 'success');
    } else {
      player.jailTurns += 1;
      if (player.jailTurns >= 3) {
        const fine = 50000;
        player.money -= fine;
        room.pot += fine;
        player.inJail = false;
        player.jailTurns = 0;
        addLog(room, `🚓 ${player.name} cumplió 3 turnos en Comisaría, pagó fianza de ${formatCLP(fine)} y avanza ${sum}.`, 'warning');
        autoRaiseFundsIfNeeded(room, player);
      } else {
        addLog(room, `🚓 ${player.name} sacó ${d1} y ${d2} (sin dobles). Permanece en la Comisaría (Intento ${player.jailTurns}/3).`, 'info');
        room.turnPhase = 'END_TURN';
        return;
      }
    }
  } else {
    if (isDoubles) {
      room.doublesCount += 1;
      if (room.doublesCount >= 3) {
        player.position = 10;
        player.inJail = true;
        player.jailTurns = 0;
        room.doublesCount = 0;
        addLog(room, `🚨 ¡Exceso de velocidad en Costanera! ${player.name} sacó 3 dobles seguidos y va a la Comisaría.`, 'danger');
        room.turnPhase = 'END_TURN';
        return;
      }
    } else {
      room.doublesCount = 0;
    }
  }

  if (player.bankrupt) {
    room.turnPhase = 'END_TURN';
    return;
  }

  // Avanzar casillas
  const oldPos = player.position;
  const newPos = (oldPos + sum) % 40;
  player.position = newPos;

  if (oldPos + sum >= 40) {
    player.money += room.settings.passGoMoney;
    addLog(
      room,
      `🏁 ${player.name} pasó por PARTIDA (Plaza Baquedano) y cobró sueldo de ${formatCLP(room.settings.passGoMoney)}.`,
      'success'
    );
  }

  const landedTile = BOARD_TILES[newPos];
  addLog(room, `🎲 ${player.name} lanzó [${d1} + ${d2} = ${sum}] y llegó a ${landedTile.name}.`, 'move');

  evaluateLandingTile(room, player, sum, ioInstance);
}

// Inteligencia Artificial para Bots Chilenos
function scheduleBotPostLanding(room, botPlayer, delayMs = 2600) {
  setTimeout(() => {
    if (!rooms.has(room.code) || room.status !== 'playing') return;
    const nowCurrent = getCurrentPlayer(room);
    if (!nowCurrent || nowCurrent.id !== botPlayer.id) return;
    if (room.turnPhase === 'CARD_CONFIRM') return; // Esperando que se cierre o venza los 10s de la tarjeta

    // Decisión de compra del Bot
    if (room.turnPhase === 'BUY_DECISION' && room.pendingBuyTileId !== null) {
      const tile = BOARD_TILES[room.pendingBuyTileId];
      const prop = room.properties[room.pendingBuyTileId];
      if (tile && prop && !prop.ownerId && botPlayer.money >= tile.price) {
        botPlayer.money -= tile.price;
        prop.ownerId = botPlayer.id;
        addLog(room, `🏢 ${botPlayer.name} compró ${tile.name} por ${formatCLP(tile.price)}.`, 'buy');
      }
      room.pendingBuyTileId = null;
      room.turnPhase = 'END_TURN';
      broadcastRoomState(room);
    }

    // Intentar edificar casas si tiene un grupo completo y buena liquidez
    for (const [tileIdStr, prop] of Object.entries(room.properties)) {
      const tileId = Number(tileIdStr);
      const tile = BOARD_TILES[tileId];
      if (
        tile &&
        tile.type === 'property' &&
        prop.ownerId === botPlayer.id &&
        !prop.mortgaged &&
        prop.houses < 5 &&
        ownsFullGroup(room, botPlayer.id, tile.group) &&
        botPlayer.money >= tile.houseCost + 250000
      ) {
        botPlayer.money -= tile.houseCost;
        prop.houses += 1;
        const label = prop.houses === 5 ? 'una Torre Costanera (Hotel)' : `Casa #${prop.houses}`;
        addLog(room, `🏗️ ${botPlayer.name} construyó ${label} en ${tile.name} por ${formatCLP(tile.houseCost)}.`, 'buy');
      }
    }

    setTimeout(() => {
      if (!rooms.has(room.code) || room.status !== 'playing') return;
      advanceTurn(room);
      broadcastRoomState(room);
    }, 1400);
  }, delayMs);
}

function scheduleBotTurn(room) {
  setTimeout(() => {
    if (!rooms.has(room.code) || room.status !== 'playing') return;
    const current = getCurrentPlayer(room);
    if (!current || !current.isBot || current.bankrupt) return;

    // Si está en la comisaría y tiene plata de sobra, paga fianza
    if (current.inJail && current.money > 250000 && room.turnPhase === 'ROLL') {
      current.money -= 50000;
      room.pot += 50000;
      current.inJail = false;
      current.jailTurns = 0;
      addLog(room, `🚓 ${current.name} pagó la fianza de $50.000 CLP para salir de la Comisaría.`, 'info');
    }

    handleRollDice(room, current, io);
    broadcastRoomState(room);

    // Si cayó en tarjeta "?", resolvePendingCard continuará el turno del Bot tras cerrarse la ventana o cumplir los 10s
    if (room.turnPhase !== 'CARD_CONFIRM') {
      const steps = (room.lastDice?.[0] || 3) + (room.lastDice?.[1] || 3);
      const walkWait = 1000 + steps * 190 + 400;
      scheduleBotPostLanding(room, current, walkWait);
    }
  }, 1000);
}

function serializeRoom(room) {
  return {
    code: room.code,
    hostId: room.hostId,
    gameType: room.gameType || 'santiago',
    status: room.status,
    settings: room.settings,
    players: room.players.map((p) => ({
      ...p,
      netWorth: calculateNetWorth(room, p),
      cualEsScore: room.cualEs?.scores?.[p.id] || 0,
      penaltyUntil: room.cualEs?.penalties?.[p.id] || 0
    })),
    turnIndex: room.turnIndex,
    turnPhase: room.turnPhase,
    pendingBuyTileId: room.pendingBuyTileId,
    pendingCard: room.pendingCard || null,
    lastDice: room.lastDice,
    doublesCount: room.doublesCount,
    pot: room.pot,
    properties: room.properties,
    trades: room.trades,
    cualEs: room.cualEs
      ? {
          centerCard: room.cualEs.centerCard,
          remainingDeckCount: room.cualEs.remainingDeckCount,
          playerCards: room.cualEs.playerCards,
          scores: room.cualEs.scores,
          penalties: room.cualEs.penalties,
          lastMatch: room.cualEs.lastMatch
        }
      : null,
    logs: room.logs,
    chat: room.chat,
    winner: room.winner
  };
}

function broadcastRoomState(room) {
  io.to(room.code).emit('room_state', serializeRoom(room));
}

function broadcastPublicRooms() {
  const publicList = [];
  for (const room of rooms.values()) {
    if (room.status === 'lobby' && room.players.length < 8) {
      const host = room.players.find((p) => p.id === room.hostId) || room.players[0];
      publicList.push({
        code: room.code,
        gameType: room.gameType || 'santiago',
        hostName: host ? host.name : 'Anfitrión',
        playerCount: room.players.length,
        maxPlayers: room.settings.maxPlayers,
        startingMoney: room.settings.startingMoney
      });
    }
  }
  io.emit('public_rooms', publicList);
}

// Endpoint de datos estáticos del tablero y símbolos de ¿Cuál es?
app.get('/api/board', (req, res) => {
  res.json({
    COLOR_GROUPS,
    PLAYER_AVATARS,
    BOARD_TILES,
    CUAL_ES_SYMBOLS
  });
});

// Endpoints REST para GameParty Web (Crucigrama Party & Doodle Party)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', activeRooms: rooms.size + gamePartyManager.rooms.size });
});

app.get('/api/categories', (req, res) => {
  res.json({ categories: getCategories() });
});

io.on('connection', (socket) => {
  let currentRoomCode = null;
  let currentPlayerId = null;

  // Enviar lista de salas disponibles al conectarse
  broadcastPublicRooms();

  socket.on('get_public_rooms', () => {
    broadcastPublicRooms();
  });

  // Crear sala nueva
  socket.on('create_room', ({ playerName, avatarId, startingMoney, gameType, playerId }, callback) => {
    const cleanName = (playerName || 'Santiaguino').trim().slice(0, 20) || 'Santiaguino';
    const pid = playerId || 'p_' + Math.random().toString(36).substring(2, 10);
    const chosenAvatar = PLAYER_AVATARS.find((a) => a.id === avatarId) || PLAYER_AVATARS[0];
    const initCash = Number(startingMoney) || 1500000;

    const hostPlayer = {
      id: pid,
      socketId: socket.id,
      name: cleanName,
      avatar: chosenAvatar,
      money: initCash,
      position: 0,
      inJail: false,
      jailTurns: 0,
      bankrupt: false,
      connected: true,
      isBot: false
    };

    const room = createRoom(hostPlayer, null, { startingMoney: initCash, gameType });
    currentRoomCode = room.code;
    currentPlayerId = pid;
    socket.join(room.code);

    broadcastRoomState(room);
    broadcastPublicRooms();
    if (callback) callback({ ok: true, roomCode: room.code, playerId: pid, state: serializeRoom(room) });
  });

  // Cambiar modo de juego en el Lobby (Gran Santiago vs ¿Cuál es?)
  socket.on('set_game_type', ({ gameType }) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.status !== 'lobby' || room.hostId !== currentPlayerId) return;
    room.gameType = gameType === 'cual_es' ? 'cual_es' : 'santiago';
    addLog(
      room,
      `🎮 El anfitrión cambió el juego a: ${room.gameType === 'cual_es' ? '🔍 ¿Cuál es? (Agilidad Visual)' : '🚇 Gran Santiago Online'}.`,
      'system'
    );
    broadcastRoomState(room);
    broadcastPublicRooms();
  });

  // Unirse a sala existente (o reconectar)
  socket.on('join_room', ({ roomCode, playerName, avatarId, playerId }, callback) => {
    const cleanCode = (roomCode || '').trim().toUpperCase();
    const room = rooms.get(cleanCode);

    if (!room) {
      if (callback) callback({ ok: false, error: 'No encontramos esa sala. Verifica el código (ej: STGO-XXXX).' });
      return;
    }

    // Verificar si es reconexión de un jugador existente
    const existingPlayer = room.players.find((p) => p.id === playerId);
    if (existingPlayer) {
      existingPlayer.socketId = socket.id;
      existingPlayer.connected = true;
      currentRoomCode = room.code;
      currentPlayerId = existingPlayer.id;
      socket.join(room.code);
      addLog(room, `🔌 ${existingPlayer.name} se ha reconectado a la partida.`, 'system');
      broadcastRoomState(room);
      if (callback) callback({ ok: true, roomCode: room.code, playerId: existingPlayer.id, state: serializeRoom(room) });
      return;
    }

    if (room.status !== 'lobby') {
      if (callback) callback({ ok: false, error: 'La partida en esta sala ya comenzó.' });
      return;
    }

    if (room.players.length >= 8) {
      if (callback) callback({ ok: false, error: 'La sala ya alcanzó el máximo de 8 jugadores.' });
      return;
    }

    const cleanName = (playerName || 'Jugador').trim().slice(0, 20) || 'Jugador';
    const pid = playerId || 'p_' + Math.random().toString(36).substring(2, 10);

    // Asignar avatar preferido o uno libre
    const usedAvatars = new Set(room.players.map((p) => p.avatar.id));
    let chosenAvatar = PLAYER_AVATARS.find((a) => a.id === avatarId && !usedAvatars.has(a.id));
    if (!chosenAvatar) {
      chosenAvatar = PLAYER_AVATARS.find((a) => !usedAvatars.has(a.id)) || PLAYER_AVATARS[0];
    }

    const newPlayer = {
      id: pid,
      socketId: socket.id,
      name: cleanName,
      avatar: chosenAvatar,
      money: room.settings.startingMoney,
      position: 0,
      inJail: false,
      jailTurns: 0,
      bankrupt: false,
      connected: true,
      isBot: false
    };

    room.players.push(newPlayer);
    currentRoomCode = room.code;
    currentPlayerId = pid;
    socket.join(room.code);

    addLog(room, `👋 ${newPlayer.avatar.icon} ${newPlayer.name} se unió a la sala (${room.players.length}/8).`, 'system');
    broadcastRoomState(room);
    broadcastPublicRooms();

    if (callback) callback({ ok: true, roomCode: room.code, playerId: pid, state: serializeRoom(room) });
  });

  // Agregar un Bot Chileno en el Lobby (para completar o probar de 2 a 8 jugadores)
  socket.on('add_bot', (_, callback) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.status !== 'lobby' || room.hostId !== currentPlayerId) return;
    if (room.players.length >= 8) {
      if (callback) callback({ ok: false, error: 'Ya hay 8 jugadores en la sala.' });
      return;
    }

    const botNames = ['Tío Lucho (Bot)', 'Doña Juanita (Bot)', 'El Farkas (Bot)', 'Don Carter (Bot)', 'La Paty (Bot)', 'Bielsa (Bot)', 'Pepe Tapia (Bot)'];
    const usedNames = new Set(room.players.map((p) => p.name));
    const botName = botNames.find((n) => !usedNames.has(n)) || `Bot Chileno ${room.players.length}`;

    const usedAvatars = new Set(room.players.map((p) => p.avatar.id));
    const chosenAvatar = PLAYER_AVATARS.find((a) => !usedAvatars.has(a.id)) || PLAYER_AVATARS[room.players.length % PLAYER_AVATARS.length];

    const botPlayer = {
      id: 'bot_' + Math.random().toString(36).substring(2, 9),
      socketId: null,
      name: botName,
      avatar: chosenAvatar,
      money: room.settings.startingMoney,
      position: 0,
      inJail: false,
      jailTurns: 0,
      bankrupt: false,
      connected: true,
      isBot: true
    };

    room.players.push(botPlayer);
    addLog(room, `🤖 ${botPlayer.avatar.icon} ${botPlayer.name} fue agregado a la mesa.`, 'system');
    broadcastRoomState(room);
    broadcastPublicRooms();
    if (callback) callback({ ok: true });
  });

  // Quitar jugador o bot en el lobby
  socket.on('remove_player', ({ targetPlayerId }) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.status !== 'lobby' || room.hostId !== currentPlayerId) return;
    if (targetPlayerId === room.hostId) return;

    const idx = room.players.findIndex((p) => p.id === targetPlayerId);
    if (idx !== -1) {
      const removed = room.players.splice(idx, 1)[0];
      addLog(room, `${removed.name} salió de la sala.`, 'system');
      broadcastRoomState(room);
      broadcastPublicRooms();
    }
  });

  // Iniciar partida (2 a 8 jugadores)
  socket.on('start_game', (_, callback) => {
    const room = rooms.get(currentRoomCode);
    if (!room) return;
    if (room.hostId !== currentPlayerId) {
      if (callback) callback({ ok: false, error: 'Solo el anfitrión puede iniciar la partida.' });
      return;
    }
    if (room.players.length < 2 || room.players.length > 8) {
      if (callback) callback({ ok: false, error: 'Se necesitan entre 2 y 8 jugadores para comenzar.' });
      return;
    }

    room.status = 'playing';
    room.winner = null;

    if (room.gameType === 'cual_es') {
      startCualEsGame(room);
      broadcastRoomState(room);
      broadcastPublicRooms();
      if (callback) callback({ ok: true });
      return;
    }

    room.turnIndex = 0;
    room.turnPhase = 'ROLL';
    room.pendingBuyTileId = null;

    const firstPlayer = room.players[0];
    addLog(
      room,
      `🚀 ¡Comenzó Gran Santiago Online con ${room.players.length} jugadores! Cada uno inicia con ${formatCLP(room.settings.startingMoney)}.`,
      'success'
    );
    addLog(room, `🎲 Comienza el turno de ${firstPlayer.avatar.icon} ${firstPlayer.name}.`, 'turn');

    broadcastRoomState(room);
    broadcastPublicRooms();

    if (firstPlayer.isBot) {
      scheduleBotTurn(room);
    }
    if (callback) callback({ ok: true });
  });

  // Clic en un símbolo del juego "¿Cuál es?"
  socket.on('cual_es_click', ({ symbolId }, callback) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.status !== 'playing' || room.gameType !== 'cual_es') return;
    const player = room.players.find((p) => p.id === currentPlayerId);
    if (!player) return;

    const res = handleCualEsClick(room, player, Number(symbolId));
    if (callback) callback(res);
  });

  // Volver al Lobby al terminar una partida
  socket.on('return_to_lobby', () => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.hostId !== currentPlayerId) return;
    if (room.cualEsBotTimer) {
      clearInterval(room.cualEsBotTimer);
      room.cualEsBotTimer = null;
    }
    if (room.cardConfirmTimer) {
      clearTimeout(room.cardConfirmTimer);
      room.cardConfirmTimer = null;
    }
    room.pendingCard = null;
    room.pendingBuyTileId = null;
    room.status = 'lobby';
    room.winner = null;
    room.properties = createInitialProperties();
    room.trades = [];
    room.players.forEach((p) => {
      p.money = room.settings.startingMoney;
      p.position = 0;
      p.inJail = false;
      p.jailTurns = 0;
      p.bankrupt = false;
    });
    addLog(room, '🔄 El anfitrión regresó la sala al Lobby para una nueva partida.', 'system');
    broadcastRoomState(room);
    broadcastPublicRooms();
  });

  // Lanzar Dados
  socket.on('roll_dice', () => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.status !== 'playing') return;
    const current = getCurrentPlayer(room);
    if (!current || current.id !== currentPlayerId) return;

    handleRollDice(room, current, io);
    broadcastRoomState(room);
  });

  // Confirmar / cerrar manualmente cuadro de tarjeta "?" (o al expirar los 10s en cliente)
  socket.on('confirm_card', (_, callback) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.status !== 'playing') return;
    if (room.turnPhase !== 'CARD_CONFIRM' || !room.pendingCard) {
      if (callback) callback({ ok: false });
      return;
    }

    const current = getCurrentPlayer(room);
    // Puede confirmar quien sacó la tarjeta, o cualquier humano si es turno de un Bot
    if (current && !current.isBot && current.id !== currentPlayerId) {
      if (callback) callback({ ok: false });
      return;
    }

    resolvePendingCard(room, io);
    if (callback) callback({ ok: true });
  });

  // Pagar fianza de $50.000 CLP para salir de la Comisaría antes de lanzar
  socket.on('pay_bail', (_, callback) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.status !== 'playing') return;
    const current = getCurrentPlayer(room);
    if (!current || current.id !== currentPlayerId || !current.inJail || room.turnPhase !== 'ROLL') return;

    const bail = 50000;
    if (current.money < bail) {
      if (callback) callback({ ok: false, error: 'No tienes $50.000 CLP para pagar la fianza.' });
      return;
    }

    current.money -= bail;
    room.pot += bail;
    current.inJail = false;
    current.jailTurns = 0;
    addLog(room, `🚓 ${current.name} pagó fianza de ${formatCLP(bail)} y quedó en libertad. ¡Ahora puede lanzar los dados!`, 'success');
    broadcastRoomState(room);
    if (callback) callback({ ok: true });
  });

  // Comprar propiedad en la casilla actual
  socket.on('buy_property', (_, callback) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.status !== 'playing') return;
    const current = getCurrentPlayer(room);
    if (!current || current.id !== currentPlayerId) return;
    if (room.turnPhase !== 'BUY_DECISION' || room.pendingBuyTileId === null) return;

    const tile = BOARD_TILES[room.pendingBuyTileId];
    const prop = room.properties[room.pendingBuyTileId];

    if (!tile || !prop || prop.ownerId) {
      room.turnPhase = 'END_TURN';
      broadcastRoomState(room);
      return;
    }

    if (current.money < tile.price) {
      if (callback) callback({ ok: false, error: 'Fondos insuficientes en CLP.' });
      return;
    }

    current.money -= tile.price;
    prop.ownerId = current.id;
    room.pendingBuyTileId = null;
    room.turnPhase = 'END_TURN';

    addLog(room, `🏢 ¡Escritura firmada! ${current.name} compró ${tile.name} por ${formatCLP(tile.price)}.`, 'buy');
    broadcastRoomState(room);
    if (callback) callback({ ok: true });
  });

  // Pasar de comprar propiedad
  socket.on('skip_buy', () => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.status !== 'playing') return;
    const current = getCurrentPlayer(room);
    if (!current || current.id !== currentPlayerId) return;
    if (room.turnPhase !== 'BUY_DECISION') return;

    const tile = BOARD_TILES[room.pendingBuyTileId];
    if (tile) {
      addLog(room, `${current.name} decidió no comprar ${tile.name}.`, 'info');
    }
    room.pendingBuyTileId = null;
    room.turnPhase = 'END_TURN';
    broadcastRoomState(room);
  });

  // Construir Casa / Torre Costanera (Hotel)
  socket.on('build_house', ({ tileId }, callback) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.status !== 'playing') return;
    const current = getCurrentPlayer(room);
    if (!current || current.id !== currentPlayerId) {
      if (callback) callback({ ok: false, error: 'Solo puedes edificar durante tu turno.' });
      return;
    }

    const tile = BOARD_TILES[tileId];
    const prop = room.properties[tileId];
    if (!tile || tile.type !== 'property' || !prop || prop.ownerId !== current.id) return;

    if (prop.mortgaged) {
      if (callback) callback({ ok: false, error: 'No puedes construir en una propiedad hipotecada.' });
      return;
    }

    if (!ownsFullGroup(room, current.id, tile.group)) {
      if (callback) callback({ ok: false, error: 'Debes ser dueño de todas las propiedades de este color para construir.' });
      return;
    }

    if (prop.houses >= 5) {
      if (callback) callback({ ok: false, error: 'Ya alcanzaste el nivel máximo (Torre / Hotel) en esta propiedad.' });
      return;
    }

    if (current.money < tile.houseCost) {
      if (callback) callback({ ok: false, error: `Necesitas ${formatCLP(tile.houseCost)} para construir aquí.` });
      return;
    }

    current.money -= tile.houseCost;
    prop.houses += 1;
    const buildName = prop.houses === 5 ? 'una Torre (Hotel) 🏙️' : `Casa #${prop.houses} 🏠`;
    addLog(room, `🏗️ ${current.name} construyó ${buildName} en ${tile.name} por ${formatCLP(tile.houseCost)}.`, 'buy');
    broadcastRoomState(room);
    if (callback) callback({ ok: true });
  });

  // Vender Casa
  socket.on('sell_house', ({ tileId }, callback) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.status !== 'playing') return;
    const player = room.players.find((p) => p.id === currentPlayerId);
    if (!player) return;

    const tile = BOARD_TILES[tileId];
    const prop = room.properties[tileId];
    if (!tile || !prop || prop.ownerId !== player.id || prop.houses <= 0) return;

    const refund = Math.floor(tile.houseCost / 2);
    prop.houses -= 1;
    player.money += refund;
    addLog(room, `🔨 ${player.name} vendió una edificación en ${tile.name} y recibió ${formatCLP(refund)}.`, 'info');
    broadcastRoomState(room);
    if (callback) callback({ ok: true });
  });

  // Hipotecar / Deshipotecar propiedad en BancoEstado
  socket.on('toggle_mortgage', ({ tileId }, callback) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.status !== 'playing') return;
    const player = room.players.find((p) => p.id === currentPlayerId);
    if (!player) return;

    const tile = BOARD_TILES[tileId];
    const prop = room.properties[tileId];
    if (!tile || !prop || prop.ownerId !== player.id) return;

    if (!prop.mortgaged) {
      if (prop.houses > 0) {
        if (callback) callback({ ok: false, error: 'Primero debes vender las casas antes de hipotecar.' });
        return;
      }
      const mortgageValue = Math.floor(tile.price / 2);
      prop.mortgaged = true;
      player.money += mortgageValue;
      addLog(room, `🏦 ${player.name} hipotecó ${tile.name} en BancoEstado por ${formatCLP(mortgageValue)}.`, 'warning');
    } else {
      const unmortgageCost = Math.floor(tile.price * 0.55);
      if (player.money < unmortgageCost) {
        if (callback) callback({ ok: false, error: `Necesitas ${formatCLP(unmortgageCost)} (incluye 10% interés) para levantar la hipoteca.` });
        return;
      }
      player.money -= unmortgageCost;
      prop.mortgaged = false;
      addLog(room, `🏦 ${player.name} levantó la hipoteca de ${tile.name} pagando ${formatCLP(unmortgageCost)}.`, 'success');
    }

    broadcastRoomState(room);
    if (callback) callback({ ok: true });
  });

  // Proponer negocio / trueque entre jugadores
  socket.on('propose_trade', ({ targetPlayerId, offerTileId, requestTileId, offerMoney, requestMoney }, callback) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.status !== 'playing') return;
    const fromPlayer = room.players.find((p) => p.id === currentPlayerId);
    const toPlayer = room.players.find((p) => p.id === targetPlayerId);
    if (!fromPlayer || !toPlayer || fromPlayer.bankrupt || toPlayer.bankrupt) return;

    const cleanOfferMoney = Math.max(0, Number(offerMoney) || 0);
    const cleanRequestMoney = Math.max(0, Number(requestMoney) || 0);

    if (cleanOfferMoney > fromPlayer.money) {
      if (callback) callback({ ok: false, error: 'No tienes suficiente dinero para ofrecer ese monto.' });
      return;
    }

    const trade = {
      id: 'tr_' + Date.now(),
      fromId: fromPlayer.id,
      fromName: fromPlayer.name,
      toId: toPlayer.id,
      toName: toPlayer.name,
      offerTileId: offerTileId ? Number(offerTileId) : null,
      requestTileId: requestTileId ? Number(requestTileId) : null,
      offerMoney: cleanOfferMoney,
      requestMoney: cleanRequestMoney,
      status: 'pending'
    };

    room.trades.push(trade);
    addLog(room, `🤝 ${fromPlayer.name} envió una oferta comercial a ${toPlayer.name}.`, 'info');

    // Si el destinatario es un Bot, evalúa automáticamente la oferta
    if (toPlayer.isBot) {
      setTimeout(() => {
        const offerVal =
          trade.offerMoney + (trade.offerTileId ? BOARD_TILES[trade.offerTileId]?.price || 0 : 0);
        const reqVal =
          trade.requestMoney + (trade.requestTileId ? BOARD_TILES[trade.requestTileId]?.price || 0 : 0);
        if (offerVal >= reqVal * 1.1 && toPlayer.money >= trade.requestMoney) {
          executeTrade(room, trade.id, true);
        } else {
          executeTrade(room, trade.id, false);
        }
        broadcastRoomState(room);
      }, 1200);
    }

    broadcastRoomState(room);
    if (callback) callback({ ok: true });
  });

  socket.on('respond_trade', ({ tradeId, accept }, callback) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.status !== 'playing') return;
    const trade = room.trades.find((t) => t.id === tradeId);
    if (!trade || trade.toId !== currentPlayerId) return;

    const res = executeTrade(room, tradeId, accept);
    broadcastRoomState(room);
    if (callback) callback(res);
  });

  // Terminar Turno
  socket.on('end_turn', () => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.status !== 'playing') return;
    const current = getCurrentPlayer(room);
    if (!current || current.id !== currentPlayerId) return;
    if (room.turnPhase !== 'END_TURN') return;

    // Si sacó dobles y no está en la comisaría, vuelve a tirar
    if (room.doublesCount > 0 && !current.inJail && !current.bankrupt) {
      room.turnPhase = 'ROLL';
      addLog(room, `🎲 ¡Como sacó dobles, ${current.name} tiene turno extra para lanzar!`, 'turn');
      broadcastRoomState(room);
      return;
    }

    advanceTurn(room);
    broadcastRoomState(room);
  });

  // Chat en tiempo real
  socket.on('send_chat', ({ message }) => {
    const room = rooms.get(currentRoomCode);
    if (!room) return;
    const player = room.players.find((p) => p.id === currentPlayerId);
    if (!player) return;

    const cleanMsg = (message || '').trim().slice(0, 200);
    if (!cleanMsg) return;

    room.chat.push({
      id: Date.now() + '-' + Math.random(),
      playerId: player.id,
      playerName: player.name,
      avatar: player.avatar,
      text: cleanMsg,
      time: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    });

    if (room.chat.length > 50) room.chat.shift();
    broadcastRoomState(room);
  });

  // ==========================================================================
  // EVENTOS SOCKET.IO DE GAMEPARTY WEB (CRUCIGRAMA PARTY & DOODLE PARTY)
  // ==========================================================================
  socket.on('create-room', (data, callback) => {
    try {
      const room = gamePartyManager.createRoom({
        hostSocketId: socket.id,
        nickname: data?.nickname,
        avatar: data?.avatar
      });
      socket.join(room.code);
      if (typeof callback === 'function') {
        callback({ success: true, roomCode: room.code, room });
      } else {
        socket.emit('room-state', room);
      }
    } catch (err) {
      if (typeof callback === 'function') {
        callback({ success: false, error: 'Error al crear la sala.' });
      }
    }
  });

  socket.on('vote-game', ({ gameType }) => {
    const res = gamePartyManager.voteGame(socket.id, gameType);
    if (res) {
      io.to(res.roomCode).emit('room-state', res.room);
    }
  });

  socket.on('start-game', async (options, callback) => {
    try {
      const res = await gamePartyManager.startGame(socket.id, options);
      if (res.error) {
        if (typeof callback === 'function') callback({ success: false, error: res.error });
        return;
      }
      io.to(res.roomCode).emit('room-state', res.room);
      if (typeof callback === 'function') callback({ success: true, room: res.room });
    } catch (err) {
      if (typeof callback === 'function') callback({ success: false, error: err.message });
    }
  });

  socket.on('return-to-lobby', (callback) => {
    const res = gamePartyManager.returnToLobby(socket.id);
    if (res?.error) {
      if (typeof callback === 'function') callback({ success: false, error: res.error });
      return;
    }
    if (res) {
      io.to(res.roomCode).emit('room-state', res.room);
      if (typeof callback === 'function') callback({ success: true, room: res.room });
    }
  });

  socket.on('join-room', (data, callback) => {
    try {
      const result = gamePartyManager.joinRoom({
        roomCode: data?.roomCode,
        socketId: socket.id,
        nickname: data?.nickname,
        avatar: data?.avatar
      });
      if (result.error) {
        if (typeof callback === 'function') {
          callback({ success: false, error: result.error });
        } else {
          socket.emit('error-message', { message: result.error });
        }
        return;
      }
      const { room } = result;
      socket.join(room.code);
      if (typeof callback === 'function') {
        callback({ success: true, roomCode: room.code, room });
      }
      io.to(room.code).emit('room-state', room);

      const pictionary = gamePartyManager.getPictionaryByRoomCode(room.code);
      if (room.gameType === 'pictionary' && pictionary) {
        socket.emit('pictionary-state', pictionary.getPublicState());
      }
    } catch (err) {
      if (typeof callback === 'function') {
        callback({ success: false, error: 'Error al unirse a la sala.' });
      }
    }
  });

  socket.on('cursor-move', ({ row, col, direction }) => {
    const result = gamePartyManager.updateCursor(socket.id, { row, col, direction });
    if (result) {
      socket.to(result.roomCode).emit('player-cursor', {
        playerId: result.playerId,
        cursor: result.cursor
      });
    }
  });

  socket.on('cell-update', ({ row, col, letter }) => {
    const result = gamePartyManager.updateCell(socket.id, { row, col, letter });
    if (result) {
      io.to(result.roomCode).emit('cell-updated', {
        row: result.row,
        col: result.col,
        cell: result.cell,
        players: result.players,
        solvedClues: result.solvedClues
      });
      if (result.newWordsSolved.length > 0) {
        io.to(result.roomCode).emit('words-solved', {
          words: result.newWordsSolved,
          players: result.players
        });
      }
      if (result.isGameOver) {
        io.to(result.roomCode).emit('game-over', {
          players: result.players,
          endTime: Date.now()
        });
      }
    }
  });

  socket.on('request-hint', ({ row, col }) => {
    const result = gamePartyManager.requestHint(socket.id, { row, col });
    if (result) {
      io.to(result.roomCode).emit('cell-updated', {
        row: result.row,
        col: result.col,
        cell: result.cell,
        players: result.players,
        solvedClues: result.solvedClues
      });
      if (result.newWordsSolved.length > 0) {
        io.to(result.roomCode).emit('words-solved', {
          words: result.newWordsSolved,
          players: result.players
        });
      }
      if (result.isGameOver) {
        io.to(result.roomCode).emit('game-over', {
          players: result.players,
          endTime: Date.now()
        });
      }
    }
  });

  socket.on('chat-message', ({ text }) => {
    const result = gamePartyManager.addMessage(socket.id, text);
    if (result) {
      io.to(result.roomCode).emit('new-chat-message', result.message);
    }
  });

  socket.on('quick-reaction', ({ emoji }) => {
    const result = gamePartyManager.addReaction(socket.id, emoji);
    if (result) {
      io.to(result.roomCode).emit('floating-reaction', result.reaction);
    }
  });

  socket.on('restart-game', async (options) => {
    try {
      const result = await gamePartyManager.restartGame(socket.id, options);
      if (result) {
        io.to(result.roomCode).emit('room-state', result.room);
      }
    } catch (err) {
      console.error('[RestartGame Error]:', err.message);
    }
  });

  socket.on('pictionary-choose-word', ({ word, category, difficulty }) => {
    const pictionary = gamePartyManager.getPictionaryBySocketId(socket.id);
    if (pictionary) {
      pictionary.selectWord(word, category, difficulty);
    }
  });

  socket.on('pictionary-draw-stroke', (stroke) => {
    const pictionary = gamePartyManager.getPictionaryBySocketId(socket.id);
    if (pictionary) {
      pictionary.addStroke(socket.id, stroke);
    }
  });

  socket.on('pictionary-clear-canvas', () => {
    const pictionary = gamePartyManager.getPictionaryBySocketId(socket.id);
    if (pictionary) {
      pictionary.clearCanvas(socket.id);
    }
  });

  socket.on('pictionary-undo', () => {
    const pictionary = gamePartyManager.getPictionaryBySocketId(socket.id);
    if (pictionary) {
      pictionary.undoStroke(socket.id);
    }
  });

  socket.on('pictionary-guess', ({ text }) => {
    const pictionary = gamePartyManager.getPictionaryBySocketId(socket.id);
    if (pictionary) {
      pictionary.handleGuess(socket.id, text);
    }
  });

  socket.on('pictionary-restart', () => {
    const pictionary = gamePartyManager.getPictionaryBySocketId(socket.id);
    if (pictionary) {
      pictionary.restartGame();
    }
  });

  socket.on('disconnect', () => {
    // Limpiar sesión de GameParty si estaba en una sala de Crucigrama o Doodle Party
    const gpLeave = gamePartyManager.leaveRoom(socket.id);
    if (gpLeave && !gpLeave.isEmpty) {
      io.to(gpLeave.roomCode).emit('room-state', gpLeave.room);
    }

    if (!currentRoomCode || !rooms.has(currentRoomCode)) return;
    const room = rooms.get(currentRoomCode);
    const player = room.players.find((p) => p.id === currentPlayerId);
    if (player) {
      player.connected = false;
      broadcastRoomState(room);
    }
  });
});

function executeTrade(room, tradeId, accept) {
  const idx = room.trades.findIndex((t) => t.id === tradeId);
  if (idx === -1) return { ok: false, error: 'Oferta ya no existe.' };
  const trade = room.trades[idx];
  room.trades.splice(idx, 1);

  const fromPlayer = room.players.find((p) => p.id === trade.fromId);
  const toPlayer = room.players.find((p) => p.id === trade.toId);
  if (!fromPlayer || !toPlayer) return { ok: false };

  if (!accept) {
    addLog(room, `❌ ${toPlayer.name} rechazó la oferta comercial de ${fromPlayer.name}.`, 'info');
    return { ok: true };
  }

  if (fromPlayer.money < trade.offerMoney || toPlayer.money < trade.requestMoney) {
    addLog(room, `⚠️ El trato entre ${fromPlayer.name} y ${toPlayer.name} falló por falta de fondos.`, 'warning');
    return { ok: false, error: 'Fondos insuficientes para concretar el trato.' };
  }

  if (trade.offerTileId && room.properties[trade.offerTileId]?.ownerId !== fromPlayer.id) {
    return { ok: false, error: 'La propiedad ofrecida ya no pertenece al ofertante.' };
  }
  if (trade.requestTileId && room.properties[trade.requestTileId]?.ownerId !== toPlayer.id) {
    return { ok: false, error: 'La propiedad solicitada ya no pertenece al destinatario.' };
  }

  // Transferir dinero
  fromPlayer.money = fromPlayer.money - trade.offerMoney + trade.requestMoney;
  toPlayer.money = toPlayer.money - trade.requestMoney + trade.offerMoney;

  // Transferir propiedades
  if (trade.offerTileId) {
    room.properties[trade.offerTileId].ownerId = toPlayer.id;
  }
  if (trade.requestTileId) {
    room.properties[trade.requestTileId].ownerId = fromPlayer.id;
  }

  addLog(room, `🤝 ¡Trato cerrado entre ${fromPlayer.name} y ${toPlayer.name}!`, 'success');
  return { ok: true };
}

// ============================================================================
// MOTOR DEL JUEGO "¿CUÁL ES?" (AGILIDAD VISUAL Y COINCIDENCIAS)
// ============================================================================
function startCualEsGame(room) {
  if (room.cualEsBotTimer) {
    clearInterval(room.cualEsBotTimer);
    room.cualEsBotTimer = null;
  }

  const deck = generateCualEsDeck();
  const playerCards = {};
  const scores = {};
  const penalties = {};

  room.players.forEach((p) => {
    playerCards[p.id] = deck.pop();
    scores[p.id] = 1; // 1 carta inicial ganada
    penalties[p.id] = 0;
  });

  const centerCard = deck.pop();

  room.cualEs = {
    deck, // interno en el servidor
    centerCard,
    remainingDeckCount: deck.length,
    playerCards,
    scores,
    penalties,
    lastMatch: null
  };

  addLog(
    room,
    `🔍 ¡Comenzó "¿Cuál es?" con ${room.players.length} jugadores! Encuentra el dibujo repetido entre TU CARTA y la CARTA CENTRAL. ¡Cuidado: equivocarse da 3 segundos de bloqueo!`,
    'success'
  );

  // Si hay bots en la partida, simular su agilidad visual
  const hasBots = room.players.some((p) => p.isBot);
  if (hasBots) {
    room.cualEsBotTimer = setInterval(() => {
      if (!rooms.has(room.code) || room.status !== 'playing' || room.gameType !== 'cual_es') {
        clearInterval(room.cualEsBotTimer);
        room.cualEsBotTimer = null;
        return;
      }
      const bots = room.players.filter((p) => p.isBot);
      if (!bots.length) return;
      const randomBot = bots[Math.floor(Math.random() * bots.length)];
      const now = Date.now();
      if ((room.cualEs.penalties[randomBot.id] || 0) > now) return;

      const botCard = room.cualEs.playerCards[randomBot.id] || [];
      const center = room.cualEs.centerCard || [];
      const matchSym = botCard.find((s) => center.includes(s));
      if (matchSym !== undefined && Math.random() < 0.45) {
        handleCualEsClick(room, randomBot, matchSym);
      }
    }, 2800);
  }
}

function handleCualEsClick(room, player, symbolId) {
  if (!room.cualEs || room.status !== 'playing') {
    return { ok: false, error: 'La partida no está activa.' };
  }

  const now = Date.now();
  const penaltyUntil = room.cualEs.penalties[player.id] || 0;

  if (now < penaltyUntil) {
    const remainingSec = ((penaltyUntil - now) / 1000).toFixed(1);
    return {
      ok: false,
      penalized: true,
      penaltyUntil,
      error: `⏳ Estás penalizado por ${remainingSec}s más.`
    };
  }

  const playerCard = room.cualEs.playerCards[player.id] || [];
  const centerCard = room.cualEs.centerCard || [];

  const isInPlayerCard = playerCard.includes(symbolId);
  const isInCenterCard = centerCard.includes(symbolId);
  const symObj = CUAL_ES_SYMBOLS[symbolId] || { icon: '❓', name: 'Símbolo' };

  // ¡ACIERTO! El símbolo está tanto en la carta del jugador como en la carta central
  if (isInPlayerCard && isInCenterCard) {
    // El jugador se lleva la carta central como su nueva carta activa
    room.cualEs.playerCards[player.id] = centerCard;
    room.cualEs.scores[player.id] = (room.cualEs.scores[player.id] || 0) + 1;
    room.cualEs.lastMatch = {
      playerId: player.id,
      playerName: player.name,
      playerAvatar: player.avatar,
      symbol: symObj,
      timestamp: now
    };

    io.to(room.code).emit('cual_es_point', {
      playerId: player.id,
      playerName: player.name,
      playerAvatar: player.avatar,
      symbol: symObj,
      score: room.cualEs.scores[player.id]
    });

    // Sacar nueva carta central o finalizar si se acabó el mazo
    if (room.cualEs.deck.length > 0) {
      room.cualEs.centerCard = room.cualEs.deck.pop();
      room.cualEs.remainingDeckCount = room.cualEs.deck.length;
    } else {
      room.cualEs.centerCard = [];
      room.cualEs.remainingDeckCount = 0;
      finishCualEsGame(room);
    }

    broadcastRoomState(room);
    return { ok: true, match: true, symbol: symObj };
  }

  // Ignorar clics residuales durante los 0.5s de transición de carta sobre el símbolo recién ganado
  if (
    room.cualEs.lastMatch &&
    now - room.cualEs.lastMatch.timestamp < 500 &&
    room.cualEs.lastMatch.symbol?.id === symbolId
  ) {
    return { ok: false, match: false, penalized: false, transitioning: true };
  }

  // ¡ERROR! El jugador pulsó un dibujo que NO se repite entre su carta y la central -> 3 SEGUNDOS DE PENALIZACIÓN
  const newPenaltyUntil = now + 3000;
  room.cualEs.penalties[player.id] = newPenaltyUntil;

  io.to(room.code).emit('cual_es_penalty', {
    playerId: player.id,
    playerName: player.name,
    symbol: symObj,
    penaltyUntil: newPenaltyUntil
  });

  broadcastRoomState(room);
  return {
    ok: false,
    match: false,
    penalized: true,
    penaltyUntil: newPenaltyUntil,
    error: `❌ ¡"${symObj.icon} ${symObj.name}" no coincide! 3 segundos de penalización.`
  };
}

function finishCualEsGame(room) {
  if (room.cualEsBotTimer) {
    clearInterval(room.cualEsBotTimer);
    room.cualEsBotTimer = null;
  }

  room.status = 'finished';
  let bestPlayer = room.players[0];
  let bestScore = -1;

  room.players.forEach((p) => {
    const sc = room.cualEs.scores[p.id] || 0;
    if (sc > bestScore) {
      bestScore = sc;
      bestPlayer = p;
    }
  });

  room.winner = bestPlayer;
  addLog(
    room,
    `🏆 ¡Fin del mazo en "¿Cuál es?"! Ganador: ${bestPlayer.avatar.icon} ${bestPlayer.name} con ${bestScore} cartas ganadas.`,
    'success'
  );
}

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`🚇 GRAN SANTIAGO ONLINE - Servidor Activo`);
    console.log(`🌐 Local:   http://localhost:${PORT}`);
    console.log(`======================================================\n`);
  });
}

module.exports = { app, server, io, rooms };
