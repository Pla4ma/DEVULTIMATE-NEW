import { describe, it, expect } from 'vitest';
import { generateBrief, type Brief } from './brief-generator';

describe('brief-generator', () => {
  const mockReports = [
    { id: '1', tool: 'idea', score: 80, summary: 'Good idea', created_at: '2024-01-01' },
    { id: '2', tool: 'mvp', score: 75, summary: 'MVP ready', created_at: '2024-01-02' },
  ];

  const mockTasks = [
    { id: '1', status: 'todo', priority: 'high', title: 'Task 1' },
    { id: '2', status: 'done', priority: 'medium', title: 'Task 2' },
  ];

  describe('generateBrief', () => {
    it('should return null for empty inputs', () => {
      const result = generateBrief({ reports: [], tasks: [] });
      expect(result).toBeNull();
    });

    it('should generate brief with summary', () => {
      const result = generateBrief({ reports: mockReports as any, tasks: mockTasks as any });
      expect(result).not.toBeNull();
      expect(result?.summary).toBeDefined();
      expect(typeof result?.summary).toBe('string');
    });

    it('should include highlights', () => {
      const result = generateBrief({ reports: mockReports as any, tasks: mockTasks as any });
      expect(result?.highlights).toBeDefined();
      expect(Array.isArray(result?.highlights)).toBe(true);
    });

    it('should include recommendations', () => {
      const result = generateBrief({ reports: mockReports as any, tasks: mockTasks as any });
      expect(result?.recommendations).toBeDefined();
      expect(Array.isArray(result?.recommendations)).toBe(true);
    });

    it('should include next steps', () => {
      const result = generateBrief({ reports: mockReports as any, tasks: mockTasks as any });
      expect(result?.nextSteps).toBeDefined();
      expect(Array.isArray(result?.nextSteps)).toBe(true);
    });

    it('should calculate progress', () => {
      const result = generateBrief({ reports: mockReports as any, tasks: mockTasks as any });
      expect(result?.progress).toBeDefined();
      expect(typeof result?.progress).toBe('number');
      expect(result?.progress).toBeGreaterThanOrEqual(0);
      expect(result?.progress).toBeLessThanOrEqual(100);
    });

    it('should include status', () => {
      const result = generateBrief({ reports: mockReports as any, tasks: mockTasks as any });
      expect(result?.status).toBeDefined();
      expect(['on-track', 'needs-attention', 'critical']).toContain(result?.status);
    });
  });
});