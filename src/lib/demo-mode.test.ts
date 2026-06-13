import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { isDemoMode } from './demo-mode';

describe('isDemoMode', () => {
  const originalHref = window.location.href;

  beforeEach(() => {
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    window.history.replaceState({}, '', originalHref);
  });

  it('returns false without query param', () => {
    expect(isDemoMode()).toBe(false);
  });

  it('returns true when demo=1', () => {
    window.history.replaceState({}, '', '/?demo=1');
    expect(isDemoMode()).toBe(true);
  });
});
