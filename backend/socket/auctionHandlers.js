const auctionEngine = require('../engine/AuctionEngine');
const { checkRateLimit, validateBidIncrement } = require('../middleware/validation');
const actresses = require('../data/actresses');
const {
  rooms,
  sanitizeRoomForClient,
  sanitizeGameResultsForClient,
} = require('./store');
const {
  sanitizeAuctionStateForClient,
  formatCardForClient,
  syncRoomPlayersFromEngine,
  applyEnginePlayersToRoom,
  isSocketInRoom,
  findRoomPlayer,
} = require('./shared');

function ack(callback, payload) {
  if (typeof callback === 'function') callback(payload);
}

function requireHost(room, socket, callback) {
  if (!room) {
    ack(callback, { success: false, message: 'Room not found.' });
    return false;
  }
  if (room.hostId !== socket.id) {
    ack(callback, { success: false, message: 'Only the host can perform this action.' });
    return false;
  }
  return true;
}

function emitGameEnded(io, roomCode, room) {
  const results = auctionEngine.getFinalResults(roomCode);
  room.status = 'finished';
  io.to(roomCode).emit('game:ended', {
    room: sanitizeRoomForClient(room),
    results: sanitizeGameResultsForClient(results, room.players),
  });
  io.to(roomCode).emit('room:updated', { room: sanitizeRoomForClient(room) });
  return results;
}

function startAuctionTimer(io, roomCode) {
  auctionEngine.startTimer(roomCode, (result) => {
    if (result.resolved) {
      const room = rooms.get(roomCode);
      if (room && result.players) {
        applyEnginePlayersToRoom(room, result.players);
      }
      handleCardResolved(io, roomCode, result);
      return;
    }

    io.to(roomCode).emit('auction:timer-update', {
      timeRemaining: result.timeRemaining,
      timerEndsAt: result.timerEndsAt,
      timerGeneration: result.timerGeneration,
    });
  });
}

function handleCardResolved(io, roomCode, result) {
  if (!result?.resolved || !result.result) return;

  auctionEngine.stopTimer(roomCode);
  const room = rooms.get(roomCode);

  if (result.result.status === 'sold') {
    const soldCard = {
      card: formatCardForClient(result.result.card),
      buyerId: result.result.winnerId,
      buyerName: result.result.winnerName,
      soldPrice: result.result.finalPrice,
    };

    io.to(roomCode).emit('auction:card-sold', { soldCard });

    const systemMsg = {
      id: `sys-${Date.now()}`,
      playerId: 'system',
      playerName: 'System',
      message: `🔨 ${result.result.card.name} sold to ${result.result.winnerName} for ₹${result.result.finalPrice}!`,
      type: 'system',
      timestamp: Date.now(),
    };
    if (room) {
      room.chatMessages.push(systemMsg);
      io.to(roomCode).emit('chat:message', systemMsg);
    }
  } else {
    const card = formatCardForClient(result.result.card);
    io.to(roomCode).emit('auction:card-unsold', { card });

    const systemMsg = {
      id: `sys-${Date.now()}`,
      playerId: 'system',
      playerName: 'System',
      message: `❌ ${result.result.card.name} went unsold.`,
      type: 'system',
      timestamp: Date.now(),
    };
    if (room) {
      room.chatMessages.push(systemMsg);
      io.to(roomCode).emit('chat:message', systemMsg);
    }
  }

  if (room) {
    syncRoomPlayersFromEngine(room, roomCode);
    io.to(roomCode).emit('room:updated', { room: sanitizeRoomForClient(room) });
  }

  auctionEngine.scheduleNextCard(roomCode, 3000, () => {
    const nextResult = auctionEngine.nextCard(roomCode);
    if (!nextResult.success) return;

    const currentRoom = rooms.get(roomCode);

    if (nextResult.finished) {
      if (currentRoom) currentRoom.status = 'finished';
      const results = auctionEngine.getFinalResults(roomCode);
      io.to(roomCode).emit('game:ended', {
        room: currentRoom ? sanitizeRoomForClient(currentRoom) : null,
        results: sanitizeGameResultsForClient(results, currentRoom ? currentRoom.players : []),
      });
      if (currentRoom) {
        io.to(roomCode).emit('room:updated', {
          room: sanitizeRoomForClient(currentRoom),
        });
      }
      return;
    }

    if (currentRoom) {
      currentRoom.currentCardIndex = nextResult.currentCardIndex;
      syncRoomPlayersFromEngine(currentRoom, roomCode);
      io.to(roomCode).emit('room:updated', {
        room: sanitizeRoomForClient(currentRoom),
      });
    }

    const formattedCard = formatCardForClient(nextResult.currentCard);
    io.to(roomCode).emit('auction:new-card', {
      card: formattedCard,
      round: nextResult.currentCardIndex + 1,
      totalRounds: nextResult.totalCards,
      timer: nextResult.timer,
    });

    const engineState = auctionEngine.getState(roomCode);
    if (engineState) {
      io.to(roomCode).emit('auction:update', {
        auction: sanitizeAuctionStateForClient(engineState),
      });
    }

    startAuctionTimer(io, roomCode);
  });
}

