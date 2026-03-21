export interface EncryptedToken {
    ciphertext: string;
    iv: string;
    tag: string;
}
export declare function encryptBotToken(plaintext: string, masterKeyBase64: string): EncryptedToken;
export declare function decryptBotToken(ciphertext: string, iv: string, tag: string, masterKeyBase64: string): string;
//# sourceMappingURL=crypto.d.ts.map