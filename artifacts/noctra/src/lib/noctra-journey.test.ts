import { describe, it, expect } from 'vitest';
import { TOOL_EXAMPLES, PIPELINE } from './noctra-journey';

describe('noctra-journey', () => {
  describe('TOOL_EXAMPLES', () => {
    it('should have examples for idea tool', () => {
      expect(TOOL_EXAMPLES.idea).toBeDefined();
      expect(Array.isArray(TOOL_EXAMPLES.idea)).toBe(true);
    });

    it('should have examples for mvp tool', () => {
      expect(TOOL_EXAMPLES.mvp).toBeDefined();
      expect(Array.isArray(TOOL_EXAMPLES.mvp)).toBe(true);
    });

    it('should have examples for doctor tool', () => {
      expect(TOOL_EXAMPLES.doctor).toBeDefined();
      expect(Array.isArray(TOOL_EXAMPLES.doctor)).toBe(true);
    });

    it('should have examples for launch tool', () => {
      expect(TOOL_EXAMPLES.launch).toBeDefined();
      expect(Array.isArray(TOOL_EXAMPLES.launch)).toBe(true);
    });

    it('should have non-empty example arrays for analysis tools', () => {
      const analysisTools = ['idea', 'reality', 'mvp', 'proof', 'swarm', 'doctor', 'launch', 'twin'];
      analysisTools.forEach((key) => {
        expect(TOOL_EXAMPLES[key as keyof typeof TOOL_EXAMPLES].length).toBeGreaterThan(0);
      });
    });
  });

  describe('PIPELINE', () => {
    it('should be an array with entries', () => {
      expect(Array.isArray(PIPELINE)).toBe(true);
      expect(PIPELINE.length).toBeGreaterThan(0);
    });

    it('should have required properties for each entry', () => {
      PIPELINE.forEach((entry) => {
        expect(entry).toHaveProperty('key');
        expect(entry).toHaveProperty('label');
        expect(entry).toHaveProperty('tool');
        expect(entry).toHaveProperty('hint');
      });
    });

    it('should include all major pipeline stages', () => {
      const labels = PIPELINE.map((e) => e.label);
      expect(labels).toContain('Signal');
      expect(labels).toContain('Build');
      expect(labels).toContain('Launch');
    });
  });
});
