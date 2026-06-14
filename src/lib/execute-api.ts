import type { SerializedMetaTransaction } from './meta-tx-types';

export type ExecuteResponse =
  | { ok: true; hash: string; signerAddress?: string }
  | { ok: false; reason: string };

export async function executeRebalance(
  signedMetaTx: SerializedMetaTransaction,
): Promise<ExecuteResponse> {
  const res = await fetch('/api/execute/rebalance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signedMetaTx }),
  });

  const data = (await res.json()) as ExecuteResponse;
  if (!res.ok && 'reason' in data) {
    return data;
  }
  if (!res.ok) {
    return { ok: false, reason: `Execute failed (${res.status})` };
  }
  return data;
}

export async function executeInstantPayment(
  signedMetaTx: SerializedMetaTransaction,
): Promise<ExecuteResponse> {
  const res = await fetch('/api/execute/payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signedMetaTx }),
  });

  const data = (await res.json()) as ExecuteResponse;
  if (!res.ok && 'reason' in data) {
    return data;
  }
  if (!res.ok) {
    return { ok: false, reason: `Execute payment failed (${res.status})` };
  }
  return data;
}

export async function approveTimelockPayment(txId: string): Promise<ExecuteResponse> {
  const res = await fetch('/api/execute/payment-approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ txId }),
  });

  const data = (await res.json()) as ExecuteResponse;
  if (!res.ok && 'reason' in data) {
    return data;
  }
  if (!res.ok) {
    return { ok: false, reason: `Payment approve failed (${res.status})` };
  }
  return data;
}
