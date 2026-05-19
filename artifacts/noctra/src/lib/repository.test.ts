import { describe, it, expect, vi } from 'vitest';
import { getReports, saveReport, deleteReport, getTasks, createTask, saveTasks, getProjects, getProofSignals, getDashboardData, type Report, type Task, type Project } from './repository';

describe('repository', () => {
  describe('getReports', () => {
    it('should return array of reports', async () => {
      const result = await getReports();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('saveReport', () => {
    it('should save a report', async () => {
      const report = {
        tool: 'idea',
        title: 'Test Report',
        payload: { data: { test: true } },
        score: 80,
        summary: 'Test summary',
      };
      const result = await saveReport(report);
      expect(result).toBeDefined();
    });

    it('should handle null score', async () => {
      const report = {
        tool: 'idea',
        title: 'Test Report',
        payload: { data: { test: true } },
        score: null,
        summary: 'Test',
      };
      const result = await saveReport(report);
      expect(result).toBeDefined();
    });
  });

  describe('deleteReport', () => {
    it('should delete a report', async () => {
      await expect(deleteReport('test-id')).resolves.not.toThrow();
    });
  });

  describe('getTasks', () => {
    it('should return array of tasks', async () => {
      const result = await getTasks();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('createTask', () => {
    it('should create a task', async () => {
      const task = {
        title: 'Test Task',
        detail: 'Test detail',
        priority: 'high',
        category: 'idea',
      };
      const result = await createTask(task);
      expect(result).toBeDefined();
    });
  });

  describe('saveTasks', () => {
    it('should save multiple tasks', async () => {
      const tasks = [
        { title: 'Task 1', priority: 'high', category: 'idea' },
        { title: 'Task 2', priority: 'medium', category: 'mvp' },
      ];
      await expect(saveTasks(tasks)).resolves.not.toThrow();
    });
  });

  describe('getProjects', () => {
    it('should return array of projects', async () => {
      const result = await getProjects();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getProofSignals', () => {
    it('should return array of proof signals', async () => {
      const result = await getProofSignals();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getDashboardData', () => {
    it('should return dashboard data', async () => {
      const result = await getDashboardData();
      expect(result).toBeDefined();
      expect(result).toHaveProperty('reports');
      expect(result).toHaveProperty('tasks');
      expect(result).toHaveProperty('projects');
    });

    it('should include latest scores', async () => {
      const result = await getDashboardData();
      expect(result).toHaveProperty('latestScores');
    });
  });
});