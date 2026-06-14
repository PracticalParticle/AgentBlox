import { describe, expect, it } from 'vitest';
import { parseEnsAllowedFlows } from './ens.js';
import { validateFlowId } from './policy-gate.js';

describe('parseEnsAllowedFlows', () => {
  it('parses comma-separated flow IDs', () => {
    expect(parseEnsAllowedFlows('rebalance-sepolia-v1,vendor-pay-sepolia-v1')).toEqual([
      'rebalance-sepolia-v1',
      'vendor-pay-sepolia-v1',
    ]);
  });

  it('returns empty for blank input', () => {
    expect(parseEnsAllowedFlows(null)).toEqual([]);
    expect(parseEnsAllowedFlows('  ')).toEqual([]);
  });
});

describe('validateFlowId with ENS', () => {
  it('allows flow in server floor when ENS list is empty', () => {
    const result = validateFlowId('rebalance-sepolia-v1', []);
    expect(result.allowed).toBe(true);
  });

  it('allows flow present in ENS list', () => {
    const result = validateFlowId('rebalance-sepolia-v1', ['rebalance-sepolia-v1']);
    expect(result.allowed).toBe(true);
  });

  it('rejects flow not in ENS list when ENS flows are set', () => {
    const result = validateFlowId('rebalance-sepolia-v1', ['vendor-pay-sepolia-v1']);
    expect(result.allowed).toBe(false);
    expect(result.code).toBe('FLOW_NOT_IN_ENS');
  });
});
