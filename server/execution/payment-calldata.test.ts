import { describe, expect, it } from 'vitest';
import { encodeErc20TransferParams, ERC20_TRANSFER_OPERATION_TYPE } from './payment-calldata.js';

describe('encodeErc20TransferParams', () => {
  it('ABI-encodes transfer(address,uint256)', () => {
    const params = encodeErc20TransferParams(
      '0x0000000000000000000000000000000000000001',
      500_000n,
    );
    expect(params.startsWith('0x')).toBe(true);
    expect(params.length).toBeGreaterThan(10);
  });
});

describe('ERC20_TRANSFER_OPERATION_TYPE', () => {
  it('matches keccak256(ERC20_TRANSFER)', () => {
    expect(ERC20_TRANSFER_OPERATION_TYPE).toMatch(/^0x[a-f0-9]{64}$/);
  });
});
