import { describe, it, expect } from 'vitest';
import { calculateRetention, generateRetentionReport, type RetentionMetrics } from './retention';

describe('retention', () => {
  const mockTasks = [
    { id: '1', status: 'todo', created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '2', status: 'done', created_at: '2024-01-01', updated_at: '2024-01-05' },
    { id: '3', status: 'done', created_at: '2024-01-01', updated_at: '2024-01-10' },
    { id: '4', status: 'todo', created_at: '2024-01-01', updated_at: '2024-01-01' },
  ];

  const mockReports = [
    { id: '1', tool: 'idea', created_at: '2024-01-01' },
    { id: '2', tool: 'mvp', created_at: '2024-01-05' },
  ];

  describe('calculateRetention', () => {
    it('should return zero for empty tasks', () => {
      const result = calculateRetention([]);
      expect(result).toBe(0);
    });

    it('should calculate completion rate', () => {
      const result = calculateRetention(mockTasks as any);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should handle partially completed tasks', () => {
      const partialTasks = [
        { id: '1', status: 'done' },
        { id: '2', status: 'todo' },
      ];
      const result = calculateRetention(partialTasks as any);
      expect(result).toBe(50);
    });

    it('should return 100% for all completed', () => {
      const allDone = [
        { id: '1', status: 'done' },
        { id: '2', status: 'done' },
      ];
      const result = calculateRetention(allDone as any);
      expect(result).toBe(100);
    });

    it('should return 0% for none completed', () => {
      const noneDone = [
        { id: '1', status: 'todo' },
        { id: '2', status: 'todo' },
      ];
      const result = calculateRetention(noneDone as any);
      expect(result).toBe(0);
    });
  });

  describe('generateRetentionReport', () => {
    it('should return null for empty inputs', () => {
      const result = generateRetentionReport({ tasks: [], reports: [] });
      expect(result).toBeNull();
    });

    it('should include metrics', () => {
      const result = generateRetentionReport({
        tasks: mockTasks as any,
        reports: mockReports as any,
      });
      expect(result).not.toBeNull();
      expect(result?.metrics).toBeDefined();
      expect(result?.metrics).toHaveProperty('completionRate');
      expect(result?.metrics).toHaveProperty('avgCompletionTime');
      expect(result?.metrics).toHaveProperty('activeTasks');
    });

    it('should include trend', () => {
      const result = generateRetentionReport({
        tasks: mockTasks as any,
        reports: mockReports as any,
      });
      expect(result?.trend).toBeDefined();
      expect(['improving', 'declining', 'stable']).toContain(result?.trend);
    });

    it('should include insights', () => {
      const result = generateRetentionReport({
        tasks: mockTasks as any,
        reports: mockReports as any,
      });
      expect(result?.insights).toBeDefined();
      expect(Array.isArray(result?.insights)).toBe(true);
    });

    it('should include recommendations', () => {
      const result = generateRetentionReport({
        tasks: mockTasks as any,
        reports: mockReports as any,
      });
      expect(result?.recommendations).toBeDefined();
      expect(Array.isArray(result?.recommendations)).toBe(true);
    });
  });
});