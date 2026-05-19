import { describe, it, expect } from 'vitest';
import { buildProductBrain, type ProductBrain } from './product-brain';

describe('product-brain', () => {
  const mockReports = [
    { id: '1', tool: 'idea', score: 80, created_at: '2024-01-01', summary: 'Good idea for enterprise', payload: { data: { targetMarket: 'enterprise' } } },
    { id: '2', tool: 'mvp', score: 75, created_at: '2024-01-02', summary: 'MVP plan ready', payload: { data: { features: ['f1', 'f2'] } } },
    { id: '3', tool: 'doctor', score: 60, created_at: '2024-01-03', summary: 'Some issues found', payload: { data: { issues: ['bug1'] } } },
  ];

  const mockTasks = [
    { id: '1', status: 'todo', priority: 'high', title: 'Fix bug 1', category: 'doctor' },
    { id: '2', status: 'done', priority: 'medium', title: 'Add feature', category: 'mvp' },
  ];

  const mockProofSignals = [
    { id: '1', kind: 'validation', label: 'User feedback positive' },
  ];

  describe('buildProductBrain', () => {
    it('should return null for empty inputs', () => {
      const result = buildProductBrain({ reports: [], tasks: [], proofSignals: [] });
      expect(result).toBeNull();
    });

    it('should build product brain', () => {
      const result = buildProductBrain({
        reports: mockReports as any,
        tasks: mockTasks as any,
        proofSignals: mockProofSignals as any,
      });
      expect(result).not.toBeNull();
    });

    it('should include product summary', () => {
      const result = buildProductBrain({
        reports: mockReports as any,
        tasks: mockTasks as any,
        proofSignals: mockProofSignals as any,
      });
      expect(result?.productSummary).toBeDefined();
      expect(typeof result?.productSummary).toBe('string');
    });

    it('should include key insights', () => {
      const result = buildProductBrain({
        reports: mockReports as any,
        tasks: mockTasks as any,
        proofSignals: mockProofSignals as any,
      });
      expect(result?.keyInsights).toBeDefined();
      expect(Array.isArray(result?.keyInsights)).toBe(true);
    });

    it('should include health metrics', () => {
      const result = buildProductBrain({
        reports: mockReports as any,
        tasks: mockTasks as any,
        proofSignals: mockProofSignals as any,
      });
      expect(result?.healthMetrics).toBeDefined();
      expect(result?.healthMetrics).toHaveProperty('score');
      expect(result?.healthMetrics).toHaveProperty('trend');
      expect(result?.healthMetrics).toHaveProperty('risks');
    });

    it('should include next steps', () => {
      const result = buildProductBrain({
        reports: mockReports as any,
        tasks: mockTasks as any,
        proofSignals: mockProofSignals as any,
      });
      expect(result?.nextSteps).toBeDefined();
      expect(Array.isArray(result?.nextSteps)).toBe(true);
      expect(result?.nextSteps.length).toBeGreaterThan(0);
    });

    it('should include context', () => {
      const result = buildProductBrain({
        reports: mockReports as any,
        tasks: mockTasks as any,
        proofSignals: mockProofSignals as any,
      });
      expect(result?.context).toBeDefined();
      expect(result?.context).toHaveProperty('reportsAnalyzed');
      expect(result?.context).toHaveProperty('tasksTracked');
      expect(result?.context).toHaveProperty('proofSignals');
    });
  });

  describe('ProductBrain structure', () => {
    it('should have required top-level properties', () => {
      const result = buildProductBrain({
        reports: mockReports as any,
        tasks: mockTasks as any,
        proofSignals: mockProofSignals as any,
      });
      
      expect(result).toHaveProperty('productSummary');
      expect(result).toHaveProperty('keyInsights');
      expect(result).toHaveProperty('healthMetrics');
      expect(result).toHaveProperty('nextSteps');
      expect(result).toHaveProperty('context');
    });

    it('should include tools used', () => {
      const result = buildProductBrain({
        reports: mockReports as any,
        tasks: mockTasks as any,
        proofSignals: mockProofSignals as any,
      });
      
      const toolsUsed = result?.context.toolsUsed;
      expect(toolsUsed).toContain('idea');
      expect(toolsUsed).toContain('mvp');
      expect(toolsUsed).toContain('doctor');
    });
  });
});