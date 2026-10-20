/**
 * Cliente Oficial "Gran Santiago Online" (2 a 8 Jugadores)
 * Economía en Pesos Chilenos ($ CLP)
 */

const socket = io();

// Formateador oficial de Pesos Chilenos ($ CLP)
const clpFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0
});

function formatCLP(amount) {
  return clpFormatter.format(Number(amount) || 0);
}

function formatCompactCLP(amount) {
  const n = Number(amount) || 0;
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1).replace('.0', '')}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}k`;
  return `$${n}`;
}

// Estado global del cliente
let boardMeta = {
  COLOR_GROUPS: {},
  PLAYER_AVATARS: [],
  BOARD_TILES: []
};

let myPlayerId = localStorage.getItem('gso_playerId') || ('p_' + Math.random().toString(36).substring(2, 10));
localStorage.setItem('gso_playerId', myPlayerId);

let selectedAvatarId = 'condorito';
let currentRoomState = null;
let lastKnownTurnPlayerId = null;
let turnOverlayTimer = null;
let displayedPositions = {}; // { [playerId]: tileIndex }
let walkingTimers = {};      // { [playerId]: intervalId }
let hoppingPlayers = new Set();
let isDiceRollingAnim = false;
let pendingRoomStateAfterDice = null;
let pendingCardAfterDice = null;
let diceIntervalId = null;
let inspectedTileId = null;
let soundEnabled = true;
let musicEnabled = true;
let bgmIntervalId = null;
let bgmNoteIndex = 0;

// Efectos de sonido y Música de Fondo sintetizados (Web Audio API sin archivos externos)
const audioCtx = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)
  ? new (window.AudioContext || window.webkitAudioContext)()
  : null;

// Melodía alegre estilo Juego de Mesa / Lounge Santiaguino
const BGM_MELODY = [
  { f: 261.63, b: 196.00 }, // C4 + G3
  { f: 329.63, b: 0 },      // E4
  { f: 392.00, b: 130.81 }, // G4 + C3
  { f: 523.25, b: 0 },      // C5
  { f: 392.00, b: 196.00 }, // G4 + G3
  { f: 329.63, b: 0 },      // E4
  { f: 349.23, b: 174.61 }, // F4 + F3
  { f: 440.00, b: 0 },      // A4
  { f: 523.25, b: 130.81 }, // C5 + C3
  { f: 440.00, b: 0 },      // A4
  { f: 392.00, b: 196.00 }, // G4 + G3
  { f: 329.63, b: 0 },      // E4
  { f: 293.66, b: 146.83 }, // D4 + D3
  { f: 349.23, b: 0 },      // F4
  { f: 392.00, b: 196.00 }, // G4 + G3
  { f: 493.88, b: 0 }       // B4
];

function startBackgroundMusic() {
  if (!musicEnabled || !audioCtx || bgmIntervalId) return;
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch (_) {}

  bgmIntervalId = setInterval(() => {
    if (!musicEnabled || !audioCtx || audioCtx.state !== 'running') return;
    const step = BGM_MELODY[bgmNoteIndex % BGM_MELODY.length];
    bgmNoteIndex += 1;

    try {
      // Nota melódica suave
      if (step.f) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(step.f, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.018, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0008, audioCtx.currentTime + 0.34);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      }
      // Bajo suave de acompañamiento
      if (step.b) {
        const bass = audioCtx.createOscillator();
        const bGain = audioCtx.createGain();
        bass.type = 'triangle';
        bass.frequency.setValueAtTime(step.b, audioCtx.currentTime);
        bGain.gain.setValueAtTime(0.022, audioCtx.currentTime);
        bGain.gain.exponentialRampToValueAtTime(0.0008, audioCtx.currentTime + 0.45);
        bass.connect(bGain);
        bGain.connect(audioCtx.destination);
        bass.start();
        bass.stop(audioCtx.currentTime + 0.46);
      }
    } catch (_) {}
  }, 380);
}

function stopBackgroundMusic() {
  if (bgmIntervalId) {
    clearInterval(bgmIntervalId);
    bgmIntervalId = null;
  }
}

function playTone(freq = 440, duration = 0.12, type = 'sine') {
  if (!soundEnabled || !audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (_) {}
}

function playSoundEffect(kind) {
  if (kind === 'dice') {
    playTone(320, 0.08, 'triangle');
    setTimeout(() => playTone(480, 0.1, 'triangle'), 90);
  } else if (kind === 'buy') {
    playTone(523.25, 0.1, 'sine');
    setTimeout(() => playTone(659.25, 0.12, 'sine'), 100);
    setTimeout(() => playTone(783.99, 0.18, 'sine'), 210);
  } else if (kind === 'turn') {
    playTone(587.33, 0.12, 'sine');
    setTimeout(() => playTone(783.99, 0.16, 'sine'), 110);
  } else if (kind === 'card') {
    playTone(440, 0.08, 'triangle');
    setTimeout(() => playTone(554.37, 0.09, 'triangle'), 80);
    setTimeout(() => playTone(659.25, 0.15, 'sine'), 165);
  }
}

// Sonido de paso individual por cada casilla caminada (con tono ascendente)
function playStepSound(stepIndex = 0) {
  const baseFreq = 290 + Math.min(stepIndex * 24, 360);
  playTone(baseFreq, 0.075, 'triangle');
}

function renderTokensOnBoard(state) {
  if (!state || !boardMeta.BOARD_TILES.length) return;
  boardMeta.BOARD_TILES.forEach((tile) => {
    const tokenContainer = document.getElementById(`tokens-tile-${tile.id}`);
    if (tokenContainer) tokenContainer.innerHTML = '';
  });

  state.players.forEach((p) => {
    if (p.bankrupt) return;
    const pos = displayedPositions[p.id] !== undefined ? displayedPositions[p.id] : p.position;
    const tokenContainer = document.getElementById(`tokens-tile-${pos}`);
    if (tokenContainer) {
      const tok = document.createElement('div');
      const isMe = p.id === myPlayerId;
      const isHopping = hoppingPlayers.has(p.id);
      tok.className = 'board-token' +
        (isMe ? ' is-me-token' : '') +
        (isHopping ? ' token-hopping' : '');
      tok.style.borderColor = p.avatar.color;
      tok.title = `${p.name} (${formatCLP(p.money)})`;
      tok.textContent = p.avatar.icon;
      tokenContainer.appendChild(tok);
    }
  });
}

function animatePlayerMovement(player, fromPos, toPos) {
  if (walkingTimers[player.id]) {
    clearInterval(walkingTimers[player.id]);
    delete walkingTimers[player.id];
  }

  // Calcular la ruta casilla por casilla
  const steps = [];
  const forwardDist = (toPos - fromPos + 40) % 40;
  const backwardDist = (fromPos - toPos + 40) % 40;

  if (forwardDist === 0) {
    displayedPositions[player.id] = toPos;
    renderTokensOnBoard(currentRoomState);
    return;
  }

  // Si retrocede 3 casillas (ej: Taco en la Alameda)
  if (backwardDist <= 4 && forwardDist > 30) {
    for (let i = 1; i <= backwardDist; i++) {
      steps.push((fromPos - i + 40) % 40);
    }
  } else {
    for (let i = 1; i <= forwardDist; i++) {
      steps.push((fromPos + i) % 40);
    }
  }

  let stepIdx = 0;
  walkingTimers[player.id] = setInterval(() => {
    if (stepIdx >= steps.length) {
      clearInterval(walkingTimers[player.id]);
      delete walkingTimers[player.id];
      hoppingPlayers.delete(player.id);
      renderTokensOnBoard(currentRoomState);
      return;
    }

    const nextTileId = steps[stepIdx];
    displayedPositions[player.id] = nextTileId;
    hoppingPlayers.add(player.id);

    // Sonido por cada cuadro avanzado
    playStepSound(stepIdx);

    // Iluminar brevemente la casilla pisada
    const tileEl = document.getElementById(`board-tile-${nextTileId}`);
    if (tileEl) {
      tileEl.classList.add('tile-step-highlight');
      setTimeout(() => tileEl.classList.remove('tile-step-highlight'), 240);
    }

    renderTokensOnBoard(currentRoomState);
    stepIdx += 1;
  }, 190);
}

// Detección de transición discreta de display y cierre animado de <dialog> (Top Layer)
let supportsDisplayTransition;
function canTransitionDisplay() {
  if (supportsDisplayTransition !== undefined) return supportsDisplayTransition;
  if (!window.CSS?.supports?.('transition-behavior', 'allow-discrete') || !document.body) {
    return false;
  }
  const probe = document.createElement('div');
  probe.style.cssText = 'transition: display 1s allow-discrete !important; display: block;';
  document.body.appendChild(probe);
  getComputedStyle(probe).display;
  probe.style.display = 'none';
  supportsDisplayTransition = getComputedStyle(probe).display === 'block';
  probe.remove();
  return supportsDisplayTransition;
}

function supportsTopLayerExit() {
  return window.CSS?.supports?.('overlay', 'auto') && canTransitionDisplay();
}

async function closeTopLayer(element) {
  if (!element || !element.open) return;
  if (!supportsTopLayerExit()) {
    element.setAttribute('data-closing', '');
    const animations = element.getAnimations({ subtree: true });
    if (animations.length > 0) {
      await Promise.race([
        Promise.allSettled(animations.map((a) => a.finished)),
        new Promise((r) => setTimeout(r, 2000))
      ]);
    }
    if (!element.hasAttribute('data-closing')) return;
    element.removeAttribute('data-closing');
  }
  element.close();
}

function triggerTurnChangeAnimation(player, isMyTurn) {
  playSoundEffect('turn');
  const overlay = document.getElementById('turn-transition-overlay');
  const card = document.getElementById('turn-transition-card');
  const avatarEl = document.getElementById('tt-avatar');
  const nameEl = document.getElementById('tt-name');
  const subEl = document.getElementById('tt-sub');

  if (!overlay || !card || !player) return;

  card.style.borderTopColor = player.avatar?.color || '#2563eb';
  avatarEl.textContent = player.avatar?.icon || '🎲';
  nameEl.textContent = isMyTurn ? `¡Es tu turno, ${player.name}!` : `Turno de ${player.name}`;
  subEl.textContent = isMyTurn
    ? '¡Lanza los dados y conquista las comunas de Santiago!'
    : `Saldo disponible: ${formatCLP(player.money)}`;

  overlay.classList.remove('hidden');
  // Reiniciar la animación CSS
  card.style.animation = 'none';
  overlay.style.animation = 'none';
  void card.offsetWidth;
  card.style.animation = '';
  overlay.style.animation = '';

  if (turnOverlayTimer) clearTimeout(turnOverlayTimer);
  turnOverlayTimer = setTimeout(() => {
    overlay.classList.add('hidden');
  }, 1600);
}

function showToast(text) {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = text;
  container.appendChild(el);
  setTimeout(() => {
    el.remove();
  }, 3600);
}

// Posición en la grilla 11x11 para cada una de las 40 casillas
function getGridPosition(tileId) {
  if (tileId >= 0 && tileId <= 10) {
    return { row: 11, col: 11 - tileId };
  }
  if (tileId >= 11 && tileId <= 20) {
    return { row: 11 - (tileId - 10), col: 1 };
  }
  if (tileId >= 21 && tileId <= 30) {
    return { row: 1, col: 1 + (tileId - 20) };
  }
  return { row: 1 + (tileId - 30), col: 11 };
}

// Fallback para light-dismiss y cierre animado en navegadores
function setupDialogLightDismiss(dialog) {
  if (!dialog) return;
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeTopLayer(dialog);
  });
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isDialogContent = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );
      if (isDialogContent) return;
      closeTopLayer(dialog);
    });
  }
}

// Inicialización al cargar la página
async function initApp() {
  setupDialogLightDismiss(document.getElementById('property-dialog'));
  setupDialogLightDismiss(document.getElementById('trade-dialog'));
  setupDialogLightDismiss(document.getElementById('drawn-card-dialog'));

  const res = await fetch('/api/board');
  boardMeta = await res.json();

  renderAvatarSelector();
  buildBoardDOM();
  bindUIEvents();

  // Autocompletar nombre guardado o código por URL (?sala=STGO-XXXX)
  const savedName = localStorage.getItem('gso_playerName');
  if (savedName) {
    document.getElementById('input-player-name').value = savedName;
  }

  const params = new URLSearchParams(window.location.search);
  const roomParam = params.get('sala');
  if (roomParam) {
    document.getElementById('input-room-code').value = roomParam.toUpperCase();
    showToast(`Código de invitación detectado: ${roomParam.toUpperCase()}`);
  }
}

function renderAvatarSelector() {
  const container = document.getElementById('avatar-selector');
  container.innerHTML = '';
  boardMeta.PLAYER_AVATARS.forEach((av, idx) => {
    if (idx === 0) selectedAvatarId = av.id;
    const div = document.createElement('div');
    div.className = 'avatar-option' + (av.id === selectedAvatarId ? ' selected' : '');
    div.innerHTML = `
      <span class="av-icon">${av.icon}</span>
      <span class="av-name">${av.name}</span>
    `;
    div.addEventListener('click', () => {
      selectedAvatarId = av.id;
      document.querySelectorAll('.avatar-option').forEach((el) => el.classList.remove('selected'));
      div.classList.add('selected');
    });
    container.appendChild(div);
  });
}

function buildBoardDOM() {
  const grid = document.getElementById('board-grid');
  // Eliminar casillas previas conservando .board-center
  grid.querySelectorAll('.board-tile').forEach((el) => el.remove());

  boardMeta.BOARD_TILES.forEach((tile) => {
    const pos = getGridPosition(tile.id);
    const tileEl = document.createElement('div');
    const isCorner = [0, 10, 20, 30].includes(tile.id);
    tileEl.className = 'board-tile' + (isCorner ? ' corner-tile' : '');
    tileEl.id = `board-tile-${tile.id}`;
    tileEl.style.gridRow = pos.row;
    tileEl.style.gridColumn = pos.col;

    const groupInfo = tile.group ? boardMeta.COLOR_GROUPS[tile.group] : null;
    const specialColors = {
      chance: '#f97316',
      community: '#16a34a',
      tax: '#475569'
    };
    const barColor = groupInfo ? groupInfo.color : (specialColors[tile.type] || '#64748b');

    if (isCorner) {
      tileEl.innerHTML = `
        <div class="tile-icon">${tile.icon || '📍'}</div>
        <div class="tile-name">${tile.shortName || tile.name}</div>
        <div class="tile-tokens" id="tokens-tile-${tile.id}"></div>
      `;
    } else {
      const hasBadgeIcon = ['station', 'utility', 'chance', 'community', 'tax'].includes(tile.type);
      const barInitialIcon = tile.type === 'station' ? '🚇' : (tile.type === 'utility' ? (tile.icon || '⚡') : '');
      tileEl.innerHTML = `
        <div class="tile-color-bar" id="bar-tile-${tile.id}" style="background:${barColor}">${barInitialIcon}</div>
        <div class="tile-name">${tile.shortName || tile.name}</div>
        ${tile.icon ? `<div class="${hasBadgeIcon ? 'tile-center-badge' : 'tile-icon'}" style="border-color:${barColor}">${tile.icon}</div>` : ''}
        <div class="tile-price">${tile.price ? formatCompactCLP(tile.price) : (tile.taxAmount ? '-' + formatCompactCLP(tile.taxAmount) : '')}</div>
        <div class="tile-tokens" id="tokens-tile-${tile.id}"></div>
        <div class="tile-owner-dot hidden" id="owner-dot-${tile.id}"></div>
        <div class="tile-mortgaged-tag hidden" id="mortgaged-tag-${tile.id}">HIPOTECADA</div>
      `;
    }

    tileEl.addEventListener('click', () => openPropertyModal(tile.id));
    grid.appendChild(tileEl);
  });
}

function switchScreen(screenId) {
  document.querySelectorAll('.screen').forEach((sc) => sc.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

function bindUIEvents() {
  // Crear sala
  document.getElementById('btn-create-room').addEventListener('click', () => {
    const playerName = document.getElementById('input-player-name').value.trim() || 'Santiaguino';
    const startingMoney = Number(document.getElementById('select-starting-money').value) || 1500000;
    localStorage.setItem('gso_playerName', playerName);

    socket.emit(
      'create_room',
      { playerName, avatarId: selectedAvatarId, startingMoney, playerId: myPlayerId },
      (res) => {
        if (res && res.ok) {
          window.history.replaceState({}, '', `?sala=${res.roomCode}`);
        } else {
          showToast(res?.error || 'Error al crear sala');
        }
      }
    );
  });

  // Unirse por código
  document.getElementById('btn-join-code').addEventListener('click', () => {
    const code = document.getElementById('input-room-code').value.trim().toUpperCase();
    if (!code) {
      showToast('Ingresa un código de sala (ej: STGO-XXXX)');
      return;
    }
    joinRoomByCode(code);
  });

  document.getElementById('btn-refresh-rooms').addEventListener('click', () => {
    socket.emit('get_public_rooms');
    showToast('Lista de salas actualizada');
  });

  // Copiar link de invitación
  const copyInviteLink = () => {
    if (!currentRoomState) return;
    const url = `${window.location.origin}/?sala=${currentRoomState.code}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast(`¡Enlace copiado! Compártelo: ${url}`);
    });
  };
  document.getElementById('btn-copy-link').addEventListener('click', copyInviteLink);
  document.getElementById('btn-copy-game-link').addEventListener('click', copyInviteLink);

  document.getElementById('btn-leave-lobby').addEventListener('click', () => {
    window.location.href = '/';
  });

  // Agregar Bot en el Lobby
  document.getElementById('btn-add-bot').addEventListener('click', () => {
    socket.emit('add_bot', {}, (res) => {
      if (res && !res.ok) showToast(res.error);
    });
  });

  // Iniciar partida
  document.getElementById('btn-start-game').addEventListener('click', () => {
    socket.emit('start_game', {}, (res) => {
      if (res && !res.ok) showToast(res.error);
    });
  });

  // Controles de turno en el tablero
  document.getElementById('btn-roll-dice').addEventListener('click', () => {
    socket.emit('roll_dice');
  });

  document.getElementById('btn-pay-bail').addEventListener('click', () => {
    socket.emit('pay_bail', {}, (res) => {
      if (res && !res.ok) showToast(res.error);
    });
  });

  document.getElementById('btn-buy-prop').addEventListener('click', () => {
    playSoundEffect('buy');
    socket.emit('buy_property', {}, (res) => {
      if (res && !res.ok) showToast(res.error);
    });
  });

  document.getElementById('btn-skip-buy').addEventListener('click', () => {
    socket.emit('skip_buy');
  });

  document.getElementById('btn-end-turn').addEventListener('click', () => {
    socket.emit('end_turn');
  });

  // Iniciar música de fondo automáticamente al primer clic del usuario
  const unlockAudio = () => {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (musicEnabled) {
      startBackgroundMusic();
    }
    document.removeEventListener('click', unlockAudio);
  };
  document.addEventListener('click', unlockAudio);

  // Música de Fondo
  document.getElementById('btn-toggle-music').addEventListener('click', (e) => {
    musicEnabled = !musicEnabled;
    e.currentTarget.textContent = musicEnabled ? '🎵' : '🔕';
    if (musicEnabled) {
      startBackgroundMusic();
      showToast('🎵 Música de fondo activada');
    } else {
      stopBackgroundMusic();
      showToast('🔕 Música de fondo en pausa');
    }
  });

  // Sonido
  document.getElementById('btn-toggle-sound').addEventListener('click', (e) => {
    soundEnabled = !soundEnabled;
    e.currentTarget.textContent = soundEnabled ? '🔊' : '🔇';
    showToast(soundEnabled ? 'Efectos de sonido activados' : 'Sonido silenciado');
  });

  // Chat
  document.getElementById('chat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) return;
    socket.emit('send_chat', { message: msg });
    input.value = '';
  });

  // Modal de Propiedad
  document.getElementById('btn-close-prop-dialog').addEventListener('click', () => {
    closeTopLayer(document.getElementById('property-dialog'));
  });

  // Modal de Tarjeta Sacada
  document.getElementById('btn-close-drawn-card').addEventListener('click', () => {
    closeTopLayer(document.getElementById('drawn-card-dialog'));
  });

  document.getElementById('btn-build-house').addEventListener('click', () => {
    if (inspectedTileId === null) return;
    socket.emit('build_house', { tileId: inspectedTileId }, (res) => {
      if (res && !res.ok) showToast(res.error);
      else {
        playSoundEffect('buy');
        openPropertyModal(inspectedTileId);
      }
    });
  });

  document.getElementById('btn-sell-house').addEventListener('click', () => {
    if (inspectedTileId === null) return;
    socket.emit('sell_house', { tileId: inspectedTileId }, (res) => {
      if (res && !res.ok) showToast(res.error);
      else openPropertyModal(inspectedTileId);
    });
  });

  document.getElementById('btn-toggle-mortgage').addEventListener('click', () => {
    if (inspectedTileId === null) return;
    socket.emit('toggle_mortgage', { tileId: inspectedTileId }, (res) => {
      if (res && !res.ok) showToast(res.error);
      else openPropertyModal(inspectedTileId);
    });
  });

  // Modal de Negociación / Trueque
  document.getElementById('btn-open-trade').addEventListener('click', openTradeModal);
  document.getElementById('btn-close-trade-dialog').addEventListener('click', () => {
    closeTopLayer(document.getElementById('trade-dialog'));
  });

  document.getElementById('trade-target-player').addEventListener('change', populateTradeTargetProperties);

  document.getElementById('trade-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const targetPlayerId = document.getElementById('trade-target-player').value;
    const offerTileId = document.getElementById('trade-offer-tile').value || null;
    const requestTileId = document.getElementById('trade-request-tile').value || null;
    const offerMoney = Number(document.getElementById('trade-offer-money').value) || 0;
    const requestMoney = Number(document.getElementById('trade-request-money').value) || 0;

    socket.emit(
      'propose_trade',
      { targetPlayerId, offerTileId, requestTileId, offerMoney, requestMoney },
      (res) => {
        if (res && !res.ok) showToast(res.error);
        else {
          showToast('Oferta enviada a la Bolsa de Comercio');
          closeTopLayer(document.getElementById('trade-dialog'));
        }
      }
    );
  });
}

