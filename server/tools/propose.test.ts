import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requestVendorPaymentOnChain } = vi.hoisted(() => ({
  requestVendorPaymentOnChain: vi.fn(),
}));

vi.mock('../execution/payment.js', () => ({
  requestVendorPaymentOnChain,
}));

vi.mock('../config.js', () => ({
  isTreasuryConfigured: () => true,
  TREASURY_ADDRESS: '0xA6568F40d89E5c72E8142339Ff85Ad6E308925F3',
  AGENT_POLICY: { allowedFlowIds: ['rebalance-sepolia-v1'] },
  SEPOLIA_USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
}));

vi.mock('../clients.js', () => ({
  sepoliaClient: { getBalance: vi.fn().mockResolvedValue(0n) },
}));

vi.mock('../lifi/compose.js', () => ({
  composeRebalanceFlow: vi.fn(),
}));

vi.mock('../signing/meta-tx.js', () => ({
  signRebalanceMetaTransaction: vi.fn(),
}));

import { requestVendorPayment } from './propose.js';

describe('requestVendorPayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects invalid recipient addresses', async () => {
    const result = await requestVendorPayment({
      recipient: 'not-an-address',
      amountUsdc: '500000',
    });

    expect(result.status).toBe('rejected');
    expect(result.request).toBeNull();
    expect(requestVendorPaymentOnChain).not.toHaveBeenCalled();
  });

  it('rejects non-numeric amountUsdc', async () => {
    const result = await requestVendorPayment({
      recipient: '0x0000000000000000000000000000000000000001',
      amountUsdc: 'abc',
    });

    expect(result.status).toBe('rejected');
    expect(result.request).toBeNull();
  });

  it('returns requested_unsigned when on-chain submit is not configured', async () => {
    requestVendorPaymentOnChain.mockResolvedValue({
      ok: false,
      code: 'MISSING_ANALYST_KEY',
      reason: 'Set ANALYST_PRIVATE_KEY',
    });

    const result = await requestVendorPayment({
      recipient: '0x0000000000000000000000000000000000000001',
      amountUsdc: '500000',
      memo: 'Test',
    });

    expect(result.status).toBe('requested_unsigned');
    expect(result.request?.onChain.status).toBe('not_configured');
    expect(result.request?.status).toBe('awaiting_configuration');
    expect(result.request?.nextSteps).toContain('Set ANALYST_PRIVATE_KEY in .env');
  });

  it('returns requested_on_chain with txId when submit succeeds', async () => {
    requestVendorPaymentOnChain.mockResolvedValue({
      ok: true,
      txId: '9',
      hash: '0xpay',
      releaseTime: '1700000200',
      releaseTimeIso: '2023-11-14T22:13:20.000Z',
      requester: '0x1111111111111111111111111111111111111111',
    });

    const result = await requestVendorPayment({
      recipient: '0x0000000000000000000000000000000000000001',
      amountUsdc: '500000',
    });

    expect(result.status).toBe('requested_on_chain');
    expect(result.request?.onChain).toMatchObject({
      status: 'submitted',
      txId: '9',
      hash: '0xpay',
    });
    expect(result.request?.txRecordStatus).toBe('PENDING');
    expect(result.request?.status).toBe('awaiting_owner_approval');
  });
});
