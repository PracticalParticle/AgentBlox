import { useCallback, useEffect, useState } from 'react';
import { fetchTreasuryStatus, type TreasuryStatusResponse } from '../lib/treasury-api';

const POLL_MS = 30_000;

export function useTreasuryStatus(enabled = true) {
  const [status, setStatus] = useState<TreasuryStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      setError(null);
      const data = await fetchTreasuryStatus();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load treasury status');
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

  return { status, loading, error, refresh };
}
