/**
 * Centralized in-memory room store and client sanitizers.
 * Handlers must import shared state from here — never from each other.
 */
const auctionEngine = require('../engine/AuctionEngine');
const {
  formatCardForClient,
  sanitizeAuctionStateForClient,
  syncRoomPlayersFromEngine,
} = require('./shared');

const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function getRoomByCode(code) {
  return rooms.get(code);
}

function sanitizePlayerForClient(player) {
  return {
    id: player.socketId,
    nickname: player.nickname,
    avatar: `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(player.nickname)}`,
    money: player.money,
    isHost: player.isHost,
    isReady: player.isReady,
    isConnected: player.isConnected,
    cards: (player.ownedCards || []).map((c) => formatCardForClient(c)),
    totalSpent: player.totalSpent,
  };
}

function sanitizeRoomForClient(room) {
  return {
    code: room.roomCode,
    settings: {
      startingMoney: room.settings.initialMoney,
      timerDuration: room.settings.timerDuration,
      maxPlayers: room.settings.maxPlayers,
      numberOfCards: room.settings.totalCards,
    },
    players: room.players.map(sanitizePlayerForClient),
    status: room.status,
    hostId: room.hostId,
    currentRound: (room.currentCardIndex || 0) + 1,
    totalRounds: room.settings.totalCards,
  };
}

function sanitizeGameResultsForClient(engineResults, roomPlayers) {
  if (!engineResults) return null;
  return {
    playerResults: engineResults.players.map((p) => {
      const originalPlayer =
        roomPlayers.find(
          (rp) => rp.socketId === p.socketId || rp.nickname === p.nickname
        ) || p;

      const formattedPlayer = sanitizePlayerForClient({
        socketId: p.socketId,
        nickname: p.nickname,
        money: p.money,
        ownedCards: p.ownedCards,
        totalSpent: p.totalSpent,
        isHost: p.isHost,
        isConnected: true,
        isReady: true,
      });

      let mostExpensivePurchase = null;
      if (p.ownedCards && p.ownedCards.length > 0) {
        const sortedOwned = [...p.ownedCards].sort(
          (a, b) => b.purchasePrice - a.purchasePrice
        );
        const topCard = sortedOwned[0];
        mostExpensivePurchase = {
          card: formatCardForClient(topCard),
          buyerId: p.socketId,
          buyerName: p.nickname,
          soldPrice: topCard.purchasePrice,
        };
      }

      return {
        player: formattedPlayer,
        rank: p.rank,
        cardsOwned: p.cardsCount,
        totalSpent: p.totalSpent,
        remainingMoney: p.money,
        mostExpensivePurchase,
        score: p.cardsCount * 1000 + Math.round(p.money / 10),
      };
    }),
    unsoldCards: engineResults.unsoldCards.map((c) => formatCardForClient(c)),
    totalRounds: engineResults.totalCardsAuctioned,
  };
}

function emitFullSync(io, socket, roomCode, room) {
  const engineState = auctionEngine.getState(roomCode);
  if (!engineState) return;

  syncRoomPlayersFromEngine(room, roomCode);
  const payload = {
    room: sanitizeRoomForClient(room),
    auction: sanitizeAuctionStateForClient(engineState),
    timer: auctionEngine.getTimerSnapshot(roomCode),
  };

  if (socket) {
    socket.emit('auction:sync', payload);
  } else {
    io.to(roomCode).emit('auction:update', { auction: payload.auction });
    io.to(roomCode).emit('room:updated', { room: payload.room });
  }
}

module.exports = {
  rooms,
  generateRoomCode,
  getRoomByCode,
  sanitizePlayerForClient,
  sanitizeRoomForClient,
  sanitizeGameResultsForClient,
  emitFullSync,
};
