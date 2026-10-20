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
  BOARD_TILES: [],
  CUAL_ES_SYMBOLS: []
};

let myPlayerId = localStorage.getItem('gso_playerId') || ('p_' + Math.random().toString(36).substring(2, 10));
localStorage.setItem('gso_playerId', myPlayerId);

let selectedAvatarId = 'condorito';
let selectedGameType = 'santiago';
let currentRoomState = null;
let myPenaltyUntil = 0;
let penaltyIntervalId = null;
let lastKnownTurnPlayerId = null;
let turnOverlayTimer = null;
let displayedPositions = {}; // { [playerId]: tileIndex }
let walkingTimers = {};      // { [playerId]: intervalId }
let hoppingPlayers = new Set();
let isDiceRollingAnim = false;
let pendingRoomStateAfterDice = null;
let pendingCardAfterDice = null;
let pendingCardAfterWalk = null;
let cardCountdownIntervalId = null;
let activeCardId = null;
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

      if (pendingCardAfterWalk && (!pendingCardAfterWalk.playerId || pendingCardAfterWalk.playerId === player.id)) {
        const cd = pendingCardAfterWalk;
        pendingCardAfterWalk = null;
        showDrawnCardNotification(cd);
      }

      if (currentRoomState) {
        updateTurnActionControls(currentRoomState);
      }
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
        <div class="tile-meta-footer">
          <div class="tile-price" id="price-tile-${tile.id}">${tile.price ? formatCompactCLP(tile.price) : (tile.taxAmount ? '-' + formatCompactCLP(tile.taxAmount) : '')}</div>
          <div class="tile-rent-tag hidden" id="rent-tag-tile-${tile.id}"></div>
        </div>
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
  // Selector de Modo de Juego en pantalla de inicio
  const btnModeSantiago = document.getElementById('mode-btn-santiago');
  const btnModeCuales = document.getElementById('mode-btn-cuales');
  const moneyGroup = document.getElementById('group-starting-money');

  if (btnModeSantiago && btnModeCuales) {
    btnModeSantiago.addEventListener('click', () => {
      selectedGameType = 'santiago';
      btnModeSantiago.classList.add('selected');
      btnModeCuales.classList.remove('selected');
      if (moneyGroup) moneyGroup.style.display = 'block';
    });
    btnModeCuales.addEventListener('click', () => {
      selectedGameType = 'cual_es';
      btnModeCuales.classList.add('selected');
      btnModeSantiago.classList.remove('selected');
      if (moneyGroup) moneyGroup.style.display = 'none';
    });
  }

  // Selector de Modo en el Lobby
  document.getElementById('btn-lobby-mode-santiago')?.addEventListener('click', () => {
    socket.emit('set_game_type', { gameType: 'santiago' });
  });
  document.getElementById('btn-lobby-mode-cuales')?.addEventListener('click', () => {
    socket.emit('set_game_type', { gameType: 'cual_es' });
  });
  document.getElementById('btn-return-lobby')?.addEventListener('click', () => {
    socket.emit('return_to_lobby');
  });

  // Crear sala
  document.getElementById('btn-create-room').addEventListener('click', () => {
    const playerName = document.getElementById('input-player-name').value.trim() || 'Santiaguino';
    const startingMoney = Number(document.getElementById('select-starting-money').value) || 1500000;
    localStorage.setItem('gso_playerName', playerName);

    socket.emit(
      'create_room',
      { playerName, avatarId: selectedAvatarId, startingMoney, gameType: selectedGameType, playerId: myPlayerId },
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

  // Modal de Tarjeta Sacada (cierre manual o confirmación antes de los 10s)
  const drawnCardDialog = document.getElementById('drawn-card-dialog');
  document.getElementById('btn-close-drawn-card').addEventListener('click', () => {
    confirmAndCloseDrawnCard(false);
  });
  if (drawnCardDialog) {
    drawnCardDialog.addEventListener('close', () => {
      if (cardCountdownIntervalId) {
        clearInterval(cardCountdownIntervalId);
        cardCountdownIntervalId = null;
      }
      if (activeCardId) {
        activeCardId = null;
        socket.emit('confirm_card');
      }
    });
  }

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
    const isCualEs = r.gameType === 'cual_es';
    const gameBadge = isCualEs ? '🔍 ¿Cuál es?' : '🚇 Gran Santiago';
    const subInfo = isCualEs
      ? `👥 ${r.playerCount}/${r.maxPlayers} jugadores • Agilidad Visual`
      : `👥 ${r.playerCount}/${r.maxPlayers} jugadores • Capital: ${formatCLP(r.startingMoney)}`;

    const item = document.createElement('div');
    item.className = 'room-item';
    item.innerHTML = `
      <div class="room-item-info">
        <strong>${r.code}</strong> • <span style="color:#facc15">${gameBadge}</span> — Mesa de ${r.hostName}
        <small>${subInfo}</small>
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

    if (
      state.gameType !== 'cual_es' &&
      state.status === 'playing' &&
      activePlayer &&
      activePlayer.id !== prevTurnId
    ) {
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
      queueOrShowDrawnCard(cd);
    }
  }, 1000);
});

function queueOrShowDrawnCard(payload) {
  if (!payload) return;
  if (isDiceRollingAnim) {
    pendingCardAfterDice = payload;
    return;
  }
  // Si el personaje aún está caminando casilla por casilla hacia "?", esperar a que llegue
  if (payload.playerId && walkingTimers[payload.playerId]) {
    pendingCardAfterWalk = payload;
    return;
  }
  showDrawnCardNotification(payload);
}

function confirmAndCloseDrawnCard(fromServerEvent = false) {
  if (cardCountdownIntervalId) {
    clearInterval(cardCountdownIntervalId);
    cardCountdownIntervalId = null;
  }
  const shouldEmit = !fromServerEvent && Boolean(activeCardId);
  activeCardId = null;

  const cardDialog = document.getElementById('drawn-card-dialog');
  if (cardDialog && cardDialog.open) {
    closeTopLayer(cardDialog);
  }

  if (shouldEmit) {
    socket.emit('confirm_card');
  }
}

function showDrawnCardNotification({ id, playerName, deckType, deckTitle, card }) {
  playSoundEffect('card');
  activeCardId = id || ('card_' + Date.now());

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

  // Abrir modal emergente de tarjeta con timeout de 10s o cierre manual
  const cardDialog = document.getElementById('drawn-card-dialog');
  if (cardDialog) {
    document.getElementById('drawn-card-header').style.background = headerColor;
    document.getElementById('drawn-card-deck').textContent = deckTitle;
    document.getElementById('drawn-card-title').textContent = card.title;
    document.getElementById('drawn-card-icon').textContent = isChance ? '❓' : '🍀';
    document.getElementById('drawn-card-player').textContent = `Tarjeta sacada por ${playerName}`;
    document.getElementById('drawn-card-text').textContent = card.text;

    let secondsLeft = 10;
    const countdownSpan = document.getElementById('drawn-card-countdown');
    const closeBtn = document.getElementById('btn-close-drawn-card');
    const updateCountdownUI = () => {
      if (countdownSpan) countdownSpan.textContent = String(secondsLeft);
      if (closeBtn) closeBtn.textContent = `¡Entendido! (${secondsLeft}s)`;
    };
    updateCountdownUI();

    if (cardCountdownIntervalId) clearInterval(cardCountdownIntervalId);
    cardCountdownIntervalId = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft <= 0) {
        confirmAndCloseDrawnCard(false);
        return;
      }
      updateCountdownUI();
    }, 1000);

    if (!cardDialog.open) cardDialog.showModal();
  }
}

socket.on('card_drawn', (payload) => {
  queueOrShowDrawnCard(payload);
});

socket.on('card_resolved', () => {
  confirmAndCloseDrawnCard(true);
});

socket.on('cual_es_point', ({ playerId, playerName, symbol }) => {
  if (playerId === myPlayerId) {
    playSoundEffect('buy');
  } else {
    playTone(480, 0.1, 'sine');
  }
  const matchBanner = document.getElementById('cuales-last-match');
  if (matchBanner && symbol) {
    matchBanner.innerHTML = `⚡ <strong>${playerName}</strong> encontró <strong>${symbol.icon} ${symbol.name}</strong> y ganó la carta!`;
  }
});

socket.on('cual_es_penalty', ({ playerId, penaltyUntil, symbol }) => {
  if (playerId === myPlayerId) {
    playTone(170, 0.22, 'sawtooth');
    setTimeout(() => playTone(140, 0.28, 'sawtooth'), 140);
    startMyPenaltyCountdown(penaltyUntil);
    showToast(`❄️ ¡"${symbol?.icon || ''} ${symbol?.name || ''}" no coincide! 3s de penalización.`);
  }
});

function startMyPenaltyCountdown(untilTimestamp) {
  myPenaltyUntil = untilTimestamp;
  const banner = document.getElementById('cuales-penalty-banner');
  const timerEl = document.getElementById('cuales-penalty-timer');
  const centerCardEl = document.getElementById('cuales-center-card');
  const myCardEl = document.getElementById('cuales-my-card');

  if (penaltyIntervalId) clearInterval(penaltyIntervalId);

  const updateTick = () => {
    const remMs = myPenaltyUntil - Date.now();
    if (remMs <= 0) {
      clearInterval(penaltyIntervalId);
      penaltyIntervalId = null;
      if (banner) banner.classList.add('hidden');
      if (centerCardEl) centerCardEl.classList.remove('penalized-card');
      if (myCardEl) myCardEl.classList.remove('penalized-card');
      return;
    }
    if (banner) banner.classList.remove('hidden');
    if (centerCardEl) centerCardEl.classList.add('penalized-card');
    if (myCardEl) myCardEl.classList.add('penalized-card');
    if (timerEl) timerEl.textContent = (remMs / 1000).toFixed(1);
  };

  updateTick();
  penaltyIntervalId = setInterval(updateTick, 80);
}

// Posiciones geométricas dentro de un círculo para los 8 dibujos de cada carta de "¿Cuál es?"
const CUAL_ES_SLOTS = [
  { x: 50, y: 50, scale: 1.12 }, // Centro
  { x: 50, y: 19, scale: 0.96 }, // Arriba
  { x: 76, y: 31, scale: 1.02 }, // Arriba-Derecha
  { x: 81, y: 59, scale: 0.94 }, // Abajo-Derecha
  { x: 64, y: 81, scale: 1.04 }, // Inferior-Derecha
  { x: 36, y: 81, scale: 0.95 }, // Inferior-Izquierda
  { x: 19, y: 59, scale: 1.05 }, // Abajo-Izquierda
  { x: 24, y: 31, scale: 0.98 }  // Arriba-Izquierda
];

function renderCualEsCircleCard(containerId, symbolIds, cardSeed = 0) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  if (!symbolIds || !symbolIds.length) {
    container.innerHTML = `<div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:#0f172a; font-weight:800;">🏁 Fin del Mazo</div>`;
    return;
  }

  symbolIds.forEach((symId, idx) => {
    const sym = boardMeta.CUAL_ES_SYMBOLS[symId] || { id: symId, icon: '❓', name: '?' };
    const slot = CUAL_ES_SLOTS[idx % CUAL_ES_SLOTS.length];
    const rot = (((symId * 37 + idx * 53 + cardSeed * 19) % 50) - 25);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cuales-symbol-btn';
    btn.style.left = `${slot.x}%`;
    btn.style.top = `${slot.y}%`;
    btn.style.transform = `translate(-50%, -50%) rotate(${rot}deg) scale(${slot.scale})`;
    btn.title = `Hacer clic en ${sym.name}`;
    btn.innerHTML = `
      <span class="sym-emoji">${sym.icon}</span>
      <span class="sym-label">${sym.name}</span>
    `;

    btn.addEventListener('click', () => {
      if (Date.now() < myPenaltyUntil) return;
      socket.emit('cual_es_click', { symbolId: symId }, (res) => {
        if (res && res.penalized && res.penaltyUntil) {
          startMyPenaltyCountdown(res.penaltyUntil);
        }
      });
    });

    container.appendChild(btn);
  });
}

function renderLobby(state) {
  document.getElementById('lobby-room-code').textContent = state.code;
  document.getElementById('lobby-player-count').textContent = state.players.length;

  const isHost = state.hostId === myPlayerId;
  const isCualEs = state.gameType === 'cual_es';

  const gameLabel = document.getElementById('lobby-current-game-label');
  if (gameLabel) {
    gameLabel.textContent = isCualEs
      ? '🔍 ¿Cuál es? (Rapidez Visual y Coincidencias)'
      : '🚇 Gran Santiago Online (Propiedades en $ CLP)';
  }

  const hostSwitch = document.getElementById('lobby-host-mode-switch');
  if (hostSwitch) {
    hostSwitch.style.display = isHost ? 'flex' : 'none';
    document.getElementById('btn-lobby-mode-santiago').className =
      'btn btn-sm ' + (!isCualEs ? 'btn-accent' : 'btn-secondary');
    document.getElementById('btn-lobby-mode-cuales').className =
      'btn btn-sm ' + (isCualEs ? 'btn-accent' : 'btn-secondary');
  }

  document.getElementById('btn-add-bot').style.display = isHost && state.players.length < 8 ? 'inline-flex' : 'none';

  const startBtn = document.getElementById('btn-start-game');
  startBtn.disabled = !isHost || state.players.length < 2;
  startBtn.textContent = isCualEs
    ? '🚀 ¡Iniciar Partida de ¿Cuál es?!'
    : '🚀 ¡Iniciar Partida en Gran Santiago!';
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
  const isCualEs = state.gameType === 'cual_es';

  const boardGridEl = document.getElementById('board-grid');
  const cualesArenaEl = document.getElementById('cuales-arena');
  const santiagoPortfolioEl = document.getElementById('santiago-portfolio-panel');
  const cualesRulesEl = document.getElementById('cuales-rules-panel');
  const sidebarTitleEl = document.getElementById('sidebar-players-title');
  const returnLobbyBtn = document.getElementById('btn-return-lobby');

  boardGridEl.classList.toggle('hidden', isCualEs);
  cualesArenaEl.classList.toggle('hidden', !isCualEs);
  santiagoPortfolioEl.classList.toggle('hidden', isCualEs);
  cualesRulesEl.classList.toggle('hidden', !isCualEs);

  if (returnLobbyBtn) {
    returnLobbyBtn.classList.toggle('hidden', state.hostId !== myPlayerId);
  }

  if (sidebarTitleEl) {
    sidebarTitleEl.textContent = isCualEs ? '🏆 Ranking de Cartas' : '👥 Magnates en Competencia';
  }

  if (isCualEs) {
    renderCualEsGame(state);
    renderLogsAndChat(state);
    return;
  }

  document.getElementById('center-pot-amount').textContent = formatCLP(state.pot);

  // Actualizar dados
  const d1 = document.getElementById('die-1');
  const d2 = document.getElementById('die-2');
  d1.textContent = DICE_FACES[(state.lastDice[0] || 1) - 1];
  d2.textContent = DICE_FACES[(state.lastDice[1] || 1) - 1];

  // Detectar si algún jugador caminó de una casilla a otra para animarlo cuadro por cuadro ANTES de mostrar acciones de llegada
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
  updateTurnActionControls(state);

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
    const rentTagEl = document.getElementById(`rent-tag-tile-${tile.id}`);

    if (prop) {
      if (prop.ownerId) {
        const owner = state.players.find((pl) => pl.id === prop.ownerId);
        if (owner && ownerDot) {
          ownerDot.style.backgroundColor = owner.avatar.color;
          ownerDot.classList.remove('hidden');
        }
        const activeRent = getActiveRentForTile(state, tile);
        if (rentTagEl && activeRent) {
          rentTagEl.textContent = `Cobro: ${formatCompactCLP(activeRent)}`;
          rentTagEl.classList.remove('hidden');
          rentTagEl.classList.toggle('upgraded-rent', (prop.houses || 0) > 0);
        } else if (rentTagEl) {
          rentTagEl.classList.add('hidden');
        }
      } else {
        if (ownerDot) ownerDot.classList.add('hidden');
        if (rentTagEl) rentTagEl.classList.add('hidden');
      }

      if (mortgagedTag) {
        mortgagedTag.classList.toggle('hidden', !prop.mortgaged);
      }

      if (barEl && tile.type === 'property') {
        if (prop.houses === 5) {
          barEl.innerHTML = `<span class="tile-house-pill hotel-pill">🏨 HOTEL</span>`;
        } else if (prop.houses > 0) {
          barEl.innerHTML = `<span class="tile-house-pill">${'🏠'.repeat(prop.houses)} ${prop.houses}</span>`;
        } else {
          barEl.innerHTML = '';
        }
      }
    }
  });

  // Mis Propiedades
  renderMyProperties(state);

  // Ofertas de Trueque pendientes para mí
  renderPendingTrades(state);

  // Crónica Financiera y Chat
  renderLogsAndChat(state);
}

