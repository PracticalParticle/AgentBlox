import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requestVendorPaymentOnChain, signPaymentInstantMetaTransaction } = vi.hoisted(() => ({
  requestVendorPaymentOnChain: vi.fn(),
  signPaymentInstantMetaTransaction: vi.fn(),
}));

vi.mock('../execution/payment.js', () => ({
  requestVendorPaymentOnChain,
}));

vi.mock('../signing/payment-meta-tx.js', () => ({
  signPaymentInstantMetaTransaction,
}));

vi.mock('../config.js', () => ({
  isTreasuryConfigured: () => true,
  TREASURY_ADDRESS: '0xA6568F40d89E5c72E8142339Ff85Ad6E308925F3',
  AGENT_POLICY: { allowedFlowIds: ['rebalance-sepolia-v1'] },
  SEPOLIA_USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  PAYMENT_INSTANT_MAX_USDC: 10_000_000n,
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

vi.mock('../ens.js', () => ({
  fetchEnsAllowedFlows: vi.fn().mockResolvedValue([]),
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
    expect(signPaymentInstantMetaTransaction).not.toHaveBeenCalled();
  });

  it('uses B-fast path below threshold', async () => {
    signPaymentInstantMetaTransaction.mockResolvedValue({
      ok: true,
      signedMetaTx: { txRecord: {}, params: {}, message: '0x', signature: '0x', data: '0x' },
      signerAddress: '0xApprover',
      intent: {
        target: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
        executionSelector: '0xa9059cbb',
        executionParams: '0x',
        operationType: '0xabc',
        gasLimit: 200_000n,
      },
    });

    const result = await requestVendorPayment({
      recipient: '0x0000000000000000000000000000000000000001',
      amountUsdc: '5000000',
    });

    expect(signPaymentInstantMetaTransaction).toHaveBeenCalledOnce();
    expect(requestVendorPaymentOnChain).not.toHaveBeenCalled();
    expect(result.status).toBe('proposed');
    expect(result.request?.paymentPath).toBe('B-fast');
    expect(result.request?.status).toBe('awaiting_confirmation');
  });

  it('uses B-timelock path at or above threshold', async () => {
    requestVendorPaymentOnChain.mockResolvedValue({
      ok: false,
      code: 'MISSING_ANALYST_KEY',
      reason: 'Set ANALYST_PRIVATE_KEY',
    });

    const result = await requestVendorPayment({
      recipient: '0x0000000000000000000000000000000000000001',
      amountUsdc: '10000000',
    });

    expect(requestVendorPaymentOnChain).toHaveBeenCalledOnce();
    expect(signPaymentInstantMetaTransaction).not.toHaveBeenCalled();
    expect(result.status).toBe('requested_unsigned');
    expect(result.request?.paymentPath).toBe('B-timelock');
  });

  it('returns requested_on_chain with txId when timelock submit succeeds', async () => {
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
      amountUsdc: '50000000',
    });

    expect(result.status).toBe('requested_on_chain');
    expect(result.request?.onChain).toMatchObject({
      status: 'submitted',
      txId: '9',
      hash: '0xpay',
    });
    expect(result.request?.status).toBe('awaiting_release');
  });
});
