// =====================================================
// WebSocket Push Service
// WebSocket 实时推送服务
// =====================================================

import { Server } from 'socket.io';
import { createServer } from 'http';
import { Camunda8Client } from '../orchestration/camunda8-client';

interface PushMessage {
  type: 'NEW_TASK' | 'TASK_COMPLETED' | 'PROCESS_COMPLETED' | 'ROLLBACK';
  data: any;
  timestamp: string;
}

export class PushService {
  private io: Server | null = null;
  private zeebeClient: Camunda8Client;
  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  constructor() {
    this.zeebeClient = new Camunda8Client({
      gatewayAddress: 'localhost:26500',
      plaintext: true,
    });
  }

  /**
   * 初始化 WebSocket 服务
   */
  init(server: ReturnType<typeof createServer>): void {
    this.io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.setupSocketHandlers();
    this.setupCamundaListeners();

    console.log('[WebSocket] Push service initialized');
  }

  /**
   * 设置 Socket.io 连接处理器
   */
  private setupSocketHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      console.log(`[WebSocket] Client connected: ${socket.id}`);

      // 用户登录，绑定userId到socket
      socket.on('login', (userId: string) => {
        this.userSockets.set(userId, socket.id);
        socket.join(`user:${userId}`);
        console.log(`[WebSocket] User ${userId} logged in on socket ${socket.id}`);
      });

      // 断开连接
      socket.on('disconnect', () => {
        // 清理userSockets
        for (const [userId, socketId] of this.userSockets.entries()) {
          if (socketId === socket.id) {
            this.userSockets.delete(userId);
            console.log(`[WebSocket] User ${userId} disconnected`);
            break;
          }
        }
      });
    });
  }

  /**
   * 设置 Camunda 监听器
   */
  private setupCamundaListeners(): void {
    // 监听 UserTask 创建
    this.zeebeClient.createWorker(
      'websocket-notification-worker',
      async (job) => {
        const { assignee, orderId, orderNumber } = job.variables;

        // 推送新任务通知
        if (assignee) {
          this.pushToUser(assignee, {
            type: 'NEW_TASK',
            data: {
              taskId: job.key,
              taskType: job.type,
              orderId,
              orderNumber,
            },
            timestamp: new Date().toISOString(),
          });
        }

        return job.complete();
      },
      { maxActiveJobs: 10 }
    );

    console.log('[WebSocket] Camunda listeners registered');
  }

  /**
   * 推送给指定用户
   */
  private pushToUser(userId: string, message: PushMessage): void {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit('push', message);
    console.log(`[WebSocket] Pushed to user ${userId}:`, message.type);
  }

  /**
   * 广播给所有用户
   */
  broadcast(message: PushMessage): void {
    if (!this.io) return;
    this.io.emit('broadcast', message);
  }
}

// 导出单例
export const pushService = new PushService();
