import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { Resource } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
export function initTracing(serviceName) {
    const endpoint = process.env['OTEL_EXPORTER_OTLP_ENDPOINT'];
    const config = {
        resource: new Resource({
            [ATTR_SERVICE_NAME]: serviceName,
        }),
    };
    if (endpoint) {
        config.traceExporter = new OTLPTraceExporter({ url: endpoint });
    }
    const sdk = new NodeSDK(config);
    sdk.start();
    return sdk;
}
//# sourceMappingURL=tracing.js.map