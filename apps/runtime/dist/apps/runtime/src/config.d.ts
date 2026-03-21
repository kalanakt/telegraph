export interface RuntimeConfig {
    databaseUrl: string;
    redisUrl: string;
    botTokenMasterKey: string;
    runMode: 'server' | 'worker' | 'all';
    port: number;
    openaiApiKey: string;
    openaiBaseUrl: string;
}
export declare function loadConfig(): RuntimeConfig;
//# sourceMappingURL=config.d.ts.map