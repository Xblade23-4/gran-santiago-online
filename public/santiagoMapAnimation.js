/**
 * santiagoMapAnimation.js
 * Animación fluida de mapa interactivo en el centro del tablero de Gran Santiago.
 * Dibuja el valle de Santiago, el Río Mapocho luminoso, la Cordillera de los Andes,
 * cerros San Cristóbal y Santa Lucía, Costanera Center, y buses Transantiago / Red Movilidad
 * recorriendo las grandes avenidas con faros iluminados y paradas en estaciones.
 */

(function () {
  'use strict';

  let canvas = null;
  let ctx = null;
  let animId = null;
  let lastTimestamp = 0;
  let isRunning = false;

  // Rutas viales vectoriales escaladas en proporción porcentual [0..1]
  const MAP_ROUTES = [
    {
      id: 'alameda-providencia',
      name: 'Eje Alameda - Providencia - Apoquindo',
      busLine: '406 CANTAGALLO',
      busNumber: '406',
      busColor: '#dc2626', // Red Movilidad rojo
      speed: 0.055,
      path: [
        { x: 0.08, y: 0.62 }, // Maipú / Pajaritos
        { x: 0.22, y: 0.58 }, // Estación Central
        { x: 0.40, y: 0.53 }, // La Moneda / Paseo Ahumada
        { x: 0.54, y: 0.48 }, // Plaza Baquedano
        { x: 0.72, y: 0.41 }, // Providencia / Pedro de Valdivia
        { x: 0.88, y: 0.34 }  // El Golf / Las Condes
      ]
    },
    {
      id: 'vicuna-mackenna',
      name: 'Eje Vicuña Mackenna',
      busLine: '210 PUENTE ALTO',
      busNumber: '210',
      busColor: '#059669', // Verde clásico transantiago
      speed: 0.048,
      path: [
        { x: 0.54, y: 0.48 }, // Baquedano
        { x: 0.58, y: 0.60 }, // Irarrázaval
        { x: 0.63, y: 0.72 }, // Ñuñoa / San Joaquín
        { x: 0.69, y: 0.85 }, // La Florida
        { x: 0.76, y: 0.94 }  // Plaza de Puente Alto
      ]
    },
    {
      id: 'autopista-central',
      name: 'Autopista Central (Ruta 5)',
      busLine: '301 SAN BERNARDO',
      busNumber: '301',
      busColor: '#2563eb', // Azul
      speed: 0.062,
      path: [
        { x: 0.36, y: 0.12 }, // Conchalí / Norte
        { x: 0.37, y: 0.34 }, // Cal y Canto
        { x: 0.38, y: 0.54 }, // Santiago Centro
        { x: 0.39, y: 0.75 }, // Parque O'Higgins / Franklin
        { x: 0.41, y: 0.94 }  // Gran Avenida / Sur
      ]
    },
    {
      id: 'vespucio-norte-oriente',
      name: 'Circunvalación Américo Vespucio',
      busLine: '506 PEÑALOLÉN',
      busNumber: '506',
      busColor: '#dc2626', // Red Movilidad rojo
      speed: 0.05,
      path: [
        { x: 0.12, y: 0.28 },
        { x: 0.26, y: 0.18 },
        { x: 0.50, y: 0.16 },
        { x: 0.76, y: 0.22 },
        { x: 0.89, y: 0.44 },
        { x: 0.85, y: 0.70 },
        { x: 0.68, y: 0.88 }
      ]
    },
    {
      id: 'recoleta-independencia',
      name: 'Eje Norte - Recoleta e Independencia',
      busLine: '208 RECOLETA',
      busNumber: '208',
      busColor: '#d97706',
      speed: 0.052,
      path: [
        { x: 0.48, y: 0.12 },
        { x: 0.49, y: 0.28 },
        { x: 0.51, y: 0.40 },
        { x: 0.54, y: 0.48 }
      ]
    }
  ];

  // Estado de los buses en circulación
  const buses = MAP_ROUTES.map((route, i) => ({
    route,
    progress: (i * 0.23) % 1.0,
    direction: 1, // 1 hacia adelante, -1 regresando
    pauseTimer: 0,
    x: 0,
    y: 0,
    angle: 0
  }));

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
    const width = Math.max(Math.floor(rect.width), 300);
    const height = Math.max(Math.floor(rect.height), 300);

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }
  }

  function drawBackgroundMap(w, h, time) {
    // 1. Cielo crepuscular y plano base de la cuenca de Santiago
    const gradBase = ctx.createLinearGradient(0, 0, w, h);
    gradBase.addColorStop(0, '#0a1020');
    gradBase.addColorStop(0.5, '#0e172a');
    gradBase.addColorStop(1, '#050b18');
    ctx.fillStyle = gradBase;
    ctx.fillRect(0, 0, w, h);

    // 2. Malla urbana tenue (cuadrícula ortogonal de manzanas santiaguinas)
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.16)';
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

    // 3. Cordillera de los Andes al Oriente (borde derecho) con nieve fosforescente
    ctx.save();
    const cordilleraGrad = ctx.createLinearGradient(w * 0.7, 0, w, 0);
    cordilleraGrad.addColorStop(0, 'rgba(30, 41, 59, 0)');
    cordilleraGrad.addColorStop(0.4, 'rgba(51, 65, 85, 0.45)');
    cordilleraGrad.addColorStop(1, 'rgba(71, 85, 105, 0.75)');
    ctx.fillStyle = cordilleraGrad;

    ctx.beginPath();
    ctx.moveTo(w, 0);
    ctx.lineTo(w * 0.78, 0);
    ctx.lineTo(w * 0.82, h * 0.2);
    ctx.lineTo(w * 0.79, h * 0.38);
    ctx.lineTo(w * 0.84, h * 0.58);
    ctx.lineTo(w * 0.81, h * 0.78);
    ctx.lineTo(w * 0.86, h);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Picos nevados brillantes
    ctx.fillStyle = 'rgba(241, 245, 249, 0.35)';
    ctx.beginPath();
    ctx.moveTo(w, 0);
    ctx.lineTo(w * 0.88, 0);
    ctx.lineTo(w * 0.85, h * 0.25);
    ctx.lineTo(w * 0.89, h * 0.5);
    ctx.lineTo(w * 0.87, h * 0.8);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 4. Cerro San Cristóbal (Parque Metropolitano)
    const scX = w * 0.54;
    const scY = h * 0.36;
    const scGrad = ctx.createRadialGradient(scX, scY, 5, scX, scY, 45);
    scGrad.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
    scGrad.addColorStop(0.6, 'rgba(5, 150, 105, 0.2)');
    scGrad.addColorStop(1, 'rgba(6, 78, 59, 0)');
    ctx.fillStyle = scGrad;
    ctx.beginPath();
    ctx.arc(scX, scY, 45, 0, Math.PI * 2);
    ctx.fill();

    // Estatua de la Virgen con halo luminoso blanco
    const virgenGlow = 0.5 + Math.sin(time * 0.003) * 0.2;
    ctx.fillStyle = `rgba(255, 255, 255, ${virgenGlow})`;
    ctx.beginPath();
    ctx.arc(scX, scY - 4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '8px system-ui, sans-serif';
    ctx.fillText('⛪ San Cristóbal', scX + 6, scY - 2);

    // 5. Cerro Santa Lucía
    const slX = w * 0.44;
    const slY = h * 0.50;
    ctx.fillStyle = 'rgba(34, 197, 94, 0.22)';
    ctx.beginPath();
    ctx.arc(slX, slY, 16, 0, Math.PI * 2);
    ctx.fill();

    // 6. Costanera Center (Torre Costanera) con baliza roja intermitente
    const ccX = w * 0.74;
    const ccY = h * 0.38;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.beginPath();
    ctx.arc(ccX, ccY, 4.5, 0, Math.PI * 2);
    ctx.fill();
    // Baliza roja aeronáutica parpadeante
    const beacon = (Math.floor(time / 500) % 2 === 0);
    ctx.fillStyle = beacon ? '#ef4444' : 'rgba(239, 68, 68, 0.2)';
    ctx.beginPath();
    ctx.arc(ccX, ccY - 6, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px system-ui, sans-serif';
    ctx.fillText('🏙️ Sanhattan', ccX + 8, ccY - 2);

    // 7. Río Mapocho luminoso (cruza Santiago de Oriente a Poniente)
    ctx.save();
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(w * 0.92, h * 0.30);
    ctx.bezierCurveTo(w * 0.75, h * 0.36, w * 0.60, h * 0.44, w * 0.50, h * 0.46);
    ctx.bezierCurveTo(w * 0.42, h * 0.47, w * 0.32, h * 0.48, w * 0.18, h * 0.52);
    ctx.lineTo(w * 0.05, h * 0.56);
    ctx.stroke();

    // Núcleo brillante del agua del Mapocho
    ctx.strokeStyle = '#bae6fd';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // 8. Trazado de las grandes avenidas (asfalto con iluminación nocturna)
    MAP_ROUTES.forEach((route) => {
      ctx.save();
      // Resplandor de la vía
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 7;
      ctx.beginPath();
      route.path.forEach((pt, idx) => {
        const px = pt.x * w;
        const py = pt.y * h;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      // Vía principal
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.85)';
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Línea divisoria central discontinua
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.restore();
    });

    // 9. Paraderos y Nodos principales señalizados
    const NODES = [
      { name: 'Plaza Baquedano', x: 0.54, y: 0.48, icon: '📍' },
      { name: 'La Moneda', x: 0.40, y: 0.53, icon: '🏛️' },
      { name: 'Est. Central', x: 0.22, y: 0.58, icon: '🚆' },
      { name: 'Parque O\'Higgins', x: 0.39, y: 0.75, icon: '🎡' },
      { name: 'Plaza Ñuñoa', x: 0.65, y: 0.62, icon: '🌳' },
      { name: 'Puente Alto', x: 0.76, y: 0.94, icon: '🏔️' },
      { name: 'Pajaritos / Maipú', x: 0.08, y: 0.62, icon: '🌿' }
    ];

    NODES.forEach((node) => {
      const nx = node.x * w;
      const ny = node.y * h;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.beginPath();
      ctx.arc(nx, ny, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 8px system-ui, sans-serif';
      ctx.fillText(node.name, nx + 9, ny + 3);
    });
  }

  function drawBus(bus, w, h, time) {
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

    // Haz de luz de los focos delanteros (Headlights)
    ctx.save();
    const lightGrad = ctx.createRadialGradient(10, 0, 2, 45, 0, 35);
    lightGrad.addColorStop(0, 'rgba(254, 240, 138, 0.65)');
    lightGrad.addColorStop(0.5, 'rgba(254, 240, 138, 0.25)');
    lightGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = lightGrad;
    ctx.beginPath();
    ctx.moveTo(8, -4);
    ctx.lineTo(46, -18);
    ctx.lineTo(46, 18);
    ctx.lineTo(8, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Estela de luces traseras rojas (Taillights)
    ctx.fillStyle = 'rgba(239, 68, 68, 0.75)';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 6;
    ctx.fillRect(-11, -3.5, 2, 2);
    ctx.fillRect(-11, 1.5, 2, 2);
    ctx.shadowBlur = 0;

    // Carrocería del Bus Transantiago / Red
    // Sombra del chasis
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(-9, -5, 20, 10);

    // Mitad inferior roja (Red Movilidad)
    ctx.fillStyle = bus.route.busColor;
    ctx.beginPath();
    ctx.roundRect(-9, -4.5, 19, 9, 2);
    ctx.fill();

    // Techo blanco característico del nuevo estándar Red
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-8, -4, 17, 3);

    // Parabrisas y ventanas oscuras
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(5, -3.5, 4, 7); // Parabrisas delantero
    ctx.fillRect(-6, -4, 9, 2);  // Ventanales laterales izq
    ctx.fillRect(-6, 2, 9, 2);   // Ventanales laterales der

    // Letrero LED verde con número de recorrido ("406", "210", etc.)
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(6, -2, 2, 4);

    ctx.restore();

    // Cartel flotante sutil con el número de línea sobre el bus
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = bus.route.busColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(px - 14, py - 18, 28, 11, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(bus.route.busNumber, px, py - 12);
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

    ctx.save();
    ctx.scale(dpr, dpr);

    // Dibujar mapa vectorial nocturno de Santiago
    drawBackgroundMap(w, h, timestamp);

    // Actualizar y dibujar cada bus Transantiago en su recorrido
    buses.forEach((bus) => {
      if (bus.pauseTimer > 0) {
        bus.pauseTimer -= delta;
      } else {
        bus.progress += bus.direction * bus.route.speed * delta;
        if (bus.progress >= 1.0) {
          bus.progress = 1.0;
          bus.direction = -1;
          bus.pauseTimer = 1.2; // Breve pausa en terminal
        } else if (bus.progress <= 0.0) {
          bus.progress = 0.0;
          bus.direction = 1;
          bus.pauseTimer = 1.2;
        }
      }

      drawBus(bus, w, h, timestamp);
    });

    ctx.restore();

    animId = requestAnimationFrame(animationLoop);
  }

  function initMapAnimation() {
    canvas = document.getElementById('santiago-map-canvas');
    if (!canvas) return;

    ctx = canvas.getContext('2d', { alpha: false });
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Pausar cuando la pestaña no es visible para ahorrar recursos
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
    resize: resizeCanvas
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMapAnimation);
  } else {
    setTimeout(initMapAnimation, 50);
  }
})();
