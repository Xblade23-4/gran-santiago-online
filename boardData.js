/**
 * Datos oficiales del Tablero "Gran Santiago Online" (40 Casillas)
 * Economía en Pesos Chilenos (CLP)
 */

const COLOR_GROUPS = {
  brown:   { name: 'Sector Sur-Poniente (Maipú y San Miguel)', color: '#8B4513', total: 2 },
  lblue:   { name: 'Sector Norte (Recoleta, Independencia y Conchalí)', color: '#38BDF8', total: 3 },
  pink:    { name: 'Sector Sur-Oriente (La Florida, Puente Alto y La Pintana)', color: '#EC4899', total: 3 },
  orange:  { name: 'Barrios Patrimoniales Poniente (República, Brasil y Yungay)', color: '#F97316', total: 3 },
  red:     { name: 'Casco Histórico Cívico (Ahumada, Lastarria y Alameda)', color: '#EF4444', total: 3 },
  yellow:  { name: 'Sector Oriente Central (Ñuñoa, Macul y Barrio Italia)', color: '#EAB308', total: 3 },
  green:   { name: 'Sector Providencia (Av. Providencia, Pedro de Valdivia y Bellavista)', color: '#22C55E', total: 3 },
  dblue:   { name: 'Barrio Alto Financiero (Las Condes y Vitacura)', color: '#3B82F6', total: 2 },
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
    name: 'Av. Dorsal (Conchalí)',
    shortName: 'Av. Dorsal',
    comuna: 'Conchalí',
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
    name: 'Av. Santa Rosa (La Pintana)',
    shortName: 'La Pintana',
    comuna: 'La Pintana',
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
    name: 'Barrio Yungay (Plaza Yungay)',
    shortName: 'Barrio Yungay',
    comuna: 'Santiago Poniente',
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
    name: 'Av. Macul (Macul / Ñuñoa)',
    shortName: 'Av. Macul',
    comuna: 'Macul',
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
    name: 'Barrio Bellavista (Pío Nono)',
    shortName: 'Bellavista',
    comuna: 'Providencia',
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
  },
  {
    title: 'Conciertazo en el Estadio Nacional',
    text: 'Revendiste las entradas VIP que te sobraron en Ñuñoa. Ganaste $130.000 CLP.',
    action: 'collect',
    amount: 130000
  },
  {
    title: '¡Falla en la Línea 1 del Metro!',
    text: 'Tuviste que tomar taxi colectivo en hora punta por corte de energía. Paga $40.000 CLP.',
    action: 'pay_tax',
    amount: 40000
  },
  {
    title: 'Viaje en Metro Tobalaba',
    text: 'Toma la combinación en Metro Tobalaba. Si pasas por Plaza Baquedano, cobra tus $200.000 CLP.',
    action: 'move_to',
    target: 35
  },
  {
    title: 'Compras en Barrio Patronato',
    text: 'Avanza hasta Barrio Patronato para renovar todo tu clóset. Si pasas por la Partida, cobra $200.000 CLP.',
    action: 'move_to',
    target: 6
  },
  {
    title: 'Cachureos en el Persa Biobío',
    text: 'Avanza hasta Barrio Franklin (Persa Biobío). Si pasas por la Partida, cobra $200.000 CLP.',
    action: 'move_to',
    target: 9
  },
  {
    title: 'Carrete en Pío Nono',
    text: 'Avanza hasta Barrio Bellavista. Si pasas por la Partida, cobra $200.000 CLP.',
    action: 'move_to',
    target: 19
  },
  {
    title: 'Bono Marzo Familiar',
    text: 'El IPS depositó el Aporte Familiar Permanente en tu CuentaRUT. Cobras $90.000 CLP.',
    action: 'collect',
    amount: 90000
  },
  {
    title: 'Alza en la Cuenta de la Luz (Enel)',
    text: 'Subieron las tarifas eléctricas de invierno. Paga $55.000 CLP al pozo.',
    action: 'pay_tax',
    amount: 55000
  },
  {
    title: 'Corte de Agua en tu Comuna',
    text: 'Aguas Andinas te indemnizó por el corte programado del fin de semana. Recibes $65.000 CLP.',
    action: 'collect',
    amount: 65000
  },
  {
    title: 'Rifa de Bomberos de Santiago',
    text: 'Ganaste el segundo premio de la Gran Rifa del Cuerpo de Bomberos. Cobras $110.000 CLP.',
    action: 'collect',
    amount: 110000
  },
  {
    title: 'Multa por Evasión en Red Movilidad',
    text: 'Subieron los inspectores a la micro y no habías validado tu tarjeta Bip!. Paga multa de $60.000 CLP.',
    action: 'pay_tax',
    amount: 60000
  },
  {
    title: 'Premio Pyme Corfo / Sercotec',
    text: 'Tu emprendimiento santiaguino ganó el fondo concursable Capital Semilla. Recibes $220.000 CLP.',
    action: 'collect',
    amount: 220000
  },
  {
    title: 'Revisión Técnica Rechazada',
    text: 'Rechazaron tu auto por gases en la planta de La Florida. Paga $85.000 CLP en mecánico.',
    action: 'pay_tax',
    amount: 85000
  },
  {
    title: 'Tarde de Café en Barrio Italia',
    text: 'Avanza hasta Barrio Italia en Ñuñoa. Si pasas por la Partida, cobra $200.000 CLP.',
    action: 'move_to',
    target: 27
  },
  {
    title: 'Pichanga de Media Semana',
    text: 'Ganaron la apuesta del arriendo de cancha en Quilín. Cada jugador te paga $20.000 CLP.',
    action: 'collect_each_player',
    amount: 20000
  },
  {
    title: 'Remodelación por Norma Antisísmica',
    text: 'Refuerzo estructural tras temblor grado 6: Paga $30.000 CLP por cada casa y $110.000 CLP por cada torre.',
    action: 'street_repairs',
    perHouse: 30000,
    perHotel: 110000
  },
  {
    title: 'Tren a Estación Central',
    text: 'Avanza hasta Metro Estación Central. Si pasas por Plaza Baquedano, cobra $200.000 CLP.',
    action: 'move_to',
    target: 5
  },
  {
    title: 'Trámite en el Centro',
    text: 'Avanza hasta Paseo Ahumada. Si pasas por la Partida, cobra tus $200.000 CLP.',
    action: 'move_to',
    target: 21
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
    title: '¡La Hora de tu Suerte!',
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
  },
  {
    title: 'Raspe "Al Fin Le Achunté"',
    text: 'Compraste un raspe en el kiosco de la esquina y salió premiado. Cobras $70.000 CLP.',
    action: 'collect',
    amount: 70000
  },
  {
    title: 'Aguinaldo de Navidad',
    text: 'Tu empresa pagó el aguinaldo de fin de año. Recibes $140.000 CLP.',
    action: 'collect',
    amount: 140000
  },
  {
    title: 'Donación a la Teletón',
    text: 'Te pusiste con la mano en el corazón en el Banco de Chile: Paga $50.000 CLP al pozo solidario.',
    action: 'pay_tax',
    amount: 50000
  },
  {
    title: 'Herencia de la Tía de Providencia',
    text: 'Recibiste un depósito a plazo en UF que dejó tu tía. Cobras $180.000 CLP.',
    action: 'collect',
    amount: 180000
  },
  {
    title: 'Completada Bailable Vecinal',
    text: 'Organizaste una completada en la junta de vecinos y fue éxito total. Cada jugador te compra tickets por $15.000 CLP.',
    action: 'collect_each_player',
    amount: 15000
  },
  {
    title: 'Cuenta de Calefacción de Invierno',
    text: 'El frío en Santiago estuvo implacable este mes. Paga $45.000 CLP.',
    action: 'pay_tax',
    amount: 45000
  },
  {
    title: 'Beca de Excelencia Académica',
    text: 'Obtuviste distinción máxima en la universidad. Recibes premio de $110.000 CLP.',
    action: 'collect',
    amount: 110000
  }
];

