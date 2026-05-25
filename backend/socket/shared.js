const auctionEngine = require('../engine/AuctionEngine');

function ratingToCategory(rating) {
  if (rating >= 93) return 'Platinum';
  if (rating >= 88) return 'Gold';
  if (rating >= 80) return 'Silver';
  return 'Bronze';
}

function formatCardDescription(card) {
  if (!card) return '';
  const parts = [];
  if (card.rating != null) parts.push(`Rating: ${card.rating}`);
  if (card.age != null) parts.push(`Age: ${card.age}`);
  return parts.join(' · ') || 'South Indian Cinema';
}

function formatCardForClient(card) {
  if (!card) return null;
  return {
    id: String(card.id),
    name: card.name,
    image: card.image,
    category: card.category || ratingToCategory(card.rating),
    basePrice: card.basePrice,
    rating: card.rating,
    age: card.age,
    description: formatCardDescription(card),
  };
}

function sanitizeAuctionStateForClient(engineState) {
  if (!engineState) return null;

  const timer = auctionEngine.getTimerSnapshot(engineState.roomCode);

  return {
    currentCard: formatCardForClient(engineState.currentCard),
    currentBid: engineState.currentBid.amount,
    highestBidderId: engineState.currentBid.bidderId,
    highestBidderName: engineState.currentBid.bidderName,
    bids: (engineState.roundBids || []).map((b, index) => ({
      id: `${engineState.currentCardIndex}-${index}`,
      playerId: b.bidderId,
      playerName: b.bidderName,
      amount: b.amount,
      timestamp: b.timestamp,
    })),
    timeRemaining: timer?.timeRemaining ?? engineState.timeRemaining,
    timerEndsAt: timer?.timerEndsAt ?? engineState.timerEndsAt,
    timerGeneration: timer?.timerGeneration ?? engineState.timerGeneration,
    isActive: engineState.status === 'active',
    isPaused: engineState.status === 'paused',
    currentRound: engineState.currentCardIndex + 1,
    totalRounds: engineState.totalCards,
    passedPlayers: Array.from(engineState.passedPlayers),
    soldCards: (engineState.auctionResults || [])
      .filter((r) => r.status === 'sold')
      .map((r) => ({
        card: formatCardForClient(r.card),
        buyerId: r.winnerId,
        buyerName: r.winnerName,
        soldPrice: r.finalPrice,
      })),
    unsoldCards: (engineState.auctionResults || [])
      .filter((r) => r.status === 'unsold')
      .map((r) => formatCardForClient(r.card)),
  };
}

function syncRoomPlayersFromEngine(room, roomCode) {
  const engineState = auctionEngine.getState(roomCode);
  if (!engineState || !room) return;

  const engineByNickname = {};
  Object.values(engineState.players).forEach((p) => {
    engineByNickname[p.nickname.toLowerCase()] = p;
  });

  room.players.forEach((rp) => {
    const ep =
      engineState.players[rp.socketId] ||
      (rp.previousSocketId && engineState.players[rp.previousSocketId]) ||
      engineByNickname[rp.nickname.toLowerCase()];

    if (ep) {
      rp.socketId = ep.socketId;
      rp.money = ep.money;
      rp.ownedCards = ep.ownedCards;
      rp.totalSpent = ep.totalSpent;
      rp.isConnected = ep.isConnected;
      rp.hasPassedCurrentRound = ep.hasPassedCurrentRound;
    }
  });

  if (room.hostId && !room.players.some((p) => p.socketId === room.hostId)) {
    const host = room.players.find((p) => p.isHost);
    if (host) {
      room.hostId = host.socketId;
      room.hostNickname = host.nickname;
    }
  }
}

function applyEnginePlayersToRoom(room, enginePlayers) {
  if (!room || !enginePlayers) return;
  enginePlayers.forEach((p) => {
    const rp = room.players.find(
      (x) => x.socketId === p.socketId || x.nickname === p.nickname
    );
    if (rp) {
      rp.money = p.money;
      rp.ownedCards = p.ownedCards;
      rp.totalSpent = p.totalSpent;
    }
  });
}

function isSocketInRoom(room, socketId) {
  return room.players.some((p) => p.socketId === socketId && p.isConnected);
}

function findRoomPlayer(room, socketId, nickname) {
  if (!room) return null;
  let player = room.players.find((p) => p.socketId === socketId);
  if (!player && nickname) {
    const n = nickname.toLowerCase();
    player = room.players.find((p) => p.nickname.toLowerCase() === n);
  }
  return player;
}

module.exports = {
  formatCardForClient,
  formatCardDescription,
  ratingToCategory,
  sanitizeAuctionStateForClient,
  syncRoomPlayersFromEngine,
  applyEnginePlayersToRoom,
  isSocketInRoom,
  findRoomPlayer,
};
