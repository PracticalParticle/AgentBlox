import { describe, expect, it } from 'vitest';
import {
  validateFlowId,
  validateRebalanceAmount,
  validateTreasuryConfigured,
  validateUnauthorizedTarget,
} from './policy-gate.js';

describe('validateFlowId', () => {
  it('allows configured demo flow', () => {
    const result = validateFlowId('rebalance-sepolia-v1');
    expect(result.allowed).toBe(true);
  });

  it('rejects unknown flow ids', () => {
    const result = validateFlowId('drain-everything-v9');
    expect(result.allowed).toBe(false);
    expect(result.code).toBe('FLOW_NOT_ALLOWED');
  });
});

describe('validateRebalanceAmount', () => {
  it('rejects zero and negative amounts', () => {
    expect(validateRebalanceAmount(0n).allowed).toBe(false);
    expect(validateRebalanceAmount(-1n).allowed).toBe(false);
  });

  it('allows positive amounts', () => {
    expect(validateRebalanceAmount(1_000_000n).allowed).toBe(true);
  });
});

describe('validateUnauthorizedTarget', () => {
  it('always blocks with TargetNotWhitelisted code', () => {
    const result = validateUnauthorizedTarget('0x000000000000000000000000000000000000dEaD');
    expect(result.allowed).toBe(false);
    expect(result.code).toBe('TARGET_NOT_WHITELISTED');
    expect(result.reason).toContain('TargetNotWhitelisted');
  });
});

describe('validateTreasuryConfigured', () => {
  it('requires treasury to be configured', () => {
    expect(validateTreasuryConfigured(false).code).toBe('TREASURY_NOT_CONFIGURED');
    expect(validateTreasuryConfigured(true).allowed).toBe(true);
  });
});
