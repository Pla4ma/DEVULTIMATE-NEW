import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/auth';
import { ProgressionProvider } from '@/lib/progression-context';
import TasksPage from './tasks';

vi.mock('@/lib/repository', () => ({
  getTasks: vi.fn().mockResolvedValue([
    { id: '1', title: 'Task 1', status: 'todo', priority: 'high', category: 'idea' },
    { id: '2', title: 'Task 2', status: 'done', priority: 'medium', category: 'mvp' },
  ]),
  createTask: vi.fn().mockResolvedValue({ id: '3' }),
  updateTask: vi.fn().mockResolvedValue({}),
  deleteTask: vi.fn().mockResolvedValue({}),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

describe('TasksPage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should render tasks page', async () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ProgressionProvider>
              <TasksPage />
            </ProgressionProvider>
          </AuthProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/tasks/i)).toBeInTheDocument();
    });
  });

  it('should render task list', async () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ProgressionProvider>
              <TasksPage />
            </ProgressionProvider>
          </AuthProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
    });
  });

  it('should render priority badges', async () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ProgressionProvider>
              <TasksPage />
            </ProgressionProvider>
          </AuthProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/high/i)).toBeInTheDocument();
    });
  });

  it('should render status indicators', async () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ProgressionProvider>
              <TasksPage />
            </ProgressionProvider>
          </AuthProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/todo/i)).toBeInTheDocument();
      expect(screen.getByText(/done/i)).toBeInTheDocument();
    });
  });
});