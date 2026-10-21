/**
 * santiagoMapAnimation.js -> SantiagoMap (Modo Estático de Alto Rendimiento)
 * Mapa cartográfico estático de Santiago de Chile para el centro del tablero.
 * - Sin bucles continuos de animación ni buses en movimiento (ahorro total de CPU/batería).
 * - Dibuja el valle central de Santiago, la Cordillera de los Andes con nieve, el Cerro San Cristóbal y el Río Mapocho.
 * - Conecta los 40 puntos de las casillas/tarjetas del Gran Santiago agrupadas por cercanía geográfica.
 * - Resalte estático de propiedades compradas: halo de color del dueño y desplazamiento hacia el centro.
 * - Muestra en tiempo real la ubicación de cada jugador en el mapa sin lag.
 * - Soporta Modo Claro (Daylight) y Modo Oscuro (Night).
 */

(function () {
  'use strict';

  let canvas = null;
  let ctx = null;
  let currentTheme = localStorage.getItem('gso_theme') || 'dark';

  let currentRoomState = null;
  let currentMyPlayerId = null;
  let hoveredPointId = null;

  // Coordenadas geográficas normalizadas [0..1] para las 40 casillas del Gran Santiago
  const SANTIAGO_POINTS = [
    { id: 0, name: 'Plaza Baquedano', comuna: 'Santiago Centro / Providencia', x: 0.53, y: 0.48, color: '#ef4444', icon: '🇨🇱', type: 'go' },
    { id: 1, name: 'Av. Pajaritos', comuna: 'Maipú', x: 0.12, y: 0.62, color: '#8b4513', icon: '🐦', type: 'property' },
    { id: 2, name: 'Lotería de Beneficencia', comuna: 'Santiago Centro', x: 0.43, y: 0.50, color: '#0284c7', icon: '🍀', type: 'community' },
    { id: 3, name: 'Gran Avenida', comuna: 'San Miguel', x: 0.40, y: 0.82, color: '#8b4513', icon: '🛣️', type: 'property' },
    { id: 4, name: 'Impuesto SII', comuna: 'Teatinos', x: 0.38, y: 0.52, color: '#f59e0b', icon: '💸', type: 'tax' },
    { id: 5, name: 'Metro Estación Central', comuna: 'Estación Central', x: 0.23, y: 0.58, color: '#dc2626', icon: '🚆', type: 'station' },
    { id: 6, name: 'Barrio Patronato', comuna: 'Recoleta', x: 0.50, y: 0.36, color: '#38bdf8', icon: '🧵', type: 'property' },
    { id: 7, name: '¡Aló Santiago!', comuna: 'Centro', x: 0.47, y: 0.45, color: '#eab308', icon: '❓', type: 'chance' },
    { id: 8, name: 'Av. Independencia', comuna: 'Independencia', x: 0.44, y: 0.26, color: '#38bdf8', icon: '🏛️', type: 'property' },
    { id: 9, name: 'Av. Dorsal', comuna: 'Conchalí', x: 0.42, y: 0.18, color: '#38bdf8', icon: '🛣️', type: 'property' },
    { id: 10, name: 'Comisaría / De Visita', comuna: 'Santiago Centro', x: 0.34, y: 0.56, color: '#64748b', icon: '🚓', type: 'jail' },
    { id: 11, name: 'Av. Vicuña Mackenna', comuna: 'La Florida', x: 0.60, y: 0.68, color: '#ec4899', icon: '🌳', type: 'property' },
    { id: 12, name: 'Compañía Eléctrica', comuna: 'Santa Rosa', x: 0.47, y: 0.58, color: '#eab308', icon: '⚡', type: 'utility' },
    { id: 13, name: 'Plaza de Puente Alto', comuna: 'Puente Alto', x: 0.78, y: 0.94, color: '#ec4899', icon: '🏔️', type: 'property' },
    { id: 14, name: 'La Pintana', comuna: 'La Pintana', x: 0.54, y: 0.90, color: '#ec4899', icon: '🏘️', type: 'property' },
    { id: 15, name: 'Metro Cal y Canto', comuna: 'Santiago Norte', x: 0.42, y: 0.40, color: '#dc2626', icon: '🚇', type: 'station' },
    { id: 16, name: 'Barrio República', comuna: 'Santiago Poniente', x: 0.34, y: 0.58, color: '#f97316', icon: '🏰', type: 'property' },
    { id: 17, name: 'Lotería de Beneficencia', comuna: 'Santiago Centro', x: 0.44, y: 0.49, color: '#0284c7', icon: '🍀', type: 'community' },
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
    { id: 28, name: 'Aguas del Valle Central', comuna: 'Cordillera', x: 0.86, y: 0.28, color: '#06b6d4', icon: '💧', type: 'utility' },
    { id: 29, name: 'Av. Macul', comuna: 'Macul', x: 0.65, y: 0.74, color: '#eab308', icon: '🏡', type: 'property' },
    { id: 30, name: 'Control Carabineros', comuna: 'Vespucio Norte', x: 0.30, y: 0.22, color: '#ef4444', icon: '🚨', type: 'gotojail' },
    { id: 31, name: 'Av. Providencia', comuna: 'Providencia', x: 0.65, y: 0.44, color: '#22c55e', icon: '🏬', type: 'property' },
    { id: 32, name: 'Pedro de Valdivia Norte', comuna: 'Providencia', x: 0.62, y: 0.37, color: '#22c55e', icon: '🌲', type: 'property' },
    { id: 33, name: 'Lotería de Beneficencia', comuna: 'Santiago Centro', x: 0.46, y: 0.53, color: '#0284c7', icon: '🍀', type: 'community' },
    { id: 34, name: 'Barrio Bellavista', comuna: 'Providencia', x: 0.56, y: 0.41, color: '#22c55e', icon: '🎭', type: 'property' },
    { id: 35, name: 'Metro Tobalaba', comuna: 'Sanhattan', x: 0.73, y: 0.39, color: '#dc2626', icon: '🚇', type: 'station' },
    { id: 36, name: '¡Aló Santiago!', comuna: 'Cordillera', x: 0.82, y: 0.32, color: '#eab308', icon: '❓', type: 'chance' },
    { id: 37, name: 'Av. Alonso de Córdova', comuna: 'Vitacura', x: 0.82, y: 0.23, color: '#3b82f6', icon: '💎', type: 'property' },
    { id: 38, name: 'TAG Costanera Norte', comuna: 'Ruta Río', x: 0.68, y: 0.33, color: '#f59e0b', icon: '💳', type: 'tax' },
    { id: 39, name: 'Sanhattan (Costanera)', comuna: 'Las Condes', x: 0.74, y: 0.37, color: '#3b82f6', icon: '🏙️', type: 'property' }
  ];

  // Rutas estáticas de las principales avenidas de Santiago
  const STATIC_AVENUES = [
    // Alameda - Providencia - Apoquindo
    [ { x: 0.12, y: 0.62 }, { x: 0.23, y: 0.58 }, { x: 0.40, y: 0.54 }, { x: 0.53, y: 0.48 }, { x: 0.65, y: 0.44 }, { x: 0.74, y: 0.37 }, { x: 0.82, y: 0.23 } ],
    // Vicuña Mackenna hacia Puente Alto
    [ { x: 0.53, y: 0.48 }, { x: 0.60, y: 0.68 }, { x: 0.65, y: 0.74 }, { x: 0.54, y: 0.90 }, { x: 0.78, y: 0.94 } ],
    // Gran Avenida hacia el sur
    [ { x: 0.40, y: 0.54 }, { x: 0.38, y: 0.74 }, { x: 0.40, y: 0.82 } ],
    // Independencia hacia el norte
    [ { x: 0.42, y: 0.40 }, { x: 0.44, y: 0.26 }, { x: 0.42, y: 0.18 } ],
    // Américo Vespucio Oriente / Oriente Cívico
    [ { x: 0.82, y: 0.23 }, { x: 0.76, y: 0.58 }, { x: 0.66, y: 0.61 }, { x: 0.60, y: 0.68 } ]
  ];

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
      roadBase: isLight ? '#cbd5e1' : 'rgba(51, 65, 85, 0.7)',
      roadDash: isLight ? '#f59e0b' : 'rgba(250, 204, 21, 0.4)',
      circuitLine: isLight ? '#2563eb' : '#38bdf8',
      sanCristobal: isLight ? 'rgba(34, 197, 94, 0.35)' : 'rgba(16, 185, 129, 0.3)',
      textMain: isLight ? '#0f172a' : '#f8fafc',
      textMuted: isLight ? '#475569' : '#94a3b8',
      pointBg: isLight ? '#ffffff' : '#0f172a',
      pointBorder: isLight ? '#64748b' : '#38bdf8'
    };
  }

  function renderMap() {
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    if (w <= 0 || h <= 0) return;

    const colors = getThemeColors();

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. Fondo base del valle de Santiago
    const gradBase = ctx.createLinearGradient(0, 0, w, h);
    gradBase.addColorStop(0, colors.bgGradStart);
    gradBase.addColorStop(0.5, colors.bgGradMid);
    gradBase.addColorStop(1, colors.bgGradEnd);
    ctx.fillStyle = gradBase;
    ctx.fillRect(0, 0, w, h);

    // 2. Cuadrícula ortogonal de manzanas de la capital
    ctx.strokeStyle = colors.gridColor;
    ctx.lineWidth = 1;
    const step = 28;
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

    // 3. Cordillera de los Andes al Oriente (silueta montañosa estática)
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

    // Nieve en las altas cumbres
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
    const scGrad = ctx.createRadialGradient(scX, scY, 4, scX, scY, 40);
    scGrad.addColorStop(0, colors.sanCristobal);
    scGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = scGrad;
    ctx.beginPath();
    ctx.arc(scX, scY, 40, 0, Math.PI * 2);
    ctx.fill();

    // 5. Río Mapocho cruzando Santiago
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(w * 0.95, h * 0.22);
    ctx.bezierCurveTo(w * 0.78, h * 0.30, w * 0.65, h * 0.38, w * 0.53, h * 0.44);
    ctx.bezierCurveTo(w * 0.42, h * 0.48, w * 0.28, h * 0.50, 0, h * 0.54);
    ctx.strokeStyle = colors.riverOuter;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(w * 0.95, h * 0.22);
    ctx.bezierCurveTo(w * 0.78, h * 0.30, w * 0.65, h * 0.38, w * 0.53, h * 0.44);
    ctx.bezierCurveTo(w * 0.42, h * 0.48, w * 0.28, h * 0.50, 0, h * 0.54);
    ctx.strokeStyle = colors.riverInner;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    // 6. Principales avenidas de Santiago (estáticas)
    STATIC_AVENUES.forEach((pts) => {
      if (pts.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(pts[0].x * w, pts[0].y * h);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x * w, pts[i].y * h);
      }
      ctx.strokeStyle = colors.roadBase;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(pts[0].x * w, pts[0].y * h);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x * w, pts[i].y * h);
      }
      ctx.strokeStyle = colors.roadDash;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // 7. Trazado del circuito conectando los 40 puntos
    ctx.save();
    ctx.beginPath();
    const p0 = SANTIAGO_POINTS[0];
    ctx.moveTo(p0.x * w, p0.y * h);
    for (let i = 1; i < SANTIAGO_POINTS.length; i++) {
      ctx.lineTo(SANTIAGO_POINTS[i].x * w, SANTIAGO_POINTS[i].y * h);
    }
    ctx.closePath();
    ctx.strokeStyle = colors.circuitLine;
    ctx.lineWidth = 1.8;
    ctx.setLineDash([3, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // 8. Dibujar los 40 puntos de las tarjetas con sus propiedades y halos
    const centerX = w * 0.5;
    const centerY = h * 0.5;
    const isMobile = w < 480;

    SANTIAGO_POINTS.forEach((pt) => {
      let px = pt.x * w;
      let py = pt.y * h;

      const propState = currentRoomState?.properties?.[pt.id];
      const ownerId = propState?.ownerId;
      const isOwned = Boolean(ownerId);
      const isOwnedByMe = isOwned && (ownerId === currentMyPlayerId);
      const ownerPlayer = isOwned ? currentRoomState?.players?.find((p) => p.id === ownerId) : null;
      const ownerColor = ownerPlayer?.color || '#3b82f6';

      // Si tiene dueño, acercar unos píxeles al centro del mapa
      if (isOwned) {
        const dx = centerX - px;
        const dy = centerY - py;
        const dist = Math.hypot(dx, dy) || 1;
        const shift = isOwnedByMe ? 9 : 5;
        px += (dx / dist) * shift;
        py += (dy / dist) * shift;
      }

      // Halo de propiedad comprada
      if (isOwned) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, isOwnedByMe ? 12 : 9, 0, Math.PI * 2);
        ctx.fillStyle = ownerColor;
        ctx.globalAlpha = isOwnedByMe ? 0.35 : 0.2;
        ctx.fill();
        ctx.lineWidth = isOwnedByMe ? 2.5 : 1.5;
        ctx.strokeStyle = ownerColor;
        ctx.globalAlpha = 0.9;
        ctx.stroke();
        ctx.restore();
      }

      // Punto base
      ctx.beginPath();
      const r = isOwned ? (isOwnedByMe ? 6.5 : 5.5) : 4.5;
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = pt.color || colors.pointBg;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = colors.pointBorder;
      ctx.stroke();

      // En pantallas medianas o si el punto está en hover, dibujar etiqueta
      if (!isMobile || hoveredPointId === pt.id || isOwned) {
        ctx.font = '10px sans-serif';
        ctx.fillStyle = colors.textMain;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        const labelText = isOwned && ownerPlayer ? `${ownerPlayer.avatar?.icon || '🏠'} ${pt.name}` : pt.name;
        ctx.fillText(labelText, px, py - 6);
      }
    });

    // 9. Dibujar las fichas de los jugadores en sus posiciones actuales
    if (currentRoomState && currentRoomState.players) {
      currentRoomState.players.forEach((p, idx) => {
        if (p.bankrupt) return;
        const tile = SANTIAGO_POINTS[p.position % SANTIAGO_POINTS.length];
        if (!tile) return;

        // Desfase en caso de coincidir varios jugadores en la misma casilla
        const angle = (idx / Math.max(1, currentRoomState.players.length)) * Math.PI * 2;
        const offsetDist = currentRoomState.players.length > 1 ? 12 : 0;
        const fx = tile.x * w + Math.cos(angle) * offsetDist;
        const fy = tile.y * h + Math.sin(angle) * offsetDist;

        // Ficha del jugador
        ctx.save();
        ctx.beginPath();
        ctx.arc(fx, fy, 11, 0, Math.PI * 2);
        ctx.fillStyle = p.color || '#22c55e';
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        // Icono o inicial
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.avatar?.icon || p.name.charAt(0), fx, fy);
        ctx.restore();
      });
    }

    ctx.restore();
  }

  function resizeCanvas() {
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(rect.width, 280);
    const height = Math.max(rect.height, 280);

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    renderMap();
  }

  function setTheme(theme) {
    currentTheme = theme === 'light' ? 'light' : 'dark';
    localStorage.setItem('gso_theme', currentTheme);
    renderMap();
  }

  function updateGameState(roomState, myPlayerId) {
    currentRoomState = roomState;
    currentMyPlayerId = myPlayerId;
    renderMap();
  }

  function setPlayerTile(playerId, tileId) {
    if (currentRoomState && currentRoomState.players) {
      const pl = currentRoomState.players.find((p) => p.id === playerId);
      if (pl) pl.position = tileId;
    }
    renderMap();
  }

  function initStaticMap() {
    canvas = document.getElementById('santiago-map-canvas');
    if (!canvas) return;

    ctx = canvas.getContext('2d', { alpha: false });
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Detección de hover y toque sobre los puntos
    function detectPointAt(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const mouseX = clientX - rect.left;
      const mouseY = clientY - rect.top;

      let found = null;
      const hitRadius = 18;
      for (const pt of SANTIAGO_POINTS) {
        const px = pt.x * w;
        const py = pt.y * h;
        if (Math.hypot(mouseX - px, mouseY - py) < hitRadius) {
          found = pt.id;
          break;
        }
      }
      return found;
    }

    canvas.addEventListener('mousemove', (e) => {
      const prev = hoveredPointId;
      hoveredPointId = detectPointAt(e.clientX, e.clientY);
      if (prev !== hoveredPointId) renderMap();
    });

    canvas.addEventListener('mouseleave', () => {
      hoveredPointId = null;
      renderMap();
    });

    canvas.addEventListener('click', () => {
      if (hoveredPointId !== null && typeof window.openPropertyModal === 'function') {
        window.openPropertyModal(hoveredPointId);
      }
    });

    canvas.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) {
        const found = detectPointAt(e.touches[0].clientX, e.touches[0].clientY);
        if (found !== null && typeof window.openPropertyModal === 'function') {
          window.openPropertyModal(found);
        }
      }
    }, { passive: true });

    renderMap();
  }

  window.SantiagoMapAnimation = {
    init: initStaticMap,
    start: () => renderMap(),
    stop: () => {},
    resize: resizeCanvas,
    setTheme: setTheme,
    setPlayerTile: setPlayerTile,
    updateGameState: updateGameState,
    render: renderMap,
    SANTIAGO_POINTS: SANTIAGO_POINTS
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStaticMap);
  } else {
    setTimeout(initStaticMap, 50);
  }
})();
