function requireEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}
export function loadConfig() {
    const runMode = (process.env['RUN_MODE'] ?? 'all');
    if (!['server', 'worker', 'all'].includes(runMode)) {
        throw new Error(`Invalid RUN_MODE: ${runMode}. Must be server, worker, or all`);
    }
    const openaiApiKey = process.env['OPENAI_API_KEY'] ?? '';
    const openaiBaseUrl = process.env['OPENAI_BASE_URL'] ?? 'https://api.openai.com';
    // Only validate AI config when workers are enabled
    if (runMode !== 'server' && !openaiApiKey) {
        console.warn('OPENAI_API_KEY not set — AI worker will fail if ai_prompt nodes are used');
    }
    return {
        databaseUrl: requireEnv('DATABASE_URL'),
        redisUrl: process.env['REDIS_URL'] ?? 'redis://localhost:6379',
        botTokenMasterKey: requireEnv('BOT_TOKEN_MASTER_KEY'),
        runMode,
        port: Number(process.env['PORT'] ?? '3002'),
        openaiApiKey,
        openaiBaseUrl,
    };
}
//# sourceMappingURL=config.js.map