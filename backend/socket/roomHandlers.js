const { validateRoomCode, validateNickname, validateRoomSettings, sanitizeString, checkRateLimit, DEFAULT_STARTING_MONEY } = require('../middleware/validation');
const actresses = require('../data/actresses');
const auctionEngine = require('../engine/AuctionEngine');
const {
  rooms,
  generateRoomCode,
  sanitizeRoomForClient,
  emitFullSync,
} = require('./store');
const {
  syncRoomPlayersFromEngine,
  sanitizeAuctionStateForClient,
  isSocketInRoom,
} = require('./shared');

function setupRoomHandlers(io, socket) {

  // CREATE ROOM
  socket.on('room:create', (data) => {
    try {
      const { nickname, settings } = data;

      if (!validateNickname(nickname)) {
        socket.emit('room:error', { message: 'Invalid nickname. Must be 1-20 characters.' });
        return;
      }

      const sanitizedNickname = sanitizeString(nickname);

      // Validate settings
      const roomSettings = {
        initialMoney: Math.round(Number(settings?.startingMoney) || DEFAULT_STARTING_MONEY),
        timerDuration: Math.round(Number(settings?.timerDuration) || 30),
        maxPlayers: Math.round(Number(settings?.maxPlayers) || 6),
        totalCards: actresses.length,
      };

      const errors = validateRoomSettings(roomSettings);
      if (errors.length > 0) {
        socket.emit('room:error', { message: errors.join(', ') });
        return;
      }

      let roomCode;
      do {
        roomCode = generateRoomCode();
      } while (rooms.has(roomCode));

      const hostPlayer = {
        socketId: socket.id,
        previousSocketId: null,
        nickname: sanitizedNickname,
        money: roomSettings.initialMoney,
        ownedCards: [],
        totalSpent: 0,
        isHost: true,
        isConnected: true,
        isReady: true,
        hasPassedCurrentRound: false,
        joinedAt: new Date()
      };

      const room = {
        roomCode,
        hostId: socket.id,
        hostNickname: sanitizedNickname,
        settings: roomSettings,
        players: [hostPlayer],
        status: 'waiting',
        chatMessages: [],
        currentCardIndex: 0,
        createdAt: new Date()
      };

      rooms.set(roomCode, room);
      socket.join(roomCode);
      socket.roomCode = roomCode;
      socket.playerNickname = sanitizedNickname;

      socket.emit('room:created', {
        room: sanitizeRoomForClient(room),
        playerId: socket.id
      });

      console.log(`🏠 Room ${roomCode} created by ${sanitizedNickname}`);
    } catch (err) {
      console.error('Create room error:', err);
      socket.emit('room:error', { message: 'Failed to create room.' });
    }
  });

  // JOIN ROOM
  socket.on('room:join', (data) => {
    try {
      const { code, nickname } = data;

      if (!validateRoomCode(code)) {
        socket.emit('room:error', { message: 'Invalid room code. Must be 6 alphanumeric characters.' });
        return;
      }

      if (!validateNickname(nickname)) {
        socket.emit('room:error', { message: 'Invalid nickname. Must be 1-20 characters.' });
        return;
      }

      const roomCode = code.toUpperCase();
      const room = rooms.get(roomCode);

      if (!room) {
        socket.emit('room:error', { message: 'Room not found. Check the room code and try again.' });
        return;
      }

      if (room.status !== 'waiting') {
        socket.emit('room:error', { message: 'Game already in progress. Cannot join now.' });
        return;
      }

      if (room.players.length >= room.settings.maxPlayers) {
        socket.emit('room:error', { message: 'Room is full.' });
        return;
      }

      const sanitizedNickname = sanitizeString(nickname);

      // Check for duplicate nickname
      const existingPlayer = room.players.find(p => p.nickname.toLowerCase() === sanitizedNickname.toLowerCase());
      if (existingPlayer) {
        if (!existingPlayer.isConnected) {
          existingPlayer.previousSocketId = existingPlayer.socketId;
          existingPlayer.socketId = socket.id;
          existingPlayer.isConnected = true;
          socket.join(roomCode);
          socket.roomCode = roomCode;
          socket.playerNickname = sanitizedNickname;

          socket.emit('room:joined', {
            room: sanitizeRoomForClient(room),
            playerId: socket.id
          });

          io.to(roomCode).emit('room:updated', {
            room: sanitizeRoomForClient(room)
          });
          return;
        } else {
          socket.emit('room:error', { message: 'Nickname already taken in this room.' });
          return;
        }
      }

      const newPlayer = {
        socketId: socket.id,
        previousSocketId: null,
        nickname: sanitizedNickname,
        money: room.settings.initialMoney,
        ownedCards: [],
        totalSpent: 0,
        isHost: false,
        isConnected: true,
        isReady: false,
        hasPassedCurrentRound: false,
        joinedAt: new Date()
      };

      room.players.push(newPlayer);
      socket.join(roomCode);
      socket.roomCode = roomCode;
      socket.playerNickname = sanitizedNickname;

      socket.emit('room:joined', {
        room: sanitizeRoomForClient(room),
        playerId: socket.id
      });

      io.to(roomCode).emit('room:player-joined', {
        player: sanitizePlayerForClient(newPlayer)
      });

      io.to(roomCode).emit('room:updated', {
        room: sanitizeRoomForClient(room)
      });

      console.log(`👤 ${sanitizedNickname} joined room ${roomCode}`);
    } catch (err) {
      console.error('Join room error:', err);
      socket.emit('room:error', { message: 'Failed to join room.' });
    }
  });

  // LEAVE ROOM
  socket.on('room:leave', (data) => {
    try {
      const { code } = data;
      const roomCode = code.toUpperCase();
      const room = rooms.get(roomCode);
      if (!room) return;

      const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
      if (playerIndex !== -1) {
        const leavingPlayer = room.players.splice(playerIndex, 1)[0];
        socket.leave(roomCode);
        socket.roomCode = null;

        io.to(roomCode).emit('room:player-left', {
          playerId: socket.id
        });

        // If host left, assign new host
        if (leavingPlayer.isHost && room.players.length > 0) {
          room.players[0].isHost = true;
          room.hostId = room.players[0].socketId;
          room.hostNickname = room.players[0].nickname;
        }

        if (room.players.length === 0) {
          rooms.delete(roomCode);
        } else {
          io.to(roomCode).emit('room:updated', {
            room: sanitizeRoomForClient(room)
          });
        }
      }
    } catch (err) {
      console.error('Leave room error:', err);
    }
  });

  // PLAYER READY
  socket.on('room:ready', (data) => {
    try {
      const { code, isReady } = data;
      const roomCode = code.toUpperCase();
      const room = rooms.get(roomCode);
      if (!room) return;

      const player = room.players.find(p => p.socketId === socket.id);
      if (player) {
        player.isReady = isReady;
        io.to(roomCode).emit('room:updated', {
          room: sanitizeRoomForClient(room)
        });
      }
    } catch (err) {
      console.error('Player ready error:', err);
    }
  });

  // KICK PLAYER (host only)
  socket.on('room:kick', (data) => {
    try {
      const { code, playerId } = data;
      const roomCode = code.toUpperCase();
      const room = rooms.get(roomCode);
      if (!room) return;

      if (room.hostId !== socket.id) {
        socket.emit('room:error', { message: 'Only the host can kick players.' });
        return;
      }

      const targetIndex = room.players.findIndex(p => p.socketId === playerId);
      if (targetIndex === -1) return;
      if (room.players[targetIndex].isHost) return;

      room.players.splice(targetIndex, 1);
      
      const targetSocket = io.sockets.sockets.get(playerId);
      if (targetSocket) {
        targetSocket.emit('room:error', { message: 'You have been kicked by the host.' });
        targetSocket.leave(roomCode);
        targetSocket.roomCode = null;
      }

      io.to(roomCode).emit('room:player-kicked', {
        playerId
      });

      io.to(roomCode).emit('room:updated', {
        room: sanitizeRoomForClient(room)
      });
    } catch (err) {
      console.error('Kick player error:', err);
    }
  });

  // REJOIN after disconnect (lobby or mid-auction)
  socket.on('room:rejoin', (data, callback) => {
    const ack = (payload) => {
      if (typeof callback === 'function') callback(payload);
    };

    try {
      if (!checkRateLimit(socket, 'room-rejoin')) {
        return ack({ success: false, message: 'Too many rejoin attempts.' });
      }

      const { code, nickname, previousPlayerId } = data || {};
      if (!validateRoomCode(code)) {
        return ack({ success: false, message: 'Invalid room code.' });
      }
      if (!validateNickname(nickname)) {
        return ack({ success: false, message: 'Invalid nickname.' });
      }

      const roomCode = code.toUpperCase();
      const room = rooms.get(roomCode);
      if (!room) {
        return ack({ success: false, message: 'Room not found.' });
      }

      const sanitizedNickname = sanitizeString(nickname);
      let player = room.players.find(
        (p) =>
          p.socketId === previousPlayerId ||
          p.previousSocketId === previousPlayerId ||
          p.nickname.toLowerCase() === sanitizedNickname.toLowerCase()
      );

      if (!player) {
        return ack({ success: false, message: 'Player not found in this room.' });
      }

      const oldSocketId = player.socketId;
      player.previousSocketId = oldSocketId;
      player.socketId = socket.id;
      player.isConnected = true;
      player.nickname = sanitizedNickname;

      if (room.hostId === oldSocketId) {
        room.hostId = socket.id;
        room.hostNickname = sanitizedNickname;
      }

      socket.join(roomCode);
      socket.roomCode = roomCode;
      socket.playerNickname = sanitizedNickname;

      if (room.status === 'playing') {
        const reconnectResult = auctionEngine.playerReconnect(
          roomCode,
          oldSocketId,
          socket.id
        );
        if (!reconnectResult.success) {
          console.warn('Engine reconnect:', reconnectResult.error);
        }
        syncRoomPlayersFromEngine(room, roomCode);
      }

      const response = {
        success: true,
        room: sanitizeRoomForClient(room),
        playerId: socket.id,
        auction:
          room.status === 'playing'
            ? sanitizeAuctionStateForClient(auctionEngine.getState(roomCode))
            : null,
        timer:
          room.status === 'playing'
            ? auctionEngine.getTimerSnapshot(roomCode)
            : null,
      };

      socket.emit('room:rejoined', response);
      io.to(roomCode).emit('room:updated', { room: sanitizeRoomForClient(room) });

      if (room.status === 'playing') {
        emitFullSync(io, socket, roomCode, room);
      }

      ack(response);
      console.log(`🔄 ${sanitizedNickname} rejoined room ${roomCode}`);
    } catch (err) {
      console.error('Rejoin error:', err);
      ack({ success: false, message: 'Failed to rejoin room.' });
    }
  });

  // SEND CHAT
  socket.on('chat:send', (data) => {
    try {
      const { code, message } = data;
      const roomCode = code.toUpperCase();
      const room = rooms.get(roomCode);
      if (!room) return;
      if (!isSocketInRoom(room, socket.id)) return;

      const sanitizedMessage = sanitizeString(message);
      if (!sanitizedMessage) return;
      if (!checkRateLimit(socket, 'send-chat')) return;

      const chatMsg = {
        id: Math.random().toString(36).substring(2, 9),
        playerId: socket.id,
        playerName: socket.playerNickname || 'Anonymous',
        message: sanitizedMessage,
        type: 'message',
        timestamp: Date.now()
      };

      room.chatMessages.push(chatMsg);
      if (room.chatMessages.length > 50) {
        room.chatMessages = room.chatMessages.slice(-50);
      }

      io.to(roomCode).emit('chat:message', chatMsg);
    } catch (err) {
      console.error('Chat error:', err);
    }
  });

}

module.exports = { setupRoomHandlers };
