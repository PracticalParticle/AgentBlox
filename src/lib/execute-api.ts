import type { SerializedMetaTransaction } from './meta-tx-types';

export type ExecuteRebalanceResponse =
  | { ok: true; hash: string }
  | { ok: false; reason: string };

export async function executeRebalance(
  signedMetaTx: SerializedMetaTransaction,
): Promise<ExecuteRebalanceResponse> {
  const res = await fetch('/api/execute/rebalance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signedMetaTx }),
  });

  const data = (await res.json()) as ExecuteRebalanceResponse;
  if (!res.ok && 'reason' in data) {
    return data;
  }
  if (!res.ok) {
    return { ok: false, reason: `Execute failed (${res.status})` };
  }
  return data;
}
