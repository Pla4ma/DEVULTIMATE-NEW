import { describe, it, expect } from 'vitest';
import { extractScoreTrends, computeToolCoverage, generateInsightBrief, type ReportSummary } from './intelligence';

describe('intelligence', () => {
  const mockReports: ReportSummary[] = [
    { id: '1', tool: 'idea', score: 70, created_at: '2024-01-01' },
    { id: '2', tool: 'reality', score: 65, created_at: '2024-01-02' },
    { id: '3', tool: 'mvp', score: 80, created_at: '2024-01-03' },
    { id: '4', tool: 'idea', score: 85, created_at: '2024-01-04' },
  ];

  describe('extractScoreTrends', () => {
    it('should return empty for no reports', () => {
      const result = extractScoreTrends([]);
      expect(result).toEqual([]);
    });

    it('should extract trends from reports', () => {
      const result = extractScoreTrends(mockReports);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should identify improving trends', () => {
      const result = extractScoreTrends(mockReports);
      expect(result.some((t) => t.trend === 'improving')).toBe(true);
    });
  });

  describe('computeToolCoverage', () => {
    it('should return zero coverage for empty reports', () => {
      const result = computeToolCoverage([]);
      expect(result.overall).toBe(0);
    });

    it('should calculate coverage correctly', () => {
      const result = computeToolCoverage(mockReports);
      expect(result.overall).toBeGreaterThan(0);
      expect(result.overall).toBeLessThanOrEqual(100);
    });

    it('should have tool-specific coverage', () => {
      const result = computeToolCoverage(mockReports);
      expect(result.byTool).toBeDefined();
      expect(result.byTool['idea']).toBeDefined();
    });
  });

  describe('generateInsightBrief', () => {
    it('should return null for empty reports', () => {
      const result = generateInsightBrief([]);
      expect(result).toBeNull();
    });

    it('should generate brief with status', () => {
      const result = generateInsightBrief(mockReports);
      expect(result).not.toBeNull();
      expect(result?.status).toBeDefined();
    });

    it('should include summary', () => {
      const result = generateInsightBrief(mockReports);
      expect(result?.summary).toBeDefined();
      expect(typeof result?.summary).toBe('string');
    });

    it('should identify key insights', () => {
      const result = generateInsightBrief(mockReports);
      expect(result?.keyInsights).toBeDefined();
      expect(Array.isArray(result?.keyInsights)).toBe(true);
    });

    it('should include health score', () => {
      const result = generateInsightBrief(mockReports);
      expect(result?.healthScore).toBeDefined();
      expect(typeof result?.healthScore).toBe('number');
    });
  });
});