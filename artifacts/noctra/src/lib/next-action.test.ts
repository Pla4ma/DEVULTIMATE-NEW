import { describe, it, expect } from 'vitest';
import { computeNextAction, computePipeline } from './next-action';

describe('next-action', () => {
  describe('computeNextAction', () => {
    it('should return "Run Idea Checker" for empty state', () => {
      const result = computeNextAction({
        reports: [],
        tasks: [],
        projects: [],
        proofSignals: [],
      });
      expect(result.title).toContain('Idea Checker');
    });

    it('should prioritize high priority tasks', () => {
      const result = computeNextAction({
        reports: [],
        tasks: [
          { id: '1', status: 'todo', priority: 'high', title: 'High priority' },
          { id: '2', status: 'todo', priority: 'low', title: 'Low priority' },
        ],
        projects: [],
        proofSignals: [],
      });
      expect(result.title).toContain('High priority');
    });

    it('should recommend Doctor when code exists but not run', () => {
      const result = computeNextAction({
        reports: [{ id: '1', tool: 'idea', score: 70, created_at: '2024-01-01' }],
        tasks: [],
        projects: [{ id: '1', name: 'Test', stage: 'development' }],
        proofSignals: [],
      });
      expect(result.href).toBe('/app/doctor');
    });

    it('should recommend MVP after idea is validated', () => {
      const result = computeNextAction({
        reports: [
          { id: '1', tool: 'idea', score: 80, created_at: '2024-01-01' },
          { id: '2', tool: 'reality', score: 70, created_at: '2024-01-02' },
        ],
        tasks: [],
        projects: [],
        proofSignals: [],
      });
      expect(result.href).toBe('/app/mvp');
    });

    it('should recommend Launch after MVP', () => {
      const result = computeNextAction({
        reports: [
          { id: '1', tool: 'idea', score: 80, created_at: '2024-01-01' },
          { id: '2', tool: 'mvp', score: 70, created_at: '2024-01-02' },
        ],
        tasks: [],
        projects: [],
        proofSignals: [],
      });
      expect(result.href).toBe('/app/launch');
    });

    it('should handle proof signals', () => {
      const result = computeNextAction({
        reports: [],
        tasks: [],
        projects: [],
        proofSignals: [
          { id: '1', kind: 'validation' },
          { id: '2', kind: 'validation' },
          { id: '3', kind: 'validation' },
        ],
      });
      expect(result.href).toBe('/app/proof');
    });
  });

  describe('computePipeline', () => {
    it('should return 8 pipeline steps', () => {
      const result = computePipeline({
        reports: [],
        tasks: [],
        proofSignals: [],
      });
      expect(result.length).toBe(8);
    });

    it('should mark completed steps as done', () => {
      const result = computePipeline({
        reports: [
          { id: '1', tool: 'idea', score: 80, created_at: '2024-01-01' },
          { id: '2', tool: 'mvp', score: 70, created_at: '2024-01-02' },
        ],
        tasks: [],
        proofSignals: [],
      });
      const doneCount = result.filter((r) => r.done).length;
      expect(doneCount).toBe(2);
    });

    it('should mark current step as active', () => {
      const result = computePipeline({
        reports: [
          { id: '1', tool: 'idea', score: 80, created_at: '2024-01-01' },
        ],
        tasks: [],
        proofSignals: [],
      });
      const activeCount = result.filter((r) => r.active).length;
      expect(activeCount).toBe(1);
    });

    it('should have proper labels for all steps', () => {
      const result = computePipeline({
        reports: [],
        tasks: [],
        proofSignals: [],
      });
      result.forEach((step) => {
        expect(step.label).toBeDefined();
        expect(step.key).toBeDefined();
      });
    });
  });
});