function joinRoomByCode(roomCode) {
  const playerName = document.getElementById('input-player-name').value.trim() || 'Inversionista';
  localStorage.setItem('gso_playerName', playerName);

  socket.emit(
    'join_room',
    { roomCode, playerName, avatarId: selectedAvatarId, playerId: myPlayerId },
    (res) => {
      if (res && res.ok) {
        window.history.replaceState({}, '', `?sala=${res.roomCode}`);
      } else {
        showToast(res?.error || 'No se pudo entrar a la sala');
      }
    }
  );
}

// Eventos de Socket.IO
socket.on('public_rooms', (roomsList) => {
  const container = document.getElementById('public-rooms-list');
  if (!roomsList || !roomsList.length) {
    container.innerHTML = `<div class="empty-state">No hay salas abiertas en este instante. ¡Crea una a la izquierda e invita a tus amigos o agrega Bots!</div>`;
    return;
  }

  container.innerHTML = '';
  roomsList.forEach((r) => {
    const item = document.createElement('div');
    item.className = 'room-item';
    item.innerHTML = `
      <div class="room-item-info">
        <strong>${r.code}</strong> — Mesa de ${r.hostName}
        <small>👥 ${r.playerCount}/${r.maxPlayers} jugadores • Capital: ${formatCLP(r.startingMoney)}</small>
      </div>
      <button class="btn btn-accent btn-sm">Unirse</button>
    `;
    item.querySelector('button').addEventListener('click', () => joinRoomByCode(r.code));
    container.appendChild(item);
  });
});

