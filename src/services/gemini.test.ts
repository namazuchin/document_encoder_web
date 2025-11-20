import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GeminiClient } from './gemini';

describe('GeminiClient', () => {
    const apiKey = 'test-api-key';
    let client: GeminiClient;

    beforeEach(() => {
        client = new GeminiClient(apiKey);
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('generateContent should call the correct API endpoint', async () => {
        const mockResponse = {
            candidates: [{ content: { parts: [{ text: 'Generated content' }] } }]
        };

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        });

        const result = await client.generateContent('gemini-pro', 'Test prompt');

        expect(result).toBe('Generated content');
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('models/gemini-pro:generateContent'),
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: expect.stringContaining('Test prompt')
            })
        );
    });

    it('generateContent should handle API errors', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: false,
            statusText: 'Bad Request',
            json: async () => ({ error: { message: 'Invalid API Key' } })
        });

        await expect(client.generateContent('gemini-pro', 'Test'))
            .rejects.toThrow('Generation failed: Invalid API Key');
    });
});
