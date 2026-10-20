/**
 * Datos oficiales del Tablero "Gran Santiago Online" (40 Casillas)
 * Economía en Pesos Chilenos (CLP)
 */

const COLOR_GROUPS = {
  brown:   { name: 'Sector Sur-Poniente', color: '#8B4513', total: 2 },
  lblue:   { name: 'Sector Norte / Centro', color: '#38BDF8', total: 3 },
  pink:    { name: 'Sector Sur-Oriente', color: '#EC4899', total: 3 },
  orange:  { name: 'Eje Universitario y Bohemio', color: '#F97316', total: 3 },
  red:     { name: 'Casco Histórico', color: '#EF4444', total: 3 },
  yellow:  { name: 'Sector Oriente Residencial', color: '#EAB308', total: 3 },
  green:   { name: 'Sector Oriente Comercial', color: '#22C55E', total: 3 },
  dblue:   { name: 'Barrio Alto Financiero', color: '#3B82F6', total: 2 },
  station: { name: 'Red Metro de Santiago', color: '#E11D48', total: 4 },
  utility: { name: 'Servicios Básicos', color: '#A855F7', total: 2 }
};

const PLAYER_AVATARS = [
  { id: 'condorito', icon: '🦅', name: 'Cóndor Andino', color: '#EF4444' },
  { id: 'metro',     icon: '🚇', name: 'Tren Metro',    color: '#3B82F6' },
  { id: 'moai',      icon: '🗿', name: 'Moai',          color: '#10B981' },
  { id: 'empanada',  icon: '🥟', name: 'Empanada de Pino', color: '#F59E0B' },
  { id: 'copihue',   icon: '🌺', name: 'Copihue',       color: '#EC4899' },
  { id: 'guitarra',  icon: '🎸', name: 'Guitarra Cuequera', color: '#8B5CF6' },
  { id: 'pudú',      icon: '🦌', name: 'Pudú Chileno',  color: '#14B8A6' },
  { id: 'volcan',    icon: '🌋', name: 'Volcán Nevado', color: '#F97316' }
];

