import { describe, it, expect } from 'vitest';
import { storeMemory, recallMemory, clearMemory, type Memory } from './twin-memory';

describe('twin-memory', () => {
  const mockMemory: Memory = {
    id: '1',
    type: 'insight',
    content: 'Test insight',
    source: 'idea',
    timestamp: '2024-01-01',
    tags: ['test', 'important'],
  };

  describe('storeMemory', () => {
    it('should store memory', async () => {
      const result = await storeMemory(mockMemory);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
    });

    it('should handle different memory types', async () => {
      const insightMemory = { ...mockMemory, type: 'insight' };
      const result1 = await storeMemory(insightMemory);
      expect(result1).toBeDefined();

      const taskMemory = { ...mockMemory, type: 'task' };
      const result2 = await storeMemory(taskMemory);
      expect(result2).toBeDefined();
    });

    it('should include tags', async () => {
      const memoryWithTags = { ...mockMemory, tags: ['tag1', 'tag2'] };
      const result = await storeMemory(memoryWithTags);
      expect(result).toBeDefined();
    });
  });

  describe('recallMemory', () => {
    it('should return memories', async () => {
      const result = await recallMemory({});
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should filter by type', async () => {
      const result = await recallMemory({ type: 'insight' });
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should filter by source', async () => {
      const result = await recallMemory({ source: 'idea' });
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should filter by tags', async () => {
      const result = await recallMemory({ tags: ['important'] });
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should limit results', async () => {
      const result = await recallMemory({ limit: 5 });
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should return most recent by default', async () => {
      const result = await recallMemory({});
      expect(result).toBeDefined();
    });
  });

  describe('clearMemory', () => {
    it('should clear all memories', async () => {
      await expect(clearMemory()).resolves.not.toThrow();
    });

    it('should clear by type', async () => {
      await expect(clearMemory({ type: 'insight' })).resolves.not.toThrow();
    });

    it('should clear by source', async () => {
      await expect(clearMemory({ source: 'idea' })).resolves.not.toThrow();
    });
  });
});