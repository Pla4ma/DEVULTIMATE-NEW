import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MvpReportView } from './MvpReportView';

describe('MvpReportView', () => {
  const mockReport = {
    id: '1',
    tool: 'mvp',
    title: 'MVP Build Plan',
    score: 80,
    summary: '3-phase MVP with 12 features',
    payload: {
      data: {
        phases: [
          { name: 'Phase 1', duration: '2 weeks', features: ['Auth', 'Dashboard'] },
          { name: 'Phase 2', duration: '3 weeks', features: ['API', 'Database'] },
          { name: 'Phase 3', duration: '2 weeks', features: ['UI', 'Testing'] },
        ],
        totalFeatures: 12,
        estimatedDuration: '7 weeks',
        keyDecisions: ['Use React', 'Use PostgreSQL'],
      },
      markdown: '# MVP Plan\n\n3 phases',
    },
    created_at: '2024-01-01',
  };

  it('should render title', () => {
    render(<MvpReportView report={mockReport as any} />);
    expect(screen.getByText(/mvp build plan/i)).toBeInTheDocument();
  });

  it('should render score', () => {
    render(<MvpReportView report={mockReport as any} />);
    expect(screen.getByText('80')).toBeInTheDocument();
  });

  it('should render phases', () => {
    render(<MvpReportView report={mockReport as any} />);
    expect(screen.getByText(/phase 1/i)).toBeInTheDocument();
    expect(screen.getByText(/phase 2/i)).toBeInTheDocument();
    expect(screen.getByText(/phase 3/i)).toBeInTheDocument();
  });

  it('should render total features', () => {
    render(<MvpReportView report={mockReport as any} />);
    expect(screen.getByText(/12 features/i)).toBeInTheDocument();
  });

  it('should render estimated duration', () => {
    render(<MvpReportView report={mockReport as any} />);
    expect(screen.getByText(/7 weeks/i)).toBeInTheDocument();
  });

  it('should render key decisions', () => {
    render(<MvpReportView report={mockReport as any} />);
    expect(screen.getByText(/use react/i)).toBeInTheDocument();
  });

  it('should render summary', () => {
    render(<MvpReportView report={mockReport as any} />);
    expect(screen.getByText(/3-phase mvp/i)).toBeInTheDocument();
  });
});