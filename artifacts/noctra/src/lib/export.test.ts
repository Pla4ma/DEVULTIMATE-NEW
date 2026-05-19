import { describe, it, expect, vi } from 'vitest';
import { downloadMarkdown, reportToMarkdown } from './export';

describe('export', () => {
  const mockReport = {
    id: '1',
    tool: 'idea',
    title: 'Test Report',
    score: 85,
    summary: 'This is a test summary',
    payload: {
      data: {
        signal: 85,
        verdict: 'Strong signal',
        risks: ['Risk 1', 'Risk 2'],
        nextStep: 'Proceed to MVP',
      },
    },
    created_at: '2024-01-01T00:00:00Z',
  };

  describe('reportToMarkdown', () => {
    it('should convert report to markdown string', () => {
      const result = reportToMarkdown(mockReport as any);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include report title', () => {
      const result = reportToMarkdown(mockReport as any);
      expect(result).toContain('Test Report');
    });

    it('should include tool name', () => {
      const result = reportToMarkdown(mockReport as any);
      expect(result).toContain('Idea Checker');
    });

    it('should include score when present', () => {
      const result = reportToMarkdown(mockReport as any);
      expect(result).toContain('85');
    });

    it('should include summary', () => {
      const result = reportToMarkdown(mockReport as any);
      expect(result).toContain('test summary');
    });

    it('should handle report without score', () => {
      const reportWithoutScore = { ...mockReport, score: null };
      const result = reportToMarkdown(reportWithoutScore as any);
      expect(result).toContain('Test Report');
    });

    it('should handle report without summary', () => {
      const reportWithoutSummary = { ...mockReport, summary: null };
      const result = reportToMarkdown(reportWithoutSummary as any);
      expect(result).toContain('Test Report');
    });

    it('should handle malformed payload', () => {
      const malformedReport = { ...mockReport, payload: null };
      const result = reportToMarkdown(malformedReport as any);
      expect(typeof result).toBe('string');
    });
  });

  describe('downloadMarkdown', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should create a download link', () => {
      const mockCreateElement = vi.spyOn(document, 'createElement');
      const mockAppendChild = vi.spyOn(document.body, 'appendChild');
      const mockRemoveChild = vi.spyOn(document.body, 'removeChild');
      const mockClick = vi.fn();
      const mockRevokeObjectURL = vi.spyOn(URL, 'revokeObjectURL');

      const mockLink = {
        href: '',
        download: '',
        click: mockClick,
        remove: vi.fn(),
      };

      mockCreateElement.mockReturnValue(mockLink as any);

      downloadMarkdown('test-file', '# Test Content');

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();

      mockCreateElement.mockRestore();
      mockAppendChild.mockRestore();
      mockRemoveChild.mockRestore();
      mockRevokeObjectURL.mockRestore();
    });
  });
});