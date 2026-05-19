import { describe, it, expect } from 'vitest';
import { generateRoadmap, type Roadmap, type RoadmapItem } from './roadmap';

describe('roadmap', () => {
  const mockReports = [
    { id: '1', tool: 'idea', score: 75, created_at: '2024-01-01', payload: {} },
    { id: '2', tool: 'mvp', score: 80, created_at: '2024-01-02', payload: {} },
  ];

  const mockTasks = [
    { id: '1', status: 'todo', priority: 'high', title: 'Task 1', category: 'idea' },
    { id: '2', status: 'done', priority: 'medium', title: 'Task 2', category: 'mvp' },
  ];

  const mockProofSignals = [
    { id: '1', kind: 'validation', label: 'Signal 1' },
  ];

  describe('generateRoadmap', () => {
    it('should return null for empty inputs', () => {
      const result = generateRoadmap({ reports: [], tasks: [], proofSignals: [] });
      expect(result).toBeNull();
    });

    it('should generate roadmap with now items', () => {
      const result = generateRoadmap({
        reports: mockReports as any,
        tasks: mockTasks as any,
        proofSignals: mockProofSignals as any,
      });
      expect(result).not.toBeNull();
      expect(result?.now).toBeDefined();
      expect(Array.isArray(result?.now)).toBe(true);
    });

    it('should generate roadmap with next items', () => {
      const result = generateRoadmap({
        reports: mockReports as any,
        tasks: mockTasks as any,
        proofSignals: mockProofSignals as any,
      });
      expect(result?.next).toBeDefined();
      expect(Array.isArray(result?.next)).toBe(true);
    });

    it('should generate roadmap with later items', () => {
      const result = generateRoadmap({
        reports: mockReports as any,
        tasks: mockTasks as any,
        proofSignals: mockProofSignals as any,
      });
      expect(result?.later).toBeDefined();
      expect(Array.isArray(result?.later)).toBe(true);
    });

    it('should include recommended sprint', () => {
      const result = generateRoadmap({
        reports: mockReports as any,
        tasks: mockTasks as any,
        proofSignals: mockProofSignals as any,
      });
      expect(result?.recommendedSprint).toBeDefined();
    });

    it('should prioritize critical items', () => {
      const tasksWithCritical = [
        { id: '1', status: 'todo', priority: 'critical', title: 'Critical task', category: 'doctor' },
        { id: '2', status: 'todo', priority: 'low', title: 'Low task', category: 'idea' },
      ];
      const result = generateRoadmap({
        reports: mockReports as any,
        tasks: tasksWithCritical as any,
        proofSignals: mockProofSignals as any,
      });
      
      const criticalItems = result?.now.filter((i) => i.priority === 'critical');
      expect(criticalItems?.length).toBeGreaterThan(0);
    });

    it('should identify blockers', () => {
      const doctorReport = [
        { id: '1', tool: 'doctor', score: 40, created_at: '2024-01-01', payload: { data: { gates: [{ name: 'Build', status: 'RED' }] } } },
      ];
      const result = generateRoadmap({
        reports: doctorReport as any,
        tasks: [] as any,
        proofSignals: [],
      });
      
      const blockers = result?.now.filter((i) => i.isBlocker);
      expect(blockers?.length).toBeGreaterThan(0);
    });
  });

  describe('RoadmapItem structure', () => {
    it('should have required properties', () => {
      const result = generateRoadmap({
        reports: mockReports as any,
        tasks: mockTasks as any,
        proofSignals: mockProofSignals as any,
      });
      
      if (result?.now.length) {
        const item = result.now[0];
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('title');
        expect(item).toHaveProperty('reason');
        expect(item).toHaveProperty('priority');
        expect(item).toHaveProperty('tool');
      }
    });
  });
});