import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './auth';

describe('auth', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('should provide auth context', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current).toBeDefined();
  });

  it('should have signIn function', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(typeof result.current.signIn).toBe('function');
  });

  it('should have signUp function', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(typeof result.current.signUp).toBe('function');
  });

  it('should have signOut function', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(typeof result.current.signOut).toBe('function');
  });

  it('should have signInAnon function', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(typeof result.current.signInAnon).toBe('function');
  });

  it('should have signInDemo function', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(typeof result.current.signInDemo).toBe('function');
  });

  it('should have loading state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(typeof result.current.loading).toBe('boolean');
  });

  it('should have user state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
  });

  it('should have error state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.error).toBeNull();
  });
});