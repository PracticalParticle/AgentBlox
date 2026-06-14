import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  signPaymentTimelockApproveMetaTransaction,
  submitTimelockApproveWithBroadcaster,
  deserializeMetaTransaction,
} = vi.hoisted(() => ({
  signPaymentTimelockApproveMetaTransaction: vi.fn(),
  submitTimelockApproveWithBroadcaster: vi.fn(),
  deserializeMetaTransaction: vi.fn(),
}));

vi.mock('../signing/payment-meta-tx.js', () => ({
  signPaymentTimelockApproveMetaTransaction,
}));

vi.mock('./meta-tx-broadcaster.js', () => ({
  submitTimelockApproveWithBroadcaster,
}));

vi.mock('../signing/serialize.js', () => ({
  deserializeMetaTransaction,
}));

import { approveTimelockPaymentOnChain } from './payment-approve.js';

describe('approveTimelockPaymentOnChain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('signs with ANALYST and submits via Broadcaster', async () => {
    signPaymentTimelockApproveMetaTransaction.mockResolvedValue({
      ok: true,
      signedMetaTx: { txRecord: {}, params: {}, message: '0x', signature: '0x', data: '0x' },
      signerAddress: '0xbC9A7dc5f68a8F3629DC8D2a4D2605e2371a5700',
      intent: {},
    });
    deserializeMetaTransaction.mockReturnValue({
      params: { signer: '0xbC9A7dc5f68a8F3629DC8D2a4D2605e2371a5700' },
    });
    submitTimelockApproveWithBroadcaster.mockResolvedValue({ ok: true, hash: '0xabc' });

    const result = await approveTimelockPaymentOnChain({ txId: 7n });

    expect(signPaymentTimelockApproveMetaTransaction).toHaveBeenCalledWith({ txId: 7n });
    expect(submitTimelockApproveWithBroadcaster).toHaveBeenCalledOnce();
    expect(result).toEqual({
      ok: true,
      hash: '0xabc',
      signerAddress: '0xbC9A7dc5f68a8F3629DC8D2a4D2605e2371a5700',
    });
  });

  it('returns error when signing fails', async () => {
    signPaymentTimelockApproveMetaTransaction.mockResolvedValue({
      ok: false,
      code: 'MISSING_ANALYST_KEY',
      reason: 'Set ANALYST_PRIVATE_KEY',
    });

    const result = await approveTimelockPaymentOnChain({ txId: 1n });
    expect(result).toEqual({
      ok: false,
      reason: 'Set ANALYST_PRIVATE_KEY',
      code: 'MISSING_ANALYST_KEY',
    });
    expect(submitTimelockApproveWithBroadcaster).not.toHaveBeenCalled();
  });
});
