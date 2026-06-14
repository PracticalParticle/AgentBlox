import { useCallback, useEffect, useState } from 'react';

export type EnsTreasuryResult = {
  name?: string;
  normalized?: string;
  address?: string | null;
  textRecords?: {
    policyVersion?: string | null;
    allowedFlows?: string | null;
    app?: string | null;
  };
  parsedAllowedFlows?: string[];
  matchesConfiguredTreasury?: boolean | null;
  error?: string;
};

export function useEnsTreasury(ensName?: string | null) {
  const [data, setData] = useState<EnsTreasuryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!ensName?.trim()) {
      setData(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const query = ensName.trim();
      const response = await fetch(`/api/treasury/ens?name=${encodeURIComponent(query)}`);
      const json = (await response.json()) as EnsTreasuryResult;
      if (json.error) {
        setError(json.error);
        setData(json);
      } else {
        setData(json);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ENS lookup failed');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [ensName]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
};
