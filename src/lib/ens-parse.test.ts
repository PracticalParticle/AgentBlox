import { describe, expect, it } from 'vitest';
import { parseEnsAllowedFlows } from './ens-parse';

describe('parseEnsAllowedFlows', () => {
  it('parses comma-separated flow ids', () => {
    expect(parseEnsAllowedFlows('rebalance-sepolia-v1,pay-vendor-v1')).toEqual([
      'rebalance-sepolia-v1',
      'pay-vendor-v1',
    ]);
  });

  it('returns empty for blank input', () => {
    expect(parseEnsAllowedFlows('')).toEqual([]);
    expect(parseEnsAllowedFlows(undefined)).toEqual([]);
  });
});
