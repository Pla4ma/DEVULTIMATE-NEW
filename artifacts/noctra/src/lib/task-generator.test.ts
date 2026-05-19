import { describe, it, expect } from 'vitest';
import { generateTasksFromReport, generateTasksFromPayload, type Task } from './task-generator';

describe('task-generator', () => {
  describe('generateTasksFromReport', () => {
    it('should generate tasks from idea report', async () => {
      const report = {
        id: '1',
        tool: 'idea',
        payload: {
          data: {
            risks: [
              { title: 'Market validation needed', severity: 'high' },
              { title: 'Competitor analysis incomplete', severity: 'medium' },
            ],
            nextStep: 'Validate with target users',
          },
        },
        project_id: null,
      };
      
      const tasks = await generateTasksFromReport(report as any);
      expect(tasks).toBeDefined();
      expect(Array.isArray(tasks)).toBe(true);
    });

    it('should generate tasks from doctor report', async () => {
      const report = {
        id: '2',
        tool: 'doctor',
        payload: {
          data: {
            issues: [
              { title: 'Critical: Memory leak in component X', severity: 'critical' },
              { title: 'High: Missing error handling', severity: 'high' },
            ],
          },
        },
        project_id: null,
      };
      
      const tasks = await generateTasksFromReport(report as any);
      expect(tasks).toBeDefined();
      expect(tasks.length).toBeGreaterThan(0);
    });

    it('should generate tasks from MVP report', async () => {
      const report = {
        id: '3',
        tool: 'mvp',
        payload: {
          data: {
            phases: [
              { name: 'Phase 1', tasks: ['Build API', 'Create UI'] },
            ],
          },
        },
        project_id: null,
      };
      
      const tasks = await generateTasksFromReport(report as any);
      expect(tasks).toBeDefined();
      expect(Array.isArray(tasks)).toBe(true);
    });

    it('should handle null payload', async () => {
      const report = {
        id: '4',
        tool: 'idea',
        payload: null,
        project_id: null,
      };
      
      const tasks = await generateTasksFromReport(report as any);
      expect(tasks).toEqual([]);
    });
  });

  describe('generateTasksFromPayload', () => {
    it('should extract tasks from risks array', () => {
      const payload = {
        data: {
          risks: [
            { title: 'Risk 1', severity: 'high' },
            { title: 'Risk 2', severity: 'medium' },
          ],
        },
      };
      
      const tasks = generateTasksFromPayload('idea', payload as any);
      expect(tasks.length).toBeGreaterThanOrEqual(2);
    });

    it('should extract tasks from issues array', () => {
      const payload = {
        data: {
          issues: [
            { title: 'Issue 1', severity: 'critical' },
            { title: 'Issue 2', severity: 'high' },
          ],
        },
      };
      
      const tasks = generateTasksFromPayload('doctor', payload as any);
      expect(tasks.length).toBeGreaterThanOrEqual(2);
    });

    it('should prioritize by severity', () => {
      const payload = {
        data: {
          risks: [
            { title: 'Low risk', severity: 'low' },
            { title: 'Critical risk', severity: 'critical' },
          ],
        },
      };
      
      const tasks = generateTasksFromPayload('idea', payload as any);
      const criticalTask = tasks.find(t => t.priority === 'critical');
      expect(criticalTask).toBeDefined();
    });
  });
});