// Actualiza los botones del centro solo cuando el jugador terminó de caminar hasta la casilla
function updateTurnActionControls(state) {
  if (!state || state.gameType === 'cual_es') return;
  const currentPlayer = state.players[state.turnIndex];
  const isMyTurn = currentPlayer && currentPlayer.id === myPlayerId;
  const isCurrentWalking = Boolean(currentPlayer && walkingTimers[currentPlayer.id]);

  // Banner de turno o ganador
  const turnBanner = document.getElementById('turn-banner');
  if (state.status === 'finished' && state.winner) {
    turnBanner.innerHTML = `🏆 ¡${state.winner.avatar.icon} ${state.winner.name} GANA GRAN SANTIAGO!`;
  } else if (currentPlayer) {
    if (isCurrentWalking) {
      const targetTile = boardMeta.BOARD_TILES[currentPlayer.position];
      turnBanner.innerHTML = `🚶 ${currentPlayer.avatar.icon} ${currentPlayer.name} avanzando hacia <strong>${targetTile?.name || 'casilla'}</strong>...`;
    } else if (state.turnPhase === 'CARD_CONFIRM') {
      turnBanner.innerHTML = `🃏 Leyendo tarjeta de ${currentPlayer.avatar.icon} ${currentPlayer.name}...`;
    } else {
      turnBanner.innerHTML = isMyTurn
        ? `🟢 ¡ES TU TURNO, ${currentPlayer.avatar.icon} ${currentPlayer.name}!`
        : `⏳ Turno de ${currentPlayer.avatar.icon} ${currentPlayer.name}`;
    }
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

  // Esperar a que termine la animación de caminar o se confirme la tarjeta "?"
  if (isCurrentWalking || state.turnPhase === 'CARD_CONFIRM') {
    return;
  }

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
        const extraDetails = tile.type === 'property'
          ? `<div style="font-size:0.75rem; color:#cbd5e1; margin-top:4px;">💸 Arriendo base: <strong>${formatCLP(tile.rents[0])}</strong> · 🏗️ Mejora Casa/Hotel: <strong>${formatCLP(tile.houseCost)}</strong> <button type="button" onclick="openPropertyModal(${tile.id})" class="btn btn-xs btn-secondary" style="margin-left:4px; padding:1px 6px;">Ver Carta</button></div>`
          : (tile.type === 'station'
            ? `<div style="font-size:0.75rem; color:#cbd5e1; margin-top:4px;">💸 Cobro 1–4 estaciones: <strong>${formatCompactCLP(tile.rents[0])} a ${formatCompactCLP(tile.rents[3])}</strong></div>`
            : '');
        document.getElementById('buy-prompt-text').innerHTML =
          `¿Comprar <strong>${tile.name}</strong> por <span style="color:#4ade80">${formatCLP(tile.price)}</span>?${extraDetails}`;
      }
    } else if (state.turnPhase === 'END_TURN') {
      endBtn.classList.remove('hidden');
      endBtn.textContent = state.doublesCount > 0 && !currentPlayer.inJail
        ? '🎲 Tirar de Nuevo (Dobles)'
        : '⏭️ Terminar Turno';
    }
  }
}

