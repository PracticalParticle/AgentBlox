import { useCallback, useEffect, useState } from 'react';
import { fetchPendingApprovals, type PendingApprovalsResponse } from '../lib/treasury-api';

const POLL_MS = 15_000;

export function usePendingApprovals(enabled = true) {
  const [data, setData] = useState<PendingApprovalsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      setError(null);
      const next = await fetchPendingApprovals();
      setData(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
    if (!enabled) return;
    const id = window.setInterval(() => void refresh(), POLL_MS);
    return () => window.clearInterval(id);
  }, [enabled, refresh]);

  return { data, loading, error, refresh };
}
