export type BroadcasterVerifyResponse = {
  ok: boolean;
  walletAddress: string | null;
  error?: string;
  status: {
    configured: boolean;
    environmentIdConfigured: boolean;
    apiTokenConfigured: boolean;
    walletAddressConfigured: boolean;
    walletAddress: string | null;
    onChainBroadcasters: string[];
    matchesOnChainBroadcaster: boolean | null;
    message: string;
  };
};

export type BroadcasterWalletsResponse = {
  ok: boolean;
  wallets: Array<{ address: string; name?: string }>;
  error?: string;
};

export async function verifyBroadcasterConnection(): Promise<BroadcasterVerifyResponse> {
  const res = await fetch('/api/broadcaster/verify');
  if (!res.ok) {
    throw new Error(`Broadcaster verify failed (${res.status})`);
  }
  return res.json() as Promise<BroadcasterVerifyResponse>;
}

export async function listBroadcasterWallets(): Promise<BroadcasterWalletsResponse> {
  const res = await fetch('/api/broadcaster/wallets');
  if (!res.ok) {
    throw new Error(`Broadcaster wallets failed (${res.status})`);
  }
  return res.json() as Promise<BroadcasterWalletsResponse>;
}