function applyIncomingRoomState(state) {
  const prevTurnId = lastKnownTurnPlayerId;
  const activePlayer = state.players[state.turnIndex];
  currentRoomState = state;

  if (state.status === 'lobby') {
    lastKnownTurnPlayerId = null;
    switchScreen('screen-lobby');
    renderLobby(state);
  } else {
    switchScreen('screen-game');
    renderGame(state);

    if (state.status === 'playing' && activePlayer && activePlayer.id !== prevTurnId) {
      lastKnownTurnPlayerId = activePlayer.id;
      triggerTurnChangeAnimation(activePlayer, activePlayer.id === myPlayerId);
      const turnBanner = document.getElementById('turn-banner');
      if (turnBanner) {
        turnBanner.classList.remove('turn-pulse');
        void turnBanner.offsetWidth;
        turnBanner.classList.add('turn-pulse');
      }
    }
  }
}

socket.on('room_state', (state) => {
  if (isDiceRollingAnim && state.status === 'playing') {
    pendingRoomStateAfterDice = state;
    return;
  }
  applyIncomingRoomState(state);
});

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

socket.on('dice_rolled', ({ dice }) => {
  isDiceRollingAnim = true;
  const d1 = document.getElementById('die-1');
  const d2 = document.getElementById('die-2');
  const rollBtn = document.getElementById('btn-roll-dice');
  if (rollBtn) rollBtn.classList.add('hidden');

  d1.classList.add('rolling');
  d2.classList.add('rolling');

  if (diceIntervalId) clearInterval(diceIntervalId);

  // Cambiar caras de los dados y sonar agitando durante 2 segundos (2000 ms)
  let tick = 0;
  diceIntervalId = setInterval(() => {
    const r1 = Math.floor(Math.random() * 6);
    const r2 = Math.floor(Math.random() * 6);
    d1.textContent = DICE_FACES[r1];
    d2.textContent = DICE_FACES[r2];
    if (tick % 2 === 0) {
      playTone(260 + (tick * 18) % 240, 0.055, 'triangle');
    }
    tick += 1;
  }, 110);

  setTimeout(() => {
    if (diceIntervalId) {
      clearInterval(diceIntervalId);
      diceIntervalId = null;
    }
    d1.textContent = DICE_FACES[(dice[0] || 1) - 1];
    d2.textContent = DICE_FACES[(dice[1] || 1) - 1];
    d1.classList.remove('rolling');
    d2.classList.remove('rolling');
    playTone(587.33, 0.14, 'sine');

    isDiceRollingAnim = false;

    if (pendingRoomStateAfterDice) {
      const st = pendingRoomStateAfterDice;
      pendingRoomStateAfterDice = null;
      applyIncomingRoomState(st);
    }

    if (pendingCardAfterDice) {
      const cd = pendingCardAfterDice;
      pendingCardAfterDice = null;
      showDrawnCardNotification(cd);
    }
  }, 1000);
});

