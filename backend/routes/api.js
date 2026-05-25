const express = require('express');
const { rooms } = require('../socket/store');

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    activeRooms: rooms.size
  });
});

// Get room info
router.get('/room/:code', (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const room = rooms.get(code);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json({
      exists: true,
      room: {
        roomCode: room.roomCode,
        status: room.status,
        playerCount: room.players.filter(p => p.isConnected).length,
        maxPlayers: room.settings.maxPlayers,
        hostNickname: room.hostNickname,
        settings: room.settings
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Validate room code
router.post('/room/validate', (req, res) => {
  try {
    const { roomCode } = req.body;
    if (!roomCode || typeof roomCode !== 'string') {
      return res.status(400).json({ valid: false, error: 'Room code is required' });
    }

    const code = roomCode.toUpperCase();
    const room = rooms.get(code);

    if (!room) {
      return res.status(404).json({ valid: false, error: 'Room not found' });
    }

    if (room.status !== 'waiting') {
      return res.json({ valid: false, error: 'Game already in progress' });
    }

    const connectedPlayers = room.players.filter(p => p.isConnected);
    if (connectedPlayers.length >= room.settings.maxPlayers) {
      return res.json({ valid: false, error: 'Room is full' });
    }

    res.json({
      valid: true,
      roomCode: code,
      playerCount: connectedPlayers.length,
      maxPlayers: room.settings.maxPlayers,
      hostNickname: room.hostNickname
    });
  } catch (err) {
    res.status(500).json({ valid: false, error: 'Server error' });
  }
});

// Get active rooms count (for landing page stats)
router.get('/stats', (req, res) => {
  let totalPlayers = 0;
  let activeGames = 0;
  rooms.forEach(room => {
    totalPlayers += room.players.filter(p => p.isConnected).length;
    if (room.status === 'playing') activeGames++;
  });

  res.json({
    activeRooms: rooms.size,
    activeGames,
    totalPlayers
  });
});

module.exports = router;
