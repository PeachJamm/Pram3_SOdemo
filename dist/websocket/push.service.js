"use strict";
// =====================================================
// WebSocket Push Service
// WebSocket 实时推送服务
// =====================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushService = exports.PushService = void 0;
const socket_io_1 = require("socket.io");
const camunda8_client_1 = require("../orchestration/camunda8-client");
class PushService {
    constructor() {
        this.io = null;
        this.userSockets = new Map(); // userId -> socketId
        this.zeebeClient = new camunda8_client_1.Camunda8Client({
            gatewayAddress: 'localhost:26500',
            plaintext: true,
        });
    }
    /**
     * 初始化 WebSocket 服务
     */
    init(server) {
        this.io = new socket_io_1.Server(server, {
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
    setupSocketHandlers() {
        if (!this.io)
            return;
        this.io.on('connection', (socket) => {
            console.log(`[WebSocket] Client connected: ${socket.id}`);
            // 用户登录，绑定userId到socket
            socket.on('login', (userId) => {
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
    setupCamundaListeners() {
        // 监听 UserTask 创建
        this.zeebeClient.createWorker('websocket-notification-worker', async (job) => {
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
        }, { maxActiveJobs: 10 });
        console.log('[WebSocket] Camunda listeners registered');
    }
    /**
     * 推送给指定用户
     */
    pushToUser(userId, message) {
        if (!this.io)
            return;
        this.io.to(`user:${userId}`).emit('push', message);
        console.log(`[WebSocket] Pushed to user ${userId}:`, message.type);
    }
    /**
     * 广播给所有用户
     */
    broadcast(message) {
        if (!this.io)
            return;
        this.io.emit('broadcast', message);
    }
}
exports.PushService = PushService;
// 导出单例
exports.pushService = new PushService();
//# sourceMappingURL=push.service.js.map