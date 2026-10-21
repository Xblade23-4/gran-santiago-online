/**
 * santiagoMapAnimation.js
 * Mapa interactivo y animado de Santiago de Chile para el centro del tablero.
 * - Incluye las 40 casillas/tarjetas del Gran Santiago agrupadas por cercanía geográfica.
 * - Trazado de ruta completo conectando cada uno de los puntos del mapa.
 * - Resalte dinámico de propiedades compradas: halo de color del dueño y desplazamiento
 *   hacia el centro de la pantalla para identificar inmediatamente las propiedades del jugador.
 * - Soporta Modo Claro (Daylight) y Modo Oscuro (Night).
 * - Muestra en tiempo real el desplazamiento de los jugadores de punto a punto en Santiago.
 * - Anima los buses Transantiago / Red Movilidad por las avenidas con faros y estelas.
 */

(function () {
  'use strict';

  let canvas = null;
  let ctx = null;
  let animId = null;
  let lastTimestamp = 0;
  let isRunning = false;
  let currentTheme = localStorage.getItem('gso_theme') || 'dark';

  let currentRoomState = null;
  let currentMyPlayerId = null;

  // Coordenadas geográficas normalizadas [0..1] para las 40 casillas/tarjetas del Gran Santiago
  // Agrupadas por estricta cercanía comunal
  const SANTIAGO_POINTS = [
    { id: 0, name: 'Plaza Baquedano', comuna: 'Santiago Centro / Providencia', x: 0.53, y: 0.48, color: '#ef4444', icon: '🇨🇱', type: 'go' },
    { id: 1, name: 'Av. Pajaritos', comuna: 'Maipú', x: 0.12, y: 0.62, color: '#8b4513', icon: '🐦', type: 'property' },
    { id: 2, name: 'Polla Chilena', comuna: 'Santiago Centro', x: 0.43, y: 0.50, color: '#0284c7', icon: '🎰', type: 'community' },
    { id: 3, name: 'Gran Avenida', comuna: 'San Miguel', x: 0.40, y: 0.82, color: '#8b4513', icon: '🛣️', type: 'property' },
    { id: 4, name: 'Impuesto SII', comuna: 'Teatinos', x: 0.38, y: 0.52, color: '#f59e0b', icon: '💸', type: 'tax' },
    { id: 5, name: 'Metro Estación Central', comuna: 'Estación Central', x: 0.23, y: 0.58, color: '#dc2626', icon: '🚆', type: 'station' },
    { id: 6, name: 'Barrio Patronato', comuna: 'Recoleta', x: 0.50, y: 0.36, color: '#38bdf8', icon: '🧵', type: 'property' },
    { id: 7, name: '¡Aló Santiago!', comuna: 'Centro', x: 0.47, y: 0.45, color: '#eab308', icon: '❓', type: 'chance' },
    { id: 8, name: 'Av. Independencia', comuna: 'Independencia', x: 0.44, y: 0.26, color: '#38bdf8', icon: '🏛️', type: 'property' },
    { id: 9, name: 'Av. Dorsal', comuna: 'Conchalí', x: 0.42, y: 0.18, color: '#38bdf8', icon: '🛣️', type: 'property' },
    { id: 10, name: 'Comisaría / De Visita', comuna: 'Santiago Centro', x: 0.34, y: 0.56, color: '#64748b', icon: '🚓', type: 'jail' },
    { id: 11, name: 'Av. Vicuña Mackenna', comuna: 'La Florida', x: 0.60, y: 0.68, color: '#ec4899', icon: '🌳', type: 'property' },
    { id: 12, name: 'Enel Distribución', comuna: 'Santa Rosa', x: 0.47, y: 0.58, color: '#eab308', icon: '⚡', type: 'utility' },
    { id: 13, name: 'Plaza de Puente Alto', comuna: 'Puente Alto', x: 0.78, y: 0.94, color: '#ec4899', icon: '🏔️', type: 'property' },
    { id: 14, name: 'La Pintana', comuna: 'La Pintana', x: 0.54, y: 0.90, color: '#ec4899', icon: '🏘️', type: 'property' },
    { id: 15, name: 'Metro Cal y Canto', comuna: 'Santiago Norte', x: 0.42, y: 0.40, color: '#dc2626', icon: '🚇', type: 'station' },
    { id: 16, name: 'Barrio República', comuna: 'Santiago Poniente', x: 0.34, y: 0.58, color: '#f97316', icon: '🏰', type: 'property' },
    { id: 17, name: 'Polla Chilena', comuna: 'Santiago Centro', x: 0.44, y: 0.49, color: '#0284c7', icon: '🎰', type: 'community' },
    { id: 18, name: 'Barrio Brasil', comuna: 'Santiago Poniente', x: 0.35, y: 0.48, color: '#f97316', icon: '⛲', type: 'property' },
    { id: 19, name: 'Barrio Yungay', comuna: 'Santiago Poniente', x: 0.28, y: 0.48, color: '#f97316', icon: '🎭', type: 'property' },
    { id: 20, name: "Parque O'Higgins", comuna: 'Rondizzoni', x: 0.38, y: 0.74, color: '#10b981', icon: '🎡', type: 'freeparking' },
    { id: 21, name: 'Paseo Ahumada', comuna: 'Santiago Centro', x: 0.44, y: 0.52, color: '#ef4444', icon: '🛍️', type: 'property' },
    { id: 22, name: '¡Aló Santiago!', comuna: 'Centro Oriente', x: 0.60, y: 0.44, color: '#eab308', icon: '❓', type: 'chance' },
    { id: 23, name: 'Barrio Lastarria', comuna: 'Santa Lucía', x: 0.50, y: 0.49, color: '#ef4444', icon: '☕', type: 'property' },
    { id: 24, name: 'Alameda B. O\'Higgins', comuna: 'Eje Cívico', x: 0.40, y: 0.54, color: '#ef4444', icon: '🇨🇱', type: 'property' },
    { id: 25, name: 'Metro Plaza Egaña', comuna: 'La Reina / Ñuñoa', x: 0.76, y: 0.58, color: '#dc2626', icon: '🚇', type: 'station' },
    { id: 26, name: 'Plaza Ñuñoa (Irarrázaval)', comuna: 'Ñuñoa', x: 0.66, y: 0.61, color: '#eab308', icon: '🏛️', type: 'property' },
    { id: 27, name: 'Barrio Italia', comuna: 'Providencia / Ñuñoa', x: 0.58, y: 0.53, color: '#eab308', icon: '🎨', type: 'property' },
    { id: 28, name: 'Aguas Andinas', comuna: 'Cordillera', x: 0.86, y: 0.28, color: '#06b6d4', icon: '💧', type: 'utility' },
    { id: 29, name: 'Av. Macul', comuna: 'Macul', x: 0.65, y: 0.74, color: '#eab308', icon: '🏡', type: 'property' },
    { id: 30, name: 'Control Carabineros', comuna: 'Vespucio Norte', x: 0.30, y: 0.22, color: '#ef4444', icon: '🚨', type: 'gotojail' },
    { id: 31, name: 'Av. Providencia', comuna: 'Providencia', x: 0.65, y: 0.44, color: '#22c55e', icon: '🏬', type: 'property' },
    { id: 32, name: 'Pedro de Valdivia Norte', comuna: 'Providencia', x: 0.62, y: 0.37, color: '#22c55e', icon: '🌲', type: 'property' },
    { id: 33, name: 'Polla Chilena', comuna: 'Santiago Centro', x: 0.46, y: 0.53, color: '#0284c7', icon: '🎰', type: 'community' },
    { id: 34, name: 'Barrio Bellavista', comuna: 'Providencia', x: 0.56, y: 0.41, color: '#22c55e', icon: '🎭', type: 'property' },
    { id: 35, name: 'Metro Tobalaba', comuna: 'Sanhattan', x: 0.73, y: 0.39, color: '#dc2626', icon: '🚇', type: 'station' },
    { id: 36, name: '¡Aló Santiago!', comuna: 'Cordillera', x: 0.82, y: 0.32, color: '#eab308', icon: '❓', type: 'chance' },
    { id: 37, name: 'Av. Alonso de Córdova', comuna: 'Vitacura', x: 0.82, y: 0.23, color: '#3b82f6', icon: '💎', type: 'property' },
    { id: 38, name: 'TAG Costanera Norte', comuna: 'Ruta Río', x: 0.68, y: 0.33, color: '#f59e0b', icon: '💳', type: 'tax' },
    { id: 39, name: 'Sanhattan (Costanera)', comuna: 'Las Condes', x: 0.74, y: 0.37, color: '#3b82f6', icon: '🏙️', type: 'property' }
  ];

  // Rutas de buses Transantiago / Red
  const MAP_ROUTES = [
    {
      id: 'alameda-providencia',
      busNumber: '406',
      busLine: '406 CANTAGALLO',
      busColor: '#dc2626',
      speed: 0.052,
      path: [
        { x: 0.12, y: 0.62 }, // Pajaritos
        { x: 0.23, y: 0.58 }, // Est. Central
        { x: 0.40, y: 0.54 }, // Alameda
        { x: 0.53, y: 0.48 }, // Baquedano
        { x: 0.65, y: 0.44 }, // Providencia
        { x: 0.74, y: 0.37 }, // Sanhattan
        { x: 0.82, y: 0.23 }  // Alonso de Córdova
      ]
    },
    {
      id: 'vicuna-mackenna',
      busNumber: '210',
      busLine: '210 PUENTE ALTO',
      busColor: '#059669',
      speed: 0.046,
      path: [
        { x: 0.53, y: 0.48 }, // Baquedano
        { x: 0.60, y: 0.68 }, // Vicuña Mackenna
        { x: 0.65, y: 0.74 }, // Macul
        { x: 0.54, y: 0.90 }, // La Pintana
        { x: 0.78, y: 0.94 }  // Puente Alto
      ]
    },
    {
      id: 'autopista-central',
      busNumber: '301',
      busLine: '301 SAN BERNARDO',
      busColor: '#2563eb',
      speed: 0.058,
      path: [
        { x: 0.42, y: 0.18 }, // Conchalí
        { x: 0.44, y: 0.26 }, // Independencia
        { x: 0.42, y: 0.40 }, // Cal y Canto
        { x: 0.40, y: 0.54 }, // Alameda
        { x: 0.38, y: 0.74 }, // Parque O'Higgins
        { x: 0.40, y: 0.82 }  // Gran Avenida
      ]
    },
    {
      id: 'vespucio-circunvalacion',
      busNumber: '506',
      busLine: '506 PEÑALOLÉN',
      busColor: '#d97706',
      speed: 0.048,
      path: [
        { x: 0.30, y: 0.22 },
        { x: 0.42, y: 0.18 },
        { x: 0.76, y: 0.20 },
        { x: 0.86, y: 0.28 },
        { x: 0.76, y: 0.58 },
        { x: 0.65, y: 0.74 },
        { x: 0.40, y: 0.82 }
      ]
    }
  ];

  // Buses en circulación
  const buses = MAP_ROUTES.map((route, i) => ({
    route,
    progress: (i * 0.27) % 1.0,
    direction: 1,
    pauseTimer: 0
  }));

  // Registro de jugadores y sus movimientos en el mapa
  const playerMapPositions = {}; // { [playerId]: { tileId, currentX, currentY, targetX, targetY, avatar, name, moving, timer, pulse } }
  let activeMovementCallout = null;
  let hoveredPointId = null;

  function samplePathPoint(path, t) {
    if (path.length < 2) return path[0] || { x: 0.5, y: 0.5 };
    const segments = path.length - 1;
    const segT = t * segments;
    const segIdx = Math.min(Math.floor(segT), segments - 1);
    const subT = segT - segIdx;
    const p0 = path[segIdx];
    const p1 = path[segIdx + 1];
    const x = p0.x + (p1.x - p0.x) * subT;
    const y = p0.y + (p1.y - p0.y) * subT;
    const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x);
    return { x, y, angle };
  }

  function resizeCanvas() {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(Math.floor(rect.width), 160) || 300;
    const height = Math.max(Math.floor(rect.height), 160) || 300;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }
  }

  function updateGameState(state, myPlayerId) {
    currentRoomState = state;
    currentMyPlayerId = myPlayerId;
  }

  function setPlayerTile(playerId, playerName, playerAvatar, tileId, isMoving = false) {
    const pt = SANTIAGO_POINTS[tileId] || SANTIAGO_POINTS[0];
    const existing = playerMapPositions[playerId];

    if (!existing) {
      playerMapPositions[playerId] = {
        tileId,
        currentX: pt.x,
        currentY: pt.y,
        targetX: pt.x,
        targetY: pt.y,
        avatar: playerAvatar || '👤',
        name: playerName || 'Jugador',
        moving: false,
        pulse: 1.0
      };
      return;
    }

    existing.name = playerName || existing.name;
    existing.avatar = playerAvatar || existing.avatar;

    if (existing.tileId !== tileId || isMoving) {
      existing.tileId = tileId;
      existing.targetX = pt.x;
      existing.targetY = pt.y;
      existing.moving = true;
      existing.pulse = 2.0;

      activeMovementCallout = {
        text: `${existing.avatar} ${existing.name} en ${pt.name} (${pt.comuna})`,
        icon: pt.icon || '📍',
        color: pt.color || '#38bdf8',
        timestamp: Date.now()
      };
    }
  }

  function getThemeColors() {
    const isLight = currentTheme === 'light';
    return {
      isLight,
      bgGradStart: isLight ? '#f8fafc' : '#080d1a',
      bgGradMid: isLight ? '#f1f5f9' : '#0e172a',
      bgGradEnd: isLight ? '#e2e8f0' : '#050a14',
      gridColor: isLight ? 'rgba(148, 163, 184, 0.22)' : 'rgba(71, 85, 105, 0.16)',
      cordilleraFar: isLight ? '#cbd5e1' : '#334155',
      cordilleraNear: isLight ? '#94a3b8' : '#1e293b',
      snowColor: isLight ? '#ffffff' : '#f8fafc',
      snowOpacity: isLight ? 0.9 : 0.45,
      riverOuter: isLight ? '#38bdf8' : '#0284c7',
      riverInner: isLight ? '#e0f2fe' : '#bae6fd',
      riverShadow: isLight ? 'rgba(56, 189, 248, 0.4)' : '#38bdf8',
      roadGlow: isLight ? 'rgba(203, 213, 225, 0.7)' : 'rgba(255, 255, 255, 0.08)',
      roadBase: isLight ? '#94a3b8' : 'rgba(51, 65, 85, 0.9)',
      roadDash: isLight ? '#f59e0b' : 'rgba(250, 204, 21, 0.45)',
      circuitCasing: isLight ? 'rgba(37, 99, 235, 0.2)' : 'rgba(56, 189, 248, 0.22)',
      circuitRoad: isLight ? '#cbd5e1' : 'rgba(30, 41, 59, 0.85)',
      circuitLine: isLight ? '#2563eb' : '#38bdf8',
      circuitPulse: isLight ? '#fbbf24' : '#facc15',
      sanCristobal: isLight ? 'rgba(34, 197, 94, 0.35)' : 'rgba(16, 185, 129, 0.3)',
      textMain: isLight ? '#0f172a' : '#f8fafc',
      textMuted: isLight ? '#475569' : '#94a3b8',
      pointBg: isLight ? '#ffffff' : '#0f172a',
      pointBorder: isLight ? '#64748b' : '#38bdf8',
      bannerBg: isLight ? 'rgba(255, 255, 255, 0.94)' : 'rgba(15, 23, 42, 0.9)',
      bannerBorder: isLight ? 'rgba(148, 163, 184, 0.45)' : 'rgba(255, 255, 255, 0.15)'
    };
  }

  function drawBackgroundMap(w, h, time, colors) {
    // 1. Plano del valle de Santiago
    const gradBase = ctx.createLinearGradient(0, 0, w, h);
    gradBase.addColorStop(0, colors.bgGradStart);
    gradBase.addColorStop(0.5, colors.bgGradMid);
    gradBase.addColorStop(1, colors.bgGradEnd);
    ctx.fillStyle = gradBase;
    ctx.fillRect(0, 0, w, h);

    // 2. Malla ortogonal de manzanas urbanas
    ctx.strokeStyle = colors.gridColor;
    ctx.lineWidth = 1;
    const step = 26;
    ctx.beginPath();
    for (let x = 0; x < w; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = 0; y < h; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    // 3. Cordillera de los Andes al Oriente (derecha)
    ctx.save();
    const cordilleraGrad = ctx.createLinearGradient(w * 0.72, 0, w, 0);
    cordilleraGrad.addColorStop(0, 'rgba(0,0,0,0)');
    cordilleraGrad.addColorStop(0.4, colors.cordilleraFar);
    cordilleraGrad.addColorStop(1, colors.cordilleraNear);
    ctx.fillStyle = cordilleraGrad;

    ctx.beginPath();
    ctx.moveTo(w, 0);
    ctx.lineTo(w * 0.79, 0);
    ctx.lineTo(w * 0.82, h * 0.22);
    ctx.lineTo(w * 0.80, h * 0.40);
    ctx.lineTo(w * 0.84, h * 0.60);
    ctx.lineTo(w * 0.81, h * 0.82);
    ctx.lineTo(w * 0.86, h);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Cumbres nevadas de los Andes
    ctx.fillStyle = colors.snowColor;
    ctx.globalAlpha = colors.snowOpacity;
    ctx.beginPath();
    ctx.moveTo(w, 0);
    ctx.lineTo(w * 0.88, 0);
    ctx.lineTo(w * 0.85, h * 0.25);
    ctx.lineTo(w * 0.89, h * 0.52);
    ctx.lineTo(w * 0.87, h * 0.82);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.restore();

    // 4. Cerro San Cristóbal (Parque Metropolitano)
    const scX = w * 0.54;
    const scY = h * 0.36;
    const scGrad = ctx.createRadialGradient(scX, scY, 4, scX, scY, 42);
    scGrad.addColorStop(0, colors.sanCristobal);
    scGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = scGrad;
    ctx.beginPath();
    ctx.arc(scX, scY, 42, 0, Math.PI * 2);
    ctx.fill();

    // Virgen del San Cristóbal con halo blanco
    const virgenGlow = 0.5 + Math.sin(time * 0.003) * 0.25;
    ctx.fillStyle = `rgba(255, 255, 255, ${virgenGlow})`;
    ctx.beginPath();
    ctx.arc(scX, scY - 4, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // 5. Costanera Center (Torre Costanera en Sanhattan)
    const ccX = w * 0.74;
    const ccY = h * 0.37;
    const beacon = (Math.floor(time / 450) % 2 === 0);
    ctx.fillStyle = beacon ? '#ef4444' : 'rgba(239, 68, 68, 0.25)';
    ctx.beginPath();
    ctx.arc(ccX, ccY - 8, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 6. Río Mapocho luminoso cruzando la ciudad de Este a Oeste
    ctx.save();
    ctx.shadowColor = colors.riverShadow;
    ctx.shadowBlur = colors.isLight ? 4 : 10;
    ctx.strokeStyle = colors.riverOuter;
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.moveTo(w * 0.94, h * 0.28);
    ctx.bezierCurveTo(w * 0.76, h * 0.35, w * 0.62, h * 0.44, w * 0.53, h * 0.47);
    ctx.bezierCurveTo(w * 0.42, h * 0.48, w * 0.30, h * 0.50, w * 0.16, h * 0.53);
    ctx.lineTo(w * 0.04, h * 0.58);
    ctx.stroke();

    ctx.strokeStyle = colors.riverInner;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
  }

  // TRAZADO COMPLETO DE LA RUTA POR CADA PUNTO DEL MAPA (Los 40 puntos conectados en circuito)
  function drawFullCircuitRoute(w, h, time, colors) {
    if (SANTIAGO_POINTS.length < 2) return;

    ctx.save();
    // 1. Resplandor base del trazado vial completo
    ctx.strokeStyle = colors.circuitCasing;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    SANTIAGO_POINTS.forEach((pt, idx) => {
      const px = pt.x * w;
      const py = pt.y * h;
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    // Cerrar el circuito de vuelta a la Partida (punto 0)
    ctx.lineTo(SANTIAGO_POINTS[0].x * w, SANTIAGO_POINTS[0].y * h);
    ctx.stroke();

    // 2. Línea asfáltica principal del circuito
    ctx.strokeStyle = colors.circuitRoad;
    ctx.lineWidth = 2.8;
    ctx.stroke();

    // 3. Demarcación animada discontinua (flujo de energía / tránsito continuo)
    ctx.strokeStyle = colors.circuitLine;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([7, 6]);
    ctx.lineDashOffset = -time * 0.016; // Flujo animado
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Pulso de energía luminoso que recorre el circuito de puntos
    const circuitProgress = ((time * 0.00015) % 1.0);
    const pulsePt = samplePathPoint(SANTIAGO_POINTS, circuitProgress);
    ctx.fillStyle = colors.circuitPulse;
    ctx.shadowColor = colors.circuitPulse;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(pulsePt.x * w, pulsePt.y * h, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Dibuja los 40 puntos geográficos de las tarjetas del Gran Santiago
  // Resalta las propiedades del jugador con halo dorado y desplazamiento al centro
  function drawSantiagoPoints(w, h, time, colors) {
    const centerX = w * 0.5;
    const centerY = h * 0.5;

    SANTIAGO_POINTS.forEach((pt) => {
      const origPx = pt.x * w;
      const origPy = pt.y * h;
      const isHovered = hoveredPointId === pt.id;

      // Estado de propiedad en la partida
      const propState = currentRoomState?.properties?.[pt.id];
      const ownerId = propState?.ownerId;
      const isOwnedByMe = Boolean(ownerId && currentMyPlayerId && ownerId === currentMyPlayerId);
      const isOwnedByOther = Boolean(ownerId && (!currentMyPlayerId || ownerId !== currentMyPlayerId));
      const owner = isOwnedByOther ? currentRoomState?.players?.find((p) => p.id === ownerId) : null;

      // Calcular acercamiento de píxeles hacia el centro de la pantalla
      let finalPx = origPx;
      let finalPy = origPy;

      if (isOwnedByMe) {
        // Desplazar 9 píxeles hacia el centro de Santiago para que destaque físicamente
        const dx = centerX - origPx;
        const dy = centerY - origPy;
        const dist = Math.hypot(dx, dy) || 1;
        finalPx = origPx + (dx / dist) * 10;
        finalPy = origPy + (dy / dist) * 10;
      } else if (isOwnedByOther) {
        // Desplazar 4.5 píxeles hacia el centro
        const dx = centerX - origPx;
        const dy = centerY - origPy;
        const dist = Math.hypot(dx, dy) || 1;
        finalPx = origPx + (dx / dist) * 5;
        finalPy = origPy + (dy / dist) * 5;
      }

      ctx.save();

      // ================= CASO 1: PROPIEDAD DEL JUGADOR LOCAL (RESALTADO MÁXIMO) =================
      if (isOwnedByMe) {
        // 1. Halo dorado / ámbar resplandeciente con pulso
        const glowRadius = 12 + Math.sin(time * 0.005) * 3.5;
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(finalPx, finalPy, glowRadius, 0, Math.PI * 2);
        ctx.stroke();

        // 2. Línea guía punteada conectando el punto original desplazado
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(origPx, origPy);
        ctx.lineTo(finalPx, finalPy);
        ctx.stroke();
        ctx.setLineDash([]);

        // 3. Nodo central dorado grande
        ctx.fillStyle = '#fef08a';
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(finalPx, finalPy, 7.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 4. Badge flotante: 🔑 TÚ / Edificaciones
        ctx.fillStyle = '#f59e0b';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        let deedTag = '🔑 MÍA';
        if (propState.houses === 5) deedTag = '🏨 HOTEL';
        else if (propState.houses > 0) deedTag = `🏠 ${propState.houses}`;

        ctx.font = 'bold 8px system-ui, sans-serif';
        const tagW = ctx.measureText(deedTag).width + 8;
        ctx.beginPath();
        ctx.roundRect(finalPx - tagW / 2, finalPy - 22, tagW, 12, 3);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(deedTag, finalPx, finalPy - 16);

        // Nombre de la propiedad destacado
        ctx.fillStyle = colors.isLight ? '#0f172a' : '#fde047';
        ctx.font = 'bold 8.5px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${pt.name}`, finalPx + 11, finalPy + 3);
      }
      // ================= CASO 2: PROPIEDAD DE UN OPONENTE =================
      else if (isOwnedByOther && owner) {
        const ownerColor = owner.avatar?.color || '#ef4444';

        // Anillo con el color del oponente
        ctx.strokeStyle = ownerColor;
        ctx.lineWidth = 2.2;
        ctx.fillStyle = colors.pointBg;
        ctx.beginPath();
        ctx.arc(finalPx, finalPy, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Mini avatar o inicial del dueño
        ctx.font = '7.5px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(owner.avatar?.icon || '👤', finalPx, finalPy);

        if (isHovered) {
          ctx.fillStyle = ownerColor;
          ctx.font = 'bold 8px system-ui, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`🏢 ${pt.name} (${owner.name})`, finalPx + 9, finalPy + 3);
        }
      }
      // ================= CASO 3: PROPIEDAD O CASILLA DISPONIBLE / ESPECIAL =================
      else {
        ctx.fillStyle = colors.pointBg;
        ctx.strokeStyle = isHovered ? '#f59e0b' : pt.color;
        ctx.lineWidth = isHovered ? 2.5 : 1.2;

        if (pt.id === 0 || pt.id === 20 || pt.id === 39) {
          const pulseR = 7 + Math.sin(time * 0.004 + pt.id) * 3;
          ctx.beginPath();
          ctx.arc(finalPx, finalPy, pulseR, 0, Math.PI * 2);
          ctx.strokeStyle = isHovered ? 'rgba(245, 158, 11, 0.45)' : `${pt.color}55`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(finalPx, finalPy, isHovered ? 5.5 : 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        const isMajor = pt.id === 0 || pt.id === 1 || pt.id === 5 || pt.id === 13 || pt.id === 20 || pt.id === 26 || pt.id === 31 || pt.id === 39;
        if (isHovered || isMajor) {
          ctx.fillStyle = isHovered ? '#fbbf24' : colors.textMuted;
          ctx.font = isHovered ? 'bold 8.5px system-ui, sans-serif' : '7.5px system-ui, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`${pt.icon} ${pt.name}`, finalPx + 7, finalPy + 3);
        }
      }

      ctx.restore();
    });
  }

  function drawBus(bus, w, h, time, colors) {
    const pt = samplePathPoint(bus.route.path, bus.progress);
    const px = pt.x * w;
    const py = pt.y * h;
    let angle = pt.angle;
    if (bus.direction < 0) {
      angle += Math.PI;
    }

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);

    // Haz de luz de los focos delanteros
    ctx.save();
    const lightGrad = ctx.createRadialGradient(8, 0, 2, 42, 0, 32);
    lightGrad.addColorStop(0, colors.isLight ? 'rgba(254, 240, 138, 0.45)' : 'rgba(254, 240, 138, 0.7)');
    lightGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = lightGrad;
    ctx.beginPath();
    ctx.moveTo(8, -4);
    ctx.lineTo(44, -16);
    ctx.lineTo(44, 16);
    ctx.lineTo(8, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Luces traseras rojas
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-10, -3.5, 2, 2);
    ctx.fillRect(-10, 1.5, 2, 2);

    // Carrocería del bus
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(-8, -5, 18, 10);

    ctx.fillStyle = bus.route.busColor;
    ctx.beginPath();
    ctx.roundRect(-8, -4.5, 17, 9, 2);
    ctx.fill();

    // Techo blanco estándar Red
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-7, -4, 15, 3);

    // Parabrisas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(4, -3.5, 4, 7);
    ctx.fillRect(-5, -4, 8, 2);
    ctx.fillRect(-5, 2, 8, 2);

    // Letrero LED verde
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(5, -2, 2, 4);

    ctx.restore();

    // Número de recorrido flotante
    ctx.save();
    ctx.fillStyle = colors.bannerBg;
    ctx.strokeStyle = bus.route.busColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(px - 13, py - 16, 26, 10, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colors.textMain;
    ctx.font = 'bold 7.5px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(bus.route.busNumber, px, py - 11);
    ctx.restore();
  }

  function drawPlayersOnMap(w, h, time, delta, colors) {
    Object.keys(playerMapPositions).forEach((pId) => {
      const p = playerMapPositions[pId];
      if (!p) return;

      const targetPx = p.targetX * w;
      const targetPy = p.targetY * h;
      let currentPx = p.currentX * w;
      let currentPy = p.currentY * h;

      const dist = Math.hypot(targetPx - currentPx, targetPy - currentPy);
      if (dist > 1) {
        p.currentX += (p.targetX - p.currentX) * Math.min(delta * 5, 0.25);
        p.currentY += (p.targetY - p.currentY) * Math.min(delta * 5, 0.25);
        currentPx = p.currentX * w;
        currentPy = p.currentY * h;

        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(currentPx, currentPy);
        ctx.lineTo(targetPx, targetPy);
        ctx.stroke();
        ctx.restore();
      } else {
        p.moving = false;
      }

      if (p.pulse > 1.0) {
        p.pulse -= delta * 0.8;
        const pingRadius = 10 + (2.0 - p.pulse) * 20;
        ctx.save();
        ctx.strokeStyle = `rgba(56, 189, 248, ${Math.max(0, p.pulse - 1.0)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(currentPx, currentPy, pingRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.fillStyle = colors.bannerBg;
      ctx.beginPath();
      ctx.arc(currentPx, currentPy - 10, 11, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.avatar || '👤', currentPx, currentPy - 10);

      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.moveTo(currentPx - 3.5, currentPy);
      ctx.lineTo(currentPx + 3.5, currentPy);
      ctx.lineTo(currentPx, currentPy + 4);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = colors.bannerBg;
      ctx.strokeStyle = colors.bannerBorder;
      ctx.lineWidth = 1;
      const textWidth = ctx.measureText(p.name).width;
      ctx.beginPath();
      ctx.roundRect(currentPx - textWidth / 2 - 4, currentPy - 26, textWidth + 8, 12, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = colors.textMain;
      ctx.font = 'bold 8px system-ui, sans-serif';
      ctx.fillText(p.name, currentPx, currentPy - 20);
      ctx.restore();
    });
  }

  function drawMovementCallout(w, h, time, colors) {
    if (!activeMovementCallout) return;
    const age = (Date.now() - activeMovementCallout.timestamp) / 1000;
    if (age > 4.5) {
      activeMovementCallout = null;
      return;
    }

    const alpha = age < 0.3 ? (age / 0.3) : (age > 3.8 ? (4.5 - age) / 0.7 : 1.0);
    ctx.save();
    ctx.globalAlpha = alpha;

    const bannerW = Math.min(w * 0.82, 320);
    const bannerH = 22;
    const bannerX = (w - bannerW) / 2;
    const bannerY = h - 34;

    ctx.fillStyle = colors.bannerBg;
    ctx.strokeStyle = activeMovementCallout.color || '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 999);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colors.textMain;
    ctx.font = 'bold 8.5px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🗺️ ${activeMovementCallout.text}`, w / 2, bannerY + bannerH / 2);
    ctx.restore();
  }

  function animationLoop(timestamp) {
    if (!isRunning) return;
    if (!lastTimestamp) lastTimestamp = timestamp;
    const delta = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
    lastTimestamp = timestamp;

    if (!canvas || !ctx) {
      animId = requestAnimationFrame(animationLoop);
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const colors = getThemeColors();

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. Mapa cartográfico de base (valle, cerros, río)
    drawBackgroundMap(w, h, timestamp, colors);

    // 2. TRAZADO DE RUTA COMPLETO POR CADA PUNTO DEL MAPA (Los 40 puntos conectados en circuito)
    drawFullCircuitRoute(w, h, timestamp, colors);

    // 3. Puntos reales de las 40 tarjetas con resalte de propiedades compradas y acercamiento
    drawSantiagoPoints(w, h, timestamp, colors);

    // 4. Buses Transantiago / Red recorriendo las calles
    buses.forEach((bus) => {
      if (bus.pauseTimer > 0) {
        bus.pauseTimer -= delta;
      } else {
        bus.progress += bus.direction * bus.route.speed * delta;
        if (bus.progress >= 1.0) {
          bus.progress = 1.0;
          bus.direction = -1;
          bus.pauseTimer = 1.2;
        } else if (bus.progress <= 0.0) {
          bus.progress = 0.0;
          bus.direction = 1;
          bus.pauseTimer = 1.2;
        }
      }
      drawBus(bus, w, h, timestamp, colors);
    });

    // 5. Jugadores moviéndose sobre el mapa
    drawPlayersOnMap(w, h, timestamp, delta, colors);

    // 6. Notificación activa de movimiento
    drawMovementCallout(w, h, timestamp, colors);

    ctx.restore();

    animId = requestAnimationFrame(animationLoop);
  }

  function setTheme(theme) {
    currentTheme = theme === 'light' ? 'light' : 'dark';
    localStorage.setItem('gso_theme', currentTheme);
    if (canvas) {
      resizeCanvas();
    }
  }

  function initMapAnimation() {
    canvas = document.getElementById('santiago-map-canvas');
    if (!canvas) return;

    ctx = canvas.getContext('2d', { alpha: false });
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Detección de hover y toque táctil sobre los puntos de las tarjetas
    function detectPointAt(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const mouseX = clientX - rect.left;
      const mouseY = clientY - rect.top;
      const centerX = w * 0.5;
      const centerY = h * 0.5;

      let found = null;
      const hitRadius = window.matchMedia && window.matchMedia('(pointer: coarse)').matches ? 24 : 15;
      for (const pt of SANTIAGO_POINTS) {
        let px = pt.x * w;
        let py = pt.y * h;
        const propState = currentRoomState?.properties?.[pt.id];
        if (propState?.ownerId) {
          const isOwnedByMe = propState.ownerId === currentMyPlayerId;
          const dx = centerX - px;
          const dy = centerY - py;
          const dist = Math.hypot(dx, dy) || 1;
          const shift = isOwnedByMe ? 10 : 5;
          px += (dx / dist) * shift;
          py += (dy / dist) * shift;
        }
        if (Math.hypot(mouseX - px, mouseY - py) < hitRadius) {
          found = pt.id;
          break;
        }
      }
      return found;
    }

    canvas.addEventListener('mousemove', (e) => {
      hoveredPointId = detectPointAt(e.clientX, e.clientY);
    });

    canvas.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) {
        const found = detectPointAt(e.touches[0].clientX, e.touches[0].clientY);
        if (found !== null) {
          hoveredPointId = found;
          if (typeof window.openPropertyModal === 'function') {
            window.openPropertyModal(found);
          }
        }
      }
    }, { passive: true });

    canvas.addEventListener('mouseleave', () => {
      hoveredPointId = null;
    });

    canvas.addEventListener('click', () => {
      if (hoveredPointId !== null && typeof window.openPropertyModal === 'function') {
        window.openPropertyModal(hoveredPointId);
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopMapAnimation();
      } else {
        startMapAnimation();
      }
    });

    startMapAnimation();
  }

  function startMapAnimation() {
    if (isRunning) return;
    isRunning = true;
    lastTimestamp = 0;
    animId = requestAnimationFrame(animationLoop);
  }

  function stopMapAnimation() {
    isRunning = false;
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  }

  window.SantiagoMapAnimation = {
    init: initMapAnimation,
    start: startMapAnimation,
    stop: stopMapAnimation,
    resize: resizeCanvas,
    setTheme: setTheme,
    setPlayerTile: setPlayerTile,
    updateGameState: updateGameState,
    SANTIAGO_POINTS: SANTIAGO_POINTS
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMapAnimation);
  } else {
    setTimeout(initMapAnimation, 50);
  }
})();
