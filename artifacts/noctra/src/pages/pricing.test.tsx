import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PricingPage from './pricing';

vi.mock('@/lib/auth', () => ({
  useAuth: () => ({
    signIn: vi.fn(),
    signUp: vi.fn(),
    signInAnon: vi.fn(),
    signInDemo: vi.fn(),
    user: { id: '1', email: 'test@test.com' },
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

describe('PricingPage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should render pricing title', async () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <PricingPage />
        </QueryClientProvider>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/simple, transparent pricing/i)).toBeInTheDocument();
    });
  });

  it('should display all pricing tiers', async () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <PricingPage />
        </QueryClientProvider>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Starter')).toBeInTheDocument();
      expect(screen.getByText('Pro')).toBeInTheDocument();
      expect(screen.getByText('Team')).toBeInTheDocument();
      expect(screen.getByText('Enterprise')).toBeInTheDocument();
    });
  });

  it('should show free price for Starter', async () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <PricingPage />
        </QueryClientProvider>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Free')).toBeInTheDocument();
    });
  });

  it('should show monthly price for Pro', async () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <PricingPage />
        </QueryClientProvider>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('$29')).toBeInTheDocument();
    });
  });

  it('should display pricing features', async () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <PricingPage />
        </QueryClientProvider>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/unlimited ai analyses/i)).toBeInTheDocument();
      expect(screen.getByText(/email support/i)).toBeInTheDocument();
    });
  });

  it('should toggle billing cycle', async () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <PricingPage />
        </QueryClientProvider>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      const toggle = screen.getByRole('button');
      userEvent.click(toggle);
    });

    await waitFor(() => {
      expect(screen.queryByText(/save 20%/i)).toBeInTheDocument();
    });
  });

  it('should show feature comparison table', async () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <PricingPage />
        </QueryClientProvider>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/feature comparison/i)).toBeInTheDocument();
    });
  });

  it('should show FAQ section', async () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <PricingPage />
        </QueryClientProvider>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/frequently asked questions/i)).toBeInTheDocument();
    });
  });

  it('should toggle FAQ accordion', async () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <PricingPage />
        </QueryClientProvider>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      const faqButton = screen.getByText(/what's included in the free tier?/i);
      userEvent.click(faqButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/perfect for trying out the platform/i)).toBeInTheDocument();
    });
  });

  it('should show contact sales CTA', async () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <PricingPage />
        </QueryClientProvider>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/still have questions?/i)).toBeInTheDocument();
      expect(screen.getByText(/contact sales/i)).toBeInTheDocument();
    });
  });
});