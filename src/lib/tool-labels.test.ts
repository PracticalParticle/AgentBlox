import { describe, expect, it } from 'vitest';
import { getToolDisplayName, getToolTier } from './tool-labels';

describe('tool-labels', () => {
  it('maps known tools to display names and tiers', () => {
    expect(getToolDisplayName('get_treasury_status')).toBe('Treasury status');
    expect(getToolTier('propose_rebalance')).toBe('propose');
    expect(getToolTier('simulate_policy_violation')).toBe('validate');
  });
});
