// =====================================================
// WebSocket Hook
// WebSocket 实时推送 Hook
// =====================================================

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface PushMessage {
  type: 'NEW_TASK' | 'TASK_COMPLETED' | 'PROCESS_COMPLETED' | 'ROLLBACK';
  data: any;
  timestamp: string;
}

export function useWebSocket(userId: string | null) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    // 创建连接
    const socket = io('http://localhost:3001', {
      transports: ['websocket'],
    });

    socketRef.current = socket;

    // 连接成功
    socket.on('connect', () => {
      console.log('[WebSocket] Connected:', socket.id);
      // 发送登录消息
      socket.emit('login', userId);
    });

    // 断开连接
    socket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected');
    });

    // 清理
    return () => {
      socket.disconnect();
    };
  }, [userId]);

  // 监听推送消息
  const onPush = useCallback((callback: (message: PushMessage) => void) => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.on('push', callback);

    return () => {
      socket.off('push', callback);
    };
  }, []);

  return { onPush };
}
