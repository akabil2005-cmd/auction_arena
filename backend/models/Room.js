const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    minlength: 6,
    maxlength: 6
  },
  hostId: {
    type: String,
    required: true
  },
  hostNickname: {
    type: String,
    default: 'Host'
  },
  settings: {
    initialMoney: { type: Number, default: 25000, min: 5000, max: 50000 },
    timerDuration: { type: Number, default: 30, min: 10, max: 60 },
    maxPlayers: { type: Number, default: 6, min: 2, max: 8 },
    totalCards: { type: Number, default: 15, min: 5, max: 30 }
  },
  players: [{
    socketId: String,
    odlSocketId: String,
    nickname: String,
    money: Number,
    ownedCards: [{
      id: Number,
      name: String,
      category: String,
      basePrice: Number,
      rating: Number,
      specialty: String,
      image: String,
      purchasePrice: Number
    }],
    totalSpent: { type: Number, default: 0 },
    isHost: { type: Boolean, default: false },
    isConnected: { type: Boolean, default: true },
    isReady: { type: Boolean, default: false },
    hasPassedCurrentRound: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ['waiting', 'playing', 'finished'],
    default: 'waiting'
  },
  currentCardIndex: { type: Number, default: 0 },
  auctionCards: [{ type: mongoose.Schema.Types.Mixed }],
  currentBid: {
    amount: { type: Number, default: 0 },
    bidderId: String,
    bidderName: String
  },
  bidHistory: [{
    cardId: Number,
    bidderId: String,
    bidderName: String,
    amount: Number,
    timestamp: { type: Date, default: Date.now }
  }],
  auctionResults: [{
    card: { type: mongoose.Schema.Types.Mixed },
    status: { type: String, enum: ['sold', 'unsold'] },
    winnerId: String,
    winnerName: String,
    finalPrice: Number,
    totalBids: Number
  }],
  chatMessages: [{
    senderId: String,
    senderName: String,
    message: String,
    type: { type: String, enum: ['chat', 'emoji', 'system'], default: 'chat' },
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

roomSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

roomSchema.index({ roomCode: 1 });
roomSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // Auto-delete after 24h

module.exports = mongoose.model('Room', roomSchema);
