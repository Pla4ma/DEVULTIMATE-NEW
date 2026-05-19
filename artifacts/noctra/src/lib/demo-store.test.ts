import { describe, it, expect, vi, beforeEach } from 'vitest';
import { demoStore, setDemoData, getDemoData, clearDemoData, type DemoState } from './demo-store';

describe('demo-store', () => {
  beforeEach(() => {
    clearDemoData();
  });

  describe('demoStore', () => {
    it('should have initial state', () => {
      const state = demoStore.getState();
      expect(state).toBeDefined();
      expect(state).toHaveProperty('reports');
      expect(state).toHaveProperty('tasks');
      expect(state).toHaveProperty('projects');
    });

    it('should subscribe to changes', () => {
      const callback = vi.fn();
      const unsubscribe = demoStore.subscribe(callback);
      
      setDemoData({ reports: [{ id: '1' }] as any });
      
      expect(callback).toHaveBeenCalled();
      unsubscribe();
    });

    it('should update state with setDemoData', () => {
      const reports = [{ id: '1', tool: 'idea', score: 80 }];
      setDemoData({ reports: reports as any });
      
      const state = demoStore.getState();
      expect(state.reports).toEqual(reports);
    });
  });

  describe('getDemoData', () => {
    it('should return current state', () => {
      const data = getDemoData();
      expect(data).toBeDefined();
    });

    it('should return reports from state', () => {
      setDemoData({ reports: [{ id: '1' }] as any });
      const data = getDemoData();
      expect(data.reports).toHaveLength(1);
    });

    it('should return tasks from state', () => {
      setDemoData({ tasks: [{ id: '1', title: 'Task 1' }] as any });
      const data = getDemoData();
      expect(data.tasks).toHaveLength(1);
    });

    it('should return projects from state', () => {
      setDemoData({ projects: [{ id: '1', name: 'Project 1' }] as any });
      const data = getDemoData();
      expect(data.projects).toHaveLength(1);
    });
  });

  describe('clearDemoData', () => {
    it('should clear all data', () => {
      setDemoData({ reports: [{ id: '1' }] as any } as Partial<DemoState>);
      clearDemoData();
      
      const state = demoStore.getState();
      expect(state.reports).toEqual([]);
      expect(state.tasks).toEqual([]);
      expect(state.projects).toEqual([]);
    });

    it('should reset to initial state', () => {
      clearDemoData();
      const state = demoStore.getState();
      expect(state.reports).toEqual([]);
      expect(state.tasks).toEqual([]);
    });
  });
});