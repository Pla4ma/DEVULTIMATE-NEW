import { describe, it, expect } from 'vitest';
import { analyzeAlignment, generateAlignmentReport, type AlignmentResult } from './codebase-alignment';

describe('codebase-alignment', () => {
  const mockCodebase = {
    files: [
      { path: 'src/index.ts', type: 'typescript', lines: 100 },
      { path: 'src/App.tsx', type: 'tsx', lines: 200 },
      { path: 'package.json', type: 'json', lines: 50 },
    ],
    framework: 'react',
    language: 'typescript',
  };

  const mockMvpReport = {
    id: '1',
    tool: 'mvp',
    payload: {
      data: {
        features: ['auth', 'dashboard', 'api'],
        techStack: ['react', 'typescript'],
      },
    },
  };

  describe('analyzeAlignment', () => {
    it('should return alignment result', () => {
      const result = analyzeAlignment(mockCodebase as any, mockMvpReport as any);
      expect(result).toBeDefined();
    });

    it('should include alignment score', () => {
      const result = analyzeAlignment(mockCodebase as any, mockMvpReport as any);
      expect(result.score).toBeDefined();
      expect(typeof result.score).toBe('number');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should include matched features', () => {
      const result = analyzeAlignment(mockCodebase as any, mockMvpReport as any);
      expect(result.matchedFeatures).toBeDefined();
      expect(Array.isArray(result.matchedFeatures)).toBe(true);
    });

    it('should include missing features', () => {
      const result = analyzeAlignment(mockCodebase as any, mockMvpReport as any);
      expect(result.missingFeatures).toBeDefined();
      expect(Array.isArray(result.missingFeatures)).toBe(true);
    });

    it('should include recommendations', () => {
      const result = analyzeAlignment(mockCodebase as any, mockMvpReport as any);
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
  });

  describe('generateAlignmentReport', () => {
    it('should return null for empty inputs', () => {
      const result = generateAlignmentReport({} as any, {} as any);
      expect(result).toBeNull();
    });

    it('should generate report with summary', () => {
      const result = generateAlignmentReport(mockCodebase as any, mockMvpReport as any);
      expect(result).not.toBeNull();
      expect(result?.summary).toBeDefined();
    });

    it('should include action items', () => {
      const result = generateAlignmentReport(mockCodebase as any, mockMvpReport as any);
      expect(result?.actionItems).toBeDefined();
      expect(Array.isArray(result?.actionItems)).toBe(true);
    });

    it('should include file analysis', () => {
      const result = generateAlignmentReport(mockCodebase as any, mockMvpReport as any);
      expect(result?.fileAnalysis).toBeDefined();
    });
  });
});