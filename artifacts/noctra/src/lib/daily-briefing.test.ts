import { describe, it, expect } from 'vitest';
import { generateDailyBriefing, type ReportSummary } from './daily-briefing';

describe('daily-briefing', () => {
  const mockReports: ReportSummary[] = [
    { id: '1', tool: 'idea', score: 75, created_at: '2024-01-01', summary: 'Good idea' },
    { id: '2', tool: 'mvp', score: 80, created_at: '2024-01-02', summary: 'MVP ready' },
  ];

  const mockTasks = [
    { id: '1', status: 'todo', priority: 'high', title: 'Fix critical bug' },
    { id: '2', status: 'done', priority: 'medium', title: 'Update docs' },
  ];

  const mockProofSignals = [
    { id: '1', kind: 'validation', label: 'User feedback positive' },
  ];

  describe('generateDailyBriefing', () => {
    it('should return null for empty inputs', () => {
      const result = generateDailyBriefing({ reports: [], tasks: [], proofSignals: [] });
      expect(result).toBeNull();
    });

    it('should generate briefing with message', () => {
      const result = generateDailyBriefing({
        reports: mockReports,
        tasks: mockTasks as any,
        proofSignals: mockProofSignals as any,
      });
      expect(result).not.toBeNull();
      expect(result?.message).toBeDefined();
      expect(typeof result?.message).toBe('string');
    });

    it('should include focus area', () => {
      const result = generateDailyBriefing({
        reports: mockReports,
        tasks: mockTasks as any,
        proofSignals: mockProofSignals as any,
      });
      expect(result?.focusArea).toBeDefined();
    });

    it('should include action items', () => {
      const result = generateDailyBriefing({
        reports: mockReports,
        tasks: mockTasks as any,
        proofSignals: mockProofSignals as any,
      });
      expect(result?.actionItems).toBeDefined();
      expect(Array.isArray(result?.actionItems)).toBe(true);
    });

    it('should identify overdue items', () => {
      const result = generateDailyBriefing({
        reports: mockReports,
        tasks: mockTasks as any,
        proofSignals: mockProofSignals as any,
      });
      expect(result?.overdueCount).toBeDefined();
      expect(typeof result?.overdueCount).toBe('number');
    });

    it('should calculate completion rate', () => {
      const result = generateDailyBriefing({
        reports: mockReports,
        tasks: mockTasks as any,
        proofSignals: mockProofSignals as any,
      });
      expect(result?.completionRate).toBeDefined();
      expect(result?.completionRate).toBeGreaterThanOrEqual(0);
      expect(result?.completionRate).toBeLessThanOrEqual(100);
    });

    it('should include momentum score', () => {
      const result = generateDailyBriefing({
        reports: mockReports,
        tasks: mockTasks as any,
        proofSignals: mockProofSignals as any,
      });
      expect(result?.momentumScore).toBeDefined();
      expect(typeof result?.momentumScore).toBe('number');
    });
  });
});