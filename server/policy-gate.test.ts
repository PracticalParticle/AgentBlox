import { afterEach, describe, expect, it, vi } from 'vitest';

describe('resolvePaymentPath', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });
  async function loadPolicyGate(threshold: string) {
    vi.resetModules();
    vi.stubEnv('PAYMENT_INSTANT_MAX_USDC', threshold);
    const { resolvePaymentPath } = await import('./policy-gate.js');
    return resolvePaymentPath;
  }

  it('routes below threshold to B-fast', async () => {
    const resolvePaymentPath = await loadPolicyGate('10000000');
    expect(resolvePaymentPath(9_999_999n)).toBe('B-fast');
    expect(resolvePaymentPath(0n + 1n)).toBe('B-fast');
  });

  it('routes at or above threshold to B-timelock', async () => {
    const resolvePaymentPath = await loadPolicyGate('10000000');
    expect(resolvePaymentPath(10_000_000n)).toBe('B-timelock');
    expect(resolvePaymentPath(50_000_000n)).toBe('B-timelock');
  });
});
