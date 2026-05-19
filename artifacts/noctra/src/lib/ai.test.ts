import { describe, it, expect, vi } from 'vitest';
import { callAI, type AIResponse } from './ai';

describe('ai', () => {
  describe('callAI', () => {
    it('should return AI response', async () => {
      const result = await callAI('test prompt', { tool: 'idea' });
      expect(result).toBeDefined();
    });

    it('should include data in response', async () => {
      const result = await callAI('test prompt', { tool: 'mvp' });
      expect(result).toHaveProperty('data');
    });

    it('should include markdown in response', async () => {
      const result = await callAI('test prompt', { tool: 'doctor' });
      expect(result).toHaveProperty('markdown');
    });

    it('should include score when available', async () => {
      const result = await callAI('test prompt', { tool: 'idea' });
      expect(result).toHaveProperty('score');
    });

    it('should include title in response', async () => {
      const result = await callAI('Build a todo app', { tool: 'idea' });
      expect(result).toHaveProperty('title');
      expect(typeof result.title).toBe('string');
    });

    it('should include summary in response', async () => {
      const result = await callAI('test', { tool: 'mvp' });
      expect(result).toHaveProperty('summary');
    });

    it('should handle different tools', async () => {
      const tools = ['idea', 'mvp', 'doctor', 'launch', 'proof', 'reality', 'swarm'];
      for (const tool of tools) {
        const result = await callAI('test prompt', { tool } as any);
        expect(result).toBeDefined();
      }
    });

    it('should handle system prompt', async () => {
      const result = await callAI('test prompt', { tool: 'idea', system: 'You are a helpful assistant' });
      expect(result).toBeDefined();
    });

    it('should handle temperature parameter', async () => {
      const result = await callAI('test prompt', { tool: 'idea', temperature: 0.5 });
      expect(result).toBeDefined();
    });

    it('should throw for empty prompt', async () => {
      await expect(callAI('', { tool: 'idea' })).rejects.toThrow();
    });
  });
});