import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'wouter';
import { AppShell } from './AppShell';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/auth';
import { ProgressionProvider } from '@/lib/progression-context';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ProgressionProvider>
          <MemoryRouter>
            {component}
          </MemoryRouter>
        </ProgressionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('AppShell', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should render children', () => {
    renderWithProviders(
      <AppShell>
        <div data-testid="test-content">Test Content</div>
      </AppShell>
    );
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('should render logo', () => {
    renderWithProviders(<AppShell><div>Content</div></AppShell>);
    expect(screen.getByText('DEVULTIMATE')).toBeInTheDocument();
  });

  it('should render navigation items', () => {
    renderWithProviders(<AppShell><div>Content</div></AppShell>);
    expect(screen.getByText(/launch cockpit/i)).toBeInTheDocument();
  });

  it('should render product doctor navigation', () => {
    renderWithProviders(<AppShell><div>Content</div></AppShell>);
    expect(screen.getByText(/product doctor/i)).toBeInTheDocument();
  });

  it('should render sign out button', () => {
    renderWithProviders(<AppShell><div>Content</div></AppShell>);
    expect(screen.getByText(/sign out/i)).toBeInTheDocument();
  });

  it('should render command palette hint', () => {
    renderWithProviders(<AppShell><div>Content</div></AppShell>);
    expect(screen.getByText(/command palette/i)).toBeInTheDocument();
  });
});
