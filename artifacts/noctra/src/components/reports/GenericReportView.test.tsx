import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GenericReportView } from './GenericReportView';

describe('GenericReportView', () => {
  const mockReport = {
    id: '1',
    tool: 'idea',
    title: 'Test Report',
    score: 85,
    summary: 'Test summary',
    payload: {
      data: {
        key1: 'value1',
        key2: 'value2',
      },
      markdown: '# Test Report\n\nThis is a test.',
    },
    created_at: '2024-01-01',
  };

  it('should render report title', () => {
    render(<GenericReportView report={mockReport as any} />);
    expect(screen.getByText('Test Report')).toBeInTheDocument();
  });

  it('should render score when present', () => {
    render(<GenericReportView report={mockReport as any} />);
    expect(screen.getByText('85')).toBeInTheDocument();
  });

  it('should render summary', () => {
    render(<GenericReportView report={mockReport as any} />);
    expect(screen.getByText('Test summary')).toBeInTheDocument();
  });

  it('should render markdown content', () => {
    render(<GenericReportView report={mockReport as any} />);
    expect(screen.getByText(/test report/i)).toBeInTheDocument();
  });

  it('should render tool badge', () => {
    render(<GenericReportView report={mockReport as any} />);
    expect(screen.getByText(/idea checker/i)).toBeInTheDocument();
  });

  it('should handle null score', () => {
    const noScoreReport = { ...mockReport, score: null };
    render(<GenericReportView report={noScoreReport as any} />);
    expect(screen.queryByText('null')).not.toBeInTheDocument();
  });

  it('should handle null summary', () => {
    const noSummaryReport = { ...mockReport, summary: null };
    render(<GenericReportView report={noSummaryReport as any} />);
    expect(screen.getByText('Test Report')).toBeInTheDocument();
  });
});