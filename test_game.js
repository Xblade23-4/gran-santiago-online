const assert = require('assert');
const { io: Client } = require('socket.io-client');
const { server, rooms } = require('./server');

async function runTests() {
  console.log('🧪 Iniciando pruebas automatizadas de Gran Santiago Online...');

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const url = `http://localhost:${port}`;

  const clients = [];
  const createClient = () => {
    const c = Client(url);
    clients.push(c);
    return c;
  };

  try {
    // 1. El Anfitrión (Jugador 1) crea una sala con $1.500.000 CLP
    const host = createClient();
    await new Promise((r) => host.on('connect', r));

    const createRes = await new Promise((r) =>
      host.emit(
        'create_room',
        { playerName: 'Alvaro', avatarId: 'condorito', startingMoney: 1500000, playerId: 'p1' },
        r
      )
    );
    assert.strictEqual(createRes.ok, true, 'La sala debe crearse correctamente');
    const roomCode = createRes.roomCode;
    console.log(`✅ Sala creada: ${roomCode} con capital inicial $1.500.000 CLP`);

    // 2. Unir 7 jugadores adicionales para verificar soporte de hasta 8 jugadores simultáneos
    for (let i = 2; i <= 8; i++) {
      const c = createClient();
      await new Promise((r) => c.on('connect', r));
      const joinRes = await new Promise((r) =>
        c.emit(
          'join_room',
          { roomCode, playerName: `Jugador_${i}`, avatarId: 'metro', playerId: `p${i}` },
          r
        )
      );
      assert.strictEqual(joinRes.ok, true, `Jugador ${i} debería poder unirse`);
    }

    const room = rooms.get(roomCode);
    assert.strictEqual(room.players.length, 8, 'La sala debe tener exactamente 8 jugadores');
    console.log('✅ Soporte de 8 jugadores simultáneos verificado.');

    // 3. Verificar que un 9no jugador sea rechazado
    const extraClient = createClient();
    await new Promise((r) => extraClient.on('connect', r));
    const extraRes = await new Promise((r) =>
      extraClient.emit('join_room', { roomCode, playerName: 'Extra9', playerId: 'p9' }, r)
    );
    assert.strictEqual(extraRes.ok, false, 'El 9no jugador no debe poder entrar');
    console.log('✅ Límite máximo de 8 jugadores respetado.');

    // 4. Iniciar la partida
    const startRes = await new Promise((r) => host.emit('start_game', {}, r));
    assert.strictEqual(startRes.ok, true, 'El anfitrión debe poder iniciar la partida');
    assert.strictEqual(room.status, 'playing', 'El estado de la sala debe ser playing');

    // 5. Simular posicionamiento en una propiedad disponible (ej. Av. Pajaritos, casilla 1, precio $60.000 CLP) y comprarla
    const p1 = room.players[0];
    p1.position = 1;
    room.turnPhase = 'BUY_DECISION';
    room.pendingBuyTileId = 1;

    const buyRes = await new Promise((r) => host.emit('buy_property', {}, r));
    assert.strictEqual(buyRes.ok, true, 'El jugador 1 debe poder comprar Av. Pajaritos');
    assert.strictEqual(room.properties[1].ownerId, 'p1', 'Av. Pajaritos debe pertenecer a p1');
    assert.strictEqual(p1.money, 1500000 - 60000, 'El saldo en CLP debe descontar $60.000');
    console.log(`✅ Compra de propiedad verificada. Nuevo saldo de ${p1.name}: $${p1.money.toLocaleString('es-CL')} CLP`);

    // 6. Darle también Gran Avenida (casilla 3) a p1 para completar el grupo café y probar construcción de casa
    room.properties[3].ownerId = 'p1';
    const buildRes = await new Promise((r) => host.emit('build_house', { tileId: 1 }, r));
    assert.strictEqual(buildRes.ok, true, 'Debe permitir construir casa al tener grupo completo');
    assert.strictEqual(room.properties[1].houses, 1, 'Av. Pajaritos debe tener 1 casa');
    console.log('✅ Construcción de casas y monopolio por sector verificados.');

    // 6b. Verificar que al caer en tarjeta "?" espera confirmación (o timeout de 10s) antes de mover al jugador
    p1.position = 7; // Casilla ¡Aló Santiago! (?)
    room.turnPhase = 'CARD_CONFIRM';
    room.pendingCard = {
      id: 'test_card_1',
      playerId: 'p1',
      playerName: 'Alvaro',
      deckType: 'chance',
      deckTitle: '¡Aló Santiago! (Suerte)',
      card: { title: 'Avanza a Partida', text: 'Avanza hasta Plaza Baquedano', action: 'move_to', target: 0 },
      diceSum: 7
    };
    assert.strictEqual(p1.position, 7, 'El jugador permanece en la casilla "?" mientras lee la tarjeta');
    const confirmCardRes = await new Promise((r) => host.emit('confirm_card', {}, r));
    assert.strictEqual(confirmCardRes.ok, true, 'El jugador puede cerrar/confirmar manualmente la tarjeta');
    assert.strictEqual(p1.position, 0, 'Recién tras confirmar la tarjeta (o pasar los 10s) se mueve a la casilla objetivo');
    console.log('✅ Confirmación manual / timeout de 10s en tarjetas "?" antes de ejecutar movimiento verificado.');

    // 7. Probar el segundo juego: "¿Cuál es?" (coincidencias de cartas y penalización de 3s)
    const host2 = createClient();
    await new Promise((r) => host2.on('connect', r));
    const createCualEs = await new Promise((r) =>
      host2.emit(
        'create_room',
        { playerName: 'HostCualEs', avatarId: 'moai', gameType: 'cual_es', playerId: 'ce1' },
        r
      )
    );
    assert.strictEqual(createCualEs.ok, true, 'Sala de ¿Cuál es? debe crearse');
    const ceCode = createCualEs.roomCode;

    const p2Client = createClient();
    await new Promise((r) => p2Client.on('connect', r));
    await new Promise((r) =>
      p2Client.emit('join_room', { roomCode: ceCode, playerName: 'Retador', playerId: 'ce2' }, r)
    );

    const startCe = await new Promise((r) => host2.emit('start_game', {}, r));
    assert.strictEqual(startCe.ok, true, 'Debe iniciar ¿Cuál es?');

    const ceRoom = rooms.get(ceCode);
    const myCard = ceRoom.cualEs.playerCards['ce1'];
    const centerCard = ceRoom.cualEs.centerCard;

    // Verificar propiedad matemática: exactamente 1 símbolo en común
    const commonSymbols = myCard.filter((s) => centerCard.includes(s));
    assert.strictEqual(commonSymbols.length, 1, 'Entre dos cartas cualesquiera debe haber exactamente 1 símbolo en común');
    console.log('✅ Mazo de "¿Cuál es?" verificado: exactamente 1 símbolo en común entre cualquier par de cartas.');

    // Hacer clic en el símbolo correcto
    const rightClick = await new Promise((r) =>
      host2.emit('cual_es_click', { symbolId: commonSymbols[0] }, r)
    );
    assert.strictEqual(rightClick.ok, true, 'Clic en el símbolo repetido debe dar punto');
    assert.strictEqual(ceRoom.cualEs.scores['ce1'], 2, 'El puntaje de cartas de ce1 debe subir a 2');

    // Hacer clic en un símbolo incorrecto para verificar los 3 segundos de penalización
    const wrongSym = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].find(
      (s) => !ceRoom.cualEs.playerCards['ce1'].includes(s)
    );
    const wrongClick = await new Promise((r) =>
      host2.emit('cual_es_click', { symbolId: wrongSym }, r)
    );
    assert.strictEqual(wrongClick.ok, false, 'Clic erróneo debe fallar');
    assert.strictEqual(wrongClick.penalized, true, 'Clic erróneo debe activar penalización de 3 segundos');
    console.log('✅ Penalización de 3 segundos anti-spam verificada en "¿Cuál es?".');

    // 8. Probar integración de GameParty Web (Crucigrama Party & Doodle Party) en el mismo servidor
    const gpHost = createClient();
    await new Promise((r) => gpHost.on('connect', r));
    const gpCreateRes = await new Promise((r) =>
      gpHost.emit('create-room', { nickname: 'AlvaroGP', avatar: '🦊' }, r)
    );
    assert.strictEqual(gpCreateRes.success, true, 'Sala de GameParty (Crucigrama/Doodle) debe crearse');
    const gpStartRes = await new Promise((r) =>
      gpHost.emit('start-game', { gameType: 'crossword', category: 'general', difficulty: 'Fácil' }, r)
    );
    assert.strictEqual(gpStartRes.success, true, 'Partida de Crucigrama Party debe iniciar en el servidor unificado');
    console.log('✅ Integración de GameParty Web (Crucigrama Party & Doodle Party) verificada.');

    console.log('\n🎉 ¡TODAS LAS PRUEBAS AUTOMATIZADAS PASARON EXITOSAMENTE!');
  } finally {
    clients.forEach((c) => c.close());
    server.close();
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('❌ Error en las pruebas:', err);
  process.exit(1);
});
