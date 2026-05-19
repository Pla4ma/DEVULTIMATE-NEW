import { describe, it, expect } from 'vitest';
import { computeScoreHistory, getDeltaLabel, getDeltaColor } from './score-history';

describe('score-history', () => {
  describe('computeScoreHistory', () => {
    it('should return empty array for empty input', () => {
      const result = computeScoreHistory([]);
      expect(result).toEqual([]);
    });

    it('should return entries sorted by date descending', () => {
      const reports = [
        { id: '1', tool: 'idea', score: 50, created_at: '2024-01-01' },
        { id: '2', tool: 'mvp', score: 70, created_at: '2024-01-03' },
        { id: '3', tool: 'doctor', score: 60, created_at: '2024-01-02' },
      ];
      const result = computeScoreHistory(reports as any);
      expect(result[0].score).toBe(70);
      expect(result[1].score).toBe(60);
      expect(result[2].score).toBe(50);
    });

    it('should calculate delta for sequential reports', () => {
      const reports = [
        { id: '1', tool: 'idea', score: 50, created_at: '2024-01-01' },
        { id: '2', tool: 'mvp', score: 70, created_at: '2024-01-02' },
      ];
      const result = computeScoreHistory(reports as any);
      expect(result[0].delta).toBe(20);
    });

    it('should handle null scores', () => {
      const reports = [
        { id: '1', tool: 'idea', score: null, created_at: '2024-01-01' },
        { id: '2', tool: 'mvp', score: 70, created_at: '2024-01-02' },
      ];
      const result = computeScoreHistory(reports as any);
      expect(result[0].delta).toBe(0);
    });

    it('should handle reports without scores', () => {
      const reports = [
        { id: '1', tool: 'idea', created_at: '2024-01-01' },
      ];
      const result = computeScoreHistory(reports as any);
      expect(result[0].score).toBeNull();
    });

    it('should limit results', () => {
      const reports = [
        { id: '1', tool: 'idea', score: 50, created_at: '2024-01-01' },
        { id: '2', tool: 'mvp', score: 60, created_at: '2024-01-02' },
        { id: '3', tool: 'doctor', score: 70, created_at: '2024-01-03' },
      ];
      const result = computeScoreHistory(reports as any, 2);
      expect(result.length).toBe(2);
    });
  });

  describe('getDeltaLabel', () => {
    it('should return "improving" for positive delta', () => {
      expect(getDeltaLabel(10)).toBe('improving');
    });

    it('should return "declining" for negative delta', () => {
      expect(getDeltaLabel(-10)).toBe('declining');
    });

    it('should return "unchanged" for zero delta', () => {
      expect(getDeltaLabel(0)).toBe('unchanged');
    });
  });

  describe('getDeltaColor', () => {
    it('should return emerald for positive delta', () => {
      expect(getDeltaColor(10)).toBe('var(--noctra-emerald)');
    });

    it('should return rose for negative delta', () => {
      expect(getDeltaColor(-10)).toBe('var(--noctra-rose)');
    });

    it('should return text-muted for zero delta', () => {
      expect(getDeltaColor(0)).toBe('var(--noctra-text-muted)');
    });
  });
});