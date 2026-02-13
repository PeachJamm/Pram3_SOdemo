"use strict";
// =====================================================
// PRAM3 ERP Core - Logger Utility
// 日志工具
// =====================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
/**
 * 简单日志服务
 */
class Logger {
    static log(level, message, traceId, source) {
        const logEntry = {
            level,
            message,
            timestamp: new Date(),
            traceId,
            source,
        };
        // 控制台输出
        console.log(`[${level}] [${logEntry.timestamp.toISOString()}] ${source ? `[${source}] ` : ''}${message}`);
        // 存储日志（实际应用中可发送到日志服务）
        this.logs.push(logEntry);
    }
    static info(message, traceId, source) {
        this.log('INFO', message, traceId, source);
    }
    static warn(message, traceId, source) {
        this.log('WARN', message, traceId, source);
    }
    static error(message, traceId, source) {
        this.log('ERROR', message, traceId, source);
    }
    static debug(message, traceId, source) {
        this.log('DEBUG', message, traceId, source);
    }
    static getLogs() {
        return [...this.logs];
    }
    static clearLogs() {
        this.logs = [];
    }
}
exports.Logger = Logger;
Logger.logs = [];
//# sourceMappingURL=logger.js.map