import { createServer } from 'http';
interface PushMessage {
    type: 'NEW_TASK' | 'TASK_COMPLETED' | 'PROCESS_COMPLETED' | 'ROLLBACK';
    data: any;
    timestamp: string;
}
export declare class PushService {
    private io;
    private zeebeClient;
    private userSockets;
    constructor();
    /**
     * 初始化 WebSocket 服务
     */
    init(server: ReturnType<typeof createServer>): void;
    /**
     * 设置 Socket.io 连接处理器
     */
    private setupSocketHandlers;
    /**
     * 设置 Camunda 监听器
     */
    private setupCamundaListeners;
    /**
     * 推送给指定用户
     */
    private pushToUser;
    /**
     * 广播给所有用户
     */
    broadcast(message: PushMessage): void;
}
export declare const pushService: PushService;
export {};
//# sourceMappingURL=push.service.d.ts.map