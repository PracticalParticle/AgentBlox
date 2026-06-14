import { describe, expect, it, vi } from 'vitest';
import type { MetaTransaction } from '@bloxchain/sdk';

const { submitRequestAndApproveWithBroadcaster } = vi.hoisted(() => ({
  submitRequestAndApproveWithBroadcaster: vi.fn(),
}));

vi.mock('./meta-tx-broadcaster.js', () => ({
  submitRequestAndApproveWithBroadcaster,
}));

import { executeRebalanceWithBroadcaster } from './rebalance.js';

const signedMetaTx = {} as MetaTransaction;

describe('executeRebalanceWithBroadcaster', () => {
  it('delegates to submitRequestAndApproveWithBroadcaster', async () => {
    submitRequestAndApproveWithBroadcaster.mockResolvedValue({ ok: true, hash: '0x1' });

    const result = await executeRebalanceWithBroadcaster(signedMetaTx);
    expect(submitRequestAndApproveWithBroadcaster).toHaveBeenCalledWith(signedMetaTx);
    expect(result).toEqual({ ok: true, hash: '0x1' });
  });
});
