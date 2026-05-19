import { describe, it, expect } from 'vitest';
import { generateExecutionPackage, type ExecutionPackage } from './execution-autopilot';

describe('execution-autopilot', () => {
  const mockReports = [
    { id: '1', tool: 'idea', score: 80, created_at: '2024-01-01', payload: { data: { targetMarket: 'enterprise' } } },
    { id: '2', tool: 'doctor', score: 60, created_at: '2024-01-02', payload: { data: { issues: ['bug1', 'bug2'] } } },
  ];

  const mockTasks = [
    { id: '1', status: 'todo', priority: 'high', title: 'Task 1' },
    { id: '2', status: 'done', priority: 'medium', title: 'Task 2' },
  ];

  const mockProofSignals = [
    { id: '1', kind: 'validation', label: 'Signal 1' },
  ];

  describe('generateExecutionPackage', () => {
    it('should return null for empty inputs', () => {
      const result = generateExecutionPackage({ reports: [], tasks: [], proofSignals: [] });
      expect(result).toBeNull();
    });

    it('should generate execution package', () => {
      const result = generateExecutionPackage({
        reports: mockReports as any,
        tasks: mockTasks as any,
        proofSignals: mockProofSignals as any,
      });
      expect(result).not.toBeNull();
    });

    it('should include prompt pack', () => {
      const result = generateExecutionPackage({
        reports: mockReports as any,
        tasks: mockTasks as any,
        proofSignals: mockProofSignals as any,
      });
      expect(result?.promptPack).toBeDefined();
      expect(typeof result?.promptPack).toBe('string');
      expect(result?.promptPack.length).toBeGreaterThan(0);
    });

    it('should include task batch', () => {
      const result = generateExecutionPackage({
        reports: mockReports as any,
        tasks: mockTasks as any,
        proofSignals: mockProofSignals as any,
      });
      expect(result?.taskBatch).toBeDefined();
      expect(Array.isArray(result?.taskBatch)).toBe(true);
      expect(result?.taskBatch.length).toBeGreaterThan(0);
    });

    it('should include summary', () => {
      const result = generateExecutionPackage({
        reports: mockReports as any,
        tasks: mockTasks as any,
        proofSignals: mockProofSignals as any,
      });
      expect(result?.summary).toBeDefined();
      expect(typeof result?.summary).toBe('string');
    });

    it('should include metadata', () => {
      const result = generateExecutionPackage({
        reports: mockReports as any,
        tasks: mockTasks as any,
        proofSignals: mockProofSignals as any,
      });
      expect(result?.metadata).toBeDefined();
      expect(result?.metadata).toHaveProperty('generatedAt');
      expect(result?.metadata).toHaveProperty('reportCount');
      expect(result?.metadata).toHaveProperty('taskCount');
    });
  });

  describe('TaskBatch items', () => {
    it('should have required properties for each task', () => {
      const result = generateExecutionPackage({
        reports: mockReports as any,
        tasks: mockTasks as any,
        proofSignals: mockProofSignals as any,
      });
      
      result?.taskBatch.forEach((task) => {
        expect(task).toHaveProperty('title');
        expect(task).toHaveProperty('detail');
        expect(task).toHaveProperty('priority');
        expect(task).toHaveProperty('category');
      });
    });

    it('should include actionable tasks', () => {
      const result = generateExecutionPackage({
        reports: mockReports as any,
        tasks: [] as any,
        proofSignals: mockProofSignals as any,
      });
      
      expect(result?.taskBatch.length).toBeGreaterThan(0);
    });
  });
});