import { useEffect, useState } from 'react';

export type ServerHealth = {
  status: string;
  service: string;
  llmEnabled: boolean;
  treasuryConfigured: boolean;
  mode: string;
};

export function useServerHealth() {
  const [health, setHealth] = useState<ServerHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth(null))
      .finally(() => setLoading(false));
  }, []);

  return { health, loading };
}