function showDrawnCardNotification({ playerName, deckType, deckTitle, card }) {
  playSoundEffect('card');

  const isChance = deckType === 'chance';
  const headerColor = isChance ? '#f97316' : '#16a34a';

  // Actualizar banner en el centro del tablero con animación 3D Flip
  const banner = document.getElementById('last-card-banner');
  banner.classList.remove('hidden', 'card-flip-anim');
  banner.style.borderTopColor = headerColor;
  void banner.offsetWidth;
  banner.classList.add('card-flip-anim');

  const badgeEl = document.getElementById('card-banner-deck');
  badgeEl.style.color = headerColor;
  badgeEl.textContent = `${deckTitle} • ${playerName}`;
  document.getElementById('card-banner-title').textContent = card.title;
  document.getElementById('card-banner-text').textContent = card.text;

  // Abrir modal emergente de tarjeta con animación de entrada
  const cardDialog = document.getElementById('drawn-card-dialog');
  if (cardDialog) {
    document.getElementById('drawn-card-header').style.background = headerColor;
    document.getElementById('drawn-card-deck').textContent = deckTitle;
    document.getElementById('drawn-card-title').textContent = card.title;
    document.getElementById('drawn-card-icon').textContent = isChance ? '❓' : '🍀';
    document.getElementById('drawn-card-player').textContent = `Tarjeta sacada por ${playerName}`;
    document.getElementById('drawn-card-text').textContent = card.text;
    if (!cardDialog.open) cardDialog.showModal();
  }
}

