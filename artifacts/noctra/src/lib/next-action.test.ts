import { describe, it, expect } from 'vitest';
import { computeNextAction, computePipeline } from './next-action';

describe('next-action', () => {
  describe('computeNextAction', () => {
    it('should return "Run Product Doctor" for empty state', () => {
      const result = computeNextAction({
        reports: [],
        tasks: [],
        projects: [],
        proofSignals: [],
      });
      expect(result.title).toContain('Product Doctor');
    });

    it('should recommend Doctor when no scan has been run', () => {
      const result = computeNextAction({
        reports: [{ id: '1', tool: 'idea', score: 70, created_at: '2024-01-01' }],
        tasks: [],
        projects: [{ id: '1', name: 'Test', stage: 'development' }],
        proofSignals: [],
      });
      expect(result.href).toBe('/app/doctor');
    });

    it('should recommend Doctor scan when idea exists but no doctor', () => {
      const result = computeNextAction({
        reports: [
          { id: '1', tool: 'idea', score: 80, created_at: '2024-01-01' },
          { id: '2', tool: 'reality', score: 70, created_at: '2024-01-02' },
          { id: '3', tool: 'swarm', score: 60, created_at: '2024-01-03' },
          { id: '4', tool: 'mvp', score: 75, created_at: '2024-01-04' },
        ],
        tasks: [],
        projects: [],
        proofSignals: [],
      });
      expect(result.href).toBe('/app/doctor');
    });

    it('should recommend fixes when doctor score is low', () => {
      const result = computeNextAction({
        reports: [
          { id: '1', tool: 'doctor', score: 35, created_at: '2024-01-01', payload: { data: { gates: [{ name: 'Security', status: 'RED' }], red_gates: ['Security'] } } },
        ],
        tasks: [],
        projects: [],
        proofSignals: [],
      });
      expect(result.title).toContain('Blocker');
      expect(result.href).toBe('/app/doctor');
    });

    it('should recommend Launch when all pre-launch steps are done and doctor score is good', () => {
      const result = computeNextAction({
        reports: [
          { id: '1', tool: 'idea', score: 80, created_at: '2024-01-01' },
          { id: '2', tool: 'reality', score: 70, created_at: '2024-01-02' },
          { id: '3', tool: 'proof', score: 75, created_at: '2024-01-03' },
          { id: '4', tool: 'swarm', score: 65, created_at: '2024-01-04' },
          { id: '5', tool: 'mvp', score: 75, created_at: '2024-01-05' },
          { id: '6', tool: 'doctor', score: 80, created_at: '2024-01-06' },
        ],
        tasks: [],
        projects: [],
        proofSignals: [{ id: '1' }, { id: '2' }, { id: '3' }],
      });
      expect(result.href).toBe('/app/launch');
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
          { id: '1', tool: 'doctor', score: 80, created_at: '2024-01-01' },
          { id: '2', tool: 'idea', score: 70, created_at: '2024-01-02' },
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
          { id: '1', tool: 'doctor', score: 80, created_at: '2024-01-01' },
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