// 57 Símbolos para "¿Cuál es?" (Plano Proyectivo Finito de orden 7: 8 símbolos por carta, exactamente 1 coincidencia entre cualquier par)
const CUAL_ES_SYMBOLS = [
  { id: 0,  icon: '🦅', name: 'Cóndor' },
  { id: 1,  icon: '🥟', name: 'Empanada' },
  { id: 2,  icon: '🚇', name: 'Metro' },
  { id: 3,  icon: '🗿', name: 'Moai' },
  { id: 4,  icon: '🎸', name: 'Guitarra' },
  { id: 5,  icon: '🌋', name: 'Volcán' },
  { id: 6,  icon: '🍷', name: 'Copa de Vino' },
  { id: 7,  icon: '🥑', name: 'Palta' },
  { id: 8,  icon: '🌭', name: 'Completo' },
  { id: 9,  icon: '🐕', name: 'Quiltro' },
  { id: 10, icon: '⚽', name: 'Pelota' },
  { id: 11, icon: '🏆', name: 'Copa' },
  { id: 12, icon: '☀️', name: 'Sol' },
  { id: 13, icon: '🌙', name: 'Luna' },
  { id: 14, icon: '⭐', name: 'Estrella' },
  { id: 15, icon: '⚡', name: 'Rayo' },
  { id: 16, icon: '🔥', name: 'Fuego' },
  { id: 17, icon: '💧', name: 'Gota' },
  { id: 18, icon: '❄️', name: 'Copo de Nieve' },
  { id: 19, icon: '🌈', name: 'Arcoíris' },
  { id: 20, icon: '🍎', name: 'Manzana' },
  { id: 21, icon: '🍓', name: 'Frutilla' },
  { id: 22, icon: '🍒', name: 'Guinda' },
  { id: 23, icon: '🍕', name: 'Pizza' },
  { id: 24, icon: '🍔', name: 'Hamburguesa' },
  { id: 25, icon: '🍟', name: 'Papas Fritas' },
  { id: 26, icon: '🍦', name: 'Helado' },
  { id: 27, icon: '🍩', name: 'Dona' },
  { id: 28, icon: '🎂', name: 'Torta' },
  { id: 29, icon: '🍿', name: 'Cabritas' },
  { id: 30, icon: '🐱', name: 'Gato' },
  { id: 31, icon: '🦊', name: 'Zorro Culpeo' },
  { id: 32, icon: '🐼', name: 'Panda' },
  { id: 33, icon: '🐸', name: 'Rana' },
  { id: 34, icon: '🐧', name: 'Pingüino' },
  { id: 35, icon: '🐢', name: 'Tortuga' },
  { id: 36, icon: '🐙', name: 'Pulpo' },
  { id: 37, icon: '🦋', name: 'Mariposa' },
  { id: 38, icon: '🐝', name: 'Abeja' },
  { id: 39, icon: '🌵', name: 'Cactus' },
  { id: 40, icon: '🌺', name: 'Copihue' },
  { id: 41, icon: '🍀', name: 'Trébol' },
  { id: 42, icon: '🍄', name: 'Hongo' },
  { id: 43, icon: '🚗', name: 'Auto' },
  { id: 44, icon: '✈️', name: 'Avión' },
  { id: 45, icon: '🚀', name: 'Cohete' },
  { id: 46, icon: '⛵', name: 'Velero' },
  { id: 47, icon: '🚲', name: 'Bicicleta' },
  { id: 48, icon: '🎈', name: 'Globo' },
  { id: 49, icon: '🎁', name: 'Regalo' },
  { id: 50, icon: '👑', name: 'Corona' },
  { id: 51, icon: '💎', name: 'Diamante' },
  { id: 52, icon: '🔑', name: 'Llave' },
  { id: 53, icon: '🔒', name: 'Candado' },
  { id: 54, icon: '🔔', name: 'Campana' },
  { id: 55, icon: '⏰', name: 'Reloj' },
  { id: 56, icon: '💡', name: 'Ampolleta' }
];

