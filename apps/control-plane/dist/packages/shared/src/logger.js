import pino from 'pino';
export function createLogger(name, opts) {
    const level = process.env['LOG_LEVEL'] ?? 'info';
    const logger = pino({ name, level });
    const bindings = {};
    if (opts?.tenantId !== undefined)
        bindings['tenantId'] = opts.tenantId;
    if (opts?.botId !== undefined)
        bindings['botId'] = opts.botId;
    return Object.keys(bindings).length > 0 ? logger.child(bindings) : logger;
}
//# sourceMappingURL=logger.js.map