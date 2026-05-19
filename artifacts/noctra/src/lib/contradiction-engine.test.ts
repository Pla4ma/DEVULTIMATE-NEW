import { describe, it, expect } from 'vitest';
import { runContradictionEngine, type ReportSummary } from './contradiction-engine';

describe('contradiction-engine', () => {
  const mockReports: ReportSummary[] = [
    { id: '1', tool: 'idea', score: 90, created_at: '2024-01-01', payload: { data: { targetMarket: 'enterprise' } } },
    { id: '2', tool: 'swarm', score: 30, created_at: '2024-01-02', payload: { data: { demand: 'low' } } },
    { id: '3', tool: 'mvp', score: 80, created_at: '2024-01-03', payload: { data: { timeline: '6 months' } } },
    { id: '4', tool: 'doctor', score: 40, created_at: '2024-01-04', payload: { data: { issues: ['critical', 'blocking'] } } },
  ];

  describe('runContradictionEngine', () => {
    it('should return result for empty reports', () => {
      const result = runContradictionEngine([]);
      expect(result).toBeDefined();
      expect(result.contradictions).toEqual([]);
      expect(result.alignmentScore).toBe(100);
    });

    it('should detect contradictions', () => {
      const result = runContradictionEngine(mockReports);
      expect(result.contradictions.length).toBeGreaterThan(0);
    });

    it('should identify severity levels', () => {
      const result = runContradictionEngine(mockReports);
      result.contradictions.forEach((c) => {
        expect(['critical', 'high', 'medium', 'low']).toContain(c.severity);
      });
    });

    it('should have required properties for contradictions', () => {
      const result = runContradictionEngine(mockReports);
      result.contradictions.forEach((c) => {
        expect(c).toHaveProperty('title');
        expect(c).toHaveProperty('explanation');
        expect(c).toHaveProperty('severity');
        expect(c).toHaveProperty('recommendedResolution');
      });
    });

    it('should calculate alignment score', () => {
      const result = runContradictionEngine(mockReports);
      expect(typeof result.alignmentScore).toBe('number');
      expect(result.alignmentScore).toBeGreaterThanOrEqual(0);
      expect(result.alignmentScore).toBeLessThanOrEqual(100);
    });

    it('should return high alignment for consistent reports', () => {
      const consistentReports: ReportSummary[] = [
        { id: '1', tool: 'idea', score: 80, created_at: '2024-01-01', payload: { data: { market: 'B2B' } } },
        { id: '2', tool: 'swarm', score: 85, created_at: '2024-01-02', payload: { data: { demand: 'high', targetMarket: 'B2B' } } },
      ];
      const result = runContradictionEngine(consistentReports);
      expect(result.alignmentScore).toBeGreaterThan(70);
    });

    it('should return low alignment for contradictory reports', () => {
      const contradictoryReports: ReportSummary[] = [
        { id: '1', tool: 'idea', score: 90, created_at: '2024-01-01', payload: { data: { targetMarket: 'enterprise' } } },
        { id: '2', tool: 'swarm', score: 20, created_at: '2024-01-02', payload: { data: { demand: 'low', targetMarket: 'consumer' } } },
      ];
      const result = runContradictionEngine(contradictoryReports);
      expect(result.alignmentScore).toBeLessThan(50);
    });
  });
});