socket.on('card_drawn', (payload) => {
  if (isDiceRollingAnim) {
    pendingCardAfterDice = payload;
    return;
  }
  showDrawnCardNotification(payload);
});

function renderLobby(state) {
  document.getElementById('lobby-room-code').textContent = state.code;
  document.getElementById('lobby-player-count').textContent = state.players.length;

  const isHost = state.hostId === myPlayerId;
  document.getElementById('btn-add-bot').style.display = isHost && state.players.length < 8 ? 'inline-flex' : 'none';

  const startBtn = document.getElementById('btn-start-game');
  startBtn.disabled = !isHost || state.players.length < 2;
  document.getElementById('lobby-status-hint').textContent = isHost
    ? (state.players.length >= 2
      ? `¡Listos para partir con ${state.players.length} jugadores!`
      : 'Agrega un Bot o invita a un amigo para tener mínimo 2 jugadores.')
    : 'Esperando que el anfitrión inicie la partida...';

  const grid = document.getElementById('lobby-players-grid');
  grid.innerHTML = '';

  state.players.forEach((p) => {
    const card = document.createElement('div');
    card.className = 'lobby-player-card';
    card.style.borderColor = p.avatar.color;
    card.innerHTML = `
      <span class="lp-icon">${p.avatar.icon}</span>
      <div>
        <div class="lp-name">${p.name} ${p.id === myPlayerId ? '(Tú)' : ''}</div>
        <div class="lp-role">${p.id === state.hostId ? '👑 Anfitrión' : (p.isBot ? '🤖 Bot Automático' : '🟢 Conectado')}</div>
      </div>
    `;

    if (isHost && p.id !== state.hostId) {
      const kickBtn = document.createElement('button');
      kickBtn.className = 'btn-kick';
      kickBtn.textContent = '✕';
      kickBtn.title = 'Quitar de la sala';
      kickBtn.addEventListener('click', () => {
        socket.emit('remove_player', { targetPlayerId: p.id });
      });
      card.appendChild(kickBtn);
    }

    grid.appendChild(card);
  });
}

