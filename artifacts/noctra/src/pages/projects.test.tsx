import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/auth';
import { ProgressionProvider } from '@/lib/progression-context';
import ProjectsPage from './projects';

vi.mock('@/lib/repository', () => ({
  getProjects: vi.fn().mockResolvedValue([
    { id: '1', name: 'Project Alpha', stage: 'ideation', created_at: '2024-01-01' },
    { id: '2', name: 'Project Beta', stage: 'execution', created_at: '2024-01-02' },
  ]),
  createProject: vi.fn().mockResolvedValue({ id: '3', name: 'New Project' }),
  deleteProject: vi.fn().mockResolvedValue({}),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

describe('ProjectsPage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should render projects page', async () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ProgressionProvider>
              <ProjectsPage />
            </ProgressionProvider>
          </AuthProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/projects/i)).toBeInTheDocument();
    });
  });

  it('should render project list', async () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ProgressionProvider>
              <ProjectsPage />
            </ProgressionProvider>
          </AuthProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
      expect(screen.getByText('Project Beta')).toBeInTheDocument();
    });
  });

  it('should render stage badges', async () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ProgressionProvider>
              <ProjectsPage />
            </ProgressionProvider>
          </AuthProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/ideation/i)).toBeInTheDocument();
      expect(screen.getByText(/execution/i)).toBeInTheDocument();
    });
  });

  it('should have create project button', async () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ProgressionProvider>
              <ProjectsPage />
            </ProgressionProvider>
          </AuthProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/create project/i)).toBeInTheDocument();
    });
  });
});