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

    it('generateContent should append screenshot instruction to prompt', async () => {
        const mockResponse = {
            candidates: [{ content: { parts: [{ text: 'Generated content' }] } }]
        };

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        });

        await client.generateContent(
            'gemini-pro',
            'Test prompt',
            undefined,
            undefined,
            '\n\nScreenshot instruction here'
        );

        const calls = (global.fetch as any).mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const requestBody = JSON.parse(calls[0][1].body);
        expect(requestBody.contents[0].parts[0].text).toBe('Test prompt\n\nScreenshot instruction here');
    });

    describe('waitForProcessing', () => {
        it('should poll until processing completes', async () => {
            let callCount = 0;

            // Mock timers to avoid actual delays
            vi.useFakeTimers();

            (global.fetch as any).mockImplementation(() => {
                callCount++;
                const state = callCount < 3 ? 'PROCESSING' : 'ACTIVE';
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ state })
                });
            });

            const promise = client.waitForProcessing('files/test-file');

            // Fast-forward through the setTimeout calls
            await vi.runAllTimersAsync();

            await promise;

            expect(callCount).toBe(3);
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('files/test-file')
            );

            vi.useRealTimers();
        });

        it('should throw error if processing fails', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => ({ state: 'FAILED' })
            });

            await expect(client.waitForProcessing('files/test-file'))
                .rejects.toThrow('Video processing failed on Gemini side');
        });
    });

    describe('uploadFile', () => {
        it('should handle upload initialization errors', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: false,
                statusText: 'Unauthorized'
            });

            const file = new File(['test'], 'test.mp4', { type: 'video/mp4' });

            await expect(client.uploadFile(file))
                .rejects.toThrow('Failed to initialize upload');
        });

        it('should throw error when upload URL is missing', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: true,
                headers: {
                    get: () => null
                }
            });

            const file = new File(['test'], 'test.mp4', { type: 'video/mp4' });

            await expect(client.uploadFile(file))
                .rejects.toThrow('Failed to get upload URL');
        });
    });
});
