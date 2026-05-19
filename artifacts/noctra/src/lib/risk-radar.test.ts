import { describe, it, expect } from 'vitest';
import { extractRisks, RISK_SEV_COLOR } from './risk-radar';

describe('risk-radar', () => {
  describe('extractRisks', () => {
    it('should return empty array for empty inputs', () => {
      const result = extractRisks({ reports: [], tasks: [] });
      expect(result).toEqual([]);
    });

    it('should extract risks from doctor reports', () => {
      const reports = [
        {
          id: '1',
          tool: 'doctor',
          payload: {
            data: {
              gates: [
                { name: 'Build', status: 'RED' },
                { name: 'Test', status: 'YELLOW' },
              ],
            },
          },
        },
      ];
      const result = extractRisks({ reports: reports as any, tasks: [] });
      expect(result.length).toBeGreaterThan(0);
    });

    it('should extract risks from MVP report', () => {
      const reports = [
        {
          id: '1',
          tool: 'mvp',
          payload: {
            data: {
              risks: [
                { title: 'Risk 1', severity: 'high' },
              ],
            },
          },
        },
      ];
      const result = extractRisks({ reports: reports as any, tasks: [] });
      expect(result.length).toBeGreaterThan(0);
    });

    it('should prioritize critical tasks', () => {
      const tasks = [
        { id: '1', status: 'todo', priority: 'critical', title: 'Critical task' },
        { id: '2', status: 'todo', priority: 'low', title: 'Low priority task' },
      ];
      const result = extractRisks({ reports: [], tasks: tasks as any });
      expect(result.some((r) => r.severity === 'critical')).toBe(true);
    });

    it('should handle reports without payload', () => {
      const reports = [
        { id: '1', tool: 'idea', payload: null },
      ];
      const result = extractRisks({ reports: reports as any, tasks: [] });
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle malformed payload gracefully', () => {
      const reports = [
        { id: '1', tool: 'doctor', payload: { data: null } },
      ];
      const result = extractRisks({ reports: reports as any, tasks: [] });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('RISK_SEV_COLOR', () => {
    it('should have colors for all severity levels', () => {
      expect(RISK_SEV_COLOR['critical']).toBeDefined();
      expect(RISK_SEV_COLOR['high']).toBeDefined();
      expect(RISK_SEV_COLOR['medium']).toBeDefined();
      expect(RISK_SEV_COLOR['low']).toBeDefined();
    });

    it('should use var() format for colors', () => {
      Object.values(RISK_SEV_COLOR).forEach((color) => {
        expect(color).toMatch(/^var\(--/);
      });
    });

    it('should have distinct colors for each severity', () => {
      const colors = new Set(Object.values(RISK_SEV_COLOR));
      expect(colors.size).toBe(Object.keys(RISK_SEV_COLOR).length);
    });
  });
});