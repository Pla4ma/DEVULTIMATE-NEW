import { describe, it, expect, vi } from 'vitest';
import { initializeDemoMode, isDemoMode, getDemoUser } from './demo-mode';

describe('demo-mode', () => {
  describe('initializeDemoMode', () => {
    it('should initialize demo mode', () => {
      const result = initializeDemoMode();
      expect(result).toBeDefined();
    });

    it('should return user object', () => {
      const result = initializeDemoMode();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
    });

    it('should return demo-specific email', () => {
      const result = initializeDemoMode();
      expect(result.email).toContain('demo');
    });

    it('should set demo flag', () => {
      initializeDemoMode();
      expect(isDemoMode()).toBe(true);
    });
  });

  describe('isDemoMode', () => {
    it('should return false initially', () => {
      expect(isDemoMode()).toBe(false);
    });

    it('should return true after initialization', () => {
      initializeDemoMode();
      expect(isDemoMode()).toBe(true);
    });
  });

  describe('getDemoUser', () => {
    it('should return demo user', () => {
      const user = getDemoUser();
      expect(user).toBeDefined();
      expect(user?.email).toContain('demo');
    });

    it('should return consistent user', () => {
      const user1 = getDemoUser();
      const user2 = getDemoUser();
      expect(user1?.id).toBe(user2?.id);
    });
  });
});