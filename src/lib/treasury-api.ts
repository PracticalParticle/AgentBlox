export type TreasuryStatusResponse = {
  configured: boolean;
  message?: string;
  network?: string;
  address?: string;
  ensName?: string | null;
  ethBalance?: string;
  roles?: Record<string, unknown>;
  policy?: { engine: string; guard: string };
};

export type PendingApprovalsResponse = {
  pending: Array<{
    txId: string;
    releaseTime: string;
    releaseTimeIso: string | null;
    status: string;
    target: string;
    requester: string;
  }>;
  count?: number;
  message?: string;
  error?: string;
};

export async function fetchTreasuryStatus(): Promise<TreasuryStatusResponse> {
  const res = await fetch('/api/treasury/status');
  if (!res.ok) throw new Error(`Status fetch failed (${res.status})`);
  return res.json() as Promise<TreasuryStatusResponse>;
}

export async function fetchPendingApprovals(): Promise<PendingApprovalsResponse> {
  const res = await fetch('/api/treasury/pending');
  if (!res.ok) throw new Error(`Pending fetch failed (${res.status})`);
  return res.json() as Promise<PendingApprovalsResponse>;
}
