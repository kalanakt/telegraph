import pino from 'pino';
export interface LoggerOptions {
    tenantId?: string;
    botId?: string;
}
export declare function createLogger(name: string, opts?: LoggerOptions): pino.Logger;
//# sourceMappingURL=logger.d.ts.map