import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'wouter';
import LandingPage from './landing';

vi.mock('@/lib/auth', () => ({
  useAuth: () => ({
    signIn: vi.fn(),
    signUp: vi.fn(),
    signInAnon: vi.fn(),
    signInDemo: vi.fn(),
    user: null,
  }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabaseConfigError: null,
}));

describe('LandingPage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should render the hero section', async () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/launch readiness/i)).toBeInTheDocument();
    });
  });

  it('should display the nav bar', async () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/features/i)).toBeInTheDocument();
    });
  });

  it('should show stats section', async () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/projects analyzed/i)).toBeInTheDocument();
    });
  });

  it('should display features', async () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/launch readiness scan/i)).toBeInTheDocument();
      expect(screen.getByText(/idea validation/i)).toBeInTheDocument();
    });
  });

  it('should show how it works section', async () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/scan/i)).toBeInTheDocument();
      expect(screen.getByText(/rescan/i)).toBeInTheDocument();
    });
  });

  it('should display integrations', async () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/cursor/i)).toBeInTheDocument();
      expect(screen.getByText(/replit/i)).toBeInTheDocument();
    });
  });

  it('should show testimonials', async () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/testimonials/i)).toBeInTheDocument();
    });
  });

  it('should display auth form', async () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    });
  });

  it('should switch between login and signup tabs', async () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      const signUpButton = screen.getByRole('button', { name: /sign up/i });
      userEvent.click(signUpButton);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });
  });

  it('should have footer', async () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/devultimate/i)).toBeInTheDocument();
    });
  });
});
