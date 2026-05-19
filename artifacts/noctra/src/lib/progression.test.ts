import { describe, it, expect } from 'vitest';
import { CAPABILITIES, getCapabilityFor, computeCapabilityStatus, computeCoverageScore } from './progression';

describe('progression', () => {
  describe('CAPABILITIES', () => {
    it('should have all 4 phases', () => {
      const phases = CAPABILITIES.map((c) => c.phase);
      expect(phases).toContain('diagnose');
      expect(phases).toContain('validate');
      expect(phases).toContain('build');
      expect(phases).toContain('launch');
    });

    it('should have unique keys', () => {
      const keys = CAPABILITIES.map((c) => c.key);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(CAPABILITIES.length);
    });

    it('should have required properties', () => {
      CAPABILITIES.forEach((c) => {
        expect(c).toHaveProperty('key');
        expect(c).toHaveProperty('label');
        expect(c).toHaveProperty('description');
        expect(c).toHaveProperty('tools');
        expect(Array.isArray(c.tools)).toBe(true);
        expect(c.tools.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getCapabilityFor', () => {
    it('should return the diagnose capability for "idea"', () => {
      const result = getCapabilityFor('idea' as any);
      expect(result?.phase).toBe('diagnose');
    });

    it('should return the diagnose capability for "doctor"', () => {
      const result = getCapabilityFor('doctor' as any);
      expect(result?.phase).toBe('diagnose');
    });

    it('should return the validate capability for "reality"', () => {
      const result = getCapabilityFor('reality' as any);
      expect(result?.phase).toBe('validate');
    });

    it('should return null for unknown tool', () => {
      const result = getCapabilityFor('unknown' as any);
      expect(result).toBeNull();
    });
  });

  describe('computeCapabilityStatus', () => {
    it('should return 0% for empty used tools', () => {
      const result = computeCapabilityStatus(new Set());
      result.forEach((s) => {
        expect(s.percentage).toBe(0);
        expect(s.used).toBe(0);
      });
    });

    it('should return 100% when all tools used', () => {
      const allTools = new Set([
        'idea', 'doctor', 'reality', 'proof', 'swarm', 'mvp', 'twin', 'launch', 'passport',
      ]);
      const result = computeCapabilityStatus(allTools);
      result.forEach((s) => {
        expect(s.used).toBe(s.total);
        expect(s.percentage).toBe(100);
      });
    });

    it('should track partial usage', () => {
      const used = new Set(['idea']);
      const result = computeCapabilityStatus(used);
      const diag = result.find((s) => s.phase === 'diagnose');
      expect(diag).toBeDefined();
      expect(diag!.used).toBe(1);
      expect(diag!.total).toBe(2);
    });
  });

  describe('computeCoverageScore', () => {
    it('should return 0 for empty set', () => {
      expect(computeCoverageScore(new Set())).toBe(0);
    });

    it('should return 100 for all tools', () => {
      const allTools = new Set([
        'idea', 'doctor', 'reality', 'proof', 'swarm', 'mvp', 'twin', 'launch',
      ]);
      expect(computeCoverageScore(allTools)).toBe(100);
    });

    it('should return 25 for 2 out of 8 tools', () => {
      const used = new Set(['idea', 'doctor']);
      expect(computeCoverageScore(used)).toBe(25);
    });
  });
});
