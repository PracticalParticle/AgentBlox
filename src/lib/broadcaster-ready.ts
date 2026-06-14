import type { ServerHealth } from '../hooks/useServerHealth';

export function isBroadcasterReady(health: ServerHealth | null | undefined): boolean {
  if (!health?.dynamicBroadcasterConfigured) {
    return false;
  }
  return health.broadcaster?.matchesOnChainBroadcaster !== false;
}

export function broadcasterNotReadyMessage(health: ServerHealth | null | undefined): string {
  if (!health?.dynamicBroadcasterConfigured) {
    return (
      health?.broadcaster?.message ??
      'Dynamic Broadcaster not configured — set DYNAMIC_API_TOKEN and BROADCASTER_WALLET_ADDRESS in .env.'
    );
  }
  if (health.broadcaster?.matchesOnChainBroadcaster === false) {
    return 'Broadcaster wallet does not match on-chain Broadcaster role — update treasury or see Setup.';
  }
  return 'Broadcaster not ready.';
}

export function broadcasterWalletAddress(health: ServerHealth | null | undefined): string | null {
  return health?.broadcaster?.walletAddress ?? null;
}