const BOARD_TILES = [
  {
    id: 0,
    name: 'PARTIDA (Plaza Baquedano)',
    shortName: 'PARTIDA',
    type: 'go',
    icon: '🏁',
    description: 'Cobra tu sueldo de $200.000 CLP cada vez que pases por aquí.'
  },
  {
    id: 1,
    name: 'Av. Pajaritos',
    comuna: 'Maipú',
    type: 'property',
    group: 'brown',
    price: 60000,
    houseCost: 50000,
    rents: [4000, 20000, 60000, 180000, 320000, 450000]
  },
  {
    id: 2,
    name: 'Polla Chilena de Beneficencia',
    shortName: 'Polla Chilena',
    type: 'community',
    icon: '🍀',
    description: 'Saca una tarjeta de la Polla Chilena de Beneficencia.'
  },
  {
    id: 3,
    name: 'Gran Avenida',
    comuna: 'San Miguel',
    type: 'property',
    group: 'brown',
    price: 60000,
    houseCost: 50000,
    rents: [8000, 40000, 120000, 360000, 640000, 900000]
  },
  {
    id: 4,
    name: 'Impuesto SII (Operación Renta)',
    shortName: 'Impuesto SII',
    type: 'tax',
    taxAmount: 200000,
    icon: '🏛️',
    description: 'Paga $200.000 CLP al Servicio de Impuestos Internos (va al Pozo de Lotería).'
  },
  {
    id: 5,
    name: 'Metro Estación Central',
    comuna: 'Línea 1',
    type: 'station',
    group: 'station',
    price: 200000,
    icon: '🚇',
    rents: [50000, 100000, 200000, 400000]
  },
  {
    id: 6,
    name: 'Barrio Patronato',
    comuna: 'Recoleta',
    type: 'property',
    group: 'lblue',
    price: 100000,
    houseCost: 50000,
    rents: [12000, 60000, 180000, 540000, 800000, 1100000]
  },
  {
    id: 7,
    name: ' ¡Aló Santiago! (Suerte)',
    shortName: '¡Suerte!',
    type: 'chance',
    icon: '❓',
    description: 'Saca una tarjeta de imprevistos de Santiago.'
  },
  {
    id: 8,
    name: 'Av. Independencia',
    comuna: 'Independencia',
    type: 'property',
    group: 'lblue',
    price: 100000,
    houseCost: 50000,
    rents: [12000, 60000, 180000, 540000, 800000, 1100000]
  },
  {
    id: 9,
    name: 'Barrio Franklin (Persa Biobío)',
    comuna: 'Santiago Sur',
    type: 'property',
    group: 'lblue',
    price: 120000,
    houseCost: 50000,
    rents: [16000, 80000, 200000, 600000, 900000, 1200000]
  },
  {
    id: 10,
    name: 'Comisaría / De Visita',
    shortName: 'Comisaría',
    type: 'jail',
    icon: '🚓',
    description: 'Solo de visita o detenido en el calabozo.'
  },
  {
    id: 11,
    name: 'Av. Vicuña Mackenna',
    comuna: 'La Florida',
    type: 'property',
    group: 'pink',
    price: 140000,
    houseCost: 100000,
    rents: [20000, 100000, 300000, 900000, 1250000, 1500000]
  },
  {
    id: 12,
    name: 'Enel Distribución (Luz)',
    comuna: 'Servicio Eléctrico',
    type: 'utility',
    group: 'utility',
    price: 150000,
    icon: '⚡',
    description: 'Si tienes 1 servicio, cobras 4.000x los dados. Si tienes ambos, cobras 10.000x los dados.'
  },
  {
    id: 13,
    name: 'Plaza de Puente Alto',
    comuna: 'Puente Alto',
    type: 'property',
    group: 'pink',
    price: 140000,
    houseCost: 100000,
    rents: [20000, 100000, 300000, 900000, 1250000, 1500000]
  },
  {
    id: 14,
    name: 'Av. Macul',
    comuna: 'Macul',
    type: 'property',
    group: 'pink',
    price: 160000,
    houseCost: 100000,
    rents: [24000, 120000, 360000, 1000000, 1400000, 1800000]
  },
  {
    id: 15,
    name: 'Metro Cal y Canto',
    comuna: 'Línea 2',
    type: 'station',
    group: 'station',
    price: 200000,
    icon: '🚇',
    rents: [50000, 100000, 200000, 400000]
  },
  {
    id: 16,
    name: 'Barrio República',
    comuna: 'Santiago Poniente',
    type: 'property',
    group: 'orange',
    price: 180000,
    houseCost: 100000,
    rents: [28000, 140000, 400000, 1100000, 1500000, 1900000]
  },
  {
    id: 17,
    name: 'Polla Chilena de Beneficencia',
    shortName: 'Polla Chilena',
    type: 'community',
    icon: '🍀',
    description: 'Saca una tarjeta de la Polla Chilena de Beneficencia.'
  },
  {
    id: 18,
    name: 'Barrio Brasil',
    comuna: 'Santiago Centro',
    type: 'property',
    group: 'orange',
    price: 180000,
    houseCost: 100000,
    rents: [28000, 140000, 400000, 1100000, 1500000, 1900000]
  },
  {
    id: 19,
    name: 'Barrio Bellavista (Pío Nono)',
    comuna: 'Providencia / Recoleta',
    type: 'property',
    group: 'orange',
    price: 200000,
    houseCost: 100000,
    rents: [32000, 160000, 440000, 1200000, 1600000, 2000000]
  },
  {
    id: 20,
    name: 'Parque O\'Higgins (Fonda Libre)',
    shortName: 'Parque O\'Higgins',
    type: 'freeparking',
    icon: '🎡',
    description: '¡Te llevas todo el pozo acumulado de impuestos y multas!'
  },
  {
    id: 21,
    name: 'Paseo Ahumada',
    comuna: 'Santiago Centro',
    type: 'property',
    group: 'red',
    price: 220000,
    houseCost: 150000,
    rents: [36000, 180000, 500000, 1400000, 1750000, 2100000]
  },
  {
    id: 22,
    name: '¡Aló Santiago! (Suerte)',
    shortName: '¡Suerte!',
    type: 'chance',
    icon: '❓',
    description: 'Saca una tarjeta de imprevistos de Santiago.'
  },
  {
    id: 23,
    name: 'Barrio Lastarria',
    comuna: 'Santiago Centro',
    type: 'property',
    group: 'red',
    price: 220000,
    houseCost: 150000,
    rents: [36000, 180000, 500000, 1400000, 1750000, 2100000]
  },
  {
    id: 24,
    name: 'Alameda Bernardo O\'Higgins',
    comuna: 'Santiago Centro',
    type: 'property',
    group: 'red',
    price: 240000,
    houseCost: 150000,
    rents: [40000, 200000, 600000, 1500000, 1850000, 2200000]
  },
  {
    id: 25,
    name: 'Metro Plaza Egaña',
    comuna: 'Línea 4 / Línea 3',
    type: 'station',
    group: 'station',
    price: 200000,
    icon: '🚇',
    rents: [50000, 100000, 200000, 400000]
  },
  {
    id: 26,
    name: 'Av. Irarrázaval (Plaza Ñuñoa)',
    comuna: 'Ñuñoa',
    type: 'property',
    group: 'yellow',
    price: 260000,
    houseCost: 150000,
    rents: [44000, 220000, 660000, 1600000, 1950000, 2300000]
  },
  {
    id: 27,
    name: 'Barrio Italia',
    comuna: 'Ñuñoa / Providencia',
    type: 'property',
    group: 'yellow',
    price: 260000,
    houseCost: 150000,
    rents: [44000, 220000, 660000, 1600000, 1950000, 2300000]
  },
  {
    id: 28,
    name: 'Aguas Andinas (Agua Potable)',
    comuna: 'Servicio Sanitario',
    type: 'utility',
    group: 'utility',
    price: 150000,
    icon: '💧',
    description: 'Si tienes 1 servicio, cobras 4.000x los dados. Si tienes ambos, cobras 10.000x los dados.'
  },
  {
    id: 29,
    name: 'Parque Forestal',
    comuna: 'Santiago / Providencia',
    type: 'property',
    group: 'yellow',
    price: 280000,
    houseCost: 150000,
    rents: [48000, 240000, 720000, 1700000, 2050000, 2400000]
  },
  {
    id: 30,
    name: '¡Control de Carabineros! A la Comisaría',
    shortName: 'A la Comisaría',
    type: 'gotojail',
    icon: '🚨',
    description: 'Te pillaron sin TAG y con restricción vehicular. Vas directo a la Comisaría sin cobrar salida.'
  },
  {
    id: 31,
    name: 'Av. Providencia',
    comuna: 'Providencia',
    type: 'property',
    group: 'green',
    price: 300000,
    houseCost: 200000,
    rents: [52000, 260000, 780000, 1800000, 2200000, 2550000]
  },
  {
    id: 32,
    name: 'Pedro de Valdivia Norte',
    comuna: 'Providencia',
    type: 'property',
    group: 'green',
    price: 300000,
    houseCost: 200000,
    rents: [52000, 260000, 780000, 1800000, 2200000, 2550000]
  },
  {
    id: 33,
    name: 'Polla Chilena de Beneficencia',
    shortName: 'Polla Chilena',
    type: 'community',
    icon: '🍀',
    description: 'Saca una tarjeta de la Polla Chilena de Beneficencia.'
  },
  {
    id: 34,
    name: 'Av. Apoquindo (El Golf)',
    comuna: 'Las Condes',
    type: 'property',
    group: 'green',
    price: 320000,
    houseCost: 200000,
    rents: [56000, 300000, 900000, 2000000, 2400000, 2800000]
  },
  {
    id: 35,
    name: 'Metro Tobalaba',
    comuna: 'Combinación L1 / L4',
    type: 'station',
    group: 'station',
    price: 200000,
    icon: '🚇',
    rents: [50000, 100000, 200000, 400000]
  },
  {
    id: 36,
    name: '¡Aló Santiago! (Suerte)',
    shortName: '¡Suerte!',
    type: 'chance',
    icon: '❓',
    description: 'Saca una tarjeta de imprevistos de Santiago.'
  },
  {
    id: 37,
    name: 'Av. Alonso de Córdova',
    comuna: 'Vitacura',
    type: 'property',
    group: 'dblue',
    price: 350000,
    houseCost: 200000,
    rents: [70000, 350000, 1000000, 2200000, 2600000, 3000000]
  },
  {
    id: 38,
    name: 'Pórtico TAG Costanera Norte',
    shortName: 'Pórtico TAG',
    type: 'tax',
    taxAmount: 100000,
    icon: '🛣️',
    description: 'Cobro de tarifa de saturación en Costanera Norte: Paga $100.000 CLP.'
  },
  {
    id: 39,
    name: 'Sanhattan (Torre Costanera)',
    comuna: 'Providencia / Las Condes',
    type: 'property',
    group: 'dblue',
    price: 400000,
    houseCost: 200000,
    rents: [100000, 400000, 1200000, 2800000, 3400000, 4000000]
  }
];

