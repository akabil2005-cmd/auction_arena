const actresses = require('../data/actresses');
const {
  validateBidIncrement,
  getDefaultIncrement,
} = require('../config/economy');

function fisherYatesShuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

class AuctionEngine {
  constructor() {
    this.auctions = new Map();
    this.timers = new Map();
    this.actionQueues = new Map();
    this.timerMeta = new Map();
  }

  /**
   * Serialize all mutating operations per room (prevents bid/resolve races).
   */
  runExclusive(roomCode, fn) {
    if (!this.actionQueues.has(roomCode)) {
      this.actionQueues.set(roomCode, { running: false, queue: [] });
    }
    const q = this.actionQueues.get(roomCode);

    return new Promise((resolve) => {
      q.queue.push({ fn, resolve });
      this._drainQueue(roomCode);
    });
  }

  _drainQueue(roomCode) {
    const q = this.actionQueues.get(roomCode);
    if (!q || q.running || q.queue.length === 0) return;

    q.running = true;
    const { fn, resolve } = q.queue.shift();

    try {
      const result = fn();
      resolve(result);
    } catch (err) {
      resolve({ success: false, error: err.message || 'Auction engine error' });
    } finally {
      q.running = false;
      if (q.queue.length === 0) {
        this.actionQueues.delete(roomCode);
      } else {
        setImmediate(() => this._drainQueue(roomCode));
      }
    }
  }

  initAuction(roomCode, settings, players) {
    const selectedCards = fisherYatesShuffle(actresses);
    settings.totalCards = selectedCards.length;

    const playerStates = {};
    players.forEach((p) => {
      playerStates[p.socketId] = {
        socketId: p.socketId,
        nickname: p.nickname,
        money: settings.initialMoney,
        ownedCards: [],
        totalSpent: 0,
        isHost: p.isHost,
        isConnected: true,
        hasPassedCurrentRound: false,
      };
    });

    const auctionState = {
      roomCode,
      settings,
      cards: selectedCards,
      currentCardIndex: 0,
      currentCard: selectedCards[0],
      currentBid: {
        amount: selectedCards[0].basePrice,
        bidderId: null,
        bidderName: null,
      },
      players: playerStates,
      passedPlayers: new Set(),
      bidHistory: [],
      auctionResults: [],
      timeRemaining: settings.timerDuration,
      timerEndsAt: Date.now() + settings.timerDuration * 1000,
      timerGeneration: 1,
      status: 'active',
      totalCards: selectedCards.length,
      roundBids: [],
      isResolving: false,
      transitionId: 0,
      transitionTimer: null,
    };

    this.auctions.set(roomCode, auctionState);
    return auctionState;
  }

  getState(roomCode) {
    return this.auctions.get(roomCode);
  }

  getTimerSnapshot(roomCode) {
    const state = this.auctions.get(roomCode);
    if (!state) return null;
    return this._computeTimer(state);
  }

  _computeTimer(state) {
    const remaining = Math.max(
      0,
      Math.ceil((state.timerEndsAt - Date.now()) / 1000)
    );
    state.timeRemaining = remaining;
    return {
      timeRemaining: remaining,
      timerEndsAt: state.timerEndsAt,
      timerGeneration: state.timerGeneration,
    };
  }

  _resetTimer(state) {
    state.timerGeneration += 1;
    state.timerEndsAt = Date.now() + state.settings.timerDuration * 1000;
    state.timeRemaining = state.settings.timerDuration;
    return state.timerGeneration;
  }

  placeBid(roomCode, socketId, increment) {
    const state = this.auctions.get(roomCode);
    if (!state) return { success: false, error: 'Auction not found' };
    if (state.status === 'paused') {
      return { success: false, error: 'Auction is paused' };
    }
    if (state.status !== 'active' || state.isResolving) {
      return { success: false, error: 'Auction is not accepting bids' };
    }

    const player = state.players[socketId];
    if (!player) return { success: false, error: 'Player not found' };
    if (!player.isConnected) return { success: false, error: 'Player is disconnected' };
    if (state.passedPlayers.has(socketId)) {
      return { success: false, error: 'You have already passed on this card' };
    }

    if (!validateBidIncrement(increment, state.currentBid.amount)) {
      return { success: false, error: 'Invalid bid increment for current price tier' };
    }

    const newBidAmount = state.currentBid.amount + increment;

    if (newBidAmount > player.money) {
      return { success: false, error: 'Not enough money for this bid' };
    }

    if (state.currentBid.bidderId === socketId) {
      return { success: false, error: 'You are already the highest bidder' };
    }

    state.currentBid = {
      amount: newBidAmount,
      bidderId: socketId,
      bidderName: player.nickname,
    };

    const bidEntry = {
      bidderId: socketId,
      bidderName: player.nickname,
      amount: newBidAmount,
      increment,
      timestamp: Date.now(),
    };

    state.bidHistory.push(bidEntry);
    state.roundBids.push(bidEntry);

    const timerGeneration = this._resetTimer(state);
    const timer = this._computeTimer(state);

    return {
      success: true,
      bid: state.currentBid,
      bidEntry,
      timer,
      timerGeneration,
    };
  }