// Calcula en el cliente cuánto paga quien caiga en una casilla actualmente
function getActiveRentForTile(state, tile) {
  if (!state || !tile) return null;
  const prop = state.properties?.[tile.id];
  if (!prop || !prop.ownerId || prop.mortgaged) return null;

  const ownerId = prop.ownerId;
  if (tile.type === 'property') {
    const houses = prop.houses || 0;
    if (houses > 0) return tile.rents[houses];
    const groupTiles = boardMeta.BOARD_TILES.filter((t) => t.group === tile.group);
    const hasMonopoly =
      groupTiles.length > 0 &&
      groupTiles.every((t) => state.properties?.[t.id]?.ownerId === ownerId && !state.properties?.[t.id]?.mortgaged);
    return hasMonopoly ? tile.rents[0] * 2 : tile.rents[0];
  }

  if (tile.type === 'station') {
    const ownedStations = boardMeta.BOARD_TILES.filter(
      (t) => t.type === 'station' && state.properties?.[t.id]?.ownerId === ownerId && !state.properties?.[t.id]?.mortgaged
    ).length;
    return tile.rents[Math.max(0, Math.min(3, ownedStations - 1))] || 50000;
  }

  return null;
}

function renderCualEsGame(state) {
  const ce = state.cualEs;
  if (!ce) return;

  document.getElementById('cuales-remaining-count').textContent = ce.remainingDeckCount || 0;
  const myScore = ce.scores?.[myPlayerId] || 1;
  document.getElementById('cuales-my-score').textContent = myScore;

  const matchBanner = document.getElementById('cuales-last-match');
  if (state.status === 'finished' && state.winner) {
    matchBanner.innerHTML = `🏆 ¡PARTIDA TERMINADA! Ganador: <strong>${state.winner.avatar.icon} ${state.winner.name}</strong> con ${ce.scores?.[state.winner.id] || 0} cartas!`;
  } else if (ce.lastMatch) {
    matchBanner.innerHTML = `⚡ Última carta ganada por <strong>${ce.lastMatch.playerAvatar?.icon || ''} ${ce.lastMatch.playerName}</strong> con <strong>${ce.lastMatch.symbol.icon} ${ce.lastMatch.symbol.name}</strong>`;
  } else {
    matchBanner.textContent = '¡Encuentra y haz clic en el único dibujo idéntico entre ambas cartas!';
  }

  // Verificar si tengo penalización activa
  const serverPenalty = ce.penalties?.[myPlayerId] || 0;
  if (serverPenalty > Date.now()) {
    startMyPenaltyCountdown(serverPenalty);
  }

  // Renderizar Carta Central y Mi Carta Activa
  const centerCard = ce.centerCard || [];
  const myCard = ce.playerCards?.[myPlayerId] || [];

  renderCualEsCircleCard('cuales-center-card', centerCard, ce.remainingDeckCount || 1);
  renderCualEsCircleCard('cuales-my-card', myCard, myScore);

  // Lista lateral de jugadores ordenada por puntaje en ¿Cuál es?
  const playersList = document.getElementById('players-list');
  playersList.innerHTML = '';

  const sortedPlayers = [...state.players].sort(
    (a, b) => (ce.scores?.[b.id] || 0) - (ce.scores?.[a.id] || 0)
  );

  sortedPlayers.forEach((p, idx) => {
    const row = document.createElement('div');
    const isPenalized = (ce.penalties?.[p.id] || 0) > Date.now();
    row.className = 'player-row' + (idx === 0 ? ' active-turn' : '');
    row.style.borderLeftColor = p.avatar.color;

    const pScore = ce.scores?.[p.id] || 0;
    row.innerHTML = `
      <div class="p-info">
        <span class="p-avatar">${p.avatar.icon}</span>
        <div>
          <div class="p-name">${p.name} ${p.id === myPlayerId ? '(Tú)' : ''}</div>
          <span class="p-status-tag">${isPenalized ? '❄️ Penalizado (3s)' : `🃏 Buscando coincidencia...`}</span>
        </div>
      </div>
      <div class="p-money">${pScore} 🃏</div>
    `;
    playersList.appendChild(row);
  });
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
    if (prop.mortgaged) badge = '<span style="color:#ef4444; font-weight:900;">🏦 Hipotecada</span>';
    else if (prop.houses === 5) badge = '<span class="tile-house-pill hotel-pill" style="position:static;">🏨 HOTEL</span>';
    else if (prop.houses > 0) badge = `<span class="tile-house-pill" style="position:static;">${'🏠'.repeat(prop.houses)} (${prop.houses})</span>`;

    const activeRent = getActiveRentForTile(state, tile);
    const rentStr = prop.mortgaged
      ? 'Sin cobro'
      : (activeRent ? `Cobro: ${formatCompactCLP(activeRent)}` : (tile.type === 'utility' ? 'Cobro: ×Dados' : ''));
    const upgradeStr = tile.type === 'property' && tile.houseCost
      ? ` · Mejora: ${formatCompactCLP(tile.houseCost)}`
      : '';

    const typeIcon = tile.type === 'station' ? '🚇 ' : (tile.type === 'utility' ? `${tile.icon || '⚡'} ` : '🏘️ ');

    item.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:2px;">
        <span><strong>${typeIcon}${tile.name}</strong></span>
        <span style="font-size:0.7rem; color:#0369a1; font-weight:700;">💸 ${rentStr}${upgradeStr}</span>
      </div>
      <div style="display:flex; align-items:center; gap:4px;">
        ${badge || `<span style="color:#475569; font-weight:800; font-size:0.75rem">${formatCompactCLP(tile.price)}</span>`}
      </div>
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
  const upgradeBox = document.getElementById('prop-upgrade-box');
  const upgradeCostEl = document.getElementById('prop-dialog-upgrade-cost');
  const currentRentEl = document.getElementById('prop-dialog-current-rent');
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
    let buildStatus = '';
    if (propState.houses === 5) buildStatus = ' · 🏨 CON HOTEL';
    else if (propState.houses > 0) buildStatus = ` · ${'🏠'.repeat(propState.houses)} (${propState.houses} casa${propState.houses > 1 ? 's' : ''})`;
    ownerEl.textContent = owner
      ? `Dueño: ${owner.avatar.icon} ${owner.name}${buildStatus} ${propState.mortgaged ? '(HIPOTECADA)' : ''}`
      : '🟢 Disponible en Conservador de Bienes Raíces';
  } else {
    ownerEl.textContent = 'Casilla Pública de Santiago';
  }

  // Mostrar resumen de Precio de Mejora y Cobro Actual
  if (upgradeBox) {
    if (tile.type === 'property' || tile.type === 'station' || tile.type === 'utility') {
      upgradeBox.classList.remove('hidden');
      if (upgradeCostEl) {
        upgradeCostEl.textContent = tile.type === 'property' && tile.houseCost
          ? `${formatCLP(tile.houseCost)} c/u`
          : 'No edificable';
      }
      if (currentRentEl) {
        const activeRent = getActiveRentForTile(currentRoomState, tile);
        if (propState?.mortgaged) {
          currentRentEl.textContent = '$0 (Hipotecada)';
        } else if (activeRent) {
          currentRentEl.textContent = formatCLP(activeRent);
        } else if (tile.type === 'property') {
          currentRentEl.textContent = `${formatCLP(tile.rents[0])} (Base)`;
        } else if (tile.type === 'station') {
          currentRentEl.textContent = `${formatCLP(tile.rents[0])} (1 Est.)`;
        } else if (tile.type === 'utility') {
          currentRentEl.textContent = '4.000 × Dados';
        }
      }
    } else {
      upgradeBox.classList.add('hidden');
    }
  }

  if (tile.type === 'property') {
    const headTr = document.createElement('tr');
    headTr.style.background = '#e2e8f0';
    headTr.innerHTML = `<td style="font-weight:900; color:#1e293b;">Nivel de Edificación</td><td style="font-weight:900; color:#1e293b;">Paga quien caiga</td>`;
    rentTable.appendChild(headTr);

    const ownerId = propState?.ownerId;
    const groupTiles = boardMeta.BOARD_TILES.filter((t) => t.group === tile.group);
    const hasMonopoly =
      ownerId &&
      groupTiles.length > 0 &&
      groupTiles.every((t) => currentRoomState?.properties?.[t.id]?.ownerId === ownerId && !currentRoomState?.properties?.[t.id]?.mortgaged);

    const rows = [
      { label: 'Sitio Sin Edificar (Base)', amount: tile.rents[0], isCurrent: Boolean(ownerId && !propState.mortgaged && propState.houses === 0 && !hasMonopoly) },
      { label: 'Con Villa Completa (Monopolio 2×)', amount: tile.rents[0] * 2, isCurrent: Boolean(ownerId && !propState.mortgaged && propState.houses === 0 && hasMonopoly) },
      { label: 'Con 1 Casa 🏠', amount: tile.rents[1], isCurrent: Boolean(ownerId && !propState.mortgaged && propState.houses === 1) },
      { label: 'Con 2 Casas 🏠🏠', amount: tile.rents[2], isCurrent: Boolean(ownerId && !propState.mortgaged && propState.houses === 2) },
      { label: 'Con 3 Casas 🏠🏠🏠', amount: tile.rents[3], isCurrent: Boolean(ownerId && !propState.mortgaged && propState.houses === 3) },
      { label: 'Con 4 Casas 🏠🏠🏠🏠', amount: tile.rents[4], isCurrent: Boolean(ownerId && !propState.mortgaged && propState.houses === 4) },
      { label: 'Con Hotel (Torre) 🏨', amount: tile.rents[5], isCurrent: Boolean(ownerId && !propState.mortgaged && propState.houses === 5) }
    ];

    rows.forEach((r) => {
      const tr = document.createElement('tr');
      if (r.isCurrent) tr.className = 'active-rent-row';
      const activeBadge = r.isCurrent ? ' <span style="font-size:0.68rem; background:#0284c7; color:#fff; padding:1px 5px; border-radius:999px;">ACTUAL</span>' : '';
      tr.innerHTML = `<td>${r.label}${activeBadge}</td><td>${formatCLP(r.amount)}</td>`;
      rentTable.appendChild(tr);
    });

    const buildTr = document.createElement('tr');
    buildTr.style.borderTop = '2px solid #cbd5e1';
    buildTr.innerHTML = `<td><strong>🏗️ Precio Mejora (Casa o Hotel)</strong></td><td><strong>${formatCLP(tile.houseCost)} c/u</strong></td>`;
    rentTable.appendChild(buildTr);
  } else if (tile.type === 'station') {
    const headTr = document.createElement('tr');
    headTr.style.background = '#e2e8f0';
    headTr.innerHTML = `<td style="font-weight:900; color:#1e293b;">Cantidad de Estaciones</td><td style="font-weight:900; color:#1e293b;">Paga quien caiga</td>`;
    rentTable.appendChild(headTr);

    const ownerId = propState?.ownerId;
    const ownedStations = ownerId
      ? boardMeta.BOARD_TILES.filter((t) => t.type === 'station' && currentRoomState?.properties?.[t.id]?.ownerId === ownerId && !currentRoomState?.properties?.[t.id]?.mortgaged).length
      : 0;

    tile.rents.forEach((r, i) => {
      const tr = document.createElement('tr');
      const isCurrent = Boolean(ownerId && !propState.mortgaged && ownedStations === i + 1);
      if (isCurrent) tr.className = 'active-rent-row';
      const activeBadge = isCurrent ? ' <span style="font-size:0.68rem; background:#0284c7; color:#fff; padding:1px 5px; border-radius:999px;">ACTUAL</span>' : '';
      tr.innerHTML = `<td>🚇 Con ${i + 1} Estación(es) de Metro${activeBadge}</td><td>${formatCLP(r)}</td>`;
      rentTable.appendChild(tr);
    });
  } else if (tile.type === 'utility') {
    const headTr = document.createElement('tr');
    headTr.style.background = '#e2e8f0';
    headTr.innerHTML = `<td style="font-weight:900; color:#1e293b;">Servicios Poseídos</td><td style="font-weight:900; color:#1e293b;">Paga quien caiga</td>`;
    rentTable.appendChild(headTr);

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
    const buildBtn = document.getElementById('btn-build-house');
    const sellBtn = document.getElementById('btn-sell-house');
    if (tile.type === 'property') {
      buildBtn.style.display = propState.houses < 5 ? 'inline-flex' : 'none';
      const nextUpgradeLabel = propState.houses === 4 ? '🏨 Construir Hotel' : '🏠 Construir Casa';
      buildBtn.textContent = `${nextUpgradeLabel} (${formatCLP(tile.houseCost)})`;
    } else {
      buildBtn.style.display = 'none';
    }
    sellBtn.style.display =
      tile.type === 'property' && propState.houses > 0 ? 'inline-flex' : 'none';
    if (tile.type === 'property' && propState.houses > 0) {
      sellBtn.textContent = `🔨 Vender Mejora (+${formatCLP(Math.floor(tile.houseCost / 2))})`;
    }
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
