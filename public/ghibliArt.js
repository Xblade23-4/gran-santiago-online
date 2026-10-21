/**
 * scenicArt.js (ghibliArt.js) - Ilustraciones artísticas vectoriales para las tarjetas de lugares de Gran Santiago
 * Genera escenas vectoriales SVG detalladas con estética de acuarela paisajista, cielos pastel,
 * cordillera nevada de los Andes, arquitectura santiaguina y vegetación urbana.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const exported = factory();
    root.ScenicArt = exported;
    root.GhibliArt = exported; // Alias de retrocompatibilidad
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Cielos y paletas por zona / tipo
  const PALETTES = {
    sunset: {
      skyTop: '#3b5998',
      skyMid: '#ea8673',
      skyBot: '#f8d189',
      sun: '#fff4cc',
      mountainFar: '#5d587c',
      mountainNear: '#3e3b5e',
      snow: '#ffeedd',
      treeDark: '#214d35',
      treeLight: '#3f7c55',
      accent: '#f26419'
    },
    morning: {
      skyTop: '#4a90e2',
      skyMid: '#91c8f6',
      skyBot: '#fdf6e2',
      sun: '#fff8db',
      mountainFar: '#688cb0',
      mountainNear: '#3a5f82',
      snow: '#f0f9ff',
      treeDark: '#1b4d3e',
      treeLight: '#438965',
      accent: '#2a9d8f'
    },
    dusk: {
      skyTop: '#2b2d42',
      skyMid: '#8d5b75',
      skyBot: '#e09f67',
      sun: '#ffd670',
      mountainFar: '#403d58',
      mountainNear: '#22223b',
      snow: '#fcd5ce',
      treeDark: '#1a3328',
      treeLight: '#2c5e43',
      accent: '#e76f51'
    },
    golden: {
      skyTop: '#4361ee',
      skyMid: '#b5838d',
      skyBot: '#ffb703',
      sun: '#fff3b0',
      mountainFar: '#565264',
      mountainNear: '#3b3247',
      snow: '#faedcd',
      treeDark: '#1d3527',
      treeLight: '#416d4e',
      accent: '#fb8500'
    }
  };

  function getPaletteForTile(tile) {
    if (!tile) return PALETTES.sunset;
    if (tile.group === 'dblue') return PALETTES.sunset;
    if (tile.group === 'green') return PALETTES.morning;
    if (tile.group === 'yellow') return PALETTES.golden;
    if (tile.group === 'red') return PALETTES.dusk;
    if (tile.group === 'orange') return PALETTES.sunset;
    if (tile.group === 'pink') return PALETTES.morning;
    if (tile.group === 'lblue') return PALETTES.golden;
    if (tile.group === 'brown') return PALETTES.sunset;
    if (tile.group === 'station') return PALETTES.morning;
    if (tile.group === 'utility') return PALETTES.golden;
    return PALETTES.dusk;
  }

  // Generador de nubes Ghibli (suaves, hinchadas, estilo Miyazaki)
  function renderGhibliClouds(prefix, p) {
    return `
      <g class="ghibli-clouds" opacity="0.88">
        <!-- Nube izquierda superior -->
        <path d="M -20,65 Q 10,40 45,55 Q 80,30 115,50 Q 145,45 160,70 L -20,70 Z" fill="#ffffff" opacity="0.32" />
        <path d="M -15,70 Q 12,48 44,60 Q 75,38 108,54 Q 135,50 148,72 L -15,72 Z" fill="#ffffff" opacity="0.65" />
        <!-- Nube derecha flotante -->
        <path d="M 190,52 Q 220,28 255,42 Q 290,20 325,40 Q 355,35 370,62 L 190,62 Z" fill="#ffffff" opacity="0.45" />
        <path d="M 205,58 Q 230,36 260,48 Q 288,30 320,46 Q 345,42 358,65 L 205,65 Z" fill="#ffffff" opacity="0.8" />
        <path d="M 215,62 Q 238,44 264,54 Q 285,40 312,52 L 215,62 Z" fill="#fffaf0" opacity="0.9" />
      </g>
    `;
  }

  // Cordillera de los Andes con nieve eterna al atardecer/amanecer
  function renderAndesMountains(prefix, p) {
    return `
      <g class="ghibli-cordillera">
        <!-- Picos lejanos -->
        <polygon points="50,110 115,48 180,110" fill="${p.mountainFar}" opacity="0.85" />
        <polygon points="115,48 135,68 122,74 115,66 108,72 95,64" fill="${p.snow}" opacity="0.95" />

        <polygon points="140,110 220,38 290,110" fill="${p.mountainFar}" />
        <polygon points="220,38 245,62 230,68 220,58 210,66 195,58" fill="${p.snow}" />

        <polygon points="260,110 320,44 380,110" fill="${p.mountainFar}" opacity="0.9" />
        <polygon points="320,44 340,62 330,68 320,60 310,67 302,60" fill="${p.snow}" />

        <!-- Capa intermedia de cerros andinos -->
        <polygon points="-10,115 60,68 140,115" fill="${p.mountainNear}" opacity="0.7" />
        <polygon points="110,115 175,64 245,115" fill="${p.mountainNear}" opacity="0.85" />
        <polygon points="215,115 285,58 355,115" fill="${p.mountainNear}" opacity="0.8" />
      </g>
    `;
  }

  // Árboles pintados estilo Ghibli (con volumen en copa, sombra y brillos)
  function renderGhibliTree(x, y, scale = 1, p) {
    return `
      <g transform="translate(${x},${y}) scale(${scale})">
        <!-- Tronco orgánico -->
        <path d="M 0,0 C 2,-12 -1,-22 0,-34 C 2,-28 8,-32 10,-38" stroke="#4a3728" stroke-width="3.5" stroke-linecap="round" fill="none" />
        <!-- Sombras de copa -->
        <circle cx="2" cy="-42" r="16" fill="${p.treeDark}" />
        <circle cx="-10" cy="-38" r="13" fill="${p.treeDark}" />
        <circle cx="12" cy="-36" r="13" fill="${p.treeDark}" />
        <!-- Luces de copa acuarela -->
        <circle cx="0" cy="-46" r="14" fill="${p.treeLight}" opacity="0.95" />
        <circle cx="-8" cy="-42" r="11" fill="${p.treeLight}" opacity="0.9" />
        <circle cx="10" cy="-40" r="11" fill="${p.treeLight}" opacity="0.9" />
        <circle cx="3" cy="-50" r="8" fill="#74c69d" opacity="0.65" />
      </g>
    `;
  }

  // Poste de luz tradicional con farol cálido y cables de anime
  function renderAnimeStreetlight(x, y, p) {
    return `
      <g transform="translate(${x},${y})">
        <!-- Poste -->
        <path d="M 0,0 L 0,-62 C 0,-68 6,-74 14,-74 L 18,-74" stroke="#264653" stroke-width="2.5" fill="none" stroke-linecap="round" />
        <!-- Farolito -->
        <rect x="15" y="-74" width="8" height="12" rx="2" fill="#264653" />
        <ellipse cx="19" cy="-68" rx="6" ry="6" fill="#ffeaa7" opacity="0.9" />
        <circle cx="19" cy="-68" rx="14" fill="#ffd166" opacity="0.25" />
      </g>
    `;
  }

  // Diseños específicos para cada lugar icónico de Santiago
  function renderSceneContent(tile, p, prefix) {
    const id = tile ? tile.id : 0;
    const name = tile ? tile.name : '';

    // 1. SANHATTAN / TORRE COSTANERA (Tile 39)
    if (id === 39) {
      return `
        <!-- Gran Torre Sanhattan y skyline moderno con vegetación urbana -->
        <g class="landmark-costanera">
          <!-- Silueta rascacielos secundarios -->
          <rect x="180" y="58" width="28" height="70" rx="2" fill="#2d3748" opacity="0.6" />
          <rect x="235" y="65" width="32" height="65" rx="2" fill="#2d3748" opacity="0.5" />
          
          <!-- Gran Torre Costanera (estilo anime reflectivo) -->
          <path d="M 132,130 L 140,24 L 149,14 L 157,24 L 166,130 Z" fill="url(#${prefix}-grad-glass)" stroke="#e2e8f0" stroke-width="0.8" />
          <!-- Cúspide iluminada -->
          <polygon points="146,14 152,14 150,4" fill="#f8fafc" />
          <circle cx="149" cy="8" r="4" fill="#ef4444" opacity="0.85" />
          <circle cx="149" cy="8" r="10" fill="#ef4444" opacity="0.25" />
          <!-- Líneas de paneles solares / ventanas vidriadas -->
          <line x1="141" y1="40" x2="157" y2="40" stroke="#bae6fd" stroke-width="0.8" opacity="0.7" />
          <line x1="139" y1="60" x2="159" y2="60" stroke="#bae6fd" stroke-width="0.8" opacity="0.7" />
          <line x1="137" y1="80" x2="161" y2="80" stroke="#bae6fd" stroke-width="0.8" opacity="0.7" />
          <line x1="135" y1="100" x2="163" y2="100" stroke="#bae6fd" stroke-width="0.8" opacity="0.7" />

          <!-- Balcones arbolados y parque de Los Leones -->
          <rect x="0" y="118" width="340" height="62" fill="#2a4736" />
          <path d="M 0,126 Q 90,118 180,124 T 340,120 L 340,180 L 0,180 Z" fill="#1b382b" />
          ${renderGhibliTree(35, 138, 1.1, p)}
          ${renderGhibliTree(85, 142, 1.25, p)}
          ${renderGhibliTree(225, 136, 1.15, p)}
          ${renderGhibliTree(285, 140, 1.2, p)}
          ${renderAnimeStreetlight(110, 146, p)}
          <!-- Bus Red pasando abajo -->
          <g transform="translate(185, 148) scale(0.65)">
            <rect x="0" y="6" width="46" height="18" rx="3" fill="#dc2626" />
            <rect x="0" y="0" width="46" height="8" rx="2" fill="#ffffff" />
            <rect x="4" y="3" width="8" height="5" rx="1" fill="#1e293b" />
            <rect x="14" y="3" width="10" height="5" rx="1" fill="#1e293b" />
            <rect x="26" y="3" width="10" height="5" rx="1" fill="#1e293b" />
            <circle cx="10" cy="24" r="4" fill="#0f172a" />
            <circle cx="36" cy="24" r="4" fill="#0f172a" />
          </g>
        </g>
      `;
    }

    // 2. METRO ESTACIONES (Tiles 5, 15, 25, 35)
    if (tile && (tile.type === 'station' || tile.group === 'station')) {
      const stationSub = tile.name.replace('Metro ', '');
      return `
        <!-- Estación de Metro nostálgica estilo Ghibli -->
        <g class="landmark-metro">
          <!-- Colina con casas de fondo -->
          <path d="M 0,110 Q 120,95 220,105 T 340,100 L 340,180 L 0,180 Z" fill="#335c67" opacity="0.6" />
          
          <!-- Entrada a estación con pórtico moderno y vidrio -->
          <rect x="0" y="122" width="340" height="58" fill="#1e293b" />
          <path d="M 70,122 L 270,122 L 255,85 L 85,85 Z" fill="#334155" stroke="#64748b" stroke-width="1.5" />
          <path d="M 88,88 L 252,88 L 244,115 L 96,115 Z" fill="#38bdf8" opacity="0.35" />

          <!-- Totem icónico Metro de Santiago (Rombo rojo con 3 rombos) -->
          <g transform="translate(42, 65)">
            <rect x="3" y="24" width="4" height="45" fill="#475569" />
            <!-- Rombo rojo exterior -->
            <polygon points="5,0 20,15 5,30 -10,15" fill="#dc2626" stroke="#ffffff" stroke-width="1.5" />
            <!-- 3 rombos blancos internos del Metro -->
            <polygon points="5,5 10,10 5,15 0,10" fill="#ffffff" />
            <polygon points="0,12 4,16 0,20 -4,16" fill="#ffffff" />
            <polygon points="10,12 14,16 10,20 6,16" fill="#ffffff" />
          </g>

          <!-- Letrero de la estación con tipografía estilo Metro -->
          <rect x="105" y="94" width="130" height="18" rx="3" fill="#0f172a" stroke="#0284c7" stroke-width="1" />
          <text x="170" y="107" font-family="'Segoe UI', system-ui, sans-serif" font-weight="900" font-size="9" fill="#f8fafc" text-anchor="middle" letter-spacing="1">METRO ${stationSub.toUpperCase()}</text>

          <!-- Escalera mecánica y entrada iluminada -->
          <polygon points="110,122 230,122 220,165 120,165" fill="#020617" />
          <line x1="120" y1="130" x2="220" y2="130" stroke="#facc15" stroke-width="1" opacity="0.6" />
          <line x1="125" y1="140" x2="215" y2="140" stroke="#38bdf8" stroke-width="1" opacity="0.6" />
          <line x1="130" y1="150" x2="210" y2="150" stroke="#38bdf8" stroke-width="1" opacity="0.6" />

          ${renderGhibliTree(18, 140, 1.05, p)}
          ${renderGhibliTree(315, 138, 1.1, p)}
          ${renderAnimeStreetlight(285, 142, p)}
        </g>
      `;
    }

    // 3. BARRIO PATRONATO & PERSA BIOBÍO (Tiles 6, 9)
    if (id === 6 || id === 9) {
      const isPersa = id === 9;
      return `
        <!-- Galpones de ladrillo, toldos a rayas, lámparas colgantes y tesoros vintage -->
        <g class="landmark-market">
          <!-- Fachadas de galpones antiguos de ladrillo -->
          <rect x="0" y="70" width="140" height="80" fill="#a0522d" />
          <rect x="140" y="65" width="200" height="85" fill="#8b4513" />
          <!-- Arcos de ladrillo históricos estilo Persa Víctor Manuel -->
          <path d="M 20,150 L 20,105 Q 45,85 70,105 L 70,150 Z" fill="#451a03" />
          <path d="M 85,150 L 85,105 Q 110,85 135,105 L 135,150 Z" fill="#451a03" />
          <path d="M 160,150 L 160,100 Q 195,78 230,100 L 230,150 Z" fill="#451a03" />
          <path d="M 250,150 L 250,100 Q 285,78 320,100 L 320,150 Z" fill="#451a03" />

          <!-- Toldos coloridos de feria y tiendas estilo Ghibli -->
          <polygon points="12,105 78,105 70,118 4,118" fill="#e63946" />
          <polygon points="16,105 28,105 22,118 10,118" fill="#f1faee" />
          <polygon points="40,105 52,105 46,118 34,118" fill="#f1faee" />
          <polygon points="64,105 76,105 70,118 58,118" fill="#f1faee" />

          <polygon points="150,98 240,98 232,112 142,112" fill="#f4a261" />
          <polygon points="156,98 170,98 164,112 150,112" fill="#264653" />
          <polygon points="184,98 198,98 192,112 178,112" fill="#264653" />
          <polygon points="212,98 226,98 220,112 206,112" fill="#264653" />

          <!-- Guirnalda de banderines festivos y faroles cálidos -->
          <path d="M 10,85 Q 90,100 170,88 Q 250,98 330,86" stroke="#475569" stroke-width="1.2" fill="none" />
          <polygon points="45,92 55,93 50,102" fill="#ffd166" />
          <polygon points="95,95 105,95 100,104" fill="#ef476f" />
          <polygon points="145,91 155,90 150,100" fill="#06d6a0" />
          <polygon points="205,94 215,93 210,103" fill="#118ab2" />
          <polygon points="265,92 275,91 270,101" fill="#ffd166" />

          <!-- Callejón empedrado y detalles acogedores -->
          <rect x="0" y="146" width="340" height="34" fill="#3f37c9" opacity="0.1" />
          <!-- Letrero rústico -->
          <rect x="160" y="72" width="70" height="14" rx="2" fill="#fefae0" stroke="#78350f" stroke-width="1" />
          <text x="195" y="82" font-family="'Brush Script MT', cursive, sans-serif" font-size="8" font-weight="bold" fill="#78350f" text-anchor="middle">${isPersa ? 'Persa Víctor Manuel' : 'Telas & Bazar Patronato'}</text>
          
          ${renderGhibliTree(318, 148, 0.9, p)}
          ${renderAnimeStreetlight(22, 150, p)}
        </g>
      `;
    }

    // 4. PARQUES (Parque O'Higgins Fonda, Parque Forestal - Tiles 20, 29)
    if (id === 20 || id === 29) {
      const isFonda = id === 20;
      return `
        <!-- Paisaje de parque con árboles frondosos, laguna, puente y fonda tradicional -->
        <g class="landmark-park">
          <!-- Colinas verdes y laguna reflectiva -->
          <path d="M 0,115 Q 100,90 200,105 T 340,95 L 340,180 L 0,180 Z" fill="#2d6a4f" />
          <!-- Laguna Mapocho / Parque con reflejo de acuarela -->
          <path d="M 30,140 Q 120,130 220,138 T 340,132 L 340,175 Q 230,180 120,172 T 20,165 Z" fill="#48cae4" opacity="0.6" />
          <path d="M 40,148 Q 120,140 210,146 T 330,142" stroke="#ffffff" stroke-width="1.2" fill="none" opacity="0.6" />

          ${isFonda ? `
            <!-- Fonda Oficial "La Chingana de Santiago" con techo de paja y banderas chilenas -->
            <polygon points="75,85 145,62 215,85" fill="#b08968" stroke="#582f0e" stroke-width="1.5" />
            <rect x="85" y="85" width="120" height="45" fill="#ddb892" stroke="#582f0e" stroke-width="1" />
            <!-- Columnas rústicas de madera -->
            <rect x="90" y="85" width="6" height="45" fill="#7f4f24" />
            <rect x="142" y="85" width="6" height="45" fill="#7f4f24" />
            <rect x="194" y="85" width="6" height="45" fill="#7f4f24" />
            <!-- Letrero Fonda -->
            <rect x="100" y="92" width="90" height="15" rx="3" fill="#ffffff" stroke="#b91c1c" stroke-width="1" />
            <text x="145" y="103" font-family="'Arial Black', sans-serif" font-size="8" fill="#b91c1c" text-anchor="middle">FONDA LA FIESTA</text>
            <!-- Guirnalda chilena de banderitas blanco, azul y rojo -->
            <path d="M 60,82 Q 145,98 230,82" stroke="#475569" stroke-width="1.2" fill="none" />
            <polygon points="80,87 90,88 85,96" fill="#2563eb" />
            <polygon points="105,91 115,92 110,100" fill="#ffffff" stroke="#e2e8f0" stroke-width="0.5" />
            <polygon points="130,93 140,93 135,102" fill="#dc2626" />
            <polygon points="155,93 165,93 160,102" fill="#2563eb" />
            <polygon points="180,91 190,90 185,99" fill="#dc2626" />
          ` : `
            <!-- Cúpula y columnata del Museo Nacional de Bellas Artes -->
            <rect x="90" y="82" width="140" height="45" fill="#f8f9fa" stroke="#adb5bd" stroke-width="1" />
            <ellipse cx="160" cy="80" rx="32" ry="20" fill="#83c5be" stroke="#006d77" stroke-width="1.5" />
            <circle cx="160" cy="58" r="4" fill="#f4a261" />
            <line x1="105" y1="92" x2="105" y2="127" stroke="#6c757d" stroke-width="2.5" />
            <line x1="125" y1="92" x2="125" y2="127" stroke="#6c757d" stroke-width="2.5" />
            <line x1="145" y1="92" x2="145" y2="127" stroke="#6c757d" stroke-width="2.5" />
            <line x1="175" y1="92" x2="175" y2="127" stroke="#6c757d" stroke-width="2.5" />
            <line x1="195" y1="92" x2="195" y2="127" stroke="#6c757d" stroke-width="2.5" />
            <line x1="215" y1="92" x2="215" y2="127" stroke="#6c757d" stroke-width="2.5" />
          `}

          <!-- Gran arboleda estilo Studio Ghibli -->
          ${renderGhibliTree(30, 130, 1.35, p)}
          ${renderGhibliTree(65, 138, 1.1, p)}
          ${renderGhibliTree(270, 128, 1.4, p)}
          ${renderGhibliTree(315, 134, 1.25, p)}
          ${renderAnimeStreetlight(235, 142, p)}
        </g>
      `;
    }

    // 5. BARRIOS BOHEMIOS & PATRIMONIALES (Lastarria, Bellavista, Brasil, República, Italia - Tiles 16, 18, 19, 23, 27)
    if (id === 16 || id === 18 || id === 19 || id === 23 || id === 27) {
      return `
        <!-- Calles bohemias con casonas neoclásicas, cafés de vereda, parras y balcones -->
        <g class="landmark-bohemio">
          <!-- Casonas tradicionales de adobe y colores pastel de barrio -->
          <rect x="15" y="65" width="95" height="85" fill="#f4a261" stroke="#e76f51" stroke-width="1.2" />
          <polygon points="10,65 62,38 115,65" fill="#b07d62" />
          <!-- Balcón francés de fierro forjado con flores -->
          <rect x="35" y="76" width="55" height="24" rx="2" fill="#264653" />
          <path d="M 35,88 L 90,88 M 40,76 L 40,88 M 50,76 L 50,88 M 60,76 L 60,88 M 70,76 L 70,88 M 80,76 L 80,88" stroke="#e9c46a" stroke-width="1.2" />
          <circle cx="45" cy="74" r="4" fill="#e76f51" />
          <circle cx="58" cy="73" r="4" fill="#f4a261" />
          <circle cx="72" cy="74" r="4" fill="#e76f51" />

          <!-- Casona contigua (verde oliva / azul pastel) -->
          <rect x="110" y="55" width="115" height="95" fill="#e9c46a" stroke="#d4a373" stroke-width="1" />
          <!-- Ventanales de arco y café abajo -->
          <path d="M 130,105 L 130,80 Q 145,68 160,80 L 160,105 Z" fill="#264653" />
          <path d="M 175,105 L 175,80 Q 190,68 205,80 L 205,105 Z" fill="#264653" />
          
          <!-- Toldo café de vereda con mesitas -->
          <polygon points="120,115 215,115 208,128 127,128" fill="#e76f51" />
          <polygon points="126,115 138,115 133,128 121,128" fill="#f8edeb" />
          <polygon points="152,115 164,115 159,128 147,128" fill="#f8edeb" />
          <polygon points="178,115 190,115 185,128 173,128" fill="#f8edeb" />
          <polygon points="204,115 215,115 210,128 199,128" fill="#f8edeb" />

          <!-- Casona derecha con hiedra trepadora -->
          <rect x="225" y="70" width="105" height="80" fill="#2a9d8f" opacity="0.85" />
          <path d="M 230,85 Q 245,100 235,115 Q 250,125 240,140" stroke="#2d6a4f" stroke-width="4" fill="none" opacity="0.9" />

          <!-- Calle adoquinada con farolas de bronce -->
          <rect x="0" y="148" width="340" height="32" fill="#495057" />
          ${renderAnimeStreetlight(115, 150, p)}
          ${renderAnimeStreetlight(220, 150, p)}
          ${renderGhibliTree(310, 142, 1.15, p)}
        </g>
      `;
    }

    // 6. AVENIDAS PRINCIPALES (Alameda, Providencia, Apoquindo, Alonso de Córdova, Irarrázaval, Vicuña Mackenna, etc.)
    return `
      <!-- Gran avenida santiaguina con cordillera imponente y arbolada -->
      <g class="landmark-avenue">
        <!-- Silueta urbana estilizada -->
        <rect x="35" y="75" width="45" height="65" fill="#334155" opacity="0.6" />
        <rect x="85" y="88" width="55" height="52" fill="#475569" opacity="0.5" />
        <rect x="180" y="80" width="60" height="60" fill="#334155" opacity="0.6" />
        <rect x="245" y="70" width="50" height="70" fill="#475569" opacity="0.7" />

        <!-- Calzada ancha y bandejón central con plátanos orientales -->
        <rect x="0" y="132" width="340" height="48" fill="#1e293b" />
        <!-- Pistas vehiculares con demarcación amarilla y blanca -->
        <line x1="0" y1="155" x2="340" y2="155" stroke="#facc15" stroke-width="2" stroke-dasharray="14,10" opacity="0.85" />
        <line x1="0" y1="172" x2="340" y2="172" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="10,8" opacity="0.7" />

        <!-- Bus Transantiago / Red recorriendo la avenida -->
        <g transform="translate(130, 136) scale(0.85)">
          <rect x="0" y="8" width="68" height="22" rx="4" fill="#dc2626" />
          <rect x="0" y="0" width="68" height="10" rx="3" fill="#f8fafc" />
          <rect x="4" y="3" width="12" height="7" rx="1.5" fill="#0f172a" />
          <rect x="18" y="3" width="14" height="7" rx="1.5" fill="#0f172a" />
          <rect x="34" y="3" width="14" height="7" rx="1.5" fill="#0f172a" />
          <rect x="50" y="3" width="14" height="7" rx="1.5" fill="#0f172a" />
          <!-- Luces cálidas delanteras -->
          <circle cx="67" cy="18" r="3" fill="#fef08a" />
          <polygon points="67,18 100,10 100,26" fill="#fef08a" opacity="0.25" />
          <!-- Ruedas -->
          <circle cx="14" cy="30" r="5" fill="#020617" />
          <circle cx="14" cy="30" r="2" fill="#94a3b8" />
          <circle cx="52" cy="30" r="5" fill="#020617" />
          <circle cx="52" cy="30" r="2" fill="#94a3b8" />
        </g>

        <!-- Árboles exuberantes a los lados de la calzada -->
        ${renderGhibliTree(25, 138, 1.25, p)}
        ${renderGhibliTree(65, 142, 1.05, p)}
        ${renderGhibliTree(285, 138, 1.3, p)}
        ${renderGhibliTree(320, 142, 1.1, p)}
        ${renderAnimeStreetlight(95, 144, p)}
      </g>
    `;
  }

  /**
   * Genera el SVG completo en estilo acuarela Studio Ghibli
   * @param {Object} tile Casilla de juego
   * @param {number} [width=340]
   * @param {number} [height=170]
   * @returns {string} Código SVG listo para insertar en DOM
   */
  function getGhibliArtworkSVG(tile, width = 340, height = 170) {
    if (!tile) return '';
    const prefix = `ghibli-${tile.id || 'gen'}-${Math.floor(Math.random() * 10000)}`;
    const p = getPaletteForTile(tile);
    const placeName = tile.name || 'Santiago de Chile';
    const comuna = tile.comuna || (tile.group ? tile.group.toUpperCase() : 'SANTIAGO');

    return `
      <svg class="ghibli-artwork-svg" viewBox="0 0 340 180" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ilustración Ghibli de ${placeName}">
        <defs>
          <!-- Degradé de cielo Ghibli -->
          <linearGradient id="${prefix}-grad-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${p.skyTop}" />
            <stop offset="55%" stop-color="${p.skyMid}" />
            <stop offset="100%" stop-color="${p.skyBot}" />
          </linearGradient>

          <!-- Degradé reflectivo de vidrio para edificios -->
          <linearGradient id="${prefix}-grad-glass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#bae6fd" stop-opacity="0.95" />
            <stop offset="35%" stop-color="#7dd3fc" stop-opacity="0.8" />
            <stop offset="70%" stop-color="#0284c7" stop-opacity="0.9" />
            <stop offset="100%" stop-color="#0369a1" stop-opacity="0.95" />
          </linearGradient>

          <!-- Resplandor del sol / luna -->
          <radialGradient id="${prefix}-sun-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="${p.sun}" stop-opacity="1" />
            <stop offset="35%" stop-color="${p.sun}" stop-opacity="0.75" />
            <stop offset="70%" stop-color="${p.sun}" stop-opacity="0.25" />
            <stop offset="100%" stop-color="${p.sun}" stop-opacity="0" />
          </radialGradient>

          <!-- Viñeta suave de acuarela / postal -->
          <radialGradient id="${prefix}-vignette" cx="50%" cy="50%" r="70%">
            <stop offset="65%" stop-color="#000000" stop-opacity="0" />
            <stop offset="100%" stop-color="#050a14" stop-opacity="0.35" />
          </radialGradient>
        </defs>

        <!-- FONDO: Cielo con gradiente de acuarela -->
        <rect width="340" height="180" fill="url(#${prefix}-grad-sky)" />

        <!-- Sol / Resplandor cálido en el horizonte -->
        <circle cx="270" cy="52" r="34" fill="url(#${prefix}-sun-glow)" />

        <!-- Nubes esponjosas estilo Studio Ghibli -->
        ${renderGhibliClouds(prefix, p)}

        <!-- Majestuosa Cordillera de los Andes con nieve -->
        ${renderAndesMountains(prefix, p)}

        <!-- Escena principal del lugar -->
        ${renderSceneContent(tile, p, prefix)}

        <!-- Viñeta suave de acuarela / borde de postal -->
        <rect width="340" height="180" fill="url(#${prefix}-vignette)" pointer-events="none" />

        <!-- Sello de postal estilo anime en la esquina superior -->
        <g class="ghibli-stamp" transform="translate(10, 10)" opacity="0.92">
          <rect x="0" y="0" width="85" height="20" rx="4" fill="rgba(15, 23, 42, 0.72)" stroke="rgba(255, 255, 255, 0.35)" stroke-width="0.8" />
          <text x="7" y="14" font-family="'Segoe UI', -apple-system, sans-serif" font-size="8.5" font-weight="800" fill="#f8fafc" letter-spacing="0.5">🌸 ${comuna.slice(0, 14)}</text>
        </g>
      </svg>
    `;
  }

  return {
    getScenicArtworkSVG: getGhibliArtworkSVG,
    getGhibliArtworkSVG,
    getPaletteForTile
  };
});