  passCard(roomCode, socketId) {
    const state = this.auctions.get(roomCode);
    if (!state) return { success: false, error: 'Auction not found' };
    if (state.status !== 'active' || state.isResolving) {
      return { success: false, error: 'Auction is not active' };
    }

    const player = state.players[socketId];
    if (!player) return { success: false, error: 'Player not found' };
    if (state.passedPlayers.has(socketId)) {
      return { success: false, error: 'Already passed' };
    }

    state.passedPlayers.add(socketId);
    player.hasPassedCurrentRound = true;

    const activePlayers = Object.values(state.players).filter((p) => p.isConnected);
    const allPassed = activePlayers.every((p) => state.passedPlayers.has(p.socketId));

    const nonPassedPlayers = activePlayers.filter(
      (p) => !state.passedPlayers.has(p.socketId)
    );
    const onlyBidderRemains =
      nonPassedPlayers.length === 1 &&
      state.currentBid.bidderId &&
      nonPassedPlayers[0].socketId === state.currentBid.bidderId;

    if (allPassed || onlyBidderRemains) {
      return this.resolveCard(roomCode);
    }

    return {
      success: true,
      allPassed: false,
      passedPlayers: Array.from(state.passedPlayers),
      passedPlayerName: player.nickname,
    };
  }

  timerTick(roomCode, expectedGeneration) {
    const state = this.auctions.get(roomCode);
    if (!state || state.isResolving) return null;
    if (state.status === 'paused') {
      return { timeRemaining: state.timeRemaining, resolved: false, paused: true };
    }
    if (state.status !== 'active') return null;
    if (expectedGeneration != null && state.timerGeneration !== expectedGeneration) {
      return null;
    }

    const timer = this._computeTimer(state);

    if (timer.timeRemaining <= 0) {
      return this.resolveCard(roomCode);
    }

    return { ...timer, resolved: false };
  }

  /**
   * Idempotent card resolution — safe against timer + pass + disconnect racing.
   */
  resolveCard(roomCode) {
    const state = this.auctions.get(roomCode);
    if (!state) return { success: false, error: 'Auction not found' };

    if (state.status !== 'active') {
      return {
        success: false,
        error: 'Card already resolved',
        alreadyResolved: true,
        status: state.status,
      };
    }

    if (state.isResolving) {
      return { success: false, error: 'Resolution in progress', alreadyResolved: true };
    }

    state.isResolving = true;
    state.status = 'resolving';
    this.stopTimer(roomCode);

    const card = state.currentCard;
    let result;

    if (state.currentBid.bidderId) {
      const winner = state.players[state.currentBid.bidderId];
      const finalPrice = state.currentBid.amount;

      if (!winner) {
        result = {
          card,
          status: 'unsold',
          winnerId: null,
          winnerName: null,
          finalPrice: 0,
          totalBids: state.roundBids.length,
        };
      } else if (winner.money < finalPrice) {
        result = {
          card,
          status: 'unsold',
          winnerId: null,
          winnerName: null,
          finalPrice: 0,
          totalBids: state.roundBids.length,
          reason: 'insufficient_funds',
        };
      } else {
        winner.money = Math.max(0, winner.money - finalPrice);
        winner.totalSpent += finalPrice;
        winner.ownedCards.push({
          ...card,
          purchasePrice: finalPrice,
        });

        result = {
          card,
          status: 'sold',
          winnerId: state.currentBid.bidderId,
          winnerName: state.currentBid.bidderName,
          finalPrice,
          totalBids: state.roundBids.length,
        };
      }
    } else {
      result = {
        card,
        status: 'unsold',
        winnerId: null,
        winnerName: null,
        finalPrice: 0,
        totalBids: 0,
      };
    }

    state.auctionResults.push(result);
    state.status = result.status === 'sold' ? 'card-sold' : 'card-unsold';
    state.isResolving = false;

    return {
      success: true,
      resolved: true,
      result,
      players: Object.values(state.players).map((p) => ({
        socketId: p.socketId,
        nickname: p.nickname,
        money: p.money,
        totalSpent: p.totalSpent,
        ownedCards: p.ownedCards,
        isConnected: p.isConnected,
      })),
    };
  }

