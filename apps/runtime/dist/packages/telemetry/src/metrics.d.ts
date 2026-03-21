import { Counter, Histogram, Registry } from 'prom-client';
export declare const registry: Registry<"text/plain; version=0.0.4; charset=utf-8">;
export declare const webhookRequestsTotal: Counter<"status" | "bot_id">;
export declare const jobProcessedTotal: Counter<"status" | "queue">;
export declare const jobDurationSeconds: Histogram<"queue">;
export declare const outboundMessagesTotal: Counter<"status" | "bot_id">;
export declare const rateLimitHitsTotal: Counter<"bot_id" | "limiter_type">;
//# sourceMappingURL=metrics.d.ts.map