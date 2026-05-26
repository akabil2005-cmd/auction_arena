const { Server } = require('socket.io');
const { setupRoomHandlers } = require('./roomHandlers');
const { setupAuctionHandlers } = require('./auctionHandlers');
const { handleSocketDisconnect } = require('./disconnectHandler');
const { isOriginAllowed } = require('../config/cors');

function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS blocked origin: ${origin}`));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log(`🔗 Client connected: ${socket.id}`);

    setupRoomHandlers(io, socket);
    setupAuctionHandlers(io, socket);

    socket.on('ping-server', () => {
      socket.emit('pong-server', { timestamp: Date.now() });
    });

    socket.on('disconnect', () => {
      try {
        handleSocketDisconnect(io, socket);
      } catch (err) {
        console.error('Unified disconnect error:', err);
      }
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  setInterval(() => {
    const count = io.engine.clientsCount;
    if (count > 0) {
      console.log(`📊 Active connections: ${count}`);
    }
  }, 60000);

  return io;
}

module.exports = initializeSocket;
