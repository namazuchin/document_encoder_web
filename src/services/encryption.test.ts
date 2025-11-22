import { describe, it, expect, beforeEach } from 'vitest';
import { encrypt, decrypt, isEncrypted } from './encryption';

describe('EncryptionService', () => {
    const testData = [
        { input: 'simple-password', description: 'simple password' },
        { input: 'AIzaSyD1234567890abcdefghijklmnopqrstuv', description: 'API key format' },
        { input: 'パスワード123!@#', description: 'Japanese characters with symbols' },
        { input: '', description: 'empty string' },
        { input: 'a'.repeat(1000), description: 'long string (1000 chars)' },
    ];

    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
    });

    describe('encrypt', () => {
        it('should encrypt a string', async () => {
            const plaintext = 'my-secret-api-key';
            const encrypted = await encrypt(plaintext);

            expect(encrypted).toBeDefined();
            expect(encrypted).not.toBe(plaintext);
            expect(encrypted.length).toBeGreaterThan(0);
        });

        it('should return empty string for empty input', async () => {
            const encrypted = await encrypt('');
            expect(encrypted).toBe('');
        });

        it('should produce different ciphertexts for the same input (due to random IV)', async () => {
            const plaintext = 'test-data';
            const encrypted1 = await encrypt(plaintext);
            const encrypted2 = await encrypt(plaintext);

            expect(encrypted1).not.toBe(encrypted2);
        });

        testData.forEach(({ input, description }) => {
            if (input) {
                it(`should encrypt ${description}`, async () => {
                    const encrypted = await encrypt(input);
                    expect(encrypted).toBeDefined();
                    expect(encrypted).not.toBe(input);
                });
            }
        });
    });

    describe('decrypt', () => {
        it('should decrypt an encrypted string', async () => {
            const plaintext = 'my-secret-api-key';
            const encrypted = await encrypt(plaintext);
            const decrypted = await decrypt(encrypted);

            expect(decrypted).toBe(plaintext);
        });

        it('should return empty string for empty input', async () => {
            const decrypted = await decrypt('');
            expect(decrypted).toBe('');
        });

        testData.forEach(({ input, description }) => {
            if (input) {
                it(`should encrypt and decrypt ${description}`, async () => {
                    const encrypted = await encrypt(input);
                    const decrypted = await decrypt(encrypted);
                    expect(decrypted).toBe(input);
                });
            }
        });

        it('should throw error for invalid base64', async () => {
            await expect(decrypt('not-valid-base64!!!')).rejects.toThrow();
        });

        it('should throw error for corrupted data', async () => {
            const validEncrypted = await encrypt('test');
            const corrupted = validEncrypted.substring(0, validEncrypted.length - 10) + 'XXXXXXXXXX';
            await expect(decrypt(corrupted)).rejects.toThrow();
        });
    });

    describe('isEncrypted', () => {
        it('should return true for encrypted data', async () => {
            const plaintext = 'test-data';
            const encrypted = await encrypt(plaintext);
            expect(isEncrypted(encrypted)).toBe(true);
        });

        it('should return false for plaintext', () => {
            expect(isEncrypted('plaintext-password')).toBe(false);
            expect(isEncrypted('AIzaSyD1234567890abcdefghijklmnopqrstuv')).toBe(false);
        });

        it('should return false for empty string', () => {
            expect(isEncrypted('')).toBe(false);
        });

        it('should return false for invalid base64', () => {
            expect(isEncrypted('not-base64!!!')).toBe(false);
        });

        it('should return false for too-short base64', () => {
            expect(isEncrypted('YWJj')).toBe(false); // "abc" in base64, too short
        });
    });

    describe('Device fingerprint consistency', () => {
        it('should decrypt data in the same session', async () => {
            const plaintext = 'consistent-test';
            const encrypted = await encrypt(plaintext);

            // Try decrypting multiple times
            const decrypted1 = await decrypt(encrypted);
            const decrypted2 = await decrypt(encrypted);
            const decrypted3 = await decrypt(encrypted);

            expect(decrypted1).toBe(plaintext);
            expect(decrypted2).toBe(plaintext);
            expect(decrypted3).toBe(plaintext);
        });

        it('should use stable device ID from localStorage', async () => {
            const plaintext = 'device-id-test';
            const encrypted = await encrypt(plaintext);

            // Device ID should be stored
            const deviceId = localStorage.getItem('doc_encoder_device_id');
            expect(deviceId).toBeDefined();
            expect(deviceId).toHaveLength(32); // 16 bytes * 2 hex chars

            // Should decrypt correctly
            const decrypted = await decrypt(encrypted);
            expect(decrypted).toBe(plaintext);
        });
    });

    describe('Edge cases', () => {
        it('should handle special characters', async () => {
            const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`\'"\\';
            const encrypted = await encrypt(specialChars);
            const decrypted = await decrypt(encrypted);
            expect(decrypted).toBe(specialChars);
        });

        it('should handle unicode characters', async () => {
            const unicode = '你好世界 🌍 مرحبا العالم';
            const encrypted = await encrypt(unicode);
            const decrypted = await decrypt(encrypted);
            expect(decrypted).toBe(unicode);
        });

        it('should handle line breaks and whitespace', async () => {
            const multiline = 'Line 1\nLine 2\r\nLine 3\tTabbed\n\n  Spaces  ';
            const encrypted = await encrypt(multiline);
            const decrypted = await decrypt(encrypted);
            expect(decrypted).toBe(multiline);
        });
    });
});
