// =====================================================
// PRAM3 ERP Core - Global Type Declarations
// 全局类型声明
// =====================================================

declare global {
  interface Console {
    log(...args: unknown[]): void;
    error(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    info(...args: unknown[]): void;
  }
}

// 这样console就可以在Node.js环境中使用了
const _global = global as unknown as { console: Console };
_global.console = console;

export {};
