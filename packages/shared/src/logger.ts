import pino from 'pino';

export interface LoggerOptions {
  tenantId?: string;
  botId?: string;
}

export function createLogger(
  name: string,
  opts?: LoggerOptions,
): pino.Logger {
  const logger = pino({ name });

  const bindings: Record<string, string> = {};
  if (opts?.tenantId !== undefined) bindings['tenantId'] = opts.tenantId;
  if (opts?.botId !== undefined) bindings['botId'] = opts.botId;

  return Object.keys(bindings).length > 0 ? logger.child(bindings) : logger;
}
