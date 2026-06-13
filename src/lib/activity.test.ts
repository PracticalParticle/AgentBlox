import { describe, expect, it } from 'vitest';
import { extractSessionApprovals } from './activity';

describe('extractSessionApprovals', () => {
  it('collects proposed rebalances and payments from tool blocks', () => {
    const items = extractSessionApprovals([
      {
        tool: 'propose_rebalance',
        result: { status: 'proposed', proposal: { fromAmount: '1000000' } },
      },
      {
        tool: 'request_vendor_payment',
        result: {
          status: 'requested_on_chain',
          request: { amountUsdc: '500000' },
        },
      },
    ]);

    expect(items).toHaveLength(2);
    expect(items[0].tool).toBe('request_vendor_payment');
    expect(items[1].tool).toBe('propose_rebalance');
  });
});
