import { describe, expect, it, vi } from 'vitest';
import { secondsUntilRelease } from './owner-guard';

describe('secondsUntilRelease', () => {
  it('returns 0 when releaseTime is undefined or in the past', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));

    expect(secondsUntilRelease(undefined)).toBe(0);
    expect(secondsUntilRelease(String(Math.floor(Date.now() / 1000) - 60))).toBe(0);

    vi.useRealTimers();
  });

  it('returns ceil seconds until future releaseTime', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));

    const future = String(Math.floor(Date.now() / 1000) + 125);
    expect(secondsUntilRelease(future)).toBe(125);

    vi.useRealTimers();
  });
});
