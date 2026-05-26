'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';
import type { Room, Player, ChatMessage, RoomSettings, Toast } from '@/types';
import {
  setStoredPlayerId,
  setStoredNickname,
  setStoredRoomCode,
  getStoredNickname,
  getStoredPlayerId,
  getStoredRoomCode,
  generateId,
} from '@/lib/utils';

export function useRoom(roomCode?: string) {
  const { emit, on, connectionStatus, isConnected } = useSocket();
  const [room, setRoom] = useState<Room | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const rejoinAttemptedRef = useRef(false);

  // Restore room state after navigation (e.g. home → /room/[code]) or refresh
  useEffect(() => {
    if (!roomCode || room) return;
    if (!isConnected || rejoinAttemptedRef.current) return;

    const nickname = getStoredNickname();
    const previousPlayerId = getStoredPlayerId();
    const storedCode = getStoredRoomCode();

    if (
      nickname &&
      previousPlayerId &&
      storedCode &&
      storedCode.toUpperCase() === roomCode.toUpperCase()
    ) {
      rejoinAttemptedRef.current = true;
      setIsLoading(true);
      emit('room:rejoin', { code: roomCode, nickname, previousPlayerId });
    }
  }, [roomCode, room, isConnected, emit]);

  useEffect(() => {
    if (room) {
      rejoinAttemptedRef.current = false;
    }
  }, [room]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const toast: Toast = { id: generateId(), message, type, duration: 4000 };
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, toast.duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Socket event listeners
  useEffect(() => {
    const cleanups: (() => void)[] = [];

    cleanups.push(
      on('room:created', ({ room: r, playerId: pid }) => {
        setRoom(r);
        setPlayerId(pid);
        setStoredPlayerId(pid);
        setStoredRoomCode(r.code);
        setIsLoading(false);
        addToast('Room created successfully!', 'success');
      })
    );

    cleanups.push(
      on('room:joined', ({ room: r, playerId: pid }) => {
        setRoom(r);
        setPlayerId(pid);
        setStoredPlayerId(pid);
        setStoredRoomCode(r.code);
        setIsLoading(false);
        addToast('Joined room successfully!', 'success');
      })
    );

    cleanups.push(
      on('room:rejoined', ({ room: r, playerId: pid, success, message }) => {
        if (!success) {
          if (message) addToast(message, 'error');
          return;
        }
        setRoom(r);
        setPlayerId(pid);
        setStoredPlayerId(pid);
        setStoredRoomCode(r.code);
        setIsLoading(false);
        addToast('Reconnected to room', 'success');
      })
    );

    cleanups.push(
      on('room:updated', ({ room: r }) => {
        setRoom(r);
      })
    );

    cleanups.push(
      on('room:player-joined', ({ player }) => {
        setRoom((prev) => {
          if (!prev) return null;
          const exists = prev.players.find((p) => p.id === player.id);
          if (exists) {
            return {
              ...prev,
              players: prev.players.map((p) => (p.id === player.id ? player : p)),
            };
          }
          return { ...prev, players: [...prev.players, player] };
        });
        addToast(`${player.nickname} joined the room`, 'info');
      })
    );

    cleanups.push(
      on('room:player-left', ({ playerId: pid }) => {
        setRoom((prev) => {
          if (!prev) return null;
          const leavingPlayer = prev.players.find((p) => p.id === pid);
          if (leavingPlayer) {
            addToast(`${leavingPlayer.nickname} left the room`, 'warning');
          }
          return { ...prev, players: prev.players.filter((p) => p.id !== pid) };
        });
      })
    );

    cleanups.push(
      on('room:player-kicked', ({ playerId: pid }) => {
        if (pid === playerId) {
          addToast('You have been kicked from the room', 'error');
          setRoom(null);
        } else {
          setRoom((prev) => {
            if (!prev) return null;
            const kickedPlayer = prev.players.find((p) => p.id === pid);
            if (kickedPlayer) {
              addToast(`${kickedPlayer.nickname} was kicked`, 'warning');
            }
            return { ...prev, players: prev.players.filter((p) => p.id !== pid) };
          });
        }
      })
    );

    cleanups.push(
      on('game:reset', ({ room: r }) => {
        setRoom(r);
        addToast('Arena reset — return to lobby', 'info');
      })
    );

    cleanups.push(
      on('room:error', ({ message }) => {
        addToast(message, 'error');
        setIsLoading(false);
      })
    );

    cleanups.push(
      on('chat:message', (msg) => {
        setChatMessages((prev) => [...prev, msg]);
      })
    );

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [on, playerId, addToast]);

  const createRoom = useCallback(
    (settings: RoomSettings, nickname: string) => {
      setIsLoading(true);
      setStoredNickname(nickname);
      const payload = {
        settings: {
          ...settings,
          startingMoney: Math.round(settings.startingMoney),
        },
        nickname,
      };
      console.log('ROOM CREATE PAYLOAD', payload);
      emit('room:create', payload);
    },
    [emit]
  );

  const joinRoom = useCallback(
    (code: string, nickname: string) => {
      setIsLoading(true);
      setStoredNickname(nickname);
      emit('room:join', { code: code.toUpperCase(), nickname });
    },
    [emit]
  );

  const leaveRoom = useCallback(
    (code: string) => {
      emit('room:leave', { code });
      setRoom(null);
    },
    [emit]
  );

  const toggleReady = useCallback(
    (code: string, isReady: boolean) => {
      emit('room:ready', { code, isReady });
    },
    [emit]
  );

  const kickPlayer = useCallback(
    (code: string, targetPlayerId: string) => {
      emit('room:kick', { code, playerId: targetPlayerId });
    },
    [emit]
  );

  const startGame = useCallback(
    (code: string) => {
      emit('room:start', { code });
    },
    [emit]
  );

  const sendChatMessage = useCallback(
    (code: string, message: string) => {
      emit('chat:send', { code, message });
    },
    [emit]
  );

  const currentPlayer: Player | null =
    room && playerId ? room.players.find((p) => p.id === playerId) || null : null;

  const isHost = currentPlayer?.isHost || false;

  return {
    room,
    playerId,
    currentPlayer,
    isHost,
    chatMessages,
    toasts,
    isLoading,
    connectionStatus,
    isConnected,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleReady,
    kickPlayer,
    startGame,
    sendChatMessage,
    addToast,
    removeToast,
  };
}
