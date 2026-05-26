require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');
const initializeSocket = require('./socket');
const apiRoutes = require('./routes/api');

const app = express();
const server = http.createServer(app);

const { isOriginAllowed } = require('./config/cors');

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked origin: ${origin}`));
      }
    },
    credentials: true,
  })
);
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Auction Arena Backend',
    version: '1.0.0',
    status: 'running',
    docs: '/api/health'
  });
});

// Initialize Socket.IO
const io = initializeSocket(server);

// Connect to MongoDB (non-blocking)
connectDB();

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║       🎬 AUCTION ARENA BACKEND 🎬        ║
  ║                                           ║
  ║   Server running on port ${PORT}            ║
  ║   Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}  ║
  ║   API Health: http://localhost:${PORT}/api/health ║
  ╚═══════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\\n🛑 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\\n🛑 SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

module.exports = { app, server, io };
