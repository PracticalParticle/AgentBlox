import { useCallback, useState } from 'react';
import {
  listBroadcasterWallets,
  verifyBroadcasterConnection,
  type BroadcasterVerifyResponse,
  type BroadcasterWalletsResponse,
} from '../lib/broadcaster-api';

export function useBroadcasterVerify() {
  const [verifyResult, setVerifyResult] = useState<BroadcasterVerifyResponse | null>(null);
  const [wallets, setWallets] = useState<BroadcasterWalletsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runVerify = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await verifyBroadcasterConnection();
      setVerifyResult(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verify failed';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWallets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listBroadcasterWallets();
      setWallets(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not list wallets';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { verifyResult, wallets, loading, error, runVerify, loadWallets };
}
