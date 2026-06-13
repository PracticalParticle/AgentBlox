import { beforeEach, describe, expect, it, vi } from 'vitest';
import { keccak256, toBytes, type Hex } from 'viem';

const { isAnalystConfigured, executeWithTimeLock, getTransaction } = vi.hoisted(() => ({
  isAnalystConfigured: vi.fn(),
  executeWithTimeLock: vi.fn(),
  getTransaction: vi.fn(),
}));

vi.mock('@bloxchain/sdk', () => ({
  GuardController: class MockGuardController {
    executeWithTimeLock = executeWithTimeLock;
    getTransaction = getTransaction;
  },
}));

vi.mock('../bloxchain.js', () => ({
  createGuardController: vi.fn(() => ({
    getTransaction,
  })),
  sdkPublicClient: {},
  sdkSepolia: {},
}));

vi.mock('viem/accounts', () => ({
  privateKeyToAccount: () => ({
    address: '0x1111111111111111111111111111111111111111',
  }),
}));

vi.mock('viem', async (importOriginal) => {
  const actual = await importOriginal<typeof import('viem')>();
  return {
    ...actual,
    createWalletClient: () => ({}),
  };
});

vi.mock('../config.js', () => ({
  isAnalystConfigured,
  ANALYST_PRIVATE_KEY:
    '0x0123456789012345678901234567890123456789012345678901234567890',
  ERC20_TRANSFER_SELECTOR: '0xa9059cbb',
  SEPOLIA_RPC_URL: 'https://rpc.sepolia.org',
  SEPOLIA_USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  TREASURY_ADDRESS: '0xA6568F40d89E5c72E8142339Ff85Ad6E308925F3',
}));

import { requestVendorPaymentOnChain } from './payment.js';

const TRANSACTION_EVENT_SIGNATURE = keccak256(
  toBytes('TransactionEvent(uint256,bytes4,uint8,address,address,bytes32,bytes32)'),
) as Hex;

describe('requestVendorPaymentOnChain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns MISSING_ANALYST_KEY when analyst env is not configured', async () => {
    isAnalystConfigured.mockReturnValue(false);

    const result = await requestVendorPaymentOnChain({
      recipient: '0x0000000000000000000000000000000000000001',
      amount: 500_000n,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('MISSING_ANALYST_KEY');
    }
    expect(executeWithTimeLock).not.toHaveBeenCalled();
  });

  it('submits executeWithTimeLock and returns txId on success', async () => {
    isAnalystConfigured.mockReturnValue(true);

    executeWithTimeLock.mockResolvedValue({
      hash: '0xabc',
      wait: async () => ({
        status: 'success',
        logs: [
          {
            topics: [
              TRANSACTION_EVENT_SIGNATURE,
              '0x0000000000000000000000000000000000000000000000000000000000000007' as Hex,
            ],
          },
        ],
      }),
    });

    getTransaction.mockResolvedValue({
      releaseTime: 1_700_000_100n,
    });

    const result = await requestVendorPaymentOnChain({
      recipient: '0x0000000000000000000000000000000000000001',
      amount: 500_000n,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.txId).toBe('7');
      expect(result.hash).toBe('0xabc');
      expect(result.releaseTime).toBe('1700000100');
      expect(result.releaseTimeIso).toBe(new Date(1_700_000_100_000).toISOString());
    }

    expect(executeWithTimeLock).toHaveBeenCalledOnce();
    const [target, value, selector, , gasLimit, operationType] =
      executeWithTimeLock.mock.calls[0];
    expect(target).toBe('0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238');
    expect(value).toBe(0n);
    expect(selector).toBe('0xa9059cbb');
    expect(gasLimit).toBe(200_000n);
    expect(operationType).toMatch(/^0x[a-f0-9]{64}$/);
  });

  it('returns SUBMIT_FAILED when receipt reverts', async () => {
    isAnalystConfigured.mockReturnValue(true);

    executeWithTimeLock.mockResolvedValue({
      hash: '0xfail',
      wait: async () => ({ status: 'reverted', logs: [] }),
    });

    const result = await requestVendorPaymentOnChain({
      recipient: '0x0000000000000000000000000000000000000001',
      amount: 1n,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('SUBMIT_FAILED');
      expect(result.reason).toContain('0xfail');
    }
  });

  it('returns SUBMIT_FAILED when txId cannot be decoded from logs', async () => {
    isAnalystConfigured.mockReturnValue(true);

    executeWithTimeLock.mockResolvedValue({
      hash: '0xnolog',
      wait: async () => ({ status: 'success', logs: [] }),
    });

    const result = await requestVendorPaymentOnChain({
      recipient: '0x0000000000000000000000000000000000000001',
      amount: 1n,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('SUBMIT_FAILED');
      expect(result.reason).toContain('txId could not be read');
    }
  });
});
