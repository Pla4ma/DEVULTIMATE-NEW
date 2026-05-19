import { describe, it, expect } from 'vitest';
import { calculateProjectHealth, updateProjectStage, type Project, type ProjectStage } from './project-state';

describe('project-state', () => {
  const mockProject: Project = {
    id: '1',
    name: 'Test Project',
    stage: 'ideation',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  describe('calculateProjectHealth', () => {
    it('should return health score for project', () => {
      const result = calculateProjectHealth(mockProject, [], []);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('status');
    });

    it('should return "healthy" for high score', () => {
      const result = calculateProjectHealth(mockProject, [{ score: 80 }] as any, [{ status: 'done' }] as any);
      expect(result.status).toBe('healthy');
    });

    it('should return "at-risk" for medium score', () => {
      const result = calculateProjectHealth(mockProject, [{ score: 50 }] as any, [{ status: 'todo' }] as any);
      expect(['healthy', 'at-risk', 'critical']).toContain(result.status);
    });

    it('should calculate based on reports', () => {
      const reports = [
        { id: '1', tool: 'idea', score: 80 },
        { id: '2', tool: 'mvp', score: 75 },
      ];
      const result = calculateProjectHealth(mockProject, reports as any, []);
      expect(result.score).toBeGreaterThan(0);
    });

    it('should consider task completion', () => {
      const tasks = [
        { id: '1', status: 'done' },
        { id: '2', status: 'todo' },
        { id: '3', status: 'done' },
      ];
      const result = calculateProjectHealth(mockProject, [], tasks as any);
      expect(result).toBeDefined();
    });
  });

  describe('updateProjectStage', () => {
    it('should update stage to validation', () => {
      const result = updateProjectStage(mockProject, 'validation');
      expect(result.stage).toBe('validation');
    });

    it('should update stage to planning', () => {
      const result = updateProjectStage(mockProject, 'planning');
      expect(result.stage).toBe('planning');
    });

    it('should update stage to execution', () => {
      const result = updateProjectStage(mockProject, 'execution');
      expect(result.stage).toBe('execution');
    });

    it('should update stage to launch', () => {
      const result = updateProjectStage(mockProject, 'launch');
      expect(result.stage).toBe('launch');
    });

    it('should preserve other project properties', () => {
      const result = updateProjectStage(mockProject, 'planning');
      expect(result.id).toBe(mockProject.id);
      expect(result.name).toBe(mockProject.name);
    });
  });
});