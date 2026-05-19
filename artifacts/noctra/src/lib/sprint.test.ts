import { describe, it, expect } from 'vitest';
import { generateSprint, type Sprint } from './sprint';

describe('sprint', () => {
  const mockTasks = [
    { id: '1', status: 'todo', priority: 'high', title: 'Task 1', category: 'mvp' },
    { id: '2', status: 'todo', priority: 'medium', title: 'Task 2', category: 'doctor' },
    { id: '3', status: 'todo', priority: 'low', title: 'Task 3', category: 'idea' },
    { id: '4', status: 'done', priority: 'high', title: 'Task 4', category: 'mvp' },
  ];

  const mockReports = [
    { id: '1', tool: 'mvp', score: 80, created_at: '2024-01-01' },
  ];

  describe('generateSprint', () => {
    it('should return null for empty inputs', () => {
      const result = generateSprint({ tasks: [], reports: [] });
      expect(result).toBeNull();
    });

    it('should generate sprint with goal', () => {
      const result = generateSprint({
        tasks: mockTasks as any,
        reports: mockReports as any,
      });
      expect(result).not.toBeNull();
      expect(result?.goal).toBeDefined();
      expect(typeof result?.goal).toBe('string');
    });

    it('should include tasks', () => {
      const result = generateSprint({
        tasks: mockTasks as any,
        reports: mockReports as any,
      });
      expect(result?.tasks).toBeDefined();
      expect(Array.isArray(result?.tasks)).toBe(true);
    });

    it('should set duration', () => {
      const result = generateSprint({
        tasks: mockTasks as any,
        reports: mockReports as any,
      });
      expect(result?.duration).toBeDefined();
      expect(['1 week', '2 weeks', '4 weeks']).toContain(result?.duration);
    });

    it('should estimate capacity', () => {
      const result = generateSprint({
        tasks: mockTasks as any,
        reports: mockReports as any,
      });
      expect(result?.capacity).toBeDefined();
      expect(typeof result?.capacity).toBe('object');
      expect(result?.capacity).toHaveProperty('hours');
      expect(result?.capacity).toHaveProperty('points');
    });

    it('should prioritize high priority tasks', () => {
      const result = generateSprint({
        tasks: mockTasks as any,
        reports: mockReports as any,
      });
      if (result?.tasks.length) {
        expect(result.tasks[0].priority).toBe('high');
      }
    });

    it('should calculate velocity', () => {
      const result = generateSprint({
        tasks: mockTasks as any,
        reports: mockReports as any,
      });
      expect(result?.velocity).toBeDefined();
      expect(typeof result?.velocity).toBe('number');
    });
  });
});