const CHANCE_CARDS = [
  {
    title: '¡Línea 1 Expreso!',
    text: 'Avanza directamente hasta PARTIDA (Plaza Baquedano) y cobra tus $200.000 CLP.',
    action: 'move_to',
    target: 0
  },
  {
    title: 'Negocio en el Costanera Center',
    text: 'Avanza hasta Sanhattan (Torre Costanera). Si está libre puedes comprarla; si tiene dueño, paga el arriendo.',
    action: 'move_to',
    target: 39
  },
  {
    title: 'Paseo de Fin de Semana',
    text: 'Avanza hasta Barrio Lastarria. Si pasas por la Partida, cobra $200.000 CLP.',
    action: 'move_to',
    target: 23
  },
  {
    title: 'Parte por circular sin TAG',
    text: 'Pasaste por Autopista Central sin dispositivo habilitado. Paga multa de $75.000 CLP.',
    action: 'pay_tax',
    amount: 75000
  },
  {
    title: 'Devolución de Impuestos SII',
    text: '¡La Tesorería General de la República aprobó tu declaración de renta! Recibes $150.000 CLP.',
    action: 'collect',
    amount: 150000
  },
  {
    title: 'Bono Dieciochero',
    text: 'Recibes aguinaldo de Fiestas Patrias para las fondas del Parque O\'Higgins: Cobras $100.000 CLP.',
    action: 'collect',
    amount: 100000
  },
  {
    title: 'Taco Monumental en la Alameda',
    text: 'Retrocede 3 casillas buscando un desvío alternativo.',
    action: 'move_rel',
    steps: -3
  },
  {
    title: 'Fiscalización de Carabineros',
    text: 'Permiso de circulación vencido. Ve directo a la Comisaría sin pasar por la Partida.',
    action: 'goto_jail'
  },
  {
    title: 'Contribuciones de Bienes Raíces',
    text: 'Paga $25.000 CLP por cada casa y $100.000 CLP por cada hotel/torre que poseas.',
    action: 'street_repairs',
    perHouse: 25000,
    perHotel: 100000
  },
  {
    title: 'Asado con los Amigos',
    text: 'Te tocó poner la carne y las empanadas para todo el grupo. Paga $25.000 CLP a cada jugador activo.',
    action: 'pay_each_player',
    amount: 25000
  }
];