function renderGame(state) {
  document.getElementById('game-room-code').textContent = state.code;
  document.getElementById('center-pot-amount').textContent = formatCLP(state.pot);

  // Actualizar dados
  const d1 = document.getElementById('die-1');
  const d2 = document.getElementById('die-2');
  d1.textContent = DICE_FACES[(state.lastDice[0] || 1) - 1];
  d2.textContent = DICE_FACES[(state.lastDice[1] || 1) - 1];

  const currentPlayer = state.players[state.turnIndex];
  const isMyTurn = currentPlayer && currentPlayer.id === myPlayerId;

  // Banner de turno o ganador
  const turnBanner = document.getElementById('turn-banner');
  if (state.status === 'finished' && state.winner) {
    turnBanner.innerHTML = `🏆 ¡${state.winner.avatar.icon} ${state.winner.name} GANA GRAN SANTIAGO!`;
  } else if (currentPlayer) {
    turnBanner.innerHTML = isMyTurn
      ? `🟢 ¡ES TU TURNO, ${currentPlayer.avatar.icon} ${currentPlayer.name}!`
      : `⏳ Turno de ${currentPlayer.avatar.icon} ${currentPlayer.name}`;
  }

  // Botones de acción en el centro
  const rollBtn = document.getElementById('btn-roll-dice');
  const bailBtn = document.getElementById('btn-pay-bail');
  const buyBox = document.getElementById('buy-decision-box');
  const endBtn = document.getElementById('btn-end-turn');

  rollBtn.classList.add('hidden');
  bailBtn.classList.add('hidden');
  buyBox.classList.add('hidden');
  endBtn.classList.add('hidden');

  if (state.status === 'playing' && isMyTurn) {
    if (state.turnPhase === 'ROLL') {
      rollBtn.classList.remove('hidden');
      if (currentPlayer.inJail && currentPlayer.money >= 50000) {
        bailBtn.classList.remove('hidden');
      }
    } else if (state.turnPhase === 'BUY_DECISION' && state.pendingBuyTileId !== null) {
      const tile = boardMeta.BOARD_TILES[state.pendingBuyTileId];
      if (tile) {
        buyBox.classList.remove('hidden');
        document.getElementById('buy-prompt-text').innerHTML =
          `¿Comprar <strong>${tile.name}</strong> por <span style="color:#4ade80">${formatCLP(tile.price)}</span>?`;
      }
    } else if (state.turnPhase === 'END_TURN') {
      endBtn.classList.remove('hidden');
      endBtn.textContent = state.doublesCount > 0 && !currentPlayer.inJail
        ? '🎲 Tirar de Nuevo (Dobles)'
        : '⏭️ Terminar Turno';
    }
  }

  // Lista lateral de jugadores
  const playersList = document.getElementById('players-list');
  playersList.innerHTML = '';
  state.players.forEach((p, idx) => {
    const row = document.createElement('div');
    row.className = 'player-row' +
      (idx === state.turnIndex ? ' active-turn' : '') +
      (p.bankrupt ? ' bankrupt' : '');
    row.style.borderLeftColor = p.avatar.color;

    const tileName = boardMeta.BOARD_TILES[p.position]?.shortName || boardMeta.BOARD_TILES[p.position]?.name || '';
    row.innerHTML = `
      <div class="p-info">
        <span class="p-avatar">${p.avatar.icon}</span>
        <div>
          <div class="p-name">${p.name} ${p.id === myPlayerId ? '(Tú)' : ''}</div>
          <span class="p-status-tag">${p.bankrupt ? '💥 En Bancarrota' : (p.inJail ? '🚓 En Comisaría' : `📍 ${tileName}`)}</span>
        </div>
      </div>
      <div class="p-money">${formatCLP(p.money)}</div>
    `;
    playersList.appendChild(row);
  });

  // Actualizar estado de propiedades en el tablero
  boardMeta.BOARD_TILES.forEach((tile) => {
    const prop = state.properties[tile.id];
    const ownerDot = document.getElementById(`owner-dot-${tile.id}`);
    const mortgagedTag = document.getElementById(`mortgaged-tag-${tile.id}`);
    const barEl = document.getElementById(`bar-tile-${tile.id}`);

    if (prop) {
      if (prop.ownerId) {
        const owner = state.players.find((pl) => pl.id === prop.ownerId);
        if (owner && ownerDot) {
          ownerDot.style.backgroundColor = owner.avatar.color;
          ownerDot.classList.remove('hidden');
        }
      } else if (ownerDot) {
        ownerDot.classList.add('hidden');
      }

      if (mortgagedTag) {
        mortgagedTag.classList.toggle('hidden', !prop.mortgaged);
      }

      if (barEl && tile.type === 'property') {
        if (prop.houses === 5) {
          barEl.innerHTML = '🏙️';
        } else if (prop.houses > 0) {
          barEl.innerHTML = '🏠'.repeat(prop.houses);
        } else {
          barEl.innerHTML = '';
        }
      }
    }
  });

  // Detectar si algún jugador caminó de una casilla a otra para animarlo cuadro por cuadro
  state.players.forEach((p) => {
    if (p.bankrupt) return;
    const prevPos = displayedPositions[p.id];
    if (prevPos === undefined) {
      displayedPositions[p.id] = p.position;
    } else if (prevPos !== p.position && !walkingTimers[p.id]) {
      animatePlayerMovement(p, prevPos, p.position);
    }
  });

  renderTokensOnBoard(state);

  // Mis Propiedades
  renderMyProperties(state);

  // Ofertas de Trueque pendientes para mí
  renderPendingTrades(state);

  // Crónica Financiera y Chat
  renderLogsAndChat(state);
}

