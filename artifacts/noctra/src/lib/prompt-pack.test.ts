import { describe, it, expect } from 'vitest';
import { generatePromptPack, type PromptPack } from './prompt-pack';

describe('prompt-pack', () => {
  const mockReports = [
    { id: '1', tool: 'idea', score: 80, created_at: '2024-01-01', payload: { data: { targetMarket: 'enterprise' } } },
    { id: '2', tool: 'doctor', score: 70, created_at: '2024-01-02', payload: { data: { issues: ['bug1'] } } },
  ];

  const mockTasks = [
    { id: '1', status: 'todo', priority: 'high', title: 'Fix bug', category: 'doctor' },
  ];

  describe('generatePromptPack', () => {
    it('should return null for empty inputs', () => {
      const result = generatePromptPack({ reports: [], tasks: [] });
      expect(result).toBeNull();
    });

    it('should generate prompt pack', () => {
      const result = generatePromptPack({
        reports: mockReports as any,
        tasks: mockTasks as any,
      });
      expect(result).not.toBeNull();
    });

    it('should include system prompt', () => {
      const result = generatePromptPack({
        reports: mockReports as any,
        tasks: mockTasks as any,
      });
      expect(result?.system).toBeDefined();
      expect(typeof result?.system).toBe('string');
      expect(result?.system.length).toBeGreaterThan(0);
    });

    it('should include context', () => {
      const result = generatePromptPack({
        reports: mockReports as any,
        tasks: mockTasks as any,
      });
      expect(result?.context).toBeDefined();
      expect(typeof result?.context).toBe('string');
    });

    it('should include tasks', () => {
      const result = generatePromptPack({
        reports: mockReports as any,
        tasks: mockTasks as any,
      });
      expect(result?.tasks).toBeDefined();
      expect(Array.isArray(result?.tasks)).toBe(true);
    });

    it('should include instructions', () => {
      const result = generatePromptPack({
        reports: mockReports as any,
        tasks: mockTasks as any,
      });
      expect(result?.instructions).toBeDefined();
      expect(typeof result?.instructions).toBe('string');
    });

    it('should include metadata', () => {
      const result = generatePromptPack({
        reports: mockReports as any,
        tasks: mockTasks as any,
      });
      expect(result?.metadata).toBeDefined();
      expect(result?.metadata).toHaveProperty('generatedAt');
      expect(result?.metadata).toHaveProperty('reportCount');
      expect(result?.metadata).toHaveProperty('taskCount');
    });

    it('should format as markdown', () => {
      const result = generatePromptPack({
        reports: mockReports as any,
        tasks: mockTasks as any,
      });
      expect(result?.markdown).toBeDefined();
      expect(result?.markdown).toContain('#');
    });
  });
});