function setupAuctionHandlers(io, socket) {
  socket.on('room:start', (data, callback) => {
    try {
      const { code } = data || {};
      const roomCode = code?.toUpperCase();
      const room = rooms.get(roomCode);

      if (!room) {
        return ack(callback, { success: false, message: 'Room not found.' });
      }
      if (room.hostId !== socket.id) {
        return ack(callback, { success: false, message: 'Only the host can start the auction.' });
      }
      if (room.status !== 'waiting') {
        return ack(callback, { success: false, message: 'Game already started.' });
      }

      const connectedPlayers = room.players.filter((p) => p.isConnected);
      if (connectedPlayers.length < 2) {
        return ack(callback, { success: false, message: 'Need at least 2 connected players to start.' });
      }

      room.status = 'playing';
      room.settings.totalCards = actresses.length;
      const engineState = auctionEngine.initAuction(roomCode, room.settings, connectedPlayers);
      syncRoomPlayersFromEngine(room, roomCode);

      const auction = sanitizeAuctionStateForClient(engineState);
      io.to(roomCode).emit('game:started', {
        room: sanitizeRoomForClient(room),
        auction,
      });
      io.to(roomCode).emit('room:updated', { room: sanitizeRoomForClient(room) });

      startAuctionTimer(io, roomCode);
      ack(callback, { success: true });
      console.log(`🎬 Auction started in room ${roomCode}`);
    } catch (err) {
      console.error('Start auction error:', err);
      ack(callback, { success: false, message: 'Failed to start auction.' });
    }
  });

  socket.on('auction:bid', (data, callback) => {
    if (!checkRateLimit(socket, 'place-bid')) {
      return ack(callback, { success: false, message: 'Too many bids. Please wait.' });
    }

    const { code, amount } = data || {};
    const roomCode = code?.toUpperCase();
    const room = rooms.get(roomCode);

    if (!room || room.status !== 'playing') {
      return ack(callback, { success: false, message: 'Auction not active.' });
    }
    if (!isSocketInRoom(room, socket.id)) {
      return ack(callback, { success: false, message: 'You are not in this room.' });
    }

    auctionEngine.runExclusive(roomCode, () => {
      const state = auctionEngine.getState(roomCode);
      if (!state) {
        return { success: false, error: 'Auction not found' };
      }

      const increment = Math.round(Number(amount)) - state.currentBid.amount;
      if (!validateBidIncrement(increment, state.currentBid.amount)) {
        return { success: false, error: 'Invalid bid increment for current price tier.' };
      }

      return auctionEngine.placeBid(roomCode, socket.id, increment);
    }).then((result) => {
      if (!result.success) {
        return ack(callback, { success: false, message: result.error });
      }

      syncRoomPlayersFromEngine(room, roomCode);

      io.to(roomCode).emit('auction:bid-placed', {
        bid: {
          id: `${Date.now()}-${socket.id}`,
          playerId: socket.id,
          playerName: socket.playerNickname || result.bid.bidderName,
          amount: result.bid.amount,
          timestamp: Date.now(),
        },
        currentBid: result.bid.amount,
        highestBidderId: socket.id,
        highestBidderName: result.bid.bidderName,
        timeRemaining: result.timer.timeRemaining,
        timerEndsAt: result.timer.timerEndsAt,
        timerGeneration: result.timer.timerGeneration,
      });

      io.to(roomCode).emit('room:updated', { room: sanitizeRoomForClient(room) });
      startAuctionTimer(io, roomCode);
      ack(callback, { success: true, currentBid: result.bid.amount, timer: result.timer });
    }).catch((err) => {
      console.error('Place bid error:', err);
      ack(callback, { success: false, message: 'Failed to place bid.' });
    });
  });

  socket.on('auction:pass', (data, callback) => {
    if (!checkRateLimit(socket, 'pass-card')) {
      return ack(callback, { success: false, message: 'Too many requests. Please wait.' });
    }

    const { code } = data || {};
    const roomCode = code?.toUpperCase();
    const room = rooms.get(roomCode);

    if (!room || room.status !== 'playing') {
      return ack(callback, { success: false, message: 'Auction not active.' });
    }
    if (!isSocketInRoom(room, socket.id)) {
      return ack(callback, { success: false, message: 'You are not in this room.' });
    }

    auctionEngine.runExclusive(roomCode, () => auctionEngine.passCard(roomCode, socket.id))
      .then((result) => {
        if (!result.success) {
          if (result.alreadyResolved) {
            return ack(callback, { success: true, resolved: true });
          }
          return ack(callback, { success: false, message: result.error });
        }

        if (result.resolved) {
          applyEnginePlayersToRoom(room, result.players);
          handleCardResolved(io, roomCode, result);
          return ack(callback, { success: true, resolved: true });
        }

        io.to(roomCode).emit('auction:player-passed', { playerId: socket.id });
        ack(callback, { success: true, resolved: false });
      })
      .catch((err) => {
        console.error('Pass card error:', err);
        ack(callback, { success: false, message: 'Failed to pass.' });
      });
  });

  socket.on('auction:sync', (data, callback) => {
    if (!checkRateLimit(socket, 'auction-sync')) {
      return ack(callback, { success: false, message: 'Sync rate limited.' });
    }

    const { code } = data || {};
    const roomCode = code?.toUpperCase();
    const room = rooms.get(roomCode);

    if (!room) {
      return ack(callback, { success: false, message: 'Room not found.' });
    }

    const player = findRoomPlayer(room, socket.id, socket.playerNickname);
    if (!player) {
      return ack(callback, { success: false, message: 'Not a room member.' });
    }

    const engineState = auctionEngine.getState(roomCode);
    syncRoomPlayersFromEngine(room, roomCode);

    const payload = {
      success: true,
      room: sanitizeRoomForClient(room),
      auction: null,
      timer: null,
      results: null,
    };

    if (room.status === 'finished' || engineState?.status === 'finished') {
      const finalResults = auctionEngine.getFinalResults(roomCode);
      if (finalResults) {
        payload.results = sanitizeGameResultsForClient(finalResults, room.players);
      }
      if (engineState) {
        payload.auction = sanitizeAuctionStateForClient(engineState);
      }
    } else if (engineState) {
      payload.auction = sanitizeAuctionStateForClient(engineState);
      payload.timer = auctionEngine.getTimerSnapshot(roomCode);
    }

    socket.emit('auction:sync', payload);
    ack(callback, payload);
  });

  socket.on('auction:host-end', (data, callback) => {
    const roomCode = data?.code?.toUpperCase();
    const room = rooms.get(roomCode);
    if (!requireHost(room, socket, callback)) return;

    const result = auctionEngine.endAuctionEarly(roomCode);
    if (!result.success) {
      return ack(callback, { success: false, message: result.error });
    }
    emitGameEnded(io, roomCode, room);
    ack(callback, { success: true });
  });

  socket.on('auction:host-skip', (data, callback) => {
    const roomCode = data?.code?.toUpperCase();
    const room = rooms.get(roomCode);
    if (!requireHost(room, socket, callback)) return;
    if (room.status !== 'playing') {
      return ack(callback, { success: false, message: 'Auction not active.' });
    }

    auctionEngine
      .runExclusive(roomCode, () => auctionEngine.skipCurrentCard(roomCode))
      .then((result) => {
        if (!result.success && !result.alreadyResolved) {
          return ack(callback, { success: false, message: result.error });
        }
        if (result.resolved) {
          applyEnginePlayersToRoom(room, result.players);
          handleCardResolved(io, roomCode, result);
        }
        ack(callback, { success: true });
      })
      .catch((err) => {
        console.error('Skip card error:', err);
        ack(callback, { success: false, message: 'Failed to skip card.' });
      });
  });

  socket.on('auction:host-pause', (data, callback) => {
    const roomCode = data?.code?.toUpperCase();
    const room = rooms.get(roomCode);
    if (!requireHost(room, socket, callback)) return;

    const result = auctionEngine.pauseAuction(roomCode);
    if (!result.success) {
      return ack(callback, { success: false, message: result.error });
    }
    io.to(roomCode).emit('auction:paused', { timeRemaining: result.timeRemaining });
    const engineState = auctionEngine.getState(roomCode);
    if (engineState) {
      io.to(roomCode).emit('auction:update', {
        auction: sanitizeAuctionStateForClient(engineState),
      });
    }
    ack(callback, { success: true });
  });

  socket.on('auction:host-resume', (data, callback) => {
    const roomCode = data?.code?.toUpperCase();
    const room = rooms.get(roomCode);
    if (!requireHost(room, socket, callback)) return;

    const result = auctionEngine.resumeAuction(roomCode);
    if (!result.success) {
      return ack(callback, { success: false, message: result.error });
    }
    startAuctionTimer(io, roomCode);
    io.to(roomCode).emit('auction:resumed', { timer: result.timer });
    const engineState = auctionEngine.getState(roomCode);
    if (engineState) {
      io.to(roomCode).emit('auction:update', {
        auction: sanitizeAuctionStateForClient(engineState),
      });
    }
    ack(callback, { success: true });
  });

  socket.on('game:restart', (data, callback) => {
    const roomCode = data?.code?.toUpperCase();
    const room = rooms.get(roomCode);
    if (!requireHost(room, socket, callback)) return;

    auctionEngine.cleanup(roomCode);
    room.status = 'waiting';
    room.currentCardIndex = 0;
    room.players.forEach((p) => {
      p.money = room.settings.initialMoney;
      p.ownedCards = [];
      p.totalSpent = 0;
      p.hasPassedCurrentRound = false;
      p.isReady = p.isHost;
    });

    io.to(roomCode).emit('room:updated', { room: sanitizeRoomForClient(room) });
    io.to(roomCode).emit('game:reset', { room: sanitizeRoomForClient(room) });
    ack(callback, { success: true });
  });
}

module.exports = {
  setupAuctionHandlers,
  handleCardResolved,
  startAuctionTimer,
};
