import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IdeaReportView } from './IdeaReportView';

describe('IdeaReportView', () => {
  const mockReport = {
    id: '1',
    tool: 'idea',
    title: 'Signal Scan — Test Idea',
    score: 85,
    summary: 'Strong signal with some risks identified',
    payload: {
      data: {
        signal: 85,
        verdict: 'Strong signal',
        strengths: ['Strong market fit', 'Clear value proposition'],
        risks: ['Market acceptance unknown', 'Competition exists'],
        nextStep: 'Validate with target users',
      },
      markdown: '# Signal Scan\n\nScore: 85',
    },
    created_at: '2024-01-01',
  };

  it('should render title', () => {
    render(<IdeaReportView report={mockReport as any} />);
    expect(screen.getByText(/signal scan/i)).toBeInTheDocument();
  });

  it('should render score', () => {
    render(<IdeaReportView report={mockReport as any} />);
    expect(screen.getByText('85')).toBeInTheDocument();
  });

  it('should render verdict', () => {
    render(<IdeaReportView report={mockReport as any} />);
    expect(screen.getByText(/strong signal/i)).toBeInTheDocument();
  });

  it('should render strengths', () => {
    render(<IdeaReportView report={mockReport as any} />);
    expect(screen.getByText(/strong market fit/i)).toBeInTheDocument();
  });

  it('should render risks', () => {
    render(<IdeaReportView report={mockReport as any} />);
    expect(screen.getByText(/market acceptance unknown/i)).toBeInTheDocument();
  });

  it('should render next step', () => {
    render(<IdeaReportView report={mockReport as any} />);
    expect(screen.getByText(/validate with target users/i)).toBeInTheDocument();
  });

  it('should render summary', () => {
    render(<IdeaReportView report={mockReport as any} />);
    expect(screen.getByText(/strong signal with some risks identified/i)).toBeInTheDocument();
  });
});