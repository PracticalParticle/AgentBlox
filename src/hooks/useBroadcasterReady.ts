import {
  broadcasterNotReadyMessage,
  broadcasterWalletAddress,
  isBroadcasterReady,
} from '../lib/broadcaster-ready';
import { useServerHealth } from './useServerHealth';

export function useBroadcasterReady() {
  const { health, loading } = useServerHealth();

  return {
    health,
    loading,
    ready: isBroadcasterReady(health),
    notReadyMessage: broadcasterNotReadyMessage(health),
    walletAddress: broadcasterWalletAddress(health),
  };
}
