import { describe, it, expect } from 'vitest';
import { cn, truncate, slugify, formatRelativeTime, getInitials, generateId } from './utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      const result = cn('foo', 'bar');
      expect(result).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      const result = cn('foo', false && 'bar', 'baz');
      expect(result).toBe('foo baz');
    });

    it('should handle arrays', () => {
      const result = cn(['foo', 'bar'], 'baz');
      expect(result).toBe('foo bar baz');
    });

    it('should handle objects', () => {
      const result = cn({ foo: true, bar: false, baz: true });
      expect(result).toBe('foo baz');
    });

    it('should handle mixed inputs', () => {
      const result = cn('foo', { bar: true, baz: false }, ['qux']);
      expect(result).toBe('foo bar qux');
    });
  });

  describe('truncate', () => {
    it('should not truncate short strings', () => {
      const result = truncate('hello', 10);
      expect(result).toBe('hello');
    });

    it('should truncate long strings with ellipsis', () => {
      const result = truncate('hello world', 5);
      expect(result).toBe('hello...');
    });

    it('should handle exact length', () => {
      const result = truncate('hello', 5);
      expect(result).toBe('hello');
    });

    it('should handle custom ellipsis', () => {
      const result = truncate('hello world', 5, '>>');
      expect(result).toBe('hello>>');
    });
  });

  describe('slugify', () => {
    it('should convert to lowercase', () => {
      const result = slugify('Hello World');
      expect(result).toBe('hello-world');
    });

    it('should replace spaces with hyphens', () => {
      const result = slugify('hello world test');
      expect(result).toBe('hello-world-test');
    });

    it('should remove special characters', () => {
      const result = slugify('hello@world!test');
      expect(result).toBe('hello-world-test');
    });

    it('should handle multiple spaces', () => {
      const result = slugify('hello   world');
      expect(result).toBe('hello-world');
    });

    it('should handle empty string', () => {
      const result = slugify('');
      expect(result).toBe('');
    });
  });

  describe('formatRelativeTime', () => {
    it('should return "just now" for recent times', () => {
      const now = new Date();
      const result = formatRelativeTime(now);
      expect(result).toBe('just now');
    });

    it('should return minutes ago for times within an hour', () => {
      const date = new Date(Date.now() - 30 * 60 * 1000);
      const result = formatRelativeTime(date);
      expect(result).toContain('minutes ago');
    });

    it('should return hours ago for times within a day', () => {
      const date = new Date(Date.now() - 5 * 60 * 60 * 1000);
      const result = formatRelativeTime(date);
      expect(result).toContain('hours ago');
    });

    it('should return days ago for times within a week', () => {
      const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const result = formatRelativeTime(date);
      expect(result).toContain('days ago');
    });
  });

  describe('getInitials', () => {
    it('should return first letter of single word', () => {
      const result = getInitials('hello');
      expect(result).toBe('HE');
    });

    it('should return first letters of two words', () => {
      const result = getInitials('hello world');
      expect(result).toBe('HW');
    });

    it('should return first letters of multiple words', () => {
      const result = getInitials('hello world test');
      expect(result).toBe('HW');
    });

    it('should handle empty string', () => {
      const result = getInitials('');
      expect(result).toBe('');
    });
  });

  describe('generateId', () => {
    it('should return a string', () => {
      const result = generateId();
      expect(typeof result).toBe('string');
    });

    it('should return non-empty string', () => {
      const result = generateId();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should generate unique ids', () => {
      const ids = new Set([generateId(), generateId(), generateId()]);
      expect(ids.size).toBe(3);
    });
  });
});