const COMMUNITY_CARDS = [
  {
    title: '¡Ganaste el Kino!',
    text: 'Le achuntaste a los 14 números en el sorteo dominical. Cobras $200.000 CLP.',
    action: 'collect',
    amount: 200000
  },
  {
    title: ' ¡La Hora de tu Suerte!',
    text: 'Tu número de RUT salió premiado en Polla Chilena de Beneficencia. Cobras $120.000 CLP.',
    action: 'collect',
    amount: 120000
  },
  {
    title: 'Reembolso de Isapre / Fonasa',
    text: 'Te devolvieron los excedentes acumulados del año. Recibes $80.000 CLP.',
    action: 'collect',
    amount: 80000
  },
  {
    title: 'Gastos Comunes Atrasados',
    text: 'Subió la mantención de los ascensores del edificio. Paga $60.000 CLP al pozo.',
    action: 'pay_tax',
    amount: 60000
  },
  {
    title: 'Permiso de Circulación Marzo',
    text: 'Llegó marzo con todos los gastos. Paga $100.000 CLP por patente y seguro obligatorio.',
    action: 'pay_tax',
    amount: 100000
  },
  {
    title: '¡Cumpleaños Feliz!',
    text: 'Todos los jugadores se ponen con un regalo en efectivo. Recibes $30.000 CLP de cada jugador.',
    action: 'collect_each_player',
    amount: 30000
  },
  {
    title: 'Feriado Irrenunciable en Parque O\'Higgins',
    text: 'Avanza directamente al Parque O\'Higgins (Fonda Libre) y reclama el pozo acumulado.',
    action: 'move_to',
    target: 20
  },
  {
    title: 'Venta en el Persa Biobío',
    text: 'Vendiste tus antigüedades el domingo en el galpón Víctor Manuel. Recibes $90.000 CLP.',
    action: 'collect',
    amount: 90000
  }
];

module.exports = {
  COLOR_GROUPS,
  PLAYER_AVATARS,
  BOARD_TILES,
  CHANCE_CARDS,
  COMMUNITY_CARDS
};