function renderMyProperties(state) {
  const myPropsContainer = document.getElementById('my-properties-list');
  const myOwnedTiles = boardMeta.BOARD_TILES.filter(
    (t) => state.properties[t.id]?.ownerId === myPlayerId
  );

  document.getElementById('my-props-count').textContent = myOwnedTiles.length;

  if (!myOwnedTiles.length) {
    myPropsContainer.innerHTML = `<p class="empty-small">Aún no tienes propiedades. ¡Lanza los dados y compra comunas!</p>`;
    return;
  }

  myPropsContainer.innerHTML = '';
  myOwnedTiles.forEach((tile) => {
    const prop = state.properties[tile.id];
    const groupColor = boardMeta.COLOR_GROUPS[tile.group]?.color || '#64748b';
    const item = document.createElement('div');
    item.className = 'my-prop-item';
    item.style.borderLeftColor = groupColor;

    let badge = '';
    if (prop.mortgaged) badge = '🏦 Hipotecada';
    else if (prop.houses === 5) badge = '🏙️ Torre';
    else if (prop.houses > 0) badge = `🏠x${prop.houses}`;

    const typeIcon = tile.type === 'station' ? '🚇 ' : (tile.type === 'utility' ? `${tile.icon || '⚡'} ` : '🏘️ ');

    item.innerHTML = `
      <span><strong>${typeIcon}${tile.name}</strong></span>
      <span style="color:#0284c7; font-weight:800; font-size:0.75rem">${badge || formatCompactCLP(tile.price)}</span>
    `;
    item.addEventListener('click', () => openPropertyModal(tile.id));
    myPropsContainer.appendChild(item);
  });
}

function renderPendingTrades(state) {
  const banner = document.getElementById('active-trades-banner');
  const myTrades = (state.trades || []).filter((t) => t.toId === myPlayerId);
  if (!myTrades.length) {
    banner.classList.add('hidden');
    return;
  }

  const tr = myTrades[0];
  const offerTileName = tr.offerTileId ? boardMeta.BOARD_TILES[tr.offerTileId]?.name : null;
  const reqTileName = tr.requestTileId ? boardMeta.BOARD_TILES[tr.requestTileId]?.name : null;

  banner.classList.remove('hidden');
  banner.innerHTML = `
    <div><strong>🤝 Oferta de ${tr.fromName}:</strong></div>
    <div style="margin: 4px 0;">
      Ofrece: <strong>${offerTileName || 'Ninguna prop.'} + ${formatCLP(tr.offerMoney)}</strong><br/>
      Pide: <strong>${reqTileName || 'Ninguna prop.'} + ${formatCLP(tr.requestMoney)}</strong>
    </div>
    <div style="display:flex; gap:6px; justify-content:center; margin-top:4px;">
      <button id="btn-accept-trade" class="btn btn-success btn-xs">Aceptar Trato</button>
      <button id="btn-reject-trade" class="btn btn-danger-outline btn-xs">Rechazar</button>
    </div>
  `;

  document.getElementById('btn-accept-trade').onclick = () => {
    socket.emit('respond_trade', { tradeId: tr.id, accept: true });
  };
  document.getElementById('btn-reject-trade').onclick = () => {
    socket.emit('respond_trade', { tradeId: tr.id, accept: false });
  };
}

function renderLogsAndChat(state) {
  const logsEl = document.getElementById('game-logs');
  logsEl.innerHTML = '';
  state.logs.forEach((l) => {
    const div = document.createElement('div');
    div.className = `log-entry ${l.type || 'info'}`;
    div.innerHTML = `<span class="log-time">[${l.time}]</span> ${l.text}`;
    logsEl.appendChild(div);
  });

  const chatEl = document.getElementById('chat-messages');
  chatEl.innerHTML = '';
  state.chat.forEach((c) => {
    const div = document.createElement('div');
    div.className = 'chat-msg';
    div.innerHTML = `<strong>${c.avatar?.icon || ''} ${c.playerName}:</strong> ${c.text}`;
    chatEl.appendChild(div);
  });
  chatEl.scrollTop = chatEl.scrollHeight;
}

