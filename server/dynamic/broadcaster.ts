import type { WalletMetadata } from '@dynamic-labs-wallet/node';
import type { Address, WalletClient } from 'viem';
import { sepolia } from 'viem/chains';
import { readTreasuryRoles } from '../bloxchain.js';
import {
  BROADCASTER_WALLET_ADDRESS,
  DYNAMIC_API_TOKEN,
  isDynamicBroadcasterConfigured,
  isDynamicEnvironmentConfigured,
  isTreasuryConfigured,
  SEPOLIA_RPC_URL,
} from '../config.js';
import { getDynamicClient } from './client.js';

async function resolveBroadcasterWalletMetadata(): Promise<WalletMetadata> {
  const dynamicClient = await getDynamicClient();
  const wallets = await dynamicClient.getEvmWallets();
  const match = wallets.find(
    (wallet) => wallet.accountAddress.toLowerCase() === BROADCASTER_WALLET_ADDRESS.toLowerCase(),
  );

  if (!match) {
    throw new Error(
      `Dynamic has no server wallet for ${BROADCASTER_WALLET_ADDRESS}. List wallets in the Dynamic dashboard or create one via createWalletAccount.`,
    );
  }

  return match as WalletMetadata;
}

export type BroadcasterStatus = {
  configured: boolean;
  environmentIdConfigured: boolean;
  apiTokenConfigured: boolean;
  walletAddressConfigured: boolean;
  walletAddress: Address | null;
  onChainBroadcasters: Address[];
  matchesOnChainBroadcaster: boolean | null;
  message: string;
};

export async function getBroadcasterStatus(): Promise<BroadcasterStatus> {
  const environmentIdConfigured = isDynamicEnvironmentConfigured();
  const apiTokenConfigured = DYNAMIC_API_TOKEN.length > 0;
  const walletAddressConfigured =
    BROADCASTER_WALLET_ADDRESS.startsWith('0x') && BROADCASTER_WALLET_ADDRESS.length === 42;
  const configured = isDynamicBroadcasterConfigured();

  let onChainBroadcasters: Address[] = [];
  let matchesOnChainBroadcaster: boolean | null = null;

  if (isTreasuryConfigured()) {
    try {
      const roles = await readTreasuryRoles();
      onChainBroadcasters = roles.broadcasters;
      if (walletAddressConfigured) {
        matchesOnChainBroadcaster = onChainBroadcasters.some(
          (addr) => addr.toLowerCase() === BROADCASTER_WALLET_ADDRESS.toLowerCase(),
        );
      }
    } catch {
      onChainBroadcasters = [];
    }
  }

  let message = 'Broadcaster ready for Phase 3 execution.';
  if (!environmentIdConfigured) {
    message = 'Set VITE_DYNAMIC_ENVIRONMENT_ID for Dynamic (browser + server).';
  } else if (!apiTokenConfigured) {
    message = 'Set DYNAMIC_API_TOKEN (Dynamic dashboard API token, server only).';
  } else if (!walletAddressConfigured) {
    message = 'Set BROADCASTER_WALLET_ADDRESS to your Dynamic server wallet address.';
  } else if (matchesOnChainBroadcaster === false) {
    message =
      'BROADCASTER_WALLET_ADDRESS does not match on-chain Broadcaster — update provisioning or env.';
  }

  return {
    configured,
    environmentIdConfigured,
    apiTokenConfigured,
    walletAddressConfigured,
    walletAddress: walletAddressConfigured ? BROADCASTER_WALLET_ADDRESS : null,
    onChainBroadcasters,
    matchesOnChainBroadcaster,
    message,
  };
}

export async function getBroadcasterWalletClient(): Promise<WalletClient> {
  if (!isDynamicBroadcasterConfigured()) {
    throw new Error('Dynamic Broadcaster is not fully configured — see /api/health');
  }

  const dynamicClient = await getDynamicClient();
  const walletMetadata = await resolveBroadcasterWalletMetadata();
  return dynamicClient.getWalletClient({
    walletMetadata,
    chain: sepolia,
    rpcUrl: SEPOLIA_RPC_URL,
  });
}

/** Lightweight connectivity check — authenticates and returns configured wallet address. */
export async function verifyBroadcasterConnection(): Promise<{
  ok: boolean;
  walletAddress: Address;
  error?: string;
}> {
  try {
    await getDynamicClient();
    const walletClient = await getBroadcasterWalletClient();
    const accounts = await walletClient.getAddresses();
    return {
      ok: true,
      walletAddress: accounts[0] ?? BROADCASTER_WALLET_ADDRESS,
    };
  } catch (error) {
    return {
      ok: false,
      walletAddress: BROADCASTER_WALLET_ADDRESS,
      error: error instanceof Error ? error.message : 'Broadcaster verification failed',
    };
  }
}
