import { collectDefaultMetrics, Counter, Histogram, Registry } from 'prom-client';

export const registry = new Registry();
collectDefaultMetrics({ register: registry });

export const webhookRequestsTotal = new Counter({
  name: 'webhook_requests_total',
  help: 'Total webhook requests received',
  labelNames: ['bot_id', 'status'] as const,
  registers: [registry],
});

export const jobProcessedTotal = new Counter({
  name: 'job_processed_total',
  help: 'Total jobs processed',
  labelNames: ['queue', 'status'] as const,
  registers: [registry],
});

export const jobDurationSeconds = new Histogram({
  name: 'job_duration_seconds',
  help: 'Job processing duration in seconds',
  labelNames: ['queue'] as const,
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5, 10, 30],
  registers: [registry],
});

export const outboundMessagesTotal = new Counter({
  name: 'outbound_messages_total',
  help: 'Total outbound Telegram messages',
  labelNames: ['bot_id', 'status'] as const,
  registers: [registry],
});

export const rateLimitHitsTotal = new Counter({
  name: 'rate_limit_hits_total',
  help: 'Total rate limit hits',
  labelNames: ['bot_id', 'limiter_type'] as const,
  registers: [registry],
});