function generateCualEsDeck() {
  const n = 7;
  const cards = [];

  // Primera carta: 8 símbolos (0..7)
  const firstCard = [];
  for (let i = 0; i <= n; i++) firstCard.push(i);
  cards.push(firstCard);

  // n cartas siguientes
  for (let j = 0; j < n; j++) {
    const card = [0];
    for (let k = 0; k < n; k++) {
      card.push(n + 1 + j * n + k);
    }
    cards.push(card);
  }

  // n * n cartas restantes
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const card = [i + 1];
      for (let k = 0; k < n; k++) {
        const val = n + 1 + k * n + ((j + i * k) % n);
        card.push(val);
      }
      cards.push(card);
    }
  }

  // Barajar el orden de los símbolos dentro de cada carta y luego barajar el mazo
  const shuffledCards = cards.map((cardSymbols) => {
    const copy = [...cardSymbols];
    for (let i = copy.length - 1; i > 0; i--) {
      const r = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[r]] = [copy[r], copy[i]];
    }
    return copy;
  });

  for (let i = shuffledCards.length - 1; i > 0; i--) {
    const r = Math.floor(Math.random() * (i + 1));
    [shuffledCards[i], shuffledCards[r]] = [shuffledCards[r], shuffledCards[i]];
  }

  return shuffledCards;
}

module.exports = {
  COLOR_GROUPS,
  PLAYER_AVATARS,
  BOARD_TILES,
  CHANCE_CARDS,
  COMMUNITY_CARDS,
  CUAL_ES_SYMBOLS,
  generateCualEsDeck
};
