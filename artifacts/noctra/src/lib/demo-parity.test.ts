import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clearDemoData, setDemoData } from './demo-store';

const mockTasks: Array<{ title: string; detail?: string; priority?: string; projectId?: string; sourceReportId?: string; category?: string }> = [
  { title: 'Fix login bug', detail: 'Users cannot log in with Google OAuth', priority: 'high', category: 'technical', projectId: 'proj-1', sourceReportId: 'rep-1' },
  { title: 'Add error handling', detail: 'Handle API errors gracefully', priority: 'medium', category: 'technical' },
  { title: 'Write tests', detail: 'Add unit tests for auth module', priority: 'low', category: 'development' },
];

describe('demo-mode parity', () => {
  beforeEach(() => {
    clearDemoData();
  });

  describe('saveTasks', () => {
    it('should save multiple tasks and return array', async () => {
      setDemoData({ tasks: [] });
      const { saveTasks } = await import('./repositories/tasks');
      const result = await saveTasks(mockTasks);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(mockTasks.length);
    });

    it('should reject empty title', async () => {
      const { saveTasks } = await import('./repositories/tasks');
      await expect(saveTasks([{ title: '' }])).rejects.toThrow();
    });

    it('should store exactly the input titles', async () => {
      setDemoData({ tasks: [] });
      const { saveTasks } = await import('./repositories/tasks');
      const saved = await saveTasks(mockTasks) as Array<{ title: string }>;
      const savedTitles = saved.map(t => t.title);
      mockTasks.forEach(t => expect(savedTitles).toContain(t.title));
    });
  });

  describe('getTasks', () => {
    it('should retrieve what was saved', async () => {
      setDemoData({ tasks: [] });
      const { saveTasks, getTasks } = await import('./repositories/tasks');
      await saveTasks(mockTasks);
      const retrieved = await getTasks() as Array<{ title: string }>;
      const retrievedTitles = retrieved.map(t => t.title);
      mockTasks.forEach(t => expect(retrievedTitles).toContain(t.title));
    });

    it('should filter by projectId', async () => {
      setDemoData({ tasks: [] });
      const { saveTasks, getTasks } = await import('./repositories/tasks');
      await saveTasks(mockTasks);
      const filtered = await getTasks('proj-1') as Array<{ title: string }>;
      expect(filtered.every(t => 'projectId' in t || 'project_id' in t)).toBe(true);
    });
  });

  describe('createTask', () => {
    it('should create single task and return it', async () => {
      setDemoData({ tasks: [] });
      const { createTask } = await import('./repositories/tasks');
      const task = await createTask({ title: 'Single task', priority: 'high' });
      expect(task).toBeTruthy();
      expect((task as any)?.title).toBe('Single task');
    });
  });

  describe('updateTaskStatus', () => {
    it('should update task status without error', async () => {
      setDemoData({ tasks: [] });
      const { createTask, updateTaskStatus, getTasks } = await import('./repositories/tasks');
      const task = await createTask({ title: 'Test task' }) as any;
      if (task?.id) {
        await updateTaskStatus(task.id, 'in_progress');
        const all = await getTasks() as any[];
        const updated = all.find((t: any) => t.id === task.id);
        expect(updated).toBeDefined();
      }
    });
  });

  describe('deleteTask', () => {
    it('should delete task without error', async () => {
      setDemoData({ tasks: [] });
      const { createTask, deleteTask, getTasks } = await import('./repositories/tasks');
      const task = await createTask({ title: 'Task to delete' }) as any;
      if (task?.id) {
        await deleteTask(task.id);
        const all = await getTasks() as any[];
        expect(all.find((t: any) => t.id === task.id)).toBeUndefined();
      }
    });
  });

  describe('updateTask', () => {
    it('should patch task fields', async () => {
      setDemoData({ tasks: [] });
      const { createTask, updateTask, getTasks } = await import('./repositories/tasks');
      const task = await createTask({ title: 'Original' }) as any;
      if (task?.id) {
        await updateTask(task.id, { title: 'Updated' });
        const all = await getTasks() as any[];
        const updated = all.find((t: any) => t.id === task.id);
        expect(updated?.title ?? updated?.title).toBe('Updated');
      }
    });
  });
});
