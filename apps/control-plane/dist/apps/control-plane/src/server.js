import { initTracing } from '@telegraph/telemetry';
import { buildApp } from './app.js';
const sdk = initTracing('control-plane');
const port = Number(process.env['PORT'] ?? 3001);
const app = await buildApp();
await app.listen({ port, host: '0.0.0.0' });
async function shutdown() {
    app.log.info('Shutting down...');
    await app.close();
    await sdk.shutdown();
    process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
//# sourceMappingURL=server.js.map