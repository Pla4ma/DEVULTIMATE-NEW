import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'wouter';
import { CommandPalette } from './CommandPalette';
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

describe('CommandPalette', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not render when closed', () => {
    renderWithProviders(<CommandPalette />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should open on Cmd+K', async () => {
    renderWithProviders(<CommandPalette />);
    
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('should open on Ctrl+K', async () => {
    renderWithProviders(<CommandPalette />);
    
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('should close on Escape', async () => {
    renderWithProviders(<CommandPalette />);
    
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('should show search input', async () => {
    renderWithProviders(<CommandPalette />);
    
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });
  });

  it('should show navigation options', async () => {
    renderWithProviders(<CommandPalette />);
    
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    
    await waitFor(() => {
      expect(screen.getByText(/command center/i)).toBeInTheDocument();
    });
  });

  it('should show tool options', async () => {
    renderWithProviders(<CommandPalette />);
    
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    
    await waitFor(() => {
      expect(screen.getByText(/idea check/i)).toBeInTheDocument();
    });
  });

  it('should filter options based on search', async () => {
    renderWithProviders(<CommandPalette />);
    
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    
    await waitFor(() => {
      const input = screen.getByPlaceholderText(/search/i);
      fireEvent.change(input, { target: { value: 'idea' } });
    });

    await waitFor(() => {
      expect(screen.getByText(/idea check/i)).toBeInTheDocument();
      expect(screen.queryByText(/launch room/i)).not.toBeInTheDocument();
    });
  });

  it('should navigate with keyboard arrows', async () => {
    renderWithProviders(<CommandPalette />);
    
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: 'ArrowDown' });
    fireEvent.keyDown(document, { key: 'ArrowDown' });
    fireEvent.keyDown(document, { key: 'Enter' });

    // Should navigate somewhere (check if URL changed or page renders differently)
    await waitFor(() => {
      // The dialog should be closed after selection
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});