'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { getSocket, connectSocket, disconnectSocket } from '@/lib/socket';
import type { ConnectionStatus } from '@/types';
import type { Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@/types';
import {
  getStoredRoomCode,
  getStoredNickname,
  getStoredPlayerId,
  setStoredPlayerId,
} from '@/lib/utils';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useSocket() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const socketRef = useRef<TypedSocket | null>(null);

  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;

    const onConnect = () => {
      setConnectionStatus('connected');
    };

    const onDisconnect = () => {
      setConnectionStatus('disconnected');
    };

    const onReconnectAttempt = () => {
      setConnectionStatus('reconnecting');
    };

    const onReconnect = () => {
      setConnectionStatus('connected');
      const code = getStoredRoomCode();
      const nickname = getStoredNickname();
      const previousPlayerId = getStoredPlayerId();
      if (code && nickname && previousPlayerId) {
        socket.emit(
          'room:rejoin',
          { code, nickname, previousPlayerId },
          (res) => {
            if (res?.success && res.playerId) {
              setStoredPlayerId(res.playerId);
            }
          }
        );
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.io.on('reconnect_attempt', onReconnectAttempt);
    socket.io.on('reconnect', onReconnect);

    if (socket.connected) {
      setConnectionStatus('connected');
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.io.off('reconnect_attempt', onReconnectAttempt);
      socket.io.off('reconnect', onReconnect);
    };
  }, []);

  const disconnect = useCallback(() => {
    disconnectSocket();
    socketRef.current = null;
    setConnectionStatus('disconnected');
  }, []);

  const emit = useCallback(<K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ) => {
    const socket = socketRef.current || getSocket();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.emit(event as any, ...args);
  }, []);

  const emitWithAck = useCallback(
    <K extends keyof ClientToServerEvents>(
      event: K,
      data: Parameters<ClientToServerEvents[K]>[0]
    ): Promise<unknown> => {
      const socket = socketRef.current || getSocket();
      return new Promise((resolve) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socket as any).emit(event, data, (response: unknown) => {
          resolve(response);
        });
      });
    },
    []
  );

  const on = useCallback(<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
  ) => {
    const socket = socketRef.current || getSocket();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on(event as any, handler as any);
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.off(event as any, handler as any);
    };
  }, []);

  return {
    socket: socketRef.current,
    connectionStatus,
    emit,
    emitWithAck,
    on,
    disconnect,
    isConnected: connectionStatus === 'connected',
    isReconnecting: connectionStatus === 'reconnecting',
  };
}
