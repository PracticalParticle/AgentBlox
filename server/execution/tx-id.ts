import { keccak256, toBytes, type Hex } from 'viem';

const TRANSACTION_EVENT_SIGNATURE = keccak256(
  toBytes('TransactionEvent(uint256,bytes4,uint8,address,address,bytes32,bytes32)'),
) as Hex;

type ReceiptLike = {
  logs?: readonly { topics?: readonly Hex[] }[];
};

/** Decode txId from AccountBlox TransactionEvent logs (same pattern as Bloxchain sanity SDK). */
export function extractTxIdFromReceipt(receipt: ReceiptLike): bigint | null {
  if (!receipt.logs?.length) {
    return null;
  }

  for (const log of receipt.logs) {
    if (log.topics?.[0] === TRANSACTION_EVENT_SIGNATURE && log.topics.length >= 2) {
      return BigInt(log.topics[1]!);
    }
  }

  return null;
}
