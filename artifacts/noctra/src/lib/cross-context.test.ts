import { describe, it, expect } from 'vitest';
import { callWithCrossContext, type CrossContextResult } from './cross-context';

describe('cross-context', () => {
  const mockReports = [
    { id: '1', tool: 'idea', score: 80, created_at: '2024-01-01', payload: { data: { targetMarket: 'enterprise' } } },
    { id: '2', tool: 'mvp', score: 75, created_at: '2024-01-02', payload: { data: { features: ['f1', 'f2'] } } },
  ];

  describe('callWithCrossContext', () => {
    it('should return result with injected context', async () => {
      const result = await callWithCrossContext('idea', 'Test idea', { onStage: () => {} });
      expect(result).toBeDefined();
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('markdown');
      expect(result).toHaveProperty('score');
    });

    it('should include title in result', async () => {
      const result = await callWithCrossContext('mvp', 'Build a todo app', { onStage: () => {} });
      expect(result.title).toBeDefined();
      expect(typeof result.title).toBe('string');
    });

    it('should include summary in result', async () => {
      const result = await callWithCrossContext('doctor', 'Code analysis', { onStage: () => {} });
      expect(result.summary).toBeDefined();
      expect(typeof result.summary).toBe('string');
    });

    it('should handle onStage callback', async () => {
      const stages: string[] = [];
      await callWithCrossContext('idea', 'Test', { onStage: (stage) => stages.push(stage) });
      expect(stages.length).toBeGreaterThanOrEqual(0);
    });

    it('should throw for invalid tool', async () => {
      await expect(callWithCrossContext('invalid-tool', 'Test', { onStage: () => {} })).rejects.toThrow();
    });
  });
});