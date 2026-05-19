import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DoctorReportView } from './DoctorReportView';

describe('DoctorReportView', () => {
  const mockReport = {
    id: '1',
    tool: 'doctor',
    title: 'Project Doctor Scan',
    score: 60,
    summary: 'Found 3 critical issues and 5 warnings',
    payload: {
      data: {
        score: 60,
        gates: [
          { name: 'Build', status: 'RED', message: 'Build errors found' },
          { name: 'Test', status: 'YELLOW', message: 'Some tests failing' },
          { name: 'Security', status: 'GREEN', message: 'No issues found' },
        ],
        issues: [
          { severity: 'critical', title: 'Memory leak in component X', fix: 'Add cleanup in useEffect' },
          { severity: 'high', title: 'Missing error handling', fix: 'Add try-catch blocks' },
        ],
        summary: 'Found 3 critical issues and 5 warnings',
      },
      markdown: '# Project Doctor\n\nScore: 60',
    },
    created_at: '2024-01-01',
  };

  it('should render title', () => {
    render(<DoctorReportView report={mockReport as any} />);
    expect(screen.getByText(/project doctor/i)).toBeInTheDocument();
  });

  it('should render score', () => {
    render(<DoctorReportView report={mockReport as any} />);
    expect(screen.getByText('60')).toBeInTheDocument();
  });

  it('should render gates', () => {
    render(<DoctorReportView report={mockReport as any} />);
    expect(screen.getByText(/build/i)).toBeInTheDocument();
    expect(screen.getByText(/test/i)).toBeInTheDocument();
    expect(screen.getByText(/security/i)).toBeInTheDocument();
  });

  it('should render issues', () => {
    render(<DoctorReportView report={mockReport as any} />);
    expect(screen.getByText(/memory leak/i)).toBeInTheDocument();
    expect(screen.getByText(/missing error handling/i)).toBeInTheDocument();
  });

  it('should show RED gates count', () => {
    render(<DoctorReportView report={mockReport as any} />);
    expect(screen.getByText(/1 failed gate/i)).toBeInTheDocument();
  });

  it('should render summary', () => {
    render(<DoctorReportView report={mockReport as any} />);
    expect(screen.getByText(/found 3 critical issues/i)).toBeInTheDocument();
  });
});