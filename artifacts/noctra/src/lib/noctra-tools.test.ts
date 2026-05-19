import { describe, it, expect } from 'vitest';
import { TOOLS, TOOL_BY_KEY, TOOL_GROUPS, GROUP_DESCRIPTION } from './noctra-tools';

describe('noctra-tools', () => {
  describe('TOOLS', () => {
    it('should have at least 5 tools defined', () => {
      expect(TOOLS.length).toBeGreaterThanOrEqual(5);
    });

    it('should have required properties for each tool', () => {
      TOOLS.forEach((tool) => {
        expect(tool).toHaveProperty('key');
        expect(tool).toHaveProperty('label');
        expect(tool).toHaveProperty('accent');
        expect(tool).toHaveProperty('icon');
        expect(tool).toHaveProperty('group');
        expect(tool).toHaveProperty('route');
      });
    });

    it('should have unique keys for each tool', () => {
      const keys = TOOLS.map((t) => t.key);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });

    it('should have unique routes for each tool', () => {
      const routes = TOOLS.map((t) => t.route);
      const uniqueRoutes = new Set(routes);
      expect(uniqueRoutes.size).toBe(routes.length);
    });

    it('should have dashboard as the first tool', () => {
      expect(TOOLS[0].key).toBe('dashboard');
      expect(TOOLS[0].route).toBe('/app');
    });
  });

  describe('TOOL_BY_KEY', () => {
    it('should have entries for all tool keys', () => {
      TOOLS.forEach((tool) => {
        expect(TOOL_BY_KEY[tool.key]).toBeDefined();
      });
    });

    it('should return correct tool for known keys', () => {
      expect(TOOL_BY_KEY['idea']?.label).toBe('Idea Checker');
      expect(TOOL_BY_KEY['doctor']?.label).toBe('Project Doctor');
      expect(TOOL_BY_KEY['mvp']?.label).toBe('MVP Planner');
    });

    it('should return undefined for unknown keys', () => {
      expect(TOOL_BY_KEY['unknown-tool']).toBeUndefined();
    });
  });

  describe('TOOL_GROUPS', () => {
    it('should include Core group', () => {
      expect(TOOL_GROUPS).toContain('Core');
    });

    it('should be an array of strings', () => {
      TOOL_GROUPS.forEach((group) => {
        expect(typeof group).toBe('string');
      });
    });

    it('should not have duplicates', () => {
      const unique = new Set(TOOL_GROUPS);
      expect(unique.size).toBe(TOOL_GROUPS.length);
    });
  });

  describe('GROUP_DESCRIPTION', () => {
    it('should have descriptions for all groups', () => {
      TOOL_GROUPS.forEach((group) => {
        expect(GROUP_DESCRIPTION[group]).toBeDefined();
        expect(typeof GROUP_DESCRIPTION[group]).toBe('string');
      });
    });
  });

  describe('Tool properties', () => {
    it('should have valid accent colors', () => {
      const validColors = ['var(--noctra-cyan)', 'var(--noctra-rose)', 'var(--noctra-violet)', 'var(--noctra-emerald)', 'var(--noctra-amber)', 'var(--noctra-text-soft)', 'var(--noctra-magenta)', 'var(--noctra-gold)'];
      TOOLS.forEach((tool) => {
        expect(validColors).toContain(tool.accent);
      });
    });

    it('should have routes starting with /app', () => {
      TOOLS.forEach((tool) => {
        expect(tool.route).toMatch(/^\/app/);
      });
    });
  });
});