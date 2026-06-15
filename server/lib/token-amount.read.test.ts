import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Address } from 'viem';
import { TokenDecimalsReadError, clearTokenDecimalsCacheForTests, readErc20Decimals } from './token-amount.js';

const readContract = vi.hoisted(() => vi.fn());

vi.mock('../clients.js', () => ({
  sepoliaClient: {
    readContract,
  },
}));

describe('readErc20Decimals', () => {
  const token = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as Address;

  beforeEach(() => {
    readContract.mockReset();
    clearTokenDecimalsCacheForTests();
  });

  it('reads decimals from chain', async () => {
    readContract.mockResolvedValue(6);
    await expect(readErc20Decimals(token)).resolves.toBe(6);
  });

  it('throws when decimals() call fails', async () => {
    readContract.mockRejectedValue(new Error('RPC down'));
    await expect(readErc20Decimals(token)).rejects.toBeInstanceOf(TokenDecimalsReadError);
  });

  it('throws when decimals() returns an invalid value', async () => {
    readContract.mockResolvedValue(255);
    await expect(readErc20Decimals(token)).rejects.toBeInstanceOf(TokenDecimalsReadError);
  });
});