  scheduleNextCard(roomCode, delayMs, onFire) {
    const state = this.auctions.get(roomCode);
    if (!state) return null;

    if (state.transitionTimer) {
      clearTimeout(state.transitionTimer);
    }

    state.transitionId += 1;
    const transitionId = state.transitionId;

    state.transitionTimer = setTimeout(() => {
      const current = this.auctions.get(roomCode);
      if (!current || current.transitionId !== transitionId) return;
      current.transitionTimer = null;
      onFire();
    }, delayMs);

    return transitionId;
  }

  nextCard(roomCode) {
    const state = this.auctions.get(roomCode);
    if (!state) return { success: false, error: 'Auction not found' };

    if (state.status !== 'card-sold' && state.status !== 'card-unsold') {
      return { success: false, error: 'Cannot advance — card not settled' };
    }

    state.currentCardIndex++;

    if (state.currentCardIndex >= state.cards.length) {
      state.status = 'finished';
      return {
        success: true,
        finished: true,
        results: this.getFinalResults(roomCode),
      };
    }

    state.currentCard = state.cards[state.currentCardIndex];
    state.currentBid = {
      amount: state.currentCard.basePrice,
      bidderId: null,
      bidderName: null,
    };
    state.passedPlayers.clear();
    state.roundBids = [];
    state.isResolving = false;
    this._resetTimer(state);

    Object.values(state.players).forEach((p) => {
      p.hasPassedCurrentRound = false;
    });

    state.status = 'active';

    const timer = this._computeTimer(state);

    return {
      success: true,
      finished: false,
      currentCard: state.currentCard,
      currentCardIndex: state.currentCardIndex,
      totalCards: state.totalCards,
      currentBid: state.currentBid,
      timer,
    };
  }

  getFinalResults(roomCode) {
    const state = this.auctions.get(roomCode);
    if (!state) return null;

    const players = Object.values(state.players)
      .map((p) => ({
        socketId: p.socketId,
        nickname: p.nickname,
        money: p.money,
        ownedCards: p.ownedCards,
        totalSpent: p.totalSpent,
        cardsCount: p.ownedCards.length,
        isHost: p.isHost,
        highestPurchase:
          p.ownedCards.length > 0
            ? Math.max(...p.ownedCards.map((c) => c.purchasePrice))
            : 0,
      }))
      .sort(
        (a, b) =>
          b.cardsCount - a.cardsCount ||
          a.totalSpent - b.totalSpent ||
          b.money - a.money
      );

    players.forEach((p, i) => {
      p.rank = i + 1;
    });

    const unsoldCards = state.auctionResults
      .filter((r) => r.status === 'unsold')
      .map((r) => r.card);

    return {
      players,
      auctionResults: state.auctionResults,
      unsoldCards,
      totalCardsAuctioned: state.auctionResults.length,
      totalCardsSold: state.auctionResults.filter((r) => r.status === 'sold').length,
      totalCardsUnsold: unsoldCards.length,
    };
  }

  playerDisconnect(roomCode, socketId) {
    const state = this.auctions.get(roomCode);
    if (!state) return null;

    const player = state.players[socketId];
    if (player) {
      player.isConnected = false;
    }

    const activePlayers = Object.values(state.players).filter((p) => p.isConnected);
    if (activePlayers.length === 0) {
      this.stopTimer(roomCode);
      state.status = 'finished';
      return { finished: true };
    }

    if (state.status === 'active' && !state.isResolving) {
      const allPassed = activePlayers.every((p) =>
        state.passedPlayers.has(p.socketId)
      );
      if (allPassed) {
        return { ...this.resolveCard(roomCode), disconnected: true };
      }
    }

    return { disconnected: true, playerName: player?.nickname };
  }

