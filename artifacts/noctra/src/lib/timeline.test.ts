import { describe, it, expect } from 'vitest';
import { buildTimeline, formatTimeAgo, TIMELINE_TYPE_COLOR } from './timeline';

describe('timeline', () => {
  describe('buildTimeline', () => {
    it('should return empty array for empty inputs', () => {
      const result = buildTimeline({ reports: [], proofSignals: [], limit: 10 });
      expect(result).toEqual([]);
    });

    it('should return reports sorted by date', () => {
      const reports = [
        { id: '1', tool: 'idea', title: 'Test 1', created_at: '2024-01-01' },
        { id: '2', tool: 'mvp', title: 'Test 2', created_at: '2024-01-03' },
        { id: '3', tool: 'doctor', title: 'Test 3', created_at: '2024-01-02' },
      ];
      const result = buildTimeline({ reports: reports as any, proofSignals: [], limit: 10 });
      expect(result[0].id).toBe('2');
      expect(result[1].id).toBe('3');
      expect(result[2].id).toBe('1');
    });

    it('should respect limit parameter', () => {
      const reports = [
        { id: '1', tool: 'idea', title: 'Test 1', created_at: '2024-01-01' },
        { id: '2', tool: 'mvp', title: 'Test 2', created_at: '2024-01-03' },
        { id: '3', tool: 'doctor', title: 'Test 3', created_at: '2024-01-02' },
      ];
      const result = buildTimeline({ reports: reports as any, proofSignals: [], limit: 2 });
      expect(result.length).toBe(2);
    });

    it('should include proof signals', () => {
      const proofSignals = [
        { id: 'p1', label: 'Signal 1', kind: 'validation', created_at: '2024-01-01' },
      ];
      const result = buildTimeline({ reports: [], proofSignals: proofSignals as any, limit: 10 });
      expect(result.length).toBe(1);
      expect(result[0].type).toBe('proof');
    });

    it('should have correct type for each tool', () => {
      const reports = [
        { id: '1', tool: 'idea', title: 'Test', created_at: '2024-01-01' },
        { id: '2', tool: 'mvp', title: 'Test', created_at: '2024-01-02' },
        { id: '3', tool: 'doctor', title: 'Test', created_at: '2024-01-03' },
      ];
      const result = buildTimeline({ reports: reports as any, proofSignals: [], limit: 10 });
      expect(result[0].type).toBe('mvp');
      expect(result[1].type).toBe('doctor');
      expect(result[2].type).toBe('idea');
    });
  });

  describe('formatTimeAgo', () => {
    it('should return "just now" for very recent dates', () => {
      const date = new Date();
      const result = formatTimeAgo(date);
      expect(result).toBe('just now');
    });

    it('should return minutes ago for recent dates', () => {
      const date = new Date(Date.now() - 30 * 60 * 1000);
      const result = formatTimeAgo(date);
      expect(result).toMatch(/minutes? ago/);
    });

    it('should return hours ago for older dates', () => {
      const date = new Date(Date.now() - 5 * 60 * 60 * 1000);
      const result = formatTimeAgo(date);
      expect(result).toMatch(/hours? ago/);
    });

    it('should return days ago for older dates', () => {
      const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const result = formatTimeAgo(date);
      expect(result).toMatch(/days? ago/);
    });
  });

  describe('TIMELINE_TYPE_COLOR', () => {
    it('should have colors for all timeline types', () => {
      const types = ['idea', 'mvp', 'doctor', 'launch', 'proof', 'reality', 'swarm'];
      types.forEach((type) => {
        expect(TIMELINE_TYPE_COLOR[type]).toBeDefined();
        expect(TIMELINE_TYPE_COLOR[type]).toMatch(/^var\(--/);
      });
    });
  });
});