export interface RuntimeConfig {
  databaseUrl: string;
  redisUrl: string;
  botTokenMasterKey: string;
  runMode: 'server' | 'worker' | 'all';
  port: number;
  openaiApiKey: string;
  openaiBaseUrl: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function loadConfig(): RuntimeConfig {
  const runMode = (process.env['RUN_MODE'] ?? 'all') as RuntimeConfig['runMode'];
  if (!['server', 'worker', 'all'].includes(runMode)) {
    throw new Error(`Invalid RUN_MODE: ${runMode}. Must be server, worker, or all`);
  }

  return {
    databaseUrl: requireEnv('DATABASE_URL'),
    redisUrl: process.env['REDIS_URL'] ?? 'redis://localhost:6379',
    botTokenMasterKey: requireEnv('BOT_TOKEN_MASTER_KEY'),
    runMode,
    port: Number(process.env['PORT'] ?? '3002'),
    openaiApiKey: requireEnv('OPENAI_API_KEY'),
    openaiBaseUrl: process.env['OPENAI_BASE_URL'] ?? 'https://api.openai.com',
  };
}
