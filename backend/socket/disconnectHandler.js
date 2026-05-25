const auctionEngine = require('../engine/AuctionEngine');
const { rooms, sanitizeRoomForClient, sanitizeGameResultsForClient } = require('./store');
const {
  sanitizeAuctionStateForClient,
  syncRoomPlayersFromEngine,
  applyEnginePlayersToRoom,
} = require('./shared');
const { handleCardResolved } = require('./auctionHandlers');

function handleSocketDisconnect(io, socket) {
  const roomCode = socket.roomCode;
  if (!roomCode) return;

  const room = rooms.get(roomCode);
  if (!room) return;

  const player = room.players.find((p) => p.socketId === socket.id);
  if (player) {
    player.previousSocketId = socket.id;
    player.isConnected = false;
  }

  const engineState = auctionEngine.getState(roomCode);
  if (!engineState) {
    io.to(roomCode).emit('room:updated', { room: sanitizeRoomForClient(room) });
    scheduleEmptyRoomCleanup(roomCode);
    return;
  }

  const result = auctionEngine.playerDisconnect(roomCode, socket.id);
  if (!result) return;

  syncRoomPlayersFromEngine(room, roomCode);

  if (result.finished) {
    room.status = 'finished';
    auctionEngine.stopTimer(roomCode);
    const results = auctionEngine.getFinalResults(roomCode);
    io.to(roomCode).emit('game:ended', {
      room: sanitizeRoomForClient(room),
      results: sanitizeGameResultsForClient(results, room.players),
    });
  } else if (result.resolved) {
    applyEnginePlayersToRoom(room, result.players);
    handleCardResolved(io, roomCode, result);
  } else {
    io.to(roomCode).emit('auction:update', {
      auction: sanitizeAuctionStateForClient(engineState),
    });
    io.to(roomCode).emit('room:updated', { room: sanitizeRoomForClient(room) });
  }

  scheduleEmptyRoomCleanup(roomCode);
}

function scheduleEmptyRoomCleanup(roomCode) {
  setTimeout(() => {
    const currentRoom = rooms.get(roomCode);
    if (!currentRoom) return;
    const connected = currentRoom.players.filter((p) => p.isConnected);
    if (connected.length === 0) {
      auctionEngine.cleanup(roomCode);
      rooms.delete(roomCode);
      console.log(`🗑️  Room ${roomCode} cleaned up (empty)`);
    }
  }, 30000);
}

module.exports = { handleSocketDisconnect, scheduleEmptyRoomCleanup };
