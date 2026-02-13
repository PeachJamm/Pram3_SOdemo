// =====================================================
// PRAM3 ERP Core - Logger Utility
// 日志工具
// =====================================================

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
export class Logger {
  private static logs: LogMessage[] = [];

  private static log(level: LogLevel, message: string, traceId?: string, source?: string): void {
    const logEntry: LogMessage = {
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

  static info(message: string, traceId?: string, source?: string): void {
    this.log('INFO', message, traceId, source);
  }

  static warn(message: string, traceId?: string, source?: string): void {
    this.log('WARN', message, traceId, source);
  }

  static error(message: string, traceId?: string, source?: string): void {
    this.log('ERROR', message, traceId, source);
  }

  static debug(message: string, traceId?: string, source?: string): void {
    this.log('DEBUG', message, traceId, source);
  }

  static getLogs(): LogMessage[] {
    return [...this.logs];
  }

  static clearLogs(): void {
    this.logs = [];
  }
}