  playerReconnect(roomCode, oldSocketId, newSocketId) {
    const state = this.auctions.get(roomCode);
    if (!state) return { success: false, error: 'No active auction' };

    const player =
      state.players[oldSocketId] ||
      Object.values(state.players).find(
        (p) => p.socketId === oldSocketId || p.nickname === oldSocketId
      );

    if (!player) return { success: false, error: 'Player not found in auction' };

    const prevId = player.socketId;
    player.isConnected = true;
    player.socketId = newSocketId;
    state.players[newSocketId] = player;
    if (prevId !== newSocketId) delete state.players[prevId];

    if (state.passedPlayers.has(prevId)) {
      state.passedPlayers.delete(prevId);
      state.passedPlayers.add(newSocketId);
    }

    if (state.currentBid.bidderId === prevId) {
      state.currentBid.bidderId = newSocketId;
    }

    state.roundBids.forEach((b) => {
      if (b.bidderId === prevId) b.bidderId = newSocketId;
    });

    return { success: true, player, previousSocketId: prevId };
  }

  cleanup(roomCode) {
    const state = this.auctions.get(roomCode);
    if (state?.transitionTimer) {
      clearTimeout(state.transitionTimer);
    }
    this.auctions.delete(roomCode);
    this.stopTimer(roomCode);
    this.actionQueues.delete(roomCode);
    this.timerMeta.delete(roomCode);
  }

  startTimer(roomCode, onTick) {
    this.stopTimer(roomCode);

    const state = this.auctions.get(roomCode);
    if (!state) return;

    const generation = state.timerGeneration;
    this.timerMeta.set(roomCode, { generation });

    const interval = setInterval(() => {
      const meta = this.timerMeta.get(roomCode);
      const current = this.auctions.get(roomCode);
      if (!meta || !current || meta.generation !== current.timerGeneration) {
        clearInterval(interval);
        this.timers.delete(roomCode);
        return;
      }

      const result = this.timerTick(roomCode, generation);
      if (!result) {
        clearInterval(interval);
        this.timers.delete(roomCode);
        return;
      }
      onTick(result);
    }, 1000);

    this.timers.set(roomCode, interval);
  }

  stopTimer(roomCode) {
    if (this.timers.has(roomCode)) {
      clearInterval(this.timers.get(roomCode));
      this.timers.delete(roomCode);
    }
    this.timerMeta.delete(roomCode);
  }

  resetGame(roomCode, settings, players) {
    this.cleanup(roomCode);
    return this.initAuction(roomCode, settings, players);
  }

  pauseAuction(roomCode) {
    const state = this.auctions.get(roomCode);
    if (!state) return { success: false, error: 'Auction not found' };
    if (state.status !== 'active') return { success: false, error: 'Cannot pause now' };
    state.status = 'paused';
    this.stopTimer(roomCode);
    return { success: true, status: 'paused', timeRemaining: state.timeRemaining };
  }

  resumeAuction(roomCode) {
    const state = this.auctions.get(roomCode);
    if (!state) return { success: false, error: 'Auction not found' };
    if (state.status !== 'paused') return { success: false, error: 'Auction is not paused' };
    state.status = 'active';
    this._resetTimer(state);
    return { success: true, status: 'active', timer: this._computeTimer(state) };
  }

  skipCurrentCard(roomCode) {
    const state = this.auctions.get(roomCode);
    if (!state) return { success: false, error: 'Auction not found' };
    if (!['active', 'paused'].includes(state.status)) {
      return { success: false, error: 'Cannot skip this card' };
    }
    if (state.status === 'paused') state.status = 'active';
    const resolved = this.resolveCard(roomCode);
    if (!resolved.success && !resolved.alreadyResolved) return resolved;
    return { success: true, resolved: true, ...resolved, skip: true };
  }

  endAuctionEarly(roomCode) {
    const state = this.auctions.get(roomCode);
    if (!state) return { success: false, error: 'Auction not found' };
    if (state.status === 'finished') {
      return { success: true, finished: true, results: this.getFinalResults(roomCode) };
    }
    this.stopTimer(roomCode);
    if (state.transitionTimer) {
      clearTimeout(state.transitionTimer);
      state.transitionTimer = null;
    }
    state.status = 'finished';
    return {
      success: true,
      finished: true,
      results: this.getFinalResults(roomCode),
    };
  }
}

module.exports = new AuctionEngine();
