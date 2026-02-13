type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
interface LogMessage {
    level: LogLevel;
    message: string;
    timestamp: Date;
    traceId?: string;
    source?: string;
}
/**
 * 简单日志服务
 */
export declare class Logger {
    private static logs;
    private static log;
    static info(message: string, traceId?: string, source?: string): void;
    static warn(message: string, traceId?: string, source?: string): void;
    static error(message: string, traceId?: string, source?: string): void;
    static debug(message: string, traceId?: string, source?: string): void;
    static getLogs(): LogMessage[];
    static clearLogs(): void;
}
export {};
//# sourceMappingURL=logger.d.ts.map