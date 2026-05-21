import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DoctorReportView } from './DoctorReportView';

describe('DoctorReportView', () => {
  const mockReport = {
    id: '1',
    tool: 'doctor',
    title: 'Product Doctor Scan',
    score: 60,
    summary: 'Found 3 critical issues and 5 warnings',
    payload: {
      data: {
        health_score: 60,
        verdict: 'Ready with conditions',
        summary: 'Found 3 critical issues and 5 warnings',
        gates: [
          { name: 'Build', status: 'RED', message: 'Build errors found' },
          { name: 'Test', status: 'YELLOW', message: 'Some tests failing' },
          { name: 'Security', status: 'GREEN', message: 'No issues found' },
        ],
        issues: [
          { severity: 'critical', title: 'Memory leak in component X', fix: 'Add cleanup in useEffect', file: 'src/component.tsx' },
          { severity: 'high', title: 'Missing error handling', fix: 'Add try-catch blocks', file: 'src/handler.ts' },
        ],
        red_gates: ['Build'],
        yellow_gates: ['Test'],
      },
      markdown: '# Product Doctor\n\nScore: 60',
    },
    created_at: '2024-01-01',
  };

  it('should render verdict', () => {
    render(<DoctorReportView report={mockReport as any} />);
    expect(screen.getByText(/executive verdict/i)).toBeInTheDocument();
  });

  it('should render score', () => {
    render(<DoctorReportView report={mockReport as any} />);
    expect(screen.getByText('60')).toBeInTheDocument();
  });

  it('should render gates', () => {
    render(<DoctorReportView report={mockReport as any} />);
    expect(screen.getAllByText(/build/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/security/i)).toBeInTheDocument();
  });

  it('should show RED gates count', () => {
    render(<DoctorReportView report={mockReport as any} />);
    expect(screen.getByText(/1 RED gate/i)).toBeInTheDocument();
  });

  it('should render summary', () => {
    render(<DoctorReportView report={mockReport as any} />);
    expect(screen.getByText(/found 3 critical issues/i)).toBeInTheDocument();
  });
});
