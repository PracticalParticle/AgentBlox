import { keccak256, toBytes, type Hex } from 'viem';
import { describe, expect, it } from 'vitest';
import { extractTxIdFromReceipt } from './tx-id.js';

const TRANSACTION_EVENT_SIGNATURE = keccak256(
  toBytes('TransactionEvent(uint256,bytes4,uint8,address,address,bytes32,bytes32)'),
) as Hex;

describe('extractTxIdFromReceipt', () => {
  it('returns null when receipt has no logs', () => {
    expect(extractTxIdFromReceipt({})).toBeNull();
    expect(extractTxIdFromReceipt({ logs: [] })).toBeNull();
  });

  it('decodes txId from TransactionEvent topic', () => {
    const txIdTopic = '0x000000000000000000000000000000000000000000000000000000000000002a' as Hex;
    const receipt = {
      logs: [
        {
          topics: [TRANSACTION_EVENT_SIGNATURE, txIdTopic],
        },
      ],
    };
    expect(extractTxIdFromReceipt(receipt)).toBe(42n);
  });

  it('ignores unrelated log topics', () => {
    const receipt = {
      logs: [
        {
          topics: ['0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef' as Hex],
        },
      ],
    };
    expect(extractTxIdFromReceipt(receipt)).toBeNull();
  });
});