function openPropertyModal(tileId) {
  const tile = boardMeta.BOARD_TILES[tileId];
  if (!tile) return;
  inspectedTileId = tileId;

  const dialog = document.getElementById('property-dialog');
  const header = document.getElementById('prop-dialog-header');
  const comunaEl = document.getElementById('prop-dialog-comuna');
  const titleEl = document.getElementById('prop-dialog-title');
  const priceEl = document.getElementById('prop-dialog-price');
  const ownerEl = document.getElementById('prop-dialog-owner');
  const rentTable = document.querySelector('#prop-rent-table tbody');
  const descEl = document.getElementById('prop-dialog-desc');
  const actionsBox = document.getElementById('prop-owner-actions');

  const groupInfo = tile.group ? boardMeta.COLOR_GROUPS[tile.group] : null;
  const headerColor = groupInfo ? groupInfo.color : '#334155';
  header.style.background = headerColor;
  comunaEl.textContent = tile.comuna || groupInfo?.name || 'CASILLA ESPECIAL';
  titleEl.textContent = `${tile.icon ? tile.icon + ' ' : ''}${tile.name}`;

  const emblemEl = document.getElementById('prop-dialog-emblem');
  if (emblemEl) {
    const bigIcon = tile.icon || (tile.type === 'property' ? '🏘️' : '📍');
    emblemEl.textContent = bigIcon;
    emblemEl.style.borderColor = headerColor;
    emblemEl.classList.remove('hidden');
  }

  priceEl.textContent = tile.price ? formatCLP(tile.price) : '—';
  rentTable.innerHTML = '';
  descEl.textContent = tile.description || '';

  const propState = currentRoomState?.properties?.[tileId];
  if (propState) {
    const owner = currentRoomState.players.find((p) => p.id === propState.ownerId);
    ownerEl.textContent = owner
      ? `Dueño: ${owner.avatar.icon} ${owner.name} ${propState.mortgaged ? '(HIPOTECADA)' : ''}`
      : '🟢 Disponible en Conservador de Bienes Raíces';
  } else {
    ownerEl.textContent = 'Casilla Pública de Santiago';
  }

  if (tile.type === 'property') {
    const labels = [
      'Arriendo Sitio Sin Edificar',
      'Con 1 Casa 🏠',
      'Con 2 Casas 🏠🏠',
      'Con 3 Casas 🏠🏠🏠',
      'Con 4 Casas 🏠🏠🏠🏠',
      'Con Torre Costanera (Hotel) 🏙️'
    ];
    tile.rents.forEach((r, i) => {
      const tr = document.createElement('tr');
      if (propState && propState.houses === i && propState.ownerId) {
        tr.style.background = 'rgba(56, 189, 248, 0.18)';
      }
      tr.innerHTML = `<td>${labels[i]}</td><td>${formatCLP(r)}</td>`;
      rentTable.appendChild(tr);
    });
    const buildTr = document.createElement('tr');
    buildTr.innerHTML = `<td><strong>Costo Edificación Casa/Torre</strong></td><td>${formatCLP(tile.houseCost)}</td>`;
    rentTable.appendChild(buildTr);
  } else if (tile.type === 'station') {
    tile.rents.forEach((r, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>🚇 Con ${i + 1} Estación(es) de Metro</td><td>${formatCLP(r)}</td>`;
      rentTable.appendChild(tr);
    });
  } else if (tile.type === 'utility') {
    const uIcon = tile.icon || '⚡';
    [
      { label: `${uIcon} Con 1 Servicio Básico`, val: '4.000 × Dados' },
      { label: `⚡💧 Con Ambos Servicios (Enel + Aguas Andinas)`, val: '10.000 × Dados' }
    ].forEach((row) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${row.label}</td><td>${row.val}</td>`;
      rentTable.appendChild(tr);
    });
  }

  // Mostrar controles si el jugador es el propietario
  if (propState && propState.ownerId === myPlayerId && currentRoomState?.status === 'playing') {
    actionsBox.classList.remove('hidden');
    document.getElementById('btn-build-house').style.display = tile.type === 'property' ? 'inline-flex' : 'none';
    document.getElementById('btn-sell-house').style.display =
      tile.type === 'property' && propState.houses > 0 ? 'inline-flex' : 'none';
    document.getElementById('btn-toggle-mortgage').textContent = propState.mortgaged
      ? `🏦 Levantar Hipoteca (${formatCLP(Math.floor(tile.price * 0.55))})`
      : `🏦 Hipotecar (+${formatCLP(Math.floor(tile.price / 2))})`;
  } else {
    actionsBox.classList.add('hidden');
  }

  if (!dialog.open) dialog.showModal();
}

function openTradeModal() {
  if (!currentRoomState || currentRoomState.status !== 'playing') return;
  const dialog = document.getElementById('trade-dialog');
  const targetSelect = document.getElementById('trade-target-player');
  const offerSelect = document.getElementById('trade-offer-tile');

  const otherPlayers = currentRoomState.players.filter((p) => p.id !== myPlayerId && !p.bankrupt);
  if (!otherPlayers.length) {
    showToast('No hay otros jugadores disponibles para negociar.');
    return;
  }

  targetSelect.innerHTML = '';
  otherPlayers.forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `${p.avatar.icon} ${p.name} (${formatCLP(p.money)})`;
    targetSelect.appendChild(opt);
  });

  // Mis propiedades para ofrecer
  offerSelect.innerHTML = '<option value="">— Ninguna propiedad —</option>';
  boardMeta.BOARD_TILES.forEach((t) => {
    if (currentRoomState.properties[t.id]?.ownerId === myPlayerId && !currentRoomState.properties[t.id]?. houses) {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `${t.name} (${formatCLP(t.price)})`;
      offerSelect.appendChild(opt);
    }
  });

  populateTradeTargetProperties();
  if (!dialog.open) dialog.showModal();
}

function populateTradeTargetProperties() {
  const targetId = document.getElementById('trade-target-player').value;
  const reqSelect = document.getElementById('trade-request-tile');
  reqSelect.innerHTML = '<option value="">— Ninguna propiedad —</option>';
  if (!targetId || !currentRoomState) return;

  boardMeta.BOARD_TILES.forEach((t) => {
    if (currentRoomState.properties[t.id]?.ownerId === targetId && !currentRoomState.properties[t.id]?.houses) {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `${t.name} (${formatCLP(t.price)})`;
      reqSelect.appendChild(opt);
    }
  });
}

window.addEventListener('DOMContentLoaded', initApp);
