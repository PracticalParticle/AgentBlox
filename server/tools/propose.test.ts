import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requestVendorPaymentOnChain, signPaymentInstantMetaTransaction, preflightRequestAndApproveExecution } =
  vi.hoisted(() => ({
    requestVendorPaymentOnChain: vi.fn(),
    signPaymentInstantMetaTransaction: vi.fn(),
    preflightRequestAndApproveExecution: vi.fn(),
  }));

const readTreasuryRoles = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    owner: '0x1111111111111111111111111111111111111111',
    broadcasters: [],
    recovery: '0x0000000000000000000000000000000000000000',
    timeLockPeriodSec: '60',
    initialized: true,
  }),
);

vi.mock('../execution/payment.js', () => ({
  requestVendorPaymentOnChain,
}));

vi.mock('../execution/preflight-meta-tx.js', () => ({
  preflightRequestAndApproveExecution,
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

vi.mock('../bloxchain.js', () => ({
  readTreasuryRoles,
}));

vi.mock('../lib/token-amount.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/token-amount.js')>();
  return {
    ...actual,
    getPaymentTokenDecimals: vi.fn().mockResolvedValue(6),
    buildPaymentAmountDisplay: vi.fn((baseUnits: bigint, decimals: number, symbol: string) => ({
      amountBaseUnits: baseUnits.toString(),
      tokenDecimals: decimals,
      displayAmount: (Number(baseUnits) / 10 ** decimals).toString(),
      displayLabel: `$${Number(baseUnits) / 10 ** decimals} ${symbol}`,
    })),
  };
});

import { getPaymentTokenDecimals } from '../lib/token-amount.js';
import { requestVendorPayment } from './propose.js';
import { PAY_RECIPIENT_TREASURY_OWNER } from '../chat/pay-command.js';

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

  it('resolves treasury owner for slash /pay recipient sentinel', async () => {
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
    preflightRequestAndApproveExecution.mockResolvedValue({ ok: true });

    const result = await requestVendorPayment({
      recipient: PAY_RECIPIENT_TREASURY_OWNER,
      amountDollars: '5',
    });

    expect(readTreasuryRoles).toHaveBeenCalledOnce();
    expect(signPaymentInstantMetaTransaction).toHaveBeenCalledWith({
      recipient: '0x1111111111111111111111111111111111111111',
      amount: 5_000_000n,
    });
    expect(result.request?.recipient).toBe('0x1111111111111111111111111111111111111111');
  });

  it('rejects payments when on-chain decimals cannot be read', async () => {
    vi.mocked(getPaymentTokenDecimals).mockRejectedValueOnce(
      new Error('ERC-20 decimals() call failed'),
    );

    const result = await requestVendorPayment({
      recipient: '0x0000000000000000000000000000000000000001',
      amountUsdc: '5000000',
    });

    expect(result.status).toBe('rejected');
    expect(result.policy).toMatchObject({ code: 'TOKEN_DECIMALS_UNAVAILABLE' });
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
    preflightRequestAndApproveExecution.mockResolvedValue({ ok: true });

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
